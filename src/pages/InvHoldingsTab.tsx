import React, { useState, useEffect } from 'react';
import { Download, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useTableColumns, useColumnResize, ThResizable, type ColDef } from '@/components/table-utils';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/wp-ui/dialog';
import { holdings as initialHoldings } from '../data/investmentData';
import type { Holding, InvCurrency } from '../types/investmentTypes';
import toast from 'react-hot-toast';

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-CA', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtCAD(n: number) { return '$' + fmt(Math.abs(n)); }

function glBadge(gl: number) {
  if (gl > 0) return <Badge variant="success"     className="text-xs tabular-nums">+{fmtCAD(gl)}</Badge>;
  if (gl < 0) return <Badge variant="destructive" className="text-xs tabular-nums">({fmtCAD(-gl)})</Badge>;
  return <Badge variant="outline" className="text-xs">—</Badge>;
}

const CURRENCIES: InvCurrency[] = ['CAD', 'USD', 'EUR', 'GBP'];

// Inline-cell input styles — global design system (matches Long-term Asset form style)
const BASE = 'input-double-border w-full h-8 text-xs rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground placeholder:text-foreground/60 transition-all duration-200 hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)] focus:outline-none';
const CI  = `${BASE} px-2.5`;                                      // text / date input
const CIS = `${BASE} pl-2.5 pr-6 appearance-none cursor-pointer`;  // select
const CIN = `${BASE} px-2.5 text-right tabular-nums`;

type HoldingDraft = Omit<Holding, 'id'>;

function blankDraft(): HoldingDraft {
  return {
    security: '', ticker: '', broker: '', acctLast4: '',
    currency: 'CAD', units: 0, wacLocal: 0, costLocal: 0,
    acqFxRate: 1, costCAD: 0, yeFxRate: 1,
    fmvLocal: 0, fmvCAD: 0, unrealizedGL_CAD: 0,
    glAccount: '1310', notes: '',
  };
}

// Column definitions
type InvColId =
  | 'security' | 'broker' | 'currency' | 'units' | 'wac'
  | 'costLocal' | 'acqRate' | 'bookValueCAD' | 'yeRate'
  | 'fmvLocal' | 'fmvCAD' | 'unrealizedGL' | 'glAcct';

const INV_COLS: ColDef<InvColId>[] = [
  { id: 'security',     label: 'Security',         pinned: true },
  { id: 'broker',       label: 'Broker / Acct' },
  { id: 'currency',     label: 'CCY' },
  { id: 'units',        label: 'Units' },
  { id: 'wac',          label: 'WAC / Unit' },
  { id: 'costLocal',    label: 'Cost (Local)' },
  { id: 'acqRate',      label: 'Acq. Rate' },
  { id: 'bookValueCAD', label: 'Book Value (CAD)' },
  { id: 'yeRate',       label: 'YE Rate' },
  { id: 'fmvLocal',     label: 'FMV (Local)' },
  { id: 'fmvCAD',       label: 'FMV (CAD)' },
  { id: 'unrealizedGL', label: 'Unrealized G/L' },
  { id: 'glAcct',       label: 'GL Acct' },
];

