import React, { useState, useRef, useEffect } from 'react';
import { Plus, Download, Edit3, Trash2, ChevronDown, Check, Search, FileText, X, Info } from 'lucide-react';
import { useTableColumns, ColumnToggleButton, useColumnResize, ThResizable, type ColDef } from '@/components/table-utils';
import { exportToExcel } from '../lib/utils';
import { useStore } from '../store/useStore';
import { fmtCurrency, formatPeriod, fmtNumber } from '../lib/utils';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import { Modal, Input, Select } from '../components/ui';
import type { Loan, ContinuityRow } from '../types';
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

/** Principal due in next 12 months from the end of `period` (YYYY-MM). */
function calcCurrentPortion(loan: Loan, closingBalance: number, period: string): number {
  if (closingBalance <= 0) return 0;
  if (loan.type === 'LOC' || loan.type === 'Revolver') return closingBalance;
  const [y, m] = period.split('-').map(Number);
  const maturity = new Date(loan.maturityDate);
  const monthsToMaturity = Math.max(0,
    (maturity.getFullYear() - y) * 12 + (maturity.getMonth() + 1 - m));
  if (monthsToMaturity <= 12) return closingBalance;
  if (loan.paymentType === 'Interest-only' || loan.paymentType === 'Balloon') return 0;
  const r = loan.rate / 100 / 12;
  const n = monthsToMaturity;
  if (r === 0) return Math.round((closingBalance / n) * 12);
  const pmt = closingBalance * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  let bal = closingBalance;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const interest = bal * r;
    const principal = Math.min(pmt - interest, bal);
    sum += principal;
    bal -= principal;
    if (bal <= 0.01) break;
  }
  return Math.round(sum);
}


type ContColId =
  | 'period' | 'openingBalance' | 'newBorrowings' | 'principalRepayments'
  | 'interestRepayments' | 'fxTranslation' | 'closingBalance'
  | 'currentPortion' | 'longTerm' | 'accruedInterest' | 'notes' | 'actions';

const CONT_COLS: ColDef<ContColId>[] = [
  { id: 'period',               label: 'Period',           pinned: true },
  { id: 'openingBalance',       label: 'Opening Balance' },
  { id: 'newBorrowings',        label: '+ New Borr.' },
  { id: 'principalRepayments',  label: '− Principal' },
  { id: 'interestRepayments',   label: '− Interest' },
  { id: 'fxTranslation',        label: '± FX' },
  { id: 'closingBalance',       label: 'Closing Balance' },
  { id: 'currentPortion',       label: 'Current Portion' },
  { id: 'longTerm',             label: 'Long-Term' },
  { id: 'accruedInterest',      label: 'Accrued Int.' },
  { id: 'notes',                label: 'Notes' },
  { id: 'actions',              label: '',                 pinned: true },
];

const ALL_LOANS_ID = '__all__';

