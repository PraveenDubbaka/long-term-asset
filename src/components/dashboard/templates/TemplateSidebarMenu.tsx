import { useState, useRef, useEffect, useCallback } from "react";
import { Search, FileText, Plus, ChevronDown, Check, BadgeCheck } from "lucide-react";
import { FolderSolidIcon, FolderPlusIcon, FolderMinusIcon } from "@/components/icons/FolderIcons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface MenuItem {
  code: string;
  label: string;
  type: "folder" | "document" | "form";
  children?: MenuItem[];
  hasPlus?: boolean;
  isLeaf?: boolean;
}

const engagementTemplatesDefault: MenuItem[] = [
  {
    code: "COMP",
    label: "Compilations",
    type: "folder",
    children: [
      { code: "CSRS1", label: "Compilation CSRS 4200 1", type: "document" },
    ],
  },
  {
    code: "REVW",
    label: "Review",
    type: "folder",
    children: [
      { code: "RS2400", label: "Review Section 2400", type: "document" },
    ],
  },
  {
    code: "TAXF",
    label: "Tax",
    type: "folder",
    children: [
      { code: "T2CORP", label: "T2 (Corporations)", type: "document" },
    ],
  },
];

const myTemplatesDefault: MenuItem[] = [
  {
    code: "COMP",
    label: "Compilations",
    type: "folder",
    children: [
      { code: "CS1", label: "GAAP Year-End Compilation", type: "document" },
      { code: "CS2", label: "OCBOA Compilation", type: "document" },
      { code: "CS3", label: "NPO Compilation", type: "document" },
      { code: "CS4", label: "Sole Proprietor Compilation", type: "document" },
      { code: "CS5", label: "Partnership Compilation", type: "document" },
      { code: "CC1", label: "Multi-Entity Consolidation", type: "document" },
      { code: "CC2", label: "Parent-Subsidiary Compilation", type: "document" },
    ],
  },
  {
    code: "REVW",
    label: "Review",
    type: "folder",
    children: [
      { code: "RS1", label: "Interim Review", type: "document" },
      { code: "RS2", label: "Annual Review", type: "document" },
      { code: "RS3", label: "HOA / Condo Review", type: "document" },
      { code: "RS4", label: "Employee Benefit Plan Review", type: "document" },
      { code: "RC1", label: "Consolidated Group Review", type: "document" },
    ],
  },
  {
    code: "TAXF",
    label: "Tax",
    type: "folder",
    children: [
      { code: "T2CORP", label: "T2 (Corporations)", type: "document" },
    ],
  },
];

const makeEntityTemplates = (prefix: string, codePrefix: string): MenuItem[] => [
  { code: `${codePrefix}COMP`, label: "Compilations", type: "folder", children: [
    { code: `${codePrefix}CS1`, label: `${prefix} GAAP-Compiled Financial Statements`, type: "document" },
  ]},
  { code: `${codePrefix}REVW`, label: "Review", type: "folder", children: [
    { code: `${codePrefix}RS1`, label: `${prefix} GAAP-Reviewed Financial Statements`, type: "document" },
  ]},
  { code: `${codePrefix}TAXF`, label: "Tax", type: "folder", children: [
    { code: `${codePrefix}TS1`, label: `${prefix} GAAP-Financial Statements — Income Tax Basis`, type: "document" },
  ]},
];

const makeCanadaEntityTemplates = (prefix: string, codePrefix: string): MenuItem[] => [
  { code: `${codePrefix}COMP`, label: "Compilations", type: "folder", children: [
    { code: `${codePrefix}CS1`, label: `${prefix} ASPE-Compiled Financial Statements`, type: "document" },
  ]},
  { code: `${codePrefix}REVW`, label: "Review", type: "folder", children: [
    { code: `${codePrefix}RS1`, label: `${prefix} ASPE-Reviewed Financial Statements`, type: "document" },
  ]},
  { code: `${codePrefix}TAXF`, label: "Tax", type: "folder", children: [
    { code: `${codePrefix}TS1`, label: `${prefix} ASPE-Financial Statements — Income Tax Basis`, type: "document" },
  ]},
];

const myTemplatesByEntity: Record<string, MenuItem[]> = {
  "C-Corp": makeEntityTemplates("C-Corp", ""),
  "S-Corp": makeEntityTemplates("S-Corp", ""),
  "Partnership": makeEntityTemplates("Partnership", ""),
  "LLC (Single Member)": makeEntityTemplates("LLC (Single Member)", ""),
  "LLC (Multiple Members)": makeEntityTemplates("LLC (Multiple Members)", ""),
  "Sole Proprietorship": makeEntityTemplates("Sole Proprietorship", ""),
  "Trust": makeEntityTemplates("Trust", ""),
};

