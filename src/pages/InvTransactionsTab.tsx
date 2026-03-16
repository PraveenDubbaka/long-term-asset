import React, { useState } from 'react';
import { Download, Flag, ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import { transactions } from '../data/investmentData';
import { fmtDateDisplay } from '../lib/utils';
import type { TxnType } from '../types/investmentTypes';
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

const TXN_TYPES: TxnType[] = ['Purchase', 'Sale', 'Dividend', 'Transfer In', 'Transfer Out', 'Return of Capital', 'DRIP'];

function fmt(n: number, d = 2) { return n.toLocaleString('en-CA', { minimumFractionDigits: d, maximumFractionDigits: d }); }
function fmtCAD(n: number) { return '$' + fmt(Math.abs(n)); }

export function InvTransactionsTab() {
  const [filterType, setFilterType] = useState<'All' | TxnType>('All');
  const [filterBroker, setFilterBroker] = useState('All');
  const [filterTicker, setFilterTicker] = useState('All');
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [flagsOnly, setFlagsOnly] = useState(false);

  const brokers = ['All', ...Array.from(new Set(transactions.map(t => t.broker)))];
  const tickers = ['All', ...Array.from(new Set(transactions.map(t => t.ticker))).sort()];

  const filtered = transactions
    .filter(t => {
      const q = search.toLowerCase();
      return (filterType === 'All' || t.txnType === filterType) &&
        (filterBroker === 'All' || t.broker === filterBroker) &&
        (filterTicker === 'All' || t.ticker === filterTicker) &&
        (!flagsOnly || t.flag) &&
        (!q || t.security.toLowerCase().includes(q) || t.ticker.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      return sortDir === 'asc' ? d : -d;
    });

  const totalNetCAD   = filtered.reduce((s, t) => s + (t.txnType === 'Sale' || t.txnType === 'Transfer Out' ? t.netCAD : -t.netCAD), 0);
  const purchases     = filtered.filter(t => t.txnType === 'Purchase').length;
  const sales         = filtered.filter(t => t.txnType === 'Sale').length;
  const dividends     = filtered.filter(t => t.txnType === 'Dividend').length;
  const flagCount     = filtered.filter(t => t.flag).length;

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

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Transaction Register</h2>
          <p className="text-xs text-foreground/60 mt-0.5">All transactions — 4 brokers consolidated · FY Jan 1 – Dec 31, 2025</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Purchases',   count: purchases, icon: ArrowDownCircle, color: 'text-primary' },
          { label: 'Sales',       count: sales,     icon: ArrowUpCircle,   color: 'text-review' },
          { label: 'Dividends',   count: dividends, icon: RefreshCw,       color: 'text-green-600' },
          { label: 'Flagged',     count: flagCount, icon: Flag,             color: 'text-amber-500' },
        ].map(k => (
          <StyledCard key={k.label} className="p-3 flex items-center gap-3">
            <k.icon className={`w-7 h-7 ${k.color} opacity-80`} />
            <div>
              <div className="text-2xl font-bold text-foreground">{k.count}</div>
              <div className="text-xs text-muted-foreground">{k.label}</div>
            </div>
          </StyledCard>
        ))}
      </div>

      {/* Filters */}
      <StyledCard className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
            className="h-8 px-3 rounded-md border border-border bg-background text-sm w-52 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex flex-wrap items-center gap-1">
            {(['All', ...TXN_TYPES] as const).map(t => (
              <button key={t}
                onClick={() => setFilterType(t as typeof filterType)}
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
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">Clear</button>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(t => (
                <tr key={t.id} className={`hover:bg-muted/30 transition-colors ${t.flag ? 'bg-amber-50/60' : ''}`}>
                  <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{fmtDateDisplay(t.date)}</td>
                  <td className="px-3 py-2">
                    <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{t.source}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-foreground text-sm leading-tight">{t.security}</div>
                    <div className="text-xs text-muted-foreground font-mono">{t.ticker}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-foreground whitespace-nowrap">{t.broker.replace(' Investing', '').replace(' Waterhouse', '')}</td>
                  <td className="px-3 py-2">
                    <Badge variant={TXN_COLORS[t.txnType] as Parameters<typeof Badge>[0]['variant']} className="text-xs whitespace-nowrap">
                      {t.txnType}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-mono text-sm">{fmt(t.qty, 0)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-mono text-sm">{fmt(t.price, 2)}</td>
                  <td className="px-2 py-2 text-center text-xs text-muted-foreground font-mono">{t.currency}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-mono text-xs text-muted-foreground">
                    {t.commission > 0 ? fmt(t.commission) : '—'}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-mono text-sm">{fmt(t.netLocal)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-mono text-xs text-muted-foreground">
                    {t.currency === 'CAD' ? '—' : fmt(t.fxRate, 4)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-mono font-semibold text-sm">{fmtCAD(t.netCAD)}</td>
                  <td className="px-3 py-2 max-w-[160px]">
                    <div className="flex items-start gap-1">
                      {t.flag && <Flag className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />}
                      <span className="text-xs text-muted-foreground truncate" title={t.notes}>{t.notes ?? ''}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/60">
                <td colSpan={11} className="px-3 py-2.5 text-xs font-semibold text-foreground">
                  {filtered.length} transactions
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm">
                  <span className="text-xs text-muted-foreground mr-1">Net flow</span>
                  {totalNetCAD >= 0 ? '+' : ''}{fmtCAD(totalNetCAD)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </StyledCard>
    </div>
  );
}
