import { useState, useMemo } from 'react';
import { AlertTriangle, X, Pencil, Trash2, Plus, Check } from 'lucide-react';
import { Badge } from '@/components/wp-ui/badge';
import { Button } from '@/components/wp-ui/button';
import { Checkbox } from '@/components/wp-ui/checkbox';
import {
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent,
} from '@/components/wp-ui/tooltip';
import { CHART_OF_ACCOUNTS, defaultTbAccount } from '@/lib/luka/coa';
import { validateTx } from '@/lib/luka/compute';
import type { Transaction, TxStatus, Source } from '@/lib/luka/types';
import { fmtNum } from './InvHoldingsTab';
import { ColFilter, SearchFilter } from './InvTableFilters';
import InvPlaidConnectDialog from './InvPlaidConnectDialog';
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
}: Props) {
  const [txStatusFilter, setTxStatusFilter] = useState<"all" | TxStatus>("all");
  const [selectedTx, setSelectedTx] = useState<Set<string>>(new Set());

  // Inline edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Transaction>>({});

  // New row state
  const [addingNew, setAddingNew] = useState(false);
  const [newTx, setNewTx] = useState<Partial<Transaction>>({});

  // Column-level filters
  const [filterSource,   setFilterSource]   = useState("");
  const [filterType,     setFilterType]     = useState("");
  const [filterSecurity, setFilterSecurity] = useState("");

  const anyColFilter = filterSource || filterType || filterSecurity;

  const clearColFilters = () => {
    setFilterSource(""); setFilterType(""); setFilterSecurity("");
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

    if (filterType) txns = txns.filter((t) => t.type === filterType);

    if (filterSecurity)
      txns = txns.filter(
        (t) =>
          t.security.toLowerCase().includes(filterSecurity.toLowerCase()) ||
          t.ticker.toLowerCase().includes(filterSecurity.toLowerCase()),
      );

    return txns;
  }, [effectiveTxns, txStatusFilter, filterSource, filterType, filterSecurity, allSources]);

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
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-primary bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Transaction
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
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
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
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <ColFilter
                  label="Type"
                  options={uniqueTypes}
                  value={filterType}
                  onChange={setFilterType}
                />
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Units</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">FX</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Net</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">TB Account</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 w-8"></th>
              <th className="px-3 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {addingNew && (
              <tr className="border-b border-border/50 bg-primary/5">
                <td className="px-4 py-2"><span /></td>
                <td className="px-4 py-2"><input type="date" value={newTx.date ?? ''} onChange={e => setNewTx(d => ({...d, date: e.target.value}))} className="h-7 w-28 text-xs px-2 border border-border rounded-md bg-background" /></td>
                <td className="px-4 py-2"><select value={newTx.sourceId ?? ''} onChange={e => setNewTx(d => ({...d, sourceId: e.target.value}))} className="h-7 text-xs px-2 border border-border rounded-md bg-background w-20"><option value="">—</option>{allSources.map(s => <option key={s.id} value={s.id}>{s.institution.split(' ')[0]}</option>)}</select></td>
                <td className="px-4 py-2">
                  <input placeholder="Security" value={newTx.security ?? ''} onChange={e => setNewTx(d => ({...d, security: e.target.value}))} className="h-7 text-xs px-2 border border-border rounded-md bg-background w-32" />
                  <input placeholder="Ticker" value={newTx.ticker ?? ''} onChange={e => setNewTx(d => ({...d, ticker: e.target.value}))} className="h-7 text-xs px-2 border border-border rounded-md bg-background w-16 mt-0.5" />
                </td>
                <td className="px-4 py-2">
                  <select value={newTx.type ?? 'Purchase'} onChange={e => setNewTx(d => ({...d, type: e.target.value as Transaction['type']}))} className="h-7 text-xs px-2 border border-border rounded-md bg-background">
                    {(['Purchase','Sale','Dividend','Interest','Fee/Commission','Withholding Tax','Return of Capital','Reinvested Dividend','Transfer In','Transfer Out'] as Transaction['type'][]).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2 text-right"><input type="number" value={newTx.units ?? 0} onChange={e => setNewTx(d => ({...d, units: parseFloat(e.target.value)||0}))} className="h-7 w-20 text-xs px-2 border border-border rounded-md bg-background text-right" /></td>
                <td className="px-4 py-2 text-right"><input type="number" value={newTx.price ?? 0} onChange={e => setNewTx(d => ({...d, price: parseFloat(e.target.value)||0}))} className="h-7 w-20 text-xs px-2 border border-border rounded-md bg-background text-right" /></td>
                <td className="px-4 py-2 text-right"><input type="number" value={newTx.fxRate ?? ''} onChange={e => setNewTx(d => ({...d, fxRate: parseFloat(e.target.value)||undefined}))} className="h-7 w-20 text-xs px-2 border border-border rounded-md bg-background text-right" /></td>
                <td className="px-4 py-2 text-right text-muted-foreground text-xs">—</td>
                <td className="px-4 py-2"><select value={newTx.tbAccount ?? ''} onChange={e => setNewTx(d => ({...d, tbAccount: e.target.value}))} className="h-7 rounded-md border border-border bg-background px-2 text-xs w-[180px]">{CHART_OF_ACCOUNTS.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}</select></td>
                <td className="px-4 py-2"><select value={newTx.status ?? 'pending'} onChange={e => setNewTx(d => ({...d, status: e.target.value as Transaction['status']}))} className="h-7 text-xs px-2 border border-border rounded-md bg-background"><option value="pending">Pending</option><option value="approved">Approved</option><option value="published">Published</option></select></td>
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
                <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
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
                      ? <input type="date" value={editData.date ?? t.date} onChange={e => setEditData(d => ({...d, date: e.target.value}))} className="h-7 w-28 text-xs px-2 border border-border rounded-md bg-background" />
                      : t.date}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">
                      {allSources.find((s) => s.id === t.sourceId)?.institution.split(" ")[0] ?? t.sourceId}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium">{t.security}</div>
                    <div className="text-xs text-muted-foreground font-mono">{t.ticker} · {t.currency}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={t.type === "Sale" ? "destructive" : t.type === "Purchase" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {t.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">
                    {editId === t.id
                      ? <input type="number" value={editData.units ?? t.units} onChange={e => setEditData(d => ({...d, units: parseFloat(e.target.value)||0}))} className="h-7 w-20 text-xs px-2 border border-border rounded-md bg-background text-right" />
                      : t.units !== 0 ? fmtNum(t.units, 2) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">
                    {editId === t.id
                      ? <input type="number" value={editData.price ?? t.price} onChange={e => setEditData(d => ({...d, price: parseFloat(e.target.value)||0}))} className="h-7 w-20 text-xs px-2 border border-border rounded-md bg-background text-right" />
                      : t.price ? fmtNum(t.price) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">
                    {editId === t.id
                      ? <input type="number" value={editData.fxRate ?? t.fxRate ?? ''} onChange={e => setEditData(d => ({...d, fxRate: parseFloat(e.target.value)||undefined}))} className="h-7 w-20 text-xs px-2 border border-border rounded-md bg-background text-right" />
                      : t.fxRate ? fmtNum(t.fxRate, 4) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">{t.net ? fmtNum(t.net) : "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={t.tbAccount ?? defaultTbAccount(t.type)}
                      onChange={(e) => updateTx(t.id, { tbAccount: e.target.value })}
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring w-[210px]"
                    >
                      {CHART_OF_ACCOUNTS.map((a) => (
                        <option key={a.code} value={a.code}>{a.code} · {a.name}</option>
                      ))}
                    </select>
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
                <td colSpan={13} className="text-center text-sm text-muted-foreground py-8">
                  {anyColFilter
                    ? "No transactions match the active filters."
                    : "No transactions in this status."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
