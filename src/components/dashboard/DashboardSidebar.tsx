import { useState, useCallback, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Inbox,
  FileText,
  Headphones,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import lukaLogo from "@/assets/luka-logo.png";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Teams", path: "/teams" },
  { icon: UserCircle, label: "Clients", path: "/clients" },
  { icon: Inbox, label: "Engagements", path: "/engagements" },
  { icon: FileText, label: "Dynamic Templates", path: "/templates" },
];

const COLLAPSED_WIDTH = 56;
const EXPANDED_WIDTH = 220;

const springTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 28,
  mass: 0.8,
};

export const SidebarContext = createContext<{ expanded: boolean }>({ expanded: false });
export const useSidebarState = () => useContext(SidebarContext);

interface DashboardSidebarProps {
  onExpandChange?: (expanded: boolean) => void;
}

/* Collapse / Sidebar-toggle icon (matches source) */
const SidebarToggleIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className="shrink-0"
    aria-hidden="true"
  >
    <path d="M20.25 7c0-.69-.56-1.25-1.25-1.25H9.75v12.5H19c.69 0 1.25-.56 1.25-1.25zM3.75 17c0 .69.56 1.25 1.25 1.25h3.25V5.75H5c-.69 0-1.25.56-1.25 1.25zm18 0A2.75 2.75 0 0 1 19 19.75H5A2.75 2.75 0 0 1 2.25 17V7A2.75 2.75 0 0 1 5 4.25h14A2.75 2.75 0 0 1 21.75 7z" />
  </svg>
);

const DashboardSidebar = ({ onExpandChange }: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  const setExpandedAndNotify = useCallback(
    (next: boolean) => {
      setExpanded(next);
      onExpandChange?.(next);
    },
    [onExpandChange]
  );

  return (
    <TooltipProvider delayDuration={200}>
      <motion.aside
        initial={false}
        animate={{ width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
        transition={springTransition}
        className="sticky left-0 top-0 h-screen flex flex-col py-4 z-50 overflow-hidden shrink-0"
        style={{ background: "hsl(var(--sidebar-bg))" }}
      >
        {/* Logo + brand row */}
        <div
          className={`h-10 mb-4 flex items-center ${
            expanded ? "px-3 w-full justify-between" : "justify-center w-full cursor-pointer"
          }`}
          onClick={() => !expanded && setExpandedAndNotify(true)}
          title={!expanded ? "Expand sidebar" : undefined}
        >
          {expanded ? (
            <>
              <div className="flex items-center gap-2.5 pointer-events-none">
                <img src={lukaLogo} alt="Luka" className="w-7 h-7 object-contain" />
                <span className="text-sm font-semibold whitespace-nowrap text-white">
                  Countable
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedAndNotify(false);
                }}
                aria-label="Collapse sidebar"
                className="w-7 h-7 rounded-md flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <SidebarToggleIcon size={16} />
              </button>
            </>
          ) : (
            <div className="relative w-10 h-10 flex items-center justify-center group/logo">
              <img
                src={lukaLogo}
                alt="Luka"
                className="w-7 h-7 object-contain transition-opacity duration-200 group-hover/logo:opacity-0"
              />
              <span className="absolute opacity-0 group-hover/logo:opacity-100 transition-opacity duration-200 text-white">
                <SidebarToggleIcon size={20} />
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 flex-1 w-full px-2">
          {sidebarItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));

            const button = (
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.97 }}
                className={`sidebar-icon-btn w-full flex items-center gap-3 ${isActive ? "active" : ""}`}
                style={{
                  justifyContent: expanded ? "flex-start" : "center",
                  paddingLeft: expanded ? 12 : undefined,
                }}
                onClick={() => navigate(item.path)}
              >
                <item.icon size={20} className="shrink-0" />
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );

            if (!expanded) {
              return (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={12}
                    className="px-3 py-1.5 text-xs font-medium rounded-[8px] border-0 shadow-lg"
                    style={{ background: "hsl(209, 75%, 19%)", color: "#fff" }}
                  >
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}
        </nav>

        {/* Bottom: Support */}
        <div className="flex flex-col items-center gap-3 mb-2 w-full px-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className={`sidebar-icon-btn ${expanded ? "w-full flex items-center gap-3" : ""}`}
                style={expanded ? { justifyContent: "flex-start", paddingLeft: 12 } : undefined}
                title="Support"
              >
                <Headphones size={20} className="shrink-0" />
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      Help & Support
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </TooltipTrigger>
            {!expanded && (
              <TooltipContent
                side="right"
                sideOffset={12}
                className="px-3 py-1.5 text-xs font-medium rounded-[8px] border-0 shadow-lg"
                style={{ background: "hsl(209, 75%, 19%)", color: "#fff" }}
              >
                Help & Support
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
};

export default DashboardSidebar;
