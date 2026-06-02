import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, LayoutGrid, List, FolderOpen, Wrench, Building2, ChevronLeft, ChevronRight, Sparkles, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import WorkspaceHistory from "./WorkspaceHistory";
import ActiveBoltsWidget from "./ActiveBoltsWidget";
import MyBoltsTray from "./MyBoltsTray";
import TeamMembersTray from "./TeamMembersTray";

type EngagementStatus = "In Progress" | "Needs Review" | "Complete" | "Setup";

interface TeamMember {
  initials: string;
  color: string;
}

interface WorkspaceEngagement {
  id: string;
  entityName: string;
  type: string;
  standard: string;
  yearEnd: string;
  engagementId: string;
  status: EngagementStatus;
  progress: number;
  team: TeamMember[];
  activeUser: TeamMember;
  lukaStatus?: string;
  icon: string;
  iconBg: string;
}

const engagements: WorkspaceEngagement[] = [
  {
    id: "1",
    entityName: "Patel & Shah CPA",
    type: "Compilation",
    standard: "CSRS 4200",
    yearEnd: "FY 2025",
    engagementId: "COM-PAT-Dec312024",
    status: "In Progress",
    progress: 68,
    team: [
      { initials: "AP", color: "hsl(210 45% 65%)" },
      { initials: "RS", color: "hsl(340 40% 65%)" },
      { initials: "L", color: "hsl(155 35% 58%)" },
    ],
    activeUser: { initials: "AP", color: "hsl(207 71% 38%)" },
    lukaStatus: "Generating financial statement notes",
    icon: "📊",
    iconBg: "hsl(207 71% 82%)",
  },
  {
    id: "2",
    entityName: "Grewal & Gupta CPA",
    type: "Review",
    standard: "CSRE 2400",
    yearEnd: "FY 2025",
    engagementId: "COM-SIN-Dec312024",
    status: "Needs Review",
    progress: 92,
    team: [
      { initials: "MK", color: "hsl(200 45% 58%)" },
      { initials: "JS", color: "hsl(25 50% 62%)" },
      { initials: "L", color: "hsl(195 40% 58%)" },
    ],
    activeUser: { initials: "MK", color: "hsl(340 75% 55%)" },
    lukaStatus: "Awaiting reviewer approval on 2 items",
    icon: "🔍",
    iconBg: "hsl(195 80% 95%)",
  },
  {
    id: "3",
    entityName: "Faber & Associates LLP",
    type: "Compilation + T2",
    standard: "",
    yearEnd: "FY 2025",
    engagementId: "COM-MAP-Dec312024",
    status: "Complete",
    progress: 100,
    team: [
      { initials: "AP", color: "hsl(155 35% 58%)" },
      { initials: "L", color: "hsl(210 45% 65%)" },
    ],
    activeUser: { initials: "L", color: "hsl(145 63% 42%)" },
    lukaStatus: "Engagement completed by 70%",
    icon: "🏠",
    iconBg: "hsl(30 90% 95%)",
  },
  {
    id: "4",
    entityName: "Durward Jones Barkwell LLP",
    type: "Compilation",
    standard: "CSRS 4200",
    yearEnd: "FY 2025",
    engagementId: "COM-NOR-Dec312024",
    status: "Setup",
    progress: 0,
    team: [
      { initials: "RS", color: "hsl(25 50% 62%)" },
    ],
    activeUser: { initials: "RS", color: "hsl(200 70% 50%)" },
    lukaStatus: "Engagement and document intake setup",
    icon: "📊",
    iconBg: "hsl(200 70% 96%)",
  },
  {
    id: "5",
    entityName: "Smythe LLP",
    type: "Review + T2",
    standard: "CSRE 2400",
    yearEnd: "FY 2025",
    engagementId: "COM-EVE-Dec312024",
    status: "In Progress",
    progress: 41,
    team: [
      { initials: "AP", color: "hsl(340 40% 65%)" },
      { initials: "RS", color: "hsl(200 45% 58%)" },
      { initials: "L", color: "hsl(155 35% 58%)" },
    ],
    activeUser: { initials: "RS", color: "hsl(25 85% 52%)" },
    lukaStatus: "Mapping accounts — 4 require attention",
    icon: "🔍",
    iconBg: "hsl(195 80% 95%)",
  },
  {
    id: "6",
    entityName: "Grant Thornton LLP",
    type: "Compilation",
    standard: "CSRS 4200",
    yearEnd: "FY 2025",
    engagementId: "COM-GRN-Dec312024",
    status: "Setup",
    progress: 0,
    team: [
      { initials: "JS", color: "hsl(195 40% 58%)" },
    ],
    activeUser: { initials: "JS", color: "hsl(340 75% 55%)" },
    lukaStatus: "Engagement and document intake setup",
    icon: "📊",
    iconBg: "hsl(30 90% 95%)",
  },
  {
    id: "7",
    entityName: "BDO Canada LLP",
    type: "Review",
    standard: "CSRE 2400",
    yearEnd: "FY 2024",
    engagementId: "COM-BDO-Dec312024",
    status: "In Progress",
    progress: 55,
    team: [
      { initials: "MK", color: "hsl(25 50% 62%)" },
      { initials: "AP", color: "hsl(200 45% 58%)" },
    ],
    activeUser: { initials: "AP", color: "hsl(145 63% 42%)" },
    lukaStatus: "Reconciling bank statements",
    icon: "🔍",
    iconBg: "hsl(195 80% 95%)",
  },
  {
    id: "8",
    entityName: "MNP LLP",
    type: "Compilation + T2",
    standard: "",
    yearEnd: "FY 2024",
    engagementId: "COM-MNP-Apr302024",
    status: "Complete",
    progress: 100,
    team: [
      { initials: "RS", color: "hsl(210 45% 65%)" },
      { initials: "L", color: "hsl(340 40% 65%)" },
    ],
    activeUser: { initials: "RS", color: "hsl(207 71% 38%)" },
    lukaStatus: "Engagement completed by 70%",
    icon: "📊",
    iconBg: "hsl(200 70% 96%)",
  },
  {
    id: "9",
    entityName: "Crowe Soberman LLP",
    type: "Review",
    standard: "CSRE 2400",
    yearEnd: "FY 2025",
    engagementId: "COM-CRW-Dec312024",
    status: "Needs Review",
    progress: 88,
    team: [
      { initials: "JS", color: "hsl(155 35% 58%)" },
      { initials: "MK", color: "hsl(210 45% 65%)" },
    ],
    activeUser: { initials: "JS", color: "hsl(200 70% 50%)" },
    lukaStatus: "Pending partner sign-off",
    icon: "🔍",
    iconBg: "hsl(195 80% 95%)",
  },
  {
    id: "10",
    entityName: "Baker Tilly WM LLP",
    type: "Compilation",
    standard: "CSRS 4200",
    yearEnd: "FY 2025",
    engagementId: "COM-BWR-Dec312024",
    status: "Setup",
    progress: 12,
    team: [
      { initials: "AP", color: "hsl(195 40% 58%)" },
    ],
    activeUser: { initials: "AP", color: "hsl(25 85% 52%)" },
    lukaStatus: "Engagement and document intake setup",
    icon: "📊",
    iconBg: "hsl(207 71% 82%)",
  },
];
const statusConfig: Record<EngagementStatus, { class: string; label: string; dot: string }> = {
  "In Progress": { class: "ws-status-magic", label: "Magic", dot: "hsl(270 65% 55%)" },
  "Needs Review": { class: "ws-status-review", label: "Needs Review", dot: "hsl(var(--status-new))" },
  "Complete": { class: "ws-status-complete", label: "Complete", dot: "hsl(var(--status-completed))" },
  "Setup": { class: "ws-status-new", label: "Setup", dot: "hsl(var(--status-new))" },
};

