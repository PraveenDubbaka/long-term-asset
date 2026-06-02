import { useState } from "react";
import { ChevronUp, Copy, Trash2, Plus, FileText, FolderOpen, LayoutGrid, FileBarChart, ClipboardCheck, CheckSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SectionRow {
  name: string;
  category: string;
  categoryColor: string;
  categoryBg: string;
  categoryIcon: "checklist" | "letter" | "folder" | "module" | "fs" | "report" | "worksheet";
  mappedTemplate: string;
}

interface TemplateSection {
  title: string;
  rows: SectionRow[];
  hasAddSection?: boolean;
}

const CATEGORY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  checklist: { color: "hsl(15 80% 50%)", bg: "hsl(15 80% 96%)", border: "hsl(15 80% 88%)" },
  letter: { color: "hsl(260 60% 50%)", bg: "hsl(260 60% 96%)", border: "hsl(260 60% 88%)" },
  folder: { color: "hsl(220 15% 46%)", bg: "hsl(220 15% 94%)", border: "hsl(220 15% 86%)" },
  module: { color: "hsl(25 90% 50%)", bg: "hsl(25 90% 95%)", border: "hsl(25 90% 85%)" },
  fs: { color: "hsl(200 70% 45%)", bg: "hsl(200 70% 94%)", border: "hsl(200 70% 84%)" },
  report: { color: "hsl(0 65% 50%)", bg: "hsl(0 65% 96%)", border: "hsl(0 65% 88%)" },
  worksheet: { color: "hsl(200 60% 42%)", bg: "hsl(200 60% 94%)", border: "hsl(200 60% 84%)" },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  checklist: <ClipboardCheck size={13} />,
  letter: <FileText size={13} />,
  folder: <FolderOpen size={13} />,
  module: <LayoutGrid size={13} />,
  fs: <FileBarChart size={13} />,
  report: <FileBarChart size={13} />,
  worksheet: <CheckSquare size={13} />,
};

const COMPILATION_SECTIONS: TemplateSection[] = [
  {
    title: "Client Onboarding",
    hasAddSection: true,
    rows: [
      { name: "Client acceptance and continuance", category: "Checklists", categoryColor: "checklist", categoryBg: "checklist", categoryIcon: "checklist", mappedTemplate: "Client Acceptance and Continuance" },
      { name: "Independence", category: "Checklists", categoryColor: "checklist", categoryBg: "checklist", categoryIcon: "checklist", mappedTemplate: "Planning1" },
      { name: "Knowledge of client business", category: "Checklists", categoryColor: "checklist", categoryBg: "checklist", categoryIcon: "checklist", mappedTemplate: "Knowledge of client business CSRS 4200" },
      { name: "Management responsibility and acknowledgement", category: "Letters", categoryColor: "letter", categoryBg: "letter", categoryIcon: "letter", mappedTemplate: "Management responsibility & acknowledgement CSRS 4200" },
      { name: "Planning", category: "Checklists", categoryColor: "checklist", categoryBg: "checklist", categoryIcon: "checklist", mappedTemplate: "My Planing Checklist" },
      { name: "Engagement Letter", category: "Letters", categoryColor: "letter", categoryBg: "letter", categoryIcon: "letter", mappedTemplate: "Engagement Letter Compilation - Master (Corp)" },
      { name: "Compilation Queries", category: "Checklists", categoryColor: "checklist", categoryBg: "checklist", categoryIcon: "checklist", mappedTemplate: "New blank template" },
      { name: "Special Checklist", category: "Letters", categoryColor: "letter", categoryBg: "letter", categoryIcon: "letter", mappedTemplate: "My - Engagement Letter - Existing Standards" },
    ],
  },
  {
    title: "Documents",
    hasAddSection: true,
    rows: [
      { name: "Shareholders Agreements", category: "Folders", categoryColor: "folder", categoryBg: "folder", categoryIcon: "folder", mappedTemplate: "No Selection required" },
      { name: "Rental/Lease Agreements", category: "Folders", categoryColor: "folder", categoryBg: "folder", categoryIcon: "folder", mappedTemplate: "No Selection required" },
      { name: "Incorporation Documents", category: "Folders", categoryColor: "folder", categoryBg: "folder", categoryIcon: "folder", mappedTemplate: "No Selection required" },
      { name: "Banking Agreements", category: "Folders", categoryColor: "folder", categoryBg: "folder", categoryIcon: "folder", mappedTemplate: "No Selection required" },
    ],
  },
  {
    title: "Trial Balance & Adjusting entries",
    rows: [
      { name: "Trial Balance & Adjusting entries", category: "Modules", categoryColor: "module", categoryBg: "module", categoryIcon: "module", mappedTemplate: "Automated" },
    ],
  },
  {
    title: "Procedures",
    rows: [
      { name: "Procedures", category: "Modules", categoryColor: "module", categoryBg: "module", categoryIcon: "module", mappedTemplate: "Automated" },
    ],
  },
  {
    title: "Financial Statements",
    rows: [
      { name: "Financial Statement Docs", category: "Financial Statements", categoryColor: "fs", categoryBg: "fs", categoryIcon: "fs", mappedTemplate: "Compilation template" },
      { name: "Cover Page", category: "Financial Statements", categoryColor: "fs", categoryBg: "fs", categoryIcon: "fs", mappedTemplate: "Automated" },
      { name: "Table of Contents", category: "Financial Statements", categoryColor: "fs", categoryBg: "fs", categoryIcon: "fs", mappedTemplate: "Automated" },
      { name: "Compilation Report", category: "Reports", categoryColor: "report", categoryBg: "report", categoryIcon: "report", mappedTemplate: "Engagement Report" },
      { name: "Balance Sheet", category: "Financial Statements", categoryColor: "fs", categoryBg: "fs", categoryIcon: "fs", mappedTemplate: "Automated" },
      { name: "Statement of Income (Loss) and Retained Earnings (Deficit)", category: "Financial Statements", categoryColor: "fs", categoryBg: "fs", categoryIcon: "fs", mappedTemplate: "Automated" },
      { name: "Notes to Financial Information", category: "Financial Statements", categoryColor: "fs", categoryBg: "fs", categoryIcon: "fs", mappedTemplate: "Automated" },
    ],
  },
  {
    title: "Completion & Signoffs",
    hasAddSection: true,
    rows: [
      { name: "Completion", category: "Checklists", categoryColor: "checklist", categoryBg: "checklist", categoryIcon: "checklist", mappedTemplate: "Final Completion CSRS 4200" },
      { name: "Signoffs", category: "Modules", categoryColor: "module", categoryBg: "module", categoryIcon: "module", mappedTemplate: "Automated" },
      { name: "Final Review", category: "Modules", categoryColor: "module", categoryBg: "module", categoryIcon: "module", mappedTemplate: "Automated" },
    ],
  },
];

