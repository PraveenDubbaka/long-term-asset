import React, { useState, useRef, useEffect } from 'react';
import { Download, Trash2, ChevronDown, Check, Search, FileText, X, Info, Pencil, Send } from 'lucide-react';
import { useTableColumns, useColumnResize, ThResizable, type ColDef } from '@/components/table-utils';
import { exportToExcel } from '../lib/utils';
import { useStore } from '../store/useStore';
import { useWorkpaperLoans } from '../contexts/WorkpaperContext';
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


/** Returns [current(yr0), yr1, yr2, yr3, yr4, yr5, thereafter] principal repayments */
function calcMaturityLadder(
  loan: Loan, closingBalance: number, period: string,
): [number, number, number, number, number, number, number] {
  if (closingBalance <= 0) return [0, 0, 0, 0, 0, 0, 0];
  if (loan.type === 'LOC' || loan.type === 'Revolver') return [closingBalance, 0, 0, 0, 0, 0, 0];
  const [y, m] = period.split('-').map(Number);
  const maturity = new Date(loan.maturityDate);
  const monthsToMaturity = Math.max(0,
    (maturity.getFullYear() - y) * 12 + (maturity.getMonth() + 1 - m));
  if (monthsToMaturity <= 0) return [closingBalance, 0, 0, 0, 0, 0, 0];
  const result: [number, number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0, 0];
  if (loan.paymentType === 'Interest-only' || loan.paymentType === 'Balloon') {
    result[Math.min(Math.floor((monthsToMaturity - 1) / 12), 6)] = closingBalance;
    return result;
  }
  const r = loan.rate / 100 / 12;
  const n = monthsToMaturity;
  let bal = closingBalance;
  if (r === 0) {
    const mp = bal / n;
    for (let i = 1; i <= n; i++) result[Math.min(Math.floor((i - 1) / 12), 6)] += mp;
  } else {
    const pmt = bal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    for (let i = 1; i <= n && bal > 0.01; i++) {
      const interest = bal * r;
      const principal = Math.min(pmt - interest, bal);
      result[Math.min(Math.floor((i - 1) / 12), 6)] += principal;
      bal -= principal;
    }
  }
  return result.map(Math.round) as [number, number, number, number, number, number, number];
}


type ContColId =
  | 'period' | 'openingBalance' | 'newBorrowings' | 'principalRepayments'
  | 'interestRepayments' | 'fxTranslation' | 'closingBalance'
  | 'accruedInterest' | 'actions';

const CONT_COLS: ColDef<ContColId>[] = [
  { id: 'period',               label: 'Period',           pinned: true },
  { id: 'openingBalance',       label: 'Opening Balance' },
  { id: 'newBorrowings',        label: '+ New Borr.' },
  { id: 'principalRepayments',  label: '− Principal' },
  { id: 'interestRepayments',   label: '− Interest' },
  { id: 'fxTranslation',        label: '± FX' },
  { id: 'closingBalance',       label: 'Closing Balance' },
  { id: 'accruedInterest',      label: 'Accrued Int.' },
  { id: 'actions',              label: '',                 pinned: true },
];

const ALL_LOANS_ID = '__all__';

/** Format an FX translation value in accounting bracket notation.
 *  negative → (30,300) red  |  positive → 30,300 blue  |  zero → — */
function fmtFX(v: number): { display: string; cls: string } {
  if (v === 0) return { display: '00', cls: 'text-foreground' };
  if (v < 0)   return { display: `(${fmtNumber(Math.abs(v))})`, cls: 'text-foreground' };
  return           { display: fmtNumber(v), cls: 'text-foreground' };
}