const progressColor = (progress: number) => {
  if (progress === 100) return "hsl(145 63% 75%)";
  if (progress >= 60) return "hsl(210 60% 75%)";
  if (progress > 0) return "hsl(220 20% 78%)";
  return "hsl(220 15% 88%)";
};

export interface MagicEngagementData {
  entityName: string;
  engagementId: string;
  type: string;
  standard: string;
  yearEnd: string;
  progress: number;
  lukaStatus?: string;
}

interface WorkspaceEngagementsProps {
  onStartAutomation: () => void;
  onMagicEngagementClick?: (data: MagicEngagementData) => void;
}

const ENGAGEMENTS_PER_PAGE = 5;

const WorkspaceEngagements = ({ onStartAutomation, onMagicEngagementClick }: WorkspaceEngagementsProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "list">("list");
  const [bgFaded, setBgFaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [boltsOpen, setBoltsOpen] = useState(false);
  const [teamTrayOpen, setTeamTrayOpen] = useState(false);
  const [teamAnchorRect, setTeamAnchorRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setBgFaded(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  const filtered = engagements.filter(
    (e) =>
      e.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.engagementId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ENGAGEMENTS_PER_PAGE);
  const paged = filtered.slice((currentPage - 1) * ENGAGEMENTS_PER_PAGE, currentPage * ENGAGEMENTS_PER_PAGE);

  return (
    <div className="relative flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      {/* Animated AI gradient background */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-0"
        initial={{ opacity: 1 }}
        animate={{ opacity: bgFaded ? 0 : 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 ws-ai-gradient" />
        <div className="absolute top-[-10%] left-[15%] w-[300px] h-[300px] rounded-full ws-ai-orb-1" />
        <div className="absolute bottom-[-10%] right-[10%] w-[250px] h-[250px] rounded-full ws-ai-orb-2" />
        <div className="absolute top-[30%] right-[25%] w-[180px] h-[180px] rounded-full ws-ai-orb-3" />
      </motion.div>

      <div className="relative z-10 p-6" style={{ fontSize: "16px" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "hsl(220 20% 16%)" }}>
            Workspaces
          </h2>
          <p className="mt-1" style={{ color: "hsl(220 15% 55%)", fontSize: "15px" }}>
            Manage engagement automations and collaborate with your team. Luka handles preparation — you decide.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setBoltsOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors h-[40px]"
            style={{
              color: "#006AAB",
              background: "#F2F9FF",
              border: "1.5px solid #006AAB",
            }}
          >
            <Wrench size={14} />
            <span>My Bolts</span>
            <span
              className="ml-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                background: "hsl(207 56% 32% / 0.1)",
                color: "#006AAB",
              }}
            >
              1
            </span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStartAutomation}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-shadow h-[40px]"
            style={{
              background: "linear-gradient(135deg, #9747FF, #115697)",
              boxShadow: "0 2px 12px hsla(250, 70%, 50%, 0.25)",
            }}
          >
            <FolderOpen size={14} />
            <span>+ New Workspace</span>
          </motion.button>
        </div>
      </div>

      {/* Search & View Toggle */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(220 15% 55%)" }} />
          <input
            type="text"
            placeholder="Search engagements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode("list")}
            className="ws-view-toggle"
            style={{
              background: viewMode === "list" ? "hsl(var(--primary) / 0.08)" : "transparent",
              color: viewMode === "list" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
            }}
          >
            <List size={16} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode("cards")}
            className="ws-view-toggle"
            style={{
              background: viewMode === "cards" ? "hsl(var(--primary) / 0.08)" : "transparent",
              color: viewMode === "cards" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
            }}
          >
            <LayoutGrid size={16} />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === "cards" ? (
          <motion.div
            key="cards"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3"
          >
            {paged.map((eng, i) => (
              <motion.div
                key={eng.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={eng.status !== "In Progress" ? { y: -3, boxShadow: "0 8px 30px hsl(220 30% 50% / 0.12)" } : { scale: 1.01 }}
                className="ws-card !p-4"
                onClick={eng.status === "In Progress" ? () => onMagicEngagementClick?.({
                  entityName: eng.entityName,
                  engagementId: eng.engagementId,
                  type: eng.type,
                  standard: eng.standard,
                  yearEnd: eng.yearEnd,
                  progress: eng.progress,
                  lukaStatus: eng.lukaStatus,
                }) : undefined}
                style={{
                  opacity: eng.status === "In Progress" ? 0.75 : 1,
                  cursor: eng.status === "In Progress" ? "pointer" : "default",
                }}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "hsl(220 20% 94%)" }}
                  >
                    <Building2 size={16} style={{ color: "hsl(220 15% 45%)" }} />
                  </div>
                  <span className={`ws-status-badge ${statusConfig[eng.status].class}`}>
                    <span className="w-2 h-2 rounded-full mr-1.5 inline-block flex-shrink-0 hidden" style={{ backgroundColor: statusConfig[eng.status].dot }} />
                    {statusConfig[eng.status].label}
                  </span>
                </div>

                {/* Entity Info */}
                <h3 className="text-[13px] font-bold mb-0.5" style={{ color: "hsl(220 20% 16%)" }}>
                  {eng.entityName}
                </h3>
                <p className="text-[10px] mb-1" style={{ color: "hsl(220 15% 55%)" }}>
                  {eng.type}{eng.standard ? ` · ${eng.standard}` : ""} · {eng.yearEnd}
                </p>
                <div className="flex items-center gap-1.5 mb-3">
                  <p className="text-[10px] font-medium" style={{ color: eng.status === "In Progress" ? "hsl(220 15% 55%)" : "hsl(var(--link-color))" }}>
                    {eng.engagementId}
                  </p>
                  {eng.status === "In Progress" && (
                    <Lock size={10} style={{ color: "hsl(30 90% 50%)" }} />
                  )}
                </div>

                {/* Team & Progress */}
                <div className="flex items-center justify-between mb-2">
                <div
                  className="flex items-center -space-x-1.5 cursor-pointer rounded-full px-1 py-0.5 hover:bg-[hsl(220_30%_94%)] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTeamAnchorRect(e.currentTarget.getBoundingClientRect());
                    setTeamTrayOpen(true);
                  }}
                  title="View team members"
                >
                  {eng.team.map((member, j) => (
                    <div
                      key={j}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 transition-transform hover:scale-110"
                      style={{
                        background: member.color,
                        borderColor: "hsl(0 0% 100%)",
                      }}
                    >
                      {member.initials}
                    </div>
                  ))}
                </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(220 20% 92%)" }}>
                      <div
                        className={`h-full rounded-full transition-all ${eng.status === "In Progress" ? "ws-magic-progress" : ""}`}
                        style={{
                          width: `${eng.progress}%`,
                          background: eng.status === "In Progress"
                            ? "linear-gradient(90deg, #9747FF, #115697, #9747FF)"
                            : progressColor(eng.progress),
                          backgroundSize: eng.status === "In Progress" ? "200% 100%" : undefined,
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold" style={{ color: "hsl(220 15% 45%)" }}>
                      {eng.progress}%
                    </span>
                  </div>
                </div>

                {/* Luka Status */}
                {eng.lukaStatus && (
                  <div className="ws-luka-status">
                    <span className="ws-luka-dot" />
                    <span>Luka: {eng.lukaStatus}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="ws-list-table"
          >
            {/* List Header */}
            <div className="ws-list-header">
              <span className="flex-[2]">Entity</span>
              <span className="flex-[2]">Engagement ID</span>
              <span className="flex-1">Team</span>
              <span className="flex-[0.8] text-center">Currently Active</span>
              <span className="flex-1">Progress</span>
              <span className="flex-[2]">Recent Activity</span>
              <span className="flex-1 text-center">Status</span>
            </div>
            {paged.map((eng, i) => (
              <motion.div
                key={eng.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="ws-list-row"
                onClick={eng.status === "In Progress" ? () => onMagicEngagementClick?.({
                  entityName: eng.entityName,
                  engagementId: eng.engagementId,
                  type: eng.type,
                  standard: eng.standard,
                  yearEnd: eng.yearEnd,
                  progress: eng.progress,
                  lukaStatus: eng.lukaStatus,
                }) : undefined}
                style={{
                  opacity: eng.status === "In Progress" ? 0.75 : 1,
                  cursor: eng.status === "In Progress" ? "pointer" : "default",
                }}
              >
                <div className="flex-[2] flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: eng.status === "In Progress" ? "hsl(220 20% 94% / 0.6)" : "hsl(220 20% 94%)" }}
                  >
                    <Building2 size={16} style={{ color: "hsl(220 15% 45%)" }} />
                  </div>
                  {eng.status === "In Progress" ? (
                    <span
                      className="text-[16px] font-semibold"
                      style={{ color: "hsl(220 15% 55%)" }}
                    >
                      {eng.entityName}
                    </span>
                  ) : (
                    <motion.a
                      href="#"
                      className="text-[16px] font-semibold"
                      style={{ color: "#006AAB" }}
                      whileHover={{ x: 2 }}
                    >
                      {eng.entityName}
                    </motion.a>
                  )}
                </div>
                <div className="flex-[2] flex items-center gap-1.5">
                  <span className="text-[16px] font-medium" style={{ color: eng.status === "In Progress" ? "hsl(220 15% 55%)" : "hsl(220 20% 16%)" }}>
                    {eng.engagementId}
                  </span>
                  {eng.status === "In Progress" && (
                    <Lock size={12} style={{ color: "hsl(30 90% 50%)" }} />
                  )}
                </div>
                <div className="flex-1">
                  <div
                    className="flex items-center -space-x-1.5 cursor-pointer rounded-full px-1 py-0.5 hover:bg-[hsl(220_30%_94%)] transition-colors w-fit"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTeamAnchorRect(e.currentTarget.getBoundingClientRect());
                      setTeamTrayOpen(true);
                    }}
                    title="View team members"
                  >
                    {eng.team.map((member, j) => (
                      <div
                        key={j}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 transition-transform hover:scale-110"
                        style={{
                          background: member.color,
                          borderColor: "hsl(0 0% 100%)",
                        }}
                      >
                        {member.initials}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-[0.8] flex justify-center">
                  {eng.status === "In Progress" ? (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center ws-ai-breathing"
                      style={{ background: "linear-gradient(135deg, #9747FF, #115697)" }}
                    >
                      <Sparkles size={14} className="text-white" />
                    </div>
                  ) : (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: eng.activeUser.color }}
                    >
                      {eng.activeUser.initials}
                    </div>
                  )}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(220 20% 92%)" }}>
                    <div
                      className={`h-full rounded-full transition-all ${eng.status === "In Progress" ? "ws-magic-progress" : ""}`}
                      style={{
                        width: `${eng.progress}%`,
                        background: eng.status === "In Progress"
                          ? "linear-gradient(90deg, #9747FF, #115697, #9747FF)"
                          : progressColor(eng.progress),
                        backgroundSize: eng.status === "In Progress" ? "200% 100%" : undefined,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: "hsl(220 15% 45%)" }}>
                    {eng.progress}%
                  </span>
                </div>
                <div className="flex-[2]">
                  {eng.lukaStatus ? (
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: eng.status === "In Progress" ? "hsl(270 65% 50%)" : eng.status === "Needs Review" ? "hsl(30 90% 45%)" : eng.status === "Setup" ? "hsl(var(--status-progress))" : "hsl(145 63% 42%)" }} />
                      <span className="text-[16px]" style={{ color: "hsl(220 15% 50%)" }}>
                        {eng.lukaStatus}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs" style={{ color: "hsl(220 15% 70%)" }}>—</span>
                  )}
                </div>
                <div className="flex-1 flex justify-center">
                  <span className={`ws-status-badge ${statusConfig[eng.status].class}`}>
                    <span className="w-2 h-2 rounded-full mr-1.5 inline-block flex-shrink-0 hidden" style={{ backgroundColor: statusConfig[eng.status].dot }} />
                    {statusConfig[eng.status].label}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-[11px]" style={{ color: "hsl(220 15% 55%)" }}>
            Showing {(currentPage - 1) * ENGAGEMENTS_PER_PAGE + 1}–{Math.min(currentPage * ENGAGEMENTS_PER_PAGE, filtered.length)} of {filtered.length}
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
                className="w-7 h-7 rounded-md text-[11px] font-semibold transition-colors"
                style={{
                  background: currentPage === i + 1 ? "hsl(var(--primary))" : "transparent",
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

      {/* History + Active Bolts side by side */}
      <div className="flex gap-6 items-start">
        <div className="w-[60%] shrink-0">
          <WorkspaceHistory />
        </div>
        <div className="flex-1 min-w-0">
          <ActiveBoltsWidget />
        </div>
      </div>
      </div>
      <MyBoltsTray open={boltsOpen} onClose={() => setBoltsOpen(false)} />
      <TeamMembersTray
        open={teamTrayOpen}
        onClose={() => setTeamTrayOpen(false)}
        anchorRect={teamAnchorRect}
      />
    </div>
  );
};

export default WorkspaceEngagements;