const REVIEW_SECTIONS: TemplateSection[] = [
  {
    title: "Client Onboarding",
    hasAddSection: true,
    rows: [
      { name: "New engagement acceptance", category: "Checklists", categoryColor: "checklist", categoryBg: "checklist", categoryIcon: "checklist", mappedTemplate: "New engagement acceptance Section 2400" },
      { name: "Existing engagement continuance", category: "Checklists", categoryColor: "checklist", categoryBg: "checklist", categoryIcon: "checklist", mappedTemplate: "Existing engagement continuance Section 2400" },
      { name: "Engagement Letter", category: "Letters", categoryColor: "letter", categoryBg: "letter", categoryIcon: "letter", mappedTemplate: "Engagement review section 2400" },
    ],
  },
  {
    title: "Planning",
    hasAddSection: true,
    rows: [
      { name: "Understanding the entity - Basics", category: "Checklists", categoryColor: "checklist", categoryBg: "checklist", categoryIcon: "checklist", mappedTemplate: "Understanding the entity basics Section 2400" },
      { name: "Understanding the entity - Systems", category: "Checklists", categoryColor: "checklist", categoryBg: "checklist", categoryIcon: "checklist", mappedTemplate: "Understanding the entity systems Section 2400" },
      { name: "Materiality", category: "Worksheets", categoryColor: "worksheet", categoryBg: "worksheet", categoryIcon: "worksheet", mappedTemplate: "Materiality Section 2400" },
      { name: "Engagement Scope", category: "Worksheets", categoryColor: "worksheet", categoryBg: "worksheet", categoryIcon: "worksheet", mappedTemplate: "Engagement scope section 2400" },
      { name: "Engagement Planning", category: "Checklists", categoryColor: "checklist", categoryBg: "checklist", categoryIcon: "checklist", mappedTemplate: "Engagement Planning Section 2400" },
    ],
  },
  {
    title: "Documents",
    hasAddSection: true,
    rows: [
      { name: "Shareholders Agreements", category: "Folders", categoryColor: "folder", categoryBg: "folder", categoryIcon: "folder", mappedTemplate: "No Selection required" },
      { name: "Rental/Lease Agreements", category: "Folders", categoryColor: "folder", categoryBg: "folder", categoryIcon: "folder", mappedTemplate: "No Selection required" },
      { name: "Incorporation Documents", category: "Folders", categoryColor: "folder", categoryBg: "folder", categoryIcon: "folder", mappedTemplate: "No Selection required" },
      { name: "Banking Agreements", category: "Folders", categoryColor: "folder", categoryBg: "folder", categoryIcon: "folder", mappedTemplate: "No Selection required" },
    ],
  },
  {
    title: "Trial Balance & Adjusting entries",
    rows: [
      { name: "Trial Balance & Adjusting entries", category: "Modules", categoryColor: "module", categoryBg: "module", categoryIcon: "module", mappedTemplate: "Automated" },
    ],
  },
  {
    title: "Procedures",
    rows: [
      { name: "Procedures", category: "Modules", categoryColor: "module", categoryBg: "module", categoryIcon: "module", mappedTemplate: "Automated" },
    ],
  },
  {
    title: "Financial Statements",
    rows: [
      { name: "Financial Statement Docs", category: "Financial Statements", categoryColor: "fs", categoryBg: "fs", categoryIcon: "fs", mappedTemplate: "Review template" },
      { name: "Cover Page", category: "Financial Statements", categoryColor: "fs", categoryBg: "fs", categoryIcon: "fs", mappedTemplate: "Automated" },
      { name: "Table of Contents", category: "Financial Statements", categoryColor: "fs", categoryBg: "fs", categoryIcon: "fs", mappedTemplate: "Automated" },
      { name: "Review Engagement report", category: "Reports", categoryColor: "report", categoryBg: "report", categoryIcon: "report", mappedTemplate: "Review engagement report Section 2400" },
      { name: "Balance Sheet", category: "Financial Statements", categoryColor: "fs", categoryBg: "fs", categoryIcon: "fs", mappedTemplate: "Automated" },
      { name: "Statement of Income (Loss) and Retained Earnings (Deficit)", category: "Financial Statements", categoryColor: "fs", categoryBg: "fs", categoryIcon: "fs", mappedTemplate: "Automated" },
      { name: "Statement of Cash Flows", category: "Financial Statements", categoryColor: "fs", categoryBg: "fs", categoryIcon: "fs", mappedTemplate: "Automated" },
      { name: "Notes to Financial Statement", category: "Financial Statements", categoryColor: "fs", categoryBg: "fs", categoryIcon: "fs", mappedTemplate: "Automated" },
    ],
  },
  {
    title: "Completion & Signoffs",
    hasAddSection: true,
    rows: [
      { name: "Accumulation of Identified Misstatements (AIM)", category: "Worksheets", categoryColor: "worksheet", categoryBg: "worksheet", categoryIcon: "worksheet", mappedTemplate: "AIM Section 2400" },
      { name: "Management representation letter", category: "Letters", categoryColor: "letter", categoryBg: "letter", categoryIcon: "letter", mappedTemplate: "Request for management assistance Review (Corp)" },
      { name: "Completion", category: "Checklists", categoryColor: "checklist", categoryBg: "checklist", categoryIcon: "checklist", mappedTemplate: "Final Completion Section 2400" },
      { name: "Subsequent events", category: "Checklists", categoryColor: "checklist", categoryBg: "checklist", categoryIcon: "checklist", mappedTemplate: "Subsequent events Section 2400" },
      { name: "Signoffs", category: "Modules", categoryColor: "module", categoryBg: "module", categoryIcon: "module", mappedTemplate: "Automated" },
      { name: "Final Review", category: "Modules", categoryColor: "module", categoryBg: "module", categoryIcon: "module", mappedTemplate: "Automated" },
    ],
  },
];

