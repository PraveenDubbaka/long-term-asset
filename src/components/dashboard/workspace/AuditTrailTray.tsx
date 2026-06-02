import { motion, AnimatePresence } from "framer-motion";
import { X, History, Zap, FileCheck, MessageSquare, AlertTriangle, CheckCircle2, Upload, Eye, Bot } from "lucide-react";

interface AuditEvent {
  id: string;
  timestamp: string;
  actor: { name: string; initials: string; color: string; isLuka?: boolean };
  action: string;
  detail: string;
  icon: React.ReactNode;
  category: "automation" | "review" | "upload" | "alert" | "complete";
}

const categoryColors: Record<string, string> = {
  automation: "hsl(207 71% 38%)",
  review: "hsl(260 60% 50%)",
  upload: "hsl(30 90% 50%)",
  alert: "hsl(0 72% 58%)",
  complete: "hsl(145 63% 42%)",
};

const generateAuditTrail = (entityName: string, engagementId: string): AuditEvent[] => [
  {
    id: "a1",
    timestamp: "Mar 18 · 02:14 PM",
    actor: { name: "Luka AI", initials: "L", color: "hsl(145 63% 42%)", isLuka: true },
    action: "Completed financial statement generation",
    detail: `Generated Balance Sheet, Income Statement, and Cash Flow for ${entityName}.`,
    icon: <CheckCircle2 size={14} />,
    category: "complete",
  },
  {
    id: "a2",
    timestamp: "Mar 18 · 02:08 PM",
    actor: { name: "Luka AI", initials: "L", color: "hsl(145 63% 42%)", isLuka: true },
    action: "Flagged 2 accounts for review",
    detail: "Accounts Receivable and Prepaid Expenses require manual verification due to unusual variance.",
    icon: <AlertTriangle size={14} />,
    category: "alert",
  },
  {
    id: "a3",
    timestamp: "Mar 18 · 01:52 PM",
    actor: { name: "Amit Patel", initials: "AP", color: "hsl(207 71% 38%)" },
    action: "Approved account mapping",
    detail: "Reviewed and approved the chart of accounts mapping for 47 GL accounts.",
    icon: <Eye size={14} />,
    category: "review",
  },
  {
    id: "a4",
    timestamp: "Mar 18 · 01:30 PM",
    actor: { name: "Luka AI", initials: "L", color: "hsl(145 63% 42%)", isLuka: true },
    action: "Started account mapping automation",
    detail: `Auto-mapped 43 of 47 accounts from trial balance for ${engagementId}.`,
    icon: <Zap size={14} />,
    category: "automation",
  },
  {
    id: "a5",
    timestamp: "Mar 18 · 01:15 PM",
    actor: { name: "Ravi Singh", initials: "RS", color: "hsl(0 72% 58%)" },
    action: "Uploaded trial balance",
    detail: "Uploaded Q4 trial balance export from QuickBooks Online (142 line items).",
    icon: <Upload size={14} />,
    category: "upload",
  },
  {
    id: "a6",
    timestamp: "Mar 17 · 04:45 PM",
    actor: { name: "Luka AI", initials: "L", color: "hsl(145 63% 42%)", isLuka: true },
    action: "Generated draft engagement letter",
    detail: "Prepared CSRS 4200 compilation engagement letter based on prior year template.",
    icon: <FileCheck size={14} />,
    category: "automation",
  },
  {
    id: "a7",
    timestamp: "Mar 17 · 03:20 PM",
    actor: { name: "Amit Patel", initials: "AP", color: "hsl(207 71% 38%)" },
    action: "Left a note for reviewer",
    detail: "\"Please verify the intercompany eliminations before final sign-off.\"",
    icon: <MessageSquare size={14} />,
    category: "review",
  },
  {
    id: "a8",
    timestamp: "Mar 17 · 02:00 PM",
    actor: { name: "Luka AI", initials: "L", color: "hsl(145 63% 42%)", isLuka: true },
    action: "Initiated engagement workspace",
    detail: `Created workspace and imported prior year data for ${entityName}.`,
    icon: <Bot size={14} />,
    category: "automation",
  },
];

