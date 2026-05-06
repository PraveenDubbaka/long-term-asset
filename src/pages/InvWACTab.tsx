import { useState, useMemo, useRef, Fragment } from 'react';
import ReactDOM from 'react-dom';
import { Pencil, Trash2, Plus, Check, X, ListFilter, ArrowUp, ArrowDown, ChevronDown, Send, Upload } from 'lucide-react';
import { Badge } from '@/components/wp-ui/badge';
import { Button } from '@/components/wp-ui/button';
import type { SecuritySchedule, WacRow, ComputeOptions } from '@/lib/luka/compute';
import type { LocalInvJE } from './InvAJEsTab';
import { fmtCAD, fmtNum } from './InvHoldingsTab';
import { fmtDate } from '../lib/utils';
import InvWACImportModal from './InvWACImportModal';
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

  // Import modal
  const [importOpen, setImportOpen] = useState(false);

  const handleWacImport = (entries: Array<{ scheduleKey: string; row: WacRow; ticker: string }>) => {
    setRowOverrides((prev) => {
      const next = { ...prev };
      for (const { scheduleKey, row } of entries) {
        const sched = schedules.find((s) => s.key === scheduleKey);
        if (!sched) continue;
        const current = next[scheduleKey] ?? sched.rows;
        // Remove any previous Opening Balance rows, then prepend the new one
        const withoutOB = current.filter((r) => r.type !== 'Opening Balance');
        next[scheduleKey] = [row, ...withoutOB];
      }
      return next;
    });
  };

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
    <div className="px-6 py-5 flex flex-col gap-4">

      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">WAC Schedule (Cost &amp; FMV)</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Weighted-average cost roll-forward · Pool: {opts.trackByBroker ? 'Per broker' : 'Blended'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {anyFilter && (
            <Button variant="ghost" size="sm" onClick={clearAll}><X className="!w-3.5 !h-3.5" /> Clear filters</Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)} className="gap-1.5">
            <Upload className="!w-3.5 !h-3.5" /> Import
          </Button>
          <Button ref={filterBtnRef} variant={activeCount > 0 ? 'outline' : 'secondary'} size="sm" onClick={openFilterPanel}>
            <ListFilter className="!w-3.5 !h-3.5" />
            Filters
            {activeCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold">{activeCount}</span>
            )}
            <ChevronDown className={`!w-3.5 !h-3.5 transition-transform duration-150 ${filterOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ── Filter panel portal ───────────────────────────────────────── */}
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
                <input type="text" value={filterSecurity} onChange={(e) => setFilterSecurity(e.target.value)} placeholder="Ticker or name…" autoFocus className={INP_CLS} />
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
                <select value={sortField} onChange={(e) => setSortField(e.target.value as SortField)} className={`flex-1 ${SEL_CLS}`}>
                  <option value="name">Security name</option>
                  <option value="ticker">Ticker</option>
                  <option value="units">Closing units</option>
                  <option value="wac">WAC</option>
                  <option value="fmv">FMV (CAD)</option>
                </select>
                <Button variant="secondary" size="sm" onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')} className="shrink-0">
                  {sortDir === 'asc' ? <><ArrowUp className="!w-3.5 !h-3.5" /> Asc</> : <><ArrowDown className="!w-3.5 !h-3.5" /> Desc</>}
                </Button>
              </div>
            </div>
            {activeCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { clearAll(); setFilterOpen(false); }} className="mt-2 w-full text-destructive hover:text-destructive hover:bg-destructive/8">
                <X className="!w-3.5 !h-3.5" /> Clear all filters
              </Button>
            )}
          </div>
        </>,
        document.body,
      )}

      {/* ══ Flat Excel-style spreadsheet ═════════════════════════════════ */}
      {visibleSchedules.length > 0 ? (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">

              {/* ── Sticky frozen header ─────────────────────────────── */}
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#f0f2f5] dark:bg-slate-800 border-b-2 border-border">
                  {[
                    ['Security',  'text-left',  'min-w-[130px]'],
                    ['Ticker',    'text-left',  'w-16'],
                    ['Date',      'text-left',  'w-28'],
                    ['Type',      'text-left',  'min-w-[130px]'],
                    ['Units In',  'text-right', 'w-24'],
                    ['Units Out', 'text-right', 'w-24'],
                    ['Cum Units', 'text-right', 'w-24'],
                    ['Cost In',   'text-right', 'w-28'],
                    ['Cost Out',  'text-right', 'w-28'],
                    ['Cum Cost',  'text-right', 'w-28'],
                    ['WAC',       'text-right', 'w-24'],
                    ['Actions',   'text-left',  'w-24'],
                  ].map(([label, align, w]) => (
                    <th key={label as string}
                      className={`${align} ${w} px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap border-r border-border/40 last:border-r-0`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visibleSchedules.map((s, si) => {
                  const allRows  = getRows(s);
                  const dataRows = filterType ? allRows.filter((r) => r.type === filterType) : allRows;
                  // Subtle alternating group shade (like Excel banded rows by group)
                  const grpBg = si % 2 === 0 ? '' : 'bg-slate-50/60 dark:bg-slate-900/20';

                  return (
                    <Fragment key={s.key}>

                      {/* ── Data rows ──────────────────────────────────── */}
                      {dataRows.map((r, rowI) => {
                        const actualIdx = allRows.indexOf(r);
                        const eKey      = `${s.key}|${actualIdx}`;
                        const isEditing = editKey === eKey;
                        const isOB      = r.type === 'Opening Balance';
                        // Row background priority: editing > OB > group stripe
                        const rowBg = isEditing
                          ? 'bg-primary/5'
                          : isOB
                            ? 'bg-amber-50/70 dark:bg-amber-950/20'
                            : grpBg;

                        return (
                          <tr key={`${s.key}-${rowI}`}
                            className={`border-b border-border/30 hover:bg-primary/5 transition-colors ${rowBg}`}
                          >
                            {/* Security — show on first row only, blank (but styled) after */}
                            <td className="px-3 py-2 border-r border-border/20 whitespace-nowrap">
                              {rowI === 0
                                ? <span className="font-medium text-foreground">{s.security}</span>
                                : <span className="text-muted-foreground/30 select-none text-[10px] italic">{s.ticker}</span>}
                            </td>

                            {/* Ticker */}
                            <td className="px-3 py-2 border-r border-border/20 font-mono font-semibold text-foreground">
                              {s.ticker}
                            </td>

                            {/* Date */}
                            <td className="px-3 py-2 border-r border-border/20 font-mono text-muted-foreground whitespace-nowrap">
                              {isEditing
                                ? <input type="date" value={editData.date ?? r.date} onChange={e => setEditData(d => ({...d, date: e.target.value}))} className={`${INPUT_CLS} w-32`} />
                                : fmtDate(r.date)}
                            </td>

                            {/* Type */}
                            <td className="px-3 py-2 border-r border-border/20">
                              {isEditing ? (
                                <select value={editData.type ?? r.type} onChange={e => setEditData(d => ({...d, type: e.target.value}))} className={`${INPUT_CLS} w-44`}>
                                  {WAC_ROW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                              ) : (
                                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium border
                                  ${isOB
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-700/40'
                                    : 'bg-transparent text-foreground border-transparent'}`}
                                >
                                  {r.type}
                                </span>
                              )}
                            </td>

                            {/* Units In */}
                            <td className="px-3 py-2 text-right tabular-nums border-r border-border/20">
                              {isEditing
                                ? <input type="number" value={editData.unitsIn ?? r.unitsIn} onChange={e => setEditData(d => ({...d, unitsIn: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-24 text-right`} />
                                : r.unitsIn ? fmtNum(r.unitsIn, 4) : <span className="text-muted-foreground/40">—</span>}
                            </td>

                            {/* Units Out */}
                            <td className="px-3 py-2 text-right tabular-nums border-r border-border/20">
                              {isEditing
                                ? <input type="number" value={editData.unitsOut ?? r.unitsOut} onChange={e => setEditData(d => ({...d, unitsOut: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-24 text-right`} />
                                : r.unitsOut ? fmtNum(r.unitsOut, 4) : <span className="text-muted-foreground/40">—</span>}
                            </td>

                            {/* Cum Units */}
                            <td className="px-3 py-2 text-right tabular-nums font-medium border-r border-border/20">
                              {isEditing
                                ? <input type="number" value={editData.cumUnits ?? r.cumUnits} onChange={e => setEditData(d => ({...d, cumUnits: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-24 text-right`} />
                                : fmtNum(r.cumUnits, 4)}
                            </td>

                            {/* Cost In */}
                            <td className="px-3 py-2 text-right tabular-nums border-r border-border/20">
                              {isEditing
                                ? <input type="number" value={editData.costIn ?? r.costIn} onChange={e => setEditData(d => ({...d, costIn: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-28 text-right`} />
                                : r.costIn ? fmtNum(r.costIn) : <span className="text-muted-foreground/40">—</span>}
                            </td>

                            {/* Cost Out */}
                            <td className="px-3 py-2 text-right tabular-nums border-r border-border/20">
                              {isEditing
                                ? <input type="number" value={editData.costOut ?? r.costOut} onChange={e => setEditData(d => ({...d, costOut: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-28 text-right`} />
                                : r.costOut ? fmtNum(r.costOut) : <span className="text-muted-foreground/40">—</span>}
                            </td>

                            {/* Cum Cost */}
                            <td className="px-3 py-2 text-right tabular-nums font-medium border-r border-border/20">
                              {isEditing
                                ? <input type="number" value={editData.cumCost ?? r.cumCost} onChange={e => setEditData(d => ({...d, cumCost: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-28 text-right`} />
                                : fmtNum(r.cumCost)}
                            </td>

                            {/* WAC */}
                            <td className="px-3 py-2 text-right tabular-nums border-r border-border/20">
                              {isEditing
                                ? <input type="number" value={editData.wac ?? r.wac} onChange={e => setEditData(d => ({...d, wac: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-24 text-right`} />
                                : fmtNum(r.wac)}
                            </td>

                            {/* Actions */}
                            <td className="px-3 py-2">
                              {isEditing ? (
                                <div className="flex gap-0.5">
                                  <button onClick={() => saveEdit(s.key, actualIdx)} className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600" title="Save"><Check className="h-3.5 w-3.5" /></button>
                                  <button onClick={() => setEditKey(null)} className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="Cancel"><X className="h-3.5 w-3.5" /></button>
                                </div>
                              ) : (
                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 hover:opacity-100 [tr:hover_&]:opacity-100">
                                  <button onClick={() => startEdit(s.key, actualIdx, r)} className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                                  <button onClick={() => deleteRow(s.key, actualIdx)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {/* ── Inline new-row form ─────────────────────────── */}
                      {addingFor === s.key && (
                        <tr className="border-b border-dashed border-primary/50 bg-primary/5">
                          <td className="px-3 py-1.5 border-r border-border/20 text-[10px] text-muted-foreground italic">{s.security}</td>
                          <td className="px-3 py-1.5 border-r border-border/20 font-mono font-semibold">{s.ticker}</td>
                          <td className="px-3 py-1.5 border-r border-border/20"><input type="date" value={newRow.date ?? ''} onChange={e => setNewRow(d => ({...d, date: e.target.value}))} className={`${INPUT_CLS} w-32`} /></td>
                          <td className="px-3 py-1.5 border-r border-border/20"><select value={newRow.type ?? 'Adjustment'} onChange={e => setNewRow(d => ({...d, type: e.target.value}))} className={`${INPUT_CLS} w-44`}>{WAC_ROW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></td>
                          <td className="px-3 py-1.5 border-r border-border/20"><input type="number" placeholder="0" value={newRow.unitsIn ?? ''} onChange={e => setNewRow(d => ({...d, unitsIn: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-24 text-right`} /></td>
                          <td className="px-3 py-1.5 border-r border-border/20"><input type="number" placeholder="0" value={newRow.unitsOut ?? ''} onChange={e => setNewRow(d => ({...d, unitsOut: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-24 text-right`} /></td>
                          <td className="px-3 py-1.5 border-r border-border/20"><input type="number" placeholder="0.0000" value={newRow.cumUnits ?? ''} onChange={e => setNewRow(d => ({...d, cumUnits: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-24 text-right`} /></td>
                          <td className="px-3 py-1.5 border-r border-border/20"><input type="number" placeholder="0.00" value={newRow.costIn ?? ''} onChange={e => setNewRow(d => ({...d, costIn: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-28 text-right`} /></td>
                          <td className="px-3 py-1.5 border-r border-border/20"><input type="number" placeholder="0.00" value={newRow.costOut ?? ''} onChange={e => setNewRow(d => ({...d, costOut: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-28 text-right`} /></td>
                          <td className="px-3 py-1.5 border-r border-border/20"><input type="number" placeholder="0.00" value={newRow.cumCost ?? ''} onChange={e => setNewRow(d => ({...d, cumCost: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-28 text-right`} /></td>
                          <td className="px-3 py-1.5 border-r border-border/20"><input type="number" placeholder="0.00" value={newRow.wac ?? ''} onChange={e => setNewRow(d => ({...d, wac: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-24 text-right`} /></td>
                          <td className="px-3 py-1.5">
                            <div className="flex gap-0.5">
                              <button onClick={() => addRow(s.key)} className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600" title="Save"><Check className="h-3.5 w-3.5" /></button>
                              <button onClick={() => setAddingFor(null)} className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="Cancel"><X className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* ── Closing / totals row ────────────────────────── */}
                      <tr className={`border-b-2 border-border font-semibold bg-[#f0f2f5] dark:bg-slate-800/60`}>
                        <td className="px-3 py-2 border-r border-border/30 text-[11px] font-bold text-foreground">{s.security}</td>
                        <td className="px-3 py-2 border-r border-border/30 font-mono font-bold text-foreground">{s.ticker}</td>
                        <td className="px-3 py-2 border-r border-border/30 font-mono text-muted-foreground text-[11px]">
                          {allRows[allRows.length - 1]?.date ? fmtDate(allRows[allRows.length - 1].date) : '—'}
                        </td>
                        <td className="px-3 py-2 border-r border-border/30">
                          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold bg-primary/10 text-primary border border-primary/25">
                            Closing Balance
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums border-r border-border/30 text-muted-foreground">—</td>
                        <td className="px-3 py-2 text-right tabular-nums border-r border-border/30 text-muted-foreground">—</td>
                        <td className="px-3 py-2 text-right tabular-nums border-r border-border/30">{fmtNum(s.closingUnits, 4)}</td>
                        <td className="px-3 py-2 text-right tabular-nums border-r border-border/30 text-muted-foreground">—</td>
                        <td className="px-3 py-2 text-right tabular-nums border-r border-border/30 text-muted-foreground">—</td>
                        <td className="px-3 py-2 text-right tabular-nums border-r border-border/30">{fmtCAD(s.closingCostCAD)}</td>
                        <td className="px-3 py-2 text-right tabular-nums border-r border-border/30">{fmtNum(s.closingWac)}</td>
                        {/* Actions: + Add Row + optional AJE */}
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setAddingFor(s.key); setNewRow({}); }}
                              className="p-1.5 rounded hover:bg-primary/10 text-primary"
                              title={`Add row to ${s.ticker}`}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                            {onAddToAJEs && s.closingUnits > 0 && (
                              <button
                                title="Send cost-basis AJE"
                                className="p-1.5 rounded hover:bg-primary/10 text-primary"
                                onClick={() => {
                                  onAddToAJEs({
                                    ref: `WAC-${s.ticker}`,
                                    description: `Investment at cost — ${s.security} (${s.ticker}) per WAC schedule`,
                                    drAccount: '1310 · Investments at Cost',
                                    crAccount: '3200 · Opening Retained Earnings',
                                    drDescription: `Record ${s.ticker} at WAC cost per schedule`,
                                    crDescription: `Establish opening cost basis — ${s.ticker}`,
                                    amount: s.closingCostCAD,
                                    type: 'Correcting',
                                    confidence: 'Medium',
                                    notes: `Units: ${fmtNum(s.closingUnits, 4)} | WAC: ${fmtNum(s.closingWac)} | Cost: ${fmtCAD(s.closingCostCAD)} | FMV: ${fmtCAD(s.fmvCAD)}`,
                                  });
                                  toast.success(`AJE queued for ${s.ticker}`);
                                }}
                              >
                                <Send className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                    </Fragment>
                  );
                })}
              </tbody>

              {/* ── Grand totals footer ───────────────────────────────── */}
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-800 border-t-2 border-border">
                  <td colSpan={6} className="px-3 py-2 text-xs font-bold text-foreground">
                    {visibleSchedules.length} securities
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-xs font-bold border-r border-border/30">
                    {fmtNum(visibleSchedules.reduce((a, s) => a + s.closingUnits, 0), 4)}
                  </td>
                  <td className="px-3 py-2 border-r border-border/30" />
                  <td className="px-3 py-2 border-r border-border/30" />
                  <td className="px-3 py-2 text-right tabular-nums text-xs font-bold border-r border-border/30">
                    {fmtCAD(visibleSchedules.reduce((a, s) => a + s.closingCostCAD, 0))}
                  </td>
                  <td className="px-3 py-2 border-r border-border/30" />
                  <td className="px-3 py-2" />
                </tr>
              </tfoot>

            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {filterSecurity ? 'No securities match the search.' : 'No schedules — enable prior-year file or add transactions.'}
        </div>
      )}

      {/* ── WAC Import Modal ──────────────────────────────────────────── */}
      {importOpen && ReactDOM.createPortal(
        <InvWACImportModal
          open={importOpen}
          onClose={() => setImportOpen(false)}
          schedules={schedules}
          onApply={handleWacImport}
        />,
        document.body,
      )}
    </div>
  );
}
