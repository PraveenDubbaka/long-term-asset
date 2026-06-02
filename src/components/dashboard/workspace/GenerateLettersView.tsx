import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Eye,
  RotateCcw,
  Copy,
  Download,
  Archive,
  Share2,
  RefreshCw,
  Check,
} from "lucide-react";
import lukaIdle from "@/assets/luka-idle.gif";
import BottomPrompter from "./BottomPrompter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LetterRow {
  title: string;
  subtitle: string;
}

const LETTERS: LetterRow[] = [
  { title: "Engagement Letter", subtitle: "Engagement Letter Compilation CSRS 4200" },
  { title: "Management Responsibility Letter", subtitle: "Management Responsibility & Acknowledgement CSRS 4200" },
  { title: "Communication of Significant Matters Letter", subtitle: "Significant matters are identified" },
  { title: "Independence Disclosure Letter", subtitle: "To communicate lack of independence if applicable" },
];

const FONT = "'DM Sans', system-ui, sans-serif";

interface Props {
  activePreview?: string | null;
  onPreview?: (title: string) => void;
}

const GenerateLettersView = ({ activePreview = null, onPreview }: Props = {}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (title: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });

  const hasSelection = selected.size > 0;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-full flex flex-col">
        <div className="flex-1 w-full max-w-full md:max-w-[92%] lg:max-w-[960px] mx-auto px-6 py-8 transition-all duration-500 ease-out">
          <div className="flex items-start gap-4">
            <div className="shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center">
              <img src={lukaIdle} alt="Luka" className="w-8 h-8 object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-[15px] leading-relaxed"
                style={{ color: "hsl(222 35% 16%)", fontFamily: FONT }}
              >
                Based on the data available — I'll locate and replicate templates for this engagement
                and prepare them for you. Preview or select to save, download and share.
              </p>

              <div className="mt-5 flex flex-col gap-2.5">
                {LETTERS.map((l, idx) => {
                  const isActive = activePreview === l.title;
                  const isSelected = selected.has(l.title);
                  return (
                    <Tooltip key={l.title}>
                      <TooltipTrigger asChild>
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: idx * 0.08, ease: "easeOut" }}
                          onClick={() => toggle(l.title)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggle(l.title);
                            }
                          }}
                          aria-pressed={isSelected}
                          className="flex items-center gap-4 px-4 py-3 rounded-[12px] cursor-pointer transition-all"
                          style={{
                            background: isSelected
                              ? "hsl(207 60% 97%)"
                              : isActive
                                ? "hsl(220 95% 98%)"
                                : "hsl(0 0% 100%)",
                            border: isSelected
                              ? "1.5px solid hsl(207 50% 85%)"
                              : isActive
                                ? "1px solid hsl(220 95% 50%)"
                                : "1px solid hsl(220 20% 90%)",
                            boxShadow: isActive
                              ? "0 0 0 3px hsl(220 95% 50% / 0.12), 0 1px 2px hsl(222 30% 20% / 0.04)"
                              : "0 1px 2px hsl(222 30% 20% / 0.03)",
                          }}
                        >
                          <div
                            className="shrink-0 w-10 h-10 rounded-[10px] flex items-center justify-center relative"
                            style={{
                              background: "hsl(265 60% 96%)",
                              border: "1px solid hsl(265 50% 88%)",
                            }}
                          >
                            <FileText size={16} style={{ color: "hsl(265 75% 55%)" }} strokeWidth={2.2} />
                            {isSelected && (
                              <span
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ background: "hsl(207 71% 38%)", color: "white" }}
                              >
                                <Check size={10} strokeWidth={3} />
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className="text-[14px] font-bold truncate flex items-center gap-2"
                              style={{ color: "hsl(222 35% 14%)", fontFamily: FONT }}
                            >
                              <span className="truncate">{l.title}</span>
                              {isSelected && (
                                <span
                                  className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                                  style={{ background: "hsl(207 50% 93%)", color: "hsl(207 71% 38%)" }}
                                >
                                  Selected
                                </span>
                              )}
                            </p>
                            <p
                              className="mt-0.5 text-[12.5px] truncate"
                              style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
                            >
                              {l.subtitle}
                            </p>
                          </div>

                          <div
                            className="shrink-0 flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              title="Regenerate"
                              className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[hsl(220_20%_94%)]"
                              style={{
                                border: "1px solid hsl(220 20% 88%)",
                                background: "hsl(220 20% 97%)",
                                color: "hsl(222 25% 30%)",
                              }}
                            >
                              <RotateCcw size={13} strokeWidth={2.2} />
                            </button>
                            <button
                              type="button"
                              title="Preview"
                              aria-label={`Preview ${l.title}`}
                              onClick={() => onPreview?.(l.title)}
                              className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[hsl(220_20%_94%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(207_71%_38%)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                              style={{
                                border: isActive ? "1px solid hsl(207 71% 38%)" : "1px solid hsl(220 20% 88%)",
                                background: isActive ? "hsl(207 71% 38%)" : "hsl(220 20% 97%)",
                                color: isActive ? "hsl(0 0% 100%)" : "hsl(207 71% 38%)",
                              }}
                            >
                              <Eye size={14} strokeWidth={2.2} />
                            </button>
                          </div>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {isSelected ? "Click to deselect" : "Click to select"}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              {/* Action toolbar */}
              <div className="mt-4 flex items-center gap-2">
                {[
                  { icon: Copy, label: "Copy", active: true },
                  { icon: Archive, label: "Save", active: hasSelection },
                  { icon: Download, label: "Download", active: hasSelection },
                  { icon: Share2, label: "Share", active: hasSelection },
                  { icon: RefreshCw, label: "Regenerate", active: true },
                ].map(({ icon: Icon, label, active }) => (
                  <button
                    key={label}
                    type="button"
                    title={label}
                    disabled={!active}
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[hsl(220_20%_94%)] disabled:cursor-not-allowed"
                    style={{
                      border: "1px solid hsl(220 20% 88%)",
                      background: "hsl(0 0% 100%)",
                      color: active ? "hsl(222 25% 30%)" : "hsl(220 15% 75%)",
                    }}
                  >
                    <Icon size={13} strokeWidth={2.2} />
                  </button>
                ))}
                {hasSelection && (
                  <span
                    className="ml-2 text-[12px]"
                    style={{ color: "hsl(222 20% 40%)", fontFamily: FONT }}
                  >
                    {selected.size} selected
                  </span>
                )}
              </div>

              <p
                className="mt-3 text-[11px]"
                style={{ color: "hsl(222 15% 55%)", fontFamily: FONT }}
              >
                9:02 AM
              </p>
            </div>
          </div>
        </div>
        <BottomPrompter placeholder="Ask Luka about these letters..." />
      </div>
    </TooltipProvider>
  );
};

export default GenerateLettersView;