interface AuditTrailTrayProps {
  open: boolean;
  onClose: () => void;
  entityName: string;
  engagementId: string;
}

const AuditTrailTray = ({ open, onClose, entityName, engagementId }: AuditTrailTrayProps) => {
  const events = generateAuditTrail(entityName, engagementId);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: "hsl(220 30% 10% / 0.3)", backdropFilter: "blur(2px)" }}
          />

          {/* Tray */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 h-full z-50 flex flex-col"
            style={{
              width: "480px",
              background: "hsl(var(--background))",
              borderLeft: "1px solid hsl(var(--border))",
              boxShadow: "-8px 0 30px hsl(220 30% 10% / 0.1)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-5 shrink-0"
              style={{ borderBottom: "1px solid hsl(var(--border))" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "hsl(207 56% 32% / 0.08)" }}
                >
                  <History size={17} style={{ color: "#006AAB" }} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold" style={{ color: "hsl(220 20% 16%)" }}>
                    Audit Trail
                  </h3>
                  <p className="text-xs" style={{ color: "hsl(220 15% 55%)" }}>
                    {entityName}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  color: "hsl(220 15% 45%)",
                  background: "hsl(var(--muted) / 0.5)",
                }}
              >
                <X size={16} />
              </motion.button>
            </div>

            {/* Engagement badge */}
            <div className="px-6 pt-4 pb-2 shrink-0">
              <span
                className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{
                  color: "#006AAB",
                  background: "hsl(207 56% 32% / 0.06)",
                  border: "1px solid hsl(207 56% 32% / 0.12)",
                }}
              >
                {engagementId}
              </span>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto px-6 py-4" style={{ scrollbarWidth: "none" }}>
              <div className="relative">
                {/* Vertical line */}
                <div
                  className="absolute left-[15px] top-3 bottom-3 w-[2px] rounded-full"
                  style={{ background: "hsl(var(--border))" }}
                />

                <div className="flex flex-col gap-1">
                  {events.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative flex items-start gap-4 pl-0 py-3"
                    >
                      {/* Timeline dot */}
                      <div className="relative z-10 shrink-0 mt-1">
                        <div
                          className="w-[10px] h-[10px] rounded-full border-[2.5px]"
                          style={{
                            borderColor: categoryColors[event.category],
                            background: "hsl(var(--background))",
                          }}
                        />
                      </div>

                      {/* Event card */}
                      <div className="flex-1 min-w-0">
                        {/* Timestamp */}
                        <span
                          className="text-[11px] font-medium block mb-1.5"
                          style={{ color: "hsl(220 15% 55%)" }}
                        >
                          {event.timestamp}
                        </span>

                        {/* Actor + Action */}
                        <div className="flex items-start gap-2.5 mb-1.5">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5"
                            style={{ background: event.actor.color }}
                          >
                            {event.actor.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="text-[13px] font-semibold"
                                style={{ color: "hsl(220 20% 16%)" }}
                              >
                                {event.actor.name}
                              </span>
                              {event.actor.isLuka && (
                                <span
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                                  style={{
                                    color: "hsl(145 63% 35%)",
                                    background: "hsl(145 63% 42% / 0.1)",
                                  }}
                                >
                                  AI
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span
                                className="shrink-0"
                                style={{ color: categoryColors[event.category] }}
                              >
                                {event.icon}
                              </span>
                              <span
                                className="text-[13px] font-medium"
                                style={{ color: "hsl(220 20% 25%)" }}
                              >
                                {event.action}
                              </span>
                            </div>
                            <p
                              className="text-xs mt-1.5 leading-relaxed"
                              style={{ color: "hsl(220 15% 50%)" }}
                            >
                              {event.detail}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AuditTrailTray;
