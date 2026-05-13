import React, { useState, useMemo } from 'react';
import { Wallet, TrendingUp, Banknote, RefreshCw, Plus, FileSearch, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/wp-ui/badge';
import type { SecuritySchedule } from '@/lib/luka/compute';
import type { Source } from '@/lib/luka/types';
import { ColFilter, SearchFilter, ClearFiltersBtn } from './InvTableFilters';

// ── Formatting helpers (module-level exports so other tabs can import them) ───
const CCY_SYMBOL: Record<string, string> = { CAD: "$", USD: "US$", EUR: "€", GBP: "£" };

export const fmtCAD = (n: number) =>
  new Intl.NumberFormat("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const fmtCcy = (n: number, ccy: string) => {
  const abs = new Intl.NumberFormat("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n));
  return n < 0 ? `(${abs})` : abs;
};

export const fmtNum = (n: number, d = 2) =>
  new Intl.NumberFormat("en-CA", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);

export const fmtSigned = (n: number) =>
  `${n >= 0 ? "+" : "-"}${fmtCAD(Math.abs(n))}`;

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyInvestmentState({ onScan, onAddManually }: { onScan: () => void; onAddManually: () => void }) {
  const [dragging, setDragging] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 gap-6">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">No Investment Data</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          This workpaper has no holdings yet. Scan a broker statement to import automatically, or add holdings manually to get started.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
        <div
          className={`flex-1 flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl px-6 py-8 transition-colors cursor-pointer ${
            dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); onScan(); }}
          onClick={onScan}
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileSearch className="w-5 h-5 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Scan Investment Statement</p>
            <p className="text-xs text-muted-foreground mt-0.5">Upload a broker PDF or image — AI extracts holdings &amp; transactions</p>
            <p className="text-[11px] text-muted-foreground/70 mt-1">PDF, DOCX, PNG, JPG supported</p>
          </div>
        </div>
        <div className="flex sm:flex-col items-center justify-center gap-2 text-xs text-muted-foreground select-none">
          <div className="flex-1 h-px sm:h-auto sm:w-px bg-border" />
          <span className="px-1">or</span>
          <div className="flex-1 h-px sm:h-auto sm:w-px bg-border" />
        </div>
        <div
          className="flex-1 flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl px-6 py-8 border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
          onClick={onAddManually}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Plus className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Add Manually</p>
            <p className="text-xs text-muted-foreground mt-0.5">Enter holdings directly into the table, one row at a time</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  schedules: SecuritySchedule[];
  totals: { cost: number; fmv: number; realized: number; unrealized: number };
  allSources: Source[];
  onUpload?: () => void;
  isEmpty?: boolean;
  isNew?: boolean;
  onFirstData?: () => void;
}

export function InvHoldingsTab({ schedules, totals, allSources, onUpload, isEmpty, onFirstData }: Props) {
  const [filterSecurity, setFilterSecurity] = useState("");
  const [filterBroker,   setFilterBroker]   = useState("");
  const [filterCcy,      setFilterCcy]      = useState("");
  const [hiddenKeys,     setHiddenKeys]     = useState<Set<string>>(new Set());

  const anyFilter = filterSecurity || filterBroker || filterCcy;

  const uniqueBrokers = useMemo(
    () => Array.from(new Set(schedules.flatMap((s) =>
      s.sourceIds.map((id) => allSources.find((x) => x.id === id)?.institution.split(" ")[0] ?? id)
    ))).sort(),
    [schedules, allSources],
  );

  const uniqueCcys = useMemo(
    () => Array.from(new Set(schedules.map((s) => s.currency))).sort(),
    [schedules],
  );

  const visible = useMemo(() => {
    let rows = schedules.filter(s => !hiddenKeys.has(s.key));
    if (filterSecurity) rows = rows.filter((s) =>
      s.security.toLowerCase().includes(filterSecurity.toLowerCase()) ||
      s.ticker.toLowerCase().includes(filterSecurity.toLowerCase())
    );
    if (filterBroker) rows = rows.filter((s) =>
      s.sourceIds.some((id) =>
        (allSources.find((x) => x.id === id)?.institution.split(" ")[0] ?? id) === filterBroker
      )
    );
    if (filterCcy) rows = rows.filter((s) => s.currency === filterCcy);
    return rows;
  }, [schedules, filterSecurity, filterBroker, filterCcy, allSources, hiddenKeys]);

  if (isEmpty) {
    return <EmptyInvestmentState onScan={() => onUpload?.()} onAddManually={() => onFirstData?.()} />;
  }

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Holdings</h2>
          <p className="text-sm text-muted-foreground mt-1">Closing positions across all brokers (published transactions only)</p>
        </div>
        <div className="flex items-center gap-2">
          {anyFilter && <ClearFiltersBtn onClick={() => { setFilterSecurity(""); setFilterBroker(""); setFilterCcy(""); }} />}
          {hiddenKeys.size > 0 && <span className="text-xs text-muted-foreground">{hiddenKeys.size} hidden</span>}
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border border-green-500/30 bg-green-500/10 text-green-700">
            {visible.length} / {schedules.length} positions
          </span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs text-muted-foreground">Carrying value (WAC)</p>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{fmtCAD(totals.cost)}</p>
          <p className="text-xs text-muted-foreground mt-1">CAD</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs text-muted-foreground">FMV (period-end)</p>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{fmtCAD(totals.fmv)}</p>
          <p className="text-xs text-muted-foreground mt-1">CAD</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs text-muted-foreground">Realized G/L</p>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className={`mt-2 text-2xl font-semibold tabular-nums ${totals.realized >= 0 ? "text-foreground" : "text-foreground"}`}>
            {fmtSigned(totals.realized)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">CAD</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs text-muted-foreground">Unrealized G/L</p>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className={`mt-2 text-2xl font-semibold tabular-nums ${totals.unrealized >= 0 ? "text-foreground" : "text-foreground"}`}>
            {fmtSigned(totals.unrealized)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">CAD</p>
        </div>
      </div>

      {/* Holdings table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <SearchFilter label="Security" value={filterSecurity} onChange={setFilterSecurity} placeholder="Ticker or name…" />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <ColFilter label="Broker" options={uniqueBrokers} value={filterBroker} onChange={setFilterBroker} />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <ColFilter label="CCY" options={uniqueCcys} value={filterCcy} onChange={setFilterCcy} />
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Closing Units</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">WAC / Unit</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cost (CAD)</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">FMV (CAD)</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unrealized G/L</th>
              <th className="px-3 py-3 w-16 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => (
              <tr key={s.key} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-sm">
                  <div className="font-medium">{s.security}</div>
                  <div className="text-xs text-muted-foreground font-mono">{s.ticker}</div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {s.sourceIds.map((id) => allSources.find((x) => x.id === id)?.institution.split(" ")[0]).join(", ")}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="font-mono text-xs">{s.currency}</Badge>
                </td>
                <td className="px-4 py-3 text-sm text-right tabular-nums">{fmtNum(s.closingUnits, 0)}</td>
                <td className="px-4 py-3 text-sm text-right tabular-nums">{fmtCAD(s.closingWac)}</td>
                <td className="px-4 py-3 text-sm text-right tabular-nums">{fmtCAD(s.closingCostCAD)}</td>
                <td className="px-4 py-3 text-sm text-right tabular-nums">{fmtCAD(s.fmvCAD)}</td>
                <td className={`px-4 py-3 text-sm text-right tabular-nums ${s.unrealizedGL >= 0 ? "text-foreground" : "text-foreground"}`}>
                  {fmtSigned(s.unrealizedGL)}
                </td>
                <td className="px-3 py-3">
                  <div className="flex gap-0.5 ">
                    <button onClick={() => toast('Holdings are computed from source transactions')} className="p-1.5 hover:bg-muted rounded-lg text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setHiddenKeys(prev => { const n = new Set(prev); n.add(s.key); return n; })} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {anyFilter ? "No positions match the active filters." : "No positions — connect a source or enable prior-year file in Settings."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
