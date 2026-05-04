import { useState, useMemo } from 'react';
import { Eye, TrendingUp, Wallet } from 'lucide-react';
import type { SecuritySchedule } from '@/lib/luka/compute';
import { fmtCAD, fmtNum, fmtSigned } from './InvHoldingsTab';
import { SearchFilter, ClearFiltersBtn } from './InvTableFilters';

interface Props {
  schedules: SecuritySchedule[];
  totals: { realized: number; unrealized: number; cost: number };
}

// Flat disposal row
interface DisposalRow {
  key: string;
  date: string;
  security: string;
  ticker: string;
  unitsOut: number;
  proceeds: number;
  costOut: number;
  gl: number;
}

export function InvGainLossTab({ schedules, totals }: Props) {
  const [filterSecurity, setFilterSecurity] = useState("");

  const allRows = useMemo<DisposalRow[]>(
    () =>
      schedules.flatMap((s) =>
        s.rows
          .filter((r) => r.unitsOut > 0)
          .map((r, i) => ({
            key: `${s.key}-${i}`,
            date: r.date,
            security: s.security,
            ticker: s.ticker,
            unitsOut: r.unitsOut,
            proceeds: (r.realizedGL ?? 0) + r.costOut,
            costOut: r.costOut,
            gl: r.realizedGL ?? 0,
          })),
      ),
    [schedules],
  );

  const visible = useMemo(() => {
    if (!filterSecurity) return allRows;
    return allRows.filter(
      (r) =>
        r.security.toLowerCase().includes(filterSecurity.toLowerCase()) ||
        r.ticker.toLowerCase().includes(filterSecurity.toLowerCase()),
    );
  }, [allRows, filterSecurity]);

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
          <p className={`mt-2 text-2xl font-semibold tabular-nums ${totals.realized >= 0 ? "text-green-600" : "text-destructive"}`}>
            {fmtSigned(totals.realized)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">CAD</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs text-muted-foreground">Unrealized G/L</p>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className={`mt-2 text-2xl font-semibold tabular-nums ${totals.unrealized >= 0 ? "text-green-600" : "text-destructive"}`}>
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
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <SearchFilter label="Security" value={filterSecurity} onChange={setFilterSecurity} placeholder="Ticker or name…" />
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Units Sold</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Proceeds (CAD)</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">ACB Released</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Realized G/L</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">TB Account</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.key} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-xs">{r.date}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="font-medium">{r.security}</div>
                  <div className="text-xs text-muted-foreground font-mono">{r.ticker}</div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtNum(r.unitsOut, 0)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtCAD(r.proceeds)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtCAD(r.costOut)}</td>
                <td className={`px-4 py-3 text-right tabular-nums ${r.gl >= 0 ? "text-green-600" : "text-destructive"}`}>
                  {fmtSigned(r.gl)}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {r.gl >= 0 ? "4800 · Realized Gain" : "4900 · Realized Loss"}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  {filterSecurity ? "No disposals match the security filter." : "No disposals in period."}
                </td>
              </tr>
            )}
            <tr className="bg-muted/40 font-semibold">
              <td colSpan={5} className="px-4 py-3 text-sm">Total Realized G/L</td>
              <td className={`px-4 py-3 text-right tabular-nums ${totals.realized >= 0 ? "text-green-600" : "text-destructive"}`}>
                {fmtSigned(totals.realized)}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
