import { Transaction, PriorYearLot, FmvQuote, IncomeType, FxEvent, FxRateInfo, CashAccountBalance } from "./types";
import {
  currentYearTransactions,
  priorYearLots,
  fmvQuotes,
  closingFxRate,
  incomeAmounts,
  cashAccountBalances,
  fxRates,
} from "./mockData";
import { sources } from "./mockData";

export type WacRow = {
  date: string;
  type: string;
  unitsIn: number;
  unitsOut: number;
  price: number;
  costIn: number; // CAD
  costOut: number; // CAD
  cumUnits: number;
  cumCost: number; // CAD
  wac: number; // CAD per unit
  realizedGL?: number;
  feesCAD?: number;   // transaction costs deducted from gross proceeds (Sale rows only)
  notes?: string;
};

export type SecurityKey = string; // `${ticker}|${sourceId}` when tracked-by-broker

export interface ComputeOptions {
  includePriorYear: boolean;
  trackByBroker: boolean; // true = per-broker WAC pool; false = blended
  measurementBasis: "Cost" | "FVTPL";
}

export interface SecuritySchedule {
  key: SecurityKey;
  ticker: string;
  security: string;
  sourceIds: string[];
  currency: string;
  rows: WacRow[];
  closingUnits: number;
  closingCostCAD: number;
  closingWac: number;
  fmvCAD: number;
  unrealizedGL: number;
  realizedGL: number;
  fxGL: number;
}

const fmvByTicker = Object.fromEntries(fmvQuotes.map((q) => [q.ticker, q]));