const TAX_SECTIONS: TemplateSection[] = [
  {
    title: "Client Onboarding",
    hasAddSection: true,
    rows: [
      { name: "Engagement Letter", category: "Letters", categoryColor: "letter", categoryBg: "letter", categoryIcon: "letter", mappedTemplate: "Engagement Letter" },
    ],
  },
  {
    title: "Documents",
    hasAddSection: true,
    rows: [
      { name: "Shareholders Agreements", category: "Folders", categoryColor: "folder", categoryBg: "folder", categoryIcon: "folder", mappedTemplate: "No Selection required" },
      { name: "Rental/Lease Agreements", category: "Folders", categoryColor: "folder", categoryBg: "folder", categoryIcon: "folder", mappedTemplate: "No Selection required" },
      { name: "Incorporation Documents", category: "Folders", categoryColor: "folder", categoryBg: "folder", categoryIcon: "folder", mappedTemplate: "No Selection required" },
      { name: "Banking Agreements", category: "Folders", categoryColor: "folder", categoryBg: "folder", categoryIcon: "folder", mappedTemplate: "No Selection required" },
    ],
  },
  {
    title: "Trial Balance & Adjusting entries",
    rows: [
      { name: "Trial Balance & Adjusting entries", category: "Modules", categoryColor: "module", categoryBg: "module", categoryIcon: "module", mappedTemplate: "Automated" },
    ],
  },
  {
    title: "Procedures",
    rows: [
      { name: "Procedures", category: "Modules", categoryColor: "module", categoryBg: "module", categoryIcon: "module", mappedTemplate: "Automated" },
    ],
  },
  {
    title: "Financial Statements",
    rows: [
      { name: "Financial Statement Docs", category: "Financial Statements", categoryColor: "fs", categoryBg: "fs", categoryIcon: "fs", mappedTemplate: "T2 template" },
      { name: "Cover Page", category: "Financial Statements", categoryColor: "fs", categoryBg: "fs", categoryIcon: "fs", mappedTemplate: "Automated" },
      { name: "Table of Contents", category: "Financial Statements", categoryColor: "fs", categoryBg: "fs", categoryIcon: "fs", mappedTemplate: "Automated" },
      { name: "Balance Sheet", category: "Financial Statements", categoryColor: "fs", categoryBg: "fs", categoryIcon: "fs", mappedTemplate: "Automated" },
      { name: "Statement of Income (Loss) and Retained Earnings (Deficit)", category: "Financial Statements", categoryColor: "fs", categoryBg: "fs", categoryIcon: "fs", mappedTemplate: "Automated" },
      { name: "Notes to Financial Statements", category: "Financial Statements", categoryColor: "fs", categoryBg: "fs", categoryIcon: "fs", mappedTemplate: "Automated" },
    ],
  },
  {
    title: "Completion & Signoffs",
    hasAddSection: true,
    rows: [
      { name: "Completion", category: "Checklists", categoryColor: "checklist", categoryBg: "checklist", categoryIcon: "checklist", mappedTemplate: "Completion" },
      { name: "Signoffs", category: "Modules", categoryColor: "module", categoryBg: "module", categoryIcon: "module", mappedTemplate: "Automated" },
      { name: "Final Review", category: "Modules", categoryColor: "module", categoryBg: "module", categoryIcon: "module", mappedTemplate: "Automated" },
    ],
  },
];

