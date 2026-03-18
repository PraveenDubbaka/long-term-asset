import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Zap, ChevronDown, LayoutGrid, BarChart3, Check } from "lucide-react";
import { Switch } from '@/components/wp-ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/wp-ui/tooltip';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, LineChart, Line,
} from "recharts";

/* ── Annual data ── */

const revenueRows = [
  { name: "Product", cy: "4,800.00", cyPct: "63.4", py1: "4,250.00", py1Pct: "63.3", py2: "3,700.00", py2Pct: "63.8", vs: "+12.9" },
  { name: "Services", cy: "1,950.00", cyPct: "25.8", py1: "1,720.00", py1Pct: "25.6", py2: "1,480.00", py2Pct: "25.5", vs: "+13.4" },
  { name: "Licenses", cy: "820.00", cyPct: "10.8", py1: "740.00", py1Pct: "11.0", py2: "620.00", py2Pct: "10.7", vs: "+10.8" },
];
const revenueTotals = { name: "Total Revenue", cy: "7,570.00", py1: "6,710.00", py2: "5,800.00", vs: "+12.8" };

const cosRows = [
  { name: "Cost of goods sold", cy: "2,650.00", cyPct: "35.0", py1: "2,400.00", py1Pct: "35.8", py2: "2,150.00", py2Pct: "37.1", vs: "+10.4" },
  { name: "Direct labour", cy: "780.00", cyPct: "10.3", py1: "720.00", py1Pct: "10.7", py2: "660.00", py2Pct: "11.4", vs: "+8.3" },
  { name: "Manufacturing OH", cy: "430.00", cyPct: "5.7", py1: "390.00", py1Pct: "5.8", py2: "350.00", py2Pct: "6.0", vs: "+10.3" },
];
const cosTotals = { name: "Total COS", cy: "3,860.00", py1: "3,510.00", py2: "3,160.00", vs: "+10.0" };

const marginRows = [
  { name: "Total Revenue", cy: "7,570.00", cyPct: "-", py1: "6,710.00", py1Pct: "-", py2: "5,800.00", py2Pct: "-", vs: "+12.9" },
  { name: "Cost of Sales", cy: "3,860.00", cyPct: "-", py1: "3,510.00", py1Pct: "-", py2: "3,160.00", py2Pct: "-", vs: "+13.4" },
];
const marginTotals = { name: "Gross Margin", cy: "3,710.00", cyPct: "49.0", py1: "3,200.00", py1Pct: "47.7", py2: "2,640.00", py2Pct: "45.5", vs: "+15.9" };

/* ── Quarterly data ── */

const quarterlyRows = [
  { period: "Q1", cyRev: "1,780.00", cyCos: "920.00", cyGm: "860.00", cyGmPct: "48.3", py1Gm: "740.00", py1GmPct: "46.8", py2Gm: "610.00", py2GmPct: "44.9" },
  { period: "Q2", cyRev: "1,960.00", cyCos: "980.00", cyGm: "980.00", cyGmPct: "50.0", py1Gm: "840.00", py1GmPct: "48.6", py2Gm: "690.00", py2GmPct: "46.3" },
  { period: "Q3", cyRev: "2,020.00", cyCos: "1,000.00", cyGm: "1,020.00", cyGmPct: "50.5", py1Gm: "870.00", py1GmPct: "48.6", py2Gm: "720.00", py2GmPct: "46.5" },
  { period: "Q4", cyRev: "1,810.00", cyCos: "960.00", cyGm: "850.00", cyGmPct: "47.0", py1Gm: "750.00", py1GmPct: "46.6", py2Gm: "620.00", py2GmPct: "+1044.3.8" },
];
const quarterlyTotals = { period: "Total Full Year", cyRev: "7,570.00", cyCos: "3,860.00", cyGm: "3,710.00", cyGmPct: "49.0", py1Gm: "3,200.00", py1GmPct: "-", py2Gm: "2,640.00", py2GmPct: "-" };

/* ── Monthly data ── */