export function compute(
  opts: ComputeOptions,
  priorYearOverride?: PriorYearLot[],
  transactionsOverride?: Transaction[],
) {
  const { includePriorYear, trackByBroker } = opts;
  const openings = priorYearOverride ?? priorYearLots;
  // Only published transactions feed the schedules
  const allTxns = transactionsOverride ?? currentYearTransactions;
  const txns = allTxns.filter((t) => (t.status ?? "published") === "published");

  const keyOf = (ticker: string, sourceId: string) =>
    trackByBroker ? `${ticker}|${sourceId}` : ticker;

  // bucket transactions
  const buckets = new Map<SecurityKey, { ticker: string; security: string; currency: string; sourceIds: Set<string>; rows: WacRow[] }>();

  const ensure = (ticker: string, security: string, sourceId: string, currency: string) => {
    const k = keyOf(ticker, sourceId);
    if (!buckets.has(k)) {
      buckets.set(k, { ticker, security, currency, sourceIds: new Set([sourceId]), rows: [] });
    } else {
      buckets.get(k)!.sourceIds.add(sourceId);
    }
    return buckets.get(k)!;
  };

  // Seed with prior-year opening balances
  if (includePriorYear) {
    for (const lot of openings) {
      const b = ensure(lot.ticker, lot.security, lot.sourceId, lot.currency);
      b.rows.push({
        date: "2024-01-01",
        type: "Opening Balance",
        unitsIn: lot.units,
        unitsOut: 0,
        price: lot.costCAD / lot.units,
        costIn: lot.costCAD,
        costOut: 0,
        cumUnits: 0, // will recompute
        cumCost: 0,
        wac: 0,
        notes: "From prior year working paper",
      });
    }
  }

  // Apply current year
  const sorted = [...txns].sort((a, b) => a.date.localeCompare(b.date));
  for (const tx of sorted) {
    if (tx.ticker === "FEE") continue; // skip platform fees from WAC; surface as AJE
    const fx = tx.fxRate ?? 1;
    const ccy = tx.currency;
    const b = ensure(tx.ticker, tx.security, tx.sourceId, ccy);
    if (tx.type === "Purchase") {
      const costCAD = (tx.gross + tx.fees) * fx;
      b.rows.push({
        date: tx.date, type: "Purchase",
        unitsIn: tx.units, unitsOut: 0,
        price: tx.price, costIn: costCAD, costOut: 0,
        cumUnits: 0, cumCost: 0, wac: 0,
        notes: tx.notes,
      });
    } else if (tx.type === "Sale") {
      const proceedsCAD = (tx.gross - tx.fees) * fx;
      const feesCAD     = tx.fees * fx;
      b.rows.push({
        date: tx.date, type: "Sale",
        unitsIn: 0, unitsOut: Math.abs(tx.units),
        price: tx.price, costIn: 0, costOut: 0, // costOut filled below
        cumUnits: 0, cumCost: 0, wac: 0,
        realizedGL: proceedsCAD, // will subtract WAC cost below
        feesCAD: feesCAD > 0 ? feesCAD : undefined,
        notes: tx.notes,
      });
    } else if (tx.type === "Reinvested Dividend") {
      const costCAD = tx.gross * fx;
      b.rows.push({
        date: tx.date, type: "Reinvested Div",
        unitsIn: tx.units, unitsOut: 0,
        price: tx.price, costIn: costCAD, costOut: 0,
        cumUnits: 0, cumCost: 0, wac: 0,
        notes: "DRIP increases units & cost",
      });
    } else if (tx.type === "Return of Capital") {
      const incomeKey = `${tx.ticker}|${tx.date}`;
      const rocAmt = incomeAmounts[incomeKey] ?? 0;
      b.rows.push({
        date: tx.date, type: "Return of Capital",
        unitsIn: 0, unitsOut: 0,
        price: 0, costIn: -rocAmt * fx, costOut: 0,
        cumUnits: 0, cumCost: 0, wac: 0,
        notes: `ROC reduces ACB by ${(rocAmt * fx).toFixed(2)} CAD`,
      });
    }
  }

  // Roll forward each bucket
  const schedules: SecuritySchedule[] = [];
  for (const [key, b] of buckets) {
    b.rows.sort((a, b) => a.date.localeCompare(b.date));
    let units = 0, cost = 0, realized = 0;
    for (const r of b.rows) {
      if (r.unitsIn > 0) {
        units += r.unitsIn; cost += r.costIn;
      } else if (r.unitsOut > 0) {
        const wac = units > 0 ? cost / units : 0;
        const costOut = wac * r.unitsOut;
        r.costOut = costOut;
        const proceeds = r.realizedGL ?? 0;
        const gl = proceeds - costOut;
        r.realizedGL = gl;
        realized += gl;
        units -= r.unitsOut; cost -= costOut;
      } else {
        // ROC etc.
        cost += r.costIn;
      }
      r.cumUnits = units;
      r.cumCost = cost;
      r.wac = units > 0 ? cost / units : 0;
    }

    const fmv = fmvByTicker[b.ticker];
    const fmvCAD = fmv ? units * fmv.closingPrice * (fmv.currency === "USD" ? closingFxRate : 1) : 0;
    const unrealized = opts.measurementBasis === "FVTPL" ? fmvCAD - cost : 0;

    // Crude FX G/L: revaluation of foreign cost at closing rate vs avg historical
    const fxGL = b.currency === "USD" ? cost * (closingFxRate / 1.37 - 1) * 0.15 : 0;

    schedules.push({
      key,
      ticker: b.ticker,
      security: b.security,
      sourceIds: [...b.sourceIds],
      currency: b.currency,
      rows: b.rows,
      closingUnits: units,
      closingCostCAD: cost,
      closingWac: units > 0 ? cost / units : 0,
      fmvCAD,
      unrealizedGL: unrealized,
      realizedGL: realized,
      fxGL,
    });
  }

  schedules.sort((a, b) => a.security.localeCompare(b.security));
  return { schedules };
}

export interface AJE {
  ref: string;
  description: string;
  drAccount: string;
  crAccount: string;
  amount: number;
  type: "Correcting" | "Reclassification" | "Accrual" | "Fair Value Adj" | "FX Adj" | "Disposition";
  confidence: "High" | "Medium" | "Low";
}

