import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Copy,
  Download,
  Archive,
  Share2,
  RefreshCw,
} from "lucide-react";
import lukaIdle from "@/assets/luka-idle.gif";
import BottomPrompter from "./BottomPrompter";

const FONT = "'DM Sans', system-ui, sans-serif";
const STORAGE_KEY = "inspection-checklist-checked-v1";

type ItemStatus = "passed" | "review" | "queued";

interface ChecklistItem {
  title: React.ReactNode;
  detail?: string;
  status: ItemStatus;
}

interface ChecklistSection {
  label: string;
  items: ChecklistItem[];
}

const SECTIONS: ChecklistSection[] = [
  {
    label: "Engagement Setup",
    items: [
      { title: "Initiated Luka inspection scan for CSRS 4200", status: "passed" },
      {
        title: (
          <>
            Verified engagement letter on file, signed & dated <strong>before</strong> work commenced
          </>
        ),
        detail: "EL-2025-ML.pdf · signed 2025-01-08 · work start 2025-01-12",
        status: "passed",
      },
      {
        title: (
          <>
            Confirmed engagement letter references <strong>CSRS 4200</strong> (not Section 9200)
          </>
        ),
        status: "passed",
      },
      { title: "Documented intended use & third-party reliance assessment", status: "passed" },
      { title: "Independence threats reviewed — no safeguards required", status: "passed" },
    ],
  },
  {
    label: "Entity Knowledge & Documentation",
    items: [
      {
        title: "Captured knowledge of the entity (CSRS 4200 §25): operations, accounting system, basis of accounting",
        status: "passed",
      },
      { title: "Reconciled adjusting entries & trial balance to compiled financial information", status: "passed" },
    ],
  },
  {
    label: "Review & Notes",
    items: [
      {
        title: "Reviewed basis-of-accounting note for completeness & ASPE claim",
        detail:
          "Note 1 claims ASPE — Luka could not locate a cash flow statement. May need to disclose as special-purpose basis.",
        status: "review",
      },
      { title: "Validated Compilation Engagement Report title & CSRS 4200 illustrative wording", status: "passed" },
      {
        title: "Checked report dating vs. completion & management acknowledgement",
        detail:
          "Report dated 2026-02-14; management acknowledgement email received 2026-02-16. Date precedes acknowledgement.",
        status: "review",
      },
    ],
  },
  {
    label: "Cross-Reference & Sign-offs",
    items: [
      { title: "Confirmed each FS page cross-references the Compilation Engagement Report", status: "passed" },
      { title: "Preparer & partner sign-offs detected with timestamps", status: "passed" },
      {
        title: "Verified file assembly window (60 days per CSQM 1)",
        detail: "Report dated 2026-02-14 · current day 28 of 60 · on track.",
        status: "review",
      },
    ],
  },
  {
    label: "Final Checks",
    items: [
      {
        title: "Scanned for top-deficiency patterns (Notice to Reader wording, false ASPE claims, missing safeguards…)",
        status: "queued",
      },
      { title: "Completion & partner sign-off package", status: "queued" },
    ],
  },
];

const FLAT_ITEMS = SECTIONS.flatMap((s) => s.items);
const TOTAL_ITEMS = FLAT_ITEMS.length;

const statusDot = (s: ItemStatus) =>
  s === "passed" ? "hsl(165 75% 42%)" : s === "review" ? "hsl(28 95% 55%)" : "hsl(220 15% 75%)";

function loadChecked(): boolean[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === TOTAL_ITEMS) return parsed;
    }
  } catch {
    // ignore
  }
  // Default: auto-check passed items, leave review/queued unchecked
  return FLAT_ITEMS.map((i) => i.status === "passed");
}

