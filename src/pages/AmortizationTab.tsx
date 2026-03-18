import React, { useState } from 'react';
import { Edit3, Lock, Unlock, Download, ChevronDown } from 'lucide-react';
import { useTableColumns, ColumnToggleButton, useColumnResize, ThResizable, type ColDef } from '@/components/table-utils';
import { useStore } from '../store/useStore';
import { fmtCurrency, fmtNumber, fmtDateDisplay, exportToExcel, buildAmortizationExport } from '../lib/utils';
import type { Loan } from '../types';

/** Returns [yr1, yr2, yr3, yr4, yr5, thereafter] principal amounts from `yearEndPeriod`. */
function calcMaturityLadder(loan: Loan, closingBalance: number, yearEndPeriod: string): number[] {
  const result = [0, 0, 0, 0, 0, 0];
  if (closingBalance <= 0) return result;
  const [y, m] = yearEndPeriod.split('-').map(Number);
  const maturity = new Date(loan.maturityDate);
  const monthsToMaturity = Math.max(0,
    (maturity.getFullYear() - y) * 12 + (maturity.getMonth() + 1 - m));
  if (loan.type === 'LOC' || loan.type === 'Revolver') { result[0] = closingBalance; return result; }
  if (loan.paymentType === 'Interest-only' || loan.paymentType === 'Balloon') {
    const idx = Math.min(Math.max(0, Math.ceil(monthsToMaturity / 12) - 1), 5);
    result[idx] = closingBalance;
    return result;
  }
  const r = loan.rate / 100 / 12;
  const n = monthsToMaturity;
  if (n <= 0) { result[0] = closingBalance; return result; }
  const pmt = r === 0 ? closingBalance / n : closingBalance * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  let bal = closingBalance;
  for (let mo = 1; mo <= n; mo++) {
    const interest = bal * r;
    const principal = Math.min(pmt - interest, bal);
    const idx = Math.min(Math.ceil(mo / 12) - 1, 5);
    result[idx] += principal;
    bal -= principal;
    if (bal <= 0.01) break;
  }
  return result.map(v => Math.round(v));
}
import { Button } from '@/components/wp-ui/button';
import { StyledCard } from '@/components/wp-ui/card';
import toast from 'react-hot-toast';

type AmortColId = 'period' | 'openingBalance' | 'interest' | 'payment' | 'principal' | 'endingBalance' | 'actions';

const AMORT_COLS: ColDef<AmortColId>[] = [
  { id: 'period',         label: 'Period',          pinned: true },
  { id: 'openingBalance', label: 'Opening Balance' },
  { id: 'interest',       label: 'Interest' },
  { id: 'principal',      label: 'Principal' },
  { id: 'payment',        label: 'Payment' },
  { id: 'endingBalance',  label: 'Ending Balance' },
  { id: 'actions',        label: '',                pinned: true },
];

