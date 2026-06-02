import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2, Lock, Clock, Users, Sparkles, RotateCcw, Plus, Minus, UploadCloud, FileCheck2, FileX2, Loader2, Eye, Trash2, FileText } from "lucide-react";
import lukaIdle from "@/assets/luka-idle.gif";
import lukaResponding from "@/assets/luka-responding.gif";

interface StepDef {
  title: string;
  details: string[];
}

const STEPS: StepDef[] = [
  {
    title: "Collecting prior year engagement data from the system",
    details: ["Entity Name", "Engagement ID", "Period year end date"],
  },
  {
    title: "Validating source connections and available connector",
    details: [
      "Source connection established. Connected to QuickBooks",
      "Plaid connection established",
      "Available connectors gathered",
    ],
  },
  {
    title: "Checking team members available for this engagement",
    details: [
      "Added 3 team members",
      "John Doe (Preparer), Jim Lekar (Reviewer) and Phoenix Marie (Partner)",
    ],
  },
  {
    title: "Validating components",
    details: ["Header component added", "Footer component added"],
  },
  {
    title: "Checking signature",
    details: ["Signature component available"],
  },
  {
    title: "Available default templates in My Templates",
    details: ["Letter template added", "Management responsibility template added"],
  },
  {
    title: "Available checklists along with responses identified",
    details: ["All engagement checklists pulled"],
  },
  {
    title: "Checking for financial statement template with notes",
    details: ["All default templates fetched", "Notes available"],
  },
  {
    title: "Checking credits availibility for engagement automation",
    details: ["Sufficient credits available for full automation"],
  },
];

// +25% slower for ~20% perceived slowdown
const STEP_INTERVAL = 1375;
const HEADLINE_DELAY = 440;
const STEPS_START_DELAY = 1500;

interface EngagementVerificationMessageProps {
  onLoadingChange?: (loading: boolean) => void;
  onInitialize?: () => void;
  variant?: "default" | "upload";
}

