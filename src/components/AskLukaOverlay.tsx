import React, { useState, useRef, useCallback, useEffect } from "react";
import { LukaAttachMenu, AttachedFilesBar, useAttachedFiles } from "@/components/luka/LukaAttachMenu";
import { VoiceRecordingOverlay } from "@/components/luka/VoiceRecordingOverlay";
import {
  X, Mic, Plus, Search, MessageSquare, Minus, Send, Inbox, Maximize2,
  ChevronLeft, ChevronRight, Clock, PanelLeftClose, MoreHorizontal,
  Zap, Building2, CheckCircle2, ChevronDown, SlidersHorizontal,
  Bell, Settings, ArrowLeft, Lock, Upload, FileText, Mail, Square,
  FolderOpen, RotateCcw, Sparkles, Eye, Pin, LayoutList, CalendarDays, CalendarRange,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/wp-ui/button";
import { ScrollArea } from "@/components/wp-ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/wp-ui/tooltip";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/wp-ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PromptPicker } from "@/components/luka/PromptPicker";
import { GrossMarginResponse } from "@/components/luka/GrossMarginResponse";
import { LukaResponseActions } from "@/components/luka/LukaResponseActions";
import { useStore } from "@/store/useStore";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { Loan } from "@/types";

// ─── Autopilot types ────────────────────────────────────────────────────────
type AutopilotStep =
  | "init"
  | "verification"
  | "checklists"
  | "letters"
  | "workingpapers"
  | "fsmapping"
  | "magic"
  | "automating"
  | "observation";

type VerifyRow = { label: string; value: string; showCheck: boolean };

// ─── Static data ─────────────────────────────────────────────────────────────
const statusColors = ["bg-green-500","bg-green-500","bg-amber-500","bg-green-500","bg-green-500","bg-green-500","bg-purple-500","bg-purple-500","bg-amber-500","bg-green-500","bg-purple-500"];

const pinnedThreads = [
  { id: 1, name: "Emerging Trends in Accounting" },
  { id: 2, name: "Capital Asset Amortization" },
  { id: 3, name: "Generate Variance Analysis" },
  { id: 4, name: "Details on the report" },
  { id: 5, name: "Summarise uploaded report" },
  { id: 6, name: "Run Client Heath Check" },
  { id: 7, name: "Generate Trial Balance" },
  { id: 8, name: "Aged AR Analysis" },
  { id: 9, name: "General Ledger Analysis" },
  { id: 10, name: "Account Reconciliation" },
  { id: 11, name: "Notes Generator" },
];

const recentThreads = [
  { id: 12, name: "Emerging Trends in Accounting" },
  { id: 13, name: "Capital Asset Amortization" },
  { id: 14, name: "Generate Variance Analysis" },
  { id: 15, name: "Details on the report" },
  { id: 16, name: "Summarise uploaded report" },
  { id: 17, name: "Run Client Heath Check" },
  { id: 18, name: "Generate Trial Balance" },
  { id: 19, name: "Aged AR Analysis" },
];

const suggestions = [
  "#Variance Analysis",
  "#Account Reconciliation",
  "#Bank Reconciliation",
  "#Capital Asset Amortization",
];

const WP_THREADS = [
  { id: "capital-amort", label: "Capital Asset Amortization", desc: "The calculation of depreciation (amortization) expense for capital assets over their useful lives", required: true },
  { id: "lt-debt", label: "Long-term Debt", desc: "Schedule that summarizes and reconciles all long-term borrowings reported in the financial statements", required: true },
  { id: "aged-ar", label: "Aged AR Analysis", desc: "Schedule that categorizes outstanding customer balances based on how long they have been unpaid." },
  { id: "investment", label: "Investment Schedule", desc: "The calculation of depreciation (amortization) expense for capital assets over their useful lives" },
  { id: "lt-debt-2", label: "Long-term Debt (Continuity)", desc: "The calculation of depreciation (amortization) expense for capital assets over their useful lives" },
  { id: "interest-accrual", label: "Interest Accrual Working Paper", desc: "Accrued interest calculations and year-end adjustments for all loan facilities" },
];

const DEFAULT_WP_TOGGLES: Record<string, boolean> = {
  "capital-amort": true,
  "lt-debt": true,
  "aged-ar": true,
  "investment": true,
  "lt-debt-2": true,
  "interest-accrual": true,
};

const AUTOMATION_LOG_LINES = [
  "Checking uploaded checklists..",
  "Autopopulating Checklists..",
  "Checklists populated successfully..",
  "Generating amortization schedule..",
  "Running covenant compliance..",
  "Building FS disclosure notes..",
  "Cross-referencing working papers..",
  "Automation complete ✓",
];
const AUTOMATION_MILESTONES = [8, 20, 35, 52, 68, 80, 92, 100];

const DONUT_DATA = [{ name: "Complete", value: 72 }, { name: "Remaining", value: 28 }];
const DONUT_COLORS = ["hsl(var(--primary))", "hsl(var(--muted))"];

const WIZARD_TABS: { id: AutopilotStep; label: string }[] = [
  { id: "verification", label: "Verification" },
  { id: "checklists", label: "Checklists" },
  { id: "letters", label: "Letters" },
  { id: "workingpapers", label: "Working Papers" },
  { id: "fsmapping", label: "FS & Acc. Mapping" },
  { id: "magic", label: "Magic" },
];

// ─── Luka icon ───────────────────────────────────────────────────────────────
function LukaIcon({ size = 20 }: { size?: number }) {
  return <Zap className="text-white" size={size} fill="white" strokeWidth={0} />;
}

// ─── Luka message bubble (speech style from Figma) ──────────────────────────
function LukaMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 animate-in fade-in duration-300">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0 mt-0.5">
        <LukaIcon size={12} />
      </div>
      <div className="flex-1 text-sm text-foreground leading-relaxed">{children}</div>
    </div>
  );
}

// ─── Bold text helper ────────────────────────────────────────────────────────
function BoldText({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
        i % 2 === 1 ? <strong key={i} className="font-semibold text-foreground">{part}</strong> : part
      )}
    </>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
interface AskLukaOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AskLukaOverlay({ open, onOpenChange }: AskLukaOverlayProps) {
  // ── Threads chat state ──
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"threads" | "workspaces">("threads");
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [sectionOpen, setSectionOpen] = useState({ pinned: true, recent: true, active: true });
  const toggleSection = (key: "pinned" | "recent" | "active") =>
    setSectionOpen(s => ({ ...s, [key]: !s[key] }));
  type ThreadFilter = "all" | "pinned" | "recent" | "this-week" | "last-week" | "this-month";
  const [threadFilter, setThreadFilter] = useState<ThreadFilter>("all");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const THREAD_FILTERS: { id: ThreadFilter; label: string; Icon: React.ElementType }[] = [
    { id: "all",        label: "All threads", Icon: LayoutList     },
    { id: "pinned",     label: "Pinned",      Icon: Pin            },
    { id: "recent",     label: "Recent",      Icon: Clock          },
    { id: "this-week",  label: "This week",   Icon: CalendarDays   },
    { id: "last-week",  label: "Last week",   Icon: CalendarRange  },
    { id: "this-month", label: "This month",  Icon: CalendarDays   },
  ];
  const activeFilterLabel = THREAD_FILTERS.find(f => f.id === threadFilter)?.label ?? "All threads";

  type WorkspaceFilter = "all" | "pinned" | "active" | "this-week" | "last-week" | "this-month";
  const [workspaceFilter, setWorkspaceFilter] = useState<WorkspaceFilter>("all");
  const [wsFilterDropdownOpen, setWsFilterDropdownOpen] = useState(false);
  const wsFilterDropdownRef = useRef<HTMLDivElement>(null);
  const WORKSPACE_FILTERS: { id: WorkspaceFilter; label: string; Icon: React.ElementType }[] = [
    { id: "all",        label: "All workspaces", Icon: LayoutList    },
    { id: "pinned",     label: "Pinned",          Icon: Pin           },
    { id: "active",     label: "Active",          Icon: Zap           },
    { id: "this-week",  label: "This week",       Icon: CalendarDays  },
    { id: "last-week",  label: "Last week",       Icon: CalendarRange },
    { id: "this-month", label: "This month",      Icon: CalendarDays  },
  ];
  const activeWsFilterLabel = WORKSPACE_FILTERS.find(f => f.id === workspaceFilter)?.label ?? "All workspaces";
  const [viewMode, setViewMode] = useState<"full" | "half">("half");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [showPromptPicker, setShowPromptPicker] = useState(false);
  const [hashFilter, setHashFilter] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [displayedResponse, setDisplayedResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [richResponseType, setRichResponseType] = useState<"gross-margin" | null>(null);
  const [revealStep, setRevealStep] = useState(-1);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [editMode, setEditMode] = useState<'ask' | 'auto'>('auto');
  const inputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<number | null>(null);
  const revealRef = useRef<number | null>(null);
  const { files: attachedFiles, addFiles, removeFile, clearAll: clearFiles } = useAttachedFiles();

  // ── Store ──
  const loans = useStore(s => s.loans);
  const settings = useStore(s => s.settings);

  // ── Autopilot state ──
  const [autopilotLoanId, setAutopilotLoanId] = useState<string | null>(null);
  const [autopilotStep, setAutopilotStep] = useState<AutopilotStep | null>(null);
  const [activeWizardTab, setActiveWizardTab] = useState<AutopilotStep>("verification");
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  // Selected compilation workspace (replaces loan-based activeLoan for workspace flows)
  type CompWs = { id: string; name: string; ref: string; active: boolean; pinned: boolean };
  const [selectedCompWs, setSelectedCompWs] = useState<CompWs | null>(null);

  // Verification animation
  const [verifyPhase, setVerifyPhase] = useState<"idle" | "intro" | "msg2" | "reviewing" | "done">("idle");
  const [verifyRows, setVerifyRows] = useState<VerifyRow[]>([]);
  const verifyTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [lukaIsTyping, setLukaIsTyping] = useState(false);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as Luka generates content
  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [verifyPhase, verifyRows.length, lukaIsTyping]);

