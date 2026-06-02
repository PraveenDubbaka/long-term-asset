import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

const loadingMessages = [
  "Fetching workspaces...",
  "Gathering latest statuses...",
  "Syncing engagement data...",
  "Loading module configurations...",
  "Preparing your workspace...",
];

interface WorkspaceLoaderProps {
  onComplete: () => void;
}

const WorkspaceLoader = ({ onComplete }: WorkspaceLoaderProps) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIndex((prev) => {
        if (prev < loadingMessages.length - 1) return prev + 1;
        return prev;
      });
    }, 900);

    const progInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, 90);

    const timer = setTimeout(onComplete, 5000);

    return () => {
      clearInterval(msgInterval);
      clearInterval(progInterval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background:
          "linear-gradient(145deg, hsl(var(--background)), hsl(270 60% 55% / 0.03), hsl(207 71% 38% / 0.03), hsl(var(--background)))",
      }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, hsl(270 60% 55% / 0.05) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center gap-6"
      >
        {/* Thunder bolt icon */}
        <motion.div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, hsl(270 60% 55% / 0.1), hsl(207 71% 38% / 0.08))",
            border: "1px solid hsl(270 60% 55% / 0.15)",
            boxShadow: "0 4px 20px hsl(270 60% 55% / 0.08)",
          }}
          animate={{
            boxShadow: [
              "0 4px 20px hsl(270 60% 55% / 0.08)",
              "0 4px 30px hsl(270 60% 55% / 0.18)",
              "0 4px 20px hsl(270 60% 55% / 0.08)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="loader-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9747FF" />
                  <stop offset="100%" stopColor="#115697" />
                </linearGradient>
              </defs>
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#loader-grad)" />
            </svg>
          </motion.div>
        </motion.div>

        {/* Message text */}
        <div className="h-6 relative flex items-center justify-center" style={{ minWidth: 240 }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="text-sm font-medium absolute"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {loadingMessages[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div
          className="w-48 h-1 rounded-full overflow-hidden"
          style={{ background: "hsl(var(--muted))" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #9747FF, #115697)",
            }}
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.15, ease: "linear" }}
          />
        </div>

        {/* Subtle dots */}
        <div className="flex items-center gap-1.5 mt-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 h-1 rounded-full"
              style={{ background: "hsl(270 60% 55% / 0.4)" }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default WorkspaceLoader;
