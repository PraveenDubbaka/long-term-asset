import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, CheckCircle2, X, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/wp-ui/button";
import { Badge } from "@/components/wp-ui/badge";
import toast from "react-hot-toast";
import { Source, Transaction, TxType, Currency } from "@/lib/luka/types";

interface Props {
  source: Source;
  onApply: (sourceId: string, txns: Transaction[]) => void;
  onReset: (sourceId: string) => void;
  applied: boolean;
  appliedCount: number;
}

type Mapping = {
  date: string;
  type: string;
  security: string;
  ticker: string;
  units: string;
  price: string;
  fees?: string;
  fxRate?: string;
  currency?: string;
  notes?: string;
};

const FIELDS: { key: keyof Mapping; label: string; required: boolean; hints: string[] }[] = [
  { key: "date", label: "Date", required: true, hints: ["date", "trade date", "settle"] },
  { key: "type", label: "Activity / Type", required: true, hints: ["type", "activity", "action", "description"] },
  { key: "security", label: "Security name", required: true, hints: ["security", "name", "description"] },
  { key: "ticker", label: "Ticker / Symbol", required: true, hints: ["ticker", "symbol"] },
  { key: "units", label: "Units / Shares", required: true, hints: ["units", "shares", "quantity", "qty"] },
  { key: "price", label: "Price per unit", required: true, hints: ["price", "rate"] },
  { key: "fees", label: "Fees / Commission", required: false, hints: ["fee", "commission"] },
  { key: "fxRate", label: "FX rate to CAD", required: false, hints: ["fx", "rate"] },
  { key: "currency", label: "Currency", required: false, hints: ["currency", "ccy"] },
  { key: "notes", label: "Notes", required: false, hints: ["note", "memo", "remark"] },
];

function autoMap(headers: string[]): Mapping {
  const m: Record<string, string> = {};
  for (const f of FIELDS) {
    const h = headers.find((h) => f.hints.some((hint) => h.toLowerCase().includes(hint)));
    if (h) m[f.key] = h;
  }
  return m as Mapping;
}

const TYPE_ALIASES: { match: RegExp; type: TxType }[] = [
  { match: /\b(buy|purchase|bought)\b/i, type: "Purchase" },
  { match: /\b(sell|sale|sold)\b/i, type: "Sale" },
  { match: /\b(reinvest|drip)\b/i, type: "Reinvested Dividend" },
  { match: /\bdividend\b/i, type: "Dividend" },
  { match: /\binterest\b/i, type: "Interest" },
  { match: /\b(roc|return of capital)\b/i, type: "Return of Capital" },
  { match: /\b(split)\b/i, type: "Stock Split" },
  { match: /\btransfer in\b/i, type: "Transfer In" },
  { match: /\btransfer out\b/i, type: "Transfer Out" },
  { match: /\b(fee|commission)\b/i, type: "Fee/Commission" },
  { match: /\bfx\b/i, type: "FX Conversion" },
];

const normalizeType = (raw: string): TxType => {
  for (const a of TYPE_ALIASES) if (a.match.test(raw)) return a.type;
  return "Purchase";
};

const num = (v: unknown) => {
  const n = Number(String(v ?? "").replace(/[$, ]/g, ""));
  return isFinite(n) ? n : 0;
};

const normDate = (v: unknown): string => {
  if (v == null || v === "") return "";
  if (typeof v === "number") {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return d.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s;
};

export default function InvSourceTransactionImport({ source, onApply, onReset, applied, appliedCount }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      if (!json.length) throw new Error("File appears empty.");
      const hdrs = Object.keys(json[0]);
      setFileName(file.name);
      setHeaders(hdrs);
      setRows(json);
      setMapping(autoMap(hdrs));
      setOpen(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not parse the file. Use .csv or .xlsx with a header row.";
      setError(msg);
    }
  };

  const apply = () => {
    if (!mapping) return;
    const missing = FIELDS.filter((f) => f.required && !mapping[f.key]);
    if (missing.length) {
      toast.error(`Map required columns: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }
    const out: Transaction[] = [];
    let n = 0;
    for (const r of rows) {
      const date = normDate(r[mapping.date!]);
      const ticker = String(r[mapping.ticker!] ?? "").trim();
      const security = String(r[mapping.security!] ?? "").trim();
      if (!date || !ticker || !security) continue;
      const rawType = String(r[mapping.type!] ?? "");
      const type = normalizeType(rawType);
      let units = num(r[mapping.units!]);
      const price = num(r[mapping.price!]);
      const fees = mapping.fees ? num(r[mapping.fees]) : 0;
      const fxRate = mapping.fxRate ? num(r[mapping.fxRate]) || undefined : undefined;
      const ccyRaw = mapping.currency
        ? String(r[mapping.currency] ?? "").toUpperCase().trim()
        : source.currency;
      const currency = (["CAD", "USD", "EUR", "GBP"].includes(ccyRaw) ? ccyRaw : source.currency) as Currency;
      const notes = mapping.notes ? String(r[mapping.notes] ?? "") : undefined;
      if (type === "Sale" && units > 0) units = -units;
      const gross = Math.abs(units) * price;
      const net = type === "Sale" || type === "Transfer Out" ? gross - fees : gross + fees;
      out.push({
        id: `${source.id}-IMP-${(++n).toString().padStart(4, "0")}`,
        sourceId: source.id, date, security, ticker, type,
        units, price, gross, fees, net, currency, fxRate, notes,
      });
    }
    if (!out.length) { toast.error("No valid rows found after mapping."); return; }
    onApply(source.id, out);
    toast.success(`Imported ${out.length} transactions for ${source.label}`);
    setOpen(false);
  };

  const clearFile = () => {
    setFileName(null); setHeaders([]); setRows([]); setMapping(null); setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} className="gap-2">
          <Upload className="h-3.5 w-3.5" /> {applied ? "Replace CSV" : "Import CSV"}
        </Button>
        {applied && (
          <>
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" /> {appliedCount} imported
            </Badge>
            <Button size="sm" variant="ghost" onClick={() => onReset(source.id)}>
              Revert to mock
            </Button>
          </>
        )}
        {fileName && headers.length > 0 && (
          <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)} className="gap-1">
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            Mapping
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5" /> {error}
        </div>
      )}

      {open && headers.length > 0 && mapping && (
        <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground inline-flex items-center gap-2">
              <FileSpreadsheet className="h-3.5 w-3.5" /> {fileName} · {rows.length} rows
            </span>
            <button onClick={clearFile} className="text-muted-foreground hover:text-destructive">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-2">
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">
                  {f.label} {f.required && <span className="text-destructive">*</span>}
                </label>
                <select
                  value={mapping[f.key] ?? "__none__"}
                  onChange={(e) =>
                    setMapping((m) => ({ ...(m as Mapping), [f.key]: e.target.value === "__none__" ? undefined : e.target.value }))
                  }
                  className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {!f.required && <option value="__none__">— none —</option>}
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-background overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {headers.map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 3).map((r, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    {headers.map((h) => (
                      <td key={h} className="px-4 py-3 text-xs">{String(r[h])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 3 && (
              <div className="text-[11px] text-muted-foreground p-2 border-t border-border">Showing 3 of {rows.length} rows.</div>
            )}
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={apply} className="gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" /> Apply to {source.label}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
