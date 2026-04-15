import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Plus, AlertCircle, AlertTriangle, CheckCircle, XCircle, ChevronDown,
  ChevronRight, FileText, Trash2, Sparkles, TrendingDown, TrendingUp, Minus, Download,
  BookOpen, Wand2, CheckSquare, Square, ArrowRight, Check, X, Pencil,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { fmtCurrency, exportToExcel, buildCovenantsExport } from '../lib/utils';
import {
  COVENANT_TEMPLATES, GL_ACCOUNTS, GL_CATEGORY_ORDER, GL_CATEGORY_LABELS,
  computeFormula, getProjectedStatus,
  parseCovenantDefinition, type ParsedSuggestion,
} from '../lib/covenantTemplates';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { Modal, Input, Select, Textarea } from '../components/ui';
import type { Covenant, CovenantFormulaLine, CovenantStatus } from '../types';
import toast from 'react-hot-toast';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<CovenantStatus, { label: string; color: string; icon: React.ElementType; bg: string; border: string }> = {
  OK:        { label: 'OK',       color: 'text-emerald-700', icon: CheckCircle,   bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'At Risk': { label: 'At Risk',  color: 'text-amber-700',   icon: AlertTriangle, bg: 'bg-amber-50',   border: 'border-amber-200'  },
  Breached:  { label: 'Breached', color: 'text-red-700',     icon: XCircle,       bg: 'bg-red-50',     border: 'border-red-200'    },
  Unknown:   { label: 'Unknown',  color: 'text-foreground', icon: AlertCircle, bg: 'bg-muted',      border: 'border-border'     },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtCovenantValue = (c: Covenant, value: number | undefined): string => {
  if (value === undefined) return '—';
  if (c.isRatioCovenant) return `${value.toFixed(2)}x`;
  if (c.name.includes('Cash') || c.name.includes('Worth') || c.name.includes('Net Worth') || c.name.includes('Capital'))
    return fmtCurrency(value, 'CAD', true);
  return value >= 1000 ? fmtCurrency(value, 'CAD', true) : `${(value * 100).toFixed(1)}%`;
};

const getGaugePercent = (c: Covenant): number => {
  if (c.currentValue === undefined || !c.threshold) return 50;
  if (c.operator === '>=' || c.operator === '>') return Math.min(100, (c.currentValue / (c.threshold * 1.5)) * 100);
  return Math.min(100, ((c.threshold * 1.5 - c.currentValue) / (c.threshold * 1.5)) * 100);
};

const getMarginLabel = (c: Covenant): string => {
  if (c.currentValue === undefined || !c.threshold) return '—';
  const margin = (c.operator === '>=' || c.operator === '>')
    ? ((c.currentValue / c.threshold - 1) * 100)
    : ((c.threshold / c.currentValue - 1) * 100);
  return `${margin >= 0 ? '+' : ''}${margin.toFixed(1)}%`;
};

// ─── Main Tab ─────────────────────────────────────────────────────────────────
export function CovenantsTab() {
  const { loans, covenants, updateCovenant, addCovenant, deleteCovenant, updateLoan } = useStore(s => ({
    loans: s.loans.filter(l => l.status !== 'Inactive'), covenants: s.covenants,
    updateCovenant: s.updateCovenant, addCovenant: s.addCovenant, deleteCovenant: s.deleteCovenant, updateLoan: s.updateLoan,
  }));

  const loansWithCovenants = loans.filter(l => l.covenantIds && l.covenantIds.length > 0);
  const [selectedLoanId, setSelectedLoanId] = useState<string>(loansWithCovenants[0]?.id || '');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const selectedLoan  = loans.find(l => l.id === selectedLoanId);
  const loanCovenants = selectedLoan ? covenants.filter(c => selectedLoan.covenantIds.includes(c.id)) : [];

  const handleExport = async () => {
    await exportToExcel({ 'Covenants': buildCovenantsExport(covenants, loans) }, 'Covenant_Monitoring.xlsx');
    toast.success(`Exported ${covenants.length} covenant${covenants.length !== 1 ? 's' : ''}`);
  };

  // per-row edit state
  const [editingCovId, setEditingCovId]   = useState<string | null>(null);
  const [rowEdits, setRowEdits]           = useState<Partial<Covenant>>({});
  const [draftNewRows, setDraftNewRows]   = useState<(Partial<Covenant> & { _newId: string })[]>([]);

  const IIC = 'input-double-border h-9 w-full min-w-0 px-3 text-xs border border-[#dcdfe4] rounded-[10px] bg-white text-foreground placeholder:text-foreground transition-all duration-200 hover:border-[hsl(210_25%_75%)] focus:outline-none focus:ring-0 dark:bg-card dark:border-[hsl(220_15%_30%)]';

  const startEdit = (id: string) => {
    const cov = covenants.find(c => c.id === id);
    setEditingCovId(id);
    setRowEdits(cov ? { ...cov } : {});
  };
  const saveEdit = () => {
    if (!editingCovId) return;
    updateCovenant(editingCovId, rowEdits);
    toast.success('Covenant saved');
    setEditingCovId(null);
    setRowEdits({});
  };
  const cancelEdit = () => {
    setEditingCovId(null);
    setRowEdits({});
  };
  const setEdit = (field: keyof Covenant, value: unknown) =>
    setRowEdits(p => ({ ...p, [field]: value }));
  const setDraftEdit = (_newId: string, field: keyof Covenant, value: unknown) =>
    setDraftNewRows(p => p.map(r => r._newId === _newId ? { ...r, [field]: value } : r));

  const mkId = () => `fl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const applyTemplateToEdit = (_id: string, templateId: string) => {
    const tmpl = COVENANT_TEMPLATES.find(t => t.id === templateId);
    if (!tmpl) { setEdit('name', templateId); return; }
    setRowEdits(p => ({
      ...p,
      name:              tmpl.id,
      operator:          tmpl.operator,
      threshold:         tmpl.threshold,
      isRatioCovenant:   tmpl.isRatio,
      useFormulaBuilder: true,
      formula:           tmpl.label,
      formulaLines:      tmpl.numeratorLines.map(l => ({ ...l, id: mkId() })),
      denominatorLines:  (tmpl.denominatorLines ?? []).map(l => ({ ...l, id: mkId() })),
    }));
  };

  const applyTemplateToDraft = (_newId: string, templateId: string) => {
    const tmpl = COVENANT_TEMPLATES.find(t => t.id === templateId);
    if (!tmpl) { setDraftEdit(_newId, 'name', templateId); return; }
    setDraftNewRows(p => p.map(r => r._newId !== _newId ? r : {
      ...r,
      name:              tmpl.id,
      operator:          tmpl.operator,
      threshold:         tmpl.threshold,
      isRatioCovenant:   tmpl.isRatio,
      useFormulaBuilder: true,
      formula:           tmpl.label,
      formulaLines:      tmpl.numeratorLines.map(l => ({ ...l, id: mkId() })),
      denominatorLines:  (tmpl.denominatorLines ?? []).map(l => ({ ...l, id: mkId() })),
    }));
  };
  const addDraftRow = () => {
    const _newId = `new-${Date.now()}`;
    setEditingCovId(null);
    setRowEdits({});
    setDraftNewRows(p => [...p, { _newId, type: 'Quantitative', status: 'Unknown', operator: '>=', threshold: 0, frequency: 'Annual', formulaLines: [], denominatorLines: [] }]);
  };
  const handleDeleteCov = (id: string) => {
    deleteCovenant(id);
    if (selectedLoan) {
      updateLoan(selectedLoanId, { covenantIds: (selectedLoan.covenantIds ?? []).filter(cid => cid !== id) });
    }
    if (editingCovId === id) { setEditingCovId(null); setRowEdits({}); }
    toast.success('Covenant deleted');
  };

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Covenant Monitoring</h2>
          <p className="text-xs text-foreground mt-0.5">Quantitative and qualitative covenant tracking with GL formula builder</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 mr-1" /> Export
          </Button>
          <Button variant="default" size="sm" onClick={addDraftRow}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Covenant
          </Button>
        </div>
      </div>



      {/* Loan Selector + Table */}
      <div className="bg-card border border-border overflow-hidden shadow-[0_2px_8px_hsl(213_40%_20%/0.06)]" style={{ borderRadius: '12px' }}>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/30 flex-wrap">
          <span className="text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap">Loan</span>
          <div className="relative">
            <select
              className="input-double-border h-9 text-sm pl-3 pr-8 rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground appearance-none transition-all duration-200 hover:border-[hsl(210_25%_75%)] cursor-pointer focus:outline-none"
              value={selectedLoanId}
              onChange={e => { setSelectedLoanId(e.target.value); setExpandedId(null); }}
            >
              {loansWithCovenants.length === 0
                ? <option value="">No loans with covenants</option>
                : loansWithCovenants.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground" />
          </div>
          {selectedLoan && (
            <>
              <span className="text-xs text-foreground">·</span>
              <span className="text-xs text-foreground">{selectedLoan.lender}</span>
              <span className="text-xs text-foreground">·</span>
              <span className="text-xs font-mono text-foreground">{selectedLoan.refNumber}</span>
              <Badge variant="outline" className="text-xs">{selectedLoan.currency}</Badge>
            </>
          )}
          <div className="ml-auto text-xs text-foreground">{loanCovenants.length} covenant{loanCovenants.length !== 1 ? 's' : ''}</div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 390px)', minHeight: '200px' }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted border-b border-border">
                <th className="w-8 py-2.5 px-3" />
                {[
                  ['Covenant',    'text-left',   ''],
                  ['Type',        'text-left',   ''],
                  ['Status',      'text-left',   ''],
                  ['Current',     'text-right',  ''],
                  ['Projected',   'text-right',  'hidden lg:table-cell'],
                  ['Threshold',   'text-right',  ''],
                  ['Frequency',   'text-right',  'hidden xl:table-cell'],
                  ['Last Tested', 'text-right',  'hidden xl:table-cell'],
                  ['Actions',     'text-center', ''],
                ].map(([h, align, extra]) => (
                  <th key={h as string} className={`py-2.5 px-3 text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap ${align} ${extra}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loanCovenants.length === 0 && draftNewRows.length === 0 ? (
                <tr><td colSpan={10} className="px-5 py-12 text-center text-sm text-foreground">No covenants for this loan</td></tr>
              ) : null}

              {/* Existing covenant rows */}
              {loanCovenants.map(covBase => {
                const isEditing = editingCovId === covBase.id;
                const cov = { ...covBase, ...(isEditing ? rowEdits : {}) } as Covenant;
                const cfg = STATUS_CONFIG[cov.status];
                const Icon = cfg.icon;
                const isExpanded = expandedId === cov.id;

                // Projected status
                const projSt = (cov.projectedValue !== undefined && cov.threshold !== undefined && cov.operator)
                  ? getProjectedStatus(cov.projectedValue, cov.threshold, cov.operator)
                  : null;
                const projDirection = (cov.projectedValue !== undefined && cov.currentValue !== undefined)
                  ? (cov.projectedValue > cov.currentValue ? 'up' : cov.projectedValue < cov.currentValue ? 'down' : 'flat')
                  : null;

                return (
                  <React.Fragment key={cov.id}>
                    <tr
                      className={`border-b border-border transition-colors ${
                        isExpanded ? 'bg-primary/[0.025]'
                        : isEditing ? 'bg-primary/[0.03]'
                        : cov.status === 'Breached' ? 'bg-red-50/40 hover:bg-red-50/60'
                        : cov.status === 'At Risk'  ? 'bg-amber-50/30 hover:bg-amber-50/50'
                        : 'hover:bg-muted/30'
                      }`}
                    >
                      {/* Expand chevron */}
                      <td
                        className="px-3 py-2 w-8 cursor-pointer select-none"
                        onClick={() => setExpandedId(isExpanded ? null : cov.id)}
                      >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-foreground" />}
                      </td>

                      {/* Name */}
                      <td className="px-3 py-2 text-left">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${cfg.color} flex-shrink-0`} />
                          {isEditing ? (
                            <select
                              value={cov.name ?? ''}
                              onChange={e => applyTemplateToEdit(covBase.id, e.target.value)}
                              className={`${IIC} font-medium`}
                            >
                              <option value="">— Select covenant —</option>
                              {COVENANT_TEMPLATES.map(t => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="font-medium text-sm text-foreground truncate">{cov.name || '—'}</span>
                          )}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-3 py-2 text-left">
                        {isEditing ? (
                          <select value={cov.type} onChange={e => setEdit('type', e.target.value as Covenant['type'])} className={IIC}>
                            <option value="Quantitative">Quantitative</option>
                            <option value="Qualitative">Qualitative</option>
                          </select>
                        ) : (
                          <span className="text-xs text-foreground">{cov.type}</span>
                        )}
                      </td>

                      {/* Status — read-only, computed by system */}
                      <td className="px-3 py-2 text-left">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                          <Icon className="w-3 h-3" /> {cfg.label}
                        </span>
                      </td>

                      {/* Current Value */}
                      <td className="px-3 py-2 text-right">
                        {cov.type === 'Quantitative' ? (
                          isEditing ? (
                            <input
                              type="number"
                              value={cov.currentValue ?? ''}
                              onChange={e => setEdit('currentValue', parseFloat(e.target.value) || 0)}
                              placeholder="—"
                              className={`${IIC} text-right tabular-nums`}
                            />
                          ) : (
                            <span className="tabular-nums text-sm font-medium">{fmtCovenantValue(cov, cov.currentValue)}</span>
                          )
                        ) : <span className="text-foreground text-xs">—</span>}
                      </td>

                      {/* Projected Value */}
                      <td className="px-3 py-2 text-right hidden lg:table-cell">
                        {cov.type === 'Quantitative' && cov.projectedValue !== undefined ? (
                          <div className="flex items-center justify-end gap-1">
                            {projDirection === 'up'   && <TrendingUp   className="w-3 h-3 text-emerald-500 flex-shrink-0" />}
                            {projDirection === 'down' && <TrendingDown  className="w-3 h-3 text-red-500 flex-shrink-0" />}
                            {projDirection === 'flat' && <Minus         className="w-3 h-3 text-foreground flex-shrink-0" />}
                            <span className={`tabular-nums text-sm font-medium ${
                              projSt === 'Breached' ? 'text-red-600'
                              : projSt === 'At Risk' ? 'text-amber-600'
                              : 'text-emerald-600'
                            }`}>{fmtCovenantValue(cov, cov.projectedValue)}</span>
                            {projSt && projSt !== cov.status && (
                              <Badge
                                variant={projSt === 'Breached' ? 'destructive' : projSt === 'At Risk' ? 'warning' : 'success'}
                                className="text-[10px] px-1 py-0 ml-0.5"
                              >
                                {projSt}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-foreground text-xs">—</span>
                        )}
                      </td>

                      {/* Threshold */}
                      <td className="px-3 py-2 text-right">
                        {cov.type === 'Quantitative' ? (
                          isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <select
                                value={cov.operator ?? '>='}
                                onChange={e => setEdit('operator', e.target.value as Covenant['operator'])}
                                className={`${IIC} w-14 text-center`}
                              >
                                <option value=">=">≥</option>
                                <option value="<=">≤</option>
                                <option value=">">{'>'}</option>
                                <option value="<">{'<'}</option>
                              </select>
                              <input
                                type="number"
                                value={cov.threshold ?? ''}
                                onChange={e => setEdit('threshold', parseFloat(e.target.value) || 0)}
                                placeholder="—"
                                className={`${IIC} text-right tabular-nums`}
                              />
                            </div>
                          ) : (
                            <span className="tabular-nums text-sm">{cov.operator} {fmtCovenantValue(cov, cov.threshold)}</span>
                          )
                        ) : <span className="text-foreground text-xs">—</span>}
                      </td>


                      {/* Frequency */}
                      <td className="px-3 py-2 text-right hidden xl:table-cell">
                        {isEditing ? (
                          <select value={cov.frequency} onChange={e => setEdit('frequency', e.target.value as Covenant['frequency'])} className={IIC}>
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Annual">Annual</option>
                          </select>
                        ) : (
                          <span className="text-xs text-foreground">{cov.frequency}</span>
                        )}
                      </td>

                      {/* Last Tested */}
                      <td className="px-3 py-2 text-right hidden xl:table-cell">
                        {isEditing ? (
                          <input
                            type="date"
                            value={cov.lastTested || ''}
                            onChange={e => setEdit('lastTested', e.target.value)}
                            className={`${IIC} text-right`}
                          />
                        ) : (
                          <span className="text-xs text-foreground tabular-nums">{cov.lastTested || '—'}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2 text-center">
                        {isEditing ? (
                          <div className="flex items-center gap-1 justify-center">
                            <button onClick={saveEdit} className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600" title="Save"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={cancelEdit} className="p-1.5 hover:bg-muted rounded-lg text-foreground" title="Cancel"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 justify-center">
                            <button onClick={() => startEdit(covBase.id)} className="p-1.5 hover:bg-muted rounded-lg text-foreground" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteCov(covBase.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <tr className="border-b border-border">
                        <td colSpan={10} className="bg-muted/20 px-6 py-4">
                          <div className="flex items-start gap-6 text-xs">

                            {/* Formula / Method */}
                            <div className="flex-1">
                              <div className="font-semibold text-foreground uppercase tracking-wider mb-2">Formula / Method</div>
                              {cov.useFormulaBuilder && cov.formulaLines?.length ? (
                                <FormulaDisplay
                                  cov={cov}
                                  editMode={isEditing}
                                  onUpdateNumeratorLine={(lineId, amt) => {
                                    const updated = (cov.formulaLines ?? []).map(l => l.id === lineId ? { ...l, amount: amt } : l);
                                    setEdit('formulaLines', updated);
                                    const numTotal = updated.reduce((s, l) => s + l.amount * l.multiplier * (l.sign === '+' ? 1 : -1), 0);
                                    const denTotal = (cov.denominatorLines ?? []).reduce((s, l) => s + l.amount * l.multiplier * (l.sign === '+' ? 1 : -1), 0);
                                    const cv = cov.isRatioCovenant ? (denTotal !== 0 ? numTotal / denTotal : 0) : numTotal;
                                    setEdit('currentValue', Math.round(cv * 10000) / 10000);
                                  }}
                                  onUpdateDenominatorLine={(lineId, amt) => {
                                    const updated = (cov.denominatorLines ?? []).map(l => l.id === lineId ? { ...l, amount: amt } : l);
                                    setEdit('denominatorLines', updated);
                                    const numTotal = (cov.formulaLines ?? []).reduce((s, l) => s + l.amount * l.multiplier * (l.sign === '+' ? 1 : -1), 0);
                                    const denTotal = updated.reduce((s, l) => s + l.amount * l.multiplier * (l.sign === '+' ? 1 : -1), 0);
                                    const cv = cov.isRatioCovenant ? (denTotal !== 0 ? numTotal / denTotal : 0) : numTotal;
                                    setEdit('currentValue', Math.round(cv * 10000) / 10000);
                                  }}
                                />
                              ) : isEditing ? (
                                <textarea
                                  rows={2}
                                  value={cov.formula || ''}
                                  onChange={e => setEdit('formula', e.target.value)}
                                  placeholder="Describe the formula or calculation method…"
                                  className="w-full text-xs font-mono bg-background border border-border rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:border-primary/40 text-foreground placeholder:text-foreground transition-colors leading-relaxed"
                                />
                              ) : (
                                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{cov.formula || '—'}</p>
                              )}
                            </div>


                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Draft new rows */}
              {draftNewRows.map(draft => (
                <React.Fragment key={draft._newId}>
                  <tr className="border-b border-border bg-primary/[0.015] hover:bg-primary/[0.03] transition-colors">
                    <td className="px-3 py-2 w-8" />

                    {/* Name */}
                    <td className="px-3 py-2 text-left">
                      <select
                        value={draft.name ?? ''}
                        onChange={e => applyTemplateToDraft(draft._newId, e.target.value)}
                        className={`${IIC} font-medium`}
                        autoFocus
                      >
                        <option value="">— Select covenant —</option>
                        {COVENANT_TEMPLATES.map(t => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* Type */}
                    <td className="px-3 py-2 text-left">
                      <select value={draft.type ?? 'Quantitative'} onChange={e => setDraftEdit(draft._newId, 'type', e.target.value as Covenant['type'])} className={IIC}>
                        <option value="Quantitative">Quantitative</option>
                        <option value="Qualitative">Qualitative</option>
                      </select>
                    </td>

                    {/* Status — read-only, computed by system */}
                    <td className="px-3 py-2 text-left">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
                        <AlertCircle className="w-3 h-3" /> Unknown
                      </span>
                    </td>

                    {/* Current Value */}
                    <td className="px-3 py-2 text-right">
                      {(draft.type ?? 'Quantitative') === 'Quantitative' ? (
                        <input
                          type="number"
                          value={draft.currentValue ?? ''}
                          onChange={e => setDraftEdit(draft._newId, 'currentValue', parseFloat(e.target.value) || 0)}
                          placeholder="—"
                          className={`${IIC} text-right tabular-nums`}
                        />
                      ) : <span className="text-foreground text-xs">—</span>}
                    </td>

                    {/* Projected Value — blank for drafts */}
                    <td className="px-3 py-2 text-right hidden lg:table-cell">
                      <span className="text-foreground text-xs">—</span>
                    </td>

                    {/* Threshold */}
                    <td className="px-3 py-2 text-right">
                      {(draft.type ?? 'Quantitative') === 'Quantitative' ? (
                        <div className="flex items-center justify-end gap-1">
                          <select
                            value={draft.operator ?? '>='}
                            onChange={e => setDraftEdit(draft._newId, 'operator', e.target.value as Covenant['operator'])}
                            className={`${IIC} w-14 text-center`}
                          >
                            <option value=">=">≥</option>
                            <option value="<=">≤</option>
                            <option value=">">{'>'}</option>
                            <option value="<">{'<'}</option>
                          </select>
                          <input
                            type="number"
                            value={draft.threshold ?? ''}
                            onChange={e => setDraftEdit(draft._newId, 'threshold', parseFloat(e.target.value) || 0)}
                            placeholder="—"
                            className={`${IIC} text-right tabular-nums`}
                          />
                        </div>
                      ) : <span className="text-foreground text-xs">—</span>}
                    </td>


                    {/* Frequency */}
                    <td className="px-3 py-2 text-right hidden xl:table-cell">
                      <select value={draft.frequency ?? 'Annual'} onChange={e => setDraftEdit(draft._newId, 'frequency', e.target.value as Covenant['frequency'])} className={IIC}>
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Annual">Annual</option>
                      </select>
                    </td>

                    {/* Last Tested — blank for drafts */}
                    <td className="px-3 py-2 text-right hidden xl:table-cell">
                      <span className="text-foreground text-xs">—</span>
                    </td>

                    {/* Actions — save / remove draft */}
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <button
                          onClick={() => {
                            const { _newId, ...data } = draft;
                            void _newId;
                            const newId = `cov-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
                            addCovenant({ ...data, id: newId, loanId: selectedLoanId } as unknown as Covenant);
                            if (selectedLoan) {
                              updateLoan(selectedLoanId, { covenantIds: [...(selectedLoan.covenantIds ?? []), newId] });
                            }
                            setDraftNewRows(p => p.filter(r => r._newId !== draft._newId));
                            toast.success('Covenant added');
                          }}
                          className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDraftNewRows(p => p.filter(r => r._newId !== draft._newId))}
                          className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CovenantFormModal retained for formula builder access if needed */}
    </div>
  );
}