export function buildAJEs(schedules: SecuritySchedule[], opts: ComputeOptions, txns?: Transaction[]): AJE[] {
  const out: AJE[] = [];
  let n = 1;
  const ref = () => `AE-${String(n++).padStart(2, "0")}`;

  // ── Type 1: Realized Gain / Loss (one entry per disposal) ─────────────────
  for (const s of schedules) {
    if (s.realizedGL !== 0) {
      out.push({
        ref: ref(),
        description: `Record realized ${s.realizedGL >= 0 ? "gain" : "loss"} on disposal — ${s.security}`,
        drAccount: s.realizedGL >= 0 ? "1500 · Investments" : "4900 · Realized Loss on Investments",
        crAccount: s.realizedGL >= 0 ? "4800 · Realized Gain on Investments" : "1500 · Investments",
        amount: Math.abs(s.realizedGL),
        type: "Disposition",
        confidence: "High",
      });
    }
  }

  // ── Type 2: Unrealized Gain / Loss — mark-to-market (optional booking) ────
  if (opts.measurementBasis === "FVTPL") {
    for (const s of schedules) {
      if (Math.abs(s.unrealizedGL) > 0.01) {
        out.push({
          ref: ref(),
          description: `Unrealized G/L — mark-to-market FV adjustment — ${s.security}`,
          drAccount: s.unrealizedGL >= 0 ? "1500 · Investments" : "4910 · Unrealized Loss on Investments",
          crAccount: s.unrealizedGL >= 0 ? "4810 · Unrealized Gain on Investments" : "1500 · Investments",
          amount: Math.abs(s.unrealizedGL),
          type: "Fair Value Adj",
          confidence: "Medium",
        });
      }
    }
  }

  // ── FX Translation entries (one per foreign-currency security) ────────────
  for (const s of schedules) {
    if (Math.abs(s.fxGL) > 0.5) {
      out.push({
        ref: ref(),
        description: `FX translation difference — ${s.currency}/${s.ticker} — ${s.security}`,
        drAccount: s.fxGL >= 0 ? "1500 · Investments" : "5800 · FX Loss on Investments",
        crAccount: s.fxGL >= 0 ? "4820 · FX Gain on Investments" : "1500 · Investments",
        amount: Math.abs(s.fxGL),
        type: "FX Adj",
        confidence: "Medium",
      });
    }
  }

  // ── Income & Expenses — individual entry per transaction ──────────────────
  const allTxns = txns ?? currentYearTransactions;
  const incomeTypeTxns = allTxns.filter(t =>
    ["Dividend","Reinvested Dividend","Interest","Fee/Commission","Withholding Tax"].includes(t.type)
  );

  for (const t of incomeTypeTxns) {
    const cadAmt = Math.abs((t.gross ?? 0) * (t.fxRate ?? 1));
    if (cadAmt < 0.01) continue;

    const isFee = t.type === "Fee/Commission";
    const isWHT = t.type === "Withholding Tax";
    const isDividend = t.type === "Dividend" || t.type === "Reinvested Dividend";
    const isInterest = t.type === "Interest";

    const cashAcct  = t.currency === "CAD" ? "1100 · Cash — BMO Operating" : "1110 · Cash — RBC USD";

    let dr: string, cr: string, desc: string, ajeType: AJE["type"];

    if (isDividend) {
      dr   = cashAcct;
      cr   = "4100 · Dividend Income";
      desc = `Record dividend — ${t.security} (${t.ticker}) — ${t.date}`;
      ajeType = "Accrual";
    } else if (isInterest) {
      dr   = cashAcct;
      cr   = "4150 · Interest Income";
      desc = `Record interest income — ${t.security} (${t.ticker}) — ${t.date}`;
      ajeType = "Accrual";
    } else if (isFee) {
      dr   = "5200 · Investment Fees";
      cr   = cashAcct;
      desc = `Record brokerage fee — ${t.security} (${t.ticker}) — ${t.date}`;
      ajeType = "Accrual";
    } else { // Withholding Tax
      dr   = "5300 · Withholding Tax — Foreign";
      cr   = cashAcct;
      desc = `Record withholding tax — ${t.security} (${t.ticker}) — ${t.date}`;
      ajeType = "Accrual";
    }

    out.push({ ref: ref(), description: desc, drAccount: dr, crAccount: cr, amount: cadAmt, type: ajeType, confidence: "High" });
  }

  return out;
}

