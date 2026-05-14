import { useMemo, useState, useLayoutEffect, useRef, useEffect } from "react";
import {
  AlertTriangle, Calendar, DollarSign, BarChart2,
  ChevronDown, ChevronUp, FileSpreadsheet, Plus, CheckCircle2,
  ShieldAlert, ShieldCheck, Activity, CreditCard,
  Building2, FileText, BookOpen, Receipt, Layers, FileCheck, Send, TrendingUp,
  Download, Copy, RotateCcw, X, Trash2, Search, Check, Pencil,
} from "lucide-react";
import { COVENANT_TEMPLATES } from "@/lib/covenantTemplates";
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

// ─── Small badge helpers ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Breached: "bg-red-50 text-red-700 border-red-200",
    "At Risk": "bg-amber-50 text-amber-700 border-amber-200",
    OK: "bg-green-50 text-green-700 border-green-200",
    Draft: "bg-muted text-muted-foreground border-border",
    Approved: "bg-blue-50 text-blue-700 border-blue-200",
    Posted: "bg-green-50 text-green-700 border-green-200",
    Exported: "bg-purple-50 text-purple-700 border-purple-200",
  };
  const cls = map[status] ?? "bg-muted text-muted-foreground border-border";
  const icon =
    status === "Breached" ? <AlertTriangle className="h-2.5 w-2.5" /> :
    status === "At Risk"  ? <AlertTriangle className="h-2.5 w-2.5" /> :
    status === "OK"       ? <CheckCircle2  className="h-2.5 w-2.5" /> :
    status === "Approved" ? <CheckCircle2  className="h-2.5 w-2.5" /> :
    status === "Posted"   ? <CheckCircle2  className="h-2.5 w-2.5" /> : null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] border ${cls}`}>
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

// ─── GL dropdown (auto-mapped, user can override + save) ─────────────────────

function GLSelect({ loanId, value, options, field, onSave }: {
  loanId: string;
  value: string;
  options: AccountMapping[];
  field: "glPrincipalAccount" | "glAccruedInterestAccount" | "glInterestExpenseAccount";
  onSave: (id: string, field: string, code: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={e => { onSave(loanId, field, e.target.value); toast.success(`GL mapping saved`); }}
      className="text-[10px] font-mono text-primary bg-background border border-border rounded-[4px] px-1.5 py-0.5 cursor-pointer hover:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40 max-w-[90px]"
      title={options.find(o => o.code === value)?.name ?? value}
    >
      {options.map(o => (
        <option key={o.code} value={o.code}>{o.code} — {o.name}</option>
      ))}
    </select>
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

  useLayoutEffect(() => {
    if (!newLoanOpen) { setPanelRect(null); return; }
    const measure = () => {
      const inputBox = document
        .querySelector<HTMLElement>('input[placeholder="Type # for prompts or just ask anything..."]')
        ?.closest<HTMLElement>(".luka-gradient-border");
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
    setNewLoanOpen(false);
    setNewLoan(EMPTY_LOAN_DRAFT());
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

  // Column headers — exact order from full Loan Register page
  const HEADERS = [
    { h: "Loan Name",       left: true },
    { h: "Lender",          left: true },
    { h: "Current Collateral", left: true },
    { h: "Type",            left: false },
    { h: "Rate Type",       left: false },
    { h: "Int. Rate (%)",   left: false },
    { h: "Start",           left: false },
    { h: "Maturity",        left: false },
    { h: "Tenure (Mo.)",    left: false },
    { h: "First Payment",   left: false },
    { h: "CCY",             left: false },
    { h: "Mo. Payment",     left: false },
    { h: "Orig. Loan Amt",  left: false },
    { h: "FX Rate",         left: false },
    { h: "Converted Amt",   left: false },
    { h: "Closing Balance", left: false },
    { h: "GL Principal",    left: false },
    { h: "Day Count",       left: false },
    { h: "Payment Type",    left: false },
    { h: "Compounding",     left: false },
    { h: "IO Period (mo.)", left: false },
    { h: "Balloon Amt",     left: false },
    { h: "Status",          left: false },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-[8px] border border-border overflow-hidden">
        <div className="px-3 py-2 bg-muted/40 border-b border-border flex items-center justify-between">
          <span className="text-[11px] font-semibold text-foreground">Loan Register</span>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground">Manage facilities, terms, and GL mappings</span>
            <button
              onClick={() => { setNewLoan(EMPTY_LOAN_DRAFT()); setNewLoanOpen(true); }}
              className="inline-flex items-center gap-1 h-7 px-2.5 text-[11px] font-medium bg-primary text-primary-foreground rounded-[7px] hover:bg-primary/90 transition-colors shrink-0"
            >
              <Plus className="h-3 w-3" /> New Loan
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="text-[11px]" style={{ minWidth: "1600px" }}>
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {HEADERS.map(({ h, left }) => (
                  <th key={h} className={`px-2.5 py-2 font-semibold text-muted-foreground uppercase tracking-wide text-[10px] whitespace-nowrap ${left ? "text-left" : "text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loans.map((l, i) => {
                const fx       = getFxRate(l);
                const pmt      = calcMonthlyPmt(l);
                const pmtCAD   = pmt !== null ? pmt * fx : null;
                const convAmt  = l.originalPrincipal * fx;
                const closingCAD = (l.closingBalance ?? l.currentBalance) * fx;
                return (
                  <tr key={l.id} className={`border-b border-border/40 ${i%2===0?"":"bg-muted/10"}`}>
                    {/* Loan Name */}
                    <td className="px-2.5 py-1.5 min-w-[130px]">
                      <p className="font-medium text-foreground whitespace-nowrap">{l.name}</p>
                    </td>
                    {/* Lender */}
                    <td className="px-2.5 py-1.5 text-foreground whitespace-nowrap min-w-[130px]">{l.lender}</td>
                    {/* Current Collateral */}
                    <td className="px-2.5 py-1.5 text-foreground max-w-[120px]">
                      <span className="text-[10px] line-clamp-2" title={l.securityDescription ?? "—"}>
                        {l.securityDescription ?? "—"}
                      </span>
                    </td>
                    {/* Type */}
                    <td className="px-2.5 py-1.5 text-right">
                      <span className="px-1.5 py-0.5 rounded-[4px] bg-muted text-foreground text-[10px]">{l.type}</span>
                    </td>
                    {/* Rate Type */}
                    <td className="px-2.5 py-1.5 text-right">
                      <span className={`text-[10px] font-medium ${l.interestType==="Variable"||l.interestType==="Floating"?"text-amber-600":"text-foreground"}`}>{l.interestType}</span>
                    </td>
                    {/* Int. Rate */}
                    <td className="px-2.5 py-1.5 text-right tabular-nums font-medium">{l.rate.toFixed(2)}%</td>
                    {/* Start */}
                    <td className="px-2.5 py-1.5 text-right whitespace-nowrap text-foreground">{fmtDate(l.startDate)}</td>
                    {/* Maturity */}
                    <td className="px-2.5 py-1.5 text-right whitespace-nowrap text-foreground">{fmtDate(l.maturityDate)}</td>
                    {/* Tenure (Mo.) */}
                    <td className="px-2.5 py-1.5 text-right tabular-nums text-foreground">{getTenure(l)}</td>
                    {/* First Payment */}
                    <td className="px-2.5 py-1.5 text-right whitespace-nowrap text-foreground">
                      {l.firstPaymentDate ? fmtDate(l.firstPaymentDate) : "—"}
                    </td>
                    {/* CCY */}
                    <td className="px-2.5 py-1.5 text-right">
                      <span className="text-[10px] font-medium text-foreground border border-border rounded-[4px] px-1.5 py-0.5">{l.currency}</span>
                    </td>
                    {/* Mo. Payment */}
                    <td className="px-2.5 py-1.5 text-right tabular-nums whitespace-nowrap">
                      {pmtCAD !== null
                        ? <span className="font-mono text-foreground">{fmt(pmtCAD)}{!l.monthlyPayment && <span className="text-muted-foreground text-[9px] ml-0.5" title="Auto-calculated">~</span>}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    {/* Orig. Loan Amt */}
                    <td className="px-2.5 py-1.5 text-right tabular-nums text-foreground whitespace-nowrap">{fmt(l.originalPrincipal)}</td>
                    {/* FX Rate */}
                    <td className="px-2.5 py-1.5 text-right">
                      {l.currency === "CAD"
                        ? <span className="text-muted-foreground">—</span>
                        : <div className="flex flex-col items-end gap-0.5">
                            <span className="font-mono text-[10px] text-foreground tabular-nums">{fx.toFixed(4)}</span>
                            <span className="text-[9px] text-muted-foreground">{l.fxRateType ?? "Closing"}</span>
                          </div>}
                    </td>
                    {/* Converted Amt */}
                    <td className="px-2.5 py-1.5 text-right tabular-nums font-semibold text-foreground whitespace-nowrap">{fmt(convAmt)}</td>
                    {/* Closing Balance */}
                    <td className="px-2.5 py-1.5 text-right tabular-nums font-semibold text-foreground whitespace-nowrap">{fmt(closingCAD)}</td>
                    {/* GL Principal */}
                    <td className="px-2.5 py-1.5 text-right">
                      <GLSelect loanId={l.id} value={l.glPrincipalAccount} options={principalAccts} field="glPrincipalAccount" onSave={handleGLSave} />
                    </td>
                    {/* Day Count */}
                    <td className="px-2.5 py-1.5 text-right font-mono text-foreground whitespace-nowrap">{l.dayCountBasis}</td>
                    {/* Payment Type */}
                    <td className="px-2.5 py-1.5 text-right whitespace-nowrap text-foreground">{l.paymentType}</td>
                    {/* Compounding */}
                    <td className="px-2.5 py-1.5 text-right whitespace-nowrap text-foreground">{l.compoundingFrequency ?? "Monthly"}</td>
                    {/* IO Period */}
                    <td className="px-2.5 py-1.5 text-right tabular-nums text-foreground">{l.interestOnlyPeriodMonths ?? "—"}</td>
                    {/* Balloon Amt */}
                    <td className="px-2.5 py-1.5 text-right tabular-nums text-foreground">
                      {l.balloonAmount ? fmt(l.balloonAmount) : "00"}
                    </td>
                    {/* Status */}
                    <td className="px-2.5 py-1.5 text-right"><StatusBadge status={l.status} /></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/30 border-t border-border font-semibold">
                <td className="px-2.5 py-2 text-[11px] text-foreground" colSpan={12}>Total · {loans.length} facilities</td>
                <td className="px-2.5 py-2 text-right tabular-nums text-[11px]">{fmt(loans.reduce((s,l)=>s+l.originalPrincipal,0))}</td>
                <td />
                <td className="px-2.5 py-2 text-right tabular-nums text-[11px]">{fmt(loans.reduce((s,l)=>s+l.originalPrincipal*getFxRate(l),0))}</td>
                <td className="px-2.5 py-2 text-right tabular-nums text-[11px]">{fmt(loans.reduce((s,l)=>s+toCAD(l.closingBalance??l.currentBalance,l.currency),0))}</td>
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
          {!glBalanced && (
            <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Balance check failed
            </span>
          )}
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
        const LF = "h-8 w-full text-[11px] px-2.5 border border-border rounded-[8px] bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40";
        return (
          <>
            <div className="fixed inset-0 z-[59]" onClick={() => setNewLoanOpen(false)} />
            <div
              className="fixed z-[60] pointer-events-none"
              style={panelRect
                ? { left: panelRect.left, right: panelRect.right, bottom: panelRect.bottom }
                : { left: 24, right: 24, bottom: 124 }}
            >
              <div className="w-full pointer-events-auto bg-background border border-border rounded-[12px] shadow-[0_2px_16px_rgba(0,0,0,0.09)] animate-in slide-in-from-bottom-4 fade-in duration-200 max-h-[62vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                  <span className="text-sm font-semibold text-foreground">Add New Loan</span>
                  <button onClick={() => setNewLoanOpen(false)} className="p-1 rounded-[6px] hover:bg-muted transition-colors text-muted-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-4 py-4">
                  <div className="flex flex-wrap gap-x-3 gap-y-3">
                    {/* Name */}
                    <div style={{ flex: "3 1 180px", minWidth: 0 }}>
                      <label className="block text-[10px] text-muted-foreground mb-1">Loan Name <span className="text-red-500">*</span></label>
                      <input className={LF} placeholder="e.g. Term Loan A" value={newLoan.name ?? ""} onChange={e => setF("name", e.target.value)} />
                    </div>
                    {/* Lender */}
                    <div style={{ flex: "2 1 140px", minWidth: 0 }}>
                      <label className="block text-[10px] text-muted-foreground mb-1">Lender <span className="text-red-500">*</span></label>
                      <input className={LF} placeholder="e.g. Royal Bank of Canada" value={newLoan.lender ?? ""} onChange={e => setF("lender", e.target.value)} />
                    </div>
                    {/* Ref Number */}
                    <div style={{ flex: "1 1 110px", minWidth: 0 }}>
                      <label className="block text-[10px] text-muted-foreground mb-1">Ref. Number</label>
                      <input className={LF} placeholder="e.g. RBC-2025-001" value={newLoan.refNumber ?? ""} onChange={e => setF("refNumber", e.target.value)} />
                    </div>
                    {/* Type */}
                    <div style={{ flex: "1 1 100px", minWidth: 0 }}>
                      <label className="block text-[10px] text-muted-foreground mb-1">Type</label>
                      <select className={LF} value={newLoan.type ?? "Term"} onChange={e => setF("type", e.target.value)}>
                        {["Term","LOC","Revolver","Mortgage","Bridge"].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    {/* Currency */}
                    <div style={{ flex: "1 1 80px", minWidth: 0 }}>
                      <label className="block text-[10px] text-muted-foreground mb-1">Currency</label>
                      <select className={LF} value={newLoan.currency ?? "CAD"} onChange={e => setF("currency", e.target.value)}>
                        {["CAD","USD","EUR","GBP"].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    {/* Interest Type */}
                    <div style={{ flex: "1 1 110px", minWidth: 0 }}>
                      <label className="block text-[10px] text-muted-foreground mb-1">Interest Type</label>
                      <select className={LF} value={newLoan.interestType ?? "Fixed"} onChange={e => setF("interestType", e.target.value)}>
                        {["Fixed","Variable","Floating","Hybrid","Step Rate"].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    {/* Day Count */}
                    <div style={{ flex: "1 1 100px", minWidth: 0 }}>
                      <label className="block text-[10px] text-muted-foreground mb-1">Day Count</label>
                      <select className={LF} value={newLoan.dayCountBasis ?? "ACT/365"} onChange={e => setF("dayCountBasis", e.target.value)}>
                        {["ACT/365","ACT/360","30/360"].map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    {/* Rate */}
                    <div style={{ flex: "1 1 80px", minWidth: 0 }}>
                      <label className="block text-[10px] text-muted-foreground mb-1">Rate (%) <span className="text-red-500">*</span></label>
                      <input type="number" step="0.01" className={LF} placeholder="5.25" value={newLoan.rate || ""} onChange={e => setF("rate", parseFloat(e.target.value) || 0)} />
                    </div>
                    {/* Original Principal */}
                    <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                      <label className="block text-[10px] text-muted-foreground mb-1">Original Principal <span className="text-red-500">*</span></label>
                      <input type="number" step="1000" className={LF} placeholder="1,000,000" value={newLoan.originalPrincipal || ""} onChange={e => setF("originalPrincipal", parseFloat(e.target.value) || 0)} />
                    </div>
                    {/* Current Balance */}
                    <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                      <label className="block text-[10px] text-muted-foreground mb-1">Current Balance</label>
                      <input type="number" step="1000" className={LF} placeholder="Same as original" value={newLoan.currentBalance || ""} onChange={e => setF("currentBalance", parseFloat(e.target.value) || 0)} />
                    </div>
                    {/* Start Date */}
                    <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                      <label className="block text-[10px] text-muted-foreground mb-1">Start Date <span className="text-red-500">*</span></label>
                      <input type="date" className={LF} value={newLoan.startDate ?? ""} onChange={e => setF("startDate", e.target.value)} />
                    </div>
                    {/* Maturity Date */}
                    <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                      <label className="block text-[10px] text-muted-foreground mb-1">Maturity Date <span className="text-red-500">*</span></label>
                      <input type="date" className={LF} value={newLoan.maturityDate ?? ""} onChange={e => setF("maturityDate", e.target.value)} />
                    </div>
                    {/* First Payment Date */}
                    <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                      <label className="block text-[10px] text-muted-foreground mb-1">First Payment Date</label>
                      <input type="date" className={LF} value={newLoan.firstPaymentDate ?? ""} onChange={e => setF("firstPaymentDate", e.target.value)} />
                    </div>
                    {/* Payment Frequency */}
                    <div style={{ flex: "1 1 110px", minWidth: 0 }}>
                      <label className="block text-[10px] text-muted-foreground mb-1">Payment Frequency</label>
                      <select className={LF} value={newLoan.paymentFrequency ?? "Monthly"} onChange={e => setF("paymentFrequency", e.target.value)}>
                        {["Monthly","Quarterly","Semi-annual","Annual"].map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    {/* Payment Type */}
                    <div style={{ flex: "1 1 110px", minWidth: 0 }}>
                      <label className="block text-[10px] text-muted-foreground mb-1">Payment Type</label>
                      <select className={LF} value={newLoan.paymentType ?? "P&I"} onChange={e => setF("paymentType", e.target.value)}>
                        {["P&I","Interest-only","Balloon"].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    {/* Security Description */}
                    <div style={{ flex: "1 0 100%", minWidth: 0 }}>
                      <label className="block text-[10px] text-muted-foreground mb-1">Security / Collateral Description</label>
                      <input className={LF} placeholder="e.g. General Security Agreement over all assets" value={newLoan.securityDescription ?? ""} onChange={e => setF("securityDescription", e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 shrink-0">
                  <button onClick={() => setNewLoanOpen(false)}
                    className="h-8 px-4 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-[8px] bg-background hover:bg-muted transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSaveLoan}
                    className="inline-flex items-center gap-1.5 h-8 px-4 text-xs font-medium bg-primary text-primary-foreground rounded-[8px] hover:bg-primary/90 transition-colors">
                    <Plus className="h-3 w-3" /> Add Loan &amp; Run Amortization
                  </button>
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
                    <td className="px-2.5 py-2 text-[11px] text-foreground">Total · {loans.length} facilities</td>
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
                    <td className="px-3 py-2 text-[11px] text-foreground">Total · {loans.length} facilities</td>
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
                  <td className="px-3 py-2 text-[11px] text-foreground">Total · {loans.length} facilities</td>
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
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Remaining Balance",  value: fmt(remaining),         sub: "Opening balance" },
            { label: "Total Interest",      value: fmt(totalInterest),     sub: "Full schedule" },
            { label: "Monthly Payment",     value: fmt(monthly),           sub: `${loan.paymentType}` },
            { label: "Maturity",            value: fmtDate(loan.maturityDate), sub: `${loan.rate}% ${loan.dayCountBasis}` },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-[8px] border border-border bg-background px-3 py-2">
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
        className="w-full h-8 pl-2.5 pr-7 text-left text-[11px] border border-border rounded-[8px] bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 flex items-center overflow-hidden relative"
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
      const inputBox = document
        .querySelector<HTMLElement>('input[placeholder="Type # for prompts or just ask anything..."]')
        ?.closest<HTMLElement>(".luka-gradient-border");
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

  const FIELD = "h-8 w-full text-[11px] px-2.5 border border-border rounded-[8px] bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40";
  const LINE_INPUT = "h-7 text-[11px] px-2 border border-border rounded-[6px] bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40";

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
                {["","Covenant","Type","Status","Current","Projected","Threshold","Frequency","Last Tested",""].map(h=>(
                  <th key={h} className={`px-2.5 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide ${h===""||h==="Covenant"||h==="Type"||h==="Frequency"||h==="Last Tested"?"text-left":"text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loanCovs.map((cov, i) => (
                <tr key={cov.id} className={`border-b border-border/40 ${i%2===0?"":"bg-muted/10"}`}>
                  <td className="px-2.5 py-2 w-4">
                    <span className={`inline-block w-2 h-2 rounded-full ${cov.status==="Breached"?"bg-red-500":cov.status==="At Risk"?"bg-amber-500":"bg-green-500"}`} />
                  </td>
                  <td className="px-2.5 py-2 font-medium text-foreground whitespace-nowrap">{cov.name}</td>
                  <td className="px-2.5 py-2 text-muted-foreground">{cov.type}</td>
                  <td className="px-2.5 py-2"><StatusBadge status={cov.status} /></td>
                  <td className="px-2.5 py-2 text-right tabular-nums font-medium">{cov.currentValue !== undefined ? `${cov.currentValue.toFixed(2)}x` : "—"}</td>
                  <td className="px-2.5 py-2 text-right tabular-nums text-muted-foreground">
                    {cov.projectedValue !== undefined
                      ? <span className={cov.projectedValue < (cov.threshold ?? 0) ? "text-red-600" : "text-muted-foreground"}>{cov.projectedValue.toFixed(2)}x</span>
                      : "—"}
                  </td>
                  <td className="px-2.5 py-2 text-right tabular-nums">{cov.threshold !== undefined ? `${cov.operator} ${cov.threshold}x` : "—"}</td>
                  <td className="px-2.5 py-2 text-muted-foreground">{cov.frequency}</td>
                  <td className="px-2.5 py-2 text-muted-foreground whitespace-nowrap">{cov.lastTested ? fmtDate(cov.lastTested) : "—"}</td>
                  <td className="px-2.5 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => openEdit(cov)}
                        className="p-1.5 hover:bg-muted rounded-lg text-foreground transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (editingCovId === cov.id) setEditingCovId(null);
                          deleteCovenant(cov.id);
                          toast.success("Covenant deleted");
                        }}
                        className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
                      <input
                        value={line.description}
                        onChange={e => updateFormLine(kind, line.id, "description", e.target.value)}
                        placeholder="Description"
                        className={`flex-1 min-w-0 ${LINE_INPUT}`}
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
                    <label className="block text-[10px] text-muted-foreground mb-1">Name</label>
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
                    <label className="block text-[10px] text-muted-foreground mb-1">Type</label>
                    <select value={draft.type ?? editingCov.type} onChange={e => setD("type", e.target.value)} className={FIELD}>
                      <option value="Quantitative">Quantitative</option>
                      <option value="Qualitative">Qualitative</option>
                    </select>
                  </div>
                  {/* Current Value */}
                  <div style={{ flex: "1 1 90px", minWidth: 0 }}>
                    <label className="block text-[10px] text-muted-foreground mb-1">Current Value</label>
                    <input type="number" step="0.01" value={draft.currentValue ?? ""}
                      onChange={e => setD("currentValue", parseFloat(e.target.value) || 0)}
                      className={FIELD} placeholder="e.g. 1.12" />
                  </div>
                  {/* Projected Value */}
                  <div style={{ flex: "1 1 90px", minWidth: 0 }}>
                    <label className="block text-[10px] text-muted-foreground mb-1">Projected Value</label>
                    <input type="number" step="0.01" value={draft.projectedValue ?? ""}
                      onChange={e => setD("projectedValue", parseFloat(e.target.value) || 0)}
                      className={FIELD} placeholder="e.g. 0.96" />
                  </div>
                  {/* Threshold */}
                  <div style={{ flex: "1 1 90px", minWidth: 0 }}>
                    <label className="block text-[10px] text-muted-foreground mb-1">Threshold</label>
                    <input type="number" step="0.01" value={draft.threshold ?? ""}
                      onChange={e => setD("threshold", parseFloat(e.target.value) || 0)}
                      className={FIELD} placeholder="e.g. 1.25" />
                  </div>
                  {/* Operator */}
                  <div style={{ flex: "1 1 140px", minWidth: 0 }}>
                    <label className="block text-[10px] text-muted-foreground mb-1">Operator</label>
                    <select value={draft.operator ?? ">="} onChange={e => setD("operator", e.target.value)} className={FIELD}>
                      <option value=">=">≥ greater or equal</option>
                      <option value="<=">≤ less or equal</option>
                      <option value=">">&gt; greater than</option>
                      <option value="<">&lt; less than</option>
                    </select>
                  </div>
                  {/* Frequency */}
                  <div style={{ flex: "1 1 110px", minWidth: 0 }}>
                    <label className="block text-[10px] text-muted-foreground mb-1">Frequency</label>
                    <select value={draft.frequency ?? "Annual"} onChange={e => setD("frequency", e.target.value)} className={FIELD}>
                      {["Annual","Semi-annual","Quarterly","Monthly"].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  {/* Last Tested */}
                  <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                    <label className="block text-[10px] text-muted-foreground mb-1">Last Tested</label>
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
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Draft",            count: draft,    sub: "Require review",  color: "border-border"                      },
          { label: "Approved",         count: approved, sub: "Ready to post",   color: "border-blue-200 bg-blue-50/30"      },
          { label: "Posted/Exported",  count: posted,   sub: "Complete",        color: "border-green-200 bg-green-50/30"    },
        ].map(({ label, count, sub, color }) => (
          <div key={label} className={`rounded-[8px] border ${color} px-3 py-2`}>
            <p className="text-base font-bold text-foreground tabular-nums leading-tight">{count}</p>
            <p className="text-[11px] font-medium text-foreground">{label}</p>
            <p className="text-[10px] text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {draft > 0 && (
        <div className="flex items-start gap-2 rounded-[8px] border border-amber-200 bg-amber-50/50 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span className="text-[11px] text-amber-700">{draft} AJEs require preparer review — review and approve each entry before posting.</span>
        </div>
      )}

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

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: DollarSign, label: "Total Debt",      value: fmt(totalDebt),           sub: `${loans.length} facilities` },
          { icon: CreditCard, label: "Current Portion", value: fmt(totalCurrentPortion),  sub: "within 12mo" },
          { icon: TrendingUp, label: "Long-term",       value: fmt(totalLT),              sub: "beyond 12mo" },
          { icon: Activity,   label: "Accrued Int.",    value: fmt(totalAccrued),          sub: "year-end" },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="rounded-[8px] border border-border bg-background px-2.5 py-2">
            <div className="flex items-center gap-1 mb-0.5">
              <Icon className="h-3 w-3 text-primary shrink-0" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide truncate">{label}</span>
            </div>
            <p className="text-xs font-semibold text-foreground tabular-nums">{value}</p>
            <p className="text-[10px] text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* Alert banners */}
      {covenantAlert > 0 && (
        <div className="flex items-center gap-2 rounded-[8px] border border-red-200 bg-red-50/60 px-3 py-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-red-600 shrink-0" />
          <span className="text-[11px] text-red-700 font-medium">
            {breachedCount > 0 && `${breachedCount} covenant${breachedCount>1?"s":""} breached`}
            {breachedCount > 0 && atRiskCount > 0 && " · "}
            {atRiskCount > 0 && `${atRiskCount} at risk`}
            {" — review Covenants tab"}
          </span>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-border -mx-0 overflow-x-auto">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          const hasBadge = id === "covenants" && covenantAlert > 0;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
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
        <button onClick={() => toast.success("Schedule added to Long-term Debt workpaper")} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors">
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

    </div>
  );
}
