import { useState, useMemo } from 'react';
import { Eye, TrendingUp, Wallet, Pencil, Trash2, Check, X, FilePlus2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { SecuritySchedule } from '@/lib/luka/compute';
import type { LocalInvJE } from './InvAJEsTab';
import { Button } from '@/components/wp-ui/button';
import { fmtCAD, fmtNum, fmtSigned } from './InvHoldingsTab';
import { SearchFilter, ClearFiltersBtn } from './InvTableFilters';
import { CHART_OF_ACCOUNTS } from '@/lib/luka/coa';

interface Props {
  schedules: SecuritySchedule[];
  totals: { realized: number; unrealized: number; cost: number };
  onAddToAJEs?: (je: Omit<LocalInvJE, '_id' | 'status' | 'deleted' | 'deletedAt'>) => void;
}

// Flat disposal row
interface DisposalRow {
  key: string;
  date: string;
  security: string;
  ticker: string;
  unitsOut: number;
  grossProceeds: number;  // proceeds before transaction costs
  fees: number;           // transaction costs deducted from gross (0 if none)
  proceeds: number;       // net proceeds (= grossProceeds − fees)
  costOut: number;        // ACB released
  gl: number;
  tbAccount: string;
}

const IIC = 'input-double-border h-9 text-sm px-3 border border-[#dcdfe4] rounded-[10px] bg-white dark:bg-card text-foreground transition-all duration-200 hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)] focus:outline-none focus:ring-0';

export function InvGainLossTab({ schedules, totals, onAddToAJEs }: Props) {
  const [filterSecurity, setFilterSecurity] = useState("");
  const [hiddenKeys,     setHiddenKeys]     = useState<Set<string>>(new Set());
  const [editId,         setEditId]         = useState<string | null>(null);
  const [editData,       setEditData]       = useState<{ tbAccount?: string }>({});
  // Local overrides persist within the session
  const [tbOverrides, setTbOverrides] = useState<Record<string, string>>({});

  const allRows = useMemo<DisposalRow[]>(
    () =>
      schedules.flatMap((s) =>
        s.rows
          .filter((r) => r.unitsOut > 0)
          .map((r, i) => {
            const gl   = r.realizedGL ?? 0;
            const fees = r.feesCAD    ?? 0;
            const net  = gl + r.costOut;          // net proceeds (after fees)
            return {
              key:          `${s.key}-${i}`,
              date:         r.date,
              security:     s.security,
              ticker:       s.ticker,
              unitsOut:     r.unitsOut,
              grossProceeds: net + fees,           // before transaction costs
              fees,
              proceeds:     net,                   // net proceeds
              costOut:      r.costOut,
              gl,
              tbAccount: gl >= 0 ? '4800' : '4900',
            };
          }),
      ),
    [schedules],
  );

  const visible = useMemo(() => {
    const rows = allRows.filter((r) => !hiddenKeys.has(r.key));
    if (!filterSecurity) return rows;
    const q = filterSecurity.toLowerCase();
    return rows.filter(
      (r) =>
        r.security.toLowerCase().includes(q) ||
        r.ticker.toLowerCase().includes(q),
    );
  }, [allRows, filterSecurity, hiddenKeys]);

  /** Effective TB account for a row (override wins over default) */
  const getTbAccount = (r: DisposalRow) => tbOverrides[r.key] ?? r.tbAccount;

  /** Push a realized G/L AJE to the AJEs queue */
  const pushAJE = (r: DisposalRow) => {
    if (!onAddToAJEs) return;
    const isGain = r.gl >= 0;
    onAddToAJEs({
      ref:          `GLR-${r.ticker}-${r.date.replace(/-/g, '')}`,
      description:  `Realized ${isGain ? 'gain' : 'loss'} — ${r.security} (${r.ticker}) disposal ${r.date}`,
      drAccount:    isGain ? '1010 · Cash & Bank'                    : '4900 · Realized Loss on Investments',
      crAccount:    isGain ? '4800 · Realized Gain on Investments'   : '1010 · Cash & Bank',
      drDescription: isGain ? `Proceeds from disposal of ${r.ticker}` : `Realized loss — ${r.ticker}`,
      crDescription: isGain ? `Realized gain — ${r.ticker}`           : `Proceeds from disposal of ${r.ticker}`,
      amount:    Math.abs(r.gl),
      type:      'Disposition',
      confidence: 'High',
      notes: `Units sold: ${r.unitsOut} | Gross proceeds: ${fmtCAD(r.grossProceeds)} | Trans. costs: ${r.fees > 0 ? fmtCAD(r.fees) : '—'} | ACB released: ${fmtCAD(r.costOut)} | Net G/L: ${fmtSigned(r.gl)}`,
    });
    toast.success(`Disposition AJE queued for ${r.ticker} — review in AJEs tab`);
  };

  /** Display label for a COA code */
  const getTbLabel = (code: string) => {
    const acc = CHART_OF_ACCOUNTS.find((a) => a.code === code);
    return acc ? `${code} · ${acc.name}` : code;
  };

  const saveEdit = (key: string) => {
    if (editData.tbAccount) {
      setTbOverrides((prev) => ({ ...prev, [key]: editData.tbAccount! }));
    }
    setEditId(null);
    toast.success('Row updated');
  };

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Realized Gain / Loss</h2>
          <p className="text-sm text-muted-foreground mt-1">Per-disposal gain/loss using WAC released</p>
        </div>
        {filterSecurity && (
          <ClearFiltersBtn onClick={() => setFilterSecurity("")} />
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs text-muted-foreground">Total Realized G/L</p>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className={`mt-2 text-2xl font-semibold tabular-nums ${totals.realized >= 0 ? "text-foreground" : "text-foreground"}`}>
            {fmtSigned(totals.realized)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">CAD</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs text-muted-foreground">Unrealized G/L</p>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className={`mt-2 text-2xl font-semibold tabular-nums ${totals.unrealized >= 0 ? "text-foreground" : "text-foreground"}`}>
            {fmtSigned(totals.unrealized)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">CAD</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs text-muted-foreground">Carrying Value</p>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{fmtCAD(totals.cost)}</p>
          <p className="text-xs text-muted-foreground mt-1">CAD</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {/* col 1 */ }
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
              {/* col 2 */}
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <SearchFilter label="Security" value={filterSecurity} onChange={setFilterSecurity} placeholder="Ticker or name…" />
              </th>
              {/* col 3 */}
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Units Sold</th>
              {/* col 4 */}
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Gross Proceeds</th>
              {/* col 4b */}
              <th
                className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                title="Transaction costs (commissions/fees) deducted from gross proceeds. Net Proceeds = Gross − Fees."
              >
                Trans. Costs
              </th>
              {/* col 5 */}
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">ACB Released</th>
              {/* col 6 */}
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Realized G/L</th>
              {/* col 7 */}
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">TB Account</th>
              {/* col 8 — AJE push */}
              {onAddToAJEs && (
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">AJE</th>
              )}
              {/* col 9 */}
              <th className="px-3 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr
                key={r.key}
                className={`border-b border-border/50 hover:bg-muted/30 transition-colors${editId === r.key ? ' bg-primary/5' : ''}`}
              >
                {/* col 1 — Date */}
                <td className="px-4 py-3 text-xs">{r.date}</td>
                {/* col 2 — Security */}
                <td className="px-4 py-3 text-sm">
                  <div className="font-medium">{r.security}</div>
                  <div className="text-xs text-muted-foreground font-mono">{r.ticker}</div>
                </td>
                {/* col 3 — Units Sold */}
                <td className="px-4 py-3 text-right tabular-nums">{fmtNum(r.unitsOut, 0)}</td>
                {/* col 4 — Gross Proceeds */}
                <td className="px-4 py-3 text-right tabular-nums">{fmtCAD(r.grossProceeds)}</td>
                {/* col 4b — Transaction Costs */}
                <td className="px-4 py-3 text-right tabular-nums text-xs">
                  {r.fees > 0
                    ? <span className="text-foreground">({fmtCAD(r.fees)})</span>
                    : <span className="text-muted-foreground">—</span>}
                </td>
                {/* col 5 — ACB Released */}
                <td className="px-4 py-3 text-right tabular-nums">{fmtCAD(r.costOut)}</td>
                {/* col 6 — Realized G/L */}
                <td className={`px-4 py-3 text-right tabular-nums font-medium ${r.gl >= 0 ? "text-foreground" : "text-foreground"}`}>
                  {fmtSigned(r.gl)}
                </td>
                {/* col 7 — TB Account (editable) */}
                <td className="px-4 py-3">
                  {editId === r.key ? (
                    <select
                      value={editData.tbAccount ?? getTbAccount(r)}
                      onChange={(e) => setEditData((d) => ({ ...d, tbAccount: e.target.value }))}
                      className={`${IIC} w-[220px] cursor-pointer`}
                    >
                      {CHART_OF_ACCOUNTS.map((a) => (
                        <option key={a.code} value={a.code}>{a.code} · {a.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-muted-foreground">{getTbLabel(getTbAccount(r))}</span>
                  )}
                </td>
                {/* col 8 — AJE push */}
                {onAddToAJEs && (
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => pushAJE(r)}
                      title="Send disposition AJE to AJEs tab"
                    >
                      <FilePlus2 className="h-3 w-3" />
                      → AJE
                    </Button>
                  </td>
                )}
                {/* col 9 — Actions */}
                <td className="px-3 py-3">
                  {editId === r.key ? (
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => saveEdit(r.key)}
                        className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="p-1.5 hover:bg-muted rounded-lg text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => { setEditId(r.key); setEditData({}); }}
                        className="p-1.5 hover:bg-muted rounded-lg text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setHiddenKeys((prev) => { const n = new Set(prev); n.add(r.key); return n; });
                          toast.success('Row hidden');
                        }}
                        className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {visible.length === 0 && (
              <tr>
                <td colSpan={onAddToAJEs ? 10 : 9} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  {filterSecurity ? "No disposals match the security filter." : "No disposals in period."}
                </td>
              </tr>
            )}

            {/* Footer: label spans cols 1–5, total aligns under col 6 (Realized G/L), rest empty */}
            <tr className="bg-muted/40 font-semibold border-t border-border">
              <td colSpan={6} className="px-4 py-3 text-sm text-foreground">Total Realized G/L</td>
              <td className="px-4 py-3 text-right tabular-nums text-foreground">
                {fmtSigned(totals.realized)}
              </td>
              <td colSpan={onAddToAJEs ? 3 : 2} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