  // Close filter dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setFilterDropdownOpen(false);
      }
      if (wsFilterDropdownRef.current && !wsFilterDropdownRef.current.contains(e.target as Node)) {
        setWsFilterDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Checklists
  const [isFirstYear, setIsFirstYear] = useState<boolean | null>(null);
  const [uploadedChecklists, setUploadedChecklists] = useState<string[]>([]);
  const [checklistUploading, setChecklistUploading] = useState(false);

  // Working Papers
  const [wpToggles, setWpToggles] = useState<Record<string, boolean>>(DEFAULT_WP_TOGGLES);

  // FS Mapping
  const [fsUploaded, setFsUploaded] = useState<string[]>([]);
  const [fsExtractFromLastYear, setFsExtractFromLastYear] = useState(true);
  const [fsSettingsDirty, setFsSettingsDirty] = useState(false);
  const [fsFontSize, setFsFontSize] = useState("12pt (Normal Default)");
  const [fsFontStyle, setFsFontStyle] = useState("Arial");
  const [fsCurrency, setFsCurrency] = useState("First Row Only");
  const [fsRounding, setFsRounding] = useState("Account 123");
  const [fsHeader, setFsHeader] = useState("First Page Only");
  const [fsFooter, setFsFooter] = useState("First Page Only");
  const [fsSaved, setFsSaved] = useState(false);
  const [fsFormOpen, setFsFormOpen] = useState(true);

  // Automation
  const [automationProgress, setAutomationProgress] = useState(0);
  const [automationElapsed, setAutomationElapsed] = useState(0);
  const [automationLog, setAutomationLog] = useState<{ text: string; done: boolean }[]>([]);
  const automationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Add New Workspace modal
  const [newWsModalOpen, setNewWsModalOpen] = useState(false);
  const [newWsSearch, setNewWsSearch] = useState("");
  const [newWsSelected, setNewWsSelected] = useState<string[]>([]);
  const [newWsSortAsc, setNewWsSortAsc] = useState(true);

  const WS_CLIENTS = [
    { id: "c1", name: "Test Company Inc.",     ref: "COM-TES-Dec312026", source: "quickbooks" },
    { id: "c2", name: "XYZ Solutions",         ref: "COM-XYZ-Dec312026", source: "xero"       },
    { id: "c3", name: "ABC Company Inc.",      ref: "COM-ABC-Dec312026", source: "xero"       },
    { id: "c4", name: "Beta Industries",       ref: "COM-BET-Dec312026", source: "quickbooks" },
    { id: "c5", name: "Simpsons & Co.",        ref: "COM-SIM-Dec312026", source: "quickbooks" },
    { id: "c6", name: "Alpha Enterprises",     ref: "COM-ALP-Dec312026", source: "xero"       },
  ];

  // Compilation workspaces for sidebar
  const COMP_WORKSPACES = [
    { id: "w1", name: "Test Company Inc.",     ref: "COM-TES-Dec312026", active: true,  pinned: true  },
    { id: "w2", name: "XYZ Solutions",         ref: "COM-XYZ-Dec312026", active: true,  pinned: true  },
    { id: "w3", name: "ABC Company Inc.",      ref: "COM-ABC-Dec312026", active: true,  pinned: false },
    { id: "w4", name: "Beta Industries",       ref: "COM-BET-Dec312026", active: true,  pinned: false },
    { id: "w5", name: "Simpsons & Co.",        ref: "COM-SIM-Dec312026", active: false, pinned: false },
    { id: "w6", name: "Alpha Enterprises",     ref: "COM-ALP-Dec312026", active: false, pinned: false },
  ];
  const [pinnedWs, setPinnedWs] = useState<string[]>(["w1", "w2"]);
  const togglePinWs = (id: string) => setPinnedWs(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  // Cleanup
  useEffect(() => {
    return () => {
      verifyTimeoutsRef.current.forEach(clearTimeout);
      if (automationIntervalRef.current) clearInterval(automationIntervalRef.current);
    };
  }, []);

  // ── Autopilot functions ──
  const markCompleted = useCallback((step: string) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  }, []);

  const initializeAutopilot = useCallback((loan: Loan) => {
    verifyTimeoutsRef.current.forEach(clearTimeout);
    verifyTimeoutsRef.current = [];
    if (automationIntervalRef.current) { clearInterval(automationIntervalRef.current); automationIntervalRef.current = null; }
    setAutopilotLoanId(loan.id);
    setAutopilotStep("init");
    setActiveWizardTab("verification");
    setCompletedSteps(new Set());
    setVerifyPhase("idle");
    setVerifyRows([]);
    setIsFirstYear(null);
    setUploadedChecklists([]);
    setWpToggles(DEFAULT_WP_TOGGLES);
    setFsUploaded([]);
    setFsSettingsDirty(false);
    setFsSaved(false);
    setAutomationProgress(0);
    setAutomationElapsed(0);
    setAutomationLog([]);
  }, []);

  const startVerification = useCallback((loan: Loan) => {
    setAutopilotStep("verification");
    setActiveWizardTab("verification");

    const rows: VerifyRow[] = [
      { label: "Entity name", value: settings.client || loan.name, showCheck: false },
      { label: "Engagement ID", value: loan.refNumber, showCheck: false },
      { label: "Year-end-date", value: settings.fiscalYearEnd, showCheck: false },
      { label: "Source connection", value: "Loaded successfully", showCheck: false },
      { label: "Trial Balance", value: "Loaded successfully", showCheck: false },
      { label: "Team members", value: `${settings.client || "Partner"}, Reviewer, Preparer`, showCheck: false },
      { label: "Components", value: "Header/Footer identified", showCheck: false },
      { label: "Signature", value: "Default signature identified", showCheck: false },
      { label: "Templates", value: "Engagement Letter identified", showCheck: false },
      { label: "Client Communications", value: "Client portal available", showCheck: false },
    ];

    const t0  = setTimeout(() => setLukaIsTyping(true), 0);
    const t1  = setTimeout(() => { setLukaIsTyping(false); setVerifyPhase("intro"); }, 1000);
    const t1b = setTimeout(() => setLukaIsTyping(true), 1400);
    const t2  = setTimeout(() => { setLukaIsTyping(false); setVerifyPhase("msg2"); }, 2300);
    const t2b = setTimeout(() => setLukaIsTyping(true), 2700);
    const t3 = setTimeout(() => {
      setLukaIsTyping(false);
      setVerifyPhase("reviewing");
      setVerifyRows(rows);
      rows.forEach((_, i) => {
        const t = setTimeout(() => {
          setVerifyRows(prev => prev.map((r, idx) => idx <= i ? { ...r, showCheck: true } : r));
          if (i === rows.length - 1) {
            const tdone = setTimeout(() => {
              setVerifyPhase("done");
              markCompleted("verification");
            }, 500);
            verifyTimeoutsRef.current.push(tdone);
          }
        }, i * 700);
        verifyTimeoutsRef.current.push(t);
      });
    }, 3100);
    verifyTimeoutsRef.current.push(t0, t1, t1b, t2, t2b, t3);
  }, [settings, markCompleted]);

  const startMagic = useCallback(() => {
    setAutopilotStep("automating");
    let step = 0;
    let elapsed = 0;
    automationIntervalRef.current = setInterval(() => {
      elapsed += 1;
      setAutomationElapsed(elapsed);
      if (step < AUTOMATION_MILESTONES.length) {
        const progress = AUTOMATION_MILESTONES[step];
        setAutomationProgress(progress);
        setAutomationLog(
          AUTOMATION_LOG_LINES.slice(0, step + 1).map((text, i) => ({
            text,
            done: i < step,
          }))
        );
        step++;
      }
      if (step >= AUTOMATION_MILESTONES.length) {
        clearInterval(automationIntervalRef.current!);
        automationIntervalRef.current = null;
        setTimeout(() => setAutopilotStep("observation"), 800);
      }
    }, 1500);
  }, []);

  const cancelAutopilot = useCallback(() => {
    verifyTimeoutsRef.current.forEach(clearTimeout);
    verifyTimeoutsRef.current = [];
    if (automationIntervalRef.current) { clearInterval(automationIntervalRef.current); automationIntervalRef.current = null; }
    setAutopilotLoanId(null);
    setSelectedCompWs(null);
    setAutopilotStep(null);
    setActiveWizardTab("verification");
    setCompletedSteps(new Set());
    setVerifyPhase("idle");
    setVerifyRows([]);
    setIsFirstYear(null);
    setUploadedChecklists([]);
    setChecklistUploading(false);
    setWpToggles(DEFAULT_WP_TOGGLES);
    setFsUploaded([]);
    setFsSettingsDirty(false);
    setFsSaved(false);
    setAutomationProgress(0);
    setAutomationElapsed(0);
    setAutomationLog([]);
  }, []);

  // Select a compilation workspace from the sidebar — goes straight to verification
  const selectCompWorkspace = useCallback((ws: { id: string; name: string; ref: string; active: boolean; pinned: boolean }) => {
    verifyTimeoutsRef.current.forEach(clearTimeout);
    verifyTimeoutsRef.current = [];
    if (automationIntervalRef.current) { clearInterval(automationIntervalRef.current); automationIntervalRef.current = null; }
    setSelectedCompWs(ws);
    setAutopilotStep("verification");
    setActiveWizardTab("verification");
    setCompletedSteps(new Set());
    setVerifyPhase("idle");
    setVerifyRows([]);
    setIsFirstYear(null);
    setUploadedChecklists([]);
    setWpToggles(DEFAULT_WP_TOGGLES);
    setFsUploaded([]);
    setFsSettingsDirty(false);
    setFsSaved(false);
    setAutomationProgress(0);
    setAutomationElapsed(0);
    setAutomationLog([]);

    // Build verification rows from workspace data
    const rows: VerifyRow[] = [
      { label: "Entity name",           value: ws.name,                              showCheck: false },
      { label: "Engagement ID",         value: ws.ref,                               showCheck: false },
      { label: "Year-end-date",         value: "December 31, 2026",                  showCheck: false },
      { label: "Source connection",     value: "Loaded successfully",                showCheck: false },
      { label: "Trial Balance",         value: "Pulling data... You can proceed with the next steps", showCheck: false },
      { label: "Team members",          value: "Jim Lekar (Partner), Phoenix Marie (Reviewer), Dolf Ziggler (Preparer)", showCheck: false },
      { label: "Components",            value: "Header/Footer identified",           showCheck: false },
      { label: "Signature",             value: "Default signature identified",       showCheck: false },
      { label: "Templates",             value: "Engagement Letter identified\nManagement Responsibility Letter identified", showCheck: false },
      { label: "Client Communications", value: "Client portal/Mobile App. access available", showCheck: false },
    ];

    const t1 = setTimeout(() => setVerifyPhase("intro"), 0);
    const t2 = setTimeout(() => setVerifyPhase("msg2"), 1200);
    const t3 = setTimeout(() => {
      setVerifyPhase("reviewing");
      setVerifyRows(rows);
      rows.forEach((_, i) => {
        const t = setTimeout(() => {
          setVerifyRows(prev => prev.map((r, idx) => idx <= i ? { ...r, showCheck: true } : r));
          if (i === rows.length - 1) {
            const tdone = setTimeout(() => {
              setVerifyPhase("done");
              setCompletedSteps(prev => new Set([...prev, "verification"]));
            }, 500);
            verifyTimeoutsRef.current.push(tdone);
          }
        }, i * 600);
        verifyTimeoutsRef.current.push(t);
      });
    }, 2400);
    verifyTimeoutsRef.current.push(t1, t2, t3);
  }, []);

  const simulateChecklistUpload = useCallback(() => {
    setChecklistUploading(true);
    setTimeout(() => {
      setUploadedChecklists(["Client Acceptance.pdf", "Independence.pdf", "Knowledge of client business.pdf", "Planning.pdf"]);
      setChecklistUploading(false);
      markCompleted("checklists");
    }, 1200);
  }, [markCompleted]);

  const simulateFsUpload = useCallback(() => {
    setFsUploaded(["FS_2025.pdf", "Trial Balance_2025.pdf"]);
  }, []);

  // ── Threads chat handlers ──
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessage(val);
    const hashIdx = val.lastIndexOf("#");
    if (hashIdx !== -1) { setShowPromptPicker(true); setHashFilter(val.slice(hashIdx + 1)); }
    else { setShowPromptPicker(false); setHashFilter(""); }
  }, []);

  const handlePromptSelect = useCallback((promptLabel: string) => {
    setShowPromptPicker(false); setHashFilter(""); setMessage("");
    setSentMessage(promptLabel); setIsThinking(true);
    setAiResponse(null); setDisplayedResponse(""); setIsStreaming(false);
    setRichResponseType(null); setRevealStep(-1);
    if (streamRef.current) clearTimeout(streamRef.current);
    if (revealRef.current) clearTimeout(revealRef.current);
    const isGrossMargin = promptLabel.toLowerCase().includes("gross profit margin");
    setTimeout(() => {
      setIsThinking(false);
      if (isGrossMargin) {
        setRichResponseType("gross-margin"); setAiResponse("__rich__");
        let s = 0;
        const reveal = () => { setRevealStep(s); s++; if (s <= 5) revealRef.current = window.setTimeout(reveal, 600); };
        reveal();
      } else {
        const full = `Here's an overview of **${promptLabel}** with key insights and analysis.\n\nThis covers the essential metrics, trends, and recommendations based on your current financial data.`;
        setAiResponse(full); setIsStreaming(true);
        let idx = 0;
        const stream = () => {
          if (idx < full.length) { const c = Math.floor(Math.random() * 3) + 1; idx = Math.min(idx + c, full.length); setDisplayedResponse(full.slice(0, idx)); streamRef.current = window.setTimeout(stream, 15 + Math.random() * 25); }
          else setIsStreaming(false);
        };
        stream();
      }
    }, 2500);
  }, []);

  const handleSend = useCallback(() => {
    if (!message.trim()) return;
    const msg = message.trim(); setMessage(""); setShowPromptPicker(false);
    setSentMessage(msg); setIsThinking(true); setAiResponse(null);
    setDisplayedResponse(""); setIsStreaming(false);
    if (streamRef.current) clearTimeout(streamRef.current);
    const full = `Here's my response to "${msg}". This analysis covers the key aspects and provides actionable insights based on the available data.`;
    setTimeout(() => {
      setIsThinking(false); setAiResponse(full); setIsStreaming(true);
      let idx = 0;
      const stream = () => {
        if (idx < full.length) { const c = Math.floor(Math.random() * 3) + 1; idx = Math.min(idx + c, full.length); setDisplayedResponse(full.slice(0, idx)); streamRef.current = window.setTimeout(stream, 15 + Math.random() * 25); }
        else setIsStreaming(false);
      };
      stream();
    }, 2500);
  }, [message]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !showPromptPicker && message.trim()) { e.preventDefault(); handleSend(); }
  }, [showPromptPicker, message, handleSend]);

  if (!open) return null;

  const allThreads = [...pinnedThreads, ...recentThreads];
  const activeLoans = loans.filter(l => l.status === "Active");
  const activeLoan = loans.find(l => l.id === autopilotLoanId) ?? null;
  const isAutomating = autopilotStep === "automating";
  const isWizardStep = autopilotStep && ["verification","checklists","letters","workingpapers","fsmapping","magic"].includes(autopilotStep);
  const formatElapsed = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ── Wizard tab bar ──
  const renderTabBar = () => (
    <div className="flex items-center gap-0 px-4 pt-3 pb-0 border-b border-border shrink-0 overflow-x-auto">
      {WIZARD_TABS.map(tab => {
        const isDone = completedSteps.has(tab.id);
        const isActive = activeWizardTab === tab.id;
        const isLocked = tab.id === "magic"
          ? !["verification","checklists","letters","workingpapers","fsmapping"].every(s => completedSteps.has(s))
          : false;
        return (
          <button
            key={tab.id}
            onClick={() => {
              if (isLocked) return;
              setActiveWizardTab(tab.id);
              sectionRefs.current[tab.id]?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0",
              isActive
                ? "border-primary text-foreground bg-primary/5"
                : isDone
                  ? "border-transparent text-foreground hover:text-foreground hover:border-border"
                  : isLocked
                    ? "border-transparent text-foreground cursor-not-allowed"
                    : "border-transparent text-foreground hover:text-foreground hover:border-border"
            )}
          >
            {isDone && !isActive && <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />}
            {tab.id === "magic" && <Sparkles className="w-3 h-3 shrink-0" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  // ── Verification step ──
  const renderVerification = () => (
    <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">

        {/* ── Task header chip ── */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-primary/8 border border-primary/15 text-[11px] font-medium text-primary/80">
            <div className="w-4 h-4 rounded-[4px] bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center">
              <LukaIcon size={8} />
            </div>
            Verifying workspace — <span className="font-semibold text-primary">{selectedCompWs?.name}</span>
            <span className="text-primary/40">·</span>
            <span className="text-primary/60 font-normal">{selectedCompWs?.ref}</span>
          </div>
        </div>

        {/* ── Luka message 1 ── */}
        {(verifyPhase === "intro" || verifyPhase === "msg2" || verifyPhase === "reviewing" || verifyPhase === "done") && (
          <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0 shadow-sm shadow-primary/25">
              <LukaIcon size={14} />
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-foreground">Luka</span>
                <span className="text-[10px] text-foreground">Engagement AI</span>
              </div>
              <div className="bg-background rounded-[8px] border border-border/60 px-4 py-3 shadow-sm text-sm text-foreground leading-relaxed">
                Hi! I am <span className="text-primary font-semibold">Luka</span> — your year-end-engagement automation preparer.
              </div>
            </div>
          </div>
        )}

        {/* ── Luka message 2 ── */}
        {(verifyPhase === "msg2" || verifyPhase === "reviewing" || verifyPhase === "done") && (
          <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0 shadow-sm shadow-primary/25">
              <LukaIcon size={14} />
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-foreground">Luka</span>
                <span className="text-[10px] text-foreground">Engagement AI</span>
              </div>
              <div className="bg-background rounded-[8px] border border-border/60 px-4 py-3 shadow-sm text-sm text-foreground leading-relaxed">
                I'll gather the info needed for this engagement while you relax. I'll review the details and sources, then update you on the verification results shortly.
              </div>
            </div>
          </div>
        )}

        {/* ── Tool-use card (Reviewing...) ── */}
        {(verifyPhase === "reviewing" || verifyPhase === "done") && verifyRows.length > 0 && (
          <div className="flex items-start gap-3 animate-in fade-in duration-300">
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0 shadow-sm shadow-primary/25">
              <LukaIcon size={14} />
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-foreground">Luka</span>
                <span className="text-[10px] text-foreground">Engagement AI</span>
                {verifyPhase === "reviewing" && (
                  <span className="flex items-center gap-1 text-[10px] text-primary/70 animate-pulse">
                    <span className="w-1 h-1 rounded-full bg-primary inline-block" />
                    working…
                  </span>
                )}
              </div>
              {/* Tool output card */}
              <div className="rounded-[8px] border border-border overflow-hidden shadow-sm">
                {/* Card header */}
                <div className={cn(
                  "flex items-center gap-2.5 px-4 py-2.5 border-b border-border",
                  verifyPhase === "done"
                    ? "bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30"
                    : "bg-muted/50"
                )}>
                  {verifyPhase === "done" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                  )}
                  <span className={cn("text-xs font-semibold", verifyPhase === "done" ? "text-green-700 dark:text-green-400" : "text-foreground")}>
                    {verifyPhase === "done" ? "Verification complete" : "Reviewing engagement…"}
                  </span>
                  {verifyPhase === "done" && (
                    <span className="ml-auto text-[10px] text-green-600/70 font-medium">{verifyRows.length} checks passed</span>
                  )}
                </div>
                {/* Rows */}
                <div className="bg-background divide-y divide-border/40">
                  {verifyRows.map((row, i) => (
                    <div key={i} className={cn("flex items-start px-4 py-2.5 gap-3 transition-all duration-200", row.showCheck ? "opacity-100" : "opacity-40")}>
                      <div className="shrink-0 mt-0.5">
                        {row.showCheck
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          : <div className="w-3.5 h-3.5 rounded-full border-2 border-border/60" />
                        }
                      </div>
                      <span className="text-[11px] text-foreground w-36 shrink-0 leading-relaxed">{row.label}</span>
                      {row.showCheck && (
                        <span className="text-[11px] text-foreground flex-1 leading-relaxed whitespace-pre-line">{row.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Post-verification message */}
              {verifyPhase === "done" && (
                <div className="mt-3 bg-background rounded-[8px] border border-border/60 px-4 py-3 shadow-sm text-sm text-foreground leading-relaxed animate-in fade-in duration-300">
                  All checks passed ✓ — your workspace is ready. You can now continue with the next steps in the tabs above, or upload the required files to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Required files card (as agent follow-up) ── */}
        {verifyPhase === "done" && (
          <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 duration-400">
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-sm shadow-amber-400/25">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-foreground">Required Files</span>
                <span className="text-[10px] text-foreground">Must upload before automation</span>
              </div>
              <div className="bg-background rounded-[8px] border border-amber-200 dark:border-amber-800/40 overflow-hidden shadow-sm">
                <div className="bg-amber-50 dark:bg-amber-950/20 px-4 py-2.5 border-b border-amber-100 dark:border-amber-900/30">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Must have files for seamless automation</p>
                </div>
                <div className="divide-y divide-amber-100/60 dark:divide-amber-900/20">
                  {[
                    { n: 1, label: "Last year finalized FS", sub: "With Notes" },
                    { n: 2, label: "Mapped TB", sub: "Same FS" },
                    { n: 3, label: "Corporate Tax Returns", sub: "Filed T2" },
                  ].map(item => (
                    <div key={item.n} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="w-5 h-5 rounded-[4px] bg-amber-500 flex items-center justify-center shrink-0 text-white text-[10px] font-bold">{item.n}</div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-foreground">{item.label}</p>
                        <p className="text-[10px] text-foreground">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 bg-amber-50/50 dark:bg-amber-950/10 border-t border-amber-100 dark:border-amber-900/20">
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">*Note: Only PDF file type allowed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Typing indicator ── */}
        {lukaIsTyping && (
          <div className="flex items-start gap-3 animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0 shadow-sm shadow-primary/25">
              <LukaIcon size={14} />
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-foreground">Luka</span>
                <span className="text-[10px] text-foreground">Engagement AI</span>
              </div>
              <div className="bg-background rounded-[8px] border border-border/60 px-4 py-3 shadow-sm inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* ── Rerun ── */}
        {verifyPhase === "done" && (
          <div className="flex justify-end pb-2">
            <button
              onClick={() => { if (selectedCompWs) selectCompWorkspace(selectedCompWs); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-border bg-background text-xs text-foreground hover:bg-muted/50 hover:border-primary/30 transition-all shadow-sm"
            >
              <RotateCcw className="w-3 h-3" /> Rerun verification
            </button>
          </div>
        )}

    </div>
  );

  // ── shared helper: agent message wrapper ──
  const AgentMsg = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
      <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0 shadow-sm shadow-primary/25">
        <LukaIcon size={14} />
      </div>
      <div className="flex-1 pt-0.5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold text-foreground">Luka</span>
          <span className="text-[10px] text-foreground">Engagement AI</span>
        </div>
        <div className="bg-background rounded-[8px] border border-border/60 px-4 py-3 shadow-sm text-sm text-foreground leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );

  // ── shared helper: tab header chip ──
  const TabChip = ({ label, icon: Icon }: { label: string; icon: React.ElementType }) => (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-primary/8 border border-primary/15 text-[11px] font-medium text-primary/80">
        <Icon className="w-3.5 h-3.5 text-primary" />
        {label}
      </div>
    </div>
  );

  // ── shared helper: file chip ──
  const FileChip = ({ name, onRemove }: { name: string; onRemove: () => void }) => (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-border bg-background shadow-sm text-xs text-foreground">
      <FileText className="w-3 h-3 text-primary/60" />
      {name}
      <button onClick={onRemove} className="ml-1 w-3.5 h-3.5 rounded-full hover:bg-muted/60 flex items-center justify-center text-foreground hover:text-foreground transition-colors">×</button>
    </div>
  );

  // ── shared helper: upload area ──
  const UploadArea = ({ uploaded, uploading, onUpload }: { uploaded: boolean; uploading?: boolean; onUpload: () => void }) => (
    <div
      onClick={!uploaded && !uploading ? onUpload : undefined}
      className={cn(
        "border-2 border-dashed rounded-[8px] p-7 text-center transition-all",
        !uploaded && !uploading ? "border-primary/30 bg-primary/[0.02] hover:bg-primary/[0.04] hover:border-primary/50 cursor-pointer" : "border-border/50 bg-muted/10"
      )}
    >
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-foreground">Uploading…</p>
        </div>
      ) : uploaded ? (
        <div className="flex flex-col items-center gap-2">
          <CheckCircle2 className="w-7 h-7 text-green-500" />
          <p className="text-sm text-green-600 font-medium">Uploaded successfully</p>
        </div>
      ) : (
        <>
          <div className="w-9 h-9 rounded-[8px] bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-4.5 h-4.5 text-primary" />
          </div>
          <p className="text-sm text-foreground"><span className="text-primary font-medium">Click to upload</span> or drag and drop</p>
          <p className="text-xs text-foreground mt-1">PDF files only</p>
        </>
      )}
    </div>
  );

  // ── Checklists step ──
  const renderChecklists = () => (
    <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">

        <TabChip label="Checklists" icon={CheckCircle2} />

        <AgentMsg>
          The next steps are now unlocked. Switch between the tabs above in any order. For Checklists — select the client operations details:
        </AgentMsg>

        {/* Question card */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0 shadow-sm shadow-primary/25 opacity-0 pointer-events-none" />
          <div className="flex-1">
            <div className="bg-background rounded-[8px] border border-border/60 px-4 py-4 shadow-sm space-y-3">
              <p className="text-sm font-medium text-foreground">Is this a first-year of operations for this client?</p>
              <div className="flex gap-2">
                {["Yes", "No"].map(opt => (
                  <button
                    key={opt}
                    onClick={() => {
                      setIsFirstYear(opt === "Yes");
                      if (opt === "No") simulateChecklistUpload();
                    }}
                    className={cn(
                      "px-5 py-1.5 rounded-[8px] border text-sm font-medium transition-all",
                      isFirstYear === (opt === "Yes")
                        ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                        : "border-border text-foreground hover:bg-muted/50 hover:border-primary/40"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isFirstYear === false && (
          <>
            <AgentMsg>
              Upload last year checklists to mirror responses to the current year. Checklists required for compilations are highlighted below:
            </AgentMsg>

            {/* Upload + checklist card side by side */}
            <div className="flex items-start gap-3">
              <div className="w-8 shrink-0" />
              <div className="flex-1 grid grid-cols-5 gap-4">
                {/* Upload area */}
                <div className="col-span-3">
                  <UploadArea
                    uploaded={uploadedChecklists.length > 0}
                    uploading={checklistUploading}
                    onUpload={simulateChecklistUpload}
                  />
                  {uploadedChecklists.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {uploadedChecklists.map(f => (
                        <FileChip key={f} name={f} onRemove={() => setUploadedChecklists(p => p.filter(x => x !== f))} />
                      ))}
                    </div>
                  )}
                </div>
                {/* Checklist panel */}
                <div className="col-span-2">
                  <div className="rounded-[8px] border border-border bg-background shadow-sm overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-border bg-muted/30">
                      <p className="text-[11px] font-semibold text-foreground">Last year checklists</p>
                    </div>
                    <div className="divide-y divide-border/40">
                      {["Client acceptance & continuance", "Independence", "Knowledge of client business", "Planning"].map(item => (
                        <div key={item} className="flex items-center justify-between px-3 py-2">
                          <span className="text-[11px] text-foreground">{item}</span>
                          {uploadedChecklists.length > 0
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            : <div className="w-3.5 h-3.5 rounded-full border-2 border-border/50 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {isFirstYear === true && (
          <AgentMsg>
            No checklists required for a first-year engagement — proceeding with fresh templates.
          </AgentMsg>
        )}
    </div>
  );

  // ── Letters step ──
  const renderLetters = () => (
    <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">

        <TabChip label="Letters" icon={FileText} />

        <AgentMsg>
          I've loaded the default <strong className="font-semibold text-foreground">Engagement Letter</strong> and <strong className="font-semibold text-foreground">Management Responsibility Letter</strong> as per your engagement template. Feel free to review and adjust them. For more options click '+ Letter'.
        </AgentMsg>

        {/* Letter templates card */}
        <div className="flex items-start gap-3">
          <div className="w-8 shrink-0" />
          <div className="flex-1 rounded-[8px] border border-border bg-background shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
              <span className="text-xs font-semibold text-foreground flex-1">Letter Templates</span>
              <span className="text-[10px] text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full font-medium">*Required</span>
            </div>
            <div className="divide-y divide-border/40 px-4">
              {[
                { label: "Engagement Letter Template*", value: "Engagement Letter CSRS 4200" },
                { label: "Management Responsibility Letter Template*", value: "Management Responsibility L..." },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="w-7 h-7 rounded-[6px] bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-primary/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-foreground mb-1">{row.label}</p>
                    <div className="flex items-center gap-2 border border-border rounded-[8px] px-3 py-1.5 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
                      <span className="text-xs text-foreground flex-1 truncate">{row.value}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-foreground shrink-0" />
                    </div>
                  </div>
                  <button
                    onClick={() => markCompleted("letters")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-border bg-background text-xs text-foreground hover:bg-muted/50 hover:border-primary/40 transition-all shrink-0 shadow-sm"
                  >
                    <Eye className="w-3 h-3" /> Review
                  </button>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-border bg-muted/10">
              <button className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium">
                <Plus className="w-3.5 h-3.5" /> Add Letter
              </button>
            </div>
          </div>
        </div>

    </div>
  );

  // ── Working Papers step ──
  const renderWorkingPapers = () => (
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">

        <TabChip label="Working Papers" icon={FileText} />

        <AgentMsg>
          Here are the working paper threads ready for automation. I've pre-selected the suggested papers for this engagement based on your trial balance accounts and materiality.
        </AgentMsg>

        {/* WP list card */}
        <div className="flex items-start gap-3">
          <div className="w-8 shrink-0" />
          <div className="flex-1 rounded-[8px] border border-border bg-background shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-muted/30">
              <div className="w-5 h-5 rounded-[4px] bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0">
                <LukaIcon size={9} />
              </div>
              <span className="text-xs font-semibold text-foreground flex-1">Luka suggested working paper threads</span>
              <span className="text-[10px] text-foreground">{Object.values(wpToggles).filter(Boolean).length} selected</span>
            </div>
            <div className="divide-y divide-border/40">
              {WP_THREADS.map(wp => (
                <div key={wp.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="w-7 h-7 rounded-[6px] bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-3.5 h-3.5 text-primary/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {wp.label}
                      {wp.required && <span className="text-destructive ml-0.5 font-normal">*</span>}
                    </p>
                    <p className="text-[11px] text-foreground mt-0.5 leading-relaxed">{wp.desc}</p>
                  </div>
                  <button
                    onClick={() => { setWpToggles(prev => ({ ...prev, [wp.id]: !prev[wp.id] })); markCompleted("workingpapers"); }}
                    className={cn("relative w-9 h-5 rounded-full transition-colors shrink-0 mt-1", wpToggles[wp.id] ? "bg-primary" : "bg-muted")}
                  >
                    <span className={cn("absolute left-0 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", wpToggles[wp.id] ? "translate-x-4" : "translate-x-0.5")} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

    </div>
  );

  // ── FS & Mapping step ──
  const renderFSMapping = () => (
    <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">

        <TabChip label="FS & Account Mapping" icon={FileText} />

        <AgentMsg>
          To ensure a consistent experience, share the details below for the same year to recreate the mapping and FS settings tailored to your client.
        </AgentMsg>

        <div className="flex items-start gap-3">
          <div className="w-8 shrink-0" />
          <div className="flex-1 space-y-4">
            {/* Upload area */}
            <UploadArea uploaded={fsUploaded.length > 0} onUpload={simulateFsUpload} />
            {fsUploaded.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {fsUploaded.map(f => (
                  <FileChip key={f} name={f} onRemove={() => setFsUploaded(p => p.filter(x => x !== f))} />
                ))}
              </div>
            )}

            {/* FS Settings card */}
            <div className="rounded-[8px] border border-border bg-background shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
                <span className="text-xs font-semibold text-foreground flex-1">Financial Statement Settings</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-foreground">Last Year Files</span>
                  <button
                    onClick={() => setFsExtractFromLastYear(!fsExtractFromLastYear)}
                    className={cn("relative w-9 h-5 rounded-full transition-colors", fsExtractFromLastYear ? "bg-primary" : "bg-muted")}
                  >
                    <span className={cn("absolute left-0 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", fsExtractFromLastYear ? "translate-x-4" : "translate-x-0.5")} />
                  </button>
                  <span className="text-[10px] text-foreground">Global Default</span>
                </div>
              </div>

              <div className="px-4 py-3">
                <button
                  onClick={() => setFsFormOpen(!fsFormOpen)}
                  className="flex items-center gap-2 w-full text-xs font-medium text-foreground hover:text-primary transition-colors mb-3"
                >
                  <FileText className="w-3.5 h-3.5 text-foreground" />
                  Formatting &amp; Data
                  <span className="ml-auto text-foreground text-base leading-none">{fsFormOpen ? "−" : "+"}</span>
                </button>

                {fsFormOpen && (
                  <div className="grid grid-cols-3 gap-3 animate-in fade-in duration-200">
                    {[
                      { label: "Font Size", val: fsFontSize, set: setFsFontSize, opts: ["10pt", "11pt", "12pt (Normal Default)", "14pt"] },
                      { label: "Font Style", val: fsFontStyle, set: setFsFontStyle, opts: ["Arial", "Times New Roman", "Calibri", "Helvetica"] },
                      { label: "Currency Symbol Placement", val: fsCurrency, set: setFsCurrency, opts: ["First Row Only", "All Rows", "None"] },
                      { label: "Rounding Account", val: fsRounding, set: setFsRounding, opts: ["Account 123", "Account 456", "Account 789"] },
                      { label: "Header Placement", val: fsHeader, set: setFsHeader, opts: ["First Page Only", "All Pages", "No Header"] },
                      { label: "Footer Placement", val: fsFooter, set: setFsFooter, opts: ["First Page Only", "All Pages", "No Footer"] },
                    ].map(field => (
                      <div key={field.label}>
                        <p className="text-[10px] text-foreground mb-1">{field.label}</p>
                        <div className="relative">
                          <select
                            value={field.val}
                            onChange={e => { field.set(e.target.value); setFsSettingsDirty(true); }}
                            className="w-full text-xs border border-border rounded-[8px] px-3 py-2 bg-background appearance-none pr-7 focus:outline-none focus:border-primary hover:border-primary/40 transition-colors"
                          >
                            {field.opts.map(o => <option key={o}>{o}</option>)}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground pointer-events-none" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end mt-4">
                  <button
                    disabled={!fsSettingsDirty && !fsSaved}
                    onClick={() => { setFsSaved(true); setFsSettingsDirty(false); markCompleted("fsmapping"); }}
                    className={cn(
                      "px-4 py-1.5 rounded-[8px] text-xs font-medium transition-all",
                      fsSettingsDirty
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
                        : fsSaved
                          ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
                          : "bg-muted text-foreground cursor-not-allowed"
                    )}
                  >
                    {fsSaved ? "Saved ✓" : "Save Settings"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

    </div>
  );

  // ── Magic step ──
  const renderMagic = () => {
    const allDone = ["verification","checklists","letters","workingpapers","fsmapping"].every(s => completedSteps.has(s));
    return (
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">

          <TabChip label="Magic — Ready to Automate" icon={Sparkles} />

          <AgentMsg>
            All engagement documents gathered successfully. Review the automation summary below, then click <strong className="font-semibold text-foreground">Start Magic</strong> when you're ready.
          </AgentMsg>

          {/* Summary cards */}
          <div className="flex items-start gap-3">
            <div className="w-8 shrink-0" />
            <div className="flex-1 space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[8px] border border-border bg-background px-4 py-3.5 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 text-foreground" />
                    <span className="text-xl font-bold text-foreground">12 mins</span>
                  </div>
                  <p className="text-xs font-medium text-foreground">Completion time</p>
                  <p className="text-[10px] text-foreground mt-0.5">After file analysis</p>
                </div>
                <div className="rounded-[8px] border border-border bg-background px-4 py-3.5 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded-[4px] bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0">
                      <LukaIcon size={8} />
                    </div>
                    <span className="text-xl font-bold text-foreground">4.5 hrs</span>
                  </div>
                  <p className="text-xs font-medium text-foreground">Time saved</p>
                  <p className="text-[10px] text-foreground mt-0.5">This engagement</p>
                </div>
              </div>

              {/* Credits */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-[8px] border border-primary/15 bg-primary/[0.03] shadow-sm">
                <div className="w-8 h-8 rounded-[8px] bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">1.5 credits estimated</p>
                  <p className="text-[10px] text-foreground">Based on uploaded files and Trial Balance data</p>
                </div>
              </div>

              {/* Steps status */}
              {!allDone && (
                <div className="rounded-[8px] border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/30 px-4 py-3">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-2">Complete all steps to unlock automation:</p>
                  <div className="flex flex-wrap gap-2">
                    {["verification","checklists","letters","workingpapers","fsmapping"].map(s => (
                      <span key={s} className={cn(
                        "flex items-center gap-1 text-[10px] px-2 py-1 rounded-[6px] font-medium",
                        completedSteps.has(s)
                          ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      )}>
                        {completedSteps.has(s) ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border-2 border-amber-400" />}
                        {s === "fsmapping" ? "FS Mapping" : s.charAt(0).toUpperCase() + s.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="flex flex-col items-center gap-3 pt-1 pb-2">
                <button
                  onClick={startMagic}
                  className="flex items-center gap-2.5 px-10 py-3.5 rounded-[8px] text-sm font-semibold text-white bg-gradient-to-r from-[#8649F1] to-[#2355A4] hover:opacity-90 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all"
                >
                  <Sparkles className="w-4 h-4" /> Start Magic
                </button>
                <div className="flex items-center gap-1.5 text-xs text-destructive/80">
                  <Lock className="w-3 h-3" />
                  File will be <span className="font-semibold">locked during automation</span> — team access paused
                </div>
              </div>

            </div>
          </div>
    </div>
    );
  };

  // ── Automation in progress ──
  const renderAutomating = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Progress header */}
      <div className="px-6 pt-4 pb-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-foreground tracking-wider uppercase">Automation Progress</span>
          <span className="text-xs font-mono text-foreground bg-muted px-2.5 py-1 rounded-md">{formatElapsed(automationElapsed)}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8649F1] to-[#2355A4] rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${automationProgress}%` }}
            />
          </div>
          <span className="text-sm font-bold text-foreground w-10 text-right">{automationProgress}%</span>
        </div>
      </div>

      {/* Centered content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
        {/* Large pulsing orb */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-[hsl(265_80%_55%)/20] blur-2xl scale-150 animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#8649F1] to-[#2355A4] flex items-center justify-center shadow-2xl shadow-primary/40 luka-thinking-spin">
            <LukaIcon size={36} />
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">Luka is working</h3>
        </div>

        {/* Log lines */}
        <div className="w-full max-w-xs space-y-2 text-center">
          {automationLog.map((line, i) => {
            const isActive = i === automationLog.length - 1;
            return (
              <div key={i} className={cn("flex items-center justify-center gap-2 text-sm animate-in fade-in duration-300", isActive ? "text-foreground" : "text-foreground")}>
                {isActive ? (
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500/50 shrink-0" />
                )}
                <span>{line.text}</span>
              </div>
            );
          })}
        </div>

        {/* Stop / Notify */}
        <div className="flex items-center gap-4">
          <button
            onClick={cancelAutopilot}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive/30 text-sm text-destructive hover:bg-destructive/5 transition-colors"
          >
            <Square className="w-3.5 h-3.5" fill="currentColor" /> Stop
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted/50 transition-colors">
            <Mail className="w-3.5 h-3.5" /> Notify Me
          </button>
        </div>
      </div>
    </div>
  );

  // ── Observation mode ──
  const renderObservation = () => (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <LukaMessage>
          I have successfully completed the initial engagement automation for this engagement.
        </LukaMessage>
        <LukaMessage>
          I'm now in <strong>Observation Mode</strong> — monitoring your file and suggesting intelligent next actions.
        </LukaMessage>

        {/* File Maturity card */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-foreground" />
              <span className="text-sm font-bold text-foreground uppercase tracking-wider">File Maturity</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative flex items-center justify-center w-7 h-7 rounded-lg hover:bg-muted transition-colors">
                <Bell className="w-4 h-4 text-foreground" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-white text-[9px] flex items-center justify-center font-bold">5</span>
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
                <Settings className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-5">
            {/* Donut */}
            <div className="relative w-16 h-16 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={DONUT_DATA} cx="50%" cy="50%" innerRadius={22} outerRadius={30} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
                    {DONUT_DATA.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-foreground">72%</span>
              </div>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 flex-1">
              {[
                { v: "26 WPs", c: "text-green-600" },
                { v: "2 docs missing", c: "text-amber-600" },
                { v: "3 variances", c: "text-amber-600" },
                { v: "0/2 signed", c: "text-destructive" },
              ].map(s => (
                <div key={s.v} className={cn("text-xs font-semibold", s.c)}>{s.v}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Action items */}
        <div className="space-y-2">
          {[
            { icon: "bar", msg: "5 new transactions detected since last sync. Refresh TB?", action: "Refresh TB", color: "text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30" },
            { icon: "bank", msg: "Bank balance differs from ledger by $18,420. Investigate?", action: "Investigate", color: "text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30" },
            { icon: "file", msg: "New file uploaded: LoanAgreementFinal.pdf. Attach to debt WP?", action: "Attach", color: "text-primary bg-primary/10 hover:bg-primary/20" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors">
              <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                {item.icon === "bar" ? <Bell className="w-3 h-3 text-foreground" /> : item.icon === "bank" ? <Building2 className="w-3 h-3 text-foreground" /> : <FileText className="w-3 h-3 text-foreground" />}
              </div>
              <p className="text-sm text-foreground flex-1">{item.msg}</p>
              <button className={cn("text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0", item.color)}>
                {item.action}
              </button>
            </div>
          ))}
        </div>

        {/* Suggested Actions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">Suggested Actions</span>
            <span className="text-xs text-foreground">5 active</span>
          </div>
          <div className="space-y-1">
            {["Review covenant compliance threshold breach", "Reconcile accrued interest variance ($1,247)", "Generate FS disclosure note for long-term debt", "Update current portion classification", "Sign off on capital asset schedule"].map(action => (
              <div key={action} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                <p className="text-xs text-foreground flex-1">{action}</p>
                <button className="text-[10px] text-primary opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">→</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat input (restored in observation mode) */}
      <div className={cn("pb-4 pt-2 shrink-0", viewMode === "full" ? "px-10" : "px-5")}>
        <div className="border border-border rounded-[12px] overflow-hidden bg-background dark:bg-card hover:border-primary/30 transition-all duration-200 luka-gradient-border">
          <div className="px-4 pt-2.5 pb-2">
            <input type="text" placeholder="Type # for prompts or just ask anything..." className="w-full bg-transparent h-8 placeholder:text-foreground outline-none border-none text-sm text-foreground" />
          </div>
          <div className="px-3 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-500">✨</span>
              <span className="text-sm font-medium text-foreground">Gemini 3 Flash</span>
            </div>
            <Button size="icon" className="h-8 w-8 rounded-full bg-gradient-to-br from-[#8649F1] to-[#2355A4] hover:opacity-90 text-white shadow-sm">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {viewMode === "half" && (
        <div className="fixed inset-0 z-40" onClick={() => onOpenChange(false)} />
      )}

      <div className={cn(
        "fixed top-0 right-0 bottom-0 z-50 bg-background dark:bg-card overflow-hidden",
        "animate-in slide-in-from-right-5 fade-in zoom-in-[0.97] duration-400 ease-out",
        viewMode === "full"
          ? "left-14 rounded-tl-[1.25rem] rounded-bl-[1.25rem] border-l border-[hsl(210deg_36.19%_7.6%/76%)] shadow-[-10px_0_20px_-4px_rgba(0,0,0,0.90),-3px_0_6px_-3px_rgba(0,0,0,0.90)]"
          : "left-[45%] rounded-tl-[1.25rem] rounded-bl-[1.25rem] border-l border-[hsl(210deg_36.19%_7.6%/76%)] shadow-[-10px_0_20px_-4px_rgba(0,0,0,0.90),-3px_0_6px_-3px_rgba(0,0,0,0.90)]"
      )}>
        <div className="flex h-full min-w-0 w-full">

          {/* ═══ LEFT SIDEBAR — Claude Code style ═══ */}
          <aside
            className={cn(
              "relative flex flex-col transition-all duration-300 ease-in-out shrink-0",
              "bg-[hsl(212.43deg_86.02%_10.76%)]",
              sidebarExpanded ? "w-[260px]" : "w-[52px]"
            )}
            onMouseEnter={() => setSidebarHovered(true)}
            onMouseLeave={() => setSidebarHovered(false)}
          >
            <TooltipProvider delayDuration={100}>
              {sidebarExpanded ? (
                <>
                  {/* ── Logo row ── */}
                  <div className="px-3 pt-3 pb-2 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0">
                      <LukaIcon size={13} />
                    </div>
                    <span className="text-sm font-semibold text-white flex-1 tracking-tight">Luka</span>
                    <span className="text-[9px] font-semibold text-white/45 bg-white/[0.10] rounded px-1.5 py-0.5 tracking-wide uppercase">AI</span>
                    <button
                      onClick={() => setSidebarExpanded(false)}
                      className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/[0.15] transition-colors ml-0.5"
                    >
                      <PanelLeftClose className="h-3.5 w-3.5 text-white/70" />
                    </button>
                  </div>

                  {/* ── New session button ── */}
                  <div className="px-2 pb-2">
                    <button
                      onClick={activeTab === "threads" ? () => {} : () => setNewWsModalOpen(true)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.13] transition-colors group"
                    >
                      <div className="w-5 h-5 rounded-full border border-white/50 flex items-center justify-center shrink-0 group-hover:border-white/80 transition-colors">
                        <Plus className="w-3 h-3 text-white/80 group-hover:text-white" />
                      </div>
                      <span className="text-sm text-white/55 group-hover:text-white/80 transition-colors">
                        {activeTab === "threads" ? "New thread" : "New workspace"}
                      </span>
                    </button>
                  </div>

                  {/* ── Filter row ── */}
                  <div className="px-3 pb-2 flex items-center gap-1">
                    <div className="relative" ref={el => { (filterDropdownRef as React.MutableRefObject<HTMLDivElement | null>).current = el; (wsFilterDropdownRef as React.MutableRefObject<HTMLDivElement | null>).current = el; }}>
                      {activeTab === "threads" ? (
                        <button
                          onClick={() => setFilterDropdownOpen(o => !o)}
                          className="flex items-center gap-1 text-xs font-medium text-white/50 hover:text-white/75 transition-colors"
                        >
                          {activeFilterLabel}
                          <ChevronDown className={cn("w-3 h-3 transition-transform duration-150", filterDropdownOpen && "rotate-180")} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setWsFilterDropdownOpen(o => !o)}
                          className="flex items-center gap-1 text-xs font-medium text-white/50 hover:text-white/75 transition-colors"
                        >
                          {activeWsFilterLabel}
                          <ChevronDown className={cn("w-3 h-3 transition-transform duration-150", wsFilterDropdownOpen && "rotate-180")} />
                        </button>
                      )}
                      {filterDropdownOpen && activeTab === "threads" && (
                        <div className="absolute top-full left-0 mt-1.5 z-50 min-w-[155px] rounded-[8px] bg-[hsl(212_60%_14%)] border border-white/[0.10] shadow-[0_4px_12px_rgba(0,0,0,0.18)] py-1">
                          {THREAD_FILTERS.map(f => (
                            <button
                              key={f.id}
                              onClick={() => { setThreadFilter(f.id); setFilterDropdownOpen(false); }}
                              className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors",
                                threadFilter === f.id
                                  ? "text-white bg-white/[0.10]"
                                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.06]"
                              )}
                            >
                              <f.Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                              {f.label}
                            </button>
                          ))}
                        </div>
                      )}
                      {wsFilterDropdownOpen && activeTab === "workspaces" && (
                        <div className="absolute top-full left-0 mt-1.5 z-50 min-w-[165px] rounded-[8px] bg-[hsl(212_60%_14%)] border border-white/[0.10] shadow-[0_4px_12px_rgba(0,0,0,0.18)] py-1">
                          {WORKSPACE_FILTERS.map(f => (
                            <button
                              key={f.id}
                              onClick={() => { setWorkspaceFilter(f.id); setWsFilterDropdownOpen(false); }}
                              className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors",
                                workspaceFilter === f.id
                                  ? "text-white bg-white/[0.10]"
                                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.06]"
                              )}
                            >
                              <f.Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                              {f.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-1" />
                    <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/[0.15] transition-colors">
                      <Search className="w-3 h-3 text-white/65 hover:text-white/90" />
                    </button>
                    <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/[0.15] transition-colors">
                      <SlidersHorizontal className="w-3 h-3 text-white/65 hover:text-white/90" />
                    </button>
                  </div>

                  <div className="mx-3 border-t border-white/[0.22] mb-1" />

                  {/* ── List content ── */}
                  {activeTab === "threads" ? (
                    <ScrollArea className="flex-1 px-2">
                      {/* Show flat filtered list for non-"all" filters */}
                      {threadFilter !== "all" ? (
                        <>
                          <p className="px-2 pt-2 pb-1 text-[10px] font-medium text-white/[0.38] uppercase tracking-wider">
                            {activeFilterLabel}
                          </p>
                          {(threadFilter === "pinned" ? pinnedThreads : recentThreads).map(t => (
                            <button key={t.id} className="w-full flex items-center gap-2.5 px-2 py-1.5 text-left rounded-lg hover:bg-white/[0.13] transition-colors group">
                              <MessageSquare className="w-3.5 h-3.5 text-white/55 shrink-0 group-hover:text-white/80" />
                              <span className="text-sm text-white/60 truncate group-hover:text-white/85">{t.name}</span>
                            </button>
                          ))}
                          {(threadFilter === "this-week" || threadFilter === "last-week" || threadFilter === "this-month") && (
                            <p className="px-2 py-4 text-xs text-white/30 text-center">No threads found</p>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Pinned section */}
                          <button onClick={() => toggleSection("pinned")} className="w-full flex items-center gap-1 px-2 pt-2 pb-1 group">
                            <span className="text-[10px] font-medium text-white/[0.38] uppercase tracking-wider flex-1 text-left">Pinned</span>
                            <ChevronRight className={cn("w-3 h-3 text-white/25 transition-transform duration-150", sectionOpen.pinned && "rotate-90")} />
                          </button>
                          {sectionOpen.pinned && pinnedThreads.map(t => (
                            <button key={t.id} className="w-full flex items-center gap-2.5 px-2 py-1.5 text-left rounded-lg hover:bg-white/[0.13] transition-colors group">
                              <MessageSquare className="w-3.5 h-3.5 text-white/55 shrink-0 group-hover:text-white/80" />
                              <span className="text-sm text-white/60 truncate group-hover:text-white/85">{t.name}</span>
                            </button>
                          ))}
                          {/* Recent section */}
                          <button onClick={() => toggleSection("recent")} className="w-full flex items-center gap-1 px-2 pt-3 pb-1 group">
                            <span className="text-[10px] font-medium text-white/[0.38] uppercase tracking-wider flex-1 text-left">Recent</span>
                            <ChevronRight className={cn("w-3 h-3 text-white/25 transition-transform duration-150", sectionOpen.recent && "rotate-90")} />
                          </button>
                          {sectionOpen.recent && recentThreads.map(t => (
                            <button key={t.id} className="w-full flex items-center gap-2.5 px-2 py-1.5 text-left rounded-lg hover:bg-white/[0.13] transition-colors group">
                              <MessageSquare className="w-3.5 h-3.5 text-white/55 shrink-0 group-hover:text-white/80" />
                              <span className="text-sm text-white/60 truncate group-hover:text-white/85">{t.name}</span>
                            </button>
                          ))}
                        </>
                      )}
                    </ScrollArea>
                  ) : (
                    /* ── Compilation Workspaces ── */
                    <ScrollArea className="flex-1 px-2">
                      {/* Pinned section */}
                      {pinnedWs.length > 0 && (
                        <>
                          <button onClick={() => toggleSection("pinned")} className="w-full flex items-center gap-1 px-2 pt-2 pb-1.5 group">
                            <span className="text-[10px] font-medium text-white/[0.38] uppercase tracking-wider flex-1 text-left">Pinned</span>
                            <ChevronRight className={cn("w-3 h-3 text-white/25 transition-transform duration-150", sectionOpen.pinned && "rotate-90")} />
                          </button>
                          {sectionOpen.pinned && COMP_WORKSPACES.filter(w => pinnedWs.includes(w.id)).map(ws => {
                            const isSelected = selectedCompWs?.id === ws.id;
                            return (
                            <div key={ws.id} className="group relative mb-1.5">
                              <button
                                onClick={() => selectCompWorkspace(ws)}
                                className={cn(
                                  "w-full flex items-center gap-2.5 px-2.5 py-2 text-left rounded-[6px] transition-colors border",
                                  isSelected
                                    ? "bg-white/[0.12] border-white/[0.15]"
                                    : "hover:bg-white/[0.08] border-transparent hover:border-white/[0.08]"
                                )}
                              >
                                <div className={cn("w-6 h-6 rounded-[4px] flex items-center justify-center shrink-0", isSelected ? "bg-primary/30" : "bg-white/[0.08]")}>
                                  <Building2 className={cn("w-3.5 h-3.5", isSelected ? "text-primary/80" : "text-white/50")} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn("text-xs font-medium truncate leading-tight", isSelected ? "text-white/90" : "text-white/70")}>{ws.name}</p>
                                  <p className="text-[10px] text-amber-400/60 truncate leading-tight mt-0.5">{ws.ref}</p>
                                </div>
                                {ws.active && <span className="w-1.5 h-1.5 rounded-full bg-green-400/70 shrink-0" />}
                              </button>
                              {/* Hover actions */}
                              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-[hsl(212.43deg_86.02%_10.76%)] rounded-[4px] px-0.5 py-0.5">
                                <button onClick={e => { e.stopPropagation(); togglePinWs(ws.id); }} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/[0.12] transition-colors">
                                  <Pin className="w-3 h-3 text-white/50 hover:text-white/80" />
                                </button>
                                <button onClick={e => e.stopPropagation()} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/[0.12] transition-colors">
                                  <X className="w-3 h-3 text-white/50 hover:text-red-400" />
                                </button>
                              </div>
                            </div>
                          );})}

                        </>
                      )}
                      {/* Active section */}
                      <button onClick={() => toggleSection("active")} className="w-full flex items-center gap-1 px-2 pt-2 pb-1.5 group">
                        <span className="text-[10px] font-medium text-white/[0.38] uppercase tracking-wider flex-1 text-left">Active</span>
                        <ChevronRight className={cn("w-3 h-3 text-white/25 transition-transform duration-150", sectionOpen.active && "rotate-90")} />
                      </button>
                      {sectionOpen.active && COMP_WORKSPACES.map(ws => {
                        const isSelected = selectedCompWs?.id === ws.id;
                        return (
                        <div key={ws.id} className="group relative mb-1.5">
                          <button
                            onClick={() => selectCompWorkspace(ws)}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-2.5 py-2 text-left rounded-[6px] transition-colors border",
                              isSelected
                                ? "bg-white/[0.12] border-white/[0.15]"
                                : "hover:bg-white/[0.08] border-transparent hover:border-white/[0.08]"
                            )}
                          >
                            <div className={cn("w-6 h-6 rounded-[4px] flex items-center justify-center shrink-0", isSelected ? "bg-primary/30" : "bg-white/[0.08]")}>
                              <Building2 className={cn("w-3.5 h-3.5", isSelected ? "text-primary/80" : "text-white/50")} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-xs font-medium truncate leading-tight", isSelected ? "text-white/90" : "text-white/70")}>{ws.name}</p>
                              <p className="text-[10px] text-amber-400/60 truncate leading-tight mt-0.5">{ws.ref}</p>
                            </div>
                            {ws.active && <span className="w-1.5 h-1.5 rounded-full bg-green-400/70 shrink-0" />}
                          </button>
                          {/* Hover actions */}
                          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-[hsl(212.43deg_86.02%_10.76%)] rounded-[4px] px-0.5 py-0.5">
                            <button onClick={e => { e.stopPropagation(); togglePinWs(ws.id); }} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/[0.12] transition-colors">
                              <Pin className={cn("w-3 h-3 transition-colors", pinnedWs.includes(ws.id) ? "text-amber-400/80" : "text-white/50 hover:text-white/80")} />
                            </button>
                            <button onClick={e => e.stopPropagation()} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/[0.12] transition-colors">
                              <X className="w-3 h-3 text-white/50 hover:text-red-400" />
                            </button>
                          </div>
                        </div>
                      );})}
                    </ScrollArea>
                  )}

                  {/* ── Footer ── */}
                  <div className="px-3 py-2.5 border-t border-white/[0.12]">
                    <button onClick={() => setShowAllRecent(!showAllRecent)} className="text-xs text-white/35 hover:text-white/60 transition-colors">
                      {showAllRecent ? "Show less" : "Show more"}
                    </button>
                  </div>
                </>
              ) : (
                /* ── COLLAPSED sidebar ── */
                <>
                  <div className="flex justify-center pt-3 pb-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setSidebarExpanded(true)}
                          className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(265_80%_55%)] flex items-center justify-center hover:opacity-90 transition-opacity"
                        >
                          <LukaIcon size={13} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right"><p>Expand Luka</p></TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex justify-center pb-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => { setSidebarExpanded(true); if (activeTab !== "threads") cancelAutopilot(); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.12] transition-colors"
                        >
                          <Plus className="h-4 w-4 text-white/65" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right"><p>{activeTab === "threads" ? "New Thread" : "New Workspace"}</p></TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="mx-auto w-7 border-t border-white/[0.18] mb-1" />
                  <ScrollArea className="flex-1 py-1">
                    <div className="flex flex-col items-center gap-0.5 px-1.5">
                      {allThreads.slice(0, 8).map((thread, i) => (
                        <Tooltip key={thread.id}>
                          <TooltipTrigger asChild>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.12] transition-colors relative">
                              <MessageSquare className="h-3.5 w-3.5 text-white/55" />
                              <div className={cn("absolute top-1 right-1 w-1.5 h-1.5 rounded-full", statusColors[i % statusColors.length])} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right"><p>{thread.name}</p></TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </TooltipProvider>
          </aside>

          {/* ═══ MAIN CONTENT ═══ */}
          <main className={cn(
            "flex-1 min-w-0 flex flex-col overflow-hidden transition-all duration-300",
            (isThinking || aiResponse || autopilotStep)
              ? "bg-background"
              : "bg-gradient-to-b from-[hsl(210_60%_97%)] via-[hsl(260_40%_96%)] to-[hsl(300_30%_96%)] dark:from-[hsl(220_20%_12%)] dark:via-[hsl(260_15%_14%)] dark:to-[hsl(280_10%_13%)]"
          )}>
            {/* Top header bar */}
            <div className="h-12 px-4 flex items-center border-b border-border/60 bg-background/60 backdrop-blur-sm shrink-0 gap-2">
              {/* Left: engagement badges when autopilot active */}
              <div className="flex items-center gap-2 shrink-0 min-w-0">
                <div />
              </div>

              {/* Center: Global-style underline tabs */}
              <div className="flex-1 flex items-end justify-center h-full">
                <div className="flex gap-0.5">
                  {([ { id: "threads", label: "Threads", Icon: MessageSquare }, { id: "workspaces", label: "Workspaces", Icon: Building2 } ] as const).map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as "threads" | "workspaces")}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors relative whitespace-nowrap",
                        activeTab === id
                          ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-t"
                          : "text-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: team avatars + file status + window controls */}
              <div className="flex items-center gap-2.5 shrink-0 justify-end min-w-0 ml-auto">
                {activeTab === "workspaces" && selectedCompWs && autopilotStep !== null && (
                  <>
                    {/* Team avatars — distinct colors per person */}
                    <div className="flex -space-x-2">
                      {[
                        { init: "AB", bg: "bg-[#C4B5FD]", text: "text-[#4C1D95]" },
                        { init: "TJ", bg: "bg-[#8B5CF6]", text: "text-white" },
                        { init: "PT", bg: "bg-[#3B82F6]", text: "text-white" },
                      ].map((av, i) => (
                        <div
                          key={i}
                          className={cn("w-7 h-7 rounded-full border-2 border-background flex items-center justify-center text-[9px] font-bold shrink-0 shadow-sm", av.bg, av.text)}
                          style={{ zIndex: 3 - i }}
                        >
                          {av.init}
                        </div>
                      ))}
                    </div>
                    {/* FILE status pill */}
                    {isAutomating ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-destructive border border-destructive/30 bg-destructive/5 rounded-[8px] px-3 py-1.5 shrink-0 shadow-sm animate-pulse">
                        <Lock className="w-3 h-3" /> FILE LOCKED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800/40 rounded-[8px] px-3 py-1.5 shrink-0 shadow-sm">
                        <FolderOpen className="w-3.5 h-3.5" /> FILE OPEN
                      </span>
                    )}
                  </>
                )}
              </div>

              <TooltipProvider delayDuration={200}>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarExpanded(!sidebarExpanded)}>
                        <PanelLeftClose className="h-4 w-4 text-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>Toggle Sidebar</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className={cn("h-8 w-8", viewMode === "full" && "bg-muted")} onClick={() => setViewMode(viewMode === "full" ? "half" : "full")}>
                        <Maximize2 className="h-4 w-4 text-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>{viewMode === "full" ? "Half Mode" : "Full Mode"}</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Minus className="h-4 w-4 text-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>Minimize</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
                        <X className="h-4 w-4 text-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>Close</p></TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>

            {/* Body */}
            {activeTab === "workspaces" ? (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

                {/* ── INIT SCREEN ── */}
                {autopilotStep === "init" && activeLoan && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 animate-in fade-in duration-300">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-[hsl(265_80%_55%)/20] blur-2xl scale-150" />
                      <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#8649F1] to-[#2355A4] flex items-center justify-center shadow-2xl shadow-primary/30">
                        <LukaIcon size={40} />
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-bold text-foreground">Automate Engagement?</h2>
                      <p className="text-sm text-foreground max-w-xs leading-relaxed">
                        I'll guide you through the setup process and verify everything is ready for a smooth automation run
                      </p>
                    </div>
                    <button
                      onClick={() => startVerification(activeLoan)}
                      className="flex items-center gap-2.5 px-8 py-3 rounded-xl bg-gradient-to-r from-[#8649F1] to-[#2355A4] text-white font-semibold text-sm shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity"
                    >
                      <Zap className="w-4 h-4" fill="white" strokeWidth={0} />
                      Initialize Luka
                    </button>
                  </div>
                )}

                {/* ── WIZARD STEPS ── */}
                {isWizardStep && selectedCompWs && (
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                    {renderTabBar()}
                    {/* Single scrollable page — all sections, tabs scroll to anchors */}
                    <div className="flex-1 overflow-y-auto min-h-0 bg-[hsl(220_20%_98%)] dark:bg-[hsl(220_15%_10%)] pb-28">
                      <div ref={el => { sectionRefs.current["verification"] = el; }}>
                        {renderVerification()}
                      </div>
                      <div className="border-t border-border/30" ref={el => { sectionRefs.current["checklists"] = el; }}>
                        {renderChecklists()}
                      </div>
                      <div className="border-t border-border/30" ref={el => { sectionRefs.current["letters"] = el; }}>
                        {renderLetters()}
                      </div>
                      <div className="border-t border-border/30" ref={el => { sectionRefs.current["workingpapers"] = el; }}>
                        {renderWorkingPapers()}
                      </div>
                      <div className="border-t border-border/30" ref={el => { sectionRefs.current["fsmapping"] = el; }}>
                        {renderFSMapping()}
                      </div>
                      <div className="border-t border-border/30" ref={el => { sectionRefs.current["magic"] = el; }}>
                        {renderMagic()}
                      </div>
                      {/* Scroll anchor — auto-scrolled to as content grows */}
                      <div ref={scrollAnchorRef} className="h-1" />
                    </div>

                    {/* ── Floating chat input ── */}
                    <div className="absolute bottom-4 left-0 right-0 px-6 pointer-events-none z-10">
                      <div className="max-w-2xl mx-auto pointer-events-auto relative">
                        <PromptPicker open={showPromptPicker} filter={hashFilter} onSelect={handlePromptSelect} onClose={() => { setShowPromptPicker(false); setHashFilter(""); }} />

                        {/* Outer container */}
                        <div className="rounded-[10px] bg-background dark:bg-card border border-border/80 shadow-[0_4px_24px_rgba(0,0,0,0.12)] luka-gradient-border overflow-hidden">

                          {/* ── TOP CONTEXT STRIP ── */}
                          <div className="flex items-center justify-between px-3 py-2">
                            {/* Left: engagement ref ← active step + QB badge */}
                            <div className="flex items-center gap-1.5 text-xs text-foreground min-w-0">
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-foreground"><path d="M5 3H3a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1zM13 3h-2a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1zM5 9H3a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 00-1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M8 5v6M8 11l3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              <span className="font-semibold text-foreground truncate">{selectedCompWs?.ref ?? "Workspace"}</span>
                              <ArrowLeft className="w-3 h-3 opacity-40 shrink-0" />
                              <span className="truncate">{WIZARD_TABS.find(t => t.id === activeWizardTab)?.label ?? activeWizardTab}</span>
                              {/* QuickBooks live connection badge */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-0.5 cursor-default ml-1">
                                    <div className="relative flex items-center justify-center w-4 h-4 rounded-full bg-[#2CA01C] shadow-sm shrink-0">
                                      <span className="text-white font-black text-[6px] leading-none">QB</span>
                                      <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 border border-background" />
                                    </div>
                                    <button className="w-5 h-5 flex items-center justify-center text-foreground hover:text-foreground transition-colors shrink-0">
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top">Add connectors</TooltipContent>
                              </Tooltip>
                            </div>
                            {/* Right: action button */}
                            <div className="flex items-center gap-2 shrink-0">
                              {lukaIsTyping || (verifyPhase !== "idle" && verifyPhase !== "done") ? (
                                <button disabled className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border border-border/40 bg-muted/30 text-xs font-medium text-foreground cursor-not-allowed">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse" />
                                  Working…
                                </button>
                              ) : activeWizardTab === "magic" ? (
                                <button onClick={() => startMagic()} className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] border border-border/80 bg-background text-xs font-medium text-foreground hover:bg-muted/50 transition-colors">
                                  Start Magic
                                  <ChevronDown className="w-3 h-3 opacity-40" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    const tabs = ["verification","checklists","letters","workingpapers","fsmapping","magic"];
                                    const idx = tabs.indexOf(activeWizardTab);
                                    const next = tabs[idx + 1] ?? activeWizardTab;
                                    setActiveWizardTab(next as AutopilotStep);
                                    sectionRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "start" });
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] border border-border/80 bg-background text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
                                >
                                  Continue
                                  <ChevronDown className="w-3 h-3 opacity-40 -rotate-90" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* File strip — only when files attached */}
                          {attachedFiles.length > 0 && (
                            <>
                              <div className="flex items-center gap-1.5 flex-wrap px-3 pt-2.5 pb-2">
                                {attachedFiles.map(f => (
                                  <span key={f.id} className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-[6px] bg-muted/80 text-xs text-foreground">
                                    <FileText className="w-3 h-3 text-foreground shrink-0" />
                                    {f.name}
                                    <button onClick={() => removeFile(f.id)} className="ml-0.5 w-4 h-4 rounded flex items-center justify-center text-foreground hover:text-foreground transition-colors">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <div className="px-3"><div className="h-px bg-border/60 rounded-full" /></div>
                            </>
                          )}

                          {/* Text input */}
                          <div className="border-t border-border/60 rounded-[8px]">
                            <div className="px-3 pt-2.5 pb-2.5">
                              <input
                                ref={inputRef}
                                type="text"
                                value={message}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                disabled={lukaIsTyping || (verifyPhase !== "idle" && verifyPhase !== "done")}
                                placeholder={lukaIsTyping || (verifyPhase !== "idle" && verifyPhase !== "done") ? "Luka is working…" : "Reply..."}
                                className={cn("w-full bg-transparent h-7 outline-none border-none text-sm", lukaIsTyping || (verifyPhase !== "idle" && verifyPhase !== "done") ? "placeholder:text-foreground cursor-not-allowed" : "placeholder:text-foreground", message.includes("#") ? "text-primary font-medium" : "text-foreground")}
                              />
                            </div>
                          </div>

                          {/* Toolbar */}
                          <div className="px-2 pb-2 pt-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-0.5">
                              <LukaAttachMenu onFilesAdded={addFiles} />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="flex items-center gap-1.5 px-2 h-7 rounded-[6px] hover:bg-muted/50 transition-colors text-xs text-foreground hover:text-foreground">
                                    {editMode === 'auto' ? 'Auto accept edits' : 'Ask permissions'}
                                    <ChevronDown className="w-3 h-3 opacity-40" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="min-w-[220px]">
                                  <DropdownMenuItem onSelect={() => setEditMode('ask')} className="flex flex-col items-start gap-0.5 py-2 cursor-pointer">
                                    <span className="font-medium text-xs text-foreground">Ask permissions</span>
                                    <span className="text-[11px] text-foreground">Always ask before making changes</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => setEditMode('auto')} className="flex flex-col items-start gap-0.5 py-2 cursor-pointer">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-[10px] opacity-60">&lt;/&gt;</span>
                                      <span className="font-medium text-xs text-foreground">Auto accept edits</span>
                                    </div>
                                    <span className="text-[11px] text-foreground">Automatically accept all file edits</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <button className="flex items-center gap-1.5 px-2 h-7 rounded-[6px] hover:bg-muted/50 transition-colors text-xs text-foreground hover:text-foreground">
                                <Zap className="w-3 h-3 text-violet-400 shrink-0" />
                                Luka AI
                                <ChevronDown className="w-3 h-3 opacity-40" />
                              </button>
                              {message.trim() ? (
                                <Button size="icon" className="h-7 w-7 rounded-[6px] bg-gradient-to-br from-[#8649F1] to-[#2355A4] hover:opacity-90 text-white shadow-sm" onClick={handleSend}>
                                  <Send className="h-3.5 w-3.5" />
                                </Button>
                              ) : (
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[6px]" onClick={() => setVoiceOpen(true)}>
                                  <Mic className="h-3.5 w-3.5 text-foreground" />
                                </Button>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── AUTOMATION IN PROGRESS ── */}
                {autopilotStep === "automating" && renderAutomating()}

                {/* ── OBSERVATION MODE ── */}
                {autopilotStep === "observation" && renderObservation()}

                {/* ── IDLE / NO LOAN ── */}
                {autopilotStep === null && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 opacity-70">
                    <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                      <Building2 className="w-7 h-7 text-foreground" />
                    </div>
                    <div className="text-center space-y-1.5">
                      <p className="text-sm font-medium text-foreground">Select a workspace to start</p>
                      <p className="text-xs text-foreground max-w-[280px] leading-relaxed">
                        Choose an active workspace from the sidebar and Luka will automatically prepare your engagement, or click New workspace to start a new engagement.
                      </p>
                    </div>
                    <button
                      onClick={() => setNewWsModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] border border-border bg-background text-xs font-medium text-foreground hover:bg-muted/60 hover:border-primary/40 transition-all duration-150 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5 text-foreground" />
                      New workspace
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ── THREADS VIEW ── */
              <div className="flex-1 flex flex-col min-w-0 min-h-0">
                <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
                  {!sentMessage ? (
                    <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-[60vh]">
                      <div className="mb-8 relative flex items-center justify-center w-24 h-24">
                        <div className="absolute -inset-4 luka-ambient-glow" />
                        <div className="absolute inset-0 luka-ambient-orb opacity-20" />
                        <div className="relative flex items-center justify-center w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(265_80%_55%)] z-10 shadow-[0_0_30px_rgba(151,71,255,0.12)]">
                          <LukaIcon size={24} />
                        </div>
                      </div>
                      <h1 className="text-2xl font-semibold text-foreground mb-8 text-center">How can I help you today?</h1>
                      <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
                        {suggestions.map(s => (
                          <button key={s} onClick={() => handlePromptSelect(s.replace("#", ""))} className="px-4 py-2 rounded-[10px] border border-border bg-background dark:bg-card text-sm text-foreground hover:bg-muted/60 transition-colors">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="px-6 py-4 space-y-4 min-w-0 max-w-full overflow-hidden">
                      <div className="flex justify-end">
                        <div className="max-w-[80%] px-4 py-3 rounded-[12px] bg-primary text-primary-foreground text-base">{sentMessage}</div>
                      </div>
                      {(isThinking || aiResponse) && (
                        <div className="flex items-start gap-3 min-w-0 max-w-full">
                          <div className={cn("w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0", isThinking && "luka-thinking-spin")}>
                            <LukaIcon size={16} />
                          </div>
                          <div className="flex-1 pt-1.5 min-h-[28px] min-w-0 overflow-x-auto">
                            {isThinking ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground luka-thinking-text">Thinking</span>
                                <span className="flex gap-0.5">
                                  <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-1" />
                                  <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-2" />
                                  <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-3" />
                                </span>
                              </div>
                            ) : richResponseType === "gross-margin" ? (
                              <><GrossMarginResponse revealStep={revealStep} />{revealStep >= 5 && <LukaResponseActions />}</>
                            ) : (
                              <>
                                <div className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
                                  {displayedResponse}
                                  {isStreaming && <span className="inline-block w-0.5 h-4 bg-primary/70 ml-0.5 align-middle luka-thinking-text" />}
                                </div>
                                {!isStreaming && aiResponse && <LukaResponseActions />}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Chat input */}
                <div className={cn("pb-6 pt-2", viewMode === "full" ? "px-12" : "px-6")}>
                  <div className={cn("w-full mx-auto relative", viewMode === "full" ? "max-w-none" : "max-w-[700px]")}>
                    <PromptPicker open={showPromptPicker} filter={hashFilter} onSelect={handlePromptSelect} onClose={() => { setShowPromptPicker(false); setHashFilter(""); }} />
                    <div className="border border-border rounded-[12px] overflow-visible bg-background dark:bg-card hover:border-primary/30 transition-all duration-200 luka-gradient-border relative">
                      <AttachedFilesBar files={attachedFiles} onRemove={removeFile} onClearAll={clearFiles} />
                      <div className="px-4 pt-3 pb-2">
                        <input
                          ref={inputRef}
                          type="text"
                          value={message}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          placeholder="Type # for prompts or just ask anything..."
                          className={cn("w-full bg-transparent h-9 placeholder:text-foreground outline-none border-none text-sm", message.includes("#") ? "text-primary font-medium" : "text-foreground")}
                        />
                      </div>
                      <div className="px-3 pb-3 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <LukaAttachMenu onFilesAdded={addFiles} />
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-[10px]"><Inbox className="h-4 w-4 text-foreground" /></Button>
                          <div className="flex items-center gap-1.5 px-3 h-9 rounded-[10px] border border-border bg-background dark:bg-muted/20 text-sm text-foreground">
                            <span className="text-amber-500">✨</span>
                            <span className="text-sm font-medium">Gemini 3 Flash</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-[10px]" onClick={() => setVoiceOpen(true)}>
                            <Mic className="h-4 w-4 text-foreground" />
                          </Button>
                          <Button
                            size="icon"
                            className={cn("h-9 w-9 rounded-full transition-all duration-200", message.trim() ? "bg-gradient-to-br from-[#8649F1] to-[#2355A4] hover:opacity-90 text-white shadow-md" : "bg-muted hover:bg-muted/80 text-foreground")}
                            onClick={handleSend}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <VoiceRecordingOverlay open={voiceOpen} onClose={() => setVoiceOpen(false)} onComplete={(text) => setMessage(prev => prev ? prev + " " + text : text)} />
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* ── Add New Workspace Modal ── */}
        {newWsModalOpen && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
            <div className="bg-background rounded-[8px] shadow-2xl w-[480px] max-h-[85vh] flex flex-col overflow-hidden border border-border">
              {/* Header */}
              <div className="px-6 pt-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-[8px] bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <button onClick={() => { setNewWsModalOpen(false); setNewWsSearch(""); setNewWsSelected([]); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h2 className="text-lg font-semibold text-foreground">Add New Workspace</h2>
                <p className="text-sm text-foreground mt-1">Select from the below source connected engagements to add to your workspace.</p>
              </div>

              {/* Search + sort row */}
              <div className="px-6 pb-3 flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground" />
                  <input
                    value={newWsSearch}
                    onChange={e => setNewWsSearch(e.target.value)}
                    placeholder="Search clients"
                    className="w-full pl-9 pr-3 py-2 rounded-[8px] border border-border bg-background text-sm placeholder:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-colors"
                  />
                </div>
                <button
                  onClick={() => setNewWsSortAsc(s => !s)}
                  className="w-9 h-9 flex items-center justify-center rounded-[8px] border border-border bg-muted/40 hover:bg-muted transition-colors text-foreground"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>

              {/* Client list */}
              <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-2">
                {WS_CLIENTS
                  .filter(c => c.name.toLowerCase().includes(newWsSearch.toLowerCase()) || c.ref.toLowerCase().includes(newWsSearch.toLowerCase()))
                  .sort((a, b) => newWsSortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))
                  .map(client => {
                    const selected = newWsSelected.includes(client.id);
                    return (
                      <button
                        key={client.id}
                        onClick={() => setNewWsSelected(s => selected ? s.filter(id => id !== client.id) : [...s, client.id])}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-[8px] border text-left transition-all duration-150 group",
                          selected ? "border-primary/40 bg-primary/[0.04]" : "border-border hover:border-primary/25 hover:bg-muted/30"
                        )}
                      >
                        {/* Checkbox */}
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                          selected ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"
                        )}>
                          {selected && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                        {/* Icon */}
                        <div className="w-8 h-8 rounded-[8px] bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        {/* Name + ref */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
                          <p className="text-xs text-foreground truncate">{client.ref}</p>
                        </div>
                        {/* Source badge */}
                        <div className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] border text-xs font-medium shrink-0",
                          client.source === "quickbooks" ? "border-green-200 bg-green-50 text-green-700" : "border-blue-200 bg-blue-50 text-blue-700"
                        )}>
                          {client.source === "quickbooks" ? "QuickBooks" : "Xero"}
                        </div>
                      </button>
                    );
                  })
                }
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border flex items-center gap-3">
                <button
                  onClick={() => { setNewWsModalOpen(false); setNewWsSearch(""); setNewWsSelected([]); }}
                  className="flex-1 py-2.5 rounded-[8px] border border-border text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newWsSelected.length > 0) {
                      const loan = activeLoans.find(l => newWsSelected.includes(l.id)) || activeLoans[0];
                      setNewWsModalOpen(false); setNewWsSearch(""); setNewWsSelected([]);
                      if (loan) initializeAutopilot(loan);
                    }
                  }}
                  disabled={newWsSelected.length === 0}
                  className="flex-1 py-2.5 rounded-[8px] bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Create{newWsSelected.length > 0 ? ` (${newWsSelected.length})` : ""}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
