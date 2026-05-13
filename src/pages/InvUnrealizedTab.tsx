import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart2, Send, Info } from 'lucide-react';
import { Badge } from '@/components/wp-ui/badge';
import type { SecuritySchedule } from '@/lib/luka/compute';
import type { LocalInvJE } from './InvAJEsTab';
import { fmtCAD, fmtNum, fmtSigned } from './InvHoldingsTab';
import { SearchFilter, ClearFiltersBtn } from './InvTableFilters';
import toast from 'react-hot-toast';

interface Props {
  schedules: SecuritySchedule[];
  measurementBasis: 'Cost' | 'FVTPL';
  onAddToAJEs?: (je: Omit<LocalInvJE, '_id' | 'status' | 'deleted' | 'deletedAt'>) => void;
}

export function InvUnrealizedTab({ schedules, measurementBasis, onAddToAJEs }: Props) {
  const [filterSecurity, setFilterSecurity] = useState('');

  const isFVTPL = measurementBasis === 'FVTPL';

  // Only open positions
  const positions = useMemo(
    () => schedules.filter((s) => s.closingUnits > 0),
    [schedules],
  );

  const visible = useMemo(() => {
    if (!filterSecurity) return positions;
    const q = filterSecurity.toLowerCase();
    return positions.filter(
      (s) =>
        s.security.toLowerCase().includes(q) ||
        s.ticker.toLowerCase().includes(q),
    );
  }, [positions, filterSecurity]);

  const totals = useMemo(
    () => ({
      cost: positions.reduce((a, s) => a + s.closingCostCAD, 0),
      fmv:  positions.reduce((a, s) => a + s.fmvCAD, 0),
      gl:   positions.reduce((a, s) => a + s.unrealizedGL, 0),
    }),
    [positions],
  );

  const handleSuggestAJE = (s: SecuritySchedule) => {
    if (!onAddToAJEs) return;
    const v      = s.unrealizedGL;
    const isGain = v >= 0;
    onAddToAJEs({
      ref:          `FVA-${s.ticker}`,
      description:  `Fair value adjustment — ${s.security} (${s.ticker})`,
      drAccount:    isGain
        ? '1310 · Investments at Fair Value'
        : '4701 · Unrealized Loss on Investments',
      crAccount:    isGain
        ? '4700 · Unrealized Gain on Investments'
        : '1310 · Investments at Fair Value',
      drDescription: isGain
        ? `Increase carrying value of ${s.ticker} to FMV`
        : `Recognize unrealized loss — ${s.ticker}`,
      crDescription: isGain
        ? `Unrealized gain — ${s.ticker} fair value adjustment`
        : `Reduce carrying value of ${s.ticker} to FMV`,
      amount:    Math.abs(v),
      type:      'Fair Value Adj',
      confidence: 'High',
      notes: `Cost basis: ${fmtCAD(s.closingCostCAD)} | FMV: ${fmtCAD(s.fmvCAD)} | Unrealized ${isGain ? 'gain' : 'loss'}: ${fmtSigned(v)} | Measurement: FVTPL`,
    });
    toast.success(`FV AJE queued for ${s.ticker} — review in AJEs tab`);
  };

  return (
    <div className="px-6 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Unrealized Gain / Loss</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Closing cost vs. FMV per position ·{' '}
            <span className={isFVTPL ? 'text-primary font-medium' : ''}>
              {isFVTPL ? 'Fair Value Through P&L (FVTPL)' : 'Cost method — disclosure only'}
            </span>
          </p>
        </div>
        {filterSecurity && <ClearFiltersBtn onClick={() => setFilterSecurity('')} />}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs text-muted-foreground">Total Cost (CAD)</p>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{fmtCAD(totals.cost)}</p>
          <p className="text-xs text-muted-foreground mt-1">Closing WAC cost basis</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs text-muted-foreground">Total FMV (CAD)</p>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{fmtCAD(totals.fmv)}</p>
          <p className="text-xs text-muted-foreground mt-1">At quoted closing prices</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs text-muted-foreground">Unrealized G/L (CAD)</p>
            {totals.gl >= 0
              ? <TrendingUp className="h-4 w-4 text-muted-foreground" />
              : <TrendingDown className="h-4 w-4 text-muted-foreground" />}
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
            {fmtSigned(totals.gl)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isFVTPL ? 'Recorded through P&L' : 'Disclosure only — cost method'}
          </p>
        </div>
      </div>

      {/* Cost-method notice */}
      {!isFVTPL && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Cost method selected.</span> Unrealized G/L is for disclosure purposes only — no journal entries are generated.
            Switch to <strong>Fair Value (FVTPL)</strong> in Settings to enable AJE suggestions.
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <SearchFilter label="Security" value={filterSecurity} onChange={setFilterSecurity} placeholder="Ticker or name…" />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">CCY</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Units</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">WAC</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Cost (CAD)</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">FMV (CAD)</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Unrealized G/L</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">%</th>
              <th className="px-3 py-3 w-16 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => {
              const pct    = s.closingCostCAD !== 0 ? (s.unrealizedGL / s.closingCostCAD) * 100 : 0;
              const isGain = s.unrealizedGL >= 0;
              const hasVariance = Math.abs(s.unrealizedGL) > 1;
              return (
                <tr key={s.key} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium">{s.security}</div>
                    <div className="text-xs text-muted-foreground font-mono">{s.ticker}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs font-mono">{s.currency}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">{fmtNum(s.closingUnits, 4)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">{fmtNum(s.closingWac)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">{fmtCAD(s.closingCostCAD)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">{fmtCAD(s.fmvCAD)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {fmtSigned(s.unrealizedGL)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">
                    <span className={`${isGain ? 'text-green-700' : 'text-destructive'} font-medium`}>
                      {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-0.5">
                      {isFVTPL && hasVariance && (
                        <button
                          onClick={() => handleSuggestAJE(s)}
                          title="Send fair value AJE to AJEs tab"
                          className="p-1.5 hover:bg-primary/10 rounded-lg text-primary"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-6 text-center text-sm text-muted-foreground"
                >
                  {filterSecurity ? 'No positions match the filter.' : 'No open positions.'}
                </td>
              </tr>
            )}

            {/* Totals */}
            <tr className="bg-muted/40 font-semibold border-t border-border">
              <td className="px-4 py-3 text-sm" colSpan={4}>Totals</td>
              <td className="px-4 py-3 text-right tabular-nums">{fmtCAD(totals.cost)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{fmtCAD(totals.fmv)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{fmtSigned(totals.gl)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-xs">
                {totals.cost !== 0 ? (
                  <span className={totals.gl >= 0 ? 'text-green-700' : 'text-destructive'}>
                    {((totals.gl / totals.cost) * 100).toFixed(1)}%
                  </span>
                ) : '—'}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
