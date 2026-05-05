import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, CheckCircle2, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/wp-ui/button";
import { Badge } from "@/components/wp-ui/badge";
import toast from "react-hot-toast";
import { PriorYearLot, Currency } from "@/lib/luka/types";

interface Props {
  onApply: (lots: PriorYearLot[]) => void;
  onReset: () => void;
  applied: boolean;
  appliedCount: number;
}

type Mapping = {
  security: string;
  ticker: string;
  units: string;
  costCAD: string;
  sourceId?: string;
  currency?: string;
};

const FIELDS: { key: keyof Mapping; label: string; required: boolean; hints: string[] }[] = [
  { key: "security", label: "Security name", required: true, hints: ["security", "name", "description"] },
  { key: "ticker", label: "Ticker", required: true, hints: ["ticker", "symbol"] },
  { key: "units", label: "Opening units", required: true, hints: ["units", "shares", "quantity", "qty"] },
  { key: "costCAD", label: "Opening cost (CAD)", required: true, hints: ["cost", "acb", "book", "carrying"] },
  { key: "sourceId", label: "Broker / source", required: false, hints: ["broker", "source", "account"] },
  { key: "currency", label: "Currency", required: false, hints: ["currency", "ccy"] },
];

function autoMap(headers: string[]): Mapping {
  const m: Record<string, string> = {};
  for (const f of FIELDS) {
    const h = headers.find((h) => f.hints.some((hint) => h.toLowerCase().includes(hint)));
    if (h) m[f.key] = h;
  }
  return m as Mapping;
}

export default function InvPriorYearImport({ onApply, onReset, applied, appliedCount }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
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
      if (!json.length) throw new Error("Worksheet appears to be empty.");
      const hdrs = Object.keys(json[0]);
      setFileName(file.name);
      setHeaders(hdrs);
      setRows(json);
      setMapping(autoMap(hdrs));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not parse the file. Use .csv or .xlsx with a header row.";
      setError(msg);
    }
  };

  const buildLots = (): PriorYearLot[] | null => {
    if (!mapping) return null;
    const missing = FIELDS.filter((f) => f.required && !mapping[f.key]);
    if (missing.length) {
      toast.error(`Map required columns: ${missing.map((m) => m.label).join(", ")}`);
      return null;
    }
    const lots: PriorYearLot[] = [];
    for (const r of rows) {
      const units = Number(String(r[mapping.units!]).replace(/[, ]/g, ""));
      const cost = Number(String(r[mapping.costCAD!]).replace(/[$, ]/g, ""));
      const ticker = String(r[mapping.ticker!] ?? "").trim();
      const security = String(r[mapping.security!] ?? "").trim();
      if (!ticker || !security || !isFinite(units) || !isFinite(cost)) continue;
      const ccyRaw = mapping.currency ? String(r[mapping.currency] ?? "").toUpperCase().trim() : "CAD";
      const currency = (["CAD", "USD", "EUR", "GBP"].includes(ccyRaw) ? ccyRaw : "CAD") as Currency;
      lots.push({
        security, ticker, units, costCAD: cost,
        sourceId: mapping.sourceId ? String(r[mapping.sourceId] ?? "PY").trim() || "PY" : "PY",
        currency,
      });
    }
    return lots;
  };

  const apply = () => {
    const lots = buildLots();
    if (!lots) return;
    if (!lots.length) { toast.error("No valid rows found after mapping."); return; }
    onApply(lots);
    toast.success(`Imported ${lots.length} prior-year lot${lots.length === 1 ? "" : "s"}`);
  };

  const clearFile = () => {
    setFileName(null); setHeaders([]); setRows([]); setMapping(null); setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FileSpreadsheet className="h-4 w-4 text-primary" /> Prior-Year Schedule Import
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Upload last year's investment working paper (.csv / .xlsx). Maps opening units &amp; cost
          into this year's WAC pool.
          {applied && (
            <Badge variant="secondary" className="ml-2 gap-1 inline-flex items-center">
              <CheckCircle2 className="h-3 w-3 text-green-600" /> {appliedCount} lots applied
            </Badge>
          )}
        </p>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Button variant="outline" onClick={() => inputRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" /> Choose file
          </Button>
          {fileName && (
            <span className="text-sm text-muted-foreground inline-flex items-center gap-2">
              <FileSpreadsheet className="h-3.5 w-3.5" /> {fileName} · {rows.length} rows
              <button onClick={clearFile} className="text-muted-foreground hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          {applied && (
            <Button variant="ghost" size="sm" onClick={onReset} className="ml-auto">
              Revert to mock prior-year file
            </Button>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 mt-0.5" /> {error}
          </div>
        )}

        {headers.length > 0 && mapping && (
          <>
            <div className="grid md:grid-cols-3 gap-3">
              {FIELDS.map((f) => (
                <div key={f.key} className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
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

            <div className="rounded-xl border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {headers.map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      {headers.map((h) => (
                        <td key={h} className="px-4 py-3 text-xs">{String(r[h])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 5 && (
                <div className="text-xs text-muted-foreground p-2 border-t border-border">
                  Showing 5 of {rows.length} rows.
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={apply} className="gap-2">
                <CheckCircle2 className="h-4 w-4" /> Apply to current year
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
