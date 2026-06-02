import { Plus } from "lucide-react";
import { motion } from "framer-motion";

interface AddColumnButtonProps {
  onClick: () => void;
  /**
   * Visual placement of the affordance relative to the column header.
   * "before" → renders on the left edge (default, inserts new column to the LEFT).
   * "after"  → renders on the right edge (inserts new column to the RIGHT).
   */
  position?: "before" | "after";
}

/**
 * Subtle, always-visible "add column" affordance.
 *
 * Design intent:
 * - A thin, low-contrast vertical guide rail sits flush against the column edge.
 * - A small "+" glyph is anchored in the center of the rail.
 * - At rest the rail/glyph are very low opacity (~35%) so they don't compete
 *   with the table content; on hover the affordance lights up in primary blue.
 * - No layout shift: the rail is absolutely positioned and 2px wide.
 */
const AddColumnButton = ({ onClick, position = "before" }: AddColumnButtonProps) => {
  const edgeStyle =
    position === "before"
      ? { left: -1 }
      : { right: -1 };

  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={position === "before" ? "Insert column to the left" : "Insert column to the right"}
      aria-label={position === "before" ? "Insert column to the left" : "Insert column to the right"}
      initial={false}
      whileHover="hover"
      whileTap={{ scale: 0.94 }}
      className="absolute top-0 bottom-0 z-10 flex items-center justify-center cursor-pointer group/addcol"
      style={{
        ...edgeStyle,
        width: 14,
      }}
    >
      {/* Vertical guide rail */}
      <motion.span
        variants={{
          hover: { opacity: 1, width: 2 },
        }}
        initial={{ opacity: 0.18, width: 1 }}
        animate={{ opacity: 0.18, width: 1 }}
        transition={{ duration: 0.15 }}
        className="absolute top-1 bottom-1 rounded-full"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          background: "hsl(213 72% 45%)",
        }}
      />
      {/* Plus glyph */}
      <motion.span
        variants={{
          hover: { opacity: 1, scale: 1 },
        }}
        initial={{ opacity: 0.35, scale: 0.85 }}
        animate={{ opacity: 0.35, scale: 0.85 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: 14,
          height: 14,
          background: "hsl(213 72% 45%)",
          color: "#fff",
          boxShadow: "0 0 0 1.5px hsl(0 0% 100%)",
        }}
      >
        <Plus size={9} strokeWidth={3} />
      </motion.span>
    </motion.button>
  );
};

export default AddColumnButton;
