import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import quickbooksLogo from "@/assets/quickbooks-intuit-logo.png";
import {
  Lock,
  Unlock,
  Bot,
  Square,
  Mail,
  CheckCircle2,
  Loader2,
  FileSearch,
  Database,
  BarChart3,
  Shield,
  Brain,
  Sparkles,
  Clock,
  Zap,
  Activity,
} from "lucide-react";

export interface EngagementContext {
  entityName: string;
  engagementId: string;
  type: string;
  standard: string;
  yearEnd: string;
  progress: number;
  lukaStatus?: string;
}

interface LukaProcessingScreenProps {
  onComplete: () => void;
  onStop: () => void;
  engagementContext?: EngagementContext;
}

const TOTAL_DURATION = 25;

const activitySteps = [
  { icon: FileSearch, text: "Scanning uploaded documents...", detail: "14 files detected", delay: 0, duration: 3 },
  { icon: Database, text: "Importing trial balance from QuickBooks", detail: "247 line items", delay: 3, duration: 4 },
  { icon: Brain, text: "Classifying document types using AI", detail: "Bank statements, invoices, GL", delay: 5, duration: 3 },
  { icon: BarChart3, text: "Mapping accounts to engagement structure", detail: "Chart of accounts linked", delay: 8, duration: 4 },
  { icon: Shield, text: "Running compliance checks on PY financials", detail: "GAAP standards applied", delay: 11, duration: 3 },
  { icon: FileSearch, text: "Cross-referencing bank reconciliation data", detail: "3 accounts matched", delay: 13, duration: 4 },
  { icon: Brain, text: "Analyzing revenue variance patterns", detail: "Q4 anomaly flagged", delay: 16, duration: 3 },
  { icon: Database, text: "Building working papers from source data", detail: "WP-100 through WP-400", delay: 18, duration: 3 },
  { icon: Sparkles, text: "Generating engagement summary report", detail: "Final review pending", delay: 21, duration: 3 },
  { icon: CheckCircle2, text: "All files processed successfully", detail: "Ready for review", delay: 24, duration: 1 },
];

