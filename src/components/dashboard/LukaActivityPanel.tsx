import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Loader2, Circle } from "lucide-react";

export interface ActivityEntry {
  id: string;
  text: string;
  timestamp: string;
  status: "done" | "processing" | "pending";
  highlight?: boolean; // e.g. green text for engagement loaded
}

interface LukaActivityPanelProps {
  entries: ActivityEntry[];
  isProcessing: boolean;
  minimized: boolean;
  onToggleMinimize: () => void;
}

const LukaActivityPanel = ({ entries, isProcessing, minimized, onToggleMinimize }: LukaActivityPanelProps) => {
  const activityScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (activityScrollRef.current) {
        activityScrollRef.current.scrollTo({ top: activityScrollRef.current.scrollHeight, behavior: "smooth" });
      }
    }, 80);
    return () => clearTimeout(t);
  }, [entries]);

  return (
    <>
      {/* Minimized badge - shown in context bar area */}
      <AnimatePresence>
        {minimized && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onToggleMinimize}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, hsl(270 60% 55% / 0.08), hsl(207 71% 38% / 0.06))",
              border: "1px solid hsl(270 60% 55% / 0.2)",
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            {isProcessing ? (
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <defs><linearGradient id="luka-act-min" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#9747FF" /><stop offset="100%" stopColor="#115697" /></linearGradient></defs>
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#luka-act-min)" />
                </svg>
              </motion.div>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <defs><linearGradient id="luka-act-min2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#9747FF" /><stop offset="100%" stopColor="#115697" /></linearGradient></defs>
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#luka-act-min2)" />
              </svg>
            )}
            <span className="text-xs font-semibold" style={{ color: "hsl(270 60% 50%)" }}>Activity</span>
            {isProcessing && (
              <motion.span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "hsl(270 60% 55%)", boxShadow: "0 0 6px hsl(270 60% 55% / 0.5)" }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded floating panel */}
      <AnimatePresence>
        {!minimized && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="absolute top-4 right-4 bottom-4 z-40 flex flex-col"
            style={{ width: "280px" }}
          >
            <div
              className="rounded-2xl overflow-hidden flex flex-col flex-1"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 8px 32px -8px hsl(220 30% 20% / 0.12), 0 2px 8px hsl(270 60% 50% / 0.06)",
                backdropFilter: "blur(20px)",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  borderBottom: "1px solid hsl(var(--border))",
                  background: "linear-gradient(135deg, hsl(270 60% 55% / 0.03), hsl(207 71% 38% / 0.02))",
                }}
              >
                <motion.div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: "linear-gradient(135deg, hsl(270 60% 55% / 0.12), hsl(207 71% 38% / 0.10))",
                    border: "1.5px solid hsl(270 60% 55% / 0.2)",
                  }}
                  animate={isProcessing ? {
                    boxShadow: ["0 0 0px hsl(270 60% 55% / 0)", "0 0 12px hsl(270 60% 55% / 0.2)", "0 0 0px hsl(270 60% 55% / 0)"],
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <defs><linearGradient id="luka-act-hdr" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#9747FF" /><stop offset="100%" stopColor="#115697" /></linearGradient></defs>
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#luka-act-hdr)" />
                  </svg>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>Luka Activity</h4>
                  <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>AI Reconciliation Engine</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: "hsl(var(--muted))" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onToggleMinimize}
                  className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  <X size={14} />
                </motion.button>
              </div>

              {/* Activity entries */}
              <div
                ref={activityScrollRef}
                className="overflow-y-auto px-4 py-3 space-y-0.5 flex-1"
                style={{ scrollbarWidth: "none" }}
              >
                {entries.length === 0 ? (
                  <p className="text-xs text-center py-4" style={{ color: "hsl(var(--muted-foreground))" }}>
                    No activity yet
                  </p>
                ) : (
                  entries.map((entry, i) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.25 }}
                      className="flex items-start gap-2.5 py-2"
                    >
                      <div className="mt-0.5 shrink-0">
                        {entry.status === "done" ? (
                          <CheckCircle2 size={14} style={{ color: entry.highlight ? "hsl(145 63% 42%)" : "hsl(var(--muted-foreground) / 0.5)" }} />
                        ) : entry.status === "processing" ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                            <Loader2 size={14} style={{ color: "hsl(270 60% 55%)" }} />
                          </motion.div>
                        ) : (
                          <Circle size={14} style={{ color: "hsl(var(--muted-foreground) / 0.3)" }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[13px] leading-snug"
                          style={{
                            color: entry.highlight
                              ? "hsl(145 63% 42%)"
                              : entry.status === "processing"
                              ? "hsl(var(--foreground))"
                              : "hsl(var(--foreground) / 0.8)",
                            fontWeight: entry.highlight ? 500 : 400,
                          }}
                        >
                          {entry.text}
                        </p>
                        <span className="text-[11px]" style={{ color: "hsl(var(--muted-foreground) / 0.6)" }}>
                          {entry.timestamp}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LukaActivityPanel;