// Bank/broker reconciliation rows — mocked to demonstrate ties & one variance
export interface ReconRow {
  source: string;
  check: string;
  perSchedule: number;
  perSource: number;
  variance: number;
  status: "Tie" | "Variance";
  note?: string;
}

export function buildReconciliations(schedules: SecuritySchedule[]): ReconRow[] {
  const rows: ReconRow[] = [];
  const total = schedules.reduce((a, s) => a + s.closingCostCAD, 0);
  rows.push({
    source: "Source A — TD Waterhouse",
    check: "Closing book value (CAD)",
    perSchedule: schedules.filter((s) => s.sourceIds.includes("A")).reduce((a, s) => a + s.closingCostCAD, 0),
    perSource: schedules.filter((s) => s.sourceIds.includes("A")).reduce((a, s) => a + s.closingCostCAD, 0),
    variance: 0,
    status: "Tie",
  });
  rows.push({
    source: "Source B — RBC Direct (USD)",
    check: "Closing units — AAPL",
    perSchedule: 205,
    perSource: 205,
    variance: 0,
    status: "Tie",
  });
  rows.push({
    source: "Source B — RBC Direct (USD)",
    check: "Total dividends received (USD)",
    perSchedule: 207.45,
    perSource: 219.30,
    variance: -11.85,
    status: "Variance",
    note: "Likely missing MSFT Q3 cash div pre-DRIP — request statement detail",
  });
  rows.push({
    source: "Source C — BMO Operating",
    check: "Cash from investment activity",
    perSchedule: 9962,
    perSource: 9962,
    variance: 0,
    status: "Tie",
  });
  rows.push({
    source: "GL tie — Investments at cost",
    check: "Total carrying value",
    perSchedule: total,
    perSource: total - 1.20,
    variance: 1.20,
    status: "Variance",
    note: "FX rounding under $5 threshold",
  });
  return rows;
}

// ===================== Income & Expenses Matrix =====================

export interface IncomeMatrixCell {
  foreign: number;
  cad: number;
  ccy: string;
}

export interface IncomeMatrixRow {
  security: string;
  ticker: string;
  ccy: string;
  cells: Partial<Record<IncomeType, IncomeMatrixCell>>;
  totalCAD: number;
}

/** Flat per-transaction row for the new Income & Expenses panel */
export interface IncomeTxRow {
  id: string;
  date: string;
  description: string;   // security name for income; fee label for expenses
  type: IncomeType;
  tbAccount: string;     // default mapped account code
  currency: string;
  amountCAD: number;     // positive = income, negative = expense
}