const LukaProcessingScreen = ({ onComplete, onStop, engagementContext }: LukaProcessingScreenProps) => {
  const [elapsed, setElapsed] = useState(0);
  const [visibleActivities, setVisibleActivities] = useState<number[]>([]);
  const [emailNotify, setEmailNotify] = useState(false);
  const [completed, setCompleted] = useState(false);

  const progress = Math.min((elapsed / TOTAL_DURATION) * 100, 100);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= TOTAL_DURATION) {
          clearInterval(timer);
          return TOTAL_DURATION;
        }
        return prev + 0.1;
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    activitySteps.forEach((step, index) => {
      const timeout = setTimeout(() => {
        setVisibleActivities((prev) => [...prev, index]);
      }, step.delay * 1000);
      timeouts.push(timeout);
    });
    return () => timeouts.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (elapsed >= TOTAL_DURATION && !completed) {
      setCompleted(true);
      setTimeout(() => onComplete(), 2000);
    }
  }, [elapsed, completed, onComplete]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const currentStepText = visibleActivities.length > 0
    ? activitySteps[visibleActivities[visibleActivities.length - 1]].text
    : "Initializing...";

  // Generate celebration particles once on completion
  const celebrationParticles = useMemo(() => {
    if (!completed) return [];
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 2.5 + Math.random() * 1.5,
      size: 4 + Math.random() * 6,
      drift: (Math.random() - 0.5) * 60,
      type: i % 5, // 0=dot, 1=check, 2=sparkle, 3=line, 4=ring
      color: [
        "hsl(207 71% 38%)",    // brand blue
        "hsl(260 70% 58%)",     // brand purple
        "hsl(145 63% 50%)",     // success green
        "hsl(220 20% 75%)",     // subtle gray
        "hsl(30 80% 60%)",      // warm gold
      ][i % 5],
      opacity: 0.4 + Math.random() * 0.4,
    }));
  }, [completed]);

  return (
    <div className="luka-proc-root">
      {/* Animated gradient background */}
      <div className="luka-proc-bg" />
      <div className="luka-proc-orb luka-proc-orb--1" />
      <div className="luka-proc-orb luka-proc-orb--2" />
      <div className="luka-proc-orb luka-proc-orb--3" />

      {/* Completion celebration */}
      <AnimatePresence>
        {completed && (
          <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ zIndex: 2 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {celebrationParticles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute"
                style={{
                  left: `${p.x}%`,
                  bottom: -20,
                }}
                initial={{ y: 0, x: 0, opacity: 0, scale: 0 }}
                animate={{
                  y: [0, -window.innerHeight * (0.6 + Math.random() * 0.4)],
                  x: [0, p.drift],
                  opacity: [0, p.opacity, p.opacity, 0],
                  scale: [0, 1, 1, 0.3],
                  rotate: [0, (Math.random() - 0.5) * 180],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: "easeOut",
                }}
              >
                {p.type === 1 ? (
                  <CheckCircle2 size={p.size + 2} style={{ color: p.color }} strokeWidth={2} />
                ) : p.type === 2 ? (
                  <Sparkles size={p.size + 1} style={{ color: p.color }} strokeWidth={2} />
                ) : p.type === 3 ? (
                  <div
                    style={{
                      width: p.size * 2.5,
                      height: 2,
                      borderRadius: 1,
                      background: p.color,
                    }}
                  />
                ) : p.type === 4 ? (
                  <div
                    style={{
                      width: p.size,
                      height: p.size,
                      borderRadius: "50%",
                      border: `1.5px solid ${p.color}`,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: p.size,
                      height: p.size,
                      borderRadius: "50%",
                      background: p.color,
                    }}
                  />
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CENTER — Main content area */}
      <div className="luka-proc-center">
        {/* Context Bar — centered inline */}
        <div
          className="flex items-center justify-center gap-1.5 shrink-0 w-full mb-4 flex-nowrap"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "hsl(var(--muted))" }}>
              <FileSearch size={11} style={{ color: "hsl(var(--muted-foreground))" }} />
            </div>
            <span className="text-[14px] font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              {engagementContext?.entityName || "ABC Pvt. Ltd."}
            </span>
          </div>
          <span className="text-[14px]" style={{ color: "hsl(var(--muted-foreground))" }}>›</span>
          <span className="text-[14px] font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            {engagementContext?.engagementId || "COM-SID-Dec312024"}
          </span>
          {engagementContext?.type && (
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{
                background: "hsl(var(--muted))",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              {engagementContext.type}{engagementContext.standard ? ` · ${engagementContext.standard}` : ""} · {engagementContext.yearEnd}
            </span>
          )}
          <img src={quickbooksLogo} alt="QuickBooks" className="h-6 w-auto object-contain" />
          <motion.div
            animate={completed ? { scale: [1, 1.08, 1] } : { scale: [1, 1.15, 1] }}
            transition={{ duration: completed ? 2.5 : 1.5, repeat: Infinity }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{
              background: completed ? "hsl(145 60% 42% / 0.08)" : "hsl(30 90% 50% / 0.08)",
              border: completed ? "1px solid hsl(145 60% 42% / 0.2)" : "1px solid hsl(30 90% 50% / 0.2)",
            }}
          >
            {completed ? (
              <Unlock size={11} style={{ color: "hsl(145 60% 38%)" }} />
            ) : (
              <Lock size={11} style={{ color: "hsl(30 90% 50%)" }} />
            )}
            <span
              className="text-[11px] font-bold"
              style={{ color: completed ? "hsl(145 55% 32%)" : "hsl(30 80% 40%)" }}
            >
              {completed ? "File Open" : "File Locked"}
            </span>
          </motion.div>
        </div>

        {/* Hero breathing logo */}
        <div className="luka-proc-hero">
          {/* Outer breath rings */}
          <motion.div
            className="luka-proc-breath-ring luka-proc-breath-ring--3"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.08, 0.2, 0.08],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="luka-proc-breath-ring luka-proc-breath-ring--2"
            animate={{
              scale: [1, 1.12, 1],
              opacity: [0.12, 0.3, 0.12],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
          <motion.div
            className="luka-proc-breath-ring luka-proc-breath-ring--1"
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.2, 0.45, 0.2],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          />

          {/* Rotating dashed orbit */}
          <motion.div
            className="luka-proc-orbit"
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="luka-proc-orbit luka-proc-orbit--reverse"
            animate={{ rotate: -360 }}
            transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
          />

          {/* Core logo — breathing */}
          <motion.div
            className="luka-proc-core"
            animate={{
              scale: [1, 1.06, 1, 1.03, 1],
              boxShadow: [
                "0 0 30px hsl(207 71% 38% / 0.25), 0 0 60px hsl(260 70% 58% / 0.15)",
                "0 0 50px hsl(207 71% 38% / 0.4), 0 0 100px hsl(260 70% 58% / 0.25)",
                "0 0 30px hsl(207 71% 38% / 0.25), 0 0 60px hsl(260 70% 58% / 0.15)",
                "0 0 40px hsl(207 71% 38% / 0.3), 0 0 80px hsl(260 70% 58% / 0.2)",
                "0 0 30px hsl(207 71% 38% / 0.25), 0 0 60px hsl(260 70% 58% / 0.15)",
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Luka bolt SVG */}
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="proc-bolt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="white" stopOpacity="1" />
                  <stop offset="100%" stopColor="hsl(207 71% 76%)" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" fill="url(#proc-bolt-grad)" />
            </svg>
          </motion.div>

          {/* Orbiting sparkle particles */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              className="luka-proc-sparkle"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 5 + i * 1.5, repeat: Infinity, ease: "linear" }}
            >
              <motion.div
                style={{
                  transform: `translateX(${65 + i * 8}px)`,
                }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles size={6 + i} style={{ color: `hsl(${200 + i * 25} 80% ${55 + i * 3}%)` }} />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Current action text */}
        <div className="text-center mb-5">
          <h2 className="text-[22px] font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>
            {completed ? "Processing Complete" : "Luka is working"}
          </h2>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStepText}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.25 }}
              className="text-[15px]"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {currentStepText}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Timer + Progress bar — full width */}
        <div className="w-full max-w-lg mx-auto mb-6 px-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock size={13} style={{ color: "hsl(var(--muted-foreground))" }} />
              <span className="text-[15px] font-mono font-bold" style={{ color: "hsl(var(--foreground))" }}>
                {formatTime(elapsed)}
              </span>
            </div>
            <span className="text-[15px] font-bold" style={{ color: "hsl(var(--primary))" }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="luka-processing-progress-track" style={{ height: "6px" }}>
            <motion.div
              className="luka-processing-progress-fill"
              style={{ width: `${progress}%` }}
            />
            {!completed && (
              <motion.div
                className="luka-processing-progress-shimmer"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-6 mb-6">
          {[
            { label: "Files Scanned", value: Math.min(Math.floor(progress / 7), 14), icon: FileSearch },
            { label: "Items Processed", value: Math.min(Math.floor(progress * 2.47), 247), icon: Database },
            { label: "Issues Found", value: progress > 60 ? 1 : 0, icon: Shield },
          ].map((stat) => (
            <div key={stat.label} className="luka-proc-stat-card">
              <stat.icon size={14} style={{ color: "hsl(var(--primary))" }} />
              <span className="text-lg font-bold" style={{ color: "hsl(var(--foreground))" }}>
                {stat.value}
              </span>
              <span className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
              </span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          {!completed && (
            <>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onStop}
                className="luka-processing-stop-btn"
              >
                <Square size={13} />
                <span>Stop Engagement</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setEmailNotify(!emailNotify)}
                className={`luka-processing-notify-btn ${emailNotify ? "active" : ""}`}
              >
                <Mail size={13} />
                <span>{emailNotify ? "Notification Set ✓" : "Notify me via email"}</span>
              </motion.button>
            </>
          )}
          {completed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl"
              style={{ background: "hsl(145 63% 42% / 0.1)", color: "hsl(145 63% 35%)" }}
            >
              <CheckCircle2 size={16} />
              <span className="text-sm font-semibold">Opening document workspace...</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL — Activity Feed */}
      <div className="luka-proc-right">
        {/* Header */}
        <div
          className="px-4 pt-4 pb-3 flex items-center gap-2.5"
          style={{
            borderBottom: "1px solid hsl(var(--border) / 0.5)",
            background: "linear-gradient(180deg, hsl(var(--background) / 0.9), hsl(var(--background) / 0.6))",
            backdropFilter: "blur(16px)",
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, hsl(207 71% 38% / 0.15), hsl(260 70% 58% / 0.1))",
              border: "1px solid hsl(207 71% 38% / 0.2)",
            }}
          >
            <Activity size={14} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div className="flex-1">
            <span className="text-[13px] font-bold tracking-wide" style={{ color: "hsl(var(--foreground))" }}>
              Luka Activity
            </span>
          </div>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{
              background: "hsl(145 63% 42% / 0.08)",
              border: "1px solid hsl(145 63% 42% / 0.15)",
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "hsl(145 63% 42%)" }}
            />
            <span className="text-[11px] font-semibold" style={{ color: "hsl(145 63% 42%)" }}>Live</span>
          </motion.div>
        </div>

        {/* Activity list */}
        <div className="flex-1 overflow-y-auto px-3 py-3" style={{ scrollbarWidth: "none" }}>
          <AnimatePresence>
            {visibleActivities.map((stepIndex, listIndex) => {
              const step = activitySteps[stepIndex];
              const Icon = step.icon;
              const isActive = elapsed < step.delay + step.duration && elapsed >= step.delay;
              const isDone = elapsed >= step.delay + step.duration;
              return (
                <motion.div
                  key={stepIndex}
                  initial={{ opacity: 0, x: 20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="mb-2"
                >
                  <div
                    className="rounded-xl px-3.5 py-3 transition-all duration-300"
                    style={{
                      background: isActive
                        ? "linear-gradient(135deg, hsl(207 71% 38% / 0.08), hsl(260 70% 58% / 0.05))"
                        : isDone
                        ? "hsl(var(--muted) / 0.3)"
                        : "hsl(var(--muted) / 0.15)",
                      border: isActive
                        ? "1px solid hsl(207 71% 38% / 0.2)"
                        : "1px solid hsl(var(--border) / 0.3)",
                      backdropFilter: "blur(8px)",
                      boxShadow: isActive ? "0 2px 12px hsl(207 71% 38% / 0.08)" : "none",
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300"
                        style={{
                          background: isDone
                            ? "hsl(145 63% 42% / 0.12)"
                            : isActive
                            ? "linear-gradient(135deg, hsl(207 71% 38% / 0.15), hsl(260 70% 58% / 0.1))"
                            : "hsl(var(--muted) / 0.4)",
                          border: isDone
                            ? "1px solid hsl(145 63% 42% / 0.2)"
                            : isActive
                            ? "1px solid hsl(207 71% 38% / 0.25)"
                            : "1px solid hsl(var(--border) / 0.3)",
                          color: isDone
                            ? "hsl(145 63% 42%)"
                            : isActive
                            ? "hsl(207 71% 38%)"
                            : "hsl(var(--muted-foreground))",
                        }}
                      >
                        {isActive && !isDone ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
                            <Loader2 size={13} />
                          </motion.div>
                        ) : isDone ? (
                          <CheckCircle2 size={13} />
                        ) : (
                          <Icon size={13} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[13px] font-medium leading-snug"
                          style={{
                            color: isActive
                              ? "hsl(var(--foreground))"
                              : isDone
                              ? "hsl(var(--muted-foreground))"
                              : "hsl(var(--foreground))",
                          }}
                        >
                          {step.text}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {step.detail}
                        </p>
                      </div>
                      {isActive && !isDone && (
                        <motion.div
                          className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                          style={{ background: "hsl(207 71% 38%)" }}
                          animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.1, 0.8] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Footer — completed count */}
        <div
          className="px-4 py-3"
          style={{
            borderTop: "1px solid hsl(var(--border) / 0.5)",
            background: "linear-gradient(180deg, hsl(var(--background) / 0.6), hsl(var(--background) / 0.9))",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>
              Steps completed
            </span>
            <span className="text-[13px] font-bold" style={{ color: "hsl(var(--primary))" }}>
              {visibleActivities.filter(i => elapsed >= activitySteps[i].delay + activitySteps[i].duration).length} / {activitySteps.length}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${(visibleActivities.filter(i => elapsed >= activitySteps[i].delay + activitySteps[i].duration).length / activitySteps.length) * 100}%`,
                background: "linear-gradient(90deg, hsl(207 71% 38%), hsl(260 70% 58%))",
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LukaProcessingScreen;
