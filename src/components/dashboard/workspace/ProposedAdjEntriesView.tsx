import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Trash2,
  Plus,
  FileText,
  ChevronRight,
  Copy,
  Download,
  Archive,
  Share2,
  RefreshCw,
} from "lucide-react";
import lukaIdle from "@/assets/luka-idle.gif";
import BottomPrompter from "./BottomPrompter";

const FONT = "'DM Sans', system-ui, sans-serif";

interface Row {
  accNo: string;
  description: string;
  entryDate: string;
  debit: number;
  credit: number;
}

interface EntryBlock {
  title: string;
  rows: Row[];
}

const INITIAL_BLOCKS: EntryBlock[] = [
  {
    title: "Trial Balance Adjustments",
    rows: [
      { accNo: "6230", description: "Insurance Expense", entryDate: "12/31/2025", debit: 5000, credit: 0 },
      { accNo: "6230", description: "Prepaid Insurance", entryDate: "12/31/2025", debit: 0, credit: 10000 },
    ],
  },
  {
    title: "Financial Statements",
    rows: [
      { accNo: "6230", description: "Insurance Expense", entryDate: "12/31/2025", debit: 5000, credit: 0 },
      { accNo: "6230", description: "Prepaid Insurance", entryDate: "12/31/2025", debit: 0, credit: 10000 },
    ],
  },
];

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const FieldInput = ({
  value,
  onChange,
  align = "left",
  width,
}: {
  value: string;
  onChange: (v: string) => void;
  align?: "left" | "right";
  width?: string;
}) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-[hsl(209_71%_45%)]/30 transition-all"
    style={{
      fontFamily: FONT,
      color: "hsl(222 30% 20%)",
      background: "hsl(0 0% 100%)",
      border: "1px solid hsl(220 20% 88%)",
      borderRadius: "8px",
      textAlign: align,
      width: width ?? "100%",
    }}
  />
);

