import { useState, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Pencil, Trash2, Plus, Check, X, ListFilter, ArrowUp, ArrowDown, ChevronDown, FilePlus2 } from 'lucide-react';
import { Badge } from '@/components/wp-ui/badge';
import { Button } from '@/components/wp-ui/button';
import type { SecuritySchedule, WacRow, ComputeOptions } from '@/lib/luka/compute';
import type { LocalInvJE } from './InvAJEsTab';
import { fmtCAD, fmtNum } from './InvHoldingsTab';
import toast from 'react-hot-toast';

interface Props {
  schedules: SecuritySchedule[];
  opts: ComputeOptions;
  onAddToAJEs?: (je: Omit<LocalInvJE, '_id' | 'status' | 'deleted' | 'deletedAt'>) => void;
}

const WAC_ROW_TYPES = [
  'Opening Balance',
  'Purchase',
  'Sale',
  'Dividend',
  'Interest',
  'Return of Capital',
  'Reinvested Dividend',
  'Withholding Tax',
  'Fee/Commission',
  'Transfer In',
  'Transfer Out',
  'Adjustment',
];

const INPUT_CLS = 'input-double-border h-9 text-sm px-3 border border-[#dcdfe4] rounded-[10px] bg-white dark:bg-card text-foreground transition-all duration-200 hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)] focus:outline-none focus:ring-0';

const SEL_CLS = `${INPUT_CLS} w-full cursor-pointer`;
const INP_CLS = `${INPUT_CLS} w-full`;