// ─── FormulaDisplay (read-only + editable in expanded row) ───────────────────
function FormulaDisplay({ cov, editMode = false, onUpdateNumeratorLine, onUpdateDenominatorLine }: {
  cov: Covenant;
  editMode?: boolean;
  onUpdateNumeratorLine?: (lineId: string, amount: number) => void;
  onUpdateDenominatorLine?: (lineId: string, amount: number) => void;
}) {
  const numLines = cov.formulaLines ?? [];
  const denLines = cov.denominatorLines ?? [];

  const numTotal = numLines.reduce((s, l) => s + l.amount * l.multiplier * (l.sign === '+' ? 1 : -1), 0);
  const denTotal = denLines.reduce((s, l) => s + l.amount * l.multiplier * (l.sign === '+' ? 1 : -1), 0);

  const fmtAmt = (v: number) => v === 0 ? '$0' : `$${v.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const IIC = 'input-double-border h-9 w-28 px-3 text-xs text-right tabular-nums border border-[#dcdfe4] rounded-[10px] bg-white text-foreground transition-all duration-200 hover:border-[hsl(210_25%_75%)] focus:outline-none focus:ring-0 dark:bg-card dark:border-[hsl(220_15%_30%)]';

  const LineRows = ({ lines, onUpdate }: { lines: CovenantFormulaLine[]; onUpdate?: (id: string, amt: number) => void }) => (
    <>
      {lines.map(l => {
        const glName = GL_ACCOUNTS.find(a => a.code === l.glAccount)?.name ?? l.glAccount;
        return (
          <div key={l.id} className="flex items-center gap-2 py-0.5">
            <span className={`w-4 text-center font-mono font-bold ${l.sign === '+' ? 'text-emerald-600' : 'text-red-500'}`}>{l.sign}</span>
            <span className="flex-1 text-foreground truncate" title={glName}>{l.description || glName}</span>
            <span className="tabular-nums font-mono text-foreground text-[11px]">{l.glAccount}</span>
            {editMode && onUpdate ? (
              <input
                type="number"
                className={IIC}
                value={l.amount === 0 ? '' : l.amount}
                placeholder="0"
                onChange={e => onUpdate(l.id, parseFloat(e.target.value) || 0)}
              />
            ) : (
              <span className="tabular-nums font-semibold text-foreground">{fmtAmt(l.amount * l.multiplier)}</span>
            )}
          </div>
        );
      })}
    </>
  );

  return (
    <div className="bg-background border border-border rounded-lg px-3 py-2.5 space-y-2">
      {cov.isRatioCovenant ? (
        <>
          <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Numerator</div>
          <LineRows lines={numLines} onUpdate={onUpdateNumeratorLine} />
          <div className="border-t border-border pt-1.5 flex justify-between text-[11px]">
            <span className="text-foreground">Numerator Total</span>
            <span className="font-bold text-foreground">{fmtAmt(numTotal)}</span>
          </div>
          <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider pt-1">Denominator</div>
          <LineRows lines={denLines} onUpdate={onUpdateDenominatorLine} />
          <div className="border-t border-border pt-1.5 flex justify-between text-[11px]">
            <span className="text-foreground">Denominator Total</span>
            <span className="font-bold text-foreground">{fmtAmt(denTotal)}</span>
          </div>
          <div className="border-t-2 border-primary/20 pt-1.5 text-xs font-bold">
            <span className="text-foreground">{fmtAmt(numTotal)} ÷ {fmtAmt(denTotal)} = </span>
            <span className="text-primary">{denTotal !== 0 ? (numTotal / denTotal).toFixed(2) : '—'}x</span>
          </div>
        </>
      ) : (
        <>
          <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Numerator</div>
          <LineRows lines={numLines} onUpdate={onUpdateNumeratorLine} />
          <div className="border-t border-border pt-1.5 flex justify-between text-[11px]">
            <span className="text-foreground">Numerator Total</span>
            <span className="font-bold text-foreground">{fmtAmt(numTotal)}</span>
          </div>
          {denLines.length > 0 && (
            <>
              <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider pt-1">Denominator</div>
              <LineRows lines={denLines} onUpdate={onUpdateDenominatorLine} />
              <div className="border-t border-border pt-1.5 flex justify-between text-[11px]">
                <span className="text-foreground">Denominator Total</span>
                <span className="font-bold text-foreground">{fmtAmt(denTotal)}</span>
              </div>
            </>
          )}
          <div className="border-t-2 border-primary/20 pt-1.5 flex justify-between text-xs font-bold">
            <span className="text-foreground">Total</span>
            <span className="text-primary">{fmtAmt(numTotal)}</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── CovenantFormModal ────────────────────────────────────────────────────────
function CovenantFormModal({ open, onClose, covenant, loans, onSave }: {
  open: boolean; onClose: () => void; covenant: Covenant | null;
  loans: { id: string; name: string }[]; onSave: (c: Partial<Covenant>) => void;
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'definition' | 'formula'>('details');
  const [form, setForm] = useState<Partial<Covenant>>(covenant || {
    type: 'Quantitative', frequency: 'Annual', status: 'Unknown', operator: '>=', threshold: 0,
    useFormulaBuilder: false, isRatioCovenant: true,
    formulaLines: [], denominatorLines: [],
  });

  // Reset form when modal opens with a new covenant
  useEffect(() => {
    if (open) {
      setForm(covenant || {
        type: 'Quantitative', frequency: 'Annual', status: 'Unknown', operator: '>=', threshold: 0,
        useFormulaBuilder: false, isRatioCovenant: true,
        formulaLines: [], denominatorLines: [],
      });
      setActiveTab('details');
    }
  }, [open, covenant]);

  // Auto-compute currentValue and projectedValue from formula lines
  const computedCurrent = useMemo(() => {
    if (!form.useFormulaBuilder || !form.formulaLines?.length) return undefined;
    return computeFormula(form.formulaLines, form.denominatorLines, form.isRatioCovenant ?? false, false);
  }, [form.useFormulaBuilder, form.formulaLines, form.denominatorLines, form.isRatioCovenant]);

  const computedProjected = useMemo(() => {
    if (!form.useFormulaBuilder || !form.formulaLines?.length) return undefined;
    return computeFormula(form.formulaLines, form.denominatorLines, form.isRatioCovenant ?? false, true);
  }, [form.useFormulaBuilder, form.formulaLines, form.denominatorLines, form.isRatioCovenant]);

  useEffect(() => {
    if (computedCurrent !== undefined) {
      setForm(p => ({ ...p, currentValue: Math.round(computedCurrent * 10000) / 10000, projectedValue: computedProjected !== undefined ? Math.round(computedProjected * 10000) / 10000 : p.projectedValue }));
    }
  }, [computedCurrent, computedProjected]);

  const f  = (k: keyof Covenant) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));
  const fn = (k: keyof Covenant) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: parseFloat(e.target.value) || 0 }));

  const IC = "h-7 w-full min-w-0 px-1.5 text-xs border border-border rounded bg-background focus:outline-none focus:border-primary/40";

  return (
    <Modal
      open={open} onClose={onClose}
      title={covenant ? 'Edit Covenant' : 'Add Covenant'}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="default" onClick={() => onSave(form)}>{covenant ? 'Save Changes' : 'Add Covenant'}</Button>
        </>
      }
    >
      {/* Tabs */}
      <div className="flex border-b border-border mb-4 -mt-1">
        {(['details', 'definition', 'formula'] as const).map(t => (
          <button
            key={t}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === t ? 'border-primary text-primary' : 'border-transparent text-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab(t)}
          >
            {t === 'details' ? 'Details' : t === 'definition' ? (
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Definition Parser
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Formula Builder
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <div className="space-y-3">
          <Select label="Loan" value={form.loanId || ''} onChange={f('loanId')}
            options={[{ value: '', label: 'Select loan…' }, ...loans.map(l => ({ value: l.id, label: l.name }))]} />
          <Input label="Covenant Name" value={form.name || ''} onChange={f('name')} placeholder="e.g. DSCR" />
          <Select label="Type" value={form.type || 'Quantitative'} onChange={f('type')}
            options={[{ value: 'Quantitative', label: 'Quantitative' }, { value: 'Qualitative', label: 'Qualitative' }]} />
          {form.type === 'Quantitative' && (
            <div className="grid grid-cols-2 gap-3">
              <Select label="Operator" value={form.operator || '>='} onChange={f('operator')}
                options={[{ value: '>=', label: '≥ (at least)' }, { value: '<=', label: '≤ (at most)' }, { value: '>', label: '> (greater than)' }, { value: '<', label: '< (less than)' }]} />
              <Input label="Threshold"     type="number" value={form.threshold    || ''} onChange={fn('threshold')}    />
              <Input label="Current Value" type="number" value={form.currentValue || ''} onChange={fn('currentValue')}
                placeholder={form.useFormulaBuilder ? 'Auto from formula' : ''} />
              <Input label="Projected Value" type="number" value={form.projectedValue || ''} onChange={fn('projectedValue')}
                placeholder={form.useFormulaBuilder ? 'Auto from formula' : ''} />
            </div>
          )}
          <Select label="Frequency" value={form.frequency || 'Annual'} onChange={f('frequency')}
            options={[{ value: 'Monthly', label: 'Monthly' }, { value: 'Quarterly', label: 'Quarterly' }, { value: 'Annual', label: 'Annual' }]} />
          <Input label="Formula / Method (text)" value={form.formula || ''} onChange={f('formula')} placeholder="Use Formula Builder tab for structured GL formula" />
          <Textarea label="Description" value={form.description || ''} onChange={f('description')} rows={2} />
          <Textarea label="Notes" value={form.notes || ''} onChange={f('notes')} rows={2} />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.disclosureRequired || false}
              onChange={e => setForm(p => ({ ...p, disclosureRequired: e.target.checked }))} className="accent-primary" />
            <span className="text-foreground">Disclosure required in financial statements</span>
          </label>
        </div>
      )}

      {activeTab === 'definition' && (
        <DefinitionParserTab form={form} setForm={setForm} onApplied={() => setActiveTab('formula')} />
      )}

      {activeTab === 'formula' && (
        <FormulaBuilderTab form={form} setForm={setForm} computedCurrent={computedCurrent} computedProjected={computedProjected} IC={IC} />
      )}
    </Modal>
  );
}

// ─── Definition Parser Tab ────────────────────────────────────────────────────
function DefinitionParserTab({
  form, setForm, onApplied,
}: {
  form: Partial<Covenant>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Covenant>>>;
  onApplied: () => void;
}) {
  const [rawText, setRawText] = useState('');
  const [suggestions, setSuggestions] = useState<ParsedSuggestion[]>([]);
  const [parsed, setParsed] = useState(false);

  const handleParse = useCallback(() => {
    const results = parseCovenantDefinition(rawText);
    setSuggestions(results);
    setParsed(true);
  }, [rawText]);

  const toggle = (id: string) =>
    setSuggestions(s => s.map(x => x.id === id ? { ...x, selected: !x.selected } : x));

  const flipSign = (id: string) =>
    setSuggestions(s => s.map(x => x.id === id ? { ...x, sign: x.sign === '+' ? '-' : '+' } : x));

  const applyToFormula = () => {
    const mkId = () => `fl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const selected = suggestions.filter(s => s.selected);
    const numLines = selected.filter(s => s.rule.section === 'numerator').map(s => ({
      id: mkId(), sign: s.sign, description: s.rule.description,
      glAccount: s.rule.glCode, amount: 0, projectedAmount: 0, multiplier: 1,
    } as CovenantFormulaLine));
    const denLines = selected.filter(s => s.rule.section === 'denominator').map(s => ({
      id: mkId(), sign: s.sign, description: s.rule.description,
      glAccount: s.rule.glCode, amount: 0, projectedAmount: 0, multiplier: 1,
    } as CovenantFormulaLine));
    setForm(p => ({
      ...p,
      useFormulaBuilder: true,
      isRatioCovenant: denLines.length > 0,
      formulaLines: [...(p.formulaLines ?? []), ...numLines],
      denominatorLines: denLines.length > 0 ? [...(p.denominatorLines ?? []), ...denLines] : p.denominatorLines,
    }));
    onApplied();
  };

  // Highlight matched keywords in the raw text
  const highlightedText = useMemo(() => {
    if (!parsed || !suggestions.length || !rawText) return null;
    const ranges = suggestions
      .map(s => ({ start: s.matchStart, end: s.matchEnd, id: s.id, selected: s.selected }))
      .sort((a, b) => a.start - b.start);
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    for (const r of ranges) {
      if (r.start > cursor) parts.push(rawText.slice(cursor, r.start));
      parts.push(
        <mark key={r.id} className={`rounded px-0.5 ${r.selected ? 'bg-primary/20 text-primary font-medium' : 'bg-muted line-through text-foreground'}`}>
          {rawText.slice(r.start, r.end)}
        </mark>
      );
      cursor = r.end;
    }
    if (cursor < rawText.length) parts.push(rawText.slice(cursor));
    return parts;
  }, [parsed, suggestions, rawText]);

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-2.5 bg-primary/5 border border-primary/15 rounded-xl px-3.5 py-3 text-xs text-primary/80">
        <BookOpen className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Agreement Definition Parser</span>
          <span className="text-primary/60 ml-1">— Paste the covenant definition from your loan agreement. The system will identify financial terms, map them to GL accounts, and suggest formula lines for your review.</span>
        </div>
      </div>

      {/* Input */}
      <div>
        <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">Covenant Definition Text (from agreement)</label>
        <textarea
          className="w-full h-32 text-xs border border-border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:border-primary/40 placeholder:text-foreground font-mono leading-relaxed"
          placeholder={`Paste the exact covenant definition from the loan agreement here.\n\nExample: "DSCR means, for any period, the ratio of (a) EBITDA for such period to (b) the sum of all scheduled principal payments and interest expense on all outstanding long-term debt during such period, excluding any non-recurring or one-time charges."`}
          value={rawText}
          onChange={e => { setRawText(e.target.value); setParsed(false); setSuggestions([]); }}
        />
      </div>

      <Button variant="default" onClick={handleParse} disabled={!rawText.trim()} className="w-full">
        <Wand2 className="w-3.5 h-3.5 mr-1.5" /> Identify Components
      </Button>

      {/* Highlighted text preview */}
      {parsed && (
        <div className="border border-border rounded-lg px-3 py-2.5 bg-muted/30 text-xs leading-relaxed font-mono text-foreground">
          {suggestions.length === 0
            ? <span className="text-foreground italic">No known financial terms detected. Try pasting more of the covenant definition, or add lines manually in the Formula Builder.</span>
            : highlightedText
          }
        </div>
      )}

      {/* Suggestions */}
      {parsed && suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">{suggestions.filter(s => s.selected).length} of {suggestions.length} components selected</span>
            <button className="text-xs text-primary hover:underline" onClick={() => setSuggestions(s => s.map(x => ({ ...x, selected: true })))}>Select all</button>
          </div>

          {(['numerator', 'denominator'] as const).map(section => {
            const rows = suggestions.filter(s => s.rule.section === section);
            if (!rows.length) return null;
            return (
              <div key={section}>
                <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  {section === 'numerator' ? 'Numerator / Dividend' : 'Denominator / Divisor'}
                </div>
                <div className="border border-border rounded-lg overflow-hidden">
                  {rows.map((s, i) => (
                    <div key={s.id} className={`flex items-start gap-2.5 px-3 py-2.5 text-xs ${i > 0 ? 'border-t border-border' : ''} ${s.selected ? 'bg-background' : 'bg-muted/30 opacity-60'}`}>
                      <button className="mt-0.5 shrink-0 text-foreground hover:text-primary" onClick={() => toggle(s.id)}>
                        {s.selected ? <CheckSquare className="w-3.5 h-3.5 text-primary" /> : <Square className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        className={`shrink-0 w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] border transition-colors ${s.sign === '+' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'}`}
                        title="Click to flip sign"
                        onClick={() => flipSign(s.id)}
                      >{s.sign}</button>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground">{s.rule.description}</div>
                        <div className="text-foreground mt-0.5">
                          GL <span className="font-mono">{s.rule.glCode}</span>
                          <span className="mx-1.5 text-border">·</span>
                          Matched: "<span className="text-foreground italic">{s.matchedKeyword}</span>"
                          {s.isExclusion && <span className="ml-1.5 text-amber-600 font-medium">· Exclusion context detected</span>}
                        </div>
                        {s.rule.note && <div className="mt-1 text-amber-600 text-[10px]">⚠ {s.rule.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="pt-1">
            <Button variant="default" onClick={applyToFormula} disabled={!suggestions.some(s => s.selected)} className="w-full">
              <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
              Apply {suggestions.filter(s => s.selected).length} Selected Lines to Formula Builder
            </Button>
            <p className="text-[10px] text-foreground text-center mt-1.5">GL amounts will be set to $0 — fill them in the Formula Builder tab</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Formula Builder Tab ──────────────────────────────────────────────────────
function FormulaBuilderTab({
  form, setForm, computedCurrent, computedProjected, IC,
}: {
  form: Partial<Covenant>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Covenant>>>;
  computedCurrent: number | undefined;
  computedProjected: number | undefined;
  IC: string;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const applyTemplate = () => {
    const tmpl = COVENANT_TEMPLATES.find(t => t.id === selectedTemplate);
    if (!tmpl) { toast.error('Select a template first'); return; }
    const mkId = () => `fl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setForm(p => ({
      ...p,
      name:              p.name || tmpl.label.replace(/.*– /, ''),
      operator:          tmpl.operator,
      threshold:         tmpl.threshold,
      isRatioCovenant:   tmpl.isRatio,
      useFormulaBuilder: true,
      formulaLines:      tmpl.numeratorLines.map(l => ({ ...l, id: mkId() })),
      denominatorLines:  (tmpl.denominatorLines ?? []).map(l => ({ ...l, id: mkId() })),
      formula:           tmpl.label,
    }));
    toast.success('Template applied — fill in the GL amounts');
  };

  const toggleFormula = () => setForm(p => ({ ...p, useFormulaBuilder: !p.useFormulaBuilder }));

  const updateLine = (section: 'formula' | 'denominator', id: string, field: keyof CovenantFormulaLine, value: string | number) => {
    const key = section === 'formula' ? 'formulaLines' : 'denominatorLines';
    setForm(p => ({ ...p, [key]: (p[key] ?? []).map(l => l.id === id ? { ...l, [field]: value } : l) }));
  };

  const addLine = (section: 'formula' | 'denominator') => {
    const key = section === 'formula' ? 'formulaLines' : 'denominatorLines';
    const newLine: CovenantFormulaLine = { id: `fl-${Date.now()}`, sign: '+', description: '', glAccount: '', amount: 0, projectedAmount: 0, multiplier: 1 };
    setForm(p => ({ ...p, [key]: [...(p[key] ?? []), newLine] }));
  };

  const removeLine = (section: 'formula' | 'denominator', id: string) => {
    const key = section === 'formula' ? 'formulaLines' : 'denominatorLines';
    setForm(p => ({ ...p, [key]: (p[key] ?? []).filter(l => l.id !== id) }));
  };

  const fmtV = (v: number | undefined) => {
    if (v === undefined) return '—';
    if (form.isRatioCovenant) return `${v.toFixed(2)}x`;
    return v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : v.toFixed(2);
  };

  const statusFor = (v: number | undefined): CovenantStatus | null => {
    if (v === undefined || form.threshold === undefined || !form.operator) return null;
    return getProjectedStatus(v, form.threshold, form.operator);
  };

  const currentStatus  = statusFor(computedCurrent);
  const projectedStatus = statusFor(computedProjected);

  const LineTable = ({ section, lines }: { section: 'formula' | 'denominator'; lines: CovenantFormulaLine[] }) => (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-muted border-b border-border">
            <th className="px-2 py-1.5 text-left w-8 font-medium text-foreground">±</th>
            <th className="px-2 py-1.5 text-left font-medium text-foreground">Description</th>
            <th className="px-2 py-1.5 text-left font-medium text-foreground w-44">GL Account</th>
            <th className="px-2 py-1.5 text-right font-medium text-foreground w-28">Current ($)</th>
            <th className="px-2 py-1.5 text-right font-medium text-foreground w-28">Projected ($)</th>
            <th className="px-2 py-1.5 text-right font-medium text-foreground w-14">× Mult</th>
            <th className="px-2 py-1.5 text-right font-medium text-foreground w-24">Result</th>
            <th className="w-6" />
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 && (
            <tr><td colSpan={8} className="px-3 py-3 text-center text-foreground italic">No rows — click + Add Row</td></tr>
          )}
          {lines.map(l => {
            const glName = GL_ACCOUNTS.find(a => a.code === l.glAccount)?.name;
            const result = l.amount * l.multiplier * (l.sign === '+' ? 1 : -1);
            return (
              <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                {/* Sign */}
                <td className="px-2 py-1.5">
                  <select className={IC + ' w-8 text-center font-bold'} value={l.sign}
                    onChange={e => updateLine(section, l.id, 'sign', e.target.value as '+' | '-')}>
                    <option value="+">+</option>
                    <option value="−" style={{ fontWeight: 'bold' }}>−</option>
                  </select>
                </td>
                {/* Description */}
                <td className="px-2 py-1.5">
                  <input type="text" className={IC} value={l.description} placeholder={glName ?? 'Description'}
                    onChange={e => updateLine(section, l.id, 'description', e.target.value)} />
                </td>
                {/* GL Account dropdown */}
                <td className="px-2 py-1.5">
                  <select className={IC + ' w-full'} value={l.glAccount}
                    onChange={e => updateLine(section, l.id, 'glAccount', e.target.value)}>
                    <option value="">— select —</option>
                    {GL_CATEGORY_ORDER.map(cat => {
                      const catAccounts = GL_ACCOUNTS.filter(a => a.category === cat);
                      if (!catAccounts.length) return null;
                      return (
                        <optgroup key={cat} label={GL_CATEGORY_LABELS[cat]}>
                          {catAccounts.map(a => <option key={a.code} value={a.code}>{a.code} – {a.name}</option>)}
                        </optgroup>
                      );
                    })}
                  </select>
                </td>
                {/* Current Amount */}
                <td className="px-2 py-1.5">
                  <input type="number" className={IC + ' text-right'} value={l.amount || ''}
                    onChange={e => updateLine(section, l.id, 'amount', parseFloat(e.target.value) || 0)} />
                </td>
                {/* Projected Amount */}
                <td className="px-2 py-1.5">
                  <input type="number" className={IC + ' text-right'} value={l.projectedAmount || ''}
                    onChange={e => updateLine(section, l.id, 'projectedAmount', parseFloat(e.target.value) || 0)} />
                </td>
                {/* Multiplier */}
                <td className="px-2 py-1.5">
                  <input type="number" step="0.0001" className={IC + ' text-right'} value={l.multiplier}
                    onChange={e => updateLine(section, l.id, 'multiplier', parseFloat(e.target.value) || 1)} />
                </td>
                {/* Result */}
                <td className={`px-2 py-1.5 text-right tabular-nums font-semibold ${result < 0 ? 'text-red-600' : 'text-foreground'}`}>
                  {result >= 1000 ? `$${(result / 1000).toFixed(0)}K` : result.toFixed(2)}
                </td>
                {/* Delete */}
                <td className="px-1 py-1.5 text-center">
                  <button onClick={() => removeLine(section, l.id)} className="p-0.5 hover:text-red-500 text-foreground transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="px-3 py-2 border-t border-border bg-muted/20">
        <button onClick={() => addLine(section)} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium">
          <Plus className="w-3 h-3" /> Add Row
        </button>
      </div>
    </div>
  );

  const SectionTotal = ({ lines, label }: { lines: CovenantFormulaLine[]; label: string }) => {
    const total = lines.reduce((s, l) => s + l.amount * l.multiplier * (l.sign === '+' ? 1 : -1), 0);
    const projTotal = lines.reduce((s, l) => s + l.projectedAmount * l.multiplier * (l.sign === '+' ? 1 : -1), 0);
    return (
      <div className="flex items-center justify-between text-xs px-3 py-1.5 bg-muted/30 rounded-lg border border-border">
        <span className="text-foreground font-medium">{label} Total</span>
        <div className="flex items-center gap-4">
          <span className="tabular-nums"><span className="text-foreground mr-1">Current:</span><span className="font-bold text-foreground">{total >= 1000 ? `$${(total / 1000).toFixed(0)}K` : total.toFixed(2)}</span></span>
          <span className="tabular-nums"><span className="text-foreground mr-1">Projected:</span><span className="font-bold text-foreground">{projTotal >= 1000 ? `$${(projTotal / 1000).toFixed(0)}K` : projTotal.toFixed(2)}</span></span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Enable toggle + template selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.useFormulaBuilder ?? false}
            onChange={toggleFormula} className="accent-primary" />
          <span className="font-medium text-foreground">Enable Formula Builder</span>
          <span className="text-xs text-foreground">(auto-computes Current &amp; Projected values)</span>
        </label>
      </div>

      {/* Template selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap">Template</span>
        <div className="relative flex-1 min-w-[260px]">
          <select
            className="input-double-border h-9 text-sm pl-3 pr-8 w-full rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground appearance-none focus:outline-none cursor-pointer"
            value={selectedTemplate}
            onChange={e => setSelectedTemplate(e.target.value)}
          >
            <option value="">— Select standard covenant template —</option>
            {COVENANT_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground" />
        </div>
        <Button variant="secondary" size="sm" onClick={applyTemplate}>
          <Sparkles className="w-3.5 h-3.5 mr-1" /> Apply Template
        </Button>
        <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer ml-2">
          <input type="checkbox" checked={form.isRatioCovenant ?? true}
            onChange={e => setForm(p => ({ ...p, isRatioCovenant: e.target.checked }))} className="accent-primary" />
          Ratio covenant (Numerator ÷ Denominator)
        </label>
      </div>

      {/* Numerator section */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
          {form.isRatioCovenant ? 'Numerator' : 'Formula Lines'}
        </div>
        <LineTable section="formula" lines={form.formulaLines ?? []} />
        {(form.formulaLines?.length ?? 0) > 0 && (
          <SectionTotal lines={form.formulaLines ?? []} label={form.isRatioCovenant ? 'Numerator' : 'Total'} />
        )}
      </div>

      {/* Denominator section (ratio only) */}
      {form.isRatioCovenant && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-foreground uppercase tracking-wider">Denominator</div>
          <LineTable section="denominator" lines={form.denominatorLines ?? []} />
          {(form.denominatorLines?.length ?? 0) > 0 && (
            <SectionTotal lines={form.denominatorLines ?? []} label="Denominator" />
          )}
        </div>
      )}

      {/* Computed Result */}
      {form.useFormulaBuilder && (form.formulaLines?.length ?? 0) > 0 && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          {[
            { label: 'Current Value', value: computedCurrent, status: currentStatus },
            { label: 'Projected Value', value: computedProjected, status: projectedStatus },
          ].map(({ label, value, status }) => {
            const sCfg = status ? STATUS_CONFIG[status] : null;
            return (
              <div key={label} className={`rounded-xl p-4 border ${sCfg ? sCfg.bg + ' ' + sCfg.border : 'bg-muted border-border'}`}>
                <div className={`text-xs font-semibold mb-1 ${sCfg?.color ?? 'text-foreground'}`}>{label}</div>
                <div className={`text-2xl font-bold tabular-nums ${sCfg?.color ?? 'text-foreground'}`}>{fmtV(value)}</div>
                {status && <div className={`text-xs mt-1 ${sCfg?.color ?? ''}`}>Status: {status}</div>}
                {form.threshold !== undefined && (
                  <div className={`text-xs mt-0.5 ${sCfg?.color ?? 'text-foreground'}`}>Threshold: {form.operator} {fmtV(form.threshold)}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
