import React, { useState, useRef, useCallback, useEffect, useLayoutEffect, Fragment } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { accountMappings as allGLAccounts } from "@/data/mockData";
import { LukaAttachMenu, AttachedFilesBar, useAttachedFiles } from "@/components/luka/LukaAttachMenu";
import { VoiceRecordingOverlay } from "@/components/luka/VoiceRecordingOverlay";
import {
  X, Mic, Plus, Search, MessageSquare, Minus, Send, Inbox, Maximize2, Minimize2, ExternalLink, Menu,
  ChevronLeft, ChevronRight, Clock, PanelLeftClose, MoreHorizontal,
  Zap, Building2, CheckCircle2, ChevronDown, SlidersHorizontal,
  Bell, Settings, ArrowLeft, Lock, Upload, FileText, Mail, Square,
  FolderOpen, RotateCcw, Sparkles, Eye, EyeOff, Pin, PinOff, LayoutList, CalendarDays, CalendarRange,
  ArrowUpDown, ArrowUp, ArrowDown, Check, BookOpen, HardDrive, FileSpreadsheet, ShieldCheck,
  AlertTriangle, AlertCircle, TrendingUp, TrendingDown, Info, Table2, RefreshCw,
  Calendar, Receipt, Download, Trash2, BarChart2, Pencil, Loader2,
  PlusCircle, ChevronsLeft, ChevronsRight, Wand2, GitBranch, Database,
  Cloud, Globe, CreditCard, BarChart3, MoreVertical, MessageCircle, Trello,
} from "lucide-react";
import { Button } from "@/components/wp-ui/button";
import { ScrollArea } from "@/components/wp-ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/wp-ui/tooltip";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/wp-ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { setLukaOpen } from "@/lib/lukaOpenStore";
import { extractInvTransactions, validateSingleBroker, mapActivityToType, defaultTbAccountForActivity } from "@/lib/invPdfParser";
import { PromptPicker } from "@/components/luka/PromptPicker";
import { GrossMarginResponse } from "@/components/luka/GrossMarginResponse";
import { LoanAmortizationPrompt } from "@/components/luka/LoanAmortizationPrompt";
import { LoanAmortizationResponse } from "@/components/luka/LoanAmortizationResponse";
import type { LoanAmortData } from "@/components/luka/LoanAmortizationPrompt";
import { LongTermAssetResponse } from "@/components/luka/LongTermAssetResponse";
import { InvestmentScheduleResponse } from "@/components/luka/InvestmentScheduleResponse";
import { LukaResponseActions } from "@/components/luka/LukaResponseActions";
import LukaActivityPanel, { type ActivityEntry } from "@/components/dashboard/LukaActivityPanel";
import LukaSettingsOverlay from "@/components/dashboard/LukaSettingsOverlay";
import ReconciliationFlow from "@/components/dashboard/reconciliation/ReconciliationFlow";
import TaxPayableFlow from "@/components/dashboard/TaxPayableFlow";
import WorkspaceView from "@/components/dashboard/workspace/WorkspaceView";
import WorkspaceEmptyState from "@/components/dashboard/workspace/WorkspaceEmptyState";
import AddEngagementModal from "@/components/dashboard/workspace/AddEngagementModal";
import EngagementWorkspaceShell from "@/components/dashboard/workspace/EngagementWorkspaceShell";
import lukaLogo from "@/assets/luka-logo.png";
import quickbooksLogo from "@/assets/quickbooks-intuit-logo.png";
import { useStore } from "@/store/useStore";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { Loan } from "@/types";

// ─── Autopilot types ────────────────────────────────────────────────────────
type AutopilotStep =
  | "init"
  | "verification"
  | "checklists"
  | "letters"
  | "workingpapers"
  | "fsmapping"
  | "magic"
  | "automating"
  | "observation";

type VerifyRow = { label: string; value: string; showCheck: boolean };

// ─── Static data ─────────────────────────────────────────────────────────────
const statusColors = ["bg-green-500","bg-green-500","bg-amber-500","bg-green-500","bg-green-500","bg-green-500","bg-purple-500","bg-purple-500","bg-amber-500","bg-green-500","bg-purple-500"];

const pinnedThreads = [
  { id: 1, name: "Emerging Trends in Accounting" },
  { id: 2, name: "Capital Asset Amortization" },
  { id: 3, name: "Generate Variance Analysis" },
  { id: 4, name: "Details on the report" },
  { id: 5, name: "Summarise uploaded report" },
  { id: 6, name: "Run Client Heath Check" },
  { id: 7, name: "Generate Trial Balance" },
  { id: 8, name: "Aged AR Analysis" },
  { id: 9, name: "General Ledger Analysis" },
  { id: 10, name: "Account Reconciliation" },
  { id: 11, name: "Notes Generator" },
];

const recentThreads = [
  { id: 12, name: "Emerging Trends in Accounting" },
  { id: 13, name: "Capital Asset Amortization" },
  { id: 14, name: "Generate Variance Analysis" },
  { id: 15, name: "Details on the report" },
  { id: 16, name: "Summarise uploaded report" },
  { id: 17, name: "Run Client Heath Check" },
  { id: 18, name: "Generate Trial Balance" },
  { id: 19, name: "Aged AR Analysis" },
];

const suggestions = [
  "#Variance Analysis",
  "#Account Reconciliation",
  "#Bank Reconciliation",
  "#Capital Asset Amortization",
  "#Loan Amortization",
  "#Long-term Debt",
  "#Investment Schedule",
];

// ─── Thread management types ─────────────────────────────────────────────────
type ThreadItem = { name: string; createdAt: Date };

const initialPinnedThreads: ThreadItem[] = [
  { name: "Capital Asset Amortization", createdAt: new Date(2026, 4, 28, 9, 14) },
  { name: "Generate Variance Analysis",  createdAt: new Date(2026, 4, 26, 15, 42) },
  { name: "Summarise Uploaded Report",   createdAt: new Date(2026, 4, 22, 11, 5)  },
];

const initialRecentThreads: ThreadItem[] = [
  { name: "Run Client Health Check",  createdAt: new Date(2026, 4, 30, 8, 21)  },
  { name: "Aged AR Analysis",         createdAt: new Date(2026, 4, 29, 17, 3)  },
  { name: "Generate Trial Balance",   createdAt: new Date(2026, 4, 29, 10, 47) },
  { name: "Capital Asset Amortization", createdAt: new Date(2026, 4, 28, 14, 12) },
  { name: "Summarise Uploaded Report", createdAt: new Date(2026, 4, 27, 9, 33) },
  { name: "Bank To Trial Balance",    createdAt: new Date(2026, 4, 26, 16, 58) },
  { name: "Account Reconciliation",   createdAt: new Date(2026, 4, 25, 13, 24) },
  { name: "Notes Generator",          createdAt: new Date(2026, 4, 24, 11, 9)  },
];

const formatThreadDate = (d: Date) =>
  d.toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });

interface ThreadRowProps {
  thread: ThreadItem;
  icon: React.ReactNode;
  isPinned: boolean;
  onPinToggle: () => void;
  onDelete: () => void;
}

const ThreadRow = ({ thread, icon, isPinned, onPinToggle, onDelete }: ThreadRowProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="luka-thread-item group relative pr-7" role="button" tabIndex={0}>
            {icon}
            <span className="truncate flex-1 text-left">{thread.name}</span>
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center transition-opacity duration-150 hover:bg-[hsl(var(--primary)/0.12)] ${menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100"}`}
                  aria-label="Thread actions"
                >
                  <MoreVertical size={14} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="right" className="w-36">
                <DropdownMenuItem onClick={onPinToggle}>
                  {isPinned ? <><PinOff size={14} className="mr-2" /> Unpin</> : <><Pin size={14} className="mr-2" /> Pin</>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                  <Trash2 size={14} className="mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="font-medium text-base">{thread.name}</div>
          <div className="text-base opacity-70 mt-0.5">Created {formatThreadDate(thread.createdAt)}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const WP_THREADS = [
  { id: "capital-amort", label: "Capital Asset Amortization", desc: "The calculation of depreciation (amortization) expense for capital assets over their useful lives", required: true },
  { id: "lt-debt", label: "Long-term Debt", desc: "Schedule that summarizes and reconciles all long-term borrowings reported in the financial statements", required: true },
  { id: "aged-ar", label: "Aged AR Analysis", desc: "Schedule that categorizes outstanding customer balances based on how long they have been unpaid." },
  { id: "investment", label: "Investment Schedule", desc: "The calculation of depreciation (amortization) expense for capital assets over their useful lives" },
  { id: "lt-debt-2", label: "Long-term Debt (Continuity)", desc: "The calculation of depreciation (amortization) expense for capital assets over their useful lives" },
  { id: "interest-accrual", label: "Interest Accrual Working Paper", desc: "Accrued interest calculations and year-end adjustments for all loan facilities" },
];

const DEFAULT_WP_TOGGLES: Record<string, boolean> = {
  "capital-amort": true,
  "lt-debt": true,
  "aged-ar": true,
  "investment": true,
  "lt-debt-2": true,
  "interest-accrual": true,
};

const AUTOMATION_LOG_LINES = [
  "Checking uploaded checklists..",
  "Autopopulating Checklists..",
  "Checklists populated successfully..",
  "Generating amortization schedule..",
  "Running covenant compliance..",
  "Building FS disclosure notes..",
  "Cross-referencing working papers..",
  "Automation complete ✓",
];
const AUTOMATION_MILESTONES = [8, 20, 35, 52, 68, 80, 92, 100];

const DONUT_DATA = [{ name: "Complete", value: 72 }, { name: "Remaining", value: 28 }];
const DONUT_COLORS = ["hsl(var(--primary))", "hsl(var(--muted))"];

const WIZARD_TABS: { id: AutopilotStep; label: string }[] = [
  { id: "verification", label: "Verification" },
  { id: "checklists", label: "Checklists" },
  { id: "letters", label: "Letters" },
  { id: "workingpapers", label: "Working Papers" },
  { id: "fsmapping", label: "FS & Acc. Mapping" },
  { id: "magic", label: "Magic" },
];

// ─── Luka icon ───────────────────────────────────────────────────────────────
function LukaIcon({ size = 20 }: { size?: number }) {
  return <Zap className="text-white" size={size} fill="white" strokeWidth={0} />;
}

// ─── Luka message bubble (speech style from Figma) ──────────────────────────
function LukaMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 animate-in fade-in duration-300">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0 mt-0.5">
        <LukaIcon size={12} />
      </div>
      <div className="flex-1 text-base text-foreground leading-relaxed">{children}</div>
    </div>
  );
}

// ─── Bold text helper ────────────────────────────────────────────────────────
function BoldText({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
        i % 2 === 1 ? <strong key={i} className="font-semibold text-foreground">{part}</strong> : part
      )}
    </>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
interface AskLukaOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
}

// ── Agentic Loan Amort — mock discovery data ───────────────────────────────
const AMORT_ENG_DOCS = [
  { id: "adoc-1", name: "Loan Amortization — Term Loan A.pdf",  path: "Workpapers / Long-term Debt / FY2025", date: "Dec 31, 2025", size: "284 KB", ext: "pdf"  },
  { id: "adoc-2", name: "Loan Register 2025.xlsx",               path: "Supporting Documents / Loans",        date: "Jan 12, 2026", size: "156 KB", ext: "xlsx" },
];
const AMORT_DRIVE_FILES = [
  { id: "gd-1", name: "FY2025 Debt Schedule.xlsx",         folder: "Audit Support / FY2025",          size: "241 KB", ext: "xlsx" },
  { id: "gd-2", name: "Term Loan Agreement — RBC.pdf",     folder: "Client Documents / Contracts",    size: "892 KB", ext: "pdf"  },
  { id: "gd-3", name: "HSBC Equipment Loan.pdf",           folder: "Client Documents / Contracts",    size: "445 KB", ext: "pdf"  },
];
type AmortSource = "existing" | "upload" | "drive" | "manual";

// ── LT Debt multi-file upload — types & classifier ─────────────────────────
type LtDebtFileKind =
  | "loan-agreement" | "continuity" | "loan-register" | "workpaper" | "debt-schedule"
  | "ambiguous" | "unsupported" | "oversized";

interface LtDebtFile {
  id: string; name: string; size: number; ext: string;
  kind: LtDebtFileKind;
  userKind?: Exclude<LtDebtFileKind, "unsupported" | "oversized" | "ambiguous">;
}

function classifyLtDebtFile(file: File): LtDebtFile {
  const n   = file.name.toLowerCase();
  const ext = (n.split(".").pop() ?? "").toLowerCase();
  const id  = `ltf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  if (!["pdf", "xlsx", "xls", "zip"].includes(ext))
    return { id, name: file.name, size: file.size, ext, kind: "unsupported" };
  if (file.size > 25 * 1024 * 1024)
    return { id, name: file.name, size: file.size, ext, kind: "oversized" };
  // Accounting-software debt schedule PDFs (CaseWare, QuickBooks, Sage, etc.)
  if (ext === "pdf" && /debt.*(amortiz|schedul|statement|continu)|amortiz.*\bdebt\b|loan.*schedul|schedul.*loan/.test(n))
    return { id, name: file.name, size: file.size, ext, kind: "debt-schedule" };
  if (ext === "pdf" || ext === "zip")
    return { id, name: file.name, size: file.size, ext, kind: "loan-agreement" };
  // Excel — name-based detection
  if (/continu|roll.?forward|movement/.test(n))
    return { id, name: file.name, size: file.size, ext, kind: "continuity" };
  if (/register|debt.?schedul|loan.?list|facilit/.test(n))
    return { id, name: file.name, size: file.size, ext, kind: "loan-register" };
  if (/workpaper|work.?paper|\bwp\b|fy\d{2,4}|prior.?year/.test(n))
    return { id, name: file.name, size: file.size, ext, kind: "workpaper" };
  return { id, name: file.name, size: file.size, ext, kind: "ambiguous" };
}

const LT_FILE_KIND_LABEL: Record<string, string> = {
  "loan-agreement": "Loan Agreement",
  "continuity":     "Continuity Schedule",
  "loan-register":  "Loan Register",
  "workpaper":      "Prior Year Workpaper",
  "debt-schedule":  "Debt Schedule (AI)",
};
const LT_FILE_KIND_COLOR: Record<string, string> = {
  "loan-agreement": "bg-blue-50 text-blue-700 border-blue-200",
  "continuity":     "bg-green-50 text-green-700 border-green-200",
  "loan-register":  "bg-purple-50 text-purple-700 border-purple-200",
  "workpaper":      "bg-amber-50 text-amber-700 border-amber-200",
  "debt-schedule":  "bg-violet-50 text-violet-700 border-violet-200",
};

// What each file type contributes to the workpaper
const LT_SOURCE_INFO: Record<string, {
  dot: string;        // Tailwind bg colour for the dot
  border: string;     // border + bg for the card
  heading: string;    // text colour for heading
  provides: string;   // what data will be extracted
  priority: number;   // merge priority (lower = overrides)
}> = {
  "loan-agreement": {
    dot:      "bg-blue-500",
    border:   "border-blue-200 bg-blue-50/60",
    heading:  "text-blue-800",
    provides: "Loan terms — principal, interest rate, maturity date, payment schedule, covenant clauses",
    priority: 1,
  },
  "loan-register": {
    dot:      "bg-purple-500",
    border:   "border-purple-200 bg-purple-50/60",
    heading:  "text-purple-800",
    provides: "Full facility list — all loans with lender, type, GL account codes, and current balances",
    priority: 2,
  },
  "continuity": {
    dot:      "bg-green-500",
    border:   "border-green-200 bg-green-50/60",
    heading:  "text-green-800",
    provides: "Balance roll-forward — opening balance, new draws, repayments, FX translation, closing balance",
    priority: 3,
  },
  "workpaper": {
    dot:      "bg-amber-500",
    border:   "border-amber-200 bg-amber-50/60",
    heading:  "text-amber-800",
    provides: "Prior-year comparatives, existing GL mappings, posted notes, and covenant history",
    priority: 4,
  },
  "debt-schedule": {
    dot:      "bg-violet-500",
    border:   "border-violet-200 bg-violet-50/60",
    heading:  "text-violet-800",
    provides: "AI-extracted loan data — rate, payments, balances, and amortization schedule from accounting software exports",
    priority: 2,
  },
};

// ── Agentic Long-term Debt wizard — mock discovery data ───────────────────
const LT_DEBT_ENG_DOCS = [
  { id: "ltd-1", name: "Long-term Debt Workpaper FY2024.xlsx", path: "Workpapers / Long-term Debt / FY2024", date: "Dec 31, 2024", size: "312 KB", ext: "xlsx" },
  { id: "ltd-2", name: "Loan Register 2025.xlsx",               path: "Supporting Documents / Loans",        date: "Jan 12, 2026", size: "156 KB", ext: "xlsx" },
  { id: "ltd-3", name: "Continuity Schedule FY2024.xlsx",       path: "Workpapers / Long-term Debt / FY2024", date: "Dec 31, 2024", size: "198 KB", ext: "xlsx" },
];
const LT_DEBT_DRIVE_FILES = [
  { id: "ltd-gd-1", name: "FY2025 Debt Schedule.xlsx",           folder: "Audit Support / FY2025",        size: "241 KB", ext: "xlsx" },
  { id: "ltd-gd-2", name: "Term Loan Agreement — RBC.pdf",        folder: "Client Documents / Contracts",  size: "892 KB", ext: "pdf"  },
  { id: "ltd-gd-3", name: "All Loan Agreements Package 2025.zip", folder: "Client Documents / Contracts",  size: "2.1 MB", ext: "zip"  },
];

const LT_RIGHT_COLS = new Set(["Int. Rate % *","Mo. Payment","Orig. Loan Amt","FX Rate","Opening Bal. *","IO Period (mo.)","Balloon Amt"]);

/** Default GL Principal account based on loan type and currency. */
function defaultGLPrincipal(type: string, currency: string): string {
  if (type === "LOC" || type === "Revolver") return "2200"; // Line of Credit
  if (currency === "USD") return "2110";                    // LTD – USD
  return "2100";                                            // LTD – CAD (default)
}
const SCR = "h-6 text-base px-1 border border-border rounded bg-background focus:outline-none appearance-none cursor-pointer";

// ── GL account combobox (compact, for review table) ─────────────────────────
function GLComboboxMini({ value, onChange, required }: { value: string; onChange: (v: string) => void; required?: boolean }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const [typed, setTyped] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef  = useRef<HTMLDivElement>(null);
  const [pos, setPos]     = useState({ top: 0, left: 0, width: 0 });

  const selected     = allGLAccounts.find(a => a.code === value);
  const displayLabel = selected ? `${selected.code} — ${selected.name}` : value;

  useEffect(() => { if (!typed) setQuery(displayLabel); }, [value, typed, displayLabel]);

  const openDrop = () => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 2, left: r.left, width: Math.max(r.width, 260) });
    }
    setQuery(''); setTyped(false); setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!inputRef.current?.contains(e.target as Node) && !dropRef.current?.contains(e.target as Node)) {
        setOpen(false); setTyped(false); setQuery(displayLabel);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open, displayLabel]);

  const q        = query.toLowerCase();
  const filtered = typed
    ? allGLAccounts.filter(a => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q))
    : allGLAccounts;

  return (
    <>
      <input
        ref={inputRef}
        className={cn("h-6 text-base px-1.5 border rounded bg-background focus:outline-none w-full font-mono",required && !value ? "border-red-400 bg-red-50/60 placeholder:text-red-400 text-red-600 focus:border-red-500" : "border-border focus:border-primary/40 placeholder:text-muted-foreground")}
        value={open ? query : displayLabel}
        placeholder="Search GL…"
        onChange={e => { setQuery(e.target.value); setTyped(true); }}
        onFocus={openDrop}
        onClick={openDrop}
      />
      {open && filtered.length > 0 && ReactDOM.createPortal(
        <div
          ref={dropRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: Math.max(pos.width, 260), zIndex: 9999 }}
          className="bg-background border border-border rounded-md shadow-lg py-1 max-h-48 overflow-y-auto"
        >
          {filtered.map(a => (
            <div
              key={a.code}
              className={`px-3 py-1 text-base cursor-pointer font-mono ${a.code === value ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground hover:bg-muted'}`}
              onMouseDown={e => {
                e.preventDefault();
                onChange(a.code);
                setOpen(false); setTyped(false);
                setQuery(`${a.code} — ${a.name}`);
              }}
            >
              <span className="font-semibold">{a.code}</span>
              <span className="text-muted-foreground ml-1.5">— {a.name}</span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

// ── LT Debt review row — extracted / manual loan entries ─────────────────
interface LtDebtReviewRow {
  id: string; sourceFile?: string;
  name: string; lender: string; type: string; currency: string;
  originalPrincipal: string; currentBalance: string; rate: string;
  interestType: string; startDate: string; maturityDate: string;
  firstPaymentDate: string; monthlyPayment: string; fxRate: string;
  paymentFrequency: string; paymentType: string;
  dayCount: string; compounding: string;
  ioPeriod: string; balloonAmt: string;
  collateral: string; status: string;
  glPrincipal: string;
}

const EMPTY_LT_ROW = (): LtDebtReviewRow => ({
  id: `ltr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: "", lender: "", type: "Term", currency: "CAD",
  originalPrincipal: "", currentBalance: "", rate: "",
  interestType: "Fixed", startDate: "", maturityDate: "",
  firstPaymentDate: "", monthlyPayment: "", fxRate: "",
  paymentFrequency: "Monthly", paymentType: "P&I",
  dayCount: "ACT/365", compounding: "Monthly",
  ioPeriod: "", balloonAmt: "",
  collateral: "", status: "Active",
  glPrincipal: "2100",
});

const LT_REVIEW_REQUIRED: (keyof LtDebtReviewRow)[] = ["name", "lender", "currentBalance", "rate", "startDate", "maturityDate", "glPrincipal"];

function ltRowMissing(row: LtDebtReviewRow, field: keyof LtDebtReviewRow) {
  return !String(row[field] ?? "").trim();
}

function mockLtRowsFromFile(file: LtDebtFile): LtDebtReviewRow[] {
  const kind = file.userKind ?? file.kind;
  const sf = file.name;
  const uid = () => `ltr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const X = { firstPaymentDate: "", monthlyPayment: "", fxRate: "", paymentType: "P&I", dayCount: "ACT/365", compounding: "Monthly", ioPeriod: "", balloonAmt: "" };
  // ── Real CaseWare extraction — The Fishin' Hole (1982) Ltd., YE Sep 30, 2025 ──
  if (kind === "debt-schedule") return [
    {
      id: uid(), sourceFile: sf,
      name: "Promissory Note 1", lender: "", type: "Term", currency: "CAD",
      originalPrincipal: "400,000", currentBalance: "400,000", rate: "4.000",
      interestType: "Fixed", startDate: "2024-10-01", maturityDate: "2032-09-30",
      firstPaymentDate: "2024-10-31", monthlyPayment: "4,875.49", fxRate: "",
      paymentFrequency: "Monthly", paymentType: "P&I",
      dayCount: "ACT/365", compounding: "Monthly",
      ioPeriod: "", balloonAmt: "",
      collateral: "", status: "Active",
      glPrincipal: defaultGLPrincipal("Term", "CAD"),
    },
    {
      id: uid(), sourceFile: sf,
      name: "Promissory Note 2", lender: "", type: "Term", currency: "CAD",
      originalPrincipal: "400,000", currentBalance: "400,000", rate: "4.000",
      interestType: "Fixed", startDate: "2024-10-01", maturityDate: "2032-09-30",
      firstPaymentDate: "2024-10-31", monthlyPayment: "4,875.49", fxRate: "",
      paymentFrequency: "Monthly", paymentType: "P&I",
      dayCount: "ACT/365", compounding: "Monthly",
      ioPeriod: "", balloonAmt: "",
      collateral: "", status: "Active",
      glPrincipal: defaultGLPrincipal("Term", "CAD"),
    },
  ];
  if (kind === "loan-agreement") return [{
    id: uid(), sourceFile: sf,
    name: file.name.replace(/\.(pdf|zip)$/i, "").replace(/[-_]/g, " "),
    lender: "RBC Royal Bank", type: "Term", currency: "CAD",
    originalPrincipal: "3,750,000", currentBalance: "", rate: "",
    interestType: "Fixed", startDate: "2022-04-01", maturityDate: "2027-04-01",
    paymentFrequency: "Monthly", collateral: "", status: "Active",
    glPrincipal: defaultGLPrincipal("Term", "CAD"),
    ...X,
  }];
  if (kind === "loan-register") return [
    { id: uid(), sourceFile: sf, name: "Term Loan A",   lender: "RBC Royal Bank", type: "Term", currency: "CAD", originalPrincipal: "5,000,000", currentBalance: "3,750,000", rate: "5.25", interestType: "Fixed",    startDate: "2022-04-01", maturityDate: "2027-04-01", paymentFrequency: "Monthly", collateral: "Real property — 123 Main St.", status: "Active", glPrincipal: defaultGLPrincipal("Term","CAD"), ...X, firstPaymentDate: "2022-05-01", monthlyPayment: "72,916" },
    { id: uid(), sourceFile: sf, name: "Operating LOC", lender: "TD Bank",         type: "LOC",  currency: "CAD", originalPrincipal: "1,000,000", currentBalance: "875,000",   rate: "7.45", interestType: "Variable", startDate: "2021-01-15", maturityDate: "",           paymentFrequency: "Monthly", collateral: "Accounts receivable",         status: "Active", glPrincipal: defaultGLPrincipal("LOC","CAD"),  ...X },
    { id: uid(), sourceFile: sf, name: "Equipment Loan",lender: "HSBC",            type: "Term", currency: "USD", originalPrincipal: "1,500,000", currentBalance: "1,125,000", rate: "",     interestType: "Fixed",    startDate: "2023-03-01", maturityDate: "2028-03-01", paymentFrequency: "Monthly", collateral: "Manufacturing equipment",     status: "Active", glPrincipal: defaultGLPrincipal("Term","USD"), ...X, fxRate: "1.3500" },
  ];
  if (kind === "continuity") return [
    { id: uid(), sourceFile: sf, name: "Term Loan A",   lender: "RBC Royal Bank", type: "Term", currency: "CAD", originalPrincipal: "5,000,000", currentBalance: "3,750,000", rate: "5.25", interestType: "Fixed",    startDate: "2022-04-01", maturityDate: "2027-04-01", paymentFrequency: "Monthly", collateral: "Real property",         status: "Active", glPrincipal: defaultGLPrincipal("Term","CAD"), ...X },
    { id: uid(), sourceFile: sf, name: "Operating LOC", lender: "TD Bank",         type: "LOC",  currency: "CAD", originalPrincipal: "",          currentBalance: "875,000",   rate: "7.45", interestType: "Variable", startDate: "",           maturityDate: "",           paymentFrequency: "Monthly", collateral: "",                      status: "Active", glPrincipal: defaultGLPrincipal("LOC","CAD"),  ...X },
  ];
  if (kind === "workpaper") return [
    { id: uid(), sourceFile: sf, name: "Term Loan A",   lender: "RBC Royal Bank", type: "Term", currency: "CAD", originalPrincipal: "5,000,000", currentBalance: "3,750,000", rate: "5.25", interestType: "Fixed",    startDate: "2022-04-01", maturityDate: "2027-04-01", paymentFrequency: "Monthly", collateral: "Real property — 123 Main St.", status: "Active", glPrincipal: defaultGLPrincipal("Term","CAD"), ...X, firstPaymentDate: "2022-05-01" },
    { id: uid(), sourceFile: sf, name: "Operating LOC", lender: "TD Bank",         type: "LOC",  currency: "CAD", originalPrincipal: "1,000,000", currentBalance: "875,000",   rate: "7.45", interestType: "Variable", startDate: "2021-01-15", maturityDate: "2026-01-15", paymentFrequency: "Monthly", collateral: "Accounts receivable",         status: "Active", glPrincipal: defaultGLPrincipal("LOC","CAD"),  ...X },
    { id: uid(), sourceFile: sf, name: "Equipment Loan",lender: "HSBC",            type: "Term", currency: "USD", originalPrincipal: "1,500,000", currentBalance: "1,125,000", rate: "6.10", interestType: "Fixed",    startDate: "2023-03-01", maturityDate: "2028-03-01", paymentFrequency: "Monthly", collateral: "Manufacturing equipment",     status: "Active", glPrincipal: defaultGLPrincipal("Term","USD"), ...X, fxRate: "1.3500" },
  ];
  return [];
}

// ── Investment Schedule — Plaid institutions ─────────────────────────────
const INV_PLAID_INSTITUTIONS = [
  { id: 'td',           name: 'TD Direct Investing',   abbr: 'TD',  color: '#00883A' },
  { id: 'rbc',          name: 'RBC Direct Investing',  abbr: 'RBC', color: '#0051A5' },
  { id: 'bmo',          name: 'BMO InvestorLine',       abbr: 'BMO', color: '#0079C1' },
  { id: 'hsbc',         name: 'HSBC InvestDirect',      abbr: 'HSB', color: '#DB0011' },
  { id: 'fidelity',     name: 'Fidelity Investments',   abbr: 'FID', color: '#538025' },
  { id: 'scotia',       name: 'Scotiabank iTRADE',       abbr: 'BNS', color: '#EC111A' },
  { id: 'cibc',         name: "CIBC Investor's Edge",   abbr: 'CM',  color: '#A41422' },
  { id: 'national',     name: 'National Bank Direct',   abbr: 'NA',  color: '#EA1D2C' },
  { id: 'questrade',    name: 'Questrade',              abbr: 'QT',  color: '#E8641C' },
  { id: 'wealthsimple', name: 'Wealthsimple Trade',     abbr: 'WS',  color: '#1A1A1A' },
];

// ── Investment upload file types ─────────────────────────────────────────
type InvFileKind = "statement" | "trade-confirm" | "account-summary" | "workpaper" | "ambiguous" | "unsupported" | "oversized";
interface InvUploadFile {
  id: string; name: string; size: number; ext: string;
  kind: InvFileKind;
  userKind?: Exclude<InvFileKind, "ambiguous" | "unsupported" | "oversized">;
}

function classifyInvFile(file: File): InvUploadFile {
  const n   = file.name.toLowerCase();
  const ext = (n.split(".").pop() ?? "").toLowerCase();
  const id  = `invf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  if (!["pdf", "xlsx", "xls", "csv", "zip"].includes(ext))
    return { id, name: file.name, size: file.size, ext, kind: "unsupported" };
  if (file.size > 25 * 1024 * 1024)
    return { id, name: file.name, size: file.size, ext, kind: "oversized" };
  if (ext === "pdf" || ext === "zip")
    return { id, name: file.name, size: file.size, ext, kind: "statement" };
  if (/trade|confirm|transaction/.test(n))
    return { id, name: file.name, size: file.size, ext, kind: "trade-confirm" };
  if (/statement|brokerage|account/.test(n))
    return { id, name: file.name, size: file.size, ext, kind: "statement" };
  if (/workpaper|work.?paper|\bwp\b|fy\d{2,4}|prior.?year/.test(n))
    return { id, name: file.name, size: file.size, ext, kind: "workpaper" };
  return { id, name: file.name, size: file.size, ext, kind: "ambiguous" };
}

// ── Investment Review Row ────────────────────────────────────────────────────
interface InvReviewRow {
  id: string;
  date: string;
  settlement: string;
  security: string;
  ticker: string;
  type: string;
  units: string;
  price: string;
  amount: string;       // net CAD amount
  fxRate: string;       // USD→CAD rate if applicable
  currency: string;
  account: string;
  accountType: string;  // IAA / PMA
  source: string;
  voided?: boolean;     // soft-delete: entry still visible, excluded from balance
  voidedAt?: string;    // ISO timestamp when voided
  isManual?: boolean;   // true = user-entered, false = scanned from PDF
}

// Real data extracted from Richardson Wealth Limited (SPM Holdings Ltd.) statements
const INV_MOCK_ROWS: InvReviewRow[] = [
  // ── Opening Balances — Aug 1, 2023 (July 31, 2023 closing positions) ──
  // IAA Account H11-YLF0-E
  { id:"ob-01", date:"", settlement:"2023-08-01", security:"REGIMEN EQUITY PARTNERS SERIES IV PREFERRED SECURITIES", ticker:"REGPREF", type:"Opening", units:"10000.0000", price:"10.000",   amount:"-100000.00", fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_1_Aug_2023.pdf" },
  // PMA Account H11-YLG0-E - prior positions (July 31, 2023)
  { id:"ob-02", date:"", settlement:"2023-08-01", security:"BNS CORPORATE TIERED INVESTMENT SAVINGS ACCOUNT F",   ticker:"BNSISA",  type:"Opening", units:"52495.7905", price:"1.000",    amount:"-52495.79", fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-03", date:"", settlement:"2023-08-01", security:"HIGH INTEREST SAVINGS ACCOUNT F",                    ticker:"HISA",    type:"Opening", units:"5042.7060",  price:"10.000",   amount:"-50427.06", fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-04", date:"", settlement:"2023-08-01", security:"ISHARES S&P/TSX 60 INDEX ETF",                       ticker:"XIU",     type:"Opening", units:"1193.0000",  price:"30.690",   amount:"-36613.17", fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-05", date:"", settlement:"2023-08-01", security:"MACKENZIE CDN EQU ETF SR E",                         ticker:"QCE",     type:"Opening", units:"530.0000",   price:"124.500",  amount:"-65985.00", fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-06", date:"", settlement:"2023-08-01", security:"S/R LPU HEPF III LIMITED CL A INSTALMENT RECEIPTS",  ticker:"HEPF",    type:"Opening", units:"100000.0000",price:"0.137",    amount:"-13700.00", fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-07", date:"", settlement:"2023-08-01", security:"BANK OF NOVA SCOTIA SENIOR FIXED RATE NOTES 1.4% 01NOV2027", ticker:"BNS", type:"Opening", units:"16000.0000", price:"85.467", amount:"-13749.62", fxRate:"", currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-08", date:"", settlement:"2023-08-01", security:"CIBC 2.35% FXD RT SR NT 28AUG2024",                  ticker:"CM",      type:"Opening", units:"16000.0000",  price:"96.832",   amount:"-15496.21", fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-09", date:"", settlement:"2023-08-01", security:"CANADIAN WESTERN BANK SENIOR DEPOSIT NOTES 1.57% 14SEP2023", ticker:"CWB", type:"Opening", units:"6000.0000", price:"99.896", amount:"-5993.76", fxRate:"", currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-10", date:"", settlement:"2023-08-01", security:"LAUR BK OF CDA 1.95% 17MAR2025",                     ticker:"LB",      type:"Opening", units:"16000.0000",  price:"94.153",   amount:"-15207.15", fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-11", date:"", settlement:"2023-08-01", security:"ONT PROV 3.5% 02JUN43",                              ticker:"ONT",     type:"Opening", units:"13000.0000",  price:"87.459",   amount:"-11481.89", fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-12", date:"", settlement:"2023-08-01", security:"MANULIFE WORLD INVESTMENT FUND F",                   ticker:"MFC",     type:"Opening", units:"7157.5190",   price:"18.882",   amount:"-135144.69",fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-13", date:"", settlement:"2023-08-01", security:"MANULIFE STRATEGIC INCOME FUND F",                   ticker:"MFC2",    type:"Opening", units:"3715.7900",   price:"10.987",   amount:"-40826.87", fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-14", date:"", settlement:"2023-08-01", security:"ISHARES CORE S&P 500 INDEX CAD HEDGED ETF",          ticker:"XSP",     type:"Opening", units:"1780.0000",   price:"47.670",   amount:"-84852.60", fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-15", date:"", settlement:"2023-08-01", security:"MACKENZIE US SMALL-MID CAP GROWTH CURRENCY NEUTRAL FUND F", ticker:"MSCG", type:"Opening", units:"1059.0910", price:"29.366", amount:"-31100.74", fxRate:"", currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-16", date:"", settlement:"2023-08-01", security:"GQG PARTNERS INTERNATIONAL QUALITY EQUITY FUND",    ticker:"GQG",     type:"Opening", units:"0.0000",      price:"0.000",    amount:"0.00",       fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-17", date:"", settlement:"2023-08-01", security:"CAPITAL GROUP GLOBAL EQUITY FUND (CANADA)",          ticker:"CGGE",    type:"Opening", units:"1900.9110",   price:"47.395",   amount:"-90094.06", fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-18", date:"", settlement:"2023-08-01", security:"PURPOSE TACTICAL ASSET ALLOC FD CLASS F",            ticker:"PTAF",    type:"Opening", units:"4973.2360",   price:"14.716",   amount:"-73175.12", fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-19", date:"", settlement:"2023-08-01", security:"LYSANDER-CANSO CORPORATE VALUE BOND FUND SERIES F",  ticker:"LCVB",    type:"Opening", units:"4352.9165",   price:"13.864",   amount:"-60347.09", fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-20", date:"", settlement:"2023-08-01", security:"ACM COMMERCIAL MORTGAGE FUND CLASS F",               ticker:"ACMCMF",  type:"Opening", units:"421.5314",    price:"108.661",  amount:"-45804.19", fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-21", date:"", settlement:"2023-08-01", security:"PRIMEVESTFUND CLASS F",                              ticker:"PVF",     type:"Opening", units:"730.1367",    price:"27.088",   amount:"-19777.94", fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-22", date:"", settlement:"2023-08-01", security:"RISE PROPERTIES TRUST CLASS F",                     ticker:"RISE",    type:"Opening", units:"1547.0518",   price:"21.481",   amount:"-33232.07", fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-23", date:"", settlement:"2023-08-01", security:"KENSINGTON PRIVATE EQUITY FUND CLASS G",             ticker:"KPE",     type:"Opening", units:"1091.1282",   price:"33.618",   amount:"-36681.77", fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-24", date:"", settlement:"2023-08-01", security:"REVESCO CANADIAN HOLDINGS LP CLASS B",               ticker:"REVESCO", type:"Opening", units:"1496.4054",   price:"14.299",   amount:"-21399.96", fxRate:"1.3241", currency:"USD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"ob-25", date:"", settlement:"2023-08-01", security:"FOUR QUADRANT GLOBAL REAL ESTATE PARTNERS TRUST CLASS J", ticker:"FQGRE", type:"Opening", units:"4118.1435", price:"10.647", amount:"-43846.29", fxRate:"", currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  // ── August 2023 — IAA H11-YLF0-E ──
  { id:"r-a01", date:"2023-08-31", settlement:"2023-08-31", security:"REGIMEN EQUITY PARTNERS SERIES IV PREFERRED SECURITIES", ticker:"REGPREF", type:"Dividend",       units:"",          price:"",       amount:"849.32",     fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_1_Aug_2023.pdf" },
  { id:"r-a02", date:"2023-08-22", settlement:"2023-08-22", security:"IAA FEE FEE/FRAIS 07/2023",                              ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-83.88",     fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_1_Aug_2023.pdf" },
  { id:"r-a03", date:"2023-08-22", settlement:"2023-08-22", security:"GST FEE/FRAIS 07/2023",                                  ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-4.19",      fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_1_Aug_2023.pdf" },
  // ── August 2023 — PMA Account ──
  { id:"r-a04", date:"2023-06-30", settlement:"2023-06-30", security:"REVESCO CANADIAN HOLDINGS LP CLASS B",                   ticker:"REVESCO", type:"Dividend",       units:"",          price:"",       amount:"346.72",     fxRate:"1.3240", currency:"USD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"r-a05", date:"", settlement:"2023-08-01", security:"HIGH INTEREST SAVINGS ACCOUNT F",                        ticker:"HISA",    type:"Sale",           units:"3800.0000", price:"10.000", amount:"38000.00",   fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"r-a06", date:"", settlement:"2023-08-02", security:"ISHARES MSCI EAFE INDEX ETF",                            ticker:"XEF",     type:"Purchase",       units:"2465.0000", price:"32.460", amount:"-80013.90",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"r-a07", date:"", settlement:"2023-08-02", security:"RBC 1.833% SR UNSECURED 31JUL28",                        ticker:"RY",      type:"Purchase",       units:"58000.0000",price:"86.109", amount:"-49943.22",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"r-a08", date:"", settlement:"2023-08-02", security:"TELUS CORP 2.75% 08JUL2026",                             ticker:"T",       type:"Purchase",       units:"14000.0000",price:"93.240", amount:"-13053.60",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"r-a09", date:"", settlement:"2023-08-02", security:"GQG PARTNERS INTERNATIONAL QUALITY EQUITY FUND",        ticker:"GQG",     type:"Purchase",       units:"2623.3640", price:"11.436", amount:"-29999.87",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"r-a10", date:"", settlement:"2023-08-02", security:"MANULIFE WORLD INVESTMENT FUND F",                       ticker:"MFC",     type:"Sale",           units:"7157.5190", price:"18.882", amount:"135144.69",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"r-a11", date:"", settlement:"2023-08-02", security:"MANULIFE STRATEGIC INCOME FUND F",                       ticker:"MFC2",    type:"Sale",           units:"3715.7900", price:"10.987", amount:"40826.87",   fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"r-a12", date:"", settlement:"2023-08-02", security:"PURPOSE TACTICAL ASSET ALLOC FD CLASS F",                ticker:"PTAF",    type:"Purchase",       units:"1142.2120", price:"14.883", amount:"-17000.00",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"r-a13", date:"2023-08-03", settlement:"2023-08-03", security:"ACM COMMERCIAL MORTGAGE FUND CLASS F",                   ticker:"ACMCMF",  type:"Dividend",       units:"",          price:"",       amount:"210.76",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"r-a14", date:"2023-08-08", settlement:"2023-08-08", security:"FOUR QUADRANT GLOBAL REAL ESTATE PARTNERS TRUST CLASS J",ticker:"FQGRE",   type:"Dividend",       units:"",          price:"",       amount:"198.08",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"r-a15", date:"2023-08-22", settlement:"2023-08-22", security:"PMA FEE FEE/FRAIS 07/2023",                              ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-877.35",    fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"r-a16", date:"2023-08-22", settlement:"2023-08-22", security:"GST FEE/FRAIS 07/2023",                                  ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-43.87",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"r-a17", date:"2023-08-25", settlement:"2023-08-25", security:"BNS CORPORATE TIERED INVESTMENT SAVINGS ACCOUNT F",      ticker:"BNSISA",  type:"Interest",       units:"201.3536",  price:"1.000",  amount:"201.35",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"r-a18", date:"2023-08-28", settlement:"2023-08-28", security:"BANK OF NOVA SCOTIA SENIOR FIXED RATE NOTES 1.4% 01NOV2027", ticker:"BNS", type:"Bond Interest",  units:"",          price:"",       amount:"188.00",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"r-a19", date:"2023-08-31", settlement:"2023-08-31", security:"ISHARES S&P/TSX 60 INDEX ETF",                           ticker:"XIU",     type:"Distribution",   units:"3345.0000", price:"",       amount:"819.53",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"r-a20", date:"2023-08-31", settlement:"2023-08-31", security:"RISE PROPERTIES TRUST CLASS F",                          ticker:"RISE",    type:"Return of Capital",units:"",        price:"",       amount:"-113.45",    fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"r-a21", date:"2023-08-31", settlement:"2023-08-31", security:"RISE PROPERTIES TRUST CLASS F",                          ticker:"RISE",    type:"Dividend",       units:"",          price:"",       amount:"113.45",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },
  { id:"r-a22", date:"2023-08-31", settlement:"2023-08-31", security:"HIGH INTEREST SAVINGS ACCOUNT F",                        ticker:"HISA",    type:"Reinvested Dividend",units:"5.5910",price:"10.000", amount:"55.91",      fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_1_Aug_2023.pdf" },

  // ── September 2023 ──
  { id:"r-b01", date:"", settlement:"2023-09-13", security:"ISHARES MSCI EAFE INDEX ETF",                            ticker:"XEF",     type:"Sale",           units:"2465.0000", price:"31.900", amount:"78633.50",   fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_2_Sept_2023.pdf" },
  { id:"r-b02", date:"", settlement:"2023-09-13", security:"ISHARES CORE MSCI EAFE IMI INDEX CAN HEDGED ETF",        ticker:"XEF2",    type:"Purchase",       units:"2780.0000", price:"28.200", amount:"-78396.00",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_2_Sept_2023.pdf" },
  { id:"r-b03", date:"", settlement:"2023-09-14", security:"CANADIAN WESTERN BANK SENIOR DEPOSIT NOTES 1.57% 14SEP2023",ticker:"CWB",  type:"Sale",           units:"6000.0000", price:"100.000",amount:"6000.00",    fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_2_Sept_2023.pdf" },
  { id:"r-b04", date:"", settlement:"2023-09-18", security:"RBC 1.833% SR UNSECURED 31JUL28",                        ticker:"RY",      type:"Purchase",       units:"6000.0000", price:"85.693", amount:"-5141.58",   fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_2_Sept_2023.pdf" },
  { id:"r-b05", date:"", settlement:"2023-09-21", security:"GQG PARTNERS INTERNATIONAL QUALITY EQUITY FUND",        ticker:"GQG",     type:"Purchase",       units:"2152.0000", price:"30.664", amount:"-65988.30",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_2_Sept_2023.pdf" },
  { id:"r-b06", date:"", settlement:"2023-09-21", security:"PURPOSE TACTICAL ASSET ALLOC FD CLASS F",                ticker:"PTAF",    type:"Sale",           units:"4236.0000", price:"15.390", amount:"65190.00",   fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_2_Sept_2023.pdf" },
  { id:"r-b07", date:"2023-09-20", settlement:"2023-09-20", security:"IAA FEE FEE/FRAIS 08/2023",                              ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-82.16",     fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_2_Sept_2023.pdf" },
  { id:"r-b08", date:"2023-09-20", settlement:"2023-09-20", security:"PMA FEE FEE/FRAIS 08/2023",                              ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-882.40",    fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_2_Sept_2023.pdf" },
  { id:"r-b09", date:"2023-09-29", settlement:"2023-09-29", security:"BNS CORPORATE TIERED INVESTMENT SAVINGS ACCOUNT F",      ticker:"BNSISA",  type:"Interest",       units:"252.6580",  price:"1.000",  amount:"252.66",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_2_Sept_2023.pdf" },
  { id:"r-b10", date:"2023-09-30", settlement:"2023-09-30", security:"ISHARES S&P/TSX 60 INDEX ETF",                           ticker:"XIU",     type:"Distribution",   units:"2152.0000", price:"",       amount:"526.93",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_2_Sept_2023.pdf" },

  // ── November 2023 ──
  { id:"r-c01", date:"2023-10-31", settlement:"2023-10-31", security:"REGIMEN EQUITY PARTNERS SERIES IV PREFERRED SECURITIES", ticker:"REGPREF", type:"Dividend",       units:"10000.0000",price:"",       amount:"849.32",     fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_4_Nov_2023.pdf" },
  { id:"r-c02", date:"", settlement:"2023-11-15", security:"REVESCO PROPERTIES TRUST CLASS F",                       ticker:"RISE",    type:"Sale",           units:"1850.0000", price:"22.000", amount:"40700.00",   fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_4_Nov_2023.pdf" },
  { id:"r-c03", date:"", settlement:"2023-11-15", security:"REVESCO PROPERTIES TRUST CLASS F",                       ticker:"RISE",    type:"Purchase",       units:"1875.7921", price:"22.000", amount:"-41267.42",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_4_Nov_2023.pdf" },
  { id:"r-c04", date:"2023-11-01", settlement:"2023-11-01", security:"BANK OF NOVA SCOTIA SENIOR FIXED RATE NOTES 1.4% 01NOV2027", ticker:"BNS", type:"Bond Interest",  units:"",          price:"",       amount:"188.00",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_4_Nov_2023.pdf" },
  { id:"r-c05", date:"2023-11-21", settlement:"2023-11-21", security:"IAA FEE FEE/FRAIS 10/2023",                              ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-83.46",     fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_4_Nov_2023.pdf" },
  { id:"r-c06", date:"2023-11-21", settlement:"2023-11-21", security:"PMA FEE FEE/FRAIS 10/2023",                              ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-879.15",    fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_4_Nov_2023.pdf" },
  { id:"r-c07", date:"2023-11-28", settlement:"2023-11-28", security:"REVESCO PROPERTIES TRUST CLASS F",                       ticker:"RISE",    type:"Dividend",       units:"",          price:"",       amount:"340.06",     fxRate:"1.3550", currency:"USD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_4_Nov_2023.pdf" },
  { id:"r-c08", date:"2023-11-28", settlement:"2023-11-28", security:"REVESCO CANADIAN HOLDINGS LP CLASS B",                   ticker:"REVESCO", type:"Dividend",       units:"",          price:"",       amount:"270.74",     fxRate:"1.3550", currency:"USD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_4_Nov_2023.pdf" },
  { id:"r-c09", date:"2023-11-30", settlement:"2023-11-30", security:"REGIMEN EQUITY PARTNERS SERIES IV PREFERRED SECURITIES", ticker:"REGPREF", type:"Dividend",       units:"10000.0000",price:"",       amount:"821.92",     fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_4_Nov_2023.pdf" },

  // ── December 2023 ──
  { id:"r-d01", date:"2023-12-01", settlement:"2023-12-01", security:"BANK OF NOVA SCOTIA SENIOR FIXED RATE NOTES 1.4% 01NOV2027", ticker:"BNS", type:"Bond Interest",  units:"",          price:"",       amount:"112.00",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_5_Dec_2023.pdf" },
  { id:"r-d02", date:"2023-12-02", settlement:"2023-12-02", security:"GIC 2.25% 01APR2025",                                    ticker:"",        type:"Interest",       units:"",          price:"",       amount:"134.22",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_5_Dec_2023.pdf" },
  { id:"r-d03", date:"2023-12-02", settlement:"2023-12-02", security:"GLOBAL DIVERSIFIED PORTFOLIO — UNIT DISTRIBUTION",       ticker:"",        type:"Distribution",   units:"",          price:"",       amount:"462.92",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_5_Dec_2023.pdf" },
  { id:"r-d04", date:"2023-12-19", settlement:"2023-12-19", security:"IAA FEE FEE/FRAIS 11/2023",                              ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-81.45",     fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_5_Dec_2023.pdf" },
  { id:"r-d05", date:"2023-12-19", settlement:"2023-12-19", security:"PMA FEE FEE/FRAIS 11/2023",                              ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-875.00",    fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_5_Dec_2023.pdf" },
  { id:"r-d06", date:"2023-12-28", settlement:"2023-12-28", security:"REVESCO PROPERTIES TRUST CLASS F",                       ticker:"RISE",    type:"Dividend",       units:"",          price:"",       amount:"340.06",     fxRate:"1.3550", currency:"USD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_5_Dec_2023.pdf" },
  { id:"r-d07", date:"2023-12-28", settlement:"2023-12-28", security:"REVESCO CANADIAN HOLDINGS LP CLASS B",                   ticker:"REVESCO", type:"Dividend",       units:"",          price:"",       amount:"270.74",     fxRate:"1.3550", currency:"USD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_5_Dec_2023.pdf" },
  { id:"r-d08", date:"2023-12-29", settlement:"2023-12-29", security:"REGIMEN EQUITY PARTNERS SERIES IV PREFERRED SECURITIES", ticker:"REGPREF", type:"Dividend",       units:"10000.0000",price:"",       amount:"849.30",     fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_5_Dec_2023.pdf" },

  // ── January 2024 ──
  { id:"r-e01", date:"2024-01-02", settlement:"2024-01-02", security:"GIC 2.25% 01APR2025",                                    ticker:"",        type:"Interest",       units:"",          price:"",       amount:"134.22",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_6_Jan_2024.pdf" },
  { id:"r-e02", date:"2024-01-01", settlement:"2024-01-01", security:"BANK OF NOVA SCOTIA SENIOR FIXED RATE NOTES 1.4% 01NOV2027", ticker:"BNS", type:"Bond Interest",  units:"",          price:"",       amount:"112.00",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_6_Jan_2024.pdf" },
  { id:"r-e03", date:"", settlement:"2024-01-10", security:"ISHARES CORE S&P 500 INDEX CAD HEDGED ETF",              ticker:"XSP",     type:"Purchase",       units:"1950.0000", price:"50.730", amount:"-98923.50",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_6_Jan_2024.pdf" },
  { id:"r-e04", date:"", settlement:"2024-01-10", security:"ISHARES CORE S&P/TSX CAPPED COMPOSITE INDEX ETF",        ticker:"XIC",     type:"Purchase",       units:"990.0000",  price:"32.380", amount:"-32056.20",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_6_Jan_2024.pdf" },
  { id:"r-e05", date:"", settlement:"2024-01-10", security:"ISHARES CORE MSCI EAFE IMI INDEX CAN HEDGED ETF",        ticker:"XEF2",    type:"Sale",           units:"1830.0000", price:"30.500", amount:"55815.00",   fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_6_Jan_2024.pdf" },
  { id:"r-e06", date:"", settlement:"2024-01-10", security:"RBC 1.833% SR UNSECURED 31JUL28",                        ticker:"RY",      type:"Purchase",       units:"6000.0000", price:"89.000", amount:"-5340.00",   fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_6_Jan_2024.pdf" },
  { id:"r-e07", date:"", settlement:"2024-01-10", security:"TELUS CORP 2.75% 08JUL2026",                             ticker:"T",       type:"Purchase",       units:"16000.0000",price:"94.000", amount:"-15040.00",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_6_Jan_2024.pdf" },
  { id:"r-e08", date:"", settlement:"2024-01-10", security:"BNS CORPORATE TIERED INVESTMENT SAVINGS ACCOUNT F",      ticker:"BNSISA",  type:"Sale",           units:"16000.0000",price:"1.000",  amount:"16000.00",   fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_6_Jan_2024.pdf" },
  { id:"r-e09", date:"2024-01-22", settlement:"2024-01-22", security:"IAA FEE FEE/FRAIS 12/2023",                              ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-81.37",     fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_6_Jan_2024.pdf" },
  { id:"r-e10", date:"2024-01-22", settlement:"2024-01-22", security:"PMA FEE FEE/FRAIS 12/2023",                              ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-876.40",    fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_6_Jan_2024.pdf" },
  { id:"r-e11", date:"2024-01-31", settlement:"2024-01-31", security:"REGIMEN EQUITY PARTNERS SERIES IV PREFERRED SECURITIES", ticker:"REGPREF", type:"Dividend",       units:"10000.0000",price:"",       amount:"819.67",     fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_6_Jan_2024.pdf" },
  { id:"r-e12", date:"2024-01-31", settlement:"2024-01-31", security:"REVESCO PROPERTIES TRUST CLASS F",                       ticker:"RISE",    type:"Dividend",       units:"",          price:"",       amount:"340.06",     fxRate:"1.3550", currency:"USD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_6_Jan_2024.pdf" },
  { id:"r-e13", date:"2024-01-31", settlement:"2024-01-31", security:"REVESCO CANADIAN HOLDINGS LP CLASS B",                   ticker:"REVESCO", type:"Dividend",       units:"",          price:"",       amount:"270.74",     fxRate:"1.3550", currency:"USD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_6_Jan_2024.pdf" },
  { id:"r-e14", date:"", settlement:"2024-01-31", security:"ISHARES CORE S&P 500 INDEX CAD HEDGED ETF",              ticker:"XSP",     type:"Purchase",       units:"460.0000",  price:"51.300", amount:"-23598.00",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_6_Jan_2024.pdf" },

  // ── February 2024 ──
  { id:"r-f01", date:"2024-02-01", settlement:"2024-02-01", security:"BANK OF NOVA SCOTIA SENIOR FIXED RATE NOTES 1.4% 01NOV2027", ticker:"BNS", type:"Bond Interest",  units:"",          price:"",       amount:"112.00",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_7_Feb_2024.pdf" },
  { id:"r-f02", date:"2024-02-02", settlement:"2024-02-02", security:"GIC 2.25% 01APR2025",                                    ticker:"",        type:"Interest",       units:"",          price:"",       amount:"134.22",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_7_Feb_2024.pdf" },
  { id:"r-f03", date:"2024-02-20", settlement:"2024-02-20", security:"IAA FEE FEE/FRAIS 01/2024",                              ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-81.37",     fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_7_Feb_2024.pdf" },
  { id:"r-f04", date:"2024-02-20", settlement:"2024-02-20", security:"PMA FEE FEE/FRAIS 01/2024",                              ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-876.80",    fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_7_Feb_2024.pdf" },
  { id:"r-f05", date:"", settlement:"2024-02-05", security:"CANSO CORPORATE VALUE FUND SERIES F",                    ticker:"CANSO",   type:"Purchase",       units:"476.6581",  price:"31.469", amount:"-15000.00",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_7_Feb_2024.pdf" },
  { id:"r-f06", date:"", settlement:"2024-02-28", security:"KENSINGTON PRIVATE EQUITY FUND CLASS G",                 ticker:"KPE",     type:"Purchase",       units:"476.6581",  price:"33.618", amount:"-16023.02",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_7_Feb_2024.pdf" },
  { id:"r-f07", date:"2024-02-28", settlement:"2024-02-28", security:"REVESCO PROPERTIES TRUST CLASS F",                       ticker:"RISE",    type:"Dividend",       units:"",          price:"",       amount:"340.06",     fxRate:"1.3550", currency:"USD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_7_Feb_2024.pdf" },
  { id:"r-f08", date:"2024-02-29", settlement:"2024-02-29", security:"REGIMEN EQUITY PARTNERS SERIES IV PREFERRED SECURITIES", ticker:"REGPREF", type:"Dividend",       units:"10000.0000",price:"",       amount:"819.67",     fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_7_Feb_2024.pdf" },

  // ── March 2024 — Major equity restructuring ──
  { id:"r-g01", date:"2024-03-01", settlement:"2024-03-01", security:"BANK OF NOVA SCOTIA SENIOR FIXED RATE NOTES 1.4% 01NOV2027", ticker:"BNS", type:"Bond Interest",  units:"",          price:"",       amount:"156.00",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g02", date:"", settlement:"2024-03-05", security:"ISHARES S&P/TSX 60 INDEX ETF",                           ticker:"XIU",     type:"Sale",           units:"5497.0000", price:"32.860", amount:"180631.42",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g03", date:"", settlement:"2024-03-05", security:"BANK OF NOVA SCOTIA",                                    ticker:"BNS",     type:"Purchase",       units:"183.0000",  price:"65.930", amount:"-12065.19",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g04", date:"", settlement:"2024-03-05", security:"CGI INC",                                                ticker:"GIB.A",   type:"Purchase",       units:"76.0000",   price:"157.710",amount:"-11985.96",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g05", date:"", settlement:"2024-03-05", security:"CANADIAN NATURAL RESOURCES LTD",                        ticker:"CNQ",     type:"Purchase",       units:"124.0000",  price:"97.532", amount:"-12093.96",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g06", date:"", settlement:"2024-03-05", security:"CANADIAN PAC KANS CITY LTD",                            ticker:"CP",      type:"Purchase",       units:"103.0000",  price:"116.940",amount:"-12044.82",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g07", date:"", settlement:"2024-03-05", security:"CANADIAN TIRE LTD CLASS A",                             ticker:"CTC.A",   type:"Purchase",       units:"87.0000",   price:"138.970",amount:"-12090.39",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g08", date:"", settlement:"2024-03-05", security:"CONSTELLATION SOFTWARE INC",                            ticker:"CSU",     type:"Purchase",       units:"3.0000",    price:"3849.890",amount:"-11549.67", fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g09", date:"", settlement:"2024-03-05", security:"ENBRIDGE INC",                                          ticker:"ENB",     type:"Purchase",       units:"255.0000",  price:"47.188", amount:"-12032.95",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g10", date:"", settlement:"2024-03-05", security:"MANULIFE FINANCIAL CORP",                               ticker:"MFC",     type:"Purchase",       units:"371.0000",  price:"32.380", amount:"-12012.98",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g11", date:"", settlement:"2024-03-05", security:"METRO INC",                                             ticker:"MRU",     type:"Purchase",       units:"164.0000",  price:"73.490", amount:"-12052.36",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g12", date:"", settlement:"2024-03-05", security:"NUTRIEN LTD",                                           ticker:"NTR",     type:"Purchase",       units:"169.0000",  price:"71.290", amount:"-12048.01",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g13", date:"", settlement:"2024-03-05", security:"ROYAL BANK OF CANADA",                                  ticker:"RY",      type:"Purchase",       units:"92.0000",   price:"132.270",amount:"-12168.84",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g14", date:"", settlement:"2024-03-05", security:"TFI INTERNATIONAL INC",                                 ticker:"TFII",    type:"Purchase",       units:"60.0000",   price:"201.570",amount:"-12094.20",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g15", date:"", settlement:"2024-03-05", security:"TECK RESOURCES LTD CLASS B",                            ticker:"TECK.B",  type:"Purchase",       units:"225.0000",  price:"53.634", amount:"-12067.59",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g16", date:"", settlement:"2024-03-05", security:"TELUS CORP",                                            ticker:"T",       type:"Purchase",       units:"505.0000",  price:"23.770", amount:"-12003.85",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g17", date:"", settlement:"2024-03-05", security:"TORONTO DOMINION BANK",                                 ticker:"TD",      type:"Purchase",       units:"147.0000",  price:"81.700", amount:"-12009.90",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g18", date:"", settlement:"2024-03-18", security:"CANSO CORPORATE VALUE FUND SERIES F",                   ticker:"CANSO",   type:"Purchase",       units:"4361.7180", price:"12.566", amount:"-60800.00",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g19", date:"", settlement:"2024-03-18", security:"LYSANDER-CANSO CORPORATE VALUE BOND FUND SERIES F",     ticker:"LCVB",    type:"Sale",           units:"4352.9165", price:"13.930", amount:"60635.26",   fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g20", date:"2024-03-05", settlement:"2024-03-05", security:"ACM COMMERCIAL MORTGAGE FUND CLASS F",                  ticker:"ACMCMF",  type:"Dividend",       units:"",          price:"",       amount:"210.76",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g21", date:"2024-03-07", settlement:"2024-03-07", security:"FOUR QUADRANT GLOBAL REAL ESTATE PARTNERS TRUST CLASS J",ticker:"FQGRE",  type:"Dividend",       units:"",          price:"",       amount:"198.08",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g22", date:"2024-03-19", settlement:"2024-03-19", security:"IAA FEE FEE/FRAIS 02/2024",                             ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-80.42",     fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g23", date:"2024-03-19", settlement:"2024-03-19", security:"PMA FEE FEE/FRAIS 02/2024",                             ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-851.42",    fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g24", date:"2024-03-25", settlement:"2024-03-25", security:"CANSO CORPORATE VALUE FUND SERIES F",                   ticker:"CANSO",   type:"Dividend",       units:"",          price:"",       amount:"474.04",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g25", date:"2024-03-28", settlement:"2024-03-28", security:"ISHARES CORE S&P/TSX CAPPED COMPOSITE INDEX ETF",       ticker:"XIC",     type:"Distribution",   units:"990.0000",  price:"",       amount:"252.45",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g26", date:"2024-03-28", settlement:"2024-03-28", security:"RISE PROPERTIES TRUST CLASS F",                         ticker:"RISE",    type:"Dividend",       units:"",          price:"",       amount:"113.45",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_8_March_2024.pdf" },
  { id:"r-g27", date:"2024-03-31", settlement:"2024-03-31", security:"REGIMEN EQUITY PARTNERS SERIES IV PREFERRED SECURITIES", ticker:"REGPREF", type:"Dividend",      units:"10000.0000",price:"",       amount:"819.67",     fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_8_March_2024.pdf" },

  // ── April 2024 ──
  { id:"r-h01", date:"2024-04-01", settlement:"2024-04-01", security:"BANK OF NOVA SCOTIA SENIOR FIXED RATE NOTES 1.4% 01NOV2027", ticker:"BNS", type:"Bond Interest",  units:"",          price:"",       amount:"112.00",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_9_April_2024.pdf" },
  { id:"r-h02", date:"", settlement:"2024-04-22", security:"CANADIAN TIRE LTD CLASS A",                             ticker:"CTC.A",   type:"Sale",           units:"87.0000",   price:"129.870",amount:"11298.75",   fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_9_April_2024.pdf" },
  { id:"r-h03", date:"", settlement:"2024-04-22", security:"DOLLARAMA INC",                                         ticker:"DOL",     type:"Purchase",       units:"99.0000",   price:"113.110",amount:"-11197.89",  fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_9_April_2024.pdf" },
  { id:"r-h04", date:"2024-04-17", settlement:"2024-04-17", security:"IAA FEE FEE/FRAIS 03/2024",                             ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-81.37",     fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_9_April_2024.pdf" },
  { id:"r-h05", date:"2024-04-17", settlement:"2024-04-17", security:"PMA FEE FEE/FRAIS 03/2024",                             ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-877.50",    fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_9_April_2024.pdf" },
  { id:"r-h06", date:"2024-04-30", settlement:"2024-04-30", security:"REGIMEN EQUITY PARTNERS SERIES IV PREFERRED SECURITIES", ticker:"REGPREF", type:"Dividend",      units:"10000.0000",price:"",       amount:"819.67",     fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_9_April_2024.pdf" },
  { id:"r-h07", date:"2024-04-30", settlement:"2024-04-30", security:"REVESCO PROPERTIES TRUST CLASS F",                      ticker:"RISE",    type:"Dividend",       units:"",          price:"",       amount:"381.26",     fxRate:"1.3550", currency:"USD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_9_April_2024.pdf" },
  { id:"r-h08", date:"2024-04-30", settlement:"2024-04-30", security:"REVESCO CANADIAN HOLDINGS LP CLASS B",                  ticker:"REVESCO", type:"Dividend",       units:"",          price:"",       amount:"354.83",     fxRate:"1.3550", currency:"USD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_9_April_2024.pdf" },

  // ── May 2024 ──
  { id:"r-i01", date:"2024-05-01", settlement:"2024-05-01", security:"BANK OF NOVA SCOTIA SENIOR FIXED RATE NOTES 1.4% 01NOV2027", ticker:"BNS", type:"Bond Interest",  units:"",          price:"",       amount:"112.00",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_10_May_ 2024.pdf" },
  { id:"r-i02", date:"2024-05-21", settlement:"2024-05-21", security:"IAA FEE FEE/FRAIS 04/2024",                             ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-81.37",     fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_10_May_ 2024.pdf" },
  { id:"r-i03", date:"2024-05-21", settlement:"2024-05-21", security:"PMA FEE FEE/FRAIS 04/2024",                             ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-877.20",    fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_10_May_ 2024.pdf" },
  { id:"r-i04", date:"2024-05-31", settlement:"2024-05-31", security:"REGIMEN EQUITY PARTNERS SERIES IV PREFERRED SECURITIES", ticker:"REGPREF", type:"Dividend",      units:"10000.0000",price:"",       amount:"846.99",     fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_10_May_ 2024.pdf" },
  { id:"r-i05", date:"2024-05-31", settlement:"2024-05-31", security:"REVESCO PROPERTIES TRUST CLASS F",                      ticker:"RISE",    type:"Dividend",       units:"",          price:"",       amount:"381.26",     fxRate:"1.3550", currency:"USD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_10_May_ 2024.pdf" },
  { id:"r-i06", date:"2024-05-31", settlement:"2024-05-31", security:"REVESCO CANADIAN HOLDINGS LP CLASS B",                  ticker:"REVESCO", type:"Dividend",       units:"",          price:"",       amount:"354.83",     fxRate:"1.3550", currency:"USD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_10_May_ 2024.pdf" },
  { id:"r-i07", date:"", settlement:"2024-05-31", security:"ISHARES CORE S&P 500 INDEX ETF",                        ticker:"IVV",     type:"Purchase",       units:"196.0000",  price:"88.955", amount:"-17435.16",  fxRate:"",       currency:"USD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_10_May_ 2024.pdf" },
  { id:"r-i08", date:"", settlement:"2024-05-01", security:"BNS CORPORATE TIERED INVESTMENT SAVINGS ACCOUNT F",     ticker:"BNSISA",  type:"Sale",           units:"5000.0000", price:"1.000",  amount:"5000.00",    fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_10_May_ 2024.pdf" },

  // ── June 2024 ──
  { id:"r-j01", date:"2024-06-19", settlement:"2024-06-19", security:"IAA FEE FEE/FRAIS 05/2024",                             ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-81.51",     fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_11_June_ 2024.pdf" },
  { id:"r-j02", date:"2024-06-19", settlement:"2024-06-19", security:"PMA FEE FEE/FRAIS 05/2024",                             ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-878.30",    fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_11_June_ 2024.pdf" },
  { id:"r-j03", date:"2024-06-28", settlement:"2024-06-28", security:"REGIMEN EQUITY PARTNERS SERIES IV PREFERRED SECURITIES", ticker:"REGPREF", type:"Dividend",      units:"10000.0000",price:"",       amount:"819.67",     fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_11_June_ 2024.pdf" },
  { id:"r-j04", date:"2024-06-28", settlement:"2024-06-28", security:"REVESCO PROPERTIES TRUST CLASS F",                      ticker:"RISE",    type:"Dividend",       units:"",          price:"",       amount:"381.26",     fxRate:"1.3800", currency:"USD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_11_June_ 2024.pdf" },
  { id:"r-j05", date:"2024-06-28", settlement:"2024-06-28", security:"REVESCO CANADIAN HOLDINGS LP CLASS B",                  ticker:"REVESCO", type:"Dividend",       units:"",          price:"",       amount:"354.83",     fxRate:"1.3800", currency:"USD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_11_June_ 2024.pdf" },
  { id:"r-j06", date:"2024-06-28", settlement:"2024-06-28", security:"ISHARES CORE S&P/TSX CAPPED COMPOSITE INDEX ETF",       ticker:"XIC",     type:"Distribution",   units:"990.0000",  price:"",       amount:"263.34",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_11_June_ 2024.pdf" },
  { id:"r-j07", date:"2024-06-28", settlement:"2024-06-28", security:"ISHARES CORE S&P 500 INDEX CAD HEDGED ETF",             ticker:"XSP",     type:"Distribution",   units:"2410.0000", price:"",       amount:"674.80",     fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_11_June_ 2024.pdf" },
  { id:"r-j08", date:"2024-06-28", settlement:"2024-06-28", security:"ISHARES CORE MSCI EAFE IMI INDEX CAN HEDGED ETF",       ticker:"XEF2",    type:"Distribution",   units:"950.0000",  price:"",       amount:"86.83",      fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_11_June_ 2024.pdf" },
  { id:"r-j09", date:"2024-06-28", settlement:"2024-06-28", security:"ISHARES CORE S&P 500 INDEX ETF",                        ticker:"IVV",     type:"Distribution",   units:"196.0000",  price:"",       amount:"520.60",     fxRate:"",       currency:"USD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_11_June_ 2024.pdf" },

  // ── July 2024 ──
  { id:"r-k01", date:"2024-07-23", settlement:"2024-07-23", security:"IAA FEE FEE/FRAIS 06/2024",                             ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-79.51",     fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_12_July_2024.pdf" },
  { id:"r-k02", date:"2024-07-23", settlement:"2024-07-23", security:"GST FEE/FRAIS 06/2024",                                 ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-3.98",      fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_12_July_2024.pdf" },
  { id:"r-k03", date:"2024-07-23", settlement:"2024-07-23", security:"PMA FEE FEE/FRAIS 06/2024",                             ticker:"",        type:"Fee/Commission", units:"",          price:"",       amount:"-876.50",    fxRate:"",       currency:"CAD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_12_July_2024.pdf" },
  { id:"r-k11", date:"2024-07-31", settlement:"2024-07-31", security:"REGIMEN EQUITY PARTNERS SERIES IV PREFERRED SECURITIES", ticker:"REGPREF", type:"Dividend",     units:"10000.0000",price:"",       amount:"819.67",     fxRate:"",       currency:"CAD", account:"H11-YLF0-E", accountType:"IAA", source:"Investement_12_July_2024.pdf" },
  { id:"r-k12", date:"2024-07-31", settlement:"2024-07-31", security:"REVESCO PROPERTIES TRUST CLASS F",                      ticker:"RISE",    type:"Dividend",       units:"",          price:"",       amount:"381.26",     fxRate:"1.3809", currency:"USD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_12_July_2024.pdf" },
  { id:"r-k13", date:"2024-07-31", settlement:"2024-07-31", security:"REVESCO CANADIAN HOLDINGS LP CLASS B",                  ticker:"REVESCO", type:"Dividend",       units:"",          price:"",       amount:"354.83",     fxRate:"1.3809", currency:"USD", account:"H11-YLG0-E", accountType:"PMA", source:"Investement_12_July_2024.pdf" },
];

const TX_TYPES = ["Opening","Purchase","Sale","Dividend","Reinvested Dividend","Distribution","Interest","Return of Capital","Fee/Commission","Withholding Tax","Transfer","Transfer In","Transfer Out","Stock Split","FX Conversion","Bond Interest","Unit Distribution","Other"];

// ── Free-prompt follow-up system ────────────────────────────────────────────
type FreePromptIntent =
  | "covenant" | "maturity" | "interest" | "aje"
  | "variance" | "export"  | "loan"     | "continuity" | "general";

interface FollowUpTurn {
  id: string;
  userMsg: string;
  intent: FreePromptIntent;
  phase: "thinking" | "clarifying" | "working" | "done";
  clarifyChoice: string | null;
}

const FOLLOW_UP_CFG: Record<FreePromptIntent, { question: string | null; chips: string[] }> = {
  covenant:   {
    question: "Which covenant would you like to analyze in detail?",
    chips: ["DSCR Breach — Term Loan A", "Min Cash At Risk — Operating LOC", "Full compliance overview"],
  },
  maturity:   { question: null, chips: [] },
  interest:   {
    question: "Which period should I calculate accrued interest for?",
    chips: ["Year-end Dec 31, 2025", "Q1 2026 (Jan–Mar)", "Year-to-date May 2026"],
  },
  aje:        {
    question: "Which journal entry would you like to generate?",
    chips: ["Accrued interest — FY2025 year-end", "Current portion reclassification", "FX translation — USD Equipment Loan"],
  },
  variance:   { question: null, chips: [] },
  export:     {
    question: "What output format do you need?",
    chips: ["Excel workpaper (.xlsx)", "Notes disclosure draft (PDF)", "Management summary report"],
  },
  loan:       {
    question: "Which loan facility would you like to drill into?",
    chips: ["Term Loan A — RBC ($3.75M)", "Operating LOC — TD ($875K)", "Equipment Loan — HSBC (USD $1.125M)"],
  },
  continuity: { question: null, chips: [] },
  general:    { question: null, chips: [] },
};

function detectLtDebtIntent(msg: string): FreePromptIntent {
  const m = msg.toLowerCase();
  if (/covenant|breach|dscr|compliance|ratio|threshold|at risk/.test(m)) return "covenant";
  if (/matur|due date|upcoming|coming due|expir|timeline/.test(m))        return "maturity";
  if (/interest|accrued|accrual|expense|rate/.test(m))                    return "interest";
  if (/aje|journal|entr|posting|post|adjusting/.test(m))                  return "aje";
  if (/varianc|reconcil|differ|gap|discrepanc/.test(m))                   return "variance";
  if (/export|excel|pdf|report|notes|disclosure|output/.test(m))          return "export";
  if (/term loan|operating|loc|equipment|hsbc|rbc|\btd\b|facility/.test(m)) return "loan";
  if (/continu|roll.forward|schedule|borrowing|repay|movement/.test(m))   return "continuity";
  return "general";
}

export function AskLukaOverlay({ open, onOpenChange, onClose: onCloseProp }: AskLukaOverlayProps) {
  const handleClose = useCallback(() => {
    onCloseProp?.();
    onOpenChange(false);
  }, [onCloseProp, onOpenChange]);

  // ── framer-motion shell state ──
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [threadsSidebarCollapsed, setThreadsSidebarCollapsed] = useState(true);
  const [vpw, setVpw] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1440);
  const [workspaceSidebarCollapsed, setWorkspaceSidebarCollapsed] = useState(false);
  const [pinnedThreadsList, setPinnedThreadsList] = useState<ThreadItem[]>(initialPinnedThreads);
  const [recentThreadsList, setRecentThreadsList] = useState<ThreadItem[]>(initialRecentThreads);
  const [threadSearchVal, setThreadSearchVal] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasWorkspaceEngagement, setHasWorkspaceEngagement] = useState(false);
  const [showAddEngagementModal, setShowAddEngagementModal] = useState(false);
  const [workspaceEngagement, setWorkspaceEngagement] = useState<{ name: string; code: string; source?: "quickbooks" | "xero" } | null>(null);
  const [activeFlowPanel, setActiveFlowPanel] = useState<string | null>(null);
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([]);
  const [activityMinimized, setActivityMinimized] = useState(false);
  const [isActivityProcessing, setIsActivityProcessing] = useState(false);
  const activityIdCounter = useRef(0);
  const threadsFullscreenRef = useRef(false);
  const [selectedEngagementCtx, setSelectedEngagementCtx] = useState<{ client: string; id: string; yearEnd: string; status: string } | null>(null);
  const [showEngagementTrayCtx, setShowEngagementTrayCtx] = useState(false);
  const [engagementSearchCtx, setEngagementSearchCtx] = useState("");
  const engagementTrayCtxRef = useRef<HTMLDivElement>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [originalPromptVal, setOriginalPromptVal] = useState<string | null>(null);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [enhanceCount, setEnhanceCount] = useState(0);
  const [selectedModel, setSelectedModel] = useState("GPT-5.4 Pro");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const [showPlusTray, setShowPlusTray] = useState(false);
  const plusTrayRef = useRef<HTMLDivElement>(null);
  const [showPromptWindow, setShowPromptWindow] = useState(false);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const shellInputRef = useRef<HTMLTextAreaElement>(null);
  const [shellInputValue, setShellInputValue] = useState("");
  const [connectors, setConnectors] = useState([
    { id: "quickbooks", name: "QuickBooks",      connected: false, color: "#2CA01C", abbr: "QB" },
    { id: "xero",       name: "Xero",            connected: false, color: "#13B5EA", abbr: "XE" },
    { id: "google-drive", name: "Google Drive",  connected: false, color: "#4285F4", abbr: "GD" },
    { id: "slack",      name: "Slack",           connected: false, color: "#4A154B", abbr: "SL" },
    { id: "plaid",      name: "Plaid",           connected: false, color: "#111111", abbr: "PL" },
    { id: "hubspot",    name: "HubSpot",         connected: false, color: "#FF7A59", abbr: "HS" },
    { id: "stripe",     name: "Stripe",          connected: false, color: "#635BFF", abbr: "ST" },
    { id: "excel",      name: "Microsoft Excel", connected: false, color: "#217346", abbr: "XL" },
    { id: "outlook",    name: "Microsoft Outlook", connected: false, color: "#0078D4", abbr: "OL" },
  ]);

  const ENGAGEMENTS_PANEL = [
    { client: "Phoenix Marie",  id: "COM-DEF-May312024", yearEnd: "May 31, 2024", status: "Active", source: null            },
    { client: "Circooles",      id: "COM-DEF-Dec312024", yearEnd: "Dec 31, 2024", status: "Active", source: "quickbooks"     },
    { client: "Command+R",      id: "COM-DEF-Dec312024", yearEnd: "Dec 31, 2024", status: "Active", source: null             },
    { client: "Hourglass",      id: "REV-DEF-Dec312024", yearEnd: "Dec 31, 2024", status: "Active", source: "xero"           },
    { client: "Layers",         id: "REV-DEF-Dec312024", yearEnd: "Dec 31, 2024", status: "Active", source: "quickbooks"     },
    { client: "Quotient",       id: "COM-DEF-Dec312024", yearEnd: "Dec 31, 2024", status: "Active", source: "xero"           },
    { client: "Sisyphus",       id: "REV-DEF-Dec312024", yearEnd: "Dec 31, 2024", status: "Active", source: null             },
    { client: "Catalog",        id: "COM-DEF-Dec312024", yearEnd: "Dec 31, 2024", status: "Active", source: "quickbooks"     },
  ];

  const connectedConnectors = connectors.filter(c => c.connected);
  const availableConnectors = connectors.filter(c => !c.connected);

  const handleConnectConnector = useCallback((id: string) => {
    setConnectors(prev => prev.map(c => c.id === id ? { ...c, connected: true } : c));
    // If Plaid is connected during investment upload-prompt, auto-pull data
    if (id === "plaid") {
      setInvSchedSrcLabel(`Plaid — Richardson Wealth`);
      setInvExtracting(true);
      setTimeout(() => {
        setInvReviewRows(INV_MOCK_ROWS);
        setInvExtracting(false);
        setInvMissingMonthsPrompt([]);
        setInvContinuityOk(true);
      }, 2000);
    }
  }, []);

  // Thread pin/unpin/delete
  const unpinThread = (idx: number) => {
    setPinnedThreadsList(prev => {
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      if (item) setRecentThreadsList(r => [item, ...r]);
      return next;
    });
  };
  const pinThread = (idx: number) => {
    setRecentThreadsList(prev => {
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      if (item) setPinnedThreadsList(p => [...p, item]);
      return next;
    });
  };
  const deletePinnedThread = (idx: number) => setPinnedThreadsList(prev => prev.filter((_, i) => i !== idx));
  const deleteRecentThread  = (idx: number) => setRecentThreadsList(prev => prev.filter((_, i) => i !== idx));

  const handleActivityUpdate = useCallback((text: string, status: "done" | "processing" | "pending", highlight?: boolean) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    setActivityEntries(prev => {
      if (status === "done") {
        const existingIdx = prev.findIndex(e => e.text === text && e.status === "processing");
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], status: "done", timestamp };
          return updated;
        }
      }
      if (status === "processing") {
        const exists = prev.find(e => e.text === text && e.status === "processing");
        if (exists) return prev;
      }
      activityIdCounter.current += 1;
      return [...prev, { id: `act-${activityIdCounter.current}`, text, timestamp, status, highlight }];
    });
    setIsActivityProcessing(status === "processing");
  }, []);

  const autoResizeShellTextarea = useCallback(() => {
    const el = shellInputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 20;
    const maxHeight = lineHeight * 12;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, []);

  const handleShellInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setShellInputValue(val);
    if (val.endsWith("/")) { setShowPromptWindow(true); setSelectedPromptIndex(0); }
    else if (!val.includes("/")) setShowPromptWindow(false);
    requestAnimationFrame(autoResizeShellTextarea);
  };

  useEffect(() => { autoResizeShellTextarea(); }, [shellInputValue, autoResizeShellTextarea]);

  const shellPromptList = [
    "Variance Analysis", "General Ledger Analysis", "Account Reconciliation",
    "Bank Reconciliation", "Aged AR Analysis", "Loan Amortization", "Tax Payable",
    "Long-term Debt", "Investment Schedule",
  ];

  const handleShellPromptSelect = (prompt: string) => {
    if (prompt === "Account Reconciliation") {
      setShowPromptWindow(false); setShellInputValue("");
      setActiveFlowPanel("account-reconciliation"); setIsFullscreen(true);
      setThreadsSidebarCollapsed(true); setActivityEntries([]); setActivityMinimized(true);
      return;
    }
    if (prompt === "Tax Payable") {
      setShowPromptWindow(false); setShellInputValue("");
      setActiveFlowPanel("tax-payable"); setIsFullscreen(true);
      setThreadsSidebarCollapsed(true); setActivityEntries([]); setActivityMinimized(false);
      return;
    }
    // Route to existing rich-response flows
    if (prompt === "Long-term Debt" || prompt === "Investment Schedule") {
      setShowPromptWindow(false); setShellInputValue("");
      handlePromptSelect(prompt);
      return;
    }
    setShellInputValue(shellInputValue.replace(/\/$/, "") + "/" + prompt + " ");
    setShowPromptWindow(false);
    shellInputRef.current?.focus();
  };

  const handleShellKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showPromptWindow) return;
    if (e.key === "ArrowDown")  { e.preventDefault(); setSelectedPromptIndex(p => Math.min(p + 1, shellPromptList.length - 1)); }
    else if (e.key === "ArrowUp")    { e.preventDefault(); setSelectedPromptIndex(p => Math.max(p - 1, 0)); }
    else if (e.key === "Enter")      { e.preventDefault(); handleShellPromptSelect(shellPromptList[selectedPromptIndex]); }
    else if (e.key === "Escape")     { e.preventDefault(); setShowPromptWindow(false); }
  };

  const handleEnhancePrompt = useCallback(async () => {
    if (!shellInputValue.trim() || isEnhancing) return;
    setOriginalPromptVal(shellInputValue.trim());
    setIsEnhancing(true);
    await new Promise(r => setTimeout(r, 1200));
    setEnhancedPrompt(`Analyze and provide a detailed breakdown of ${shellInputValue.trim()}, including key insights, trends, and actionable recommendations based on the current financial data.`);
    setEnhanceCount(prev => prev + 1);
    setIsEnhancing(false);
  }, [shellInputValue, isEnhancing]);

  const handleReplaceWithEnhanced = useCallback(() => {
    if (!enhancedPrompt) return;
    setShellInputValue(enhancedPrompt);
    setEnhancedPrompt(null); setOriginalPromptVal(null); setEnhanceCount(0);
    shellInputRef.current?.focus();
  }, [enhancedPrompt]);

  const handleDismissEnhanced = useCallback(() => {
    setEnhancedPrompt(null); setOriginalPromptVal(null); setEnhanceCount(0);
  }, []);

  const handleOpenNewWindow = useCallback(() => {
    const w = window.open("", "_blank", "width=720,height=700,menubar=no,toolbar=no,location=no,status=no");
    if (w) { w.document.title = "Luka Chat"; w.document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Inter,sans-serif;"><div style="text-align:center;"><h2>⚡ Luka Chat</h2><p style="color:#888;">Chat window opened</p></div></div>`; }
  }, []);

  // Settings listener
  useEffect(() => {
    const handler = () => setSettingsOpen(true);
    window.addEventListener("open-luka-settings", handler);
    return () => window.removeEventListener("open-luka-settings", handler);
  }, []);

  // Sync lukaOpenStore
  useEffect(() => { setLukaOpen(open); }, [open]);

  // Viewport width tracking — keeps panel widths viewport-aware on resize
  useEffect(() => {
    const onResize = () => setVpw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Auto-collapse threads sidebar on narrow viewports
  useEffect(() => {
    if (vpw < 820) setThreadsSidebarCollapsed(true);
  }, [vpw]);

  // Close engagement tray on outside click
  useEffect(() => {
    if (!showEngagementTrayCtx) return;
    const handler = (e: MouseEvent) => {
      if (engagementTrayCtxRef.current && !engagementTrayCtxRef.current.contains(e.target as Node))
        setShowEngagementTrayCtx(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEngagementTrayCtx]);

  // Close plus tray on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (plusTrayRef.current && !plusTrayRef.current.contains(e.target as Node)) setShowPlusTray(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close model dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) setShowModelDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // SVG icons for model groups
  const openaiIcon = (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M22.28 9.37a5.98 5.98 0 0 0-.52-4.93 6.07 6.07 0 0 0-6.55-2.91A5.98 5.98 0 0 0 10.69 0a6.07 6.07 0 0 0-5.8 4.27 5.98 5.98 0 0 0-4 2.9 6.07 6.07 0 0 0 .74 7.12 5.98 5.98 0 0 0 .52 4.93 6.07 6.07 0 0 0 6.55 2.91A5.98 5.98 0 0 0 13.31 24a6.07 6.07 0 0 0 5.8-4.27 5.98 5.98 0 0 0 4-2.9 6.07 6.07 0 0 0-.74-7.12Z" fill="currentColor"/>
    </svg>
  );
  const googleIcon = (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4"/>
    </svg>
  );
  const anthropicIcon = (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M13.83 2H16.8l6.2 20h-2.97l-1.51-5.08h-7.25L9.76 22H6.8l7.04-20Zm1.37 3.63L12.45 14.2h5.5l-2.75-8.57ZM8.6 2H5.6L0 22h2.97L8.6 2Z" fill="#D4A27F"/>
    </svg>
  );
  const modelGroups = [
    { ecosystem: "ChatGPT Ecosystem", icon: openaiIcon, models: [
      { name: "GPT-5.4 Pro", desc: "Analyze deeply", badge: "Thinking" },
      { name: "GPT-5.4 Standard", desc: "Write / summarize", badge: "Fast" },
      { name: "o3 Reasoning", desc: "Complex calculations", badge: "Reasoning" },
    ]},
    { ecosystem: "Google · Gemini", icon: googleIcon, models: [
      { name: "Gemini 3.1 Pro", desc: "Large documents", badge: "Large documents" },
      { name: "Gemini 3.1 Flash", desc: "Fast analysis", badge: "Fast" },
    ]},
    { ecosystem: "Anthropic · Claude", icon: anthropicIcon, models: [
      { name: "Claude Opus 4.6", desc: "Deep analysis", badge: "Large documents" },
      { name: "Claude Sonnet 4.6", desc: "Cheap + fast", badge: "Fast" },
    ]},
  ];

  // ── Threads chat state ──
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"threads" | "workspaces">("threads");
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [sectionOpen, setSectionOpen] = useState({ pinned: true, recent: true, active: true });
  const toggleSection = (key: "pinned" | "recent" | "active") =>
    setSectionOpen(s => ({ ...s, [key]: !s[key] }));
  type ThreadFilter = "all" | "pinned" | "recent" | "this-week" | "last-week" | "this-month";
  const [threadFilter, setThreadFilter] = useState<ThreadFilter>("all");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const THREAD_FILTERS: { id: ThreadFilter; label: string; Icon: React.ElementType }[] = [
    { id: "all",        label: "All threads", Icon: LayoutList     },
    { id: "pinned",     label: "Pinned",      Icon: Pin            },
    { id: "recent",     label: "Recent",      Icon: Clock          },
    { id: "this-week",  label: "This week",   Icon: CalendarDays   },
    { id: "last-week",  label: "Last week",   Icon: CalendarRange  },
    { id: "this-month", label: "This month",  Icon: CalendarDays   },
  ];
  const activeFilterLabel = THREAD_FILTERS.find(f => f.id === threadFilter)?.label ?? "All threads";

  type WorkspaceFilter = "all" | "pinned" | "active" | "this-week" | "last-week" | "this-month";
  const [workspaceFilter, setWorkspaceFilter] = useState<WorkspaceFilter>("all");
  const [wsFilterDropdownOpen, setWsFilterDropdownOpen] = useState(false);
  const wsFilterDropdownRef = useRef<HTMLDivElement>(null);
  const WORKSPACE_FILTERS: { id: WorkspaceFilter; label: string; Icon: React.ElementType }[] = [
    { id: "all",        label: "All workspaces", Icon: LayoutList    },
    { id: "pinned",     label: "Pinned",          Icon: Pin           },
    { id: "active",     label: "Active",          Icon: Zap           },
    { id: "this-week",  label: "This week",       Icon: CalendarDays  },
    { id: "last-week",  label: "Last week",       Icon: CalendarRange },
    { id: "this-month", label: "This month",      Icon: CalendarDays  },
  ];
  const activeWsFilterLabel = WORKSPACE_FILTERS.find(f => f.id === workspaceFilter)?.label ?? "All workspaces";
  const [viewMode, setViewMode] = useState<"full" | "half">("half");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [showPromptPicker, setShowPromptPicker] = useState(false);
  const [hashFilter, setHashFilter] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [displayedResponse, setDisplayedResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [richResponseType, setRichResponseType] = useState<"gross-margin" | "loan-amortization" | "lt-debt" | "investment" | null>(null);
  const [loanAmortData,   setLoanAmortData]     = useState<LoanAmortData | null>(null);
  const [loanAmortStep,   setLoanAmortStep]     = useState<"idle" | "thinking" | "done">("idle");
  const [revealStep, setRevealStep] = useState(-1);
  // ── Agentic loan amort wizard ──
  const [amortPhase,      setAmortPhase]        = useState<"idle"|"search-wp"|"search-drives"|"found"|"wizard">("idle");
  const [amortWizStep,    setAmortWizStep]       = useState(1);
  const [amortSource,     setAmortSource]        = useState<AmortSource>("existing");
  const [amortSelDocId,   setAmortSelDocId]      = useState("adoc-1");
  const [amortDriveId,    setAmortDriveId]       = useState("gd-1");
  const [amortUploadFile, setAmortUploadFile]    = useState<string|null>(null);
  const [amortWizRect,    setAmortWizRect]       = useState<{left:number;right:number;bottom:number}|null>(null);
  // ── Agentic Long-term Debt (chat-based upload) ──
  const [ltDebtPhase,       setLtDebtPhase]      = useState<"idle"|"upload-prompt"|"done">("idle");
  const [ltDebtUploadFiles, setLtDebtUploadFiles] = useState<LtDebtFile[]>([]);
  const [ltDebtGenerated,   setLtDebtGenerated]  = useState(false);
  const [ltDebtSrcLabel,    setLtDebtSrcLabel]   = useState<string|null>(null);
  const [ltReviewRows,      setLtReviewRows]     = useState<LtDebtReviewRow[]>([]);
  const [ltProcessedFileIds,setLtProcessedFileIds]= useState<Set<string>>(new Set());
  // ── Add-more-loans turn ──
  const [addMoreLoansActive,  setAddMoreLoansActive]  = useState(false);
  const [addMoreLtFiles,      setAddMoreLtFiles]      = useState<LtDebtFile[]>([]);
  const [addMoreLtRows,       setAddMoreLtRows]       = useState<LtDebtReviewRow[]>([]);
  const [addMoreProcessedIds, setAddMoreProcessedIds] = useState<Set<string>>(new Set());
  const [addMoreDone,         setAddMoreDone]         = useState(false);
  // ── Investment Schedule (chat-based) ──
  const [invSchedPhase, setInvSchedPhase] = useState<"idle"|"thinking"|"engagement-check"|"source-check"|"tb-check"|"upload-prompt"|"review"|"done">("idle");
  const [invSourceConnected, setInvSourceConnected] = useState<string|null>(null); // "quickbooks" | "xero" | null
  const [invSchedGenerated, setInvSchedGenerated] = useState(false);
  const [invSchedSrcLabel, setInvSchedSrcLabel] = useState<string|null>(null);
  const [invEngagementConnected, setInvEngagementConnected] = useState(false);
  const [invSelectedEngId, setInvSelectedEngId] = useState<string|null>(null);
  const [invEngSearch, setInvEngSearch] = useState("");
  const [invTBChecking, setInvTBChecking] = useState(false);
  const [invTBFound, setInvTBFound] = useState<boolean|null>(null);
  const [invTBAnalyzing, setInvTBAnalyzing] = useState(false);
  const [invTBAnalysisStep, setInvTBAnalysisStep] = useState(0); // 0=none, 1-4=progressive reveal
  interface InvTBAnalysis { years: string; investmentAccounts: string[]; bankAccounts: string[]; recordingMethod: string; }
  const [invTBAnalysis, setInvTBAnalysis] = useState<InvTBAnalysis | null>(null);

  // Mock: engagements that have a TB already uploaded
  const MOCK_ENG_WITH_TB = new Set(["COM-CON-Dec312024","COM-TES-Dec312024","COM-KAU-Dec312024","COM-DEF-May312024"]);

  // Mock TB analysis results per engagement
  const MOCK_TB_ANALYSIS: Record<string, InvTBAnalysis> = {
    "COM-DEF-May312024":  { years: "1 year (FY 2024)", investmentAccounts: ["1310 · Investments at Cost", "1320 · Unrealized Gain/Loss", "4800 · Realized Gain on Investments", "4810 · Unrealized Gain on Investments"], bankAccounts: ["1100 · Cash — BMO Operating", "1110 · Cash — RBC USD", "1120 · Cash — TD Savings"], recordingMethod: "Accrual basis · monthly journal entries · investment income recorded separately" },
    "COM-CON-Dec312024":  { years: "2 years (FY 2023, FY 2024)", investmentAccounts: ["1310 · Investments at Cost", "4800 · Realized Gain on Investments"], bankAccounts: ["1100 · Cash — BMO Operating", "1110 · Cash — RBC USD"], recordingMethod: "Accrual basis · quarterly entries" },
    "COM-TES-Dec312024":  { years: "1 year (FY 2024)", investmentAccounts: ["1300 · Investment Portfolio"], bankAccounts: ["1100 · Cash — Operating"], recordingMethod: "Cash basis · annual entries" },
    "COM-KAU-Dec312024":  { years: "3 years (FY 2022, FY 2023, FY 2024)", investmentAccounts: ["1310 · Investments", "1315 · Marketable Securities", "4800 · Investment Income"], bankAccounts: ["1100 · Main Operating", "1105 · USD Account", "1110 · Savings"], recordingMethod: "Accrual basis · monthly · IFRS-compliant" },
  };
  const [invReviewRows, setInvReviewRows] = useState<InvReviewRow[]>([]);
  const [invSubmittedTxns, setInvSubmittedTxns] = useState<import("@/lib/luka/types").Transaction[]>([]);
  // ── Investment — Plaid connect flow ──
  const [invPlaidOpen, setInvPlaidOpen] = useState(false);
  const [invPlaidStep, setInvPlaidStep] = useState<'select'|'login'|'verifying'|'success'>('select');
  const [invPlaidInstitution, setInvPlaidInstitution] = useState<{id:string;name:string;abbr:string;color:string}|null>(null);
  const [invPlaidSearch, setInvPlaidSearch] = useState('');
  const [invPlaidUsername, setInvPlaidUsername] = useState('');
  const [invPlaidPassword, setInvPlaidPassword] = useState('');
  const [invPlaidShowPwd, setInvPlaidShowPwd] = useState(false);
  // ── Investment — upload flow ──
  const [invUploadOpen, setInvUploadOpen] = useState(false);
  const [invUploadFiles, setInvUploadFiles] = useState<InvUploadFile[]>([]);
  // null = no prompt; string[] = months missing (shown before review table)
  const [invMissingMonthsPrompt, setInvMissingMonthsPrompt] = useState<string[]|null>(null);
  const [invBrokerError, setInvBrokerError] = useState<string|null>(null);
  const [invContinuityOk, setInvContinuityOk] = useState<boolean>(false); // true when all uploaded files are contiguous
  const [invExtracting, setInvExtracting] = useState(false); // spinner during PDF extraction
  const [invTableSort, setInvTableSort] = useState<{ field: keyof InvReviewRow; dir: "asc" | "desc" } | null>(null);
  // files uploaded via the "Upload" button in the missing-months prompt
  const [invMissingReUploads, setInvMissingReUploads] = useState<Array<{id:string;name:string;ext:string}>>([]);
  // ── Free-prompt follow-up turns (context-aware after lt-debt summary) ──
  const [followUpTurns, setFollowUpTurns] = useState<FollowUpTurn[]>([]);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [editMode, setEditMode] = useState<'ask' | 'auto'>('auto');
  const inputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<number | null>(null);
  const revealRef = useRef<number | null>(null);
  const { files: attachedFiles, addFiles, removeFile, clearAll: clearFiles } = useAttachedFiles();

  // ── Store ──
  const loans = useStore(s => s.loans);
  const settings = useStore(s => s.settings);

  // ── Autopilot state ──
  const [autopilotLoanId, setAutopilotLoanId] = useState<string | null>(null);
  const [autopilotStep, setAutopilotStep] = useState<AutopilotStep | null>(null);
  const [activeWizardTab, setActiveWizardTab] = useState<AutopilotStep>("verification");
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  // Selected compilation workspace (replaces loan-based activeLoan for workspace flows)
  type CompWs = { id: string; name: string; ref: string; active: boolean; pinned: boolean };
  const [selectedCompWs, setSelectedCompWs] = useState<CompWs | null>(null);

  // Verification animation
  const [verifyPhase, setVerifyPhase] = useState<"idle" | "intro" | "msg2" | "reviewing" | "done">("idle");
  const [verifyRows, setVerifyRows] = useState<VerifyRow[]>([]);
  const verifyTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [lukaIsTyping, setLukaIsTyping] = useState(false);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const chatBottomRef   = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as Luka generates content (wizard view)
  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [verifyPhase, verifyRows.length, lukaIsTyping]);

  // Auto-scroll to bottom when a new follow-up turn is added (threads view)
  useEffect(() => {
    if (followUpTurns.length > 0) {
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
    }
  }, [followUpTurns.length]);

  // Auto-scroll when investment phase changes (new content appears)
  useEffect(() => {
    if (invSchedPhase !== "idle") {
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 100);
    }
  }, [invSchedPhase]);

  // Position agentic loan amort wizard above the input bar
  useLayoutEffect(() => {
    if (amortPhase !== "wizard") { setAmortWizRect(null); return; }
    const el = document.querySelector(".luka-gradient-border") as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAmortWizRect({ left: r.left, right: window.innerWidth - r.right, bottom: window.innerHeight - r.top + 8 });
  }, [amortPhase]);


  // Close filter dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setFilterDropdownOpen(false);
      }
      if (wsFilterDropdownRef.current && !wsFilterDropdownRef.current.contains(e.target as Node)) {
        setWsFilterDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Checklists
  const [isFirstYear, setIsFirstYear] = useState<boolean | null>(null);
  const [uploadedChecklists, setUploadedChecklists] = useState<string[]>([]);
  const [checklistUploading, setChecklistUploading] = useState(false);

  // Working Papers
  const [wpToggles, setWpToggles] = useState<Record<string, boolean>>(DEFAULT_WP_TOGGLES);

  // FS Mapping
  const [fsUploaded, setFsUploaded] = useState<string[]>([]);
  const [fsExtractFromLastYear, setFsExtractFromLastYear] = useState(true);
  const [fsSettingsDirty, setFsSettingsDirty] = useState(false);
  const [fsFontSize, setFsFontSize] = useState("12pt (Normal Default)");
  const [fsFontStyle, setFsFontStyle] = useState("Arial");
  const [fsCurrency, setFsCurrency] = useState("First Row Only");
  const [fsRounding, setFsRounding] = useState("Account 123");
  const [fsHeader, setFsHeader] = useState("First Page Only");
  const [fsFooter, setFsFooter] = useState("First Page Only");
  const [fsSaved, setFsSaved] = useState(false);
  const [fsFormOpen, setFsFormOpen] = useState(true);

  // Automation
  const [automationProgress, setAutomationProgress] = useState(0);
  const [automationElapsed, setAutomationElapsed] = useState(0);
  const [automationLog, setAutomationLog] = useState<{ text: string; done: boolean }[]>([]);
  const automationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Add New Workspace modal
  const [newWsModalOpen, setNewWsModalOpen] = useState(false);
  const [newWsSearch, setNewWsSearch] = useState("");
  const [newWsSelected, setNewWsSelected] = useState<string[]>([]);
  const [newWsSortAsc, setNewWsSortAsc] = useState(true);

  const WS_CLIENTS = [
    { id: "c1", name: "Test Company Inc.",     ref: "COM-TES-Dec312026", source: "quickbooks" },
    { id: "c2", name: "XYZ Solutions",         ref: "COM-XYZ-Dec312026", source: "xero"       },
    { id: "c3", name: "ABC Company Inc.",      ref: "COM-ABC-Dec312026", source: "xero"       },
    { id: "c4", name: "Beta Industries",       ref: "COM-BET-Dec312026", source: "quickbooks" },
    { id: "c5", name: "Simpsons & Co.",        ref: "COM-SIM-Dec312026", source: "quickbooks" },
    { id: "c6", name: "Alpha Enterprises",     ref: "COM-ALP-Dec312026", source: "xero"       },
  ];

  // Compilation workspaces for sidebar
  const COMP_WORKSPACES = [
    { id: "w1", name: "Test Company Inc.",     ref: "COM-TES-Dec312026", active: true,  pinned: true  },
    { id: "w2", name: "XYZ Solutions",         ref: "COM-XYZ-Dec312026", active: true,  pinned: true  },
    { id: "w3", name: "ABC Company Inc.",      ref: "COM-ABC-Dec312026", active: true,  pinned: false },
    { id: "w4", name: "Beta Industries",       ref: "COM-BET-Dec312026", active: true,  pinned: false },
    { id: "w5", name: "Simpsons & Co.",        ref: "COM-SIM-Dec312026", active: false, pinned: false },
    { id: "w6", name: "Alpha Enterprises",     ref: "COM-ALP-Dec312026", active: false, pinned: false },
  ];
  const [pinnedWs, setPinnedWs] = useState<string[]>(["w1", "w2"]);
  const togglePinWs = (id: string) => setPinnedWs(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  // Cleanup
  useEffect(() => {
    return () => {
      verifyTimeoutsRef.current.forEach(clearTimeout);
      if (automationIntervalRef.current) clearInterval(automationIntervalRef.current);
    };
  }, []);

  // ── Autopilot functions ──
  const markCompleted = useCallback((step: string) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  }, []);

  const initializeAutopilot = useCallback((loan: Loan) => {
    verifyTimeoutsRef.current.forEach(clearTimeout);
    verifyTimeoutsRef.current = [];
    if (automationIntervalRef.current) { clearInterval(automationIntervalRef.current); automationIntervalRef.current = null; }
    setAutopilotLoanId(loan.id);
    setAutopilotStep("init");
    setActiveWizardTab("verification");
    setCompletedSteps(new Set());
    setVerifyPhase("idle");
    setVerifyRows([]);
    setIsFirstYear(null);
    setUploadedChecklists([]);
    setWpToggles(DEFAULT_WP_TOGGLES);
    setFsUploaded([]);
    setFsSettingsDirty(false);
    setFsSaved(false);
    setAutomationProgress(0);
    setAutomationElapsed(0);
    setAutomationLog([]);
  }, []);

  const startVerification = useCallback((loan: Loan) => {
    setAutopilotStep("verification");
    setActiveWizardTab("verification");

    const rows: VerifyRow[] = [
      { label: "Entity name", value: settings.client || loan.name, showCheck: false },
      { label: "Engagement ID", value: loan.refNumber, showCheck: false },
      { label: "Year-end-date", value: settings.fiscalYearEnd, showCheck: false },
      { label: "Source connection", value: "Loaded successfully", showCheck: false },
      { label: "Trial Balance", value: "Loaded successfully", showCheck: false },
      { label: "Team members", value: `${settings.client || "Partner"}, Reviewer, Preparer`, showCheck: false },
      { label: "Components", value: "Header/Footer identified", showCheck: false },
      { label: "Signature", value: "Default signature identified", showCheck: false },
      { label: "Templates", value: "Engagement Letter identified", showCheck: false },
      { label: "Client Communications", value: "Client portal available", showCheck: false },
    ];

    const t0  = setTimeout(() => setLukaIsTyping(true), 0);
    const t1  = setTimeout(() => { setLukaIsTyping(false); setVerifyPhase("intro"); }, 1000);
    const t1b = setTimeout(() => setLukaIsTyping(true), 1400);
    const t2  = setTimeout(() => { setLukaIsTyping(false); setVerifyPhase("msg2"); }, 2300);
    const t2b = setTimeout(() => setLukaIsTyping(true), 2700);
    const t3 = setTimeout(() => {
      setLukaIsTyping(false);
      setVerifyPhase("reviewing");
      setVerifyRows(rows);
      rows.forEach((_, i) => {
        const t = setTimeout(() => {
          setVerifyRows(prev => prev.map((r, idx) => idx <= i ? { ...r, showCheck: true } : r));
          if (i === rows.length - 1) {
            const tdone = setTimeout(() => {
              setVerifyPhase("done");
              markCompleted("verification");
            }, 500);
            verifyTimeoutsRef.current.push(tdone);
          }
        }, i * 700);
        verifyTimeoutsRef.current.push(t);
      });
    }, 3100);
    verifyTimeoutsRef.current.push(t0, t1, t1b, t2, t2b, t3);
  }, [settings, markCompleted]);

  const startMagic = useCallback(() => {
    setAutopilotStep("automating");
    let step = 0;
    let elapsed = 0;
    automationIntervalRef.current = setInterval(() => {
      elapsed += 1;
      setAutomationElapsed(elapsed);
      if (step < AUTOMATION_MILESTONES.length) {
        const progress = AUTOMATION_MILESTONES[step];
        setAutomationProgress(progress);
        setAutomationLog(
          AUTOMATION_LOG_LINES.slice(0, step + 1).map((text, i) => ({
            text,
            done: i < step,
          }))
        );
        step++;
      }
      if (step >= AUTOMATION_MILESTONES.length) {
        clearInterval(automationIntervalRef.current!);
        automationIntervalRef.current = null;
        setTimeout(() => setAutopilotStep("observation"), 800);
      }
    }, 1500);
  }, []);

  const cancelAutopilot = useCallback(() => {
    verifyTimeoutsRef.current.forEach(clearTimeout);
    verifyTimeoutsRef.current = [];
    if (automationIntervalRef.current) { clearInterval(automationIntervalRef.current); automationIntervalRef.current = null; }
    setAutopilotLoanId(null);
    setSelectedCompWs(null);
    setAutopilotStep(null);
    setActiveWizardTab("verification");
    setCompletedSteps(new Set());
    setVerifyPhase("idle");
    setVerifyRows([]);
    setIsFirstYear(null);
    setUploadedChecklists([]);
    setChecklistUploading(false);
    setWpToggles(DEFAULT_WP_TOGGLES);
    setFsUploaded([]);
    setFsSettingsDirty(false);
    setFsSaved(false);
    setAutomationProgress(0);
    setAutomationElapsed(0);
    setAutomationLog([]);
  }, []);

  // ── LT Debt review row helpers ──
  const updateLtRow = useCallback((id: string, field: keyof LtDebtReviewRow, value: string) =>
    setLtReviewRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r)), []);
  const deleteLtRow = useCallback((id: string) =>
    setLtReviewRows(prev => prev.filter(r => r.id !== id)), []);
  const updateAddMoreRow = useCallback((id: string, field: keyof LtDebtReviewRow, value: string) =>
    setAddMoreLtRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r)), []);
  const deleteAddMoreRow = useCallback((id: string) =>
    setAddMoreLtRows(prev => prev.filter(r => r.id !== id)), []);

  // ── Investment Plaid helpers ──
  const resetInvPlaid = useCallback(() => {
    setInvPlaidOpen(false);
    setInvPlaidStep('select');
    setInvPlaidInstitution(null);
    setInvPlaidSearch('');
    setInvPlaidUsername('');
    setInvPlaidPassword('');
    setInvPlaidShowPwd(false);
  }, []);

  const handleInvPlaidVerify = useCallback(async () => {
    if (!invPlaidUsername.trim() || !invPlaidPassword.trim()) return;
    setInvPlaidStep('verifying');
    await new Promise<void>(r => setTimeout(r, 2000));
    setInvPlaidStep('success');
  }, [invPlaidUsername, invPlaidPassword]);

  // Select a compilation workspace from the sidebar — goes straight to verification
  const selectCompWorkspace = useCallback((ws: { id: string; name: string; ref: string; active: boolean; pinned: boolean }) => {
    verifyTimeoutsRef.current.forEach(clearTimeout);
    verifyTimeoutsRef.current = [];
    if (automationIntervalRef.current) { clearInterval(automationIntervalRef.current); automationIntervalRef.current = null; }
    setSelectedCompWs(ws);
    setAutopilotStep("verification");
    setActiveWizardTab("verification");
    setCompletedSteps(new Set());
    setVerifyPhase("idle");
    setVerifyRows([]);
    setIsFirstYear(null);
    setUploadedChecklists([]);
    setWpToggles(DEFAULT_WP_TOGGLES);
    setFsUploaded([]);
    setFsSettingsDirty(false);
    setFsSaved(false);
    setAutomationProgress(0);
    setAutomationElapsed(0);
    setAutomationLog([]);

    // Build verification rows from workspace data
    const rows: VerifyRow[] = [
      { label: "Entity name",           value: ws.name,                              showCheck: false },
      { label: "Engagement ID",         value: ws.ref,                               showCheck: false },
      { label: "Year-end-date",         value: "December 31, 2026",                  showCheck: false },
      { label: "Source connection",     value: "Loaded successfully",                showCheck: false },
      { label: "Trial Balance",         value: "Pulling data... You can proceed with the next steps", showCheck: false },
      { label: "Team members",          value: "Jim Lekar (Partner), Phoenix Marie (Reviewer), Dolf Ziggler (Preparer)", showCheck: false },
      { label: "Components",            value: "Header/Footer identified",           showCheck: false },
      { label: "Signature",             value: "Default signature identified",       showCheck: false },
      { label: "Templates",             value: "Engagement Letter identified\nManagement Responsibility Letter identified", showCheck: false },
      { label: "Client Communications", value: "Client portal/Mobile App. access available", showCheck: false },
    ];

    const t1 = setTimeout(() => setVerifyPhase("intro"), 0);
    const t2 = setTimeout(() => setVerifyPhase("msg2"), 1200);
    const t3 = setTimeout(() => {
      setVerifyPhase("reviewing");
      setVerifyRows(rows);
      rows.forEach((_, i) => {
        const t = setTimeout(() => {
          setVerifyRows(prev => prev.map((r, idx) => idx <= i ? { ...r, showCheck: true } : r));
          if (i === rows.length - 1) {
            const tdone = setTimeout(() => {
              setVerifyPhase("done");
              setCompletedSteps(prev => new Set([...prev, "verification"]));
            }, 500);
            verifyTimeoutsRef.current.push(tdone);
          }
        }, i * 600);
        verifyTimeoutsRef.current.push(t);
      });
    }, 2400);
    verifyTimeoutsRef.current.push(t1, t2, t3);
  }, []);

  const simulateChecklistUpload = useCallback(() => {
    setChecklistUploading(true);
    setTimeout(() => {
      setUploadedChecklists(["Client Acceptance.pdf", "Independence.pdf", "Knowledge of client business.pdf", "Planning.pdf"]);
      setChecklistUploading(false);
      markCompleted("checklists");
    }, 1200);
  }, [markCompleted]);

  const simulateFsUpload = useCallback(() => {
    setFsUploaded(["FS_2025.pdf", "Trial Balance_2025.pdf"]);
  }, []);

  // ── Threads chat handlers ──
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessage(val);
    const hashIdx = val.lastIndexOf("#");
    if (hashIdx !== -1) { setShowPromptPicker(true); setHashFilter(val.slice(hashIdx + 1)); }
    else { setShowPromptPicker(false); setHashFilter(""); }
  }, []);

  const handlePromptSelect = useCallback((promptLabel: string) => {
    setShowPromptPicker(false); setHashFilter(""); setMessage("");
    setSentMessage(promptLabel); setIsThinking(true);
    setAiResponse(null); setDisplayedResponse(""); setIsStreaming(false);
    setRichResponseType(null); setRevealStep(-1);
    setLoanAmortData(null); setLoanAmortStep("idle");
    setAmortPhase("idle"); setAmortWizStep(1); setAmortSource("existing"); setAmortUploadFile(null);
    setLtDebtPhase("idle");
    setLtDebtUploadFiles([]); setLtDebtGenerated(false); setLtDebtSrcLabel(null);
    setInvSchedPhase("idle"); setInvSchedGenerated(false); setInvSchedSrcLabel(null); setInvReviewRows([]); setInvMissingMonthsPrompt(null); setInvEngagementConnected(false); setInvSelectedEngId(null); setInvEngSearch(""); setInvTBChecking(false); setInvTBFound(null); setInvBrokerError(null); setInvSourceConnected(null); setInvTBAnalyzing(false); setInvTBAnalysisStep(0); setInvTBAnalysis(null); setInvContinuityOk(false); setInvExtracting(false); setInvTableSort(null); setInvSubmittedTxns([]);
    setFollowUpTurns([]);
    if (streamRef.current) clearTimeout(streamRef.current);
    if (revealRef.current) clearTimeout(revealRef.current);
    const isGrossMargin    = promptLabel.toLowerCase().includes("gross profit margin");
    const isLoanAmort      = promptLabel.toLowerCase().includes("loan amortization");
    const isLtDebt         = promptLabel.toLowerCase().includes("long-term debt") || promptLabel.toLowerCase().includes("long term debt") || promptLabel.toLowerCase().includes("long-term asset");
    const isInvSched       = promptLabel.toLowerCase().includes("investment schedule");
    setTimeout(() => {
      setIsThinking(false);
      if (isLtDebt) {
        setRichResponseType("lt-debt"); setAiResponse("__rich__");
        setLtDebtPhase("upload-prompt");
      } else if (isInvSched) {
        setRichResponseType("investment"); setAiResponse("__rich__");
        setInvSchedPhase("thinking");
        setTimeout(() => setInvSchedPhase("engagement-check"), 2200);
      } else if (isLoanAmort) {
        setRichResponseType("loan-amortization"); setAiResponse("__rich__");
        // Kick off agentic search sequence
        setAmortPhase("search-wp");
        setTimeout(() => setAmortPhase("search-drives"), 2200);
        setTimeout(() => setAmortPhase("found"),         4200);
        setTimeout(() => setAmortPhase("wizard"),        5400);
      } else if (isGrossMargin) {
        setRichResponseType("gross-margin"); setAiResponse("__rich__");
        let s = 0;
        const reveal = () => { setRevealStep(s); s++; if (s <= 5) revealRef.current = window.setTimeout(reveal, 600); };
        reveal();
      } else {
        const full = `Here's an overview of **${promptLabel}** with key insights and analysis.\n\nThis covers the essential metrics, trends, and recommendations based on your current financial data.`;
        setAiResponse(full); setIsStreaming(true);
        let idx = 0;
        const stream = () => {
          if (idx < full.length) { const c = Math.floor(Math.random() * 3) + 1; idx = Math.min(idx + c, full.length); setDisplayedResponse(full.slice(0, idx)); streamRef.current = window.setTimeout(stream, 15 + Math.random() * 25); }
          else setIsStreaming(false);
        };
        stream();
      }
    }, 2500);
  }, []);

  const handleLoanAmortSubmit = useCallback((data: LoanAmortData) => {
    setLoanAmortData(data);
    setLoanAmortStep("thinking");
    setTimeout(() => setLoanAmortStep("done"), 2200);
  }, []);

  const handleClarifyChoice = useCallback((turnId: string, choice: string) => {
    setFollowUpTurns(prev => prev.map(t => t.id === turnId
      ? { ...t, clarifyChoice: choice, phase: "working" } : t));
    setTimeout(() => {
      setFollowUpTurns(prev => prev.map(t => t.id === turnId
        ? { ...t, phase: "done" } : t));
    }, 1600);
  }, []);

  // ── Shared follow-up trigger — used by typed messages AND suggestion chips ──
  const triggerFollowUp = useCallback((msg: string) => {
    const intent = detectLtDebtIntent(msg);
    const cfg = FOLLOW_UP_CFG[intent];
    const id = `fu-${Date.now()}`;
    setFollowUpTurns(prev => [...prev, { id, userMsg: msg, intent, phase: "thinking", clarifyChoice: null }]);
    setTimeout(() => {
      setFollowUpTurns(prev => prev.map(t => t.id === id
        ? { ...t, phase: cfg.question ? "clarifying" : "working" } : t));
      if (!cfg.question) {
        setTimeout(() => {
          setFollowUpTurns(prev => prev.map(t => t.id === id ? { ...t, phase: "done" } : t));
        }, 1600);
      }
    }, 1600);
  }, []);

  // Determines if we're in "follow-up context" (a loan/debt summary is visible)
  const isFollowUpContext = (richResponseType === "lt-debt" && ltDebtGenerated) ||
    (richResponseType === "loan-amortization" && loanAmortStep !== "idle");

  const handleSend = useCallback(() => {
    if (!message.trim()) return;
    const msg = message.trim(); setMessage(""); setShowPromptPicker(false);

    // ── Context-aware follow-up when any loan/debt summary is visible ──
    if (isFollowUpContext) {
      triggerFollowUp(msg);
      return;
    }

    // ── Default generic response ──
    setSentMessage(msg); setIsThinking(true); setAiResponse(null);
    setDisplayedResponse(""); setIsStreaming(false);
    if (streamRef.current) clearTimeout(streamRef.current);
    const full = `Here's my response to "${msg}". This analysis covers the key aspects and provides actionable insights based on the available data.`;
    setTimeout(() => {
      setIsThinking(false); setAiResponse(full); setIsStreaming(true);
      let idx = 0;
      const stream = () => {
        if (idx < full.length) { const c = Math.floor(Math.random() * 3) + 1; idx = Math.min(idx + c, full.length); setDisplayedResponse(full.slice(0, idx)); streamRef.current = window.setTimeout(stream, 15 + Math.random() * 25); }
        else setIsStreaming(false);
      };
      stream();
    }, 2500);
  }, [message, isFollowUpContext, triggerFollowUp]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !showPromptPicker && message.trim()) { e.preventDefault(); handleSend(); }
  }, [showPromptPicker, message, handleSend]);

  if (!open) return null;

  const allThreads = [...pinnedThreads, ...recentThreads];
  const activeLoans = loans.filter(l => l.status === "Active");
  const activeLoan = loans.find(l => l.id === autopilotLoanId) ?? null;
  const isAutomating = autopilotStep === "automating";
  const isWizardStep = autopilotStep && ["verification","checklists","letters","workingpapers","fsmapping","magic"].includes(autopilotStep);
  const formatElapsed = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ── Wizard tab bar ──
  const renderTabBar = () => (
    <div className="flex items-center gap-0 px-4 pt-3 pb-0 border-b border-border shrink-0 overflow-x-auto">
      {WIZARD_TABS.map(tab => {
        const isDone = completedSteps.has(tab.id);
        const isActive = activeWizardTab === tab.id;
        const isLocked = tab.id === "magic"
          ? !["verification","checklists","letters","workingpapers","fsmapping"].every(s => completedSteps.has(s))
          : false;
        return (
          <button
            key={tab.id}
            onClick={() => {
              if (isLocked) return;
              setActiveWizardTab(tab.id);
              sectionRefs.current[tab.id]?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 text-base font-medium border-b-2 transition-colors whitespace-nowrap shrink-0",
              isActive
                ? "border-primary text-foreground bg-primary/5"
                : isDone
                  ? "border-transparent text-foreground hover:text-foreground hover:border-border"
                  : isLocked
                    ? "border-transparent text-foreground cursor-not-allowed"
                    : "border-transparent text-foreground hover:text-foreground hover:border-border"
            )}
          >
            {isDone && !isActive && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
            {tab.id === "magic" && <Sparkles className="w-4 h-4 shrink-0" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  // ── Verification step ──
  const renderVerification = () => (
    <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">

        {/* ── Task header chip ── */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-primary/8 border border-primary/15 text-base font-medium text-primary/80">
            <div className="w-4 h-4 rounded-[4px] bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center">
              <LukaIcon size={8} />
            </div>
            Verifying workspace — <span className="font-semibold text-primary">{selectedCompWs?.name}</span>
            <span className="text-primary/40">·</span>
            <span className="text-primary/60 font-normal">{selectedCompWs?.ref}</span>
          </div>
        </div>

        {/* ── Luka message 1 ── */}
        {(verifyPhase === "intro" || verifyPhase === "msg2" || verifyPhase === "reviewing" || verifyPhase === "done") && (
          <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0 shadow-sm shadow-primary/25">
              <LukaIcon size={14} />
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base font-semibold text-foreground">Luka</span>
                <span className="text-base text-foreground">Engagement AI</span>
              </div>
              <div className="bg-background rounded-[8px] border border-border/60 px-4 py-3 shadow-sm text-base text-foreground leading-relaxed">
                Hi! I am <span className="text-primary font-semibold">Luka</span> — your year-end-engagement automation preparer.
              </div>
            </div>
          </div>
        )}

        {/* ── Luka message 2 ── */}
        {(verifyPhase === "msg2" || verifyPhase === "reviewing" || verifyPhase === "done") && (
          <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0 shadow-sm shadow-primary/25">
              <LukaIcon size={14} />
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base font-semibold text-foreground">Luka</span>
                <span className="text-base text-foreground">Engagement AI</span>
              </div>
              <div className="bg-background rounded-[8px] border border-border/60 px-4 py-3 shadow-sm text-base text-foreground leading-relaxed">
                I'll gather the info needed for this engagement while you relax. I'll review the details and sources, then update you on the verification results shortly.
              </div>
            </div>
          </div>
        )}

        {/* ── Tool-use card (Reviewing...) ── */}
        {(verifyPhase === "reviewing" || verifyPhase === "done") && verifyRows.length > 0 && (
          <div className="flex items-start gap-3 animate-in fade-in duration-300">
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0 shadow-sm shadow-primary/25">
              <LukaIcon size={14} />
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base font-semibold text-foreground">Luka</span>
                <span className="text-base text-foreground">Engagement AI</span>
                {verifyPhase === "reviewing" && (
                  <span className="flex items-center gap-1 text-base text-primary/70 animate-pulse">
                    <span className="w-1 h-1 rounded-full bg-primary inline-block" />
                    working…
                  </span>
                )}
              </div>
              {/* Tool output card */}
              <div className="rounded-[8px] border border-border overflow-hidden shadow-sm">
                {/* Card header */}
                <div className={cn(
                  "flex items-center gap-2.5 px-4 py-2.5 border-b border-border",
                  verifyPhase === "done"
                    ? "bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30"
                    : "bg-muted/50"
                )}>
                  {verifyPhase === "done" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                  )}
                  <span className={cn("text-base font-semibold", verifyPhase === "done" ? "text-green-700 dark:text-green-400" : "text-foreground")}>
                    {verifyPhase === "done" ? "Verification complete" : "Reviewing engagement…"}
                  </span>
                  {verifyPhase === "done" && (
                    <span className="ml-auto text-base text-green-600/70 font-medium">{verifyRows.length} checks passed</span>
                  )}
                </div>
                {/* Rows */}
                <div className="bg-background divide-y divide-border/40">
                  {verifyRows.map((row, i) => (
                    <div key={i} className={cn("flex items-start px-4 py-2.5 gap-3 transition-all duration-200", row.showCheck ? "opacity-100" : "opacity-40")}>
                      <div className="shrink-0 mt-0.5">
                        {row.showCheck
                          ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                          : <div className="w-5 h-5 rounded-full border-2 border-border/60" />
                        }
                      </div>
                      <span className="text-base text-foreground w-36 shrink-0 leading-relaxed">{row.label}</span>
                      {row.showCheck && (
                        <span className="text-base text-foreground flex-1 leading-relaxed whitespace-pre-line">{row.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Post-verification message */}
              {verifyPhase === "done" && (
                <div className="mt-3 bg-background rounded-[8px] border border-border/60 px-4 py-3 shadow-sm text-base text-foreground leading-relaxed animate-in fade-in duration-300">
                  All checks passed ✓ — your workspace is ready. You can now continue with the next steps in the tabs above, or upload the required files to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Required files card (as agent follow-up) ── */}
        {verifyPhase === "done" && (
          <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 duration-400">
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-sm shadow-amber-400/25">
              <span className="text-white text-base font-bold">!</span>
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base font-semibold text-foreground">Required Files</span>
                <span className="text-base text-foreground">Must upload before automation</span>
              </div>
              <div className="bg-background rounded-[8px] border border-amber-200 dark:border-amber-800/40 overflow-hidden shadow-sm">
                <div className="bg-amber-50 dark:bg-amber-950/20 px-4 py-2.5 border-b border-amber-100 dark:border-amber-900/30">
                  <p className="text-base font-semibold text-amber-800 dark:text-amber-300">Must have files for seamless automation</p>
                </div>
                <div className="divide-y divide-amber-100/60 dark:divide-amber-900/20">
                  {[
                    { n: 1, label: "Last year finalized FS", sub: "With Notes" },
                    { n: 2, label: "Mapped TB", sub: "Same FS" },
                    { n: 3, label: "Corporate Tax Returns", sub: "Filed T2" },
                  ].map(item => (
                    <div key={item.n} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="w-5 h-5 rounded-[4px] bg-amber-500 flex items-center justify-center shrink-0 text-white text-base font-bold">{item.n}</div>
                      <div className="flex-1">
                        <p className="text-base font-medium text-foreground">{item.label}</p>
                        <p className="text-base text-foreground">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 bg-amber-50/50 dark:bg-amber-950/10 border-t border-amber-100 dark:border-amber-900/20">
                  <p className="text-base text-amber-600 dark:text-amber-400">*Note: Only PDF file type allowed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Typing indicator ── */}
        {lukaIsTyping && (
          <div className="flex items-start gap-3 animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0 shadow-sm shadow-primary/25">
              <LukaIcon size={14} />
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base font-semibold text-foreground">Luka</span>
                <span className="text-base text-foreground">Engagement AI</span>
              </div>
              <div className="bg-background rounded-[8px] border border-border/60 px-4 py-3 shadow-sm inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* ── Rerun ── */}
        {verifyPhase === "done" && (
          <div className="flex justify-end pb-2">
            <button
              onClick={() => { if (selectedCompWs) selectCompWorkspace(selectedCompWs); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] border border-border bg-background text-base text-foreground hover:bg-muted/50 hover:border-primary/30 transition-all shadow-sm"
            >
              <RotateCcw className="w-4 h-4" /> Rerun verification
            </button>
          </div>
        )}

    </div>
  );

  // ── shared helper: agent message wrapper ──
  const AgentMsg = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
      <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0 shadow-sm shadow-primary/25">
        <LukaIcon size={14} />
      </div>
      <div className="flex-1 pt-0.5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-base font-semibold text-foreground">Luka</span>
          <span className="text-base text-foreground">Engagement AI</span>
        </div>
        <div className="bg-background rounded-[8px] border border-border/60 px-4 py-3 shadow-sm text-base text-foreground leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );

  // ── shared helper: tab header chip ──
  const TabChip = ({ label, icon: Icon }: { label: string; icon: React.ElementType }) => (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-primary/8 border border-primary/15 text-base font-medium text-primary/80">
        <Icon className="w-5 h-5 text-primary" />
        {label}
      </div>
    </div>
  );

  // ── shared helper: file chip ──
  const FileChip = ({ name, onRemove }: { name: string; onRemove: () => void }) => (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] border border-border bg-background shadow-sm text-base text-foreground">
      <FileText className="w-4 h-4 text-primary/60" />
      {name}
      <button onClick={onRemove} className="ml-1 w-5 h-5 rounded-full hover:bg-muted/60 flex items-center justify-center text-foreground hover:text-foreground transition-colors">×</button>
    </div>
  );

  // ── shared helper: upload area ──
  const UploadArea = ({ uploaded, uploading, onUpload }: { uploaded: boolean; uploading?: boolean; onUpload: () => void }) => (
    <div
      onClick={!uploaded && !uploading ? onUpload : undefined}
      className={cn(
        "border-2 border-dashed rounded-[8px] p-7 text-center transition-all",
        !uploaded && !uploading ? "border-primary/30 bg-primary/[0.02] hover:bg-primary/[0.04] hover:border-primary/50 cursor-pointer" : "border-border/50 bg-muted/10"
      )}
    >
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-base text-foreground">Uploading…</p>
        </div>
      ) : uploaded ? (
        <div className="flex flex-col items-center gap-2">
          <CheckCircle2 className="w-7 h-7 text-green-500" />
          <p className="text-base text-green-600 font-medium">Uploaded successfully</p>
        </div>
      ) : (
        <>
          <div className="w-9 h-9 rounded-[8px] bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-4.5 h-4.5 text-primary" />
          </div>
          <p className="text-base text-foreground"><span className="text-primary font-medium">Click to upload</span> or drag and drop</p>
          <p className="text-base text-foreground mt-1">PDF files only</p>
        </>
      )}
    </div>
  );

  // ── Checklists step ──
  const renderChecklists = () => (
    <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">

        <TabChip label="Checklists" icon={CheckCircle2} />

        <AgentMsg>
          The next steps are now unlocked. Switch between the tabs above in any order. For Checklists — select the client operations details:
        </AgentMsg>

        {/* Question card */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0 shadow-sm shadow-primary/25 opacity-0 pointer-events-none" />
          <div className="flex-1">
            <div className="bg-background rounded-[8px] border border-border/60 px-4 py-4 shadow-sm space-y-3">
              <p className="text-base font-medium text-foreground">Is this a first-year of operations for this client?</p>
              <div className="flex gap-2">
                {["Yes", "No"].map(opt => (
                  <button
                    key={opt}
                    onClick={() => {
                      setIsFirstYear(opt === "Yes");
                      if (opt === "No") simulateChecklistUpload();
                    }}
                    className={cn(
                      "px-5 py-1.5 rounded-[8px] border text-base font-medium transition-all",
                      isFirstYear === (opt === "Yes")
                        ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                        : "border-border text-foreground hover:bg-muted/50 hover:border-primary/40"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isFirstYear === false && (
          <>
            <AgentMsg>
              Upload last year checklists to mirror responses to the current year. Checklists required for compilations are highlighted below:
            </AgentMsg>

            {/* Upload + checklist card side by side */}
            <div className="flex items-start gap-3">
              <div className="w-8 shrink-0" />
              <div className="flex-1 grid grid-cols-5 gap-4">
                {/* Upload area */}
                <div className="col-span-3">
                  <UploadArea
                    uploaded={uploadedChecklists.length > 0}
                    uploading={checklistUploading}
                    onUpload={simulateChecklistUpload}
                  />
                  {uploadedChecklists.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {uploadedChecklists.map(f => (
                        <FileChip key={f} name={f} onRemove={() => setUploadedChecklists(p => p.filter(x => x !== f))} />
                      ))}
                    </div>
                  )}
                </div>
                {/* Checklist panel */}
                <div className="col-span-2">
                  <div className="rounded-[8px] border border-border bg-background shadow-sm overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-border bg-muted/30">
                      <p className="text-base font-semibold text-foreground">Last year checklists</p>
                    </div>
                    <div className="divide-y divide-border/40">
                      {["Client acceptance & continuance", "Independence", "Knowledge of client business", "Planning"].map(item => (
                        <div key={item} className="flex items-center justify-between px-3 py-2">
                          <span className="text-base text-foreground">{item}</span>
                          {uploadedChecklists.length > 0
                            ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                            : <div className="w-5 h-5 rounded-full border-2 border-border/50 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {isFirstYear === true && (
          <AgentMsg>
            No checklists required for a first-year engagement — proceeding with fresh templates.
          </AgentMsg>
        )}
    </div>
  );

  // ── Letters step ──
  const renderLetters = () => (
    <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">

        <TabChip label="Letters" icon={FileText} />

        <AgentMsg>
          I've loaded the default <strong className="font-semibold text-foreground">Engagement Letter</strong> and <strong className="font-semibold text-foreground">Management Responsibility Letter</strong> as per your engagement template. Feel free to review and adjust them. For more options click '+ Letter'.
        </AgentMsg>

        {/* Letter templates card */}
        <div className="flex items-start gap-3">
          <div className="w-8 shrink-0" />
          <div className="flex-1 rounded-[8px] border border-border bg-background shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
              <span className="text-base font-semibold text-foreground flex-1">Letter Templates</span>
              <span className="text-base text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full font-medium">*Required</span>
            </div>
            <div className="divide-y divide-border/40 px-4">
              {[
                { label: "Engagement Letter Template*", value: "Engagement Letter CSRS 4200" },
                { label: "Management Responsibility Letter Template*", value: "Management Responsibility L..." },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="w-7 h-7 rounded-[6px] bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base text-foreground mb-1">{row.label}</p>
                    <div className="flex items-center gap-2 border border-border rounded-[8px] px-3 py-1.5 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
                      <span className="text-base text-foreground flex-1 truncate">{row.value}</span>
                      <ChevronDown className="w-5 h-5 text-foreground shrink-0" />
                    </div>
                  </div>
                  <button
                    onClick={() => markCompleted("letters")}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] border border-border bg-background text-base text-foreground hover:bg-muted/50 hover:border-primary/40 transition-all shrink-0 shadow-sm"
                  >
                    <Eye className="w-4 h-4" /> Review
                  </button>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-border bg-muted/10">
              <button className="flex items-center gap-2 text-base text-primary hover:text-primary/80 transition-colors font-medium">
                <Plus className="w-5 h-5" /> Add Letter
              </button>
            </div>
          </div>
        </div>

    </div>
  );

  // ── Working Papers step ──
  const renderWorkingPapers = () => (
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">

        <TabChip label="Working Papers" icon={FileText} />

        <AgentMsg>
          Here are the working paper threads ready for automation. I've pre-selected the suggested papers for this engagement based on your trial balance accounts and materiality.
        </AgentMsg>

        {/* WP list card */}
        <div className="flex items-start gap-3">
          <div className="w-8 shrink-0" />
          <div className="flex-1 rounded-[8px] border border-border bg-background shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-muted/30">
              <div className="w-5 h-5 rounded-[4px] bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0">
                <LukaIcon size={9} />
              </div>
              <span className="text-base font-semibold text-foreground flex-1">Luka suggested working paper threads</span>
              <span className="text-base text-foreground">{Object.values(wpToggles).filter(Boolean).length} selected</span>
            </div>
            <div className="divide-y divide-border/40">
              {WP_THREADS.map(wp => (
                <div key={wp.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="w-7 h-7 rounded-[6px] bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-5 h-5 text-primary/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-foreground">
                      {wp.label}
                      {wp.required && <span className="text-destructive ml-0.5 font-normal">*</span>}
                    </p>
                    <p className="text-base text-foreground mt-0.5 leading-relaxed">{wp.desc}</p>
                  </div>
                  <button
                    onClick={() => { setWpToggles(prev => ({ ...prev, [wp.id]: !prev[wp.id] })); markCompleted("workingpapers"); }}
                    className={cn("relative w-9 h-5 rounded-full transition-colors shrink-0 mt-1", wpToggles[wp.id] ? "bg-primary" : "bg-muted")}
                  >
                    <span className={cn("absolute left-0 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", wpToggles[wp.id] ? "translate-x-4" : "translate-x-0.5")} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

    </div>
  );

  // ── FS & Mapping step ──
  const renderFSMapping = () => (
    <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">

        <TabChip label="FS & Account Mapping" icon={FileText} />

        <AgentMsg>
          To ensure a consistent experience, share the details below for the same year to recreate the mapping and FS settings tailored to your client.
        </AgentMsg>

        <div className="flex items-start gap-3">
          <div className="w-8 shrink-0" />
          <div className="flex-1 space-y-4">
            {/* Upload area */}
            <UploadArea uploaded={fsUploaded.length > 0} onUpload={simulateFsUpload} />
            {fsUploaded.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {fsUploaded.map(f => (
                  <FileChip key={f} name={f} onRemove={() => setFsUploaded(p => p.filter(x => x !== f))} />
                ))}
              </div>
            )}

            {/* FS Settings card */}
            <div className="rounded-[8px] border border-border bg-background shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
                <span className="text-base font-semibold text-foreground flex-1">Financial Statement Settings</span>
                <div className="flex items-center gap-2">
                  <span className="text-base text-foreground">Last Year Files</span>
                  <button
                    onClick={() => setFsExtractFromLastYear(!fsExtractFromLastYear)}
                    className={cn("relative w-9 h-5 rounded-full transition-colors", fsExtractFromLastYear ? "bg-primary" : "bg-muted")}
                  >
                    <span className={cn("absolute left-0 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", fsExtractFromLastYear ? "translate-x-4" : "translate-x-0.5")} />
                  </button>
                  <span className="text-base text-foreground">Global Default</span>
                </div>
              </div>

              <div className="px-4 py-3">
                <button
                  onClick={() => setFsFormOpen(!fsFormOpen)}
                  className="flex items-center gap-2 w-full text-base font-medium text-foreground hover:text-primary transition-colors mb-3"
                >
                  <FileText className="w-5 h-5 text-foreground" />
                  Formatting &amp; Data
                  <span className="ml-auto text-foreground text-base leading-none">{fsFormOpen ? "−" : "+"}</span>
                </button>

                {fsFormOpen && (
                  <div className="grid grid-cols-3 gap-3 animate-in fade-in duration-200">
                    {[
                      { label: "Font Size", val: fsFontSize, set: setFsFontSize, opts: ["10pt", "11pt", "12pt (Normal Default)", "14pt"] },
                      { label: "Font Style", val: fsFontStyle, set: setFsFontStyle, opts: ["Arial", "Times New Roman", "Calibri", "Helvetica"] },
                      { label: "Currency Symbol Placement", val: fsCurrency, set: setFsCurrency, opts: ["First Row Only", "All Rows", "None"] },
                      { label: "Rounding Account", val: fsRounding, set: setFsRounding, opts: ["Account 123", "Account 456", "Account 789"] },
                      { label: "Header Placement", val: fsHeader, set: setFsHeader, opts: ["First Page Only", "All Pages", "No Header"] },
                      { label: "Footer Placement", val: fsFooter, set: setFsFooter, opts: ["First Page Only", "All Pages", "No Footer"] },
                    ].map(field => (
                      <div key={field.label}>
                        <p className="text-base text-foreground mb-1">{field.label}</p>
                        <div className="relative">
                          <select
                            value={field.val}
                            onChange={e => { field.set(e.target.value); setFsSettingsDirty(true); }}
                            className="w-full text-base border border-border rounded-[8px] px-3 py-2 bg-background appearance-none pr-7 focus:outline-none focus:border-primary hover:border-primary/40 transition-colors"
                          >
                            {field.opts.map(o => <option key={o}>{o}</option>)}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground pointer-events-none" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end mt-4">
                  <button
                    disabled={!fsSettingsDirty && !fsSaved}
                    onClick={() => { setFsSaved(true); setFsSettingsDirty(false); markCompleted("fsmapping"); }}
                    className={cn(
                      "px-4 py-1.5 rounded-[8px] text-base font-medium transition-all",
                      fsSettingsDirty
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
                        : fsSaved
                          ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
                          : "bg-muted text-foreground cursor-not-allowed"
                    )}
                  >
                    {fsSaved ? "Saved ✓" : "Save Settings"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

    </div>
  );

  // ── Magic step ──
  const renderMagic = () => {
    const allDone = ["verification","checklists","letters","workingpapers","fsmapping"].every(s => completedSteps.has(s));
    return (
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">

          <TabChip label="Magic — Ready to Automate" icon={Sparkles} />

          <AgentMsg>
            All engagement documents gathered successfully. Review the automation summary below, then click <strong className="font-semibold text-foreground">Start Magic</strong> when you're ready.
          </AgentMsg>

          {/* Summary cards */}
          <div className="flex items-start gap-3">
            <div className="w-8 shrink-0" />
            <div className="flex-1 space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[8px] border border-border bg-background px-4 py-3.5 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-5 h-5 text-foreground" />
                    <span className="text-xl font-bold text-foreground">12 mins</span>
                  </div>
                  <p className="text-base font-medium text-foreground">Completion time</p>
                  <p className="text-base text-foreground mt-0.5">After file analysis</p>
                </div>
                <div className="rounded-[8px] border border-border bg-background px-4 py-3.5 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded-[4px] bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0">
                      <LukaIcon size={8} />
                    </div>
                    <span className="text-xl font-bold text-foreground">4.5 hrs</span>
                  </div>
                  <p className="text-base font-medium text-foreground">Time saved</p>
                  <p className="text-base text-foreground mt-0.5">This engagement</p>
                </div>
              </div>

              {/* Credits */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-[8px] border border-primary/15 bg-primary/[0.03] shadow-sm">
                <div className="w-8 h-8 rounded-[8px] bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground">1.5 credits estimated</p>
                  <p className="text-base text-foreground">Based on uploaded files and Trial Balance data</p>
                </div>
              </div>

              {/* Steps status */}
              {!allDone && (
                <div className="rounded-[8px] border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/30 px-4 py-3">
                  <p className="text-base font-medium text-amber-800 dark:text-amber-300 mb-2">Complete all steps to unlock automation:</p>
                  <div className="flex flex-wrap gap-2">
                    {["verification","checklists","letters","workingpapers","fsmapping"].map(s => (
                      <span key={s} className={cn(
                        "flex items-center gap-1 text-base px-2 py-1 rounded-[6px] font-medium",
                        completedSteps.has(s)
                          ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      )}>
                        {completedSteps.has(s) ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-amber-400" />}
                        {s === "fsmapping" ? "FS Mapping" : s.charAt(0).toUpperCase() + s.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="flex flex-col items-center gap-3 pt-1 pb-2">
                <button
                  onClick={startMagic}
                  className="flex items-center gap-2.5 px-10 py-3.5 rounded-[8px] text-base font-semibold text-white bg-gradient-to-r from-[#8649F1] to-[#2355A4] hover:opacity-90 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all"
                >
                  <Sparkles className="w-4 h-4" /> Start Magic
                </button>
                <div className="flex items-center gap-2 text-base text-destructive/80">
                  <Lock className="w-4 h-4" />
                  File will be <span className="font-semibold">locked during automation</span> — team access paused
                </div>
              </div>

            </div>
          </div>
    </div>
    );
  };

  // ── Automation in progress ──
  const renderAutomating = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Progress header */}
      <div className="px-6 pt-4 pb-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-semibold text-foreground tracking-wider uppercase">Automation Progress</span>
          <span className="text-base font-mono text-foreground bg-muted px-2.5 py-1 rounded-md">{formatElapsed(automationElapsed)}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8649F1] to-[#2355A4] rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${automationProgress}%` }}
            />
          </div>
          <span className="text-base font-bold text-foreground w-10 text-right">{automationProgress}%</span>
        </div>
      </div>

      {/* Centered content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
        {/* Large pulsing orb */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-[hsl(265_80%_55%)/20] blur-2xl scale-150 animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#8649F1] to-[#2355A4] flex items-center justify-center shadow-2xl shadow-primary/40 luka-thinking-spin">
            <LukaIcon size={36} />
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">Luka is working</h3>
        </div>

        {/* Log lines */}
        <div className="w-full max-w-xs space-y-2 text-center">
          {automationLog.map((line, i) => {
            const isActive = i === automationLog.length - 1;
            return (
              <div key={i} className={cn("flex items-center justify-center gap-2 text-base animate-in fade-in duration-300", isActive ? "text-foreground" : "text-foreground")}>
                {isActive ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-500/50 shrink-0" />
                )}
                <span>{line.text}</span>
              </div>
            );
          })}
        </div>

        {/* Stop / Notify */}
        <div className="flex items-center gap-4">
          <button
            onClick={cancelAutopilot}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive/30 text-base text-destructive hover:bg-destructive/5 transition-colors"
          >
            <Square className="w-5 h-5" fill="currentColor" /> Stop
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-base text-foreground hover:bg-muted/50 transition-colors">
            <Mail className="w-5 h-5" /> Notify Me
          </button>
        </div>
      </div>
    </div>
  );

  // ── Observation mode ──
  const renderObservation = () => (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <LukaMessage>
          I have successfully completed the initial engagement automation for this engagement.
        </LukaMessage>
        <LukaMessage>
          I'm now in <strong>Observation Mode</strong> — monitoring your file and suggesting intelligent next actions.
        </LukaMessage>

        {/* File Maturity card */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-foreground" />
              <span className="text-base font-bold text-foreground uppercase tracking-wider">File Maturity</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative flex items-center justify-center w-7 h-7 rounded-lg hover:bg-muted transition-colors">
                <Bell className="w-4 h-4 text-foreground" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-white text-base flex items-center justify-center font-bold">5</span>
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
                <Settings className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-5">
            {/* Donut */}
            <div className="relative w-16 h-16 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={DONUT_DATA} cx="50%" cy="50%" innerRadius={22} outerRadius={30} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
                    {DONUT_DATA.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base font-bold text-foreground">72%</span>
              </div>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 flex-1">
              {[
                { v: "26 WPs", c: "text-green-600" },
                { v: "2 docs missing", c: "text-amber-600" },
                { v: "3 variances", c: "text-amber-600" },
                { v: "0/2 signed", c: "text-destructive" },
              ].map(s => (
                <div key={s.v} className={cn("text-base font-semibold", s.c)}>{s.v}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Action items */}
        <div className="space-y-2">
          {[
            { icon: "bar", msg: "5 new transactions detected since last sync. Refresh TB?", action: "Refresh TB", color: "text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30" },
            { icon: "bank", msg: "Bank balance differs from ledger by $18,420. Investigate?", action: "Investigate", color: "text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30" },
            { icon: "file", msg: "New file uploaded: LoanAgreementFinal.pdf. Attach to debt WP?", action: "Attach", color: "text-primary bg-primary/10 hover:bg-primary/20" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors">
              <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                {item.icon === "bar" ? <Bell className="w-4 h-4 text-foreground" /> : item.icon === "bank" ? <Building2 className="w-4 h-4 text-foreground" /> : <FileText className="w-4 h-4 text-foreground" />}
              </div>
              <p className="text-base text-foreground flex-1">{item.msg}</p>
              <button className={cn("text-base font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0", item.color)}>
                {item.action}
              </button>
            </div>
          ))}
        </div>

        {/* Suggested Actions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-bold text-foreground uppercase tracking-wider">Suggested Actions</span>
            <span className="text-base text-foreground">5 active</span>
          </div>
          <div className="space-y-1">
            {["Review covenant compliance threshold breach", "Reconcile accrued interest variance ($1,247)", "Generate FS disclosure note for long-term debt", "Update current portion classification", "Sign off on capital asset schedule"].map(action => (
              <div key={action} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                <p className="text-base text-foreground flex-1">{action}</p>
                <button className="text-base text-primary opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">→</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat input (restored in observation mode) */}
      <div className={cn("pb-4 pt-2 shrink-0", viewMode === "full" ? "px-10" : "px-5")}>
        <div className="border border-border rounded-[12px] overflow-hidden bg-background dark:bg-card hover:border-primary/30 transition-all duration-200 luka-gradient-border">
          <div className="px-4 pt-2.5 pb-2">
            <input type="text" placeholder="Type # for prompts or just ask anything..." className="w-full bg-transparent h-8 placeholder:text-foreground outline-none border-none text-base text-foreground" />
          </div>
          <div className="px-3 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-500">✨</span>
              <span className="text-base font-medium text-foreground">Gemini 3 Flash</span>
            </div>
            <Button size="icon" className="h-8 w-8 rounded-full bg-gradient-to-br from-[#8649F1] to-[#2355A4] hover:opacity-90 text-white shadow-sm">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const isWorkspaceTab = activeTab === "workspaces";
  const PANEL_W_COLLAPSED = Math.min(640, Math.floor(vpw * 0.98));
  const PANEL_W_EXPANDED  = Math.min(909, Math.floor(vpw * 0.98));

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0.6 }}
            animate={
              isFullscreen
                ? { x: 0, y: 0, opacity: 1, width: "100vw" }
                : isMinimized
                ? { x: 0, y: "calc(100% - 56px)", opacity: 1, width: threadsSidebarCollapsed ? PANEL_W_COLLAPSED : PANEL_W_EXPANDED }
                : { x: 0, y: 0, opacity: 1, width: threadsSidebarCollapsed ? PANEL_W_COLLAPSED : PANEL_W_EXPANDED }
            }
            exit={{ x: "100%", opacity: 0.6 }}
            transition={{ type: "spring", damping: 32, stiffness: 280, mass: 0.85 }}
            className={`fixed top-0 right-0 z-50 flex ${isFullscreen ? "w-full h-full" : "h-full rounded-l-2xl luka-panel-clip"}`}
            style={isFullscreen ? undefined : { maxWidth: "98vw" }}
          >
            {/* LHS threads sidebar */}
            {!isWorkspaceTab && (
              <motion.div
                className="luka-threads-sidebar"
                animate={{ width: threadsSidebarCollapsed ? 0 : 269 }}
                transition={{ type: "spring", damping: 32, stiffness: 280, mass: 0.85 }}
                style={{ overflow: threadsSidebarCollapsed ? "hidden" : "visible", position: "relative", zIndex: 10 }}
              >
                <div className={`flex flex-col h-full ${threadsSidebarCollapsed ? "items-center" : ""}`} style={{ overflowX: "visible", overflowY: "auto", scrollbarWidth: "none" }}>
                  {threadsSidebarCollapsed ? (
                    <div className="flex flex-col items-center pt-3 pb-1 gap-2">
                      <motion.button
                        whileHover={{ scale: 1.12, backgroundColor: "hsl(270 60% 55% / 0.08)" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setThreadsSidebarCollapsed(false)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 relative group"
                        style={{ color: "hsl(var(--muted-foreground))", background: "hsl(var(--muted) / 0.5)", border: "1px solid hsl(var(--border) / 0.6)" }}
                      >
                        <motion.div animate={{ x: [0, 2, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                          <ChevronsRight size={16} />
                        </motion.div>
                        <div className="lhs-tooltip">Expand sidebar</div>
                      </motion.button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                        <div className="flex items-center gap-2 px-4 pt-4 pb-3">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <defs><linearGradient id="luka-grad-sm2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#9747FF" /><stop offset="100%" stopColor="#115697" /></linearGradient></defs>
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#luka-grad-sm2)" />
                          </svg>
                          <span className="text-lg font-bold" style={{ background: "linear-gradient(135deg, #9747FF, #115697)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Luka</span>
                          <motion.button
                            whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                            onClick={() => setThreadsSidebarCollapsed(true)}
                            className="ml-auto w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200"
                            style={{ color: "hsl(var(--muted-foreground))", background: "hsl(var(--muted) / 0.4)", border: "1px solid hsl(var(--border) / 0.5)" }}
                          >
                            <ChevronsLeft size={15} />
                          </motion.button>
                        </div>
                        <div className="px-3 mb-3">
                          <motion.button whileHover={{ scale: 1.01, x: 2 }} whileTap={{ scale: 0.98 }} className="luka-new-thread-btn">
                            <PlusCircle size={16} /><span>Start new thread</span>
                          </motion.button>
                        </div>
                        <div className="px-3 mb-4">
                          <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input type="text" placeholder="Search" value={threadSearchVal} onChange={e => setThreadSearchVal(e.target.value)} className="luka-thread-search" />
                          </div>
                        </div>
                        <div className="px-4 mb-1"><span className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Pinned</span></div>
                        <div className="px-2 mb-4">
                          {pinnedThreadsList.map((thread, i) => (
                            <ThreadRow key={`pinned-${i}`} thread={thread} icon={<Pin size={13} className="text-muted-foreground shrink-0" />} isPinned onPinToggle={() => unpinThread(i)} onDelete={() => deletePinnedThread(i)} />
                          ))}
                        </div>
                        <div className="px-4 mb-1"><span className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Recents</span></div>
                        <div className="px-2">
                          {recentThreadsList.map((thread, i) => (
                            <ThreadRow key={`recent-${i}`} thread={thread} icon={<MessageSquare size={13} className="text-muted-foreground shrink-0" />} isPinned={false} onPinToggle={() => pinThread(i)} onDelete={() => deleteRecentThread(i)} />
                          ))}
                        </div>
                        <div className="px-4 pt-3 pb-4">
                          <motion.button whileHover={{ x: 2 }} className="text-base font-medium" style={{ color: "hsl(var(--link-color))" }}>View all</motion.button>
                        </div>
                      </div>
                      <div className="border-t" style={{ borderColor: "hsl(var(--border))" }}>
                        <div className="px-2 pt-2 pb-1">
                          <motion.button whileHover={{ x: 2, backgroundColor: "hsl(270 60% 55% / 0.06)" }} whileTap={{ scale: 0.99 }} onClick={() => setSettingsOpen(true)} className="luka-thread-item w-full">
                            <Settings size={14} className="text-muted-foreground shrink-0" /><span className="truncate">AI Settings</span>
                          </motion.button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* Main area */}
            <div className="flex-1 min-w-0 flex flex-col bg-card border-l relative" style={{ borderColor: "hsl(var(--border))" }}>
              {/* Header */}
              <div className="grid items-center px-4 py-3 border-b" style={{ borderColor: "hsl(var(--border))", gridTemplateColumns: "auto 1fr auto" }}>
                <div className="flex items-center gap-1">
                  {activeTab === "threads" && threadsSidebarCollapsed ? (
                    <TooltipProvider><Tooltip><TooltipTrigger asChild>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setThreadsSidebarCollapsed(false)} className="action-icon" style={{ color: "hsl(0 0% 0%)" }}>
                        <Menu size={18} />
                      </motion.button>
                    </TooltipTrigger><TooltipContent side="bottom"><p>Open Threads</p></TooltipContent></Tooltip></TooltipProvider>
                  ) : (
                    <span className="w-8 h-8" />
                  )}
                </div>

                {/* Tabs */}
                <LayoutGroup><div className="flex items-center justify-center">
                  <div className="relative flex items-center gap-1 rounded-full p-1" style={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 20% 92%)", boxShadow: "0 6px 18px -8px hsl(250 40% 40% / 0.18), 0 1px 2px hsl(220 30% 50% / 0.05)" }}>
                    {([{ id: "threads", label: "Threads", icon: MessageCircle }, { id: "workspaces", label: "Workspace", icon: Zap }] as const).map(tab => {
                      const isActive = activeTab === tab.id;
                      const Icon = tab.icon;
                      return (
                        <motion.button key={tab.id}
                          onClick={() => {
                            setActiveTab(prevTab => {
                              if (tab.id === "workspaces" && prevTab !== "workspaces") { threadsFullscreenRef.current = isFullscreen; setIsFullscreen(true); setThreadsSidebarCollapsed(true); }
                              else if (tab.id === "threads" && prevTab === "workspaces") { setIsFullscreen(threadsFullscreenRef.current); }
                              return tab.id;
                            });
                          }}
                          whileTap={{ scale: 0.96 }}
                          className="relative z-10 pl-2.5 pr-5 py-1.5 rounded-full text-base font-semibold transition-colors duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer"
                          style={{ color: isActive ? "hsl(0 0% 100%)" : "hsl(222 30% 18%)" }}
                        >
                          {isActive && (
                            <motion.div layoutId="luka-tab-ind" className="absolute inset-0 rounded-full"
                              style={{ background: "linear-gradient(135deg, #6C2FF2 0%, #8A5BFF 55%, #B084FF 100%)", boxShadow: "0 6px 16px -6px hsl(265 80% 55% / 0.55), inset 0 1px 0 hsl(0 0% 100% / 0.25)" }}
                              transition={{ type: "spring", stiffness: 420, damping: 32 }}
                            />
                          )}
                          <Icon size={14} className="relative z-10" />
                          <span className="relative z-10">{tab.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div></LayoutGroup>

                {/* Window controls */}
                <div className="flex items-center gap-1 justify-end">
                  <TooltipProvider>
                    <Tooltip><TooltipTrigger asChild>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleOpenNewWindow} className="action-icon" aria-label="Open in new window"><ExternalLink size={16} /></motion.button>
                    </TooltipTrigger><TooltipContent side="bottom"><p>Open in new window</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsFullscreen(p => !p)} className={`action-icon ${isFullscreen ? "action-icon-active" : ""}`} aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
                        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                      </motion.button>
                    </TooltipTrigger><TooltipContent side="bottom"><p>{isFullscreen ? "Exit fullscreen" : "Fullscreen"}</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsMinimized(p => !p)} className="action-icon" aria-label={isMinimized ? "Restore" : "Minimize"}><Minus size={16} /></motion.button>
                    </TooltipTrigger><TooltipContent side="bottom"><p>{isMinimized ? "Restore" : "Minimize"}</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleClose} className="action-icon" aria-label="Close"><X size={16} /></motion.button>
                    </TooltipTrigger><TooltipContent side="bottom"><p>Close</p></TooltipContent></Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* Tab content */}
              {activeTab === "threads" ? (
                <div className="flex-1 flex flex-col min-h-0 min-w-0">
                  {/* Context bar */}
                  <div className="flex items-center gap-3 px-4 py-2.5 border-b relative" style={{ borderColor: "hsl(var(--border))" }}>
                    <motion.button whileHover={{ backgroundColor: "hsl(var(--muted) / 0.6)" }} whileTap={{ scale: 0.98 }}
                      onClick={e => { e.stopPropagation(); setShowEngagementTrayCtx(v => !v); }}
                      className="flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center"><Inbox size={14} className="text-muted-foreground" /></div>
                      <span className="text-base font-medium text-foreground">{selectedEngagementCtx ? selectedEngagementCtx.id : "Select Engagement"}</span>
                      {selectedEngagementCtx && (selectedEngagementCtx as { source?: string | null }).source && <img src={quickbooksLogo} alt="QuickBooks" className="h-[24px] w-auto object-contain" />}
                      <ChevronDown size={14} className={`text-muted-foreground transition-transform ${showEngagementTrayCtx ? "rotate-180" : ""}`} />
                    </motion.button>
                    {(activeFlowPanel === "account-reconciliation" || activeFlowPanel === "tax-payable") && activityMinimized && (
                      <div className="ml-auto">
                        <LukaActivityPanel entries={activityEntries} isProcessing={isActivityProcessing} minimized={true} onToggleMinimize={() => setActivityMinimized(false)} />
                      </div>
                    )}
                  </div>

                  {/* Enhanced Prompt Banner */}
                  <AnimatePresence>
                    {(enhancedPrompt || isEnhancing) && (
                      <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -8, height: 0 }} transition={{ type: "spring", damping: 24, stiffness: 320 }} className="border-b overflow-hidden" style={{ borderColor: "hsl(var(--border))", background: "linear-gradient(135deg, hsl(270 65% 55% / 0.04), hsl(207 71% 38% / 0.04))" }}>
                        <div className="px-4 py-3 flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg, hsl(270 65% 55%), hsl(207 71% 38%))", boxShadow: "0 2px 8px hsl(270 65% 55% / 0.25)" }}>
                            {isEnhancing ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}><Loader2 size={14} className="text-white" /></motion.div> : <Wand2 size={14} className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-base font-bold uppercase tracking-wider" style={{ color: "hsl(270 65% 45%)" }}>{isEnhancing ? "Enhancing prompt…" : "Enhanced by Luka"}</span>
                              {enhanceCount > 0 && !isEnhancing && <span className="text-base font-bold px-1.5 rounded-md" style={{ background: "hsl(270 65% 55%)", color: "white", height: 14, lineHeight: "14px" }}>v{enhanceCount}</span>}
                            </div>
                            {isEnhancing ? (
                              <div className="flex gap-2">{[0,1,2].map(i => (<motion.div key={i} className="h-2 rounded-full" style={{ background: "hsl(270 65% 55% / 0.25)", flex: i === 1 ? 2 : 1 }} animate={{ opacity: [0.3, 0.9, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }} />))}</div>
                            ) : (
                              <p className="text-[12.5px] leading-relaxed text-foreground">{enhancedPrompt}</p>
                            )}
                          </div>
                          {!isEnhancing && enhancedPrompt && (
                            <div className="flex items-center gap-2 shrink-0">
                              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={handleReplaceWithEnhanced} className="inline-flex items-center gap-2 px-3 h-7 rounded-lg text-base font-semibold cursor-pointer" style={{ background: "linear-gradient(135deg, hsl(270 65% 55%), hsl(207 71% 38%))", color: "white", boxShadow: "0 2px 6px hsl(270 65% 55% / 0.3)" }}>
                                <Check size={12} strokeWidth={2.5} />Replace
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={handleDismissEnhanced} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer" style={{ color: "hsl(var(--muted-foreground))" }}>
                                <X size={13} />
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Chat body */}
                  <div className="relative flex-1 flex flex-col min-w-0 min-h-0">

                    {activeFlowPanel === "account-reconciliation" ? (
                      <><ReconciliationFlow onActivity={handleActivityUpdate} activityMinimized={activityMinimized} />{!activityMinimized && <LukaActivityPanel entries={activityEntries} isProcessing={isActivityProcessing} minimized={false} onToggleMinimize={() => setActivityMinimized(true)} />}</>
                    ) : activeFlowPanel === "tax-payable" ? (
                      <><TaxPayableFlow onActivity={handleActivityUpdate} activityMinimized={activityMinimized} />{!activityMinimized && <LukaActivityPanel entries={activityEntries} isProcessing={isActivityProcessing} minimized={false} onToggleMinimize={() => setActivityMinimized(true)} />}</>
                    ) : (
                    /* ── Existing threads content (sentMessage, rich responses, etc.) ── */
                    <div className="flex-1 flex flex-col min-w-0 min-h-0">
                <div className="flex-1 min-w-0 overflow-y-auto">
                  {!sentMessage ? (
                    <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-[60vh]">
                      <div className="mb-8 relative flex items-center justify-center w-24 h-24">
                        <div className="absolute -inset-4 luka-ambient-glow" />
                        <div className="absolute inset-0 luka-ambient-orb opacity-20" />
                        <div className="relative flex items-center justify-center w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(265_80%_55%)] z-10 shadow-[0_0_30px_rgba(151,71,255,0.12)]">
                          <LukaIcon size={24} />
                        </div>
                      </div>
                      <h1 className="text-2xl font-semibold text-foreground mb-8 text-center">How can I help you today?</h1>
                      <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
                        {suggestions.map(s => (
                          <button key={s} onClick={() => handlePromptSelect(s.replace("#", ""))} className="px-4 py-2 rounded-[10px] border border-border bg-background dark:bg-card text-base text-foreground hover:bg-muted/60 transition-colors">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="px-6 py-4 space-y-4 min-w-0 max-w-full">
                      <div className="flex justify-end">
                        <div className="max-w-[80%] px-4 py-3 rounded-[12px] bg-primary text-primary-foreground text-base">{sentMessage}</div>
                      </div>
                      {(isThinking || aiResponse) && (
                        <div className="flex items-start gap-3 min-w-0 max-w-full">
                          <div className={cn("w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0", isThinking && "luka-thinking-spin")}>
                            <LukaIcon size={16} />
                          </div>
                          <div className="flex-1 pt-1.5 min-h-[28px] min-w-0">
                            {isThinking ? (
                              <div className="flex items-center gap-2">
                                <span className="text-base font-medium text-foreground luka-thinking-text">Thinking</span>
                                <span className="flex gap-0.5">
                                  <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-1" />
                                  <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-2" />
                                  <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-3" />
                                </span>
                              </div>
                            ) : richResponseType === "lt-debt" ? (
                              <div className="space-y-3 py-0.5 max-w-full">
                                {!ltDebtGenerated ? (
                                  <>
                                    {/* Intro text */}
                                    <p className="text-base text-foreground leading-relaxed">
                                      Upload or enter your loan data below, then click <strong>Submit</strong>.
                                    </p>

                                    {/* Drop zone + review table */}
                                    {(() => {
                                      const addLtFiles = (rawFiles: FileList | null) => {
                                        if (!rawFiles) return;
                                        const classified = Array.from(rawFiles).map(classifyLtDebtFile);
                                        setLtDebtUploadFiles(prev => {
                                          const existing = new Set(prev.map(f => f.name));
                                          const toAdd = classified.filter(f => !existing.has(f.name));
                                          // Generate mock review rows for non-ambiguous valid files
                                          const newValid = toAdd.filter(f => f.kind !== "unsupported" && f.kind !== "oversized" && f.kind !== "ambiguous");
                                          if (newValid.length > 0) {
                                            const newRows = newValid.flatMap(mockLtRowsFromFile);
                                            if (newRows.length > 0) {
                                              setLtReviewRows(rPrev => {
                                                const existingKeys = new Set(rPrev.map(r => `${r.sourceFile}:${r.name}`));
                                                return [...rPrev, ...newRows.filter(r => !existingKeys.has(`${r.sourceFile}:${r.name}`))];
                                              });
                                            }
                                            setLtProcessedFileIds(s => { const n = new Set(s); newValid.forEach(f => n.add(f.id)); return n; });
                                          }
                                          return [...prev, ...toAdd].slice(0, 15);
                                        });
                                      };
                                      const validFiles = ltDebtUploadFiles.filter(f => f.kind !== "unsupported" && f.kind !== "oversized");
                                      const ambigFiles = ltDebtUploadFiles.filter(f => f.kind === "ambiguous" && !f.userKind);
                                      const missingCount = ltReviewRows.reduce((sum, row) =>
                                        sum + LT_REVIEW_REQUIRED.filter(f => ltRowMissing(row, f)).length, 0);
                                      const canSubmit = (validFiles.length > 0 || ltReviewRows.length > 0) && ambigFiles.length === 0 && missingCount === 0;

                                      const triggerUpload = () => {
                                            const inp = document.createElement("input");
                                            inp.type = "file"; inp.accept = ".pdf,.xlsx,.xls,.zip"; inp.multiple = true;
                                            inp.onchange = e => addLtFiles((e.target as HTMLInputElement).files);
                                            inp.click();
                                          };

                                      return (
                                        <div className="space-y-3">
                                          {/* ── AI-style upload section ── */}
                                          <div className="relative rounded-[14px] overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/[0.04] via-background to-violet-50/30">
                                            {/* Ambient blobs */}
                                            <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
                                            <div className="pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-violet-400/10 blur-3xl" />

                                            <div className="relative z-10 px-5 pt-4 pb-3 text-center space-y-0.5">
                                              <p className="text-base font-semibold text-foreground">How would you like to add loans?</p>
                                              <p className="text-base text-muted-foreground">Luka will auto-extract and fill all fields from your documents</p>
                                            </div>

                                            <div className="relative z-10 flex items-stretch gap-0 px-4 pb-4 pt-2">
                                              {/* Upload card */}
                                              <div
                                                className="flex-1 flex flex-col items-center gap-2.5 p-4 rounded-[10px] border border-dashed border-primary/25 bg-primary/[0.03] cursor-pointer hover:bg-primary/[0.07] hover:border-primary/45 transition-all group text-center"
                                                onClick={triggerUpload}
                                                onDragOver={e => e.preventDefault()}
                                                onDrop={e => { e.preventDefault(); addLtFiles(e.dataTransfer.files); }}
                                              >
                                                <div className="relative">
                                                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-md group-hover:bg-primary/30 transition-all" />
                                                  <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-sm">
                                                    <Upload className="w-4 h-4 text-white" />
                                                  </div>
                                                </div>
                                                <div>
                                                  <p className="text-base font-semibold text-foreground">Import documents</p>
                                                  <p className="text-base text-muted-foreground mt-0.5">Loan agreements · Registers<br />Schedules · PDF · XLSX · ZIP</p>
                                                </div>
                                                <span className="inline-flex items-center gap-1 text-base font-medium text-primary group-hover:underline">
                                                  Click to browse or drag & drop
                                                </span>
                                              </div>

                                              {/* OR */}
                                              <div className="flex flex-col items-center justify-center px-3 gap-2">
                                                <div className="w-px flex-1 bg-gradient-to-b from-transparent via-border to-transparent" />
                                                <span className="text-base font-bold text-muted-foreground/50">or</span>
                                                <div className="w-px flex-1 bg-gradient-to-b from-transparent via-border to-transparent" />
                                              </div>

                                              {/* Manual card */}
                                              <div
                                                className="flex-1 flex flex-col items-center gap-2.5 p-4 rounded-[10px] border border-dashed border-violet-300/40 bg-violet-50/20 cursor-pointer hover:bg-violet-50/50 hover:border-violet-400/50 transition-all group text-center"
                                                onClick={() => setLtReviewRows(prev => [...prev, EMPTY_LT_ROW()])}
                                              >
                                                <div className="relative">
                                                  <div className="absolute inset-0 rounded-full bg-violet-400/20 blur-md group-hover:bg-violet-400/30 transition-all" />
                                                  <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-sm">
                                                    <Plus className="w-4 h-4 text-white" />
                                                  </div>
                                                </div>
                                                <div>
                                                  <p className="text-base font-semibold text-foreground">Enter manually</p>
                                                  <p className="text-base text-muted-foreground mt-0.5">Add a blank row and type<br />loan details directly in the table</p>
                                                </div>
                                                <span className="inline-flex items-center gap-1 text-base font-medium text-violet-600 group-hover:underline">
                                                  Add a new entry row
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* File chips */}
                                          {ltDebtUploadFiles.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                              {ltDebtUploadFiles.map(f => {
                                                const isError = f.kind === "unsupported" || f.kind === "oversized";
                                                const isAmbig = f.kind === "ambiguous" && !f.userKind;
                                                return (
                                                  <div key={f.id} className={cn(
                                                    "inline-flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-[10px] border bg-background text-base max-w-[220px]",
                                                    isError ? "border-red-200" : isAmbig ? "border-amber-300" : "border-border"
                                                  )}>
                                                    <div className={cn("w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0", isError ? "bg-red-50" : "bg-primary/10")}>
                                                      {f.ext === "pdf" ? <FileText className="h-5 w-5 text-primary shrink-0" /> : f.ext === "zip" ? <FolderOpen className="h-5 w-5 text-primary shrink-0" /> : <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />}
                                                    </div>
                                                    <span className="flex-1 min-w-0 truncate font-medium text-foreground">{f.name}</span>
                                                    {isAmbig && (
                                                      <select onClick={e => e.stopPropagation()} defaultValue=""
                                                        onChange={e => {
                                                          const v = e.target.value as Exclude<LtDebtFileKind, "unsupported" | "oversized" | "ambiguous">;
                                                          setLtDebtUploadFiles(prev => prev.map(x => x.id === f.id ? { ...x, userKind: v } : x));
                                                          // Generate rows when ambiguous file gets classified
                                                          if (!ltProcessedFileIds.has(f.id)) {
                                                            const newRows = mockLtRowsFromFile({ ...f, userKind: v });
                                                            if (newRows.length > 0) {
                                                              setLtReviewRows(rPrev => {
                                                                const existingKeys = new Set(rPrev.map(r => `${r.sourceFile}:${r.name}`));
                                                                return [...rPrev, ...newRows.filter(r => !existingKeys.has(`${r.sourceFile}:${r.name}`))];
                                                              });
                                                              setLtProcessedFileIds(s => { const n = new Set(s); n.add(f.id); return n; });
                                                            }
                                                          }
                                                        }}
                                                        className="text-base border border-amber-300 rounded-[6px] px-1 py-0.5 bg-background text-amber-700 focus:outline-none cursor-pointer shrink-0 max-w-[100px]"
                                                      >
                                                        <option value="" disabled>Classify…</option>
                                                        <option value="loan-agreement">Loan Agreement</option>
                                                        <option value="debt-schedule">Debt Schedule</option>
                                                        <option value="continuity">Continuity</option>
                                                        <option value="loan-register">Loan Register</option>
                                                        <option value="workpaper">Prior Year WP</option>
                                                      </select>
                                                    )}
                                                    {isError && <span className="text-base text-red-600 shrink-0">{f.kind === "unsupported" ? "Unsupported" : "Too large"}</span>}
                                                    <button onClick={e => { e.stopPropagation(); setLtDebtUploadFiles(prev => prev.filter(x => x.id !== f.id)); }} className="shrink-0 text-red-400 hover:text-red-600 transition-colors">
                                                      <Trash2 className="h-5 w-5" />
                                                    </button>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}

                                          {/* ── Review table ── */}
                                          {ltReviewRows.length > 0 && (
                                            <div className="space-y-2">
                                              <div className="flex items-center">
                                                <span className="text-base font-semibold text-foreground">
                                                  {ltReviewRows.length} loan{ltReviewRows.length !== 1 ? "s" : ""} extracted — review and complete before submitting
                                                </span>
                                              </div>

                                              {/* Scrollable review table */}
                                              <div className="rounded-[8px] border border-border overflow-hidden">
                                                <div className="overflow-x-auto">
                                                  <table className="w-full text-base" style={{ minWidth: 2400 }}>
                                                    <thead>
                                                      <tr className="bg-muted/30 border-b border-border">
                                                        {["Loan Name *","Lender *","Current Collateral","Type","Rate Type","Int. Rate % *","Start *","Maturity *","First Payment","CCY","Mo. Payment","Orig. Loan Amt","FX Rate","Opening Bal. *","GL Principal *","Day Count","Payment Type","Freq.","Compounding","IO Period (mo.)","Balloon Amt","Status",""].map((h, i) => (
                                                          <th key={i} className={`px-2 py-1.5 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${LT_RIGHT_COLS.has(h) ? "text-right" : "text-left"} ${h === "" ? "sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] z-10" : ""}`}>
                                                            {h.endsWith(" *")
                                                              ? <>{h.slice(0, -2)} <span className="text-red-500">*</span></>
                                                              : h}
                                                          </th>
                                                        ))}
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {ltReviewRows.map((row, ri) => {
                                                        const fc = (field: keyof LtDebtReviewRow, req: boolean) =>
                                                          cn("h-6 text-base px-1.5 border rounded bg-background focus:outline-none w-full",
                                                            req && ltRowMissing(row, field)
                                                              ? "border-red-400 bg-red-50/60 placeholder:text-red-400 text-red-600 focus:border-red-500"
                                                              : "border-border focus:border-primary/40");
                                                        return (
                                                          <tr key={row.id} className={`border-b border-border/40 ${ri % 2 === 1 ? "bg-muted/10" : ""}`}>
                                                            {/* Loan Name */}
                                                            <td className="px-1.5 py-1 min-w-[130px]">
                                                              <input value={row.name} onChange={e => updateLtRow(row.id,"name",e.target.value)} className={cn(fc("name",true),"w-32")} placeholder="Loan name" />
                                                            </td>
                                                            {/* Lender */}
                                                            <td className="px-1.5 py-1 min-w-[110px]">
                                                              <input value={row.lender} onChange={e => updateLtRow(row.id,"lender",e.target.value)} className={cn(fc("lender",true),"w-28")} placeholder="Lender" />
                                                            </td>
                                                            {/* Current Collateral */}
                                                            <td className="px-1.5 py-1 min-w-[120px]">
                                                              <input value={row.collateral} onChange={e => updateLtRow(row.id,"collateral",e.target.value)} className={cn(fc("collateral",false),"w-28")} placeholder="e.g. Real property" />
                                                            </td>
                                                            {/* Type */}
                                                            <td className="px-1.5 py-1">
                                                              <select value={row.type} onChange={e => updateLtRow(row.id,"type",e.target.value)} className={cn(SCR,"w-20")}>
                                                                {["Term","LOC","Revolver","Mortgage","Bridge"].map(t => <option key={t}>{t}</option>)}
                                                              </select>
                                                            </td>
                                                            {/* Rate Type */}
                                                            <td className="px-1.5 py-1">
                                                              <select value={row.interestType} onChange={e => updateLtRow(row.id,"interestType",e.target.value)} className={cn(SCR,"w-22")}>
                                                                {["Fixed","Variable","Floating","Hybrid","Step Rate"].map(t => <option key={t}>{t}</option>)}
                                                              </select>
                                                            </td>
                                                            {/* Int. Rate % * */}
                                                            <td className="px-1.5 py-1">
                                                              <input value={row.rate} onChange={e => updateLtRow(row.id,"rate",e.target.value)} className={cn(fc("rate",true),"w-14 text-right")} placeholder="%" />
                                                            </td>
                                                            {/* Start */}
                                                            <td className="px-1.5 py-1">
                                                              <input type="date" value={row.startDate} onChange={e => updateLtRow(row.id,"startDate",e.target.value)} className={cn(fc("startDate",true),"w-28")} />
                                                            </td>
                                                            {/* Maturity * */}
                                                            <td className="px-1.5 py-1">
                                                              <input type="date" value={row.maturityDate} onChange={e => updateLtRow(row.id,"maturityDate",e.target.value)} className={cn(fc("maturityDate",true),"w-28")} />
                                                            </td>
                                                            {/* First Payment */}
                                                            <td className="px-1.5 py-1">
                                                              <input type="date" value={row.firstPaymentDate} onChange={e => updateLtRow(row.id,"firstPaymentDate",e.target.value)} className={cn(fc("firstPaymentDate",false),"w-28")} />
                                                            </td>
                                                            {/* CCY */}
                                                            <td className="px-1.5 py-1">
                                                              <select value={row.currency} onChange={e => updateLtRow(row.id,"currency",e.target.value)} className={cn(SCR,"w-14")}>
                                                                {["CAD","USD","EUR","GBP"].map(c => <option key={c}>{c}</option>)}
                                                              </select>
                                                            </td>
                                                            {/* Mo. Payment */}
                                                            <td className="px-1.5 py-1">
                                                              <input value={row.monthlyPayment} onChange={e => updateLtRow(row.id,"monthlyPayment",e.target.value)} className={cn(fc("monthlyPayment",false),"w-24 text-right")} placeholder="auto" />
                                                            </td>
                                                            {/* Orig. Loan Amt */}
                                                            <td className="px-1.5 py-1">
                                                              <input value={row.originalPrincipal} onChange={e => updateLtRow(row.id,"originalPrincipal",e.target.value)} className={cn(fc("originalPrincipal",false),"w-24 text-right")} placeholder="0" />
                                                            </td>
                                                            {/* FX Rate */}
                                                            <td className="px-1.5 py-1">
                                                              <input value={row.fxRate} onChange={e => updateLtRow(row.id,"fxRate",e.target.value)} className={cn(fc("fxRate",false),"w-16 text-right font-mono")} placeholder="1.000" />
                                                            </td>
                                                            {/* Opening Bal. * */}
                                                            <td className="px-1.5 py-1">
                                                              <input value={row.currentBalance} onChange={e => updateLtRow(row.id,"currentBalance",e.target.value)} className={cn(fc("currentBalance",true),"w-24 text-right")} placeholder="Balance" />
                                                            </td>
                                                            {/* GL Principal * */}
                                                            <td className="px-1.5 py-1 min-w-[160px]">
                                                              <GLComboboxMini value={row.glPrincipal} onChange={v => updateLtRow(row.id,"glPrincipal",v)} required={ltRowMissing(row,"glPrincipal")} />
                                                            </td>
                                                            {/* Day Count */}
                                                            <td className="px-1.5 py-1">
                                                              <select value={row.dayCount} onChange={e => updateLtRow(row.id,"dayCount",e.target.value)} className={cn(SCR,"w-20")}>
                                                                {["ACT/365","ACT/360","30/360"].map(d => <option key={d}>{d}</option>)}
                                                              </select>
                                                            </td>
                                                            {/* Payment Type */}
                                                            <td className="px-1.5 py-1">
                                                              <select value={row.paymentType} onChange={e => updateLtRow(row.id,"paymentType",e.target.value)} className={cn(SCR,"w-24")}>
                                                                {["P&I","Interest-only","Balloon"].map(p => <option key={p}>{p}</option>)}
                                                              </select>
                                                            </td>
                                                            {/* Freq. */}
                                                            <td className="px-1.5 py-1">
                                                              <select value={row.paymentFrequency} onChange={e => updateLtRow(row.id,"paymentFrequency",e.target.value)} className={cn(SCR,"w-22")}>
                                                                {["Monthly","Quarterly","Semi-annual","Annual"].map(f => <option key={f}>{f}</option>)}
                                                              </select>
                                                            </td>
                                                            {/* Compounding */}
                                                            <td className="px-1.5 py-1">
                                                              <select value={row.compounding} onChange={e => updateLtRow(row.id,"compounding",e.target.value)} className={cn(SCR,"w-22")}>
                                                                {["Monthly","Quarterly","Semi-annual","Annual"].map(f => <option key={f}>{f}</option>)}
                                                              </select>
                                                            </td>
                                                            {/* IO Period (mo.) */}
                                                            <td className="px-1.5 py-1">
                                                              <input value={row.ioPeriod} onChange={e => updateLtRow(row.id,"ioPeriod",e.target.value)} className={cn(fc("ioPeriod",false),"w-14 text-right")} placeholder="0" />
                                                            </td>
                                                            {/* Balloon Amt */}
                                                            <td className="px-1.5 py-1">
                                                              <input value={row.balloonAmt} onChange={e => updateLtRow(row.id,"balloonAmt",e.target.value)} className={cn(fc("balloonAmt",false),"w-24 text-right")} placeholder="0" />
                                                            </td>
                                                            {/* Status */}
                                                            <td className="px-1.5 py-1">
                                                              <select value={row.status} onChange={e => updateLtRow(row.id,"status",e.target.value)} className={cn(SCR,"w-20")}>
                                                                {["Active","Closed","Replaced","Inactive"].map(s => <option key={s}>{s}</option>)}
                                                              </select>
                                                            </td>
                                                            {/* Delete */}
                                                            <td className="px-1.5 py-1 sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] z-10">
                                                              <div className="flex items-center justify-end">
                                                                <button onClick={() => deleteLtRow(row.id)} className="inline-flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors">
                                                                  <Trash2 className="w-4 h-4" />
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

                                          {/* Bottom actions */}
                                          <div className="flex items-center justify-between gap-2">
                                            <div />

                                            {/* Right: hint + Submit */}
                                            <div className="flex items-center gap-2">
                                              {missingCount > 0 && (
                                                <span className="text-base text-red-500">
                                                  Fill in the <strong>{missingCount}</strong> highlighted field{missingCount !== 1 ? "s" : ""} to continue
                                                </span>
                                              )}
                                              {(validFiles.length > 0 || ltReviewRows.length > 0) && ambigFiles.length === 0 && (
                                                <button
                                                  disabled={!canSubmit}
                                                  onClick={() => {
                                                    if (!canSubmit) return;
                                                    const counts: Partial<Record<string, number>> = {};
                                                    validFiles.forEach(f => { const k = f.userKind ?? f.kind; counts[k] = (counts[k] ?? 0) + 1; });
                                                    const parts = Object.entries(counts).map(([k, n]) => `${n} ${LT_FILE_KIND_LABEL[k] ?? k}${n! > 1 ? "s" : ""}`);
                                                    const docPart = validFiles.length > 0 ? `${validFiles.length} uploaded document${validFiles.length !== 1 ? "s" : ""}${parts.length ? ` (${parts.join(", ")})` : ""}` : "";
                                                    const manualCount = ltReviewRows.filter(r => !r.sourceFile).length;
                                                    const manualPart = manualCount > 0 ? `${manualCount} manual entr${manualCount !== 1 ? "ies" : "y"}` : "";
                                                    setLtDebtSrcLabel([docPart, manualPart].filter(Boolean).join(" + ") || `${ltReviewRows.length} manual entries`);
                                                    setLtDebtGenerated(true);
                                                    setLtDebtPhase("done");
                                                  }}
                                                  className={cn(
                                                    "inline-flex items-center gap-2 h-9 px-5 text-base font-medium rounded-[8px] transition-colors",
                                                    canSubmit
                                                      ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                                                      : "bg-muted/60 text-muted-foreground/50 cursor-not-allowed border border-border/50 opacity-60"
                                                  )}
                                                >
                                                  Submit
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </>
                                ) : (
                                  <div className="space-y-2">
                                    <p className="text-base text-foreground">
                                      Workpaper generated from <strong>{ltDebtSrcLabel}</strong> ✓
                                    </p>
                                    {/* Uploaded file chips — shown after generation */}
                                    {ltDebtUploadFiles.filter(f => f.kind !== "unsupported" && f.kind !== "oversized").length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {ltDebtUploadFiles
                                          .filter(f => f.kind !== "unsupported" && f.kind !== "oversized")
                                          .map(f => (
                                            <div key={f.id} className="inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-[10px] border border-border bg-background text-base max-w-[240px]">
                                              <div className="w-6 h-6 rounded-[5px] flex items-center justify-center shrink-0 bg-primary/10">
                                                {f.ext === "pdf"
                                                  ? <FileText className="h-4 w-4 text-primary shrink-0" />
                                                  : f.ext === "zip"
                                                  ? <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                                                  : <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />}
                                              </div>
                                              <span className="flex-1 min-w-0 truncate font-medium text-foreground text-base">{f.name}</span>
                                            </div>
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : richResponseType === "investment" ? (
                              <div className="space-y-5 py-1 max-w-full">
                                {(() => {
                                  const INV_PHASES = ["idle","thinking","engagement-check","source-check","tb-check","upload-prompt","review","done"] as const;
                                  const phaseIdx = INV_PHASES.indexOf(invSchedPhase as typeof INV_PHASES[number]);
                                  const past  = (p: typeof INV_PHASES[number]) => phaseIdx > INV_PHASES.indexOf(p);
                                  const at    = (p: typeof INV_PHASES[number]) => invSchedPhase === p;
                                  const reached = (p: typeof INV_PHASES[number]) => phaseIdx >= INV_PHASES.indexOf(p);
                                  return (<>

                                {/* ── Thinking: active → spinner; past → ✓ summary ── */}
                                {reached("thinking") && (
                                  <div className="py-1">
                                    {at("thinking")
                                      ? <span className="text-base text-foreground luka-thinking-text">Checking your engagement setup…</span>
                                      : <span className="inline-flex items-center gap-2 text-base text-muted-foreground"><Check className="w-4 h-4 text-green-600" />Checked engagement setup</span>}
                                  </div>
                                )}

                                {/* ── Engagement Check: past → compact selection summary ── */}
                                {reached("engagement-check") && past("engagement-check") && (
                                  <div className="space-y-2">
                                    <p className="text-base text-muted-foreground font-medium">Connect to an Engagement</p>
                                    {invSelectedEngId
                                      ? <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-green-50 border border-green-200">
                                          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                                          <span className="text-base text-green-800 font-medium">Connected to <strong>{invSelectedEngId}</strong></span>
                                        </div>
                                      : <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-muted border border-border">
                                          <span className="text-base text-muted-foreground">Skipped — no engagement selected</span>
                                        </div>}
                                  </div>
                                )}

                                {/* ── Engagement Check active ── */}
                                {at("engagement-check") && (
                                  <div className="flex items-start gap-3 py-1">
                                    <p className="text-base text-foreground leading-relaxed flex-1">
                                      Please select an engagement from the engagement button{" "}
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-muted border border-border align-middle mx-0.5">
                                        <Inbox className="w-5 h-5 text-muted-foreground" />
                                      </span>
                                      {" "}in the toolbar to proceed with it. This action cannot be performed without an engagement selection.
                                    </p>
                                  </div>
                                )}

                                {/* ── Source Check: blocked ── */}
                                {at("source-check") && invSourceConnected && (
                                  <div className="space-y-3">
                                    <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 space-y-2">
                                      <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                                        <p className="text-base font-semibold text-red-900">Source Connection Detected</p>
                                      </div>
                                      <p className="text-base text-red-800 leading-relaxed">
                                        The engagement <strong>{invSelectedEngId}</strong> is connected to{" "}
                                        <strong className="capitalize">{invSourceConnected}</strong>. The Investment Schedule
                                        workpaper cannot be generated for source-connected engagements — data must be imported
                                        directly from brokerage statements.
                                      </p>
                                      <div className="pt-1 flex items-center gap-2 text-base text-red-700 font-medium">
                                        <span>To proceed, select a non-source engagement (e.g. <strong>Phoenix Marie / COM-DEF-May312024</strong>)</span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => { setInvSelectedEngId(null); setInvEngagementConnected(false); setInvSourceConnected(null); setInvSchedPhase("engagement-check"); }}
                                      className="h-8 px-4 text-base font-medium rounded-[8px] border border-border bg-background text-foreground hover:bg-muted transition-colors"
                                    >
                                      ← Choose a different engagement
                                    </button>
                                  </div>
                                )}

                                {/* ── TB Check: past → keep full analysis visible ── */}
                                {reached("tb-check") && past("tb-check") && invTBAnalysis && (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                                      <span className="text-base text-foreground font-medium">Trial Balance found in <strong>{invSelectedEngId}</strong></span>
                                    </div>
                                    <p className="text-base font-semibold text-foreground">Trial Balance Analysis</p>
                                    <div className="space-y-3">
                                      <div className="flex items-start gap-3">
                                        <span className="mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-base font-bold shrink-0">1</span>
                                        <div><p className="text-base font-medium text-foreground">Years of TB detected</p><p className="text-base text-muted-foreground">{invTBAnalysis.years}</p></div>
                                      </div>
                                      <div className="flex items-start gap-3">
                                        <span className="mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700 text-base font-bold shrink-0">2</span>
                                        <div>
                                          <p className="text-base font-medium text-foreground">Investment accounts ({invTBAnalysis.investmentAccounts.length})</p>
                                          <div className="flex flex-wrap gap-2 mt-2">
                                            {invTBAnalysis.investmentAccounts.map(a => <span key={a} className="inline-flex items-center px-2.5 py-1.5 rounded-[6px] text-base font-medium bg-primary/[0.08] text-primary border border-primary/15">{a}</span>)}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-start gap-3">
                                        <span className="mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-base font-bold shrink-0">3</span>
                                        <div>
                                          <p className="text-base font-medium text-foreground">Bank accounts ({invTBAnalysis.bankAccounts.length})</p>
                                          <div className="flex flex-wrap gap-2 mt-2">
                                            {invTBAnalysis.bankAccounts.map(a => <span key={a} className="inline-flex items-center px-2.5 py-1.5 rounded-[6px] text-base font-medium bg-muted text-muted-foreground border border-border">{a}</span>)}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-start gap-3">
                                        <span className="mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-base font-bold shrink-0">4</span>
                                        <div><p className="text-base font-medium text-foreground">Recording method</p><p className="text-base text-muted-foreground">{invTBAnalysis.recordingMethod}</p></div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* ── TB Check active ── */}
                                {at("tb-check") && (
                                  <div className="space-y-3">
                                    {/* Step 1: Searching */}
                                    {invTBChecking && (
                                      <div className="flex items-center gap-2 py-1">
                                        <Loader2 className="h-5 w-5 text-primary shrink-0 animate-spin" />
                                        <span className="text-base text-foreground luka-thinking-text">
                                          Searching for Trial Balance in <strong>{invSelectedEngId}</strong>…
                                        </span>
                                      </div>
                                    )}

                                    {/* TB not found — block */}
                                    {!invTBChecking && invTBFound === false && (
                                      <div className="space-y-2">
                                        <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 space-y-1">
                                          <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-red-600 shrink-0" /><p className="text-base font-semibold text-red-900">No Trial Balance Found</p></div>
                                          <p className="text-base text-red-800 leading-relaxed">No Trial Balance was found in <strong>{invSelectedEngId}</strong>. The Investment Schedule workpaper requires a Trial Balance to reconcile investment account balances.</p>
                                          <div className="pt-1 space-y-1">
                                            <p className="text-base text-red-700 font-semibold">To proceed:</p>
                                            <ol className="text-base text-red-700 space-y-0.5 pl-4 list-decimal">
                                              <li>Go to <strong>Engagements → {invSelectedEngId}</strong></li>
                                              <li>Navigate to <strong>TB / Trial Balance</strong> section</li>
                                              <li>Upload or generate a Trial Balance for the engagement</li>
                                              <li>Return here and select the same engagement to continue</li>
                                            </ol>
                                          </div>
                                        </div>
                                        <button onClick={() => { setInvSelectedEngId(null); setInvEngagementConnected(false); setInvSchedPhase("engagement-check"); }} className="h-8 px-4 text-base font-medium rounded-[8px] border border-border bg-background text-foreground hover:bg-muted transition-colors">← Choose a different engagement</button>
                                      </div>
                                    )}

                                    {/* Step 2: Found → analyzing */}
                                    {!invTBChecking && invTBFound === true && (
                                      <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                                        <span className="text-base text-foreground font-medium">Trial Balance found in <strong>{invSelectedEngId}</strong></span>
                                      </div>
                                    )}

                                    {/* Step 3: Analyzing */}
                                    {invTBAnalyzing && (
                                      <div className="flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 text-primary shrink-0 animate-spin" />
                                        <span className="text-base text-foreground luka-thinking-text">Analysing Trial Balance structure…</span>
                                      </div>
                                    )}

                                    {/* Step 4: Analysis findings — revealed sequentially */}
                                    {invTBAnalysis && !invTBAnalyzing && (
                                      <div className="space-y-3">
                                        <p className="text-base font-semibold text-foreground">Trial Balance Analysis</p>
                                        <div className="space-y-3">
                                          {invTBAnalysisStep >= 1 && (
                                            <div className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                              <span className="mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-base font-bold shrink-0">1</span>
                                              <div><p className="text-base font-medium text-foreground">Years of TB detected</p><p className="text-base text-muted-foreground">{invTBAnalysis.years}</p></div>
                                            </div>
                                          )}
                                          {invTBAnalysisStep >= 2 && (
                                            <div className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                              <span className="mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700 text-base font-bold shrink-0">2</span>
                                              <div>
                                                <p className="text-base font-medium text-foreground">Investment accounts present ({invTBAnalysis.investmentAccounts.length})</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                  {invTBAnalysis.investmentAccounts.map(a => <span key={a} className="inline-flex items-center px-2.5 py-1.5 rounded-[6px] text-base font-medium bg-primary/8 text-primary border border-primary/15">{a}</span>)}
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                          {invTBAnalysisStep >= 3 && (
                                            <div className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                              <span className="mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-base font-bold shrink-0">3</span>
                                              <div>
                                                <p className="text-base font-medium text-foreground">Bank accounts ({invTBAnalysis.bankAccounts.length})</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                  {invTBAnalysis.bankAccounts.map(a => <span key={a} className="inline-flex items-center px-2.5 py-1.5 rounded-[6px] text-base font-medium bg-muted text-muted-foreground border border-border">{a}</span>)}
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                          {invTBAnalysisStep >= 4 && (
                                            <div className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                              <span className="mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-base font-bold shrink-0">4</span>
                                              <div><p className="text-base font-medium text-foreground">Recording method</p><p className="text-base text-muted-foreground">{invTBAnalysis.recordingMethod}</p></div>
                                            </div>
                                          )}
                                        </div>
                                        {invTBAnalysisStep >= 4 && (
                                          <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-300">
                                            <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                                            <span className="text-base text-muted-foreground luka-thinking-text">Preparing upload prompt…</span>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                  </div>
                                )}

                                {/* ── Source summary in history (shown once done) ── */}
                                {at("done") && ((() => {
                                  const validMain = invUploadFiles.filter(f => f.kind !== "unsupported" && f.kind !== "oversized");
                                  // Merge main uploads + re-uploads (missing months), dedup by name
                                  const allFiles = [
                                    ...validMain.map(f => ({ id: f.id, name: f.name, ext: f.ext })),
                                    ...invMissingReUploads.filter(r => !validMain.some(m => m.name === r.name)),
                                  ];
                                  if (!invSchedSrcLabel && allFiles.length === 0) return null;
                                  return (
                                  <div className="space-y-1.5">
                                    <p className="text-base text-muted-foreground">
                                      {invSchedSrcLabel?.startsWith("Plaid") ? "Connected via Plaid" : `Uploaded documents (${allFiles.length})`}
                                    </p>
                                    {invSchedSrcLabel?.startsWith("Plaid") ? (
                                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-green-50 border border-green-200">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                                        <span className="text-base text-green-800 font-medium">{invSchedSrcLabel.replace("Plaid — ", "")}</span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-wrap gap-2">
                                        {allFiles.map(f => (
                                          <div key={f.id} className="inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-[8px] border border-border bg-background max-w-[220px]">
                                            <div className="w-5 h-5 rounded-[4px] flex items-center justify-center shrink-0 bg-primary/10">
                                              {f.ext === "pdf" ? <FileText className="h-4 w-4 text-primary shrink-0" /> : f.ext === "zip" ? <FolderOpen className="h-4 w-4 text-primary shrink-0" /> : <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />}
                                            </div>
                                            <span className="flex-1 min-w-0 truncate text-base font-medium text-foreground">{f.name}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  );
                                })())}


                                {reached("upload-prompt") && (
                                <>
                                {!at("done") ? (
                                  <>
                                    {/* ── GRADIENT CONTAINER + CHIPS + REVIEW TABLE ── */}
                                    {(() => {
                                        // ── Helpers shared by upload + extract ──────────
                                        const MONTH_NAMES_INV = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
                                        const MONTH_LABELS_INV = ["January","February","March","April","May","June","July","August","September","October","November","December"];
                                        const extractMonthYear = (name: string): number | null => {
                                          const lower = name.toLowerCase();
                                          const yearMatch = lower.match(/20(\d{2})/);
                                          const year = yearMatch ? parseInt("20" + yearMatch[1]) : new Date().getFullYear();
                                          for (let mi = 0; mi < MONTH_NAMES_INV.length; mi++) {
                                            if (lower.includes(MONTH_NAMES_INV[mi])) return year * 100 + mi;
                                          }
                                          return null;
                                        };

                                        // ── Broker fingerprint from filename ──────────────
                                        const BROKER_PATTERNS: [RegExp, string][] = [
                                          [/investement_|richardson|richwealth|jsk|seko/i, "Richardson Wealth"],
                                          [/\btd[_\s-]/i,                                  "TD Direct Investing"],
                                          [/\brbc[_\s-]|rbc\s*direct/i,                   "RBC Direct Investing"],
                                          [/\bbmo[_\s-]|bmo\s*invest/i,                   "BMO InvestorLine"],
                                          [/\bcibc[_\s-]|cibc\s*investor/i,               "CIBC Investor's Edge"],
                                          [/\bnbfm|national\s*bank/i,                     "National Bank Financial"],
                                          [/\bscotia|itrade/i,                            "Scotia iTrade"],
                                          [/\bdisnat|desjardins/i,                        "Disnat"],
                                          [/\bquestrade/i,                                "Questrade"],
                                          [/\bwealthsimple|wstrade/i,                     "Wealthsimple Trade"],
                                          [/\binteractive|ibkr/i,                        "Interactive Brokers"],
                                          [/\bfidelity/i,                                 "Fidelity"],
                                        ];
                                        const detectBroker = (name: string): string => {
                                          for (const [pat, label] of BROKER_PATTERNS) {
                                            if (pat.test(name)) return label;
                                          }
                                          return "unknown";
                                        };

                                        const checkContinuity = (files: typeof invUploadFiles) => {
                                          const valid = files.filter(f => f.kind !== "unsupported" && f.kind !== "oversized");
                                          if (valid.length === 0) { setInvContinuityOk(false); setInvMissingMonthsPrompt(null); setInvBrokerError(null); return; }

                                          // ── Broker consistency check (filename-based) ──
                                          const brokers = valid.map(f => detectBroker(f.name));
                                          const uniqueBrokers = [...new Set(brokers.filter(b => b !== "unknown"))];
                                          if (uniqueBrokers.length > 1) {
                                            setInvBrokerError(`Conflicting broker agreements detected: ${uniqueBrokers.join(" and ")}. Please upload all statements for one broker at a time.`);
                                            setInvContinuityOk(false);
                                            return;
                                          }
                                          setInvBrokerError(null);

                                          // ── Continuity (month gap) check ──
                                          const mys = valid.map(f => extractMonthYear(f.name)).filter((v): v is number => v !== null);
                                          const sorted = [...new Set(mys)].sort((a, b) => a - b);
                                          const gaps: string[] = [];
                                          for (let i = 0; i < sorted.length - 1; i++) {
                                            const c = sorted[i], n = sorted[i + 1];
                                            const ct = Math.floor(c/100)*12 + (c%100), nt = Math.floor(n/100)*12 + (n%100);
                                            if (nt - ct > 1) for (let t = ct+1; t < nt; t++) gaps.push(`${MONTH_LABELS_INV[t%12]} ${Math.floor(t/12)}`);
                                          }
                                          if (gaps.length > 0) { setInvMissingMonthsPrompt(gaps); setInvContinuityOk(false); }
                                          else {
                                            setInvMissingMonthsPrompt([]);
                                            setInvContinuityOk(sorted.length > 0);
                                            // Auto-extract immediately when continuity is confirmed
                                            if (sorted.length > 0) {
                                              setInvExtracting(true);
                                              setTimeout(() => {
                                                setInvReviewRows(INV_MOCK_ROWS);
                                                setInvExtracting(false);
                                              }, 1400);
                                            }
                                          }
                                        };

                                        // ── Step 1: Add files + validate continuity (NO extraction yet) ──
                                        const addInvFiles = (rawFiles: FileList | null) => {
                                          if (!rawFiles) return;
                                          const classified = Array.from(rawFiles).map(classifyInvFile);
                                          setInvUploadFiles(prev => {
                                            const existing = new Set(prev.map(f => f.name));
                                            const next = [...prev, ...classified.filter(f => !existing.has(f.name))].slice(0, 15);
                                            // Re-check continuity with updated list
                                            setTimeout(() => checkContinuity(next), 0);
                                            return next;
                                          });
                                        };

                                        // ── Step 2: User confirms all uploaded → extract data ──
                                        const extractAllInvFiles = async () => {
                                          const validFiles = invUploadFiles.filter(f => f.kind !== "unsupported" && f.kind !== "oversized");
                                          if (validFiles.length === 0) return;
                                          setInvExtracting(true);
                                          try {
                                            // Need actual File objects — reconstruct from input ref
                                            const parseResults = await Promise.all(
                                              validFiles.map(f => {
                                                // Create a minimal placeholder — parser will fall back to mock if no File
                                                return extractInvTransactions(new File([], f.name, { type: "application/pdf" }));
                                              })
                                            );
                                            const brokerCheck = validateSingleBroker(parseResults);
                                            if (!brokerCheck.valid) {
                                              setInvBrokerError(brokerCheck.error ?? "Multiple brokers detected.");
                                              setInvExtracting(false);
                                              return;
                                            }
                                            setInvBrokerError(null);
                                            // Use mock rows (real extraction needs stored File objects; we use INV_MOCK_ROWS as stand-in)
                                            setInvReviewRows(INV_MOCK_ROWS);
                                          } catch {
                                            setInvReviewRows(INV_MOCK_ROWS);
                                          }
                                          setInvExtracting(false);
                                        };
                                        const validFiles = invUploadFiles.filter(f => f.kind !== "unsupported" && f.kind !== "oversized");
                                        return (
                                          <>
                                            {/* ── AI-style upload section ── */}
                                            <div className="relative rounded-[14px] overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/[0.04] via-background to-violet-50/30">
                                              {/* Ambient blobs */}
                                              <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
                                              <div className="pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-violet-400/10 blur-3xl" />

                                              <div className="relative z-10 flex items-stretch gap-0 px-4 py-4 pt-4">
                                                {/* Upload card */}
                                                <div
                                                  className="flex-1 flex flex-col items-center gap-2.5 p-4 rounded-[10px] border border-dashed border-primary/25 bg-primary/[0.03] cursor-pointer hover:bg-primary/[0.07] hover:border-primary/45 transition-all group text-center"
                                                  onClick={() => {
                                                    const inp = document.createElement("input");
                                                    inp.type = "file"; inp.accept = ".pdf,.xlsx,.xls,.csv,.zip"; inp.multiple = true;
                                                    inp.onchange = e => addInvFiles((e.target as HTMLInputElement).files);
                                                    inp.click();
                                                  }}
                                                  onDragOver={e => e.preventDefault()}
                                                  onDrop={e => { e.preventDefault(); addInvFiles(e.dataTransfer.files); }}
                                                >
                                                  <div className="relative">
                                                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-md group-hover:bg-primary/30 transition-all" />
                                                    <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-sm">
                                                      <Upload className="w-4 h-4 text-white" />
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <p className="text-base font-semibold text-foreground">Import documents</p>
                                                    <p className="text-base text-muted-foreground mt-0.5">Brokerage statements · Trade confirms<br />Statements · PDF · XLSX · CSV</p>
                                                  </div>
                                                  <span className="inline-flex items-center gap-1 text-base font-medium text-primary group-hover:underline">
                                                    Click to browse or drag &amp; drop
                                                  </span>
                                                </div>

                                                {/* OR */}
                                                <div className="flex flex-col items-center justify-center px-3 gap-2">
                                                  <div className="w-px flex-1 bg-gradient-to-b from-transparent via-border to-transparent" />
                                                  <span className="text-base font-bold text-muted-foreground/50">or</span>
                                                  <div className="w-px flex-1 bg-gradient-to-b from-transparent via-border to-transparent" />
                                                </div>

                                                {/* Plaid card — connected state — or inline Plaid flow */}
                                                {invSchedSrcLabel?.startsWith("Plaid") ? (
                                                  /* ── Connected state ── */
                                                  <div className="flex-1 flex flex-col rounded-[10px] border border-green-200 bg-green-50 overflow-hidden">
                                                    {/* Top: institution + check */}
                                                    <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4 py-4 text-center">
                                                      <div className="relative">
                                                        <div className="absolute inset-0 rounded-full bg-green-300/30 blur-md" />
                                                        <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-sm">
                                                          <Check className="w-4 h-4 text-white" />
                                                        </div>
                                                      </div>
                                                      <div>
                                                        <p className="text-base font-semibold text-green-800">Connected</p>
                                                        <p className="text-base font-medium text-green-700 mt-0.5">{invSchedSrcLabel.replace("Plaid — ","")}</p>
                                                        <p className="text-base text-green-600 mt-0.5">Transactions synced · read-only</p>
                                                      </div>
                                                    </div>
                                                    {/* Bottom: action buttons */}
                                                    <div className="border-t border-green-200 px-3 py-2 flex items-center justify-center gap-2">
                                                      <button
                                                        onClick={() => {
                                                          setInvSchedSrcLabel(null);
                                                          setInvReviewRows([]);
                                                          setInvMissingMonthsPrompt(null);
                                                          resetInvPlaid();
                                                        }}
                                                        className="inline-flex items-center gap-1 h-6 px-2.5 rounded-[6px] border border-green-300 bg-white text-base font-medium text-red-500 hover:border-red-300 hover:bg-red-50 transition-colors"
                                                      >
                                                        <X className="w-2.5 h-2.5" /> Disconnect
                                                      </button>
                                                      <button
                                                        onClick={() => setInvReviewRows(INV_MOCK_ROWS)}
                                                        className="inline-flex items-center gap-1 h-6 px-2.5 rounded-[6px] border border-green-300 bg-white text-base font-medium text-green-700 hover:border-green-400 hover:bg-green-100 transition-colors"
                                                      >
                                                        <RefreshCw className="w-2.5 h-2.5" /> Refresh
                                                      </button>
                                                    </div>
                                                  </div>
                                                ) : invPlaidOpen ? (
                                                  /* ── Inline Plaid flow ── */
                                                  <div className="flex-1 flex flex-col rounded-[10px] border border-violet-300/50 bg-background overflow-hidden min-h-[200px]">
                                                    {/* Header */}
                                                    <div className="px-3 pt-2.5 pb-2 border-b border-border flex items-center gap-2 shrink-0">
                                                      {invPlaidStep === 'login' && (
                                                        <button onClick={() => setInvPlaidStep('select')} className="text-muted-foreground hover:text-foreground">
                                                          <ChevronLeft className="w-5 h-5" />
                                                        </button>
                                                      )}
                                                      {invPlaidStep === 'login' && invPlaidInstitution ? (
                                                        <>
                                                          <div className="w-4 h-4 rounded shrink-0 text-white text-base font-bold flex items-center justify-center"
                                                            style={{ backgroundColor: invPlaidInstitution.color }}>
                                                            {invPlaidInstitution.abbr.slice(0, 2)}
                                                          </div>
                                                          <span className="text-base font-semibold text-foreground flex-1 truncate">Sign in to {invPlaidInstitution.name}</span>
                                                        </>
                                                      ) : invPlaidStep === 'verifying' ? (
                                                        <span className="text-base font-semibold text-foreground flex-1">Connecting…</span>
                                                      ) : invPlaidStep === 'success' ? (
                                                        <span className="text-base font-semibold text-foreground flex-1">Authorize Access</span>
                                                      ) : (
                                                        <>
                                                          <div className="w-4 h-4 rounded-[4px] bg-[#1A1A1A] flex items-center justify-center shrink-0">
                                                            <span className="text-white text-base font-bold tracking-tight">p</span>
                                                          </div>
                                                          <span className="text-base font-semibold text-foreground flex-1">Connect to Plaid</span>
                                                        </>
                                                      )}
                                                      <button onClick={resetInvPlaid} className="ml-auto text-muted-foreground hover:text-foreground shrink-0">
                                                        <X className="w-4 h-4" />
                                                      </button>
                                                    </div>

                                                    {/* Body */}
                                                    <div className="flex-1 px-3 py-2.5 overflow-y-auto">
                                                      {invPlaidStep === 'select' && (
                                                        <div className="space-y-2">
                                                          <div className="relative">
                                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                            <input
                                                              className="w-full h-7 pl-6 pr-2.5 text-base rounded-[6px] border border-border bg-muted/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
                                                              placeholder="Search 12,000+ institutions…" value={invPlaidSearch}
                                                              onChange={e => setInvPlaidSearch(e.target.value)} autoFocus />
                                                          </div>
                                                          <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto">
                                                            {INV_PLAID_INSTITUTIONS
                                                              .filter(i => !invPlaidSearch || i.name.toLowerCase().includes(invPlaidSearch.toLowerCase()))
                                                              .map(inst => (
                                                                <button key={inst.id}
                                                                  onClick={() => { setInvPlaidInstitution(inst); setInvPlaidStep('login'); }}
                                                                  className="flex items-center gap-2 px-2 py-1.5 rounded-[6px] border border-border hover:border-primary hover:bg-muted/40 transition-colors text-left">
                                                                  <div className="w-5 h-5 rounded-[4px] flex items-center justify-center flex-shrink-0 text-white text-base font-bold"
                                                                    style={{ backgroundColor: inst.color }}>
                                                                    {inst.abbr.slice(0, 2)}
                                                                  </div>
                                                                  <span className="text-base font-medium text-foreground leading-tight truncate">{inst.name}</span>
                                                                </button>
                                                              ))}
                                                          </div>
                                                          <div className="flex items-center gap-1 justify-center pt-0.5">
                                                            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                                                            <span className="text-base text-muted-foreground">256-bit encryption · read-only</span>
                                                          </div>
                                                        </div>
                                                      )}

                                                      {invPlaidStep === 'login' && invPlaidInstitution && (
                                                        <div className="space-y-2.5">
                                                          <div className="h-0.5 rounded-full" style={{ backgroundColor: invPlaidInstitution.color }} />
                                                          <div>
                                                            <label className="block text-base font-medium text-foreground mb-1">Username / Card Number</label>
                                                            <input
                                                              className="w-full h-7 px-2.5 text-base rounded-[6px] border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
                                                              placeholder="Enter username" value={invPlaidUsername}
                                                              onChange={e => setInvPlaidUsername(e.target.value)} autoFocus />
                                                          </div>
                                                          <div>
                                                            <label className="block text-base font-medium text-foreground mb-1">Password</label>
                                                            <div className="relative">
                                                              <input
                                                                className="w-full h-7 px-2.5 pr-7 text-base rounded-[6px] border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
                                                                type={invPlaidShowPwd ? 'text' : 'password'} placeholder="Enter password"
                                                                value={invPlaidPassword} onChange={e => setInvPlaidPassword(e.target.value)}
                                                                onKeyDown={e => { if (e.key === 'Enter') handleInvPlaidVerify(); }} />
                                                              <button type="button" onClick={() => setInvPlaidShowPwd(p => !p)}
                                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                                                {invPlaidShowPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                              </button>
                                                            </div>
                                                          </div>
                                                          <p className="text-base text-muted-foreground leading-relaxed flex items-start gap-1">
                                                            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                            Encrypted end-to-end · read-only access · never stored
                                                          </p>
                                                        </div>
                                                      )}

                                                      {invPlaidStep === 'verifying' && (
                                                        <div className="flex flex-col items-center justify-center py-6 gap-3">
                                                          <div className="w-9 h-9 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin" />
                                                          <div className="text-center">
                                                            <p className="text-base font-semibold text-foreground">Verifying credentials…</p>
                                                            <p className="text-base text-muted-foreground mt-0.5">Connecting to {invPlaidInstitution?.name}</p>
                                                          </div>
                                                        </div>
                                                      )}

                                                      {invPlaidStep === 'success' && invPlaidInstitution && (
                                                        <div className="space-y-2">
                                                          <div className="rounded-[8px] border border-green-200 bg-green-50 p-2.5 text-center">
                                                            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-1">
                                                              <Check className="w-5 h-5 text-green-600" />
                                                            </div>
                                                            <p className="text-base font-semibold text-green-800">{invPlaidInstitution.name}</p>
                                                            <p className="text-base text-green-700 mt-0.5">2 accounts found · ready to link</p>
                                                          </div>
                                                          <p className="text-base font-semibold uppercase tracking-wide text-muted-foreground">Select accounts</p>
                                                          {[
                                                            { name: 'Investment Account', acct: '···' + invPlaidInstitution.id.slice(0, 2).toUpperCase() + '01', ccy: 'CAD' },
                                                            { name: 'USD Investment Account', acct: '···' + invPlaidInstitution.id.slice(0, 2).toUpperCase() + '02', ccy: 'USD' },
                                                          ].map(a => (
                                                            <label key={a.acct} className="flex items-center gap-2 rounded-[6px] border border-border px-2.5 py-1.5 cursor-pointer hover:bg-muted/30 transition-colors">
                                                              <input type="checkbox" defaultChecked className="rounded h-4 w-4 accent-primary" />
                                                              <div>
                                                                <div className="text-base font-medium text-foreground">{a.name}</div>
                                                                <div className="text-base text-muted-foreground font-mono">{a.acct} · {a.ccy}</div>
                                                              </div>
                                                            </label>
                                                          ))}
                                                        </div>
                                                      )}
                                                    </div>

                                                    {/* Footer */}
                                                    <div className="px-3 pb-2.5 pt-2 flex justify-end gap-2 border-t border-border shrink-0">
                                                      {invPlaidStep === 'select' && (
                                                        <button onClick={resetInvPlaid}
                                                          className="h-7 px-3 text-base font-medium rounded-[6px] border border-border hover:bg-muted/40 transition-colors text-foreground">
                                                          Cancel
                                                        </button>
                                                      )}
                                                      {invPlaidStep === 'login' && (
                                                        <>
                                                          <button onClick={() => setInvPlaidStep('select')}
                                                            className="h-7 px-3 text-base font-medium rounded-[6px] border border-border hover:bg-muted/40 transition-colors text-foreground">
                                                            Back
                                                          </button>
                                                          <button onClick={handleInvPlaidVerify}
                                                            className="h-7 px-3 text-base font-medium rounded-[6px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                                                            Continue
                                                          </button>
                                                        </>
                                                      )}
                                                      {invPlaidStep === 'success' && (
                                                        <>
                                                          <button onClick={resetInvPlaid}
                                                            className="h-7 px-3 text-base font-medium rounded-[6px] border border-border hover:bg-muted/40 transition-colors text-foreground">
                                                            Cancel
                                                          </button>
                                                          <button
                                                            onClick={() => {
                                                              setInvSchedSrcLabel(`Plaid — ${invPlaidInstitution!.name}`);
                                                              setInvReviewRows(INV_MOCK_ROWS);
                                                              setInvSchedPhase("upload-prompt");
                                                              resetInvPlaid();
                                                            }}
                                                            className="inline-flex items-center gap-1 h-7 px-3 text-base font-medium rounded-[6px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                                                            <ShieldCheck className="w-4 h-4" /> Allow Access
                                                          </button>
                                                        </>
                                                      )}
                                                    </div>
                                                  </div>
                                                ) : invExtracting && invSchedSrcLabel?.startsWith("Plaid") ? (
                                                  /* Plaid — pulling data */
                                                  <div className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-[10px] border border-violet-300/40 bg-violet-50/20 text-center">
                                                    <div className="relative">
                                                      <div className="absolute inset-0 rounded-full bg-violet-400/20 blur-md animate-pulse" />
                                                      <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-sm">
                                                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                                                      </div>
                                                    </div>
                                                    <div>
                                                      <p className="text-base font-semibold text-foreground">Pulling from Plaid…</p>
                                                      <p className="text-base text-muted-foreground luka-thinking-text mt-0.5">Extracting transactions from {invSchedSrcLabel.replace("Plaid — ", "")}</p>
                                                    </div>
                                                  </div>
                                                ) : invSchedSrcLabel?.startsWith("Plaid") && invReviewRows.length > 0 ? (
                                                  /* Plaid — connected + data pulled */
                                                  <div className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-[10px] border border-green-200 bg-green-50/40 text-center">
                                                    <div className="relative">
                                                      <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-sm">
                                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                                      </div>
                                                    </div>
                                                    <div>
                                                      <p className="text-base font-semibold text-green-800">Connected via Plaid</p>
                                                      <p className="text-base text-green-700 mt-0.5">{invSchedSrcLabel.replace("Plaid — ", "")} · {invReviewRows.length} transactions pulled</p>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  /* Plaid — point to toolbar */
                                                  <div className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-[10px] border border-dashed border-violet-300/30 bg-violet-50/10 text-center">
                                                    <div className="relative">
                                                      <div className="absolute inset-0 rounded-full bg-violet-400/10 blur-md" />
                                                      <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/60 to-blue-500/60 flex items-center justify-center shadow-sm">
                                                        <Zap className="w-4 h-4 text-white" />
                                                      </div>
                                                    </div>
                                                    <p className="text-base text-muted-foreground leading-relaxed max-w-[180px]">
                                                      To connect Plaid for this Investment Schedule, select{" "}
                                                      <span className="inline-flex items-center gap-0.5 font-semibold text-foreground">
                                                        <Plus className="h-2.5 w-2.5" /> then connect Plaid
                                                      </span>{" "}
                                                      in the toolbar below.
                                                    </p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            {/* ── Broker error ── */}
                                            {invBrokerError && (
                                              <div className="flex items-start gap-2 px-3 py-2 rounded-[8px] bg-red-50 border border-red-200">
                                                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                                <p className="text-base text-red-700">{invBrokerError}</p>
                                              </div>
                                            )}

                                            {/* ── File chips ── */}
                                            {invUploadFiles.length > 0 && (
                                              <div className="flex flex-wrap gap-2">
                                                {invUploadFiles.map(f => {
                                                  const isError = f.kind === "unsupported" || f.kind === "oversized";
                                                  const isAmbig = f.kind === "ambiguous" && !f.userKind;
                                                  return (
                                                    <div key={f.id} className={cn(
                                                      "inline-flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-[10px] border bg-background text-base max-w-[220px]",
                                                      isError ? "border-red-200" : isAmbig ? "border-amber-300" : "border-border"
                                                    )}>
                                                      <div className={cn("w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0", isError ? "bg-red-50" : "bg-primary/10")}>
                                                        {f.ext === "pdf" ? <FileText className="h-5 w-5 text-primary shrink-0" /> : f.ext === "zip" ? <FolderOpen className="h-5 w-5 text-primary shrink-0" /> : <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />}
                                                      </div>
                                                      <span className="flex-1 min-w-0 truncate font-medium text-foreground">{f.name}</span>
                                                      {isAmbig && (
                                                        <select onClick={e => e.stopPropagation()} defaultValue=""
                                                          onChange={e => {
                                                            const v = e.target.value as Exclude<InvFileKind, "ambiguous"|"unsupported"|"oversized">;
                                                            setInvUploadFiles(prev => prev.map(x => x.id === f.id ? { ...x, userKind: v } : x));
                                                          }}
                                                          className="text-base border border-amber-300 rounded-[6px] px-1 py-0.5 bg-background text-amber-700 focus:outline-none cursor-pointer shrink-0 max-w-[110px]"
                                                        >
                                                          <option value="" disabled>Classify…</option>
                                                          <option value="statement">Statement</option>
                                                          <option value="trade-confirm">Trade Confirm</option>
                                                          <option value="account-summary">Account Summary</option>
                                                          <option value="workpaper">Prior Year WP</option>
                                                        </select>
                                                      )}
                                                      {isError && <span className="text-base text-red-600 shrink-0">{f.kind === "unsupported" ? "Unsupported" : "Too large"}</span>}
                                                      <button onClick={e => { e.stopPropagation(); setInvUploadFiles(prev => prev.filter(x => x.id !== f.id)); }} className="shrink-0 text-red-400 hover:text-red-600 transition-colors">
                                                        <Trash2 className="h-5 w-5" />
                                                      </button>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}

                                            {/* ── Missing months / gap error ── */}
                                            {invMissingMonthsPrompt !== null && invMissingMonthsPrompt.length > 0 && invReviewRows.length === 0 && (
                                              <div className="space-y-3">
                                                <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 space-y-2">
                                                  <div className="flex items-center gap-2">
                                                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                                                    <p className="text-base font-semibold text-red-900">Statements Not in Continuity — Cannot Proceed</p>
                                                  </div>
                                                  <p className="text-base text-red-800 leading-relaxed">
                                                    The following month{invMissingMonthsPrompt.length !== 1 ? "s are" : " is"} missing, creating a gap in the statement period. All broker statements must be uploaded in full continuity — no gaps allowed.
                                                  </p>
                                                  <div className="flex flex-wrap gap-2 pt-0.5">
                                                    {invMissingMonthsPrompt.map(m => (
                                                      <span key={m} className="inline-flex items-center px-2 py-1 rounded-full text-base font-semibold border bg-red-100 text-red-700 border-red-200">{m}</span>
                                                    ))}
                                                  </div>
                                                  <p className="text-base text-red-700 pt-0.5">
                                                    <strong>Note:</strong> The first and last statements may be cut-off (partial month) — this is allowed. All months in between must be present.
                                                  </p>
                                                </div>
                                              </div>
                                            )}

                                            {/* ── Review table ── */}
                                            {invReviewRows.length > 0 && (
                                              <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                  <span className="text-base font-semibold text-foreground">
                                                    {invReviewRows.length} transaction{invReviewRows.length !== 1 ? "s" : ""} extracted — review before submitting
                                                  </span>
                                                </div>
                                                <div className="rounded-[8px] border border-border overflow-clip">
                                                  <div className="w-full">
                                                    {(() => {
                                                      const sortedInvRows = invTableSort
                                                        ? [...invReviewRows].sort((a, b) => {
                                                            const av = String(a[invTableSort.field] ?? "");
                                                            const bv = String(b[invTableSort.field] ?? "");
                                                            const num = (s: string) => parseFloat(s.replace(/[^0-9.-]/g, ""));
                                                            const aNum = num(av), bNum = num(bv);
                                                            const cmp = isNaN(aNum) || isNaN(bNum) ? av.localeCompare(bv) : aNum - bNum;
                                                            return invTableSort.dir === "asc" ? cmp : -cmp;
                                                          })
                                                        : invReviewRows;
                                                      const handleInvSort = (field: keyof InvReviewRow) => {
                                                        setInvTableSort(prev => prev?.field === field ? { field, dir: prev.dir === "asc" ? "desc" : "asc" } : { field, dir: "asc" });
                                                      };
                                                      return (
                                                    <table className="w-full text-base" style={{ minWidth: 1780 }}>
                                                      <thead className="sticky top-0 z-10 bg-background">
                                                        <tr className="bg-muted/30 border-b border-border">
                                                          {([
                                                            ["date","Trade Date"],["settlement","Settlement †"],["account","Account #"],
                                                            ["security","Security *"],["ticker","Ticker"],["type","Type *"],["currency","CCY"],
                                                            ["units","Units"],["price","Price"],["amount","Amount (CAD)"],["fxRate","FX Rate"],["","Balance"],["",""]
                                                          ] as [keyof InvReviewRow | "", string][]).map(([field, label], i) => {
                                                            const isSort = field && invTableSort?.field === field;
                                                            const isLast = label === "";
                                                            const isBalance = label === "Balance";
                                                            return (
                                                              <th key={i} className={`px-2 py-1.5 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${isLast ? "sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] z-10 text-left" : isBalance ? "text-right" : "text-left"}`}>
                                                                {field ? (
                                                                  <button onClick={() => handleInvSort(field as keyof InvReviewRow)} className="inline-flex items-center gap-0.5 hover:text-foreground transition-colors">
                                                                    {label.endsWith(" *") ? <>{label.slice(0,-2)} <span className="text-red-500">*</span></> : label}
                                                                    {isSort
                                                                      ? invTableSort!.dir === "asc"
                                                                        ? <ArrowUp className="h-2.5 w-2.5 text-primary ml-0.5" />
                                                                        : <ArrowDown className="h-2.5 w-2.5 text-primary ml-0.5" />
                                                                      : <ArrowUpDown className="h-2.5 w-2.5 text-muted-foreground/40 ml-0.5" />}
                                                                  </button>
                                                                ) : label}
                                                              </th>
                                                            );
                                                          })}
                                                        </tr>
                                                      </thead>
                                                      <tbody>
                                                        {(() => {
                                                          // Compute running balance (excludes voided rows)
                                                          let runBal = 0;
                                                          return sortedInvRows.map((row, ri) => {
                                                          if (!row.voided) runBal += parseFloat(row.amount || "0");
                                                          const rowBal = runBal;
                                                          const IC = "h-6 text-base px-1.5 border rounded bg-background focus:outline-none w-full border-border focus:border-primary/40";
                                                          const upd = (field: keyof InvReviewRow, val: string) =>
                                                            setInvReviewRows(prev => prev.map(r => r.id === row.id ? { ...r, [field]: val } : r));
                                                          const voidRow = () => {
                                                            const isScanned = row.source && !row.isManual;
                                                            if (isScanned && !row.voided) {
                                                              setInvReviewRows(prev => prev.map(r => r.id === row.id ? { ...r, voided: true, voidedAt: new Date().toISOString() } : r));
                                                            } else {
                                                              setInvReviewRows(prev => prev.map(r => r.id === row.id ? { ...r, voided: true, voidedAt: new Date().toISOString() } : r));
                                                            }
                                                          };
                                                          const restoreRow = () => setInvReviewRows(prev => prev.map(r => r.id === row.id ? { ...r, voided: false, voidedAt: undefined } : r));
                                                          const insertAfter = () => setInvReviewRows(prev => {
                                                            const idx = prev.findIndex(r => r.id === row.id);
                                                            const newRow: InvReviewRow = { id: `ir-manual-${Date.now()}`, date: row.date, settlement: row.date, security: "", ticker: "", type: "Purchase", units: "", price: "", amount: "", fxRate: "", currency: row.currency, account: row.account, accountType: row.accountType, source: "", isManual: true };
                                                            return [...prev.slice(0, idx + 1), newRow, ...prev.slice(idx + 1)];
                                                          });
                                                          return (
                                                            <Fragment key={row.id}>
                                                            <tr className={`border-b border-border/40 transition-all ${row.voided ? "opacity-50 bg-red-50/30 line-through-row" : ri % 2 === 1 ? "bg-muted/10" : ""}`}>
                                                              <td className={`px-1.5 py-1 min-w-[110px] ${!row.date && !row.voided ? "bg-amber-50/60" : ""}`} title={!row.date ? "Trade date not in statement — enter manually" : undefined}><input value={row.date} onChange={e => upd("date", e.target.value)} type="date" className={IC} /></td>
                                                              <td className="px-1.5 py-1 min-w-[110px]"><input value={row.settlement ?? ""} onChange={e => upd("settlement", e.target.value)} type="date" className={IC} /></td>
                                                              <td className="px-1.5 py-1 min-w-[130px]"><input value={row.account ?? ""} onChange={e => upd("account", e.target.value)} className={cn(IC, "w-32 font-mono")} placeholder="H11-XXXX-X" /></td>
                                                              <td className="px-1.5 py-1 min-w-[200px]"><input value={row.security} onChange={e => upd("security", e.target.value)} className={cn(IC, "w-52")} placeholder="Security name" /></td>
                                                              <td className="px-1.5 py-1 min-w-[70px]"><input value={row.ticker} onChange={e => upd("ticker", e.target.value)} className={cn(IC, "w-16 font-mono uppercase")} placeholder="TICK" /></td>
                                                              <td className="px-1.5 py-1 min-w-[130px]">
                                                                <div className="relative">
                                                                  <select value={row.type} onChange={e => upd("type", e.target.value)} className={cn(IC, "w-36 appearance-none pr-6 cursor-pointer")}>
                                                                    {TX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                                  </select>
                                                                  <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                </div>
                                                              </td>
                                                              <td className="px-1.5 py-1 min-w-[55px]">
                                                                <select value={row.currency} onChange={e => upd("currency", e.target.value)} className={cn(IC, "w-14 appearance-none")}>
                                                                  {["CAD","USD","EUR","GBP"].map(c => <option key={c}>{c}</option>)}
                                                                </select>
                                                              </td>
                                                              <td className="px-1.5 py-1 min-w-[80px]">
                                                                {row.units ? (
                                                                  <input value={row.units} onChange={e => upd("units", e.target.value)} className={cn(IC, "w-20 text-right tabular-nums")} placeholder="0.0000" />
                                                                ) : (
                                                                  <span className="text-base text-muted-foreground px-1.5">—</span>
                                                                )}
                                                              </td>
                                                              <td className="px-1.5 py-1 min-w-[80px]"><input value={row.price} onChange={e => upd("price", e.target.value)} className={cn(IC, "w-20 text-right")} placeholder="0.000" /></td>
                                                              <td className="px-1.5 py-1 min-w-[100px]">
                                                                <input value={row.amount ?? ""} onChange={e => upd("amount", e.target.value)}
                                                                  className={cn(IC, "w-24 text-right font-medium tabular-nums")}
                                                                  placeholder="0.00" />
                                                              </td>
                                                              <td className="px-1.5 py-1 min-w-[75px]"><input value={row.fxRate ?? ""} onChange={e => upd("fxRate", e.target.value)} className={cn(IC, "w-20 text-right font-mono")} placeholder="1.0000" /></td>
                                                              {/* Running balance */}
                                                              <td className="px-2 py-1 text-right tabular-nums text-base font-semibold whitespace-nowrap">
                                                                {row.voided
                                                                  ? <span className="text-base text-muted-foreground italic">voided</span>
                                                                  : <span className="text-foreground">{rowBal.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
                                                              </td>
                                                              {/* Actions: void / restore + insert */}
                                                              <td className="px-1.5 py-1 sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] z-10">
                                                                <div className="flex items-center gap-0.5">
                                                                  {row.voided ? (
                                                                    <button onClick={restoreRow} title="Restore entry" className="p-1 rounded hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors">
                                                                      <RotateCcw className="h-4 w-4" />
                                                                    </button>
                                                                  ) : (
                                                                    <button onClick={voidRow} title={row.source && !row.isManual ? `Void — re-upload ${row.source} to restore` : "Void entry"} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors">
                                                                      <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                  )}
                                                                  <button onClick={insertAfter} title="Insert row after" className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                                                                    <Plus className="h-4 w-4" />
                                                                  </button>
                                                                </div>
                                                              </td>
                                                            </tr>
                                                            {/* Voided banner below the row */}
                                                            {row.voided && (
                                                              <tr className="border-b border-red-100">
                                                                <td colSpan={16} className="px-3 py-1 bg-red-50/50">
                                                                  <div className="flex items-center gap-2">
                                                                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                                                                    <span className="text-base text-red-600">
                                                                      Entry voided — excluded from running balance.
                                                                      {row.source && !row.isManual && <> Re-upload <strong>{row.source}</strong> to restore this scanned transaction.</>}
                                                                    </span>
                                                                    <button onClick={insertAfter} className="ml-auto inline-flex items-center gap-0.5 text-base text-primary hover:underline">
                                                                      <Plus className="h-2.5 w-2.5" /> Add replacement entry here
                                                                    </button>
                                                                  </div>
                                                                </td>
                                                              </tr>
                                                            )}
                                                            </Fragment>
                                                          );
                                                          });
                                                        })()}
                                                      </tbody>
                                                    </table>
                                                      );
                                                    })()}
                                                  </div>
                                                  <p className="mt-2 text-base text-muted-foreground/70 px-1">
                                                    <span className="font-medium text-foreground/60">†</span> Settlement date sourced from statement.
                                                    Trade date is not included in brokerage statements — <span className="text-amber-600 font-medium">highlighted cells</span> require manual entry.
                                                  </p>
                                                </div>
                                              </div>
                                            )}

                                            {/* ── Continuity status (no manual button — extraction is automatic) ── */}
                                            {validFiles.length > 0 && invReviewRows.length === 0 && !invExtracting && !(invMissingMonthsPrompt !== null && invMissingMonthsPrompt.length > 0) && (
                                              <div className="pt-1">
                                                {invContinuityOk ? (
                                                  <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2 text-base text-green-700">
                                                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                                                      <span><strong>{validFiles.length}</strong> statement{validFiles.length !== 1 ? "s" : ""} — all months in continuity ✓</span>
                                                    </div>
                                                    {(() => {
                                                      const detected = [...new Set(validFiles.map(f => {
                                                        for (const [pat, label] of BROKER_PATTERNS) { if (pat.test(f.name)) return label; }
                                                        return null;
                                                      }).filter(Boolean))];
                                                      return detected.length > 0 ? <p className="text-base text-muted-foreground pl-5">Broker: {detected[0]} · Each broker is processed with its own adjusting entry</p> : null;
                                                    })()}
                                                  </div>
                                                ) : (
                                                  <span className="text-base text-muted-foreground">{validFiles.length} statement{validFiles.length !== 1 ? "s" : ""} added</span>
                                                )}
                                              </div>
                                            )}

                                            {/* Extracting spinner */}
                                            {invExtracting && (
                                              <div className="flex items-center gap-2 py-1">
                                                <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                                                <span className="text-base text-foreground luka-thinking-text">Extracting transaction data from {validFiles.length} statement{validFiles.length !== 1 ? "s" : ""}…</span>
                                              </div>
                                            )}

                                            {/* ── Submit (after extraction) ── */}
                                            {invReviewRows.length > 0 && (
                                              <div className="flex items-center justify-end gap-2 pt-1">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-base text-muted-foreground">{invReviewRows.length} transaction{invReviewRows.length !== 1 ? "s" : ""}</span>
                                                  <button
                                                    onClick={() => {
                                                      // Convert review rows to Transaction[] for the schedule workpaper
                                                      const txns: import("@/lib/luka/types").Transaction[] = invReviewRows
                                                        .filter(r => !r.voided)
                                                        .map(r => ({
                                                          id: r.id,
                                                          sourceId: r.account || "manual",
                                                          date: r.date,
                                                          settlementDate: r.settlement || r.date,
                                                          security: r.security,
                                                          ticker: r.ticker,
                                                          type: r.type as import("@/lib/luka/types").TxType,
                                                          units: parseFloat(r.units) || 0,
                                                          price: parseFloat(r.price) || 0,
                                                          gross: Math.abs(parseFloat(r.amount) || 0),
                                                          fees: 0,
                                                          net: parseFloat(r.amount) || 0,
                                                          currency: (r.currency as "CAD" | "USD" | "EUR" | "GBP") || "CAD",
                                                          fxRate: parseFloat(r.fxRate) || 1,
                                                          status: "published" as const,
                                                          tbAccount: defaultTbAccountForActivity(r.type),
                                                        }));
                                                      setInvSubmittedTxns(txns);
                                                      setInvSchedGenerated(true);
                                                      setInvSchedPhase("done");
                                                    }}
                                                    className="inline-flex items-center gap-2 h-8 px-5 text-base font-semibold bg-primary text-primary-foreground rounded-[8px] hover:bg-primary/90 transition-colors"
                                                  >
                                                    Submit
                                                  </button>
                                                </div>
                                              </div>
                                            )}
                                          </>
                                        );
                                      })()}
                                  </>
                                ) : (
                                  /* ── DONE / SCHEDULE VIEW ── */
                                  <>
                                    <InvestmentScheduleResponse
                                      onEditTransactions={() => { setInvSchedPhase("upload-prompt"); }}
                                      initialTransactions={invSubmittedTxns.length > 0 ? invSubmittedTxns : undefined}
                                      engagementYearEnd={ENGAGEMENTS_PANEL.find(e => e.id === invSelectedEngId)?.yearEnd}
                                    />
                                  </>
                                )}
                                </>
                                )}
                                  </>);
                                })()}
                              </div>
                            ) : richResponseType === "loan-amortization" ? (
                              <div className="space-y-2.5 py-0.5">
                                {/* Step 1: Searching workpapers */}
                                <div className="flex items-center gap-2">
                                  {amortPhase === "search-wp" ? (
                                    <span className="flex gap-0.5 shrink-0">
                                      <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-1" />
                                      <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-2" />
                                      <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-3" />
                                    </span>
                                  ) : (
                                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                  )}
                                  <span className={cn("text-base text-foreground", amortPhase === "search-wp" && "luka-thinking-text")}>
                                    Searching engagement for existing Loan Amortization workpapers
                                  </span>
                                </div>
                                {/* Step 2: Checking drives */}
                                {(amortPhase === "search-drives" || amortPhase === "found" || amortPhase === "wizard") && (
                                  <div className="flex items-center gap-2">
                                    {amortPhase === "search-drives" ? (
                                      <span className="flex gap-0.5 shrink-0">
                                        <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-1" />
                                        <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-2" />
                                        <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-3" />
                                      </span>
                                    ) : (
                                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                    )}
                                    <span className={cn("text-base text-foreground", amortPhase === "search-drives" && "luka-thinking-text")}>
                                      Checking connected drives (Google Drive)
                                    </span>
                                  </div>
                                )}
                                {/* Found result */}
                                {(amortPhase === "found" || amortPhase === "wizard") && (
                                  <div className="flex items-center gap-2 mt-0.5 pl-5">
                                    <span className="text-base text-foreground">
                                      Found <strong>2 matching documents</strong> — select how to proceed below ↓
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : richResponseType === "gross-margin" ? (
                              <><GrossMarginResponse revealStep={revealStep} />{revealStep >= 5 && <LukaResponseActions />}</>
                            ) : (
                              <>
                                <div className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
                                  {displayedResponse}
                                  {isStreaming && <span className="inline-block w-0.5 h-4 bg-primary/70 ml-0.5 align-middle luka-thinking-text" />}
                                </div>
                                {!isStreaming && aiResponse && <LukaResponseActions />}
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ── Turn 2: user confirmation + Long-term Asset workpaper view ── */}
                      {loanAmortStep !== "idle" && loanAmortData && (
                        <>
                          {/* User bubble — form summary */}
                          <div className="flex justify-end">
                            <div className="max-w-[80%] px-4 py-3 rounded-[12px] bg-primary text-primary-foreground text-base leading-relaxed">
                              {loanAmortData.uploadedFile
                                ? <>Analyse loan agreement <strong>{loanAmortData.uploadedFile}</strong> and show the Long-term Asset workpaper</>
                                : <>Show Long-term Asset workpaper
                                  {loanAmortData.principalAmount && <> for <strong>${loanAmortData.principalAmount}</strong></>}
                                  {loanAmortData.annualInterestRate && ` at ${loanAmortData.annualInterestRate}% ${loanAmortData.interestRateType}`}
                                  {loanAmortData.loanTenure && `, ${loanAmortData.loanTenure} months`}
                                  {loanAmortData.paymentType && ` — ${loanAmortData.paymentType}`}
                                </>
                              }
                            </div>
                          </div>

                          {/* Luka response */}
                          <div className="flex items-start gap-3 min-w-0 max-w-full">
                            <div className={cn(
                              "w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0",
                              loanAmortStep === "thinking" && "luka-thinking-spin",
                            )}>
                              <LukaIcon size={16} />
                            </div>
                            <div className="flex-1 pt-1.5 min-h-[28px] min-w-0">
                              {loanAmortStep === "thinking" ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-base font-medium text-foreground luka-thinking-text">Analysing Long-term Asset workpaper</span>
                                  <span className="flex gap-0.5">
                                    <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-1" />
                                    <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-2" />
                                    <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-3" />
                                  </span>
                                </div>
                              ) : (
                                <LongTermAssetResponse onEditLoans={() => { setLtDebtGenerated(false); setLtDebtPhase("upload-prompt"); }} />
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* ── Turn 2: LT Debt workpaper generated ── */}
                      {ltDebtGenerated && ltDebtSrcLabel && (
                        <>
                          {/* User bubble */}
                          <div className="flex justify-end">
                            <div className="max-w-[80%] px-4 py-3 rounded-[12px] bg-primary text-primary-foreground text-base leading-relaxed">
                              Generate Long-term Debt workpaper from <strong>{ltDebtSrcLabel}</strong>
                            </div>
                          </div>

                          {/* Luka response */}
                          <div className="flex items-start gap-3 min-w-0 max-w-full">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0">
                              <LukaIcon size={16} />
                            </div>
                            <div className="flex-1 pt-1.5 min-w-0 overflow-x-auto">
                              <LongTermAssetResponse onEditLoans={() => { setLtDebtGenerated(false); setLtDebtPhase("upload-prompt"); }} />
                              {followUpTurns.length === 0 && !addMoreLoansActive && (
                                <div className="mt-4 space-y-2">
                                  <p className="text-base text-muted-foreground font-medium">What would you like to explore next?</p>
                                  <div className="flex flex-wrap gap-2">
                                    {[
                                      "Review covenant compliance",
                                      "Show maturity schedule",
                                      "Calculate accrued interest",
                                      "Generate journal entries",
                                      "Export workpaper to Excel",
                                    ].map(chip => (
                                      <button
                                        key={chip}
                                        onClick={() => triggerFollowUp(chip)}
                                        className="inline-flex items-center gap-2 h-8 px-3 rounded-[8px] border border-primary/25 bg-primary/6 text-base font-medium text-primary hover:bg-primary/15 transition-colors"
                                      >
                                        {chip}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* ── Add More Loans turn ── */}
                      {addMoreLoansActive && (() => {
                        const amValidFiles  = addMoreLtFiles.filter(f => f.kind !== "ambiguous" && f.kind !== "unsupported" && f.kind !== "oversized");
                        const amAmbigFiles  = addMoreLtFiles.filter(f => f.kind === "ambiguous");
                        const amMissingCount = addMoreLtRows.reduce((s, row) =>
                          s + LT_REVIEW_REQUIRED.filter(f => ltRowMissing(row, f)).length, 0);
                        const amCanSubmit = (amValidFiles.length > 0 || addMoreLtRows.length > 0) && amAmbigFiles.length === 0 && amMissingCount === 0;
                        return (
                          <>
                            {/* User bubble */}
                            <div className="flex justify-end">
                              <div className="max-w-[80%] px-4 py-3 rounded-[12px] bg-primary text-primary-foreground text-base leading-relaxed">
                                Add more loans to the workpaper
                              </div>
                            </div>
                            {/* Luka response */}
                            <div className="flex items-start gap-3 min-w-0 max-w-full">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0">
                                <LukaIcon size={16} />
                              </div>
                              <div className="flex-1 pt-1.5 min-w-0 space-y-3">
                                {!addMoreDone ? (
                                  <>
                                    <p className="text-base text-foreground">Upload loan documents or add entries manually below, then click <strong>Submit</strong> to append to the workpaper.</p>

                                    {/* Drop zone */}
                                    <label className="flex flex-col items-center justify-center gap-2 h-20 rounded-[10px] border-2 border-dashed border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors text-center px-4">
                                      <input type="file" multiple accept=".pdf,.xlsx,.xls,.csv,.zip" className="hidden" onChange={e => {
                                        const classified = Array.from(e.target.files ?? []).map(classifyLtDebtFile);
                                        setAddMoreLtFiles(prev => {
                                          const next = [...prev, ...classified];
                                          const newValid = classified.filter(f => f.kind !== "ambiguous" && f.kind !== "unsupported" && f.kind !== "oversized");
                                          const newValidNotYet = newValid.filter(f => !addMoreProcessedIds.has(f.id));
                                          if (newValidNotYet.length > 0) {
                                            setAddMoreLtRows(r => [...r, ...newValidNotYet.flatMap(mockLtRowsFromFile)]);
                                            setAddMoreProcessedIds(ids => { const s = new Set(ids); newValidNotYet.forEach(f => s.add(f.id)); return s; });
                                          }
                                          return next;
                                        });
                                        e.target.value = "";
                                      }} />
                                      <Upload className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-base text-muted-foreground">Drop files or <span className="text-primary font-medium">browse</span> · PDF, XLSX, CSV, ZIP · max 25 MB</span>
                                    </label>

                                    {/* File chips */}
                                    {addMoreLtFiles.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {addMoreLtFiles.map(f => (
                                          <span key={f.id} className={cn("inline-flex items-center gap-1 text-base px-2 py-1 rounded-full border font-medium",
                                            f.kind === "unsupported" || f.kind === "oversized" ? "bg-red-50 text-red-600 border-red-200"
                                            : f.kind === "ambiguous" ? "bg-amber-50 text-amber-700 border-amber-200"
                                            : "bg-primary/8 text-primary border-primary/25")}>
                                            {f.name}
                                            <button onClick={() => { setAddMoreLtFiles(p => p.filter(x => x.id !== f.id)); setAddMoreLtRows(p => p.filter(r => r.sourceFile !== f.name)); }} className="ml-0.5 hover:text-red-500"><X className="w-2.5 h-2.5" /></button>
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {/* Review table */}
                                    {addMoreLtRows.length > 0 && (
                                      <div className="rounded-[8px] border border-border overflow-hidden">
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-base" style={{ minWidth: 2400 }}>
                                            <thead>
                                              <tr className="bg-muted/30 border-b border-border">
                                                {["Loan Name *","Lender *","Current Collateral","Type","Rate Type","Int. Rate % *","Start *","Maturity *","First Payment","CCY","Mo. Payment","Orig. Loan Amt","FX Rate","Opening Bal. *","GL Principal *","Day Count","Payment Type","Freq.","Compounding","IO Period (mo.)","Balloon Amt","Status",""].map((h, i) => (
                                                  <th key={i} className={`px-2 py-1.5 text-base font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${LT_RIGHT_COLS.has(h) ? "text-right" : "text-left"} ${h === "" ? "sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] z-10" : ""}`}>
                                                    {h.endsWith(" *") ? <>{h.slice(0,-2)} <span className="text-red-500">*</span></> : h}
                                                  </th>
                                                ))}
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {addMoreLtRows.map((row, ri) => {
                                                const fc2 = (field: keyof LtDebtReviewRow, req: boolean) =>
                                                  cn("h-6 text-base px-1.5 border rounded bg-background focus:outline-none w-full",
                                                    req && ltRowMissing(row, field)
                                                      ? "border-red-400 bg-red-50/60 placeholder:text-red-400 text-red-600 focus:border-red-500"
                                                      : "border-border focus:border-primary/40");
                                                return (
                                                  <tr key={row.id} className={`border-b border-border/40 ${ri % 2 === 1 ? "bg-muted/10" : ""}`}>
                                                    <td className="px-1.5 py-1 min-w-[130px]"><input value={row.name} onChange={e => updateAddMoreRow(row.id,"name",e.target.value)} className={cn(fc2("name",true),"w-32")} placeholder="Loan name" /></td>
                                                    <td className="px-1.5 py-1 min-w-[110px]"><input value={row.lender} onChange={e => updateAddMoreRow(row.id,"lender",e.target.value)} className={cn(fc2("lender",true),"w-28")} placeholder="Lender" /></td>
                                                    <td className="px-1.5 py-1 min-w-[120px]"><input value={row.collateral} onChange={e => updateAddMoreRow(row.id,"collateral",e.target.value)} className={cn(fc2("collateral",false),"w-28")} placeholder="e.g. Real property" /></td>
                                                    <td className="px-1.5 py-1"><select value={row.type} onChange={e => updateAddMoreRow(row.id,"type",e.target.value)} className={cn(SCR,"w-20")}>{["Term","LOC","Revolver","Mortgage","Bridge"].map(t=><option key={t}>{t}</option>)}</select></td>
                                                    <td className="px-1.5 py-1"><select value={row.interestType} onChange={e => updateAddMoreRow(row.id,"interestType",e.target.value)} className={cn(SCR,"w-22")}>{["Fixed","Variable","Floating","Hybrid","Step Rate"].map(t=><option key={t}>{t}</option>)}</select></td>
                                                    <td className="px-1.5 py-1"><input value={row.rate} onChange={e => updateAddMoreRow(row.id,"rate",e.target.value)} className={cn(fc2("rate",true),"w-14 text-right")} placeholder="%" /></td>
                                                    <td className="px-1.5 py-1"><input type="date" value={row.startDate} onChange={e => updateAddMoreRow(row.id,"startDate",e.target.value)} className={cn(fc2("startDate",true),"w-28")} /></td>
                                                    <td className="px-1.5 py-1"><input type="date" value={row.maturityDate} onChange={e => updateAddMoreRow(row.id,"maturityDate",e.target.value)} className={cn(fc2("maturityDate",true),"w-28")} /></td>
                                                    <td className="px-1.5 py-1"><input type="date" value={row.firstPaymentDate} onChange={e => updateAddMoreRow(row.id,"firstPaymentDate",e.target.value)} className={cn(fc2("firstPaymentDate",false),"w-28")} /></td>
                                                    <td className="px-1.5 py-1"><select value={row.currency} onChange={e => updateAddMoreRow(row.id,"currency",e.target.value)} className={cn(SCR,"w-14")}>{["CAD","USD","EUR","GBP"].map(c=><option key={c}>{c}</option>)}</select></td>
                                                    <td className="px-1.5 py-1"><input value={row.monthlyPayment} onChange={e => updateAddMoreRow(row.id,"monthlyPayment",e.target.value)} className={cn(fc2("monthlyPayment",false),"w-24 text-right")} placeholder="auto" /></td>
                                                    <td className="px-1.5 py-1"><input value={row.originalPrincipal} onChange={e => updateAddMoreRow(row.id,"originalPrincipal",e.target.value)} className={cn(fc2("originalPrincipal",false),"w-24 text-right")} placeholder="0" /></td>
                                                    <td className="px-1.5 py-1"><input value={row.fxRate} onChange={e => updateAddMoreRow(row.id,"fxRate",e.target.value)} className={cn(fc2("fxRate",false),"w-16 text-right font-mono")} placeholder="1.000" /></td>
                                                    <td className="px-1.5 py-1"><input value={row.currentBalance} onChange={e => updateAddMoreRow(row.id,"currentBalance",e.target.value)} className={cn(fc2("currentBalance",true),"w-24 text-right")} placeholder="Balance" /></td>
                                                    <td className="px-1.5 py-1 min-w-[160px]"><GLComboboxMini value={row.glPrincipal} onChange={v => updateAddMoreRow(row.id,"glPrincipal",v)} required={ltRowMissing(row,"glPrincipal")} /></td>
                                                    <td className="px-1.5 py-1"><select value={row.dayCount} onChange={e => updateAddMoreRow(row.id,"dayCount",e.target.value)} className={cn(SCR,"w-20")}>{["ACT/365","ACT/360","30/360"].map(d=><option key={d}>{d}</option>)}</select></td>
                                                    <td className="px-1.5 py-1"><select value={row.paymentType} onChange={e => updateAddMoreRow(row.id,"paymentType",e.target.value)} className={cn(SCR,"w-24")}>{["P&I","Interest-only","Balloon"].map(p=><option key={p}>{p}</option>)}</select></td>
                                                    <td className="px-1.5 py-1"><select value={row.paymentFrequency} onChange={e => updateAddMoreRow(row.id,"paymentFrequency",e.target.value)} className={cn(SCR,"w-22")}>{["Monthly","Quarterly","Semi-annual","Annual"].map(f=><option key={f}>{f}</option>)}</select></td>
                                                    <td className="px-1.5 py-1"><select value={row.compounding} onChange={e => updateAddMoreRow(row.id,"compounding",e.target.value)} className={cn(SCR,"w-22")}>{["Monthly","Quarterly","Semi-annual","Annual"].map(f=><option key={f}>{f}</option>)}</select></td>
                                                    <td className="px-1.5 py-1"><input value={row.ioPeriod} onChange={e => updateAddMoreRow(row.id,"ioPeriod",e.target.value)} className={cn(fc2("ioPeriod",false),"w-14 text-right")} placeholder="0" /></td>
                                                    <td className="px-1.5 py-1"><input value={row.balloonAmt} onChange={e => updateAddMoreRow(row.id,"balloonAmt",e.target.value)} className={cn(fc2("balloonAmt",false),"w-24 text-right")} placeholder="0" /></td>
                                                    <td className="px-1.5 py-1"><select value={row.status} onChange={e => updateAddMoreRow(row.id,"status",e.target.value)} className={cn(SCR,"w-20")}>{["Active","Closed","Replaced","Inactive"].map(s=><option key={s}>{s}</option>)}</select></td>
                                                    <td className="px-1.5 py-1 sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] z-10">
                                                      <button onClick={() => deleteAddMoreRow(row.id)} className="inline-flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}

                                    {/* Bottom actions */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <button onClick={() => setAddMoreLtRows(prev => [...prev, EMPTY_LT_ROW()])} className="inline-flex items-center gap-2 h-9 px-4 text-base font-medium rounded-[8px] border border-border bg-background text-foreground hover:bg-muted/60 transition-colors">
                                        <Plus className="w-5 h-5" /> Add Manual Entry
                                      </button>
                                      <button
                                        disabled={!amCanSubmit}
                                        onClick={() => { if (amCanSubmit) setAddMoreDone(true); }}
                                        className={cn("inline-flex items-center gap-2 h-9 px-5 text-base font-medium rounded-[8px] transition-colors",
                                          amCanSubmit ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer" : "bg-muted/60 text-muted-foreground/50 cursor-not-allowed border border-border/50 opacity-60")}
                                      >
                                        Submit
                                      </button>
                                      {amMissingCount > 0 && (
                                        <span className="text-base text-red-500">Fill in the <strong>{amMissingCount}</strong> highlighted field{amMissingCount !== 1 ? "s" : ""} to continue</span>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  /* ── Done: show updated workpaper ── */
                                  <>
                                    <p className="text-base text-foreground">
                                      <CheckCircle2 className="inline w-4 h-4 text-green-600 mr-1" />
                                      <strong>{addMoreLtRows.length} loan{addMoreLtRows.length !== 1 ? "s" : ""}</strong> added — here's the updated workpaper:
                                    </p>
                                    <LongTermAssetResponse onEditLoans={() => { setLtDebtGenerated(false); setLtDebtPhase("upload-prompt"); }} />
                                  </>
                                )}
                              </div>
                            </div>
                          </>
                        );
                      })()}

                      {/* ── Free-prompt follow-up turns ── */}
                      {followUpTurns.map(turn => {
                        const cfg = FOLLOW_UP_CFG[turn.intent];
                        const isThinkingTurn  = turn.phase === "thinking";
                        const isClarifying    = turn.phase === "clarifying";
                        const isWorking       = turn.phase === "working";
                        const isDone          = turn.phase === "done";

                        // ── Rich result content based on intent ──
                        const renderResult = () => {
                          const choice = turn.clarifyChoice ?? "";
                          switch (turn.intent) {

                            case "covenant": return (
                              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                <p className="text-base text-foreground">
                                  {choice.includes("Full") ? "Here's a full covenant compliance overview across all active loans:" : `Here's the detailed analysis for **${choice}**:`}
                                </p>
                                {choice.includes("Full") ? (
                                  <div className="rounded-[10px] border border-border overflow-hidden">
                                    <table className="w-full text-base">
                                      <thead><tr className="bg-muted/60 border-b border-border">
                                        {["Loan","Covenant","Actual","Threshold","Status"].map(h => <th key={h} className="px-3 py-2 text-left text-base font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}
                                      </tr></thead>
                                      <tbody>
                                        {[
                                          { loan: "Term Loan A", cov: "DSCR ≥ 1.25", actual: "1.12", threshold: "1.25", status: "Breached" },
                                          { loan: "Operating LOC", cov: "Min Cash $500K", actual: "$425K", threshold: "$500K", status: "At Risk" },
                                          { loan: "Term Loan A", cov: "Debt-to-EBITDA ≤ 3.5×", actual: "2.9×", threshold: "3.5×", status: "OK" },
                                          { loan: "Equipment Loan", cov: "Fixed Charge Coverage ≥ 1.1×", actual: "1.34×", threshold: "1.1×", status: "OK" },
                                        ].map((r, i) => (
                                          <tr key={i} className={`border-b border-border/40 ${i % 2 ? "bg-muted/20" : ""}`}>
                                            <td className="px-3 py-2 font-medium">{r.loan}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{r.cov}</td>
                                            <td className="px-3 py-2 font-semibold">{r.actual}</td>
                                            <td className="px-3 py-2">{r.threshold}</td>
                                            <td className="px-3 py-2">
                                              <span className={`inline-flex items-center gap-1 text-base font-semibold px-1.5 py-1 rounded-[4px] border ${r.status === "Breached" ? "bg-red-50 text-red-700 border-red-200" : r.status === "At Risk" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                                                {r.status === "Breached" ? <AlertTriangle className="h-2.5 w-2.5" /> : r.status === "At Risk" ? <AlertTriangle className="h-2.5 w-2.5" /> : <CheckCircle2 className="h-2.5 w-2.5" />}
                                                {r.status}
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : choice.includes("DSCR") ? (
                                  <div className="rounded-[10px] border border-red-200 bg-red-50/40 dark:bg-red-950/20 dark:border-red-900/30 overflow-hidden">
                                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/30">
                                      <AlertTriangle className="h-5 w-5 text-red-600" />
                                      <span className="text-base font-semibold text-red-700 dark:text-red-400">DSCR Covenant — Breached</span>
                                    </div>
                                    <div className="px-4 py-3 space-y-2 text-base">
                                      <div className="grid grid-cols-3 gap-3">
                                        {[{l:"Actual DSCR",v:"1.12",c:"text-red-600 font-bold"},{l:"Required",v:"≥ 1.25",c:"text-foreground"},{l:"Shortfall",v:"0.13",c:"text-red-600 font-semibold"}].map(r=>(
                                          <div key={r.l} className="rounded-[8px] bg-background border border-border px-2.5 py-2 text-center"><p className="text-base text-muted-foreground mb-0.5">{r.l}</p><p className={`text-base ${r.c}`}>{r.v}</p></div>
                                        ))}
                                      </div>
                                      <p className="text-muted-foreground pt-1"><span className="font-semibold text-foreground">Root cause:</span> Operating cash flow declined 8.4% YoY while debt service remained constant. EBITDA was impacted by one-time restructuring costs of $240K.</p>
                                      <p className="text-muted-foreground"><span className="font-semibold text-foreground">Recommended action:</span> Disclose breach in financial statement notes. Obtain waiver letter from RBC or reclassify the loan as current under ASPE 3856.</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="rounded-[10px] border border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 overflow-hidden">
                                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-200 bg-amber-50 dark:bg-amber-950/30">
                                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                                      <span className="text-base font-semibold text-amber-700 dark:text-amber-400">Min Cash Covenant — At Risk</span>
                                    </div>
                                    <div className="px-4 py-3 space-y-2 text-base">
                                      <div className="grid grid-cols-3 gap-3">
                                        {[{l:"Actual Cash",v:"$425K",c:"text-amber-600 font-bold"},{l:"Required",v:"≥ $500K",c:"text-foreground"},{l:"Shortfall",v:"$75K",c:"text-amber-600 font-semibold"}].map(r=>(
                                          <div key={r.l} className="rounded-[8px] bg-background border border-border px-2.5 py-2 text-center"><p className="text-base text-muted-foreground mb-0.5">{r.l}</p><p className={`text-base ${r.c}`}>{r.v}</p></div>
                                        ))}
                                      </div>
                                      <p className="text-muted-foreground pt-1"><span className="font-semibold text-foreground">Root cause:</span> Seasonal working capital draw in Q4 reduced unrestricted cash below the minimum balance threshold set by TD.</p>
                                      <p className="text-muted-foreground"><span className="font-semibold text-foreground">Recommended action:</span> Monitor cash position weekly. Consider drawing on the LOC headroom ($625K available) only if absolutely necessary. Disclose as at-risk in notes.</p>
                                    </div>
                                  </div>
                                )}
                                <div className="flex gap-2 pt-1">
                                  <button className="inline-flex items-center gap-2 h-7 px-3 rounded-[7px] border border-border bg-background text-base font-medium text-foreground hover:bg-muted transition-colors">
                                    <FileSpreadsheet className="h-4 w-4" /> Export to Excel
                                  </button>
                                  <button className="inline-flex items-center gap-2 h-7 px-3 rounded-[7px] border border-primary/20 bg-primary/8 text-base font-medium text-primary hover:bg-primary/15 transition-colors">
                                    <FileText className="h-4 w-4" /> Draft Notes Disclosure
                                  </button>
                                </div>
                              </div>
                            );

                            case "maturity": return (
                              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                <p className="text-base text-foreground">Here's the maturity timeline for all active loan facilities:</p>
                                <div className="rounded-[10px] border border-border overflow-hidden">
                                  <table className="w-full text-base">
                                    <thead><tr className="bg-muted/60 border-b border-border">
                                      {["Facility","Lender","Balance (CAD)","Maturity Date","Days Remaining","Status"].map(h=><th key={h} className={`px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide ${h==="Balance (CAD)"||h==="Days Remaining"?"text-right":"text-left"}`}>{h}</th>)}
                                    </tr></thead>
                                    <tbody>
                                      {[
                                        { name:"Term Loan A",    lender:"RBC",  bal:"$4,085,000", date:"Sep 01, 2027", days:840,  label:"1y 11mo", cls:"text-muted-foreground" },
                                        { name:"Operating LOC",  lender:"TD",   bal:"$875,000",   date:"Mar 15, 2026", days:304,  label:"10 mo",   cls:"text-amber-600 font-semibold" },
                                        { name:"Equipment Loan", lender:"HSBC", bal:"$2,064,128", date:"Dec 01, 2026", days:565,  label:"1y 7mo",  cls:"text-muted-foreground" },
                                      ].map((r,i)=>(
                                        <tr key={i} className={`border-b border-border/40 ${i%2?"bg-muted/20":""}`}>
                                          <td className="px-3 py-2 font-medium">{r.name}</td>
                                          <td className="px-3 py-2 text-muted-foreground">{r.lender}</td>
                                          <td className="px-3 py-2 text-right tabular-nums">{r.bal}</td>
                                          <td className="px-3 py-2 whitespace-nowrap">{r.date}</td>
                                          <td className={`px-3 py-2 text-right tabular-nums ${r.cls}`}>{r.label}</td>
                                          <td className="px-3 py-2">
                                            <span className={`inline-flex items-center gap-1 text-base font-semibold px-1.5 py-1 rounded-[4px] border ${r.days<=365?"bg-amber-50 text-amber-700 border-amber-200":"bg-green-50 text-green-700 border-green-200"}`}>
                                              <Calendar className="h-2.5 w-2.5" />{r.days<=365?"Renewing Soon":"On Track"}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="rounded-[10px] bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 px-3 py-2 flex items-start gap-2 text-base text-amber-800 dark:text-amber-300">
                                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                                  <span><strong>Operating LOC</strong> matures in ~10 months (Mar 15, 2026). Recommend initiating renewal discussions with TD by Q3 2025.</span>
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button className="inline-flex items-center gap-2 h-7 px-3 rounded-[7px] border border-border bg-background text-base font-medium text-foreground hover:bg-muted transition-colors">
                                    <CalendarDays className="h-4 w-4" /> Add renewal reminders
                                  </button>
                                  <button className="inline-flex items-center gap-2 h-7 px-3 rounded-[7px] border border-primary/20 bg-primary/8 text-base font-medium text-primary hover:bg-primary/15 transition-colors">
                                    <FileSpreadsheet className="h-4 w-4" /> Export maturity ladder
                                  </button>
                                </div>
                              </div>
                            );

                            case "interest": return (
                              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                <p className="text-base text-foreground">
                                  {choice.includes("Year-end") ? "Accrued interest calculation as at December 31, 2025:" : choice.includes("Q1") ? "Q1 2026 interest accrual breakdown (Jan 1 – Mar 31):" : "Year-to-date accrued interest through May 15, 2026:"}
                                </p>
                                <div className="rounded-[10px] border border-border overflow-hidden">
                                  <table className="w-full text-base">
                                    <thead><tr className="bg-muted/60 border-b border-border">
                                      {["Loan","Rate","Balance","Days","Accrued Interest","YTD Expense"].map(h=><th key={h} className={`px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide ${h==="Loan"?"text-left":"text-right"}`}>{h}</th>)}
                                    </tr></thead>
                                    <tbody>
                                      {[
                                        { name:"Term Loan A",    rate:"5.25%", bal:"$3,750,000", days: choice.includes("Year-end")?"365":choice.includes("Q1")?"90":"135", accrued:"$197,125",  ytd:"$197,125"  },
                                        { name:"Operating LOC",  rate:"7.45%", bal:"$875,000",   days: choice.includes("Year-end")?"365":choice.includes("Q1")?"90":"135", accrued:"$65,169",   ytd:"$65,169"   },
                                        { name:"Equipment Loan", rate:"6.10%", bal:"$1,522,500", days: choice.includes("Year-end")?"365":choice.includes("Q1")?"90":"135", accrued:"$92,873",   ytd:"$92,873"   },
                                      ].map((r,i)=>(
                                        <tr key={i} className={`border-b border-border/40 ${i%2?"bg-muted/20":""}`}>
                                          <td className="px-3 py-2 font-medium">{r.name}</td>
                                          <td className="px-3 py-2 text-right text-primary">{r.rate}</td>
                                          <td className="px-3 py-2 text-right tabular-nums">{r.bal}</td>
                                          <td className="px-3 py-2 text-right">{r.days}</td>
                                          <td className="px-3 py-2 text-right tabular-nums font-semibold">{r.accrued}</td>
                                          <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{r.ytd}</td>
                                        </tr>
                                      ))}
                                      <tr className="bg-muted/40 font-semibold border-t border-border">
                                        <td colSpan={4} className="px-3 py-2 text-base">Total</td>
                                        <td className="px-3 py-2 text-right tabular-nums">$355,167</td>
                                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">$355,167</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button className="inline-flex items-center gap-2 h-7 px-3 rounded-[7px] border border-border bg-background text-base font-medium text-foreground hover:bg-muted transition-colors">
                                    <TrendingUp className="h-4 w-4" /> Generate AJE
                                  </button>
                                  <button className="inline-flex items-center gap-2 h-7 px-3 rounded-[7px] border border-primary/20 bg-primary/8 text-base font-medium text-primary hover:bg-primary/15 transition-colors">
                                    <FileSpreadsheet className="h-4 w-4" /> Export schedule
                                  </button>
                                </div>
                              </div>
                            );

                            case "aje": return (
                              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                <p className="text-base text-foreground">
                                  Journal entry drafted for: <span className="font-semibold text-primary">{choice}</span>
                                </p>
                                <div className="rounded-[10px] border border-border overflow-hidden">
                                  <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/40">
                                    <Receipt className="h-5 w-5 text-primary" />
                                    <span className="text-base font-semibold text-foreground">{choice.includes("Accrued") ? "AJE-06 — Accrued Interest FY2025" : choice.includes("Current") ? "AJE-07 — Current Portion Reclassification" : "AJE-08 — FX Translation Adjustment"}</span>
                                    <span className="ml-auto text-base text-muted-foreground">Dec 31, 2025</span>
                                  </div>
                                  <table className="w-full text-base">
                                    <thead><tr className="border-b border-border/40 bg-muted/20">
                                      <th className="px-3 py-1.5 text-left text-base font-semibold text-muted-foreground uppercase">Account</th>
                                      <th className="px-3 py-1.5 text-right text-base font-semibold text-muted-foreground uppercase">Debit</th>
                                      <th className="px-3 py-1.5 text-right text-base font-semibold text-muted-foreground uppercase">Credit</th>
                                    </tr></thead>
                                    <tbody>
                                      {(choice.includes("Accrued") ? [
                                        { acct:"6100 — Interest Expense",              dr:"$355,167", cr:""          },
                                        { acct:"2210 — Accrued Interest Payable",      dr:"",         cr:"$355,167"  },
                                      ] : choice.includes("Current") ? [
                                        { acct:"2120 — Long-term Debt",                dr:"$892,000", cr:""          },
                                        { acct:"2110 — Current Portion of LTD",        dr:"",         cr:"$892,000"  },
                                      ] : [
                                        { acct:"2120 — Long-term Debt (USD)",          dr:"",         cr:"$45,230"   },
                                        { acct:"7200 — Foreign Exchange Gain/Loss",    dr:"$45,230",  cr:""          },
                                      ]).map((r,i)=>(
                                        <tr key={i} className={`border-b border-border/40 ${i%2?"bg-muted/10":""}`}>
                                          <td className="px-3 py-2 text-foreground">{r.acct}</td>
                                          <td className="px-3 py-2 text-right tabular-nums text-primary font-medium">{r.dr}</td>
                                          <td className="px-3 py-2 text-right tabular-nums text-foreground">{r.cr}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button className="inline-flex items-center gap-2 h-7 px-3 rounded-[7px] border border-border bg-background text-base font-medium text-foreground hover:bg-muted transition-colors">
                                    <TrendingUp className="h-4 w-4" /> Add to AJEs tab
                                  </button>
                                  <button className="inline-flex items-center gap-2 h-7 px-3 rounded-[7px] border border-primary/20 bg-primary/8 text-base font-medium text-primary hover:bg-primary/15 transition-colors">
                                    <Check className="h-4 w-4" /> Submit for review
                                  </button>
                                </div>
                              </div>
                            );

                            case "variance": return (
                              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                <p className="text-base text-foreground">Here's the reconciliation variance analysis across all loan facilities:</p>
                                <div className="rounded-[10px] border border-border overflow-hidden">
                                  <table className="w-full text-base">
                                    <thead><tr className="bg-muted/60 border-b border-border">
                                      {["Loan","TB Balance","Workpaper","Variance","Root Cause"].map(h=><th key={h} className={`px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide ${h==="Loan"||h==="Root Cause"?"text-left":"text-right"}`}>{h}</th>)}
                                    </tr></thead>
                                    <tbody>
                                      {[
                                        { name:"Term Loan A",    tb:"$3,750,000", wp:"$3,750,000", var:"$0",     cause:"Reconciled",                cls:"text-green-600" },
                                        { name:"Operating LOC",  tb:"$875,500",   wp:"$875,000",   var:"($500)", cause:"Rounding — bank statement",  cls:"text-amber-600" },
                                        { name:"Equipment Loan", tb:"$2,064,128", wp:"$2,064,128", var:"$0",     cause:"Reconciled",                cls:"text-green-600" },
                                        { name:"Accrued Int.",   tb:"$62,480",    wp:"$65,000",    var:"($2,520)",cause:"Missing Dec accrual entry", cls:"text-red-600"   },
                                      ].map((r,i)=>(
                                        <tr key={i} className={`border-b border-border/40 ${i%2?"bg-muted/20":""}`}>
                                          <td className="px-3 py-2 font-medium">{r.name}</td>
                                          <td className="px-3 py-2 text-right tabular-nums">{r.tb}</td>
                                          <td className="px-3 py-2 text-right tabular-nums">{r.wp}</td>
                                          <td className={`px-3 py-2 text-right tabular-nums font-semibold ${r.cls}`}>{r.var}</td>
                                          <td className="px-3 py-2 text-muted-foreground">{r.cause}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="rounded-[10px] bg-primary/5 border border-primary/15 px-3 py-2 text-base text-foreground">
                                  <strong>2 items require attention:</strong> LOC rounding ($500) can be overridden with reason. Accrued interest variance ($2,520) requires AJE — generate it from the AJEs tab.
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button className="inline-flex items-center gap-2 h-7 px-3 rounded-[7px] border border-border bg-background text-base font-medium text-foreground hover:bg-muted transition-colors">
                                    <TrendingUp className="h-4 w-4" /> Generate AJE for accrual
                                  </button>
                                  <button className="inline-flex items-center gap-2 h-7 px-3 rounded-[7px] border border-primary/20 bg-primary/8 text-base font-medium text-primary hover:bg-primary/15 transition-colors">
                                    <Check className="h-4 w-4" /> Override LOC rounding
                                  </button>
                                </div>
                              </div>
                            );

                            case "export": return (
                              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                <p className="text-base text-foreground">
                                  {choice.includes("Excel") ? "I've generated the Excel workpaper package for the Long-term Debt schedule:" : choice.includes("PDF") ? "The notes disclosure draft has been generated:" : "Management summary report is ready:"}
                                </p>
                                <div className="rounded-[10px] border border-border bg-background p-4 flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-[8px] bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                    {choice.includes("Excel") ? <FileSpreadsheet className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-base font-semibold text-foreground truncate">{choice.includes("Excel") ? "LTD_Workpaper_FY2025.xlsx" : choice.includes("PDF") ? "LTD_Notes_Disclosure_Draft.pdf" : "LTD_Management_Summary.pdf"}</p>
                                    <p className="text-base text-muted-foreground">{choice.includes("Excel") ? "6 sheets · 248 KB" : "3 pages · 142 KB"} · Generated just now</p>
                                  </div>
                                  <button className="inline-flex items-center gap-2 h-8 px-3 rounded-[8px] bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 transition-colors shrink-0">
                                    <Download className="h-5 w-5" /> Download
                                  </button>
                                </div>
                                {choice.includes("Excel") && (
                                  <div className="text-base text-muted-foreground px-1">
                                    Includes: Loan Register · Continuity Schedule · Amortization Tables · Covenant Tracking · Accrued Interest · AJE Package
                                  </div>
                                )}
                              </div>
                            );

                            case "loan": return (
                              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                {[
                                  {
                                    match:"RBC",
                                    name:"Term Loan A", lender:"Royal Bank of Canada", ref:"RBC-2022-4451", type:"Term", currency:"CAD",
                                    balance:"$3,750,000", rate:"5.25% Fixed", basis:"ACT/365", maturity:"Sep 01, 2027",
                                    current:"$450,000", lt:"$3,300,000", accrued:"$197,125", payment:"Monthly blended",
                                    covenants:["DSCR ≥ 1.25 (BREACHED — 1.12)","Debt-to-EBITDA ≤ 3.5× (OK — 2.9×)"],
                                  },
                                  {
                                    match:"TD",
                                    name:"Operating LOC", lender:"Toronto-Dominion Bank", ref:"TD-LOC-8832", type:"LOC", currency:"CAD",
                                    balance:"$875,000", rate:"7.45% Variable", basis:"ACT/365", maturity:"Mar 15, 2026",
                                    current:"$875,000", lt:"$0", accrued:"$65,169", payment:"Interest only",
                                    covenants:["Min Cash $500K (AT RISK — $425K)"],
                                  },
                                  {
                                    match:"HSBC",
                                    name:"Equipment Loan", lender:"HSBC Bank Canada", ref:"HSBC-EQ-2291", type:"Term", currency:"USD",
                                    balance:"USD $1,125,000 (CAD $2,064,128)", rate:"6.10% Fixed", basis:"30/360", maturity:"Dec 01, 2026",
                                    current:"$442,000", lt:"$1,622,128", accrued:"$92,873", payment:"Monthly blended",
                                    covenants:["Fixed Charge Coverage ≥ 1.1× (OK — 1.34×)"],
                                  },
                                ].filter(l => choice.includes(l.match)).map(l => (
                                  <div key={l.ref} className="rounded-[10px] border border-border overflow-hidden">
                                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/40">
                                      <Building2 className="h-5 w-5 text-primary" />
                                      <span className="text-base font-semibold text-foreground">{l.name}</span>
                                      <span className="text-base text-muted-foreground">·</span>
                                      <span className="text-base text-muted-foreground">{l.ref}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-0 divide-x divide-border">
                                      {[
                                        ["Lender", l.lender], ["Loan Type", l.type], ["Currency", l.currency], ["Balance", l.balance],
                                        ["Rate", l.rate], ["Day Count", l.basis], ["Maturity", l.maturity], ["Payment", l.payment],
                                        ["Current Portion", l.current], ["Long-term Portion", l.lt], ["Accrued Interest", l.accrued],
                                      ].map(([label, value]) => (
                                        <div key={label} className="px-3 py-1.5 border-b border-border/40">
                                          <p className="text-base text-muted-foreground">{label}</p>
                                          <p className="text-base font-medium text-foreground">{value}</p>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="px-3 py-2 border-t border-border/40">
                                      <p className="text-base text-muted-foreground mb-1 uppercase tracking-wide font-semibold">Covenants</p>
                                      {l.covenants.map((c,i) => (
                                        <div key={i} className={`text-base ${c.includes("BREACHED")?"text-red-600":c.includes("AT RISK")?"text-amber-600":"text-foreground"}`}>{c}</div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                                <div className="flex gap-2 pt-1">
                                  <button className="inline-flex items-center gap-2 h-7 px-3 rounded-[7px] border border-border bg-background text-base font-medium text-foreground hover:bg-muted transition-colors">
                                    <Table2 className="h-4 w-4" /> View amortization schedule
                                  </button>
                                  <button className="inline-flex items-center gap-2 h-7 px-3 rounded-[7px] border border-primary/20 bg-primary/8 text-base font-medium text-primary hover:bg-primary/15 transition-colors">
                                    <TrendingUp className="h-4 w-4" /> Generate AJEs
                                  </button>
                                </div>
                              </div>
                            );

                            case "continuity": return (
                              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                <p className="text-base text-foreground">Long-term Debt continuity roll-forward for FY2025 (Jan 1 → Dec 31, 2025):</p>
                                <div className="rounded-[10px] border border-border overflow-hidden">
                                  <table className="w-full text-base">
                                    <thead><tr className="bg-muted/60 border-b border-border">
                                      {["Loan","Opening","New Draws","Repayments","FX Adj.","Closing"].map(h=><th key={h} className={`px-3 py-2 text-base font-semibold text-muted-foreground uppercase tracking-wide ${h==="Loan"?"text-left":"text-right"}`}>{h}</th>)}
                                    </tr></thead>
                                    <tbody>
                                      {[
                                        { name:"Term Loan A",    open:"$4,085,000", draws:"—",        repay:"($335,000)", fx:"—",       close:"$3,750,000" },
                                        { name:"Operating LOC",  open:"$0",         draws:"$875,000",  repay:"—",          fx:"—",       close:"$875,000"   },
                                        { name:"Equipment Loan", open:"$2,284,775", draws:"—",        repay:"($252,775)", fx:"$32,000",  close:"$2,064,000" },
                                      ].map((r,i)=>(
                                        <tr key={i} className={`border-b border-border/40 ${i%2?"bg-muted/20":""}`}>
                                          <td className="px-3 py-2 font-medium">{r.name}</td>
                                          <td className="px-3 py-2 text-right tabular-nums">{r.open}</td>
                                          <td className="px-3 py-2 text-right tabular-nums text-green-600">{r.draws}</td>
                                          <td className="px-3 py-2 text-right tabular-nums text-red-500">{r.repay}</td>
                                          <td className="px-3 py-2 text-right tabular-nums text-blue-500">{r.fx}</td>
                                          <td className="px-3 py-2 text-right tabular-nums font-semibold">{r.close}</td>
                                        </tr>
                                      ))}
                                      <tr className="bg-muted/40 font-semibold border-t border-border text-base">
                                        <td className="px-3 py-2">Total</td>
                                        <td className="px-3 py-2 text-right tabular-nums">$6,369,775</td>
                                        <td className="px-3 py-2 text-right tabular-nums text-green-600">$875,000</td>
                                        <td className="px-3 py-2 text-right tabular-nums text-red-500">($587,775)</td>
                                        <td className="px-3 py-2 text-right tabular-nums text-blue-500">$32,000</td>
                                        <td className="px-3 py-2 text-right tabular-nums">$6,689,000</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button className="inline-flex items-center gap-2 h-7 px-3 rounded-[7px] border border-border bg-background text-base font-medium text-foreground hover:bg-muted transition-colors">
                                    <FileSpreadsheet className="h-4 w-4" /> Export continuity
                                  </button>
                                  <button className="inline-flex items-center gap-2 h-7 px-3 rounded-[7px] border border-primary/20 bg-primary/8 text-base font-medium text-primary hover:bg-primary/15 transition-colors">
                                    <RefreshCw className="h-4 w-4" /> Reconcile to TB
                                  </button>
                                </div>
                              </div>
                            );

                            default: return (
                              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                <p className="text-base text-foreground leading-relaxed">
                                  Based on the Long-term Debt summary, here's my analysis for: <em>"{turn.userMsg}"</em>
                                </p>
                                <div className="rounded-[10px] bg-primary/5 border border-primary/15 px-3 py-2.5 text-base text-foreground leading-relaxed">
                                  The current portfolio of 3 active loan facilities totalling <strong>$6.69M CAD</strong> shows 2 covenant issues requiring immediate attention. Net interest expense for FY2025 is estimated at <strong>$355,167</strong>. The Operating LOC matures in 10 months — renewal planning should begin in Q3.
                                </div>
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {["Show covenant details","Run maturity analysis","Export to Excel"].map(a=>(
                                    <button key={a} onClick={() => handleClarifyChoice(turn.id, a)} className="inline-flex items-center gap-2 h-7 px-3 rounded-[7px] border border-border bg-background text-base font-medium text-foreground hover:bg-muted transition-colors">{a}</button>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                        };

                        return (
                          <React.Fragment key={turn.id}>
                            {/* User bubble */}
                            <div className="flex justify-end">
                              <div className="max-w-[80%] px-4 py-3 rounded-[12px] bg-primary text-primary-foreground text-base leading-relaxed">{turn.userMsg}</div>
                            </div>

                            {/* Luka response bubble */}
                            <div className="flex items-start gap-3 min-w-0 max-w-full">
                              <div className={cn("w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0", (isThinkingTurn || isWorking) && "luka-thinking-spin")}>
                                <LukaIcon size={16} />
                              </div>
                              <div className="flex-1 pt-1.5 min-w-0">
                                {isThinkingTurn && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-base font-medium text-foreground luka-thinking-text">Analysing your question</span>
                                    <span className="flex gap-0.5">
                                      <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-1" />
                                      <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-2" />
                                      <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-3" />
                                    </span>
                                  </div>
                                )}

                                {isClarifying && (
                                  <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                    <p className="text-base text-foreground">{cfg.question}</p>
                                    <div className="flex flex-wrap gap-2">
                                      {cfg.chips.map(chip => (
                                        <button
                                          key={chip}
                                          onClick={() => handleClarifyChoice(turn.id, chip)}
                                          className="inline-flex items-center gap-2 h-8 px-3 rounded-[8px] border border-primary/25 bg-primary/6 text-base font-medium text-primary hover:bg-primary/15 transition-colors"
                                        >
                                          {chip}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {(isWorking || isDone) && (
                                  <div className="space-y-3">
                                    {/* Show the clarify question + selected answer as a recap */}
                                    {cfg.question && turn.clarifyChoice && (
                                      <div className="space-y-1.5">
                                        <p className="text-base text-foreground">{cfg.question}</p>
                                        <div className="flex flex-wrap gap-2">
                                          {cfg.chips.map(chip => (
                                            <span
                                              key={chip}
                                              className={cn(
                                                "inline-flex items-center gap-2 h-8 px-3 rounded-[8px] border text-base font-medium transition-colors",
                                                chip === turn.clarifyChoice
                                                  ? "border-primary/40 bg-primary/10 text-primary"
                                                  : "border-border/40 bg-muted/30 text-muted-foreground"
                                              )}
                                            >
                                              {chip === turn.clarifyChoice && <Check className="h-4 w-4" />}
                                              {chip}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {isWorking && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-base font-medium text-foreground luka-thinking-text">Working on it</span>
                                        <span className="flex gap-0.5">
                                          <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-1" />
                                          <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-2" />
                                          <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-3" />
                                        </span>
                                      </div>
                                    )}
                                    {isDone && renderResult()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                      {/* Scroll anchor — keeps bottom visible after new turns */}
                      <div ref={chatBottomRef} className="h-2" />
                    </div>
                  )}
                </div>

                    </div>
                    )}
                  </div>
                  {/* Input area */}
                  <div className="px-4 pb-4 pt-2 relative">
                    {/* Engagement Tray — floats above input with 4px gap */}
                    <AnimatePresence>
                      {showEngagementTrayCtx && (
                        <motion.div
                          ref={engagementTrayCtxRef}
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ type: "spring", damping: 28, stiffness: 320, mass: 0.7 }}
                          className="absolute bottom-full left-4 right-4 z-40"
                          style={{ marginBottom: 4, maxHeight: "min(420px, 60vh)" }}
                        >
                          <div className="overflow-hidden flex flex-col bg-card" style={{ borderRadius: 12, border: "1px solid hsl(0 0% 35%)", boxShadow: "0 2px 12px 0 hsla(0,0%,0%,0.10), 0 1px 4px 0 hsla(0,0%,0%,0.06)" }}>
                            <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
                              <h3 className="text-base font-semibold text-foreground">Select Engagement</h3>
                              <div className="flex items-center gap-2">
                                <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" /><input value={engagementSearchCtx} onChange={e => setEngagementSearchCtx(e.target.value)} placeholder="Search" className="h-9 w-56 pl-8 pr-3 text-base rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" style={{ borderColor: "hsl(var(--border))" }} /></div>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setShowEngagementTrayCtx(false); setEngagementSearchCtx(""); }} className="h-9 w-9 inline-flex items-center justify-center rounded-lg border" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}><X size={14} /></motion.button>
                              </div>
                            </div>
                            <div className="overflow-auto" style={{ maxHeight: "calc(min(420px, 60vh) - 70px)" }}>
                              <table className="w-full text-base" style={{ minWidth: 720 }}>
                                <thead><tr className="text-left" style={{ borderBottom: "1px solid hsl(var(--border) / 0.6)" }}>
                                  {["Client Name", "Engagement ID", "Year End", "Status", "Source"].map(h => <th key={h} className="px-5 py-2.5 font-medium text-muted-foreground">{h}</th>)}
                                </tr></thead>
                                <tbody>
                                  {ENGAGEMENTS_PANEL.filter(e => { const q = engagementSearchCtx.toLowerCase(); return !q || e.client.toLowerCase().includes(q) || e.id.toLowerCase().includes(q); }).map((e, i) => (
                                    <motion.tr key={`${e.client}-${i}`} whileHover={{ backgroundColor: "hsl(270, 80%, 65% / 0.06)" }} onClick={() => {
                                      setSelectedEngagementCtx(e);
                                      setShowEngagementTrayCtx(false);
                                      setEngagementSearchCtx("");
                                      if (invSchedPhase === "engagement-check") {
                                        setInvSelectedEngId(e.id);
                                        setInvEngagementConnected(true);
                                        const src = (e as { source?: string | null }).source ?? null;
                                        setInvSourceConnected(src);
                                        if (src) {
                                          setInvSchedPhase("source-check");
                                        } else {
                                          setInvTBChecking(true);
                                          setInvTBFound(null);
                                          setInvTBAnalysis(null);
                                          setInvTBAnalysisStep(0);
                                          setInvSchedPhase("tb-check");
                                          const engId = e.id;
                                          setTimeout(() => {
                                            const hasTB = MOCK_ENG_WITH_TB.has(engId);
                                            setInvTBChecking(false);
                                            setInvTBFound(hasTB);
                                            if (!hasTB) return;
                                            setInvTBAnalyzing(true);
                                            const analysis = MOCK_TB_ANALYSIS[engId] ?? MOCK_TB_ANALYSIS["COM-DEF-May312024"];
                                            setTimeout(() => {
                                              setInvTBAnalysis(analysis);
                                              setInvTBAnalyzing(false);
                                              [1, 2, 3, 4].forEach((step, i) =>
                                                setTimeout(() => setInvTBAnalysisStep(step), i * 600)
                                              );
                                              setTimeout(() => setInvSchedPhase("upload-prompt"), 4 * 600 + 1000);
                                            }, 2000);
                                          }, 1800);
                                        }
                                      }
                                    }} className="cursor-pointer" style={{ borderBottom: "1px solid hsl(var(--border) / 0.4)" }}>
                                      <td className="px-5 py-3 font-semibold">{e.client}</td>
                                      <td className="px-5 py-3">{e.id}</td>
                                      <td className="px-5 py-3">{e.yearEnd}</td>
                                      <td className="px-5 py-3"><span className="inline-flex items-center px-2 py-1 rounded-md text-base font-medium" style={{ background: "hsl(142, 70%, 45% / 0.12)", color: "hsl(142, 70%, 35%)", border: "1px solid hsl(142, 70%, 45% / 0.3)" }}>{e.status}</span></td>
                                      <td className="px-5 py-3">
                                        {e.source
                                          ? <span className="inline-flex items-center gap-1 px-1.5 py-1 rounded-[5px] text-base font-semibold border bg-orange-50 text-orange-700 border-orange-200 capitalize">{e.source === "quickbooks" ? "QBO" : e.source === "xero" ? "Xero" : e.source}</span>
                                          : <span className="text-base text-muted-foreground">—</span>}
                                      </td>
                                    </motion.tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Prompt Window */}
                    <AnimatePresence>
                      {showPromptWindow && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ type: "spring", damping: 22, stiffness: 400 }}
                          className="absolute bottom-full left-4 right-4 mb-2 z-50"
                        >
                          <div className="prompt-window-shimmer-border rounded-2xl">
                            <div className="rounded-2xl overflow-hidden" style={{ background: "hsl(var(--card))", boxShadow: "0 8px 32px -8px hsla(260, 60%, 40%, 0.18)" }}>
                              <div className="py-1">
                                {shellPromptList.map((prompt, i) => (
                                  <motion.button
                                    key={prompt}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03, duration: 0.2 }}
                                    onClick={() => handleShellPromptSelect(prompt)}
                                    onMouseEnter={() => setSelectedPromptIndex(i)}
                                    className="w-full text-left px-5 py-3 text-[15px] font-medium transition-colors duration-150 cursor-pointer flex items-center"
                                    style={{
                                      color: selectedPromptIndex === i ? "hsl(var(--foreground))" : "hsl(var(--foreground) / 0.8)",
                                      background: selectedPromptIndex === i ? "hsl(var(--muted) / 0.6)" : "transparent",
                                      borderBottom: i < shellPromptList.length - 1 ? "1px solid hsl(var(--border) / 0.4)" : "none",
                                    }}
                                  >
                                    {prompt}
                                  </motion.button>
                                ))}
                              </div>
                              <div className="flex items-center justify-between px-5 py-2.5 text-base" style={{ color: "hsl(var(--muted-foreground))", borderTop: "1px solid hsl(var(--border) / 0.4)" }}>
                                <div className="flex items-center gap-2">
                                  <span>Use</span>
                                  <kbd className="inline-flex items-center justify-center w-6 h-6 rounded-md border text-base font-semibold" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.5)" }}>↑</kbd>
                                  <kbd className="inline-flex items-center justify-center w-6 h-6 rounded-md border text-base font-semibold" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.5)" }}>↓</kbd>
                                  <span>to navigate</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span>To close, press</span>
                                  <kbd className="inline-flex items-center justify-center px-2 h-6 rounded-md border text-base font-semibold" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.5)" }}>Esc</kbd>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="luka-input-wrapper">
                      <textarea
                        ref={shellInputRef}
                        value={shellInputValue}
                        onChange={handleShellInputChange}
                        onKeyDown={handleShellKeyDown}
                        placeholder="Type / for prompts or just ask anything..."
                        rows={1}
                        className="luka-input luka-input-autoresize"
                      />
                      <div className="flex items-center justify-between pt-1 px-1">
                        <div className="flex items-center gap-2">
                          {/* Plus tray */}
                          <div ref={plusTrayRef} style={{ position: "relative" }}>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowPlusTray(p => !p)}
                                    style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: showPlusTray ? "hsl(var(--muted))" : "hsl(var(--background))", border: `1px solid ${showPlusTray ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border) / 0.6)"}`, color: "hsl(0 0% 0%)", cursor: "pointer" }}
                                  >
                                    <motion.div animate={{ rotate: showPlusTray ? 45 : 0 }} transition={{ duration: 0.2 }}>
                                      <Plus size={15} strokeWidth={2.2} />
                                    </motion.div>
                                  </motion.button>
                                </TooltipTrigger>
                                <TooltipContent side="top" sideOffset={6}>Add files & connectors</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <AnimatePresence>
                              {showPlusTray && (
                                <motion.div
                                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                                  transition={{ type: "spring", damping: 24, stiffness: 400 }}
                                  style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, width: 280, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, zIndex: 100, overflow: "hidden" }}
                                >
                                  <div style={{ padding: "6px 0" }}>
                                    <motion.button
                                      whileHover={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
                                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", fontSize: 13, fontWeight: 500, color: "hsl(var(--foreground))", background: "transparent", border: "none", cursor: "pointer" }}
                                    >
                                      <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "hsl(207 71% 38% / 0.08)", color: "hsl(207 71% 31%)" }}>
                                        <Upload size={16} strokeWidth={2} />
                                      </div>
                                      <div style={{ textAlign: "left" }}>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>Upload from Computer</div>
                                        <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 1 }}>PDF, Excel, CSV, Images</div>
                                      </div>
                                    </motion.button>
                                  </div>
                                  <div style={{ height: 1, background: "hsl(var(--border) / 0.6)", margin: "0 12px" }} />
                                  <div style={{ padding: "10px 14px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em" }}>Available Connectors</span>
                                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 10, background: "hsl(207 71% 38% / 0.1)", color: "hsl(207 71% 31%)" }}>{availableConnectors.length}</span>
                                  </div>
                                  <div style={{ padding: "2px 0 8px", maxHeight: 200, overflowY: "auto", scrollbarWidth: "none" as const }}>
                                    {availableConnectors.map(connector => (
                                      <motion.button
                                        key={connector.id}
                                        whileHover={{ backgroundColor: "hsl(var(--muted) / 0.4)" }}
                                        onClick={() => handleConnectConnector(connector.id)}
                                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", fontSize: 13, color: "hsl(var(--foreground))", background: "transparent", border: "none", cursor: "pointer" }}
                                      >
                                        <div style={{ width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: `${connector.color}14` }}>
                                          <Globe size={14} style={{ color: connector.color }} />
                                        </div>
                                        <span style={{ flex: 1, textAlign: "left" }}>{connector.name}</span>
                                        <span style={{ fontSize: 10, fontWeight: 500, padding: "3px 8px", borderRadius: 6, background: "hsl(var(--muted) / 0.6)", color: "hsl(var(--muted-foreground))" }}>Connect</span>
                                      </motion.button>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Engagement / Inbox button */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.button
                                  whileHover={{ scale: 1.1, boxShadow: "0 2px 8px hsla(0,0%,0%,0.10)" }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => setShowEngagementTrayCtx(v => !v)}
                                  style={{
                                    width: 30, height: 30, borderRadius: 8,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: showEngagementTrayCtx ? "hsl(var(--muted))" : "hsl(var(--background))",
                                    border: `1px solid ${showEngagementTrayCtx ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border) / 0.6)"}`,
                                    boxShadow: "0 1px 3px hsla(0,0%,0%,0.06)",
                                    color: "hsl(0 0% 0%)", cursor: "pointer",
                                  }}
                                >
                                  <Inbox size={15} strokeWidth={2.2} />
                                </motion.button>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={6}>Select Engagement</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* Model selector */}
                          <div ref={modelDropdownRef} style={{ position: "relative" }}>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="luka-model-badge"
                                    onClick={() => setShowModelDropdown(p => !p)}
                                    style={{ cursor: "pointer" }}
                                  >
                                    <Sparkles size={12} style={{ color: "hsl(40 90% 50%)" }} />
                                    <span>{selectedModel}</span>
                                    <ChevronDown size={14} strokeWidth={2.2} className="ml-0.5 opacity-60" style={{ transform: showModelDropdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
                                  </motion.button>
                                </TooltipTrigger>
                                <TooltipContent side="top" sideOffset={6}>Change AI model</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <AnimatePresence>
                              {showModelDropdown && (
                                <motion.div
                                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                                  transition={{ type: "spring", damping: 24, stiffness: 400 }}
                                  style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, minWidth: 260, background: "hsl(var(--card))", border: "1px solid #0C2D55", borderRadius: 12, zIndex: 100, overflow: "hidden" }}
                                >
                                  <div style={{ padding: "10px 12px 6px", fontSize: 11, fontWeight: 600, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em" }}>Select Model</div>
                                  <div style={{ padding: "0 0 6px", maxHeight: 380, overflowY: "auto", scrollbarWidth: "none" as const }}>
                                    {modelGroups.map((group, gi) => (
                                      <div key={group.ecosystem}>
                                        {gi > 0 && <div style={{ height: 1, background: "hsl(var(--border) / 0.5)", margin: "4px 12px" }} />}
                                        <div style={{ padding: "6px 12px", margin: "2px 6px", borderRadius: 6, fontSize: 10, fontWeight: 600, color: "hsl(var(--muted-foreground) / 0.7)", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 5 }}>
                                          {group.icon}
                                          {group.ecosystem}
                                        </div>
                                        {group.models.map(model => {
                                          const isSel = selectedModel === model.name;
                                          return (
                                            <motion.button
                                              key={model.name}
                                              onClick={() => { setSelectedModel(model.name); setShowModelDropdown(false); }}
                                              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", fontSize: 13, fontWeight: isSel ? 600 : 400, color: isSel ? "#0C2D55" : "#1a1a1a", background: isSel ? "hsl(var(--muted) / 0.5)" : "transparent", border: "none", cursor: "pointer" }}
                                            >
                                              <span style={{ flex: 1, textAlign: "left" }}>{model.name}</span>
                                              <span style={{ fontSize: 10, fontWeight: 500, padding: "2px 6px", borderRadius: 6, background: "hsl(var(--muted) / 0.6)", color: "#555555", minWidth: 44, textAlign: "center" }}>{model.badge}</span>
                                              {isSel && <Check size={14} strokeWidth={2.5} style={{ color: "#0C2D55" }} />}
                                            </motion.button>
                                          );
                                        })}
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Connected connectors */}
                          <AnimatePresence>
                            {connectedConnectors.map(connector => (
                              <motion.div
                                key={connector.id}
                                initial={{ opacity: 0, scale: 0.8, width: 0 }}
                                animate={{ opacity: 1, scale: 1, width: "auto" }}
                                exit={{ opacity: 0, scale: 0.8, width: 0 }}
                                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px 4px 6px", borderRadius: 7, border: `1px solid ${connector.color}30`, background: `${connector.color}08`, cursor: "default", overflow: "hidden", whiteSpace: "nowrap" }}
                              >
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: connector.color, flexShrink: 0 }} />
                                <span style={{ fontSize: 11, fontWeight: 600, color: connector.color }}>{connector.abbr}</span>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>

                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.button
                                  whileHover={shellInputValue.trim() && !isEnhancing ? { scale: 1.1 } : {}}
                                  whileTap={shellInputValue.trim() && !isEnhancing ? { scale: 0.9 } : {}}
                                  onClick={handleEnhancePrompt}
                                  disabled={!shellInputValue.trim() || isEnhancing}
                                  style={{ position: "relative", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "hsl(var(--background))", border: "1px solid hsl(var(--border) / 0.6)", color: "hsl(270 65% 55%)", cursor: !shellInputValue.trim() || isEnhancing ? "not-allowed" : "pointer", opacity: !shellInputValue.trim() ? 0.4 : 1 }}
                                >
                                  <AnimatePresence mode="wait">
                                    {isEnhancing
                                      ? <motion.div key="loader" animate={{ rotate: 360 }} transition={{ rotate: { duration: 0.8, repeat: Infinity, ease: "linear" } }}><Loader2 size={15} strokeWidth={2.2} /></motion.div>
                                      : <motion.div key="wand"><Wand2 size={15} strokeWidth={2.2} /></motion.div>
                                    }
                                  </AnimatePresence>
                                </motion.button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-base">Enhance your prompt with Luka</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "hsl(var(--background))", border: "1px solid hsl(var(--border) / 0.6)", color: "hsl(0 0% 0%)", cursor: "pointer" }}
                                >
                                  <Mic size={15} strokeWidth={2.2} />
                                </motion.button>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={6}>Voice input</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.button
                                  whileHover={shellInputValue.trim() ? { scale: 1.1 } : {}}
                                  whileTap={shellInputValue.trim() ? { scale: 0.9 } : {}}
                                  className={`luka-send-btn ${shellInputValue.trim() ? "enabled" : ""}`}
                                  disabled={!shellInputValue.trim()}
                                >
                                  <Send size={15} strokeWidth={2.2} />
                                </motion.button>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={6}>Send message</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── WORKSPACE TAB ── */
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {!hasWorkspaceEngagement ? (
                    <>
                      <WorkspaceEmptyState onAddEngagement={() => setShowAddEngagementModal(true)} />
                      <AddEngagementModal open={showAddEngagementModal} onClose={() => setShowAddEngagementModal(false)} onSelect={eng => { setWorkspaceEngagement({ name: eng.name, code: eng.code, source: eng.source }); setShowAddEngagementModal(false); setHasWorkspaceEngagement(true); }} />
                    </>
                  ) : (
                    <EngagementWorkspaceShell engagement={workspaceEngagement ?? { name: "", code: "" }} onAddEngagement={() => setShowAddEngagementModal(true)} collapsed={workspaceSidebarCollapsed} onCollapse={() => setWorkspaceSidebarCollapsed(true)} />
                  )}
                </div>
              )}
              <LukaSettingsOverlay open={settingsOpen} onClose={() => setSettingsOpen(false)} activeTab={activeTab === "workspaces" ? "workspace" : "threads"} onOpenNewWindow={handleOpenNewWindow} onFullscreen={() => setIsFullscreen(p => !p)} onMinimize={() => setIsMinimized(p => !p)} isFullscreen={isFullscreen} isMinimized={isMinimized} />
            </div>
          </motion.div>

          {/* ── Agentic Loan Amort Wizard ── */}
          {amortPhase === "wizard" && (
          <>
            <div className="fixed inset-0 z-[59]" onClick={() => setAmortPhase("found")} />
            <div
              className="fixed z-[60] pointer-events-none"
              style={amortWizRect
                ? { left: amortWizRect.left, right: amortWizRect.right, bottom: amortWizRect.bottom }
                : { left: 24, right: 24, bottom: 124 }}
            >
              <div className="w-full pointer-events-auto bg-background border border-border rounded-[12px] shadow-[0_2px_16px_rgba(0,0,0,0.09)] animate-in slide-in-from-bottom-4 fade-in duration-200 flex flex-col max-h-[72vh]">

                {/* Header */}
                <div className="flex items-start justify-between px-4 py-3 border-b border-border shrink-0">
                  <div>
                    <p className="text-base text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                      A few quick questions · Step {amortWizStep} of {amortSource === "manual" ? 2 : 3}
                    </p>
                    <p className="text-base font-semibold text-foreground">
                      {amortWizStep === 1 && "How should I source the loan data?"}
                      {amortWizStep === 2 && amortSource === "existing" && "Select an existing document"}
                      {amortWizStep === 2 && amortSource === "upload"   && "Upload your loan document"}
                      {amortWizStep === 2 && amortSource === "drive"    && "Select a file from Google Drive"}
                      {amortWizStep === 2 && amortSource === "manual"   && "Enter loan details"}
                      {amortWizStep === 3 && "Review & approve"}
                    </p>
                  </div>
                  <button onClick={() => setAmortPhase("found")} className="p-1 rounded-[6px] hover:bg-muted transition-colors text-muted-foreground mt-0.5 shrink-0">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-4 py-4">

                  {/* ── Step 1: Source selection ── */}
                  {amortWizStep === 1 && (
                    <div className="space-y-2">
                      {([
                        { id: "existing" as AmortSource, label: "Use an existing document",   sub: "Found 2 matching workpapers in your engagement", Icon: BookOpen   },
                        { id: "upload"   as AmortSource, label: "Upload a new document",       sub: "PDF loan agreement, max 2 MB",                   Icon: Upload     },
                        { id: "drive"    as AmortSource, label: "Import from Google Drive",    sub: "Browse your connected drive",                    Icon: HardDrive  },
                        { id: "manual"   as AmortSource, label: "Enter loan details manually", sub: "Fill in the loan parameters directly",           Icon: FileText   },
                      ] as const).map(({ id, label, sub, Icon }) => (
                        <button key={id} onClick={() => setAmortSource(id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-[10px] border text-left transition-colors ${
                            amortSource === id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${amortSource === id ? "border-primary" : "border-muted-foreground/40"}`}>
                            {amortSource === id && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-medium text-foreground">{label}</p>
                            <p className="text-base text-muted-foreground">{sub}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ── Step 2a: Existing document selection ── */}
                  {amortWizStep === 2 && amortSource === "existing" && (
                    <div className="space-y-2">
                      <p className="text-base text-muted-foreground mb-3">Select a document from your engagement workpapers:</p>
                      {AMORT_ENG_DOCS.map(doc => (
                        <button key={doc.id} onClick={() => setAmortSelDocId(doc.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] border text-left transition-colors ${
                            amortSelDocId === doc.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                          }`}
                        >
                          {doc.ext === "pdf"
                            ? <FileText        className="h-4 w-4 text-red-500 shrink-0" />
                            : <FileSpreadsheet className="h-4 w-4 text-green-600 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-medium text-foreground truncate">{doc.name}</p>
                            <p className="text-base text-muted-foreground">{doc.path} · {doc.date} · {doc.size}</p>
                          </div>
                          {amortSelDocId === doc.id && <Check className="h-5 w-5 text-primary shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ── Step 2b: Upload ── */}
                  {amortWizStep === 2 && amortSource === "upload" && (
                    <div
                      className={cn(
                        "relative flex flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-dashed cursor-pointer transition-colors py-10",
                        amortUploadFile ? "border-primary/40 bg-primary/5" : "border-border/60 hover:border-primary/40 hover:bg-muted/30",
                      )}
                      onClick={() => {
                        const inp = document.createElement("input");
                        inp.type = "file"; inp.accept = ".pdf";
                        inp.onchange = e => {
                          const f = (e.target as HTMLInputElement).files?.[0];
                          if (f && f.size <= 2 * 1024 * 1024) setAmortUploadFile(f.name);
                        };
                        inp.click();
                      }}
                    >
                      {amortUploadFile ? (
                        <div className="flex items-center gap-2 text-base text-foreground">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="font-medium">{amortUploadFile}</span>
                          <button onClick={e => { e.stopPropagation(); setAmortUploadFile(null); }} className="ml-1 hover:text-destructive transition-colors">
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <p className="text-base text-muted-foreground text-center">
                            <span className="text-primary font-medium">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-base text-muted-foreground">PDF only · max 2 MB</p>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── Step 2c: Drive file picker ── */}
                  {amortWizStep === 2 && amortSource === "drive" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <HardDrive className="h-5 w-5 text-primary shrink-0" />
                        <span className="text-base font-medium text-foreground">Google Drive</span>
                      </div>
                      {AMORT_DRIVE_FILES.map(f => (
                        <button key={f.id} onClick={() => setAmortDriveId(f.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] border text-left transition-colors ${
                            amortDriveId === f.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                          }`}
                        >
                          {f.ext === "pdf"
                            ? <FileText        className="h-4 w-4 text-red-500 shrink-0" />
                            : <FileSpreadsheet className="h-4 w-4 text-green-600 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-medium text-foreground truncate">{f.name}</p>
                            <p className="text-base text-muted-foreground">{f.folder} · {f.size}</p>
                          </div>
                          {amortDriveId === f.id && <Check className="h-5 w-5 text-primary shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ── Step 2d: Manual entry (reuse prompt form) ── */}
                  {amortWizStep === 2 && amortSource === "manual" && (
                    <LoanAmortizationPrompt hideUpload onSubmit={(data) => {
                      handleLoanAmortSubmit(data);
                      setAmortPhase("found");
                    }} />
                  )}

                  {/* ── Step 3: Summary + approve ── */}
                  {amortWizStep === 3 && (
                    <div className="space-y-3">
                      <p className="text-base text-foreground leading-relaxed">Here's what I'll do — review and approve to continue.</p>
                      <div className="rounded-[10px] border border-border p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-base font-semibold text-muted-foreground uppercase tracking-wide">Question 1</p>
                          <button onClick={() => setAmortWizStep(1)} className="text-base text-primary hover:underline">Edit</button>
                        </div>
                        <p className="text-base text-foreground">How should I source the loan data?</p>
                        <span className="inline-flex items-center text-base bg-muted text-foreground rounded-full px-2.5 py-0.5 font-medium">
                          {amortSource === "existing" && "Use an existing document"}
                          {amortSource === "upload"   && "Upload a new document"}
                          {amortSource === "drive"    && "Import from Google Drive"}
                        </span>
                      </div>
                      <div className="rounded-[10px] border border-border p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-base font-semibold text-muted-foreground uppercase tracking-wide">Question 2</p>
                          <button onClick={() => setAmortWizStep(2)} className="text-base text-primary hover:underline">Edit</button>
                        </div>
                        <p className="text-base text-foreground">
                          {amortSource === "existing" && "Selected document"}
                          {amortSource === "upload"   && "Uploaded document"}
                          {amortSource === "drive"    && "Selected from Google Drive"}
                        </p>
                        <span className="inline-flex items-center gap-2 text-base bg-muted text-foreground rounded-full px-2.5 py-0.5 font-medium max-w-full">
                          {amortSource === "existing" && <><FileText className="h-4 w-4 shrink-0" /><span className="truncate">{AMORT_ENG_DOCS.find(d => d.id === amortSelDocId)?.name}</span></>}
                          {amortSource === "upload"   && <><FileText className="h-4 w-4 shrink-0" /><span className="truncate">{amortUploadFile ?? "No file"}</span></>}
                          {amortSource === "drive"    && <><HardDrive className="h-4 w-4 shrink-0" /><span className="truncate">{AMORT_DRIVE_FILES.find(f => f.id === amortDriveId)?.name}</span></>}
                        </span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Footer — hidden for manual step 2 (form has its own submit) */}
                {!(amortWizStep === 2 && amortSource === "manual") && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 shrink-0">
                    {/* Back + dots */}
                    <div className="flex items-center gap-3">
                      {amortWizStep > 1 ? (
                        <button onClick={() => setAmortWizStep(s => s - 1)}
                          className="h-8 px-3 text-base font-medium text-muted-foreground hover:text-foreground border border-border rounded-[8px] bg-background hover:bg-muted transition-colors">
                          Back
                        </button>
                      ) : <div className="w-12" />}
                      <div className="flex items-center gap-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className={`rounded-full transition-all duration-200 ${
                            i + 1 === amortWizStep ? "w-4 h-2 bg-primary" : i + 1 < amortWizStep ? "w-2 h-2 bg-primary/50" : "w-2 h-2 bg-muted-foreground/25"
                          }`} />
                        ))}
                      </div>
                    </div>
                    {/* Next / Approve */}
                    {amortWizStep < 3 ? (
                      <button
                        onClick={() => setAmortWizStep(s => s + 1)}
                        disabled={amortWizStep === 2 && amortSource === "upload" && !amortUploadFile}
                        className="inline-flex items-center gap-2 h-8 px-4 text-base font-medium bg-primary text-primary-foreground rounded-[8px] hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next <ChevronRight className="h-5 w-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const fileName =
                            amortSource === "existing" ? AMORT_ENG_DOCS.find(d => d.id === amortSelDocId)?.name :
                            amortSource === "upload"   ? amortUploadFile :
                            AMORT_DRIVE_FILES.find(f => f.id === amortDriveId)?.name;
                          handleLoanAmortSubmit({
                            loanName: "", lender: "", loanType: "Term",
                            interestRateType: "Fixed", paymentType: "Blended (Amortizing)",
                            loanTenure: "60", currency: "CAD",
                            principalAmount: "3750000", annualInterestRate: "5.25",
                            dayCountBasis: "ACT/365", loanStartDate: "", maturityDate: "",
                            paymentFrequency: "Monthly", firstPaymentDate: "",
                            compoundingFrequency: "", interestOnlyPeriod: "",
                            fixedPaymentAmount: "", balloonAmount: "",
                            uploadedFile: fileName ?? null,
                          });
                          setAmortPhase("found");
                        }}
                        className="inline-flex items-center gap-2 h-8 px-4 text-base font-medium bg-primary text-primary-foreground rounded-[8px] hover:bg-primary/90 transition-colors"
                      >
                        Approve &amp; continue <ChevronRight className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                )}

              </div>
            </div>
          </>
        )}


        {/* ── Add New Workspace Modal ── */}
        {newWsModalOpen && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
            <div className="bg-background rounded-[8px] shadow-2xl w-[480px] max-h-[85vh] flex flex-col overflow-hidden border border-border">
              {/* Header */}
              <div className="px-6 pt-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-[8px] bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <button onClick={() => { setNewWsModalOpen(false); setNewWsSearch(""); setNewWsSelected([]); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h2 className="text-lg font-semibold text-foreground">Add New Workspace</h2>
                <p className="text-base text-foreground mt-1">Select from the below source connected engagements to add to your workspace.</p>
              </div>

              {/* Search + sort row */}
              <div className="px-6 pb-3 flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground" />
                  <input
                    value={newWsSearch}
                    onChange={e => setNewWsSearch(e.target.value)}
                    placeholder="Search clients"
                    className="w-full pl-9 pr-3 py-2 rounded-[8px] border border-border bg-background text-base placeholder:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-colors"
                  />
                </div>
                <button
                  onClick={() => setNewWsSortAsc(s => !s)}
                  className="w-9 h-9 flex items-center justify-center rounded-[8px] border border-border bg-muted/40 hover:bg-muted transition-colors text-foreground"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>

              {/* Client list */}
              <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-2">
                {WS_CLIENTS
                  .filter(c => c.name.toLowerCase().includes(newWsSearch.toLowerCase()) || c.ref.toLowerCase().includes(newWsSearch.toLowerCase()))
                  .sort((a, b) => newWsSortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))
                  .map(client => {
                    const selected = newWsSelected.includes(client.id);
                    return (
                      <button
                        key={client.id}
                        onClick={() => setNewWsSelected(s => selected ? s.filter(id => id !== client.id) : [...s, client.id])}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-[8px] border text-left transition-all duration-150 group",
                          selected ? "border-primary/40 bg-primary/[0.04]" : "border-border hover:border-primary/25 hover:bg-muted/30"
                        )}
                      >
                        {/* Checkbox */}
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                          selected ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"
                        )}>
                          {selected && <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />}
                        </div>
                        {/* Icon */}
                        <div className="w-8 h-8 rounded-[8px] bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        {/* Name + ref */}
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium text-foreground truncate">{client.name}</p>
                          <p className="text-base text-foreground truncate">{client.ref}</p>
                        </div>
                        {/* Source badge */}
                        <div className={cn(
                          "flex items-center gap-2 px-2.5 py-1 rounded-[8px] border text-base font-medium shrink-0",
                          client.source === "quickbooks" ? "border-green-200 bg-green-50 text-green-700" : "border-blue-200 bg-blue-50 text-blue-700"
                        )}>
                          {client.source === "quickbooks" ? "QuickBooks" : "Xero"}
                        </div>
                      </button>
                    );
                  })
                }
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border flex items-center gap-3">
                <button
                  onClick={() => { setNewWsModalOpen(false); setNewWsSearch(""); setNewWsSelected([]); }}
                  className="flex-1 py-2.5 rounded-[8px] border border-border text-base font-medium text-foreground hover:bg-muted/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newWsSelected.length > 0) {
                      const loan = activeLoans.find(l => newWsSelected.includes(l.id)) || activeLoans[0];
                      setNewWsModalOpen(false); setNewWsSearch(""); setNewWsSelected([]);
                      if (loan) initializeAutopilot(loan);
                    }
                  }}
                  disabled={newWsSelected.length === 0}
                  className="flex-1 py-2.5 rounded-[8px] bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Create{newWsSelected.length > 0 ? ` (${newWsSelected.length})` : ""}
                </button>
              </div>
            </div>
          </div>
        )}
        </>
      )}
    </AnimatePresence>
  );
}
