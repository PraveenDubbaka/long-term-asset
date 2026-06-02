import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Minus,
  ExternalLink,
  Maximize2,
  Minimize2,
  Settings as SettingsIcon,
  Menu,
  Search,
  Plus,
  Library,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Pencil,
  Copy,
  Trash2,
  X as XIcon,
  Check,
  MessageCircle,
  Zap,
  ChevronRight,
  Play,
  Pause,
  Download,
  MessageSquare,
  Briefcase,
  Clock,
  Bug,
  UploadCloud,

} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface LukaSettingsOverlayProps {
  open: boolean;
  onClose: () => void;
  activeTab?: "threads" | "workspace";
  onOpenNewWindow?: () => void;
  onFullscreen?: () => void;
  onMinimize?: () => void;
  isFullscreen?: boolean;
  isMinimized?: boolean;
}

type TabKey = "general" | "usage" | "capabilities" | "help";

const TABS: { key: TabKey; label: string }[] = [
  { key: "general", label: "General" },
  { key: "usage", label: "Usage" },
  { key: "capabilities", label: "Capabilities" },
  { key: "help", label: "Help & Support" },
];

const Section = ({
  title,
  description,
  defaultOpen = true,
  children,
}: {
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [openSection, setOpenSection] = useState(defaultOpen);
  return (
    <div
      className="rounded-2xl bg-white p-6"
      style={{ border: "1px solid hsl(220 20% 92%)" }}
    >
      <button
        type="button"
        onClick={() => setOpenSection((v) => !v)}
        className="w-full flex items-start justify-between text-left"
      >
        <div>
          <div className="text-[15px] font-semibold" style={{ color: "hsl(222 35% 14%)" }}>
            {title}
          </div>
          <div className="text-[12.5px] mt-0.5" style={{ color: "hsl(222 15% 50%)" }}>
            {description}
          </div>
        </div>
        {openSection ? (
          <ChevronUp size={16} className="mt-1 text-muted-foreground" />
        ) : (
          <ChevronDown size={16} className="mt-1 text-muted-foreground" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {openSection && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="pt-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FieldLabel = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="mb-1.5">
    <div className="text-[13px] font-semibold" style={{ color: "hsl(222 35% 14%)" }}>
      {title}
    </div>
    {sub && (
      <div className="text-[12px]" style={{ color: "hsl(222 15% 50%)" }}>
        {sub}
      </div>
    )}
  </div>
);

const Toggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="relative h-6 w-11 rounded-full transition-colors"
    style={{
      background: checked ? "hsl(207 71% 38%)" : "hsl(220 15% 85%)",
    }}
  >
    <span
      className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
      style={{ left: 2, transform: checked ? "translateX(20px)" : "translateX(0)" }}
    />
  </button>
);

const DELIVERY_OPTIONS = ["Email", "Platform", "Both"];

const Selectish = ({
  value,
  options,
  onChange,
}: {
  value: string;
  options?: string[];
  onChange?: (v: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{ left: number; top: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const update = () => {
      const r = btnRef.current!.getBoundingClientRect();
      setCoords({ left: r.left, top: r.bottom + 4, width: r.width });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => options && setOpen((v) => !v)}
        className="inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-[10px] text-[12.5px] min-w-[140px]"
        style={{
          background: "hsl(0 0% 100%)",
          border: "1px solid hsl(220 20% 88%)",
          color: "hsl(222 30% 18%)",
          cursor: options ? "pointer" : "default",
        }}
      >
        <span>{value}</span>
        {options && <ChevronDown size={13} className="text-muted-foreground" />}
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && options && coords && (
              <>
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="fixed z-[9999] rounded-[10px] py-1 shadow-lg max-h-[260px] overflow-y-auto"
                  style={{
                    left: coords.left,
                    top: coords.top,
                    minWidth: coords.width,
                    background: "hsl(0 0% 100%)",
                    border: "1px solid hsl(220 20% 88%)",
                  }}
                >
                  {options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        onChange?.(opt);
                        setOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-[12.5px] transition-colors"
                      style={{
                        color:
                          opt === value
                            ? "#074075"
                            : "hsl(222 30% 18%)",
                        fontWeight: opt === value ? 600 : 400,
                        background: opt === value ? "#F3F3FB" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (opt !== value) e.currentTarget.style.background = "hsl(220 20% 95%)";
                      }}
                      onMouseLeave={(e) => {
                        if (opt !== value) e.currentTarget.style.background = "transparent";
                        else e.currentTarget.style.background = "#F3F3FB";
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

const NotificationRow = ({
  title,
  desc,
  initialOn = true,
  initialDelivery = "Email",
}: {
  title: string;
  desc: string;
  initialOn?: boolean;
  initialDelivery?: string;
}) => {
  const [on, setOn] = useState(initialOn);
  const [delivery, setDelivery] = useState(initialDelivery);
  return (
    <div
      className="flex items-start justify-between gap-6 py-4"
      style={{ borderTop: "1px solid hsl(220 20% 94%)" }}
    >
      <div className="min-w-0">
        <div className="text-[13px] font-semibold" style={{ color: "hsl(222 35% 14%)" }}>
          {title}
        </div>
        <div className="text-[12px] mt-0.5" style={{ color: "hsl(222 15% 50%)" }}>
          {desc}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Toggle checked={on} onChange={setOn} />
        <Selectish value={delivery} options={DELIVERY_OPTIONS} onChange={setDelivery} />
      </div>
    </div>
  );
};

const ChatToggleRow = ({
  title,
  desc,
  initialOn = true,
  trailing,
}: {
  title: string;
  desc: string;
  initialOn?: boolean;
  trailing?: React.ReactNode;
}) => {
  const [on, setOn] = useState(initialOn);
  return (
    <div
      className="flex items-start justify-between gap-6 py-4"
      style={{ borderTop: "1px solid hsl(220 20% 94%)" }}
    >
      <div className="min-w-0">
        <div className="text-[13px] font-semibold" style={{ color: "hsl(222 35% 14%)" }}>
          {title}
        </div>
        <div className="text-[12px] mt-0.5" style={{ color: "hsl(222 15% 50%)" }}>
          {desc}
        </div>
      </div>
      <div className="shrink-0">{trailing ?? <Toggle checked={on} onChange={setOn} />}</div>
    </div>
  );
};

type VaultPrompt = {
  name: string;
  dot: string;
  body: string;
  tag: string;
  uses: string;
  enhanced: boolean;
  isNew?: boolean;
};

const INITIAL_VAULT_PROMPTS: VaultPrompt[] = [
  {
    name: "/Basis-disclosure",
    dot: "hsl(270 70% 60%)",
    body: "Can you walk me through the basis of accounting reflected in this trial balance, and help me determine whether the entries are recorded on a cash basis, accrual basis, an ASPE-compliant basis, IFRS, a tax basis, or some hybrid combination? Under CSRS 4200, paragraph 29, the practitioner is required to discuss and agree with management on the basis of accounting to be applied in the compiled financial information, and this must be described in a Note to the Financial Information. The trial balance is the first concrete evidence of which basis is actually being used in practice, so I need to identify whether revenue is recognized when earned or when cash is received, whether expenses include accruals and prepaids, whether amortization has been recorded, and whether income taxes are accrued or only recorded when paid.",
    tag: "Trial Balance",
    uses: "1 uses",
    enhanced: false,
  },
  {
    name: "/Entity-knowledge",
    dot: "hsl(207 90% 54%)",
    body: "Based on what you know about this client's industry, ownership structure, and prior-year working papers, summarize the key entity-specific considerations I should keep in mind while reviewing capital asset amortization this period.",
    tag: "Capital Asset Amortization",
    uses: "0 uses",
    enhanced: true,
  },
  {
    name: "/Balance-check",
    dot: "hsl(160 70% 45%)",
    body: "Confirm that the trial balance mathematically balances, list any accounts with unusual signs, and flag totals that differ materially from the prior period.",
    tag: "Account Reconciliation",
    uses: "0 uses",
    enhanced: true,
  },
  {
    name: "/TB-classification",
    dot: "hsl(35 95% 55%)",
    body: "Review the trial balance for accounts that may be misclassified between asset, liability, equity, revenue, and expense categories, and propose the correct grouping with a short rationale.",
    tag: "Learning",
    uses: "0 uses",
    enhanced: true,
  },
  {
    name: "/Yearend-adjustments",
    dot: "hsl(220 90% 55%)",
    body: "Based on the trial balance, draft the typical year-end adjusting entries you would expect for this client, including accruals, prepaids, amortization, and tax provision.",
    tag: "",
    uses: "",
    enhanced: true,
  },
];

const NEW_PROMPT_DOTS = [
  "hsl(270 70% 60%)",
  "hsl(207 90% 54%)",
  "hsl(160 70% 45%)",
  "hsl(35 95% 55%)",
  "hsl(0 75% 60%)",
  "hsl(190 80% 50%)",
];

const PromptVaultPanel = () => {
  const STORAGE_KEY = "luka.promptVault.v1";
  const editNameRef = useRef<HTMLInputElement>(null);
  const [prompts, setPrompts] = useState<VaultPrompt[]>(() => {
    if (typeof window === "undefined") return INITIAL_VAULT_PROMPTS;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return INITIAL_VAULT_PROMPTS;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as VaultPrompt[];
      return INITIAL_VAULT_PROMPTS;
    } catch {
      return INITIAL_VAULT_PROMPTS;
    }
  });
  const [activeIdx, setActiveIdx] = useState(0);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState<Partial<VaultPrompt>>({});
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null);
  const active = prompts[activeIdx];

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
    } catch {
      // ignore quota / serialization errors
    }
  }, [prompts]);

  const updateActive = (patch: Partial<VaultPrompt>) => {
    setPrompts((prev) => prev.map((p, i) => (i === activeIdx ? { ...p, ...patch } : p)));
  };

  const handleNewPrompt = () => {
    const dot = NEW_PROMPT_DOTS[prompts.length % NEW_PROMPT_DOTS.length];
    const next: VaultPrompt = {
      name: "/new-prompt",
      dot,
      body: "",
      tag: "",
      uses: "0 uses",
      enhanced: false,
      isNew: true,
    };
    setPrompts((prev) => [next, ...prev]);
    setActiveIdx(0);
    setEditingIdx(null);
  };

  const handleSave = () => {
    if (!active) return;
    let name = active.name.trim();
    if (!name) name = "/new-prompt";
    if (!name.startsWith("/")) name = "/" + name;
    name = name.replace(/\s+/g, "-");
    updateActive({ name, isNew: false });
  };

  const handleClearBody = () => updateActive({ body: "" });
  const handleCopyAll = () => {
    if (active?.body) navigator.clipboard?.writeText(active.body).catch(() => {});
  };

  const startEditing = (i: number) => {
    setEditingIdx(i);
    setEditingDraft({ ...prompts[i] });
  };

  const commitEdit = () => {
    if (editingIdx === null) return;
    let name = (editingDraft.name ?? prompts[editingIdx].name).trim();
    if (!name) name = "/new-prompt";
    if (!name.startsWith("/")) name = "/" + name;
    name = name.replace(/\s+/g, "-");
    setPrompts((prev) =>
      prev.map((p, i) =>
        i === editingIdx ? { ...p, ...editingDraft, name, isNew: false } : p
      )
    );
    setEditingIdx(null);
    setEditingDraft({});
  };

  const cancelEdit = () => {
    setEditingIdx(null);
    setEditingDraft({});
  };

  const handleDelete = (i: number) => {
    setPrompts((prev) => prev.filter((_, idx) => idx !== i));
    if (activeIdx === i) setActiveIdx(0);
    else if (activeIdx > i) setActiveIdx((v) => v - 1);
    if (editingIdx === i) {
      setEditingIdx(null);
      setEditingDraft({});
    }
  };

  const handleDuplicate = (i: number) => {
    const source = prompts[i];
    const dup: VaultPrompt = {
      ...source,
      name: source.name + "-copy",
      uses: "0 uses",
      isNew: false,
    };
    setPrompts((prev) => {
      const next = [...prev];
      next.splice(i + 1, 0, dup);
      return next;
    });
    setActiveIdx(i + 1);
  };

  const handleCopyCard = (i: number) => {
    const body = prompts[i].body;
    if (body) navigator.clipboard?.writeText(body).catch(() => {});
  };

  const charCount = active?.body.length ?? 0;
  const wordCount = active?.body.trim() ? active.body.trim().split(/\s+/).length : 0;

  return (
    <div
      className="mt-4 rounded-2xl bg-white overflow-hidden"
      style={{ border: "1px solid hsl(220 20% 92%)" }}
    >
      <div className="grid grid-cols-[300px_1fr] min-h-[460px]">
        {/* Left list */}
        <div className="p-3 flex flex-col gap-2.5" style={{ borderRight: "1px solid hsl(220 20% 92%)" }}>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search prompts..."
              className="w-full pl-8 pr-2 py-2 rounded-[10px] text-[12.5px] outline-none"
              style={{ border: "1px solid hsl(220 20% 88%)", color: "hsl(222 30% 18%)" }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Selectish value="All categories" />
            <Selectish value="Recent" />
          </div>
          <button
            type="button"
            onClick={handleNewPrompt}
            className="w-full py-2 rounded-[10px] text-[12.5px] font-semibold text-white"
            style={{ background: "hsl(217 91% 50%)" }}
          >
            + New Prompt
          </button>
          <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-2 mt-1">
            {prompts.map((p, i) => {
              const isActive = i === activeIdx;
              const isEditing = i === editingIdx;
              const snippet = p.body ? p.body.slice(0, 90) + (p.body.length > 90 ? "…" : "") : (p.isNew ? "Empty prompt — type in the center area" : "");

              if (isEditing) {
                return (
                  <div
                    key={`${p.name}-${i}`}
                    className="rounded-[10px] p-2.5"
                    style={{
                      background: "hsl(220 20% 96%)",
                      border: "1px solid hsl(220 20% 82%)",
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.dot }} />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <input
                          value={editingDraft.name ?? p.name}
                          onChange={(e) => setEditingDraft((d) => ({ ...d, name: e.target.value }))}
                          placeholder="/shortcut"
                          spellCheck={false}
                          className="w-full px-1.5 py-0.5 rounded-md text-[12px] outline-none"
                          style={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 20% 85%)", color: "hsl(222 35% 14%)" }}
                        />
                        <textarea
                          value={editingDraft.body ?? p.body}
                          onChange={(e) => setEditingDraft((d) => ({ ...d, body: e.target.value }))}
                          placeholder="Prompt text…"
                          rows={3}
                          className="w-full px-1.5 py-1 rounded-md text-[11.5px] outline-none resize-none leading-relaxed"
                          style={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 20% 85%)", color: "hsl(222 25% 25%)" }}
                        />
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={commitEdit}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-white"
                            style={{ background: "hsl(217 91% 50%)" }}
                          >
                            <Check size={11} /> Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium"
                            style={{ background: "hsl(220 20% 94%)", color: "hsl(222 15% 45%)" }}
                          >
                            <XIcon size={11} /> Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={`${p.name}-${i}`}
                  type="button"
                  onClick={() => {
                    if (editingIdx !== null) return;
                    setActiveIdx(i);
                  }}
                  className="w-full text-left rounded-[10px] p-2.5 transition-colors"
                  style={{
                    background: isActive ? "hsl(220 20% 95%)" : "hsl(0 0% 100%)",
                    border: `1px solid ${isActive ? "hsl(220 20% 88%)" : "hsl(220 20% 93%)"}`,
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.dot }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[12.5px] font-semibold truncate" style={{ color: "hsl(222 35% 14%)" }}>
                            {p.name}
                          </span>
                          {p.enhanced && (
                            <Sparkles size={11} style={{ color: "hsl(270 60% 55%)" }} />
                          )}
                          {p.isNew && (
                            <span
                              className="text-[10px] px-1.5 py-px rounded-full"
                              style={{ background: "hsl(217 91% 95%)", color: "hsl(217 91% 40%)" }}
                            >
                              New
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0" style={{ color: "hsl(222 15% 45%)" }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(i);
                            }}
                            className="p-0.5 rounded hover:bg-[hsl(220_20%_92%)] transition-colors"
                            aria-label="Edit prompt"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyCard(i);
                            }}
                            className="p-0.5 rounded hover:bg-[hsl(220_20%_92%)] transition-colors"
                            aria-label="Copy prompt text"
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(i);
                            }}
                            className="p-0.5 rounded hover:bg-[hsl(220_20%_92%)] transition-colors"
                            aria-label="Duplicate prompt"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmIdx(i);
                            }}
                            className="p-0.5 rounded hover:bg-[hsl(0_70%_95%)] transition-colors"
                            aria-label="Delete prompt"
                          >
                            <Trash2 size={12} style={{ color: "hsl(0 70% 55%)" }} />
                          </button>
                        </div>
                      </div>
                      <div className="text-[11.5px] mt-0.5 line-clamp-2" style={{ color: "hsl(222 15% 50%)" }}>
                        {snippet}
                      </div>
                      {(p.tag || p.uses) && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px]" style={{ color: "hsl(222 15% 50%)" }}>
                          {p.tag && (
                            <>
                              <span>🏷</span>
                              <span>{p.tag}</span>
                            </>
                          )}
                          {p.tag && p.uses && <span>·</span>}
                          {p.uses && <span>{p.uses}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right detail */}
        <div className="flex flex-col">
          <div
            className="flex items-center justify-between px-5 py-3 gap-3"
            style={{ borderBottom: "1px solid hsl(220 20% 93%)" }}
          >
            <div className="flex items-center gap-2 text-[13px] min-w-0">
              <span className="font-semibold shrink-0" style={{ color: "hsl(222 35% 14%)" }}>
                {active?.isNew ? "New prompt" : "Free prompt Vault"}
              </span>
              <span style={{ color: "hsl(222 15% 50%)" }}>·</span>
              <span style={{ color: "hsl(222 15% 50%)" }} className="shrink-0">Trigger:</span>
              <input
                value={active?.name ?? ""}
                onChange={(e) => updateActive({ name: e.target.value })}
                placeholder="/shortcut"
                spellCheck={false}
                className="px-2 py-0.5 rounded-md text-[12px] outline-none min-w-0 w-[180px] focus:ring-2 focus:ring-[hsl(217_91%_60%/0.3)]"
                style={{ background: "hsl(220 15% 94%)", color: "hsl(222 30% 25%)", border: "1px solid hsl(220 20% 88%)" }}
              />
            </div>
            <button type="button" onClick={handleClearBody} className="text-[hsl(0_70%_55%)] shrink-0" aria-label="Clear">
              <XIcon size={15} />
            </button>
          </div>
          <div
            className="flex items-center justify-between px-5 py-2.5 text-[12px]"
            style={{ borderBottom: "1px solid hsl(220 20% 93%)", color: "hsl(222 30% 25%)" }}
          >
            <div className="flex items-center gap-4">
              <button type="button" onClick={handleCopyAll} className="inline-flex items-center gap-1.5 hover:text-foreground">
                <Copy size={12} /> Copy all
              </button>
              <button type="button" onClick={handleClearBody} className="inline-flex items-center gap-1.5 hover:text-foreground">
                <XIcon size={12} /> Clear
              </button>
            </div>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 font-medium"
              style={{ color: "hsl(217 91% 50%)" }}
            >
              <Plus size={12} /> Save as prompt
            </button>
          </div>
          <textarea
            value={active?.body ?? ""}
            onChange={(e) => updateActive({ body: e.target.value })}
            placeholder="Type your long prompt here. Set a trigger above (e.g. /blog-writer) and click Save as prompt."
            className="flex-1 min-h-[280px] resize-none outline-none px-5 py-4 text-[12.5px] leading-relaxed bg-transparent"
            style={{ color: "hsl(222 25% 25%)" }}
          />
          <div
            className="px-5 py-2.5 text-[11.5px]"
            style={{ borderTop: "1px solid hsl(220 20% 93%)", color: "hsl(222 15% 50%)" }}
          >
            {charCount} chars · {wordCount} words
          </div>
        </div>
      </div>

      <AlertDialog open={deleteConfirmIdx !== null} onOpenChange={(o) => !o && setDeleteConfirmIdx(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete prompt?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-medium" style={{ color: "hsl(222 35% 14%)" }}>"{deleteConfirmIdx !== null ? prompts[deleteConfirmIdx]?.name : ""}"</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmIdx(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmIdx !== null) {
                  handleDelete(deleteConfirmIdx);
                  setDeleteConfirmIdx(null);
                }
              }}
              className="text-white"
              style={{ background: "hsl(0 70% 55%)" }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const GeneralTab = () => {
  const [vaultOpen, setVaultOpen] = useState(false);
  return (
  <div className="space-y-5">

    {/* Profile */}
    <Section title="Profile" description="Personalize how Luka recognizes and addresses you.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <FieldLabel title="Full Name" />
          <input
            disabled
            value="John Doe"
            className="w-full px-3 py-2 rounded-[10px] text-[13px] outline-none"
            style={{
              background: "hsl(220 15% 95%)",
              border: "1px solid hsl(220 20% 88%)",
              color: "hsl(222 30% 25%)",
            }}
          />
        </div>
        <div>
          <FieldLabel title="What should Luka call you?" />
          <input
            placeholder="e.g. Manager, Sid, Partner"
            className="w-full px-3 py-2 rounded-[10px] text-[13px] outline-none"
            style={{
              background: "hsl(0 0% 100%)",
              border: "1px solid hsl(220 20% 88%)",
              color: "hsl(222 30% 18%)",
            }}
          />
        </div>
      </div>
      <div className="mt-5">
        <FieldLabel
          title="Specific instructions for Luka"
          sub="Tone, format, things to always remember, things to avoid."
        />
        <textarea
          rows={4}
          placeholder="e.g. Always respond in concise bullet points. Cite sources when available."
          className="w-full px-3 py-2 rounded-[10px] text-[13px] outline-none resize-none"
          style={{
            background: "hsl(0 0% 100%)",
            border: "1px solid hsl(220 20% 88%)",
            color: "hsl(222 30% 18%)",
          }}
        />
      </div>
    </Section>

    {/* Preferences */}
    <Section title="Preferences" description="Voice, font, and how Luka talks to you.">
      <div className="flex items-center justify-between py-2">
        <div>
          <div className="text-[13px] font-semibold" style={{ color: "hsl(222 35% 14%)" }}>
            Chat font style
          </div>
          <div className="text-[12px]" style={{ color: "hsl(222 15% 50%)" }}>
            Default is Inter. Previews will always render in Arial.
          </div>
        </div>
        <Selectish value="Inter" options={["Inter", "Arial", "Courier New", "Georgia", "Helvetica", "Tahoma", "Times New Roman", "Verdana"]} />
      </div>
      <div
        className="flex items-center justify-between py-4"
        style={{ borderTop: "1px solid hsl(220 20% 94%)" }}
      >
        <div>
          <div className="text-[13px] font-semibold" style={{ color: "hsl(222 35% 14%)" }}>
            Tone
          </div>
          <div className="text-[12px]" style={{ color: "hsl(222 15% 50%)" }}>
            Choose the tone Luka uses to respond.
          </div>
        </div>
        <Selectish value="Aria - Warm" options={["Aria - Warm", "Atlas - Neutral", "Nova - Bright", "Onyx - Deep"]} />
      </div>
    </Section>

    {/* Notifications */}
    <Section title="Notifications" description="Decide when and how Luka pings you.">
      <div className="-mt-4">
        <NotificationRow
          title="Luka Task completion (Workspace)"
          desc="Receive notifications when Luka finishes a task in the workspace. This is especially helpful for tasks that take a long time."
        />
        <NotificationRow
          title="Shared threads (Workspace)"
          desc="When a colleague shares threads or files with you in the workspace."
          initialDelivery="Platform"
        />
        <NotificationRow
          title="Usage & credits"
          desc="As the firm's credit limit approaches its maximum"
        />
        <NotificationRow
          title="Emails from Luka"
          desc="Email when Luka has finished a workflow or needs your response."
        />
        <NotificationRow
          title="Product updates"
          desc="New features, tips, and occasional updates."
        />
      </div>
    </Section>

    {/* Chats */}
    <Section title="Chats" description="Refine the chat input experience.">
      <div className="-mt-4">
        <ChatToggleRow
          title="Autosuggest"
          desc="Show list of suggestions after Luka has processed a response."
        />
        <ChatToggleRow
          title="Prompt Enhance Active (By default)"
          desc="Luka enhance every prompt language for a better output by default"
        />
        <ChatToggleRow
          title="Prompt vault"
          desc="Save long prompts under short shortcuts and expand them inline with a trigger like /blog-writer. Supports variables, autocomplete, and import/export."
          trailing={
            <button
              type="button"
              onClick={() => setVaultOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12.5px] font-medium transition-colors"
              style={{
                background: vaultOpen ? "hsl(270 60% 55% / 0.08)" : "hsl(0 0% 100%)",
                border: `1px solid ${vaultOpen ? "hsl(270 60% 55% / 0.35)" : "hsl(220 20% 88%)"}`,
                color: "hsl(222 30% 18%)",
              }}
            >
              <Sparkles size={13} style={{ color: "hsl(270 60% 55%)" }} />
              Manage prompts
              <span
                className="ml-1 inline-flex items-center justify-center text-[11px] font-semibold rounded-md px-1.5"
                style={{ background: "hsl(220 15% 94%)", color: "hsl(222 30% 25%)" }}
              >
                {INITIAL_VAULT_PROMPTS.length}
              </span>
            </button>
          }
        />
        <AnimatePresence initial={false}>
          {vaultOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <PromptVaultPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Section>
  </div>
  );
};

const PlaceholderTab = ({ label }: { label: string }) => (
  <div
    className="rounded-2xl bg-white p-10 text-center text-[13px]"
    style={{ border: "1px solid hsl(220 20% 92%)", color: "hsl(222 15% 50%)" }}
  >
    {label} settings coming soon.
  </div>
);

const CapabilitiesTab = () => {
  const [documents, setDocuments] = useState(true);
  const [inlineDoc, setInlineDoc] = useState(false);
  const [windowMode, setWindowMode] = useState<"side" | "full" | "new">("side");

  const modes: { id: "side" | "full" | "new"; title: string; desc: string }[] = [
    { id: "side", title: "Side panel", desc: "Opens Luka in a panel docked to the side of your screen" },
    { id: "full", title: "Full screen mode", desc: "Expands Luka to fill the entire browser window" },
    { id: "new", title: "New window", desc: "Launches Luka in a separate browser window" },
  ];

  return (
    <div className="space-y-4">
      <Section title="Preview" description="How Luka renders generated documents.">
        <div className="-mt-2 space-y-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-[13px] font-semibold" style={{ color: "hsl(222 35% 14%)" }}>
                Documents
              </div>
              <div className="text-[12.5px] mt-0.5" style={{ color: "hsl(222 15% 50%)" }}>
                Generate and preview documents in a dedicated window alongside your conversation (RHS preview).
              </div>
            </div>
            <Toggle checked={documents} onChange={setDocuments} />
          </div>
          <div style={{ borderTop: "1px solid hsl(220 20% 92%)" }} />
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-[13px] font-semibold" style={{ color: "hsl(222 35% 14%)" }}>
                Inline document visualization
              </div>
              <div className="text-[12.5px] mt-0.5" style={{ color: "hsl(222 15% 50%)" }}>
                Allow Luka to generate and preview documents directly inside the conversation.
              </div>
            </div>
            <Toggle checked={inlineDoc} onChange={setInlineDoc} />
          </div>
        </div>
      </Section>

      <Section
        title="Luka chat window behavior"
        description="Choose how Luka opens when you launch the chat window."
      >
        <div className="-mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
          {modes.map((m) => {
            const selected = windowMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setWindowMode(m.id)}
                className="text-left rounded-[14px] p-4 transition-all flex items-start gap-3"
                style={{
                  border: selected ? "1px solid hsl(207 71% 38%)" : "1px solid hsl(220 20% 92%)",
                  background: "hsl(0 0% 100%)",
                  boxShadow: selected ? "0 0 0 3px hsl(207 71% 38% / 0.08)" : "none",
                }}
              >
                <span
                  className="mt-0.5 flex items-center justify-center rounded-full shrink-0"
                  style={{
                    width: 18,
                    height: 18,
                    background: selected ? "hsl(207 71% 22%)" : "hsl(0 0% 100%)",
                    border: selected ? "1px solid hsl(207 71% 22%)" : "1.5px solid hsl(220 15% 75%)",
                  }}
                >
                  {selected && <Check size={11} style={{ color: "hsl(0 0% 100%)" }} strokeWidth={3} />}
                </span>
                <div>
                  <div className="text-[13px] font-semibold" style={{ color: "hsl(222 35% 14%)" }}>
                    {m.title}
                  </div>
                  <div className="text-[12.5px] mt-0.5" style={{ color: "hsl(222 15% 50%)" }}>
                    {m.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
};

const HelpAccordionItem = ({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="rounded-2xl bg-white overflow-hidden"
      style={{ border: "1px solid hsl(220 20% 92%)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold" style={{ color: "hsl(222 35% 14%)" }}>
            {title}
          </div>
          <div className="text-[12.5px] mt-0.5" style={{ color: "hsl(222 15% 50%)" }}>
            {description}
          </div>
        </div>
        <motion.div
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.18 }}
          className="shrink-0"
        >
          <ChevronRight size={16} style={{ color: "hsl(222 15% 50%)" }} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 text-[13px]" style={{ color: "hsl(222 30% 18%)" }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

type VideoItem = { id: string; title: string; duration: string };
type VideoCategory = {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof MessageSquare;
  videos: VideoItem[];
};

const VIDEO_CATEGORIES: VideoCategory[] = [
  {
    id: "threads",
    title: "Threads",
    subtitle: "Master conversations, replies, and context",
    icon: MessageSquare,
    videos: [
      { id: "t1", title: "Starting your first thread", duration: "1:24" },
      { id: "t2", title: "Replying and branching context", duration: "2:08" },
      { id: "t3", title: "Organising threads with labels", duration: "1:47" },
    ],
  },
  {
    id: "workspace",
    title: "Workspace",
    subtitle: "Set up rules, members, and preferences",
    icon: Briefcase,
    videos: [
      { id: "w1", title: "Creating a workspace from scratch", duration: "2:15" },
      { id: "w2", title: "Inviting members and assigning roles", duration: "1:52" },
      { id: "w3", title: "Configuring workspace preferences", duration: "2:31" },
    ],
  },
  {
    id: "prompts",
    title: "Prompts",
    subtitle: "Save, reuse and expand prompts instantly",
    icon: Sparkles,
    videos: [
      { id: "p1", title: "Saving your first prompt", duration: "1:18" },
      { id: "p2", title: "Using variables in prompts", duration: "2:42" },
      { id: "p3", title: "Sharing prompts with your team", duration: "1:36" },
    ],
  },
];

const IconButton = ({
  onClick,
  title,
  children,
}: {
  onClick?: () => void;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    className="inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors hover:bg-white/10"
    style={{ color: "hsl(0 0% 100% / 0.85)" }}
  >
    {children}
  </button>
);

const GetStartedContent = () => {
  const [activeCategory, setActiveCategory] = useState<string>("threads");
  const [activeVideoId, setActiveVideoId] = useState<string>("t1");
  const [playing, setPlaying] = useState(false);

  const allVideos = VIDEO_CATEGORIES.flatMap((c) => c.videos);
  const activeVideo = allVideos.find((v) => v.id === activeVideoId) ?? allVideos[0];

  return (
    <div
      className="rounded-2xl overflow-hidden mt-2"
      style={{ background: "hsl(222 60% 8%)" }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-0">
        {/* Player */}
        <div className="p-4">
          <div
            className="relative rounded-xl overflow-hidden aspect-video"
            style={{
              background:
                "linear-gradient(135deg, hsl(222 40% 18%) 0%, hsl(222 50% 12%) 100%)",
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80"
              alt={activeVideo.title}
              className="w-full h-full object-cover"
              style={{ opacity: playing ? 1 : 0.85 }}
            />
            <div
              className="absolute left-0 right-0 bottom-0 px-4 pt-8 pb-3"
              style={{
                background:
                  "linear-gradient(to top, hsl(222 60% 6% / 0.85) 0%, transparent 100%)",
              }}
            >
              <div className="text-[11px]" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                {playing ? "0:12" : "0:00"}
              </div>
              <div
                className="mt-1.5 h-[3px] rounded-full overflow-hidden"
                style={{ background: "hsl(0 0% 100% / 0.18)" }}
              >
                <motion.div
                  className="h-full"
                  style={{ background: "hsl(0 0% 100% / 0.9)" }}
                  animate={{ width: playing ? "30%" : "0%" }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div
                className="text-[13px] font-semibold truncate"
                style={{ color: "hsl(0 0% 100%)" }}
              >
                {activeVideo.title}
              </div>
              <div
                className="mt-0.5 flex items-center gap-1.5 text-[11.5px]"
                style={{ color: "hsl(0 0% 100% / 0.6)" }}
              >
                <Clock size={11} />
                {activeVideo.duration}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <IconButton
                title={playing ? "Pause" : "Play"}
                onClick={() => setPlaying((p) => !p)}
              >
                {playing ? <Pause size={15} /> : <Play size={15} />}
              </IconButton>
              <IconButton title="Stop" onClick={() => setPlaying(false)}>
                <span
                  className="block w-[10px] h-[10px] rounded-[1.5px]"
                  style={{ background: "currentColor" }}
                />
              </IconButton>
              <IconButton title="Download">
                <Download size={14} />
              </IconButton>
            </div>
          </div>
        </div>

        {/* Playlist */}
        <div
          className="p-3 lg:border-l"
          style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
        >
          <div className="space-y-2">
            {VIDEO_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const open = activeCategory === cat.id;
              return (
                <div
                  key={cat.id}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: "hsl(0 0% 100% / 0.04)",
                    border: "1px solid hsl(0 0% 100% / 0.06)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveCategory(open ? "" : cat.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: "hsl(252 60% 60% / 0.18)",
                        color: "hsl(252 80% 78%)",
                      }}
                    >
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[12.5px] font-semibold truncate"
                        style={{ color: "hsl(0 0% 100%)" }}
                      >
                        {cat.title}
                      </div>
                      <div
                        className="text-[11px] truncate"
                        style={{ color: "hsl(0 0% 100% / 0.55)" }}
                      >
                        {cat.subtitle}
                      </div>
                    </div>
                    <div
                      className="text-[11px] font-mono px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        background: "hsl(0 0% 100% / 0.08)",
                        color: "hsl(0 0% 100% / 0.75)",
                      }}
                    >
                      {cat.videos.length}
                    </div>
                    <motion.div
                      animate={{ rotate: open ? 180 : 0 }}
                      transition={{ duration: 0.18 }}
                      className="shrink-0"
                    >
                      <ChevronDown
                        size={14}
                        style={{ color: "hsl(0 0% 100% / 0.55)" }}
                      />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="px-2 pb-2 space-y-1">
                          {cat.videos.map((v) => {
                            const isActive = v.id === activeVideoId;
                            return (
                              <div
                                key={v.id}
                                className="flex items-center gap-2 px-2 py-2 rounded-lg transition-colors group"
                                style={{
                                  background: isActive
                                    ? "hsl(0 0% 100% / 0.08)"
                                    : "transparent",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveVideoId(v.id);
                                    setPlaying(true);
                                  }}
                                  className="flex-1 min-w-0 text-left"
                                >
                                  <div
                                    className="text-[12px] font-medium truncate"
                                    style={{
                                      color: isActive
                                        ? "hsl(0 0% 100%)"
                                        : "hsl(0 0% 100% / 0.78)",
                                    }}
                                  >
                                    {v.title}
                                  </div>
                                  <div
                                    className="text-[10.5px] flex items-center gap-1 mt-0.5"
                                    style={{ color: "hsl(0 0% 100% / 0.5)" }}
                                  >
                                    <Clock size={9} />
                                    {v.duration}
                                  </div>
                                </button>
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <IconButton
                                    title={
                                      isActive && playing ? "Pause" : "Play"
                                    }
                                    onClick={() => {
                                      setActiveVideoId(v.id);
                                      setPlaying(
                                        isActive ? !playing : true
                                      );
                                    }}
                                  >
                                    {isActive && playing ? (
                                      <Pause size={13} />
                                    ) : (
                                      <Play size={13} />
                                    )}
                                  </IconButton>
                                  <IconButton title="Download">
                                    <Download size={12} />
                                  </IconButton>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

type ReportType = "feedback" | "bug";

const FeedbackForm = () => {
  const [reportType, setReportType] = useState<ReportType>("feedback");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX = 2000;
  const canSave = message.trim().length > 0;

  const reset = () => {
    setReportType("feedback");
    setMessage("");
    setFiles([]);
  };

  const options: { value: ReportType; label: string; icon: typeof MessageSquare }[] = [
    { value: "feedback", label: "Submit Feedback", icon: MessageSquare },
    { value: "bug", label: "Report a Bug", icon: Bug },
  ];

  return (
    <div
      className="rounded-2xl bg-white mt-1"
      style={{ border: "1px solid hsl(220 20% 92%)" }}
    >
      <div className="p-5 space-y-5">
        {/* Report Type */}
        <div>
          <label
            className="block text-[12.5px] font-semibold mb-2"
            style={{ color: "hsl(222 35% 14%)" }}
          >
            Report Type <span style={{ color: "hsl(0 75% 55%)" }}>*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {options.map((opt) => {
              const Icon = opt.icon;
              const active = reportType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setReportType(opt.value)}
                  className="flex items-center gap-2.5 px-3.5 py-3 rounded-[10px] text-left transition-colors"
                  style={{
                    border: active
                      ? "1.5px solid hsl(207 71% 38%)"
                      : "1px solid hsl(220 20% 92%)",
                    background: active ? "hsl(207 71% 38% / 0.04)" : "hsl(0 0% 100%)",
                  }}
                >
                  <span
                    className="w-[14px] h-[14px] rounded-full flex items-center justify-center shrink-0"
                    style={{
                      border: active
                        ? "4px solid hsl(207 71% 38%)"
                        : "1.5px solid hsl(220 15% 75%)",
                      background: active ? "hsl(207 71% 38%)" : "transparent",
                    }}
                  />
                  <Icon size={15} style={{ color: "hsl(222 30% 25%)" }} />
                  <span
                    className="text-[12.5px] font-medium"
                    style={{ color: "hsl(222 35% 14%)" }}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <label
            className="block text-[12.5px] font-semibold mb-2"
            style={{ color: "hsl(222 35% 14%)" }}
          >
            Describe your issue or tell us how can we improve?{" "}
            <span style={{ color: "hsl(0 75% 55%)" }}>*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
            placeholder={
              "e.g. Describe the issue you encountered or simply share your thoughts.\nPlease include steps to reproduce it, and any relevant details that could help us resolve the problem."
            }
            rows={5}
            className="w-full px-3.5 py-3 rounded-[10px] text-[12.5px] resize-none outline-none transition-colors"
            style={{
              border: "1px solid hsl(220 20% 92%)",
              color: "hsl(222 35% 14%)",
              background: "hsl(0 0% 100%)",
            }}
          />
          <div
            className="text-right text-[11px] mt-1 font-mono"
            style={{ color: "hsl(222 15% 50%)" }}
          >
            {message.length}/{MAX}
          </div>
        </div>

        {/* Uploader */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
              }
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-[10px] py-8 px-4 flex flex-col items-center justify-center text-center transition-colors hover:bg-[hsl(220_30%_98%)]"
            style={{
              border: "1.5px dashed hsl(220 20% 85%)",
              background: "hsl(0 0% 100%)",
            }}
          >
            <UploadCloud size={22} style={{ color: "hsl(222 25% 40%)" }} />
            <div
              className="mt-2 text-[12.5px]"
              style={{ color: "hsl(222 35% 14%)" }}
            >
              <span style={{ color: "hsl(207 71% 38%)", fontWeight: 600 }}>
                Click to upload
              </span>{" "}
              or drag and drop your files
            </div>
            <div
              className="mt-1 text-[11.5px]"
              style={{ color: "hsl(222 15% 50%)" }}
            >
              Please feel free to upload any files pertinent to the issue for a more thorough assessment.
            </div>
          </button>
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-[11.5px] px-3 py-1.5 rounded-md"
                  style={{
                    background: "hsl(220 30% 97%)",
                    color: "hsl(222 30% 25%)",
                  }}
                >
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFiles((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="shrink-0 hover:opacity-60"
                    aria-label="Remove file"
                  >
                    <XIcon size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-end gap-2 px-5 py-3"
        style={{ borderTop: "1px solid hsl(220 20% 92%)" }}
      >
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 rounded-[10px] text-[12.5px] font-medium transition-colors hover:bg-[hsl(220_30%_97%)]"
          style={{
            border: "1px solid hsl(220 20% 92%)",
            color: "hsl(222 35% 14%)",
            background: "hsl(0 0% 100%)",
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSave}
          className="px-4 py-2 rounded-[10px] text-[12.5px] font-medium transition-colors disabled:cursor-not-allowed"
          style={{
            background: canSave ? "hsl(207 71% 38%)" : "hsl(220 20% 92%)",
            color: canSave ? "hsl(0 0% 100%)" : "hsl(222 15% 55%)",
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
};

const TERMS_SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. Service Overview",
    body: "Luka is an AI assistant that helps you perform various accounting tasks, such as document generation, workflow support, and data analysis. Luka is a tool—not a licensed professional—and does not replace human judgment.",
  },
  {
    title: "2. No Assurance or Advisory Role",
    body: "Luka does not provide assurance services or professional advice (e.g., audit, tax, legal). Any content it generates must be reviewed and approved by a qualified user before being relied upon.",
  },
  {
    title: "3. User Accountability",
    body: "You are responsible for verifying the accuracy, completeness, and compliance of any outputs Luka generates. The tool is intended to assist, not finalize, work products.",
  },
  {
    title: "4. Token-Based Usage",
    body: "Luka operates on a token system. Each interaction consumes a portion of your monthly token allocation. Users and firms are expected to manage their token usage fairly and in accordance with their plan.",
  },
  {
    title: "5. License to Use",
    body: "You are granted a non-exclusive, non-transferable license to use Luka for accounting-related tasks within your firm. You may not reverse-engineer, resell, or misuse the service.",
  },
  {
    title: "6. Access & Permissions",
    body: "Luka may request access to files, documents, and client information as needed to perform tasks. This access is governed by your permissions within the platform.",
  },
  {
    title: "7. User Roles & Restrictions",
    body: "Access to Luka may be role-restricted. For example, interns or non-accounting staff may have limited or read-only access depending on your firm's settings.",
  },
  {
    title: "8. Data Security",
    body: "Luka adheres to your platform's security protocols. Any information processed by Luka is retained and accessed only in accordance with firm and platform policies.",
  },
];

const LegalDocumentCard = ({
  intro,
  sections,
}: {
  intro: string;
  sections: { title: string; body: string }[];
}) => {
  return (
    <div
      className="rounded-2xl bg-white mt-1 p-6"
      style={{ border: "1px solid hsl(220 20% 92%)" }}
    >
      <p
        className="text-[12.5px] leading-relaxed"
        style={{ color: "hsl(222 15% 50%)" }}
      >
        {intro}
      </p>
      <div className="mt-5 space-y-4">
        {sections.map((s) => (
          <div key={s.title}>
            <div
              className="text-[13px] font-semibold"
              style={{ color: "hsl(222 35% 14%)" }}
            >
              {s.title}
            </div>
            <p
              className="text-[12.5px] leading-relaxed mt-1"
              style={{ color: "hsl(222 15% 50%)" }}
            >
              {s.body}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="mt-6 pt-5 flex flex-wrap items-center justify-between gap-y-2"
        style={{ borderTop: "1px solid hsl(220 20% 92%)" }}
      >
        <div className="text-[11.5px]" style={{ color: "hsl(222 15% 50%)" }}>
          Effective Date: <span style={{ color: "hsl(222 35% 14%)" }}>June 1, 2026</span>
        </div>
        <div className="text-[11.5px]" style={{ color: "hsl(222 15% 50%)" }}>
          Jurisdiction: <span style={{ color: "hsl(222 35% 14%)" }}>Canada</span>
        </div>
        <div className="text-[11.5px]" style={{ color: "hsl(222 15% 50%)" }}>
          Version: <span style={{ color: "hsl(222 35% 14%)" }}>1.0</span>
        </div>
      </div>
    </div>
  );
};

const TermsOfUseContent = () => (
  <LegalDocumentCard
    intro="Welcome to Luka, your AI-powered assistant designed to support accounting professionals in preparing and managing engagements. Please read these Terms of Use carefully. By activating or using Luka, you agree to the following terms:"
    sections={TERMS_SECTIONS}
  />
);


const PRIVACY_SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. Data Collection",
    body: "Luka is an AI assistant that helps you perform various accounting tasks, such as document generation, workflow support, and data analysis. Luka is a tool—not a licensed professional—and does not replace human judgment.",
  },
  {
    title: "2. No Assurance or Advisory Role",
    body: "Luka may process user inputs, uploaded files, and engagement-related data to complete tasks. No data is shared outside your firm or team.",
  },
  {
    title: "3. Data Retention",
    body: "Chat history and generated content are stored securely within your platform environment and are accessible to authorized users only.",
  },
  {
    title: "4. Access Control",
    body: "Luka adheres to firm-level access permissions. You control who can view or interact with AI-generated content.",
  },
  {
    title: "5. Cookies & Tracking",
    body: "You are granted a non-exclusive, non-transferable license to use Luka for accounting-related tasks within your firm. You may not reverse-engineer, resell, or misuse the service.",
  },
  {
    title: "6. Your Rights",
    body: "You may request access to or deletion of your Luka interaction data at any time by contacting your platform admin or support.",
  },
];

const PrivacyPolicyContent = () => (
  <LegalDocumentCard
    intro="This Privacy Policy describes how Luka handles the data you and your firm share while using the assistant. By using Luka, you acknowledge the practices outlined below."
    sections={PRIVACY_SECTIONS}
  />
);


const HelpTab = () => {
  return (
    <div className="space-y-3">
      <HelpAccordionItem
        title="Get started"
        description="How Luka works and what's new."
        defaultOpen
      >
        <GetStartedContent />
      </HelpAccordionItem>

      <HelpAccordionItem
        title="Feedback"
        description="Tell us what's working and what's not."
      >
        <FeedbackForm />
      </HelpAccordionItem>



      <HelpAccordionItem
        title="Terms of Use"
        description="Read the latest terms."
      >
        <TermsOfUseContent />
      </HelpAccordionItem>


      <HelpAccordionItem
        title="Privacy Policy"
        description="How we handle your data."
      >
        <PrivacyPolicyContent />
      </HelpAccordionItem>


      <HelpAccordionItem
        title="Contact support"
        description="Reach our team directly."
      >
        <div className="space-y-3">
          <p>
            Need assistance? Our support team is here to help with any questions about Luka, your engagements, or technical issues.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12.5px] font-medium transition-colors hover:brightness-95"
            style={{
              background: "hsl(207 71% 38%)",
              color: "hsl(0 0% 100%)",
            }}
          >
            <MessageCircle size={14} />
            Contact support
          </button>
        </div>
      </HelpAccordionItem>
    </div>
  );
};

const UsageBar = ({
  label,
  used,
  total,
}: {
  label: string;
  used: number;
  total: number;
}) => {
  const pct = Math.min(100, Math.round((used / total) * 100));
  return (
    <div
      className="rounded-[14px] p-4"
      style={{ border: "1px solid hsl(220 20% 92%)", background: "hsl(0 0% 100%)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-[13px] font-semibold" style={{ color: "hsl(222 35% 14%)" }}>
          {label}
        </div>
        <div
          className="text-[12px]"
          style={{ color: "hsl(222 15% 45%)", fontFamily: "'Share Tech Mono', monospace" }}
        >
          {used}/{total}
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: "#1C63A6" }}
        />
      </div>
      <div className="text-[12px] mt-2" style={{ color: "hsl(222 15% 50%)" }}>
        {pct}% used
      </div>
    </div>
  );
};

const UsageSummary = ({ used, total }: { used: number; total: number }) => {
  const pct = Math.min(100, Math.round((used / total) * 100));
  return (
    <div
      className="rounded-[14px] p-4 flex items-center justify-between"
      style={{ background: "#F3F6FC", border: "1px solid hsl(220 30% 92%)" }}
    >
      <div>
        <div
          className="text-[11px] font-semibold tracking-[0.08em]"
          style={{ color: "hsl(222 15% 45%)" }}
        >
          TOTAL USED
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span
            className="text-[28px] leading-none font-bold"
            style={{ color: "hsl(222 35% 14%)", fontFamily: "'Share Tech Mono', monospace" }}
          >
            {used}
          </span>
          <span
            className="text-[14px]"
            style={{ color: "hsl(222 15% 50%)", fontFamily: "'Share Tech Mono', monospace" }}
          >
            / {total}
          </span>
        </div>
      </div>
      <div className="text-[14px] font-semibold" style={{ color: "hsl(222 35% 14%)" }}>
        {pct}%
      </div>
    </div>
  );
};

const UsageGroup = ({
  title,
  threadsUsed,
  workspacesUsed,
  total,
}: {
  title: string;
  threadsUsed: number;
  workspacesUsed: number;
  total: number;
}) => {
  const totalUsed = threadsUsed + workspacesUsed;
  return (
    <div>
      <div className="text-[13px] font-semibold mb-3" style={{ color: "hsl(222 35% 14%)" }}>
        {title}
      </div>
      <UsageSummary used={totalUsed} total={total * 2} />
      <div className="grid grid-cols-2 gap-3 mt-3">
        <UsageBar label="Threads" used={threadsUsed} total={total} />
        <UsageBar label="Workspaces" used={workspacesUsed} total={total} />
      </div>
    </div>
  );
};

const MODEL_GROUPS: { label: string; models: string[] }[] = [
  { label: "OpenAI", models: ["GPT-5.4 Pro", "GPT-5.4 Standard", "o3 Reasoning", "GPT-4.1 Mini"] },
  { label: "Google", models: ["Gemini 3.1 Pro", "Gemini 3.1 Flash", "Gemini Deep Think"] },
  { label: "Anthropic", models: ["Claude Opus 4.6", "Claude Sonnet 4.6", "Claude Haiku"] },
];

const ModelSelect = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-[10px] text-[12.5px] min-w-[160px]"
        style={{
          background: "hsl(0 0% 100%)",
          border: "1px solid hsl(220 20% 88%)",
          color: "hsl(222 30% 18%)",
          cursor: "pointer",
        }}
      >
        <span>{value}</span>
        <ChevronDown size={13} className="text-muted-foreground" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-full mt-1.5 z-50 rounded-[14px] py-2 shadow-xl overflow-y-auto min-w-full"
            style={{
              width: "max-content",
              maxWidth: "calc(100vw - 24px)",
              maxHeight: "min(460px, calc(100vh - 120px))",
              background: "hsl(0 0% 100%)",
              border: "1px solid hsl(220 20% 88%)",
            }}
          >
            <div
              className="px-4 pt-2 pb-2 text-[10.5px] font-semibold tracking-[0.14em]"
              style={{ color: "hsl(222 15% 45%)", fontFamily: "Rajdhani, sans-serif" }}
            >
              SELECT MODEL
            </div>
            {MODEL_GROUPS.map((group, gi) => (
              <div key={group.label}>
                {gi > 0 && (
                  <div
                    className="my-1 mx-3"
                    style={{ borderTop: "1px solid hsl(220 20% 92%)" }}
                  />
                )}
                {group.models.map((opt) => {
                  const selected = opt === value;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        onChange(opt);
                        setOpen(false);
                      }}
                      className="w-full flex items-center justify-between gap-6 px-4 py-2 text-[13px] transition-colors whitespace-nowrap"
                      style={{
                        color: selected ? "#074075" : "hsl(222 30% 18%)",
                        fontWeight: selected ? 700 : 400,
                        background: selected ? "#F3F3FB" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!selected) e.currentTarget.style.background = "hsl(220 20% 96%)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = selected ? "#F3F3FB" : "transparent";
                      }}
                    >
                      <span>{opt}</span>
                      {selected && <Check size={15} style={{ color: "#074075" }} />}
                    </button>
                  );
                })}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const UsageTab = () => {
  const [model, setModel] = useState("GPT-5.4 Pro");
  return (
    <div className="space-y-4">
      <Section title="Limits" description="Credit usage of threads and workspaces.">
        <div className="-mt-2 space-y-6">
          <UsageGroup title="Firm Usage" threadsUsed={150} workspacesUsed={100} total={500} />
          <UsageGroup title="My Usage" threadsUsed={25} workspacesUsed={25} total={500} />
        </div>
      </Section>

      <Section
        title="Default AI Model"
        description="The AI model by default across your threads and workspaces"
      >
        <div className="-mt-2 flex items-start justify-between gap-6">
          <div>
            <div className="text-[13px] font-semibold" style={{ color: "hsl(222 35% 14%)" }}>
              Default AI model for usage
            </div>
            <div className="text-[12.5px] mt-0.5" style={{ color: "hsl(222 15% 50%)" }}>
              Pick which model new threads or workspace start with. You can switch models from the prompter anytime
            </div>
          </div>
          <ModelSelect value={model} onChange={setModel} />
        </div>
      </Section>
    </div>
  );
};

const LukaSettingsOverlay = ({
  open,
  onClose,
  activeTab = "workspace",
  onOpenNewWindow,
  onFullscreen,
  onMinimize,
  isFullscreen = false,
  isMinimized = false,
}: LukaSettingsOverlayProps) => {
  const [tab, setTab] = useState<TabKey>("general");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isWorkspace = activeTab === "workspace";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0 z-[60] flex flex-col"
          style={{ background: "hsl(220 20% 97%)" }}
        >
          {/* Top bar — 3-column grid keeps pill perfectly centered */}
          <div
            className="grid items-center px-4 py-3 shrink-0 bg-white"
            style={{
              borderBottom: "1px solid hsl(220 20% 92%)",
              gridTemplateColumns: "1fr auto 1fr",
            }}
          >
            {/* Left controls */}
            <div className="flex items-center gap-1 justify-self-start">
              {isWorkspace && (
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((v) => !v)}
                  className="w-8 h-8 rounded-[10px] flex items-center justify-center hover:bg-[hsl(220_20%_94%)] transition-colors"
                  style={{ color: "hsl(222 30% 25%)" }}
                  aria-label="Toggle sidebar"
                >
                  <Menu size={16} />
                </button>
              )}
            </div>

            {/* Center pill — reflects originating tab, read-only (state held) */}
            <div
              className="relative flex items-center gap-1 rounded-full p-1 justify-self-center"
              style={{
                background: "hsl(0 0% 100%)",
                border: "1px solid hsl(220 20% 92%)",
                boxShadow:
                  "0 6px 18px -8px hsl(250 40% 40% / 0.18), 0 1px 2px hsl(220 30% 50% / 0.05)",
              }}
            >
              {([
                { id: "threads" as const, label: "Threads", icon: MessageCircle },
                { id: "workspace" as const, label: "Workspace", icon: Zap },
              ]).map((t) => {
                const isActive = (isWorkspace ? "workspace" : "threads") === t.id;
                const Icon = t.icon;
                return (
                  <div
                    key={t.id}
                    className="relative pl-2.5 pr-5 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 whitespace-nowrap"
                    style={{ color: isActive ? "hsl(0 0% 100%)" : "hsl(222 30% 18%)" }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="luka-settings-tab-indicator"
                        className="absolute inset-0 rounded-full"
                        style={{
                          background:
                            "linear-gradient(135deg, #6C2FF2 0%, #8A5BFF 55%, #B084FF 100%)",
                          boxShadow:
                            "0 6px 16px -6px hsl(265 80% 55% / 0.55), inset 0 1px 0 hsl(0 0% 100% / 0.25)",
                        }}
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      />
                    )}
                    <Icon size={14} className="relative z-10" />
                    <span className="relative z-10">{t.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Right window controls */}
            <div className="flex items-center gap-1 justify-self-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onOpenNewWindow}
                    className="action-icon"
                    aria-label="Open in new window"
                  >
                    <ExternalLink size={16} />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Open in new window</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    type="button"
                    whileHover={isWorkspace ? undefined : { scale: 1.1 }}
                    whileTap={isWorkspace ? undefined : { scale: 0.9 }}
                    onClick={isWorkspace ? undefined : onFullscreen}
                    disabled={isWorkspace}
                    className={`action-icon ${isFullscreen ? "action-icon-active" : ""} ${isWorkspace ? "action-icon-disabled" : ""}`}
                    aria-label={isWorkspace ? "Fullscreen disabled in workspace" : isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                  >
                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>{isWorkspace ? "Fullscreen disabled in workspace" : isFullscreen ? "Exit fullscreen" : "Fullscreen"}</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onMinimize}
                    className="action-icon"
                    aria-label={isMinimized ? "Restore" : "Minimize"}
                  >
                    <Minus size={16} />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>{isMinimized ? "Restore" : "Minimize"}</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="action-icon"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Close</p></TooltipContent>
              </Tooltip>
            </div>
          </div>


          {/* Body */}
          <div className="flex-1 flex min-h-0">
            {/* Sidebar */}
            <AnimatePresence initial={false}>
              {isWorkspace && !sidebarCollapsed && (
                <motion.aside
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 240, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  className="flex flex-col shrink-0 overflow-hidden bg-white"
                  style={{ borderRight: "1px solid hsl(220 20% 92%)" }}
                >
                  <div className="px-3 pt-3 pb-2">
                    <div
                      className="relative flex items-center rounded-[10px]"
                      style={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 20% 90%)" }}
                    >
                      <Search size={14} className="absolute left-3 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search"
                        className="w-full bg-transparent pl-9 pr-3 py-2 text-[13px] outline-none rounded-[10px]"
                        style={{ color: "hsl(222 30% 18%)" }}
                      />
                    </div>
                  </div>

                  <div className="px-3 pb-3">
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-[10px] text-[13px] font-medium transition-colors hover:brightness-95"
                      style={{
                        background: "#F0F2F4",
                        border: "1px solid hsl(220 20% 90%)",
                        color: "hsl(222 30% 18%)",
                      }}
                    >
                      <Plus size={14} strokeWidth={2.2} />
                      <span>New Engagement</span>
                    </button>
                  </div>

                  <div className="px-4 pt-2 pb-2 flex items-center gap-2">
                    <Library size={14} className="text-foreground" />
                    <span className="text-[12px] font-semibold" style={{ color: "hsl(222 30% 18%)" }}>
                      Recents
                    </span>
                  </div>

                  <div className="px-3 flex-1 overflow-y-auto space-y-2">
                    <div
                      className="rounded-[10px] px-3 py-2.5 flex items-start gap-2.5"
                      style={{
                        background: "hsl(0 0% 100%)",
                        border: "1px solid hsl(220 20% 90%)",
                      }}
                    >
                      <span
                        className="mt-1 w-2 h-2 rounded-full shrink-0"
                        style={{ background: "hsl(30 95% 55%)" }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-bold truncate" style={{ color: "hsl(222 35% 16%)" }}>
                          MapleLeaf Consulting
                        </div>
                        <div
                          className="text-[11px] mt-0.5 truncate"
                          style={{ color: "hsl(222 15% 45%)", fontFamily: "'Share Tech Mono', monospace" }}
                        >
                          COM-SID-Dec312024
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-3 py-3" style={{ borderTop: "1px solid hsl(220 20% 90%)" }}>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-[10px] text-[13px] font-medium hover:bg-[hsl(220_20%_94%)] transition-colors"
                      style={{ color: "hsl(222 30% 25%)" }}
                    >
                      <SettingsIcon size={14} />
                      <span>Settings</span>
                    </button>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* Main content */}
            <div className="flex-1 min-w-0 overflow-y-auto">
              <div className="px-8 pt-7 pb-10 max-w-[1100px] mx-auto">
                <div className="flex items-start justify-between">
                  <div>
                    <h1
                      className="text-[22px] font-bold"
                      style={{ color: "hsl(222 35% 14%)", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.01em" }}
                    >
                      Settings
                    </h1>
                    <p className="text-[13px] mt-1" style={{ color: "hsl(222 15% 50%)" }}>
                      Personalize Luka, check usage, capabilities, and workspaces
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-0.5 transition-colors hover:opacity-70"
                    aria-label="Close settings"
                  >
                    <XIcon size={20} color="#c0392b" strokeWidth={1.5} />
                  </button>
                </div>

                {/* Tabs */}
                <div
                  className="mt-5 inline-flex items-center gap-1 p-1 rounded-[10px]"
                  style={{ background: "hsl(220 20% 94%)" }}
                >
                  {TABS.map((t) => {
                    const active = tab === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setTab(t.key)}
                        className="px-3.5 py-1.5 rounded-[8px] text-[12.5px] font-medium transition-colors"
                        style={{
                          background: active ? "hsl(0 0% 100%)" : "transparent",
                          color: active ? "hsl(222 35% 14%)" : "hsl(222 15% 45%)",
                          border: active ? "1px solid hsl(220 20% 88%)" : "1px solid transparent",
                          boxShadow: active ? "0 1px 2px hsl(220 20% 80% / 0.4)" : undefined,
                        }}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6">
                  {tab === "general" && <GeneralTab />}
                  {tab === "usage" && <UsageTab />}
                  {tab === "capabilities" && <CapabilitiesTab />}
                  {tab === "help" && <HelpTab />}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LukaSettingsOverlay;
