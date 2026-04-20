import React, { useState } from 'react';
import { Plus, Check, Send, FileDown, Trash2, ChevronDown, ChevronRight, BookOpen, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fmtCurrency, fmtDateDisplay } from '../lib/utils';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import { Modal, Input, DateInput, Select, Alert } from '../components/ui';
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

function descriptionOptions(account: string, loanName: string): string[] {
  const a = account.toLowerCase();
  const s = loanName ? ` – ${loanName}` : '';
  if (a.startsWith('71') || a.startsWith('72')) return [
    `YE accrued interest${s}`,
    `Interest expense accrual${s}`,
    `Accrued interest adjustment`,
  ];
  if (a.includes('2300') || a.includes('2310')) return [
    `YE accrued interest payable${s}`,
    `Accrued interest payable`,
    `Interest accrual – year end`,
  ];
  if (a.includes('2110') || a.includes('2115')) return [
    `Current portion reclass${s}`,
    `Reclassification – current portion LT debt`,
  ];
  if (a.startsWith('21')) return [
    `LT portion after reclass${s}`,
    `Long-term debt – reclassification`,
  ];
  return [];
}

function accCodeOnly(account: string): string {
  // Return just the numeric code prefix, e.g. "7100" from "7100 – Interest Expense (CAD)"
  return account.split(/[\s–-]/)[0].trim();
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export function AJEsTab() {
  const { loans, jes, advanceJEStatus, deleteJE, restoreJE, purgeJE, addJE, updateJE } = useStore(s => ({
    loans: s.loans.filter(l => l.status !== 'Inactive'), jes: s.jes,
    advanceJEStatus: s.advanceJEStatus, deleteJE: s.deleteJE, restoreJE: s.restoreJE, purgeJE: s.purgeJE,
    addJE: s.addJE, updateJE: s.updateJE,
  }));

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(jes.map(j => j.id)));
  const toggleExpand = (id: string) => setExpandedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  // Track which line IDs are in "custom description" text-input mode
  const [customDescLines, setCustomDescLines] = useState<Set<string>>(new Set());
  const setLineCustomDesc = (lineId: string) =>
    setCustomDescLines(prev => new Set([...prev, lineId]));
  const clearLineCustomDesc = (lineId: string) =>
    setCustomDescLines(prev => { const n = new Set(prev); n.delete(lineId); return n; });

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
          <p className="text-xs text-foreground mt-0.5">Year-end AJEs: accrued interest, current portion reclass, FX translation</p>
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
              <div className="text-xs text-foreground">{s.msg}</div>
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
                : 'bg-muted text-foreground hover:bg-muted/80'
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
              : 'bg-muted text-foreground hover:bg-muted/80'
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
          const isExpanded = expandedIds.has(je.id);
          const isBalanced = Math.abs(totalDebits(je) - totalCredits(je)) < 0.01;
          const sc         = STATUS_CONFIG[je.status];

          // ── Global design-system cell field classes ──────────────────────────
          const BASE = 'input-double-border w-full h-9 text-sm rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground transition-all duration-200 hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)] focus:outline-none';
          const CI  = `${BASE} px-3 placeholder:text-foreground`;                      // text input
          const CS  = `${BASE} pl-3 pr-8 appearance-none cursor-pointer`;                        // select
          const CN  = `${BASE} px-3 text-right tabular-nums placeholder:text-foreground`; // number input

          return (
            <StyledCard key={je.id} className="overflow-hidden">
              {/* JE Header */}
              <div
                className={`flex items-center gap-3 px-5 py-4 hover:bg-muted/30 cursor-pointer${je.deleted ? ' opacity-60' : ''}`}
                onClick={() => toggleExpand(je.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-foreground">{je.id.toUpperCase()}</span>
                    <Badge variant="outline">{TYPE_LABELS[je.type] || je.type}</Badge>
                    {loan && <span className="text-xs text-foreground">{loan.name}</span>}
                    {!isBalanced && <Badge variant="destructive">Unbalanced</Badge>}
                  </div>
                  <p className="text-sm font-medium text-foreground">{je.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={sc.variant}>{sc.label}</Badge>
                  {isExpanded
                    ? <ChevronDown  className="w-4 h-4 text-foreground" />
                    : <ChevronRight className="w-4 h-4 text-foreground" />
                  }
                </div>
              </div>

              {/* JE Lines (expanded) */}
              {isExpanded && (
                <div className="border-t border-border">
                  <div className={je.deleted ? 'opacity-60' : undefined}>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="py-2.5 px-4 font-semibold text-foreground text-left text-xs uppercase tracking-wider whitespace-nowrap">Acc No.</th>
                        <th className="py-2.5 px-4 font-semibold text-foreground text-left text-xs uppercase tracking-wider">Description</th>
                        <th className="py-2.5 px-4 font-semibold text-foreground text-right text-xs uppercase tracking-wider">Debit</th>
                        <th className="py-2.5 px-4 font-semibold text-foreground text-right text-xs uppercase tracking-wider">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {je.lines.map(line => {
                        const descOpts = descriptionOptions(line.account, loan?.name || '');
                        const isCustomDesc = customDescLines.has(line.id);
                        return (
                        <tr key={line.id} className="border-b border-border hover:bg-muted/20">
                          {/* Acc No. — overlay shows code only; dropdown shows full label */}
                          <td className="py-2 px-3 min-w-[120px] w-[140px]">
                            <div className="relative">
                              <select
                                className={`${CS} font-mono`}
                                style={{ color: 'transparent' }}
                                value={line.account}
                                onChange={e => updateJE(je.id, {
                                  lines: je.lines.map(l => l.id === line.id ? { ...l, account: e.target.value } : l)
                                })}
                              >
                                {!allAccounts.some(a => a.value === line.account) && line.account && (
                                  <option value={line.account}>{line.account}</option>
                                )}
                                <option value="">Select</option>
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
                              {/* Overlay showing only the account code */}
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-foreground pointer-events-none select-none">
                                {line.account ? accCodeOnly(line.account) : <span className="text-foreground font-sans font-normal">Select</span>}
                              </span>
                              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground pointer-events-none" />
                            </div>
                          </td>
                          {/* Description — dropdown with preset options + custom text mode */}
                          <td className="py-2 px-3">
                            {isCustomDesc ? (
                              <input
                                type="text"
                                autoFocus
                                className={CI}
                                value={line.description}
                                placeholder="Enter custom description…"
                                onChange={e => updateJE(je.id, {
                                  lines: je.lines.map(l => l.id === line.id ? { ...l, description: e.target.value } : l)
                                })}
                                onBlur={() => clearLineCustomDesc(line.id)}
                              />
                            ) : (
                              <div className="relative">
                                <select
                                  className={CS}
                                  value={line.description}
                                  onChange={e => {
                                    if (e.target.value === '__add_custom__') {
                                      setLineCustomDesc(line.id);
                                      updateJE(je.id, { lines: je.lines.map(l => l.id === line.id ? { ...l, description: '' } : l) });
                                    } else {
                                      updateJE(je.id, { lines: je.lines.map(l => l.id === line.id ? { ...l, description: e.target.value } : l) });
                                    }
                                  }}
                                >
                                  <option value="">— select description —</option>
                                  {descOpts.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                  ))}
                                  {line.description && !descOpts.includes(line.description) && (
                                    <option value={line.description}>{line.description}</option>
                                  )}
                                  <option value="__add_custom__">＋ Add account…</option>
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground pointer-events-none" />
                              </div>
                            )}
                          </td>
                          {/* Debit */}
                          <td className="py-2 px-3 w-36">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className={CN}
                              value={line.debit || ''}
                              placeholder="0.00"
                              onChange={e => updateJE(je.id, {
                                lines: je.lines.map(l => l.id === line.id ? { ...l, debit: parseFloat(e.target.value) || 0 } : l)
                              })}
                            />
                          </td>
                          {/* Credit */}
                          <td className="py-2 px-3 w-36">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className={CN}
                              value={line.credit || ''}
                              placeholder="0.00"
                              onChange={e => updateJE(je.id, {
                                lines: je.lines.map(l => l.id === line.id ? { ...l, credit: parseFloat(e.target.value) || 0 } : l)
                              })}
                            />
                          </td>
                        </tr>
                      );})}
                      <tr className="font-semibold text-xs border-t border-border" style={{ backgroundColor: '#F8F8FA' }}>
                        <td className="py-2.5 px-4 text-foreground" colSpan={2}>Total</td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-foreground">{fmtCurrency(totalDebits(je),  'CAD')}</td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-foreground">
                          {fmtCurrency(totalCredits(je), 'CAD')}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Notes */}
                  <div className="px-5 py-3 border-t border-border bg-background">
                    <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1.5">Notes</label>
                    <textarea
                      rows={2}
                      className="input-double-border w-full text-sm px-3 py-2.5 rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground placeholder:text-foreground transition-all duration-200 hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)] resize-none focus:outline-none"
                      placeholder="Add a note for this entry…"
                      value={je.notes ?? ''}
                      onChange={e => updateJE(je.id, { notes: e.target.value })}
                    />
                  </div>
                  </div>{/* end opacity wrapper */}

                  {/* JE Actions */}
                  <div className="flex items-center justify-between px-5 py-3 border-t border-border" style={{ backgroundColor: '#F8F8FA' }}>
                    {je.deleted ? (
                      /* ── Deleted state ── */
                      <div className="flex items-center gap-3 w-full">
                        <span className="text-xs text-foreground italic flex-1">
                          Deleted {je.deletedAt ? `on ${fmtDateDisplay(je.deletedAt.slice(0, 10))}` : ''}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => { restoreJE(je.id); toast.success('JE restored'); }}
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => { purgeJE(je.id); toast('JE permanently deleted', { icon: '🗑️' }); }}
                          className="text-red-500 hover:text-red-700 border-red-200 hover:border-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
                        </Button>
                      </div>
                    ) : (
                      /* ── Active state ── */
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
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => { deleteJE(je.id); toast('JE moved to Deleted — use the Deleted filter to restore', { icon: '🗑️' }); }}
                          className="text-red-500 hover:text-red-700 border-red-200 hover:border-red-300"
                          title="Move to deleted (restorable)"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </StyledCard>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-foreground">No journal entries match the filter</div>
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

function fmtNum(n: number) {
  return n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ENTRY_TYPES = ['Journal', 'AJE', 'Reclass', 'FX Translation'];

// Shared field-strip class constants (module-level to avoid re-creation)
const SF  = 'input-double-border h-9 text-sm rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground transition-all duration-200 hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)] focus:outline-none';
const SFS = `${SF} pl-3 pr-8 appearance-none cursor-pointer`;   // select
const SFI = `${SF} px-3 placeholder:text-foreground`;  // text / date
const SFN = `w-full ${SF} px-3 text-right tabular-nums`;        // number

function AddJEModal({ open, onClose, loans, allAccounts, onSave }: {
  open: boolean;
  onClose: () => void;
  loans: { id: string; name: string }[];
  allAccounts: { value: string; label: string }[];
  onSave: (je: JEProposal) => void;
}) {
  const [loanId,     setLoanId]     = useState('');
  const [date,       setDate]       = useState(YEAR_END_DATE);
  const [entryType,  setEntryType]  = useState('Journal');
  const [entryNum,   setEntryNum]   = useState('JE-1');
  const [showRef,    setShowRef]    = useState(false);
  const [reference,  setReference]  = useState('');
  const [recurring,  setRecurring]  = useState(false);
  const [lines,      setLines]      = useState<DraftLine[]>([emptyLine(1), emptyLine(2)]);
  const [modalNotes, setModalNotes] = useState('');

  const selectedLoanName = loans.find(l => l.id === loanId)?.name || '';

  const reset = () => {
    setLoanId(''); setDate(YEAR_END_DATE); setEntryType('Journal');
    setEntryNum('JE-1'); setShowRef(false); setReference('');
    setRecurring(false); setLines([emptyLine(1), emptyLine(2)]); setModalNotes('');
  };

  const updateLine = (i: number, k: keyof DraftLine, v: string | number) => {
    setLines(prev => prev.map((l, idx) => {
      if (idx !== i) return l;
      const updated = { ...l, [k]: v };
      if (k === 'account' && !l.description) {
        const hint = autoDescription(v as string, selectedLoanName);
        if (hint) updated.description = hint;
      }
      return updated;
    }));
  };

  const addLine    = () => setLines(prev => [...prev, emptyLine(prev.length + 1)]);
  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i));

  const totalDR  = lines.reduce((s, l) => s + (l.debit  || 0), 0);
  const totalCR  = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const balanced = Math.abs(totalDR - totalCR) < 0.01;

  const handleSave = () => {
    if (!balanced) {
      toast.error(`JE is unbalanced — DR: ${fmtCurrency(totalDR, 'CAD')}  CR: ${fmtCurrency(totalCR, 'CAD')}`);
      return;
    }
    const desc = [entryType, selectedLoanName].filter(Boolean).join(' – ') || 'Manual JE';
    onSave({
      id:          `je-${Date.now()}`,
      type:        'Manual',
      description: desc,
      date,
      lines: lines.map((l, i) => ({
        id:          `jl-${Date.now()}-${i}`,
        account:     l.account     || '',
        description: l.description || '',
        debit:       l.debit       || 0,
        credit:      l.credit      || 0,
        loanId:      loanId || undefined,
        reference:   reference || undefined,
      })),
      status:     'Draft',
      fiscalYear: '2024',
      loanId:     loanId || undefined,
      createdAt:  new Date().toISOString(),
      preparedBy: 'J. Martinez',
      notes:      modalNotes || undefined,
    });
    reset();
  };

  // Field-strip label
  const FL = (text: React.ReactNode) => (
    <span className="block text-[11px] font-medium text-foreground mb-1 whitespace-nowrap">{text}</span>
  );

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); }}
      title="Add Manual Journal Entry"
      size="3xl"
      footer={
        <>
          <Button variant="secondary" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button variant="default" onClick={handleSave}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">

        {/* ── Fields strip ── */}
        <div className="flex items-end gap-2">

          {/* Entity Name */}
          <div className="shrink-0 w-[118px]">
            {FL('Entity Name')}
            <div className="relative">
              <select className={`w-full ${SFS}`} value={loanId} onChange={e => setLoanId(e.target.value)}>
                <option value="">— None —</option>
                {loans.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground pointer-events-none" />
            </div>
          </div>

          {/* Entry Date */}
          <div className="shrink-0">
            {FL('Entry Date')}
            <DateInput className={`${SFI} w-[132px]`} value={date} onChange={e => setDate(e.target.value)} />
          </div>

          {/* Entry Type */}
          <div className="shrink-0">
            {FL(<>Entry Type <span className="text-red-400">*</span></>)}
            <div className="relative">
              <select className={`w-[106px] ${SFS}`} value={entryType} onChange={e => setEntryType(e.target.value)}>
                {ENTRY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground pointer-events-none" />
            </div>
          </div>

          {/* Entry No */}
          <div className="shrink-0">
            {FL(<>Entry No <span className="text-red-400">*</span></>)}
            <div className="flex items-center">
              <Button variant="secondary" className="px-2 h-9 rounded-r-none border-r-0"
                onClick={() => setEntryNum(n => { const m = n.match(/(\D+)(\d+)/); return m ? `${m[1]}${Math.max(1, +m[2]-1)}` : n; })}>‹</Button>
              <div className="relative">
                <select className={`w-[76px] ${SFS} rounded-none border-l-0 border-r-0`} value={entryNum} onChange={e => setEntryNum(e.target.value)}>
                  {['JE-1','JE-2','JE-3','JE-4','JE-5'].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground pointer-events-none" />
              </div>
              <Button variant="secondary" className="px-2 h-9 rounded-l-none border-l-0"
                onClick={() => setEntryNum(n => { const m = n.match(/(\D+)(\d+)/); return m ? `${m[1]}${+m[2]+1}` : n; })}>›</Button>
            </div>
          </div>

          {/* Reference */}
          <div className="shrink-0">
            {FL('Reference')}
            {showRef ? (
              <input
                autoFocus
                className={`${SFI} w-[100px]`}
                placeholder="e.g. WP-A3"
                value={reference}
                onChange={e => setReference(e.target.value)}
                onBlur={() => { if (!reference) setShowRef(false); }}
              />
            ) : (
              <Button variant="outline" className="px-3" onClick={() => setShowRef(true)}>
                + Ref
              </Button>
            )}
          </div>

          {/* Recurring */}
          <div className="shrink-0 flex flex-col items-center">
            {FL('Recurring')}
            <div className="h-9 flex items-center justify-center px-2">
              <input type="checkbox" className="w-4 h-4 rounded accent-primary cursor-pointer"
                checked={recurring} onChange={e => setRecurring(e.target.checked)} />
            </div>
          </div>

          {/* Delete / Reset */}
          <div className="shrink-0 flex flex-col items-center">
            {FL('Delete')}
            <Button variant="destructive" size="icon" onClick={reset} title="Clear form">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

        </div>

        {/* ── Lines table ── */}
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="py-2.5 px-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider w-[120px]">Acc No.</th>
                <th className="py-2.5 px-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Description</th>
                <th className="py-2.5 px-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider w-36">Debit</th>
                <th className="py-2.5 px-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider w-36">Credit</th>
                <th className="py-2.5 px-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => {
                const descOpts = descriptionOptions(line.account || '', selectedLoanName);
                const isLast   = i === lines.length - 1;
                return (
                  <tr key={line.id} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                    {/* Acc No. — code-only overlay */}
                    <td className="px-3 py-2">
                      <div className="relative">
                        <select className={`w-full ${SFS} font-mono`} style={{ color: 'transparent' }}
                          value={line.account || ''} onChange={e => updateLine(i, 'account', e.target.value)}>
                          <option value="">Select</option>
                          <optgroup label="Expense">
                            {allAccounts.filter(a => a.value.startsWith('7')).map(a =>
                              <option key={a.value} value={a.value}>{a.label}</option>)}
                          </optgroup>
                          <optgroup label="Liability">
                            {allAccounts.filter(a => a.value.startsWith('2')).map(a =>
                              <option key={a.value} value={a.value}>{a.label}</option>)}
                          </optgroup>
                        </select>
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-foreground pointer-events-none select-none">
                          {line.account
                            ? accCodeOnly(line.account)
                            : <span className="text-foreground font-sans font-normal">Select</span>}
                        </span>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground pointer-events-none" />
                      </div>
                    </td>
                    {/* Description — combobox-style select */}
                    <td className="px-3 py-2">
                      <div className="relative">
                        <select className={`w-full ${SFS}`}
                          value={line.description || ''} onChange={e => updateLine(i, 'description', e.target.value)}>
                          <option value="">Type here to search</option>
                          {descOpts.map(d => <option key={d} value={d}>{d}</option>)}
                          {line.description && !descOpts.includes(line.description) && (
                            <option value={line.description}>{line.description}</option>
                          )}
                          <option value="__custom__">＋ Add account…</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground pointer-events-none" />
                      </div>
                    </td>
                    {/* Debit */}
                    <td className="px-3 py-2">
                      <input type="number" min="0" step="0.01" className={SFN}
                        value={line.debit || ''} placeholder="0.00"
                        onChange={e => updateLine(i, 'debit', parseFloat(e.target.value) || 0)} />
                    </td>
                    {/* Credit */}
                    <td className="px-3 py-2">
                      <input type="number" min="0" step="0.01" className={SFN}
                        value={line.credit || ''} placeholder="0.00"
                        onChange={e => updateLine(i, 'credit', parseFloat(e.target.value) || 0)} />
                    </td>
                    {/* Actions */}
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-start gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => removeLine(i)} title="Remove"
                          className="text-foreground hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        {isLast && (
                          <Button variant="ghost" size="icon-sm" onClick={addLine} title="Add line">
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50 text-sm font-semibold border-t border-border">
                <td colSpan={2} className="px-3 py-2.5 text-right text-foreground">Total</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{fmtNum(totalDR)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{fmtNum(totalCR)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ── Notes ── */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
          <textarea
            rows={4}
            className="input-double-border w-full text-sm px-3 py-2.5 rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground placeholder:text-foreground transition-all duration-200 hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)] resize-none focus:outline-none"
            placeholder="Add your notes here..."
            value={modalNotes}
            onChange={e => setModalNotes(e.target.value)}
          />
        </div>

      </div>
    </Modal>
  );
}
