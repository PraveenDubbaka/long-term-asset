import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, CheckCircle2, AlertCircle, ArrowRight, ChevronDown, Lock, LockKeyhole, Plus, Minus, RefreshCw, ArrowLeft, X, PanelRightOpen, ListChecks, MoreVertical, UserPlus, Check } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import lukaResponding from "@/assets/luka-responding.gif";
import lukaIdle from "@/assets/luka-idle.gif";
import PopulateChecklistsView from "./PopulateChecklistsView";
import ChecklistPreviewPanel from "./ChecklistPreviewPanel";
import LetterPreviewPanel from "./LetterPreviewPanel";
import GenerateLettersView from "./GenerateLettersView";
import MappingTBView from "./MappingTBView";
import ProposedAdjEntriesView from "./ProposedAdjEntriesView";
import FinancialStatementsView from "./FinancialStatementsView";
import FinancialStatementPreview from "./FinancialStatementPreview";
import NotesGeneratorView from "./NotesGeneratorView";
import NotesPreviewPanel from "./NotesPreviewPanel";
import InspectionChecklistView from "./InspectionChecklistView";
import CapitalAssetAmortizationView from "./CapitalAssetAmortizationView";
import AgedARAnalysisView from "./AgedARAnalysisView";
import FinalSignoffsView from "./FinalSignoffsView";
import CompletionArchiveView from "./CompletionArchiveView";
import DispatchPackageView from "./DispatchPackageView";
import DocumentsTab from "./DocumentsTab";

interface CenterStep {
  title: string;
  needsReview?: number;
}

const CENTER_STEPS: CenterStep[] = [
  { title: "Initiated Luka automation for this engagement" },
  { title: "Formed the list of all uploaded documents" },
  { title: "Analyzed which documents need to be sent to the client" },
  { title: "Generated the request" },
  { title: "Checked for available finalized letter templates" },
  { title: "Checked available checklists and mapping responses" },
  { title: "Validated general ledger & pulling trial balance to auto-map accounts", needsReview: 1 },
  { title: "Generated working papers", needsReview: 2 },
  { title: "Generated Financial statements with notes", needsReview: 2 },
  { title: "Completion & Signoffs", needsReview: 3 },
];

type Status = "done" | "pending" | "idle";
interface RhsItem {
  label: string;
  status: Status;
}
interface RhsGroup {
  title: string;
  /** Reveal this group when visibleCount (center steps completed) reaches this value */
  revealAt: number;
  items: RhsItem[];
}

const RHS_GROUPS: RhsGroup[] = [
  {
    title: "CLIENT ONBOARDING",
    revealAt: 6, // after "Checked available checklists and mapping responses"
    items: [
      { label: "Populate Checklists", status: "pending" },
      { label: "Generate Letters", status: "done" },
    ],
  },
  {
    title: "TRIAL BALANCE & ADJ. ENTRIES",
    revealAt: 7, // after "Validated GL & TB"
    items: [
      { label: "Mapping TB", status: "done" },
      { label: "Proposed Adj. Entries", status: "pending" },
    ],
  },
  {
    title: "PROCEDURES",
    revealAt: 8, // after "Generated working papers"
    items: [
      { label: "Capital Asset Amortization", status: "done" },
      { label: "Aged AR Analysis", status: "done" },
    ],
  },
  {
    title: "FS & NOTES GENERATION",
    revealAt: 9, // after "Generated FS with notes"
    items: [
      { label: "Financial Statements Generation", status: "pending" },
      { label: "Notes Generator", status: "pending" },
    ],
  },
  {
    title: "COMPLETION & SIGNOFFS",
    revealAt: 10, // after "Completion & Signoffs"
    items: [
      { label: "Inspection File Status Checklist", status: "pending" },
      { label: "Final Signoffs", status: "pending" },
      { label: "Dispatching FS Package Delivery", status: "pending" },
      { label: "Completion & Archive", status: "pending" },
    ],
  },
];

const STEP_INTERVAL = 900;
const HEADLINE_DELAY = 400;
const STEPS_START_DELAY = 1100;

interface Props {
  onRerun?: () => void;
  onComplete?: () => void;
  variant?: "default" | "upload";
}

