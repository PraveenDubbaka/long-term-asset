import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Pencil, Trash2, Plus, Check, Upload } from 'lucide-react';
import { Badge } from '@/components/wp-ui/badge';
import { Button } from '@/components/wp-ui/button';
import { Checkbox } from '@/components/wp-ui/checkbox';
import {
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent,
} from '@/components/wp-ui/tooltip';
import { CHART_OF_ACCOUNTS, defaultTbAccount } from '@/lib/luka/coa';
import { validateTx } from '@/lib/luka/compute';
import type { Transaction, TxType, TxStatus, Source } from '@/lib/luka/types';
import { fmtNum } from './InvHoldingsTab';
import { fmtDate } from '../lib/utils';
import { ColFilter, SearchFilter } from './InvTableFilters';
import InvPlaidConnectDialog from './InvPlaidConnectDialog';
import InvPriorYearImport from './InvPriorYearImport';
import type { PriorYearLot } from '@/lib/luka/types';
import toast from 'react-hot-toast';

interface Props {
  effectiveTxns: Transaction[];
  allSources: Source[];
  txEdits: Record<string, Partial<Transaction>>;
  setTxEdits: React.Dispatch<React.SetStateAction<Record<string, Partial<Transaction>>>>;
  updateTx: (id: string, patch: Partial<Transaction>) => void;
  onPlaidConnected: (sources: Source[], txns: Transaction[]) => void;
  entityName: string;
  onDeleteTx?: (id: string) => void;
  onAddTx?: (tx: Transaction) => void;
  importedLots?: PriorYearLot[] | null;
  onApplyLots?: (lots: PriorYearLot[]) => void;
  onResetLots?: () => void;
}

