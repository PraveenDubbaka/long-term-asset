import { useMemo, useState } from "react";
import {
  TrendingUp, AlertTriangle, Calendar, DollarSign, BarChart2,
  ChevronDown, ChevronUp, FileSpreadsheet, Plus, CheckCircle2,
  ShieldAlert, ShieldCheck, Clock, Activity, ExternalLink,
  CreditCard, Building2, Percent,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { fmtCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

// ─── Formatting helpers ───────────────────────────────────────────────────────
const USD_FX = 1.353;
const toCAD = (balance: number, currency: string) =>
  currency === "USD" ? balance * USD_FX : balance;

const fmtCAD = (n: number) =>
  n.toLocaleString("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtPct = (n: number) => `${n.toFixed(2)}%`;

const fmtDate = (d: string) => {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-CA", { month: "short", day: "2-digit", year: "numeric" });
};

const daysUntil = (dateStr: string) => {
  const today = new Date();
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

// ─── Status badge helpers ─────────────────────────────────────────────────────
function CovenantBadge({ status }: { status: string }) {
  if (status === "Breached")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-red-50 text-red-700 border border-red-200">
        <AlertTriangle className="h-2.5 w-2.5" /> Breached
      </span>
    );
  if (status === "At Risk")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle className="h-2.5 w-2.5" /> At Risk
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-green-50 text-green-700 border border-green-200">
      <CheckCircle2 className="h-2.5 w-2.5" /> OK
    </span>
  );
}

function MaturityBadge({ dateStr }: { dateStr: string }) {
  const days = daysUntil(dateStr);
  if (days < 0) return <span className="text-[10px] text-muted-foreground">Matured</span>;
  if (days <= 90)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-red-50 text-red-700 border border-red-200">
        <Clock className="h-2.5 w-2.5" /> {days}d
      </span>
    );
  if (days <= 365)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="h-2.5 w-2.5" /> {Math.round(days / 30)}mo
      </span>
    );
  return <span className="text-[10px] text-muted-foreground tabular-nums">{fmtDate(dateStr)}</span>;
}

