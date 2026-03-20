import { Zap, Clock, Diamond, AlertTriangle } from "lucide-react";
import { Button } from "@/components/wp-ui/button";
import type { Loan } from "@/types";

function LukaIcon({ size = 12 }: { size?: number }) {
  return <Zap className="text-white" size={size} fill="white" strokeWidth={0} />;
}

interface Props {
  loan: Loan;
  onStartMagic: () => void;
}

export function AutopilotMagic({ loan, onStartMagic }: Props) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Luka message */}
      <div className="flex gap-3 px-4 pt-4 pb-3">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0 mt-0.5">
          <LukaIcon size={12} />
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          All loan documentation gathered successfully. Click <strong>'Start Magic'</strong> when ready to automate the working papers for <strong>{loan.name}</strong>.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-5">
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="border border-border rounded-xl p-4 text-center bg-muted/20">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <p className="text-lg font-bold text-foreground">8 mins</p>
            <p className="text-[10px] text-muted-foreground">Completion time</p>
          </div>
          <div className="border border-border rounded-xl p-4 text-center bg-muted/20">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
              <Zap className="w-4 h-4 text-green-600" fill="currentColor" strokeWidth={0} />
            </div>
            <p className="text-lg font-bold text-foreground">3.2 hrs</p>
            <p className="text-[10px] text-muted-foreground">Time saved</p>
          </div>
          <div className="border border-border rounded-xl p-4 text-center bg-muted/20">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
              <Diamond className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-lg font-bold text-foreground">1.2</p>
            <p className="text-[10px] text-muted-foreground">Credits estimated</p>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2.5 border border-amber-200 dark:border-amber-800 rounded-xl p-3 bg-amber-50/60 dark:bg-amber-900/10">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            Working papers will be <strong>locked during automation</strong> — team access will be paused until completion.
          </p>
        </div>

        {/* Luka orb */}
        <div className="flex flex-col items-center py-6 gap-4">
          <div className="relative flex items-center justify-center w-24 h-24">
            <div className="absolute -inset-4 luka-ambient-glow opacity-60" />
            <div className="absolute inset-0 luka-ambient-orb opacity-30" />
            <div className="relative flex items-center justify-center w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(265_80%_55%)] z-10 shadow-[0_0_30px_rgba(151,71,255,0.2)]">
              <LukaIcon size={24} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Ready to automate your long-term debt workpapers
          </p>
        </div>

        {/* Start button */}
        <Button
          onClick={onStartMagic}
          className="w-full h-12 text-base bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(265_80%_55%)] text-white font-semibold shadow-md hover:opacity-90 transition-opacity gap-2"
        >
          <Zap className="w-5 h-5" fill="white" strokeWidth={0} />
          Start Magic
        </Button>
      </div>
    </div>
  );
}