export function ContinuityTab() {
  const { loans, continuity, addContinuityRow, updateContinuityRow, deleteContinuityRow } = useStore(s => ({
    loans: s.loans.filter(l => l.status !== 'Inactive'),
    continuity: s.continuity,
    addContinuityRow: s.addContinuityRow,
    updateContinuityRow: s.updateContinuityRow,
    deleteContinuityRow: s.deleteContinuityRow,
  }));

  const [selectedLoanId, setSelectedLoanId] = useState<string>(loans[0]?.id || '');
  const [selectedLoanIds, setSelectedLoanIds] = useState<string[]>(loans.map(l => l.id));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [tableEditMode, setTableEditMode] = useState(false);
  const [tableEdits, setTableEdits] = useState<Record<string, Partial<ContinuityRow>>>({});

  // Notes link panel state
  const [notesPanelRowId, setNotesPanelRowId] = useState<string | null>(null);
  const [rowLinkedNotes, setRowLinkedNotes]   = useState<Record<string, number[]>>({});
  const [panelPendingNotes, setPanelPendingNotes] = useState<number[]>([]);
  const [notesSearch, setNotesSearch]         = useState('');
  const [fsPanelItem, setFsPanelItem]         = useState(FS_ITEMS[0]);
  const [hoveredNote, setHoveredNote]         = useState<{ rowId: string; noteId: number; x: number; y: number } | null>(null);
  const [aiTooltipPos, setAiTooltipPos]       = useState<{ x: number; y: number } | null>(null);

  const { isVisible: colVisible, toggle: colToggle, setWidth: colSetWidth, getWidth: colGetWidth, visibleCount: colVisCount } = useTableColumns('continuity', CONT_COLS);
  const { onResizeStart: colResizeStart } = useColumnResize(colSetWidth);
  const crh = (id: ContColId) => (e: React.MouseEvent) => colResizeStart(id, e, colGetWidth(id) ?? 120);

  // Cancel edit mode when switching loans
  useEffect(() => { cancelTableEdit(); }, [selectedLoanId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const activeLoanIds = new Set(loans.map(l => l.id));
  const consolidatedByPeriod = MONTHS.map(period => {
    const rows = continuity.filter(r => r.period === period && activeLoanIds.has(r.loanId));
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

  // Bulk table edit mode — all rows editable simultaneously
  const startTableEdit = (rows: ContinuityRow[]) => {
    const edits: Record<string, Partial<ContinuityRow>> = {};
    rows.forEach(r => { edits[r.id] = { ...r }; });
    setTableEdits(edits);
    setTableEditMode(true);
  };
  const saveTableEdit = (rows: ContinuityRow[]) => {
    Object.entries(tableEdits).forEach(([id, vals]) => updateContinuityRow(id, vals));
    toast.success(`${rows.length} row${rows.length !== 1 ? 's' : ''} saved`);
    setTableEditMode(false);
    setTableEdits({});
  };
  const cancelTableEdit = () => { setTableEditMode(false); setTableEdits({}); };
  const setCEdit = (id: string, field: keyof ContinuityRow, value: unknown) =>
    setTableEdits(prev => ({ ...prev, [id]: { ...(prev[id] ?? {}), [field]: value } }));

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
    principalRepayments: loanRows.reduce((s, r) => {
      const loan = loans.find(l => l.id === r.loanId);
      const interest = (loan && r.repayments > 0) ? Math.round(r.openingBalance * (loan.rate / 100 / 12)) : 0;
      return s + (r.principalRepayments ?? (r.repayments - interest));
    }, 0),
    interestRepayments: loanRows.reduce((s, r) => {
      const loan = loans.find(l => l.id === r.loanId);
      const interest = (loan && r.repayments > 0) ? Math.round(r.openingBalance * (loan.rate / 100 / 12)) : 0;
      return s + (r.interestRepayments ?? interest);
    }, 0),
  } : null;

  const opening = loanRows[0];
  const closing = loanRows[loanRows.length - 1];

  const closingCurrentPortion = (closing && selectedLoan) ? calcCurrentPortion(selectedLoan, closing.closingBalance, closing.period) : 0;
  const closingLongTerm = closing ? closing.closingBalance - closingCurrentPortion : 0;


  return (
    <div className="p-6 space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Continuity Roll-Forward</h2>
          <p className="text-xs text-foreground mt-0.5">Opening → movements → closing by period</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export selection picker */}
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setPickerOpen(o => !o)}
              className="input-double-border h-9 flex items-center gap-2 text-sm pl-3 pr-3 rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground transition-all duration-200 hover:border-[hsl(210_25%_75%)] cursor-pointer focus:outline-none min-w-[140px] justify-between"
            >
              <span className="text-xs text-foreground mr-1">For export:</span>
              <span>{selectedLoanIds.length === loans.length ? 'All' : `${selectedLoanIds.length} loans`}</span>
              <ChevronDown className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
            </button>
            {pickerOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg min-w-[220px] p-2">
                <div className="flex items-center justify-between px-1 pb-2 mb-1 border-b border-border">
                  <button onClick={() => setSelectedLoanIds(loans.map(l => l.id))} className="text-xs text-primary hover:underline">Select All</button>
                  <button onClick={() => setSelectedLoanIds(loans.slice(0, 1).map(l => l.id))} className="text-xs text-foreground hover:underline">Clear</button>
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
          {/* Column toggle */}
          <ColumnToggleButton columns={CONT_COLS} isVisible={colVisible} onToggle={colToggle} />
          {/* Edit Table / Save All / Cancel — hidden in All Loans view */}
          {selectedLoanId !== ALL_LOANS_ID && tableEditMode ? (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={cancelTableEdit}>
                <X className="w-3.5 h-3.5 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={() => saveTableEdit(loanRows)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                <Check className="w-3.5 h-3.5 mr-1" /> Save All
              </Button>
            </div>
          ) : selectedLoanId !== ALL_LOANS_ID ? (
            <Button variant="secondary" size="sm" onClick={() => startTableEdit(loanRows)}>
              <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Table
            </Button>
          ) : null}
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
                  <span className="text-xs text-foreground">{selectedLoanIds.length} loan{selectedLoanIds.length !== 1 ? 's' : ''}</span>
                </button>
                <button
                  onClick={() => handleExport(loans.map(l => l.id))}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center justify-between"
                >
                  <span>Export All</span>
                  <span className="text-xs text-foreground">{loans.length} loans</span>
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
          <span className="text-xs text-foreground whitespace-nowrap">View:</span>
          <div className="relative">
            <select
              value={selectedLoanId}
              onChange={e => setSelectedLoanId(e.target.value)}
              className="input-double-border h-9 text-sm pl-3 pr-8 rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground appearance-none transition-all duration-200 hover:border-[hsl(210_25%_75%)] cursor-pointer focus:outline-none"
            >
              <option value={ALL_LOANS_ID}>— All Loans —</option>
              {loans.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground pointer-events-none" />
          </div>
        </div>

      </div>

      {(selectedLoan || selectedLoanId === ALL_LOANS_ID) && (
        <div className="space-y-4">
          {/* Continuity Table */}
          <StyledCard className="overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 380px)', minHeight: '200px' }}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-muted border-b border-border">
                    <ThResizable colId="period" width={colGetWidth('period')} onResizeStart={crh('period')} className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Period</ThResizable>
                    {colVisible('openingBalance') && <ThResizable colId="openingBalance" width={colGetWidth('openingBalance')} onResizeStart={crh('openingBalance')} className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Opening Balance</ThResizable>}
                    {colVisible('newBorrowings') && <ThResizable colId="newBorrowings" width={colGetWidth('newBorrowings')} onResizeStart={crh('newBorrowings')} className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">+ New Borr.</ThResizable>}
                    {colVisible('principalRepayments') && <ThResizable colId="principalRepayments" width={colGetWidth('principalRepayments')} onResizeStart={crh('principalRepayments')} className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">− Principal</ThResizable>}
                    {colVisible('interestRepayments') && <ThResizable colId="interestRepayments" width={colGetWidth('interestRepayments')} onResizeStart={crh('interestRepayments')} className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">− Interest</ThResizable>}
                    {colVisible('fxTranslation') && <ThResizable colId="fxTranslation" width={colGetWidth('fxTranslation')} onResizeStart={crh('fxTranslation')} className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">± FX</ThResizable>}
                    {colVisible('closingBalance') && <ThResizable colId="closingBalance" width={colGetWidth('closingBalance')} onResizeStart={crh('closingBalance')} className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Closing Balance</ThResizable>}
                    {colVisible('currentPortion') && <ThResizable colId="currentPortion" width={colGetWidth('currentPortion')} onResizeStart={crh('currentPortion')} className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Current Portion</ThResizable>}
                    {colVisible('longTerm') && <ThResizable colId="longTerm" width={colGetWidth('longTerm')} onResizeStart={crh('longTerm')} className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Long-Term</ThResizable>}
                    {colVisible('accruedInterest') && (
                      <ThResizable colId="accruedInterest" width={colGetWidth('accruedInterest')} onResizeStart={crh('accruedInterest')} className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          Accrued Int.
                          <Info
                            className="w-3 h-3 text-primary cursor-help flex-shrink-0"
                            onMouseEnter={e => { const r = (e.currentTarget as unknown as HTMLElement).getBoundingClientRect(); setAiTooltipPos({ x: r.left + r.width / 2, y: r.top }); }}
                            onMouseLeave={() => setAiTooltipPos(null)}
                          />
                        </span>
                      </ThResizable>
                    )}
                    {colVisible('notes') && <ThResizable colId="notes" width={colGetWidth('notes')} onResizeStart={crh('notes')} className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Notes</ThResizable>}
                    <ThResizable colId="actions" width={colGetWidth('actions')} onResizeStart={crh('actions')} className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap"></ThResizable>
                  </tr>
                </thead>
                <tbody>
                  {selectedLoanId === ALL_LOANS_ID ? consolidatedByPeriod.map(row => (
                    <tr key={row.period} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">{formatPeriod(row.period)}</td>
                      {colVisible('openingBalance') && <td className="px-3 py-2 tabular-nums text-right"><span className="text-foreground">{fmtNumber(row.openingBalance)}</span></td>}
                      {colVisible('newBorrowings') && <td className="px-3 py-2 tabular-nums text-right"><span className="text-foreground">{fmtNumber(row.newBorrowings)}</span></td>}
                      {colVisible('principalRepayments') && <td className="px-3 py-2 tabular-nums text-right"><span className="text-green-600">{row.repayments > 0 ? `(${fmtNumber(row.repayments)})` : '—'}</span></td>}
                      {colVisible('interestRepayments') && <td className="px-3 py-2 tabular-nums text-right text-foreground text-xs">—</td>}
                      {colVisible('fxTranslation') && <td className="px-3 py-2 tabular-nums text-right"><span className={row.fxTranslation < 0 ? 'text-destructive' : row.fxTranslation > 0 ? 'text-blue-600' : 'text-foreground'}>{fmtNumber(row.fxTranslation)}</span></td>}
                      {colVisible('closingBalance') && <td className="px-3 py-2 tabular-nums text-right"><span className="text-foreground">{fmtNumber(row.closingBalance)}</span></td>}
                      {colVisible('currentPortion') && <td className="px-3 py-2 tabular-nums text-right"><span className="text-foreground">{fmtNumber(row.currentPortion)}</span></td>}
                      {colVisible('longTerm') && <td className="px-3 py-2 tabular-nums text-right"><span className="text-foreground">{fmtNumber(row.longTermPortion)}</span></td>}
                      {colVisible('accruedInterest') && <td className="px-3 py-2 tabular-nums text-right"><span className="text-amber-600">{fmtNumber(row.accruedInterest)}</span></td>}
                      {colVisible('notes') && <td className="px-3 py-2" />}
                      <td className="px-3 py-2" />
                    </tr>
                  )) : loanRows.map(row => {
                    const isEditing = tableEditMode;
                    const ed = (tableEdits[row.id] ?? row) as typeof row;
                    const loan = loans.find(l => l.id === row.loanId);
                    const computedInterest = (loan && row.repayments > 0)
                      ? Math.round(row.openingBalance * (loan.rate / 100 / 12))
                      : 0;
                    const computedPrincipal = row.repayments > 0
                      ? row.repayments - computedInterest
                      : 0;
                    const computedCurrentPortion = loan ? calcCurrentPortion(loan, row.closingBalance, row.period) : row.currentPortion;
                    const computedLongTerm = row.closingBalance - computedCurrentPortion;

                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-border transition-colors ${
                          isEditing
                            ? 'bg-primary/[0.02]'
                            : row.isManualAdjustment
                              ? 'bg-amber-50/60 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                              : 'hover:bg-muted/30'
                        }`}
                      >
                        <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">{formatPeriod(row.period)}</td>
                        {colVisible('openingBalance') && (
                          <td className="px-3 py-2 tabular-nums text-right">
                            {isEditing ? (
                              <input type="number" value={ed.openingBalance ?? 0}
                                onChange={e => setCEdit(row.id, 'openingBalance', parseFloat(e.target.value) || 0)}
                                className="h-7 w-24 text-xs px-2 border border-primary/40 rounded bg-background text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/30" />
                            ) : (
                              <span className="text-foreground">{fmtNumber(row.openingBalance)}</span>
                            )}
                          </td>
                        )}
                        {colVisible('newBorrowings') && (
                          <td className="px-3 py-2 tabular-nums text-right">
                            {isEditing ? (
                              <input type="number" value={ed.newBorrowings ?? 0}
                                onChange={e => setCEdit(row.id, 'newBorrowings', parseFloat(e.target.value) || 0)}
                                className="h-7 w-24 text-xs px-2 border border-primary/40 rounded bg-background text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/30" />
                            ) : (
                              <span className="text-foreground">{fmtNumber(row.newBorrowings)}</span>
                            )}
                          </td>
                        )}
                        {/* − Principal */}
                        {colVisible('principalRepayments') && (
                          <td className="px-3 py-2 tabular-nums text-right">
                            {isEditing ? (
                              <input type="number" value={ed.principalRepayments ?? computedPrincipal}
                                onChange={e => setCEdit(row.id, 'principalRepayments', parseFloat(e.target.value) || 0)}
                                className="h-7 w-24 text-xs px-2 border border-primary/40 rounded bg-background text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/30" />
                            ) : (
                              <span className="text-green-600">
                                {(() => { const v = row.principalRepayments ?? computedPrincipal; return v > 0 ? `(${fmtNumber(v)})` : '—'; })()}
                              </span>
                            )}
                          </td>
                        )}
                        {/* − Interest */}
                        {colVisible('interestRepayments') && (
                          <td className="px-3 py-2 tabular-nums text-right">
                            {isEditing ? (
                              <input type="number" value={ed.interestRepayments ?? computedInterest}
                                onChange={e => setCEdit(row.id, 'interestRepayments', parseFloat(e.target.value) || 0)}
                                className="h-7 w-24 text-xs px-2 border border-primary/40 rounded bg-background text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/30" />
                            ) : (
                              <span className="text-amber-600">
                                {(() => { const v = row.interestRepayments ?? computedInterest; return v > 0 ? `(${fmtNumber(v)})` : '—'; })()}
                              </span>
                            )}
                          </td>
                        )}
                        {/* ± FX */}
                        {colVisible('fxTranslation') && (
                          <td className="px-3 py-2 tabular-nums text-right">
                            {isEditing ? (
                              <input type="number" value={ed.fxTranslation ?? 0}
                                onChange={e => setCEdit(row.id, 'fxTranslation', parseFloat(e.target.value) || 0)}
                                className="h-7 w-24 text-xs px-2 border border-primary/40 rounded bg-background text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/30" />
                            ) : (
                              <span className={row.fxTranslation < 0 ? 'text-destructive' : row.fxTranslation > 0 ? 'text-blue-600' : 'text-foreground'}>
                                {fmtNumber(row.fxTranslation)}
                              </span>
                            )}
                          </td>
                        )}
                        {/* Closing Balance */}
                        {colVisible('closingBalance') && (
                          <td className="px-3 py-2 tabular-nums text-right">
                            {isEditing ? (
                              <input type="number" value={ed.closingBalance ?? 0}
                                onChange={e => setCEdit(row.id, 'closingBalance', parseFloat(e.target.value) || 0)}
                                className="h-7 w-24 text-xs px-2 border border-primary/40 rounded bg-background text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/30" />
                            ) : (
                              <span className="text-foreground">{fmtNumber(row.closingBalance)}</span>
                            )}
                          </td>
                        )}
                        {colVisible('currentPortion') && (
                          <td className="px-3 py-2 tabular-nums text-right">
                            {isEditing ? (
                              <input type="number" value={ed.currentPortion ?? computedCurrentPortion}
                                onChange={e => setCEdit(row.id, 'currentPortion', parseFloat(e.target.value) || 0)}
                                className="h-7 w-24 text-xs px-2 border border-primary/40 rounded bg-background text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/30" />
                            ) : (
                              <span className="text-foreground">{fmtNumber(computedCurrentPortion)}</span>
                            )}
                          </td>
                        )}
                        {colVisible('longTerm') && (
                          <td className="px-3 py-2 tabular-nums text-right">
                            {isEditing ? (
                              <input type="number" value={ed.longTermPortion ?? computedLongTerm}
                                onChange={e => setCEdit(row.id, 'longTermPortion', parseFloat(e.target.value) || 0)}
                                className="h-7 w-24 text-xs px-2 border border-primary/40 rounded bg-background text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/30" />
                            ) : (
                              <span className="text-foreground">{fmtNumber(computedLongTerm)}</span>
                            )}
                          </td>
                        )}
                        {colVisible('accruedInterest') && (
                          <td className="px-3 py-2 tabular-nums text-right">
                            {isEditing ? (
                              <input type="number" value={ed.accruedInterest ?? 0}
                                onChange={e => setCEdit(row.id, 'accruedInterest', parseFloat(e.target.value) || 0)}
                                className="h-7 w-24 text-xs px-2 border border-primary/40 rounded bg-background text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/30" />
                            ) : (
                              <span className="text-amber-600">{fmtNumber(row.accruedInterest)}</span>
                            )}
                          </td>
                        )}
                        {colVisible('notes') && (
                          <td className="px-3 py-2 min-w-[120px]">
                            {isEditing ? (
                              <input
                                type="text"
                                value={ed.notes ?? ''}
                                onChange={e => setCEdit(row.id, 'notes', e.target.value)}
                                placeholder="Notes…"
                                className="h-7 w-full text-xs px-2 border border-primary/40 rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                              />
                            ) : (
                              <div className="flex items-center gap-1 flex-wrap">
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
                                {row.notes && <span className="text-[11px] text-foreground truncate max-w-[72px]" title={row.notes}>{row.notes}</span>}
                              </div>
                            )}
                          </td>
                        )}
                        <td className="px-3 py-2" />
                      </tr>
                    );
                  })}
                </tbody>
                {selectedLoanId === ALL_LOANS_ID ? consolidatedByPeriod.length > 0 && (() => {
                  const allFirst = consolidatedByPeriod[0];
                  const allLast  = consolidatedByPeriod[consolidatedByPeriod.length - 1];
                  const allRep   = consolidatedByPeriod.reduce((s, r) => s + r.repayments, 0);
                  const allBorr  = consolidatedByPeriod.reduce((s, r) => s + r.newBorrowings, 0);
                  const allFx    = consolidatedByPeriod.reduce((s, r) => s + r.fxTranslation, 0);
                  return (
                    <tfoot className="sticky bottom-0 z-10">
                      <tr className="bg-muted/80 border-t-2 border-primary/20 font-semibold">
                        <td className="px-3 py-2.5 text-foreground">FY Total</td>
                        {colVisible('openingBalance') && <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{fmtNumber(allFirst.openingBalance)}</td>}
                        {colVisible('newBorrowings') && <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{fmtNumber(allBorr)}</td>}
                        {colVisible('principalRepayments') && <td className="px-3 py-2.5 text-right tabular-nums text-green-600">{allRep > 0 ? `(${fmtNumber(allRep)})` : '—'}</td>}
                        {colVisible('interestRepayments') && <td className="px-3 py-2.5 text-right tabular-nums text-foreground">—</td>}
                        {colVisible('fxTranslation') && <td className="px-3 py-2.5 text-right tabular-nums text-blue-600">{fmtNumber(allFx)}</td>}
                        {colVisible('closingBalance') && <td className="px-3 py-2.5 text-right tabular-nums font-bold text-primary">{fmtNumber(allLast.closingBalance)}</td>}
                        {colVisible('currentPortion') && <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{fmtNumber(allLast.currentPortion)}</td>}
                        {colVisible('longTerm') && <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{fmtNumber(allLast.longTermPortion)}</td>}
                        {colVisible('accruedInterest') && <td className="px-3 py-2.5 text-right tabular-nums text-amber-600">{fmtNumber(allLast.accruedInterest)}</td>}
                        <td colSpan={colVisible('notes') ? 2 : 1} />
                      </tr>
                    </tfoot>
                  );
                })() : totals && (
                  <tfoot className="sticky bottom-0 z-10">
                    <tr className="bg-muted/80 border-t-2 border-primary/20 font-semibold">
                      <td className="px-3 py-2.5 text-foreground">FY2024 Total</td>
                      {colVisible('openingBalance') && <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{fmtNumber(opening?.openingBalance || 0)}</td>}
                      {colVisible('newBorrowings') && <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{fmtNumber(totals.newBorrowings)}</td>}
                      {colVisible('principalRepayments') && <td className="px-3 py-2.5 text-right tabular-nums text-green-600">{totals.principalRepayments > 0 ? `(${fmtNumber(totals.principalRepayments)})` : '—'}</td>}
                      {colVisible('interestRepayments') && <td className="px-3 py-2.5 text-right tabular-nums text-amber-600">{totals.interestRepayments > 0 ? `(${fmtNumber(totals.interestRepayments)})` : '—'}</td>}
                      {colVisible('fxTranslation') && <td className="px-3 py-2.5 text-right tabular-nums text-blue-600">{fmtNumber(totals.fxTranslation)}</td>}
                      {colVisible('closingBalance') && <td className="px-3 py-2.5 text-right tabular-nums font-bold text-primary">{fmtNumber(closing?.closingBalance || 0)}</td>}
                      {colVisible('currentPortion') && <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{fmtNumber(closingCurrentPortion)}</td>}
                      {colVisible('longTerm') && <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{fmtNumber(closingLongTerm)}</td>}
                      {colVisible('accruedInterest') && <td className="px-3 py-2.5 text-right tabular-nums text-amber-600">{fmtNumber(closing?.accruedInterest || 0)}</td>}
                      <td colSpan={colVisible('notes') ? 2 : 1} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </StyledCard>

          {selectedLoan?.type === 'LOC' && (
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


      {/* Accrued Interest formula tooltip — fixed position */}
      {aiTooltipPos && (
        <div
          className="fixed z-[200] pointer-events-none"
          style={{ left: Math.max(8, aiTooltipPos.x - 144), top: Math.max(8, aiTooltipPos.y - 220) }}
        >
          <div className="bg-popover border border-border rounded-xl shadow-2xl p-3.5 w-72 text-left">
            <p className="text-xs font-semibold text-foreground mb-2.5 flex items-center gap-1.5">
              <Info className="w-3 h-3 text-primary flex-shrink-0" />
              Accrued Interest Calculation
            </p>
            <div className="bg-muted/70 rounded-lg px-3 py-2 font-mono text-[11px] text-foreground mb-2.5">
              Opening Balance × (Annual Rate ÷ 12)
            </div>
            <p className="text-[11px] text-foreground leading-relaxed mb-2.5">
              Interest accrued on the period's opening principal at the loan's annual rate, divided by 12 months. Represents amounts earned by the lender but not yet remitted.
            </p>
            <div className="border-t border-border/60 pt-2.5">
              <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-1.5">Day-count variants</p>
              <div className="space-y-1 text-[11px] text-foreground font-mono">
                <div><span className="text-foreground not-italic font-sans">ACT/365: </span>P × R × Days / 365</div>
                <div><span className="text-foreground not-italic font-sans">ACT/360: </span>P × R × Days / 360</div>
                <div><span className="text-foreground not-italic font-sans">30/360:  </span>P × R × 30 / 360</div>
              </div>
            </div>
          </div>
        </div>
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
            <p className="text-xs text-foreground leading-relaxed">{note.content}</p>
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
              <p className="text-xs text-foreground mb-2">Financial Statement Item to Link:</p>
              <div className="relative">
                <select
                  value={fsPanelItem}
                  onChange={e => setFsPanelItem(e.target.value)}
                  className="w-full h-9 text-sm pl-3 pr-8 rounded-[10px] border border-[#dcdfe4] bg-background text-foreground appearance-none focus:outline-none cursor-pointer"
                >
                  {FS_ITEMS.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground pointer-events-none" />
              </div>
            </div>
            {/* Search */}
            <div className="px-5 py-3 border-b border-border flex-shrink-0">
              <p className="text-xs text-foreground mb-2">Select notes to link:</p>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground pointer-events-none" />
                <input
                  value={notesSearch}
                  onChange={e => setNotesSearch(e.target.value)}
                  placeholder="Search"
                  className="w-full h-9 pl-8 pr-3 text-sm border border-[#dcdfe4] rounded-[10px] bg-background text-foreground focus:outline-none placeholder:text-foreground"
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
                <span className="text-foreground">Select all</span>
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
          <span className="text-foreground">Mark as manual adjustment</span>
        </label>
      </div>
    </Modal>
  );
}
