import { Source, Transaction, PriorYearLot, FmvQuote, CashAccountBalance, FxRateInfo } from "./types";
import { defaultTbAccount } from "./coa";

export const sources: Source[] = [
  {
    id: "A",
    label: "Source A",
    type: "Broker Statement",
    institution: "TD Waterhouse",
    accountLast4: "4821",
    periodStart: "2024-01-01",
    periodEnd: "2024-12-31",
    currency: "CAD",
    entityName: "Maple Holdings Inc.",
  },
  {
    id: "B",
    label: "Source B",
    type: "Broker Statement",
    institution: "RBC Direct Investing",
    accountLast4: "9117",
    periodStart: "2024-01-01",
    periodEnd: "2024-12-31",
    currency: "USD",
    entityName: "Maple Holdings Inc.",
  },
  {
    id: "C",
    label: "Source C",
    type: "Bank Statement",
    institution: "BMO Operating Account",
    accountLast4: "0042",
    periodStart: "2024-01-01",
    periodEnd: "2024-12-31",
    currency: "CAD",
    entityName: "Maple Holdings Inc.",
  },
  {
    id: "D",
    label: "Source D",
    type: "Bank Statement",
    institution: "RBC USD Account",
    accountLast4: "7733",
    periodStart: "2024-01-01",
    periodEnd: "2024-12-31",
    currency: "USD",
    entityName: "Maple Holdings Inc.",
  },
  {
    id: "PY",
    label: "Prior Year WP",
    type: "Prior Year WP",
    institution: "Uploaded prior-year schedule (FY2023)",
    accountLast4: "—",
    periodStart: "2023-01-01",
    periodEnd: "2023-12-31",
    currency: "CAD",
    entityName: "Maple Holdings Inc.",
  },
];

// Prior-year opening positions (used in "continuing entity" scenario)
export const priorYearLots: PriorYearLot[] = [
  { security: "Royal Bank of Canada",  ticker: "RY",    sourceId: "A", units: 500,  costCAD: 62_500,  currency: "CAD" },
  { security: "Enbridge Inc.",          ticker: "ENB",   sourceId: "A", units: 800,  costCAD: 38_400,  currency: "CAD" },
  { security: "Apple Inc.",             ticker: "AAPL",  sourceId: "B", units: 200,  costCAD: 38_400,  currency: "USD" },
  { security: "Microsoft Corp.",        ticker: "MSFT",  sourceId: "B", units: 150,  costCAD: 60_750,  currency: "USD" },
  { security: "Govt of Canada Bond 5%", ticker: "CGOV5", sourceId: "A", units: 1,    costCAD: 62_500,  currency: "CAD" },
];

// Period-end FMV (closing prices)
export const fmvQuotes: FmvQuote[] = [
  { ticker: "RY",    closingPrice: 138.50,    currency: "CAD" },
  { ticker: "ENB",   closingPrice:  53.20,    currency: "CAD" },
  { ticker: "AAPL",  closingPrice: 250.42,    currency: "USD" },
  { ticker: "MSFT",  closingPrice: 421.50,    currency: "USD" },
  { ticker: "SHOP",  closingPrice: 112.30,    currency: "CAD" },
  { ticker: "NVDA",  closingPrice: 138.25,    currency: "USD" },
  { ticker: "CGOV5", closingPrice:  62_375.00, currency: "CAD" },
];

// Period-end FX rate (CAD per USD)
export const closingFxRate = 1.4389;

// ── Settlement date helpers ───────────────────────────────────────────────────
/** Add N business days to an ISO date string (skips Sat/Sun). */
function addBusinessDays(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00Z");
  let added = 0;
  while (added < n) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dow = d.getUTCDay();          // 0=Sun, 6=Sat
    if (dow !== 0 && dow !== 6) added++;
  }
  return d.toISOString().slice(0, 10);
}

/** Settlement cycle by transaction type. */
function settleDays(type: Transaction["type"]): number {
  if (type === "Purchase" || type === "Sale" || type === "Transfer In" || type === "Transfer Out") return 2;
  if (type === "Reinvested Dividend") return 1;
  return 0;   // Dividend, Interest, Fee, WHT, ROC settle same day
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
    tradeDate:      date,                                         // trade date = booking date
    settlementDate: sd > 0 ? addBusinessDays(date, sd) : date,   // T+2 for equities, T+0 otherwise
  };
};

