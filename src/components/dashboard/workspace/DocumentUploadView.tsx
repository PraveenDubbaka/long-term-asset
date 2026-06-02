import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChecklistDocument from "./ChecklistDocument";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  File,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Eye,
  Edit3,
  GripVertical,
  ArrowLeft,
  Search,
  Bot,
  Sparkles,
  FolderOpen,
  AlertCircle,
  Users,
  CheckSquare,
  BookOpen,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Activity,
  MessageCircle,
  AtSign,
  Send,
  Mic,
  Plus,
  Lock,
  Unlock,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import quickbooksLogo from "@/assets/quickbooks-intuit-logo.png";

/* ── File tree structure ── */
interface FileNode {
  label: string;
  icon: React.ElementType;
  children?: FileNode[];
}

const fileTree: FileNode[] = [
  {
    label: "Letters",
    icon: FileText,
    children: [
      { label: "Engagement Letter", icon: FileText },
      { label: "Management Responsibility Letter", icon: FileText },
    ],
  },
  {
    label: "Checklists",
    icon: CheckSquare,
    children: [
      { label: "Client Acceptance & Continuance", icon: CheckSquare },
      { label: "Independence", icon: CheckSquare },
      { label: "Knowledge of Client Business", icon: CheckSquare },
      { label: "Planning", icon: CheckSquare },
    ],
  },
  {
    label: "Working Papers",
    icon: FolderOpen,
    children: [
      { label: "Capital Asset Amortization", icon: FileSpreadsheet },
      { label: "Long-term Debt", icon: FileSpreadsheet },
    ],
  },
  {
    label: "Trial Balance Mapping",
    icon: BarChart3,
  },
  {
    label: "Financial Statements",
    icon: BookOpen,
    children: [
      { label: "Cover Page", icon: FileText },
      { label: "Table of Contents", icon: FileText },
      { label: "Balance Sheet", icon: FileSpreadsheet },
      { label: "Statement of Income Loss", icon: FileSpreadsheet },
      { label: "Notes to Financial Information", icon: FileText },
    ],
  },
];

/* ── Team chat mock data ── */
const teamMessages = [
  { id: 1, user: "Sarah Chen", initials: "SC", color: "hsl(207 71% 38%)", message: "Engagement letter looks good. Can someone confirm the signing date?", time: "2m ago" },
  { id: 2, user: "James Wilson", initials: "JW", color: "hsl(145 63% 42%)", message: "@Sarah the partner signed on Jan 15th per the file.", time: "5m ago" },
  { id: 3, user: "Maya Patel", initials: "MP", color: "hsl(320 70% 50%)", message: "Capital asset amortization schedule needs review — row 42 variance.", time: "12m ago" },
  { id: 4, user: "Alex Park", initials: "AP", color: "hsl(280 70% 55%)", message: "I've uploaded the prior year trial balance. @Maya can you validate?", time: "18m ago" },
];

const activityLog = [
  { id: 1, text: "Engagement automation completed successfully", type: "done" as const, time: "Just now" },
  { id: 2, text: "Classified 14 documents across 5 categories", type: "done" as const, time: "1m ago" },
  { id: 3, text: "Trial balance mapped to chart of accounts", type: "done" as const, time: "2m ago" },
  { id: 4, text: "Variance detected in capital asset schedule", type: "flag" as const, time: "3m ago" },
  { id: 5, text: "Financial statements structure verified", type: "done" as const, time: "4m ago" },
  { id: 6, text: "Independence checklist auto-populated", type: "done" as const, time: "5m ago" },
];

/* ── Luka progressive message ── */
const lukaFullMessage = "I have successfully completed the initial engagement automation for this engagement.\n\nI'm now in Observation Mode — monitoring your file and suggesting intelligent next actions. Click on a file from the left menu to work towards completion.";

/* ── Engagement Letter workflow responses ── */
const engagementWorkflows: Record<string, { reply: string; steps?: string[] }> = {
  "Share with client now": {
    reply: "I'll prepare the Engagement Letter for client delivery. Before sharing, I need to confirm a few things:",
    steps: [
      "✅ Letter has been finalized and reviewed",
      "📧 Sending via secure client portal link to john.smith@alphaindustries.com",
      "🔒 Document will be locked after sharing — edits require a new version",
      "⏳ Client will have 14 days to review and e-sign",
      "📋 Audit trail entry will be created automatically",
    ],
  },
  "Edit fees": {
    reply: "Opening the fee schedule section for editing. Current fee breakdown:",
    steps: [
      "💰 Base compilation fee: $4,500.00",
      "📊 Financial statement preparation: $400.00",
      "📑 Notice to Reader drafting: $250.00",
      "📝 Total estimated: $5,150.00 + applicable taxes",
      "💡 Tip: Fee adjustments are tracked in the audit trail and reflected in the billing module",
    ],
  },
  "Update signature": {
    reply: "I'll update the signature block. Here are the current signatories:",
    steps: [
      "🖊️ Firm partner: Sarah Morrison, CPA, CA — Morrison & Associates LLP",
      "👤 Client signatory: John Smith, Director — Alpha Industries Inc.",
      "📅 Signature date: Set to engagement acceptance date",
      "🔐 E-signature integration available via DocuSign or native portal",
      "💡 Both parties must sign before the engagement can proceed to fieldwork",
    ],
  },
  "Validate dates": {
    reply: "Running date validation across the Engagement Letter. Here's what I found:",
    steps: [
      "✅ Fiscal year-end: December 31, 2024 — Matches client profile",
      "✅ Engagement period: January 1, 2024 – December 31, 2024",
      "⚠️ Expected completion: March 31, 2025 — 10 days from today, confirm timeline",
      "✅ Fee payment terms: Net 30 from invoice date",
      "💡 All dates cross-referenced with CRA filing deadlines and prior year engagement",
    ],
  },
  "Finalize Letter": {
    reply: "Finalizing the Engagement Letter. This will lock the document for signing:",
    steps: [
      "🔍 Running final compliance check against CSRS 4200 standards",
      "✅ All required clauses present and complete",
      "✅ Fee schedule reviewed and approved",
      "🔒 Document status will change to 'Final — Pending Signature'",
      "📨 Ready for client delivery after finalization",
    ],
  },
  "Replace Engagement Letter": {
    reply: "To replace the current Engagement Letter, I'll need to confirm the workflow:",
    steps: [
      "⚠️ Current letter will be archived as v1 with full audit trail",
      "📄 A new draft (v2) will be created from the latest template",
      "🔄 All prior customizations (fees, dates, signatories) can be carried forward",
      "📋 Replacement reason will be logged for quality control",
      "💡 Previous versions remain accessible in the document history",
    ],
  },
  "Update header": {
    reply: "I'll update the letter header. Current header details:",
    steps: [
      "🏢 Firm name: Morrison & Associates LLP, Chartered Professional Accountants",
      "📍 Address: 1200-250 Yonge Street, Toronto, ON M5B 2L7",
      "📞 Phone: (416) 555-0142 | Fax: (416) 555-0143",
      "🌐 Website: www.morrisonassociates.ca",
      "💡 Header updates will apply to this letter only. Update firm defaults in Settings.",
    ],
  },
  "Update footer": {
    reply: "I'll update the letter footer. Current footer content:",
    steps: [
      "📝 Disclaimer: Standard CSRS 4200 compilation disclaimer",
      "📄 Page numbering: 'Page X of Y' format — auto-generated",
      "🔖 Document reference: COM-ALP-Dec312024 — Engagement Letter v1",
      "⚖️ Liability clause: Provincial CPA liability cap reference",
      "💡 Footer is synced across all pages. Changes apply document-wide.",
    ],
  },
};

interface WorkflowMessage {
  id: number;
  sender: "user" | "luka";
  text: string;
  steps?: string[];
  timestamp: string;
}

interface DocumentUploadViewProps {
  onBack: () => void;
}

/* ── Helper: check if a node or its children match a search query ── */
const nodeMatchesSearch = (node: FileNode, query: string): boolean => {
  const q = query.toLowerCase();
  if (node.label.toLowerCase().includes(q)) return true;
  if (node.children?.some((c) => nodeMatchesSearch(c, q))) return true;
  return false;
};

