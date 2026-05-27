import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import ReactDOM from "react-dom";
import { accountMappings as allGLAccounts } from "@/data/mockData";
import { LukaAttachMenu, AttachedFilesBar, useAttachedFiles } from "@/components/luka/LukaAttachMenu";
import { VoiceRecordingOverlay } from "@/components/luka/VoiceRecordingOverlay";
import {
  X, Mic, Plus, Search, MessageSquare, Minus, Send, Inbox, Maximize2,
  ChevronLeft, ChevronRight, Clock, PanelLeftClose, MoreHorizontal,
  Zap, Building2, CheckCircle2, ChevronDown, SlidersHorizontal,
  Bell, Settings, ArrowLeft, Lock, Upload, FileText, Mail, Square,
  FolderOpen, RotateCcw, Sparkles, Eye, EyeOff, Pin, LayoutList, CalendarDays, CalendarRange,
  ArrowUpDown, Check, BookOpen, HardDrive, FileSpreadsheet, ShieldCheck,
  AlertTriangle, TrendingUp, TrendingDown, Info, Table2, RefreshCw,
  Calendar, Receipt, Download, Trash2, BarChart2, Pencil,
} from "lucide-react";
import { Button } from "@/components/wp-ui/button";
import { ScrollArea } from "@/components/wp-ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/wp-ui/tooltip";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/wp-ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PromptPicker } from "@/components/luka/PromptPicker";
import { GrossMarginResponse } from "@/components/luka/GrossMarginResponse";
import { LoanAmortizationPrompt } from "@/components/luka/LoanAmortizationPrompt";
import { LoanAmortizationResponse } from "@/components/luka/LoanAmortizationResponse";
import type { LoanAmortData } from "@/components/luka/LoanAmortizationPrompt";
import { LongTermAssetResponse } from "@/components/luka/LongTermAssetResponse";
import { InvestmentScheduleResponse } from "@/components/luka/InvestmentScheduleResponse";
import { LukaResponseActions } from "@/components/luka/LukaResponseActions";
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
      <div className="flex-1 text-sm text-foreground leading-relaxed">{children}</div>
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
const SCR = "h-6 text-[10px] px-1 border border-border rounded bg-background focus:outline-none appearance-none cursor-pointer";

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
        className={cn("h-6 text-[10px] px-1.5 border rounded bg-background focus:outline-none w-full font-mono",required && !value ? "border-red-400 bg-red-50/60 placeholder:text-red-400 text-red-600 focus:border-red-500" : "border-border focus:border-primary/40 placeholder:text-muted-foreground")}
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
              className={`px-3 py-1 text-[11px] cursor-pointer font-mono ${a.code === value ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground hover:bg-muted'}`}
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

