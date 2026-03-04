import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Edit3, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fmtCurrency, fmtNumber, exportToExcel, buildReconciliationExport } from '../lib/utils';
import { Button, Badge, Card, Modal, Textarea, Alert, SectionHeader } from '../components/ui';
import type { ReconciliationItem } from '../types';
import toast from 'react-hot-toast';

export function ReconciliationTab() {
  const { loans, reconciliation, updateReconciliation, overrideReconciliation } = useStore(s => ({
    loans: s.loans, reconciliation: s.reconciliation,
    updateReconciliation: s.updateReconciliation,
    overrideReconciliation: s.overrideReconciliation,
  }));

  const [overrideItem, setOverrideItem] = useState<ReconciliationItem | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [noteItem, setNoteItem] = useState<ReconciliationItem | null>(null);
  const [note, setNote] = useState('');

  const variances = reconciliation.filter(r => r.status === 'Variance');
  const overrides = reconciliation.filter(r => r.status === 'Override');
  const reconciled = reconciliation.filter(r => r.status === 'Reconciled');
  const totalVarianceCAD = variances.reduce((s, r) => s + Math.abs(r.variance * (r.currency === 'USD' ? 1.3530 : 1)), 0);

  const handleExport = async () => {
    await exportToExcel({ 'TB Reconciliation': buildReconciliationExport(reconciliation, loans) }, 'TB_Reconciliation.xlsx');
    toast.success(`Exported ${reconciliation.length} reconciliation item${reconciliation.length !== 1 ? 's' : ''}`);
  };

  return (
    <div className="p-6 space-y-5">
      <SectionHeader
        title="TB Reconciliation"
        subtitle="Subledger vs Trial Balance — principal and accrued interest"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExport}>Export</Button>
            {variances.length === 0 && (
              <Badge variant="success" dot>All Reconciled</Badge>
            )}
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Reconciled', count: reconciled.length, variant: 'success', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Variances', count: variances.length, variant: 'danger', icon: XCircle, color: 'text-red-600 bg-red-50' },
          { label: 'Overrides', count: overrides.length, variant: 'warning', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
        ].map(s => (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color.split(' ')[1]}`}>
              <s.icon className={`w-5 h-5 ${s.color.split(' ')[0]}`} />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{s.count}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {variances.length > 0 && (
        <Alert type="error" title={`${variances.length} Reconciliation Variance${variances.length > 1 ? 's' : ''} — Total: ${fmtCurrency(totalVarianceCAD, 'CAD')}`}>
          Exports are blocked until variances are resolved or overridden with reviewer approval.
        </Alert>
      )}

      {/* Reconciliation Table by Loan */}
      {loans.map(loan => {
        const loanRecs = reconciliation.filter(r => r.loanId === loan.id);
        if (loanRecs.length === 0) return null;

        return (
          <Card key={loan.id}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-slate-900">{loan.name}</h3>
                <Badge variant="outline" size="sm">{loan.currency}</Badge>
                <span className="text-xs text-slate-400">{loan.lender} · {loan.refNumber}</span>
              </div>
              {loanRecs.every(r => r.status === 'Reconciled' || r.status === 'Override') ? (
                <Badge variant="success" dot>Clear</Badge>
              ) : (
                <Badge variant="danger" dot>{loanRecs.filter(r => r.status === 'Variance').length} Variance{loanRecs.filter(r => r.status === 'Variance').length > 1 ? 's' : ''}</Badge>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Account','Type','Subledger Balance','TB Balance','Variance','Status','Notes','Actions'].map(h => (
                      <th key={h} className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right first:text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loanRecs.map(rec => {
                    const statusConfig = {
                      Reconciled: { badge: <Badge variant="success" dot>Reconciled</Badge> },
                      Variance: { badge: <Badge variant="danger" dot>Variance</Badge> },
                      Override: { badge: <Badge variant="warning" dot>Override</Badge> },
                    }[rec.status];

                    return (
                      <tr key={rec.id} className={`border-b border-slate-100 hover:bg-slate-50 ${rec.status === 'Variance' ? 'bg-red-50/30' : ''}`}>
                        <td className="px-5 py-3 font-medium text-slate-700 text-left">{rec.account}</td>
                        <td className="px-5 py-3 text-right"><Badge variant="outline" size="sm">{rec.accountType}</Badge></td>
                        <td className="px-5 py-3 text-right tabular-nums text-slate-700">{fmtCurrency(rec.subledgerBalance, rec.currency)}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-slate-700">{fmtCurrency(rec.tbBalance, rec.currency)}</td>
                        <td className={`px-5 py-3 text-right tabular-nums font-semibold ${rec.variance === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {rec.variance === 0 ? '—' : fmtCurrency(Math.abs(rec.variance), rec.currency)}
                        </td>
                        <td className="px-5 py-3 text-right">{statusConfig.badge}</td>
                        <td className="px-5 py-3 text-right max-w-xs">
                          {rec.notes && <span className="text-xs text-slate-400 truncate block" title={rec.notes}>{rec.notes.slice(0, 40)}…</span>}
                          {rec.overrideReason && <span className="text-xs text-amber-600">Override: {rec.overrideReason.slice(0, 30)}…</span>}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="xs" onClick={() => { setNoteItem(rec); setNote(rec.notes || ''); }}>
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            {rec.status === 'Variance' && (
                              <Button variant="secondary" size="xs" onClick={() => { setOverrideItem(rec); setOverrideReason(''); }}>
                                Override
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}

      {/* Override Modal */}
      <Modal open={!!overrideItem} onClose={() => setOverrideItem(null)}
        title="Override Reconciliation Variance"
        subtitle="Reviewer approval required. Provide a clear reason for the override."
        size="md"
        footer={<><Button variant="secondary" onClick={() => setOverrideItem(null)}>Cancel</Button><Button variant="danger" onClick={() => {
          if (!overrideReason.trim()) { toast.error('Reason required'); return; }
          overrideReconciliation(overrideItem!.id, overrideReason);
          toast.success('Override applied');
          setOverrideItem(null);
        }}>Apply Override</Button></>}
      >
        {overrideItem && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="text-sm font-semibold text-red-800 mb-1">{overrideItem.account}</div>
              <div className="grid grid-cols-3 gap-3 text-xs mt-2">
                <div><div className="text-red-600">Subledger</div><div className="font-bold text-red-800">{fmtCurrency(overrideItem.subledgerBalance, overrideItem.currency)}</div></div>
                <div><div className="text-red-600">TB Balance</div><div className="font-bold text-red-800">{fmtCurrency(overrideItem.tbBalance, overrideItem.currency)}</div></div>
                <div><div className="text-red-600">Variance</div><div className="font-bold text-red-800">{fmtCurrency(Math.abs(overrideItem.variance), overrideItem.currency)}</div></div>
              </div>
            </div>
            <Alert type="warning">
              Overriding a variance bypasses the standard reconciliation check. This action is logged in the audit trail.
            </Alert>
            <Textarea label="Override Reason (required)" value={overrideReason} onChange={e => setOverrideReason(e.target.value)} rows={3} placeholder="Describe why this variance is acceptable and has been reviewed..." />
          </div>
        )}
      </Modal>

      {/* Note Modal */}
      <Modal open={!!noteItem} onClose={() => setNoteItem(null)} title="Edit Reconciliation Note" size="sm"
        footer={<><Button variant="secondary" onClick={() => setNoteItem(null)}>Cancel</Button><Button variant="primary" onClick={() => {
          updateReconciliation(noteItem!.id, { notes: note });
          toast.success('Note saved');
          setNoteItem(null);
        }}>Save Note</Button></>}
      >
        <Textarea label="Note" value={note} onChange={e => setNote(e.target.value)} rows={4} placeholder="Add a note..." />
      </Modal>
    </div>
  );
}