/* ── File Tree Item ── */
const FileTreeItem = ({
  node,
  depth = 0,
  selectedFile,
  onSelect,
  searchQuery = "",
  visibleFiles,
  treeFullyLoaded,
  allExpanded = null,
}: {
  node: FileNode;
  depth?: number;
  selectedFile: string | null;
  onSelect: (label: string) => void;
  searchQuery?: string;
  visibleFiles: Set<string>;
  treeFullyLoaded: boolean;
  allExpanded?: boolean | null;
}) => {
  const hasActiveSearch = searchQuery.length > 0;
  const hasChildren = node.children && node.children.length > 0;
  const [manualExpanded, setManualExpanded] = useState(true);
  
  useEffect(() => {
    if (allExpanded === true) setManualExpanded(true);
    else if (allExpanded === false) setManualExpanded(false);
  }, [allExpanded]);

  const expanded = hasActiveSearch ? nodeMatchesSearch(node, searchQuery) : manualExpanded;
  const isSelected = selectedFile === node.label;
  const Icon = node.icon;
  const isVisible = visibleFiles.has(node.label);

  if (!isVisible && !treeFullyLoaded) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.button
        whileHover={{ x: 1 }}
        onClick={() => {
          if (hasChildren && !hasActiveSearch) setManualExpanded(!manualExpanded);
          onSelect(node.label);
        }}
        className="w-full flex items-center gap-1.5 py-[7px] rounded-lg text-left transition-all duration-150 cursor-pointer"
        style={{
          paddingLeft: `${10 + depth * 16}px`,
          paddingRight: "8px",
          background: isSelected
            ? "linear-gradient(135deg, hsl(207 71% 38% / 0.10), hsl(260 70% 60% / 0.06))"
            : "transparent",
          border: isSelected ? "1px solid hsl(207 71% 38% / 0.15)" : "1px solid transparent",
          color: isSelected ? "hsl(207 71% 28%)" : "hsl(var(--foreground))",
          fontWeight: isSelected ? 600 : hasChildren ? 600 : 400,
        }}
      >
        {hasChildren ? (
          <motion.span
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
            className="shrink-0 w-4 flex items-center justify-center"
          >
            <ChevronRight size={11} style={{ color: "hsl(var(--muted-foreground))" }} />
          </motion.span>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <Icon size={13} style={{ color: isSelected ? "hsl(207 71% 38%)" : "hsl(var(--muted-foreground))" }} className="shrink-0" />
        <span className="text-[13px] truncate leading-tight">{node.label}</span>
      </motion.button>

      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {node.children!
              .filter((child) => !hasActiveSearch || nodeMatchesSearch(child, searchQuery))
              .map((child) => (
              <FileTreeItem
                key={child.label}
                node={child}
                depth={depth + 1}
                selectedFile={selectedFile}
                onSelect={onSelect}
                searchQuery={searchQuery}
                visibleFiles={visibleFiles}
                treeFullyLoaded={treeFullyLoaded}
                allExpanded={allExpanded}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ── Flatten tree for progressive loading ── */
const flattenTree = (nodes: FileNode[]): string[] => {
  const result: string[] = [];
  for (const node of nodes) {
    result.push(node.label);
    if (node.children) {
      for (const child of node.children) {
        result.push(child.label);
      }
    }
  }
  return result;
};
const allFileLabels = flattenTree(fileTree);

/* ── Engagement Letter Document ── */
const EngagementLetterDocument = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="w-full max-w-full md:max-w-[92%] lg:max-w-[960px] mx-auto pb-10 transition-all duration-500 ease-out"
  >
    {/* Document page with shadow */}
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(0 0% 100%)",
        boxShadow: "0 4px 24px hsl(220 30% 50% / 0.10), 0 1px 4px hsl(220 30% 50% / 0.06)",
        border: "1px solid hsl(var(--border))",
      }}
    >
      {/* ── HEADER ── */}
      <div
        className="px-10 pt-8 pb-5"
        style={{
          borderBottom: "2px solid hsl(207 71% 26%)",
          background: "linear-gradient(180deg, hsl(210 60% 97%), hsl(0 0% 100%))",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2
              className="text-[20px] font-bold tracking-tight"
              style={{ color: "hsl(207 71% 11%)" }}
            >
              Morrison & Associates LLP
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: "hsl(220 15% 50%)" }}>
              Chartered Professional Accountants
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "hsl(220 15% 60%)" }}>
              200 Bay Street, Suite 1800, Toronto, ON M5J 2N8
            </p>
            <p className="text-[10px]" style={{ color: "hsl(220 15% 60%)" }}>
              Tel: (416) 555-0142 &nbsp;|&nbsp; Fax: (416) 555-0143 &nbsp;|&nbsp; www.morrisonllp.ca
            </p>
          </div>
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-[18px] font-black"
            style={{
              background: "linear-gradient(135deg, hsl(207 71% 21%), hsl(210 80% 50%))",
              color: "white",
              letterSpacing: "-0.5px",
            }}
          >
            M&A
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="px-10 py-7 space-y-5" style={{ color: "hsl(220 20% 20%)", fontSize: "13px", lineHeight: "1.75" }}>
        <div className="flex items-center justify-between">
          <p className="font-semibold" style={{ color: "hsl(220 15% 40%)" }}>
            January 15, 2025
          </p>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: "hsl(207 71% 38% / 0.08)",
              border: "1px solid hsl(207 71% 38% / 0.18)",
              color: "hsl(207 71% 26%)",
            }}
          >
            <FileText size={10} />
            CSRS 4200
          </div>
        </div>

        <div>
          <p className="font-semibold">Mr. Siddharth Patel, Director</p>
          <p>ABC Private Ltd.</p>
          <p>450 Queen Street West, Suite 300</p>
          <p>Toronto, Ontario M5V 2A8</p>
        </div>

        <p className="font-semibold" style={{ color: "hsl(220 20% 15%)" }}>
          Re: Compilation Engagement — Financial Statements for the Year Ended December 31, 2024
        </p>

        <p>Dear Mr. Patel,</p>

        <p>
          This letter is to confirm our understanding of the terms and objectives of our engagement and
          the nature and limitations of the services we will provide. Our engagement will be conducted in
          accordance with <strong>Canadian Standard on Related Services (CSRS) 4200, Compilation Engagements</strong>,
          as issued by the Auditing and Assurance Standards Board of the Chartered Professional Accountants
          of Canada (CPA Canada).
        </p>

        <div>
          <p className="font-bold mb-1.5" style={{ color: "hsl(210 80% 30%)" }}>
            1. Scope of the Engagement
          </p>
          <p>
            You have requested that we compile the following financial statements of ABC Private Ltd.
            ("the Entity") based on information you will provide:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Balance Sheet as at December 31, 2024</li>
            <li>Statement of Income and Retained Earnings for the year then ended</li>
            <li>Notes to the Financial Statements</li>
          </ul>
          <p className="mt-2">
            The financial statements will be prepared using <strong>Accounting Standards for Private Enterprises
            (ASPE)</strong> as the applicable financial reporting framework.
          </p>
        </div>

        <div>
          <p className="font-bold mb-1.5" style={{ color: "hsl(210 80% 30%)" }}>
            2. Responsibilities of Management
          </p>
          <p>
            The compilation of financial statements involves assisting management with the preparation
            and presentation of financial information. This engagement is <strong>not an audit or a review</strong>,
            and accordingly, we will not express an opinion or any form of assurance on the financial statements.
          </p>
          <p className="mt-2">
            Management acknowledges and understands that users of financial statements compiled by us are
            not able to place the same degree of reliance on them as they would on financial statements that
            have been audited or reviewed.
          </p>
        </div>

        <div>
          <p className="font-bold mb-1.5" style={{ color: "hsl(210 80% 30%)" }}>
            3. Our Responsibilities
          </p>
          <p>
            We will compile the financial statements based on the information provided by management.
            We are required to have an understanding of the Entity's business and the applicable financial
            reporting framework sufficient to compile the financial statements. Should we become aware that
            the records, documents, explanations, or other information, including significant judgments, provided
            by management for the compilation engagement are incomplete, inaccurate, or otherwise unsatisfactory,
            we will bring this to your attention and request additional or corrected information.
          </p>
        </div>

        {/* Fee section with highlight */}
        <div
          className="rounded-xl p-5"
          style={{
            background: "linear-gradient(135deg, hsl(210 60% 97%), hsl(210 40% 95%))",
            border: "1px solid hsl(210 50% 85%)",
          }}
        >
          <p className="font-bold mb-2" style={{ color: "hsl(210 80% 30%)", fontSize: "14px" }}>
            4. Fees and Billing
          </p>
          <p>Our professional fees for the compilation engagement will be as follows:</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.7)" }}>
              <span>Compilation of Year-End Financial Statements</span>
              <span className="font-bold" style={{ color: "hsl(207 71% 16%)" }}>$3,500.00</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.7)" }}>
              <span>Corporate Tax Return (T2) Preparation</span>
              <span className="font-bold" style={{ color: "hsl(207 71% 16%)" }}>$1,200.00</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.7)" }}>
              <span>GST/HST Annual Filing</span>
              <span className="font-bold" style={{ color: "hsl(207 71% 16%)" }}>$450.00</span>
            </div>
            <div
              className="flex items-center justify-between py-2.5 px-3 rounded-lg mt-1"
              style={{
                background: "hsl(207 71% 26% / 0.08)",
                border: "1px solid hsl(207 71% 26% / 0.15)",
              }}
            >
              <span className="font-bold">Total Estimated Fees (plus applicable HST)</span>
              <span className="font-bold text-[15px]" style={{ color: "hsl(207 71% 16%)" }}>$5,150.00</span>
            </div>
          </div>
          <p className="mt-3 text-[12px]" style={{ color: "hsl(220 15% 50%)" }}>
            Fees will be billed upon completion and are payable within 30 days of the invoice date.
            Additional services outside the scope of this engagement will be billed at our standard hourly rates.
          </p>
        </div>

        <div>
          <p className="font-bold mb-1.5" style={{ color: "hsl(210 80% 30%)" }}>
            5. Confidentiality
          </p>
          <p>
            We are bound by the rules of professional conduct of the Chartered Professional Accountants of
            Ontario (CPA Ontario) regarding the confidentiality of client information. We will not disclose
            any information obtained during the course of this engagement without your prior written consent,
            unless required by law or professional regulations.
          </p>
        </div>

        <div>
          <p className="font-bold mb-1.5" style={{ color: "hsl(210 80% 30%)" }}>
            6. Agreement and Signature
          </p>
          <p>
            Please sign and return the attached copy of this letter to indicate your acknowledgement and
            agreement with the terms of our engagement, including our respective responsibilities.
          </p>
        </div>

        <p>Yours truly,</p>

        {/* Firm signature */}
        <div className="mt-2">
          <p className="font-bold italic text-[16px]" style={{ color: "hsl(210 80% 30%)", fontFamily: "Georgia, serif" }}>
            Morrison & Associates LLP
          </p>
          <p className="text-[12px] mt-1" style={{ color: "hsl(220 15% 50%)" }}>
            Chartered Professional Accountants
          </p>
          <p className="text-[12px]" style={{ color: "hsl(220 15% 50%)" }}>
            Licensed Public Accountants
          </p>
        </div>

        {/* Client signature block */}
        <div
          className="rounded-xl p-5 mt-6"
          style={{
            background: "hsl(40 60% 97%)",
            border: "1px dashed hsl(40 40% 75%)",
          }}
        >
          <p className="font-bold text-[13px] mb-4" style={{ color: "hsl(220 20% 25%)" }}>
            Acknowledged and Agreed:
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div
                className="h-10 rounded-lg mb-2 flex items-end px-3 pb-1"
                style={{
                  borderBottom: "2px solid hsl(220 20% 70%)",
                  background: "hsl(0 0% 100% / 0.5)",
                }}
              >
                <span className="text-[14px] italic" style={{ color: "hsl(220 30% 55%)", fontFamily: "Georgia, serif" }}>
                  Siddharth Patel
                </span>
              </div>
              <p className="text-[11px]" style={{ color: "hsl(220 15% 50%)" }}>
                Signature — Client Representative
              </p>
              <p className="text-[12px] font-semibold mt-1" style={{ color: "hsl(220 20% 30%)" }}>
                Mr. Siddharth Patel, Director
              </p>
            </div>
            <div>
              <div
                className="h-10 rounded-lg mb-2 flex items-end px-3 pb-1"
                style={{
                  borderBottom: "2px solid hsl(220 20% 70%)",
                  background: "hsl(0 0% 100% / 0.5)",
                }}
              >
                <span className="text-[14px]" style={{ color: "hsl(220 30% 55%)" }}>
                  January __, 2025
                </span>
              </div>
              <p className="text-[11px]" style={{ color: "hsl(220 15% 50%)" }}>
                Date
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div
        className="px-10 py-4"
        style={{
          borderTop: "2px solid hsl(207 71% 26%)",
          background: "linear-gradient(0deg, hsl(210 60% 97%), hsl(0 0% 100%))",
        }}
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px]" style={{ color: "hsl(220 15% 55%)" }}>
            Morrison & Associates LLP &nbsp;|&nbsp; Chartered Professional Accountants &nbsp;|&nbsp; Member of CPA Ontario
          </p>
          <p className="text-[10px]" style={{ color: "hsl(220 15% 55%)" }}>
            Page 1 of 1
          </p>
        </div>
        <p className="text-[9px] mt-1" style={{ color: "hsl(220 15% 65%)" }}>
          This engagement letter is prepared in accordance with CSRS 4200 and the professional standards of CPA Canada.
          Confidential — intended for the addressee only.
        </p>
      </div>
    </div>

    {/* Luka AI badge */}
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="flex items-center gap-2 mt-4 px-3 py-2 rounded-xl mx-auto w-fit"
      style={{
        background: "linear-gradient(135deg, hsl(207 71% 38% / 0.06), hsl(260 70% 60% / 0.04))",
        border: "1px solid hsl(207 71% 38% / 0.12)",
      }}
    >
      <Bot size={13} style={{ color: "hsl(207 71% 38%)" }} />
      <span className="text-[11px] font-medium" style={{ color: "hsl(210 80% 40%)" }}>
        Generated by Luka AI — Review and customize before sending to client
      </span>
      <Sparkles size={11} style={{ color: "hsl(40 90% 50%)" }} />
    </motion.div>
  </motion.div>
);

