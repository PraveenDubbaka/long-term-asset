import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import type { Comment, CommentFilter, CommentUser, Notification, CommentAnchor, CommentStatus, AuditLogEntry, CommentReaction, CommentVoiceNote, CommentAttachment } from "./types";
import { mockComments, mockNotifications, currentUser, engagementMembers } from "./mockData";
import { toast } from "sonner";

// Simulated incoming comments from other users
const simulatedIncoming: Array<{
  delay: number;
  comment: Omit<Comment, "id" | "pinNumber" | "createdAt">;
}> = [
  {
    delay: 12000,
    comment: {
      author: engagementMembers[1], // James Wilson
      body: "I've reconciled the trade payables — there's a $4,200 variance from the October accrual. @Sarah Chen can you verify?",
      status: "published",
      mentions: ["u1"],
      replies: [],
      attachments: [],
      anchor: { screen: "Balance Sheet", section: "Current Liabilities", lineItem: "Trade payables", row: 8, yPosition: 68 },
    },
  },
  {
    delay: 25000,
    comment: {
      author: engagementMembers[3], // Alex Kim
      body: "Updated the inventory valuation note. FIFO method confirmed with client for FY2024.",
      status: "published",
      mentions: [],
      replies: [],
      attachments: [],
      anchor: { screen: "Balance Sheet", section: "Current Assets", lineItem: "Inventory", row: 3, yPosition: 30 },
    },
  },
  {
    delay: 40000,
    comment: {
      author: engagementMembers[2], // Maya Patel
      body: "Flagging the related-party disclosure — needs additional detail per CSRS 4200. @James Wilson please draft a note.",
      status: "published",
      mentions: ["u2"],
      replies: [],
      attachments: [],
      anchor: { screen: "Cover Page", section: "Notes", lineItem: "Related-party transactions", yPosition: 70 },
    },
  },
];

interface TypingUser {
  user: CommentUser;
  screen: string;
}

interface CommentContextType {
  // State
  commentMode: boolean;
  panelOpen: boolean;
  activeFilter: CommentFilter;
  searchQuery: string;
  userFilter: string | null;
  comments: Comment[];
  notifications: Notification[];
  currentUser: CommentUser;
  members: CommentUser[];
  currentScreen: string;
  incomingCommentId: string | null;
  highlightedLineItem: string | null;
  typingUsers: TypingUser[];
  
  // Actions
  setCommentMode: (v: boolean) => void;
  setPanelOpen: (v: boolean) => void;
  setActiveFilter: (f: CommentFilter) => void;
  setSearchQuery: (q: string) => void;
  setUserFilter: (userId: string | null) => void;
  setCurrentScreen: (s: string) => void;
  addComment: (anchor: CommentAnchor, body: string, mentions: string[], status: CommentStatus, attachments?: CommentAttachment[], voiceNote?: CommentVoiceNote) => string;
  publishComment: (id: string) => void;
  resolveComment: (id: string) => void;
  reopenComment: (id: string) => void;
  deleteComment: (id: string) => void;
  editComment: (id: string, body: string) => void;
  addReply: (commentId: string, body: string, mentions: string[], attachments?: CommentAttachment[], voiceNote?: CommentVoiceNote) => void;
  toggleReaction: (commentId: string, emoji: string, replyId?: string) => void;
  markNotificationRead: (id: string) => void;
  scrollToPin: (commentId: string) => void;
  scrollToRow: (commentId: string) => void;
  getAuditLog: (commentId: string) => AuditLogEntry[];
  // Inline composer (anchored at pin)
  activeComposerPinId: string | null;
  setActiveComposerPinId: (id: string | null) => void;
  openCommentId: string | null;
  setOpenCommentId: (id: string | null) => void;

  // Computed
  filteredComments: Comment[];
  screenComments: Comment[];
  unresolvedCount: number;
  unreadNotifications: number;

  // Refs
  scrollToPinId: string | null;
}

const CommentCtx = createContext<CommentContextType | null>(null);

export const useComments = () => {
  const ctx = useContext(CommentCtx);
  if (!ctx) throw new Error("useComments must be used within CommentProvider");
  return ctx;
};

