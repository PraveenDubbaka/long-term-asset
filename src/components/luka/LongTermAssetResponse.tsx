import { useMemo, useState, useLayoutEffect, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  AlertTriangle, Calendar, DollarSign, BarChart2,
  ChevronDown, ChevronUp, FileSpreadsheet, Plus, CheckCircle2,
  ShieldAlert, ShieldCheck, Activity, CreditCard,
  Building2, FileText, BookOpen, Receipt, Layers, FileCheck, Send, TrendingUp,
  Download, Copy, RotateCcw, X, Trash2, Search, Check, Pencil, Folder,
  Upload, Loader2, Maximize2, Minimize2,
} from "lucide-react";
import { COVENANT_TEMPLATES, GL_ACCOUNTS, GL_CATEGORY_ORDER, GL_CATEGORY_LABELS } from "@/lib/covenantTemplates";
import type { GlCategory } from "@/lib/covenantTemplates";
import { useStore } from "@/store/useStore";
import toast from "react-hot-toast";
import type { Loan, ContinuityRow, AmortizationRow, Covenant, CovenantFormulaLine, JEProposal, ReconciliationItem, EngagementSettings, AccountMapping } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────
const USD_FX = 1.353;
const toCAD = (n: number, ccy: string) => ccy === "USD" ? n * USD_FX : ccy === "EUR" ? n * 1.472 : n;

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtNum = (n: number) =>
  n === 0 ? "00" : n.toLocaleString("en-CA", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtParen = (n: number) => n === 0 ? "00" : `(${fmtNum(n)})`;

const fmtDate = (d: string) => {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-CA", { month: "short", day: "2-digit", year: "numeric" });
};

const daysUntil = (d: string) =>
  Math.round((new Date(d + "T00:00:00").getTime() - Date.now()) / 86400000);

// ─── GL Account picker for covenant formula lines ────────────────────────────
function CovAccountSelect({ value, onChange }: {
  value: string;
  onChange: (code: string, name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropPos, setDropPos] = useState<{ top: number; left: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef  = useRef<HTMLButtonElement>(null);

  const openDropdown = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 4, left: r.left });
    setOpen(true);
  };
  const closeDropdown = () => { setOpen(false); setSearch(''); setDropPos(null); };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) closeDropdown();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = GL_ACCOUNTS.find(a => a.code === value);
  const filteredGroups = (GL_CATEGORY_ORDER as GlCategory[]).map(cat => ({
    cat,
    catLabel: GL_CATEGORY_LABELS[cat],
    accounts: GL_ACCOUNTS.filter(a => a.category === cat && (
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase())
    )),
  })).filter(g => g.accounts.length > 0);

  return (
    <div ref={wrapRef} className="relative flex-1 min-w-0">
      <button
        ref={btnRef}
        type="button"
        onClick={() => open ? closeDropdown() : openDropdown()}
        className="w-full h-7 pl-2 pr-6 relative text-left border border-border rounded-[6px] bg-background hover:border-primary/50 focus:outline-none transition-colors flex items-center min-w-0 text-sm"
      >
        <span className={`truncate text-sm ${!selected ? 'text-muted-foreground' : 'text-foreground'}`}>
          {selected?.name ?? '— Select account —'}
        </span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground absolute right-1.5 top-1/2 -translate-y-1/2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && dropPos && ReactDOM.createPortal(
        <div
          className="fixed z-[400] w-72 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden"
          style={{ top: dropPos.top, left: dropPos.left }}
        >
          <div className="px-2 pt-2 pb-1.5 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              <input
                autoFocus
                type="text"
                placeholder="Search accounts…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-7 pl-6 pr-2 border border-[#dcdfe4] rounded-[6px] bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto py-0.5">
            {filteredGroups.map(({ cat, catLabel, accounts }) => (
              <div key={cat}>
                <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40 sticky top-0 select-none">
                  {catLabel}
                </div>
                {accounts.map(a => (
                  <button
                    key={a.code}
                    type="button"
                    onClick={() => { onChange(a.code, a.name); closeDropdown(); }}
                    className={`w-full text-left px-3 py-1.5 flex items-center gap-2 text-sm transition-colors ${
                      a.code === value ? 'bg-primary/[0.06] text-primary font-medium' : 'text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0 w-10">{a.code}</span>
                    <span className="truncate flex-1">{a.name}</span>
                    {a.code === value && <Check className="w-3 h-3 shrink-0 text-primary" />}
                  </button>
                ))}
              </div>
            ))}
            {filteredGroups.length === 0 && (
              <p className="px-3 py-3 text-muted-foreground text-sm text-center">No accounts found</p>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Small badge helpers ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    // Loan statuses
    Active:      "bg-green-50 text-green-700 border-green-200",
    Inactive:    "bg-muted text-muted-foreground border-border opacity-60",
    Closed:      "bg-muted text-muted-foreground border-border",
    Replaced:    "bg-blue-50 text-blue-700 border-blue-200",
    Refinanced:  "bg-amber-50 text-amber-700 border-amber-200",
    // Covenant / compliance statuses
    Breached:    "bg-red-50 text-red-700 border-red-200",
    "At Risk":   "bg-amber-50 text-amber-700 border-amber-200",
    OK:          "bg-green-50 text-green-700 border-green-200",
    // JE statuses
    Draft:       "bg-muted text-muted-foreground border-border",
    Approved:    "bg-blue-50 text-blue-700 border-blue-200",
    Posted:      "bg-green-50 text-green-700 border-green-200",
    Exported:    "bg-purple-50 text-purple-700 border-purple-200",
  };
  const cls = map[status] ?? "bg-muted text-muted-foreground border-border";
  const icon =
    status === "Active"   ? <CheckCircle2  className="h-2.5 w-2.5" /> :
    status === "Breached" ? <AlertTriangle className="h-2.5 w-2.5" /> :
    status === "At Risk"  ? <AlertTriangle className="h-2.5 w-2.5" /> :
    status === "OK"       ? <CheckCircle2  className="h-2.5 w-2.5" /> :
    status === "Approved" ? <CheckCircle2  className="h-2.5 w-2.5" /> :
    status === "Posted"   ? <CheckCircle2  className="h-2.5 w-2.5" /> : null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${cls}`}>
      {icon}{status}
    </span>
  );
}

function MaturityChip({ dateStr }: { dateStr: string }) {
  const days = daysUntil(dateStr);
  if (days < 0)   return <span className="text-[10px] text-muted-foreground">Matured</span>;
  if (days <= 90)  return <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-red-50 text-red-700 border border-red-200"><Calendar className="h-2.5 w-2.5" />{days}d</span>;
  if (days <= 365) return <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-amber-50 text-amber-700 border border-amber-200"><Calendar className="h-2.5 w-2.5" />{Math.round(days/30)}mo</span>;
  return <span className="text-[10px] text-muted-foreground">{fmtDate(dateStr)}</span>;
}

// ─── GL combobox (matches LoansTab edit style) ───────────────────────────────

function GLSelect({ loanId, value, options, field, onSave }: {
  loanId: string;
  value: string;
  options: AccountMapping[];
  field: "glPrincipalAccount" | "glAccruedInterestAccount" | "glInterestExpenseAccount";
  onSave: (id: string, field: string, code: string) => void;
}) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState("");
  const [typed, setTyped] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef  = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const selected     = options.find(o => o.code === value);
  const displayLabel = selected ? `${selected.code} — ${selected.name}` : (value || "—");

  useEffect(() => { if (!typed) setQuery(displayLabel); }, [value, typed, displayLabel]);

  const openDrop = () => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 2, left: r.left, width: Math.max(r.width, 240) });
    }
    setQuery("");
    setTyped(false);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!inputRef.current?.contains(e.target as Node) && !dropRef.current?.contains(e.target as Node)) {
        setOpen(false); setTyped(false); setQuery(displayLabel);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, displayLabel]);

  const q        = query.toLowerCase();
  const filtered = typed
    ? options.filter(o => o.code.toLowerCase().includes(q) || o.name.toLowerCase().includes(q))
    : options;

  return (
    <>
      <input
        ref={inputRef}
        value={open ? query : displayLabel}
        placeholder="Search GL…"
        onChange={e => { setQuery(e.target.value); setTyped(true); }}
        onFocus={openDrop}
        onClick={e => { e.stopPropagation(); openDrop(); }}
        className="h-7 w-full min-w-[120px] px-2 text-[11px] font-mono border border-[#dcdfe4] rounded-[8px] bg-white text-foreground placeholder:text-muted-foreground transition-all duration-200 hover:border-[hsl(210_25%_75%)] focus:outline-none focus:ring-1 focus:ring-primary/30 dark:bg-card dark:border-[hsl(220_15%_30%)] cursor-pointer"
      />
      {open && filtered.length > 0 && ReactDOM.createPortal(
        <div
          ref={dropRef}
          style={{ position: "fixed", top: pos.top, left: pos.left, width: Math.max(pos.width, 260), zIndex: 9999 }}
          className="bg-background border border-border rounded-[8px] shadow-lg py-1 max-h-52 overflow-y-auto"
        >
          {filtered.map(o => (
            <div
              key={o.code}
              className={`px-3 py-1.5 text-xs cursor-pointer font-mono ${o.code === value ? "bg-primary/10 font-semibold text-primary" : "text-foreground hover:bg-muted"}`}
              onMouseDown={e => {
                e.preventDefault();
                onSave(loanId, field, o.code);
                toast.success("GL mapping saved");
                setOpen(false); setTyped(false); setQuery(`${o.code} — ${o.name}`);
              }}
            >
              <span className="font-semibold">{o.code}</span>
              <span className="text-muted-foreground ml-1.5">— {o.name}</span>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

// ─── Maturity ladder helper (mirrors ContinuityTab.tsx) ──────────────────────
function calcMaturityLadder(
  loan: Loan, closingBalance: number, period: string,
): [number, number, number, number, number, number, number] {
  if (closingBalance <= 0) return [0, 0, 0, 0, 0, 0, 0];
  if (loan.type === "LOC" || loan.type === "Revolver") return [closingBalance, 0, 0, 0, 0, 0, 0];
  const [y, m] = period.split("-").map(Number);
  const maturity = new Date(loan.maturityDate);
  const monthsToMaturity = Math.max(0,
    (maturity.getFullYear() - y) * 12 + (maturity.getMonth() + 1 - m));
  if (monthsToMaturity <= 0) return [closingBalance, 0, 0, 0, 0, 0, 0];
  const result: [number, number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0, 0];
  if (loan.paymentType === "Interest-only" || loan.paymentType === "Balloon") {
    result[Math.min(Math.floor((monthsToMaturity - 1) / 12), 6)] = closingBalance;
    return result;
  }
  const r = loan.rate / 100 / 12;
  const n = monthsToMaturity;
  let bal = closingBalance;
  if (r === 0) {
    const mp = bal / n;
    for (let i = 1; i <= n; i++) result[Math.min(Math.floor((i - 1) / 12), 6)] += mp;
  } else {
    const pmt = bal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    for (let i = 1; i <= n && bal > 0.01; i++) {
      const interest = bal * r;
      const principal = Math.min(pmt - interest, bal);
      result[Math.min(Math.floor((i - 1) / 12), 6)] += principal;
      bal -= principal;
    }
  }
  return result.map(Math.round) as [number, number, number, number, number, number, number];
}

// ─── Per-tab components ───────────────────────────────────────────────────────

const EMPTY_LOAN_DRAFT = (): Partial<Loan> => ({
  name: "", lender: "", refNumber: "", type: "Term",
  currency: "CAD", interestType: "Fixed", rate: 0,
  originalPrincipal: 0, currentBalance: 0,
  startDate: "", maturityDate: "", firstPaymentDate: "",
  paymentFrequency: "Monthly", paymentType: "P&I",
  dayCountBasis: "ACT/365", status: "Active",
  securityDescription: "",
  glPrincipalAccount: "", glAccruedInterestAccount: "", glInterestExpenseAccount: "",
  covenantIds: [], currentPortion: 0, longTermPortion: 0, accruedInterest: 0, attachments: [],
});

// ─── Multi-loan upload / duplicate-detection types ───────────────────────────
type DuplicateAction = "overwrite" | "skip" | "keep-both";

interface DetectedLoan {
  id: string; sourceFile: string;
  name: string; lender: string; type: string;
  currency: "CAD" | "USD" | "EUR" | "GBP";
  interestType: string; rate: number;
  originalPrincipal: number; currentBalance: number;
  startDate: string; maturityDate: string;
  firstPaymentDate: string; paymentFrequency: string;
  paymentType: string; dayCountBasis: string;
  securityDescription: string;
  isDuplicate: boolean; duplicateId?: string;
  duplicateAction: DuplicateAction; selected: boolean;
}

function generateMockDetectedLoans(fileNames: string[]): DetectedLoan[] {
  const now = Date.now();
  const n0 = fileNames[0]?.toLowerCase() ?? "";
  const result: DetectedLoan[] = [
    {
      id: `dl-${now}-0`, sourceFile: fileNames[0],
      name: "Term Loan A", lender: "Royal Bank of Canada",
      type: "Term", currency: "CAD", interestType: "Fixed",
      rate: 5.25, originalPrincipal: 3750000, currentBalance: 3485200,
      startDate: "2022-01-15", maturityDate: "2027-01-15", firstPaymentDate: "2022-02-15",
      paymentFrequency: "Monthly", paymentType: "P&I", dayCountBasis: "ACT/365",
      securityDescription: "General Security Agreement over all assets of the borrower",
      isDuplicate: false, duplicateAction: "skip", selected: true,
    },
    {
      id: `dl-${now}-1`, sourceFile: fileNames[0],
      name: n0.includes("revolver") ? "Revolving Credit Facility" : "Term Loan B",
      lender: n0.includes("td") ? "TD Bank" : n0.includes("bmo") ? "BMO Bank of Montreal" : "CIBC",
      type: n0.includes("revolver") ? "Revolver" : "Term",
      currency: "CAD", interestType: "Fixed",
      rate: 6.25, originalPrincipal: 2500000, currentBalance: 2500000,
      startDate: "2024-03-15", maturityDate: "2029-03-15", firstPaymentDate: "2024-04-15",
      paymentFrequency: "Monthly", paymentType: "P&I", dayCountBasis: "ACT/365",
      securityDescription: "General Security Agreement over all present and after-acquired property",
      isDuplicate: false, duplicateAction: "skip", selected: true,
    },
  ];
  if (fileNames.length > 1) {
    result.push({
      id: `dl-${now}-2`, sourceFile: fileNames[1],
      name: "Mortgage — Commercial Property", lender: "First National Financial",
      type: "Mortgage", currency: "CAD", interestType: "Fixed",
      rate: 5.89, originalPrincipal: 4200000, currentBalance: 4200000,
      startDate: "2024-06-01", maturityDate: "2029-06-01", firstPaymentDate: "2024-07-01",
      paymentFrequency: "Monthly", paymentType: "P&I", dayCountBasis: "ACT/365",
      securityDescription: "First charge mortgage over commercial property at 123 Business Way",
      isDuplicate: false, duplicateAction: "skip", selected: true,
    });
  }
  return result;
}

function LoansTab({ loans }: { loans: Loan[] }) {
  const { accountMappings, reconciliation, updateLoan, addLoan } = useStore(s => ({
    accountMappings: s.accountMappings,
    reconciliation:  s.reconciliation,
    updateLoan:      s.updateLoan,
    addLoan:         s.addLoan,
  }));

  const [newLoanOpen,  setNewLoanOpen]  = useState(false);
  const [newLoan,      setNewLoan]      = useState<Partial<Loan>>(EMPTY_LOAN_DRAFT);
  const [panelRect,    setPanelRect]    = useState<{ left: number; right: number; bottom: number } | null>(null);

  // Upload-mode state for Add New Loan panel
  const [newLoanMode,     setNewLoanMode]     = useState<"manual" | "upload" | "review">("manual");
  const [uploadLoanState, setUploadLoanState] = useState<"idle" | "extracting">("idle");
  const [uploadLoanFile,  setUploadLoanFile]  = useState<string | null>(null);
  const [uploadDragging,  setUploadDragging]  = useState(false);
  const [detectedLoans,   setDetectedLoans]   = useState<DetectedLoan[]>([]);
  const uploadFileRef = useRef<HTMLInputElement>(null);
  const [tableExpanded,   setTableExpanded]   = useState(false);

  const closeNewLoanPanel = () => {
    setNewLoanOpen(false);
    setNewLoan(EMPTY_LOAN_DRAFT());
    setNewLoanMode("manual");
    setUploadLoanState("idle");
    setUploadLoanFile(null);
    setDetectedLoans([]);
  };

  const handleUploadLoanFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const valid: File[] = [];
    Array.from(fileList).forEach(f => {
      const ext = (f.name.split(".").pop() ?? "").toLowerCase();
      if (!["pdf", "xlsx", "xls"].includes(ext)) {
        toast.error(`"${f.name}" skipped — only PDF or Excel accepted`);
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`"${f.name}" skipped — must be under 5 MB`);
        return;
      }
      valid.push(f);
    });
    if (valid.length === 0) return;
    const label = valid.length === 1
      ? valid[0].name
      : `${valid[0].name} +${valid.length - 1} more`;
    setUploadLoanFile(label);
    setUploadLoanState("extracting");
    toast.success(`${valid.length} file${valid.length !== 1 ? "s" : ""} uploaded — extracting loan details…`);
    setTimeout(() => {
      const fileNames = valid.map(f => f.name);
      const mock = generateMockDetectedLoans(fileNames);
      const withDupes = mock.map(dl => {
        const existing = loans.find(l => l.name.toLowerCase() === dl.name.toLowerCase());
        return { ...dl, isDuplicate: !!existing, duplicateId: existing?.id };
      });
      setDetectedLoans(withDupes);
      setUploadLoanState("idle");
      setUploadLoanFile(null);
      setNewLoanMode("review");
      const dc = withDupes.filter(dl => dl.isDuplicate).length;
      toast.success(
        `${withDupes.length} loan${withDupes.length !== 1 ? "s" : ""} detected` +
        (dc > 0 ? ` · ${dc} duplicate${dc !== 1 ? "s" : ""} flagged — choose an action` : "")
      );
    }, 2000);
  };

  const handleImportDetected = () => {
    const toImport = detectedLoans.filter(dl => dl.selected && !(dl.isDuplicate && dl.duplicateAction === "skip"));
    if (toImport.length === 0) { toast.error("No loans selected for import — un-skip at least one loan"); return; }
    toImport.forEach((dl, i) => {
      const isOverwrite = dl.isDuplicate && dl.duplicateAction === "overwrite" && !!dl.duplicateId;
      const loan: Loan = {
        ...(EMPTY_LOAN_DRAFT() as Loan),
        id: isOverwrite ? dl.duplicateId! : `loan-${Date.now()}-${i}`,
        name: dl.duplicateAction === "keep-both" ? `${dl.name} (Imported)` : dl.name,
        lender: dl.lender,
        type: dl.type as Loan["type"],
        currency: dl.currency as Loan["currency"],
        interestType: dl.interestType as Loan["interestType"],
        rate: dl.rate,
        originalPrincipal: dl.originalPrincipal,
        currentBalance: dl.currentBalance,
        startDate: dl.startDate, maturityDate: dl.maturityDate,
        firstPaymentDate: dl.firstPaymentDate,
        paymentFrequency: dl.paymentFrequency as Loan["paymentFrequency"],
        paymentType: dl.paymentType as Loan["paymentType"],
        dayCountBasis: dl.dayCountBasis as Loan["dayCountBasis"],
        securityDescription: dl.securityDescription,
        status: "Active", refNumber: `REF-${Date.now()}-${i}`,
      };
      if (isOverwrite) { updateLoan(dl.duplicateId!, loan); }
      else             { addLoan(loan); }
    });
    const skipped = detectedLoans.length - toImport.length;
    toast.success(
      `${toImport.length} loan${toImport.length !== 1 ? "s" : ""} imported — generating amortization schedules…` +
      (skipped > 0 ? ` (${skipped} skipped)` : "")
    );
    closeNewLoanPanel();
  };

  useLayoutEffect(() => {
    if (!newLoanOpen) { setPanelRect(null); return; }
    const measure = () => {
      const inputBox = document.querySelector<HTMLElement>(".luka-gradient-border");
      if (!inputBox) return;
      const r = inputBox.getBoundingClientRect();
      setPanelRect({ left: r.left, right: window.innerWidth - r.right, bottom: window.innerHeight - r.top + 5 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [newLoanOpen]);

  const setF = (k: keyof Loan, v: unknown) => setNewLoan(p => ({ ...p, [k]: v }));

  const handleSaveLoan = () => {
    if (!newLoan.name?.trim() || !newLoan.lender?.trim()) {
      toast.error("Loan name and lender are required");
      return;
    }
    const loan: Loan = {
      ...(EMPTY_LOAN_DRAFT() as Loan),
      ...newLoan,
      id: `loan-${Date.now()}`,
      refNumber: newLoan.refNumber || `REF-${Date.now()}`,
    } as Loan;
    addLoan(loan);
    toast.success("Loan added — generating amortization schedule…");
    closeNewLoanPanel();
  };

  const principalAccts = accountMappings.filter(a => a.type === "Principal");
  const handleGLSave   = (id: string, field: string, code: string) =>
    updateLoan(id, { [field]: code } as Partial<Loan>);

  // Monthly payment: manual override → PMT formula
  const calcMonthlyPmt = (l: Loan): number | null => {
    if (l.monthlyPayment != null && l.monthlyPayment > 0) return l.monthlyPayment;
    if (!l.currentBalance || l.currentBalance <= 0) return null;
    const r = l.rate / 100 / 12;
    if (l.paymentType === "Interest-only" || l.paymentType === "Balloon") return l.currentBalance * r;
    const months = Math.max(1, Math.round((new Date(l.maturityDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44)));
    if (r === 0) return l.currentBalance / months;
    return l.currentBalance * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  };

  const getFxRate = (l: Loan) => l.currency === "CAD" ? 1 : (l.fxRateToCAD ?? 1);

  // Tenure: explicit or derived from start/maturity dates
  const getTenure = (l: Loan): string => {
    if (l.tenureMonths) return String(l.tenureMonths);
    if (l.startDate && l.maturityDate)
      return String(Math.round((new Date(l.maturityDate).getTime() - new Date(l.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
    return "—";
  };

  // GL Account Summary
  const glGroups = useMemo(() => {
    const map = new Map<string, { loans: Loan[]; bal: number; glBal: number }>();
    loans.forEach(l => {
      const acct = l.glPrincipalAccount || "(untagged)";
      if (!map.has(acct)) map.set(acct, { loans: [], bal: 0, glBal: 0 });
      const g = map.get(acct)!;
      g.loans.push(l);
      g.bal  += toCAD(l.currentBalance, l.currency);
      const recon = reconciliation.find(r => r.loanId === l.id && r.accountType === "Principal");
      g.glBal += toCAD(recon?.tbBalance ?? 0, l.currency);
    });
    return Array.from(map.entries());
  }, [loans, reconciliation]);
  const glGrandBal = glGroups.reduce((s,[,g])=>s+g.bal,0);
  const glGrandGL  = glGroups.reduce((s,[,g])=>s+g.glBal,0);
  const glBalanced = Math.abs(glGrandGL - glGrandBal) < 1;

  const HEADERS = [
    { h: "Loan Name",          left: true  },
    { h: "Lender",             left: true  },
    { h: "Current Collateral", left: true  },
    { h: "Type",               left: false },
    { h: "Rate Type",          left: false },
    { h: "Int. Rate (%)",      left: false },
    { h: "Start",              left: false },
    { h: "Maturity",           left: false },
    { h: "Tenure (Mo.)",       left: false },
    { h: "First Payment",      left: false },
    { h: "CCY",                left: false },
    { h: "Mo. Payment",        left: false },
    { h: "Orig. Loan Amt",     left: false },
    { h: "FX Rate",            left: false },
    { h: "Converted Amt",      left: false },
    { h: "Closing Balance",    left: false },
    { h: "GL Principal",       left: false },
    { h: "Day Count",          left: false },
    { h: "Payment Type",       left: false },
    { h: "Compounding",        left: false },
    { h: "IO Period (mo.)",    left: false },
    { h: "Balloon Amt",        left: false },
    { h: "Status",             left: false },
  ];
  // compact = narrower table (text cols constrained), expanded = full width; both scroll
  const fit = !tableExpanded;

  return (
    <div className="space-y-3">
      <div className="rounded-[8px] border border-border overflow-hidden">
        <div className="px-3 py-2 bg-muted/40 border-b border-border flex items-center justify-between">
          <span className="text-[11px] font-semibold text-foreground">Loan Register</span>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground">Manage facilities, terms, and GL mappings</span>
            <button
              onClick={() => setTableExpanded(v => !v)}
              title={tableExpanded ? "Fit to screen (compact)" : "Expand all columns"}
              className="inline-flex items-center justify-center h-7 w-7 rounded-[7px] border border-border bg-background hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              {tableExpanded
                ? <Minimize2 className="h-3.5 w-3.5" />
                : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => { setNewLoan(EMPTY_LOAN_DRAFT()); setNewLoanOpen(true); }}
              className="inline-flex items-center gap-1 h-7 px-2.5 text-[11px] font-medium bg-primary text-primary-foreground rounded-[7px] hover:bg-primary/90 transition-colors shrink-0"
            >
              <Plus className="h-3 w-3" /> New Loan
            </button>
          </div>
        </div>
        {/* Both modes scroll — compact uses narrower text cols; numbers always fully visible */}
        <div className="overflow-x-auto">
          <table
            className="text-[11px]"
            style={{ minWidth: fit ? "1400px" : "1900px" }}
          >
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {HEADERS.map(({ h, left }) => (
                  <th
                    key={h}
                    className={`px-2.5 py-2 font-semibold text-muted-foreground uppercase tracking-wide text-[10px] whitespace-nowrap ${left ? "text-left" : "text-right"}`}
                  >{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loans.map((l, i) => {
                const fx         = getFxRate(l);
                const pmt        = calcMonthlyPmt(l);
                const pmtCAD     = pmt !== null ? pmt * fx : null;
                const convAmt    = l.originalPrincipal * fx;
                const closingCAD = (l.closingBalance ?? l.currentBalance) * fx;
                return (
                  <tr key={l.id} className="border-b border-border transition-colors hover:bg-muted/30 cursor-pointer">
                    {/* Loan Name — text constrained in compact */}
                    <td className="px-2.5 py-1.5">
                      <div className={fit ? "max-w-[110px] truncate font-medium text-foreground" : "font-medium text-foreground whitespace-nowrap min-w-[140px]"} title={l.name}>
                        {l.name}
                      </div>
                    </td>
                    {/* Lender — text constrained in compact */}
                    <td className="px-2.5 py-1.5 text-foreground">
                      <div className={fit ? "max-w-[95px] truncate" : "whitespace-nowrap min-w-[130px]"} title={l.lender}>
                        {l.lender}
                      </div>
                    </td>
                    {/* Current Collateral — text constrained in compact */}
                    <td className="px-2.5 py-1.5 text-foreground" title={l.securityDescription ?? "—"}>
                      <div className={`text-[10px] ${fit ? "max-w-[80px] truncate" : "max-w-[140px] line-clamp-2"}`}>
                        {l.securityDescription ?? "—"}
                      </div>
                    </td>
                    {/* Type */}
                    <td className="px-2.5 py-1.5 text-right">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-foreground border border-border whitespace-nowrap">{l.type}</span>
                    </td>
                    {/* Rate Type */}
                    <td className="px-2.5 py-1.5 text-right">
                      {l.interestType === "Variable"  && <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">Variable</span>}
                      {l.interestType === "Floating"  && <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap">Floating</span>}
                      {l.interestType === "Hybrid"    && <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">Hybrid</span>}
                      {l.interestType === "Step Rate" && <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 whitespace-nowrap">Step Rate</span>}
                      {(l.interestType === "Fixed" || (l.interestType !== "Variable" && l.interestType !== "Floating" && l.interestType !== "Hybrid" && l.interestType !== "Step Rate")) && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-foreground border border-border whitespace-nowrap">{l.interestType ?? "Fixed"}</span>
                      )}
                    </td>
                    {/* Int. Rate — number, never truncate */}
                    <td className="px-2.5 py-1.5 text-right tabular-nums font-medium whitespace-nowrap">{l.rate.toFixed(2)}%</td>
                    {/* Start */}
                    <td className="px-2.5 py-1.5 text-right whitespace-nowrap text-foreground">{fmtDate(l.startDate)}</td>
                    {/* Maturity */}
                    <td className="px-2.5 py-1.5 text-right whitespace-nowrap text-foreground">{fmtDate(l.maturityDate)}</td>
                    {/* Tenure */}
                    <td className="px-2.5 py-1.5 text-right tabular-nums whitespace-nowrap text-foreground">{getTenure(l)}</td>
                    {/* First Payment */}
                    <td className="px-2.5 py-1.5 text-right whitespace-nowrap text-foreground">
                      {l.firstPaymentDate ? fmtDate(l.firstPaymentDate) : "—"}
                    </td>
                    {/* CCY */}
                    <td className="px-2.5 py-1.5 text-right">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-foreground border border-border whitespace-nowrap">{l.currency}</span>
                    </td>
                    {/* Mo. Payment */}
                    <td className="px-2.5 py-1.5 text-right tabular-nums whitespace-nowrap">
                      {pmtCAD !== null
                        ? <span className="font-mono text-foreground">{fmt(pmtCAD)}{!l.monthlyPayment && <span className="text-muted-foreground text-[9px] ml-0.5" title="Auto-calculated">~</span>}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    {/* Orig. Loan Amt */}
                    <td className="px-2.5 py-1.5 text-right tabular-nums whitespace-nowrap text-foreground">{fmt(l.originalPrincipal)}</td>
                    {/* FX Rate */}
                    <td className="px-2.5 py-1.5 text-right">
                      {l.currency === "CAD"
                        ? <span className="text-muted-foreground whitespace-nowrap">—</span>
                        : <div className="flex flex-col items-end gap-0.5">
                            <span className="font-mono text-[10px] text-foreground tabular-nums whitespace-nowrap">{fx.toFixed(4)}</span>
                            {!fit && <span className="text-[9px] text-muted-foreground">{l.fxRateType ?? "Closing"}</span>}
                          </div>}
                    </td>
                    {/* Converted Amt */}
                    <td className="px-2.5 py-1.5 text-right tabular-nums font-semibold whitespace-nowrap text-foreground">{fmt(convAmt)}</td>
                    {/* Closing Balance */}
                    <td className="px-2.5 py-1.5 text-right tabular-nums font-semibold whitespace-nowrap text-foreground">{fmt(closingCAD)}</td>
                    {/* GL Principal */}
                    <td className="px-2.5 py-1.5 text-right">
                      <GLSelect loanId={l.id} value={l.glPrincipalAccount} options={principalAccts} field="glPrincipalAccount" onSave={handleGLSave} />
                    </td>
                    {/* Day Count */}
                    <td className="px-2.5 py-1.5 text-right font-mono whitespace-nowrap text-foreground">{l.dayCountBasis}</td>
                    {/* Payment Type */}
                    <td className="px-2.5 py-1.5 text-right whitespace-nowrap text-foreground">{l.paymentType}</td>
                    {/* Compounding */}
                    <td className="px-2.5 py-1.5 text-right whitespace-nowrap text-foreground">{l.compoundingFrequency ?? "Monthly"}</td>
                    {/* IO Period */}
                    <td className="px-2.5 py-1.5 text-right tabular-nums whitespace-nowrap text-foreground">{l.interestOnlyPeriodMonths ?? "—"}</td>
                    {/* Balloon Amt */}
                    <td className="px-2.5 py-1.5 text-right tabular-nums whitespace-nowrap text-foreground">
                      {l.balloonAmount ? fmt(l.balloonAmount) : "—"}
                    </td>
                    {/* Status */}
                    <td className="px-2.5 py-1.5 text-right"><StatusBadge status={l.status} /></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 z-10">
              {/* 23 cols: Name(1)…MoPmt(12) | OrigAmt(13) | FX(14) | ConvAmt(15) | Closing(16) | GL…Status×7 */}
              <tr className="bg-muted/50 border-t-2 border-border font-semibold">
                <td className="px-2.5 py-2" colSpan={12} />
                <td className="px-2.5 py-2 text-right tabular-nums text-[11px] font-bold text-foreground whitespace-nowrap">{fmt(loans.reduce((s,l)=>s+l.originalPrincipal,0))}</td>
                <td className="px-2.5 py-2" />
                <td className="px-2.5 py-2 text-right tabular-nums text-[11px] font-bold text-foreground whitespace-nowrap">{fmt(loans.reduce((s,l)=>s+l.originalPrincipal*getFxRate(l),0))}</td>
                <td className="px-2.5 py-2 text-right tabular-nums text-[11px] font-bold text-foreground whitespace-nowrap">{fmt(loans.reduce((s,l)=>s+toCAD(l.closingBalance??l.currentBalance,l.currency),0))}</td>
                <td colSpan={7} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* GL Account Summary */}
      <div className="rounded-[8px] border border-border overflow-hidden">
        <div className="px-3 py-2 bg-muted/40 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-foreground">GL Account Summary</span>
            <span className="text-[10px] text-muted-foreground">— principal balance by account · CAD equiv. (USD × 1.353)</span>
          </div>
        </div>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-muted/20 border-b border-border">
              {["GL Account","Facilities","Original (CAD)","Balance (CAD)","Balance As Per GL"].map(h=>(
                <th key={h} className={`px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide ${h==="GL Account"?"text-left":"text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {glGroups.map(([acct, g], i) => {
              const origBal = g.loans.reduce((s,l)=>s+toCAD(l.originalPrincipal,l.currency),0);
              const diff = Math.abs(g.glBal - g.bal);
              return (
                <tr key={acct} className={`border-b border-border/40 ${i%2===0?"":"bg-muted/10"}`}>
                  <td className="px-3 py-1.5 font-mono text-primary font-medium">{acct}</td>
                  <td className="px-3 py-1.5 text-right">{g.loans.length}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">{fmt(origBal)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums font-medium">{fmt(g.bal)}</td>
                  <td className={`px-3 py-1.5 text-right tabular-nums font-medium ${diff > 1 ? "text-red-600" : "text-green-700"}`}>
                    {g.glBal > 0 ? fmt(g.glBal) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-muted/30 font-semibold">
              <td className="px-3 py-1.5 text-[11px] text-foreground">Total</td>
              <td className="px-3 py-1.5 text-right text-[11px]">{loans.length}</td>
              <td className="px-3 py-1.5 text-right tabular-nums text-[11px] text-muted-foreground">{fmt(loans.reduce((s,l)=>s+toCAD(l.originalPrincipal,l.currency),0))}</td>
              <td className="px-3 py-1.5 text-right tabular-nums text-[11px]">{fmt(glGrandBal)}</td>
              <td className={`px-3 py-1.5 text-right tabular-nums text-[11px] ${glBalanced?"text-green-700":"text-red-600"}`}>{fmt(glGrandGL)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Add New Loan slide-up panel ── */}
      {newLoanOpen && (() => {
        const LF = "h-8 w-full text-sm px-2.5 border border-border rounded-[8px] bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40";
        const isFormReady = !!(newLoan.name?.trim() && newLoan.lender?.trim());
        const importCount = detectedLoans.filter(dl => dl.selected && !(dl.isDuplicate && dl.duplicateAction === "skip")).length;
        const dupeCount   = detectedLoans.filter(dl => dl.isDuplicate).length;
        return (
          <>
            <div className="fixed inset-0 z-[59]" onClick={closeNewLoanPanel} />
            <div
              className="fixed z-[60] pointer-events-none"
              style={panelRect
                ? { left: panelRect.left, right: panelRect.right, bottom: panelRect.bottom }
                : { left: 24, right: 24, bottom: 124 }}
            >
              <div className="w-full pointer-events-auto bg-background border border-border rounded-[12px] shadow-[0_2px_16px_rgba(0,0,0,0.09)] animate-in slide-in-from-bottom-4 fade-in duration-200 max-h-[62vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">Add New Loan</span>
                    {/* Mode tabs */}
                    <div className="flex items-center gap-0.5 bg-muted/60 rounded-[8px] p-0.5">
                      <button
                        onClick={() => setNewLoanMode("manual")}
                        className={`h-6 px-2.5 text-xs font-medium rounded-[6px] transition-colors ${newLoanMode === "manual" ? "bg-background border border-border/60 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        Manual Entry
                      </button>
                      <button
                        onClick={() => { setNewLoanMode("upload"); setUploadLoanState("idle"); setUploadLoanFile(null); setDetectedLoans([]); }}
                        className={`h-6 px-2.5 text-xs font-medium rounded-[6px] transition-colors flex items-center gap-1 ${newLoanMode === "upload" || newLoanMode === "review" ? "bg-background border border-border/60 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        <Upload className="h-2.5 w-2.5" />
                        {newLoanMode === "review" ? "Review" : "Upload Doc"}
                      </button>
                    </div>
                    {/* Review badge */}
                    {newLoanMode === "review" && (
                      <span className="text-[10px] text-muted-foreground">
                        {detectedLoans.length} loan{detectedLoans.length !== 1 ? "s" : ""} detected
                        {dupeCount > 0 && <span className="ml-1 text-amber-600 font-medium">· {dupeCount} duplicate{dupeCount !== 1 ? "s" : ""}</span>}
                      </span>
                    )}
                  </div>
                  <button onClick={closeNewLoanPanel} className="p-1 rounded-[6px] hover:bg-muted transition-colors text-muted-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* ── Upload mode ── */}
                {newLoanMode === "upload" && (
                  <div className="overflow-y-auto flex-1 p-4 space-y-3">
                    {/* Drop zone */}
                    {uploadLoanState === "idle" && (
                      <div
                        onDragOver={e => { e.preventDefault(); setUploadDragging(true); }}
                        onDragLeave={() => setUploadDragging(false)}
                        onDrop={e => { e.preventDefault(); setUploadDragging(false); handleUploadLoanFiles(e.dataTransfer.files); }}
                        onClick={() => uploadFileRef.current?.click()}
                        className={`flex flex-col items-center justify-center gap-3 rounded-[10px] border-2 border-dashed cursor-pointer transition-colors py-9 ${uploadDragging ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40 hover:bg-muted/30"}`}
                      >
                        <input ref={uploadFileRef} type="file" accept=".pdf,.xlsx,.xls" multiple className="hidden"
                          onChange={e => handleUploadLoanFiles(e.target.files)} />
                        <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">
                            <span className="text-primary">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">PDF or Excel · multiple files supported · max 5 MB each</p>
                        </div>
                      </div>
                    )}
                    {/* Extracting spinner */}
                    {uploadLoanState === "extracting" && (
                      <div className="flex flex-col items-center justify-center gap-3 py-9">
                        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">{uploadLoanFile}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Extracting all loans — this takes a moment…</p>
                        </div>
                      </div>
                    )}
                    {/* Accepted docs hint */}
                    {uploadLoanState === "idle" && (
                      <div className="rounded-[8px] bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1.5">Accepted documents</p>
                        <ul className="space-y-1">
                          {[
                            ["Loan agreements or credit facility letters", "Each loan extracted individually"],
                            ["Term sheets or commitment letters",           "Principal, rate, dates populated"],
                            ["Prior year workpaper (Excel)",                "All tabs detected and imported"],
                          ].map(([doc, note]) => (
                            <li key={doc} className="flex items-start gap-1.5">
                              <Check className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                              <span className="text-[11px] text-blue-700 dark:text-blue-300">
                                <span className="font-medium">{doc}</span>
                                <span className="text-blue-500 dark:text-blue-400"> — {note}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Review mode ── */}
                {newLoanMode === "review" && (
                  <div className="flex flex-col flex-1 min-h-0">
                    {/* Toolbar */}
                    <div className="px-4 py-2 border-b border-border bg-muted/10 shrink-0 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => { setNewLoanMode("upload"); setDetectedLoans([]); }}
                          className="text-[11px] text-primary hover:underline flex items-center gap-1">
                          ← Re-upload
                        </button>
                        {dupeCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 font-medium">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            {dupeCount} duplicate{dupeCount !== 1 ? "s" : ""} — set an action below
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setDetectedLoans(d => d.map(l => ({ ...l, selected: true })))}
                          className="text-[10px] text-muted-foreground hover:text-foreground">Select all</button>
                        <span className="text-muted-foreground text-[10px]">·</span>
                        <button onClick={() => setDetectedLoans(d => d.map(l => ({ ...l, selected: false })))}
                          className="text-[10px] text-muted-foreground hover:text-foreground">Deselect all</button>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-auto flex-1 min-h-0">
                      <table className="w-full text-[11px]" style={{ minWidth: 780 }}>
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-muted/40 border-b border-border">
                            {["","Loan Name","Lender","Type","CCY","Principal","Rate","Maturity","Status","Action"].map(h => (
                              <th key={h} className={`px-2.5 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${h === "" ? "w-8" : h === "Loan Name" || h === "Lender" ? "text-left" : "text-right"}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {detectedLoans.map((dl, i) => {
                            const isSkipped = dl.isDuplicate && dl.duplicateAction === "skip";
                            // Dim only the data cells, never status/action
                            const dataDim = isSkipped ? "opacity-40" : "";
                            return (
                              <tr key={dl.id} className={`border-b border-border transition-colors ${dl.isDuplicate && !isSkipped ? "bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20" : isSkipped ? "bg-muted/5" : "hover:bg-muted/20"}`}>
                                {/* Checkbox */}
                                <td className={`px-2.5 py-2 text-center ${dataDim}`}>
                                  <input type="checkbox" checked={dl.selected && !isSkipped} disabled={isSkipped}
                                    onChange={e => setDetectedLoans(prev => prev.map((d, j) => j === i ? { ...d, selected: e.target.checked } : d))}
                                    className="h-3.5 w-3.5 accent-primary cursor-pointer disabled:cursor-not-allowed" />
                                </td>
                                {/* Loan Name */}
                                <td className={`px-2.5 py-2 ${dataDim}`}>
                                  <p className={`font-medium whitespace-nowrap ${isSkipped ? "text-muted-foreground line-through" : "text-foreground"}`}>{dl.name}</p>
                                  <p className="text-[9px] text-muted-foreground mt-0.5 truncate max-w-[150px]" title={dl.sourceFile}>{dl.sourceFile}</p>
                                </td>
                                {/* Lender */}
                                <td className={`px-2.5 py-2 text-foreground whitespace-nowrap ${dataDim}`}>{dl.lender}</td>
                                {/* Type */}
                                <td className={`px-2.5 py-2 text-right ${dataDim}`}>
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-foreground border border-border">{dl.type}</span>
                                </td>
                                {/* CCY */}
                                <td className={`px-2.5 py-2 text-right ${dataDim}`}>
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-foreground border border-border">{dl.currency}</span>
                                </td>
                                {/* Principal */}
                                <td className={`px-2.5 py-2 text-right tabular-nums font-medium text-foreground whitespace-nowrap ${dataDim}`}>{fmt(dl.originalPrincipal)}</td>
                                {/* Rate */}
                                <td className={`px-2.5 py-2 text-right tabular-nums text-foreground ${dataDim}`}>{dl.rate.toFixed(2)}%</td>
                                {/* Maturity */}
                                <td className={`px-2.5 py-2 text-right whitespace-nowrap text-foreground ${dataDim}`}>{fmtDate(dl.maturityDate)}</td>
                                {/* Status — always full opacity */}
                                <td className="px-2.5 py-2 text-right">
                                  {dl.isDuplicate
                                    ? <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap"><AlertTriangle className="h-2.5 w-2.5" />Duplicate</span>
                                    : <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 whitespace-nowrap"><CheckCircle2 className="h-2.5 w-2.5" />New</span>
                                  }
                                </td>
                                {/* Action — always full opacity */}
                                <td className="px-2.5 py-2 text-right">
                                  {dl.isDuplicate ? (
                                    <select value={dl.duplicateAction}
                                      onChange={e => setDetectedLoans(prev => prev.map((d, j) => j === i ? { ...d, duplicateAction: e.target.value as DuplicateAction } : d))}
                                      className={`h-6 text-[10px] px-1.5 border rounded-[5px] focus:outline-none focus:ring-1 cursor-pointer font-medium transition-colors ${
                                        isSkipped
                                          ? "border-border bg-muted text-muted-foreground focus:ring-primary/30"
                                          : "border-amber-300 bg-amber-50 text-amber-800 focus:ring-amber-400"
                                      }`}
                                    >
                                      <option value="skip">Skip</option>
                                      <option value="overwrite">Overwrite existing</option>
                                      <option value="keep-both">Keep both</option>
                                    </select>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Duplicate legend */}
                    {dupeCount > 0 && (
                      <div className="px-4 py-2 border-t border-amber-200/60 bg-amber-50/60 dark:bg-amber-950/10 shrink-0">
                        <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                          <span className="font-semibold">Duplicate actions:</span>{" "}
                          <span className="font-medium">Skip</span> — don't import · {" "}
                          <span className="font-medium">Overwrite existing</span> — replace the existing loan's data · {" "}
                          <span className="font-medium">Keep both</span> — import with "(Imported)" suffix
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Manual entry mode ── */}
                {newLoanMode === "manual" && (
                  <div className="overflow-y-auto flex-1 px-4 py-4">
                    <div className="flex flex-wrap gap-x-3 gap-y-3">
                      <div style={{ flex: "3 1 180px", minWidth: 0 }}>
                        <label className="block text-xs text-muted-foreground mb-1">Loan Name <span className="text-red-500">*</span></label>
                        <input className={LF} placeholder="e.g. Term Loan A" value={newLoan.name ?? ""} onChange={e => setF("name", e.target.value)} />
                      </div>
                      <div style={{ flex: "2 1 140px", minWidth: 0 }}>
                        <label className="block text-xs text-muted-foreground mb-1">Lender <span className="text-red-500">*</span></label>
                        <input className={LF} placeholder="e.g. Royal Bank of Canada" value={newLoan.lender ?? ""} onChange={e => setF("lender", e.target.value)} />
                      </div>
                      <div style={{ flex: "1 1 100px", minWidth: 0 }}>
                        <label className="block text-xs text-muted-foreground mb-1">Type</label>
                        <select className={LF} value={newLoan.type ?? "Term"} onChange={e => setF("type", e.target.value)}>
                          {["Term","LOC","Revolver","Mortgage","Bridge"].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: "1 1 80px", minWidth: 0 }}>
                        <label className="block text-xs text-muted-foreground mb-1">Currency</label>
                        <select className={LF} value={newLoan.currency ?? "CAD"} onChange={e => setF("currency", e.target.value)}>
                          {["CAD","USD","EUR","GBP"].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: "1 1 110px", minWidth: 0 }}>
                        <label className="block text-xs text-muted-foreground mb-1">Interest Type</label>
                        <select className={LF} value={newLoan.interestType ?? "Fixed"} onChange={e => setF("interestType", e.target.value)}>
                          {["Fixed","Variable","Floating","Hybrid","Step Rate"].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: "1 1 100px", minWidth: 0 }}>
                        <label className="block text-xs text-muted-foreground mb-1">Day Count</label>
                        <select className={LF} value={newLoan.dayCountBasis ?? "ACT/365"} onChange={e => setF("dayCountBasis", e.target.value)}>
                          {["ACT/365","ACT/360","30/360"].map(d => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: "1 1 80px", minWidth: 0 }}>
                        <label className="block text-xs text-muted-foreground mb-1">Rate (%) <span className="text-red-500">*</span></label>
                        <input type="number" step="0.01" className={LF} placeholder="5.25" value={newLoan.rate || ""} onChange={e => setF("rate", parseFloat(e.target.value) || 0)} />
                      </div>
                      <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                        <label className="block text-xs text-muted-foreground mb-1">Original Principal <span className="text-red-500">*</span></label>
                        <input type="number" step="1000" className={LF} placeholder="1,000,000" value={newLoan.originalPrincipal || ""} onChange={e => setF("originalPrincipal", parseFloat(e.target.value) || 0)} />
                      </div>
                      <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                        <label className="block text-xs text-muted-foreground mb-1">Current Balance</label>
                        <input type="number" step="1000" className={LF} placeholder="Same as original" value={newLoan.currentBalance || ""} onChange={e => setF("currentBalance", parseFloat(e.target.value) || 0)} />
                      </div>
                      <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                        <label className="block text-xs text-muted-foreground mb-1">Start Date <span className="text-red-500">*</span></label>
                        <input type="date" className={LF} value={newLoan.startDate ?? ""} onChange={e => setF("startDate", e.target.value)} />
                      </div>
                      <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                        <label className="block text-xs text-muted-foreground mb-1">Maturity Date <span className="text-red-500">*</span></label>
                        <input type="date" className={LF} value={newLoan.maturityDate ?? ""} onChange={e => setF("maturityDate", e.target.value)} />
                      </div>
                      <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                        <label className="block text-xs text-muted-foreground mb-1">First Payment Date</label>
                        <input type="date" className={LF} value={newLoan.firstPaymentDate ?? ""} onChange={e => setF("firstPaymentDate", e.target.value)} />
                      </div>
                      <div style={{ flex: "1 1 110px", minWidth: 0 }}>
                        <label className="block text-xs text-muted-foreground mb-1">Payment Frequency</label>
                        <select className={LF} value={newLoan.paymentFrequency ?? "Monthly"} onChange={e => setF("paymentFrequency", e.target.value)}>
                          {["Monthly","Quarterly","Semi-annual","Annual"].map(f => <option key={f}>{f}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: "1 1 110px", minWidth: 0 }}>
                        <label className="block text-xs text-muted-foreground mb-1">Payment Type</label>
                        <select className={LF} value={newLoan.paymentType ?? "P&I"} onChange={e => setF("paymentType", e.target.value)}>
                          {["P&I","Interest-only","Balloon"].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: "1 0 100%", minWidth: 0 }}>
                        <label className="block text-xs text-muted-foreground mb-1">Security / Collateral Description</label>
                        <input className={LF} placeholder="e.g. General Security Agreement over all assets" value={newLoan.securityDescription ?? ""} onChange={e => setF("securityDescription", e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Footer ── */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 shrink-0">
                  <button onClick={closeNewLoanPanel}
                    className="h-8 px-4 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-[8px] bg-background hover:bg-muted transition-colors">
                    Cancel
                  </button>

                  {/* Upload mode hint */}
                  {newLoanMode === "upload" && (
                    <p className="text-xs text-muted-foreground">Upload documents to detect loans automatically</p>
                  )}

                  {/* Review mode — import button */}
                  {newLoanMode === "review" && (
                    <button onClick={handleImportDetected} disabled={importCount === 0}
                      className={`inline-flex items-center gap-1.5 h-8 px-4 text-xs font-medium rounded-[8px] transition-colors ${importCount > 0 ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"}`}>
                      <Download className="h-3 w-3" />
                      Import {importCount > 0 ? importCount : ""} Loan{importCount !== 1 ? "s" : ""} &amp; Run Amortization
                    </button>
                  )}

                  {/* Manual mode — save button */}
                  {newLoanMode === "manual" && (
                    <button onClick={handleSaveLoan} disabled={!isFormReady}
                      className={`inline-flex items-center gap-1.5 h-8 px-4 text-xs font-medium rounded-[8px] transition-colors ${isFormReady ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"}`}>
                      <Plus className="h-3 w-3" /> Add Loan &amp; Run Amortization
                    </button>
                  )}
                </div>

              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}

function ContinuityTabPanel({ loans, continuity }: { loans: Loan[]; continuity: ContinuityRow[] }) {
  const { settings, addJE, jes } = useStore(s => ({
    settings: s.settings,
    addJE:    s.addJE,
    jes:      s.jes,
  }));
  const [contView, setContView] = useState<"rollforward" | "repayment">("rollforward");

  const postAJE = (loan: Loan, accruedInterest: number) => {
    if (!accruedInterest || accruedInterest <= 0) {
      toast.error("No accrued interest to post for this loan");
      return;
    }
    const expAcct  = `${loan.glInterestExpenseAccount} – Interest Expense (${loan.currency})`;
    const liabAcct = `${loan.glAccruedInterestAccount} – Accrued Interest Payable – ${loan.currency}`;
    const jeId     = `je-ai-${Date.now()}`;
    const period   = settings?.currentPeriod ?? "2024-12";
    addJE({
      id: jeId, type: "AccruedInterest",
      description: `YE Accrued Interest – ${loan.name} (${loan.refNumber})`,
      fiscalYear: period.slice(0, 4),
      date: `${period}-01`,
      loanId: loan.id, status: "Draft",
      createdAt: new Date().toISOString(),
      lines: [
        { id: `${jeId}-dr`, account: expAcct,  description: `YE accrued interest – ${loan.name}`, debit: accruedInterest, credit: 0,              loanId: loan.id },
        { id: `${jeId}-cr`, account: liabAcct, description: `YE accrued interest – ${loan.name}`, debit: 0,              credit: accruedInterest, loanId: loan.id },
      ],
    } as Parameters<typeof addJE>[0]);
    toast.success(`AJE posted — ${loan.name}`);
  };

  const period   = settings?.currentPeriod ?? "2024-12";
  const baseYear = parseInt(period.split("-")[0]);

  // Latest continuity row per loan
  const latestRows = useMemo(() => {
    return loans.map(loan => {
      const rows = continuity.filter(r => r.loanId === loan.id).sort((a,b) => b.period.localeCompare(a.period));
      return { loan, row: rows[0] ?? null };
    });
  }, [loans, continuity]);

  const rfTotals = useMemo(() => latestRows.reduce((acc, { loan, row }) => {
    if (!row) return acc;
    const fx = toCAD(1, loan.currency);
    acc.opening   += row.openingBalance              * fx;
    acc.borrows   += row.newBorrowings               * fx;
    acc.principal += (row.principalRepayments ?? 0)  * fx;
    acc.interest  += (row.interestRepayments  ?? 0)  * fx;
    acc.fxTrans   += row.fxTranslation               * fx;
    acc.closing   += row.closingBalance              * fx;
    acc.accrued   += row.accruedInterest             * fx;
    return acc;
  }, { opening:0, borrows:0, principal:0, interest:0, fxTrans:0, closing:0, accrued:0 }), [latestRows]);

  // Ladder: compute in native currency → scale to CAD
  const ladderRowsData = useMemo(() => loans.map(loan => {
    const contRow = latestRows.find(r => r.loan.id === loan.id)?.row;
    const closingNative = contRow?.closingBalance ?? loan.currentBalance;
    const fx = toCAD(1, loan.currency);
    const nativeLadder = calcMaturityLadder(loan, closingNative, period);
    const ladder = nativeLadder.map(v => Math.round(v * fx)) as [number,number,number,number,number,number,number];
    return { loan, ladder };
  }), [loans, latestRows, period]);

  const bsColHeaders = [
    String(baseYear + 2), String(baseYear + 3), String(baseYear + 4),
    String(baseYear + 5), String(baseYear + 6), "Thereafter",
    `Current (${baseYear + 1})`, "Long-Term", "Total",
  ];

  const bsTotals = useMemo(() => ladderRowsData.reduce(
    (s, r) => r.ladder.map((v, i) => s[i] + v) as [number,number,number,number,number,number,number],
    [0,0,0,0,0,0,0] as [number,number,number,number,number,number,number],
  ), [ladderRowsData]);

  const repayYearLabels = useMemo(
    () => Array.from({ length: 6 }, (_, i) => String(baseYear + i + 1)).concat(["Thereafter"]),
    [baseYear],
  );
  const repayColTotals = repayYearLabels.map((_, i) =>
    ladderRowsData.reduce((s, r) => s + (r.ladder[i] ?? 0), 0),
  );
  const repayGrandTotal = repayColTotals.reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-3">

      {/* View selector dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">View:</span>
        <div className="relative">
          <select
            value={contView}
            onChange={e => setContView(e.target.value as "rollforward" | "repayment")}
            className="h-8 text-[11px] pl-2.5 pr-7 border border-border rounded-[8px] bg-background text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/40 hover:border-primary/40 transition-colors"
          >
            <option value="rollforward">Roll-Forward</option>
            <option value="repayment">Repayment Schedule</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* ── Roll-Forward view ── */}
      {contView === "rollforward" && (
        <div className="space-y-3">

          {/* Roll-Forward table */}
          <div className="rounded-[8px] border border-border overflow-hidden">
            <div className="px-3 py-2 bg-muted/40 border-b border-border">
              <span className="text-[11px] font-semibold text-foreground">Continuity Roll-Forward</span>
              <span className="text-[10px] text-muted-foreground ml-2">Opening → movements → closing by period</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-muted/20 border-b border-border">
                    {["Loan","Opening Bal.","+New Borr.","-Principal","-Interest","±FX","Closing Bal.","Accrued Int.",""].map(h=>(
                      <th key={h} className={`px-2.5 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${h==="Loan"?"text-left":"text-right"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {latestRows.map(({ loan, row }, i) => {
                    const fx = toCAD(1, loan.currency);
                    if (!row) return (
                      <tr key={loan.id} className={`border-b border-border/40 ${i%2===0?"":"bg-muted/10"}`}>
                        <td className="px-2.5 py-1.5">
                          <p className="font-medium text-foreground">{loan.name}</p>
                          <p className="text-[10px] text-muted-foreground">{loan.lender} · {loan.currency}</p>
                        </td>
                        {Array(7).fill(0).map((_,j)=><td key={j} className="px-2.5 py-1.5 text-right text-muted-foreground">—</td>)}
                        <td />
                      </tr>
                    );
                    const prin = row.principalRepayments ?? 0;
                    const int  = row.interestRepayments  ?? 0;
                    return (
                      <tr key={loan.id} className={`border-b border-border/40 ${i%2===0?"":"bg-muted/10"}`}>
                        <td className="px-2.5 py-1.5">
                          <p className="font-medium text-foreground">{loan.name}</p>
                          <p className="text-[10px] text-muted-foreground">{loan.lender} · {loan.currency}</p>
                        </td>
                        <td className="px-2.5 py-1.5 text-right tabular-nums">{fmtNum(row.openingBalance * fx)}</td>
                        <td className="px-2.5 py-1.5 text-right tabular-nums text-green-700">{row.newBorrowings > 0 ? fmtNum(row.newBorrowings * fx) : "00"}</td>
                        <td className="px-2.5 py-1.5 text-right tabular-nums text-red-600">{prin > 0 ? fmtParen(prin * fx) : "00"}</td>
                        <td className="px-2.5 py-1.5 text-right tabular-nums text-muted-foreground">{int > 0 ? fmtParen(int * fx) : "00"}</td>
                        <td className="px-2.5 py-1.5 text-right tabular-nums text-muted-foreground">{row.fxTranslation !== 0 ? fmtParen(Math.abs(row.fxTranslation * fx)) : "—"}</td>
                        <td className="px-2.5 py-1.5 text-right tabular-nums font-semibold">{fmtNum(row.closingBalance * fx)}</td>
                        <td className="px-2.5 py-1.5 text-right tabular-nums text-muted-foreground">{fmtNum(row.accruedInterest * fx)}</td>
                        <td className="px-2.5 py-1.5 text-right">
                          <button
                            onClick={() => postAJE(loan, row.accruedInterest)}
                            disabled={row.accruedInterest <= 0}
                            title="Post accrued interest AJE to AJEs tab"
                            className={`p-1 rounded-[5px] transition-colors ${
                              row.accruedInterest <= 0
                                ? "text-muted-foreground/40 cursor-not-allowed"
                                : "text-primary hover:bg-primary/10 cursor-pointer"
                            }`}
                          >
                            <Send className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30 border-t border-border font-semibold">
                    <td className="px-2.5 py-2" />
                    <td className="px-2.5 py-2 text-right tabular-nums text-[11px]">{fmtNum(rfTotals.opening)}</td>
                    <td className="px-2.5 py-2 text-right tabular-nums text-[11px] text-green-700">{rfTotals.borrows > 0 ? fmtNum(rfTotals.borrows) : "00"}</td>
                    <td className="px-2.5 py-2 text-right tabular-nums text-[11px] text-red-600">{rfTotals.principal > 0 ? fmtParen(rfTotals.principal) : "00"}</td>
                    <td className="px-2.5 py-2 text-right tabular-nums text-[11px] text-muted-foreground">{rfTotals.interest > 0 ? fmtParen(rfTotals.interest) : "00"}</td>
                    <td className="px-2.5 py-2 text-right tabular-nums text-[11px] text-muted-foreground">—</td>
                    <td className="px-2.5 py-2 text-right tabular-nums text-[11px]">{fmtNum(rfTotals.closing)}</td>
                    <td className="px-2.5 py-2 text-right tabular-nums text-[11px]">{fmtNum(rfTotals.accrued)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Balance Sheet Classification — maturity ladder */}
          <div className="rounded-[8px] border border-border overflow-hidden">
            <div className="px-3 py-2 bg-muted/40 border-b border-border">
              <span className="text-[11px] font-semibold text-foreground">Balance Sheet Classification</span>
              <span className="text-[10px] text-muted-foreground ml-2">Current portion + maturity ladder by year (CAD equiv.)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-muted/20 border-b border-border">
                    <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-left whitespace-nowrap">Loan</th>
                    {bsColHeaders.map(h => (
                      <th key={h} className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ladderRowsData.map(({ loan, ladder }, i) => {
                    const longTerm = ladder.slice(1).reduce((s, v) => s + v, 0);
                    const total    = ladder.reduce((s, v) => s + v, 0);
                    return (
                      <tr key={loan.id} className={`border-b border-border/40 ${i%2===0?"":"bg-muted/10"}`}>
                        <td className="px-3 py-1.5 whitespace-nowrap">
                          <p className="font-medium text-foreground">{loan.name}</p>
                          <p className="text-[10px] text-muted-foreground">{loan.lender} · {loan.currency}</p>
                        </td>
                        {/* yr+2 … Thereafter = ladder[1..6] */}
                        {ladder.slice(1).map((v, j) => (
                          <td key={j} className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">{v > 0 ? fmtNum(v) : "00"}</td>
                        ))}
                        {/* Current: ladder[0] */}
                        <td className="px-3 py-1.5 text-right tabular-nums text-primary font-medium">{ladder[0] > 0 ? fmtNum(ladder[0]) : "00"}</td>
                        {/* Long-Term */}
                        <td className="px-3 py-1.5 text-right tabular-nums font-medium">{longTerm > 0 ? fmtNum(longTerm) : "00"}</td>
                        {/* Total */}
                        <td className="px-3 py-1.5 text-right tabular-nums font-semibold">{fmtNum(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30 border-t border-border font-semibold">
                    <td className="px-3 py-2" />
                    {bsTotals.slice(1).map((v, i) => (
                      <td key={i} className="px-3 py-2 text-right tabular-nums text-[11px] text-muted-foreground">{v > 0 ? fmtNum(v) : "00"}</td>
                    ))}
                    <td className="px-3 py-2 text-right tabular-nums text-[11px] text-primary">{bsTotals[0] > 0 ? fmtNum(bsTotals[0]) : "00"}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-[11px]">{bsTotals.slice(1).reduce((s,v)=>s+v,0) > 0 ? fmtNum(bsTotals.slice(1).reduce((s,v)=>s+v,0)) : "00"}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-[11px] font-bold">{fmtNum(bsTotals.reduce((s,v)=>s+v,0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Repayment Schedule view ── */}
      {contView === "repayment" && (
        <div className="rounded-[8px] border border-border overflow-hidden">
          <div className="px-3 py-2 bg-muted/40 border-b border-border">
            <span className="text-[11px] font-semibold text-foreground">Repayment Schedule</span>
            <span className="text-[10px] text-muted-foreground ml-2">Scheduled principal repayments by year (CAD equiv.)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-muted/20 border-b border-border">
                  <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-left whitespace-nowrap">Facility</th>
                  {repayYearLabels.map(lbl => (
                    <th key={lbl} className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right whitespace-nowrap">{lbl}</th>
                  ))}
                  <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right whitespace-nowrap">Total</th>
                </tr>
              </thead>
              <tbody>
                {ladderRowsData.map(({ loan, ladder }, i) => {
                  const total = ladder.reduce((s, v) => s + v, 0);
                  return (
                    <tr key={loan.id} className={`border-b border-border/40 ${i%2===0?"":"bg-muted/10"}`}>
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        <p className="font-medium text-foreground">{loan.name}</p>
                        <p className="text-[10px] text-muted-foreground">{loan.lender} · {loan.currency}</p>
                      </td>
                      {ladder.map((v, j) => (
                        <td key={j} className="px-3 py-1.5 text-right tabular-nums text-foreground">{v > 0 ? fmtNum(v) : "00"}</td>
                      ))}
                      <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-foreground">{fmtNum(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 border-t border-border font-semibold">
                  <td className="px-3 py-2" />
                  {repayColTotals.map((v, i) => (
                    <td key={i} className="px-3 py-2 text-right tabular-nums text-[11px]">{v > 0 ? fmtNum(v) : "00"}</td>
                  ))}
                  <td className="px-3 py-2 text-right tabular-nums text-[11px] font-bold">{fmtNum(repayGrandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

function AmortizationTabPanel({ loans, amortization }: { loans: Loan[]; amortization: AmortizationRow[] }) {
  const [selectedLoanId, setSelectedLoanId] = useState(loans[0]?.id ?? "");
  const loan = loans.find(l => l.id === selectedLoanId);
  const rows = useMemo(() =>
    amortization.filter(r => r.loanId === selectedLoanId).sort((a,b) => a.periodDate.localeCompare(b.periodDate)),
    [amortization, selectedLoanId]
  );
  const [showAll, setShowAll] = useState(false);
  const displayRows = showAll ? rows : rows.slice(0, 8);

  const totalInterest   = rows.reduce((s,r)=>s+r.interest,0);
  const totalPrincipal  = rows.reduce((s,r)=>s+r.principal,0);
  const totalPayment    = rows.reduce((s,r)=>s+r.payment,0);
  const remaining       = loan ? toCAD(loan.currentBalance, loan.currency) : 0;
  const monthly         = rows[0]?.payment ?? 0;

  return (
    <div className="space-y-3">
      {/* View selector */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">View:</span>
        <select
          value={selectedLoanId}
          onChange={e => { setSelectedLoanId(e.target.value); setShowAll(false); }}
          className="flex-1 h-8 text-[11px] px-2 border border-border rounded-[8px] bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        >
          {loans.map(l => <option key={l.id} value={l.id}>{l.name} ({l.currency})</option>)}
        </select>
      </div>

      {/* KPI cards */}
      {loan && (
        <div className="flex gap-2">
          {[
            { label: "Remaining Balance",  value: fmt(remaining),         sub: "Opening balance" },
            { label: "Total Interest",      value: fmt(totalInterest),     sub: "Full schedule" },
            { label: "Monthly Payment",     value: fmt(monthly),           sub: `${loan.paymentType}` },
            { label: "Maturity",            value: fmtDate(loan.maturityDate), sub: `${loan.rate}% ${loan.dayCountBasis}` },
          ].map(({ label, value, sub }) => (
            <div key={label} className="flex-1 rounded-[8px] border border-border bg-background px-3 py-2 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">{label}</p>
              <p className="text-xs font-semibold text-foreground tabular-nums">{value}</p>
              <p className="text-[10px] text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Schedule table */}
      <div className="rounded-[8px] border border-border overflow-hidden">
        <div className="px-3 py-2 bg-muted/40 border-b border-border flex items-center justify-between">
          <span className="text-[11px] font-semibold text-foreground">{loan?.name} — Amortization Schedule</span>
          <span className="text-[10px] text-muted-foreground">{rows.length} periods</span>
        </div>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-muted/20 border-b border-border">
              {["Period","Opening Bal.","Interest","Principal","Payment","Ending Bal."].map(h=>(
                <th key={h} className={`px-2.5 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide ${h==="Period"?"text-left":"text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((r,i) => (
              <tr key={r.id} className={`border-b border-border/40 ${i%2===0?"":"bg-muted/10"}`}>
                <td className="px-2.5 py-1.5 text-muted-foreground">{r.periodDate}</td>
                <td className="px-2.5 py-1.5 text-right tabular-nums">{fmtNum(r.openingBalance)}</td>
                <td className="px-2.5 py-1.5 text-right tabular-nums text-muted-foreground">{fmtNum(r.interest)}</td>
                <td className="px-2.5 py-1.5 text-right tabular-nums text-primary">{fmtNum(r.principal)}</td>
                <td className="px-2.5 py-1.5 text-right tabular-nums font-medium">{fmtNum(r.payment)}</td>
                <td className="px-2.5 py-1.5 text-right tabular-nums">{fmtNum(r.endingBalance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/20 border-t border-border font-semibold">
              <td className="px-2.5 py-2 text-[11px] text-foreground">Schedule Total</td>
              <td />
              <td className="px-2.5 py-2 text-right tabular-nums text-[11px] text-muted-foreground">{fmtNum(totalInterest)}</td>
              <td className="px-2.5 py-2 text-right tabular-nums text-[11px] text-primary">{fmtNum(totalPrincipal)}</td>
              <td className="px-2.5 py-2 text-right tabular-nums text-[11px]">{fmtNum(totalPayment)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
        {rows.length > 8 && (
          <button
            onClick={() => setShowAll(v => !v)}
            className="w-full py-2 text-[11px] text-primary hover:bg-muted/30 transition-colors border-t border-border flex items-center justify-center gap-1"
          >
            {showAll ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> Show all {rows.length} periods</>}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Searchable covenant-name dropdown (mirrors workpaper CustomSelect) ───────
const COV_NAME_OPTIONS = COVENANT_TEMPLATES.map(t => ({ value: t.id, label: t.label }));

function CovNameSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef  = useRef<HTMLButtonElement>(null);

  const openDropdown = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
    setOpen(true);
  };
  const closeDropdown = () => { setOpen(false); setSearch(""); setDropPos(null); };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) closeDropdown();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected  = COV_NAME_OPTIONS.find(o => o.value === value);
  const filtered  = search
    ? COV_NAME_OPTIONS.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : COV_NAME_OPTIONS;

  return (
    <div ref={wrapRef} className="relative w-full">
      <button
        ref={btnRef}
        type="button"
        onClick={() => open ? closeDropdown() : openDropdown()}
        className="w-full h-8 pl-2.5 pr-7 text-left text-sm border border-border rounded-[8px] bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 flex items-center overflow-hidden relative"
      >
        <span className={`truncate flex-1 ${!selected ? "text-muted-foreground" : ""}`}>
          {selected?.label ?? "— Select covenant —"}
        </span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && dropPos && (
        <div
          className="fixed z-[70] bg-popover border border-border rounded-xl shadow-2xl overflow-hidden"
          style={{ top: dropPos.top, left: dropPos.left, minWidth: dropPos.width, width: "20rem" }}
        >
          {/* Search */}
          <div className="px-2 pt-2 pb-1.5 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              <input
                autoFocus
                type="text"
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-7 pl-6 pr-2 text-[11px] border border-[#dcdfe4] rounded-[6px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>
          {/* Options */}
          <div className="overflow-y-auto py-0.5 max-h-56">
            {filtered.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); closeDropdown(); }}
                className={`w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 transition-colors ${
                  opt.value === value
                    ? "bg-primary/[0.06] text-primary font-medium"
                    : "text-foreground hover:bg-muted/60"
                }`}
              >
                <span className="flex-1 truncate">{opt.label}</span>
                {opt.value === value && <Check className="w-3 h-3 shrink-0 text-primary" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-[11px] text-muted-foreground text-center">No options found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CovenantsTabPanel({ loans, covenants }: { loans: Loan[]; covenants: Covenant[] }) {
  const updateCovenant = useStore(s => s.updateCovenant);
  const addCovenant    = useStore(s => s.addCovenant);
  const deleteCovenant = useStore(s => s.deleteCovenant);
  const [selectedLoanId, setSelectedLoanId] = useState(loans[0]?.id ?? "");
  const [editingCovId, setEditingCovId] = useState<string | null>(null);
  const [isNewCov, setIsNewCov] = useState(false);
  const [draft, setDraft] = useState<Partial<Covenant>>({});

  const loan = loans.find(l => l.id === selectedLoanId);
  const loanCovs = covenants.filter(c => c.loanId === selectedLoanId);
  const breached = covenants.filter(c => c.status === "Breached").length;
  const atRisk   = covenants.filter(c => c.status === "At Risk").length;
  const editingCov = covenants.find(c => c.id === editingCovId);

  const openEdit = (cov: Covenant) => {
    setDraft({ ...cov });
    setIsNewCov(false);
    setEditingCovId(cov.id);
  };

  const handleNew = () => {
    const newCov: Covenant = {
      id:        `cov-${Date.now()}`,
      loanId:    selectedLoanId,
      name:      "",
      type:      "Quantitative",
      status:    "OK",
      frequency: "Annual",
      description: "",
      operator:  ">=",
      threshold: undefined,
      currentValue: undefined,
      projectedValue: undefined,
      formulaLines: [],
      denominatorLines: [],
      useFormulaBuilder: true,
      isRatioCovenant: true,
    };
    addCovenant(newCov);
    setDraft({ ...newCov });
    setIsNewCov(true);
    setEditingCovId(newCov.id);
  };

  const setD = (k: keyof Covenant, v: unknown) => setDraft(p => ({ ...p, [k]: v }));

  const computeStatus = (cur: number | undefined, thr: number | undefined, op: string | undefined) => {
    if (cur === undefined || thr === undefined || !op) return "OK" as const;
    const passes = op === ">=" ? cur >= thr : op === "<=" ? cur <= thr : op === ">" ? cur > thr : cur < thr;
    if (!passes) return "Breached" as const;
    const margin = thr !== 0 ? Math.abs(cur - thr) / Math.abs(thr) : 1;
    return margin < 0.1 ? "At Risk" as const : "OK" as const;
  };

  const handleSave = () => {
    if (!editingCovId) return;
    updateCovenant(editingCovId, draft);
    toast.success("Covenant saved");
    setEditingCovId(null);
  };

  const handleRerun = () => {
    if (!editingCovId) return;
    const newStatus = computeStatus(draft.currentValue, draft.threshold, draft.operator);
    const updated = { ...draft, status: newStatus };
    setDraft(updated);
    updateCovenant(editingCovId, updated);
    toast.success(`Rerun complete — status: ${newStatus}`);
    setEditingCovId(null);
  };

  // ── Measure prompt-input position so the panel aligns exactly ────────────
  const [panelRect, setPanelRect] = useState<{ left: number; right: number; bottom: number } | null>(null);

  useLayoutEffect(() => {
    if (!editingCovId) { setPanelRect(null); return; }
    const measure = () => {
      const inputBox = document.querySelector<HTMLElement>(".luka-gradient-border");
      if (!inputBox) return;
      const r = inputBox.getBoundingClientRect();
      setPanelRect({
        left:   r.left,
        right:  window.innerWidth - r.right,
        bottom: window.innerHeight - r.top + 5,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [editingCovId]);

  // ── Formula-line helpers ──────────────────────────────────────────────────
  const getNumLines  = () => (draft.formulaLines     ?? editingCov?.formulaLines     ?? []) as CovenantFormulaLine[];
  const getDenLines  = () => (draft.denominatorLines ?? editingCov?.denominatorLines ?? []) as CovenantFormulaLine[];

  const addFormLine = (kind: "num" | "den") => {
    const key  = kind === "num" ? "formulaLines" : "denominatorLines";
    const cur  = (draft[key] ?? editingCov?.[key] ?? []) as CovenantFormulaLine[];
    const line: CovenantFormulaLine = { id: `fl-${Date.now()}`, sign: "+", description: "", glAccount: "", amount: 0, projectedAmount: 0, multiplier: 1 };
    setDraft(p => ({ ...p, [key]: [...cur, line] }));
  };

  const removeFormLine = (kind: "num" | "den", id: string) => {
    const key = kind === "num" ? "formulaLines" : "denominatorLines";
    const cur = (draft[key] ?? editingCov?.[key] ?? []) as CovenantFormulaLine[];
    setDraft(p => ({ ...p, [key]: cur.filter(l => l.id !== id) }));
  };

  const updateFormLine = (kind: "num" | "den", id: string, field: keyof CovenantFormulaLine, value: unknown) => {
    const key = kind === "num" ? "formulaLines" : "denominatorLines";
    const cur = (draft[key] ?? editingCov?.[key] ?? []) as CovenantFormulaLine[];
    setDraft(p => ({ ...p, [key]: cur.map(l => l.id === id ? { ...l, [field]: value } : l) }));
  };

  const updateFormLineAccount = (kind: "num" | "den", id: string, code: string, name: string) => {
    const key = kind === "num" ? "formulaLines" : "denominatorLines";
    const cur = (draft[key] ?? editingCov?.[key] ?? []) as CovenantFormulaLine[];
    setDraft(p => ({ ...p, [key]: cur.map(l => l.id === id ? { ...l, glAccount: code, description: name } : l) }));
  };

  const FIELD = "h-8 w-full text-sm px-2.5 border border-border rounded-[8px] bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40";
  const LINE_INPUT = "h-7 text-sm px-2 border border-border rounded-[6px] bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40";

  return (
    <div className="space-y-3">
      {/* Summary chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-[6px]">
          <AlertTriangle className="h-3 w-3" /> {breached} Breached
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-[6px]">
          <AlertTriangle className="h-3 w-3" /> {atRisk} At Risk
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-[6px]">
          <CheckCircle2 className="h-3 w-3" /> {covenants.filter(c=>c.status==="OK").length} OK
        </span>
      </div>

      {/* Loan selector + New button */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">Loan:</span>
        <select value={selectedLoanId} onChange={e => setSelectedLoanId(e.target.value)}
          className="flex-1 h-8 text-[11px] px-2 border border-border rounded-[8px] bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40">
          {loans.map(l => <option key={l.id} value={l.id}>{l.name} · {l.lender} · {l.refNumber}</option>)}
        </select>
        {loan && <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-[4px]">{loan.currency}</span>}
        <span className="text-[10px] text-muted-foreground">{loanCovs.length} covenants</span>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-1 h-8 px-3 text-[11px] font-medium bg-primary text-primary-foreground rounded-[8px] hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus className="h-3 w-3" /> New
        </button>
      </div>

      {loanCovs.length === 0 ? (
        <p className="text-[11px] text-muted-foreground italic px-1">No covenants for this loan.</p>
      ) : (
        <div className="rounded-[8px] border border-border overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-muted/20 border-b border-border">
                {[
                  { h: "Covenant",    align: "left"  },
                  { h: "Type",        align: "left"  },
                  { h: "Status",      align: "left"  },
                  { h: "Current",     align: "right" },
                  { h: "Projected",   align: "right" },
                  { h: "Threshold",   align: "right" },
                  { h: "Frequency",   align: "left"  },
                  { h: "Last Tested", align: "left"  },
                  { h: "",            align: "right" },
                ].map(({ h, align }) => (
                  <th key={h} className={`px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-${align} whitespace-nowrap`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loanCovs.map((cov, i) => {
                // Operator-aware projected fail/warn detection
                const projFails = cov.projectedValue !== undefined && cov.threshold !== undefined && (() => {
                  const { projectedValue: p, threshold: t, operator: op } = cov;
                  if (op === ">=") return p! < t!;
                  if (op === "<=") return p! > t!;
                  if (op === ">")  return p! <= t!;
                  if (op === "<")  return p! >= t!;
                  return false;
                })();
                const projWarn = !projFails && cov.projectedValue !== undefined && cov.threshold !== undefined && (() => {
                  const margin = cov.threshold !== 0 ? Math.abs(cov.projectedValue! - cov.threshold!) / Math.abs(cov.threshold!) : 1;
                  return margin < 0.1;
                })();
                const fmtRatio = (v: number) => v.toFixed(2);
                const fmtThreshold = (op: string | undefined, v: number) => `${op ?? ""} ${v % 1 === 0 ? v.toFixed(0) : v.toFixed(2)}`.trim();

                return (
                  <tr key={cov.id} className={`border-b border-border/40 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                    {/* Covenant name with dot */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${cov.status === "Breached" ? "bg-red-500" : cov.status === "At Risk" ? "bg-amber-500" : "bg-green-500"}`} />
                        <span className="font-semibold text-foreground whitespace-nowrap">{cov.name}</span>
                      </div>
                    </td>
                    {/* Type */}
                    <td className="px-3 py-2.5 text-foreground whitespace-nowrap">{cov.type}</td>
                    {/* Status */}
                    <td className="px-3 py-2.5"><StatusBadge status={cov.status} /></td>
                    {/* Current */}
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-foreground">
                      {cov.currentValue !== undefined ? fmtRatio(cov.currentValue) : "—"}
                    </td>
                    {/* Projected — trend arrow */}
                    <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
                      {cov.projectedValue !== undefined && cov.currentValue !== undefined
                        ? <span className="inline-flex items-center justify-end gap-0.5">
                            <span className="text-[9px] opacity-50">{cov.projectedValue > cov.currentValue ? "↑" : "↓"}</span>
                            {fmtRatio(cov.projectedValue)}
                          </span>
                        : "—"}
                    </td>
                    {/* Threshold */}
                    <td className="px-3 py-2.5 text-right tabular-nums text-foreground font-mono text-[10px]">
                      {cov.threshold !== undefined ? fmtThreshold(cov.operator, cov.threshold) : "—"}
                    </td>
                    {/* Frequency */}
                    <td className="px-3 py-2.5 text-foreground">{cov.frequency}</td>
                    {/* Last Tested */}
                    <td className="px-3 py-2.5 text-foreground whitespace-nowrap">{cov.lastTested ? fmtDate(cov.lastTested) : "—"}</td>
                    {/* Actions */}
                    <td className="px-3 py-2.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => openEdit(cov)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { if (editingCovId === cov.id) setEditingCovId(null); deleteCovenant(cov.id); toast.success("Covenant deleted"); }}
                          className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors" title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Edit covenant — slide-up panel ── */}
      {editingCovId && editingCov && (() => {
        const numLines  = getNumLines();
        const denLines  = getDenLines();
        const numTotal  = numLines.reduce((s, l) => s + (l.sign === "+" ? 1 : -1) * l.amount, 0);
        const denTotal  = denLines.reduce((s, l) => s + (l.sign === "+" ? 1 : -1) * l.amount, 0);
        const computed  = denTotal !== 0 ? numTotal / denTotal : null;

        const FormulaSection = ({ kind, lines, total }: { kind: "num" | "den"; lines: CovenantFormulaLine[]; total: number }) => (
          <div className="rounded-[8px] border border-border overflow-hidden">
            <div className="px-2.5 py-2 bg-muted/40 border-b border-border flex items-center justify-between">
              <span className="text-[10px] font-semibold text-foreground">{kind === "num" ? "Numerator" : "Denominator"}</span>
              <button
                onClick={() => addFormLine(kind)}
                className="inline-flex items-center gap-1 text-[10px] text-primary hover:bg-primary/10 rounded-[4px] px-1.5 py-0.5 transition-colors"
              >
                <Plus className="h-3 w-3" /> Add Row
              </button>
            </div>
            {lines.length === 0 ? (
              <p className="px-3 py-2.5 text-[11px] text-muted-foreground italic">No lines yet — click Add Row</p>
            ) : (
              <>
                <div className="divide-y divide-border/40">
                  {lines.map(line => (
                    <div key={line.id} className="flex items-center gap-1.5 px-2.5 py-1.5">
                      <select
                        value={line.sign}
                        onChange={e => updateFormLine(kind, line.id, "sign", e.target.value as "+" | "-")}
                        className={`w-10 ${LINE_INPUT} text-center cursor-pointer`}
                      >
                        <option value="+">+</option>
                        <option value="-">−</option>
                      </select>
                      <CovAccountSelect
                        value={line.glAccount ?? ""}
                        onChange={(code, name) => updateFormLineAccount(kind, line.id, code, name)}
                      />
                      <input
                        type="number"
                        value={line.amount || ""}
                        onChange={e => updateFormLine(kind, line.id, "amount", parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className={`w-20 ${LINE_INPUT} text-right tabular-nums`}
                      />
                      <button
                        onClick={() => removeFormLine(kind, line.id)}
                        className="p-1 text-muted-foreground/50 hover:text-destructive transition-colors rounded-[4px] shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="px-2.5 py-1.5 bg-muted/30 flex items-center justify-end gap-2 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground">Subtotal:</span>
                  <span className="text-[11px] font-semibold tabular-nums">{total.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </>
            )}
          </div>
        );

        return (
          <>
            {/* Transparent click-outside backdrop — no color, no blur */}
            <div className="fixed inset-0 z-[59]" onClick={() => setEditingCovId(null)} />

            {/* Panel — positioned to exactly match the prompt-input width + 5px gap above it */}
            <div
              className="fixed z-[60] pointer-events-none"
              style={panelRect
                ? { left: panelRect.left, right: panelRect.right, bottom: panelRect.bottom }
                : { left: 24, right: 24, bottom: 124 }  /* fallback before first measure */
              }
            >
              <div className="w-full pointer-events-auto bg-background border border-border rounded-[12px] shadow-[0_2px_16px_rgba(0,0,0,0.09)] animate-in slide-in-from-bottom-4 fade-in duration-200 max-h-[58vh] flex flex-col">

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                    editingCov.status === "Breached" ? "bg-red-500"
                    : editingCov.status === "At Risk" ? "bg-amber-500"
                    : "bg-green-500"
                  }`} />
                  <span className="text-sm font-semibold text-foreground truncate">
                    {isNewCov
                      ? "Add New Covenant"
                      : (COV_NAME_OPTIONS.find(o => o.value === (draft.name ?? editingCov.name))?.label
                          ?? (draft.name ?? editingCov.name)) || "Edit Covenant"}
                  </span>
                  <StatusBadge status={draft.status ?? editingCov.status} />
                </div>
                <button
                  onClick={() => setEditingCovId(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-[6px] hover:bg-muted shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4">

                {/* All identity + value + schedule fields — single inline wrap row */}
                <div className="flex flex-wrap gap-x-3 gap-y-3">
                  {/* Name — widest field, takes priority */}
                  <div style={{ flex: "2 1 200px", minWidth: 0 }}>
                    <label className="block text-xs text-muted-foreground mb-1">Name</label>
                    <CovNameSelect
                      value={draft.name ?? editingCov.name}
                      onChange={v => {
                        const tmpl = COVENANT_TEMPLATES.find(t => t.id === v);
                        if (tmpl) {
                          setDraft(p => ({
                            ...p,
                            name:             v,
                            operator:         tmpl.operator,
                            threshold:        tmpl.threshold,
                            isRatioCovenant:  tmpl.isRatio,
                            useFormulaBuilder: true,
                            formulaLines:     tmpl.numeratorLines.map((l, i) => ({ ...l, id: `fl-num-${Date.now()}-${i}` })),
                            denominatorLines: (tmpl.denominatorLines ?? []).map((l, i) => ({ ...l, id: `fl-den-${Date.now()}-${i}` })),
                          }));
                        } else {
                          setD("name", v);
                        }
                      }}
                    />
                  </div>
                  {/* Type */}
                  <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                    <label className="block text-xs text-muted-foreground mb-1">Type</label>
                    <select value={draft.type ?? editingCov.type} onChange={e => setD("type", e.target.value)} className={FIELD}>
                      <option value="Quantitative">Quantitative</option>
                      <option value="Qualitative">Qualitative</option>
                    </select>
                  </div>
                  {/* Current Value */}
                  <div style={{ flex: "1 1 90px", minWidth: 0 }}>
                    <label className="block text-xs text-muted-foreground mb-1">Current Value</label>
                    <input type="number" step="0.01" value={draft.currentValue ?? ""}
                      onChange={e => setD("currentValue", parseFloat(e.target.value) || 0)}
                      className={FIELD} placeholder="e.g. 1.12" />
                  </div>
                  {/* Projected Value */}
                  <div style={{ flex: "1 1 90px", minWidth: 0 }}>
                    <label className="block text-xs text-muted-foreground mb-1">Projected Value</label>
                    <input type="number" step="0.01" value={draft.projectedValue ?? ""}
                      onChange={e => setD("projectedValue", parseFloat(e.target.value) || 0)}
                      className={FIELD} placeholder="e.g. 0.96" />
                  </div>
                  {/* Threshold */}
                  <div style={{ flex: "1 1 90px", minWidth: 0 }}>
                    <label className="block text-xs text-muted-foreground mb-1">Threshold</label>
                    <input type="number" step="0.01" value={draft.threshold ?? ""}
                      onChange={e => setD("threshold", parseFloat(e.target.value) || 0)}
                      className={FIELD} placeholder="e.g. 1.25" />
                  </div>
                  {/* Operator */}
                  <div style={{ flex: "1 1 140px", minWidth: 0 }}>
                    <label className="block text-xs text-muted-foreground mb-1">Operator</label>
                    <select value={draft.operator ?? ">="} onChange={e => setD("operator", e.target.value)} className={FIELD}>
                      <option value=">=">≥ greater or equal</option>
                      <option value="<=">≤ less or equal</option>
                      <option value=">">&gt; greater than</option>
                      <option value="<">&lt; less than</option>
                    </select>
                  </div>
                  {/* Frequency */}
                  <div style={{ flex: "1 1 110px", minWidth: 0 }}>
                    <label className="block text-xs text-muted-foreground mb-1">Frequency</label>
                    <select value={draft.frequency ?? "Annual"} onChange={e => setD("frequency", e.target.value)} className={FIELD}>
                      {["Annual","Semi-annual","Quarterly","Monthly"].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  {/* Last Tested */}
                  <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                    <label className="block text-xs text-muted-foreground mb-1">Last Tested</label>
                    <input type="date" value={draft.lastTested?.slice(0,10) ?? ""}
                      onChange={e => setD("lastTested", e.target.value)} className={FIELD} />
                  </div>
                </div>

                {/* Formula / Method */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Formula / Method</p>
                  <div className="space-y-2">
                    <FormulaSection kind="num" lines={numLines} total={numTotal} />
                    <FormulaSection kind="den" lines={denLines} total={denTotal} />
                  </div>

                  {/* Computed ratio */}
                  {computed !== null && (
                    <div className="mt-2.5 flex items-center justify-end gap-2 rounded-[8px] bg-primary/5 border border-primary/15 px-3 py-2">
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {numTotal.toLocaleString("en-CA", { maximumFractionDigits: 2 })} ÷ {denTotal.toLocaleString("en-CA", { maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[12px] font-bold text-primary tabular-nums">= {computed.toFixed(2)}x</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 shrink-0">
                <button
                  onClick={() => setEditingCovId(null)}
                  className="h-8 px-4 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-[8px] bg-background hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRerun}
                  className="inline-flex items-center gap-1.5 h-8 px-4 text-xs font-medium bg-primary text-primary-foreground rounded-[8px] hover:bg-primary/90 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" /> Save &amp; Rerun
                </button>
              </div>

              </div>{/* end inner panel */}
            </div>{/* end px-6 outer */}
          </>
        );
      })()}
    </div>
  );
}

// ── AJEs helpers (mirrors AJEsTab.tsx) ────────────────────────────────────────
const AJE_GL_ACCOUNTS = [
  { value: "7100 – Interest Expense (CAD)",           label: "7100 – Interest Expense (CAD)"           },
  { value: "7110 – Interest Expense (Variable)",       label: "7110 – Interest Expense (Variable)"      },
  { value: "7120 – Finance Charges",                  label: "7120 – Finance Charges"                  },
  { value: "7200 – Bank Charges & Interest",          label: "7200 – Bank Charges & Interest"          },
  { value: "2100 – Long-Term Debt",                   label: "2100 – Long-Term Debt"                   },
  { value: "2110 – Current Portion LT Debt",          label: "2110 – Current Portion LT Debt"          },
  { value: "2115 – Current Portion (Mortgage)",       label: "2115 – Current Portion (Mortgage)"       },
  { value: "2200 – Line of Credit",                   label: "2200 – Line of Credit"                   },
  { value: "2300 – Accrued Interest Payable",         label: "2300 – Accrued Interest Payable"         },
  { value: "2310 – Accrued Finance Charges",          label: "2310 – Accrued Finance Charges"          },
];
function ajeAccCode(account: string) { return account.split(/[\s–-]/)[0].trim(); }
function ajeDescOptions(account: string, loanName: string): string[] {
  const a = account.toLowerCase();
  const s = loanName ? ` – ${loanName}` : "";
  if (a.startsWith("71") || a.startsWith("72")) return [`YE accrued interest${s}`, `Interest expense accrual${s}`];
  if (a.includes("2300") || a.includes("2310"))  return [`YE accrued interest payable${s}`, `Interest accrual – year end`];
  if (a.includes("2110") || a.includes("2115"))  return [`Current portion reclass${s}`, `Reclassification – current portion LT debt`];
  if (a.startsWith("21"))                        return [`LT portion after reclass${s}`, `Long-term debt – reclassification`];
  return [];
}
const AJE_TYPE_LABEL: Record<string, string> = {
  AccruedInterest: "Accrued Interest", CurrentPortionReclass: "Current Portion Reclass",
  FXTranslation: "FX Translation", MissingSplit: "Missing Split", Manual: "Manual",
};

function AJEsTabPanel({ jes, loans }: { jes: JEProposal[]; loans: Loan[] }) {
  const { advanceJEStatus, deleteJE, restoreJE, purgeJE, updateJE } = useStore(s => ({
    advanceJEStatus: s.advanceJEStatus, deleteJE: s.deleteJE,
    restoreJE: s.restoreJE, purgeJE: s.purgeJE, updateJE: s.updateJE,
  }));

  const [expandedJEs,    setExpandedJEs]    = useState<Set<string>>(() => new Set(jes.filter(j => !j.deleted).map(j => j.id)));
  const [filterStatus,   setFilterStatus]   = useState<string>("All");
  const [customDescLines, setCustomDescLines] = useState<Set<string>>(new Set());

  const activeJes  = jes.filter(j => !j.deleted);
  const deletedJes = jes.filter(j =>  j.deleted);
  const draft    = activeJes.filter(j => j.status === "Draft").length;
  const approved = activeJes.filter(j => j.status === "Approved").length;
  const posted   = activeJes.filter(j => j.status === "Posted" || j.status === "Exported").length;

  const filtered = filterStatus === "Deleted"
    ? deletedJes
    : activeJes.filter(j => filterStatus === "All" || j.status === filterStatus);

  const totalD = (je: JEProposal) => je.lines.reduce((s, l) => s + l.debit,  0);
  const totalC = (je: JEProposal) => je.lines.reduce((s, l) => s + l.credit, 0);

  // Collect extra accounts from existing JEs
  const usedAccounts = Array.from(new Set(jes.flatMap(j => j.lines.map(l => l.account)).filter(Boolean)));
  const allAccounts  = [...AJE_GL_ACCOUNTS, ...usedAccounts.filter(a => !AJE_GL_ACCOUNTS.some(p => p.value === a)).map(a => ({ value: a, label: a }))];

  // Compact field classes (scaled for the Luka panel)
  const CI = "w-full h-7 text-[11px] px-2 border border-[#dcdfe4] rounded-[6px] bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40";
  const CS = `${CI} appearance-none cursor-pointer pr-6`;
  const CN = `${CI} text-right tabular-nums pr-2`;

  return (
    <div className="space-y-3">

      {/* Filter pills */}
      <div className="flex gap-1 flex-wrap">
        {(["All", "Draft", "Approved", "Posted", "Exported"] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-2.5 py-1 text-[11px] rounded-full font-medium transition-all ${filterStatus === s ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80"}`}>
            {s}
          </button>
        ))}
        <button onClick={() => setFilterStatus("Deleted")}
          className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-full font-medium transition-all ${filterStatus === "Deleted" ? "bg-red-500 text-white" : "bg-muted text-foreground hover:bg-muted/80"}`}>
          <Trash2 className="w-2.5 h-2.5" /> Deleted
          {deletedJes.length > 0 && (
            <span className={`ml-0.5 min-w-[14px] h-3.5 flex items-center justify-center rounded-full text-[9px] font-bold px-1 ${filterStatus === "Deleted" ? "bg-white/20" : "bg-red-100 text-red-600"}`}>{deletedJes.length}</span>
          )}
        </button>
      </div>

      {/* JE list */}
      <div className="space-y-2">
        {filtered.map(je => {
          const loan       = je.loanId ? loans.find(l => l.id === je.loanId) : null;
          const isExpanded = expandedJEs.has(je.id);
          const isBalanced = Math.abs(totalD(je) - totalC(je)) < 0.01;

          return (
            <div key={je.id} className={`rounded-[8px] border border-border overflow-hidden ${je.deleted ? "opacity-60" : ""}`}>
              {/* Header */}
              <button
                onClick={() => setExpandedJEs(prev => { const n = new Set(prev); isExpanded ? n.delete(je.id) : n.add(je.id); return n; })}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">{je.id.toUpperCase()}</span>
                  <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-foreground shrink-0">{AJE_TYPE_LABEL[je.type] ?? je.type}</span>
                  {loan && <span className="text-[10px] text-muted-foreground truncate">{loan.name}</span>}
                  {!isBalanced && <span className="inline-flex items-center rounded-full bg-red-100 text-red-600 border border-red-200 px-1.5 py-0.5 text-[9px] font-semibold shrink-0">Unbalanced</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <StatusBadge status={je.status} />
                  {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                </div>
              </button>

              {/* Expanded body */}
              {isExpanded && (
                <div className="border-t border-border">
                  <p className="px-3 pt-2 pb-1 text-[11px] font-medium text-foreground">{je.description}</p>

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
                      {je.lines.map(line => {
                        const descOpts   = ajeDescOptions(line.account, loan?.name ?? "");
                        const isCustom   = customDescLines.has(line.id);
                        return (
                          <tr key={line.id} className="border-b border-border hover:bg-muted/20">
                            {/* Account */}
                            <td className="py-1.5 px-3 min-w-[100px] w-[130px]">
                              <div className="relative">
                                <select className={`${CS} font-mono`} style={{ color: "transparent" }}
                                  value={line.account}
                                  onChange={e => updateJE(je.id, { lines: je.lines.map(l => l.id === line.id ? { ...l, account: e.target.value } : l) })}>
                                  {!allAccounts.some(a => a.value === line.account) && line.account && <option value={line.account}>{line.account}</option>}
                                  <option value="">Select</option>
                                  <optgroup label="Expense">{allAccounts.filter(a => a.value.startsWith("7")).map(a => <option key={a.value} value={a.value}>{a.label}</option>)}</optgroup>
                                  <optgroup label="Liability">{allAccounts.filter(a => a.value.startsWith("2")).map(a => <option key={a.value} value={a.value}>{a.label}</option>)}</optgroup>
                                </select>
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-mono text-foreground pointer-events-none select-none">
                                  {line.account ? ajeAccCode(line.account) : <span className="font-sans font-normal text-muted-foreground">Select</span>}
                                </span>
                                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                              </div>
                            </td>
                            {/* Description */}
                            <td className="py-1.5 px-3">
                              {isCustom ? (
                                <input type="text" autoFocus className={CI} value={line.description}
                                  placeholder="Enter custom description…"
                                  onChange={e => updateJE(je.id, { lines: je.lines.map(l => l.id === line.id ? { ...l, description: e.target.value } : l) })}
                                  onBlur={() => setCustomDescLines(prev => { const n = new Set(prev); n.delete(line.id); return n; })} />
                              ) : (
                                <div className="relative">
                                  <select className={CS} value={line.description}
                                    onChange={e => {
                                      if (e.target.value === "__custom__") {
                                        setCustomDescLines(prev => new Set([...prev, line.id]));
                                        updateJE(je.id, { lines: je.lines.map(l => l.id === line.id ? { ...l, description: "" } : l) });
                                      } else {
                                        updateJE(je.id, { lines: je.lines.map(l => l.id === line.id ? { ...l, description: e.target.value } : l) });
                                      }
                                    }}>
                                    <option value="">— select —</option>
                                    {descOpts.map(d => <option key={d} value={d}>{d}</option>)}
                                    {line.description && !descOpts.includes(line.description) && <option value={line.description}>{line.description}</option>}
                                    <option value="__custom__">＋ Custom…</option>
                                  </select>
                                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                                </div>
                              )}
                            </td>
                            {/* Debit */}
                            <td className="py-1.5 px-3 w-24">
                              <input type="number" min="0" step="0.01" className={CN} value={line.debit || ""} placeholder="0.00"
                                onChange={e => updateJE(je.id, { lines: je.lines.map(l => l.id === line.id ? { ...l, debit: parseFloat(e.target.value) || 0 } : l) })} />
                            </td>
                            {/* Credit */}
                            <td className="py-1.5 px-3 w-24">
                              <input type="number" min="0" step="0.01" className={CN} value={line.credit || ""} placeholder="0.00"
                                onChange={e => updateJE(je.id, { lines: je.lines.map(l => l.id === line.id ? { ...l, credit: parseFloat(e.target.value) || 0 } : l) })} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-muted/30 font-semibold text-[11px]">
                        <td className="py-2 px-3 text-foreground" colSpan={2}>Total</td>
                        <td className="py-2 px-3 text-right tabular-nums">{fmt(totalD(je))}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{fmt(totalC(je))}</td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Notes */}
                  <div className="px-3 py-2.5 border-t border-border bg-background">
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</label>
                    <textarea rows={2} className="w-full text-[11px] px-2.5 py-2 rounded-[6px] border border-[#dcdfe4] bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
                      placeholder="Add a note for this entry…"
                      value={je.notes ?? ""}
                      onChange={e => updateJE(je.id, { notes: e.target.value })} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 px-3 py-2.5 border-t border-border bg-muted/20">
                    {je.deleted ? (
                      <>
                        <span className="text-[11px] text-muted-foreground italic flex-1">Deleted</span>
                        <button onClick={() => { restoreJE(je.id); toast.success("JE restored"); }}
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[6px] border border-border bg-background text-[11px] font-medium text-foreground hover:bg-muted transition-colors">
                          <RotateCcw className="h-3 w-3" /> Restore
                        </button>
                        <button onClick={() => { purgeJE(je.id); toast("JE permanently deleted", { icon: "🗑️" }); }}
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[6px] border border-red-200 bg-background text-[11px] font-medium text-red-500 hover:text-red-700 hover:border-red-300 transition-colors">
                          <Trash2 className="h-3 w-3" /> Delete Permanently
                        </button>
                      </>
                    ) : (
                      <>
                        {je.status === "Draft" && (
                          <button onClick={() => { advanceJEStatus(je.id, "Approved", "K. Chen"); toast.success("JE approved"); }}
                            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[6px] bg-emerald-600 text-white text-[11px] font-medium hover:bg-emerald-700 transition-colors">
                            <Check className="h-3 w-3" /> Approve
                          </button>
                        )}
                        {je.status === "Approved" && (
                          <button onClick={() => { advanceJEStatus(je.id, "Posted", "K. Chen"); toast.success("JE posted"); }}
                            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[6px] bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 transition-colors">
                            <Send className="h-3 w-3" /> Post
                          </button>
                        )}
                        {(je.status === "Draft" || je.status === "Approved") && (
                          <button onClick={() => advanceJEStatus(je.id, "Draft", "")}
                            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[6px] border border-border bg-background text-[11px] font-medium text-foreground hover:bg-muted transition-colors">
                            Revert to Draft
                          </button>
                        )}
                        <button onClick={() => { deleteJE(je.id); toast("JE moved to Deleted", { icon: "🗑️" }); }}
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

function NotesTabPanel({ loans, continuity, reconciliation, settings }: {
  loans: Loan[];
  continuity: ContinuityRow[];
  reconciliation: ReconciliationItem[];
  settings: EngagementSettings;
}) {
  const yearEnd = settings.fiscalYearEnd;
  const rows = useMemo(() => loans.map(loan => {
    const recon = reconciliation.find(r => r.loanId === loan.id && r.accountType === "Principal");
    const tbBal = recon?.tbBalance ?? loan.currentBalance;
    const pyRows = continuity.filter(r => r.loanId === loan.id).sort((a,b) => a.period.localeCompare(b.period));
    const pyBal = pyRows.length > 0 ? pyRows[0].openingBalance : null;
    const ccy = loan.currency !== "CAD" ? `${loan.currency} ` : "";
    const typeLabel = loan.type === "LOC" ? "line of credit" : loan.type === "Revolver" ? "revolving credit facility" : loan.type === "Mortgage" ? "mortgage" : "term loan";
    const note = `${loan.name} — ${ccy}${typeLabel} with ${loan.lender} at ${loan.rate}% per annum, ${loan.interestType.toLowerCase()} rate, payable in ${loan.paymentFrequency.toLowerCase()} ${loan.paymentType} payments, matures ${fmtDate(loan.maturityDate)}.`;
    return { loan, tbBal, pyBal, note };
  }), [loans, continuity, reconciliation]);

  const totalCY = rows.reduce((s,r)=>s+toCAD(r.tbBal, r.loan.currency), 0);
  const totalCurr = loans.reduce((s,l)=>s+toCAD(l.currentPortion, l.currency), 0);

  return (
    <div className="space-y-3">
      <div className="rounded-[8px] border border-border overflow-hidden">
        <div className="px-3 py-2 bg-muted/40 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wide">Long-term Debt</span>
            <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{loans.length} active facilities</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Auto-populated from Loan Register & Continuity</span>
        </div>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-muted/20 border-b border-border">
              <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide w-[55%]"></th>
              <th className="text-right px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{yearEnd?.slice(0,10).replace(/-/g, "-")}</th>
              <th className="text-right px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Prior Year</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.loan.id} className={`border-b border-border/40 ${i%2===0?"":"bg-muted/10"}`}>
                <td className="px-3 py-2 align-top">
                  <p className="text-[11px] text-foreground leading-snug">{r.note}</p>
                </td>
                <td className="px-3 py-2 text-right tabular-nums font-medium align-top">{fmtNum(toCAD(r.tbBal, r.loan.currency))}</td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground align-top">{r.pyBal !== null ? fmtNum(toCAD(r.pyBal, r.loan.currency)) : "n/a"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border">
              <td className="px-3 py-2 text-[11px] text-muted-foreground font-medium" colSpan={3} />
            </tr>
            <tr className="border-t border-border/40">
              <td className="px-3 py-1.5 text-[11px] text-foreground"></td>
              <td className="px-3 py-1.5 text-right tabular-nums text-[11px] font-semibold border-t border-border">{fmtNum(totalCY)}</td>
              <td className="px-3 py-1.5 text-right tabular-nums text-[11px] text-muted-foreground border-t border-border">—</td>
            </tr>
            <tr className="border-t border-border/40">
              <td className="px-3 py-1 text-[11px] text-muted-foreground italic">Less: current portion</td>
              <td className="px-3 py-1 text-right tabular-nums text-[11px] text-red-600">{fmtParen(totalCurr)}</td>
              <td className="px-3 py-1 text-right tabular-nums text-[11px] text-muted-foreground">—</td>
            </tr>
            <tr className="border-t border-border font-bold">
              <td className="px-3 py-2 text-[11px] text-foreground">Total</td>
              <td className="px-3 py-2 text-right tabular-nums text-[11px] border-t-2 border-foreground">{fmtNum(totalCY - totalCurr)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-[11px] border-t-2 border-muted-foreground text-muted-foreground">—</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Post to Notes action */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Review balances above, then post to lock the note into the workpaper.
        </p>
        <button
          onClick={() => toast.success("Long-term Debt note posted to workpaper")}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shrink-0 ml-3"
        >
          <FileCheck className="h-3.5 w-3.5" /> Post to Notes
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const TABS = [
  { id: "loans",        label: "Loans",        Icon: Building2  },
  { id: "continuity",   label: "Continuity",   Icon: Layers     },
  { id: "amortization", label: "Amortization", Icon: BarChart2  },
  { id: "covenants",    label: "Covenants",    Icon: ShieldCheck},
  { id: "ajes",         label: "AJEs",         Icon: Receipt    },
  { id: "notes",        label: "Notes",        Icon: BookOpen   },
] as const;

type TabId = typeof TABS[number]["id"];

export function LongTermAssetResponse() {
  const { loans, covenants, amortization, continuity, jes, reconciliation, settings } = useStore(s => ({
    loans:          s.loans.filter(l => l.status === "Active"),
    covenants:      s.covenants,
    amortization:   s.amortization,
    continuity:     s.continuity,
    jes:            s.jes,
    reconciliation: s.reconciliation,
    settings:       s.settings,
  }));

  const [activeTab, setActiveTab] = useState<TabId>("loans");

  // ── Add-to-Workpaper slide-up ──────────────────────────────────────────────
  const [addToWpOpen,   setAddToWpOpen]   = useState(false);
  const [selectedSheet, setSelectedSheet] = useState("pr-ltl-jj");
  const [wpRect, setWpRect] = useState<{ left: number; right: number; bottom: number } | null>(null);

  useLayoutEffect(() => {
    if (!addToWpOpen) { setWpRect(null); return; }
    const el = document.querySelector(".luka-gradient-border") as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setWpRect({ left: r.left, right: window.innerWidth - r.right, bottom: window.innerHeight - r.top + 8 });
  }, [addToWpOpen]);

  const LT_LEAD_SHEETS = [
    { id: "pr-ltl-jj", code: "JJ", label: "Other long-term liabilities" },
  ];

  const totalDebt           = loans.reduce((s, l) => s + toCAD(l.currentBalance, l.currency), 0);
  const totalCurrentPortion = loans.reduce((s, l) => s + toCAD(l.currentPortion, l.currency), 0);
  const totalLT             = loans.reduce((s, l) => s + toCAD(l.longTermPortion, l.currency), 0);
  const totalAccrued        = loans.reduce((s, l) => s + toCAD(l.accruedInterest, l.currency), 0);
  const breachedCount       = covenants.filter(c => c.status === "Breached").length;
  const atRiskCount         = covenants.filter(c => c.status === "At Risk").length;
  const covenantAlert       = breachedCount + atRiskCount;

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-1 duration-300">

      {/* Intro */}
      <p className="text-sm text-foreground leading-relaxed">
        Here's a full summary of your <strong>Long-term Debt workpaper</strong> for{" "}
        <span className="font-medium text-primary">{settings.client || "this engagement"}</span> as at{" "}
        <span className="font-medium">{settings.fiscalYearEnd?.slice(0,10).replace(/-/g, "-")}</span>:
      </p>


      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-border -mx-0 overflow-x-auto">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          const hasBadge = id === "covenants" && covenantAlert > 0;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <Icon className="h-3 w-3 shrink-0" />
              {label}
              {hasBadge && (
                <span className="ml-1 text-[9px] font-bold text-red-700 bg-red-100 border border-red-200 rounded-full px-1 py-0.5 leading-none">
                  {covenantAlert}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="min-w-0">
        {activeTab === "loans"        && <LoansTab loans={loans} />}
        {activeTab === "continuity"   && <ContinuityTabPanel loans={loans} continuity={continuity} />}
        {activeTab === "amortization" && <AmortizationTabPanel loans={loans} amortization={amortization} />}
        {activeTab === "covenants"    && <CovenantsTabPanel loans={loans} covenants={covenants} />}
        {activeTab === "ajes"         && <AJEsTabPanel jes={jes} loans={loans} />}
        {activeTab === "notes"        && <NotesTabPanel loans={loans} continuity={continuity} reconciliation={reconciliation} settings={settings} />}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
        <button onClick={() => setAddToWpOpen(true)} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add to Workpaper
        </button>

        <button onClick={() => toast.success("Downloading workpaper…")} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors">
          <Download className="h-3.5 w-3.5" /> Download
        </button>
        <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied to clipboard"); }} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors">
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>
        <button onClick={() => toast.success("Re-running analysis…")} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors">
          <RotateCcw className="h-3.5 w-3.5" /> Rerun
        </button>
      </div>

      {/* Add-to-Workpaper slide-up modal */}
      {addToWpOpen && (
        <>
          <div className="fixed inset-0 z-[59]" onClick={() => setAddToWpOpen(false)} />
          <div
            className="fixed z-[60] pointer-events-none"
            style={wpRect
              ? { left: wpRect.left, right: wpRect.right, bottom: wpRect.bottom }
              : { left: 24, right: 24, bottom: 124 }}
          >
            <div className="w-full pointer-events-auto bg-background border border-border rounded-[12px] shadow-[0_2px_16px_rgba(0,0,0,0.09)] animate-in slide-in-from-bottom-4 fade-in duration-200 flex flex-col">

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <span className="text-sm font-semibold text-foreground">Add to Workpaper</span>
                <button onClick={() => setAddToWpOpen(false)} className="p-1 rounded-[6px] hover:bg-muted transition-colors text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-4 py-4 space-y-3">
                <p className="text-xs text-muted-foreground">Select a lead sheet under <span className="font-medium text-foreground">Long-term liabilities</span> to add this workpaper to:</p>

                {/* Folder header */}
                <div className="flex items-center gap-2 px-1 pb-1">
                  <Folder className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs font-medium text-foreground">Long-term liabilities</span>
                </div>

                {/* Lead sheet options */}
                <div className="space-y-1.5 pl-4">
                  {LT_LEAD_SHEETS.map(sheet => (
                    <button
                      key={sheet.id}
                      onClick={() => setSelectedSheet(sheet.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] border text-left transition-colors ${
                        selectedSheet === sheet.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-semibold text-primary shrink-0">{sheet.code}</span>
                      <span className="text-xs text-foreground truncate flex-1">{sheet.label}</span>
                      {selectedSheet === sheet.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 shrink-0">
                <button onClick={() => setAddToWpOpen(false)}
                  className="h-8 px-4 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-[8px] bg-background hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const sheet = LT_LEAD_SHEETS.find(s => s.id === selectedSheet);
                    toast.success(`Added to ${sheet?.code} — ${sheet?.label}`);
                    setAddToWpOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 h-8 px-4 text-xs font-medium bg-primary text-primary-foreground rounded-[8px] hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-3 w-3" /> Add to Lead Sheet
                </button>
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
}