/* ── Management Responsibility Letter Document ── */
const ManagementResponsibilityLetter = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="w-full max-w-full md:max-w-[92%] lg:max-w-[960px] mx-auto pb-10 transition-all duration-500 ease-out"
  >
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(0 0% 100%)",
        boxShadow: "0 4px 24px hsl(220 30% 50% / 0.10), 0 1px 4px hsl(220 30% 50% / 0.06)",
        border: "1px solid hsl(var(--border))",
      }}
    >
      {/* ── HEADER ── */}
      <div
        className="px-10 pt-8 pb-5"
        style={{
          borderBottom: "2px solid hsl(145 60% 35%)",
          background: "linear-gradient(180deg, hsl(145 40% 97%), hsl(0 0% 100%))",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[20px] font-bold tracking-tight" style={{ color: "hsl(145 60% 20%)" }}>
              ABC Private Ltd.
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: "hsl(220 15% 50%)" }}>
              450 Queen Street West, Suite 300
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "hsl(220 15% 60%)" }}>
              Toronto, Ontario M5V 2A8
            </p>
            <p className="text-[10px]" style={{ color: "hsl(220 15% 60%)" }}>
              Tel: (416) 555-0199 &nbsp;|&nbsp; info@abcprivate.ca
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: "hsl(145 60% 40% / 0.08)",
              border: "1px solid hsl(145 60% 40% / 0.18)",
              color: "hsl(145 60% 30%)",
            }}
          >
            <FileText size={10} />
            CSRS 4200
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="px-10 py-7 space-y-5" style={{ color: "hsl(220 20% 20%)", fontSize: "13px", lineHeight: "1.75" }}>
        <div className="flex items-center justify-between">
          <p className="font-semibold" style={{ color: "hsl(220 15% 40%)" }}>January 15, 2025</p>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: "hsl(40 80% 50% / 0.08)",
              border: "1px solid hsl(40 80% 50% / 0.18)",
              color: "hsl(40 60% 35%)",
            }}
          >
            <AlertCircle size={10} />
            Management Letter
          </div>
        </div>

        <div>
          <p className="font-semibold">Morrison & Associates LLP</p>
          <p>Chartered Professional Accountants</p>
          <p>200 Bay Street, Suite 1800</p>
          <p>Toronto, Ontario M5J 2N8</p>
        </div>

        <p className="font-semibold" style={{ color: "hsl(220 20% 15%)" }}>
          Re: Management's Responsibility in Connection with the Compilation Engagement — Year Ended December 31, 2024
        </p>

        <p>Dear Morrison & Associates LLP,</p>

        <p>
          In connection with your compilation of the financial statements of <strong>ABC Private Ltd.</strong> ("the Entity")
          for the year ended December 31, 2024, prepared in accordance with <strong>Canadian Standard on Related Services
          (CSRS) 4200, Compilation Engagements</strong>, we confirm and acknowledge the following responsibilities of management:
        </p>

        <div>
          <p className="font-bold mb-1.5" style={{ color: "hsl(145 60% 25%)" }}>1. Responsibility for Financial Information</p>
          <p>
            We acknowledge that we are responsible for the <strong>preparation and fair presentation</strong> of the financial
            statements in accordance with <strong>Accounting Standards for Private Enterprises (ASPE)</strong>. This includes
            the selection of appropriate accounting policies, the determination of reasonable accounting estimates, and the
            design, implementation, and maintenance of internal controls relevant to the preparation of financial statements.
          </p>
        </div>

        <div>
          <p className="font-bold mb-1.5" style={{ color: "hsl(145 60% 25%)" }}>2. Completeness and Accuracy of Information</p>
          <p>We confirm that we have provided you with:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Access to all information of which we are aware that is relevant to the preparation of the financial statements, such as records, documentation, and other matters</li>
            <li>All additional information that you have requested from us for the purpose of the compilation</li>
            <li>Unrestricted access to persons within the Entity from whom you determined it necessary to obtain information</li>
          </ul>
        </div>

        <div>
          <p className="font-bold mb-1.5" style={{ color: "hsl(145 60% 25%)" }}>3. Disclosure of Material Matters</p>
          <p>We confirm that, to the best of our knowledge and belief, we have disclosed to you all matters that could materially affect the financial statements, including but not limited to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>All related-party transactions and balances</li>
            <li>All contingent liabilities and commitments</li>
            <li>Any events subsequent to the balance sheet date that may require adjustment or disclosure</li>
            <li>Any known or suspected fraud or non-compliance with laws and regulations</li>
          </ul>
        </div>

        <div>
          <p className="font-bold mb-1.5" style={{ color: "hsl(145 60% 25%)" }}>4. Nature of the Engagement</p>
          <p>
            We understand that a compilation engagement <strong>is not an audit or a review engagement</strong>, and that
            Morrison & Associates LLP will not express an opinion or any form of assurance on the financial statements.
            We further understand that users of the compiled financial statements cannot place the same degree of reliance
            on them as they could on audited or reviewed financial statements.
          </p>
        </div>

        {/* Key acknowledgments highlight */}
        <div className="rounded-xl p-5" style={{ background: "linear-gradient(135deg, hsl(145 40% 97%), hsl(145 30% 95%))", border: "1px solid hsl(145 40% 82%)" }}>
          <p className="font-bold mb-2" style={{ color: "hsl(145 60% 25%)", fontSize: "14px" }}>5. Key Management Acknowledgments</p>
          <div className="mt-3 space-y-2">
            {[
              "All transactions have been recorded in the accounting records and are reflected in the financial statements",
              "The Entity has satisfactory title to and control over all assets, and all liabilities have been recorded",
              "The Entity has complied with all aspects of contractual agreements that may affect the financial statements",
              "No events have occurred subsequent to the balance sheet date that would require adjustment or disclosure",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3 py-2 px-3 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.7)" }}>
                <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: "hsl(145 60% 35%)" }} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="font-bold mb-1.5" style={{ color: "hsl(145 60% 25%)" }}>6. Limitation of Liability</p>
          <p>
            We acknowledge that Morrison & Associates LLP shall not be held liable for any misstatements in the financial
            statements arising from the provision of incorrect or incomplete information by management. Management retains
            full responsibility for the accuracy and completeness of all source documents and information provided.
          </p>
        </div>

        <p className="mt-4">Yours sincerely,</p>

        <div className="mt-2">
          <p className="font-bold italic text-[16px]" style={{ color: "hsl(220 30% 35%)", fontFamily: "Georgia, serif" }}>Siddharth Patel</p>
          <p className="text-[12px] mt-1" style={{ color: "hsl(220 15% 50%)" }}>Director, ABC Private Ltd.</p>
        </div>

        {/* Witness / Date block */}
        <div className="rounded-xl p-5 mt-6" style={{ background: "hsl(40 60% 97%)", border: "1px dashed hsl(40 40% 75%)" }}>
          <p className="font-bold text-[13px] mb-4" style={{ color: "hsl(220 20% 25%)" }}>Witnessed and Acknowledged by Practitioner:</p>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="h-10 rounded-lg mb-2 flex items-end px-3 pb-1" style={{ borderBottom: "2px solid hsl(220 20% 70%)", background: "hsl(0 0% 100% / 0.5)" }}>
                <span className="text-[14px] italic" style={{ color: "hsl(220 30% 55%)", fontFamily: "Georgia, serif" }}>Morrison & Associates LLP</span>
              </div>
              <p className="text-[11px]" style={{ color: "hsl(220 15% 50%)" }}>Signature — Practitioner</p>
              <p className="text-[12px] font-semibold mt-1" style={{ color: "hsl(220 20% 30%)" }}>Chartered Professional Accountants</p>
            </div>
            <div>
              <div className="h-10 rounded-lg mb-2 flex items-end px-3 pb-1" style={{ borderBottom: "2px solid hsl(220 20% 70%)", background: "hsl(0 0% 100% / 0.5)" }}>
                <span className="text-[14px]" style={{ color: "hsl(220 30% 55%)" }}>January __, 2025</span>
              </div>
              <p className="text-[11px]" style={{ color: "hsl(220 15% 50%)" }}>Date</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="px-10 py-4" style={{ borderTop: "2px solid hsl(145 60% 35%)", background: "linear-gradient(0deg, hsl(145 40% 97%), hsl(0 0% 100%))" }}>
        <div className="flex items-center justify-between">
          <p className="text-[10px]" style={{ color: "hsl(220 15% 55%)" }}>ABC Private Ltd. &nbsp;|&nbsp; Management Responsibility Letter &nbsp;|&nbsp; CSRS 4200 Compilation</p>
          <p className="text-[10px]" style={{ color: "hsl(220 15% 55%)" }}>Page 1 of 1</p>
        </div>
        <p className="text-[9px] mt-1" style={{ color: "hsl(220 15% 65%)" }}>
          This letter is prepared in accordance with the requirements of CSRS 4200 and the professional standards of CPA Canada. Confidential — intended for the addressee only.
        </p>
      </div>
    </div>

    {/* Luka AI badge */}
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="flex items-center gap-2 mt-4 px-3 py-2 rounded-xl mx-auto w-fit"
      style={{ background: "linear-gradient(135deg, hsl(207 71% 38% / 0.06), hsl(260 70% 60% / 0.04))", border: "1px solid hsl(207 71% 38% / 0.12)" }}
    >
      <Bot size={13} style={{ color: "hsl(207 71% 38%)" }} />
      <span className="text-[11px] font-medium" style={{ color: "hsl(210 80% 40%)" }}>Generated by Luka AI — Review and customize before sending to client</span>
      <Sparkles size={11} style={{ color: "hsl(40 90% 50%)" }} />
    </motion.div>
  </motion.div>
);