// ── Current year transactions ─────────────────────────────────────────────────
export const currentYearTransactions: Transaction[] = [

  // ════ Source A: TD Waterhouse (CAD) ════

  // Purchases
  t("A", "2024-03-15", "Royal Bank of Canada",   "RY",    "Purchase",    100,  132.50,  9.99, "CAD"),
  t("A", "2024-08-20", "Shopify Inc.",            "SHOP",  "Purchase",    300,   95.20,  9.99, "CAD"),

  // Sales
  t("A", "2024-06-30", "Enbridge Inc.",           "ENB",   "Sale",       -200,   49.80,  9.99, "CAD"),
  t("A", "2024-11-15", "Shopify Inc.",            "SHOP",  "Sale",        -80,  108.75,  9.99, "CAD"),

  // Dividends — units = shares held, price = dividend per share
  t("A", "2024-05-10", "Royal Bank of Canada",   "RY",    "Dividend",    600,    1.38,  0.00, "CAD", undefined, "Q2 div $1.38/sh · 600 shares"),
  t("A", "2024-08-10", "Royal Bank of Canada",   "RY",    "Dividend",    600,    1.38,  0.00, "CAD", undefined, "Q3 div $1.38/sh · 600 shares"),
  t("A", "2024-10-12", "Enbridge Inc.",           "ENB",   "Dividend",    600,    0.915, 0.00, "CAD", undefined, "Q3 div $0.915/sh · 600 shares"),

  // Bond interest — units = 1 (one bond position), price = coupon amount
  t("A", "2024-06-15", "Govt of Canada Bond 5%", "CGOV5", "Interest",      1,  312.50,  0.00, "CAD", undefined, "Semi-annual coupon · $62,500 par @ 1.0%/6mo"),
  t("A", "2024-12-15", "Govt of Canada Bond 5%", "CGOV5", "Interest",      1,  312.50,  0.00, "CAD", undefined, "Semi-annual coupon · $62,500 par @ 1.0%/6mo"),

  // Return of Capital — units = shares, price = ROC per share
  t("A", "2024-11-25", "Enbridge Inc.",           "ENB",   "Return of Capital", 600, 0.40, 0.00, "CAD", undefined, "ROC $0.40/sh · reduces ACB"),

  // ════ Source B: RBC Direct (USD) ════

  // Purchases
  t("B", "2024-02-05", "Apple Inc.",              "AAPL",  "Purchase",     50,  188.40,  4.95, "USD", 1.3478),
  t("B", "2024-04-18", "Microsoft Corp.",         "MSFT",  "Purchase",     25,  415.00,  4.95, "USD", 1.3712),
  t("B", "2024-07-22", "NVIDIA Corp.",            "NVDA",  "Purchase",    100,  121.50,  4.95, "USD", 1.3805),
  t("B", "2024-09-25", "Apple Inc.",              "AAPL",  "Purchase",     30,  226.50,  4.95, "USD", 1.3601, "⚠ within 30d of AAPL sale", "approved"),

  // Sales
  t("B", "2024-09-15", "Apple Inc.",              "AAPL",  "Sale",         -75, 224.10,  4.95, "USD", 1.3590),
  t("B", "2024-10-30", "NVIDIA Corp.",            "NVDA",  "Sale",         -40, 139.20,  4.95, "USD", 1.3892),

  // Dividends — units = shares held, price = dividend per share
  t("B", "2024-06-12", "Apple Inc.",              "AAPL",  "Dividend",    250,    0.25,  0.00, "USD", 1.3690, "Cash div USD 0.25/sh · 250 shares"),
  t("B", "2024-09-12", "Apple Inc.",              "AAPL",  "Dividend",    175,    0.25,  0.00, "USD", 1.3595, "Cash div USD 0.25/sh · 175 shares"),
  t("B", "2024-11-08", "Microsoft Corp.",         "MSFT",  "Dividend",    175,    0.83,  0.00, "USD", 1.3920, "Cash div USD 0.83/sh · 175 shares"),
  t("B", "2024-12-15", "NVIDIA Corp.",            "NVDA",  "Dividend",     60,    0.04,  0.00, "USD", 1.4290, "Q4 cash div USD 0.04/sh · 60 shares", "pending"),

  // Withholding Tax — units = shares, price = WHT per share (15%)
  t("B", "2024-06-12", "Apple Inc.",              "AAPL",  "Withholding Tax", 250, 0.0375, 0.00, "USD", 1.3690, "US NRA WHT 15% on AAPL Q2 div"),
  t("B", "2024-11-08", "Microsoft Corp.",         "MSFT",  "Withholding Tax", 175, 0.1245, 0.00, "USD", 1.3920, "US NRA WHT 15% on MSFT div"),

  // Reinvested Dividend (DRIP)
  t("B", "2024-11-08", "Microsoft Corp.",         "MSFT",  "Reinvested Dividend", 0.32, 412.10, 0.00, "USD", 1.3920, "DRIP reinvestment", "approved"),

  // Fee/Commission
  t("B", "2024-12-01", "RBC Direct Investing",    "FEE",   "Fee/Commission", 0,    0.00, 125.00, "USD", 1.4310, "Annual platform fee"),
];

// ── Income amounts (overrides for income-matrix; also used by ROC in compute) ─
// For dividend transactions that already carry correct gross values, entries here
// are kept in sync. The ROC entry is required by compute.ts to reduce ENB ACB.
export const incomeAmounts: Record<string, number> = {
  "RY|2024-05-10":   600 * 1.38,    //  828.00 CAD
  "RY|2024-08-10":   600 * 1.38,    //  828.00 CAD
  "ENB|2024-10-12":  600 * 0.915,   //  549.00 CAD
  "ENB|2024-11-25":  600 * 0.40,    //  240.00 CAD  ← ROC; used by compute.ts
  "AAPL|2024-06-12": 250 * 0.25,    //   62.50 USD
  "AAPL|2024-09-12": 175 * 0.25,    //   43.75 USD
  "MSFT|2024-11-08": 175 * 0.83,    //  145.25 USD
  "CGOV5|2024-06-15": 312.50,       //  312.50 CAD
  "CGOV5|2024-12-15": 312.50,       //  312.50 CAD
};

// ── Cash account balances (for cash reconciliation) ───────────────────────────
export const cashAccountBalances: CashAccountBalance[] = [
  { sourceId: "C", glBalance: 142_350.18, stmtBalance: 142_350.18, currency: "CAD" },
  { sourceId: "D", glBalance:  18_421.55, stmtBalance:  18_510.00, currency: "USD" },
];

// ── Period FX rates (CAD per 1 foreign unit) ──────────────────────────────────
export const fxRates: FxRateInfo[] = [
  { ccy: "USD", opening: 1.3241, closing: 1.4389, average: 1.3712, rateSource: "Bank of Canada" },
  { ccy: "EUR", opening: 1.4612, closing: 1.4920, average: 1.4801, rateSource: "Bank of Canada" },
  { ccy: "GBP", opening: 1.6810, closing: 1.7990, average: 1.7501, rateSource: "Bank of Canada" },
];
