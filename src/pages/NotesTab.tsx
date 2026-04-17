import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  RefreshCw, AlertTriangle, RotateCcw, CheckCircle2, Send, Undo2,
  Bold, Italic, Underline, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Trash2, Plus, ChevronDown, ArrowUp,
} from 'lucide-react';
import { StyledCard } from '@/components/wp-ui/card';
import { Button } from '@/components/wp-ui/button';
import { useStore } from '../store/useStore';
import { useWorkpaperLoans } from '../contexts/WorkpaperContext';
import { fmtPct, fmtDateDisplay } from '../lib/utils';
import type { Loan, ContinuityRow, ReconciliationItem } from '../types';

// ─── Formatters ───────────────────────────────────────────────────────────────

/** Plain number, no $ — used inside the accounting-style $ | number columns */
const NUM = (v: number) =>
  v === 0
    ? '00'
    : v.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

/** Same but wrapped in parentheses for deductions */
const PARENS = (v: number) =>
  v === 0
    ? '00'
    : `(${v.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })})`;

/** Full CAD string — kept for repayment schedule */
const CAD = (v: number) =>
  v === 0
    ? '00'
    : `$${v.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// ─── Data helpers ─────────────────────────────────────────────────────────────

function getTBBalance(loanId: string, recon: ReconciliationItem[], fallback: number) {
  const r = recon.find(x => x.loanId === loanId && x.accountType === 'Principal');
  if (!r) return { value: fallback, fromTB: false, hasVariance: false };
  return { value: r.tbBalance, fromTB: true, hasVariance: r.variance !== 0 };
}

function getPriorYearBalance(loanId: string, continuity: ContinuityRow[]): number | null {
  const rows = continuity
    .filter(r => r.loanId === loanId)
    .sort((a, b) => a.period.localeCompare(b.period));
  return rows.length > 0 ? rows[0].openingBalance : null;
}

function getYEContinuity(loanId: string, continuity: ContinuityRow[], yearEnd: string) {
  const ym = yearEnd.substring(0, 7);
  const rows = continuity
    .filter(r => r.loanId === loanId)
    .sort((a, b) => a.period.localeCompare(b.period));
  const before = rows.filter(r => r.period <= ym);
  return before.length > 0 ? before[before.length - 1] : (rows[rows.length - 1] ?? null);
}

// ─── Per-loan note generator ──────────────────────────────────────────────────

function generateLoanNote(l: Loan, _tbValue: number): string {
  const ccy = l.currency !== 'CAD' ? `${l.currency} ` : '';
  const typeLabel =
    l.type === 'LOC'      ? 'line of credit' :
    l.type === 'Revolver' ? 'revolving credit facility' :
    l.type === 'Mortgage' ? 'mortgage' : 'term loan';

  const rateStr =
    l.interestType === 'Variable' && l.benchmark
      ? `${l.benchmark}${l.spread ? ` + ${l.spread}%` : ''} (${fmtPct(l.rate)} effective), variable rate`
      : `${fmtPct(l.rate)} per annum, fixed rate`;

  const payStr = `${l.paymentFrequency.toLowerCase()} ${l.paymentType.toLowerCase()} payments`;

  const matStr = l.maturityDate
    ? `matures ${fmtDateDisplay(l.maturityDate)}`
    : 'revolving with no fixed maturity';

  const secStr = l.securityDescription
    ? `, secured by ${l.securityDescription.toLowerCase()}`
    : '';

  const creditStr =
    (l.type === 'LOC' || l.type === 'Revolver') && l.creditLimit
      ? `. Maximum available credit is ${CAD(l.creditLimit)}`
      : '';

  const fxStr =
    l.currency !== 'CAD' && l.fxRateToCAD
      ? `. Translated to CAD at a closing rate of ${l.fxRateToCAD.toFixed(4)}`
      : '';

  return (
    `${l.name} — ${ccy}${typeLabel} with ${l.lender} at ${rateStr}, ` +
    `payable in ${payStr}, ${matStr}${secStr}${creditStr}${fxStr}.`
  );
}

// ─── Auto-resizing editable note cell ────────────────────────────────────────

function NoteCell({
  loanId,
  value,
  onChange,
  onRegenerate,
}: {
  loanId: string;
  value: string;
  onChange: (id: string, v: string) => void;
  onRegenerate: (id: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = ref.current.scrollHeight + 'px';
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
    onChange(loanId, e.target.value);
  };

  return (
    <div className="flex items-start gap-1.5 group/cell">
      <div className="flex-1 relative rounded-md border border-border bg-background hover:border-primary/40 focus-within:border-primary/60 transition-colors">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={handleChange}
          placeholder="Add note for this facility…"
          className="w-full text-sm font-sans leading-relaxed bg-transparent resize-none focus:outline-none text-foreground placeholder:text-foreground px-3 py-2 overflow-hidden"
          style={{ minHeight: '2rem' }}
        />
      </div>
      <button
        onClick={() => onRegenerate(loanId)}
        title="Re-generate note"
        className="opacity-0 group-hover/cell:opacity-40 hover:!opacity-100 shrink-0 mt-2 p-0.5 rounded transition-opacity text-foreground hover:text-primary"
      >
        <RotateCcw className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Editable amount cell ─────────────────────────────────────────────────────

function AmountCell({
  value,
  onChange,
  readOnly = false,
  warning = false,
  placeholder,
}: {
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  warning?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="relative flex items-center rounded-md border border-border bg-background hover:border-primary/40 focus-within:border-primary/60 transition-colors">
      <input
        type="text"
        readOnly={readOnly}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange?.(e.target.value)}
        className={[
          'w-full text-sm tabular-nums font-mono bg-transparent',
          'px-3 py-1.5 text-right focus:outline-none',
          'text-foreground placeholder:text-foreground',
          readOnly ? 'cursor-default select-all' : '',
        ].join(' ')}
      />
      {warning && (
        <AlertTriangle className="w-3 h-3 text-amber-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
      )}
    </div>
  );
}

// ─── Block builder ────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

interface TableCol   { id: string; label: string; }
interface TableRowD  { id: string; cells: Record<string, string>; }
interface TextBlockD  { id: string; type: 'text';  content: string; }
interface TableBlockD { id: string; type: 'table'; columns: TableCol[]; rows: TableRowD[]; }
type BlockD = TextBlockD | TableBlockD;

/** Small toolbar icon button — uses onMouseDown to avoid stealing contentEditable focus */
function TBtn({ onClick, title, children }: {
  onClick: () => void; title?: string; children: React.ReactNode;
}) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className="p-1.5 rounded hover:bg-border/60 text-foreground hover:text-foreground transition-colors"
    >
      {children}
    </button>
  );
}

/** Move-up / delete sidebar shared by both block types */
function BlockSidebar({ onMoveUp, canMoveUp }: { onMoveUp: () => void; canMoveUp: boolean }) {
  return (
    <button
      onClick={onMoveUp}
      disabled={!canMoveUp}
      title="Move up"
      className="mt-2 p-1 rounded border border-border bg-background hover:bg-muted text-foreground hover:text-foreground disabled:opacity-20 transition-colors shrink-0"
    >
      <ArrowUp className="w-3.5 h-3.5" />
    </button>
  );
}

// ── Text block ────────────────────────────────────────────────────────────────

function TextBlockEditor({
  block, onChange, onDelete, onMoveUp, canMoveUp,
}: {
  block: TextBlockD;
  onChange: (id: string, html: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  canMoveUp: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const ready = useRef(false);

  useEffect(() => {
    if (ref.current && !ready.current) {
      ref.current.innerHTML = block.content;
      ready.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const exec = (cmd: string) => { document.execCommand(cmd, false); ref.current?.focus(); };

  return (
    <div className="flex items-start gap-2">
      <BlockSidebar onMoveUp={() => onMoveUp(block.id)} canMoveUp={canMoveUp} />
      <StyledCard className="overflow-hidden flex-1">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-0.5">
            <TBtn onClick={() => exec('bold')}    title="Bold">    <Bold          className="w-3.5 h-3.5" /></TBtn>
            <TBtn onClick={() => exec('italic')}  title="Italic">  <Italic        className="w-3.5 h-3.5" /></TBtn>
            <TBtn onClick={() => exec('underline')} title="Underline"><Underline  className="w-3.5 h-3.5" /></TBtn>
            <div className="w-px h-4 bg-border/60 mx-1" />
            <TBtn onClick={() => exec('insertUnorderedList')} title="Bullet list">  <List        className="w-3.5 h-3.5" /></TBtn>
            <TBtn onClick={() => exec('insertOrderedList')}   title="Numbered list"><ListOrdered className="w-3.5 h-3.5" /></TBtn>
            <div className="w-px h-4 bg-border/60 mx-1" />
            <TBtn onClick={() => exec('justifyLeft')}   title="Align left">   <AlignLeft    className="w-3.5 h-3.5" /></TBtn>
            <TBtn onClick={() => exec('justifyCenter')} title="Align center"> <AlignCenter  className="w-3.5 h-3.5" /></TBtn>
            <TBtn onClick={() => exec('justifyRight')}  title="Align right">  <AlignRight   className="w-3.5 h-3.5" /></TBtn>
            <TBtn onClick={() => exec('justifyFull')}   title="Justify">      <AlignJustify className="w-3.5 h-3.5" /></TBtn>
          </div>
          <button
            onClick={() => onDelete(block.id)}
            className="p-1.5 rounded hover:bg-destructive/10 text-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Editable area */}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={() => onChange(block.id, ref.current?.innerHTML ?? '')}
          className={[
            'min-h-[80px] px-4 py-3 text-sm text-foreground focus:outline-none leading-relaxed',
            'empty:before:content-[attr(data-placeholder)] empty:before:text-foreground',
          ].join(' ')}
          data-placeholder="Copy your text or enter here"
        />
      </StyledCard>
    </div>
  );
}

// ── Table block ───────────────────────────────────────────────────────────────

function TableBlockEditor({
  block, onChange, onDelete, onMoveUp, canMoveUp,
}: {
  block: TableBlockD;
  onChange: (updated: TableBlockD) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  canMoveUp: boolean;
}) {
  const addColumn = () => {
    const col: TableCol = { id: uid(), label: 'Column' };
    onChange({
      ...block,
      columns: [...block.columns, col],
      rows: block.rows.map(r => ({ ...r, cells: { ...r.cells, [col.id]: '' } })),
    });
  };

  const removeColumn = (colId: string) => {
    if (block.columns.length <= 1) return;
    const columns = block.columns.filter(c => c.id !== colId);
    const rows = block.rows.map(r => {
      const cells = { ...r.cells };
      delete cells[colId];
      return { ...r, cells };
    });
    onChange({ ...block, columns, rows });
  };

  const addRow = () => {
    const row: TableRowD = {
      id: uid(),
      cells: Object.fromEntries(block.columns.map(c => [c.id, ''])),
    };
    onChange({ ...block, rows: [...block.rows, row] });
  };

  const removeRow = (rowId: string) =>
    onChange({ ...block, rows: block.rows.filter(r => r.id !== rowId) });

  const updateCell = (rowId: string, colId: string, val: string) =>
    onChange({
      ...block,
      rows: block.rows.map(r =>
        r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: val } } : r,
      ),
    });

  const updateColLabel = (colId: string, label: string) =>
    onChange({ ...block, columns: block.columns.map(c => c.id === colId ? { ...c, label } : c) });

  const colTotal = (colId: string) => {
    const s = block.rows.reduce(
      (acc, r) => acc + (parseFloat((r.cells[colId] ?? '').replace(/,/g, '')) || 0), 0,
    );
    return s !== 0
      ? s.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      : '00';
  };

  return (
    <div className="flex items-start gap-2">
      <BlockSidebar onMoveUp={() => onMoveUp(block.id)} canMoveUp={canMoveUp} />
      <StyledCard className="overflow-hidden flex-1">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-0.5">
            <TBtn onClick={() => document.execCommand('bold')}      title="Bold">     <Bold      className="w-3.5 h-3.5" /></TBtn>
            <TBtn onClick={() => document.execCommand('italic')}    title="Italic">   <Italic    className="w-3.5 h-3.5" /></TBtn>
            <TBtn onClick={() => document.execCommand('underline')} title="Underline"><Underline className="w-3.5 h-3.5" /></TBtn>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={addColumn} className="h-7 text-xs gap-1 px-2.5">
              <Plus className="w-3 h-3" />Add Column
            </Button>
            <button
              onClick={() => onDelete(block.id)}
              className="p-1.5 rounded hover:bg-destructive/10 text-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="w-8 border-r border-border" />
                {block.columns.map((col, ci) => (
                  <th key={col.id} className="px-3 py-2 border-r border-border last:border-r-0 text-left group/col">
                    <div className="flex items-center gap-1">
                      <input
                        value={col.label}
                        onChange={e => updateColLabel(col.id, e.target.value)}
                        className="flex-1 min-w-0 text-xs font-semibold uppercase tracking-wide bg-transparent focus:outline-none text-foreground"
                      />
                      {ci > 0 && (
                        <button
                          onClick={() => removeColumn(col.id)}
                          className="opacity-0 group-hover/col:opacity-60 hover:!opacity-100 text-foreground hover:text-destructive transition-opacity leading-none"
                        >×</button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.length === 0 && (
                <tr>
                  <td colSpan={block.columns.length + 1} className="px-4 py-5 text-center text-sm text-foreground">
                    No rows yet — click "+ Add Row" below
                  </td>
                </tr>
              )}
              {block.rows.map(row => (
                <tr key={row.id} className="border-b border-border hover:bg-muted/10 group/row">
                  <td className="w-8 border-r border-border text-center">
                    <button
                      onClick={() => removeRow(row.id)}
                      className="opacity-0 group-hover/row:opacity-60 hover:!opacity-100 text-foreground hover:text-destructive transition-opacity text-base leading-none"
                    >×</button>
                  </td>
                  {block.columns.map(col => (
                    <td key={col.id} className="px-3 py-2 border-r border-border last:border-r-0">
                      <input
                        value={row.cells[col.id] ?? ''}
                        onChange={e => updateCell(row.id, col.id, e.target.value)}
                        placeholder="—"
                        className="w-full bg-transparent focus:outline-none text-sm text-foreground placeholder:text-foreground border-b border-transparent focus:border-primary/40 transition-colors py-0.5"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/40 border-t border-border">
                <td className="w-8 border-r border-border" />
                {block.columns.map((col, ci) => (
                  <td key={col.id} className="px-3 py-2 border-r border-border last:border-r-0 text-sm font-semibold text-foreground tabular-nums">
                    {ci === 0 ? 'Total' : colTotal(col.id)}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Add row */}
        <div className="px-4 py-2.5 border-t border-border bg-muted/10">
          <Button size="sm" variant="outline" onClick={addRow} className="h-7 text-xs gap-1 px-2.5">
            <Plus className="w-3 h-3" />Add Row
          </Button>
        </div>
      </StyledCard>
    </div>
  );
}

// ─── Repayment schedule ───────────────────────────────────────────────────────

function RepaymentScheduleTable({ loans, yearEnd }: { loans: Loan[]; yearEnd: string }) {
  const yr = new Date(yearEnd + 'T00:00:00').getFullYear() || 2024;
  const term = loans.filter(l => l.type !== 'LOC' && l.type !== 'Revolver');

  const buckets: Record<string, number> = {};
  for (let i = 1; i <= 5; i++) buckets[String(yr + i)] = 0;
  buckets['thereafter'] = 0;

  term.forEach(l => {
    const matYear = l.maturityDate
      ? new Date(l.maturityDate + 'T00:00:00').getFullYear()
      : null;
    if (!matYear) return;
    const key = matYear > yr + 5 ? 'thereafter' : String(matYear);
    buckets[key] = (buckets[key] ?? 0) + (l.currentPortion || l.currentBalance || 0);
  });

  const total = Object.values(buckets).reduce((s, v) => s + v, 0);
  const monthName = new Date(yearEnd + 'T00:00:00').toLocaleString('en-CA', { month: 'long' });
  const day = new Date(yearEnd + 'T00:00:00').getDate();
  const cols = [...Array(5).keys()].map(i => String(yr + i + 1));

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-10">
        <tr className="bg-muted border-b border-border">
          <th className="text-left px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap">
            Year ending {monthName} {day}
          </th>
          {cols.map(y => (
            <th key={y} className="text-right px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap">
              {y}
            </th>
          ))}
          <th className="text-right px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap">
            Thereafter
          </th>
          <th className="text-right px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap">
            Total
          </th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-border hover:bg-muted/30">
          <td className="px-3 py-2.5 text-sm text-foreground">Principal repayments ($)</td>
          {cols.map(y => (
            <td key={y} className="px-3 py-2.5 text-right tabular-nums font-mono text-sm text-foreground">
              {CAD(buckets[y] || 0)}
            </td>
          ))}
          <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm text-foreground">
            {CAD(buckets['thereafter'])}
          </td>
          <td className="px-3 py-2.5 text-right tabular-nums font-bold font-mono text-sm text-foreground">
            {CAD(total)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NotesTab() {
  const { loans: storeLoans, continuity, recon, settings } = useStore(s => ({
    loans:      s.loans,
    continuity: s.continuity,
    recon:      s.reconciliation,
    settings:   s.settings,
  }));

  const wpCtx = useWorkpaperLoans();
  const loans = wpCtx ? wpCtx.loans : storeLoans;

  const yearEnd = settings.fiscalYearEnd;
  const fyYear  = new Date(yearEnd + 'T00:00:00').getFullYear();
  const active  = useMemo(() => loans.filter(l => l.status === 'Active'), [loans]);

  // Format full date label, e.g. "12-31-2024"
  const fmtD = (d: Date) => `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}-${d.getFullYear()}`;
  const cyLabel = fmtD(new Date(yearEnd + 'T00:00:00'));
  const pyDate = new Date(yearEnd + 'T00:00:00');
  pyDate.setFullYear(fyYear - 1);
  const pyLabel = fmtD(pyDate);

  // ── Per-loan notes (auto-generated on first render) ───────────────────
  const [loanNotes, setLoanNotes] = useState<Record<string, string>>(() => {
    const notes: Record<string, string> = {};
    loans.filter(l => l.status === 'Active').forEach(l => {
      notes[l.id] = generateLoanNote(l, l.currentBalance);
    });
    return notes;
  });

  // ── Editable amount overrides (user can override TB/continuity values) ──
  const [cyOverrides, setCyOverrides] = useState<Record<string, string>>({});
  const [pyOverrides, setPyOverrides] = useState<Record<string, string>>({});

  // ── Post-to-notes flow ────────────────────────────────────────────────
  const [isPosted, setIsPosted]   = useState(false);
  const [postedAt, setPostedAt]   = useState<Date | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const handlePost = () => {
    setIsPosting(true);
    // Simulate brief async (e.g. save to backend)
    setTimeout(() => {
      setIsPosted(true);
      setPostedAt(new Date());
      setIsPosting(false);
    }, 600);
  };

  const handleUnpost = () => {
    setIsPosted(false);
    setPostedAt(null);
  };

  // ── Additional content blocks ─────────────────────────────────────────
  const [blocks, setBlocks]         = useState<BlockD[]>([]);

  const addBlock = (type: 'table' | 'text') => {
    const id = uid();
    if (type === 'text') {
      setBlocks(prev => [...prev, { id, type: 'text', content: '' }]);
    } else {
      const colId = uid();
      setBlocks(prev => [...prev, {
        id, type: 'table',
        columns: [{ id: colId, label: 'Description' }],
        rows: [],
      }]);
    }
  };

  const updateBlock = (updated: BlockD) =>
    setBlocks(prev => prev.map(b => b.id === updated.id ? updated : b));

  const deleteBlock = (id: string) =>
    setBlocks(prev => prev.filter(b => b.id !== id));

  const moveBlockUp = (id: string) =>
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });

  const saveLoanNote = useCallback((id: string, text: string) => {
    setLoanNotes(prev => ({ ...prev, [id]: text }));
  }, []);

  const regenerateLoanNote = useCallback((id: string) => {
    const loan = loans.find(l => l.id === id);
    if (!loan) return;
    const tb = getTBBalance(id, recon, loan.currentBalance);
    setLoanNotes(prev => ({ ...prev, [id]: generateLoanNote(loan, tb.value) }));
  }, [loans, recon]);

  // ── Totals ────────────────────────────────────────────────────────────
  const totalCY = active.reduce(
    (s, l) => s + getTBBalance(l.id, recon, l.currentBalance).value, 0,
  );
  const totalPY = active.reduce(
    (s, l) => s + (getPriorYearBalance(l.id, continuity) ?? 0), 0,
  );
  const totalCurrent = active.reduce((s, l) => {
    const yr = getYEContinuity(l.id, continuity, yearEnd);
    return s + (yr?.currentPortion ?? l.currentPortion ?? 0);
  }, 0);
  const totalLT = active.reduce((s, l) => {
    const yr = getYEContinuity(l.id, continuity, yearEnd);
    return s + (yr?.longTermPortion ?? l.longTermPortion ?? 0);
  }, 0);
  const hasVariances = active.some(
    l => getTBBalance(l.id, recon, l.currentBalance).hasVariance,
  );

  // ── Amount column width ───────────────────────────────────────────────
  const amtColClass = 'px-3 py-2 align-top w-[13%]';

  return (
    <div className="flex flex-col">

      {/* ── Section header ──────────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-foreground uppercase tracking-widest mb-0.5">{settings.client}</p>
          <h2 className="text-base font-semibold text-foreground">Note — Long-term Debt</h2>
          <p className="text-xs text-foreground mt-0.5">For the year ended {fmtDateDisplay(yearEnd)}</p>
        </div>

        {/* Post / Posted status */}
        <div className="flex items-center gap-2 pt-1 shrink-0">
          {isPosted ? (
            <>
              {/* Posted badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Posted to Notes</span>
                {postedAt && (
                  <span className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70 ml-0.5">
                    · {postedAt.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              {/* Unpost */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUnpost}
                className="text-xs text-foreground gap-1.5 h-8"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Unpost
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handlePost}
              disabled={isPosting}
              className="gap-1.5 h-8 text-xs"
            >
              {isPosting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {isPosting ? 'Posting…' : 'Post to Notes'}
            </Button>
          )}
        </div>
      </div>

      {/* ── Notes table ─────────────────────────────────────────────────── */}
      <div className="px-6">
        <StyledCard className="overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap">
                Long-term Debt
              </span>
              <span className="text-[10px] text-foreground bg-muted rounded-full px-2 py-0.5">
                {active.length} active facilit{active.length === 1 ? 'y' : 'ies'}
              </span>
            </div>
            <span className="text-[10px] text-foreground flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3" />Auto-populated from Loan Register &amp; Continuity
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)', minHeight: '200px' }}>
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-muted border-b border-border">
                  {/* Description column — no label */}
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide" />
                  {/* CY date */}
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap">
                    {cyLabel}
                  </th>
                  {/* PY date */}
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap">
                    {pyLabel}
                  </th>
                </tr>
              </thead>

              <tbody>
                {active.map(l => {
                  const tb = getTBBalance(l.id, recon, l.currentBalance);
                  const py = getPriorYearBalance(l.id, continuity);

                  const cyDisplay = cyOverrides[l.id] ?? NUM(tb.value);
                  const pyDisplay = py !== null
                    ? (pyOverrides[l.id] ?? NUM(py))
                    : (pyOverrides[l.id] ?? '');

                  return (
                    <tr key={l.id} className="border-b border-border hover:bg-muted/10">
                      {/* Editable note */}
                      <td className="px-3 py-2 align-top">
                        <NoteCell
                          loanId={l.id}
                          value={loanNotes[l.id] ?? ''}
                          onChange={saveLoanNote}
                          onRegenerate={regenerateLoanNote}
                        />
                      </td>

                      {/* CY Amount */}
                      <td className={amtColClass}>
                        <AmountCell
                          value={cyDisplay}
                          warning={tb.hasVariance}
                          onChange={v => setCyOverrides(prev => ({ ...prev, [l.id]: v }))}
                        />
                      </td>

                      {/* PY Amount */}
                      <td className={amtColClass}>
                        <AmountCell
                          value={pyDisplay}
                          placeholder={py === null ? 'n/a' : undefined}
                          onChange={v => setPyOverrides(prev => ({ ...prev, [l.id]: v }))}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* sticky tfoot — box-shadow draws the top separator reliably while scrolling */}
              <tfoot className="sticky bottom-0 z-10" style={{ boxShadow: '0 -2px 0 hsl(var(--border))' }}>
                {/* Subtotal row */}
                <tr className="bg-muted">
                  <td className="px-3 py-2 border-b border-border" />
                  <td className={`${amtColClass} border-b border-border`}>
                    <AmountCell value={NUM(totalCY)} readOnly />
                  </td>
                  <td className={`${amtColClass} border-b border-border`}>
                    <AmountCell value={NUM(totalPY)} readOnly />
                  </td>
                </tr>

                {/* Less: current portion */}
                <tr className="bg-muted">
                  <td className="px-3 py-2 text-sm text-foreground pl-7 border-b border-border">Less: current portion</td>
                  <td className={`${amtColClass} border-b border-border`}>
                    <AmountCell value={PARENS(totalCurrent)} readOnly />
                  </td>
                  <td className={`${amtColClass} border-b border-border`}>
                    <AmountCell value="—" readOnly />
                  </td>
                </tr>

                {/* Total long-term */}
                <tr className="bg-muted">
                  <td className="px-3 py-2.5 text-sm font-semibold text-foreground border-b border-border">Total</td>
                  <td className={`${amtColClass} border-b border-border`}>
                    <AmountCell value={NUM(totalLT)} readOnly />
                  </td>
                  <td className={`${amtColClass} border-b border-border`}>
                    <AmountCell value={NUM(totalPY)} readOnly />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Source attribution */}

        </StyledCard>
      </div>

      {/* ── Repayment schedule ───────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-6">
        <StyledCard className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap">
              Principal Repayment Schedule — Next Five Fiscal Years
            </span>
            <span className="text-[10px] text-foreground flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3" />Derived from maturity dates in loan register
            </span>
          </div>
          <div className="overflow-x-auto">
            <RepaymentScheduleTable loans={active} yearEnd={yearEnd} />
          </div>
        </StyledCard>
      </div>

      {/* ── Additional content blocks ────────────────────────────────────── */}
      <div className="px-6 pb-8 flex flex-col gap-4">
        {blocks.map((block, idx) =>
          block.type === 'text' ? (
            <TextBlockEditor
              key={block.id}
              block={block}
              onChange={(id, html) => updateBlock({ ...block, content: html })}
              onDelete={deleteBlock}
              onMoveUp={moveBlockUp}
              canMoveUp={idx > 0}
            />
          ) : (
            <TableBlockEditor
              key={block.id}
              block={block as TableBlockD}
              onChange={updated => updateBlock(updated)}
              onDelete={deleteBlock}
              onMoveUp={moveBlockUp}
              canMoveUp={idx > 0}
            />
          )
        )}

      </div>

    </div>
  );
}
