/**
 * InvWACImportModal
 * Upload a simplified Excel / CSV of prior-year closing balances to seed the WAC schedule
 * with Opening Balance rows.
 *
 * Simplified template columns (auto-detected, order doesn't matter):
 *   Date | Ticker | Security | Currency | Opening Units | Opening Cost (CAD) | WAC
 */

import { useRef, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Upload, FileSpreadsheet, CheckCircle2, X, AlertTriangle, Download, Info,
} from "lucide-react";
import { Button } from "@/components/wp-ui/button";
import { Badge } from "@/components/wp-ui/badge";
import toast from "react-hot-toast";
import type { SecuritySchedule, WacRow } from "@/lib/luka/compute";

/* ─── Types ────────────────────────────────────────────────────────────── */

interface Props {
  open: boolean;
  onClose: () => void;
  schedules: SecuritySchedule[];
  /** Called with opening rows to prepend; key = scheduleKey, value = WacRow to insert */
  onApply: (entries: Array<{ scheduleKey: string; row: WacRow; ticker: string }>) => void;
}

type ColMap = {
  date:     string | null;
  ticker:   string | null;
  security: string | null;
  currency: string | null;
  units:    string | null;
  costCAD:  string | null;
  wac:      string | null;
};

const FIELD_DEFS: { key: keyof ColMap; label: string; required: boolean; hints: string[] }[] = [
  { key: "date",     label: "Date",               required: false, hints: ["date", "year end", "yearend", "period", "as of", "asof"] },
  { key: "ticker",   label: "Ticker",             required: true,  hints: ["ticker", "symbol", "code", "cusip"] },
  { key: "security", label: "Security name",      required: false, hints: ["security", "name", "description", "investment", "company"] },
  { key: "currency", label: "Currency",           required: false, hints: ["currency", "ccy", "cur"] },
  { key: "units",    label: "Opening units",      required: true,  hints: ["units", "shares", "qty", "quantity", "opening unit", "cum unit"] },
  { key: "costCAD",  label: "Opening cost (CAD)", required: true,  hints: ["cost", "acb", "book", "carrying", "cad cost", "opening cost", "cum cost"] },
  { key: "wac",      label: "WAC",                required: false, hints: ["wac", "average cost", "avg cost", "unit cost", "avg price", "weighted"] },
];

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function autoMap(headers: string[]): ColMap {
  const out: Record<string, string | null> = {};
  for (const f of FIELD_DEFS) {
    const h = headers.find((h) =>
      f.hints.some((hint) => h.toLowerCase().replace(/[^a-z0-9 ]/g, " ").includes(hint)),
    );
    out[f.key] = h ?? null;
  }
  return out as ColMap;
}

function parseNum(v: unknown): number {
  if (v == null || v === "") return 0;
  return Number(String(v).replace(/[,$% ]/g, "")) || 0;
}

