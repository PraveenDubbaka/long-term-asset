import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, AlertCircle, AlertTriangle, CheckCircle, XCircle, Edit3, ChevronDown,
  ChevronRight, FileText, Trash2, Sparkles, TrendingDown, TrendingUp, Minus, Download,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { fmtCurrency, exportToExcel, buildCovenantsExport } from '../lib/utils';
import {
  COVENANT_TEMPLATES, GL_ACCOUNTS, GL_CATEGORY_ORDER, GL_CATEGORY_LABELS,
  computeFormula, getProjectedStatus,
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
  Unknown:   { label: 'Unknown',  color: 'text-foreground/60', icon: AlertCircle, bg: 'bg-muted',      border: 'border-border'     },
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
  const { loans, covenants, updateCovenant, addCovenant, deleteCovenant } = useStore(s => ({
    loans: s.loans.filter(l => l.status !== 'Inactive'), covenants: s.covenants,
    updateCovenant: s.updateCovenant, addCovenant: s.addCovenant, deleteCovenant: s.deleteCovenant,
  }));

  const loansWithCovenants = loans.filter(l => l.covenantIds && l.covenantIds.length > 0);
  const [selectedLoanId, setSelectedLoanId] = useState<string>(loansWithCovenants[0]?.id || '');
  const [expandedId, setExpandedId]         = useState<string | null>(null);
  const [editCovenant, setEditCovenant]     = useState<Covenant | null>(null);
  const [addOpen, setAddOpen]               = useState(false);

  const breached  = covenants.filter(c => c.status === 'Breached');
  const atRisk    = covenants.filter(c => c.status === 'At Risk');
  const ok        = covenants.filter(c => c.status === 'OK');

  const selectedLoan  = loans.find(l => l.id === selectedLoanId);
  const loanCovenants = selectedLoan ? covenants.filter(c => selectedLoan.covenantIds.includes(c.id)) : [];

  const handleExport = async () => {
    await exportToExcel({ 'Covenants': buildCovenantsExport(covenants, loans) }, 'Covenant_Monitoring.xlsx');
    toast.success(`Exported ${covenants.length} covenant${covenants.length !== 1 ? 's' : ''}`);
  };

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Covenant Monitoring</h2>
          <p className="text-xs text-foreground/60 mt-0.5">Quantitative and qualitative covenant tracking with GL formula builder</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 mr-1" /> Export
          </Button>
          <Button variant="default" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Covenant
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Breached',        count: breached.length,  icon: XCircle,       iconBg: 'bg-red-50',     iconColor: 'text-red-600'     },
          { label: 'At Risk',         count: atRisk.length,    icon: AlertTriangle, iconBg: 'bg-amber-50',   iconColor: 'text-amber-500'   },
          { label: 'OK',              count: ok.length,        icon: CheckCircle,   iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
          { label: 'Total Covenants', count: covenants.length, icon: FileText,      iconBg: 'bg-primary/10', iconColor: 'text-primary'     },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 px-5 py-3 bg-card border border-border shadow-sm cursor-default hover:shadow-md transition-shadow" style={{ borderRadius: '12px' }}>
            <div className={`w-9 h-9 rounded-lg ${s.iconBg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.iconColor}`} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold leading-none text-primary">{s.count}</span>
              <span className="text-[11px] font-medium text-foreground/60 leading-tight mt-0.5 whitespace-nowrap">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {breached.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-red-700 mb-1">{breached.length} Covenant Breach{breached.length > 1 ? 'es' : ''} Detected</div>
            <div className="text-xs text-red-600">
              {breached.map(c => { const loan = loans.find(l => l.covenantIds.includes(c.id)); return `${c.name} (${loan?.name || 'Unknown'}): ${c.currentValue} vs threshold ${c.operator} ${c.threshold}`; }).join(' • ')}
              {' '}Management letter disclosure may be required.
            </div>
          </div>
        </div>
      )}

      {atRisk.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-amber-700 mb-1">{atRisk.length} Covenant{atRisk.length > 1 ? 's' : ''} At Risk</div>
            <div className="text-xs text-amber-600">Monitor closely. Covenant margins are tight and may breach before next test date.</div>
          </div>
        </div>
      )}

      {/* Loan Selector + Table */}
      <div className="bg-card border border-border overflow-hidden shadow-[0_2px_8px_hsl(213_40%_20%/0.06)]" style={{ borderRadius: '12px' }}>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/30 flex-wrap">
          <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wide whitespace-nowrap">Loan</span>
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
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40" />
          </div>
          {selectedLoan && (
            <>
              <span className="text-xs text-foreground/30">·</span>
              <span className="text-xs text-foreground/60">{selectedLoan.lender}</span>
              <span className="text-xs text-foreground/30">·</span>
              <span className="text-xs font-mono text-foreground/50">{selectedLoan.refNumber}</span>
              <Badge variant="outline" className="text-xs">{selectedLoan.currency}</Badge>
            </>
          )}
          <div className="ml-auto text-xs text-foreground/40">{loanCovenants.length} covenant{loanCovenants.length !== 1 ? 's' : ''}</div>
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
                  ['Headroom',    'text-right',  ''],
                  ['Frequency',   'text-right',  'hidden xl:table-cell'],
                  ['Last Tested', 'text-right',  'hidden xl:table-cell'],
                  ['Actions',     'text-center', ''],
                ].map(([h, align, extra]) => (
                  <th key={h as string} className={`py-2.5 px-3 text-xs font-semibold text-foreground/50 uppercase tracking-wide whitespace-nowrap ${align} ${extra}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loanCovenants.length === 0 ? (
                <tr><td colSpan={11} className="px-5 py-12 text-center text-sm text-foreground/40">No covenants for this loan</td></tr>
              ) : loanCovenants.map(cov => {
                const cfg = STATUS_CONFIG[cov.status];
                const Icon = cfg.icon;
                const gauge = getGaugePercent(cov);
                const margin = getMarginLabel(cov);
                const isExpanded = expandedId === cov.id;
                const isAlerted = cov.status === 'Breached' || cov.status === 'At Risk';

                // Projected status
                const projSt = (cov.projectedValue !== undefined && cov.threshold !== undefined && cov.operator)
                  ? getProjectedStatus(cov.projectedValue, cov.threshold, cov.operator)
                  : null;
                const projCfg = projSt ? STATUS_CONFIG[projSt] : null;
                const projDirection = (cov.projectedValue !== undefined && cov.currentValue !== undefined)
                  ? (cov.projectedValue > cov.currentValue ? 'up' : cov.projectedValue < cov.currentValue ? 'down' : 'flat')
                  : null;

                return (
                  <React.Fragment key={cov.id}>
                    <tr
                      className={`border-b border-border transition-colors cursor-pointer select-none ${
                        isExpanded ? 'bg-primary/[0.025]'
                        : cov.status === 'Breached' ? 'bg-red-50/40 hover:bg-red-50/60'
                        : cov.status === 'At Risk'  ? 'bg-amber-50/30 hover:bg-amber-50/50'
                        : 'hover:bg-muted/30'
                      }`}
                      onClick={() => setExpandedId(isExpanded ? null : cov.id)}
                    >
                      {/* Expand chevron */}
                      <td className="px-3 py-3 w-8">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-foreground/40" /> : <ChevronRight className="w-3.5 h-3.5 text-foreground/25" />}
                      </td>

                      {/* Name */}
                      <td className="px-3 py-3 font-medium text-foreground text-left">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${cfg.color} flex-shrink-0`} />
                          <span>{cov.name}</span>
                          {cov.useFormulaBuilder && (
                            <span title="Formula Builder enabled" className="text-primary/50 flex-shrink-0">
                              <Sparkles className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-3 py-3 text-left"><Badge variant="outline" className="text-xs">{cov.type}</Badge></td>

                      {/* Status */}
                      <td className="px-3 py-3 text-left">
                        <Badge variant={cov.status === 'Breached' ? 'destructive' : cov.status === 'At Risk' ? 'warning' : cov.status === 'OK' ? 'success' : 'outline'}>
                          {cfg.label}
                        </Badge>
                      </td>

                      {/* Current Value */}
                      <td className="px-3 py-3 text-right tabular-nums font-medium text-foreground/80">
                        {cov.type === 'Quantitative' ? fmtCovenantValue(cov, cov.currentValue) : '—'}
                      </td>

                      {/* Projected Value */}
                      <td className="px-3 py-3 text-right hidden lg:table-cell">
                        {cov.type === 'Quantitative' && cov.projectedValue !== undefined ? (
                          <div className="flex items-center justify-end gap-1">
                            {projDirection === 'up'   && <TrendingUp   className="w-3 h-3 text-emerald-500 flex-shrink-0" />}
                            {projDirection === 'down' && <TrendingDown  className="w-3 h-3 text-red-500 flex-shrink-0" />}
                            {projDirection === 'flat' && <Minus         className="w-3 h-3 text-foreground/30 flex-shrink-0" />}
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
                          <span className="text-foreground/30 text-xs">—</span>
                        )}
                      </td>

                      {/* Threshold */}
                      <td className="px-3 py-3 text-right tabular-nums text-xs text-foreground/60">
                        {cov.type === 'Quantitative' && cov.threshold !== undefined
                          ? `${cov.operator} ${fmtCovenantValue(cov, cov.threshold)}`
                          : '—'}
                      </td>

                      {/* Headroom */}
                      <td className="px-3 py-3 text-right min-w-[110px]">
                        {cov.type === 'Quantitative' && cov.currentValue !== undefined ? (
                          <div className="flex flex-col items-end gap-1">
                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${cov.status === 'Breached' ? 'bg-red-500' : cov.status === 'At Risk' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, gauge)}%` }} />
                            </div>
                            <span className={`text-xs font-medium tabular-nums ${cov.status === 'Breached' ? 'text-red-600' : cov.status === 'At Risk' ? 'text-amber-600' : 'text-emerald-600'}`}>{margin}</span>
                          </div>
                        ) : <span className="text-foreground/30 text-xs">—</span>}
                      </td>

                      {/* Frequency */}
                      <td className="px-3 py-3 text-right text-xs text-foreground/60 hidden xl:table-cell">{cov.frequency}</td>

                      {/* Last Tested */}
                      <td className="px-3 py-3 text-right text-xs text-foreground/60 whitespace-nowrap hidden xl:table-cell">
                        {cov.lastTested || <span className="text-foreground/30">Not tested</span>}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-0.5">
                          <button onClick={() => setEditCovenant(cov)} className="p-1.5 hover:bg-muted rounded-lg transition-colors" title="Edit covenant">
                            <Edit3 className="w-3 h-3 text-primary" />
                          </button>
                          <button onClick={() => { deleteCovenant(cov.id); toast.success('Covenant removed'); }} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors" title="Remove">
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <tr className="border-b border-border">
                        <td colSpan={11} className="bg-muted/20 px-6 py-4">
                          <div className="grid grid-cols-3 gap-5 text-xs">
                            {/* Formula */}
                            <div>
                              <div className="font-semibold text-foreground/50 uppercase tracking-wider mb-2">Formula / Method</div>
                              {cov.useFormulaBuilder && cov.formulaLines ? (
                                <FormulaDisplay cov={cov} />
                              ) : (
                                <div className="font-mono bg-background px-2.5 py-2 rounded-lg border border-border text-foreground">{cov.formula || '—'}</div>
                              )}
                            </div>
                            {/* Notes */}
                            <div>
                              <div className="font-semibold text-foreground/50 uppercase tracking-wider mb-2">Notes</div>
                              <div className="text-foreground/60">{cov.notes || '—'}</div>
                              {cov.testedBy && <div className="mt-2 text-foreground/50">Tested by: <span className="text-foreground/70">{cov.testedBy}</span></div>}
                              {cov.description && <div className="mt-1.5 text-foreground/60">{cov.description}</div>}
                              {cov.disclosureRequired && (
                                <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                                  <div className="font-semibold text-red-700">⚠ Disclosure Required</div>
                                  <div className="text-red-600 mt-0.5">Add note to management letter and financial statements.</div>
                                </div>
                              )}
                            </div>
                            {/* Actions / Recommendations */}
                            <div>
                              {isAlerted ? (
                                <>
                                  <div className="font-semibold text-foreground/50 uppercase tracking-wider mb-2">Recommended Actions</div>
                                  <div className="space-y-1.5">
                                    {['Contact lender to discuss covenant waiver or amendment', 'Prepare management letter note', 'Request updated financial projections', 'Document in file — upload covenant certificate'].map((a, i) => (
                                      <div key={i} className="flex items-start gap-1.5 text-foreground/60">
                                        <span className="text-foreground/40 flex-shrink-0">{i + 1}.</span>{a}
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <div className="text-foreground/30 italic">No actions required — covenant is in compliance.</div>
                              )}
                              <div className="mt-4 flex items-center gap-2">
                                <Button variant="secondary" size="sm" onClick={() => setEditCovenant(cov)}>
                                  <Edit3 className="w-3 h-3 mr-1" /> Edit
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => { deleteCovenant(cov.id); toast.success('Covenant removed'); }} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <CovenantFormModal
        open={!!editCovenant || addOpen}
        onClose={() => { setEditCovenant(null); setAddOpen(false); }}
        covenant={editCovenant}
        loans={loans}
        onSave={(cov) => {
          if (editCovenant) {
            updateCovenant(editCovenant.id, cov);
            toast.success('Covenant updated');
            setEditCovenant(null);
          } else {
            addCovenant({ ...cov, id: `cov-${Date.now()}` } as Covenant);
            toast.success('Covenant added');
            setAddOpen(false);
          }
        }}
      />
    </div>
  );
}

// ─── FormulaDisplay (read-only in expanded row) ───────────────────────────────
function FormulaDisplay({ cov }: { cov: Covenant }) {
  const numLines = cov.formulaLines ?? [];
  const denLines = cov.denominatorLines ?? [];

  const numTotal = numLines.reduce((s, l) => s + l.amount * l.multiplier * (l.sign === '+' ? 1 : -1), 0);
  const denTotal = denLines.reduce((s, l) => s + l.amount * l.multiplier * (l.sign === '+' ? 1 : -1), 0);

  const fmtAmt = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : v.toFixed(2);

  const LineRows = ({ lines }: { lines: CovenantFormulaLine[] }) => (
    <>
      {lines.map(l => {
        const glName = GL_ACCOUNTS.find(a => a.code === l.glAccount)?.name ?? l.glAccount;
        return (
          <div key={l.id} className="flex items-center gap-2 py-0.5">
            <span className={`w-4 text-center font-mono font-bold ${l.sign === '+' ? 'text-emerald-600' : 'text-red-500'}`}>{l.sign}</span>
            <span className="flex-1 text-foreground/70 truncate" title={glName}>{l.description || glName}</span>
            <span className="tabular-nums font-mono text-foreground/50 text-[11px]">{l.glAccount}</span>
            <span className="tabular-nums font-semibold text-foreground/80">{fmtAmt(l.amount * l.multiplier)}</span>
          </div>
        );
      })}
    </>
  );

  return (
    <div className="bg-background border border-border rounded-lg px-3 py-2.5 space-y-2">
      {cov.isRatioCovenant ? (
        <>
          <div className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider">Numerator</div>
          <LineRows lines={numLines} />
          <div className="border-t border-border pt-1.5 flex justify-between text-[11px]">
            <span className="text-foreground/40">Numerator Total</span>
            <span className="font-bold text-foreground">{fmtAmt(numTotal)}</span>
          </div>
          <div className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider pt-1">Denominator</div>
          <LineRows lines={denLines} />
          <div className="border-t border-border pt-1.5 flex justify-between text-[11px]">
            <span className="text-foreground/40">Denominator Total</span>
            <span className="font-bold text-foreground">{fmtAmt(denTotal)}</span>
          </div>
          <div className="border-t-2 border-primary/20 pt-1.5 flex justify-between text-xs font-bold">
            <span className="text-foreground/60">= {fmtAmt(numTotal)} ÷ {fmtAmt(denTotal)}</span>
            <span className="text-primary">{denTotal !== 0 ? (numTotal / denTotal).toFixed(2) : '—'}x</span>
          </div>
        </>
      ) : (
        <>
          <LineRows lines={numLines} />
          <div className="border-t-2 border-primary/20 pt-1.5 flex justify-between text-xs font-bold">
            <span className="text-foreground/60">Total</span>
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
  const [activeTab, setActiveTab] = useState<'details' | 'formula'>('details');
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
        {(['details', 'formula'] as const).map(t => (
          <button
            key={t}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === t ? 'border-primary text-primary' : 'border-transparent text-foreground/60 hover:text-foreground'}`}
            onClick={() => setActiveTab(t)}
          >
            {t === 'details' ? 'Details' : (
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
              <Select label="Status" value={form.status || 'Unknown'} onChange={f('status')}
                options={[{ value: 'OK', label: 'OK' }, { value: 'At Risk', label: 'At Risk' }, { value: 'Breached', label: 'Breached' }, { value: 'Unknown', label: 'Unknown' }]} />
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
            <span className="text-foreground/60">Disclosure required in financial statements</span>
          </label>
        </div>
      )}

      {activeTab === 'formula' && (
        <FormulaBuilderTab form={form} setForm={setForm} computedCurrent={computedCurrent} computedProjected={computedProjected} IC={IC} />
      )}
    </Modal>
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
            <th className="px-2 py-1.5 text-left w-8 font-medium text-foreground/50">±</th>
            <th className="px-2 py-1.5 text-left font-medium text-foreground/50">Description</th>
            <th className="px-2 py-1.5 text-left font-medium text-foreground/50 w-44">GL Account</th>
            <th className="px-2 py-1.5 text-right font-medium text-foreground/50 w-28">Current ($)</th>
            <th className="px-2 py-1.5 text-right font-medium text-foreground/50 w-28">Projected ($)</th>
            <th className="px-2 py-1.5 text-right font-medium text-foreground/50 w-14">× Mult</th>
            <th className="px-2 py-1.5 text-right font-medium text-foreground/50 w-24">Result</th>
            <th className="w-6" />
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 && (
            <tr><td colSpan={8} className="px-3 py-3 text-center text-foreground/30 italic">No rows — click + Add Row</td></tr>
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
                  <button onClick={() => removeLine(section, l.id)} className="p-0.5 hover:text-red-500 text-foreground/30 transition-colors">
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
        <span className="text-foreground/50 font-medium">{label} Total</span>
        <div className="flex items-center gap-4">
          <span className="tabular-nums"><span className="text-foreground/40 mr-1">Current:</span><span className="font-bold text-foreground">{total >= 1000 ? `$${(total / 1000).toFixed(0)}K` : total.toFixed(2)}</span></span>
          <span className="tabular-nums"><span className="text-foreground/40 mr-1">Projected:</span><span className="font-bold text-foreground/70">{projTotal >= 1000 ? `$${(projTotal / 1000).toFixed(0)}K` : projTotal.toFixed(2)}</span></span>
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
          <span className="text-xs text-foreground/50">(auto-computes Current &amp; Projected values)</span>
        </label>
      </div>

      {/* Template selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wide whitespace-nowrap">Template</span>
        <div className="relative flex-1 min-w-[260px]">
          <select
            className="input-double-border h-9 text-sm pl-3 pr-8 w-full rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground appearance-none focus:outline-none cursor-pointer"
            value={selectedTemplate}
            onChange={e => setSelectedTemplate(e.target.value)}
          >
            <option value="">— Select standard covenant template —</option>
            {COVENANT_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40" />
        </div>
        <Button variant="secondary" size="sm" onClick={applyTemplate}>
          <Sparkles className="w-3.5 h-3.5 mr-1" /> Apply Template
        </Button>
        <label className="flex items-center gap-1.5 text-xs text-foreground/60 cursor-pointer ml-2">
          <input type="checkbox" checked={form.isRatioCovenant ?? true}
            onChange={e => setForm(p => ({ ...p, isRatioCovenant: e.target.checked }))} className="accent-primary" />
          Ratio covenant (Numerator ÷ Denominator)
        </label>
      </div>

      {/* Numerator section */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">
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
          <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">Denominator</div>
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
                <div className={`text-xs font-semibold mb-1 ${sCfg?.color ?? 'text-foreground/60'}`}>{label}</div>
                <div className={`text-2xl font-bold tabular-nums ${sCfg?.color ?? 'text-foreground'}`}>{fmtV(value)}</div>
                {status && <div className={`text-xs mt-1 ${sCfg?.color ?? ''}`}>Status: {status}</div>}
                {form.threshold !== undefined && (
                  <div className={`text-xs mt-0.5 ${sCfg?.color ?? 'text-foreground/50'}`}>Threshold: {form.operator} {fmtV(form.threshold)}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
