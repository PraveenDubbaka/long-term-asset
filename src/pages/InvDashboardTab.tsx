import React from 'react';
import { Download, TrendingUp, DollarSign, BarChart3, Briefcase, Percent } from 'lucide-react';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { glSummaryRows, realizedRows, dividendRows, unrealizedRows, holdings, incomeExpenseRows } from '../data/investmentData';
import { fmtDateDisplay } from '../lib/utils';
import toast from 'react-hot-toast';

function fmt(n: number, d = 2) { return n.toLocaleString('en-CA', { minimumFractionDigits: d, maximumFractionDigits: d }); }
function fmtCAD(n: number) { return fmt(Math.abs(n)); }
function glColor(_n: number) { return 'text-foreground'; }

export function InvDashboardTab() {
  const totalOpen     = glSummaryRows.reduce((s, r) => s + r.openingCAD, 0);
  const totalPurch    = glSummaryRows.reduce((s, r) => s + r.purchasesCAD, 0);
  const totalDisp     = glSummaryRows.reduce((s, r) => s + r.disposalsAtCostCAD, 0);
  const totalRealGL   = glSummaryRows.reduce((s, r) => s + r.realizedGL_CAD, 0);
  const totalDiv      = glSummaryRows.reduce((s, r) => s + r.dividendsCAD, 0);
  const totalROC      = glSummaryRows.reduce((s, r) => s + r.rocCAD, 0);
  const totalClose    = glSummaryRows.reduce((s, r) => s + r.closingCAD, 0);
  const totalFmvCAD   = holdings.reduce((s, h) => s + h.fmvCAD, 0);
  const totalUnreal   = unrealizedRows.reduce((s, r) => s + r.unrealizedGL_CAD, 0);
  const totalFees     = incomeExpenseRows
    .filter(r => r.txnType === 'Account Fees' || r.txnType === 'Management Fees')
    .reduce((s, r) => s + Math.abs(r.cadAmount), 0);
  const totalWHT      = incomeExpenseRows
    .filter(r => r.txnType === 'Withholding Tax')
    .reduce((s, r) => s + Math.abs(r.cadAmount), 0);

  const handleExport = async () => {
    try {
      const rows = glSummaryRows.map(r => ({
        Security: r.security, Broker: r.broker, Account: `…${r.acctLast4}`, Currency: r.currency,
        'Opening (CAD)': r.openingCAD, 'Purchases (CAD)': r.purchasesCAD,
        'Disposals at Cost (CAD)': r.disposalsAtCostCAD, 'Realized G/L (CAD)': r.realizedGL_CAD,
        'Dividends (CAD)': r.dividendsCAD, 'ROC (CAD)': r.rocCAD,
        'FX Adj (CAD)': r.fxAdjCAD, 'Closing Balance (CAD)': r.closingCAD,
      }));
      const { exportToExcel, objsToAOA } = await import('../lib/utils');
      exportToExcel({ 'GL Summary': objsToAOA(rows) }, 'INV_GL_Summary_FY2025.xlsx');
      toast.success('GL Summary exported');
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="px-6 py-6 space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Investment Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            GL roll-forward summary · FY January 1 – December 31, 2025 · ASPE cost method
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download className="w-3.5 h-3.5 mr-1.5" /> Export GL Summary
        </Button>
      </div>

      {/* ── KPI strip ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Holdings (Closing Book)',   value: fmtCAD(totalClose),    icon: Briefcase,  color: 'text-foreground',    sub: 'Book value CAD' },
          { label: 'Total Purchases (FY)',      value: fmtCAD(totalPurch),    icon: DollarSign, color: 'text-foreground',     sub: 'Acquisitions' },
          { label: 'Realized G/L',             value: (totalRealGL >= 0 ? '+' : '-') + fmtCAD(totalRealGL), icon: TrendingUp, color: 'text-foreground', sub: 'On disposals' },
          { label: 'Unrealized G/L (Discl.)',  value: '+' + fmtCAD(totalUnreal), icon: BarChart3, color: 'text-foreground',  sub: 'FMV vs cost' },
          { label: 'Fees & WHT (FY)',           value: `(${fmtCAD(totalFees + totalWHT)})`, icon: Percent, color: 'text-foreground',
            sub: `Fees $${fmt(totalFees)} · WHT $${fmt(totalWHT)}` },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-xs text-muted-foreground leading-snug">{k.label}</p>
              <k.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
            <p className={`mt-2 text-2xl font-semibold tabular-nums ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Roll-forward equation ────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Investment Account Roll-Forward (CAD)
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[
            { label: 'Opening Balance',    value: fmtCAD(totalOpen),  color: 'text-foreground' },
            { label: '+ Purchases',        value: fmtCAD(totalPurch), color: 'text-foreground' },
            { label: '− Disposals (Cost)', value: fmtCAD(totalDisp),  color: 'text-foreground' },
            { label: '= Closing Balance',  value: fmtCAD(totalClose), color: 'text-foreground font-bold' },
          ].map((item, i) => (
            <React.Fragment key={item.label}>
              {i > 0 && <span className="text-muted-foreground">→</span>}
              <div className="flex flex-col items-center bg-muted/40 rounded-xl px-4 py-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">{item.label}</span>
                <span className={`tabular-nums font-mono text-sm ${item.color}`}>{item.value}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Income summary (3-up) ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Realized G/L */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Realized Gain / Loss</p>
          <p className={`text-2xl font-semibold tabular-nums ${glColor(totalRealGL)}`}>
            {totalRealGL >= 0 ? '+' : ''}{fmtCAD(totalRealGL)}
          </p>
          <div className="mt-3 space-y-1">
            {realizedRows.map(r => (
              <div key={r.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{r.ticker} ({fmtDateDisplay(r.date)})</span>
                <span className={`tabular-nums ${glColor(r.realizedGL_CAD)}`}>
                  {r.realizedGL_CAD >= 0 ? '+$' : '($'}{fmt(Math.abs(r.realizedGL_CAD))}{r.realizedGL_CAD < 0 ? ')' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dividend Income */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Dividend Income</p>
          <p className="text-2xl font-semibold tabular-nums text-foreground">+{fmtCAD(totalDiv)}</p>
          <div className="mt-3 space-y-1">
            {dividendRows.map(r => (
              <div key={r.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{r.ticker} ({r.broker.split(' ')[0]})</span>
                <span className="tabular-nums text-foreground">+{fmt(r.totalDivCAD)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FMV vs Book */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">FMV vs Book (Dec 31)</p>
          <p className="text-2xl font-semibold tabular-nums text-foreground">+{fmtCAD(totalUnreal)}</p>
          <p className="text-xs text-muted-foreground mt-1">Disclosure only — ASPE cost method</p>
          <div className="mt-2 grid grid-cols-2 gap-1">
            <div className="text-xs text-muted-foreground">Book Value:</div>
            <div className="text-xs tabular-nums font-mono text-right">{fmtCAD(totalClose)}</div>
            <div className="text-xs text-muted-foreground">Fair Value:</div>
            <div className="text-xs tabular-nums font-mono text-right text-foreground">{fmtCAD(totalFmvCAD)}</div>
            <div className="text-xs text-muted-foreground">Difference:</div>
            <div className="text-xs tabular-nums font-mono text-right text-foreground">+{fmtCAD(totalFmvCAD - totalClose)}</div>
          </div>
        </div>
      </div>

      {/* ── GL Summary Roll-forward Table ────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">GL Summary — Investment Account Roll-Forward</h3>
          <Badge variant="info" className="text-xs">Account 1310</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Security</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Broker / Acct</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">CCY</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Opening</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Purchases</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Disposals</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Realized G/L</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dividends</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">ROC</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Closing</th>
              </tr>
            </thead>
            <tbody>
              {glSummaryRows.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{r.security}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-foreground">{r.broker}</div>
                    <div className="text-xs text-muted-foreground font-mono">…{r.acctLast4}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-xs font-mono">{r.currency}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">
                    {fmtCAD(r.openingCAD)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">{fmtCAD(r.purchasesCAD)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs text-foreground">
                    {r.disposalsAtCostCAD > 0 ? `(${fmtCAD(r.disposalsAtCostCAD)})` : fmtCAD(0)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">
                    {r.realizedGL_CAD > 0 ? '+' : ''}{fmtCAD(r.realizedGL_CAD)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">
                    +{fmtCAD(r.dividendsCAD)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">
                    {fmtCAD(r.rocCAD)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-sm font-semibold">{fmtCAD(r.closingCAD)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/40 font-semibold">
                <td colSpan={3} className="px-4 py-3 text-xs font-semibold">TOTALS</td>
                <td className="px-4 py-3 text-right tabular-nums text-xs">{fmtCAD(totalOpen)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-sm font-semibold">{fmtCAD(totalPurch)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-sm font-semibold text-foreground">({fmtCAD(totalDisp)})</td>
                <td className="px-4 py-3 text-right tabular-nums text-sm font-semibold">
                  <span className="text-foreground">{totalRealGL >= 0 ? '+' : ''}{fmtCAD(totalRealGL)}</span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-sm font-semibold text-foreground">+{fmtCAD(totalDiv)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-sm font-semibold text-foreground">{fmtCAD(totalROC)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-sm font-semibold">{fmtCAD(totalClose)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
}