const getSectionsForTemplate = (templateName: string): TemplateSection[] => {
  if (templateName.toLowerCase().includes("t2")) {
    return TAX_SECTIONS;
  }
  if (templateName.toLowerCase().includes("review") || templateName.toLowerCase().includes("2400")) {
    return REVIEW_SECTIONS;
  }
  return COMPILATION_SECTIONS;
};

interface CategoryBadgeProps {
  category: string;
  type: string;
}

const CategoryBadge = ({ category, type }: CategoryBadgeProps) => {
  const style = CATEGORY_STYLES[type] || CATEGORY_STYLES.folder;
  const icon = CATEGORY_ICONS[type];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap"
      style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}
    >
      {icon}
      {category}
    </span>
  );
};

interface CollapsibleSectionProps {
  section: TemplateSection;
  index: number;
}

const CollapsibleSection = ({ section, index }: CollapsibleSectionProps) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className="rounded-[12px] border border-border bg-card overflow-hidden"
    >
      {/* Section Header */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/30 transition-colors"
      >
        <h3 className="text-sm font-bold text-foreground">{section.title}</h3>
        <motion.div
          animate={{ rotate: expanded ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronUp size={16} className="text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_180px_1fr] px-5 py-2 border-t border-border"
              style={{ background: "hsl(var(--muted) / 0.5)" }}>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Section</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mapped template</span>
            </div>

            {/* Rows */}
            {section.rows.map((row, rIdx) => (
              <div
                key={rIdx}
                className="grid grid-cols-[1fr_180px_1fr] px-5 py-3 border-t border-border/60 hover:bg-accent/20 transition-colors group"
              >
                <span className="text-sm text-foreground pr-4">{row.name}</span>
                <div>
                  <CategoryBadge category={row.category} type={row.categoryIcon} />
                </div>
                <span className="text-sm text-muted-foreground">{row.mappedTemplate}</span>
              </div>
            ))}

            {/* Add Section Button */}
            {section.hasAddSection && (
              <div className="px-5 py-3 border-t border-border/60">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-xs font-semibold text-white"
                  style={{ background: "#1C63A6" }}
                >
                  <Plus size={13} />
                  Add Section
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface EngagementTemplatePreviewProps {
  templateName: string;
}

const EngagementTemplatePreview = ({ templateName }: EngagementTemplatePreviewProps) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-background">
        <h2 className="text-lg font-semibold text-foreground" style={{ color: "#1C63A6" }}>
          {templateName}
        </h2>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-foreground border border-border rounded-[12px] hover:bg-accent transition-colors"
            onClick={() => {}}
            title="Duplicate template"
          >
            <Copy size={14} />
            Duplicate
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-destructive border border-destructive/30 rounded-[12px] hover:bg-destructive/10 transition-colors"
            onClick={() => {}}
            title="Delete template"
          >
            <Trash2 size={14} />
            Delete
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-5">
          {getSectionsForTemplate(templateName).map((section, idx) => (
            <CollapsibleSection key={section.title} section={section} index={idx} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default EngagementTemplatePreview;
