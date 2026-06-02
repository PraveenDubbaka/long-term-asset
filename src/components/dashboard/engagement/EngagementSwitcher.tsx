import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

type EngagementStatus = "New" | "In Progress" | "Completed";

interface EngagementOption {
  id: string;
  code: string;
  client: string;
  status: EngagementStatus;
}

const engagements: EngagementOption[] = [
  { id: "COM-GRN-Dec312024", code: "COM-GRN-Dec312024", client: "Shipping Line Inc.", status: "In Progress" },
  { id: "COM-PAT-Dec312024", code: "COM-PAT-Dec312024", client: "Patrick Industries", status: "Completed" },
  { id: "COM-CON-Dec312024", code: "COM-CON-Dec312024", client: "Consolidated Corp.", status: "In Progress" },
  { id: "REV-ALT-Mar312025", code: "REV-ALT-Mar312025", client: "Altitude Holdings", status: "New" },
  { id: "AUD-SKY-Jun302025", code: "AUD-SKY-Jun302025", client: "Skybridge Ventures", status: "New" },
  { id: "COM-NVA-Dec312024", code: "COM-NVA-Dec312024", client: "Nova Electronics", status: "Completed" },
];

const statusStyles: Record<EngagementStatus, { bg: string; text: string; border: string }> = {
  New: {
    bg: "hsl(var(--status-new) / 0.1)",
    text: "hsl(var(--status-new))",
    border: "hsl(var(--status-new) / 0.25)",
  },
  "In Progress": {
    bg: "hsl(var(--status-progress) / 0.1)",
    text: "hsl(var(--status-progress))",
    border: "hsl(var(--status-progress) / 0.25)",
  },
  Completed: {
    bg: "hsl(var(--status-completed) / 0.1)",
    text: "hsl(var(--status-completed))",
    border: "hsl(var(--status-completed) / 0.25)",
  },
};

interface EngagementSwitcherProps {
  currentEngagementId: string;
  clientName: string;
}

const EngagementSwitcher = ({ currentEngagementId, clientName }: EngagementSwitcherProps) => {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <motion.button
        className="flex items-center gap-0 py-1.5 rounded-[10px] text-sm font-medium cursor-pointer"
        style={{
          background: hovered || open ? "hsl(var(--primary) / 0.06)" : "hsl(var(--accent))",
          color: "hsl(var(--foreground))",
          border: hovered || open ? "1px solid hsl(var(--primary) / 0.25)" : "1px solid hsl(var(--border))",
          paddingLeft: hovered || open ? 12 : 10,
          paddingRight: hovered || open ? 12 : 10,
          transition: "all 0.25s ease",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.97 }}
      >
        <Inbox size={15} style={{ color: "hsl(var(--primary))" }} className="shrink-0" />
        <div
          className="flex items-center gap-2 whitespace-nowrap overflow-hidden"
          style={{
            maxWidth: hovered || open ? 400 : 0,
            opacity: hovered || open ? 1 : 0,
            marginLeft: hovered || open ? 8 : 0,
            transition: "max-width 0.3s ease, opacity 0.25s ease, margin-left 0.25s ease",
          }}
        >
          <span className="font-semibold">{currentEngagementId}</span>
          <span className="w-px h-4 bg-border" />
          <span>{clientName}</span>
          <div className="flex flex-col gap-[2.5px] items-center ml-0.5">
            <span className="block rounded-full" style={{ width: 3, height: 3, background: "hsl(var(--primary) / 0.4)" }} />
            <span className="block rounded-full" style={{ width: 3, height: 3, background: "hsl(var(--primary) / 0.6)" }} />
            <span className="block rounded-full" style={{ width: 3, height: 3, background: "hsl(var(--primary) / 0.4)" }} />
          </div>
        </div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.7 }}
            style={{
              transformOrigin: "top left",
              background: "hsl(var(--card))",
              border: "1.5px solid #0C2D56",
              boxShadow: "0 10px 32px hsl(220 30% 10% / 0.10), 0 2px 8px hsl(220 20% 10% / 0.05)",
            }}
            className="absolute left-0 top-full mt-1.5 w-[520px] rounded-[12px] z-50 overflow-hidden p-2"
          >
            <div className="grid grid-cols-2 gap-1.5">
              {engagements.map((eng) => {
                const isSelected = eng.id === currentEngagementId;
                const style = statusStyles[eng.status];
                return (
                  <motion.button
                    key={eng.id}
                    className="flex flex-col gap-1.5 p-3 rounded-[10px] text-left cursor-pointer relative"
                    style={{
                      background: isSelected ? "hsl(var(--primary) / 0.06)" : "transparent",
                      border: isSelected ? "1px solid hsl(var(--primary) / 0.2)" : "1px solid transparent",
                    }}
                    whileHover={{
                      backgroundColor: isSelected ? "hsl(var(--primary) / 0.08)" : "hsl(var(--accent))",
                    }}
                    onClick={() => {
                      setOpen(false);
                      if (!isSelected) {
                        navigate(`/engagements/${eng.id}`, { state: { from: "engagements" } });
                      }
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-semibold text-foreground">{eng.code}</span>
                      {isSelected && (
                        <Check size={14} style={{ color: "#0C2D56" }} strokeWidth={2.5} />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate w-full">{eng.client}</span>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-[6px] w-fit"
                      style={{
                        background: style.bg,
                        color: style.text,
                        border: `1px solid ${style.border}`,
                      }}
                    >
                      {eng.status}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EngagementSwitcher;