// ─── Amortization next-N-payments snapshot ────────────────────────────────────
function AmortSnapshot({ loanId }: { loanId: string }) {
  const amortRows = useStore(s =>
    s.amortization
      .filter(r => r.loanId === loanId)
      .sort((a, b) => a.periodDate.localeCompare(b.periodDate))
      .slice(0, 5)
  );

  if (!amortRows.length) return <p className="text-[11px] text-muted-foreground italic">No schedule data</p>;

  return (
    <table className="w-full text-[11px]">
      <thead>
        <tr className="text-muted-foreground uppercase tracking-wide text-[10px]">
          <th className="text-left pb-1">Date</th>
          <th className="text-right pb-1">Payment</th>
          <th className="text-right pb-1">Principal</th>
          <th className="text-right pb-1">Interest</th>
          <th className="text-right pb-1">Balance</th>
        </tr>
      </thead>
      <tbody>
        {amortRows.map(r => (
          <tr key={r.id} className="border-t border-border/30">
            <td className="py-1 text-muted-foreground whitespace-nowrap">{fmtDate(r.periodDate)}</td>
            <td className="py-1 text-right tabular-nums font-medium">{fmtCAD(r.payment)}</td>
            <td className="py-1 text-right tabular-nums text-primary">{fmtCAD(r.principal)}</td>
            <td className="py-1 text-right tabular-nums text-muted-foreground">{fmtCAD(r.interest)}</td>
            <td className="py-1 text-right tabular-nums">{fmtCAD(r.endingBalance)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function LongTermAssetResponse() {
  const { loans, covenants, amortization, activities, reconciliation, settings } = useStore(s => ({
    loans:          s.loans.filter(l => l.status === "Active"),
    covenants:      s.covenants,
    amortization:   s.amortization,
    activities:     s.activities,
    reconciliation: s.reconciliation,
    settings:       s.settings,
  }));

  const [expandedLoan, setExpandedLoan]     = useState<string | null>(null);
  const [covsExpanded, setCovsExpanded]     = useState(false);
  const [actExpanded,  setActExpanded]      = useState(false);

  // ── Computed KPIs ──
  const totalDebt            = useMemo(() => loans.reduce((s, l) => s + toCAD(l.currentBalance, l.currency), 0), [loans]);
  const totalCurrentPortion  = useMemo(() => loans.reduce((s, l) => s + toCAD(l.currentPortion, l.currency), 0), [loans]);
  const totalLT              = useMemo(() => loans.reduce((s, l) => s + toCAD(l.longTermPortion, l.currency), 0), [loans]);
  const totalAccrued         = useMemo(() => loans.reduce((s, l) => s + toCAD(l.accruedInterest, l.currency), 0), [loans]);

  const breachedCount = covenants.filter(c => c.status === "Breached").length;
  const atRiskCount   = covenants.filter(c => c.status === "At Risk").length;
  const covenantAlert = breachedCount + atRiskCount;

  const pendingJECount = useStore(s => s.jes.filter(j => j.status === "Draft" && !j.deleted).length);

  // Loans sorted: breached-covenant first, then by balance descending
  const sortedLoans = useMemo(() => {
    const loanCovenantStatus = (loan: (typeof loans)[0]) => {
      const loanCovs = covenants.filter(c => c.loanId === loan.id);
      if (loanCovs.some(c => c.status === "Breached")) return 0;
      if (loanCovs.some(c => c.status === "At Risk"))  return 1;
      return 2;
    };
    return [...loans].sort((a, b) => {
      const sa = loanCovenantStatus(a), sb = loanCovenantStatus(b);
      if (sa !== sb) return sa - sb;
      return toCAD(b.currentBalance, b.currency) - toCAD(a.currentBalance, a.currency);
    });
  }, [loans, covenants]);

  // Recent activity — last 5 classified items across all loans
  const recentActivity = useMemo(() =>
    [...activities]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5),
    [activities]
  );

  // Reconciliation variance summary
  const variances = reconciliation.filter(r => r.status === "Variance").length;

  // Upcoming maturities (next 365 days)
  const upcomingMaturities = useMemo(() =>
    loans
      .map(l => ({ ...l, days: daysUntil(l.maturityDate) }))
      .filter(l => l.days >= 0 && l.days <= 365)
      .sort((a, b) => a.days - b.days),
    [loans]
  );

  // Per-loan covenant worst status
  const loanCovenantStatus = (loanId: string) => {
    const covs = covenants.filter(c => c.loanId === loanId);
    if (covs.some(c => c.status === "Breached")) return "Breached";
    if (covs.some(c => c.status === "At Risk"))  return "At Risk";
    if (covs.length) return "OK";
    return "—";
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-300">

      {/* ── Intro ── */}
      <p className="text-sm text-foreground leading-relaxed">
        Here's a full summary of your <strong>Long-term Debt workpaper</strong> for{" "}
        <span className="font-medium text-primary">{settings.client || "this engagement"}</span> as at{" "}
        <span className="font-medium">{fmtDate(settings.fiscalYearEnd)}</span>:
      </p>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: DollarSign,    label: "Total Debt (CAD)",     value: fmtCAD(totalDebt),           sub: `${loans.length} active facilit${loans.length === 1 ? "y" : "ies"}` },
          { icon: BarChart2,     label: "Current Portion",       value: fmtCAD(totalCurrentPortion),  sub: "due within 12 months" },
          { icon: TrendingUp,    label: "Long-term Portion",     value: fmtCAD(totalLT),              sub: "beyond 12 months" },
          { icon: CreditCard,    label: "Accrued Interest",      value: fmtCAD(totalAccrued),          sub: "year-end balance" },
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

      {/* ── Alert banners ── */}
      {(covenantAlert > 0 || variances > 0 || upcomingMaturities.length > 0) && (
        <div className="space-y-1.5">
          {covenantAlert > 0 && (
            <div className="flex items-center gap-2 rounded-[8px] border border-red-200 bg-red-50/60 dark:bg-red-950/20 dark:border-red-800/40 px-3 py-2">
              <ShieldAlert className="h-3.5 w-3.5 text-red-600 shrink-0" />
              <span className="text-xs text-red-700 dark:text-red-400 font-medium">
                {breachedCount > 0 && `${breachedCount} covenant${breachedCount > 1 ? "s" : ""} breached`}
                {breachedCount > 0 && atRiskCount > 0 && " · "}
                {atRiskCount > 0 && `${atRiskCount} at risk`}
                {" — review Covenants tab"}
              </span>
            </div>
          )}
          {variances > 0 && (
            <div className="flex items-center gap-2 rounded-[8px] border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800/40 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                {variances} TB reconciliation variance{variances > 1 ? "s" : ""} outstanding
              </span>
            </div>
          )}
          {upcomingMaturities.length > 0 && (
            <div className="flex items-center gap-2 rounded-[8px] border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800/40 px-3 py-2">
              <Calendar className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                {upcomingMaturities.length} loan{upcomingMaturities.length > 1 ? "s" : ""} maturing within 12 months —{" "}
                {upcomingMaturities.map(l => l.name).join(", ")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Active facilities table ── */}
      <div className="rounded-[10px] border border-border overflow-hidden">
        <div className="px-3 py-2 bg-muted/40 border-b border-border flex items-center justify-between">
          <span className="text-[11px] font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-primary" /> Active Facilities
          </span>
          <span className="text-[10px] text-muted-foreground">{loans.length} loan{loans.length !== 1 ? "s" : ""}</span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              {["Facility", "Lender", "Balance", "Rate", "Maturity", "Cov."].map(h => (
                <th key={h} className={`px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide ${h === "Facility" || h === "Lender" ? "text-left" : "text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedLoans.map((loan, i) => {
              const balCAD = toCAD(loan.currentBalance, loan.currency);
              const isExpanded = expandedLoan === loan.id;
              const covStatus = loanCovenantStatus(loan.id);
              return (
                <>
                  <tr
                    key={loan.id}
                    className={`border-b border-border/40 cursor-pointer hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                    onClick={() => setExpandedLoan(isExpanded ? null : loan.id)}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />}
                        <div>
                          <p className="font-medium text-foreground leading-tight">{loan.name}</p>
                          <p className="text-[10px] text-muted-foreground">{loan.type} · {loan.currency} · {loan.refNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{loan.lender}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">
                      {fmtCAD(balCAD)}
                      {loan.currency !== "CAD" && (
                        <p className="text-[10px] text-muted-foreground">({loan.currency} {loan.currentBalance.toLocaleString()})</p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <div className="flex flex-col items-end">
                        <span>{fmtPct(loan.rate)}</span>
                        <span className="text-[10px] text-muted-foreground">{loan.interestType}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <MaturityBadge dateStr={loan.maturityDate} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      {covStatus !== "—" ? <CovenantBadge status={covStatus} /> : <span className="text-[10px] text-muted-foreground">—</span>}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${loan.id}-expand`} className="bg-muted/10 border-b border-border/40">
                      <td colSpan={6} className="px-5 py-3">
                        <div className="space-y-2">
                          {/* Loan meta row */}
                          <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                            <span><strong className="text-foreground">Payment:</strong> {loan.paymentFrequency} · {loan.paymentType}</span>
                            <span><strong className="text-foreground">Day count:</strong> {loan.dayCountBasis}</span>
                            <span><strong className="text-foreground">Started:</strong> {fmtDate(loan.startDate)}</span>
                            <span><strong className="text-foreground">Matures:</strong> {fmtDate(loan.maturityDate)}</span>
                            <span><strong className="text-foreground">Curr. Portion:</strong> {fmtCAD(toCAD(loan.currentPortion, loan.currency))}</span>
                            <span><strong className="text-foreground">LT Portion:</strong> {fmtCAD(toCAD(loan.longTermPortion, loan.currency))}</span>
                            <span><strong className="text-foreground">Accrued Int.:</strong> {fmtCAD(toCAD(loan.accruedInterest, loan.currency))}</span>
                          </div>
                          {/* Covenant detail */}
                          {covenants.filter(c => c.loanId === loan.id).length > 0 && (
                            <div className="pt-1">
                              <p className="text-[11px] font-semibold text-foreground mb-1.5">Covenants</p>
                              <div className="space-y-1">
                                {covenants.filter(c => c.loanId === loan.id).map(cov => (
                                  <div key={cov.id} className="flex items-center justify-between text-[11px]">
                                    <span className="text-foreground">{cov.name}</span>
                                    <div className="flex items-center gap-2">
                                      {cov.currentValue !== undefined && cov.threshold !== undefined && (
                                        <span className="text-muted-foreground tabular-nums">
                                          {cov.currentValue.toFixed(2)} {cov.operator} {cov.threshold}
                                        </span>
                                      )}
                                      <CovenantBadge status={cov.status} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Amortization snapshot */}
                          <div className="pt-1">
                            <p className="text-[11px] font-semibold text-foreground mb-1.5 flex items-center gap-1">
                              <Activity className="h-3 w-3" /> Next 5 Payments
                            </p>
                            <AmortSnapshot loanId={loan.id} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-muted/30 border-t border-border font-semibold">
              <td className="px-3 py-2 text-xs text-foreground" colSpan={2}>Total (CAD equivalent)</td>
              <td className="px-3 py-2 text-right text-xs tabular-nums">{fmtCAD(totalDebt)}</td>
              <td />
              <td />
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Covenant detail toggle ── */}
      {covenants.length > 0 && (
        <div className="rounded-[10px] border border-border overflow-hidden">
          <button
            onClick={() => setCovsExpanded(e => !e)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
              {covenantAlert > 0
                ? <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                : <ShieldCheck className="h-3.5 w-3.5 text-green-500" />}
              Covenants
              {covenantAlert > 0 && (
                <span className="ml-1 text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 rounded-full px-1.5 py-0.5">
                  {covenantAlert} issue{covenantAlert > 1 ? "s" : ""}
                </span>
              )}
            </span>
            {covsExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
          {covsExpanded && (
            <table className="w-full text-xs border-t border-border">
              <thead>
                <tr className="bg-muted/20 border-b border-border">
                  {["Covenant", "Loan", "Threshold", "Actual", "Status"].map(h => (
                    <th key={h} className={`px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide ${h === "Covenant" || h === "Loan" ? "text-left" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {covenants.map((cov, i) => {
                  const loan = loans.find(l => l.id === cov.loanId);
                  return (
                    <tr key={cov.id} className={`border-b border-border/40 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                      <td className="px-3 py-2 font-medium text-foreground">{cov.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{loan?.name ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {cov.threshold !== undefined ? `${cov.operator} ${cov.threshold}` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {cov.currentValue !== undefined ? cov.currentValue.toFixed(2) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right"><CovenantBadge status={cov.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Recent Activity toggle ── */}
      {recentActivity.length > 0 && (
        <div className="rounded-[10px] border border-border overflow-hidden">
          <button
            onClick={() => setActExpanded(e => !e)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-primary" /> Recent Activity
            </span>
            {actExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
          {actExpanded && (
            <table className="w-full text-xs border-t border-border">
              <thead>
                <tr className="bg-muted/20 border-b border-border">
                  {["Date", "Loan", "Description", "Amount", "Type"].map(h => (
                    <th key={h} className={`px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide ${h === "Description" || h === "Loan" ? "text-left" : h === "Amount" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((act, i) => {
                  const loan = loans.find(l => l.id === act.loanId);
                  return (
                    <tr key={act.id} className={`border-b border-border/40 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{fmtDate(act.date)}</td>
                      <td className="px-3 py-2 text-foreground">{loan?.name ?? "—"}</td>
                      <td className="px-3 py-2 text-foreground max-w-[160px] truncate">{act.description}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">{fmtCAD(act.totalAmount)}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] border ${
                          act.type === "Payment" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          act.type === "Draw"    ? "bg-green-50 text-green-700 border-green-200" :
                          act.type === "Fee"     ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                   "bg-muted text-muted-foreground border-border"
                        }`}>{act.type}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Fiscal year summary pill ── */}
      <div className="rounded-[10px] bg-primary/5 border border-primary/15 px-3 py-2.5 text-xs text-foreground leading-relaxed">
        <strong>Client:</strong> {settings.client || "—"} &nbsp;·&nbsp;
        <strong>FYE:</strong> {fmtDate(settings.fiscalYearEnd)} &nbsp;·&nbsp;
        <strong>Base CCY:</strong> {settings.baseCurrency} &nbsp;·&nbsp;
        <strong>Pending JEs:</strong> {pendingJECount} &nbsp;·&nbsp;
        <strong>Facilities:</strong> {loans.length}
      </div>

      {/* ── Action buttons ── */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          onClick={() => toast.success("Schedule added to Long-term Debt workpaper")}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add to Workpaper
        </button>
        <button
          onClick={() => toast.success("Exporting long-term debt schedule to Excel…")}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" /> Export to Excel
        </button>
        <button
          onClick={() => toast.success("Generating AJEs for all active loans…")}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <TrendingUp className="h-3.5 w-3.5" /> Generate AJEs
        </button>
        <button
          onClick={() => toast.success("Opening amortization schedules…")}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" /> View Amortization
        </button>
      </div>

    </div>
  );
}
