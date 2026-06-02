import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck,
  Eye,
  Sparkles,
  Upload,
  Copy,
  Download,
  Archive,
  Share2,
  RefreshCw,
  UploadCloud,
  FileText,
  Trash2,
  Loader2,
  CheckCircle2,
  Check,
} from "lucide-react";
import lukaIdle from "@/assets/luka-idle.gif";
import BottomPrompter from "./BottomPrompter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChecklistRow {
  title: string;
  completed: number;
  total: number;
  status: "Pending" | "Accepted" | "Review";
}

const CHECKLISTS: ChecklistRow[] = [
  { title: "Client acceptance and continuance", completed: 6, total: 4, status: "Pending" },
  { title: "Independence", completed: 4, total: 4, status: "Pending" },
  { title: "Knowledge of client business", completed: 12, total: 12, status: "Pending" },
  { title: "Planning", completed: 6, total: 6, status: "Pending" },
];

const FONT = "'DM Sans', system-ui, sans-serif";

const RECOMMENDED_COLUMNS: string[][] = [
  ["Client acceptance and continuance", "Knowledge of clients business"],
  ["Planning", "Additional documents for improved accuracy."],
  ["Independance"],
];

interface PrefilledFile {
  id: string;
  name: string;
  size: string;
  type: string;
  caption: string;
}

const PREFILLED_FILES: PrefilledFile[] = [
  { id: "fs", name: "FS_2024", size: "1.6 MB", type: "PDF", caption: "Financial Statements 2024" },
  { id: "tb", name: "Prior year TB_2024", size: "1.6 MB", type: "PDF", caption: "Trial Balance 2024" },
  { id: "gl", name: "GL_2024", size: "1.6 MB", type: "PDF", caption: "General Ledger 2024" },
  { id: "t2", name: "T2 Tax Returns_2024", size: "1.6 MB", type: "PDF", caption: "T2 Tax Returns 2024" },
  { id: "wp", name: "Prior-year WP", size: "1.6 MB", type: "PDF", caption: "Capital Asset Amortization 2024" },
];

const statusStyles = (status: ChecklistRow["status"]) => {
  switch (status) {
    case "Pending":
      return {
        background: "hsl(38 100% 96%)",
        color: "hsl(28 85% 45%)",
        border: "1px solid hsl(38 90% 80%)",
      };
    case "Accepted":
      return {
        background: "hsl(145 60% 95%)",
        color: "hsl(145 63% 32%)",
        border: "1px solid hsl(145 50% 78%)",
      };
    case "Review":
      return {
        background: "hsl(265 60% 96%)",
        color: "hsl(265 60% 45%)",
        border: "1px solid hsl(265 50% 85%)",
      };
  }
};

interface Props {
  variant?: "default" | "upload";
  activePreview?: string | null;
  onPreview?: (title: string) => void;
}

