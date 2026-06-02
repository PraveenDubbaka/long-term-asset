import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, FileSearch, ChevronLeft, ChevronRight, Timer, Coins, Clock, Zap } from "lucide-react";
import AuditTrailTray from "./AuditTrailTray";

interface HistoryEntry {
  id: string;
  entityName: string;
  engagementId: string;
  runNo: number;
  automationDuration: string;
  creditsUsed: number;
  totalTime: string;
  triggeredBy: { initials: string; color: string };
  timestamp: string;
}

const historyData: HistoryEntry[] = [
  { id: "h1", entityName: "Patel & Shah CPA", engagementId: "COM-PAT-Dec312024", runNo: 3, automationDuration: "12m 34s", creditsUsed: 18, totalTime: "1h 22m", triggeredBy: { initials: "AP", color: "hsl(207 71% 38%)" }, timestamp: "Mar 18, 2026 · 02:14 PM" },
  { id: "h2", entityName: "Grewal & Gupta CPA", engagementId: "COM-SIN-Dec312024", runNo: 2, automationDuration: "8m 47s", creditsUsed: 12, totalTime: "45m", triggeredBy: { initials: "MK", color: "hsl(145 63% 42%)" }, timestamp: "Mar 17, 2026 · 11:30 AM" },
  { id: "h3", entityName: "Faber & Associates LLP", engagementId: "COM-MAP-Dec312024", runNo: 5, automationDuration: "22m 11s", creditsUsed: 34, totalTime: "2h 05m", triggeredBy: { initials: "AP", color: "hsl(207 71% 38%)" }, timestamp: "Mar 16, 2026 · 09:45 AM" },
  { id: "h4", entityName: "Durward Jones Barkwell LLP", engagementId: "COM-NOR-Dec312024", runNo: 1, automationDuration: "5m 02s", creditsUsed: 6, totalTime: "18m", triggeredBy: { initials: "RS", color: "hsl(0 72% 58%)" }, timestamp: "Mar 15, 2026 · 04:20 PM" },
  { id: "h5", entityName: "Smythe LLP", engagementId: "COM-EVE-Dec312024", runNo: 2, automationDuration: "14m 58s", creditsUsed: 22, totalTime: "1h 10m", triggeredBy: { initials: "AP", color: "hsl(207 71% 38%)" }, timestamp: "Mar 14, 2026 · 01:05 PM" },
  { id: "h6", entityName: "Grant Thornton LLP", engagementId: "COM-GRN-Dec312024", runNo: 4, automationDuration: "18m 23s", creditsUsed: 28, totalTime: "1h 45m", triggeredBy: { initials: "JS", color: "hsl(30 90% 50%)" }, timestamp: "Mar 13, 2026 · 10:30 AM" },
  { id: "h7", entityName: "BDO Canada LLP", engagementId: "COM-BDO-Dec312024", runNo: 1, automationDuration: "6m 12s", creditsUsed: 8, totalTime: "25m", triggeredBy: { initials: "MK", color: "hsl(145 63% 42%)" }, timestamp: "Mar 12, 2026 · 03:15 PM" },
  { id: "h8", entityName: "MNP LLP", engagementId: "COM-MNP-Apr302024", runNo: 3, automationDuration: "11m 05s", creditsUsed: 15, totalTime: "52m", triggeredBy: { initials: "RS", color: "hsl(0 72% 58%)" }, timestamp: "Mar 11, 2026 · 08:50 AM" },
];

const ITEMS_PER_PAGE = 4;

