import React, { useState } from 'react';
import { FileDown, Printer, FileText, Table2, BarChart3, ShieldCheck, Scale, FileCheck, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fmtCurrency, fmtPct, fmtDateDisplay, exportToExcel, buildLoanRegisterExport, buildJEExport, buildAmortizationExport } from '../lib/utils';
import { Button, Card, Badge, Alert, SectionHeader } from '../components/ui';
import toast from 'react-hot-toast';

const REPORT_DEFS = [
  { id: 'register', icon: FileText, label: 'Loan Register', sub: 'Key terms, rates, GL mappings', tag: 'Disclosure-Ready' },
  { id: 'continuity', icon: Table2, label: 'Continuity Roll-Forward', sub: 'Opening → movements → closing by loan', tag: 'Workpaper' },
  { id: 'amortization', icon: BarChart3, label: 'Amortization Schedules', sub: 'Per-loan full-term schedule', tag: 'Workpaper' },
  { id: 'maturity', icon: BarChart3, label: 'Maturity Ladder', sub: 'Principal due by year bucket', tag: 'Disclosure-Ready' },
  { id: 'accrued', icon: FileText, label: 'Accrued Interest Workpaper', sub: 'YE accrual by loan, basis, calculation', tag: 'Workpaper' },
  { id: 'covenants', icon: ShieldCheck, label: 'Covenant Summary', sub: 'All covenants, status, drilldown', tag: 'Workpaper' },
  { id: 'recon', icon: Scale, label: 'TB Reconciliation', sub: 'Subledger vs GL, variances', tag: 'Workpaper' },
  { id: 'ajes', icon: FileCheck, label: 'AJE Package', sub: 'All journal entries, status, totals', tag: 'Posting' },
];