export function AmortizationTab() {
  const { loans, amortization, settings, updateAmortRow } = useStore(s => ({
    loans: s.loans.filter(l => l.status !== 'Inactive'),
    amortization: s.amortization,
    settings: s.settings,
    updateAmortRow: s.updateAmortRow,
  }));

  const [view, setView] = useState<'schedule' | 'repayment'>('schedule');
  const [selectedLoanId, setSelectedLoanId] = useState(loans[0]?.id || '');
  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ payment: number; principal: number; interest: number }>({ payment: 0, principal: 0, interest: 0 });
  const [lockedRows, setLockedRows] = useState<Set<string>>(new Set());

  const { isVisible: amortVisible, toggle: amortToggle, setWidth: amortSetWidth, getWidth: amortGetWidth } = useTableColumns('amortization', AMORT_COLS);
  const { onResizeStart: amortResizeStart } = useColumnResize(amortSetWidth);
  const arh = (id: AmortColId) => (e: React.MouseEvent) => amortResizeStart(id, e, amortGetWidth(id) ?? 120);

  const selectedLoan = loans.find(l => l.id === selectedLoanId);
  const loanRows = amortization.filter(r => r.loanId === selectedLoanId).sort((a, b) => a.periodDate.localeCompare(b.periodDate));

  const YEAR_END_PERIOD = '2024-12';
  const baseYear = 2025;
  const yearLabels = Array.from({ length: 5 }, (_, i) => `Year ${i + 1} (${baseYear + i})`).concat(['Thereafter']);
  const maturityLadderRows = loans
    .filter(l => l.status === 'Active')
    .map(l => {
      const ladder = calcMaturityLadder(l, l.currentBalance, YEAR_END_PERIOD);
      return { loan: l, ladder, total: ladder.reduce((s, v) => s + v, 0) };
    });
  const ladderColTotals = [0, 1, 2, 3, 4, 5].map(i => maturityLadderRows.reduce((s, d) => s + d.ladder[i], 0));
  const ladderGrandTotal = ladderColTotals.reduce((s, v) => s + v, 0);

  const startEdit = (row: typeof loanRows[0]) => {
    if (lockedRows.has(row.id)) { toast.error('Row is locked'); return; }
    setEditRowId(row.id);
    setEditValues({ payment: row.payment, principal: row.principal, interest: row.interest });
  };

  const saveEdit = () => {
    if (!editRowId) return;
    const endingBalance = loanRows.find(r => r.id === editRowId)!.openingBalance - editValues.principal;
    updateAmortRow(editRowId, { ...editValues, endingBalance, isManualOverride: true });
    toast.success('Row updated');
    setEditRowId(null);
  };

  const toggleLock = (id: string) => {
    setLockedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totals = loanRows.reduce((acc, r) => ({
    interest: acc.interest + r.interest,
    payment: acc.payment + r.payment,
    principal: acc.principal + r.principal,
  }), { interest: 0, payment: 0, principal: 0 });


  const exportCurrentLoan = async () => {
    if (!selectedLoan) return;
    await exportToExcel(
      { [selectedLoan.name]: buildAmortizationExport(loanRows, selectedLoan.name) },
      `Amortization_${selectedLoan.refNumber}.xlsx`,
    );
    toast.success(`Exported ${selectedLoan.name}`);
  };

  const exportAll = async () => {
    const sheets: Record<string, unknown[][]> = {};
    for (const loan of loans) {
      const rows = amortization.filter(r => r.loanId === loan.id).sort((a, b) => a.periodDate.localeCompare(b.periodDate));
      if (rows.length > 0) sheets[loan.name.slice(0, 31)] = buildAmortizationExport(rows, loan.name);
    }
    if (Object.keys(sheets).length === 0) { toast.error('No amortization data to export'); return; }
    await exportToExcel(sheets, 'Amortization_All_Loans.xlsx');
    toast.success(`Exported ${Object.keys(sheets).length} loan schedule${Object.keys(sheets).length !== 1 ? 's' : ''}`);
  };

  const TABS = [
    { id: 'schedule',   label: 'Per-Loan Schedule' },
    { id: 'repayment',  label: 'Repayment Schedule' },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Amortization Schedules</h2>
          <p className="text-xs text-foreground/60 mt-0.5">Per-loan schedules, interest split, and maturity ladder</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={exportAll}><Download className="w-3.5 h-3.5 mr-1" /> Export All</Button>
          <ColumnToggleButton columns={AMORT_COLS} isVisible={amortVisible} onToggle={amortToggle} />
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 border-b border-border -mx-6 px-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id as typeof view)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              view === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === 'schedule' && selectedLoan && (
        <div className="space-y-4">
          {/* Loan Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground/60 whitespace-nowrap">View:</span>
            <div className="relative">
              <select
                value={selectedLoanId}
                onChange={e => setSelectedLoanId(e.target.value)}
                className="input-double-border h-9 text-sm pl-3 pr-8 rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground appearance-none transition-all duration-200 hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)] cursor-pointer focus:outline-none"
              >
                {loans.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.currency})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/70 pointer-events-none" />
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Remaining Balance',        value: fmtCurrency(selectedLoan.currentBalance, selectedLoan.currency), sub: 'Opening balance' },
              { label: 'Total Interest Remaining', value: fmtCurrency(totals.interest, selectedLoan.currency, true),        sub: 'Full schedule' },
              { label: 'Monthly Payment',          value: loanRows[0] ? fmtCurrency(loanRows[0].payment, selectedLoan.currency) : '—', sub: selectedLoan.paymentType },
              { label: 'Maturity',                 value: fmtDateDisplay(selectedLoan.maturityDate), sub: `${selectedLoan.rate}% ${selectedLoan.dayCountBasis}` },
            ].map(s => (
              <div key={s.label} className="px-5 py-4 bg-card border border-border shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="text-[11px] font-medium text-foreground/60 mb-1 whitespace-nowrap">{s.label}</div>
                <div className="text-lg font-bold leading-none text-primary tabular-nums">{s.value}</div>
                <div className="text-[11px] text-foreground/50 mt-1">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Schedule Table */}
          <StyledCard className="overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">{selectedLoan.name} — Amortization Schedule</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground/60">{loanRows.length} periods</span>
                <button className="p-1.5 hover:bg-muted rounded-lg transition-colors" title="Download this loan" onClick={exportCurrentLoan}>
                  <Download className="w-3.5 h-3.5 text-primary" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 488px)', minHeight: '200px' }}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-muted border-b border-border">
                    <ThResizable colId="period" width={amortGetWidth('period')} onResizeStart={arh('period')} className="px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider text-left whitespace-nowrap">Period</ThResizable>
                    {amortVisible('openingBalance') && <ThResizable colId="openingBalance" width={amortGetWidth('openingBalance')} onResizeStart={arh('openingBalance')} className="px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider text-right whitespace-nowrap">Opening Balance</ThResizable>}
                    {amortVisible('interest') && <ThResizable colId="interest" width={amortGetWidth('interest')} onResizeStart={arh('interest')} className="px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider text-right whitespace-nowrap">Interest</ThResizable>}
                    {amortVisible('principal') && <ThResizable colId="principal" width={amortGetWidth('principal')} onResizeStart={arh('principal')} className="px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider text-right whitespace-nowrap">Principal</ThResizable>}
                    {amortVisible('payment') && <ThResizable colId="payment" width={amortGetWidth('payment')} onResizeStart={arh('payment')} className="px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider text-right whitespace-nowrap">Payment</ThResizable>}
                    {amortVisible('endingBalance') && <ThResizable colId="endingBalance" width={amortGetWidth('endingBalance')} onResizeStart={arh('endingBalance')} className="px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider text-right whitespace-nowrap">Ending Balance</ThResizable>}
                    <ThResizable colId="actions" width={amortGetWidth('actions')} onResizeStart={arh('actions')} className="px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider text-center whitespace-nowrap"></ThResizable>
                  </tr>
                </thead>
                <tbody>
                  {loanRows.map(row => {
                    const isEditing = editRowId === row.id;
                    const isLocked  = lockedRows.has(row.id);
                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-border hover:bg-muted/30 transition-colors ${row.isManualOverride ? 'bg-amber-50/60 dark:bg-amber-900/10' : ''}`}
                      >
                        <td className="px-4 py-2 font-mono text-foreground/60 whitespace-nowrap">{row.periodDate}</td>
                        {amortVisible('openingBalance') && (
                          <td className="px-4 py-2 text-right tabular-nums text-foreground whitespace-nowrap">{fmtNumber(row.openingBalance)}</td>
                        )}
                        {amortVisible('interest') && (
                          <td className="px-4 py-2 text-right tabular-nums text-amber-600 whitespace-nowrap">
                            {isEditing
                              ? <input type="number" value={editValues.interest} onChange={e => setEditValues(p => ({ ...p, interest: parseFloat(e.target.value) || 0 }))}
                                  className="w-24 text-xs px-2 py-1 border border-primary/40 rounded bg-background text-foreground text-right focus:outline-none" />
                              : fmtNumber(row.interest)}
                          </td>
                        )}
                        {amortVisible('principal') && (
                          <td className="px-4 py-2 text-right tabular-nums text-green-600 whitespace-nowrap">
                            {isEditing
                              ? <input type="number" value={editValues.principal} onChange={e => setEditValues(p => ({ ...p, principal: parseFloat(e.target.value) || 0 }))}
                                  className="w-24 text-xs px-2 py-1 border border-primary/40 rounded bg-background text-foreground text-right focus:outline-none" />
                              : fmtNumber(row.principal)}
                          </td>
                        )}
                        {amortVisible('payment') && (
                          <td className="px-4 py-2 text-right tabular-nums text-foreground whitespace-nowrap">
                            {isEditing
                              ? <input type="number" value={editValues.payment} onChange={e => setEditValues(p => ({ ...p, payment: parseFloat(e.target.value) || 0 }))}
                                  className="w-24 text-xs px-2 py-1 border border-primary/40 rounded bg-background text-foreground text-right focus:outline-none" />
                              : fmtNumber(row.payment)}
                          </td>
                        )}
                        {amortVisible('endingBalance') && (
                          <td className="px-4 py-2 text-right tabular-nums font-semibold text-foreground whitespace-nowrap">{fmtNumber(row.endingBalance)}</td>
                        )}
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            {isEditing ? (
                              <>
                                <button onClick={saveEdit} className="text-green-600 text-xs font-medium hover:underline">Save</button>
                                <button onClick={() => setEditRowId(null)} className="text-foreground/60 hover:text-foreground text-xs ml-1">✕</button>
                              </>
                            ) : (
                              <>
                                {row.isManualOverride && <span className="text-amber-500 text-xs mr-0.5" title="Manual override">⚑</span>}
                                <button onClick={() => toggleLock(row.id)} className="p-1.5 hover:bg-muted rounded-lg transition-colors" title={isLocked ? 'Unlock' : 'Lock'}>
                                  {isLocked ? <Lock className="w-3 h-3 text-primary" /> : <Unlock className="w-3 h-3 text-foreground/40" />}
                                </button>
                                <button onClick={() => startEdit(row)} className="p-1.5 hover:bg-muted rounded-lg transition-colors" title="Edit row">
                                  <Edit3 className="w-3 h-3 text-primary" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="sticky bottom-0 z-10">
                  <tr className="bg-muted/80 border-t-2 border-primary/20 font-semibold">
                    <td className="px-4 py-2.5 text-foreground">Schedule Total</td>
                    {amortVisible('openingBalance') && <td className="px-4 py-2.5" />}
                    {amortVisible('interest') && <td className="px-4 py-2.5 text-right tabular-nums text-amber-600">{fmtNumber(totals.interest)}</td>}
                    {amortVisible('principal') && <td className="px-4 py-2.5 text-right tabular-nums text-green-600">{fmtNumber(totals.principal)}</td>}
                    {amortVisible('payment') && <td className="px-4 py-2.5 text-right tabular-nums text-foreground">{fmtNumber(totals.payment)}</td>}
                    {amortVisible('endingBalance') && <td className="px-4 py-2.5 text-right tabular-nums text-foreground/60">—</td>}
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </StyledCard>
        </div>
      )}

      {view === 'repayment' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Principal Repayment Schedule</h2>
              <p className="text-xs text-foreground/60 mt-0.5">As at Dec 31, 2024 · Scheduled principal repayments by fiscal year</p>
            </div>
          </div>
          <StyledCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider text-left">Facility</th>
                    {yearLabels.map(lbl => (
                      <th key={lbl} className="px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider text-right whitespace-nowrap">{lbl}</th>
                    ))}
                    <th className="px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {maturityLadderRows.map(({ loan: l, ladder, total }) => (
                    <tr key={l.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground">{l.name}</td>
                      {ladder.map((v, i) => (
                        <td key={i} className="px-4 py-2.5 text-right tabular-nums text-foreground">{v > 0 ? fmtNumber(v) : '—'}</td>
                      ))}
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-foreground">{fmtNumber(total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/80 border-t-2 border-primary/20 font-semibold">
                    <td className="px-4 py-2.5 text-foreground">Total</td>
                    {ladderColTotals.map((v, i) => (
                      <td key={i} className="px-4 py-2.5 text-right tabular-nums text-foreground">{v > 0 ? fmtNumber(v) : '—'}</td>
                    ))}
                    <td className="px-4 py-2.5 text-right tabular-nums font-bold text-primary">{fmtNumber(ladderGrandTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </StyledCard>
        </div>
      )}
    </div>
  );
}
