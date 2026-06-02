import { motion } from "framer-motion";
import { Copy, Download, FolderOpen, RefreshCw } from "lucide-react";
import lukaIdle from "@/assets/luka-idle.gif";
import BottomPrompter from "./BottomPrompter";

const FONT = "'DM Sans', system-ui, sans-serif";
const MONO = "'Share Tech Mono', 'DM Sans', monospace";

interface Row {
  customer: string;
  current: string;
  d1_30: string;
  d31_60: string;
  d61_90: string;
  d91: string;
  total: string;
  pct: string;
}

const ROWS: Row[] = [
  { customer: "15338298 CANADA INC.", current: "0.00", d1_30: "5,000.00", d31_60: "0.00", d61_90: "0.00", d91: "0.00", total: "5,000.00", pct: "3.65" },
  { customer: "15655871 Beacon Software,USA,Inc.", current: "0.00", d1_30: "11,805.95", d31_60: "0.00", d61_90: "0.00", d91: "0.00", total: "11,805.95", pct: "8.62" },
  { customer: "15655871 CANADA INC", current: "0.00", d1_30: "12,430.00", d31_60: "0.00", d61_90: "0.00", d91: "0.00", total: "12,430.00", pct: "9.08" },
  { customer: "15655871 USA Inc / eSchedule", current: "0.00", d1_30: "2,197.76", d31_60: "0.00", d61_90: "0.00", d91: "0.00", total: "2,197.76", pct: "1.61" },
  { customer: "15655871 USA Inc / MAP Software Holdings, Inc", current: "0.00", d1_30: "1,854.36", d31_60: "0.00", d61_90: "0.00", d91: "0.00", total: "1,854.36", pct: "1.35" },
  { customer: "15655871 USA Inc / Qwickly, Inc.", current: "0.00", d1_30: "2,516.73", d31_60: "0.00", d61_90: "0.00", d91: "0.00", total: "2,516.73", pct: "1.84" },
  { customer: "15655871 USA Inc./College Kickstart LLC", current: "0.00", d1_30: "3,285.73", d31_60: "0.00", d61_90: "0.00", d91: "0.00", total: "3,285.73", pct: "2.40" },
  { customer: "16148778 Canada Inc", current: "0.00", d1_30: "0.00", d31_60: "0.00", d61_90: "8,565.90", d91: "0.00", total: "8,565.90", pct: "6.26" },
  { customer: "3EMBODY Lifestyle LLC", current: "0.00", d1_30: "4,776.98", d31_60: "0.00", d61_90: "0.00", d91: "0.00", total: "4,776.98", pct: "3.49" },
  { customer: "Banack Consulting Ltd and related companies", current: "0.00", d1_30: "3,738.04", d31_60: "0.00", d61_90: "0.00", d91: "220.35", total: "3,958.39", pct: "2.89" },
  { customer: "Banack Holding Ltd", current: "0.00", d1_30: "623.00", d31_60: "0.00", d61_90: "0.00", d91: "0.00", total: "623.00", pct: "0.46" },
];

const COLS: { key: keyof Row; label: string; align: "left" | "right" }[] = [
  { key: "customer", label: "Customer", align: "left" },
  { key: "current", label: "Current", align: "right" },
  { key: "d1_30", label: "1 - 30", align: "right" },
  { key: "d31_60", label: "31 - 60", align: "right" },
  { key: "d61_90", label: "61 - 90", align: "right" },
  { key: "d91", label: "91 and over", align: "right" },
  { key: "total", label: "Total", align: "right" },
  { key: "pct", label: "Percentage (%)", align: "right" },
];

