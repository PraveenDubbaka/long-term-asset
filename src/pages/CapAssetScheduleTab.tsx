import React, { useState } from 'react';
import { Download, ChevronDown, ChevronRight } from 'lucide-react';
import { useTableColumns, ColumnToggleButton, useColumnResize, ThResizable, type ColDef } from '@/components/table-utils';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import { capitalAssets } from '../data/capitalAssetData';
import type { CapitalAsset, AssetCategory } from '../types/capitalAssetTypes';
import toast from 'react-hot-toast';

function fmt(n: number) {
  return n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtC(n: number) { return n === 0 ? '—' : '$' + fmt(n); }
function fmtPos(n: number) { return n > 0 ? '$' + fmt(n) : '—'; }
function fmtGL(n: number) {
  if (n === 0) return '—';
  return n > 0 ? '+$' + fmt(n) : '($' + fmt(-n) + ')';
}

function sum(arr: CapitalAsset[], key: keyof CapitalAsset): number {
  return arr.reduce((s, a) => s + ((a[key] as unknown) as number), 0);
}

function getTotals(assets: CapitalAsset[]) {
  return {
    cost2023:            sum(assets, 'cost2023'),
    additions2024:       sum(assets, 'additions2024'),
    disposals2024:       sum(assets, 'disposals2024'),
    cost2024:            sum(assets, 'cost2024'),
    proceeds:            sum(assets, 'proceedsOnDisposal'),
    gainLoss:            sum(assets, 'gainLossOnDisposal'),
    accumAmort2023:      sum(assets, 'accumAmort2023'),
    amortReductions:     sum(assets, 'amortReductions2024'),
    adjOpeningAmort:     sum(assets, 'adjustedOpeningAmort'),
    amortExpense:        sum(assets, 'amortExpense2024'),
    accumAmort2024:      sum(assets, 'accumAmort2024'),
    nbv2024:             sum(assets, 'netBookValue2024'),
    nbv2023:             sum(assets, 'netBookValue2023'),
  };
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

const CATEGORY_CFG: Record<AssetCategory, { rate: string; note?: string }> = {
  'Land':                 { rate: 'N/A' },
  'Class 6 Buildings':    { rate: '5%',  note: 'All farm buildings are class 6 on T2S8' },
  'Equipment':            { rate: '10%' },
  'Automotive Equipment': { rate: '15%' },
  'Trailers':             { rate: '25%' },
  'Class 1 Buildings':    { rate: '5%',  note: 'Separated for client AgExpert G/L reconciliation purposes' },
  'Computer Equipment':   { rate: '30%', note: 'CCA rate is 55%; half = 27%, rounded up to 30%' },
};

const TH = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
  <th className={`px-2 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap ${right ? 'text-right' : 'text-left'}`}>
    {children}
  </th>
);

const TD = ({ children, right, bold, muted, mono }: {
  children: React.ReactNode; right?: boolean; bold?: boolean; muted?: boolean; mono?: boolean;
}) => (
  <td className={`px-2 py-1.5 text-xs ${right ? 'text-right' : 'text-left'} ${bold ? 'font-semibold' : ''} ${muted ? 'text-muted-foreground' : ''} ${mono ? 'tabular-nums font-mono' : ''}`}>
    {children}
  </td>
);

type CapColId =
  | 'description' | 'dateAdded' | 'cost2023' | 'additions' | 'disposals' | 'cost2024'
  | 'proceeds' | 'gainLoss' | 'aa2023' | 'reductions' | 'adjOpen' | 'rate' | 'proRate'
  | 'amortExp' | 'aa2024' | 'nbv2024' | 'nbv2023' | 'wpRef';

const CAP_COLS: ColDef<CapColId>[] = [
  { id: 'description', label: 'Description',     pinned: true },
  { id: 'dateAdded',   label: 'Date Added' },
  { id: 'cost2023',    label: 'Cost 2023' },
  { id: 'additions',   label: 'Additions' },
  { id: 'disposals',   label: 'Disposals' },
  { id: 'cost2024',    label: 'Cost 2024' },
  { id: 'proceeds',    label: 'Proceeds' },
  { id: 'gainLoss',    label: 'G / (L)' },
  { id: 'aa2023',      label: 'AA 2023' },
  { id: 'reductions',  label: 'Reductions' },
  { id: 'adjOpen',     label: 'Adj. Open.' },
  { id: 'rate',        label: 'Rate' },
  { id: 'proRate',     label: 'Pro-rate' },
  { id: 'amortExp',    label: 'Amort Exp.' },
  { id: 'aa2024',      label: 'AA 2024' },
  { id: 'nbv2024',     label: 'NBV 2024' },
  { id: 'nbv2023',     label: 'NBV 2023',        defaultVisible: false },
  { id: 'wpRef',       label: 'WP Ref' },
];

export function CapAssetScheduleTab() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(CATEGORY_ORDER));

  const { isVisible: capVisible, toggle: capToggle, setWidth: capSetWidth, getWidth: capGetWidth, visibleCount: capVisCount } = useTableColumns('cap-asset-schedule', CAP_COLS);
  const { onResizeStart: capResizeStart } = useColumnResize(capSetWidth);
  const cph = (id: CapColId) => (e: React.MouseEvent) => capResizeStart(id, e, capGetWidth(id) ?? 100);

  const toggle = (cat: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });

  const grand = getTotals(capitalAssets);

  const handleExport = async () => {
    try {
      const rows = capitalAssets.map(a => ({
        Category: a.category, Description: a.description, 'Date Added': a.dateAdded ?? '',
        'Cost 2023': a.cost2023, 'Additions': a.additions2024, 'Disposals': a.disposals2024,
        'Cost 2024': a.cost2024, 'Proceeds': a.proceedsOnDisposal, 'Gain/(Loss)': a.gainLossOnDisposal,
        'Accum Amort 2023': a.accumAmort2023, 'Reductions': a.amortReductions2024,
        'Adj. Opening Amort': a.adjustedOpeningAmort, 'Rate %': a.amortRate, 'Pro-rate': a.proRateMonths,
        'Amort Expense 2024': a.amortExpense2024, 'Accum Amort 2024': a.accumAmort2024,
        'NBV 2024': a.netBookValue2024, 'NBV 2023': a.netBookValue2023, 'WP Ref': a.wpRef ?? '',
      }));
      const { exportToExcel, objsToAOA } = await import('../lib/utils');
      exportToExcel({ 'Capital Asset Schedule': objsToAOA(rows) }, 'CA_Schedule_Oct312024.xlsx');
      toast.success('Schedule exported');
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Capital Asset Schedule</h2>
          <p className="text-xs text-foreground/60 mt-0.5">
            Year end: October 31, 2024 · Declining balance method · Half-year rule on additions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <ColumnToggleButton columns={CAP_COLS} isVisible={capVisible} onToggle={capToggle} />
        </div>
      </div>

      {/* Global amortization options banner */}
      <StyledCard className="px-4 py-2 bg-amber-50/60 border-amber-200">
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Global amortization options:</strong> Reporting period set to 365 / 365 days = 100% of
          normal amortization. Half year amortization is calculated on all additions. Declining balance
          method applies to all depreciable assets.
        </p>
      </StyledCard>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Asset Cost', value: '$' + fmt(grand.cost2024) },
          { label: 'FY Additions',     value: grand.additions2024 > 0 ? '$' + fmt(grand.additions2024) : '—' },
          { label: 'Net Book Value',   value: '$' + fmt(grand.nbv2024) },
          { label: 'Amort Expense',    value: '$' + fmt(grand.amortExpense) },
        ].map(k => (
          <StyledCard key={k.label} className="px-4 py-3">
            <div className="text-sm font-bold tabular-nums text-foreground">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
          </StyledCard>
        ))}
      </div>

      {/* Main schedule table */}
      <StyledCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="text-xs" style={{ minWidth: 1600 }}>
            <thead>
              <tr className="border-b-2 border-border bg-muted/60">
                <ThResizable colId="description" width={capGetWidth('description')} onResizeStart={cph('description')} className="px-2 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide text-left whitespace-nowrap">Description</ThResizable>
                {capVisible('dateAdded') && <ThResizable colId="dateAdded" width={capGetWidth('dateAdded')} onResizeStart={cph('dateAdded')} className="px-2 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide text-left whitespace-nowrap">Date Added</ThResizable>}
                {/* Cost section */}
                {capVisible('cost2023') && <ThResizable colId="cost2023" width={capGetWidth('cost2023')} onResizeStart={cph('cost2023')} className="px-2 py-2.5 text-xs font-semibold text-primary uppercase tracking-wide text-right whitespace-nowrap border-l border-border">Cost 2023</ThResizable>}
                {capVisible('additions') && <ThResizable colId="additions" width={capGetWidth('additions')} onResizeStart={cph('additions')} className="px-2 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide text-right whitespace-nowrap">Additions</ThResizable>}
                {capVisible('disposals') && <ThResizable colId="disposals" width={capGetWidth('disposals')} onResizeStart={cph('disposals')} className="px-2 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide text-right whitespace-nowrap">Disposals</ThResizable>}
                {capVisible('cost2024') && <ThResizable colId="cost2024" width={capGetWidth('cost2024')} onResizeStart={cph('cost2024')} className="px-2 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide text-right whitespace-nowrap">Cost 2024</ThResizable>}
                {/* Disposal section */}
                {capVisible('proceeds') && <ThResizable colId="proceeds" width={capGetWidth('proceeds')} onResizeStart={cph('proceeds')} className="px-2 py-2.5 text-xs font-semibold text-orange-600 uppercase tracking-wide text-right whitespace-nowrap border-l border-border">Proceeds</ThResizable>}
                {capVisible('gainLoss') && <ThResizable colId="gainLoss" width={capGetWidth('gainLoss')} onResizeStart={cph('gainLoss')} className="px-2 py-2.5 text-xs font-semibold text-orange-600 uppercase tracking-wide text-right whitespace-nowrap">G / (L)</ThResizable>}
                {/* Amortization section */}
                {capVisible('aa2023') && <ThResizable colId="aa2023" width={capGetWidth('aa2023')} onResizeStart={cph('aa2023')} className="px-2 py-2.5 text-xs font-semibold text-violet-600 uppercase tracking-wide text-right whitespace-nowrap border-l border-border">AA 2023</ThResizable>}
                {capVisible('reductions') && <ThResizable colId="reductions" width={capGetWidth('reductions')} onResizeStart={cph('reductions')} className="px-2 py-2.5 text-xs font-semibold text-violet-600 uppercase tracking-wide text-right whitespace-nowrap">Reductions</ThResizable>}
                {capVisible('adjOpen') && <ThResizable colId="adjOpen" width={capGetWidth('adjOpen')} onResizeStart={cph('adjOpen')} className="px-2 py-2.5 text-xs font-semibold text-violet-600 uppercase tracking-wide text-right whitespace-nowrap">Adj. Open.</ThResizable>}
                {capVisible('rate') && <ThResizable colId="rate" width={capGetWidth('rate')} onResizeStart={cph('rate')} className="px-2 py-2.5 text-xs font-semibold text-violet-600 uppercase tracking-wide text-center whitespace-nowrap">Rate</ThResizable>}
                {capVisible('proRate') && <ThResizable colId="proRate" width={capGetWidth('proRate')} onResizeStart={cph('proRate')} className="px-2 py-2.5 text-xs font-semibold text-violet-600 uppercase tracking-wide text-center whitespace-nowrap">Pro-rate</ThResizable>}
                {capVisible('amortExp') && <ThResizable colId="amortExp" width={capGetWidth('amortExp')} onResizeStart={cph('amortExp')} className="px-2 py-2.5 text-xs font-semibold text-violet-600 uppercase tracking-wide text-right whitespace-nowrap">Amort Exp.</ThResizable>}
                {capVisible('aa2024') && <ThResizable colId="aa2024" width={capGetWidth('aa2024')} onResizeStart={cph('aa2024')} className="px-2 py-2.5 text-xs font-semibold text-violet-600 uppercase tracking-wide text-right whitespace-nowrap">AA 2024</ThResizable>}
                {/* NBV section */}
                {capVisible('nbv2024') && <ThResizable colId="nbv2024" width={capGetWidth('nbv2024')} onResizeStart={cph('nbv2024')} className="px-2 py-2.5 text-xs font-semibold text-emerald-700 uppercase tracking-wide text-right whitespace-nowrap border-l border-border">NBV 2024</ThResizable>}
                {capVisible('nbv2023') && <ThResizable colId="nbv2023" width={capGetWidth('nbv2023')} onResizeStart={cph('nbv2023')} className="px-2 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right whitespace-nowrap">NBV 2023</ThResizable>}
                {capVisible('wpRef') && <ThResizable colId="wpRef" width={capGetWidth('wpRef')} onResizeStart={cph('wpRef')} className="px-2 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide text-left whitespace-nowrap">WP Ref</ThResizable>}
              </tr>
            </thead>
            <tbody>
            {CATEGORY_ORDER.map(cat => {
                const assets = capitalAssets.filter(a => a.category === cat);
                const isOpen = expanded.has(cat);
                const t = getTotals(assets);
                const cfg = CATEGORY_CFG[cat];

                return (
                  <React.Fragment key={cat}>
                    {/* Category header */}
                    <tr
                      className="bg-muted/40 border-y border-border cursor-pointer select-none hover:bg-muted/60 transition-colors"
                      onClick={() => toggle(cat)}
                    >
                      <td colSpan={capVisCount} className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {isOpen
                            ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                          <span className="font-semibold text-sm text-foreground">{cat}</span>
                          <span className="text-muted-foreground text-xs hidden xl:inline">
                            CCA class: N/A · Rate method: Declining balance · Rate unit: % ·
                            Group rate: {cfg.rate} · Group pro-rate: 12/12 months · Half normal amortization: Yes
                          </span>
                          {cfg.note && (
                            <Badge variant="outline" className="text-xs hidden 2xl:inline-flex">{cfg.note}</Badge>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Asset rows */}
                    {isOpen && assets.map(a => (
                      <tr
                        key={a.id}
                        className={`border-b border-border transition-colors ${
                          a.isDisposed
                            ? 'opacity-60 bg-rose-50/20'
                            : 'hover:bg-muted/20'
                        }`}
                      >
                        <td className="px-3 py-1.5 max-w-[220px]">
                          <div className="truncate font-medium text-foreground">{a.description}</div>
                          {a.notes && <div className="text-xs text-amber-600 truncate mt-0.5">{a.notes}</div>}
                        </td>
                        {capVisible('dateAdded') && <TD muted>{a.dateAdded ?? '—'}</TD>}
                        {/* Cost */}
                        {capVisible('cost2023') && <td className="px-2 py-1.5 text-right tabular-nums font-mono border-l border-border/40 text-xs">{fmtC(a.cost2023)}</td>}
                        {capVisible('additions') && <TD right mono>{fmtPos(a.additions2024)}</TD>}
                        {capVisible('disposals') && <TD right mono>{fmtPos(a.disposals2024)}</TD>}
                        {capVisible('cost2024') && <TD right mono bold>{fmtC(a.cost2024)}</TD>}
                        {/* Disposal */}
                        {capVisible('proceeds') && <td className="px-2 py-1.5 text-right tabular-nums font-mono border-l border-border/40 text-xs">{fmtPos(a.proceedsOnDisposal)}</td>}
                        {capVisible('gainLoss') && (
                          <td className={`px-2 py-1.5 text-right tabular-nums font-mono text-xs ${a.gainLossOnDisposal > 0 ? 'text-emerald-600' : a.gainLossOnDisposal < 0 ? 'text-red-600' : ''}`}>
                            {fmtGL(a.gainLossOnDisposal)}
                          </td>
                        )}
                        {/* Amort */}
                        {capVisible('aa2023') && <td className="px-2 py-1.5 text-right tabular-nums font-mono border-l border-border/40 text-xs">{fmtC(a.accumAmort2023)}</td>}
                        {capVisible('reductions') && <TD right mono>{fmtPos(a.amortReductions2024)}</TD>}
                        {capVisible('adjOpen') && <TD right mono>{fmtC(a.adjustedOpeningAmort)}</TD>}
                        {capVisible('rate') && <td className="px-2 py-1.5 text-center text-xs">{a.amortRate > 0 ? a.amortRate + '%' : 'N/A'}</td>}
                        {capVisible('proRate') && <td className="px-2 py-1.5 text-center text-xs text-muted-foreground">{a.amortRate > 0 ? a.proRateMonths : '—'}</td>}
                        {capVisible('amortExp') && <TD right mono>{fmtPos(a.amortExpense2024)}</TD>}
                        {capVisible('aa2024') && <TD right mono>{fmtC(a.accumAmort2024)}</TD>}
                        {/* NBV */}
                        {capVisible('nbv2024') && <td className="px-2 py-1.5 text-right tabular-nums font-mono font-bold text-xs text-emerald-700 border-l border-border/40">{fmtC(a.netBookValue2024)}</td>}
                        {capVisible('nbv2023') && <TD right mono muted>{fmtC(a.netBookValue2023)}</TD>}
                        {capVisible('wpRef') && (
                          <td className="px-2 py-1.5 text-xs">
                            {a.wpRef
                              ? <span className="font-mono bg-muted px-1 py-0.5 rounded text-xs">{a.wpRef}</span>
                              : <span className="text-muted-foreground">—</span>}
                          </td>
                        )}
                      </tr>
                    ))}

                    {/* Subtotal row */}
                    <tr className="border-b-2 border-border bg-muted/50 font-semibold">
                      <td className="px-3 py-2 text-xs font-semibold">Subtotal</td>
                      {capVisible('dateAdded') && <td />}
                      {capVisible('cost2023') && <td className="px-2 py-2 text-right tabular-nums font-mono text-xs border-l border-border/40">${fmt(t.cost2023)}</td>}
                      {capVisible('additions') && <td className="px-2 py-2 text-right tabular-nums font-mono text-xs">{t.additions2024 > 0 ? '$' + fmt(t.additions2024) : '—'}</td>}
                      {capVisible('disposals') && <td className="px-2 py-2 text-right tabular-nums font-mono text-xs">{t.disposals2024 > 0 ? '$' + fmt(t.disposals2024) : '—'}</td>}
                      {capVisible('cost2024') && <td className="px-2 py-2 text-right tabular-nums font-mono text-xs font-bold">${fmt(t.cost2024)}</td>}
                      {capVisible('proceeds') && <td className="px-2 py-2 text-right tabular-nums font-mono text-xs border-l border-border/40">{t.proceeds > 0 ? '$' + fmt(t.proceeds) : '—'}</td>}
                      {capVisible('gainLoss') && <td className={`px-2 py-2 text-right tabular-nums font-mono text-xs ${t.gainLoss > 0 ? 'text-emerald-600' : ''}`}>{t.gainLoss > 0 ? '+$' + fmt(t.gainLoss) : '—'}</td>}
                      {capVisible('aa2023') && <td className="px-2 py-2 text-right tabular-nums font-mono text-xs border-l border-border/40">${fmt(t.accumAmort2023)}</td>}
                      {capVisible('reductions') && <td className="px-2 py-2 text-right tabular-nums font-mono text-xs">{t.amortReductions > 0 ? '$' + fmt(t.amortReductions) : '—'}</td>}
                      {capVisible('adjOpen') && <td className="px-2 py-2 text-right tabular-nums font-mono text-xs">${fmt(t.adjOpeningAmort)}</td>}
                      {capVisible('rate') && <td />}
                      {capVisible('proRate') && <td />}
                      {capVisible('amortExp') && <td className="px-2 py-2 text-right tabular-nums font-mono text-xs">{t.amortExpense > 0 ? '$' + fmt(t.amortExpense) : '—'}</td>}
                      {capVisible('aa2024') && <td className="px-2 py-2 text-right tabular-nums font-mono text-xs">${fmt(t.accumAmort2024)}</td>}
                      {capVisible('nbv2024') && <td className="px-2 py-2 text-right tabular-nums font-mono text-xs font-bold text-emerald-700 border-l border-border/40">${fmt(t.nbv2024)}</td>}
                      {capVisible('nbv2023') && <td className="px-2 py-2 text-right tabular-nums font-mono text-xs text-muted-foreground">${fmt(t.nbv2023)}</td>}
                      {capVisible('wpRef') && <td />}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>

            {/* Grand Total */}
            <tfoot>
              <tr className="border-t-2 border-primary/30 bg-primary/5">
                <td className="px-3 py-2.5 text-sm font-bold text-foreground">GRAND TOTALS</td>
                {capVisible('dateAdded') && <td />}
                {capVisible('cost2023') && <td className="px-2 py-2.5 text-right tabular-nums font-mono text-xs font-bold border-l border-border/40">${fmt(grand.cost2023)}</td>}
                {capVisible('additions') && <td className="px-2 py-2.5 text-right tabular-nums font-mono text-xs font-bold">{grand.additions2024 > 0 ? '$' + fmt(grand.additions2024) : '—'}</td>}
                {capVisible('disposals') && <td className="px-2 py-2.5 text-right tabular-nums font-mono text-xs font-bold">{grand.disposals2024 > 0 ? '$' + fmt(grand.disposals2024) : '—'}</td>}
                {capVisible('cost2024') && <td className="px-2 py-2.5 text-right tabular-nums font-mono text-xs font-bold">${fmt(grand.cost2024)}</td>}
                {capVisible('proceeds') && <td className="px-2 py-2.5 text-right tabular-nums font-mono text-xs font-bold border-l border-border/40">{grand.proceeds > 0 ? '$' + fmt(grand.proceeds) : '—'}</td>}
                {capVisible('gainLoss') && (
                  <td className={`px-2 py-2.5 text-right tabular-nums font-mono text-xs font-bold ${grand.gainLoss > 0 ? 'text-emerald-600' : ''}`}>
                    {grand.gainLoss > 0 ? '+$' + fmt(grand.gainLoss) : '—'}
                  </td>
                )}
                {capVisible('aa2023') && <td className="px-2 py-2.5 text-right tabular-nums font-mono text-xs font-bold border-l border-border/40">${fmt(grand.accumAmort2023)}</td>}
                {capVisible('reductions') && <td className="px-2 py-2.5 text-right tabular-nums font-mono text-xs font-bold">{grand.amortReductions > 0 ? '$' + fmt(grand.amortReductions) : '—'}</td>}
                {capVisible('adjOpen') && <td className="px-2 py-2.5 text-right tabular-nums font-mono text-xs font-bold">${fmt(grand.adjOpeningAmort)}</td>}
                {capVisible('rate') && <td />}
                {capVisible('proRate') && <td />}
                {capVisible('amortExp') && <td className="px-2 py-2.5 text-right tabular-nums font-mono text-xs font-bold">${fmt(grand.amortExpense)}</td>}
                {capVisible('aa2024') && <td className="px-2 py-2.5 text-right tabular-nums font-mono text-xs font-bold">${fmt(grand.accumAmort2024)}</td>}
                {capVisible('nbv2024') && <td className="px-2 py-2.5 text-right tabular-nums font-mono text-sm font-bold text-emerald-700 border-l border-border/40">${fmt(grand.nbv2024)}</td>}
                {capVisible('nbv2023') && <td className="px-2 py-2.5 text-right tabular-nums font-mono text-xs font-bold text-muted-foreground">${fmt(grand.nbv2023)}</td>}
                {capVisible('wpRef') && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      </StyledCard>

      <p className="text-xs text-muted-foreground italic">
        See BULK I for capital asset opening balances. All farm buildings are class 6 on T2S8.
        Class 1 buildings separated for client AgExpert G/L reconciliation purposes.
      </p>
    </div>
  );
}
