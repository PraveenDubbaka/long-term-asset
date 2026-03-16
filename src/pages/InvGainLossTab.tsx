import React, { useState } from 'react';
import { Download, TrendingUp, DollarSign, Eye } from 'lucide-react';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import { realizedRows, dividendRows, unrealizedRows } from '../data/investmentData';
import { fmtDateDisplay } from '../lib/utils';
import toast from 'react-hot-toast';

function fmt(n: number, d = 2) { return n.toLocaleString('en-CA', { minimumFractionDigits: d, maximumFractionDigits: d }); }
function fmtCAD(n: number) { return '$' + fmt(Math.abs(n)); }
function glColor(n: number) { return n > 0 ? 'text-green-600' : n < 0 ? 'text-red-600' : 'text-muted-foreground'; }

export function InvGainLossTab() {
  const [section, setSection] = useState<'realized' | 'dividends' | 'unrealized'>('realized');

  const totalRealizedCAD  = realizedRows.reduce((s, r) => s + r.realizedGL_CAD, 0);
  const totalDividendCAD  = dividendRows.reduce((s, r) => s + r.totalDivCAD, 0);
  const totalUnrealizedCAD = unrealizedRows.reduce((s, r) => s + r.unrealizedGL_CAD, 0);

  const handleExport = async () => {
    try {
      const { exportToExcel, objsToAOA } = await import('../lib/utils');
      exportToExcel({
        'Realized G-L': objsToAOA(realizedRows.map(r => ({
          Security: r.security, Ticker: r.ticker, Broker: r.broker, Date: r.date,
          'Units Sold': r.unitsSold, 'Proceeds (Local)': r.proceedsLocal, 'WAC Cost (Local)': r.wacCostLocal,
          'Realized G/L (Local)': r.realizedGL_Local, Currency: r.currency, 'FX Rate': r.fxRate,
          'Realized G/L (CAD)': r.realizedGL_CAD, Type: r.type, Notes: r.notes ?? '',
        }))),
        'Dividends': objsToAOA(dividendRows.map(r => ({
          Security: r.security, Ticker: r.ticker, Broker: r.broker, Currency: r.currency,
          'Total Div (Local)': r.totalDivLocal, 'Avg FX Rate': r.avgFxRate,
          'Total Div (CAD)': r.totalDivCAD, Notes: r.notes ?? '',
        }))),
        'Unrealized G-L': objsToAOA(unrealizedRows.map(r => ({
          Security: r.security, Ticker: r.ticker, Broker: r.broker, Currency: r.currency,
          'YE Units': r.yeUnits, 'Book Value (Local)': r.bookValueLocal, 'FMV (Local)': r.yeFmvLocal,
          'Unrealized G/L (Local)': r.unrealizedGL_Local, 'YE FX Rate': r.yeFxRate,
          'Unrealized G/L (CAD)': r.unrealizedGL_CAD, Notes: r.notes ?? '',
        }))),
      }, 'INV_GainLoss_FY2025.xlsx');
      toast.success('Gain/Loss exported (3 sheets)');
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Gain / Loss Schedule</h2>
          <p className="text-xs text-foreground/60 mt-0.5">Realized G/L · Dividend &amp; interest income · Unrealized G/L (disclosure only)</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Realized G/L', value: totalRealizedCAD,  icon: TrendingUp,  section: 'realized'   as const },
          { label: 'Dividend Income', value: totalDividendCAD, icon: DollarSign, section: 'dividends'  as const },
          { label: 'Unrealized G/L (Disclose Only)', value: totalUnrealizedCAD, icon: Eye, section: 'unrealized' as const },
        ].map(k => (
          <StyledCard key={k.label}
            className={`p-4 cursor-pointer transition-all ${section === k.section ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSection(k.section)}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
                <p className={`text-lg font-bold tabular-nums ${glColor(k.value)}`}>
                  {k.value >= 0 ? '+' : ''}{fmtCAD(k.value)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">CAD</p>
              </div>
              <k.icon className="w-6 h-6 text-muted-foreground opacity-60" />
            </div>
          </StyledCard>
        ))}
      </div>

      {/* Section A — Realized */}
      {section === 'realized' && (
        <StyledCard className="overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="text-sm font-semibold text-foreground">Section A — Realized Gain / Loss</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Dispositions in FY 2025 (capital gains — Schedule 3)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase text-foreground">Security</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase text-foreground">Broker</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase text-foreground">Date</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground">Units Sold</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Proceeds (Local)</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">WAC Cost (Local)</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">G/L (Local)</th>
                  <th className="text-center px-2 py-2.5 text-xs font-semibold uppercase text-foreground">CCY</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground">FX Rate</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">G/L (CAD)</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase text-foreground">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {realizedRows.map(r => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-sm text-foreground">{r.security}</div>
                      <div className="text-xs font-mono text-muted-foreground">{r.ticker}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-foreground">{r.broker.split(' ')[0]}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{fmtDateDisplay(r.date)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">{fmt(r.unitsSold, 0)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">{fmt(r.proceedsLocal)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm text-muted-foreground">{fmt(r.wacCostLocal)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">
                      <span className={glColor(r.realizedGL_Local)}>
                        {r.realizedGL_Local >= 0 ? '+' : ''}{fmt(Math.abs(r.realizedGL_Local))}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-center text-xs font-mono text-muted-foreground">{r.currency}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-xs">
                      {r.currency === 'CAD' ? '—' : fmt(r.fxRate, 4)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono font-semibold text-sm">
                      <span className={glColor(r.realizedGL_CAD)}>
                        {r.realizedGL_CAD >= 0 ? '+$' : '($'}{fmt(Math.abs(r.realizedGL_CAD))}{r.realizedGL_CAD < 0 ? ')' : ''}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.notes ?? ''}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/60">
                  <td colSpan={9} className="px-4 py-2.5 text-xs font-semibold">Total Realized G/L (CAD)</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm">
                    <span className={glColor(totalRealizedCAD)}>
                      +${fmtCAD(totalRealizedCAD)}
                    </span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </StyledCard>
      )}

      {/* Section B — Dividends */}
      {section === 'dividends' && (
        <StyledCard className="overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="text-sm font-semibold text-foreground">Section B — Dividend &amp; Interest Income</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Cash dividends received in FY 2025 · See AE-01 for ULVR ROC reclassification</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase text-foreground">Security</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase text-foreground">Broker</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold uppercase text-foreground">CCY</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Total Div (Local)</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Avg FX Rate</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Total Div (CAD)</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase text-foreground">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dividendRows.map(r => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-sm text-foreground">{r.security}</div>
                      <div className="text-xs font-mono text-muted-foreground">{r.ticker}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-foreground">{r.broker.split(' ')[0]}</td>
                    <td className="px-3 py-2.5 text-center text-xs font-mono text-muted-foreground">{r.currency}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">{fmt(r.totalDivLocal)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-xs text-muted-foreground">
                      {r.currency === 'CAD' ? '—' : fmt(r.avgFxRate, 4)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono font-semibold text-sm text-green-600">
                      +${fmt(r.totalDivCAD)}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.notes ?? ''}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/60">
                  <td colSpan={5} className="px-4 py-2.5 text-xs font-semibold">Total Dividend Income (CAD)</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm text-green-600">
                    +${fmt(totalDividendCAD)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </StyledCard>
      )}

      {/* Section C — Unrealized */}
      {section === 'unrealized' && (
        <StyledCard className="overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Section C — Unrealized Gain / Loss</h3>
                <p className="text-xs text-muted-foreground mt-0.5">FMV disclosure only — ASPE Section 3856 (cost method). No income statement impact.</p>
              </div>
              <Badge variant="warning" className="text-xs">Disclosure Only</Badge>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase text-foreground">Security</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase text-foreground">Broker</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold uppercase text-foreground">CCY</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground">YE Units</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Book Value (Local)</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">YE FMV (Local)</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">G/L (Local)</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">YE FX Rate</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">G/L (CAD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {unrealizedRows.map(r => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-sm text-foreground">{r.security}</div>
                      <div className="text-xs font-mono text-muted-foreground">{r.ticker}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-foreground">{r.broker.split(' ')[0]}</td>
                    <td className="px-3 py-2.5 text-center text-xs font-mono text-muted-foreground">{r.currency}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">{fmt(r.yeUnits, 0)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm text-muted-foreground">{fmt(r.bookValueLocal)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">{fmt(r.yeFmvLocal)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">
                      <span className={glColor(r.unrealizedGL_Local)}>
                        {r.unrealizedGL_Local >= 0 ? '+' : ''}{fmt(Math.abs(r.unrealizedGL_Local))}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-xs text-muted-foreground">
                      {r.currency === 'CAD' ? '—' : fmt(r.yeFxRate, 4)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono font-semibold text-sm">
                      <span className={glColor(r.unrealizedGL_CAD)}>
                        {r.unrealizedGL_CAD >= 0 ? '+$' : '($'}{fmt(Math.abs(r.unrealizedGL_CAD))}{r.unrealizedGL_CAD < 0 ? ')' : ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/60">
                  <td colSpan={8} className="px-4 py-2.5 text-xs font-semibold">Total Unrealized G/L (CAD) — Disclosure Only</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm text-green-600">
                    +${fmt(totalUnrealizedCAD)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </StyledCard>
      )}
    </div>
  );
}
