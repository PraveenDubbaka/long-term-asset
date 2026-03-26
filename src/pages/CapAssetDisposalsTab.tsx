import { Download, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import { capitalAssets } from '../data/capitalAssetData';
import toast from 'react-hot-toast';

function fmt(n: number) {
  return n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CapAssetDisposalsTab() {
  // All assets with disposals (cost of disposal > 0)
  const disposed = capitalAssets.filter(a => a.disposals2024 > 0 || a.isDisposed);

  const totalCost       = disposed.reduce((s, a) => s + a.disposals2024, 0);
  const totalAccumAmort = disposed.reduce((s, a) => s + a.amortReductions2024, 0);
  const totalCarrying   = disposed.reduce((s, a) => s + (a.disposals2024 - a.amortReductions2024), 0);
  const totalProceeds   = disposed.reduce((s, a) => s + a.proceedsOnDisposal, 0);
  const totalGainLoss   = disposed.reduce((s, a) => s + a.gainLossOnDisposal, 0);

  const handleExport = async () => {
    try {
      const rows = disposed.map(a => ({
        Description: a.description, Category: a.category, 'Date Added': a.dateAdded ?? '',
        'Cost of Disposal': a.disposals2024, 'Accum Amort at Disposal': a.amortReductions2024,
        'Carrying Amount': a.disposals2024 - a.amortReductions2024,
        'Proceeds on Sale': a.proceedsOnDisposal, 'Gain / (Loss)': a.gainLossOnDisposal,
        'WP Ref': a.wpRef ?? '', Notes: a.notes ?? '',
      }));
      const { exportToExcel, objsToAOA } = await import('../lib/utils');
      exportToExcel({ 'Disposals Schedule': objsToAOA(rows) }, 'CA_Disposals_Oct312024.xlsx');
      toast.success('Disposals schedule exported');
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Disposals Schedule</h2>
          <p className="text-xs text-foreground mt-0.5">
            Year end: October 31, 2024 · Capital asset disposals and gain / (loss) on disposal
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Assets Disposed',      value: String(disposed.length) },
          { label: 'Total Cost Disposed',  value: '$' + fmt(totalCost) },
          { label: 'Total Proceeds',       value: '$' + fmt(totalProceeds) },
          {
            label: 'Total Gain / (Loss)',
            value: (totalGainLoss >= 0 ? '+$' : '($') + fmt(Math.abs(totalGainLoss)) + (totalGainLoss < 0 ? ')' : ''),
            color: totalGainLoss >= 0 ? 'text-emerald-600' : 'text-red-600',
          },
        ].map(k => (
          <StyledCard key={k.label} className="px-4 py-3">
            <div className={`text-sm font-bold tabular-nums ${k.color ?? 'text-foreground'}`}>{k.value}</div>
            <div className="text-xs text-foreground mt-0.5">{k.label}</div>
          </StyledCard>
        ))}
      </div>

      {/* Disposals table */}
      <StyledCard className="overflow-hidden p-0">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground">Disposal Register — FY October 31, 2024</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-foreground">Description</th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase text-foreground">Category</th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Date Added</th>
                <th className="text-right px-3 py-3 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Original Cost</th>
                <th className="text-right px-3 py-3 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Accum Amort</th>
                <th className="text-right px-3 py-3 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Carrying Amt</th>
                <th className="text-right px-3 py-3 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Proceeds</th>
                <th className="text-right px-3 py-3 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Gain / (Loss)</th>
                <th className="text-center px-3 py-3 text-xs font-semibold uppercase text-foreground">WP Ref</th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase text-foreground">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {disposed.map(a => {
                const carrying = a.disposals2024 - a.amortReductions2024;
                const gl = a.gainLossOnDisposal;
                return (
                  <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{a.description}</div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="outline" className="text-xs">{a.category}</Badge>
                    </td>
                    <td className="px-3 py-3 text-xs text-foreground whitespace-nowrap">{a.dateAdded ?? '—'}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-mono text-sm">${fmt(a.disposals2024)}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-mono text-sm text-foreground">${fmt(a.amortReductions2024)}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-mono text-sm">${fmt(carrying)}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-mono text-sm">${fmt(a.proceedsOnDisposal)}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-mono text-sm font-semibold">
                      <span className={gl > 0 ? 'text-emerald-600' : gl < 0 ? 'text-red-600' : 'text-foreground'}>
                        {gl > 0 ? '+$' + fmt(gl) : gl < 0 ? '($' + fmt(-gl) + ')' : '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {a.wpRef
                        ? <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{a.wpRef}</span>
                        : <span className="text-foreground text-xs">—</span>}
                    </td>
                    <td className="px-3 py-3 max-w-[220px]">
                      {a.notes
                        ? <div className="flex items-start gap-1.5 text-xs text-amber-700">
                            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{a.notes}</span>
                          </div>
                        : <span className="text-foreground text-xs">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/60">
                <td colSpan={3} className="px-4 py-2.5 text-xs font-semibold">
                  Total — {disposed.length} disposal{disposed.length !== 1 ? 's' : ''}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm">${fmt(totalCost)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm text-foreground">${fmt(totalAccumAmort)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm">${fmt(totalCarrying)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm">${fmt(totalProceeds)}</td>
                <td className={`px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm ${totalGainLoss > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {totalGainLoss > 0 ? '+$' + fmt(totalGainLoss) : '($' + fmt(-totalGainLoss) + ')'}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </StyledCard>

      {/* Disposal accounting proof */}
      <StyledCard className="p-4">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
          Disposal Accounting Proof
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-foreground">Original cost of disposed assets:</span>
              <span className="tabular-nums font-mono">${fmt(totalCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">Less: accumulated amortization:</span>
              <span className="tabular-nums font-mono text-foreground">({fmt(totalAccumAmort)})</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1 font-semibold">
              <span>Carrying amount at disposal:</span>
              <span className="tabular-nums font-mono">${fmt(totalCarrying)}</span>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-foreground">Proceeds on disposal:</span>
              <span className="tabular-nums font-mono">${fmt(totalProceeds)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">Less: carrying amount:</span>
              <span className="tabular-nums font-mono text-foreground">({fmt(totalCarrying)})</span>
            </div>
            <div className={`flex justify-between border-t border-border pt-1 font-semibold ${totalGainLoss > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              <span>Gain / (Loss) on disposal:</span>
              <span className="tabular-nums font-mono">
                {totalGainLoss >= 0 ? '+$' : '($'}{fmt(Math.abs(totalGainLoss))}{totalGainLoss < 0 ? ')' : ''}
              </span>
            </div>
          </div>
        </div>
      </StyledCard>
    </div>
  );
}