const RHS_MIN = 260;
const RHS_MAX = 560;
const RHS_DEFAULT = 313; // increased 15% from 272
const RHS_COLLAPSED = 44;

const EngagementAutomationView = ({ onRerun, onComplete, variant = "default" }: Props) => {
  const [showHeadline, setShowHeadline] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"file" | "documents">("file");
  const [rhsWidth, setRhsWidth] = useState(RHS_DEFAULT);
  const [rhsCollapsed, setRhsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [lockHovered, setLockHovered] = useState(false);
  const [lockPhase, setLockPhase] = useState<"locked" | "unlocking" | "gone">("locked");
  const centerScrollRef = useRef<HTMLDivElement>(null);
  // Remembered scroll position per procedure view
  const scrollMemory = useRef<Record<string, number>>({});
  const prevActiveViewRef = useRef<string>("automation");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [stepsCollapsed, setStepsCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<"automation" | "populate-checklists" | "generate-letters" | "mapping-tb" | "proposed-adj-entries" | "financial-statements" | "notes-generator" | "inspection-checklist" | "capital-asset-amortization" | "aged-ar-analysis" | "final-signoffs" | "completion-archive" | "dispatch-package">("automation");
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [openThreadMenu, setOpenThreadMenu] = useState<string | null>(null);
  const [previewChecklist, setPreviewChecklist] = useState<string | null>(null);
  const [previewLetter, setPreviewLetter] = useState<string | null>(null);
  const [previewFinancialStatement, setPreviewFinancialStatement] = useState<string | null>(null);
  const [previewNote, setPreviewNote] = useState<string | null>(null);

  const openChecklistPreview = (title: string) => {
    setPreviewFinancialStatement(null);
    setPreviewLetter(null);
    setPreviewNote(null);
    setPreviewChecklist(title);
    setRhsCollapsed(true);
  };
  const closeChecklistPreview = () => {
    setPreviewChecklist(null);
    setRhsCollapsed(false);
  };
  const openLetterPreview = (title: string) => {
    setPreviewFinancialStatement(null);
    setPreviewChecklist(null);
    setPreviewNote(null);
    setPreviewLetter(title);
    setRhsCollapsed(true);
  };
  const closeLetterPreview = () => {
    setPreviewLetter(null);
    setRhsCollapsed(false);
  };
  const openFinancialStatementPreview = (section: string) => {
    setPreviewChecklist(null);
    setPreviewLetter(null);
    setPreviewNote(null);
    setPreviewFinancialStatement(section);
    setRhsCollapsed(true);
  };
  const closeFinancialStatementPreview = () => {
    setPreviewFinancialStatement(null);
    setRhsCollapsed(false);
  };
  const openNotePreview = (title: string) => {
    setPreviewChecklist(null);
    setPreviewLetter(null);
    setPreviewFinancialStatement(null);
    setPreviewNote(title);
    setRhsCollapsed(true);
  };
  const closeNotePreview = () => {
    setPreviewNote(null);
    setRhsCollapsed(false);
  };

  const TEAM_MEMBERS = [
    { name: "Sarah Chen", initials: "SC", color: "hsl(265 60% 55%)" },
    { name: "Marcus Patel", initials: "MP", color: "hsl(207 71% 45%)" },
    { name: "Elena Rodriguez", initials: "ER", color: "hsl(145 55% 42%)" },
    { name: "David Kim", initials: "DK", color: "hsl(30 85% 50%)" },
    { name: "Priya Sharma", initials: "PS", color: "hsl(340 70% 55%)" },
  ];

  useEffect(() => {
    if (!openThreadMenu) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-thread-menu]")) setOpenThreadMenu(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openThreadMenu]);

  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      const next = window.innerWidth - e.clientX;
      setRhsWidth(Math.min(RHS_MAX, Math.max(RHS_MIN, next)));
    };
    const onUp = () => setIsResizing(false);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizing]);

  useEffect(() => {
    const t1 = setTimeout(() => setShowHeadline(true), HEADLINE_DELAY);
    const t2 = setTimeout(() => setVisibleCount(1), STEPS_START_DELAY);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    if (visibleCount === 0 || visibleCount >= CENTER_STEPS.length) return;
    const t = setTimeout(() => setVisibleCount((c) => c + 1), STEP_INTERVAL);
    return () => clearTimeout(t);
  }, [visibleCount]);

  const allDone = visibleCount >= CENTER_STEPS.length;

  useEffect(() => {
    if (!allDone) return;
    setLockPhase("gone");
    onComplete?.();
  }, [allDone, onComplete]);

  useEffect(() => {
    if (visibleCount <= 1) return;
    const el = centerScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visibleCount]);

  useEffect(() => {
    if (!allDone) return;
    const el = centerScrollRef.current;
    if (!el) return;
    // Wait for the completion card's enter animation to render, then scroll to bottom
    const t = setTimeout(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, 800);
    return () => clearTimeout(t);
  }, [allDone]);

  useEffect(() => {
    const el = centerScrollRef.current;
    if (!el) return;
    const onScroll = () => {
      setShowScrollTop(el.scrollTop > 200);
      // Persist scroll position for every thread view (non-automation)
      if (activeView !== "automation") {
        scrollMemory.current[activeView] = el.scrollTop;
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [activeView]);

  // On entering any thread view, restore saved scroll position
  // (or auto-scroll to bottom on the first visit).
  useEffect(() => {
    const remembered = activeView !== "automation";
    const prev = prevActiveViewRef.current;
    prevActiveViewRef.current = activeView;
    if (!remembered || prev === activeView) return;
    const el = centerScrollRef.current;
    if (!el) return;
    const saved = scrollMemory.current[activeView];
    const t = setTimeout(() => {
      if (typeof saved === "number") {
        el.scrollTo({ top: saved, behavior: "auto" });
      } else {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }
    }, 120);
    return () => clearTimeout(t);
  }, [activeView]);




  // Synchronized RHS reveal — each group appears as its matching center step completes
  const rhsGroupsState = RHS_GROUPS.map((g) => {
    const groupVisible = visibleCount >= g.revealAt;
    const items = g.items.map((it) => ({ ...it, visible: groupVisible }));
    return { ...g, items };
  });

  return (
    <div className="flex-1 flex min-w-0 overflow-hidden" style={{ contain: "layout paint" }}>
      {/* Center column */}
      <div ref={centerScrollRef} className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto relative" style={{ contain: "layout paint" }}>
        {activeView !== "automation" && (
          <button
            onClick={() => setActiveView("automation")}
            className="absolute top-3 left-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{
              background: "hsl(0 0% 100%)",
              border: "1.5px solid hsl(220 20% 88%)",
              boxShadow: "0 2px 10px hsl(222 30% 20% / 0.08)",
              color: "hsl(265 60% 45%)",
            }}
            title="Back to automation"
            aria-label="Back to automation"
          >
            <ArrowLeft size={15} strokeWidth={2.2} />
          </button>
        )}
        {activeView === "populate-checklists" ? (
          <PopulateChecklistsView
            variant={variant}
            activePreview={previewChecklist}
            onPreview={openChecklistPreview}
          />
        ) : activeView === "generate-letters" ? (
          <GenerateLettersView activePreview={previewLetter} onPreview={openLetterPreview} />
        ) : activeView === "mapping-tb" ? (
          <MappingTBView />
        ) : activeView === "proposed-adj-entries" ? (
          <ProposedAdjEntriesView />
        ) : activeView === "financial-statements" ? (
          <FinancialStatementsView
            activePreview={previewFinancialStatement}
            onPreview={openFinancialStatementPreview}
          />
        ) : activeView === "notes-generator" ? (
          <NotesGeneratorView activePreview={previewNote} onPreview={openNotePreview} />
        ) : activeView === "inspection-checklist" ? (
          <InspectionChecklistView />
        ) : activeView === "capital-asset-amortization" ? (
          <CapitalAssetAmortizationView />
        ) : activeView === "aged-ar-analysis" ? (
          <AgedARAnalysisView />
        ) : activeView === "final-signoffs" ? (
          <FinalSignoffsView />
        ) : activeView === "completion-archive" ? (
          <CompletionArchiveView />
        ) : activeView === "dispatch-package" ? (
          <DispatchPackageView />
        ) : (
        <div className="w-full max-w-full md:max-w-[92%] lg:max-w-[960px] mx-auto px-6 py-8 transition-all duration-500 ease-out">
          <div className="flex items-start gap-4">
            <div className="shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center">
              <img
                src={allDone ? lukaIdle : lukaResponding}
                alt="Luka"
                className={
                  allDone
                    ? "w-8 h-8 object-contain"
                    : "w-11 h-11 object-contain -m-1.5"
                }
              />
            </div>

            <div className="min-w-0 flex-1">
              <AnimatePresence>
                {showHeadline && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="text-[15px] leading-relaxed"
                    style={{
                      color: "hsl(222 35% 16%)",
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                    }}
                  >
                    Engagement automated has started. I'll process each file and tell you what's still missing or requires review.
                  </motion.p>
                )}
              </AnimatePresence>

              {showHeadline && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.45 }}
                  className="mt-5 flex items-center gap-2"
                >
              <span
                className="text-[14px] font-semibold italic"
                style={{ color: "hsl(222 30% 22%)" }}
              >
                {allDone ? (
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStepsCollapsed((c) => !c)}
                      aria-label={stepsCollapsed ? "Expand steps" : "Collapse steps"}
                      className="inline-flex items-center justify-center w-5 h-5 rounded-[4px] transition-colors hover:bg-[hsl(220_20%_92%)]"
                      style={{
                        border: "1px solid hsl(220 20% 80%)",
                        background: "hsl(0 0% 100%)",
                        color: "hsl(222 25% 35%)",
                      }}
                    >
                      {stepsCollapsed ? <Plus size={12} strokeWidth={2.4} /> : <Minus size={12} strokeWidth={2.4} />}
                    </button>
                    Engagement Automation complete
                  </span>
                ) : (
                  "Engagement Automation in progress"
                )}
              </span>
                  {!allDone && (
                    <span className="flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: "hsl(265 75% 60%)" }}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.25,
                          }}
                        />
                      ))}
                    </span>
                  )}
                  {allDone && onRerun && (
                    <button
                      type="button"
                      onClick={onRerun}
                      title="Rerun automation"
                      className="ml-2 w-7 h-7 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[hsl(220_20%_94%)]"
                      style={{
                        border: "1px solid hsl(220 20% 88%)",
                        background: "hsl(0 0% 100%)",
                        color: "hsl(222 25% 35%)",
                      }}
                    >
                      <RefreshCw size={12} strokeWidth={2.2} />
                    </button>
                  )}
                </motion.div>
              )}

              <div className="mt-3" style={{ display: stepsCollapsed ? "none" : undefined }}>
                <AnimatePresence initial={false}>
                  {CENTER_STEPS.slice(0, visibleCount).map((step, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      style={{ borderTop: "1px solid hsl(220 20% 92%)" }}
                      className="flex items-center gap-3 py-3"
                    >
                      <span
                        className="flex-1 text-[14px]"
                        style={{
                          color: "hsl(222 25% 30%)",
                          fontFamily: "'DM Sans', system-ui, sans-serif",
                        }}
                      >
                        {step.title}
                      </span>
                      {step.needsReview ? (
                        <motion.div
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 360, damping: 22 }}
                          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                          style={{
                            background: "hsl(38 100% 95%)",
                            color: "hsl(28 85% 45%)",
                            border: "1px solid hsl(38 90% 78%)",
                          }}
                        >
                          <AlertCircle size={11} strokeWidth={2.4} />
                          {step.needsReview} Needs Review
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 360, damping: 22 }}
                          className="shrink-0"
                        >
                          <CheckCircle2
                            size={18}
                            style={{ color: "hsl(145 63% 42%)" }}
                            strokeWidth={2}
                          />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {allDone && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
                    className="mt-6 flex items-start gap-4 p-5 rounded-[16px]"
                    style={{
                      background: "linear-gradient(135deg, hsl(265 60% 97%) 0%, hsl(220 60% 98%) 100%)",
                      border: "1px solid hsl(265 40% 92%)",
                    }}
                  >
                    <div className="shrink-0 w-8 h-8 flex items-center justify-center">
                      <img src={lukaIdle} alt="Luka" className="w-8 h-8 object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[14px] font-bold"
                        style={{ color: "hsl(222 35% 14%)", fontFamily: "'DM Sans', system-ui, sans-serif" }}
                      >
                        Luka
                      </p>
                      <p
                        className="mt-2 text-[14px] leading-relaxed"
                        style={{ color: "hsl(222 25% 25%)", fontFamily: "'DM Sans', system-ui, sans-serif" }}
                      >
                        I've completed the engagement automation and it's now ready for your review. Please click on the{" "}
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12.5px] font-semibold align-middle"
                          style={{
                            background: "hsl(220 30% 96%)",
                            border: "1px solid hsl(220 25% 90%)",
                            color: "hsl(222 35% 18%)",
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: "hsl(30 95% 55%)" }}
                          />
                          flagged threads
                        </span>{" "}
                        in the right-hand side menu to clear them and move forward to completion.
                      </p>
                      <div
                        className="mt-4 flex items-center gap-2 text-[13px]"
                        style={{ color: "hsl(222 15% 50%)", fontFamily: "'DM Sans', system-ui, sans-serif" }}
                      >
                        <ArrowRight size={14} strokeWidth={2} />
                        <span>Awaiting your review — I'll stand by.</span>
        </div>

        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                centerScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="absolute bottom-8 right-8 z-30 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{
                background: "hsl(0 0% 100%)",
                border: "1.5px solid hsl(220 20% 88%)",
                boxShadow: "0 4px 16px hsl(222 30% 20% / 0.12)",
                color: "hsl(209 71% 38%)",
              }}
              title="Scroll to top"
            >
              <ArrowUp size={18} strokeWidth={2.2} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* RHS Engagement File Progress */}
      <motion.aside
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1, width: rhsCollapsed ? RHS_COLLAPSED : rhsWidth }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        className="shrink-0 overflow-y-auto relative"
        style={{
          background: "hsl(0 0% 100%)",
          borderLeft: "1px solid hsl(220 20% 90%)",
        }}
      >
        {/* Collapsed rail */}
        {rhsCollapsed ? (
          <div className="h-full flex flex-col items-center pt-4 gap-3">
            <button
              type="button"
              onClick={() => {
                setPreviewChecklist(null);
                setPreviewLetter(null);
                  setPreviewFinancialStatement(null);
                setRhsCollapsed(false);
              }}
              title="Open Engagement File Progress"
              aria-label="Open Engagement File Progress"
              className="w-8 h-8 rounded-[10px] flex items-center justify-center transition-colors hover:bg-[hsl(220_20%_94%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(265_75%_55%)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              style={{ border: "1px solid hsl(220 20% 88%)", background: "hsl(0 0% 100%)", color: "hsl(222 25% 30%)" }}
            >
              <PanelRightOpen size={14} strokeWidth={2.2} />
            </button>
            <div className="flex-1 flex items-start justify-center pt-2">
              <span
                className="text-[13px] font-semibold tracking-[0.18em] uppercase"
                style={{
                  color: "hsl(222 25% 35%)",
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  fontFamily: "'Rajdhani', system-ui, sans-serif",
                }}
              >
                <ListChecks size={12} className="inline mr-1.5 -mt-0.5" />
                Engagement File Progress
              </span>
            </div>
          </div>
        ) : (
        <>
        {/* Resize handle */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
          className="absolute top-0 left-0 h-full w-1.5 -translate-x-1/2 cursor-col-resize z-10 group"
          style={{ background: "transparent" }}
        >
          <div
            className="h-full w-px mx-auto transition-colors"
            style={{
              background: isResizing ? "hsl(209 71% 38%)" : "transparent",
            }}
          />
          <div
            className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "hsl(209 71% 38%)" }}
          />
        </div>

        {/* Lock overlay — blocks interactions until automation completes */}
        <AnimatePresence>
          {lockPhase !== "gone" && (
            <motion.div
              key="lock-overlay"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              onMouseEnter={() => setLockHovered(true)}
              onMouseLeave={() => setLockHovered(false)}
              className="absolute inset-0 z-20"
              style={{
                cursor: lockPhase === "locked" ? "not-allowed" : "default",
                background:
                  lockHovered && lockPhase === "locked"
                    ? "hsl(0 0% 100% / 0.55)"
                    : "transparent",
                backdropFilter:
                  lockHovered && lockPhase === "locked" ? "blur(1px)" : "none",
                transition: "background 0.25s ease, backdrop-filter 0.25s ease",
              }}
            >
              <AnimatePresence mode="wait">
                {(lockHovered || lockPhase === "unlocking") && (
                  <div
                    className="fixed pointer-events-none z-10"
                    style={{
                      top: "50vh",
                      right: `${rhsWidth / 2}px`,
                      transform: "translate(50%, -50%)",
                    }}
                  >
                    <motion.div
                      key={lockPhase}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ type: "spring", stiffness: 320, damping: 22 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{
                          background: "hsl(220 20% 96%)",
                          border: "1px solid hsl(220 20% 88%)",
                          boxShadow: "0 4px 14px hsl(222 30% 20% / 0.08)",
                        }}
                      >
                        {lockPhase === "unlocking" ? (
                          <motion.div
                            initial={{ rotate: -12 }}
                            animate={{ rotate: 0 }}
                            transition={{ type: "spring", stiffness: 260, damping: 18 }}
                          >
                            <LockKeyhole size={20} style={{ color: "hsl(145 63% 42%)" }} strokeWidth={2} />
                          </motion.div>
                        ) : (
                          <Lock size={20} style={{ color: "hsl(222 25% 35%)" }} strokeWidth={2} />
                        )}
                      </div>
                      <span
                        className="text-[13px] font-semibold px-2 py-0.5 rounded-full text-center"
                        style={{
                          background: "hsl(0 0% 100%)",
                          color:
                            lockPhase === "unlocking"
                              ? "hsl(145 63% 35%)"
                              : "hsl(222 25% 35%)",
                          border: "1px solid hsl(220 20% 88%)",
                          fontFamily: "'DM Sans', system-ui, sans-serif",
                        }}
                      >
                        {lockPhase === "unlocking" ? "File unlocked" : "Locked while Luka works"}
                      </span>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-[16px] font-bold"
              style={{ color: "hsl(222 35% 14%)", fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              Engagement File Progress
            </span>
            <button
              type="button"
              onClick={() => setRhsCollapsed(true)}
              title="Close panel"
              aria-label="Close Engagement File Progress"
              className="w-6 h-6 rounded-[6px] flex items-center justify-center transition-colors hover:bg-[hsl(220_20%_94%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(265_75%_55%)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              style={{ color: "hsl(222 25% 35%)" }}
            >
              <X size={14} strokeWidth={2.2} />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-4 text-[14px]" style={{ borderBottom: "1px solid hsl(220 20% 90%)" }}>
            <button
              type="button"
              onClick={() => setActiveTab("file")}
              className="pb-2 font-semibold"
              style={{
                color: activeTab === "file" ? "hsl(222 35% 10%)" : "hsl(222 15% 50%)",
                borderBottom: activeTab === "file" ? "2px solid hsl(207 71% 38%)" : "2px solid transparent",
              }}
            >
              File
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("documents")}
              className="pb-2 font-semibold flex items-center gap-1.5"
              style={{
                color: activeTab === "documents" ? "hsl(222 35% 10%)" : "hsl(222 15% 50%)",
                borderBottom: activeTab === "documents" ? "2px solid hsl(207 71% 38%)" : "2px solid transparent",
              }}
            >
              Documents
              <span
                className="px-1.5 py-0.5 rounded-full text-[12px]"
                style={{ background: "hsl(210 100% 95%)", color: "hsl(210 80% 35%)" }}
              >
                8
              </span>
            </button>
          </div>
        </div>

        {activeTab === "documents" ? (
          <DocumentsTab />
        ) : (
        <div className="px-3 pb-6">


          {rhsGroupsState.map((g, gi) => (
            <div key={gi} className="mt-2">
              <div
                className="flex items-center justify-between px-3 py-2"
                style={{ borderTop: "1px solid hsl(220 20% 92%)" }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[13px] font-bold tracking-wider"
                    style={{ color: "hsl(222 30% 22%)" }}
                  >
                    {g.title}
                  </span>
                  <AnimatePresence>
                    {!allDone && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Lock size={10} style={{ color: "hsl(222 15% 55%)" }} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <ChevronDown size={13} style={{ color: "hsl(222 15% 55%)" }} />
              </div>
              <div className="flex flex-col">
                <AnimatePresence initial={false}>
                  {g.items.map((it, ii) =>
                    it.visible ? (
                      <motion.div
                        key={ii}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        onClick={() => {
                          if (!allDone) return;
                          if (it.label === "Populate Checklists") {
                            setActiveView("populate-checklists");
                          } else if (it.label === "Generate Letters") {
                            setActiveView("generate-letters");
                          } else if (it.label === "Mapping TB") {
                            setActiveView("mapping-tb");
                          } else if (it.label === "Proposed Adj. Entries") {
                            setActiveView("proposed-adj-entries");
                          } else if (it.label === "Financial Statements Generation") {
                            setActiveView("financial-statements");
                          } else if (it.label === "Notes Generator") {
                            setActiveView("notes-generator");
                          } else if (it.label === "Inspection File Status Checklist") {
                            setActiveView("inspection-checklist");
                          } else if (it.label === "Capital Asset Amortization") {
                            setActiveView("capital-asset-amortization");
                          } else if (it.label === "Aged AR Analysis") {
                            setActiveView("aged-ar-analysis");
                          } else if (it.label === "Final Signoffs") {
                            setActiveView("final-signoffs");
                          } else if (it.label === "Completion & Archive") {
                            setActiveView("completion-archive");
                          } else if (it.label === "Dispatching FS Package Delivery") {
                            setActiveView("dispatch-package");
                          }
                        }}
                        className={`group flex items-center gap-2 px-3 py-2 rounded-[8px] min-w-0 ${
                          (allDone && (it.label === "Populate Checklists" || it.label === "Generate Letters" || it.label === "Mapping TB" || it.label === "Proposed Adj. Entries" || it.label === "Financial Statements Generation" || it.label === "Notes Generator" || it.label === "Inspection File Status Checklist" || it.label === "Capital Asset Amortization" || it.label === "Aged AR Analysis")) || it.label === "Final Signoffs" || it.label === "Completion & Archive" || it.label === "Dispatching FS Package Delivery"
                            ? "cursor-pointer hover:bg-[hsl(220_20%_94%)]"
                            : ""
                        } ${
                          (activeView === "populate-checklists" && it.label === "Populate Checklists") ||
                          (activeView === "generate-letters" && it.label === "Generate Letters") ||
                          (activeView === "mapping-tb" && it.label === "Mapping TB") ||
                          (activeView === "proposed-adj-entries" && it.label === "Proposed Adj. Entries") ||
                          (activeView === "financial-statements" && it.label === "Financial Statements Generation") ||
                          (activeView === "notes-generator" && it.label === "Notes Generator") ||
                          (activeView === "inspection-checklist" && it.label === "Inspection File Status Checklist") ||
                          (activeView === "capital-asset-amortization" && it.label === "Capital Asset Amortization") ||
                          (activeView === "aged-ar-analysis" && it.label === "Aged AR Analysis") ||
                          (activeView === "final-signoffs" && it.label === "Final Signoffs") ||
                          (activeView === "completion-archive" && it.label === "Completion & Archive") ||
                          (activeView === "dispatch-package" && it.label === "Dispatching FS Package Delivery")
                            ? "bg-[hsl(265_60%_96%)]"
                            : ""
                        }`}
                      >
                        <motion.span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            background:
                              it.status === "done"
                                ? "hsl(145 63% 45%)"
                                : it.status === "pending"
                                ? "hsl(30 95% 55%)"
                                : "hsl(220 15% 75%)",
                          }}
                          animate={
                            it.status === "pending"
                              ? {
                                  boxShadow: [
                                    "0 0 0px hsl(30 95% 55% / 0)",
                                    "0 0 6px hsl(30 95% 55% / 0.7)",
                                    "0 0 0px hsl(30 95% 55% / 0)",
                                  ],
                                }
                              : undefined
                          }
                          transition={{ duration: 1.6, repeat: Infinity }}
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className="flex-1 min-w-0 truncate text-[14.5px] leading-snug"
                              style={{
                                color: "hsl(222 25% 28%)",
                                fontFamily: "'DM Sans', system-ui, sans-serif",
                              }}
                            >
                              {it.label}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={6}>
                            {it.label}
                          </TooltipContent>
                        </Tooltip>
                        {assignments[it.label] && (() => {
                          const m = TEAM_MEMBERS.find((tm) => tm.name === assignments[it.label]);
                          if (!m) return null;
                          return (
                            <span
                              title={`Assigned to ${m.name}`}
                              className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold"
                              style={{ background: m.color, color: "hsl(0 0% 100%)", fontFamily: "'DM Sans', system-ui, sans-serif" }}
                            >
                              {m.initials}
                            </span>
                          );
                        })()}
                        <div className="relative shrink-0" data-thread-menu>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenThreadMenu(openThreadMenu === it.label ? null : it.label);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-[hsl(220_20%_90%)]"
                            style={{ color: "hsl(222 25% 35%)" }}
                            aria-label="Thread actions"
                          >
                            <MoreVertical size={13} strokeWidth={2.2} />
                          </button>
                          <AnimatePresence>
                            {openThreadMenu === it.label && (
                              <motion.div
                                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                                transition={{ duration: 0.14 }}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1 z-40 min-w-[200px] py-1 rounded-[10px]"
                                style={{
                                  background: "hsl(0 0% 100%)",
                                  border: "1px solid hsl(220 20% 88%)",
                                  boxShadow: "0 8px 24px hsl(222 30% 20% / 0.14)",
                                  fontFamily: "'DM Sans', system-ui, sans-serif",
                                }}
                              >
                                <div
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-bold tracking-wider uppercase"
                                  style={{ color: "hsl(222 15% 50%)" }}
                                >
                                  <UserPlus size={11} strokeWidth={2.4} />
                                  Assign to team member
                                </div>
                                <div style={{ borderTop: "1px solid hsl(220 20% 92%)" }} />
                                {TEAM_MEMBERS.map((m) => {
                                  const selected = assignments[it.label] === m.name;
                                  return (
                                    <button
                                      key={m.name}
                                      type="button"
                                      onClick={() => {
                                        setAssignments((prev) => {
                                          const next = { ...prev };
                                          if (selected) delete next[it.label];
                                          else next[it.label] = m.name;
                                          return next;
                                        });
                                        setOpenThreadMenu(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-[14.5px] leading-snug hover:bg-[hsl(220_20%_96%)] min-w-0"
                                      style={{ color: "hsl(222 25% 25%)" }}
                                    >
                                      <span
                                        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold shrink-0"
                                        style={{ background: m.color, color: "hsl(0 0% 100%)" }}
                                      >
                                        {m.initials}
                                      </span>
                                      <span className="flex-1 min-w-0 truncate text-left">{m.name}</span>
                                      {selected && <Check size={12} style={{ color: "hsl(145 60% 38%)" }} strokeWidth={2.4} />}
                                    </button>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ) : null
                  )}
                </AnimatePresence>
                {g.items.every((it) => it.visible) && (
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-1.5 text-[14px] font-medium hover:bg-[hsl(220_20%_94%)] transition-colors rounded-[8px]"
                    style={{ color: "hsl(209 71% 38%)" }}
                  >
                    <Plus size={11} strokeWidth={2.4} />
                    <span>New Thread</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
        </>
        )}
      </motion.aside>

      {/* Checklist preview panel (slides from RHS, sits to the right of the collapsed Engagement File Progress rail) */}
      <AnimatePresence initial={false}>
        {previewChecklist && (
          <ChecklistPreviewPanel
            key="checklist-preview"
            title={previewChecklist}
            onClose={closeChecklistPreview}
          />
        )}
      </AnimatePresence>

      {/* Letter preview panel — same animation/styling as checklist preview */}
      <AnimatePresence initial={false}>
        {previewLetter && (
          <LetterPreviewPanel
            key="letter-preview"
            title={previewLetter}
            onClose={closeLetterPreview}
          />
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {previewFinancialStatement && (
          <FinancialStatementPreview
            key="financial-statement-preview"
            section={previewFinancialStatement}
            onBack={closeFinancialStatementPreview}
          />
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {previewNote && (
          <NotesPreviewPanel
            key="note-preview"
            title={previewNote}
            onClose={closeNotePreview}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EngagementAutomationView;
