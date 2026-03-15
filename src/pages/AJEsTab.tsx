import React, { useState } from 'react';
import { Plus, Check, Send, FileDown, Trash2, ChevronDown, ChevronRight, BookOpen, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fmtCurrency } from '../lib/utils';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import { Modal, Input, Select, Alert } from '../components/ui';
import type { JEProposal, JEStatus, JELine } from '../types';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const YEAR_END_DATE = '2024-12-31';

const PRESET_GL_ACCOUNTS: { value: string; label: string }[] = [
  { value: '7100 – Interest Expense (CAD)',            label: '7100 – Interest Expense (CAD)'            },
  { value: '7110 – Interest Expense (Variable)',        label: '7110 – Interest Expense (Variable)'       },
  { value: '7120 – Finance Charges',                   label: '7120 – Finance Charges'                   },
  { value: '7200 – Bank Charges & Interest',           label: '7200 – Bank Charges & Interest'           },
  { value: '2100 – Long-Term Debt',                    label: '2100 – Long-Term Debt'                    },
  { value: '2105 – Long-Term Debt (EUR)',               label: '2105 – Long-Term Debt (EUR)'              },
  { value: '2110 – Current Portion LT Debt',           label: '2110 – Current Portion LT Debt'           },
  { value: '2115 – Current Portion (Mortgage)',        label: '2115 – Current Portion (Mortgage)'        },
  { value: '2120 – Shareholder / Related-Party Debt',  label: '2120 – Shareholder / Related-Party Debt'  },
  { value: '2130 – Mortgage Payable',                  label: '2130 – Mortgage Payable'                  },
  { value: '2200 – Line of Credit',                    label: '2200 – Line of Credit'                    },
  { value: '2300 – Accrued Interest Payable',          label: '2300 – Accrued Interest Payable'          },
  { value: '2310 – Accrued Finance Charges',           label: '2310 – Accrued Finance Charges'           },
];

const STATUS_CONFIG: Record<JEStatus, { label: string; variant: 'notStarted' | 'success' | 'info' | 'review' }> = {
  Draft:    { label: 'Draft',    variant: 'notStarted' },
  Approved: { label: 'Approved', variant: 'success'    },
  Posted:   { label: 'Posted',   variant: 'info'       },
  Exported: { label: 'Exported', variant: 'review'     },
};

const TYPE_LABELS: Record<string, string> = {
  AccruedInterest:       'Accrued Interest',
  CurrentPortionReclass: 'Current Portion Reclass',
  FXTranslation:         'FX Translation',
  MissingSplit:          'Missing Split',
  Manual:                'Manual',
};

