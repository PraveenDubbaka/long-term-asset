import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useComments } from "./CommentContext";
import CommentPrompter from "./CommentPrompter";
import CommentReactions from "./CommentReactions";
import type { Comment, CommentFilter, AuditLogEntry, CommentUser } from "./types";
import {
  X, Search, MessageSquare, ChevronDown, ChevronRight,
  Check, RotateCcw, Lock, Pencil, MoreHorizontal, Trash2,
  Clock, FileText, History, ArrowLeft, Plus, Send, RefreshCw, Ban, Paperclip, Play, Pause,
  Users, Circle
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const formatTime = (d: Date) => {
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

const statusColor = (status: string) => {
  if (status === "published") return "hsl(207 71% 38%)";
  if (status === "resolved") return "hsl(220 15% 70%)";
  if (status === "draft") return "hsl(40 80% 50%)";
  if (status === "locked") return "hsl(220 15% 55%)";
  return "hsl(220 15% 50%)";
};

const statusLabel = (status: string) => {
  if (status === "published") return "Open";
  if (status === "resolved") return "Resolved";
  if (status === "draft") return "Draft";
  if (status === "locked") return "Locked";
  return status;
};

// Filters intentionally removed for simplicity

const roleBadgeStyles: Record<string, { bg: string; color: string; label: string }> = {
  preparer: { bg: "hsl(210 80% 94%)", color: "hsl(210 80% 40%)", label: "Preparer" },
  reviewer: { bg: "hsl(270 60% 94%)", color: "hsl(270 60% 40%)", label: "Reviewer" },
  manager: { bg: "hsl(30 80% 93%)", color: "hsl(30 70% 35%)", label: "Manager" },
  read_only: { bg: "hsl(220 15% 94%)", color: "hsl(220 15% 45%)", label: "Read Only" },
  external: { bg: "hsl(350 60% 94%)", color: "hsl(350 60% 40%)", label: "External" },
};

const RoleBadge = ({ role }: { role: string }) => {
  const style = roleBadgeStyles[role];
  if (!style) return null;
  return (
    <span
      className="px-1.5 py-[1px] rounded text-[9px] font-semibold uppercase tracking-wider"
      style={{ background: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  );
};

const CommentsPanel = () => {
  const {
    panelOpen, setPanelOpen, filteredComments, members,
    searchQuery, setSearchQuery,
    unresolvedCount, resolveComment, reopenComment, deleteComment, publishComment,
    addReply, scrollToRow, currentUser, editComment, currentScreen, typingUsers,
    getAuditLog, setCommentMode, toggleReaction, setOpenCommentId,
  } = useComments();

  const [expandedThread, setExpandedThread] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [overflowOpen, setOverflowOpen] = useState<string | null>(null);
  const [auditViewId, setAuditViewId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"comments" | "team">("comments");
  const [activeDmUserId, setActiveDmUserId] = useState<string | null>(null);
  const [dmThreads, setDmThreads] = useState<Record<string, Array<{ id: string; from: string; body: string; at: Date }>>>({});

  if (!panelOpen) return null;

  const renderLocationRow = (c: Comment) => {
    // Build a compact, single-line location string with the most specific anchor first.
    // Falls back gracefully so every card has the same vertical footprint.
    const lineItem = c.anchor.lineItem;
    const section = c.anchor.section;
    const screen = c.anchor.screen;
    return (
      <button
        className="w-full mt-1 flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer group"
        style={{
          background: "hsl(220 15% 96%)",
          border: "1px solid hsl(220 15% 92%)",
        }}
        onClick={(e) => { e.stopPropagation(); scrollToRow(c.id); }}
        title={[screen, section, lineItem].filter(Boolean).join(" › ")}
      >
        <span
          className="flex items-center justify-center flex-shrink-0 rounded"
          style={{ width: 14, height: 14, background: "hsl(270 60% 55% / 0.12)", color: "hsl(270 60% 50%)" }}
        >
          <ChevronRight size={9} strokeWidth={2.5} />
        </span>
        <span className="flex-1 min-w-0 flex items-center gap-1 text-[10.5px] font-medium leading-none">
          {lineItem ? (
            <>
              <span className="truncate" style={{ color: "hsl(220 20% 25%)" }}>
                {highlightSearchMatch(lineItem, searchQuery, `loc-l-${c.id}-`)}
              </span>
              <span className="flex-shrink-0" style={{ color: "hsl(220 15% 70%)" }}>·</span>
              <span className="flex-shrink-0 truncate" style={{ color: "hsl(220 15% 55%)", maxWidth: 110 }}>
                {section || screen}
              </span>
            </>
          ) : section ? (
            <>
              <span className="truncate" style={{ color: "hsl(220 20% 25%)" }}>
                {highlightSearchMatch(section, searchQuery, `loc-s-${c.id}-`)}
              </span>
              <span className="flex-shrink-0" style={{ color: "hsl(220 15% 70%)" }}>·</span>
              <span className="flex-shrink-0 truncate" style={{ color: "hsl(220 15% 55%)" }}>{screen}</span>
            </>
          ) : (
            <span className="truncate" style={{ color: "hsl(220 20% 25%)" }}>{screen}</span>
          )}
        </span>
        <span
          className="text-[9px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          style={{ color: "hsl(270 60% 50%)" }}
        >
          Jump →
        </span>
      </button>
    );
  };

  const renderCommentCard = (c: Comment) => {
    const isExpanded = expandedThread === c.id;
    const isDraft = c.status === "draft";
    const isLocked = c.status === "locked";
    const isResolved = c.status === "resolved";
    const isOwnComment = c.author.id === currentUser.id;
    const canEdit = isOwnComment && !isLocked && (Date.now() - c.createdAt.getTime()) < 600000;

    return (
      <motion.div
        key={c.id}
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border overflow-hidden cursor-pointer"
        style={{
          borderColor: isDraft ? "hsl(40 80% 75%)" : isResolved ? "hsl(220 15% 90%)" : "hsl(220 15% 88%)",
          borderStyle: isDraft ? "dashed" : "solid",
          background: isResolved ? "hsl(220 15% 98%)" : "hsl(0 0% 100%)",
          opacity: isResolved ? 0.8 : 1,
        }}
        onClick={() => { scrollToRow(c.id); setOpenCommentId(c.id); }}
        whileHover={{ borderColor: "hsl(207 71% 38% / 0.4)", boxShadow: "0 2px 8px hsl(207 71% 38% / 0.08)" }}
      >
        {/* Header */}
        <div className="px-3 py-2 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
              style={{ background: c.author.avatarColor }}
            >
              {c.author.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[13px] font-semibold truncate" style={{ color: "hsl(220 20% 15%)" }}>{c.author.name}</span>
                <RoleBadge role={c.author.role} />
                <span className="text-[11px]" style={{ color: "hsl(220 15% 55%)" }}>{formatTime(c.createdAt)}</span>
                {c.editedAt && <span className="text-[9px] italic" style={{ color: "hsl(220 15% 60%)" }}>edited</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Status badge */}
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
              style={{ color: statusColor(c.status), background: `${statusColor(c.status)}15`, border: `1px solid ${statusColor(c.status)}30` }}
            >
              {statusLabel(c.status)}
            </span>
            {isLocked && <Lock size={11} style={{ color: "hsl(220 15% 55%)" }} />}
            {isDraft && isOwnComment && (
              <span className="text-[9px] font-medium" style={{ color: "hsl(40 80% 40%)" }}>Only you</span>
            )}
            {/* Pin number */}
            <span className="text-[10px] font-bold" style={{ color: statusColor(c.status) }}>#{c.pinNumber}</span>
            {/* Overflow menu */}
            {!isLocked && (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setOverflowOpen(overflowOpen === c.id ? null : c.id)}
                  className="w-6 h-6 flex items-center justify-center rounded cursor-pointer"
                  style={{ color: "hsl(220 15% 55%)" }}
                >
                  <MoreHorizontal size={14} />
                </motion.button>
                <AnimatePresence>
                  {overflowOpen === c.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute right-0 top-full mt-1 z-50 rounded-lg overflow-hidden p-1 min-w-[140px]"
                      style={{
                        background: "hsl(0 0% 100%)",
                        border: "1px solid hsl(220 15% 88%)",
                        boxShadow: "0 8px 24px hsl(220 20% 10% / 0.12)",
                      }}
                    >
                      {!isResolved && (
                        <button
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded cursor-pointer hover:bg-[hsl(220_15%_96%)]"
                          style={{ color: "hsl(220 20% 15%)" }}
                          onClick={() => { resolveComment(c.id); setOverflowOpen(null); }}
                        >
                          <Check size={12} /> Resolve
                        </button>
                      )}
                      {isResolved && (
                        <button
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded cursor-pointer hover:bg-[hsl(220_15%_96%)]"
                          style={{ color: "hsl(220 20% 15%)" }}
                          onClick={() => { reopenComment(c.id); setOverflowOpen(null); }}
                        >
                          <RotateCcw size={12} /> Reopen
                        </button>
                      )}
                      {isDraft && isOwnComment && (
                        <button
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded cursor-pointer hover:bg-[hsl(220_15%_96%)]"
                          style={{ color: "hsl(220 20% 15%)" }}
                          onClick={() => { publishComment(c.id); setOverflowOpen(null); }}
                        >
                          <MessageSquare size={12} /> Publish
                        </button>
                      )}
                      {canEdit && (
                        <button
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded cursor-pointer hover:bg-[hsl(220_15%_96%)]"
                          style={{ color: "hsl(220 20% 15%)" }}
                          onClick={() => { setEditingId(c.id); setEditBody(c.body); setOverflowOpen(null); }}
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      )}
                      {isDraft && isOwnComment && (
                        <button
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded cursor-pointer hover:bg-[hsl(0_72%_51%_/_0.06)]"
                          style={{ color: "hsl(0 72% 51%)" }}
                          onClick={() => { deleteComment(c.id); setOverflowOpen(null); }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      )}
                      <div className="h-px my-0.5" style={{ background: "hsl(220 15% 92%)" }} />
                      <button
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded cursor-pointer hover:bg-[hsl(220_15%_96%)]"
                        style={{ color: "hsl(220 15% 45%)" }}
                        onClick={() => { setAuditViewId(c.id); setOverflowOpen(null); }}
                      >
                        <History size={12} /> View History
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Location row — uniform across all cards */}
        <div className="px-3 pb-1.5">
          {renderLocationRow(c)}
        </div>

        {/* Body */}
        <div className="px-3 pb-2">
          {editingId === c.id ? (
            <div className="flex flex-col gap-1.5">
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="w-full text-sm border rounded-md px-2 py-1.5 outline-none resize-none"
                style={{ borderColor: "hsl(215 55% 65%)", minHeight: 48 }}
                rows={2}
              />
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => setEditingId(null)}
                  className="text-[11px] px-2 py-1 rounded cursor-pointer"
                  style={{ color: "hsl(220 15% 50%)" }}
                >Cancel</button>
                <button
                  onClick={() => { editComment(c.id, editBody); setEditingId(null); }}
                  className="text-[11px] px-2 py-1 rounded font-semibold cursor-pointer"
                  style={{ background: "hsl(215 55% 50%)", color: "white" }}
                >Save</button>
              </div>
            </div>
          ) : (
            <p className="text-[14px] leading-relaxed" style={{ color: "hsl(220 20% 25%)" }}>
              {renderBodyWithMentions(c.body, searchQuery)}
            </p>
          )}
          {/* Attachments */}
          {c.attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {c.attachments.map(a => (
                <div
                  key={a.id}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium cursor-pointer"
                  style={{ background: "hsl(220 15% 96%)", color: "hsl(220 15% 40%)", border: "1px solid hsl(220 15% 90%)" }}
                >
                  <FileText size={10} />
                  <span className="truncate max-w-[100px]">{a.name}</span>
                  <span style={{ color: "hsl(220 15% 60%)" }}>{(a.size / 1024).toFixed(0)}KB</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Replies */}
        {c.replies.length > 0 && (
          <div className="border-t" style={{ borderColor: "hsl(220 15% 93%)" }}>
            <button
              className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium cursor-pointer"
              style={{ color: "hsl(215 55% 50%)" }}
              onClick={() => setExpandedThread(isExpanded ? null : c.id)}
            >
              <ChevronDown size={10} style={{ transform: isExpanded ? "rotate(0)" : "rotate(-90deg)", transition: "0.15s" }} />
              {c.replies.length} {c.replies.length === 1 ? "reply" : "replies"}
            </button>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {c.replies.slice(0, 3).map(r => (
                    <div key={r.id} className="px-3 py-2 ml-4 border-l-2" style={{ borderColor: "hsl(220 15% 90%)" }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                          style={{ background: r.author.avatarColor }}
                        >
                          {r.author.initials}
                        </div>
                        <span className="text-[13px] font-semibold" style={{ color: "hsl(220 20% 15%)" }}>{r.author.name}</span>
                        <RoleBadge role={r.author.role} />
                        <span className="text-[10px]" style={{ color: "hsl(220 15% 55%)" }}>{formatTime(r.createdAt)}</span>
                      </div>
                      <p className="text-[13px] leading-relaxed ml-6" style={{ color: "hsl(220 20% 30%)" }}>
                        {renderBodyWithMentions(r.body, searchQuery)}
                      </p>
                    </div>
                  ))}
                  {c.replies.length > 3 && !isExpanded && (
                    <button className="px-3 py-1 text-[10px] font-medium" style={{ color: "hsl(215 55% 50%)" }}>
                      View {c.replies.length - 3} more replies
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Reactions + Reply input */}
        {!isLocked && (
          <div className="px-3 py-2 border-t flex flex-col gap-2" style={{ borderColor: "hsl(220 15% 93%)" }}>
            <div onClick={(e) => e.stopPropagation()}>
              <CommentReactions
                reactions={c.reactions}
                currentUserId={currentUser.id}
                onToggle={(emoji) => toggleReaction(c.id, emoji)}
              />
            </div>
            {replyingTo === c.id ? (
              <div onClick={(e) => e.stopPropagation()}>
                <CommentPrompter
                  compact
                  placeholder="Write a reply…"
                  onSubmit={(body, mentions, attachments, voiceNote) => {
                    addReply(c.id, body, mentions, attachments, voiceNote);
                    setReplyingTo(null);
                  }}
                  onCancel={() => setReplyingTo(null)}
                />
              </div>
            ) : (
              <button
                className="w-full text-left px-3 py-1.5 rounded-full text-[12px] font-medium cursor-pointer"
                style={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 15% 88%)", color: "hsl(220 15% 50%)" }}
                onClick={(e) => { e.stopPropagation(); setReplyingTo(c.id); setExpandedThread(c.id); }}
              >
                Reply…
              </button>
            )}
          </div>
        )}

        {/* Resolved info */}
        {isResolved && c.resolvedBy && (
          <div className="px-3 py-1.5 flex items-center gap-1.5 border-t" style={{ borderColor: "hsl(220 15% 93%)", background: "hsl(145 40% 97%)" }}>
            <Check size={10} style={{ color: "hsl(145 60% 40%)" }} />
            <span className="text-[10px]" style={{ color: "hsl(145 60% 35%)" }}>
              Resolved by {c.resolvedBy.name} · {formatTime(c.resolvedAt!)}
            </span>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {panelOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 340, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="h-full border-l flex flex-col overflow-hidden flex-shrink-0"
          style={{
            borderColor: "hsl(220 15% 88%)",
            background: "hsl(220 15% 98%)",
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "hsl(220 15% 90%)" }}>
            <div className="flex items-center gap-2">
              {activeTab === "comments" ? (
                <MessageSquare size={16} style={{ color: "hsl(270 60% 55%)" }} />
              ) : (
                <Users size={16} style={{ color: "hsl(270 60% 55%)" }} />
              )}
              <span className="text-[14px] font-semibold" style={{ color: "hsl(220 20% 15%)" }}>
                {activeTab === "comments" ? "Comments" : activeDmUserId ? (members.find(m => m.id === activeDmUserId)?.name || "Direct Message") : "Team"}
              </span>
              {activeTab === "comments" && unresolvedCount > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: "hsl(207 71% 38%)", color: "white", minWidth: 18, textAlign: "center" }}
                >
                  {unresolvedCount}
                </span>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => { setPanelOpen(false); setCommentMode(false); setActiveDmUserId(null); }}
              className="w-7 h-7 flex items-center justify-center rounded-md cursor-pointer"
              style={{ color: "hsl(220 15% 50%)" }}
            >
              <X size={16} />
            </motion.button>
          </div>

          {/* Tabs */}
          <div className="px-3 pt-2 flex items-center gap-1 border-b" style={{ borderColor: "hsl(220 15% 93%)" }}>
            {([
              { id: "comments", label: "Comments", icon: MessageSquare, count: unresolvedCount },
              { id: "team", label: "Team", icon: Users, count: members.length },
            ] as const).map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); if (tab.id === "comments") setActiveDmUserId(null); }}
                  className="relative flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold cursor-pointer"
                  style={{ color: isActive ? "hsl(270 60% 50%)" : "hsl(220 15% 50%)" }}
                >
                  <Icon size={12} />
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className="px-1.5 rounded-full text-[9px] font-bold"
                      style={{
                        background: isActive ? "hsl(270 60% 55%)" : "hsl(220 15% 88%)",
                        color: isActive ? "white" : "hsl(220 15% 45%)",
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="comments-tab-underline"
                      className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full"
                      style={{ background: "hsl(270 60% 55%)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {activeTab === "comments" && (
            <>
              {/* Search */}
              <div className="px-3 py-2 border-b" style={{ borderColor: "hsl(220 15% 93%)" }}>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: "hsl(0 0% 100%)", border: `1px solid ${searchQuery ? "hsl(215 55% 65%)" : "hsl(220 15% 88%)"}` }}>
                  <Search size={13} style={{ color: searchQuery ? "hsl(215 55% 50%)" : "hsl(220 15% 55%)" }} />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search comments…"
                    className="flex-1 text-[13px] border-none outline-none bg-transparent"
                    style={{ color: "hsl(220 20% 15%)" }}
                  />
                  {searchQuery && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSearchQuery("")}
                      className="w-4 h-4 flex items-center justify-center rounded-full cursor-pointer"
                      style={{ background: "hsl(220 15% 85%)", color: "hsl(220 15% 40%)" }}
                    >
                      <X size={8} />
                    </motion.button>
                  )}
                </div>
                {searchQuery && (
                  <span className="text-[10px] mt-1 block" style={{ color: "hsl(220 15% 55%)" }}>
                    {filteredComments.length} result{filteredComments.length !== 1 ? "s" : ""} for "<span className="font-semibold" style={{ color: "hsl(220 20% 25%)" }}>{searchQuery}</span>"
                  </span>
                )}
              </div>

              {/* Screen label */}
              <div className="px-3 py-1.5 flex items-center justify-between" style={{ background: "hsl(220 15% 96%)" }}>
                <span className="text-[10px] font-semibold" style={{ color: "hsl(220 15% 45%)" }}>
                  📍 {currentScreen} · {filteredComments.length} {filteredComments.length === 1 ? "comment" : "comments"}
                </span>
              </div>

              {/* Typing indicators */}
              <AnimatePresence>
                {typingUsers.filter(t => t.screen === currentScreen).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="px-4 py-2 border-t flex items-center gap-2"
                    style={{ borderColor: "hsl(220 15% 93%)", background: "hsl(220 15% 97%)" }}
                  >
                    <div className="flex -space-x-1">
                      {typingUsers.filter(t => t.screen === currentScreen).map((t, i) => (
                        <div
                          key={i}
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold text-white border-2 border-white"
                          style={{ background: t.user.avatarColor }}
                        >
                          {t.user.initials}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px]" style={{ color: "hsl(220 15% 45%)" }}>
                        {typingUsers.filter(t => t.screen === currentScreen).map(t => t.user.name.split(" ")[0]).join(", ")} {typingUsers.filter(t => t.screen === currentScreen).length === 1 ? "is" : "are"} typing
                      </span>
                      <motion.span
                        className="flex gap-[2px]"
                        initial={{ opacity: 0.4 }}
                        animate={{ opacity: 1 }}
                        transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.6 }}
                      >
                        <span className="w-1 h-1 rounded-full" style={{ background: "hsl(220 15% 55%)" }} />
                        <motion.span
                          className="w-1 h-1 rounded-full"
                          style={{ background: "hsl(220 15% 55%)" }}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                        />
                        <motion.span
                          className="w-1 h-1 rounded-full"
                          style={{ background: "hsl(220 15% 55%)" }}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                        />
                      </motion.span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Comment list or Audit Trail view */}
              {auditViewId ? (
                <AuditTrailView
                  commentId={auditViewId}
                  getAuditLog={getAuditLog}
                  comment={filteredComments.find(c => c.id === auditViewId) || null}
                  onBack={() => setAuditViewId(null)}
                />
              ) : (
                <ScrollArea className="flex-1">
                  <div className="p-3 flex flex-col gap-2">
                    {filteredComments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <MessageSquare size={32} style={{ color: "hsl(220 15% 80%)" }} />
                        <span className="text-xs" style={{ color: "hsl(220 15% 55%)" }}>No comments yet</span>
                      </div>
                    ) : (
                      filteredComments.map(c => renderCommentCard(c))
                    )}
                  </div>
                </ScrollArea>
              )}
            </>
          )}

          {activeTab === "team" && (
            activeDmUserId ? (
              <DmThreadView
                user={members.find(m => m.id === activeDmUserId)!}
                currentUser={currentUser}
                messages={dmThreads[activeDmUserId] || []}
                onSend={(body) => {
                  const id = `dm-${Date.now()}`;
                  setDmThreads(prev => ({
                    ...prev,
                    [activeDmUserId]: [...(prev[activeDmUserId] || []), { id, from: currentUser.id, body, at: new Date() }],
                  }));
                  // Simulate reply after 2s
                  setTimeout(() => {
                    setDmThreads(prev => ({
                      ...prev,
                      [activeDmUserId]: [
                        ...(prev[activeDmUserId] || []),
                        { id: `dm-r-${Date.now()}`, from: activeDmUserId, body: "Got it — I'll take a look and circle back.", at: new Date() },
                      ],
                    }));
                  }, 2200);
                }}
                onBack={() => setActiveDmUserId(null)}
              />
            ) : (
              <TeamListView
                members={members}
                currentUser={currentUser}
                dmThreads={dmThreads}
                onSelect={(uid) => setActiveDmUserId(uid)}
              />
            )
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const auditActionConfig: Record<string, { icon: typeof Plus; color: string; label: string }> = {
  created: { icon: Plus, color: "hsl(207 71% 38%)", label: "Created" },
  edited: { icon: Pencil, color: "hsl(30 80% 50%)", label: "Edited" },
  published: { icon: Send, color: "hsl(145 63% 42%)", label: "Published" },
  resolved: { icon: Check, color: "hsl(145 60% 40%)", label: "Resolved" },
  reopened: { icon: RefreshCw, color: "hsl(270 60% 55%)", label: "Reopened" },
  deleted: { icon: Trash2, color: "hsl(0 72% 51%)", label: "Deleted" },
  locked: { icon: Lock, color: "hsl(220 15% 50%)", label: "Locked" },
  replied: { icon: MessageSquare, color: "hsl(210 80% 50%)", label: "Replied" },
};

const formatAuditTime = (d: Date) => {
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
};

const AuditTrailView = ({ commentId, getAuditLog, comment, onBack }: {
  commentId: string;
  getAuditLog: (id: string) => AuditLogEntry[];
  comment: Comment | null;
  onBack: () => void;
}) => {
  const entries = getAuditLog(commentId);

  // Generate initial "created" entry from comment itself if no log entries
  const allEntries = entries.length > 0 ? entries : (comment ? [{
    id: "initial",
    commentId,
    action: "created" as const,
    user: comment.author,
    timestamp: comment.createdAt,
    details: `Created as ${comment.status}`,
  }] : []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "hsl(220 15% 90%)" }}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="w-6 h-6 flex items-center justify-center rounded cursor-pointer"
          style={{ color: "hsl(220 15% 45%)" }}
        >
          <ArrowLeft size={14} />
        </motion.button>
        <History size={14} style={{ color: "hsl(270 60% 55%)" }} />
        <span className="text-xs font-semibold" style={{ color: "hsl(220 20% 15%)" }}>
          Audit Trail
        </span>
        {comment && (
          <span className="text-[10px] font-bold" style={{ color: "hsl(207 71% 38%)" }}>
            #{comment.pinNumber}
          </span>
        )}
      </div>

      {/* Comment summary */}
      {comment && (
        <div className="px-3 py-2 border-b" style={{ borderColor: "hsl(220 15% 93%)", background: "hsl(220 15% 97%)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
              style={{ background: comment.author.avatarColor }}
            >
              {comment.author.initials}
            </div>
            <span className="text-[11px] font-semibold" style={{ color: "hsl(220 20% 15%)" }}>{comment.author.name}</span>
          </div>
          <p className="text-[11px] leading-snug line-clamp-2" style={{ color: "hsl(220 20% 35%)" }}>
            {comment.body}
          </p>
        </div>
      )}

      {/* Timeline */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {allEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <History size={24} style={{ color: "hsl(220 15% 80%)" }} />
              <span className="text-[11px]" style={{ color: "hsl(220 15% 55%)" }}>No history yet</span>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div
                className="absolute left-[11px] top-3 bottom-3 w-px"
                style={{ background: "hsl(220 15% 90%)" }}
              />
              {allEntries.map((entry, idx) => {
                const config = auditActionConfig[entry.action] || auditActionConfig.created;
                const Icon = config.icon;
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex gap-3 mb-3 relative"
                  >
                    {/* Icon dot */}
                    <div
                      className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 z-10"
                      style={{
                        background: `${config.color}15`,
                        border: `1.5px solid ${config.color}40`,
                      }}
                    >
                      <Icon size={10} style={{ color: config.color }} />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="px-1.5 py-[1px] rounded text-[9px] font-semibold"
                          style={{ background: `${config.color}12`, color: config.color }}
                        >
                          {config.label}
                        </span>
                        <span className="text-[10px] font-medium" style={{ color: "hsl(220 20% 25%)" }}>
                          {entry.user.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={9} style={{ color: "hsl(220 15% 60%)" }} />
                        <span className="text-[9px]" style={{ color: "hsl(220 15% 55%)" }}>
                          {formatAuditTime(entry.timestamp)}
                        </span>
                      </div>
                      {entry.details && (
                        <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: "hsl(220 15% 50%)" }}>
                          {entry.details}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// Helper to highlight search matches within text
const highlightSearchMatch = (text: string, query: string, keyPrefix: string = "") => {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={`${keyPrefix}hl-${i}`}
        className="rounded px-[2px] py-[0.5px]"
        style={{ background: "hsl(50 95% 65%)", color: "hsl(220 20% 10%)" }}
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
};

// Helper to render @mentions as styled chips with optional search highlighting
const renderBodyWithMentions = (body: string, searchQuery: string = "") => {
  const parts = body.split(/(@\w[\w\s]*?\b(?=\s|$|[.,!?]))/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return (
        <span key={i} className="inline-flex items-center gap-0.5 px-1 py-0 rounded text-[11px] font-semibold" style={{ background: "hsl(270 60% 95%)", color: "hsl(270 60% 45%)" }}>
          {highlightSearchMatch(part, searchQuery, `m${i}-`)}
        </span>
      );
    }
    return <span key={i}>{highlightSearchMatch(part, searchQuery, `t${i}-`)}</span>;
  });
};

// Subtle deterministic "online" indicator based on user id
const isOnline = (uid: string) => {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
  return h % 3 !== 0; // ~66% online
};

interface DmMessage { id: string; from: string; body: string; at: Date; }

const TeamListView = ({
  members, currentUser, dmThreads, onSelect,
}: {
  members: CommentUser[];
  currentUser: CommentUser;
  dmThreads: Record<string, DmMessage[]>;
  onSelect: (uid: string) => void;
}) => {
  const others = members.filter(m => m.id !== currentUser.id);
  const [search, setSearch] = useState("");
  const filtered = others.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b" style={{ borderColor: "hsl(220 15% 93%)" }}>
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: "hsl(0 0% 100%)", border: `1px solid ${search ? "hsl(270 60% 65%)" : "hsl(220 15% 88%)"}` }}>
          <Search size={13} style={{ color: search ? "hsl(270 60% 50%)" : "hsl(220 15% 55%)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teammates…"
            className="flex-1 text-[13px] border-none outline-none bg-transparent"
            style={{ color: "hsl(220 20% 15%)" }}
          />
        </div>
      </div>

      <div className="px-3 py-1.5" style={{ background: "hsl(220 15% 96%)" }}>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "hsl(220 15% 45%)" }}>
          Engagement Members · {filtered.length}
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 flex flex-col gap-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Users size={28} style={{ color: "hsl(220 15% 80%)" }} />
              <span className="text-xs" style={{ color: "hsl(220 15% 55%)" }}>No teammates found</span>
            </div>
          ) : (
            filtered.map(m => {
              const online = isOnline(m.id);
              const thread = dmThreads[m.id] || [];
              const last = thread[thread.length - 1];
              return (
                <motion.button
                  key={m.id}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect(m.id)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-left"
                  style={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 15% 92%)" }}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white"
                      style={{ background: m.avatarColor }}
                    >
                      {m.initials}
                    </div>
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                      style={{ background: online ? "hsl(145 65% 45%)" : "hsl(220 10% 70%)" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold truncate" style={{ color: "hsl(220 20% 15%)" }}>
                        {m.name}
                      </span>
                      <RoleBadge role={m.role} />
                    </div>
                    <span className="text-[11px] truncate block" style={{ color: "hsl(220 15% 55%)" }}>
                      {last ? (last.from === currentUser.id ? "You: " : "") + last.body : online ? "Active now" : "Offline"}
                    </span>
                  </div>
                  <MessageSquare size={13} style={{ color: "hsl(270 60% 55%)", flexShrink: 0 }} />
                </motion.button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const formatDmTime = (d: Date) => {
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const DmThreadView = ({
  user, currentUser, messages, onSend, onBack,
}: {
  user: CommentUser;
  currentUser: CommentUser;
  messages: DmMessage[];
  onSend: (body: string) => void;
  onBack: () => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const online = isOnline(user.id);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* DM header */}
      <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: "hsl(220 15% 90%)" }}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="w-6 h-6 flex items-center justify-center rounded cursor-pointer"
          style={{ color: "hsl(220 15% 45%)" }}
        >
          <ArrowLeft size={14} />
        </motion.button>
        <div className="relative">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: user.avatarColor }}
          >
            {user.initials}
          </div>
          <div
            className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-white"
            style={{ background: online ? "hsl(145 65% 45%)" : "hsl(220 10% 70%)" }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold truncate" style={{ color: "hsl(220 20% 15%)" }}>{user.name}</div>
          <div className="text-[10px]" style={{ color: online ? "hsl(145 60% 40%)" : "hsl(220 15% 55%)" }}>
            {online ? "Online" : "Offline"}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-[14px] font-bold text-white"
              style={{ background: user.avatarColor }}
            >
              {user.initials}
            </div>
            <span className="text-[13px] font-semibold" style={{ color: "hsl(220 20% 25%)" }}>
              Start a conversation with {user.name.split(" ")[0]}
            </span>
            <span className="text-[11px] max-w-[220px]" style={{ color: "hsl(220 15% 55%)" }}>
              Direct messages are private — only you and {user.name.split(" ")[0]} can see them.
            </span>
          </div>
        ) : (
          messages.map((m) => {
            const own = m.from === currentUser.id;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${own ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[78%] px-3 py-1.5 rounded-2xl"
                  style={{
                    background: own ? "hsl(270 60% 55%)" : "hsl(0 0% 100%)",
                    color: own ? "white" : "hsl(220 20% 20%)",
                    border: own ? "none" : "1px solid hsl(220 15% 90%)",
                    borderBottomRightRadius: own ? 4 : 16,
                    borderBottomLeftRadius: own ? 16 : 4,
                  }}
                >
                  <p className="text-[13px] leading-snug">{m.body}</p>
                  <span className="text-[9px] opacity-70 block mt-0.5 text-right">{formatDmTime(m.at)}</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="border-t p-2" style={{ borderColor: "hsl(220 15% 92%)", background: "hsl(220 15% 98%)" }}>
        <CommentPrompter
          compact
          placeholder={`Message ${user.name.split(" ")[0]}…`}
          onSubmit={(body) => onSend(body)}
        />
      </div>
    </div>
  );
};

export default CommentsPanel;
