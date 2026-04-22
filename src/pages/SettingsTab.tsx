import React, { useState } from 'react';
import { Plus, Trash2, Save, Lock, Unlock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fmtDateDisplay } from '../lib/utils';
import { Button, Card, Input, DateInput, Select, Badge, Alert, SectionHeader, Modal } from '../components/ui';
import type { FXRate, Currency } from '../types';
import toast from 'react-hot-toast';

export function SettingsTab() {
  const { settings, updateSettings, accountMappings } = useStore(s => ({
    settings: s.settings, updateSettings: s.updateSettings, accountMappings: s.accountMappings,
  }));

  const [section, setSection] = useState<'engagement' | 'fx' | 'mappings' | 'conventions' | 'lenders'>('engagement');
  const [engForm, setEngForm] = useState({ ...settings });
  const [newFX, setNewFX] = useState<{ currency: Currency; period: string; rate: number }>({ currency: 'USD', period: '2025-01', rate: 1.35 });
  const [deleteTarget, setDeleteTarget] = useState<{ label: string; subLabel?: string; onConfirm: () => void } | null>(null);

  const sections = [
    { id: 'engagement', label: 'Engagement' },
    { id: 'fx', label: 'FX Rates' },
    { id: 'mappings', label: 'GL Mappings' },
    { id: 'conventions', label: 'Conventions' },
    { id: 'lenders', label: 'Lenders & Dropdowns' },
  ];

  const handleSaveEngagement = () => {
    updateSettings(engForm);
    toast.success('Engagement settings saved');
  };

  const addFXRate = () => {
    const existing = settings.fxRates.findIndex(r => r.currency === newFX.currency && r.period === newFX.period);
    if (existing >= 0) {
      const updated = [...settings.fxRates];
      updated[existing] = newFX;
      updateSettings({ fxRates: updated });
    } else {
      updateSettings({ fxRates: [...settings.fxRates, newFX] });
    }
    toast.success('FX rate saved');
  };

  const removeFXRate = (currency: Currency, period: string) => {
    updateSettings({ fxRates: settings.fxRates.filter(r => !(r.currency === currency && r.period === period)) });
    toast.success('FX rate removed');
  };

  const handleLock = () => {
    updateSettings({ status: settings.status === 'Locked' ? 'Blocked' : 'Locked', lockedBy: 'K. Chen', lockedAt: new Date().toISOString() });
    toast.success(settings.status === 'Locked' ? 'Engagement unlocked' : 'Engagement locked');
  };

  return (
    <div className="p-6 space-y-5">
      <SectionHeader
        title="Settings"
        subtitle="Engagement configuration, mappings, and conventions"
        actions={
          <Button variant={settings.status === 'Locked' ? 'success' : 'secondary'} size="sm" onClick={handleLock}>
            {settings.status === 'Locked' ? <><Unlock className="w-3.5 h-3.5" /> Unlock</> : <><Lock className="w-3.5 h-3.5" /> Lock Year-End</>}
          </Button>
        }
      />

      <div className="flex gap-5">
        {/* Left Nav */}
        <div className="w-44 flex-shrink-0 space-y-1">
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id as typeof section)}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${section === s.id ? 'bg-brand-600 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {section === 'engagement' && (
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Engagement Details</h3>
                <Badge variant={settings.status === 'Locked' ? 'purple' : settings.status === 'Blocked' ? 'warning' : 'success'} dot>
                  {settings.status}
                </Badge>
              </div>

              {settings.status === 'Locked' && (
                <Alert type="warning" title="Year-End Locked">
                  Locked by {settings.lockedBy} on {settings.lockedAt ? fmtDateDisplay(settings.lockedAt.slice(0, 10)) : ''}. No further changes can be made without unlocking.
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input label="Client Name" value={engForm.client} onChange={e => setEngForm(p => ({ ...p, client: e.target.value }))} />
                <Input label="Engagement Name" value={engForm.engagement} onChange={e => setEngForm(p => ({ ...p, engagement: e.target.value }))} />
                <DateInput label="Fiscal Year-End Date" value={engForm.fiscalYearEnd} onChange={e => setEngForm(p => ({ ...p, fiscalYearEnd: e.target.value }))} />
                <Select label="Base Currency" value={engForm.baseCurrency} onChange={e => setEngForm(p => ({ ...p, baseCurrency: e.target.value as Currency }))}
                  options={[{ value: 'CAD', label: 'CAD' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]} />
                <Input label="Current Period" value={engForm.currentPeriod} onChange={e => setEngForm(p => ({ ...p, currentPeriod: e.target.value }))} hint="Format: YYYY-MM" />
                <Input label="Reconciliation Threshold ($)" type="number" value={engForm.reconciliationThreshold} onChange={e => setEngForm(p => ({ ...p, reconciliationThreshold: parseFloat(e.target.value) || 0 }))} prefix="$" hint="Variances below this amount are auto-cleared" />
                <Input label="OCR Confidence Threshold (%)" type="number" value={engForm.ocrConfidenceThreshold} onChange={e => setEngForm(p => ({ ...p, ocrConfidenceThreshold: parseFloat(e.target.value) || 0 }))} suffix="%" />
                <Select label="Default Day Count Basis" value={engForm.interestDayCountDefault} onChange={e => setEngForm(p => ({ ...p, interestDayCountDefault: e.target.value as any }))}
                  options={[{ value: 'ACT/365', label: 'ACT/365' }, { value: 'ACT/360', label: 'ACT/360' }, { value: '30/360', label: '30/360' }]} />
              </div>

              <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={handleSaveEngagement}><Save className="w-3.5 h-3.5" /> Save Settings</Button>
              </div>
            </Card>
          )}

          {section === 'fx' && (
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">FX Rates (to {settings.baseCurrency})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead><tr className="border-b border-slate-200">{['Currency','Period','Rate (1 FCY = X CAD)','Source',''].map(h => <th key={h} className="py-2 px-4 text-left text-xs font-semibold text-slate-500">{h}</th>)}</tr></thead>
                  <tbody>
                    {settings.fxRates.map(rate => (
                      <tr key={`${rate.currency}-${rate.period}`} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2.5 px-4"><Badge variant="outline">{rate.currency}</Badge></td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">{rate.period}</td>
                        <td className="py-2.5 px-4 font-semibold tabular-nums">{rate.rate.toFixed(4)}</td>
                        <td className="py-2.5 px-4 text-slate-400 text-xs">Manual entry</td>
                        <td className="py-2.5 px-4"><Button variant="ghost" size="xs" onClick={() => setDeleteTarget({ label: `${rate.currency} ${rate.period}`, subLabel: `Rate: ${rate.rate.toFixed(4)}`, onConfirm: () => removeFXRate(rate.currency, rate.period) })}><Trash2 className="w-3 h-3 text-red-400" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="text-xs font-semibold text-slate-500 mb-3">Add / Update Rate</div>
                <div className="flex items-end gap-3">
                  <Select label="Currency" value={newFX.currency} onChange={e => setNewFX(p => ({ ...p, currency: e.target.value as Currency }))}
                    options={[{ value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }, { value: 'GBP', label: 'GBP' }]}
                    className="w-28" />
                  <Input label="Period (YYYY-MM)" value={newFX.period} onChange={e => setNewFX(p => ({ ...p, period: e.target.value }))} className="w-32" />
                  <Input label="Rate" type="number" value={newFX.rate} onChange={e => setNewFX(p => ({ ...p, rate: parseFloat(e.target.value) || 0 }))} className="w-28" />
                  <Button variant="primary" size="md" onClick={addFXRate}><Plus className="w-3.5 h-3.5" /> Add</Button>
                </div>
              </div>
            </Card>
          )}

          {section === 'mappings' && (
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">Chart of Accounts / GL Mappings</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead><tr className="border-b border-slate-200">{['Code','Account Name','Type','Usage'].map(h => <th key={h} className="py-2 px-4 text-left text-xs font-semibold text-slate-500">{h}</th>)}</tr></thead>
                  <tbody>
                    {accountMappings.map(a => (
                      <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono text-slate-700 font-semibold">{a.code}</td>
                        <td className="py-2.5 px-4 text-slate-700">{a.name}</td>
                        <td className="py-2.5 px-4"><Badge variant="outline" size="sm">{a.type}</Badge></td>
                        <td className="py-2.5 px-4 text-slate-400 text-xs">{
                          { Principal: 'Loan principal liability', AccruedInterestPayable: 'YE accrued interest payable', InterestExpense: 'Interest expense', FXGainLoss: 'FX translation gain/loss', CurrentPortionLTD: 'Current portion LTD reclass', Other: 'Other' }[a.type]
                        }</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {section === 'conventions' && (
            <Card className="p-5 space-y-5">
              <h3 className="text-sm font-semibold text-slate-800">Interest & Calculation Conventions</h3>
              <div className="space-y-4 text-sm">
                {[
                  {
                    label: 'Current Portion Definition',
                    desc: 'Principal payments scheduled within 12 months of the balance sheet date are classified as current.',
                    badge: 'Next 12 months'
                  },
                  {
                    label: 'Accrued Interest Calculation',
                    desc: 'Accrued from last payment date to year-end using the loan\'s day count convention (ACT/365, 30/360, or ACT/360).',
                    badge: 'Simple interest'
                  },
                  {
                    label: 'FX Translation — Principal',
                    desc: 'Monetary items (principal, accrued interest) are retranslated at the period-end spot rate. Translation differences go to P&L.',
                    badge: 'Period-end rate'
                  },
                  {
                    label: 'FX Translation — Interest Expense',
                    desc: 'Interest expense is translated at the transaction rate (date of payment) or average rate for accruals.',
                    badge: 'Transaction rate'
                  },
                  {
                    label: 'Compounding',
                    desc: 'Simple interest is assumed (non-compounding). For amortization schedules, monthly payment is calculated on remaining balance.',
                    badge: 'Simple daily'
                  },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-800">{item.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                    </div>
                    <Badge variant="info" size="sm">{item.badge}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {section === 'lenders' && (
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">Lenders & Reference Data</h3>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Lenders</div>
                  <div className="space-y-1.5">
                    {['Royal Bank of Canada', 'TD Bank', 'HSBC', 'BDC', 'ATB Financial', 'Bank of Montreal', 'Scotiabank'].map(l => (
                      <div key={l} className="flex items-center justify-between py-1.5 px-3 bg-slate-50 rounded-lg text-sm">
                        <span className="text-slate-700">{l}</span>
                        <Button variant="ghost" size="xs" className="text-red-400"><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <input className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Add lender…" />
                      <Button variant="primary" size="sm"><Plus className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Covenant Templates</div>
                  <div className="space-y-1.5">
                    {['DSCR', 'Debt-to-EBITDA', 'Current Ratio', 'Tangible Net Worth', 'FCCR', 'Minimum Cash', 'Debt-to-Equity', 'Borrowing Base'].map(c => (
                      <div key={c} className="flex items-center justify-between py-1.5 px-3 bg-slate-50 rounded-lg text-sm">
                        <span className="text-slate-700">{c}</span>
                        <Badge variant="outline" size="sm">Template</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal open onClose={() => setDeleteTarget(null)} title="Confirm Delete">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <Trash2 className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">This action cannot be undone</p>
              </div>
            </div>
            <div className="px-1">
              <p className="text-sm text-foreground">Are you sure you want to delete <strong>{deleteTarget.label}</strong>?</p>
              {deleteTarget.subLabel && <p className="text-xs text-muted-foreground mt-1">{deleteTarget.subLabel}</p>}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => { deleteTarget.onConfirm(); setDeleteTarget(null); }}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
