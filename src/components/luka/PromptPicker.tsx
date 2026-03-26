import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const prompts = [
  { id: "variance", label: "Variance Analysis" },
  { id: "gl-analysis", label: "General Ledger Analysis" },
  { id: "account-recon", label: "Account Reconciliation" },
  { id: "account-recon-perform", label: "Perform Account Reconciliation" },
  { id: "bank-recon", label: "Bank Reconciliation" },
  { id: "aged-ar", label: "Aged AR Analysis" },
  { id: "loan-amort", label: "Loan Amortization" },
  { id: "capital-asset", label: "Capital Asset Amortization" },
  { id: "trial-balance", label: "Generate Trial Balance" },
  { id: "notes-gen", label: "Notes Generator" },
  { id: "client-health", label: "Run Client Health Check" },
  { id: "gross-profit", label: "Gross Profit Margin" },
];

interface PromptPickerProps {
  open: boolean;
  onSelect: (prompt: string) => void;
  onClose: () => void;
  filter: string;
}

export function PromptPicker({ open, onSelect, onClose, filter }: PromptPickerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = prompts.filter((p) =>
    p.label.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered.length > 0) {
        e.preventDefault();
        onSelect(filtered[selectedIndex].label);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, selectedIndex, onSelect, onClose]);

  if (!open || filtered.length === 0) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute bottom-full left-0 right-0 mb-2 z-50",
        "bg-background dark:bg-card border border-border rounded-[12px] shadow-lg",
        "animate-in slide-in-from-bottom-2 fade-in duration-200",
        "max-h-[280px] overflow-hidden flex flex-col"
      )}
    >
      <div className="flex-1 overflow-y-auto py-2">
        {filtered.map((prompt, i) => (
          <button
            key={prompt.id}
            onClick={() => onSelect(prompt.label)}
            className={cn(
              "w-full text-left px-4 py-2.5 text-sm transition-colors",
              i === selectedIndex
                ? "bg-primary/10 text-primary dark:bg-primary/20"
                : "text-foreground hover:bg-muted/60 dark:hover:bg-muted/30"
            )}
          >
            {prompt.label}
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs text-foreground">
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted/50 text-[10px] font-medium">Use</kbd>
          <span className="inline-flex gap-1">
            <kbd className="px-1 py-0.5 rounded border border-border bg-muted/50 text-[10px]">↑</kbd>
            <kbd className="px-1 py-0.5 rounded border border-border bg-muted/50 text-[10px]">↓</kbd>
          </span>
          <span>to navigate</span>
        </div>
        <div className="flex items-center gap-1">
          <span>To close, press</span>
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted/50 text-[10px] font-medium">Esc</kbd>
        </div>
      </div>
    </div>
  );
}
