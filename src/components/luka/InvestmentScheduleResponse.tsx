import { useState, useMemo, useCallback, Fragment } from "react";
import { useStore } from "@/store/useStore";
import {
  compute, buildAJEs, buildIncomeMatrix, buildFxSchedule,
  buildInvestmentRecon, buildCashRecon,
  type ComputeOptions,
  type SecuritySchedule,
  type AJE,
} from "@/lib/luka/compute";
import { sources as baseSources, priorYearLots, currentYearTransactions } from "@/lib/luka/mockData";
import type { Source, Transaction, PriorYearLot } from "@/lib/luka/types";
import { defaultTbAccount } from "@/lib/luka/coa";
import { Pencil, Trash2, Plus, Check, X, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, ChevronRight, Send, RotateCcw, FileDown, BarChart2 } from "lucide-react";
import { CHART_OF_ACCOUNTS } from "@/lib/luka/coa";

// ─── LocalInvJE type (inline, not imported from page) ─────────────────────────
type AJEStatus = "Draft" | "Approved" | "Posted";

interface LocalInvJE {
  _id: string;
  ref: string;
  description: string;
  drAccount: string;
  crAccount: string;
  drDescription: string;
  crDescription: string;
  amount: number;
  type: AJE["type"];
  confidence: AJE["confidence"];
  status: AJEStatus;
  notes: string;
  deleted: boolean;
  deletedAt?: string;
}

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtDate = (d: string) => {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
};

const fmt = (n: number) =>
  n.toLocaleString("en-CA", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmt2 = (n: number) =>
  n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmt4 = (n: number) =>
  n.toLocaleString("en-CA", { minimumFractionDigits: 4, maximumFractionDigits: 4 });

const fmtGL = (n: number) =>
  n >= 0
    ? <span className="text-green-700 tabular-nums">{fmt2(n)}</span>
    : <span className="text-red-600 tabular-nums">({fmt2(Math.abs(n))})</span>;

// ─── Shared input / select class ──────────────────────────────────────────────
const IC = "h-7 text-xs px-2 border border-border rounded-md bg-background focus:outline-none w-full";
const SC = "h-7 text-xs px-2 border border-border rounded-md bg-background focus:outline-none w-full appearance-none";

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:   "bg-amber-50 text-amber-700 border-amber-200",
    approved:  "bg-blue-50 text-blue-700 border-blue-200",
    published: "bg-green-50 text-green-700 border-green-200",
    Draft:     "bg-muted text-muted-foreground border-border",
    Approved:  "bg-blue-50 text-blue-700 border-blue-200",
    Posted:    "bg-green-50 text-green-700 border-green-200",
  };
  const cls = map[status] ?? "bg-muted text-muted-foreground border-border";
  const icon =
    status === "Approved" || status === "approved" || status === "published"
      ? <CheckCircle2 className="h-2.5 w-2.5" />
      : status === "pending"
      ? <AlertTriangle className="h-2.5 w-2.5" />
      : null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${cls}`}>
      {icon}{status}
    </span>
  );
}

// ─── Table shell helpers ──────────────────────────────────────────────────────
function TableWrap({ title, subtitle, onAdd, addLabel, children }: {
  title: string;
  subtitle?: string;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[8px] border border-border overflow-hidden">
      <div className="px-3 py-2 bg-muted/40 border-b border-border flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <div className="flex items-center gap-3">
          {subtitle && <span className="text-[10px] text-muted-foreground">{subtitle}</span>}
          {onAdd && (
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-1 h-7 px-2.5 text-[11px] font-medium bg-primary text-primary-foreground rounded-[7px] hover:bg-primary/90 transition-colors shrink-0"
            >
              <Plus className="w-3 h-3" />{addLabel ?? "Add Row"}
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
type TabId =
  | "transactions" | "wac" | "gainloss" | "fx" | "income"
  | "brokerrecon" | "taxrecon" | "ajes" | "holdings";

const TABS: { id: TabId; label: string }[] = [
  { id: "transactions", label: "Transactions"      },
  { id: "wac",          label: "WAC Schedule"      },
  { id: "gainloss",     label: "Gain / Loss"       },
  { id: "fx",           label: "FX Schedule"       },
  { id: "income",       label: "Income & Expenses" },
  { id: "brokerrecon",  label: "Broker Recon"      },
  { id: "taxrecon",     label: "Tax Recon"         },
  { id: "ajes",         label: "AJEs"              },
  { id: "holdings",     label: "Holdings"          },
];

// ─── Tab 1: Transactions ──────────────────────────────────────────────────────
const TX_TYPES = [
  "Purchase","Sale","Dividend","Interest","Return of Capital",
  "Withholding Tax","Fee/Commission","Transfer In","Transfer Out","Reinvested Dividend",
] as const;
type TxFormType = typeof TX_TYPES[number];

// Type badge colours matching workpapers
function TxTypeBadge({ type }: { type: string }) {
  const cls: Record<string, string> = {
    "Purchase":            "bg-blue-50 text-blue-700 border-blue-200",
    "Sale":                "bg-red-50 text-red-700 border-red-200",
    "Dividend":            "bg-green-50 text-green-700 border-green-200",
    "Reinvested Dividend": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Interest":            "bg-purple-50 text-purple-700 border-purple-200",
    "Return of Capital":   "bg-amber-50 text-amber-700 border-amber-200",
    "Withholding Tax":     "bg-orange-50 text-orange-700 border-orange-200",
    "Fee/Commission":      "bg-slate-100 text-slate-600 border-slate-200",
    "Transfer In":         "bg-cyan-50 text-cyan-700 border-cyan-200",
    "Transfer Out":        "bg-pink-50 text-pink-700 border-pink-200",
  };
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${cls[type] ?? "bg-muted text-muted-foreground border-border"}`}>
      {type}
    </span>
  );
}

interface TxDraft {
  date: string; settlement: string; broker: string; security: string; ticker: string;
  type: TxFormType; qty: number; price: number; ccy: string;
  fxRate: number; tbAccount: string; status: "pending" | "approved" | "published";
}

const EMPTY_TX_DRAFT = (): TxDraft => ({
  date: "", settlement: "", broker: "", security: "", ticker: "", type: "Purchase",
  qty: 0, price: 0, ccy: "CAD", fxRate: 1, tbAccount: "", status: "pending",
});

// 14 columns: ☐ | Trade Date | Settlement | Source | Security | Ticker | CCY | Type | Units | Price | FX | Amount | TB Account | Status
const TX_COLS = ["","Trade Date","Settlement","Source","Security","Ticker","CCY","Type","Units","Price","FX","Amount","TB Account","Status"];
const TX_LEFT = new Set([0,1,2,3,4,5]);          // left-aligned column indices
const COL_SPAN = TX_COLS.length;