const monthlyRows = [
  { period: "January", cyRev: "570.00", cyCos: "298.00", cyGm: "272.00", cyGmPct: "47.7", py1Gm: "235.00", py1GmPct: "46.5", py2Gm: "193.00", py2GmPct: "44.4" },
  { period: "February", cyRev: "580.00", cyCos: "300.00", cyGm: "280.00", cyGmPct: "48.3", py1Gm: "241.00", py1GmPct: "46.8", py2Gm: "196.00", py2GmPct: "44.5" },
  { period: "March", cyRev: "630.00", cyCos: "322.00", cyGm: "308.00", cyGmPct: "48.9", py1Gm: "264.00", py1GmPct: "47.1", py2Gm: "221.00", py2GmPct: "45.6" },
  { period: "April", cyRev: "640.00", cyCos: "320.00", cyGm: "320.00", cyGmPct: "50.0", py1Gm: "276.00", py1GmPct: "48.4", py2Gm: "226.00", py2GmPct: "46.1" },
  { period: "May", cyRev: "660.00", cyCos: "330.00", cyGm: "330.00", cyGmPct: "50.0", py1Gm: "282.00", py1GmPct: "48.6", py2Gm: "232.00", py2GmPct: "46.4" },
  { period: "June", cyRev: "660.00", cyCos: "330.00", cyGm: "330.00", cyGmPct: "50.0", py1Gm: "282.00", py1GmPct: "48.6", py2Gm: "232.00", py2GmPct: "46.4" },
  { period: "July", cyRev: "680.00", cyCos: "336.00", cyGm: "344.00", cyGmPct: "50.6", py1Gm: "292.00", py1GmPct: "48.7", py2Gm: "242.00", py2GmPct: "46.5" },
  { period: "September", cyRev: "680.00", cyCos: "336.00", cyGm: "344.00", cyGmPct: "50.6", py1Gm: "292.00", py1GmPct: "48.7", py2Gm: "242.00", py2GmPct: "46.5" },
  { period: "October", cyRev: "660.00", cyCos: "328.00", cyGm: "332.00", cyGmPct: "50.3", py1Gm: "286.00", py1GmPct: "48.5", py2Gm: "236.00", py2GmPct: "46.3" },
  { period: "November", cyRev: "620.00", cyCos: "328.00", cyGm: "292.00", cyGmPct: "47.1", py1Gm: "256.00", py1GmPct: "46.5", py2Gm: "211.00", py2GmPct: "44.4" },
  { period: "December", cyRev: "590.00", cyCos: "314.00", cyGm: "276.00", cyGmPct: "46.8", py1Gm: "249.00", py1GmPct: "46.5", py2Gm: "205.00", py2GmPct: "44.1" },
];
const monthlyTotals = { period: "Total Full Year", cyRev: "7,570.00", cyCos: "3,860.00", cyGm: "3,710.00", cyGmPct: "49.0", py1Gm: "3,200.00", py1GmPct: "-", py2Gm: "2,640.00", py2GmPct: "-" };

const qColsFull = ["Period ↓", "CY Revenue", "CY COS", "CY GM", "CY GM (%)", "PY1 GM", "PY1 GM (%)", "PY2 GM", "PY2 GM (%)"];
const qColsNoPy2 = ["Period ↓", "CY Revenue", "CY COS", "CY GM", "CY GM (%)", "PY1 GM", "PY1 GM (%)"];

type ComparisonView = "cy-py1-py2" | "cy-py1";

const colsFull = ["Account Name ↓", "CY", "CY (%)", "PY1", "PY1 (%)", "PY2", "PY2 (%)", "CY vs PY1 (%)"];
const colsNoPy2 = ["Account Name ↓", "CY", "CY (%)", "PY1", "PY1 (%)", "CY vs PY1 (%)"];

function LukaIcon({ size = 16 }: { size?: number }) {
  return <Zap className="text-white" size={size} fill="white" strokeWidth={0} />;
}

