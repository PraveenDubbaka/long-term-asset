import { Source, Transaction, PriorYearLot, FmvQuote, CashAccountBalance, FxRateInfo } from "./types";
import { defaultTbAccount } from "./coa";

export const sources: Source[] = [
  {
    id: "A",
    label: "TD Direct Investing #7145X0",
    type: "Broker Statement",
    institution: "TD Direct Investing",
    accountLast4: "5X0",
    periodStart: "2025-05-01",
    periodEnd: "2026-04-30",
    currency: "CAD",
    entityName: "Pikes Peak Capital Inc.",
  },
];

// Prior-year opening positions (May 1, 2025 — from Apr 30, 2025 statement)
export const priorYearLots: PriorYearLot[] = [
  { security: "Dividend 15 Split Corp-A",   ticker: "DFN",    sourceId: "A", units: 27_965, costCAD: 169_261.10, currency: "CAD" },
  { security: "Dividend 15 Split Corp Pref", ticker: "DFN.PR.A", sourceId: "A", units:  7_733, costCAD:  79_049.91, currency: "CAD" },
  { security: "E Split Corp Cl-A",           ticker: "ENS",    sourceId: "A", units:    490, costCAD:   6_891.40, currency: "CAD" },
  { security: "Mineros S.A.",                ticker: "MSA",    sourceId: "A", units: 29_900, costCAD:  37_982.99, currency: "CAD" },
];

// Period-end FMV (closing prices at April 30, 2026)
export const fmvQuotes: FmvQuote[] = [
  { ticker: "DFN",    closingPrice:  7.92, currency: "CAD" },
  { ticker: "DFN.PR.A", closingPrice: 10.49, currency: "CAD" },
  { ticker: "ENS",    closingPrice: 18.05, currency: "CAD" },
  { ticker: "GDV",    closingPrice: 13.44, currency: "CAD" },
  { ticker: "TXG",    closingPrice: 55.94, currency: "CAD" },
  { ticker: "MSA",    closingPrice:  4.99, currency: "CAD" },
];

// Period-end FX rate (all CAD — no USD positions)
export const closingFxRate = 1.0000;

// ── Settlement date helpers ───────────────────────────────────────────────────
/** Add N business days to an ISO date string (skips Sat/Sun). */
function addBusinessDays(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00Z");
  let added = 0;
  while (added < n) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d.toISOString().slice(0, 10);
}

/** Settlement cycle by transaction type. */
function settleDays(type: Transaction["type"]): number {
  if (type === "Purchase" || type === "Sale" || type === "Transfer In" || type === "Transfer Out") return 2;
  if (type === "Reinvested Dividend") return 1;
  return 0;
}

// ── Transaction builder helper ────────────────────────────────────────────────
let _id = 0;
const t = (
  sourceId: string,
  date: string,
  security: string,
  ticker: string,
  type: Transaction["type"],
  units: number,
  price: number,
  fees: number,
  currency: Transaction["currency"],
  fxRate?: number,
  notes?: string,
  status: Transaction["status"] = "published",
): Transaction => {
  const gross = Math.abs(units) * price;
  const net =
    type === "Sale" || type === "Transfer Out"
      ? gross - fees
      : type === "Withholding Tax"
        ? -(gross + fees)
        : gross + fees;
  const sd = settleDays(type);
  return {
    id: `T${(++_id).toString().padStart(4, "0")}`,
    sourceId, date, security, ticker, type,
    units, price, gross, fees, net,
    currency, fxRate, notes, status,
    tbAccount:      defaultTbAccount(type),
    tradeDate:      date,
    settlementDate: sd > 0 ? addBusinessDays(date, sd) : date,
  };
};

