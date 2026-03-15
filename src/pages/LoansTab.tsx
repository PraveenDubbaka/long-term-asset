import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Upload, FileSearch, Edit3, Trash2, ListFilter, Tag, Check, X, Download, ArrowLeft, Paperclip, FileText } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fmtCurrency, fmtPct, fmtDateDisplay, exportToExcel, buildLoanRegisterExport } from '../lib/utils';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import { Modal, Input, Select, Textarea, Tooltip } from '../components/ui';
import type { Loan, LoanType, LoanStatus, InterestType, Currency, DayCountBasis, PaymentType } from '../types';
import toast from 'react-hot-toast';

const LOAN_TYPES: { value: string; label: string }[] = [
  { value: 'Term', label: 'Term Loan' },
  { value: 'LOC', label: 'Line of Credit' },
  { value: 'Revolver', label: 'Revolver' },
  { value: 'Mortgage', label: 'Mortgage' },
  { value: 'Bridge', label: 'Bridge Loan' },
];

const defaultLoan: Partial<Loan> = {
  type: 'Term', currency: 'CAD', interestType: 'Fixed', dayCountBasis: 'ACT/365',
  paymentFrequency: 'Monthly', paymentType: 'P&I', status: 'Active',
  glPrincipalAccount: '2100', glAccruedInterestAccount: '2300', glInterestExpenseAccount: '7100',
  covenantIds: [], attachments: [], currentPortion: 0, longTermPortion: 0, accruedInterest: 0,
  originalPrincipal: 0, currentBalance: 0, rate: 0,
};

function statusBadge(s: LoanStatus) {
  return s === 'Active'
    ? <Badge variant="success">Active</Badge>
    : s === 'Closed'
    ? <Badge variant="outline">Closed</Badge>
    : s === 'Replaced'
    ? <Badge variant="info">Replaced</Badge>
    : <Badge variant="warning">Refinanced</Badge>;
}

function typeBadge(t: LoanType) {
  return <Badge variant="outline">{t}</Badge>;
}