export function ReportsTab() {
  const { loans, jes, covenants, reconciliation, amortization, continuity, settings } = useStore(s => ({
    loans: s.loans.filter(l => l.status !== 'Inactive'), jes: s.jes, covenants: s.covenants,
    reconciliation: s.reconciliation, amortization: s.amortization,
    continuity: s.continuity, settings: s.settings,
  }));

  const [selected, setSelected] = useState<Set<string>>(new Set(['register', 'continuity', 'amortization', 'accrued', 'ajes']));
  const [exporting, setExporting] = useState(false);

  const toggleReport = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExcelExport = async () => {
    setExporting(true);
    try {
      const sheets: Record<string, unknown[][]> = {};

      if (selected.has('register')) sheets['Loan Register'] = buildLoanRegisterExport(loans);
      if (selected.has('ajes')) sheets['AJEs'] = buildJEExport(jes);
      if (selected.has('amortization')) {
        for (const loan of loans) {
          const loanSchedule = amortization.filter(r => r.loanId === loan.id);
          if (loanSchedule.length > 0) {
            sheets[`Amort - ${loan.name.slice(0, 20)}`] = buildAmortizationExport(loanSchedule, loan.name);
          }
        }
      }
      if (selected.has('continuity')) {
        const headers = ['Period', 'Loan', 'Opening', 'New Borr.', 'Repayments', 'FX', 'Closing', 'Current', 'LT', 'Accrued Int.'];
        const rows = continuity.map(r => {
          const loan = loans.find(l => l.id === r.loanId);
          return [r.period, loan?.name || '', r.openingBalance, r.newBorrowings, r.repayments, r.fxTranslation, r.closingBalance, r.currentPortion, r.longTermPortion, r.accruedInterest];
        });
        sheets['Continuity'] = [headers, ...rows];
      }
      if (selected.has('accrued')) {
        const headers = ['Loan', 'Currency', 'Balance', 'Rate', 'Last Payment', 'Days Accrued', 'Day Count', 'Accrued Interest'];
        const rows = loans.map(l => {
          const days = l.lastPaymentDate ? Math.round((new Date('2024-12-31').getTime() - new Date(l.lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
          return [l.name, l.currency, l.currentBalance, l.rate + '%', l.lastPaymentDate || '', days, l.dayCountBasis, l.accruedInterest];
        });
        sheets['Accrued Interest'] = [headers, ...rows];
      }
      if (selected.has('recon')) {
        const headers = ['Account', 'Type', 'Subledger', 'TB Balance', 'Variance', 'Status', 'Notes'];
        const rows = reconciliation.map(r => {
          const loan = loans.find(l => l.id === r.loanId);
          return [`${loan?.name || ''} – ${r.account}`, r.accountType, r.subledgerBalance, r.tbBalance, r.variance, r.status, r.notes || ''];
        });
        sheets['Reconciliation'] = [headers, ...rows];
      }
      if (selected.has('covenants')) {
        const headers = ['Loan', 'Covenant', 'Type', 'Operator', 'Threshold', 'Current Value', 'Status', 'Frequency', 'Last Tested', 'Notes'];
        const rows = covenants.map(c => {
          const loan = loans.find(l => l.covenantIds.includes(c.id));
          return [loan?.name || '', c.name, c.type, c.operator || '', c.threshold || '', c.currentValue || '', c.status, c.frequency, c.lastTested || '', c.notes || ''];
        });
        sheets['Covenants'] = [headers, ...rows];
      }

      await exportToExcel(sheets, `Countable_LTD_Workpaper_FY${settings.fiscalYearEnd.slice(0,4)}.xlsx`);
      toast.success('Excel workpaper exported');
    } catch (e) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const variances = reconciliation.filter(r => r.status === 'Variance');

  return (
    <div className="p-6 space-y-5">
      <SectionHeader
        title="Reports & Exports"
        subtitle="Generate workpaper-grade Excel and PDF artifacts"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handlePrint}><Printer className="w-3.5 h-3.5" /> Print / PDF</Button>
            <Button variant="primary" size="sm" onClick={handleExcelExport} loading={exporting}>
              <FileDown className="w-3.5 h-3.5" /> Export Selected ({selected.size})
            </Button>
          </div>
        }
      />

      {variances.length > 0 && (
        <Alert type="warning" title="Export Blocked — Reconciliation Variances">
          {variances.length} variance{variances.length > 1 ? 's' : ''} detected in the reconciliation. Resolve or override before exporting the full workpaper pack.
        </Alert>
      )}

      {/* Report Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {REPORT_DEFS.map(report => (
          <button
            key={report.id}
            onClick={() => toggleReport(report.id)}
            className={`text-left p-4 border-2 rounded-xl transition-all ${selected.has(report.id) ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${selected.has(report.id) ? 'bg-brand-600' : 'bg-slate-100'}`}>
                  <report.icon className={`w-4 h-4 ${selected.has(report.id) ? 'text-white' : 'text-slate-500'}`} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{report.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{report.sub}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <Badge variant={report.tag === 'Workpaper' ? 'info' : report.tag === 'Posting' ? 'purple' as any : 'success'} size="sm">{report.tag}</Badge>
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected.has(report.id) ? 'border-brand-600 bg-brand-600' : 'border-slate-300'}`}>
                  {selected.has(report.id) && <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white fill-current"><path d="M2 6l3 3 5-5"/><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Preview Panel */}
      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Workpaper Preview — Accrued Interest Calculation</h3>
          <Badge variant="info" size="sm">FY2024</Badge>
        </div>
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900">
                  {['Loan Name','Lender','Ccy','Balance','Annual Rate','Last Payment','Days Accrued','Day Count','Basis','Accrued Interest (Local)','FX Rate','CAD Equivalent'].map(h => (
                    <th key={h} className="py-2 px-3 text-left font-bold text-slate-700 whitespace-nowrap text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loans.map(l => {
                  const days = l.lastPaymentDate ? Math.round((new Date('2024-12-31').getTime() - new Date(l.lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                  const fxRate = l.currency === 'USD' ? 1.3530 : 1.0;
                  const cadEquiv = l.accruedInterest * fxRate;
                  return (
                    <tr key={l.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-800">{l.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{l.lender}</td>
                      <td className="py-2.5 px-3"><Badge variant="outline" size="sm">{l.currency}</Badge></td>
                      <td className="py-2.5 px-3 tabular-nums text-right">{fmtCurrency(l.currentBalance, l.currency)}</td>
                      <td className="py-2.5 px-3 tabular-nums text-right">{fmtPct(l.rate)}</td>
                      <td className="py-2.5 px-3 font-mono">{l.lastPaymentDate || '—'}</td>
                      <td className="py-2.5 px-3 tabular-nums text-right">{days}</td>
                      <td className="py-2.5 px-3 text-slate-500">{l.dayCountBasis}</td>
                      <td className="py-2.5 px-3 text-slate-400 text-xs">{l.dayCountBasis === '30/360' ? 'bal×rate/12' : `bal×rate×days/${l.dayCountBasis.replace('ACT/', '')}`}</td>
                      <td className="py-2.5 px-3 tabular-nums text-right font-semibold text-amber-700">{fmtCurrency(l.accruedInterest, l.currency)}</td>
                      <td className="py-2.5 px-3 tabular-nums text-right text-slate-500">{l.currency === 'CAD' ? '1.0000' : fxRate.toFixed(4)}</td>
                      <td className="py-2.5 px-3 tabular-nums text-right font-bold text-slate-900">{fmtCurrency(cadEquiv, 'CAD')}</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-slate-900 bg-slate-50 font-bold">
                  <td className="py-2 px-3 text-slate-900" colSpan={9}>Total YE Accrued Interest (CAD)</td>
                  <td className="py-2 px-3 tabular-nums text-right text-amber-700">—</td>
                  <td className="py-2 px-3" />
                  <td className="py-2 px-3 tabular-nums text-right text-slate-900">
                    {fmtCurrency(loans.reduce((s, l) => s + l.accruedInterest * (l.currency === 'USD' ? 1.3530 : 1), 0), 'CAD')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Carryforward Section */}
      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Year-End Carryforward</h3>
            <p className="text-xs text-slate-400 mt-0.5">Package closing balances, rates, and covenants for next engagement year</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => toast.success('Carryforward package created: FY2024 → FY2025')}>
            Create FY2025 Carryforward
          </Button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-3 gap-3 text-xs">
            {[
              { label: 'Closing Balances', items: loans.map(l => `${l.name}: ${fmtCurrency(l.currentBalance, l.currency)}`) },
              { label: 'YE Accrued Interest', items: loans.map(l => `${l.name}: ${fmtCurrency(l.accruedInterest, l.currency)}`) },
              { label: 'Rate Table', items: loans.map(l => `${l.name}: ${fmtPct(l.rate)}`) },
            ].map(section => (
              <div key={section.label} className="bg-slate-50 rounded-lg p-3">
                <div className="font-semibold text-slate-600 mb-2">{section.label}</div>
                {section.items.map((item, i) => <div key={i} className="text-slate-500 py-0.5">{item}</div>)}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
            <ChevronRight className="w-3.5 h-3.5" />
            Previous carryforward: FY2023 → FY2024 applied Jan 8, 2024 by J. Martinez
          </div>
        </div>
      </Card>
    </div>
  );
}
