import { useState, useMemo } from 'react';
import { Badge } from '@/components/wp-ui/badge';
import type { SecuritySchedule, ComputeOptions } from '@/lib/luka/compute';
import { fmtCAD, fmtNum } from './InvHoldingsTab';
import { ColFilter, SearchFilter, ClearFiltersBtn } from './InvTableFilters';

interface Props {
  schedules: SecuritySchedule[];
  opts: ComputeOptions;
}

export function InvWACTab({ schedules, opts }: Props) {
  // Card-level filter: narrow which securities are shown
  const [filterSecurity, setFilterSecurity] = useState("");
  // Per-card row-level filter: narrow by type within each security card
  const [filterType, setFilterType] = useState("");

  const anyFilter = filterSecurity || filterType;

  const uniqueTypes = useMemo(
    () => Array.from(new Set(schedules.flatMap((s) => s.rows.map((r) => r.type)))).sort(),
    [schedules],
  );

  const visibleSchedules = useMemo(() => {
    if (!filterSecurity) return schedules;
    return schedules.filter(
      (s) =>
        s.security.toLowerCase().includes(filterSecurity.toLowerCase()) ||
        s.ticker.toLowerCase().includes(filterSecurity.toLowerCase()),
    );
  }, [schedules, filterSecurity]);

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">WAC Schedule (Cost &amp; FMV)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Weighted-average cost roll-forward · Pool: {opts.trackByBroker ? "Per broker" : "Blended"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {anyFilter && (
            <ClearFiltersBtn onClick={() => { setFilterSecurity(""); setFilterType(""); }} />
          )}
          {/* Top-level security search */}
          <div className="relative">
            <SearchFilter
              label="Filter security"
              value={filterSecurity}
              onChange={setFilterSecurity}
              placeholder="Ticker or name…"
            />
          </div>
        </div>
      </div>

      {visibleSchedules.map((s) => {
        const rows = filterType ? s.rows.filter((r) => r.type === filterType) : s.rows;
        return (
          <div key={s.key} className="rounded-xl border border-border bg-card">
            <div className="p-4 flex items-center justify-between flex-wrap gap-3 border-b border-border">
              <div>
                <div className="font-semibold">
                  {s.security}{" "}
                  <span className="text-muted-foreground font-normal font-mono text-sm">{s.ticker}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Source(s): {s.sourceIds.join(", ")} · CCY {s.currency}
                </div>
              </div>
              <div className="flex gap-4 text-xs">
                <div><span className="text-muted-foreground">Closing units </span><span className="font-mono font-medium">{fmtNum(s.closingUnits, 4)}</span></div>
                <div><span className="text-muted-foreground">WAC </span><span className="font-mono font-medium">{fmtCAD(s.closingWac)}</span></div>
                <div><span className="text-muted-foreground">FMV </span><span className="font-mono font-medium">{fmtCAD(s.fmvCAD)}</span></div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      <ColFilter
                        label="Type"
                        options={uniqueTypes}
                        value={filterType}
                        onChange={setFilterType}
                      />
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Units In</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Units Out</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cost In</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cost Out</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cum Units</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cum Cost</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">WAC</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-xs whitespace-nowrap">{r.date}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{r.type}</Badge></td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs">{r.unitsIn ? fmtNum(r.unitsIn, 4) : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs">{r.unitsOut ? fmtNum(r.unitsOut, 4) : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs">{r.costIn ? fmtCAD(r.costIn) : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs">{r.costOut ? fmtCAD(r.costOut) : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs font-medium">{fmtNum(r.cumUnits, 4)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs font-medium">{fmtCAD(r.cumCost)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs">{fmtCAD(r.wac)}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-4 text-center text-xs text-muted-foreground">
                        No rows match the active type filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {visibleSchedules.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {filterSecurity
            ? "No securities match the search."
            : "No schedules — enable prior-year file or add transactions."}
        </div>
      )}
    </div>
  );
}