const AgedARAnalysisView = () => {
  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 w-full max-w-full md:max-w-[92%] lg:max-w-[960px] mx-auto px-6 py-8 transition-all duration-500 ease-out">
        {/* User message chip */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex items-start gap-3 px-4 py-3 rounded-[12px]"
          style={{
            background: "hsl(220 60% 98%)",
            border: "1px solid hsl(220 30% 92%)",
          }}
        >
          <div
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold"
            style={{ background: "hsl(222 25% 30%)", color: "hsl(0 0% 100%)", fontFamily: FONT }}
          >
            SM
          </div>
          <p
            className="text-[15px] leading-relaxed pt-1"
            style={{ color: "hsl(222 35% 16%)", fontFamily: FONT }}
          >
            #Aged AR Analysis
          </p>
        </motion.div>

        {/* Luka response */}
        <div className="mt-6 flex items-start gap-4">
          <div className="shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center">
            <img src={lukaIdle} alt="Luka" className="w-8 h-8 object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-[15px] leading-relaxed"
              style={{ color: "hsl(222 35% 16%)", fontFamily: FONT }}
            >
              Below is the Aged Accounts Receivable as of 2026-02-28 (From 2025-03-01 to 2026-02-28)
            </p>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mt-4 rounded-[12px] overflow-hidden"
              style={{
                background: "hsl(0 0% 100%)",
                border: "1px solid hsl(220 20% 90%)",
                boxShadow: "0 1px 2px hsl(222 30% 20% / 0.03)",
              }}
            >
              <div className="overflow-x-auto workspace-table-scroll">
                <table
                  className="w-full text-[13px]"
                  style={{ fontFamily: FONT, borderCollapse: "separate", borderSpacing: 0, minWidth: 980 }}
                >
                  <thead>
                    <tr style={{ background: "hsl(220 25% 97%)" }}>
                      {COLS.map((c) => (
                        <th
                          key={c.key as string}
                          className="px-4 py-3 font-bold whitespace-nowrap"
                          style={{
                            color: "hsl(222 35% 16%)",
                            textAlign: c.align,
                            borderBottom: "1px solid hsl(220 20% 90%)",
                          }}
                        >
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((row, ri) => (
                      <tr
                        key={ri}
                        className="transition-colors hover:bg-[hsl(220_25%_98%)]"
                      >
                        {COLS.map((c) => {
                          const value = row[c.key];
                          const isCustomer = c.key === "customer";
                          return (
                            <td
                              key={c.key as string}
                              className="px-4 py-3 whitespace-nowrap"
                              style={{
                                textAlign: c.align,
                                color: "hsl(222 25% 25%)",
                                borderBottom:
                                  ri === ROWS.length - 1
                                    ? "none"
                                    : "1px solid hsl(220 20% 93%)",
                                fontFamily: isCustomer ? FONT : MONO,
                              }}
                            >
                              {value}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            <p
              className="mt-3 text-[11px]"
              style={{ color: "hsl(222 15% 55%)", fontFamily: FONT }}
            >
              9:04 AM
            </p>
          </div>
        </div>

        {/* Second Luka message — Leadsheet B */}
        <LeadsheetBSection />
      </div>
      <BottomPrompter placeholder="Ask Luka about the aged AR analysis..." />
    </div>
  );
};

interface LSRow {
  accNo: string;
  description: string;
  final: string;
  negative?: boolean;
}

const LS_ROWS: LSRow[] = [
  { accNo: "1003", description: "Plooto Clearing (USD)", final: "(6,287.07)", negative: true },
  { accNo: "1100", description: "Accounts Receivable (A/R)", final: "77,696.10" },
  { accNo: "1101", description: "Accounts Receivable (A/R) - USD", final: "36,249.70" },
  { accNo: "1102", description: "Provision for Bad Debt", final: "(565.00)", negative: true },
];

const LeadsheetBSection = () => {
  return (
    <div className="mt-8 flex items-start gap-4">
      <div className="shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center">
        <img src={lukaIdle} alt="Luka" className="w-8 h-8 object-contain" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="text-[15px] leading-relaxed font-semibold"
          style={{ color: "hsl(222 35% 16%)", fontFamily: FONT }}
        >
          Accounts Receivable for leadsheet B
        </p>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mt-4 rounded-[12px] overflow-hidden"
          style={{
            background: "hsl(0 0% 100%)",
            border: "1px solid hsl(220 20% 90%)",
            boxShadow: "0 1px 2px hsl(222 30% 20% / 0.03)",
          }}
        >
          <div className="overflow-x-auto workspace-table-scroll">
            <table
              className="w-full text-[13px]"
              style={{ fontFamily: FONT, borderCollapse: "separate", borderSpacing: 0, minWidth: 720 }}
            >
              <thead>
                <tr style={{ background: "hsl(220 25% 97%)" }}>
                  <th
                    className="px-4 py-3 text-left font-bold whitespace-nowrap"
                    style={{ color: "hsl(222 35% 16%)", borderBottom: "1px solid hsl(220 20% 90%)", width: 140 }}
                  >
                    Acc No.
                  </th>
                  <th
                    className="px-4 py-3 text-left font-bold whitespace-nowrap"
                    style={{ color: "hsl(222 35% 16%)", borderBottom: "1px solid hsl(220 20% 90%)" }}
                  >
                    Description
                  </th>
                  <th
                    className="px-4 py-3 text-right font-bold whitespace-nowrap"
                    style={{ color: "hsl(222 35% 16%)", borderBottom: "1px solid hsl(220 20% 90%)", width: 180 }}
                  >
                    Final
                  </th>
                </tr>
              </thead>
              <tbody>
                {LS_ROWS.map((row, ri) => (
                  <tr key={ri} className="transition-colors hover:bg-[hsl(220_25%_98%)]">
                    <td
                      className="px-4 py-3 whitespace-nowrap"
                      style={{
                        color: "hsl(222 25% 25%)",
                        borderBottom: "1px solid hsl(220 20% 93%)",
                        fontFamily: MONO,
                      }}
                    >
                      {row.accNo}
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{
                        color: "hsl(222 25% 25%)",
                        borderBottom: "1px solid hsl(220 20% 93%)",
                        fontFamily: FONT,
                      }}
                    >
                      {row.description}
                    </td>
                    <td
                      className="px-4 py-3 text-right whitespace-nowrap"
                      style={{
                        color: row.negative ? "hsl(0 70% 45%)" : "hsl(222 25% 25%)",
                        borderBottom: "1px solid hsl(220 20% 93%)",
                        fontFamily: MONO,
                      }}
                    >
                      {row.final}
                    </td>
                  </tr>
                ))}
                {/* Total row */}
                <tr style={{ background: "hsl(220 25% 98%)" }}>
                  <td
                    className="px-4 py-3 font-bold"
                    style={{ color: "hsl(222 35% 16%)", fontFamily: FONT }}
                  >
                    Total
                  </td>
                  <td />
                  <td
                    className="px-4 py-3 text-right font-bold whitespace-nowrap"
                    style={{ color: "hsl(222 35% 16%)", fontFamily: MONO }}
                  >
                    107,093.73
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Difference */}
        <div
          className="mt-3 text-right text-[13px] font-semibold tabular-nums"
          style={{ color: "hsl(0 75% 50%)", fontFamily: MONO }}
        >
          (29,806.95)
        </div>

        {/* Action toolbar */}
        <div className="mt-4 flex items-center gap-2">
          {[
            { icon: Copy, label: "Copy" },
            { icon: Download, label: "Download" },
            { icon: FolderOpen, label: "Save to engagement" },
            { icon: RefreshCw, label: "Regenerate" },
          ].map((b, i) => {
            const Icon = b.icon;
            return (
              <button
                key={i}
                aria-label={b.label}
                title={b.label}
                className="w-9 h-9 inline-flex items-center justify-center rounded-[10px] transition-colors hover:bg-[hsl(220_25%_96%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(265_75%_55%)]"
                style={{
                  background: "hsl(0 0% 100%)",
                  border: "1px solid hsl(220 20% 88%)",
                  color: "hsl(222 25% 30%)",
                }}
              >
                <Icon size={15} strokeWidth={2} />
              </button>
            );
          })}
        </div>

        <p
          className="mt-3 text-[11px]"
          style={{ color: "hsl(222 15% 55%)", fontFamily: FONT }}
        >
          9:05 AM
        </p>
      </div>
    </div>
  );
};


export default AgedARAnalysisView;
