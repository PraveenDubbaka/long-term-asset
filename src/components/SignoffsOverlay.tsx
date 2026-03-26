import { useState } from "react";
import { X, CheckSquare, XSquare } from "lucide-react";
import { Button } from "@/components/wp-ui/button";
import { Checkbox } from "@/components/wp-ui/checkbox";
import { cn } from "@/lib/utils";

interface Preparer {
  id: string;
  name: string;
  avatarUrl?: string;
  status: "approved" | "rejected" | "pending";
}

interface SignoffItem {
  id: string;
  label: string;
}

interface SignoffSection {
  id: string;
  code: string;
  label: string;
  isExpanded: boolean;
  items: SignoffItem[];
}

const preparers: Preparer[] = [
  { id: "p1", name: "Preparer", status: "pending" },
  { id: "p2", name: "Preparer", status: "rejected" },
  { id: "p3", name: "Preparer", status: "approved" },
];

const initialSections: SignoffSection[] = [
  {
    id: "co",
    code: "CO",
    label: "Client Onboarding",
    isExpanded: true,
    items: [
      { id: "co-1", label: "Client Acceptance and Continuance" },
      { id: "co-2", label: "Independence" },
      { id: "co-3", label: "Knowledge of Client Business" },
      { id: "co-4", label: "Planning" },
      { id: "co-5", label: "Engagement Letter" },
      { id: "co-6", label: "Management Responsibility" },
      { id: "co-7", label: "Withdrawal" },
    ],
  },
  {
    id: "do",
    code: "DO",
    label: "Documents",
    isExpanded: false,
    items: [
      { id: "do-1", label: "Financial Statements" },
      { id: "do-2", label: "Tax Returns" },
      { id: "do-3", label: "Bank Statements" },
      { id: "do-4", label: "Contracts & Agreements" },
    ],
  },
  {
    id: "tb",
    code: "TB",
    label: "Trial Balance & Adj. Entries",
    isExpanded: false,
    items: [
      { id: "tb-1", label: "Trial Balance Import" },
      { id: "tb-2", label: "Adjusting Entries Review" },
      { id: "tb-3", label: "Final Trial Balance" },
    ],
  },
  {
    id: "pr",
    code: "PR",
    label: "Procedures",
    isExpanded: false,
    items: [
      { id: "pr-1", label: "Audit Procedures" },
      { id: "pr-2", label: "Risk Assessment" },
      { id: "pr-3", label: "Substantive Testing" },
    ],
  },
  {
    id: "fs",
    code: "FS",
    label: "Financial Statements",
    isExpanded: false,
    items: [
      { id: "fs-1", label: "Balance Sheet" },
      { id: "fs-2", label: "Income Statement" },
      { id: "fs-3", label: "Cash Flow Statement" },
      { id: "fs-4", label: "Notes to Financial Statements" },
    ],
  },
  {
    id: "so",
    code: "SO",
    label: "Completion & Signoffs",
    isExpanded: false,
    items: [
      { id: "so-1", label: "Completion Checklist" },
      { id: "so-2", label: "Partner Review" },
      { id: "so-3", label: "File Archiving" },
    ],
  },
];

// Avatar placeholder component
function PreparerAvatar({ name, status }: { name: string; status: Preparer["status"] }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-9 h-9 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center">
        <svg viewBox="0 0 36 36" fill="none" className="w-full h-full">
          <circle cx="18" cy="14" r="7" fill="#c9cdd4" />
          <ellipse cx="18" cy="30" rx="12" ry="8" fill="#c9cdd4" />
        </svg>
      </div>
      <span className="text-[10px] text-foreground">{name}</span>
    </div>
  );
}

// Signoff icon button
function SignoffButton({ status }: { status: Preparer["status"] }) {
  const isRejected = status === "rejected";
  return (
    <div
      className={cn(
        "w-9 h-9 rounded-xl border-2 flex items-center justify-center",
        isRejected
          ? "border-destructive/60 bg-destructive/10"
          : "border-border bg-card"
      )}
    >
      {isRejected ? (
        <XSquare className="w-5 h-5 text-destructive" />
      ) : (
        <CheckSquare className="w-5 h-5 text-foreground" />
      )}
    </div>
  );
}

