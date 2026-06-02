import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SmilePlus } from "lucide-react";
import type { CommentReaction } from "./types";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🎉", "👀", "✅"];

interface CommentReactionsProps {
  reactions?: CommentReaction[];
  currentUserId: string;
  onToggle: (emoji: string) => void;
}

const CommentReactions = ({ reactions = [], currentUserId, onToggle }: CommentReactionsProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1">
      {reactions.map(rx => {
        const mine = rx.userIds.includes(currentUserId);
        return (
          <motion.button
            key={rx.emoji}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={(e) => { e.stopPropagation(); onToggle(rx.emoji); }}
            className="h-6 px-2 inline-flex items-center gap-1 rounded-full cursor-pointer"
            style={{
              background: mine ? "hsl(270 60% 95%)" : "hsl(220 15% 96%)",
              border: `1px solid ${mine ? "hsl(270 60% 75%)" : "hsl(220 15% 88%)"}`,
            }}
            title={mine ? "Click to remove your reaction" : "Click to react"}
          >
            <span className="text-[12px] leading-none">{rx.emoji}</span>
            <span className="text-[10px] font-semibold" style={{ color: mine ? "hsl(270 60% 40%)" : "hsl(220 15% 45%)" }}>
              {rx.userIds.length}
            </span>
          </motion.button>
        );
      })}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={(e) => { e.stopPropagation(); setPickerOpen(p => !p); }}
          className="w-6 h-6 inline-flex items-center justify-center rounded-full cursor-pointer"
          style={{
            background: "hsl(220 15% 96%)",
            border: "1px dashed hsl(220 15% 80%)",
            color: "hsl(220 15% 55%)",
          }}
          title="Add reaction"
        >
          <SmilePlus size={11} />
        </motion.button>
        <AnimatePresence>
          {pickerOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute z-50 flex items-center gap-0.5 px-1.5 py-1 rounded-full"
              style={{
                bottom: "calc(100% + 4px)",
                left: "50%",
                transform: "translateX(-50%)",
                background: "hsl(0 0% 100%)",
                border: "1px solid hsl(220 15% 88%)",
                boxShadow: "0 6px 20px hsl(220 20% 10% / 0.12)",
              }}
            >
              {QUICK_REACTIONS.map(emoji => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.25 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); onToggle(emoji); setPickerOpen(false); }}
                  className="w-7 h-7 flex items-center justify-center text-[15px] cursor-pointer rounded-full hover:bg-[hsl(220_15%_96%)]"
                >
                  {emoji}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CommentReactions;