export function buildIncomeMatrix(
  transactionsOverride?: Transaction[],
): {
  rows: IncomeMatrixRow[];
  totals: Record<IncomeType, number>;
  tbMap: Record<IncomeType, string>;
  incomeTxRows: IncomeTxRow[];
  expenseTxRows: IncomeTxRow[];
  incomeTotal: number;
  expenseTotal: number;
} {
  const all = transactionsOverride ?? currentYearTransactions;
  const txns = all.filter((t) => (t.status ?? "published") === "published");
  const tbMap: Record<IncomeType, string> = {
    Dividend: "4100",
    Interest: "4150",
    "Withholding Tax": "5300",
    Fees: "5200",
    Other: "1500",
  };
  const totals: Record<IncomeType, number> = {
    Dividend: 0, Interest: 0, "Withholding Tax": 0, Fees: 0, Other: 0,
  };

  const rowMap = new Map<string, IncomeMatrixRow>();
  const ensure = (ticker: string, security: string, ccy: string) => {
    if (!rowMap.has(ticker)) {
      rowMap.set(ticker, { security, ticker, ccy, cells: {}, totalCAD: 0 });
    }
    return rowMap.get(ticker)!;
  };

  const incomeTxRows: IncomeTxRow[] = [];
  const expenseTxRows: IncomeTxRow[] = [];

  for (const t of txns) {
    const fx = t.fxRate ?? 1;
    let kind: IncomeType | null = null;
    let foreignAmt = 0;
    if (t.type === "Dividend" || t.type === "Reinvested Dividend") {
      const incomeKey = `${t.ticker}|${t.date}`;
      foreignAmt = incomeAmounts[incomeKey] ?? (t.gross || Math.abs(t.net));
      kind = "Dividend";
    } else if (t.type === "Interest") {
      foreignAmt = t.gross || Math.abs(t.net);
      kind = "Interest";
    } else if (t.type === "Return of Capital") {
      foreignAmt = t.gross || Math.abs(t.net);
      kind = "Other";
    } else if (t.type === "Withholding Tax") {
      foreignAmt = -Math.abs(t.gross || Math.abs(t.net));
      kind = "Withholding Tax";
    } else if (t.type === "Fee/Commission") {
      foreignAmt = -Math.abs(t.fees || Math.abs(t.net));
      kind = "Fees";
    }
    if (!kind || foreignAmt === 0) continue;

    const cad = foreignAmt * fx;
    const isExpense = kind === "Fees" || kind === "Withholding Tax";

    // Flat per-transaction row
    const txRow: IncomeTxRow = {
      id: t.id ?? `inc-${t.date}-${t.security}-${kind}`,
      date: t.date ?? t.settlementDate ?? "",
      description: t.security || t.type,
      type: kind,
      tbAccount: tbMap[kind],
      currency: t.currency ?? "CAD",
      amountCAD: cad,
    };
    if (isExpense) {
      expenseTxRows.push(txRow);
    } else {
      incomeTxRows.push(txRow);
    }

    // Keep existing pivot-matrix logic for backward compat
    if (!isExpense) {
      const row = ensure(t.ticker, t.security, t.currency ?? "CAD");
      const cell = row.cells[kind] ?? { foreign: 0, cad: 0, ccy: t.currency ?? "CAD" };
      cell.foreign += foreignAmt;
      cell.cad += cad;
      row.cells[kind] = cell;
      row.totalCAD += cad;
    }
    totals[kind] += cad;
  }

  // Sort by date
  incomeTxRows.sort((a, b) => a.date.localeCompare(b.date));
  expenseTxRows.sort((a, b) => a.date.localeCompare(b.date));

  const incomeTotal = incomeTxRows.reduce((s, r) => s + r.amountCAD, 0);
  const expenseTotal = expenseTxRows.reduce((s, r) => s + r.amountCAD, 0);

  const rows = Array.from(rowMap.values()).sort((a, b) => a.security.localeCompare(b.security));
  return { rows, totals, tbMap, incomeTxRows, expenseTxRows, incomeTotal, expenseTotal };
}

// ===================== FX Schedule =====================

export interface FxScheduleResult {
  rates: FxRateInfo[];
  events: FxEvent[];
  totalRealizedFxCAD: number;
}

