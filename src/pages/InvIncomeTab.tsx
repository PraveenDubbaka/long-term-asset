import React, { useState } from 'react';
import { Download, DollarSign, Percent, CreditCard, AlertCircle, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/wp-ui/dialog';
import { incomeExpenseRows as initialRows } from '../data/investmentData';
import { fmtDateDisplay } from '../lib/utils';
import type { IncomeExpenseRow, IncomeExpenseType, InvCurrency } from '../types/investmentTypes';
import toast from 'react-hot-toast';

function fmt(n: number, d = 2) { return n.toLocaleString('en-CA', { minimumFractionDigits: d, maximumFractionDigits: d }); }
function fmtCAD(n: number) { return (n < 0 ? '(' : '') + '$' + fmt(Math.abs(n)) + (n < 0 ? ')' : ''); }

const TYPE_CFG: Record<IncomeExpenseType, { variant: string; label: string }> = {
  'Interest Income':   { variant: 'success',    label: 'Interest'     },
  'Account Fees':      { variant: 'warning',     label: 'Acct Fees'   },
  'Management Fees':   { variant: 'warning',     label: 'Mgmt Fees'   },
  'DRIP':              { variant: 'info',         label: 'DRIP'        },
  'Withholding Tax':   { variant: 'destructive',  label: 'WHT'         },
  'Return of Capital': { variant: 'secondary',    label: 'ROC'         },
  'Capital Dividend':  { variant: 'inProgress',   label: 'Cap. Div.'   },
  'Accrued Interest':  { variant: 'outline',      label: 'Accrued Int.'},
  'Other':             { variant: 'outline',      label: 'Other'       },
};
const ALL_TYPES: IncomeExpenseType[] = [
  'Interest Income','Account Fees','Management Fees','DRIP',
  'Withholding Tax','Return of Capital','Capital Dividend','Accrued Interest','Other',
];
const GL_DEFAULTS: Partial<Record<IncomeExpenseType, string>> = {
  'Interest Income': '4010', 'Account Fees': '5020', 'Management Fees': '5030',
  'DRIP': '4030', 'Withholding Tax': '6150', 'Return of Capital': '1310',
  'Capital Dividend': '4020', 'Accrued Interest': '1150',
};
const CURRENCIES: InvCurrency[] = ['CAD', 'USD', 'EUR', 'GBP'];

// Inline-cell input styles — global design system (matches Long-term Asset form style)
const BASE = 'input-double-border w-full h-8 text-xs rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground placeholder:text-foreground/60 transition-all duration-200 hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)] focus:outline-none';
const CI  = `${BASE} px-2.5`;
const CIS = `${BASE} pl-2.5 pr-6 appearance-none cursor-pointer`;
const CIN = `${BASE} px-2.5 text-right tabular-nums`;

type IncomeDraft = Omit<IncomeExpenseRow, 'id'>;

function blankDraft(): IncomeDraft {
  return {
    date: new Date().toISOString().slice(0, 10),
    broker: '', acctLast4: '', cashAccount: '',
    txnType: 'Interest Income', security: '', ticker: '',
    description: '', localAmount: 0, currency: 'CAD',
    fxRate: 1, cadAmount: 0, glAccount: '4010',
    taxSlip: '', acbImpact: false, notes: '', ajeStatus: 'none',
  };
}

export function InvIncomeTab() {
  const [rowsState,    setRowsState]    = useState<IncomeExpenseRow[]>([...initialRows]);
  const [filterType,   setFilterType]   = useState<'All' | IncomeExpenseType>('All');
  const [filterBroker, setFilterBroker] = useState('All');
  const [sortDir,      setSortDir]      = useState<'asc' | 'desc'>('asc');
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [draft,        setDraft]        = useState<IncomeDraft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

  const upd = (patch: Partial<IncomeDraft>) => setDraft(prev => prev ? { ...prev, ...patch } : prev);

  const brokers = ['All', ...Array.from(new Set(rowsState.map(r => r.broker)))];

  const filtered = rowsState
    .filter(r =>
      (filterType   === 'All' || r.txnType === filterType) &&
      (filterBroker === 'All' || r.broker  === filterBroker)
    )
    .sort((a, b) => { const d = a.date.localeCompare(b.date); return sortDir === 'asc' ? d : -d; });

  const totalInterest = filtered.filter(r => r.txnType === 'Interest Income' || r.txnType === 'Accrued Interest').reduce((s, r) => s + r.cadAmount, 0);
  const totalFees     = filtered.filter(r => r.txnType === 'Account Fees' || r.txnType === 'Management Fees').reduce((s, r) => s + r.cadAmount, 0);
  const totalWHT      = filtered.filter(r => r.txnType === 'Withholding Tax').reduce((s, r) => s + Math.abs(r.cadAmount), 0);
  const totalAcbRows  = filtered.filter(r => r.acbImpact).length;

  const startAdd  = () => { setEditingId('new'); setDraft(blankDraft()); };
  const startEdit = (r: IncomeExpenseRow) => {
    const { id: _id, ...rest } = r;
    setEditingId(r.id); setDraft(rest);
  };
  const cancelEdit = () => { setEditingId(null); setDraft(null); };

  const saveRow = () => {
    if (!draft) return;
    if (!draft.description.trim()) { toast.error('Description is required'); return; }
    if (!draft.broker.trim())      { toast.error('Broker is required');       return; }
    const isForeign = draft.currency !== 'CAD';
    const fxRate    = isForeign ? draft.fxRate : 1;
    const cadAmount = draft.localAmount * fxRate;
    const saved     = { ...draft, fxRate, cadAmount };
    if (editingId === 'new') {
      setRowsState(prev => [{ id: `IE-${Date.now()}`, ...saved }, ...prev]);
      toast.success('Entry added');
    } else {
      setRowsState(prev => prev.map(r => r.id === editingId ? { id: editingId, ...saved } : r));
      toast.success('Entry updated');
    }
    cancelEdit();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setRowsState(prev => prev.filter(r => r.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success('Entry removed');
  };

  const handleExport = async () => {
    try {
      const rows = filtered.map(r => ({
        Date: r.date, Broker: r.broker, Account: `…${r.acctLast4}`, Type: r.txnType,
        Description: r.description, Security: r.security ?? '', Ticker: r.ticker ?? '',
        'Local Amount': r.localAmount, CCY: r.currency, 'FX Rate': r.fxRate, 'CAD Amount': r.cadAmount,
        'GL Account': r.glAccount, 'Tax Slip': r.taxSlip ?? '', 'ACB Impact': r.acbImpact ? 'Yes' : '', Notes: r.notes ?? '',
      }));
      const { exportToExcel, objsToAOA } = await import('../lib/utils');
      exportToExcel({ 'Income & Expenses': objsToAOA(rows) }, 'INV_Income_Expenses_FY2025.xlsx');
      toast.success('Income & Expenses exported');
    } catch { toast.error('Export failed'); }
  };

  // ── Inline edit/add row ──────────────────────────────────────────────────────
  const EditRow = () => {
    if (!draft) return null;
    const isForeign = draft.currency !== 'CAD';
    const cadAmt    = draft.localAmount * (isForeign ? draft.fxRate : 1);
    return (
      <tr className="bg-primary/5 border-l-[3px] border-l-primary">
        {/* Date */}
        <td className="px-2 py-2">
          <input className={CI} type="date" value={draft.date} onChange={e => upd({ date: e.target.value })} />
        </td>
        {/* Broker + Acct */}
        <td className="px-2 py-2 space-y-0.5">
          <input className={CI} value={draft.broker} onChange={e => upd({ broker: e.target.value })} placeholder="Broker *" />
          <input className={CI} value={draft.acctLast4} onChange={e => upd({ acctLast4: e.target.value.slice(0, 4) })} placeholder="Last 4" maxLength={4} />
        </td>
        {/* Type */}
        <td className="px-2 py-2">
          <div className="relative">
            <select className={CIS} value={draft.txnType}
              onChange={e => {
                const t = e.target.value as IncomeExpenseType;
                upd({ txnType: t, glAccount: GL_DEFAULTS[t] ?? draft.glAccount });
              }}>
              {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </td>
        {/* Description */}
        <td className="px-2 py-2">
          <input className={CI} value={draft.description} onChange={e => upd({ description: e.target.value })} placeholder="Description *" />
        </td>
        {/* Security + Ticker */}
        <td className="px-2 py-2 space-y-0.5">
          <input className={CI} value={draft.security ?? ''} onChange={e => upd({ security: e.target.value })} placeholder="Security" />
          <input className={CI} value={draft.ticker ?? ''} onChange={e => upd({ ticker: e.target.value.toUpperCase() })} placeholder="Ticker" />
        </td>
        {/* Local Amount */}
        <td className="px-2 py-2">
          <input className={CIN} type="number" step="0.01" value={draft.localAmount || ''} onChange={e => upd({ localAmount: +e.target.value })} placeholder="0.00" />
        </td>
        {/* CCY */}
        <td className="px-2 py-2">
          <div className="relative">
            <select className={CIS} value={draft.currency} onChange={e => upd({ currency: e.target.value as InvCurrency, fxRate: 1 })}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </td>
        {/* FX Rate */}
        <td className="px-2 py-2">
          {isForeign
            ? <input className={CIN} type="number" step="0.0001" value={draft.fxRate || ''} onChange={e => upd({ fxRate: +e.target.value })} placeholder="1.0000" />
            : <span className="text-xs text-foreground/40 block text-right">—</span>}
        </td>
        {/* CAD Amt - computed */}
        <td className="px-2 py-2 text-right tabular-nums font-mono text-xs text-foreground/60">
          {fmtCAD(cadAmt)}
        </td>
        {/* GL Account */}
        <td className="px-2 py-2">
          <input className={CI} value={draft.glAccount} onChange={e => upd({ glAccount: e.target.value })} placeholder="4010" />
        </td>
        {/* Tax Slip + ACB */}
        <td className="px-2 py-2 space-y-0.5">
          <input className={CI} value={draft.taxSlip ?? ''} onChange={e => upd({ taxSlip: e.target.value })} placeholder="Tax slip" />
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="checkbox" checked={!!draft.acbImpact} onChange={e => upd({ acbImpact: e.target.checked })} className="rounded h-3 w-3" />
            <span className="text-xs text-foreground">ACB</span>
          </label>
        </td>
        {/* Notes */}
        <td className="px-2 py-2">
          <input className={CI} value={draft.notes ?? ''} onChange={e => upd({ notes: e.target.value })} placeholder="Notes" />
        </td>
        {/* Save / Cancel */}
        <td className="px-2 py-2">
          <div className="flex items-center gap-1">
            <Button size="icon-sm" variant="default" onClick={saveRow} title="Save">
              <Check className="w-3 h-3" />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={cancelEdit} title="Cancel">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Income &amp; Expenses</h2>
          <p className="text-xs text-foreground mt-0.5">Non-capital income and expenses through investment accounts · FY January 1 – December 31, 2025</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button variant="default" size="sm" onClick={startAdd} disabled={!!editingId}>
            <Plus className="w-3.5 h-3.5" /> Add Entry
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Interest Income',    value: totalInterest, icon: DollarSign,  color: 'text-green-600', sub: 'incl. accruals'  },
          { label: 'Fees (Acct + Mgmt)', value: totalFees,     icon: CreditCard,  color: 'text-amber-600', sub: 'semi-annual'     },
          { label: 'Withholding Tax',    value: totalWHT,      icon: Percent,     color: 'text-red-500',   sub: 'claimable T2209' },
          { label: 'ROC / DRIP Rows',   value: totalAcbRows,  icon: AlertCircle, color: 'text-primary',   sub: 'ACB-impacting', isCount: true },
        ].map(k => (
          <StyledCard key={k.label} className="p-3 flex items-center gap-3">
            <k.icon className={`w-7 h-7 ${k.color} opacity-80 flex-shrink-0`} />
            <div>
              <div className={`text-sm font-bold tabular-nums ${k.color}`}>
                {(k as { isCount?: boolean }).isCount ? k.value : `$${fmt(k.value as number)}`}
              </div>
              <div className="text-xs text-foreground leading-tight">{k.label}</div>
              <div className="text-xs text-foreground opacity-70">{k.sub}</div>
            </div>
          </StyledCard>
        ))}
      </div>

      {/* Filters */}
      <StyledCard className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1">
            {(['All', ...ALL_TYPES] as const).map(t => (
              <button key={t} onClick={() => setFilterType(t as typeof filterType)}
                className={`px-2 py-0.5 text-xs rounded-md border transition-colors ${
                  filterType === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                }`}>{t === 'All' ? 'All Types' : TYPE_CFG[t as IncomeExpenseType]?.label ?? t}</button>
            ))}
          </div>
          <select value={filterBroker} onChange={e => setFilterBroker(e.target.value)}
            className="h-8 px-2 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary">
            {brokers.map(b => <option key={b}>{b}</option>)}
          </select>
          <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            className="h-8 px-3 text-xs rounded-md border border-border hover:bg-muted flex items-center gap-1">
            Date {sortDir === 'asc' ? '↑' : '↓'}
          </button>
          {(filterType !== 'All' || filterBroker !== 'All') && (
            <button onClick={() => { setFilterType('All'); setFilterBroker('All'); }}
              className="text-xs text-foreground hover:text-foreground underline underline-offset-2">Clear</button>
          )}
        </div>
      </StyledCard>

      {/* Table */}
      <StyledCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap">Date</th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">Broker</th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">Type</th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">Description</th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">Security</th>
                <th className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap">Local Amt</th>
                <th className="text-center px-2 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">CCY</th>
                <th className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap">FX Rate</th>
                <th className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap">CAD Amt</th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap">GL Acct</th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">Tax Slip</th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground">Notes</th>
                <th className="w-16 px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* New entry inline */}
              {editingId === 'new' && draft && <EditRow key="new" />}

              {filtered.map(r => {
                if (editingId === r.id && draft) return <EditRow key={r.id} />;
                return (
                  <tr key={r.id}
                    className={`group hover:bg-muted/30 transition-colors ${r.acbImpact ? 'bg-blue-50/40' : ''} ${r.txnType === 'Withholding Tax' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-3 py-2 text-xs text-foreground whitespace-nowrap">{fmtDateDisplay(r.date)}</td>
                    <td className="px-3 py-2">
                      <div className="text-xs text-foreground">{r.broker.replace(' Investing', '').replace(' Investments', '')}</div>
                      <div className="text-xs text-foreground font-mono">…{r.acctLast4}</div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={TYPE_CFG[r.txnType]?.variant as Parameters<typeof Badge>[0]['variant'] ?? 'outline'} className="text-xs whitespace-nowrap">
                        {TYPE_CFG[r.txnType]?.label ?? r.txnType}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-xs text-foreground max-w-[180px]">
                      <span className="line-clamp-2">{r.description}</span>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {r.security
                        ? <><div className="text-foreground">{r.security}</div><div className="text-foreground font-mono">{r.ticker}</div></>
                        : <span className="text-foreground/40">—</span>}
                    </td>
                    <td className={`px-3 py-2 text-right tabular-nums font-mono text-sm ${r.localAmount < 0 ? 'text-red-600' : ''}`}>
                      {r.localAmount < 0 ? `(${fmt(Math.abs(r.localAmount))})` : fmt(r.localAmount)}
                    </td>
                    <td className="px-2 py-2 text-center text-xs font-mono text-foreground">{r.currency}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-mono text-xs text-foreground">
                      {r.currency === 'CAD' ? '—' : fmt(r.fxRate, 4)}
                    </td>
                    <td className={`px-3 py-2 text-right tabular-nums font-mono font-semibold text-sm ${r.cadAmount < 0 ? 'text-red-600' : r.txnType === 'Interest Income' || r.txnType === 'Capital Dividend' ? 'text-green-600' : ''}`}>
                      {fmtCAD(r.cadAmount)}
                    </td>
                    <td className="px-3 py-2 text-xs font-mono text-foreground">{r.glAccount}</td>
                    <td className="px-3 py-2 text-xs text-foreground">
                      <div className="flex items-center gap-1">
                        {r.taxSlip && <span className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{r.taxSlip}</span>}
                        {r.acbImpact && <span title="ACB impact" className="text-blue-600 text-xs">ACB</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 max-w-[120px]">
                      <span className="text-xs text-foreground truncate block" title={r.notes}>{r.notes ?? ''}</span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon-sm" variant="ghost" title="Edit" onClick={() => startEdit(r)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon-sm" variant="ghost" title="Delete"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteTarget({ id: r.id, label: `${fmtDateDisplay(r.date)} · ${r.txnType} · ${r.description}` })}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && editingId !== 'new' && (
                <tr><td colSpan={13} className="px-4 py-8 text-center text-xs text-foreground/60">No entries match the current filters.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/60">
                <td colSpan={8} className="px-3 py-2.5 text-xs font-semibold text-foreground">{filtered.length} rows</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm">
                  {(() => {
                    const total = filtered.reduce((s, r) => s + r.cadAmount, 0);
                    return <span className={total < 0 ? 'text-red-600' : 'text-foreground'}>{fmtCAD(total)}</span>;
                  })()}
                </td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          </table>
        </div>
      </StyledCard>

      <div className="flex items-center gap-4 text-xs text-foreground">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-50 border border-blue-200 inline-block" /> ACB-impacting row</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-50 border border-red-200 inline-block" /> Withholding tax</span>
      </div>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-4 h-4" /> Delete Entry
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            <p className="font-semibold mb-1">Permanently delete:</p>
            <p>{deleteTarget?.label}</p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
