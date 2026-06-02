import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EngagementWizard from "./EngagementWizard";
import AutomationIntakeWizard from "./AutomationIntakeWizard";
import LukaProcessingScreen from "./LukaProcessingScreen";
import type { EngagementContext } from "./LukaProcessingScreen";
import DocumentUploadView from "./DocumentUploadView";
import WorkspaceEngagements from "./WorkspaceEngagements";
import TeamMembersTray from "./TeamMembersTray";
import type { MagicEngagementData } from "./WorkspaceEngagements";
import {
  Zap,
  Send,
  Sparkles,
  Scale,
  ClipboardCheck,
  FileText,
  BarChart3,
  Users,
  Activity,
  MessageCircle,
  AtSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Bot,
  ChevronRight,
  Mic,
  FolderOpen,
  Plus,
} from "lucide-react";

type WorkspaceModule = "trial_balance" | "checklists" | "working_papers" | "financials" | "team_activity";

interface ModuleItem {
  id: WorkspaceModule;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const modules: ModuleItem[] = [
  { id: "trial_balance", label: "Trial Balance", icon: <Scale size={16} /> },
  { id: "checklists", label: "Checklists", icon: <ClipboardCheck size={16} />, badge: 3 },
  { id: "working_papers", label: "Working Papers", icon: <FileText size={16} /> },
  { id: "financials", label: "Financial Statements", icon: <BarChart3 size={16} /> },
  { id: "team_activity", label: "Team Activity", icon: <Users size={16} />, badge: 5 },
];

const lukaActivityLog = [
  { id: 1, type: "processing" as const, text: "Analyzing Q4 revenue variance...", time: "Just now", status: "active" },
  { id: 2, type: "completed" as const, text: "Bank reconciliation matched 247 entries", time: "2m ago", status: "done" },
  { id: 3, type: "flag" as const, text: "Unusual transaction flagged — $12,400 payment", time: "5m ago", status: "flag" },
  { id: 4, type: "completed" as const, text: "Trial balance imported from QuickBooks", time: "12m ago", status: "done" },
  { id: 5, type: "completed" as const, text: "Document classification completed (14 files)", time: "18m ago", status: "done" },
];

const teamMessages = [
  { id: 1, user: "Sarah C.", initials: "SC", message: "Can someone review the AR aging summary?", time: "3m ago" },
  { id: 2, user: "James W.", initials: "JW", message: "Just uploaded the Dec bank statements", time: "8m ago" },
  { id: 3, user: "Maya P.", initials: "MP", message: "@Sarah the variance looks off in row 42", time: "15m ago" },
];

const presenceUsers = [
  { initials: "SC", name: "Sarah Chen", color: "hsl(207 71% 38%)" },
  { initials: "JW", name: "James Wilson", color: "hsl(145 63% 42%)" },
  { initials: "MP", name: "Maya Patel", color: "hsl(30 90% 50%)" },
];

const canvasData: Record<WorkspaceModule, { title: string; rows: { label: string; value: string; status?: string }[] }> = {
  trial_balance: {
    title: "Trial Balance — Acme Corp Q4 2024",
    rows: [
      { label: "Cash & Equivalents", value: "$142,500", status: "verified" },
      { label: "Accounts Receivable", value: "$87,320", status: "pending" },
      { label: "Revenue", value: "$534,200", status: "variance" },
      { label: "Cost of Goods Sold", value: "$312,100", status: "verified" },
      { label: "Operating Expenses", value: "$98,750", status: "verified" },
      { label: "Accounts Payable", value: "$45,600", status: "pending" },
    ],
  },
  checklists: {
    title: "Engagement Checklists",
    rows: [
      { label: "Client acceptance and continuance", value: "Complete", status: "verified" },
      { label: "Independence confirmation", value: "Complete", status: "verified" },
      { label: "Knowledge of client business", value: "In Progress", status: "pending" },
      { label: "Planning memo", value: "Not Started", status: "variance" },
      { label: "Risk assessment", value: "Not Started", status: "variance" },
    ],
  },
  working_papers: {
    title: "Working Papers",
    rows: [
      { label: "WP-100 Cash Lead Sheet", value: "Drafted", status: "pending" },
      { label: "WP-200 Revenue Testing", value: "In Review", status: "pending" },
      { label: "WP-300 Expense Analysis", value: "Approved", status: "verified" },
      { label: "WP-400 Capital Assets", value: "Not Started", status: "variance" },
    ],
  },
  financials: {
    title: "Financial Statements",
    rows: [
      { label: "Balance Sheet", value: "Draft v2", status: "pending" },
      { label: "Income Statement", value: "Draft v1", status: "pending" },
      { label: "Cash Flow Statement", value: "Not Started", status: "variance" },
      { label: "Notes to Financial Statements", value: "Not Started", status: "variance" },
    ],
  },
  team_activity: {
    title: "Recent Team Activity",
    rows: [
      { label: "Sarah Chen uploaded bank statement", value: "2 hours ago", status: "verified" },
      { label: "James Wilson modified trial balance", value: "5 hours ago", status: "pending" },
      { label: "Maya Patel completed reconciliation", value: "1 day ago", status: "verified" },
      { label: "Sarah Chen connected QuickBooks", value: "2 days ago", status: "verified" },
    ],
  },
};

const statusIcon = (status?: string) => {
  if (status === "verified") return <CheckCircle2 size={13} style={{ color: "hsl(145 63% 42%)" }} />;
  if (status === "pending") return <Clock size={13} style={{ color: "hsl(207 71% 38%)" }} />;
  if (status === "variance") return <AlertTriangle size={13} style={{ color: "hsl(30 90% 50%)" }} />;
  return null;
};

interface WorkspaceViewProps {
  postAutomationActive?: boolean;
  selectedEngagement?: { name: string; code: string };
}

const WorkspaceView = ({ postAutomationActive = false, selectedEngagement }: WorkspaceViewProps) => {
  const [activeModule, setActiveModule] = useState<WorkspaceModule>("trial_balance");
  const [promptValue, setPromptValue] = useState("");
  const [isPromptSending, setIsPromptSending] = useState(false);
  const canPromptSend = promptValue.trim().length > 0 && !isPromptSending;
  const handlePromptSend = () => {
    if (!canPromptSend) return;
    setIsPromptSending(true);
    setTimeout(() => {
      setIsPromptSending(false);
      setPromptValue("");
    }, 1500);
  };
  const [rightTab, setRightTab] = useState<"activity" | "team">("activity");
  const [showWizard, setShowWizard] = useState(false);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [showAutomationWizard, setShowAutomationWizard] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [processingContext, setProcessingContext] = useState<EngagementContext | undefined>(undefined);
  const [showTeamTray, setShowTeamTray] = useState(false);
  const [teamAnchorRect, setTeamAnchorRect] = useState<DOMRect | null>(null);
  const currentCanvas = canvasData[activeModule];

  if (showAutomationWizard) {
    return (
      <AutomationIntakeWizard
        onComplete={() => {
          setShowAutomationWizard(false);
          setShowProcessing(true);
        }}
        onBack={() => setShowAutomationWizard(false)}
      />
    );
  }

  if (showProcessing) {
    return (
      <LukaProcessingScreen
        onComplete={() => {
          setShowProcessing(false);
          setShowDocUpload(true);
          setProcessingContext(undefined);
        }}
        onStop={() => {
          setShowProcessing(false);
          setProcessingContext(undefined);
        }}
        engagementContext={processingContext}
      />
    );
  }

  if (showDocUpload) {
    return <DocumentUploadView onBack={() => setShowDocUpload(false)} />;
  }

  if (!postAutomationActive) {
    return (
      <div className="flex-1 overflow-hidden bg-background">
        <WorkspaceEngagements
          onStartAutomation={() => setShowAutomationWizard(true)}
          onMagicEngagementClick={(data: MagicEngagementData) => {
            setProcessingContext(data);
            setShowProcessing(true);
          }}
        />
      </div>
    );
  }

  return (
    <>
      {showWizard && <EngagementWizard onClose={() => setShowWizard(false)} />}
      <TeamMembersTray
        open={showTeamTray}
        onClose={() => setShowTeamTray(false)}
        anchorRect={teamAnchorRect}
      />
    <div className="luka-workspace-root">

      {/* LEFT PANEL — Workspace Modules */}
      <div className="luka-workspace-left">
        {/* Workspace header */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <motion.div
              className="luka-workspace-luka-dot"
              animate={{
                boxShadow: [
                  "0 0 0px hsl(145 70% 50% / 0.3)",
                  "0 0 12px hsl(145 70% 50% / 0.6)",
                  "0 0 0px hsl(145 70% 50% / 0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(145 65% 40%)" }}>
              Luka Active
            </span>
          </div>
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="mt-1 rounded-xl px-3 py-2.5 flex items-center gap-2.5"
            style={{
              background: "linear-gradient(135deg, hsl(207 71% 38% / 0.08), hsl(260 70% 58% / 0.06))",
              border: "1.5px solid hsl(207 71% 38%)",
              boxShadow: "0 2px 10px -2px hsl(207 71% 38% / 0.25)",
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "hsl(207 71% 38%)" }}
            >
              <Zap size={13} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-[13px] font-bold truncate" style={{ color: "hsl(220 20% 18%)" }}>
                {selectedEngagement?.name ?? "Acme Corp"}
              </h4>
              <p className="text-[10px] truncate" style={{ color: "hsl(220 15% 55%)" }}>
                {selectedEngagement?.code ?? "ENG-2024-001"}
              </p>
            </div>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowWizard(true)}
            className="engagement-start-btn mt-3 whitespace-nowrap"
          >
            <Zap size={13} className="shrink-0" />
            <span>Start Engagement</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowDocUpload(true)}
            className="engagement-start-btn mt-2 whitespace-nowrap"
            style={{
              background: "linear-gradient(135deg, hsl(207 71% 38%), hsl(260 70% 58%))",
            }}
          >
            
            <span>+ New Workspace</span>
          </motion.button>
        </div>

        {/* Module nav */}
        <div className="px-2 flex-1">
          <div className="px-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(220 15% 55%)" }}>
              Modules
            </span>
          </div>
          {modules.map((mod) => (
            <motion.button
              key={mod.id}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                if (mod.id === "team_activity") {
                  setTeamAnchorRect(e.currentTarget.getBoundingClientRect());
                  setShowTeamTray(true);
                  return;
                }
                setActiveModule(mod.id);
              }}
              className={`luka-workspace-module-item ${activeModule === mod.id ? "luka-workspace-module-item--active" : ""}`}
            >
              <span className="luka-workspace-module-icon">{mod.icon}</span>
              <span className="flex-1 text-left truncate">{mod.label}</span>
              {mod.badge && (
                <span className="luka-workspace-module-badge">{mod.badge}</span>
              )}
              {activeModule === mod.id && (
                <ChevronRight size={12} style={{ color: "hsl(207 71% 38%)" }} />
              )}
            </motion.button>
          ))}
        </div>

        {/* Presence indicators */}
        <div className="px-4 py-3 border-t" style={{ borderColor: "hsl(220 30% 92%)" }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(220 15% 55%)" }}>
              Online Now
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                setTeamAnchorRect(e.currentTarget.getBoundingClientRect());
                setShowTeamTray(true);
              }}
              className="text-[10px] font-semibold"
              style={{ color: "hsl(207 71% 38%)" }}
            >
              Manage
            </motion.button>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            {presenceUsers.map((u) => (
              <motion.button
                key={u.initials}
                whileHover={{ scale: 1.15, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  setTeamAnchorRect(e.currentTarget.getBoundingClientRect());
                  setShowTeamTray(true);
                }}
                className="luka-workspace-presence-dot"
                style={{ background: u.color, cursor: "pointer", border: "none" }}
                title={u.name}
              >
                <span className="text-[9px] font-bold text-white">{u.initials}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER PANEL — Prompter + Canvas */}
      <div className="luka-workspace-center">
        {/* Prompter */}
        <div className="luka-workspace-prompter">
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Bot size={16} style={{ color: "hsl(207 71% 38%)" }} />
            </motion.div>
            <span className="text-xs font-medium" style={{ color: "hsl(220 15% 55%)" }}>
              Ask Luka anything about this workspace
            </span>
          </div>
          <div className="luka-workspace-prompt-input-wrap">
            <textarea
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              placeholder={`Try: "Explain the variance in revenue" or "Run bank reconciliation"`}
              rows={2}
              className="luka-workspace-prompt-input"
            />
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.94 }}
                  className="luka-workspace-prompt-action"
                  title="Add"
                >
                  <Plus size={14} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.94 }}
                  className="luka-workspace-prompt-action"
                  title="Attach files"
                >
                  <FolderOpen size={14} />
                </motion.button>
                <div className="luka-workspace-model-tag">
                  <Sparkles size={10} style={{ color: "hsl(40 90% 50%)" }} />
                  <span>Gemini 3 Flash</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.94 }}
                  className="luka-workspace-prompt-action"
                  title="Voice"
                >
                  <Mic size={14} />
                </motion.button>
                <motion.button
                  whileHover={canPromptSend ? { scale: 1.1 } : {}}
                  whileTap={canPromptSend ? { scale: 0.9 } : {}}
                  className={`luka-send-btn ${canPromptSend ? "enabled" : ""}`}
                  disabled={!canPromptSend}
                  onClick={handlePromptSend}
                  title="Send"
                >
                  {isPromptSending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 size={14} strokeWidth={2.2} />
                    </motion.div>
                  ) : (
                    <Send size={14} strokeWidth={2.2} />
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </div>


        {/* Canvas */}
        <div className="luka-workspace-canvas">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ color: "hsl(220 20% 18%)" }}>{currentCanvas.title}</h3>
                <motion.span
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-[10px] font-medium px-2.5 py-0.5 rounded-full"
                  style={{
                    color: "hsl(145 70% 55%)",
                    background: "hsl(145 70% 50% / 0.12)",
                    border: "1px solid hsl(145 70% 50% / 0.2)",
                    boxShadow: "0 0 8px hsl(145 70% 50% / 0.1)",
                  }}
                >
                  ● Live
                </motion.span>
              </div>

              <div
                className="workspace-table-scroll overflow-x-scroll rounded-xl"
              >
                <table
                  className="table-fixed"
                  style={{
                    width: "max(100%, 640px)",
                    borderCollapse: "separate",
                    borderSpacing: 0,
                    border: "1px solid hsl(var(--table-border))",
                    borderRadius: 12,
                  }}
                >
                  <colgroup>
                    <col style={{ width: "42%" }} />
                    <col style={{ width: "42%" }} />
                    <col style={{ width: "16%" }} />
                  </colgroup>
                  <thead>
                    <tr style={{ background: "hsl(var(--table-header-bg))" }}>
                      <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "hsl(220 20% 30%)", borderBottom: "1px solid hsl(var(--table-border))" }}>Item</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold" style={{ color: "hsl(220 20% 30%)", borderBottom: "1px solid hsl(var(--table-border))" }}>Value / Status</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold" style={{ color: "hsl(220 20% 30%)", borderBottom: "1px solid hsl(var(--table-border))" }}>Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCanvas.rows.map((row, i) => {
                      const hasBorder = i < currentCanvas.rows.length - 1;
                      return (
                        <motion.tr
                          key={`${activeModule}-${i}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="transition-colors duration-150 hover:bg-[hsl(var(--table-row-hover))]"
                        >
                          <td className="px-5 py-3.5 text-sm" style={{ color: "hsl(220 18% 30%)", fontSize: 16, borderBottom: hasBorder ? "1px solid hsl(var(--table-border))" : undefined }}>
                            <span className="block truncate">{row.label}</span>
                          </td>
                          <td className="px-5 py-3.5 text-center text-sm font-semibold" style={{ color: "hsl(220 20% 18%)", fontSize: 16, borderBottom: hasBorder ? "1px solid hsl(var(--table-border))" : undefined }}>
                            <span className="block truncate">{row.value}</span>
                          </td>
                          <td className="px-5 py-3.5 text-center" style={{ borderBottom: hasBorder ? "1px solid hsl(var(--table-border))" : undefined }}>
                            {statusIcon(row.status)}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT PANEL — Activity + Collaboration */}
      <div className="luka-workspace-right">
        {/* Tabs */}
        <div className="flex items-center gap-0.5 px-3 pt-3 pb-2">
          {([
            { id: "activity" as const, label: "Luka Activity", icon: <Activity size={12} /> },
            { id: "team" as const, label: "Team", icon: <MessageCircle size={12} /> },
          ]).map((tab) => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setRightTab(tab.id)}
              className={`luka-workspace-right-tab ${rightTab === tab.id ? "luka-workspace-right-tab--active" : ""}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-3 pb-3" style={{ scrollbarWidth: "none" }}>
          <AnimatePresence mode="wait">
            {rightTab === "activity" ? (
              <motion.div
                key="activity"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {lukaActivityLog.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="luka-workspace-activity-item"
                  >
                    <div className="luka-workspace-activity-icon-wrap">
                      {entry.status === "active" ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 size={12} style={{ color: "hsl(207 71% 38%)" }} />
                        </motion.div>
                      ) : entry.status === "flag" ? (
                        <AlertTriangle size={12} style={{ color: "hsl(30 90% 50%)" }} />
                      ) : (
                        <CheckCircle2 size={12} style={{ color: "hsl(145 63% 42%)" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-snug" style={{ color: "hsl(220 18% 28%)" }}>{entry.text}</p>
                      <p className="text-[10px]" style={{ color: "hsl(220 15% 55%)" }}>{entry.time}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="team"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {teamMessages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="luka-workspace-team-msg"
                  >
                    <div className="luka-workspace-team-avatar">
                      <span className="text-[9px] font-bold text-white">{msg.initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold" style={{ color: "hsl(220 20% 18%)" }}>{msg.user}</span>
                        <span className="text-[10px]" style={{ color: "hsl(220 15% 55%)" }}>{msg.time}</span>
                      </div>
                      <p className="text-xs" style={{ color: "hsl(220 15% 45%)" }}>{msg.message}</p>
                    </div>
                  </motion.div>
                ))}

                {/* Team chat input */}
                <div className="luka-workspace-team-input-wrap">
                  <div className="flex items-center gap-1.5">
                    <motion.button whileHover={{ scale: 1.1 }} className="luka-workspace-prompt-action">
                      <AtSign size={13} />
                    </motion.button>
                    <input
                      type="text"
                      placeholder="Message your team..."
                      className="luka-workspace-team-input"
                    />
                    <motion.button whileHover={{ scale: 1.1 }} className="luka-workspace-prompt-action">
                      <Send size={13} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
    </>
  );
};

export default WorkspaceView;
