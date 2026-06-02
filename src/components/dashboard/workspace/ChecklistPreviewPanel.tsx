import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { toast } from "sonner";
import EditMenuDropdown from "./EditMenuDropdown";
import TellLukaVoiceOverlay from "./TellLukaVoiceOverlay";


const FONT = "'DM Sans', system-ui, sans-serif";

interface Row {
  question: string;
  answer: "Yes" | "No" | "NA";
  explanation: string;
}
interface Section {
  title: string;
  rows: Row[];
}

const CONTENT: Record<string, Section[]> = {
  "Client acceptance and continuance": [
    {
      title: "Quality Management",
      rows: [
        {
          question:
            "Determine whether accepting this engagement would contravene any of the firm's quality management policies.",
          answer: "Yes",
          explanation: "Explanation will come here",
        },
      ],
    },
    {
      title: "Engagement Risk Factors",
      rows: [
        {
          question:
            "New Clients — Indicate who in the firm has knowledge about the prospective client and whether they recommend that this entity be accepted as a new client.",
          answer: "No",
          explanation: "Explanation will come here",
        },
        {
          question:
            "New Clients — Contact the predecessor practitioner to inquire about any reasons the engagement should not be accepted. If no response is received, explain what alternative procedures were performed.",
          answer: "NA",
          explanation: "Explanation will come here",
        },
        {
          question:
            "All Clients — Make inquiries and perform web searches for any new emerging engagement risks that would impact the decision to accept or continue with this engagement.",
          answer: "Yes",
          explanation: "Explanation will come here",
        },
        {
          question:
            "All Clients — Consider any risk factors identified from other sources.",
          answer: "Yes",
          explanation: "Explanation will come here",
        },
        {
          question:
            "All Clients — Based on preliminary understanding, is there any indication that the financial information will be misleading?",
          answer: "No",
          explanation: "Explanation will come here",
        },
      ],
    },
  ],
};

const DEFAULT_SECTIONS: Section[] = [
  {
    title: "Overview",
    rows: [
      { question: "Sample question 1 for this checklist.", answer: "Yes", explanation: "Explanation will come here" },
      { question: "Sample question 2 for this checklist.", answer: "No", explanation: "Explanation will come here" },
      { question: "Sample question 3 for this checklist.", answer: "NA", explanation: "Explanation will come here" },
    ],
  },
];

interface Props {
  title: string;
  onClose: () => void;
}

const ChecklistPreviewPanel = ({ title, onClose }: Props) => {
  const sections = CONTENT[title] ?? DEFAULT_SECTIONS;
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
          {title}
        </h2>
        <EditMenuDropdown onTellLuka={() => setVoiceOpen(true)} />
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold cursor-not-allowed"
          style={{
            background: "hsl(220 20% 95%)",
            border: "1px solid hsl(220 20% 86%)",
            color: "hsl(222 15% 55%)",
            fontFamily: FONT,
          }}
        >
          <Check size={13} strokeWidth={2.4} />
          Accept
        </button>
      </div>


      {/* Body */}
      <div key={reloadKey} className="flex-1 overflow-y-auto px-5 py-4">
        <div
          className="rounded-[12px] overflow-hidden"
          style={{ border: "1px solid hsl(220 20% 90%)" }}
        >
          {sections.map((sec, si) => (
            <div key={si}>
              {/* Section header */}
              <div
                className="flex items-center gap-2.5 px-4 py-3"
                style={{
                  background: "hsl(220 25% 97%)",
                  borderBottom: "1px solid hsl(220 20% 90%)",
                  borderTop: si > 0 ? "1px solid hsl(220 20% 90%)" : undefined,
                }}
              >
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded"
                  style={{ accentColor: "hsl(265 75% 55%)" }}
                />
                <span
                  className="text-[13.5px] font-bold"
                  style={{ color: "hsl(222 35% 14%)", fontFamily: FONT }}
                >
                  {sec.title}
                </span>
              </div>

              {/* Rows */}
              {sec.rows.map((r, ri) => (
                <div
                  key={ri}
                  className="grid items-start gap-3 px-4 py-3"
                  style={{
                    gridTemplateColumns: "20px 1fr 50px 1fr",
                    borderBottom:
                      ri === sec.rows.length - 1 && si === sections.length - 1
                        ? "none"
                        : "1px solid hsl(220 20% 92%)",
                  }}
                >
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded mt-1"
                    style={{ accentColor: "hsl(265 75% 55%)" }}
                  />
                  <span
                    className="text-[12.5px] leading-relaxed"
                    style={{ color: "hsl(222 25% 25%)", fontFamily: FONT }}
                  >
                    {r.question}
                  </span>
                  <span
                    className="text-[12.5px] font-semibold"
                    style={{ color: "hsl(222 35% 14%)", fontFamily: FONT }}
                  >
                    {r.answer}
                  </span>
                  <span
                    className="text-[12.5px] italic"
                    style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
                  >
                    {r.explanation}
                  </span>
                </div>
              ))}
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

export default ChecklistPreviewPanel;