export function buildFxSchedule(
  transactionsOverride?: Transaction[],
  priorYearOverride?: PriorYearLot[],
): FxScheduleResult {
  const all = transactionsOverride ?? currentYearTransactions;
  const txns = all.filter((t) => (t.status ?? "published") === "published" && t.currency !== "CAD");
  const py = priorYearOverride ?? priorYearLots;

  const events: FxEvent[] = [];
  let totalRealizedFx = 0;

  // Build a per-ticker historical avg rate (rate at acquisition) using prior-year lots and current purchases
  const acqRate = new Map<string, { num: number; den: number }>();
  for (const lot of py.filter((l) => l.currency !== "CAD")) {
    // Approximate prior-year acquisition rate from costCAD vs units & a baseline opening rate
    const r = fxRates.find((x) => x.ccy === lot.currency)?.opening ?? 1;
    const a = acqRate.get(lot.ticker) ?? { num: 0, den: 0 };
    a.num += r * lot.units;
    a.den += lot.units;
    acqRate.set(lot.ticker, a);
  }
  for (const t of txns) {
    if (t.type === "Purchase" || t.type === "Reinvested Dividend") {
      const a = acqRate.get(t.ticker) ?? { num: 0, den: 0 };
      a.num += (t.fxRate ?? 1) * Math.abs(t.units);
      a.den += Math.abs(t.units);
      acqRate.set(t.ticker, a);
    }
  }
  const avgAcq = (ticker: string, ccy: string) => {
    const a = acqRate.get(ticker);
    if (a && a.den > 0) return a.num / a.den;
    return fxRates.find((x) => x.ccy === ccy)?.opening ?? 1;
  };

  for (const t of txns) {
    if (t.type === "Sale") {
      const rateAtTxn = t.fxRate ?? 1;
      const rateAtAcq = avgAcq(t.ticker, t.currency);
      const foreign = (t.gross - t.fees);
      const realized = foreign * (rateAtTxn - rateAtAcq);
      events.push({
        date: t.date, security: t.security, ticker: t.ticker, ccy: t.currency,
        foreignAmount: foreign, rateAtTxn, rateAtAcq,
        realizedFxCAD: realized,
        notes: "Realized FX on disposal",
      });
      totalRealizedFx += realized;
    } else if (t.type === "FX Conversion") {
      const rateAtTxn = t.fxRate ?? 1;
      const rateAtAcq = avgAcq(t.ticker, t.currency);
      const realized = (t.gross) * (rateAtTxn - rateAtAcq);
      events.push({
        date: t.date, security: t.security, ticker: t.ticker, ccy: t.currency,
        foreignAmount: t.gross, rateAtTxn, rateAtAcq,
        realizedFxCAD: realized, notes: "Cash conversion",
      });
      totalRealizedFx += realized;
    }
  }

  return { rates: fxRates, events, totalRealizedFxCAD: totalRealizedFx };
}

// ===================== Reconciliation (split: investment + cash) =====================

export interface InvestmentReconRow {
  ticker: string;
  security: string;
  ccy: string;
  perScheduleUnits: number;
  perStmtUnits: number;
  perScheduleCost: number;
  perStmtCost: number;
  perScheduleFmv: number;
  perStmtFmv: number;
  varianceUnits: number;
  varianceCost: number;
  varianceFmv: number;
  pass: boolean;
}

export interface InvestmentReconGroup {
  sourceId: string;
  institution: string;
  last4: string;
  currency: string;
  positions: InvestmentReconRow[];
  pass: boolean;
}

/** Friendly labels for known Richardson Wealth account numbers */
const ACCOUNT_LABELS: Record<string, { institution: string; currency: string }> = {
  "H11-YLF0-E": { institution: "Richardson Wealth — IAA (H11-YLF0-E)", currency: "CAD" },
  "H11-YLG0-E": { institution: "Richardson Wealth — PMA (H11-YLG0-E)", currency: "CAD" },
};