const EntryCard = ({ block, blockIdx, onChange }: { block: EntryBlock; blockIdx: number; onChange: (b: EntryBlock) => void }) => {
  const totalDebit = block.rows.reduce((s, r) => s + (Number(r.debit) || 0), 0);
  const totalCredit = block.rows.reduce((s, r) => s + (Number(r.credit) || 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);

  const updateRow = (idx: number, patch: Partial<Row>) => {
    const rows = block.rows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    onChange({ ...block, rows });
  };
  const removeRow = (idx: number) => {
    onChange({ ...block, rows: block.rows.filter((_, i) => i !== idx) });
  };
  const addRow = () => {
    onChange({
      ...block,
      rows: [
        ...block.rows,
        { accNo: "", description: "", entryDate: "12/31/2025", debit: 0, credit: 0 },
      ],
    });
  };

  return (
    <div className="mt-3">
      <p
        className="text-[13.5px] italic font-semibold mb-2"
        style={{ color: "hsl(222 30% 22%)", fontFamily: FONT }}
      >
        {block.title}
      </p>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: blockIdx * 0.08, ease: "easeOut" }}
        className="rounded-[16px] overflow-hidden"
        style={{
          background: "hsl(220 30% 98.5%)",
          border: "1px solid hsl(220 20% 90%)",
        }}
      >
        {/* Header bar with Post Entry */}
        <div className="flex items-center justify-end px-4 py-3" style={{ borderBottom: "1px solid hsl(220 20% 92%)" }}>
          <button
            type="button"
            className="px-4 py-2 rounded-[12px] text-[13px] font-semibold transition-all hover:brightness-110 active:scale-95"
            style={{
              background: "hsl(209 71% 38%)",
              color: "hsl(0 0% 100%)",
              fontFamily: FONT,
              boxShadow: "0 2px 8px hsl(209 71% 38% / 0.25)",
            }}
          >
            Post Entry
          </button>
        </div>

        {/* Column headers */}
        <div
          className="grid items-center px-4 py-2.5 text-[12.5px] font-semibold"
          style={{
            gridTemplateColumns: "1fr 1.6fr 1.4fr 1fr 1fr 72px",
            gap: "12px",
            color: "hsl(222 25% 25%)",
            fontFamily: FONT,
            background: "hsl(220 30% 96%)",
            borderBottom: "1px solid hsl(220 20% 92%)",
          }}
        >
          <span>Acc No</span>
          <span>Description</span>
          <span>Entry Date</span>
          <span className="text-right">Debit</span>
          <span className="text-right">Credit</span>
          <span />
        </div>

        {/* Rows */}
        <div className="px-4 py-2">
          {block.rows.map((row, idx) => (
            <div
              key={idx}
              className="grid items-center py-1.5"
              style={{ gridTemplateColumns: "1fr 1.6fr 1.4fr 1fr 1fr 72px", gap: "12px" }}
            >
              <FieldInput value={row.accNo} onChange={(v) => updateRow(idx, { accNo: v })} />
              <FieldInput value={row.description} onChange={(v) => updateRow(idx, { description: v })} />
              <div className="relative">
                <FieldInput value={row.entryDate} onChange={(v) => updateRow(idx, { entryDate: v })} />
                <Calendar
                  size={13}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "hsl(222 15% 50%)" }}
                />
              </div>
              <FieldInput
                value={fmt(row.debit)}
                onChange={(v) =>
                  updateRow(idx, { debit: Number(v.replace(/,/g, "")) || 0 })
                }
                align="right"
              />
              <FieldInput
                value={fmt(row.credit)}
                onChange={(v) =>
                  updateRow(idx, { credit: Number(v.replace(/,/g, "")) || 0 })
                }
                align="right"
              />
              <div className="flex items-center gap-1 justify-end">
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  title="Delete row"
                  className="w-7 h-7 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[hsl(0_70%_95%)] hover:text-[hsl(0_70%_50%)]"
                  style={{ color: "hsl(222 15% 55%)" }}
                >
                  <Trash2 size={13} strokeWidth={2} />
                </button>
                {idx === block.rows.length - 1 ? (
                  <button
                    type="button"
                    onClick={addRow}
                    title="Add row"
                    className="w-7 h-7 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[hsl(265_40%_94%)] hover:text-[hsl(265_70%_50%)]"
                    style={{
                      color: "hsl(222 25% 35%)",
                      border: "1px solid hsl(220 20% 88%)",
                      background: "hsl(0 0% 100%)",
                    }}
                  >
                    <Plus size={13} strokeWidth={2.4} />
                  </button>
                ) : (
                  <span className="w-7 h-7" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ borderTop: "1px solid hsl(220 20% 92%)" }}>
          <div
            className="grid items-center px-4 py-2.5 text-[13px]"
            style={{ gridTemplateColumns: "1fr 1.6fr 1.4fr 1fr 1fr 72px", gap: "12px", fontFamily: FONT }}
          >
            <span /><span /><span className="text-right font-semibold" style={{ color: "hsl(222 30% 20%)" }}>Total</span>
            <span className="text-right font-mono" style={{ color: "hsl(222 30% 20%)" }}>{fmt(totalDebit)}</span>
            <span className="text-right font-mono" style={{ color: "hsl(222 30% 20%)" }}>{fmt(totalCredit)}</span>
            <span />
          </div>
          <div
            className="grid items-center px-4 py-2.5 text-[13px]"
            style={{
              gridTemplateColumns: "1fr 1.6fr 1.4fr 1fr 1fr 72px",
              gap: "12px",
              fontFamily: FONT,
              borderTop: "1px solid hsl(220 20% 94%)",
            }}
          >
            <span /><span /><span className="text-right font-semibold" style={{ color: "hsl(222 30% 20%)" }}>Difference</span>
            <span />
            <span
              className="text-right font-mono font-semibold"
              style={{ color: diff === 0 ? "hsl(145 63% 42%)" : "hsl(348 83% 47%)" }}
            >
              {fmt(diff)}
            </span>
            <span />
          </div>
        </div>

        {/* Notes footer */}
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-[hsl(220_30%_96%)]"
          style={{ borderTop: "1px solid hsl(220 20% 92%)" }}
        >
          <span className="flex items-center gap-2 text-[13px]" style={{ color: "hsl(222 25% 28%)", fontFamily: FONT }}>
            <FileText size={14} strokeWidth={2} style={{ color: "hsl(222 15% 50%)" }} />
            Notes
          </span>
          <ChevronRight size={14} strokeWidth={2} style={{ color: "hsl(222 15% 50%)" }} />
        </button>
      </motion.div>
    </div>
  );
};

const ProposedAdjEntriesView = () => {
  const [blocks, setBlocks] = useState<EntryBlock[]>(INITIAL_BLOCKS);

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
              After analyzing the trial balance and general ledger accounts — I have proposed
              the below adjusting entries
            </p>

            {blocks.map((b, i) => (
              <EntryCard
                key={i}
                block={b}
                blockIdx={i}
                onChange={(nb) =>
                  setBlocks((prev) => prev.map((x, idx) => (idx === i ? nb : x)))
                }
              />
            ))}

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
      <BottomPrompter placeholder="Ask Luka about these adjusting entries..." />
    </div>
  );
};

export default ProposedAdjEntriesView;
