import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Pencil, Mic } from "lucide-react";

const FONT = "'DM Sans', system-ui, sans-serif";

interface Props {
  onEditManually?: () => void;
  onTellLuka?: () => void;
  /** Visual variant for the trigger button */
  variant?: "outline" | "primary";
}

/**
 * Shared Edit dropdown used across preview panels (Populate Checklists,
 * Generate Letters, FS Generation, Notes Generator). Two options:
 *   1. Edit Manually
 *   2. Tell Luka what to change
 */
const EditMenuDropdown = ({
  onEditManually,
  onTellLuka,
  variant = "outline",
}: Props) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const triggerStyle =
    variant === "primary"
      ? {
          background: "hsl(0 0% 100%)",
          border: "1px solid hsl(220 95% 50%)",
          color: "hsl(220 95% 45%)",
        }
      : {
          background: "hsl(0 0% 100%)",
          border: "1px solid hsl(220 20% 80%)",
          color: "hsl(222 35% 16%)",
        };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold transition-colors hover:bg-[hsl(220_20%_96%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(265_75%_55%)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        style={{ ...triggerStyle, fontFamily: FONT }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Edit
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: "inline-flex" }}
        >
          <ChevronDown size={13} strokeWidth={2.4} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 mt-1.5 rounded-[12px] overflow-hidden"
            style={{
              width: 260,
              background: "hsl(0 0% 100%)",
              border: "1.5px solid hsl(215 75% 22%)",
              boxShadow:
                "0 12px 32px hsl(220 40% 22% / 0.16), 0 4px 12px hsl(220 40% 22% / 0.08)",
              zIndex: 60,
              fontFamily: FONT,
            }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onEditManually?.();
              }}
              className="w-full text-left px-4 py-3 transition-colors hover:bg-[hsl(220_20%_96%)]"
            >
              <div className="flex items-center gap-2.5">
                <Pencil
                  size={14}
                  strokeWidth={2.4}
                  style={{ color: "hsl(215 75% 22%)" }}
                />
                <span
                  className="text-[14px] font-bold"
                  style={{ color: "hsl(215 75% 18%)" }}
                >
                  Edit Manually
                </span>
              </div>
              <div
                className="text-[12.5px] mt-1 pl-[22px]"
                style={{ color: "hsl(222 15% 55%)" }}
              >
                Edit text on your own
              </div>
            </button>

            <div
              style={{
                height: 1,
                background: "hsl(220 20% 90%)",
                margin: "0 12px",
              }}
            />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onTellLuka?.();
              }}
              className="w-full text-left px-4 py-3 transition-colors hover:bg-[hsl(220_20%_96%)]"
            >
              <div className="flex items-center gap-2.5">
                <Mic
                  size={14}
                  strokeWidth={2.4}
                  style={{ color: "hsl(215 75% 22%)" }}
                />
                <span
                  className="text-[14px] font-bold"
                  style={{ color: "hsl(215 75% 18%)" }}
                >
                  Tell Luka what to change
                </span>
              </div>
              <div
                className="text-[12.5px] mt-1 pl-[22px]"
                style={{ color: "hsl(222 15% 55%)" }}
              >
                Voice your edits to Luka
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditMenuDropdown;