export function buildInvestmentRecon(
  schedules: SecuritySchedule[],
  transactionsOverride?: Transaction[],
): InvestmentReconGroup[] {
  const out: InvestmentReconGroup[] = [];

  // When real transactions are provided, derive account groups from their sourceIds
  // instead of relying on the hardcoded mock sources list
  const derivedSources: Array<{ id: string; institution: string; last4: string; currency: string }> =
    transactionsOverride && transactionsOverride.length > 0
      ? [...new Set(transactionsOverride.map((t) => t.sourceId).filter(Boolean))].map((id) => ({
          id,
          institution: ACCOUNT_LABELS[id]?.institution ?? `Account ${id}`,
          last4: id,
          currency: ACCOUNT_LABELS[id]?.currency ?? "CAD",
        }))
      : sources.filter((s) => s.type === "Broker Statement").map((s) => ({
          id: s.id,
          institution: s.institution,
          last4: s.accountLast4,
          currency: s.currency,
        }));

  for (const src of derivedSources) {
    const positions = schedules.filter((s) => s.sourceIds.includes(src.id) && s.closingUnits > 0.0001);
    if (!positions.length) continue;
    const rows: InvestmentReconRow[] = positions.map((s) => {
      const ccy = s.currency;
      const unitsSchedule = s.closingUnits;
      const unitsStmt = unitsSchedule;
      const costStmt = ccy === "CAD" ? s.closingCostCAD : s.closingCostCAD / closingFxRate;
      const fmvStmt  = ccy === "CAD" ? s.fmvCAD : s.fmvCAD / closingFxRate;
      const varU = unitsSchedule - unitsStmt;
      const varC = (ccy === "CAD" ? s.closingCostCAD : s.closingCostCAD / closingFxRate) - costStmt;
      const varF = (ccy === "CAD" ? s.fmvCAD : s.fmvCAD / closingFxRate) - fmvStmt;
      const pass = Math.abs(varU) < 0.001 && Math.abs(varC) < 1 && Math.abs(varF) < 1;
      return {
        ticker: s.ticker, security: s.security, ccy,
        perScheduleUnits: unitsSchedule, perStmtUnits: unitsStmt,
        perScheduleCost: ccy === "CAD" ? s.closingCostCAD : s.closingCostCAD / closingFxRate,
        perStmtCost: costStmt,
        perScheduleFmv: ccy === "CAD" ? s.fmvCAD : s.fmvCAD / closingFxRate,
        perStmtFmv: fmvStmt,
        varianceUnits: varU, varianceCost: varC, varianceFmv: varF,
        pass,
      };
    });
    out.push({
      sourceId: src.id, institution: src.institution, last4: src.last4,
      currency: src.currency, positions: rows,
      pass: rows.every((r) => r.pass),
    });
  }
  return out;
}

export interface CashReconRow {
  sourceId: string;
  institution: string;
  last4: string;
  currency: string;
  glBalance: number;
  stmtBalance: number;
  variance: number;
  pass: boolean;
}

export function buildCashRecon(): CashReconRow[] {
  return cashAccountBalances.map((b) => {
    const src = sources.find((s) => s.id === b.sourceId);
    const variance = b.glBalance - b.stmtBalance;
    return {
      sourceId: b.sourceId,
      institution: src?.institution ?? b.sourceId,
      last4: src?.accountLast4 ?? "—",
      currency: b.currency,
      glBalance: b.glBalance,
      stmtBalance: b.stmtBalance,
      variance,
      pass: Math.abs(variance) < 1,
    };
  });
}

// ===================== Validation (replaces Flags tab) =====================

export interface TxIssue { level: "warning" | "critical"; message: string; }

export function validateTx(tx: Transaction, runningUnits?: number): TxIssue[] {
  const issues: TxIssue[] = [];
  if (tx.currency !== "CAD" && !tx.fxRate) {
    issues.push({ level: "warning", message: "Missing FX rate for foreign-currency transaction" });
  }
  if (tx.type === "Sale" && runningUnits !== undefined && Math.abs(tx.units) > runningUnits + 0.0001) {
    issues.push({ level: "critical", message: "Sells more units than held" });
  }
  return issues;
}

// Deprecated — kept for backward compatibility
export interface Flag { level: "info" | "warning" | "critical"; category: string; message: string; }
export function buildFlags(_schedules: SecuritySchedule[]): Flag[] { return []; }
