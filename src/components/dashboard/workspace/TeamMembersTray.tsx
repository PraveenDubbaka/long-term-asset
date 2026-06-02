import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronDown,
  UserPlus,
  UserMinus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Crown,
  ShieldCheck,
  PencilLine,
  ListChecks,
} from "lucide-react";

export type TeamRole = "Partner" | "Reviewer" | "Preparer";

export interface AssignedTask {
  id: string;
  title: string;
  module: string;
  status: "in_progress" | "pending" | "done" | "flag";
  due?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: TeamRole;
  color: string;
  online: boolean;
  assigned: boolean;
  tasks: AssignedTask[];
}

const initialMembers: TeamMember[] = [
  {
    id: "u1",
    name: "Sarah Chen",
    initials: "SC",
    email: "sarah.chen@firm.io",
    role: "Partner",
    color: "hsl(207 71% 38%)",
    online: true,
    assigned: true,
    tasks: [
      { id: "t1", title: "Sign-off on planning memo", module: "Checklists", status: "pending", due: "Today" },
      { id: "t2", title: "Review final FS draft", module: "Financials", status: "in_progress", due: "Fri" },
      { id: "t3", title: "Approve risk assessment", module: "Checklists", status: "pending" },
    ],
  },
  {
    id: "u2",
    name: "James Wilson",
    initials: "JW",
    email: "j.wilson@firm.io",
    role: "Reviewer",
    color: "hsl(145 63% 42%)",
    online: true,
    assigned: true,
    tasks: [
      { id: "t4", title: "Review WP-200 Revenue testing", module: "Working Papers", status: "in_progress" },
      { id: "t5", title: "Validate bank reconciliation", module: "Trial Balance", status: "done" },
      { id: "t6", title: "Check AR aging", module: "Working Papers", status: "flag" },
      { id: "t7", title: "Variance commentary", module: "Financials", status: "pending" },
    ],
  },
  {
    id: "u3",
    name: "Maya Patel",
    initials: "MP",
    email: "maya.p@firm.io",
    role: "Preparer",
    color: "hsl(30 90% 50%)",
    online: true,
    assigned: true,
    tasks: [
      { id: "t8", title: "Prepare WP-100 Cash lead", module: "Working Papers", status: "done" },
      { id: "t9", title: "Reconcile Dec bank statements", module: "Trial Balance", status: "in_progress" },
      { id: "t10", title: "Draft notes to FS", module: "Financials", status: "pending" },
      { id: "t11", title: "Upload supporting docs", module: "Working Papers", status: "in_progress" },
      { id: "t12", title: "Tax payable schedule", module: "Working Papers", status: "pending" },
    ],
  },
  {
    id: "u4",
    name: "David Kim",
    initials: "DK",
    email: "david.kim@firm.io",
    role: "Reviewer",
    color: "hsl(260 70% 58%)",
    online: false,
    assigned: false,
    tasks: [],
  },
  {
    id: "u5",
    name: "Emma Rodriguez",
    initials: "ER",
    email: "emma.r@firm.io",
    role: "Preparer",
    color: "hsl(340 75% 55%)",
    online: false,
    assigned: false,
    tasks: [],
  },
  {
    id: "u6",
    name: "Liam O'Connor",
    initials: "LO",
    email: "liam.o@firm.io",
    role: "Preparer",
    color: "hsl(190 80% 45%)",
    online: false,
    assigned: false,
    tasks: [],
  },
];

const roleMeta: Record<TeamRole, { color: string; bg: string; icon: React.ReactNode }> = {
  Partner: {
    color: "hsl(260 70% 58%)",
    bg: "hsl(260 70% 58% / 0.1)",
    icon: <Crown size={10} />,
  },
  Reviewer: {
    color: "hsl(207 71% 38%)",
    bg: "hsl(207 71% 38% / 0.1)",
    icon: <ShieldCheck size={10} />,
  },
  Preparer: {
    color: "hsl(145 63% 42%)",
    bg: "hsl(145 63% 42% / 0.1)",
    icon: <PencilLine size={10} />,
  },
};

const taskStatusIcon = (status: AssignedTask["status"]) => {
  if (status === "done") return <CheckCircle2 size={11} style={{ color: "hsl(145 63% 42%)" }} />;
  if (status === "flag") return <AlertTriangle size={11} style={{ color: "hsl(30 90% 50%)" }} />;
  if (status === "in_progress") return <Clock size={11} style={{ color: "hsl(207 71% 38%)" }} />;
  return <Clock size={11} style={{ color: "hsl(220 15% 55%)" }} />;
};

