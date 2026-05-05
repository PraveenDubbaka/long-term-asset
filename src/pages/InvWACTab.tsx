import { useState, useMemo } from 'react';
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react';
import { Badge } from '@/components/wp-ui/badge';
import type { SecuritySchedule, WacRow, ComputeOptions } from '@/lib/luka/compute';
import { fmtCAD, fmtNum } from './InvHoldingsTab';
import { ColFilter, SearchFilter, ClearFiltersBtn } from './InvTableFilters';
import toast from 'react-hot-toast';

interface Props {
  schedules: SecuritySchedule[];
  opts: ComputeOptions;
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

const INPUT_CLS = 'h-7 text-xs px-2 border border-border rounded-md bg-background';

export function InvWACTab({ schedules, opts }: Props) {
  const [filterSecurity, setFilterSecurity] = useState('');
  const [filterType,     setFilterType]     = useState('');

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

  const anyFilter = filterSecurity || filterType;

  // Effective rows per schedule: use overrides if set, else computed
  const getRows = (s: SecuritySchedule): WacRow[] =>
    rowOverrides[s.key] ?? s.rows;

  const uniqueTypes = useMemo(
    () => Array.from(new Set(schedules.flatMap((s) => getRows(s).map((r) => r.type)))).sort(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schedules, rowOverrides],
  );

  const visibleSchedules = useMemo(() => {
    if (!filterSecurity) return schedules;
    return schedules.filter(
      (s) =>
        s.security.toLowerCase().includes(filterSecurity.toLowerCase()) ||
        s.ticker.toLowerCase().includes(filterSecurity.toLowerCase()),
    );
  }, [schedules, filterSecurity]);

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
            <ClearFiltersBtn onClick={() => { setFilterSecurity(''); setFilterType(''); }} />
          )}
          <div className="relative">
            <SearchFilter
              label="Filter security"
              value={filterSecurity}
              onChange={setFilterSecurity}
              placeholder="Ticker or name…"
            />
          </div>
        </div>
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
              <div className="flex gap-4 text-xs">
                <div><span className="text-muted-foreground">Closing units </span><span className="font-mono font-medium">{fmtNum(s.closingUnits, 4)}</span></div>
                <div><span className="text-muted-foreground">WAC </span><span className="font-mono font-medium">{fmtCAD(s.closingWac)}</span></div>
                <div><span className="text-muted-foreground">FMV </span><span className="font-mono font-medium">{fmtCAD(s.fmvCAD)}</span></div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      <ColFilter
                        label="Type"
                        options={uniqueTypes}
                        value={filterType}
                        onChange={setFilterType}
                      />
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Units In</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Units Out</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cost In</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cost Out</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cum Units</th>
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
                      <tr key={i} className={`border-b border-border/50 hover:bg-muted/30 transition-colors group ${isEditing ? 'bg-primary/5' : ''}`}>
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
                            : r.unitsIn ? fmtNum(r.unitsIn, 4) : '—'}
                        </td>

                        {/* Units Out */}
                        <td className="px-4 py-3 text-right tabular-nums text-xs">
                          {isEditing
                            ? <input type="number" value={editData.unitsOut ?? r.unitsOut} onChange={e => setEditData(d => ({...d, unitsOut: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-24 text-right`} />
                            : r.unitsOut ? fmtNum(r.unitsOut, 4) : '—'}
                        </td>

                        {/* Cost In */}
                        <td className="px-4 py-3 text-right tabular-nums text-xs">
                          {isEditing
                            ? <input type="number" value={editData.costIn ?? r.costIn} onChange={e => setEditData(d => ({...d, costIn: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-28 text-right`} />
                            : r.costIn ? fmtCAD(r.costIn) : '—'}
                        </td>

                        {/* Cost Out */}
                        <td className="px-4 py-3 text-right tabular-nums text-xs">
                          {isEditing
                            ? <input type="number" value={editData.costOut ?? r.costOut} onChange={e => setEditData(d => ({...d, costOut: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-28 text-right`} />
                            : r.costOut ? fmtCAD(r.costOut) : '—'}
                        </td>

                        {/* Cum Units */}
                        <td className="px-4 py-3 text-right tabular-nums text-xs font-medium">
                          {isEditing
                            ? <input type="number" value={editData.cumUnits ?? r.cumUnits} onChange={e => setEditData(d => ({...d, cumUnits: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-24 text-right`} />
                            : fmtNum(r.cumUnits, 4)}
                        </td>

                        {/* Cum Cost */}
                        <td className="px-4 py-3 text-right tabular-nums text-xs font-medium">
                          {isEditing
                            ? <input type="number" value={editData.cumCost ?? r.cumCost} onChange={e => setEditData(d => ({...d, cumCost: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-28 text-right`} />
                            : fmtCAD(r.cumCost)}
                        </td>

                        {/* WAC */}
                        <td className="px-4 py-3 text-right tabular-nums text-xs">
                          {isEditing
                            ? <input type="number" value={editData.wac ?? r.wac} onChange={e => setEditData(d => ({...d, wac: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-24 text-right`} />
                            : fmtCAD(r.wac)}
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3">
                          {isEditing ? (
                            <div className="flex gap-0.5">
                              <button onClick={() => saveEdit(s.key, actualIdx)} className="p-1.5 rounded-md hover:bg-green-50 text-muted-foreground hover:text-green-600 transition-colors" title="Save">
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => setEditKey(null)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Cancel">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEdit(s.key, actualIdx, r)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit row">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => deleteRow(s.key, actualIdx)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete row">
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
                    <td className="px-4 py-3 text-right tabular-nums text-xs text-muted-foreground">—</td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs text-muted-foreground">—</td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs text-muted-foreground">—</td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs text-muted-foreground">—</td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs">{fmtNum(s.closingUnits, 4)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs">{fmtCAD(s.closingCostCAD)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs">{fmtCAD(s.closingWac)}</td>
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
                        <input type="number" placeholder="0.00" value={newRow.costIn ?? ''} onChange={e => setNewRow(d => ({...d, costIn: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-28 text-right`} />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input type="number" placeholder="0.00" value={newRow.costOut ?? ''} onChange={e => setNewRow(d => ({...d, costOut: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-28 text-right`} />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input type="number" placeholder="0.0000" value={newRow.cumUnits ?? ''} onChange={e => setNewRow(d => ({...d, cumUnits: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-24 text-right`} />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input type="number" placeholder="0.00" value={newRow.cumCost ?? ''} onChange={e => setNewRow(d => ({...d, cumCost: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-28 text-right`} />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input type="number" placeholder="0.00" value={newRow.wac ?? ''} onChange={e => setNewRow(d => ({...d, wac: parseFloat(e.target.value)||0}))} className={`${INPUT_CLS} w-24 text-right`} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-0.5">
                          <button onClick={() => addRow(s.key)} className="p-1.5 rounded-md hover:bg-green-50 text-muted-foreground hover:text-green-600 transition-colors" title="Save">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setAddingFor(null)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Cancel">
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
