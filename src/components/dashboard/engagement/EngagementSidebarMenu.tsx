import { useState, useRef, useEffect, useCallback } from "react";
import { Search, FolderOpen, FolderClosed, FileText, Plus, ChevronsUpDown } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MenuItem {
  code: string;
  label: string;
  type: "folder" | "document" | "form";
  children?: MenuItem[];
  hasPlus?: boolean;
  hideCode?: boolean;
  isLeaf?: boolean;
}

const menuData: MenuItem[] = [
  {
    code: "CO",
    label: "Client Onboarding",
    type: "folder",
    children: [
      { code: "CA", label: "Client acceptance and co...", type: "document" },
      { code: "IND", label: "Independence", type: "document" },
      { code: "KCB", label: "Knowledge of client busi...", type: "document" },
      { code: "PL", label: "Planning", type: "document" },
      { code: "EL", label: "Engagement Letter", type: "form" },
      { code: "MR", label: "Management responsibilit...", type: "form" },
    ],
  },
  {
    code: "DO",
    label: "Documents",
    type: "folder",
    hasPlus: true,
    children: [
      { code: "SHA", label: "Shareholders Agreement", type: "folder" },
      { code: "RLA", label: "Rent/Lease Agreement", type: "folder" },
      { code: "INC", label: "Incorporation Documents", type: "folder" },
      { code: "BKA", label: "Banking Agreements", type: "folder" },
    ],
  },
  {
    code: "TB",
    label: "Trial Balance & Adj. Entries",
    type: "folder",
    isLeaf: true,
    children: [],
  },
  {
    code: "PR",
    label: "Procedures",
    type: "folder",
    children: [
      {
        code: "",
        label: "Assets",
        type: "folder",
        hideCode: true,
        children: [
          { code: "", label: "Current assets", type: "folder", hideCode: true, children: [
            { code: "A", label: "Cash and cash equivalents", type: "document" },
            { code: "B", label: "Accounts receivable", type: "document" },
            { code: "C", label: "Inventories", type: "document" },
            { code: "D", label: "Short-term investments", type: "document" },
            { code: "E", label: "Loans and notes receivable", type: "document" },
            { code: "I", label: "Other current assets", type: "document" },
          ]},
          { code: "", label: "Property, plant and equipment", type: "folder", hideCode: true, children: [
            { code: "H", label: "Property, plant and equipment", type: "document" },
          ]},
          { code: "", label: "Long-term assets", type: "folder", hideCode: true, children: [
            { code: "K", label: "Long-term investments", type: "document" },
          ]},
        ],
      },
      {
        code: "",
        label: "Liabilities",
        type: "folder",
        hideCode: true,
        children: [
          { code: "", label: "Current liabilities", type: "folder", hideCode: true, children: [
            { code: "BB", label: "Accounts payable", type: "document" },
            { code: "CC", label: "Taxes payable", type: "document" },
            { code: "DD", label: "Short-term debt", type: "document" },
          ]},
          { code: "", label: "Long-term liabilities", type: "folder", hideCode: true, children: [
            { code: "JJ", label: "Other long-term liabilities", type: "document" },
            { code: "KK", label: "Long-term debt", type: "document" },
            { code: "MM", label: "Due to members", type: "document" },
          ]},
        ],
      },
      {
        code: "",
        label: "Equity",
        type: "folder",
        hideCode: true,
        children: [
          { code: "", label: "Share capital", type: "folder", hideCode: true, children: [
            { code: "TT", label: "Equity", type: "document" },
          ]},
        ],
      },
      {
        code: "",
        label: "Revenue",
        type: "folder",
        hideCode: true,
        children: [
          { code: "", label: "Revenue", type: "folder", hideCode: true, children: [
            { code: "20", label: "Revenue", type: "document" },
          ]},
        ],
      },
      {
        code: "",
        label: "Cost of sales",
        type: "folder",
        hideCode: true,
        children: [
          { code: "", label: "Cost of sales", type: "folder", hideCode: true, children: [
            { code: "30", label: "Cost of sales", type: "document" },
          ]},
        ],
      },
      {
        code: "",
        label: "Expenses",
        type: "folder",
        hideCode: true,
        children: [
          { code: "", label: "Operating expenses", type: "folder", hideCode: true, children: [
            { code: "40", label: "Operating expenses", type: "document" },
          ]},
          { code: "", label: "Other Expenses (Income)", type: "folder", hideCode: true, children: [
            { code: "80", label: "Unrealized gains losses", type: "document" },
          ]},
        ],
      },
    ],
  },
  {
    code: "FS",
    label: "Financial Statements",
    type: "folder",
    hasPlus: true,
    children: [
      { code: "CP", label: "Cover Page", type: "document", hideCode: true },
      { code: "TOC", label: "Table of Contents", type: "document", hideCode: true },
      { code: "CR", label: "Compilation Report", type: "document", hideCode: true },
      { code: "BS", label: "Balance Sheet", type: "document", hideCode: true },
      { code: "SIL", label: "Statement of Income Loss", type: "document", hideCode: true },
      { code: "SCF", label: "Statement of Cash Flows", type: "document", hideCode: true },
      { code: "NFS", label: "Notes to Financial Information", type: "document", hideCode: true },
    ],
  },
  {
    code: "SO",
    label: "Completion & Signoffs",
    type: "folder",
    children: [
      { code: "CM", label: "Completion", type: "document" },
      { code: "SO", label: "Signoffs", type: "document" },
      { code: "FR", label: "Final Review", type: "document" },
    ],
  },
];