// ── Current year transactions (May 1, 2025 – April 30, 2026) ─────────────────
export const currentYearTransactions: Transaction[] = [

  // ════ Purchases ════

  // ENS — May 13, 2025 (order EI-771045)
  t("A", "2025-05-13", "E Split Corp Cl-A",           "ENS",    "Purchase",    300,  13.680,  9.99, "CAD", undefined, "300 sh @ $13.680 · EI-771045"),

  // DFN.PR.A — May 26, 2025 (order FJ-773700; 3 fills consolidated)
  t("A", "2025-05-26", "Dividend 15 Split Corp Pref", "DFN.PR.A", "Purchase", 4_700, 10.590,  9.99, "CAD", undefined, "4,700 sh @ $10.590 · FJ-773700 (3 fills)"),

  // MSA — May 29, 2025 (order DI-774475)
  t("A", "2025-05-29", "Mineros S.A.",                "MSA",    "Purchase",  9_000,   2.310,  9.99, "CAD", undefined, "9,000 sh @ $2.310 · DI-774475"),

  // DFN.PR.A — Jun 27, 2025 (order CE-781473)
  t("A", "2025-06-27", "Dividend 15 Split Corp Pref", "DFN.PR.A", "Purchase", 1_200, 10.460,  9.99, "CAD", undefined, "1,200 sh @ $10.460 · CE-781473"),

  // GDV — Aug 26, 2025 (order KE-798043)
  t("A", "2025-08-26", "Global Div Growth Split Crp-A", "GDV",  "Purchase",  1_100,  11.310,  9.99, "CAD", undefined, "1,100 sh @ $11.310 · KE-798043"),

  // TXG — Feb 19, 2026 (order HH-851869)
  t("A", "2026-02-19", "Torex Gold Resources Inc.",   "TXG",    "Purchase",  1_000,  57.830,  9.99, "CAD", undefined, "1,000 sh @ $57.830 · HH-851869"),

  // ENS — Apr 14, 2026 (consolidated: 500 settlement artifact + 2,000 new; order VQ-865050)
  t("A", "2026-04-14", "E Split Corp Cl-A",           "ENS",    "Purchase",  2_500,  17.614,  9.99, "CAD", undefined, "2,500 sh @ $17.614 · VQ-865050 (incl. 500 settlement artifact)"),

  // ENS — Apr 15, 2026 (order WD-866946)
  t("A", "2026-04-15", "E Split Corp Cl-A",           "ENS",    "Purchase",  2_500,  17.190,  9.99, "CAD", undefined, "2,500 sh @ $17.190 · WD-866946"),

  // ════ Sales ════

  // DFN — Dec 22, 2025 (order IH-832301)
  t("A", "2025-12-22", "Dividend 15 Split Corp-A",    "DFN",    "Sale",    -10_000,   7.340,  9.99, "CAD", undefined, "10,000 sh @ $7.340 · IH-832301"),

  // DFN — Dec 22, 2025 (order JP-834481)
  t("A", "2025-12-22", "Dividend 15 Split Corp-A",    "DFN",    "Sale",    -15_000,   7.340,  9.99, "CAD", undefined, "15,000 sh @ $7.340 · JP-834481"),

  // ════ Dividends — units=1, price=exact total (avoids per-share rounding) ════

  // ── MSA (foreign income — Colombian company, TSX-listed) ──
  t("A", "2025-05-02", "Mineros S.A.",                "MSA",    "Dividend",    1,   816.57, 0, "CAD", undefined, "foreign_income · 29,900 sh"),
  t("A", "2025-08-01", "Mineros S.A.",                "MSA",    "Dividend",    1, 1_056.14, 0, "CAD", undefined, "foreign_income · 38,900 sh"),
  t("A", "2025-11-04", "Mineros S.A.",                "MSA",    "Dividend",    1, 1_087.26, 0, "CAD", undefined, "foreign_income · 38,900 sh"),
  t("A", "2026-02-02", "Mineros S.A.",                "MSA",    "Dividend",    1, 1_052.25, 0, "CAD", undefined, "foreign_income · 38,900 sh"),
  t("A", "2026-04-27", "Mineros S.A.",                "MSA",    "Dividend",    1, 1_044.47, 0, "CAD", undefined, "foreign_income · 38,900 sh"),

  // ── DFN ──
  t("A", "2025-05-09", "Dividend 15 Split Corp-A",    "DFN",    "Dividend",    1, 2_796.50, 0, "CAD", undefined, "27,965 sh @ $0.10/sh"),
  t("A", "2025-06-10", "Dividend 15 Split Corp-A",    "DFN",    "Dividend",    1, 2_796.50, 0, "CAD", undefined, "27,965 sh @ $0.10/sh"),
  t("A", "2025-07-10", "Dividend 15 Split Corp-A",    "DFN",    "Dividend",    1, 2_796.50, 0, "CAD", undefined, "27,965 sh @ $0.10/sh"),
  t("A", "2025-08-08", "Dividend 15 Split Corp-A",    "DFN",    "Dividend",    1, 2_796.50, 0, "CAD", undefined, "27,965 sh @ $0.10/sh"),
  t("A", "2025-09-10", "Dividend 15 Split Corp-A",    "DFN",    "Dividend",    1, 2_796.50, 0, "CAD", undefined, "27,965 sh @ $0.10/sh"),
  t("A", "2025-10-10", "Dividend 15 Split Corp-A",    "DFN",    "Dividend",    1, 2_796.50, 0, "CAD", undefined, "27,965 sh @ $0.10/sh"),
  t("A", "2025-11-10", "Dividend 15 Split Corp-A",    "DFN",    "Dividend",    1, 2_796.50, 0, "CAD", undefined, "27,965 sh @ $0.10/sh"),
  t("A", "2025-12-10", "Dividend 15 Split Corp-A",    "DFN",    "Dividend",    1, 2_796.50, 0, "CAD", undefined, "27,965 sh @ $0.10/sh"),
  t("A", "2026-01-09", "Dividend 15 Split Corp-A",    "DFN",    "Dividend",    1,   296.50, 0, "CAD", undefined, "2,965 sh @ $0.10/sh (after Dec sales)"),
  t("A", "2026-02-10", "Dividend 15 Split Corp-A",    "DFN",    "Dividend",    1,   296.50, 0, "CAD", undefined, "2,965 sh @ $0.10/sh"),
  t("A", "2026-03-10", "Dividend 15 Split Corp-A",    "DFN",    "Dividend",    1,   296.50, 0, "CAD", undefined, "2,965 sh @ $0.10/sh"),
  t("A", "2026-04-10", "Dividend 15 Split Corp-A",    "DFN",    "Dividend",    1,   296.50, 0, "CAD", undefined, "2,965 sh @ $0.10/sh"),

  // ── DFN.PR.A ──
  t("A", "2025-05-09", "Dividend 15 Split Corp Pref", "DFN.PR.A", "Dividend", 1,   451.07, 0, "CAD", undefined, "7,733 sh @ $0.0583/sh"),
  t("A", "2025-06-10", "Dividend 15 Split Corp Pref", "DFN.PR.A", "Dividend", 1,   725.22, 0, "CAD", undefined, "12,433 sh @ $0.0583/sh"),
  t("A", "2025-07-10", "Dividend 15 Split Corp Pref", "DFN.PR.A", "Dividend", 1,   795.21, 0, "CAD", undefined, "13,633 sh @ $0.0583/sh"),
  t("A", "2025-08-08", "Dividend 15 Split Corp Pref", "DFN.PR.A", "Dividend", 1,   795.21, 0, "CAD", undefined, "13,633 sh @ $0.0583/sh"),
  t("A", "2025-09-10", "Dividend 15 Split Corp Pref", "DFN.PR.A", "Dividend", 1,   795.21, 0, "CAD", undefined, "13,633 sh @ $0.0583/sh"),
  t("A", "2025-10-10", "Dividend 15 Split Corp Pref", "DFN.PR.A", "Dividend", 1,   795.21, 0, "CAD", undefined, "13,633 sh @ $0.0583/sh"),
  t("A", "2025-11-10", "Dividend 15 Split Corp Pref", "DFN.PR.A", "Dividend", 1,   795.21, 0, "CAD", undefined, "13,633 sh @ $0.0583/sh"),
  t("A", "2025-12-10", "Dividend 15 Split Corp Pref", "DFN.PR.A", "Dividend", 1,   795.21, 0, "CAD", undefined, "13,633 sh @ $0.0583/sh"),
  t("A", "2026-01-09", "Dividend 15 Split Corp Pref", "DFN.PR.A", "Dividend", 1,   795.21, 0, "CAD", undefined, "13,633 sh @ $0.0583/sh"),
  t("A", "2026-02-10", "Dividend 15 Split Corp Pref", "DFN.PR.A", "Dividend", 1,   795.21, 0, "CAD", undefined, "13,633 sh @ $0.0583/sh"),
  t("A", "2026-03-10", "Dividend 15 Split Corp Pref", "DFN.PR.A", "Dividend", 1,   795.21, 0, "CAD", undefined, "13,633 sh @ $0.0583/sh"),
  t("A", "2026-04-10", "Dividend 15 Split Corp Pref", "DFN.PR.A", "Dividend", 1,   795.21, 0, "CAD", undefined, "13,633 sh @ $0.0583/sh"),

  // ── ENS ──
  t("A", "2025-05-15", "E Split Corp Cl-A",           "ENS",    "Dividend",    1,    63.70, 0, "CAD", undefined, "490 sh @ $0.13/sh"),
  t("A", "2025-06-13", "E Split Corp Cl-A",           "ENS",    "Dividend",    1,   102.70, 0, "CAD", undefined, "790 sh @ $0.13/sh"),
  t("A", "2025-07-15", "E Split Corp Cl-A",           "ENS",    "Dividend",    1,   102.70, 0, "CAD", undefined, "790 sh @ $0.13/sh"),
  t("A", "2025-08-15", "E Split Corp Cl-A",           "ENS",    "Dividend",    1,   102.70, 0, "CAD", undefined, "790 sh @ $0.13/sh"),
  t("A", "2025-09-15", "E Split Corp Cl-A",           "ENS",    "Dividend",    1,   102.70, 0, "CAD", undefined, "790 sh @ $0.13/sh"),
  t("A", "2025-10-15", "E Split Corp Cl-A",           "ENS",    "Dividend",    1,   102.70, 0, "CAD", undefined, "790 sh @ $0.13/sh"),
  t("A", "2025-11-14", "E Split Corp Cl-A",           "ENS",    "Dividend",    1,   102.70, 0, "CAD", undefined, "790 sh @ $0.13/sh"),
  t("A", "2025-12-15", "E Split Corp Cl-A",           "ENS",    "Dividend",    1,   102.70, 0, "CAD", undefined, "790 sh @ $0.13/sh"),
  t("A", "2026-01-15", "E Split Corp Cl-A",           "ENS",    "Dividend",    1,   102.70, 0, "CAD", undefined, "790 sh @ $0.13/sh"),
  t("A", "2026-02-13", "E Split Corp Cl-A",           "ENS",    "Dividend",    1,   102.70, 0, "CAD", undefined, "790 sh @ $0.13/sh"),
  t("A", "2026-03-13", "E Split Corp Cl-A",           "ENS",    "Dividend",    1,   110.60, 0, "CAD", undefined, "790 sh @ $0.14/sh"),
  t("A", "2026-04-15", "E Split Corp Cl-A",           "ENS",    "Dividend",    1,   110.60, 0, "CAD", undefined, "790 sh @ $0.14/sh (pre-record; Apr buys not eligible)"),

  // ── GDV (eligible dividends — split corp) ──
  t("A", "2025-09-15", "Global Div Growth Split Crp-A", "GDV",  "Dividend",    1,   110.00, 0, "CAD", undefined, "eligible_dividend · 1,100 sh @ $0.10/sh"),
  t("A", "2025-10-15", "Global Div Growth Split Crp-A", "GDV",  "Dividend",    1,   110.00, 0, "CAD", undefined, "eligible_dividend · 1,100 sh @ $0.10/sh"),
  t("A", "2025-11-14", "Global Div Growth Split Crp-A", "GDV",  "Dividend",    1,   110.00, 0, "CAD", undefined, "eligible_dividend · 1,100 sh @ $0.10/sh"),
  t("A", "2025-12-12", "Global Div Growth Split Crp-A", "GDV",  "Dividend",    1,   110.00, 0, "CAD", undefined, "eligible_dividend · 1,100 sh @ $0.10/sh"),
  t("A", "2026-01-15", "Global Div Growth Split Crp-A", "GDV",  "Dividend",    1,   110.00, 0, "CAD", undefined, "eligible_dividend · 1,100 sh @ $0.10/sh"),
  t("A", "2026-02-13", "Global Div Growth Split Crp-A", "GDV",  "Dividend",    1,   110.00, 0, "CAD", undefined, "eligible_dividend · 1,100 sh @ $0.10/sh"),
  t("A", "2026-03-13", "Global Div Growth Split Crp-A", "GDV",  "Dividend",    1,   110.00, 0, "CAD", undefined, "eligible_dividend · 1,100 sh @ $0.10/sh"),
  t("A", "2026-04-15", "Global Div Growth Split Crp-A", "GDV",  "Dividend",    1,   110.00, 0, "CAD", undefined, "eligible_dividend · 1,100 sh @ $0.10/sh"),

  // ── TXG ──
  t("A", "2026-03-19", "Torex Gold Resources Inc.",   "TXG",    "Dividend",    1,   150.00, 0, "CAD", undefined, "1,000 sh · special dividend"),
];

