import React, { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion, AnimatePresence } from "framer-motion";
import quickbooksLogo from "@/assets/quickbooks-intuit-logo.png";
import lukaLogo from "@/assets/luka-logo.png";
import EditableStatementTable from "./EditableStatementTable";
import { StmtRow } from "./EditableStatementTable";
import { buildCcStatementRows, buildBankStatementRows, buildIcStatementRows } from "./statementData";
import {
  Landmark, CreditCard, Building2, Users,
  Check, Loader2, Upload, ArrowRight, Sparkles, FileText,
  CheckCircle2, AlertCircle, Undo2, Link2, Database, Search, Shield, Trash2, FileUp,
  Copy, Download, FolderOpen, RefreshCw, FileSpreadsheet, CalendarIcon, ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DateRange } from "react-day-picker";

const unmatchedData = [
  { desc: "Management Fee - Q4", debit1: 3200, credit1: 0, debit2: 0, credit2: 0, get diff() { return (this.debit1 - this.credit1) - (this.debit2 - this.credit2); }, get amt1() { return this.debit1 - this.credit1; }, get amt2() { return this.debit2 - this.credit2; } },
  { desc: "License Royalty - Nov", debit1: 1800, credit1: 0, debit2: 0, credit2: 0, get diff() { return (this.debit1 - this.credit1) - (this.debit2 - this.credit2); }, get amt1() { return this.debit1 - this.credit1; }, get amt2() { return this.debit2 - this.credit2; } },
  { desc: "Cost Allocation Adj", debit1: 950, credit1: 0, debit2: 0, credit2: 0, get diff() { return (this.debit1 - this.credit1) - (this.debit2 - this.credit2); }, get amt1() { return this.debit1 - this.credit1; }, get amt2() { return this.debit2 - this.credit2; } },
  { desc: "Shared Services - Dec", debit1: 1100, credit1: 0, debit2: 0, credit2: 0, get diff() { return (this.debit1 - this.credit1) - (this.debit2 - this.credit2); }, get amt1() { return this.debit1 - this.credit1; }, get amt2() { return this.debit2 - this.credit2; } },
  { desc: "FX Revaluation Diff", debit1: 450, credit1: 0, debit2: 0, credit2: 0, get diff() { return (this.debit1 - this.credit1) - (this.debit2 - this.credit2); }, get amt1() { return this.debit1 - this.credit1; }, get amt2() { return this.debit2 - this.credit2; } },
];
const fmt = (n: number) => Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
type EditableAmounts = Record<number, { d1: string; c1: string; d2: string; c2: string }>;
const calcDiff = (ea: { d1: string; c1: string; d2: string; c2: string }) => {
  const d1 = parseFloat(ea.d1) || 0, c1 = parseFloat(ea.c1) || 0, d2 = parseFloat(ea.d2) || 0, c2 = parseFloat(ea.c2) || 0;
  return (d1 - c1) - (d2 - c2);
};
const initEditable = (data: { debit1: number; credit1: number; debit2: number; credit2: number }[]): EditableAmounts =>
  Object.fromEntries(data.map((item, i) => [i, { d1: item.debit1.toString(), c1: item.credit1.toString(), d2: item.debit2.toString(), c2: item.credit2.toString() }]));

// ─── Types ───
type FlowStep = "thinking-init" | "select-type" | "thinking-validate" | "thinking-deep" | "setup" | "ready" | "processing" | "results" | "cc-thinking" | "cc-done" | "cc-setup" | "cc-processing" | "cc-results" | "loan-thinking" | "loan-done" | "loan-setup" | "loan-processing" | "loan-results" | "payroll-thinking" | "payroll-done" | "payroll-setup" | "bank-thinking" | "bank-done" | "bank-year-select" | "bank-year-processing" | "bank-year-done" | "bank-setup" | "bank-processing" | "bank-results";

interface ReconciliationType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const reconTypes: ReconciliationType[] = [
  { id: "bank", title: "Bank Reconciliation", description: "Reconcile bank accounts to GL and statements", icon: <Landmark size={22} /> },
  { id: "credit-card", title: "Credit Card", description: "Reconcile credit card accounts to statements", icon: <CreditCard size={22} /> },
  { id: "intercompany", title: "Inter-company/Related Party", description: "Reconcile IC receivable/payable across entities", icon: <Building2 size={22} /> },
  { id: "payroll", title: "Payroll", description: "Reconcile payroll liabilities and remittances", icon: <Users size={22} /> },
  
];

const sampleAccounts = [
  { accountNo: "2100", description: "IC Receivable - SubCo A", date: "2024-12-31", debit: "125,340.00", credit: "0.00" },
  { accountNo: "2101", description: "IC Receivable - SubCo B", date: "2024-12-31", debit: "243,800.00", credit: "0.00" },
  { accountNo: "2110", description: "IC Payable - Parent Co", date: "2024-12-31", debit: "0.00", credit: "369,140.00" },
  { accountNo: "2120", description: "IC Revenue Clearing", date: "2024-12-31", debit: "54,200.00", credit: "0.00" },
  { accountNo: "2130", description: "IC Cost Allocation", date: "2024-12-31", debit: "0.00", credit: "78,600.00" },
];

const ccAccounts = [
  { accountNo: "5100", description: "Visa Business - *4521", date: "2024-12-31", debit: "12,450.00", credit: "0.00", stmtEndBal: "12,450.00", stmtEndDate: "31/12/2024" },
  { accountNo: "5110", description: "Mastercard Corp - *7832", date: "2024-12-31", debit: "8,920.00", credit: "0.00", stmtEndBal: "8,920.00", stmtEndDate: "31/12/2024" },
  { accountNo: "5120", description: "Amex Platinum - *3094", date: "2024-12-31", debit: "23,680.00", credit: "0.00", stmtEndBal: "23,680.00", stmtEndDate: "31/12/2024" },
  { accountNo: "5130", description: "Visa Travel - *6217", date: "2024-12-31", debit: "5,340.00", credit: "0.00", stmtEndBal: "5,340.00", stmtEndDate: "31/12/2024" },
  { accountNo: "5140", description: "Mastercard Procurement - *9485", date: "2024-12-31", debit: "0.00", credit: "1,200.00", stmtEndBal: "1,200.00", stmtEndDate: "31/12/2024" },
];

const ccGlAccounts = [
  { accountNo: "2100", description: "Credit Card Payable - Visa", amount: "12,150.00" },
  { accountNo: "2110", description: "Credit Card Payable - MC", amount: "8,620.00" },
  { accountNo: "2120", description: "Credit Card Payable - Amex", amount: "23,380.00" },
  { accountNo: "2130", description: "Credit Card Payable - Travel", amount: "5,040.00" },
  { accountNo: "2140", description: "Credit Card Payable - Procurement", amount: "900.00" },
  { accountNo: "2150", description: "Credit Card Clearing", amount: "4,200.00" },
  { accountNo: "2160", description: "Credit Card Interest Payable", amount: "1,850.00" },
  { accountNo: "2170", description: "Credit Card Rewards Liability", amount: "620.00" },
];

const bankAccounts = [
  { accountNo: "1010", description: "Operating Account - RBC *4821", date: "2024-12-31", debit: "87,340.00", credit: "0.00", type: "Checking" },
  { accountNo: "1020", description: "Payroll Account - TD *3295", date: "2024-12-31", debit: "34,560.00", credit: "0.00", type: "Checking" },
  { accountNo: "1030", description: "Savings Account - BMO *7163", date: "2024-12-31", debit: "156,200.00", credit: "0.00", type: "Savings" },
  { accountNo: "1040", description: "USD Account - RBC *9084", date: "2024-12-31", debit: "22,890.00", credit: "0.00", type: "Checking" },
  { accountNo: "1050", description: "Trust Account - Scotia *5412", date: "2024-12-31", debit: "45,100.00", credit: "0.00", type: "Trust" },
];

const bankGlAccounts = [
  { accountNo: "1100", description: "Cash - Operating", amount: "85,250.00" },
  { accountNo: "1110", description: "Cash - Payroll", amount: "32,100.00" },
  { accountNo: "1120", description: "Cash - Savings", amount: "154,800.00" },
  { accountNo: "1130", description: "Cash - USD Operations", amount: "21,450.00" },
  { accountNo: "1140", description: "Cash - Trust", amount: "43,900.00" },
  { accountNo: "1150", description: "Cash - Reserve", amount: "18,600.00" },
  { accountNo: "1160", description: "Cash - Escrow", amount: "67,200.00" },
  { accountNo: "1170", description: "Cash - Petty Cash", amount: "2,500.00" },
];

const bankYearOptions = ["2024", "2023", "2022"];

const bankUnmatchedData = [
  { date: "2024-12-05", desc: "Wire Transfer - Vendor Payment", debit1: 8500, credit1: 0, debit2: 0, credit2: 0, get diff() { return (this.debit1 - this.credit1) - (this.debit2 - this.credit2); }, get source1() { return this.debit1 - this.credit1; }, get source2() { return this.debit2 - this.credit2; } },
  { date: "2024-12-12", desc: "Bank Service Charge", debit1: 0, credit1: 0, debit2: 145, credit2: 0, get diff() { return (this.debit1 - this.credit1) - (this.debit2 - this.credit2); }, get source1() { return this.debit1 - this.credit1; }, get source2() { return this.debit2 - this.credit2; } },
  { date: "2024-12-18", desc: "Outstanding Check #4892", debit1: 3200, credit1: 0, debit2: 0, credit2: 0, get diff() { return (this.debit1 - this.credit1) - (this.debit2 - this.credit2); }, get source1() { return this.debit1 - this.credit1; }, get source2() { return this.debit2 - this.credit2; } },
  { date: "2024-12-22", desc: "Deposit in Transit", debit1: 0, credit1: 0, debit2: 5600, credit2: 0, get diff() { return (this.debit1 - this.credit1) - (this.debit2 - this.credit2); }, get source1() { return this.debit1 - this.credit1; }, get source2() { return this.debit2 - this.credit2; } },
  { date: "2024-12-29", desc: "NSF Check - Client Payment", debit1: 2750, credit1: 0, debit2: 0, credit2: 0, get diff() { return (this.debit1 - this.credit1) - (this.debit2 - this.credit2); }, get source1() { return this.debit1 - this.credit1; }, get source2() { return this.debit2 - this.credit2; } },
];



  const loanAccounts = [
  { accountNo: "*3912", description: "Line of Credit - TD", date: "2024-12-31", debit: "78,500.00", credit: "0.00", rate: "6.75", freq: "Monthly", startDate: "2023-06-01" },
  { accountNo: "*6734", description: "Equipment Loan - BMO", date: "2024-12-31", debit: "134,200.00", credit: "0.00", rate: "4.50", freq: "Quarterly", startDate: "2021-09-01" },
  { accountNo: "*2198", description: "Mortgage - Scotia", date: "2024-12-31", debit: "520,000.00", credit: "0.00", rate: "3.85", freq: "Monthly", startDate: "2020-03-01" },
  { accountNo: "*5647", description: "Vehicle Loan - CIBC", date: "2024-12-31", debit: "32,800.00", credit: "0.00", rate: "5.99", freq: "Monthly", startDate: "2023-01-15" },
];

const loanUnmatchedData = [
  { date: "2024-12-01", desc: "Opening Balance", debit1: 245000, credit1: 0, debit2: 244200, credit2: 0, get diff() { return (this.debit1 - this.credit1) - (this.debit2 - this.credit2); }, get amt1() { return this.debit1 - this.credit1; }, get amt2() { return this.debit2 - this.credit2; } },
  { date: "2024-12-05", desc: "Interest Accrual - Dec", debit1: 1072, credit1: 0, debit2: 0, credit2: 0, get diff() { return (this.debit1 - this.credit1) - (this.debit2 - this.credit2); }, get amt1() { return this.debit1 - this.credit1; }, get amt2() { return this.debit2 - this.credit2; } },
  { date: "2024-12-10", desc: "Principal Payment", debit1: 0, credit1: 0, debit2: 4200, credit2: 0, get diff() { return (this.debit1 - this.credit1) - (this.debit2 - this.credit2); }, get amt1() { return this.debit1 - this.credit1; }, get amt2() { return this.debit2 - this.credit2; } },
  { date: "2024-12-18", desc: "Late Fee Assessment", debit1: 350, credit1: 0, debit2: 0, credit2: 0, get diff() { return (this.debit1 - this.credit1) - (this.debit2 - this.credit2); }, get amt1() { return this.debit1 - this.credit1; }, get amt2() { return this.debit2 - this.credit2; } },
  { date: "2024-12-22", desc: "Amortization Adjustment", debit1: 0, credit1: 0, debit2: 890, credit2: 0, get diff() { return (this.debit1 - this.credit1) - (this.debit2 - this.credit2); }, get amt1() { return this.debit1 - this.credit1; }, get amt2() { return this.debit2 - this.credit2; } },
  { date: "2024-12-31", desc: "Closing Balance", debit1: 241222, credit1: 0, debit2: 238310, credit2: 0, get diff() { return (this.debit1 - this.credit1) - (this.debit2 - this.credit2); }, get amt1() { return this.debit1 - this.credit1; }, get amt2() { return this.debit2 - this.credit2; } },
];

const counterpartyEngagements = [
  { id: "COM-SCA-Dec312024", entity: "SubCo A Inc." },
  { id: "COM-SCB-Dec312024", entity: "SubCo B Ltd." },
  { id: "COM-PAR-Dec312024", entity: "Parent Co Holdings" },
];

const icEntities = [
  { id: "giggles", name: "Giggles and Goods Inc." },
  { id: "subco-a", name: "SubCo A Inc." },
  { id: "subco-b", name: "SubCo B Ltd." },
  { id: "parent-co", name: "Parent Co Holdings" },
];

const icEngagementsByEntity: Record<string, { id: string; label: string }[]> = {
  "subco-a": [
    { id: "COM-SCA-Dec312024", label: "COM-SCA-Dec312024" },
    { id: "COM-SCA-Jun302024", label: "COM-SCA-Jun302024" },
  ],
  "subco-b": [
    { id: "COM-SCB-Dec312024", label: "COM-SCB-Dec312024" },
  ],
  "parent-co": [
    { id: "COM-PAR-Dec312024", label: "COM-PAR-Dec312024" },
    { id: "COM-PAR-Jun302024", label: "COM-PAR-Jun302024" },
  ],
};

