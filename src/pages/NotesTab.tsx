import { useState, useMemo, useCallback, Fragment } from 'react';
import {
  RefreshCw, AlertTriangle, RotateCcw,
} from 'lucide-react';
import { StyledCard } from '@/components/wp-ui/card';
import { useStore } from '../store/useStore';
import { fmtPct, fmtDateDisplay } from '../lib/utils';
import type { Loan, ContinuityRow, ReconciliationItem } from '../types';

// ─── Formatters ───────────────────────────────────────────────────────────────

const CAD = (v: number) =>
  v === 0 ? '—' : `$${v.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// ─── Data helpers ─────────────────────────────────────────────────────────────

function getTBBalance(loanId: string, recon: ReconciliationItem[], fallback: number) {
  const r = recon.find(x => x.loanId === loanId && x.accountType === 'Principal');
  if (!r) return { value: fallback, fromTB: false, hasVariance: false };
  return { value: r.tbBalance, fromTB: true, hasVariance: r.variance !== 0 };
}

function getPriorYearBalance(loanId: string, continuity: ContinuityRow[]): number | null {
  const rows = continuity
    .filter(r => r.loanId === loanId)
    .sort((a, b) => a.period.localeCompare(b.period));
  return rows.length > 0 ? rows[0].openingBalance : null;
}

function getYEContinuity(loanId: string, continuity: ContinuityRow[], yearEnd: string) {
  const ym = yearEnd.substring(0, 7);
  const rows = continuity
    .filter(r => r.loanId === loanId)
    .sort((a, b) => a.period.localeCompare(b.period));
  const before = rows.filter(r => r.period <= ym);
  return before.length > 0 ? before[before.length - 1] : (rows[rows.length - 1] ?? null);
}

// ─── Per-loan note generator ──────────────────────────────────────────────────

function generateLoanNote(l: Loan, tbValue: number): string {
  const balance = CAD(tbValue);
  const ccy = l.currency !== 'CAD' ? `${l.currency} ` : '';
  const typeLabel =
    l.type === 'LOC'      ? 'line of credit' :
    l.type === 'Revolver' ? 'revolving credit facility' :
    l.type === 'Mortgage' ? 'mortgage' : 'term loan';

  const rateStr = l.interestType === 'Variable' && l.benchmark
    ? `${l.benchmark}${l.spread ? ` + ${l.spread}%` : ''} (${fmtPct(l.rate)} effective), variable rate`
    : `${fmtPct(l.rate)}, fixed rate`;

  const payStr = `${l.paymentFrequency.toLowerCase()} ${l.paymentType.toLowerCase()} payments`;
  const matStr = l.maturityDate
    ? `matures on ${fmtDateDisplay(l.maturityDate)}`
    : 'revolving with no fixed maturity';
  const secStr = l.securityDescription
    ? ` The facility is secured by ${l.securityDescription.toLowerCase()}.`
    : '';
  const creditLimitStr =
    (l.type === 'LOC' || l.type === 'Revolver') && l.creditLimit
      ? ` Maximum available credit is ${CAD(l.creditLimit)}.`
      : '';
  const fxStr =
    l.currency !== 'CAD' && l.fxRateToCAD
      ? ` Translated to CAD at a closing rate of ${l.fxRateToCAD.toFixed(4)}.`
      : '';

  return (
    `${l.name} is a ${ccy}${balance} ${typeLabel} with ${l.lender} bearing interest at ${rateStr}, ` +
    `payable in ${payStr}. The facility ${matStr}.${secStr}${creditLimitStr}${fxStr}`
  );
}

// ─── Inline row note (always editable, auto-saves on change) ─────────────────

function RowNote({
  loanId, loanName, noteIndex, value, onSave, onRegenerate,
}: {
  loanId: string; loanName: string; noteIndex: number; value: string;
  onSave: (id: string, v: string) => void;
  onRegenerate: (id: string) => void;
}) {
  return (
    <tr className="border-b-2 border-border group/note">
      <td colSpan={9} className="px-5 pt-3 pb-4 bg-muted/20">
        {/* Note label */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
            Note {noteIndex}
          </span>
          <span className="text-[10px] text-foreground">—</span>
          <span className="text-[10px] font-semibold text-foreground uppercase tracking-wide">{loanName}</span>
        </div>
        {/* Editable textarea */}
        <div className="flex items-start gap-2">
          <textarea
            rows={2}
            className="flex-1 text-xs font-sans bg-background border border-border rounded-md px-2.5 py-2 resize-none focus:outline-none focus:border-primary/40 leading-relaxed text-foreground placeholder:text-foreground/40 transition-colors"
            value={value}
            onChange={e => onSave(loanId, e.target.value)}
            placeholder="Add note for this facility…"
          />
          <button
            onClick={() => onRegenerate(loanId)}
            title="Re-generate note"
            className="opacity-0 group-hover/note:opacity-60 hover:!opacity-100 shrink-0 mt-0.5 p-0.5 rounded transition-opacity text-foreground hover:text-primary"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Repayment schedule ───────────────────────────────────────────────────────

function RepaymentScheduleTable({ loans, yearEnd }: { loans: Loan[]; yearEnd: string }) {
  const yr = new Date(yearEnd + 'T00:00:00').getFullYear() || 2024;
  const term = loans.filter(l => l.type !== 'LOC' && l.type !== 'Revolver');

  const buckets: Record<string, number> = {};
  for (let i = 1; i <= 5; i++) buckets[String(yr + i)] = 0;
  buckets['thereafter'] = 0;

  term.forEach(l => {
    const matYear = l.maturityDate ? new Date(l.maturityDate + 'T00:00:00').getFullYear() : null;
    if (!matYear) return;
    const key = matYear > yr + 5 ? 'thereafter' : String(matYear);
    buckets[key] = (buckets[key] ?? 0) + (l.currentPortion || l.currentBalance || 0);
  });
  const total = Object.values(buckets).reduce((s, v) => s + v, 0);
  const monthName = new Date(yearEnd + 'T00:00:00').toLocaleString('en-CA', { month: 'long' });
  const day = new Date(yearEnd + 'T00:00:00').getDate();
  const cols = [...Array(5).keys()].map(i => String(yr + i + 1));

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-10">
        <tr className="bg-muted border-b border-border">
          <th className="text-left px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap">
            Year ending {monthName} {day}
          </th>
          {cols.map(y => (
            <th key={y} className="text-right px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap">{y}</th>
          ))}
          <th className="text-right px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap">Thereafter</th>
          <th className="text-right px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-border hover:bg-muted/30">
          <td className="px-3 py-2.5 text-sm text-foreground">Principal repayments ($)</td>
          {cols.map(y => (
            <td key={y} className="px-3 py-2.5 text-right tabular-nums font-mono text-sm text-foreground">{CAD(buckets[y] || 0)}</td>
          ))}
          <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm text-foreground">{CAD(buckets['thereafter'])}</td>
          <td className="px-3 py-2.5 text-right tabular-nums font-bold font-mono text-sm text-foreground">{CAD(total)}</td>
        </tr>
      </tbody>
    </table>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NotesTab() {
  const { loans, continuity, recon, settings } = useStore(s => ({
    loans:      s.loans,
    continuity: s.continuity,
    recon:      s.reconciliation,
    settings:   s.settings,
  }));

  const yearEnd = settings.fiscalYearEnd;
  const fyYear  = new Date(yearEnd + 'T00:00:00').getFullYear();
  const active  = useMemo(() => loans.filter(l => l.status === 'Active'), [loans]);

  // ── Per-loan notes (auto-generated on first render) ───────────────────
  const [loanNotes, setLoanNotes] = useState<Record<string, string>>(() => {
    const notes: Record<string, string> = {};
    loans.filter(l => l.status === 'Active').forEach(l => {
      notes[l.id] = generateLoanNote(l, l.currentBalance);
    });
    return notes;
  });

  const saveLoanNote = useCallback((id: string, text: string) => {
    setLoanNotes(prev => ({ ...prev, [id]: text }));
  }, []);

  const regenerateLoanNote = useCallback((id: string) => {
    const loan = loans.find(l => l.id === id);
    if (!loan) return;
    const tb = getTBBalance(id, recon, loan.currentBalance);
    setLoanNotes(prev => ({ ...prev, [id]: generateLoanNote(loan, tb.value) }));
  }, [loans, recon]);

  const regenerateAll = () => {
    const notes: Record<string, string> = {};
    active.forEach(l => {
      const tb = getTBBalance(l.id, recon, l.currentBalance);
      notes[l.id] = generateLoanNote(l, tb.value);
    });
    setLoanNotes(prev => ({ ...prev, ...notes }));
  };

  // ── Totals ────────────────────────────────────────────────────────────
  const totalCY = active.reduce((s, l) => s + getTBBalance(l.id, recon, l.currentBalance).value, 0);
  const totalPY = active.reduce((s, l) => s + (getPriorYearBalance(l.id, continuity) ?? 0), 0);
  const totalCurrent = active.reduce((s, l) => {
    const yr = getYEContinuity(l.id, continuity, yearEnd);
    return s + (yr?.currentPortion ?? l.currentPortion ?? 0);
  }, 0);
  const totalLT = active.reduce((s, l) => {
    const yr = getYEContinuity(l.id, continuity, yearEnd);
    return s + (yr?.longTermPortion ?? l.longTermPortion ?? 0);
  }, 0);
  const hasVariances = active.some(l => getTBBalance(l.id, recon, l.currentBalance).hasVariance);

  return (
    <div className="flex flex-col">

      {/* ── Section header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div>
          <p className="text-xs text-foreground uppercase tracking-widest mb-0.5">{settings.client}</p>
          <h2 className="text-base font-semibold text-foreground">Note — Long-term Debt</h2>
          <p className="text-xs text-foreground mt-0.5">For the year ended {fmtDateDisplay(yearEnd)}</p>
        </div>
      </div>

      {/* ── Main table ──────────────────────────────────────────────────── */}
      <div className="px-6">
        <StyledCard className="overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap">Long-term Debt</span>
              <span className="text-[10px] text-foreground bg-muted rounded-full px-2 py-0.5">
                {active.length} active facilit{active.length === 1 ? 'y' : 'ies'}
              </span>
            </div>
            <span className="text-[10px] text-foreground flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3" />Auto-populated from Loan Register &amp; Continuity
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)', minHeight: '200px' }}>
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-muted border-b border-border">
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap w-[17%]">Facility</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap w-[11%]">Lender</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap w-[13%]">Interest Rate</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap">Day Count</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap w-[9%]">Payment</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap w-[9%]">Maturity</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide w-[14%]">Security</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap w-[10%]">
                    {new Date(yearEnd + 'T00:00:00').toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap w-[10%]">
                    {new Date(new Date(yearEnd + 'T00:00:00').setFullYear(fyYear - 1)).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </th>
                </tr>
              </thead>
              <tbody>
                {active.map((l, idx) => {
                  const tb = getTBBalance(l.id, recon, l.currentBalance);
                  const py = getPriorYearBalance(l.id, continuity);
                  const isVar = l.interestType === 'Variable' || l.interestType === 'Floating';
                  return (
                    <Fragment key={l.id}>
                      {/* Data row */}
                      <tr className="border-b border-border/40 hover:bg-muted/20 align-top">
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-foreground leading-snug">{l.name}</div>
                          {l.currency !== 'CAD' && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                              {l.currency}{l.fxRateToCAD ? ` @ ${l.fxRateToCAD.toFixed(4)}` : ''}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-foreground">{l.lender}</td>
                        <td className="px-3 py-2.5">
                          {isVar && l.benchmark ? (
                            <>
                              <span className="font-medium text-foreground">{l.benchmark}</span>
                              {l.spread ? ` + ${l.spread}%` : ''}
                              <div className="text-xs text-foreground">{fmtPct(l.rate)} eff.</div>
                            </>
                          ) : (
                            <span className="font-medium text-foreground">{fmtPct(l.rate)}</span>
                          )}
                          <div className="text-xs text-foreground mt-0.5">{l.interestType}</div>
                        </td>
                        <td className="px-3 py-2.5 text-sm text-foreground">{l.dayCountBasis}</td>
                        <td className="px-3 py-2.5 text-sm text-foreground leading-snug">
                          {l.paymentFrequency}<br /><span className="text-xs">{l.paymentType}</span>
                        </td>
                        <td className="px-3 py-2.5 text-sm text-foreground whitespace-nowrap">
                          {l.maturityDate ? fmtDateDisplay(l.maturityDate) : <em className="text-foreground">Revolving</em>}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-foreground leading-snug">
                          {l.securityDescription ?? <em className="text-foreground">—</em>}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-mono font-medium text-foreground">
                          {CAD(tb.value)}
                          {tb.hasVariance && <AlertTriangle className="w-3 h-3 text-amber-500 inline ml-1 -mt-0.5" />}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-mono text-foreground">
                          {py !== null ? CAD(py) : <span className="text-xs text-foreground">n/a</span>}
                        </td>
                      </tr>
                      {/* Per-loan note row */}
                      <RowNote
                        loanId={l.id}
                        loanName={l.name}
                        noteIndex={idx + 1}
                        value={loanNotes[l.id] ?? ''}
                        onSave={saveLoanNote}
                        onRegenerate={regenerateLoanNote}
                      />
                    </Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/40">
                  <td colSpan={7} className="px-3 py-2.5 text-sm font-semibold text-foreground">Total long-term debt</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-bold font-mono text-sm text-foreground">{CAD(totalCY)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-bold font-mono text-sm text-foreground">{CAD(totalPY)}</td>
                </tr>
                <tr className="border-b border-border bg-muted/10">
                  <td colSpan={7} className="px-3 py-2 text-sm text-foreground pl-7">
                    Less: current portion — reclassified to current liabilities
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-mono text-sm text-foreground">({CAD(totalCurrent)})</td>
                  <td className="px-3 py-2 text-right tabular-nums font-mono text-sm text-foreground">—</td>
                </tr>
                <tr className="bg-muted/30">
                  <td colSpan={7} className="px-3 py-2.5 text-sm font-semibold text-foreground">Non-current portion</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-bold font-mono text-sm text-foreground">{CAD(totalLT)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm text-foreground">—</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Source attribution */}
          <div className="px-5 py-2 border-t border-border bg-muted/10">
            <p className="text-[10px] text-foreground flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 shrink-0" />
              {fyYear} balances from trial balance (TB)
              {hasVariances && <span className="text-amber-600"> · ⚠ reconciling items exist</span>}
              &nbsp;·&nbsp; {fyYear - 1} comparatives from continuity opening balances
              &nbsp;·&nbsp; current portion per year-end continuity reclassification
            </p>
          </div>

        </StyledCard>
      </div>

      {/* ── Repayment schedule ───────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-6">
        <StyledCard className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide whitespace-nowrap">
              Principal Repayment Schedule — Next Five Fiscal Years
            </span>
            <span className="text-[10px] text-foreground flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3" />Derived from maturity dates in loan register
            </span>
          </div>
          <div className="overflow-x-auto">
            <RepaymentScheduleTable loans={active} yearEnd={yearEnd} />
          </div>
        </StyledCard>
      </div>

    </div>
  );
}
