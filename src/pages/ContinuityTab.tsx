import React, { useState, useRef, useEffect } from 'react';
import { Plus, Download, Edit3, Trash2, ChevronDown, Check, Search, FileText, X } from 'lucide-react';
import { exportToExcel } from '../lib/utils';
import { useStore } from '../store/useStore';
import { fmtCurrency, formatPeriod, fmtNumber } from '../lib/utils';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import { Modal, Input, Select } from '../components/ui';
import type { ContinuityRow } from '../types';
import toast from 'react-hot-toast';

const MONTHS = ['2024-01','2024-02','2024-03','2024-04','2024-05','2024-06','2024-07','2024-08','2024-09','2024-10','2024-11','2024-12'];

interface DisclosureNote { id: number; title: string; content: string; }
const DISCLOSURE_NOTES: DisclosureNote[] = [
  { id: 1, title: 'Basis of accounting – Note 4',         content: 'These financial statements are prepared in accordance with Accounting Standards for Private Enterprises (ASPE) as issued by the CPA Canada Handbook.' },
  { id: 2, title: 'Long-term Debt – Note 8',              content: 'Long-term debt consists of term loans and lines of credit. Interest rates range from 5.25% to 7.45%. All facilities are secured by a general security agreement.' },
  { id: 3, title: 'Current Portion of LTD – Note 8',     content: 'The current portion of long-term debt represents principal repayments due within 12 months of the balance sheet date, reclassified from long-term.' },
  { id: 4, title: 'Accrued Interest Payable – Note 9',   content: 'Accrued interest payable represents interest accrued on outstanding debt obligations that has not yet been remitted to lenders as at the balance sheet date.' },
  { id: 5, title: 'FX Translation Adjustments – Note 3', content: 'USD-denominated debt is translated to CAD at the period-end spot exchange rate. Translation gains and losses are recognized in other comprehensive income.' },
  { id: 6, title: 'Principal Repayment Schedule – Note 8', content: 'Scheduled minimum principal repayments for the next five fiscal years are disclosed in the maturity ladder table accompanying these notes.' },
  { id: 7, title: 'Financial Covenants – Note 8',         content: 'The company is required to maintain a Debt Service Coverage Ratio ≥ 1.25x, tested quarterly. As at December 31, 2024, this covenant was not in compliance (1.12x actual).' },
  { id: 8, title: 'Collateral & Security – Note 8',       content: 'Certain equipment with a net book value of $980,000 is pledged as collateral against the HSBC equipment loan. The TD operating line is secured by a general assignment of receivables.' },
];
const FS_ITEMS = [
  'Long-term debt – current portion',
  'Long-term debt – non-current',
  'Accrued interest payable',
  'Interest expense',
  'FX translation gain / loss',
  'Cash and cash equivalents',
  'Principal repayments',
];

