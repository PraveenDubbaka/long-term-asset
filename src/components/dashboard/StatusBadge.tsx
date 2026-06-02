import { motion } from "framer-motion";

type StatusType = "New" | "In Progress" | "Completed";

const statusClassMap: Record<StatusType, string> = {
  "New": "status-new",
  "In Progress": "status-progress",
  "Completed": "status-completed",
};

const statusDotMap: Record<StatusType, string> = {
  "New": "hsl(var(--status-new))",
  "In Progress": "hsl(var(--status-progress))",
  "Completed": "hsl(var(--status-completed))",
};

interface StatusBadgeProps {
  status: StatusType;
  showRF?: boolean;
}

const StatusBadge = ({ status, showRF }: StatusBadgeProps) => {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      <motion.span
        whileHover={{ scale: 1.08 }}
        className={`status-badge ${statusClassMap[status]}`}
      >
        {status}
      </motion.span>
      {showRF && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="status-badge status-rf"
        >
          RF
        </motion.span>
      )}
    </div>
  );
};

export default StatusBadge;
