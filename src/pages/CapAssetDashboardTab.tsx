import { Download, TrendingDown, TrendingUp, Package, DollarSign } from 'lucide-react';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { capitalAssets } from '../data/capitalAssetData';
import type { AssetCategory } from '../types/capitalAssetTypes';
import toast from 'react-hot-toast';

function fmt(n: number, d = 2) {
  return n.toLocaleString('en-CA', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtK(n: number) {
  if (n >= 1_000_000) return '$' + fmt(n / 1_000_000, 2) + 'M';
  if (n >= 1_000)     return '$' + fmt(n / 1_000, 1) + 'K';
  return '$' + fmt(n);
}

const CATEGORY_ORDER: AssetCategory[] = [
  'Land', 'Class 6 Buildings', 'Equipment', 'Automotive Equipment',
  'Trailers', 'Class 1 Buildings', 'Computer Equipment',
];

const CATEGORY_COLORS: Record<AssetCategory, string> = {
  'Land':                 '#6366f1',
  'Class 6 Buildings':    '#0ea5e9',
  'Equipment':            '#f59e0b',
  'Automotive Equipment': '#10b981',
  'Trailers':             '#f97316',
  'Class 1 Buildings':    '#8b5cf6',
  'Computer Equipment':   '#ec4899',
};

const SHORT_LABEL: Record<AssetCategory, string> = {
  'Land':                 'Land',
  'Class 6 Buildings':    'Bldg (Cl6)',
  'Equipment':            'Equipment',
  'Automotive Equipment': 'Automotive',
  'Trailers':             'Trailers',
  'Class 1 Buildings':    'Bldg (Cl1)',
  'Computer Equipment':   'Computer',
};

export function CapAssetDashboardTab() {
  const totalCost2023   = capitalAssets.reduce((s, a) => s + a.cost2023,        0);
  const totalAdditions  = capitalAssets.reduce((s, a) => s + a.additions2024,   0);
  const totalDisposals  = capitalAssets.reduce((s, a) => s + a.disposals2024,   0);
  const totalCost2024   = capitalAssets.reduce((s, a) => s + a.cost2024,        0);
  const totalNBV2024    = capitalAssets.reduce((s, a) => s + a.netBookValue2024, 0);
  const totalNBV2023    = capitalAssets.reduce((s, a) => s + a.netBookValue2023, 0);
  const totalAmortExp   = capitalAssets.reduce((s, a) => s + a.amortExpense2024, 0);
  const totalAccumAmort = capitalAssets.reduce((s, a) => s + a.accumAmort2024,  0);
  const totalProceeds   = capitalAssets.reduce((s, a) => s + a.proceedsOnDisposal, 0);
  const totalGainLoss   = capitalAssets.reduce((s, a) => s + a.gainLossOnDisposal, 0);

  const disposedCount = capitalAssets.filter(a => a.isDisposed).length;
  const pctAmort = totalCost2024 > 0 ? (totalAccumAmort / totalCost2024) * 100 : 0;

  // Per-category summary for chart and table
  const categorySummary = CATEGORY_ORDER.map(cat => {
    const assets = capitalAssets.filter(a => a.category === cat);
    return {
      category: cat,
      short: SHORT_LABEL[cat],
      color: CATEGORY_COLORS[cat],
      cost: assets.reduce((s, a) => s + a.cost2024, 0),
      nbv: assets.reduce((s, a) => s + a.netBookValue2024, 0),
      accumAmort: assets.reduce((s, a) => s + a.accumAmort2024, 0),
      amortExp: assets.reduce((s, a) => s + a.amortExpense2024, 0),
      additions: assets.reduce((s, a) => s + a.additions2024, 0),
      disposals: assets.reduce((s, a) => s + a.disposals2024, 0),
      gainLoss: assets.reduce((s, a) => s + a.gainLossOnDisposal, 0),
      count: assets.filter(a => !a.isDisposed).length,
    };
  }).filter(c => c.cost > 0 || c.disposals > 0);

  const chartData = categorySummary.map(c => ({
    name: c.short,
    cost: c.cost,
    nbv: c.nbv,
    color: c.color,
  }));

  const handleExport = async () => {
    try {
      const rows = categorySummary.map(c => ({
        Category: c.category, Assets: c.count,
        'Cost 2024': c.cost, 'Accum Amort': c.accumAmort, 'NBV 2024': c.nbv,
        'Amort Expense': c.amortExp, 'Additions': c.additions, 'Disposals': c.disposals,
        'Gain/(Loss)': c.gainLoss,
      }));
      const { exportToExcel, objsToAOA } = await import('../lib/utils');
      exportToExcel({ 'CA Dashboard': objsToAOA(rows) }, 'CA_Dashboard_Oct312024.xlsx');
      toast.success('Dashboard exported');
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Capital Asset Dashboard</h2>
          <p className="text-xs text-foreground/60 mt-0.5">
            Year end: October 31, 2024 · Summary of all capital asset activity
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Asset Cost',    value: '$' + fmt(totalCost2024),   icon: Package,      color: 'text-foreground'  },
          { label: 'Net Book Value',      value: '$' + fmt(totalNBV2024),    icon: DollarSign,   color: 'text-primary'     },
          { label: 'FY Amort Expense',    value: '$' + fmt(totalAmortExp),   icon: TrendingDown, color: 'text-amber-600'   },
          { label: 'FY Gain on Disposal', value: '+$' + fmt(totalGainLoss),  icon: TrendingUp,   color: 'text-emerald-600' },
        ].map(k => (
          <StyledCard key={k.label} className="p-3 flex items-center gap-3">
            <k.icon className={`w-8 h-8 ${k.color} opacity-75`} />
            <div>
              <div className={`text-sm font-bold tabular-nums ${k.color}`}>{k.value}</div>
              <div className="text-xs text-muted-foreground">{k.label}</div>
            </div>
          </StyledCard>
        ))}
      </div>

      {/* Roll-forward equation */}
      <StyledCard className="p-4">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
          Capital Asset Cost Roll-Forward
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: 'Opening Cost (2023)',  value: '$' + fmt(totalCost2023), color: 'text-foreground' },
            { label: '+ Additions',          value: '+$' + fmt(totalAdditions), color: 'text-primary'   },
            { label: '− Disposals (at cost)', value: '−$' + fmt(totalDisposals), color: 'text-red-500'  },
            { label: '= Closing Cost (2024)', value: '$' + fmt(totalCost2024), color: 'text-foreground font-bold' },
          ].map((item, i) => (
            <div key={item.label} className="flex items-center gap-2">
              {i > 0 && <span className="text-muted-foreground text-lg">→</span>}
              <div className="flex flex-col items-center bg-muted rounded-lg px-4 py-2 min-w-[120px]">
                <span className="text-xs text-muted-foreground whitespace-nowrap">{item.label}</span>
                <span className={`tabular-nums font-mono text-sm ${item.color}`}>{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </StyledCard>

      {/* NBV roll-forward */}
      <StyledCard className="p-4">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
          Net Book Value Roll-Forward
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: 'Opening NBV (2023)',   value: '$' + fmt(totalNBV2023),   color: 'text-foreground' },
            { label: '+ Additions',          value: '+$' + fmt(totalAdditions), color: 'text-primary'   },
            { label: '− Disposals (NBV)',     value: '−$' + fmt(totalDisposals - totalDisposals > 0 ? 0 : 0), color: 'text-red-500' },
            { label: '− Amort Expense',      value: '−$' + fmt(totalAmortExp),  color: 'text-amber-600' },
            { label: '= Closing NBV (2024)', value: '$' + fmt(totalNBV2024),   color: 'text-foreground font-bold' },
          ].map((item, i) => (
            <div key={item.label} className="flex items-center gap-2">
              {i > 0 && <span className="text-muted-foreground text-lg">→</span>}
              <div className="flex flex-col items-center bg-muted rounded-lg px-3 py-2 min-w-[120px]">
                <span className="text-xs text-muted-foreground whitespace-nowrap">{item.label}</span>
                <span className={`tabular-nums font-mono text-sm ${item.color}`}>{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </StyledCard>

      {/* Chart + stats */}
      <div className="grid grid-cols-2 gap-4">
        {/* Bar chart: Cost vs NBV by category */}
        <StyledCard className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Cost vs NBV by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barGap={2} barCategoryGap="30%">
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                tickFormatter={v => fmtK(v)} />
              <Tooltip
                formatter={(value: number, name: string) => ['$' + fmt(value), name === 'cost' ? 'Cost' : 'NBV']}
                contentStyle={{ fontSize: 11, borderRadius: 6 }}
              />
              <Bar dataKey="cost" name="Cost" fill="#e2e8f0" radius={[3, 3, 0, 0]}>
                {chartData.map(entry => (
                  <Cell key={entry.name} fill={entry.color + '40'} />
                ))}
              </Bar>
              <Bar dataKey="nbv" name="NBV" radius={[3, 3, 0, 0]}>
                {chartData.map(entry => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </StyledCard>

        {/* Summary stats */}
        <StyledCard className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Asset Portfolio Summary</h3>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Total active assets',         value: String(capitalAssets.filter(a => !a.isDisposed).length) },
              { label: 'Assets disposed in FY2024',   value: String(disposedCount) },
              { label: 'New additions in FY2024',      value: '$' + fmt(totalAdditions) },
              { label: 'Proceeds on disposals',        value: '$' + fmt(totalProceeds) },
              { label: 'Gain on disposals',            value: '+$' + fmt(totalGainLoss), color: 'text-emerald-600' },
              { label: 'Overall % amortized',          value: fmt(pctAmort, 1) + '%' },
              { label: 'Accum amort to cost ratio',    value: fmt(totalAccumAmort / totalCost2024 * 100, 1) + '%' },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center border-b border-border/50 pb-1.5 last:border-0">
                <span className="text-muted-foreground text-xs">{r.label}</span>
                <span className={`tabular-nums font-mono text-xs font-semibold ${r.color ?? 'text-foreground'}`}>{r.value}</span>
              </div>
            ))}
          </div>
        </StyledCard>
      </div>

      {/* Category breakdown table */}
      <StyledCard className="overflow-hidden p-0">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground">Capital Asset Summary by Category</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase text-foreground">Category</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold uppercase text-foreground">Assets</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Cost 2024</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Additions</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Disposals</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Amort Exp.</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Accum Amort</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">NBV 2024</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">% Amort</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categorySummary.map(c => {
                const pct = c.cost > 0 ? (c.accumAmort / c.cost) * 100 : 0;
                return (
                  <tr key={c.category} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="font-medium text-foreground text-sm">{c.category}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Badge variant="outline" className="text-xs">{c.count}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">${fmt(c.cost)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">
                      {c.additions > 0 ? <span className="text-primary">+${fmt(c.additions)}</span> : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">
                      {c.disposals > 0 ? <span className="text-red-500">${fmt(c.disposals)}</span> : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm text-amber-600">
                      {c.amortExp > 0 ? '$' + fmt(c.amortExp) : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm text-muted-foreground">${fmt(c.accumAmort)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm text-emerald-700">${fmt(c.nbv)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs tabular-nums">{fmt(pct, 0)}%</span>
                        <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary/60" style={{ width: Math.min(pct, 100) + '%' }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/60">
                <td className="px-4 py-2.5 text-xs font-bold">TOTAL</td>
                <td className="px-3 py-2.5 text-center">
                  <Badge variant="outline" className="text-xs">{capitalAssets.filter(a => !a.isDisposed).length}</Badge>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm">${fmt(totalCost2024)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm text-primary">
                  {totalAdditions > 0 ? '+$' + fmt(totalAdditions) : '—'}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm text-red-500">
                  {totalDisposals > 0 ? '$' + fmt(totalDisposals) : '—'}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm text-amber-600">${fmt(totalAmortExp)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm text-muted-foreground">${fmt(totalAccumAmort)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm text-emerald-700">${fmt(totalNBV2024)}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className="text-xs tabular-nums font-bold">{fmt(pctAmort, 0)}%</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </StyledCard>
    </div>
  );
}
