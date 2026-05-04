import { useState, useMemo } from 'react';
import { Badge } from '@/components/wp-ui/badge';
import type { FxScheduleResult } from '@/lib/luka/compute';
import { fmtNum, fmtCcy, fmtSigned } from './InvHoldingsTab';
import { ColFilter, SearchFilter, ClearFiltersBtn } from './InvTableFilters';

interface Props {
  fxSchedule: FxScheduleResult;
}

export function InvFXTab({ fxSchedule }: Props) {
  const [filterSecurity, setFilterSecurity] = useState("");
  const [filterCcy,      setFilterCcy]      = useState("");

  const anyFilter = filterSecurity || filterCcy;

  const uniqueCcys = useMemo(
    () => Array.from(new Set(fxSchedule.events.map((e) => e.ccy))).sort(),
    [fxSchedule.events],
  );

  const visibleEvents = useMemo(() => {
    let evts = fxSchedule.events;
    if (filterSecurity)
      evts = evts.filter(
        (e) =>
          e.security.toLowerCase().includes(filterSecurity.toLowerCase()) ||
          e.ticker.toLowerCase().includes(filterSecurity.toLowerCase()),
      );
    if (filterCcy) evts = evts.filter((e) => e.ccy === filterCcy);
    return evts;
  }, [fxSchedule.events, filterSecurity, filterCcy]);

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">FX Schedule</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Period rates and realized FX on disposals &amp; cash conversions
          </p>
        </div>
      </div>

      {/* Period rates — small reference table, no filter needed */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border font-semibold text-sm">Period rates used (per CAD)</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Currency</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Opening</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Average</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Closing</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source</th>
            </tr>
          </thead>
          <tbody>
            {fxSchedule.rates.map((r) => (
              <tr key={r.ccy} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3"><Badge variant="outline" className="text-xs font-mono">{r.ccy}</Badge></td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtNum(r.opening, 4)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtNum(r.average, 4)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtNum(r.closing, 4)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.rateSource}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FX events */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border font-semibold text-sm flex items-center justify-between flex-wrap gap-2">
          <div>
            <span>Realized FX on disposals &amp; conversions</span>
            <span className="ml-2 text-xs text-muted-foreground font-normal">→ TB <span className="font-mono">4500 · FX Gain/(Loss)</span></span>
          </div>
          {anyFilter && (
            <ClearFiltersBtn onClick={() => { setFilterSecurity(""); setFilterCcy(""); }} />
          )}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <SearchFilter label="Security" value={filterSecurity} onChange={setFilterSecurity} placeholder="Ticker or name…" />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <ColFilter label="CCY" options={uniqueCcys} value={filterCcy} onChange={setFilterCcy} />
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Foreign Amount</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rate at Acq</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rate at Txn</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Realized FX (CAD)</th>
            </tr>
          </thead>
          <tbody>
            {visibleEvents.map((e, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-xs">{e.date}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="font-medium">{e.security}</div>
                  <div className="text-xs text-muted-foreground font-mono">{e.ticker}</div>
                </td>
                <td className="px-4 py-3"><Badge variant="outline" className="text-xs font-mono">{e.ccy}</Badge></td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtCcy(e.foreignAmount, e.ccy)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtNum(e.rateAtAcq, 4)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtNum(e.rateAtTxn, 4)}</td>
                <td className={`px-4 py-3 text-right tabular-nums ${e.realizedFxCAD >= 0 ? "text-green-600" : "text-destructive"}`}>
                  {fmtSigned(e.realizedFxCAD)}
                </td>
              </tr>
            ))}
            {visibleEvents.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-sm text-muted-foreground py-6">
                  {anyFilter ? "No FX events match the active filters." : "No FX events in period."}
                </td>
              </tr>
            )}
            <tr className="bg-muted/40 font-semibold">
              <td colSpan={6} className="px-4 py-3 text-sm">Total Realized FX</td>
              <td className={`px-4 py-3 text-right tabular-nums ${fxSchedule.totalRealizedFxCAD >= 0 ? "text-green-600" : "text-destructive"}`}>
                {fmtSigned(fxSchedule.totalRealizedFxCAD)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
