// ─── Loan Amortization engine ────────────────────────────────────────────────
// Verified against CaseWare R4 (Fishin' Hole promissory note):
// 400,000 @ 4%, start 2024-10-01, first payment 2024-10-31, 96 monthly → 4,875.49,
// first interest 1,315.07 (ACT/365 stub), FY2025 close 356,687.18, total interest 68,047.04.

export type Frequency = "Monthly" | "Quarterly" | "Semi-annual" | "Annual" | "Bi-weekly" | "Weekly";

export const FREQ: Record<Frequency, { months?: number; days?: number; ppy: number }> = {
  Monthly: { months: 1, ppy: 12 },
  Quarterly: { months: 3, ppy: 4 },
  "Semi-annual": { months: 6, ppy: 2 },
  Annual: { months: 12, ppy: 1 },
  "Bi-weekly": { days: 14, ppy: 26 },
  Weekly: { days: 7, ppy: 52 },
};

const CPY: Record<string, number> = { Monthly: 12, Quarterly: 4, "Semi-annual": 2, Annual: 1, Daily: 365 };

export interface EngineInput {
  principal: number;
  annualRate: number;          // percent, e.g. 4
  tenureMonths: number;
  frequency: Frequency;
  compounding?: string;        // defaults to payment frequency
  dayCount?: string;           // ACT/365 | ACT/360 | 30/360 (stub period only)
  loanStartDate?: string;      // yyyy-mm-dd; if set, first period interest accrues by day count
  firstPaymentDate: string;    // yyyy-mm-dd
  paymentType: string;
  interestOnlyMonths?: number;
  fixedPayment?: number;
  balloon?: number;
}

export interface EngineRow {
  n: number; date: string; opening: number; payment: number;
  interest: number; principal: number; closing: number;
}

export const r2 = (x: number) => Math.round(x * 100) / 100;
export const parseISO = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
export const toISO = (d: Date) => d.toISOString().slice(0, 10);
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const isEOM = (d: Date) => d.getUTCDate() === lastDay(d.getUTCFullYear(), d.getUTCMonth());
export const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86400000);

/** Adds months anchored to the first payment's day; month-end stays month-end (no drift to the 28th). */
export function addMonthsAnchored(anchor: Date, k: number): Date {
  const m = anchor.getUTCMonth() + k;
  const ty = anchor.getUTCFullYear() + Math.floor(m / 12);
  const tm = ((m % 12) + 12) % 12;
  const ld = lastDay(ty, tm);
  return new Date(Date.UTC(ty, tm, isEOM(anchor) ? ld : Math.min(anchor.getUTCDate(), ld)));
}

export function paymentDate(first: Date, k: number, f: Frequency): Date {
  const cfg = FREQ[f];
  return cfg.months ? addMonthsAnchored(first, k * cfg.months) : new Date(first.getTime() + k * cfg.days! * 86400000);
}

export function paymentsCount(tenureMonths: number, f: Frequency): number {
  const cfg = FREQ[f];
  return cfg.months ? Math.floor(tenureMonths / cfg.months) : Math.round((tenureMonths * cfg.ppy) / 12);
}

/** Tenure implied by first payment → maturity (inclusive payment count × period length). */
export function impliedTenureMonths(firstPayment: string, maturity: string, f: Frequency): number | null {
  if (!firstPayment || !maturity) return null;
  const a = parseISO(firstPayment), b = parseISO(maturity);
  if (b < a) return null;
  let k = 0;
  while (k < 2000 && paymentDate(a, k + 1, f) <= b) k++;
  const count = k + 1;
  const cfg = FREQ[f];
  return cfg.months ? count * cfg.months : Math.round((count * 12) / cfg.ppy);
}

function stubYearFraction(start: Date, end: Date, dayCount = "ACT/365") {
  if (dayCount === "ACT/360") return daysBetween(start, end) / 360;
  if (dayCount === "30/360") {
    const d1 = Math.min(start.getUTCDate(), 30), d2 = Math.min(end.getUTCDate(), 30);
    return ((end.getUTCFullYear() - start.getUTCFullYear()) * 360 + (end.getUTCMonth() - start.getUTCMonth()) * 30 + (d2 - d1)) / 360;
  }
  return daysBetween(start, end) / 365;
}

