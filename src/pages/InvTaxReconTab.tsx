import { useState, useMemo } from 'react';
import { AlertTriangle, Pencil, Check, X, Plus, Trash2, Info } from 'lucide-react';
import { Badge } from '@/components/wp-ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/wp-ui/tooltip';
import type { SecuritySchedule } from '@/lib/luka/compute';
import { fmtCAD, fmtNum, fmtSigned } from './InvHoldingsTab';
import { fmtDate } from '../lib/utils';
import { SearchFilter, ClearFiltersBtn } from './InvTableFilters';
import toast from 'react-hot-toast';

interface Props {
  schedules: SecuritySchedule[];
}

type AdjType = 'None' | 'Superficial Loss' | 'ACB Adjustment' | 'Other';

interface TaxRow {
  key: string;
  date: string;
  security: string;
  ticker: string;
  unitsOut: number;
  proceeds: number;   // net proceeds (CAD)
  bookACB: number;    // ACB released per WAC
  bookGL: number;
}

interface TaxOverride {
  taxACB: number;
  adjType: AdjType;
  notes: string;
}

const ADJ_TYPES: AdjType[] = ['None', 'Superficial Loss', 'ACB Adjustment', 'Other'];

const IIC = 'h-7 text-xs px-2 border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary';

export function InvTaxReconTab({ schedules }: Props) {
  const [filterSecurity, setFilterSecurity] = useState('');
  const [overrides, setOverrides]           = useState<Record<string, TaxOverride>>({});
  const [editKey, setEditKey]               = useState<string | null>(null);
  const [editData, setEditData]             = useState<Partial<TaxOverride>>({});
  const [hiddenKeys, setHiddenKeys]         = useState<Set<string>>(new Set());

  // ── Build flat disposal rows ────────────────────────────────────────
  const allRows = useMemo<TaxRow[]>(
    () =>
      schedules.flatMap((s) =>
        s.rows
          .filter((r) => r.unitsOut > 0)
          .map((r, i) => {
            const bookGL  = r.realizedGL ?? 0;
            const fees    = r.feesCAD ?? 0;
            const net     = bookGL + r.costOut;
            return {
              key:      `${s.key}-${i}`,
              date:     r.date,
              security: s.security,
              ticker:   s.ticker,
              unitsOut: r.unitsOut,
              proceeds: net,
              bookACB:  r.costOut,
              bookGL,
            };
          }),
      ),
    [schedules],
  );

  // ── Effective tax ACB & G/L per row ────────────────────────────────
  const getOverride = (key: string): TaxOverride =>
    overrides[key] ?? { taxACB: allRows.find(r => r.key === key)?.bookACB ?? 0, adjType: 'None', notes: '' };

  const getTaxGL   = (r: TaxRow) => r.proceeds - (overrides[r.key]?.taxACB ?? r.bookACB);
  const getDiff    = (r: TaxRow) => getTaxGL(r) - r.bookGL;

  // ── Superficial loss detection (loss + same ticker bought ≤30 days) ─
  const superficialFlags = useMemo(() => {
    const flags = new Set<string>();
    for (const row of allRows) {
      if (row.bookGL >= 0) continue;
      const dispDate = new Date(row.date).getTime();
      const hasBuyNearby = schedules
        .find(s => s.ticker === row.ticker)
        ?.rows.some(r => {
          if (!r.unitsIn || r.unitsIn <= 0) return false;
          const d = new Date(r.date).getTime();
          const diff = Math.abs(d - dispDate) / 86_400_000;
          return diff <= 30 && d !== dispDate;
        }) ?? false;
      if (hasBuyNearby) flags.add(row.key);
    }
    return flags;
  }, [allRows, schedules]);

  // ── Filtered visible rows ───────────────────────────────────────────
  const visible = useMemo(() => {
    let rows = allRows.filter(r => !hiddenKeys.has(r.key));
    if (!filterSecurity) return rows;
    const q = filterSecurity.toLowerCase();
    return rows.filter(r =>
      r.security.toLowerCase().includes(q) || r.ticker.toLowerCase().includes(q),
    );
  }, [allRows, filterSecurity, hiddenKeys]);

  // ── Totals ──────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const all = allRows.filter(r => !hiddenKeys.has(r.key));
    return {
      bookGL:  all.reduce((a, r) => a + r.bookGL, 0),
      taxGL:   all.reduce((a, r) => a + getTaxGL(r), 0),
      diff:    all.reduce((a, r) => a + getDiff(r), 0),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRows, overrides, hiddenKeys]);

  // ── Edit helpers ────────────────────────────────────────────────────
  const startEdit = (key: string) => {
    const ov = getOverride(key);
    setEditKey(key);
    setEditData({ ...ov });
  };
  const saveEdit = (key: string) => {
    const base = getOverride(key);
    setOverrides(prev => ({ ...prev, [key]: { ...base, ...editData } as TaxOverride }));
    setEditKey(null);
    toast.success('Tax override saved');
  };

  return (
    <div className="px-6 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Tax Reconciliation</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Book vs. tax capital gains — adjust ACB for superficial losses, ACB elections, and other tax differences
          </p>
        </div>
        {filterSecurity && <ClearFiltersBtn onClick={() => setFilterSecurity('')} />}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Book Capital G/L</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{fmtSigned(totals.bookGL)}</p>
          <p className="text-xs text-muted-foreground mt-1">CAD</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Tax Capital G/L</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{fmtSigned(totals.taxGL)}</p>
          <p className="text-xs text-muted-foreground mt-1">CAD</p>
        </div>
        <div className={`rounded-xl border bg-card p-4 shadow-sm ${Math.abs(totals.diff) > 0.005 ? 'border-amber-300 dark:border-amber-700' : 'border-border'}`}>
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-muted-foreground">Book-to-Tax Difference</p>
            {Math.abs(totals.diff) > 0.005 && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{fmtSigned(totals.diff)}</p>
          <p className="text-xs text-muted-foreground mt-1">CAD</p>
        </div>
      </div>

      {/* Superficial loss banner */}
      {superficialFlags.size > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
          <div>
            <span className="font-semibold">{superficialFlags.size} potential superficial loss{superficialFlags.size > 1 ? 'es' : ''} detected.</span>
            {' '}A purchase of the same security occurred within 30 days of the disposal.
            Review the flagged rows and adjust the Tax ACB where applicable.
          </div>
        </div>
      )}

      {/* Main table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <SearchFilter label="Security" value={filterSecurity} onChange={setFilterSecurity} placeholder="Ticker or name…" />
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Units Sold</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Proceeds</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Book ACB</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Book G/L</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <span className="flex items-center justify-end gap-1">
                  Tax ACB
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px] text-xs">
                      Override the ACB used for tax purposes (e.g. superficial loss add-back, ACB election).
                    </TooltipContent>
                  </Tooltip>
                </span>
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tax G/L</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Difference</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Adj. Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</th>
              <th className="px-3 py-3 w-16 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Act.</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const ov      = getOverride(r.key);
              const taxACB  = editKey === r.key ? (editData.taxACB ?? ov.taxACB) : ov.taxACB;
              const taxGL   = r.proceeds - taxACB;
              const diff    = taxGL - r.bookGL;
              const isSupfl = superficialFlags.has(r.key);
              const isEditing = editKey === r.key;

              return (
                <tr
                  key={r.key}
                  className={`border-b border-border/50 hover:bg-muted/30 transition-colors${isEditing ? ' bg-primary/5' : ''}`}
                >
                  {/* Date */}
                  <td className="px-4 py-3 text-xs whitespace-nowrap">{fmtDate(r.date)}</td>

                  {/* Security */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div>
                        <div className="font-medium text-sm">{r.security}</div>
                        <div className="text-xs text-muted-foreground font-mono">{r.ticker}</div>
                      </div>
                      {isSupfl && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px] text-xs">
                            Potential superficial loss — a purchase of {r.ticker} occurred within 30 days of this disposal.
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </td>

                  {/* Units Sold */}
                  <td className="px-4 py-3 text-right tabular-nums">{fmtNum(r.unitsOut, 0)}</td>

                  {/* Proceeds */}
                  <td className="px-4 py-3 text-right tabular-nums">{fmtCAD(r.proceeds)}</td>

                  {/* Book ACB */}
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{fmtCAD(r.bookACB)}</td>

                  {/* Book G/L */}
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{fmtSigned(r.bookGL)}</td>

                  {/* Tax ACB (editable) */}
                  <td className="px-4 py-3 text-right tabular-nums">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editData.taxACB ?? ov.taxACB}
                        onChange={e => setEditData(d => ({ ...d, taxACB: parseFloat(e.target.value) || 0 }))}
                        className={`${IIC} w-28 text-right`}
                      />
                    ) : (
                      <span className={ov.taxACB !== r.bookACB ? 'text-primary font-medium' : ''}>
                        {fmtCAD(ov.taxACB)}
                      </span>
                    )}
                  </td>

                  {/* Tax G/L */}
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{fmtSigned(taxGL)}</td>

                  {/* Difference */}
                  <td className="px-4 py-3 text-right tabular-nums">
                    {Math.abs(diff) > 0.005 ? (
                      <span className="font-medium text-amber-600 dark:text-amber-400">{fmtSigned(diff)}</span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>

                  {/* Adjustment Type (editable) */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <select
                        value={editData.adjType ?? ov.adjType}
                        onChange={e => setEditData(d => ({ ...d, adjType: e.target.value as AdjType }))}
                        className={`${IIC} w-40`}
                      >
                        {ADJ_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    ) : ov.adjType !== 'None' ? (
                      <Badge
                        variant="outline"
                        className={`text-[11px] whitespace-nowrap ${
                          ov.adjType === 'Superficial Loss'
                            ? 'border-amber-300 text-amber-700 dark:text-amber-400'
                            : 'border-primary/40 text-primary'
                        }`}
                      >
                        {ov.adjType}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>

                  {/* Notes (editable) */}
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px]">
                    {isEditing ? (
                      <input
                        type="text"
                        placeholder="Optional note…"
                        value={editData.notes ?? ov.notes}
                        onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))}
                        className={`${IIC} w-44`}
                      />
                    ) : (
                      <span className="truncate block">{ov.notes || <span className="text-muted-foreground/40">—</span>}</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3">
                    {isEditing ? (
                      <div className="flex gap-0.5">
                        <button onClick={() => saveEdit(r.key)} className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setEditKey(null)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-0.5">
                        <button onClick={() => startEdit(r.key)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => { setHiddenKeys(prev => { const n = new Set(prev); n.add(r.key); return n; }); toast.success('Row hidden'); }}
                          className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {visible.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {filterSecurity ? 'No disposals match the filter.' : 'No disposals in period.'}
                </td>
              </tr>
            )}

            {/* Totals footer */}
            <tr className="bg-muted/40 font-semibold border-t border-border">
              <td colSpan={5} className="px-4 py-3 text-sm text-foreground">Total</td>
              <td className="px-4 py-3 text-right tabular-nums">{fmtSigned(totals.bookGL)}</td>
              <td />
              <td className="px-4 py-3 text-right tabular-nums">{fmtSigned(totals.taxGL)}</td>
              <td className="px-4 py-3 text-right tabular-nums">
                {Math.abs(totals.diff) > 0.005
                  ? <span className="text-amber-600 dark:text-amber-400">{fmtSigned(totals.diff)}</span>
                  : <span className="text-muted-foreground/40">—</span>}
              </td>
              <td colSpan={3} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* ACB Adjustments legend */}
      <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground space-y-1.5">
        <p className="font-semibold text-foreground text-sm mb-2">Adjustment Guidance</p>
        <p><span className="font-medium text-foreground">Superficial Loss —</span> Disallowed capital loss where the same or identical property was acquired within 30 days before or after the sale (ITA s.54). The denied loss is added to the ACB of the reacquired property.</p>
        <p><span className="font-medium text-foreground">ACB Adjustment —</span> Use for stock dividends, return-of-capital distributions, or other adjustments that change the tax ACB without affecting the book cost.</p>
        <p><span className="font-medium text-foreground">Other —</span> Any other book-to-tax timing or permanent difference affecting the capital gain/loss calculation.</p>
      </div>

    </div>
  );
}
