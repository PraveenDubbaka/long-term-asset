import { Fragment, useState, useMemo } from 'react';
import {
  CheckCircle2, AlertTriangle, ChevronDown, ChevronRight,
  Pencil, Check, X, Info, Send, Plus, Trash2,
} from 'lucide-react';
import { Badge } from '@/components/wp-ui/badge';
import { Button } from '@/components/wp-ui/button';
import type { InvestmentReconGroup, CashReconRow } from '@/lib/luka/compute';
import type { LocalInvJE } from './InvAJEsTab';
import { fmtNum, fmtCcy } from './InvHoldingsTab';
import { fmtDate } from '../lib/utils';
import { ColFilter, ClearFiltersBtn } from './InvTableFilters';
import { CHART_OF_ACCOUNTS } from '@/lib/luka/coa';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  invRecon: InvestmentReconGroup[];
  cashRecon: CashReconRow[];
  onAddToAJEs?: (je: Omit<LocalInvJE, '_id' | 'status' | 'deleted' | 'deletedAt'>) => void;
}

type YearType = 'first' | 'recurring';

/** Side the item sits on in the standard bank recon */
type ReconSide = 'bank' | 'book';

/** Sign effect on the running balance */
type ReconItemType =
  | 'deposit_transit'     // bank side +  (cheque/EFT sent, not yet cleared at bank)
  | 'outstanding_cheque'  // bank side −  (issued, not yet presented)
  | 'bank_credit'         // bank side +  (bank memo credit, not yet in GL)
  | 'bank_debit'          // bank side −  (bank charge/NSF, not yet in GL)
  | 'book_addition'       // book side +  (GL under-stated, e.g. missed entry)
  | 'book_deduction';     // book side −  (GL over-stated, e.g. duplicate entry)

interface ReconItem {
  id: string;
  type: ReconItemType;
  date: string;
  ref: string;
  description: string;
  amount: number;         // always positive; sign derived from type
}

