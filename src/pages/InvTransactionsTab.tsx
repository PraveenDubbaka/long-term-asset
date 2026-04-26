import React, { useState } from 'react';
import { Download, Flag, ArrowUpCircle, ArrowDownCircle, RefreshCw, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/wp-ui/dialog';
import { transactions as initialTransactions } from '../data/investmentData';
import { fmtDateDisplay } from '../lib/utils';
import type { InvTransaction, TxnType, InvCurrency } from '../types/investmentTypes';
import toast from 'react-hot-toast';

const TXN_COLORS: Record<TxnType, string> = {
  'Purchase':         'inProgress',
  'Sale':             'review',
  'Dividend':         'success',
  'Transfer In':      'info',
  'Transfer Out':     'outline',
  'Return of Capital':'warning',
  'DRIP':             'secondary',
} as const;
const TXN_TYPES:   TxnType[]    = ['Purchase', 'Sale', 'Dividend', 'Transfer In', 'Transfer Out', 'Return of Capital', 'DRIP'];
const CURRENCIES:  InvCurrency[]= ['CAD', 'USD', 'EUR', 'GBP'];
const SOURCES = ['A', 'B', 'C', 'D'];

function fmt(n: number, d = 2) { return n.toLocaleString('en-CA', { minimumFractionDigits: d, maximumFractionDigits: d }); }
function fmtCAD(n: number) { return '$' + fmt(Math.abs(n)); }

// Inline-cell input styles — global design system (matches Long-term Asset form style)
const BASE = 'input-double-border w-full h-8 text-xs rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground placeholder:text-foreground/60 transition-all duration-200 hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)] focus:outline-none';
const CI  = `${BASE} px-2.5`;
const CIS = `${BASE} pl-2.5 pr-6 appearance-none cursor-pointer`;
const CIN = `${BASE} px-2.5 text-right tabular-nums`;

type TxnDraft = Omit<InvTransaction, 'id'>;

function blankDraft(): TxnDraft {
  return {
    source: 'A', broker: '', date: new Date().toISOString().slice(0, 10),
    security: '', ticker: '', txnType: 'Purchase',
    qty: 0, price: 0, currency: 'CAD', commission: 0,
    grossLocal: 0, netLocal: 0, fxRate: 1, netCAD: 0,
    notes: '', flag: false,
  };
}

export function InvTransactionsTab() {
  const [txnsState,    setTxnsState]    = useState<InvTransaction[]>([...initialTransactions]);
  const [filterType,   setFilterType]   = useState<'All' | TxnType>('All');
  const [filterBroker, setFilterBroker] = useState('All');
  const [filterTicker, setFilterTicker] = useState('All');
  const [search,       setSearch]       = useState('');
  const [sortDir,      setSortDir]      = useState<'asc' | 'desc'>('asc');
  const [flagsOnly,    setFlagsOnly]    = useState(false);
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [draft,        setDraft]        = useState<TxnDraft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

  const upd = (patch: Partial<TxnDraft>) => setDraft(prev => prev ? { ...prev, ...patch } : prev);

  const brokers = ['All', ...Array.from(new Set(txnsState.map(t => t.broker)))];
  const tickers = ['All', ...Array.from(new Set(txnsState.map(t => t.ticker))).sort()];

  const filtered = txnsState
    .filter(t => {
      const q = search.toLowerCase();
      return (filterType   === 'All' || t.txnType === filterType) &&
        (filterBroker === 'All' || t.broker  === filterBroker) &&
        (filterTicker === 'All' || t.ticker  === filterTicker) &&
        (!flagsOnly || t.flag) &&
        (!q || t.security.toLowerCase().includes(q) || t.ticker.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q));
    })
    .sort((a, b) => { const d = a.date.localeCompare(b.date); return sortDir === 'asc' ? d : -d; });

  const totalNetCAD = filtered.reduce((s, t) =>
    s + (t.txnType === 'Sale' || t.txnType === 'Transfer Out' ? t.netCAD : -t.netCAD), 0);
  const purchases   = filtered.filter(t => t.txnType === 'Purchase').length;
  const sales       = filtered.filter(t => t.txnType === 'Sale').length;
  const dividends   = filtered.filter(t => t.txnType === 'Dividend').length;
  const flagCount   = filtered.filter(t => t.flag).length;

  const startAdd  = () => { setEditingId('new'); setDraft(blankDraft()); };
  const startEdit = (t: InvTransaction) => {
    const { id: _id, ...rest } = t;
    setEditingId(t.id); setDraft(rest);
  };
  const cancelEdit = () => { setEditingId(null); setDraft(null); };

  const saveRow = () => {
    if (!draft) return;
    if (!draft.security.trim()) { toast.error('Security is required'); return; }
    if (!draft.broker.trim())   { toast.error('Broker is required');   return; }
    const isForeign  = draft.currency !== 'CAD';
    const grossLocal = draft.qty * draft.price;
    const netLocal   = grossLocal - draft.commission;
    const fxRate     = isForeign ? draft.fxRate : 1;
    const netCAD     = netLocal * fxRate;
    const saved      = { ...draft, grossLocal, netLocal, fxRate, netCAD };
    if (editingId === 'new') {
      setTxnsState(prev => [{ id: `T-${Date.now()}`, ...saved }, ...prev]);
      toast.success('Transaction added');
    } else {
      setTxnsState(prev => prev.map(t => t.id === editingId ? { id: editingId, ...saved } : t));
      toast.success('Transaction updated');
    }
    cancelEdit();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setTxnsState(prev => prev.filter(t => t.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success('Transaction removed');
  };

  const handleExport = async () => {
    try {
      const rows = filtered.map(t => ({
        Source: t.source, Broker: t.broker, Date: t.date, Security: t.security, Ticker: t.ticker,
        Type: t.txnType, Qty: t.qty, Price: t.price, Currency: t.currency,
        Commission: t.commission, 'Net (Local)': t.netLocal, 'FX Rate': t.fxRate, 'Net (CAD)': t.netCAD,
        Flag: t.flag ? '⚑' : '', Notes: t.notes ?? '',
      }));
      const { exportToExcel, objsToAOA } = await import('../lib/utils');
      exportToExcel({ 'Transactions': objsToAOA(rows) }, 'INV_Transactions_FY2025.xlsx');
      toast.success('Transactions exported');
    } catch { toast.error('Export failed'); }
  };

  // ── Inline edit/add row ──────────────────────────────────────────────────────
  const EditRow = () => {
    if (!draft) return null;
    const isForeign  = draft.currency !== 'CAD';
    const grossLocal = draft.qty * draft.price;
    const netLocal   = grossLocal - draft.commission;
    const netCAD     = netLocal * (isForeign ? draft.fxRate : 1);
    return (
      <tr className="bg-primary/5 border-l-[3px] border-l-primary">
        {/* Date */}
        <td className="px-2 py-2">
          <input className={CI} type="date" value={draft.date} onChange={e => upd({ date: e.target.value })} />
        </td>
        {/* Source */}
        <td className="px-2 py-2">
          <div className="relative">
            <select className={CIS} value={draft.source} onChange={e => upd({ source: e.target.value })}>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </td>
        {/* Security + Ticker */}
        <td className="px-2 py-2 space-y-0.5">
          <input className={CI} value={draft.security} onChange={e => upd({ security: e.target.value })} placeholder="Security *" />
          <input className={CI} value={draft.ticker} onChange={e => upd({ ticker: e.target.value.toUpperCase() })} placeholder="Ticker" />
        </td>
        {/* Broker */}
        <td className="px-2 py-2">
          <input className={CI} value={draft.broker} onChange={e => upd({ broker: e.target.value })} placeholder="Broker *" />
        </td>
        {/* Type */}
        <td className="px-2 py-2">
          <div className="relative">
            <select className={CIS} value={draft.txnType} onChange={e => upd({ txnType: e.target.value as TxnType })}>
              {TXN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </td>
        {/* Qty */}
        <td className="px-2 py-2">
          <input className={CIN} type="number" min="0" step="1" value={draft.qty || ''} onChange={e => upd({ qty: +e.target.value })} placeholder="0" />
        </td>
        {/* Price */}
        <td className="px-2 py-2">
          <input className={CIN} type="number" min="0" step="0.01" value={draft.price || ''} onChange={e => upd({ price: +e.target.value })} placeholder="0.00" />
        </td>
        {/* CCY */}
        <td className="px-2 py-2">
          <div className="relative">
            <select className={CIS} value={draft.currency} onChange={e => upd({ currency: e.target.value as InvCurrency, fxRate: 1 })}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </td>
        {/* Commission */}
        <td className="px-2 py-2">
          <input className={CIN} type="number" min="0" step="0.01" value={draft.commission || ''} onChange={e => upd({ commission: +e.target.value })} placeholder="0.00" />
        </td>
        {/* Net (Local) - computed */}
        <td className="px-2 py-2 text-right tabular-nums font-mono text-xs text-foreground/60">{fmt(netLocal)}</td>
        {/* FX Rate */}
        <td className="px-2 py-2">
          {isForeign
            ? <input className={CIN} type="number" step="0.0001" value={draft.fxRate || ''} onChange={e => upd({ fxRate: +e.target.value })} placeholder="1.0000" />
            : <span className="text-xs text-foreground/40 block text-right">—</span>}
        </td>
        {/* Net (CAD) - computed */}
        <td className="px-2 py-2 text-right tabular-nums font-mono text-xs text-foreground/60">{fmtCAD(netCAD)}</td>
        {/* Notes + Flag */}
        <td className="px-2 py-2 space-y-0.5">
          <input className={CI} value={draft.notes ?? ''} onChange={e => upd({ notes: e.target.value })} placeholder="Notes" />
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="checkbox" checked={!!draft.flag} onChange={e => upd({ flag: e.target.checked })} className="rounded h-3 w-3" />
            <span className="text-xs text-foreground">Flag</span>
          </label>
        </td>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Transaction Register</h2>
          <p className="text-xs text-foreground mt-0.5">All transactions — 4 brokers consolidated · FY Jan 1 – Dec 31, 2025</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button variant="default" size="sm" onClick={startAdd} disabled={!!editingId}>
            <Plus className="w-3.5 h-3.5" /> Add Transaction
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Purchases', count: purchases, icon: ArrowDownCircle, color: 'text-primary'   },
          { label: 'Sales',     count: sales,     icon: ArrowUpCircle,   color: 'text-review'    },
          { label: 'Dividends', count: dividends, icon: RefreshCw,       color: 'text-green-600' },
          { label: 'Flagged',   count: flagCount, icon: Flag,             color: 'text-amber-500'},
        ].map(k => (
          <StyledCard key={k.label} className="p-3 flex items-center gap-3">
            <k.icon className={`w-7 h-7 ${k.color} opacity-80`} />
            <div>
              <div className="text-2xl font-bold text-foreground">{k.count}</div>
              <div className="text-xs text-foreground">{k.label}</div>
            </div>
          </StyledCard>
        ))}
      </div>

      {/* Filters */}
      <StyledCard className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
            className="h-8 px-3 rounded-md border border-border bg-background text-sm w-52 focus:outline-none focus:ring-1 focus:ring-primary" />
          <div className="flex flex-wrap items-center gap-1">
            {(['All', ...TXN_TYPES] as const).map(t => (
              <button key={t} onClick={() => setFilterType(t as typeof filterType)}
                className={`px-2 py-0.5 text-xs rounded-md border transition-colors ${
                  filterType === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                }`}>{t}</button>
            ))}
          </div>
          <select value={filterBroker} onChange={e => setFilterBroker(e.target.value)}
            className="h-8 px-2 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary">
            {brokers.map(b => <option key={b}>{b}</option>)}
          </select>
          <select value={filterTicker} onChange={e => setFilterTicker(e.target.value)}
            className="h-8 px-2 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary">
            {tickers.map(t => <option key={t}>{t}</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input type="checkbox" checked={flagsOnly} onChange={e => setFlagsOnly(e.target.checked)} className="rounded" />
            Flagged only
          </label>
          <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            className="h-8 px-3 text-xs rounded-md border border-border hover:bg-muted flex items-center gap-1">
            Date {sortDir === 'asc' ? '↑' : '↓'}
          </button>
          {(search || filterType !== 'All' || filterBroker !== 'All' || filterTicker !== 'All' || flagsOnly) && (
            <button onClick={() => { setSearch(''); setFilterType('All'); setFilterBroker('All'); setFilterTicker('All'); setFlagsOnly(false); }}
              className="text-xs text-foreground hover:text-foreground underline underline-offset-2">Clear</button>
          )}
        </div>
      </StyledCard>

      <StyledCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">Date</th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">Src</th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap">Security</th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">Broker</th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">Type</th>
                <th className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">Qty</th>
                <th className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">Price</th>
                <th className="text-center px-2 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">CCY</th>
                <th className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap">Comm.</th>
                <th className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap">Net (Local)</th>
                <th className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap">FX Rate</th>
                <th className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap">Net (CAD)</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">Notes</th>
                <th className="w-16 px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* New transaction inline */}
              {editingId === 'new' && draft && <EditRow key="new" />}

              {filtered.map(t => {
                if (editingId === t.id && draft) return <EditRow key={t.id} />;
                return (
                  <tr key={t.id} className={`group hover:bg-muted/30 transition-colors ${t.flag ? 'bg-amber-50/60' : ''}`}>
                    <td className="px-3 py-2 text-xs text-foreground whitespace-nowrap">{fmtDateDisplay(t.date)}</td>
                    <td className="px-3 py-2">
                      <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{t.source}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-foreground text-sm leading-tight">{t.security}</div>
                      <div className="text-xs text-foreground font-mono">{t.ticker}</div>
                    </td>
                    <td className="px-3 py-2 text-xs text-foreground whitespace-nowrap">{t.broker.replace(' Investing', '').replace(' Waterhouse', '')}</td>
                    <td className="px-3 py-2">
                      <Badge variant={TXN_COLORS[t.txnType] as Parameters<typeof Badge>[0]['variant']} className="text-xs whitespace-nowrap">{t.txnType}</Badge>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-mono text-sm">{fmt(t.qty, 0)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-mono text-sm">{fmt(t.price, 2)}</td>
                    <td className="px-2 py-2 text-center text-xs text-foreground font-mono">{t.currency}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-mono text-xs text-foreground">
                      {t.commission > 0 ? fmt(t.commission) : '00'}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-mono text-sm">{fmt(t.netLocal)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-mono text-xs text-foreground">
                      {t.currency === 'CAD' ? '—' : fmt(t.fxRate, 4)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-mono font-semibold text-sm">{fmtCAD(t.netCAD)}</td>
                    <td className="px-3 py-2 max-w-[140px]">
                      <div className="flex items-start gap-1">
                        {t.flag && <Flag className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />}
                        <span className="text-xs text-foreground truncate" title={t.notes}>{t.notes ?? ''}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon-sm" variant="ghost" title="Edit" onClick={() => startEdit(t)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon-sm" variant="ghost" title="Delete"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteTarget({ id: t.id, label: `${fmtDateDisplay(t.date)} · ${t.txnType} · ${t.security}` })}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && editingId !== 'new' && (
                <tr><td colSpan={14} className="px-4 py-8 text-center text-xs text-foreground/60">No transactions match the current filters.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/60">
                <td colSpan={11} className="px-3 py-2.5 text-xs font-semibold text-foreground">{filtered.length} transactions</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm">
                  <span className="text-xs text-foreground mr-1">Net flow</span>
                  {totalNetCAD >= 0 ? '+' : ''}{fmtCAD(totalNetCAD)}
                </td>
                <td /><td />
              </tr>
            </tfoot>
          </table>
        </div>
      </StyledCard>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-4 h-4" /> Delete Transaction
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            <p className="font-semibold mb-1">Permanently delete:</p>
            <p>{deleteTarget?.label}</p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
