import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import EditMenuDropdown from "./EditMenuDropdown";
import TellLukaVoiceOverlay from "./TellLukaVoiceOverlay";

const FONT = "'DM Sans', system-ui, sans-serif";

interface NoteBody {
  heading: string;
  paragraphs: string[];
}

const CONTENT: Record<string, NoteBody> = {
  "Nature of Operations": {
    heading: "1. Nature of Operations",
    paragraphs: [
      "ABC Pvt. Ltd. (the \"Company\") was incorporated under the Canada Business Corporations Act on January 14, 2018 and operates in the wholesale distribution sector.",
      "The Company's principal place of business is located in Toronto, Ontario, with secondary fulfillment activities carried out from a leased warehouse in Mississauga, Ontario.",
    ],
  },
  "Basis of Accounting": {
    heading: "2. Basis of Accounting",
    paragraphs: [
      "These financial statements are prepared by management in accordance with the basis of accounting disclosed in Note 3 — Summary of Significant Accounting Policies — and are intended solely for use by management and the shareholders of the Company.",
      "The basis of accounting applied in the preparation of these financial statements is the historical cost convention, with revenues recognized when earned and expenses recognized when incurred (accrual basis).",
      "These financial statements may not be suitable for any other purpose, and the Company has not made the basis of accounting available to any third party other than the intended users disclosed above.",
    ],
  },
  "Compilation Engagement": {
    heading: "3. Compilation Engagement",
    paragraphs: [
      "The accompanying financial statements have been compiled from information provided by management of ABC Pvt. Ltd.",
      "The compilation engagement was performed in accordance with Canadian Standard on Related Services (CSRS) 4200, Compilation Engagements.",
      "We have not performed an audit engagement or a review engagement in respect of these financial statements and, accordingly, we do not express an audit opinion, a review conclusion, or provide any form of assurance on these financial statements.",
      "Readers are cautioned that these financial statements may not be appropriate for their purposes.",
    ],
  },
  "Summary of Significant Accounting Policies": {
    heading: "4. Summary of Significant Accounting Policies",
    paragraphs: [
      "(a) Revenue recognition — Revenue from the sale of goods is recognized when title and risk of loss pass to the customer, the price is fixed or determinable, and collection is reasonably assured.",
      "(b) Inventory — Inventory is recorded at the lower of cost, determined on a first-in, first-out (FIFO) basis, and net realizable value.",
      "(c) Capital assets — Capital assets are recorded at cost and depreciated over their estimated useful lives using the straight-line method.",
      "(d) Income taxes — Income taxes are accounted for using the taxes payable method. Under this method, only current income tax assets and liabilities are recognized.",
      "(e) Use of estimates — The preparation of financial statements requires management to make estimates and assumptions that affect the reported amounts of assets, liabilities, revenues and expenses. Actual results may differ from these estimates.",
    ],
  },
  "Cash and Cash Equivalents": {
    heading: "5. Cash and Cash Equivalents",
    paragraphs: [
      "Cash and cash equivalents consist of cash on deposit with Canadian chartered banks and short-term highly liquid investments with original maturities of 90 days or less.",
      "As at December 31, 2024, cash and cash equivalents totalled $284,500 (2023 — $212,300). The Company holds no restricted cash balances.",
    ],
  },
  "Accounts Receivable": {
    heading: "6. Accounts Receivable",
    paragraphs: [
      "Accounts receivable represent trade amounts due from customers in the ordinary course of business and are stated net of an allowance for doubtful accounts.",
      "As at December 31, 2024: Trade receivables $342,800 · Allowance for doubtful accounts $(18,400) · Net accounts receivable $324,400 (2023 — $291,750).",
    ],
  },
  Inventory: {
    heading: "7. Inventory",
    paragraphs: [
      "Inventory is stated at the lower of cost, determined on a first-in, first-out (FIFO) basis, and net realizable value.",
      "Inventory balance as at December 31, 2024 totalled $186,500 (2023 — $172,900), comprised of finished goods held for resale. No write-downs were recorded during the year (2023 — nil).",
    ],
  },
  "Capital Assets": {
    heading: "8. Capital Assets",
    paragraphs: [
      "Capital assets are recorded at cost less accumulated depreciation. Depreciation is calculated using the straight-line method over the estimated useful lives of the assets, ranging from 3 to 25 years.",
      "Composition as at December 31, 2024 — Cost: $1,603,500 · Accumulated Depreciation: $(537,900) · Net Book Value: $1,065,600 (2023 — $968,400).",
      "Depreciation expense for the year totalled $94,200 (2023 — $87,650) and is included in operating expenses.",
    ],
  },
  "Accounts Payable and Accrued Liabilities": {
    heading: "9. Accounts Payable and Accrued Liabilities",
    paragraphs: [
      "Accounts payable and accrued liabilities consist of trade payables, accrued operating expenses, and amounts owing to government agencies.",
      "As at December 31, 2024: Trade payables $158,200 · Accrued expenses $42,750 · Government remittances payable (HST, payroll source deductions) $28,940. Total — $229,890 (2023 — $204,120).",
    ],
  },
  "Long-Term Debt": {
    heading: "10. Long-Term Debt",
    paragraphs: [
      "Long-term debt consists of a term loan from a Canadian chartered bank, bearing interest at prime plus 1.25% per annum, repayable in equal monthly principal instalments of $5,000 and maturing on October 1, 2029. The loan is secured by a general security agreement over the assets of the Company.",
      "Principal balance outstanding as at December 31, 2024: $285,000 (2023 — $345,000). Current portion: $60,000. Long-term portion: $225,000.",
    ],
  },
  "Income Taxes": {
    heading: "11. Income Taxes",
    paragraphs: [
      "The Company accounts for income taxes using the taxes payable method. Under this method, only current income tax assets and liabilities are recognized; future tax assets and liabilities arising from temporary differences are not recognized.",
      "Income tax expense for the year totalled $46,800 (2023 — $39,200), calculated at the combined federal and Ontario small business tax rate applicable to the Company.",
    ],
  },
  "Share Capital": {
    heading: "12. Share Capital",
    paragraphs: [
      "Authorized — An unlimited number of common voting shares without par value.",
      "Issued and outstanding — 1,000 common shares, fully paid, issued for total consideration of $1,000 (2023 — 1,000 common shares; $1,000). No shares were issued, repurchased, or cancelled during the year.",
    ],
  },
  "Related Party Transactions": {
    heading: "13. Related Party Transactions",
    paragraphs: [
      "During the year, the Company paid management fees of $120,000 (2023 — $108,000) to a corporation controlled by the sole shareholder. These transactions occurred in the normal course of operations and are measured at the exchange amount, which is the amount of consideration established and agreed to by the related parties.",
      "As at December 31, 2024, amounts due to the related corporation totalled $14,500 (2023 — $9,200), are non-interest bearing, unsecured, and have no fixed terms of repayment.",
    ],
  },
  "Commitments and Contingencies": {
    heading: "14. Commitments and Contingencies",
    paragraphs: [
      "The Company leases its warehouse premises under an operating lease expiring on June 30, 2028. Minimum annual lease payments are: 2025 — $48,000; 2026 — $48,000; 2027 — $50,400; 2028 — $25,200.",
      "Management is not aware of any contingent liabilities, pending litigation, or claims that would have a material effect on these financial statements.",
    ],
  },
  "Subsequent Events": {
    heading: "15. Subsequent Events",
    paragraphs: [
      "Management has evaluated events occurring between the balance sheet date and the date these financial statements were available to be issued.",
      "No material subsequent events have occurred that would require adjustment to, or disclosure in, these financial statements.",
    ],
  },
  "Comparative Figures": {
    heading: "16. Comparative Figures",
    paragraphs: [
      "Certain comparative figures have been reclassified, where applicable, to conform with the presentation adopted in the current year. These reclassifications had no impact on previously reported net income or shareholders' equity.",
    ],
  },
};

