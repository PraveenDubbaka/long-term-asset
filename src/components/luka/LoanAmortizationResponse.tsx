import { useMemo, useState } from "react";
import { TrendingUp, Calendar, DollarSign, BarChart2, ChevronDown, ChevronUp, FileSpreadsheet, Plus } from "lucide-react";
import type { LoanAmortData } from "./LoanAmortizationPrompt";
import toast from "react-hot-toast";

// ─── Compute schedule ────────────────────────────────────────────────────────

interface AmortRow {
  n: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

function addMonths(dateStr: string, months: number): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function buildSchedule(data: LoanAmortData): AmortRow[] {
  const P = parseFloat(data.principalAmount.replace(/[,$]/g, "")) || 0;
  const annualRate = parseFloat(data.annualInterestRate) || 0;
  const n = parseInt(data.loanTenure) || 0;
  const fixedPmt = parseFloat(data.fixedPaymentAmount.replace(/[,$]/g, "")) || 0;
  const ioMonths = parseInt(data.interestOnlyPeriod) || 0;
  const balloon = parseFloat(data.balloonAmount.replace(/[,$]/g, "")) || 0;
  const startDate = data.firstPaymentDate || data.loanStartDate || "";

  if (P <= 0 || n <= 0) return [];

  const r = annualRate / 100 / 12;
  let balance = P;
  const rows: AmortRow[] = [];

  // Monthly payment for blended (after IO period)
  let blendedPayment = fixedPmt;
  if (!blendedPayment && r > 0) {
    const remainingN = n - ioMonths;
    if (remainingN > 0) {
      blendedPayment = balance * (r * Math.pow(1 + r, remainingN)) / (Math.pow(1 + r, remainingN) - 1);
    }
  } else if (!blendedPayment) {
    blendedPayment = P / n;
  }

  for (let i = 1; i <= n; i++) {
    const interest = balance * r;
    let pmt: number;
    let principal: number;

    if (i <= ioMonths) {
      // Interest-only phase
      pmt = interest;
      principal = 0;
    } else if (balloon > 0 && i === n) {
      // Balloon payment
      pmt = interest + balance;
      principal = balance;
    } else {
      pmt = Math.min(blendedPayment, balance + interest);
      principal = pmt - interest;
    }

    balance = Math.max(0, balance - principal);

    rows.push({
      n: i,
      date: addMonths(startDate, i - 1),
      payment: pmt,
      principal,
      interest,
      balance,
    });
  }

  return rows;
}

// ─── Formatting ──────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 2 });

// ─── Component ───────────────────────────────────────────────────────────────
interface Props { data: LoanAmortData }

export function LoanAmortizationResponse({ data }: Props) {
  const [expanded, setExpanded] = useState(false);
  const rows = useMemo(() => buildSchedule(data), [data]);

  const totalInterest  = rows.reduce((a, r) => a + r.interest, 0);
  const totalPayments  = rows.reduce((a, r) => a + r.payment, 0);
  const principal      = parseFloat(data.principalAmount.replace(/[,$]/g, "")) || 0;
  const monthlyPayment = rows[0]?.payment ?? 0;
  const lastRow        = rows[rows.length - 1];
  const payoffDate     = lastRow?.date ?? "—";

  const displayRows = expanded ? rows : rows.slice(0, 6);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-300">

      {/* Intro text */}
      <p className="text-sm text-foreground leading-relaxed">
        I've generated the <strong>loan amortization schedule</strong>
        {data.loanName && <> for <span className="font-medium text-primary">{data.loanName}</span></>}
        {data.lender && <> · <span className="text-muted-foreground">{data.lender}</span></>}
        {" "}— here's a summary:
      </p>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: DollarSign,  label: "Regular Payment",  value: fmt(monthlyPayment),  sub: data.paymentFrequency || "Monthly" },
          { icon: TrendingUp,  label: "Total Interest",   value: fmt(totalInterest),    sub: "over life of loan" },
          { icon: BarChart2,   label: "Total Cost",       value: fmt(totalPayments),    sub: "principal + interest" },
          { icon: Calendar,    label: "Payoff Date",      value: payoffDate,            sub: `${rows.length} payments` },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="rounded-[10px] border border-border bg-background px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-sm font-semibold text-foreground tabular-nums">{value}</p>
            <p className="text-[10px] text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* Schedule table */}
      {rows.length > 0 && (
        <div className="rounded-[10px] border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/60 border-b border-border">
                {["#", "Date", "Payment", "Principal", "Interest", "Balance"].map(h => (
                  <th key={h} className={`px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide text-[10px] ${h === "#" ? "text-left w-8" : "text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((r, i) => (
                <tr key={r.n} className={`border-b border-border/40 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                  <td className="px-3 py-1.5 text-muted-foreground">{r.n}</td>
                  <td className="px-3 py-1.5 text-right whitespace-nowrap">{r.date}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums font-medium">{fmt(r.payment)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-primary">{fmt(r.principal)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">{fmt(r.interest)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmt(r.balance)}</td>
                </tr>
              ))}
            </tbody>
            {!expanded && rows.length > 6 && (
              <tfoot>
                <tr className="bg-muted/30">
                  <td colSpan={6} className="px-3 py-2 text-center text-[11px] text-muted-foreground">
                    … and {rows.length - 6} more rows
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
          {rows.length > 6 && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] text-primary hover:bg-muted/30 transition-colors border-t border-border"
            >
              {expanded
                ? <><ChevronUp className="h-3 w-3" /> Show less</>
                : <><ChevronDown className="h-3 w-3" /> Show all {rows.length} rows</>}
            </button>
          )}
        </div>
      )}

      {/* Summary line */}
      <div className="rounded-[10px] bg-primary/5 border border-primary/15 px-3 py-2.5 text-xs text-foreground leading-relaxed">
        {data.currency && <><strong>CCY:</strong> {data.currency} &nbsp;·&nbsp;</>}
        <strong>Principal:</strong> {fmt(principal)} &nbsp;·&nbsp;
        <strong>Rate:</strong> {data.annualInterestRate}% {data.interestRateType} &nbsp;·&nbsp;
        {data.dayCountBasis && <><strong>Day Count:</strong> {data.dayCountBasis} &nbsp;·&nbsp;</>}
        <strong>Term:</strong> {data.loanTenure} months &nbsp;·&nbsp;
        <strong>Type:</strong> {data.paymentType}
        {data.loanType && <> &nbsp;·&nbsp;<strong>Loan Type:</strong> {data.loanType}</>}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          onClick={() => toast.success("Schedule added to Amortization workpaper")}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add to Workpaper
        </button>
        <button
          onClick={() => toast.success("Exporting amortization schedule…")}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" /> Export to Excel
        </button>
        <button
          onClick={() => toast.success("Generating AJE for accrued interest…")}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <TrendingUp className="h-3.5 w-3.5" /> Generate AJE
        </button>
      </div>

    </div>
  );
}
