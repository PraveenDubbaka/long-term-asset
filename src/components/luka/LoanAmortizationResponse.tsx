import { useMemo, useState } from "react";
import { Pencil, FileSpreadsheet, Plus, ChevronDown, ChevronUp, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import type { LoanAmortData } from "./LoanAmortizationPrompt";
import { buildAmortization, fiscalSummary, parseISO, type EngineInput, type Frequency } from "@/lib/loanAmortEngine";

const n = (s: string) => parseFloat((s || "").replace(/[,$\s]/g, "")) || 0;
const money = (x: number) => x.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (iso: string) => iso ? parseISO(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "—";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function toEngineInput(d: LoanAmortData): EngineInput {
  return {
    principal: n(d.principalAmount), annualRate: n(d.annualInterestRate), tenureMonths: n(d.loanTenure),
    frequency: (d.paymentFrequency || "Monthly") as Frequency, compounding: d.compoundingFrequency || undefined,
    dayCount: d.dayCountBasis, loanStartDate: d.loanStartDate || undefined, firstPaymentDate: d.firstPaymentDate,
    paymentType: d.paymentType, interestOnlyMonths: n(d.interestOnlyPeriod) || undefined,
    fixedPayment: n(d.fixedPaymentAmount) || undefined, balloon: n(d.balloonAmount) || undefined,
  };
}

interface Props { data: LoanAmortData; fiscalYearEndMonth?: number; onEdit?: () => void }

export function LoanAmortizationResponse({ data, fiscalYearEndMonth = 9, onEdit }: Props) {
  const [fye, setFye] = useState(fiscalYearEndMonth);
  const [showAll, setShowAll] = useState(false);
  const input = useMemo(() => toEngineInput(data), [data]);
  const { payment, rows } = useMemo(() => buildAmortization(input), [input]);
  const summary = useMemo(() => fiscalSummary(rows, input, fye), [rows, input, fye]);
  // Last payment row on or before each fiscal year end → bold
  const boldRows = useMemo(() => {
    const s = new Set<number>();
    summary.forEach(y => { const r = [...rows].reverse().find(x => x.date <= y.yearEnd); if (r) s.add(r.n); });
    return s;
  }, [summary, rows]);

  const totalInterest = rows.reduce((a, r) => a + r.interest, 0);
  const visible = showAll ? rows : rows.slice(0, 12);
  const ccy = data.currency || "CAD";

  if (!rows.length) return <p className="text-base text-foreground">I couldn't build a schedule from these inputs. Please edit and try again.</p>;

  const chips: [string, string][] = [
    ["Principal", `${ccy} ${money(input.principal)}`],
    ["Rate", `${data.annualInterestRate}% ${data.interestRateType}`],
    ["Tenure", `${data.loanTenure} months`],
    ["Frequency", data.paymentFrequency],
    ["Type", data.paymentType],
    ...(data.loanStartDate ? [["Start", fmtDate(data.loanStartDate)] as [string, string]] : []),
    ["First payment", fmtDate(data.firstPaymentDate)],
    ["Day count", data.dayCountBasis],
  ];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-300 min-w-0">
      <p className="text-base text-foreground leading-relaxed">
        Here's the amortization schedule for <strong>{data.loanName || "the loan"}</strong>
        {data.lender && <> with {data.lender}</>}. Regular payment is <strong>{ccy} {money(payment)}</strong> {(data.paymentFrequency || "monthly").toLowerCase()},
        {" "}{rows.length} payments ending {fmtDate(rows[rows.length - 1].date)}, total interest {ccy} {money(totalInterest)}.
      </p>

      {/* Inputs used — replaces the empty disabled form */}
      <div className="rounded-[10px] border border-border px-3 py-2.5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            Inputs used
            {data.uploadedFile && <span className="normal-case font-normal tracking-normal inline-flex items-center gap-1"><FileText className="h-3 w-3" />{data.uploadedFile}</span>}
          </span>
          {onEdit && (
            <button onClick={onEdit} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              <Pencil className="h-3 w-3" /> Edit &amp; re-run
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {chips.map(([k, v]) => (
            <span key={k} className="text-xs bg-muted rounded-full px-2.5 py-0.5"><span className="text-muted-foreground">{k}:</span> <span className="font-medium text-foreground">{v}</span></span>
          ))}
        </div>
      </div>

      {/* Fiscal year summary */}
      <div className="rounded-[10px] border border-border overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border">
          <span className="text-xs font-semibold text-foreground">Fiscal year summary</span>
          <label className="text-xs text-muted-foreground flex items-center gap-1.5">
            Year end
            <select value={fye} onChange={e => setFye(Number(e.target.value))}
              className="h-6 text-xs border border-border rounded-[6px] bg-background px-1.5 cursor-pointer">
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs tabular-nums">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                {["Year ended", "Principal repaid", "Interest", "Closing balance", "Current portion", "Long-term portion", "Accrued interest"].map((h, i) => (
                  <th key={h} className={cn("px-3 py-2 font-semibold whitespace-nowrap", i ? "text-right" : "text-left")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.map(y => (
                <tr key={y.yearEnd} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-1.5 whitespace-nowrap">{fmtDate(y.yearEnd)}</td>
                  <td className="px-3 py-1.5 text-right">{money(y.principal)}</td>
                  <td className="px-3 py-1.5 text-right">{money(y.interest)}</td>
                  <td className="px-3 py-1.5 text-right font-medium">{money(y.closing)}</td>
                  <td className="px-3 py-1.5 text-right">{money(y.currentPortion)}</td>
                  <td className="px-3 py-1.5 text-right">{money(y.longTermPortion)}</td>
                  <td className="px-3 py-1.5 text-right">{money(y.accruedInterest)}</td>
                </tr>
              ))}
              <tr className="bg-muted/30 font-semibold">
                <td className="px-3 py-1.5">Total</td>
                <td className="px-3 py-1.5 text-right">{money(summary.reduce((a, y) => a + y.principal, 0))}</td>
                <td className="px-3 py-1.5 text-right">{money(summary.reduce((a, y) => a + y.interest, 0))}</td>
                <td colSpan={4} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment schedule */}
      <div className="rounded-[10px] border border-border overflow-hidden">
        <div className="px-3 py-2 bg-muted/40 border-b border-border text-xs font-semibold text-foreground">
          Payment schedule <span className="font-normal text-muted-foreground">· bold rows are the last payment in each fiscal year</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs tabular-nums">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                {["#", "Date", "Opening balance", "Payment", "Interest", "Principal", "Closing balance"].map((h, i) => (
                  <th key={h} className={cn("px-3 py-2 font-semibold whitespace-nowrap", i > 1 ? "text-right" : "text-left")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map(r => (
                <tr key={r.n} className={cn("border-b border-border/40", boldRows.has(r.n) && "font-semibold bg-primary/[0.03]")}>
                  <td className="px-3 py-1.5 text-muted-foreground">{r.n}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap">{fmtDate(r.date)}</td>
                  <td className="px-3 py-1.5 text-right">{money(r.opening)}</td>
                  <td className="px-3 py-1.5 text-right">{money(r.payment)}</td>
                  <td className="px-3 py-1.5 text-right">{money(r.interest)}</td>
                  <td className="px-3 py-1.5 text-right">{money(r.principal)}</td>
                  <td className="px-3 py-1.5 text-right">{money(r.closing)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > 12 && (
          <button onClick={() => setShowAll(s => !s)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-primary hover:bg-muted/30 border-t border-border">
            {showAll ? <><ChevronUp className="h-3 w-3" /> Show first 12</> : <><ChevronDown className="h-3 w-3" /> Show all {rows.length} payments</>}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => toast.success("Schedule added to workpaper")}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-border bg-background text-xs font-medium hover:bg-muted">
          <Plus className="h-3.5 w-3.5" /> Add to workpaper
        </button>
        <button onClick={() => toast.success("Exporting to Excel…")}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-border bg-background text-xs font-medium hover:bg-muted">
          <FileSpreadsheet className="h-3.5 w-3.5" /> Export to Excel
        </button>
      </div>
    </div>
  );
}
