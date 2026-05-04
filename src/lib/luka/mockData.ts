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
  { security: "Royal Bank of Canada", ticker: "RY", sourceId: "A", units: 500, costCAD: 62500, currency: "CAD" },
  { security: "Enbridge Inc.", ticker: "ENB", sourceId: "A", units: 800, costCAD: 38400, currency: "CAD" },
  { security: "Apple Inc.", ticker: "AAPL", sourceId: "B", units: 200, costCAD: 38400, currency: "USD" }, // 200 @ USD145 * 1.3241
  { security: "Microsoft Corp.", ticker: "MSFT", sourceId: "B", units: 150, costCAD: 60750, currency: "USD" },
];

// Period-end FMV (closing prices)
export const fmvQuotes: FmvQuote[] = [
  { ticker: "RY", closingPrice: 138.50, currency: "CAD" },
  { ticker: "ENB", closingPrice: 53.20, currency: "CAD" },
  { ticker: "AAPL", closingPrice: 250.42, currency: "USD" },
  { ticker: "MSFT", closingPrice: 421.50, currency: "USD" },
  { ticker: "SHOP", closingPrice: 112.30, currency: "CAD" },
  { ticker: "NVDA", closingPrice: 138.25, currency: "USD" },
];

// Period-end FX rate (CAD per USD)
export const closingFxRate = 1.4389;

// Helper to make rows
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
  const net = type === "Sale" || type === "Transfer Out" ? gross - fees : gross + fees;
  return {
    id: `T${(++_id).toString().padStart(4, "0")}`,
    sourceId,
    date,
    security,
    ticker,
    type,
    units,
    price,
    gross,
    fees,
    net,
    currency,
    fxRate,
    notes,
    status,
    tbAccount: defaultTbAccount(type),
  };
};

// Current year transactions
export const currentYearTransactions: Transaction[] = [
  // ---- Source A: TD Waterhouse (CAD) ----
  t("A", "2024-03-15", "Royal Bank of Canada", "RY", "Purchase", 100, 132.50, 9.99, "CAD"),
  t("A", "2024-05-10", "Royal Bank of Canada", "RY", "Dividend", 0, 0, 0, "CAD", undefined, "Q1 div $1.38/sh"),
  t("A", "2024-06-30", "Enbridge Inc.", "ENB", "Sale", -200, 49.80, 9.99, "CAD"),
  t("A", "2024-08-20", "Shopify Inc.", "SHOP", "Purchase", 300, 95.20, 9.99, "CAD"),
  t("A", "2024-10-12", "Enbridge Inc.", "ENB", "Dividend", 0, 0, 0, "CAD", undefined, "Quarterly $0.915/sh"),
  t("A", "2024-11-25", "Enbridge Inc.", "ENB", "Return of Capital", 0, 0, 0, "CAD", undefined, "ROC $0.40/sh — reduces ACB"),

  // ---- Source B: RBC Direct (USD) ----
  t("B", "2024-02-05", "Apple Inc.", "AAPL", "Purchase", 50, 188.40, 4.95, "USD", 1.3478),
  t("B", "2024-04-18", "Microsoft Corp.", "MSFT", "Purchase", 25, 415.00, 4.95, "USD", 1.3712),
  t("B", "2024-06-12", "Apple Inc.", "AAPL", "Dividend", 0, 0, 0, "USD", 1.3690, "Cash div USD 0.25/sh"),
  t("B", "2024-07-22", "NVIDIA Corp.", "NVDA", "Purchase", 100, 121.50, 4.95, "USD", 1.3805),
  t("B", "2024-09-15", "Apple Inc.", "AAPL", "Sale", -75, 224.10, 4.95, "USD", 1.3590),
  t("B", "2024-09-25", "Apple Inc.", "AAPL", "Purchase", 30, 226.50, 4.95, "USD", 1.3601, "⚠ within 30d of sale", "approved"),
  t("B", "2024-11-08", "Microsoft Corp.", "MSFT", "Dividend", 0, 0, 0, "USD", 1.3920, "Reinvested — see DRIP"),
  t("B", "2024-11-08", "Microsoft Corp.", "MSFT", "Reinvested Dividend", 0.32, 412.10, 0, "USD", 1.3920, undefined, "approved"),
  t("B", "2024-12-01", "RBC Direct", "FEE", "Fee/Commission", 0, 0, 125.00, "USD", 1.4310, "Annual platform fee", "pending"),
  t("B", "2024-12-15", "NVIDIA Corp.", "NVDA", "Dividend", 0, 0, 0, "USD", 1.4290, "Q4 cash div USD 0.04/sh", "pending"),
];

// Cash dividend / interest dollar amounts (paired by ticker+date with Dividend rows above)
export const incomeAmounts: Record<string, number> = {
  "RY|2024-05-10": 600 * 1.38,
  "ENB|2024-10-12": 600 * 0.915,
  "ENB|2024-11-25": 600 * 0.40,
  "AAPL|2024-06-12": 250 * 0.25,
  "MSFT|2024-11-08": 175.32 * 0.83,
};

// Cash account balances (per source) for cash reconciliation
export const cashAccountBalances: CashAccountBalance[] = [
  { sourceId: "C", glBalance: 142_350.18, stmtBalance: 142_350.18, currency: "CAD" },
  { sourceId: "D", glBalance: 18_421.55, stmtBalance: 18_510.00, currency: "USD" },
];

// Period FX rates (foreign per CAD inverse: CAD per foreign)
export const fxRates: FxRateInfo[] = [
  { ccy: "USD", opening: 1.3241, closing: 1.4389, average: 1.3712, rateSource: "Bank of Canada" },
  { ccy: "EUR", opening: 1.4612, closing: 1.4920, average: 1.4801, rateSource: "Bank of Canada" },
  { ccy: "GBP", opening: 1.6810, closing: 1.7990, average: 1.7501, rateSource: "Bank of Canada" },
];
