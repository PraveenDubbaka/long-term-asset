import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Archive,
  ShieldCheck,
  Lock,
  RefreshCw,
  ArrowRight,
  Copy,
  Download,
  Share2,
  PackageCheck,
  FolderArchive,
  AlertTriangle,
  FileCheck2,
} from "lucide-react";
import lukaIdle from "@/assets/luka-idle.gif";
import lukaResponding from "@/assets/luka-responding.gif";
import BottomPrompter from "./BottomPrompter";

const FONT = "'DM Sans', system-ui, sans-serif";
const STORAGE_KEY = "completion-archive-state-v1";

type BenchStatus = "pending" | "completed";
interface Benchmark {
  title: React.ReactNode;
  hint: string;
  status: BenchStatus;
}

const BENCHMARKS: Benchmark[] = [
  {
    title: "Financial statements watermark removed",
    hint: "Financial Statements Docs › FS Settings",
    status: "completed",
  },
  {
    title: "All users signed off on Final Review checklist",
    hint: "Final Review › Final Completion checklist › Sign off Disclaimer",
    status: "completed",
  },
  {
    title: "FS Sign off Date and Signature applied",
    hint: "Final Review › Finalize Report",
    status: "completed",
  },
];

const ARCHIVE_STEPS = [
  "Locking working papers & disabling further edits",
  "Bundling Financial Statements, notes & sign-offs",
  "Snapshotting trial balance, mappings & adjusting entries",
  "Sealing inspection checklist & audit trail",
  "Placing package into system-generated archive folder",
];

type Phase = "ready" | "completing" | "completed" | "archiving" | "archived";

interface PersistedState {
  phase: Phase;
  completionDays: string;
  archiveDays: string;
  completedAt?: string;
  archivedAt?: string;
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PersistedState;
  } catch {
    // ignore
  }
  return { phase: "ready", completionDays: "30 days", archiveDays: "30 days" };
}

