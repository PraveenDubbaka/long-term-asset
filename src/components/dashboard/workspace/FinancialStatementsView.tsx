import { motion } from "framer-motion";
import {
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

const ThunderDocIcon = ({ size = 16, color = "hsl(200 90% 50%)" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M12 11l-2 4h3l-2 4" />
  </svg>
);

const SECTIONS = [
  "Cover Page",
  "Table of Contents",
  "Balance Sheet",
  "Statement of Income and Loss",
  "Statement of Cashflows",
  "Notes to Financial Information",
  "Schedules",
];

interface Props {
  activePreview?: string | null;
  onPreview?: (section: string) => void;
}

const FinancialStatementsView = ({ activePreview = null, onPreview }: Props = {}) => {

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
              I have generated the Financial Statement template as per the data analyzed and
              applied the default settings fetched. Review the setting to regenerate the
              statements accordingly or upload your own.
            </p>

            <div className="mt-4 flex flex-col gap-2.5">
              {SECTIONS.map((label, idx) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.05, ease: "easeOut" }}
                  className="flex items-center justify-between px-4 py-3 rounded-[14px] transition-all hover:border-[hsl(265_40%_85%)] hover:shadow-[0_2px_10px_hsl(265_40%_60%/0.08)]"
                  style={{
                    background: "hsl(0 0% 100%)",
                    border: "1px solid hsl(220 20% 92%)",
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="shrink-0 w-9 h-9 rounded-[10px] flex items-center justify-center"
                      style={{
                        background: "hsl(200 100% 97%)",
                        border: "1px solid hsl(200 90% 88%)",
                      }}
                    >
                      <ThunderDocIcon size={16} color="hsl(200 90% 50%)" />
                    </div>
                    <span
                      className="text-[14px] font-semibold truncate"
                      style={{ color: "hsl(222 35% 16%)", fontFamily: FONT }}
                    >
                      {label}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onPreview?.(label)}
                    title={`Preview ${label}`}
                    className="shrink-0 w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[hsl(220_20%_94%)]"
                    style={{
                      border: activePreview === label ? "1px solid hsl(207 71% 38%)" : "1px solid hsl(220 20% 88%)",
                      background: activePreview === label ? "hsl(207 71% 38%)" : "hsl(220 30% 98%)",
                      color: activePreview === label ? "hsl(0 0% 100%)" : "hsl(207 71% 38%)",
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
              transition={{ duration: 0.45, delay: 0.45, ease: "easeOut" }}
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
      <BottomPrompter placeholder="Ask Luka about the financial statements..." />
      </div>
    </div>
  );
};

export default FinancialStatementsView;
