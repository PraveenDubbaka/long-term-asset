import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Database, HardDrive, FileSpreadsheet, Cloud, TrendingUp } from "lucide-react";

interface DataSource {
  name: string;
  icon: React.ReactNode;
  files: number;
  connected: boolean;
}

interface LukaCreditsEstimatorProps {
  selections: Record<number, string[]>;
  dataSources: DataSource[];
}

const BASE_CREDITS: Record<string, number> = {
  "Financial Audit": 0.05,
  "Tax Compliance": 0.05,
  "Advisory": 0.05,
  "Review Engagement": 0.05,
  "Compilation": 0.05,
  "Internal Audit": 0.05,
};

const INDUSTRY_MULTIPLIER: Record<string, number> = {
  "Technology": 1.2,
  "Healthcare": 1.35,
  "Financial Services": 1.4,
  "Manufacturing": 1.15,
  "Retail / E-commerce": 1.1,
  "Education": 1.0,
  "Government": 1.25,
  "Energy": 1.3,
};

const CREDITS_PER_TEAM_MEMBER = 0.50;
const CREDITS_PER_FILE = 0.50;

const LukaCreditsEstimator = ({ selections, dataSources }: LukaCreditsEstimatorProps) => {
  const connectedSources = dataSources.filter((d) => d.connected);
  const totalFiles = connectedSources.reduce((sum, d) => sum + d.files, 0);

  const { totalCredits, breakdown } = useMemo(() => {
    const engagementType = selections[0]?.[0];
    const industry = selections[1]?.[0];
    const teamMembers = selections[2] || [];

    const base = engagementType ? (BASE_CREDITS[engagementType] || 200) : 0;
    const multiplier = industry ? (INDUSTRY_MULTIPLIER[industry] || 1.0) : 1.0;
    const teamCredits = teamMembers.length * CREDITS_PER_TEAM_MEMBER;
    const fileCredits = totalFiles * CREDITS_PER_FILE;

    const adjustedBase = parseFloat((base * multiplier).toFixed(2));
    const total = adjustedBase + teamCredits + fileCredits;

    return {
      totalCredits: total,
      breakdown: {
        base: adjustedBase,
        team: teamCredits,
        files: fileCredits,
      },
    };
  }, [selections, totalFiles]);

  if (totalCredits === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="mt-4 pt-3 border-t"
      style={{ borderColor: "hsl(var(--border))" }}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-3">
        <Zap size={11} style={{ color: "#9747FF" }} />
        <span
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "hsl(220 15% 50%)" }}
        >
          Est. Credits
        </span>
      </div>

      {/* Total credits display */}
      <motion.div
        key={totalCredits}
        initial={{ scale: 0.95, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="rounded-xl p-3 mb-3"
        style={{
          background: "linear-gradient(135deg, hsl(265 60% 97%), hsl(220 60% 97%))",
          border: "1px solid hsl(260 40% 90%)",
        }}
      >
        <div className="flex items-baseline gap-1.5">
          <motion.span
            key={totalCredits}
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-xl font-extrabold tabular-nums"
            style={{
              background: "linear-gradient(135deg, #9747FF, #115697)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {totalCredits % 1 === 0 ? totalCredits.toLocaleString() : totalCredits.toFixed(2)}
          </motion.span>
          <span className="text-[10px] font-semibold" style={{ color: "hsl(220 15% 55%)" }}>
            credits
          </span>
        </div>

        {/* Mini breakdown */}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
          {breakdown.base > 0 && (
            <span className="text-[9px] font-medium" style={{ color: "hsl(220 15% 55%)" }}>
              Base {breakdown.base}
            </span>
          )}
          {breakdown.team > 0 && (
            <span className="text-[9px] font-medium" style={{ color: "hsl(220 15% 55%)" }}>
              Team +{breakdown.team}
            </span>
          )}
          {breakdown.files > 0 && (
            <span className="text-[9px] font-medium" style={{ color: "hsl(260 50% 55%)" }}>
              Files +{breakdown.files}
            </span>
          )}
        </div>
      </motion.div>

      {/* Data sources */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold" style={{ color: "hsl(220 15% 50%)" }}>
            Data Sources
          </span>
          <span className="text-[9px] font-medium tabular-nums" style={{ color: "hsl(220 15% 60%)" }}>
            {totalFiles} files
          </span>
        </div>

        {dataSources.map((source) => (
          <motion.div
            key={source.name}
            layout
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
            style={{
              background: source.connected
                ? "hsl(var(--primary) / 0.05)"
                : "transparent",
              border: `1px solid ${source.connected ? "hsl(var(--primary) / 0.12)" : "hsl(var(--border) / 0.6)"}`,
              opacity: source.connected ? 1 : 0.5,
            }}
          >
            <span
              className="shrink-0"
              style={{ color: source.connected ? "#9747FF" : "hsl(220 15% 60%)" }}
            >
              {source.icon}
            </span>
            <span
              className="text-[11px] font-medium flex-1 truncate"
              style={{ color: source.connected ? "hsl(220 20% 20%)" : "hsl(220 15% 55%)" }}
            >
              {source.name}
            </span>
            {source.connected && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-[9px] font-bold tabular-nums shrink-0"
                style={{ color: "hsl(260 50% 55%)" }}
              >
                {source.files}
              </motion.span>
            )}
            {source.connected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: "hsl(145 63% 45%)" }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Trend indicator */}
      <AnimatePresence>
        {connectedSources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2.5 flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
            style={{
              background: "hsl(145 50% 96%)",
              border: "1px solid hsl(145 40% 88%)",
            }}
          >
            <TrendingUp size={10} style={{ color: "hsl(145 63% 40%)" }} />
            <span className="text-[9px] font-medium" style={{ color: "hsl(145 40% 30%)" }}>
              {connectedSources.length} source{connectedSources.length > 1 ? "s" : ""} connected · auto-scaling
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LukaCreditsEstimator;