/* ── Comparison View Dropdown ── */
function ComparisonDropdown({
  value,
  onChange,
}: {
  value: ComparisonView;
  onChange: (v: ComparisonView) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const label = value === "cy-py1-py2" ? "CY vs PY1 vs PY2" : "CY vs PY1";
  const options: { key: ComparisonView; label: string }[] = [
    { key: "cy-py1-py2", label: "CY vs PY1 vs PY2" },
    { key: "cy-py1", label: "CY vs PY1" },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "relative flex items-center gap-2 h-10 pl-3 pr-2.5 rounded-[10px] border text-base transition-all duration-200",
          "bg-white border-[#dcdfe4] hover:border-[#074075]",
          "dark:bg-card dark:border-[hsl(220_15%_30%)] dark:hover:border-[#074075]",
          open && "border-[#074075] ring-2 ring-[#074075]/15"
        )}
      >
        <span className="absolute -top-2.5 left-2.5 px-1 bg-white dark:bg-card text-[11px] text-muted-foreground whitespace-nowrap leading-none">
          Select Comparison View*
        </span>
        <span className="font-medium text-foreground whitespace-nowrap">{label}</span>
        <ChevronDown className={cn("h-4 w-4 ml-1 transition-transform duration-200 text-[#074075]", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-50 min-w-[220px] rounded-[10px] border border-[#074075] bg-popover shadow-lg animate-in fade-in zoom-in-95 duration-150">
          <div className="p-1.5">
            {options.map((opt) => (
              <button
                key={opt.key}
                onClick={() => { onChange(opt.key); setOpen(false); }}
                className={cn(
                  "flex items-center justify-between w-full rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                  "hover:bg-primary/[0.08] hover:scale-[1.01]",
                  value === opt.key && "bg-primary/[0.06] font-medium"
                )}
              >
                <span className="text-foreground">{opt.label}</span>
                {value === opt.key && (
                  <Check className="h-4 w-4 shrink-0" style={{ color: "#074075" }} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Annual Table section component ── */
function TableSection({
  title,
  rows,
  totals,
  visible,
  showPy2,
}: {
  title: string;
  rows: typeof revenueRows;
  totals: typeof revenueTotals & { cyPct?: string; py1Pct?: string; py2Pct?: string };
  visible: boolean;
  showPy2: boolean;
}) {
  if (!visible) return null;
  const cols = showPy2 ? colsFull : colsNoPy2;

  return (
    <div className="border border-[hsl(210_25%_82%)] rounded-lg overflow-hidden shadow-sm min-w-0">
      <div className="px-4 py-3 bg-[hsl(210_40%_96%)]">
        <span className="text-base font-semibold text-foreground">{title}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-[hsl(210_25%_82%)] bg-[hsl(210_40%_96%)]">
              {cols.map((c) => (
                <th key={c} className={cn("px-4 py-2.5 font-medium text-[#101D28] whitespace-nowrap", c === "Account Name ↓" ? "text-left" : "text-right")}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-b border-[hsl(210_25%_82%)]/50 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2.5 text-foreground">{r.name}</td>
                <td className="px-4 py-2.5 text-right text-foreground tabular-nums">{r.cy}</td>
                <td className="px-4 py-2.5 text-right text-black tabular-nums">{r.cyPct}</td>
                <td className="px-4 py-2.5 text-right text-foreground tabular-nums">{r.py1}</td>
                <td className="px-4 py-2.5 text-right text-black tabular-nums">{r.py1Pct}</td>
                {showPy2 && <td className="px-4 py-2.5 text-right text-foreground tabular-nums">{r.py2}</td>}
                {showPy2 && <td className="px-4 py-2.5 text-right text-black tabular-nums">{r.py2Pct}</td>}
                <td className="px-4 py-2.5 text-right text-foreground tabular-nums">{r.vs}</td>
              </tr>
            ))}
            <tr className="bg-muted/30 font-semibold">
              <td className="px-4 py-2.5 text-black">{totals.name}</td>
              <td className="px-4 py-2.5 text-right text-black tabular-nums">{totals.cy}</td>
              <td className="px-4 py-2.5 text-right text-black tabular-nums">{totals.cyPct ?? ""}</td>
              <td className="px-4 py-2.5 text-right text-black tabular-nums">{totals.py1}</td>
              <td className="px-4 py-2.5 text-right text-black tabular-nums">{totals.py1Pct ?? ""}</td>
              {showPy2 && <td className="px-4 py-2.5 text-right text-black tabular-nums">{totals.py2}</td>}
              {showPy2 && <td className="px-4 py-2.5 text-right text-black tabular-nums">{totals.py2Pct ?? ""}</td>}
              <td className="px-4 py-2.5 text-right text-black font-semibold tabular-nums">{totals.vs}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Quarterly Table section ── */
function QuarterlyTable({ visible, showPy2 }: { visible: boolean; showPy2: boolean }) {
  if (!visible) return null;
  const cols = showPy2 ? qColsFull : qColsNoPy2;

  return (
    <div className="border border-[hsl(210_25%_82%)] rounded-lg overflow-hidden shadow-sm min-w-0">
      <div className="px-4 py-3 bg-[hsl(210_40%_96%)]">
        <span className="text-base font-semibold text-foreground">Quarterly Breakdown - All Accounts</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-[hsl(210_25%_82%)] bg-[hsl(210_40%_96%)]">
              {cols.map((c) => (
                <th key={c} className={cn("px-4 py-2.5 font-medium text-[#101D28] whitespace-nowrap", c === "Period ↓" ? "text-left" : "text-right")}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quarterlyRows.map((r) => (
              <tr key={r.period} className="border-b border-[hsl(210_25%_82%)]/50 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2.5 text-foreground">{r.period}</td>
                <td className="px-4 py-2.5 text-right text-foreground tabular-nums">{r.cyRev}</td>
                <td className="px-4 py-2.5 text-right text-foreground tabular-nums">{r.cyCos}</td>
                <td className="px-4 py-2.5 text-right text-foreground tabular-nums">{r.cyGm}</td>
                <td className="px-4 py-2.5 text-right text-black tabular-nums">{r.cyGmPct}</td>
                <td className="px-4 py-2.5 text-right text-foreground tabular-nums">{r.py1Gm}</td>
                <td className="px-4 py-2.5 text-right text-black tabular-nums">{r.py1GmPct}</td>
                {showPy2 && <td className="px-4 py-2.5 text-right text-foreground tabular-nums">{r.py2Gm}</td>}
                {showPy2 && <td className="px-4 py-2.5 text-right text-black tabular-nums">{r.py2GmPct}</td>}
              </tr>
            ))}
            <tr className="bg-muted/30 font-semibold">
              <td className="px-4 py-2.5 text-black">{quarterlyTotals.period}</td>
              <td className="px-4 py-2.5 text-right text-black tabular-nums">{quarterlyTotals.cyRev}</td>
              <td className="px-4 py-2.5 text-right text-black tabular-nums">{quarterlyTotals.cyCos}</td>
              <td className="px-4 py-2.5 text-right text-black tabular-nums">{quarterlyTotals.cyGm}</td>
              <td className="px-4 py-2.5 text-right text-black tabular-nums">{quarterlyTotals.cyGmPct}</td>
              <td className="px-4 py-2.5 text-right text-black tabular-nums">{quarterlyTotals.py1Gm}</td>
              <td className="px-4 py-2.5 text-right text-black tabular-nums">{quarterlyTotals.py1GmPct}</td>
              {showPy2 && <td className="px-4 py-2.5 text-right text-black tabular-nums">{quarterlyTotals.py2Gm}</td>}
              {showPy2 && <td className="px-4 py-2.5 text-right text-black tabular-nums">{quarterlyTotals.py2GmPct}</td>}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Monthly Table section ── */
function MonthlyTable({ visible, showPy2 }: { visible: boolean; showPy2: boolean }) {
  if (!visible) return null;
  const cols = showPy2 ? qColsFull : qColsNoPy2;

  return (
    <div className="border border-[hsl(210_25%_82%)] rounded-lg overflow-hidden shadow-sm min-w-0">
      <div className="px-4 py-3 bg-[hsl(210_40%_96%)]">
        <span className="text-base font-semibold text-foreground">Monthly Breakdown - All Accounts</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-[hsl(210_25%_82%)] bg-[hsl(210_40%_96%)]">
              {cols.map((c) => (
                <th key={c} className={cn("px-4 py-2.5 font-medium text-[#101D28] whitespace-nowrap", c === "Period ↓" ? "text-left" : "text-right")}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthlyRows.map((r) => (
              <tr key={r.period} className="border-b border-[hsl(210_25%_82%)]/50 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2.5 text-foreground">{r.period}</td>
                <td className="px-4 py-2.5 text-right text-foreground tabular-nums">{r.cyRev}</td>
                <td className="px-4 py-2.5 text-right text-foreground tabular-nums">{r.cyCos}</td>
                <td className="px-4 py-2.5 text-right text-foreground tabular-nums">{r.cyGm}</td>
                <td className="px-4 py-2.5 text-right text-black tabular-nums">{r.cyGmPct}</td>
                <td className="px-4 py-2.5 text-right text-foreground tabular-nums">{r.py1Gm}</td>
                <td className="px-4 py-2.5 text-right text-black tabular-nums">{r.py1GmPct}</td>
                {showPy2 && <td className="px-4 py-2.5 text-right text-foreground tabular-nums">{r.py2Gm}</td>}
                {showPy2 && <td className="px-4 py-2.5 text-right text-black tabular-nums">{r.py2GmPct}</td>}
              </tr>
            ))}
            <tr className="bg-muted/30 font-semibold">
              <td className="px-4 py-2.5 text-black">{monthlyTotals.period}</td>
              <td className="px-4 py-2.5 text-right text-black tabular-nums">{monthlyTotals.cyRev}</td>
              <td className="px-4 py-2.5 text-right text-black tabular-nums">{monthlyTotals.cyCos}</td>
              <td className="px-4 py-2.5 text-right text-black tabular-nums">{monthlyTotals.cyGm}</td>
              <td className="px-4 py-2.5 text-right text-black tabular-nums">{monthlyTotals.cyGmPct}</td>
              <td className="px-4 py-2.5 text-right text-black tabular-nums">{monthlyTotals.py1Gm}</td>
              <td className="px-4 py-2.5 text-right text-black tabular-nums">{monthlyTotals.py1GmPct}</td>
              {showPy2 && <td className="px-4 py-2.5 text-right text-black tabular-nums">{monthlyTotals.py2Gm}</td>}
              {showPy2 && <td className="px-4 py-2.5 text-right text-black tabular-nums">{monthlyTotals.py2GmPct}</td>}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

const summaryText = `Gross margin has demonstrated a consistent upward trajectory over the three-year period, improving from 45.5% in PY2 to 47.7% in PY1 and reaching 49.0% in the current year — a cumulative improvement of +350 basis points.`;

const keyDrivers = [
  "Revenue growth outpaced COGS growth across all three years. CY revenue grew +12.8% vs PY1, while COGS increased only +10.0%, creating favorable margin expansion.",
  "Product revenue remains the dominant contributor at 63.4% of total revenue, growing +12.9% YoY. This high-margin segment continues to drive overall margin improvement.",
  "Direct labour costs as a percentage of revenue declined from 11.4% (PY2) to 10.3% (CY), suggesting improved operational efficiency and potentially better automation or workforce utilization.",
  "Manufacturing overhead has remained well-controlled at 5.7% of revenue in CY, down from 6.0% in PY2, indicating effective cost management in production processes.",
];

const seasonality = [
  "Q2 and Q3 consistently deliver the strongest margins (50.0% and 50.5% in CY), while Q4 shows mild seasonal pressure at 47.0%. Monthly trends reveal slight softness in January–February, with peak performance in July–August.",
];

const outlook = [
  "The positive margin trend is sustainable if revenue mix continues to favor product sales and operational efficiencies in labour and overhead are maintained. Key risk factors include potential input cost inflation and capacity constraints during peak quarters.",
];

/* ── Luka Summary Component ── */
function LukaSummary({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="border border-border rounded-lg bg-muted/20 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(265_80%_55%)] flex items-center justify-center">
          <LukaIcon size={12} />
        </div>
        <span className="text-base font-semibold text-foreground">Luka Summary</span>
      </div>

      <p className="text-base text-foreground leading-relaxed">{summaryText}</p>

      <div>
        <p className="text-base font-semibold text-foreground mb-2">Key Drivers:</p>
        <ul className="space-y-2 text-base text-foreground leading-relaxed list-disc pl-5">
          {keyDrivers.map((d, i) => <li key={i}>{d}</li>)}
        </ul>
      </div>

      <div>
        <p className="text-base font-semibold text-foreground mb-2">Seasonality:</p>
        <ul className="space-y-2 text-base text-foreground leading-relaxed list-disc pl-5">
          {seasonality.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>

      <div>
        <p className="text-base font-semibold text-foreground mb-2">Outlook:</p>
        <ul className="space-y-2 text-base text-foreground leading-relaxed list-disc pl-5">
          {outlook.map((o, i) => <li key={i}>{o}</li>)}
        </ul>
      </div>
    </div>
  );
}

/* ── Helper: parse number from formatted string ── */
function parseNum(s: string): number {
  return parseFloat(s.replace(/,/g, "")) || 0;
}

/* ── Chart colors ── */
const CHART_COLORS = {
  cy: "#2355A4",
  py1: "#8649F1",
  py2: "#B89AFA",
  cyLine: "#2355A4",
  py1Line: "#8649F1",
  py2Line: "#B89AFA",
};

/* ── Annual Chart ── */
function AnnualChart({ visible, showPy2 }: { visible: boolean; showPy2: boolean }) {
  if (!visible) return null;

  const revenueData = revenueRows.map((r) => ({
    name: r.name,
    CY: parseNum(r.cy),
    PY1: parseNum(r.py1),
    ...(showPy2 ? { PY2: parseNum(r.py2) } : {}),
  }));

  const marginData = [
    { name: "Revenue", CY: parseNum(revenueTotals.cy), PY1: parseNum(revenueTotals.py1), ...(showPy2 ? { PY2: parseNum(revenueTotals.py2) } : {}) },
    { name: "Cost of Sales", CY: parseNum(cosTotals.cy), PY1: parseNum(cosTotals.py1), ...(showPy2 ? { PY2: parseNum(cosTotals.py2) } : {}) },
    { name: "Gross Margin", CY: parseNum(marginTotals.cy), PY1: parseNum(marginTotals.py1), ...(showPy2 ? { PY2: parseNum(marginTotals.py2) } : {}) },
  ];

  const marginPctData = [
    { name: "CY", pct: parseFloat(marginTotals.cyPct || "0") },
    { name: "PY1", pct: parseFloat(marginTotals.py1Pct || "0") },
    ...(showPy2 ? [{ name: "PY2", pct: parseFloat(marginTotals.py2Pct || "0") }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Revenue by Account */}
      <div className="border border-[hsl(210_25%_82%)] rounded-lg overflow-hidden shadow-sm p-4 bg-background">
        <p className="text-sm font-semibold text-foreground mb-3">Revenue by Account</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenueData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 25% 90%)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <RechartsTooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="CY" fill={CHART_COLORS.cy} radius={[4, 4, 0, 0]} />
            <Bar dataKey="PY1" fill={CHART_COLORS.py1} radius={[4, 4, 0, 0]} />
            {showPy2 && <Bar dataKey="PY2" fill={CHART_COLORS.py2} radius={[4, 4, 0, 0]} />}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Margin Comparison */}
      <div className="border border-[hsl(210_25%_82%)] rounded-lg overflow-hidden shadow-sm p-4 bg-background">
        <p className="text-sm font-semibold text-foreground mb-3">Gross Margin Summary</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={marginData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 25% 90%)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <RechartsTooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="CY" fill={CHART_COLORS.cy} radius={[4, 4, 0, 0]} />
            <Bar dataKey="PY1" fill={CHART_COLORS.py1} radius={[4, 4, 0, 0]} />
            {showPy2 && <Bar dataKey="PY2" fill={CHART_COLORS.py2} radius={[4, 4, 0, 0]} />}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Margin % Trend */}
      <div className="border border-[hsl(210_25%_82%)] rounded-lg overflow-hidden shadow-sm p-4 bg-background">
        <p className="text-sm font-semibold text-foreground mb-3">Gross Margin % Trend</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={marginPctData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 25% 90%)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis domain={[40, 52]} tick={{ fontSize: 11 }} unit="%" />
            <RechartsTooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} formatter={(v: any) => `${v}%`} />
            <Bar dataKey="pct" fill={CHART_COLORS.cy} radius={[4, 4, 0, 0]} name="GM %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── Quarterly Chart ── */
function QuarterlyChart({ visible, showPy2 }: { visible: boolean; showPy2: boolean }) {
  if (!visible) return null;

  const data = quarterlyRows.map((r) => ({
    name: r.period,
    "CY GM": parseNum(r.cyGm),
    "PY1 GM": parseNum(r.py1Gm),
    ...(showPy2 ? { "PY2 GM": parseNum(r.py2Gm) } : {}),
    "CY GM%": parseFloat(r.cyGmPct) || 0,
    "PY1 GM%": parseFloat(r.py1GmPct) || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="border border-[hsl(210_25%_82%)] rounded-lg overflow-hidden shadow-sm p-4 bg-background">
        <p className="text-sm font-semibold text-foreground mb-3">Quarterly Gross Margin</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 25% 90%)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <RechartsTooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="CY GM" fill={CHART_COLORS.cy} radius={[4, 4, 0, 0]} />
            <Bar dataKey="PY1 GM" fill={CHART_COLORS.py1} radius={[4, 4, 0, 0]} />
            {showPy2 && <Bar dataKey="PY2 GM" fill={CHART_COLORS.py2} radius={[4, 4, 0, 0]} />}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="border border-[hsl(210_25%_82%)] rounded-lg overflow-hidden shadow-sm p-4 bg-background">
        <p className="text-sm font-semibold text-foreground mb-3">Quarterly GM % Trend</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 25% 90%)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis domain={[44, 52]} tick={{ fontSize: 11 }} unit="%" />
            <RechartsTooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} formatter={(v: any) => `${v}%`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="CY GM%" stroke={CHART_COLORS.cyLine} strokeWidth={2.5} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="PY1 GM%" stroke={CHART_COLORS.py1Line} strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── Monthly Chart ── */
function MonthlyChart({ visible, showPy2 }: { visible: boolean; showPy2: boolean }) {
  if (!visible) return null;

  const data = monthlyRows.map((r) => ({
    name: r.period.slice(0, 3),
    "CY GM": parseNum(r.cyGm),
    "PY1 GM": parseNum(r.py1Gm),
    ...(showPy2 ? { "PY2 GM": parseNum(r.py2Gm) } : {}),
    "CY GM%": parseFloat(r.cyGmPct) || 0,
    "PY1 GM%": parseFloat(r.py1GmPct) || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="border border-[hsl(210_25%_82%)] rounded-lg overflow-hidden shadow-sm p-4 bg-background">
        <p className="text-sm font-semibold text-foreground mb-3">Monthly Gross Margin</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 25% 90%)" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <RechartsTooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="CY GM" fill={CHART_COLORS.cy} radius={[3, 3, 0, 0]} />
            <Bar dataKey="PY1 GM" fill={CHART_COLORS.py1} radius={[3, 3, 0, 0]} />
            {showPy2 && <Bar dataKey="PY2 GM" fill={CHART_COLORS.py2} radius={[3, 3, 0, 0]} />}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="border border-[hsl(210_25%_82%)] rounded-lg overflow-hidden shadow-sm p-4 bg-background">
        <p className="text-sm font-semibold text-foreground mb-3">Monthly GM % Trend</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 25% 90%)" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis domain={[42, 52]} tick={{ fontSize: 11 }} unit="%" />
            <RechartsTooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} formatter={(v: any) => `${v}%`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="CY GM%" stroke={CHART_COLORS.cyLine} strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="PY1 GM%" stroke={CHART_COLORS.py1Line} strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── Main component ── */

export interface GrossMarginResponseProps {
  revealStep: number;
}

export function GrossMarginResponse({ revealStep }: GrossMarginResponseProps) {
  const [periodTab, setPeriodTab] = useState<"annual" | "quarterly" | "monthly">("annual");
  const [comparison, setComparison] = useState<ComparisonView>("cy-py1-py2");
  const [viewMode, setViewMode] = useState<"table" | "graph">("table");
  const showPy2 = comparison === "cy-py1-py2";
  const isGraph = viewMode === "graph";

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Intro text */}
      {revealStep >= 0 && (
        <p className="text-base text-foreground animate-in fade-in duration-300">
          Showing the Gross Margin Analysis with graphical presentation option:
        </p>
      )}

      {/* Period tabs + controls */}
      {revealStep >= 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-300">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Tabs */}
            <div className="flex items-center border border-border rounded-[10px] overflow-hidden">
              {(["annual", "quarterly", "monthly"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPeriodTab(tab)}
                  className={cn(
                    "px-5 py-2 text-base font-medium transition-all duration-200 capitalize relative",
                    "hover:bg-muted/40",
                    periodTab === tab
                      ? "text-foreground font-semibold bg-muted/30"
                      : "text-muted-foreground"
                  )}
                >
                  {tab}
                  {periodTab === tab && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-foreground rounded-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <ComparisonDropdown value={comparison} onChange={setComparison} />
              <TooltipProvider delayDuration={200}>
                <div className="flex items-center gap-1 ml-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className={cn("p-1.5 rounded transition-colors", !isGraph ? "bg-muted/60" : "hover:bg-muted/50")}
                        onClick={() => setViewMode("table")}
                      >
                        <LayoutGrid className={cn("h-4 w-4", !isGraph ? "text-foreground" : "text-muted-foreground")} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>Table View</p></TooltipContent>
                  </Tooltip>
                  <Switch
                    checked={isGraph}
                    onCheckedChange={(checked) => setViewMode(checked ? "graph" : "table")}
                    className="data-[state=checked]:bg-primary"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className={cn("p-1.5 rounded transition-colors", isGraph ? "bg-muted/60" : "hover:bg-muted/50")}
                        onClick={() => setViewMode("graph")}
                      >
                        <BarChart3 className={cn("h-4 w-4", isGraph ? "text-foreground" : "text-muted-foreground")} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>Graph View</p></TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
          </div>

          {/* Tab content with crossfade transition */}
          <div className="relative">
            {/* Annual view */}
            <div
              className={cn(
                "transition-all duration-400 ease-in-out",
                periodTab === "annual"
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2 absolute inset-0 pointer-events-none"
              )}
            >
              {periodTab === "annual" && (
                isGraph ? (
                  <AnnualChart visible={revealStep >= 2} showPy2={showPy2} />
                ) : (
                  <div className="space-y-4">
                    <TableSection title="Revenue Accounts" rows={revenueRows} totals={revenueTotals} visible={revealStep >= 2} showPy2={showPy2} />
                    <TableSection title="Cost of Sales Accounts" rows={cosRows} totals={cosTotals} visible={revealStep >= 3} showPy2={showPy2} />
                    <TableSection title="Gross Margin Summary" rows={marginRows} totals={marginTotals} visible={revealStep >= 4} showPy2={showPy2} />
                  </div>
                )
              )}
            </div>

            {/* Quarterly view */}
            <div
              className={cn(
                "transition-all duration-400 ease-in-out",
                periodTab === "quarterly"
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2 absolute inset-0 pointer-events-none"
              )}
            >
              {periodTab === "quarterly" && (
                isGraph ? (
                  <QuarterlyChart visible={revealStep >= 2} showPy2={showPy2} />
                ) : (
                  <QuarterlyTable visible={revealStep >= 2} showPy2={showPy2} />
                )
              )}
            </div>

            {/* Monthly view */}
            <div
              className={cn(
                "transition-all duration-400 ease-in-out",
                periodTab === "monthly"
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2 absolute inset-0 pointer-events-none"
              )}
            >
              {periodTab === "monthly" && (
                isGraph ? (
                  <MonthlyChart visible={revealStep >= 2} showPy2={showPy2} />
                ) : (
                  <MonthlyTable visible={revealStep >= 2} showPy2={showPy2} />
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Luka Summary – shared across all tabs and views */}
      <LukaSummary visible={revealStep >= 5} />
    </div>
  );
}