interface SignoffsOverlayProps {
  open: boolean;
  onClose: () => void;
  anchorLeft: number; // pixel offset from left (sidebar width)
}

export function SignoffsOverlay({ open, onClose, anchorLeft }: SignoffsOverlayProps) {
  const [sections, setSections] = useState<SignoffSection[]>(initialSections);
  // signoffState[sectionId][itemId][preparerId] = boolean
  const [signoffState, setSignoffState] = useState<Record<string, Record<string, Record<string, boolean>>>>(() => {
    const state: Record<string, Record<string, Record<string, boolean>>> = {};
    initialSections.forEach(sec => {
      state[sec.id] = {};
      sec.items.forEach(item => {
        state[sec.id][item.id] = { p1: false, p2: true, p3: false };
      });
    });
    return state;
  });

  const toggleSection = (sectionId: string) => {
    setSections(prev =>
      prev.map(s => s.id === sectionId ? { ...s, isExpanded: !s.isExpanded } : s)
    );
  };

  const toggleSignoff = (sectionId: string, itemId: string, preparerId: string) => {
    setSignoffState(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [itemId]: {
          ...prev[sectionId]?.[itemId],
          [preparerId]: !prev[sectionId]?.[itemId]?.[preparerId],
        },
      },
    }));
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Overlay panel */}
      <div
        className="fixed top-0 bottom-0 z-50 flex flex-col shadow-2xl"
        style={{ left: anchorLeft, width: 340 }}
      >
        <div className="flex flex-col h-full bg-background border-r border-border rounded-tr-2xl rounded-br-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-background shrink-0">
            <span className="text-sm font-semibold text-foreground">Signoffs</span>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Preparer header row */}
          <div className="flex border-b border-border bg-muted/40 shrink-0">
            {/* Section label column */}
            <div className="flex-1 min-w-0 p-2" />
            {/* Preparer columns */}
            {preparers.map(p => (
              <div key={p.id} className="w-[90px] flex flex-col items-center gap-1.5 py-2 shrink-0">
                <PreparerAvatar name={p.name} status={p.status} />
                <SignoffButton status={p.status} />
              </div>
            ))}
          </div>

          {/* Sections list */}
          <div className="flex-1 overflow-y-auto">
            {sections.map((section) => (
              <div key={section.id}>
                {/* Section header row */}
                <div
                  className="flex items-center border-b border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 px-3 py-2">
                    <svg
                      className={cn("h-3 w-3 text-foreground transition-transform shrink-0", section.isExpanded && "rotate-90")}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-xs font-bold text-primary">{section.code}</span>
                    <span className="text-xs font-medium text-foreground truncate">{section.label}</span>
                  </div>
                  {/* Empty cells for preparers */}
                  {preparers.map(p => (
                    <div key={p.id} className="w-[90px] shrink-0" />
                  ))}
                </div>

                {/* Section items */}
                {section.isExpanded && section.items.map((item, idx) => {
                  const isLastInSection = idx === section.items.length - 1;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center border-b border-border/50 hover:bg-muted/20 transition-colors",
                        isLastInSection && "border-b-border"
                      )}
                    >
                      {/* Item label */}
                      <div className="flex-1 min-w-0 px-3 py-2.5 pl-7">
                        <span className="text-xs text-foreground truncate block">{item.label}</span>
                      </div>
                      {/* Preparer checkboxes */}
                      {preparers.map(p => {
                        const checked = signoffState[section.id]?.[item.id]?.[p.id] ?? false;
                        return (
                          <div key={p.id} className="w-[90px] shrink-0 flex items-center justify-center py-2.5">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleSignoff(section.id, item.id, p.id)}
                              className="h-5 w-5 rounded border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