interface TeamMembersTrayProps {
  open: boolean;
  onClose: () => void;
  anchorRect?: DOMRect | null;
}

const POPOVER_WIDTH = 360;
const POPOVER_MAX_HEIGHT = 520;
const GAP = 10;

const TeamMembersTray = ({ open, onClose, anchorRect }: TeamMembersTrayProps) => {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [expanded, setExpanded] = useState<string | null>("u2");
  const [query, setQuery] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; placement: "bottom" | "top" }>({
    top: 0,
    left: 0,
    placement: "bottom",
  });

  // Close on outside click / Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popoverRef.current && !popoverRef.current.contains(t)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Position popover relative to anchor
  useLayoutEffect(() => {
    if (!open || !anchorRect) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const spaceBelow = vh - anchorRect.bottom - GAP;
    const placement: "bottom" | "top" =
      spaceBelow >= POPOVER_MAX_HEIGHT || spaceBelow >= vh - anchorRect.top - GAP ? "bottom" : "top";

    const top =
      placement === "bottom"
        ? Math.min(anchorRect.bottom + GAP, vh - POPOVER_MAX_HEIGHT - 8)
        : Math.max(8, anchorRect.top - GAP - POPOVER_MAX_HEIGHT);

    // Anchor horizontally to the click point (left edge of avatars), keep within viewport
    const idealLeft = anchorRect.left;
    const left = Math.min(Math.max(8, idealLeft), vw - POPOVER_WIDTH - 8);

    setPos({ top, left, placement });
  }, [open, anchorRect]);

  const toggleAssign = (id: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, assigned: !m.assigned } : m))
    );
  };

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.role.toLowerCase().includes(query.toLowerCase())
  );

  const assignedMembers = filtered.filter((m) => m.assigned);
  const availableMembers = filtered.filter((m) => !m.assigned);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: pos.placement === "bottom" ? -6 : 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: pos.placement === "bottom" ? -6 : 6, scale: 0.98 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="fixed z-[9999] flex flex-col"
          style={{
            top: pos.top,
            left: pos.left,
            width: POPOVER_WIDTH,
            maxHeight: POPOVER_MAX_HEIGHT,
            background: "hsl(0 0% 100% / 0.96)",
            backdropFilter: "blur(24px)",
            borderRadius: 16,
            border: "1px solid hsl(220 30% 92%)",
            boxShadow:
              "0 24px 50px -16px hsl(220 30% 12% / 0.22), 0 0 0 1px hsl(0 0% 100% / 0.7) inset",
            overflow: "hidden",
          }}
        >

            {/* Header */}
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{
                borderBottom: "1px solid hsl(220 30% 94%)",
                background:
                  "linear-gradient(135deg, hsl(207 71% 38% / 0.06), hsl(260 70% 58% / 0.05))",
              }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(207 71% 38%), hsl(260 70% 58%))",
                    }}
                  >
                    <ListChecks size={14} className="text-white" />
                  </div>
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "hsl(220 20% 18%)", fontFamily: "Rajdhani, sans-serif", letterSpacing: 0.4 }}
                  >
                    Team Members
                  </h3>
                </div>
                <p className="text-[11px] mt-1.5 ml-9" style={{ color: "hsl(220 15% 50%)" }}>
                  {assignedMembers.length} assigned · {availableMembers.length} available
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.08, rotate: 90 }}
                whileTap={{ scale: 0.92 }}
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "hsl(220 30% 96%)", color: "hsl(220 18% 35%)" }}
              >
                <X size={14} />
              </motion.button>
            </div>

            {/* Search */}
            <div className="px-5 pt-4 pb-2">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: "hsl(220 30% 96%)", border: "1px solid hsl(220 30% 92%)" }}
              >
                <Search size={13} style={{ color: "hsl(220 15% 50%)" }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or role..."
                  className="flex-1 bg-transparent border-0 outline-none text-xs"
                  style={{ color: "hsl(220 20% 20%)" }}
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-3 pb-4" style={{ scrollbarWidth: "thin" }}>
              {/* Assigned */}
              <div className="px-2 mt-2 mb-1.5 flex items-center justify-between">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "hsl(220 15% 50%)" }}
                >
                  Assigned ({assignedMembers.length})
                </span>
              </div>

              <div className="space-y-1.5">
                {assignedMembers.map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    expanded={expanded === m.id}
                    onToggleExpand={() => setExpanded(expanded === m.id ? null : m.id)}
                    onToggleAssign={() => toggleAssign(m.id)}
                  />
                ))}
                {assignedMembers.length === 0 && (
                  <div
                    className="text-[11px] px-3 py-4 text-center rounded-xl"
                    style={{
                      color: "hsl(220 15% 55%)",
                      background: "hsl(220 30% 97%)",
                      border: "1px dashed hsl(220 30% 88%)",
                    }}
                  >
                    No members assigned yet.
                  </div>
                )}
              </div>

              {/* Available */}
              {availableMembers.length > 0 && (
                <>
                  <div className="px-2 mt-5 mb-1.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: "hsl(220 15% 50%)" }}
                    >
                      Available ({availableMembers.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {availableMembers.map((m) => (
                      <MemberCard
                        key={m.id}
                        member={m}
                        expanded={false}
                        onToggleExpand={() => {}}
                        onToggleAssign={() => toggleAssign(m.id)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

interface MemberCardProps {
  member: TeamMember;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleAssign: () => void;
}

const MemberCard = ({ member, expanded, onToggleExpand, onToggleAssign }: MemberCardProps) => {
  const role = roleMeta[member.role];
  const canExpand = member.assigned && member.tasks.length > 0;

  return (
    <motion.div
      layout
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: expanded ? "hsl(0 0% 100%)" : "hsl(220 30% 98%)",
        border: `1px solid ${expanded ? "hsl(207 71% 38% / 0.25)" : "hsl(220 30% 92%)"}`,
        boxShadow: expanded ? "0 6px 18px -8px hsl(207 71% 38% / 0.18)" : "none",
      }}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: member.color }}
          >
            <span className="text-[11px] font-bold text-white">{member.initials}</span>
          </div>
          {member.online && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
              style={{ background: "hsl(145 70% 45%)", border: "2px solid hsl(0 0% 100%)" }}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-[13px] font-semibold truncate"
              style={{ color: "hsl(220 20% 18%)" }}
            >
              {member.name}
            </span>
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider shrink-0"
              style={{ color: role.color, background: role.bg }}
            >
              {role.icon}
              {member.role}
            </span>
          </div>
          <span className="text-[10.5px] truncate block" style={{ color: "hsl(220 15% 55%)" }}>
            {member.email}
          </span>
        </div>

        {/* Tasks count */}
        {member.assigned && (
          <motion.button
            whileHover={{ scale: canExpand ? 1.04 : 1 }}
            whileTap={{ scale: canExpand ? 0.96 : 1 }}
            onClick={canExpand ? onToggleExpand : undefined}
            disabled={!canExpand}
            className="flex items-center gap-1 px-2 py-1 rounded-lg shrink-0"
            style={{
              background: expanded ? "hsl(207 71% 38% / 0.12)" : "hsl(220 30% 94%)",
              color: expanded ? "hsl(207 71% 28%)" : "hsl(220 18% 30%)",
              cursor: canExpand ? "pointer" : "default",
            }}
            title={canExpand ? "View assigned tasks" : "No tasks"}
          >
            <span
              className="text-[11px] font-bold"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
            >
              {member.tasks.length}
            </span>
            {canExpand && (
              <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={11} />
              </motion.span>
            )}
          </motion.button>
        )}

        {/* Assign / Unassign */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={onToggleAssign}
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: member.assigned ? "hsl(0 70% 55% / 0.1)" : "hsl(145 63% 42% / 0.12)",
            color: member.assigned ? "hsl(0 70% 50%)" : "hsl(145 63% 38%)",
          }}
          title={member.assigned ? "Unassign" : "Assign"}
        >
          {member.assigned ? <UserMinus size={13} /> : <UserPlus size={13} />}
        </motion.button>
      </div>

      {/* Expanded tasks */}
      <AnimatePresence initial={false}>
        {expanded && canExpand && (
          <motion.div
            key="tasks"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div
              className="px-3 pb-3 pt-1 space-y-1"
              style={{ borderTop: "1px dashed hsl(220 30% 92%)" }}
            >
              {member.tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg group"
                  style={{ background: "hsl(220 30% 97%)" }}
                >
                  <span className="shrink-0">{taskStatusIcon(task.status)}</span>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[12px] font-medium truncate"
                      style={{ color: "hsl(220 20% 22%)" }}
                    >
                      {task.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-[9.5px] uppercase tracking-wider font-semibold"
                        style={{ color: "hsl(207 71% 34%)" }}
                      >
                        {task.module}
                      </span>
                      {task.due && (
                        <span className="text-[9.5px]" style={{ color: "hsl(220 15% 55%)" }}>
                          · Due {task.due}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TeamMembersTray;
