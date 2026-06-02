import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  CheckCircle2,
  Circle,
  Sparkles,
  Shield,
  FileText,
  Briefcase,
  ClipboardList,
  Archive,
  Undo2,
  Lock,
  type LucideIcon,
} from "lucide-react";
import lukaIdle from "@/assets/luka-idle.gif";
import BottomPrompter from "./BottomPrompter";

const FONT = "'DM Sans', system-ui, sans-serif";
const MONO = "'Share Tech Mono', 'DM Sans', monospace";

type Role = "preparer" | "reviewer";

interface Persona {
  id: Role;
  name: string;
  role: string;
  initials: string;
  color: string; // hsl
}

const PERSONAS: Record<Role, Persona> = {
  preparer: {
    id: "preparer",
    name: "Ayesha Naaz",
    role: "Preparer",
    initials: "AN",
    color: "145 55% 42%",
  },
  reviewer: {
    id: "reviewer",
    name: "Falah Naeem",
    role: "1st Reviewer",
    initials: "FN",
    color: "265 75% 55%",
  },
};

interface Item {
  label: string;
}
interface Section {
  key: string;
  title: string;
  icon: LucideIcon;
  items: Item[];
}

const SECTIONS: Section[] = [
  {
    key: "onboarding",
    title: "Client Onboarding",
    icon: Briefcase,
    items: [
      { label: "Client acceptance and continuance" },
      { label: "Independence" },
      { label: "Knowledge of client business" },
      { label: "Management responsibility and acknowledgement" },
      { label: "Planning" },
      { label: "Engagement Letter" },
      { label: "Compilation Queries" },
      { label: "Special Checklist" },
    ],
  },
  {
    key: "documents",
    title: "Documents",
    icon: FileText,
    items: [
      { label: "Shareholders Agreements" },
      { label: "Rental/Lease Agreements" },
      { label: "Incorporation Documents" },
      { label: "Banking Agreements" },
      { label: "AI Preparer Documents" },
    ],
  },
  {
    key: "tb",
    title: "Trial Balance & Adjusting Entries",
    icon: ClipboardList,
    items: [{ label: "Trial Balance & Adjusting entries" }],
  },
  {
    key: "procedures",
    title: "Procedures",
    icon: Shield,
    items: [
      { label: "Assets — Cash and cash equivalents" },
      { label: "Assets — Accounts receivable" },
      { label: "Assets — Inventories" },
      { label: "Assets — Short-term investments" },
      { label: "Assets — Loans and notes receivable" },
      { label: "Property, plant and equipment" },
      { label: "Long-term assets" },
      { label: "Liabilities — Accounts payable" },
      { label: "Liabilities — Taxes payable" },
      { label: "Long-term liabilities" },
      { label: "Equity — Share capital" },
      { label: "Revenue" },
      { label: "Cost of sales" },
      { label: "Operating expenses" },
      { label: "Other Income (Expenses)" },
    ],
  },
  {
    key: "fs",
    title: "Financial Statements",
    icon: FileText,
    items: [
      { label: "Cover Page" },
      { label: "Table of Contents" },
      { label: "Compilation Report" },
      { label: "Balance Sheet" },
      { label: "Statement of Income and Retained Earnings" },
      { label: "Statement of Cash Flows" },
      { label: "Notes to Financial Information" },
      { label: "Schedule 1 — Cash and cash equivalents" },
      { label: "Schedule 2 — Accounts receivable" },
    ],
  },
  {
    key: "completion",
    title: "Completion & Signoffs",
    icon: Archive,
    items: [{ label: "Completion" }, { label: "Final Review" }],
  },
];

interface Signoff {
  by: Role;
  at: Date;
}
type SignoffMap = Record<string, Record<Role, Signoff | null>>;

const cellKey = (sectionKey: string, idx: number) => `${sectionKey}::${idx}`;

const formatTimestamp = (d: Date) =>
  d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const Avatar = ({ persona, size = 24 }: { persona: Persona; size?: number }) => (
  <div
    className="rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
    style={{
      width: size,
      height: size,
      background: `hsl(${persona.color})`,
      color: "hsl(0 0% 100%)",
      fontFamily: FONT,
    }}
    aria-label={persona.name}
  >
    {persona.initials}
  </div>
);

