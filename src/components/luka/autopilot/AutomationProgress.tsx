import { useState, useEffect, useRef } from "react";
import { Zap, StopCircle, Bell } from "lucide-react";
import { Button } from "@/components/wp-ui/button";
import { cn } from "@/lib/utils";
import type { Loan } from "@/types";

function LukaIcon({ size = 20 }: { size?: number }) {
  return <Zap className="text-white" size={size} fill="white" strokeWidth={0} />;
}

interface Props {
  loan: Loan;
  onComplete: () => void;
}

const logLines = [
  "Analyzing loan agreement documents...",
  "Verifying GL account mappings...",
  "Populating LT debt continuity schedule...",
  "Calculating amortization schedule...",
  "Accruing year-end interest...",
  "Running covenant compliance check...",
  "Generating FS disclosure note...",
  "Finalizing working paper cross-references...",
  "Automation complete ✓",
];

const logMilestones = [10, 22, 35, 48, 60, 72, 84, 94, 100];

export function AutomationProgress({ loan, onComplete }: Props) {
  const [progress, setProgress] = useState(0);
  const [revealedLines, setRevealedLines] = useState<string[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);

    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (doneRef.current) return prev;
        const next = Math.min(prev + 2, 100);

        // Reveal log lines at milestones
        const milestoneIdx = logMilestones.findIndex(m => m <= next && m > prev);
        if (milestoneIdx !== -1) {
          setRevealedLines(lines => {
            if (lines.length <= milestoneIdx) {
              return [...lines, logLines[milestoneIdx]];
            }
            return lines;
          });
        }

        if (next >= 100 && !doneRef.current) {
          doneRef.current = true;
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => onComplete(), 1200);
        }
        return next;
      });
    }, 160);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Automation Progress</p>
          <span className="text-xs font-mono text-foreground bg-muted/40 px-2 py-0.5 rounded-md">{formatTime(elapsedSeconds)}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(265_80%_55%)] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-bold text-primary w-10 text-right">{progress}%</span>
        </div>
        <p className="text-xs text-foreground mt-1 truncate">{loan.name} — {loan.refNumber}</p>
      </div>

      {/* Orb */}
      <div className="flex flex-col items-center py-5">
        <div className="relative flex items-center justify-center w-24 h-24 mb-3">
          <div className="absolute -inset-4 luka-ambient-glow" />
          <div className="absolute inset-0 luka-ambient-orb opacity-40" />
          <div className={cn(
            "relative flex items-center justify-center w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(265_80%_55%)] z-10 shadow-[0_0_30px_rgba(151,71,255,0.25)]",
            progress < 100 && "luka-thinking-spin"
          )}>
            <LukaIcon size={22} />
          </div>
        </div>
        <p className={cn("text-sm font-medium", progress < 100 ? "text-foreground luka-thinking-text" : "text-green-600")}>
          {progress < 100 ? "Luka is working" : "Automation complete!"}
        </p>
        {progress < 100 && (
          <span className="flex gap-0.5 mt-1">
            <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-1" />
            <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-2" />
            <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-3" />
          </span>
        )}
      </div>

      {/* Log lines */}
      <div className="flex-1 overflow-y-auto px-5 space-y-1.5 pb-3">
        {revealedLines.map((line, i) => (
          <div
            key={i}
            className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300"
          >
            <span className={cn(
              "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
              i === revealedLines.length - 1 && progress < 100 ? "bg-primary animate-pulse" : "bg-green-500"
            )} />
            <span className={cn(
              "text-xs font-mono",
              i === revealedLines.length - 1 ? "text-foreground" : "text-foreground"
            )}>
              {line}
            </span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="px-5 pb-5 flex items-center gap-2 border-t border-border pt-3">
        <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
          <StopCircle className="w-3.5 h-3.5" /> Stop
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Bell className="w-3.5 h-3.5" /> Notify me
        </Button>
      </div>
    </div>
  );
}
