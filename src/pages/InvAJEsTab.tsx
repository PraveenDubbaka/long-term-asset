import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, FileDown, Check, Send } from 'lucide-react';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import { invAJEs } from '../data/investmentData';
import type { InvAJE } from '../types/investmentTypes';
import toast from 'react-hot-toast';

const STATUS_CFG = {
  Draft:    { label: 'Draft',    variant: 'notStarted' as const },
  Approved: { label: 'Approved', variant: 'success'    as const },
  Posted:   { label: 'Posted',   variant: 'info'        as const },
};

const CONF_CFG = {
  High:   { variant: 'success' as const },
  Medium: { variant: 'warning' as const },
  Low:    { variant: 'destructive' as const },
};

const TYPE_LABELS: Record<string, string> = {
  Correcting:        'Correcting',
  Reclassification:  'Reclass.',
  Accrual:           'Accrual',
  Disposition:       'Disposition',
  'Fair Value Adj':  'FV Adj.',
  Tax:               'Tax',
};

function fmt(n: number) { return n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export function InvAJEsTab() {
  const [ajesState, setAjesState] = useState<InvAJE[]>(invAJEs);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Draft' | 'Approved' | 'Posted'>('All');

  const filtered = ajesState.filter(j => filterStatus === 'All' || j.status === filterStatus);
  const draft    = ajesState.filter(j => j.status === 'Draft').length;
  const approved = ajesState.filter(j => j.status === 'Approved').length;
  const posted   = ajesState.filter(j => j.status === 'Posted').length;

  const advance = (id: string) => {
    setAjesState(prev => prev.map(j => {
      if (j.id !== id) return j;
      const next = j.status === 'Draft' ? 'Approved' : j.status === 'Approved' ? 'Posted' : 'Posted';
      const label = next === 'Approved' ? 'Approved' : 'Posted';
      toast.success(`${j.entryNo} marked ${label}`);
      return { ...j, status: next as InvAJE['status'] };
    }));
  };

  const totalDr = (je: InvAJE) => je.lines.reduce((s, l) => s + l.dr, 0);
  const totalCr = (je: InvAJE) => je.lines.reduce((s, l) => s + l.cr, 0);

  const handleExport = async () => {
    try {
      const rows = ajesState.flatMap(j => [
        { 'Entry #': j.entryNo, Description: j.description, Account: '', 'GL Code': '', 'Dr (CAD)': '', 'Cr (CAD)': '', Type: j.type, Confidence: j.confidence, Status: j.status },
        ...j.lines.map(l => ({ 'Entry #': '', Description: '', Account: l.account, 'GL Code': l.glCode, 'Dr (CAD)': l.dr || '', 'Cr (CAD)': l.cr || '', Type: '', Confidence: '', Status: '' })),
      ]);
      const { exportToExcel, objsToAOA } = await import('../lib/utils');
      exportToExcel({ 'Adj Entries': objsToAOA(rows) }, 'INV_AJEs_FY2025.xlsx');
      toast.success('AJEs exported');
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Adjusting Journal Entries</h2>
          <p className="text-xs text-foreground/60 mt-0.5">Investment workpaper AJEs · ASPE Part II · FY December 31, 2025</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <FileDown className="w-3.5 h-3.5" /> Export JE Pack
          </Button>
          <Button variant="default" size="sm" onClick={() => toast.success('Manual AJE modal coming soon')}>
            <Plus className="w-3.5 h-3.5" /> Add Manual AJE
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
              <div className="text-sm font-medium text-foreground">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.msg}</div>
            </div>
          </StyledCard>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2">
        {(['All', 'Draft', 'Approved', 'Posted'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 text-xs rounded-md border transition-colors ${
              filterStatus === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
            }`}>{s}</button>
        ))}
      </div>

      {/* AJE cards */}
      <div className="space-y-3">
        {filtered.map(je => {
          const isOpen = expandedId === je.id;
          const dr = totalDr(je);
          const cr = totalCr(je);
          const balanced = Math.abs(dr - cr) < 0.01;

          return (
            <StyledCard key={je.id} className="overflow-hidden p-0">
              {/* Card header */}
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                onClick={() => setExpandedId(isOpen ? null : je.id)}
              >
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{je.entryNo}</span>
                  <span className="font-medium text-foreground text-sm">{je.description}</span>
                  <Badge variant="outline" className="text-xs">{TYPE_LABELS[je.type]}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={CONF_CFG[je.confidence].variant} className="text-xs">
                    {je.confidence} confidence
                  </Badge>
                  <Badge variant={STATUS_CFG[je.status].variant} className="text-xs">
                    {STATUS_CFG[je.status].label}
                  </Badge>
                  <span className="text-xs tabular-nums text-muted-foreground">Dr ${fmt(dr)}</span>
                </div>
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div className="border-t border-border">
                  {/* Rationale */}
                  <div className="px-4 py-3 bg-muted/20 border-b border-border">
                    <p className="text-xs text-muted-foreground leading-relaxed">{je.rationale}</p>
                    {je.notes && (
                      <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                        ⚑ {je.notes}
                      </p>
                    )}
                  </div>

                  {/* Double-entry lines */}
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="py-2 px-5 font-semibold text-foreground/40 text-left">Account</th>
                        <th className="py-2 px-5 font-semibold text-foreground/40 text-left">GL Code</th>
                        <th className="py-2 px-5 font-semibold text-foreground/40 text-right">Debit</th>
                        <th className="py-2 px-5 font-semibold text-foreground/40 text-right">Credit</th>
                        <th className="py-2 px-5 font-semibold text-foreground/40 text-left">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {je.lines.map((l, i) => (
                        <tr key={i} className="border-b border-border hover:bg-muted/30">
                          <td className="py-2.5 px-5 text-foreground">{l.account}</td>
                          <td className="py-2.5 px-5 text-muted-foreground text-xs font-mono">{l.glCode}</td>
                          <td className="py-2.5 px-5 text-right tabular-nums text-foreground">{l.dr > 0 ? `$${fmt(l.dr)}` : '—'}</td>
                          <td className="py-2.5 px-5 text-right tabular-nums text-foreground">{l.cr > 0 ? `$${fmt(l.cr)}` : '—'}</td>
                          <td className="py-2.5 px-5 text-muted-foreground text-xs">
                            {i === 0 && je.wpRef
                              ? <span className="font-mono">{je.wpRef}</span>
                              : <span className="text-foreground/25">—</span>}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-muted/50 font-semibold text-xs">
                        <td className="py-2 px-5 text-foreground" colSpan={2}>Totals</td>
                        <td className="py-2 px-5 text-right tabular-nums text-foreground">${fmt(dr)}</td>
                        <td className="py-2 px-5 text-right tabular-nums text-foreground">${fmt(cr)}</td>
                        <td className="py-2 px-5 text-right">
                          {balanced
                            ? <span className="text-emerald-600 font-semibold">✓ Balanced</span>
                            : <span className="text-red-600">✗ Unbalanced</span>}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-muted/10">
                    {je.status === 'Draft' && (
                      <Button variant="default" size="sm" onClick={() => advance(je.id)}>
                        <Check className="w-3.5 h-3.5" /> Approve
                      </Button>
                    )}
                    {je.status === 'Approved' && (
                      <Button variant="default" size="sm" onClick={() => advance(je.id)}>
                        <Send className="w-3.5 h-3.5" /> Mark Posted
                      </Button>
                    )}
                    {je.status === 'Posted' && (
                      <Badge variant="success" className="text-xs">Posted ✓</Badge>
                    )}
                  </div>
                </div>
              )}
            </StyledCard>
          );
        })}
      </div>
    </div>
  );
}
