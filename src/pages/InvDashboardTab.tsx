import React from 'react';
import { Download, TrendingUp, DollarSign, BarChart3, Briefcase } from 'lucide-react';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import { glSummaryRows, realizedRows, dividendRows, unrealizedRows, holdings } from '../data/investmentData';
import { fmtDateDisplay } from '../lib/utils';
import toast from 'react-hot-toast';

function fmt(n: number, d = 2) { return n.toLocaleString('en-CA', { minimumFractionDigits: d, maximumFractionDigits: d }); }
function fmtCAD(n: number) { return '$' + fmt(Math.abs(n)); }
function glColor(n: number) { return n > 0 ? 'text-green-600' : n < 0 ? 'text-red-600' : 'text-foreground'; }

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
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Investment Dashboard</h2>
          <p className="text-xs text-foreground mt-0.5">GL roll-forward summary · FY January 1 – December 31, 2025 · ASPE cost method</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download className="w-3.5 h-3.5" /> Export GL Summary
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Holdings (Closing Book)',  value: fmtCAD(totalClose),    icon: Briefcase,   color: 'text-foreground' },
          { label: 'Total Purchases (FY)',     value: fmtCAD(totalPurch),    icon: DollarSign,  color: 'text-primary' },
          { label: 'Realized G/L',             value: (totalRealGL >= 0 ? '+' : '') + fmtCAD(totalRealGL), icon: TrendingUp, color: glColor(totalRealGL) },
          { label: 'Unrealized G/L (Discl.)', value: '+' + fmtCAD(totalUnreal), icon: BarChart3, color: 'text-green-600' },
        ].map(k => (
          <StyledCard key={k.label} className="p-3 flex items-center gap-3">
            <k.icon className={`w-8 h-8 ${k.color} opacity-70`} />
            <div>
              <div className={`text-sm font-bold tabular-nums ${k.color}`}>{k.value}</div>
              <div className="text-xs text-foreground">{k.label}</div>
            </div>
          </StyledCard>
        ))}
      </div>

      {/* GL Roll-forward equation */}
      <StyledCard className="p-4">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Investment Account Roll-Forward (CAD)</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[
            { label: 'Opening Balance', value: fmtCAD(totalOpen), color: 'text-foreground' },
            { label: '+ Purchases',     value: fmtCAD(totalPurch), color: 'text-primary' },
            { label: '− Disposals (Cost)', value: fmtCAD(totalDisp), color: 'text-red-500' },
            { label: '= Closing Balance', value: fmtCAD(totalClose), color: 'text-foreground font-bold' },
          ].map((item, i) => (
            <React.Fragment key={item.label}>
              {i > 0 && <span className="text-foreground">→</span>}
              <div className="flex flex-col items-center bg-muted rounded-lg px-4 py-2">
                <span className="text-xs text-foreground whitespace-nowrap">{item.label}</span>
                <span className={`tabular-nums font-mono text-sm ${item.color}`}>{item.value}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </StyledCard>

      {/* Income summary */}
      <div className="grid grid-cols-3 gap-3">
        <StyledCard className="p-4">
          <div className="text-xs text-foreground uppercase tracking-wider mb-2">Realized Gain / Loss</div>
          <div className={`text-xl font-bold tabular-nums ${glColor(totalRealGL)}`}>
            {totalRealGL >= 0 ? '+' : ''}{fmtCAD(totalRealGL)}
          </div>
          <div className="mt-2 space-y-1">
            {realizedRows.map(r => (
              <div key={r.id} className="flex items-center justify-between text-xs">
                <span className="text-foreground">{r.ticker} ({fmtDateDisplay(r.date)})</span>
                <span className={`tabular-nums ${glColor(r.realizedGL_CAD)}`}>
                  {r.realizedGL_CAD >= 0 ? '+$' : '($'}{fmt(Math.abs(r.realizedGL_CAD))}{r.realizedGL_CAD < 0 ? ')' : ''}
                </span>
              </div>
            ))}
          </div>
        </StyledCard>
        <StyledCard className="p-4">
          <div className="text-xs text-foreground uppercase tracking-wider mb-2">Dividend Income</div>
          <div className="text-xl font-bold tabular-nums text-green-600">+{fmtCAD(totalDiv)}</div>
          <div className="mt-2 space-y-1">
            {dividendRows.map(r => (
              <div key={r.id} className="flex items-center justify-between text-xs">
                <span className="text-foreground">{r.ticker} ({r.broker.split(' ')[0]})</span>
                <span className="tabular-nums text-green-600">+${fmt(r.totalDivCAD)}</span>
              </div>
            ))}
          </div>
        </StyledCard>
        <StyledCard className="p-4">
          <div className="text-xs text-foreground uppercase tracking-wider mb-2">FMV vs Book (Dec 31)</div>
          <div className="text-xl font-bold tabular-nums text-green-600">+{fmtCAD(totalUnreal)}</div>
          <div className="text-xs text-foreground mt-1">Disclosure only — ASPE cost method</div>
          <div className="mt-2 grid grid-cols-2 gap-1">
            <div className="text-xs text-foreground">Book Value:</div>
            <div className="text-xs tabular-nums font-mono text-right">{fmtCAD(totalClose)}</div>
            <div className="text-xs text-foreground">Fair Value:</div>
            <div className="text-xs tabular-nums font-mono text-right text-green-600">{fmtCAD(totalFmvCAD)}</div>
            <div className="text-xs text-foreground">Difference:</div>
            <div className="text-xs tabular-nums font-mono text-right text-green-600">+{fmtCAD(totalFmvCAD - totalClose)}</div>
          </div>
        </StyledCard>
      </div>

      {/* GL Summary Roll-forward Table */}
      <StyledCard className="overflow-hidden p-0">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">GL Summary — Investment Account Roll-Forward</h3>
          <Badge variant="info" className="text-xs">Account 1310</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase text-foreground">Security</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase text-foreground">Broker / Acct</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold uppercase text-foreground">CCY</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Opening</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Purchases</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Disposals</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Realized G/L</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground">Dividends</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground">ROC</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Closing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {glSummaryRows.map(r => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5 text-sm font-medium text-foreground">{r.security}</td>
                  <td className="px-3 py-2.5">
                    <div className="text-xs text-foreground">{r.broker}</div>
                    <div className="text-xs text-foreground">…{r.acctLast4}</div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Badge variant="outline" className="text-xs">{r.currency}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-mono text-xs text-foreground">
                    {r.openingCAD > 0 ? fmtCAD(r.openingCAD) : '00'}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">{fmtCAD(r.purchasesCAD)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm text-red-500">
                    {r.disposalsAtCostCAD > 0 ? `(${fmtCAD(r.disposalsAtCostCAD)})` : '00'}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">
                    {r.realizedGL_CAD !== 0
                      ? <span className={glColor(r.realizedGL_CAD)}>
                          {r.realizedGL_CAD > 0 ? '+' : ''}{fmtCAD(r.realizedGL_CAD)}
                        </span>
                      : <span className="text-foreground text-xs">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">
                    {r.dividendsCAD > 0 ? <span className="text-green-600">+{fmtCAD(r.dividendsCAD)}</span> : <span className="text-foreground text-xs">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">
                    {r.rocCAD !== 0 ? <span className="text-amber-600">{fmtCAD(r.rocCAD)}</span> : <span className="text-foreground text-xs">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm">{fmtCAD(r.closingCAD)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/60">
                <td colSpan={3} className="px-4 py-2.5 text-xs font-semibold">TOTALS</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-mono text-xs text-foreground">—</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm">{fmtCAD(totalPurch)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm text-red-500">({fmtCAD(totalDisp)})</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm">
                  <span className={glColor(totalRealGL)}>{totalRealGL >= 0 ? '+' : ''}{fmtCAD(totalRealGL)}</span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm text-green-600">+{fmtCAD(totalDiv)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm text-amber-600">{fmtCAD(totalROC)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm">{fmtCAD(totalClose)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </StyledCard>
    </div>
  );
}