// ── Income amounts (authoritative totals; keyed TICKER|DATE) ─────────────────
// Matches transaction gross values exactly; included for backward compat with
// compute.ts incomeAmounts lookup and to ensure audit trail is unambiguous.
export const incomeAmounts: Record<string, number> = {
  // MSA — foreign income
  "MSA|2025-05-02":    816.57,
  "MSA|2025-08-01":  1_056.14,
  "MSA|2025-11-04":  1_087.26,
  "MSA|2026-02-02":  1_052.25,
  "MSA|2026-04-27":  1_044.47,
  // DFN
  "DFN|2025-05-09":  2_796.50,
  "DFN|2025-06-10":  2_796.50,
  "DFN|2025-07-10":  2_796.50,
  "DFN|2025-08-08":  2_796.50,
  "DFN|2025-09-10":  2_796.50,
  "DFN|2025-10-10":  2_796.50,
  "DFN|2025-11-10":  2_796.50,
  "DFN|2025-12-10":  2_796.50,
  "DFN|2026-01-09":    296.50,
  "DFN|2026-02-10":    296.50,
  "DFN|2026-03-10":    296.50,
  "DFN|2026-04-10":    296.50,
  // DFN.PR.A
  "DFN.PR.A|2025-05-09":   451.07,
  "DFN.PR.A|2025-06-10":   725.22,
  "DFN.PR.A|2025-07-10":   795.21,
  "DFN.PR.A|2025-08-08":   795.21,
  "DFN.PR.A|2025-09-10":   795.21,
  "DFN.PR.A|2025-10-10":   795.21,
  "DFN.PR.A|2025-11-10":   795.21,
  "DFN.PR.A|2025-12-10":   795.21,
  "DFN.PR.A|2026-01-09":   795.21,
  "DFN.PR.A|2026-02-10":   795.21,
  "DFN.PR.A|2026-03-10":   795.21,
  "DFN.PR.A|2026-04-10":   795.21,
  // ENS
  "ENS|2025-05-15":   63.70,
  "ENS|2025-06-13":  102.70,
  "ENS|2025-07-15":  102.70,
  "ENS|2025-08-15":  102.70,
  "ENS|2025-09-15":  102.70,
  "ENS|2025-10-15":  102.70,
  "ENS|2025-11-14":  102.70,
  "ENS|2025-12-15":  102.70,
  "ENS|2026-01-15":  102.70,
  "ENS|2026-02-13":  102.70,
  "ENS|2026-03-13":  110.60,
  "ENS|2026-04-15":  110.60,
  // GDV — eligible dividends
  "GDV|2025-09-15":  110.00,
  "GDV|2025-10-15":  110.00,
  "GDV|2025-11-14":  110.00,
  "GDV|2025-12-12":  110.00,
  "GDV|2026-01-15":  110.00,
  "GDV|2026-02-13":  110.00,
  "GDV|2026-03-13":  110.00,
  "GDV|2026-04-15":  110.00,
  // TXG
  "TXG|2026-03-19":  150.00,
};

// ── Cash account balances (April 30, 2026 statement) ─────────────────────────
export const cashAccountBalances: CashAccountBalance[] = [
  { sourceId: "A", glBalance: 63_311.11, stmtBalance: 63_311.11, currency: "CAD" },
];

// ── Period FX rates — all transactions are CAD; no FX rates required ─────────
export const fxRates: FxRateInfo[] = [];
