import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useComments } from "./CommentContext";
import CommentPrompter from "./CommentPrompter";
import CommentReactions from "./CommentReactions";
import { Check, RotateCcw, Trash2, Reply, X, Play, Pause, Paperclip } from "lucide-react";

const formatTime = (d: Date) => {
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

interface CommentPinsOverlayProps {
  containerHeight: number;
}

const PIN_SIZE = 28;
const POPOVER_WIDTH = 340;

const VoiceNotePlayer = ({ duration }: { duration: number }) => {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="px-2.5 py-1.5 rounded-xl flex items-center gap-2" style={{ background: "hsl(270 60% 96%)", border: "1px solid hsl(270 60% 88%)" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setPlaying(p => !p); }}
        className="w-6 h-6 flex items-center justify-center rounded-full cursor-pointer flex-shrink-0"
        style={{ background: "hsl(270 60% 55%)", color: "white" }}
      >
        {playing ? <Pause size={9} fill="white" /> : <Play size={9} fill="white" />}
      </button>
      <div className="flex-1 flex items-center gap-[2px] min-w-[80px]">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="rounded-full flex-1"
            style={{
              height: 3 + Math.abs(Math.sin(i * 0.7)) * 11,
              background: "hsl(270 60% 60%)",
              opacity: playing ? 1 : 0.55,
            }}
          />
        ))}
      </div>
      <span className="text-[10px] font-mono font-semibold" style={{ color: "hsl(270 60% 40%)" }}>
        {`0:${duration.toString().padStart(2, "0")}`}
      </span>
    </div>
  );
};