function TransactionsPanel({
  effectiveTxns,
  allInvSources,
  manualTxns,
  setManualTxns,
  hiddenTxIds,
  setHiddenTxIds,
  txEdits,
  setTxEdits,
}: {
  effectiveTxns: Transaction[];
  allInvSources: Source[];
  manualTxns: Transaction[];
  setManualTxns: React.Dispatch<React.SetStateAction<Transaction[]>>;
  hiddenTxIds: Set<string>;
  setHiddenTxIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  txEdits: Record<string, Partial<Transaction>>;
  setTxEdits: React.Dispatch<React.SetStateAction<Record<string, Partial<Transaction>>>>;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<TxDraft>(EMPTY_TX_DRAFT());
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<TxDraft>(EMPTY_TX_DRAFT());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "published">("all");

  const visible = effectiveTxns.filter(t => {
    if (hiddenTxIds.has(t.id)) return false;
    if (statusFilter !== "all" && (t.status ?? "pending") !== statusFilter) return false;
    return true;
  });
  const allSelected = visible.length > 0 && visible.every(t => selectedIds.has(t.id));

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(visible.map(t => t.id)));
  };
  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const bulkSetStatus = (status: Transaction["status"]) => {
    setTxEdits(m => {
      const next = { ...m };
      selectedIds.forEach(id => { next[id] = { ...(next[id] ?? {}), status }; });
      return next;
    });
    setSelectedIds(new Set());
  };

  const brokerName = (t: Transaction) =>
    allInvSources.find(s => s.id === t.sourceId)?.institution ?? t.sourceId;

  const saveAdd = () => {
    const tx: Transaction = {
      id: `manual-${Date.now()}`,
      sourceId: draft.broker,
      date: draft.date,
      settlementDate: draft.settlement || undefined,
      security: draft.security,
      ticker: draft.ticker,
      type: draft.type as Transaction["type"],
      units: draft.qty,
      price: draft.price,
      gross: draft.qty * draft.price,
      fees: 0,
      net: draft.qty * draft.price,
      currency: draft.ccy as Transaction["currency"],
      fxRate: draft.fxRate,
      status: draft.status,
      tbAccount: draft.tbAccount || defaultTbAccount(draft.type as Transaction["type"]),
    };
    setManualTxns(prev => [...prev, tx]);
    setAdding(false);
    setDraft(EMPTY_TX_DRAFT());
  };

  const saveEdit = () => {
    if (!editId) return;
    setTxEdits(m => ({
      ...m,
      [editId]: {
        ...(m[editId] ?? {}),
        date: editDraft.date,
        settlementDate: editDraft.settlement || undefined,
        security: editDraft.security,
        ticker: editDraft.ticker,
        type: editDraft.type as Transaction["type"],
        units: editDraft.qty,
        price: editDraft.price,
        currency: editDraft.ccy as Transaction["currency"],
        fxRate: editDraft.fxRate,
        tbAccount: editDraft.tbAccount || undefined,
        status: editDraft.status,
      },
    }));
    setEditId(null);
  };

  const startEdit = (t: Transaction) => {
    setEditId(t.id);
    setEditDraft({
      date: t.date,
      settlement: t.settlementDate ?? "",
      broker: brokerName(t),
      security: t.security,
      ticker: t.ticker,
      type: (TX_TYPES.includes(t.type as TxFormType) ? t.type : "Purchase") as TxFormType,
      qty: t.units,
      price: t.price,
      ccy: t.currency,
      fxRate: t.fxRate ?? 1,
      tbAccount: t.tbAccount ?? "",
      status: (t.status ?? "pending") as TxDraft["status"],
    });
  };

  const renderFormRow = (
    d: TxDraft,
    setD: (k: keyof TxDraft, v: unknown) => void,
    onSave: () => void,
    onCancel: () => void,
  ) => (
    <tr className="border-b border-primary/30 bg-primary/[0.03]">
      <td colSpan={COL_SPAN} className="px-3 py-2">
        <div className="grid gap-1.5 items-end" style={{ gridTemplateColumns: "repeat(14, minmax(0,1fr))" }}>
          {/* Trade Date */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground uppercase">Trade Date</span>
            <input type="date" value={d.date} onChange={e => setD("date", e.target.value)} className={IC} />
          </div>
          {/* Settlement */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground uppercase">Settlement</span>
            <input type="date" value={d.settlement} onChange={e => setD("settlement", e.target.value)} className={IC} />
          </div>
          {/* Source */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground uppercase">Source</span>
            <input value={d.broker} onChange={e => setD("broker", e.target.value)} className={IC} placeholder="Broker" />
          </div>
          {/* Security */}
          <div className="flex flex-col gap-0.5 col-span-2">
            <span className="text-[9px] text-muted-foreground uppercase">Security</span>
            <input value={d.security} onChange={e => setD("security", e.target.value)} className={IC} placeholder="Security name" />
          </div>
          {/* Ticker */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground uppercase">Ticker</span>
            <input value={d.ticker} onChange={e => setD("ticker", e.target.value.toUpperCase())} className={IC} placeholder="AAPL" />
          </div>
          {/* CCY */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground uppercase">CCY</span>
            <select value={d.ccy} onChange={e => setD("ccy", e.target.value)} className={SC}>
              {["CAD","USD","EUR","GBP"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {/* Type */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground uppercase">Type</span>
            <select value={d.type} onChange={e => setD("type", e.target.value)} className={SC}>
              {TX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {/* Units */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground uppercase">Units</span>
            <input type="number" value={d.qty || ""} onChange={e => setD("qty", parseFloat(e.target.value) || 0)} className={IC} placeholder="0" />
          </div>
          {/* Price */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground uppercase">Price</span>
            <input type="number" value={d.price || ""} onChange={e => setD("price", parseFloat(e.target.value) || 0)} className={IC} placeholder="0.00" />
          </div>
          {/* FX */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground uppercase">FX</span>
            <input type="number" step="0.0001" value={d.fxRate || ""} onChange={e => setD("fxRate", parseFloat(e.target.value) || 1)} className={IC} placeholder="1.0000" />
          </div>
          {/* TB Account */}
          <div className="flex flex-col gap-0.5 col-span-2">
            <span className="text-[9px] text-muted-foreground uppercase">TB Acct</span>
            <select value={d.tbAccount} onChange={e => setD("tbAccount", e.target.value)} className={SC}>
              <option value="">— Select —</option>
              {CHART_OF_ACCOUNTS.map(a => (
                <option key={a.code} value={a.code}>{a.code} · {a.name}</option>
              ))}
            </select>
          </div>
          {/* Status */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground uppercase">Status</span>
            <select value={d.status} onChange={e => setD("status", e.target.value)} className={SC}>
              {["pending","approved","published"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {/* Save / Cancel */}
          <div className="flex items-end gap-1 pb-0.5">
            <button onClick={onSave} className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
              <Check className="w-3 h-3" />
            </button>
            <button onClick={onCancel} className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border text-muted-foreground hover:bg-muted shrink-0">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="rounded-[8px] border border-border overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-muted/40 border-b border-border flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">Transactions</span>
        <div className="flex items-center gap-2">
          {/* Status filter dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground font-medium">View:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
              className="h-7 text-[11px] px-2 pr-6 border border-border rounded-[7px] bg-background text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
            </select>
          </div>
          {selectedIds.size > 0 && (
            <>
              <span className="text-[11px] text-muted-foreground">{selectedIds.size} selected</span>
              <button onClick={() => bulkSetStatus("approved")} className="inline-flex items-center h-7 px-2.5 text-[11px] font-medium rounded-[7px] border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">Approve</button>
              <button onClick={() => bulkSetStatus("published")} className="inline-flex items-center h-7 px-2.5 text-[11px] font-medium rounded-[7px] border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors">Publish</button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]" style={{ minWidth: 1100 }}>
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              {/* Checkbox all */}
              <th className="px-3 py-2 w-7">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-3.5 h-3.5 accent-primary rounded"
                />
              </th>
              {TX_COLS.slice(1).map((h, i) => (
                <th
                  key={h}
                  className={`px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${TX_LEFT.has(i + 1) ? "text-left" : "text-right"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {adding && renderFormRow(draft, (k, v) => setDraft(p => ({ ...p, [k]: v })), saveAdd, () => setAdding(false))}
            {visible.map((t, i) => {
              const isEditing = editId === t.id;
              const d = editDraft;
              const setD = (k: keyof TxDraft, v: unknown) => setEditDraft(p => ({ ...p, [k]: v }));
              return (
                <tr
                  key={t.id}
                  className={`border-b border-border/40 ${isEditing ? "bg-primary/[0.04]" : i % 2 === 1 ? "bg-muted/10" : ""}`}
                >
                  {/* Checkbox */}
                  <td className="px-3 py-1.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(t.id)}
                      onChange={() => toggleOne(t.id)}
                      className="w-3.5 h-3.5 accent-primary rounded"
                    />
                  </td>

                  {/* Trade Date */}
                  <td className="px-2 py-1">
                    {isEditing
                      ? <input type="date" value={d.date} onChange={e => setD("date", e.target.value)} className={`${IC} w-28`} />
                      : <span className="whitespace-nowrap">{fmtDate(t.date)}</span>}
                  </td>

                  {/* Settlement */}
                  <td className="px-2 py-1">
                    {isEditing
                      ? <input type="date" value={d.settlement} onChange={e => setD("settlement", e.target.value)} className={`${IC} w-28`} />
                      : <span className="whitespace-nowrap text-muted-foreground">{t.settlementDate ? fmtDate(t.settlementDate) : "—"}</span>}
                  </td>

                  {/* Source */}
                  <td className="px-2 py-1 max-w-[90px]">
                    {isEditing
                      ? <input value={d.broker} onChange={e => setD("broker", e.target.value)} className={`${IC} w-24`} placeholder="Broker" />
                      : <span className="truncate block">{brokerName(t)}</span>}
                  </td>

                  {/* Security */}
                  <td className="px-2 py-1 max-w-[110px]">
                    {isEditing
                      ? <input value={d.security} onChange={e => setD("security", e.target.value)} className={`${IC} w-32`} placeholder="Security" />
                      : <span className="font-medium truncate block">{t.security}</span>}
                  </td>

                  {/* Ticker */}
                  <td className="px-2 py-1">
                    {isEditing
                      ? <input value={d.ticker} onChange={e => setD("ticker", e.target.value.toUpperCase())} className={`${IC} w-16`} placeholder="AAPL" />
                      : <span className="font-mono text-[10px]">{t.ticker}</span>}
                  </td>

                  {/* CCY */}
                  <td className="px-2 py-1 text-center">
                    {isEditing
                      ? <select value={d.ccy} onChange={e => setD("ccy", e.target.value)} className={`${SC} w-16`}>
                          {["CAD","USD","EUR","GBP"].map(c => <option key={c}>{c}</option>)}
                        </select>
                      : <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-foreground border border-border">{t.currency}</span>}
                  </td>

                  {/* Type */}
                  <td className="px-2 py-1">
                    {isEditing
                      ? <select value={d.type} onChange={e => setD("type", e.target.value)} className={`${SC} w-32`}>
                          {TX_TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                        </select>
                      : <TxTypeBadge type={t.type} />}
                  </td>

                  {/* Units */}
                  <td className="px-2 py-1 text-right">
                    {isEditing
                      ? <input type="number" value={d.qty || ""} onChange={e => setD("qty", parseFloat(e.target.value) || 0)} className={`${IC} w-20 text-right`} placeholder="0" />
                      : <span className="tabular-nums">{fmt2(t.units)}</span>}
                  </td>

                  {/* Price */}
                  <td className="px-2 py-1 text-right">
                    {isEditing
                      ? <input type="number" value={d.price || ""} onChange={e => setD("price", parseFloat(e.target.value) || 0)} className={`${IC} w-20 text-right`} placeholder="0.00" />
                      : <span className="tabular-nums">{fmt2(t.price)}</span>}
                  </td>

                  {/* FX */}
                  <td className="px-2 py-1 text-right">
                    {isEditing
                      ? <input type="number" step="0.0001" value={d.fxRate || ""} onChange={e => setD("fxRate", parseFloat(e.target.value) || 1)} className={`${IC} w-20 text-right`} placeholder="1.0000" />
                      : <span className="tabular-nums text-muted-foreground">{t.currency === "CAD" ? "—" : fmt4(t.fxRate ?? 1)}</span>}
                  </td>

                  {/* Amount — always read-only (computed) */}
                  <td className="px-2 py-1 text-right">
                    <span className="tabular-nums font-medium">
                      {isEditing ? fmt2(d.qty * d.price * d.fxRate) : fmt2(t.net * (t.fxRate ?? 1))}
                    </span>
                  </td>

                  {/* TB Account */}
                  <td className="px-2 py-1 text-right">
                    {isEditing
                      ? <select
                          value={d.tbAccount}
                          onChange={e => setD("tbAccount", e.target.value)}
                          className={`${SC} w-44`}
                        >
                          <option value="">— Select —</option>
                          {CHART_OF_ACCOUNTS.map(a => (
                            <option key={a.code} value={a.code}>{a.code} · {a.name}</option>
                          ))}
                        </select>
                      : <span className="tabular-nums text-muted-foreground font-mono text-[10px]">{t.tbAccount ?? "—"}</span>}
                  </td>

                  {/* Status */}
                  <td className="px-2 py-1 text-right">
                    {isEditing
                      ? <select value={d.status} onChange={e => setD("status", e.target.value as TxDraft["status"])} className={`${SC} w-24`}>
                          {["pending","approved","published"].map(s => <option key={s}>{s}</option>)}
                        </select>
                      : <StatusBadge status={t.status ?? "pending"} />}
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab 2: WAC Schedule ──────────────────────────────────────────────────────
function WACPanel({ schedules }: { schedules: SecuritySchedule[] }) {
  const totOpenCost  = schedules.reduce((s, x) => s + (x.rows.find(r => r.unitsIn > 0) ? x.rows.filter(r => r.type === "Opening Balance").reduce((a, r) => a + r.costIn, 0) : 0), 0);
  const totPurchases = schedules.reduce((s, x) => s + x.rows.filter(r => r.unitsIn > 0 && r.type !== "Opening Balance").reduce((a, r) => a + r.costIn, 0), 0);
  const totDisposals = schedules.reduce((s, x) => s + x.rows.filter(r => r.unitsOut > 0).reduce((a, r) => a + r.costOut, 0), 0);
  const totCloseCost = schedules.reduce((s, x) => s + x.closingCostCAD, 0);

  return (
    <TableWrap title="WAC Schedule">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            {["Security","Ticker","CCY","Open Units","Open Cost","Purchases","Disposals","Close Units","Close Cost","WAC/Unit"].map((h, i) => (
              <th key={h} className={`px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${i < 3 ? "text-left" : "text-right"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {schedules.map((s, i) => {
            const openUnits  = s.rows.filter(r => r.type === "Opening Balance").reduce((a, r) => a + r.unitsIn, 0);
            const openCost   = s.rows.filter(r => r.type === "Opening Balance").reduce((a, r) => a + r.costIn, 0);
            const purchases  = s.rows.filter(r => r.unitsIn > 0 && r.type !== "Opening Balance").reduce((a, r) => a + r.costIn, 0);
            const disposals  = s.rows.filter(r => r.unitsOut > 0).reduce((a, r) => a + r.costOut, 0);
            return (
              <tr key={s.key} className={`border-b border-border/40 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                <td className="px-3 py-1.5 font-medium">{s.security}</td>
                <td className="px-3 py-1.5 font-mono">{s.ticker}</td>
                <td className="px-3 py-1.5">{s.currency}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fmt2(openUnits)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fmt(openCost)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-green-700">{fmt(purchases)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-red-600">{disposals > 0 ? `(${fmt(disposals)})` : "—"}</td>
                <td className="px-3 py-1.5 text-right tabular-nums font-medium">{fmt2(s.closingUnits)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums font-semibold">{fmt(s.closingCostCAD)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fmt4(s.closingWac)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-muted/30 border-t border-border font-semibold">
            <td className="px-3 py-2 text-[11px]" colSpan={4}>Total</td>
            <td className="px-3 py-2 text-right tabular-nums text-[11px]">{fmt(totOpenCost)}</td>
            <td className="px-3 py-2 text-right tabular-nums text-[11px] text-green-700">{fmt(totPurchases)}</td>
            <td className="px-3 py-2 text-right tabular-nums text-[11px] text-red-600">{totDisposals > 0 ? `(${fmt(totDisposals)})` : "—"}</td>
            <td className="px-3 py-2" />
            <td className="px-3 py-2 text-right tabular-nums text-[11px] font-bold">{fmt(totCloseCost)}</td>
            <td className="px-3 py-2" />
          </tr>
        </tfoot>
      </table>
    </TableWrap>
  );
}

// ─── Tab 3: Gain / Loss ───────────────────────────────────────────────────────
function GainLossPanel({ schedules }: { schedules: SecuritySchedule[] }) {
  const disposals = schedules.flatMap(s =>
    s.rows
      .filter(r => r.unitsOut > 0)
      .map(r => ({
        security: s.security,
        ticker: s.ticker,
        date: r.date,
        units: r.unitsOut,
        proceeds: (r.realizedGL ?? 0) + r.costOut,
        costOut: r.costOut,
        gl: r.realizedGL ?? 0,
      }))
  );
  const totGL = disposals.reduce((s, d) => s + d.gl, 0);
  const totUnrealized = schedules.reduce((s, x) => s + x.unrealizedGL, 0);

  return (
    <div className="space-y-3">
      <TableWrap title="Realized Gain / Loss">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              {["Security","Ticker","Date","Units","Gross Proceeds","Cost (ACB)","Realized G/L"].map((h, i) => (
                <th key={h} className={`px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${i < 3 ? "text-left" : "text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {disposals.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-[11px] text-muted-foreground">No disposals in this period</td></tr>
            )}
            {disposals.map((d, i) => (
              <tr key={`${d.ticker}-${d.date}-${i}`} className={`border-b border-border/40 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                <td className="px-3 py-1.5 font-medium">{d.security}</td>
                <td className="px-3 py-1.5 font-mono">{d.ticker}</td>
                <td className="px-3 py-1.5 whitespace-nowrap">{fmtDate(d.date)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fmt2(d.units)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fmt2(d.proceeds)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fmt2(d.costOut)}</td>
                <td className="px-3 py-1.5 text-right">{fmtGL(d.gl)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/30 border-t border-border font-semibold">
              <td className="px-3 py-2 text-[11px]" colSpan={6}>Total Realized</td>
              <td className="px-3 py-2 text-right text-[11px]">{fmtGL(totGL)}</td>
            </tr>
          </tfoot>
        </table>
      </TableWrap>

      <TableWrap title="Unrealized Gain / Loss">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              {["Security","Ticker","Unrealized G/L"].map((h, i) => (
                <th key={h} className={`px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${i < 2 ? "text-left" : "text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedules.map((s, i) => (
              <tr key={s.key} className={`border-b border-border/40 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                <td className="px-3 py-1.5 font-medium">{s.security}</td>
                <td className="px-3 py-1.5 font-mono">{s.ticker}</td>
                <td className="px-3 py-1.5 text-right">{fmtGL(s.unrealizedGL)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/30 border-t border-border font-semibold">
              <td className="px-3 py-2 text-[11px]" colSpan={2}>Total Unrealized</td>
              <td className="px-3 py-2 text-right text-[11px]">{fmtGL(totUnrealized)}</td>
            </tr>
          </tfoot>
        </table>
      </TableWrap>
    </div>
  );
}

// ─── Tab 4: FX Schedule ───────────────────────────────────────────────────────
interface FxRateOverride { closingRate: number; averageRate: number; }

function FXPanel({ fxSchedule }: { fxSchedule: { rates: import("@/lib/luka/types").FxRateInfo[]; events: import("@/lib/luka/types").FxEvent[] } }) {
  const [rateOverrides, setRateOverrides] = useState<Record<string, FxRateOverride>>({});
  const [editCcy, setEditCcy] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<FxRateOverride>({ closingRate: 1, averageRate: 1 });

  const startEditRate = (r: import("@/lib/luka/types").FxRateInfo) => {
    setEditCcy(r.ccy);
    const ov = rateOverrides[r.ccy];
    setEditDraft({ closingRate: ov?.closingRate ?? r.closing, averageRate: ov?.averageRate ?? r.average });
  };
  const saveEditRate = () => {
    if (!editCcy) return;
    setRateOverrides(p => ({ ...p, [editCcy]: editDraft }));
    setEditCcy(null);
  };

  return (
    <div className="space-y-3">
      <TableWrap title="Period Rates">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              {["CCY","Opening Rate","Closing Rate","Average Rate",""].map((h, i) => (
                <th key={i} className={`px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fxSchedule.rates.map((r, i) => {
              const ov = rateOverrides[r.ccy];
              const closing = ov?.closingRate ?? r.closing;
              const average = ov?.averageRate ?? r.average;
              return (
                <Fragment key={r.ccy}>
                  <tr className={`group border-b border-border/40 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                    <td className="px-3 py-1.5 font-mono font-medium">{r.ccy}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{fmt4(r.opening)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{fmt4(closing)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{fmt4(average)}</td>
                    <td className="px-3 py-1.5 text-right">
                      <button onClick={() => startEditRate(r)} className="inline-flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <Pencil className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                  {editCcy === r.ccy && (
                    <tr className="border-b border-primary/30 bg-primary/[0.04]">
                      <td colSpan={5} className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground w-16 shrink-0">Closing:</span>
                          <input type="number" step="0.0001" value={editDraft.closingRate} onChange={e => setEditDraft(p => ({ ...p, closingRate: parseFloat(e.target.value) || 1 }))} className={`${IC} w-32`} />
                          <span className="text-[11px] text-muted-foreground w-16 shrink-0">Average:</span>
                          <input type="number" step="0.0001" value={editDraft.averageRate} onChange={e => setEditDraft(p => ({ ...p, averageRate: parseFloat(e.target.value) || 1 }))} className={`${IC} w-32`} />
                          <button onClick={saveEditRate} className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                            <Check className="w-3 h-3" />
                          </button>
                          <button onClick={() => setEditCcy(null)} className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border text-muted-foreground hover:bg-muted">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </TableWrap>

      <TableWrap title="FX Translation Events">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              {["Date","Security","Ticker","CCY","Amount (Local)","FX Rate","Amount CAD"].map((h, i) => (
                <th key={h} className={`px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${i < 4 ? "text-left" : "text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fxSchedule.events.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-[11px] text-muted-foreground">No FX events</td></tr>
            )}
            {fxSchedule.events.map((ev, i) => (
              <tr key={`${ev.ticker}-${ev.date}-${i}`} className={`border-b border-border/40 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                <td className="px-3 py-1.5 whitespace-nowrap">{fmtDate(ev.date)}</td>
                <td className="px-3 py-1.5 font-medium">{ev.security}</td>
                <td className="px-3 py-1.5 font-mono">{ev.ticker}</td>
                <td className="px-3 py-1.5">{ev.ccy}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fmt2(ev.foreignAmount)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fmt4(ev.rateAtTxn)}</td>
                <td className="px-3 py-1.5 text-right">{fmtGL(ev.realizedFxCAD)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}

// ─── Tab 5: Income & Expenses ─────────────────────────────────────────────────
function IncomePanel({ incomeMatrix }: { incomeMatrix: ReturnType<typeof buildIncomeMatrix> }) {
  const COLS: import("@/lib/luka/types").IncomeType[] = ["Dividend","Interest","Other","Withholding Tax","Fees"];
  const totals = incomeMatrix.totals;
  return (
    <TableWrap title="Income & Expenses">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            {["Security","Ticker","CCY",...COLS].map((h, i) => (
              <th key={h} className={`px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${i < 3 ? "text-left" : "text-right"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {incomeMatrix.rows.map((r, i) => (
            <tr key={r.ticker} className={`border-b border-border/40 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
              <td className="px-3 py-1.5 font-medium">{r.security}</td>
              <td className="px-3 py-1.5 font-mono">{r.ticker}</td>
              <td className="px-3 py-1.5">{r.ccy}</td>
              {COLS.map(col => {
                const cell = r.cells[col];
                return (
                  <td key={col} className="px-3 py-1.5 text-right tabular-nums">
                    {cell ? fmtGL(cell.cad) : <span className="text-muted-foreground">—</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-muted/30 border-t border-border font-semibold">
            <td className="px-3 py-2 text-[11px]" colSpan={3}>Total</td>
            {COLS.map(col => (
              <td key={col} className="px-3 py-2 text-right tabular-nums text-[11px]">
                {fmtGL(totals[col] ?? 0)}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </TableWrap>
  );
}

// ─── Tab 6: Broker Recon ──────────────────────────────────────────────────────
function BrokerReconPanel({ invRecon }: { invRecon: ReturnType<typeof buildInvestmentRecon> }) {
  return (
    <div className="space-y-3">
      {invRecon.map(group => {
        const totBrokerCost = group.positions.reduce((s, p) => s + p.perStmtCost, 0);
        const totBookCost   = group.positions.reduce((s, p) => s + p.perScheduleCost, 0);
        const totVarianceFmv = group.positions.reduce((s, p) => s + p.varianceFmv, 0);
        return (
          <TableWrap
            key={group.sourceId}
            title={`${group.institution} (…${group.last4})`}
          >
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  {["Security","Ticker","CCY","Broker Cost","Book Cost","Variance"].map((h, i) => (
                    <th key={h} className={`px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${i < 3 ? "text-left" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.positions.map((p, i) => (
                  <tr key={p.ticker} className={`border-b border-border/40 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                    <td className="px-3 py-1.5 font-medium">{p.security}</td>
                    <td className="px-3 py-1.5 font-mono">{p.ticker}</td>
                    <td className="px-3 py-1.5">{p.ccy}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{fmt2(p.perStmtCost)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{fmt2(p.perScheduleCost)}</td>
                    <td className={`px-3 py-1.5 text-right tabular-nums font-medium ${Math.abs(p.varianceFmv) < 1 ? "text-green-700" : "text-red-600"}`}>
                      {fmt2(p.varianceFmv)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 border-t border-border font-semibold">
                  <td className="px-3 py-2 text-[11px]" colSpan={3}>Total</td>
                  <td className="px-3 py-2 text-right tabular-nums text-[11px]">{fmt2(totBrokerCost)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-[11px]">{fmt2(totBookCost)}</td>
                  <td className={`px-3 py-2 text-right tabular-nums text-[11px] font-bold ${Math.abs(totVarianceFmv) < 1 ? "text-green-700" : "text-red-600"}`}>
                    {fmt2(totVarianceFmv)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </TableWrap>
        );
      })}
    </div>
  );
}

// ─── Tab 7: Tax Recon ─────────────────────────────────────────────────────────
const ADJ_TYPES = ["None","Superficial Loss","ACB Adjustment","Other"] as const;
type AdjType = typeof ADJ_TYPES[number];

interface TaxRowOverride { taxACB: number; adjType: AdjType; }

function TaxReconPanel({ schedules }: { schedules: SecuritySchedule[] }) {
  const [overrides, setOverrides] = useState<Record<string, TaxRowOverride>>({});
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<TaxRowOverride>({ taxACB: 0, adjType: "None" });

  const disposals = schedules.flatMap(s =>
    s.rows
      .filter(r => r.unitsOut > 0)
      .map(r => {
        const key = `${s.ticker}|${r.date}`;
        const proceeds = (r.realizedGL ?? 0) + r.costOut;
        return { key, security: s.security, ticker: s.ticker, date: r.date, units: r.unitsOut, proceeds, bookACB: r.costOut };
      })
  );

  const startEdit = (d: { key: string; bookACB: number }) => {
    const ov = overrides[d.key];
    setEditKey(d.key);
    setEditDraft({ taxACB: ov?.taxACB ?? d.bookACB, adjType: ov?.adjType ?? "None" });
  };

  return (
    <TableWrap title="Tax Recon">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            {["Security","Ticker","Date","Units","Proceeds","Book ACB","Book G/L","Tax ACB","Tax G/L","Adj Type",""].map((h, i) => (
              <th key={i} className={`px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${i < 3 ? "text-left" : "text-right"} ${i === 10 ? "text-right" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {disposals.length === 0 && (
            <tr><td colSpan={11} className="px-3 py-4 text-center text-[11px] text-muted-foreground">No disposals</td></tr>
          )}
          {disposals.map((d, i) => {
            const ov = overrides[d.key];
            const taxACB = ov?.taxACB ?? d.bookACB;
            const adjType = ov?.adjType ?? "None";
            const bookGL = d.proceeds - d.bookACB;
            const taxGL = d.proceeds - taxACB;
            return (
              <Fragment key={`${d.key}-${i}`}>
                <tr className={`group border-b border-border/40 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                  <td className="px-3 py-1.5 font-medium">{d.security}</td>
                  <td className="px-3 py-1.5 font-mono">{d.ticker}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap">{fmtDate(d.date)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmt2(d.units)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmt2(d.proceeds)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmt2(d.bookACB)}</td>
                  <td className="px-3 py-1.5 text-right">{fmtGL(bookGL)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmt2(taxACB)}</td>
                  <td className="px-3 py-1.5 text-right">{fmtGL(taxGL)}</td>
                  <td className="px-3 py-1.5 text-right text-muted-foreground">{adjType}</td>
                  <td className="px-3 py-1.5 text-right">
                    <button onClick={() => startEdit(d)} className="inline-flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <Pencil className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
                {editKey === d.key && (
                  <tr className="border-b border-primary/30 bg-primary/[0.04]">
                    <td colSpan={11} className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground shrink-0">Tax ACB:</span>
                        <input type="number" step="0.01" value={editDraft.taxACB} onChange={e => setEditDraft(p => ({ ...p, taxACB: parseFloat(e.target.value) || 0 }))} className={`${IC} w-32`} />
                        <span className="text-[11px] text-muted-foreground shrink-0">Adj Type:</span>
                        <select value={editDraft.adjType} onChange={e => setEditDraft(p => ({ ...p, adjType: e.target.value as AdjType }))} className={`${SC} w-36`}>
                          {ADJ_TYPES.map(a => <option key={a}>{a}</option>)}
                        </select>
                        <button onClick={() => { setOverrides(p => ({ ...p, [editKey]: editDraft })); setEditKey(null); }} className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={() => setEditKey(null)} className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border text-muted-foreground hover:bg-muted">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </TableWrap>
  );
}

// ─── Tab 8: AJEs ─────────────────────────────────────────────────────────────
function makeLocalJE(a: AJE, idx: number): LocalInvJE {
  return {
    _id: `aje-init-${idx}`,
    ref: a.ref,
    description: a.description,
    drAccount: a.drAccount,
    crAccount: a.crAccount,
    drDescription: "",
    crDescription: "",
    amount: a.amount,
    type: a.type,
    confidence: a.confidence,
    status: "Draft",
    notes: "",
    deleted: false,
  };
}

const EMPTY_JE_DRAFT = (): LocalInvJE => ({
  _id: `aje-new-${Date.now()}`,
  ref: "",
  description: "",
  drAccount: "",
  crAccount: "",
  drDescription: "",
  crDescription: "",
  amount: 0,
  type: "Accrual",
  confidence: "Medium",
  status: "Draft",
  notes: "",
  deleted: false,
});

const AJE_TYPE_OPTIONS: AJE["type"][] = [
  "Correcting","Reclassification","Accrual","Fair Value Adj","FX Adj","Disposition",
];
const AJE_CONF_OPTIONS: AJE["confidence"][] = ["High","Medium","Low"];

// Account code only (before " · ")
function acctCode(v: string) { return v.split(/[\s·\-]/)[0].trim(); }

// Inline account select — shows code only in the field
function JEAccountSelect({ value, disabled, onChange }: {
  value: string; disabled?: boolean; onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        className="input-double-border h-8 w-full pl-2 pr-7 text-xs border border-[#dcdfe4] rounded-[8px] bg-white dark:bg-card text-transparent appearance-none focus:outline-none"
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">— Select —</option>
        {CHART_OF_ACCOUNTS.map(a => (
          <option key={a.code} value={`${a.code} · ${a.name}`}>{a.code} · {a.name}</option>
        ))}
      </select>
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-mono text-foreground pointer-events-none select-none">
        {value ? acctCode(value) : <span className="font-sans text-muted-foreground">Select</span>}
      </span>
    </div>
  );
}

// Status badge config
const JE_STATUS_CFG: Record<AJEStatus, { cls: string; label: string }> = {
  Draft:    { cls: "bg-muted text-muted-foreground border-border",        label: "Draft"    },
  Approved: { cls: "bg-blue-50 text-blue-700 border-blue-200",            label: "Approved" },
  Posted:   { cls: "bg-green-50 text-green-700 border-green-200",         label: "Posted"   },
};

// Add AJE inline modal/form (card that slides in)
function AddJECard({ onSave, onCancel }: {
  onSave: (je: LocalInvJE) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<LocalInvJE>(EMPTY_JE_DRAFT());
  const set = (k: keyof LocalInvJE, v: unknown) => setD(p => ({ ...p, [k]: v }));
  return (
    <div className="rounded-[8px] border-2 border-primary/30 bg-primary/[0.02] overflow-hidden mb-2">
      <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between bg-primary/5">
        <span className="text-xs font-semibold text-primary uppercase tracking-wide">New Adjusting Entry</span>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
      </div>
      {/* Top fields row */}
      <div className="px-4 pt-3 pb-2 grid grid-cols-4 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Ref</label>
          <input value={d.ref} onChange={e => set("ref", e.target.value)} className={IC} placeholder="AE-01" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Type</label>
          <select value={d.type} onChange={e => set("type", e.target.value)} className={SC}>
            {AJE_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Confidence</label>
          <select value={d.confidence} onChange={e => set("confidence", e.target.value)} className={SC}>
            {AJE_CONF_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</label>
          <input type="number" step="0.01" value={d.amount || ""} onChange={e => set("amount", parseFloat(e.target.value) || 0)} className={IC} placeholder="0.00" />
        </div>
      </div>
      <div className="px-4 pb-2">
        <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
        <input value={d.description} onChange={e => set("description", e.target.value)} className={`${IC} mt-1 w-full`} placeholder="Describe this entry…" />
      </div>
      {/* DR / CR lines */}
      <div className="border-t border-border/60">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-muted/40">
              {["Acc No.","Description","Debit","Credit"].map((h, i) => (
                <th key={h} className={`px-3 py-2 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider ${i >= 2 ? "text-right w-32" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/40">
              <td className="px-3 py-2 w-36"><JEAccountSelect value={d.drAccount} onChange={v => set("drAccount", v)} /></td>
              <td className="px-3 py-2"><input value={d.drDescription} onChange={e => set("drDescription", e.target.value)} className={IC} placeholder="Line description…" /></td>
              <td className="px-3 py-2 w-32"><input type="number" step="0.01" value={d.amount || ""} onChange={e => set("amount", parseFloat(e.target.value) || 0)} className={`${IC} text-right`} /></td>
              <td className="px-3 py-2 w-32"><div className="h-7 flex items-center justify-end px-2 rounded-md border border-border/40 bg-muted/30 text-[11px] text-muted-foreground">0.00</div></td>
            </tr>
            <tr>
              <td className="px-3 py-2 w-36"><JEAccountSelect value={d.crAccount} onChange={v => set("crAccount", v)} /></td>
              <td className="px-3 py-2"><input value={d.crDescription} onChange={e => set("crDescription", e.target.value)} className={IC} placeholder="Line description…" /></td>
              <td className="px-3 py-2 w-32"><div className="h-7 flex items-center justify-end px-2 rounded-md border border-border/40 bg-muted/30 text-[11px] text-muted-foreground">0.00</div></td>
              <td className="px-3 py-2 w-32"><div className="h-7 flex items-center justify-end px-2 rounded-md border border-[#dcdfe4] bg-muted/20 text-[11px] tabular-nums text-foreground">{fmt2(d.amount)}</div></td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Notes */}
      <div className="px-4 py-3 border-t border-border/60">
        <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
        <textarea rows={2} value={d.notes} onChange={e => set("notes", e.target.value)}
          className="mt-1 w-full h-14 text-xs px-2 py-1.5 border border-border rounded-md bg-background resize-none focus:outline-none"
          placeholder="Add a note…" />
      </div>
      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border/60 bg-muted/20 flex justify-end gap-2">
        <button onClick={onCancel} className="h-7 px-3 text-xs border border-border rounded-[7px] text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
        <button onClick={() => onSave({ ...d, _id: `aje-local-${Date.now()}` })}
          className="h-7 px-3 text-xs bg-primary text-primary-foreground rounded-[7px] hover:bg-primary/90 transition-colors">
          Save Entry
        </button>
      </div>
    </div>
  );
}

function AJEsPanel({ ajes, ajeQueue, clearAjeQueue }: {
  ajes: AJE[];
  ajeQueue: LocalInvJE[];
  clearAjeQueue: () => void;
}) {
  const [localJEs, setLocalJEs] = useState<LocalInvJE[]>(() => ajes.map((a, i) => makeLocalJE(a, i)));
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(ajes.map((_, i) => `aje-init-${i}`))
  );
  const [filterStatus, setFilterStatus] = useState<"All" | AJEStatus | "Deleted">("All");
  const [addOpen, setAddOpen] = useState(false);
  const [consumed, setConsumed] = useState(false);

  // Sync when ajes prop changes
  useMemo(() => {
    setLocalJEs(ajes.map((a, i) => makeLocalJE(a, i)));
    setExpandedIds(new Set(ajes.map((_, i) => `aje-init-${i}`)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ajes]);

  // Consume pushed queue
  useMemo(() => {
    if (!ajeQueue.length || consumed) return;
    setLocalJEs(prev => {
      const ids = new Set(prev.map(j => j._id));
      const newOnes = ajeQueue.filter(j => !ids.has(j._id));
      return newOnes.length ? [...prev, ...newOnes] : prev;
    });
    setExpandedIds(prev => { const n = new Set(prev); ajeQueue.forEach(j => n.add(j._id)); return n; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ajeQueue]);

  const updateJE  = (id: string, patch: Partial<LocalInvJE>) =>
    setLocalJEs(prev => prev.map(j => j._id === id ? { ...j, ...patch } : j));
  const toggleExpand = (id: string) =>
    setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const softDelete  = (id: string) => updateJE(id, { deleted: true, deletedAt: new Date().toISOString() });
  const restoreJE   = (id: string) => updateJE(id, { deleted: false, deletedAt: undefined });
  const purgeJE     = (id: string) => setLocalJEs(prev => prev.filter(j => j._id !== id));

  const active   = localJEs.filter(j => !j.deleted);
  const deleted  = localJEs.filter(j =>  j.deleted);
  const draftCnt    = active.filter(j => j.status === "Draft").length;
  const approvedCnt = active.filter(j => j.status === "Approved").length;
  const postedCnt   = active.filter(j => j.status === "Posted").length;

  const filtered = filterStatus === "Deleted"
    ? deleted
    : active.filter(j => filterStatus === "All" || j.status === filterStatus);

  return (
    <div className="space-y-3">

      {/* Filter dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground shrink-0">View:</span>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
            className="h-7 pl-2.5 pr-7 text-[11px] font-medium border border-border rounded-[7px] bg-background text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/40 hover:border-primary/40 transition-colors"
          >
            <option value="All">All ({active.length})</option>
            <option value="Draft">Draft ({draftCnt})</option>
            <option value="Posted">Posted ({postedCnt})</option>
            <option value="Deleted">Deleted ({deleted.length})</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
        </div>
      </div>

      {/* JE list */}
      <div className="space-y-2">
        {filtered.map(je => {
          const isExpanded = expandedIds.has(je._id);
          const statusCls =
            je.status === "Posted" ? "bg-green-50 text-green-700 border-green-200" :
            "bg-muted text-muted-foreground border-border";

          return (
            <div key={je._id} className={`rounded-[8px] border border-border overflow-hidden ${je.deleted ? "opacity-60" : ""}`}>
              {/* Header */}
              <button
                onClick={() => toggleExpand(je._id)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">{je.ref.toUpperCase()}</span>
                  <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-foreground shrink-0">{je.type}</span>
                  <span className="text-[10px] text-muted-foreground truncate">{je.description}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${statusCls}`}>
                    {je.status === "Posted" && <CheckCircle2 className="h-2.5 w-2.5" />}
                    {je.status}
                  </span>
                  {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                </div>
              </button>

              {/* Expanded body */}
              {isExpanded && (
                <div className="border-t border-border">
                  {/* Lines table */}
                  <table className="w-full text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-left whitespace-nowrap">Acc No.</th>
                        <th className="py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-left">Description</th>
                        <th className="py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Debit</th>
                        <th className="py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* DR line */}
                      <tr className="border-b border-border hover:bg-muted/20">
                        <td className="py-1.5 px-3 min-w-[100px] w-[130px]"><JEAccountSelect value={je.drAccount} disabled={je.deleted} onChange={v => updateJE(je._id, { drAccount: v })} /></td>
                        <td className="py-1.5 px-3"><input className={IC} value={je.drDescription} disabled={je.deleted} onChange={e => updateJE(je._id, { drDescription: e.target.value })} placeholder="Line description…" /></td>
                        <td className="py-1.5 px-3 w-24">
                          <input type="number" step="0.01" className={`${IC} text-right`} value={je.amount || ""} disabled={je.deleted}
                            onChange={e => updateJE(je._id, { amount: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
                        </td>
                        <td className="py-1.5 px-3 w-24"><div className="h-7 flex items-center justify-end px-2 rounded-[6px] border border-border/40 bg-muted/30 text-[11px] text-muted-foreground">0.00</div></td>
                      </tr>
                      {/* CR line */}
                      <tr className="hover:bg-muted/20">
                        <td className="py-1.5 px-3"><JEAccountSelect value={je.crAccount} disabled={je.deleted} onChange={v => updateJE(je._id, { crAccount: v })} /></td>
                        <td className="py-1.5 px-3"><input className={IC} value={je.crDescription} disabled={je.deleted} onChange={e => updateJE(je._id, { crDescription: e.target.value })} placeholder="Line description…" /></td>
                        <td className="py-1.5 px-3"><div className="h-7 flex items-center justify-end px-2 rounded-[6px] border border-border/40 bg-muted/30 text-[11px] text-muted-foreground">0.00</div></td>
                        <td className="py-1.5 px-3"><div className="h-7 flex items-center justify-end px-2 rounded-[6px] border border-[#dcdfe4] bg-muted/20 text-[11px] tabular-nums text-foreground">{fmt2(je.amount)}</div></td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-muted/30 font-semibold text-[11px]">
                        <td className="py-2 px-3 text-foreground" colSpan={2}>Total</td>
                        <td className="py-2 px-3 text-right tabular-nums">{fmt2(je.amount)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{fmt2(je.amount)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Notes */}
                  <div className="px-3 py-2.5 border-t border-border bg-background">
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</label>
                    <textarea rows={2} className="w-full text-[11px] px-2.5 py-2 rounded-[6px] border border-[#dcdfe4] bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
                      placeholder="Add a note for this entry…"
                      value={je.notes}
                      disabled={je.deleted}
                      onChange={e => updateJE(je._id, { notes: e.target.value })} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 px-3 py-2.5 border-t border-border bg-muted/20">
                    {je.deleted ? (
                      <>
                        <span className="text-[11px] text-muted-foreground italic flex-1">Deleted</span>
                        <button onClick={() => restoreJE(je._id)}
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[6px] border border-border bg-background text-[11px] font-medium text-foreground hover:bg-muted transition-colors">
                          <RotateCcw className="h-3 w-3" /> Restore
                        </button>
                        <button onClick={() => purgeJE(je._id)}
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[6px] border border-red-200 bg-background text-[11px] font-medium text-red-500 hover:text-red-700 hover:border-red-300 transition-colors">
                          <Trash2 className="h-3 w-3" /> Delete Permanently
                        </button>
                      </>
                    ) : (
                      <>
                        {je.status !== "Posted" && (
                          <button onClick={() => updateJE(je._id, { status: "Posted" })}
                            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[6px] bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 transition-colors">
                            <Send className="h-3 w-3" /> Post
                          </button>
                        )}
                        <button onClick={() => softDelete(je._id)}
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[6px] border border-red-200 bg-background text-[11px] font-medium text-red-500 hover:text-red-700 hover:border-red-300 transition-colors">
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center py-8 text-[11px] text-muted-foreground">No journal entries match the filter</p>
        )}
      </div>
    </div>
  );
}

// ─── Tab 9: Holdings ──────────────────────────────────────────────────────────
function HoldingsPanel({ schedules }: { schedules: SecuritySchedule[] }) {
  const totCost       = schedules.reduce((s, x) => s + x.closingCostCAD, 0);
  const totFMV        = schedules.reduce((s, x) => s + x.fmvCAD, 0);
  const totUnrealized = schedules.reduce((s, x) => s + x.unrealizedGL, 0);

  return (
    <TableWrap title="Holdings">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            {["Security","Ticker","CCY","Units","WAC","Cost CAD","FMV CAD","Unrealized G/L","G/L %"].map((h, i) => (
              <th key={h} className={`px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${i < 3 ? "text-left" : "text-right"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {schedules.map((s, i) => {
            const glPct = s.closingCostCAD > 0 ? (s.unrealizedGL / s.closingCostCAD) * 100 : 0;
            return (
              <tr key={s.key} className={`border-b border-border/40 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                <td className="px-3 py-1.5 font-medium">{s.security}</td>
                <td className="px-3 py-1.5 font-mono">{s.ticker}</td>
                <td className="px-3 py-1.5">{s.currency}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fmt2(s.closingUnits)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fmt4(s.closingWac)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums font-medium">{fmt(s.closingCostCAD)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums font-medium">{fmt(s.fmvCAD)}</td>
                <td className="px-3 py-1.5 text-right">{fmtGL(s.unrealizedGL)}</td>
                <td className={`px-3 py-1.5 text-right tabular-nums ${glPct >= 0 ? "text-green-700" : "text-red-600"}`}>
                  {glPct >= 0 ? `${fmt2(glPct)}%` : `(${fmt2(Math.abs(glPct))}%)`}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-muted/30 border-t border-border font-semibold">
            <td className="px-3 py-2 text-[11px]" colSpan={5}>Total</td>
            <td className="px-3 py-2 text-right tabular-nums text-[11px] font-bold">{fmt(totCost)}</td>
            <td className="px-3 py-2 text-right tabular-nums text-[11px] font-bold">{fmt(totFMV)}</td>
            <td className="px-3 py-2 text-right text-[11px] font-bold">{fmtGL(totUnrealized)}</td>
            <td className="px-3 py-2" />
          </tr>
        </tfoot>
      </table>
    </TableWrap>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function InvestmentScheduleResponse({ onEditTransactions }: { onEditTransactions?: () => void } = {}) {
  const settings = useStore(s => s.settings);
  const [activeTab, setActiveTab] = useState<TabId>("transactions");

  const client  = settings.client || "this engagement";
  const dateStr = settings.fiscalYearEnd
    ? fmtDate(settings.fiscalYearEnd.slice(0, 10))
    : "—";

  // ── Compute options ────────────────────────────────────────────────────────
  const [opts] = useState<ComputeOptions>({
    includePriorYear:  true,
    trackByBroker:     false,
    measurementBasis:  "FVTPL",
  });

  // ── Prior-year lots ────────────────────────────────────────────────────────
  const [importedLots] = useState<PriorYearLot[] | null>(null);
  const effectivePY = useMemo(() => importedLots ?? priorYearLots, [importedLots]);

  // ── Transaction state ──────────────────────────────────────────────────────
  const [importedTxnsBySource] = useState<Record<string, Transaction[]>>({});
  const [plaidSources]         = useState<Source[]>([]);
  const [plaidTxns]            = useState<Transaction[]>([]);
  const [hiddenTxIds,  setHiddenTxIds]  = useState<Set<string>>(new Set());
  const [manualTxns,   setManualTxns]   = useState<Transaction[]>([]);
  const [txEdits,      setTxEdits]      = useState<Record<string, Partial<Transaction>>>({});

  const allInvSources = useMemo(() => [...baseSources, ...plaidSources], [plaidSources]);

  const baseTxns = useMemo(() => {
    const overriddenIds = new Set(Object.keys(importedTxnsBySource));
    const kept = currentYearTransactions.filter(
      t => !overriddenIds.has(t.sourceId) && !hiddenTxIds.has(t.id),
    );
    const imported = Object.values(importedTxnsBySource).flat().map(t => ({
      ...t,
      status:    t.status    ?? ("pending" as const),
      tbAccount: t.tbAccount ?? defaultTbAccount(t.type),
    }));
    return [
      ...kept,
      ...imported.filter(t => !hiddenTxIds.has(t.id)),
      ...plaidTxns.filter(t => !hiddenTxIds.has(t.id)),
      ...manualTxns,
    ];
  }, [importedTxnsBySource, plaidTxns, hiddenTxIds, manualTxns]);

  const effectiveTxns = useMemo(
    () => baseTxns.map(t => ({ ...t, ...txEdits[t.id] })),
    [baseTxns, txEdits],
  );

  // ── AJE push queue ─────────────────────────────────────────────────────────
  const [ajeQueue, setAjeQueue] = useState<LocalInvJE[]>([]);
  const clearAjeQueue = useCallback(() => setAjeQueue([]), []);

  // ── Computed data ──────────────────────────────────────────────────────────
  const { schedules } = useMemo(
    () => compute(opts, effectivePY, effectiveTxns),
    [opts, effectivePY, effectiveTxns],
  );
  const ajes         = useMemo(() => buildAJEs(schedules, opts),                  [schedules, opts]);
  const incomeMatrix = useMemo(() => buildIncomeMatrix(effectiveTxns),            [effectiveTxns]);
  const fxSchedule   = useMemo(() => buildFxSchedule(effectiveTxns, effectivePY), [effectiveTxns, effectivePY]);
  const invRecon     = useMemo(() => buildInvestmentRecon(schedules),             [schedules]);

  // suppress unused warning — cashRecon kept for data consistency
  useMemo(() => buildCashRecon(), []);

  return (
    <div className="min-w-0 space-y-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
      {/* Intro */}
      <p className="text-sm text-foreground leading-relaxed">
        Here&apos;s a full summary of your <strong>Investment Schedule</strong> workpaper for{" "}
        <span className="font-medium text-primary">{client}</span> as at{" "}
        <span className="font-medium">{dateStr}</span>:
      </p>

      {/* Tab bar */}
      <div className="flex items-center border-b border-border -mx-0">
        <div className="flex items-center gap-0 overflow-x-auto flex-1 min-w-0">
          {TABS.map(({ id, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {onEditTransactions && (
          <div className="shrink-0 ml-3 mb-px flex items-center gap-0 rounded-[8px] border border-border bg-muted/40 p-0.5">
            <button className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-[6px] text-[11px] font-semibold bg-background text-foreground shadow-sm border border-border/60 transition-all">
              <BarChart2 className="w-3 h-3" /> Schedule
            </button>
            <button
              onClick={onEditTransactions}
              className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-[6px] text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all"
            >
              <Pencil className="w-3 h-3" /> Add/Edit
            </button>
          </div>
        )}
      </div>

      {/* Tab content — always mounted so state survives tab switches */}
      <div className="min-w-0">
        <div className={activeTab === "transactions" ? "" : "hidden"}>
          <TransactionsPanel
            effectiveTxns={effectiveTxns}
            allInvSources={allInvSources}
            manualTxns={manualTxns}
            setManualTxns={setManualTxns}
            hiddenTxIds={hiddenTxIds}
            setHiddenTxIds={setHiddenTxIds}
            txEdits={txEdits}
            setTxEdits={setTxEdits}
          />
        </div>
        <div className={activeTab === "wac" ? "" : "hidden"}>
          <WACPanel schedules={schedules} />
        </div>
        <div className={activeTab === "gainloss" ? "" : "hidden"}>
          <GainLossPanel schedules={schedules} />
        </div>
        <div className={activeTab === "fx" ? "" : "hidden"}>
          <FXPanel fxSchedule={fxSchedule} />
        </div>
        <div className={activeTab === "income" ? "" : "hidden"}>
          <IncomePanel incomeMatrix={incomeMatrix} />
        </div>
        <div className={activeTab === "brokerrecon" ? "" : "hidden"}>
          <BrokerReconPanel invRecon={invRecon} />
        </div>
        <div className={activeTab === "taxrecon" ? "" : "hidden"}>
          <TaxReconPanel schedules={schedules} />
        </div>
        <div className={activeTab === "ajes" ? "" : "hidden"}>
          <AJEsPanel ajes={ajes} ajeQueue={ajeQueue} clearAjeQueue={clearAjeQueue} />
        </div>
        <div className={activeTab === "holdings" ? "" : "hidden"}>
          <HoldingsPanel schedules={schedules} />
        </div>
      </div>
    </div>
  );
}