const LINE_TYPE_SHORT: Record<string, string> = {
  AccruedInterest:       'AJE',
  CurrentPortionReclass: 'Reclass',
  FXTranslation:         'FX',
  MissingSplit:          'AJE',
  Manual:                'JE',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDisplayDate(iso: string | undefined) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

function autoDescription(account: string, loanName: string): string {
  const a = account.toLowerCase();
  if (a.startsWith('71') || a.startsWith('72')) return `YE accrued interest${loanName ? ` – ${loanName}` : ''}`;
  if (a.includes('2300') || a.includes('2310'))  return `YE accrued interest payable${loanName ? ` – ${loanName}` : ''}`;
  if (a.includes('2110') || a.includes('2115'))  return `Current portion reclass${loanName ? ` – ${loanName}` : ''}`;
  if (a.startsWith('21'))                        return `LT portion after reclass${loanName ? ` – ${loanName}` : ''}`;
  return '';
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export function AJEsTab() {
  const { loans, jes, advanceJEStatus, deleteJE, restoreJE, addJE, updateJE } = useStore(s => ({
    loans: s.loans, jes: s.jes,
    advanceJEStatus: s.advanceJEStatus, deleteJE: s.deleteJE, restoreJE: s.restoreJE,
    addJE: s.addJE, updateJE: s.updateJE,
  }));

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'All' | JEStatus | 'Deleted'>('All');

  const activeJes  = jes.filter(j => !j.deleted);
  const deletedJes = jes.filter(j =>  j.deleted);

  const filtered = filterStatus === 'Deleted'
    ? deletedJes
    : activeJes.filter(j => filterStatus === 'All' || j.status === filterStatus);

  const draft    = activeJes.filter(j => j.status === 'Draft').length;
  const approved = activeJes.filter(j => j.status === 'Approved').length;
  const posted   = activeJes.filter(j => j.status === 'Posted').length;

  const totalDebits  = (je: JEProposal) => je.lines.reduce((s, l) => s + l.debit,  0);
  const totalCredits = (je: JEProposal) => je.lines.reduce((s, l) => s + l.credit, 0);

  // Collect all accounts already used across existing JEs (for dropdown enrichment)
  const usedAccounts = Array.from(new Set(jes.flatMap(j => j.lines.map(l => l.account)).filter(Boolean)));
  const allAccounts = [
    ...PRESET_GL_ACCOUNTS,
    ...usedAccounts
      .filter(a => !PRESET_GL_ACCOUNTS.some(p => p.value === a))
      .map(a => ({ value: a, label: a })),
  ];

  const handleExportAll = async () => {
    const { exportToExcel, buildJEExport } = await import('../lib/utils');
    exportToExcel({ 'AJEs': buildJEExport(jes) }, 'FY2024_AJEs.xlsx');
    toast.success('AJEs exported to Excel');
  };

  return (
    <div className="p-6 space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Adjusting Journal Entries</h2>
          <p className="text-xs text-foreground/60 mt-0.5">Year-end AJEs: accrued interest, current portion reclass, FX translation</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportAll}>
            <FileDown className="w-3.5 h-3.5" /> Export JE Pack
          </Button>
          <Button variant="default" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Manual JE
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Draft',             count: draft,    msg: 'Require review' },
          { label: 'Approved',          count: approved, msg: 'Ready to post'  },
          { label: 'Posted / Exported', count: posted,   msg: 'Complete'       },
        ].map(s => (
          <StyledCard key={s.label} className="p-3 flex items-center gap-3">
            <div className="text-2xl font-bold text-foreground">{s.count}</div>
            <div>
              <div className="text-xs font-semibold text-foreground">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.msg}</div>
            </div>
          </StyledCard>
        ))}
      </div>

      {draft > 0 && (
        <Alert type="warning" title={`${draft} AJE${draft > 1 ? 's' : ''} require preparer review`}>
          Review and approve each entry before posting. Entries are automatically suggested based on year-end calculations.
        </Alert>
      )}

      {/* Filter */}
      <div className="flex gap-1 flex-wrap">
        {(['All', 'Draft', 'Approved', 'Posted', 'Exported'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all ${
              filterStatus === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s}
          </button>
        ))}
        <button
          onClick={() => setFilterStatus('Deleted')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full font-medium transition-all ${
            filterStatus === 'Deleted'
              ? 'bg-red-500 text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <Trash2 className="w-3 h-3" /> Deleted
          {deletedJes.length > 0 && (
            <span className={`ml-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] font-bold px-1 ${
              filterStatus === 'Deleted' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
            }`}>{deletedJes.length}</span>
          )}
        </button>
      </div>

      {/* JE List */}
      <div className="space-y-3">
        {filtered.map(je => {
          const loan       = je.loanId ? loans.find(l => l.id === je.loanId) : null;
          const isExpanded = expandedId === je.id;
          const isBalanced = Math.abs(totalDebits(je) - totalCredits(je)) < 0.01;
          const sc         = STATUS_CONFIG[je.status];
          const jeDate     = je.date || YEAR_END_DATE;
          const lineType   = LINE_TYPE_SHORT[je.type] || 'JE';

          return (
            <StyledCard key={je.id} className={`overflow-hidden ${je.deleted ? 'opacity-60' : ''}`}>
              {/* JE Header */}
              <div
                className="flex items-center gap-3 px-5 py-4 hover:bg-muted/30 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : je.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-foreground/40">{je.id.toUpperCase()}</span>
                    <Badge variant="outline">{TYPE_LABELS[je.type] || je.type}</Badge>
                    {loan && <span className="text-xs text-muted-foreground">{loan.name}</span>}
                    {!isBalanced && <Badge variant="destructive">Unbalanced</Badge>}
                  </div>
                  <p className="text-sm font-medium text-foreground">{je.description}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-foreground/40">
                    <span>DR: <span className="tabular-nums font-medium text-foreground/70">{fmtCurrency(totalDebits(je), 'CAD')}</span></span>
                    <span>CR: <span className="tabular-nums font-medium text-foreground/70">{fmtCurrency(totalCredits(je), 'CAD')}</span></span>
                    <span>FY{je.fiscalYear}</span>
                    <span className="font-mono">{fmtDisplayDate(jeDate)}</span>
                    {je.preparedBy && <span>Prep: {je.preparedBy}</span>}
                    {je.approvedBy  && <span>Appr: {je.approvedBy}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={sc.variant}>{sc.label}</Badge>
                  {isExpanded
                    ? <ChevronDown  className="w-4 h-4 text-foreground/40" />
                    : <ChevronRight className="w-4 h-4 text-foreground/40" />
                  }
                </div>
              </div>

              {/* JE Lines (expanded) */}
              {isExpanded && (
                <div className="border-t border-border">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="py-2 px-5 font-semibold text-foreground/40 text-left">Account</th>
                        <th className="py-2 px-5 font-semibold text-foreground/40 text-left">Description</th>
                        <th className="py-2 px-4 font-semibold text-foreground/40 text-center">Date</th>
                        <th className="py-2 px-5 font-semibold text-foreground/40 text-right">Debit</th>
                        <th className="py-2 px-5 font-semibold text-foreground/40 text-right">Credit</th>
                        <th className="py-2 px-5 font-semibold text-foreground/40 text-left">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {je.lines.map(line => (
                        <tr key={line.id} className="border-b border-border hover:bg-muted/30">
                          <td className="py-1.5 px-3">
                            <select
                              className="w-full text-xs font-mono px-2 py-1.5 border border-transparent hover:border-border rounded-lg bg-transparent text-foreground focus:outline-none focus:border-primary/40 focus:bg-background transition-all cursor-pointer"
                              value={line.account}
                              onChange={e => updateJE(je.id, {
                                lines: je.lines.map(l => l.id === line.id ? { ...l, account: e.target.value } : l)
                              })}
                            >
                              {!allAccounts.some(a => a.value === line.account) && (
                                <option value={line.account}>{line.account}</option>
                              )}
                              <optgroup label="Expense">
                                {allAccounts.filter(a => a.value.startsWith('7')).map(a => (
                                  <option key={a.value} value={a.value}>{a.label}</option>
                                ))}
                              </optgroup>
                              <optgroup label="Liability">
                                {allAccounts.filter(a => a.value.startsWith('2')).map(a => (
                                  <option key={a.value} value={a.value}>{a.label}</option>
                                ))}
                              </optgroup>
                            </select>
                          </td>
                          <td className="py-2.5 px-5 text-muted-foreground">{line.description}</td>
                          <td className="py-2.5 px-4 text-center tabular-nums text-muted-foreground text-xs">{fmtDisplayDate(jeDate)}</td>
                          <td className="py-2.5 px-5 text-right tabular-nums text-foreground">{line.debit  > 0 ? fmtCurrency(line.debit,  'CAD') : '—'}</td>
                          <td className="py-2.5 px-5 text-right tabular-nums text-foreground">{line.credit > 0 ? fmtCurrency(line.credit, 'CAD') : '—'}</td>
                          <td className="py-2.5 px-5 text-muted-foreground text-xs">
                            {line.reference
                              ? <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 flex-shrink-0" />{line.reference}</span>
                              : <span className="text-foreground/25">—</span>}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-muted/50 font-semibold text-xs">
                        <td className="py-2 px-5 text-foreground" colSpan={3}>Totals</td>
                        <td className="py-2 px-5 text-right tabular-nums text-foreground">{fmtCurrency(totalDebits(je),  'CAD')}</td>
                        <td className="py-2 px-5 text-right tabular-nums text-foreground">{fmtCurrency(totalCredits(je), 'CAD')}</td>
                        <td className="py-2 px-5 text-right">
                          {isBalanced
                            ? <span className="text-emerald-600 font-semibold">✓ Balanced</span>
                            : <span className="text-red-600">✗ Unbalanced</span>
                          }
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* JE Actions */}
                  <div className="flex items-center justify-between px-5 py-3 bg-muted/50 border-t border-border">
                    {je.deleted ? (
                      /* ── Deleted state ── */
                      <div className="flex items-center gap-3 w-full">
                        <span className="text-xs text-muted-foreground italic flex-1">
                          Deleted {je.deletedAt ? `on ${je.deletedAt.slice(0, 10)}` : ''}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => { restoreJE(je.id); toast.success('JE restored'); }}
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </Button>
                      </div>
                    ) : (
                      /* ── Active state ── */
                      <>
                        <div className="flex items-center gap-2">
                          {je.status === 'Draft' && (
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => { advanceJEStatus(je.id, 'Approved', 'K. Chen'); toast.success('JE approved'); }}
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </Button>
                          )}
                          {je.status === 'Approved' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => { advanceJEStatus(je.id, 'Posted', 'K. Chen'); toast.success('JE posted'); }}
                            >
                              <Send className="w-3.5 h-3.5" /> Post
                            </Button>
                          )}
                          {(je.status === 'Draft' || je.status === 'Approved') && (
                            <Button variant="secondary" size="sm" onClick={() => { advanceJEStatus(je.id, 'Draft', ''); }}>
                              Revert to Draft
                            </Button>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { deleteJE(je.id); toast('JE moved to Deleted — use the Deleted filter to restore', { icon: '🗑️' }); }}
                          className="text-red-500 hover:text-red-700"
                          title="Move to deleted (restorable)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </StyledCard>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No journal entries match the filter</div>
        )}
      </div>

      {/* Add Manual JE Modal */}
      <AddJEModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        loans={loans}
        allAccounts={allAccounts}
        onSave={je => { addJE(je); toast.success('JE added'); setAddOpen(false); }}
      />
    </div>
  );
}

// ─── Add JE Modal ─────────────────────────────────────────────────────────────

type DraftLine = Partial<JELine> & { reference: string };

function emptyLine(idx: number): DraftLine {
  return { id: `new-${idx}-${Date.now()}`, account: '', description: '', debit: 0, credit: 0, reference: '' };
}

function AddJEModal({ open, onClose, loans, allAccounts, onSave }: {
  open: boolean;
  onClose: () => void;
  loans: { id: string; name: string }[];
  allAccounts: { value: string; label: string }[];
  onSave: (je: JEProposal) => void;
}) {
  const [description, setDescription] = useState('');
  const [loanId, setLoanId] = useState('');
  const [date, setDate] = useState(YEAR_END_DATE);
  const [lines, setLines] = useState<DraftLine[]>([emptyLine(1), emptyLine(2)]);

  const selectedLoanName = loans.find(l => l.id === loanId)?.name || '';

  const updateLine = (i: number, k: keyof DraftLine, v: string | number) => {
    setLines(prev => prev.map((l, idx) => {
      if (idx !== i) return l;
      const updated = { ...l, [k]: v };
      // Auto-fill description when account is chosen and description is still empty
      if (k === 'account' && !l.description) {
        const hint = autoDescription(v as string, selectedLoanName);
        if (hint) updated.description = hint;
      }
      return updated;
    }));
  };

  const addLine = () => setLines(prev => [...prev, emptyLine(prev.length + 1)]);
  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i));

  const totalDR = lines.reduce((s, l) => s + (l.debit  || 0), 0);
  const totalCR = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const balanced = Math.abs(totalDR - totalCR) < 0.01;

  const handleSave = () => {
    if (!description.trim()) { toast.error('Description required'); return; }
    if (!balanced) {
      toast.error(`JE is unbalanced — DR: ${fmtCurrency(totalDR, 'CAD')}  CR: ${fmtCurrency(totalCR, 'CAD')}`);
      return;
    }
    onSave({
      id:          `je-${Date.now()}`,
      type:        'Manual',
      description: description.trim(),
      date,
      lines:       lines.map((l, i) => ({
        id:          `jl-${Date.now()}-${i}`,
        account:     l.account     || '',
        description: l.description || '',
        debit:       l.debit       || 0,
        credit:      l.credit      || 0,
        loanId:      loanId || undefined,
        reference:   l.reference   || undefined,
      })),
      status:     'Draft',
      fiscalYear: '2024',
      loanId:     loanId || undefined,
      createdAt:  new Date().toISOString(),
      preparedBy: 'J. Martinez',
    });
    // reset
    setDescription(''); setLoanId(''); setDate(YEAR_END_DATE);
    setLines([emptyLine(1), emptyLine(2)]);
  };

  const IC = 'w-full text-xs px-2 py-1.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary/40 transition-colors';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Manual Journal Entry"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="default" onClick={handleSave}>Add JE</Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* JE header fields */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="JE Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. YE accrued interest adjustment"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Effective Date</label>
            <input
              type="date"
              className={IC}
              style={{ height: '36px' }}
              value={date}
              onChange={e => setDate(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">Defaults to year-end ({YEAR_END_DATE})</p>
          </div>
        </div>
        <Select
          label="Related Loan (optional)"
          value={loanId}
          onChange={e => setLoanId(e.target.value)}
          options={[{ value: '', label: 'None' }, ...loans.map(l => ({ value: l.id, label: l.name }))]}
        />

        {/* Lines table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-foreground/70">JE Lines</div>
            <Button variant="ghost" size="sm" onClick={addLine}>
              <Plus className="w-3 h-3" /> Add Line
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {['Acc. No.', 'Description', 'Date', 'Type', 'Debit', 'Credit', 'Reference', ''].map(h => (
                    <th key={h} className="py-2 px-2 text-left text-xs font-semibold text-foreground/50 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={line.id} className="border-b border-border hover:bg-muted/20">
                    {/* Account dropdown */}
                    <td className="px-2 py-1.5 min-w-[180px]">
                      <select
                        className={IC}
                        value={line.account || ''}
                        onChange={e => updateLine(i, 'account', e.target.value)}
                      >
                        <option value="">— select account —</option>
                        <optgroup label="Expense">
                          {allAccounts.filter(a => a.value.startsWith('7')).map(a => (
                            <option key={a.value} value={a.value}>{a.label}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Liability">
                          {allAccounts.filter(a => a.value.startsWith('2')).map(a => (
                            <option key={a.value} value={a.value}>{a.label}</option>
                          ))}
                        </optgroup>
                      </select>
                    </td>
                    {/* Description */}
                    <td className="px-2 py-1.5 min-w-[160px]">
                      <input
                        className={IC}
                        value={line.description || ''}
                        onChange={e => updateLine(i, 'description', e.target.value)}
                        placeholder="Description"
                      />
                    </td>
                    {/* Date (inherited from JE, display-only per line) */}
                    <td className="px-2 py-1.5 min-w-[90px]">
                      <span className="text-xs tabular-nums text-muted-foreground px-1">{fmtDisplayDate(date)}</span>
                    </td>
                    {/* Type badge */}
                    <td className="px-2 py-1.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border">JE</span>
                    </td>
                    {/* Debit */}
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        min="0"
                        className={`${IC} w-24 text-right`}
                        value={line.debit || ''}
                        onChange={e => updateLine(i, 'debit', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </td>
                    {/* Credit */}
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        min="0"
                        className={`${IC} w-24 text-right`}
                        value={line.credit || ''}
                        onChange={e => updateLine(i, 'credit', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </td>
                    {/* Reference */}
                    <td className="px-2 py-1.5 min-w-[140px]">
                      <input
                        className={IC}
                        value={line.reference}
                        onChange={e => updateLine(i, 'reference', e.target.value)}
                        placeholder="e.g. WP A-3 / Schedule"
                      />
                    </td>
                    {/* Delete */}
                    <td className="px-2 py-1.5">
                      <button
                        onClick={() => removeLine(i)}
                        className="p-1 text-muted-foreground hover:text-red-500 transition-colors rounded"
                        title="Remove line"
                      >✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 text-xs font-semibold">
                  <td colSpan={4} className="px-2 py-2 text-muted-foreground">Totals</td>
                  <td className="px-2 py-2 text-right tabular-nums text-foreground">{fmtCurrency(totalDR, 'CAD')}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-foreground">{fmtCurrency(totalCR, 'CAD')}</td>
                  <td colSpan={2} className="px-2 py-2 text-right">
                    {totalDR > 0 || totalCR > 0
                      ? balanced
                        ? <span className="text-emerald-600">✓ Balanced</span>
                        : <span className="text-red-500">✗ {fmtCurrency(Math.abs(totalDR - totalCR), 'CAD')} off</span>
                      : null}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}
