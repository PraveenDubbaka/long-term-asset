export type Currency = 'CAD' | 'USD' | 'EUR' | 'GBP';
export type LoanType = 'Term' | 'LOC' | 'Revolver' | 'Mortgage' | 'Bridge' | (string & {});
export type LoanStatus = 'Active' | 'Closed' | 'Replaced' | 'Refinanced';
export type PaymentType = 'P&I' | 'Interest-only' | 'Balloon';
export type DayCountBasis = 'ACT/365' | 'ACT/360' | '30/360';
export type InterestType = 'Fixed' | 'Variable' | 'Floating' | 'Hybrid' | 'Step Rate';
export type PaymentFrequency = 'Monthly' | 'Quarterly' | 'Semi-annual' | 'Annual';
export type CovenantStatus = 'OK' | 'At Risk' | 'Breached' | 'Unknown';
export type CovenantFrequency = 'Monthly' | 'Quarterly' | 'Annual';
export type JEStatus = 'Draft' | 'Approved' | 'Posted' | 'Exported';
export type JEType = 'AccruedInterest' | 'CurrentPortionReclass' | 'FXTranslation' | 'MissingSplit' | 'Manual';
export type ActivityType = 'Payment' | 'Draw' | 'Fee' | 'Other';
export type ActivityStatus = 'Classified' | 'Unclassified' | 'Exception';
export type ReconciliationStatus = 'Reconciled' | 'Variance' | 'Override';

export interface Loan {
  id: string;
  refNumber: string;
  name: string;
  lender: string;
  type: LoanType;
  currency: Currency;
  originalPrincipal: number;
  currentBalance: number;
  creditLimit?: number; // for LOC
  rate: number;
  interestType: InterestType;
  benchmark?: string;
  spread?: number;
  resetFrequency?: string;
  dayCountBasis: DayCountBasis;
  startDate: string;
  maturityDate: string;
  paymentFrequency: PaymentFrequency;
  paymentType: PaymentType;
  status: LoanStatus;
  glPrincipalAccount: string;
  glAccruedInterestAccount: string;
  glInterestExpenseAccount: string;
  covenantIds: string[];
  currentPortion: number;
  longTermPortion: number;
  accruedInterest: number;
  lastPaymentDate?: string;
  securityDescription?: string;
  notes?: string;
  attachments: string[];
  fxRateToCAD?: number; // for non-CAD loans
  monthlyPayment?: number; // manual override; if absent, computed from PMT
}

export interface AmortizationRow {
  id: string;
  loanId: string;
  periodDate: string;
  openingBalance: number;
  interest: number;
  payment: number;
  principal: number;
  endingBalance: number;
  isManualOverride?: boolean;
  notes?: string;
}

export interface ContinuityRow {
  id: string;
  loanId: string;
  period: string; // 'YYYY-MM'
  openingBalance: number;
  newBorrowings: number;
  repayments: number;          // total P&I (legacy / fallback)
  principalRepayments?: number; // principal portion
  interestRepayments?: number;  // interest portion
  fxTranslation: number;
  closingBalance: number;
  currentPortion: number;
  longTermPortion: number;
  accruedInterest: number;
  isManualAdjustment?: boolean;
  adjustmentDescription?: string;
  notes?: string;
}

export interface ActivityItem {
  id: string;
  loanId: string;
  date: string;
  description: string;
  totalAmount: number;
  type: ActivityType;
  principalAmount?: number;
  interestAmount?: number;
  feesAmount?: number;
  status: ActivityStatus;
  sourceRef?: string;
  aiSuggestion?: { principal: number; interest: number; fees: number; confidence: number };
}

export interface CovenantFormulaLine {
  id: string;
  sign: '+' | '-';
  description: string;
  glAccount: string;       // GL account code, e.g. '6500'
  amount: number;          // actual current-period value
  projectedAmount: number; // forecast / stressed value
  multiplier: number;      // default 1.0
}

export interface Covenant {
  id: string;
  loanId: string;
  name: string;
  type: 'Quantitative' | 'Qualitative';
  threshold?: number;
  operator?: '>=' | '<=' | '>' | '<';
  frequency: CovenantFrequency;
  description: string;
  currentValue?: number;
  projectedValue?: number;       // auto-computed from projectedAmount on formula lines
  status: CovenantStatus;
  lastTested?: string;
  formula?: string;
  numeratorAccounts?: string[];
  denominatorAccounts?: string[];
  disclosureRequired?: boolean;
  testedBy?: string;
  notes?: string;
  // Formula builder fields
  isRatioCovenant?: boolean;
  formulaLines?: CovenantFormulaLine[];
  denominatorLines?: CovenantFormulaLine[];
  useFormulaBuilder?: boolean;
}

export interface ReconciliationItem {
  id: string;
  loanId: string;
  account: string;
  accountType: 'Principal' | 'AccruedInterest';
  subledgerBalance: number;
  tbBalance: number;
  variance: number;
  status: ReconciliationStatus;
  currency: Currency;
  notes?: string;
  overrideReason?: string;
  preparedBy?: string;
}

export interface JELine {
  id: string;
  account: string;
  description: string;
  debit: number;
  credit: number;
  loanId?: string;
  reference?: string; // source / destination audit trail
}

export interface JEProposal {
  id: string;
  type: JEType;
  description: string;
  lines: JELine[];
  status: JEStatus;
  preparedBy?: string;
  approvedBy?: string;
  fiscalYear: string;
  date?: string;       // effective date (defaults to year-end)
  loanId?: string;
  createdAt: string;
  approvedAt?: string;
  postedAt?: string;
  deleted?: boolean;  // soft-delete — retained for audit / restore
  deletedAt?: string;
}

export interface FXRate {
  currency: Currency;
  period: string; // 'YYYY-MM'
  rate: number; // units of base currency per 1 foreign
}

export interface AccountMapping {
  id: string;
  code: string;
  name: string;
  type: 'Principal' | 'AccruedInterestPayable' | 'InterestExpense' | 'FXGainLoss' | 'CurrentPortionLTD' | 'Other';
}

export interface EngagementSettings {
  client: string;
  engagement: string;
  fiscalYearEnd: string; // 'YYYY-MM-DD'
  baseCurrency: Currency;
  currentPeriod: string; // 'YYYY-MM'
  reconciliationThreshold: number;
  ocrConfidenceThreshold: number;
  interestDayCountDefault: DayCountBasis;
  fxRates: FXRate[];
  status: 'Ready' | 'Blocked' | 'Locked';
  lockedBy?: string;
  lockedAt?: string;
}

export interface ReviewQueueItem {
  id: string;
  type: 'OCRConfirm' | 'UnreviewedActivity' | 'CovenantUnknown' | 'ReconciliationVariance' | 'AJEPending' | 'MissingData';
  title: string;
  description: string;
  loanId?: string;
  loanName?: string;
  severity: 'High' | 'Medium' | 'Low';
  tab: string;
}

export interface CarryforwardPackage {
  id: string;
  fromFiscalYear: string;
  toFiscalYear: string;
  createdAt: string;
  createdBy: string;
  status: 'Draft' | 'Applied';
  closingBalances: Record<string, number>;
  accruedInterestCarried: Record<string, number>;
  rateTableSnapshot: Record<string, number>;
  unresolvedItems: string[];
}

export type TabId = 'dashboard' | 'loans' | 'continuity' | 'amortization' | 'activity' | 'covenants' | 'reconciliation' | 'ajes' | 'reports' | 'settings';
