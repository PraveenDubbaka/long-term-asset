import { useState, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Info,
  FileSpreadsheet,
  Download,
  Save,
  RefreshCw,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";
import lukaIdle from "@/assets/luka-idle.gif";
import BottomPrompter from "./BottomPrompter";

const FONT = "'DM Sans', system-ui, sans-serif";

interface Row {
  accNo: string;
  description: string;
  category: string;
  method: string;
  halfYearRule: string;
  rate: string;
  usefulLife: string;
  residualValue: string;
  estimatedProduction: string;
  unitsProduced: string;
  remainingLife: string;
}

const ROWS: Row[] = [
  {
    accNo: "",
    description: "Furniture and Equipment",
    category: "Furniture and Fi…",
    method: "Decline",
    halfYearRule: "Yes",
    rate: "20.00",
    usefulLife: "0.00",
    residualValue: "0.00",
    estimatedProduction: "0.00",
    unitsProduced: "0.00",
    remainingLife: "0.00",
  },
  {
    accNo: "1501",
    description: "Fixed Assets:Computer and La…",
    category: "Computer Equi…",
    method: "Decline",
    halfYearRule: "Yes",
    rate: "55.00",
    usefulLife: "0.00",
    residualValue: "0.00",
    estimatedProduction: "0.00",
    unitsProduced: "0.00",
    remainingLife: "0.00",
  },
];

interface ColDef {
  key: keyof Row;
  label: string | string[];
  align?: "left" | "right";
  type?: "select" | "input";
}

const COLUMNS: ColDef[] = [
  { key: "accNo", label: "Acc No", align: "left" },
  { key: "description", label: "Description", align: "left" },
  { key: "category", label: "Category", align: "left", type: "select" },
  { key: "method", label: "Method", align: "left", type: "select" },
  { key: "halfYearRule", label: ["Half Year", "Rule"], align: "left", type: "select" },
  { key: "rate", label: "Rate(%)", align: "right", type: "input" },
  { key: "usefulLife", label: ["Useful Life", "(in years)"], align: "right", type: "input" },
  { key: "residualValue", label: "Residual Value", align: "right", type: "input" },
  { key: "estimatedProduction", label: ["Estimated", "Production"], align: "right", type: "input" },
  { key: "unitsProduced", label: "Units Produced", align: "right", type: "input" },
  { key: "remainingLife", label: ["Remaining", "Life (in", "years)"], align: "right", type: "input" },
];

const CapitalAssetAmortizationView = () => {
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
              Kindly confirm the amortization inputs to generate the amortization schedule
              accurately.
            </p>

            {/* Table */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mt-5 rounded-[12px] overflow-hidden"
              style={{
                background: "hsl(0 0% 100%)",
                border: "1px solid hsl(220 20% 90%)",
                boxShadow: "0 1px 2px hsl(222 30% 20% / 0.03)",
                opacity: 0.85,
              }}
              aria-disabled
            >
              <div className="overflow-x-auto workspace-table-scroll">
                <table
                  className="w-full text-[13px]"
                  style={{ fontFamily: FONT, borderCollapse: "separate", borderSpacing: 0, minWidth: 1200 }}
                >
                  <thead>
                    <tr style={{ background: "hsl(220 25% 97%)" }}>
                      <th
                        className="px-3 py-3 text-left"
                        style={{
                          borderBottom: "1px solid hsl(220 20% 90%)",
                          width: 32,
                        }}
                      >
                        <input
                          type="checkbox"
                          disabled
                          className="w-3.5 h-3.5 rounded cursor-not-allowed"
                          style={{ accentColor: "hsl(265 75% 55%)" }}
                        />
                      </th>
                      {COLUMNS.map((c) => (
                        <th
                          key={c.key as string}
                          className="px-3 py-3 align-bottom font-bold whitespace-nowrap"
                          style={{
                            color: "hsl(222 35% 16%)",
                            textAlign: c.align ?? "left",
                            borderBottom: "1px solid hsl(220 20% 90%)",
                          }}
                        >
                          {Array.isArray(c.label) ? (
                            <div className="flex flex-col leading-tight">
                              {c.label.map((line, i) => (
                                <span key={i}>{line}</span>
                              ))}
                            </div>
                          ) : (
                            c.label
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((row, ri) => (
                      <tr key={ri}>
                        <td
                          className="px-3 py-2.5"
                          style={{
                            borderBottom:
                              ri === ROWS.length - 1
                                ? "none"
                                : "1px solid hsl(220 20% 93%)",
                          }}
                        >
                          <input
                            type="checkbox"
                            disabled
                            className="w-3.5 h-3.5 rounded cursor-not-allowed"
                            style={{ accentColor: "hsl(265 75% 55%)" }}
                          />
                        </td>
                        {COLUMNS.map((c) => {
                          const value = row[c.key];
                          const isSelect = c.type === "select";
                          const isInput = c.type === "input";
                          const cellStyle: React.CSSProperties = {
                            borderBottom:
                              ri === ROWS.length - 1
                                ? "none"
                                : "1px solid hsl(220 20% 93%)",
                          };
                          return (
                            <td
                              key={c.key as string}
                              className="px-3 py-2.5"
                              style={cellStyle}
                            >
                              {isSelect ? (
                                <div
                                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[8px]"
                                  style={{
                                    background: "hsl(220 25% 97%)",
                                    border: "1px solid hsl(220 20% 90%)",
                                    color: "hsl(222 20% 45%)",
                                    cursor: "not-allowed",
                                    minWidth: c.key === "halfYearRule" ? 80 : 140,
                                  }}
                                  aria-disabled
                                >
                                  <span className="truncate">{value}</span>
                                  <ChevronDown
                                    size={13}
                                    strokeWidth={2}
                                    style={{ color: "hsl(222 15% 55%)" }}
                                  />
                                </div>
                              ) : isInput ? (
                                <div
                                  className="px-2.5 py-1.5 rounded-[8px] tabular-nums"
                                  style={{
                                    background: "hsl(220 25% 97%)",
                                    border: "1px solid hsl(220 20% 90%)",
                                    color: "hsl(222 20% 45%)",
                                    textAlign: "right",
                                    cursor: "not-allowed",
                                    fontFamily:
                                      "'Share Tech Mono', 'DM Sans', monospace",
                                    minWidth: 90,
                                  }}
                                  aria-disabled
                                >
                                  {value}
                                </div>
                              ) : (
                                <span
                                  style={{
                                    color: "hsl(222 25% 25%)",
                                    textAlign: c.align ?? "left",
                                    display: "block",
                                  }}
                                  className="whitespace-nowrap"
                                >
                                  {value}
                                </span>
                              )}
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
              9:02 AM
            </p>
          </div>
        </div>

        {/* Second Luka message — amortization schedule */}
        <AmortizationSchedule />
      </div>
      <BottomPrompter placeholder="Ask Luka about capital asset amortization..." />
    </div>
  );
};

interface SchedChild {
  date: string;
  description: string;
  ob1: string;
  add: string;
  dis: string;
  cb1: string;
  ob2: string;
  amort: string;
  amortHasIcon?: boolean;
  cb2: string;
  cy: string;
  prevCy: string;
  monthsInUse: string;
}

interface SchedRow {
  accNo?: string;
  method?: string;
  description: string;
  ob1: string;
  add: string;
  dis: string;
  cb1: string;
  ob2: string;
  amort: string;
  amortHasIcon?: boolean;
  cb2: string;
  cy: string;
  prevCy: string;
  tb: string;
  uo: string;
  isTotal?: boolean;
  isGl?: boolean;
  isDiff?: boolean;
  expandable?: boolean;
  children?: SchedChild[];
}

const SCHED_ROWS: SchedRow[] = [
  {
    accNo: "2634",
    method: "HY",
    description: "Fixed assets: Computer and Laptops…",
    ob1: "87,500.00",
    add: "18,750.00",
    dis: "4,500.00",
    cb1: "101,750.00",
    ob2: "42,358.00",
    amort: "21,500.00",
    cb2: "64,612.00",
    cy: "37,138.00",
    prevCy: "45,142.00",
    tb: "2,350.00",
    uo: "2,350.00",
    expandable: true,
    children: [
      {
        date: "-",
        description: "Printer",
        ob1: "28,500.00",
        add: "18,750.00",
        dis: "0.00",
        cb1: "28,500.00",
        ob2: "15,833.00",
        amort: "9,500.00",
        cb2: "25,333.00",
        cy: "3,167.00",
        prevCy: "12,667.00",
        monthsInUse: "8",
      },
      {
        date: "2023-12-01",
        description: "Computer Accessories",
        ob1: "42,500.00",
        add: "0.00",
        dis: "0.00",
        cb1: "18,750.00",
        ob2: "4,500.00",
        amort: "5,729.00",
        amortHasIcon: true,
        cb2: "5,729.00",
        cy: "12,021.00",
        prevCy: "23,100.00",
        monthsInUse: "8",
      },
      {
        date: "2023-12-01",
        description: "MacBook Pro 16 inch",
        ob1: "4,500.00",
        add: "0.00",
        dis: "4,500.00",
        cb1: "42,000.00",
        ob2: "18,900.00",
        amort: "8,400.00",
        amortHasIcon: true,
        cb2: "27,300.00",
        cy: "14,700.00",
        prevCy: "9,375.00",
        monthsInUse: "8",
      },
      {
        date: "2023-12-01",
        description: "HP Laser Jet",
        ob1: "12,500.00",
        add: "0.00",
        dis: "0.00",
        cb1: "0.00",
        ob2: "3,125.00",
        amort: "3,125.00",
        amortHasIcon: true,
        cb2: "6,250.00",
        cy: "6,250.00",
        prevCy: "0.00",
        monthsInUse: "8",
      },
    ],
  },
  {
    accNo: "8200",
    method: "HY",
    description: "Furniture and Equipment",
    ob1: "93,000.00",
    add: "15,000.00",
    dis: "0.00",
    cb1: "108,000.00",
    ob2: "3,125.00",
    amort: "21,500.00",
    cb2: "35,418.00",
    cy: "72,582.00",
    prevCy: "70,353.00",
    tb: "2,350.00",
    uo: "2,350.00",
    expandable: true,
  },
  {
    accNo: "1227",
    method: "HY",
    description: "Vehicles",
    ob1: "280,000.00",
    add: "0.00",
    dis: "32,000.00",
    cb1: "248,000.00",
    ob2: "22,647.00",
    amort: "21,500.00",
    cb2: "98,050.00",
    cy: "149,950.00",
    prevCy: "194,130.00",
    tb: "2,350.00",
    uo: "2,350.00",
    expandable: true,
  },
  {
    accNo: "1827",
    method: "HY",
    description: "Leasehold Improvements",
    ob1: "230,000.00",
    add: "28,000.00",
    dis: "0.00",
    cb1: "258,000.00",
    ob2: "85,870.00",
    amort: "21,500.00",
    cb2: "104,729.00",
    cy: "152,271.00",
    prevCy: "154,063.00",
    tb: "2,350.00",
    uo: "2,350.00",
    expandable: true,
  },
  {
    accNo: "3944",
    method: "HY",
    description: "Manufacturing Equipments",
    ob1: "475,000.00",
    add: "175,000.00",
    dis: "45,000.00",
    cb1: "605,000.00",
    ob2: "75,937.00",
    amort: "21,500.00",
    cb2: "160,681.00",
    cy: "444,319.00",
    prevCy: "351,694.00",
    tb: "2,350.00",
    uo: "2,350.00",
    expandable: true,
  },
  {
    accNo: "9983",
    method: "HY",
    description: "Software",
    ob1: "141,000.00",
    add: "42,500.00",
    dis: "0.00",
    cb1: "185,000.00",
    ob2: "123,306.00",
    amort: "21,500.00",
    cb2: "120,334.00",
    cy: "63,166.00",
    prevCy: "0.00",
    tb: "2,350.00",
    uo: "2,350.00",
    expandable: true,
  },
  {
    accNo: "5463",
    method: "HY",
    description: "Other Fixed Assets",
    ob1: "27,000.00",
    add: "0.00",
    dis: "0.00",
    cb1: "2,350.00",
    ob2: "68,834.00",
    amort: "21,500.00",
    cb2: "583,724.00",
    cy: "0.00",
    prevCy: "72,666.00",
    tb: "2,350.00",
    uo: "2,350.00",
    expandable: true,
  },
  {
    description: "Total",
    ob1: "1,307,000.00",
    add: "278,750.00",
    dis: "81,500.00",
    cb1: "1,504,250.00",
    ob2: "418,952.00",
    amort: "52,920.00",
    cb2: "583,624.00",
    cy: "920,426.00",
    prevCy: "888,048.00",
    tb: "2,350.00",
    uo: "2,350.00",
    isTotal: true,
  },
  {
    description: "Balance as per GL/TB",
    ob1: "1,210,763.00",
    add: "200,00.00",
    dis: "80,000.00",
    cb1: "1,500,000.00",
    ob2: "400,000.00",
    amort: "50,000.00",
    cb2: "500,000.00",
    cy: "900,000.00",
    prevCy: "800,000.00",
    tb: "2,350.00",
    uo: "2,350.00",
    isGl: true,
  },
  {
    description: "Difference",
    ob1: "96,237.00",
    add: "78,750.00",
    dis: "1,500.00",
    cb1: "4,250.00",
    ob2: "18,952.00",
    amort: "2,920.00",
    cb2: "83,624.00",
    cy: "20,426.00",
    prevCy: "88,048.00",
    tb: "2,350.00",
    uo: "2,350.00",
    isDiff: true,
  },
];

const AmortizationSchedule = () => {
  const numCellBorder = "1px solid hsl(220 20% 93%)";
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true });

  const toggle = (i: number) =>
    setExpanded((p) => ({ ...p, [i]: !p[i] }));

  const inputBoxStyle: React.CSSProperties = {
    background: "hsl(0 0% 100%)",
    border: "1px solid hsl(220 20% 88%)",
    borderRadius: 6,
    padding: "3px 8px",
    fontFamily: "'Share Tech Mono', 'DM Sans', monospace",
    color: "hsl(222 25% 25%)",
    fontSize: 12,
    textAlign: "right" as const,
    minWidth: 80,
    display: "inline-block",
  };

  const EditableNum = ({
    value,
    align = "right",
    minWidth = 90,
    bold = false,
  }: {
    value: string;
    align?: "left" | "right";
    minWidth?: number;
    bold?: boolean;
  }) => {
    const [v, setV] = useState(value);
    return (
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        spellCheck={false}
        className="transition-colors focus:outline-none"
        style={{
          background: "hsl(0 0% 100%)",
          border: "1px solid hsl(220 20% 88%)",
          borderRadius: 6,
          padding: "3px 8px",
          fontFamily: "'Share Tech Mono', 'DM Sans', monospace",
          color: "hsl(222 25% 25%)",
          fontSize: 12,
          fontWeight: bold ? 700 : 500,
          textAlign: align,
          minWidth,
          width: minWidth,
          display: "inline-block",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "hsl(265 75% 55%)";
          e.currentTarget.style.boxShadow = "0 0 0 2px hsl(265 75% 55% / 0.15)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "hsl(220 20% 88%)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    );
  };


  return (
    <div className="mt-8 flex items-start gap-4">
      <div className="shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center">
        <img src={lukaIdle} alt="Luka" className="w-8 h-8 object-contain" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="text-[15px] leading-relaxed"
          style={{ color: "hsl(222 35% 16%)", fontFamily: FONT }}
        >
          Here's the amortization schedule for you
        </p>

        {/* Info banner */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mt-4 flex items-center gap-2 flex-wrap px-4 py-3 rounded-[12px] text-[13px]"
          style={{
            background: "hsl(145 60% 97%)",
            border: "1px solid hsl(145 50% 88%)",
            color: "hsl(222 25% 25%)",
            fontFamily: FONT,
          }}
        >
          <FileSpreadsheet
            size={16}
            style={{ color: "hsl(145 63% 38%)" }}
            strokeWidth={2.2}
          />
          <span>Click the download</span>
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-[8px]"
            style={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 20% 88%)" }}
          >
            <Download size={13} strokeWidth={2.2} style={{ color: "hsl(222 25% 30%)" }} />
          </span>
          <span>or save to engagement</span>
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-[8px]"
            style={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 20% 88%)" }}
          >
            <Save size={13} strokeWidth={2.2} style={{ color: "hsl(222 25% 30%)" }} />
          </span>
          <span>button below to view curated Excel file equipped with detailed insights and built-in formulas.</span>
        </motion.div>

        {/* Schedule table */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
          className="mt-4 rounded-[12px] overflow-hidden"
          style={{
            background: "hsl(0 0% 100%)",
            border: "1px solid hsl(220 20% 90%)",
            boxShadow: "0 1px 2px hsl(222 30% 20% / 0.03)",
          }}
        >
          <div className="overflow-x-auto workspace-table-scroll">
            <table
              className="text-[13px]"
              style={{ fontFamily: FONT, borderCollapse: "separate", borderSpacing: 0, minWidth: 1700, width: "100%" }}
            >
              <thead>
                {/* Group headers */}
                <tr style={{ background: "hsl(220 25% 97%)" }}>
                  <th style={{ borderBottom: numCellBorder }} className="px-3 py-2.5" colSpan={3}></th>
                  <th
                    colSpan={4}
                    className="px-3 py-2.5 text-center font-bold text-[12.5px] tracking-wide"
                    style={{
                      color: "hsl(222 35% 16%)",
                      borderBottom: numCellBorder,
                      borderLeft: numCellBorder,
                      borderRight: numCellBorder,
                    }}
                  >
                    Original Cost
                  </th>
                  <th
                    colSpan={3}
                    className="px-3 py-2.5 text-center font-bold text-[12.5px] tracking-wide"
                    style={{
                      color: "hsl(222 35% 16%)",
                      borderBottom: numCellBorder,
                      borderRight: numCellBorder,
                    }}
                  >
                    Accumulated Amortization
                  </th>
                  <th
                    colSpan={2}
                    className="px-3 py-2.5 text-center font-bold text-[12.5px] tracking-wide"
                    style={{ color: "hsl(222 35% 16%)", borderBottom: numCellBorder, borderRight: numCellBorder }}
                  >
                    Net Book Value
                  </th>
                  <th
                    className="px-3 py-2.5 text-right font-bold text-[12.5px] tracking-wide"
                    style={{ color: "hsl(222 35% 16%)", borderBottom: numCellBorder, borderRight: numCellBorder }}
                  >
                    {""}
                  </th>
                  <th
                    className="px-3 py-2.5 text-right font-bold text-[12.5px] tracking-wide"
                    style={{ color: "hsl(222 35% 16%)", borderBottom: numCellBorder }}
                  >
                    {""}
                  </th>
                </tr>
                {/* Column headers */}
                <tr style={{ background: "hsl(220 25% 97%)" }}>
                  <th style={{ borderBottom: numCellBorder, width: 28 }} />
                  <th
                    className="px-3 py-3 text-left font-bold whitespace-nowrap"
                    style={{ color: "hsl(222 35% 16%)", borderBottom: numCellBorder }}
                  >
                    Acc No / Method
                  </th>
                  <th
                    className="px-3 py-3 text-left font-bold whitespace-nowrap"
                    style={{ color: "hsl(222 35% 16%)", borderBottom: numCellBorder }}
                  >
                    Description
                  </th>
                  {[
                    { lines: ["Opening Balance", "(OB1)"], hasInfo: true },
                    { lines: ["Additions/", "Adjustments (ADD)"], hasInfo: true },
                    { lines: ["Disposition/", "Adjustments (DIS)"], hasInfo: true },
                    { lines: ["Closing Balance", "(CB1)"], hasInfo: true },
                    { lines: ["Opening Balance", "(OB2)"], hasInfo: true },
                    { lines: ["Amortization", "(A)"], hasInfo: true },
                    { lines: ["Closing Balance", "(CB2)"], hasInfo: true },
                    { lines: ["Current Year", "(CY)"], hasInfo: true },
                    { lines: ["Previous Year", "(CY)"], hasInfo: false },
                    { lines: ["Trial Balance", "(TB)"], hasInfo: true },
                    { lines: ["Under/Over", "(UO)"], hasInfo: true },
                  ].map((h, i) => (
                    <th
                      key={i}
                      className="px-3 py-3 font-bold whitespace-nowrap"
                      style={{
                        color: "hsl(222 35% 16%)",
                        borderBottom: numCellBorder,
                        textAlign: "right",
                      }}
                    >
                      <div className="flex flex-col items-end leading-tight gap-0.5">
                        {h.lines.map((l, li) => (
                          <span key={li}>{l}</span>
                        ))}
                        {h.hasInfo && (
                          <Info
                            size={12}
                            strokeWidth={2.2}
                            style={{ color: "hsl(220 95% 50%)" }}
                            className="mt-0.5"
                          />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCHED_ROWS.map((r, ri) => {
                  const isSummary = r.isTotal || r.isGl || r.isDiff;
                  const rowBg = r.isTotal
                    ? "hsl(220 25% 98%)"
                    : "transparent";
                  const isOpen = !!expanded[ri];
                  const summaryTopBorder = r.isTotal
                    ? "2px solid hsl(222 35% 16%)"
                    : undefined;
                  return (
                    <Fragment key={ri}>
                      <tr style={{ background: rowBg }}>
                        <td
                          className="px-2 py-2.5 align-middle"
                          style={{
                            borderBottom: numCellBorder,
                            borderTop: summaryTopBorder,
                            width: 28,
                            cursor: r.expandable ? "pointer" : "default",
                          }}
                          onClick={() => r.expandable && toggle(ri)}
                        >
                          {r.expandable && (
                            <motion.div
                              animate={{ rotate: isOpen ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ display: "inline-flex" }}
                            >
                              <ChevronRight
                                size={14}
                                strokeWidth={2.2}
                                style={{ color: "hsl(222 15% 55%)" }}
                              />
                            </motion.div>
                          )}
                        </td>
                        <td
                          className="px-3 py-2.5 whitespace-nowrap"
                          style={{ borderBottom: numCellBorder, borderTop: summaryTopBorder }}
                        >
                          {!isSummary && (
                            <div className="flex items-center gap-2">
                              {r.accNo && (
                                <span
                                  style={{
                                    color: "hsl(222 25% 25%)",
                                    fontFamily:
                                      "'Share Tech Mono', 'DM Sans', monospace",
                                    fontWeight: 700,
                                  }}
                                >
                                  {r.accNo}
                                </span>
                              )}
                              {r.method && (
                                <span
                                  className="inline-flex items-center px-1.5 py-0.5 rounded-[6px] text-[11px] font-bold"
                                  style={{
                                    background: "hsl(220 20% 96%)",
                                    border: "1px solid hsl(220 20% 88%)",
                                    color: "hsl(222 25% 30%)",
                                    letterSpacing: "0.04em",
                                  }}
                                >
                                  {r.method}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td
                          className="px-3 py-2.5 whitespace-nowrap"
                          style={{
                            borderBottom: numCellBorder,
                            borderTop: summaryTopBorder,
                            color: "hsl(222 25% 25%)",
                            fontWeight: isSummary ? 700 : 700,
                          }}
                        >
                          {r.description}
                        </td>
                        {[
                          r.ob1, r.add, r.dis, r.cb1,
                          r.ob2, r.amort, r.cb2,
                          r.cy, r.prevCy, r.tb, r.uo,
                        ].map((v, ci) => (
                          <td
                            key={ci}
                            className="px-3 py-2.5 text-right whitespace-nowrap"
                            style={{
                              borderBottom: numCellBorder,
                              borderTop: summaryTopBorder,
                            }}
                          >
                            <EditableNum value={v} bold={isSummary} />
                          </td>
                        ))}

                      </tr>

                      {/* Expanded children */}
                      <AnimatePresence initial={false}>
                        {isOpen && r.expandable && (
                          <motion.tr
                            key={`exp-${ri}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <td colSpan={14} style={{ padding: 0, background: "hsl(220 25% 98.5%)", borderBottom: numCellBorder }}>
                              <div style={{ padding: "0" }}>
                                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontFamily: FONT }}>
                                  {/* Sub-header */}
                                  <thead>
                                    <tr style={{ background: "hsl(220 25% 97%)" }}>
                                      <th style={{ width: 28, borderBottom: numCellBorder }} />
                                      <th
                                        className="px-3 py-2 text-left text-[11.5px] font-semibold whitespace-nowrap"
                                        style={{ color: "hsl(222 20% 45%)", borderBottom: numCellBorder }}
                                      >
                                        Date
                                      </th>
                                      <th style={{ borderBottom: numCellBorder }} />
                                      <th colSpan={8} style={{ borderBottom: numCellBorder }} />
                                      <th
                                        className="px-3 py-2 text-right text-[11.5px] font-semibold whitespace-nowrap"
                                        style={{ color: "hsl(222 20% 45%)", borderBottom: numCellBorder }}
                                      >
                                        Months in Use
                                      </th>
                                      <th
                                        className="px-3 py-2 text-right text-[11.5px] font-semibold whitespace-nowrap"
                                        style={{ color: "hsl(222 20% 45%)", borderBottom: numCellBorder, paddingRight: 16 }}
                                      >
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(r.children ?? []).map((c, ci) => (
                                      <tr key={ci}>
                                        <td style={{ width: 28, borderBottom: numCellBorder }} />
                                        <td className="px-3 py-2" style={{ borderBottom: numCellBorder }}>
                                          <EditableNum value={c.date} align="left" minWidth={110} />
                                        </td>
                                        <td
                                          className="px-3 py-2 whitespace-nowrap"
                                          style={{ borderBottom: numCellBorder }}
                                        >
                                          <EditableNum value={c.description} align="left" minWidth={180} />
                                        </td>
                                        {[c.ob1, c.add, c.dis, c.cb1, c.ob2].map((v, i) => (
                                          <td
                                            key={i}
                                            className="px-3 py-2 text-right whitespace-nowrap"
                                            style={{ borderBottom: numCellBorder }}
                                          >
                                            <EditableNum value={v} />
                                          </td>
                                        ))}
                                        {/* Amortization with input + optional icon */}
                                        <td
                                          className="px-3 py-2 text-right whitespace-nowrap"
                                          style={{ borderBottom: numCellBorder }}
                                        >
                                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                            <EditableNum value={c.amort} />
                                            {c.amortHasIcon && (
                                              <span
                                                style={{
                                                  display: "inline-flex",
                                                  alignItems: "center",
                                                  justifyContent: "center",
                                                  width: 14,
                                                  height: 14,
                                                  borderRadius: 3,
                                                  background: "hsl(210 80% 50%)",
                                                  color: "hsl(0 0% 100%)",
                                                  fontSize: 9,
                                                  fontWeight: 700,
                                                }}
                                                title="System calculated"
                                              >
                                                ƒ
                                              </span>
                                            )}
                                          </span>
                                        </td>
                                        {[c.cb2, c.cy, c.prevCy].map((v, i) => (
                                          <td
                                            key={`r-${i}`}
                                            className="px-3 py-2 text-right whitespace-nowrap"
                                            style={{ borderBottom: numCellBorder }}
                                          >
                                            <EditableNum value={v} />
                                          </td>
                                        ))}
                                        <td
                                          className="px-3 py-2 text-right whitespace-nowrap"
                                          style={{ borderBottom: numCellBorder }}
                                        >
                                          <EditableNum value={c.monthsInUse} minWidth={60} />
                                        </td>

                                        <td
                                          className="px-3 py-2 text-right whitespace-nowrap"
                                          style={{ borderBottom: numCellBorder, paddingRight: 12 }}
                                        >
                                          <span className="inline-flex items-center gap-2">
                                            <button
                                              type="button"
                                              title="Add row"
                                              className="w-6 h-6 inline-flex items-center justify-center rounded-[6px] hover:bg-[hsl(220_20%_94%)]"
                                              style={{ color: "hsl(222 25% 30%)" }}
                                            >
                                              <Plus size={13} strokeWidth={2.2} />
                                            </button>
                                            <button
                                              type="button"
                                              title="Delete row"
                                              className="w-6 h-6 inline-flex items-center justify-center rounded-[6px] hover:bg-[hsl(220_20%_94%)]"
                                              style={{ color: "hsl(222 25% 30%)" }}
                                            >
                                              <Trash2 size={13} strokeWidth={2.2} />
                                            </button>
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>


        {/* Post entry prompt */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
          className="mt-4 flex items-center justify-between gap-3 flex-wrap"
        >
          <p
            className="text-[13.5px]"
            style={{ color: "hsl(222 25% 25%)", fontFamily: FONT }}
          >
            Would you like to post this as an adjustment entry? Please select{" "}
            <strong style={{ color: "hsl(222 35% 14%)" }}>Post Entry</strong> within
            the corresponding engagement to proceed.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold transition-colors hover:bg-[hsl(265_60%_96%)]"
            style={{
              background: "hsl(0 0% 100%)",
              border: "1px solid hsl(265 75% 55%)",
              color: "hsl(265 75% 45%)",
              fontFamily: FONT,
            }}
          >
            <ExternalLink size={13} strokeWidth={2.4} />
            Post Entry
          </button>
        </motion.div>

        {/* Action toolbar */}
        <div className="mt-4 flex items-center gap-2">
          {[
            { icon: Download, label: "Download" },
            { icon: Save, label: "Save to engagement" },
            { icon: RefreshCw, label: "Regenerate" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              title={label}
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

        <p
          className="mt-3 text-[11px]"
          style={{ color: "hsl(222 15% 55%)", fontFamily: FONT }}
        >
          9:03 AM
        </p>
      </div>
    </div>
  );
};

export default CapitalAssetAmortizationView;