function saveChecked(arr: boolean[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

const InspectionChecklistView = () => {
  const [expanded, setExpanded] = useState(true);
  const [checked, setChecked] = useState<boolean[]>(() => loadChecked());
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 80);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    saveChecked(checked);
  }, [checked]);

  const toggleItem = (globalIdx: number) => {
    setChecked((prev) => {
      const next = [...prev];
      next[globalIdx] = !next[globalIdx];
      return next;
    });
  };

  const checkedCount = checked.filter(Boolean).length;
  const progress = TOTAL_ITEMS > 0 ? checkedCount / TOTAL_ITEMS : 0;

  const passed = FLAT_ITEMS.filter((i) => i.status === "passed").length + 2;
  const review = FLAT_ITEMS.filter((i) => i.status === "review").length;
  const completed = FLAT_ITEMS.filter((i) => i.status !== "queued").length;

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 w-full max-w-full md:max-w-[92%] lg:max-w-[960px] mx-auto px-6 py-8 transition-all duration-500 ease-out">
        <div className="flex items-start gap-4">
          <div className="shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center">
            <img src={lukaIdle} alt="Luka" className="w-8 h-8 object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-[15px] leading-relaxed"
              style={{ color: "hsl(222 35% 16%)", fontFamily: FONT }}
            >
              I've generated your{" "}
              <strong style={{ color: "hsl(222 35% 14%)" }}>
                CSRS 4200 Inspection compilation completion checklist
              </strong>{" "}
              based on the latest CPA Canada standards and your past engagements. Each item is
              mapped to the applicable CSRS 4200 paragraph.
            </p>

            {/* Sparkle note */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="mt-4 flex items-center gap-2 px-3.5 py-2.5 rounded-[12px]"
              style={{
                background: "linear-gradient(135deg, hsl(265 60% 97%) 0%, hsl(220 60% 98%) 100%)",
                border: "1px dashed hsl(265 40% 85%)",
              }}
            >
              <Sparkles size={14} strokeWidth={2} style={{ color: "hsl(265 70% 55%)" }} />
              <span
                className="text-[13px] italic"
                style={{ color: "hsl(222 25% 28%)", fontFamily: FONT }}
              >
                If anything changes afterwards, I'll flag it for re-review so your file stays
                defensible at issuance.
              </span>
            </motion.div>

            {/* File Status card */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="mt-3 p-4 rounded-[16px]"
              style={{
                background: "linear-gradient(180deg, hsl(38 100% 97%) 0%, hsl(0 0% 100%) 60%)",
                border: "1px solid hsl(220 20% 92%)",
              }}
            >
              <p
                className="text-[12.5px] font-medium mb-3"
                style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
              >
                File Status
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: passed, label: "Passed" },
                  { value: review, label: "Needs Review" },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="px-4 py-3 rounded-[12px]"
                    style={{
                      background: "hsl(0 0% 100%)",
                      border: "1px solid hsl(220 20% 92%)",
                    }}
                  >
                    <p
                      className="text-[22px] font-bold leading-none"
                      style={{ color: "hsl(222 35% 14%)", fontFamily: FONT }}
                    >
                      {m.value}
                    </p>
                    <p
                      className="mt-1.5 text-[12px]"
                      style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
                    >
                      {m.label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Inspection Checklist accordion */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mt-3 rounded-[16px] overflow-hidden"
              style={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 20% 92%)" }}
            >
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-[hsl(220_30%_98%)]"
                style={{ background: "hsl(220 40% 98%)" }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="text-[14px] font-bold shrink-0"
                    style={{ color: "hsl(222 35% 14%)", fontFamily: FONT }}
                  >
                    Inspection Checklist
                  </span>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0"
                    style={{
                      background: "hsl(265 60% 95%)",
                      color: "hsl(265 70% 45%)",
                      border: "1px solid hsl(265 40% 88%)",
                    }}
                  >
                    {checkedCount}/{TOTAL_ITEMS}
                  </span>
                </div>
                <motion.div animate={{ rotate: expanded ? 0 : -90 }} transition={{ duration: 0.25 }}>
                  <ChevronDown size={16} style={{ color: "hsl(222 25% 35%)" }} strokeWidth={2.2} />
                </motion.div>
              </button>

              {/* Subtle overall progress bar */}
              <div className="w-full h-[3px] bg-[hsl(220_20%_94%)] overflow-hidden">
                <motion.div
                  className="h-full"
                  style={{ background: "hsl(145 63% 42%)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>

              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <div>
                      {SECTIONS.map((section, secIdx) => {
                        const offset = SECTIONS.slice(0, secIdx).reduce((a, s) => a + s.items.length, 0);
                        const secChecked = section.items.filter((_, i) => checked[offset + i]).length;
                        const secTotal = section.items.length;
                        const secComplete = secChecked === secTotal && secTotal > 0;
                        const secPartial = secChecked > 0 && secChecked < secTotal;

                        return (
                          <div
                            key={secIdx}
                            style={{
                              borderTop: secIdx === 0 ? "none" : "1px solid hsl(220 20% 94%)",
                            }}
                          >
                            {/* Section header with badge */}
                            <div className="flex items-center justify-between px-4 py-2.5 bg-[hsl(220_40%_99%)]">
                              <span
                                className="text-[12.5px] font-semibold uppercase tracking-[0.04em]"
                                style={{ color: "hsl(222 20% 40%)", fontFamily: FONT }}
                              >
                                {section.label}
                              </span>
                              <span
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                                style={
                                  secComplete
                                    ? {
                                        background: "hsl(145 60% 95%)",
                                        color: "hsl(145 70% 35%)",
                                        border: "1px solid hsl(145 50% 85%)",
                                      }
                                    : secPartial
                                      ? {
                                          background: "hsl(38 100% 95%)",
                                          color: "hsl(28 85% 45%)",
                                          border: "1px solid hsl(38 90% 78%)",
                                        }
                                      : {
                                          background: "hsl(220 20% 96%)",
                                          color: "hsl(222 15% 55%)",
                                          border: "1px solid hsl(220 20% 90%)",
                                        }
                                }
                              >
                                {secComplete && <CheckCircle2 size={11} strokeWidth={2.4} />}
                                {secChecked}/{secTotal}
                              </span>
                            </div>

                            {/* Section items */}
                            <ul>
                              {section.items.map((it, itemIdx) => {
                                const globalIdx = offset + itemIdx;
                                const isChecked = checked[globalIdx];
                                return (
                                  <li
                                    key={itemIdx}
                                    className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[hsl(220_30%_98%)]"
                                    style={{
                                      borderTop: "1px solid hsl(220 20% 94%)",
                                    }}
                                    onClick={() => toggleItem(globalIdx)}
                                  >
                                    {/* Checkbox */}
                                    <div className="shrink-0 mt-0.5">
                                      <div
                                        className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center transition-colors"
                                        style={{
                                          border: isChecked
                                            ? "1.5px solid hsl(145 63% 42%)"
                                            : "1.5px solid hsl(220 20% 80%)",
                                          background: isChecked ? "hsl(145 63% 42%)" : "transparent",
                                        }}
                                      >
                                        {isChecked && (
                                          <motion.svg
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            width="12"
                                            height="12"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="white"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <polyline points="20 6 9 17 4 12" />
                                          </motion.svg>
                                        )}
                                      </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                      <p
                                        className="text-[13.5px] leading-snug"
                                        style={{
                                          color: it.status === "queued" && !isChecked
                                            ? "hsl(222 15% 55%)"
                                            : "hsl(222 30% 22%)",
                                          fontFamily: FONT,
                                          textDecoration: isChecked ? "line-through" : "none",
                                          opacity: isChecked ? 0.55 : 1,
                                          transition: "opacity 0.2s ease",
                                        }}
                                      >
                                        {it.title}
                                      </p>
                                      {it.detail && (
                                        <p
                                          className="mt-1 text-[12.5px]"
                                          style={{
                                            color: "hsl(222 15% 50%)",
                                            fontFamily: FONT,
                                            opacity: isChecked ? 0.5 : 1,
                                            transition: "opacity 0.2s ease",
                                          }}
                                        >
                                          {it.detail}
                                        </p>
                                      )}
                                    </div>

                                    {/* Status icon */}
                                    <div className="shrink-0 self-start mt-0.5">
                                      {it.status === "passed" && !isChecked && (
                                        <CheckCircle2
                                          size={16}
                                          strokeWidth={2}
                                          style={{ color: "hsl(145 63% 45%)" }}
                                        />
                                      )}
                                      {it.status === "review" && !isChecked && (
                                        <span
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                                          style={{
                                            background: "hsl(38 100% 95%)",
                                            color: "hsl(28 85% 45%)",
                                            border: "1px solid hsl(38 90% 78%)",
                                          }}
                                        >
                                          <AlertCircle size={11} strokeWidth={2.4} />1 Needs Review
                                        </span>
                                      )}
                                      {it.status === "queued" && !isChecked && (
                                        <span
                                          className="text-[11px] italic"
                                          style={{ color: "hsl(222 15% 55%)", fontFamily: FONT }}
                                        >
                                          queued
                                        </span>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Luka summary card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.45 }}
              className="mt-3 flex items-start gap-4 p-5 rounded-[16px]"
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
                  style={{ color: "hsl(222 35% 14%)", fontFamily: FONT }}
                >
                  Luka
                </p>
                <p
                  className="mt-2 text-[13.5px] leading-relaxed"
                  style={{ color: "hsl(222 25% 25%)", fontFamily: FONT }}
                >
                  I finished the CSRS 4200 inspection sweep. There are 2 items that require your
                  review before this file can be marked as inspection-ready. Please check the top
                  checklist with{" "}
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold align-middle"
                    style={{
                      background: "hsl(220 30% 96%)",
                      border: "1px solid hsl(220 25% 90%)",
                      color: "hsl(222 35% 18%)",
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: "hsl(28 95% 55%)" }} />
                    flagged Items
                  </span>{" "}
                  to address them and proceed to completion.
                </p>

                {/* Disclaimer */}
                <div
                  className="mt-4 p-3.5 rounded-[12px]"
                  style={{
                    background: "hsl(0 0% 100%)",
                    border: "1px solid hsl(220 20% 92%)",
                  }}
                >
                  <p
                    className="text-[12.5px] leading-relaxed"
                    style={{ color: "hsl(222 25% 30%)", fontFamily: FONT }}
                  >
                    <strong style={{ color: "hsl(222 35% 14%)" }}>Disclaimer</strong> — Luka assists
                    with inspection-readiness based on file evidence and CSRS 4200 / CSQM 1
                    guidance. It does <strong>not</strong> replace professional judgment, CPA
                    provincial body requirements, or your firm's quality management system. The
                    engagement partner remains responsible for the file.
                  </p>
                </div>

                <div
                  className="mt-4 flex items-center gap-2 text-[12.5px]"
                  style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
                >
                  <ArrowRight size={13} strokeWidth={2} />
                  <span>Awaiting your review — I'll stand by.</span>
                </div>
              </div>
            </motion.div>

            {/* Action toolbar */}
            <div className="mt-4 flex items-center gap-2">
              {[Copy, Download, Archive, Share2, RefreshCw].map((Icon, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[hsl(220_20%_94%)]"
                  style={{
                    border: "1px solid hsl(220 20% 88%)",
                    background: "hsl(0 0% 100%)",
                    color: "hsl(222 25% 30%)",
                  }}
                >
                  <Icon size={13} strokeWidth={2.2} />
                </button>
              ))}
            </div>

            <p className="mt-3 text-[11px]" style={{ color: "hsl(222 15% 55%)", fontFamily: FONT }}>
              9:02 AM
            </p>
            <div ref={bottomRef} aria-hidden style={{ height: 1 }} />
          </div>
        </div>
      </div>
      <BottomPrompter placeholder="Ask Luka about the inspection checklist..." />
    </div>
  );
};

export default InspectionChecklistView;
