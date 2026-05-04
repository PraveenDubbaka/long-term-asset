import { useState, useMemo } from 'react';
import { Badge } from '@/components/wp-ui/badge';
import type { FxScheduleResult } from '@/lib/luka/compute';
import type { FxRateInfo } from '@/lib/luka/types';
import { fmtNum, fmtCcy, fmtSigned } from './InvHoldingsTab';
import { ColFilter, SearchFilter, ClearFiltersBtn } from './InvTableFilters';
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  fxSchedule: FxScheduleResult;
}

export function InvFXTab({ fxSchedule }: Props) {
  const [filterSecurity, setFilterSecurity] = useState("");
  const [filterCcy,      setFilterCcy]      = useState("");

  // Period rates CRUD
  const [localRates, setLocalRates] = useState<FxRateInfo[]>(() => fxSchedule.rates.map(r => ({...r})));
  const [editRateCcy, setEditRateCcy] = useState<string | null>(null);
  const [editRateData, setEditRateData] = useState<Partial<FxRateInfo>>({});
  const [addingRate, setAddingRate] = useState(false);
  const [newRate, setNewRate] = useState<Partial<FxRateInfo>>({});

  // FX events hide
  const [hiddenFxEvents, setHiddenFxEvents] = useState<Set<number>>(new Set());

  const anyFilter = filterSecurity || filterCcy;

  const uniqueCcys = useMemo(
    () => Array.from(new Set(fxSchedule.events.map((e) => e.ccy))).sort(),
    [fxSchedule.events],
  );

  const visibleEvents = useMemo(() => {
    let evts = fxSchedule.events.filter((_, i) => !hiddenFxEvents.has(i));
    if (filterSecurity)
      evts = evts.filter(
        (e) =>
          e.security.toLowerCase().includes(filterSecurity.toLowerCase()) ||
          e.ticker.toLowerCase().includes(filterSecurity.toLowerCase()),
      );
    if (filterCcy) evts = evts.filter((e) => e.ccy === filterCcy);
    return evts;
  }, [fxSchedule.events, filterSecurity, filterCcy, hiddenFxEvents]);

  // We need original indices for the visible events to properly track hidden
  const visibleEventsWithIndex = useMemo(() => {
    return fxSchedule.events
      .map((e, i) => ({ e, i }))
      .filter(({ i }) => !hiddenFxEvents.has(i))
      .filter(({ e }) => {
        if (filterSecurity && !e.security.toLowerCase().includes(filterSecurity.toLowerCase()) && !e.ticker.toLowerCase().includes(filterSecurity.toLowerCase())) return false;
        if (filterCcy && e.ccy !== filterCcy) return false;
        return true;
      });
  }, [fxSchedule.events, hiddenFxEvents, filterSecurity, filterCcy]);

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
              <th className="px-3 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {localRates.map(r => (
              <tr key={r.ccy} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                <td className="px-4 py-3"><Badge variant="outline" className="text-xs font-mono">{r.ccy}</Badge></td>
                {editRateCcy === r.ccy ? (
                  <>
                    <td className="px-4 py-3 text-right"><input type="number" value={editRateData.opening ?? r.opening} onChange={e => setEditRateData(d => ({...d, opening: parseFloat(e.target.value)||0}))} className="h-7 w-24 text-xs px-2 border border-border rounded-md bg-background text-right" /></td>
                    <td className="px-4 py-3 text-right"><input type="number" value={editRateData.average ?? r.average} onChange={e => setEditRateData(d => ({...d, average: parseFloat(e.target.value)||0}))} className="h-7 w-24 text-xs px-2 border border-border rounded-md bg-background text-right" /></td>
                    <td className="px-4 py-3 text-right"><input type="number" value={editRateData.closing ?? r.closing} onChange={e => setEditRateData(d => ({...d, closing: parseFloat(e.target.value)||0}))} className="h-7 w-24 text-xs px-2 border border-border rounded-md bg-background text-right" /></td>
                    <td className="px-4 py-3 text-xs"><input value={editRateData.rateSource ?? r.rateSource} onChange={e => setEditRateData(d => ({...d, rateSource: e.target.value}))} className="h-7 w-32 text-xs px-2 border border-border rounded-md bg-background" /></td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-right tabular-nums">{fmtNum(r.opening, 4)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmtNum(r.average, 4)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmtNum(r.closing, 4)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.rateSource}</td>
                  </>
                )}
                <td className="px-3 py-3">
                  {editRateCcy === r.ccy ? (
                    <div className="flex gap-0.5">
                      <button onClick={() => { setLocalRates(prev => prev.map(x => x.ccy === r.ccy ? {...x, ...editRateData} : x)); setEditRateCcy(null); toast.success('Rate updated'); }} className="p-1.5 rounded-md hover:bg-green-50 text-muted-foreground hover:text-green-600 transition-colors"><Check className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setEditRateCcy(null)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ) : (
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditRateCcy(r.ccy); setEditRateData({}); }} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { setLocalRates(prev => prev.filter(x => x.ccy !== r.ccy)); toast.success('Rate removed'); }} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          {addingRate && (
            <tfoot>
              <tr className="bg-primary/5">
                <td className="px-4 py-2"><input placeholder="CCY" value={newRate.ccy ?? ''} onChange={e => setNewRate(d => ({...d, ccy: e.target.value.toUpperCase() as FxRateInfo['ccy']}))} className="h-7 w-16 text-xs px-2 border border-border rounded-md bg-background font-mono" /></td>
                <td className="px-4 py-2 text-right"><input type="number" placeholder="1.0000" value={newRate.opening ?? ''} onChange={e => setNewRate(d => ({...d, opening: parseFloat(e.target.value)||0}))} className="h-7 w-24 text-xs px-2 border border-border rounded-md bg-background text-right" /></td>
                <td className="px-4 py-2 text-right"><input type="number" placeholder="1.0000" value={newRate.average ?? ''} onChange={e => setNewRate(d => ({...d, average: parseFloat(e.target.value)||0}))} className="h-7 w-24 text-xs px-2 border border-border rounded-md bg-background text-right" /></td>
                <td className="px-4 py-2 text-right"><input type="number" placeholder="1.0000" value={newRate.closing ?? ''} onChange={e => setNewRate(d => ({...d, closing: parseFloat(e.target.value)||0}))} className="h-7 w-24 text-xs px-2 border border-border rounded-md bg-background text-right" /></td>
                <td className="px-4 py-2"><input placeholder="Source" value={newRate.rateSource ?? ''} onChange={e => setNewRate(d => ({...d, rateSource: e.target.value}))} className="h-7 w-32 text-xs px-2 border border-border rounded-md bg-background" /></td>
                <td className="px-3 py-2"><div className="flex gap-0.5">
                  <button onClick={() => {
                    if (!newRate.ccy) { toast.error('Enter a currency code'); return; }
                    setLocalRates(prev => [...prev, { ccy: newRate.ccy!, opening: newRate.opening ?? 1, average: newRate.average ?? 1, closing: newRate.closing ?? 1, rateSource: newRate.rateSource ?? 'Manual' }]);
                    setAddingRate(false);
                    toast.success('Rate added');
                  }} className="p-1.5 rounded-md hover:bg-green-50 text-muted-foreground hover:text-green-600 transition-colors"><Check className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setAddingRate(false)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><X className="h-3.5 w-3.5" /></button>
                </div></td>
              </tr>
            </tfoot>
          )}
        </table>
        <button onClick={() => { setAddingRate(true); setNewRate({}); }} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 px-4 py-2.5 w-full border-t border-dashed border-border hover:bg-muted/30 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add FX Rate
        </button>
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
              <th className="px-3 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {visibleEventsWithIndex.map(({ e, i }) => (
              <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
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
                <td className="px-3 py-3">
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => toast('Edit source transactions to modify FX events')} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setHiddenFxEvents(prev => { const n = new Set(prev); n.add(i); return n; })} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {visibleEventsWithIndex.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-sm text-muted-foreground py-6">
                  {anyFilter ? "No FX events match the active filters." : "No FX events in period."}
                </td>
              </tr>
            )}
            <tr className="bg-muted/40 font-semibold">
              <td colSpan={6} className="px-4 py-3 text-sm">Total Realized FX</td>
              <td className={`px-4 py-3 text-right tabular-nums ${fxSchedule.totalRealizedFxCAD >= 0 ? "text-green-600" : "text-destructive"}`}>
                {fmtSigned(fxSchedule.totalRealizedFxCAD)}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