function parseDate(v: unknown): string {
  if (!v) return "";
  // Excel serial number
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) {
      const mm = String(d.m).padStart(2, "0");
      const dd = String(d.d).padStart(2, "0");
      return `${d.y}-${mm}-${dd}`;
    }
  }
  const s = String(v).trim();
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // DD/MM/YYYY or MM/DD/YYYY
  const m = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  // Dec 31, 2023
  const months: Record<string, string> = {
    jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",
    jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12",
  };
  const m2 = s.match(/^([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m2) {
    const mo = months[m2[1].slice(0,3).toLowerCase()];
    if (mo) return `${m2[3]}-${mo}-${m2[2].padStart(2, "0")}`;
  }
  // Try native Date parse as last resort
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s;
}

/* ─── Template download ──────────────────────────────────────────────────── */

function downloadTemplate() {
  const aoa = [
    ["Date",        "Ticker", "Security Name",  "Currency", "Opening Units", "Opening Cost (CAD)", "WAC"],
    ["2023-12-31",  "AAPL",   "Apple Inc.",     "USD",      175,             35772.06,             204.41],
    ["2023-12-31",  "ENB",    "Enbridge Inc.",  "CAD",      600,             28560.00,             47.60],
    ["2023-12-31",  "MSFT",   "Microsoft Corp.","USD",      50,              18500.00,             370.00],
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Style header row bold / wider columns
  ws["!cols"] = [{ wch: 14 }, { wch: 8 }, { wch: 22 }, { wch: 10 }, { wch: 16 }, { wch: 22 }, { wch: 8 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Opening Balances");
  XLSX.writeFile(wb, "WAC_Opening_Balance_Template.xlsx");
  toast.success("Template downloaded");
}

/* ─── Preview row ─────────────────────────────────────────────────────────── */

interface ParsedRow {
  date:     string;
  ticker:   string;
  security: string;
  currency: string;
  units:    number;
  costCAD:  number;
  wac:      number;
  matchKey: string | null;  // null = no matching schedule
}

const INPUT_CLS =
  "h-8 text-xs px-2 border border-[#dcdfe4] rounded-lg bg-white dark:bg-card text-foreground focus:outline-none focus:ring-0 w-full";
const SEL_CLS = `${INPUT_CLS} cursor-pointer`;

/* ─── Modal ───────────────────────────────────────────────────────────────── */

export default function InvWACImportModal({ open, onClose, schedules, onApply }: Props) {
  const [step, setStep]           = useState<"upload" | "preview">("upload");
  const [fileName, setFileName]   = useState<string | null>(null);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows]     = useState<Record<string, unknown>[]>([]);
  const [colMap, setColMap]       = useState<ColMap>({
    date: null, ticker: null, security: null, currency: null, units: null, costCAD: null, wac: null,
  });
  const [dragging, setDragging]   = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  /* ── File handling ──────────────────────────────────────────────────── */

  const handleFile = async (file: File) => {
    setParseError(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: false });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: true });
      if (!json.length) throw new Error("Worksheet appears to be empty.");
      const hdrs = Object.keys(json[0]);
      setFileName(file.name);
      setRawHeaders(hdrs);
      setRawRows(json);
      setColMap(autoMap(hdrs));
      setStep("preview");
    } catch (e: unknown) {
      setParseError(e instanceof Error ? e.message : "Could not parse file.");
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  /* ── Build parsed rows from current column mapping ────────────────── */

  const parsedRows: ParsedRow[] = rawRows.map((r) => {
    const ticker   = String(r[colMap.ticker   ?? ""] ?? "").trim().toUpperCase();
    const security = String(r[colMap.security ?? ""] ?? "").trim() || ticker;
    const currency = String(r[colMap.currency ?? ""] ?? "").trim().toUpperCase() || "CAD";
    const date     = parseDate(colMap.date ? r[colMap.date] : null) || new Date().getFullYear() - 1 + "-12-31";
    const units    = parseNum(colMap.units   ? r[colMap.units]   : null);
    const costCAD  = parseNum(colMap.costCAD ? r[colMap.costCAD] : null);
    const rawWac   = parseNum(colMap.wac     ? r[colMap.wac]     : null);
    const wac      = rawWac > 0 ? rawWac : units > 0 ? costCAD / units : 0;
    // Match to an existing schedule by ticker (case-insensitive)
    const sched = schedules.find(
      (s) => s.ticker.toLowerCase() === ticker.toLowerCase(),
    );
    return { date, ticker, security, currency, units, costCAD, wac, matchKey: sched?.key ?? null };
  }).filter((r) => r.ticker);

  const matched   = parsedRows.filter((r) => r.matchKey !== null);
  const unmatched = parsedRows.filter((r) => r.matchKey === null);

  /* ── Apply ───────────────────────────────────────────────────────────── */

  const handleApply = () => {
    const entries = matched.map((r) => ({
      scheduleKey: r.matchKey!,
      ticker:      r.ticker,
      row: {
        date:     r.date,
        type:     "Opening Balance",
        unitsIn:  r.units,
        unitsOut: 0,
        price:    r.wac,
        costIn:   r.costCAD,
        costOut:  0,
        cumUnits: r.units,
        cumCost:  r.costCAD,
        wac:      r.wac,
        notes:    `Imported from ${fileName ?? "file"}`,
      } satisfies WacRow,
    }));
    onApply(entries);
    toast.success(`Opening balances applied for ${entries.length} securit${entries.length === 1 ? "y" : "ies"}`);
    onClose();
  };

  /* ── Reset ───────────────────────────────────────────────────────────── */

  const reset = () => {
    setStep("upload"); setFileName(null); setRawHeaders([]); setRawRows([]);
    setColMap({ date: null, ticker: null, security: null, currency: null, units: null, costCAD: null, wac: null });
    setParseError(null);
  };

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-3xl max-h-[90vh] flex flex-col bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Import Opening Balances</h2>
              <p className="text-xs text-muted-foreground">
                Upload prior-year closing data to seed WAC schedule opening rows
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ─── Info banner ─────────────────────────────────────────────── */}
        <div className="flex items-start gap-2.5 mx-6 mt-4 px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex-shrink-0">
          <Info className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            Import a simplified spreadsheet with one row per security. Each row becomes an{" "}
            <strong>Opening Balance</strong> prepended to that security's WAC schedule.
            Required columns: <strong>Ticker</strong>, <strong>Opening Units</strong>,{" "}
            <strong>Opening Cost (CAD)</strong>. WAC is auto-calculated if omitted.
          </p>
        </div>

        {/* ─── Body ────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">

          {step === "upload" ? (
            /* ══ Step 1: Upload ══════════════════════════════════════════ */
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 cursor-pointer transition-colors ${
                  dragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Upload className={`h-5 w-5 ${dragging ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Drop your file here, or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports .xlsx, .xls, and .csv</p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>

              {parseError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  {parseError}
                </div>
              )}

              {/* Template download */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                <p className="text-xs font-semibold text-foreground">Simplified template format</p>
                {/* Mini preview table */}
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        {["Date", "Ticker", "Security Name", "Currency", "Opening Units", "Opening Cost (CAD)", "WAC"].map((h) => (
                          <th key={h} className="px-3 py-1.5 text-left font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["2023-12-31", "AAPL", "Apple Inc.", "USD", "175", "35,772.06", "204.41"],
                        ["2023-12-31", "ENB",  "Enbridge Inc.", "CAD", "600", "28,560.00", "47.60"],
                      ].map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-card" : "bg-muted/20"}>
                          {row.map((v, j) => (
                            <td key={j} className="px-3 py-1.5 font-mono whitespace-nowrap text-foreground">{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-amber-600 font-medium">Note:</span>{" "}
                  Date and WAC columns are optional. If WAC is omitted it is auto-calculated as Cost ÷ Units.
                  Column order doesn't matter — the tool auto-detects header names.
                </p>
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="w-full gap-2">
                  <Download className="h-3.5 w-3.5" />
                  Download blank template (.xlsx)
                </Button>
              </div>
            </div>

          ) : (
            /* ══ Step 2: Preview & mapping ═══════════════════════════════ */
            <div className="space-y-4">
              {/* File chip + back */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-xs">
                  <FileSpreadsheet className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium text-foreground">{fileName}</span>
                  <span className="text-muted-foreground">{rawRows.length} rows</span>
                </div>
                <button
                  onClick={reset}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Change file
                </button>
              </div>

              {/* Column mapping */}
              <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                <p className="text-xs font-semibold text-foreground">Column mapping</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FIELD_DEFS.map((f) => (
                    <div key={f.key} className="space-y-0.5">
                      <label className="text-[11px] text-muted-foreground flex items-center gap-1">
                        {f.label}
                        {f.required && <span className="text-destructive">*</span>}
                      </label>
                      <select
                        value={colMap[f.key] ?? ""}
                        onChange={(e) => setColMap((m) => ({ ...m, [f.key]: e.target.value || null }))}
                        className={SEL_CLS}
                      >
                        <option value="">— not mapped —</option>
                        {rawHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                {FIELD_DEFS.filter((f) => f.required && !colMap[f.key]).length > 0 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                    Map all required columns (*) before importing.
                  </p>
                )}
              </div>

              {/* Summary badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="gap-1.5 text-green-700 border-green-300 bg-green-50">
                  <CheckCircle2 className="h-3 w-3" />
                  {matched.length} matched
                </Badge>
                {unmatched.length > 0 && (
                  <Badge variant="outline" className="gap-1.5 text-amber-700 border-amber-300 bg-amber-50">
                    <AlertTriangle className="h-3 w-3" />
                    {unmatched.length} unmatched (will be skipped)
                  </Badge>
                )}
              </div>

              {/* Preview table */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Status</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Ticker</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Security</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Date</th>
                        <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Opening Units</th>
                        <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Opening Cost (CAD)</th>
                        <th className="px-3 py-2 text-right font-semibold text-muted-foreground">WAC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((r, i) => (
                        <tr
                          key={i}
                          className={`border-b border-border/50 ${
                            r.matchKey ? "hover:bg-muted/20" : "opacity-50 bg-amber-50/50 dark:bg-amber-950/20"
                          }`}
                        >
                          <td className="px-3 py-2">
                            {r.matchKey ? (
                              <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                                <CheckCircle2 className="h-3 w-3" /> Matched
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-600">
                                <AlertTriangle className="h-3 w-3" /> No schedule
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-mono font-semibold">{r.ticker}</td>
                          <td className="px-3 py-2 max-w-[140px] truncate">{r.security}</td>
                          <td className="px-3 py-2 font-mono text-muted-foreground">{r.date || "—"}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{r.units.toLocaleString("en-CA", { maximumFractionDigits: 4 })}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{r.costCAD.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{r.wac.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {unmatched.length > 0 && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
                  <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span>
                    Unmatched tickers ({unmatched.map((r) => r.ticker).join(", ")}) will be skipped.
                    To include them, first add a transaction with the same ticker in the Transactions tab.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Footer ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20 flex-shrink-0">
          <div className="text-xs text-muted-foreground">
            {step === "upload"
              ? "Download the template above for the expected format"
              : `${matched.length} of ${parsedRows.length} rows will be applied`}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} size="sm">Cancel</Button>
            {step === "preview" && (
              <Button
                variant="default"
                size="sm"
                disabled={matched.length === 0 || FIELD_DEFS.filter((f) => f.required && !colMap[f.key]).length > 0}
                onClick={handleApply}
                className="gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Apply {matched.length} Opening Balance{matched.length !== 1 ? "s" : ""}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
