import React, { useState } from 'react';
import {
  ChevronDown, ChevronRight, Plus, FileDown, Check, Send,
  Zap, PenLine, Trash2, RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/wp-ui/dialog';
import { invAJEs } from '../data/investmentData';
import type { InvAJE, InvAJELine } from '../types/investmentTypes';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const YEAR_END = '2025-12-31';

const INV_GL_ACCOUNTS = [
  { value: '1010 – Cash / Settlement Accounts',       label: '1010 – Cash / Settlement Accounts',       group: 'Asset'    },
  { value: '1150 – Accrued Interest Receivable',       label: '1150 – Accrued Interest Receivable',       group: 'Asset'    },
  { value: '1160 – Dividend Receivable',               label: '1160 – Dividend Receivable',               group: 'Asset'    },
  { value: '1310 – Investments – Equities (Cost)',     label: '1310 – Investments – Equities (Cost)',     group: 'Asset'    },
  { value: '1320 – Investments – Fixed Income (Cost)', label: '1320 – Investments – Fixed Income (Cost)', group: 'Asset'    },
  { value: '2150 – Dividends / Interest Payable',      label: '2150 – Dividends / Interest Payable',      group: 'Liability'},
  { value: '4010 – Investment Interest Income',        label: '4010 – Investment Interest Income',        group: 'Income'   },
  { value: '4020 – Dividend Income',                   label: '4020 – Dividend Income',                   group: 'Income'   },
  { value: '4030 – DRIP Income',                       label: '4030 – DRIP Income',                       group: 'Income'   },
  { value: '4100 – Realized Gain on Investments',      label: '4100 – Realized Gain on Investments',      group: 'Income'   },
  { value: '4200 – Dividend Income (General)',         label: '4200 – Dividend Income (General)',          group: 'Income'   },
  { value: '5010 – Realized Loss on Investments',      label: '5010 – Realized Loss on Investments',      group: 'Expense'  },
  { value: '5020 – Management Fees',                   label: '5020 – Management Fees',                   group: 'Expense'  },
  { value: '5030 – Account Fees',                      label: '5030 – Account Fees',                      group: 'Expense'  },
  { value: '5040 – FX Gain / Loss',                    label: '5040 – FX Gain / Loss',                    group: 'Expense'  },
  { value: '5500 – Investment Transaction Costs',      label: '5500 – Investment Transaction Costs',      group: 'Expense'  },
  { value: '6150 – Foreign Withholding Tax',           label: '6150 – Foreign Withholding Tax',           group: 'Expense'  },
];

const STATUS_CFG = {
  Draft:    { label: 'Draft',    variant: 'notStarted' as const },
  Approved: { label: 'Approved', variant: 'success'    as const },
  Posted:   { label: 'Posted',   variant: 'info'       as const },
};

const CONF_CFG = {
  High:   { variant: 'success'     as const },
  Medium: { variant: 'warning'     as const },
  Low:    { variant: 'destructive' as const },
};

const TYPE_LABELS: Record<string, string> = {
  Correcting:       'Correcting',
  Reclassification: 'Reclass.',
  Accrual:          'Accrual',
  Disposition:      'Disposition',
  'Fair Value Adj': 'FV Adj.',
  Tax:              'Tax',
  'Income/Expense': 'Inc/Exp',
};

const TYPE_COLOR: Record<string, string> = {
  Correcting:       'bg-amber-100 text-amber-700',
  Reclassification: 'bg-sky-100 text-sky-700',
  Accrual:          'bg-violet-100 text-violet-700',
  Disposition:      'bg-orange-100 text-orange-700',
  'Fair Value Adj': 'bg-emerald-100 text-emerald-700',
  Tax:              'bg-red-100 text-red-700',
  'Income/Expense': 'bg-blue-100 text-blue-700',
};

const AUTO_JE_INIT: InvAJE[] = [
  {
    id: 'auto-interest', entryNo: 'AE-08', source: 'auto', status: 'Draft', confidence: 'High',
    type: 'Income/Expense',
    description: 'Record investment interest income (semi-annual, all brokers)',
    rationale: 'Aggregated semi-annual interest income per all broker accounts. Auto-derived from Income & Expenses register.',
    lines: [
      { account: '1010 – Cash / Settlement Accounts', glCode: '1010', dr: 855.52, cr:     0 },
      { account: '4010 – Investment Interest Income',  glCode: '4010', dr:     0,  cr: 855.52 },
    ],
    notes: 'ie01+ie02+ie03+ie04+ie05+ie06+ie07+ie08+ie09+ie10 — see Income & Expenses tab',
  },
  {
    id: 'auto-fees', entryNo: 'AE-09', source: 'auto', status: 'Draft', confidence: 'High',
    type: 'Income/Expense',
    description: 'Record investment account and management fees',
    rationale: 'Semi-annual custody fees ($125×4) and management fees ($250×2). Auto-derived from Income & Expenses register.',
    lines: [
      { account: '5030 – Account Fees',                glCode: '5030', dr: 500.00, cr:      0 },
      { account: '5020 – Management Fees',             glCode: '5020', dr: 500.00, cr:      0 },
      { account: '1010 – Cash / Settlement Accounts',  glCode: '1010', dr:     0,  cr: 1000.00 },
    ],
    notes: 'ie11–ie16 — see Income & Expenses tab',
  },
  {
    id: 'auto-drip', entryNo: 'AE-10', source: 'auto', status: 'Draft', confidence: 'High',
    type: 'Income/Expense',
    description: 'Record AAPL DRIP — increase investment cost and dividend income',
    rationale: 'DRIP of 0.476 AAPL shares @ $210.97 USD = $138.78 CAD. Investment cost increases; treated as dividend reinvestment per T5 Box 24.',
    lines: [
      { account: '1310 – Investments – Equities (Cost)', glCode: '1310', dr: 138.78, cr:      0 },
      { account: '4030 – DRIP Income',                   glCode: '4030', dr:     0,  cr: 138.78 },
    ],
    notes: 'ie17 — ACB increases by $138.78 CAD. See Flag F-04.',
  },
  {
    id: 'auto-wht', entryNo: 'AE-11', source: 'auto', status: 'Draft', confidence: 'Medium',
    type: 'Income/Expense',
    description: 'Record withholding tax — AAPL (US 15%) and AIR.PA (French 15%)',
    rationale: 'Non-resident alien withholding tax deducted at source. Claimable as foreign tax credit via T2209.',
    lines: [
      { account: '6150 – Foreign Withholding Tax',       glCode: '6150', dr: 43.30, cr:     0 },
      { account: '1010 – Cash / Settlement Accounts',    glCode: '1010', dr:     0,  cr: 43.30 },
    ],
    notes: 'ie18+ie19 — $20.57 AAPL US WHT + $22.73 AIR.PA French WHT. See Flags F-05, F-06.',
  },
  {
    id: 'auto-accrued', entryNo: 'AE-12', source: 'auto', status: 'Draft', confidence: 'High',
    type: 'Accrual',
    description: 'Accrue year-end interest receivable (all brokers)',
    rationale: 'Year-end accrual for interest earned but not yet received as at December 31, 2025.',
    lines: [
      { account: '1150 – Accrued Interest Receivable', glCode: '1150', dr: 69.05, cr:     0 },
      { account: '4010 – Investment Interest Income',  glCode: '4010', dr:     0,  cr: 69.05 },
    ],
    notes: 'ie23+ie24+ie25+ie26 ($22.10+$20.62+$12.20+$14.13)',
  },
];

function fmt(n: number) { return n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function accCode(s: string) { return s.split(/[\s–-]/)[0].trim() || s; }

const SF  = 'input-double-border h-9 text-sm rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground transition-all duration-200 hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)] focus:outline-none';
const SFS = `${SF} pl-3 pr-8 appearance-none cursor-pointer w-full`;
const SFI = `${SF} px-3 placeholder:text-foreground w-full`;
const SFN = `${SF} px-3 text-right tabular-nums w-full`;

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function InvAJEsTab() {
  const [ajesState, setAjesState]     = useState<InvAJE[]>(invAJEs);
  const [autoState, setAutoState]     = useState<InvAJE[]>(AUTO_JE_INIT);
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Draft' | 'Approved' | 'Posted' | 'Deleted'>('All');
  const [section, setSection]         = useState<'manual' | 'auto'>('manual');
  const [addOpen, setAddOpen]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

  const activeJes  = ajesState.filter(j => !j.deleted);
  const deletedJes = ajesState.filter(j =>  j.deleted);
  const filtered   = filterStatus === 'Deleted'
    ? deletedJes
    : activeJes.filter(j => filterStatus === 'All' || j.status === filterStatus);

  const draft    = activeJes.filter(j => j.status === 'Draft').length;
  const approved = activeJes.filter(j => j.status === 'Approved').length;
  const posted   = activeJes.filter(j => j.status === 'Posted').length;

  const totalDr = (je: { lines: { dr: number }[] }) => je.lines.reduce((s, l) => s + l.dr, 0);
  const totalCr = (je: { lines: { cr: number }[] }) => je.lines.reduce((s, l) => s + l.cr, 0);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const advance = (id: string, isAuto = false) => {
    const setter = isAuto ? setAutoState : setAjesState;
    setter(prev => prev.map(j => {
      if (j.id !== id) return j;
      const next = j.status === 'Draft' ? 'Approved' : j.status === 'Approved' ? 'Posted' : 'Posted';
      toast.success(`${j.entryNo} marked ${next}`);
      return { ...j, status: next as InvAJE['status'] };
    }));
  };

  const revert = (id: string) => {
    setAjesState(prev => prev.map(j => j.id === id ? { ...j, status: 'Draft' } : j));
    toast('Reverted to Draft');
  };

  const softDelete = (id: string) => {
    setAjesState(prev => prev.map(j =>
      j.id === id ? { ...j, deleted: true, deletedAt: new Date().toISOString() } : j
    ));
    toast('JE moved to Deleted — use the Deleted filter to restore', { icon: '🗑️' });
  };

  const restore = (id: string) => {
    setAjesState(prev => prev.map(j =>
      j.id === id ? { ...j, deleted: false, deletedAt: undefined } : j
    ));
    toast.success('JE restored');
  };

  const purge = (id: string) => {
    setAjesState(prev => prev.filter(j => j.id !== id));
    toast('JE permanently deleted', { icon: '🗑️' });
  };

  const updateAJE = (id: string, changes: Partial<InvAJE>) =>
    setAjesState(prev => prev.map(j => j.id === id ? { ...j, ...changes } : j));

  const addAJE = (je: InvAJE) => {
    setAjesState(prev => [...prev, je]);
    toast.success(`${je.entryNo} added`);
  };

  // ── Export ───────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const mk = (src: string, j: InvAJE) => [
        { Source: src, 'Entry #': j.entryNo, Description: j.description, Account: '', 'GL Code': '', Dr: '', Cr: '', Type: j.type, Status: j.status },
        ...j.lines.map(l => ({ Source: '', 'Entry #': '', Description: '', Account: l.account, 'GL Code': l.glCode, Dr: l.dr || '', Cr: l.cr || '', Type: '', Status: '' })),
      ];
      const { exportToExcel, objsToAOA } = await import('../lib/utils');
      exportToExcel({
        'Investment AJEs': objsToAOA(activeJes.flatMap(j => mk('Manual', j))),
        'Income Exp JEs':  objsToAOA(autoState.flatMap(j => mk('Auto', j))),
      }, 'INV_AJEs_FY2025.xlsx');
      toast.success('AJE pack exported');
    } catch { toast.error('Export failed'); }
  };

  // ── Card renderer (manual + auto) ────────────────────────────────────────────
  const renderCard = (je: InvAJE, isAuto = false) => {
    const isOpen   = expandedId === je.id;
    const dr       = totalDr(je);
    const cr       = totalCr(je);
    const balanced = Math.abs(dr - cr) < 0.01;

    return (
      <StyledCard key={je.id} className={`overflow-hidden p-0${je.deleted ? ' opacity-60' : ''}`}>
        {/* Header */}
        <button
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left"
          onClick={() => setExpandedId(isOpen ? null : je.id)}>
          <div className="flex items-center gap-3 min-w-0">
            {isOpen ? <ChevronDown className="w-4 h-4 text-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-foreground flex-shrink-0" />}
            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded flex-shrink-0">{je.entryNo}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${TYPE_COLOR[je.type] ?? 'bg-muted text-foreground'}`}>
              {TYPE_LABELS[je.type] ?? je.type}
            </span>
            <span className="font-medium text-foreground text-sm truncate">{je.description}</span>
            {isAuto && <Badge variant="info" className="text-xs flex items-center gap-1 flex-shrink-0"><Zap className="w-2.5 h-2.5" /> Auto</Badge>}
            {!balanced && <Badge variant="destructive" className="text-xs flex-shrink-0">Unbalanced</Badge>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <Badge variant={CONF_CFG[je.confidence].variant} className="text-xs">{je.confidence}</Badge>
            <Badge variant={STATUS_CFG[je.status].variant} className="text-xs">{STATUS_CFG[je.status].label}</Badge>
            <span className="text-xs tabular-nums text-foreground font-mono">Dr ${fmt(dr)}</span>
          </div>
        </button>

        {/* Body */}
        {isOpen && (
          <div className="border-t border-border">
            {/* Rationale */}
            <div className="px-4 py-3 bg-muted/20 border-b border-border">
              <p className="text-xs text-foreground leading-relaxed">{je.rationale}</p>
              {je.notes && <p className="text-xs text-amber-600 mt-1.5">⚑ {je.notes}</p>}
            </div>

            {/* Lines */}
            <div className={je.deleted ? 'opacity-60' : undefined}>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="py-2 px-4 text-left text-xs font-semibold text-foreground">Account</th>
                    <th className="py-2 px-4 text-left text-xs font-semibold text-foreground">GL Code</th>
                    <th className="py-2 px-4 text-right text-xs font-semibold text-foreground">Debit</th>
                    <th className="py-2 px-4 text-right text-xs font-semibold text-foreground">Credit</th>
                    {!isAuto && <th className="py-2 px-4 text-left text-xs font-semibold text-foreground">WP Ref</th>}
                  </tr>
                </thead>
                <tbody>
                  {je.lines.map((l, i) => (
                    <tr key={i} className="border-b border-border hover:bg-muted/30">
                      {!isAuto ? (
                        <>
                          {/* Editable account */}
                          <td className="py-2 px-3 min-w-[180px]">
                            <div className="relative">
                              <select
                                className={`${SFS} font-mono text-xs`}
                                style={{ color: 'transparent' }}
                                value={l.account}
                                onChange={e => updateAJE(je.id, { lines: je.lines.map((ll, idx) => idx === i ? { ...ll, account: e.target.value, glCode: accCode(e.target.value) } : ll) })}>
                                <option value="">Select</option>
                                {(['Asset', 'Liability', 'Income', 'Expense'] as const).map(g => (
                                  <optgroup key={g} label={g}>
                                    {INV_GL_ACCOUNTS.filter(a => a.group === g).map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                                  </optgroup>
                                ))}
                              </select>
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-foreground pointer-events-none select-none">
                                {l.account ? accCode(l.account) : <span className="font-sans font-normal text-foreground">Select</span>}
                              </span>
                              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground pointer-events-none" />
                            </div>
                          </td>
                          <td className="py-2 px-3 w-24">
                            <input type="text" className={`${SFI} text-xs font-mono`} value={l.glCode}
                              onChange={e => updateAJE(je.id, { lines: je.lines.map((ll, idx) => idx === i ? { ...ll, glCode: e.target.value } : ll) })} />
                          </td>
                          <td className="py-2 px-3 w-32">
                            <input type="number" min="0" step="0.01" className={SFN} value={l.dr || ''} placeholder="0.00"
                              onChange={e => updateAJE(je.id, { lines: je.lines.map((ll, idx) => idx === i ? { ...ll, dr: parseFloat(e.target.value) || 0 } : ll) })} />
                          </td>
                          <td className="py-2 px-3 w-32">
                            <input type="number" min="0" step="0.01" className={SFN} value={l.cr || ''} placeholder="0.00"
                              onChange={e => updateAJE(je.id, { lines: je.lines.map((ll, idx) => idx === i ? { ...ll, cr: parseFloat(e.target.value) || 0 } : ll) })} />
                          </td>
                          <td className="py-2 px-4 text-xs text-foreground">
                            {i === 0 && je.wpRef ? <span className="font-mono">{je.wpRef}</span> : <span className="text-foreground">—</span>}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2.5 px-4 text-sm text-foreground">{l.account}</td>
                          <td className="py-2.5 px-4 text-xs font-mono text-foreground">{l.glCode}</td>
                          <td className="py-2.5 px-4 text-right tabular-nums text-foreground">{l.dr > 0 ? `$${fmt(l.dr)}` : '—'}</td>
                          <td className="py-2.5 px-4 text-right tabular-nums text-foreground">{l.cr > 0 ? `$${fmt(l.cr)}` : '—'}</td>
                        </>
                      )}
                    </tr>
                  ))}
                  <tr className="bg-muted/50 font-semibold text-xs">
                    <td className="py-2 px-4 text-foreground" colSpan={2}>Totals</td>
                    <td className="py-2 px-4 text-right tabular-nums text-foreground">${fmt(dr)}</td>
                    <td className="py-2 px-4 text-right tabular-nums text-foreground">${fmt(cr)}</td>
                    {!isAuto && (
                      <td className="py-2 px-4 text-right">
                        {balanced ? <span className="text-emerald-600 font-semibold">✓ Balanced</span> : <span className="text-red-600">✗ Unbalanced</span>}
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>

              {/* Notes (editable for manual) */}
              {!isAuto && (
                <div className="px-4 py-3 border-t border-border bg-background">
                  <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1.5">Notes</label>
                  <textarea
                    rows={2}
                    className="input-double-border w-full text-sm px-3 py-2 rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground placeholder:text-foreground resize-none focus:outline-none hover:border-[hsl(210_25%_75%)]"
                    value={je.notes ?? ''}
                    placeholder="Add a note…"
                    onChange={e => updateAJE(je.id, { notes: e.target.value })}
                  />
                </div>
              )}
            </div>{/* end opacity wrapper */}

            {/* Action bar */}
            <div className={`flex items-center justify-between px-4 py-3 border-t border-border ${isAuto ? 'bg-blue-50/30' : 'bg-muted/10'}`}
              style={{ backgroundColor: !isAuto ? '#F8F8FA' : undefined }}>
              {je.deleted ? (
                <div className="flex items-center gap-3 w-full">
                  <span className="text-xs text-foreground italic flex-1">Deleted {je.deletedAt ? `on ${je.deletedAt.slice(0,10)}` : ''}</span>
                  <Button variant="secondary" size="sm" onClick={() => restore(je.id)}>
                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                  </Button>
                  <Button variant="secondary" size="sm"
                    className="text-red-500 hover:text-red-700 border-red-200 hover:border-red-300"
                    onClick={() => purge(je.id)}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
                  </Button>
                </div>
              ) : isAuto ? (
                <div className="flex items-center gap-3 w-full">
                  <div className="flex items-center gap-1.5 flex-1">
                    <Zap className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs text-foreground">Auto-derived from Income &amp; Expenses register. Review source rows before approving.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {je.status === 'Draft' && (
                      <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => advance(je.id, true)}>
                        <Check className="w-3.5 h-3.5" /> Approve
                      </Button>
                    )}
                    {je.status === 'Approved' && (
                      <Button variant="default" size="sm" onClick={() => advance(je.id, true)}>
                        <Send className="w-3.5 h-3.5" /> Mark Posted
                      </Button>
                    )}
                    {je.status === 'Posted' && <Badge variant="success" className="text-xs">Posted ✓</Badge>}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {je.status === 'Draft' && (
                    <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => advance(je.id, false)}>
                      <Check className="w-3.5 h-3.5" /> Approve
                    </Button>
                  )}
                  {je.status === 'Approved' && (
                    <Button variant="default" size="sm" onClick={() => advance(je.id, false)}>
                      <Send className="w-3.5 h-3.5" /> Mark Posted
                    </Button>
                  )}
                  {(je.status === 'Draft' || je.status === 'Approved') && (
                    <Button variant="secondary" size="sm" onClick={() => revert(je.id)}>
                      Revert to Draft
                    </Button>
                  )}
                  {je.status === 'Posted' && <Badge variant="success" className="text-xs">Posted ✓</Badge>}
                  <Button variant="secondary" size="sm"
                    className="text-red-500 hover:text-red-700 border-red-200 hover:border-red-300"
                    onClick={() => setDeleteTarget({ id: je.id, label: je.description || je.entryNo })}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </StyledCard>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Notes &amp; Adjusting Journal Entries</h2>
          <p className="text-xs text-foreground mt-0.5">Investment workpaper AJEs · ASPE Part II · FY December 31, 2025</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <FileDown className="w-3.5 h-3.5" /> Export JE Pack
          </Button>
          {section === 'manual' && (
            <Button variant="default" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Add Manual AJE
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Manual AJEs',        count: activeJes.length,  sub: 'Investment-specific'       },
          { label: 'Draft',              count: draft,              sub: 'Require review'            },
          { label: 'Approved',           count: approved,           sub: 'Ready to post'             },
          { label: 'Income/Expense JEs', count: autoState.length,   sub: 'Auto-derived from register'},
        ].map(s => (
          <StyledCard key={s.label} className="p-3 flex items-center gap-3">
            <div className="text-2xl font-bold text-foreground">{s.count}</div>
            <div>
              <div className="text-sm font-medium text-foreground">{s.label}</div>
              <div className="text-xs text-foreground">{s.sub}</div>
            </div>
          </StyledCard>
        ))}
      </div>

      {/* Section toggle */}
      <div className="flex items-center gap-1 bg-card rounded-lg border border-border p-1 w-fit">
        {([
          { key: 'manual', label: 'Investment AJEs', count: activeJes.length, icon: PenLine },
          { key: 'auto',   label: 'Income & Expense JEs', count: autoState.length, icon: Zap },
        ] as const).map(s => (
          <button key={s.key} onClick={() => setSection(s.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              section === s.key ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
            }`}>
            <s.icon className="w-3.5 h-3.5" /> {s.label} ({s.count})
          </button>
        ))}
      </div>

      {/* Manual section */}
      {section === 'manual' && (
        <>
          <div className="flex items-center gap-1 flex-wrap">
            {(['All', 'Draft', 'Approved', 'Posted'] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all ${
                  filterStatus === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'
                }`}>{s}</button>
            ))}
            <button onClick={() => setFilterStatus('Deleted')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full font-medium transition-all ${
                filterStatus === 'Deleted' ? 'bg-red-500 text-white' : 'bg-muted text-foreground hover:bg-muted/80'
              }`}>
              <Trash2 className="w-3 h-3" /> Deleted
              {deletedJes.length > 0 && (
                <span className={`ml-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] font-bold px-1 ${
                  filterStatus === 'Deleted' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                }`}>{deletedJes.length}</span>
              )}
            </button>
          </div>
          <div className="space-y-3">
            {filtered.map(je => renderCard(je, false))}
            {filtered.length === 0 && <div className="text-center py-12 text-foreground text-sm">No AJEs match the selected filters.</div>}
          </div>
        </>
      )}

      {/* Auto section */}
      {section === 'auto' && (
        <>
          <StyledCard className="p-3 bg-blue-50/40 border-blue-200">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-foreground leading-relaxed">
                <strong>Auto-derived entries</strong> — generated from the <span className="font-semibold">Income &amp; Expenses</span> register.
                Review source rows in that tab, then approve entries here before posting to the GL.
              </div>
            </div>
          </StyledCard>
          <div className="space-y-3">
            {autoState.map(je => renderCard(je, true))}
          </div>
        </>
      )}

      {/* Add Manual AJE Modal */}
      {addOpen && (
        <AddInvAJEModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          nextNo={`AE-${String(ajesState.length + 1).padStart(2, '0')}`}
          onSave={je => { addAJE(je); setAddOpen(false); }}
        />
      )}

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete Journal Entry</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <Trash2 className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-700">Moves to Deleted — restorable from the Deleted filter</p>
            </div>
            <p className="text-sm text-foreground px-1">Delete <strong>{deleteTarget?.label}</strong>?</p>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (deleteTarget) { softDelete(deleteTarget.id); setDeleteTarget(null); } }}>
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Add Manual AJE Modal ─────────────────────────────────────────────────────

type DraftLine = InvAJELine & { _id: string };
function emptyLine(idx: number): DraftLine {
  return { _id: `nl-${idx}-${Date.now()}`, account: '', glCode: '', dr: 0, cr: 0 };
}

function AddInvAJEModal({ open, onClose, nextNo, onSave }: {
  open: boolean; onClose: () => void; nextNo: string; onSave: (je: InvAJE) => void;
}) {
  const [entryNo,    setEntryNo]    = useState(nextNo);
  const [date,       setDate]       = useState(YEAR_END);
  const [entryType,  setEntryType]  = useState<InvAJE['type']>('Correcting');
  const [confidence, setConf]       = useState<'High' | 'Medium' | 'Low'>('High');
  const [description, setDesc]      = useState('');
  const [rationale,  setRationale]  = useState('');
  const [wpRef,      setWpRef]      = useState('');
  const [lines,      setLines]      = useState<DraftLine[]>([emptyLine(1), emptyLine(2)]);
  const [notes,      setNotes]      = useState('');

  const totalDR  = lines.reduce((s, l) => s + (l.dr || 0), 0);
  const totalCR  = lines.reduce((s, l) => s + (l.cr || 0), 0);
  const balanced = Math.abs(totalDR - totalCR) < 0.01;

  const upd = (id: string, k: keyof DraftLine, v: string | number) =>
    setLines(prev => prev.map(l => l._id !== id ? l : { ...l, [k]: v }));
  const addLine    = () => setLines(prev => [...prev, emptyLine(prev.length + 1)]);
  const removeLine = (id: string) => setLines(prev => prev.filter(l => l._id !== id));

  const reset = () => {
    setEntryNo(nextNo); setDate(YEAR_END); setEntryType('Correcting'); setConf('High');
    setDesc(''); setRationale(''); setWpRef(''); setLines([emptyLine(1), emptyLine(2)]); setNotes('');
  };

  const handleSave = () => {
    if (!description.trim()) { toast.error('Description is required'); return; }
    if (!balanced) { toast.error(`Unbalanced — DR $${fmt(totalDR)}  CR $${fmt(totalCR)}`); return; }
    onSave({
      id:          `je-inv-${Date.now()}`,
      entryNo,
      description,
      rationale:   rationale || description,
      lines:       lines.map(({ _id: _,  ...l }) => l),
      type:        entryType,
      confidence,
      notes:       notes || undefined,
      status:      'Draft',
      wpRef:       wpRef || undefined,
      source:      'manual',
    });
    reset();
  };

  const FL = (txt: React.ReactNode) => (
    <span className="block text-[11px] font-medium text-foreground mb-1 whitespace-nowrap">{txt}</span>
  );
  const groups = ['Asset', 'Liability', 'Income', 'Expense'] as const;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="w-4 h-4 text-primary" /> Add Manual Investment AJE
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Field strip */}
          <div className="flex items-end gap-2 flex-wrap">
            <div className="shrink-0">
              {FL(<>Entry No <span className="text-red-400">*</span></>)}
              <input type="text" className={`${SFI} w-24`} value={entryNo} onChange={e => setEntryNo(e.target.value)} />
            </div>
            <div className="shrink-0">
              {FL('Date')}
              <input type="date" className={`${SFI} w-36`} value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="shrink-0">
              {FL(<>Type <span className="text-red-400">*</span></>)}
              <div className="relative">
                <select className={`${SFS} w-36`} value={entryType} onChange={e => setEntryType(e.target.value as InvAJE['type'])}>
                  {(['Correcting', 'Reclassification', 'Accrual', 'Disposition', 'Fair Value Adj', 'Tax', 'Income/Expense'] as const).map(t => (
                    <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground pointer-events-none" />
              </div>
            </div>
            <div className="shrink-0">
              {FL('Confidence')}
              <div className="relative">
                <select className={`${SFS} w-28`} value={confidence} onChange={e => setConf(e.target.value as 'High' | 'Medium' | 'Low')}>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground pointer-events-none" />
              </div>
            </div>
            <div className="shrink-0">
              {FL('WP Ref')}
              <input type="text" className={`${SFI} w-24`} placeholder="e.g. I-08" value={wpRef} onChange={e => setWpRef(e.target.value)} />
            </div>
            <div className="shrink-0 flex flex-col items-center">
              {FL('Clear')}
              <Button variant="destructive" size="icon" onClick={reset} title="Clear form">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Description */}
          <div>
            {FL(<>Description <span className="text-red-400">*</span></>)}
            <input type="text" className={`${SFI}`} placeholder="e.g. Record year-end accrued interest"
              value={description} onChange={e => setDesc(e.target.value)} />
          </div>

          {/* Rationale */}
          <div>
            {FL('Rationale / Workpaper Note')}
            <textarea rows={2}
              className="input-double-border w-full text-sm px-3 py-2 rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground placeholder:text-foreground resize-none focus:outline-none hover:border-[hsl(210_25%_75%)]"
              placeholder="Why is this entry needed?"
              value={rationale} onChange={e => setRationale(e.target.value)} />
          </div>

          {/* Lines table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="py-2.5 px-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider w-[150px]">Acc No.</th>
                  <th className="py-2.5 px-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider w-20">GL Code</th>
                  <th className="py-2.5 px-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider w-36">Debit</th>
                  <th className="py-2.5 px-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider w-36">Credit</th>
                  <th className="py-2.5 px-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={line._id} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                    <td className="px-3 py-2">
                      <div className="relative">
                        <select className={`${SFS} font-mono text-xs`} style={{ color: 'transparent' }}
                          value={line.account}
                          onChange={e => { upd(line._id, 'account', e.target.value); upd(line._id, 'glCode', accCode(e.target.value)); }}>
                          <option value="">Select</option>
                          {groups.map(g => (
                            <optgroup key={g} label={g}>
                              {INV_GL_ACCOUNTS.filter(a => a.group === g).map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                            </optgroup>
                          ))}
                        </select>
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-foreground pointer-events-none select-none">
                          {line.account ? accCode(line.account) : <span className="font-sans font-normal text-foreground">Select</span>}
                        </span>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground pointer-events-none" />
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" className={`${SFI} text-xs font-mono`} value={line.glCode} onChange={e => upd(line._id, 'glCode', e.target.value)} />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min="0" step="0.01" className={SFN} value={line.dr || ''} placeholder="0.00"
                        onChange={e => upd(line._id, 'dr', parseFloat(e.target.value) || 0)} />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min="0" step="0.01" className={SFN} value={line.cr || ''} placeholder="0.00"
                        onChange={e => upd(line._id, 'cr', parseFloat(e.target.value) || 0)} />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => removeLine(line._id)} title="Remove"
                          className="text-foreground hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        {i === lines.length - 1 && (
                          <Button variant="ghost" size="icon-sm" onClick={addLine} title="Add line">
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 text-sm font-semibold border-t border-border">
                  <td colSpan={2} className="px-3 py-2.5 text-right text-foreground">Total</td>
                  <td className={`px-3 py-2.5 text-right tabular-nums ${!balanced && totalDR > 0 ? 'text-red-600' : 'text-foreground'}`}>{fmt(totalDR)}</td>
                  <td className={`px-3 py-2.5 text-right tabular-nums ${!balanced && totalCR > 0 ? 'text-red-600' : 'text-foreground'}`}>{fmt(totalCR)}</td>
                  <td className="px-3 py-2.5 text-center text-xs">
                    {totalDR > 0 && (balanced
                      ? <span className="text-emerald-600">✓ Balanced</span>
                      : <span className="text-red-600">✗ Off ${fmt(Math.abs(totalDR - totalCR))}</span>)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <button onClick={addLine} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
            <Plus className="w-3 h-3" /> Add Line
          </button>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
            <textarea rows={3}
              className="input-double-border w-full text-sm px-3 py-2.5 rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground placeholder:text-foreground resize-none focus:outline-none hover:border-[hsl(210_25%_75%)]"
              placeholder="Add your notes here…"
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="secondary" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button variant="default" onClick={handleSave}>Save AJE</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