const DocumentUploadView = ({ onBack }: DocumentUploadViewProps) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<"activity" | "chat">("activity");
  const [chatInput, setChatInput] = useState("");
  const [promptValue, setPromptValue] = useState("");
  const [bubblesMinimized, setBubblesMinimized] = useState(false);
  const [displayedMessage, setDisplayedMessage] = useState("");
  const [workflowMessages, setWorkflowMessages] = useState<WorkflowMessage[]>([]);
  const [workflowTyping, setWorkflowTyping] = useState(false);
  const [messageComplete, setMessageComplete] = useState(false);
  const [lhsCollapsed, setLhsCollapsed] = useState(false);
  const [rhsCollapsed, setRhsCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleFiles, setVisibleFiles] = useState<Set<string>>(new Set());
  const [treeFullyLoaded, setTreeFullyLoaded] = useState(false);
  const [allExpanded, setAllExpanded] = useState<boolean | null>(null);

  // Progressive file tree loading
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    allFileLabels.forEach((label, i) => {
      timers.push(setTimeout(() => {
        setVisibleFiles((prev) => new Set([...prev, label]));
        if (i === allFileLabels.length - 1) {
          setTimeout(() => setTreeFullyLoaded(true), 300);
        }
      }, 400 + i * 180));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  // Progressive text reveal
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setDisplayedMessage(lukaFullMessage.slice(0, idx));
      if (idx >= lukaFullMessage.length) {
        clearInterval(interval);
        setMessageComplete(true);
      }
    }, 18);
    return () => clearInterval(interval);
  }, []);

  const handleWorkflowAction = useCallback((label: string) => {
    const workflow = engagementWorkflows[label];
    if (!workflow) {
      setPromptValue(label);
      return;
    }
    const userMsg: WorkflowMessage = {
      id: Date.now(),
      sender: "user",
      text: label,
      timestamp: "Just now",
    };
    setWorkflowMessages((prev) => [...prev, userMsg]);
    setWorkflowTyping(true);

    setTimeout(() => {
      const lukaMsg: WorkflowMessage = {
        id: Date.now() + 1,
        sender: "luka",
        text: workflow.reply,
        steps: workflow.steps,
        timestamp: "Just now",
      };
      setWorkflowMessages((prev) => [...prev, lukaMsg]);
      setWorkflowTyping(false);
    }, 1200);
  }, []);

  return (
    <div className="luka-workspace-root" style={{ fontSize: "16px" }}>
      <div className="luka-workspace-gradient" />

      {/* ═══ LEFT PANEL — File Navigation ═══ */}
      <motion.div
        className="luka-workspace-left"
        animate={{ width: lhsCollapsed ? 44 : 242, minWidth: lhsCollapsed ? 44 : 242 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        style={{ overflow: "visible", position: "relative", zIndex: 10 }}
      >
        <div className={`flex flex-col h-full ${lhsCollapsed ? 'items-center' : ''}`} style={{ scrollbarWidth: "none", overflowX: "visible", overflowY: "auto" }}>
          {/* Back + collapse toggle */}
          <div className={`flex items-center ${lhsCollapsed ? 'flex-col gap-2 pt-3 pb-1' : 'gap-1.5 px-3 pt-3 pb-2'}`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className={lhsCollapsed ? "w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-colors" : "doc-upload-back-btn"}
              style={lhsCollapsed ? {
                background: "hsl(var(--muted))",
                color: "hsl(var(--muted-foreground))",
              } : undefined}
              title="Back"
            >
              <ArrowLeft size={14} />
              {!lhsCollapsed && <span>Back</span>}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setLhsCollapsed(!lhsCollapsed)}
              className={`p-1.5 rounded-md cursor-pointer transition-all duration-200 ${!lhsCollapsed ? 'ml-auto' : ''}`}
              style={{ color: "hsl(var(--muted-foreground))" }}
              title={lhsCollapsed ? "Expand panel" : "Collapse panel"}
            >
              {lhsCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            </motion.button>
          </div>

          {/* ─── Collapsed icon-only view ─── */}
          {lhsCollapsed && (
            <div className="flex flex-col items-center gap-1 mt-1 flex-1 w-full px-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
              {/* Start New Thread button */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-150 relative group"
                style={{
                  background: "linear-gradient(135deg, hsl(207 71% 38% / 0.10), hsl(260 70% 60% / 0.08))",
                  border: "1px solid hsl(207 71% 38% / 0.18)",
                  color: "hsl(207 71% 34%)",
                }}
                title="Start new thread"
              >
                <Plus size={14} />
                <div className="lhs-tooltip">Start new thread</div>
              </motion.button>

              {/* Search button */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-150 relative group"
                style={{
                  background: "transparent",
                  border: "1px solid transparent",
                  color: "hsl(var(--muted-foreground))",
                }}
                title="Search files"
              >
                <Search size={14} />
                <div className="lhs-tooltip">Search files</div>
              </motion.button>

              {/* Separator */}
              <div className="w-5 h-px rounded-full my-1" style={{ background: "hsl(var(--border))" }} />

              {/* Collapsed file tree with parent + children */}
              {fileTree.map((node) => {
                const Icon = node.icon;
                const isParentSelected = selectedFile === node.label;
                const hasChildren = node.children && node.children.length > 0;

                return (
                  <div key={node.label} className="flex flex-col items-center gap-0.5 w-full">
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => {
                        setSelectedFile(node.label);
                        setLhsCollapsed(false);
                      }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-150 relative group"
                      style={{
                        background: isParentSelected
                          ? "linear-gradient(135deg, hsl(207 71% 38% / 0.12), hsl(260 70% 60% / 0.08))"
                          : "transparent",
                        border: isParentSelected
                          ? "1px solid hsl(207 71% 38% / 0.2)"
                          : "1px solid transparent",
                        color: isParentSelected ? "hsl(207 71% 34%)" : "hsl(var(--muted-foreground))",
                      }}
                      title={node.label}
                    >
                      <Icon size={14} />
                      <div className="lhs-tooltip">{node.label}</div>
                    </motion.button>
                    {/* Child items as smaller dots/icons */}
                    {hasChildren && node.children!.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildSelected = selectedFile === child.label;
                      return (
                        <motion.button
                          key={child.label}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setSelectedFile(child.label);
                            setLhsCollapsed(false);
                          }}
                          className="w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-150 relative group"
                          style={{
                            background: isChildSelected
                              ? "hsl(207 71% 38% / 0.10)"
                              : "transparent",
                            border: isChildSelected
                              ? "1px solid hsl(207 71% 38% / 0.15)"
                              : "1px solid transparent",
                            color: isChildSelected ? "hsl(207 71% 38%)" : "hsl(var(--muted-foreground) / 0.5)",
                          }}
                          title={child.label}
                        >
                          <ChildIcon size={10} />
                          <div className="lhs-tooltip">{child.label}</div>
                        </motion.button>
                      );
                    })}
                  </div>
                );
              })}

              {/* Bottom progress indicator */}
              <div className="mt-auto pb-3 flex flex-col items-center gap-2 w-full px-1">
                <div className="w-5 h-px rounded-full" style={{ background: "hsl(var(--border))" }} />
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center relative group"
                  style={{
                    background: "linear-gradient(135deg, hsl(145 60% 42% / 0.1), hsl(207 71% 38% / 0.06))",
                    border: "1px solid hsl(145 60% 42% / 0.2)",
                  }}
                  title="Automation Complete"
                >
                  <Bot size={14} style={{ color: "hsl(145 60% 38%)" }} />
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                    style={{ background: "hsl(145 60% 42%)", border: "1.5px solid hsl(var(--background))" }}
                  />
                  <div className="lhs-tooltip">
                    <div>14 files processed</div>
                    <div style={{ color: "hsl(145 60% 60%)" }}>100% Complete</div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* ─── Expanded full view ─── */}
          {!lhsCollapsed && (
            <div className="flex-1 flex flex-col overflow-y-auto px-3" style={{ scrollbarWidth: "none" }}>
              {/* Start New Thread + Search */}
              <div className="flex items-center gap-1.5 mb-2">
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-[12px] font-semibold cursor-pointer transition-all duration-150"
                  style={{
                    background: "linear-gradient(135deg, hsl(207 71% 38% / 0.08), hsl(260 70% 60% / 0.05))",
                    border: "1px solid hsl(207 71% 38% / 0.15)",
                    color: "hsl(207 71% 31%)",
                  }}
                >
                  <Plus size={13} className="shrink-0" />
                  <span>New Thread</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchQuery(""); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-150"
                  style={{
                    background: searchOpen ? "hsl(207 71% 38% / 0.10)" : "hsl(var(--muted))",
                    color: searchOpen ? "hsl(207 71% 31%)" : "hsl(var(--muted-foreground))",
                    border: searchOpen ? "1px solid hsl(207 71% 38% / 0.2)" : "1px solid hsl(var(--border))",
                  }}
                  title="Search files"
                >
                  {searchOpen ? <X size={13} /> : <Search size={13} />}
                </motion.button>
              </div>

              {/* Search input */}
              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden mb-2"
                  >
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-[6px] rounded-lg"
                      style={{
                        background: "hsl(var(--muted) / 0.5)",
                        border: "1px solid hsl(var(--border))",
                      }}
                    >
                      <Search size={12} style={{ color: "hsl(var(--muted-foreground))" }} className="shrink-0" />
                      <input
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search files..."
                        className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-[hsl(var(--muted-foreground))]"
                        style={{ color: "hsl(var(--foreground))" }}
                      />
                      {searchQuery && (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSearchQuery("")}
                          className="p-0.5 rounded cursor-pointer"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          <X size={11} />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Separator */}
              <div className="h-px rounded-full mb-2" style={{ background: "hsl(var(--border))" }} />

              {/* File Tree */}
              <div className="mb-3">
                <div className="flex items-center justify-between px-2 mb-2">
                  <span
                    className="text-[11px] font-bold uppercase tracking-widest"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    File
                  </span>
                  <div className="flex items-center gap-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setAllExpanded(prev => prev === true ? null : true)}
                      title="Expand all"
                      className="w-5 h-5 rounded flex items-center justify-center transition-colors"
                      style={{
                        color: "hsl(var(--muted-foreground))",
                        background: allExpanded === true ? "hsl(207 71% 38% / 0.1)" : "transparent",
                      }}
                    >
                      <ChevronDown size={11} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setAllExpanded(prev => prev === false ? null : false)}
                      title="Collapse all"
                      className="w-5 h-5 rounded flex items-center justify-center transition-colors"
                      style={{
                        color: "hsl(var(--muted-foreground))",
                        background: allExpanded === false ? "hsl(207 71% 38% / 0.1)" : "transparent",
                      }}
                    >
                      <ChevronRight size={11} />
                    </motion.button>
                  </div>
                </div>
                <div className="space-y-0.5">
                  {fileTree
                    .filter((node) => !searchQuery || nodeMatchesSearch(node, searchQuery))
                    .map((node, i) => (
                    <motion.div
                      key={node.label}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.08, duration: 0.35, ease: "easeOut" }}
                    >
                      <FileTreeItem
                        node={node}
                        selectedFile={selectedFile}
                        onSelect={setSelectedFile}
                        searchQuery={searchQuery}
                        visibleFiles={visibleFiles}
                        treeFullyLoaded={treeFullyLoaded}
                        allExpanded={allExpanded}
                      />
                    </motion.div>
                  ))}
                  {searchQuery && !fileTree.some((n) => nodeMatchesSearch(n, searchQuery)) && (
                    <p className="text-[11px] px-2 py-3" style={{ color: "hsl(var(--muted-foreground))" }}>
                      No files matching "{searchQuery}"
                    </p>
                  )}
                </div>
              </div>

              {/* Progress summary */}
              <div className="mt-auto px-2 pb-3">
                <div
                  className="rounded-xl p-3"
                  style={{
                    background: "linear-gradient(135deg, hsl(207 71% 38% / 0.06), hsl(145 60% 42% / 0.06))",
                    border: "1px solid hsl(207 71% 38% / 0.12)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Bot size={12} style={{ color: "hsl(207 71% 38%)" }} />
                    <span className="text-[12px] font-bold" style={{ color: "hsl(220 20% 18%)" }}>
                      Automation Complete
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: "hsl(var(--muted))" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: "100%", background: "hsl(145 60% 42%)" }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Sparkles size={10} style={{ color: "hsl(40 90% 50%)" }} />
                    <span className="text-[11px]" style={{ color: "hsl(220 18% 40%)" }}>
                      14 files processed, 5 categories
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ CENTER PANEL — Luka Message + Prompter ═══ */}
      <div className="luka-workspace-center">
        {/* Context Bar */}
        <div
          className="flex items-center gap-3 px-5 py-2 shrink-0"
          style={{
            borderBottom: "1px solid hsl(var(--border))",
            background: "hsl(var(--background) / 0.8)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "hsl(var(--muted))" }}>
              <FileText size={11} style={{ color: "hsl(var(--muted-foreground))" }} />
            </div>
            <span className="text-[14px] font-semibold" style={{ color: "hsl(var(--foreground))" }}>ABC Pvt. Ltd.</span>
          </div>
          <span className="text-[14px]" style={{ color: "hsl(var(--muted-foreground))" }}>›</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-semibold" style={{ color: "hsl(var(--foreground))" }}>COM-SID-Dec312024</span>
          </div>
          <div
            className="flex items-center gap-1 px-2.5 py-1.5"
            style={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          >
            <img src={quickbooksLogo} alt="QuickBooks" className="h-5 w-auto object-contain" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="flex items-center gap-1.5 px-2.5 py-1 ml-auto"
            style={{
              borderRadius: "8px",
              background: "hsl(145 60% 42% / 0.08)",
              border: "1px solid hsl(145 60% 42% / 0.2)",
            }}
          >
            <Unlock size={11} style={{ color: "hsl(145 60% 38%)" }} />
            <span className="text-[11px] font-bold" style={{ color: "hsl(145 55% 32%)" }}>File Open</span>
          </motion.div>
          <div className="flex items-center -space-x-1.5">
            {[
              { initials: "AP", bg: "hsl(207 71% 38%)" },
              { initials: "TJ", bg: "hsl(280 70% 55%)" },
              { initials: "PT", bg: "hsl(320 70% 50%)" },
            ].map((m) => (
              <div
                key={m.initials}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-background"
                style={{ background: m.bg, color: "white" }}
              >
                {m.initials}
              </div>
            ))}
          </div>
        </div>

        {/* Luka message area */}
        <div className="flex-1 overflow-y-auto px-6 pt-6" style={{ scrollbarWidth: "none" }}>
          {selectedFile === "Engagement Letter" ? (
            <EngagementLetterDocument />
          ) : selectedFile === "Management Responsibility Letter" ? (
            <ManagementResponsibilityLetter />
          ) : selectedFile === "Client Acceptance & Continuance" || selectedFile === "Independence" || selectedFile === "Knowledge of Client Business" || selectedFile === "Planning" ? (
            <ChecklistDocument checklistName={selectedFile} />
          ) : (
          /* Luka message bubble */
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-3 w-full"
          >
            {/* Luka avatar */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0px hsl(207 71% 38% / 0.2)",
                  "0 0 16px hsl(207 71% 38% / 0.35)",
                  "0 0 0px hsl(207 71% 38% / 0.2)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, hsl(207 71% 38% / 0.15), hsl(260 70% 60% / 0.12))",
                border: "1.5px solid hsl(207 71% 38% / 0.25)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="luka-msg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9747FF" />
                    <stop offset="100%" stopColor="#115697" />
                  </linearGradient>
                </defs>
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#luka-msg-grad)" />
              </svg>
            </motion.div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[13px] font-bold" style={{ background: "linear-gradient(135deg, #9747FF, #115697)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Luka
                </span>
                <span className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>Just now</span>
                {messageComplete && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{
                      background: "hsl(145 60% 42% / 0.08)",
                      border: "1px solid hsl(145 60% 42% / 0.2)",
                      color: "hsl(145 55% 32%)",
                    }}
                  >
                    <CheckCircle2 size={9} />
                    Complete
                  </motion.span>
                )}
              </div>
              <p className="text-[14px] leading-relaxed whitespace-pre-line" style={{ color: "hsl(var(--foreground))" }}>
                  {displayedMessage}
                  {!messageComplete && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                      className="inline-block w-0.5 h-4 ml-0.5 align-middle rounded-full"
                      style={{ background: "hsl(207 71% 38%)" }}
                    />
                  )}
                </p>

            </div>
          </motion.div>
          )}

          {/* Workflow conversation thread */}
          {selectedFile === "Engagement Letter" && workflowMessages.length > 0 && (
            <div className="px-6 pb-4 space-y-4">
              {workflowMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start gap-3 ${msg.sender === "user" ? "justify-end" : ""}`}
                >
                  {msg.sender === "luka" && (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: "linear-gradient(135deg, hsl(207 71% 38% / 0.15), hsl(260 70% 60% / 0.12))",
                        border: "1.5px solid hsl(207 71% 38% / 0.25)",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <defs><linearGradient id="wf-bolt" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#9747FF" /><stop offset="100%" stopColor="#115697" /></linearGradient></defs>
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#wf-bolt)" />
                      </svg>
                    </div>
                  )}
                  <div className={`max-w-[85%] ${msg.sender === "user" ? "text-right" : ""}`}>
                    {msg.sender === "user" ? (
                      <div
                        className="inline-block px-4 py-2.5 rounded-2xl rounded-tr-sm text-[13px] font-medium"
                        style={{
                          background: "linear-gradient(135deg, hsl(207 71% 38%), hsl(260 70% 58%))",
                          color: "white",
                          boxShadow: "0 2px 10px hsl(207 71% 38% / 0.25)",
                        }}
                      >
                        {msg.text}
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12px] font-bold" style={{ background: "linear-gradient(135deg, #9747FF, #115697)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Luka</span>
                          <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{msg.timestamp}</span>
                        </div>
                        <p className="text-[13px] leading-relaxed mb-2" style={{ color: "hsl(var(--foreground))" }}>{msg.text}</p>
                        {msg.steps && (
                          <div className="space-y-1.5">
                            {msg.steps.map((step, si) => (
                              <motion.div
                                key={si}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + si * 0.08 }}
                                className="flex items-start gap-2 px-3 py-2 rounded-xl text-[12px]"
                                style={{
                                  background: "hsl(var(--muted) / 0.35)",
                                  border: "1px solid hsl(var(--border) / 0.3)",
                                  color: "hsl(var(--foreground) / 0.85)",
                                }}
                              >
                                {step}
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {workflowTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 px-3 py-2"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: "linear-gradient(135deg, hsl(207 71% 38% / 0.15), hsl(260 70% 60% / 0.12))",
                      border: "1.5px solid hsl(207 71% 38% / 0.25)",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <defs><linearGradient id="wf-bolt-t" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#9747FF" /><stop offset="100%" stopColor="#115697" /></linearGradient></defs>
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#wf-bolt-t)" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "hsl(207 71% 38%)" }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Quick action floating bubbles */}
        {(selectedFile === "Engagement Letter" || selectedFile === "Management Responsibility Letter" || selectedFile === "Client Acceptance & Continuance" || selectedFile === "Independence" || selectedFile === "Knowledge of Client Business" || selectedFile === "Planning") && (
          <div className="px-4 pb-2 pt-1 shrink-0">
            <AnimatePresence mode="wait">
              {bubblesMinimized ? (
                <motion.div
                  key="minimized"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex justify-end"
                >
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setBubblesMinimized(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium cursor-pointer"
                    style={{
                      background: "hsl(0 0% 100% / 0.45)",
                      backdropFilter: "blur(16px)",
                      border: "1px solid hsl(var(--border) / 0.4)",
                      color: "hsl(var(--muted-foreground))",
                    }}
                  >
                    <Sparkles size={11} />
                    Quick Actions
                    <ChevronDown size={11} />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 flex flex-wrap gap-2">
                      {(selectedFile === "Engagement Letter"
                        ? ["Share with client now", "Edit fees", "Update signature", "Validate dates", "Update header", "Update footer", "Finalize Letter", "Replace Engagement Letter"]
                        : selectedFile === "Management Responsibility Letter"
                        ? ["Send to management", "Edit responsibilities", "Update acknowledgments", "Validate compliance", "Finalize Letter", "Replace Letter"]
                        : ["Mark all as reviewed", "Auto-fill remaining", "Export checklist", "Send for partner review", "Validate responses", "Save to engagement"]
                      ).map((label, i) => (
                        <motion.button
                          key={label}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 + i * 0.05, duration: 0.3 }}
                          whileHover={{ scale: 1.04, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleWorkflowAction(label)}
                          className="px-3.5 py-2 rounded-full text-[12px] font-medium cursor-pointer transition-all duration-200"
                          style={{
                            background: "hsl(0 0% 100% / 0.35)",
                            backdropFilter: "blur(16px) saturate(1.4)",
                            WebkitBackdropFilter: "blur(16px) saturate(1.4)",
                            border: "1px solid hsl(var(--border) / 0.35)",
                            color: "hsl(var(--foreground) / 0.75)",
                            boxShadow: "0 1px 6px hsl(220 30% 50% / 0.05), inset 0 1px 0 hsl(0 0% 100% / 0.3)",
                          }}
                          onMouseEnter={(e) => {
                            const isGreen = selectedFile === "Management Responsibility Letter";
                            const isChecklist = !["Engagement Letter", "Management Responsibility Letter"].includes(selectedFile || "");
                            const hoverBg = isGreen ? "hsl(145 60% 42% / 0.12)" : isChecklist ? "hsl(260 70% 58% / 0.1)" : "hsl(207 71% 38% / 0.1)";
                            const hoverBorder = isGreen ? "hsl(145 60% 42% / 0.3)" : isChecklist ? "hsl(260 70% 58% / 0.3)" : "hsl(207 71% 38% / 0.3)";
                            const hoverColor = isGreen ? "hsl(145 55% 28%)" : isChecklist ? "hsl(260 60% 40%)" : "hsl(210 80% 35%)";
                            const hoverShadow = isGreen ? "0 3px 14px hsl(145 60% 42% / 0.15)" : isChecklist ? "0 3px 14px hsl(260 70% 58% / 0.15)" : "0 3px 14px hsl(207 71% 38% / 0.15)";
                            e.currentTarget.style.background = hoverBg;
                            e.currentTarget.style.borderColor = hoverBorder;
                            e.currentTarget.style.color = hoverColor;
                            e.currentTarget.style.boxShadow = hoverShadow;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "hsl(0 0% 100% / 0.35)";
                            e.currentTarget.style.borderColor = "hsl(var(--border) / 0.35)";
                            e.currentTarget.style.color = "hsl(var(--foreground) / 0.75)";
                            e.currentTarget.style.boxShadow = "0 1px 6px hsl(220 30% 50% / 0.05), inset 0 1px 0 hsl(0 0% 100% / 0.3)";
                          }}
                        >
                          {label}
                        </motion.button>
                      ))}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setBubblesMinimized(true)}
                      className="flex items-center gap-1 px-2.5 py-2 rounded-full text-[11px] cursor-pointer shrink-0"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      <X size={10} />
                      Minimize
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}



        {/* Prompter at bottom */}
        <div className="px-4 pb-4 pt-2 shrink-0">
          <div className="luka-input-wrapper">
            <textarea
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              placeholder="Type # for prompts or just ask anything..."
              rows={2}
              className="luka-input"
            />
            <div className="flex items-center justify-between pt-1 px-1">
              <div className="flex items-center gap-2">
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="luka-input-action">
                  <Plus size={16} />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="luka-input-action">
                  <FolderOpen size={16} />
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="luka-model-badge">
                  <Sparkles size={12} style={{ color: "hsl(40 90% 50%)" }} />
                  <span>Gemini 3 Flash</span>
                </motion.button>
              </div>
              <div className="flex items-center gap-2">
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="luka-input-action">
                  <Mic size={16} />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="luka-send-btn">
                  <Send size={16} />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL — Activity + Chat ═══ */}
      <motion.div
        className="luka-workspace-right"
        animate={{ width: rhsCollapsed ? 44 : 280, minWidth: rhsCollapsed ? 44 : 280 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        style={{ overflow: "hidden" }}
      >
        <div className={`flex flex-col h-full ${rhsCollapsed ? 'items-center' : ''}`} style={{ overflow: "hidden" }}>
          {/* Collapse toggle */}
          <div className={`flex items-center ${rhsCollapsed ? 'flex-col gap-2 pt-3 pb-1' : 'px-2 pt-3 pb-1 justify-end'}`}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setRhsCollapsed(!rhsCollapsed)}
              className="p-1.5 rounded-md cursor-pointer transition-all duration-200"
              style={{ color: "hsl(var(--muted-foreground))" }}
              title={rhsCollapsed ? "Expand panel" : "Collapse panel"}
            >
              {rhsCollapsed ? <PanelRightOpen size={15} /> : <PanelRightClose size={15} />}
            </motion.button>
          </div>

          {/* ─── Collapsed icon-only view ─── */}
          {rhsCollapsed && (
            <div className="flex flex-col items-center gap-1 mt-2 flex-1 w-full px-1" style={{ overflow: "hidden" }}>
              <div className="w-5 h-px rounded-full mb-1" style={{ background: "hsl(var(--border))" }} />

              {/* Completion indicator */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setRhsCollapsed(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-150 relative group"
                style={{
                  background: "linear-gradient(135deg, hsl(207 71% 38% / 0.1), hsl(260 70% 60% / 0.06))",
                  border: "1px solid hsl(207 71% 38% / 0.15)",
                  color: "hsl(207 71% 34%)",
                }}
                title="File Completion: 68%"
              >
                <CheckCircle2 size={14} />
                <div
                  className="absolute left-auto right-full mr-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
                  style={{
                    background: "hsl(220 20% 18%)",
                    color: "hsl(0 0% 96%)",
                    boxShadow: "0 4px 12px hsl(220 30% 10% / 0.25)",
                  }}
                >
                  68% Complete
                </div>
              </motion.button>

              {/* Activity icon */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => { setRightTab("activity"); setRhsCollapsed(false); }}
                className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-150 relative group"
                style={{
                  background: rightTab === "activity" ? "linear-gradient(135deg, hsl(207 71% 38% / 0.1), hsl(260 70% 60% / 0.06))" : "transparent",
                  border: rightTab === "activity" ? "1px solid hsl(207 71% 38% / 0.15)" : "1px solid transparent",
                  color: rightTab === "activity" ? "hsl(207 71% 34%)" : "hsl(var(--muted-foreground))",
                }}
                title="Activity"
              >
                <Activity size={14} />
                <div
                  className="absolute left-auto right-full mr-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
                  style={{
                    background: "hsl(220 20% 18%)",
                    color: "hsl(0 0% 96%)",
                    boxShadow: "0 4px 12px hsl(220 30% 10% / 0.25)",
                  }}
                >
                  Activity
                </div>
              </motion.button>

              {/* Chat icon */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => { setRightTab("chat"); setRhsCollapsed(false); }}
                className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-150 relative group"
                style={{
                  background: rightTab === "chat" ? "linear-gradient(135deg, hsl(207 71% 38% / 0.1), hsl(260 70% 60% / 0.06))" : "transparent",
                  border: rightTab === "chat" ? "1px solid hsl(207 71% 38% / 0.15)" : "1px solid transparent",
                  color: rightTab === "chat" ? "hsl(207 71% 34%)" : "hsl(var(--muted-foreground))",
                }}
                title="Team Chat"
              >
                <MessageCircle size={14} />
                <div
                  className="absolute left-auto right-full mr-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
                  style={{
                    background: "hsl(220 20% 18%)",
                    color: "hsl(0 0% 96%)",
                    boxShadow: "0 4px 12px hsl(220 30% 10% / 0.25)",
                  }}
                >
                  Team Chat
                </div>
              </motion.button>

              {/* Credits indicator at bottom */}
              <div className="mt-auto pb-3 flex flex-col items-center gap-2 w-full px-1">
                <div className="w-5 h-px rounded-full" style={{ background: "hsl(var(--border))" }} />
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center relative group"
                  style={{
                    background: "hsl(145 60% 42% / 0.1)",
                    border: "1px solid hsl(145 60% 42% / 0.2)",
                  }}
                  title="Credits: 12 used / 38 remaining"
                >
                  <Sparkles size={14} style={{ color: "hsl(145 60% 38%)" }} />
                  <div
                    className="absolute left-auto right-full mr-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
                    style={{
                      background: "hsl(220 20% 18%)",
                      color: "hsl(0 0% 96%)",
                      boxShadow: "0 4px 12px hsl(220 30% 10% / 0.25)",
                    }}
                  >
                    <div>Credits: 12 used</div>
                    <div style={{ color: "hsl(145 60% 60%)" }}>38 remaining</div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* ─── Expanded full view ─── */}
          {!rhsCollapsed && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* File Completion & Credits — Enhanced */}
              <div className="px-3 pt-3 pb-2 shrink-0">
                <div
                  className="rounded-2xl p-4 mb-3 relative overflow-hidden"
                  style={{
                    background: "linear-gradient(145deg, hsl(0 0% 100% / 0.75), hsl(210 40% 98% / 0.6))",
                    border: "1px solid hsl(207 71% 38% / 0.12)",
                    backdropFilter: "blur(16px)",
                    boxShadow: "0 4px 20px hsl(207 71% 38% / 0.06), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
                  }}
                >
                  {/* Decorative gradient orb */}
                  <div
                    className="absolute -top-6 -right-6 w-20 h-20 rounded-full"
                    style={{
                      background: "radial-gradient(circle, hsl(207 71% 38% / 0.08), transparent 70%)",
                    }}
                  />

                  {/* Completion */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center"
                        style={{
                          background: "linear-gradient(135deg, hsl(207 71% 38% / 0.12), hsl(260 70% 58% / 0.08))",
                        }}
                      >
                        <CheckCircle2 size={10} style={{ color: "hsl(207 71% 34%)" }} />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "hsl(220 18% 35%)" }}>Completion</span>
                    </div>
                    <span
                      className="text-[13px] font-extrabold"
                      style={{ background: "linear-gradient(135deg, hsl(207 71% 38%), hsl(260 70% 58%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                    >
                      68%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full mb-4" style={{ background: "hsl(var(--muted))" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "68%" }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                      className="h-full rounded-full relative overflow-hidden"
                      style={{ background: "linear-gradient(90deg, hsl(207 71% 38%), hsl(260 70% 58%))" }}
                    >
                      <motion.div
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                        className="absolute inset-0"
                        style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.3), transparent)" }}
                      />
                    </motion.div>
                  </div>

                  {/* Divider */}
                  <div className="h-px rounded-full mb-3" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--border)), transparent)" }} />

                  {/* Credits */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center"
                        style={{
                          background: "linear-gradient(135deg, hsl(145 60% 42% / 0.12), hsl(207 71% 38% / 0.06))",
                        }}
                      >
                        <Sparkles size={10} style={{ color: "hsl(145 60% 38%)" }} />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "hsl(220 18% 35%)" }}>Credits</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 rounded-lg p-2" style={{ background: "hsl(145 60% 42% / 0.06)", border: "1px solid hsl(145 60% 42% / 0.12)" }}>
                      <span className="text-[9px] uppercase tracking-wider font-semibold block" style={{ color: "hsl(145 55% 38%)" }}>Used</span>
                      <span className="text-[15px] font-extrabold" style={{ color: "hsl(145 55% 30%)" }}>12</span>
                    </div>
                    <div className="flex-1 rounded-lg p-2" style={{ background: "hsl(220 30% 50% / 0.04)", border: "1px solid hsl(var(--border))" }}>
                      <span className="text-[9px] uppercase tracking-wider font-semibold block" style={{ color: "hsl(var(--muted-foreground))" }}>Remaining</span>
                      <span className="text-[15px] font-extrabold" style={{ color: "hsl(220 18% 25%)" }}>38</span>
                    </div>
                  </div>
                  <div className="w-full h-1 rounded-full" style={{ background: "hsl(var(--muted))" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "24%" }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.7 }}
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, hsl(145 60% 42%), hsl(145 50% 55%))" }}
                    />
                  </div>
                </div>
              </div>

              {/* Tabs — Enhanced */}
              <div className="flex items-center gap-1 px-3 pb-2 shrink-0">
                {([
                  { id: "activity" as const, label: "Activity", icon: <Activity size={12} /> },
                  { id: "chat" as const, label: "Team Chat", icon: <MessageCircle size={12} /> },
                ]).map((tab) => (
                  <motion.button
                    key={tab.id}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setRightTab(tab.id)}
                    className="flex items-center gap-1.5 px-3 py-[6px] rounded-lg text-[11px] font-semibold transition-all duration-200 cursor-pointer"
                    style={{
                      background: rightTab === tab.id
                        ? "linear-gradient(135deg, hsl(207 71% 38% / 0.10), hsl(260 70% 60% / 0.06))"
                        : "transparent",
                      border: rightTab === tab.id
                        ? "1px solid hsl(207 71% 38% / 0.18)"
                        : "1px solid transparent",
                      color: rightTab === tab.id ? "hsl(207 71% 31%)" : "hsl(var(--muted-foreground))",
                      boxShadow: rightTab === tab.id ? "0 2px 8px hsl(207 71% 38% / 0.08)" : "none",
                    }}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.id === "activity" && (
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "hsl(145 60% 42%)" }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto px-3 pb-3" style={{ scrollbarWidth: "none" }}>
                <AnimatePresence mode="wait">
                  {rightTab === "activity" ? (
                    <motion.div
                      key="activity"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-1.5"
                    >
                      {activityLog.map((entry, i) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl transition-all duration-150"
                          style={{
                            background: "hsl(0 0% 100% / 0.5)",
                            border: "1px solid hsl(var(--border) / 0.6)",
                            boxShadow: "0 1px 4px hsl(220 30% 50% / 0.04)",
                          }}
                          whileHover={{
                            y: -1,
                            boxShadow: "0 3px 12px hsl(220 30% 50% / 0.08)",
                          }}
                        >
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              background: entry.type === "flag"
                                ? "hsl(30 90% 50% / 0.10)"
                                : "hsl(145 60% 42% / 0.10)",
                            }}
                          >
                            {entry.type === "flag" ? (
                              <AlertTriangle size={11} style={{ color: "hsl(30 90% 45%)" }} />
                            ) : (
                              <CheckCircle2 size={11} style={{ color: "hsl(145 63% 38%)" }} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] leading-snug font-medium" style={{ color: "hsl(220 18% 25%)" }}>
                              {entry.text}
                            </p>
                            <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                              {entry.time}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="chat"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-1.5"
                    >
                      {teamMessages.map((msg, i) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl transition-all duration-150"
                          style={{
                            background: "hsl(0 0% 100% / 0.5)",
                            border: "1px solid hsl(var(--border) / 0.6)",
                            boxShadow: "0 1px 4px hsl(220 30% 50% / 0.04)",
                          }}
                          whileHover={{
                            y: -1,
                            boxShadow: "0 3px 12px hsl(220 30% 50% / 0.08)",
                          }}
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 ring-2 ring-white"
                            style={{ background: msg.color, boxShadow: `0 2px 8px ${msg.color}40` }}
                          >
                            <span className="text-[9px] font-bold text-white">{msg.initials}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold" style={{ color: "hsl(220 20% 18%)" }}>
                                {msg.user}
                              </span>
                              <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                                {msg.time}
                              </span>
                            </div>
                            <p className="text-[12px] leading-snug mt-0.5" style={{ color: "hsl(220 15% 35%)" }}>
                              {msg.message.split(/(@\w+)/g).map((part, pi) =>
                                part.startsWith("@") ? (
                                  <span key={pi} className="font-semibold" style={{ color: "hsl(207 71% 34%)" }}>
                                    {part}
                                  </span>
                                ) : (
                                  part
                                )
                              )}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Chat input (always visible in chat tab) */}
              {rightTab === "chat" && (
                <div className="px-3 pb-3 shrink-0">
                  <div className="luka-workspace-team-input-wrap">
                    <div className="flex items-center gap-2">
                      <motion.button whileHover={{ scale: 1.1 }} className="luka-workspace-prompt-action">
                        <AtSign size={13} />
                      </motion.button>
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Message team... Use @ to mention"
                        className="luka-workspace-team-input flex-1"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="luka-workspace-send-btn"
                        style={{ padding: "6px" }}
                      >
                        <Send size={12} />
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DocumentUploadView;