const SignoffPill = ({
  signoff,
  persona,
  onUndo,
}: {
  signoff: Signoff;
  persona: Persona;
  onUndo: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: "spring", stiffness: 360, damping: 24 }}
    className="group inline-flex items-center gap-2 pl-1 pr-2 py-1 rounded-[10px]"
    style={{
      background: `hsl(${persona.color} / 0.08)`,
      border: `1px solid hsl(${persona.color} / 0.25)`,
    }}
  >
    <Avatar persona={persona} size={20} />
    <div className="flex flex-col leading-tight">
      <span
        className="text-[11.5px] font-semibold"
        style={{ color: "hsl(222 35% 16%)", fontFamily: FONT }}
      >
        {persona.name}
      </span>
      <span
        className="text-[10px]"
        style={{ color: "hsl(222 15% 50%)", fontFamily: MONO }}
      >
        {formatTimestamp(signoff.at)}
      </span>
    </div>
    <button
      type="button"
      onClick={onUndo}
      title="Undo signoff"
      aria-label="Undo signoff"
      className="ml-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity rounded-[6px] p-1 hover:bg-[hsl(0_0%_100%)] focus-visible:outline-none focus-visible:ring-2"
      style={{ color: "hsl(222 25% 35%)" }}
    >
      <Undo2 size={11} strokeWidth={2.2} />
    </button>
  </motion.div>
);