export function buildAmortization(i: EngineInput): { payment: number; rows: EngineRow[] } {
  const cfg = FREQ[i.frequency];
  const nPay = paymentsCount(i.tenureMonths, i.frequency);
  if (!(i.principal > 0) || nPay <= 0 || !i.firstPaymentDate) return { payment: 0, rows: [] };

  const cpy = CPY[i.compounding || ""] || cfg.ppy;
  const rp = Math.pow(1 + i.annualRate / 100 / cpy, cpy / cfg.ppy) - 1;      // effective rate per payment period
  const ioPeriods = Math.min(nPay, cfg.months ? Math.floor((i.interestOnlyMonths || 0) / cfg.months)
                                              : Math.round(((i.interestOnlyMonths || 0) * cfg.ppy) / 12));
  const first = parseISO(i.firstPaymentDate);
  const start = i.loanStartDate ? parseISO(i.loanStartDate) : null;
  const P = i.principal, B = i.balloon || 0, am = nPay - ioPeriods;
  const stubFactor = start ? 1 + (i.annualRate / 100) * stubYearFraction(start, first, i.dayCount) : 1 + rp;

  let pmt: number;
  if (i.fixedPayment) pmt = i.fixedPayment;
  else if (am <= 0) pmt = 0;
  else if (rp === 0) pmt = r2((P - B) / am);
  else if (ioPeriods > 0) pmt = r2(((P - B * Math.pow(1 + rp, -am)) * rp) / (1 - Math.pow(1 + rp, -am)));
  else {
    // Solve so the schedule fully amortizes including the day-count first period (matches CaseWare)
    const v = Math.pow(1 + rp, -(am - 1));
    pmt = r2((P * stubFactor - B * v) / (1 + (1 - v) / rp));
  }

  const rows: EngineRow[] = [];
  let bal = P;
  for (let k = 0; k < nPay; k++) {
    const date = paymentDate(first, k, i.frequency);
    let interest = k === 0 && start ? r2(bal * (stubFactor - 1)) : r2(bal * rp);
    let pay: number, prin: number;
    const last = k === nPay - 1;
    if (i.paymentType === "Interest Only") { prin = last ? bal : 0; pay = r2(interest + prin); }
    else if (k < ioPeriods) { prin = 0; pay = interest; }
    else if (i.paymentType === "Principal + Interest") { prin = last ? bal : r2((P - B) / am); pay = r2(prin + interest); }
    else if (last) {
      prin = bal;
      if (!B && Math.abs(bal + interest - pmt) < 1) { pay = pmt; interest = r2(pmt - bal); } // rounding absorbed in last interest
      else pay = r2(bal + interest);
    } else { pay = pmt; prin = r2(Math.min(pay - interest, bal)); }
    const opening = bal;
    bal = r2(bal - prin);
    rows.push({ n: k + 1, date: toISO(date), opening, payment: pay, interest, principal: prin, closing: bal });
  }
  return { payment: pmt, rows };
}

export interface FiscalYearRow {
  label: string; yearEnd: string; principal: number; interest: number;
  closing: number; currentPortion: number; longTermPortion: number; accruedInterest: number;
}

/** Fiscal-year summary; fyeMonth is 1–12 (year ends on the last day of that month). */
export function fiscalSummary(rows: EngineRow[], i: EngineInput, fyeMonth: number): FiscalYearRow[] {
  if (!rows.length) return [];
  const fyeFor = (iso: string) => {
    const d = parseISO(iso);
    const y = d.getUTCMonth() + 1 > fyeMonth ? d.getUTCFullYear() + 1 : d.getUTCFullYear();
    return toISO(new Date(Date.UTC(y, fyeMonth, 0)));
  };
  const startISO = i.loanStartDate || rows[0].date;
  const ends: string[] = [];
  for (let e = fyeFor(startISO); e <= fyeFor(rows[rows.length - 1].date);) {
    ends.push(e);
    const d = parseISO(e);
    e = toISO(new Date(Date.UTC(d.getUTCFullYear() + 1, fyeMonth, 0)));
  }
  return ends.map((ye, idx) => {
    const prev = idx === 0 ? "0000-00-00" : ends[idx - 1];
    const inYear = rows.filter(r => r.date > prev && r.date <= ye);
    const paidToDate = rows.filter(r => r.date <= ye);
    const closing = paidToDate.length ? paidToDate[paidToDate.length - 1].closing : i.principal;
    const nextYe = toISO(new Date(Date.UTC(parseISO(ye).getUTCFullYear() + 1, fyeMonth, 0)));
    const current = r2(rows.filter(r => r.date > ye && r.date <= nextYe).reduce((a, r) => a + r.principal, 0));
    const lastPaid = paidToDate.length ? paidToDate[paidToDate.length - 1].date : startISO;
    const accrued = closing > 0 ? r2(closing * (i.annualRate / 100) * daysBetween(parseISO(lastPaid), parseISO(ye)) / 365) : 0;
    return {
      label: `FY${parseISO(ye).getUTCFullYear()}`, yearEnd: ye,
      principal: r2(inYear.reduce((a, r) => a + r.principal, 0)),
      interest: r2(inYear.reduce((a, r) => a + r.interest, 0)),
      closing, currentPortion: current, longTermPortion: r2(closing - current), accruedInterest: Math.max(0, accrued),
    };
  });
}