export function ContinuityTab() {
  const { loans, continuity, addContinuityRow, updateContinuityRow, deleteContinuityRow } = useStore(s => ({
    loans: s.loans,
    continuity: s.continuity,
    addContinuityRow: s.addContinuityRow,
    updateContinuityRow: s.updateContinuityRow,
    deleteContinuityRow: s.deleteContinuityRow,
  }));

  const [view, setView] = useState<'by-loan' | 'consolidated'>('by-loan');
  const [selectedLoanId, setSelectedLoanId] = useState<string>(loans[0]?.id || '');
  const [selectedLoanIds, setSelectedLoanIds] = useState<string[]>(loans.map(l => l.id));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [inlineEdit, setInlineEdit] = useState<string | null>(null);
  const [inlineValues, setInlineValues] = useState<Partial<ContinuityRow>>({});

  // Notes link panel state
  const [notesPanelRowId, setNotesPanelRowId] = useState<string | null>(null);
  const [rowLinkedNotes, setRowLinkedNotes]   = useState<Record<string, number[]>>({});
  const [panelPendingNotes, setPanelPendingNotes] = useState<number[]>([]);
  const [notesSearch, setNotesSearch]         = useState('');
  const [fsPanelItem, setFsPanelItem]         = useState(FS_ITEMS[0]);
  const [hoveredNote, setHoveredNote]         = useState<{ rowId: string; noteId: number; x: number; y: number } | null>(null);

  const pickerRef  = useRef<HTMLDivElement>(null);
  const exportRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleLoan = (id: string) => {
    setSelectedLoanIds(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(x => x !== id) : prev  // keep ≥1
        : [...prev, id]
    );
  };

  const handleExport = async (loanIds: string[]) => {
    const toExport = loans.filter(l => loanIds.includes(l.id));
    const data: Record<string, unknown[][]> = {};
    for (const loan of toExport) {
      const rows = continuity.filter(r => r.loanId === loan.id).sort((a, b) => a.period.localeCompare(b.period));
      data[loan.name.slice(0, 31)] = [
        ['Period','Opening Balance','+ New Borrowings','- Repayments','± FX','Closing Balance','Current Portion','Long-Term','Accrued Interest','Notes'],
        ...rows.map(r => [r.period, r.openingBalance, r.newBorrowings, r.repayments, r.fxTranslation, r.closingBalance, r.currentPortion, r.longTermPortion, r.accruedInterest, r.notes || '']),
      ];
    }
    await exportToExcel(data, 'ContinuityRollForward.xlsx');
    toast.success(`Exported ${toExport.length} loan${toExport.length !== 1 ? 's' : ''}`);
    setExportMenuOpen(false);
  };

  const selectedLoan = loans.find(l => l.id === selectedLoanId);
  const loanRows = continuity.filter(r => r.loanId === selectedLoanId).sort((a, b) => a.period.localeCompare(b.period));

  const consolidatedByPeriod = MONTHS.map(period => {
    const rows = continuity.filter(r => r.period === period);
    return {
      period,
      openingBalance: rows.reduce((s, r) => s + r.openingBalance, 0),
      newBorrowings: rows.reduce((s, r) => s + r.newBorrowings, 0),
      repayments: rows.reduce((s, r) => s + r.repayments, 0),
      fxTranslation: rows.reduce((s, r) => s + r.fxTranslation, 0),
      closingBalance: rows.reduce((s, r) => s + r.closingBalance, 0),
      currentPortion: rows.reduce((s, r) => s + r.currentPortion, 0),
      longTermPortion: rows.reduce((s, r) => s + r.longTermPortion, 0),
      accruedInterest: rows.reduce((s, r) => s + r.accruedInterest, 0),
    };
  }).filter(p => p.closingBalance > 0);

  const startInlineEdit = (row: ContinuityRow) => {
    setInlineEdit(row.id);
    setInlineValues({ ...row });
  };

  const saveInlineEdit = () => {
    if (inlineEdit) {
      updateContinuityRow(inlineEdit, inlineValues);
      toast.success('Row updated');
      setInlineEdit(null);
    }
  };

  // Notes panel helpers
  const openNotesPanel = (rowId: string) => {
    setNotesPanelRowId(rowId);
    setPanelPendingNotes(rowLinkedNotes[rowId] ?? []);
    setNotesSearch('');
  };
  const closeNotesPanel = () => setNotesPanelRowId(null);
  const togglePanelNote = (noteId: number) =>
    setPanelPendingNotes(prev => prev.includes(noteId) ? prev.filter(n => n !== noteId) : [...prev, noteId]);
  const savePanelNotes = () => {
    if (!notesPanelRowId) return;
    setRowLinkedNotes(prev => ({ ...prev, [notesPanelRowId]: panelPendingNotes }));
    toast.success('Notes linked');
    closeNotesPanel();
  };
  const filteredNotes = DISCLOSURE_NOTES.filter(n =>
    n.title.toLowerCase().includes(notesSearch.toLowerCase()));

  const totals = loanRows.length > 0 ? {
    newBorrowings: loanRows.reduce((s, r) => s + r.newBorrowings, 0),
    repayments: loanRows.reduce((s, r) => s + r.repayments, 0),
    fxTranslation: loanRows.reduce((s, r) => s + r.fxTranslation, 0),
  } : null;

  const opening = loanRows[0];
  const closing = loanRows[loanRows.length - 1];

  return (
    <div className="p-6 space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Continuity Roll-Forward</h2>
          <p className="text-xs text-foreground/60 mt-0.5">Opening → movements → closing by period</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export selection picker */}
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setPickerOpen(o => !o)}
              className="input-double-border h-9 flex items-center gap-2 text-sm pl-3 pr-3 rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground transition-all duration-200 hover:border-[hsl(210_25%_75%)] cursor-pointer focus:outline-none min-w-[140px] justify-between"
            >
              <span className="text-xs text-foreground/60 mr-1">For export:</span>
              <span>{selectedLoanIds.length === loans.length ? 'All' : `${selectedLoanIds.length} loans`}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/70 flex-shrink-0" />
            </button>
            {pickerOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg min-w-[220px] p-2">
                <div className="flex items-center justify-between px-1 pb-2 mb-1 border-b border-border">
                  <button onClick={() => setSelectedLoanIds(loans.map(l => l.id))} className="text-xs text-primary hover:underline">Select All</button>
                  <button onClick={() => setSelectedLoanIds(loans.slice(0, 1).map(l => l.id))} className="text-xs text-muted-foreground hover:underline">Clear</button>
                </div>
                {loans.map(l => (
                  <label key={l.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer text-sm select-none">
                    <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${selectedLoanIds.includes(l.id) ? 'bg-primary border-primary' : 'border-border bg-background'}`}>
                      {selectedLoanIds.includes(l.id) && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <input type="checkbox" checked={selectedLoanIds.includes(l.id)} onChange={() => toggleLoan(l.id)} className="sr-only" />
                    <span className="text-foreground leading-tight">{l.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {/* Export dropdown */}
          <div className="relative" ref={exportRef}>
            <Button variant="secondary" size="sm" onClick={() => setExportMenuOpen(o => !o)}>
              <Download className="w-3.5 h-3.5 mr-1" /> Export <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
            {exportMenuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg min-w-[210px] p-1">
                <button
                  onClick={() => handleExport(selectedLoanIds)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center justify-between"
                >
                  <span>Export Selected</span>
                  <span className="text-xs text-muted-foreground">{selectedLoanIds.length} loan{selectedLoanIds.length !== 1 ? 's' : ''}</span>
                </button>
                <button
                  onClick={() => handleExport(loans.map(l => l.id))}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center justify-between"
                >
                  <span>Export All</span>
                  <span className="text-xs text-muted-foreground">{loans.length} loans</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loan Selectors */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* View selector (single) */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-foreground/60 whitespace-nowrap">View:</span>
          <div className="relative">
            <select
              value={selectedLoanId}
              onChange={e => setSelectedLoanId(e.target.value)}
              className="input-double-border h-9 text-sm pl-3 pr-8 rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground appearance-none transition-all duration-200 hover:border-[hsl(210_25%_75%)] cursor-pointer focus:outline-none"
            >
              {loans.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/70 pointer-events-none" />
          </div>
        </div>

      </div>

      {selectedLoan && (
        <div className="space-y-4">
          {/* Summary Strip */}
          {opening && closing && (
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Opening Balance', value: fmtCurrency(opening.openingBalance, selectedLoan.currency), sub: formatPeriod('2024-01') },
                { label: 'Total Repayments', value: fmtCurrency(totals?.repayments || 0, selectedLoan.currency), sub: 'FY2024' },
                { label: 'Closing Balance', value: fmtCurrency(closing.closingBalance, selectedLoan.currency), sub: formatPeriod('2024-12') },
                { label: 'Accrued Interest (YE)', value: fmtCurrency(closing.accruedInterest, selectedLoan.currency), sub: 'Dec 31, 2024' },
              ].map(s => (
                <div key={s.label} className="px-5 py-4 bg-card border border-border shadow-sm" style={{ borderRadius: '12px' }}>
                  <div className="text-[11px] font-medium text-foreground/60 mb-1 whitespace-nowrap">{s.label}</div>
                  <div className="text-lg font-bold leading-none text-primary tabular-nums">{s.value}</div>
                  <div className="text-[11px] text-foreground/50 mt-1">{s.sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* Continuity Table */}
          <StyledCard className="overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 380px)', minHeight: '200px' }}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-muted border-b border-border">
                    {['Period','Opening Balance','+ New Borr.','− Repayments','± FX','Closing Balance','Current Portion','Long-Term','Accrued Int.','Notes',''].map(h => (
                      <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loanRows.map(row => {
                    const isEditing = inlineEdit === row.id;
                    const iv = inlineValues as typeof row;

                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-border hover:bg-muted/30 transition-colors ${row.isManualAdjustment ? 'bg-amber-50/60 dark:bg-amber-900/10' : ''}`}
                      >
                        <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">{formatPeriod(row.period)}</td>
                        {(['openingBalance','newBorrowings','repayments','fxTranslation','closingBalance','currentPortion','longTermPortion','accruedInterest'] as const).map(field => (
                          <td key={field} className="px-3 py-2 tabular-nums text-right">
                            {isEditing && field !== 'openingBalance' && field !== 'closingBalance' ? (
                              <input
                                type="number"
                                value={(iv as unknown as Record<string, number>)[field]}
                                onChange={e => setInlineValues({ ...inlineValues, [field]: parseFloat(e.target.value) || 0 })}
                                className="w-24 text-xs px-2 py-1 border border-primary/40 rounded bg-background text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                              />
                            ) : (
                              <span className={
                                field === 'repayments' && row.repayments > 0 ? 'text-green-600' :
                                field === 'fxTranslation' ? (row.fxTranslation < 0 ? 'text-destructive' : 'text-blue-600') :
                                field === 'accruedInterest' ? 'text-amber-600' :
                                'text-foreground'
                              }>
                                {field === 'repayments' && row.repayments > 0 ? '(' : ''}
                                {fmtNumber((row as unknown as Record<string, number>)[field])}
                                {field === 'repayments' && row.repayments > 0 ? ')' : ''}
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="px-3 py-2 min-w-[100px]">
                          <div className="flex items-center gap-1 flex-wrap">
                            {/* + link button */}
                            <button
                              onClick={() => openNotesPanel(row.id)}
                              title="Link financial statement notes"
                              className="p-0.5 rounded hover:bg-primary/10 transition-colors group"
                            >
                              <Plus className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                            </button>
                            {/* linked note chips with hover popover */}
                            {(rowLinkedNotes[row.id] ?? []).sort((a, b) => a - b).map(noteId => {
                              const note = DISCLOSURE_NOTES.find(n => n.id === noteId);
                              if (!note) return null;
                              return (
                                <span
                                  key={noteId}
                                  onMouseEnter={e => {
                                    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                    setHoveredNote({ rowId: row.id, noteId, x: r.left, y: r.top });
                                  }}
                                  onMouseLeave={() => setHoveredNote(null)}
                                  className="inline-flex items-center text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded px-1.5 py-0.5 cursor-default transition-colors leading-none"
                                >
                                  {noteId}
                                </span>
                              );
                            })}
                            {row.isManualAdjustment && <Badge variant="warning">Adj</Badge>}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <div className="flex gap-1">
                              <button onClick={saveInlineEdit} className="text-xs text-green-600 font-medium hover:underline">Save</button>
                              <button onClick={() => setInlineEdit(null)} className="text-xs text-foreground/60 hover:text-foreground">✕</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => startInlineEdit(row)}
                                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                                title="Edit row"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-primary" />
                              </button>
                              <button
                                onClick={() => { deleteContinuityRow(row.id); toast.success('Row deleted'); }}
                                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                                title="Delete row"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {totals && (
                  <tfoot className="sticky bottom-0 z-10">
                    <tr className="bg-muted/80 border-t-2 border-primary/20 font-semibold">
                      <td className="px-3 py-2.5 text-foreground">FY2024 Total</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{fmtNumber(opening?.openingBalance || 0)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{fmtNumber(totals.newBorrowings)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-green-600">({fmtNumber(totals.repayments)})</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-blue-600">{fmtNumber(totals.fxTranslation)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-bold text-primary">{fmtNumber(closing?.closingBalance || 0)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{fmtNumber(closing?.currentPortion || 0)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{fmtNumber(closing?.longTermPortion || 0)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-amber-600">{fmtNumber(closing?.accruedInterest || 0)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </StyledCard>

          {selectedLoan.type === 'LOC' && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
              <span className="text-blue-500 mt-0.5 flex-shrink-0">ℹ</span>
              <div>
                <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-0.5">LOC Balance Tracking</p>
                <p className="text-xs text-blue-700 dark:text-blue-400">Draws and repayments are tracked individually. Closing balance reflects month-end outstanding.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'consolidated' && (
        <StyledCard className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Consolidated Continuity — All Loans (CAD Equivalent)</h3>
            <p className="text-xs text-foreground/60 mt-0.5">USD amounts retranslated at period-end FX rates</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  {['Period','Opening','+ Borr.','− Repay.','± FX','Closing','Current','LT'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider text-right first:text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {consolidatedByPeriod.map(row => (
                  <tr key={row.period} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2 font-medium text-foreground whitespace-nowrap">{formatPeriod(row.period)}</td>
                    {[row.openingBalance, row.newBorrowings, row.repayments, row.fxTranslation, row.closingBalance, row.currentPortion, row.longTermPortion].map((v, i) => (
                      <td key={i} className="px-4 py-2 text-right tabular-nums text-foreground whitespace-nowrap">{fmtNumber(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </StyledCard>
      )}

      {/* Note hover popover — fixed to escape overflow containers */}
      {hoveredNote && (() => {
        const note = DISCLOSURE_NOTES.find(n => n.id === hoveredNote.noteId);
        if (!note) return null;
        const left = Math.max(8, hoveredNote.x - 296); // 280px wide + 16px gap
        const top  = Math.max(8, hoveredNote.y - 8);
        return (
          <div
            className="fixed z-[60] bg-card border border-border rounded-xl shadow-xl p-3.5 w-[280px] pointer-events-none"
            style={{ left, top }}
          >
            <p className="text-xs font-semibold text-foreground mb-1.5">{note.title}</p>
            <p className="text-xs text-foreground/65 leading-relaxed">{note.content}</p>
          </div>
        );
      })()}

      {/* Notes Link Panel — right slide-in */}
      {notesPanelRowId && (
        <div className="fixed inset-0 z-40" onClick={closeNotesPanel}>
          <div
            className="absolute right-0 top-0 h-full w-[340px] bg-card border-l border-border shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-primary flex-shrink-0">
              <h3 className="text-sm font-semibold text-white">Link Notes to Financial Statement</h3>
              <button onClick={closeNotesPanel} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            {/* FS Item dropdown */}
            <div className="px-5 py-4 border-b border-border flex-shrink-0">
              <p className="text-xs text-foreground/60 mb-2">Financial Statement Item to Link:</p>
              <div className="relative">
                <select
                  value={fsPanelItem}
                  onChange={e => setFsPanelItem(e.target.value)}
                  className="w-full h-9 text-sm pl-3 pr-8 rounded-[10px] border border-[#dcdfe4] bg-background text-foreground appearance-none focus:outline-none cursor-pointer"
                >
                  {FS_ITEMS.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/70 pointer-events-none" />
              </div>
            </div>
            {/* Search */}
            <div className="px-5 py-3 border-b border-border flex-shrink-0">
              <p className="text-xs text-foreground/60 mb-2">Select notes to link:</p>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60 pointer-events-none" />
                <input
                  value={notesSearch}
                  onChange={e => setNotesSearch(e.target.value)}
                  placeholder="Search"
                  className="w-full h-9 pl-8 pr-3 text-sm border border-[#dcdfe4] rounded-[10px] bg-background text-foreground focus:outline-none placeholder:text-muted-foreground/50"
                />
              </div>
            </div>
            {/* Select all */}
            <div className="px-5 py-2.5 border-b border-border flex-shrink-0">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-border accent-primary"
                  checked={filteredNotes.length > 0 && filteredNotes.every(n => panelPendingNotes.includes(n.id))}
                  onChange={e => {
                    if (e.target.checked) setPanelPendingNotes(prev => Array.from(new Set([...prev, ...filteredNotes.map(n => n.id)])));
                    else setPanelPendingNotes(prev => prev.filter(id => !filteredNotes.some(n => n.id === id)));
                  }}
                />
                <span className="text-foreground/70">Select all</span>
              </label>
            </div>
            {/* Notes list */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {filteredNotes.map(note => (
                <label key={note.id} className="flex items-start gap-2.5 px-2 py-2.5 rounded-lg hover:bg-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={panelPendingNotes.includes(note.id)}
                    onChange={() => togglePanelNote(note.id)}
                    className="mt-0.5 rounded border-border accent-primary flex-shrink-0"
                  />
                  <FileText className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground leading-snug">{note.id}.&nbsp;{note.title}</span>
                </label>
              ))}
            </div>
            {/* Footer */}
            <div className="px-5 py-4 border-t border-border flex-shrink-0">
              <Button variant="default" className="w-full" onClick={savePanelNotes}>
                Link/Unlink Notes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Row Modal */}
      <AddContinuityRowModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        loanId={selectedLoanId}
        onSave={(row) => { addContinuityRow(row); toast.success('Row added'); setAddOpen(false); }}
      />
    </div>
  );
}

function AddContinuityRowModal({ open, onClose, loanId, onSave }: {
  open: boolean; onClose: () => void; loanId: string;
  onSave: (row: ContinuityRow) => void;
}) {
  const [form, setForm] = useState({ period: '2025-01', openingBalance: 0, newBorrowings: 0, repayments: 0, fxTranslation: 0, notes: '', isManualAdjustment: false });
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.type === 'checkbox' ? e.target.checked : parseFloat(e.target.value) || e.target.value }));

  const handleSave = () => {
    const closing = form.openingBalance + form.newBorrowings - form.repayments + form.fxTranslation;
    onSave({
      id: `cont-${Date.now()}`, loanId,
      period: form.period,
      openingBalance: form.openingBalance,
      newBorrowings: form.newBorrowings,
      repayments: form.repayments,
      fxTranslation: form.fxTranslation,
      closingBalance: closing,
      currentPortion: closing,
      longTermPortion: 0,
      accruedInterest: 0,
      notes: form.notes,
      isManualAdjustment: form.isManualAdjustment,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Continuity Row" size="md"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="default" onClick={handleSave}>Add Row</Button></>}
    >
      <div className="space-y-3">
        <Input label="Period (YYYY-MM)" value={form.period} onChange={(e) => setForm(p => ({ ...p, period: e.target.value }))} />
        <Input label="Opening Balance" type="number" value={form.openingBalance} onChange={f('openingBalance')} prefix="$" />
        <Input label="New Borrowings / Draws" type="number" value={form.newBorrowings} onChange={f('newBorrowings')} prefix="$" />
        <Input label="Principal Repayments" type="number" value={form.repayments} onChange={f('repayments')} prefix="$" />
        <Input label="FX Translation" type="number" value={form.fxTranslation} onChange={f('fxTranslation')} prefix="$" hint="Enter negative for FX loss" />
        <Input label="Notes" value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} />
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.isManualAdjustment} onChange={(e) => setForm(p => ({ ...p, isManualAdjustment: e.target.checked }))} className="rounded border-border accent-primary" />
          <span className="text-foreground/60">Mark as manual adjustment</span>
        </label>
      </div>
    </Modal>
  );
}