const findScrollableParent = (el: HTMLElement | null): HTMLElement | null => {
  let node = el?.parentElement ?? null;
  while (node) {
    const style = window.getComputedStyle(node);
    if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
};

const UploadBlock = () => {
  const [files, setFiles] = useState<PrefilledFile[]>(PREFILLED_FILES);
  const fileRef = useRef<HTMLInputElement>(null);

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  return (
    <div>
      <p
        className="text-[15px] leading-relaxed mb-4"
        style={{ color: "hsl(222 35% 16%)", fontFamily: FONT }}
      >
        Drag and drop your checklists from last year below, whether from your computer or a repository. I'll scan them to automatically fill in this year's responses. You can also add additional files for better accuracy.
      </p>

      <div
        className="rounded-[14px] p-5"
        style={{ background: "hsl(220 25% 97%)", border: "1px solid hsl(220 20% 88%)" }}
      >
        <div
          className="text-[11px] font-bold tracking-[0.14em] mb-3"
          style={{ color: "hsl(222 30% 18%)", fontFamily: "'Rajdhani', sans-serif" }}
        >
          RECOMMENDED FILES
        </div>
        <div className="grid grid-cols-3 gap-x-6 gap-y-1.5 mb-4">
          {RECOMMENDED_COLUMNS.map((col, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              {col.map((item, j) => (
                <div
                  key={j}
                  className="flex items-center gap-2 text-[13px]"
                  style={{ color: "hsl(222 20% 35%)", fontFamily: FONT }}
                >
                  <span className="w-1 h-1 rounded-full shrink-0" style={{ background: "hsl(222 20% 50%)" }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-[12px] py-8 flex flex-col items-center justify-center gap-2 transition-colors hover:bg-[hsl(220_30%_98%)]"
          style={{ background: "hsl(0 0% 100%)", border: "1.5px dashed hsl(220 25% 78%)" }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "hsl(220 25% 94%)" }}
          >
            <UploadCloud size={18} style={{ color: "hsl(222 30% 35%)" }} strokeWidth={2} />
          </div>
          <div className="text-[13.5px]" style={{ color: "hsl(222 20% 35%)" }}>
            <span className="font-bold" style={{ color: "hsl(220 95% 50%)" }}>Click to upload</span>{" "}
            all available prior year documents or drag and drop
          </div>
          <div className="text-[12px]" style={{ color: "hsl(222 15% 55%)" }}>
            PDF, Excel, Word, images — anything you have
          </div>
          <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => (e.target.value = "")} />
        </button>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <AnimatePresence initial={false}>
            {files.map((f) => (
              <motion.div
                key={f.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="rounded-[12px] p-3"
                style={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 20% 88%)" }}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
                    style={{ background: "hsl(220 25% 95%)" }}
                  >
                    <FileText size={14} style={{ color: "hsl(222 30% 35%)" }} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[12.5px] font-semibold truncate"
                      style={{ color: "hsl(222 35% 14%)", fontFamily: FONT }}
                    >
                      {f.name}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: "hsl(222 15% 50%)" }}>
                      {f.type} · {f.size}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Preview"
                      className="w-6 h-6 rounded-[6px] flex items-center justify-center transition-colors hover:bg-[hsl(220_20%_94%)]"
                      style={{ border: "1px solid hsl(220 20% 88%)", color: "hsl(222 25% 30%)" }}
                    >
                      <Eye size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      title="Delete"
                      className="w-6 h-6 rounded-[6px] flex items-center justify-center transition-colors hover:bg-[hsl(0_80%_96%)]"
                      style={{ border: "1px solid hsl(0 70% 88%)", color: "hsl(0 65% 50%)", background: "hsl(0 80% 98%)" }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[11.5px]" style={{ color: "hsl(145 55% 35%)", fontFamily: FONT }}>
                  <CheckCircle2 size={12} strokeWidth={2.4} />
                  <span>{f.caption}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          disabled
          className="px-5 py-2.5 rounded-[12px] text-[13.5px] font-semibold cursor-not-allowed"
          style={{
            background: "hsl(220 20% 92%)",
            color: "hsl(222 15% 60%)",
            border: "1px solid hsl(220 20% 86%)",
            fontFamily: FONT,
          }}
        >
          Generate
        </button>
      </div>

      <p className="mt-3 text-[11px]" style={{ color: "hsl(222 15% 55%)", fontFamily: FONT }}>
        9:02 AM
      </p>
    </div>
  );
};

const PopulateChecklistsView = ({ variant = "default", activePreview = null, onPreview }: Props) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const firstRowRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (title: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  const hasSelection = selected.size > 0;

  useEffect(() => {
    const loadTimer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(loadTimer);
  }, [variant]);

  useEffect(() => {
    if (loading) return;
    const scroller = findScrollableParent(rootRef.current);
    const target = variant === "upload" ? resultsRef.current : firstRowRef.current;
    if (!target) return;

    const scrollTimer = setTimeout(() => {
      if (scroller) {
        const targetTop =
          target.getBoundingClientRect().top -
          scroller.getBoundingClientRect().top +
          scroller.scrollTop -
          24;
        scroller.scrollTo({ top: targetTop, behavior: "smooth" });
      } else {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      const focusTimer = setTimeout(
        () => firstRowRef.current?.focus({ preventScroll: true }),
        650,
      );
      return () => clearTimeout(focusTimer);
    }, 150);
    return () => clearTimeout(scrollTimer);
  }, [loading, variant]);

  return (
    <TooltipProvider delayDuration={200}>
    <div ref={rootRef} className="min-h-full flex flex-col">
      <div className="flex-1 w-full max-w-full md:max-w-[92%] lg:max-w-[960px] mx-auto px-6 py-8 transition-all duration-500 ease-out">
      {variant === "upload" && (
        <div className="flex items-start gap-4 mb-8">
          <div className="shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center">
            <img src={lukaIdle} alt="Luka" className="w-8 h-8 object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <UploadBlock />
          </div>
        </div>
      )}

      {/* Header */}
      <div ref={resultsRef} className="flex items-start gap-4 scroll-mt-6">
        <div className="shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center">
          <img src={lukaIdle} alt="Luka" className="w-8 h-8 object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-[15px] leading-relaxed"
            style={{ color: "hsl(222 35% 16%)", fontFamily: FONT }}
          >
            Pre-populating responses for checklists from prior year files. Preview to accept the
            responses or select to download, save or share with the client.
          </p>

          {loading && (
            <div
              className="mt-5 flex items-center gap-2.5 px-4 py-3 rounded-[12px]"
              style={{ background: "hsl(220 25% 97%)", border: "1px solid hsl(220 20% 90%)" }}
            >
              <Loader2
                size={14}
                className="animate-spin"
                style={{ color: "hsl(265 75% 55%)" }}
                strokeWidth={2.4}
              />
              <span
                className="text-[13px]"
                style={{ color: "hsl(222 25% 30%)", fontFamily: FONT }}
              >
                Luka is populating your checklists…
              </span>
            </div>
          )}

          {/* Checklist rows */}
          {!loading && (
          <div className="mt-5 flex flex-col gap-2.5">
            {CHECKLISTS.map((c, idx) => {
              const isActive = activePreview === c.title;
              const isSelected = selected.has(c.title);
              return (
              <Tooltip key={c.title}>
                <TooltipTrigger asChild>
                  <motion.div
                    ref={idx === 0 ? firstRowRef : undefined}
                    tabIndex={idx === 0 ? -1 : undefined}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.08, ease: "easeOut" }}
                    onClick={() => toggleSelect(c.title)}
                    role="button"
                    aria-pressed={isSelected}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleSelect(c.title);
                      }
                    }}
                    className="flex items-center gap-4 px-4 py-3 rounded-[12px] outline-none focus-visible:ring-2 focus-visible:ring-[hsl(207_71%_38%)]/40 scroll-mt-6 transition-all cursor-pointer"
                    style={{
                      background: isSelected
                        ? "hsl(207 60% 97%)"
                        : isActive
                          ? "hsl(220 95% 98%)"
                          : "hsl(0 0% 100%)",
                      border: isSelected
                        ? "1.5px solid hsl(207 50% 85%)"
                        : isActive
                          ? "1.5px solid hsl(220 95% 50%)"
                          : "1px solid hsl(220 20% 90%)",
                      boxShadow: isActive
                        ? "0 2px 12px hsl(220 95% 50% / 0.12)"
                        : "0 1px 2px hsl(222 30% 20% / 0.03)",
                    }}
                  >
                    <div
                      className="shrink-0 w-9 h-9 rounded-[10px] flex items-center justify-center relative"
                      style={{
                        background: "hsl(20 100% 96%)",
                        border: "1px solid hsl(20 90% 88%)",
                      }}
                    >
                      <ClipboardCheck size={16} style={{ color: "hsl(20 85% 55%)" }} strokeWidth={2.2} />
                      {isSelected && (
                        <span
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: "hsl(207 71% 38%)", color: "white" }}
                        >
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </div>

                    <span
                      className="flex-1 text-[14px] font-semibold flex items-center gap-2 min-w-0"
                      style={{ color: "hsl(222 35% 16%)", fontFamily: FONT }}
                    >
                      <span className="truncate">{c.title}</span>
                      {isSelected && (
                        <span
                          className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: "hsl(207 50% 93%)", color: "hsl(207 71% 38%)" }}
                        >
                          Selected
                        </span>
                      )}
                    </span>

                    <span
                      className="text-[13px]"
                      style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
                    >
                      <span
                        className="font-bold"
                        style={{ color: "hsl(222 35% 16%)" }}
                      >
                        {c.completed}
                      </span>
                      /{c.total} responses
                    </span>

                    <span
                      className="text-[11.5px] font-semibold px-3 py-1 rounded-full"
                      style={{ ...statusStyles(c.status), fontFamily: FONT }}
                    >
                      {c.status}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreview?.(c.title);
                      }}
                      className="shrink-0 w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[hsl(220_20%_94%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(207_71%_38%)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      style={{
                        border: isActive ? "1px solid hsl(207 71% 38%)" : "1px solid hsl(220 20% 88%)",
                        background: isActive ? "hsl(207 71% 38%)" : "hsl(220 20% 97%)",
                        color: isActive ? "hsl(0 0% 100%)" : "hsl(207 71% 38%)",
                      }}
                      title="Preview"
                      aria-label={`Preview ${c.title}`}
                    >
                      <Eye size={14} strokeWidth={2.2} />
                    </button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {isSelected ? "Click to deselect" : "Click to select"}
                </TooltipContent>
              </Tooltip>
              );
            })}
          </div>
          )}

          {/* Upload your own banner */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mt-4 flex items-center gap-3 px-4 py-3 rounded-[12px]"
            style={{
              background:
                "linear-gradient(135deg, hsl(265 60% 97%) 0%, hsl(220 60% 98%) 100%)",
              border: "1px solid hsl(265 40% 92%)",
            }}
          >
            <div
              className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: "hsl(265 60% 94%)",
                border: "1px solid hsl(265 50% 86%)",
              }}
            >
              <Sparkles size={15} style={{ color: "hsl(265 75% 55%)" }} strokeWidth={2.2} />
            </div>
            <p
              className="flex-1 text-[13.5px] italic"
              style={{ color: "hsl(222 30% 25%)", fontFamily: FONT }}
            >
              Don't like what I have generated?{" "}
              <span className="font-bold not-italic" style={{ color: "hsl(222 35% 14%)" }}>
                Upload your own
              </span>{" "}
              and I'll regenerate for you
            </p>
            <button
              type="button"
              className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold transition-colors hover:bg-[hsl(265_60%_96%)]"
              style={{
                background: "hsl(0 0% 100%)",
                border: "1px solid hsl(265 50% 85%)",
                color: "hsl(265 75% 50%)",
                fontFamily: FONT,
              }}
            >
              <Upload size={13} strokeWidth={2.4} />
              Upload your own
            </button>
          </motion.div>

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
      <BottomPrompter placeholder="Ask Luka about these checklists..." />
    </div>
    </TooltipProvider>
  );
};

export default PopulateChecklistsView;