const EngagementVerificationMessage = ({
  onLoadingChange,
  onInitialize,
  variant = "default",
}: EngagementVerificationMessageProps) => {
  const [runId, setRunId] = useState(0);
  const [showHeadline, setShowHeadline] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set());
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  );

  useEffect(() => {
    onLoadingChange?.(true);
    const t1 = setTimeout(() => setShowHeadline(true), HEADLINE_DELAY);
    const t2 = setTimeout(() => setVisibleCount(1), STEPS_START_DELAY);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  useEffect(() => {
    if (visibleCount === 0 || visibleCount >= STEPS.length) return;
    const t = setTimeout(() => setVisibleCount((c) => c + 1), STEP_INTERVAL);
    return () => clearTimeout(t);
  }, [visibleCount]);

  useEffect(() => {
    if (completedCount >= visibleCount - (visibleCount >= STEPS.length ? 0 : 1)) return;
    const t = setTimeout(
      () => setCompletedCount((c) => Math.min(c + 1, STEPS.length)),
      STEP_INTERVAL - 250
    );
    return () => clearTimeout(t);
  }, [visibleCount, completedCount]);

  const allDone = completedCount >= STEPS.length;

  useEffect(() => {
    if (allDone) onLoadingChange?.(false);
  }, [allDone, onLoadingChange]);

  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (visibleCount === 0) return;
    const id = window.setTimeout(() => {
      bottomAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 80);
    return () => window.clearTimeout(id);
  }, [visibleCount, completedCount, allDone]);

  const handleRerun = () => {
    setShowHeadline(false);
    setVisibleCount(0);
    setCompletedCount(0);
    setOpenSteps(new Set());
    setTime(
      new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    );
    setRunId((r) => r + 1);
  };

  const toggleStep = (idx: number, isDone: boolean) => {
    if (!isDone || !allDone) return;
    setOpenSteps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const [stepsCollapsed, setStepsCollapsed] = useState(false);

  const toggleAllSteps = () => {
    if (!allDone) return;
    setStepsCollapsed((c) => !c);
  };

  return (
    <div className="w-full max-w-full md:max-w-[92%] lg:max-w-[960px] mx-auto px-6 py-8 transition-all duration-500 ease-out">
      <div className="flex items-start gap-4">
        {/* Luka avatar — animated GIF while responding, static when done */}
        <div className="shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center">
          <img
            src={allDone ? lukaIdle : lukaResponding}
            alt="Luka"
            className={
              allDone
                ? "w-8 h-8 object-contain transition-transform duration-200 hover:scale-110"
                : "w-11 h-11 object-contain -m-1.5 transition-transform duration-200 hover:scale-110"
            }
          />
        </div>

        <div className="min-w-0 flex-1">
          {/* Headline */}
          <AnimatePresence>
            {showHeadline && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-[15px] leading-relaxed"
                style={{
                  color: "hsl(222 35% 16%)",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >
                Before initializing automation for this engagement, I'll verify
                the engagement details to gather the required information for a
                seamless automation setup
              </motion.p>
            )}
          </AnimatePresence>

          {/* Status line */}
          {showHeadline && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-4 flex items-center gap-2"
            >
              <span
                className="text-[14px] font-semibold italic"
                style={{ color: "hsl(222 30% 22%)" }}
              >
              {allDone ? (
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleAllSteps}
                    aria-label={stepsCollapsed ? "Expand all steps" : "Collapse all steps"}
                    className="inline-flex items-center justify-center w-5 h-5 rounded-[4px] transition-colors hover:bg-[hsl(220_20%_92%)]"
                    style={{
                      border: "1px solid hsl(220 20% 80%)",
                      background: "hsl(0 0% 100%)",
                      color: "hsl(222 25% 35%)",
                    }}
                  >
                    {stepsCollapsed ? <Plus size={12} strokeWidth={2.4} /> : <Minus size={12} strokeWidth={2.4} />}
                  </button>
                  Engagement Verification complete
                </span>
              ) : (
                "Engagement Verificaiton in progress"
              )}
              </span>
              {!allDone && (
                <span className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "hsl(265 75% 60%)" }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.25,
                      }}
                    />
                  ))}
                </span>
              )}
            </motion.div>
          )}

          {/* Steps */}
          <div className="mt-3" style={{ display: stepsCollapsed ? "none" : undefined }}>
            <AnimatePresence initial={false}>
              {STEPS.slice(0, visibleCount).map((step, idx) => {
                const isDone = idx < completedCount;
                const isOpen = openSteps.has(idx);
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    style={{ borderTop: "1px solid hsl(220 20% 92%)" }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleStep(idx, isDone)}
                      disabled={!isDone || !allDone}
                      className="w-full flex items-center gap-3 py-3 text-left"
                      style={{ cursor: isDone && allDone ? "pointer" : "default" }}
                      aria-expanded={isOpen}
                    >
                      <motion.span
                        animate={{ rotate: isOpen ? 0 : -90 }}
                        transition={{ duration: 0.2 }}
                        className="shrink-0 inline-flex"
                        style={{ color: "hsl(222 15% 55%)" }}
                      >
                        <ChevronDown size={14} />
                      </motion.span>
                      <span
                        className="flex-1 text-[14px]"
                        style={{
                          color: isDone ? "hsl(222 15% 50%)" : "hsl(222 25% 35%)",
                          fontFamily: "'DM Sans', system-ui, sans-serif",
                        }}
                      >
                        {step.title}
                      </span>
                      {isDone ? (
                        <motion.div
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 360, damping: 22 }}
                          className="shrink-0"
                        >
                          <CheckCircle2
                            size={18}
                            style={{ color: "hsl(145 63% 42%)" }}
                            strokeWidth={2}
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          className="w-[18px] h-[18px] rounded-full shrink-0"
                          style={{ border: "2px solid hsl(220 20% 85%)" }}
                          animate={{
                            borderColor: [
                              "hsl(220 20% 85%)",
                              "hsl(265 75% 60%)",
                              "hsl(220 20% 85%)",
                            ],
                          }}
                          transition={{ duration: 1.7, repeat: Infinity }}
                        />
                      )}
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && isDone && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          style={{ overflow: "hidden" }}
                        >
                          <div
                            className="ml-[26px] pb-3 pl-4 flex flex-col gap-2"
                            style={{ borderLeft: "1px solid hsl(220 20% 88%)" }}
                          >
                            {step.details.map((d, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-[13px]"
                                style={{
                                  color: "hsl(222 15% 50%)",
                                  fontFamily: "'DM Sans', system-ui, sans-serif",
                                }}
                              >
                                <span
                                  className="w-2 h-px shrink-0"
                                  style={{ background: "hsl(220 15% 70%)" }}
                                />
                                <span>{d}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Heads-up + Initialize Luka */}
          <AnimatePresence>
            {allDone && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 }}
                className="mt-5"
              >
                {variant === "upload" ? (
                  <UploadPriorYearBlock onInitialize={onInitialize} />
                ) : (
                <>

                <div
                  className="rounded-[14px] p-5"
                  style={{
                    background: "hsl(42 100% 96%)",
                    border: "1px solid hsl(38 90% 70%)",
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: "hsl(38 95% 90%)" }}
                    >
                      <Lock size={18} style={{ color: "hsl(28 85% 50%)" }} strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[15px] font-bold"
                        style={{
                          color: "hsl(222 35% 14%)",
                          fontFamily: "'DM Sans', system-ui, sans-serif",
                        }}
                      >
                        Heads-up before you click 'Initialize Luka'
                      </div>
                      <div
                        className="text-[13.5px] mt-1.5"
                        style={{
                          color: "hsl(222 20% 30%)",
                          fontFamily: "'DM Sans', system-ui, sans-serif",
                        }}
                      >
                        Clicking <span className="font-semibold">'Initialize Luka'</span> kicks off engagement automation. Here's exactly what to expect:
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-4">
                        {[
                          {
                            icon: Clock,
                            label: "APPROX. DURATION",
                            title: "2–4 mins.",
                            desc: "Engagement file will be locked while automation runs.",
                          },
                          {
                            icon: Users,
                            label: "TEAM ACCESS",
                            title: "Access Will Be Paused",
                            desc: "Ensure Teammates are not active on the engagement file.",
                          },
                          {
                            icon: Sparkles,
                            label: "APPROX. CREDITS",
                            title: "50–75 credits",
                            desc: "Estimated credits needed for this automation run.",
                          },
                        ].map((c, i) => {
                          const Icon = c.icon;
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 + i * 0.08, duration: 0.35 }}
                              className="rounded-[12px] p-3"
                              style={{
                                background: "hsl(0 0% 100% / 0.6)",
                                border: "1px solid hsl(38 80% 78%)",
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                  style={{ background: "hsl(38 95% 90%)" }}
                                >
                                  <Icon size={12} style={{ color: "hsl(28 85% 50%)" }} strokeWidth={2.4} />
                                </div>
                                <div
                                  className="text-[10.5px] font-bold tracking-wide"
                                  style={{ color: "hsl(222 25% 28%)" }}
                                >
                                  {c.label}
                                </div>
                              </div>
                              <div
                                className="mt-2 text-[13.5px] font-bold"
                                style={{ color: "hsl(222 35% 14%)" }}
                              >
                                {c.title}
                              </div>
                              <div
                                className="mt-1 text-[11.5px] leading-snug"
                                style={{ color: "hsl(222 15% 45%)" }}
                              >
                                {c.desc}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Initialize Luka button */}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  className="mt-5 flex flex-col items-start gap-3"
                >
                  <button
                    type="button"
                    onClick={onInitialize}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-[12px] text-[14px] font-semibold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(220 95% 60%) 0%, hsl(265 75% 60%) 100%)",
                      boxShadow: "0 8px 20px -8px hsl(250 70% 50% / 0.5)",
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                    }}
                  >
                    <Sparkles size={15} strokeWidth={2.4} />
                    <span>Initialize Luka</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRerun}
                    aria-label="Rerun verification"
                    title="Rerun verification"
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors hover:bg-[hsl(220_20%_94%)]"
                    style={{
                      border: "1px solid hsl(220 20% 88%)",
                      background: "hsl(0 0% 100%)",
                      color: "hsl(222 25% 35%)",
                    }}
                  >
                    <RotateCcw size={14} strokeWidth={2.2} />
                  </button>
                </motion.div>
                </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Timestamp */}
          {showHeadline && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              className="mt-4 text-[12px]"
              style={{ color: "hsl(222 15% 55%)" }}
            >
              {time}
            </motion.div>
          )}
        </div>
      </div>
      <div ref={bottomAnchorRef} aria-hidden="true" />
    </div>
  );
};

