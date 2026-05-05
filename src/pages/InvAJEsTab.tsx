import React, { useState, useEffect } from 'react';
import { Plus, Check, Send, FileDown, Trash2, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import type { AJE } from '@/lib/luka/compute';
import { fmtCAD } from './InvHoldingsTab';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import { Modal, Alert } from '../components/ui';
import { CHART_OF_ACCOUNTS } from '@/lib/luka/coa';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type AJEStatus = 'Draft' | 'Approved' | 'Posted';

export interface LocalInvJE {
  _id: string;
  ref: string;
  description: string;
  drAccount: string;
  crAccount: string;
  drDescription: string;
  crDescription: string;
  amount: number;
  type: AJE['type'];
  confidence: AJE['confidence'];
  status: AJEStatus;
  notes: string;
  deleted: boolean;
  deletedAt?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AJEStatus, { label: string; variant: 'notStarted' | 'success' | 'info' }> = {
  Draft:    { label: 'Draft',    variant: 'notStarted' },
  Approved: { label: 'Approved', variant: 'success'    },
  Posted:   { label: 'Posted',   variant: 'info'       },
};

const TYPE_OPTIONS: AJE['type'][] = [
  'Correcting', 'Reclassification', 'Accrual', 'Fair Value Adj', 'FX Adj', 'Disposition',
];

const CONFIDENCE_OPTIONS: AJE['confidence'][] = ['High', 'Medium', 'Low'];

// ─── IIC / field class constants ─────────────────────────────────────────────

const BASE = 'input-double-border w-full h-9 text-sm rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground transition-all duration-200 hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)] focus:outline-none';
const CI   = `${BASE} px-3 placeholder:text-muted-foreground`;
const CS   = `${BASE} pl-3 pr-8 appearance-none cursor-pointer`;
const CN   = `${BASE} px-3 text-right tabular-nums placeholder:text-muted-foreground`;

// Modal field classes (module-level, not re-created per render)
const SF  = 'input-double-border h-9 text-sm rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground transition-all duration-200 hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)] focus:outline-none';
const SFS = `${SF} pl-3 pr-8 appearance-none cursor-pointer`;
const SFI = `${SF} px-3 placeholder:text-muted-foreground`;
const SFN = `w-full ${SF} px-3 text-right tabular-nums`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function accCodeOnly(account: string): string {
  return account.split(/[\s·–\-]/)[0].trim();
}

function makeId(): string {
  return `aje-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fromAJE(a: AJE, i: number): LocalInvJE {
  return {
    _id: `aje-init-${i}`,
    ref: a.ref,
    description: a.description,
    drAccount: a.drAccount,
    crAccount: a.crAccount,
    drDescription: a.description,
    crDescription: a.description,
    amount: a.amount,
    type: a.type,
    confidence: a.confidence,
    status: 'Draft',
    notes: '',
    deleted: false,
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  ajes: AJE[];
  /** AJEs pushed from other tabs (Gain/Loss, WAC, Unrealized, Recon) */
  pendingQueue?: LocalInvJE[];
  onQueueConsumed?: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function InvAJEsTab({ ajes, pendingQueue, onQueueConsumed }: Props) {
  const [localJEs, setLocalJEs] = useState<LocalInvJE[]>(() => ajes.map(fromAJE));
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(ajes.map((_, i) => `aje-init-${i}`)),
  );
  const [filterStatus, setFilterStatus] = useState<'All' | AJEStatus | 'Deleted'>('All');
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    label: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    setLocalJEs(ajes.map(fromAJE));
    setExpandedIds(new Set(ajes.map((_, i) => `aje-init-${i}`)));
  }, [ajes]);

  // Consume externally pushed AJEs (from Gain/Loss, WAC, Unrealized, Recon tabs)
  useEffect(() => {
    if (!pendingQueue?.length) return;
    setLocalJEs((prev) => {
      const existingIds = new Set(prev.map((j) => j._id));
      const newOnes = pendingQueue.filter((j) => !existingIds.has(j._id));
      if (!newOnes.length) return prev;
      return [...prev, ...newOnes];
    });
    setExpandedIds((prev) => {
      const n = new Set(prev);
      pendingQueue.forEach((j) => n.add(j._id));
      return n;
    });
    onQueueConsumed?.();
  }, [pendingQueue]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleExpand = (id: string) =>
    setExpandedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  const updateJE = (id: string, patch: Partial<LocalInvJE>) =>
    setLocalJEs(prev => prev.map(j => j._id === id ? { ...j, ...patch } : j));

  const advanceStatus = (id: string, next: AJEStatus) => updateJE(id, { status: next });
  const softDelete  = (id: string) => updateJE(id, { deleted: true, deletedAt: new Date().toISOString() });
  const restoreJE   = (id: string) => updateJE(id, { deleted: false, deletedAt: undefined });
  const purgeJE     = (id: string) => setLocalJEs(prev => prev.filter(j => j._id !== id));

  const active  = localJEs.filter(j => !j.deleted);
  const deleted = localJEs.filter(j =>  j.deleted);
  const draft    = active.filter(j => j.status === 'Draft').length;
  const approved = active.filter(j => j.status === 'Approved').length;
  const posted   = active.filter(j => j.status === 'Posted').length;

  const filtered = filterStatus === 'Deleted'
    ? deleted
    : active.filter(j => filterStatus === 'All' || j.status === filterStatus);

  return (
    <div className="px-6 py-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Adjusting Journal Entries</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Investment AJEs driven by published transactions and TB account mapping
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => toast.success('Export coming soon')}>
            <FileDown className="w-3.5 h-3.5" /> Export JE Pack
          </Button>
          <Button variant="default" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Manual AJE
          </Button>
        </div>
      </div>

      {/* ── Stats KPI tiles ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Draft',    count: draft,    msg: 'Require review' },
          { label: 'Approved', count: approved, msg: 'Ready to post'  },
          { label: 'Posted',   count: posted,   msg: 'Complete'       },
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
          Review and approve each entry before posting. Entries are automatically suggested based on published transactions.
        </Alert>
      )}

      {/* ── Filter pills ── */}
      <div className="flex gap-1 flex-wrap">
        {(['All', 'Draft', 'Approved', 'Posted'] as const).map(s => (
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
          {deleted.length > 0 && (
            <span className={`ml-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] font-bold px-1 ${
              filterStatus === 'Deleted' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
            }`}>{deleted.length}</span>
          )}
        </button>
      </div>

      {/* ── JE Cards ── */}
      <div className="space-y-3">
        {filtered.map(je => {
          const sc         = STATUS_CONFIG[je.status];
          const isExpanded = expandedIds.has(je._id);

          return (
            <StyledCard key={je._id} className="overflow-hidden">

              {/* Card header — click to expand */}
              <div
                className={`flex items-center gap-3 px-5 py-4 hover:bg-muted/30 cursor-pointer${je.deleted ? ' opacity-60' : ''}`}
                onClick={() => toggleExpand(je._id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-mono text-foreground">{je.ref.toUpperCase()}</span>
                    <Badge variant="outline">{je.type}</Badge>
                    <Badge
                      variant={je.confidence === 'High' ? 'default' : je.confidence === 'Medium' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {je.confidence}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{je.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold tabular-nums text-foreground">{fmtCAD(je.amount)}</span>
                  <Badge variant={sc.variant}>{sc.label}</Badge>
                  {isExpanded
                    ? <ChevronDown  className="w-4 h-4 text-muted-foreground" />
                    : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  }
                </div>
              </div>

              {/* Expanded body */}
              {isExpanded && (
                <div className="border-t border-border">
                  <div className={je.deleted ? 'opacity-60' : undefined}>

                    {/* Lines table */}
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="py-2.5 px-4 font-semibold text-foreground text-left text-xs uppercase tracking-wider whitespace-nowrap w-[150px]">Acc No.</th>
                          <th className="py-2.5 px-4 font-semibold text-foreground text-left text-xs uppercase tracking-wider">Description</th>
                          <th className="py-2.5 px-4 font-semibold text-foreground text-right text-xs uppercase tracking-wider w-36">Debit</th>
                          <th className="py-2.5 px-4 font-semibold text-foreground text-right text-xs uppercase tracking-wider w-36">Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Dr line */}
                        <tr className="border-b border-border hover:bg-muted/20">
                          <td className="py-2 px-3">
                            <AccountSelect
                              value={je.drAccount}
                              disabled={je.deleted}
                              onChange={v => updateJE(je._id, { drAccount: v })}
                              fieldClass={CS}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              className={CI}
                              value={je.drDescription}
                              placeholder="Line description…"
                              disabled={je.deleted}
                              onChange={e => updateJE(je._id, { drDescription: e.target.value })}
                            />
                          </td>
                          <td className="py-2 px-3 w-36">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className={CN}
                              value={je.amount || ''}
                              placeholder="0.00"
                              disabled={je.deleted}
                              onChange={e => updateJE(je._id, { amount: parseFloat(e.target.value) || 0 })}
                            />
                          </td>
                          <td className="py-2 px-3 w-36">
                            <div className="h-9 flex items-center justify-end px-3 rounded-[10px] border border-border/40 bg-muted/30 text-sm text-muted-foreground">0.00</div>
                          </td>
                        </tr>
                        {/* Cr line */}
                        <tr className="hover:bg-muted/20">
                          <td className="py-2 px-3">
                            <AccountSelect
                              value={je.crAccount}
                              disabled={je.deleted}
                              onChange={v => updateJE(je._id, { crAccount: v })}
                              fieldClass={CS}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              className={CI}
                              value={je.crDescription}
                              placeholder="Line description…"
                              disabled={je.deleted}
                              onChange={e => updateJE(je._id, { crDescription: e.target.value })}
                            />
                          </td>
                          <td className="py-2 px-3 w-36">
                            <div className="h-9 flex items-center justify-end px-3 rounded-[10px] border border-border/40 bg-muted/30 text-sm text-muted-foreground">0.00</div>
                          </td>
                          <td className="py-2 px-3 w-36">
                            <div className="h-9 flex items-center justify-end px-3 rounded-[10px] border border-[#dcdfe4] bg-muted/20 text-sm tabular-nums text-foreground">
                              {fmtNum(je.amount)}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr className="font-semibold text-xs border-t border-border" style={{ backgroundColor: '#F8F8FA' }}>
                          <td className="py-2.5 px-4 text-foreground" colSpan={2}>Total</td>
                          <td className="py-2.5 px-4 text-right tabular-nums text-foreground">{fmtNum(je.amount)}</td>
                          <td className="py-2.5 px-4 text-right tabular-nums text-foreground">{fmtNum(je.amount)}</td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Notes */}
                    <div className="px-5 py-3 border-t border-border bg-background">
                      <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1.5">Notes</label>
                      <textarea
                        rows={2}
                        className="input-double-border w-full text-sm px-3 py-2.5 rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground placeholder:text-muted-foreground transition-all duration-200 hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)] resize-none focus:outline-none"
                        placeholder="Add a note for this entry…"
                        value={je.notes}
                        disabled={je.deleted}
                        onChange={e => updateJE(je._id, { notes: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Action footer */}
                  <div
                    className="flex items-center px-5 py-3 border-t border-border"
                    style={{ backgroundColor: '#F8F8FA' }}
                  >
                    {je.deleted ? (
                      <div className="flex items-center gap-3 w-full">
                        <span className="text-xs text-foreground italic flex-1">
                          Deleted{je.deletedAt ? ` on ${new Date(je.deletedAt).toLocaleDateString('en-CA')}` : ''}
                        </span>
                        <Button variant="secondary" size="sm"
                          onClick={() => { restoreJE(je._id); toast.success('AJE restored'); }}
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </Button>
                        <Button variant="secondary" size="sm"
                          onClick={() => { purgeJE(je._id); toast('AJE permanently deleted', { icon: '🗑️' }); }}
                          className="text-red-500 hover:text-red-700 border-red-200 hover:border-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {je.status === 'Draft' && (
                          <Button
                            variant="default" size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => { advanceStatus(je._id, 'Approved'); toast.success('AJE approved'); }}
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </Button>
                        )}
                        {je.status === 'Approved' && (
                          <Button variant="default" size="sm"
                            onClick={() => { advanceStatus(je._id, 'Posted'); toast.success('AJE posted'); }}
                          >
                            <Send className="w-3.5 h-3.5" /> Post
                          </Button>
                        )}
                        {(je.status === 'Draft' || je.status === 'Approved') && (
                          <Button variant="secondary" size="sm"
                            onClick={() => advanceStatus(je._id, 'Draft')}
                          >
                            Revert to Draft
                          </Button>
                        )}
                        <Button variant="secondary" size="sm"
                          className="text-red-500 hover:text-red-700 border-red-200 hover:border-red-300"
                          onClick={() => setDeleteTarget({
                            label: je.description || je.ref,
                            onConfirm: () => {
                              softDelete(je._id);
                              toast('AJE moved to Deleted — use the Deleted filter to restore', { icon: '🗑️' });
                            },
                          })}
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
          <div className="text-center py-12 text-muted-foreground text-sm">
            {filterStatus === 'Deleted'
              ? 'No deleted entries.'
              : filterStatus === 'All'
              ? 'No AJEs — publish transactions to generate entries.'
              : `No ${filterStatus} entries.`}
          </div>
        )}
      </div>

      {/* ── Add Manual AJE Modal ── */}
      <AddInvAJEModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={je => {
          setLocalJEs(prev => [...prev, je]);
          setExpandedIds(prev => new Set([...prev, je._id]));
          toast.success('AJE added');
          setAddOpen(false);
        }}
      />

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <Modal open onClose={() => setDeleteTarget(null)} title="Confirm Delete">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <Trash2 className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">Entry will be moved to Deleted</p>
                <p className="text-xs text-red-600 mt-0.5">You can restore it from the Deleted filter.</p>
              </div>
            </div>
            <p className="text-sm text-foreground px-1">
              Delete <strong>{deleteTarget.label}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => { deleteTarget.onConfirm(); setDeleteTarget(null); }}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Account select subcomponent ─────────────────────────────────────────────

function AccountSelect({ value, disabled, onChange, fieldClass }: {
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
  fieldClass: string;
}) {
  return (
    <div className="relative">
      <select
        className={`${fieldClass} font-mono`}
        style={{ color: 'transparent' }}
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
      >
        {/* Preserve unknown/legacy account codes from compute output */}
        {value && !CHART_OF_ACCOUNTS.some(a => `${a.code} · ${a.name}` === value) && (
          <option value={value}>{value}</option>
        )}
        <option value="">Select</option>
        {CHART_OF_ACCOUNTS.map(a => (
          <option key={a.code} value={`${a.code} · ${a.name}`}>{a.code} · {a.name}</option>
        ))}
      </select>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-foreground pointer-events-none select-none">
        {value
          ? accCodeOnly(value)
          : <span className="font-sans font-normal text-muted-foreground">Select</span>
        }
      </span>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}

// ─── Add Manual AJE Modal ─────────────────────────────────────────────────────

function AddInvAJEModal({ open, onClose, onSave }: {
  open: boolean;
  onClose: () => void;
  onSave: (je: LocalInvJE) => void;
}) {
  const [ref,           setRef]           = useState('');
  const [description,   setDescription]   = useState('');
  const [drAccount,     setDrAccount]     = useState('');
  const [crAccount,     setCrAccount]     = useState('');
  const [drDescription, setDrDescription] = useState('');
  const [crDescription, setCrDescription] = useState('');
  const [amount,        setAmount]        = useState('');
  const [type,          setType]          = useState<AJE['type']>('Correcting');
  const [confidence,    setConfidence]    = useState<AJE['confidence']>('Medium');
  const [notes,         setNotes]         = useState('');

  const reset = () => {
    setRef(''); setDescription(''); setDrAccount(''); setCrAccount('');
    setDrDescription(''); setCrDescription('');
    setAmount(''); setType('Correcting'); setConfidence('Medium'); setNotes('');
  };

  const amtNum = parseFloat(amount) || 0;

  const handleSave = () => {
    if (!ref.trim()) { toast.error('Ref is required'); return; }
    if (!drAccount)  { toast.error('Debit account is required'); return; }
    if (!crAccount)  { toast.error('Credit account is required'); return; }
    if (amtNum <= 0) { toast.error('Amount must be greater than zero'); return; }
    onSave({
      _id:          makeId(),
      ref:          ref.trim(),
      description:  description.trim() || `${type} — manual entry`,
      drAccount,
      crAccount,
      drDescription: drDescription.trim() || description.trim(),
      crDescription: crDescription.trim() || description.trim(),
      amount:       amtNum,
      type,
      confidence,
      status:  'Draft',
      notes,
      deleted: false,
    });
    reset();
  };

  const FL = (text: React.ReactNode) => (
    <span className="block text-[11px] font-medium text-foreground mb-1 whitespace-nowrap">{text}</span>
  );

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="Add Manual AJE"
      size="2xl"
      footer={
        <>
          <Button variant="secondary" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button variant="default" onClick={handleSave}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">

        {/* ── Header strip ── */}
        <div className="flex items-end gap-3 flex-wrap">
          <div className="w-24 shrink-0">
            {FL(<>Ref <span className="text-red-400">*</span></>)}
            <input
              className={`w-full ${SFI} font-mono`}
              placeholder="AE-01"
              value={ref}
              onChange={e => setRef(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            {FL('Entry Description')}
            <input
              className={`w-full ${SFI}`}
              placeholder="e.g. Record realized gain on disposal"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="w-40 shrink-0">
            {FL('Type')}
            <div className="relative">
              <select className={`w-full ${SFS}`} value={type} onChange={e => setType(e.target.value as AJE['type'])}>
                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div className="w-32 shrink-0">
            {FL('Confidence')}
            <div className="relative">
              <select className={`w-full ${SFS}`} value={confidence} onChange={e => setConfidence(e.target.value as AJE['confidence'])}>
                {CONFIDENCE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
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
              </tr>
            </thead>
            <tbody>
              {/* Dr row */}
              <tr className="border-b border-border hover:bg-muted/20">
                <td className="px-3 py-2">
                  <div className="relative">
                    <select className={`w-full ${SFS} font-mono`} style={{ color: 'transparent' }}
                      value={drAccount} onChange={e => setDrAccount(e.target.value)}>
                      <option value="">Select</option>
                      {CHART_OF_ACCOUNTS.map(a => (
                        <option key={a.code} value={`${a.code} · ${a.name}`}>{a.code} · {a.name}</option>
                      ))}
                    </select>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-foreground pointer-events-none select-none">
                      {drAccount ? accCodeOnly(drAccount) : <span className="font-sans font-normal text-muted-foreground">Select</span>}
                    </span>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <input type="text" className={`w-full ${SFI}`}
                    value={drDescription} placeholder="Line description…"
                    onChange={e => setDrDescription(e.target.value)} />
                </td>
                <td className="px-3 py-2">
                  <input type="number" min="0" step="0.01" className={SFN}
                    value={amount} placeholder="0.00"
                    onChange={e => setAmount(e.target.value)} />
                </td>
                <td className="px-3 py-2">
                  <div className="h-9 flex items-center justify-end px-3 rounded-[10px] border border-border/40 bg-muted/30 text-sm text-muted-foreground">0.00</div>
                </td>
              </tr>
              {/* Cr row */}
              <tr className="hover:bg-muted/20">
                <td className="px-3 py-2">
                  <div className="relative">
                    <select className={`w-full ${SFS} font-mono`} style={{ color: 'transparent' }}
                      value={crAccount} onChange={e => setCrAccount(e.target.value)}>
                      <option value="">Select</option>
                      {CHART_OF_ACCOUNTS.map(a => (
                        <option key={a.code} value={`${a.code} · ${a.name}`}>{a.code} · {a.name}</option>
                      ))}
                    </select>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-foreground pointer-events-none select-none">
                      {crAccount ? accCodeOnly(crAccount) : <span className="font-sans font-normal text-muted-foreground">Select</span>}
                    </span>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <input type="text" className={`w-full ${SFI}`}
                    value={crDescription} placeholder="Line description…"
                    onChange={e => setCrDescription(e.target.value)} />
                </td>
                <td className="px-3 py-2">
                  <div className="h-9 flex items-center justify-end px-3 rounded-[10px] border border-border/40 bg-muted/30 text-sm text-muted-foreground">0.00</div>
                </td>
                <td className="px-3 py-2">
                  <div className="h-9 flex items-center justify-end px-3 rounded-[10px] border border-[#dcdfe4] bg-muted/20 text-sm tabular-nums text-foreground">
                    {amtNum > 0 ? fmtNum(amtNum) : <span className="text-muted-foreground">0.00</span>}
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-muted/50 text-sm font-semibold border-t border-border">
                <td colSpan={2} className="px-3 py-2.5 text-right text-foreground">Total</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{fmtNum(amtNum)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{fmtNum(amtNum)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ── Notes ── */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
          <textarea
            rows={3}
            className="input-double-border w-full text-sm px-3 py-2.5 rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground placeholder:text-muted-foreground transition-all duration-200 hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)] resize-none focus:outline-none"
            placeholder="Add your notes here…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

      </div>
    </Modal>
  );
}