const myCanadaTemplatesByEntity: Record<string, MenuItem[]> = {
  "Corporations": makeCanadaEntityTemplates("Corporations", ""),
  "Partnership": makeCanadaEntityTemplates("Partnership", ""),
  "LLC (Single Member)": makeCanadaEntityTemplates("LLC (Single Member)", ""),
  "LLC (Multiple Members)": makeCanadaEntityTemplates("LLC (Multiple Members)", ""),
  "Sole Proprietorship": makeCanadaEntityTemplates("Sole Proprietorship", ""),
  "Trust": makeCanadaEntityTemplates("Trust", ""),
};

const globalTemplatesByEntity: Record<string, MenuItem[]> = {
  Corporations: makeCanadaEntityTemplates("Corporations", "G"),
  "C-Corp": makeEntityTemplates("C-Corp", "G"),
  "S-Corp": makeEntityTemplates("S-Corp", "G"),
  "Partnership": makeCanadaEntityTemplates("Partnership", "G"),
  "LLC (Single Member)": makeCanadaEntityTemplates("LLC (Single Member)", "G"),
  "LLC (Multiple Members)": makeCanadaEntityTemplates("LLC (Multiple Members)", "G"),
  "Sole Proprietorship": makeCanadaEntityTemplates("Sole Proprietorship", "G"),
  "Trust": makeCanadaEntityTemplates("Trust", "G"),
  LLC: makeCanadaEntityTemplates("LLC", "G"),
  Partnerships: makeCanadaEntityTemplates("Partnership", "G"),
  Trusts: makeCanadaEntityTemplates("Trust", "G"),
  NFPs: [
    { code: "GCOMP", label: "Compilations", type: "folder", children: [
      { code: "GCS1", label: "NFP Compilation", type: "document" },
    ]},
    { code: "GREVW", label: "Review", type: "folder", children: [
      { code: "GRS1", label: "NFP Review", type: "document" },
    ]},
    { code: "GTAX", label: "Tax", type: "folder", children: [
      { code: "GTS1", label: "Non-Profit Return", type: "document" },
    ]},
  ],
};
const ItemIcon = ({
  type,
  isOpen,
  hasChildren,
}: {
  type: "folder" | "document" | "form";
  isOpen?: boolean;
  hasChildren?: boolean;
}) => {
  // Use Countable Blue (#1C63A6 = hsl(207 71% 38%)) to match source design system
  const folderColor = "hsl(207 71% 38%)";
  if (type === "folder") {
    if (!hasChildren) {
      return <FolderSolidIcon className="h-4 w-4 shrink-0 icon-folder" style={{ color: folderColor }} />;
    }
    return isOpen ? (
      <FolderMinusIcon className="h-4 w-4 shrink-0 icon-folder" style={{ color: folderColor }} />
    ) : (
      <FolderPlusIcon className="h-4 w-4 shrink-0 icon-folder" style={{ color: folderColor }} />
    );
  }
  if (type === "form") return <FileText className="h-4 w-4 text-amber-600 shrink-0 icon-doc" />;
  return <FileText className="h-4 w-4 text-primary shrink-0 icon-doc" />;
};

interface RecursiveMenuItemProps {
  item: MenuItem;
  expandedFolders: string[];
  toggleFolder: (key: string) => void;
  selectedItem: string | null;
  onSelectItem?: (label: string) => void;
  depth: number;
  searchQuery: string;
  publishedItems?: Set<string>;
}

const itemMatchesSearch = (item: MenuItem, query: string): boolean => {
  const q = query.toLowerCase();
  if (item.label.toLowerCase().includes(q) || item.code.toLowerCase().includes(q)) return true;
  if (item.children) return item.children.some(c => itemMatchesSearch(c, query));
  return false;
};

