import { motion } from "framer-motion";
import {
  FileText,
  Eye,
  Sparkles,
  FileText as FileTextIcon,
  UploadCloud,
  Copy,
  Download,
  Archive,
  Share2,
  RefreshCw,
} from "lucide-react";
import lukaIdle from "@/assets/luka-idle.gif";
import BottomPrompter from "./BottomPrompter";

const FONT = "'DM Sans', system-ui, sans-serif";

interface Note {
  title: string;
  description?: string;
}

// Standard CSRS 4200 Compilation Engagement notes
const NOTES: Note[] = [
  { title: "Nature of Operations" },
  { title: "Basis of Accounting" },
  { title: "Compilation Engagement" },
  { title: "Summary of Significant Accounting Policies" },
  { title: "Cash and Cash Equivalents" },
  { title: "Accounts Receivable", description: "Trade receivables net of allowance for doubtful accounts" },
  { title: "Inventory", description: "Inventory balance exists; discloses valuation method (lower of cost/NRV, FIFO, avg cost)" },
  { title: "Capital Assets", description: "Detected fixed asset balances; schedule shows cost, accumulated depreciation, net book value" },
  { title: "Accounts Payable and Accrued Liabilities" },
  { title: "Long-Term Debt" },
  { title: "Income Taxes" },
  { title: "Share Capital" },
  { title: "Related Party Transactions" },
  { title: "Commitments and Contingencies" },
  { title: "Subsequent Events" },
  { title: "Comparative Figures" },
];

interface Props {
  activePreview?: string | null;
  onPreview?: (title: string) => void;
}

const NotesGeneratorView = ({ activePreview = null, onPreview }: Props = {}) => {
  return (
    <div className="flex-1 flex min-w-0 overflow-hidden">
      <div className="flex-1 min-w-0 min-h-full flex flex-col overflow-y-auto">
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
              I have generated the standard CSRS 4200 Notes to Financial Information as per the
              data analyzed and applied the default disclosures. Preview any note to review or
              edit before saving, downloading, or sharing with the client.
            </p>

            <div className="mt-4 flex flex-col gap-2.5">
              {NOTES.map((note, idx) => (
                <motion.div
                  key={note.title}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.3), ease: "easeOut" }}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-[14px] transition-all hover:border-[hsl(145_50%_80%)] hover:shadow-[0_2px_10px_hsl(145_50%_60%/0.08)]"
                  style={{
                    background: "hsl(0 0% 100%)",
                    border: "1px solid hsl(220 20% 92%)",
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="shrink-0 w-9 h-9 rounded-[10px] flex items-center justify-center"
                      style={{
                        background: "hsl(145 60% 95%)",
                        border: "1px solid hsl(145 50% 82%)",
                      }}
                    >
                      <FileText
                        size={16}
                        strokeWidth={2}
                        style={{ color: "hsl(145 60% 40%)" }}
                      />
                    </div>
                    <div className="min-w-0 flex-1 flex items-baseline gap-2 flex-wrap">
                      <span
                        className="text-[14px] font-semibold"
                        style={{ color: "hsl(222 35% 16%)", fontFamily: FONT }}
                      >
                        {note.title}
                      </span>
                      {note.description && (
                        <span
                          className="text-[12.5px] italic"
                          style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
                        >
                          {note.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onPreview?.(note.title)}
                    title={`Preview ${note.title}`}
                    className="shrink-0 w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[hsl(220_20%_94%)]"
                    style={{
                      border: activePreview === note.title ? "1px solid hsl(207 71% 38%)" : "1px solid hsl(220 20% 88%)",
                      background: activePreview === note.title ? "hsl(207 71% 38%)" : "hsl(220 30% 98%)",
                      color: activePreview === note.title ? "hsl(0 0% 100%)" : "hsl(207 71% 38%)",
                    }}
                  >
                    <Eye size={14} strokeWidth={2} />
                  </button>

                </motion.div>
              ))}
            </div>

            {/* Regenerate / Upload prompt card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.35, ease: "easeOut" }}
              className="mt-4 flex items-center gap-4 px-4 py-3.5 rounded-[14px]"
              style={{
                background: "linear-gradient(135deg, hsl(265 60% 97%) 0%, hsl(220 60% 98%) 100%)",
                border: "1px solid hsl(265 40% 92%)",
              }}
            >
              <div
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: "hsl(265 50% 94%)",
                  border: "1px solid hsl(265 40% 88%)",
                }}
              >
                <Sparkles size={16} strokeWidth={2} style={{ color: "hsl(265 70% 50%)" }} />
              </div>
              <p
                className="flex-1 text-[13.5px] leading-relaxed"
                style={{ color: "hsl(222 25% 25%)", fontFamily: FONT }}
              >
                Don't like what I have generated?{" "}
                <strong style={{ color: "hsl(222 35% 14%)" }}>Choose from Templates</strong> or{" "}
                <strong style={{ color: "hsl(222 35% 14%)" }}>Upload your own</strong> and I'll
                regenerate for you
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold transition-colors hover:bg-[hsl(265_50%_94%)]"
                  style={{
                    background: "hsl(0 0% 100%)",
                    border: "1px solid hsl(265 40% 88%)",
                    color: "hsl(265 70% 45%)",
                    fontFamily: FONT,
                  }}
                >
                  <FileTextIcon size={13} strokeWidth={2.2} />
                  Choose from Templates
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold transition-colors hover:bg-[hsl(265_50%_94%)]"
                  style={{
                    background: "hsl(0 0% 100%)",
                    border: "1px solid hsl(265 40% 88%)",
                    color: "hsl(265 70% 45%)",
                    fontFamily: FONT,
                  }}
                >
                  <UploadCloud size={13} strokeWidth={2.2} />
                  Upload your own
                </button>
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
          </div>
        </div>
      </div>
      <BottomPrompter placeholder="Ask Luka about the notes to financial information..." />
      </div>
    </div>
  );
};


export default NotesGeneratorView;
