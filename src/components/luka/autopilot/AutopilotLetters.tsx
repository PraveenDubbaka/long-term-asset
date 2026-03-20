import { useState } from "react";
import { ChevronDown, Eye, Share2, Check, Edit3, Plus, Zap } from "lucide-react";
import { Button } from "@/components/wp-ui/button";
import { cn } from "@/lib/utils";
import type { Loan } from "@/types";

function LukaIcon({ size = 12 }: { size?: number }) {
  return <Zap className="text-white" size={size} fill="white" strokeWidth={0} />;
}

interface LetterTemplate {
  id: string;
  name: string;
  type: string;
  confirmed: boolean;
}

interface Props {
  loan: Loan;
  onComplete: () => void;
}

const defaultTemplates: LetterTemplate[] = [
  { id: "lender-confirmation", name: "Lender Confirmation Request", type: "Standard — RBC Format", confirmed: false },
  { id: "accrued-interest", name: "Accrued Interest Confirmation", type: "Standard — Year-end Accrual", confirmed: false },
];

const letterPreview = `[Your Firm Letterhead]
[Date]

TO THE ATTENTION OF: [Lender Contact Name]
[Lender Name]
[Lender Address]

RE: LENDER CONFIRMATION — [Loan Reference] as at [Year-End Date]

Dear [Lender Contact],

In connection with our audit/review of the financial statements of [Client Name] for the period ending [Year-End Date], we request that you confirm the following information directly to our offices as of the balance sheet date:

1. Outstanding principal balance
2. Interest rate and accrued interest
3. Covenant compliance status
4. Any defaults or waiver conditions

Please complete and return to: [Firm Name] by [Due Date]

Yours sincerely,
[Partner Name], CPA
[Firm Name]`;

export function AutopilotLetters({ loan, onComplete }: Props) {
  const [templates, setTemplates] = useState<LetterTemplate[]>(defaultTemplates);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  const handleConfirm = (id: string) => {
    setConfirmedIds(prev => new Set([...prev, id]));
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, confirmed: true } : t));
    setReviewingId(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Luka message */}
      <div className="flex gap-3 px-4 pt-4 pb-3">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0 mt-0.5">
          <LukaIcon size={12} />
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          I've loaded the default Lender Confirmation Request and Interest Accrual Confirmation as per your engagement template for <strong>{loan.lender}</strong>.
        </p>
      </div>

      <div className="flex flex-1 gap-4 px-4 pb-4 overflow-hidden min-h-0">
        {/* Left: template list */}
        <div className="flex-1 min-w-0 overflow-y-auto space-y-3">
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Letter Templates</p>
              <span className="text-[10px] text-amber-600 font-medium bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">Required</span>
            </div>
            <div className="divide-y divide-border">
              {templates.map(template => (
                <div key={template.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground truncate">{template.name}</p>
                      {confirmedIds.has(template.id) && (
                        <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                          <Check className="w-3 h-3" /> Confirmed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 border border-border rounded-md px-2 py-1 text-xs text-muted-foreground bg-muted/20 cursor-pointer hover:bg-muted/40">
                        {template.type}
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setReviewingId(reviewingId === template.id ? null : template.id)}
                    className="flex items-center gap-1.5 text-xs text-primary font-medium hover:text-primary/80 transition-colors border border-primary/20 rounded-md px-2.5 py-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> Review
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button className="flex items-center gap-1.5 text-xs text-primary font-medium hover:text-primary/80 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add letter template
          </button>

          {/* Letter preview panel */}
          {reviewingId && (
            <div className="border border-primary/20 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2.5 bg-primary/5 border-b border-primary/20 flex items-center justify-between">
                <p className="text-xs font-semibold text-primary">Letter Preview</p>
                <div className="flex items-center gap-1">
                  <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/40 transition-colors">
                    <Share2 className="w-3 h-3" /> Share
                  </button>
                  <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/40 transition-colors">
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleConfirm(reviewingId)}
                    className="flex items-center gap-1 text-[10px] text-white font-medium bg-primary hover:bg-primary/90 px-2 py-1 rounded-md transition-colors"
                  >
                    <Check className="w-3 h-3" /> Confirm
                  </button>
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-card">
                <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed">
                  {letterPreview.replace("[Loan Reference]", loan.refNumber).replace("[Lender Name]", loan.lender)}
                </pre>
              </div>
            </div>
          )}

          <Button onClick={onComplete} className="w-full bg-primary text-primary-foreground mt-2">
            Continue to Working Papers
          </Button>
        </div>
      </div>
    </div>
  );
}
