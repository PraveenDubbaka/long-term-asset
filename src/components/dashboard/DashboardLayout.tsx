import { useState } from "react";
import { motion } from "framer-motion";
import DashboardSidebar from "./DashboardSidebar";
import HelpSupportWidget from "./HelpSupportWidget";

interface DashboardLayoutProps {
  children: React.ReactNode;
  allowPageScroll?: boolean;
}

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

const DashboardLayout = ({ children, allowPageScroll = false }: DashboardLayoutProps) => {
  const [, setSidebarExpanded] = useState(false);

  return (
    // Outer shell uses the navy sidebar background so the header and sidebar
    // blend seamlessly; the content area carves into it with rounded corners.
    <div className={`${allowPageScroll ? "min-h-screen" : "min-h-screen h-screen"} flex bg-sidebar-bg`}>
      <DashboardSidebar onExpandChange={setSidebarExpanded} />
      <motion.div
        className={`dashboard-shell min-w-0 flex-1 flex flex-col bg-sidebar-bg ${allowPageScroll ? "min-h-screen" : "overflow-hidden h-screen"}`}
        layout
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <motion.div
          className={`${allowPageScroll ? "min-h-screen" : "min-h-0 h-full"} flex-1 flex flex-col`}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {children}
        </motion.div>
      </motion.div>
      <HelpSupportWidget />
    </div>
  );
};

export default DashboardLayout;