const RecursiveMenuItem = ({ item, expandedFolders, toggleFolder, selectedItem, onSelectItem, depth, searchQuery, publishedItems }: RecursiveMenuItemProps) => {
  const folderKey = item.code || item.label;
  const isExpanded = expandedFolders.includes(folderKey);
  const hasChildren = item.children && item.children.length > 0;
  const isFolder = item.type === "folder" && hasChildren;
  const isSelected = selectedItem === item.label;
  const isPublished = publishedItems?.has(item.label) && !isFolder;

  if (searchQuery && !itemMatchesSearch(item, searchQuery)) return null;

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
        className={`tpl-row w-full flex items-center gap-2 py-1.5 px-2 rounded-md group text-sm transition-colors ${
          isSelected && !isFolder
            ? ""
            : "hover:bg-muted text-foreground"
        }`}
        style={
          isSelected && !isFolder
            ? { backgroundColor: "hsl(207 71% 38% / 0.1)", color: "hsl(207 71% 38%)" }
            : undefined
        }
      >
        <ItemIcon type={item.type} isOpen={isExpanded} hasChildren={hasChildren} />
        <span
          className={`${
            item.type === "folder" ? "font-semibold" : isSelected ? "font-semibold" : "font-normal"
          } truncate flex-1 text-left`}
        >
          {item.label}
        </span>
        {isPublished && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="shrink-0 inline-flex items-center justify-center tpl-badge"
                  onClick={(e) => e.stopPropagation()}
                >
                  <BadgeCheck
                    className="h-4 w-4 text-emerald-600"
                    strokeWidth={2.25}
                    aria-label="Published"
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={6} className="text-xs">
                Published — read-only
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {item.hasPlus && !isPublished && (
          <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 icon-plus" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.7 }}
            className="ml-6 overflow-hidden"
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
                  selectedItem={selectedItem}
                  onSelectItem={onSelectItem}
                  depth={depth + 1}
                  searchQuery={searchQuery}
                  publishedItems={publishedItems}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TEMPLATE_TYPES = ["Engagements", "Financial Statements", "Letters", "Checklists", "Reports", "Notes to Financial Statements", "Worksheets"];
const COUNTRIES = ["US", "Canada"];
const US_ENTITY_TYPES = ["C-Corp", "S-Corp", "Partnership", "LLC (Single Member)", "LLC (Multiple Members)", "Sole Proprietorship", "Trust"];
const CA_ENTITY_TYPES = ["Corporations", "Partnership", "LLC (Single Member)", "LLC (Multiple Members)", "Sole Proprietorship", "Trust"];
const ENTITY_TYPES_DEFAULT = ["Corporations", "LLC", "Sole Proprietorship", "Partnerships", "Trusts", "NFPs"];



const DEFAULT_WIDTH = 280;
const MAX_WIDTH = 480;
const COLLAPSED_WIDTH = 80;

interface TemplateSidebarMenuProps {
  onSelectItem?: (label: string) => void;
  selectedItem: string | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onTabChange?: (tab: "my" | "global") => void;
  publishedItems?: Set<string>;
  onTemplateTypeChange?: (type: string) => void;
}

const TemplateSidebarMenu = ({ onSelectItem, selectedItem, collapsed = false, onToggleCollapse, onTabChange, publishedItems, onTemplateTypeChange }: TemplateSidebarMenuProps) => {
  const [activeTab, setActiveTab] = useState<"my" | "global">("my");
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["COMP"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [isHoveringEdge, setIsHoveringEdge] = useState(false);
  const [selectedTemplateType, setSelectedTemplateType] = useState("Engagements");
  const [selectedCountry, setSelectedCountry] = useState<string>("Canada");
  const [selectedEntityType, setSelectedEntityType] = useState("Corporations");
  const [templateTypeOpen, setTemplateTypeOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [entityTypeOpen, setEntityTypeOpen] = useState(false);

  const currentEntityTypes = selectedCountry === "US" ? US_ENTITY_TYPES : selectedCountry === "Canada" ? CA_ENTITY_TYPES : ENTITY_TYPES_DEFAULT;
  
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Map entity type names to globalTemplatesByEntity keys
  const entityKey = selectedEntityType === "Trust" ? "Trusts" : selectedEntityType === "Partnership" ? "Partnerships" : selectedEntityType;
  const globalTemplatesData = globalTemplatesByEntity[entityKey] || globalTemplatesByEntity["Corporations"];
  const currentMyTemplatesByEntity = selectedCountry === "Canada" ? myCanadaTemplatesByEntity : myTemplatesByEntity;
  
  // Determine which data to show based on template type
  let myTemplatesData: MenuItem[];
  if (selectedTemplateType === "Engagements") {
    myTemplatesData = engagementTemplatesDefault;
  } else if (selectedTemplateType === "Financial Statements" && selectedCountry && selectedEntityType && currentMyTemplatesByEntity[selectedEntityType]) {
    myTemplatesData = currentMyTemplatesByEntity[selectedEntityType];
  } else {
    myTemplatesData = myTemplatesDefault;
  }
  const activeData = activeTab === "my" ? myTemplatesData : (selectedTemplateType === "Engagements" ? engagementTemplatesDefault : globalTemplatesData);
  const allCodes = activeData.map((m) => m.code);
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
        className="relative h-full flex flex-col sticky top-0 items-center transition-all duration-200"
        style={{ width: 32, minWidth: 32 }}
      >
        {/* Vertical "Templates" tab — uses the soft gray panel surface */}
        <motion.button
          onClick={onToggleCollapse}
          className="absolute top-0 left-0 h-full w-full flex items-center justify-center cursor-pointer transition-colors"
          style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            borderRight: "1px solid hsl(var(--border))",
            background: "#f1f1f3",
          }}
          whileHover={{ backgroundColor: "hsl(var(--accent))" }}
          title="Expand Templates sidebar"
        >
          <span className="text-xs font-medium text-muted-foreground tracking-wide rotate-180 select-none">
            Templates
          </span>
        </motion.button>
      </div>
    );
  }

  return (
    <div
      ref={sidebarRef}
      className="relative h-full border-r flex flex-col sticky top-0 transition-all duration-100 shadow-md"
      style={{ width: sidebarWidth, minWidth: 200, borderRightColor: "hsl(var(--border))", background: "#f1f1f3" }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/70 space-y-3">
        {/* Subtitle */}
        <p className="text-sm text-foreground tracking-wide font-medium" style={{ fontSize: 14 }}>Select Template Type and Entity Type to view the templates</p>

        {/* Template Type & Entity Type Filters */}
        <div className="flex flex-col gap-2">
          {/* Template Type */}
          <Popover open={templateTypeOpen} onOpenChange={setTemplateTypeOpen}>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center justify-between px-3 py-2 rounded-[8px] border border-border bg-card/80 shadow-sm text-sm font-medium text-foreground hover:bg-card transition-colors">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-muted-foreground text-xs shrink-0">Type:</span>
                  <span className="truncate">{selectedTemplateType}</span>
                </div>
                <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-2" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1.5" align="start" sideOffset={4}>
              <p className="text-[11px] text-muted-foreground px-2 py-1 font-medium tracking-wide">Template Type</p>
              {TEMPLATE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => { setSelectedTemplateType(t); setTemplateTypeOpen(false); onTemplateTypeChange?.(t); }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-sm text-left transition-colors ${selectedTemplateType === t ? "bg-accent font-medium" : "hover:bg-accent/60"}`}
                >
                  {selectedTemplateType === t ? <Check size={13} className="text-primary shrink-0" /> : <span className="w-[13px] shrink-0" />}
                  <span className="text-foreground text-left">{t}</span>
                  {t === "Financial Statements" && (
                    <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground leading-none">New</span>
                  )}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Country */}
          {(
            <Popover open={countryOpen} onOpenChange={setCountryOpen}>
              <PopoverTrigger asChild>
                <button className="w-full flex items-center justify-between px-3 py-2 rounded-[8px] border border-border bg-card/80 shadow-sm text-sm font-medium text-foreground hover:bg-card transition-colors">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-muted-foreground text-xs shrink-0">Country:</span>
                    <span className="truncate">{selectedCountry || "Select Country"}</span>
                  </div>
                  <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-2" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1.5" align="start" sideOffset={4}>
                <p className="text-[11px] text-muted-foreground px-2 py-1 font-medium tracking-wide">Country</p>
                {COUNTRIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setSelectedCountry(c); setSelectedEntityType(""); setCountryOpen(false); }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-sm text-left transition-colors ${selectedCountry === c ? "bg-accent font-medium" : "hover:bg-accent/60"}`}
                  >
                    {selectedCountry === c ? <Check size={13} className="text-primary shrink-0" /> : <span className="w-[13px] shrink-0" />}
                    <span className="text-foreground text-left">{c}</span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}

          {/* Entity Type - shown after country selected */}
          {selectedCountry && (
            <Popover open={entityTypeOpen} onOpenChange={setEntityTypeOpen}>
              <PopoverTrigger asChild>
                <button className="w-full flex items-center justify-between px-3 py-2 rounded-[8px] border border-border bg-card/80 shadow-sm text-sm font-medium text-foreground hover:bg-card transition-colors">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-muted-foreground text-xs shrink-0">Entity:</span>
                    <span className="truncate">{selectedEntityType || "Select Entity Type"}</span>
                  </div>
                  <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-2" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1.5" align="start" sideOffset={4}>
                <p className="text-[11px] text-muted-foreground px-2 py-1 font-medium tracking-wide">Entity Type</p>
                {currentEntityTypes.map((e) => (
                  <button
                    key={e}
                    onClick={() => {
                      setSelectedEntityType(e);
                      setEntityTypeOpen(false);
                      // Auto-expand Compilations folder and select its first template
                      const codePrefix = activeTab === "my" ? "" : "G";
                      setExpandedFolders([`${codePrefix}COMP`]);
                      const frameworkLabel = selectedCountry === "Canada" ? "ASPE" : "GAAP";
                      const compilationLabel = `${e} ${frameworkLabel}-Compiled Financial Statements`;
                      onSelectItem?.(compilationLabel);
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-sm text-left transition-colors ${selectedEntityType === e ? "bg-accent font-medium" : "hover:bg-accent/60"}`}
                  >
                    {selectedEntityType === e ? <Check size={13} className="text-primary shrink-0" /> : <span className="w-[13px] shrink-0" />}
                    <span className="text-foreground text-left">{e}</span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}

        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground icon-search" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 h-9 rounded-[8px] border-0 shadow-sm text-sm bg-card/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Expand / Collapse + Menu toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={toggleAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border-0 shadow-sm bg-card/80 text-sm font-medium text-foreground hover:bg-card transition-colors"
            title={allExpanded ? "Collapse all" : "Expand all"}
          >
            <div className="flex flex-col gap-[2.5px] items-center w-[12px]">
              <span className="block rounded-full" style={{ width: 3, height: 3, background: "hsl(var(--primary) / 0.5)" }} />
              <span className="block rounded-full" style={{ width: 3, height: 3, background: "hsl(var(--primary) / 0.7)" }} />
              <span className="block rounded-full" style={{ width: 3, height: 3, background: "hsl(var(--primary) / 0.5)" }} />
            </div>
            {allExpanded ? "Collapse" : "Expand"}
          </button>
          <motion.button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-[8px] hover:bg-accent transition-all duration-200 shrink-0"
            title="Collapse sidebar"
          >
            <div className="flex flex-col gap-[3px] items-center w-[14px]">
              <span className="block rounded-full" style={{ width: 3.5, height: 3.5, background: "hsl(var(--primary) / 0.5)" }} />
              <span className="block rounded-full" style={{ width: 3.5, height: 3.5, background: "hsl(var(--primary) / 0.7)" }} />
              <span className="block rounded-full" style={{ width: 3.5, height: 3.5, background: "hsl(var(--primary) / 0.5)" }} />
            </div>
          </motion.button>
        </div>

        {/* Tabs — underline style matching source design system (Countable Blue #1C63A6) */}
        <div className="flex" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <button
            onClick={() => {
              setActiveTab("my");
              setExpandedFolders([]);
              onTabChange?.("my");
            }}
            className={`flex-1 py-2 px-1 text-sm font-medium transition-all text-center whitespace-nowrap border-b-[3px] ${
              activeTab === "my"
                ? "border-current"
                : "text-muted-foreground hover:text-foreground border-transparent"
            }`}
            style={activeTab === "my" ? { color: "hsl(207 71% 38%)" } : undefined}
          >
            My Templates
          </button>
          <button
            onClick={() => {
              setActiveTab("global");
              setExpandedFolders([]);
              onTabChange?.("global");
            }}
            className={`flex-1 py-2 px-1 text-sm font-medium transition-all text-center whitespace-nowrap border-b-[3px] ${
              activeTab === "global"
                ? "border-current"
                : "text-muted-foreground hover:text-foreground border-transparent"
            }`}
            style={activeTab === "global" ? { color: "hsl(207 71% 38%)" } : undefined}
          >
            Global Templates
          </button>
        </div>

      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto p-2 pt-0 space-y-0.5">
        {activeData.map((item) => (
          <RecursiveMenuItem
            key={item.code + item.label}
            item={item}
            expandedFolders={expandedFolders}
            toggleFolder={toggleFolder}
            selectedItem={selectedItem}
            onSelectItem={onSelectItem}
            depth={0}
            searchQuery={searchQuery}
            publishedItems={publishedItems}
          />
        ))}
      </div>

      {/* Resize handle */}
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

export default TemplateSidebarMenu;