// ─── Animated Thinking Text ───
const ThinkingLine = ({ text, delay, done }: { text: string; delay: number; done: boolean }) => (
  <motion.div
    initial={{ opacity: 0, x: -6 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.35, ease: "easeOut" }}
    className="flex items-center gap-2.5 py-1.5"
  >
    {done ? (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.1 }}
      >
        <CheckCircle2 size={15} style={{ color: "hsl(145 63% 42%)" }} />
      </motion.div>
    ) : (
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
        <Loader2 size={15} style={{ color: "hsl(var(--primary))" }} />
      </motion.div>
    )}
    <span className="text-base" style={{ color: done ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>{text}</span>
  </motion.div>
);

// ─── Luka Avatar ───
const LukaAvatar = () => (
  <motion.div
    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
    style={{
      background: "linear-gradient(135deg, hsl(270 60% 55% / 0.12), hsl(207 71% 38% / 0.10))",
      border: "1.5px solid hsl(270 60% 55% / 0.2)",
    }}
    animate={{ boxShadow: ["0 0 0px hsl(270 60% 55% / 0)", "0 0 10px hsl(270 60% 55% / 0.15)", "0 0 0px hsl(270 60% 55% / 0)"] }}
    transition={{ duration: 3, repeat: Infinity }}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <defs><linearGradient id="luka-r-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#9747FF" /><stop offset="100%" stopColor="#115697" /></linearGradient></defs>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#luka-r-g)" />
    </svg>
  </motion.div>
);

const UserAvatar = () => (
  <div
    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
    style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
  >
    S
  </div>
);

// ─── Breathing Luka (inline processing indicator) ───
const BreathingLuka = ({ visible }: { visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className="flex items-start gap-3"
      >
        <motion.div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, hsl(270 60% 55% / 0.12), hsl(207 71% 38% / 0.10))",
            border: "1.5px solid hsl(270 60% 55% / 0.25)",
          }}
          animate={{
            scale: [1, 1.12, 1],
            boxShadow: [
              "0 0 0px hsl(270 60% 55% / 0)",
              "0 0 20px hsl(270 60% 55% / 0.25)",
              "0 0 0px hsl(270 60% 55% / 0)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="luka-breathing-inline" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9747FF" />
                  <stop offset="100%" stopColor="#115697" />
                </linearGradient>
              </defs>
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#luka-breathing-inline)" />
            </svg>
          </motion.div>
        </motion.div>
        <div className="pt-2">
          <motion.p
            className="text-sm font-medium"
            style={{ color: "hsl(var(--muted-foreground))" }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            Luka is processing…
          </motion.p>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);


interface ReconciliationFlowProps {
  onActivity?: (text: string, status: "done" | "processing" | "pending", highlight?: boolean) => void;
  activityMinimized?: boolean;
}

const GstBreakdownTable = () => {
  type Cat = "within" | "outside" | "outsideCanada";
  const [expanded, setExpanded] = useState<Record<Cat, boolean>>({
    within: true,
    outside: true,
    outsideCanada: true,
  });
  const toggle = (k: Cat) => setExpanded((p) => ({ ...p, [k]: !p[k] }));

  const cellTxt = "px-4 py-2.5 text-base";
  const cellNum = "px-4 py-2.5 text-base text-right font-mono font-medium";
  const borderHalf = { borderBottom: "1px solid hsl(var(--border) / 0.5)" } as React.CSSProperties;
  const borderFull = { borderBottom: "1px solid hsl(var(--border))" } as React.CSSProperties;
  const subtotalTop = { borderTop: "2px solid hsl(var(--border))" } as React.CSSProperties;

  const SectionHeader = ({ k, label }: { k: Cat; label: string }) => (
    <motion.tr
      onClick={() => toggle(k)}
      style={borderHalf}
      whileHover={{ backgroundColor: "hsl(220 20% 97%)", transition: { duration: 0 } }}
      className="cursor-pointer"
    >
      <td className={`${cellTxt} font-bold`} colSpan={2} style={{ color: "#2662D9" }}>
        <motion.span
          animate={{ rotate: expanded[k] ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="inline-block mr-1.5"
          style={{ color: "#2662D9" }}
        >
          ▸
        </motion.span>
        {label}
      </td>
      <td className={cellNum} style={{ color: "hsl(var(--foreground))" }}></td>
    </motion.tr>
  );

  const SubRow = ({ label, amount }: { label: string; amount: string }) => (
    <tr style={borderHalf}>
      <td className={cellTxt} style={{ color: "hsl(var(--muted-foreground))", paddingLeft: 36 }}></td>
      <td className={cellTxt} style={{ color: "hsl(var(--foreground))" }}>{label}</td>
      <td className={cellNum} style={{ color: "hsl(var(--foreground))" }}>{amount}</td>
    </tr>
  );

  const SubtotalRow = ({ label, amount }: { label: string; amount: string }) => (
    <tr style={{ ...subtotalTop, ...borderFull }}>
      <td colSpan={2} className={`${cellTxt} font-bold`} style={{ color: "hsl(var(--foreground))" }}>{label}</td>
      <td className={`${cellNum} font-bold`} style={{ color: "hsl(var(--foreground))" }}>{amount}</td>
    </tr>
  );

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
      <table className="w-full text-base">
        <thead>
          <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <td colSpan={3} className="px-4 py-3 text-base font-bold" style={{ color: "hsl(var(--foreground))" }}>
              Revenue (Section -1)
            </td>
          </tr>
          <tr style={{ background: "hsl(var(--table-header-bg))", borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
            <th className="text-left px-4 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))", width: "32%" }}>Category</th>
            <th className="text-left px-4 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Item</th>
            <th className="text-right px-4 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))", width: "20%" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <SectionHeader k="within" label="Revenue sold Within the Province" />
          <AnimatePresence initial={false}>
            {expanded.within && (
              <>
                <SubRow label="Revenue in Province" amount="4,000" />
                <SubRow label="Client Province Tax rate" amount="5%" />
                <SubRow label="GST on In-Province Revenue" amount="200" />
              </>
            )}
          </AnimatePresence>

          <SectionHeader k="outside" label="Revenue sold Outside the Province" />
          <AnimatePresence initial={false}>
            {expanded.outside && (
              <>
                <SubRow label="Province A Revenue Amount" amount="3,000" />
                <SubRow label="Province A Tax rate" amount="5%" />
                <SubRow label="Province B Revenue Amount" amount="7,000" />
                <SubRow label="Province B Tax rate" amount="10%" />
                <SubRow label="Province C Revenue Amount" amount="13,000" />
                <SubRow label="Province C Tax rate" amount="8%" />
              </>
            )}
          </AnimatePresence>

          <SubtotalRow label="Total GST For Revenue In Canada" amount="200" />

          <SectionHeader k="outsideCanada" label="Revenue sold Outside of Canada" />
          <AnimatePresence initial={false}>
            {expanded.outsideCanada && (
              <>
                <SubRow label="Revenue Amount" amount="30,000" />
                <SubRow label="Tax rate" amount="7%" />
              </>
            )}
          </AnimatePresence>

          <SubtotalRow label="Revenue With Zero Rated HST/GST" amount="4,000" />
          <SubtotalRow label="Total Estimated GST Collected" amount="—" />
        </tbody>
      </table>
    </div>
  );
};


const ReconciliationFlow = ({ onActivity, activityMinimized }: ReconciliationFlowProps) => {
  const [step, setStep] = useState<FlowStep>("thinking-init");
  const [thinkingLines, setThinkingLines] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [validateLines, setValidateLines] = useState<number>(0);
  const [deepLines, setDeepLines] = useState<number>(0);
  const [selectedAccount1, setSelectedAccount1] = useState<number | null>(null);
  const [selectedAccount2, setSelectedAccount2] = useState<number | null>(null);
  const [selectedCounterparty, setSelectedCounterparty] = useState<string | null>(null);
  const [counterpartyConnected, setCounterpartyConnected] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // IC Account 1: entity (pre-filled disabled), engagement (read-only), account dropdown
  const [icAccount1Open, setIcAccount1Open] = useState(false);
  // IC Account 2: entity → engagement → account (sequential)
  const [icEntity2, setIcEntity2] = useState<string | null>(null);
  const [icEntity2Open, setIcEntity2Open] = useState(false);
  const [icEngagement2, setIcEngagement2] = useState<string | null>(null);
  const [icEngagement2Open, setIcEngagement2Open] = useState(false);
  const [icAccount2Open, setIcAccount2Open] = useState(false);
  const [processingLines, setProcessingLines] = useState(0);
  const [matchedExpanded, setMatchedExpanded] = useState(false);
  const [unmatchedExpanded] = useState(true); // kept for compatibility
  const [postedItems, setPostedItems] = useState<Set<number>>(new Set());
  const [postingItems, setPostingItems] = useState<Set<number>>(new Set());
  const [postingAll, setPostingAll] = useState(false);
  const [itemNotes, setItemNotes] = useState<Record<number, string>>({});
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [ccThinkingLines, setCcThinkingLines] = useState(0);
  const [selectedCcAccount, setSelectedCcAccount] = useState<number | null>(null);
  const [ccGlAccount, setCcGlAccount] = useState<number | null>(null);
  const [ccGlAccountOpen, setCcGlAccountOpen] = useState(false);
  const [ccProcessingLines, setCcProcessingLines] = useState(0);
  const [ccShowDownloadMenu, setCcShowDownloadMenu] = useState(false);
  const ccDownloadRef = useRef<HTMLDivElement>(null);
  // CC Adjusting entries
  const [ccAdjEntries, setCcAdjEntries] = useState([
    { accNo: "6300", desc: "Office Supplies Expense", date: "15/01/2025", debit: "300.00", credit: "" },
    { accNo: "6310", desc: "Software Subscription", date: "18/01/2025", debit: "250.00", credit: "" },
    { accNo: "6320", desc: "Merchant Fee Expense", date: "20/01/2025", debit: "250.00", credit: "" },
    { accNo: "6300", desc: "Accounts Payable", date: "22/01/2025", debit: "", credit: "300.00" },
    { accNo: "6310", desc: "Accrued Liabilities", date: "25/01/2025", debit: "", credit: "250.00" },
    { accNo: "6320", desc: "Credit Card Payable", date: "28/01/2025", debit: "", credit: "250.00" },
  ]);
  const [ccAdjNotes, setCcAdjNotes] = useState("Credit card statement reconciliation adjustments for unrecorded charges and merchant fees.");
  const [ccAdjPosted, setCcAdjPosted] = useState(false);
  const [ccAdjPosting, setCcAdjPosting] = useState(false);
  // Loan/Debt
  const [loanThinkingLines, setLoanThinkingLines] = useState(0);
  const [loanInterestRate, setLoanInterestRate] = useState("5.25");
  const [loanPaymentFreq, setLoanPaymentFreq] = useState("");
  const [loanStartDate, setLoanStartDate] = useState("");
  const [loanFreqOpen, setLoanFreqOpen] = useState(false);
  const [loanDateOpen, setLoanDateOpen] = useState(false);
  const [loanAccount1, setLoanAccount1] = useState<number | null>(null);
  const [loanAccount2, setLoanAccount2] = useState<number | null>(null);
  const [loanAccount1Rate, setLoanAccount1Rate] = useState("5.25");
  const [loanAccount1Freq, setLoanAccount1Freq] = useState("Monthly");
  const [loanAccount1StartDate, setLoanAccount1StartDate] = useState("2022-01-15");
  const [loanAccount2Rate, setLoanAccount2Rate] = useState("6.75");
  const [loanAccount2Freq, setLoanAccount2Freq] = useState("Monthly");
  const [loanAccount2StartDate, setLoanAccount2StartDate] = useState("2023-06-01");
  const [loanAccount1FreqOpen, setLoanAccount1FreqOpen] = useState(false);
  const [loanAccount2FreqOpen, setLoanAccount2FreqOpen] = useState(false);
  const [loanProcessingLines, setLoanProcessingLines] = useState(0);
  const [loanPostedItems, setLoanPostedItems] = useState<Set<number>>(new Set());
  const [loanPostingItems, setLoanPostingItems] = useState<Set<number>>(new Set());
  const [loanItemNotes, setLoanItemNotes] = useState<Record<number, string>>({});
  const [loanMatchedExpanded, setLoanMatchedExpanded] = useState(false);
  const [loanPostingAll, setLoanPostingAll] = useState(false);
  const [loanShowDownloadMenu, setLoanShowDownloadMenu] = useState(false);
  const loanDownloadRef = useRef<HTMLDivElement>(null);
  // Payroll
  const [payrollThinkingLines, setPayrollThinkingLines] = useState(0);
  const [payrollPeriod, setPayrollPeriod] = useState("");
  const [payrollUnpaidToggle, setPayrollUnpaidToggle] = useState(false);
  const [payrollPeriodOpen, setPayrollPeriodOpen] = useState(false);
  // Bank
  const [bankThinkingLines, setBankThinkingLines] = useState(0);
  const [bankSelectedYear, setBankSelectedYear] = useState("");
  // Engagement period default: Jan 1 — Dec 31 of current year
  const engagementYear = new Date().getFullYear();
  const [bankPeriodRange, setBankPeriodRange] = useState<DateRange | undefined>({
    from: new Date(engagementYear, 0, 1),
    to: new Date(engagementYear, 11, 31),
  });
  const [bankPeriodConfirmed, setBankPeriodConfirmed] = useState(false);
  const [bankPeriodOpen, setBankPeriodOpen] = useState(false);
  const [bankAccount1, setBankAccount1] = useState<number | null>(null);
  const [bankAccount1Open, setBankAccount1Open] = useState(false);
  const [bankGlAccount, setBankGlAccount] = useState<number | null>(null);
  const [bankGlAccountOpen, setBankGlAccountOpen] = useState(false);
  const [bankProcessingLines, setBankProcessingLines] = useState(0);
  const [bankPostedItems, setBankPostedItems] = useState<Set<number>>(new Set());
  const [bankPostingItems, setBankPostingItems] = useState<Set<number>>(new Set());
  const [bankItemNotes, setBankItemNotes] = useState<Record<number, string>>({});
  const [bankMatchedExpanded, setBankMatchedExpanded] = useState(false);
  const [bankPostingAll, setBankPostingAll] = useState(false);
  const [bankShowDownloadMenu, setBankShowDownloadMenu] = useState(false);
  const bankDownloadRef = useRef<HTMLDivElement>(null);
  // Adjusting entries state
  const [bankAdjEntries, setBankAdjEntries] = useState([
    { accNo: "1100", desc: "Note receivable collected by bank", date: "15/01/2025", debit: "1,000.00", credit: "" },
    { accNo: "7100", desc: "Interest earned during January", date: "31/01/2025", debit: "50.00", credit: "" },
    { accNo: "6410", desc: "Collection charges", date: "31/01/2025", debit: "", credit: "10.00" },
    { accNo: "1200", desc: "NSF check", date: "20/01/2025", debit: "", credit: "15.00" },
    { accNo: "6420", desc: "Service charges", date: "31/01/2025", debit: "", credit: "25.00" },
  ]);
  const [bankAdjNotes, setBankAdjNotes] = useState("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis quis justo eu diam aliquam euismod. Aenean vitae neque malesuada ligula lacinia luctus.");
  const [bankAdjPosted, setBankAdjPosted] = useState(false);
  const [bankAdjPosting, setBankAdjPosting] = useState(false);
  // (Revenue and Tax flows removed)
  // Editable amounts for unmatched tables
  // IC Adjusting entries
  const [icAdjEntries, setIcAdjEntries] = useState([
    { accNo: "2100", desc: "Management Fee - Q4 (SubCo A → Parent Co)", date: "31/12/2024", debit: "3,200.00", credit: "", entity: "SubCo" },
    { accNo: "2101", desc: "License Royalty - Nov (SubCo A → SubCo Inc.)", date: "30/11/2024", debit: "1,800.00", credit: "", entity: "SubCo" },
    { accNo: "2110", desc: "Cost Allocation Adj (Parent Co → SubCo Inc.)", date: "31/12/2024", debit: "950.00", credit: "", entity: "SubCo Inc." },
    { accNo: "2120", desc: "Shared Services - Dec (SubCo A → Parent Co)", date: "31/12/2024", debit: "", credit: "1,100.00", entity: "SubCo" },
    { accNo: "2130", desc: "FX Revaluation Diff (SubCo Inc. → SubCo A)", date: "31/12/2024", debit: "", credit: "450.00", entity: "SubCo Inc." },
    { accNo: "2100", desc: "IC Receivable Reclassification", date: "31/12/2024", debit: "", credit: "4,400.00", entity: "SubCo" },
    { accNo: "2110", desc: "IC Payable Reclassification", date: "31/12/2024", debit: "1,550.00", credit: "", entity: "SubCo Inc." },
  ]);
  const [icAdjNotes, setIcAdjNotes] = useState("Inter-company adjusting entries to reconcile receivable/payable balances between related entities for fiscal year end.");
  const [icAdjPosted, setIcAdjPosted] = useState(false);
  const [icAdjPosting, setIcAdjPosting] = useState(false);
  const [icEditAmounts, setIcEditAmounts] = useState<EditableAmounts>(() => initEditable(unmatchedData));
  const [loanEditAmounts, setLoanEditAmounts] = useState<EditableAmounts>(() => initEditable(loanUnmatchedData));
  const [bankEditAmounts, setBankEditAmounts] = useState<EditableAmounts>(() => initEditable(bankUnmatchedData));
  // Editable statement table rows
  const [ccStmtRows, setCcStmtRows] = useState<StmtRow[]>([]);
  const [bankStmtRows, setBankStmtRows] = useState<StmtRow[]>([]);
  const [icStmtRows, setIcStmtRows] = useState<StmtRow[]>([]);
  
  const downloadRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleDownloadExcel = useCallback(() => {
    const postedTotal = unmatchedData.reduce((sum, item, idx) => postedItems.has(idx) ? sum + item.diff : sum, 0);
    const remaining = unmatchedData.reduce((sum, item, idx) => postedItems.has(idx) ? sum : sum + item.diff, 0);
    const acc2Balance = 238300 + postedTotal;
    const closingAcc2 = 238300 + postedTotal;
    const wb = XLSX.utils.book_new();

    // Sheet 1: Account Summary
    const ws1 = XLSX.utils.aoa_to_sheet([
      ["Reconciliation Summary Report"], [],
      ["Account Details"],
      ["Acc No.", "Description", "Entity", "Balance"],
      ["101", "IC Receivable, SubCo", "SubCo", 245800],
      ["102", "IC Receivable, SubCo Inc.", "SubCo Inc.", -acc2Balance],
      [], ["Net Difference", "", "", remaining],
    ]);
    ws1["!cols"] = [{ wch: 12 }, { wch: 30 }, { wch: 18 }, { wch: 16 }];
    ["D5", "D6", "D8"].forEach(ref => { if (ws1[ref]) ws1[ref].z = '#,##0.00'; });
    XLSX.utils.book_append_sheet(wb, ws1, "Account Summary");

    // Sheet 2: Transactions Summary
    const ws2 = XLSX.utils.aoa_to_sheet([
      ["Reconciliation Transactions Summary"], [],
      ["Entity", "Account 1", "Account 2", "Difference"],
      ["Opening Balance (Jan 1, 2024)", 198400, 920, 0],
      ["Matched Transactions (47 items)", 352600, 980, 0],
      ["Matched Settlements / Payments", -312700, 1000, 0],
      ["Unmatched Transactions", remaining, postedTotal, remaining],
      [], ["Closing Balance (Dec 31, 2024)", 245800, closingAcc2, remaining],
    ]);
    ws2["!cols"] = [{ wch: 36 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
    ["B4","B5","B6","B7","B9","C4","C5","C6","C7","C9","D4","D5","D6","D7","D9"].forEach(ref => { if (ws2[ref]) ws2[ref].z = '#,##0.00'; });
    XLSX.utils.book_append_sheet(wb, ws2, "Transactions Summary");

    // Sheet 3: Unmatched Details
    const unmatchedRows = unmatchedData.map((item, idx) => [
      item.desc, item.amt1, postedItems.has(idx) ? item.amt1 : item.amt2,
      postedItems.has(idx) ? 0 : item.diff, postedItems.has(idx) ? "Posted" : "", itemNotes[idx] || "",
    ]);
    const ws3 = XLSX.utils.aoa_to_sheet([
      ["Unmatched Transaction Details (5)"], [],
      ["Description", "Account 1", "Account 2", "Difference", "Status", "Note"],
      ...unmatchedRows,
    ]);
    ws3["!cols"] = [{ wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 24 }];
    unmatchedRows.forEach((_, i) => { ["B", "C", "D"].forEach(col => { const ref = `${col}${i + 4}`; if (ws3[ref]) ws3[ref].z = '#,##0.00'; }); });
    XLSX.utils.book_append_sheet(wb, ws3, "Unmatched Details");

    XLSX.writeFile(wb, "Reconciliation_Summary_Report.xlsx");
  }, [postedItems, itemNotes]);

  const handleDownloadPDF = useCallback(() => {
    const postedTotal = unmatchedData.reduce((sum, item, idx) => postedItems.has(idx) ? sum + item.diff : sum, 0);
    const remaining = unmatchedData.reduce((sum, item, idx) => postedItems.has(idx) ? sum : sum + item.diff, 0);
    const acc2Balance = 238300 + postedTotal;
    const closingAcc2 = 238300 + postedTotal;
    const f = (n: number) => Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Reconciliation Summary Report", pageW / 2, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pageW / 2, 27, { align: "center" });
    doc.setTextColor(0);

    // Section 1: Account Details
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Account Details", 14, 38);

    autoTable(doc, {
      startY: 42,
      head: [["Acc No.", "Description", "Entity", "Balance"]],
      body: [
        ["101", "IC Receivable, SubCo", "SubCo", "245,800.00"],
        ["102", "IC Receivable, SubCo Inc.", "SubCo Inc.", `(${f(acc2Balance)})`],
      ],
      foot: [["Net Difference", "", "", f(remaining)]],
      theme: "grid",
      headStyles: { fillColor: [38, 98, 217], fontStyle: "bold", fontSize: 10 },
      footStyles: { fillColor: [245, 245, 245], fontStyle: "bold", fontSize: 10, textColor: remaining > 0 ? [220, 50, 50] : [0, 162, 115] },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 3: { halign: "right" } },
    });

    // Section 2: Transactions Summary
    const y2 = (doc as any).lastAutoTable.finalY + 14;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Reconciliation Transactions Summary", 14, y2);

    autoTable(doc, {
      startY: y2 + 4,
      head: [["Entity", "Account 1", "Account 2", "Difference"]],
      body: [
        ["Opening Balance (Jan 1, 2024)", "198,400.00", "920.00", "0.00"],
        ["Matched Transactions (47 items)", "352,600.00", "980.00", "0.00"],
        ["Matched Settlements / Payments", "(312,700.00)", "1,000.00", "0.00"],
        ["Unmatched Transactions", f(remaining), postedTotal > 0 ? f(postedTotal) : "0.00", f(remaining)],
      ],
      foot: [["Closing Balance (Dec 31, 2024)", "245,800.00", remaining === 0 ? "245,800.00" : `(${f(closingAcc2)})`, f(remaining)]],
      theme: "grid",
      headStyles: { fillColor: [38, 98, 217], fontStyle: "bold", fontSize: 10 },
      footStyles: { fillColor: [245, 245, 245], fontStyle: "bold", fontSize: 10, textColor: remaining > 0 ? [220, 50, 50] : [0, 162, 115] },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    });

    // Section 3: Unmatched Transaction Details
    const y3 = (doc as any).lastAutoTable.finalY + 14;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Unmatched Transaction Details (5)", 14, y3);

    const unmatchedRows = unmatchedData.map((item, idx) => {
      const isPosted = postedItems.has(idx);
      return [
        item.desc,
        f(item.amt1),
        isPosted ? f(item.amt1) : f(item.amt2),
        isPosted ? "0.00" : f(item.diff),
        isPosted ? "Posted" : "Pending",
        itemNotes[idx] || "—",
      ];
    });

    autoTable(doc, {
      startY: y3 + 4,
      head: [["Description", "Account 1", "Account 2", "Difference", "Status", "Note"]],
      body: unmatchedRows,
      theme: "grid",
      headStyles: { fillColor: [38, 98, 217], fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 3.5 },
      columnStyles: {
        1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" },
        4: { halign: "center" },
      },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 4) {
          data.cell.styles.textColor = data.cell.raw === "Posted" ? [0, 162, 115] : [180, 130, 0];
          data.cell.styles.fontStyle = "bold";
        }
        if (data.section === "body" && data.column.index === 3) {
          const val = parseFloat(String(data.cell.raw).replace(/,/g, ""));
          if (val > 0) data.cell.styles.textColor = [220, 50, 50];
        }
      },
    });

    doc.save("Reconciliation_Summary_Report.pdf");
  }, [postedItems, itemNotes]);

  // Close download menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (downloadRef.current && !downloadRef.current.contains(e.target as Node)) setShowDownloadMenu(false);
      if (ccDownloadRef.current && !ccDownloadRef.current.contains(e.target as Node)) setCcShowDownloadMenu(false);
      
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-scroll to bottom on any new content
  useEffect(() => {
    const t = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }
    }, 80);
    return () => clearTimeout(t);
  }, [step, thinkingLines, validateLines, deepLines, selectedType, selectedAccount1, selectedAccount2, processingLines, ccThinkingLines, selectedCcAccount, ccGlAccount, ccProcessingLines, loanThinkingLines, loanProcessingLines, payrollThinkingLines, bankThinkingLines, bankProcessingLines, icEntity2, icEngagement2]);

  // Step 0: Initial thinking
  useEffect(() => {
    if (step !== "thinking-init") return;
    onActivity?.("Reconciliation module initialized", "processing");
    const timers = [
      setTimeout(() => { setThinkingLines(1); onActivity?.("Reconciliation module initialized", "done"); onActivity?.("Engagement loaded: Giggles and Goods Inc.", "processing", true); }, 600),
      setTimeout(() => { setThinkingLines(2); onActivity?.("Engagement loaded: Giggles and Goods Inc.", "done", true); onActivity?.("Awaiting reconciliation type selection", "processing"); }, 2200),
      setTimeout(() => { setStep("select-type"); onActivity?.("Awaiting reconciliation type selection", "done"); }, 3800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // Step 2: Validation thinking (Inter-company)
  useEffect(() => {
    if (step !== "thinking-validate") return;
    onActivity?.("Checking engagement", "processing");
    const texts = ["Checking engagement", "Checking source connection", "Connected to QuickBooks", "Pulling Trial Balance data", "Trial Balance data fetched"];
    const timers = [
      setTimeout(() => { setValidateLines(1); onActivity?.(texts[0], "done"); onActivity?.(texts[1], "processing"); }, 500),
      setTimeout(() => { setValidateLines(2); onActivity?.(texts[1], "done"); onActivity?.(texts[2], "processing"); }, 1800),
      setTimeout(() => { setValidateLines(3); onActivity?.(texts[2], "done"); onActivity?.(texts[3], "processing"); }, 3000),
      setTimeout(() => { setValidateLines(4); onActivity?.(texts[3], "done"); onActivity?.(texts[4], "processing"); }, 4500),
      setTimeout(() => { setValidateLines(5); onActivity?.(texts[4], "done"); }, 6000),
      setTimeout(() => { setStep("thinking-deep"); onActivity?.("Extracting financial records", "processing"); }, 7200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // Step 3: Deep validation
  useEffect(() => {
    if (step !== "thinking-deep") return;
    const timers = [
      setTimeout(() => { setDeepLines(1); onActivity?.("Extracting financial records", "done"); onActivity?.("Validating account mappings", "processing"); }, 500),
      setTimeout(() => { setDeepLines(2); onActivity?.("Validating account mappings", "done"); onActivity?.("Preparing account selection", "processing"); }, 2000),
      setTimeout(() => { setDeepLines(3); onActivity?.("Preparing account selection", "done"); }, 3500),
      setTimeout(() => { setStep("setup"); onActivity?.("Ready for account selection", "done"); }, 5000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // Processing animation (Inter-company)
  useEffect(() => {
    if (step !== "processing") return;
    const texts = ["Starting reconciliation engine", "Identified selected GL accounts", "Loaded transactions across periods", "Running transaction matching algorithm", "Preparing reconciliation output"];
    onActivity?.(texts[0], "processing");
    const timers = [
      setTimeout(() => { setProcessingLines(1); onActivity?.(texts[0], "done"); onActivity?.(texts[1], "processing"); }, 500),
      setTimeout(() => { setProcessingLines(2); onActivity?.(texts[1], "done"); onActivity?.(texts[2], "processing"); }, 1800),
      setTimeout(() => { setProcessingLines(3); onActivity?.(texts[2], "done"); onActivity?.(texts[3], "processing"); }, 3200),
      setTimeout(() => { setProcessingLines(4); onActivity?.(texts[3], "done"); onActivity?.(texts[4], "processing"); }, 4800),
      setTimeout(() => { setProcessingLines(5); onActivity?.(texts[4], "done"); }, 6200),
      setTimeout(() => { setStep("results"); onActivity?.("Reconciliation results ready", "done", true); }, 7500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // Credit Card thinking animation
  useEffect(() => {
    if (step !== "cc-thinking") return;
    const texts = ["Checking engagement", "Checking source connection", "Connected to QuickBooks", "Pulling Trial Balance data", "Trial Balance data fetched", "Validating Plaid Connection", "Extracting financial records"];
    onActivity?.(texts[0], "processing");
    const timers = [
      setTimeout(() => { setCcThinkingLines(1); onActivity?.(texts[0], "done"); onActivity?.(texts[1], "processing"); }, 500),
      setTimeout(() => { setCcThinkingLines(2); onActivity?.(texts[1], "done"); onActivity?.(texts[2], "processing"); }, 1800),
      setTimeout(() => { setCcThinkingLines(3); onActivity?.(texts[2], "done"); onActivity?.(texts[3], "processing"); }, 3000),
      setTimeout(() => { setCcThinkingLines(4); onActivity?.(texts[3], "done"); onActivity?.(texts[4], "processing"); }, 4500),
      setTimeout(() => { setCcThinkingLines(5); onActivity?.(texts[4], "done"); onActivity?.(texts[5], "processing"); }, 6000),
      setTimeout(() => { setCcThinkingLines(6); onActivity?.(texts[5], "done"); onActivity?.(texts[6], "processing"); }, 7500),
      setTimeout(() => { setCcThinkingLines(7); onActivity?.(texts[6], "done"); }, 9000),
      setTimeout(() => { setStep("cc-done"); onActivity?.("Ready for credit card account selection", "done"); setTimeout(() => setStep("cc-setup"), 1200); }, 10500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // Credit Card processing animation
  useEffect(() => {
    if (step !== "cc-processing") return;
    const texts = ["Starting reconciliation engine", "Identified selected credit card account", "200 items detected across periods", "Running transaction matching algorithm", "Preparing reconciliation output"];
    onActivity?.(texts[0], "processing");
    const timers = [
      setTimeout(() => { setCcProcessingLines(1); onActivity?.(texts[0], "done"); onActivity?.(texts[1], "processing"); }, 500),
      setTimeout(() => { setCcProcessingLines(2); onActivity?.(texts[1], "done"); onActivity?.(texts[2], "processing"); }, 1800),
      setTimeout(() => { setCcProcessingLines(3); onActivity?.(texts[2], "done"); onActivity?.(texts[3], "processing"); }, 3200),
      setTimeout(() => { setCcProcessingLines(4); onActivity?.(texts[3], "done"); onActivity?.(texts[4], "processing"); }, 4800),
      setTimeout(() => { setCcProcessingLines(5); onActivity?.(texts[4], "done"); }, 6200),
      setTimeout(() => { setStep("cc-results"); onActivity?.("Credit card reconciliation results ready", "done", true); }, 7500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // Loan/Debt thinking animation
  useEffect(() => {
    if (step !== "loan-thinking") return;
    const texts = ["Checking engagement", "Checking source connection", "Connected to QuickBooks", "Pulling Trial Balance data", "Trial Balance data fetched", "Validating Plaid Connection", "Extracting financial records"];
    onActivity?.(texts[0], "processing");
    const timers = [
      setTimeout(() => { setLoanThinkingLines(1); onActivity?.(texts[0], "done"); onActivity?.(texts[1], "processing"); }, 500),
      setTimeout(() => { setLoanThinkingLines(2); onActivity?.(texts[1], "done"); onActivity?.(texts[2], "processing"); }, 1800),
      setTimeout(() => { setLoanThinkingLines(3); onActivity?.(texts[2], "done"); onActivity?.(texts[3], "processing"); }, 3000),
      setTimeout(() => { setLoanThinkingLines(4); onActivity?.(texts[3], "done"); onActivity?.(texts[4], "processing"); }, 4500),
      setTimeout(() => { setLoanThinkingLines(5); onActivity?.(texts[4], "done"); onActivity?.(texts[5], "processing"); }, 6000),
      setTimeout(() => { setLoanThinkingLines(6); onActivity?.(texts[5], "done"); onActivity?.(texts[6], "processing"); }, 7500),
      setTimeout(() => { setLoanThinkingLines(7); onActivity?.(texts[6], "done"); }, 9000),
      setTimeout(() => { setStep("loan-done"); onActivity?.("Ready for loan account selection", "done"); setTimeout(() => setStep("loan-setup"), 1200); }, 10500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // Loan/Debt processing animation
  useEffect(() => {
    if (step !== "loan-processing") return;
    const texts = ["Starting reconciliation engine", "Identified selected loan accounts", "200 items detected across periods", "Running transaction matching algorithm", "Preparing reconciliation output"];
    onActivity?.(texts[0], "processing");
    const timers = [
      setTimeout(() => { setLoanProcessingLines(1); onActivity?.(texts[0], "done"); onActivity?.(texts[1], "processing"); }, 500),
      setTimeout(() => { setLoanProcessingLines(2); onActivity?.(texts[1], "done"); onActivity?.(texts[2], "processing"); }, 1800),
      setTimeout(() => { setLoanProcessingLines(3); onActivity?.(texts[2], "done"); onActivity?.(texts[3], "processing"); }, 3200),
      setTimeout(() => { setLoanProcessingLines(4); onActivity?.(texts[3], "done"); onActivity?.(texts[4], "processing"); }, 4800),
      setTimeout(() => { setLoanProcessingLines(5); onActivity?.(texts[4], "done"); }, 6200),
      setTimeout(() => { setStep("loan-results"); onActivity?.("Loan/Debt reconciliation results ready", "done", true); }, 7500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // Payroll thinking animation
  useEffect(() => {
    if (step !== "payroll-thinking") return;
    const texts = ["Checking engagement", "Checking source connection", "Connected to QuickBooks", "Pulling Trial Balance data", "Extracting payroll records"];
    onActivity?.(texts[0], "processing");
    const timers = [
      setTimeout(() => { setPayrollThinkingLines(1); onActivity?.(texts[0], "done"); onActivity?.(texts[1], "processing"); }, 500),
      setTimeout(() => { setPayrollThinkingLines(2); onActivity?.(texts[1], "done"); onActivity?.(texts[2], "processing"); }, 1800),
      setTimeout(() => { setPayrollThinkingLines(3); onActivity?.(texts[2], "done"); onActivity?.(texts[3], "processing"); }, 3000),
      setTimeout(() => { setPayrollThinkingLines(4); onActivity?.(texts[3], "done"); onActivity?.(texts[4], "processing"); }, 4500),
      setTimeout(() => { setPayrollThinkingLines(5); onActivity?.(texts[4], "done"); }, 6000),
      setTimeout(() => { setStep("payroll-done"); onActivity?.("Ready for payroll setup", "done"); setTimeout(() => setStep("payroll-setup"), 1200); }, 7500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // Bank thinking animation
  useEffect(() => {
    if (step !== "bank-thinking") return;
    const texts = ["Checking engagement", "Checking source connection", "Connected to QuickBooks", "Pulling Trial Balance data", "Trial Balance data fetched", "Validating Plaid Connection", "Extracting financial records"];
    onActivity?.(texts[0], "processing");
    const timers = [
      setTimeout(() => { setBankThinkingLines(1); onActivity?.(texts[0], "done"); onActivity?.(texts[1], "processing"); }, 500),
      setTimeout(() => { setBankThinkingLines(2); onActivity?.(texts[1], "done"); onActivity?.(texts[2], "processing"); }, 1800),
      setTimeout(() => { setBankThinkingLines(3); onActivity?.(texts[2], "done"); onActivity?.(texts[3], "processing"); }, 3000),
      setTimeout(() => { setBankThinkingLines(4); onActivity?.(texts[3], "done"); onActivity?.(texts[4], "processing"); }, 4500),
      setTimeout(() => { setBankThinkingLines(5); onActivity?.(texts[4], "done"); onActivity?.(texts[5], "processing"); }, 6000),
      setTimeout(() => { setBankThinkingLines(6); onActivity?.(texts[5], "done"); onActivity?.(texts[6], "processing"); }, 7500),
      setTimeout(() => { setBankThinkingLines(7); onActivity?.(texts[6], "done"); }, 9000),
      setTimeout(() => { setStep("bank-done"); onActivity?.("Ready for year selection", "done"); setTimeout(() => setStep("bank-year-select"), 1200); }, 10500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // Bank year processing animation (3 seconds)
  useEffect(() => {
    if (step !== "bank-year-processing") return;
    const timer = setTimeout(() => {
      setStep("bank-year-done");
      onActivity?.("Year confirmed, ready for account selection", "done");
      setTimeout(() => setStep("bank-setup"), 1200);
    }, 3000);
    return () => clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    if (step !== "bank-processing") return;
    const texts = ["Starting reconciliation engine", "Identified selected GL accounts", "Loaded 847 transactions across periods", "Running transaction matching algorithm", "Found 2 timing differences", "Calculated variances - 5 unmatched items", "Preparing reconciliation output"];
    onActivity?.(texts[0], "processing");
    const timers = [
      setTimeout(() => { setBankProcessingLines(1); onActivity?.(texts[0], "done"); onActivity?.(texts[1], "processing"); }, 500),
      setTimeout(() => { setBankProcessingLines(2); onActivity?.(texts[1], "done"); onActivity?.(texts[2], "processing"); }, 1800),
      setTimeout(() => { setBankProcessingLines(3); onActivity?.(texts[2], "done"); onActivity?.(texts[3], "processing"); }, 3200),
      setTimeout(() => { setBankProcessingLines(4); onActivity?.(texts[3], "done"); onActivity?.(texts[4], "processing"); }, 4800),
      setTimeout(() => { setBankProcessingLines(5); onActivity?.(texts[4], "done"); onActivity?.(texts[5], "processing"); }, 6200),
      setTimeout(() => { setBankProcessingLines(6); onActivity?.(texts[5], "done"); onActivity?.(texts[6], "processing"); }, 7800),
      setTimeout(() => { setBankProcessingLines(7); onActivity?.(texts[6], "done"); }, 9200),
      setTimeout(() => { setStep("bank-results"); onActivity?.("Bank reconciliation results ready", "done", true); }, 10500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // Initialize editable statement rows on results
  useEffect(() => {
    if (step === "cc-results" && ccStmtRows.length === 0) {
      const ccAccount = selectedCcAccount !== null ? ccAccounts[selectedCcAccount] : null;
      const glAccount = ccGlAccount !== null ? ccGlAccounts[ccGlAccount] : null;
      const adjAmount = ccAdjPosted ? 800 : 0;
      const acct1Adj = 11650;
      const acct2Base = 10850;
      const acct2Adj = acct2Base + adjAmount;
      setCcStmtRows(buildCcStatementRows(
        ccAccount?.description || "", glAccount?.description || "",
        fmt(acct1Adj), fmt(acct2Adj), fmt(acct1Adj - acct2Adj), !ccAdjPosted
      ));
    }
  }, [step, ccStmtRows.length, selectedCcAccount, ccGlAccount, ccAdjPosted]);

  useEffect(() => {
    if (step === "bank-results" && bankStmtRows.length === 0) {
      const adjAmount = bankAdjPosted ? 1000 : 0;
      const acct1Adj = 9992;
      const acct2Base = 8992;
      const acct2Adj = acct2Base + adjAmount;
      setBankStmtRows(buildBankStatementRows(
        fmt(acct1Adj), fmt(acct2Adj), fmt(acct1Adj - acct2Adj), !bankAdjPosted
      ));
    }
  }, [step, bankStmtRows.length, bankAdjPosted]);

  useEffect(() => {
    if (step === "results" && icStmtRows.length === 0) {
      const account1Details = selectedAccount1 !== null ? sampleAccounts[selectedAccount1] : null;
      const account2Details = selectedAccount2 !== null ? sampleAccounts[selectedAccount2] : null;
      const counterpartyEntity = icEntity2 ? icEntities.find(e => e.id === icEntity2)?.name || "" : "";
      const adjAmount = icAdjPosted ? 7500 : 0;
      const acct1Adj = 245800;
      const acct2Base = 238300;
      const acct2Adj = acct2Base + adjAmount;
      setIcStmtRows(buildIcStatementRows(
        account1Details?.description || "", account2Details?.description || "",
        counterpartyEntity,
        fmt(acct1Adj), fmt(acct2Adj), fmt(acct1Adj - acct2Adj), !icAdjPosted
      ));
    }
  }, [step, icStmtRows.length, selectedAccount1, selectedAccount2, icEntity2, icAdjPosted]);

  const handleTypeSelect = (id: string) => {
    setSelectedType(id);
    const typeNames: Record<string, string> = { intercompany: "Inter-company/Related Party", "credit-card": "Credit Card", payroll: "Payroll", bank: "Bank" };
    onActivity?.(`Selected: ${typeNames[id] || id} reconciliation`, "done", true);
    if (id === "intercompany") {
      setTimeout(() => setStep("thinking-validate"), 400);
    }
    if (id === "credit-card") {
      setTimeout(() => setStep("cc-thinking"), 400);
    }
    if (id === "payroll") {
      setTimeout(() => setStep("payroll-thinking"), 400);
    }
    if (id === "bank") {
      setTimeout(() => setStep("bank-thinking"), 400);
    }
  };

  const handleReconcile = () => {
    setStep("processing");
  };

  const account1Details = selectedAccount1 !== null ? sampleAccounts[selectedAccount1] : null;
  const account2Details = selectedAccount2 !== null ? sampleAccounts[selectedAccount2] : null;
  const counterpartyEntity = icEntity2 ? icEntities.find(e => e.id === icEntity2)?.name : counterpartyEngagements.find(e => e.id === selectedCounterparty)?.entity;

  const canReconcile = selectedAccount1 !== null && selectedAccount2 !== null && icEntity2 !== null && icEngagement2 !== null && step === "setup";

  const isActivelyProcessing = [
    "thinking-init", "thinking-validate", "thinking-deep", "processing",
    "cc-thinking", "cc-processing",
    "payroll-thinking",
    "bank-thinking", "bank-year-processing", "bank-processing",
    
  ].includes(step);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto text-base" style={{ scrollbarWidth: "none", fontSize: "16px" }}>
      <div className={`w-full pl-8 py-6 space-y-6 ${activityMinimized ? 'pr-8' : 'pr-[320px]'}`}>

        {/* User message */}
        <div className="flex items-start gap-3">
          <UserAvatar />
          <p className="text-base pt-1" style={{ color: "hsl(var(--foreground))" }}>Account Reconciliation</p>
        </div>

        {/* Breathing animation — initial loading */}
        <BreathingLuka visible={step === "thinking-init"} />

        {/* Step 1: Type selection */}
        <AnimatePresence>
          {(step === "select-type" || step === "thinking-validate" || step === "thinking-deep" || step === "setup" || step === "ready" || step === "processing" || step === "results" || step === "cc-thinking" || step === "cc-done" || step === "cc-setup" || step === "cc-processing" || step === "cc-results" || step === "loan-thinking" || step === "loan-done" || step === "loan-setup" || step === "loan-processing" || step === "loan-results" || step === "payroll-thinking" || step === "payroll-done" || step === "payroll-setup" || step === "bank-thinking" || step === "bank-done" || step === "bank-year-select" || step === "bank-year-processing" || step === "bank-year-done" || step === "bank-setup" || step === "bank-processing" || step === "bank-results") && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="flex items-start gap-3">
                <LukaAvatar />
                <div className="flex-1 pt-0.5">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-base mb-4"
                    style={{ color: "hsl(var(--foreground))" }}
                  >
                    What would you like to reconcile?
                  </motion.p>
                  <p className="text-sm mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>Select a reconciliation type to begin</p>

                  <div className="grid grid-cols-5 gap-2.5" style={{ maxWidth: 1280 }}>
                    {reconTypes.map((rt, i) => {
                      const isSelected = selectedType === rt.id;
                      const isDisabled = selectedType !== null && !isSelected;
                      return (
                        <motion.button
                          key={rt.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: isDisabled ? 0.35 : 1, y: 0 }}
                          transition={{ delay: i * 0.04, duration: 0.25 }}
                          whileHover={!isDisabled && !isSelected ? { scale: 1.03, y: -3, boxShadow: "0 8px 24px hsl(210 40% 50% / 0.12)" } : {}}
                          whileTap={!isDisabled ? { scale: 0.96 } : {}}
                          onClick={() => !isDisabled && !isSelected && handleTypeSelect(rt.id)}
                          className="relative flex flex-col items-start text-left px-3 py-4 rounded-xl border cursor-pointer group"
                          style={{
                            background: isSelected
                              ? "linear-gradient(135deg, hsl(var(--primary) / 0.06), hsl(var(--primary) / 0.12))"
                              : "hsl(var(--card))",
                            borderColor: isSelected ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border) / 0.6)",
                            boxShadow: isSelected
                              ? "0 0 0 2px hsl(var(--primary) / 0.1), 0 4px 16px hsl(var(--primary) / 0.1)"
                              : "0 1px 4px hsl(220 20% 50% / 0.04)",
                            transition: "border-color 0.2s, background 0.2s",
                          }}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2"
                            >
                              <CheckCircle2 size={14} style={{ color: "hsl(var(--primary))" }} />
                            </motion.div>
                          )}
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
                            style={{
                              color: isSelected ? "hsl(var(--primary))" : "#0C2D56",
                              background: isSelected ? "hsl(var(--primary) / 0.1)" : "hsl(210 30% 96%)",
                              border: `1px solid ${isSelected ? "hsl(var(--primary) / 0.2)" : "hsl(210 20% 90%)"}`,
                            }}
                          >
                            {rt.icon}
                          </div>
                          <p className="text-[14px] font-semibold leading-tight" style={{ color: "hsl(var(--foreground))" }}>{rt.title}</p>
                          <p className="text-[12px] mt-1 leading-snug" style={{ color: "hsl(var(--muted-foreground))" }}>{rt.description}</p>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Validation breathing */}
        <BreathingLuka visible={step === "thinking-validate"} />
        <BreathingLuka visible={step === "cc-thinking"} />

        {/* Credit Card done message */}
        <AnimatePresence>
          {(step === "cc-done" || step === "cc-setup" || step === "cc-processing" || step === "cc-results") && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-start gap-3">
              <LukaAvatar />
              <p className="text-base pt-1" style={{ color: "hsl(var(--foreground))" }}>
                Select the credit card account and general ledger account to reconcile.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credit Card account selection — similar to bank rec */}
        <AnimatePresence>
          {(step === "cc-setup" || step === "cc-processing" || step === "cc-results") && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-start gap-3">
                <LukaAvatar />
                <div className="flex-1 pt-0.5 space-y-5">
                  {/* Credit Card Account */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold" style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}>1</div>
                        <span className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>Credit Card Account</span>
                      </div>
                      <img src={quickbooksLogo} alt="QuickBooks" className="h-[28px] w-auto" />
                    </div>
                    <label className="text-sm font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Select Credit Card Account</label>
                    <div className="rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
                      <table className="w-full text-base">
                        <thead>
                          <tr style={{ background: "hsl(var(--table-header-bg))" }}>
                            <th className="text-left px-3 py-2 font-semibold" style={{ color: "hsl(var(--foreground))", fontSize: 15 }}>Description</th>
                            <th className="text-left px-3 py-2 font-semibold" style={{ color: "hsl(var(--foreground))", fontSize: 15 }}>Date</th>
                            <th className="text-right px-3 py-2 font-semibold" style={{ color: "hsl(var(--foreground))", fontSize: 15 }}>Debit</th>
                            <th className="text-right px-3 py-2 font-semibold" style={{ color: "hsl(var(--foreground))", fontSize: 15 }}>Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ccAccounts.map((acc, i) => {
                            const isSelected = selectedCcAccount === i;
                            return (
                              <motion.tr
                                key={acc.accountNo}
                                initial={{ opacity: 0, backgroundColor: "hsl(0 0% 100% / 0)" }}
                                animate={{ opacity: 1, backgroundColor: isSelected ? "hsl(207 71% 82%)" : "hsl(0 0% 100% / 0)", x: 0, transition: { duration: 0 } }}
                                transition={{ delay: 0.3 + i * 0.06 }}
                                onClick={() => setSelectedCcAccount(i)}
                                className="cursor-pointer transition-all duration-150"
                                style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}
                                whileHover={!isSelected ? { backgroundColor: "hsl(220 20% 97%)", x: 2, transition: { duration: 0 } } : { x: 2, transition: { duration: 0 } }}
                              >
                                <td className="px-3 py-2.5 font-medium" style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>
                                  <div className="flex items-center gap-2">
                                    {isSelected && <CheckCircle2 size={13} style={{ color: "hsl(145 63% 42%)" }} />}
                                    {acc.description}
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 font-mono font-medium" style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>{acc.date}</td>
                                <td className="px-3 py-2.5 text-right font-mono font-medium" style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>{acc.debit}</td>
                                <td className="px-3 py-2.5 text-right font-mono font-medium" style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>{acc.credit}</td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Auto-detected statement ending balance and date */}
                    {selectedCcAccount !== null && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block" style={{ color: "hsl(var(--muted-foreground))" }}>Statement Ending Balance</label>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.3)", color: "hsl(var(--foreground))" }}>
                            <CheckCircle2 size={13} style={{ color: "hsl(145 63% 42%)" }} />
                            <span className="font-mono font-medium" style={{ fontSize: 16 }}>{ccAccounts[selectedCcAccount].stmtEndBal}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block" style={{ color: "hsl(var(--muted-foreground))" }}>Statement Ending Date</label>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.3)", color: "hsl(var(--foreground))" }}>
                            <CalendarIcon size={13} style={{ color: "hsl(var(--primary))" }} />
                            <span className="font-mono font-medium" style={{ fontSize: 16 }}>{ccAccounts[selectedCcAccount].stmtEndDate}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* GL Account */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold" style={{ background: "hsl(270 60% 55% / 0.08)", color: "hsl(270 60% 55%)" }}>2</div>
                        <span className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>General Ledger Account</span>
                      </div>
                      <img src={quickbooksLogo} alt="QuickBooks" className="h-[28px] w-auto" />
                    </div>
                    <label className="text-sm font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Select GL Account</label>
                    <div className="rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
                      <div style={{ maxHeight: ccGlAccountOpen ? 320 : undefined, overflowY: ccGlAccountOpen ? "auto" : undefined }}>
                        <table className="w-full text-base">
                          <thead>
                            <tr style={{ background: "hsl(var(--table-header-bg))" }}>
                              <th className="text-left px-3 py-2 font-semibold" style={{ color: "hsl(var(--foreground))", fontSize: 15, width: 100 }}>Acc No</th>
                              <th className="text-left px-3 py-2 font-semibold" style={{ color: "hsl(var(--foreground))", fontSize: 15 }}>Description</th>
                              <th className="text-right px-3 py-2 font-semibold" style={{ color: "hsl(var(--foreground))", fontSize: 15, width: 140 }}>2024</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ccGlAccounts.map((acc, i) => {
                              const isSelected = ccGlAccount === i;
                              return (
                                <motion.tr
                                  key={acc.accountNo}
                                  initial={{ opacity: 0, backgroundColor: "hsl(0 0% 100% / 0)" }}
                                  animate={{ opacity: 1, backgroundColor: isSelected ? "hsl(270 60% 96%)" : "hsl(0 0% 100% / 0)", x: 0, transition: { duration: 0 } }}
                                  transition={{ delay: 0.3 + i * 0.06 }}
                                  onClick={() => setCcGlAccount(i)}
                                  className="cursor-pointer transition-all duration-150"
                                  style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}
                                  whileHover={!isSelected ? { backgroundColor: "hsl(220 20% 97%)", x: 2, transition: { duration: 0 } } : { x: 2, transition: { duration: 0 } }}
                                >
                                  <td className="px-3 py-2.5 font-mono font-medium" style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>{acc.accountNo}</td>
                                  <td className="px-3 py-2.5 font-medium" style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>
                                    <div className="flex items-center gap-2">
                                      {isSelected && <CheckCircle2 size={13} style={{ color: "hsl(145 63% 42%)" }} />}
                                      {acc.description}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-mono font-medium" style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>{acc.amount}</td>
                                </motion.tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>

                  {/* CC Reconcile Button */}
                  {(() => {
                    const ccReady = selectedCcAccount !== null && ccGlAccount !== null && step === "cc-setup";
                    const ccDisabled = step === "cc-processing" || step === "cc-results";
                    return (
                      <div className="flex justify-end pt-4">
                        <motion.button
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.45 }}
                          whileHover={(ccReady && !ccDisabled) ? { scale: 1.03, boxShadow: "0 4px 20px hsl(var(--primary) / 0.25)" } : {}}
                          whileTap={(ccReady && !ccDisabled) ? { scale: 0.97 } : {}}
                          disabled={!ccReady || ccDisabled}
                          onClick={() => { if (ccReady) setStep("cc-processing"); }}
                          className="relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-base font-semibold transition-all duration-300 overflow-hidden"
                          style={{
                            background: (ccReady && !ccDisabled) ? "linear-gradient(135deg, hsl(var(--primary)), hsl(270 60% 55%))" : "hsl(var(--muted))",
                            color: (ccReady && !ccDisabled) ? "hsl(0 0% 100%)" : "hsl(var(--muted-foreground))",
                            cursor: (ccReady && !ccDisabled) ? "pointer" : "not-allowed",
                            opacity: (ccReady && !ccDisabled) ? 1 : 0.6,
                          }}
                        >
                          {(ccReady && !ccDisabled) && (
                            <motion.div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, hsl(0 0% 100% / 0.15) 50%, transparent 100%)", backgroundSize: "200% 100%" }} animate={{ backgroundPosition: ["-200% 0", "200% 0"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} />
                          )}
                          <Sparkles size={15} className="relative z-10" />
                          <span className="relative z-10">Reconcile</span>
                          <ArrowRight size={15} className="relative z-10" />
                        </motion.button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <BreathingLuka visible={step === "cc-processing"} />

        {/* ═══ CC RESULTS — Credit Card Reconciliation Statement ═══ */}
        <AnimatePresence>
          {step === "cc-results" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-start gap-3">
              <LukaAvatar />
              <div className="flex-1 pt-0.5 space-y-5">

                {/* Success Message */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex items-start gap-3 mb-2">
                  <img src={lukaLogo} alt="Luka" className="w-7 h-7 rounded-full mt-0.5" />
                  <p className="text-[15px] leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
                    <strong>Successfully reconciled the credit card statement with the general ledger account for ABC Pvt. Ltd.</strong>
                  </p>
                </motion.div>

                {/* Credit Card Reconciliation Statement Table */}
                <AnimatePresence>
                {step === "cc-results" && ccStmtRows.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                      <EditableStatementTable
                        title="ABC Pvt. Ltd."
                        subtitle="Credit Card Reconciliation Statement — December 31, 2024"
                        rows={ccStmtRows}
                        onRowsChange={setCcStmtRows}
                      />

                      {/* ── Adjusting Entries Section ── */}
                      {!ccAdjPosted && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="mt-6 rounded-lg border overflow-hidden"
                          style={{ borderColor: "hsl(var(--border))" }}
                        >
                          <div className="px-5 py-3.5" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                            <p className="font-bold" style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>Post Entries to Reconcile the accounts</p>
                          </div>
                          <table className="w-full">
                            <thead>
                              <tr style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
                                <th className="text-left px-5 py-2.5 font-semibold" style={{ color: "hsl(var(--foreground))", width: 100, fontSize: 15 }}>Acc No</th>
                                <th className="text-left px-5 py-2.5 font-semibold" style={{ color: "hsl(var(--foreground))", fontSize: 15 }}>Description</th>
                                <th className="text-left px-5 py-2.5 font-semibold" style={{ color: "hsl(var(--foreground))", width: 120, fontSize: 15 }}>Date</th>
                                <th className="text-right px-5 py-2.5 font-semibold" style={{ color: "hsl(var(--foreground))", width: 130, fontSize: 15 }}>Debit</th>
                                <th className="text-right px-5 py-2.5 font-semibold" style={{ color: "hsl(var(--foreground))", width: 130, fontSize: 15 }}>Credit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ccAdjEntries.map((entry, ei) => (
                                <tr key={ei} style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
                                  <td className="px-5 py-2.5">
                                    <select
                                      value={entry.accNo}
                                      className="rounded-md border px-2.5 py-1.5 font-mono"
                                      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))", color: "hsl(var(--foreground))", width: 90, fontSize: 16 }}
                                      disabled
                                    >
                                      <option value={entry.accNo}>{entry.accNo}</option>
                                    </select>
                                  </td>
                                  <td className="px-5 py-2.5">
                                    <input
                                      type="text"
                                      value={entry.desc}
                                      onChange={(e) => {
                                        const updated = [...ccAdjEntries];
                                        updated[ei] = { ...updated[ei], desc: e.target.value };
                                        setCcAdjEntries(updated);
                                      }}
                                      className="rounded-md border px-2.5 py-1.5 w-full"
                                      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))", color: "hsl(var(--foreground))", fontSize: 16 }}
                                    />
                                  </td>
                                  <td className="px-5 py-2.5">
                                    <input
                                      type="text"
                                      value={entry.date}
                                      onChange={(e) => {
                                        const updated = [...ccAdjEntries];
                                        updated[ei] = { ...updated[ei], date: e.target.value };
                                        setCcAdjEntries(updated);
                                      }}
                                      placeholder="dd/mm/yyyy"
                                      className="rounded-md border px-2.5 py-1.5 w-[105px]"
                                      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))", color: "hsl(var(--foreground))", fontSize: 16 }}
                                    />
                                  </td>
                                  <td className="px-5 py-2.5 text-right">
                                    <input
                                      type="text"
                                      value={entry.debit}
                                      readOnly
                                      className="rounded-md border px-2.5 py-1.5 font-mono text-right w-[110px]"
                                      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.3)", color: "hsl(var(--foreground))", fontSize: 16 }}
                                    />
                                  </td>
                                  <td className="px-5 py-2.5 text-right">
                                    <input
                                      type="text"
                                      value={entry.credit}
                                      readOnly
                                      className="rounded-md border px-2.5 py-1.5 font-mono text-right w-[110px]"
                                      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.3)", color: "hsl(var(--foreground))", fontSize: 16 }}
                                    />
                                  </td>
                                </tr>
                              ))}
                              {/* Totals row */}
                              {(() => {
                                const parseN = (v: string) => parseFloat(v.replace(/,/g, "")) || 0;
                                const totD = ccAdjEntries.reduce((s, e) => s + parseN(e.debit), 0);
                                const totC = ccAdjEntries.reduce((s, e) => s + parseN(e.credit), 0);
                                const diff = totD - totC;
                                return (
                                  <>
                                    <tr style={{ borderTop: "2px solid hsl(var(--foreground))" }}>
                                      <td className="px-5 py-2.5 font-bold" colSpan={3} style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>Total</td>
                                      <td className="px-5 py-2.5 text-right font-bold font-mono" style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>{totD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                      <td className="px-5 py-2.5 text-right font-bold font-mono" style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>{totC.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                    {diff !== 0 && (
                                      <tr>
                                        <td className="px-5 py-2.5 font-semibold" colSpan={3} style={{ color: "hsl(0, 72%, 51%)", fontSize: 16 }}>Difference</td>
                                        <td className="px-5 py-2.5 text-right font-mono font-semibold" colSpan={2} style={{ color: "hsl(0, 72%, 51%)", fontSize: 16 }}>{Math.abs(diff).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                      </tr>
                                    )}
                                  </>
                                );
                              })()}
                            </tbody>
                          </table>
                          {/* Notes */}
                          <div className="px-5 py-3" style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>Notes</span>
                              <ChevronDown size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
                            </div>
                            <textarea
                              value={ccAdjNotes}
                              onChange={(e) => setCcAdjNotes(e.target.value)}
                              rows={3}
                              className="w-full border px-3 py-2 text-sm resize-none"
                              style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))", color: "hsl(var(--foreground))", borderRadius: 12 }}
                            />
                          </div>
                          {/* Post Entry button */}
                          <div className="flex justify-end px-5 py-3" style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setCcAdjPosting(true);
                                setTimeout(() => {
                                  setCcAdjPosting(false);
                                  setCcAdjPosted(true);
                                }, 1200);
                              }}
                              disabled={ccAdjPosting}
                              className="px-5 py-2 text-sm font-medium transition-all"
                              style={{
                                borderRadius: 12,
                                background: ccAdjPosting ? "hsl(var(--muted))" : "hsl(var(--primary))",
                                color: ccAdjPosting ? "hsl(var(--muted-foreground))" : "hsl(var(--primary-foreground))",
                              }}
                            >
                              {ccAdjPosting ? "Posting..." : "Post Entry"}
                            </motion.button>
                          </div>
                        </motion.div>
                      )}

                      {/* Success message after posting */}
                      {ccAdjPosted && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 flex items-center gap-2"
                        >
                          <CheckCircle2 size={16} style={{ color: "hsl(145 63% 42%)" }} />
                          <span className="text-sm font-bold" style={{ color: "hsl(145 63% 42%)" }}>
                            Adjusting entries posted. Accounts are now reconciled — Adjusted Credit Card Balance and Adjusted as per Trial Balance are now equal.
                          </span>
                        </motion.div>
                      )}

                      {/* ── Luka Summary Box: Unmatched vs Potential Matches (Credit Card) ── */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.45, ease: "easeOut" }}
                        className="mt-6 relative overflow-hidden"
                        style={{
                          borderRadius: 16,
                          border: "1.5px solid hsl(270 60% 55% / 0.25)",
                          background:
                            "linear-gradient(135deg, hsl(270 60% 55% / 0.06) 0%, hsl(207 71% 38% / 0.05) 50%, hsl(var(--background)) 100%)",
                          boxShadow: "0 4px 24px hsl(270 60% 55% / 0.08)",
                          backdropFilter: "blur(8px)",
                        }}
                      >
                        {/* Decorative gradient orb */}
                        <div
                          aria-hidden
                          style={{
                            position: "absolute",
                            top: -40,
                            right: -40,
                            width: 180,
                            height: 180,
                            borderRadius: "50%",
                            background:
                              "radial-gradient(circle, hsl(270 60% 55% / 0.18) 0%, transparent 70%)",
                            pointerEvents: "none",
                          }}
                        />

                        {/* Header */}
                        <div className="flex items-start gap-3 px-5 pt-5 pb-3 relative">
                          <LukaAvatar />
                          <div className="flex-1 pt-0.5">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span
                                className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                                style={{
                                  background:
                                    "linear-gradient(135deg, hsl(270 60% 55% / 0.15), hsl(207 71% 38% / 0.12))",
                                  color: "hsl(270 60% 45%)",
                                  letterSpacing: "0.08em",
                                }}
                              >
                                Luka Summary
                              </span>
                              <Sparkles size={13} style={{ color: "hsl(270 60% 55%)" }} />
                            </div>
                            <p
                              className="text-[15px] font-semibold leading-snug"
                              style={{ color: "hsl(var(--foreground))" }}
                            >
                              Credit card reconciliation: unmatched vs potential matches
                            </p>
                          </div>
                        </div>

                        {/* Stat Tiles */}
                        <div className="grid grid-cols-3 gap-3 px-5 pb-4 relative">
                          {(() => {
                            const parseNum = (v: string) => parseFloat(v.replace(/,/g, "")) || 0;
                            const totalAdjEntriesCc = ccAdjEntries.length;
                            const totalAdjValueCc = ccAdjEntries.reduce(
                              (s, e) => s + parseNum(e.debit) + parseNum(e.credit),
                              0,
                            );
                            const tiles = [
                              {
                                label: "Unmatched",
                                value: "4",
                                sub: "charges needing review",
                                color: "hsl(0 72% 51%)",
                                bg: "hsl(0 72% 51% / 0.08)",
                                border: "hsl(0 72% 51% / 0.25)",
                              },
                              {
                                label: "Potential Matches",
                                value: "3",
                                sub: "merchant + amount pairs",
                                color: "hsl(38 92% 50%)",
                                bg: "hsl(38 92% 50% / 0.08)",
                                border: "hsl(38 92% 50% / 0.25)",
                              },
                              {
                                label: "Unadjusted Entries",
                                value: String(totalAdjEntriesCc),
                                sub: `$${totalAdjValueCc.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total`,
                                color: "hsl(207 71% 31%)",
                                bg: "hsl(207 71% 31% / 0.08)",
                                border: "hsl(207 71% 31% / 0.25)",
                              },
                            ];
                            return tiles.map((t, i) => (
                              <motion.div
                                key={t.label}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 + i * 0.07 }}
                                className="rounded-xl px-3.5 py-3"
                                style={{
                                  background: t.bg,
                                  border: `1px solid ${t.border}`,
                                }}
                              >
                                <div
                                  className="text-[10px] font-bold uppercase tracking-wider mb-1"
                                  style={{ color: t.color, letterSpacing: "0.08em" }}
                                >
                                  {t.label}
                                </div>
                                <div
                                  className="font-mono font-bold text-[24px] leading-none"
                                  style={{ color: t.color }}
                                >
                                  {t.value}
                                </div>
                                <div
                                  className="text-[11px] mt-1.5"
                                  style={{ color: "hsl(var(--muted-foreground))" }}
                                >
                                  {t.sub}
                                </div>
                              </motion.div>
                            ));
                          })()}
                        </div>

                        {/* Methodology / How Luka identifies matches */}
                        <div
                          className="mx-5 mb-5 rounded-xl px-4 py-3.5"
                          style={{
                            background: "hsl(var(--background) / 0.7)",
                            border: "1px solid hsl(var(--border) / 0.6)",
                          }}
                        >
                          <div className="flex items-center gap-1.5 mb-2.5">
                            <Search size={13} style={{ color: "hsl(270 60% 55%)" }} />
                            <span
                              className="text-[11px] font-bold uppercase tracking-wider"
                              style={{ color: "hsl(var(--foreground))", letterSpacing: "0.06em" }}
                            >
                              How Luka identified matches
                            </span>
                          </div>
                          <ul className="space-y-1.5">
                            {[
                              {
                                label: "Exact match",
                                text: "merchant name, transaction amount, and posting date (±2 days) align between credit card statement and GL",
                              },
                              {
                                label: "Fuzzy match",
                                text: "amount tolerance ≤ $0.50, merchant similarity ≥ 80% (e.g. AMZN MKTP → Amazon, UBER*TRIP → Uber)",
                              },
                              {
                                label: "Unmatched",
                                text: "charges present in only one source — flagged as pending charges, FX/interest fees, declined refunds, or in-transit payments",
                              },
                            ].map((row, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-[13px] leading-relaxed"
                                style={{ color: "hsl(var(--foreground) / 0.85)" }}
                              >
                                <span
                                  className="mt-1.5 w-1 h-1 rounded-full shrink-0"
                                  style={{ background: "hsl(270 60% 55%)" }}
                                />
                                <span>
                                  <strong style={{ color: "hsl(var(--foreground))" }}>
                                    {row.label}:
                                  </strong>{" "}
                                  {row.text}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Footer recommendation */}
                        <div
                          className="px-5 py-3 flex items-center gap-2"
                          style={{
                            borderTop: "1px solid hsl(270 60% 55% / 0.15)",
                            background:
                              "linear-gradient(90deg, hsl(270 60% 55% / 0.04), hsl(207 71% 38% / 0.03))",
                          }}
                        >
                          <AlertCircle size={14} style={{ color: "hsl(38 92% 45%)" }} />
                          <p
                            className="text-[12.5px]"
                            style={{ color: "hsl(var(--foreground) / 0.85)" }}
                          >
                            <strong>Recommendation:</strong> Post the {ccAdjEntries.length} adjusting{" "}
                            {ccAdjEntries.length === 1 ? "entry" : "entries"} above to clear unadjusted items,
                            then review the 4 unmatched charges (likely pending or FX adjustments) before closing the credit card period.
                          </p>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Icons */}
                <AnimatePresence>
                  {step === "cc-results" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ delay: 0.5 }} className="flex items-center gap-3 mt-4">
                      {[
                        { icon: <Copy size={20} />, label: "Copy" },
                        { icon: <Download size={20} />, label: "Download", hasDropdown: true },
                        { icon: <FolderOpen size={20} />, label: "Save to Engagement" },
                        { icon: <RefreshCw size={20} />, label: "Rerun" },
                      ].map((action, i) => (
                        <div key={action.label} className="relative" ref={action.hasDropdown ? ccDownloadRef : undefined}>
                          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.08 }} onClick={() => { if (action.hasDropdown) setCcShowDownloadMenu(prev => !prev); }} className="group relative flex items-center justify-center rounded-xl border transition-all duration-150" style={{ width: 48, height: 48, borderColor: "hsl(var(--border))", background: "hsl(var(--background))", color: "hsl(var(--muted-foreground))" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; e.currentTarget.style.color = "hsl(var(--primary))"; e.currentTarget.style.boxShadow = "0 2px 8px hsl(var(--primary) / 0.15)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.color = "hsl(var(--muted-foreground))"; e.currentTarget.style.boxShadow = "none"; }}>
                            {action.icon}
                            <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-150" style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}>{action.label}</span>
                          </motion.button>
                          {action.hasDropdown && ccShowDownloadMenu && (
                            <motion.div initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.95 }} className="absolute left-0 top-full mt-2 rounded-lg border shadow-lg overflow-hidden z-50" style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", minWidth: 160 }}>
                              {[
                                { icon: <FileText size={16} />, label: "PDF", action: handleDownloadPDF },
                                { icon: <FileSpreadsheet size={16} />, label: "Excel", action: handleDownloadExcel },
                              ].map((opt) => (
                                <button key={opt.label} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium transition-all duration-150 text-left" style={{ color: "hsl(var(--foreground))" }} onMouseEnter={(e) => { e.currentTarget.style.background = "hsl(var(--muted))"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }} onClick={() => { opt.action(); setCcShowDownloadMenu(false); }}>
                                  <span style={{ color: "hsl(var(--muted-foreground))" }}>{opt.icon}</span>{opt.label}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loan/Debt done message */}
        <AnimatePresence>
          {(step === "loan-done" || step === "loan-setup" || step === "loan-processing" || step === "loan-results") && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-start gap-3">
              <LukaAvatar />
              <p className="text-base pt-1" style={{ color: "hsl(var(--foreground))" }}>
                For loan/debt reconciliation, select the loan accounts to reconcile.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loan/Debt setup - dual account selection */}
        <AnimatePresence>
          {(step === "loan-setup" || step === "loan-processing" || step === "loan-results") && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-start gap-3">
                <LukaAvatar />
                <div className="flex-1 pt-0.5">
                  {/* Account 1 (GL Loan Account) */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold" style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}>1</div>
                        <span className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>Account 1 (GL Loan Account)</span>
                      </div>
                      <div className="flex items-center">
                        <img src={quickbooksLogo} alt="QuickBooks" className="h-[21px] w-auto" />
                      </div>
                    </div>
                    <label className="text-sm font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Select Loan Account</label>
                    <div className="rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
                      <table className="w-full text-base">
                        <thead>
                          <tr style={{ background: "hsl(var(--table-header-bg))" }}>
                            <th className="text-left px-3 py-2 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Description</th>
                            <th className="text-left px-3 py-2 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Date</th>
                            <th className="text-right px-3 py-2 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Debit</th>
                            <th className="text-right px-3 py-2 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loanAccounts.map((acc, i) => {
                            const isSelected = loanAccount1 === i;
                            return (
                              <motion.tr key={acc.accountNo} initial={{ opacity: 0, backgroundColor: "hsl(0 0% 100% / 0)" }} animate={{ opacity: 1, backgroundColor: isSelected ? "hsl(207 71% 82%)" : "hsl(0 0% 100% / 0)", x: 0, transition: { duration: 0 } }} transition={{ delay: 0.3 + i * 0.06 }} onClick={() => {
                                setLoanAccount1(i);
                                setLoanAccount1Rate(acc.rate);
                                setLoanAccount1Freq(acc.freq);
                                setLoanAccount1StartDate(acc.startDate);
                              }} className="cursor-pointer transition-all duration-150" style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }} whileHover={!isSelected ? { backgroundColor: "hsl(220 20% 97%)", x: 2, transition: { duration: 0 } } : { x: 2, transition: { duration: 0 } }}>
                                <td className="px-3 py-2.5 text-base font-medium" style={{ color: "hsl(var(--foreground))" }}>
                                  <div className="flex items-center gap-2">
                                    {isSelected && <CheckCircle2 size={13} style={{ color: "hsl(145 63% 42%)" }} />}
                                    {acc.description}
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 font-mono text-base font-medium" style={{ color: "hsl(0 0% 0%)" }}>{acc.date}</td>
                                <td className="px-3 py-2.5 text-base text-right font-mono font-medium" style={{ color: "hsl(var(--foreground))" }}>{acc.debit}</td>
                                <td className="px-3 py-2.5 text-base text-right font-mono font-medium" style={{ color: "hsl(0 0% 0%)" }}>{acc.credit}</td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {/* Account 1 parameters */}
                    {loanAccount1 !== null && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block" style={{ color: "hsl(var(--muted-foreground))" }}>Interest Rate (%)</label>
                          <div className="relative">
                            <input type="number" step="0.01" value={loanAccount1Rate} onChange={(e) => setLoanAccount1Rate(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all duration-150 font-mono" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }} onFocus={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--primary) / 0.08)"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.boxShadow = "none"; }} />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>%</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block" style={{ color: "hsl(var(--muted-foreground))" }}>Payment Frequency</label>
                          <div className="relative">
                            <motion.button type="button" onClick={() => setLoanAccount1FreqOpen(!loanAccount1FreqOpen)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm outline-none cursor-pointer transition-all duration-200" style={{ borderColor: loanAccount1FreqOpen ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }} whileHover={{ borderColor: "hsl(var(--primary) / 0.3)" }}>
                              <span>{loanAccount1Freq}</span>
                              <ChevronDown size={14} style={{ color: "hsl(var(--muted-foreground))", transform: loanAccount1FreqOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
                            </motion.button>
                            <AnimatePresence>
                              {loanAccount1FreqOpen && (
                                <motion.div initial={{ opacity: 0, y: -4, scaleY: 0.95 }} animate={{ opacity: 1, y: 0, scaleY: 1 }} exit={{ opacity: 0, y: -4, scaleY: 0.95 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} style={{ transformOrigin: "top center", background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", boxShadow: "0 8px 24px hsl(220 20% 10% / 0.08)" }} className="absolute left-0 right-0 top-full mt-1.5 rounded-lg z-50 overflow-hidden">
                                  {["Monthly", "Quarterly", "Annually"].map((opt, idx) => (
                                    <motion.button key={opt} type="button" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }} onClick={() => { setLoanAccount1Freq(opt); setLoanAccount1FreqOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-all duration-150 cursor-pointer" style={{ background: loanAccount1Freq === opt ? "hsl(var(--primary) / 0.06)" : "transparent", borderBottom: idx < 2 ? "1px solid hsl(var(--border) / 0.5)" : "none", color: "hsl(var(--foreground))" }} whileHover={{ background: "hsl(var(--primary) / 0.04)" }}>
                                      {loanAccount1Freq === opt && <CheckCircle2 size={12} style={{ color: "hsl(var(--primary))" }} />}
                                      {opt}
                                    </motion.button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block" style={{ color: "hsl(var(--muted-foreground))" }}>Start Date</label>
                          <input type="date" value={loanAccount1StartDate} onChange={(e) => setLoanAccount1StartDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all duration-150" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }} onFocus={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--primary) / 0.08)"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.boxShadow = "none"; }} />
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Account 2 (Statement / Lender) */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold" style={{ background: "hsl(270 60% 55% / 0.08)", color: "hsl(270 60% 55%)" }}>2</div>
                        <span className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>Account 2 (Statement / Lender)</span>
                      </div>
                      <div className="flex items-center">
                        <img src={quickbooksLogo} alt="QuickBooks" className="h-[21px] w-auto" />
                      </div>
                    </div>
                    <label className="text-sm font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Select Loan Account</label>
                    <div className="rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
                      <table className="w-full text-base">
                        <thead>
                          <tr style={{ background: "hsl(var(--table-header-bg))" }}>
                            <th className="text-left px-3 py-2 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Description</th>
                            <th className="text-left px-3 py-2 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Date</th>
                            <th className="text-right px-3 py-2 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Debit</th>
                            <th className="text-right px-3 py-2 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loanAccounts.filter((_, i) => i !== loanAccount1).map((acc) => {
                            const origIdx = loanAccounts.indexOf(acc);
                            const isSelected = loanAccount2 === origIdx;
                            return (
                              <motion.tr key={acc.accountNo} initial={{ opacity: 0, backgroundColor: "hsl(0 0% 100% / 0)" }} animate={{ opacity: 1, backgroundColor: isSelected ? "hsl(270 60% 96%)" : "hsl(0 0% 100% / 0)", x: 0, transition: { duration: 0 } }} transition={{ delay: 0.3 + origIdx * 0.06 }} onClick={() => {
                                setLoanAccount2(origIdx);
                                setLoanAccount2Rate(acc.rate);
                                setLoanAccount2Freq(acc.freq);
                                setLoanAccount2StartDate(acc.startDate);
                              }} className="cursor-pointer transition-all duration-150" style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }} whileHover={!isSelected ? { backgroundColor: "hsl(220 20% 97%)", x: 2, transition: { duration: 0 } } : { x: 2, transition: { duration: 0 } }}>
                                <td className="px-3 py-2.5 text-base font-medium" style={{ color: "hsl(var(--foreground))" }}>
                                  <div className="flex items-center gap-2">
                                    {isSelected && <CheckCircle2 size={13} style={{ color: "hsl(145 63% 42%)" }} />}
                                    {acc.description}
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 font-mono text-base font-medium" style={{ color: "hsl(0 0% 0%)" }}>{acc.date}</td>
                                <td className="px-3 py-2.5 text-base text-right font-mono font-medium" style={{ color: "hsl(var(--foreground))" }}>{acc.debit}</td>
                                <td className="px-3 py-2.5 text-base text-right font-mono font-medium" style={{ color: "hsl(0 0% 0%)" }}>{acc.credit}</td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {/* Account 2 parameters */}
                    {loanAccount2 !== null && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block" style={{ color: "hsl(var(--muted-foreground))" }}>Interest Rate (%)</label>
                          <div className="relative">
                            <input type="number" step="0.01" value={loanAccount2Rate} onChange={(e) => setLoanAccount2Rate(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all duration-150 font-mono" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }} onFocus={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--primary) / 0.08)"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.boxShadow = "none"; }} />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>%</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block" style={{ color: "hsl(var(--muted-foreground))" }}>Payment Frequency</label>
                          <div className="relative">
                            <motion.button type="button" onClick={() => setLoanAccount2FreqOpen(!loanAccount2FreqOpen)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm outline-none cursor-pointer transition-all duration-200" style={{ borderColor: loanAccount2FreqOpen ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }} whileHover={{ borderColor: "hsl(var(--primary) / 0.3)" }}>
                              <span>{loanAccount2Freq}</span>
                              <ChevronDown size={14} style={{ color: "hsl(var(--muted-foreground))", transform: loanAccount2FreqOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
                            </motion.button>
                            <AnimatePresence>
                              {loanAccount2FreqOpen && (
                                <motion.div initial={{ opacity: 0, y: -4, scaleY: 0.95 }} animate={{ opacity: 1, y: 0, scaleY: 1 }} exit={{ opacity: 0, y: -4, scaleY: 0.95 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} style={{ transformOrigin: "top center", background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", boxShadow: "0 8px 24px hsl(220 20% 10% / 0.08)" }} className="absolute left-0 right-0 top-full mt-1.5 rounded-lg z-50 overflow-hidden">
                                  {["Monthly", "Quarterly", "Annually"].map((opt, idx) => (
                                    <motion.button key={opt} type="button" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }} onClick={() => { setLoanAccount2Freq(opt); setLoanAccount2FreqOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-all duration-150 cursor-pointer" style={{ background: loanAccount2Freq === opt ? "hsl(var(--primary) / 0.06)" : "transparent", borderBottom: idx < 2 ? "1px solid hsl(var(--border) / 0.5)" : "none", color: "hsl(var(--foreground))" }} whileHover={{ background: "hsl(var(--primary) / 0.04)" }}>
                                      {loanAccount2Freq === opt && <CheckCircle2 size={12} style={{ color: "hsl(var(--primary))" }} />}
                                      {opt}
                                    </motion.button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block" style={{ color: "hsl(var(--muted-foreground))" }}>Start Date</label>
                          <input type="date" value={loanAccount2StartDate} onChange={(e) => setLoanAccount2StartDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all duration-150" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }} onFocus={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--primary) / 0.08)"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.boxShadow = "none"; }} />
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Reconcile Button */}
                  {step === "loan-setup" && (
                    <div className="flex justify-end pt-4">
                      <motion.button
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.65 }}
                        whileHover={loanAccount1 !== null && loanAccount2 !== null ? { scale: 1.03, boxShadow: "0 4px 20px hsl(var(--primary) / 0.25)" } : {}}
                        whileTap={loanAccount1 !== null && loanAccount2 !== null ? { scale: 0.97 } : {}}
                        disabled={loanAccount1 === null || loanAccount2 === null}
                        onClick={() => { if (loanAccount1 !== null && loanAccount2 !== null) setStep("loan-processing"); }}
                        className="relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-base font-semibold transition-all duration-300 overflow-hidden"
                        style={{
                          background: loanAccount1 !== null && loanAccount2 !== null ? "linear-gradient(135deg, hsl(var(--primary)), hsl(270 60% 55%))" : "hsl(var(--muted))",
                          color: loanAccount1 !== null && loanAccount2 !== null ? "hsl(0 0% 100%)" : "hsl(var(--muted-foreground))",
                          cursor: loanAccount1 !== null && loanAccount2 !== null ? "pointer" : "not-allowed",
                          opacity: loanAccount1 !== null && loanAccount2 !== null ? 1 : 0.6,
                        }}
                      >
                        {loanAccount1 !== null && loanAccount2 !== null && (
                          <motion.div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, hsl(0 0% 100% / 0.15) 50%, transparent 100%)", backgroundSize: "200% 100%" }} animate={{ backgroundPosition: ["-200% 0", "200% 0"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} />
                        )}
                        <Sparkles size={15} className="relative z-10" />
                        <span className="relative z-10">Reconcile</span>
                        <ArrowRight size={15} className="relative z-10" />
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <BreathingLuka visible={step === "loan-processing"} />

        {/* Loan/Debt Results */}
        <AnimatePresence>
          {step === "loan-results" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-start gap-3">
              <LukaAvatar />
              <div className="flex-1 pt-0.5 space-y-5">
                {(() => {
                  const la1 = loanAccount1 !== null ? loanAccounts[loanAccount1] : null;
                  const la2 = loanAccount2 !== null ? loanAccounts[loanAccount2] : null;
                  const la1Bal = la1 ? parseFloat(la1.debit.replace(/[^0-9.-]/g, "")) : 0;
                  const la2Bal = la2 ? parseFloat(la2.debit.replace(/[^0-9.-]/g, "")) : 0;
                  const loanPostedTotal = loanUnmatchedData.reduce((sum, item, idx) => loanPostedItems.has(idx) ? sum + item.diff : sum, 0);
                  const loanRemaining = loanUnmatchedData.reduce((sum, item, idx) => loanPostedItems.has(idx) ? sum : sum + item.diff, 0);
                  const adjustedLa2 = la2Bal + loanPostedTotal;
                  const closingLa2 = la2Bal + loanPostedTotal;

                  return (
                    <>
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-base leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
                        Found 5 unmatched line items between{" "}
                        <strong>Loan Account 1 ({la1?.accountNo} — {la1?.description})</strong>{" "}
                        and{" "}
                        <strong>Loan Account 2 ({la2?.accountNo} — {la2?.description})</strong>.
                        {" "}Post the suggested entries to reconcile both accounts into agreement and save or export.
                      </motion.p>

                      {/* Table 1: Account Summary */}
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
                          <table className="w-full text-base">
                            <thead>
                              <tr style={{ background: "hsl(var(--table-header-bg))" }}>
                                <th className="text-left px-4 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Acc No.</th>
                                <th className="text-left px-4 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Description</th>
                                <th className="text-right px-4 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Difference</th>
                              </tr>
                            </thead>
                            <tbody>
                              <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }} whileHover={{ backgroundColor: "hsl(220 20% 97%)", x: 2, transition: { duration: 0 } }} className="cursor-default">
                                <td className="px-4 py-2.5 text-base font-medium" style={{ color: "hsl(0 0% 0%)" }}>{la1?.accountNo}</td>
                                <td className="px-4 py-2.5 text-base font-medium" style={{ color: "hsl(var(--foreground))" }}>{la1?.description}</td>
                                <td className="px-4 py-2.5 text-base text-right font-mono font-medium" style={{ color: "hsl(var(--foreground))" }}>{la1?.debit}</td>
                              </motion.tr>
                              <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.48 }} style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }} whileHover={{ backgroundColor: "hsl(220 20% 97%)", x: 2, transition: { duration: 0 } }} className="cursor-default">
                                <td className="px-4 py-2.5 text-base font-medium" style={{ color: "hsl(0 0% 0%)" }}>{la2?.accountNo}</td>
                                <td className="px-4 py-2.5 text-base font-medium" style={{ color: "hsl(var(--foreground))" }}>{la2?.description}</td>
                                <td className="px-4 py-2.5 text-base text-right font-mono font-medium" style={{ color: "hsl(var(--foreground))" }}>{loanRemaining === 0 ? la1?.debit : fmt(Math.abs(adjustedLa2))}</td>
                              </motion.tr>
                              <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.56 }} style={{ borderTop: "1px solid hsl(var(--border))" }} className="cursor-default">
                                <td colSpan={2} className="px-4 py-2.5 text-base font-bold" style={{ color: "hsl(var(--foreground))" }}>Net Difference</td>
                                <td className="px-4 py-2.5 text-base text-right font-mono font-bold" style={{ color: loanRemaining !== 0 ? "hsl(0 80% 50%)" : "hsl(145 63% 42%)" }}>{fmt(Math.abs(loanRemaining))}</td>
                              </motion.tr>
                            </tbody>
                          </table>
                        </div>
                      </motion.div>

                      {/* Table 2: Unmatched Transaction Details */}
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
                          <table className="w-full text-base">
                            <thead>
                              <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                                <td colSpan={9} className="px-4 py-3 text-base font-bold" style={{ color: "hsl(var(--foreground))" }}>Unmatched Transaction Details to Reconcile ({loanUnmatchedData.length})</td>
                              </tr>
                              <tr style={{ background: "hsl(var(--table-header-bg))", borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
                                <th className="text-left px-4 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Date</th>
                                <th className="text-left px-4 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Description</th>
                                <th className="text-right px-3 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Acc 1 Debit</th>
                                <th className="text-right px-3 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Acc 1 Credit</th>
                                <th className="text-right px-3 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Acc 2 Debit</th>
                                <th className="text-right px-3 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Acc 2 Credit</th>
                                <th className="text-right px-3 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Difference</th>
                                <th className="text-left px-3 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Note</th>
                                <th className="text-center px-3 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {loanUnmatchedData.map((item, j) => {
                                const isPosted = loanPostedItems.has(j);
                                const isPosting = loanPostingItems.has(j);
                                const ea = loanEditAmounts[j] || { d1: item.debit1.toString(), c1: item.credit1.toString(), d2: item.debit2.toString(), c2: item.credit2.toString() };
                                const editDiff = calcDiff(ea);
                                const handleLoanPostSingle = (e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  if (isPosted || isPosting) return;
                                  setLoanPostingItems(prev => new Set(prev).add(j));
                                  setTimeout(() => {
                                    setLoanPostingItems(prev => { const n = new Set(prev); n.delete(j); return n; });
                                    setLoanPostedItems(prev => new Set(prev).add(j));
                                  }, 800);
                                };
                                const handleLoanUnpost = (e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  setLoanPostedItems(prev => { const n = new Set(prev); n.delete(j); return n; });
                                };
                                const updateLoanField = (field: 'd1'|'c1'|'d2'|'c2', val: string) => {
                                  setLoanEditAmounts(prev => ({ ...prev, [j]: { ...prev[j], [field]: val } }));
                                };
                                return (
                                  <motion.tr key={`loan-unmatched-${j}`} initial={{ opacity: 0 }} animate={{ opacity: 1, x: 0, backgroundColor: isPosted ? "hsl(145 60% 96%)" : "hsl(0 0% 100% / 0)", transition: { duration: 0 } }} style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }} whileHover={{ backgroundColor: isPosted ? "hsl(145 55% 93%)" : "hsl(220 20% 97%)", x: 2, transition: { duration: 0 } }} className="cursor-default">
                                    <td className="px-4 py-2.5 text-base font-medium" style={{ color: isPosted ? "hsl(145 63% 32%)" : "hsl(var(--foreground))" }}>{item.date}</td>
                                    <td className="px-4 py-2.5 text-base font-medium" style={{ color: isPosted ? "hsl(145 63% 32%)" : "hsl(var(--foreground))" }}>
                                      {isPosted && <CheckCircle2 size={13} className="inline mr-1.5" style={{ color: "hsl(145 63% 42%)" }} />}
                                      {item.desc}
                                    </td>
                                    {(['d1','c1','d2','c2'] as const).map(field => (
                                      <td key={field} className="px-3 py-2 text-right">
                                        {isPosted ? (
                                          <span className="text-base font-mono font-medium" style={{ color: "hsl(145 63% 32%)" }}>{fmt(parseFloat(ea[field]) || 0)}</span>
                                        ) : (
                                          <input type="text" value={ea[field]} onChange={(e) => updateLoanField(field, e.target.value)} onClick={(e) => e.stopPropagation()} className="w-20 text-right text-sm font-mono px-2 py-1.5 rounded-md border outline-none transition-all duration-150" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))", color: "hsl(var(--foreground))" }} onFocus={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; e.currentTarget.style.boxShadow = "0 0 0 2px hsl(var(--primary) / 0.1)"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.boxShadow = "none"; }} />
                                        )}
                                      </td>
                                    ))}
                                    <td className="px-3 py-2.5 text-base text-right font-mono font-bold" style={{ color: isPosted ? "hsl(145 63% 42%)" : "hsl(0 80% 50%)" }}>
                                      {isPosted ? "Posted" : fmt(Math.abs(editDiff))}
                                    </td>
                                    <td className="px-4 py-2.5">
                                      {!isPosted && (
                                        <input type="text" placeholder="Add note..." value={loanItemNotes[j] || ""} onChange={(e) => setLoanItemNotes(prev => ({ ...prev, [j]: e.target.value }))} className="w-full text-sm px-2.5 py-1.5 rounded-md border outline-none transition-all duration-150" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))", color: "hsl(var(--foreground))" }} onFocus={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; e.currentTarget.style.boxShadow = "0 0 0 2px hsl(var(--primary) / 0.1)"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.boxShadow = "none"; }} onClick={(e) => e.stopPropagation()} />
                                      )}
                                      {isPosted && (
                                        <span className="text-sm font-medium" style={{ color: loanItemNotes[j] ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>{loanItemNotes[j] || "—"}</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                      <div className="inline-flex items-center gap-2">
                                        {isPosting ? (
                                          <motion.div className="inline-flex items-center gap-1.5 p-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}><Loader2 size={14} /></motion.div>
                                          </motion.div>
                                        ) : isPosted ? (
                                          <motion.button initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleLoanUnpost} className="p-1.5 rounded-md transition-colors duration-0" style={{ color: "hsl(0 70% 50%)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "hsl(0 70% 35%)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "hsl(0 70% 50%)"; }} title="Unpost Entry"><Undo2 size={14} /></motion.button>
                                        ) : (
                                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleLoanPostSingle} className="p-1.5 rounded-md transition-colors duration-0" style={{ color: "#00A273" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#006B4F"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#00A273"; }} title="Post Entry"><FileUp size={14} /></motion.button>
                                        )}
                                        <motion.button whileHover={!isPosted ? { scale: 1.1 } : {}} whileTap={!isPosted ? { scale: 0.9 } : {}} onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-md transition-colors duration-0" style={{ color: isPosted ? "hsl(var(--muted-foreground) / 0.3)" : "hsl(0 70% 50%)", cursor: isPosted ? "not-allowed" : "pointer" }} onMouseEnter={(e) => { if (!isPosted) e.currentTarget.style.color = "hsl(0 70% 35%)"; }} onMouseLeave={(e) => { if (!isPosted) e.currentTarget.style.color = "hsl(0 70% 50%)"; }} disabled={isPosted} title={isPosted ? "Unpost entry before deleting" : "Delete entry"}><Trash2 size={14} /></motion.button>
                                      </div>
                                    </td>
                                  </motion.tr>
                                );
                              })}
                            </tbody>
                          </table>
                          {/* Post All Entries */}
                          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex justify-end items-center gap-3 px-4 py-3" style={{ borderTop: "1px solid hsl(var(--border) / 0.4)" }}>
                            {loanPostedItems.size < loanUnmatchedData.length && !loanPostingAll && (
                              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={(e) => {
                                e.stopPropagation();
                                setLoanAccount1(null);
                                setLoanAccount2(null);
                                setLoanPostedItems(new Set());
                                setLoanPostingItems(new Set());
                                setLoanItemNotes({});
                                setLoanMatchedExpanded(false);
                                setLoanProcessingLines(0);
                                setStep("loan-setup");
                              }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all" style={{ border: "1.5px solid hsl(var(--border))", color: "hsl(var(--foreground))", background: "hsl(var(--background))" }}>
                                <Undo2 size={15} />Reselect
                              </motion.button>
                            )}
                            {loanPostedItems.size > 0 && loanPostedItems.size < loanUnmatchedData.length && (
                              <span className="text-xs font-medium" style={{ color: "hsl(145 63% 42%)" }}>{loanPostedItems.size} of {loanUnmatchedData.length} posted</span>
                            )}
                            {loanPostedItems.size === loanUnmatchedData.length ? (
                              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold" style={{ color: "hsl(145 63% 42%)" }}>
                                <CheckCircle2 size={16} />All Entries Posted
                              </motion.div>
                            ) : loanPostingAll ? (
                              <motion.div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold" style={{ color: "hsl(var(--muted-foreground))" }}>
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}><Loader2 size={15} /></motion.div>
                                Posting entries…
                                <motion.div className="ml-1 h-1 rounded-full overflow-hidden" style={{ width: 60, background: "hsl(var(--border))" }}>
                                  <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2, ease: "easeInOut" }} className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #00A273, #00B880)" }} />
                                </motion.div>
                              </motion.div>
                            ) : (
                              <motion.button whileHover={{ scale: 1.03, boxShadow: "0 6px 20px rgba(0, 162, 115, 0.4)" }} whileTap={{ scale: 0.97 }} onClick={(e) => {
                                e.stopPropagation();
                                setLoanPostingAll(true);
                                const unposted = Array.from({ length: loanUnmatchedData.length }, (_, i) => i).filter(i => !loanPostedItems.has(i));
                                unposted.forEach((idx, i) => {
                                  setTimeout(() => setLoanPostingItems(prev => new Set(prev).add(idx)), i * 350);
                                  setTimeout(() => {
                                    setLoanPostingItems(prev => { const n = new Set(prev); n.delete(idx); return n; });
                                    setLoanPostedItems(prev => new Set(prev).add(idx));
                                    if (i === unposted.length - 1) setLoanPostingAll(false);
                                  }, i * 350 + 700);
                                });
                              }} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all" style={{ background: "linear-gradient(135deg, #00A273, #00B880)", color: "#fff", boxShadow: "0 3px 12px rgba(0, 162, 115, 0.25)", letterSpacing: "0.02em" }}>
                                <CheckCircle2 size={15} />Post All Entries
                                <span className="ml-1 px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(255,255,255,0.2)" }}>{loanUnmatchedData.length - loanPostedItems.size}</span>
                              </motion.button>
                            )}
                          </motion.div>
                        </div>
                      </motion.div>

                      {/* Loan Success Message & Action Icons */}
                      <AnimatePresence>
                        {loanPostedItems.size === loanUnmatchedData.length && (
                          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex items-start gap-3 mt-6 mb-2">
                            <img src={lukaLogo} alt="Luka" className="w-7 h-7 rounded-full mt-0.5" />
                            <p className="text-[15px] leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
                              <strong>Successfully reconciled the selected Loan/Debt accounts.</strong>
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <AnimatePresence>
                        {loanPostedItems.size === loanUnmatchedData.length && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ delay: 0.3 }} className="flex items-center gap-3 mt-4">
                            {[
                              { icon: <Copy size={20} />, label: "Copy" },
                              { icon: <Download size={20} />, label: "Download", hasDropdown: true },
                              { icon: <FolderOpen size={20} />, label: "Save to Engagement" },
                              { icon: <RefreshCw size={20} />, label: "Rerun" },
                            ].map((action, i) => (
                              <div key={action.label} className="relative" ref={action.hasDropdown ? loanDownloadRef : undefined}>
                                <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.08 }} onClick={() => { if (action.hasDropdown) setLoanShowDownloadMenu(prev => !prev); }} className="group relative flex items-center justify-center rounded-xl border transition-all duration-150" style={{ width: 48, height: 48, borderColor: "hsl(var(--border))", background: "hsl(var(--background))", color: "hsl(var(--muted-foreground))" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; e.currentTarget.style.color = "hsl(var(--primary))"; e.currentTarget.style.boxShadow = "0 2px 8px hsl(var(--primary) / 0.15)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.color = "hsl(var(--muted-foreground))"; e.currentTarget.style.boxShadow = "none"; }}>
                                  {action.icon}
                                  <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-150" style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}>{action.label}</span>
                                </motion.button>
                                {action.hasDropdown && loanShowDownloadMenu && (
                                  <motion.div initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.95 }} className="absolute left-0 top-full mt-2 rounded-lg border shadow-lg overflow-hidden z-50" style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", minWidth: 160 }}>
                                    {[
                                      { icon: <FileText size={16} />, label: "PDF", action: handleDownloadPDF },
                                      { icon: <FileSpreadsheet size={16} />, label: "Excel", action: handleDownloadExcel },
                                    ].map((opt) => (
                                      <button key={opt.label} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium transition-all duration-150 text-left" style={{ color: "hsl(var(--foreground))" }} onMouseEnter={(e) => { e.currentTarget.style.background = "hsl(var(--muted))"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }} onClick={() => { opt.action(); setLoanShowDownloadMenu(false); }}>
                                        <span style={{ color: "hsl(var(--muted-foreground))" }}>{opt.icon}</span>{opt.label}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <BreathingLuka visible={step === "payroll-thinking"} />

        {/* Payroll done message */}
        <AnimatePresence>
          {(step === "payroll-done" || step === "payroll-setup") && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-start gap-3">
              <LukaAvatar />
              <p className="text-base pt-1" style={{ color: "hsl(var(--foreground))" }}>
                For payroll reconciliation, select from the below inputs to proceed.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payroll setup */}
        <AnimatePresence>
          {step === "payroll-setup" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-start gap-3">
                <LukaAvatar />
                <div className="flex-1 pt-0.5 space-y-5" style={{ maxWidth: 520 }}>
                  {/* Payroll Period */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <label className="text-sm font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Payroll Period</label>
                    <div className="relative">
                      <motion.button
                        type="button"
                        onClick={() => setPayrollPeriodOpen(!payrollPeriodOpen)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-base outline-none cursor-pointer transition-all duration-200"
                        style={{
                          borderColor: payrollPeriodOpen ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))",
                          background: "hsl(var(--card))",
                          color: payrollPeriod ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                          boxShadow: payrollPeriodOpen ? "0 0 0 3px hsl(var(--primary) / 0.08)" : "none",
                        }}
                        whileHover={{ borderColor: "hsl(var(--primary) / 0.3)" }}
                      >
                        <span>{payrollPeriod || "Select period"}</span>
                        <ChevronDown size={16} style={{ color: "hsl(var(--muted-foreground))", transform: payrollPeriodOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
                      </motion.button>
                      <AnimatePresence>
                        {payrollPeriodOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
                            animate={{ opacity: 1, y: 0, scaleY: 1 }}
                            exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            style={{ transformOrigin: "top center", background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", boxShadow: "0 8px 24px hsl(220 20% 10% / 0.08)" }}
                            className="absolute left-0 right-0 top-full mt-1.5 rounded-lg z-50 overflow-hidden"
                          >
                            {["Monthly", "Quarterly"].map((opt, i) => (
                              <motion.button
                                key={opt}
                                type="button"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                onClick={() => { setPayrollPeriod(opt); setPayrollPeriodOpen(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-base transition-all duration-150 cursor-pointer"
                                style={{ background: payrollPeriod === opt ? "hsl(var(--primary) / 0.06)" : "transparent", borderBottom: i < 1 ? "1px solid hsl(var(--border) / 0.5)" : "none", color: "hsl(var(--foreground))" }}
                                whileHover={{ background: "hsl(var(--primary) / 0.04)" }}
                              >
                                {payrollPeriod === opt && <CheckCircle2 size={14} style={{ color: "hsl(var(--primary))" }} />}
                                {opt}
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>

                  {/* Treatment of Unpaid Liabilities */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                    <label className="text-sm font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Treatment of Unpaid Liabilities</label>
                    <motion.button
                      type="button"
                      onClick={() => setPayrollUnpaidToggle(!payrollUnpaidToggle)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border w-full text-base transition-all duration-200 cursor-pointer"
                      style={{
                        borderColor: payrollUnpaidToggle ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))",
                        background: payrollUnpaidToggle ? "hsl(var(--primary) / 0.04)" : "hsl(var(--card))",
                      }}
                      whileHover={{ borderColor: "hsl(var(--primary) / 0.3)" }}
                    >
                      <div
                        className="w-10 h-6 rounded-full relative shrink-0 transition-all duration-200"
                        style={{ background: payrollUnpaidToggle ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
                      >
                        <motion.div
                          className="absolute top-0.5 w-5 h-5 rounded-full shadow-md"
                          style={{ background: "#fff" }}
                          animate={{ left: payrollUnpaidToggle ? 18 : 2 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </div>
                      <span style={{ color: "hsl(var(--foreground))" }}>
                        {payrollUnpaidToggle ? "Include unpaid liabilities in reconciliation" : "Exclude unpaid liabilities from reconciliation"}
                      </span>
                    </motion.button>
                  </motion.div>

                  {/* Reconcile Button */}
                  <div className="flex justify-end pt-4">
                    <motion.button
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      whileHover={payrollPeriod ? { scale: 1.03, boxShadow: "0 4px 20px hsl(var(--primary) / 0.25)" } : {}}
                      whileTap={payrollPeriod ? { scale: 0.97 } : {}}
                      disabled={!payrollPeriod}
                      className="relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-base font-semibold transition-all duration-300 overflow-hidden"
                      style={{
                        background: payrollPeriod ? "linear-gradient(135deg, hsl(var(--primary)), hsl(270 60% 55%))" : "hsl(var(--muted))",
                        color: payrollPeriod ? "hsl(0 0% 100%)" : "hsl(var(--muted-foreground))",
                        cursor: payrollPeriod ? "pointer" : "not-allowed",
                        opacity: payrollPeriod ? 1 : 0.6,
                      }}
                    >
                      {payrollPeriod && (
                        <motion.div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, hsl(0 0% 100% / 0.15) 50%, transparent 100%)", backgroundSize: "200% 100%" }} animate={{ backgroundPosition: ["-200% 0", "200% 0"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} />
                      )}
                      <Sparkles size={15} className="relative z-10" />
                      <span className="relative z-10">Reconcile</span>
                      <ArrowRight size={15} className="relative z-10" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <BreathingLuka visible={step === "bank-thinking"} />

        {/* Bank done message - Period selection prompt */}
        <AnimatePresence>
          {(step === "bank-done" || step === "bank-year-select" || step === "bank-year-processing" || step === "bank-year-done" || step === "bank-setup" || step === "bank-processing" || step === "bank-results") && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-start gap-3">
              <LukaAvatar />
              <p className="text-base pt-1" style={{ color: "hsl(var(--foreground))" }}>
                For bank reconciliation, select the <strong>period</strong> you want to reconcile for <strong>ABC Pvt. Ltd.</strong> The engagement period is preselected — adjust if needed.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Period range picker */}
        <AnimatePresence>
          {(step === "bank-year-select" || step === "bank-year-processing" || step === "bank-year-done" || step === "bank-setup" || step === "bank-processing" || step === "bank-results") && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="flex items-start gap-3">
                <div className="w-7 shrink-0" />
                <div
                  className="flex flex-col gap-3 p-4 rounded-2xl"
                  style={{
                    border: "1.5px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                    boxShadow: "0 1px 2px hsl(var(--foreground) / 0.04)",
                    minWidth: 420,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}
                    >
                      <CalendarIcon size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>
                        Reconciliation Period
                      </span>
                      <span className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                        Engagement: Jan 1, {engagementYear} — Dec 31, {engagementYear}
                      </span>
                    </div>
                  </div>

                  <Popover open={bankPeriodOpen} onOpenChange={(o) => !bankPeriodConfirmed && setBankPeriodOpen(o)}>
                    <PopoverTrigger asChild>
                      <button
                        disabled={bankPeriodConfirmed}
                        className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all"
                        style={{
                          border: "1.5px solid hsl(var(--border))",
                          background: "hsl(var(--background))",
                          color: "hsl(var(--foreground))",
                          cursor: bankPeriodConfirmed ? "default" : "pointer",
                          opacity: bankPeriodConfirmed ? 0.85 : 1,
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <CalendarIcon size={15} style={{ color: "hsl(var(--primary))" }} />
                          {bankPeriodRange?.from && bankPeriodRange?.to ? (
                            <span>
                              {format(bankPeriodRange.from, "MMM d, yyyy")}
                              <span style={{ color: "hsl(var(--muted-foreground))" }}> → </span>
                              {format(bankPeriodRange.to, "MMM d, yyyy")}
                            </span>
                          ) : (
                            <span style={{ color: "hsl(var(--muted-foreground))" }}>Pick a period</span>
                          )}
                        </span>
                        <ChevronDown size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={bankPeriodRange}
                        onSelect={setBankPeriodRange}
                        numberOfMonths={2}
                        defaultMonth={bankPeriodRange?.from}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  {!bankPeriodConfirmed && (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      disabled={!bankPeriodRange?.from || !bankPeriodRange?.to}
                      onClick={() => {
                        if (!bankPeriodRange?.from || !bankPeriodRange?.to) return;
                        const label = `${format(bankPeriodRange.from, "MMM d, yyyy")} – ${format(bankPeriodRange.to, "MMM d, yyyy")}`;
                        setBankSelectedYear(label);
                        setBankPeriodConfirmed(true);
                        setBankPeriodOpen(false);
                        onActivity?.(`Selected period: ${label}`, "done");
                        setTimeout(() => setStep("bank-year-processing"), 400);
                      }}
                      className="self-end inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: "hsl(var(--primary))",
                        color: "hsl(var(--primary-foreground))",
                        opacity: bankPeriodRange?.from && bankPeriodRange?.to ? 1 : 0.5,
                        cursor: bankPeriodRange?.from && bankPeriodRange?.to ? "pointer" : "not-allowed",
                      }}
                    >
                      Confirm Period
                      <ArrowRight size={14} />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <BreathingLuka visible={step === "bank-year-processing"} />

        {/* Bank year done + setup message */}
        <AnimatePresence>
          {(step === "bank-year-done" || step === "bank-setup" || step === "bank-processing" || step === "bank-results") && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-start gap-3">
              <LukaAvatar />
              <p className="text-base pt-1" style={{ color: "hsl(var(--foreground))" }}>
                For bank reconciliation <strong>{bankSelectedYear}</strong>, select from the below inputs to proceed.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bank setup - Redesigned */}
        <AnimatePresence>
          {(step === "bank-setup" || step === "bank-processing" || step === "bank-results") && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-start gap-3">
                <LukaAvatar />
                <div className="flex-1 pt-0.5 space-y-5">

                   {/* Account 1 - Bank Account */}
                   <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                     <div className="flex items-center justify-between mb-3">
                       <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold" style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}>1</div>
                         <span className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>Bank Account</span>
                       </div>
                       <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "hsl(145 63% 42% / 0.08)", border: "1px solid hsl(145 63% 42% / 0.2)" }}>
                         <div className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(145 63% 42%)" }} />
                         <span className="text-xs font-medium" style={{ color: "hsl(145 63% 42%)" }}>Connected to Bank</span>
                       </div>
                     </div>

                     {/* Bank Account Dropdown */}
                     <div className="relative">
                       <motion.button
                         onClick={() => { if (step === "bank-setup") setBankAccount1Open(!bankAccount1Open); }}
                         className="w-full flex items-center justify-between px-4 py-3 rounded-lg border text-base transition-all duration-200"
                         style={{
                           borderColor: bankAccount1Open ? "hsl(var(--primary))" : "hsl(var(--border))",
                           background: "hsl(var(--card))",
                           color: "hsl(var(--foreground))",
                           boxShadow: bankAccount1Open ? "0 0 0 3px hsl(var(--primary) / 0.08)" : "none",
                           cursor: step === "bank-setup" ? "pointer" : "default",
                         }}
                       >
                         <span className={bankAccount1 !== null ? "font-medium" : ""} style={{ color: bankAccount1 !== null ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>
                           {bankAccount1 !== null ? bankAccounts[bankAccount1].description : "Select a bank account"}
                         </span>
                         <ChevronDown size={16} style={{ color: "hsl(var(--muted-foreground))", transform: bankAccount1Open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                       </motion.button>

                       <AnimatePresence>
                         {bankAccount1Open && (
                           <motion.div
                             initial={{ opacity: 0, y: -4 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0, y: -4 }}
                             transition={{ duration: 0.2 }}
                             className="absolute z-20 w-full mt-1 rounded-lg border overflow-hidden"
                             style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))", boxShadow: "var(--shadow-lg)" }}
                           >
                             <table className="w-full text-base">
                               <thead>
                                 <tr style={{ background: "hsl(var(--table-header-bg))" }}>
                                   <th className="text-left px-4 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Bank Account</th>
                                   <th className="text-left px-4 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Type</th>
                                 </tr>
                               </thead>
                               <tbody>
                                 {bankAccounts.map((acc, i) => {
                                   const isSelected = bankAccount1 === i;
                                   return (
                                     <motion.tr
                                       key={i}
                                       initial={{ opacity: 0 }}
                                       animate={{ opacity: 1, backgroundColor: isSelected ? "hsl(207 71% 82%)" : "transparent" }}
                                       transition={{ delay: i * 0.04 }}
                                       onClick={() => { setBankAccount1(i); setBankAccount1Open(false); }}
                                       className="cursor-pointer transition-all duration-150"
                                       style={{ borderBottom: i < bankAccounts.length - 1 ? "1px solid hsl(var(--border) / 0.5)" : "none" }}
                                       whileHover={{ backgroundColor: "hsl(220 20% 97%)" }}
                                     >
                                       <td className="py-2.5 px-4 font-medium" style={{ color: "hsl(var(--foreground))" }}>{acc.description}</td>
                                       <td className="py-2.5 px-4" style={{ color: "hsl(var(--muted-foreground))" }}>{acc.type}</td>
                                     </motion.tr>
                                   );
                                 })}
                               </tbody>
                             </table>
                           </motion.div>
                         )}
                       </AnimatePresence>
                     </div>
                   </motion.div>

                   {/* Account 2 - General Ledger Account */}
                   <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                     <div className="flex items-center justify-between mb-3">
                       <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold" style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}>2</div>
                         <span className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>General Ledger Account</span>
                       </div>
                       <div className="flex items-center">
                         <img src={quickbooksLogo} alt="QuickBooks" className="h-[28px] w-auto" />
                       </div>
                     </div>

                     {/* GL Account Dropdown */}
                     <div className="relative">
                       <motion.button
                         onClick={() => { if (step === "bank-setup") setBankGlAccountOpen(!bankGlAccountOpen); }}
                         className="w-full flex items-center justify-between px-4 py-3 rounded-lg border text-base transition-all duration-200"
                         style={{
                           borderColor: bankGlAccountOpen ? "hsl(var(--primary))" : "hsl(var(--border))",
                           background: "hsl(var(--card))",
                           color: "hsl(var(--foreground))",
                           boxShadow: bankGlAccountOpen ? "0 0 0 3px hsl(var(--primary) / 0.08)" : "none",
                           cursor: step === "bank-setup" ? "pointer" : "default",
                         }}
                       >
                         <span className={bankGlAccount !== null ? "font-medium" : ""} style={{ color: bankGlAccount !== null ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>
                           {bankGlAccount !== null ? `${bankGlAccounts[bankGlAccount].accountNo} — ${bankGlAccounts[bankGlAccount].description}` : "Select a GL account"}
                         </span>
                         <ChevronDown size={16} style={{ color: "hsl(var(--muted-foreground))", transform: bankGlAccountOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                       </motion.button>

                       <AnimatePresence>
                         {bankGlAccountOpen && (
                           <motion.div
                             initial={{ opacity: 0, y: -4 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0, y: -4 }}
                             transition={{ duration: 0.2 }}
                             className="absolute z-20 w-full mt-1 rounded-lg border overflow-hidden"
                              style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))", boxShadow: "var(--shadow-lg)", maxHeight: "260px" }}
                            >
                              <div style={{ overflowY: "auto", maxHeight: "260px", scrollbarWidth: "none", msOverflowStyle: "none" }}>
                              <table className="w-full text-base">
                                <thead className="sticky top-0 z-10">
                                  <tr style={{ background: "hsl(var(--table-header-bg))" }}>
                                    <th className="text-left px-4 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Acc No.</th>
                                    <th className="text-left px-4 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Description</th>
                                    <th className="text-right px-4 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>2024</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bankGlAccounts.map((acc, i) => {
                                    const isSelected = bankGlAccount === i;
                                    return (
                                      <motion.tr
                                        key={i}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1, backgroundColor: isSelected ? "hsl(207 71% 82%)" : "transparent" }}
                                        transition={{ delay: i * 0.04 }}
                                        onClick={() => { setBankGlAccount(i); setBankGlAccountOpen(false); }}
                                        className="cursor-pointer transition-all duration-150"
                                        style={{ borderBottom: i < bankGlAccounts.length - 1 ? "1px solid hsl(var(--border) / 0.5)" : "none" }}
                                        whileHover={{ backgroundColor: "hsl(220 20% 97%)" }}
                                      >
                                        <td className="py-2.5 px-4 font-mono font-medium" style={{ color: "hsl(var(--foreground))" }}>{acc.accountNo}</td>
                                        <td className="py-2.5 px-4 font-medium" style={{ color: "hsl(var(--foreground))" }}>{acc.description}</td>
                                        <td className="py-2.5 px-4 text-right font-mono font-medium" style={{ color: "hsl(var(--foreground))" }}>{acc.amount}</td>
                                      </motion.tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                              </div>
                            </motion.div>
                         )}
                       </AnimatePresence>
                     </div>
                   </motion.div>

                  {/* Reconcile Button */}
                  {(() => {
                    const bankReady = bankAccount1 !== null && bankGlAccount !== null && step === "bank-setup";
                    const bankDisabled = step === "bank-processing" || step === "bank-results";
                    return (
                      <div className="flex justify-end pt-4">
                        <motion.button
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.45 }}
                          whileHover={(bankReady && !bankDisabled) ? { scale: 1.03, boxShadow: "0 4px 20px hsl(var(--primary) / 0.25)" } : {}}
                          whileTap={(bankReady && !bankDisabled) ? { scale: 0.97 } : {}}
                          disabled={!bankReady || bankDisabled}
                          onClick={() => { if (bankReady) setStep("bank-processing"); }}
                          className="relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-base font-semibold transition-all duration-300 overflow-hidden"
                          style={{
                            background: (bankReady && !bankDisabled) ? "linear-gradient(135deg, hsl(var(--primary)), hsl(270 60% 55%))" : "hsl(var(--muted))",
                            color: (bankReady && !bankDisabled) ? "hsl(0 0% 100%)" : "hsl(var(--muted-foreground))",
                            cursor: (bankReady && !bankDisabled) ? "pointer" : "not-allowed",
                            opacity: (bankReady && !bankDisabled) ? 1 : 0.6,
                          }}
                        >
                          {(bankReady && !bankDisabled) && (
                            <motion.div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, hsl(0 0% 100% / 0.15) 50%, transparent 100%)", backgroundSize: "200% 100%" }} animate={{ backgroundPosition: ["-200% 0", "200% 0"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} />
                          )}
                          <Sparkles size={15} className="relative z-10" />
                          <span className="relative z-10">Reconcile</span>
                          <ArrowRight size={15} className="relative z-10" />
                        </motion.button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <BreathingLuka visible={step === "bank-processing"} />

        {/* ═══ BANK RESULTS ═══ */}
        <AnimatePresence>
          {step === "bank-results" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-start gap-3">
              <LukaAvatar />
              <div className="flex-1 pt-0.5 space-y-5">
                {(() => {
                  const ba1 = bankAccount1 !== null ? bankAccounts[bankAccount1] : null;
                   const ba2 = bankGlAccount !== null ? bankGlAccounts[bankGlAccount] : null;
                  return (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-base leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
                      Found 5 unmatched line items between{" "}
                      <strong>Account 1 ({ba1?.accountNo} — {ba1?.description})</strong>{" "}and{" "}
                      <strong>Account 2 ({ba2?.accountNo} — {ba2?.description})</strong>.
                      {" "}Post the suggested entries to reconcile both accounts into agreement and save or export.
                    </motion.p>
                  );
                })()}

                {/* Table 1: Account Summary */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  {(() => {
                     const ba1 = bankAccount1 !== null ? bankAccounts[bankAccount1] : null;
                     const ba2 = bankGlAccount !== null ? bankGlAccounts[bankGlAccount] : null;
                     const ba1Bal = ba1 ? parseFloat(ba1.debit.replace(/[^0-9.-]/g, "")) : 0;
                     const ba2Bal = ba1Bal * 0.95; // simulated GL balance
                    const bankPostedTotal = bankUnmatchedData.reduce((sum, item, idx) => bankPostedItems.has(idx) ? sum + item.diff : sum, 0);
                    const bankRemaining = bankUnmatchedData.reduce((sum, item, idx) => bankPostedItems.has(idx) ? sum : sum + item.diff, 0);
                    const adjustedBa2 = ba2Bal + bankPostedTotal;
                    return (
                      <div className="rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
                        <table className="w-full text-base">
                          <thead>
                            <tr style={{ background: "hsl(var(--table-header-bg))" }}>
                              <th className="text-left px-4 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Acc No.</th>
                              <th className="text-left px-4 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Description</th>
                              <th className="text-right px-4 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Difference</th>
                            </tr>
                          </thead>
                          <tbody>
                            <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }} whileHover={{ backgroundColor: "hsl(220 20% 97%)", x: 2, transition: { duration: 0 } }} className="cursor-default">
                              <td className="px-4 py-2.5 text-base font-medium" style={{ color: "hsl(0 0% 0%)" }}>{ba1?.accountNo}</td>
                              <td className="px-4 py-2.5 text-base font-medium" style={{ color: "hsl(var(--foreground))" }}>{ba1?.description}</td>
                              <td className="px-4 py-2.5 text-base text-right font-mono font-medium" style={{ color: "hsl(var(--foreground))" }}>{ba1?.debit}</td>
                            </motion.tr>
                            <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.48 }} style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }} whileHover={{ backgroundColor: "hsl(220 20% 97%)", x: 2, transition: { duration: 0 } }} className="cursor-default">
                              <td className="px-4 py-2.5 text-base font-medium" style={{ color: "hsl(0 0% 0%)" }}>{ba2?.accountNo}</td>
                              <td className="px-4 py-2.5 text-base font-medium" style={{ color: "hsl(var(--foreground))" }}>{ba2?.description}</td>
                              <td className="px-4 py-2.5 text-base text-right font-mono font-medium" style={{ color: "hsl(var(--foreground))" }}>{bankRemaining === 0 ? ba1?.debit : `(${fmt(Math.abs(adjustedBa2))})`}</td>
                            </motion.tr>
                            <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.56 }} style={{ borderTop: "1px solid hsl(var(--border))" }} className="cursor-default">
                              <td colSpan={2} className="px-4 py-2.5 text-base font-bold" style={{ color: "hsl(var(--foreground))" }}>Net Difference</td>
                              <td className="px-4 py-2.5 text-base text-right font-mono font-bold" style={{ color: bankRemaining !== 0 ? "hsl(0 80% 50%)" : "hsl(145 63% 42%)" }}>{fmt(Math.abs(bankRemaining))}</td>
                            </motion.tr>
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </motion.div>

                {/* Table 2: Reconciliation Transactions Summary */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                  {(() => {
                     const ba1 = bankAccount1 !== null ? bankAccounts[bankAccount1] : null;
                     const ba2 = bankGlAccount !== null ? bankGlAccounts[bankGlAccount] : null;
                     const ba1Bal = ba1 ? parseFloat(ba1.debit.replace(/[^0-9.-]/g, "")) : 0;
                     const ba2Bal = ba1Bal * 0.95;
                    const bankPostedTotal = bankUnmatchedData.reduce((sum, item, idx) => bankPostedItems.has(idx) ? sum + item.diff : sum, 0);
                    const bankRemaining = bankUnmatchedData.reduce((sum, item, idx) => bankPostedItems.has(idx) ? sum : sum + item.diff, 0);
                    const closingBa2 = ba2Bal + bankPostedTotal;
                    const rows = [
                      { entity: "Opening Balance (Jan 1, 2024)", acc1: fmt(ba1Bal * 0.8), acc2: fmt(ba2Bal * 0.8), diff: "0.00", bold: false, expandable: false },
                      { entity: "Matched Transactions (52 items)", acc1: fmt(ba1Bal * 1.4), acc2: fmt(ba2Bal * 1.4), diff: "0.00", bold: false, expandable: true },
                      { entity: "Matched Settlements / Payments", acc1: `(${fmt(ba1Bal * 1.2)})`, acc2: `(${fmt(ba2Bal * 1.2)})`, diff: "0.00", bold: false, expandable: false },
                      { entity: "Unmatched Transactions", acc1: fmt(Math.abs(bankRemaining)), acc2: bankPostedTotal !== 0 ? fmt(Math.abs(bankPostedTotal)) : "0.00", diff: fmt(Math.abs(bankRemaining)), bold: true, expandable: false },
                    ];
                    return (
                      <div className="rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
                        <table className="w-full text-base">
                          <thead>
                            <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                              <td colSpan={4} className="px-4 py-3 text-base font-bold" style={{ color: "hsl(var(--foreground))" }}>Reconciliation Transactions Summary</td>
                            </tr>
                            <tr style={{ background: "hsl(var(--table-header-bg))", borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
                              <th className="text-left px-4 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Entity</th>
                              <th className="text-right px-4 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Account 1 [{ba1?.accountNo}]</th>
                              <th className="text-right px-4 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Account 2 [{ba2?.accountNo}]</th>
                              <th className="text-right px-4 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Difference</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row, i) => {
                              const isMatched = row.expandable;
                              const isExpanded = isMatched ? bankMatchedExpanded : false;
                              const toggleExpand = isMatched ? () => setBankMatchedExpanded(!bankMatchedExpanded) : undefined;
                              const diffColor = row.bold ? (bankRemaining !== 0 ? "hsl(0 80% 50%)" : "hsl(145 63% 42%)") : "hsl(var(--foreground))";
                              return (
                                <React.Fragment key={i}>
                                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1, x: 0, backgroundColor: "hsl(0 0% 100% / 0)", transition: { duration: 0 } }} transition={{ delay: 0.7 + i * 0.08 }} style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }} whileHover={{ backgroundColor: "hsl(220 20% 97%)", x: 2, transition: { duration: 0 } }} className={isMatched ? "cursor-pointer" : "cursor-default"} onClick={toggleExpand}>
                                    <td className={`px-4 py-2.5 text-base ${row.bold ? "font-bold" : "font-medium"}`} style={{ color: isMatched ? "#2662D9" : "hsl(var(--foreground))" }}>
                                      {isMatched && (<motion.span animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.15 }} className="inline-block mr-1.5" style={{ color: "#2662D9" }}>▸</motion.span>)}
                                      {row.entity}
                                    </td>
                                    <td className={`px-4 py-2.5 text-base text-right font-mono ${row.bold ? "font-bold" : "font-medium"}`} style={{ color: "hsl(var(--foreground))" }}>{row.acc1}</td>
                                    <td className={`px-4 py-2.5 text-base text-right font-mono ${row.bold ? "font-bold" : "font-medium"}`} style={{ color: "hsl(var(--foreground))" }}>{row.acc2}</td>
                                    <td className={`px-4 py-2.5 text-base text-right font-mono ${row.bold ? "font-bold" : "font-medium"}`} style={{ color: diffColor }}>{row.diff}</td>
                                  </motion.tr>
                                  {isMatched && bankMatchedExpanded && (
                                    <AnimatePresence>
                                      {Array.from({ length: 52 }, (_, j) => {
                                        const amt = (Math.round((Math.random() * 12000 + 300) * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 });
                                        return (
                                          <motion.tr key={`bank-matched-${j}`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto", x: 0, backgroundColor: "hsl(0 0% 100% / 0)", transition: { duration: 0 } }} exit={{ opacity: 0, height: 0 }} style={{ borderBottom: "1px solid hsl(var(--border) / 0.3)" }} whileHover={{ backgroundColor: "hsl(220 20% 97%)", x: 2, transition: { duration: 0 } }} className="cursor-default">
                                            <td className="px-4 pl-8 py-2 text-sm font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Transaction #{j + 1}</td>
                                            <td className="px-4 py-2 text-sm text-right font-mono font-medium" style={{ color: "hsl(var(--foreground))" }}>{amt}</td>
                                            <td className="px-4 py-2 text-sm text-right font-mono font-medium" style={{ color: "hsl(var(--foreground))" }}>{amt}</td>
                                            <td className="px-4 py-2 text-sm text-right font-mono font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>0.00</td>
                                          </motion.tr>
                                        );
                                      })}
                                    </AnimatePresence>
                                  )}
                                </React.Fragment>
                              );
                            })}
                            {/* Closing Balance */}
                            <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} style={{ borderTop: "2px solid hsl(var(--border))" }} className="cursor-default">
                              {(() => {
                                return (
                                  <>
                                    <td className="px-4 py-3 text-base font-bold" style={{ color: "hsl(var(--foreground))" }}>Closing Balance (Dec 31, 2024)</td>
                                    <td className="px-4 py-3 text-base text-right font-mono font-bold" style={{ color: "hsl(var(--foreground))" }}>{ba1?.debit}</td>
                                    <td className="px-4 py-3 text-base text-right font-mono font-bold" style={{ color: "hsl(var(--foreground))" }}>{bankRemaining === 0 ? ba1?.debit : `(${fmt(Math.abs(closingBa2))})`}</td>
                                    <td className="px-4 py-3 text-base text-right font-mono font-bold" style={{ color: bankRemaining !== 0 ? "hsl(0 80% 50%)" : "hsl(145 63% 42%)" }}>{fmt(Math.abs(bankRemaining))}</td>
                                  </>
                                );
                              })()}
                            </motion.tr>
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </motion.div>

                {/* Table 3: Unmatched Transaction Details */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
                  <div className="rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
                    <table className="w-full text-base">
                      <thead>
                        <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                          <td colSpan={9} className="px-4 py-3 text-base font-bold" style={{ color: "hsl(var(--foreground))" }}>Unmatched Transaction Details (5)</td>
                        </tr>
                        <tr style={{ background: "hsl(var(--table-header-bg))", borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
                          <th className="text-left px-4 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Date</th>
                          <th className="text-left px-4 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Description</th>
                          <th className="text-right px-3 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Acc 1 Debit</th>
                          <th className="text-right px-3 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Acc 1 Credit</th>
                          <th className="text-right px-3 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Acc 2 Debit</th>
                          <th className="text-right px-3 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Acc 2 Credit</th>
                          <th className="text-right px-3 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Difference</th>
                          <th className="text-left px-3 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Note</th>
                          <th className="text-center px-3 py-2.5 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bankUnmatchedData.map((item, j) => {
                          const isPosted = bankPostedItems.has(j);
                          const isPosting = bankPostingItems.has(j);
                          const ea = bankEditAmounts[j] || { d1: item.debit1.toString(), c1: item.credit1.toString(), d2: item.debit2.toString(), c2: item.credit2.toString() };
                          const editDiff = calcDiff(ea);
                          const handleBankPostSingle = (e: React.MouseEvent) => {
                            e.stopPropagation();
                            if (isPosted || isPosting) return;
                            setBankPostingItems(prev => new Set(prev).add(j));
                            setTimeout(() => {
                              setBankPostingItems(prev => { const n = new Set(prev); n.delete(j); return n; });
                              setBankPostedItems(prev => new Set(prev).add(j));
                            }, 800);
                          };
                          const handleBankUnpost = (e: React.MouseEvent) => {
                            e.stopPropagation();
                            setBankPostedItems(prev => { const n = new Set(prev); n.delete(j); return n; });
                          };
                          const updateBankField = (field: 'd1'|'c1'|'d2'|'c2', val: string) => {
                            setBankEditAmounts(prev => ({ ...prev, [j]: { ...prev[j], [field]: val } }));
                          };
                          return (
                            <motion.tr key={`bank-unmatched-${j}`} initial={{ opacity: 0 }} animate={{ opacity: 1, x: 0, backgroundColor: isPosted ? "hsl(145 60% 96%)" : "hsl(0 0% 100% / 0)", transition: { duration: 0 } }} style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }} whileHover={{ backgroundColor: isPosted ? "hsl(145 55% 93%)" : "hsl(220 20% 97%)", x: 2, transition: { duration: 0 } }} className="cursor-default">
                              <td className="px-4 py-2.5 text-base font-medium" style={{ color: isPosted ? "hsl(145 63% 32%)" : "hsl(var(--foreground))" }}>{item.date}</td>
                              <td className="px-4 py-2.5 text-base font-medium" style={{ color: isPosted ? "hsl(145 63% 32%)" : "hsl(var(--foreground))" }}>
                                {isPosted && <CheckCircle2 size={13} className="inline mr-1.5" style={{ color: "hsl(145 63% 42%)" }} />}
                                {item.desc}
                              </td>
                              {(['d1','c1','d2','c2'] as const).map(field => (
                                <td key={field} className="px-3 py-2 text-right">
                                  {isPosted ? (
                                    <span className="text-base font-mono font-medium" style={{ color: "hsl(145 63% 32%)" }}>{fmt(parseFloat(ea[field]) || 0)}</span>
                                  ) : (
                                    <input type="text" value={ea[field]} onChange={(e) => updateBankField(field, e.target.value)} onClick={(e) => e.stopPropagation()} className="w-20 text-right text-sm font-mono px-2 py-1.5 rounded-md border outline-none transition-all duration-150" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))", color: "hsl(var(--foreground))" }} onFocus={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; e.currentTarget.style.boxShadow = "0 0 0 2px hsl(var(--primary) / 0.1)"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.boxShadow = "none"; }} />
                                  )}
                                </td>
                              ))}
                              <td className="px-3 py-2.5 text-base text-right font-mono font-bold" style={{ color: isPosted ? "hsl(145 63% 42%)" : "hsl(0 80% 50%)" }}>
                                {isPosted ? "Posted" : fmt(Math.abs(editDiff))}
                              </td>
                              <td className="px-4 py-2.5">
                                {!isPosted && (
                                  <input type="text" placeholder="Add note..." value={bankItemNotes[j] || ""} onChange={(e) => setBankItemNotes(prev => ({ ...prev, [j]: e.target.value }))} className="w-full text-sm px-2.5 py-1.5 rounded-md border outline-none transition-all duration-150" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))", color: "hsl(var(--foreground))" }} onFocus={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; e.currentTarget.style.boxShadow = "0 0 0 2px hsl(var(--primary) / 0.1)"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.boxShadow = "none"; }} onClick={(e) => e.stopPropagation()} />
                                )}
                                {isPosted && (
                                  <span className="text-sm font-medium" style={{ color: bankItemNotes[j] ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>{bankItemNotes[j] || "—"}</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <div className="inline-flex items-center gap-2">
                                  {isPosting ? (
                                    <motion.div className="inline-flex items-center gap-1.5 p-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}><Loader2 size={14} /></motion.div>
                                    </motion.div>
                                  ) : isPosted ? (
                                    <motion.button initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleBankUnpost} className="p-1.5 rounded-md transition-colors duration-0" style={{ color: "hsl(0 70% 50%)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "hsl(0 70% 35%)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "hsl(0 70% 50%)"; }} title="Unpost Entry"><Undo2 size={14} /></motion.button>
                                  ) : (
                                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleBankPostSingle} className="p-1.5 rounded-md transition-colors duration-0" style={{ color: "#00A273" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#006B4F"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#00A273"; }} title="Post Entry"><FileUp size={14} /></motion.button>
                                  )}
                                  <motion.button whileHover={!isPosted ? { scale: 1.1 } : {}} whileTap={!isPosted ? { scale: 0.9 } : {}} onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-md transition-colors duration-0" style={{ color: isPosted ? "hsl(var(--muted-foreground) / 0.3)" : "hsl(0 70% 50%)", cursor: isPosted ? "not-allowed" : "pointer" }} onMouseEnter={(e) => { if (!isPosted) e.currentTarget.style.color = "hsl(0 70% 35%)"; }} onMouseLeave={(e) => { if (!isPosted) e.currentTarget.style.color = "hsl(0 70% 50%)"; }} disabled={isPosted} title={isPosted ? "Unpost entry before deleting" : "Delete entry"}><Trash2 size={14} /></motion.button>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {/* Post All Entries */}
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex justify-end items-center gap-3 px-4 py-3" style={{ borderTop: "1px solid hsl(var(--border) / 0.4)" }}>
                      {bankPostedItems.size < 5 && !bankPostingAll && (
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={(e) => {
                          e.stopPropagation();
                          setBankAccount1(null);
                          setBankGlAccount(null);
                          setBankPostedItems(new Set());
                          setBankPostingItems(new Set());
                          setBankItemNotes({});
                          setBankMatchedExpanded(false);
                          setBankProcessingLines(0);
                          setStep("bank-setup");
                        }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all" style={{ border: "1.5px solid hsl(var(--border))", color: "hsl(var(--foreground))", background: "hsl(var(--background))" }}>
                          <Undo2 size={15} />Reselect
                        </motion.button>
                      )}
                      {bankPostedItems.size > 0 && bankPostedItems.size < 5 && (
                        <span className="text-xs font-medium" style={{ color: "hsl(145 63% 42%)" }}>{bankPostedItems.size} of 5 posted</span>
                      )}
                      {bankPostedItems.size === 5 ? (
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold" style={{ color: "hsl(145 63% 42%)" }}>
                          <CheckCircle2 size={16} />All Entries Posted
                        </motion.div>
                      ) : bankPostingAll ? (
                        <motion.div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold" style={{ color: "hsl(var(--muted-foreground))" }}>
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}><Loader2 size={15} /></motion.div>
                          Posting entries…
                          <motion.div className="ml-1 h-1 rounded-full overflow-hidden" style={{ width: 60, background: "hsl(var(--border))" }}>
                            <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2, ease: "easeInOut" }} className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #00A273, #00B880)" }} />
                          </motion.div>
                        </motion.div>
                      ) : (
                        <motion.button whileHover={{ scale: 1.03, boxShadow: "0 6px 20px rgba(0, 162, 115, 0.4)" }} whileTap={{ scale: 0.97 }} onClick={(e) => {
                          e.stopPropagation();
                          setBankPostingAll(true);
                          const unposted = [0,1,2,3,4].filter(i => !bankPostedItems.has(i));
                          unposted.forEach((idx, i) => {
                            setTimeout(() => setBankPostingItems(prev => new Set(prev).add(idx)), i * 350);
                            setTimeout(() => {
                              setBankPostingItems(prev => { const n = new Set(prev); n.delete(idx); return n; });
                              setBankPostedItems(prev => new Set(prev).add(idx));
                              if (i === unposted.length - 1) setBankPostingAll(false);
                            }, i * 350 + 700);
                          });
                        }} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all" style={{ background: "linear-gradient(135deg, #00A273, #00B880)", color: "#fff", boxShadow: "0 3px 12px rgba(0, 162, 115, 0.25)", letterSpacing: "0.02em" }}>
                          <CheckCircle2 size={15} />Post All Entries
                          <span className="ml-1 px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(255,255,255,0.2)" }}>{5 - bankPostedItems.size}</span>
                        </motion.button>
                      )}
                    </motion.div>
                  </div>
                </motion.div>

                {/* Bank Success Message & Action Icons */}
                <AnimatePresence>
                  {step === "bank-results" && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex items-start gap-3 mt-6 mb-2">
                      <img src={lukaLogo} alt="Luka" className="w-7 h-7 rounded-full mt-0.5" />
                      <p className="text-[15px] leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
                        <strong>Successfully reconciled the bank statements with the general ledger account for ABC Pvt. Ltd.</strong>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bank Reconciliation Statement Table */}
                <AnimatePresence>
                {step === "bank-results" && bankStmtRows.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                      <EditableStatementTable
                        title="ABC Pvt. Ltd."
                        subtitle="Bank Reconciliation Statement — January 31, 2024"
                        rows={bankStmtRows}
                        onRowsChange={setBankStmtRows}
                      />

                      {/* ── Adjusting Entries Section ── */}
                      {!bankAdjPosted && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="mt-6 rounded-lg border overflow-hidden"
                          style={{ borderColor: "hsl(var(--border))" }}
                        >
                          <div className="px-5 py-3.5" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                            <p className="font-bold" style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>Post Entries to Reconcile the accounts</p>
                          </div>
                          <table className="w-full">
                            <thead>
                              <tr style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
                                <th className="text-left px-5 py-2.5 font-semibold" style={{ color: "hsl(var(--foreground))", width: 120, fontSize: 15 }}>Acc No</th>
                                <th className="text-left px-5 py-2.5 font-semibold" style={{ color: "hsl(var(--foreground))", fontSize: 15 }}>Description</th>
                                <th className="text-left px-5 py-2.5 font-semibold" style={{ color: "hsl(var(--foreground))", width: 130, fontSize: 15 }}>Date</th>
                                <th className="text-right px-5 py-2.5 font-semibold" style={{ color: "hsl(var(--foreground))", width: 140, fontSize: 15 }}>Debit</th>
                                <th className="text-right px-5 py-2.5 font-semibold" style={{ color: "hsl(var(--foreground))", width: 140, fontSize: 15 }}>Credit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bankAdjEntries.map((entry, ei) => (
                                <tr key={ei} style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
                                  <td className="px-5 py-2.5">
                                    <select
                                      value={entry.accNo}
                                      onChange={(e) => {
                                        const updated = [...bankAdjEntries];
                                        updated[ei] = { ...updated[ei], accNo: e.target.value };
                                        setBankAdjEntries(updated);
                                      }}
                                      className="rounded-md border px-2.5 py-1.5 font-mono"
                                      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))", color: "hsl(var(--foreground))", width: 90, fontSize: 16 }}
                                    >
                                      <option value="6230">6230</option>
                                      <option value="6240">6240</option>
                                      <option value="6250">6250</option>
                                      <option value="6260">6260</option>
                                    </select>
                                  </td>
                                  <td className="px-5 py-2.5">
                                    <input
                                      type="text"
                                      value={entry.desc}
                                      onChange={(e) => {
                                        const updated = [...bankAdjEntries];
                                        updated[ei] = { ...updated[ei], desc: e.target.value };
                                        setBankAdjEntries(updated);
                                      }}
                                      className="rounded-md border px-2.5 py-1.5 w-full"
                                      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.3)", color: "hsl(var(--foreground))", fontSize: 16 }}
                                    />
                                  </td>
                                  <td className="px-5 py-2.5">
                                    <input
                                      type="text"
                                      value={entry.date}
                                      onChange={(e) => {
                                        const updated = [...bankAdjEntries];
                                        updated[ei] = { ...updated[ei], date: e.target.value };
                                        setBankAdjEntries(updated);
                                      }}
                                      className="rounded-md border px-2.5 py-1.5 w-[110px]"
                                      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.3)", color: "hsl(var(--foreground))", fontSize: 16 }}
                                      placeholder="dd/mm/yyyy"
                                    />
                                  </td>
                                  <td className="px-5 py-2.5 text-right">
                                    <input
                                      type="text"
                                      value={entry.debit}
                                      onChange={(e) => {
                                        const updated = [...bankAdjEntries];
                                        updated[ei] = { ...updated[ei], debit: e.target.value };
                                        setBankAdjEntries(updated);
                                      }}
                                      className="rounded-md border px-2.5 py-1.5 font-mono text-right w-[110px]"
                                      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.3)", color: "hsl(var(--foreground))", fontSize: 16 }}
                                      placeholder="0.00"
                                    />
                                  </td>
                                  <td className="px-5 py-2.5 text-right">
                                    <input
                                      type="text"
                                      value={entry.credit}
                                      onChange={(e) => {
                                        const updated = [...bankAdjEntries];
                                        updated[ei] = { ...updated[ei], credit: e.target.value };
                                        setBankAdjEntries(updated);
                                      }}
                                      className="rounded-md border px-2.5 py-1.5 font-mono text-right w-[110px]"
                                      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.3)", color: "hsl(var(--foreground))", fontSize: 16 }}
                                      placeholder="0.00"
                                    />
                                  </td>
                                </tr>
                              ))}
                              {/* Totals row */}
                              {(() => {
                                const parseNum = (v: string) => parseFloat(v.replace(/,/g, "")) || 0;
                                const totalDebit = bankAdjEntries.reduce((s, e) => s + parseNum(e.debit), 0);
                                const totalCredit = bankAdjEntries.reduce((s, e) => s + parseNum(e.credit), 0);
                                const diff = totalDebit - totalCredit;
                                return (
                                  <>
                                    <tr style={{ borderTop: "2px solid hsl(var(--foreground))", borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
                                      <td className="px-5 py-2.5" style={{ fontSize: 16 }} />
                                      <td className="px-5 py-2.5 font-bold" style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>Total</td>
                                      <td className="px-5 py-2.5" />
                                      <td className="px-5 py-2.5 text-right font-bold font-mono" style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>{totalDebit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                      <td className="px-5 py-2.5 text-right font-bold font-mono" style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>{totalCredit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                    {diff !== 0 && (
                                      <tr style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
                                        <td className="px-5 py-2.5" />
                                        <td className="px-5 py-2.5 font-semibold" style={{ color: "hsl(0, 72%, 51%)", fontSize: 16 }}>Difference</td>
                                        <td className="px-5 py-2.5" />
                                        <td className="px-5 py-2.5 text-right font-mono" style={{ color: "hsl(0, 72%, 51%)", fontSize: 16 }} colSpan={2}>{Math.abs(diff).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                      </tr>
                                    )}
                                  </>
                                );
                              })()}
                            </tbody>
                          </table>
                          {/* Notes */}
                          <div className="px-5 py-3" style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>Notes</span>
                              <ChevronDown size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
                            </div>
                            <textarea
                              value={bankAdjNotes}
                              onChange={(e) => setBankAdjNotes(e.target.value)}
                              rows={3}
                              className="w-full border px-3 py-2 text-sm resize-none"
                              style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))", color: "hsl(var(--foreground))", borderRadius: 12 }}
                            />
                          </div>
                          {/* Post Entry button */}
                          <div className="flex justify-end px-5 py-3" style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setBankAdjPosting(true);
                                setTimeout(() => {
                                  setBankAdjPosting(false);
                                  setBankAdjPosted(true);
                                }, 1200);
                              }}
                              disabled={bankAdjPosting}
                              className="px-5 py-2 text-sm font-medium transition-all"
                              style={{
                                borderRadius: 12,
                                background: bankAdjPosting ? "hsl(var(--muted))" : "hsl(var(--primary))",
                                color: bankAdjPosting ? "hsl(var(--muted-foreground))" : "hsl(var(--primary-foreground))",
                              }}
                            >
                              {bankAdjPosting ? "Posting..." : "Post Entry"}
                            </motion.button>
                          </div>
                        </motion.div>
                      )}

                      {/* Success message after posting */}
                      {bankAdjPosted && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 flex items-center gap-2"
                        >
                          <CheckCircle2 size={16} style={{ color: "hsl(145 63% 42%)" }} />
                          <span className="text-sm font-bold" style={{ color: "hsl(145 63% 42%)" }}>
                            Adjusting entries posted. Accounts are now reconciled — Adjusted Bank Balance and Adjusted as per Trial Balance are now equal.
                          </span>
                        </motion.div>
                      )}

                      {/* ── Luka Summary Box: Unmatched vs Potential Matches ── */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.45, ease: "easeOut" }}
                        className="mt-6 relative overflow-hidden"
                        style={{
                          borderRadius: 16,
                          border: "1.5px solid hsl(270 60% 55% / 0.25)",
                          background:
                            "linear-gradient(135deg, hsl(270 60% 55% / 0.06) 0%, hsl(207 71% 38% / 0.05) 50%, hsl(var(--background)) 100%)",
                          boxShadow: "0 4px 24px hsl(270 60% 55% / 0.08)",
                          backdropFilter: "blur(8px)",
                        }}
                      >
                        {/* Decorative gradient orb */}
                        <div
                          aria-hidden
                          style={{
                            position: "absolute",
                            top: -40,
                            right: -40,
                            width: 180,
                            height: 180,
                            borderRadius: "50%",
                            background:
                              "radial-gradient(circle, hsl(270 60% 55% / 0.18) 0%, transparent 70%)",
                            pointerEvents: "none",
                          }}
                        />

                        {/* Header */}
                        <div className="flex items-start gap-3 px-5 pt-5 pb-3 relative">
                          <LukaAvatar />
                          <div className="flex-1 pt-0.5">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span
                                className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                                style={{
                                  background:
                                    "linear-gradient(135deg, hsl(270 60% 55% / 0.15), hsl(207 71% 38% / 0.12))",
                                  color: "hsl(270 60% 45%)",
                                  letterSpacing: "0.08em",
                                }}
                              >
                                Luka Summary
                              </span>
                              <Sparkles size={13} style={{ color: "hsl(270 60% 55%)" }} />
                            </div>
                            <p
                              className="text-[15px] font-semibold leading-snug"
                              style={{ color: "hsl(var(--foreground))" }}
                            >
                              Reconciliation analysis: unmatched vs potential matches
                            </p>
                          </div>
                        </div>

                        {/* Stat Tiles */}
                        <div className="grid grid-cols-3 gap-3 px-5 pb-4 relative">
                          {(() => {
                            const parseNum = (v: string) => parseFloat(v.replace(/,/g, "")) || 0;
                            const totalAdjEntries = bankAdjEntries.length;
                            const totalAdjValue = bankAdjEntries.reduce(
                              (s, e) => s + parseNum(e.debit) + parseNum(e.credit),
                              0,
                            );
                            const tiles = [
                              {
                                label: "Unmatched",
                                value: "3",
                                sub: "items needing review",
                                color: "hsl(0 72% 51%)",
                                bg: "hsl(0 72% 51% / 0.08)",
                                border: "hsl(0 72% 51% / 0.25)",
                              },
                              {
                                label: "Potential Matches",
                                value: "2",
                                sub: "high-confidence pairs",
                                color: "hsl(38 92% 50%)",
                                bg: "hsl(38 92% 50% / 0.08)",
                                border: "hsl(38 92% 50% / 0.25)",
                              },
                              {
                                label: "Unadjusted Entries",
                                value: String(totalAdjEntries),
                                sub: `$${totalAdjValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total`,
                                color: "hsl(207 71% 31%)",
                                bg: "hsl(207 71% 31% / 0.08)",
                                border: "hsl(207 71% 31% / 0.25)",
                              },
                            ];
                            return tiles.map((t, i) => (
                              <motion.div
                                key={t.label}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 + i * 0.07 }}
                                className="rounded-xl px-3.5 py-3"
                                style={{
                                  background: t.bg,
                                  border: `1px solid ${t.border}`,
                                }}
                              >
                                <div
                                  className="text-[10px] font-bold uppercase tracking-wider mb-1"
                                  style={{ color: t.color, letterSpacing: "0.08em" }}
                                >
                                  {t.label}
                                </div>
                                <div
                                  className="font-mono font-bold text-[24px] leading-none"
                                  style={{ color: t.color }}
                                >
                                  {t.value}
                                </div>
                                <div
                                  className="text-[11px] mt-1.5"
                                  style={{ color: "hsl(var(--muted-foreground))" }}
                                >
                                  {t.sub}
                                </div>
                              </motion.div>
                            ));
                          })()}
                        </div>

                        {/* Methodology / How Luka identifies matches */}
                        <div
                          className="mx-5 mb-5 rounded-xl px-4 py-3.5"
                          style={{
                            background: "hsl(var(--background) / 0.7)",
                            border: "1px solid hsl(var(--border) / 0.6)",
                          }}
                        >
                          <div className="flex items-center gap-1.5 mb-2.5">
                            <Search size={13} style={{ color: "hsl(270 60% 55%)" }} />
                            <span
                              className="text-[11px] font-bold uppercase tracking-wider"
                              style={{ color: "hsl(var(--foreground))", letterSpacing: "0.06em" }}
                            >
                              How Luka identified matches
                            </span>
                          </div>
                          <ul className="space-y-1.5">
                            {[
                              {
                                label: "Exact match",
                                text: "amount, date (±2 days), and reference/check # align across both sources",
                              },
                              {
                                label: "Fuzzy match",
                                text: "amount tolerance ≤ $0.50, description similarity ≥ 80% (Note collected, Interest earned)",
                              },
                              {
                                label: "Unmatched",
                                text: "transactions present in only one source — flagged as outstanding deposits, in-transit cheques, or bank-only items (NSF, fees)",
                              },
                            ].map((row, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-[13px] leading-relaxed"
                                style={{ color: "hsl(var(--foreground) / 0.85)" }}
                              >
                                <span
                                  className="mt-1.5 w-1 h-1 rounded-full shrink-0"
                                  style={{ background: "hsl(270 60% 55%)" }}
                                />
                                <span>
                                  <strong style={{ color: "hsl(var(--foreground))" }}>
                                    {row.label}:
                                  </strong>{" "}
                                  {row.text}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Footer recommendation */}
                        <div
                          className="px-5 py-3 flex items-center gap-2"
                          style={{
                            borderTop: "1px solid hsl(270 60% 55% / 0.15)",
                            background:
                              "linear-gradient(90deg, hsl(270 60% 55% / 0.04), hsl(207 71% 38% / 0.03))",
                          }}
                        >
                          <AlertCircle size={14} style={{ color: "hsl(38 92% 45%)" }} />
                          <p
                            className="text-[12.5px]"
                            style={{ color: "hsl(var(--foreground) / 0.85)" }}
                          >
                            <strong>Recommendation:</strong> Post the {bankAdjEntries.length} adjusting{" "}
                            {bankAdjEntries.length === 1 ? "entry" : "entries"} above to clear unadjusted items,
                            then investigate the 3 unmatched transactions before finalising the period.
                          </p>
                        </div>
                      </motion.div>

                      {/* ── GST / Revenue Breakdown Table ── */}
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-6"
                      >
                        <GstBreakdownTable />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Icons */}
                <AnimatePresence>
                  {step === "bank-results" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ delay: 0.5 }} className="flex items-center gap-3 mt-4">
                      {[
                        { icon: <Copy size={20} />, label: "Copy" },
                        { icon: <Download size={20} />, label: "Download", hasDropdown: true },
                        { icon: <FolderOpen size={20} />, label: "Save to Engagement" },
                        { icon: <RefreshCw size={20} />, label: "Rerun" },
                      ].map((action, i) => (
                        <div key={action.label} className="relative" ref={action.hasDropdown ? bankDownloadRef : undefined}>
                          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.08 }} onClick={() => { if (action.hasDropdown) setBankShowDownloadMenu(prev => !prev); }} className="group relative flex items-center justify-center rounded-xl border transition-all duration-150" style={{ width: 48, height: 48, borderColor: "hsl(var(--border))", background: "hsl(var(--background))", color: "hsl(var(--muted-foreground))" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; e.currentTarget.style.color = "hsl(var(--primary))"; e.currentTarget.style.boxShadow = "0 2px 8px hsl(var(--primary) / 0.15)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.color = "hsl(var(--muted-foreground))"; e.currentTarget.style.boxShadow = "none"; }}>
                            {action.icon}
                            <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-150" style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}>{action.label}</span>
                          </motion.button>
                          {action.hasDropdown && bankShowDownloadMenu && (
                            <motion.div initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.95 }} className="absolute left-0 top-full mt-2 rounded-lg border shadow-lg overflow-hidden z-50" style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", minWidth: 160 }}>
                              {[
                                { icon: <FileText size={16} />, label: "PDF", action: handleDownloadPDF },
                                { icon: <FileSpreadsheet size={16} />, label: "Excel", action: handleDownloadExcel },
                              ].map((opt) => (
                                <button key={opt.label} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium transition-all duration-150 text-left" style={{ color: "hsl(var(--foreground))" }} onMouseEnter={(e) => { e.currentTarget.style.background = "hsl(var(--muted))"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }} onClick={() => { opt.action(); setBankShowDownloadMenu(false); }}>
                                  <span style={{ color: "hsl(var(--muted-foreground))" }}>{opt.icon}</span>{opt.label}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </motion.div>
          )}
        </AnimatePresence>



        <BreathingLuka visible={step === "thinking-deep"} />

        {/* Step 4: Setup — IC with entity/engagement/account dropdowns */}
        <AnimatePresence>
          {(step === "setup" || step === "ready" || step === "processing" || step === "results") && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-start gap-3">
                <LukaAvatar />
                <div className="flex-1 pt-0.5">
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-base mb-5" style={{ color: "hsl(var(--foreground))" }}>
                    For intercompany reconciliation, select the accounts to reconcile.
                  </motion.p>

                  {/* ═══ Account 1 (Primary) ═══ */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold" style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}>1</div>
                        <span className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>Account 1 (Primary)</span>
                      </div>
                      <img src={quickbooksLogo} alt="QuickBooks" className="h-[21px] w-auto" />
                    </div>

                    {/* Select Entity — disabled, pre-filled */}
                    <div className="mb-3 max-w-xs">
                      <label className="text-sm font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Select Entity</label>
                      <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-base opacity-60 cursor-not-allowed" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.3)", color: "hsl(var(--foreground))" }}>
                        <div className="flex items-center gap-2">
                          <Building2 size={14} style={{ color: "hsl(var(--primary))" }} />
                          <span>Giggles and Goods Inc.</span>
                        </div>
                        <ChevronDown size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
                      </div>
                    </div>

                    {/* Select Engagement — read-only */}
                    <div className="mb-3 max-w-xs">
                      <label className="text-sm font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Select Engagement</label>
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-base" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.3)", color: "hsl(var(--foreground))" }}>
                        <FileText size={14} style={{ color: "hsl(var(--primary))" }} />
                        <span>COM-SID-Dec312024</span>
                      </div>
                    </div>

                    {/* Select Account — dropdown with grid inside */}
                    <div className="relative">
                      <label className="text-sm font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Select Account</label>
                      <motion.button type="button" onClick={() => setIcAccount1Open(!icAccount1Open)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-base outline-none cursor-pointer transition-all duration-200" style={{ borderColor: icAccount1Open ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))", background: "hsl(var(--card))", color: selectedAccount1 !== null ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))", boxShadow: icAccount1Open ? "0 0 0 3px hsl(var(--primary) / 0.08)" : "none" }} whileHover={{ borderColor: "hsl(var(--primary) / 0.3)" }}>
                        <div className="flex items-center gap-2">
                          {selectedAccount1 !== null && <CheckCircle2 size={13} style={{ color: "hsl(145 63% 42%)" }} />}
                          <span>{selectedAccount1 !== null ? sampleAccounts[selectedAccount1].description : "Select account"}</span>
                        </div>
                        <ChevronDown size={14} style={{ color: "hsl(var(--muted-foreground))", transform: icAccount1Open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
                      </motion.button>
                      <AnimatePresence>
                        {icAccount1Open && (
                          <motion.div initial={{ opacity: 0, y: -4, scaleY: 0.95 }} animate={{ opacity: 1, y: 0, scaleY: 1 }} exit={{ opacity: 0, y: -4, scaleY: 0.95 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} style={{ transformOrigin: "top center", background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", boxShadow: "0 8px 24px hsl(220 20% 10% / 0.08)" }} className="absolute left-0 right-0 top-full mt-1.5 rounded-lg z-50 overflow-hidden">
                            <table className="w-full text-base">
                              <thead>
                                <tr style={{ background: "hsl(var(--table-header-bg))" }}>
                                  <th className="text-left px-3 py-2 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Description</th>
                                  <th className="text-left px-3 py-2 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Date</th>
                                  <th className="text-right px-3 py-2 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Debit</th>
                                  <th className="text-right px-3 py-2 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Credit</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sampleAccounts.map((acc, i) => {
                                  const isSelected = selectedAccount1 === i;
                                  return (
                                    <motion.tr key={acc.accountNo} initial={{ opacity: 0 }} animate={{ opacity: 1, backgroundColor: isSelected ? "hsl(207 71% 82%)" : "hsl(0 0% 100% / 0)" }} transition={{ delay: i * 0.04 }} onClick={() => { setSelectedAccount1(i); setIcAccount1Open(false); }} className="cursor-pointer transition-all duration-150" style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }} whileHover={!isSelected ? { backgroundColor: "hsl(220 20% 97%)" } : {}}>
                                      <td className="px-3 py-2.5 text-base font-medium" style={{ color: "hsl(var(--foreground))" }}>
                                        <div className="flex items-center gap-2">
                                          {isSelected && <CheckCircle2 size={13} style={{ color: "hsl(145 63% 42%)" }} />}
                                          {acc.description}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2.5 font-mono text-base font-medium" style={{ color: "hsl(var(--foreground))" }}>{acc.date}</td>
                                      <td className="px-3 py-2.5 text-base text-right font-mono font-medium" style={{ color: "hsl(var(--foreground))" }}>{acc.debit}</td>
                                      <td className="px-3 py-2.5 text-base text-right font-mono font-medium" style={{ color: "hsl(var(--foreground))" }}>{acc.credit}</td>
                                    </motion.tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>

                  {/* ═══ Account 2 (Counterparty) ═══ */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold" style={{ background: "hsl(270 60% 55% / 0.08)", color: "hsl(270 60% 55%)" }}>2</div>
                        <span className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>Account 2 (Counterparty)</span>
                      </div>
                      {icEntity2 && (
                        <img src={quickbooksLogo} alt="QuickBooks" className="h-[21px] w-auto" />
                      )}
                    </div>

                    {/* Step 1: Select Entity */}
                    <div className="mb-3 max-w-xs relative">
                      <label className="text-sm font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Select Entity</label>
                      <motion.button type="button" onClick={() => setIcEntity2Open(!icEntity2Open)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-base outline-none cursor-pointer transition-all duration-200" style={{ borderColor: icEntity2Open ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))", background: "hsl(var(--card))", color: icEntity2 ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))", boxShadow: icEntity2Open ? "0 0 0 3px hsl(var(--primary) / 0.08)" : "none" }} whileHover={{ borderColor: "hsl(var(--primary) / 0.3)" }}>
                        <div className="flex items-center gap-2">
                          {icEntity2 && <Building2 size={14} style={{ color: "hsl(var(--primary))" }} />}
                          <span>{icEntity2 ? icEntities.find(e => e.id === icEntity2)?.name : "Select counterparty entity"}</span>
                        </div>
                        <ChevronDown size={14} style={{ color: "hsl(var(--muted-foreground))", transform: icEntity2Open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
                      </motion.button>
                      <AnimatePresence>
                        {icEntity2Open && (
                          <motion.div initial={{ opacity: 0, y: -4, scaleY: 0.95 }} animate={{ opacity: 1, y: 0, scaleY: 1 }} exit={{ opacity: 0, y: -4, scaleY: 0.95 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} style={{ transformOrigin: "top center", background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", boxShadow: "0 8px 24px hsl(220 20% 10% / 0.08)" }} className="absolute left-0 right-0 top-full mt-1.5 rounded-lg z-50 overflow-hidden">
                            {icEntities.filter(e => e.id !== "giggles").map((ent, idx) => {
                              const isActive = icEntity2 === ent.id;
                              return (
                                <motion.button key={ent.id} type="button" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }} onClick={() => { setIcEntity2(ent.id); setIcEntity2Open(false); setIcEngagement2(null); setSelectedAccount2(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-base transition-all duration-150 cursor-pointer" style={{ background: isActive ? "hsl(var(--primary) / 0.06)" : "transparent", borderBottom: idx < icEntities.filter(e => e.id !== "giggles").length - 1 ? "1px solid hsl(var(--border) / 0.5)" : "none", color: "hsl(var(--foreground))" }} whileHover={{ background: "hsl(var(--primary) / 0.04)" }}>
                                  <Building2 size={14} style={{ color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }} />
                                  <span>{ent.name}</span>
                                  {isActive && <CheckCircle2 size={13} className="ml-auto" style={{ color: "hsl(var(--primary))" }} />}
                                </motion.button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Step 2: Select Engagement — enabled after entity */}
                    {icEntity2 && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-3 max-w-xs relative">
                        <label className="text-sm font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Select Engagement</label>
                        <motion.button type="button" onClick={() => setIcEngagement2Open(!icEngagement2Open)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-base outline-none cursor-pointer transition-all duration-200" style={{ borderColor: icEngagement2Open ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))", background: "hsl(var(--card))", color: icEngagement2 ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))", boxShadow: icEngagement2Open ? "0 0 0 3px hsl(var(--primary) / 0.08)" : "none" }} whileHover={{ borderColor: "hsl(var(--primary) / 0.3)" }}>
                          <div className="flex items-center gap-2">
                            {icEngagement2 && <FileText size={14} style={{ color: "hsl(var(--primary))" }} />}
                            <span>{icEngagement2 || "Select engagement"}</span>
                          </div>
                          <ChevronDown size={14} style={{ color: "hsl(var(--muted-foreground))", transform: icEngagement2Open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
                        </motion.button>
                        <AnimatePresence>
                          {icEngagement2Open && (
                            <motion.div initial={{ opacity: 0, y: -4, scaleY: 0.95 }} animate={{ opacity: 1, y: 0, scaleY: 1 }} exit={{ opacity: 0, y: -4, scaleY: 0.95 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} style={{ transformOrigin: "top center", background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", boxShadow: "0 8px 24px hsl(220 20% 10% / 0.08)" }} className="absolute left-0 right-0 top-full mt-1.5 rounded-lg z-50 overflow-hidden">
                              {(icEngagementsByEntity[icEntity2!] || []).map((eng, idx, arr) => {
                                const isActive = icEngagement2 === eng.id;
                                return (
                                  <motion.button key={eng.id} type="button" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }} onClick={() => { setIcEngagement2(eng.id); setIcEngagement2Open(false); setSelectedAccount2(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-base transition-all duration-150 cursor-pointer" style={{ background: isActive ? "hsl(var(--primary) / 0.06)" : "transparent", borderBottom: idx < arr.length - 1 ? "1px solid hsl(var(--border) / 0.5)" : "none", color: "hsl(var(--foreground))" }} whileHover={{ background: "hsl(var(--primary) / 0.04)" }}>
                                    <FileText size={14} style={{ color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }} />
                                    <span>{eng.label}</span>
                                    {isActive && <CheckCircle2 size={13} className="ml-auto" style={{ color: "hsl(var(--primary))" }} />}
                                  </motion.button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {/* Step 3: Select Account — enabled after engagement */}
                    {icEngagement2 && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="relative">
                        <label className="text-sm font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>Select Account</label>
                        <motion.button type="button" onClick={() => setIcAccount2Open(!icAccount2Open)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-base outline-none cursor-pointer transition-all duration-200" style={{ borderColor: icAccount2Open ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))", background: "hsl(var(--card))", color: selectedAccount2 !== null ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))", boxShadow: icAccount2Open ? "0 0 0 3px hsl(var(--primary) / 0.08)" : "none" }} whileHover={{ borderColor: "hsl(var(--primary) / 0.3)" }}>
                          <div className="flex items-center gap-2">
                            {selectedAccount2 !== null && <CheckCircle2 size={13} style={{ color: "hsl(145 63% 42%)" }} />}
                            <span>{selectedAccount2 !== null ? sampleAccounts[selectedAccount2].description : "Select account"}</span>
                          </div>
                          <ChevronDown size={14} style={{ color: "hsl(var(--muted-foreground))", transform: icAccount2Open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
                        </motion.button>
                        <AnimatePresence>
                          {icAccount2Open && (
                            <motion.div initial={{ opacity: 0, y: -4, scaleY: 0.95 }} animate={{ opacity: 1, y: 0, scaleY: 1 }} exit={{ opacity: 0, y: -4, scaleY: 0.95 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} style={{ transformOrigin: "top center", background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", boxShadow: "0 8px 24px hsl(220 20% 10% / 0.08)" }} className="absolute left-0 right-0 top-full mt-1.5 rounded-lg z-50 overflow-hidden">
                              <table className="w-full text-base">
                                <thead>
                                  <tr style={{ background: "hsl(var(--table-header-bg))" }}>
                                    <th className="text-left px-3 py-2 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Description</th>
                                    <th className="text-left px-3 py-2 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Date</th>
                                    <th className="text-right px-3 py-2 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Debit</th>
                                    <th className="text-right px-3 py-2 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Credit</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sampleAccounts.map((acc, i) => {
                                    const isSelected = selectedAccount2 === i;
                                    return (
                                      <motion.tr key={`cp-${acc.accountNo}`} initial={{ opacity: 0 }} animate={{ opacity: 1, backgroundColor: isSelected ? "hsl(270 60% 96%)" : "hsl(0 0% 100% / 0)" }} transition={{ delay: i * 0.04 }} onClick={() => { setSelectedAccount2(i); setIcAccount2Open(false); }} className="cursor-pointer transition-all duration-150" style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }} whileHover={!isSelected ? { backgroundColor: "hsl(220 20% 97%)" } : {}}>
                                        <td className="px-3 py-2.5 text-base font-medium" style={{ color: "hsl(var(--foreground))" }}>
                                          <div className="flex items-center gap-2">
                                            {isSelected && <CheckCircle2 size={13} style={{ color: "hsl(145 63% 42%)" }} />}
                                            {acc.description}
                                          </div>
                                        </td>
                                        <td className="px-3 py-2.5 font-mono text-base font-medium" style={{ color: "hsl(var(--foreground))" }}>{acc.date}</td>
                                        <td className="px-3 py-2.5 text-base text-right font-mono font-medium" style={{ color: "hsl(var(--foreground))" }}>{acc.debit}</td>
                                        <td className="px-3 py-2.5 text-base text-right font-mono font-medium" style={{ color: "hsl(var(--foreground))" }}>{acc.credit}</td>
                                      </motion.tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Reconcile CTA */}
              <div className="flex justify-end mt-6">
                <motion.button
                  whileHover={canReconcile ? { scale: 1.03, boxShadow: "0 4px 20px hsl(var(--primary) / 0.25)" } : {}}
                  whileTap={canReconcile ? { scale: 0.97 } : {}}
                  disabled={!canReconcile}
                  onClick={handleReconcile}
                  className="relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-base font-semibold transition-all duration-300 overflow-hidden"
                  style={{
                    background: canReconcile ? "linear-gradient(135deg, hsl(var(--primary)), hsl(270 60% 55%))" : "hsl(var(--muted))",
                    color: canReconcile ? "hsl(0 0% 100%)" : "hsl(var(--muted-foreground))",
                    cursor: canReconcile ? "pointer" : "not-allowed",
                    opacity: canReconcile ? 1 : 0.6,
                  }}
                >
                  {canReconcile && (
                    <motion.div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, hsl(0 0% 100% / 0.15) 50%, transparent 100%)", backgroundSize: "200% 100%" }} animate={{ backgroundPosition: ["-200% 0", "200% 0"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} />
                  )}
                  <Sparkles size={15} className="relative z-10" />
                  <span className="relative z-10">Reconcile</span>
                  <ArrowRight size={15} className="relative z-10" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <BreathingLuka visible={step === "processing"} />

        {/* Results */}
        <AnimatePresence>
          {step === "results" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-start gap-3"
            >
              <LukaAvatar />
              <div className="flex-1 pt-0.5 space-y-5">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-base leading-relaxed"
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  Reconciliation complete between{" "}
                  <strong>Account 1 ({account1Details?.accountNo} — {account1Details?.description})</strong>{" "}
                  and{" "}
                  <strong>Account 2 ({account2Details?.accountNo} — {account2Details?.description}, {counterpartyEntity})</strong>.
                  {" "}Below is the reconciliation statement with suggested adjusting entries.
                </motion.p>

                {/* Reconciliation Statement — IC style */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  {icStmtRows.length > 0 && (
                    <>
                    <EditableStatementTable
                      title="Inter-Company Reconciliation"
                      subtitle="Inter-Company Reconciliation Statement — December 31, 2024"
                      rows={icStmtRows}
                      onRowsChange={setIcStmtRows}
                    />

                      {/* ── Adjusting Entries Section ── */}
                      {!icAdjPosted && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="mt-6 rounded-lg border overflow-hidden"
                          style={{ borderColor: "hsl(var(--border))" }}
                        >
                          <div className="px-5 py-3.5" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                            <p className="font-bold" style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>Post Entries to Reconcile the accounts</p>
                          </div>
                          <table className="w-full">
                            <thead>
                              <tr style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
                                <th className="text-left px-5 py-2.5 font-semibold" style={{ color: "hsl(var(--foreground))", width: 100, fontSize: 15 }}>Acc No</th>
                                <th className="text-left px-5 py-2.5 font-semibold" style={{ color: "hsl(var(--foreground))", fontSize: 15 }}>Description</th>
                                <th className="text-left px-5 py-2.5 font-semibold" style={{ color: "hsl(var(--foreground))", width: 105, fontSize: 15 }}>Date</th>
                                <th className="text-left px-5 py-2.5 font-semibold" style={{ color: "hsl(var(--foreground))", width: 120, fontSize: 15 }}>Entity</th>
                                <th className="text-right px-5 py-2.5 font-semibold" style={{ color: "hsl(var(--foreground))", width: 130, fontSize: 15 }}>Debit</th>
                                <th className="text-right px-5 py-2.5 font-semibold" style={{ color: "hsl(var(--foreground))", width: 130, fontSize: 15 }}>Credit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {icAdjEntries.map((entry, ei) => (
                                <tr key={ei} style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
                                  <td className="px-5 py-2.5">
                                    <select
                                      value={entry.accNo}
                                      className="rounded-md border px-2.5 py-1.5 font-mono"
                                      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))", color: "hsl(var(--foreground))", width: 90, fontSize: 16 }}
                                      disabled
                                    >
                                      <option value={entry.accNo}>{entry.accNo}</option>
                                    </select>
                                  </td>
                                  <td className="px-5 py-2.5">
                                    <input
                                      type="text"
                                      value={entry.desc}
                                      onChange={(e) => {
                                        const updated = [...icAdjEntries];
                                        updated[ei] = { ...updated[ei], desc: e.target.value };
                                        setIcAdjEntries(updated);
                                      }}
                                      className="rounded-md border px-2.5 py-1.5 w-full"
                                      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))", color: "hsl(var(--foreground))", fontSize: 16 }}
                                    />
                                  </td>
                                  <td className="px-5 py-2.5">
                                    <input
                                      type="text"
                                      value={entry.date}
                                      onChange={(e) => {
                                        const updated = [...icAdjEntries];
                                        updated[ei] = { ...updated[ei], date: e.target.value };
                                        setIcAdjEntries(updated);
                                      }}
                                      placeholder="dd/mm/yyyy"
                                      className="rounded-md border px-2.5 py-1.5 w-[105px]"
                                      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))", color: "hsl(var(--foreground))", fontSize: 16 }}
                                    />
                                  </td>
                                  <td className="px-5 py-2.5">
                                    <span className="text-sm font-medium" style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>{entry.entity}</span>
                                  </td>
                                  <td className="px-5 py-2.5 text-right">
                                    <input
                                      type="text"
                                      value={entry.debit}
                                      readOnly
                                      className="rounded-md border px-2.5 py-1.5 font-mono text-right w-[110px]"
                                      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.3)", color: "hsl(var(--foreground))", fontSize: 16 }}
                                    />
                                  </td>
                                  <td className="px-5 py-2.5 text-right">
                                    <input
                                      type="text"
                                      value={entry.credit}
                                      readOnly
                                      className="rounded-md border px-2.5 py-1.5 font-mono text-right w-[110px]"
                                      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.3)", color: "hsl(var(--foreground))", fontSize: 16 }}
                                    />
                                  </td>
                                </tr>
                              ))}
                              {/* Totals row */}
                              {(() => {
                                const parseN = (v: string) => parseFloat(v.replace(/,/g, "")) || 0;
                                const totD = icAdjEntries.reduce((s, e) => s + parseN(e.debit), 0);
                                const totC = icAdjEntries.reduce((s, e) => s + parseN(e.credit), 0);
                                const diff = totD - totC;
                                return (
                                  <>
                                    <tr style={{ borderTop: "2px solid hsl(var(--foreground))" }}>
                                      <td className="px-5 py-2.5 font-bold" colSpan={4} style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>Total</td>
                                      <td className="px-5 py-2.5 text-right font-bold font-mono" style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>{totD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                      <td className="px-5 py-2.5 text-right font-bold font-mono" style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>{totC.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                    {diff !== 0 && (
                                      <tr>
                                        <td className="px-5 py-2.5 font-semibold" colSpan={4} style={{ color: "hsl(0, 72%, 51%)", fontSize: 16 }}>Difference</td>
                                        <td className="px-5 py-2.5 text-right font-mono font-semibold" colSpan={2} style={{ color: "hsl(0, 72%, 51%)", fontSize: 16 }}>{Math.abs(diff).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                      </tr>
                                    )}
                                  </>
                                );
                              })()}
                            </tbody>
                          </table>
                          {/* Notes */}
                          <div className="px-5 py-3" style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>Notes</span>
                              <ChevronDown size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
                            </div>
                            <textarea
                              value={icAdjNotes}
                              onChange={(e) => setIcAdjNotes(e.target.value)}
                              rows={3}
                              className="w-full border px-3 py-2 text-sm resize-none"
                              style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))", color: "hsl(var(--foreground))", borderRadius: 12 }}
                            />
                          </div>
                          {/* Post Entry button */}
                          <div className="flex justify-end px-5 py-3" style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setIcAdjPosting(true);
                                setTimeout(() => {
                                  setIcAdjPosting(false);
                                  setIcAdjPosted(true);
                                }, 1200);
                              }}
                              disabled={icAdjPosting}
                              className="px-5 py-2 text-sm font-medium transition-all"
                              style={{
                                borderRadius: 12,
                                background: icAdjPosting ? "hsl(var(--muted))" : "hsl(var(--primary))",
                                color: icAdjPosting ? "hsl(var(--muted-foreground))" : "hsl(var(--primary-foreground))",
                              }}
                            >
                              {icAdjPosting ? "Posting..." : "Post Entry"}
                            </motion.button>
                          </div>
                        </motion.div>
                      )}

                      {/* Success message after posting */}
                      {icAdjPosted && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 flex items-center gap-2"
                        >
                          <CheckCircle2 size={16} style={{ color: "hsl(145 63% 42%)" }} />
                          <span className="text-sm font-bold" style={{ color: "hsl(145 63% 42%)" }}>
                            Adjusting entries posted. Inter-company accounts are now reconciled — IC Receivable and IC Payable balances are now equal.
                          </span>
                        </motion.div>
                      )}

                      {/* ── Luka Summary Box: Unmatched vs Potential Matches (Inter-company) ── */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.45, ease: "easeOut" }}
                        className="mt-6 relative overflow-hidden"
                        style={{
                          borderRadius: 16,
                          border: "1.5px solid hsl(270 60% 55% / 0.25)",
                          background:
                            "linear-gradient(135deg, hsl(270 60% 55% / 0.06) 0%, hsl(207 71% 38% / 0.05) 50%, hsl(var(--background)) 100%)",
                          boxShadow: "0 4px 24px hsl(270 60% 55% / 0.08)",
                          backdropFilter: "blur(8px)",
                        }}
                      >
                        {/* Decorative gradient orb */}
                        <div
                          aria-hidden
                          style={{
                            position: "absolute",
                            top: -40,
                            right: -40,
                            width: 180,
                            height: 180,
                            borderRadius: "50%",
                            background:
                              "radial-gradient(circle, hsl(270 60% 55% / 0.18) 0%, transparent 70%)",
                            pointerEvents: "none",
                          }}
                        />

                        {/* Header */}
                        <div className="flex items-start gap-3 px-5 pt-5 pb-3 relative">
                          <LukaAvatar />
                          <div className="flex-1 pt-0.5">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span
                                className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                                style={{
                                  background:
                                    "linear-gradient(135deg, hsl(270 60% 55% / 0.15), hsl(207 71% 38% / 0.12))",
                                  color: "hsl(270 60% 45%)",
                                  letterSpacing: "0.08em",
                                }}
                              >
                                Luka Summary
                              </span>
                              <Sparkles size={13} style={{ color: "hsl(270 60% 55%)" }} />
                            </div>
                            <p
                              className="text-[15px] font-semibold leading-snug"
                              style={{ color: "hsl(var(--foreground))" }}
                            >
                              Inter-company reconciliation: unmatched vs potential matches
                            </p>
                          </div>
                        </div>

                        {/* Stat Tiles */}
                        <div className="grid grid-cols-3 gap-3 px-5 pb-4 relative">
                          {(() => {
                            const parseNumIc = (v: string) => parseFloat(v.replace(/,/g, "")) || 0;
                            const totalAdjEntriesIc = icAdjEntries.length;
                            const totalAdjValueIc = icAdjEntries.reduce(
                              (s, e) => s + parseNumIc(e.debit) + parseNumIc(e.credit),
                              0,
                            );
                            const tiles = [
                              {
                                label: "Unmatched",
                                value: "3",
                                sub: "IC entries needing review",
                                color: "hsl(0 72% 51%)",
                                bg: "hsl(0 72% 51% / 0.08)",
                                border: "hsl(0 72% 51% / 0.25)",
                              },
                              {
                                label: "Potential Matches",
                                value: "2",
                                sub: "counterparty + amount pairs",
                                color: "hsl(38 92% 50%)",
                                bg: "hsl(38 92% 50% / 0.08)",
                                border: "hsl(38 92% 50% / 0.25)",
                              },
                              {
                                label: "Unadjusted Entries",
                                value: String(totalAdjEntriesIc),
                                sub: `$${totalAdjValueIc.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total`,
                                color: "hsl(207 71% 31%)",
                                bg: "hsl(207 71% 31% / 0.08)",
                                border: "hsl(207 71% 31% / 0.25)",
                              },
                            ];
                            return tiles.map((t, i) => (
                              <motion.div
                                key={t.label}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 + i * 0.07 }}
                                className="rounded-xl px-3.5 py-3"
                                style={{
                                  background: t.bg,
                                  border: `1px solid ${t.border}`,
                                }}
                              >
                                <div
                                  className="text-[10px] font-bold uppercase tracking-wider mb-1"
                                  style={{ color: t.color, letterSpacing: "0.08em" }}
                                >
                                  {t.label}
                                </div>
                                <div
                                  className="font-mono font-bold text-[24px] leading-none"
                                  style={{ color: t.color }}
                                >
                                  {t.value}
                                </div>
                                <div
                                  className="text-[11px] mt-1.5"
                                  style={{ color: "hsl(var(--muted-foreground))" }}
                                >
                                  {t.sub}
                                </div>
                              </motion.div>
                            ));
                          })()}
                        </div>

                        {/* Methodology / How Luka identifies matches */}
                        <div
                          className="mx-5 mb-5 rounded-xl px-4 py-3.5"
                          style={{
                            background: "hsl(var(--background) / 0.7)",
                            border: "1px solid hsl(var(--border) / 0.6)",
                          }}
                        >
                          <div className="flex items-center gap-1.5 mb-2.5">
                            <Search size={13} style={{ color: "hsl(270 60% 55%)" }} />
                            <span
                              className="text-[11px] font-bold uppercase tracking-wider"
                              style={{ color: "hsl(var(--foreground))", letterSpacing: "0.06em" }}
                            >
                              How Luka identified matches
                            </span>
                          </div>
                          <ul className="space-y-1.5">
                            {[
                              {
                                label: "Exact match",
                                text: "IC receivable on Entity A mirrors IC payable on Entity B with identical amount, currency, and posting period",
                              },
                              {
                                label: "Fuzzy match",
                                text: "amount tolerance ≤ $1.00 (FX rounding), counterparty name similarity ≥ 85% (e.g. SubCo A → Subsidiary A Inc.), date variance ≤ 5 days for in-transit entries",
                              },
                              {
                                label: "Unmatched",
                                text: "entries booked on only one side — typically management fees, royalties, or cost allocations awaiting counter-entry, or FX revaluation differences between entities",
                              },
                            ].map((row, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-[13px] leading-relaxed"
                                style={{ color: "hsl(var(--foreground) / 0.85)" }}
                              >
                                <span
                                  className="mt-1.5 w-1 h-1 rounded-full shrink-0"
                                  style={{ background: "hsl(270 60% 55%)" }}
                                />
                                <span>
                                  <strong style={{ color: "hsl(var(--foreground))" }}>
                                    {row.label}:
                                  </strong>{" "}
                                  {row.text}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Footer recommendation */}
                        <div
                          className="px-5 py-3 flex items-center gap-2"
                          style={{
                            borderTop: "1px solid hsl(270 60% 55% / 0.15)",
                            background:
                              "linear-gradient(90deg, hsl(270 60% 55% / 0.04), hsl(207 71% 38% / 0.03))",
                          }}
                        >
                          <AlertCircle size={14} style={{ color: "hsl(38 92% 45%)" }} />
                          <p
                            className="text-[12.5px]"
                            style={{ color: "hsl(var(--foreground) / 0.85)" }}
                          >
                            <strong>Recommendation:</strong> Post the {icAdjEntries.length} adjusting{" "}
                            {icAdjEntries.length === 1 ? "entry" : "entries"} above to align IC receivable and payable balances,
                            then investigate the 3 unmatched items (likely missing counter-entries or FX revaluations) before consolidation.
                          </p>
                        </div>
                      </motion.div>
                    </>
                  )}
                </motion.div>

                {/* Inter-company Success Message & Action Icons */}
                <AnimatePresence>
                  {icAdjPosted && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex items-start gap-3 mt-6 mb-2">
                      <img src={lukaLogo} alt="Luka" className="w-7 h-7 rounded-full mt-0.5" />
                      <p className="text-[15px] leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
                        <strong>Successfully reconciled the selected Inter-company/Related Party accounts.</strong>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {icAdjPosted && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-center gap-3 mt-4"
                    >
                      {[
                        { icon: <Copy size={20} />, label: "Copy" },
                        { icon: <Download size={20} />, label: "Download", hasDropdown: true },
                        { icon: <FolderOpen size={20} />, label: "Save to Engagement" },
                        { icon: <RefreshCw size={20} />, label: "Rerun" },
                      ].map((action, i) => (
                        <div key={action.label} className="relative" ref={action.hasDropdown ? downloadRef : undefined}>
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + i * 0.08 }}
                            onClick={() => {
                              if (action.hasDropdown) setShowDownloadMenu(prev => !prev);
                            }}
                            className="group relative flex items-center justify-center rounded-xl border transition-all duration-150"
                            style={{
                              width: 48, height: 48,
                              borderColor: "hsl(var(--border))",
                              background: "hsl(var(--background))",
                              color: "hsl(var(--muted-foreground))",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "hsl(var(--primary))";
                              e.currentTarget.style.color = "hsl(var(--primary))";
                              e.currentTarget.style.boxShadow = "0 2px 8px hsl(var(--primary) / 0.15)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "hsl(var(--border))";
                              e.currentTarget.style.color = "hsl(var(--muted-foreground))";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            {action.icon}
                            <span
                              className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                              style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}
                            >
                              {action.label}
                            </span>
                          </motion.button>

                          {action.hasDropdown && showDownloadMenu && (
                            <motion.div
                              initial={{ opacity: 0, y: -4, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -4, scale: 0.95 }}
                              className="absolute left-0 top-full mt-2 rounded-lg border shadow-lg overflow-hidden z-50"
                              style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", minWidth: 160 }}
                            >
                              {[
                                { icon: <FileText size={16} />, label: "PDF", action: handleDownloadPDF },
                                { icon: <FileSpreadsheet size={16} />, label: "Excel", action: handleDownloadExcel },
                              ].map((opt) => (
                                <button
                                  key={opt.label}
                                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium transition-all duration-150 text-left"
                                  style={{ color: "hsl(var(--foreground))" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "hsl(var(--muted))"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                  onClick={() => { opt.action(); setShowDownloadMenu(false); }}
                                >
                                  <span style={{ color: "hsl(var(--muted-foreground))" }}>{opt.icon}</span>
                                  {opt.label}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReconciliationFlow;
