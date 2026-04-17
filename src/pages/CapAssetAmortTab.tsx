import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import { capitalAssets } from '../data/capitalAssetData';
import type { CapitalAsset, AssetCategory } from '../types/capitalAssetTypes';
import toast from 'react-hot-toast';

function fmt(n: number) {
  return n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtC(n: number) { return n === 0 ? '00' : '$' + fmt(n); }

function sum(arr: CapitalAsset[], key: keyof CapitalAsset): number {
  return arr.reduce((s, a) => s + ((a[key] as unknown) as number), 0);
}

const CATEGORY_ORDER: AssetCategory[] = [
  'Land',
  'Class 6 Buildings',
  'Equipment',
  'Automotive Equipment',
  'Trailers',
  'Class 1 Buildings',
  'Computer Equipment',
];

const RATE_BADGE: Record<string, string> = {
  'N/A': 'outline',
  '5%':  'info',
  '10%': 'warning',
  '15%': 'warning',
  '25%': 'destructive',
  '30%': 'destructive',
};

export function CapAssetAmortTab() {
  const [filterCat, setFilterCat] = useState<'All' | AssetCategory>('All');

  // Only depreciable assets
  const depreciable = capitalAssets.filter(a => a.amortRate > 0 && !a.isDisposed);

  const filtered = filterCat === 'All'
    ? depreciable
    : depreciable.filter(a => a.category === filterCat);

  const totalExpense   = sum(filtered, 'amortExpense2024');
  const totalNBVOpen   = sum(filtered, 'netBookValue2023');
  const totalNBVClose  = sum(filtered, 'netBookValue2024');
  const totalAccumOpen = sum(filtered, 'accumAmort2023');
  const totalCost      = sum(filtered, 'cost2024');

  // Fully amortized assets (NBV = 0 or very close)
  const fullyAmortized = depreciable.filter(a => a.netBookValue2024 < 1);

  const handleExport = async () => {
    try {
      const rows = filtered.map(a => ({
        Category: a.category, Description: a.description, 'Date Added': a.dateAdded ?? '',
        Rate: a.amortRate + '%', Method: a.amortMethod, 'Cost 2024': a.cost2024,
        'Accum Amort Opening': a.accumAmort2023, 'NBV Opening': a.netBookValue2023,
        'Amort Expense': a.amortExpense2024, 'Accum Amort Closing': a.accumAmort2024,
        'NBV Closing': a.netBookValue2024, 'GL Account': a.glAccount ?? '',
      }));
      const { exportToExcel, objsToAOA } = await import('../lib/utils');
      exportToExcel({ 'Amortization Schedule': objsToAOA(rows) }, 'CA_Amortization_Oct312024.xlsx');
      toast.success('Amortization schedule exported');
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Amortization Schedule</h2>
          <p className="text-xs text-foreground mt-0.5">
            Year end: October 31, 2024 · Declining balance · Half-year rule on additions
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Depreciable Assets',  value: String(depreciable.length) },
          { label: 'Opening NBV (2023)',   value: '$' + fmt(totalNBVOpen) },
          { label: 'Amort Expense (2024)', value: '$' + fmt(totalExpense) },
          { label: 'Closing NBV (2024)',   value: '$' + fmt(totalNBVClose) },
        ].map(k => (
          <StyledCard key={k.label} className="px-4 py-3">
            <div className="text-sm font-bold tabular-nums text-foreground">{k.value}</div>
            <div className="text-xs text-foreground mt-0.5">{k.label}</div>
          </StyledCard>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-foreground">Category:</span>
        {(['All', ...CATEGORY_ORDER] as const).map(c => (
          <button key={c} onClick={() => setFilterCat(c as typeof filterCat)}
            className={`px-3 py-1 text-xs rounded-md border transition-colors ${
              filterCat === c
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:bg-muted'
            }`}>
            {c}
          </button>
        ))}
      </div>

      {/* Amortization by category */}
      {(filterCat === 'All' ? CATEGORY_ORDER : [filterCat]).map(cat => {
        const catAssets = filtered.filter(a => a.category === cat);
        if (catAssets.length === 0) return null;

        const catCost   = sum(catAssets, 'cost2024');
        const catAAOpen = sum(catAssets, 'accumAmort2023');
        const catNBVOp  = sum(catAssets, 'netBookValue2023');
        const catExp    = sum(catAssets, 'amortExpense2024');
        const catAAClose= sum(catAssets, 'accumAmort2024');
        const catNBVCl  = sum(catAssets, 'netBookValue2024');
        const rate      = catAssets[0]?.amortRate;
        const rateStr   = rate > 0 ? rate + '%' : 'N/A';

        return (
          <StyledCard key={cat} className="overflow-hidden p-0">
            {/* Category header */}
            <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">{cat}</h3>
                <Badge variant={(RATE_BADGE[rateStr] ?? 'outline') as 'outline' | 'info' | 'warning' | 'destructive'} className="text-xs">
                  {rateStr} declining balance
                </Badge>
              </div>
              <div className="text-xs text-foreground tabular-nums">
                {catAssets.length} asset{catAssets.length !== 1 ? 's' : ''} ·
                Expense: <strong>${fmt(catExp)}</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-2 text-xs font-semibold uppercase text-foreground">Description</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Date Added</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Cost 2024</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Accum Amort 2023</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground whitespace-nowrap">NBV Opening</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Amort Exp. 2024</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Accum Amort 2024</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground whitespace-nowrap">NBV Closing</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold uppercase text-foreground">% Amort</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {catAssets.map(a => {
                    const pctAmort = a.cost2024 > 0 ? (a.accumAmort2024 / a.cost2024) * 100 : 100;
                    const isNearlyFull = pctAmort > 95;
                    return (
                      <tr key={a.id} className={`hover:bg-muted/20 transition-colors ${isNearlyFull ? 'opacity-70' : ''}`}>
                        <td className="px-4 py-2">
                          <div className="text-sm font-medium text-foreground">{a.description}</div>
                          {a.notes && <div className="text-xs text-amber-600 mt-0.5">{a.notes}</div>}
                        </td>
                        <td className="px-3 py-2 text-xs text-foreground whitespace-nowrap">{a.dateAdded ?? '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-mono text-sm">{fmtC(a.cost2024)}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-mono text-sm text-foreground">{fmtC(a.accumAmort2023)}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-mono text-sm">{fmtC(a.netBookValue2023)}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-mono text-sm font-medium text-primary">
                          {a.amortExpense2024 > 0 ? '$' + fmt(a.amortExpense2024) : '00'}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-mono text-sm text-foreground">{fmtC(a.accumAmort2024)}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-mono font-semibold text-sm text-emerald-700">{fmtC(a.netBookValue2024)}</td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs tabular-nums">{fmt(pctAmort, )}%</span>
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${isNearlyFull ? 'bg-amber-500' : 'bg-primary'}`}
                                style={{ width: Math.min(pctAmort, 100) + '%' }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/50">
                    <td colSpan={2} className="px-4 py-2 text-xs font-semibold">Subtotal — {catAssets.length} assets</td>
                    <td className="px-3 py-2 text-right tabular-nums font-mono font-bold text-sm">{fmtC(catCost)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-mono text-sm text-foreground">{fmtC(catAAOpen)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-mono font-bold text-sm">{fmtC(catNBVOp)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-mono font-bold text-sm text-primary">${fmt(catExp)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-mono text-sm text-foreground">{fmtC(catAAClose)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-mono font-bold text-sm text-emerald-700">{fmtC(catNBVCl)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </StyledCard>
        );
      })}

      {/* Grand total */}
      <StyledCard className="p-4 bg-primary/5 border-primary/20">
        <div className="grid grid-cols-5 gap-6 text-center">
          {[
            { label: 'Total Asset Cost',     value: '$' + fmt(totalCost) },
            { label: 'Accum Amort (Opening)', value: '$' + fmt(totalAccumOpen) },
            { label: 'Opening NBV',          value: '$' + fmt(totalNBVOpen) },
            { label: 'Amort Expense 2024',   value: '$' + fmt(totalExpense) },
            { label: 'Closing NBV 2024',     value: '$' + fmt(totalNBVClose) },
          ].map(k => (
            <div key={k.label}>
              <div className="text-sm font-bold tabular-nums text-foreground">{k.value}</div>
              <div className="text-xs text-foreground mt-0.5">{k.label}</div>
            </div>
          ))}
        </div>
      </StyledCard>

      {/* Fully / nearly amortized alert */}
      {fullyAmortized.length > 0 && (
        <StyledCard className="p-4 bg-amber-50/60 border-amber-200">
          <div className="text-xs font-semibold text-amber-800 mb-2">
            ⚑ {fullyAmortized.length} asset{fullyAmortized.length !== 1 ? 's' : ''} fully amortized (NBV ≈ $0)
          </div>
          <div className="space-y-0.5">
            {fullyAmortized.map(a => (
              <div key={a.id} className="text-xs text-amber-700">
                {a.category} — {a.description} (cost: ${fmt(a.cost2024)})
              </div>
            ))}
          </div>
        </StyledCard>
      )}
    </div>
  );
}
