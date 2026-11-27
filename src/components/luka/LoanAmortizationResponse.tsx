import { useMemo } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LoanAmortData } from "./LoanAmortizationPrompt";
import { LukaResponseActions } from "./LukaResponseActions";
import { buildAmortization, fiscalSummary, parseISO, type EngineInput, type Frequency } from "@/lib/loanAmortEngine";

const n = (s?: string) => parseFloat((s || "").replace(/[,$\s]/g, "")) || 0;
const money = (x: number) => x.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function toEngineInput(d: LoanAmortData): EngineInput {
  return {
    principal: n(d.principalAmount), annualRate: n(d.annualInterestRate), tenureMonths: n(d.loanTenure),
    frequency: (d.paymentFrequency || "Monthly") as Frequency, compounding: d.compoundingFrequency || undefined,
    dayCount: d.dayCountBasis || "ACT/365", loanStartDate: d.loanStartDate || undefined, firstPaymentDate: d.firstPaymentDate,
    paymentType: d.paymentType, interestOnlyMonths: n(d.interestOnlyPeriod) || undefined,
    fixedPayment: n(d.fixedPaymentAmount) || undefined, balloon: n(d.balloonAmount) || undefined,
  };
}

/** Parses an engagement year end like "Sep 30, 2025" → 9. Defaults to December (prod behaviour). */
export function yearEndMonthFrom(yearEnd?: string | null): number {
  if (!yearEnd) return 12;
  const d = new Date(yearEnd);
  return isNaN(d.getTime()) ? 12 : d.getMonth() + 1;
}

const TH = "px-3 py-2 text-xs font-semibold text-foreground whitespace-nowrap";
const TD = "px-3 py-2 text-xs text-foreground whitespace-nowrap tabular-nums";
const Title = ({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-1.5">
    <p className="text-sm font-semibold text-foreground">{children}</p>{action}
  </div>
);

interface Props { data: LoanAmortData; yearEndMonth?: number; onEdit?: () => void }

export function LoanAmortizationResponse({ data, yearEndMonth = 12, onEdit }: Props) {
  const input = useMemo(() => toEngineInput(data), [data]);
  const { rows } = useMemo(() => buildAmortization(input), [input]);
  const summary = useMemo(() => fiscalSummary(rows, input, yearEndMonth), [rows, input, yearEndMonth]);
  const boldRows = useMemo(() => {
    const s = new Set<number>();
    summary.forEach(y => { const r = [...rows].reverse().find(x => x.date <= y.yearEnd); if (r) s.add(r.n); });
    return s;
  }, [summary, rows]);
  const totals = useMemo(() => rows.reduce((t, r) => ({
    payment: t.payment + r.payment, principal: t.principal + r.principal, interest: t.interest + r.interest,
  }), { payment: 0, principal: 0, interest: 0 }), [rows]);
  const yearLabel = (iso: string) => {
    const y = parseISO(iso).getUTCFullYear();
    return yearEndMonth === 12 ? String(y) : `FY${y}`;
  };

  if (!rows.length) return <p className="text-base text-foreground">I couldn't build a schedule from these inputs. Please edit them and try again.</p>;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-300 min-w-0">

      {/* Loan Repayment Detail */}
      <div>
        <Title action={onEdit && (
          <button onClick={onEdit}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-border bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )}>Loan Repayment Detail</Title>
        <div className="rounded-[8px] border border-border overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {["Payment Type", "Interest Type", "Frequency", "Compounding Frequency", "Start Date", "First Payment Date", "Principal Amount", "Annual Interest Rate", "Loan Tenure (Months)"].map((h, i) => (
                  <th key={h} className={cn(TH, i >= 6 ? "text-right" : "text-left")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={TD}>{data.paymentType}</td>
                <td className={TD}>{data.interestRateType}</td>
                <td className={TD}>{data.paymentFrequency}</td>
                <td className={TD}>{data.compoundingFrequency || data.paymentFrequency}</td>
                <td className={TD}>{data.loanStartDate || "—"}</td>
                <td className={TD}>{data.firstPaymentDate}</td>
                <td className={cn(TD, "text-right")}>{money(input.principal)}</td>
                <td className={cn(TD, "text-right")}>{input.annualRate.toFixed(2)}%</td>
                <td className={cn(TD, "text-right")}>{input.tenureMonths}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Loan Repayment Schedule */}
      <div>
        <Title>Loan Repayment Schedule</Title>
        <div className="rounded-[8px] border border-border overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {["Date", "Installment No", "Starting Balance", "Installment Amount", "Principal Amount", "Interest Amount", "Closing Balance"].map((h, i) => (
                  <th key={h} className={cn(TH, i ? "text-right" : "text-left")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.n} className="border-b border-border/50">
                  {[r.date, r.n, money(r.opening), money(r.payment), money(r.principal), money(r.interest), money(r.closing)].map((v, i) => (
                    <td key={i} className={cn(TD, i && "text-right", boldRows.has(r.n) && "font-bold")}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/50 border-t border-border">
              <tr>
                <td className={cn(TD, "font-bold")}>Total</td>
                <td className={cn(TD, "text-right font-bold")}>{rows.length}</td>
                <td className={TD} />
                <td className={cn(TD, "text-right font-bold")}>{money(totals.payment)}</td>
                <td className={cn(TD, "text-right font-bold")}>{money(totals.principal)}</td>
                <td className={cn(TD, "text-right font-bold")}>{money(totals.interest)}</td>
                <td className={TD} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Yearly Summary */}
      <div>
        <Title>Yearly Summary</Title>
        <div className="rounded-[8px] border border-border overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {["Year", "Principal Repayments", "Interest Paid", "Short-Term Portion", "Long-Term Portion", "Accrued Interest"].map((h, i) => (
                  <th key={h} className={cn(TH, i ? "text-right" : "text-left")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.map(y => (
                <tr key={y.yearEnd} className="border-b border-border/50">
                  <td className={TD}>{yearLabel(y.yearEnd)}</td>
                  <td className={cn(TD, "text-right")}>{money(y.principal)}</td>
                  <td className={cn(TD, "text-right")}>{money(y.interest)}</td>
                  <td className={cn(TD, "text-right")}>{money(y.currentPortion)}</td>
                  <td className={cn(TD, "text-right")}>{money(y.longTermPortion)}</td>
                  <td className={cn(TD, "text-right")}>{money(y.accruedInterest)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/50 border-t border-border">
              <tr>
                <td className={cn(TD, "font-bold")}>Total</td>
                <td className={cn(TD, "text-right font-bold")}>{money(summary.reduce((a, y) => a + y.principal, 0))}</td>
                <td className={cn(TD, "text-right font-bold")}>{money(summary.reduce((a, y) => a + y.interest, 0))}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <LukaResponseActions />
    </div>
  );
}