const SignButton = ({
  persona,
  onClick,
}: {
  persona: Persona;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-[11.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2"
    style={{
      background: "hsl(0 0% 100%)",
      border: `1px dashed hsl(${persona.color} / 0.45)`,
      color: `hsl(${persona.color})`,
      fontFamily: FONT,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = `hsl(${persona.color} / 0.06)`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "hsl(0 0% 100%)";
    }}
  >
    <Circle size={11} strokeWidth={2.4} />
    Sign as {persona.role}
  </button>
);

const STORAGE_KEY = "final-signoffs-state-v1";

const loadPersisted = (): { signoffs: SignoffMap; activeRole: Role; openSections: Record<string, boolean>; lastSavedAt: number | null } | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const FinalSignoffsView = () => {
  const persisted = loadPersisted();
  const [signoffs, setSignoffs] = useState<SignoffMap>(persisted?.signoffs ?? {});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    persisted?.openSections ?? { [SECTIONS[0].key]: true }
  );
  const [activeRole, setActiveRole] = useState<Role>(persisted?.activeRole ?? "preparer");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(persisted?.lastSavedAt ?? null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    persisted ? "saved" : "idle"
  );
  const hasResumedRef = useRef<boolean>(!!persisted && Object.keys(persisted.signoffs ?? {}).length > 0);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    setSaveStatus("saving");
    const t = window.setTimeout(() => {
      try {
        const now = Date.now();
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ signoffs, activeRole, openSections, lastSavedAt: now })
        );
        setLastSavedAt(now);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("idle");
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [signoffs, activeRole, openSections]);

  const sign = (sectionKey: string, idx: number, role: Role) => {
    setSignoffs((prev) => {
      const k = cellKey(sectionKey, idx);
      return {
        ...prev,
        [k]: {
          ...(prev[k] ?? { preparer: null, reviewer: null }),
          [role]: { by: role, at: new Date() },
        },
      };
    });
  };

  const undo = (sectionKey: string, idx: number, role: Role) => {
    setSignoffs((prev) => {
      const k = cellKey(sectionKey, idx);
      if (!prev[k]) return prev;
      return {
        ...prev,
        [k]: { ...prev[k], [role]: null },
      };
    });
  };

  const signSection = (section: Section, role: Role) => {
    setSignoffs((prev) => {
      const next = { ...prev };
      section.items.forEach((_, idx) => {
        const k = cellKey(section.key, idx);
        next[k] = {
          ...(next[k] ?? { preparer: null, reviewer: null }),
          [role]: { by: role, at: new Date() },
        };
      });
      return next;
    });
  };

  const unsignSection = (section: Section, role: Role) => {
    setSignoffs((prev) => {
      const next = { ...prev };
      section.items.forEach((_, idx) => {
        const k = cellKey(section.key, idx);
        if (next[k]) next[k] = { ...next[k], [role]: null };
      });
      return next;
    });
  };

  const signAll = (role: Role) => {
    setSignoffs((prev) => {
      const next = { ...prev };
      SECTIONS.forEach((s) => {
        s.items.forEach((_, idx) => {
          const k = cellKey(s.key, idx);
          next[k] = {
            ...(next[k] ?? { preparer: null, reviewer: null }),
            [role]: { by: role, at: new Date() },
          };
        });
      });
      return next;
    });
  };

  const totals = useMemo(() => {
    let totalItems = 0;
    let preparerDone = 0;
    let reviewerDone = 0;
    let fullySigned = 0;
    SECTIONS.forEach((s) => {
      totalItems += s.items.length;
      s.items.forEach((_, idx) => {
        const cell = signoffs[cellKey(s.key, idx)];
        if (cell?.preparer) preparerDone += 1;
        if (cell?.reviewer) reviewerDone += 1;
        if (cell?.preparer && cell?.reviewer) fullySigned += 1;
      });
    });
    return { totalItems, preparerDone, reviewerDone, fullySigned };
  }, [signoffs]);

  const sectionStatus = (section: Section) => {
    let prep = 0;
    let rev = 0;
    let fully = 0;
    section.items.forEach((_, idx) => {
      const cell = signoffs[cellKey(section.key, idx)];
      if (cell?.preparer) prep += 1;
      if (cell?.reviewer) rev += 1;
      if (cell?.preparer && cell?.reviewer) fully += 1;
    });
    return { prep, rev, fully, total: section.items.length };
  };

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 w-full max-w-full md:max-w-[96%] lg:max-w-[1100px] mx-auto px-6 py-8 transition-all duration-500 ease-out">
        {/* Luka greeting */}
        <div className="flex items-start gap-4">
          <div className="shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center">
            <img src={lukaIdle} alt="Luka" className="w-8 h-8 object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-[15px] leading-relaxed"
              style={{ color: "hsl(222 35% 16%)", fontFamily: FONT }}
            >
              Let's wrap this engagement. I've prepared every section for your final review —
              sign off as you go and I'll stamp your name, date and time on each item.
            </p>

            {/* Master sheet card */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mt-5 rounded-[16px] overflow-hidden"
              style={{
                background:
                  "linear-gradient(180deg, hsl(265 80% 99%) 0%, hsl(0 0% 100%) 100%)",
                border: "1px solid hsl(220 30% 92%)",
                boxShadow: "0 6px 24px -12px hsl(265 60% 40% / 0.18)",
              }}
            >
              <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(265 75% 55%), hsl(220 90% 55%))",
                      color: "hsl(0 0% 100%)",
                    }}
                  >
                    <Sparkles size={16} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-[14px] font-semibold"
                      style={{ color: "hsl(222 35% 16%)", fontFamily: FONT }}
                    >
                      Signoffs Master Sheet
                    </p>
                    <p
                      className="text-[12px] flex items-center gap-2 flex-wrap"
                      style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
                    >
                      <span>{totals.totalItems} items across {SECTIONS.length} sections</span>
                      <span style={{ color: "hsl(220 10% 70%)" }}>·</span>
                      <span
                        className="inline-flex items-center gap-1"
                        style={{
                          color:
                            saveStatus === "saving"
                              ? "hsl(38 92% 45%)"
                              : "hsl(145 63% 38%)",
                          fontFamily: FONT,
                        }}
                      >
                        <span
                          className="inline-block rounded-full"
                          style={{
                            width: 6,
                            height: 6,
                            background:
                              saveStatus === "saving"
                                ? "hsl(38 92% 50%)"
                                : "hsl(145 63% 42%)",
                          }}
                        />
                        {saveStatus === "saving"
                          ? "Auto-saving…"
                          : lastSavedAt
                          ? `Saved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                          : "Auto-save on"}
                      </span>
                      {hasResumedRef.current && (
                        <>
                          <span style={{ color: "hsl(220 10% 70%)" }}>·</span>
                          <span style={{ color: "hsl(222 60% 45%)" }}>Resumed where you left off</span>
                        </>
                      )}
                    </p>

                  </div>
                </div>

                {/* Overall engagement progress */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: "hsl(222 25% 30%)", fontFamily: FONT }}
                      >
                        Engagement Progress
                      </span>
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: "hsl(222 25% 30%)", fontFamily: FONT }}
                      >
                        {totals.fullySigned}/{totals.totalItems}
                      </span>
                    </div>
                    <div
                      className="w-full h-2 rounded-full overflow-hidden"
                      style={{ background: "hsl(220 20% 92%)" }}
                      aria-hidden
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background:
                            "linear-gradient(90deg, hsl(145 63% 42%), hsl(145 55% 50%))",
                        }}
                        initial={false}
                        animate={{
                          width: totals.totalItems
                            ? `${(totals.fullySigned / totals.totalItems) * 100}%`
                            : "0%",
                        }}
                        transition={{ type: "spring", stiffness: 220, damping: 28 }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {(["preparer", "reviewer"] as Role[]).map((roleId) => {
                    const p = PERSONAS[roleId];
                    const done = roleId === "preparer" ? totals.preparerDone : totals.reviewerDone;
                    const pct = totals.totalItems
                      ? Math.round((done / totals.totalItems) * 100)
                      : 0;
                    const isActive = activeRole === roleId;
                    return (
                      <button
                        key={roleId}
                        type="button"
                        onClick={() => setActiveRole(roleId)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-[12px] transition-all focus-visible:outline-none focus-visible:ring-2"
                        style={{
                          background: isActive
                            ? `hsl(${p.color} / 0.08)`
                            : "hsl(0 0% 100%)",
                          border: isActive
                            ? `1px solid hsl(${p.color} / 0.4)`
                            : "1px solid hsl(220 20% 90%)",
                        }}
                      >
                        <Avatar persona={p} size={28} />
                        <div className="text-left">
                          <p
                            className="text-[12.5px] font-semibold leading-tight"
                            style={{ color: "hsl(222 35% 16%)", fontFamily: FONT }}
                          >
                            {p.name}
                          </p>
                          <p
                            className="text-[10.5px] leading-tight"
                            style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
                          >
                            {p.role} · {done}/{totals.totalItems} · {pct}%
                          </p>
                        </div>
                        <div
                          className="ml-1 w-16 h-1.5 rounded-full overflow-hidden"
                          style={{ background: "hsl(220 20% 92%)" }}
                          aria-hidden
                        >
                          <motion.div
                            className="h-full"
                            style={{ background: `hsl(${p.color})` }}
                            initial={false}
                            animate={{ width: `${pct}%` }}
                            transition={{ type: "spring", stiffness: 220, damping: 28 }}
                          />
                        </div>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => signAll(activeRole)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2"
                    style={{
                      background: `linear-gradient(135deg, hsl(${PERSONAS[activeRole].color}), hsl(${PERSONAS[activeRole].color} / 0.85))`,
                      color: "hsl(0 0% 100%)",
                      boxShadow: `0 4px 14px -4px hsl(${PERSONAS[activeRole].color} / 0.5)`,
                      fontFamily: FONT,
                    }}
                  >
                    <CheckCircle2 size={14} strokeWidth={2.4} />
                    Sign off all as {PERSONAS[activeRole].role}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Sections */}
            <div className="mt-5 space-y-3">
              {SECTIONS.map((section, sIdx) => {
                const isOpen = openSections[section.key] ?? false;
                const status = sectionStatus(section);
                const fullySigned =
                  status.prep === status.total && status.rev === status.total;
                const Icon = section.icon;
                return (
                  <motion.div
                    key={section.key}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: sIdx * 0.03 }}
                    className="rounded-[14px] overflow-hidden"
                    style={{
                      background: "hsl(0 0% 100%)",
                      border: "1px solid hsl(220 20% 90%)",
                      boxShadow: "0 1px 2px hsl(222 30% 20% / 0.03)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenSections((prev) => ({
                          ...prev,
                          [section.key]: !isOpen,
                        }))
                      }
                      className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[hsl(220_25%_98%)] focus-visible:outline-none focus-visible:ring-2"
                      aria-expanded={isOpen}
                    >
                      <div
                        className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
                        style={{
                          background: fullySigned
                            ? "hsl(145 60% 95%)"
                            : "hsl(265 60% 96%)",
                          color: fullySigned
                            ? "hsl(145 63% 38%)"
                            : "hsl(265 75% 50%)",
                        }}
                      >
                        {fullySigned ? (
                          <Lock size={14} strokeWidth={2.2} />
                        ) : (
                          <Icon size={14} strokeWidth={2.2} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2.5">
                          <p
                            className="text-[13.5px] font-semibold"
                            style={{ color: "hsl(222 35% 16%)", fontFamily: FONT }}
                          >
                            {section.title}
                          </p>
                          {/* Per-section completion badge */}
                          <span
                            className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-[6px]"
                            style={{
                              background:
                                status.fully === status.total
                                  ? "hsl(145 60% 95%)"
                                  : status.fully > 0
                                  ? "hsl(40 90% 95%)"
                                  : "hsl(220 20% 95%)",
                              color:
                                status.fully === status.total
                                  ? "hsl(145 63% 35%)"
                                  : status.fully > 0
                                  ? "hsl(35 80% 40%)"
                                  : "hsl(222 15% 55%)",
                              border:
                                status.fully === status.total
                                  ? "1px solid hsl(145 50% 88%)"
                                  : status.fully > 0
                                  ? "1px solid hsl(40 70% 85%)"
                                  : "1px solid hsl(220 20% 90%)",
                              fontFamily: FONT,
                            }}
                          >
                            {status.fully === status.total ? (
                              <CheckCircle2 size={10} strokeWidth={2.5} />
                            ) : null}
                            {status.fully}/{status.total} complete
                          </span>
                        </div>
                        <p
                          className="text-[11.5px] mt-0.5"
                          style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
                        >
                          Preparer {status.prep}/{status.total} · Reviewer {status.rev}/
                          {status.total}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {(["preparer", "reviewer"] as Role[]).map((r) => {
                          const p = PERSONAS[r];
                          const count = r === "preparer" ? status.prep : status.rev;
                          const allDone = count === status.total;
                          return (
                            <span
                              key={r}
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                allDone
                                  ? unsignSection(section, r)
                                  : signSection(section, r);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  allDone
                                    ? unsignSection(section, r)
                                    : signSection(section, r);
                                }
                              }}
                              className="text-[11px] font-semibold px-2.5 py-1 rounded-[8px] cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2"
                              style={{
                                background: allDone
                                  ? "hsl(0 70% 96%)"
                                  : `hsl(${p.color} / 0.1)`,
                                color: allDone ? "hsl(0 70% 45%)" : `hsl(${p.color})`,
                                border: allDone
                                  ? "1px solid hsl(0 70% 88%)"
                                  : `1px solid hsl(${p.color} / 0.25)`,
                                fontFamily: FONT,
                              }}
                            >
                              {allDone ? "Unsign" : "Signoff"} · {p.role}
                            </span>
                          );
                        })}

                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="ml-1"
                          style={{ color: "hsl(222 15% 45%)" }}
                        >
                          <ChevronDown size={16} strokeWidth={2} />
                        </motion.div>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          style={{ overflow: "hidden" }}
                        >
                          <div
                            style={{
                              borderTop: "1px solid hsl(220 20% 93%)",
                              background: "hsl(220 25% 99%)",
                            }}
                          >
                            {section.items.map((item, iIdx) => {
                              const cell = signoffs[cellKey(section.key, iIdx)];
                              return (
                                <div
                                  key={iIdx}
                                  className="px-4 py-3 flex items-center gap-3 flex-wrap"
                                  style={{
                                    borderBottom:
                                      iIdx === section.items.length - 1
                                        ? "none"
                                        : "1px solid hsl(220 20% 93%)",
                                  }}
                                >
                                  <div className="flex-1 min-w-[200px] flex items-center gap-2">
                                    <span
                                      className="w-1.5 h-1.5 rounded-full shrink-0"
                                      style={{
                                        background:
                                          cell?.preparer && cell?.reviewer
                                            ? "hsl(145 63% 45%)"
                                            : cell?.preparer || cell?.reviewer
                                            ? "hsl(40 90% 55%)"
                                            : "hsl(220 15% 80%)",
                                      }}
                                    />
                                    <span
                                      className="text-[13px]"
                                      style={{
                                        color: "hsl(222 25% 25%)",
                                        fontFamily: FONT,
                                      }}
                                    >
                                      {item.label}
                                    </span>
                                  </div>

                                  {(["preparer", "reviewer"] as Role[]).map((r) => {
                                    const p = PERSONAS[r];
                                    const so = cell?.[r];
                                    return (
                                      <div key={r} className="min-w-[200px]">
                                        {so ? (
                                          <SignoffPill
                                            persona={p}
                                            signoff={so}
                                            onUndo={() => undo(section.key, iIdx, r)}
                                          />
                                        ) : (
                                          <SignButton
                                            persona={p}
                                            onClick={() => sign(section.key, iIdx, r)}
                                          />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            <p
              className="mt-5 text-[11px]"
              style={{ color: "hsl(222 15% 55%)", fontFamily: FONT }}
            >
              9:08 AM
            </p>
          </div>
        </div>
      </div>
      <BottomPrompter placeholder="Ask Luka about the signoff package..." />
    </div>
  );
};

export default FinalSignoffsView;
