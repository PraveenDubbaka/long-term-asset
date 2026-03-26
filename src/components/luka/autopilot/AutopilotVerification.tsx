import { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, RefreshCw, Zap, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Loan, EngagementSettings } from "@/types";

function LukaIcon({ size = 12 }: { size?: number }) {
  return <Zap className="text-white" size={size} fill="white" strokeWidth={0} />;
}

interface VerificationItem {
  label: string;
  value: string;
  warning?: boolean;
}

interface Props {
  loan: Loan;
  settings: EngagementSettings;
  onComplete: (hasWarning: boolean) => void;
}

const requiredFiles = [
  { name: "Prior year debt schedule", sub: "PDF — continuity + amortization" },
  { name: "Loan agreement / facility letter", sub: "PDF — signed copy" },
  { name: "Lender confirmation (if available)", sub: "PDF — optional but recommended" },
];

export function AutopilotVerification({ loan, settings, onComplete }: Props) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [done, setDone] = useState(false);

  const items: VerificationItem[] = [
    { label: "Entity name", value: settings.client || "Shipping Line Inc." },
    { label: "Loan reference", value: loan.refNumber },
    { label: "Year-end date", value: settings.fiscalYearEnd || "December 31, 2025" },
    { label: "Lender", value: loan.lender },
    { label: "Current balance", value: `${loan.currency} ${loan.currentBalance.toLocaleString("en-CA", { minimumFractionDigits: 2 })}` },
    { label: "Rate & type", value: `${loan.rate}% ${loan.interestType}` },
    { label: "GL — Principal", value: loan.glPrincipalAccount },
    { label: "GL — Interest Exp.", value: loan.glInterestExpenseAccount },
    { label: "Maturity date", value: new Date(loan.maturityDate).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }) },
    { label: "Day count basis", value: loan.dayCountBasis },
    { label: "Covenants", value: `${loan.covenantIds.length} covenant(s) tracked` },
    { label: "Team members", value: "Preparer / Reviewer / Partner" },
  ];

  useEffect(() => {
    if (done) return;
    const interval = setInterval(() => {
      setRevealedCount(prev => {
        const next = prev + 1;
        if (next >= items.length) {
          clearInterval(interval);
          setTimeout(() => {
            setDone(true);
            const hasWarning = items.some(i => i.warning);
            onComplete(hasWarning);
          }, 500);
        }
        return next;
      });
    }, 350);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const handleRerun = () => {
    setDone(false);
    setRevealedCount(0);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Luka message */}
      <div className="flex gap-3 px-4 pt-4 pb-3">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0 mt-0.5">
          <LukaIcon size={12} />
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          I'm verifying your loan data before automation. Each item below is cross-checked against the GL and engagement settings.
        </p>
      </div>

      <div className="flex flex-1 gap-4 px-4 pb-4 overflow-hidden min-h-0">
        {/* Left: verification items */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Loan Data Verification</p>
            </div>
            <div className="divide-y divide-border">
              {items.slice(0, revealedCount).map((item, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 animate-in fade-in slide-in-from-left-2 duration-300",
                    item.warning ? "bg-amber-50/50 dark:bg-amber-900/10" : ""
                  )}
                >
                  {item.warning ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  )}
                  <span className="text-xs text-foreground w-36 shrink-0">{item.label}</span>
                  <span className={cn("text-xs font-medium flex-1", item.warning ? "text-amber-700" : "text-foreground")}>
                    {item.value}
                  </span>
                </div>
              ))}
              {revealedCount < items.length && (
                <div className="px-4 py-2.5 flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-primary/40 border-t-primary animate-spin shrink-0" />
                  <span className="text-xs text-foreground">Verifying...</span>
                </div>
              )}
            </div>
          </div>

          {done && (
            <div className="mt-3 flex items-center gap-2 animate-in fade-in duration-500">
              <button
                onClick={handleRerun}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Rerun verification
              </button>
              <span className="text-xs text-foreground">·</span>
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verification complete
              </span>
            </div>
          )}
        </div>

        {/* Right: required files */}
        <div className="w-52 shrink-0">
          <div className="border border-amber-200 dark:border-amber-800 rounded-xl p-4 bg-amber-50/50 dark:bg-amber-900/10">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Must have files for automation
            </p>
            {requiredFiles.map((f, i) => (
              <div key={i} className="flex items-start gap-2 mb-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                <div>
                  <p className="text-xs font-medium text-foreground">{f.name}</p>
                  <p className="text-[10px] text-foreground">{f.sub}</p>
                </div>
              </div>
            ))}
            <p className="text-[10px] text-foreground mt-2 pt-2 border-t border-amber-200 dark:border-amber-800">
              *Only PDF file type allowed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
