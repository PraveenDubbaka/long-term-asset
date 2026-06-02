import { motion } from "framer-motion";
import { Settings, MessageSquare, Sparkles, Globe } from "lucide-react";

interface ActionIconsProps {
  commentCount?: number;
  chatCount?: number;
  showAI?: boolean;
  aiDisabled?: boolean;
}

const ActionIcons = ({ commentCount, chatCount, showAI, aiDisabled }: ActionIconsProps) => {
  return (
    <div className="flex items-center gap-1">
      {showAI && (
        <motion.button
          whileHover={aiDisabled ? {} : { scale: 1.15 }}
          whileTap={aiDisabled ? {} : { scale: 0.9 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400 }}
          className={`action-icon ai-icon ${aiDisabled ? "opacity-30 cursor-not-allowed" : ""}`}
          title="AI"
          disabled={aiDisabled}
        >
          <Sparkles size={20} />
        </motion.button>
      )}
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400 }}
        className="action-icon"
        title="Settings"
      >
        <Settings size={20} />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400 }}
        className="action-icon relative"
        title="Engagement Letter"
      >
        <div style={{
          width: 20,
          height: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: 700,
          color: "currentColor",
          border: "1.5px solid currentColor",
          borderRadius: 3,
          lineHeight: 1,
        }}>
          EL
        </div>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400 }}
        className="action-icon relative"
        title="Comments"
      >
        <MessageSquare size={20} />
        {commentCount && commentCount > 0 && (
          <span className="notification-badge">{commentCount}</span>
        )}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400 }}
        className="action-icon relative"
        title="Client Portal"
      >
        <Globe size={20} />
        <span style={{
          position: "absolute",
          top: 2,
          right: 2,
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "#22c55e",
          border: "1.5px solid white",
        }} />
      </motion.button>
    </div>
  );
};

export default ActionIcons;
