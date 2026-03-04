import React, { useState } from 'react';
import { Plus, Check, Send, FileDown, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fmtCurrency } from '../lib/utils';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import { Modal, Input, Select, Alert } from '../components/ui';
import type { JEProposal, JEStatus, JELine } from '../types';
import toast from 'react-hot-toast';

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

export function AJEsTab() {
  const { loans, jes, advanceJEStatus, deleteJE, addJE, updateJE } = useStore(s => ({
    loans: s.loans, jes: s.jes,
    advanceJEStatus: s.advanceJEStatus, deleteJE: s.deleteJE,
    addJE: s.addJE, updateJE: s.updateJE,
  }));

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'All' | JEStatus>('All');

  const filtered = jes.filter(j => filterStatus === 'All' || j.status === filterStatus);

  const draft    = jes.filter(j => j.status === 'Draft').length;
  const approved = jes.filter(j => j.status === 'Approved').length;
  const posted   = jes.filter(j => j.status === 'Posted').length;

  const totalDebits  = (je: JEProposal) => je.lines.reduce((s, l) => s + l.debit,  0);
  const totalCredits = (je: JEProposal) => je.lines.reduce((s, l) => s + l.credit, 0);

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
          { label: 'Draft',              count: draft,    msg: 'Require review' },
          { label: 'Approved',           count: approved, msg: 'Ready to post'  },
          { label: 'Posted / Exported',  count: posted,   msg: 'Complete'       },
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
      <div className="flex gap-1">
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
      </div>

      {/* JE List */}
      <div className="space-y-3">
        {filtered.map(je => {
          const loan       = je.loanId ? loans.find(l => l.id === je.loanId) : null;
          const isExpanded = expandedId === je.id;
          const isBalanced = Math.abs(totalDebits(je) - totalCredits(je)) < 0.01;
          const sc         = STATUS_CONFIG[je.status];

          return (
            <StyledCard key={je.id} className="overflow-hidden">
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
                        {['Account', 'Description', 'Debit', 'Credit', 'Loan'].map(h => (
                          <th key={h} className="py-2 px-5 font-semibold text-foreground/40 text-right first:text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {je.lines.map(line => {
                        const lineLoan = line.loanId ? loans.find(l => l.id === line.loanId) : null;
                        return (
                          <tr key={line.id} className="border-b border-border hover:bg-muted/30">
                            <td className="py-2.5 px-5 font-medium text-foreground">{line.account}</td>
                            <td className="py-2.5 px-5 text-muted-foreground">{line.description}</td>
                            <td className="py-2.5 px-5 text-right tabular-nums text-foreground">{line.debit  > 0 ? fmtCurrency(line.debit,  'CAD') : '—'}</td>
                            <td className="py-2.5 px-5 text-right tabular-nums text-foreground">{line.credit > 0 ? fmtCurrency(line.credit, 'CAD') : '—'}</td>
                            <td className="py-2.5 px-5 text-right text-foreground/40">{lineLoan?.name || '—'}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-muted/50 font-semibold text-xs">
                        <td className="py-2 px-5 text-foreground" colSpan={2}>Totals</td>
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
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteJE(je.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
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
        onSave={je => { addJE(je); toast.success('JE added'); setAddOpen(false); }}
      />
    </div>
  );
}

function AddJEModal({ open, onClose, loans, onSave }: {
  open: boolean;
  onClose: () => void;
  loans: { id: string; name: string }[];
  onSave: (je: JEProposal) => void;
}) {
  const [description, setDescription] = useState('');
  const [loanId, setLoanId] = useState('');
  const [lines, setLines] = useState<Partial<JELine>[]>([
    { id: 'new-1', account: '', description: '', debit: 0, credit: 0 },
    { id: 'new-2', account: '', description: '', debit: 0, credit: 0 },
  ]);

  const updateLine = (i: number, k: keyof JELine, v: string | number) => {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  };

  const handleSave = () => {
    if (!description) { toast.error('Description required'); return; }
    const totalDR = lines.reduce((s, l) => s + (l.debit  || 0), 0);
    const totalCR = lines.reduce((s, l) => s + (l.credit || 0), 0);
    if (Math.abs(totalDR - totalCR) > 0.01) {
      toast.error(`JE is unbalanced. DR: ${totalDR.toFixed(2)} CR: ${totalCR.toFixed(2)}`);
      return;
    }
    onSave({
      id:          `je-${Date.now()}`,
      type:        'Manual',
      description,
      lines:       lines.map((l, i) => ({
        id:          `jl-${Date.now()}-${i}`,
        account:     l.account     || '',
        description: l.description || '',
        debit:       l.debit       || 0,
        credit:      l.credit      || 0,
        loanId:      loanId || undefined,
      })),
      status:      'Draft',
      fiscalYear:  '2024',
      loanId:      loanId || undefined,
      createdAt:   new Date().toISOString(),
      preparedBy:  'J. Martinez',
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Manual Journal Entry"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="default"   onClick={handleSave}>Add JE</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g. YE adjustment – loan processing fee"
        />
        <Select
          label="Related Loan (optional)"
          value={loanId}
          onChange={e => setLoanId(e.target.value)}
          options={[{ value: '', label: 'None' }, ...loans.map(l => ({ value: l.id, label: l.name }))]}
        />
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-foreground/70">JE Lines</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLines(prev => [...prev, { id: `new-${Date.now()}`, account: '', description: '', debit: 0, credit: 0 }])}
            >
              <Plus className="w-3 h-3" /> Add Line
            </Button>
          </div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                {['Account', 'Description', 'Debit', 'Credit', ''].map(h => (
                  <th key={h} className="py-2 px-2 text-left font-semibold text-foreground/40">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={line.id} className="border-b border-border">
                  <td className="px-2 py-1.5">
                    <input
                      className="w-full text-xs px-2 py-1 border border-border rounded focus:outline-none focus:border-primary/40 bg-background text-foreground"
                      value={line.account || ''}
                      onChange={e => updateLine(i, 'account', e.target.value)}
                      placeholder="e.g. 7100"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      className="w-full text-xs px-2 py-1 border border-border rounded focus:outline-none focus:border-primary/40 bg-background text-foreground"
                      value={line.description || ''}
                      onChange={e => updateLine(i, 'description', e.target.value)}
                      placeholder="Description"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      className="w-24 text-xs px-2 py-1 border border-border rounded text-right focus:outline-none focus:border-primary/40 bg-background text-foreground"
                      value={line.debit || ''}
                      onChange={e => updateLine(i, 'debit', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      className="w-24 text-xs px-2 py-1 border border-border rounded text-right focus:outline-none focus:border-primary/40 bg-background text-foreground"
                      value={line.credit || ''}
                      onChange={e => updateLine(i, 'credit', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <button
                      onClick={() => setLines(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-red-400 hover:text-red-600"
                    >✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50">
                <td colSpan={2} className="px-2 py-2 text-xs font-semibold text-muted-foreground">Totals</td>
                <td className="px-2 py-2 text-right tabular-nums text-xs font-semibold text-foreground">
                  {fmtCurrency(lines.reduce((s, l) => s + (l.debit  || 0), 0), 'CAD')}
                </td>
                <td className="px-2 py-2 text-right tabular-nums text-xs font-semibold text-foreground">
                  {fmtCurrency(lines.reduce((s, l) => s + (l.credit || 0), 0), 'CAD')}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </Modal>
  );
}
