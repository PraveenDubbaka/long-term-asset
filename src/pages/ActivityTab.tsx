import React, { useState } from 'react';
import { Upload, Plus, CheckCircle, AlertTriangle, Zap, AlertCircle, Download } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fmtCurrency, fmtDateDisplay, exportToExcel, buildActivityExport } from '../lib/utils';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import { Modal, Input, Select } from '../components/ui';
import type { ActivityItem, ActivityStatus } from '../types';
import toast from 'react-hot-toast';

function StatusBadge({ s }: { s: ActivityStatus }) {
  if (s === 'Classified')   return <Badge variant="success"><span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-0.5 inline-block" />Classified</Badge>;
  if (s === 'Unclassified') return <Badge variant="warning"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-0.5 inline-block" />Unclassified</Badge>;
  return <Badge variant="destructive"><span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-0.5 inline-block" />Exception</Badge>;
}

export function ActivityTab() {
  const { loans, activities, addActivity, updateActivity, classifyActivity, ui, setImportWizardOpen } = useStore(s => ({
    loans: s.loans.filter(l => l.status !== 'Inactive'), activities: s.activities,
    addActivity: s.addActivity, updateActivity: s.updateActivity, classifyActivity: s.classifyActivity,
    ui: s.ui, setImportWizardOpen: s.setImportWizardOpen,
  }));

  const [filterStatus, setFilterStatus] = useState<'All' | ActivityStatus>('All');
  const [filterLoanId, setFilterLoanId] = useState<string>('All');
  const [splitItem, setSplitItem] = useState<ActivityItem | null>(null);
  const [splitValues, setSplitValues] = useState({ principal: 0, interest: 0, fees: 0 });
  const [addOpen, setAddOpen] = useState(false);

  const filtered = activities.filter(a =>
    (filterStatus === 'All' || a.status === filterStatus) &&
    (filterLoanId === 'All' || a.loanId === filterLoanId)
  ).sort((a, b) => b.date.localeCompare(a.date));

  const exceptions = activities.filter(a => a.status !== 'Classified').length;
  const classified = activities.filter(a => a.status === 'Classified').length;
  const aiReady = activities.filter(a => a.aiSuggestion && a.status !== 'Classified').length;

  const handleExport = async () => {
    await exportToExcel({ 'Activity': buildActivityExport(filtered, loans) }, 'Loan_Activity.xlsx');
    toast.success(`Exported ${filtered.length} transaction${filtered.length !== 1 ? 's' : ''}`);
  };

  const openSplit = (item: ActivityItem) => {
    setSplitItem(item);
    if (item.aiSuggestion) {
      setSplitValues({ principal: item.aiSuggestion.principal, interest: item.aiSuggestion.interest, fees: item.aiSuggestion.fees });
    } else {
      setSplitValues({ principal: 0, interest: 0, fees: 0 });
    }
  };

  const applyAISuggestion = (item: ActivityItem) => {
    if (!item.aiSuggestion) return;
    classifyActivity(item.id, item.aiSuggestion.principal, item.aiSuggestion.interest, item.aiSuggestion.fees);
    toast.success('AI suggestion applied');
  };

  const saveSplit = () => {
    if (!splitItem) return;
    const total = splitValues.principal + splitValues.interest + splitValues.fees;
    if (Math.abs(total - Math.abs(splitItem.totalAmount)) > 1) {
      toast.error(`Split total ($${total.toLocaleString()}) must equal transaction amount ($${Math.abs(splitItem.totalAmount).toLocaleString()})`);
      return;
    }
    classifyActivity(splitItem.id, splitValues.principal, splitValues.interest, splitValues.fees);
    toast.success('Transaction classified');
    setSplitItem(null);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Loan Activity</h2>
          <p className="text-xs text-foreground mt-0.5">Payments, draws, and classifications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 mr-1" /> Export
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setImportWizardOpen(true, 'activity')}>
            <Upload className="w-3.5 h-3.5 mr-1" /> Import Statement
          </Button>
          <Button variant="default" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Activity
          </Button>
        </div>
      </div>

      {/* Stats Bar — matches reference Clients.tsx pattern */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: CheckCircle, iconBg: 'bg-green-50', iconColor: 'text-green-600', value: classified, label: 'Classified' },
          { icon: AlertTriangle, iconBg: 'bg-amber-50', iconColor: 'text-amber-500', value: exceptions, label: 'Need Attention' },
          { icon: Zap, iconBg: 'bg-primary/10', iconColor: 'text-primary', value: aiReady, label: 'AI Suggestions Ready' },
        ].map(s => (
          <div
            key={s.label}
            className="flex items-center gap-3 px-5 py-3 bg-card border border-border shadow-sm cursor-default hover:shadow-md transition-shadow"
            style={{ borderRadius: '12px' }}
          >
            <div className={`w-9 h-9 rounded-lg ${s.iconBg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.iconColor}`} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold leading-none text-primary">{s.value}</span>
              <span className="text-[11px] font-medium text-foreground leading-tight mt-0.5 whitespace-nowrap">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {(['All', 'Classified', 'Unclassified', 'Exception'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s as typeof filterStatus)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all ${
                filterStatus === s
                  ? 'bg-primary text-white'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={filterLoanId}
          onChange={e => setFilterLoanId(e.target.value)}
          className="text-xs px-3 py-1.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="All">All Loans</option>
          {loans.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {/* Activity Table */}
      <StyledCard className="overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 360px)', minHeight: '220px' }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted border-b border-border">
                {['Date','Loan','Description','Total Amount','Type','Principal','Interest','Fees','Status',''].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider text-right first:text-left last:text-center whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const loan = loans.find(l => l.id === item.loanId);
                const hasAI = item.aiSuggestion && item.status !== 'Classified';

                return (
                  <tr
                    key={item.id}
                    className={`border-b border-border hover:bg-muted/30 transition-colors ${hasAI ? 'bg-primary/[0.03]' : ''}`}
                  >
                    <td className="px-4 py-2 text-foreground whitespace-nowrap">{fmtDateDisplay(item.date)}</td>
                    <td className="px-4 py-2 font-medium text-foreground whitespace-nowrap">{loan?.name || '—'}</td>
                    <td className="px-4 py-2 text-foreground max-w-[200px] truncate">
                      {item.description}
                      {item.sourceRef && <span className="ml-1.5 text-foreground text-xs">({item.sourceRef})</span>}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-semibold text-foreground whitespace-nowrap">
                      {fmtCurrency(Math.abs(item.totalAmount), loan?.currency || 'CAD')}
                      {item.type === 'Draw' && <span className="text-xs text-primary ml-1">(Draw)</span>}
                    </td>
                    <td className="px-4 py-2"><Badge variant="outline">{item.type}</Badge></td>
                    <td className="px-4 py-2 text-right tabular-nums text-green-600 whitespace-nowrap">
                      {item.principalAmount !== undefined ? fmtCurrency(item.principalAmount, loan?.currency || 'CAD') : '—'}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-amber-600 whitespace-nowrap">
                      {item.interestAmount !== undefined ? fmtCurrency(item.interestAmount, loan?.currency || 'CAD') : '—'}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-foreground whitespace-nowrap">
                      {item.feesAmount !== undefined && item.feesAmount > 0 ? fmtCurrency(item.feesAmount, loan?.currency || 'CAD') : '—'}
                    </td>
                    <td className="px-4 py-2"><StatusBadge s={item.status} /></td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-0.5 justify-center">
                        {hasAI && (
                          <button
                            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                            onClick={() => applyAISuggestion(item)}
                            title={`AI: P=${item.aiSuggestion!.principal.toLocaleString()} I=${item.aiSuggestion!.interest.toLocaleString()} (${(item.aiSuggestion!.confidence * 100).toFixed(0)}%)`}
                          >
                            <Zap className="w-3.5 h-3.5 text-primary" />
                          </button>
                        )}
                        <button
                          className="px-2 py-1 text-xs font-medium text-primary hover:bg-muted rounded-lg transition-colors"
                          onClick={() => openSplit(item)}
                        >
                          Split
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-foreground text-sm">No activity records match the current filter</div>
          )}
        </div>
      </StyledCard>

      {/* AI Suggestions Banner */}
      {activities.some(a => a.aiSuggestion && a.status !== 'Classified') && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary/[0.06] border border-primary/20">
          <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-foreground mb-0.5">AI Classification Suggestions Available</p>
            <p className="text-foreground">
              {aiReady} transaction(s) have AI-suggested P/I splits ready to review.
              Click the <Zap className="inline w-3 h-3 text-primary" /> button to apply a suggestion, or use Split to manually classify.
            </p>
          </div>
        </div>
      )}

      {/* Split Modal */}
      <Modal open={!!splitItem} onClose={() => setSplitItem(null)} title="Classify Transaction" subtitle={splitItem?.description} size="md"
        footer={<><Button variant="secondary" onClick={() => setSplitItem(null)}>Cancel</Button><Button variant="default" onClick={saveSplit}>Apply Classification</Button></>}
      >
        {splitItem && (
          <div className="space-y-4">
            {splitItem.aiSuggestion && (
              <div className="bg-primary/[0.06] border border-primary/20 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-primary flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> AI Suggestion</span>
                  <span className="text-xs text-primary/80 font-medium">{(splitItem.aiSuggestion.confidence * 100).toFixed(0)}% confidence</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[['Principal', splitItem.aiSuggestion.principal], ['Interest', splitItem.aiSuggestion.interest], ['Fees', splitItem.aiSuggestion.fees]].map(([k, v]) => (
                    <div key={k as string} className="text-center">
                      <div className="text-foreground">{k}</div>
                      <div className="font-semibold text-foreground">{fmtCurrency(v as number, 'CAD')}</div>
                    </div>
                  ))}
                </div>
                <Button variant="default" size="sm" className="w-full mt-2" onClick={() => {
                  setSplitValues({ principal: splitItem.aiSuggestion!.principal, interest: splitItem.aiSuggestion!.interest, fees: splitItem.aiSuggestion!.fees });
                }}>Use AI Suggestion</Button>
              </div>
            )}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">Total Amount</span>
                <span className="font-semibold tabular-nums text-foreground">{fmtCurrency(Math.abs(splitItem.totalAmount), 'CAD')}</span>
              </div>
              <div className="border-t border-border pt-3 space-y-3">
                <Input label="Principal Amount" type="number" value={splitValues.principal} onChange={e => setSplitValues(p => ({ ...p, principal: parseFloat(e.target.value) || 0 }))} prefix="$" />
                <Input label="Interest Amount" type="number" value={splitValues.interest} onChange={e => setSplitValues(p => ({ ...p, interest: parseFloat(e.target.value) || 0 }))} prefix="$" />
                <Input label="Fees Amount" type="number" value={splitValues.fees} onChange={e => setSplitValues(p => ({ ...p, fees: parseFloat(e.target.value) || 0 }))} prefix="$" />
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                <span className="text-foreground">Remaining unallocated</span>
                <span className={`font-semibold tabular-nums ${Math.abs(Math.abs(splitItem.totalAmount) - splitValues.principal - splitValues.interest - splitValues.fees) > 1 ? 'text-destructive' : 'text-green-600'}`}>
                  {fmtCurrency(Math.abs(splitItem.totalAmount) - splitValues.principal - splitValues.interest - splitValues.fees, 'CAD')}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Activity Modal */}
      <AddActivityModal open={addOpen} onClose={() => setAddOpen(false)} loans={loans}
        onSave={item => { addActivity(item); toast.success('Activity added'); setAddOpen(false); }}
      />
    </div>
  );
}

function AddActivityModal({ open, onClose, loans, onSave }: {
  open: boolean; onClose: () => void;
  loans: { id: string; name: string; currency: string }[];
  onSave: (item: ActivityItem) => void;
}) {
  const [form, setForm] = useState({ loanId: '', date: '', description: '', totalAmount: 0, type: 'Payment' as const });

  return (
    <Modal open={open} onClose={onClose} title="Add Activity" size="md"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="default" onClick={() => {
        if (!form.loanId || !form.date || !form.description) { toast.error('All fields required'); return; }
        onSave({ id: `act-${Date.now()}`, ...form, status: 'Unclassified' } as ActivityItem);
      }}>Add</Button></>}
    >
      <div className="space-y-3">
        <Select label="Loan" value={form.loanId} onChange={e => setForm(p => ({ ...p, loanId: e.target.value }))}
          options={[{ value: '', label: 'Select loan…' }, ...loans.map(l => ({ value: l.id, label: l.name }))]} />
        <Input label="Date" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
        <Input label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        <Input label="Amount" type="number" value={form.totalAmount} onChange={e => setForm(p => ({ ...p, totalAmount: parseFloat(e.target.value) || 0 }))} prefix="$" hint="Use positive for payments, negative for draws" />
        <Select label="Type" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))}
          options={[{ value: 'Payment', label: 'Payment' }, { value: 'Draw', label: 'Draw' }, { value: 'Fee', label: 'Fee' }, { value: 'Other', label: 'Other' }]} />
      </div>
    </Modal>
  );
}
