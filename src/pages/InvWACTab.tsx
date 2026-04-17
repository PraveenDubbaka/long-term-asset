import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import { wacGroups } from '../data/investmentData';
import { fmtDateDisplay } from '../lib/utils';
import type { WACGroup } from '../types/investmentTypes';
import toast from 'react-hot-toast';

function fmt(n: number, d = 2) { return n.toLocaleString('en-CA', { minimumFractionDigits: d, maximumFractionDigits: d }); }
function fmtLocal(n: number, ccy: string) { return `${ccy === 'CAD' ? '$' : ''}${fmt(n)} ${ccy !== 'CAD' ? ccy : ''}`; }
const CCY_SYMBOL: Record<string, string> = { CAD: '$', USD: 'US$', EUR: '€', GBP: '£' };

const TXN_COLORS: Record<string, string> = {
  Purchase:       'inProgress',
  Sale:           'review',
  'Transfer In':  'info',
  'Transfer Out': 'outline',
  Closing:        'secondary',
  Opening:        'secondary',
};

export function InvWACTab() {
  const [expandedId, setExpandedId] = useState<string | null>(wacGroups[0]?.id ?? null);
  const [filterTicker, setFilterTicker] = useState('All');

  const tickers = ['All', ...Array.from(new Set(wacGroups.map(g => g.ticker))).sort()];
  const filtered = wacGroups.filter(g => filterTicker === 'All' || g.ticker === filterTicker);

  const totalRealizedGL = filtered.reduce((s, g) => s + g.totalRealizedGL, 0);

  const handleExport = async () => {
    try {
      const rows = wacGroups.flatMap(g => [
        { Security: g.security, Ticker: g.ticker, Broker: g.broker, Account: `…${g.acctLast4}`, Currency: g.currency, Date: '', Type: '', UnitsIn: '', UnitsOut: '', Price: '', CostIn: '', CostOut: '', CumulUnits: '', CumulCost: '', WAC: '', RealizedGL: '' },
        ...g.rows.map(r => ({ Security: '', Ticker: '', Broker: '', Account: '', Currency: '', Date: r.date, Type: r.txnType, UnitsIn: r.unitsIn || '', UnitsOut: r.unitsOut || '', Price: r.priceLocal, CostIn: r.costIn || '', CostOut: r.costOut || '', CumulUnits: r.cumulUnits, CumulCost: r.cumulCost, WAC: r.wacPerUnit, RealizedGL: r.realizedGL || '' })),
        { Security: 'TOTAL REALIZED G/L', Ticker: '', Broker: '', Account: '', Currency: g.currency, Date: '', Type: '', UnitsIn: '', UnitsOut: '', Price: '', CostIn: '', CostOut: '', CumulUnits: '', CumulCost: '', WAC: '', RealizedGL: g.totalRealizedGL },
      ]);
      const { exportToExcel, objsToAOA } = await import('../lib/utils');
      exportToExcel({ 'WAC Schedule': objsToAOA(rows) }, 'INV_WAC_Schedule_FY2025.xlsx');
      toast.success('WAC Schedule exported');
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Weighted Average Cost Schedule</h2>
          <p className="text-xs text-foreground mt-0.5">Running WAC per security / broker account · Realized G/L on each disposition</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
      </div>

      {/* Summary strip */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-foreground">Security:</span>
          {tickers.map(t => (
            <button key={t} onClick={() => setFilterTicker(t)}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                filterTicker === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
              }`}>{t}</button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-foreground">Total Realized G/L:</span>
          <Badge variant={totalRealizedGL >= 0 ? 'success' : 'destructive'} className="tabular-nums text-xs">
            {totalRealizedGL >= 0 ? '+' : ''}${fmt(Math.abs(totalRealizedGL))} Local
          </Badge>
        </div>
      </div>

      {/* One card per WAC group */}
      <div className="space-y-3">
        {filtered.map((g: WACGroup) => {
          const isOpen = expandedId === g.id;
          const sym = CCY_SYMBOL[g.currency] ?? '';
          return (
            <StyledCard key={g.id} className="overflow-hidden p-0">
              {/* Group header */}
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                onClick={() => setExpandedId(isOpen ? null : g.id)}
              >
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown className="w-4 h-4 text-foreground" /> : <ChevronRight className="w-4 h-4 text-foreground" />}
                  <div>
                    <span className="font-semibold text-foreground text-sm">{g.security}</span>
                    <span className="text-foreground text-xs ml-2">({g.ticker})</span>
                  </div>
                  <span className="text-xs text-foreground">{g.broker} …{g.acctLast4}</span>
                  <Badge variant="outline" className="text-xs">{g.currency}</Badge>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-xs text-foreground">Closing units:</span>
                  <span className="font-mono tabular-nums text-sm font-semibold">
                    {fmt(g.rows[g.rows.length - 1]?.cumulUnits ?? 0, 0)}
                  </span>
                  <span className="text-xs text-foreground ml-2">Realized G/L:</span>
                  <Badge variant={g.totalRealizedGL > 0 ? 'success' : g.totalRealizedGL < 0 ? 'destructive' : 'outline'} className="text-xs tabular-nums">
                    {g.totalRealizedGL !== 0
                      ? `${g.totalRealizedGL > 0 ? '+' : ''}${sym}${fmt(Math.abs(g.totalRealizedGL))} ${g.currency}`
                      : '00'}
                  </Badge>
                </div>
              </button>

              {/* Rows */}
              {isOpen && (
                <div className="border-t border-border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border">
                        <th className="text-left px-4 py-2 text-xs font-semibold uppercase text-foreground">Date</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold uppercase text-foreground">Type</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground">Units In</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground">Units Out</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Price ({g.currency})</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Cost In</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Cost Out</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Cumul. Units</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Cumul. Cost</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground whitespace-nowrap">WAC / Unit</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Realized G/L</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold uppercase text-foreground">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {g.rows.map(r => (
                        <tr key={r.id} className={`hover:bg-muted/20 ${r.txnType === 'Closing' ? 'bg-muted/30 font-medium' : ''}`}>
                          <td className="px-4 py-2 text-xs text-foreground whitespace-nowrap">{fmtDateDisplay(r.date)}</td>
                          <td className="px-3 py-2">
                            <Badge variant={(TXN_COLORS[r.txnType] ?? 'outline') as Parameters<typeof Badge>[0]['variant']} className="text-xs whitespace-nowrap">
                              {r.txnType}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums font-mono text-sm">{r.unitsIn > 0 ? fmt(r.unitsIn, 0) : '00'}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-mono text-sm">{r.unitsOut > 0 ? fmt(r.unitsOut, 0) : '00'}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-mono text-sm">{fmt(r.priceLocal, 2)}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-mono text-sm">{r.costIn > 0 ? sym + fmt(r.costIn) : '00'}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-mono text-sm">{r.costOut > 0 ? sym + fmt(r.costOut) : '00'}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-mono font-semibold text-sm">{fmt(r.cumulUnits, 0)}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-mono font-semibold text-sm">{sym}{fmt(r.cumulCost)}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-mono text-sm">{fmt(r.wacPerUnit, 4)}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-mono text-sm">
                            {r.realizedGL !== 0
                              ? <span className={r.realizedGL > 0 ? 'text-green-600' : 'text-red-600'}>
                                  {r.realizedGL > 0 ? '+' : ''}{sym}{fmt(Math.abs(r.realizedGL))}
                                </span>
                              : <span className="text-foreground text-xs">—</span>}
                          </td>
                          <td className="px-3 py-2 text-xs text-foreground">{r.notes ?? ''}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-muted/50">
                        <td colSpan={10} className="px-4 py-2 text-xs font-semibold text-foreground">
                          Total Realized G/L — {g.ticker} ({g.broker.split(' ')[0]} …{g.acctLast4})
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-mono font-bold text-sm">
                          {g.totalRealizedGL !== 0
                            ? <span className={g.totalRealizedGL > 0 ? 'text-green-600' : 'text-red-600'}>
                                {g.totalRealizedGL > 0 ? '+' : ''}{sym}{fmt(Math.abs(g.totalRealizedGL))}
                              </span>
                            : <span className="text-foreground">—</span>}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </StyledCard>
          );
        })}
      </div>
    </div>
  );
}