export function ContinuityTab() {
  const { loans: storeLoans, continuity, addContinuityRow, updateContinuityRow, deleteContinuityRow, settings, addJE, jes } = useStore(s => ({
    loans: s.loans.filter(l => l.status !== 'Inactive'),
    continuity: s.continuity,
    addContinuityRow: s.addContinuityRow,
    updateContinuityRow: s.updateContinuityRow,
    deleteContinuityRow: s.deleteContinuityRow,
    settings: s.settings,
    addJE: s.addJE,
    jes: s.jes,
  }));

  const wpCtx = useWorkpaperLoans();
  const loans = wpCtx ? wpCtx.loans.filter(l => l.status !== 'Inactive') : storeLoans;

  /** Post an accrued-interest AJE for a single loan row to the AJEs tab */
  const postAccruedInterestAJE = (loan: Loan, accruedInterest: number, period: string) => {
    if (!accruedInterest || accruedInterest <= 0) {
      toast.error('No accrued interest to post for this period');
      return;
    }
    const alreadyPosted = jes.some(j => !j.deleted && j.type === 'AccruedInterest' && j.loanId === loan.id && j.date?.startsWith(period));
    if (alreadyPosted) {
      toast.error('An accrued interest AJE for this period already exists');
      return;
    }
    const isCad = loan.currency === 'CAD';
    const expenseAcct = `${loan.glInterestExpenseAccount} – Interest Expense (${loan.currency})`;
    const liabilityAcct = `${loan.glAccruedInterestAccount} – Accrued Interest Payable – ${loan.currency}`;
    const jeId = `je-ai-${Date.now()}`;
    addJE({
      id: jeId,
      type: 'AccruedInterest',
      description: `YE Accrued Interest – ${loan.name} (${loan.refNumber})`,
      fiscalYear: period.slice(0, 4),
      date: `${period}-${new Date(period + '-01').toLocaleString('en-CA', { day: '2-digit' })}`.replace('NaN', '01') || `${period}-01`,
      loanId: loan.id,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      lines: [
        { id: `${jeId}-dr`, account: expenseAcct, description: `YE accrued interest – ${loan.name}`, debit: accruedInterest, credit: 0, loanId: loan.id },
        { id: `${jeId}-cr`, account: liabilityAcct, description: `YE accrued interest – ${loan.name}`, debit: 0, credit: accruedInterest, loanId: loan.id },
      ],
    } as Parameters<typeof addJE>[0]);
    toast.success(`AJE posted to AJEs tab — ${loan.name} ${isCad ? 'CAD' : 'USD'} ${accruedInterest.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`);
  };

  const [contView, setContView] = useState<'rollforward' | 'repayment'>('rollforward');
  const [selectedLoanId, setSelectedLoanId] = useState<string>(ALL_LOANS_ID);
  const [addOpen, setAddOpen] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [rowEdits, setRowEdits] = useState<Partial<ContinuityRow>>({});

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

  // Cancel edit when switching loans
  useEffect(() => { setEditingRowId(null); setRowEdits({}); }, [selectedLoanId]);

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
  };

  const selectedLoan = loans.find(l => l.id === selectedLoanId);
  const loanRows = continuity.filter(r => r.loanId === selectedLoanId).sort((a, b) => a.period.localeCompare(b.period));

  const activeLoanIds = new Set(loans.map(l => l.id));

  // All-loans view: one row per loan (FY summary) — includes all loans, falls back to loan-level data when no continuity rows exist
  const consolidatedByLoan = loans.map(loan => {
    const rows = continuity.filter(r => r.loanId === loan.id).sort((a, b) => a.period.localeCompare(b.period));
    const first = rows[0];
    const last  = rows[rows.length - 1];
    return {
      loanId:           loan.id,
      loanName:         loan.name,
      lender:           loan.lender,
      currency:         loan.currency,
      openingBalance:   first?.openingBalance ?? (loan.closingBalance ?? loan.currentBalance ?? 0),
      newBorrowings:    rows.reduce((s, r) => s + r.newBorrowings, 0),
      repayments:       rows.reduce((s, r) => s + r.repayments, 0),
      fxTranslation:    rows.reduce((s, r) => s + r.fxTranslation, 0),
      closingBalance:   last?.closingBalance ?? (loan.closingBalance ?? loan.currentBalance ?? 0),
      currentPortion:   last?.currentPortion ?? loan.currentPortion ?? 0,
      longTermPortion:  last?.longTermPortion ?? loan.longTermPortion ?? 0,
      accruedInterest:  last?.accruedInterest ?? loan.accruedInterest ?? 0,
    };
  });

  // Per-row edit helpers
  const startEdit = (row: ContinuityRow) => {
    setEditingRowId(row.id);
    setRowEdits({ ...row });
  };
  const saveEdit = () => {
    if (!editingRowId) return;
    updateContinuityRow(editingRowId, rowEdits);
    toast.success('Row saved');
    setEditingRowId(null);
    setRowEdits({});
  };
  const cancelEdit = () => { setEditingRowId(null); setRowEdits({}); };
  const setCEdit = (field: keyof ContinuityRow, value: unknown) =>
    setRowEdits(prev => ({ ...prev, [field]: value }));

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



  return (
    <div className="p-6 space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Continuity Roll-Forward</h2>
          <p className="text-xs text-foreground mt-0.5">Opening → movements → closing by period</p>
        </div>
        <div className="flex items-center gap-2">
          {contView === 'rollforward' && (
            <Button variant="secondary" size="sm" onClick={() => handleExport(loans.map(l => l.id))}>
              <Download className="w-3.5 h-3.5 mr-1" /> Export
            </Button>
          )}
        </div>
      </div>

      {/* Sub-tab bar */}
      <div className="flex items-center gap-1 border-b border-border -mx-6 px-6">
        {(['rollforward', 'repayment'] as const).map(v => (
          <button
            key={v}
            onClick={() => setContView(v)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              contView === v ? 'border-primary text-primary' : 'border-transparent text-foreground hover:text-foreground'
            }`}
          >
            {v === 'rollforward' ? 'Roll-Forward' : 'Repayment Schedule'}
          </button>
        ))}
      </div>

      {contView === 'repayment' && (() => {
        const period = settings?.currentPeriod ?? '2024-12';
        const baseYear = parseInt(period.split('-')[0]);
        const yearLabels = Array.from({ length: 6 }, (_, i) => String(baseYear + i + 1)).concat(['Thereafter']);
        const repayRows = loans.filter(l => l.status !== 'Inactive').map(l => {
          const ladder = calcMaturityLadder(l, l.closingBalance ?? l.currentBalance ?? 0, period);
          return { loan: l, ladder, total: ladder.reduce((s, v) => s + v, 0) };
        });
        const colTotals = yearLabels.map((_, i) => repayRows.reduce((s, r) => s + (r.ladder[i] ?? 0), 0));
        const grandTotal = colTotals.reduce((s, v) => s + v, 0);
        return (
          <StyledCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider text-left whitespace-nowrap">Facility</th>
                    {yearLabels.map(lbl => (
                      <th key={lbl} className="px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider text-right whitespace-nowrap">{lbl}</th>
                    ))}
                    <th className="px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider text-right whitespace-nowrap">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {repayRows.map(({ loan: l, ladder, total }) => (
                    <tr key={l.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="font-medium text-foreground leading-tight">{l.name}</div>
                        <div className="text-[11px] text-muted-foreground">{l.lender} · {l.currency}</div>
                      </td>
                      {ladder.map((v, i) => (
                        <td key={i} className="px-4 py-2.5 text-right tabular-nums text-foreground">
                          {v > 0 ? fmtNumber(v) : '00'}
                        </td>
                      ))}
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-foreground">{fmtNumber(total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 z-10">
                  <tr className="bg-muted/80 border-t-2 border-primary/20 font-semibold">
                    <td className="px-4 py-2.5 text-foreground whitespace-nowrap">Total · {repayRows.length} facilities</td>
                    {colTotals.map((v, i) => (
                      <td key={i} className="px-4 py-2.5 text-right tabular-nums text-foreground">
                        {v > 0 ? fmtNumber(v) : '00'}
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-right tabular-nums font-bold text-foreground">{fmtNumber(grandTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </StyledCard>
        );
      })()}

      {contView === 'rollforward' && <>
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
                    <ThResizable colId="period" width={colGetWidth('period')} onResizeStart={crh('period')} className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">
                      {selectedLoanId === ALL_LOANS_ID ? 'Loan' : 'Period'}
                    </ThResizable>
                    {colVisible('openingBalance') && <ThResizable colId="openingBalance" width={colGetWidth('openingBalance')} onResizeStart={crh('openingBalance')} className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Opening Balance</ThResizable>}
                    {colVisible('newBorrowings') && <ThResizable colId="newBorrowings" width={colGetWidth('newBorrowings')} onResizeStart={crh('newBorrowings')} className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">+ New Borr.</ThResizable>}
                    {colVisible('principalRepayments') && <ThResizable colId="principalRepayments" width={colGetWidth('principalRepayments')} onResizeStart={crh('principalRepayments')} className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">− Principal</ThResizable>}
                    {colVisible('interestRepayments') && <ThResizable colId="interestRepayments" width={colGetWidth('interestRepayments')} onResizeStart={crh('interestRepayments')} className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">− Interest</ThResizable>}
                    {colVisible('fxTranslation') && <ThResizable colId="fxTranslation" width={colGetWidth('fxTranslation')} onResizeStart={crh('fxTranslation')} className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">± FX</ThResizable>}
                    {colVisible('closingBalance') && <ThResizable colId="closingBalance" width={colGetWidth('closingBalance')} onResizeStart={crh('closingBalance')} className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Closing Balance</ThResizable>}
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
                    <ThResizable colId="actions" width={colGetWidth('actions')} onResizeStart={crh('actions')} className="text-left px-3 py-3 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap"></ThResizable>
                  </tr>
                </thead>
                <tbody>
                  {selectedLoanId === ALL_LOANS_ID ? (
                    <>
                      {consolidatedByLoan.map(row => (
                        <tr key={row.loanId} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="font-medium text-foreground leading-tight">{row.loanName}</div>
                            <div className="text-[11px] text-muted-foreground">{row.lender} · {row.currency}</div>
                          </td>
                          {colVisible('openingBalance') && <td className="px-3 py-2 tabular-nums text-right"><span className="text-foreground">{fmtNumber(row.openingBalance)}</span></td>}
                          {colVisible('newBorrowings') && <td className="px-3 py-2 tabular-nums text-right"><span className="text-foreground">{row.newBorrowings > 0 ? fmtNumber(row.newBorrowings) : '00'}</span></td>}
                          {colVisible('principalRepayments') && <td className="px-3 py-2 tabular-nums text-right"><span className="text-foreground">{row.repayments > 0 ? `(${fmtNumber(row.repayments)})` : '00'}</span></td>}
                          {colVisible('interestRepayments') && <td className="px-3 py-2 tabular-nums text-right text-foreground text-xs">—</td>}
                          {colVisible('fxTranslation') && <td className="px-3 py-2 tabular-nums text-right">{(() => { const fx = fmtFX(row.fxTranslation); return <span className={fx.cls}>{fx.display}</span>; })()}</td>}
                          {colVisible('closingBalance') && <td className="px-3 py-2 tabular-nums text-right font-semibold"><span className="text-foreground">{fmtNumber(row.closingBalance)}</span></td>}
                          {colVisible('accruedInterest') && <td className="px-3 py-2 tabular-nums text-right"><span className="text-foreground">{row.accruedInterest > 0 ? fmtNumber(row.accruedInterest) : '00'}</span></td>}
                          <td className="px-3 py-2 text-center">
                            {(() => {
                              const loanObj = loans.find(l => l.id === row.loanId);
                              const totalAccrued = continuity.filter(r => r.loanId === row.loanId).reduce((s, r) => s + r.accruedInterest, 0);
                              const period = settings.fiscalYearEnd?.slice(0, 7) ?? '2024-12';
                              const alreadyPosted = jes.some(j => !j.deleted && j.type === 'AccruedInterest' && j.loanId === row.loanId && j.date?.startsWith(period));
                              const canPost = !!loanObj && totalAccrued > 0 && !alreadyPosted;
                              return (
                                <div className="flex items-center gap-1 justify-center">
                                  <button
                                    onClick={() => loanObj && postAccruedInterestAJE(loanObj, totalAccrued, period)}
                                    disabled={!canPost}
                                    className={`p-1.5 rounded-lg transition-colors ${canPost ? 'hover:bg-primary/10 text-primary cursor-pointer' : 'text-muted-foreground opacity-40 cursor-not-allowed'}`}
                                    title={alreadyPosted ? 'AJE already posted for this period' : totalAccrued <= 0 ? 'No accrued interest to post' : 'Post accrued interest AJE to AJEs tab'}
                                  ><Send className="w-3.5 h-3.5" /></button>
                                  <button
                                    onClick={() => setSelectedLoanId(row.loanId)}
                                    className="p-1.5 hover:bg-muted rounded-lg text-foreground"
                                    title="Edit periods"
                                  ><Pencil className="w-3.5 h-3.5" /></button>
                                  <button
                                    onClick={() => {
                                      continuity.filter(r => r.loanId === row.loanId).forEach(r => deleteContinuityRow(r.id));
                                      toast.success('Continuity rows deleted');
                                    }}
                                    className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive"
                                    title="Delete continuity rows"
                                  ><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      ))}
                    </>
                  ) : loanRows.map(row => {
                    const isEditing = editingRowId === row.id;
                    const ed = (isEditing ? rowEdits : row) as typeof row;
                    const loan = loans.find(l => l.id === row.loanId);
                    const computedInterest = (loan && row.repayments > 0)
                      ? Math.round(row.openingBalance * (loan.rate / 100 / 12))
                      : 0;
                    const computedPrincipal = row.repayments > 0
                      ? row.repayments - computedInterest
                      : 0;
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
                                onChange={e => setCEdit('openingBalance', parseFloat(e.target.value) || 0)}
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
                                onChange={e => setCEdit('newBorrowings', parseFloat(e.target.value) || 0)}
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
                                onChange={e => setCEdit('principalRepayments', parseFloat(e.target.value) || 0)}
                                className="h-7 w-24 text-xs px-2 border border-primary/40 rounded bg-background text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/30" />
                            ) : (
                              <span className="text-foreground">
                                {(() => { const v = row.principalRepayments ?? computedPrincipal; return v > 0 ? `(${fmtNumber(v)})` : '00'; })()}
                              </span>
                            )}
                          </td>
                        )}
                        {/* − Interest */}
                        {colVisible('interestRepayments') && (
                          <td className="px-3 py-2 tabular-nums text-right">
                            {isEditing ? (
                              <input type="number" value={ed.interestRepayments ?? computedInterest}
                                onChange={e => setCEdit('interestRepayments', parseFloat(e.target.value) || 0)}
                                className="h-7 w-24 text-xs px-2 border border-primary/40 rounded bg-background text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/30" />
                            ) : (
                              <span className="text-foreground">
                                {(() => { const v = row.interestRepayments ?? computedInterest; return v > 0 ? `(${fmtNumber(v)})` : '00'; })()}
                              </span>
                            )}
                          </td>
                        )}
                        {/* ± FX */}
                        {colVisible('fxTranslation') && (
                          <td className="px-3 py-2 tabular-nums text-right">
                            {isEditing ? (
                              <input type="number" value={ed.fxTranslation ?? 0}
                                onChange={e => setCEdit('fxTranslation', parseFloat(e.target.value) || 0)}
                                className="h-7 w-24 text-xs px-2 border border-primary/40 rounded bg-background text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/30" />
                            ) : (
                              (() => { const fx = fmtFX(row.fxTranslation); return <span className={fx.cls}>{fx.display}</span>; })()
                            )}
                          </td>
                        )}
                        {/* Closing Balance */}
                        {colVisible('closingBalance') && (
                          <td className="px-3 py-2 tabular-nums text-right">
                            {isEditing ? (
                              <input type="number" value={ed.closingBalance ?? 0}
                                onChange={e => setCEdit('closingBalance', parseFloat(e.target.value) || 0)}
                                className="h-7 w-24 text-xs px-2 border border-primary/40 rounded bg-background text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/30" />
                            ) : (
                              <span className="text-foreground">{fmtNumber(row.closingBalance)}</span>
                            )}
                          </td>
                        )}
                        {colVisible('accruedInterest') && (
                          <td className="px-3 py-2 tabular-nums text-right">
                            {isEditing ? (
                              <input type="number" value={ed.accruedInterest ?? 0}
                                onChange={e => setCEdit('accruedInterest', parseFloat(e.target.value) || 0)}
                                className="h-7 w-24 text-xs px-2 border border-primary/40 rounded bg-background text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/30" />
                            ) : (
                              <span className="text-foreground">{fmtNumber(row.accruedInterest)}</span>
                            )}
                          </td>
                        )}
                        <td className="px-3 py-2 text-center">
                          {isEditing ? (
                            <div className="flex items-center gap-1 justify-center">
                              <button onClick={saveEdit} className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600" title="Save"><Check className="w-3.5 h-3.5" /></button>
                              <button onClick={cancelEdit} className="p-1.5 hover:bg-muted rounded-lg text-foreground" title="Cancel"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          ) : (() => {
                              const loanObj = loans.find(l => l.id === row.loanId);
                              const alreadyPosted = jes.some(j => !j.deleted && j.type === 'AccruedInterest' && j.loanId === row.loanId && j.date?.startsWith(row.period));
                              const canPost = !!loanObj && row.accruedInterest > 0 && !alreadyPosted;
                              return (
                                <div className="flex items-center gap-1 justify-center">
                                  <button
                                    onClick={() => loanObj && postAccruedInterestAJE(loanObj, row.accruedInterest, row.period)}
                                    disabled={!canPost}
                                    className={`p-1.5 rounded-lg transition-colors ${canPost ? 'hover:bg-primary/10 text-primary cursor-pointer' : 'text-muted-foreground opacity-40 cursor-not-allowed'}`}
                                    title={alreadyPosted ? 'AJE already posted for this period' : row.accruedInterest <= 0 ? 'No accrued interest to post' : 'Post accrued interest AJE to AJEs tab'}
                                  ><Send className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => startEdit(row)} className="p-1.5 hover:bg-muted rounded-lg text-foreground" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => deleteContinuityRow(row.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              );
                            })()
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* sticky tfoot — All-loans grand total OR single-loan FY total */}
                {selectedLoanId === ALL_LOANS_ID && consolidatedByLoan.length > 0 && (() => {
                  const gt = consolidatedByLoan.reduce((s, r) => ({
                    openingBalance:  s.openingBalance  + r.openingBalance,
                    newBorrowings:   s.newBorrowings   + r.newBorrowings,
                    repayments:      s.repayments      + r.repayments,
                    fxTranslation:   s.fxTranslation   + r.fxTranslation,
                    closingBalance:  s.closingBalance   + r.closingBalance,
                    currentPortion:  s.currentPortion  + r.currentPortion,
                    longTermPortion: s.longTermPortion  + r.longTermPortion,
                    accruedInterest: s.accruedInterest  + r.accruedInterest,
                  }), { openingBalance:0, newBorrowings:0, repayments:0, fxTranslation:0, closingBalance:0, currentPortion:0, longTermPortion:0, accruedInterest:0 });
                  return (
                    <tfoot className="sticky bottom-0 z-10">
                      <tr className="bg-muted/80 border-t-2 border-primary/20 font-semibold">
                        <td className="px-3 py-2.5 text-foreground whitespace-nowrap">Total · {consolidatedByLoan.length} facilities</td>
                        {colVisible('openingBalance') && <td className="px-3 py-2.5 tabular-nums text-right text-foreground">{fmtNumber(gt.openingBalance)}</td>}
                        {colVisible('newBorrowings') && <td className="px-3 py-2.5 tabular-nums text-right text-foreground">{gt.newBorrowings > 0 ? fmtNumber(gt.newBorrowings) : '00'}</td>}
                        {colVisible('principalRepayments') && <td className="px-3 py-2.5 tabular-nums text-right text-foreground">{gt.repayments > 0 ? `(${fmtNumber(gt.repayments)})` : '00'}</td>}
                        {colVisible('interestRepayments') && <td className="px-3 py-2.5" />}
                        {colVisible('fxTranslation') && <td className="px-3 py-2.5 tabular-nums text-right">{(() => { const fx = fmtFX(gt.fxTranslation); return <span className={fx.cls}>{fx.display}</span>; })()}</td>}
                        {colVisible('closingBalance') && <td className="px-3 py-2.5 tabular-nums text-right font-bold text-foreground">{fmtNumber(gt.closingBalance)}</td>}
                        {colVisible('accruedInterest') && <td className="px-3 py-2.5 tabular-nums text-right text-foreground">{fmtNumber(gt.accruedInterest)}</td>}
                        <td />
                      </tr>
                    </tfoot>
                  );
                })()}
                {selectedLoanId !== ALL_LOANS_ID && totals && (
                  <tfoot className="sticky bottom-0 z-10">
                    <tr className="bg-muted/80 border-t-2 border-primary/20 font-semibold">
                      <td className="px-3 py-2.5 text-foreground">FY2024 Total</td>
                      {colVisible('openingBalance') && <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{fmtNumber(opening?.openingBalance || 0)}</td>}
                      {colVisible('newBorrowings') && <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{fmtNumber(totals.newBorrowings)}</td>}
                      {colVisible('principalRepayments') && <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{totals.principalRepayments > 0 ? `(${fmtNumber(totals.principalRepayments)})` : '00'}</td>}
                      {colVisible('interestRepayments') && <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{totals.interestRepayments > 0 ? `(${fmtNumber(totals.interestRepayments)})` : '00'}</td>}
                      {colVisible('fxTranslation') && <td className="px-3 py-2.5 text-right tabular-nums">{(() => { const fx = fmtFX(totals.fxTranslation); return <span className={fx.cls}>{fx.display}</span>; })()}</td>}
                      {colVisible('closingBalance') && <td className="px-3 py-2.5 text-right tabular-nums font-bold text-foreground">{fmtNumber(closing?.closingBalance || 0)}</td>}
                      {colVisible('accruedInterest') && <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{fmtNumber(closing?.accruedInterest || 0)}</td>}
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </StyledCard>

          {/* ── Maturity Ladder / Balance Sheet Classification ───────── */}
          {(() => {
            const period = settings?.currentPeriod ?? '2024-12';
            const baseYear = parseInt(period.split('-')[0]);
            const colHeaders = [
              String(baseYear + 2), String(baseYear + 3),
              String(baseYear + 4), String(baseYear + 5), String(baseYear + 6),
              'Thereafter',
              `Current (${baseYear + 1})`,
              'Long-Term',
              'Total',
            ];
            const source = selectedLoanId === ALL_LOANS_ID ? consolidatedByLoan : consolidatedByLoan.filter(r => r.loanId === selectedLoanId);
            const ladderRows = source.map(row => {
              const loan = loans.find(l => l.id === row.loanId);
              const ladder = loan ? calcMaturityLadder(loan, row.closingBalance, period) : ([0,0,0,0,0,0,0] as [number,number,number,number,number,number,number]);
              return { ...row, ladder };
            });
            const totals = ladderRows.reduce(
              (s, r) => r.ladder.map((v, i) => s[i] + v) as [number,number,number,number,number,number,number],
              [0,0,0,0,0,0,0] as [number,number,number,number,number,number,number],
            );
            const grandTotal = totals.reduce((s, v) => s + v, 0);
            return (
              <StyledCard className="overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Balance Sheet Classification</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Current portion + maturity ladder (principal repayments by year)</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted border-b border-border">
                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">Loan</th>
                        {colHeaders.map((h, i) => (
                          <th key={i} className="text-right px-3 py-2.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap text-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ladderRows.map(row => {
                        const total = row.ladder.reduce((s, v) => s + v, 0);
                        const longTerm = row.ladder.slice(1).reduce((s, v) => s + v, 0);
                        return (
                          <tr key={row.loanId} className="border-b border-border hover:bg-muted/30 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="font-medium text-foreground leading-tight text-sm">{row.loanName}</div>
                              {selectedLoanId === ALL_LOANS_ID && <div className="text-[11px] text-muted-foreground">{row.lender} · {row.currency}</div>}
                            </td>
                            {/* Year breakdown (yr+2 … thereafter) */}
                            {row.ladder.slice(1).map((v, i) => (
                              <td key={i} className="px-3 py-2 tabular-nums text-right text-muted-foreground text-xs">
                                {v > 0 ? fmtNumber(v) : '00'}
                              </td>
                            ))}
                            {/* Current */}
                            <td className="px-3 py-2 tabular-nums text-right text-foreground font-medium">
                              {row.ladder[0] > 0 ? fmtNumber(row.ladder[0]) : '00'}
                            </td>
                            {/* Long-Term summary */}
                            <td className="px-3 py-2 tabular-nums text-right text-foreground font-medium">
                              {longTerm > 0 ? fmtNumber(longTerm) : '00'}
                            </td>
                            <td className="px-3 py-2 tabular-nums text-right font-semibold text-foreground">{fmtNumber(total)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {ladderRows.length > 1 && (
                      <tfoot className="sticky bottom-0 z-10">
                        <tr className="bg-muted/80 border-t-2 border-primary/20 font-semibold">
                          <td className="px-3 py-2.5 text-foreground whitespace-nowrap">Total · {ladderRows.length} facilities</td>
                          {/* yr+2 … thereafter */}
                          {totals.slice(1).map((v, i) => (
                            <td key={i} className="px-3 py-2.5 tabular-nums text-right text-foreground text-xs">
                              {v > 0 ? fmtNumber(v) : '00'}
                            </td>
                          ))}
                          {/* Current */}
                          <td className="px-3 py-2.5 tabular-nums text-right text-foreground">
                            {totals[0] > 0 ? fmtNumber(totals[0]) : '00'}
                          </td>
                          {/* Long-Term */}
                          <td className="px-3 py-2.5 tabular-nums text-right text-foreground">
                            {totals.slice(1).reduce((s, v) => s + v, 0) > 0 ? fmtNumber(totals.slice(1).reduce((s, v) => s + v, 0)) : '00'}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-right font-bold text-foreground">{fmtNumber(grandTotal)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </StyledCard>
            );
          })()}

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
      </>}

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