export function InvWACTab({ schedules, opts, onAddToAJEs }: Props) {
  const [filterSecurity, setFilterSecurity] = useState('');
  const [filterType,     setFilterType]     = useState('');
  const [filterCcy,      setFilterCcy]      = useState('');
  const [filterSource,   setFilterSource]   = useState('');
  const [filterOpen,     setFilterOpen]     = useState(false);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const [filterPos, setFilterPos] = useState({ top: 0, left: 0 });

  type SortField = 'name' | 'ticker' | 'units' | 'wac' | 'fmv';
  type SortDir   = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir,   setSortDir]   = useState<SortDir>('asc');

  // Local row overrides per security key: null means "use computed rows"
  const [rowOverrides, setRowOverrides] = useState<Record<string, WacRow[]>>({});
  // Which row is being edited: "scheduleKey|rowIndex"
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<WacRow>>({});
  // Hidden rows: Set of "scheduleKey|rowIndex"
  const [hiddenRows, setHiddenRows] = useState<Set<string>>(new Set());
  // Adding new row per schedule
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [newRow, setNewRow] = useState<Partial<WacRow>>({});

  const activeCount = [filterSecurity, filterType, filterCcy, filterSource].filter(Boolean).length;
  const anyFilter   = activeCount > 0;

  const clearAll = () => { setFilterSecurity(''); setFilterType(''); setFilterCcy(''); setFilterSource(''); };

  const openFilterPanel = () => {
    if (filterBtnRef.current) {
      const r = filterBtnRef.current.getBoundingClientRect();
      const panelW = 268;
      const left = r.right - panelW < 8 ? 8 : r.right - panelW;
      setFilterPos({ top: r.bottom + 6, left });
      setFilterOpen(true);
    }
  };

  // Effective rows per schedule: use overrides if set, else computed
  const getRows = (s: SecuritySchedule): WacRow[] =>
    rowOverrides[s.key] ?? s.rows;

  const uniqueTypes = useMemo(
    () => Array.from(new Set(schedules.flatMap((s) => getRows(s).map((r) => r.type)))).sort(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schedules, rowOverrides],
  );
  const uniqueCcys = useMemo(
    () => Array.from(new Set(schedules.map((s) => s.currency))).sort(),
    [schedules],
  );
  const uniqueSources = useMemo(
    () => Array.from(new Set(schedules.flatMap((s) => s.sourceIds))).sort(),
    [schedules],
  );

  const visibleSchedules = useMemo(() => {
    const filtered = schedules.filter((s) => {
      if (filterSecurity && !s.security.toLowerCase().includes(filterSecurity.toLowerCase()) && !s.ticker.toLowerCase().includes(filterSecurity.toLowerCase())) return false;
      if (filterCcy    && s.currency !== filterCcy) return false;
      if (filterSource && !s.sourceIds.includes(filterSource)) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':   cmp = a.security.localeCompare(b.security); break;
        case 'ticker': cmp = a.ticker.localeCompare(b.ticker);     break;
        case 'units':  cmp = a.closingUnits - b.closingUnits;      break;
        case 'wac':    cmp = a.closingWac   - b.closingWac;        break;
        case 'fmv':    cmp = a.fmvCAD       - b.fmvCAD;            break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [schedules, filterSecurity, filterCcy, filterSource, sortField, sortDir]);

  const startEdit = (scheduleKey: string, rowIdx: number, row: WacRow) => {
    setEditKey(`${scheduleKey}|${rowIdx}`);
    setEditData({ ...row });
  };

  const saveEdit = (scheduleKey: string, rowIdx: number) => {
    const rows = getRows(schedules.find((s) => s.key === scheduleKey)!);
    const updated = rows.map((r, i) => (i === rowIdx ? { ...r, ...editData } : r));
    setRowOverrides((prev) => ({ ...prev, [scheduleKey]: updated }));
    setEditKey(null);
    toast.success('Row updated');
  };

  const deleteRow = (scheduleKey: string, rowIdx: number) => {
    const rows = getRows(schedules.find((s) => s.key === scheduleKey)!);
    const updated = rows.filter((_, i) => i !== rowIdx);
    setRowOverrides((prev) => ({ ...prev, [scheduleKey]: updated }));
    toast.success('Row removed');
  };

  const addRow = (scheduleKey: string) => {
    const rows = getRows(schedules.find((s) => s.key === scheduleKey)!);
    const last = rows[rows.length - 1];
    const entry: WacRow = {
      date: newRow.date ?? '',
      type: newRow.type ?? 'Adjustment',
      unitsIn:  newRow.unitsIn  ?? 0,
      unitsOut: newRow.unitsOut ?? 0,
      price:    newRow.price    ?? last?.wac ?? 0,
      costIn:   newRow.costIn   ?? 0,
      costOut:  newRow.costOut  ?? 0,
      cumUnits: newRow.cumUnits ?? last?.cumUnits ?? 0,
      cumCost:  newRow.cumCost  ?? last?.cumCost  ?? 0,
      wac:      newRow.wac      ?? last?.wac      ?? 0,
    };
    setRowOverrides((prev) => ({ ...prev, [scheduleKey]: [...rows, entry] }));
    setAddingFor(null);
    toast.success('Row added');
  };

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">WAC Schedule (Cost &amp; FMV)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Weighted-average cost roll-forward · Pool: {opts.trackByBroker ? 'Per broker' : 'Blended'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {anyFilter && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X className="!w-3.5 !h-3.5" /> Clear filters
            </Button>
          )}
          <Button
            ref={filterBtnRef}
            variant={activeCount > 0 ? 'outline' : 'secondary'}
            size="sm"
            onClick={openFilterPanel}
          >
            <ListFilter className="!w-3.5 !h-3.5" />
            Filters
            {activeCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                {activeCount}
              </span>
            )}
            <ChevronDown className={`!w-3.5 !h-3.5 transition-transform duration-150 ${filterOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {filterOpen && ReactDOM.createPortal(
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setFilterOpen(false)} />
            <div
              style={{ position: 'fixed', top: filterPos.top, left: filterPos.left }}
              className="z-[70] bg-card border border-border rounded-xl shadow-[0_4px_24px_hsl(213_40%_20%/0.18)] p-4 w-[268px]"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Filter WAC Schedule</p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Security</label>
                  <input
                    type="text"
                    value={filterSecurity}
                    onChange={(e) => setFilterSecurity(e.target.value)}
                    placeholder="Ticker or name…"
                    autoFocus
                    className={INP_CLS}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Currency</label>
                  <select value={filterCcy} onChange={(e) => setFilterCcy(e.target.value)} className={SEL_CLS}>
                    <option value="">All currencies</option>
                    {uniqueCcys.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Source</label>
                  <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className={SEL_CLS}>
                    <option value="">All sources</option>
                    {uniqueSources.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Row type</label>
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={SEL_CLS}>
                    <option value="">All types</option>
                    {uniqueTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="border-t border-border mt-3 pt-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sort by</p>
                <div className="flex gap-2">
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className={`flex-1 ${SEL_CLS}`}
                  >
                    <option value="name">Security name</option>
                    <option value="ticker">Ticker</option>
                    <option value="units">Closing units</option>
                    <option value="wac">WAC</option>
                    <option value="fmv">FMV (CAD)</option>
                  </select>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
                    title={sortDir === 'asc' ? 'Ascending — click to reverse' : 'Descending — click to reverse'}
                    className="shrink-0"
                  >
                    {sortDir === 'asc'
                      ? <><ArrowUp className="!w-3.5 !h-3.5" /> Asc</>
                      : <><ArrowDown className="!w-3.5 !h-3.5" /> Desc</>}
                  </Button>
                </div>
              </div>

              {activeCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { clearAll(); setFilterOpen(false); }}
                  className="mt-2 w-full text-destructive hover:text-destructive hover:bg-destructive/8"
                >
                  <X className="!w-3.5 !h-3.5" /> Clear all filters
                </Button>
              )}
            </div>
          </>,
          document.body,
        )}
      </div>

      {visibleSchedules.map((s) => {
        const allRows = getRows(s);
        const rows = filterType ? allRows.filter((r) => r.type === filterType) : allRows;

        return (
          <div key={s.key} className="rounded-xl border border-border bg-card">
            {/* Card header */}
            <div className="p-4 flex items-center justify-between flex-wrap gap-3 border-b border-border">
              <div>
                <div className="font-semibold">
                  {s.security}{' '}
                  <span className="text-muted-foreground font-normal font-mono text-sm">{s.ticker}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Source(s): {s.sourceIds.join(', ')} · CCY {s.currency}
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex gap-4 text-xs">
                  <div><span className="text-muted-foreground">Closing units </span><span className="font-mono font-medium">{fmtNum(s.closingUnits, 4)}</span></div>
                  <div><span className="text-muted-foreground">WAC </span><span className="font-mono font-medium">{fmtNum(s.closingWac)}</span></div>
                  <div><span className="text-muted-foreground">Cost </span><span className="font-mono font-medium">{fmtCAD(s.closingCostCAD)}</span></div>
                  <div><span className="text-muted-foreground">FMV </span><span className="font-mono font-medium">{fmtCAD(s.fmvCAD)}</span></div>
                </div>
                {onAddToAJEs && s.closingUnits > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 ml-auto"
                    title="Send cost-basis AJE to AJEs tab"
                    onClick={() => {
                      onAddToAJEs({
                        ref:          `WAC-${s.ticker}`,
                        description:  `Investment at cost — ${s.security} (${s.ticker}) per WAC schedule`,
                        drAccount:    '1310 · Investments at Cost',
                        crAccount:    '3200 · Opening Retained Earnings',
                        drDescription: `Record ${s.ticker} at WAC cost per schedule`,
                        crDescription: `Establish opening cost basis — ${s.ticker}`,
                        amount:    s.closingCostCAD,
                        type:      'Correcting',
                        confidence: 'Medium',
                        notes: `Closing units: ${fmtNum(s.closingUnits, 4)} | WAC: ${fmtNum(s.closingWac)} | Cost (CAD): ${fmtCAD(s.closingCostCAD)} | FMV (CAD): ${fmtCAD(s.fmvCAD)}`,
                      });
                      toast.success(`Cost-basis AJE queued for ${s.ticker} — review in AJEs tab`);
                    }}
                  >
                    <FilePlus2 className="h-3 w-3" />
                    → AJE
                  </Button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Units In</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Units Out</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cum Units</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cost In</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cost Out</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cum Cost</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">WAC</th>
                    <th className="px-3 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    // Find actual index in allRows (filter may have shifted indices)
                    const actualIdx = allRows.indexOf(r);
                    const eKey = `${s.key}|${actualIdx}`;
                    const isEditing = editKey === eKey;

                    return (
                      <tr key={i} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${isEditing ? 'bg-primary/5' : ''}`}>
                        {/* Date */}
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          {isEditing
                            ? <input type="date" value={editData.date ?? r.date} onChange={e => setEditData(d => ({...d, date: e.target.value}))} className={`${INPUT_CLS} w-32`} />
                            : r.date}
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <select
                              value={editData.type ?? r.type}
                              onChange={e => setEditData(d => ({...d, type: e.target.value}))}
                              className={`${INPUT_CLS} w-44`}
                            >
                              {WAC_ROW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          ) : (
                            <Badge variant="outline" className="text-xs">{r.type}</Badge>
                          )}
                        </td>

                        {/* Units In */}
                        <td className="px-4 py-3 text-right tabular-nums text-xs">
                          {isEditing
                            ? <input type="number" value={editData.unitsIn ?? r.unitsIn} onChange={e => setEditData(d => ({...d, unitsIn: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-24 text-right`} />
                            : fmtNum(r.unitsIn, 4)}
                        </td>

                        {/* Units Out */}
                        <td className="px-4 py-3 text-right tabular-nums text-xs">
                          {isEditing
                            ? <input type="number" value={editData.unitsOut ?? r.unitsOut} onChange={e => setEditData(d => ({...d, unitsOut: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-24 text-right`} />
                            : fmtNum(r.unitsOut, 4)}
                        </td>

                        {/* Cum Units */}
                        <td className="px-4 py-3 text-right tabular-nums text-xs font-medium">
                          {isEditing
                            ? <input type="number" value={editData.cumUnits ?? r.cumUnits} onChange={e => setEditData(d => ({...d, cumUnits: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-24 text-right`} />
                            : fmtNum(r.cumUnits, 4)}
                        </td>

                        {/* Cost In */}
                        <td className="px-4 py-3 text-right tabular-nums text-xs">
                          {isEditing
                            ? <input type="number" value={editData.costIn ?? r.costIn} onChange={e => setEditData(d => ({...d, costIn: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-28 text-right`} />
                            : fmtNum(r.costIn)}
                        </td>

                        {/* Cost Out */}
                        <td className="px-4 py-3 text-right tabular-nums text-xs">
                          {isEditing
                            ? <input type="number" value={editData.costOut ?? r.costOut} onChange={e => setEditData(d => ({...d, costOut: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-28 text-right`} />
                            : fmtNum(r.costOut)}
                        </td>

                        {/* Cum Cost */}
                        <td className="px-4 py-3 text-right tabular-nums text-xs font-medium">
                          {isEditing
                            ? <input type="number" value={editData.cumCost ?? r.cumCost} onChange={e => setEditData(d => ({...d, cumCost: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-28 text-right`} />
                            : fmtNum(r.cumCost)}
                        </td>

                        {/* WAC */}
                        <td className="px-4 py-3 text-right tabular-nums text-xs">
                          {isEditing
                            ? <input type="number" value={editData.wac ?? r.wac} onChange={e => setEditData(d => ({...d, wac: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-24 text-right`} />
                            : fmtNum(r.wac)}
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3">
                          {isEditing ? (
                            <div className="flex gap-0.5">
                              <button onClick={() => saveEdit(s.key, actualIdx)} className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600" title="Save">
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => setEditKey(null)} className="p-1.5 hover:bg-muted rounded-lg text-foreground" title="Cancel">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-0.5 ">
                              <button onClick={() => startEdit(s.key, actualIdx, r)} className="p-1.5 hover:bg-muted rounded-lg text-foreground" title="Edit row">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => deleteRow(s.key, actualIdx)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive" title="Delete row">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Closing Balance row — always shown, unaffected by type filter */}
                  <tr className="border-t-2 border-border bg-muted/20 font-semibold">
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {allRows[allRows.length - 1]?.date ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="text-xs bg-primary/10 text-primary border border-primary/30 hover:bg-primary/10">
                        Closing Balance
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs text-muted-foreground">{fmtNum(0, 4)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs text-muted-foreground">{fmtNum(0, 4)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs">{fmtNum(s.closingUnits, 4)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs text-muted-foreground">{fmtNum(0)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs text-muted-foreground">{fmtNum(0)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs">{fmtNum(s.closingCostCAD)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs">{fmtNum(s.closingWac)}</td>
                    <td className="px-3 py-3"></td>
                  </tr>

                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-4 text-center text-xs text-muted-foreground">
                        No rows match the active type filter.
                      </td>
                    </tr>
                  )}

                  {/* Add new row form */}
                  {addingFor === s.key && (
                    <tr className="border-t border-dashed border-primary/40 bg-primary/5">
                      <td className="px-4 py-2">
                        <input type="date" value={newRow.date ?? ''} onChange={e => setNewRow(d => ({...d, date: e.target.value}))} className={`${INPUT_CLS} w-32`} />
                      </td>
                      <td className="px-4 py-2">
                        <select value={newRow.type ?? 'Adjustment'} onChange={e => setNewRow(d => ({...d, type: e.target.value}))} className={`${INPUT_CLS} w-44`}>
                          {WAC_ROW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input type="number" placeholder="0" value={newRow.unitsIn ?? ''} onChange={e => setNewRow(d => ({...d, unitsIn: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-24 text-right`} />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input type="number" placeholder="0" value={newRow.unitsOut ?? ''} onChange={e => setNewRow(d => ({...d, unitsOut: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-24 text-right`} />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input type="number" placeholder="0.0000" value={newRow.cumUnits ?? ''} onChange={e => setNewRow(d => ({...d, cumUnits: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-24 text-right`} />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input type="number" placeholder="0.00" value={newRow.costIn ?? ''} onChange={e => setNewRow(d => ({...d, costIn: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-28 text-right`} />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input type="number" placeholder="0.00" value={newRow.costOut ?? ''} onChange={e => setNewRow(d => ({...d, costOut: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-28 text-right`} />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input type="number" placeholder="0.00" value={newRow.cumCost ?? ''} onChange={e => setNewRow(d => ({...d, cumCost: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-28 text-right`} />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input type="number" placeholder="0.00" value={newRow.wac ?? ''} onChange={e => setNewRow(d => ({...d, wac: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-24 text-right`} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-0.5">
                          <button onClick={() => addRow(s.key)} className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600" title="Save">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setAddingFor(null)} className="p-1.5 hover:bg-muted rounded-lg text-foreground" title="Cancel">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Row button */}
            <button
              onClick={() => { setAddingFor(s.key); setNewRow({}); }}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 px-4 py-2.5 w-full border-t border-dashed border-border hover:bg-muted/30 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Row
            </button>
          </div>
        );
      })}

      {visibleSchedules.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {filterSecurity
            ? 'No securities match the search.'
            : 'No schedules — enable prior-year file or add transactions.'}
        </div>
      )}
    </div>
  );
}