export function AskLukaOverlay({ open, onOpenChange }: AskLukaOverlayProps) {
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
  const [invSchedPhase, setInvSchedPhase] = useState<"idle"|"upload-prompt"|"done">("idle");
  const [invSchedGenerated, setInvSchedGenerated] = useState(false);
  const [invSchedSrcLabel, setInvSchedSrcLabel] = useState<string|null>(null);
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
    setInvSchedPhase("idle"); setInvSchedGenerated(false); setInvSchedSrcLabel(null);
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
        setInvSchedPhase("upload-prompt");
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
              "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0",
              isActive
                ? "border-primary text-foreground bg-primary/5"
                : isDone
                  ? "border-transparent text-foreground hover:text-foreground hover:border-border"
                  : isLocked
                    ? "border-transparent text-foreground cursor-not-allowed"
                    : "border-transparent text-foreground hover:text-foreground hover:border-border"
            )}
          >
            {isDone && !isActive && <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />}
            {tab.id === "magic" && <Sparkles className="w-3 h-3 shrink-0" />}
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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-primary/8 border border-primary/15 text-[11px] font-medium text-primary/80">
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
                <span className="text-xs font-semibold text-foreground">Luka</span>
                <span className="text-[10px] text-foreground">Engagement AI</span>
              </div>
              <div className="bg-background rounded-[8px] border border-border/60 px-4 py-3 shadow-sm text-sm text-foreground leading-relaxed">
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
                <span className="text-xs font-semibold text-foreground">Luka</span>
                <span className="text-[10px] text-foreground">Engagement AI</span>
              </div>
              <div className="bg-background rounded-[8px] border border-border/60 px-4 py-3 shadow-sm text-sm text-foreground leading-relaxed">
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
                <span className="text-xs font-semibold text-foreground">Luka</span>
                <span className="text-[10px] text-foreground">Engagement AI</span>
                {verifyPhase === "reviewing" && (
                  <span className="flex items-center gap-1 text-[10px] text-primary/70 animate-pulse">
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
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                  )}
                  <span className={cn("text-xs font-semibold", verifyPhase === "done" ? "text-green-700 dark:text-green-400" : "text-foreground")}>
                    {verifyPhase === "done" ? "Verification complete" : "Reviewing engagement…"}
                  </span>
                  {verifyPhase === "done" && (
                    <span className="ml-auto text-[10px] text-green-600/70 font-medium">{verifyRows.length} checks passed</span>
                  )}
                </div>
                {/* Rows */}
                <div className="bg-background divide-y divide-border/40">
                  {verifyRows.map((row, i) => (
                    <div key={i} className={cn("flex items-start px-4 py-2.5 gap-3 transition-all duration-200", row.showCheck ? "opacity-100" : "opacity-40")}>
                      <div className="shrink-0 mt-0.5">
                        {row.showCheck
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          : <div className="w-3.5 h-3.5 rounded-full border-2 border-border/60" />
                        }
                      </div>
                      <span className="text-[11px] text-foreground w-36 shrink-0 leading-relaxed">{row.label}</span>
                      {row.showCheck && (
                        <span className="text-[11px] text-foreground flex-1 leading-relaxed whitespace-pre-line">{row.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Post-verification message */}
              {verifyPhase === "done" && (
                <div className="mt-3 bg-background rounded-[8px] border border-border/60 px-4 py-3 shadow-sm text-sm text-foreground leading-relaxed animate-in fade-in duration-300">
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
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-foreground">Required Files</span>
                <span className="text-[10px] text-foreground">Must upload before automation</span>
              </div>
              <div className="bg-background rounded-[8px] border border-amber-200 dark:border-amber-800/40 overflow-hidden shadow-sm">
                <div className="bg-amber-50 dark:bg-amber-950/20 px-4 py-2.5 border-b border-amber-100 dark:border-amber-900/30">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Must have files for seamless automation</p>
                </div>
                <div className="divide-y divide-amber-100/60 dark:divide-amber-900/20">
                  {[
                    { n: 1, label: "Last year finalized FS", sub: "With Notes" },
                    { n: 2, label: "Mapped TB", sub: "Same FS" },
                    { n: 3, label: "Corporate Tax Returns", sub: "Filed T2" },
                  ].map(item => (
                    <div key={item.n} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="w-5 h-5 rounded-[4px] bg-amber-500 flex items-center justify-center shrink-0 text-white text-[10px] font-bold">{item.n}</div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-foreground">{item.label}</p>
                        <p className="text-[10px] text-foreground">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 bg-amber-50/50 dark:bg-amber-950/10 border-t border-amber-100 dark:border-amber-900/20">
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">*Note: Only PDF file type allowed</p>
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
                <span className="text-xs font-semibold text-foreground">Luka</span>
                <span className="text-[10px] text-foreground">Engagement AI</span>
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-border bg-background text-xs text-foreground hover:bg-muted/50 hover:border-primary/30 transition-all shadow-sm"
            >
              <RotateCcw className="w-3 h-3" /> Rerun verification
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
          <span className="text-xs font-semibold text-foreground">Luka</span>
          <span className="text-[10px] text-foreground">Engagement AI</span>
        </div>
        <div className="bg-background rounded-[8px] border border-border/60 px-4 py-3 shadow-sm text-sm text-foreground leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );

  // ── shared helper: tab header chip ──
  const TabChip = ({ label, icon: Icon }: { label: string; icon: React.ElementType }) => (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-primary/8 border border-primary/15 text-[11px] font-medium text-primary/80">
        <Icon className="w-3.5 h-3.5 text-primary" />
        {label}
      </div>
    </div>
  );

  // ── shared helper: file chip ──
  const FileChip = ({ name, onRemove }: { name: string; onRemove: () => void }) => (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-border bg-background shadow-sm text-xs text-foreground">
      <FileText className="w-3 h-3 text-primary/60" />
      {name}
      <button onClick={onRemove} className="ml-1 w-3.5 h-3.5 rounded-full hover:bg-muted/60 flex items-center justify-center text-foreground hover:text-foreground transition-colors">×</button>
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
          <p className="text-xs text-foreground">Uploading…</p>
        </div>
      ) : uploaded ? (
        <div className="flex flex-col items-center gap-2">
          <CheckCircle2 className="w-7 h-7 text-green-500" />
          <p className="text-sm text-green-600 font-medium">Uploaded successfully</p>
        </div>
      ) : (
        <>
          <div className="w-9 h-9 rounded-[8px] bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-4.5 h-4.5 text-primary" />
          </div>
          <p className="text-sm text-foreground"><span className="text-primary font-medium">Click to upload</span> or drag and drop</p>
          <p className="text-xs text-foreground mt-1">PDF files only</p>
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
              <p className="text-sm font-medium text-foreground">Is this a first-year of operations for this client?</p>
              <div className="flex gap-2">
                {["Yes", "No"].map(opt => (
                  <button
                    key={opt}
                    onClick={() => {
                      setIsFirstYear(opt === "Yes");
                      if (opt === "No") simulateChecklistUpload();
                    }}
                    className={cn(
                      "px-5 py-1.5 rounded-[8px] border text-sm font-medium transition-all",
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
                      <p className="text-[11px] font-semibold text-foreground">Last year checklists</p>
                    </div>
                    <div className="divide-y divide-border/40">
                      {["Client acceptance & continuance", "Independence", "Knowledge of client business", "Planning"].map(item => (
                        <div key={item} className="flex items-center justify-between px-3 py-2">
                          <span className="text-[11px] text-foreground">{item}</span>
                          {uploadedChecklists.length > 0
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            : <div className="w-3.5 h-3.5 rounded-full border-2 border-border/50 shrink-0" />}
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
              <span className="text-xs font-semibold text-foreground flex-1">Letter Templates</span>
              <span className="text-[10px] text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full font-medium">*Required</span>
            </div>
            <div className="divide-y divide-border/40 px-4">
              {[
                { label: "Engagement Letter Template*", value: "Engagement Letter CSRS 4200" },
                { label: "Management Responsibility Letter Template*", value: "Management Responsibility L..." },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="w-7 h-7 rounded-[6px] bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-primary/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-foreground mb-1">{row.label}</p>
                    <div className="flex items-center gap-2 border border-border rounded-[8px] px-3 py-1.5 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
                      <span className="text-xs text-foreground flex-1 truncate">{row.value}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-foreground shrink-0" />
                    </div>
                  </div>
                  <button
                    onClick={() => markCompleted("letters")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-border bg-background text-xs text-foreground hover:bg-muted/50 hover:border-primary/40 transition-all shrink-0 shadow-sm"
                  >
                    <Eye className="w-3 h-3" /> Review
                  </button>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-border bg-muted/10">
              <button className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium">
                <Plus className="w-3.5 h-3.5" /> Add Letter
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
              <span className="text-xs font-semibold text-foreground flex-1">Luka suggested working paper threads</span>
              <span className="text-[10px] text-foreground">{Object.values(wpToggles).filter(Boolean).length} selected</span>
            </div>
            <div className="divide-y divide-border/40">
              {WP_THREADS.map(wp => (
                <div key={wp.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="w-7 h-7 rounded-[6px] bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-3.5 h-3.5 text-primary/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {wp.label}
                      {wp.required && <span className="text-destructive ml-0.5 font-normal">*</span>}
                    </p>
                    <p className="text-[11px] text-foreground mt-0.5 leading-relaxed">{wp.desc}</p>
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
                <span className="text-xs font-semibold text-foreground flex-1">Financial Statement Settings</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-foreground">Last Year Files</span>
                  <button
                    onClick={() => setFsExtractFromLastYear(!fsExtractFromLastYear)}
                    className={cn("relative w-9 h-5 rounded-full transition-colors", fsExtractFromLastYear ? "bg-primary" : "bg-muted")}
                  >
                    <span className={cn("absolute left-0 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", fsExtractFromLastYear ? "translate-x-4" : "translate-x-0.5")} />
                  </button>
                  <span className="text-[10px] text-foreground">Global Default</span>
                </div>
              </div>

              <div className="px-4 py-3">
                <button
                  onClick={() => setFsFormOpen(!fsFormOpen)}
                  className="flex items-center gap-2 w-full text-xs font-medium text-foreground hover:text-primary transition-colors mb-3"
                >
                  <FileText className="w-3.5 h-3.5 text-foreground" />
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
                        <p className="text-[10px] text-foreground mb-1">{field.label}</p>
                        <div className="relative">
                          <select
                            value={field.val}
                            onChange={e => { field.set(e.target.value); setFsSettingsDirty(true); }}
                            className="w-full text-xs border border-border rounded-[8px] px-3 py-2 bg-background appearance-none pr-7 focus:outline-none focus:border-primary hover:border-primary/40 transition-colors"
                          >
                            {field.opts.map(o => <option key={o}>{o}</option>)}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground pointer-events-none" />
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
                      "px-4 py-1.5 rounded-[8px] text-xs font-medium transition-all",
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
                    <Clock className="w-3.5 h-3.5 text-foreground" />
                    <span className="text-xl font-bold text-foreground">12 mins</span>
                  </div>
                  <p className="text-xs font-medium text-foreground">Completion time</p>
                  <p className="text-[10px] text-foreground mt-0.5">After file analysis</p>
                </div>
                <div className="rounded-[8px] border border-border bg-background px-4 py-3.5 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded-[4px] bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0">
                      <LukaIcon size={8} />
                    </div>
                    <span className="text-xl font-bold text-foreground">4.5 hrs</span>
                  </div>
                  <p className="text-xs font-medium text-foreground">Time saved</p>
                  <p className="text-[10px] text-foreground mt-0.5">This engagement</p>
                </div>
              </div>

              {/* Credits */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-[8px] border border-primary/15 bg-primary/[0.03] shadow-sm">
                <div className="w-8 h-8 rounded-[8px] bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">1.5 credits estimated</p>
                  <p className="text-[10px] text-foreground">Based on uploaded files and Trial Balance data</p>
                </div>
              </div>

              {/* Steps status */}
              {!allDone && (
                <div className="rounded-[8px] border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/30 px-4 py-3">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-2">Complete all steps to unlock automation:</p>
                  <div className="flex flex-wrap gap-2">
                    {["verification","checklists","letters","workingpapers","fsmapping"].map(s => (
                      <span key={s} className={cn(
                        "flex items-center gap-1 text-[10px] px-2 py-1 rounded-[6px] font-medium",
                        completedSteps.has(s)
                          ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      )}>
                        {completedSteps.has(s) ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border-2 border-amber-400" />}
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
                  className="flex items-center gap-2.5 px-10 py-3.5 rounded-[8px] text-sm font-semibold text-white bg-gradient-to-r from-[#8649F1] to-[#2355A4] hover:opacity-90 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all"
                >
                  <Sparkles className="w-4 h-4" /> Start Magic
                </button>
                <div className="flex items-center gap-1.5 text-xs text-destructive/80">
                  <Lock className="w-3 h-3" />
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
          <span className="text-xs font-semibold text-foreground tracking-wider uppercase">Automation Progress</span>
          <span className="text-xs font-mono text-foreground bg-muted px-2.5 py-1 rounded-md">{formatElapsed(automationElapsed)}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8649F1] to-[#2355A4] rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${automationProgress}%` }}
            />
          </div>
          <span className="text-sm font-bold text-foreground w-10 text-right">{automationProgress}%</span>
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
              <div key={i} className={cn("flex items-center justify-center gap-2 text-sm animate-in fade-in duration-300", isActive ? "text-foreground" : "text-foreground")}>
                {isActive ? (
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500/50 shrink-0" />
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
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive/30 text-sm text-destructive hover:bg-destructive/5 transition-colors"
          >
            <Square className="w-3.5 h-3.5" fill="currentColor" /> Stop
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted/50 transition-colors">
            <Mail className="w-3.5 h-3.5" /> Notify Me
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
              <span className="text-sm font-bold text-foreground uppercase tracking-wider">File Maturity</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative flex items-center justify-center w-7 h-7 rounded-lg hover:bg-muted transition-colors">
                <Bell className="w-4 h-4 text-foreground" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-white text-[9px] flex items-center justify-center font-bold">5</span>
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
                <span className="text-sm font-bold text-foreground">72%</span>
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
                <div key={s.v} className={cn("text-xs font-semibold", s.c)}>{s.v}</div>
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
                {item.icon === "bar" ? <Bell className="w-3 h-3 text-foreground" /> : item.icon === "bank" ? <Building2 className="w-3 h-3 text-foreground" /> : <FileText className="w-3 h-3 text-foreground" />}
              </div>
              <p className="text-sm text-foreground flex-1">{item.msg}</p>
              <button className={cn("text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0", item.color)}>
                {item.action}
              </button>
            </div>
          ))}
        </div>

        {/* Suggested Actions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">Suggested Actions</span>
            <span className="text-xs text-foreground">5 active</span>
          </div>
          <div className="space-y-1">
            {["Review covenant compliance threshold breach", "Reconcile accrued interest variance ($1,247)", "Generate FS disclosure note for long-term debt", "Update current portion classification", "Sign off on capital asset schedule"].map(action => (
              <div key={action} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                <p className="text-xs text-foreground flex-1">{action}</p>
                <button className="text-[10px] text-primary opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">→</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat input (restored in observation mode) */}
      <div className={cn("pb-4 pt-2 shrink-0", viewMode === "full" ? "px-10" : "px-5")}>
        <div className="border border-border rounded-[12px] overflow-hidden bg-background dark:bg-card hover:border-primary/30 transition-all duration-200 luka-gradient-border">
          <div className="px-4 pt-2.5 pb-2">
            <input type="text" placeholder="Type # for prompts or just ask anything..." className="w-full bg-transparent h-8 placeholder:text-foreground outline-none border-none text-sm text-foreground" />
          </div>
          <div className="px-3 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-500">✨</span>
              <span className="text-sm font-medium text-foreground">Gemini 3 Flash</span>
            </div>
            <Button size="icon" className="h-8 w-8 rounded-full bg-gradient-to-br from-[#8649F1] to-[#2355A4] hover:opacity-90 text-white shadow-sm">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {viewMode === "half" && (
        <div className="fixed inset-0 z-40" onClick={() => onOpenChange(false)} />
      )}

      <div className={cn(
        "fixed top-0 right-0 bottom-0 z-50 bg-background dark:bg-card overflow-hidden",
        "animate-in slide-in-from-right-5 fade-in zoom-in-[0.97] duration-400 ease-out",
        viewMode === "full"
          ? "left-14 rounded-tl-[1.25rem] rounded-bl-[1.25rem] border-l border-[hsl(210deg_36.19%_7.6%/76%)] shadow-[-10px_0_20px_-4px_rgba(0,0,0,0.90),-3px_0_6px_-3px_rgba(0,0,0,0.90)]"
          : "left-[45%] rounded-tl-[1.25rem] rounded-bl-[1.25rem] border-l border-[hsl(210deg_36.19%_7.6%/76%)] shadow-[-10px_0_20px_-4px_rgba(0,0,0,0.90),-3px_0_6px_-3px_rgba(0,0,0,0.90)]"
      )}>
        <div className="flex h-full min-w-0 w-full">

          {/* ═══ LEFT SIDEBAR — Claude Code style ═══ */}
          <aside
            className={cn(
              "relative flex flex-col transition-all duration-300 ease-in-out shrink-0",
              "bg-[hsl(212.43deg_86.02%_10.76%)]",
              sidebarExpanded ? "w-[260px]" : "w-[52px]"
            )}
            onMouseEnter={() => setSidebarHovered(true)}
            onMouseLeave={() => setSidebarHovered(false)}
          >
            <TooltipProvider delayDuration={100}>
              {sidebarExpanded ? (
                <>
                  {/* ── Logo row ── */}
                  <div className="px-3 pt-3 pb-2 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0">
                      <LukaIcon size={13} />
                    </div>
                    <span className="text-sm font-semibold text-white flex-1 tracking-tight">Luka</span>
                    <span className="text-[9px] font-semibold text-white/45 bg-white/[0.10] rounded px-1.5 py-0.5 tracking-wide uppercase">AI</span>
                    <button
                      onClick={() => setSidebarExpanded(false)}
                      className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/[0.15] transition-colors ml-0.5"
                    >
                      <PanelLeftClose className="h-3.5 w-3.5 text-white/70" />
                    </button>
                  </div>

                  {/* ── New session button ── */}
                  <div className="px-2 pb-2">
                    <button
                      onClick={activeTab === "threads" ? () => {} : () => setNewWsModalOpen(true)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.13] transition-colors group"
                    >
                      <div className="w-5 h-5 rounded-full border border-white/50 flex items-center justify-center shrink-0 group-hover:border-white/80 transition-colors">
                        <Plus className="w-3 h-3 text-white/80 group-hover:text-white" />
                      </div>
                      <span className="text-sm text-white/55 group-hover:text-white/80 transition-colors">
                        {activeTab === "threads" ? "New thread" : "New workspace"}
                      </span>
                    </button>
                  </div>

                  {/* ── Filter row ── */}
                  <div className="px-3 pb-2 flex items-center gap-1">
                    <div className="relative" ref={el => { (filterDropdownRef as React.MutableRefObject<HTMLDivElement | null>).current = el; (wsFilterDropdownRef as React.MutableRefObject<HTMLDivElement | null>).current = el; }}>
                      {activeTab === "threads" ? (
                        <button
                          onClick={() => setFilterDropdownOpen(o => !o)}
                          className="flex items-center gap-1 text-xs font-medium text-white/50 hover:text-white/75 transition-colors"
                        >
                          {activeFilterLabel}
                          <ChevronDown className={cn("w-3 h-3 transition-transform duration-150", filterDropdownOpen && "rotate-180")} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setWsFilterDropdownOpen(o => !o)}
                          className="flex items-center gap-1 text-xs font-medium text-white/50 hover:text-white/75 transition-colors"
                        >
                          {activeWsFilterLabel}
                          <ChevronDown className={cn("w-3 h-3 transition-transform duration-150", wsFilterDropdownOpen && "rotate-180")} />
                        </button>
                      )}
                      {filterDropdownOpen && activeTab === "threads" && (
                        <div className="absolute top-full left-0 mt-1.5 z-50 min-w-[155px] rounded-[8px] bg-[hsl(212_60%_14%)] border border-white/[0.10] shadow-[0_4px_12px_rgba(0,0,0,0.18)] py-1">
                          {THREAD_FILTERS.map(f => (
                            <button
                              key={f.id}
                              onClick={() => { setThreadFilter(f.id); setFilterDropdownOpen(false); }}
                              className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors",
                                threadFilter === f.id
                                  ? "text-white bg-white/[0.10]"
                                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.06]"
                              )}
                            >
                              <f.Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                              {f.label}
                            </button>
                          ))}
                        </div>
                      )}
                      {wsFilterDropdownOpen && activeTab === "workspaces" && (
                        <div className="absolute top-full left-0 mt-1.5 z-50 min-w-[165px] rounded-[8px] bg-[hsl(212_60%_14%)] border border-white/[0.10] shadow-[0_4px_12px_rgba(0,0,0,0.18)] py-1">
                          {WORKSPACE_FILTERS.map(f => (
                            <button
                              key={f.id}
                              onClick={() => { setWorkspaceFilter(f.id); setWsFilterDropdownOpen(false); }}
                              className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors",
                                workspaceFilter === f.id
                                  ? "text-white bg-white/[0.10]"
                                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.06]"
                              )}
                            >
                              <f.Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                              {f.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-1" />
                    <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/[0.15] transition-colors">
                      <Search className="w-3 h-3 text-white/65 hover:text-white/90" />
                    </button>
                    <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/[0.15] transition-colors">
                      <SlidersHorizontal className="w-3 h-3 text-white/65 hover:text-white/90" />
                    </button>
                  </div>

                  <div className="mx-3 border-t border-white/[0.22] mb-1" />

                  {/* ── List content ── */}
                  {activeTab === "threads" ? (
                    <ScrollArea className="flex-1 px-2">
                      {/* Show flat filtered list for non-"all" filters */}
                      {threadFilter !== "all" ? (
                        <>
                          <p className="px-2 pt-2 pb-1 text-[10px] font-medium text-white/[0.38] uppercase tracking-wider">
                            {activeFilterLabel}
                          </p>
                          {(threadFilter === "pinned" ? pinnedThreads : recentThreads).map(t => (
                            <button key={t.id} className="w-full flex items-center gap-2.5 px-2 py-1.5 text-left rounded-lg hover:bg-white/[0.13] transition-colors group">
                              <MessageSquare className="w-3.5 h-3.5 text-white/55 shrink-0 group-hover:text-white/80" />
                              <span className="text-sm text-white/60 truncate group-hover:text-white/85">{t.name}</span>
                            </button>
                          ))}
                          {(threadFilter === "this-week" || threadFilter === "last-week" || threadFilter === "this-month") && (
                            <p className="px-2 py-4 text-xs text-white/30 text-center">No threads found</p>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Pinned section */}
                          <button onClick={() => toggleSection("pinned")} className="w-full flex items-center gap-1 px-2 pt-2 pb-1 group">
                            <span className="text-[10px] font-medium text-white/[0.38] uppercase tracking-wider flex-1 text-left">Pinned</span>
                            <ChevronRight className={cn("w-3 h-3 text-white/25 transition-transform duration-150", sectionOpen.pinned && "rotate-90")} />
                          </button>
                          {sectionOpen.pinned && pinnedThreads.map(t => (
                            <button key={t.id} className="w-full flex items-center gap-2.5 px-2 py-1.5 text-left rounded-lg hover:bg-white/[0.13] transition-colors group">
                              <MessageSquare className="w-3.5 h-3.5 text-white/55 shrink-0 group-hover:text-white/80" />
                              <span className="text-sm text-white/60 truncate group-hover:text-white/85">{t.name}</span>
                            </button>
                          ))}
                          {/* Recent section */}
                          <button onClick={() => toggleSection("recent")} className="w-full flex items-center gap-1 px-2 pt-3 pb-1 group">
                            <span className="text-[10px] font-medium text-white/[0.38] uppercase tracking-wider flex-1 text-left">Recent</span>
                            <ChevronRight className={cn("w-3 h-3 text-white/25 transition-transform duration-150", sectionOpen.recent && "rotate-90")} />
                          </button>
                          {sectionOpen.recent && recentThreads.map(t => (
                            <button key={t.id} className="w-full flex items-center gap-2.5 px-2 py-1.5 text-left rounded-lg hover:bg-white/[0.13] transition-colors group">
                              <MessageSquare className="w-3.5 h-3.5 text-white/55 shrink-0 group-hover:text-white/80" />
                              <span className="text-sm text-white/60 truncate group-hover:text-white/85">{t.name}</span>
                            </button>
                          ))}
                        </>
                      )}
                    </ScrollArea>
                  ) : (
                    /* ── Compilation Workspaces ── */
                    <ScrollArea className="flex-1 px-2">
                      {/* Pinned section */}
                      {pinnedWs.length > 0 && (
                        <>
                          <button onClick={() => toggleSection("pinned")} className="w-full flex items-center gap-1 px-2 pt-2 pb-1.5 group">
                            <span className="text-[10px] font-medium text-white/[0.38] uppercase tracking-wider flex-1 text-left">Pinned</span>
                            <ChevronRight className={cn("w-3 h-3 text-white/25 transition-transform duration-150", sectionOpen.pinned && "rotate-90")} />
                          </button>
                          {sectionOpen.pinned && COMP_WORKSPACES.filter(w => pinnedWs.includes(w.id)).map(ws => {
                            const isSelected = selectedCompWs?.id === ws.id;
                            return (
                            <div key={ws.id} className="group relative mb-1.5">
                              <button
                                onClick={() => selectCompWorkspace(ws)}
                                className={cn(
                                  "w-full flex items-center gap-2.5 px-2.5 py-2 text-left rounded-[6px] transition-colors border",
                                  isSelected
                                    ? "bg-white/[0.12] border-white/[0.15]"
                                    : "hover:bg-white/[0.08] border-transparent hover:border-white/[0.08]"
                                )}
                              >
                                <div className={cn("w-6 h-6 rounded-[4px] flex items-center justify-center shrink-0", isSelected ? "bg-primary/30" : "bg-white/[0.08]")}>
                                  <Building2 className={cn("w-3.5 h-3.5", isSelected ? "text-primary/80" : "text-white/50")} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn("text-xs font-medium truncate leading-tight", isSelected ? "text-white/90" : "text-white/70")}>{ws.name}</p>
                                  <p className="text-[10px] text-amber-400/60 truncate leading-tight mt-0.5">{ws.ref}</p>
                                </div>
                                {ws.active && <span className="w-1.5 h-1.5 rounded-full bg-green-400/70 shrink-0" />}
                              </button>
                              {/* Hover actions */}
                              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-[hsl(212.43deg_86.02%_10.76%)] rounded-[4px] px-0.5 py-0.5">
                                <button onClick={e => { e.stopPropagation(); togglePinWs(ws.id); }} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/[0.12] transition-colors">
                                  <Pin className="w-3 h-3 text-white/50 hover:text-white/80" />
                                </button>
                                <button onClick={e => e.stopPropagation()} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/[0.12] transition-colors">
                                  <X className="w-3 h-3 text-white/50 hover:text-red-400" />
                                </button>
                              </div>
                            </div>
                          );})}

                        </>
                      )}
                      {/* Active section */}
                      <button onClick={() => toggleSection("active")} className="w-full flex items-center gap-1 px-2 pt-2 pb-1.5 group">
                        <span className="text-[10px] font-medium text-white/[0.38] uppercase tracking-wider flex-1 text-left">Active</span>
                        <ChevronRight className={cn("w-3 h-3 text-white/25 transition-transform duration-150", sectionOpen.active && "rotate-90")} />
                      </button>
                      {sectionOpen.active && COMP_WORKSPACES.map(ws => {
                        const isSelected = selectedCompWs?.id === ws.id;
                        return (
                        <div key={ws.id} className="group relative mb-1.5">
                          <button
                            onClick={() => selectCompWorkspace(ws)}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-2.5 py-2 text-left rounded-[6px] transition-colors border",
                              isSelected
                                ? "bg-white/[0.12] border-white/[0.15]"
                                : "hover:bg-white/[0.08] border-transparent hover:border-white/[0.08]"
                            )}
                          >
                            <div className={cn("w-6 h-6 rounded-[4px] flex items-center justify-center shrink-0", isSelected ? "bg-primary/30" : "bg-white/[0.08]")}>
                              <Building2 className={cn("w-3.5 h-3.5", isSelected ? "text-primary/80" : "text-white/50")} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-xs font-medium truncate leading-tight", isSelected ? "text-white/90" : "text-white/70")}>{ws.name}</p>
                              <p className="text-[10px] text-amber-400/60 truncate leading-tight mt-0.5">{ws.ref}</p>
                            </div>
                            {ws.active && <span className="w-1.5 h-1.5 rounded-full bg-green-400/70 shrink-0" />}
                          </button>
                          {/* Hover actions */}
                          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-[hsl(212.43deg_86.02%_10.76%)] rounded-[4px] px-0.5 py-0.5">
                            <button onClick={e => { e.stopPropagation(); togglePinWs(ws.id); }} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/[0.12] transition-colors">
                              <Pin className={cn("w-3 h-3 transition-colors", pinnedWs.includes(ws.id) ? "text-amber-400/80" : "text-white/50 hover:text-white/80")} />
                            </button>
                            <button onClick={e => e.stopPropagation()} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/[0.12] transition-colors">
                              <X className="w-3 h-3 text-white/50 hover:text-red-400" />
                            </button>
                          </div>
                        </div>
                      );})}
                    </ScrollArea>
                  )}

                  {/* ── Footer ── */}
                  <div className="px-3 py-2.5 border-t border-white/[0.12]">
                    <button onClick={() => setShowAllRecent(!showAllRecent)} className="text-xs text-white/35 hover:text-white/60 transition-colors">
                      {showAllRecent ? "Show less" : "Show more"}
                    </button>
                  </div>
                </>
              ) : (
                /* ── COLLAPSED sidebar ── */
                <>
                  <div className="flex justify-center pt-3 pb-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setSidebarExpanded(true)}
                          className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(265_80%_55%)] flex items-center justify-center hover:opacity-90 transition-opacity"
                        >
                          <LukaIcon size={13} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right"><p>Expand Luka</p></TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex justify-center pb-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => { setSidebarExpanded(true); if (activeTab !== "threads") cancelAutopilot(); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.12] transition-colors"
                        >
                          <Plus className="h-4 w-4 text-white/65" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right"><p>{activeTab === "threads" ? "New Thread" : "New Workspace"}</p></TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="mx-auto w-7 border-t border-white/[0.18] mb-1" />
                  <ScrollArea className="flex-1 py-1">
                    <div className="flex flex-col items-center gap-0.5 px-1.5">
                      {allThreads.slice(0, 8).map((thread, i) => (
                        <Tooltip key={thread.id}>
                          <TooltipTrigger asChild>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.12] transition-colors relative">
                              <MessageSquare className="h-3.5 w-3.5 text-white/55" />
                              <div className={cn("absolute top-1 right-1 w-1.5 h-1.5 rounded-full", statusColors[i % statusColors.length])} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right"><p>{thread.name}</p></TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </TooltipProvider>
          </aside>

          {/* ═══ MAIN CONTENT ═══ */}
          <main className={cn(
            "flex-1 min-w-0 flex flex-col overflow-hidden transition-all duration-300",
            (isThinking || aiResponse || autopilotStep)
              ? "bg-background"
              : "bg-gradient-to-b from-[hsl(210_60%_97%)] via-[hsl(260_40%_96%)] to-[hsl(300_30%_96%)] dark:from-[hsl(220_20%_12%)] dark:via-[hsl(260_15%_14%)] dark:to-[hsl(280_10%_13%)]"
          )}>
            {/* Top header bar */}
            <div className="h-12 px-4 flex items-center border-b border-border/60 bg-background/60 backdrop-blur-sm shrink-0 gap-2">
              {/* Left: engagement badges when autopilot active */}
              <div className="flex items-center gap-2 shrink-0 min-w-0">
                <div />
              </div>

              {/* Center: Global-style underline tabs */}
              <div className="flex-1 flex items-end justify-center h-full">
                <div className="flex gap-0.5">
                  {([ { id: "threads", label: "Threads", Icon: MessageSquare }, { id: "workspaces", label: "Workspaces", Icon: Building2 } ] as const).map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as "threads" | "workspaces")}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors relative whitespace-nowrap",
                        activeTab === id
                          ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-t"
                          : "text-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: team avatars + file status + window controls */}
              <div className="flex items-center gap-2.5 shrink-0 justify-end min-w-0 ml-auto">
                {activeTab === "workspaces" && selectedCompWs && autopilotStep !== null && (
                  <>
                    {/* Team avatars — distinct colors per person */}
                    <div className="flex -space-x-2">
                      {[
                        { init: "AB", bg: "bg-[#C4B5FD]", text: "text-[#4C1D95]" },
                        { init: "TJ", bg: "bg-[#8B5CF6]", text: "text-white" },
                        { init: "PT", bg: "bg-[#3B82F6]", text: "text-white" },
                      ].map((av, i) => (
                        <div
                          key={i}
                          className={cn("w-7 h-7 rounded-full border-2 border-background flex items-center justify-center text-[9px] font-bold shrink-0 shadow-sm", av.bg, av.text)}
                          style={{ zIndex: 3 - i }}
                        >
                          {av.init}
                        </div>
                      ))}
                    </div>
                    {/* FILE status pill */}
                    {isAutomating ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-destructive border border-destructive/30 bg-destructive/5 rounded-[8px] px-3 py-1.5 shrink-0 shadow-sm animate-pulse">
                        <Lock className="w-3 h-3" /> FILE LOCKED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800/40 rounded-[8px] px-3 py-1.5 shrink-0 shadow-sm">
                        <FolderOpen className="w-3.5 h-3.5" /> FILE OPEN
                      </span>
                    )}
                  </>
                )}
              </div>

              <TooltipProvider delayDuration={200}>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarExpanded(!sidebarExpanded)}>
                        <PanelLeftClose className="h-4 w-4 text-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>Toggle Sidebar</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className={cn("h-8 w-8", viewMode === "full" && "bg-muted")} onClick={() => setViewMode(viewMode === "full" ? "half" : "full")}>
                        <Maximize2 className="h-4 w-4 text-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>{viewMode === "full" ? "Half Mode" : "Full Mode"}</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Minus className="h-4 w-4 text-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>Minimize</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
                        <X className="h-4 w-4 text-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>Close</p></TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>

            {/* Body */}
            {activeTab === "workspaces" ? (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

                {/* ── INIT SCREEN ── */}
                {autopilotStep === "init" && activeLoan && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 animate-in fade-in duration-300">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-[hsl(265_80%_55%)/20] blur-2xl scale-150" />
                      <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#8649F1] to-[#2355A4] flex items-center justify-center shadow-2xl shadow-primary/30">
                        <LukaIcon size={40} />
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-bold text-foreground">Automate Engagement?</h2>
                      <p className="text-sm text-foreground max-w-xs leading-relaxed">
                        I'll guide you through the setup process and verify everything is ready for a smooth automation run
                      </p>
                    </div>
                    <button
                      onClick={() => startVerification(activeLoan)}
                      className="flex items-center gap-2.5 px-8 py-3 rounded-xl bg-gradient-to-r from-[#8649F1] to-[#2355A4] text-white font-semibold text-sm shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity"
                    >
                      <Zap className="w-4 h-4" fill="white" strokeWidth={0} />
                      Initialize Luka
                    </button>
                  </div>
                )}

                {/* ── WIZARD STEPS ── */}
                {isWizardStep && selectedCompWs && (
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                    {renderTabBar()}
                    {/* Single scrollable page — all sections, tabs scroll to anchors */}
                    <div className="flex-1 overflow-y-auto min-h-0 bg-[hsl(220_20%_98%)] dark:bg-[hsl(220_15%_10%)] pb-28">
                      <div ref={el => { sectionRefs.current["verification"] = el; }}>
                        {renderVerification()}
                      </div>
                      <div className="border-t border-border/30" ref={el => { sectionRefs.current["checklists"] = el; }}>
                        {renderChecklists()}
                      </div>
                      <div className="border-t border-border/30" ref={el => { sectionRefs.current["letters"] = el; }}>
                        {renderLetters()}
                      </div>
                      <div className="border-t border-border/30" ref={el => { sectionRefs.current["workingpapers"] = el; }}>
                        {renderWorkingPapers()}
                      </div>
                      <div className="border-t border-border/30" ref={el => { sectionRefs.current["fsmapping"] = el; }}>
                        {renderFSMapping()}
                      </div>
                      <div className="border-t border-border/30" ref={el => { sectionRefs.current["magic"] = el; }}>
                        {renderMagic()}
                      </div>
                      {/* Scroll anchor — auto-scrolled to as content grows */}
                      <div ref={scrollAnchorRef} className="h-1" />
                    </div>

                    {/* ── Floating chat input ── */}
                    <div className="absolute bottom-4 left-0 right-0 px-6 pointer-events-none z-10">
                      <div className="max-w-2xl mx-auto pointer-events-auto relative">
                        <PromptPicker open={showPromptPicker} filter={hashFilter} onSelect={handlePromptSelect} onClose={() => { setShowPromptPicker(false); setHashFilter(""); }} />

                        {/* Outer container */}
                        <div className="rounded-[10px] bg-background dark:bg-card border border-border/80 shadow-[0_4px_24px_rgba(0,0,0,0.12)] luka-gradient-border overflow-hidden">

                          {/* ── TOP CONTEXT STRIP ── */}
                          <div className="flex items-center justify-between px-3 py-2">
                            {/* Left: engagement ref ← active step + QB badge */}
                            <div className="flex items-center gap-1.5 text-xs text-foreground min-w-0">
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-foreground"><path d="M5 3H3a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1zM13 3h-2a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1zM5 9H3a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 00-1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M8 5v6M8 11l3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              <span className="font-semibold text-foreground truncate">{selectedCompWs?.ref ?? "Workspace"}</span>
                              <ArrowLeft className="w-3 h-3 opacity-40 shrink-0" />
                              <span className="truncate">{WIZARD_TABS.find(t => t.id === activeWizardTab)?.label ?? activeWizardTab}</span>
                              {/* QuickBooks live connection badge */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-0.5 cursor-default ml-1">
                                    <div className="relative flex items-center justify-center w-4 h-4 rounded-full bg-[#2CA01C] shadow-sm shrink-0">
                                      <span className="text-white font-black text-[6px] leading-none">QB</span>
                                      <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 border border-background" />
                                    </div>
                                    <button className="w-5 h-5 flex items-center justify-center text-foreground hover:text-foreground transition-colors shrink-0">
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top">Add connectors</TooltipContent>
                              </Tooltip>
                            </div>
                            {/* Right: action button */}
                            <div className="flex items-center gap-2 shrink-0">
                              {lukaIsTyping || (verifyPhase !== "idle" && verifyPhase !== "done") ? (
                                <button disabled className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border border-border/40 bg-muted/30 text-xs font-medium text-foreground cursor-not-allowed">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse" />
                                  Working…
                                </button>
                              ) : activeWizardTab === "magic" ? (
                                <button onClick={() => startMagic()} className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] border border-border/80 bg-background text-xs font-medium text-foreground hover:bg-muted/50 transition-colors">
                                  Start Magic
                                  <ChevronDown className="w-3 h-3 opacity-40" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    const tabs = ["verification","checklists","letters","workingpapers","fsmapping","magic"];
                                    const idx = tabs.indexOf(activeWizardTab);
                                    const next = tabs[idx + 1] ?? activeWizardTab;
                                    setActiveWizardTab(next as AutopilotStep);
                                    sectionRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "start" });
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] border border-border/80 bg-background text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
                                >
                                  Continue
                                  <ChevronDown className="w-3 h-3 opacity-40 -rotate-90" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* File strip — only when files attached */}
                          {attachedFiles.length > 0 && (
                            <>
                              <div className="flex items-center gap-1.5 flex-wrap px-3 pt-2.5 pb-2">
                                {attachedFiles.map(f => (
                                  <span key={f.id} className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-[6px] bg-muted/80 text-xs text-foreground">
                                    <FileText className="w-3 h-3 text-foreground shrink-0" />
                                    {f.name}
                                    <button onClick={() => removeFile(f.id)} className="ml-0.5 w-4 h-4 rounded flex items-center justify-center text-foreground hover:text-foreground transition-colors">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <div className="px-3"><div className="h-px bg-border/60 rounded-full" /></div>
                            </>
                          )}

                          {/* Text input */}
                          <div className="border-t border-border/60 rounded-[8px]">
                            <div className="px-3 pt-2.5 pb-2.5">
                              <input
                                ref={inputRef}
                                type="text"
                                value={message}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                disabled={lukaIsTyping || (verifyPhase !== "idle" && verifyPhase !== "done")}
                                placeholder={lukaIsTyping || (verifyPhase !== "idle" && verifyPhase !== "done") ? "Luka is working…" : "Reply..."}
                                className={cn("w-full bg-transparent h-7 outline-none border-none text-sm", lukaIsTyping || (verifyPhase !== "idle" && verifyPhase !== "done") ? "placeholder:text-foreground cursor-not-allowed" : "placeholder:text-foreground", message.includes("#") ? "text-primary font-medium" : "text-foreground")}
                              />
                            </div>
                          </div>

                          {/* Toolbar */}
                          <div className="px-2 pb-2 pt-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-0.5">
                              <LukaAttachMenu onFilesAdded={addFiles} />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="flex items-center gap-1.5 px-2 h-7 rounded-[6px] hover:bg-muted/50 transition-colors text-xs text-foreground hover:text-foreground">
                                    {editMode === 'auto' ? 'Auto accept edits' : 'Ask permissions'}
                                    <ChevronDown className="w-3 h-3 opacity-40" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="min-w-[220px]">
                                  <DropdownMenuItem onSelect={() => setEditMode('ask')} className="flex flex-col items-start gap-0.5 py-2 cursor-pointer">
                                    <span className="font-medium text-xs text-foreground">Ask permissions</span>
                                    <span className="text-[11px] text-foreground">Always ask before making changes</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => setEditMode('auto')} className="flex flex-col items-start gap-0.5 py-2 cursor-pointer">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-[10px] opacity-60">&lt;/&gt;</span>
                                      <span className="font-medium text-xs text-foreground">Auto accept edits</span>
                                    </div>
                                    <span className="text-[11px] text-foreground">Automatically accept all file edits</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <button className="flex items-center gap-1.5 px-2 h-7 rounded-[6px] hover:bg-muted/50 transition-colors text-xs text-foreground hover:text-foreground">
                                <Zap className="w-3 h-3 text-violet-400 shrink-0" />
                                Luka AI
                                <ChevronDown className="w-3 h-3 opacity-40" />
                              </button>
                              {message.trim() ? (
                                <Button size="icon" className="h-7 w-7 rounded-[6px] bg-gradient-to-br from-[#8649F1] to-[#2355A4] hover:opacity-90 text-white shadow-sm" onClick={handleSend}>
                                  <Send className="h-3.5 w-3.5" />
                                </Button>
                              ) : (
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[6px]" onClick={() => setVoiceOpen(true)}>
                                  <Mic className="h-3.5 w-3.5 text-foreground" />
                                </Button>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── AUTOMATION IN PROGRESS ── */}
                {autopilotStep === "automating" && renderAutomating()}

                {/* ── OBSERVATION MODE ── */}
                {autopilotStep === "observation" && renderObservation()}

                {/* ── IDLE / NO LOAN ── */}
                {autopilotStep === null && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 opacity-70">
                    <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                      <Building2 className="w-7 h-7 text-foreground" />
                    </div>
                    <div className="text-center space-y-1.5">
                      <p className="text-sm font-medium text-foreground">Select a workspace to start</p>
                      <p className="text-xs text-foreground max-w-[280px] leading-relaxed">
                        Choose an active workspace from the sidebar and Luka will automatically prepare your engagement, or click New workspace to start a new engagement.
                      </p>
                    </div>
                    <button
                      onClick={() => setNewWsModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] border border-border bg-background text-xs font-medium text-foreground hover:bg-muted/60 hover:border-primary/40 transition-all duration-150 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5 text-foreground" />
                      New workspace
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ── THREADS VIEW ── */
              <div className="flex-1 flex flex-col min-w-0 min-h-0">
                <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
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
                          <button key={s} onClick={() => handlePromptSelect(s.replace("#", ""))} className="px-4 py-2 rounded-[10px] border border-border bg-background dark:bg-card text-sm text-foreground hover:bg-muted/60 transition-colors">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="px-6 py-4 space-y-4 min-w-0 max-w-full overflow-hidden">
                      <div className="flex justify-end">
                        <div className="max-w-[80%] px-4 py-3 rounded-[12px] bg-primary text-primary-foreground text-base">{sentMessage}</div>
                      </div>
                      {(isThinking || aiResponse) && (
                        <div className="flex items-start gap-3 min-w-0 max-w-full">
                          <div className={cn("w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0", isThinking && "luka-thinking-spin")}>
                            <LukaIcon size={16} />
                          </div>
                          <div className="flex-1 pt-1.5 min-h-[28px] min-w-0 overflow-x-auto">
                            {isThinking ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground luka-thinking-text">Thinking</span>
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
                                    <p className="text-sm text-foreground leading-relaxed">
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
                                              <p className="text-xs font-semibold text-foreground">How would you like to add loans?</p>
                                              <p className="text-[10px] text-muted-foreground">Luka will auto-extract and fill all fields from your documents</p>
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
                                                  <p className="text-[11px] font-semibold text-foreground">Import documents</p>
                                                  <p className="text-[10px] text-muted-foreground mt-0.5">Loan agreements · Registers<br />Schedules · PDF · XLSX · ZIP</p>
                                                </div>
                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary group-hover:underline">
                                                  Click to browse or drag & drop
                                                </span>
                                              </div>

                                              {/* OR */}
                                              <div className="flex flex-col items-center justify-center px-3 gap-1.5">
                                                <div className="w-px flex-1 bg-gradient-to-b from-transparent via-border to-transparent" />
                                                <span className="text-[10px] font-bold text-muted-foreground/50">or</span>
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
                                                  <p className="text-[11px] font-semibold text-foreground">Enter manually</p>
                                                  <p className="text-[10px] text-muted-foreground mt-0.5">Add a blank row and type<br />loan details directly in the table</p>
                                                </div>
                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-violet-600 group-hover:underline">
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
                                                    "inline-flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-[10px] border bg-background text-xs max-w-[220px]",
                                                    isError ? "border-red-200" : isAmbig ? "border-amber-300" : "border-border"
                                                  )}>
                                                    <div className={cn("w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0", isError ? "bg-red-50" : "bg-primary/10")}>
                                                      {f.ext === "pdf" ? <FileText className="h-3.5 w-3.5 text-primary shrink-0" /> : f.ext === "zip" ? <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-primary shrink-0" />}
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
                                                        className="text-[10px] border border-amber-300 rounded-[6px] px-1 py-0.5 bg-background text-amber-700 focus:outline-none cursor-pointer shrink-0 max-w-[100px]"
                                                      >
                                                        <option value="" disabled>Classify…</option>
                                                        <option value="loan-agreement">Loan Agreement</option>
                                                        <option value="debt-schedule">Debt Schedule</option>
                                                        <option value="continuity">Continuity</option>
                                                        <option value="loan-register">Loan Register</option>
                                                        <option value="workpaper">Prior Year WP</option>
                                                      </select>
                                                    )}
                                                    {isError && <span className="text-[10px] text-red-600 shrink-0">{f.kind === "unsupported" ? "Unsupported" : "Too large"}</span>}
                                                    <button onClick={e => { e.stopPropagation(); setLtDebtUploadFiles(prev => prev.filter(x => x.id !== f.id)); }} className="shrink-0 text-red-400 hover:text-red-600 transition-colors">
                                                      <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}

                                          {/* ── Review table ── */}
                                          {ltReviewRows.length > 0 && (
                                            <div className="space-y-2">
                                              {/* Mode toggle — Edit active */}
                                              <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-semibold text-foreground">
                                                  {ltReviewRows.length} loan{ltReviewRows.length !== 1 ? "s" : ""} extracted — review and complete before submitting
                                                </span>
                                                <div className="shrink-0 ml-3 flex items-center gap-0 rounded-[8px] border border-border bg-muted/40 p-0.5">
                                                  <button
                                                    disabled={!ltDebtGenerated}
                                                    onClick={() => setLtDebtGenerated(true)}
                                                    className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-[6px] text-[11px] font-medium text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                                  >
                                                    <BarChart2 className="w-3 h-3" /> Schedule
                                                  </button>
                                                  <button
                                                    className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-[6px] text-[11px] font-semibold bg-background text-foreground shadow-sm border border-border/60 transition-all"
                                                  >
                                                    <Pencil className="w-3 h-3" /> Add/Edit
                                                  </button>
                                                </div>
                                              </div>

                                              {/* Scrollable review table */}
                                              <div className="rounded-[8px] border border-border overflow-hidden">
                                                <div className="overflow-x-auto">
                                                  <table className="w-full text-[10px]" style={{ minWidth: 2400 }}>
                                                    <thead>
                                                      <tr className="bg-muted/30 border-b border-border">
                                                        {["Loan Name *","Lender *","Current Collateral","Type","Rate Type","Int. Rate % *","Start *","Maturity *","First Payment","CCY","Mo. Payment","Orig. Loan Amt","FX Rate","Opening Bal. *","GL Principal *","Day Count","Payment Type","Freq.","Compounding","IO Period (mo.)","Balloon Amt","Status",""].map((h, i) => (
                                                          <th key={i} className={`px-2 py-1.5 text-[9px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${LT_RIGHT_COLS.has(h) ? "text-right" : "text-left"} ${h === "" ? "sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] z-10" : ""}`}>
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
                                                          cn("h-6 text-[10px] px-1.5 border rounded bg-background focus:outline-none w-full",
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

                                          {/* Bottom actions */}
                                          <div className="flex items-center justify-between gap-2">
                                            <div />

                                            {/* Right: hint + Submit */}
                                            <div className="flex items-center gap-2">
                                              {missingCount > 0 && (
                                                <span className="text-[10px] text-red-500">
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
                                                    "inline-flex items-center gap-1.5 h-9 px-5 text-sm font-medium rounded-[8px] transition-colors",
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
                                  <p className="text-sm text-foreground">
                                    Workpaper generated from <strong>{ltDebtSrcLabel}</strong> ✓
                                  </p>
                                )}
                              </div>
                            ) : richResponseType === "investment" ? (
                              <div className="space-y-3 py-0.5 max-w-full">
                                {!invSchedGenerated ? (
                                  <>
                                    <p className="text-sm text-foreground leading-relaxed">
                                      To generate your <strong>Investment Schedule</strong> workpaper, connect your brokerage via <strong>Plaid Link</strong> or upload your documents below.
                                      We accept <strong>brokerage statements</strong> (PDF/CSV), <strong>trade confirmations</strong>, or <strong>prior-year workpapers</strong> (Excel · up to 15 files · 25 MB total).
                                    </p>

                                    {/* ── PLAID FLOW ── */}
                                    {invPlaidOpen ? (
                                      <div className="rounded-[12px] border border-border bg-background overflow-hidden">
                                        {/* Header */}
                                        <div className="px-4 pt-4 pb-3 border-b border-border flex items-center gap-2">
                                          {invPlaidStep === 'login' && (
                                            <button onClick={() => setInvPlaidStep('select')} className="text-muted-foreground hover:text-foreground">
                                              <ChevronLeft className="w-4 h-4" />
                                            </button>
                                          )}
                                          {invPlaidStep === 'login' && invPlaidInstitution ? (
                                            <>
                                              <div className="w-5 h-5 rounded flex-shrink-0 text-white text-[9px] font-bold flex items-center justify-center"
                                                style={{ backgroundColor: invPlaidInstitution.color }}>
                                                {invPlaidInstitution.abbr.slice(0, 2)}
                                              </div>
                                              <h3 className="text-sm font-semibold text-foreground flex-1 truncate">Sign in to {invPlaidInstitution.name}</h3>
                                            </>
                                          ) : invPlaidStep === 'verifying' ? (
                                            <h3 className="text-sm font-semibold text-foreground flex-1">Connecting…</h3>
                                          ) : invPlaidStep === 'success' ? (
                                            <h3 className="text-sm font-semibold text-foreground flex-1">Authorize Access</h3>
                                          ) : (
                                            <>
                                              <div className="w-5 h-5 rounded-md bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
                                                <span className="text-white text-[9px] font-bold tracking-tight">p</span>
                                              </div>
                                              <h3 className="text-sm font-semibold text-foreground flex-1">Connect to Plaid</h3>
                                            </>
                                          )}
                                          <button onClick={resetInvPlaid} className="ml-auto text-muted-foreground hover:text-foreground">
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>

                                        {/* Body */}
                                        <div className="px-4 py-4">
                                          {invPlaidStep === 'select' && (
                                            <div className="space-y-3">
                                              <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                                                <input
                                                  className="w-full h-8 pl-7 pr-3 text-xs rounded-[8px] border border-border bg-muted/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
                                                  placeholder="Search 12,000+ institutions…" value={invPlaidSearch}
                                                  onChange={e => setInvPlaidSearch(e.target.value)} autoFocus />
                                              </div>
                                              <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                                                {INV_PLAID_INSTITUTIONS
                                                  .filter(i => !invPlaidSearch || i.name.toLowerCase().includes(invPlaidSearch.toLowerCase()))
                                                  .map(inst => (
                                                    <button key={inst.id}
                                                      onClick={() => { setInvPlaidInstitution(inst); setInvPlaidStep('login'); }}
                                                      className="flex items-center gap-2 px-2.5 py-2 rounded-[8px] border border-border hover:border-primary hover:bg-muted/40 transition-colors text-left">
                                                      <div className="w-7 h-7 rounded-[6px] flex items-center justify-center flex-shrink-0 text-white text-[9px] font-bold"
                                                        style={{ backgroundColor: inst.color }}>
                                                        {inst.abbr.slice(0, 2)}
                                                      </div>
                                                      <span className="text-xs font-medium text-foreground leading-tight">{inst.name}</span>
                                                    </button>
                                                  ))}
                                              </div>
                                              <div className="flex items-center gap-1.5 justify-center pt-0.5">
                                                <ShieldCheck className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-[10px] text-muted-foreground">256-bit encryption · read-only access</span>
                                              </div>
                                            </div>
                                          )}

                                          {invPlaidStep === 'login' && invPlaidInstitution && (
                                            <div className="space-y-3">
                                              <div className="h-0.5 rounded-full" style={{ backgroundColor: invPlaidInstitution.color }} />
                                              <div className="space-y-2.5">
                                                <div>
                                                  <label className="block text-[11px] font-medium text-foreground mb-1">Username / Card Number</label>
                                                  <input
                                                    className="w-full h-8 px-2.5 text-xs rounded-[8px] border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
                                                    placeholder="Enter username" value={invPlaidUsername}
                                                    onChange={e => setInvPlaidUsername(e.target.value)} autoFocus />
                                                </div>
                                                <div>
                                                  <label className="block text-[11px] font-medium text-foreground mb-1">Password</label>
                                                  <div className="relative">
                                                    <input
                                                      className="w-full h-8 px-2.5 pr-8 text-xs rounded-[8px] border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
                                                      type={invPlaidShowPwd ? 'text' : 'password'} placeholder="Enter password"
                                                      value={invPlaidPassword} onChange={e => setInvPlaidPassword(e.target.value)}
                                                      onKeyDown={e => { if (e.key === 'Enter') handleInvPlaidVerify(); }} />
                                                    <button type="button" onClick={() => setInvPlaidShowPwd(p => !p)}
                                                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                                      {invPlaidShowPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                    </button>
                                                  </div>
                                                </div>
                                              </div>
                                              <p className="text-[10px] text-muted-foreground leading-relaxed flex items-start gap-1">
                                                <ShieldCheck className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                                Your credentials are encrypted end-to-end and never stored. Plaid requests read-only access to transaction history only.
                                              </p>
                                            </div>
                                          )}

                                          {invPlaidStep === 'verifying' && (
                                            <div className="flex flex-col items-center justify-center py-8 gap-4">
                                              <div className="w-12 h-12 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin" />
                                              <div className="text-center">
                                                <p className="text-xs font-semibold text-foreground">Verifying credentials…</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">Connecting to {invPlaidInstitution?.name}</p>
                                              </div>
                                            </div>
                                          )}

                                          {invPlaidStep === 'success' && invPlaidInstitution && (
                                            <div className="space-y-3">
                                              <div className="rounded-[10px] border border-green-200 bg-green-50 p-3 text-center">
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-1.5">
                                                  <Check className="w-4 h-4 text-green-600" />
                                                </div>
                                                <p className="text-xs font-semibold text-green-800">{invPlaidInstitution.name}</p>
                                                <p className="text-[10px] text-green-700 mt-0.5">2 accounts found · ready to link</p>
                                              </div>
                                              <div className="space-y-1.5">
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Select accounts to link</p>
                                                {[
                                                  { name: 'Investment Account',     acct: '···' + invPlaidInstitution.id.slice(0, 2).toUpperCase() + '01', ccy: 'CAD' },
                                                  { name: 'USD Investment Account', acct: '···' + invPlaidInstitution.id.slice(0, 2).toUpperCase() + '02', ccy: 'USD' },
                                                ].map(a => (
                                                  <label key={a.acct} className="flex items-center gap-2.5 rounded-[8px] border border-border px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors">
                                                    <input type="checkbox" defaultChecked className="rounded h-3 w-3 accent-primary" />
                                                    <div>
                                                      <div className="text-[11px] font-medium text-foreground">{a.name}</div>
                                                      <div className="text-[10px] text-muted-foreground font-mono">{a.acct} · {a.ccy}</div>
                                                    </div>
                                                  </label>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>

                                        {/* Footer */}
                                        <div className="px-4 pb-4 pt-3 flex justify-end gap-2 border-t border-border">
                                          {invPlaidStep === 'select' && (
                                            <button onClick={resetInvPlaid}
                                              className="h-8 px-3 text-xs font-medium rounded-[8px] border border-border hover:bg-muted/40 transition-colors text-foreground">
                                              Cancel
                                            </button>
                                          )}
                                          {invPlaidStep === 'login' && (
                                            <>
                                              <button onClick={() => setInvPlaidStep('select')}
                                                className="h-8 px-3 text-xs font-medium rounded-[8px] border border-border hover:bg-muted/40 transition-colors text-foreground">
                                                Back
                                              </button>
                                              <button onClick={handleInvPlaidVerify}
                                                className="h-8 px-4 text-xs font-medium rounded-[8px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                                                Continue
                                              </button>
                                            </>
                                          )}
                                          {invPlaidStep === 'success' && (
                                            <>
                                              <button onClick={resetInvPlaid}
                                                className="h-8 px-3 text-xs font-medium rounded-[8px] border border-border hover:bg-muted/40 transition-colors text-foreground">
                                                Cancel
                                              </button>
                                              <button
                                                onClick={() => {
                                                  setInvSchedGenerated(true);
                                                  setInvSchedSrcLabel(`Plaid — ${invPlaidInstitution!.name}`);
                                                  setInvSchedPhase("done");
                                                  resetInvPlaid();
                                                }}
                                                className="inline-flex items-center gap-1.5 h-8 px-4 text-xs font-medium rounded-[8px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                                                <ShieldCheck className="w-3 h-3" /> Allow Access
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                    ) : invUploadOpen ? (
                                      /* ── UPLOAD FLOW ── */
                                      (() => {
                                        const addInvFiles = (rawFiles: FileList | null) => {
                                          if (!rawFiles) return;
                                          const classified = Array.from(rawFiles).map(classifyInvFile);
                                          setInvUploadFiles(prev => {
                                            const existing = new Set(prev.map(f => f.name));
                                            return [...prev, ...classified.filter(f => !existing.has(f.name))].slice(0, 15);
                                          });
                                        };
                                        const validFiles = invUploadFiles.filter(f => f.kind !== "unsupported" && f.kind !== "oversized");
                                        const ambigFiles = invUploadFiles.filter(f => f.kind === "ambiguous" && !f.userKind);
                                        return (
                                          <div className="space-y-3">
                                            {/* Drop zone */}
                                            <div
                                              className="flex flex-col items-center justify-center gap-2 rounded-[12px] border border-border bg-background cursor-pointer transition-colors py-6 hover:bg-muted/30"
                                              onClick={() => {
                                                const inp = document.createElement("input");
                                                inp.type = "file"; inp.accept = ".pdf,.xlsx,.xls,.csv,.zip"; inp.multiple = true;
                                                inp.onchange = e => addInvFiles((e.target as HTMLInputElement).files);
                                                inp.click();
                                              }}
                                              onDragOver={e => e.preventDefault()}
                                              onDrop={e => { e.preventDefault(); addInvFiles(e.dataTransfer.files); }}
                                            >
                                              <div className="w-9 h-9 rounded-full border border-border bg-muted/40 flex items-center justify-center">
                                                <Upload className="h-4 w-4 text-muted-foreground" />
                                              </div>
                                              <p className="text-sm text-muted-foreground text-center">
                                                <span className="text-primary font-medium">Click to upload</span> or drag and drop
                                              </p>
                                              <p className="text-xs text-muted-foreground">PDF · CSV · Excel · Max 15 files · 25 MB total</p>
                                            </div>

                                            {/* File chips */}
                                            {invUploadFiles.length > 0 && (
                                              <div className="flex flex-wrap gap-2">
                                                {invUploadFiles.map(f => {
                                                  const isError = f.kind === "unsupported" || f.kind === "oversized";
                                                  const isAmbig = f.kind === "ambiguous" && !f.userKind;
                                                  return (
                                                    <div key={f.id} className={cn(
                                                      "inline-flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-[10px] border bg-background text-xs max-w-[220px]",
                                                      isError ? "border-red-200" : isAmbig ? "border-amber-300" : "border-border"
                                                    )}>
                                                      <div className={cn(
                                                        "w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0",
                                                        isError ? "bg-red-50" : "bg-primary/10"
                                                      )}>
                                                        {f.ext === "pdf"
                                                          ? <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                                                          : f.ext === "zip"
                                                          ? <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                                                          : <FileSpreadsheet className="h-3.5 w-3.5 text-primary shrink-0" />}
                                                      </div>
                                                      <span className="flex-1 min-w-0 truncate font-medium text-foreground">{f.name}</span>
                                                      {isAmbig && (
                                                        <select onClick={e => e.stopPropagation()} defaultValue=""
                                                          onChange={e => {
                                                            const v = e.target.value as Exclude<InvFileKind, "ambiguous"|"unsupported"|"oversized">;
                                                            setInvUploadFiles(prev => prev.map(x => x.id === f.id ? { ...x, userKind: v } : x));
                                                          }}
                                                          className="text-[10px] border border-amber-300 rounded-[6px] px-1 py-0.5 bg-background text-amber-700 focus:outline-none cursor-pointer shrink-0 max-w-[110px]"
                                                        >
                                                          <option value="" disabled>Classify…</option>
                                                          <option value="statement">Statement</option>
                                                          <option value="trade-confirm">Trade Confirm</option>
                                                          <option value="account-summary">Account Summary</option>
                                                          <option value="workpaper">Prior Year WP</option>
                                                        </select>
                                                      )}
                                                      {isError && (
                                                        <span className="text-[10px] text-red-600 shrink-0">{f.kind === "unsupported" ? "Unsupported" : "Too large"}</span>
                                                      )}
                                                      <button
                                                        onClick={e => { e.stopPropagation(); setInvUploadFiles(prev => prev.filter(x => x.id !== f.id)); }}
                                                        className="shrink-0 text-red-400 hover:text-red-600 transition-colors"
                                                      >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                      </button>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}

                                            {/* Actions row */}
                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={() => { setInvUploadOpen(false); setInvUploadFiles([]); }}
                                                className="h-9 px-3 text-xs font-medium rounded-[8px] border border-border hover:bg-muted/40 transition-colors text-foreground"
                                              >
                                                Cancel
                                              </button>
                                              {validFiles.length > 0 && ambigFiles.length === 0 && (
                                                <button
                                                  onClick={() => {
                                                    setInvSchedSrcLabel(`${validFiles.length} uploaded document${validFiles.length !== 1 ? "s" : ""}`);
                                                    setInvSchedGenerated(true);
                                                    setInvSchedPhase("done");
                                                  }}
                                                  className="inline-flex items-center gap-1.5 h-9 px-5 text-sm font-medium bg-primary text-primary-foreground rounded-[8px] hover:bg-primary/90 transition-colors"
                                                >
                                                  Submit
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })()

                                    ) : (
                                      /* ── INITIAL TWO-BUTTON STATE ── */
                                      <>
                                        <div className="flex flex-col gap-2 sm:flex-row">
                                          <button
                                            onClick={() => setInvPlaidOpen(true)}
                                            className="flex-1 flex items-center gap-2 px-4 py-3 rounded-[10px] border-2 border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-all text-sm font-medium text-foreground"
                                          >
                                            <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0"><Zap className="h-3.5 w-3.5 text-white" /></span>
                                            <div className="text-left">
                                              <p className="font-semibold text-sm text-foreground">Connect via Plaid</p>
                                              <p className="text-[11px] text-muted-foreground">Auto-sync transactions from TD, RBC, BMO, Fidelity</p>
                                            </div>
                                          </button>
                                          <button
                                            onClick={() => setInvUploadOpen(true)}
                                            className="flex-1 flex items-center gap-2 px-4 py-3 rounded-[10px] border border-border bg-background hover:bg-muted/40 transition-all text-sm font-medium text-foreground"
                                          >
                                            <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0"><Upload className="h-3.5 w-3.5 text-foreground" /></span>
                                            <div className="text-left">
                                              <p className="font-semibold text-sm text-foreground">Upload Documents</p>
                                              <p className="text-[11px] text-muted-foreground">PDF statements, CSV trade files, Excel workpaper</p>
                                            </div>
                                          </button>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                          Or{" "}
                                          <button className="text-primary underline hover:no-underline" onClick={() => { setInvSchedGenerated(true); setInvSchedSrcLabel("sample data (Countable Holdings Corp.)"); setInvSchedPhase("done"); }}>
                                            use sample investment data
                                          </button>{" "}
                                          to explore the workpaper.
                                        </p>
                                      </>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <p className="text-sm text-foreground leading-relaxed">
                                      Investment Schedule workpaper generated from <strong>{invSchedSrcLabel}</strong> ✓
                                    </p>
                                    <InvestmentScheduleResponse />
                                    {/* Follow-up chips */}
                                    <div className="flex flex-wrap gap-2 pt-1">
                                      {["Export to Excel", "Show unrealized G/L note", "Reconcile to broker statements", "Generate AJEs"].map(chip => (
                                        <button key={chip} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-primary/25 bg-primary/6 text-xs font-medium text-primary hover:bg-primary/15 transition-colors">
                                          {chip}
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}
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
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                  )}
                                  <span className={cn("text-sm text-foreground", amortPhase === "search-wp" && "luka-thinking-text")}>
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
                                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                    )}
                                    <span className={cn("text-sm text-foreground", amortPhase === "search-drives" && "luka-thinking-text")}>
                                      Checking connected drives (Google Drive)
                                    </span>
                                  </div>
                                )}
                                {/* Found result */}
                                {(amortPhase === "found" || amortPhase === "wizard") && (
                                  <div className="flex items-center gap-2 mt-0.5 pl-5">
                                    <span className="text-sm text-foreground">
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
                            <div className="max-w-[80%] px-4 py-3 rounded-[12px] bg-primary text-primary-foreground text-sm leading-relaxed">
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
                            <div className="flex-1 pt-1.5 min-h-[28px] min-w-0 overflow-x-auto">
                              {loanAmortStep === "thinking" ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground luka-thinking-text">Analysing Long-term Asset workpaper</span>
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
                            <div className="max-w-[80%] px-4 py-3 rounded-[12px] bg-primary text-primary-foreground text-sm leading-relaxed">
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
                                  <p className="text-xs text-muted-foreground font-medium">What would you like to explore next?</p>
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
                                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-primary/25 bg-primary/6 text-xs font-medium text-primary hover:bg-primary/15 transition-colors"
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
                              <div className="max-w-[80%] px-4 py-3 rounded-[12px] bg-primary text-primary-foreground text-sm leading-relaxed">
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
                                    <p className="text-sm text-foreground">Upload loan documents or add entries manually below, then click <strong>Submit</strong> to append to the workpaper.</p>

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
                                      <span className="text-xs text-muted-foreground">Drop files or <span className="text-primary font-medium">browse</span> · PDF, XLSX, CSV, ZIP · max 25 MB</span>
                                    </label>

                                    {/* File chips */}
                                    {addMoreLtFiles.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5">
                                        {addMoreLtFiles.map(f => (
                                          <span key={f.id} className={cn("inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium",
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
                                          <table className="w-full text-[10px]" style={{ minWidth: 2400 }}>
                                            <thead>
                                              <tr className="bg-muted/30 border-b border-border">
                                                {["Loan Name *","Lender *","Current Collateral","Type","Rate Type","Int. Rate % *","Start *","Maturity *","First Payment","CCY","Mo. Payment","Orig. Loan Amt","FX Rate","Opening Bal. *","GL Principal *","Day Count","Payment Type","Freq.","Compounding","IO Period (mo.)","Balloon Amt","Status",""].map((h, i) => (
                                                  <th key={i} className={`px-2 py-1.5 text-[9px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${LT_RIGHT_COLS.has(h) ? "text-right" : "text-left"} ${h === "" ? "sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] z-10" : ""}`}>
                                                    {h.endsWith(" *") ? <>{h.slice(0,-2)} <span className="text-red-500">*</span></> : h}
                                                  </th>
                                                ))}
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {addMoreLtRows.map((row, ri) => {
                                                const fc2 = (field: keyof LtDebtReviewRow, req: boolean) =>
                                                  cn("h-6 text-[10px] px-1.5 border rounded bg-background focus:outline-none w-full",
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
                                                      <button onClick={() => deleteAddMoreRow(row.id)} className="inline-flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
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
                                      <button onClick={() => setAddMoreLtRows(prev => [...prev, EMPTY_LT_ROW()])} className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-medium rounded-[8px] border border-border bg-background text-foreground hover:bg-muted/60 transition-colors">
                                        <Plus className="w-3.5 h-3.5" /> Add Manual Entry
                                      </button>
                                      <button
                                        disabled={!amCanSubmit}
                                        onClick={() => { if (amCanSubmit) setAddMoreDone(true); }}
                                        className={cn("inline-flex items-center gap-1.5 h-9 px-5 text-sm font-medium rounded-[8px] transition-colors",
                                          amCanSubmit ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer" : "bg-muted/60 text-muted-foreground/50 cursor-not-allowed border border-border/50 opacity-60")}
                                      >
                                        Submit
                                      </button>
                                      {amMissingCount > 0 && (
                                        <span className="text-[10px] text-red-500">Fill in the <strong>{amMissingCount}</strong> highlighted field{amMissingCount !== 1 ? "s" : ""} to continue</span>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  /* ── Done: show updated workpaper ── */
                                  <>
                                    <p className="text-sm text-foreground">
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
                                <p className="text-sm text-foreground">
                                  {choice.includes("Full") ? "Here's a full covenant compliance overview across all active loans:" : `Here's the detailed analysis for **${choice}**:`}
                                </p>
                                {choice.includes("Full") ? (
                                  <div className="rounded-[10px] border border-border overflow-hidden">
                                    <table className="w-full text-xs">
                                      <thead><tr className="bg-muted/60 border-b border-border">
                                        {["Loan","Covenant","Actual","Threshold","Status"].map(h => <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}
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
                                              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] border ${r.status === "Breached" ? "bg-red-50 text-red-700 border-red-200" : r.status === "At Risk" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-50 text-green-700 border-green-200"}`}>
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
                                      <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                                      <span className="text-xs font-semibold text-red-700 dark:text-red-400">DSCR Covenant — Breached</span>
                                    </div>
                                    <div className="px-4 py-3 space-y-2 text-xs">
                                      <div className="grid grid-cols-3 gap-3">
                                        {[{l:"Actual DSCR",v:"1.12",c:"text-red-600 font-bold"},{l:"Required",v:"≥ 1.25",c:"text-foreground"},{l:"Shortfall",v:"0.13",c:"text-red-600 font-semibold"}].map(r=>(
                                          <div key={r.l} className="rounded-[8px] bg-background border border-border px-2.5 py-2 text-center"><p className="text-[10px] text-muted-foreground mb-0.5">{r.l}</p><p className={`text-sm ${r.c}`}>{r.v}</p></div>
                                        ))}
                                      </div>
                                      <p className="text-muted-foreground pt-1"><span className="font-semibold text-foreground">Root cause:</span> Operating cash flow declined 8.4% YoY while debt service remained constant. EBITDA was impacted by one-time restructuring costs of $240K.</p>
                                      <p className="text-muted-foreground"><span className="font-semibold text-foreground">Recommended action:</span> Disclose breach in financial statement notes. Obtain waiver letter from RBC or reclassify the loan as current under ASPE 3856.</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="rounded-[10px] border border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 overflow-hidden">
                                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-200 bg-amber-50 dark:bg-amber-950/30">
                                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Min Cash Covenant — At Risk</span>
                                    </div>
                                    <div className="px-4 py-3 space-y-2 text-xs">
                                      <div className="grid grid-cols-3 gap-3">
                                        {[{l:"Actual Cash",v:"$425K",c:"text-amber-600 font-bold"},{l:"Required",v:"≥ $500K",c:"text-foreground"},{l:"Shortfall",v:"$75K",c:"text-amber-600 font-semibold"}].map(r=>(
                                          <div key={r.l} className="rounded-[8px] bg-background border border-border px-2.5 py-2 text-center"><p className="text-[10px] text-muted-foreground mb-0.5">{r.l}</p><p className={`text-sm ${r.c}`}>{r.v}</p></div>
                                        ))}
                                      </div>
                                      <p className="text-muted-foreground pt-1"><span className="font-semibold text-foreground">Root cause:</span> Seasonal working capital draw in Q4 reduced unrestricted cash below the minimum balance threshold set by TD.</p>
                                      <p className="text-muted-foreground"><span className="font-semibold text-foreground">Recommended action:</span> Monitor cash position weekly. Consider drawing on the LOC headroom ($625K available) only if absolutely necessary. Disclose as at-risk in notes.</p>
                                    </div>
                                  </div>
                                )}
                                <div className="flex gap-2 pt-1">
                                  <button className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[7px] border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors">
                                    <FileSpreadsheet className="h-3 w-3" /> Export to Excel
                                  </button>
                                  <button className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[7px] border border-primary/20 bg-primary/8 text-xs font-medium text-primary hover:bg-primary/15 transition-colors">
                                    <FileText className="h-3 w-3" /> Draft Notes Disclosure
                                  </button>
                                </div>
                              </div>
                            );

                            case "maturity": return (
                              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                <p className="text-sm text-foreground">Here's the maturity timeline for all active loan facilities:</p>
                                <div className="rounded-[10px] border border-border overflow-hidden">
                                  <table className="w-full text-xs">
                                    <thead><tr className="bg-muted/60 border-b border-border">
                                      {["Facility","Lender","Balance (CAD)","Maturity Date","Days Remaining","Status"].map(h=><th key={h} className={`px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide ${h==="Balance (CAD)"||h==="Days Remaining"?"text-right":"text-left"}`}>{h}</th>)}
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
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] border ${r.days<=365?"bg-amber-50 text-amber-700 border-amber-200":"bg-green-50 text-green-700 border-green-200"}`}>
                                              <Calendar className="h-2.5 w-2.5" />{r.days<=365?"Renewing Soon":"On Track"}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="rounded-[10px] bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 px-3 py-2 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                  <span><strong>Operating LOC</strong> matures in ~10 months (Mar 15, 2026). Recommend initiating renewal discussions with TD by Q3 2025.</span>
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[7px] border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors">
                                    <CalendarDays className="h-3 w-3" /> Add renewal reminders
                                  </button>
                                  <button className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[7px] border border-primary/20 bg-primary/8 text-xs font-medium text-primary hover:bg-primary/15 transition-colors">
                                    <FileSpreadsheet className="h-3 w-3" /> Export maturity ladder
                                  </button>
                                </div>
                              </div>
                            );

                            case "interest": return (
                              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                <p className="text-sm text-foreground">
                                  {choice.includes("Year-end") ? "Accrued interest calculation as at December 31, 2025:" : choice.includes("Q1") ? "Q1 2026 interest accrual breakdown (Jan 1 – Mar 31):" : "Year-to-date accrued interest through May 15, 2026:"}
                                </p>
                                <div className="rounded-[10px] border border-border overflow-hidden">
                                  <table className="w-full text-xs">
                                    <thead><tr className="bg-muted/60 border-b border-border">
                                      {["Loan","Rate","Balance","Days","Accrued Interest","YTD Expense"].map(h=><th key={h} className={`px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide ${h==="Loan"?"text-left":"text-right"}`}>{h}</th>)}
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
                                        <td colSpan={4} className="px-3 py-2 text-xs">Total</td>
                                        <td className="px-3 py-2 text-right tabular-nums">$355,167</td>
                                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">$355,167</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[7px] border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors">
                                    <TrendingUp className="h-3 w-3" /> Generate AJE
                                  </button>
                                  <button className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[7px] border border-primary/20 bg-primary/8 text-xs font-medium text-primary hover:bg-primary/15 transition-colors">
                                    <FileSpreadsheet className="h-3 w-3" /> Export schedule
                                  </button>
                                </div>
                              </div>
                            );

                            case "aje": return (
                              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                <p className="text-sm text-foreground">
                                  Journal entry drafted for: <span className="font-semibold text-primary">{choice}</span>
                                </p>
                                <div className="rounded-[10px] border border-border overflow-hidden">
                                  <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/40">
                                    <Receipt className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-xs font-semibold text-foreground">{choice.includes("Accrued") ? "AJE-06 — Accrued Interest FY2025" : choice.includes("Current") ? "AJE-07 — Current Portion Reclassification" : "AJE-08 — FX Translation Adjustment"}</span>
                                    <span className="ml-auto text-[10px] text-muted-foreground">Dec 31, 2025</span>
                                  </div>
                                  <table className="w-full text-xs">
                                    <thead><tr className="border-b border-border/40 bg-muted/20">
                                      <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Account</th>
                                      <th className="px-3 py-1.5 text-right text-[10px] font-semibold text-muted-foreground uppercase">Debit</th>
                                      <th className="px-3 py-1.5 text-right text-[10px] font-semibold text-muted-foreground uppercase">Credit</th>
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
                                  <button className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[7px] border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors">
                                    <TrendingUp className="h-3 w-3" /> Add to AJEs tab
                                  </button>
                                  <button className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[7px] border border-primary/20 bg-primary/8 text-xs font-medium text-primary hover:bg-primary/15 transition-colors">
                                    <Check className="h-3 w-3" /> Submit for review
                                  </button>
                                </div>
                              </div>
                            );

                            case "variance": return (
                              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                <p className="text-sm text-foreground">Here's the reconciliation variance analysis across all loan facilities:</p>
                                <div className="rounded-[10px] border border-border overflow-hidden">
                                  <table className="w-full text-xs">
                                    <thead><tr className="bg-muted/60 border-b border-border">
                                      {["Loan","TB Balance","Workpaper","Variance","Root Cause"].map(h=><th key={h} className={`px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide ${h==="Loan"||h==="Root Cause"?"text-left":"text-right"}`}>{h}</th>)}
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
                                <div className="rounded-[10px] bg-primary/5 border border-primary/15 px-3 py-2 text-xs text-foreground">
                                  <strong>2 items require attention:</strong> LOC rounding ($500) can be overridden with reason. Accrued interest variance ($2,520) requires AJE — generate it from the AJEs tab.
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[7px] border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors">
                                    <TrendingUp className="h-3 w-3" /> Generate AJE for accrual
                                  </button>
                                  <button className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[7px] border border-primary/20 bg-primary/8 text-xs font-medium text-primary hover:bg-primary/15 transition-colors">
                                    <Check className="h-3 w-3" /> Override LOC rounding
                                  </button>
                                </div>
                              </div>
                            );

                            case "export": return (
                              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                <p className="text-sm text-foreground">
                                  {choice.includes("Excel") ? "I've generated the Excel workpaper package for the Long-term Debt schedule:" : choice.includes("PDF") ? "The notes disclosure draft has been generated:" : "Management summary report is ready:"}
                                </p>
                                <div className="rounded-[10px] border border-border bg-background p-4 flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-[8px] bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                    {choice.includes("Excel") ? <FileSpreadsheet className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">{choice.includes("Excel") ? "LTD_Workpaper_FY2025.xlsx" : choice.includes("PDF") ? "LTD_Notes_Disclosure_Draft.pdf" : "LTD_Management_Summary.pdf"}</p>
                                    <p className="text-xs text-muted-foreground">{choice.includes("Excel") ? "6 sheets · 248 KB" : "3 pages · 142 KB"} · Generated just now</p>
                                  </div>
                                  <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shrink-0">
                                    <Download className="h-3.5 w-3.5" /> Download
                                  </button>
                                </div>
                                {choice.includes("Excel") && (
                                  <div className="text-xs text-muted-foreground px-1">
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
                                      <Building2 className="h-3.5 w-3.5 text-primary" />
                                      <span className="text-xs font-semibold text-foreground">{l.name}</span>
                                      <span className="text-[10px] text-muted-foreground">·</span>
                                      <span className="text-[10px] text-muted-foreground">{l.ref}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-0 divide-x divide-border">
                                      {[
                                        ["Lender", l.lender], ["Loan Type", l.type], ["Currency", l.currency], ["Balance", l.balance],
                                        ["Rate", l.rate], ["Day Count", l.basis], ["Maturity", l.maturity], ["Payment", l.payment],
                                        ["Current Portion", l.current], ["Long-term Portion", l.lt], ["Accrued Interest", l.accrued],
                                      ].map(([label, value]) => (
                                        <div key={label} className="px-3 py-1.5 border-b border-border/40">
                                          <p className="text-[10px] text-muted-foreground">{label}</p>
                                          <p className="text-xs font-medium text-foreground">{value}</p>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="px-3 py-2 border-t border-border/40">
                                      <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide font-semibold">Covenants</p>
                                      {l.covenants.map((c,i) => (
                                        <div key={i} className={`text-xs ${c.includes("BREACHED")?"text-red-600":c.includes("AT RISK")?"text-amber-600":"text-foreground"}`}>{c}</div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                                <div className="flex gap-2 pt-1">
                                  <button className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[7px] border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors">
                                    <Table2 className="h-3 w-3" /> View amortization schedule
                                  </button>
                                  <button className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[7px] border border-primary/20 bg-primary/8 text-xs font-medium text-primary hover:bg-primary/15 transition-colors">
                                    <TrendingUp className="h-3 w-3" /> Generate AJEs
                                  </button>
                                </div>
                              </div>
                            );

                            case "continuity": return (
                              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                <p className="text-sm text-foreground">Long-term Debt continuity roll-forward for FY2025 (Jan 1 → Dec 31, 2025):</p>
                                <div className="rounded-[10px] border border-border overflow-hidden">
                                  <table className="w-full text-xs">
                                    <thead><tr className="bg-muted/60 border-b border-border">
                                      {["Loan","Opening","New Draws","Repayments","FX Adj.","Closing"].map(h=><th key={h} className={`px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide ${h==="Loan"?"text-left":"text-right"}`}>{h}</th>)}
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
                                      <tr className="bg-muted/40 font-semibold border-t border-border text-xs">
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
                                  <button className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[7px] border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors">
                                    <FileSpreadsheet className="h-3 w-3" /> Export continuity
                                  </button>
                                  <button className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[7px] border border-primary/20 bg-primary/8 text-xs font-medium text-primary hover:bg-primary/15 transition-colors">
                                    <RefreshCw className="h-3 w-3" /> Reconcile to TB
                                  </button>
                                </div>
                              </div>
                            );

                            default: return (
                              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                <p className="text-sm text-foreground leading-relaxed">
                                  Based on the Long-term Debt summary, here's my analysis for: <em>"{turn.userMsg}"</em>
                                </p>
                                <div className="rounded-[10px] bg-primary/5 border border-primary/15 px-3 py-2.5 text-xs text-foreground leading-relaxed">
                                  The current portfolio of 3 active loan facilities totalling <strong>$6.69M CAD</strong> shows 2 covenant issues requiring immediate attention. Net interest expense for FY2025 is estimated at <strong>$355,167</strong>. The Operating LOC matures in 10 months — renewal planning should begin in Q3.
                                </div>
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {["Show covenant details","Run maturity analysis","Export to Excel"].map(a=>(
                                    <button key={a} onClick={() => handleClarifyChoice(turn.id, a)} className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[7px] border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors">{a}</button>
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
                              <div className="max-w-[80%] px-4 py-3 rounded-[12px] bg-primary text-primary-foreground text-sm leading-relaxed">{turn.userMsg}</div>
                            </div>

                            {/* Luka response bubble */}
                            <div className="flex items-start gap-3 min-w-0 max-w-full">
                              <div className={cn("w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0", (isThinkingTurn || isWorking) && "luka-thinking-spin")}>
                                <LukaIcon size={16} />
                              </div>
                              <div className="flex-1 pt-1.5 min-w-0">
                                {isThinkingTurn && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-foreground luka-thinking-text">Analysing your question</span>
                                    <span className="flex gap-0.5">
                                      <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-1" />
                                      <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-2" />
                                      <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-3" />
                                    </span>
                                  </div>
                                )}

                                {isClarifying && (
                                  <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                    <p className="text-sm text-foreground">{cfg.question}</p>
                                    <div className="flex flex-wrap gap-2">
                                      {cfg.chips.map(chip => (
                                        <button
                                          key={chip}
                                          onClick={() => handleClarifyChoice(turn.id, chip)}
                                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-primary/25 bg-primary/6 text-xs font-medium text-primary hover:bg-primary/15 transition-colors"
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
                                        <p className="text-sm text-foreground">{cfg.question}</p>
                                        <div className="flex flex-wrap gap-2">
                                          {cfg.chips.map(chip => (
                                            <span
                                              key={chip}
                                              className={cn(
                                                "inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border text-xs font-medium transition-colors",
                                                chip === turn.clarifyChoice
                                                  ? "border-primary/40 bg-primary/10 text-primary"
                                                  : "border-border/40 bg-muted/30 text-muted-foreground"
                                              )}
                                            >
                                              {chip === turn.clarifyChoice && <Check className="h-3 w-3" />}
                                              {chip}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {isWorking && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-foreground luka-thinking-text">Working on it</span>
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

                {/* Chat input */}
                <div className={cn("pb-6 pt-2", viewMode === "full" ? "px-12" : "px-6")}>
                  <div className={cn("w-full mx-auto relative", viewMode === "full" ? "max-w-none" : "max-w-[700px]")}>
                    <PromptPicker open={showPromptPicker} filter={hashFilter} onSelect={handlePromptSelect} onClose={() => { setShowPromptPicker(false); setHashFilter(""); }} />
                    <div className="border border-border rounded-[12px] overflow-visible bg-background dark:bg-card hover:border-primary/30 transition-all duration-200 luka-gradient-border relative">
                      <AttachedFilesBar files={attachedFiles} onRemove={removeFile} onClearAll={clearFiles} />
                      <div className="px-4 pt-3 pb-2">
                        <input
                          ref={inputRef}
                          type="text"
                          value={message}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          placeholder={isFollowUpContext ? "Ask a follow-up question about this summary…" : "Type # for prompts or just ask anything..."}
                          className={cn("w-full bg-transparent h-9 placeholder:text-foreground outline-none border-none text-sm", message.includes("#") ? "text-primary font-medium" : "text-foreground")}
                        />
                      </div>
                      <div className="px-3 pb-3 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <LukaAttachMenu onFilesAdded={addFiles} />
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-[10px]"><Inbox className="h-4 w-4 text-foreground" /></Button>
                          <div className="flex items-center gap-1.5 px-3 h-9 rounded-[10px] border border-border bg-background dark:bg-muted/20 text-sm text-foreground">
                            <span className="text-amber-500">✨</span>
                            <span className="text-sm font-medium">Gemini 3 Flash</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-[10px]" onClick={() => setVoiceOpen(true)}>
                            <Mic className="h-4 w-4 text-foreground" />
                          </Button>
                          <Button
                            size="icon"
                            className={cn("h-9 w-9 rounded-full transition-all duration-200", message.trim() ? "bg-gradient-to-br from-[#8649F1] to-[#2355A4] hover:opacity-90 text-white shadow-md" : "bg-muted hover:bg-muted/80 text-foreground")}
                            onClick={handleSend}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <VoiceRecordingOverlay open={voiceOpen} onClose={() => setVoiceOpen(false)} onComplete={(text) => setMessage(prev => prev ? prev + " " + text : text)} />
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

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
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                      A few quick questions · Step {amortWizStep} of {amortSource === "manual" ? 2 : 3}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
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
                            <p className="text-sm font-medium text-foreground">{label}</p>
                            <p className="text-xs text-muted-foreground">{sub}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ── Step 2a: Existing document selection ── */}
                  {amortWizStep === 2 && amortSource === "existing" && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground mb-3">Select a document from your engagement workpapers:</p>
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
                            <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.path} · {doc.date} · {doc.size}</p>
                          </div>
                          {amortSelDocId === doc.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
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
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="font-medium">{amortUploadFile}</span>
                          <button onClick={e => { e.stopPropagation(); setAmortUploadFile(null); }} className="ml-1 hover:text-destructive transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground text-center">
                            <span className="text-primary font-medium">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">PDF only · max 2 MB</p>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── Step 2c: Drive file picker ── */}
                  {amortWizStep === 2 && amortSource === "drive" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <HardDrive className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-xs font-medium text-foreground">Google Drive</span>
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
                            <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                            <p className="text-xs text-muted-foreground">{f.folder} · {f.size}</p>
                          </div>
                          {amortDriveId === f.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
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
                      <p className="text-sm text-foreground leading-relaxed">Here's what I'll do — review and approve to continue.</p>
                      <div className="rounded-[10px] border border-border p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Question 1</p>
                          <button onClick={() => setAmortWizStep(1)} className="text-[10px] text-primary hover:underline">Edit</button>
                        </div>
                        <p className="text-xs text-foreground">How should I source the loan data?</p>
                        <span className="inline-flex items-center text-xs bg-muted text-foreground rounded-full px-2.5 py-0.5 font-medium">
                          {amortSource === "existing" && "Use an existing document"}
                          {amortSource === "upload"   && "Upload a new document"}
                          {amortSource === "drive"    && "Import from Google Drive"}
                        </span>
                      </div>
                      <div className="rounded-[10px] border border-border p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Question 2</p>
                          <button onClick={() => setAmortWizStep(2)} className="text-[10px] text-primary hover:underline">Edit</button>
                        </div>
                        <p className="text-xs text-foreground">
                          {amortSource === "existing" && "Selected document"}
                          {amortSource === "upload"   && "Uploaded document"}
                          {amortSource === "drive"    && "Selected from Google Drive"}
                        </p>
                        <span className="inline-flex items-center gap-1.5 text-xs bg-muted text-foreground rounded-full px-2.5 py-0.5 font-medium max-w-full">
                          {amortSource === "existing" && <><FileText className="h-3 w-3 shrink-0" /><span className="truncate">{AMORT_ENG_DOCS.find(d => d.id === amortSelDocId)?.name}</span></>}
                          {amortSource === "upload"   && <><FileText className="h-3 w-3 shrink-0" /><span className="truncate">{amortUploadFile ?? "No file"}</span></>}
                          {amortSource === "drive"    && <><HardDrive className="h-3 w-3 shrink-0" /><span className="truncate">{AMORT_DRIVE_FILES.find(f => f.id === amortDriveId)?.name}</span></>}
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
                          className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-[8px] bg-background hover:bg-muted transition-colors">
                          Back
                        </button>
                      ) : <div className="w-12" />}
                      <div className="flex items-center gap-1.5">
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
                        className="inline-flex items-center gap-1.5 h-8 px-4 text-xs font-medium bg-primary text-primary-foreground rounded-[8px] hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next <ChevronRight className="h-3.5 w-3.5" />
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
                        className="inline-flex items-center gap-1.5 h-8 px-4 text-xs font-medium bg-primary text-primary-foreground rounded-[8px] hover:bg-primary/90 transition-colors"
                      >
                        Approve &amp; continue <ChevronRight className="h-3.5 w-3.5" />
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
                <p className="text-sm text-foreground mt-1">Select from the below source connected engagements to add to your workspace.</p>
              </div>

              {/* Search + sort row */}
              <div className="px-6 pb-3 flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground" />
                  <input
                    value={newWsSearch}
                    onChange={e => setNewWsSearch(e.target.value)}
                    placeholder="Search clients"
                    className="w-full pl-9 pr-3 py-2 rounded-[8px] border border-border bg-background text-sm placeholder:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-colors"
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
                          {selected && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                        {/* Icon */}
                        <div className="w-8 h-8 rounded-[8px] bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        {/* Name + ref */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
                          <p className="text-xs text-foreground truncate">{client.ref}</p>
                        </div>
                        {/* Source badge */}
                        <div className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] border text-xs font-medium shrink-0",
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
                  className="flex-1 py-2.5 rounded-[8px] border border-border text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
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
                  className="flex-1 py-2.5 rounded-[8px] bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Create{newWsSelected.length > 0 ? ` (${newWsSelected.length})` : ""}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
