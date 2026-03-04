import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Loan, AmortizationRow, DayCountBasis, Currency, JEProposal, ActivityItem, ReconciliationItem, Covenant } from '../types';

// ─── CLASSNAMES ───────────────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── FORMATTERS ───────────────────────────────────────────────────────────────
export function fmtCurrency(value: number, currency: Currency = 'CAD', compact = false): string {
  const prefix = currency === 'CAD' ? '$' : currency === 'USD' ? 'US$' : currency + '$';
  if (compact && Math.abs(value) >= 1_000_000) {
    return `${prefix}${(value / 1_000_000).toFixed(2)}M`;
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `${prefix}${(value / 1_000).toFixed(0)}K`;
  }
  return `${prefix}${value.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function fmtPct(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function fmtDate(dateStr: string): string {
  if (!dateStr) return '—';
  return dateStr; // already YYYY-MM-DD
}

export function fmtDateDisplay(dateStr: string): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

export function fmtNumber(value: number, decimals = 0): string {
  return value.toLocaleString('en-CA', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fmtVariance(value: number, currency: Currency = 'CAD'): string {
  if (value === 0) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${fmtCurrency(value, currency)}`;
}

// ─── DATE CALCULATIONS ────────────────────────────────────────────────────────
export function daysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

export function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function addYears(dateStr: string, years: number): string {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

export function monthDiff(startStr: string, endStr: string): number {
  const start = new Date(startStr);
  const end = new Date(endStr);
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

export function formatPeriod(period: string): string {
  const [y, m] = period.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m) - 1]} ${y}`;
}

// ─── INTEREST CALCULATIONS ────────────────────────────────────────────────────
export function calcInterest(
  balance: number,
  annualRate: number, // as percentage e.g. 5.25
  startDateStr: string,
  endDateStr: string,
  dayCountBasis: DayCountBasis
): number {
  const rate = annualRate / 100;
  if (dayCountBasis === '30/360') {
    return balance * rate / 12;
  } else if (dayCountBasis === 'ACT/365') {
    const days = daysBetween(startDateStr, endDateStr);
    return balance * rate * days / 365;
  } else { // ACT/360
    const days = daysBetween(startDateStr, endDateStr);
    return balance * rate * days / 360;
  }
}

export function calcAccruedInterest(
  loan: Loan,
  yearEndDate: string
): number {
  const lastPayment = loan.lastPaymentDate || loan.startDate;
  return calcInterest(loan.currentBalance, loan.rate, lastPayment, yearEndDate, loan.dayCountBasis);
}

// ─── AMORTIZATION ENGINE ──────────────────────────────────────────────────────
export function generateAmortizationSchedule(loan: Loan): AmortizationRow[] {
  if (loan.type === 'LOC' || loan.paymentType === 'Interest-only') {
    return generateInterestOnlySchedule(loan);
  }
  return generatePISchedule(loan);
}

function generatePISchedule(loan: Loan): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  let balance = loan.currentBalance;
  const rate = loan.rate / 100;
  const monthlyRate = rate / 12;
  const startDate = loan.maturityDate;

  const remainingMonths = monthDiff(new Date().toISOString().slice(0, 10), loan.maturityDate);
  if (remainingMonths <= 0) return [];

  const payment = monthlyRate > 0
    ? balance * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths) / (Math.pow(1 + monthlyRate, remainingMonths) - 1)
    : balance / remainingMonths;

  let currentPeriodStart = new Date().toISOString().slice(0, 7) + '-01';

  for (let i = 0; i < Math.min(remainingMonths, 120); i++) {
    const periodEnd = addMonths(currentPeriodStart, 1);
    let interest: number;

    if (loan.dayCountBasis === '30/360') {
      interest = balance * rate / 12;
    } else {
      const daysInPeriod = daysBetween(currentPeriodStart, periodEnd);
      interest = balance * rate * daysInPeriod / (loan.dayCountBasis === 'ACT/360' ? 360 : 365);
    }

    const principal = Math.min(payment - interest, balance);
    const endingBalance = Math.max(0, balance - principal);

    rows.push({
      id: `gen-${loan.id}-${i}`,
      loanId: loan.id,
      periodDate: periodEnd,
      openingBalance: Math.round(balance * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      payment: Math.round((interest + principal) * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      endingBalance: Math.round(endingBalance * 100) / 100,
    });

    balance = endingBalance;
    currentPeriodStart = periodEnd;
    if (balance < 0.01) break;
  }
  return rows;
}

function generateInterestOnlySchedule(loan: Loan): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  const balance = loan.currentBalance;
  const rate = loan.rate / 100;
  const remainingMonths = Math.max(0, monthDiff(new Date().toISOString().slice(0, 10), loan.maturityDate));

  let currentPeriodStart = new Date().toISOString().slice(0, 7) + '-01';

  for (let i = 0; i < Math.min(remainingMonths, 24); i++) {
    const periodEnd = addMonths(currentPeriodStart, 1);
    const daysInPeriod = daysBetween(currentPeriodStart, periodEnd);
    const interest = loan.dayCountBasis === '30/360'
      ? balance * rate / 12
      : balance * rate * daysInPeriod / 365;

    rows.push({
      id: `gen-${loan.id}-${i}`,
      loanId: loan.id,
      periodDate: periodEnd,
      openingBalance: balance,
      interest: Math.round(interest * 100) / 100,
      payment: Math.round(interest * 100) / 100,
      principal: 0,
      endingBalance: balance,
    });
    currentPeriodStart = periodEnd;
  }
  return rows;
}

// ─── CURRENT PORTION ──────────────────────────────────────────────────────────
export function calcCurrentPortion(schedule: AmortizationRow[], yearEndDate: string): number {
  const nextYear = addYears(yearEndDate, 1);
  return schedule
    .filter(r => r.periodDate > yearEndDate && r.periodDate <= nextYear)
    .reduce((sum, r) => sum + r.principal, 0);
}

// ─── MATURITY LADDER ──────────────────────────────────────────────────────────
export interface MaturityBucket {
  label: string;
  amount: number;
  loans: { loanId: string; name: string; amount: number }[];
}

export function buildMaturityLadder(
  loans: Loan[],
  schedules: AmortizationRow[],
  yearEndDate: string
): MaturityBucket[] {
  const buckets: MaturityBucket[] = [
    { label: '< 1 Year', amount: 0, loans: [] },
    { label: '1–2 Years', amount: 0, loans: [] },
    { label: '2–3 Years', amount: 0, loans: [] },
    { label: '3–5 Years', amount: 0, loans: [] },
    { label: '> 5 Years', amount: 0, loans: [] },
  ];

  const getBucket = (dateStr: string): number => {
    const months = monthDiff(yearEndDate, dateStr);
    if (months <= 12) return 0;
    if (months <= 24) return 1;
    if (months <= 36) return 2;
    if (months <= 60) return 3;
    return 4;
  };

  for (const loan of loans) {
    const loanSchedule = schedules.filter(s => s.loanId === loan.id);
    const loanBuckets: Record<number, number> = {};

    for (const row of loanSchedule) {
      if (row.periodDate > yearEndDate && row.principal > 0) {
        const b = getBucket(row.periodDate);
        loanBuckets[b] = (loanBuckets[b] || 0) + row.principal;
      }
    }

    for (const [bi, amount] of Object.entries(loanBuckets)) {
      const bucket = buckets[parseInt(bi)];
      bucket.amount += amount;
      const existing = bucket.loans.find(l => l.loanId === loan.id);
      if (existing) existing.amount += amount;
      else bucket.loans.push({ loanId: loan.id, name: loan.name, amount });
    }
  }

  return buckets;
}

// ─── EXCEL EXPORT ─────────────────────────────────────────────────────────────
export async function exportToExcel(data: Record<string, unknown[][]>, filename: string) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  for (const [sheetName, rows] of Object.entries(data)) {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  }
  XLSX.writeFile(wb, filename);
}

export function buildLoanRegisterExport(loans: Loan[]): unknown[][] {
  const headers = ['Ref #', 'Loan Name', 'Lender', 'Type', 'CCY', 'Original', 'Current Balance', 'Rate', 'Day Count', 'Start', 'Maturity', 'Payment', 'Status', 'GL Principal', 'Current Portion', 'LT Portion', 'Accrued Interest'];
  const rows = loans.map(l => [
    l.refNumber, l.name, l.lender, l.type, l.currency,
    l.originalPrincipal, l.currentBalance, l.rate + '%', l.dayCountBasis,
    l.startDate, l.maturityDate, l.paymentType, l.status, l.glPrincipalAccount,
    l.currentPortion, l.longTermPortion, l.accruedInterest,
  ]);
  return [headers, ...rows];
}

export function buildAmortizationExport(rows: AmortizationRow[], loanName: string): unknown[][] {
  const headers = [`${loanName} — Amortization Schedule`, '', '', '', '', ''];
  const cols = ['Period Date', 'Opening Balance', 'Interest', 'Payment', 'Principal', 'Ending Balance'];
  const data = rows.map(r => [r.periodDate, r.openingBalance, r.interest, r.payment, r.principal, r.endingBalance]);
  return [headers, cols, ...data];
}

export function buildJEExport(jes: JEProposal[]): unknown[][] {
  const headers = ['JE #', 'Type', 'Description', 'Account', 'Debit', 'Credit', 'Status'];
  const rows: unknown[][] = [];
  for (const je of jes) {
    for (const line of je.lines) {
      rows.push([je.id, je.type, je.description, line.account, line.debit || '', line.credit || '', je.status]);
    }
  }
  return [headers, ...rows];
}

export function buildActivityExport(activities: ActivityItem[], loans: Loan[]): unknown[][] {
  const headers = ['Date', 'Loan', 'Description', 'Total Amount', 'Type', 'Principal', 'Interest', 'Fees', 'Status', 'Source Ref'];
  const rows = activities.map(a => {
    const loan = loans.find(l => l.id === a.loanId);
    return [
      a.date, loan?.name || a.loanId, a.description, a.totalAmount,
      a.type, a.principalAmount ?? '', a.interestAmount ?? '', a.feesAmount ?? '',
      a.status, a.sourceRef ?? '',
    ];
  });
  return [headers, ...rows];
}

export function buildReconciliationExport(reconciliation: ReconciliationItem[], loans: Loan[]): unknown[][] {
  const headers = ['Loan', 'Account', 'Type', 'Subledger Balance', 'TB Balance', 'Variance', 'Currency', 'Status', 'Notes', 'Override Reason'];
  const rows = reconciliation.map(r => {
    const loan = loans.find(l => l.id === r.loanId);
    return [
      loan?.name || r.loanId, r.account, r.accountType,
      r.subledgerBalance, r.tbBalance, r.variance, r.currency, r.status,
      r.notes ?? '', r.overrideReason ?? '',
    ];
  });
  return [headers, ...rows];
}

export function buildCovenantsExport(covenants: Covenant[], loans: Loan[]): unknown[][] {
  const headers = ['Loan', 'Covenant', 'Type', 'Operator', 'Threshold', 'Current Value', 'Projected Value', 'Status', 'Frequency', 'Last Tested', 'Headroom', 'Description'];
  const rows = covenants.map(c => {
    const loan = loans.find(l => l.covenantIds?.includes(c.id));
    const headroom = c.currentValue !== undefined && c.threshold
      ? (c.operator === '>=' || c.operator === '>')
        ? ((c.currentValue / c.threshold - 1) * 100).toFixed(1) + '%'
        : ((c.threshold / c.currentValue - 1) * 100).toFixed(1) + '%'
      : '';
    return [
      loan?.name || '', c.name, c.type, c.operator ?? '', c.threshold ?? '',
      c.currentValue ?? '', c.projectedValue ?? '', c.status,
      c.frequency, c.lastTested ?? '', headroom, c.description,
    ];
  });
  return [headers, ...rows];
}

export function buildDashboardExport(
  loans: Loan[],
  covenants: Covenant[],
  kpis: { label: string; value: string; sub: string }[],
): Record<string, unknown[][]> {
  const kpiRows: unknown[][] = [
    ['KPI', 'Value', 'Detail'],
    ...kpis.map(k => [k.label, k.value, k.sub]),
  ];
  const loanRows = buildLoanRegisterExport(loans.filter(l => l.status === 'Active'));
  const covRows  = buildCovenantsExport(covenants, loans);
  return {
    'KPI Summary':    kpiRows,
    'Active Loans':   loanRows,
    'Covenants':      covRows,
  };
}
