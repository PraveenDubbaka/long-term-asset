import { useState } from "react";
import { Zap, Bell, Settings, ArrowLeft, AlertTriangle, RefreshCw, Paperclip, Send } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import type { Loan } from "@/types";

function LukaIcon({ size = 12 }: { size?: number }) {
  return <Zap className="text-white" size={size} fill="white" strokeWidth={0} />;
}

interface Props {
  loan: Loan;
  onNewThread: () => void;
}

const maturityData = [
  { name: "Complete", value: 85 },
  { name: "Remaining", value: 15 },
];

const COLORS = ["hsl(var(--primary))", "hsl(var(--muted))"];

interface ActionItem {
  id: string;
  message: string;
  action: string;
  variant: "default" | "warning" | "info";
}

export function ObservationMode({ loan, onNewThread }: Props) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [inputValue, setInputValue] = useState("");

  const actionItems: ActionItem[] = [
    {
      id: "payment",
      message: "New payment recorded. Update amortization schedule?",
      action: "Update",
      variant: "info",
    },
    {
      id: "interest-diff",
      message: "Accrued interest differs from GL by $1,247. Investigate?",
      action: "Investigate",
      variant: "warning",
    },
    ...(loan.covenantIds.length > 0 ? [{
      id: "covenant",
      message: "DSCR approaching minimum threshold. Flag for review?",
      action: "Flag",
      variant: "warning" as const,
    }] : []),
    {
      id: "attachment",
      message: "New file uploaded. Attach to debt WP?",
      action: "Attach",
      variant: "info",
    },
  ];

  const visibleActions = actionItems.filter(a => !dismissedIds.has(a.id));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Luka message */}
      <div className="flex gap-3 px-4 pt-4 pb-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0 mt-0.5">
          <LukaIcon size={12} />
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          I have successfully completed the long-term debt workpaper automation for <strong>{loan.name}</strong>. I'm now in <strong>Observation Mode</strong> — monitoring your file and suggesting intelligent next actions.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {/* FILE MATURITY card */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">File Maturity</p>
            <div className="flex items-center gap-1.5">
              <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted/60 transition-colors relative">
                <Bell className="w-3.5 h-3.5 text-foreground" />
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary text-white text-[8px] flex items-center justify-center font-bold">3</span>
              </button>
              <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted/60 transition-colors">
                <Settings className="w-3.5 h-3.5 text-foreground" />
              </button>
            </div>
          </div>
          <div className="p-4 flex items-center gap-4">
            {/* Donut */}
            <div className="relative w-20 h-20 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={maturityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={26}
                    outerRadius={36}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {maturityData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-foreground">85%</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 flex-1">
              <div>
                <p className="text-base font-bold text-foreground">4</p>
                <p className="text-[10px] text-foreground">WPs complete</p>
              </div>
              <div>
                <p className="text-base font-bold text-amber-500">1</p>
                <p className="text-[10px] text-foreground">Pending review</p>
              </div>
              <div>
                <p className="text-base font-bold text-foreground">2</p>
                <p className="text-[10px] text-foreground">Disclosures ready</p>
              </div>
              <div>
                <p className="text-base font-bold text-destructive">0/2</p>
                <p className="text-[10px] text-foreground">Signed off</p>
              </div>
            </div>
          </div>
        </div>

        {/* Suggested actions */}
        {visibleActions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Suggested Actions</p>
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                {visibleActions.length}
              </span>
            </div>
            <div className="space-y-2">
              {visibleActions.map(item => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 border rounded-xl px-3 py-2.5 animate-in fade-in duration-200",
                    item.variant === "warning"
                      ? "border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-900/10"
                      : "border-border bg-muted/20"
                  )}
                >
                  {item.variant === "warning" && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                  {item.variant === "info" && <RefreshCw className="w-3.5 h-3.5 text-primary shrink-0" />}
                  <p className="text-xs text-foreground flex-1">{item.message}</p>
                  <button
                    onClick={() => setDismissedIds(prev => new Set([...prev, item.id]))}
                    className={cn(
                      "text-[10px] font-semibold px-2.5 py-1 rounded-md transition-colors shrink-0",
                      item.variant === "warning"
                        ? "bg-amber-500 text-white hover:bg-amber-600"
                        : "bg-primary text-white hover:bg-primary/90"
                    )}
                  >
                    {item.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back to threads */}
        <button
          onClick={onNewThread}
          className="flex items-center gap-1.5 text-xs text-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to threads
        </button>
      </div>

      {/* Input bar */}
      <div className="px-4 pb-4 pt-2 border-t border-border">
        <div className="flex items-center gap-2 border border-border rounded-xl px-3 py-2 bg-background dark:bg-card">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Type # for prompts or just ask anything..."
            className="flex-1 text-xs bg-transparent outline-none border-none text-foreground placeholder:text-foreground"
          />
          <button className="h-6 w-6 flex items-center justify-center text-foreground hover:text-foreground transition-colors">
            <Paperclip className="w-3.5 h-3.5" />
          </button>
          <button className="h-6 w-6 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors">
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
