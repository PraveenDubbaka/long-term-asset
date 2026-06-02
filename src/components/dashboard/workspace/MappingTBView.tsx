import { motion } from "framer-motion";
import {
  Sparkles,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Copy,
  Download,
  Archive,
  Share2,
  RefreshCw,
} from "lucide-react";
import lukaIdle from "@/assets/luka-idle.gif";
import BottomPrompter from "./BottomPrompter";

const FONT = "'DM Sans', system-ui, sans-serif";

const METRICS = [
  { value: "150", label: "Total TB Accounts" },
  { value: "8", label: "Unmapped Identified" },
  { value: "7", label: "Auto-mapped by Luka" },
];

const MappingTBView = () => {
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
              Based on behavioral mapping, I have classified and mapped the highlighted rows
              from how your team has historically grouped similar accounts.
            </p>

            {/* Metrics row */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              {METRICS.map((m, idx) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.08, ease: "easeOut" }}
                  className="px-4 py-3.5 rounded-[12px]"
                  style={{
                    background: "hsl(0 0% 100%)",
                    border: "1px solid hsl(220 20% 90%)",
                    boxShadow: "0 1px 2px hsl(222 30% 20% / 0.03)",
                  }}
                >
                  <p
                    className="text-[26px] font-bold leading-none"
                    style={{
                      color: "hsl(222 35% 14%)",
                      fontFamily: "'Share Tech Mono', 'DM Sans', monospace",
                    }}
                  >
                    {m.value}
                  </p>
                  <p
                    className="mt-2 text-[12.5px]"
                    style={{ color: "hsl(222 15% 50%)", fontFamily: FONT }}
                  >
                    {m.label}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Summary card */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-4 p-5 rounded-[16px]"
              style={{
                background:
                  "linear-gradient(135deg, hsl(265 60% 97%) 0%, hsl(220 60% 98%) 100%)",
                border: "1px solid hsl(265 40% 92%)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="shrink-0 w-10 h-10 rounded-[10px] flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(265 75% 55%) 0%, hsl(220 90% 55%) 100%)",
                    boxShadow: "0 4px 12px -2px hsl(265 75% 55% / 0.40)",
                  }}
                >
                  <Sparkles size={16} style={{ color: "hsl(0 0% 100%)" }} strokeWidth={2.4} />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[14px] font-bold"
                    style={{ color: "hsl(222 35% 14%)", fontFamily: FONT }}
                  >
                    Summary
                  </p>
                  <p
                    className="mt-2 text-[14px] leading-relaxed"
                    style={{ color: "hsl(222 25% 25%)", fontFamily: FONT }}
                  >
                    I fetched <strong>150 trial balance accounts</strong> from QuickBooks and
                    identified <strong>8 unmapped accounts</strong>. Using behavioral mapping
                    from how your team has historically grouped similar accounts, I auto-mapped{" "}
                    <strong>7 of them</strong> with high confidence. After applying the
                    auto-mapping, total debits and total credits both equal{" "}
                    <strong>$2,847,392.45</strong> — the trial balance is{" "}
                    <strong>fully reconciled</strong> with zero variance.
                  </p>

                  <ul className="mt-4 flex flex-col gap-2">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2
                        size={16}
                        style={{ color: "hsl(145 63% 42%)" }}
                        strokeWidth={2}
                        className="shrink-0 mt-0.5"
                      />
                      <span
                        className="text-[13.5px]"
                        style={{ color: "hsl(222 25% 28%)", fontFamily: FONT }}
                      >
                        Debit and credit columns match exactly after auto-mapping
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2
                        size={16}
                        style={{ color: "hsl(145 63% 42%)" }}
                        strokeWidth={2}
                        className="shrink-0 mt-0.5"
                      />
                      <span
                        className="text-[13.5px]"
                        style={{ color: "hsl(222 25% 28%)", fontFamily: FONT }}
                      >
                        7 accounts mapped using prior engagement patterns
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <TrendingUp
                        size={16}
                        style={{ color: "hsl(265 75% 55%)" }}
                        strokeWidth={2}
                        className="shrink-0 mt-0.5"
                      />
                      <span
                        className="text-[13.5px]"
                        style={{ color: "hsl(222 25% 28%)", fontFamily: FONT }}
                      >
                        Mapping accuracy:{" "}
                        <strong style={{ color: "hsl(222 35% 14%)" }}>87.5%</strong>{" "}
                        <span style={{ color: "hsl(222 15% 50%)" }}>auto-resolved (7/8)</span>
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <AlertCircle
                        size={16}
                        style={{ color: "hsl(28 85% 50%)" }}
                        strokeWidth={2}
                        className="shrink-0 mt-0.5"
                      />
                      <span
                        className="text-[13.5px]"
                        style={{ color: "hsl(222 25% 28%)", fontFamily: FONT }}
                      >
                        <strong style={{ color: "hsl(222 35% 14%)" }}>1 account</strong> remains
                        pending — requires manual review before sign-off
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Action toolbar */}
            <div className="mt-4 flex items-center gap-2">
              {[
                { icon: Copy, label: "Copy", active: true },
                { icon: Download, label: "Download", active: true },
                { icon: Archive, label: "Archive", active: true },
                { icon: Share2, label: "Share", active: true },
                { icon: RefreshCw, label: "Regenerate", active: true },
              ].map(({ icon: Icon, label, active }) => (
                <button
                  key={label}
                  type="button"
                  title={label}
                  disabled={!active}
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[hsl(220_20%_94%)] disabled:cursor-not-allowed"
                  style={{
                    border: "1px solid hsl(220 20% 88%)",
                    background: "hsl(0 0% 100%)",
                    color: active ? "hsl(222 25% 30%)" : "hsl(220 15% 75%)",
                  }}
                >
                  <Icon size={13} strokeWidth={2.2} />
                </button>
              ))}
            </div>

            <p
              className="mt-3 text-[11px]"
              style={{ color: "hsl(222 15% 55%)", fontFamily: FONT }}
            >
              9:02 AM
            </p>
          </div>
        </div>
      </div>
      <BottomPrompter placeholder="Ask Luka about the trial balance mapping..." />
    </div>
  );
};

export default MappingTBView;