const WorkspaceHistory = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [auditEntry, setAuditEntry] = useState<HistoryEntry | null>(null);
  const totalPages = Math.ceil(historyData.length / ITEMS_PER_PAGE);
  const paged = historyData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="mt-10"
      style={{ fontSize: "16px" }}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "hsl(var(--primary) / 0.08)" }}
          >
            <History size={17} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: "hsl(220 20% 16%)" }}>History</h3>
            <p className="text-xs" style={{ color: "hsl(220 15% 55%)" }}>Automation run logs & audit trails</p>
          </div>
        </div>
        <span className="text-xs font-medium" style={{ color: "hsl(220 15% 55%)" }}>
          {historyData.length} total runs
        </span>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline vertical line */}
        <div
          className="absolute left-[19px] top-4 bottom-4 w-[2px] rounded-full"
          style={{ background: "hsl(var(--border))" }}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            {paged.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="relative flex items-start gap-5 pl-0"
              >
                {/* Timeline dot */}
                <div className="relative z-10 flex flex-col items-center pt-5">
                  <div
                    className="w-[10px] h-[10px] rounded-full border-[2.5px] shrink-0"
                    style={{
                      borderColor: "#006AAB",
                      background: "hsl(var(--background))",
                    }}
                  />
                </div>

                {/* Card */}
                <motion.div
                  whileHover={{ y: -2, boxShadow: "0 8px 28px hsl(220 30% 50% / 0.1)" }}
                  className="flex-1 rounded-2xl border p-5 transition-shadow cursor-default"
                  style={{
                    borderColor: "hsl(var(--border))",
                    background: "hsl(var(--card))",
                    boxShadow: "0 1px 4px hsl(220 30% 50% / 0.04)",
                  }}
                >
                  {/* Card Top: Entity + Timestamp */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ background: entry.triggeredBy.color }}
                      >
                        {entry.triggeredBy.initials}
                      </div>
                      <div>
                        <span
                          className="text-[15px] font-semibold block leading-tight"
                          style={{ color: "hsl(220 20% 16%)" }}
                        >
                          {entry.entityName}
                        </span>
                        <span className="text-xs" style={{ color: "hsl(220 15% 55%)" }}>
                          {entry.engagementId}
                        </span>
                      </div>
                    </div>
                    <span
                      className="text-[11px] font-medium shrink-0 mt-0.5"
                      style={{ color: "hsl(220 15% 55%)" }}
                    >
                      {entry.timestamp}
                    </span>
                  </div>

                  {/* Card Metrics Row */}
                  <div className="flex items-center gap-5 flex-wrap">
                    {/* Run badge */}
                    <div className="flex items-center gap-2">
                      <div
                        className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg"
                        style={{
                          color: "hsl(260 60% 45%)",
                          background: "hsl(260 60% 50% / 0.08)",
                        }}
                      >
                        <Zap size={11} />
                        Run #{entry.runNo}
                      </div>
                    </div>

                    {/* Automation Duration */}
                    <div className="flex items-center gap-1.5">
                      <Timer size={13} style={{ color: "#006AAB" }} />
                      <span className="text-sm font-medium" style={{ color: "hsl(220 20% 16%)" }}>
                        {entry.automationDuration}
                      </span>
                    </div>

                    {/* Credits */}
                    <div className="flex items-center gap-1.5">
                      <Coins size={13} style={{ color: "hsl(30 90% 50%)" }} />
                      <span className="text-sm font-medium" style={{ color: "hsl(220 20% 16%)" }}>
                        {entry.creditsUsed} credits
                      </span>
                    </div>

                    {/* Total Time */}
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} style={{ color: "hsl(145 63% 42%)" }} />
                      <span className="text-sm font-medium" style={{ color: "hsl(220 20% 16%)" }}>
                        {entry.totalTime}
                      </span>
                    </div>

                    {/* Spacer + Audit Trail */}
                    <div className="ml-auto">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setAuditEntry(entry)}
                        className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer h-[40px]"
                        style={{
                          color: "#006AAB",
                          background: "#F2F9FF",
                          border: "1.5px solid #006AAB",
                        }}
                      >
                        <FileSearch size={14} />
                        Audit Trail
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <span className="text-xs" style={{ color: "hsl(220 15% 55%)" }}>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-1.5 rounded-md transition-colors disabled:opacity-30"
              style={{ color: "hsl(220 15% 45%)" }}
            >
              <ChevronLeft size={14} />
            </motion.button>
            {Array.from({ length: totalPages }, (_, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.05 }}
                onClick={() => setCurrentPage(i + 1)}
                className="w-7 h-7 rounded-md text-xs font-semibold transition-colors"
                style={{
                  background: currentPage === i + 1 ? "#006AAB" : "transparent",
                  color: currentPage === i + 1 ? "white" : "hsl(220 15% 45%)",
                }}
              >
                {i + 1}
              </motion.button>
            ))}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1.5 rounded-md transition-colors disabled:opacity-30"
              style={{ color: "hsl(220 15% 45%)" }}
            >
              <ChevronRight size={14} />
            </motion.button>
          </div>
        </div>
      )}
      <AuditTrailTray
        open={!!auditEntry}
        onClose={() => setAuditEntry(null)}
        entityName={auditEntry?.entityName ?? ""}
        engagementId={auditEntry?.engagementId ?? ""}
      />
    </motion.div>
  );
};

export default WorkspaceHistory;