const RECOMMENDED_FILES: string[][] = [
  ["Last year finalized FS (with notes)", "Corporate Tax Return (Filed T2)", "Bank statements & reconciliations"],
  ["Mapped Trial Balance", "General Ledger / journal entries", "Investement Schedule"],
  ["Loan Agreements", "Any available checklists and letters", "Any other prior-year working papers"],
];

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  status: "processing" | "validated";
}

const formatBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

const UploadPriorYearBlock = ({ onInitialize }: { onInitialize?: () => void }) => {
  const [choice, setChoice] = useState<"ready" | "none" | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [preview, setPreview] = useState<UploadedFile | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const incoming: UploadedFile[] = Array.from(list).map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: f.name,
      size: f.size,
      type: f.type,
      url: URL.createObjectURL(f),
      status: "processing",
    }));
    setFiles((prev) => [...prev, ...incoming]);
    incoming.forEach((file) => {
      window.setTimeout(() => {
        setFiles((prev) => prev.map((x) => (x.id === file.id ? { ...x, status: "validated" } : x)));
      }, 1400 + Math.random() * 600);
    });
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((f) => f.id !== id);
    });
  };

  return (
    <div>
      <p
        className="text-[15px] leading-relaxed mb-4"
        style={{ color: "hsl(222 35% 16%)", fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        Please gather all prior year engagement data and drop in everything you have for seamless engagement automation processing. I'll validate each file and tell you what's missing.
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
          {RECOMMENDED_FILES.map((col, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              {col.map((item, j) => (
                <div
                  key={j}
                  className="flex items-center gap-2 text-[13px]"
                  style={{ color: "hsl(222 20% 35%)", fontFamily: "'DM Sans', system-ui, sans-serif" }}
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
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </button>

        <AnimatePresence initial={false}>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-4 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3">
                {files.map((f) => {
                  const isProcessing = f.status === "processing";
                  return (
                    <motion.div
                      key={f.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      className="flex flex-col rounded-[12px] p-3"
                      style={{
                        background: "hsl(0 0% 100%)",
                        border: `1px solid ${isProcessing ? "hsl(265 60% 80%)" : "hsl(145 50% 78%)"}`,
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
                          style={{ background: isProcessing ? "hsl(265 70% 95%)" : "hsl(145 60% 94%)" }}
                        >
                          {isProcessing ? (
                            <Loader2 size={14} className="animate-spin" style={{ color: "hsl(265 75% 55%)" }} />
                          ) : (
                            <CheckCircle2 size={15} style={{ color: "hsl(145 63% 38%)" }} strokeWidth={2.2} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className="text-[12.5px] font-semibold truncate"
                            style={{ color: "hsl(222 35% 14%)", fontFamily: "'DM Sans', sans-serif" }}
                          >
                            {f.name}
                          </div>
                          <div className="text-[11px] mt-0.5" style={{ color: "hsl(222 15% 50%)" }}>
                            {isProcessing ? "Luka is validating…" : `Validated · ${formatBytes(f.size)}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => setPreview(f)}
                          disabled={isProcessing}
                          title="Preview"
                          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-[8px] text-[11.5px] font-semibold transition-colors hover:bg-[hsl(220_20%_94%)] disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ border: "1px solid hsl(220 20% 88%)", color: "hsl(222 25% 30%)" }}
                        >
                          <Eye size={12} />
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFile(f.id)}
                          title="Delete"
                          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-[8px] text-[11.5px] font-semibold transition-colors hover:bg-[hsl(0_80%_96%)]"
                          style={{ border: "1px solid hsl(220 20% 88%)", color: "hsl(0 65% 50%)" }}
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FilePreviewModal file={preview} onClose={() => setPreview(null)} />


      <div className="grid grid-cols-2 gap-3 mt-4">
        {[
          { key: "ready" as const, icon: FileCheck2, title: "File are ready", desc: "I am done uploading the available files" },
          { key: "none" as const, icon: FileX2, title: "Files not availbale", desc: "I don't have prior year files to upload" },
        ].map((opt) => {
          const Icon = opt.icon;
          const active = choice === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setChoice(opt.key)}
              className="flex items-center gap-3 px-4 py-3 rounded-[12px] text-left transition-all"
              style={{
                background: active ? "hsl(220 95% 96%)" : "hsl(0 0% 100%)",
                border: `1px solid ${active ? "hsl(220 95% 60%)" : "hsl(220 20% 88%)"}`,
              }}
            >
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: active ? "hsl(220 95% 92%)" : "hsl(220 25% 95%)" }}
              >
                <Icon size={16} style={{ color: active ? "hsl(220 95% 45%)" : "hsl(222 25% 35%)" }} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <div className="text-[13.5px] font-bold" style={{ color: "hsl(222 35% 14%)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  {opt.title}
                </div>
                <div className="text-[12px] mt-0.5" style={{ color: "hsl(222 15% 50%)" }}>
                  {opt.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35 }}
        className="mt-5"
      >
        <button
          type="button"
          onClick={onInitialize}
          disabled={!choice}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-[12px] text-[14px] font-semibold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            background: "linear-gradient(135deg, hsl(220 95% 60%) 0%, hsl(265 75% 60%) 100%)",
            boxShadow: "0 8px 20px -8px hsl(250 70% 50% / 0.5)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          <Sparkles size={15} strokeWidth={2.4} />
          <span>Initialize Luka</span>
        </button>
      </motion.div>
    </div>
  );
};

const FilePreviewModal = ({ file, onClose }: { file: UploadedFile | null; onClose: () => void }) => {
  const isImage = file?.type.startsWith("image/");
  const isPdf = file?.type === "application/pdf";
  return (
    <AnimatePresence>
      {file && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          style={{ background: "hsl(222 40% 12% / 0.55)", backdropFilter: "blur(4px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl h-[80vh] rounded-[16px] overflow-hidden flex flex-col"
            style={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 20% 88%)", boxShadow: "0 30px 70px -20px hsl(222 40% 20% / 0.35)" }}
          >
            <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: "1px solid hsl(220 20% 92%)" }}>
              <FileText size={16} style={{ color: "hsl(220 95% 50%)" }} />
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold truncate" style={{ color: "hsl(222 35% 14%)", fontFamily: "'DM Sans', sans-serif" }}>
                  {file.name}
                </div>
                <div className="text-[11px]" style={{ color: "hsl(222 15% 50%)" }}>{formatBytes(file.size)}</div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-[10px] text-[12px] font-semibold transition-colors hover:bg-[hsl(220_20%_94%)]"
                style={{ border: "1px solid hsl(220 20% 88%)", color: "hsl(222 25% 30%)" }}
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-auto" style={{ background: "hsl(220 25% 97%)" }}>
              {isImage ? (
                <img src={file.url} alt={file.name} className="w-full h-full object-contain" />
              ) : isPdf ? (
                <iframe src={file.url} title={file.name} className="w-full h-full" />
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "hsl(220 25% 92%)" }}>
                    <FileText size={22} style={{ color: "hsl(222 30% 35%)" }} />
                  </div>
                  <div className="text-[14px] font-semibold" style={{ color: "hsl(222 35% 14%)" }}>
                    Preview not available
                  </div>
                  <div className="text-[12.5px]" style={{ color: "hsl(222 15% 50%)" }}>
                    This file type can't be previewed in the browser.
                  </div>
                  <a
                    href={file.url}
                    download={file.name}
                    className="mt-2 px-4 py-2 rounded-[10px] text-[12.5px] font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, hsl(220 95% 60%) 0%, hsl(265 75% 60%) 100%)" }}
                  >
                    Download
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EngagementVerificationMessage;