interface SuggestedAJE {
  id:              string;
  category:        'Investment' | 'Cash';
  description:     string;
  dr:              string;
  cr:              string;
  amount:          number;
  ccy:             string;
  note:            string;
  disclosureOnly?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const IIC = 'input-double-border h-9 text-sm px-3 border border-[#dcdfe4] rounded-[10px] bg-white dark:bg-card text-foreground transition-all duration-200 hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)] focus:outline-none focus:ring-0';

const ITEM_TYPE_META: Record<ReconItemType, { label: string; side: ReconSide; sign: 1 | -1; hint: string }> = {
  deposit_transit:    { label: 'Deposit in Transit',      side: 'bank', sign:  1, hint: 'Payment sent by entity but not yet cleared at bank' },
  outstanding_cheque: { label: 'Outstanding Cheque',      side: 'bank', sign: -1, hint: 'Cheque issued but not yet presented for payment'     },
  bank_credit:        { label: 'Bank Credit (unrecorded)',side: 'bank', sign:  1, hint: 'Bank recorded a credit not yet entered in the GL'    },
  bank_debit:         { label: 'Bank Charge / NSF',       side: 'bank', sign: -1, hint: 'Bank fee or NSF not yet recorded in the GL'          },
  book_addition:      { label: 'Book Addition',           side: 'book', sign:  1, hint: 'Understated GL entry — add to reconcile to bank'     },
  book_deduction:     { label: 'Book Deduction',          side: 'book', sign: -1, hint: 'Overstated GL entry — deduct to reconcile to bank'   },
};

const BANK_TYPES: ReconItemType[] = ['deposit_transit', 'outstanding_cheque', 'bank_credit', 'bank_debit'];
const BOOK_TYPES: ReconItemType[] = ['book_addition', 'book_deduction'];

// Pre-populate sample reconciling item for the USD account that has a variance
const DEFAULT_ITEMS: Record<string, ReconItem[]> = {
  D: [
    {
      id:          'di-D-001',
      type:        'outstanding_cheque',
      date:        '2024-12-30',
      ref:         'CHQ-4821',
      description: 'Cheque #4821 — vendor payment issued Dec 30, clearing Jan 3',
      amount:      88.45,
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const StatusPill = ({ ok, label }: { ok: boolean; label: string }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${ok ? 'border-green-500/30 bg-green-500/10 text-green-700' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
    {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
    {label}
  </span>
);

function makeId() { return `ri-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

function buildAJEs(
  invRecon:   InvestmentReconGroup[],
  cashRecon:  CashReconRow[],
  cashEdits:  Record<string, { glBalance?: number; stmtBalance?: number }>,
  reconItems: Record<string, ReconItem[]>,
  yt:         YearType,
): SuggestedAJE[] {
  const out: SuggestedAJE[] = [];

  /* ── Investment variances ──────────────────────────────────────────── */
  for (const g of invRecon) {
    for (const pos of g.positions) {
      if (Math.abs(pos.varianceCost) > 1) {
        const v = pos.varianceCost;
        out.push({
          id:          `inv-cost-${g.sourceId}-${pos.ticker}`,
          category:    'Investment',
          description: `${pos.security} (${pos.ticker}) — cost basis vs. ${g.institution} statement`,
          dr: yt === 'first' ? (v > 0 ? '3200 · Opening Retained Earnings' : '1310 · Investments at Cost')
                             : (v > 0 ? '5900 · Investment Write-down'     : '1310 · Investments at Cost'),
          cr: yt === 'first' ? (v > 0 ? '1310 · Investments at Cost'       : '3200 · Opening Retained Earnings')
                             : (v > 0 ? '1310 · Investments at Cost'       : '4800 · Realized Gain on Investments'),
          amount: Math.abs(v),
          ccy:    pos.ccy,
          note:   yt === 'first'
            ? 'First-year opening TB entry — establish investment at broker-statement cost.'
            : 'AJE to bring investment cost into agreement with broker statement.',
        });
      }
      if (Math.abs(pos.varianceFmv) > 1) {
        out.push({
          id: `inv-fmv-${g.sourceId}-${pos.ticker}`, category: 'Investment',
          description: `${pos.security} (${pos.ticker}) — FMV per schedule vs. ${g.institution} statement`,
          dr: '—', cr: '—', amount: Math.abs(pos.varianceFmv), ccy: pos.ccy,
          note: 'ASPE cost method — FMV is disclosure-only. No journal entry required.',
          disclosureOnly: true,
        });
      }
    }
  }

  /* ── Cash variances (post-reconciliation residual) ─────────────────── */
  for (const c of cashRecon) {
    const gl    = cashEdits[c.sourceId]?.glBalance   ?? c.glBalance;
    const stmt  = cashEdits[c.sourceId]?.stmtBalance ?? c.stmtBalance;
    const items = reconItems[c.sourceId] ?? [];

    const bankAdj = items
      .filter((i) => ITEM_TYPE_META[i.type].side === 'bank')
      .reduce((s, i) => s + ITEM_TYPE_META[i.type].sign * i.amount, 0);
    const bookAdj = items
      .filter((i) => ITEM_TYPE_META[i.type].side === 'book')
      .reduce((s, i) => s + ITEM_TYPE_META[i.type].sign * i.amount, 0);

    const adjBank = stmt + bankAdj;
    const adjBook = gl   + bookAdj;
    const residual = adjBank - adjBook;

    if (Math.abs(residual) > 0.01) {
      out.push({
        id:          `cash-${c.sourceId}`,
        category:    'Cash',
        description: `${c.institution} ····${c.last4} — residual after reconciling items`,
        dr: residual > 0
          ? '1010 · Cash & Bank'
          : (yt === 'first' ? '3200 · Opening Retained Earnings' : '2190 · Reconciling Items Payable'),
        cr: residual > 0
          ? (yt === 'first' ? '3200 · Opening Retained Earnings' : '2190 · Reconciling Items Payable')
          : '1010 · Cash & Bank',
        amount: Math.abs(residual),
        ccy:    c.currency,
        note:   yt === 'first'
          ? `Establish GL at adjusted bank balance of ${adjBank.toFixed(2)} ${c.currency}.`
          : residual > 0
            ? 'Adjusted bank exceeds adjusted book. Record additional cash receipt.'
            : 'Adjusted book exceeds adjusted bank. Record additional cash disbursement.',
      });
    }
  }

  return out;
}

// ─── Inline add-item row ──────────────────────────────────────────────────────

function AddItemRow({
  types,
  onAdd,
  onCancel,
}: {
  types: ReconItemType[];
  onAdd: (item: ReconItem) => void;
  onCancel: () => void;
}) {
  const [type,   setType]   = useState<ReconItemType>(types[0]);
  const [date,   setDate]   = useState('');
  const [ref,    setRef]    = useState('');
  const [desc,   setDesc]   = useState('');
  const [amount, setAmount] = useState('');

  const submit = () => {
    const amt = parseFloat(amount);
    if (!desc.trim()) { toast.error('Description required'); return; }
    if (!amt || amt <= 0) { toast.error('Enter a positive amount'); return; }
    onAdd({ id: makeId(), type, date, ref, description: desc.trim(), amount: amt });
  };

  return (
    <tr className="bg-primary/5 border-b border-border">
      <td className="px-3 py-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ReconItemType)}
          className={`${IIC} w-full text-xs cursor-pointer`}
        >
          {types.map((t) => (
            <option key={t} value={t}>{ITEM_TYPE_META[t].label}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${IIC} w-28`} />
      </td>
      <td className="px-3 py-2">
        <input placeholder="Ref / cheque #" value={ref} onChange={(e) => setRef(e.target.value)} className={`${IIC} w-24`} />
      </td>
      <td className="px-3 py-2">
        <input placeholder="Description…" value={desc} onChange={(e) => setDesc(e.target.value)} className={`${IIC} w-full`} />
      </td>
      <td className="px-3 py-2">
        <input
          type="number" min="0" step="0.01" placeholder="0.00"
          value={amount} onChange={(e) => setAmount(e.target.value)}
          className={`${IIC} w-28 text-right`}
        />
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-1">
          <button onClick={submit} className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600"><Check className="h-3.5 w-3.5" /></button>
          <button onClick={onCancel} className="p-1.5 hover:bg-muted rounded-lg text-foreground"><X className="h-3.5 w-3.5" /></button>
        </div>
      </td>
    </tr>
  );
}

// ─── Per-account bank reconciliation panel ────────────────────────────────────

function BankReconPanel({
  c,
  gl,
  stmt,
  items,
  onItemsChange,
  yearType,
  onAddToAJEs,
}: {
  c: CashReconRow;
  gl: number;
  stmt: number;
  items: ReconItem[];
  onItemsChange: (items: ReconItem[]) => void;
  yearType: YearType;
  onAddToAJEs?: Props['onAddToAJEs'];
}) {
  const [addingBank, setAddingBank] = useState(false);
  const [addingBook, setAddingBook] = useState(false);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [editAmt,    setEditAmt]    = useState('');
  const [editDesc,   setEditDesc]   = useState('');
  const [ajeAcct,    setAjeAcct]    = useState('');

  const bankItems = items.filter((i) => ITEM_TYPE_META[i.type].side === 'bank');
  const bookItems = items.filter((i) => ITEM_TYPE_META[i.type].side === 'book');

  const bankAdj   = bankItems.reduce((s, i) => s + ITEM_TYPE_META[i.type].sign * i.amount, 0);
  const bookAdj   = bookItems.reduce((s, i) => s + ITEM_TYPE_META[i.type].sign * i.amount, 0);
  const adjBank   = stmt + bankAdj;
  const adjBook   = gl   + bookAdj;
  const residual  = adjBank - adjBook;
  const reconciled = Math.abs(residual) < 0.01;

  const addItem = (item: ReconItem) => {
    onItemsChange([...items, item]);
    setAddingBank(false);
    setAddingBook(false);
  };
  const removeItem = (id: string) => onItemsChange(items.filter((i) => i.id !== id));
  const saveEdit   = (id: string) => {
    const amt = parseFloat(editAmt);
    if (!amt || amt <= 0) { toast.error('Invalid amount'); return; }
    onItemsChange(items.map((i) => i.id === id ? { ...i, amount: amt, description: editDesc } : i));
    setEditId(null);
  };

  const f = (n: number) => fmtCcy(n, c.currency);
  const signed = (n: number, forceSign = false) =>
    `${n >= 0 ? (forceSign ? '+' : '') : '−'} ${f(Math.abs(n))}`;

  const handlePostVariance = () => {
    if (!onAddToAJEs || reconciled) return;
    const isPos = residual > 0;
    onAddToAJEs({
      ref:          `BNKVAR-${c.sourceId}`,
      description:  `Bank reconciliation variance — ${c.institution} ····${c.last4}`,
      drAccount:    ajeAcct || (isPos ? '1010 · Cash & Bank' : (yearType === 'first' ? '3200 · Opening Retained Earnings' : '2190 · Reconciling Items Payable')),
      crAccount:    ajeAcct || (isPos ? (yearType === 'first' ? '3200 · Opening Retained Earnings' : '2190 · Reconciling Items Payable') : '1010 · Cash & Bank'),
      drDescription: `Bank recon variance — ${c.institution}`,
      crDescription: `Bank recon variance — ${c.institution}`,
      amount:    Math.abs(residual),
      type:      'Correcting',
      confidence: 'High',
      notes: `Adj. Bank: ${f(adjBank)} | Adj. Book: ${f(adjBook)} | Residual: ${f(residual)} ${c.currency} | ${yearType === 'first' ? 'First Year' : 'Recurring Year'}`,
    });
    toast.success('Variance AJE queued — review in AJEs tab');
  };

  return (
    <div className="p-5 space-y-5 bg-muted/10">

      {/* ── Two-column recon layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Bank Side ── */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Bank Statement Side</span>
            <span className="text-xs text-muted-foreground">{c.currency}</span>
          </div>

          {/* Opening bank balance */}
          <div className="px-4 py-2.5 border-b border-border/50 flex justify-between text-sm">
            <span className="text-muted-foreground">Bank statement closing balance</span>
            <span className="tabular-nums font-medium">{f(stmt)}</span>
          </div>

          {/* Reconciling items */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Item</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Ref</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">Amount</th>
                <th className="w-14"></th>
              </tr>
            </thead>
            <tbody>
              {bankItems.length === 0 && !addingBank && (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-xs text-muted-foreground italic">
                    No reconciling items — add deposits in transit, outstanding cheques, etc.
                  </td>
                </tr>
              )}
              {bankItems.map((item) => (
                <tr key={item.id} className="border-b border-border/30 hover:bg-muted/20">
                  <td className="px-4 py-2 text-xs" colSpan={editId === item.id ? 1 : 1}>
                    {editId === item.id ? (
                      <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className={`${IIC} text-xs w-full`} />
                    ) : (
                      <div>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mr-1 ${
                          ITEM_TYPE_META[item.type].sign > 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {ITEM_TYPE_META[item.type].sign > 0 ? '+' : '−'}
                        </span>
                        {ITEM_TYPE_META[item.type].label}
                        <div className="text-muted-foreground mt-0.5 leading-tight">{item.description}</div>
                        {item.date && <div className="text-muted-foreground text-[10px]">{fmtDate(item.date)}</div>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground font-mono">{item.ref}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-xs">
                    {editId === item.id ? (
                      <input type="number" value={editAmt} onChange={(e) => setEditAmt(e.target.value)} className={`${IIC} w-24 text-right`} />
                    ) : (
                      <span className={ITEM_TYPE_META[item.type].sign > 0 ? 'text-green-700' : 'text-destructive'}>
                        {ITEM_TYPE_META[item.type].sign > 0 ? '+' : '−'}{f(item.amount)}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {editId === item.id ? (
                      <div className="flex gap-0.5">
                        <button onClick={() => saveEdit(item.id)} className="p-1 hover:bg-emerald-50 rounded text-emerald-600"><Check className="h-3 w-3" /></button>
                        <button onClick={() => setEditId(null)} className="p-1 hover:bg-muted rounded text-foreground"><X className="h-3 w-3" /></button>
                      </div>
                    ) : (
                      <div className="flex gap-0.5">
                        <button onClick={() => { setEditId(item.id); setEditAmt(String(item.amount)); setEditDesc(item.description); }} className="p-1 hover:bg-muted rounded text-muted-foreground"><Pencil className="h-3 w-3" /></button>
                        <button onClick={() => removeItem(item.id)} className="p-1 hover:bg-destructive/10 rounded text-destructive"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {/* Add-item inline row */}
              {addingBank && (
                <tr className="bg-primary/5 border-b border-border">
                  <td className="px-3 py-2" colSpan={4}>
                    <AddItemRow
                      types={BANK_TYPES}
                      onAdd={addItem}
                      onCancel={() => setAddingBank(false)}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Add-item button */}
          {!addingBank && (
            <div className="px-4 py-2 border-t border-border/50">
              <button
                onClick={() => setAddingBank(true)}
                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
              >
                <Plus className="h-3 w-3" /> Add reconciling item
              </button>
            </div>
          )}

          {/* Adjusted bank balance */}
          <div className={`px-4 py-3 border-t-2 border-border flex justify-between text-sm font-semibold ${reconciled ? 'bg-green-50' : 'bg-card'}`}>
            <span>Adjusted bank balance</span>
            <span className="tabular-nums">{f(adjBank)}</span>
          </div>
        </div>

        {/* ── Book (GL/TB) Side ── */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">GL / Trial Balance Side</span>
            <span className="text-xs text-muted-foreground">{c.currency}</span>
          </div>

          {/* GL balance */}
          <div className="px-4 py-2.5 border-b border-border/50 flex justify-between text-sm">
            <span className="text-muted-foreground">GL / TB closing balance</span>
            <span className="tabular-nums font-medium">{f(gl)}</span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Item</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Ref</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">Amount</th>
                <th className="w-14"></th>
              </tr>
            </thead>
            <tbody>
              {bookItems.length === 0 && !addingBook && (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-xs text-muted-foreground italic">
                    No book adjustments — add omitted entries, duplicate entries, etc.
                  </td>
                </tr>
              )}
              {bookItems.map((item) => (
                <tr key={item.id} className="border-b border-border/30 hover:bg-muted/20">
                  <td className="px-4 py-2 text-xs">
                    {editId === item.id ? (
                      <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className={`${IIC} text-xs w-full`} />
                    ) : (
                      <div>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mr-1 ${
                          ITEM_TYPE_META[item.type].sign > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {ITEM_TYPE_META[item.type].sign > 0 ? '+' : '−'}
                        </span>
                        {ITEM_TYPE_META[item.type].label}
                        <div className="text-muted-foreground mt-0.5 leading-tight">{item.description}</div>
                        {item.date && <div className="text-muted-foreground text-[10px]">{fmtDate(item.date)}</div>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground font-mono">{item.ref}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-xs">
                    {editId === item.id ? (
                      <input type="number" value={editAmt} onChange={(e) => setEditAmt(e.target.value)} className={`${IIC} w-24 text-right`} />
                    ) : (
                      <span className={ITEM_TYPE_META[item.type].sign > 0 ? 'text-green-700' : 'text-destructive'}>
                        {ITEM_TYPE_META[item.type].sign > 0 ? '+' : '−'}{f(item.amount)}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {editId === item.id ? (
                      <div className="flex gap-0.5">
                        <button onClick={() => saveEdit(item.id)} className="p-1 hover:bg-emerald-50 rounded text-emerald-600"><Check className="h-3 w-3" /></button>
                        <button onClick={() => setEditId(null)} className="p-1 hover:bg-muted rounded text-foreground"><X className="h-3 w-3" /></button>
                      </div>
                    ) : (
                      <div className="flex gap-0.5">
                        <button onClick={() => { setEditId(item.id); setEditAmt(String(item.amount)); setEditDesc(item.description); }} className="p-1 hover:bg-muted rounded text-muted-foreground"><Pencil className="h-3 w-3" /></button>
                        <button onClick={() => removeItem(item.id)} className="p-1 hover:bg-destructive/10 rounded text-destructive"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {addingBook && (
                <tr className="bg-primary/5 border-b border-border">
                  <td className="px-3 py-2" colSpan={4}>
                    <AddItemRow
                      types={BOOK_TYPES}
                      onAdd={addItem}
                      onCancel={() => setAddingBook(false)}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {!addingBook && (
            <div className="px-4 py-2 border-t border-border/50">
              <button
                onClick={() => setAddingBook(true)}
                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
              >
                <Plus className="h-3 w-3" /> Add book adjustment
              </button>
            </div>
          )}

          {/* Adjusted book balance */}
          <div className={`px-4 py-3 border-t-2 border-border flex justify-between text-sm font-semibold ${reconciled ? 'bg-green-50' : 'bg-card'}`}>
            <span>Adjusted book balance</span>
            <span className="tabular-nums">{f(adjBook)}</span>
          </div>
        </div>
      </div>

      {/* ── Variance / reconciliation status ─── */}
      <div className={`rounded-xl border-2 p-4 flex items-center justify-between flex-wrap gap-3 ${
        reconciled ? 'border-green-500/40 bg-green-50' : 'border-destructive/40 bg-destructive/5'
      }`}>
        <div className="flex items-center gap-3">
          {reconciled
            ? <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            : <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
          }
          <div>
            <p className={`text-sm font-semibold ${reconciled ? 'text-green-800' : 'text-destructive'}`}>
              {reconciled ? 'Account fully reconciled' : `Unreconciled variance — ${f(Math.abs(residual))} ${c.currency}`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {reconciled
                ? 'Adjusted bank balance equals adjusted book balance.'
                : residual > 0
                  ? 'Adjusted bank exceeds adjusted book. Add book adjustment or post AJE.'
                  : 'Adjusted book exceeds adjusted bank. Add bank reconciling item or post AJE.'}
            </p>
          </div>
        </div>

        {/* Post variance AJE */}
        {!reconciled && onAddToAJEs && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <select
                value={ajeAcct}
                onChange={(e) => setAjeAcct(e.target.value)}
                className={`${IIC} w-[200px] cursor-pointer pr-8 appearance-none`}
                title="Override AJE account (optional)"
              >
                <option value="">Auto-select account</option>
                {CHART_OF_ACCOUNTS.map((a) => (
                  <option key={a.code} value={`${a.code} · ${a.name}`}>{a.code} · {a.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
            <Button
              variant="default"
              size="sm"
              className="h-8 gap-1.5"
              onClick={handlePostVariance}
            >
              <Send className="h-3.5 w-3.5" />
              Post Variance to AJEs
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function InvBrokerReconTab({ invRecon, cashRecon, onAddToAJEs }: Props) {
  const [yearType, setYearType] = useState<YearType>('recurring');

  const [openReconBroker, setOpenReconBroker] = useState<string | null>(null);
  const [openReconCash,   setOpenReconCash]   = useState<string | null>(null);

  const [cashEdits, setCashEdits] = useState<Record<string, { glBalance?: number; stmtBalance?: number }>>({});
  const [editCashId,   setEditCashId]   = useState<string | null>(null);
  const [editCashData, setEditCashData] = useState<{ glBalance?: number; stmtBalance?: number }>({});

  // Per-account reconciling items (bank side + book side)
  const [reconItems, setReconItems] = useState<Record<string, ReconItem[]>>(DEFAULT_ITEMS);

  const [invFilterCcy,    setInvFilterCcy]    = useState('');
  const [invFilterStatus, setInvFilterStatus] = useState('');
  const [cashFilterCcy,    setCashFilterCcy]    = useState('');
  const [cashFilterStatus, setCashFilterStatus] = useState('');

  const anyInvFilter  = invFilterCcy  || invFilterStatus;
  const anyCashFilter = cashFilterCcy || cashFilterStatus;

  const invCcys  = useMemo(() => Array.from(new Set(invRecon.map((g)  => g.currency))).sort(), [invRecon]);
  const cashCcys = useMemo(() => Array.from(new Set(cashRecon.map((c) => c.currency))).sort(), [cashRecon]);

  const visibleInv = useMemo(() => {
    let rows = invRecon;
    if (invFilterCcy)    rows = rows.filter((g) => g.currency === invFilterCcy);
    if (invFilterStatus) rows = rows.filter((g) => (g.pass ? 'Pass' : 'Variance') === invFilterStatus);
    return rows;
  }, [invRecon, invFilterCcy, invFilterStatus]);

  const visibleCash = useMemo(() => {
    let rows = cashRecon;
    if (cashFilterCcy)    rows = rows.filter((c) => c.currency === cashFilterCcy);
    if (cashFilterStatus) rows = rows.filter((c) => (c.pass ? 'Pass' : 'Variance') === cashFilterStatus);
    return rows;
  }, [cashRecon, cashFilterCcy, cashFilterStatus]);

  const allInv   = invRecon.length;
  const passInv  = invRecon.filter((g) => g.pass).length;

  /** Compute per-account adjusted balances to determine pass/fail */
  const cashStatus = useMemo(() => {
    return cashRecon.map((c) => {
      const gl    = cashEdits[c.sourceId]?.glBalance   ?? c.glBalance;
      const stmt  = cashEdits[c.sourceId]?.stmtBalance ?? c.stmtBalance;
      const items = reconItems[c.sourceId] ?? [];
      const bankAdj = items.filter((i) => ITEM_TYPE_META[i.type].side === 'bank').reduce((s, i) => s + ITEM_TYPE_META[i.type].sign * i.amount, 0);
      const bookAdj = items.filter((i) => ITEM_TYPE_META[i.type].side === 'book').reduce((s, i) => s + ITEM_TYPE_META[i.type].sign * i.amount, 0);
      const residual = (stmt + bankAdj) - (gl + bookAdj);
      return { sourceId: c.sourceId, reconciled: Math.abs(residual) < 0.01 };
    });
  }, [cashRecon, cashEdits, reconItems]);

  const allCash  = cashRecon.length;
  const passCash = cashStatus.filter((s) => s.reconciled).length;
  const totalAll  = allInv + allCash;
  const totalPass = passInv + passCash;

  /* ── Overall investment summary ─── */
  const invSummary = useMemo(() => {
    const positions = invRecon.flatMap((g) => g.positions);
    const totalScheduleCost = positions.reduce((s, p) => s + p.perScheduleCost, 0);
    const totalStmtCost     = positions.reduce((s, p) => s + p.perStmtCost,     0);
    const totalScheduleFmv  = positions.reduce((s, p) => s + p.perScheduleFmv,  0);
    const totalStmtFmv      = positions.reduce((s, p) => s + p.perStmtFmv,      0);
    return {
      totalScheduleCost, totalStmtCost, costVariance: totalScheduleCost - totalStmtCost,
      totalScheduleFmv,  totalStmtFmv,  fmvVariance:  totalScheduleFmv  - totalStmtFmv,
    };
  }, [invRecon]);

  /* ── Suggested AJEs ─── */
  const suggestedAJEs = useMemo(
    () => buildAJEs(invRecon, cashRecon, cashEdits, reconItems, yearType),
    [invRecon, cashRecon, cashEdits, reconItems, yearType],
  );
  const realAJEs       = suggestedAJEs.filter((e) => !e.disclosureOnly);
  const disclosureItems = suggestedAJEs.filter((e) => e.disclosureOnly);

  const StatusPillLocal = ({ ok, label }: { ok: boolean; label: string }) => (
    <StatusPill ok={ok} label={label} />
  );

  return (
    <div className="px-6 py-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Reconciliation</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {totalAll} accounts · {totalPass} Pass · {totalAll - totalPass} with variance · $0.01 threshold
          </p>
        </div>
        <div className="flex items-center gap-3">
          {totalPass === totalAll
            ? <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border border-green-500/30 bg-green-500/10 text-green-700"><CheckCircle2 className="h-3.5 w-3.5" /> All Reconciled</span>
            : <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border border-destructive/30 bg-destructive/10 text-destructive"><AlertTriangle className="h-3.5 w-3.5" /> {totalAll - totalPass} Variance{totalAll - totalPass > 1 ? 's' : ''}</span>
          }
          <div className="flex items-center gap-1 bg-muted/60 rounded-[10px] p-1 border border-border">
            {(['first', 'recurring'] as YearType[]).map((t) => (
              <button key={t} onClick={() => setYearType(t)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all duration-150 font-medium ${yearType === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t === 'first' ? 'First Year' : 'Recurring Year'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Investment Statement Recon</p>
            <StatusPillLocal ok={passInv === allInv} label={passInv === allInv ? 'All Pass' : `${allInv - passInv} Variance`} />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground"><span>Accounts reconciled</span><span className="tabular-nums font-medium text-foreground">{passInv} / {allInv}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Total cost (schedule)</span><span className="tabular-nums font-mono text-foreground">{fmtNum(invSummary.totalScheduleCost)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Total cost (statements)</span><span className="tabular-nums font-mono text-foreground">{fmtNum(invSummary.totalStmtCost)}</span></div>
            <div className={`flex justify-between font-medium border-t border-border pt-2 ${Math.abs(invSummary.costVariance) > 1 ? 'text-destructive' : 'text-green-700'}`}>
              <span>Cost variance</span><span className="tabular-nums font-mono">{invSummary.costVariance >= 0 ? '+' : ''}{fmtNum(invSummary.costVariance)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground border-t border-border/50 pt-2">
              <span>FMV variance (disclosure only)</span><span className="tabular-nums font-mono text-foreground">{invSummary.fmvVariance >= 0 ? '+' : ''}{fmtNum(invSummary.fmvVariance)}</span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bank Account Recon</p>
            <StatusPillLocal ok={passCash === allCash} label={passCash === allCash ? 'All Pass' : `${allCash - passCash} Variance`} />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground"><span>Accounts reconciled</span><span className="tabular-nums font-medium text-foreground">{passCash} / {allCash}</span></div>
            {cashStatus.map((s) => {
              const c = cashRecon.find((c) => c.sourceId === s.sourceId)!;
              const gl   = cashEdits[c.sourceId]?.glBalance   ?? c.glBalance;
              const stmt = cashEdits[c.sourceId]?.stmtBalance ?? c.stmtBalance;
              const items = reconItems[c.sourceId] ?? [];
              const bankAdj = items.filter((i) => ITEM_TYPE_META[i.type].side === 'bank').reduce((ss, i) => ss + ITEM_TYPE_META[i.type].sign * i.amount, 0);
              const bookAdj = items.filter((i) => ITEM_TYPE_META[i.type].side === 'book').reduce((ss, i) => ss + ITEM_TYPE_META[i.type].sign * i.amount, 0);
              const residual = (stmt + bankAdj) - (gl + bookAdj);
              return (
                <div key={s.sourceId} className={`flex justify-between ${Math.abs(residual) > 0.01 ? 'text-destructive font-medium' : 'text-green-700'} border-t border-border/50 pt-1.5`}>
                  <span className="text-muted-foreground font-normal">{c.institution} ····{c.last4} ({c.currency})</span>
                  <span className="tabular-nums font-mono">{Math.abs(residual) < 0.01 ? '✓ Reconciled' : `Δ ${fmtCcy(residual, c.currency)}`}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Investment statements ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border font-semibold text-sm flex items-center justify-between flex-wrap gap-2">
          <span>Investment statements</span>
          {anyInvFilter && <ClearFiltersBtn onClick={() => { setInvFilterCcy(''); setInvFilterStatus(''); }} />}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="w-8 px-4 py-3"></th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Institution</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Acct</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"><ColFilter label="CCY" options={invCcys} value={invFilterCcy} onChange={setInvFilterCcy} /></th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Units</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cost</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">FMV</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"><ColFilter label="Status" options={['Pass', 'Variance']} value={invFilterStatus} onChange={setInvFilterStatus} /></th>
            </tr>
          </thead>
          <tbody>
            {visibleInv.map((g) => {
              const open    = openReconBroker === g.sourceId;
              const unitsOk = g.positions.every((r) => Math.abs(r.varianceUnits) < 0.001);
              const costOk  = g.positions.every((r) => Math.abs(r.varianceCost)  < 1);
              const fmvOk   = g.positions.every((r) => Math.abs(r.varianceFmv)   < 1);
              return (
                <Fragment key={g.sourceId}>
                  <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setOpenReconBroker(open ? null : g.sourceId)}>
                    <td className="px-4 py-3">{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{g.sourceId}</Badge></td>
                    <td className="px-4 py-3 font-medium text-sm">{g.institution}</td>
                    <td className="px-4 py-3 font-mono text-xs">····{g.last4}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs font-mono">{g.currency}</Badge></td>
                    <td className="px-4 py-3 text-center">{unitsOk ? <CheckCircle2 className="h-4 w-4 text-green-600 inline" /> : <AlertTriangle className="h-4 w-4 text-destructive inline" />}</td>
                    <td className="px-4 py-3 text-center">{costOk  ? <CheckCircle2 className="h-4 w-4 text-green-600 inline" /> : <AlertTriangle className="h-4 w-4 text-destructive inline" />}</td>
                    <td className="px-4 py-3 text-center">{fmvOk   ? <CheckCircle2 className="h-4 w-4 text-green-600 inline" /> : <AlertTriangle className="h-4 w-4 text-destructive inline" />}</td>
                    <td className="px-4 py-3 text-center"><StatusPillLocal ok={g.pass} label={g.pass ? 'Pass' : 'Variance'} /></td>
                  </tr>
                  {open && (
                    <tr className="bg-muted/20">
                      <td colSpan={9} className="p-0">
                        <div className="p-4 overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border bg-muted/30">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Security</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Units (Sched / Stmt / Δ)</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cost (Sched / Stmt / Δ)</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">FMV (Sched / Stmt / Δ)</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {g.positions.map((r) => (
                                <tr key={r.ticker} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                  <td className="px-4 py-3 text-sm"><div className="font-medium">{r.security}</div><div className="text-xs text-muted-foreground font-mono">{r.ticker}</div></td>
                                  <td className="px-4 py-3 text-right tabular-nums text-xs">{fmtNum(r.perScheduleUnits, 0)} / {fmtNum(r.perStmtUnits, 0)} / <span className={Math.abs(r.varianceUnits) > 0.001 ? 'font-medium text-foreground' : 'text-muted-foreground'}>{r.varianceUnits >= 0 ? '+' : ''}{fmtNum(r.varianceUnits, 0)}</span></td>
                                  <td className="px-4 py-3 text-right tabular-nums text-xs">{fmtCcy(r.perScheduleCost, r.ccy)} / {fmtCcy(r.perStmtCost, r.ccy)} / <span className={Math.abs(r.varianceCost) > 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}>{fmtCcy(r.varianceCost, r.ccy)}</span></td>
                                  <td className="px-4 py-3 text-right tabular-nums text-xs">{fmtCcy(r.perScheduleFmv, r.ccy)} / {fmtCcy(r.perStmtFmv, r.ccy)} / <span className={Math.abs(r.varianceFmv) > 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}>{fmtCcy(r.varianceFmv, r.ccy)}</span></td>
                                  <td className="px-4 py-3 text-center">{r.pass ? <CheckCircle2 className="h-4 w-4 text-green-600 inline" /> : <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast('Scroll to Suggested AJEs below')}>View AJE ↓</Button>}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {visibleInv.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-6 text-center text-sm text-muted-foreground">{anyInvFilter ? 'No accounts match filters.' : 'No investment accounts.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Cash / Bank accounts (full bank recon) ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border font-semibold text-sm flex items-center justify-between flex-wrap gap-2">
          <div>
            <span>Bank accounts</span>
            <span className="text-xs text-muted-foreground font-normal ml-2">
              Click an account to open its reconciliation schedule
            </span>
          </div>
          {anyCashFilter && <ClearFiltersBtn onClick={() => { setCashFilterCcy(''); setCashFilterStatus(''); }} />}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="w-8 px-4 py-3"></th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Account</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"><ColFilter label="CCY" options={cashCcys} value={cashFilterCcy} onChange={setCashFilterCcy} /></th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">GL Balance</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stmt Balance</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Adj. Bank</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Adj. Book</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Residual</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"><ColFilter label="Status" options={['Pass', 'Variance']} value={cashFilterStatus} onChange={setCashFilterStatus} /></th>
              <th className="px-3 py-3 w-16 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleCash.map((c) => {
              const open     = openReconCash === c.sourceId;
              const gl       = cashEdits[c.sourceId]?.glBalance   ?? c.glBalance;
              const stmt     = cashEdits[c.sourceId]?.stmtBalance ?? c.stmtBalance;
              const items    = reconItems[c.sourceId] ?? [];
              const bankAdj  = items.filter((i) => ITEM_TYPE_META[i.type].side === 'bank').reduce((s, i) => s + ITEM_TYPE_META[i.type].sign * i.amount, 0);
              const bookAdj  = items.filter((i) => ITEM_TYPE_META[i.type].side === 'book').reduce((s, i) => s + ITEM_TYPE_META[i.type].sign * i.amount, 0);
              const adjBank  = stmt + bankAdj;
              const adjBook  = gl   + bookAdj;
              const residual = adjBank - adjBook;
              const isRecon  = Math.abs(residual) < 0.01;
              return (
                <Fragment key={c.sourceId}>
                  <tr
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer${open ? ' bg-muted/20' : ''}`}
                    onClick={(e) => { if ((e.target as HTMLElement).closest('button,input,select')) return; setOpenReconCash(open ? null : c.sourceId); }}
                  >
                    <td className="px-4 py-3">{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</td>
                    <td className="px-4 py-3 font-medium text-sm">{c.institution} <span className="font-mono text-xs text-muted-foreground">····{c.last4}</span></td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs font-mono">{c.currency}</Badge></td>

                    {/* GL balance — editable */}
                    <td className="px-4 py-3 text-right tabular-nums text-sm">
                      {editCashId === c.sourceId
                        ? <input type="number" value={editCashData.glBalance ?? 0} onChange={(e) => setEditCashData((d) => ({...d, glBalance: parseFloat(e.target.value)||0}))} className={`${IIC} w-32 text-right`} onClick={(e) => e.stopPropagation()} />
                        : fmtCcy(gl, c.currency)}
                    </td>

                    {/* Stmt balance — editable */}
                    <td className="px-4 py-3 text-right tabular-nums text-sm">
                      {editCashId === c.sourceId
                        ? <input type="number" value={editCashData.stmtBalance ?? 0} onChange={(e) => setEditCashData((d) => ({...d, stmtBalance: parseFloat(e.target.value)||0}))} className={`${IIC} w-32 text-right`} onClick={(e) => e.stopPropagation()} />
                        : fmtCcy(stmt, c.currency)}
                    </td>

                    <td className="px-4 py-3 text-right tabular-nums text-sm text-muted-foreground">{fmtCcy(adjBank, c.currency)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm text-muted-foreground">{fmtCcy(adjBook, c.currency)}</td>

                    {/* Residual */}
                    <td className={`px-4 py-3 text-right tabular-nums font-medium text-sm ${isRecon ? 'text-green-700' : 'text-destructive'}`}>
                      {isRecon ? '—' : (residual >= 0 ? '+' : '') + fmtCcy(residual, c.currency)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <StatusPillLocal ok={isRecon} label={isRecon ? 'Pass' : 'Variance'} />
                    </td>

                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      {editCashId === c.sourceId ? (
                        <div className="flex gap-0.5">
                          <button onClick={() => { setCashEdits((p) => ({...p, [c.sourceId]: editCashData})); setEditCashId(null); toast('Balances updated'); }} className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600"><Check className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setEditCashId(null)} className="p-1.5 hover:bg-muted rounded-lg text-foreground"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditCashId(c.sourceId); setEditCashData({ glBalance: gl, stmtBalance: stmt }); }} className="p-1.5 hover:bg-muted rounded-lg text-foreground" title="Edit GL / Stmt balances"><Pencil className="h-3.5 w-3.5" /></button>
                      )}
                    </td>
                  </tr>

                  {/* ── Full bank recon panel ── */}
                  {open && (
                    <tr className="bg-muted/10">
                      <td colSpan={10} className="p-0">
                        <BankReconPanel
                          c={c}
                          gl={gl}
                          stmt={stmt}
                          items={reconItems[c.sourceId] ?? []}
                          onItemsChange={(updated) => setReconItems((prev) => ({ ...prev, [c.sourceId]: updated }))}
                          yearType={yearType}
                          onAddToAJEs={onAddToAJEs}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {visibleCash.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-6 text-center text-sm text-muted-foreground">{anyCashFilter ? 'No accounts match filters.' : 'No cash accounts.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Suggested Adjusting Entries ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="font-semibold text-sm">Suggested Adjusting Entries</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {yearType === 'first'
                ? 'First-year client — entries establish the opening trial balance from broker and bank statements.'
                : 'Recurring year — entries post as period-end AJEs to agree GL to external statements.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {realAJEs.length > 0 && <Badge variant="destructive" className="text-xs">{realAJEs.length} entr{realAJEs.length > 1 ? 'ies' : 'y'} required</Badge>}
            {disclosureItems.length > 0 && <Badge variant="info" className="text-xs">{disclosureItems.length} disclosure note{disclosureItems.length > 1 ? 's' : ''}</Badge>}
          </div>
        </div>

        {suggestedAJEs.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">All accounts reconcile</p>
            <p className="text-xs text-muted-foreground mt-1">No adjusting entries required.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Debit</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Credit</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Note</th>
                <th className="px-3 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {suggestedAJEs.map((aje) => (
                <tr key={aje.id} className={`border-b border-border/50 transition-colors ${aje.disclosureOnly ? 'bg-muted/10 opacity-70' : 'hover:bg-muted/30'}`}>
                  <td className="px-4 py-3"><Badge variant={aje.category === 'Investment' ? 'info' : 'secondary'} className="text-xs whitespace-nowrap">{aje.category}</Badge></td>
                  <td className="px-4 py-3 text-sm"><div className="font-medium text-foreground">{aje.description}</div></td>
                  <td className="px-4 py-3 text-xs font-mono text-foreground">{aje.disclosureOnly ? <span className="text-muted-foreground italic">n/a</span> : aje.dr}</td>
                  <td className="px-4 py-3 text-xs font-mono text-foreground">{aje.disclosureOnly ? <span className="text-muted-foreground italic">n/a</span> : aje.cr}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-sm font-medium">
                    {aje.disclosureOnly ? <span className="text-xs text-muted-foreground">Disclosure</span> : <>{fmtNum(aje.amount)} <span className="text-xs text-muted-foreground font-normal">{aje.ccy}</span></>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[260px]">{aje.note}</td>
                  <td className="px-3 py-3">
                    {aje.disclosureOnly
                      ? <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Info className="h-3 w-3" /> Note only</span>
                      : (
                        <Button size="sm" variant="outline" className="h-7 text-xs whitespace-nowrap gap-1"
                          onClick={() => {
                            if (onAddToAJEs) {
                              onAddToAJEs({
                                ref: `REC-${aje.id.slice(0, 12)}`,
                                description: aje.description,
                                drAccount: aje.dr, crAccount: aje.cr,
                                drDescription: aje.description, crDescription: aje.description,
                                amount: aje.amount, type: 'Correcting', confidence: 'Medium',
                                notes: `Source: Recon · ${yearType === 'first' ? 'First Year' : 'Recurring Year'} · ${aje.note}`,
                              });
                              toast.success('AJE queued — review in AJEs tab');
                            }
                          }}
                        >
                          <Send className="!w-3 !h-3" /> Add to AJEs
                        </Button>
                      )
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}