const DEFAULT_CONTENT = (title: string): NoteBody => ({
  heading: title,
  paragraphs: [
    "This is a placeholder disclosure generated by Luka. Edit manually or tell Luka what to change to refine this note in accordance with CSRS 4200.",
  ],
});

interface Props {
  title: string;
  onClose: () => void;
}

const NotesPreviewPanel = ({ title, onClose }: Props) => {
  const body = CONTENT[title] ?? DEFAULT_CONTENT(title);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);


  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 640, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{
        width: { type: "spring", stiffness: 260, damping: 30, mass: 0.9 },
        opacity: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
      }}
      className="shrink-0 h-full flex flex-col overflow-hidden"
      style={{
        background: "hsl(0 0% 100%)",
        borderLeft: "1px solid hsl(220 20% 90%)",
        maxWidth: 640,
        contain: "layout paint size",
        willChange: "width",
      }}
    >
      <div
        className="h-full flex flex-col overflow-hidden relative"
        style={{ width: 640, minWidth: 640, maxWidth: 640, flexShrink: 0 }}
      >
        {/* Header */}
        <div
          className="shrink-0 flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid hsl(220 20% 92%)" }}
        >
          <button
            type="button"
            onClick={onClose}
            title="Close preview"
            aria-label="Close preview"
            className="w-8 h-8 rounded-[10px] flex items-center justify-center transition-colors hover:bg-[hsl(220_20%_94%)]"
            style={{ border: "1px solid hsl(220 20% 88%)", color: "hsl(222 25% 30%)" }}
          ></button>
          <h2
            className="flex-1 min-w-0 truncate text-[16px] font-bold"
            style={{ color: "hsl(222 35% 14%)", fontFamily: FONT }}
          >
            {body.heading}
          </h2>
          <EditMenuDropdown variant="primary" onTellLuka={() => setVoiceOpen(true)} />
        </div>

        {/* Body */}
        <div key={reloadKey} className="flex-1 overflow-y-auto px-6 py-6">
          <div
            className="w-full rounded-[8px] flex items-center justify-center py-8 mb-6"
            style={{
              background: "hsl(220 25% 96%)",
              border: "1px solid hsl(220 20% 90%)",
            }}
          >
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="text-[18px] font-extrabold tracking-wide"
                style={{ color: "hsl(215 75% 22%)", fontFamily: FONT }}
              >
                NOTES TO FINANCIAL INFORMATION
              </div>
              <div
                className="text-[11px] uppercase tracking-[0.18em]"
                style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
              >
                Year ended December 31, 2024
              </div>
            </div>
          </div>

          <h3
            className="text-[15px] font-bold mb-3"
            style={{ color: "hsl(215 75% 22%)", fontFamily: FONT }}
          >
            {body.heading}
          </h3>
          <div className="space-y-3">
            {body.paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-[13.5px] leading-relaxed"
                style={{ color: "hsl(222 25% 25%)", fontFamily: FONT }}
              >
                {p}
              </p>
            ))}
        </div>

        <TellLukaVoiceOverlay
          open={voiceOpen}
          onClose={() => setVoiceOpen(false)}
          onSend={() => {
            setVoiceOpen(false);
            toast.success("Luka is applying your edits…");
            setTimeout(() => {
              setReloadKey((k) => k + 1);
              toast.success("Preview updated with Luka's changes");
            }, 900);
          }}
        />
      </div>
      </div>
    </motion.aside>
  );
};

export default NotesPreviewPanel;