export function InvHoldingsTab() {
  const [holdingsState, setHoldingsState] = useState<Holding[]>([...initialHoldings]);
  const [search,        setSearch]        = useState('');
  const [filterCcy,     setFilterCcy]     = useState('All');
  const [filterBroker,  setFilterBroker]  = useState('All');
  const [liveRates,     setLiveRates]     = useState<Record<string, number>>({ USD: 1.4420, EUR: 1.5580, GBP: 1.8120 });
  const [ratesLoading,  setRatesLoading]  = useState(true);
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [draft,         setDraft]         = useState<HoldingDraft | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<{ id: string; label: string } | null>(null);

  const { isVisible: invVisible, setWidth: invSetWidth, getWidth: invGetWidth } = useTableColumns('inv-holdings', INV_COLS);
  const { onResizeStart: invResizeStart } = useColumnResize(invSetWidth);
  const irh = (id: InvColId) => (e: React.MouseEvent) => invResizeStart(id, e, invGetWidth(id) ?? 120);

  const upd = (patch: Partial<HoldingDraft>) => setDraft(prev => prev ? { ...prev, ...patch } : prev);

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/CAD')
      .then(r => r.json())
      .then(d => {
        if (d?.rates) {
          setLiveRates({
            USD: +(1 / d.rates.USD).toFixed(4),
            EUR: +(1 / d.rates.EUR).toFixed(4),
            GBP: +(1 / d.rates.GBP).toFixed(4),
          });
        }
      })
      .catch(() => {})
      .finally(() => setRatesLoading(false));
  }, []);

  const getFxRate = (h: Holding) => h.currency === 'CAD' ? 1 : (h.yeFxRate ?? liveRates[h.currency] ?? 1);

  const brokers = ['All', ...Array.from(new Set(holdingsState.map(h => h.broker)))];
  const ccys    = ['All', 'CAD', 'USD', 'EUR', 'GBP'];

  const filtered = holdingsState.filter(h => {
    const q = search.toLowerCase();
    const matchSearch = !q || h.security.toLowerCase().includes(q) || h.ticker.toLowerCase().includes(q) || h.broker.toLowerCase().includes(q);
    return matchSearch && (filterCcy === 'All' || h.currency === filterCcy) && (filterBroker === 'All' || h.broker === filterBroker);
  });

  const totalCostCAD      = filtered.reduce((s, h) => s + h.costCAD,          0);
  const totalFmvCAD       = filtered.reduce((s, h) => s + h.fmvCAD,           0);
  const totalUnrealizedGL = filtered.reduce((s, h) => s + h.unrealizedGL_CAD, 0);

  const startAdd  = () => { setEditingId('new'); setDraft(blankDraft()); };
  const startEdit = (h: Holding) => {
    const { id: _id, ...rest } = h;
    setEditingId(h.id); setDraft(rest);
  };
  const cancelEdit = () => { setEditingId(null); setDraft(null); };

  const saveRow = () => {
    if (!draft) return;
    if (!draft.security.trim()) { toast.error('Security name is required'); return; }
    if (!draft.ticker.trim())   { toast.error('Ticker is required');         return; }
    if (!draft.broker.trim())   { toast.error('Broker is required');         return; }
    const isForeign = draft.currency !== 'CAD';
    const costLocal        = draft.units * draft.wacLocal;
    const acqFxRate        = isForeign ? draft.acqFxRate : 1;
    const costCAD          = costLocal * acqFxRate;
    const yeFxRate         = isForeign ? draft.yeFxRate  : 1;
    const fmvCAD           = draft.fmvLocal * yeFxRate;
    const unrealizedGL_CAD = fmvCAD - costCAD;
    const saved = { ...draft, costLocal, acqFxRate, costCAD, yeFxRate, fmvCAD, unrealizedGL_CAD };
    if (editingId === 'new') {
      setHoldingsState(prev => [{ id: `H-${Date.now()}`, ...saved }, ...prev]);
      toast.success('Holding added');
    } else {
      setHoldingsState(prev => prev.map(h => h.id === editingId ? { id: editingId, ...saved } : h));
      toast.success('Holding updated');
    }
    cancelEdit();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setHoldingsState(prev => prev.filter(h => h.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success('Holding removed');
  };

  const handleExport = async () => {
    try {
      const rows = filtered.map(h => ({
        Security: h.security, Ticker: h.ticker, Broker: h.broker, Account: `…${h.acctLast4}`,
        Currency: h.currency, Units: h.units, 'WAC (Local)': h.wacLocal, 'Cost (Local)': h.costLocal,
        'Acq. FX Rate': h.acqFxRate, 'Cost (CAD)': h.costCAD, 'YE FX Rate': getFxRate(h),
        'FMV (Local)': h.fmvLocal, 'FMV (CAD)': h.fmvCAD, 'Unrealized G/L (CAD)': h.unrealizedGL_CAD,
        'GL Account': h.glAccount, Notes: h.notes ?? '',
      }));
      const { exportToExcel, objsToAOA } = await import('../lib/utils');
      exportToExcel({ 'Holdings': objsToAOA(rows) }, 'INV_Holdings_FY2025.xlsx');
      toast.success('Holdings exported');
    } catch { toast.error('Export failed'); }
  };

  // ── Inline edit/add row ──────────────────────────────────────────────────────
  const EditRow = () => {
    if (!draft) return null;
    const isForeign        = draft.currency !== 'CAD';
    const costLocal        = draft.units * draft.wacLocal;
    const acqFxRate        = isForeign ? draft.acqFxRate : 1;
    const costCAD          = costLocal * acqFxRate;
    const yeFxRate         = isForeign ? draft.yeFxRate  : 1;
    const fmvCAD           = draft.fmvLocal * yeFxRate;
    const unrealizedGL_CAD = fmvCAD - costCAD;
    return (
      <tr className="bg-primary/5 border-l-[3px] border-l-primary">
        {/* Security + Ticker + Notes */}
        <td className="px-2 py-2 space-y-0.5">
          <input className={CI} value={draft.security} onChange={e => upd({ security: e.target.value })} placeholder="Security *" autoFocus />
          <input className={CI} value={draft.ticker}   onChange={e => upd({ ticker: e.target.value.toUpperCase() })} placeholder="Ticker" />
          <input className={CI} value={draft.notes ?? ''} onChange={e => upd({ notes: e.target.value })} placeholder="Notes" />
        </td>
        {/* Broker + Account */}
        {invVisible('broker') && (
          <td className="px-2 py-2 space-y-0.5">
            <input className={CI} value={draft.broker}    onChange={e => upd({ broker: e.target.value })}                              placeholder="Broker" />
            <input className={CI} value={draft.acctLast4} onChange={e => upd({ acctLast4: e.target.value.slice(0, 4) })} placeholder="Last 4" maxLength={4} />
          </td>
        )}
        {/* Currency */}
        {invVisible('currency') && (
          <td className="px-2 py-2">
            <div className="relative">
              <select className={CIS} value={draft.currency}
                onChange={e => upd({ currency: e.target.value as InvCurrency, acqFxRate: 1, yeFxRate: 1 })}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </td>
        )}
        {/* Units */}
        {invVisible('units') && (
          <td className="px-2 py-2">
            <input className={CIN} type="number" min="0" step="1" value={draft.units || ''} onChange={e => upd({ units: +e.target.value })} placeholder="0" />
          </td>
        )}
        {/* WAC / Unit */}
        {invVisible('wac') && (
          <td className="px-2 py-2">
            <input className={CIN} type="number" min="0" step="0.0001" value={draft.wacLocal || ''} onChange={e => upd({ wacLocal: +e.target.value })} placeholder="0.0000" />
          </td>
        )}
        {/* Cost (Local) — computed */}
        {invVisible('costLocal') && (
          <td className="px-2 py-2 text-right tabular-nums font-mono text-xs text-foreground/60">{fmt(costLocal)}</td>
        )}
        {/* Acq. Rate */}
        {invVisible('acqRate') && (
          <td className="px-2 py-2">
            {isForeign
              ? <input className={CIN} type="number" step="0.0001" value={draft.acqFxRate || ''} onChange={e => upd({ acqFxRate: +e.target.value })} placeholder="1.0000" />
              : <span className="text-xs text-foreground/40 block text-right">—</span>}
          </td>
        )}
        {/* Book Value (CAD) — computed */}
        {invVisible('bookValueCAD') && (
          <td className="px-2 py-2 text-right tabular-nums font-mono text-xs text-foreground/60">{fmtCAD(costCAD)}</td>
        )}
        {/* YE Rate */}
        {invVisible('yeRate') && (
          <td className="px-2 py-2">
            {isForeign
              ? <input className={CIN} type="number" step="0.0001" value={draft.yeFxRate || ''} onChange={e => upd({ yeFxRate: +e.target.value })} placeholder="1.0000" />
              : <span className="text-xs text-foreground/40 block text-right">—</span>}
          </td>
        )}
        {/* FMV (Local) */}
        {invVisible('fmvLocal') && (
          <td className="px-2 py-2">
            <input className={CIN} type="number" min="0" step="0.01" value={draft.fmvLocal || ''} onChange={e => upd({ fmvLocal: +e.target.value })} placeholder="0.00" />
          </td>
        )}
        {/* FMV (CAD) — computed */}
        {invVisible('fmvCAD') && (
          <td className="px-2 py-2 text-right tabular-nums font-mono text-xs text-foreground/60">{fmtCAD(fmvCAD)}</td>
        )}
        {/* Unrealized G/L — computed */}
        {invVisible('unrealizedGL') && (
          <td className="px-2 py-2 text-right tabular-nums font-mono text-xs">
            <span className={unrealizedGL_CAD >= 0 ? 'text-green-600' : 'text-red-600'}>
              {unrealizedGL_CAD >= 0 ? '+' : ''}{fmtCAD(unrealizedGL_CAD)}
            </span>
          </td>
        )}
        {/* GL Acct */}
        {invVisible('glAcct') && (
          <td className="px-2 py-2">
            <input className={CI} value={draft.glAccount} onChange={e => upd({ glAccount: e.target.value })} placeholder="1310" />
          </td>
        )}
        {/* Save / Cancel */}
        <td className="px-2 py-2">
          <div className="flex items-center gap-1">
            <Button size="icon-sm" variant="default" onClick={saveRow} title="Save">
              <Check className="w-3 h-3" />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={cancelEdit} title="Cancel">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Investment Holdings Register</h2>
          <p className="text-xs text-foreground mt-0.5">
            Closing positions Dec 31, 2025 · ASPE cost method · FMV disclosed only
            {ratesLoading && <span className="ml-1 text-foreground/60">— loading FX…</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button variant="default" size="sm" onClick={startAdd} disabled={!!editingId}>
            <Plus className="w-3.5 h-3.5" /> Add Holding
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Positions',        value: String(filtered.length) },
          { label: 'Total Book Value', value: 'CAD ' + fmtCAD(totalCostCAD) },
          { label: 'YE Fair Value',    value: 'CAD ' + fmtCAD(totalFmvCAD) },
          { label: 'Unrealized G/L',
            value: (totalUnrealizedGL >= 0 ? '+' : '') + 'CAD ' + fmtCAD(totalUnrealizedGL),
            color: totalUnrealizedGL >= 0 ? 'text-green-600' : 'text-red-600' },
        ].map(k => (
          <StyledCard key={k.label} className="px-4 py-3">
            <div className={`text-sm font-bold tabular-nums ${'color' in k ? k.color : 'text-foreground'}`}>{k.value}</div>
            <div className="text-xs text-foreground mt-0.5">{k.label}</div>
          </StyledCard>
        ))}
      </div>

      {/* Filters */}
      <StyledCard className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          <input type="text" placeholder="Search security, ticker, broker…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="h-8 px-3 rounded-md border border-border bg-background text-sm w-60 focus:outline-none focus:ring-1 focus:ring-primary" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-foreground">Currency:</span>
            {ccys.map(c => (
              <button key={c} onClick={() => setFilterCcy(c)}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                  filterCcy === c ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                }`}>{c}</button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-foreground">Broker:</span>
            <select value={filterBroker} onChange={e => setFilterBroker(e.target.value)}
              className="h-8 px-2 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary">
              {brokers.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          {(search || filterCcy !== 'All' || filterBroker !== 'All') && (
            <button onClick={() => { setSearch(''); setFilterCcy('All'); setFilterBroker('All'); }}
              className="text-xs text-foreground hover:text-foreground underline underline-offset-2">Clear</button>
          )}
        </div>
      </StyledCard>

      {/* Holdings table */}
      <StyledCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <ThResizable colId="security"     width={invGetWidth('security')}     onResizeStart={irh('security')}     className="text-left px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Security</ThResizable>
                {invVisible('broker')       && <ThResizable colId="broker"       width={invGetWidth('broker')}       onResizeStart={irh('broker')}       className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Broker / Acct</ThResizable>}
                {invVisible('currency')     && <ThResizable colId="currency"     width={invGetWidth('currency')}     onResizeStart={irh('currency')}     className="text-center px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">CCY</ThResizable>}
                {invVisible('units')        && <ThResizable colId="units"        width={invGetWidth('units')}        onResizeStart={irh('units')}        className="text-right px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Units</ThResizable>}
                {invVisible('wac')          && <ThResizable colId="wac"          width={invGetWidth('wac')}          onResizeStart={irh('wac')}          className="text-right px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">WAC / Unit</ThResizable>}
                {invVisible('costLocal')    && <ThResizable colId="costLocal"    width={invGetWidth('costLocal')}    onResizeStart={irh('costLocal')}    className="text-right px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Cost (Local)</ThResizable>}
                {invVisible('acqRate')      && <ThResizable colId="acqRate"      width={invGetWidth('acqRate')}      onResizeStart={irh('acqRate')}      className="text-right px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Acq. Rate</ThResizable>}
                {invVisible('bookValueCAD') && <ThResizable colId="bookValueCAD" width={invGetWidth('bookValueCAD')} onResizeStart={irh('bookValueCAD')} className="text-right px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Book Value (CAD)</ThResizable>}
                {invVisible('yeRate')       && <ThResizable colId="yeRate"       width={invGetWidth('yeRate')}       onResizeStart={irh('yeRate')}       className="text-right px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">YE Rate</ThResizable>}
                {invVisible('fmvLocal')     && <ThResizable colId="fmvLocal"     width={invGetWidth('fmvLocal')}     onResizeStart={irh('fmvLocal')}     className="text-right px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">FMV (Local)</ThResizable>}
                {invVisible('fmvCAD')       && <ThResizable colId="fmvCAD"       width={invGetWidth('fmvCAD')}       onResizeStart={irh('fmvCAD')}       className="text-right px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">FMV (CAD) ①</ThResizable>}
                {invVisible('unrealizedGL') && <ThResizable colId="unrealizedGL" width={invGetWidth('unrealizedGL')} onResizeStart={irh('unrealizedGL')} className="text-right px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Unrealized G/L ①</ThResizable>}
                {invVisible('glAcct')       && <ThResizable colId="glAcct"       width={invGetWidth('glAcct')}       onResizeStart={irh('glAcct')}       className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">GL Acct</ThResizable>}
                <th className="w-16 px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* New holding inline */}
              {editingId === 'new' && draft && <EditRow key="new" />}

              {filtered.map(h => {
                const fxRate = getFxRate(h);
                if (editingId === h.id && draft) return <EditRow key={h.id} />;
                return (
                  <tr key={h.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-foreground text-sm">{h.security}</div>
                      <div className="text-xs text-foreground font-mono">{h.ticker}</div>
                      {h.notes && <div className="text-xs text-amber-600 mt-0.5">{h.notes}</div>}
                    </td>
                    {invVisible('broker') && (
                      <td className="px-3 py-2.5">
                        <div className="text-sm text-foreground">{h.broker}</div>
                        <div className="text-xs text-foreground">…{h.acctLast4}</div>
                      </td>
                    )}
                    {invVisible('currency') && (
                      <td className="px-3 py-2.5 text-center"><Badge variant="outline">{h.currency}</Badge></td>
                    )}
                    {invVisible('units')        && <td className="px-3 py-2.5 text-right tabular-nums font-mono">{fmt(h.units, 0)}</td>}
                    {invVisible('wac')          && <td className="px-3 py-2.5 text-right tabular-nums font-mono text-xs">{fmt(h.wacLocal, 4)}</td>}
                    {invVisible('costLocal')    && <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">{fmt(h.costLocal)}</td>}
                    {invVisible('acqRate') && (
                      <td className="px-3 py-2.5 text-right">
                        {h.currency === 'CAD'
                          ? <span className="text-foreground text-xs">—</span>
                          : <div className="flex flex-col items-end">
                              <span className="text-xs text-foreground">{h.currency}/CAD</span>
                              <span className="tabular-nums font-mono text-sm">{fmt(h.acqFxRate, 4)}</span>
                            </div>}
                      </td>
                    )}
                    {invVisible('bookValueCAD') && <td className="px-3 py-2.5 text-right tabular-nums font-mono font-semibold text-sm">{fmtCAD(h.costCAD)}</td>}
                    {invVisible('yeRate') && (
                      <td className="px-3 py-2.5 text-right">
                        {h.currency === 'CAD'
                          ? <span className="text-foreground text-xs">—</span>
                          : <div className="flex flex-col items-end">
                              <span className="text-xs text-foreground">{h.currency}/CAD</span>
                              <span className="tabular-nums font-mono text-sm">{fmt(fxRate, 4)}</span>
                            </div>}
                      </td>
                    )}
                    {invVisible('fmvLocal')     && <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm text-foreground">{fmt(h.fmvLocal)}</td>}
                    {invVisible('fmvCAD')       && <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm text-foreground">{fmtCAD(h.fmvCAD)}</td>}
                    {invVisible('unrealizedGL') && <td className="px-3 py-2.5 text-right">{glBadge(h.unrealizedGL_CAD)}</td>}
                    {invVisible('glAcct') && (
                      <td className="px-3 py-2.5">
                        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{h.glAccount}</span>
                      </td>
                    )}
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon-sm" variant="ghost" title="Edit" onClick={() => startEdit(h)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon-sm" variant="ghost" title="Delete"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteTarget({ id: h.id, label: `${h.security} (${h.ticker}) — ${h.broker}` })}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && editingId !== 'new' && (
                <tr>
                  <td colSpan={15} className="px-4 py-8 text-center text-xs text-foreground/60">No holdings match the current filters.</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/60">
                <td className="px-4 py-2.5 text-xs font-semibold text-foreground">
                  Total — {filtered.length} position{filtered.length !== 1 ? 's' : ''}
                </td>
                {invVisible('broker')       && <td />}
                {invVisible('currency')     && <td />}
                {invVisible('units')        && <td />}
                {invVisible('wac')          && <td />}
                {invVisible('costLocal')    && <td />}
                {invVisible('acqRate')      && <td />}
                {invVisible('bookValueCAD') && <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm">{fmtCAD(totalCostCAD)}</td>}
                {invVisible('yeRate')       && <td />}
                {invVisible('fmvLocal')     && <td className="px-3 py-2.5 text-right tabular-nums font-mono text-foreground text-sm">—</td>}
                {invVisible('fmvCAD')       && <td className="px-3 py-2.5 text-right tabular-nums font-mono text-foreground text-sm">{fmtCAD(totalFmvCAD)}</td>}
                {invVisible('unrealizedGL') && <td className="px-3 py-2.5 text-right">{glBadge(totalUnrealizedGL)}</td>}
                {invVisible('glAcct')       && <td />}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </StyledCard>

      <p className="text-xs text-foreground italic">
        ① FMV and Unrealized G/L are disclosed for reference only — ASPE Part II (Section 3856) cost method.
        FX translated at Dec 31, 2025 closing rates.
      </p>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-4 h-4" /> Remove Holding
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            <p className="font-semibold mb-1">Permanently remove:</p>
            <p>{deleteTarget?.label}</p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
