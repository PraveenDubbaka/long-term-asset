export type Currency = "CAD" | "USD" | "EUR" | "GBP";
export type SourceType = "Broker Statement" | "Bank Statement" | "Client Schedule" | "Prior Year WP";

export interface Source {
  id: string;
  label: string;
  type: SourceType;
  institution: string;
  accountLast4: string;
  periodStart: string;
  periodEnd: string;
  currency: Currency;
  entityName: string;
}

export type TxType =
  | "Opening"
  | "Purchase"
  | "Sale"
  | "Dividend"
  | "Interest"
  | "Return of Capital"
  | "Stock Split"
  | "Transfer In"
  | "Transfer Out"
  | "FX Conversion"
  | "Fee/Commission"
  | "Withholding Tax"
  | "Reinvested Dividend";

export type TxStatus = "pending" | "approved" | "published";

export interface Transaction {
  id: string;
  sourceId: string;
  date: string;
  security: string;
  ticker: string;
  type: TxType;
  units: number;
  price: number;
  gross: number;
  fees: number;
  net: number;
  currency: Currency;
  fxRate?: number;
  tradeDate?: string;       // ISO date of trade execution (defaults to date if absent)
  settlementDate?: string;  // ISO date of settlement (typically T+2)
  notes?: string;
  status?: TxStatus;
  tbAccount?: string;
}

export interface PriorYearLot {
  security: string;
  ticker: string;
  sourceId: string;
  units: number;
  costCAD: number;
  currency: Currency;
}

export interface FmvQuote {
  ticker: string;
  closingPrice: number;
  currency: Currency;
}

export type IncomeType = "Dividend" | "Interest" | "Withholding Tax" | "Fees" | "Other";

export interface CashAccountBalance {
  sourceId: string;
  glBalance: number;
  stmtBalance: number;
  currency: Currency;
}

export interface FxRateInfo {
  ccy: Currency;
  opening: number;
  closing: number;
  average: number;
  rateSource: string;
}

export interface FxEvent {
  date: string;
  security: string;
  ticker: string;
  ccy: Currency;
  foreignAmount: number;
  rateAtTxn: number;
  rateAtAcq: number;
  realizedFxCAD: number;
  notes?: string;
}
