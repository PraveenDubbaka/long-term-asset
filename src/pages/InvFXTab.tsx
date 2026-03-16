import React, { useState } from 'react';
import { Download, TrendingUp } from 'lucide-react';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import { fxRates, fxSchedule } from '../data/investmentData';
import { fmtDateDisplay } from '../lib/utils';
import toast from 'react-hot-toast';

function fmt(n: number, d = 4) { return n.toLocaleString('en-CA', { minimumFractionDigits: d, maximumFractionDigits: d }); }
function fmt2(n: number) { return n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtCAD(n: number) { return '$' + fmt2(Math.abs(n)); }

// Summary stats from fxRates
const txnRates = fxRates.filter(r => !r.notes?.includes('Year-end'));
const avgUSD = txnRates.reduce((s, r) => s + r.usdCad, 0) / txnRates.length;
const avgEUR = txnRates.reduce((s, r) => s + r.eurCad, 0) / txnRates.length;
const avgGBP = txnRates.reduce((s, r) => s + r.gbpCad, 0) / txnRates.length;
const yeRate = fxRates[fxRates.length - 1];

export function InvFXTab() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'rates'>('schedule');

  const totalFxCostCAD = fxSchedule.reduce((s, r) => s + r.cadCost, 0);
  const totalFmvCAD    = fxSchedule.reduce((s, r) => s + r.fmvCAD, 0);
  const totalGL_CAD    = fxSchedule.reduce((s, r) => s + r.unrealizedGL_CAD, 0);

  const handleExport = async () => {
    try {
      const { exportToExcel, objsToAOA } = await import('../lib/utils');
      exportToExcel({
        'FX Schedule': objsToAOA(fxSchedule.map(r => ({
          Security: r.security, Ticker: r.ticker, Broker: r.broker, Account: `…${r.acctLast4}`,
          Currency: r.currency, 'YE Units': r.yeUnits, 'Foreign Cost': r.foreignCost,
          'Acq. Rate': r.acqRate, 'CAD Cost (Historical)': r.cadCost, 'YE FX Rate': r.yeFxRate,
          'FMV (Foreign)': r.fmvForeign, 'FMV (CAD)': r.fmvCAD, 'Unrealized G/L (CAD)': r.unrealizedGL_CAD,
        }))),
        'FX Rates': objsToAOA(fxRates.map(r => ({
          Date: r.date, 'USD/CAD': r.usdCad, 'EUR/CAD': r.eurCad, 'GBP/CAD': r.gbpCad, Notes: r.notes ?? '',
        }))),
      }, 'INV_FX_Schedule_FY2025.xlsx');
      toast.success('FX Schedule exported');
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">FX Schedule</h2>
          <p className="text-xs text-foreground/60 mt-0.5">Foreign-currency position translation · Historical CAD cost vs year-end FMV · Rates source: BoC</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
      </div>

      {/* Year-end rate summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'USD/CAD (Dec 31)', value: yeRate.usdCad.toFixed(4), sub: `Avg ${avgUSD.toFixed(4)}` },
          { label: 'EUR/CAD (Dec 31)', value: yeRate.eurCad.toFixed(4), sub: `Avg ${avgEUR.toFixed(4)}` },
          { label: 'GBP/CAD (Dec 31)', value: yeRate.gbpCad.toFixed(4), sub: `Avg ${avgGBP.toFixed(4)}` },
          { label: 'Foreign Positions', value: String(fxSchedule.length), sub: 'USD · EUR · GBP' },
        ].map(k => (
          <StyledCard key={k.label} className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary opacity-70" />
              <span className="text-xs text-muted-foreground">{k.label}</span>
            </div>
            <div className="text-xl font-bold tabular-nums text-foreground">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{k.sub}</div>
          </StyledCard>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 bg-card rounded-lg border border-border p-1 w-fit">
        {([['schedule', 'FX Translation Schedule'], ['rates', 'FX Rates Table']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}>{label}</button>
        ))}
      </div>

      {/* FX Translation Schedule */}
      {activeTab === 'schedule' && (
        <StyledCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">Security</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">Broker / Acct</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">CCY</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">YE Units</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap">Foreign Cost</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap">Acq. Rate</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap">CAD Cost (Hist.)</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap">YE Rate</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap">FMV (Foreign)</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap">FMV (CAD) ①</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap">Unrealized G/L (CAD) ①</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fxSchedule.map(r => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-sm text-foreground">{r.security}</div>
                      <div className="text-xs font-mono text-muted-foreground">{r.ticker}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-sm text-foreground">{r.broker}</div>
                      <div className="text-xs text-muted-foreground">…{r.acctLast4}</div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Badge variant="outline" className="text-xs">{r.currency}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">{fmt2(r.yeUnits).replace('.00','')}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">{fmt2(r.foreignCost)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">{fmt(r.acqRate)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono font-semibold text-sm">{fmtCAD(r.cadCost)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">{fmt(r.yeFxRate)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm text-muted-foreground">{fmt2(r.fmvForeign)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm text-muted-foreground">{fmtCAD(r.fmvCAD)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono font-semibold text-sm">
                      <span className={r.unrealizedGL_CAD >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {r.unrealizedGL_CAD >= 0 ? '+$' : '($'}{fmt2(Math.abs(r.unrealizedGL_CAD))}{r.unrealizedGL_CAD < 0 ? ')' : ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/60">
                  <td colSpan={6} className="px-4 py-2.5 text-xs font-semibold">Total Foreign Positions (CAD)</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm">{fmtCAD(totalFxCostCAD)}</td>
                  <td />
                  <td />
                  <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm text-muted-foreground">{fmtCAD(totalFmvCAD)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm text-green-600">
                    +${fmt2(totalGL_CAD)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
            ① FMV and Unrealized G/L disclosed per ASPE 3856.06(c) — no income statement impact under cost method.
          </div>
        </StyledCard>
      )}

      {/* FX Rates Table */}
      {activeTab === 'rates' && (
        <StyledCard className="overflow-hidden p-0">
          <div className="overflow-x-auto max-h-[520px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border bg-muted/80">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">Date</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">USD / CAD</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">EUR / CAD</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">GBP / CAD</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fxRates.map((r, i) => (
                  <tr key={i} className={`hover:bg-muted/20 ${r.notes?.includes('Year-end') ? 'bg-primary/5 font-semibold' : ''}`}>
                    <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">{fmtDateDisplay(r.date)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-mono text-sm">{fmt(r.usdCad)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-mono text-sm">{fmt(r.eurCad)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-mono text-sm">{fmt(r.gbpCad)}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{r.notes ?? ''}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/60">
                  <td className="px-4 py-2.5 text-xs font-semibold">Simple Average</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">{fmt(avgUSD)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">{fmt(avgEUR)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">{fmt(avgGBP)}</td>
                  <td />
                </tr>
                <tr className="bg-primary/5">
                  <td className="px-4 py-2.5 text-xs font-semibold">Dec 31 Closing Rate</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-mono font-semibold text-sm">{fmt(yeRate.usdCad)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-mono font-semibold text-sm">{fmt(yeRate.eurCad)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-mono font-semibold text-sm">{fmt(yeRate.gbpCad)}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">▶ Used for YE FMV translation</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </StyledCard>
      )}
    </div>
  );
}
