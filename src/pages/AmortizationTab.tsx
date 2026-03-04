import React, { useState } from 'react';
import { Edit3, Lock, Unlock, Download, ChevronDown } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fmtCurrency, fmtNumber, buildMaturityLadder, exportToExcel, buildAmortizationExport } from '../lib/utils';
import { Button } from '@/components/wp-ui/button';
import { StyledCard } from '@/components/wp-ui/card';
import toast from 'react-hot-toast';

export function AmortizationTab() {
  const { loans, amortization, settings, updateAmortRow } = useStore(s => ({
    loans: s.loans,
    amortization: s.amortization,
    settings: s.settings,
    updateAmortRow: s.updateAmortRow,
  }));

  const [view, setView] = useState<'schedule' | 'maturity'>('schedule');
  const [selectedLoanId, setSelectedLoanId] = useState(loans[0]?.id || '');
  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ payment: number; principal: number; interest: number }>({ payment: 0, principal: 0, interest: 0 });
  const [lockedRows, setLockedRows] = useState<Set<string>>(new Set());

  const selectedLoan = loans.find(l => l.id === selectedLoanId);
  const loanRows = amortization.filter(r => r.loanId === selectedLoanId).sort((a, b) => a.periodDate.localeCompare(b.periodDate));

  const maturityLadder = buildMaturityLadder(loans, amortization, settings.fiscalYearEnd);

  const next12Rows = amortization.filter(r => {
    return r.periodDate > settings.fiscalYearEnd && r.periodDate <= '2026-01-01';
  }).sort((a, b) => a.periodDate.localeCompare(b.periodDate));

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

  const next12Totals = next12Rows.reduce((acc, r) => ({
    interest:  acc.interest  + r.interest,
    payment:   acc.payment   + r.payment,
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
    { id: 'schedule', label: 'Per-Loan Schedule' },
    { id: 'maturity', label: 'Maturity & Next 12 Months' },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Amortization Schedules</h2>
          <p className="text-xs text-foreground/60 mt-0.5">Per-loan schedules, interest split, and maturity ladder</p>
        </div>
        <Button variant="secondary" size="sm" onClick={exportAll}><Download className="w-3.5 h-3.5 mr-1" /> Export All</Button>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 bg-card rounded-lg border border-border p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id as typeof view)}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
              view === tab.id ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
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
              { label: 'Maturity',                 value: selectedLoan.maturityDate, sub: `${selectedLoan.rate}% ${selectedLoan.dayCountBasis}` },
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
                    {['Period','Opening Balance','Interest','Payment','Principal','Ending Balance',''].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider text-right first:text-left last:text-center whitespace-nowrap">{h}</th>
                    ))}
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
                        <td className="px-4 py-2 text-right tabular-nums text-foreground whitespace-nowrap">{fmtNumber(row.openingBalance)}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-amber-600 whitespace-nowrap">
                          {isEditing
                            ? <input type="number" value={editValues.interest} onChange={e => setEditValues(p => ({ ...p, interest: parseFloat(e.target.value) || 0 }))}
                                className="w-24 text-xs px-2 py-1 border border-primary/40 rounded bg-background text-foreground text-right focus:outline-none" />
                            : fmtNumber(row.interest)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-foreground whitespace-nowrap">
                          {isEditing
                            ? <input type="number" value={editValues.payment} onChange={e => setEditValues(p => ({ ...p, payment: parseFloat(e.target.value) || 0 }))}
                                className="w-24 text-xs px-2 py-1 border border-primary/40 rounded bg-background text-foreground text-right focus:outline-none" />
                            : fmtNumber(row.payment)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-green-600 whitespace-nowrap">
                          {isEditing
                            ? <input type="number" value={editValues.principal} onChange={e => setEditValues(p => ({ ...p, principal: parseFloat(e.target.value) || 0 }))}
                                className="w-24 text-xs px-2 py-1 border border-primary/40 rounded bg-background text-foreground text-right focus:outline-none" />
                            : fmtNumber(row.principal)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums font-semibold text-foreground whitespace-nowrap">{fmtNumber(row.endingBalance)}</td>
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
                    <td className="px-4 py-2.5" />
                    <td className="px-4 py-2.5 text-right tabular-nums text-amber-600">{fmtNumber(totals.interest)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-foreground">{fmtNumber(totals.payment)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-green-600">{fmtNumber(totals.principal)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-foreground/60">—</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </StyledCard>
        </div>
      )}

      {view === 'maturity' && (
        <div className="space-y-5">
          {/* Maturity Ladder Buckets */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Principal Maturity Ladder (CAD Equivalent)</h3>
            <div className="grid grid-cols-5 gap-3">
              {maturityLadder.map((bucket, i) => (
                <div key={i} className="px-5 py-4 bg-card border border-border shadow-sm text-center" style={{ borderRadius: '12px' }}>
                  <div className="text-[11px] font-medium text-foreground/60 mb-1 whitespace-nowrap">{bucket.label}</div>
                  <div className="text-lg font-bold leading-none text-primary tabular-nums">{fmtCurrency(bucket.amount, 'CAD', true)}</div>
                  <div className="text-[11px] text-foreground/50 mt-1 truncate">{bucket.loans.map(l => l.name).join(', ') || '—'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Next 12 Months Detail Table */}
          <StyledCard className="overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-border flex-shrink-0">
              <h3 className="text-sm font-semibold text-foreground">Next 12 Months — Detailed Repayment Schedule</h3>
              <p className="text-xs text-foreground/60 mt-0.5">Consolidated across all active loans · {next12Rows.length} payments</p>
            </div>
            <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 520px)', minHeight: '180px' }}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-muted border-b border-border">
                    {['Loan','Period','Opening','Interest','Payment','Principal','Ending'].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider text-right first:text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {next12Rows.map(row => {
                    const loan = loans.find(l => l.id === row.loanId);
                    return (
                      <tr key={row.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2 font-medium text-foreground whitespace-nowrap">{loan?.name}</td>
                        <td className="px-4 py-2 text-right font-mono text-foreground/60 whitespace-nowrap">{row.periodDate}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-foreground/60 whitespace-nowrap">{fmtNumber(row.openingBalance)}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-amber-600 whitespace-nowrap">{fmtNumber(row.interest)}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-foreground whitespace-nowrap">{fmtNumber(row.payment)}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-green-600 whitespace-nowrap">{fmtNumber(row.principal)}</td>
                        <td className="px-4 py-2 text-right tabular-nums font-semibold text-foreground whitespace-nowrap">{fmtNumber(row.endingBalance)}</td>
                      </tr>
                    );
                  })}
                  {next12Rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No payments scheduled in the next 12 months</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="sticky bottom-0 z-10">
                  <tr className="bg-muted/80 border-t-2 border-primary/20 font-semibold">
                    <td className="px-4 py-2.5 text-foreground text-sm">12-Month Total</td>
                    <td className="px-4 py-2.5 text-right text-xs text-foreground/40 whitespace-nowrap">{next12Rows.length} payments</td>
                    <td className="px-4 py-2.5" />
                    <td className="px-4 py-2.5 text-right tabular-nums text-amber-600">{fmtNumber(next12Totals.interest)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-foreground">{fmtNumber(next12Totals.payment)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-green-600">{fmtNumber(next12Totals.principal)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-foreground/40">—</td>
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
