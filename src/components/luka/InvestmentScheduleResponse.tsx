import { useState, useMemo, useCallback, Fragment, useRef, useEffect, useLayoutEffect } from "react";
import ReactDOM from "react-dom";
import toast from "react-hot-toast";
import { useStore } from "@/store/useStore";
import {
  compute, buildAJEs, buildIncomeMatrix, buildFxSchedule,
  buildInvestmentRecon, buildCashRecon,
  type ComputeOptions,
  type SecuritySchedule,
  type WacRow,
  type AJE,
} from "@/lib/luka/compute";
import { sources as baseSources, priorYearLots, currentYearTransactions, fxRates as mockFxRates } from "@/lib/luka/mockData";
import type { Source, Transaction, PriorYearLot } from "@/lib/luka/types";
import { defaultTbAccount } from "@/lib/luka/coa";
import { Pencil, Trash2, Plus, Check, X, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Send, RotateCcw, BarChart2, Upload, Loader2, FolderOpen, FileText, FileSpreadsheet, Copy, Download, Save, Search, FileCheck, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { SearchFilter, ColFilter } from "@/pages/InvTableFilters";
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
    ? <span className="text-foreground tabular-nums">{fmt2(n)}</span>
    : <span className="text-foreground tabular-nums">({fmt2(Math.abs(n))})</span>;

// WAC-panel helpers (mirrors InvWACTab / InvHoldingsTab)
const fmtNum = (n: number, dec = 2) =>
  n.toLocaleString("en-CA", { minimumFractionDigits: dec, maximumFractionDigits: dec });
// Smart unit display: integers show no dp, fractionals show 4dp
const fmtUnits = (n: number) =>
  Number.isInteger(n) ? n.toLocaleString("en-CA") : fmtNum(n, 4);
const fmtCAD = (n: number) =>
  n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const WAC_ROW_TYPES = [
  "Opening Balance","Purchase","Sale","Dividend","Interest",
  "Return of Capital","Reinvested Dividend","Withholding Tax",
  "Fee/Commission","Transfer In","Transfer Out","Adjustment",
];

// ─── Shared input / select class ──────────────────────────────────────────────
const IC = "h-7 text-base px-2 border border-[#dcdfe4] rounded-[6px] bg-background text-foreground placeholder:text-muted-foreground transition-all duration-200 hover:border-[hsl(210_25%_75%)] focus:outline-none focus:ring-1 focus:ring-primary/30 w-full";
const SC = `${IC} appearance-none cursor-pointer`;

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
    <span className={`inline-flex items-center gap-1 text-base font-semibold px-1.5 py-0.5 rounded-full border ${cls}`}>
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
    <div className="rounded-[8px] border border-border overflow-clip">
      <div className="px-3 py-2 bg-muted/40 border-b border-border flex items-center justify-between">
        <span className="text-base font-semibold text-foreground">{title}</span>
        <div className="flex items-center gap-3">
          {subtitle && <span className="text-base text-muted-foreground">{subtitle}</span>}
          {onAdd && (
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-1 h-7 px-2.5 text-base font-medium bg-primary text-primary-foreground rounded-[7px] hover:bg-primary/90 transition-colors shrink-0"
            >
              <Plus className="w-3 h-3" />{addLabel ?? "Add Row"}
            </button>
          )}
        </div>
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
type TabId =
  | "transactions" | "wac" | "gainloss" | "income"
  | "brokerrecon" | "ajes";

const TABS: { id: TabId; label: string }[] = [
  { id: "wac",          label: "WAC Schedule"      },
  { id: "gainloss",     label: "Gain / Loss"       },
  { id: "income",       label: "Income & Expenses" },

  { id: "ajes",         label: "AJEs"              },
  { id: "transactions", label: "Transactions"      },
];

// ─── Add-mode row type ────────────────────────────────────────────────────────
interface InvAddRow {
  id: string; sourceFile?: string;
  date: string; settlement: string; broker: string;
  security: string; ticker: string; type: string;
  qty: string; price: string; ccy: string;
  fxRate: string; tbAccount: string; status: string;
}
const EMPTY_INV_ADD_ROW = (): InvAddRow => ({
  id: `ia-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
  date: "", settlement: "", broker: "", security: "", ticker: "",
  type: "Purchase", qty: "", price: "", ccy: "CAD", fxRate: "1",
  tbAccount: "", status: "pending",
});
const INV_ADD_REQUIRED: (keyof InvAddRow)[] = ["date","security","type","qty","price"];
function invAddRowMissing(row: InvAddRow, field: keyof InvAddRow) { return !String(row[field] ?? "").trim(); }

function generateMockTxns(fileNames: string[]): InvAddRow[] {
  const MOCK = [
    { security: "Apple Inc.", ticker: "AAPL", type: "Purchase", qty: "100", price: "185.50", ccy: "USD", fxRate: "1.36", broker: "TD Direct" },
    { security: "Royal Bank of Canada", ticker: "RY", type: "Purchase", qty: "50", price: "132.20", ccy: "CAD", fxRate: "1", broker: "RBC Direct" },
    { security: "Microsoft Corp.", ticker: "MSFT", type: "Dividend", qty: "200", price: "0.75", ccy: "USD", fxRate: "1.36", broker: "TD Direct" },
    { security: "Canadian Natural Res.", ticker: "CNQ", type: "Sale", qty: "75", price: "88.40", ccy: "CAD", fxRate: "1", broker: "RBC Direct" },
  ];
  return fileNames.flatMap((fn, fi) =>
    MOCK.slice(0, 2).map((m, i) => ({
      ...EMPTY_INV_ADD_ROW(),
      id: `ia-mock-${fi}-${i}`,
      sourceFile: fn,
      ...m,
      date: `2024-${String(fi * 3 + i + 1).padStart(2,"0")}-15`.replace(/-(\d{2})-/, (_, m2) => `-${String(Math.min(12, parseInt(m2))).padStart(2,"0")}-`),
    } as InvAddRow))
  );
}

// ─── Tab 1: Transactions ──────────────────────────────────────────────────────
const TX_TYPES = [
  "Purchase","Sale","Dividend","Interest","Return of Capital",
  "Withholding Tax","Fee/Commission","Transfer In","Transfer Out","Reinvested Dividend",
] as const;
type TxFormType = typeof TX_TYPES[number];

// Type badge colours matching workpapers
function TxTypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-base font-medium border whitespace-nowrap bg-transparent text-foreground border-border">
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
  batchEditMode,
}: {
  effectiveTxns: Transaction[];
  allInvSources: Source[];
  manualTxns: Transaction[];
  setManualTxns: React.Dispatch<React.SetStateAction<Transaction[]>>;
  hiddenTxIds: Set<string>;
  setHiddenTxIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  txEdits: Record<string, Partial<Transaction>>;
  setTxEdits: React.Dispatch<React.SetStateAction<Record<string, Partial<Transaction>>>>;
  batchEditMode?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<TxDraft>(EMPTY_TX_DRAFT());
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<TxDraft>(EMPTY_TX_DRAFT());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter,  setStatusFilter]  = useState<"all" | "pending" | "approved" | "published">("all");
  const [sourceFilter,  setSourceFilter]  = useState("all");
  const [txSearch,      setTxSearch]      = useState("");
  const [txTypeFilter,  setTxTypeFilter]  = useState("all");
  const [txCcyFilter,   setTxCcyFilter]   = useState("all");
  type TxSortField = "date"|"settlementDate"|"sourceId"|"security"|"ticker"|"currency"|"type"|"units"|"price"|"fxRate"|"net"|"tbAccount"|"status";
  const [txSortField, setTxSortField] = useState<TxSortField>("date");
  const [txSortDir,   setTxSortDir]   = useState<"asc"|"desc">("asc");

  const handleTxSort = (field: TxSortField) => {
    if (txSortField === field) setTxSortDir(d => d === "asc" ? "desc" : "asc");
    else { setTxSortField(field); setTxSortDir("asc"); }
  };
  const txSortIcon = (field: TxSortField) => {
    if (txSortField !== field) return <ArrowUpDown className="h-2.5 w-2.5 text-muted-foreground/40 ml-0.5" />;
    return txSortDir === "asc"
      ? <ArrowUp className="h-2.5 w-2.5 text-primary ml-0.5" />
      : <ArrowDown className="h-2.5 w-2.5 text-primary ml-0.5" />;
  };

  const uniqueTypes   = useMemo(() => ["all", ...Array.from(new Set(effectiveTxns.map(t => t.type))).sort()], [effectiveTxns]);
  const uniqueCcys    = useMemo(() => ["all", ...Array.from(new Set(effectiveTxns.map(t => t.currency))).sort()], [effectiveTxns]);
  const uniqueSources = useMemo(() => {
    const ids = Array.from(new Set(effectiveTxns.map(t => t.sourceId).filter(Boolean))).sort();
    return ids.map(id => ({
      id,
      label: allInvSources.find(s => s.id === id)?.institution ?? id,
    }));
  }, [effectiveTxns, allInvSources]);

  const filtered = effectiveTxns.filter(t => {
    if (hiddenTxIds.has(t.id)) return false;
    if (statusFilter !== "all" && (t.status ?? "pending") !== statusFilter) return false;
    if (sourceFilter  !== "all" && t.sourceId !== sourceFilter) return false;
    if (txTypeFilter  !== "all" && t.type !== txTypeFilter) return false;
    if (txCcyFilter   !== "all" && t.currency !== txCcyFilter) return false;
    if (txSearch) {
      const q = txSearch.toLowerCase();
      if (![t.security, t.ticker].some(v => v?.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const visible = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (txSortField) {
        case "date":           cmp = (a.date ?? "").localeCompare(b.date ?? ""); break;
        case "settlementDate": cmp = (a.settlementDate ?? "").localeCompare(b.settlementDate ?? ""); break;
        case "sourceId":       cmp = (a.sourceId ?? "").localeCompare(b.sourceId ?? ""); break;
        case "security":       cmp = (a.security ?? "").localeCompare(b.security ?? ""); break;
        case "ticker":         cmp = (a.ticker ?? "").localeCompare(b.ticker ?? ""); break;
        case "currency":       cmp = (a.currency ?? "").localeCompare(b.currency ?? ""); break;
        case "type":           cmp = (a.type ?? "").localeCompare(b.type ?? ""); break;
        case "units":          cmp = (a.units ?? 0) - (b.units ?? 0); break;
        case "price":          cmp = (a.price ?? 0) - (b.price ?? 0); break;
        case "fxRate":         cmp = (a.fxRate ?? 1) - (b.fxRate ?? 1); break;
        case "net":            cmp = (a.net ?? 0) - (b.net ?? 0); break;
        case "tbAccount":      cmp = (a.tbAccount ?? "").localeCompare(b.tbAccount ?? ""); break;
        case "status":         cmp = (a.status ?? "").localeCompare(b.status ?? ""); break;
      }
      return txSortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, txSortField, txSortDir]);
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
            <span className="text-base text-muted-foreground uppercase">Trade Date</span>
            <input type="date" value={d.date} onChange={e => setD("date", e.target.value)} className={IC} />
          </div>
          {/* Settlement */}
          <div className="flex flex-col gap-0.5">
            <span className="text-base text-muted-foreground uppercase">Settlement</span>
            <input type="date" value={d.settlement} onChange={e => setD("settlement", e.target.value)} className={IC} />
          </div>
          {/* Source */}
          <div className="flex flex-col gap-0.5">
            <span className="text-base text-muted-foreground uppercase">Source</span>
            <input value={d.broker} onChange={e => setD("broker", e.target.value)} className={IC} placeholder="Broker" />
          </div>
          {/* Security */}
          <div className="flex flex-col gap-0.5 col-span-2">
            <span className="text-base text-muted-foreground uppercase">Security</span>
            <input value={d.security} onChange={e => setD("security", e.target.value)} className={IC} placeholder="Security name" />
          </div>
          {/* Ticker */}
          <div className="flex flex-col gap-0.5">
            <span className="text-base text-muted-foreground uppercase">Ticker</span>
            <input value={d.ticker} onChange={e => setD("ticker", e.target.value.toUpperCase())} className={IC} placeholder="AAPL" />
          </div>
          {/* CCY */}
          <div className="flex flex-col gap-0.5">
            <span className="text-base text-muted-foreground uppercase">CCY</span>
            <select value={d.ccy} onChange={e => setD("ccy", e.target.value)} className={SC}>
              {["CAD","USD","EUR","GBP"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {/* Type */}
          <div className="flex flex-col gap-0.5">
            <span className="text-base text-muted-foreground uppercase">Type</span>
            <select value={d.type} onChange={e => setD("type", e.target.value)} className={SC}>
              {TX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {/* Units */}
          <div className="flex flex-col gap-0.5">
            <span className="text-base text-muted-foreground uppercase">Units</span>
            <input type="number" value={d.qty || ""} onChange={e => setD("qty", parseFloat(e.target.value) || 0)} className={IC} placeholder="0" />
          </div>
          {/* Price */}
          <div className="flex flex-col gap-0.5">
            <span className="text-base text-muted-foreground uppercase">Price</span>
            <input type="number" value={d.price || ""} onChange={e => setD("price", parseFloat(e.target.value) || 0)} className={IC} placeholder="0.00" />
          </div>
          {/* FX */}
          <div className="flex flex-col gap-0.5">
            <span className="text-base text-muted-foreground uppercase">FX</span>
            <input type="number" step="0.0001" value={d.fxRate || ""} onChange={e => setD("fxRate", parseFloat(e.target.value) || 1)} className={IC} placeholder="1.0000" />
          </div>
          {/* TB Account */}
          <div className="flex flex-col gap-0.5 col-span-2">
            <span className="text-base text-muted-foreground uppercase">TB Acct</span>
            <select value={d.tbAccount} onChange={e => setD("tbAccount", e.target.value)} className={SC}>
              <option value="">— Select —</option>
              {CHART_OF_ACCOUNTS.map(a => (
                <option key={a.code} value={a.code}>{a.code} · {a.name}</option>
              ))}
            </select>
          </div>
          {/* Status */}
          <div className="flex flex-col gap-0.5">
            <span className="text-base text-muted-foreground uppercase">Status</span>
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
    <div className="rounded-[8px] border border-border overflow-clip">
      {/* Header */}
      <div className="px-3 py-2 bg-muted/40 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-foreground">Transactions</span>
          {batchEditMode && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-base font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Pencil className="h-2.5 w-2.5" /> Editing
            </span>
          )}
          {batchEditMode && (
            <span className="text-base text-muted-foreground">All rows editable — submit changes with Submit &amp; Rerun</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Brokerage / account filter */}
          {!batchEditMode && uniqueSources.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-base text-muted-foreground font-medium">Account:</span>
              <div className="relative">
                <select
                  value={sourceFilter}
                  onChange={e => setSourceFilter(e.target.value)}
                  className="h-7 text-base pl-2 pr-7 border border-border rounded-[7px] bg-background text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer font-mono"
                >
                  <option value="all">All accounts ({uniqueSources.length})</option>
                  {uniqueSources.map(s => (
                    <option key={s.id} value={s.id}>{s.id}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
          )}
          {/* Status filter dropdown */}
          {!batchEditMode && (
            <div className="flex items-center gap-1.5">
              <span className="text-base text-muted-foreground font-medium">View:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                className="h-7 text-base px-2 pr-6 border border-border rounded-[7px] bg-background text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="published">Published</option>
              </select>
            </div>
          )}
          {!batchEditMode && selectedIds.size > 0 && (
            <>
              <span className="text-base text-muted-foreground">{selectedIds.size} selected</span>
              <button onClick={() => bulkSetStatus("approved")} className="inline-flex items-center h-7 px-2.5 text-base font-medium rounded-[7px] border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">Approve</button>
              <button onClick={() => bulkSetStatus("published")} className="inline-flex items-center h-7 px-2.5 text-base font-medium rounded-[7px] border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors">Publish</button>
            </>
          )}
        </div>
      </div>


      {/* Table */}
      <div className="w-full">
        <table className="w-full text-base" style={{ minWidth: 1100 }}>
          <thead className="sticky top-0 z-10 bg-background">
            <tr className="bg-muted/30 border-b border-border">
              {/* Checkbox all */}
              <th className="px-3 py-2 w-7">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-3.5 h-3.5 accent-primary rounded" />
              </th>
              {/* Source — ColFilter dropdown */}
              <th className="px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-left">
                <ColFilter label="Source" options={uniqueSources.map(s => s.id)} value={sourceFilter === "all" ? "" : sourceFilter} onChange={v => setSourceFilter(v || "all")} />
              </th>
              {/* Trade Date */}
              <th className="px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-left">
                <button onClick={() => handleTxSort("date")} className="inline-flex items-center gap-0.5 hover:text-foreground transition-colors">Trade Date {txSortIcon("date")}</button>
              </th>
              {/* Settlement */}
              <th className="px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-left">
                <button onClick={() => handleTxSort("settlementDate")} className="inline-flex items-center gap-0.5 hover:text-foreground transition-colors">Settlement {txSortIcon("settlementDate")}</button>
              </th>
              {/* Security — SearchFilter */}
              <th className="px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-left">
                <span className="flex items-center gap-1">
                  <button onClick={() => handleTxSort("security")} className="inline-flex items-center gap-0.5 hover:text-foreground transition-colors">Security {txSortIcon("security")}</button>
                  <SearchFilter label="" value={txSearch} onChange={v => setTxSearch(v)} placeholder="Security or ticker…" />
                </span>
              </th>
              {/* Ticker */}
              <th className="px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-left">
                <button onClick={() => handleTxSort("ticker")} className="inline-flex items-center gap-0.5 hover:text-foreground transition-colors">Ticker {txSortIcon("ticker")}</button>
              </th>
              {/* CCY — ColFilter */}
              <th className="px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-right">
                <ColFilter label="CCY" options={uniqueCcys.filter(c => c !== "all")} value={txCcyFilter === "all" ? "" : txCcyFilter} onChange={v => setTxCcyFilter(v || "all")} />
              </th>
              {/* Type — ColFilter */}
              <th className="px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-right">
                <ColFilter label="Type" options={uniqueTypes.filter(t => t !== "all")} value={txTypeFilter === "all" ? "" : txTypeFilter} onChange={v => setTxTypeFilter(v || "all")} />
              </th>
              {/* Units */}
              <th className="px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-right">
                <button onClick={() => handleTxSort("units")} className="inline-flex items-center justify-end gap-0.5 w-full hover:text-foreground transition-colors">Units {txSortIcon("units")}</button>
              </th>
              {/* Price */}
              <th className="px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-right">
                <button onClick={() => handleTxSort("price")} className="inline-flex items-center justify-end gap-0.5 w-full hover:text-foreground transition-colors">Price {txSortIcon("price")}</button>
              </th>
              {/* FX */}
              <th className="px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-right">
                <button onClick={() => handleTxSort("fxRate")} className="inline-flex items-center justify-end gap-0.5 w-full hover:text-foreground transition-colors">FX {txSortIcon("fxRate")}</button>
              </th>
              {/* Amount */}
              <th className="px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-right">
                <button onClick={() => handleTxSort("net")} className="inline-flex items-center justify-end gap-0.5 w-full hover:text-foreground transition-colors">Amount {txSortIcon("net")}</button>
              </th>
              {/* TB Account */}
              <th className="px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-right">
                <button onClick={() => handleTxSort("tbAccount")} className="inline-flex items-center justify-end gap-0.5 w-full hover:text-foreground transition-colors">TB Account {txSortIcon("tbAccount")}</button>
              </th>
              {/* Status — ColFilter */}
              <th className="px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-right">
                <ColFilter label="Status" options={["pending","approved","published"]} value={statusFilter === "all" ? "" : statusFilter} onChange={v => setStatusFilter((v || "all") as typeof statusFilter)} />
              </th>
            </tr>
          </thead>
          <tbody>
            {!batchEditMode && adding && renderFormRow(draft, (k, v) => setDraft(p => ({ ...p, [k]: v })), saveAdd, () => setAdding(false))}
            {visible.map((t, i) => {
              const isEditing = !batchEditMode && editId === t.id;
              const isBatchEditing = batchEditMode;
              const d = isEditing ? editDraft : editDraft;
              const setD = (k: keyof TxDraft, v: unknown) => setEditDraft(p => ({ ...p, [k]: v }));
              // Batch edit values: use txEdits overlay on top of transaction
              const bv = isBatchEditing ? { ...(txEdits[t.id] ?? {}) } : null;
              const bSet = (field: string, value: unknown) =>
                setTxEdits(m => ({ ...m, [t.id]: { ...m[t.id], [field]: value } }));
              return (
                <tr
                  key={t.id}
                  className={`border-b border-border/40 ${isEditing ? "bg-primary/[0.04]" : isBatchEditing ? "bg-primary/[0.02]" : i % 2 === 1 ? "bg-muted/10" : ""}`}
                >
                  {/* Checkbox */}
                  <td className="px-3 py-1.5">
                    {!batchEditMode && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(t.id)}
                        onChange={() => toggleOne(t.id)}
                        className="w-3.5 h-3.5 accent-primary rounded"
                      />
                    )}
                  </td>

                  {/* Source */}
                  <td className="px-2 py-1 max-w-[110px]">
                    {isEditing
                      ? <input value={d.broker} onChange={e => setD("broker", e.target.value)} className={`${IC} w-24 font-mono`} placeholder="Broker" />
                      : isBatchEditing
                      ? <input value={String(bv?.sourceId ?? t.sourceId ?? "")} onChange={e => bSet("sourceId", e.target.value)} className={`${IC} w-24 font-mono`} placeholder="Broker" />
                      : <span className="truncate block font-mono">{t.sourceId ?? brokerName(t)}</span>}
                  </td>

                  {/* Trade Date */}
                  <td className="px-2 py-1">
                    {isEditing
                      ? <input type="date" value={d.date} onChange={e => setD("date", e.target.value)} className={`${IC} w-28`} />
                      : isBatchEditing
                      ? <input type="date" value={String(bv?.date ?? t.date)} onChange={e => bSet("date", e.target.value)} className={`${IC} w-28`} />
                      : <span className="whitespace-nowrap">{fmtDate(t.date)}</span>}
                  </td>

                  {/* Settlement */}
                  <td className="px-2 py-1">
                    {isEditing
                      ? <input type="date" value={d.settlement} onChange={e => setD("settlement", e.target.value)} className={`${IC} w-28`} />
                      : isBatchEditing
                      ? <input type="date" value={String(bv?.settlementDate ?? t.settlementDate ?? "")} onChange={e => bSet("settlementDate", e.target.value || undefined)} className={`${IC} w-28`} />
                      : <span className="whitespace-nowrap text-muted-foreground">{t.settlementDate ? fmtDate(t.settlementDate) : "—"}</span>}
                  </td>

                  {/* Security */}
                  <td className="px-2 py-1 max-w-[110px]">
                    {isEditing
                      ? <input value={d.security} onChange={e => setD("security", e.target.value)} className={`${IC} w-32`} placeholder="Security" />
                      : isBatchEditing
                      ? <input value={String(bv?.security ?? t.security)} onChange={e => bSet("security", e.target.value)} className={`${IC} w-32`} placeholder="Security" />
                      : <span className="font-medium truncate block">{t.security}</span>}
                  </td>

                  {/* Ticker */}
                  <td className="px-2 py-1">
                    {isEditing
                      ? <input value={d.ticker} onChange={e => setD("ticker", e.target.value.toUpperCase())} className={`${IC} w-16`} placeholder="AAPL" />
                      : isBatchEditing
                      ? <input value={String(bv?.ticker ?? t.ticker ?? "")} onChange={e => bSet("ticker", e.target.value.toUpperCase())} className={`${IC} w-16`} placeholder="AAPL" />
                      : <span className="font-mono text-base">{t.ticker}</span>}
                  </td>

                  {/* CCY */}
                  <td className="px-2 py-1 text-center">
                    {isEditing
                      ? <select value={d.ccy} onChange={e => setD("ccy", e.target.value)} className={`${SC} w-16`}>
                          {["CAD","USD","EUR","GBP"].map(c => <option key={c}>{c}</option>)}
                        </select>
                      : isBatchEditing
                      ? <select value={String(bv?.currency ?? t.currency)} onChange={e => bSet("currency", e.target.value)} className={`${SC} w-16`}>
                          {["CAD","USD","EUR","GBP"].map(c => <option key={c}>{c}</option>)}
                        </select>
                      : <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-base font-semibold bg-muted text-foreground border border-border">{t.currency}</span>}
                  </td>

                  {/* Type */}
                  <td className="px-2 py-1">
                    {isEditing
                      ? <select value={d.type} onChange={e => setD("type", e.target.value)} className={`${SC} w-32`}>
                          {TX_TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                        </select>
                      : isBatchEditing
                      ? <select value={String(bv?.type ?? t.type)} onChange={e => bSet("type", e.target.value)} className={`${SC} w-32`}>
                          {TX_TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                        </select>
                      : <TxTypeBadge type={t.type} />}
                  </td>

                  {/* Units */}
                  <td className="px-2 py-1 text-right">
                    {isEditing
                      ? <input type="number" value={d.qty || ""} onChange={e => setD("qty", parseFloat(e.target.value) || 0)} className={`${IC} w-20 text-right`} placeholder="0" />
                      : isBatchEditing
                      ? <input type="number" value={String(bv?.units ?? t.units)} onChange={e => bSet("units", parseFloat(e.target.value) || 0)} className={`${IC} w-20 text-right`} placeholder="0" />
                      : t.units > 0
                        ? <span className="tabular-nums">{Number.isInteger(t.units) ? t.units.toLocaleString("en-CA") : fmt4(t.units)}</span>
                        : <span className="text-muted-foreground">—</span>}
                  </td>

                  {/* Price */}
                  <td className="px-2 py-1 text-right">
                    {isEditing
                      ? <input type="number" value={d.price || ""} onChange={e => setD("price", parseFloat(e.target.value) || 0)} className={`${IC} w-20 text-right`} placeholder="0.00" />
                      : isBatchEditing
                      ? <input type="number" value={String(bv?.price ?? t.price)} onChange={e => bSet("price", parseFloat(e.target.value) || 0)} className={`${IC} w-20 text-right`} placeholder="0.00" />
                      : <span className="tabular-nums">{fmt2(t.price)}</span>}
                  </td>

                  {/* FX */}
                  <td className="px-2 py-1 text-right">
                    {isEditing
                      ? <input type="number" step="0.0001" value={d.fxRate || ""} onChange={e => setD("fxRate", parseFloat(e.target.value) || 1)} className={`${IC} w-20 text-right`} placeholder="1.0000" />
                      : isBatchEditing
                      ? <input type="number" step="0.0001" value={String(bv?.fxRate ?? t.fxRate ?? 1)} onChange={e => bSet("fxRate", parseFloat(e.target.value) || 1)} className={`${IC} w-20 text-right`} placeholder="1.0000" />
                      : <span className="tabular-nums text-foreground">{fmt4(t.fxRate ?? 1)}</span>}
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
                      : isBatchEditing
                      ? <select value={String(bv?.tbAccount ?? t.tbAccount ?? "")} onChange={e => bSet("tbAccount", e.target.value)} className={`${SC} w-44`}>
                          <option value="">— Select —</option>
                          {CHART_OF_ACCOUNTS.map(a => (
                            <option key={a.code} value={a.code}>{a.code} · {a.name}</option>
                          ))}
                        </select>
                      : <span className="tabular-nums text-muted-foreground font-mono text-base">{t.tbAccount ?? "—"}</span>}
                  </td>

                  {/* Status */}
                  <td className="px-2 py-1 text-right">
                    {isEditing
                      ? <select value={d.status} onChange={e => setD("status", e.target.value as TxDraft["status"])} className={`${SC} w-24`}>
                          {["pending","approved","published"].map(s => <option key={s}>{s}</option>)}
                        </select>
                      : isBatchEditing
                      ? <select value={String(bv?.status ?? t.status ?? "pending")} onChange={e => bSet("status", e.target.value)} className={`${SC} w-24`}>
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
function WACPanel({ schedules, yearEnd, editMode }: { schedules: SecuritySchedule[]; yearEnd?: string; editMode?: boolean }) {
  const [filterSecurity, setFilterSecurity] = useState("");
  const [filterType,     setFilterType]     = useState("");
  const [filterAccount,  setFilterAccount]  = useState("");
  const [rowOverrides,   setRowOverrides]   = useState<Record<string, WacRow[]>>({});
  const [editKey,        setEditKey]        = useState<string | null>(null);
  const [editData,       setEditData]       = useState<Partial<WacRow>>({});

  const updateRowField = (scheduleKey: string, idx: number, updates: Partial<WacRow>) => {
    const sched = schedules.find(s => s.key === scheduleKey)!;
    const rows = getRows(sched);
    setRowOverrides(prev => ({ ...prev, [scheduleKey]: rows.map((r, i) => i === idx ? { ...r, ...updates } : r) }));
  };
  const [addingFor,      setAddingFor]      = useState<string | null>(null);
  const [newRow,         setNewRow]         = useState<Partial<WacRow>>({});
  const settings     = useStore(s => s.settings);
  const yearEndDate  = yearEnd || (settings.fiscalYearEnd ? fmtDate(settings.fiscalYearEnd.slice(0, 10)) : "—");

  const getRows = (s: SecuritySchedule): WacRow[] => rowOverrides[s.key] ?? s.rows;

  const saveEdit = (scheduleKey: string, actualIdx: number) => {
    const sched = schedules.find(s => s.key === scheduleKey)!;
    const updated = getRows(sched).map((r, i) => i === actualIdx ? { ...r, ...editData } : r);
    setRowOverrides(prev => ({ ...prev, [scheduleKey]: updated }));
    setEditKey(null);
    toast.success("Row updated");
  };

  const deleteRow = (scheduleKey: string, actualIdx: number) => {
    const sched = schedules.find(s => s.key === scheduleKey)!;
    const updated = getRows(sched).filter((_, i) => i !== actualIdx);
    setRowOverrides(prev => ({ ...prev, [scheduleKey]: updated }));
    toast.success("Row removed");
  };

  const addRow = (scheduleKey: string) => {
    const sched = schedules.find(s => s.key === scheduleKey)!;
    const rows = getRows(sched);
    const last = rows[rows.length - 1];
    const entry: WacRow = {
      date: newRow.date ?? "", type: newRow.type ?? "Adjustment",
      unitsIn: newRow.unitsIn ?? 0, unitsOut: newRow.unitsOut ?? 0,
      price: newRow.price ?? last?.wac ?? 0,
      costIn: newRow.costIn ?? 0, costOut: newRow.costOut ?? 0,
      cumUnits: newRow.cumUnits ?? last?.cumUnits ?? 0,
      cumCost: newRow.cumCost ?? last?.cumCost ?? 0,
      wac: newRow.wac ?? last?.wac ?? 0,
    };
    setRowOverrides(prev => ({ ...prev, [scheduleKey]: [...rows, entry] }));
    setAddingFor(null);
    setNewRow({});
    toast.success("Row added");
  };

  const uniqueTypes = useMemo(() =>
    Array.from(new Set(schedules.flatMap(s => getRows(s).map(r => r.type)).filter(t => t !== "Opening Balance"))).sort(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schedules, rowOverrides]
  );

  const uniqueAccounts = useMemo(() =>
    Array.from(new Set(schedules.flatMap(s => s.sourceIds))).sort(),
    [schedules]
  );

  type WacSortField = "security" | "ticker" | "date" | "type" | "openingCost" | "costIn" | "cumCost" | "openingUnits" | "unitsIn" | "cumUnits" | "wac";
  const [sortField, setSortField] = useState<WacSortField>("security");
  const [sortDir,   setSortDir]   = useState<"asc" | "desc">("asc");

  const handleSort = (field: WacSortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };
  const sortIcon = (field: WacSortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 text-primary" />
      : <ArrowDown className="h-3 w-3 text-primary" />;
  };

  const sortedSchedules = useMemo(() => {
    const filtered = schedules.filter(s =>
      (!filterSecurity || s.security.toLowerCase().includes(filterSecurity.toLowerCase()) || s.ticker.toLowerCase().includes(filterSecurity.toLowerCase())) &&
      (!filterAccount  || s.sourceIds.includes(filterAccount))
    );
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      const ar = getRows(a); const br = getRows(b);
      switch (sortField) {
        case "security":  cmp = a.security.localeCompare(b.security); break;
        case "ticker":    cmp = a.ticker.localeCompare(b.ticker); break;
        case "date":      cmp = (ar[0]?.date ?? "").localeCompare(br[0]?.date ?? ""); break;
        case "type":      cmp = (ar[0]?.type ?? "").localeCompare(br[0]?.type ?? ""); break;
        case "openingCost":   cmp = (ar.find(r => r.type !== "Opening Balance")?.openingCost ?? 0) - (br.find(r => r.type !== "Opening Balance")?.openingCost ?? 0); break;
        case "costIn":        cmp = ar.reduce((s,r)=>s+r.costIn,0) - br.reduce((s,r)=>s+r.costIn,0); break;
        case "cumCost":       cmp = a.closingCostCAD - b.closingCostCAD; break;
        case "openingUnits":  cmp = (ar.find(r => r.type !== "Opening Balance")?.openingUnits ?? 0) - (br.find(r => r.type !== "Opening Balance")?.openingUnits ?? 0); break;
        case "unitsIn":       cmp = ar.reduce((s,r)=>s+r.unitsIn,0) - br.reduce((s,r)=>s+r.unitsIn,0); break;
        case "cumUnits":      cmp = a.closingUnits - b.closingUnits; break;
        case "wac":       cmp = a.closingWac - b.closingWac; break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedules, filterSecurity, filterAccount, sortField, sortDir, rowOverrides]);

  const IIC = "h-6 text-base px-1.5 border border-border rounded-[5px] bg-background focus:outline-none w-full";

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Account filter dropdown */}
        <div className="relative">
          <select
            value={filterAccount}
            onChange={e => setFilterAccount(e.target.value)}
            className="h-7 pl-2 pr-7 text-base border border-border rounded-[7px] bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 appearance-none cursor-pointer"
          >
            <option value="">All Accounts</option>
            {uniqueAccounts.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        </div>
        {(filterSecurity || filterType || filterAccount) && (
          <button onClick={() => { setFilterSecurity(""); setFilterType(""); setFilterAccount(""); }} className="inline-flex items-center gap-1 h-7 px-2 text-base text-muted-foreground hover:text-foreground border border-border rounded-[7px] bg-background transition-colors">
            <X className="h-3 w-3" /> Clear filters
          </button>
        )}
        <span className="ml-auto text-base text-muted-foreground">{sortedSchedules.length} securities · WAC roll-forward</span>
      </div>

      {/* Spreadsheet table */}
      <div className="rounded-[8px] border border-border overflow-clip">
        <div className="w-full">
          <table className="w-full border-collapse text-base" style={{ minWidth: 900 }}>
            <thead className="sticky top-0 z-10 bg-background">
              {/* Group header row */}
              <tr className="bg-[#e8eaed] border-b border-border/60 text-base font-bold text-muted-foreground uppercase tracking-wider">
                <th colSpan={4} className="px-2.5 py-1 text-left border-r border-border/40" />
                <th colSpan={3} className="px-2.5 py-1 text-center bg-violet-50/40" style={{ borderLeft: "3px solid hsl(var(--foreground) / 0.3)", borderRight: "3px solid hsl(var(--foreground) / 0.3)" }}>
                  Cost
                </th>
                <th colSpan={3} className="px-2.5 py-1 text-center bg-blue-50/40" style={{ borderRight: "3px solid hsl(var(--foreground) / 0.3)" }}>
                  Units
                </th>
                <th className="px-2.5 py-1 text-center" />
              </tr>
              <tr className="bg-[#f0f2f5] border-b-2 border-border">
                {/* Security — sort + SearchFilter */}
                <th className="text-left min-w-[100px] max-w-[180px] px-2.5 py-2 text-base font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap border-r border-border/40">
                  <span className="flex items-center gap-1">
                    <button onClick={() => handleSort("security")} className="flex items-center gap-1 hover:text-foreground transition-colors">Security {sortIcon("security")}</button>
                    <SearchFilter label="" value={filterSecurity} onChange={setFilterSecurity} placeholder="Ticker or name…" options={[...schedules].sort((a,b)=>a.ticker.localeCompare(b.ticker)).map(s => ({ value: s.ticker, label: `${s.ticker} · ${s.security}` }))} />
                  </span>
                </th>
                {/* Ticker */}
                <th className="text-left w-16 px-2.5 py-2 text-base font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap border-r border-border/40">
                  <button onClick={() => handleSort("ticker")} className="flex items-center gap-1 hover:text-foreground transition-colors">Ticker {sortIcon("ticker")}</button>
                </th>
                {/* Date */}
                <th className="text-left w-28 px-2.5 py-2 text-base font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap border-r border-border/40">
                  <button onClick={() => handleSort("date")} className="flex items-center gap-1 hover:text-foreground transition-colors">Date {sortIcon("date")}</button>
                </th>
                {/* Type — ColFilter */}
                <th className="text-left min-w-[140px] px-2.5 py-2 text-base font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap border-r border-border/40">
                  <ColFilter label="Type" options={uniqueTypes} value={filterType} onChange={setFilterType} />
                </th>
                {/* Cost Opening */}
                <th className="text-right w-28 px-2.5 py-2 text-base font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap border-r border-border/40 bg-violet-50/20" style={{ borderLeft: "3px solid hsl(var(--foreground) / 0.3)" }}>
                  <button onClick={() => handleSort("openingCost")} className="flex items-center justify-end gap-1 w-full hover:text-foreground transition-colors">Opening {sortIcon("openingCost")}</button>
                </th>
                {/* Cost Purchasing */}
                <th className="text-right w-28 px-2.5 py-2 text-base font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap border-r border-border/40">
                  <button onClick={() => handleSort("costIn")} className="flex items-center justify-end gap-1 w-full hover:text-foreground transition-colors">Purchasing {sortIcon("costIn")}</button>
                </th>
                {/* Cost Closing */}
                <th className="text-right w-28 px-2.5 py-2 text-base font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap" style={{ borderRight: "3px solid hsl(var(--foreground) / 0.3)" }}>
                  <button onClick={() => handleSort("cumCost")} className="flex items-center justify-end gap-1 w-full hover:text-foreground transition-colors">Closing {sortIcon("cumCost")}</button>
                </th>
                {/* Units Opening */}
                <th className="text-right w-24 px-2.5 py-2 text-base font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap border-r border-border/40" style={{ borderLeft: "3px solid hsl(var(--foreground) / 0.3)" }}>
                  <button onClick={() => handleSort("openingUnits")} className="flex items-center justify-end gap-1 w-full hover:text-foreground transition-colors">Opening {sortIcon("openingUnits")}</button>
                </th>
                {/* Units Purchasing */}
                <th className="text-right w-24 px-2.5 py-2 text-base font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap border-r border-border/40">
                  <button onClick={() => handleSort("unitsIn")} className="flex items-center justify-end gap-1 w-full hover:text-foreground transition-colors">Purchasing {sortIcon("unitsIn")}</button>
                </th>
                {/* Units Closing */}
                <th className="text-right w-24 px-2.5 py-2 text-base font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap bg-blue-50/20" style={{ borderRight: "3px solid hsl(var(--foreground) / 0.3)" }}>
                  <button onClick={() => handleSort("cumUnits")} className="flex items-center justify-end gap-1 w-full hover:text-foreground transition-colors">Closing {sortIcon("cumUnits")}</button>
                </th>
                {/* WAC */}
                <th className="text-right w-24 px-2.5 py-2 text-base font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  <button onClick={() => handleSort("wac")} className="flex items-center justify-end gap-1 w-full hover:text-foreground transition-colors">WAC {sortIcon("wac")}</button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedSchedules.map((s, si) => {
                const allRows  = getRows(s);
                const visibleRows = allRows.filter(r => r.type !== "Opening Balance");
                const dataRows = filterType ? visibleRows.filter(r => r.type === filterType) : visibleRows;
                const grpBg    = "";
                return (
                  <Fragment key={s.key}>
                    {dataRows.map((r, rowI) => {
                      const actualIdx = allRows.indexOf(r);
                      const eKey      = `${s.key}|${actualIdx}`;
                      const isEditing = editMode || editKey === eKey;
                      // In global editMode, read value from rowOverrides directly; in per-row mode use editData buffer
                      const getV = <K extends keyof WacRow>(field: K): WacRow[K] =>
                        editMode ? ((rowOverrides[s.key]?.[actualIdx] ?? r)[field]) : ((editData[field] ?? r[field]) as WacRow[K]);
                      const setV = (updates: Partial<WacRow>) =>
                        editMode ? updateRowField(s.key, actualIdx, updates) : setEditData(d => ({ ...d, ...updates }));
                      const isOB      = false;
                      const rowBg     = isEditing ? "bg-primary/5" : "";
                      return (
                        <tr key={eKey} className={`border-b border-border/30 hover:bg-primary/[0.03] transition-colors ${rowBg}`}>
                          {/* Security */}
                          <td className="px-2.5 py-1.5 border-r border-border/20 max-w-[180px]">
                            {rowI === 0
                              ? <span className="font-semibold text-foreground truncate block overflow-hidden text-ellipsis" title={s.security}>{s.security}</span>
                              : <span className="text-muted-foreground/30 text-base italic select-none">{s.ticker}</span>}
                          </td>
                          {/* Ticker */}
                          <td className="px-2.5 py-1.5 border-r border-border/20 font-mono font-semibold text-foreground">{s.ticker}</td>
                          {/* Date */}
                          <td className="px-2.5 py-1.5 border-r border-border/20 font-mono text-muted-foreground whitespace-nowrap text-base">
                            {isEditing
                              ? <input type="date" value={getV("date")} onChange={e => setV({ date: e.target.value })} className={`${IIC} w-28`} />
                              : fmtDate(r.date)}
                          </td>
                          {/* Type */}
                          <td className="px-2.5 py-1.5 border-r border-border/20">
                            {isEditing ? (
                              <select value={getV("type")} onChange={e => setV({ type: e.target.value })} className={`${IIC} w-36`}>
                                {WAC_ROW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            ) : isOB ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-base font-medium border whitespace-nowrap bg-transparent text-foreground border-border">{r.type}</span>
                            ) : r.type === "Closing Balance" ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-base font-medium border whitespace-nowrap bg-transparent text-foreground border-border">{r.type}</span>
                            ) : (
                              <TxTypeBadge type={r.type} />
                            )}
                          </td>
                          {/* Cost Opening (read-only — prev cumCost) */}
                          <td className="px-2.5 py-1.5 text-right tabular-nums border-r border-border/20 text-muted-foreground" style={{ borderLeft: "3px solid hsl(var(--foreground) / 0.3)" }}>
                            {fmtCAD(r.openingCost ?? 0)}
                          </td>
                          {/* Cost Purchasing */}
                          <td className="px-2.5 py-1.5 text-right tabular-nums border-r border-border/20">
                            {isEditing
                              ? <input type="number" value={getV("costIn")} onChange={e => setV({ costIn: parseFloat(e.target.value)||0 })} className={`${IIC} w-24 text-right`} />
                              : fmtCAD(r.costIn)}
                          </td>
                          {/* Cost Closing */}
                          <td className="px-2.5 py-1.5 text-right tabular-nums font-semibold" style={{ borderRight: "3px solid hsl(var(--foreground) / 0.3)" }}>
                            {isEditing
                              ? <input type="number" value={getV("cumCost")} onChange={e => setV({ cumCost: parseFloat(e.target.value)||0 })} className={`${IIC} w-24 text-right`} />
                              : fmtCAD(r.cumCost)}
                          </td>
                          {/* Units Opening (read-only — prev cumUnits) */}
                          <td className="px-2.5 py-1.5 text-right tabular-nums border-r border-border/20 text-muted-foreground" style={{ borderLeft: "3px solid hsl(var(--foreground) / 0.3)" }}>
                            {fmtUnits(r.openingUnits ?? 0)}
                          </td>
                          {/* Units Purchasing */}
                          <td className="px-2.5 py-1.5 text-right tabular-nums border-r border-border/20">
                            {isEditing
                              ? <input type="number" value={getV("unitsIn")} onChange={e => setV({ unitsIn: parseFloat(e.target.value)||0 })} className={`${IIC} w-20 text-right`} />
                              : fmtUnits(r.unitsIn)}
                          </td>
                          {/* Units Closing */}
                          <td className="px-2.5 py-1.5 text-right tabular-nums font-semibold" style={{ borderRight: "3px solid hsl(var(--foreground) / 0.3)" }}>
                            {isEditing
                              ? <input type="number" value={getV("cumUnits")} onChange={e => setV({ cumUnits: parseFloat(e.target.value)||0 })} className={`${IIC} w-20 text-right`} />
                              : fmtUnits(r.cumUnits)}
                          </td>
                          {/* WAC — always computed: cumCost ÷ cumUnits */}
                          <td className="px-2.5 py-1.5 text-right tabular-nums border-r border-border/20">
                            {fmtNum((() => { const u = isEditing ? getV("cumUnits") : r.cumUnits; const c = isEditing ? getV("cumCost") : r.cumCost; return u > 0 ? c / u : 0; })(), 4)}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Inline new-row form */}
                    {addingFor === s.key && (
                      <tr className="border-b border-dashed border-primary/50 bg-primary/5">
                        <td className="px-2.5 py-1 border-r border-border/20 text-base text-muted-foreground italic">{s.security}</td>
                        <td className="px-2.5 py-1 border-r border-border/20 font-mono font-semibold text-base">{s.ticker}</td>
                        <td className="px-2.5 py-1 border-r border-border/20"><input type="date" value={newRow.date ?? ""} onChange={e => setNewRow(d => ({...d, date: e.target.value}))} className={`${IIC} w-28`} /></td>
                        <td className="px-2.5 py-1 border-r border-border/20"><select value={newRow.type ?? "Adjustment"} onChange={e => setNewRow(d => ({...d, type: e.target.value}))} className={`${IIC} w-36`}>{WAC_ROW_TYPES.map(t => <option key={t}>{t}</option>)}</select></td>
                        <td className="px-2.5 py-1 border-r border-border/20 text-right tabular-nums text-muted-foreground/60" style={{ borderLeft: "3px solid hsl(var(--foreground) / 0.3)" }}>{fmtCAD(allRows[allRows.length - 1]?.cumCost ?? 0)}</td>
                        <td className="px-2.5 py-1 border-r border-border/20" style={{}}><input type="number" placeholder="0.00" value={newRow.costIn ?? ""} onChange={e => setNewRow(d => ({...d, costIn: parseFloat(e.target.value)||0}))} className={`${IIC} w-24 text-right`} /></td>
                        <td className="px-2.5 py-1" style={{ borderRight: "3px solid hsl(var(--foreground) / 0.3)" }}><input type="number" placeholder="0.00" value={newRow.cumCost ?? ""} onChange={e => setNewRow(d => ({...d, cumCost: parseFloat(e.target.value)||0}))} className={`${IIC} w-24 text-right`} /></td>
                        <td className="px-2.5 py-1 border-r border-border/20 text-right tabular-nums text-muted-foreground/60" style={{ borderLeft: "3px solid hsl(var(--foreground) / 0.3)" }}>{fmtUnits(allRows[allRows.length - 1]?.cumUnits ?? 0)}</td>
                        <td className="px-2.5 py-1 border-r border-border/20"><input type="number" placeholder="0" value={newRow.unitsIn ?? ""} onChange={e => setNewRow(d => ({...d, unitsIn: parseFloat(e.target.value)||0}))} className={`${IIC} w-20 text-right`} /></td>
                        <td className="px-2.5 py-1" style={{ borderRight: "3px solid hsl(var(--foreground) / 0.3)" }}><input type="number" placeholder="0.0000" value={newRow.cumUnits ?? ""} onChange={e => setNewRow(d => ({...d, cumUnits: parseFloat(e.target.value)||0}))} className={`${IIC} w-20 text-right`} /></td>
                        <td className="px-2.5 py-1 text-right tabular-nums text-muted-foreground">{fmtNum((newRow.cumUnits ?? 0) > 0 ? (newRow.cumCost ?? 0) / (newRow.cumUnits ?? 1) : 0, 4)}</td>
                      </tr>
                    )}

                    {/* Closing balance row */}
                    <tr className="border-b-[3px] border-slate-300/80 font-semibold bg-[#f0f2f5]">
                      <td className="px-2.5 py-2 border-r border-border/30 text-base font-bold max-w-[180px] truncate overflow-hidden text-ellipsis" title={s.security}>{s.security}</td>
                      <td className="px-2.5 py-2 border-r border-border/30 font-mono font-bold">{s.ticker}</td>
                      <td className="px-2.5 py-2 border-r border-border/30 font-mono text-muted-foreground text-base whitespace-nowrap">
                        {yearEndDate}
                      </td>
                      <td className="px-2.5 py-2 border-r border-border/30">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-base font-medium border whitespace-nowrap bg-transparent text-foreground border-border">Closing Balance</span>
                      </td>
                      <td className="px-2.5 py-2 text-right tabular-nums border-r border-border/30 text-muted-foreground/60" style={{ borderLeft: "3px solid hsl(var(--foreground) / 0.3)" }}>{fmtCAD(0)}</td>
                      <td className="px-2.5 py-2 text-right tabular-nums border-r border-border/30 text-muted-foreground/60">{fmtCAD(0)}</td>
                      <td className="px-2.5 py-2 text-right tabular-nums" style={{ borderRight: "3px solid hsl(var(--foreground) / 0.3)" }}>{fmtCAD(s.closingCostCAD)}</td>
                      <td className="px-2.5 py-2 text-right tabular-nums border-r border-border/30 text-muted-foreground/60" style={{ borderLeft: "3px solid hsl(var(--foreground) / 0.3)" }}>{fmtUnits(0)}</td>
                      <td className="px-2.5 py-2 text-right tabular-nums border-r border-border/30 text-muted-foreground/60">{fmtUnits(0)}</td>
                      <td className="px-2.5 py-2 text-right tabular-nums" style={{ borderRight: "3px solid hsl(var(--foreground) / 0.3)" }}>{fmtUnits(s.closingUnits)}</td>
                      <td className="px-2.5 py-2 text-right tabular-nums">{fmtNum(s.closingWac, 4)}</td>
                    </tr>

                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 3: Gain / Loss ───────────────────────────────────────────────────────

function GainLossPanel({ schedules, yearEnd, editMode, allInvSources }: {
  schedules: SecuritySchedule[];
  yearEnd?: string;
  editMode?: boolean;
  allInvSources: Source[];
}) {
  const settings   = useStore(s => s.settings);
  const yearEndStr = yearEnd || (settings.fiscalYearEnd ? fmtDate(settings.fiscalYearEnd.slice(0, 10)) : "—");

  // Per-row account / override state
  const [realizedAccts,   setRealizedAccts]   = useState<Record<number, string>>({});
  const [bankAccts,       setBankAccts]        = useState<Record<number, string>>({});
  const [unrealizedBankAccts, setUnrealizedBankAccts] = useState<Record<string, string>>({});
  const [adjustments,     setAdjustments]      = useState<Record<number, number>>({});
  const [unrealizedAccts, setUnrealizedAccts]  = useState<Record<string, string>>({});
  const [rOvr, setROvr] = useState<Record<number, { date?: string; units?: number; grossProceeds?: number; costOut?: number }>>({});
  const [uOvr, setUOvr] = useState<Record<string, { units?: number; fmvCAD?: number; closingCostCAD?: number; unrealizedGL?: number }>>({});
  const rSet = (i: number, patch: typeof rOvr[number]) => setROvr(p => ({ ...p, [i]: { ...p[i], ...patch } }));
  const uSet = (k: string, patch: typeof uOvr[string]) => setUOvr(p => ({ ...p, [k]: { ...p[k], ...patch } }));

  // Filters — Realized table
  const [filterBroker,   setFilterBroker]   = useState("");
  const [filterSecurity, setFilterSecurity] = useState("");
  const [filterCcy,      setFilterCcy]      = useState("");
  // Filters — Unrealized table
  const [filterUnrSecurity, setFilterUnrSecurity] = useState("");

  const brokerLabel = useCallback((id?: string) => {
    if (!id) return "—";
    return allInvSources.find(s => s.id === id)?.institution ?? id;
  }, [allInvSources]);

  const allDisposals = useMemo(() => schedules.flatMap(s =>
    s.rows
      .filter(r => r.unitsOut > 0)
      .map(r => ({
        security: s.security,
        ticker: s.ticker,
        date: r.date,
        settlementDate: r.settlementDate,
        sourceId: r.sourceId ?? (s.sourceIds[0] as string | undefined),
        currency: r.currency ?? s.currency ?? "CAD",
        fxRate: r.fxRate ?? 1,
        units: r.unitsOut,
        grossProceeds: r.grossProceedsCAD ?? ((r.realizedGL ?? 0) + r.costOut),
        costOut: r.costOut,
      }))
  ), [schedules]);

  const uniqueBrokers = useMemo(() =>
    [...new Set(allDisposals.map(d => brokerLabel(d.sourceId)))].filter(b => b !== "—"),
    [allDisposals, brokerLabel]
  );
  const uniqueTickers = useMemo(() =>
    [...new Set(allDisposals.map(d => d.ticker))],
    [allDisposals]
  );
  const uniqueCcys = useMemo(() =>
    [...new Set(allDisposals.map(d => d.currency))],
    [allDisposals]
  );
  const uniqueUnrTickers = useMemo(() =>
    [...new Set(schedules.map(s => s.ticker))],
    [schedules]
  );

  const disposals = useMemo(() => allDisposals.filter(d => {
    if (filterBroker   && brokerLabel(d.sourceId) !== filterBroker) return false;
    if (filterSecurity && d.ticker !== filterSecurity)              return false;
    if (filterCcy      && d.currency !== filterCcy)                 return false;
    return true;
  }), [allDisposals, filterBroker, filterSecurity, filterCcy, brokerLabel]);

  const filteredSchedules = useMemo(() =>
    filterUnrSecurity ? schedules.filter(s => s.ticker === filterUnrSecurity) : schedules,
    [schedules, filterUnrSecurity]
  );

  // Tickers that appear in >1 brokerage
  const multiBrokerTickers = useMemo(() => {
    const map = new Map<string, Set<string>>();
    allDisposals.forEach(d => {
      if (!map.has(d.ticker)) map.set(d.ticker, new Set());
      map.get(d.ticker)!.add(d.sourceId ?? "");
    });
    return new Set([...map.entries()].filter(([, s]) => s.size > 1).map(([t]) => t));
  }, [allDisposals]);

  const totGL = disposals.reduce((sum, d, i) => {
    const ov = rOvr[i] ?? {};
    return sum + ((ov.grossProceeds ?? d.grossProceeds) - (ov.costOut ?? d.costOut) - (adjustments[i] ?? 0));
  }, 0);
  const totUnrealized = filteredSchedules.reduce((s, x) => s + x.unrealizedGL, 0);
  const anyFilter = !!(filterBroker || filterSecurity || filterCcy);

  return (
    <div className="space-y-3">
      <TableWrap title="Realized Gain / Loss">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-left min-w-[220px]">
                  <ColFilter label="Security" options={uniqueTickers} value={filterSecurity} onChange={setFilterSecurity} />
                </th>
                {(([
                  { h: "Source",         l: true,  filter: uniqueBrokers.length > 1 ? { opts: uniqueBrokers, val: filterBroker, set: setFilterBroker } : undefined },
                  { h: "Ticker",         l: true  },
                  { h: "Trade Date",     l: false },
                  { h: "Settlement",     l: false },
                  { h: "Units",          l: false },
                  { h: "FX Rate",        l: false },
                  { h: "CCY",            l: false, filter: uniqueCcys.length > 1 ? { opts: uniqueCcys, val: filterCcy, set: setFilterCcy } : undefined },
                  { h: "Gross Proceeds", l: false },
                  { h: "Cost (ACB)",     l: false },
                  { h: "Adjustments",    l: false },
                  { h: "Realized G/L",  l: false, hint: true },
                  { h: "Bank Account",   l: false },
                  { h: "TB Account",     l: false },
                ]) as Array<{ h: string; l: boolean; hint?: boolean; filter?: { opts: string[]; val: string; set: (v: string) => void } }>).map(({ h, l, hint, filter }) => (
                  <th key={h} className={`px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${l ? "text-left" : "text-right"}`}>
                    {hint ? (
                      <span className="flex flex-col items-end gap-0.5">
                        <span>Realized G/L</span>
                        <span className="text-[10px] font-medium normal-case tracking-normal text-foreground">+ gain &nbsp; (loss)</span>
                      </span>
                    ) : filter ? (
                      <ColFilter label={h} options={filter.opts} value={filter.val} onChange={filter.set} />
                    ) : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {disposals.length === 0 && (
                <tr><td colSpan={14} className="px-3 py-4 text-center text-base text-muted-foreground">No disposals in this period</td></tr>
              )}
              {disposals.map((d, i) => {
                const ov = rOvr[i] ?? {};
                const EC = "h-6 text-base px-1.5 border border-border rounded-[5px] bg-background focus:outline-none w-full";
                const gp  = ov.grossProceeds ?? d.grossProceeds;
                const co  = ov.costOut ?? d.costOut;
                const adj = adjustments[i] ?? 0;
                const gl  = gp - co - adj;
                const defaultBank = d.currency === "USD" ? "1110" : "1100";
                const defaultTb   = gl >= 0 ? "4800" : "4900";
                return (
                  <tr key={`${d.ticker}-${d.date}-${i}`} className={`border-b border-border/40 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                    <td className="px-3 py-1.5 font-medium min-w-[220px]">{d.security}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <span className={multiBrokerTickers.has(d.ticker) ? "text-amber-700" : ""}>
                        {brokerLabel(d.sourceId)}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 font-mono">{d.ticker}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap text-right">
                      {editMode ? <input type="date" value={ov.date ?? d.date} onChange={e => rSet(i, { date: e.target.value })} className={`${EC} w-28`} /> : fmtDate(d.date)}
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap text-right tabular-nums">
                      {d.settlementDate && d.settlementDate !== d.date ? fmtDate(d.settlementDate) : "—"}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {editMode ? <input type="number" value={ov.units ?? d.units} onChange={e => rSet(i, { units: parseFloat(e.target.value)||0 })} className={`${EC} w-24 text-right`} /> : fmtUnits(d.units)}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-mono">
                      {d.fxRate !== 1 ? d.fxRate.toFixed(4) : "—"}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono">{d.currency}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {editMode ? <input type="number" value={ov.grossProceeds ?? d.grossProceeds} onChange={e => rSet(i, { grossProceeds: parseFloat(e.target.value)||0 })} className={`${EC} w-28 text-right`} /> : fmtCAD(gp)}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {editMode ? <input type="number" value={ov.costOut ?? d.costOut} onChange={e => rSet(i, { costOut: parseFloat(e.target.value)||0 })} className={`${EC} w-28 text-right`} /> : fmtCAD(co)}
                    </td>
                    <td className="px-3 py-1 text-right">
                      <input
                        type="number"
                        value={adj === 0 ? "" : adj}
                        placeholder="0.00"
                        onChange={e => setAdjustments(p => ({ ...p, [i]: parseFloat(e.target.value) || 0 }))}
                        className={`${EC} w-20 text-right`}
                      />
                    </td>
                    <td className="px-3 py-1.5 text-right">{fmtGL(gl)}</td>
                    <td className="px-3 py-1 w-44">
                      <div className="relative">
                        <select value={bankAccts[i] ?? defaultBank} onChange={e => setBankAccts(p => ({ ...p, [i]: e.target.value }))} className={`${SC} pr-7`}>
                          <option value="">— Select —</option>
                          {CHART_OF_ACCOUNTS.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </td>
                    <td className="px-3 py-1 w-44">
                      <div className="relative">
                        <select value={realizedAccts[i] ?? defaultTb} onChange={e => setRealizedAccts(p => ({ ...p, [i]: e.target.value }))} className={`${SC} pr-7`}>
                          <option value="">— Select —</option>
                          {CHART_OF_ACCOUNTS.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/30 border-t border-border font-semibold">
                <td className="px-3 py-2 text-base" colSpan={11}>Total</td>
                <td className="px-3 py-2 text-right text-base">{fmtGL(totGL)}</td>
                <td className="px-3 py-2" colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </TableWrap>

      <TableWrap title="Unrealized Gain / Loss">
        <table className="w-full text-base">
          <thead className="sticky top-0 z-10 bg-background">
            <tr className="bg-muted/30 border-b border-border">
              {([
                { label: "Security",          align: "left",  filter: { opts: uniqueUnrTickers, val: filterUnrSecurity, set: setFilterUnrSecurity } },
                { label: "Ticker",            align: "left"  },
                { label: "Year End Date",      align: "right" },
                { label: "Units",             align: "right" },
                { label: "Fair Market Value", align: "right" },
                { label: "Book Value",        align: "right" },
                { label: "Unrealized G/L",    align: "right", hint: true },
                { label: "Bank Account",      align: "right" },
                { label: "TB Account",        align: "right" },
              ] as Array<{ label: string; align: string; hint?: boolean; filter?: { opts: string[]; val: string; set: (v: string) => void } }>).map(h => (
                <th key={h.label} className={`px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-${h.align}`}>
                  {h.hint ? (
                    <span className="flex flex-col items-end gap-0.5">
                      <span>{h.label}</span>
                      <span className="text-[10px] font-medium normal-case tracking-normal text-foreground">+ gain &nbsp; (loss)</span>
                    </span>
                  ) : h.filter ? (
                    <ColFilter label={h.label} options={h.filter.opts} value={h.filter.val} onChange={h.filter.set} />
                  ) : h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredSchedules.map((s, i) => {
              const uv = uOvr[s.key] ?? {};
              const EC = "h-6 text-base px-1.5 border border-border rounded-[5px] bg-background focus:outline-none w-full";
              return (
              <tr key={s.key} className={`border-b border-border/40 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                <td className="px-3 py-1.5 font-medium">{s.security}</td>
                <td className="px-3 py-1.5 font-mono">{s.ticker}</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground whitespace-nowrap">{yearEndStr}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {editMode ? <input type="number" value={uv.units ?? Math.max(0, s.closingUnits)} onChange={e => uSet(s.key, { units: parseFloat(e.target.value)||0 })} className={`${EC} w-24 text-right`} /> : fmtUnits(Math.max(0, s.closingUnits))}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums font-medium">
                  {editMode ? <input type="number" value={uv.fmvCAD ?? s.fmvCAD} onChange={e => uSet(s.key, { fmvCAD: parseFloat(e.target.value)||0 })} className={`${EC} w-28 text-right`} /> : fmtCAD(s.fmvCAD)}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {editMode ? <input type="number" value={uv.closingCostCAD ?? s.closingCostCAD} onChange={e => uSet(s.key, { closingCostCAD: parseFloat(e.target.value)||0 })} className={`${EC} w-28 text-right`} /> : fmtCAD(s.closingCostCAD)}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {editMode ? <input type="number" value={uv.unrealizedGL ?? s.unrealizedGL} onChange={e => uSet(s.key, { unrealizedGL: parseFloat(e.target.value)||0 })} className={`${EC} w-28 text-right`} /> : fmtGL(s.unrealizedGL)}
                </td>
                <td className="px-3 py-1 w-44">
                  <div className="relative">
                    <select
                      value={unrealizedBankAccts[s.key] ?? (s.currency === "USD" ? "1110" : "1100")}
                      onChange={e => setUnrealizedBankAccts(p => ({ ...p, [s.key]: e.target.value }))}
                      className={`${SC} pr-7`}
                    >
                      <option value="">— Select —</option>
                      {CHART_OF_ACCOUNTS.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </td>
                <td className="px-3 py-1 w-44">
                  <div className="relative">
                    <select
                      value={unrealizedAccts[s.key] ?? (s.unrealizedGL >= 0 ? "4810" : "4910")}
                      onChange={e => setUnrealizedAccts(p => ({ ...p, [s.key]: e.target.value }))}
                      className={`${SC} pr-7`}
                    >
                      <option value="">— Select —</option>
                      {CHART_OF_ACCOUNTS.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </td>
              </tr>
            );})}
          </tbody>
          <tfoot>
            <tr className="bg-muted/30 border-t border-border font-semibold">
              <td className="px-3 py-2 text-base" colSpan={3}>Total</td>
              <td className="px-3 py-2 text-right tabular-nums text-base">{fmtNum(filteredSchedules.reduce((a, s) => a + s.closingUnits, 0), 4)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-base font-bold">{fmtCAD(filteredSchedules.reduce((a, s) => a + s.fmvCAD, 0))}</td>
              <td className="px-3 py-2 text-right tabular-nums text-base font-bold">{fmtCAD(filteredSchedules.reduce((a, s) => a + s.closingCostCAD, 0))}</td>
              <td className="px-3 py-2 text-right tabular-nums text-base">{fmtGL(totUnrealized)}</td>
              <td className="px-3 py-2" colSpan={2} />
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
        <table className="w-full text-base">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              {["CCY","Opening Rate","Closing Rate","Average Rate",""].map((h, i) => (
                <th key={i} className={`px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
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
                          <span className="text-base text-muted-foreground w-16 shrink-0">Closing:</span>
                          <input type="number" step="0.0001" value={editDraft.closingRate} onChange={e => setEditDraft(p => ({ ...p, closingRate: parseFloat(e.target.value) || 1 }))} className={`${IC} w-32`} />
                          <span className="text-base text-muted-foreground w-16 shrink-0">Average:</span>
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
        <table className="w-full text-base">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              {["Date","Security","Ticker","CCY","Amount (Local)","FX Rate","Amount CAD"].map((h, i) => (
                <th key={h} className={`px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${i < 4 ? "text-left" : "text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fxSchedule.events.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-base text-muted-foreground">No FX events</td></tr>
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
function IncomePanel({ incomeMatrix, editMode }: { incomeMatrix: ReturnType<typeof buildIncomeMatrix>; editMode?: boolean }) {
  const { incomeTxRows, expenseTxRows, incomeTotal, expenseTotal } = incomeMatrix;
  const [incomeAccts,  setIncomeAccts]  = useState<Record<string, string>>({});
  const [expenseAccts, setExpenseAccts] = useState<Record<string, string>>({});
  const [incOvr, setIncOvr] = useState<Record<string, { date?: string; description?: string; amountCAD?: number }>>({});
  const [expOvr, setExpOvr] = useState<Record<string, { date?: string; description?: string; amountCAD?: number }>>({});
  const EC = "h-6 text-base px-1.5 border border-border rounded-[5px] bg-background focus:outline-none w-full";

  const acctDropdown = (
    row: import("@/lib/luka/compute").IncomeTxRow,
    overrides: Record<string, string>,
    setOverrides: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  ) => (
    <td className="px-3 py-1 w-48">
      <div className="relative">
        <select
          value={overrides[row.id] ?? row.tbAccount}
          onChange={e => setOverrides(p => ({ ...p, [row.id]: e.target.value }))}
          className={`${SC} pr-7`}
        >
          <option value="">— Select —</option>
          {CHART_OF_ACCOUNTS.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </td>
  );

  const headerRow = (cols: string[]) => (
    <tr className="bg-muted/30 border-b border-border">
      {cols.map((h, i) => (
        <th key={h} className={`px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${i >= cols.length - 1 ? "text-right" : "text-left"}`}>
          {h}
        </th>
      ))}
    </tr>
  );

  return (
    <div className="space-y-3">
      {/* ── Income ── */}
      <TableWrap title="Income">
        <table className="w-full text-base">
          <thead className="sticky top-0 z-10 bg-background">{headerRow(["Date", "Account #", "Entry / Description", "CCY", "Amount (CAD)"])}</thead>
          <tbody>
            {incomeTxRows.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">No income transactions</td></tr>
            )}
            {incomeTxRows.map((row, i) => {
              const ov = incOvr[row.id] ?? {};
              return (
              <tr key={row.id} className={`border-b border-border/40 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                <td className="px-3 py-1.5 whitespace-nowrap tabular-nums text-muted-foreground">
                  {editMode ? <input type="date" value={ov.date ?? row.date} onChange={e => setIncOvr(p => ({ ...p, [row.id]: { ...p[row.id], date: e.target.value } }))} className={`${EC} w-28`} /> : fmtDate(row.date)}
                </td>
                {acctDropdown(row, incomeAccts, setIncomeAccts)}
                <td className="px-3 py-1.5 font-medium">
                  {editMode ? <input value={ov.description ?? row.description} onChange={e => setIncOvr(p => ({ ...p, [row.id]: { ...p[row.id], description: e.target.value } }))} className={`${EC}`} /> : row.description}
                </td>
                <td className="px-3 py-1.5">{row.currency}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {editMode ? <input type="number" value={ov.amountCAD ?? row.amountCAD} onChange={e => setIncOvr(p => ({ ...p, [row.id]: { ...p[row.id], amountCAD: parseFloat(e.target.value)||0 } }))} className={`${EC} w-28 text-right`} /> : fmtGL(row.amountCAD)}
                </td>
              </tr>
            );})}
          </tbody>
          <tfoot>
            <tr className="bg-muted/30 border-t border-border font-semibold">
              <td className="px-3 py-2 text-base" colSpan={4}>Total Income</td>
              <td className="px-3 py-2 text-right tabular-nums text-base font-bold">{fmtGL(incomeTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </TableWrap>

      {/* ── Expenses ── */}
      <TableWrap title="Expenses">
        <table className="w-full text-base">
          <thead className="sticky top-0 z-10 bg-background">{headerRow(["Date", "Account #", "Description", "Amount (CAD)"])}</thead>
          <tbody>
            {expenseTxRows.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">No expense transactions</td></tr>
            )}
            {expenseTxRows.map((row, i) => {
              const ov = expOvr[row.id] ?? {};
              return (
              <tr key={row.id} className={`border-b border-border/40 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                <td className="px-3 py-1.5 whitespace-nowrap tabular-nums text-muted-foreground">
                  {editMode ? <input type="date" value={ov.date ?? row.date} onChange={e => setExpOvr(p => ({ ...p, [row.id]: { ...p[row.id], date: e.target.value } }))} className={`${EC} w-28`} /> : fmtDate(row.date)}
                </td>
                {acctDropdown(row, expenseAccts, setExpenseAccts)}
                <td className="px-3 py-1.5 font-medium">
                  {editMode ? <input value={ov.description ?? row.description} onChange={e => setExpOvr(p => ({ ...p, [row.id]: { ...p[row.id], description: e.target.value } }))} className={`${EC}`} /> : row.description}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {editMode ? <input type="number" value={ov.amountCAD ?? row.amountCAD} onChange={e => setExpOvr(p => ({ ...p, [row.id]: { ...p[row.id], amountCAD: parseFloat(e.target.value)||0 } }))} className={`${EC} w-28 text-right`} /> : fmtGL(row.amountCAD)}
                </td>
              </tr>
            );})}
          </tbody>
          <tfoot>
            <tr className="bg-muted/30 border-t border-border font-semibold">
              <td className="px-3 py-2 text-base" colSpan={3}>Total Expenses</td>
              <td className="px-3 py-2 text-right tabular-nums text-base font-bold">{fmtGL(expenseTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </TableWrap>
    </div>
  );
}

// ─── Tab 6: Broker Recon ──────────────────────────────────────────────────────
// ── Shared section header ──────────────────────────────────────────────────────
function SectionHead({ title }: { title: string }) {
  return (
    <div className="px-4 py-2 bg-muted/20 border-b border-border">
      <span className="text-base font-bold text-foreground uppercase tracking-wider">{title}</span>
    </div>
  );
}

function BrokerReconPanel({
  invRecon, schedules, effectiveTxns, yearEnd: yearEndProp, editMode,
}: {
  invRecon: ReturnType<typeof buildInvestmentRecon>;
  schedules: SecuritySchedule[];
  effectiveTxns: ReturnType<typeof buildIncomeMatrix> extends never ? never : import("@/lib/luka/types").Transaction[];
  yearEnd?: string;
  editMode?: boolean;
}) {
  const settings  = useStore(s => s.settings);
  const yearEnd   = yearEndProp || (settings.fiscalYearEnd ? fmtDate(settings.fiscalYearEnd.slice(0, 10)) : "Dec 31, 2024");
  const fiscalYear = yearEndProp ? yearEndProp.split(", ")[1] || "2024"
    : settings.fiscalYearEnd ? settings.fiscalYearEnd.slice(0, 4) : "2024";
  const yearStart = settings.fiscalYearEnd
    ? fmtDate(settings.fiscalYearEnd.slice(0, 4) + "-01-01")
    : "Jan 1, 2024";

  return (
    <div className="space-y-6">
      {/* Panel intro */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-base text-muted-foreground">
            One annual reconciliation per broker — full fiscal year {fiscalYear} · {invRecon.length} broker account{invRecon.length !== 1 ? "s" : ""} reconciled
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {invRecon.map(g => (
            <span key={g.sourceId} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-base font-semibold border whitespace-nowrap ${g.pass ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
              {g.pass ? "✓" : "⚠"} {g.institution.split(" ")[0]}
            </span>
          ))}
        </div>
      </div>

      {invRecon.map((group, groupIdx) => {
        // ── Gather WAC rows for this broker's securities ───────────────────
        const brokerScheds = schedules.filter(s => s.sourceIds.includes(group.sourceId));

        // Opening: cost of Opening Balance rows
        const booksOpening   = brokerScheds.reduce((a, s) => a + s.rows.filter(r => r.type === "Opening Balance").reduce((x, r) => x + r.costIn, 0), 0);
        // Purchases: costIn on Purchase/Transfer In/Reinvested Dividend rows
        const booksPurchases = brokerScheds.reduce((a, s) => a + s.rows.filter(r => ["Purchase","Transfer In","Reinvested Dividend"].includes(r.type)).reduce((x, r) => x + r.costIn, 0), 0);
        // Sales: costOut on Sale/Transfer Out rows
        const booksSales     = brokerScheds.reduce((a, s) => a + s.rows.filter(r => ["Sale","Transfer Out"].includes(r.type)).reduce((x, r) => x + r.costOut, 0), 0);
        // Income: Dividend + Interest (from txns for this broker)
        const booksIncome    = effectiveTxns.filter(t => t.sourceId === group.sourceId && ["Dividend","Interest","Reinvested Dividend"].includes(t.type)).reduce((a, t) => a + (t.gross ?? 0) * (t.fxRate ?? 1), 0);
        // Expenses: Fees + Withholding Tax
        const booksExpenses  = effectiveTxns.filter(t => t.sourceId === group.sourceId && ["Fee/Commission","Withholding Tax"].includes(t.type)).reduce((a, t) => a + Math.abs(t.net ?? t.gross ?? 0) * (t.fxRate ?? 1), 0);
        // Closing per books
        const booksClosing   = group.positions.reduce((a, p) => a + p.perScheduleCost, 0);

        // Broker statement values (mock: same except AAPL FMV variance)
        const stmtOpening   = booksOpening;
        const stmtPurchases = booksPurchases;
        const stmtSales     = booksSales;
        const stmtIncome    = booksIncome;
        const stmtExpenses  = booksExpenses;
        const stmtClosing   = group.positions.reduce((a, p) => a + p.perStmtCost, 0);

        const closingVar = booksClosing - stmtClosing;
        const reconciled = Math.abs(closingVar) < 1;

        // ── Roll-forward lines ─────────────────────────────────────────────
        const lines = [
          { label: "Opening Balance",   books: booksOpening,    stmt: stmtOpening,    indent: false, bold: false, separator: false },
          { label: "Purchases",         books: booksPurchases,  stmt: stmtPurchases,  indent: true,  bold: false, separator: false },
          { label: "Sales / Disposals", books: -booksSales,     stmt: -stmtSales,     indent: true,  bold: false, separator: false },
          { label: "Income Received",   books: booksIncome,     stmt: stmtIncome,     indent: true,  bold: false, separator: false },
          { label: "Expenses & Fees",   books: -booksExpenses,  stmt: -stmtExpenses,  indent: true,  bold: false, separator: true  },
          { label: "Closing Balance",   books: booksClosing,    stmt: stmtClosing,    indent: false, bold: true,  separator: false },
        ];

        // ── Detailed activity transactions ─────────────────────────────────
        const purchaseTxns = effectiveTxns.filter(t => t.sourceId === group.sourceId && ["Purchase","Transfer In"].includes(t.type));
        const saleTxns     = effectiveTxns.filter(t => t.sourceId === group.sourceId && ["Sale","Transfer Out"].includes(t.type));
        const dividendTxns = effectiveTxns.filter(t => t.sourceId === group.sourceId && ["Dividend","Reinvested Dividend"].includes(t.type));
        const interestTxns = effectiveTxns.filter(t => t.sourceId === group.sourceId && t.type === "Interest");
        const feeTxns      = effectiveTxns.filter(t => t.sourceId === group.sourceId && ["Fee/Commission","Withholding Tax"].includes(t.type));

        // ── FX differences ─────────────────────────────────────────────────
        const fxRows = mockFxRates.filter(r => r.ccy !== "CAD");
        const fxImpact = brokerScheds
          .filter(s => s.currency !== "CAD")
          .map(s => {
            const rate = fxRows.find(r => r.ccy === s.currency);
            if (!rate) return null;
            const openCostCAD = s.rows.filter(r => r.type === "Opening Balance").reduce((a, r) => a + r.costIn, 0);
            const openCostForeign = openCostCAD / rate.opening;
            const fxDiff = openCostForeign * (rate.closing - rate.opening);
            return { security: s.security, ticker: s.ticker, ccy: s.currency, openRate: rate.opening, closeRate: rate.closing, openCostForeign, fxDiff };
          }).filter(Boolean) as { security: string; ticker: string; ccy: string; openRate: number; closeRate: number; openCostForeign: number; fxDiff: number }[];
        const totalFxDiff = fxImpact.reduce((a, r) => a + r.fxDiff, 0);

        // ── Closing balance per books ──────────────────────────────────────
        const booksClosingPerBooks = booksOpening + booksPurchases - booksSales + booksIncome - booksExpenses + totalFxDiff;

        // Reusable activity sub-table
        const ActivityTable = ({ txns, sign }: { txns: typeof effectiveTxns; sign: 1 | -1 }) => {
          if (!txns.length) return <p className="px-4 py-2 text-base text-muted-foreground italic">No transactions in period</p>;
          const total = txns.reduce((a, t) => a + Math.abs((t.net ?? t.gross ?? 0) * (t.fxRate ?? 1)), 0);
          return (
            <table className="w-full text-base">
              <thead>
                <tr className="bg-muted/10 border-b border-border">
                  {["Date","Security","Ticker","Type","CCY","Foreign Amt","FX Rate","CAD Equiv"].map((h, i) => (
                    <th key={h} className={`px-3 py-1.5 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${i < 4 ? "text-left" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txns.map((t, i) => {
                  const cadAmt = Math.abs((t.net ?? t.gross ?? 0) * (t.fxRate ?? 1));
                  const foreignAmt = Math.abs(t.net ?? t.gross ?? 0);
                  return (
                    <tr key={t.id} className={`border-b border-border/40 ${i % 2 === 1 ? "bg-muted/[0.04]" : ""}`}>
                      <td className="px-3 py-1 whitespace-nowrap text-muted-foreground">{fmtDate(t.date)}</td>
                      <td className="px-3 py-1 font-medium">{t.security}</td>
                      <td className="px-3 py-1 font-mono">{t.ticker}</td>
                      <td className="px-3 py-1">
                        <TxTypeBadge type={t.type} />
                      </td>
                      <td className="px-3 py-1">{t.currency}</td>
                      <td className="px-3 py-1 text-right tabular-nums">{fmtCAD(foreignAmt)}</td>
                      <td className="px-3 py-1 text-right tabular-nums font-mono text-muted-foreground">{fmt4(t.fxRate ?? 1)}</td>
                      <td className="px-3 py-1 text-right tabular-nums font-medium">{sign > 0 ? "" : "("}{fmtCAD(cadAmt)}{sign > 0 ? "" : ")"}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 border-t border-border font-semibold">
                  <td className="px-3 py-1.5 text-base" colSpan={7}>{sign > 0 ? "Total" : "Total"}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-base font-bold">{sign > 0 ? "" : "("}{fmtCAD(total)}{sign > 0 ? "" : ")"}</td>
                </tr>
              </tfoot>
            </table>
          );
        };

        return (
          <div key={group.sourceId} className="rounded-[8px] border-2 border-border overflow-hidden">

            {/* ── Broker Header — single inline row ── */}
            <div className="px-4 py-2.5 bg-muted/50 border-b-2 border-border flex items-center gap-3 flex-wrap">
              {/* #N tag */}
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-base font-bold uppercase tracking-wider border bg-background text-muted-foreground border-border shrink-0">
                #{groupIdx + 1}/{invRecon.length}
              </span>
              {/* Institution */}
              <span className="text-base font-bold text-foreground shrink-0">{group.institution}</span>
              <span className="text-base text-muted-foreground font-mono bg-background border border-border px-1.5 py-0.5 rounded-[4px] shrink-0">…{group.last4}</span>
              {/* Status */}
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-base font-semibold border whitespace-nowrap shrink-0 ${reconciled ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                {reconciled ? "✓ Reconciled" : "⚠ Variance"}
              </span>
              {/* Divider */}
              <span className="text-border">|</span>
              {/* Meta */}
              <span className="text-base text-muted-foreground shrink-0">CCY: <strong className="text-foreground">{group.currency}</strong></span>
              <span className="text-base text-muted-foreground shrink-0">Period: <strong className="text-foreground">{yearStart} — {yearEnd}</strong></span>
              <span className="text-base text-muted-foreground shrink-0">Annual · FY {fiscalYear}</span>
              {/* Divider */}
              <span className="text-border">|</span>
              {/* KPIs inline */}
              {[
                { label: "Opening",  val: booksOpening },
                { label: "Closing",  val: booksClosingPerBooks },
                { label: "Variance", val: Math.abs(closingVar) },
              ].map((k, ki) => (
                <span key={k.label} className="inline-flex items-center gap-1 text-base shrink-0">
                  {ki > 0 && <span className="text-border/50">·</span>}
                  <span className="text-muted-foreground">{k.label}:</span>
                  <span className="font-bold tabular-nums text-foreground">{fmtCAD(k.val)}</span>
                </span>
              ))}
            </div>

            {/* ── Section 1: Opening Balance ── */}
            <SectionHead title="Opening Balance" />
            <div className="w-full overflow-x-auto">
              <table className="w-full text-base">
                <tbody>
                  <tr className="border-b border-border/40 bg-amber-50/40">
                    <td className="px-4 py-2 font-semibold text-foreground w-64">Opening Balance — Jan 1</td>
                    <td className="px-4 py-2 text-right tabular-nums font-bold">{fmtCAD(booksOpening)}</td>
                    <td className="px-4 py-2 text-base text-muted-foreground">Per prior year WAC schedule</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── Section 2: Activity During the Period — single unified table ── */}
            <SectionHead title="Activity During the Period" />
            <div className="overflow-x-auto border-b border-border/40">
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-muted/20 border-b-2 border-border">
                    {["Date","Security","Ticker","Type","CCY","Foreign Amt","FX Rate","CAD Equiv"].map((h, i) => (
                      <th key={h} className={`px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${i < 4 ? "text-left" : "text-right"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Purchases",                    txns: purchaseTxns,  sign:  1 as const, subtotal: booksPurchases,  bg: "bg-blue-50/20"   },
                    { label: "Sales / Disposals",            txns: saleTxns,      sign: -1 as const, subtotal: -booksSales,     bg: "bg-red-50/20"    },
                    { label: "Income — Dividends",           txns: dividendTxns,  sign:  1 as const, subtotal: dividendTxns.reduce((a,t) => a+(t.gross??0)*(t.fxRate??1),0), bg: "bg-green-50/20" },
                    ...(interestTxns.length > 0 ? [{ label: "Income — Interest", txns: interestTxns, sign: 1 as const, subtotal: interestTxns.reduce((a,t) => a+(t.gross??0)*(t.fxRate??1),0), bg: "bg-green-50/10" }] : []),
                    { label: "Expenses (Fees & Withholding Tax)", txns: feeTxns,  sign: -1 as const, subtotal: -booksExpenses,  bg: "bg-orange-50/20" },
                  ].map(group2 => (
                    <Fragment key={group2.label}>
                      {/* Category group header row */}
                      <tr className={`border-b border-border/30 ${group2.bg}`}>
                        <td className="px-3 py-1.5 text-base font-bold text-foreground" colSpan={7}>
                          {group2.label}
                          <span className="ml-2 text-base font-normal text-muted-foreground">({group2.txns.length} transaction{group2.txns.length !== 1 ? "s" : ""})</span>
                        </td>
                        <td className="px-3 py-1.5 text-right text-base font-bold tabular-nums">
                          {group2.subtotal < 0 ? `(${fmtCAD(Math.abs(group2.subtotal))})` : fmtCAD(group2.subtotal)}
                        </td>
                      </tr>
                      {/* Transaction rows */}
                      {group2.txns.length === 0
                        ? <tr className="border-b border-border/20"><td colSpan={8} className="px-3 py-1.5 text-base text-muted-foreground italic pl-6">No transactions</td></tr>
                        : group2.txns.map((t, i) => {
                            const cadAmt = Math.abs((t.net ?? t.gross ?? 0) * (t.fxRate ?? 1));
                            return (
                              <tr key={t.id} className={`border-b border-border/30 ${i % 2 === 0 ? "" : "bg-muted/[0.03]"}`}>
                                <td className="px-3 py-1 pl-6 whitespace-nowrap text-muted-foreground">{fmtDate(t.date)}</td>
                                <td className="px-3 py-1 font-medium">{t.security}</td>
                                <td className="px-3 py-1 font-mono">{t.ticker}</td>
                                <td className="px-3 py-1"><TxTypeBadge type={t.type} /></td>
                                <td className="px-3 py-1">{t.currency}</td>
                                <td className="px-3 py-1 text-right tabular-nums">{fmtCAD(Math.abs(t.net ?? t.gross ?? 0))}</td>
                                <td className="px-3 py-1 text-right tabular-nums font-mono text-muted-foreground">{fmt4(t.fxRate ?? 1)}</td>
                                <td className="px-3 py-1 text-right tabular-nums">{group2.sign < 0 ? `(${fmtCAD(cadAmt)})` : fmtCAD(cadAmt)}</td>
                              </tr>
                            );
                          })
                      }
                    </Fragment>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30 border-t-2 border-border font-semibold">
                    <td className="px-3 py-2 text-base" colSpan={7}>Net Activity</td>
                    <td className="px-3 py-2 text-right tabular-nums text-base font-bold">
                      {fmtCAD(booksPurchases - booksSales + booksIncome - booksExpenses)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ── Section 3: FX Differences ── */}
            {fxImpact.length > 0 && (
              <>
                <SectionHead title="Foreign Exchange Differences" />
                <div className="overflow-x-auto border-b border-border/40">
                  <table className="w-full text-base">
                    <thead>
                      <tr className="bg-muted/10 border-b border-border">
                        {["Security","Ticker","CCY","Opening FX","Closing FX","FX Change","Opening Cost (Foreign)","FX Translation Diff"].map((h, i) => (
                          <th key={h} className={`px-3 py-1.5 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${i < 3 ? "text-left" : "text-right"}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fxImpact.map((r, i) => (
                        <tr key={r.ticker} className={`border-b border-border/40 ${i % 2 === 1 ? "bg-muted/[0.04]" : ""}`}>
                          <td className="px-3 py-1.5 font-medium">{r.security}</td>
                          <td className="px-3 py-1.5 font-mono">{r.ticker}</td>
                          <td className="px-3 py-1.5">{r.ccy}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums font-mono">{fmt4(r.openRate)}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums font-mono">{fmt4(r.closeRate)}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums font-mono">{fmt4(r.closeRate - r.openRate)}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums">{fmtCAD(r.openCostForeign)}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums font-semibold">{r.fxDiff >= 0 ? "" : "("}{fmtCAD(Math.abs(r.fxDiff))}{r.fxDiff >= 0 ? "" : ")"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/30 border-t border-border font-semibold">
                        <td className="px-3 py-2 text-base" colSpan={7}>Total FX Translation Difference</td>
                        <td className="px-3 py-2 text-right tabular-nums text-base font-bold">{totalFxDiff >= 0 ? "" : "("}{fmtCAD(Math.abs(totalFxDiff))}{totalFxDiff >= 0 ? "" : ")"}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}

            {/* ── Section 4: Closing Balance ── */}
            <SectionHead title="Closing Balances" />
            <div className="w-full overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-muted/20 border-b border-border">
                    <th className="px-4 py-2 text-left text-base font-semibold text-muted-foreground uppercase tracking-wide w-64">Item</th>
                    <th className="px-4 py-2 text-right text-base font-semibold text-muted-foreground uppercase tracking-wide">Per Books (CAD)</th>
                    <th className="px-4 py-2 text-right text-base font-semibold text-muted-foreground uppercase tracking-wide">Per Broker Stmt</th>
                    <th className="px-4 py-2 text-right text-base font-semibold text-muted-foreground uppercase tracking-wide">Variance</th>
                    <th className="px-4 py-2 text-center text-base font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Opening Balance",        books: booksOpening,         stmt: booksOpening,                         indent: false },
                    { label: "+ Purchases",            books: booksPurchases,        stmt: booksPurchases,                       indent: true  },
                    { label: "− Sales / Disposals",    books: -booksSales,           stmt: -booksSales,                          indent: true  },
                    { label: "+ Income (Div/Int)",     books: booksIncome,           stmt: booksIncome,                          indent: true  },
                    { label: "− Expenses & Fees",      books: -booksExpenses,        stmt: -booksExpenses,                       indent: true  },
                    { label: "+ FX Translation",       books: totalFxDiff,           stmt: totalFxDiff,                          indent: true  },
                    { label: "Closing Balance",        books: booksClosingPerBooks,  stmt: stmtClosing,                          indent: false },
                  ].map((l, i) => {
                    const variance = l.books - l.stmt;
                    const ok = Math.abs(variance) < 1;
                    const isFinal = l.label === "Closing Balance";
                    return (
                      <tr key={l.label} className={`border-b border-border/40 ${isFinal ? "bg-primary/5 font-semibold" : i % 2 === 0 ? "" : "bg-muted/[0.04]"}`}>
                        <td className={`px-4 py-2 ${l.indent ? "pl-8 text-muted-foreground" : "font-semibold text-foreground"}`}>{l.label}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{fmtCAD(Math.abs(l.books))}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{fmtCAD(Math.abs(l.stmt))}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{fmtCAD(Math.abs(variance))}</td>
                        <td className="px-4 py-2 text-center">
                          {isFinal && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-base font-semibold border whitespace-nowrap ${ok ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                              {ok ? "✓ Reconciled" : "✗ Variance"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Section 5: Closing Position Detail ── */}
            <SectionHead title="Closing Position Detail — Per Security" />
            <div className="w-full overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-muted/10 border-b border-border">
                    {["Security","Ticker","CCY","Units (Books)","Units (Broker)","Cost (Books)","Cost (Broker)","Variance","Status"].map((h, i) => (
                      <th key={h} className={`px-3 py-1.5 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${i < 3 ? "text-left" : i === 8 ? "text-center" : "text-right"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.positions.map((p, i) => (
                    <tr key={p.ticker} className={`border-b border-border/40 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                      <td className="px-3 py-1.5 font-medium">{p.security}</td>
                      <td className="px-3 py-1.5 font-mono">{p.ticker}</td>
                      <td className="px-3 py-1.5">{p.ccy}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{fmtNum(p.perScheduleUnits, 4)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{fmtNum(p.perStmtUnits, 4)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{fmtCAD(p.perScheduleCost)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{fmtCAD(p.perStmtCost)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-medium">{fmtCAD(Math.abs(p.varianceCost))}</td>
                      <td className="px-3 py-1.5 text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-base font-semibold border whitespace-nowrap ${p.pass ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                          {p.pass ? "✓" : "✗"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30 border-t border-border font-semibold">
                    <td className="px-3 py-2 text-base" colSpan={5}>Total Closing Positions</td>
                    <td className="px-3 py-2 text-right tabular-nums text-base">{fmtCAD(group.positions.reduce((a, p) => a + p.perScheduleCost, 0))}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-base">{fmtCAD(group.positions.reduce((a, p) => a + p.perStmtCost, 0))}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-base font-bold">{fmtCAD(Math.abs(closingVar))}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-base font-semibold border whitespace-nowrap ${reconciled ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                        {reconciled ? "✓ Reconciled" : "✗ Variance"}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

          </div>
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
      <table className="w-full text-base">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            {["Security","Ticker","Date","Units","Proceeds","Book ACB","Book G/L","Tax ACB","Tax G/L","Adj Type",""].map((h, i) => (
              <th key={i} className={`px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${i < 3 ? "text-left" : "text-right"} ${i === 10 ? "text-right" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {disposals.length === 0 && (
            <tr><td colSpan={11} className="px-3 py-4 text-center text-base text-muted-foreground">No disposals</td></tr>
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
                        <span className="text-base text-muted-foreground shrink-0">Tax ACB:</span>
                        <input type="number" step="0.01" value={editDraft.taxACB} onChange={e => setEditDraft(p => ({ ...p, taxACB: parseFloat(e.target.value) || 0 }))} className={`${IC} w-32`} />
                        <span className="text-base text-muted-foreground shrink-0">Adj Type:</span>
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
        className="input-double-border h-8 w-full pl-2 pr-7 text-base border border-[#dcdfe4] rounded-[8px] bg-white dark:bg-card text-transparent appearance-none focus:outline-none"
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">— Select —</option>
        {CHART_OF_ACCOUNTS.map(a => (
          <option key={a.code} value={`${a.code} · ${a.name}`}>{a.code} · {a.name}</option>
        ))}
      </select>
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-base font-mono text-foreground pointer-events-none select-none">
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
        <span className="text-base font-semibold text-primary uppercase tracking-wide">New Adjusting Entry</span>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
      </div>
      {/* Top fields row */}
      <div className="px-4 pt-3 pb-2 grid grid-cols-4 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Ref</label>
          <input value={d.ref} onChange={e => set("ref", e.target.value)} className={IC} placeholder="AE-01" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Type</label>
          <select value={d.type} onChange={e => set("type", e.target.value)} className={SC}>
            {AJE_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Confidence</label>
          <select value={d.confidence} onChange={e => set("confidence", e.target.value)} className={SC}>
            {AJE_CONF_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Amount</label>
          <input type="number" step="0.01" value={d.amount || ""} onChange={e => set("amount", parseFloat(e.target.value) || 0)} className={IC} placeholder="0.00" />
        </div>
      </div>
      <div className="px-4 pb-2">
        <label className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
        <input value={d.description} onChange={e => set("description", e.target.value)} className={`${IC} mt-1 w-full`} placeholder="Describe this entry…" />
      </div>
      {/* DR / CR lines */}
      <div className="border-t border-border/60">
        <table className="w-full text-base">
          <thead>
            <tr className="bg-muted/40">
              {["Acc No.","Description","Debit","Credit"].map((h, i) => (
                <th key={h} className={`px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wider ${i >= 2 ? "text-right w-32" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/40">
              <td className="px-3 py-2 w-36"><JEAccountSelect value={d.drAccount} onChange={v => set("drAccount", v)} /></td>
              <td className="px-3 py-2"><input value={d.drDescription} onChange={e => set("drDescription", e.target.value)} className={IC} placeholder="Line description…" /></td>
              <td className="px-3 py-2 w-32"><input type="number" step="0.01" value={d.amount || ""} onChange={e => set("amount", parseFloat(e.target.value) || 0)} className={`${IC} text-right`} /></td>
              <td className="px-3 py-2 w-32"><div className="h-7 flex items-center justify-end px-2 rounded-md border border-border/40 bg-muted/30 text-base text-muted-foreground">0.00</div></td>
            </tr>
            <tr>
              <td className="px-3 py-2 w-36"><JEAccountSelect value={d.crAccount} onChange={v => set("crAccount", v)} /></td>
              <td className="px-3 py-2"><input value={d.crDescription} onChange={e => set("crDescription", e.target.value)} className={IC} placeholder="Line description…" /></td>
              <td className="px-3 py-2 w-32"><div className="h-7 flex items-center justify-end px-2 rounded-md border border-border/40 bg-muted/30 text-base text-muted-foreground">0.00</div></td>
              <td className="px-3 py-2 w-32"><div className="h-7 flex items-center justify-end px-2 rounded-md border border-[#dcdfe4] bg-muted/20 text-base tabular-nums text-foreground">{fmt2(d.amount)}</div></td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Notes */}
      <div className="px-4 py-3 border-t border-border/60">
        <label className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
        <textarea rows={2} value={d.notes} onChange={e => set("notes", e.target.value)}
          className="mt-1 w-full h-14 text-base px-2 py-1.5 border border-border rounded-md bg-background resize-none focus:outline-none"
          placeholder="Add a note…" />
      </div>
      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border/60 bg-muted/20 flex justify-end gap-2">
        <button onClick={onCancel} className="h-7 px-3 text-base border border-border rounded-[7px] text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
        <button onClick={() => onSave({ ...d, _id: `aje-local-${Date.now()}` })}
          className="h-7 px-3 text-base bg-primary text-primary-foreground rounded-[7px] hover:bg-primary/90 transition-colors">
          Save Entry
        </button>
      </div>
    </div>
  );
}

function AJEsPanel({ ajes, ajeQueue, clearAjeQueue, editMode }: {
  ajes: AJE[];
  ajeQueue: LocalInvJE[];
  clearAjeQueue: () => void;
  editMode?: boolean;
}) {
  const [localJEs, setLocalJEs] = useState<LocalInvJE[]>(() => ajes.map((a, i) => makeLocalJE(a, i)));
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(ajes.map((_, i) => `aje-init-${i}`))
  );
  const [filterStatus, setFilterStatus] = useState<"All" | AJEStatus | "Deleted">("All");
  const [filterType,   setFilterType]   = useState<"All" | AJE["type"]>("All");
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

  const TYPE_LABELS: Record<AJE["type"], string> = {
    "Disposition":     "Realized G/L",
    "Fair Value Adj":  "Unrealized G/L",
    "Accrual":         "Income & Expenses",
    "FX Adj":          "FX Entries",
    "Reclassification":"Reclassification",
    "Correcting":      "Correcting",
  };
  const typeCounts = (list: LocalInvJE[]) =>
    (Object.keys(TYPE_LABELS) as AJE["type"][]).reduce((acc, t) => {
      acc[t] = list.filter(j => j.type === t).length;
      return acc;
    }, {} as Record<AJE["type"], number>);
  const tCounts = typeCounts(active);

  const filtered = (filterStatus === "Deleted" ? deleted : active.filter(j => filterStatus === "All" || j.status === filterStatus))
    .filter(j => filterType === "All" || j.type === filterType);

  return (
    <div className="space-y-3">

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Status filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-base text-muted-foreground shrink-0">View:</span>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
              className="h-7 pl-2.5 pr-7 text-base font-medium border border-border rounded-[7px] bg-background text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/40 hover:border-primary/40 transition-colors"
            >
              <option value="All">All ({active.length})</option>
              <option value="Draft">Draft ({draftCnt})</option>
              <option value="Approved">Approved ({approvedCnt})</option>
              <option value="Posted">Posted ({postedCnt})</option>
              <option value="Deleted">Deleted ({deleted.length})</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          </div>
        </div>
        {/* Type filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-base text-muted-foreground shrink-0">Type:</span>
          <div className="relative">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as typeof filterType)}
              className="h-7 pl-2.5 pr-7 text-base font-medium border border-border rounded-[7px] bg-background text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/40 hover:border-primary/40 transition-colors"
            >
              <option value="All">All types</option>
              {(Object.entries(TYPE_LABELS) as [AJE["type"], string][]).map(([k, label]) =>
                tCounts[k] > 0 ? <option key={k} value={k}>{label} ({tCounts[k]})</option> : null
              )}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          </div>
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
                  <span className="text-base text-muted-foreground font-mono shrink-0">{je.ref.toUpperCase()}</span>
                  <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-base font-semibold text-foreground shrink-0">{je.type}</span>
                  <span className="text-base text-muted-foreground truncate">{je.description}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`inline-flex items-center gap-1 text-base font-semibold px-1.5 py-0.5 rounded-full border ${statusCls}`}>
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
                  <table className="w-full text-base border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="py-2 px-3 text-base font-semibold text-muted-foreground uppercase tracking-wide text-left whitespace-nowrap">Acc No.</th>
                        <th className="py-2 px-3 text-base font-semibold text-muted-foreground uppercase tracking-wide text-left">Description</th>
                        <th className="py-2 px-3 text-base font-semibold text-muted-foreground uppercase tracking-wide text-right">Debit</th>
                        <th className="py-2 px-3 text-base font-semibold text-muted-foreground uppercase tracking-wide text-right">Credit</th>
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
                        <td className="py-1.5 px-3 w-24"><div className="h-7 flex items-center justify-end px-2 rounded-[6px] border border-border/40 bg-muted/30 text-base text-muted-foreground">0.00</div></td>
                      </tr>
                      {/* CR line */}
                      <tr className="hover:bg-muted/20">
                        <td className="py-1.5 px-3"><JEAccountSelect value={je.crAccount} disabled={je.deleted} onChange={v => updateJE(je._id, { crAccount: v })} /></td>
                        <td className="py-1.5 px-3"><input className={IC} value={je.crDescription} disabled={je.deleted} onChange={e => updateJE(je._id, { crDescription: e.target.value })} placeholder="Line description…" /></td>
                        <td className="py-1.5 px-3"><div className="h-7 flex items-center justify-end px-2 rounded-[6px] border border-border/40 bg-muted/30 text-base text-muted-foreground">0.00</div></td>
                        <td className="py-1.5 px-3"><div className="h-7 flex items-center justify-end px-2 rounded-[6px] border border-[#dcdfe4] bg-muted/20 text-base tabular-nums text-foreground">{fmt2(je.amount)}</div></td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-muted/30 font-semibold text-base">
                        <td className="py-2 px-3 text-foreground" colSpan={2}>Total</td>
                        <td className="py-2 px-3 text-right tabular-nums">{fmt2(je.amount)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{fmt2(je.amount)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Notes */}
                  <div className="px-3 py-2.5 border-t border-border bg-background">
                    <label className="block text-base font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</label>
                    <textarea rows={2} className="w-full text-base px-2.5 py-2 rounded-[6px] border border-[#dcdfe4] bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
                      placeholder="Add a note for this entry…"
                      value={je.notes}
                      disabled={je.deleted}
                      onChange={e => updateJE(je._id, { notes: e.target.value })} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 px-3 py-2.5 border-t border-border bg-muted/20">
                    {je.deleted ? (
                      <>
                        <span className="text-base text-muted-foreground italic flex-1">Deleted</span>
                        <button onClick={() => restoreJE(je._id)}
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[6px] border border-border bg-background text-base font-medium text-foreground hover:bg-muted transition-colors">
                          <RotateCcw className="h-3 w-3" /> Restore
                        </button>
                        <button onClick={() => purgeJE(je._id)}
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[6px] border border-red-200 bg-background text-base font-medium text-red-500 hover:text-red-700 hover:border-red-300 transition-colors">
                          <Trash2 className="h-3 w-3" /> Delete Permanently
                        </button>
                      </>
                    ) : (
                      <>
                        {je.status !== "Posted" && (
                          <button onClick={() => updateJE(je._id, { status: "Posted" })}
                            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[6px] bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 transition-colors">
                            <Send className="h-3 w-3" /> Post
                          </button>
                        )}
                        <button onClick={() => softDelete(je._id)}
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[6px] border border-red-200 bg-background text-base font-medium text-red-500 hover:text-red-700 hover:border-red-300 transition-colors">
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
          <p className="text-center py-8 text-base text-muted-foreground">No journal entries match the filter</p>
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
      <table className="w-full text-base">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            {["Security","Ticker","CCY","Units","WAC","Cost CAD","FMV CAD","Unrealized G/L","G/L %"].map((h, i) => (
              <th key={h} className={`px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${i < 3 ? "text-left" : "text-right"}`}>{h}</th>
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
                <td className={`px-3 py-1.5 text-right tabular-nums ${"text-foreground"}`}>
                  {glPct >= 0 ? `${fmt2(glPct)}%` : `(${fmt2(Math.abs(glPct))}%)`}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-muted/30 border-t border-border font-semibold">
            <td className="px-3 py-2 text-base" colSpan={5}>Total</td>
            <td className="px-3 py-2 text-right tabular-nums text-base font-bold">{fmt(totCost)}</td>
            <td className="px-3 py-2 text-right tabular-nums text-base font-bold">{fmt(totFMV)}</td>
            <td className="px-3 py-2 text-right text-base font-bold">{fmtGL(totUnrealized)}</td>
            <td className="px-3 py-2" />
          </tr>
        </tfoot>
      </table>
    </TableWrap>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function InvestmentScheduleResponse({ onEditTransactions, initialTransactions, engagementYearEnd }: { onEditTransactions?: () => void; initialTransactions?: import("@/lib/luka/types").Transaction[]; engagementYearEnd?: string } = {}) {
  const settings = useStore(s => s.settings);
  const [activeTab, setActiveTab] = useState<TabId>("wac");
  const [invMode, setInvMode] = useState<"view" | "edit" | "add">("view");
  const [pendingTxns, setPendingTxns] = useState<InvAddRow[]>([]);
  const [addUploading, setAddUploading] = useState(false);
  const [addUploadedFiles, setAddUploadedFiles] = useState<Array<{id:string; name:string; ext:string}>>([]);
  const [isRerunning, setIsRerunning] = useState(false);
  const addFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (invMode !== "add") setAddUploadedFiles([]); }, [invMode]);

  const client  = settings.client || "this engagement";
  // engagementYearEnd is already a display string ("May 31, 2024"); use it directly.
  // settings.fiscalYearEnd is ISO ("2024-12-31") and needs fmtDate.
  const dateStr = engagementYearEnd
    ? engagementYearEnd
    : settings.fiscalYearEnd ? fmtDate(settings.fiscalYearEnd.slice(0, 10)) : "—";

  // ── Compute options ────────────────────────────────────────────────────────
  const [opts] = useState<ComputeOptions>({
    includePriorYear:  true,
    trackByBroker:     false,
    measurementBasis:  "FVTPL",
  });

  // ── Prior-year lots ────────────────────────────────────────────────────────
  const [importedLots] = useState<PriorYearLot[] | null>(null);
  // When real uploaded transactions are provided, use no prior-year mock lots —
  // the uploaded transactions are the complete source of truth for this workpaper.
  const effectivePY = useMemo(
    () => (initialTransactions && initialTransactions.length > 0)
      ? (importedLots ?? [])       // real data: start fresh — no mock prior-year positions
      : (importedLots ?? priorYearLots), // demo mode: use mock prior-year data
    [importedLots, initialTransactions]
  );

  // ── Transaction state ──────────────────────────────────────────────────────
  const [importedTxnsBySource] = useState<Record<string, Transaction[]>>({});
  const [plaidSources]         = useState<Source[]>([]);
  const [plaidTxns]            = useState<Transaction[]>([]);
  const [hiddenTxIds,  setHiddenTxIds]  = useState<Set<string>>(new Set());
  const [manualTxns,   setManualTxns]   = useState<Transaction[]>([]);
  // Populate from parent-submitted transactions (uploaded PDF data)
  useEffect(() => {
    if (initialTransactions && initialTransactions.length > 0) {
      setManualTxns(initialTransactions);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [txEdits,      setTxEdits]      = useState<Record<string, Partial<Transaction>>>({});

  const allInvSources = useMemo(() => [...baseSources, ...plaidSources], [plaidSources]);

  const baseTxns = useMemo(() => {
    // When real uploaded transactions are provided via prop, use ONLY those — exclude mock defaults
    if (manualTxns.length > 0 && initialTransactions && initialTransactions.length > 0) {
      return manualTxns.filter(t => !hiddenTxIds.has(t.id));
    }
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
  }, [importedTxnsBySource, plaidTxns, hiddenTxIds, manualTxns, initialTransactions]);

  const effectiveTxns = useMemo(
    () => baseTxns.map(t => ({ ...t, ...txEdits[t.id] })),
    [baseTxns, txEdits],
  );

  // ── AJE push queue ─────────────────────────────────────────────────────────
  const [ajeQueue, setAjeQueue] = useState<LocalInvJE[]>([]);
  const clearAjeQueue = useCallback(() => setAjeQueue([]), []);

  // ── Save-to-Engagement flow ────────────────────────────────────────────────
  type SaveFlowStep = "closed" | "doc-type" | "engagement" | "saving" | "saved";
  const [saveFlowStep,  setSaveFlowStep]  = useState<SaveFlowStep>("closed");
  const [saveDocType,   setSaveDocType]   = useState<string | null>(null);
  const [engSearch,     setEngSearch]     = useState("");
  const [selectedEngId, setSelectedEngId] = useState<string | null>(null);
  const [saveMenuRect,  setSaveMenuRect]  = useState<DOMRect | null>(null);
  const [engPanelRect,  setEngPanelRect]  = useState<{ left: number; right: number; bottom: number } | null>(null);
  const saveBtnRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const active = saveFlowStep === "engagement" || saveFlowStep === "saving" || saveFlowStep === "saved";
    if (!active) { setEngPanelRect(null); return; }
    const el = document.querySelector(".luka-gradient-border") as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setEngPanelRect({ left: r.left, right: window.innerWidth - r.right, bottom: window.innerHeight - r.top + 8 });
  }, [saveFlowStep]);

  const openSaveFlow = () => {
    setSaveDocType(null); setSelectedEngId(null); setEngSearch("");
    setSaveFlowStep("doc-type");
    setSaveMenuRect(saveBtnRef.current?.getBoundingClientRect() ?? null);
  };
  const closeSaveFlow = () => { setSaveFlowStep("closed"); setSaveMenuRect(null); setEngPanelRect(null); };

  const DOC_TYPES = [
    { id: "workpaper",  label: "Investment Schedule Workpaper", icon: FileSpreadsheet, desc: "Full workpaper with all tabs"   },
    { id: "pdf-report", label: "PDF Report",                    icon: FileText,        desc: "Printable summary report"       },
    { id: "excel",      label: "Excel Package",                 icon: FileSpreadsheet, desc: "Downloadable .xlsx bundle"      },
    { id: "note",       label: "Financial Statement Note",      icon: FileCheck,       desc: "Investment note disclosure only"},
  ];

  const MOCK_ENGAGEMENTS = [
    { id: "COM-DEE-May312026",  client: "deepak corp",        engId: "COM-DEE-May312026",  yearEnd: "May 31, 2026",  status: "New",         created: "May 28, 2026 02:13 AM" },
    { id: "COM-GIG-Feb282026",  client: "Giggle & Goods Inc", engId: "COM-GIG-Feb282026",  yearEnd: "Feb 28, 2026",  status: "New",         created: "May 26, 2026 12:40 PM" },
    { id: "COM-GIG-Apr302026",  client: "Giggle & Goods Inc", engId: "COM-GIG-Apr302026",  yearEnd: "Apr 30, 2026",  status: "New",         created: "May 26, 2026 12:45 PM" },
    { id: "COM-TES-Dec312024",  client: "Test123",            engId: "COM-TES-Dec312024",  yearEnd: "Dec 31, 2024",  status: "In Progress", created: "May 19, 2026 03:23 AM" },
    { id: "COM-FAL-May312025",  client: "Falah LUKA Testing", engId: "COM-FAL-May312025",  yearEnd: "May 31, 2025",  status: "In Progress", created: "May 20, 2026 10:02 AM" },
    { id: "COM-DEE-May302026",  client: "Deepak Pharma",      engId: "COM-DEE-May302026",  yearEnd: "May 30, 2026",  status: "New",         created: "May 22, 2026 02:25 AM" },
    { id: "COM-KAU-Dec312024",  client: "Kaushal CORP",       engId: "COM-KAU-Dec312024",  yearEnd: "Dec 31, 2024",  status: "In Progress", created: "May 18, 2026 03:20 AM" },
    { id: "REV-HAI-Sep132025",  client: "Haider",             engId: "REV-HAI-Sep132025",  yearEnd: "Sep 13, 2025",  status: "New",         created: "Jul 17, 2025 07:53 AM" },
  ];


  // ── Edit/Add mode helpers ─────────────────────────────────────────────────
  const discardMode = () => { setInvMode("view"); setTxEdits({}); setPendingTxns([]); };
  const canSubmitEdit = true; // edit mode covers all panels, not just txEdits
  const canSubmitAdd = pendingTxns.length > 0 && pendingTxns.every(r => INV_ADD_REQUIRED.every(f => !invAddRowMissing(r, f)));
  const triggerRerun = () => { setIsRerunning(true); setTimeout(() => setIsRerunning(false), 2600); };

  const submitEdits = () => {
    discardMode();
    triggerRerun();
    toast.success(`Transactions updated · re-running analysis…`);
  };

  const submitAdd = () => {
    const valid = pendingTxns.filter(r => r.security?.trim() && r.date?.trim());
    if (!valid.length) { toast.error("Add at least one transaction"); return; }
    valid.forEach(r => {
      const tx: Transaction = {
        id: r.id,
        sourceId: r.broker || "manual",
        date: r.date,
        settlementDate: r.settlement || undefined,
        security: r.security,
        ticker: r.ticker,
        type: r.type as Transaction["type"],
        units: parseFloat(r.qty) || 0,
        price: parseFloat(r.price) || 0,
        gross: (parseFloat(r.qty) || 0) * (parseFloat(r.price) || 0),
        fees: 0,
        net: (parseFloat(r.qty) || 0) * (parseFloat(r.price) || 0),
        currency: r.ccy as Transaction["currency"],
        fxRate: parseFloat(r.fxRate) || 1,
        status: r.status as Transaction["status"],
        tbAccount: r.tbAccount || defaultTbAccount(r.type as Transaction["type"]),
      };
      setManualTxns(prev => [...prev, tx]);
    });
    discardMode();
    triggerRerun();
    toast.success(`${valid.length} transaction${valid.length !== 1 ? "s" : ""} added · re-running analysis…`);
  };

  const handleAddUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    setAddUploadedFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...arr.filter(f => !existing.has(f.name)).map(f => ({
        id: `f-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
        name: f.name,
        ext: f.name.split(".").pop()?.toLowerCase() ?? "",
      }))].slice(0, 15);
    });
    setAddUploading(true);
    setTimeout(() => {
      const rows = generateMockTxns(arr.map(f => f.name));
      setPendingTxns(prev => [...prev, ...rows]);
      setAddUploading(false);
      toast.success(`Extracted ${rows.length} transaction${rows.length !== 1 ? "s" : ""} from document`);
    }, 1800);
  };

  // ── Computed data ──────────────────────────────────────────────────────────
  const { schedules } = useMemo(
    () => compute(opts, effectivePY, effectiveTxns),
    [opts, effectivePY, effectiveTxns],
  );
  const ajes         = useMemo(() => buildAJEs(schedules, opts, effectiveTxns),   [schedules, opts, effectiveTxns]);
  const incomeMatrix = useMemo(() => buildIncomeMatrix(effectiveTxns),            [effectiveTxns]);
  const fxSchedule   = useMemo(() => buildFxSchedule(effectiveTxns, effectivePY), [effectiveTxns, effectivePY]);
  const invRecon     = useMemo(() => buildInvestmentRecon(schedules, effectiveTxns), [schedules, effectiveTxns]);

  // suppress unused warning — cashRecon kept for data consistency
  useMemo(() => buildCashRecon(), []);

  return (
    <div className="min-w-0 space-y-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
      {/* Intro */}
      <p className="text-base text-foreground leading-relaxed">
        Here&apos;s a full summary of your <strong>Investment Schedule</strong> workpaper for{" "}
        <span className="font-medium text-primary">{client}</span> as at{" "}
        <span className="font-medium">{dateStr}</span>:
      </p>

      {/* Tab bar */}
      <div className="flex items-center border-b border-border -mx-0">
        <div className="flex items-center gap-0 overflow-x-auto flex-1 min-w-0">
          {TABS.map(({ id, label }) => {
            const isActive = activeTab === id;
            const locked = invMode !== "view" && id !== "transactions";
            return (
              <button
                key={id}
                onClick={() => { if (locked) return; setActiveTab(id); }}
                className={`flex items-center gap-1 px-3 py-2 text-base font-bold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? "border-primary text-primary bg-primary/5"
                    : locked
                      ? "border-transparent text-muted-foreground/30 cursor-not-allowed"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {/* Schedule / Edit / Add button group + Discard */}
        <div className="shrink-0 ml-3 mb-px flex items-center gap-1.5">
          {/* Discard — only visible in edit / add mode */}
          {invMode !== "view" && (
            <button
              onClick={discardMode}
              className="inline-flex items-center gap-1 h-6 px-2 rounded-[6px] border border-red-200 bg-red-50 text-base font-medium text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors"
            >
              <X className="h-3 w-3" /> Discard
            </button>
          )}
          <div className="flex items-center gap-0 rounded-[8px] border border-border bg-muted/40 p-0.5">
            {/* Schedule — in edit/add mode acts as Submit & Rerun */}
            {(() => {
              const canSubmit = invMode === "edit" ? canSubmitEdit : invMode === "add" ? canSubmitAdd : false;
              const handleScheduleClick = invMode !== "view"
                ? (canSubmit ? (invMode === "edit" ? submitEdits : submitAdd) : undefined)
                : undefined;
              const tooltip = invMode !== "view" && !canSubmit
                ? invMode === "edit"
                  ? "Make at least one change to enable"
                  : "Add at least one transaction to enable"
                : null;
              return (
                <div className="relative group/sched">
                  <button
                    onClick={handleScheduleClick}
                    disabled={invMode !== "view" && !canSubmit}
                    className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-[6px] text-base transition-all ${
                      invMode === "view"
                        ? "font-semibold bg-background text-foreground shadow-sm border border-border/60"
                        : canSubmit
                          ? "font-semibold bg-primary text-primary-foreground shadow-sm cursor-pointer hover:bg-primary/90"
                          : "font-medium text-muted-foreground/40 cursor-not-allowed"
                    }`}
                  >
                    <BarChart2 className="w-3 h-3" /> Schedule
                  </button>
                  {tooltip && (
                    <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-[6px] bg-foreground text-background text-base font-medium opacity-0 group-hover/sched:opacity-100 transition-opacity pointer-events-none z-50">
                      {tooltip}
                    </div>
                  )}
                </div>
              );
            })()}
            <button
              onClick={() => { setInvMode("edit"); setTxEdits({}); }}
              className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-[6px] text-base transition-all ${
                invMode === "edit"
                  ? "font-semibold bg-background text-primary shadow-sm border border-primary/30"
                  : "font-medium text-muted-foreground hover:text-foreground"
              }`}
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
            {activeTab === "transactions" && (
              <button
                onClick={() => { setInvMode("add"); setActiveTab("transactions"); setPendingTxns([]); }}
                className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-[6px] text-base transition-all ${
                  invMode === "add"
                    ? "font-semibold bg-background text-primary shadow-sm border border-primary/30"
                    : "font-medium text-muted-foreground hover:text-foreground"
                }`}
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab content — shimmer overlay while re-running */}
      <div className="min-w-0 relative">
        {isRerunning && (
          <div className="absolute inset-0 z-20 rounded-[8px] overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[3px]" />
            <div className="absolute inset-y-0 w-[120px] bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer-sweep" />
            <div className="absolute inset-y-0 w-[60px] bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-sweep" style={{ animationDelay: "0.5s", animationDuration: "1.8s" }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/95 shadow-xl border border-border/80 text-base font-medium text-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                Analysing data and generating workpaper…
              </div>
              <div className="flex items-center gap-1.5">
                {TABS.map(({ id, label }) => (
                  <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-base font-medium text-primary border border-primary/15">
                    <span className="w-1 h-1 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${TABS.findIndex(t=>t.id===id)*0.15}s` }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add-mode: gradient upload UI */}
        {activeTab === "transactions" && invMode === "add" && (
          <div className="space-y-3 mb-3">
            {/* Gradient container */}
            <div className="relative rounded-[14px] overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/[0.04] via-background to-violet-50/30">
              <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-violet-400/10 blur-3xl" />

              <div className="relative z-10 flex items-stretch gap-0 px-4 pb-4 pt-4">
                {/* Upload card */}
                <div
                  className="flex-1 flex flex-col items-center gap-2.5 p-4 rounded-[10px] border border-dashed border-primary/25 bg-primary/[0.03] cursor-pointer hover:bg-primary/[0.07] hover:border-primary/45 transition-all group text-center"
                  onClick={() => addFileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); handleAddUpload(e.dataTransfer.files); }}
                >
                  <input ref={addFileRef} type="file" accept=".pdf,.xlsx,.xls,.csv,.zip" multiple hidden onChange={e => handleAddUpload(e.target.files)} />
                  {addUploading ? (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-md" />
                        <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-sm">
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        </div>
                      </div>
                      <p className="text-base font-medium text-primary">Extracting transaction data…</p>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-md group-hover:bg-primary/30 transition-all" />
                        <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-sm">
                          <Upload className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-foreground">Import documents</p>
                        <p className="text-base text-muted-foreground mt-0.5">Broker statements · Trade confirms<br />Registers · PDF · XLSX · ZIP</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-base font-medium text-primary group-hover:underline">
                        Click to browse or drag &amp; drop
                      </span>
                    </>
                  )}
                </div>

              </div>
            </div>

            {/* File chips */}
            {addUploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {addUploadedFiles.map(f => (
                  <div key={f.id} className="inline-flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-[10px] border border-border bg-background text-base max-w-[260px]">
                    <div className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 bg-primary/10">
                      {f.ext === "pdf"
                        ? <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                        : f.ext === "zip"
                        ? <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                        : <FileSpreadsheet className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </div>
                    <span className="flex-1 min-w-0 truncate font-medium text-foreground text-base">{f.name}</span>
                    <button
                      onClick={() => setAddUploadedFiles(prev => prev.filter(x => x.id !== f.id))}
                      className="shrink-0 text-muted-foreground/50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Pending transactions review table */}
            {pendingTxns.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-foreground">
                    {pendingTxns.length} transaction{pendingTxns.length !== 1 ? "s" : ""} extracted — review and complete before submitting
                  </span>
                </div>
                <div className="rounded-[8px] border border-border overflow-hidden">
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-base" style={{ minWidth: 1400 }}>
                      <thead>
                        <tr className="bg-muted/30 border-b border-border">
                          {["Date *","Settlement","Source","Security *","Ticker","CCY","Type *","Units *","Price *","FX Rate","TB Account","Status",""].map((h, i) => (
                            <th key={i} className={`px-2 py-1.5 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${h === "" ? "sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] z-10 text-right" : ["Units *","Price *","FX Rate"].includes(h) ? "text-right" : "text-left"}`}>
                              {h.endsWith(" *") ? <>{h.slice(0,-2)} <span className="text-red-500">*</span></> : h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pendingTxns.map((row, ri) => {
                          const fc = (field: keyof InvAddRow, req: boolean) =>
                            `h-6 text-base px-1.5 border rounded bg-background focus:outline-none w-full ${req && invAddRowMissing(row, field) ? "border-red-400 bg-red-50/60 placeholder:text-red-400 text-red-600 focus:border-red-500" : "border-border focus:border-primary/40"}`;
                          const upd = (field: keyof InvAddRow, value: string) =>
                            setPendingTxns(prev => prev.map(p => p.id === row.id ? { ...p, [field]: value } : p));
                          return (
                            <tr key={row.id} className={`border-b border-border/40 ${ri % 2 === 1 ? "bg-muted/10" : ""}`}>
                              <td className="px-1.5 py-1 min-w-[120px]"><input type="date" value={row.date} onChange={e=>upd("date",e.target.value)} className={`${fc("date",true)} w-28`} /></td>
                              <td className="px-1.5 py-1 min-w-[120px]"><input type="date" value={row.settlement} onChange={e=>upd("settlement",e.target.value)} className={`${fc("settlement",false)} w-28`} /></td>
                              <td className="px-1.5 py-1 min-w-[100px]"><input value={row.broker} onChange={e=>upd("broker",e.target.value)} className={`${fc("broker",false)} w-24`} placeholder="Broker" /></td>
                              <td className="px-1.5 py-1 min-w-[140px]"><input value={row.security} onChange={e=>upd("security",e.target.value)} className={`${fc("security",true)} w-36`} placeholder="Security name" /></td>
                              <td className="px-1.5 py-1 min-w-[70px]"><input value={row.ticker} onChange={e=>upd("ticker",e.target.value.toUpperCase())} className={`${fc("ticker",false)} w-16`} placeholder="AAPL" /></td>
                              <td className="px-1.5 py-1"><select value={row.ccy} onChange={e=>upd("ccy",e.target.value)} className="h-6 text-base px-1 border border-border rounded bg-background focus:outline-none appearance-none cursor-pointer w-14">{["CAD","USD","EUR","GBP"].map(c=><option key={c}>{c}</option>)}</select></td>
                              <td className="px-1.5 py-1"><select value={row.type} onChange={e=>upd("type",e.target.value)} className="h-6 text-base px-1 border border-border rounded bg-background focus:outline-none appearance-none cursor-pointer w-32">{TX_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></td>
                              <td className="px-1.5 py-1"><input value={row.qty} onChange={e=>upd("qty",e.target.value)} className={`${fc("qty",true)} w-20 text-right`} placeholder="0" /></td>
                              <td className="px-1.5 py-1"><input value={row.price} onChange={e=>upd("price",e.target.value)} className={`${fc("price",true)} w-20 text-right`} placeholder="0.00" /></td>
                              <td className="px-1.5 py-1"><input value={row.fxRate} onChange={e=>upd("fxRate",e.target.value)} className={`${fc("fxRate",false)} w-16 text-right font-mono`} placeholder="1.0000" /></td>
                              <td className="px-1.5 py-1 min-w-[160px]">
                                <select value={row.tbAccount} onChange={e=>upd("tbAccount",e.target.value)} className="h-6 text-base px-1 border border-border rounded bg-background focus:outline-none appearance-none cursor-pointer w-44">
                                  <option value="">— Select —</option>
                                  {CHART_OF_ACCOUNTS.map(a=><option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
                                </select>
                              </td>
                              <td className="px-1.5 py-1"><select value={row.status} onChange={e=>upd("status",e.target.value)} className="h-6 text-base px-1 border border-border rounded bg-background focus:outline-none appearance-none cursor-pointer w-20">{["pending","approved","published"].map(s=><option key={s}>{s}</option>)}</select></td>
                              <td className="px-1.5 py-1 sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] z-10">
                                <div className="flex items-center justify-end">
                                  <button onClick={()=>setPendingTxns(prev=>prev.filter(p=>p.id!==row.id))} className="inline-flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab panels — always mounted so state survives tab switches */}
        <div className={activeTab === "transactions" && invMode !== "add" ? "" : "hidden"}>
          <TransactionsPanel
            effectiveTxns={effectiveTxns}
            allInvSources={allInvSources}
            manualTxns={manualTxns}
            setManualTxns={setManualTxns}
            hiddenTxIds={hiddenTxIds}
            setHiddenTxIds={setHiddenTxIds}
            txEdits={txEdits}
            setTxEdits={setTxEdits}
            batchEditMode={invMode === "edit"}
          />
        </div>
        <div className={activeTab === "wac" ? "" : "hidden"}>
          <WACPanel schedules={schedules} yearEnd={dateStr} editMode={invMode === "edit"} />
        </div>
        <div className={activeTab === "gainloss" ? "" : "hidden"}>
          <GainLossPanel schedules={schedules} yearEnd={dateStr} editMode={invMode === "edit"} allInvSources={allInvSources} />
        </div>
        <div className={activeTab === "income" ? "" : "hidden"}>
          <IncomePanel incomeMatrix={incomeMatrix} editMode={invMode === "edit"} />
        </div>
        <div className={activeTab === "brokerrecon" ? "" : "hidden"}>
          <BrokerReconPanel invRecon={invRecon} schedules={schedules} effectiveTxns={effectiveTxns} yearEnd={dateStr} editMode={invMode === "edit"} />
        </div>
        <div className={activeTab === "ajes" ? "" : "hidden"}>
          <AJEsPanel ajes={ajes} ajeQueue={ajeQueue} clearAjeQueue={clearAjeQueue} editMode={invMode === "edit"} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-border flex-wrap">
        {invMode === "view" && (
          <>
            <button ref={saveBtnRef} onClick={openSaveFlow} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 transition-colors">
              <Save className="h-3.5 w-3.5" /> Save to Engagement
            </button>
            <button onClick={() => toast.success("Downloading workpaper…")} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-border bg-background text-base font-medium text-foreground hover:bg-muted transition-colors">
              <Download className="h-3.5 w-3.5" /> Download
            </button>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied to clipboard"); }} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-border bg-background text-base font-medium text-foreground hover:bg-muted transition-colors">
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
            <button onClick={triggerRerun} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-border bg-background text-base font-medium text-foreground hover:bg-muted transition-colors">
              <RotateCcw className="h-3.5 w-3.5" /> Rerun
            </button>
          </>
        )}
      </div>

      {/* ── Save to Engagement flow ── */}
      {saveFlowStep !== "closed" && ReactDOM.createPortal(
        <>
          <div className="fixed inset-0 z-[299]" onClick={closeSaveFlow} />

          {/* Step 1 — Doc type dropdown anchored below Save button */}
          {saveFlowStep === "doc-type" && saveMenuRect && (
            <div
              className="fixed z-[300] w-72 bg-popover border border-border rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.14)] animate-in fade-in slide-in-from-top-1 duration-150"
              style={{ top: saveMenuRect.bottom + 6, left: saveMenuRect.left }}
            >
              <div className="px-3 pt-3 pb-2 border-b border-border">
                <p className="text-base font-semibold text-foreground">Select document type</p>
                <p className="text-base text-muted-foreground mt-0.5">Choose what to save to the engagement</p>
              </div>
              <div className="p-1.5 space-y-0.5">
                {DOC_TYPES.map(dt => (
                  <button
                    key={dt.id}
                    onClick={() => { setSaveDocType(dt.id); setSaveFlowStep("engagement"); }}
                    className="w-full flex items-center gap-3 px-2.5 py-2 rounded-[8px] hover:bg-muted/70 transition-colors text-left group"
                  >
                    <div className="w-7 h-7 rounded-[6px] bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                      <dt.icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-medium text-foreground">{dt.label}</p>
                      <p className="text-base text-muted-foreground">{dt.desc}</p>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50 ml-auto shrink-0 -rotate-90" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Engagement picker slides up from bottom of Luka panel */}
          {(saveFlowStep === "engagement" || saveFlowStep === "saving" || saveFlowStep === "saved") && (
            <div
              className="fixed z-[60] pointer-events-none"
              style={engPanelRect
                ? { left: engPanelRect.left, right: engPanelRect.right, bottom: engPanelRect.bottom }
                : { left: 24, right: 24, bottom: 124 }}
            >
              <div className="w-full pointer-events-auto bg-background border border-border rounded-[12px] shadow-[0_2px_24px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom-4 fade-in duration-200 flex flex-col overflow-hidden" style={{ maxHeight: "70vh" }}>
                {saveFlowStep === "saved" ? (
                  <div className="px-6 py-8 flex flex-col items-center gap-3 text-center">
                    <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">Saved to engagement</p>
                      <p className="text-base text-muted-foreground mt-0.5">
                        {DOC_TYPES.find(d => d.id === saveDocType)?.label} saved to{" "}
                        <strong>{MOCK_ENGAGEMENTS.find(e => e.id === selectedEngId)?.client}</strong>
                      </p>
                    </div>
                    <button onClick={closeSaveFlow} className="mt-1 h-8 px-6 text-base font-medium bg-primary text-primary-foreground rounded-[8px] hover:bg-primary/90 transition-colors">
                      Done
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                      <div>
                        <p className="text-base font-semibold text-foreground">Select Engagement</p>
                        {saveDocType && (
                          <p className="text-base text-muted-foreground mt-0.5">
                            Saving: <span className="font-medium text-primary">{DOC_TYPES.find(d => d.id === saveDocType)?.label}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                          <input
                            autoFocus
                            value={engSearch}
                            onChange={e => setEngSearch(e.target.value)}
                            placeholder="Search"
                            className="h-8 pl-8 pr-3 w-40 text-base border border-border rounded-[8px] bg-background focus:outline-none focus:border-primary/50"
                          />
                        </div>
                        <button onClick={closeSaveFlow} className="p-1.5 rounded-[6px] hover:bg-muted transition-colors text-muted-foreground">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="overflow-auto flex-1">
                      <table className="w-full text-base">
                        <thead className="sticky top-0 bg-muted/40 border-b border-border">
                          <tr>
                            {["Client Name","Engagement ID","Year End","Status","Date Created"].map(h => (
                              <th key={h} className="px-4 py-2.5 text-left text-base font-semibold text-foreground/70 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1">{h} <ChevronDown className="h-3 w-3 opacity-40" /></span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {MOCK_ENGAGEMENTS
                            .filter(e => !engSearch || e.client.toLowerCase().includes(engSearch.toLowerCase()) || e.engId.toLowerCase().includes(engSearch.toLowerCase()))
                            .map(eng => {
                              const isSel = selectedEngId === eng.id;
                              return (
                                <tr key={eng.id} onClick={() => setSelectedEngId(eng.id)}
                                  className={`border-b border-border/50 cursor-pointer transition-colors ${isSel ? "bg-primary/[0.06]" : "hover:bg-muted/40"}`}
                                >
                                  <td className="px-4 py-3"><span className={`font-medium ${isSel ? "text-primary" : "text-foreground"}`}>{eng.client}</span></td>
                                  <td className="px-4 py-3 text-muted-foreground font-mono text-base">{eng.engId}</td>
                                  <td className="px-4 py-3 text-muted-foreground">{eng.yearEnd}</td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-base font-medium border ${
                                      eng.status === "In Progress"
                                        ? "bg-primary/5 text-primary border-primary/20"
                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                    }`}>{eng.status}</span>
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground text-base">{eng.created}</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 shrink-0">
                      <button
                        onClick={() => setSaveFlowStep("doc-type")}
                        className="inline-flex items-center gap-1.5 h-8 px-3 text-base font-medium text-muted-foreground hover:text-foreground border border-border rounded-[8px] bg-background hover:bg-muted transition-colors"
                      >
                        <ChevronDown className="h-3.5 w-3.5 rotate-90" /> Back
                      </button>
                      <button
                        disabled={!selectedEngId || saveFlowStep === "saving"}
                        onClick={async () => {
                          if (!selectedEngId) return;
                          setSaveFlowStep("saving");
                          await new Promise<void>(r => setTimeout(r, 1200));
                          setSaveFlowStep("saved");
                          const eng = MOCK_ENGAGEMENTS.find(e => e.id === selectedEngId);
                          toast.success(`Saved to ${eng?.client} · ${eng?.engId}`);
                        }}
                        className={`inline-flex items-center gap-1.5 h-8 px-4 text-base font-medium rounded-[8px] transition-colors ${
                          !selectedEngId || saveFlowStep === "saving"
                            ? "bg-primary/30 text-primary-foreground/50 cursor-not-allowed"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                      >
                        {saveFlowStep === "saving"
                          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                          : <><Save className="h-3.5 w-3.5" /> Save to Engagement</>}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </div>
  );
}
