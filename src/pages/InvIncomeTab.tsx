import { useState, useMemo } from 'react';
import { Badge } from '@/components/wp-ui/badge';
import {
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent,
} from '@/components/wp-ui/tooltip';
import { formatTbAccount } from '@/lib/luka/coa';
import type { IncomeMatrixRow } from '@/lib/luka/compute';
import type { IncomeType } from '@/lib/luka/types';
import { fmtNum, fmtCcy, fmtSigned } from './InvHoldingsTab';
import { ColFilter, SearchFilter, ClearFiltersBtn } from './InvTableFilters';

interface Props {
  incomeMatrix: {
    rows: IncomeMatrixRow[];
    totals: Record<IncomeType, number>;
    tbMap: Record<IncomeType, string>;
  };
}

const INCOME_COLS:  IncomeType[] = ["Dividend", "Interest", "Other"];
const EXPENSE_COLS: IncomeType[] = ["Withholding Tax", "Fees"];
const INCOME_TYPES: IncomeType[] = [...INCOME_COLS, ...EXPENSE_COLS];
const CCY_OPTIONS = ["CAD", "USD", "EUR", "GBP"];

/** Returns border classes that bracket the expense group with dividers on both sides */
function groupBorder(k: IncomeType) {
  if (k === EXPENSE_COLS[0])                          return 'border-l-2 border-border';
  if (k === EXPENSE_COLS[EXPENSE_COLS.length - 1])    return 'border-r-2 border-border';
  return '';
}

export function InvIncomeTab({ incomeMatrix }: Props) {
  const [filterSecurity, setFilterSecurity] = useState("");
  const [filterCcy,      setFilterCcy]      = useState("");

  const anyFilter = filterSecurity || filterCcy;

  const uniqueCcys = useMemo(
    () => Array.from(new Set(incomeMatrix.rows.map((r) => r.ccy))).sort(),
    [incomeMatrix.rows],
  );

  const visible = useMemo(() => {
    let rows = incomeMatrix.rows;
    if (filterSecurity)
      rows = rows.filter(
        (r) =>
          r.security.toLowerCase().includes(filterSecurity.toLowerCase()) ||
          r.ticker.toLowerCase().includes(filterSecurity.toLowerCase()),
      );
    if (filterCcy) rows = rows.filter((r) => r.ccy === filterCcy);
    return rows;
  }, [incomeMatrix.rows, filterSecurity, filterCcy]);

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Income &amp; Expenses</h2>
          <p className="text-sm text-muted-foreground mt-1">
            By security × income type · all amounts in CAD · TB mapping per income type
          </p>
        </div>
        {anyFilter && (
          <ClearFiltersBtn onClick={() => { setFilterSecurity(""); setFilterCcy(""); }} />
        )}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <SearchFilter label="Security" value={filterSecurity} onChange={setFilterSecurity} placeholder="Ticker or name…" />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <ColFilter label="CCY" options={uniqueCcys.length ? uniqueCcys : CCY_OPTIONS} value={filterCcy} onChange={setFilterCcy} />
              </th>
              {INCOME_TYPES.map((k) => (
                <th key={k} className={`text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${groupBorder(k)}`}>{k}</th>
              ))}
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total (CAD)</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.ticker} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-sm">
                  <div className="font-medium">{r.security}</div>
                  <div className="text-xs text-muted-foreground font-mono">{r.ticker}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs font-mono">{r.ccy}</Badge>
                </td>
                {INCOME_TYPES.map((k) => {
                  const c = r.cells[k];
                  if (!c) return <td key={k} className={`px-4 py-3 text-right tabular-nums text-xs ${groupBorder(k)}`}>{fmtNum(0)}</td>;
                  return (
                    <td key={k} className={`px-4 py-3 text-right tabular-nums text-xs ${groupBorder(k)}`}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help text-foreground">
                              {fmtCcy(c.cad, "CAD")}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">Foreign: {fmtCcy(c.foreign, c.ccy)}</div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                  );
                })}
                <td className={`px-4 py-3 text-right tabular-nums font-medium ${r.totalCAD >= 0 ? "text-foreground" : "text-foreground"}`}>
                  {fmtSigned(r.totalCAD)}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={2 + INCOME_TYPES.length + 1} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No rows match the active filters.
                </td>
              </tr>
            )}
            {/* Totals row */}
            <tr className="bg-muted/40 font-semibold border-b border-border/50">
              <td className="px-4 py-3 text-sm">Totals</td>
              <td />
              {INCOME_TYPES.map((k) => (
                <td key={k} className={`px-4 py-3 text-right tabular-nums text-foreground ${groupBorder(k)}`}>
                  {fmtSigned(incomeMatrix.totals[k])}
                </td>
              ))}
              <td className="px-4 py-3 text-right tabular-nums">
                {fmtSigned(Object.values(incomeMatrix.totals).reduce((a, b) => a + b, 0))}
              </td>
            </tr>
            {/* TB Account row */}
            <tr className="bg-muted/20 text-xs">
              <td className="px-4 py-3 text-muted-foreground">TB Account →</td>
              <td />
              {INCOME_TYPES.map((k) => (
                <td key={k} className={`px-4 py-3 text-right text-muted-foreground ${groupBorder(k)}`}>
                  {formatTbAccount(incomeMatrix.tbMap[k])}
                </td>
              ))}
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