const CommentPinsOverlay = ({ containerHeight }: CommentPinsOverlayProps) => {
  const {
    screenComments, commentMode, currentUser, incomingCommentId,
    openCommentId, setOpenCommentId, activeComposerPinId, setActiveComposerPinId,
    editComment, addReply, toggleReaction, resolveComment, reopenComment, deleteComment, publishComment,
  } = useComments();

  const popoverRef = useRef<HTMLDivElement>(null);
  // Track the FS page element so pins overlay only the centered A4 page,
  // not the full-width scroll container (which would push them into the gutter).
  const [pageBox, setPageBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  useEffect(() => {
    const updateBox = () => {
      const pageEl = document.querySelector<HTMLElement>("[data-fs-page]");
      const scrollEl = pageEl?.closest(".comment-mode-active, [data-fs-scroll]") as HTMLElement | null
        || pageEl?.parentElement?.parentElement as HTMLElement | null;
      if (!pageEl || !scrollEl) { setPageBox(null); return; }
      const pageRect = pageEl.getBoundingClientRect();
      const scrollRect = scrollEl.getBoundingClientRect();
      setPageBox({
        left: pageRect.left - scrollRect.left + scrollEl.scrollLeft,
        top: pageRect.top - scrollRect.top + scrollEl.scrollTop,
        width: pageRect.width,
        height: pageRect.height,
      });
    };
    updateBox();
    const ro = new ResizeObserver(updateBox);
    const pageEl = document.querySelector<HTMLElement>("[data-fs-page]");
    if (pageEl) ro.observe(pageEl);
    window.addEventListener("resize", updateBox);
    return () => { ro.disconnect(); window.removeEventListener("resize", updateBox); };
  });

  // Close popover on outside click
  useEffect(() => {
    if (!openCommentId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (popoverRef.current && !popoverRef.current.contains(target) && !target.closest("[data-comment-pin]")) {
        setOpenCommentId(null);
        setActiveComposerPinId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openCommentId, setOpenCommentId, setActiveComposerPinId]);

  if (!commentMode && screenComments.length === 0) return null;
  if (!pageBox) return null;

  return (
    <div
      className="absolute z-30 pointer-events-none"
      style={{
        left: pageBox.left,
        top: pageBox.top,
        width: pageBox.width,
        height: pageBox.height,
      }}
    >
      <AnimatePresence>
        {screenComments.map((c) => {
          const yPos = c.anchor.yPosition ?? 50;
          const xPos = c.anchor.xPosition ?? 2;
          const isOwn = c.author.id === currentUser.id;
          const isOpen = openCommentId === c.id;
          const isComposing = activeComposerPinId === c.id;
          const isIncoming = c.id === incomingCommentId;
          const isResolved = c.status === "resolved";
          const isDraft = c.status === "draft";

          // Resolved pins fade unless opened
          if (isResolved && !isOpen && !commentMode) return null;

          // Color theme
          const bg = isResolved
            ? "hsl(145 50% 55%)"
            : isDraft
              ? "hsl(40 85% 55%)"
              : isOwn
                ? "hsl(270 60% 55%)"
                : "hsl(207 71% 38%)";

          // Compute popover horizontal placement (flip if too close to right edge)
          const popoverFlipsLeft = xPos > 65;

          return (
            <div
              key={c.id}
              className="absolute"
              style={{
                top: `${yPos}%`,
                left: `${xPos}%`,
                transform: "translate(-50%, -100%)",
                pointerEvents: "auto",
              }}
            >
              {/* Pulse ring for incoming */}
              {isIncoming && (
                <motion.div
                  className="absolute rounded-full"
                  initial={{ scale: 1, opacity: 0.7 }}
                  animate={{ scale: 2.8, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: 2, ease: "easeOut" }}
                  style={{
                    background: bg,
                    width: PIN_SIZE,
                    height: PIN_SIZE,
                    left: 0,
                    top: 0,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              )}

              {/* Pin marker */}
              <motion.button
                data-comment-pin={c.id}
                initial={{ opacity: 0, scale: 0, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.92 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isOpen) {
                    setOpenCommentId(null);
                    setActiveComposerPinId(null);
                  } else {
                    setOpenCommentId(c.id);
                  }
                }}
                className="relative flex items-center justify-center cursor-pointer"
                style={{
                  width: PIN_SIZE,
                  height: PIN_SIZE,
                  borderRadius: "50% 50% 50% 4px",
                  transform: "rotate(-45deg) translateZ(0)",
                  background: bg,
                  border: `2px solid white`,
                  boxShadow: `0 3px 10px ${bg}55, 0 1px 3px hsl(220 20% 10% / 0.15)`,
                }}
              >
                <span
                  className="text-[10px] font-bold text-white"
                  style={{ transform: "rotate(45deg)", letterSpacing: 0 }}
                >
                  {isComposing && !c.body ? "+" : c.pinNumber}
                </span>
              </motion.button>

              {/* Anchored popover (thread or composer) */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    ref={popoverRef}
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    className="absolute rounded-2xl overflow-hidden"
                    style={{
                      width: POPOVER_WIDTH,
                      [popoverFlipsLeft ? "right" : "left"]: PIN_SIZE + 6,
                      top: -6,
                      background: "hsl(0 0% 100%)",
                      border: "1px solid hsl(220 15% 88%)",
                      boxShadow: "0 12px 36px hsl(220 20% 10% / 0.16), 0 2px 8px hsl(220 20% 10% / 0.06)",
                      maxHeight: 480,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <PinThread
                      commentId={c.id}
                      onClose={() => { setOpenCommentId(null); setActiveComposerPinId(null); }}
                      isComposing={isComposing}
                      onCancelCompose={() => {
                        // delete the empty draft
                        if (!c.body && c.replies.length === 0) {
                          deleteComment(c.id);
                        }
                        setActiveComposerPinId(null);
                        setOpenCommentId(null);
                      }}
                      onComposeSubmit={(body, mentions, attachments, voiceNote) => {
                        // Persist as the comment body — replace the empty draft
                        editComment(c.id, body);
                        publishComment(c.id);
                        // Close composer AND popover so a new empty box doesn't appear
                        setActiveComposerPinId(null);
                        setOpenCommentId(null);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Inner thread/popover content
const PinThread = ({
  commentId, onClose, isComposing, onCancelCompose, onComposeSubmit,
}: {
  commentId: string;
  onClose: () => void;
  isComposing: boolean;
  onCancelCompose: () => void;
  onComposeSubmit: (body: string, mentions: string[], attachments: any[], voiceNote?: any) => void;
}) => {
  const {
    screenComments, currentUser, addReply, toggleReaction,
    resolveComment, reopenComment, deleteComment,
  } = useComments();
  const [replyOpen, setReplyOpen] = useState(false);

  const c = screenComments.find(x => x.id === commentId);
  if (!c) return null;

  const isOwn = c.author.id === currentUser.id;
  const isResolved = c.status === "resolved";

  // Composer state for new pins
  if (isComposing && !c.body) {
    return (
      <div>
        <div className="px-3 py-2 flex items-center justify-between border-b" style={{ borderColor: "hsl(220 15% 92%)" }}>
          <span className="text-[11px] font-semibold" style={{ color: "hsl(220 20% 25%)" }}>
            New comment · #{c.pinNumber}
          </span>
          <button onClick={onCancelCompose} className="w-5 h-5 flex items-center justify-center rounded cursor-pointer" style={{ color: "hsl(220 15% 50%)" }}>
            <X size={12} />
          </button>
        </div>
        {c.anchor.lineItem && (
          <div className="px-3 py-1.5 text-[10px]" style={{ background: "hsl(220 15% 97%)", color: "hsl(220 15% 45%)" }}>
            On <span className="font-semibold" style={{ color: "hsl(220 20% 25%)" }}>{c.anchor.lineItem}</span>
          </div>
        )}
        <div className="p-2.5">
          <CommentPrompter
            placeholder="What's on your mind?"
            autoFocus
            compact
            onSubmit={onComposeSubmit}
            onCancel={onCancelCompose}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between border-b" style={{ borderColor: "hsl(220 15% 92%)" }}>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold" style={{ color: isResolved ? "hsl(145 60% 35%)" : "hsl(207 71% 36%)" }}>#{c.pinNumber}</span>
          {c.anchor.lineItem && (
            <span className="text-[10px] truncate max-w-[180px]" style={{ color: "hsl(220 15% 50%)" }}>
              on <span className="font-semibold" style={{ color: "hsl(220 20% 30%)" }}>{c.anchor.lineItem}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {!isResolved ? (
            <button
              onClick={() => resolveComment(c.id)}
              className="w-6 h-6 flex items-center justify-center rounded cursor-pointer hover:bg-[hsl(145_50%_94%)]"
              style={{ color: "hsl(145 60% 40%)" }}
              title="Resolve"
            >
              <Check size={12} />
            </button>
          ) : (
            <button
              onClick={() => reopenComment(c.id)}
              className="w-6 h-6 flex items-center justify-center rounded cursor-pointer hover:bg-[hsl(220_15%_94%)]"
              style={{ color: "hsl(220 15% 45%)" }}
              title="Reopen"
            >
              <RotateCcw size={12} />
            </button>
          )}
          {isOwn && (
            <button
              onClick={() => { deleteComment(c.id); onClose(); }}
              className="w-6 h-6 flex items-center justify-center rounded cursor-pointer hover:bg-[hsl(0_72%_94%)]"
              style={{ color: "hsl(0 72% 50%)" }}
              title="Delete"
            >
              <Trash2 size={11} />
            </button>
          )}
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded cursor-pointer" style={{ color: "hsl(220 15% 50%)" }}>
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Scrollable thread */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 320 }}>
        {/* Original comment */}
        <div className="px-3 py-2.5">
          <div className="flex items-start gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
              style={{ background: c.author.avatarColor }}
            >
              {c.author.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[12px] font-semibold" style={{ color: "hsl(220 20% 15%)" }}>{c.author.name}</span>
                <span className="text-[10px]" style={{ color: "hsl(220 15% 55%)" }}>{formatTime(c.createdAt)}</span>
              </div>
              {c.body && (
                <p className="text-[13px] leading-relaxed mt-0.5" style={{ color: "hsl(220 20% 25%)" }}>
                  {c.body}
                </p>
              )}
              {c.voiceNote && (
                <div className="mt-1.5">
                  <VoiceNotePlayer duration={c.voiceNote.durationSec} />
                </div>
              )}
              {c.attachments.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {c.attachments.map(a => (
                    <div key={a.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]" style={{ background: "hsl(220 15% 96%)", color: "hsl(220 15% 40%)" }}>
                      <Paperclip size={9} />
                      <span className="truncate max-w-[100px]">{a.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <CommentReactions
                reactions={c.reactions}
                currentUserId={currentUser.id}
                onToggle={(emoji) => toggleReaction(c.id, emoji)}
              />
            </div>
          </div>
        </div>

        {/* Replies */}
        {c.replies.map(r => (
          <div key={r.id} className="px-3 py-2 border-t" style={{ borderColor: "hsl(220 15% 94%)" }}>
            <div className="flex items-start gap-2 ml-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                style={{ background: r.author.avatarColor }}
              >
                {r.author.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[12px] font-semibold" style={{ color: "hsl(220 20% 15%)" }}>{r.author.name}</span>
                  <span className="text-[10px]" style={{ color: "hsl(220 15% 55%)" }}>{formatTime(r.createdAt)}</span>
                </div>
                {r.body && (
                  <p className="text-[13px] leading-relaxed mt-0.5" style={{ color: "hsl(220 20% 25%)" }}>
                    {r.body}
                  </p>
                )}
                {r.voiceNote && (
                  <div className="mt-1.5">
                    <VoiceNotePlayer duration={r.voiceNote.durationSec} />
                  </div>
                )}
                {r.attachments && r.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {r.attachments.map(a => (
                      <div key={a.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]" style={{ background: "hsl(220 15% 96%)", color: "hsl(220 15% 40%)" }}>
                        <Paperclip size={9} />
                        <span className="truncate max-w-[100px]">{a.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                <CommentReactions
                  reactions={r.reactions}
                  currentUserId={currentUser.id}
                  onToggle={(emoji) => toggleReaction(c.id, emoji, r.id)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply footer */}
      {!isResolved && (
        <div className="border-t p-2" style={{ borderColor: "hsl(220 15% 92%)", background: "hsl(220 15% 98%)" }}>
          {replyOpen ? (
            <CommentPrompter
              placeholder="Write a reply…"
              compact
              autoFocus
              onSubmit={(body, mentions, attachments, voiceNote) => {
                addReply(c.id, body, mentions, attachments, voiceNote);
                setReplyOpen(false);
              }}
              onCancel={() => setReplyOpen(false)}
            />
          ) : (
            <button
              onClick={() => setReplyOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-medium cursor-pointer"
              style={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 15% 88%)", color: "hsl(220 15% 50%)" }}
            >
              <Reply size={12} />
              Reply…
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default CommentPinsOverlay;