const TxStatusBadge = ({ status }: { status: TxStatus }) => {
  const map = {
    pending: { cls: "border-yellow-400/40 bg-yellow-400/10 text-yellow-700", label: "Pending" },
    approved: { cls: "border-blue-400/40 bg-blue-400/10 text-blue-700", label: "Approved" },
    published: { cls: "border-green-500/40 bg-green-500/10 text-green-700", label: "Published" },
  } as const;
  const v = map[status];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border ${v.cls}`}>{v.label}</span>;
};


/** Portal-based combobox — renders dropdown in <body> so overflow-x-auto never clips it */
function SecurityCombobox({
  value,
  onChange,
  options,
  placeholder,
  className,
  autoUpperCase = false,
}: {
  value: string;
  onChange: (val: string, paired?: string) => void;
  options: { value: string; hint: string }[];
  placeholder?: string;
  className?: string;
  autoUpperCase?: boolean;
}) {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState(value);
  const inputRef            = useRef<HTMLInputElement>(null);
  const [pos, setPos]       = useState({ top: 0, left: 0, width: 0 });

  // Keep local query in sync when parent value changes (e.g. cross-fill)
  useEffect(() => { setQuery(value); }, [value]);

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter(o =>
      o.value.toLowerCase().includes(q) || o.hint.toLowerCase().includes(q),
    );
  }, [query, options]);

  const reposition = () => {
    if (!inputRef.current) return;
    const r = inputRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 200) });
  };

  const handleSelect = (o: { value: string; hint: string }) => {
    setQuery(o.value);
    onChange(o.value, o.hint);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={query}
        placeholder={placeholder}
        className={className}
        onChange={e => {
          const v = autoUpperCase ? e.target.value.toUpperCase() : e.target.value;
          setQuery(v);
          onChange(v);
        }}
        onFocus={() => { reposition(); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && filtered.length > 0 && createPortal(
        <ul
          style={{ position: 'fixed', top: pos.top, left: pos.left, minWidth: pos.width, zIndex: 9999 }}
          className="bg-white dark:bg-card border border-border rounded-lg shadow-xl max-h-52 overflow-y-auto text-sm py-1"
        >
          {filtered.map(o => (
            <li
              key={o.value}
              onMouseDown={() => handleSelect(o)}
              className="flex items-center justify-between gap-4 px-3 py-2 hover:bg-muted cursor-pointer"
            >
              <span className="font-medium truncate">{o.value}</span>
              <span className="text-xs text-muted-foreground font-mono shrink-0">{o.hint}</span>
            </li>
          ))}
        </ul>,
        document.body,
      )}
    </div>
  );
}

export function InvTransactionsTab({
  effectiveTxns,
  allSources,
  txEdits,
  setTxEdits,
  updateTx,
  onPlaidConnected,
  entityName,
  onDeleteTx,
  onAddTx,
  importedLots,
  onApplyLots,
  onResetLots,
}: Props) {
  const [txStatusFilter,  setTxStatusFilter]  = useState<"all" | TxStatus>("all");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Set<string>>(new Set());

  // Inline edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Transaction>>({});

  // New row state
  const [addingNew, setAddingNew] = useState(false);
  const [newTx, setNewTx] = useState<Partial<Transaction>>({});

  // Column-level filters
  const [filterSource,    setFilterSource]    = useState("");
  const [filterType,      setFilterType]      = useState("");
  const [filterSecurity,  setFilterSecurity]  = useState("");
  const [filterTicker,    setFilterTicker]    = useState("");
  const [filterCcy,       setFilterCcy]       = useState("");
  const [filterTbAccount, setFilterTbAccount] = useState("");
  const [filterTradeDate, setFilterTradeDate] = useState("");
  const [filterStatus,    setFilterStatus]    = useState("");
  const IIC = 'input-double-border h-9 text-sm px-3 border border-[#dcdfe4] rounded-[10px] bg-white dark:bg-card text-foreground transition-all duration-200 hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)] focus:outline-none focus:ring-0';

  const anyColFilter = filterSource || filterType || filterSecurity || filterTicker || filterCcy || filterTbAccount || filterTradeDate || filterStatus;

  const clearColFilters = () => {
    setFilterSource(""); setFilterType(""); setFilterSecurity("");
    setFilterTicker(""); setFilterCcy(""); setFilterTbAccount(""); setFilterTradeDate(""); setFilterStatus("");
  };

  // Unique values for dropdown filters
  const uniqueSources = useMemo(
    () =>
      Array.from(
        new Set(
          effectiveTxns.map(
            (t) =>
              allSources.find((s) => s.id === t.sourceId)?.institution.split(" — ")[0].split(" ")[0] ??
              t.sourceId,
          ),
        ),
      ).sort(),
    [effectiveTxns, allSources],
  );

  const uniqueTypes = useMemo(
    () => Array.from(new Set(effectiveTxns.map((t) => t.type))).sort(),
    [effectiveTxns],
  );

  const uniqueTickers = useMemo(
    () => Array.from(new Set(effectiveTxns.map((t) => t.ticker).filter(Boolean))).sort(),
    [effectiveTxns],
  );

  const uniqueCurrencies = useMemo(
    () => Array.from(new Set(effectiveTxns.map((t) => t.currency).filter(Boolean))).sort(),
    [effectiveTxns],
  );

  const uniqueTbAccounts = useMemo(
    () => Array.from(new Set(effectiveTxns.map((t) => t.tbAccount ?? defaultTbAccount(t.type)).filter(Boolean))).sort(),
    [effectiveTxns],
  );

  // Unique security/ticker pairs for datalist autocomplete
  const knownSecurities = useMemo(() => {
    const map = new Map<string, string>(); // ticker → security name
    for (const t of effectiveTxns) {
      if (t.ticker && t.security) map.set(t.ticker, t.security);
    }
    return Array.from(map.entries()).map(([ticker, security]) => ({ ticker, security })).sort((a, b) => a.ticker.localeCompare(b.ticker));
  }, [effectiveTxns]);

  /** When a ticker is chosen from the datalist, auto-fill the security name */
  const resolveSecurityFromTicker = (ticker: string) => {
    const match = knownSecurities.find(k => k.ticker.toLowerCase() === ticker.toLowerCase());
    return match?.security ?? null;
  };
  /** When a security name is chosen, auto-fill the ticker */
  const resolveTickerFromSecurity = (security: string) => {
    const match = knownSecurities.find(k => k.security.toLowerCase() === security.toLowerCase());
    return match?.ticker ?? null;
  };

  const visibleTxns = useMemo(() => {
    let txns = [...effectiveTxns].sort((a, b) => a.date.localeCompare(b.date));

    if (txStatusFilter !== "all")
      txns = txns.filter((t) => (t.status ?? "published") === txStatusFilter);

    if (filterSource)
      txns = txns.filter((t) => {
        const name =
          allSources.find((s) => s.id === t.sourceId)?.institution.split(" — ")[0].split(" ")[0] ??
          t.sourceId;
        return name === filterSource;
      });

    if (filterType)      txns = txns.filter((t) => t.type === filterType);
    if (filterTicker)    txns = txns.filter((t) => t.ticker === filterTicker);
    if (filterCcy)       txns = txns.filter((t) => t.currency === filterCcy);
    if (filterTbAccount) txns = txns.filter((t) => (t.tbAccount ?? defaultTbAccount(t.type)) === filterTbAccount);
    if (filterTradeDate) txns = txns.filter((t) => (t.tradeDate ?? t.date).includes(filterTradeDate));
    if (filterStatus)    txns = txns.filter((t) => (t.status ?? "published") === filterStatus);

    if (filterSecurity)
      txns = txns.filter(
        (t) =>
          t.security.toLowerCase().includes(filterSecurity.toLowerCase()) ||
          t.ticker.toLowerCase().includes(filterSecurity.toLowerCase()),
      );

    return txns;
  }, [effectiveTxns, txStatusFilter, filterSource, filterType, filterSecurity,
      filterTicker, filterCcy, filterTbAccount, filterTradeDate, allSources]);

  const txCounts = useMemo(() => {
    const c: { all: number; pending: number; approved: number; published: number } = {
      all: effectiveTxns.length, pending: 0, approved: 0, published: 0,
    };
    for (const t of effectiveTxns) {
      const s = (t.status ?? "published") as TxStatus;
      c[s] = (c[s] ?? 0) + 1;
    }
    return c;
  }, [effectiveTxns]);

  const bulkAdvance = (target: TxStatus) => {
    const ids = Array.from(selectedTx);
    if (!ids.length) { toast("Select transactions first"); return; }
    const patch: Record<string, Partial<Transaction>> = {};
    for (const id of ids) patch[id] = { ...(txEdits[id] ?? {}), status: target };
    setTxEdits((m) => ({ ...m, ...patch }));
    setSelectedTx(new Set());
    toast.success(`${ids.length} transaction(s) marked ${target}`);
  };

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Transactions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Intake from Plaid or uploaded statements → Approve → Publish to schedules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setAddingNew(true); setNewTx({ date: '2024-01-01', security: '', ticker: '', type: 'Purchase', units: 0, price: 0, fees: 0, currency: 'CAD', status: 'pending' }); setTxStatusFilter('all'); }}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-primary bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Transaction
          </button>
          <button
            onClick={() => setImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-background text-foreground text-xs font-medium hover:bg-muted transition-colors"
          >
            <Upload className="h-3.5 w-3.5" /> Import
            {importedLots && importedLots.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                {importedLots.length}
              </span>
            )}
          </button>
          <InvPlaidConnectDialog
            defaultPeriodStart="2024-01-01"
            defaultPeriodEnd="2024-12-31"
            entityName={entityName}
            onImport={(newSources, newTxns) => {
              onPlaidConnected(newSources, newTxns);
              toast.success(`${newTxns.length} transaction(s) imported as Pending`);
            }}
          />
        </div>
      </div>

      {/* Status filter pills + bulk actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="inline-flex rounded-full border border-border bg-card p-1">
          {([
            ["all",       `All (${txCounts.all})`],
            ["pending",   `Pending (${txCounts.pending})`],
            ["approved",  `Approved (${txCounts.approved})`],
            ["published", `Published (${txCounts.published})`],
          ] as [typeof txStatusFilter, string][]).map(([k, label]) => (
            <button
              key={k}
              onClick={() => { setTxStatusFilter(k); setSelectedTx(new Set()); }}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                txStatusFilter === k
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {anyColFilter && (
            <button
              onClick={clearColFilters}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-full px-2.5 py-1 transition-colors"
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
          <span className="text-xs text-muted-foreground">{selectedTx.size} selected</span>
          <Button size="sm" variant="outline" disabled={!selectedTx.size} onClick={() => bulkAdvance("approved")}>
            Approve
          </Button>
          <Button size="sm" disabled={!selectedTx.size} onClick={() => bulkAdvance("published")}>
            Publish
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-8">
                <Checkbox
                  checked={visibleTxns.length > 0 && visibleTxns.every((t) => selectedTx.has(t.id))}
                  onCheckedChange={(v) => {
                    if (v) setSelectedTx(new Set(visibleTxns.map((t) => t.id)));
                    else setSelectedTx(new Set());
                  }}
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                <SearchFilter
                  label="Trade Date"
                  value={filterTradeDate}
                  onChange={setFilterTradeDate}
                  placeholder="e.g. 2024-06"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Settlement</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <ColFilter
                  label="Source"
                  options={uniqueSources}
                  value={filterSource}
                  onChange={setFilterSource}
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <SearchFilter
                  label="Security"
                  value={filterSecurity}
                  onChange={setFilterSecurity}
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                <ColFilter
                  label="Ticker"
                  options={uniqueTickers}
                  value={filterTicker}
                  onChange={setFilterTicker}
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                <ColFilter
                  label="Ccy"
                  options={uniqueCurrencies}
                  value={filterCcy}
                  onChange={setFilterCcy}
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <ColFilter
                  label="Type"
                  options={uniqueTypes}
                  value={filterType}
                  onChange={setFilterType}
                />
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Units / Shares</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">FX</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <ColFilter
                  label="TB Account"
                  options={uniqueTbAccounts}
                  value={filterTbAccount}
                  onChange={setFilterTbAccount}
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <ColFilter
                  label="Status"
                  options={["pending", "approved", "published"]}
                  value={filterStatus}
                  onChange={setFilterStatus}
                />
              </th>
              <th className="px-4 py-3 w-8"></th>
              <th className="px-3 py-3 w-20 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {addingNew && (
              <tr className="border-b border-border/50 bg-primary/5">
                <td className="px-4 py-2"><span /></td>
                <td className="px-4 py-2"><input type="date" value={newTx.tradeDate ?? newTx.date ?? ''} onChange={e => setNewTx(d => ({...d, date: e.target.value, tradeDate: e.target.value}))} className={`${IIC} w-28`} title="Trade date (also sets booking date)" /></td>
                <td className="px-4 py-2"><input type="date" value={newTx.settlementDate ?? ''} onChange={e => setNewTx(d => ({...d, settlementDate: e.target.value || undefined}))} className={`${IIC} w-28`} title="Settlement date" /></td>
                <td className="px-4 py-2"><select value={newTx.sourceId ?? ''} onChange={e => setNewTx(d => ({...d, sourceId: e.target.value}))} className={`${IIC} w-20 cursor-pointer`}><option value="">—</option>{allSources.map(s => <option key={s.id} value={s.id}>{s.institution.split(' ')[0]}</option>)}</select></td>
                <td className="px-4 py-2">
                  <SecurityCombobox
                    value={newTx.security ?? ''}
                    placeholder="Security name"
                    className={`${IIC} w-36`}
                    options={knownSecurities.map(k => ({ value: k.security, hint: k.ticker }))}
                    onChange={(sec, pairedTicker) =>
                      setNewTx(d => ({ ...d, security: sec, ...(pairedTicker ? { ticker: pairedTicker } : {}) }))
                    }
                  />
                </td>
                <td className="px-4 py-2">
                  <SecurityCombobox
                    value={newTx.ticker ?? ''}
                    placeholder="Ticker"
                    className={`${IIC} w-20`}
                    autoUpperCase
                    options={knownSecurities.map(k => ({ value: k.ticker, hint: k.security }))}
                    onChange={(ticker, pairedSec) =>
                      setNewTx(d => ({ ...d, ticker, ...(pairedSec ? { security: pairedSec } : {}) }))
                    }
                  />
                </td>
                <td className="px-4 py-2">
                  <select value={newTx.currency ?? 'CAD'} onChange={e => setNewTx(d => ({...d, currency: e.target.value as Transaction['currency']}))} className={`${IIC} w-20 cursor-pointer`}>
                    {(['CAD','USD','EUR','GBP'] as Transaction['currency'][]).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <select value={newTx.type ?? 'Purchase'} onChange={e => setNewTx(d => ({...d, type: e.target.value as Transaction['type']}))} className={`${IIC} cursor-pointer`}>
                    {(['Purchase','Sale','Dividend','Interest','Fee/Commission','Withholding Tax','Return of Capital','Reinvested Dividend','Transfer In','Transfer Out'] as Transaction['type'][]).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2 text-right"><input type="number" step="0.001" value={newTx.units ?? 0} onChange={e => setNewTx(d => ({...d, units: parseFloat(e.target.value)||0}))} className={`${IIC} w-24 text-right`} /></td>
                <td className="px-4 py-2 text-right"><input type="number" value={newTx.price ?? 0} onChange={e => setNewTx(d => ({...d, price: parseFloat(e.target.value)||0}))} className={`${IIC} w-20 text-right`} /></td>
                <td className="px-4 py-2 text-right"><input type="number" value={newTx.fxRate ?? ''} onChange={e => setNewTx(d => ({...d, fxRate: parseFloat(e.target.value)||undefined}))} className={`${IIC} w-20 text-right`} /></td>
                <td className="px-4 py-2 text-right tabular-nums text-xs">0.00</td>
                <td className="px-4 py-2"><select value={newTx.tbAccount ?? ''} onChange={e => setNewTx(d => ({...d, tbAccount: e.target.value}))} className={`${IIC} w-[180px] cursor-pointer`}>{CHART_OF_ACCOUNTS.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}</select></td>
                <td className="px-4 py-2"><select value={newTx.status ?? 'pending'} onChange={e => setNewTx(d => ({...d, status: e.target.value as Transaction['status']}))} className={`${IIC} cursor-pointer`}><option value="pending">Pending</option><option value="approved">Approved</option><option value="published">Published</option></select></td>
                <td className="px-4 py-2"></td>
                <td className="px-3 py-2">
                  <div className="flex gap-0.5">
                    <button onClick={() => {
                      const gross = Math.abs((newTx.units ?? 0) * (newTx.price ?? 0));
                      const fees = newTx.fees ?? 0;
                      const net = newTx.type === 'Sale' ? gross - fees : gross + fees;
                      const tx: Transaction = { id: `M${Date.now()}`, sourceId: newTx.sourceId ?? 'A', date: newTx.date ?? '2024-01-01', security: newTx.security ?? 'New Security', ticker: newTx.ticker ?? 'NEW', type: newTx.type ?? 'Purchase', units: newTx.units ?? 0, price: newTx.price ?? 0, gross, fees, net, currency: newTx.currency ?? 'CAD', fxRate: newTx.fxRate, notes: newTx.notes, status: newTx.status ?? 'pending', tbAccount: newTx.tbAccount ?? defaultTbAccount(newTx.type ?? 'Purchase') };
                      onAddTx?.(tx);
                      setAddingNew(false);
                      toast.success('Transaction added');
                    }} className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setAddingNew(false)} className="p-1.5 hover:bg-muted rounded-lg text-foreground"><X className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            )}
            {visibleTxns.map((t) => {
              const issues = validateTx(t);
              const status = (t.status ?? "published") as TxStatus;
              return (
                <tr key={t.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors${selectedTx.has(t.id) ? ' bg-primary/5' : ''}`}>
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selectedTx.has(t.id)}
                      onCheckedChange={(v) => {
                        setSelectedTx((s) => {
                          const next = new Set(s);
                          if (v) next.add(t.id); else next.delete(t.id);
                          return next;
                        });
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {editId === t.id
                      ? (
                        <input
                          type="date"
                          title="Trade date (also updates booking date)"
                          value={editData.tradeDate ?? editData.date ?? t.tradeDate ?? t.date}
                          onChange={e => setEditData(d => ({...d, date: e.target.value, tradeDate: e.target.value}))}
                          className={`${IIC} w-28`}
                        />
                      )
                      : fmtDate(t.tradeDate ?? t.date ?? '')
                    }
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {editId === t.id
                      ? (
                        <input
                          type="date"
                          title="Settlement date"
                          value={editData.settlementDate ?? t.settlementDate ?? ''}
                          onChange={e => setEditData(d => ({...d, settlementDate: e.target.value || undefined}))}
                          className={`${IIC} w-28`}
                        />
                      )
                      : (t.settlementDate
                          ? fmtDate(t.settlementDate)
                          : <span className="text-muted-foreground text-[11px]">—</span>)
                    }
                  </td>
                  <td className="px-4 py-3">
                    {editId === t.id ? (
                      <select
                        value={editData.sourceId ?? t.sourceId}
                        onChange={e => setEditData(d => ({ ...d, sourceId: e.target.value }))}
                        className={`${IIC} w-[130px] cursor-pointer`}
                      >
                        {allSources.map(s => (
                          <option key={s.id} value={s.id}>{s.institution.split(' ')[0]} ({s.id})</option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        {allSources.find((s) => s.id === t.sourceId)?.institution.split(" ")[0] ?? t.sourceId}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editId === t.id ? (
                      <SecurityCombobox
                        value={editData.security ?? t.security}
                        placeholder="Security name"
                        className={`${IIC} w-36`}
                        options={knownSecurities.map(k => ({ value: k.security, hint: k.ticker }))}
                        onChange={(sec, pairedTicker) =>
                          setEditData(d => ({ ...d, security: sec, ...(pairedTicker ? { ticker: pairedTicker } : {}) }))
                        }
                      />
                    ) : (
                      <div className="font-medium">{t.security}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {editId === t.id ? (
                      <SecurityCombobox
                        value={editData.ticker ?? t.ticker}
                        placeholder="Ticker"
                        className={`${IIC} w-20`}
                        autoUpperCase
                        options={knownSecurities.map(k => ({ value: k.ticker, hint: k.security }))}
                        onChange={(ticker, pairedSec) =>
                          setEditData(d => ({ ...d, ticker, ...(pairedSec ? { security: pairedSec } : {}) }))
                        }
                      />
                    ) : (
                      <span className="text-muted-foreground">{t.ticker}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {editId === t.id ? (
                      <select
                        value={editData.currency ?? t.currency}
                        onChange={e => setEditData(d => ({ ...d, currency: e.target.value as Transaction['currency'] }))}
                        className={`${IIC} w-20 cursor-pointer`}
                      >
                        {(['CAD','USD','EUR','GBP'] as Transaction['currency'][]).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-muted-foreground font-mono">{t.currency}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editId === t.id ? (
                      <select
                        value={editData.type ?? t.type}
                        onChange={e => setEditData(d => ({ ...d, type: e.target.value as TxType }))}
                        className={`${IIC} w-[160px] cursor-pointer`}
                      >
                        {([
                          "Purchase", "Sale", "Dividend", "Interest",
                          "Return of Capital", "Reinvested Dividend", "Withholding Tax",
                          "Fee/Commission", "Transfer In", "Transfer Out",
                          "FX Conversion", "Stock Split", "Opening",
                        ] as TxType[]).map(ty => (
                          <option key={ty} value={ty}>{ty}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge
                        variant={t.type === "Sale" ? "destructive" : t.type === "Purchase" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {t.type}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">
                    {editId === t.id
                      ? <input type="number" step="0.001" value={editData.units ?? t.units} onChange={e => setEditData(d => ({...d, units: parseFloat(e.target.value)||0}))} className={`${IIC} w-24 text-right`} />
                      : fmtNum(t.units, 3)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">
                    {editId === t.id
                      ? <input type="number" value={editData.price ?? t.price} onChange={e => setEditData(d => ({...d, price: parseFloat(e.target.value)||0}))} className={`${IIC} w-20 text-right`} />
                      : fmtNum(t.price ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">
                    {editId === t.id
                      ? <input type="number" value={editData.fxRate ?? t.fxRate ?? ''} onChange={e => setEditData(d => ({...d, fxRate: parseFloat(e.target.value)||undefined}))} className={`${IIC} w-20 text-right`} />
                      : fmtNum(t.fxRate ?? 0, 4)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">{fmtNum(t.net ?? 0)}</td>
                  <td className="px-4 py-3">
                    {editId === t.id ? (
                      <select
                        value={editData.tbAccount ?? t.tbAccount ?? defaultTbAccount(t.type)}
                        onChange={e => setEditData(d => ({...d, tbAccount: e.target.value}))}
                        className={`${IIC} w-[180px] cursor-pointer`}
                      >
                        {CHART_OF_ACCOUNTS.map((a) => (
                          <option key={a.code} value={a.code}>{a.code} · {a.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-muted-foreground font-mono">{t.tbAccount ?? defaultTbAccount(t.type)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><TxStatusBadge status={status} /></td>
                  <td className="px-4 py-3">
                    {issues.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertTriangle className={`h-4 w-4 cursor-help ${issues.some(i => i.level === "critical") ? "text-destructive" : "text-yellow-600"}`} />
                          </TooltipTrigger>
                          <TooltipContent>
                            <ul className="text-xs space-y-1">
                              {issues.map((i, idx) => <li key={idx}>{i.message}</li>)}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {editId === t.id ? (
                      <div className="flex gap-0.5">
                        <button onClick={() => { updateTx(t.id, editData); setEditId(null); toast.success('Saved'); }} className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setEditId(null)} className="p-1.5 hover:bg-muted rounded-lg text-foreground"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : (
                      <div className="flex gap-0.5 ">
                        <button onClick={() => { setEditId(t.id); setEditData({}); }} className="p-1.5 hover:bg-muted rounded-lg text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => { onDeleteTx?.(t.id); toast.success('Transaction removed'); }} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {visibleTxns.length === 0 && (
              <tr>
                <td colSpan={16} className="text-center text-sm text-muted-foreground py-8">
                  {anyColFilter
                    ? "No transactions match the active filters."
                    : "No transactions in this status."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Import Prior-Year Modal */}
      {importModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setImportModalOpen(false)} />
          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl bg-background">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Import Prior-Year Schedule</h2>
              <button onClick={() => setImportModalOpen(false)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <InvPriorYearImport
                applied={!!(importedLots && importedLots.length > 0)}
                appliedCount={importedLots?.length ?? 0}
                onApply={(lots) => { onApplyLots?.(lots); setImportModalOpen(false); }}
                onReset={() => { onResetLots?.(); }}
              />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
