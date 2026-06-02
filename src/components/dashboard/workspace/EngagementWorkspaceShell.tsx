import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Library, Settings, FileText, Inbox, ChevronsLeft, Lock, MoreVertical, Pin, PinOff, Trash2, AlertTriangle, UserPlus, X, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import quickbooksLogo from "@/assets/quickbooks-intuit-logo.png";
import xeroLogo from "@/assets/xero-logo.png";
import EngagementVerificationMessage from "./EngagementVerificationMessage";
import EngagementAutomationView from "./EngagementAutomationView";

export interface ShellEngagement {
  name: string;
  code: string;
  source?: "quickbooks" | "xero";
}

interface EngagementWorkspaceShellProps {
  engagement: ShellEngagement;
  onAddEngagement?: () => void;
  collapsed?: boolean;
  onCollapse?: () => void;
}

const EngagementWorkspaceShell = ({
  engagement,
  onAddEngagement,
  collapsed = false,
  onCollapse,
}: EngagementWorkspaceShellProps) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [phase, setPhase] = useState<"verification" | "automation">("verification");
  const [automationComplete, setAutomationComplete] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [selectedEngagementId, setSelectedEngagementId] = useState<"primary" | "wildcat">("primary");
  const [pinnedIds, setPinnedIds] = useState<Array<"primary" | "wildcat">>(() => {
    try {
      const raw = localStorage.getItem("luka_engagement_pinned");
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [deletedIds, setDeletedIds] = useState<Array<"primary" | "wildcat">>(() => {
    try {
      const raw = localStorage.getItem("luka_engagement_deleted");
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [openMenuId, setOpenMenuId] = useState<"primary" | "wildcat" | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<"primary" | "wildcat" | null>(null);

  useEffect(() => {
    localStorage.setItem("luka_engagement_pinned", JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  useEffect(() => {
    localStorage.setItem("luka_engagement_deleted", JSON.stringify(deletedIds));
  }, [deletedIds]);

  const togglePin = (id: "primary" | "wildcat") => {
    setPinnedIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };
  const deleteCard = (id: "primary" | "wildcat") => {
    setDeletedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setPinnedIds((prev) => prev.filter((p) => p !== id));
  };
  const confirmDelete = (id: "primary" | "wildcat") => {
    setPendingDeleteId(id);
    setOpenMenuId(null);
  };
  const executeDelete = () => {
    if (pendingDeleteId) {
      deleteCard(pendingDeleteId);
      setPendingDeleteId(null);
    }
  };

  const wildcatEngagement: ShellEngagement = {
    name: "Wild Cat Accounting",
    code: "COM-WIL-Dec312024",
  };
  const activeEngagement: ShellEngagement =
    selectedEngagementId === "wildcat" ? wildcatEngagement : engagement;
  const showWildcat = automationComplete || selectedEngagementId === "wildcat";

  const handleSelectEngagement = (id: "primary" | "wildcat") => {
    if (id === selectedEngagementId) return;
    setSelectedEngagementId(id);
    setPhase("verification");
    setAutomationComplete(false);
    setIsVerifying(true);
  };

  const teamMembers = [
    { id: "es", initials: "ES", name: "Elena Sokolova", email: "elena.sokolova@luka.co", role: "Partner", bg: "linear-gradient(135deg,#C792EA,#9B62C7)", roleBg: "hsl(265 60% 96%)", roleColor: "hsl(265 55% 40%)", roleBorder: "hsl(265 55% 85%)" },
    { id: "pr", initials: "PR", name: "Priya Raman", email: "priya.raman@luka.co", role: "Staff", bg: "linear-gradient(135deg,#F5907A,#E36A4E)", roleBg: "hsl(25 90% 96%)", roleColor: "hsl(20 75% 42%)", roleBorder: "hsl(25 75% 85%)" },
    { id: "mc", initials: "MC", name: "Marcus Chen", email: "marcus.chen@luka.co", role: "CMS", bg: "linear-gradient(135deg,#3FC9C2,#1FA8A0)", roleBg: "hsl(175 60% 94%)", roleColor: "hsl(178 60% 28%)", roleBorder: "hsl(175 50% 80%)" },
  ];

  type AssignmentRole = "Preparer" | "Reviewer";
  const [assignments, setAssignments] = useState<Record<string, AssignmentRole | null>>(() => {
    try {
      const raw = localStorage.getItem("luka_workspace_assignments");
      if (raw) return JSON.parse(raw);
    } catch {}
    return { es: null, pr: null, mc: null };
  });
  useEffect(() => {
    try { localStorage.setItem("luka_workspace_assignments", JSON.stringify(assignments)); } catch {}
  }, [assignments]);

  const assignMember = (memberId: string, role: AssignmentRole) => {
    setAssignments((prev) => {
      const next: Record<string, AssignmentRole | null> = { ...prev };
      // Only one of each role at a time — clear anyone else holding it
      Object.keys(next).forEach((k) => { if (next[k] === role) next[k] = null; });
      next[memberId] = role;
      return next;
    });
  };
  const unassignMember = (memberId: string) => {
    setAssignments((prev) => ({ ...prev, [memberId]: null }));
  };
  return (
    <div className="flex-1 flex bg-white overflow-hidden">
      {/* LHS Sidebar */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.aside
            key="workspace-sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="flex flex-col shrink-0 overflow-hidden"
            style={{
              background: "hsl(0 0% 100%)",
              borderRight: "1px solid hsl(220 20% 90%)",
            }}
          >
            {/* Search + Collapse */}
            <div className="px-3 pt-3 pb-2 flex items-center gap-2">
              <div
                className="relative flex-1 flex items-center rounded-[10px]"
                style={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 20% 90%)" }}
              >
                <Search size={14} className="absolute left-3 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full bg-transparent pl-9 pr-3 py-2 text-[13px] outline-none rounded-[10px]"
                  style={{ color: "hsl(222 30% 18%)" }}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.08, backgroundColor: "hsl(270 60% 55% / 0.08)" }}
                whileTap={{ scale: 0.92 }}
                onClick={onCollapse}
                className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center transition-colors"
                style={{
                  color: "hsl(var(--muted-foreground))",
                  background: "hsl(var(--muted) / 0.4)",
                  border: "1px solid hsl(var(--border) / 0.5)",
                }}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronsLeft size={15} />
              </motion.button>
            </div>

            {/* New Engagement */}
            <div className="px-3 pb-3">
              <button
                type="button"
                onClick={onAddEngagement}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-[10px] text-[13px] font-medium transition-colors hover:brightness-95"
                style={{
                  background: "#F0F2F4",
                  border: "1px solid hsl(220 20% 90%)",
                  color: "hsl(222 30% 18%)",
                }}
              >
                <Plus size={14} strokeWidth={2.2} />
                <span>New Engagement</span>
              </button>
            </div>

            {/* Recents header */}
            <div className="px-4 pt-2 pb-2 flex items-center gap-2">
              <Library size={14} className="text-foreground" />
              <span
                className="text-[12px] font-semibold"
                style={{ color: "hsl(222 30% 18%)" }}
              >
                Recents
              </span>
            </div>

            {/* Engagement cards */}
            <div className="px-3 flex-1 overflow-y-auto space-y-2">
              {(() => {
                const all = [
                  { id: "primary" as const, eng: engagement },
                  ...(showWildcat ? [{ id: "wildcat" as const, eng: wildcatEngagement }] : []),
                ].filter(({ id }) => !deletedIds.includes(id));
                const pinned = all.filter(({ id }) => pinnedIds.includes(id));
                const recents = all.filter(({ id }) => !pinnedIds.includes(id));
                const ordered = [...pinned, ...recents];
                return ordered.map(({ id, eng }) => {
                  const isSelected = selectedEngagementId === id;
                  const isActiveLoading = isSelected && isVerifying;
                  const isPinned = pinnedIds.includes(id);
                  const isMenuOpen = openMenuId === id;
                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 320, damping: 26 }}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectEngagement(id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelectEngagement(id);
                        }
                      }}
                      className="group relative w-full text-left rounded-[10px] px-3 py-2.5 flex items-start gap-2.5 transition-colors cursor-pointer pr-8"
                      style={{
                        background: isSelected ? "hsl(207 71% 92%)" : "hsl(0 0% 100%)",
                        border: `1px solid ${isSelected ? "hsl(207 60% 80%)" : "hsl(220 20% 90%)"}`,
                      }}
                    >
                      <motion.span
                        className="mt-1 w-2 h-2 rounded-full shrink-0"
                        animate={{
                          background: isActiveLoading ? "hsl(265 75% 60%)" : "hsl(30 95% 55%)",
                          scale: isActiveLoading ? [1, 1.45, 1] : 1,
                          boxShadow: isActiveLoading
                            ? [
                                "0 0 0px hsl(265 75% 60% / 0)",
                                "0 0 8px hsl(265 75% 60% / 0.7)",
                                "0 0 0px hsl(265 75% 60% / 0)",
                              ]
                            : "0 0 0px hsl(30 95% 55% / 0)",
                        }}
                        transition={{
                          duration: 1.6,
                          repeat: isActiveLoading ? Infinity : 0,
                          ease: "easeInOut",
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="text-[13px] font-bold truncate"
                            style={{ color: "hsl(222 35% 16%)" }}
                          >
                            {eng.name}
                          </div>
                          {isPinned && (
                            <Pin
                              size={11}
                              className="shrink-0"
                              style={{ color: "hsl(207 71% 38%)", fill: "hsl(207 71% 38%)" }}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div
                            className="text-[11px] truncate"
                            style={{ color: "hsl(222 15% 45%)", fontFamily: "'Share Tech Mono', monospace" }}
                          >
                            {eng.code}
                          </div>
                          {id === "primary" && (
                            <span
                              className="shrink-0 inline-flex items-center justify-center px-1.5 py-[1px] rounded-full text-[9px] font-bold tracking-wide"
                              style={{
                                background: "hsl(207 90% 85%)",
                                color: "hsl(215 80% 35%)",
                                fontFamily: "'Rajdhani', sans-serif",
                                letterSpacing: "0.06em",
                              }}
                              title="Review Finalized"
                            >
                              RF
                            </span>
                          )}
                        </div>
                      </div>

                      <DropdownMenu
                        open={isMenuOpen}
                        onOpenChange={(o) => setOpenMenuId(o ? id : null)}
                      >
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className={`absolute right-1.5 top-2 w-6 h-6 rounded-md flex items-center justify-center transition-opacity duration-150 hover:bg-[hsl(var(--primary)/0.12)] ${
                              isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100"
                            }`}
                            aria-label="Engagement actions"
                          >
                            <MoreVertical size={14} className="text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          side="right"
                          className="w-36"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem onClick={() => togglePin(id)}>
                            {isPinned ? (
                              <>
                                <PinOff size={14} className="mr-2" /> Unpin
                              </>
                            ) : (
                              <>
                                <Pin size={14} className="mr-2" /> Pin
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => confirmDelete(id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 size={14} className="mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  );
                });
              })()}
            </div>


            {/* Settings */}
            <div className="px-3 py-3" style={{ borderTop: "1px solid hsl(220 20% 90%)" }}>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-luka-settings"))}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-[10px] text-[13px] font-medium hover:bg-[hsl(220_20%_94%)] transition-colors"
                style={{ color: "hsl(222 30% 25%)" }}
              >
                <Settings size={14} />
                <span>Settings</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top breadcrumb row */}
        <div
          className="flex items-center gap-2 px-5 py-3"
          style={{ borderBottom: "1px solid hsl(220 20% 92%)" }}
        >
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px]"
            style={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 20% 90%)" }}
          >
            <FileText size={13} style={{ color: "hsl(222 30% 25%)" }} />
            <span
              className="text-[12px] font-semibold"
              style={{ color: "hsl(222 30% 18%)" }}
            >
              {activeEngagement.name}
            </span>
          </div>

          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px]"
            style={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 20% 90%)" }}
          >
            <Inbox size={13} style={{ color: "hsl(222 30% 25%)" }} />
            <span
              className="text-[12px] font-semibold"
              style={{
                color: "hsl(222 30% 18%)",
                fontFamily: "'Share Tech Mono', monospace",
              }}
            >
              {activeEngagement.code}
            </span>
          </div>

          {activeEngagement.source && (
            <img
              src={activeEngagement.source === "quickbooks" ? quickbooksLogo : xeroLogo}
              alt={activeEngagement.source}
              className="w-auto object-contain"
              style={{ height: 24 }}
            />
          )}

          <AnimatePresence>
            {phase === "automation" && !automationComplete && (
              <motion.div
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] text-[12px] font-semibold"
                style={{
                  background: "hsl(0 90% 97%)",
                  border: "1px solid hsl(0 80% 82%)",
                  color: "hsl(0 70% 45%)",
                }}
              >
                <Lock size={12} strokeWidth={2.4} />
                File Locked
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`${phase === "automation" && !automationComplete ? "" : "ml-auto"} flex items-center gap-2.5`}>
            {/* Team members */}
            <div className="relative">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setTeamOpen((v) => !v)}
                className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full transition-shadow"
                style={{
                  background: "hsl(0 0% 100%)",
                  border: `1px solid ${teamOpen ? "hsl(265 60% 55%)" : "hsl(220 20% 90%)"}`,
                  boxShadow: teamOpen ? "0 4px 14px -4px hsl(265 60% 55% / 0.25)" : "none",
                }}
                title="Engagement team"
              >
                <div className="flex -space-x-2">
                  {teamMembers.map((m, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: m.bg, border: "2px solid hsl(0 0% 100%)" }}
                    >
                      {m.initials}
                    </div>
                  ))}
                </div>
              </motion.button>

              <AnimatePresence>
                {teamOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setTeamOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 380, damping: 28 }}
                      className="absolute right-0 top-full mt-2 z-50 w-[340px] rounded-2xl overflow-hidden"
                      style={{
                        background: "hsl(0 0% 100%)",
                        border: "1px solid hsl(220 35% 78%)",
                        boxShadow: "0 20px 50px -12px hsl(222 40% 20% / 0.18), 0 4px 14px -4px hsl(222 40% 20% / 0.08)",
                      }}
                    >
                      <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid hsl(220 20% 92%)" }}>
                        <div
                          className="text-[11px] uppercase tracking-[0.14em] mb-0.5"
                          style={{ color: "hsl(222 15% 50%)", fontFamily: "'Rajdhani', sans-serif", fontWeight: 500 }}
                        >
                          Engagement Team
                        </div>
                        <div
                          className="text-[18px] font-bold"
                          style={{ color: "hsl(222 35% 14%)", fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.01em" }}
                        >
                          {activeEngagement.name}
                        </div>
                      </div>
                      <div className="px-5 py-3 space-y-2">
                        {(() => {
                          const preparer = teamMembers.find((m) => assignments[m.id] === "Preparer");
                          const reviewer = teamMembers.find((m) => assignments[m.id] === "Reviewer");
                          return (
                            <div
                              className="grid grid-cols-2 gap-2 mb-2 p-2 rounded-xl"
                              style={{ background: "hsl(220 30% 97%)", border: "1px solid hsl(220 25% 92%)" }}
                            >
                              {[
                                { label: "Preparer", member: preparer, accent: "hsl(220 70% 50%)" },
                                { label: "Reviewer", member: reviewer, accent: "hsl(265 60% 55%)" },
                              ].map((slot) => (
                                <div key={slot.label} className="flex flex-col gap-1">
                                  <div
                                    className="text-[9px] uppercase tracking-[0.14em] font-semibold"
                                    style={{ color: slot.accent, fontFamily: "'Rajdhani', sans-serif" }}
                                  >
                                    {slot.label}
                                  </div>
                                  {slot.member ? (
                                    <div
                                      className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg"
                                      style={{ background: "hsl(0 0% 100%)", border: `1px solid ${slot.accent}40` }}
                                    >
                                      <div
                                        className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                                        style={{ background: slot.member.bg }}
                                      >
                                        {slot.member.initials}
                                      </div>
                                      <div className="text-[11px] font-semibold truncate flex-1" style={{ color: "hsl(222 35% 14%)" }}>
                                        {slot.member.name.split(" ")[0]}
                                      </div>
                                      <button
                                        onClick={() => unassignMember(slot.member!.id)}
                                        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[hsl(0_70%_95%)] transition-colors"
                                        title={`Unassign ${slot.label}`}
                                      >
                                        <X size={10} style={{ color: "hsl(0 65% 50%)" }} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div
                                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px]"
                                      style={{ background: "hsl(0 0% 100%)", border: "1px dashed hsl(220 20% 80%)", color: "hsl(222 15% 55%)" }}
                                    >
                                      <UserPlus size={11} />
                                      Unassigned
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })()}

                        {teamMembers.map((m) => {
                          const assigned = assignments[m.id];
                          return (
                            <div
                              key={m.id}
                              className="flex items-center gap-3 p-2 rounded-xl transition-colors"
                              style={{ background: assigned ? "hsl(220 30% 98%)" : "transparent", border: `1px solid ${assigned ? "hsl(220 25% 92%)" : "transparent"}` }}
                            >
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                                style={{ background: m.bg }}
                              >
                                {m.initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <div className="text-[13px] font-bold truncate" style={{ color: "hsl(222 35% 14%)", fontFamily: "'DM Sans', sans-serif" }}>
                                    {m.name}
                                  </div>
                                  <span
                                    className="px-1.5 py-px rounded-full text-[9px] font-semibold shrink-0"
                                    style={{ background: m.roleBg, color: m.roleColor, border: `1px solid ${m.roleBorder}` }}
                                  >
                                    {m.role}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  {(["Preparer", "Reviewer"] as AssignmentRole[]).map((role) => {
                                    const isActive = assigned === role;
                                    const accent = role === "Preparer" ? "hsl(220 70% 50%)" : "hsl(265 60% 55%)";
                                    return (
                                      <button
                                        key={role}
                                        onClick={() => (isActive ? unassignMember(m.id) : assignMember(m.id, role))}
                                        className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all"
                                        style={
                                          isActive
                                            ? { background: accent, color: "white", border: `1px solid ${accent}` }
                                            : { background: "hsl(0 0% 100%)", color: accent, border: `1px solid ${accent}55` }
                                        }
                                      >
                                        {isActive ? <Check size={9} /> : <UserPlus size={9} />}
                                        {isActive ? role : `Assign ${role}`}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Credit usage */}
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-full"
              style={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 20% 90%)" }}
              title="Credit usage"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <defs>
                  <linearGradient id="credit-link-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#9747FF" />
                    <stop offset="1" stopColor="#115697" />
                  </linearGradient>
                </defs>
                <path
                  d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 1 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 1 0 5.66 5.66l1-1"
                  stroke="url(#credit-link-grad)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="relative w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(220 20% 92%)" }}>
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: "20%",
                    background: "linear-gradient(90deg,#9747FF,#115697)",
                  }}
                />
              </div>
              <span
                className="text-[12px] font-bold tabular-nums"
                style={{ color: "hsl(222 35% 14%)", fontFamily: "'Share Tech Mono', monospace" }}
              >
                10<span style={{ color: "hsl(222 15% 55%)" }}>/50</span>
              </span>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden flex">
          <AnimatePresence mode="wait">
            {phase === "verification" ? (
              <motion.div
                key="verify"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex-1 overflow-y-auto"
              >
                <EngagementVerificationMessage
                  key={selectedEngagementId}
                  variant={selectedEngagementId === "wildcat" ? "upload" : "default"}
                  onLoadingChange={setIsVerifying}
                  onInitialize={() => {
                    setPhase("automation");
                    setAutomationComplete(false);
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex min-w-0"
              >
                <EngagementAutomationView
                  key={selectedEngagementId}
                  variant={selectedEngagementId === "wildcat" ? "upload" : "default"}
                  onRerun={() => setPhase("verification")}
                  onComplete={() => setAutomationComplete(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!pendingDeleteId} onOpenChange={(o) => !o && setPendingDeleteId(null)}>
        <AlertDialogContent className="rounded-[12px] border" style={{ borderColor: "hsl(220 20% 90%)", maxWidth: 400 }}>
          <AlertDialogHeader className="flex flex-col items-center text-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "hsl(0 84% 60% / 0.1)" }}
            >
              <AlertTriangle size={22} style={{ color: "hsl(0 84% 60%)" }} />
            </div>
            <div className="flex flex-col gap-1">
              <AlertDialogTitle className="text-[15px] font-semibold" style={{ color: "hsl(222 30% 18%)" }}>
                Delete engagement?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[13px] leading-relaxed" style={{ color: "hsl(222 15% 45%)" }}>
                This will remove the engagement from your recents. You can re-add it later from your engagements list.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-end gap-2 mt-2">
            <AlertDialogCancel
              onClick={() => setPendingDeleteId(null)}
              className="rounded-[10px] h-9 px-4 text-[13px] font-medium"
              style={{ borderColor: "hsl(220 20% 90%)" }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="rounded-[10px] h-9 px-4 text-[13px] font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EngagementWorkspaceShell;
