import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface LukaThinkingMessageProps {
  visible: boolean;
}

export function LukaThinkingMessage({ visible }: LukaThinkingMessageProps) {
  if (!visible) return null;

  return (
    <div className="flex items-start gap-3 px-6 py-4 animate-fade-in">
      {/* Spinning Luka icon */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0 luka-thinking-spin">
        <Zap className="text-white" size={16} fill="white" strokeWidth={0} />
      </div>

      {/* Thinking text with shimmer */}
      <div className="flex items-center gap-2 pt-2">
        <span className="text-sm font-medium text-foreground luka-thinking-text">
          Thinking
        </span>
        <span className="flex gap-0.5">
          <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-1" />
          <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-2" />
          <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-3" />
        </span>
      </div>
    </div>
  );
}
