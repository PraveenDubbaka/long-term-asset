import { useMemo, useState } from 'react';
import { X, Printer, FileText, AlertTriangle, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fmtPct } from '../lib/utils';
import type { Loan, ContinuityRow, ReconciliationItem } from '../types';

// ─── Data helpers (mirrors NotesTab logic) ────────────────────────────────────

function getTBVal(loanId: string, recon: ReconciliationItem[], fallback: number) {
  const r = recon.find(x => x.loanId === loanId && x.accountType === 'Principal');
  return r ? r.tbBalance : fallback;
}

function getPY(loanId: string, continuity: ContinuityRow[]): number | null {
  const rows = continuity
    .filter(r => r.loanId === loanId)
    .sort((a, b) => a.period.localeCompare(b.period));
  return rows.length > 0 ? rows[0].openingBalance : null;
}

function getYERow(loanId: string, continuity: ContinuityRow[], yearEnd: string) {
  const ym = yearEnd.substring(0, 7);
  const rows = continuity
    .filter(r => r.loanId === loanId)
    .sort((a, b) => a.period.localeCompare(b.period));
  const before = rows.filter(r => r.period <= ym);
  return before.length > 0 ? before[before.length - 1] : (rows[rows.length - 1] ?? null);
}

function parseAmt(s: string | undefined, fallback: number): number {
  if (!s) return fallback;
  const n = parseFloat(s.replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? fallback : n;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const N  = (v: number) =>
  v > 0 ? v.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—';

const NP = (v: number) =>
  v > 0
    ? `(${v.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })})`
    : '—';

function longDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-CA', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

// Fallback loan description (same logic as NotesTab.generateLoanNote)
function fallbackNote(l: Loan): string {
  const ccy = l.currency !== 'CAD' ? `${l.currency} ` : '';
  const typeLabel =
    l.type === 'LOC'      ? 'line of credit'          :
    l.type === 'Revolver' ? 'revolving credit facility':
    l.type === 'Mortgage' ? 'mortgage'                 : 'term loan';
  const rateStr =
    l.interestType === 'Variable' && l.benchmark
      ? `${l.benchmark}${l.spread ? ` + ${l.spread}%` : ''} (${fmtPct(l.rate)} effective), variable rate`
      : `${fmtPct(l.rate)} per annum, fixed rate`;
  const payStr = `${l.paymentFrequency.toLowerCase()} ${l.paymentType.toLowerCase()} payments`;
  const matStr = l.maturityDate
    ? `matures ${longDate(l.maturityDate)}`
    : 'revolving with no fixed maturity';
  const secStr = l.securityDescription ? `, secured by ${l.securityDescription.toLowerCase()}` : '';
  const creditStr = (l.type === 'LOC' || l.type === 'Revolver') && l.creditLimit
    ? `. Maximum available credit is $${l.creditLimit.toLocaleString('en-CA')}`
    : '';
  const fxStr = l.currency !== 'CAD' && l.fxRateToCAD
    ? `. Translated to CAD at closing rate of ${l.fxRateToCAD.toFixed(4)}`
    : '';
  return `${l.name} — ${ccy}${typeLabel} with ${l.lender} at ${rateStr}, payable in ${payStr}, ${matStr}${secStr}${creditStr}${fxStr}.`;
}

// ─── Shared inline styles ─────────────────────────────────────────────────────

const docBase: React.CSSProperties = {
  fontSize: '11px',
  lineHeight: '1.65',
  color: '#1a1a1a',
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};

const TH: React.CSSProperties = {
  fontWeight: 600,
  padding: '5px 8px',
  borderBottom: '1.5px solid #333',
  whiteSpace: 'nowrap',
};

const TD: React.CSSProperties = {
  padding: '5px 8px',
  borderBottom: '1px solid #e2e2e2',
  verticalAlign: 'top',
};

const MONO: React.CSSProperties = {
  fontFamily: "'Courier New', Courier, monospace",
  letterSpacing: '0.02em',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onClose:     () => void;
  loanNotes:   Record<string, string>;
  cyOverrides: Record<string, string>;
  pyOverrides: Record<string, string>;
  isStale?:    boolean;
  staleDiff?:  string[];
  postedAt?:   Date | null;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function LTDNotesPreviewModal({ onClose, loanNotes, cyOverrides, pyOverrides, isStale, staleDiff, postedAt }: Props) {
  const { loans: allLoans, continuity, reconciliation: recon, covenants, settings } = useStore(s => ({
    loans:          s.loans,
    continuity:     s.continuity,
    reconciliation: s.reconciliation,
    covenants:      s.covenants,
    settings:       s.settings,
  }));

  const [noteNo, setNoteNo] = useState('');

  const yearEnd = settings.fiscalYearEnd;
  const client  = settings.client;
  const fyYear  = new Date(yearEnd + 'T00:00:00').getFullYear();
  const active  = useMemo(() => allLoans.filter(l => l.status === 'Active'), [allLoans]);

  // Date labels
  const cyLabel = longDate(yearEnd);
  const pyDate  = new Date(yearEnd + 'T00:00:00');
  pyDate.setFullYear(fyYear - 1);
  const pyLabel = pyDate.toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' });

  // Per-loan rows
  const loanRows = useMemo(() => active.map(l => {
    const tbBase = getTBVal(l.id, recon, l.currentBalance);
    const cy     = parseAmt(cyOverrides[l.id], tbBase);
    const pyBase = getPY(l.id, continuity) ?? 0;
    const py     = parseAmt(pyOverrides[l.id], pyBase);
    const yeRow  = getYERow(l.id, continuity, yearEnd);
    const cur    = yeRow?.currentPortion  ?? l.currentPortion  ?? 0;
    const lt     = yeRow?.longTermPortion ?? l.longTermPortion ?? 0;
    return { loan: l, cy, py, cur, lt };
  }), [active, recon, continuity, yearEnd, cyOverrides, pyOverrides]);

  const totalCY  = loanRows.reduce((s, r) => s + r.cy,  0);
  const totalPY  = loanRows.reduce((s, r) => s + r.py,  0);
  const totalCur = loanRows.reduce((s, r) => s + r.cur, 0);
  const totalLT  = loanRows.reduce((s, r) => s + r.lt,  0);

  // Maturity buckets (term loans only)
  const { matCols, matBuckets, matTotal } = useMemo(() => {
    const term = active.filter(l => l.type !== 'LOC' && l.type !== 'Revolver');
    const b: Record<string, number> = {};
    for (let i = 1; i <= 5; i++) b[String(fyYear + i)] = 0;
    b.thereafter = 0;
    term.forEach(l => {
      if (!l.maturityDate) return;
      const my = new Date(l.maturityDate + 'T00:00:00').getFullYear();
      const key = my > fyYear + 5 ? 'thereafter' : String(my);
      b[key] = (b[key] ?? 0) + (l.currentPortion || l.currentBalance || 0);
    });
    const cols = Array.from({ length: 5 }, (_, i) => String(fyYear + i + 1));
    const tot  = Object.values(b).reduce((s, v) => s + v, 0);
    return { matCols: cols, matBuckets: b, matTotal: tot };
  }, [active, fyYear]);

  // Covenant issues
  const issues = covenants.filter(c => c.status === 'Breached' || c.status === 'At Risk');
  const hasBreaches = issues.some(c => c.status === 'Breached');

  // Interest rate range
  const rates = active.map(l => l.rate).filter(r => r > 0);
  const rateRange = rates.length === 0 ? '—'
    : rates.length === 1 || Math.min(...rates) === Math.max(...rates)
      ? fmtPct(rates[0])
      : `${fmtPct(Math.min(...rates))} to ${fmtPct(Math.max(...rates))}`;

  const prefix = noteNo.trim() ? `${noteNo.trim()}. ` : '';
  const monthDay = new Date(yearEnd + 'T00:00:00').toLocaleDateString('en-CA', { month: 'long', day: 'numeric' });

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
    >
      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white dark:bg-card border-b border-border flex items-center justify-between px-5 py-2.5 print:hidden">
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground">Notes to Financial Information — Long-term Debt</span>
          {isStale ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold uppercase tracking-wide">
              <AlertTriangle className="w-3 h-3" /> Outdated
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold uppercase tracking-wide">
              Draft
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Note number */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground whitespace-nowrap">Note #</label>
            <input
              type="text"
              value={noteNo}
              onChange={e => setNoteNo(e.target.value)}
              placeholder="e.g. 7"
              className="w-14 h-7 text-xs rounded-md border border-border bg-background text-foreground px-2 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          {/* Print */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Print / PDF
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted text-foreground transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Stale alert bar ──────────────────────────────────────────────────── */}
      {isStale && (
        <div className="shrink-0 flex items-center gap-3 px-5 py-2.5 bg-amber-50 border-b border-amber-200 print:hidden">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-amber-800">This note is out of date. </span>
            <span className="text-xs text-amber-700">
              Changes since {postedAt ? `posting at ${postedAt.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}` : 'last post'}:{' '}
              <span className="font-medium">{staleDiff?.join('; ')}</span>.
              Close this view and click <strong>Re-post Note</strong> to update.
            </span>
          </div>
          <button onClick={onClose} className="flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-medium bg-amber-200 hover:bg-amber-300 text-amber-900 transition-colors shrink-0">
            <RefreshCw className="w-3 h-3" /> Go Re-post
          </button>
        </div>
      )}

      {/* ── Page area ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-[#eef0f3] py-8 px-6 print:bg-white print:p-0 print:overflow-visible">

        {/* The "paper" card */}
        <div
          className="max-w-[780px] mx-auto bg-white shadow-md border border-gray-200 rounded-sm relative overflow-hidden print:shadow-none print:border-none"
          style={docBase}
        >

          {/* DRAFT / OUTDATED watermark */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center select-none print:opacity-[0.06]"
            style={{ zIndex: 1, opacity: isStale ? 0.07 : 0.045 }}
          >
            <span
              style={{
                fontSize: '110px',
                fontWeight: 900,
                letterSpacing: '0.15em',
                color: isStale ? '#b45309' : '#000',
                transform: 'rotate(-35deg)',
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {isStale ? 'OUTDATED' : 'DRAFT'}
            </span>
          </div>

          {/* Document body */}
          <div className="relative px-12 py-10 space-y-7" style={{ zIndex: 2 }}>

            {/* ── Doc header ─────────────────────────────────────────────── */}
            <div className="text-center space-y-0.5 pb-5" style={{ borderBottom: '1.5px solid #333' }}>
              <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>{client}</p>
              <p style={{ fontWeight: 700, fontSize: '12px' }}>Notes to Financial Information</p>
              <p style={{ fontSize: '11px' }}>For the year ended {cyLabel}</p>
            </div>

            {/* ── Note heading ───────────────────────────────────────────── */}
            <p style={{ fontWeight: 700, fontSize: '11.5px', marginBottom: '-12px' }}>
              {prefix}Long-term debt
            </p>

            {/* ── Accounting policy ──────────────────────────────────────── */}
            <div className="space-y-2.5">
              <p>
                Long-term debt is initially measured at the transaction price and subsequently carried at amortized
                cost using the effective interest rate method. Transaction costs directly attributable to the
                issuance of debt instruments are deducted from the carrying amount and amortized over the expected
                life of the related instrument using the effective interest rate method.
              </p>
              <p>
                Debt is classified as current when it is due within twelve months of the reporting date or when the
                Company does not have an unconditional right to defer settlement for at least twelve months after the
                reporting date.
              </p>
            </div>

            {/* ── Loan table ─────────────────────────────────────────────── */}
            <div>
              <p style={{ marginBottom: '8px' }}>
                The following credit facilities were outstanding as at {cyLabel}:
              </p>

              <table style={{ width: '100%', borderCollapse: 'collapse', ...docBase }}>
                <thead>
                  <tr>
                    <th style={{ ...TH, textAlign: 'left', width: '62%', paddingLeft: 0 }}></th>
                    <th style={{ ...TH, textAlign: 'right' }}>{cyLabel}</th>
                    <th style={{ ...TH, textAlign: 'right' }}>{pyLabel}</th>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 8px 4px 0', fontSize: '10px', color: '#666' }}></td>
                    <td style={{ padding: '2px 8px 4px 8px', fontSize: '10px', color: '#666', textAlign: 'right' }}>$</td>
                    <td style={{ padding: '2px 0 4px 8px',   fontSize: '10px', color: '#666', textAlign: 'right' }}>$</td>
                  </tr>
                </thead>

                <tbody>
                  {loanRows.map(({ loan, cy, py }) => (
                    <tr key={loan.id}>
                      <td style={{ ...TD, paddingLeft: 0, lineHeight: '1.55' }}>
                        {loanNotes[loan.id] || fallbackNote(loan)}
                      </td>
                      <td style={{ ...TD, ...MONO, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {N(cy)}
                      </td>
                      <td style={{ ...TD, ...MONO, textAlign: 'right', whiteSpace: 'nowrap', paddingRight: 0 }}>
                        {N(py)}
                      </td>
                    </tr>
                  ))}

                  {/* Sub-total underline row */}
                  <tr>
                    <td style={{ padding: '0 8px 0 0' }} />
                    <td style={{ padding: '0 8px', borderTop: '1px solid #888', height: '6px' }} />
                    <td style={{ padding: '0',     borderTop: '1px solid #888', height: '6px' }} />
                  </tr>

                  {/* Sub-total */}
                  <tr>
                    <td style={{ padding: '4px 8px 4px 0' }} />
                    <td style={{ ...MONO, textAlign: 'right', padding: '4px 8px', borderBottom: '1px solid #888', whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {N(totalCY)}
                    </td>
                    <td style={{ ...MONO, textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #888', whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {N(totalPY)}
                    </td>
                  </tr>

                  {/* Less: current portion */}
                  <tr>
                    <td style={{ padding: '4px 8px 4px 16px', fontSize: '11px' }}>Less: current portion</td>
                    <td style={{ ...MONO, textAlign: 'right', padding: '4px 8px', borderBottom: '1px solid #888', whiteSpace: 'nowrap' }}>
                      {NP(totalCur)}
                    </td>
                    <td style={{ ...MONO, textAlign: 'right', padding: '4px 0', borderBottom: '1px solid #888', whiteSpace: 'nowrap' }}>
                      —
                    </td>
                  </tr>

                  {/* Long-term portion */}
                  <tr>
                    <td style={{ padding: '4px 8px 4px 0', fontWeight: 700 }}>Long-term portion</td>
                    <td style={{ ...MONO, textAlign: 'right', padding: '4px 8px', fontWeight: 700, whiteSpace: 'nowrap',
                      borderBottom: '3px double #333' }}>
                      {N(totalLT)}
                    </td>
                    <td style={{ ...MONO, textAlign: 'right', padding: '4px 0', fontWeight: 700, whiteSpace: 'nowrap',
                      borderBottom: '3px double #333', paddingRight: 0 }}>
                      {N(totalPY)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── Maturity schedule ──────────────────────────────────────── */}
            <div>
              <p style={{ marginBottom: '8px' }}>
                Minimum principal repayments required in each of the next five fiscal years and thereafter are
                as follows:
              </p>

              <table style={{ width: '260px', borderCollapse: 'collapse', ...docBase }}>
                <thead>
                  <tr>
                    <th style={{ ...TH, textAlign: 'left', paddingLeft: 0 }}>Year ending {monthDay}</th>
                    <th style={{ ...TH, textAlign: 'right' }}>$</th>
                  </tr>
                </thead>
                <tbody>
                  {matCols.map(yr => (
                    <tr key={yr}>
                      <td style={{ ...TD, paddingLeft: 0 }}>{yr}</td>
                      <td style={{ ...TD, ...MONO, textAlign: 'right', paddingRight: 0, whiteSpace: 'nowrap' }}>
                        {N(matBuckets[yr] ?? 0)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ ...TD, paddingLeft: 0 }}>Thereafter</td>
                    <td style={{ ...TD, ...MONO, textAlign: 'right', paddingRight: 0, whiteSpace: 'nowrap' }}>
                      {N(matBuckets.thereafter ?? 0)}
                    </td>
                  </tr>
                  {/* Total */}
                  <tr>
                    <td style={{ padding: '0', borderTop: '1px solid #888', height: '4px', paddingLeft: 0 }} />
                    <td style={{ padding: '0', borderTop: '1px solid #888', height: '4px' }} />
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px 4px 0', fontWeight: 700 }}>Total</td>
                    <td style={{ ...MONO, textAlign: 'right', padding: '4px 0', fontWeight: 700,
                      borderBottom: '3px double #333', paddingRight: 0, whiteSpace: 'nowrap' }}>
                      {N(matTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── Interest expense ───────────────────────────────────────── */}
            <div>
              <p style={{ fontWeight: 700, marginBottom: '6px' }}>Interest expense</p>
              <p>
                Interest expense on long-term debt for the year ended {cyLabel} has been recorded in the
                statement of income and comprehensive income. Interest rates applicable to the above credit
                facilities ranged from <strong>{rateRange}</strong> per annum during the year.
              </p>
            </div>

            {/* ── Covenant disclosure (only if issues) ───────────────────── */}
            {issues.length > 0 && (
              <div>
                <p style={{ fontWeight: 700, marginBottom: '6px' }}>
                  Covenant {hasBreaches ? 'violations' : 'risk'}
                </p>

                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  padding: '8px 10px', background: '#fff8f0', border: '1px solid #f5c680',
                  borderRadius: '4px', marginBottom: '8px',
                }}>
                  <span style={{ fontSize: '12px', marginTop: '1px' }}>⚠</span>
                  <p style={{ color: '#7c4a00' }}>
                    {hasBreaches
                      ? 'One or more covenant violations exist as at the reporting date. This disclosure is required in the notes to the financial statements.'
                      : 'One or more covenants are at risk of non-compliance as at the reporting date.'}
                  </p>
                </div>

                <p style={{ marginBottom: '8px' }}>
                  Certain credit facilities are subject to financial maintenance covenants tested on a{' '}
                  {issues[0].frequency.toLowerCase()} basis.
                  {' '}As at {cyLabel}, the Company{' '}
                  {hasBreaches ? 'was not in compliance with' : 'identified risk of non-compliance with'}{' '}
                  the following financial covenants:
                </p>

                <table style={{ width: '100%', borderCollapse: 'collapse', ...docBase }}>
                  <thead>
                    <tr>
                      <th style={{ ...TH, textAlign: 'left', paddingLeft: 0 }}>Covenant</th>
                      <th style={{ ...TH, textAlign: 'left' }}>Lender</th>
                      <th style={{ ...TH, textAlign: 'right' }}>Required</th>
                      <th style={{ ...TH, textAlign: 'right' }}>Actual</th>
                      <th style={{ ...TH, textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map(c => {
                      const loan = allLoans.find(l => l.id === c.loanId);
                      const isBreached = c.status === 'Breached';
                      return (
                        <tr key={c.id}>
                          <td style={{ ...TD, paddingLeft: 0 }}>{c.name}</td>
                          <td style={{ ...TD }}>{loan?.lender ?? '—'}</td>
                          <td style={{ ...TD, ...MONO, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {c.threshold != null
                              ? `${c.operator ?? ''} ${c.threshold.toLocaleString('en-CA')}`
                              : '—'}
                          </td>
                          <td style={{ ...TD, ...MONO, textAlign: 'right', whiteSpace: 'nowrap',
                            color: isBreached ? '#b91c1c' : '#c2601a', fontWeight: 600 }}>
                            {c.currentValue != null ? c.currentValue.toLocaleString('en-CA') : '—'}
                          </td>
                          <td style={{ ...TD, textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '1px 7px',
                              borderRadius: '99px',
                              fontSize: '10px',
                              fontWeight: 700,
                              background: isBreached ? '#fee2e2' : '#fef3c7',
                              color:      isBreached ? '#b91c1c' : '#92400e',
                              border: `1px solid ${isBreached ? '#fca5a5' : '#fcd34d'}`,
                            }}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {hasBreaches && (
                  <p style={{ marginTop: '8px', fontStyle: 'italic' }}>
                    Management has obtained waivers from the applicable lenders with respect to the above covenant
                    violations as at {cyLabel}. The Company is actively working with its lenders to restore
                    compliance, and negotiations regarding revised covenant terms are ongoing.
                  </p>
                )}
              </div>
            )}

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <div style={{
              borderTop: '1px solid #ccc',
              paddingTop: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '9.5px',
              color: '#999',
            }}>
              <span>{client} · Notes to Financial Information · {cyLabel}</span>
              <span>Prepared by Long-term Debt Workpaper Tool · ASPE Part II</span>
            </div>

          </div>{/* end doc body */}
        </div>{/* end paper card */}

        {/* Workpaper banner below page */}
        <div className="max-w-[780px] mx-auto mt-3 flex items-center gap-2 print:hidden">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <p className="text-xs text-muted-foreground">
            This is a <strong>draft</strong> working-paper note. Amounts are sourced from the loan register,
            continuity roll-forward, and TB reconciliation. Review all figures before including in final
            financial statements.
          </p>
        </div>

      </div>{/* end page area */}
    </div>
  );
}