const ItemIcon = ({ type, isOpen }: { type: "folder" | "document" | "form"; isOpen?: boolean }) => {
  if (type === "folder") {
    const Icon = isOpen ? FolderOpen : FolderClosed;
    return <Icon size={16} className="text-muted-foreground shrink-0" />;
  }
  if (type === "form") return <FileText size={16} className="text-amber-600 shrink-0" />;
  return <FileText size={16} className="text-muted-foreground shrink-0" />;
};

interface RecursiveMenuItemProps {
  item: MenuItem;
  expandedFolders: string[];
  toggleFolder: (key: string) => void;
  onSelectItem?: (label: string) => void;
  depth: number;
}

const RecursiveMenuItem = ({ item, expandedFolders, toggleFolder, onSelectItem, depth }: RecursiveMenuItemProps) => {
  const folderKey = item.code || item.label;
  const isExpanded = expandedFolders.includes(folderKey);
  const hasChildren = item.children && item.children.length > 0;
  const isFolder = item.type === "folder" && hasChildren;

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (isFolder && !item.isLeaf) {
            toggleFolder(folderKey);
          } else {
            onSelectItem?.(item.label);
          }
        }}
        className="w-full flex items-center gap-2 px-2 py-2 rounded-[8px] hover:bg-accent transition-colors group"
        style={{ fontSize: "15px" }}
      >
        {isFolder && !item.isLeaf ? (
          <div className="flex flex-col gap-[3px] items-center shrink-0 w-[14px]">
            <motion.span
              className="block rounded-full"
              style={{ width: 3.5, height: 3.5, background: "hsl(var(--primary) / 0.5)" }}
              animate={isExpanded ? { y: 1.5, opacity: 0.3 } : { y: 0, opacity: 0.7 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="block rounded-full"
              style={{ width: 3.5, height: 3.5, background: "hsl(var(--primary) / 0.7)" }}
              animate={isExpanded ? { scale: 1.4 } : { scale: 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="block rounded-full"
              style={{ width: 3.5, height: 3.5, background: "hsl(var(--primary) / 0.5)" }}
              animate={isExpanded ? { y: -1.5, opacity: 0.3 } : { y: 0, opacity: 0.7 }}
              transition={{ duration: 0.2 }}
            />
          </div>
        ) : (
          <span className="w-[14px] shrink-0" />
        )}
        <ItemIcon type={item.type} isOpen={isExpanded} />
        {!item.hideCode && item.code && (
          <span className="font-semibold mr-1" style={{ fontSize: "15px", color: "hsl(270 70% 55%)" }}>{item.code}</span>
        )}
        <span className={`${depth === 0 ? "font-semibold" : item.type === "folder" ? "font-medium" : ""} text-foreground truncate flex-1 text-left`} style={{ fontSize: "15px" }}>{item.label}</span>
        {item.hasPlus && (
          <Plus size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.7 }}
            className="ml-5 pl-3 border-l border-border/50 overflow-hidden"
          >
            {item.children!.map((child, idx) => (
              <motion.div
                key={(child.code || child.label) + idx}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.2 }}
              >
                <RecursiveMenuItem
                  item={child}
                  expandedFolders={expandedFolders}
                  toggleFolder={toggleFolder}
                  onSelectItem={onSelectItem}
                  depth={depth + 1}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MIN_WIDTH = 48;
const DEFAULT_WIDTH = 280;
const MAX_WIDTH = 480;
const COLLAPSED_WIDTH = 80;

interface EngagementSidebarMenuProps {
  onSelectItem?: (label: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const EngagementSidebarMenu = ({ onSelectItem, collapsed = false, onToggleCollapse }: EngagementSidebarMenuProps) => {
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["CO"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [isHoveringEdge, setIsHoveringEdge] = useState(false);
  const [isHoveringPanel, setIsHoveringPanel] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const allCodes = menuData.map((m) => m.code);
  const allExpanded = allCodes.every((c) => expandedFolders.includes(c));

  const toggleFolder = (code: string) => {
    setExpandedFolders((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleAll = () => {
    setExpandedFolders(allExpanded ? [] : allCodes);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      let newWidth = e.clientX - sidebarLeft;
      
      // Snap to collapsed if dragged below threshold
      if (newWidth < 80) {
        onToggleCollapse?.();
        setIsResizing(false);
        return;
      }
      
      newWidth = Math.max(200, Math.min(MAX_WIDTH, newWidth));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, onToggleCollapse]);

  if (collapsed) {
    return (
      <div
        ref={sidebarRef}
        className="relative h-full border-r bg-card flex flex-col sticky top-0 items-center py-3 transition-all duration-200 rounded-l-[16px] group/sidebar"
        style={{ width: COLLAPSED_WIDTH, minWidth: COLLAPSED_WIDTH, borderRightColor: "hsl(var(--foreground) / 0.15)" }}
        onMouseEnter={() => setIsHoveringPanel(true)}
        onMouseLeave={() => setIsHoveringPanel(false)}
      >
        {/* Collapse/Expand toggle - dots on hover */}
        <motion.button
          onClick={onToggleCollapse}
          className="p-2 rounded-[8px] hover:bg-accent transition-all duration-200 mb-3"
          title="Expand sidebar"
        >
          <div className="flex flex-col gap-[3px] items-center w-[14px]">
            <span className="block rounded-full" style={{ width: 3.5, height: 3.5, background: "hsl(var(--primary) / 0.5)" }} />
            <span className="block rounded-full" style={{ width: 3.5, height: 3.5, background: "hsl(var(--primary) / 0.7)" }} />
            <span className="block rounded-full" style={{ width: 3.5, height: 3.5, background: "hsl(var(--primary) / 0.5)" }} />
          </div>
        </motion.button>
        {menuData.map((item) => (
          <button
            key={item.code}
            onClick={() => {
              onToggleCollapse?.();
              toggleFolder(item.code);
            }}
            className="flex items-center gap-1.5 px-2 py-2 rounded-[8px] hover:bg-accent transition-colors mb-1 w-full"
            title={`${item.code} - ${item.label}`}
          >
            <ItemIcon type={item.type} />
            <span className="text-xs font-medium text-muted-foreground">{item.code}</span>
          </button>
        ))}

        {/* Resize edge */}
        <div
          className="absolute top-0 right-0 w-[5px] h-full cursor-col-resize z-10"
          onMouseDown={handleMouseDown}
          onMouseEnter={() => setIsHoveringEdge(true)}
          onMouseLeave={() => !isResizing && setIsHoveringEdge(false)}
        >
          <motion.div
            className="absolute top-0 right-0 w-[2px] h-full rounded-full"
            animate={{
              backgroundColor: isResizing
                ? "hsl(207 71% 38%)"
                : isHoveringEdge
                ? "hsl(207 71% 38% / 0.5)"
                : "transparent",
            }}
            transition={{ duration: 0.15 }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={sidebarRef}
      className="relative h-full border-r bg-card flex flex-col sticky top-0 transition-all duration-100 rounded-l-[16px] group/sidebar"
      style={{ width: sidebarWidth, minWidth: 200, borderRightColor: "hsl(var(--foreground) / 0.15)" }}
      onMouseEnter={() => setIsHoveringPanel(true)}
      onMouseLeave={() => setIsHoveringPanel(false)}
    >
      {/* Header: Search + Signoffs + Expand/Collapse */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="relative mb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-[8px] border border-border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          {/* Dots toggle - visible on hover */}
          <motion.button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-[8px] hover:bg-accent transition-all duration-200 shrink-0"
            title="Collapse sidebar"
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex flex-col gap-[3px] items-center w-[14px]">
              <span className="block rounded-full" style={{ width: 3.5, height: 3.5, background: "hsl(var(--primary) / 0.5)" }} />
              <span className="block rounded-full" style={{ width: 3.5, height: 3.5, background: "hsl(var(--primary) / 0.7)" }} />
              <span className="block rounded-full" style={{ width: 3.5, height: 3.5, background: "hsl(var(--primary) / 0.5)" }} />
            </div>
          </motion.button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
            title={allExpanded ? "Collapse all" : "Expand all"}
          >
            <div className="flex flex-col gap-[2.5px] items-center w-[12px]">
              <span className="block rounded-full" style={{ width: 3, height: 3, background: "hsl(var(--primary) / 0.5)" }} />
              <span className="block rounded-full" style={{ width: 3, height: 3, background: "hsl(var(--primary) / 0.7)" }} />
              <span className="block rounded-full" style={{ width: 3, height: 3, background: "hsl(var(--primary) / 0.5)" }} />
            </div>
            {allExpanded ? "Collapse" : "Expand"}
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border text-sm font-medium ml-auto transition-colors hover:bg-accent"
            style={{
              borderColor: "hsl(var(--border))",
              color: "hsl(var(--foreground))",
            }}
          >
            <CheckCircle2 size={14} style={{ color: "hsl(142 71% 45%)" }} />
            Signoffs
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {menuData.map((item) => (
          <RecursiveMenuItem
            key={item.code + item.label}
            item={item}
            expandedFolders={expandedFolders}
            toggleFolder={toggleFolder}
            onSelectItem={onSelectItem}
            depth={0}
          />
        ))}
      </div>

      {/* Resize handle on right edge */}
      <div
        className="absolute top-0 right-0 w-[5px] h-full cursor-col-resize z-10"
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHoveringEdge(true)}
        onMouseLeave={() => !isResizing && setIsHoveringEdge(false)}
      >
        <motion.div
          className="absolute top-0 right-0 w-[2px] h-full rounded-full"
          animate={{
            backgroundColor: isResizing
              ? "hsl(207 71% 38%)"
              : isHoveringEdge
              ? "hsl(207 71% 38% / 0.5)"
              : "transparent",
          }}
          transition={{ duration: 0.15 }}
        />
      </div>
    </div>
  );
};

export default EngagementSidebarMenu;
