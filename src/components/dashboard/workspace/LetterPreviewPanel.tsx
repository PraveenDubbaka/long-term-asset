import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import EditMenuDropdown from "./EditMenuDropdown";
import TellLukaVoiceOverlay from "./TellLukaVoiceOverlay";


const FONT = "'DM Sans', system-ui, sans-serif";

interface LetterContent {
  heading: string;
  date: string;
  recipient: string[];
  greeting: string;
  sections: { title: string; body: string }[];
}

const DEFAULT_CONTENT = (title: string): LetterContent => ({
  heading: title,
  date: "October 10, 2025",
  recipient: ["Client Test", "Refactor 02 Test ,", "null"],
  greeting: "Dear Client,",
  sections: [
    {
      title: "The Objective and Scope of the Review",
      body:
        'You have requested that we review the general purpose financial statements of Refactor 02 Test, which comprise the Balance sheet as at December 31, 2024 and the Statement of cashflow for the year then ended, and a summary of significant accounting policies and other explanatory information. We are pleased to confirm our acceptance and our understanding of this review engagement by means of this letter (the "Engagement"). Our review will be conducted with the objective of expressing our conclusion on the financial statements. Our conclusion, if unmodified, will be in the form "Based on our review, nothing has come to our attention that causes us to believe that these financial statements do not present fairly, in all material respects, the financial position of Refactor 02 Test as at December 31, 2024 and the results of its operations and its cash flows for the year then ended in accordance with Canadian Accounting Standards for Private Enterprises (ASPE)."',
    },
    {
      title: "Fees at Regular Billing Rates (Optional)",
      body:
        "The professional fees will be based on the Firm's regular billing rates, plus out-of-pocket disbursements and applicable taxes. Invoices will be rendered as work progresses and are payable on receipt.",
    },
    {
      title: "Management's Responsibilities",
      body:
        "Management is responsible for the preparation and fair presentation of the financial statements in accordance with the applicable financial reporting framework and for such internal control as management determines is necessary to enable the preparation of financial statements that are free from material misstatement, whether due to fraud or error.",
    },
    {
      title: "Practitioner's Responsibilities",
      body:
        "Our review will be conducted in accordance with Canadian Standard on Review Engagements (CSRS) 4200, Compilation Engagements. CSRS 4200 requires us to comply with relevant ethical requirements and plan and perform the engagement to obtain limited assurance about whether the financial statements as a whole are free from material misstatement.",
    },
  ],
});

interface Props {
  title: string;
  onClose: () => void;
}

const LetterPreviewPanel = ({ title, onClose }: Props) => {
  const content = DEFAULT_CONTENT(title);
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
            title="Close preview & open Engagement File Progress"
            aria-label="Close preview and open Engagement File Progress"
            className="w-8 h-8 rounded-[10px] flex items-center justify-center transition-colors hover:bg-[hsl(220_20%_94%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(265_75%_55%)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            style={{ border: "1px solid hsl(220 20% 88%)", color: "hsl(222 25% 30%)" }}
          ></button>
          <h2
            className="flex-1 min-w-0 truncate text-[16px] font-bold"
            style={{ color: "hsl(222 35% 14%)", fontFamily: FONT }}
          >
            {content.heading}
          </h2>
          <EditMenuDropdown variant="primary" onTellLuka={() => setVoiceOpen(true)} />

        </div>

        {/* Body */}
        <div key={reloadKey} className="flex-1 overflow-y-auto px-6 py-6">
          {/* Letterhead band */}
          <div
            className="w-full rounded-[8px] flex items-center justify-center py-10"
            style={{
              background: "hsl(220 25% 96%)",
              border: "1px solid hsl(220 20% 90%)",
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <div
                className="text-[22px] font-extrabold tracking-wide"
                style={{ color: "hsl(222 45% 22%)", fontFamily: FONT }}
              >
                FIRM LETTERHEAD
              </div>
              <div
                className="text-[11px] uppercase tracking-[0.18em]"
                style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
              >
                Chartered Professional Accountant
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <p className="text-[13.5px]" style={{ color: "hsl(222 25% 25%)", fontFamily: FONT }}>
              {content.date}
            </p>
            {content.recipient.map((line, i) => (
              <p
                key={i}
                className="text-[13.5px]"
                style={{ color: "hsl(222 25% 25%)", fontFamily: FONT }}
              >
                {line}
              </p>
            ))}
            <p className="text-[13.5px]" style={{ color: "hsl(222 25% 25%)", fontFamily: FONT }}>
              {content.greeting}
            </p>

            {content.sections.map((s, i) => (
              <div key={i} className="space-y-3 pt-2">
                <p
                  className="text-[14px] font-bold"
                  style={{ color: "hsl(222 35% 14%)", fontFamily: FONT }}
                >
                  {s.title}
                </p>
                <p
                  className="text-[13px] leading-relaxed"
                  style={{ color: "hsl(222 25% 25%)", fontFamily: FONT }}
                >
                  {s.body}
                </p>
              </div>
            ))}
          </div>
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
    </motion.aside>
  );
};

export default LetterPreviewPanel;
