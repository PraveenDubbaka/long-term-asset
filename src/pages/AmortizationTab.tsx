import React, { useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { useTableColumns, useColumnResize, ThResizable, type ColDef } from '@/components/table-utils';
import { useStore } from '../store/useStore';
import { fmtCurrency, fmtNumber, fmtDateDisplay, exportToExcel, buildAmortizationExport } from '../lib/utils';

import { Button } from '@/components/wp-ui/button';
import { StyledCard } from '@/components/wp-ui/card';
import toast from 'react-hot-toast';

type AmortColId = 'period' | 'openingBalance' | 'interest' | 'payment' | 'principal' | 'endingBalance';

const AMORT_COLS: ColDef<AmortColId>[] = [
  { id: 'period',         label: 'Period',          pinned: true },
  { id: 'openingBalance', label: 'Opening Balance' },
  { id: 'interest',       label: 'Interest' },
  { id: 'principal',      label: 'Principal' },
  { id: 'payment',        label: 'Payment' },
  { id: 'endingBalance',  label: 'Ending Balance' },
];

export function AmortizationTab() {
  const { loans, amortization, settings, updateAmortRow } = useStore(s => ({
    loans: s.loans.filter(l => l.status !== 'Inactive'),
    amortization: s.amortization,
    settings: s.settings,
    updateAmortRow: s.updateAmortRow,
  }));

  const [selectedLoanId, setSelectedLoanId] = useState(loans[0]?.id || '');

  const { isVisible: amortVisible, toggle: amortToggle, setWidth: amortSetWidth, getWidth: amortGetWidth } = useTableColumns('amortization', AMORT_COLS);
  const { onResizeStart: amortResizeStart } = useColumnResize(amortSetWidth);
  const arh = (id: AmortColId) => (e: React.MouseEvent) => amortResizeStart(id, e, amortGetWidth(id) ?? 120);

  const selectedLoan = loans.find(l => l.id === selectedLoanId);
  const loanRows = amortization.filter(r => r.loanId === selectedLoanId).sort((a, b) => a.periodDate.localeCompare(b.periodDate));



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


  return (
    <div className="p-6 space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Amortization Schedules</h2>
          <p className="text-xs text-foreground mt-0.5">Per-loan schedules, interest split, and maturity ladder</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={exportAll}><Download className="w-3.5 h-3.5 mr-1" /> Export All</Button>
        </div>
      </div>

      {selectedLoan && (
        <div className="space-y-4">
          {/* Loan Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground whitespace-nowrap">View:</span>
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
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground pointer-events-none" />
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
                <div className="text-[11px] font-medium text-foreground mb-1 whitespace-nowrap">{s.label}</div>
                <div className="text-lg font-bold leading-none text-primary tabular-nums">{s.value}</div>
                <div className="text-[11px] text-foreground mt-1">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Schedule Table */}
          <StyledCard className="overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">
                {selectedLoan.name}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">({selectedLoan.currency})</span>
                {' '}— Amortization Schedule
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground">{loanRows.length} periods</span>
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
                  </tr>
                </thead>
                <tbody>
                  {loanRows.map(row => (
                      <tr
                        key={row.id}
                        className={`border-b border-border hover:bg-muted/30 transition-colors ${row.isManualOverride ? 'bg-amber-50/60 dark:bg-amber-900/10' : ''}`}
                      >
                        <td className="px-4 py-2 font-mono text-foreground whitespace-nowrap">{row.periodDate}</td>
                        {amortVisible('openingBalance') && (
                          <td className="px-4 py-2 text-right tabular-nums text-foreground whitespace-nowrap">{fmtNumber(row.openingBalance)}</td>
                        )}
                        {amortVisible('interest') && (
                          <td className="px-4 py-2 text-right tabular-nums text-amber-600 whitespace-nowrap">{fmtNumber(row.interest)}</td>
                        )}
                        {amortVisible('principal') && (
                          <td className="px-4 py-2 text-right tabular-nums text-green-600 whitespace-nowrap">{fmtNumber(row.principal)}</td>
                        )}
                        {amortVisible('payment') && (
                          <td className="px-4 py-2 text-right tabular-nums text-foreground whitespace-nowrap">{fmtNumber(row.payment)}</td>
                        )}
                        {amortVisible('endingBalance') && (
                          <td className="px-4 py-2 text-right tabular-nums font-semibold text-foreground whitespace-nowrap">{fmtNumber(row.endingBalance)}</td>
                        )}
                      </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 z-10">
                  <tr className="bg-muted/80 border-t-2 border-primary/20 font-semibold">
                    <td className="px-4 py-2.5 text-foreground">Schedule Total</td>
                    {amortVisible('openingBalance') && <td className="px-4 py-2.5" />}
                    {amortVisible('interest') && <td className="px-4 py-2.5 text-right tabular-nums text-amber-600">{fmtNumber(totals.interest)}</td>}
                    {amortVisible('principal') && <td className="px-4 py-2.5 text-right tabular-nums text-green-600">{fmtNumber(totals.principal)}</td>}
                    {amortVisible('payment') && <td className="px-4 py-2.5 text-right tabular-nums text-foreground">{fmtNumber(totals.payment)}</td>}
                    {amortVisible('endingBalance') && <td className="px-4 py-2.5 text-right tabular-nums text-foreground">—</td>}
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