function saveState(s: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

const CompletionArchiveView = () => {
  const initial = loadState();
  const [phase, setPhase] = useState<Phase>(initial.phase);
  const [completionDays, setCompletionDays] = useState(initial.completionDays);
  const [archiveDays, setArchiveDays] = useState(initial.archiveDays);
  const [completedAt, setCompletedAt] = useState<string | undefined>(initial.completedAt);
  const [archivedAt, setArchivedAt] = useState<string | undefined>(initial.archivedAt);
  const [archiveStepIdx, setArchiveStepIdx] = useState(0);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Persist
  useEffect(() => {
    saveState({ phase, completionDays, archiveDays, completedAt, archivedAt });
  }, [phase, completionDays, archiveDays, completedAt, archivedAt]);

  // Auto-scroll to bottom whenever phase changes
  useEffect(() => {
    const t = window.setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [phase, archiveStepIdx]);

  // Completion → auto archive sequence
  useEffect(() => {
    if (phase === "completing") {
      const t = window.setTimeout(() => {
        const now = new Date();
        setCompletedAt(now.toISOString());
        setPhase("completed");
      }, 1800);
      return () => window.clearTimeout(t);
    }
    if (phase === "completed") {
      const t = window.setTimeout(() => {
        setArchiveStepIdx(0);
        setPhase("archiving");
      }, 1100);
      return () => window.clearTimeout(t);
    }
    if (phase === "archiving") {
      if (archiveStepIdx < ARCHIVE_STEPS.length - 1) {
        const t = window.setTimeout(() => setArchiveStepIdx((i) => i + 1), 850);
        return () => window.clearTimeout(t);
      } else {
        const t = window.setTimeout(() => {
          setArchivedAt(new Date().toISOString());
          setPhase("archived");
        }, 1000);
        return () => window.clearTimeout(t);
      }
    }
  }, [phase, archiveStepIdx]);

  const completedCount = BENCHMARKS.filter((b) => b.status === "completed").length;
  const canComplete = completedCount >= 2;

  const startCompletion = () => {
    if (!canComplete || phase !== "ready") return;
    setPhase("completing");
  };

  const reset = () => {
    setPhase("ready");
    setCompletedAt(undefined);
    setArchivedAt(undefined);
    setArchiveStepIdx(0);
  };

  const fmtTime = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "";

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 w-full max-w-full md:max-w-[92%] lg:max-w-[960px] mx-auto px-6 py-8 transition-all duration-500 ease-out">
        <div className="flex items-start gap-4">
          <div className="shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center">
            <img
              src={phase === "completing" || phase === "archiving" ? lukaResponding : lukaIdle}
              alt="Luka"
              className={
                phase === "completing" || phase === "archiving"
                  ? "w-11 h-11 object-contain -m-1.5"
                  : "w-8 h-8 object-contain"
              }
            />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="text-[15px] leading-relaxed"
              style={{ color: "hsl(222 35% 16%)", fontFamily: FONT }}
            >
              The inspection checklist and final sign-offs are wrapped up — this file is{" "}
              <strong style={{ color: "hsl(222 35% 14%)" }}>ready to be completed</strong>. Once
              you hit <em>Complete Now</em>, I'll lock the working papers and auto-archive the full
              engagement package into the document repository.
            </p>

            {/* Sparkle note */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="mt-4 flex items-center gap-2 px-3.5 py-2.5 rounded-[12px]"
              style={{
                background: "linear-gradient(135deg, hsl(265 60% 97%) 0%, hsl(220 60% 98%) 100%)",
                border: "1px dashed hsl(265 40% 85%)",
              }}
            >
              <Sparkles size={14} strokeWidth={2} style={{ color: "hsl(265 70% 55%)" }} />
              <span
                className="text-[13px] italic"
                style={{ color: "hsl(222 25% 28%)", fontFamily: FONT }}
              >
                You can re-open the file later if needed — any changes made after reopening will
                overwrite the previously archived version.
              </span>
            </motion.div>

            {/* Completion card */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="mt-3 rounded-[16px] overflow-hidden"
              style={{
                background: "hsl(0 0% 100%)",
                border: "1px solid hsl(220 20% 92%)",
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ background: "hsl(220 40% 98%)" }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <PackageCheck size={15} strokeWidth={2.2} style={{ color: "hsl(222 35% 18%)" }} />
                  <span
                    className="text-[14px] font-bold"
                    style={{ color: "hsl(222 35% 14%)", fontFamily: FONT }}
                  >
                    Completion
                  </span>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                    style={{
                      background: canComplete ? "hsl(145 60% 95%)" : "hsl(38 100% 95%)",
                      color: canComplete ? "hsl(145 70% 35%)" : "hsl(28 85% 45%)",
                      border: canComplete
                        ? "1px solid hsl(145 50% 85%)"
                        : "1px solid hsl(38 90% 78%)",
                    }}
                  >
                    {completedCount}/{BENCHMARKS.length} benchmarks met
                  </span>
                </div>
                <button
                  type="button"
                  className="w-7 h-7 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[hsl(220_20%_94%)]"
                  style={{ color: "hsl(222 25% 35%)" }}
                  title="Refresh benchmark status"
                >
                  <RefreshCw size={13} strokeWidth={2.2} />
                </button>
              </div>

              {/* Benchmark rows */}
              <ul>
                {BENCHMARKS.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 px-4 py-3"
                    style={{ borderTop: "1px solid hsl(220 20% 94%)" }}
                  >
                    <div className="shrink-0 mt-0.5">
                      {b.status === "completed" ? (
                        <CheckCircle2 size={16} strokeWidth={2} style={{ color: "hsl(145 63% 45%)" }} />
                      ) : (
                        <Clock size={16} strokeWidth={2} style={{ color: "hsl(28 85% 50%)" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[13.5px] leading-snug"
                        style={{ color: "hsl(222 30% 22%)", fontFamily: FONT }}
                      >
                        {b.title}
                      </p>
                      <p
                        className="mt-0.5 text-[12px]"
                        style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
                      >
                        {b.hint}
                      </p>
                    </div>
                    <span
                      className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide"
                      style={
                        b.status === "completed"
                          ? {
                              background: "hsl(145 60% 95%)",
                              color: "hsl(145 70% 35%)",
                              border: "1px solid hsl(145 50% 85%)",
                            }
                          : {
                              background: "hsl(38 100% 95%)",
                              color: "hsl(28 85% 45%)",
                              border: "1px solid hsl(38 90% 78%)",
                            }
                      }
                    >
                      {b.status}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Action row */}
              <div
                className="grid grid-cols-12 gap-3 px-4 py-3.5 items-center"
                style={{
                  borderTop: "1px solid hsl(220 20% 94%)",
                  background: "hsl(220 40% 99%)",
                }}
              >
                <div className="col-span-12 md:col-span-3">
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-1.5"
                    style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
                  >
                    Days to Complete
                  </p>
                  <select
                    value={completionDays}
                    onChange={(e) => setCompletionDays(e.target.value)}
                    disabled={phase !== "ready"}
                    className="w-full px-3 py-2 rounded-[8px] text-[13px] bg-white disabled:opacity-60"
                    style={{
                      border: "1px solid hsl(220 20% 88%)",
                      color: "hsl(222 30% 22%)",
                      fontFamily: FONT,
                    }}
                  >
                    {["15 days", "30 days", "45 days", "60 days"].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-12 md:col-span-6">
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-1.5"
                    style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
                  >
                    Completion Details
                  </p>
                  <AnimatePresence mode="wait">
                    {phase === "ready" && (
                      <motion.p
                        key="ready"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[13px]"
                        style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
                      >
                        Awaiting your action — no completion on file yet.
                      </motion.p>
                    )}
                    {(phase === "completing" || phase === "completed" || phase === "archiving" || phase === "archived") && (
                      <motion.div
                        key="done"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-[13px]"
                        style={{ color: "hsl(222 30% 22%)", fontFamily: FONT }}
                      >
                        <Lock size={13} strokeWidth={2.2} style={{ color: "hsl(145 63% 42%)" }} />
                        <span>
                          File completed{completedAt ? ` · ${fmtTime(completedAt)}` : "…"}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="col-span-12 md:col-span-3 flex md:justify-end">
                  <AnimatePresence mode="wait">
                    {phase === "ready" ? (
                      <motion.button
                        key="complete"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        whileHover={{ scale: canComplete ? 1.02 : 1 }}
                        whileTap={{ scale: canComplete ? 0.98 : 1 }}
                        type="button"
                        disabled={!canComplete}
                        onClick={startCompletion}
                        className="px-4 py-2 rounded-[12px] text-[13px] font-semibold inline-flex items-center gap-2 disabled:cursor-not-allowed"
                        style={{
                          background: canComplete
                            ? "linear-gradient(135deg, hsl(220 90% 55%) 0%, hsl(265 70% 55%) 100%)"
                            : "hsl(220 20% 88%)",
                          color: canComplete ? "white" : "hsl(222 15% 55%)",
                          boxShadow: canComplete
                            ? "0 6px 16px -8px hsl(220 90% 55% / 0.55)"
                            : "none",
                          fontFamily: FONT,
                        }}
                      >
                        <PackageCheck size={14} strokeWidth={2.4} />
                        Complete Now
                      </motion.button>
                    ) : phase === "completing" ? (
                      <motion.div
                        key="completing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-2 text-[13px]"
                        style={{ color: "hsl(222 30% 22%)", fontFamily: FONT }}
                      >
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent"
                          style={{ borderColor: "hsl(265 70% 55%)", borderTopColor: "transparent" }}
                        />
                        Completing file…
                      </motion.div>
                    ) : (
                      <motion.button
                        key="reopen"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        type="button"
                        onClick={reset}
                        className="px-3 py-2 rounded-[12px] text-[13px] font-semibold inline-flex items-center gap-2"
                        style={{
                          background: "white",
                          border: "1px solid hsl(220 20% 88%)",
                          color: "hsl(222 30% 22%)",
                          fontFamily: FONT,
                        }}
                      >
                        <RefreshCw size={13} strokeWidth={2.2} />
                        Reopen File
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Luka conversational nudge — appears after Complete Now */}
            <AnimatePresence>
              {(phase === "completing" || phase === "completed" || phase === "archiving" || phase === "archived") && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-4 flex items-start gap-4 p-5 rounded-[16px]"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(265 60% 97%) 0%, hsl(220 60% 98%) 100%)",
                    border: "1px solid hsl(265 40% 92%)",
                  }}
                >
                  <div className="shrink-0 w-8 h-8 flex items-center justify-center">
                    <img
                      src={phase === "archived" ? lukaIdle : lukaResponding}
                      alt="Luka"
                      className={
                        phase === "archived"
                          ? "w-8 h-8 object-contain"
                          : "w-11 h-11 object-contain -m-1.5"
                      }
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[14px] font-bold"
                      style={{ color: "hsl(222 35% 14%)", fontFamily: FONT }}
                    >
                      Luka
                    </p>
                    <p
                      className="mt-1.5 text-[13.5px] leading-relaxed"
                      style={{ color: "hsl(222 25% 25%)", fontFamily: FONT }}
                    >
                      {phase === "completing" &&
                        "Locking the working papers and freezing the sign-off trail. One moment…"}
                      {phase === "completed" &&
                        "File completed. I'm kicking off auto-archive right now — the package is heading into the document repository."}
                      {phase === "archiving" &&
                        "Auto-archive is in progress. I'm bundling the entire engagement file and placing it in the system-generated folder so it's defensible at issuance."}
                      {phase === "archived" &&
                        "All done. The engagement is completed and archived. You can re-open it from the document repository if anything needs revisiting."}
                    </p>

                    {/* Archive progress timeline */}
                    <AnimatePresence>
                      {(phase === "completed" || phase === "archiving" || phase === "archived") && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 p-4 rounded-[12px] overflow-hidden"
                          style={{
                            background: "hsl(0 0% 100%)",
                            border: "1px solid hsl(220 20% 92%)",
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <FolderArchive
                                size={14}
                                strokeWidth={2.2}
                                style={{ color: "hsl(222 35% 18%)" }}
                              />
                              <span
                                className="text-[12.5px] font-semibold uppercase tracking-[0.04em]"
                                style={{ color: "hsl(222 20% 40%)", fontFamily: FONT }}
                              >
                                Auto-archive
                              </span>
                            </div>
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                              style={
                                phase === "archived"
                                  ? {
                                      background: "hsl(145 60% 95%)",
                                      color: "hsl(145 70% 35%)",
                                      border: "1px solid hsl(145 50% 85%)",
                                    }
                                  : {
                                      background: "hsl(265 60% 95%)",
                                      color: "hsl(265 70% 45%)",
                                      border: "1px solid hsl(265 40% 88%)",
                                    }
                              }
                            >
                              {phase === "archived" ? (
                                <>
                                  <CheckCircle2 size={11} strokeWidth={2.4} /> Completed
                                </>
                              ) : (
                                <>In progress</>
                              )}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full h-[3px] bg-[hsl(220_20%_94%)] rounded-full overflow-hidden mb-3">
                            <motion.div
                              className="h-full"
                              style={{
                                background:
                                  phase === "archived"
                                    ? "hsl(145 63% 42%)"
                                    : "linear-gradient(90deg, hsl(220 90% 55%), hsl(265 70% 55%))",
                              }}
                              initial={{ width: 0 }}
                              animate={{
                                width:
                                  phase === "archived"
                                    ? "100%"
                                    : phase === "archiving"
                                      ? `${((archiveStepIdx + 1) / ARCHIVE_STEPS.length) * 100}%`
                                      : "8%",
                              }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                            />
                          </div>

                          <ul className="space-y-2">
                            {ARCHIVE_STEPS.map((s, i) => {
                              const isDone =
                                phase === "archived" ||
                                (phase === "archiving" && i < archiveStepIdx) ||
                                (phase === "archiving" && i === archiveStepIdx && false);
                              const isActive = phase === "archiving" && i === archiveStepIdx;
                              const isQueued =
                                phase === "completed" ||
                                (phase === "archiving" && i > archiveStepIdx);
                              return (
                                <li key={i} className="flex items-start gap-2.5">
                                  <div className="shrink-0 mt-0.5">
                                    {isDone ? (
                                      <CheckCircle2
                                        size={14}
                                        strokeWidth={2.2}
                                        style={{ color: "hsl(145 63% 45%)" }}
                                      />
                                    ) : isActive ? (
                                      <motion.span
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="inline-block w-3.5 h-3.5 rounded-full border-2 border-t-transparent"
                                        style={{
                                          borderColor: "hsl(265 70% 55%)",
                                          borderTopColor: "transparent",
                                        }}
                                      />
                                    ) : (
                                      <span
                                        className="inline-block w-3 h-3 rounded-full"
                                        style={{
                                          background: "hsl(220 20% 92%)",
                                          border: "1px solid hsl(220 20% 84%)",
                                        }}
                                      />
                                    )}
                                  </div>
                                  <p
                                    className="text-[13px] leading-snug"
                                    style={{
                                      color: isQueued
                                        ? "hsl(222 15% 55%)"
                                        : "hsl(222 30% 22%)",
                                      fontFamily: FONT,
                                    }}
                                  >
                                    {s}
                                  </p>
                                </li>
                              );
                            })}
                          </ul>

                          {phase === "archived" && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-4 flex items-center gap-2 text-[12.5px]"
                              style={{ color: "hsl(145 70% 30%)", fontFamily: FONT }}
                            >
                              <ShieldCheck size={13} strokeWidth={2.2} />
                              <span>
                                Archived {fmtTime(archivedAt)} · stored in document repository ›
                                System-generated folder
                              </span>
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Archive settings card */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="mt-4 rounded-[16px] overflow-hidden"
              style={{
                background: "hsl(0 0% 100%)",
                border: "1px solid hsl(220 20% 92%)",
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ background: "hsl(220 40% 98%)" }}
              >
                <div className="flex items-center gap-2.5">
                  <Archive size={15} strokeWidth={2.2} style={{ color: "hsl(222 35% 18%)" }} />
                  <span
                    className="text-[14px] font-bold"
                    style={{ color: "hsl(222 35% 14%)", fontFamily: FONT }}
                  >
                    Archive
                  </span>
                </div>
                <span
                  className="text-[11.5px]"
                  style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
                >
                  Auto-archives based on the days you set below
                </span>
              </div>

              <div
                className="grid grid-cols-12 gap-3 px-4 py-3.5 items-center"
                style={{ background: "hsl(220 40% 99%)" }}
              >
                <div className="col-span-12 md:col-span-3">
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-1.5"
                    style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
                  >
                    Days to Archive
                  </p>
                  <select
                    value={archiveDays}
                    onChange={(e) => setArchiveDays(e.target.value)}
                    disabled={phase === "archiving"}
                    className="w-full px-3 py-2 rounded-[8px] text-[13px] bg-white disabled:opacity-60"
                    style={{
                      border: "1px solid hsl(220 20% 88%)",
                      color: "hsl(222 30% 22%)",
                      fontFamily: FONT,
                    }}
                  >
                    {["15 days", "30 days", "45 days", "60 days"].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-12 md:col-span-6">
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-1.5"
                    style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
                  >
                    Archive Details
                  </p>
                  <AnimatePresence mode="wait">
                    {phase !== "archived" && phase !== "archiving" ? (
                      <motion.p
                        key="pending"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[13px]"
                        style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
                      >
                        Archive starts automatically once the file is completed.
                      </motion.p>
                    ) : (
                      <motion.div
                        key="archdone"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-[13px]"
                        style={{ color: "hsl(222 30% 22%)", fontFamily: FONT }}
                      >
                        <FolderArchive
                          size={13}
                          strokeWidth={2.2}
                          style={{ color: "hsl(145 63% 42%)" }}
                        />
                        <span>
                          {phase === "archived"
                            ? `Archived ${fmtTime(archivedAt)}`
                            : "Archiving in progress…"}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="col-span-12 md:col-span-3 flex md:justify-end">
                  <button
                    type="button"
                    disabled={phase !== "completed" && phase !== "ready"}
                    className="px-4 py-2 rounded-[12px] text-[13px] font-semibold inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      background: "white",
                      border: "1px solid hsl(220 20% 88%)",
                      color: "hsl(222 30% 22%)",
                      fontFamily: FONT,
                    }}
                  >
                    <Archive size={13} strokeWidth={2.2} />
                    {phase === "archived" ? "Archived" : "Archive Now"}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Final pass/fail summary — appears after auto-archival completes */}
            <AnimatePresence>
              {phase === "archived" && (() => {
                const errors: { label: string; detail: string }[] = [];
                const passed = errors.length === 0;
                const durationMs =
                  completedAt && archivedAt
                    ? new Date(archivedAt).getTime() - new Date(completedAt).getTime()
                    : 0;
                const durationLabel =
                  durationMs > 0
                    ? `${Math.max(1, Math.round(durationMs / 1000))}s`
                    : "—";

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ type: "spring", stiffness: 240, damping: 26 }}
                    className="mt-4 rounded-[16px] overflow-hidden"
                    style={{
                      background: passed
                        ? "linear-gradient(180deg, hsl(145 60% 97%) 0%, hsl(0 0% 100%) 55%)"
                        : "linear-gradient(180deg, hsl(0 90% 97%) 0%, hsl(0 0% 100%) 55%)",
                      border: passed
                        ? "1px solid hsl(145 50% 85%)"
                        : "1px solid hsl(0 70% 85%)",
                    }}
                  >
                    {/* Header strip */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {passed ? (
                          <ShieldCheck
                            size={17}
                            strokeWidth={2.2}
                            style={{ color: "hsl(145 70% 35%)" }}
                          />
                        ) : (
                          <AlertTriangle
                            size={17}
                            strokeWidth={2.2}
                            style={{ color: "hsl(0 75% 45%)" }}
                          />
                        )}
                        <span
                          className="text-[14px] font-bold"
                          style={{ color: "hsl(222 35% 14%)", fontFamily: FONT }}
                        >
                          Completion Summary
                        </span>
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide"
                          style={
                            passed
                              ? {
                                  background: "hsl(145 60% 95%)",
                                  color: "hsl(145 70% 32%)",
                                  border: "1px solid hsl(145 50% 82%)",
                                }
                              : {
                                  background: "hsl(0 90% 96%)",
                                  color: "hsl(0 75% 42%)",
                                  border: "1px solid hsl(0 70% 85%)",
                                }
                          }
                        >
                          {passed ? (
                            <>
                              <CheckCircle2 size={11} strokeWidth={2.4} /> Passed
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={11} strokeWidth={2.4} /> Failed
                            </>
                          )}
                        </span>
                      </div>
                      <span
                        className="text-[11.5px]"
                        style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
                      >
                        Engagement sealed & archived
                      </span>
                    </div>

                    {/* Stat grid */}
                    <div
                      className="grid grid-cols-2 md:grid-cols-4 gap-px"
                      style={{ background: "hsl(220 20% 92%)" }}
                    >
                      {[
                        {
                          icon: PackageCheck,
                          label: "File completed",
                          value: fmtTime(completedAt) || "—",
                          tint: "hsl(220 90% 55%)",
                        },
                        {
                          icon: FolderArchive,
                          label: "Auto-archived",
                          value: fmtTime(archivedAt) || "—",
                          tint: "hsl(265 70% 55%)",
                        },
                        {
                          icon: Clock,
                          label: "Archive duration",
                          value: durationLabel,
                          tint: "hsl(28 85% 50%)",
                        },
                        {
                          icon: FileCheck2,
                          label: "Benchmarks",
                          value: `${BENCHMARKS.filter((b) => b.status === "completed").length}/${BENCHMARKS.length}`,
                          tint: "hsl(145 70% 35%)",
                        },
                      ].map((s, i) => (
                        <div
                          key={i}
                          className="px-4 py-3"
                          style={{ background: "hsl(0 0% 100%)" }}
                        >
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <s.icon size={12} strokeWidth={2.4} style={{ color: s.tint }} />
                            <p
                              className="text-[11px] font-semibold uppercase tracking-[0.04em]"
                              style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
                            >
                              {s.label}
                            </p>
                          </div>
                          <p
                            className="text-[13.5px] font-semibold"
                            style={{ color: "hsl(222 35% 14%)", fontFamily: FONT }}
                          >
                            {s.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Errors section */}
                    <div
                      className="px-4 py-3.5"
                      style={{ borderTop: "1px solid hsl(220 20% 92%)" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-[12.5px] font-semibold uppercase tracking-[0.04em]"
                          style={{ color: "hsl(222 20% 40%)", fontFamily: FONT }}
                        >
                          Errors & warnings
                        </span>
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          style={
                            errors.length === 0
                              ? {
                                  background: "hsl(145 60% 95%)",
                                  color: "hsl(145 70% 35%)",
                                  border: "1px solid hsl(145 50% 85%)",
                                }
                              : {
                                  background: "hsl(0 90% 96%)",
                                  color: "hsl(0 75% 42%)",
                                  border: "1px solid hsl(0 70% 85%)",
                                }
                          }
                        >
                          {errors.length} {errors.length === 1 ? "issue" : "issues"}
                        </span>
                      </div>

                      {errors.length === 0 ? (
                        <div
                          className="flex items-center gap-2 px-3 py-2.5 rounded-[10px]"
                          style={{
                            background: "hsl(145 60% 97%)",
                            border: "1px dashed hsl(145 50% 80%)",
                          }}
                        >
                          <CheckCircle2
                            size={14}
                            strokeWidth={2.2}
                            style={{ color: "hsl(145 70% 35%)" }}
                          />
                          <p
                            className="text-[13px]"
                            style={{ color: "hsl(145 60% 25%)", fontFamily: FONT }}
                          >
                            No errors detected — the package was sealed and stored cleanly.
                          </p>
                        </div>
                      ) : (
                        <ul className="space-y-1.5">
                          {errors.map((e, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2.5 px-3 py-2.5 rounded-[10px]"
                              style={{
                                background: "hsl(0 90% 97%)",
                                border: "1px solid hsl(0 70% 88%)",
                              }}
                            >
                              <AlertTriangle
                                size={14}
                                strokeWidth={2.2}
                                style={{ color: "hsl(0 75% 45%)" }}
                                className="mt-0.5 shrink-0"
                              />
                              <div className="min-w-0">
                                <p
                                  className="text-[13px] font-semibold"
                                  style={{ color: "hsl(222 35% 14%)", fontFamily: FONT }}
                                >
                                  {e.label}
                                </p>
                                <p
                                  className="text-[12.5px] mt-0.5"
                                  style={{ color: "hsl(222 15% 45%)", fontFamily: FONT }}
                                >
                                  {e.detail}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}

                      <p
                        className="mt-3 text-[11.5px]"
                        style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
                      >
                        Stored in document repository › System-generated folder · re-open the file
                        to make changes (will overwrite the archived version).
                      </p>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>


            {/* Action toolbar */}
            <div className="mt-4 flex items-center gap-2">
              {[Copy, Download, Archive, Share2, RefreshCw].map((Icon, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={Icon === RefreshCw ? reset : undefined}
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[hsl(220_20%_94%)]"
                  style={{
                    border: "1px solid hsl(220 20% 88%)",
                    background: "hsl(0 0% 100%)",
                    color: "hsl(222 25% 30%)",
                  }}
                  title={Icon === RefreshCw ? "Reset demo" : ""}
                >
                  <Icon size={13} strokeWidth={2.2} />
                </button>
              ))}
            </div>

            <p
              className="mt-3 text-[11px]"
              style={{ color: "hsl(222 15% 55%)", fontFamily: FONT }}
            >
              <ArrowRight size={11} className="inline -mt-0.5 mr-1" />
              {phase === "archived"
                ? "Engagement closed."
                : phase === "ready"
                  ? "Ready when you are."
                  : "Working on it…"}
            </p>
            <div ref={bottomRef} aria-hidden style={{ height: 1 }} />
          </div>
        </div>
      </div>
      <BottomPrompter placeholder="Ask Luka about completion & archive..." />
    </div>
  );
};

export default CompletionArchiveView;
