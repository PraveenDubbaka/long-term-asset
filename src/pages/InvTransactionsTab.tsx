import { useState, useMemo } from 'react';
import { AlertTriangle, X } from 'lucide-react';
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
}: Props) {
  const [txStatusFilter, setTxStatusFilter] = useState<"all" | TxStatus>("all");
  const [selectedTx, setSelectedTx] = useState<Set<string>>(new Set());

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
            </tr>
          </thead>
          <tbody>
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
                  <td className="px-4 py-3 text-xs whitespace-nowrap">{t.date}</td>
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
                  <td className="px-4 py-3 text-right tabular-nums text-xs">{t.units !== 0 ? fmtNum(t.units, 2) : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">{t.price ? fmtNum(t.price) : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">{t.fxRate ? fmtNum(t.fxRate, 4) : "—"}</td>
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
                </tr>
              );
            })}
            {visibleTxns.length === 0 && (
              <tr>
                <td colSpan={12} className="text-center text-sm text-muted-foreground py-8">
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
