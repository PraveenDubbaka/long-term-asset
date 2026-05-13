import { useMemo, useState } from "react";
import {
  TrendingUp, AlertTriangle, Calendar, DollarSign, BarChart2,
  ChevronDown, ChevronUp, FileSpreadsheet, Plus, CheckCircle2,
  ShieldAlert, ShieldCheck, Activity, ExternalLink, CreditCard,
  Building2, FileText, BookOpen, Receipt, Layers, FileCheck,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import toast from "react-hot-toast";
import type { Loan, ContinuityRow, AmortizationRow, Covenant, JEProposal, ReconciliationItem, EngagementSettings } from "@/types";

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

// ─── Per-tab components ───────────────────────────────────────────────────────

function LoansTab({ loans }: { loans: Loan[] }) {
  const USD_FX = 1.353;
  return (
    <div className="space-y-3">
      <div className="rounded-[8px] border border-border overflow-hidden">
        <div className="px-3 py-2 bg-muted/40 border-b border-border flex items-center justify-between">
          <span className="text-[11px] font-semibold text-foreground">Loan Register</span>
          <span className="text-[10px] text-muted-foreground">Manage facilities, terms, and GL mappings</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {["Loan Name","Lender","Type","Rate Type","Int. Rate","Start","Maturity","CCY","Balance"].map(h => (
                  <th key={h} className={`px-2.5 py-2 font-semibold text-muted-foreground uppercase tracking-wide text-[10px] whitespace-nowrap ${h==="Loan Name"||h==="Lender"?"text-left":"text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loans.map((l, i) => (
                <tr key={l.id} className={`border-b border-border/40 ${i%2===0?"":"bg-muted/10"}`}>
                  <td className="px-2.5 py-1.5">
                    <p className="font-medium text-foreground">{l.name}</p>
                    <p className="text-[10px] text-muted-foreground">{l.refNumber}</p>
                  </td>
                  <td className="px-2.5 py-1.5 text-muted-foreground whitespace-nowrap">{l.lender}</td>
                  <td className="px-2.5 py-1.5 text-right">
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-muted text-foreground text-[10px]">{l.type}</span>
                  </td>
                  <td className="px-2.5 py-1.5 text-right">
                    <span className={`text-[10px] font-medium ${l.interestType==="Variable"?"text-amber-600":"text-foreground"}`}>{l.interestType}</span>
                  </td>
                  <td className="px-2.5 py-1.5 text-right tabular-nums font-medium">{l.rate.toFixed(2)}%</td>
                  <td className="px-2.5 py-1.5 text-right whitespace-nowrap text-muted-foreground">{fmtDate(l.startDate)}</td>
                  <td className="px-2.5 py-1.5 text-right"><MaturityChip dateStr={l.maturityDate} /></td>
                  <td className="px-2.5 py-1.5 text-right">
                    <span className="text-[10px] font-medium text-muted-foreground">{l.currency}</span>
                  </td>
                  <td className="px-2.5 py-1.5 text-right tabular-nums font-semibold">
                    {fmt(toCAD(l.currentBalance, l.currency))}
                    {l.currency !== "CAD" && <p className="text-[10px] text-muted-foreground font-normal">{l.currency} {l.currentBalance.toLocaleString()}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/30 border-t border-border font-semibold">
                <td className="px-2.5 py-2 text-[11px] text-foreground" colSpan={8}>Total · {loans.length} facilities</td>
                <td className="px-2.5 py-2 text-right text-[11px] tabular-nums">{fmt(loans.reduce((s,l)=>s+toCAD(l.currentBalance,l.currency),0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* GL Account Summary */}
      <div className="rounded-[8px] border border-border overflow-hidden">
        <div className="px-3 py-2 bg-muted/40 border-b border-border">
          <span className="text-[11px] font-semibold text-foreground">GL Account Summary</span>
          <span className="text-[10px] text-muted-foreground ml-2">— principal balance by account · CAD equiv. (USD × {USD_FX})</span>
        </div>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-muted/20 border-b border-border">
              {["GL Account","Facilities","Balance (CAD)"].map(h=>(
                <th key={h} className={`px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide ${h==="GL Account"?"text-left":"text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(new Set(loans.map(l=>l.glPrincipalAccount))).map((acct,i)=>{
              const acctLoans = loans.filter(l=>l.glPrincipalAccount===acct);
              const bal = acctLoans.reduce((s,l)=>s+toCAD(l.currentBalance,l.currency),0);
              return (
                <tr key={acct} className={`border-b border-border/40 ${i%2===0?"":"bg-muted/10"}`}>
                  <td className="px-3 py-1.5 font-mono text-primary font-medium">{acct}</td>
                  <td className="px-3 py-1.5 text-right">{acctLoans.length}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmt(bal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContinuityTabPanel({ loans, continuity }: { loans: Loan[]; continuity: ContinuityRow[] }) {
  // Latest continuity row per loan
  const latestRows = useMemo(() => {
    return loans.map(loan => {
      const rows = continuity.filter(r => r.loanId === loan.id).sort((a,b) => b.period.localeCompare(a.period));
      return { loan, row: rows[0] ?? null };
    });
  }, [loans, continuity]);

  const totals = useMemo(() => latestRows.reduce((acc, { loan, row }) => {
    if (!row) return acc;
    const fx = toCAD(1, loan.currency);
    acc.opening  += row.openingBalance       * fx;
    acc.borrows  += row.newBorrowings        * fx;
    acc.principal += (row.principalRepayments ?? 0) * fx;
    acc.interest  += (row.interestRepayments  ?? 0) * fx;
    acc.fxTrans   += row.fxTranslation       * fx;
    acc.closing  += row.closingBalance       * fx;
    acc.accrued  += row.accruedInterest      * fx;
    return acc;
  }, { opening:0, borrows:0, principal:0, interest:0, fxTrans:0, closing:0, accrued:0 }), [latestRows]);

  return (
    <div className="space-y-3">
      <div className="rounded-[8px] border border-border overflow-hidden">
        <div className="px-3 py-2 bg-muted/40 border-b border-border">
          <span className="text-[11px] font-semibold text-foreground">Continuity Roll-Forward</span>
          <span className="text-[10px] text-muted-foreground ml-2">Opening → movements → closing by period</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-muted/20 border-b border-border">
                {["Loan","Opening Bal.","+New Borr.","-Principal","-Interest","±FX","Closing Bal.","Accrued Int."].map(h=>(
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
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/30 border-t border-border font-semibold">
                <td className="px-2.5 py-2 text-[11px] text-foreground">Total · {loans.length} facilities</td>
                <td className="px-2.5 py-2 text-right tabular-nums text-[11px]">{fmtNum(totals.opening)}</td>
                <td className="px-2.5 py-2 text-right tabular-nums text-[11px] text-green-700">{totals.borrows > 0 ? fmtNum(totals.borrows) : "00"}</td>
                <td className="px-2.5 py-2 text-right tabular-nums text-[11px] text-red-600">{totals.principal > 0 ? fmtParen(totals.principal) : "00"}</td>
                <td className="px-2.5 py-2 text-right tabular-nums text-[11px] text-muted-foreground">{totals.interest > 0 ? fmtParen(totals.interest) : "00"}</td>
                <td className="px-2.5 py-2 text-right tabular-nums text-[11px] text-muted-foreground">—</td>
                <td className="px-2.5 py-2 text-right tabular-nums text-[11px]">{fmtNum(totals.closing)}</td>
                <td className="px-2.5 py-2 text-right tabular-nums text-[11px]">{fmtNum(totals.accrued)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Balance Sheet Classification */}
      <div className="rounded-[8px] border border-border overflow-hidden">
        <div className="px-3 py-2 bg-muted/40 border-b border-border">
          <span className="text-[11px] font-semibold text-foreground">Balance Sheet Classification</span>
        </div>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-muted/20 border-b border-border">
              {["Loan","Current Portion","Long-term Portion","Total"].map(h=>(
                <th key={h} className={`px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide ${h==="Loan"?"text-left":"text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loans.map((l,i)=>{
              const fx = toCAD(1, l.currency);
              return (
                <tr key={l.id} className={`border-b border-border/40 ${i%2===0?"":"bg-muted/10"}`}>
                  <td className="px-3 py-1.5 font-medium text-foreground">{l.name}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-primary">{fmt(l.currentPortion * fx)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmt(l.longTermPortion * fx)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums font-semibold">{fmt(toCAD(l.currentBalance, l.currency))}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-muted/30 border-t border-border font-semibold">
              <td className="px-3 py-2 text-[11px] text-foreground">Total</td>
              <td className="px-3 py-2 text-right tabular-nums text-[11px] text-primary">{fmt(loans.reduce((s,l)=>s+toCAD(l.currentPortion,l.currency),0))}</td>
              <td className="px-3 py-2 text-right tabular-nums text-[11px]">{fmt(loans.reduce((s,l)=>s+toCAD(l.longTermPortion,l.currency),0))}</td>
              <td className="px-3 py-2 text-right tabular-nums text-[11px]">{fmt(loans.reduce((s,l)=>s+toCAD(l.currentBalance,l.currency),0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
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

function CovenantsTabPanel({ loans, covenants }: { loans: Loan[]; covenants: Covenant[] }) {
  const [selectedLoanId, setSelectedLoanId] = useState(loans[0]?.id ?? "");
  const loan = loans.find(l => l.id === selectedLoanId);
  const loanCovs = covenants.filter(c => c.loanId === selectedLoanId);

  const breached = covenants.filter(c => c.status === "Breached").length;
  const atRisk   = covenants.filter(c => c.status === "At Risk").length;

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

      {/* Loan selector */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">Loan:</span>
        <select
          value={selectedLoanId}
          onChange={e => setSelectedLoanId(e.target.value)}
          className="flex-1 h-8 text-[11px] px-2 border border-border rounded-[8px] bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        >
          {loans.map(l => (
            <option key={l.id} value={l.id}>
              {l.name} · {l.lender} · {l.refNumber}
            </option>
          ))}
        </select>
        {loan && <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-[4px]">{loan.currency}</span>}
        <span className="text-[10px] text-muted-foreground">{loanCovs.length} covenants</span>
      </div>

      {loanCovs.length === 0 ? (
        <p className="text-[11px] text-muted-foreground italic px-1">No covenants for this loan.</p>
      ) : (
        <div className="rounded-[8px] border border-border overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-muted/20 border-b border-border">
                {["","Covenant","Type","Status","Current","Projected","Threshold","Frequency","Last Tested","Actions"].map(h=>(
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
                    <button className="text-[10px] text-primary hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AJEsTabPanel({ jes }: { jes: JEProposal[] }) {
  const active = jes.filter(j => !j.deleted);
  const draft    = active.filter(j => j.status === "Draft").length;
  const approved = active.filter(j => j.status === "Approved").length;
  const posted   = active.filter(j => j.status === "Posted" || j.status === "Exported").length;
  const [expandedJEs, setExpandedJEs] = useState<Set<string>>(() => new Set(jes.filter(j => !j.deleted).map(j => j.id)));

  const JE_TYPE_LABEL: Record<string, string> = {
    AccruedInterest: "Accrued Interest",
    CurrentPortionReclass: "Current Portion Reclass",
    FXTranslation: "FX Translation",
    MissingSplit: "Missing Split",
    Manual: "Manual",
  };

  return (
    <div className="space-y-3">
      {/* Status counts */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Draft", count: draft, sub: "Require review", color: "border-border" },
          { label: "Approved", count: approved, sub: "Ready to post", color: "border-blue-200 bg-blue-50/30" },
          { label: "Posted / Exported", count: posted, sub: "Complete", color: "border-green-200 bg-green-50/30" },
        ].map(({ label, count, sub, color }) => (
          <div key={label} className={`rounded-[8px] border ${color} px-3 py-2`}>
            <p className="text-lg font-bold text-foreground tabular-nums leading-tight">{count}</p>
            <p className="text-[11px] font-medium text-foreground">{label}</p>
            <p className="text-[10px] text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {draft > 0 && (
        <div className="flex items-start gap-2 rounded-[8px] border border-amber-200 bg-amber-50/50 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span className="text-[11px] text-amber-700">{draft} AJEs require preparer review — review and approve each entry before posting. Entries are automatically suggested based on year-end calculations.</span>
        </div>
      )}

      {/* JE list */}
      <div className="space-y-2">
        {active.map(je => {
          const isExpanded = expandedJEs.has(je.id);
          const loanName = je.loanId ? je.description.split("–")[1]?.trim() : undefined;
          return (
            <div key={je.id} className="rounded-[8px] border border-border overflow-hidden">
              <button
                onClick={() => setExpandedJEs(prev => { const next = new Set(prev); isExpanded ? next.delete(je.id) : next.add(je.id); return next; })}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">{je.id}</span>
                  <span className="text-[11px] font-semibold text-primary shrink-0">{JE_TYPE_LABEL[je.type] ?? je.type}</span>
                  {loanName && <span className="text-[10px] text-muted-foreground truncate">{loanName}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <StatusBadge status={je.status} />
                  {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                </div>
              </button>
              {isExpanded && (
                <div className="border-t border-border px-3 pb-3 pt-2">
                  <p className="text-[11px] font-medium text-foreground mb-2">{je.description}</p>
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-border/40">
                        {["Acc No.","Description","Debit","Credit"].map(h=>(
                          <th key={h} className={`pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide ${h==="Acc No."||h==="Description"?"text-left":"text-right"}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {je.lines.map(line => (
                        <tr key={line.id} className="border-b border-border/30">
                          <td className="py-1 font-mono text-primary">{line.account}</td>
                          <td className="py-1 text-foreground pr-4">{line.description}</td>
                          <td className="py-1 text-right tabular-nums">{line.debit > 0 ? fmtNum(line.debit) : ""}</td>
                          <td className="py-1 text-right tabular-nums">{line.credit > 0 ? fmtNum(line.credit) : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border font-semibold">
                        <td className="pt-1 text-[11px] text-foreground" colSpan={2}>Total</td>
                        <td className="pt-1 text-right tabular-nums text-[11px]">{fmt(je.lines.reduce((s,l)=>s+l.debit,0))}</td>
                        <td className="pt-1 text-right tabular-nums text-[11px]">{fmt(je.lines.reduce((s,l)=>s+l.credit,0))}</td>
                      </tr>
                    </tfoot>
                  </table>
                  <div className="flex items-center gap-2 mt-2.5">
                    {je.status === "Draft" && (
                      <button onClick={()=>toast.success(`JE ${je.id} approved`)} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[6px] bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 transition-colors">
                        <CheckCircle2 className="h-3 w-3" /> Approve
                      </button>
                    )}
                    <button onClick={()=>toast.success(`JE ${je.id} action`)} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[6px] border border-border bg-background text-[11px] font-medium text-foreground hover:bg-muted transition-colors">
                      {je.status === "Draft" ? "Revert to Draft" : "View"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
        {activeTab === "ajes"         && <AJEsTabPanel jes={jes} />}
        {activeTab === "notes"        && <NotesTabPanel loans={loans} continuity={continuity} reconciliation={reconciliation} settings={settings} />}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
        <button onClick={() => toast.success("Schedule added to Long-term Debt workpaper")} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add to Workpaper
        </button>
        <button onClick={() => toast.success("Exporting to Excel…")} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors">
          <FileSpreadsheet className="h-3.5 w-3.5" /> Export to Excel
        </button>
        <button onClick={() => toast.success("Generating AJEs for all active loans…")} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
          <TrendingUp className="h-3.5 w-3.5" /> Generate AJEs
        </button>
        <button onClick={() => toast.success("Opening amortization schedules…")} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
          <ExternalLink className="h-3.5 w-3.5" /> View Full Workpaper
        </button>
      </div>

    </div>
  );
}
