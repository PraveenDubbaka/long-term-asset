// ── Investment Workpaper Types ────────────────────────────────────────────────

export type InvCurrency = 'CAD' | 'USD' | 'EUR' | 'GBP';

export type TxnType =
  | 'Purchase'
  | 'Sale'
  | 'Dividend'
  | 'Transfer In'
  | 'Transfer Out'
  | 'Return of Capital'
  | 'DRIP';

// Current holding (closing position per security/broker)
export interface Holding {
  id: string;
  security: string;
  ticker: string;
  broker: string;
  acctLast4: string;
  currency: InvCurrency;
  units: number;
  wacLocal: number;       // WAC per unit in local currency
  costLocal: number;      // Total cost in local currency
  acqFxRate: number;      // Blended acquisition FX rate (1 for CAD)
  costCAD: number;        // Historical CAD cost
  yeFxRate: number;       // Year-end closing FX rate
  fmvLocal: number;       // FMV in local currency (disclosure — ASPE cost method)
  fmvCAD: number;         // FMV in CAD
  unrealizedGL_CAD: number;
  glAccount: string;
  notes?: string;
}

// Transaction register row
export interface InvTransaction {
  id: string;
  source: string;         // A/B/C/D
  broker: string;
  date: string;
  security: string;
  ticker: string;
  txnType: TxnType;
  qty: number;
  price: number;
  currency: InvCurrency;
  commission: number;
  grossLocal: number;
  netLocal: number;
  fxRate: number;
  netCAD: number;
  notes?: string;
  flag?: boolean;
}

// WAC schedule sub-row
export interface WACRow {
  id: string;
  date: string;
  txnType: string;
  unitsIn: number;
  unitsOut: number;
  priceLocal: number;
  costIn: number;
  costOut: number;
  cumulUnits: number;
  cumulCost: number;
  wacPerUnit: number;
  realizedGL: number;
  notes?: string;
}

// WAC schedule group (one per security/broker)
export interface WACGroup {
  id: string;
  security: string;
  ticker: string;
  broker: string;
  acctLast4: string;
  currency: InvCurrency;
  rows: WACRow[];
  totalRealizedGL: number;
}

// Gain/Loss — realized
export interface RealizedRow {
  id: string;
  security: string;
  ticker: string;
  broker: string;
  date: string;
  unitsSold: number;
  proceedsLocal: number;
  wacCostLocal: number;
  realizedGL_Local: number;
  currency: InvCurrency;
  fxRate: number;
  realizedGL_CAD: number;
  type: string;
  notes?: string;
}

// Gain/Loss — dividend income
export interface DividendRow {
  id: string;
  security: string;
  ticker: string;
  broker: string;
  currency: InvCurrency;
  totalDivLocal: number;
  avgFxRate: number;
  totalDivCAD: number;
  notes?: string;
}

// Gain/Loss — unrealized (disclosure only under ASPE cost method)
export interface UnrealizedRow {
  id: string;
  security: string;
  ticker: string;
  broker: string;
  currency: InvCurrency;
  yeUnits: number;
  bookValueLocal: number;
  yeFmvLocal: number;
  unrealizedGL_Local: number;
  yeFxRate: number;
  unrealizedGL_CAD: number;
  notes?: string;
}

// FX rates table row
export interface FXRateRow {
  date: string;
  usdCad: number;
  eurCad: number;
  gbpCad: number;
  notes?: string;
}

// FX Schedule — foreign-currency position translation
export interface FXScheduleRow {
  id: string;
  security: string;
  ticker: string;
  broker: string;
  acctLast4: string;
  currency: InvCurrency;
  yeUnits: number;
  foreignCost: number;
  acqRate: number;
  cadCost: number;
  yeFxRate: number;
  fmvForeign: number;
  fmvCAD: number;
  unrealizedGL_CAD: number;
}

// Investment AJE
export interface InvAJE {
  id: string;
  entryNo: string;
  description: string;
  rationale: string;
  lines: InvAJELine[];
  type: 'Correcting' | 'Reclassification' | 'Accrual' | 'Disposition' | 'Fair Value Adj' | 'Tax';
  confidence: 'High' | 'Medium' | 'Low';
  notes?: string;
  status: 'Draft' | 'Approved' | 'Posted';
  wpRef?: string;
}

export interface InvAJELine {
  account: string;
  glCode: string;
  dr: number;
  cr: number;
}

// GL Summary roll-forward row
export interface GLSummaryRow {
  id: string;
  security: string;
  broker: string;
  acctLast4: string;
  currency: InvCurrency;
  openingCAD: number;
  purchasesCAD: number;
  disposalsAtCostCAD: number;
  realizedGL_CAD: number;
  dividendsCAD: number;
  rocCAD: number;
  fxAdjCAD: number;
  closingCAD: number;
}
