import { motion, AnimatePresence } from "framer-motion";
import { useComments } from "./CommentContext";

const CommentMinimap = () => {
  const { screenComments, commentMode, scrollToPin, setPanelOpen } = useComments();

  if (!commentMode || screenComments.length === 0) return null;

  return (
    <div
      className="absolute right-1 top-0 bottom-0 w-2 z-20 pointer-events-none"
    >
      <AnimatePresence>
        {screenComments.map(c => {
          const y = c.anchor.yPosition ?? 50;
          const color = c.status === "published"
            ? "hsl(207 71% 38%)"
            : c.status === "resolved"
            ? "hsl(220 15% 70%)"
            : c.status === "draft"
            ? "hsl(40 80% 55%)"
            : "hsl(220 15% 55%)";

          return (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              className="absolute left-0 right-0 rounded-full pointer-events-auto cursor-pointer"
              style={{
                top: `${y}%`,
                height: 8,
                background: color,
                opacity: 0.7,
              }}
              whileHover={{ opacity: 1, scaleX: 1.5 }}
              onClick={() => { setPanelOpen(true); scrollToPin(c.id); }}
              title={`#${c.pinNumber}: ${c.body.slice(0, 40)}…`}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default CommentMinimap;