export function LoansTab() {
  const { loans, addLoan, updateLoan, deleteLoan } = useStore(s => ({
    loans: s.loans,
    addLoan: s.addLoan,
    updateLoan: s.updateLoan,
    deleteLoan: s.deleteLoan,
  }));

  const [editLoan, setEditLoan] = useState<Loan | null>(null);
  const [viewLoan, setViewLoan] = useState<Loan | null>(null);
  const [inlineEdit, setInlineEdit] = useState<string | null>(null);
  const [inlineVals, setInlineVals] = useState<Partial<Loan>>({});
  const [pageView, setPageView] = useState<'list' | 'add'>('list');
  const [addTab, setAddTab] = useState<'import' | 'ocr' | 'manual'>('import');
  const [attachDrawerLoan, setAttachDrawerLoan] = useState<Loan | null>(null);
  const [sessionFiles, setSessionFiles] = useState<Record<string, { id: string; name: string; size: number; addedAt: string }[]>>({});
  const attachFileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Partial<Loan>>(defaultLoan);
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  // Live FX rates (CAD base): fetched once on mount, user can override per-loan via inline edit
  const [liveRates, setLiveRates] = useState<Record<string, number>>({ USD: 1.3530, EUR: 1.4720, GBP: 1.7100 });
  const [ratesLoading, setRatesLoading] = useState(true);
  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/CAD')
      .then(r => r.json())
      .then(d => {
        if (d?.rates) {
          setLiveRates({
            USD: +(1 / d.rates.USD).toFixed(4),
            EUR: +(1 / d.rates.EUR).toFixed(4),
            GBP: +(1 / d.rates.GBP).toFixed(4),
          });
        }
      })
      .catch(() => {/* keep defaults */})
      .finally(() => setRatesLoading(false));
  }, []);

  const getFxRate = (l: Loan) => {
    if (l.currency === 'CAD') return 1;
    return l.fxRateToCAD ?? liveRates[l.currency] ?? 1;
  };

  const calcMonthlyPayment = (l: Loan): number | null => {
    if (l.monthlyPayment != null && l.monthlyPayment > 0) return l.monthlyPayment;
    if (!l.currentBalance || l.currentBalance <= 0) return null;
    const monthlyRate = l.rate / 100 / 12;
    if (l.paymentType === 'Interest-only' || l.paymentType === 'Balloon') {
      return l.currentBalance * monthlyRate;
    }
    // P&I: standard PMT using remaining months to maturity
    const today = new Date();
    const maturity = new Date(l.maturityDate);
    const months = Math.max(1, Math.round((maturity.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
    if (monthlyRate === 0) return l.currentBalance / months;
    return l.currentBalance * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  };

  const [filters, setFilters] = useState({
    refNumber: '', name: '', lender: '', type: '',
    currency: '', status: '', paymentType: '', maturityDate: '',
    glCodes: [] as string[],
  });
  type StrFilters = Omit<typeof filters, 'glCodes'>;
  const setFilter = (k: keyof StrFilters, v: string) => setFilters(f => ({ ...f, [k]: v }));
  const clearFilters = () => setFilters({ refNumber: '', name: '', lender: '', type: '', currency: '', status: '', paymentType: '', maturityDate: '', glCodes: [] });
  const activeFilterCount = [
    filters.refNumber, filters.name, filters.lender, filters.type,
    filters.currency, filters.status, filters.paymentType, filters.maturityDate,
  ].filter(Boolean).length + (filters.glCodes.length > 0 ? 1 : 0);

  const uniqueGLCodes = [...new Set(loans.map(l => l.glPrincipalAccount).filter((c): c is string => Boolean(c)))].sort();

  const filteredLoans = loans.filter(l => {
    if (filters.refNumber && !l.refNumber.toLowerCase().includes(filters.refNumber.toLowerCase())) return false;
    if (filters.name && !l.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
    if (filters.lender && !l.lender.toLowerCase().includes(filters.lender.toLowerCase())) return false;
    if (filters.type && l.type !== filters.type) return false;
    if (filters.currency && l.currency !== filters.currency) return false;
    if (filters.status && l.status !== filters.status) return false;
    if (filters.paymentType && l.paymentType !== filters.paymentType) return false;
    if (filters.maturityDate && !(l.maturityDate ?? '').includes(filters.maturityDate)) return false;
    if (filters.glCodes.length > 0 && !filters.glCodes.includes(l.glPrincipalAccount ?? '')) return false;
    return true;
  });

  const openAdd = () => { setForm(defaultLoan); setAddTab('import'); setPageView('add'); };
  const openEdit = (loan: Loan) => { setEditLoan(loan); setForm({ ...loan }); };

  const startInlineEdit = (l: Loan) => { setInlineEdit(l.id); setInlineVals({ ...l }); };
  const saveInlineEdit  = () => {
    if (!inlineEdit) return;
    updateLoan(inlineEdit, inlineVals);
    toast.success('Loan updated');
    setInlineEdit(null);
  };
  const cancelInlineEdit = () => setInlineEdit(null);

  const handleExport = async () => {
    await exportToExcel({ 'Loan Register': buildLoanRegisterExport(filteredLoans) }, 'Loan_Register.xlsx');
    toast.success(`Exported ${filteredLoans.length} loan${filteredLoans.length !== 1 ? 's' : ''}`);
  };

  // Shared inline input / select class
  const IIC = 'h-7 w-full min-w-0 px-1.5 text-sm border border-border rounded bg-background focus:outline-none focus:border-primary/40 focus:ring-0';
  const iv = (f: keyof Loan) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setInlineVals(v => ({ ...v, [f]: e.target.value }));
  const ivNum = (f: keyof Loan) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setInlineVals(v => ({ ...v, [f]: parseFloat(e.target.value) || 0 }));
  const ivSel = (f: keyof Loan) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setInlineVals(v => ({ ...v, [f]: e.target.value }));

  const handleSave = () => {
    if (!form.name || !form.lender) { toast.error('Name and lender are required'); return; }
    if (editLoan) {
      updateLoan(editLoan.id, form);
      toast.success('Loan updated');
      setEditLoan(null);
    } else {
      const newLoan: Loan = {
        ...defaultLoan,
        ...form,
        id: `loan-${Date.now()}`,
        refNumber: form.refNumber || '',
      } as Loan;
      addLoan(newLoan);
      toast.success('Loan added');
      setPageView('list');
    }
  };

  const handleDelete = (loan: Loan) => {
    if (confirm(`Delete ${loan.name}? This cannot be undone.`)) {
      deleteLoan(loan.id);
      toast.success('Loan deleted');
    }
  };

  const handleAttachFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!attachDrawerLoan || !e.target.files) return;
    const newFiles = Array.from(e.target.files).map(f => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: f.name,
      size: f.size,
      addedAt: new Date().toISOString().slice(0, 10),
    }));
    setSessionFiles(prev => ({ ...prev, [attachDrawerLoan.id]: [...(prev[attachDrawerLoan.id] ?? []), ...newFiles] }));
    updateLoan(attachDrawerLoan.id, { attachments: [...attachDrawerLoan.attachments, ...newFiles.map(f => f.name)] });
    setAttachDrawerLoan(l => l ? { ...l, attachments: [...l.attachments, ...newFiles.map(f => f.name)] } : l);
    e.target.value = '';
    toast.success(`${newFiles.length} file${newFiles.length > 1 ? 's' : ''} added`);
  };

  const removeAttachment = (loanId: string, name: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;
    const updated = loan.attachments.filter(a => a !== name);
    updateLoan(loanId, { attachments: updated });
    setSessionFiles(prev => ({ ...prev, [loanId]: (prev[loanId] ?? []).filter(f => f.name !== name) }));
    setAttachDrawerLoan(l => l ? { ...l, attachments: updated } : l);
  };

  // ── GL Account Summary (computed from filteredLoans, live) ────────────────
  const usdToCAD = 1.3530;
  const toGL = (l: Loan, field: keyof Loan) =>
    (l[field] as number) * (l.currency === 'USD' ? usdToCAD : 1);

  const glGroups = filteredLoans.reduce<Record<string, Loan[]>>((acc, l) => {
    const code = l.glPrincipalAccount || '(untagged)';
    if (!acc[code]) acc[code] = [];
    acc[code].push(l);
    return acc;
  }, {});

  const glRows = Object.entries(glGroups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, ls]) => ({
      code,
      count:         ls.length,
      totalOriginal: ls.reduce((s, l) => s + toGL(l, 'originalPrincipal'), 0),
      totalBalance:  ls.reduce((s, l) => s + toGL(l, 'currentBalance'),    0),
      totalCurrent:  ls.reduce((s, l) => s + toGL(l, 'currentPortion'),    0),
      totalLT:       ls.reduce((s, l) => s + toGL(l, 'longTermPortion'),   0),
      totalAccrued:  ls.reduce((s, l) => s + toGL(l, 'accruedInterest'),   0),
    }));

  const glGrand = glRows.reduce(
    (a, r) => ({
      count:         a.count         + r.count,
      totalOriginal: a.totalOriginal + r.totalOriginal,
      totalBalance:  a.totalBalance  + r.totalBalance,
      totalCurrent:  a.totalCurrent  + r.totalCurrent,
      totalLT:       a.totalLT       + r.totalLT,
      totalAccrued:  a.totalAccrued  + r.totalAccrued,
    }),
    { count: 0, totalOriginal: 0, totalBalance: 0, totalCurrent: 0, totalLT: 0, totalAccrued: 0 }
  );
  const glBalanced = Math.abs((glGrand.totalCurrent + glGrand.totalLT) - glGrand.totalBalance) < 1;
  const totalMonthlyPayment = filteredLoans.reduce((s, l) => {
    const pmt = calcMonthlyPayment(l);
    return s + (pmt !== null ? pmt * getFxRate(l) : 0);
  }, 0);

  return (
    <div className="flex flex-col">
      {pageView === 'list' && (<>
      {/* Section Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Loan Register</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeFilterCount > 0
              ? <>{filteredLoans.length} of {loans.length} loans · <span className="text-primary">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span> · <button onClick={clearFilters} className="text-primary hover:underline">Clear</button></>
              : 'Manage facilities, terms, and GL mappings'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 mr-1" /> Export
          </Button>
          <Button variant="default" size="sm" onClick={openAdd}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Loan
          </Button>
        </div>
      </div>

      {/* Loan Table */}
      <div className="px-6">
        <StyledCard className="overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 192px)', minHeight: '260px' }}>
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-muted border-b border-border">
                  <th className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-1 group/th">Loan Name
                      <FilterPopover value={filters.name} onChange={v => setFilter('name', v)} placeholder="Loan name…" isOpen={openFilter === 'name'} onToggle={() => setOpenFilter(p => p === 'name' ? null : 'name')} onClose={() => setOpenFilter(null)} />
                    </div>
                  </th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-1 group/th">Lender
                      <FilterPopover value={filters.lender} onChange={v => setFilter('lender', v)} placeholder="Lender name…" isOpen={openFilter === 'lender'} onToggle={() => setOpenFilter(p => p === 'lender' ? null : 'lender')} onClose={() => setOpenFilter(null)} />
                    </div>
                  </th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Int. Rate</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Rate Type</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Mo. Payment</th>
                  <th className="hidden xl:table-cell text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Start</th>
                  <th className="hidden lg:table-cell text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-1 group/th">Maturity
                      <FilterPopover value={filters.maturityDate} onChange={v => setFilter('maturityDate', v)} placeholder="e.g. 2026" isOpen={openFilter === 'maturityDate'} onToggle={() => setOpenFilter(p => p === 'maturityDate' ? null : 'maturityDate')} onClose={() => setOpenFilter(null)} />
                    </div>
                  </th>
                  <th className="hidden xl:table-cell text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Current Collateral</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-1 group/th">Type
                      <FilterPopover value={filters.type} onChange={v => setFilter('type', v)} type="select" options={[{value:'',label:'All Types'},{value:'Term',label:'Term'},{value:'LOC',label:'LOC'},{value:'Revolver',label:'Revolver'},{value:'Mortgage',label:'Mortgage'},{value:'Bridge',label:'Bridge'}]} isOpen={openFilter === 'type'} onToggle={() => setOpenFilter(p => p === 'type' ? null : 'type')} onClose={() => setOpenFilter(null)} />
                    </div>
                  </th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-1 group/th">CCY
                      <FilterPopover value={filters.currency} onChange={v => setFilter('currency', v)} type="select" options={[{value:'',label:'All'},{value:'CAD',label:'CAD'},{value:'USD',label:'USD'},{value:'EUR',label:'EUR'},{value:'GBP',label:'GBP'}]} isOpen={openFilter === 'currency'} onToggle={() => setOpenFilter(p => p === 'currency' ? null : 'currency')} onClose={() => setOpenFilter(null)} />
                    </div>
                  </th>
                  <th className="hidden xl:table-cell text-right px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Orig. Loan Amt</th>
                  <th className="hidden xl:table-cell text-right px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">
                    <span title="FX rate to CAD (editable per loan)">FX Rate{ratesLoading && <span className="ml-1 text-muted-foreground/50">…</span>}</span>
                  </th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Bal. Loan Amt</th>
                  <th className="hidden xl:table-cell text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-1 group/th">GL Principal
                      <FilterPopover
                        type="multicheck"
                        multiValues={filters.glCodes}
                        onMultiChange={v => setFilters(f => ({ ...f, glCodes: v }))}
                        options={uniqueGLCodes.map(c => ({ value: c, label: c }))}
                        isOpen={openFilter === 'glPrincipalAccount'}
                        onToggle={() => setOpenFilter(p => p === 'glPrincipalAccount' ? null : 'glPrincipalAccount')}
                        onClose={() => setOpenFilter(null)}
                      />
                    </div>
                  </th>
                  <th className="hidden xl:table-cell text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Day Count</th>
                  <th className="hidden xl:table-cell text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-1 group/th">Payment Type
                      <FilterPopover value={filters.paymentType} onChange={v => setFilter('paymentType', v)} type="select" options={[{value:'',label:'All'},{value:'P&I',label:'P&I'},{value:'Interest-only',label:'Interest-only'},{value:'Balloon',label:'Balloon'}]} isOpen={openFilter === 'paymentType'} onToggle={() => setOpenFilter(p => p === 'paymentType' ? null : 'paymentType')} onClose={() => setOpenFilter(null)} />
                    </div>
                  </th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-1 group/th">Status
                      <FilterPopover value={filters.status} onChange={v => setFilter('status', v)} type="select" options={[{value:'',label:'All Statuses'},{value:'Active',label:'Active'},{value:'Closed',label:'Closed'},{value:'Replaced',label:'Replaced'},{value:'Refinanced',label:'Refinanced'}]} isOpen={openFilter === 'status'} onToggle={() => setOpenFilter(p => p === 'status' ? null : 'status')} onClose={() => setOpenFilter(null)} align="right" />
                    </div>
                  </th>
                  <th className="px-3 py-3 w-10 text-center" title="Attachments"><Paperclip className="w-3.5 h-3.5 text-muted-foreground mx-auto" /></th>
                  <th className="px-3 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.length === 0 && (
                  <tr>
                    <td colSpan={19} className="px-3 py-10 text-center text-sm text-muted-foreground">
                      No loans match the current filters.{' '}
                      <button onClick={clearFilters} className="text-primary hover:underline">Clear filters</button>
                    </td>
                  </tr>
                )}
                {filteredLoans.map(l => {
                  const ie = inlineEdit === l.id;
                  return (
                  <tr
                    key={l.id}
                    className={[
                      'border-b border-border transition-colors',
                      ie ? 'bg-primary/[0.03] ring-1 ring-inset ring-primary/20' : 'hover:bg-muted/30 cursor-pointer',
                    ].join(' ')}
                    onClick={() => { if (!ie) setViewLoan(l); }}
                  >
                    {/* Loan Name */}
                    <td className="px-3 py-1.5 min-w-[120px] max-w-[180px]">
                      {ie
                        ? <input className={IIC} value={inlineVals.name ?? ''} onChange={iv('name')} onClick={e => e.stopPropagation()} />
                        : <span className="font-medium text-foreground break-words leading-tight">{l.name}</span>}
                    </td>
                    {/* Lender */}
                    <td className="px-3 py-1.5 min-w-[100px] max-w-[150px]">
                      {ie
                        ? <input className={IIC} value={inlineVals.lender ?? ''} onChange={iv('lender')} onClick={e => e.stopPropagation()} />
                        : <span className="text-muted-foreground break-words leading-tight block">{l.lender}</span>}
                    </td>
                    {/* Int. Rate */}
                    <td className="px-3 py-1.5">
                      {ie
                        ? <input type="number" step="0.01" className="h-7 w-20 px-1.5 text-sm text-right border border-border rounded bg-background focus:outline-none focus:border-primary/40" value={inlineVals.rate ?? ''} onChange={ivNum('rate')} onClick={e => e.stopPropagation()} />
                        : <span className="tabular-nums text-foreground whitespace-nowrap float-right">{fmtPct(l.rate)}</span>}
                    </td>
                    {/* Rate Type */}
                    <td className="px-3 py-1.5">
                      {ie
                        ? <select className={`${IIC} cursor-pointer`} value={inlineVals.interestType ?? 'Fixed'} onChange={e => setInlineVals(v => ({ ...v, interestType: e.target.value as InterestType }))} onClick={e => e.stopPropagation()}>
                            <option value="Fixed">Fixed</option>
                            <option value="Variable">Variable</option>
                          </select>
                        : l.interestType === 'Variable'
                          ? <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">Variable</span>
                          : <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border whitespace-nowrap">Fixed</span>}
                    </td>
                    {/* Mo. Payment */}
                    <td className="px-3 py-1.5 text-right">
                      {(() => {
                        const pmt = calcMonthlyPayment(l);
                        return pmt !== null
                          ? <span className="tabular-nums font-mono text-sm text-foreground whitespace-nowrap">{fmtCurrency(pmt, l.currency)}</span>
                          : <span className="text-muted-foreground/50 text-xs">—</span>;
                      })()}
                    </td>
                    {/* Start Date */}
                    <td className="hidden xl:table-cell px-3 py-1.5">
                      {ie
                        ? <input type="date" className={IIC} value={inlineVals.startDate ?? ''} onChange={iv('startDate')} onClick={e => e.stopPropagation()} />
                        : <span className="tabular-nums text-muted-foreground whitespace-nowrap">{l.startDate || '—'}</span>}
                    </td>
                    {/* Maturity */}
                    <td className="hidden lg:table-cell px-3 py-1.5">
                      {ie
                        ? <input type="date" className={IIC} value={inlineVals.maturityDate ?? ''} onChange={iv('maturityDate')} onClick={e => e.stopPropagation()} />
                        : <span className="tabular-nums text-muted-foreground whitespace-nowrap">{l.maturityDate}</span>}
                    </td>
                    {/* Current Collateral */}
                    <td className="hidden xl:table-cell px-3 py-1.5 max-w-[180px]">
                      <span className="text-muted-foreground text-xs leading-tight line-clamp-2">{l.securityDescription || '—'}</span>
                    </td>
                    {/* Type */}
                    <td className="px-3 py-1.5">
                      {ie
                        ? <select className={`${IIC} cursor-pointer`} value={inlineVals.type ?? l.type} onChange={e => setInlineVals(v => ({ ...v, type: e.target.value as LoanType }))} onClick={e => e.stopPropagation()}>
                            <option value="Term">Term</option>
                            <option value="LOC">LOC</option>
                            <option value="Revolver">Revolver</option>
                            <option value="Mortgage">Mortgage</option>
                            <option value="Bridge">Bridge</option>
                          </select>
                        : typeBadge(l.type)}
                    </td>
                    {/* Currency */}
                    <td className="px-3 py-1.5">
                      {ie
                        ? <select className={`${IIC} cursor-pointer`} value={inlineVals.currency ?? l.currency} onChange={e => setInlineVals(v => ({ ...v, currency: e.target.value as Currency }))} onClick={e => e.stopPropagation()}>
                            <option value="CAD">CAD</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                          </select>
                        : <Badge variant="outline">{l.currency}</Badge>}
                    </td>
                    {/* Original */}
                    <td className="hidden xl:table-cell px-3 py-1.5">
                      {ie
                        ? <input type="number" className={`${IIC} text-right`} value={inlineVals.originalPrincipal ?? ''} onChange={ivNum('originalPrincipal')} onClick={e => e.stopPropagation()} />
                        : <span className="tabular-nums text-muted-foreground whitespace-nowrap float-right">{fmtCurrency(l.originalPrincipal, 'CAD')}</span>}
                    </td>
                    {/* FX Rate */}
                    <td className="hidden xl:table-cell px-3 py-1.5 text-right" onClick={e => e.stopPropagation()}>
                      {l.currency === 'CAD'
                        ? <span className="text-muted-foreground/50 text-xs tabular-nums">—</span>
                        : ie
                          ? <div className="flex flex-col items-end gap-0.5">
                              <span className="text-xs text-muted-foreground/60">{l.currency}/CAD</span>
                              <input
                                type="number" step="0.0001" min="0.0001"
                                className={`${IIC} text-right w-24`}
                                value={inlineVals.fxRateToCAD ?? getFxRate(l)}
                                onChange={e => setInlineVals(v => ({ ...v, fxRateToCAD: parseFloat(e.target.value) || getFxRate(l) }))}
                              />
                            </div>
                          : <div className="flex flex-col items-end">
                              <span className="text-xs text-muted-foreground/60">{l.currency}/CAD</span>
                              <span className="tabular-nums font-mono text-sm">{getFxRate(l).toFixed(4)}</span>
                            </div>}
                    </td>
                    {/* Balance */}
                    <td className="px-3 py-1.5">
                      {ie
                        ? <input type="number" className={`${IIC} text-right`} value={inlineVals.currentBalance ?? ''} onChange={ivNum('currentBalance')} onClick={e => e.stopPropagation()} />
                        : <span className="tabular-nums font-semibold text-foreground whitespace-nowrap float-right">{fmtCurrency(l.currentBalance, l.currency)}</span>}
                    </td>
                    {/* GL Principal */}
                    <td className="hidden xl:table-cell px-3 py-1.5">
                      {ie
                        ? <input className={`${IIC} font-mono`} value={inlineVals.glPrincipalAccount ?? ''} onChange={iv('glPrincipalAccount')} onClick={e => e.stopPropagation()} />
                        : <span className="text-muted-foreground whitespace-nowrap">{l.glPrincipalAccount}</span>}
                    </td>
                    {/* Day Count */}
                    <td className="hidden xl:table-cell px-3 py-1.5">
                      {ie
                        ? <select className={`${IIC} cursor-pointer font-mono`} value={inlineVals.dayCountBasis ?? l.dayCountBasis} onChange={e => setInlineVals(v => ({ ...v, dayCountBasis: e.target.value as DayCountBasis }))} onClick={e => e.stopPropagation()}>
                            <option value="ACT/365">ACT/365</option>
                            <option value="ACT/360">ACT/360</option>
                            <option value="30/360">30/360</option>
                          </select>
                        : <span className="text-muted-foreground whitespace-nowrap font-mono">{l.dayCountBasis}</span>}
                    </td>
                    {/* Payment Type */}
                    <td className="hidden xl:table-cell px-3 py-1.5">
                      {ie
                        ? <select className={`${IIC} cursor-pointer`} value={inlineVals.paymentType ?? l.paymentType} onChange={e => setInlineVals(v => ({ ...v, paymentType: e.target.value as PaymentType }))} onClick={e => e.stopPropagation()}>
                            <option value="P&I">P&amp;I</option>
                            <option value="Interest-only">Interest-only</option>
                            <option value="Balloon">Balloon</option>
                          </select>
                        : <span className="text-muted-foreground whitespace-nowrap">{l.paymentType}</span>}
                    </td>
                    {/* Status */}
                    <td className="px-3 py-1.5">
                      {ie
                        ? <select className={`${IIC} cursor-pointer`} value={inlineVals.status ?? l.status} onChange={e => setInlineVals(v => ({ ...v, status: e.target.value as LoanStatus }))} onClick={e => e.stopPropagation()}>
                            <option value="Active">Active</option>
                            <option value="Closed">Closed</option>
                            <option value="Replaced">Replaced</option>
                            <option value="Refinanced">Refinanced</option>
                          </select>
                        : statusBadge(l.status)}
                    </td>
                    {/* Attachments */}
                    <td className="px-3 py-1.5 text-center w-10" onClick={e => e.stopPropagation()}>
                      {(() => {
                        const count = l.attachments.length;
                        return (
                          <button
                            onClick={e => { e.stopPropagation(); setAttachDrawerLoan(l); }}
                            title={count > 0 ? `${count} attachment${count !== 1 ? 's' : ''}` : 'Add attachments'}
                            className="relative p-1.5 hover:bg-muted rounded-lg transition-colors group"
                          >
                            <Paperclip className={`w-3.5 h-3.5 ${count > 0 ? 'text-primary' : 'text-muted-foreground/30 group-hover:text-muted-foreground'}`} />
                            {count > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-primary text-white text-[9px] font-bold px-0.5 leading-none">
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })()}
                    </td>
                    {/* Actions */}
                    <td className="px-3 py-1.5 text-center w-16">
                      {ie
                        ? <div className="flex items-center gap-0.5 justify-center">
                            <button className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors" title="Save changes" onClick={e => { e.stopPropagation(); saveInlineEdit(); }}>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            </button>
                            <button className="p-1.5 hover:bg-muted rounded-lg transition-colors" title="Cancel edit" onClick={e => { e.stopPropagation(); cancelInlineEdit(); }}>
                              <X className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        : <div className="flex items-center gap-0.5 justify-center" onClick={e => e.stopPropagation()}>
                            <button className="p-1.5 hover:bg-muted rounded-lg transition-colors" title="Edit loan" onClick={() => startInlineEdit(l)}>
                              <Edit3 className="w-3.5 h-3.5 text-primary" />
                            </button>
                            <button className="p-1.5 hover:bg-muted rounded-lg transition-colors" title="Delete loan" onClick={() => handleDelete(l)}>
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </button>
                          </div>}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
              {filteredLoans.length > 0 && (
                <tfoot className="sticky bottom-0 z-10">
                  <tr className="bg-muted/50 border-t-2 border-border">
                    <td className="px-3 py-2 text-sm font-semibold text-foreground whitespace-nowrap" colSpan={4}>
                      Total &middot; {filteredLoans.length} {filteredLoans.length === 1 ? 'facility' : 'facilities'}
                      {activeFilterCount > 0 && (
                        <span className="text-muted-foreground font-normal ml-1.5">(filtered)</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-sm font-bold text-foreground whitespace-nowrap">
                      {fmtCurrency(totalMonthlyPayment, 'CAD')}
                    </td>
                    <td colSpan={5} />
                    <td className="hidden xl:table-cell px-3 py-2 text-right tabular-nums text-sm font-semibold text-muted-foreground whitespace-nowrap">
                      {fmtCurrency(glGrand.totalOriginal, 'CAD')}
                    </td>
                    <td className="hidden xl:table-cell px-3 py-2" />
                    <td className="px-3 py-2 text-right tabular-nums text-sm font-bold text-foreground whitespace-nowrap">
                      {fmtCurrency(glGrand.totalBalance, 'CAD')}
                    </td>
                    <td colSpan={6} className="px-3 py-2 text-right text-xs text-muted-foreground italic whitespace-nowrap">
                      CAD equiv. · all currencies
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </StyledCard>
      </div>

      {/* GL Account Summary */}
      {glRows.length > 0 && (
        <div className="px-6 pt-4 pb-6">
          <div className="bg-card text-card-foreground border border-border shadow-[0_2px_8px_hsl(213_40%_20%/0.06)] rounded-md overflow-hidden">

            {/* Header bar */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-muted/60 border-b border-border">
              <div className="flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-primary" />
                <span className="text-xs font-semibold text-foreground">GL Account Summary</span>
                <span className="text-xs text-muted-foreground ml-1">
                  — principal balance by account · CAD equiv. (USD × 1.353)
                </span>
              </div>
              {glBalanced
                ? <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">✓ Balances to GL</span>
                : <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">⚠ Balance check failed</span>
              }
            </div>

            {/* Table — matches main loans table style */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    {[
                      { label: 'GL Account',      cls: 'text-left'   },
                      { label: 'Facilities',       cls: 'text-center' },
                      { label: 'Original (CAD)',   cls: 'text-right'  },
                      { label: 'Balance (CAD)',    cls: 'text-right'  },
                      { label: 'Current Portion', cls: 'text-right'  },
                      { label: 'LT Portion',      cls: 'text-right'  },
                      { label: 'Accrued Interest',cls: 'text-right'  },
                    ].map(h => (
                      <th key={h.label} className={`${h.cls} px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap`}>
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {glRows.map(row => (
                    <tr key={row.code} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-1.5 font-mono font-semibold text-primary">{row.code}</td>
                      <td className="px-3 py-1.5 text-center text-muted-foreground">{row.count}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">{fmtCurrency(row.totalOriginal, 'CAD')}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-foreground">{fmtCurrency(row.totalBalance, 'CAD')}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-foreground">
                        {row.totalCurrent > 0 ? fmtCurrency(row.totalCurrent, 'CAD') : <span className="text-foreground/25">—</span>}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-foreground">
                        {row.totalLT > 0 ? fmtCurrency(row.totalLT, 'CAD') : <span className="text-foreground/25">—</span>}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-amber-700">
                        {row.totalAccrued > 0 ? fmtCurrency(row.totalAccrued, 'CAD') : <span className="text-foreground/25">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {/* Totals row */}
                  <tr className="bg-primary/5 border-t-2 border-primary/25">
                    <td className="px-3 py-2 font-bold text-foreground">Total</td>
                    <td className="px-3 py-2 text-center font-semibold text-foreground">{glGrand.count}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-muted-foreground">{fmtCurrency(glGrand.totalOriginal, 'CAD')}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-foreground">{fmtCurrency(glGrand.totalBalance, 'CAD')}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-foreground">
                      {glGrand.totalCurrent > 0 ? fmtCurrency(glGrand.totalCurrent, 'CAD') : '—'}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-foreground">
                      {glGrand.totalLT > 0 ? fmtCurrency(glGrand.totalLT, 'CAD') : '—'}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-amber-700">
                      {glGrand.totalAccrued > 0 ? fmtCurrency(glGrand.totalAccrued, 'CAD') : '—'}
                    </td>
                  </tr>
                  {/* Balance check row */}
                  <tr className="border-t border-dashed border-border/60">
                    <td colSpan={3} className="px-3 py-1.5 text-sm text-muted-foreground italic">
                      Check: Balance = Current Portion + LT Portion
                    </td>
                    <td className="px-3 py-1.5 text-right text-sm font-mono text-foreground/70">
                      {fmtCurrency(glGrand.totalBalance, 'CAD')}
                    </td>
                    <td colSpan={2} className="px-3 py-1.5 text-right text-sm font-mono text-foreground/70">
                      = {fmtCurrency(glGrand.totalCurrent + glGrand.totalLT, 'CAD')}
                    </td>
                    <td className="px-3 py-1.5 text-right text-sm font-semibold">
                      {glBalanced
                        ? <span className="text-emerald-600">✓ agrees</span>
                        : <span className="text-red-600">✗ variance</span>
                      }
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      </>)}

      {/* Attachments Drawer */}
      {attachDrawerLoan && ReactDOM.createPortal(
        <>
          <div className="fixed inset-0 bg-black/25 z-40" onClick={() => setAttachDrawerLoan(null)} />
          <div className="fixed right-0 top-0 h-full w-[380px] bg-background border-l border-border shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Attachments</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 ml-6">{attachDrawerLoan.name}</p>
              </div>
              <button onClick={() => setAttachDrawerLoan(null)} className="p-1.5 hover:bg-muted rounded-lg transition-colors mt-0.5">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            {/* File list */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {attachDrawerLoan.attachments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                    <Paperclip className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No attachments yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Upload supporting documents for this loan</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attachDrawerLoan.attachments.map((name, idx) => {
                    const meta = (sessionFiles[attachDrawerLoan.id] ?? []).find(f => f.name === name);
                    const ext = name.split('.').pop()?.toUpperCase() ?? 'FILE';
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors group">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {ext}{meta ? ` · ${(meta.size / 1024).toFixed(0)} KB · ${meta.addedAt}` : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => removeAttachment(attachDrawerLoan.id, name)}
                          className="p-1 hover:bg-destructive/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove attachment"
                        >
                          <X className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="px-5 py-4 border-t border-border flex-shrink-0">
              <input ref={attachFileInputRef} type="file" multiple hidden onChange={handleAttachFiles} />
              <button
                onClick={() => attachFileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-primary/40 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Document
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Add Loan Inline Page — tabbed */}
      {pageView === 'add' && (
        <div className="flex flex-col">
          {/* Header: breadcrumb + tab switcher */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <button onClick={() => setPageView('list')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Loans
              </button>
              <span className="text-foreground/30 mx-1">/</span>
              <span className="text-sm font-semibold text-foreground">Add Loan</span>
            </div>
            <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
              {([
                { id: 'import' as const, label: 'Import Excel',  icon: <Upload className="w-3 h-3" /> },
                { id: 'ocr'    as const, label: 'Add from OCR',  icon: <FileSearch className="w-3 h-3" /> },
                { id: 'manual' as const, label: 'Add Manually',  icon: <Plus className="w-3 h-3" /> },
              ]).map(t => (
                <button
                  key={t.id}
                  onClick={() => setAddTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    addTab === t.id
                      ? 'bg-background text-foreground shadow-sm border border-border'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>
          {/* Tab content */}
          {addTab === 'import' && <ImportWizardPage onBack={() => setPageView('list')} hideHeader />}
          {addTab === 'ocr' && (
            <OcrImportPage
              onBack={() => setPageView('list')}
              onImport={(loan) => { addLoan(loan); setPageView('list'); toast.success('Loan imported from OCR'); }}
              hideHeader
            />
          )}
          {addTab === 'manual' && (
            <div className="px-[25%] py-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 160px)' }}>
              <StyledCard>
                <div className="px-6 py-5">
                  <AddLoanFormContent form={form} setForm={setForm} />
                  <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
                    <Button variant="secondary" onClick={() => setPageView('list')}>Cancel</Button>
                    <Button variant="default" onClick={handleSave}><Plus className="w-3.5 h-3.5 mr-1" /> Add Loan</Button>
                  </div>
                </div>
              </StyledCard>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal (from row view → Edit button) */}
      <LoanFormModal
        open={!!editLoan}
        onClose={() => setEditLoan(null)}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        isEdit={!!editLoan}
      />

      {/* View Modal */}
      <LoanViewModal loan={viewLoan} onClose={() => setViewLoan(null)} onEdit={(l) => { setViewLoan(null); openEdit(l); }} />
    </div>
  );
}

// ─── FILTER POPOVER ───────────────────────────────────────────────────────────
type FPOption = { value: string; label: string };
function FilterPopover({
  value = '', onChange, type = 'text', options, placeholder,
  multiValues, onMultiChange,
  isOpen, onToggle, onClose, align = 'left',
}: {
  value?: string; onChange?: (v: string) => void;
  type?: 'text' | 'select' | 'multicheck'; options?: FPOption[]; placeholder?: string;
  multiValues?: string[]; onMultiChange?: (v: string[]) => void;
  isOpen: boolean; onToggle: () => void; onClose: () => void; align?: 'left' | 'right';
}) {
  const isActive = type === 'multicheck' ? (multiValues?.length ?? 0) > 0 : Boolean(value);
  const inputCls = "w-full text-xs px-2.5 py-1.5 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50";

  // Portal positioning — escapes overflow:hidden scroll containers
  const btnRef = useRef<HTMLButtonElement>(null);
  const [popPos, setPopPos] = useState<{ top: number; left?: number; right?: number }>({ top: 0 });
  useEffect(() => {
    if (isOpen && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPopPos(
        align === 'right'
          ? { top: r.bottom + 6, right: window.innerWidth - r.right }
          : { top: r.bottom + 6, left: r.left }
      );
    }
  }, [isOpen, align]);

  const toggleCode = (code: string, checked: boolean) => {
    const next = checked
      ? [...(multiValues ?? []), code]
      : (multiValues ?? []).filter(v => v !== code);
    onMultiChange?.(next);
  };

  const title = type === 'multicheck'
    ? (multiValues?.length ?? 0) > 0 ? `${multiValues!.length} selected` : 'Filter'
    : value ? `Filtering: "${value}"` : 'Filter';

  const popupStyle: React.CSSProperties = {
    position: 'fixed',
    top: popPos.top,
    ...(popPos.right !== undefined ? { right: popPos.right } : { left: popPos.left }),
  };

  const popupContent = isOpen ? ReactDOM.createPortal(
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div
        style={popupStyle}
        className="z-[70] bg-card border border-border rounded-lg shadow-[0_4px_24px_hsl(213_40%_20%/0.18)] p-2.5 min-w-[168px]"
        onClick={e => e.stopPropagation()}
      >
        {type === 'multicheck' && options ? (
          <div>
            {(multiValues?.length ?? 0) > 0 && (
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
                <span className="text-xs text-muted-foreground">{multiValues!.length} selected</span>
                <button onClick={() => onMultiChange?.([])} className="text-xs text-primary hover:underline">Clear all</button>
              </div>
            )}
            <div className="space-y-0.5">
              {options.map(o => {
                const checked = multiValues?.includes(o.value) ?? false;
                return (
                  <label key={o.value} className="flex items-center gap-2 px-1.5 py-1.5 rounded-md hover:bg-muted cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => toggleCode(o.value, e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-primary flex-shrink-0"
                    />
                    <span className="text-xs font-mono text-foreground">{o.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : type === 'select' ? (
          <select value={value} onChange={e => onChange?.(e.target.value)} className={inputCls} autoFocus>
            {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <input type="text" value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder ?? 'Filter…'} className={inputCls} autoFocus />
        )}
        {type !== 'multicheck' && value && (
          <button
            onClick={() => { onChange?.(''); onClose(); }}
            className="mt-1.5 text-xs text-muted-foreground hover:text-destructive w-full text-right transition-colors"
          >
            Clear ✕
          </button>
        )}
      </div>
    </>,
    document.body
  ) : null;

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`p-0.5 rounded transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground/30 group-hover/th:text-muted-foreground/60 hover:!text-muted-foreground'}`}
        title={title}
      >
        <ListFilter className="w-3 h-3" />
      </button>
      {popupContent}
    </div>
  );
}

// ─── LOAN SUMMARY CARD ────────────────────────────────────────────────────────
function LoanSummaryCard({ loan }: { loan: Loan }) {
  const covenants = useStore(s => s.covenants.filter(c => loan.covenantIds.includes(c.id)));
  return (
    <StyledCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{loan.name}</h3>
        <Badge variant="outline" className="text-xs">{loan.currency}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">{loan.lender} · {loan.refNumber}</p>
      <div className="space-y-1.5 text-sm">
        {[
          ['Current Portion', fmtCurrency(loan.currentPortion, loan.currency), false],
          ['Long-Term', fmtCurrency(loan.longTermPortion, loan.currency), false],
          ['Accrued Interest', fmtCurrency(loan.accruedInterest, loan.currency), true],
        ].map(([k, v, accent]) => (
          <div key={k as string} className="flex justify-between">
            <span className="text-muted-foreground">{k}</span>
            <span className={`tabular-nums font-medium ${accent ? 'text-primary' : 'text-foreground'}`}>{v}</span>
          </div>
        ))}
      </div>
      {covenants.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {covenants.map(c => (
            <Badge key={c.id} variant={c.status === 'Breached' ? 'destructive' : c.status === 'At Risk' ? 'warning' : 'outline'}>
              {c.name}
            </Badge>
          ))}
        </div>
      )}
    </StyledCard>
  );
}

// ─── LOAN FORM MODAL ──────────────────────────────────────────────────────────
function LoanFormModal({ open, onClose, form, setForm, onSave, isEdit }: {
  open: boolean; onClose: () => void;
  form: Partial<Loan>; setForm: (f: Partial<Loan>) => void;
  onSave: () => void; isEdit: boolean;
}) {
  const f = (field: keyof Loan) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value });
  const fn = (field: keyof Loan) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: parseFloat(e.target.value) || 0 });

  const computedMoPayment = (() => {
    const rate = parseFloat(String(form.rate)) || 0;
    const balance = parseFloat(String(form.originalPrincipal || form.currentBalance)) || 0;
    if (!rate || !balance) return '';
    const r = rate / 100 / 12;
    const payType = form.paymentType || 'P&I';
    if (payType === 'Interest-only' || payType === 'Balloon') return Math.round(balance * r).toString();
    const maturity = form.maturityDate;
    const today = new Date();
    const n = maturity ? Math.max(1, Math.round((new Date(maturity).getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44))) : 60;
    const pmt = r === 0 ? balance / n : balance * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(pmt).toString();
  })();

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Loan' : 'Add Loan'} subtitle="All amounts in loan currency" size="2xl"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="default" onClick={onSave}>{isEdit ? 'Save Changes' : 'Add Loan'}</Button></>}
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {/* Row 1: Loan Name + Lender */}
        <Input label="Loan Name *" value={form.name || ''} onChange={f('name')} placeholder="e.g. Term Loan A" />
        <Input label="Lender *" value={form.lender || ''} onChange={f('lender')} placeholder="e.g. Royal Bank of Canada" />
        {/* Row 2: Int. Rate + Mo. Payment preview */}
        <div className="col-span-2 grid grid-cols-3 gap-2">
          <Select label="Interest Type" value={form.interestType || 'Fixed'} onChange={f('interestType')} options={[
            { value: 'Fixed', label: 'Fixed Rate' }, { value: 'Variable', label: 'Variable Rate' },
          ]} />
          <Input label="Int. Rate (%)" type="number" value={form.rate || ''} onChange={fn('rate')} suffix="%" />
          <Input label="Mo. Payment" type="number" value={form.monthlyPayment ?? ''} onChange={fn('monthlyPayment')} prefix="$" placeholder={computedMoPayment || '0'} />
        </div>
        {form.interestType === 'Variable' && <>
          <Input label="Benchmark" value={form.benchmark || ''} onChange={f('benchmark')} placeholder="e.g. Prime, SOFR" />
          <Input label="Spread (%)" type="number" value={form.spread || ''} onChange={(e) => setForm({ ...form, spread: parseFloat(e.target.value) || 0 })} suffix="%" />
        </>}
        {/* Row 3: Start + Maturity (matches table cols 4 & 5) */}
        <Input label="Start Date" type="date" value={form.startDate || ''} onChange={f('startDate')} />
        <Input label="Maturity Date" type="date" value={form.maturityDate || ''} onChange={f('maturityDate')} />
        {/* Row 4: Current Collateral full-width (matches table col 6) */}
        <div className="col-span-2">
          <Textarea label="Current Collateral" value={form.securityDescription || ''} onChange={f('securityDescription')} rows={2} placeholder="Describe collateral and security arrangements..." />
        </div>
        {/* Row 5: Loan Type + CCY (matches table cols 7 & 8) */}
        <Select label="Loan Type" value={form.type || 'Term'} onChange={f('type')} options={LOAN_TYPES} />
        <Select label="Currency" value={form.currency || 'CAD'} onChange={f('currency')} options={[
          { value: 'CAD', label: 'CAD – Canadian Dollar' },
          { value: 'USD', label: 'USD – US Dollar' },
          { value: 'EUR', label: 'EUR – Euro' },
          { value: 'GBP', label: 'GBP – British Pound' },
        ]} />
        {/* Row 6: Orig. Loan Amt + Bal. Loan Amt (matches table cols 10 & 12) */}
        <Input label="Orig. Loan Amt" type="number" value={form.originalPrincipal || ''} onChange={fn('originalPrincipal')} prefix="$" />
        <Input label="Bal. Loan Amt" type="number" value={form.currentBalance || ''} onChange={fn('currentBalance')} prefix="$" />
        {/* Row 7: Status + Last Payment Date */}
        <Select label="Status" value={form.status || 'Active'} onChange={f('status')} options={[
          { value: 'Active', label: 'Active' }, { value: 'Closed', label: 'Closed' },
          { value: 'Replaced', label: 'Replaced' }, { value: 'Refinanced', label: 'Refinanced' },
        ]} />
        <Input label="Last Payment Date" type="date" value={form.lastPaymentDate || ''} onChange={f('lastPaymentDate')} />
        {/* Row 8: Day Count + Payment Frequency */}
        <Select label="Day Count Basis" value={form.dayCountBasis || 'ACT/365'} onChange={f('dayCountBasis')} options={[
          { value: 'ACT/365', label: 'ACT/365' }, { value: 'ACT/360', label: 'ACT/360' }, { value: '30/360', label: '30/360' },
        ]} />
        <Select label="Payment Frequency" value={form.paymentFrequency || 'Monthly'} onChange={f('paymentFrequency')} options={[
          { value: 'Monthly', label: 'Monthly' }, { value: 'Quarterly', label: 'Quarterly' },
          { value: 'Semi-annual', label: 'Semi-Annual' }, { value: 'Annual', label: 'Annual' },
        ]} />
        {/* Row 9: Payment Type */}
        <Select label="Payment Type" value={form.paymentType || 'P&I'} onChange={f('paymentType')} options={[
          { value: 'P&I', label: 'Principal & Interest' }, { value: 'Interest-only', label: 'Interest Only' }, { value: 'Balloon', label: 'Balloon' },
        ]} />
        <div />
        {/* GL Mappings */}
        <div className="col-span-2 border-t border-border pt-3 mt-1">
          <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-3">GL Mappings</div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="GL Principal" value={form.glPrincipalAccount || ''} onChange={f('glPrincipalAccount')} placeholder="e.g. 2100" />
            <Input label="GL Accrued Interest" value={form.glAccruedInterestAccount || ''} onChange={f('glAccruedInterestAccount')} placeholder="e.g. 2300" />
            <Input label="GL Interest Expense" value={form.glInterestExpenseAccount || ''} onChange={f('glInterestExpenseAccount')} placeholder="e.g. 7100" />
          </div>
        </div>
        <div className="col-span-2">
          <Textarea label="Notes" value={form.notes || ''} onChange={f('notes')} rows={2} placeholder="Additional notes..." />
        </div>
      </div>
    </Modal>
  );
}

// ─── LOAN VIEW MODAL ──────────────────────────────────────────────────────────
function LoanViewModal({ loan, onClose, onEdit }: { loan: Loan | null; onClose: () => void; onEdit: (l: Loan) => void }) {
  if (!loan) return null;
  return (
    <Modal open={!!loan} onClose={onClose} title={loan.name} subtitle={`${loan.lender} · ${loan.refNumber}`} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Close</Button><Button variant="default" onClick={() => onEdit(loan)}><Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Loan</Button></>}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Type', loan.type],
            ['Status', loan.status],
            ['Currency', loan.currency],
            ['Day Count', loan.dayCountBasis],
            ['Original Principal', fmtCurrency(loan.originalPrincipal, loan.currency)],
            ['Current Balance', fmtCurrency(loan.currentBalance, loan.currency)],
            ['Interest Rate', `${fmtPct(loan.rate)}${loan.interestType === 'Variable' ? ' (Variable)' : ' (Fixed)'}`],
            ['Payment', `${loan.paymentFrequency} – ${loan.paymentType}`],
            ['Start Date', fmtDateDisplay(loan.startDate)],
            ['Maturity', fmtDateDisplay(loan.maturityDate)],
            ['Current Portion', fmtCurrency(loan.currentPortion, loan.currency)],
            ['Long-Term Portion', fmtCurrency(loan.longTermPortion, loan.currency)],
            ['Accrued Interest', fmtCurrency(loan.accruedInterest, loan.currency)],
            ['GL Principal', loan.glPrincipalAccount],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-xs text-foreground/60 mb-0.5">{k}</div>
              <div className="font-medium text-foreground">{v}</div>
            </div>
          ))}
        </div>
        {loan.securityDescription && (
          <div className="pt-3 border-t border-border">
            <div className="text-xs text-foreground/60 mb-1">Security / Collateral</div>
            <p className="text-sm text-foreground">{loan.securityDescription}</p>
          </div>
        )}
        {loan.attachments.length > 0 && (
          <div className="pt-3 border-t border-border">
            <div className="text-xs text-foreground/60 mb-2">Attachments</div>
            <div className="flex flex-wrap gap-2">
              {loan.attachments.map(a => (
                <span key={a} className="text-xs px-2.5 py-1 bg-muted rounded-lg text-foreground cursor-pointer hover:bg-muted/80">{a}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── OCR IMPORT MODAL ─────────────────────────────────────────────────────────
const OCR_MOCK = {
  name: 'Equipment Loan B', lender: 'BDC', refNumber: 'BDC-2024-7812',
  type: 'Term' as const, currency: 'CAD' as const,
  originalPrincipal: 800_000, currentBalance: 800_000,
  rate: 7.20, interestType: 'Fixed' as const, dayCountBasis: 'ACT/365' as const,
  startDate: '2025-01-01', maturityDate: '2030-01-01',
  paymentFrequency: 'Monthly' as const, paymentType: 'P&I' as const,
  status: 'Active' as const,
  confidence: { name: 0.98, lender: 0.97, rate: 0.92, maturityDate: 0.78 },
};

function OCRImportModal({ open, onClose, onImport }: { open: boolean; onClose: () => void; onImport: (l: Loan) => void }) {
  const [step, setStep] = useState<'upload' | 'review' | 'confirm'>('upload');
  const [dragging, setDragging] = useState(false);
  const [fields, setFields] = useState({ ...OCR_MOCK });

  const handleImport = () => {
    onImport({
      ...defaultLoan,
      ...fields,
      id: `loan-ocr-${Date.now()}`,
      covenantIds: [], attachments: ['Uploaded_Agreement.pdf'],
      currentPortion: 0, longTermPortion: fields.currentBalance,
      accruedInterest: 0,
      glPrincipalAccount: '2100', glAccruedInterestAccount: '2300', glInterestExpenseAccount: '7100',
    } as Loan);
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Loan from Document" subtitle="OCR + AI extraction from loan agreement, renewal, or term sheet" size="xl"
      footer={
        step === 'upload' ? <><Button variant="secondary" onClick={onClose}>Cancel</Button></> :
        step === 'review' ? <><Button variant="secondary" onClick={() => setStep('upload')}>Back</Button><Button variant="default" onClick={() => setStep('confirm')}>Confirm Fields →</Button></> :
        <><Button variant="secondary" onClick={() => setStep('review')}>Back</Button><Button variant="default" onClick={handleImport}>Import Loan</Button></>
      }
    >
      {step === 'upload' && (
        <div
          onDrop={e => { e.preventDefault(); setDragging(false); setStep('review'); }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
          onClick={() => setStep('review')}
        >
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileSearch className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">Drop PDF / DOCX or click to browse</p>
          <p className="text-xs text-foreground/60">Loan agreements, renewal letters, term sheets</p>
          <Button variant="default" size="sm" className="mt-4" onClick={() => setStep('review')}>
            <Upload className="w-3.5 h-3.5 mr-1" /> Browse Files
          </Button>
        </div>
      )}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
            <span className="text-blue-500 mt-0.5 flex-shrink-0 text-sm">ℹ</span>
            <div>
              <p className="text-xs font-semibold text-blue-800 mb-0.5">OCR Extraction Complete</p>
              <p className="text-xs text-blue-700">4 fields extracted with high confidence. 1 field requires your review.</p>
            </div>
          </div>
          <div className="space-y-3">
            {([
              ['Loan Name', 'name', 'text'],
              ['Lender', 'lender', 'text'],
              ['Reference #', 'refNumber', 'text'],
              ['Annual Rate (%)', 'rate', 'number'],
              ['Maturity Date', 'maturityDate', 'date'],
            ] as [string, keyof typeof fields, string][]).map(([label, field, type]) => {
              const conf = (fields.confidence as Record<string, number>)[field];
              const isLow = conf !== undefined && conf < 0.90;
              return (
                <div key={field} className={`p-3 rounded-xl border ${isLow ? 'border-amber-300 bg-amber-50' : 'border-border bg-card'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground">{label}</span>
                    {conf !== undefined && (
                      <span className={`text-xs font-medium ${isLow ? 'text-amber-700' : 'text-green-600'}`}>
                        {isLow ? '⚠ ' : '✓ '}{(conf * 100).toFixed(0)}% confidence
                      </span>
                    )}
                  </div>
                  <input
                    type={type}
                    className="w-full text-sm px-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={(fields as Record<string, unknown>)[field] as string}
                    onChange={e => setFields({ ...fields, [field]: type === 'number' ? parseFloat(e.target.value) : e.target.value })}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
      {step === 'confirm' && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
            <span className="text-green-600 mt-0.5">✓</span>
            <p className="text-xs text-green-800 font-medium">All fields reviewed and confirmed.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[['Name', fields.name], ['Lender', fields.lender], ['Rate', `${fields.rate}%`], ['Maturity', fields.maturityDate], ['Principal', fmtCurrency(fields.originalPrincipal, 'CAD')]].map(([k, v]) => (
              <div key={k} className="bg-muted rounded-lg p-3">
                <div className="text-xs text-foreground/60 mb-0.5">{k}</div>
                <div className="font-semibold text-foreground">{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── IMPORT WIZARD ────────────────────────────────────────────────────────────
const WIZARD_STEPS = [
  { id: 'upload',  label: 'Upload'    },
  { id: 'map',     label: 'Map Cols'  },
  { id: 'gl',      label: 'GL Tags'   },
  { id: 'preview', label: 'Preview'   },
] as const;
type WizardStep = typeof WIZARD_STEPS[number]['id'];

const GL_FIELDS = [
  { key: 'principal',       label: 'Principal / LT Debt',   hint: 'Balance sheet – long-term liability',  placeholder: 'e.g. 2100' },
  { key: 'currentPortion',  label: 'Current Portion',        hint: 'Balance sheet – current liability',    placeholder: 'e.g. 2110' },
  { key: 'accruedInterest', label: 'Accrued Interest',       hint: 'Balance sheet – current accrual',      placeholder: 'e.g. 2200' },
  { key: 'interestExpense', label: 'Interest Expense',       hint: 'Income statement – finance cost',      placeholder: 'e.g. 7100' },
] as const;

const GL_OPTIONS: Record<string, { value: string; label: string }[]> = {
  principal:       [
    { value: '2100 – Long-Term Debt',                label: '2100 – Long-Term Debt' },
    { value: '2105 – Long-Term Debt (EUR)',           label: '2105 – Long-Term Debt (EUR)' },
    { value: '2110 – Current Portion LT Debt',       label: '2110 – Current Portion LT Debt' },
    { value: '2120 – Shareholder / Related-Party Debt', label: '2120 – Shareholder / Related-Party Debt' },
    { value: '2130 – Mortgage Payable',              label: '2130 – Mortgage Payable' },
    { value: '2200 – Line of Credit',                label: '2200 – Line of Credit' },
  ],
  currentPortion:  [
    { value: '2110 – Current Portion LT Debt',       label: '2110 – Current Portion LT Debt' },
    { value: '2115 – Current Portion (Mortgage)',    label: '2115 – Current Portion (Mortgage)' },
    { value: '2120 – Shareholder / Related-Party Debt', label: '2120 – Shareholder / Related-Party Debt' },
    { value: '2200 – Line of Credit',                label: '2200 – Line of Credit' },
  ],
  accruedInterest: [
    { value: '2200 – Accrued Interest Payable',      label: '2200 – Accrued Interest Payable' },
    { value: '2300 – Interest Payable',              label: '2300 – Interest Payable' },
    { value: '2310 – Accrued Finance Charges',       label: '2310 – Accrued Finance Charges' },
  ],
  interestExpense: [
    { value: '7100 – Interest Expense',              label: '7100 – Interest Expense' },
    { value: '7110 – Interest Expense (Variable)',   label: '7110 – Interest Expense (Variable)' },
    { value: '7120 – Finance Charges',               label: '7120 – Finance Charges' },
    { value: '7200 – Bank Charges & Interest',       label: '7200 – Bank Charges & Interest' },
  ],
};

function ImportWizardModal() {
  const { ui, setImportWizardOpen } = useStore(s => ({ ui: s.ui, setImportWizardOpen: s.setImportWizardOpen }));
  const [step, setStep] = useState<WizardStep>('upload');
  const [glTags, setGlTags] = useState({
    principal:       '2100 – Long-Term Debt',
    currentPortion:  '2110 – Current Portion LT Debt',
    accruedInterest: '2200 – Accrued Interest Payable',
    interestExpense: '7100 – Interest Expense',
  });

  const handleClose = () => { setImportWizardOpen(false); setStep('upload'); };

  // Preview data (represents parsed import rows)
  const PREV_LOANS = [
    { name: 'BDC Equipment Loan', lender: 'BDC',         principal: 800_000, rate: '7.20%', maturity: '2030-01-01' },
    { name: 'Shareholder Loan',   lender: 'Shareholder', principal: 250_000, rate: '3.00%', maturity: '2026-12-31' },
    { name: 'Vehicle Loan',       lender: 'Ford Credit', principal:  45_000, rate: '8.90%', maturity: '2027-06-30' },
  ];
  const dayMs   = 24 * 60 * 60 * 1000;
  const todayMs = Date.now();
  const ltLoans   = PREV_LOANS.filter(l => (new Date(l.maturity).getTime() - todayMs) >  365 * dayMs);
  const currLoans = PREV_LOANS.filter(l => (new Date(l.maturity).getTime() - todayMs) <= 365 * dayMs);
  const ltTotal   = ltLoans.reduce((s, l)   => s + l.principal, 0);
  const currTotal = currLoans.reduce((s, l) => s + l.principal, 0);
  const grandTotal = PREV_LOANS.reduce((s, l) => s + l.principal, 0);
  const glBreakdown = [
    { account: glTags.principal,       loans: ltLoans,   amount: ltTotal   },
    { account: glTags.currentPortion,  loans: currLoans, amount: currTotal },
    { account: glTags.accruedInterest, loans: [],        amount: 0         },
    { account: glTags.interestExpense, loans: [],        amount: 0         },
  ];

  if (!ui.importWizardOpen) return null;

  const stepIdx = WIZARD_STEPS.findIndex(s => s.id === step);

  return (
    <Modal
      open={ui.importWizardOpen}
      onClose={handleClose}
      title={`Import ${ui.importWizardType === 'loans' ? 'Loan Register' : ui.importWizardType === 'activity' ? 'Activity' : 'Continuity'}`}
      subtitle="Upload an Excel template with loan data"
      size="xl"
      footer={
        step === 'upload'  ? <Button variant="secondary" onClick={handleClose}>Cancel</Button> :
        step === 'map'     ? <><Button variant="secondary" onClick={() => setStep('upload')}>Back</Button><Button variant="default" onClick={() => setStep('gl')}>Next: GL Tags →</Button></> :
        step === 'gl'      ? <><Button variant="secondary" onClick={() => setStep('map')}>Back</Button><Button variant="default" onClick={() => setStep('preview')}>Preview →</Button></> :
        <><Button variant="secondary" onClick={() => setStep('gl')}>Back</Button><Button variant="default" onClick={() => { handleClose(); toast.success('Import complete'); }}>Import Records</Button></>
      }
    >
      <div className="space-y-4">

        {/* Step indicator */}
        <div className="flex items-center gap-0">
          {WIZARD_STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                  i < stepIdx  ? 'bg-primary text-primary-foreground' :
                  i === stepIdx ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium ${i === stepIdx ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
              </div>
              {i < WIZARD_STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${i < stepIdx ? 'bg-primary' : 'bg-border'}`} style={{ minWidth: 16 }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step: Upload */}
        {step === 'upload' && (
          <>
            <div
              className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-primary/50 hover:bg-muted/30 cursor-pointer transition-all"
              onClick={() => setStep('map')}
            >
              <Upload className="w-8 h-8 text-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Drop Excel file or click to browse</p>
              <p className="text-xs text-foreground/60 mt-1">.xlsx or .csv accepted</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground/60">
              <span>Need a template?</span>
              <button className="text-primary font-medium hover:underline">Download Import Template →</button>
            </div>
          </>
        )}

        {/* Step: Column mapping */}
        {step === 'map' && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-xs text-blue-800">Match your spreadsheet columns to the required fields below.</p>
            </div>
            {[['Loan Name', 'Column A'], ['Lender', 'Column B'], ['Reference #', 'Column C'], ['Original Principal', 'Column D'], ['Start Date', 'Column E'], ['Maturity Date', 'Column F'], ['Rate', 'Column G']].map(([field, col]) => (
              <div key={field} className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm font-medium text-foreground">{field}</span>
                <Select value={col} onChange={() => {}} options={['A','B','C','D','E','F','G','H'].map(c => ({ value: `Column ${c}`, label: `Column ${c}` }))} className="w-36" />
              </div>
            ))}
          </div>
        )}

        {/* Step: GL Tagging */}
        {step === 'gl' && (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <Tag className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Assign GL account codes for each field type. These will be applied to all imported loans and used for automated journal entry generation.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              {GL_FIELDS.map(({ key, label, hint }) => (
                <div key={key}>
                  <Select
                    label={label}
                    value={glTags[key]}
                    onChange={e => setGlTags(prev => ({ ...prev, [key]: e.target.value }))}
                    options={GL_OPTIONS[key] ?? []}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-xl bg-muted/60 border border-border">
              <p className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">Tip:</span> GL codes follow your chart of accounts. You can edit individual loan GL tags after import via the Loans register.
              </p>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
              <p className="text-xs text-green-800 font-medium">
                {PREV_LOANS.length} records ready to import. No errors detected.
              </p>
            </div>

            {/* Records table */}
            <StyledCard className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted border-b border-border">
                      {['Name', 'Lender', 'Principal', 'Rate', 'Maturity', 'GL Classification'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PREV_LOANS.map((r, i) => {
                      const isCurrent = currLoans.includes(r);
                      return (
                        <tr key={i} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-2 font-medium text-foreground">{r.name}</td>
                          <td className="px-3 py-2 text-muted-foreground">{r.lender}</td>
                          <td className="px-3 py-2 tabular-nums text-foreground">{fmtCurrency(r.principal, 'CAD')}</td>
                          <td className="px-3 py-2 text-foreground">{r.rate}</td>
                          <td className="px-3 py-2 font-mono text-xs text-foreground">{r.maturity}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                              isCurrent
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {isCurrent ? '2110 Current' : '2100 LT Debt'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </StyledCard>

            {/* GL Account Breakdown */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-muted/60 border-b border-border">
                <Tag className="w-3 h-3 text-primary" />
                <span className="text-xs font-semibold text-foreground">GL Account Breakdown</span>
                <span className="text-[10px] text-muted-foreground ml-1">— verifies import totals reconcile to your chart of accounts</span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2 font-semibold text-foreground/60 uppercase tracking-wide">Account</th>
                    <th className="text-left px-4 py-2 font-semibold text-foreground/60 uppercase tracking-wide">Loans</th>
                    <th className="text-right px-4 py-2 font-semibold text-foreground/60 uppercase tracking-wide">Dr</th>
                    <th className="text-right px-4 py-2 font-semibold text-foreground/60 uppercase tracking-wide">Cr (Opening Bal.)</th>
                  </tr>
                </thead>
                <tbody>
                  {glBreakdown.map((row, i) => (
                    <tr key={i} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-foreground/80">{row.account || '—'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {row.loans.length > 0
                          ? row.loans.map(l => l.name).join(', ')
                          : <span className="text-foreground/30">—</span>
                        }
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-foreground/30">—</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium text-foreground">
                        {row.amount > 0 ? fmtCurrency(row.amount, 'CAD') : <span className="text-foreground/30">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-primary/5 border-t-2 border-primary/25">
                    <td className="px-4 py-2.5 font-semibold text-foreground" colSpan={2}>
                      Total — {PREV_LOANS.length} records
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-foreground/30 font-semibold">—</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-bold text-foreground">
                      <span>{fmtCurrency(grandTotal, 'CAD')}</span>
                      <span className="ml-2 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">✓ GL</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── ADD LOAN FORM CONTENT (shared between modal edit + inline add) ────────────
function AddLoanFormContent({ form, setForm }: { form: Partial<Loan>; setForm: (f: Partial<Loan>) => void }) {
  const f = (field: keyof Loan) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value });
  const fn = (field: keyof Loan) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: parseFloat(e.target.value) || 0 });

  const computedMoPayment = (() => {
    const rate = parseFloat(String(form.rate)) || 0;
    const balance = parseFloat(String(form.originalPrincipal || form.currentBalance)) || 0;
    if (!rate || !balance) return '';
    const r = rate / 100 / 12;
    const payType = form.paymentType || 'P&I';
    if (payType === 'Interest-only' || payType === 'Balloon') return Math.round(balance * r).toString();
    const maturity = form.maturityDate;
    const today = new Date();
    const n = maturity ? Math.max(1, Math.round((new Date(maturity).getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44))) : 60;
    const pmt = r === 0 ? balance / n : balance * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(pmt).toString();
  })();

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      <Input label="Loan Name *" value={form.name || ''} onChange={f('name')} placeholder="e.g. Term Loan A" />
      <Input label="Lender *" value={form.lender || ''} onChange={f('lender')} placeholder="e.g. Royal Bank of Canada" />
      <div className="col-span-2 grid grid-cols-3 gap-2">
        <Select label="Interest Type" value={form.interestType || 'Fixed'} onChange={f('interestType')} options={[
          { value: 'Fixed', label: 'Fixed Rate' }, { value: 'Variable', label: 'Variable Rate' },
        ]} />
        <Input label="Int. Rate (%)" type="number" value={form.rate || ''} onChange={fn('rate')} suffix="%" />
        <Input label="Mo. Payment" type="number" value={form.monthlyPayment ?? ''} onChange={fn('monthlyPayment')} prefix="$" placeholder={computedMoPayment || '0'} />
      </div>
      {form.interestType === 'Variable' && <>
        <Input label="Benchmark" value={form.benchmark || ''} onChange={f('benchmark')} placeholder="e.g. Prime, SOFR" />
        <Input label="Spread (%)" type="number" value={form.spread || ''} onChange={(e) => setForm({ ...form, spread: parseFloat(e.target.value) || 0 })} suffix="%" />
      </>}
      <Input label="Start Date" type="date" value={form.startDate || ''} onChange={f('startDate')} />
      <Input label="Maturity Date" type="date" value={form.maturityDate || ''} onChange={f('maturityDate')} />
      <div className="col-span-2">
        <Textarea label="Current Collateral" value={form.securityDescription || ''} onChange={f('securityDescription')} rows={2} placeholder="Describe collateral and security arrangements..." />
      </div>
      <Select label="Loan Type" value={form.type || 'Term'} onChange={f('type')} options={LOAN_TYPES} />
      <Select label="Currency" value={form.currency || 'CAD'} onChange={f('currency')} options={[
        { value: 'CAD', label: 'CAD – Canadian Dollar' },
        { value: 'USD', label: 'USD – US Dollar' },
        { value: 'EUR', label: 'EUR – Euro' },
        { value: 'GBP', label: 'GBP – British Pound' },
      ]} />
      <Input label="Orig. Loan Amt" type="number" value={form.originalPrincipal || ''} onChange={fn('originalPrincipal')} prefix="$" />
      <Input label="Bal. Loan Amt" type="number" value={form.currentBalance || ''} onChange={fn('currentBalance')} prefix="$" />
      <Select label="Status" value={form.status || 'Active'} onChange={f('status')} options={[
        { value: 'Active', label: 'Active' }, { value: 'Closed', label: 'Closed' },
        { value: 'Replaced', label: 'Replaced' }, { value: 'Refinanced', label: 'Refinanced' },
      ]} />
      <Input label="Last Payment Date" type="date" value={form.lastPaymentDate || ''} onChange={f('lastPaymentDate')} />
      <Select label="Day Count Basis" value={form.dayCountBasis || 'ACT/365'} onChange={f('dayCountBasis')} options={[
        { value: 'ACT/365', label: 'ACT/365' }, { value: 'ACT/360', label: 'ACT/360' }, { value: '30/360', label: '30/360' },
      ]} />
      <Select label="Payment Frequency" value={form.paymentFrequency || 'Monthly'} onChange={f('paymentFrequency')} options={[
        { value: 'Monthly', label: 'Monthly' }, { value: 'Quarterly', label: 'Quarterly' },
        { value: 'Semi-annual', label: 'Semi-Annual' }, { value: 'Annual', label: 'Annual' },
      ]} />
      <Select label="Payment Type" value={form.paymentType || 'P&I'} onChange={f('paymentType')} options={[
        { value: 'P&I', label: 'Principal & Interest' }, { value: 'Interest-only', label: 'Interest Only' }, { value: 'Balloon', label: 'Balloon' },
      ]} />
      <div />
      <div className="col-span-2 border-t border-border pt-3 mt-1">
        <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-3">GL Mappings</div>
        <div className="grid grid-cols-3 gap-3">
          <Input label="GL Principal" value={form.glPrincipalAccount || ''} onChange={f('glPrincipalAccount')} placeholder="e.g. 2100" />
          <Input label="GL Accrued Interest" value={form.glAccruedInterestAccount || ''} onChange={f('glAccruedInterestAccount')} placeholder="e.g. 2300" />
          <Input label="GL Interest Expense" value={form.glInterestExpenseAccount || ''} onChange={f('glInterestExpenseAccount')} placeholder="e.g. 7100" />
        </div>
      </div>
      <div className="col-span-2">
        <Textarea label="Notes" value={form.notes || ''} onChange={f('notes')} rows={2} placeholder="Additional notes..." />
      </div>
    </div>
  );
}

// ─── OCR IMPORT INLINE PAGE ───────────────────────────────────────────────────
function OcrImportPage({ onBack, onImport, hideHeader }: { onBack: () => void; onImport: (l: Loan) => void; hideHeader?: boolean }) {
  const [step, setStep] = useState<'upload' | 'review' | 'confirm'>('upload');
  const [dragging, setDragging] = useState(false);
  const [fields, setFields] = useState({ ...OCR_MOCK });

  const handleImport = () => {
    onImport({
      ...defaultLoan,
      ...fields,
      id: `loan-ocr-${Date.now()}`,
      covenantIds: [], attachments: ['Uploaded_Agreement.pdf'],
      currentPortion: 0, longTermPortion: fields.currentBalance,
      accruedInterest: 0,
      glPrincipalAccount: '2100', glAccruedInterestAccount: '2300', glInterestExpenseAccount: '7100',
    } as Loan);
  };

  return (
    <div className="flex flex-col">
      {!hideHeader && (
        <div className="flex items-center gap-2 px-6 pt-5 pb-4 border-b border-border">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Loans
          </button>
          <span className="text-foreground/30 mx-1">/</span>
          <span className="text-sm font-semibold text-foreground">Add from OCR</span>
          {step !== 'upload' && <><span className="text-foreground/30 mx-1">/</span><span className="text-xs text-muted-foreground capitalize">{step}</span></>}
        </div>
      )}
      <div className="px-[25%] py-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 160px)' }}>
        <StyledCard>
          <div className="px-6 py-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Add Loan from Document</h3>
              <p className="text-xs text-muted-foreground mt-0.5">OCR + AI extraction from loan agreement, renewal, or term sheet</p>
            </div>
            {step === 'upload' && (
              <div
                onDrop={e => { e.preventDefault(); setDragging(false); setStep('review'); }}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
                onClick={() => setStep('review')}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileSearch className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">Drop PDF / DOCX or click to browse</p>
                <p className="text-xs text-foreground/60">Loan agreements, renewal letters, term sheets</p>
                <Button variant="default" size="sm" className="mt-4" onClick={() => setStep('review')}>
                  <Upload className="w-3.5 h-3.5 mr-1" /> Browse Files
                </Button>
              </div>
            )}
            {step === 'review' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="text-blue-500 mt-0.5 flex-shrink-0 text-sm">ℹ</span>
                  <div>
                    <p className="text-xs font-semibold text-blue-800 mb-0.5">OCR Extraction Complete</p>
                    <p className="text-xs text-blue-700">4 fields extracted with high confidence. 1 field requires your review.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {([
                    ['Loan Name', 'name', 'text'],
                    ['Lender', 'lender', 'text'],
                    ['Reference #', 'refNumber', 'text'],
                    ['Annual Rate (%)', 'rate', 'number'],
                    ['Maturity Date', 'maturityDate', 'date'],
                  ] as [string, keyof typeof fields, string][]).map(([label, field, type]) => {
                    const conf = (fields.confidence as Record<string, number>)[field];
                    const isLow = conf !== undefined && conf < 0.90;
                    return (
                      <div key={field} className={`p-3 rounded-xl border ${isLow ? 'border-amber-300 bg-amber-50' : 'border-border bg-card'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-foreground">{label}</span>
                          {conf !== undefined && (
                            <span className={`text-xs font-medium ${isLow ? 'text-amber-700' : 'text-green-600'}`}>
                              {isLow ? '⚠ ' : '✓ '}{(conf * 100).toFixed(0)}% confidence
                            </span>
                          )}
                        </div>
                        <input
                          type={type}
                          className="w-full text-sm px-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                          value={(fields as Record<string, unknown>)[field] as string}
                          onChange={e => setFields({ ...fields, [field]: type === 'number' ? parseFloat(e.target.value) : e.target.value })}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {step === 'confirm' && (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <p className="text-xs text-green-800 font-medium">All fields reviewed and confirmed.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[['Name', fields.name], ['Lender', fields.lender], ['Rate', `${fields.rate}%`], ['Maturity', fields.maturityDate], ['Principal', fmtCurrency(fields.originalPrincipal, 'CAD')]].map(([k, v]) => (
                    <div key={k} className="bg-muted rounded-lg p-3">
                      <div className="text-xs text-foreground/60 mb-0.5">{k}</div>
                      <div className="font-semibold text-foreground">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              {step === 'upload' && <Button variant="secondary" onClick={onBack}>Cancel</Button>}
              {step === 'review' && <><Button variant="secondary" onClick={() => setStep('upload')}>Back</Button><Button variant="default" onClick={() => setStep('confirm')}>Confirm Fields →</Button></>}
              {step === 'confirm' && <><Button variant="secondary" onClick={() => setStep('review')}>Back</Button><Button variant="default" onClick={handleImport}>Import Loan</Button></>}
            </div>
          </div>
        </StyledCard>
      </div>
    </div>
  );
}

// ─── IMPORT WIZARD INLINE PAGE ────────────────────────────────────────────────
function ImportWizardPage({ onBack, hideHeader }: { onBack: () => void; hideHeader?: boolean }) {
  const [step, setStep] = useState<WizardStep>('upload');
  const [glTags, setGlTags] = useState({
    principal:       '2100 – Long-Term Debt',
    currentPortion:  '2110 – Current Portion LT Debt',
    accruedInterest: '2200 – Accrued Interest Payable',
    interestExpense: '7100 – Interest Expense',
  });

  const PREV_LOANS = [
    { name: 'BDC Equipment Loan', lender: 'BDC',         principal: 800_000, rate: '7.20%', maturity: '2030-01-01' },
    { name: 'Shareholder Loan',   lender: 'Shareholder', principal: 250_000, rate: '3.00%', maturity: '2026-12-31' },
    { name: 'Vehicle Loan',       lender: 'Ford Credit', principal:  45_000, rate: '8.90%', maturity: '2027-06-30' },
  ];
  const dayMs   = 24 * 60 * 60 * 1000;
  const todayMs = Date.now();
  const ltLoans   = PREV_LOANS.filter(l => (new Date(l.maturity).getTime() - todayMs) >  365 * dayMs);
  const currLoans = PREV_LOANS.filter(l => (new Date(l.maturity).getTime() - todayMs) <= 365 * dayMs);
  const ltTotal   = ltLoans.reduce((s, l)   => s + l.principal, 0);
  const currTotal = currLoans.reduce((s, l) => s + l.principal, 0);
  const grandTotal = PREV_LOANS.reduce((s, l) => s + l.principal, 0);
  const glBreakdown = [
    { account: glTags.principal,       loans: ltLoans,   amount: ltTotal   },
    { account: glTags.currentPortion,  loans: currLoans, amount: currTotal },
    { account: glTags.accruedInterest, loans: [],        amount: 0         },
    { account: glTags.interestExpense, loans: [],        amount: 0         },
  ];
  const stepIdx = WIZARD_STEPS.findIndex(s => s.id === step);

  return (
    <div className="flex flex-col">
      {!hideHeader && (
        <div className="flex items-center gap-2 px-6 pt-5 pb-4 border-b border-border">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Loans
          </button>
          <span className="text-foreground/30 mx-1">/</span>
          <span className="text-sm font-semibold text-foreground">Import Excel</span>
        </div>
      )}
      <div className="px-[25%] py-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 160px)' }}>
        <StyledCard>
          <div className="px-6 py-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Import Loan Register</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Upload an Excel template with loan data</p>
            </div>
            {/* Step indicator */}
            <div className="flex items-center gap-0">
              {WIZARD_STEPS.map((s, i) => (
                <React.Fragment key={s.id}>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                      i < stepIdx  ? 'bg-primary text-primary-foreground' :
                      i === stepIdx ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {i < stepIdx ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs font-medium ${i === stepIdx ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
                  </div>
                  {i < WIZARD_STEPS.length - 1 && (
                    <div className={`flex-1 h-px mx-2 ${i < stepIdx ? 'bg-primary' : 'bg-border'}`} style={{ minWidth: 16 }} />
                  )}
                </React.Fragment>
              ))}
            </div>
            {/* Step: Upload */}
            {step === 'upload' && (
              <>
                <div
                  className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-primary/50 hover:bg-muted/30 cursor-pointer transition-all"
                  onClick={() => setStep('map')}
                >
                  <Upload className="w-8 h-8 text-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">Drop Excel file or click to browse</p>
                  <p className="text-xs text-foreground/60 mt-1">.xlsx or .csv accepted</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground/60">
                  <span>Need a template?</span>
                  <button className="text-primary font-medium hover:underline">Download Import Template →</button>
                </div>
              </>
            )}
            {/* Step: Column mapping */}
            {step === 'map' && (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-xs text-blue-800">Match your spreadsheet columns to the required fields below.</p>
                </div>
                {[['Loan Name', 'Column A'], ['Lender', 'Column B'], ['Reference #', 'Column C'], ['Original Principal', 'Column D'], ['Start Date', 'Column E'], ['Maturity Date', 'Column F'], ['Rate', 'Column G']].map(([field, col]) => (
                  <div key={field} className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm font-medium text-foreground">{field}</span>
                    <Select value={col} onChange={() => {}} options={['A','B','C','D','E','F','G','H'].map(c => ({ value: `Column ${c}`, label: `Column ${c}` }))} className="w-36" />
                  </div>
                ))}
              </div>
            )}
            {/* Step: GL Tagging */}
            {step === 'gl' && (
              <div className="space-y-4">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <Tag className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Assign GL account codes for each field type. These will be applied to all imported loans and used for automated journal entry generation.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                  {GL_FIELDS.map(({ key, label, hint }) => (
                    <div key={key}>
                      <Select
                        label={label}
                        value={glTags[key]}
                        onChange={e => setGlTags(prev => ({ ...prev, [key]: e.target.value }))}
                        options={GL_OPTIONS[key] ?? []}
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-xl bg-muted/60 border border-border">
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">Tip:</span> GL codes follow your chart of accounts. You can edit individual loan GL tags after import via the Loans register.
                  </p>
                </div>
              </div>
            )}
            {/* Step: Preview */}
            {step === 'preview' && (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
                  <p className="text-xs text-green-800 font-medium">
                    {PREV_LOANS.length} records ready to import. No errors detected.
                  </p>
                </div>
                <StyledCard className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted border-b border-border">
                          {['Name', 'Lender', 'Principal', 'Rate', 'Maturity', 'GL Classification'].map(h => (
                            <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {PREV_LOANS.map((r, i) => {
                          const isCurrent = currLoans.includes(r);
                          return (
                            <tr key={i} className="border-b border-border hover:bg-muted/30 transition-colors">
                              <td className="px-3 py-2 font-medium text-foreground">{r.name}</td>
                              <td className="px-3 py-2 text-muted-foreground">{r.lender}</td>
                              <td className="px-3 py-2 tabular-nums text-foreground">{fmtCurrency(r.principal, 'CAD')}</td>
                              <td className="px-3 py-2 text-foreground">{r.rate}</td>
                              <td className="px-3 py-2 font-mono text-xs text-foreground">{r.maturity}</td>
                              <td className="px-3 py-2">
                                <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                  isCurrent
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                  {isCurrent ? '2110 Current' : '2100 LT Debt'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </StyledCard>
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="flex items-center gap-1.5 px-4 py-2.5 bg-muted/60 border-b border-border">
                    <Tag className="w-3 h-3 text-primary" />
                    <span className="text-xs font-semibold text-foreground">GL Account Breakdown</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-4 py-2 font-semibold text-foreground/60 uppercase tracking-wide">Account</th>
                        <th className="text-left px-4 py-2 font-semibold text-foreground/60 uppercase tracking-wide">Loans</th>
                        <th className="text-right px-4 py-2 font-semibold text-foreground/60 uppercase tracking-wide">Cr (Opening Bal.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {glBreakdown.map((row, i) => (
                        <tr key={i} className="border-b border-border hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-foreground/80">{row.account || '—'}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {row.loans.length > 0 ? row.loans.map(l => l.name).join(', ') : <span className="text-foreground/30">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-medium text-foreground">
                            {row.amount > 0 ? fmtCurrency(row.amount, 'CAD') : <span className="text-foreground/30">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-primary/5 border-t-2 border-primary/25">
                        <td className="px-4 py-2.5 font-semibold text-foreground" colSpan={2}>Total — {PREV_LOANS.length} records</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-bold text-foreground">
                          <span>{fmtCurrency(grandTotal, 'CAD')}</span>
                          <span className="ml-2 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">✓ GL</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              {step === 'upload'  && <Button variant="secondary" onClick={onBack}>Cancel</Button>}
              {step === 'map'     && <><Button variant="secondary" onClick={() => setStep('upload')}>Back</Button><Button variant="default" onClick={() => setStep('gl')}>Next: GL Tags →</Button></>}
              {step === 'gl'      && <><Button variant="secondary" onClick={() => setStep('map')}>Back</Button><Button variant="default" onClick={() => setStep('preview')}>Preview →</Button></>}
              {step === 'preview' && <><Button variant="secondary" onClick={() => setStep('gl')}>Back</Button><Button variant="default" onClick={() => { onBack(); toast.success('Import complete'); }}>Import Records</Button></>}
            </div>
          </div>
        </StyledCard>
      </div>
    </div>
  );
}