export const CommentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [commentMode, setCommentMode] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<CommentFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [currentScreen, setCurrentScreen] = useState("Cover Page");
  const [scrollToPinId, setScrollToPinId] = useState<string | null>(null);
  const [incomingCommentId, setIncomingCommentId] = useState<string | null>(null);
  const [highlightedLineItem, setHighlightedLineItem] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [activeComposerPinId, setActiveComposerPinId] = useState<string | null>(null);
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(() => {
    const seed: AuditLogEntry[] = [];
    mockComments.forEach(c => {
      seed.push({ id: `al-seed-${c.id}-created`, commentId: c.id, action: "created", user: c.author, timestamp: c.createdAt, details: `Created as ${c.status}` });
      if (c.status === "published") {
        seed.push({ id: `al-seed-${c.id}-pub`, commentId: c.id, action: "published", user: c.author, timestamp: new Date(c.createdAt.getTime() + 60000) });
      }
      if (c.status === "resolved" && c.resolvedBy) {
        seed.push({ id: `al-seed-${c.id}-res`, commentId: c.id, action: "resolved", user: c.resolvedBy, timestamp: c.resolvedAt! });
      }
      if (c.status === "locked") {
        seed.push({ id: `al-seed-${c.id}-lock`, commentId: c.id, action: "locked", user: c.author, timestamp: c.lockedAt || c.createdAt });
      }
      c.replies.forEach(r => {
        seed.push({ id: `al-seed-${c.id}-reply-${r.id}`, commentId: c.id, action: "replied", user: r.author, timestamp: r.createdAt, details: r.body.slice(0, 60) });
      });
    });
    return seed;
  });
  const pinCountRef = useRef(mockComments.length);
  const simulatedRef = useRef(false);

  // Simulate real-time incoming comments from other users
  useEffect(() => {
    if (simulatedRef.current) return;
    simulatedRef.current = true;

    const timers = simulatedIncoming.map((sim, idx) =>
      setTimeout(() => {
        pinCountRef.current += 1;
        const newId = `sync-${Date.now()}-${idx}`;
        const newComment: Comment = {
          ...sim.comment,
          id: newId,
          pinNumber: pinCountRef.current,
          createdAt: new Date(),
        };

        setComments(prev => [...prev, newComment]);
        setIncomingCommentId(newId);
        setTimeout(() => setIncomingCommentId(null), 2000);

        // Add notification
        const isMentioned = sim.comment.mentions.includes(currentUser.id);
        const newNotif: Notification = {
          id: `nsync-${Date.now()}-${idx}`,
          type: isMentioned ? "mention" : "new_comment",
          fromUser: sim.comment.author,
          commentId: newId,
          preview: sim.comment.body.slice(0, 80) + (sim.comment.body.length > 80 ? "..." : ""),
          engagementName: "Shipping Line Inc. — COM-CON-Dec312024",
          anchor: sim.comment.anchor,
          read: false,
          createdAt: new Date(),
        };
        setNotifications(prev => [newNotif, ...prev]);

        // Show toast
        const anchorLabel = sim.comment.anchor.lineItem || sim.comment.anchor.section || sim.comment.anchor.screen;
        toast(
          `${sim.comment.author.name} commented`,
          {
            description: `on ${anchorLabel}: "${sim.comment.body.slice(0, 60)}${sim.comment.body.length > 60 ? "..." : ""}"`,
            duration: 5000,
            action: {
              label: "View",
              onClick: () => {
                setScrollToPinId(newId);
                setPanelOpen(true);
                setTimeout(() => setScrollToPinId(null), 100);
              },
            },
          }
        );
      }, sim.delay)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  const screenComments = comments.filter(c => c.anchor.screen === currentScreen);
  
  const filteredComments = screenComments.filter(c => {
    if (activeFilter === "open") return c.status === "published";
    if (activeFilter === "resolved") return c.status === "resolved";
    if (activeFilter === "draft") return c.status === "draft" && c.author.id === currentUser.id;
    if (activeFilter === "locked") return c.status === "locked";
    if (activeFilter === "mine") return c.author.id === currentUser.id;
    return true;
  }).filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.body.toLowerCase().includes(q) ||
      c.anchor.lineItem?.toLowerCase().includes(q) ||
      c.anchor.section?.toLowerCase().includes(q) ||
      c.replies.some(r => r.body.toLowerCase().includes(q));
  }).filter(c => {
    if (!userFilter) return true;
    return c.author.id === userFilter || c.mentions.includes(userFilter);
  });

  const unresolvedCount = screenComments.filter(c => c.status === "published").length;
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const logAction = useCallback((commentId: string, action: AuditLogEntry["action"], user: CommentUser, details?: string) => {
    setAuditLog(prev => [...prev, {
      id: `al-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      commentId, action, user, timestamp: new Date(), details,
    }]);
  }, []);

  const getAuditLog = useCallback((commentId: string) => {
    return auditLog.filter(e => e.commentId === commentId).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [auditLog]);

  const addComment = useCallback((anchor: CommentAnchor, body: string, mentions: string[], status: CommentStatus, attachments: CommentAttachment[] = [], voiceNote?: CommentVoiceNote) => {
    pinCountRef.current += 1;
    const id = `c${Date.now()}`;
    const newComment: Comment = {
      id,
      author: currentUser,
      body,
      status,
      createdAt: new Date(),
      mentions,
      replies: [],
      attachments,
      voiceNote,
      reactions: [],
      anchor,
      pinNumber: pinCountRef.current,
    };
    setComments(prev => [...prev, newComment]);
    logAction(id, "created", currentUser, `Created as ${status}`);
    return id;
  }, [logAction]);

  const publishComment = useCallback((id: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, status: "published" as CommentStatus } : c));
    logAction(id, "published", currentUser);
  }, [logAction]);

  const resolveComment = useCallback((id: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, status: "resolved" as CommentStatus, resolvedAt: new Date(), resolvedBy: currentUser } : c));
    logAction(id, "resolved", currentUser);
  }, [logAction]);

  const reopenComment = useCallback((id: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, status: "published" as CommentStatus, resolvedAt: undefined, resolvedBy: undefined } : c));
    logAction(id, "reopened", currentUser);
  }, [logAction]);

  const deleteComment = useCallback((id: string) => {
    setComments(prev => prev.filter(c => c.id !== id));
    logAction(id, "deleted", currentUser);
  }, [logAction]);

  const editComment = useCallback((id: string, body: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, body, editedAt: new Date() } : c));
    logAction(id, "edited", currentUser);
  }, [logAction]);

  const addReply = useCallback((commentId: string, body: string, mentions: string[], attachments: CommentAttachment[] = [], voiceNote?: CommentVoiceNote) => {
    setComments(prev => prev.map(c => c.id === commentId ? {
      ...c,
      replies: [...c.replies, { id: `r${Date.now()}`, author: currentUser, body, createdAt: new Date(), mentions, attachments, voiceNote, reactions: [] }],
    } : c));
    logAction(commentId, "replied", currentUser, body.slice(0, 60));
  }, [logAction]);

  const toggleReaction = useCallback((commentId: string, emoji: string, replyId?: string) => {
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      if (replyId) {
        return {
          ...c,
          replies: c.replies.map(r => {
            if (r.id !== replyId) return r;
            const reactions = r.reactions ? [...r.reactions] : [];
            const idx = reactions.findIndex(rx => rx.emoji === emoji);
            if (idx === -1) {
              reactions.push({ emoji, userIds: [currentUser.id] });
            } else {
              const userIds = reactions[idx].userIds;
              reactions[idx] = userIds.includes(currentUser.id)
                ? { emoji, userIds: userIds.filter(u => u !== currentUser.id) }
                : { emoji, userIds: [...userIds, currentUser.id] };
            }
            return { ...r, reactions: reactions.filter(rx => rx.userIds.length > 0) };
          }),
        };
      }
      const reactions = c.reactions ? [...c.reactions] : [];
      const idx = reactions.findIndex(rx => rx.emoji === emoji);
      if (idx === -1) {
        reactions.push({ emoji, userIds: [currentUser.id] });
      } else {
        const userIds = reactions[idx].userIds;
        reactions[idx] = userIds.includes(currentUser.id)
          ? { emoji, userIds: userIds.filter(u => u !== currentUser.id) }
          : { emoji, userIds: [...userIds, currentUser.id] };
      }
      return { ...c, reactions: reactions.filter(rx => rx.userIds.length > 0) };
    }));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const scrollToPin = useCallback((commentId: string) => {
    setScrollToPinId(commentId);
    setTimeout(() => setScrollToPinId(null), 100);
  }, []);

  const scrollToRow = useCallback((commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment?.anchor.lineItem) return;
    const lineItem = comment.anchor.lineItem;
    // Find DOM row
    const row = document.querySelector(`tr[data-comment-row="${CSS.escape(lineItem)}"]`) as HTMLElement | null;
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      row.classList.remove("comment-row-highlighted");
      // Force reflow to restart animation
      void row.offsetWidth;
      row.classList.add("comment-row-highlighted");
      setHighlightedLineItem(lineItem);
      setTimeout(() => {
        setHighlightedLineItem(null);
        row.classList.remove("comment-row-highlighted");
      }, 2000);
    }
    setScrollToPinId(commentId);
    setTimeout(() => setScrollToPinId(null), 100);
  }, [comments]);

  // Simulate typing indicators from other users
  useEffect(() => {
    const typingSimulations = [
      { delay: 8000, user: engagementMembers[1], screen: "Balance Sheet", duration: 4000 },
      { delay: 20000, user: engagementMembers[3], screen: "Cover Page", duration: 3000 },
      { delay: 35000, user: engagementMembers[2], screen: "Balance Sheet", duration: 5000 },
    ];

    const timers = typingSimulations.map(sim =>
      setTimeout(() => {
        const typingEntry: TypingUser = { user: sim.user, screen: sim.screen };
        setTypingUsers(prev => [...prev, typingEntry]);
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(t => t !== typingEntry));
        }, sim.duration);
      }, sim.delay)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <CommentCtx.Provider value={{
      commentMode, panelOpen, activeFilter, searchQuery, userFilter,
      comments, notifications, currentUser, members: engagementMembers,
      currentScreen, scrollToPinId, incomingCommentId, highlightedLineItem, typingUsers,
      activeComposerPinId, openCommentId,
      setCommentMode, setPanelOpen, setActiveFilter, setSearchQuery, setUserFilter,
      setCurrentScreen, addComment, publishComment, resolveComment, reopenComment,
      deleteComment, editComment, addReply, toggleReaction, markNotificationRead, scrollToPin, scrollToRow, getAuditLog,
      setActiveComposerPinId, setOpenCommentId,
      filteredComments, screenComments, unresolvedCount, unreadNotifications,
    }}>
      {children}
    </CommentCtx.Provider>
  );
};
