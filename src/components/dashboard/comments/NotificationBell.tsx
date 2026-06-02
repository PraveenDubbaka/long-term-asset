import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useComments } from "./CommentContext";
import { Bell, X, MessageSquare, AtSign, Check, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const formatTime = (d: Date) => {
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

const NotificationBell = () => {
  const { unreadNotifications, notifications, markNotificationRead, setPanelOpen, scrollToPin, setCurrentScreen } = useComments();
  const [open, setOpen] = useState(false);

  const typeIcon = (type: string) => {
    if (type === "mention") return <AtSign size={12} style={{ color: "hsl(270 60% 55%)" }} />;
    if (type === "reply") return <MessageSquare size={12} style={{ color: "hsl(207 71% 38%)" }} />;
    if (type === "new_comment") return <MessageSquare size={12} style={{ color: "hsl(145 63% 42%)" }} />;
    return <Check size={12} style={{ color: "hsl(145 60% 40%)" }} />;
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 flex items-center justify-center rounded-[10px] cursor-pointer"
        style={{
          color: "hsl(220 15% 40%)",
          background: open ? "hsl(220 15% 93%)" : "transparent",
          border: open ? "1px solid hsl(220 15% 85%)" : "1px solid transparent",
        }}
      >
        <Bell size={18} />
        {unreadNotifications > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
            style={{ background: "hsl(0 72% 51%)" }}
          >
            {unreadNotifications}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute right-0 top-full mt-2 w-[340px] rounded-xl overflow-hidden z-50"
            style={{
              background: "hsl(0 0% 100%)",
              border: "1px solid hsl(220 15% 88%)",
              boxShadow: "0 12px 40px hsl(220 20% 10% / 0.15), 0 2px 8px hsl(220 20% 10% / 0.05)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "hsl(220 15% 92%)" }}>
              <span className="text-sm font-semibold" style={{ color: "hsl(220 20% 15%)" }}>Notifications</span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded cursor-pointer"
                style={{ color: "hsl(220 15% 50%)" }}
              >
                <X size={14} />
              </motion.button>
            </div>

            <ScrollArea className="max-h-[360px]">
              <div className="p-2 flex flex-col gap-0.5">
                {notifications.length === 0 ? (
                  <div className="py-8 flex flex-col items-center gap-2">
                    <Bell size={24} style={{ color: "hsl(220 15% 80%)" }} />
                    <span className="text-xs" style={{ color: "hsl(220 15% 55%)" }}>All caught up!</span>
                  </div>
                ) : (
                  notifications.map(n => (
                    <motion.button
                      key={n.id}
                      whileHover={{ backgroundColor: "hsl(220 15% 97%)" }}
                      onClick={() => {
                        markNotificationRead(n.id);
                        setCurrentScreen(n.anchor.screen);
                        setPanelOpen(true);
                        scrollToPin(n.commentId);
                        setOpen(false);
                      }}
                      className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left cursor-pointer"
                      style={{ background: n.read ? "transparent" : "hsl(270 60% 98%)" }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 mt-0.5"
                        style={{ background: n.fromUser.avatarColor }}
                      >
                        {n.fromUser.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {typeIcon(n.type)}
                          <span className="text-xs font-semibold" style={{ color: "hsl(220 20% 15%)" }}>
                            {n.fromUser.name}
                          </span>
                          <span className="text-[10px]" style={{ color: "hsl(220 15% 55%)" }}>{formatTime(n.createdAt)}</span>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(270 60% 55%)" }} />
                          )}
                        </div>
                        <p className="text-[11px] leading-snug truncate" style={{ color: "hsl(220 20% 30%)" }}>{n.preview}</p>
                        <div className="flex items-center gap-0.5 mt-1 text-[9px]" style={{ color: "hsl(215 55% 50%)" }}>
                          <span>{n.anchor.screen}</span>
                          {n.anchor.section && <><ChevronRight size={7} /><span>{n.anchor.section}</span></>}
                        </div>
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
