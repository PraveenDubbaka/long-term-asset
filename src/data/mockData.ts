import type {
  Loan, AmortizationRow, ContinuityRow, ActivityItem, Covenant,
  ReconciliationItem, JEProposal, AccountMapping, EngagementSettings,
  FXRate, ReviewQueueItem, CarryforwardPackage, BanDocument
} from '../types';

// ─── BAN DOCUMENTS ───────────────────────────────────────────────────────────
export const banDocuments: BanDocument[] = [
  { id: 'BAN-1',  code: 'BAN-1',  name: 'Term_Loan_A_Agreement_2022.pdf' },
  { id: 'BAN-2',  code: 'BAN-2',  name: 'RBC_Renewal_2024.pdf' },
  { id: 'BAN-3',  code: 'BAN-3',  name: 'TD_LOC_Agreement_2023.pdf' },
  { id: 'BAN-4',  code: 'BAN-4',  name: 'HSBC_Equipment_Loan_2023.pdf' },
  { id: 'BAN-5',  code: 'BAN-5',  name: 'Equipment_Schedule.pdf' },
  { id: 'BAN-6',  code: 'BAN-6',  name: 'BDC_TLB_Agreement_2021.pdf' },
  { id: 'BAN-7',  code: 'BAN-7',  name: 'Shareholder_Loan_Agreement.pdf' },
  { id: 'BAN-8',  code: 'BAN-8',  name: 'Ford_Fleet_Schedule_2022.pdf' },
  { id: 'BAN-9',  code: 'BAN-9',  name: 'BNS_EUR_Facility_2023.pdf' },
  { id: 'BAN-10', code: 'BAN-10', name: 'CIBC_Mortgage_2019.pdf' },
  { id: 'BAN-11', code: 'BAN-11', name: 'Property_Appraisal_2023.pdf' },
  { id: 'BAN-12', code: 'BAN-12', name: 'ATB_Bridge_2023.pdf' },
];

// ─── FX RATES ────────────────────────────────────────────────────────────────
export const fxRates: FXRate[] = [
  { currency: 'USD', period: '2024-12', rate: 1.3530 },
  { currency: 'USD', period: '2024-11', rate: 1.3480 },
  { currency: 'USD', period: '2024-10', rate: 1.3350 },
  { currency: 'USD', period: '2024-09', rate: 1.3510 },
  { currency: 'USD', period: '2024-08', rate: 1.3620 },
  { currency: 'USD', period: '2024-07', rate: 1.3680 },
  { currency: 'EUR', period: '2024-12', rate: 1.4720 },
  { currency: 'EUR', period: '2024-11', rate: 1.4650 },
];

// ─── ACCOUNT MAPPING ─────────────────────────────────────────────────────────
export const accountMappings: AccountMapping[] = [
  { id: 'am-01', code: '2100', name: 'Long-Term Debt – CAD', type: 'Principal' },
  { id: 'am-02', code: '2101', name: 'Current Portion – LTD (CAD)', type: 'CurrentPortionLTD' },
  { id: 'am-03', code: '2110', name: 'Long-Term Debt – USD', type: 'Principal' },
  { id: 'am-04', code: '2111', name: 'Current Portion – LTD (USD)', type: 'CurrentPortionLTD' },
  { id: 'am-05', code: '2200', name: 'Line of Credit', type: 'Principal' },
  { id: 'am-06', code: '2300', name: 'Accrued Interest Payable – CAD', type: 'AccruedInterestPayable' },
  { id: 'am-07', code: '2301', name: 'Accrued Interest Payable – USD', type: 'AccruedInterestPayable' },
  { id: 'am-08', code: '7100', name: 'Interest Expense – CAD', type: 'InterestExpense' },
  { id: 'am-09', code: '7101', name: 'Interest Expense – USD', type: 'InterestExpense' },
  { id: 'am-10', code: '7200', name: 'FX Gain / Loss', type: 'FXGainLoss' },
];

// ─── LOANS ────────────────────────────────────────────────────────────────────
export const initialLoans: Loan[] = [
  {
    id: 'loan-rbc-01',
    refNumber: 'RBC-2022-4451',
    name: 'Term Loan A',
    lender: 'Royal Bank of Canada',
    type: 'Term',
    currency: 'CAD',
    originalPrincipal: 5_000_000,
    currentBalance: 3_750_000,
    rate: 5.25,
    interestType: 'Fixed',
    dayCountBasis: 'ACT/365',
    startDate: '2022-01-15',
    maturityDate: '2027-01-15',
    paymentFrequency: 'Monthly',
    paymentType: 'P&I',
    status: 'Active',
    glPrincipalAccount: '2100',
    glAccruedInterestAccount: '2300',
    glInterestExpenseAccount: '7100',
    covenantIds: ['cov-01', 'cov-02'],
    currentPortion: 500_000,
    longTermPortion: 3_250_000,
    accruedInterest: 32_877,
    lastPaymentDate: '2024-10-31',
    securityDescription: 'General Security Agreement over all present and future assets',
    attachments: ['Term_Loan_A_Agreement_2022.pdf', 'RBC_Renewal_2024.pdf'],
    wpRefs: ['BAN-1', 'BAN-2'],
    notes: 'Fixed rate secured term loan. Annual reviews required.',
  },
  {
    id: 'loan-td-02',
    refNumber: 'TD-LOC-8832',
    name: 'Operating LOC',
    lender: 'TD Bank',
    type: 'LOC',
    currency: 'CAD',
    originalPrincipal: 2_000_000,
    currentBalance: 875_000,
    creditLimit: 2_000_000,
    rate: 7.45,
    interestType: 'Variable',
    benchmark: 'TD Prime',
    spread: 1.0,
    resetFrequency: 'Monthly',
    dayCountBasis: 'ACT/365',
    startDate: '2023-06-01',
    maturityDate: '2026-06-01',
    paymentFrequency: 'Monthly',
    paymentType: 'Interest-only',
    status: 'Active',
    glPrincipalAccount: '2200',
    glAccruedInterestAccount: '2300',
    glInterestExpenseAccount: '7100',
    covenantIds: ['cov-03', 'cov-04'],
    currentPortion: 875_000,
    longTermPortion: 0,
    accruedInterest: 10_842,
    lastPaymentDate: '2024-11-30',
    securityDescription: 'First charge over accounts receivable and inventory',
    attachments: ['TD_LOC_Agreement_2023.pdf'],
    wpRefs: ['BAN-3'],
    notes: 'Variable rate revolving LOC. Rate resets monthly at TD Prime + 1.00%.',
  },
  {
    id: 'loan-hsbc-03',
    refNumber: 'HSBC-EQ-2291',
    name: 'USD Equipment Loan',
    lender: 'HSBC',
    type: 'Term',
    currency: 'USD',
    originalPrincipal: 1_500_000,
    currentBalance: 1_125_000,
    rate: 6.10,
    interestType: 'Fixed',
    dayCountBasis: '30/360',
    startDate: '2023-03-01',
    maturityDate: '2028-03-01',
    paymentFrequency: 'Monthly',
    paymentType: 'P&I',
    status: 'Active',
    glPrincipalAccount: '2110',
    glAccruedInterestAccount: '2301',
    glInterestExpenseAccount: '7101',
    covenantIds: ['cov-05'],
    currentPortion: 300_000,
    longTermPortion: 825_000,
    accruedInterest: 17_109,
    lastPaymentDate: '2024-09-30',
    fxRateToCAD: 1.3530,
    securityDescription: 'Specific charge over manufacturing equipment (Serial #EQ-8842-X)',
    attachments: ['HSBC_Equipment_Loan_2023.pdf', 'Equipment_Schedule.pdf'],
    wpRefs: ['BAN-4', 'BAN-5'],
    notes: 'USD denominated. FX translation required at each period end. 30/360 day count.',
  },
  {
    id: 'loan-bdc-04',
    refNumber: 'BDC-TL-7721',
    name: 'BDC Term Loan B',
    lender: 'BDC',
    type: 'Term',
    currency: 'CAD',
    originalPrincipal: 1_800_000,
    currentBalance: 1_200_000,
    rate: 6.40,
    interestType: 'Fixed',
    dayCountBasis: 'ACT/365',
    startDate: '2021-09-01',
    maturityDate: '2026-09-01',
    paymentFrequency: 'Monthly',
    paymentType: 'P&I',
    status: 'Active',
    glPrincipalAccount: '2100',
    glAccruedInterestAccount: '2300',
    glInterestExpenseAccount: '7100',
    covenantIds: [],
    currentPortion: 240_000,
    longTermPortion: 960_000,
    accruedInterest: 6_525,
    lastPaymentDate: '2024-11-30',
    securityDescription: 'Second charge over general assets; personal guarantee by shareholders',
    attachments: ['BDC_TLB_Agreement_2021.pdf'],
    wpRefs: ['BAN-6'],
    notes: 'BDC subordinated term loan. Quarterly financial reporting required.',
  },
  {
    id: 'loan-nbc-05',
    refNumber: 'NBC-SHL-0044',
    name: 'Shareholder Demand Loan',
    lender: 'Shareholder (J. Smith)',
    type: 'Term',
    currency: 'CAD',
    originalPrincipal: 500_000,
    currentBalance: 500_000,
    rate: 3.00,
    interestType: 'Fixed',
    dayCountBasis: 'ACT/365',
    startDate: '2020-01-01',
    maturityDate: '2026-12-31',
    paymentFrequency: 'Annual',
    paymentType: 'Interest-only',
    status: 'Active',
    glPrincipalAccount: '2120',
    glAccruedInterestAccount: '2300',
    glInterestExpenseAccount: '7100',
    covenantIds: [],
    currentPortion: 0,
    longTermPortion: 500_000,
    accruedInterest: 1_274,
    lastPaymentDate: '2024-12-31',
    securityDescription: 'Subordinated demand note; no external security',
    attachments: ['Shareholder_Loan_Agreement.pdf'],
    wpRefs: ['BAN-7'],
    notes: "Non-arm's length loan. CRA prescribed rate. Repayable on demand per shareholder resolution.",
  },
  {
    id: 'loan-ford-06',
    refNumber: 'FORD-VF-5519',
    name: 'Vehicle Fleet Financing',
    lender: 'Ford Credit Canada',
    type: 'Term',
    currency: 'CAD',
    originalPrincipal: 285_000,
    currentBalance: 198_400,
    rate: 8.90,
    interestType: 'Fixed',
    dayCountBasis: 'ACT/365',
    startDate: '2022-06-15',
    maturityDate: '2025-06-15',
    paymentFrequency: 'Monthly',
    paymentType: 'P&I',
    status: 'Active',
    glPrincipalAccount: '2100',
    glAccruedInterestAccount: '2300',
    glInterestExpenseAccount: '7100',
    covenantIds: [],
    currentPortion: 198_400,
    longTermPortion: 0,
    accruedInterest: 1_497,
    lastPaymentDate: '2024-11-15',
    securityDescription: 'PPSA registration over 6 fleet vehicles (VINs on file)',
    attachments: ['Ford_Fleet_Schedule_2022.pdf'],
    wpRefs: ['BAN-8'],
    notes: 'Matures June 2025. Renewal or payoff required. Classify fully as current.',
  },
  {
    id: 'loan-bns-07',
    refNumber: 'BNS-EU-3301',
    name: 'EUR Import Facility',
    lender: 'Scotiabank',
    type: 'Revolver',
    currency: 'EUR',
    originalPrincipal: 750_000,
    currentBalance: 420_000,
    creditLimit: 750_000,
    rate: 4.75,
    interestType: 'Variable',
    benchmark: 'ECB Base Rate',
    spread: 1.25,
    resetFrequency: 'Quarterly',
    dayCountBasis: 'ACT/360',
    startDate: '2023-07-01',
    maturityDate: '2025-07-01',
    paymentFrequency: 'Monthly',
    paymentType: 'Interest-only',
    status: 'Active',
    glPrincipalAccount: '2105',
    glAccruedInterestAccount: '2300',
    glInterestExpenseAccount: '7100',
    covenantIds: [],
    currentPortion: 420_000,
    longTermPortion: 0,
    accruedInterest: 1_662,
    lastPaymentDate: '2024-11-30',
    fxRateToCAD: 1.4720,
    securityDescription: 'Floating charge over imported inventory; EUR-denominated',
    attachments: ['BNS_EUR_Facility_2023.pdf'],
    wpRefs: ['BAN-9'],
    notes: 'EUR revolving import facility. FX translation at YE rate required. Matures Jul 2025.',
  },
  {
    id: 'loan-cibc-08',
    refNumber: 'CIB-MG-1182',
    name: 'Industrial Property Mortgage',
    lender: 'CIBC',
    type: 'Mortgage',
    currency: 'CAD',
    originalPrincipal: 4_200_000,
    currentBalance: 3_810_000,
    rate: 4.95,
    interestType: 'Fixed',
    dayCountBasis: 'ACT/365',
    startDate: '2019-04-01',
    maturityDate: '2034-04-01',
    paymentFrequency: 'Monthly',
    paymentType: 'P&I',
    status: 'Active',
    glPrincipalAccount: '2130',
    glAccruedInterestAccount: '2300',
    glInterestExpenseAccount: '7100',
    covenantIds: [],
    currentPortion: 180_000,
    longTermPortion: 3_630_000,
    accruedInterest: 15_939,
    lastPaymentDate: '2024-11-01',
    securityDescription: 'First mortgage charge over industrial property at 1842 Commerce Dr. (MPAC assessed $5.1M)',
    attachments: ['CIBC_Mortgage_2019.pdf', 'Property_Appraisal_2023.pdf'],
    wpRefs: ['BAN-10', 'BAN-11'],
    notes: 'Fixed 5-year term renewing Apr 2024. Renewal at 4.95% confirmed. 15-year amortization.',
  },
  {
    id: 'loan-atb-09',
    refNumber: 'ATB-BR-9901',
    name: 'Bridge Loan (Refinanced)',
    lender: 'ATB Financial',
    type: 'Bridge',
    currency: 'CAD',
    originalPrincipal: 1_500_000,
    currentBalance: 0,
    rate: 9.50,
    interestType: 'Variable',
    benchmark: 'Prime',
    spread: 3.25,
    dayCountBasis: 'ACT/365',
    startDate: '2023-11-01',
    maturityDate: '2024-11-01',
    paymentFrequency: 'Monthly',
    paymentType: 'Interest-only',
    status: 'Refinanced',
    glPrincipalAccount: '2100',
    glAccruedInterestAccount: '2300',
    glInterestExpenseAccount: '7100',
    covenantIds: [],
    currentPortion: 0,
    longTermPortion: 0,
    accruedInterest: 0,
    lastPaymentDate: '2024-11-01',
    securityDescription: 'Subordinated bridge; replaced by BDC Term Loan B on maturity',
    attachments: ['ATB_Bridge_2023.pdf'],
    wpRefs: ['BAN-12'],
    notes: 'Fully repaid Nov 1, 2024 via proceeds from BDC-TL-7721. GL balance confirmed nil at YE.',
  },
];

// ─── AMORTIZATION SCHEDULES ──────────────────────────────────────────────────
// Term Loan A — monthly P&I from Jan 2025 through Dec 2027 (using current balance as opening)
const buildTermLoanASchedule = (): AmortizationRow[] => {
  const rows: AmortizationRow[] = [];
  let balance = 3_750_000;
  const annualRate = 0.0525;
  const monthlyRate = annualRate / 12;
  // Remaining 26 months (Nov 2024 → Jan 2027)
  const remainingMonths = 26;
  const payment = balance * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths) /
    (Math.pow(1 + monthlyRate, remainingMonths) - 1);

  for (let i = 0; i < remainingMonths; i++) {
    const year = 2024 + Math.floor((11 + i) / 12);
    const month = ((10 + i) % 12) + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    const interest = balance * annualRate * daysInMonth / 365;
    const principal = payment - interest;
    const endingBalance = Math.max(0, balance - principal);

    rows.push({
      id: `amort-rbc-${i}`,
      loanId: 'loan-rbc-01',
      periodDate: `${year}-${String(month).padStart(2, '0')}-15`,
      openingBalance: balance,
      interest: Math.round(interest * 100) / 100,
      payment: Math.round(payment * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      endingBalance: Math.round(endingBalance * 100) / 100,
    });
    balance = endingBalance;
    if (balance < 1) break;
  }
  return rows;
};

// USD Equipment Loan — monthly P&I 30/360, from Oct 2024
const buildUSDEquipmentSchedule = (): AmortizationRow[] => {
  const rows: AmortizationRow[] = [];
  let balance = 1_125_000;
  const annualRate = 0.0610;
  const monthlyRate = annualRate / 12;
  const remainingMonths = 41; // Oct 2024 → Feb 2028
  const payment = balance * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths) /
    (Math.pow(1 + monthlyRate, remainingMonths) - 1);

  for (let i = 0; i < remainingMonths; i++) {
    const year = 2024 + Math.floor((9 + i) / 12);
    const month = ((9 + i) % 12) + 1;
    const interest = balance * annualRate / 12; // 30/360
    const principal = payment - interest;
    const endingBalance = Math.max(0, balance - principal);

    rows.push({
      id: `amort-hsbc-${i}`,
      loanId: 'loan-hsbc-03',
      periodDate: `${year}-${String(month).padStart(2, '0')}-01`,
      openingBalance: balance,
      interest: Math.round(interest * 100) / 100,
      payment: Math.round(payment * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      endingBalance: Math.round(endingBalance * 100) / 100,
    });
    balance = endingBalance;
    if (balance < 1) break;
  }
  return rows;
};

// Operating LOC — interest-only monthly
const buildLOCSchedule = (): AmortizationRow[] => {
  const rows: AmortizationRow[] = [];
  const balance = 875_000;
  const annualRate = 0.0745;

  for (let i = 0; i < 18; i++) {
    const year = 2024 + Math.floor((11 + i) / 12);
    const month = ((11 + i) % 12) + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    const interest = balance * annualRate * daysInMonth / 365;

    rows.push({
      id: `amort-td-${i}`,
      loanId: 'loan-td-02',
      periodDate: `${year}-${String(month).padStart(2, '0')}-30`,
      openingBalance: balance,
      interest: Math.round(interest * 100) / 100,
      payment: Math.round(interest * 100) / 100,
      principal: 0,
      endingBalance: balance,
    });
  }
  return rows;
};

export const initialAmortization: AmortizationRow[] = [
  ...buildTermLoanASchedule(),
  ...buildLOCSchedule(),
  ...buildUSDEquipmentSchedule(),
];

// ─── CONTINUITY ───────────────────────────────────────────────────────────────
export const initialContinuity: ContinuityRow[] = [
  // Term Loan A — monthly 2024
  { id: 'cont-rbc-01', loanId: 'loan-rbc-01', period: '2024-01', openingBalance: 4_125_000, newBorrowings: 0, repayments: 94_300, fxTranslation: 0, closingBalance: 4_030_700, currentPortion: 500_000, longTermPortion: 3_530_700, accruedInterest: 17_890 },
  { id: 'cont-rbc-02', loanId: 'loan-rbc-01', period: '2024-02', openingBalance: 4_030_700, newBorrowings: 0, repayments: 94_300, fxTranslation: 0, closingBalance: 3_936_400, currentPortion: 500_000, longTermPortion: 3_436_400, accruedInterest: 17_440 },
  { id: 'cont-rbc-03', loanId: 'loan-rbc-01', period: '2024-03', openingBalance: 3_936_400, newBorrowings: 0, repayments: 94_300, fxTranslation: 0, closingBalance: 3_842_100, currentPortion: 500_000, longTermPortion: 3_342_100, accruedInterest: 18_230 },
  { id: 'cont-rbc-04', loanId: 'loan-rbc-01', period: '2024-04', openingBalance: 3_842_100, newBorrowings: 0, repayments: 94_300, fxTranslation: 0, closingBalance: 3_747_800, currentPortion: 500_000, longTermPortion: 3_247_800, accruedInterest: 16_890 },
  { id: 'cont-rbc-05', loanId: 'loan-rbc-01', period: '2024-05', openingBalance: 3_747_800, newBorrowings: 0, repayments: 94_300, fxTranslation: 0, closingBalance: 3_653_500, currentPortion: 500_000, longTermPortion: 3_153_500, accruedInterest: 18_210 },
  { id: 'cont-rbc-06', loanId: 'loan-rbc-01', period: '2024-06', openingBalance: 3_653_500, newBorrowings: 0, repayments: 94_300, fxTranslation: 0, closingBalance: 3_559_200, currentPortion: 500_000, longTermPortion: 3_059_200, accruedInterest: 17_720 },
  { id: 'cont-rbc-07', loanId: 'loan-rbc-01', period: '2024-07', openingBalance: 3_559_200, newBorrowings: 0, repayments: 94_300, fxTranslation: 0, closingBalance: 3_464_900, currentPortion: 500_000, longTermPortion: 2_964_900, accruedInterest: 18_590 },
  { id: 'cont-rbc-08', loanId: 'loan-rbc-01', period: '2024-08', openingBalance: 3_464_900, newBorrowings: 0, repayments: 94_300, fxTranslation: 0, closingBalance: 3_370_600, currentPortion: 500_000, longTermPortion: 2_870_600, accruedInterest: 18_500 },
  { id: 'cont-rbc-09', loanId: 'loan-rbc-01', period: '2024-09', openingBalance: 3_370_600, newBorrowings: 0, repayments: 94_300, fxTranslation: 0, closingBalance: 3_276_300, currentPortion: 500_000, longTermPortion: 2_776_300, accruedInterest: 17_800 },
  { id: 'cont-rbc-10', loanId: 'loan-rbc-01', period: '2024-10', openingBalance: 3_276_300, newBorrowings: 0, repayments: 94_300, fxTranslation: 0, closingBalance: 3_182_000, currentPortion: 500_000, longTermPortion: 2_682_000, accruedInterest: 18_240 },
  { id: 'cont-rbc-11', loanId: 'loan-rbc-01', period: '2024-11', openingBalance: 3_182_000, newBorrowings: 0, repayments: 94_300, fxTranslation: 0, closingBalance: 3_087_700, currentPortion: 500_000, longTermPortion: 2_587_700, accruedInterest: 16_920 },
  { id: 'cont-rbc-12', loanId: 'loan-rbc-01', period: '2024-12', openingBalance: 3_087_700, newBorrowings: 0, repayments: 0, fxTranslation: 0, closingBalance: 3_750_000, currentPortion: 500_000, longTermPortion: 3_250_000, accruedInterest: 32_877, notes: 'YE balance per amortization schedule; December payment pending post-YE' },
  // Operating LOC — draws and repayments
  { id: 'cont-td-01', loanId: 'loan-td-02', period: '2024-01', openingBalance: 600_000, newBorrowings: 200_000, repayments: 0, fxTranslation: 0, closingBalance: 800_000, currentPortion: 800_000, longTermPortion: 0, accruedInterest: 4_910 },
  { id: 'cont-td-02', loanId: 'loan-td-02', period: '2024-02', openingBalance: 800_000, newBorrowings: 100_000, repayments: 0, fxTranslation: 0, closingBalance: 900_000, currentPortion: 900_000, longTermPortion: 0, accruedInterest: 5_520 },
  { id: 'cont-td-03', loanId: 'loan-td-02', period: '2024-03', openingBalance: 900_000, newBorrowings: 0, repayments: 100_000, fxTranslation: 0, closingBalance: 800_000, currentPortion: 800_000, longTermPortion: 0, accruedInterest: 6_230 },
  { id: 'cont-td-04', loanId: 'loan-td-02', period: '2024-04', openingBalance: 800_000, newBorrowings: 0, repayments: 50_000, fxTranslation: 0, closingBalance: 750_000, currentPortion: 750_000, longTermPortion: 0, accruedInterest: 5_180 },
  { id: 'cont-td-05', loanId: 'loan-td-02', period: '2024-05', openingBalance: 750_000, newBorrowings: 200_000, repayments: 0, fxTranslation: 0, closingBalance: 950_000, currentPortion: 950_000, longTermPortion: 0, accruedInterest: 6_450 },
  { id: 'cont-td-06', loanId: 'loan-td-02', period: '2024-06', openingBalance: 950_000, newBorrowings: 0, repayments: 200_000, fxTranslation: 0, closingBalance: 750_000, currentPortion: 750_000, longTermPortion: 0, accruedInterest: 6_890 },
  { id: 'cont-td-07', loanId: 'loan-td-02', period: '2024-07', openingBalance: 750_000, newBorrowings: 300_000, repayments: 0, fxTranslation: 0, closingBalance: 1_050_000, currentPortion: 1_050_000, longTermPortion: 0, accruedInterest: 7_310 },
  { id: 'cont-td-08', loanId: 'loan-td-02', period: '2024-08', openingBalance: 1_050_000, newBorrowings: 0, repayments: 175_000, fxTranslation: 0, closingBalance: 875_000, currentPortion: 875_000, longTermPortion: 0, accruedInterest: 8_020 },
  { id: 'cont-td-09', loanId: 'loan-td-02', period: '2024-09', openingBalance: 875_000, newBorrowings: 0, repayments: 0, fxTranslation: 0, closingBalance: 875_000, currentPortion: 875_000, longTermPortion: 0, accruedInterest: 7_710 },
  { id: 'cont-td-10', loanId: 'loan-td-02', period: '2024-10', openingBalance: 875_000, newBorrowings: 0, repayments: 0, fxTranslation: 0, closingBalance: 875_000, currentPortion: 875_000, longTermPortion: 0, accruedInterest: 8_090 },
  { id: 'cont-td-11', loanId: 'loan-td-02', period: '2024-11', openingBalance: 875_000, newBorrowings: 0, repayments: 0, fxTranslation: 0, closingBalance: 875_000, currentPortion: 875_000, longTermPortion: 0, accruedInterest: 9_430 },
  { id: 'cont-td-12', loanId: 'loan-td-02', period: '2024-12', openingBalance: 875_000, newBorrowings: 0, repayments: 0, fxTranslation: 0, closingBalance: 875_000, currentPortion: 875_000, longTermPortion: 0, accruedInterest: 10_842 },
  // USD Equipment Loan
  { id: 'cont-hsbc-01', loanId: 'loan-hsbc-03', period: '2024-01', openingBalance: 1_350_000, newBorrowings: 0, repayments: 29_455, fxTranslation: -2_100, closingBalance: 1_318_445, currentPortion: 300_000, longTermPortion: 1_018_445, accruedInterest: 7_200 },
  { id: 'cont-hsbc-06', loanId: 'loan-hsbc-03', period: '2024-06', openingBalance: 1_222_000, newBorrowings: 0, repayments: 29_455, fxTranslation: 1_800, closingBalance: 1_194_345, currentPortion: 300_000, longTermPortion: 894_345, accruedInterest: 8_100 },
  { id: 'cont-hsbc-12', loanId: 'loan-hsbc-03', period: '2024-12', openingBalance: 1_155_000, newBorrowings: 0, repayments: 0, fxTranslation: -30_000, closingBalance: 1_125_000, currentPortion: 300_000, longTermPortion: 825_000, accruedInterest: 17_109, notes: 'FX translation adjustment: USD 1,125,000 @ 1.3530 CAD. Q4 payment accrued at YE.' },
];

// ─── ACTIVITY ─────────────────────────────────────────────────────────────────
export const initialActivities: ActivityItem[] = [
  {
    id: 'act-01', loanId: 'loan-rbc-01', date: '2024-12-15', description: 'RBC Payment – Term Loan A Dec 2024',
    totalAmount: 95_135, type: 'Payment', status: 'Unclassified',
    aiSuggestion: { principal: 76_870, interest: 18_265, fees: 0, confidence: 0.94 },
  },
  {
    id: 'act-02', loanId: 'loan-rbc-01', date: '2024-11-15', description: 'RBC Payment – Term Loan A Nov 2024',
    totalAmount: 95_135, type: 'Payment', principalAmount: 77_480, interestAmount: 17_655, feesAmount: 0, status: 'Classified',
  },
  {
    id: 'act-03', loanId: 'loan-rbc-01', date: '2024-10-15', description: 'RBC Payment – Term Loan A Oct 2024',
    totalAmount: 95_135, type: 'Payment', principalAmount: 78_100, interestAmount: 17_035, feesAmount: 0, status: 'Classified',
  },
  {
    id: 'act-04', loanId: 'loan-td-02', date: '2024-11-30', description: 'TD LOC Interest Payment Nov 2024',
    totalAmount: 5_628, type: 'Payment', principalAmount: 0, interestAmount: 5_628, feesAmount: 0, status: 'Classified',
  },
  {
    id: 'act-05', loanId: 'loan-td-02', date: '2024-08-14', description: 'TD LOC Draw – Working Capital',
    totalAmount: -300_000, type: 'Draw', principalAmount: -300_000, interestAmount: 0, feesAmount: 0, status: 'Classified',
  },
  {
    id: 'act-06', loanId: 'loan-td-02', date: '2024-08-01', description: 'TD LOC Repayment',
    totalAmount: 175_000, type: 'Payment', principalAmount: 175_000, interestAmount: 0, feesAmount: 0, status: 'Classified',
  },
  {
    id: 'act-07', loanId: 'loan-hsbc-03', date: '2024-09-30', description: 'HSBC Equipment Loan – Q3 Payment',
    totalAmount: 29_455, type: 'Payment', status: 'Exception',
    aiSuggestion: { principal: 23_740, interest: 5_715, fees: 0, confidence: 0.88 },
    sourceRef: 'HSBC-STMT-2024-Q3',
  },
  {
    id: 'act-08', loanId: 'loan-hsbc-03', date: '2024-06-30', description: 'HSBC Equipment Loan – Q2 Payment',
    totalAmount: 29_455, type: 'Payment', principalAmount: 24_130, interestAmount: 5_325, feesAmount: 0, status: 'Classified',
  },
  {
    id: 'act-09', loanId: 'loan-rbc-01', date: '2024-09-15', description: 'RBC Payment – Term Loan A Sep 2024',
    totalAmount: 95_135, type: 'Payment', principalAmount: 78_730, interestAmount: 16_405, feesAmount: 0, status: 'Classified',
  },
  {
    id: 'act-10', loanId: 'loan-td-02', date: '2024-10-31', description: 'TD LOC Interest Payment Oct 2024',
    totalAmount: 5_780, type: 'Payment', principalAmount: 0, interestAmount: 5_780, feesAmount: 0, status: 'Classified',
  },
  {
    id: 'act-11', loanId: 'loan-rbc-01', date: '2024-12-02', description: 'Unknown RBC Credit',
    totalAmount: 12_500, type: 'Other', status: 'Exception',
    sourceRef: 'RBC-STMT-DEC-2024',
  },
];

// ─── COVENANTS ────────────────────────────────────────────────────────────────
export const initialCovenants: Covenant[] = [
  {
    id: 'cov-01', loanId: 'loan-rbc-01',
    name: 'DSCR', type: 'Quantitative',
    threshold: 1.25, operator: '>=', frequency: 'Annual',
    description: 'Debt Service Coverage Ratio: EBITDA / (Principal + Interest)',
    currentValue: 1.12, projectedValue: 0.96, status: 'Breached', lastTested: '2024-12-31',
    formula: 'EBITDA / (Annual Principal + Annual Interest)',
    disclosureRequired: true,
    notes: 'FY2024 EBITDA impacted by one-time restructuring charges. Management letter disclosure required.',
    testedBy: 'J. Martinez',
    useFormulaBuilder: true, isRatioCovenant: true,
    formulaLines: [
      { id: 'fl-01-n1', sign: '+', description: 'EBITDA', glAccount: '6500', amount: 2_450_000, projectedAmount: 2_100_000, multiplier: 1 },
    ],
    denominatorLines: [
      { id: 'fl-01-d1', sign: '+', description: 'Annual Principal Payments', glAccount: 'DS01', amount: 500_000,   projectedAmount: 500_000,   multiplier: 1 },
      { id: 'fl-01-d2', sign: '+', description: 'Annual Interest Payments',  glAccount: 'DS02', amount: 1_687_500, projectedAmount: 1_687_500, multiplier: 1 },
    ],
  },
  {
    id: 'cov-02', loanId: 'loan-rbc-01',
    name: 'Debt-to-EBITDA', type: 'Quantitative',
    threshold: 4.0, operator: '<=', frequency: 'Annual',
    description: 'Total Debt / EBITDA ≤ 4.0x',
    currentValue: 3.20, projectedValue: 3.57, status: 'OK', lastTested: '2024-12-31',
    formula: 'Total Funded Debt / Trailing 12M EBITDA',
    testedBy: 'J. Martinez',
    useFormulaBuilder: true, isRatioCovenant: true,
    formulaLines: [
      { id: 'fl-02-n1', sign: '+', description: 'Total Funded Debt',   glAccount: '2600', amount: 10_240_000, projectedAmount: 10_000_000, multiplier: 1 },
    ],
    denominatorLines: [
      { id: 'fl-02-d1', sign: '+', description: 'EBITDA (TTM)',        glAccount: '6500', amount:  3_200_000, projectedAmount:  2_800_000, multiplier: 1 },
    ],
  },
  {
    id: 'cov-03', loanId: 'loan-td-02',
    name: 'Current Ratio', type: 'Quantitative',
    threshold: 1.20, operator: '>=', frequency: 'Quarterly',
    description: 'Current Assets / Current Liabilities ≥ 1.20x',
    currentValue: 1.45, projectedValue: 1.23, status: 'OK', lastTested: '2024-12-31',
    formula: 'Current Assets / Current Liabilities',
    testedBy: 'S. Patel',
    useFormulaBuilder: true, isRatioCovenant: true,
    formulaLines: [
      { id: 'fl-03-n1', sign: '+', description: 'Total Current Assets',      glAccount: '1400', amount: 3_625_000, projectedAmount: 3_075_000, multiplier: 1 },
    ],
    denominatorLines: [
      { id: 'fl-03-d1', sign: '+', description: 'Total Current Liabilities', glAccount: '2400', amount: 2_500_000, projectedAmount: 2_500_000, multiplier: 1 },
    ],
  },
  {
    id: 'cov-04', loanId: 'loan-td-02',
    name: 'Minimum Cash', type: 'Quantitative',
    threshold: 500_000, operator: '>=', frequency: 'Monthly',
    description: 'Unrestricted cash balance ≥ $500,000 at all times',
    currentValue: 425_000, projectedValue: 365_000, status: 'At Risk', lastTested: '2024-12-31',
    formula: 'Bank Account Balances (unrestricted)',
    disclosureRequired: false,
    notes: 'Cash balance declined in Q4 due to capital expenditures. Monitor closely in Q1 2025.',
    testedBy: 'S. Patel',
    useFormulaBuilder: true, isRatioCovenant: false,
    formulaLines: [
      { id: 'fl-04-n1', sign: '+', description: 'Cash – Main Operating Account', glAccount: '1000', amount: 285_000, projectedAmount: 245_000, multiplier: 1 },
      { id: 'fl-04-n2', sign: '+', description: 'Cash – Reserve Account',        glAccount: '1001', amount: 140_000, projectedAmount: 120_000, multiplier: 1 },
    ],
  },
  {
    id: 'cov-05', loanId: 'loan-hsbc-03',
    name: 'Tangible Net Worth', type: 'Quantitative',
    threshold: 2_000_000, operator: '>=', frequency: 'Annual',
    description: 'Total Equity less Intangible Assets ≥ $2,000,000 (CAD)',
    currentValue: 2_450_000, projectedValue: 2_700_000, status: 'OK', lastTested: '2024-12-31',
    formula: 'Total Equity - Goodwill - Other Intangibles',
    testedBy: 'J. Martinez',
    useFormulaBuilder: true, isRatioCovenant: false,
    formulaLines: [
      { id: 'fl-05-n1', sign: '+', description: "Total Shareholders' Equity",  glAccount: '3000', amount: 4_850_000, projectedAmount: 5_100_000, multiplier: 1 },
      { id: 'fl-05-n2', sign: '-', description: 'Goodwill',                    glAccount: '1600', amount: 1_200_000, projectedAmount: 1_200_000, multiplier: 1 },
      { id: 'fl-05-n3', sign: '-', description: 'Other Intangible Assets',     glAccount: '1700', amount: 1_200_000, projectedAmount: 1_200_000, multiplier: 1 },
    ],
  },
];

// ─── RECONCILIATION ───────────────────────────────────────────────────────────
export const initialReconciliation: ReconciliationItem[] = [
  {
    id: 'rec-01', loanId: 'loan-rbc-01', account: '2100 – Long-Term Debt (CAD)', accountType: 'Principal',
    subledgerBalance: 3_750_000, tbBalance: 3_750_000, variance: 0, status: 'Reconciled', currency: 'CAD',
    preparedBy: 'J. Martinez',
  },
  {
    id: 'rec-02', loanId: 'loan-rbc-01', account: '2300 – Accrued Interest Payable (CAD)', accountType: 'AccruedInterest',
    subledgerBalance: 32_877, tbBalance: 32_877, variance: 0, status: 'Reconciled', currency: 'CAD',
    preparedBy: 'J. Martinez',
  },
  {
    id: 'rec-03', loanId: 'loan-td-02', account: '2200 – Line of Credit', accountType: 'Principal',
    subledgerBalance: 875_000, tbBalance: 875_000, variance: 0, status: 'Reconciled', currency: 'CAD',
    preparedBy: 'S. Patel',
  },
  {
    id: 'rec-04', loanId: 'loan-td-02', account: '2300 – Accrued Interest Payable (CAD)', accountType: 'AccruedInterest',
    subledgerBalance: 10_842, tbBalance: 0, variance: 10_842, status: 'Variance', currency: 'CAD',
    notes: 'Accrued interest not yet booked in GL. Proposed via AJE-03.',
    preparedBy: 'S. Patel',
  },
  {
    id: 'rec-05', loanId: 'loan-hsbc-03', account: '2110 – LT Debt USD (CAD equiv)', accountType: 'Principal',
    subledgerBalance: 1_522_125, // USD 1,125,000 × 1.3530
    tbBalance: 1_421_650, // Recorded at old rate
    variance: 100_475, status: 'Variance', currency: 'CAD',
    notes: 'TB balance recorded at historical rate (1.2637). Subledger retranslated at YE rate (1.3530). FX translation AJE required.',
    preparedBy: 'J. Martinez',
  },
  {
    id: 'rec-06', loanId: 'loan-hsbc-03', account: '2301 – Accrued Interest Payable (USD)', accountType: 'AccruedInterest',
    subledgerBalance: 23_162, // USD 17,109 × 1.3530
    tbBalance: 0, variance: 23_162, status: 'Variance', currency: 'CAD',
    notes: 'USD accrued interest not yet booked. Proposed via AJE-05.',
    preparedBy: 'J. Martinez',
  },
];

// ─── JOURNAL ENTRIES ──────────────────────────────────────────────────────────
export const initialJEs: JEProposal[] = [
  {
    id: 'je-01', type: 'AccruedInterest',
    description: 'YE Accrued Interest – Term Loan A (RBC)',
    fiscalYear: '2024', loanId: 'loan-rbc-01',
    status: 'Draft', createdAt: '2025-01-10T09:00:00Z', preparedBy: 'J. Martinez',
    lines: [
      { id: 'jl-01a', account: '7100 – Interest Expense (CAD)', description: 'YE accrued interest – Term Loan A', debit: 32_877, credit: 0, loanId: 'loan-rbc-01' },
      { id: 'jl-01b', account: '2300 – Accrued Interest Payable (CAD)', description: 'YE accrued interest – Term Loan A', debit: 0, credit: 32_877, loanId: 'loan-rbc-01' },
    ],
  },
  {
    id: 'je-02', type: 'CurrentPortionReclass',
    description: 'YE Current Portion Reclass – Term Loan A (RBC)',
    fiscalYear: '2024', loanId: 'loan-rbc-01',
    status: 'Approved', createdAt: '2025-01-10T09:15:00Z', preparedBy: 'J. Martinez', approvedBy: 'K. Chen', approvedAt: '2025-01-14T14:30:00Z',
    lines: [
      { id: 'jl-02a', account: '2100 – Long-Term Debt (CAD)', description: 'Reclass current portion to current – Term Loan A', debit: 500_000, credit: 0, loanId: 'loan-rbc-01' },
      { id: 'jl-02b', account: '2101 – Current Portion LTD (CAD)', description: 'Reclass current portion to current – Term Loan A', debit: 0, credit: 500_000, loanId: 'loan-rbc-01' },
    ],
  },
  {
    id: 'je-03', type: 'AccruedInterest',
    description: 'YE Accrued Interest – Operating LOC (TD)',
    fiscalYear: '2024', loanId: 'loan-td-02',
    status: 'Draft', createdAt: '2025-01-10T09:30:00Z', preparedBy: 'S. Patel',
    lines: [
      { id: 'jl-03a', account: '7100 – Interest Expense (CAD)', description: 'YE accrued interest – Operating LOC', debit: 10_842, credit: 0, loanId: 'loan-td-02' },
      { id: 'jl-03b', account: '2300 – Accrued Interest Payable (CAD)', description: 'YE accrued interest – Operating LOC', debit: 0, credit: 10_842, loanId: 'loan-td-02' },
    ],
  },
  {
    id: 'je-04', type: 'FXTranslation',
    description: 'YE FX Translation – USD Equipment Loan (HSBC)',
    fiscalYear: '2024', loanId: 'loan-hsbc-03',
    status: 'Draft', createdAt: '2025-01-10T09:45:00Z', preparedBy: 'J. Martinez',
    lines: [
      { id: 'jl-04a', account: '2110 – LT Debt USD (CAD)', description: 'FX retranslation at YE rate 1.3530 vs hist 1.2637', debit: 100_475, credit: 0, loanId: 'loan-hsbc-03' },
      { id: 'jl-04b', account: '7200 – FX Gain / Loss', description: 'FX translation loss on USD Equipment Loan', debit: 0, credit: 100_475, loanId: 'loan-hsbc-03' },
    ],
  },
  {
    id: 'je-05', type: 'AccruedInterest',
    description: 'YE Accrued Interest – USD Equipment Loan (HSBC)',
    fiscalYear: '2024', loanId: 'loan-hsbc-03',
    status: 'Draft', createdAt: '2025-01-10T10:00:00Z', preparedBy: 'J. Martinez',
    lines: [
      { id: 'jl-05a', account: '7101 – Interest Expense (USD)', description: 'YE accrued interest USD $17,109 @ 1.3530', debit: 23_162, credit: 0, loanId: 'loan-hsbc-03' },
      { id: 'jl-05b', account: '2301 – Accrued Interest Payable (USD)', description: 'YE accrued interest USD $17,109 @ 1.3530', debit: 0, credit: 23_162, loanId: 'loan-hsbc-03' },
    ],
  },
  {
    id: 'je-06', type: 'CurrentPortionReclass',
    description: 'YE Current Portion Reclass – USD Equipment Loan (HSBC)',
    fiscalYear: '2024', loanId: 'loan-hsbc-03',
    status: 'Draft', createdAt: '2025-01-10T10:15:00Z', preparedBy: 'J. Martinez',
    lines: [
      { id: 'jl-06a', account: '2110 – LT Debt USD (CAD)', description: 'Reclass next 12M principal USD $300K @ 1.3530', debit: 405_900, credit: 0, loanId: 'loan-hsbc-03' },
      { id: 'jl-06b', account: '2111 – Current Portion LTD (USD)', description: 'Reclass next 12M principal USD $300K @ 1.3530', debit: 0, credit: 405_900, loanId: 'loan-hsbc-03' },
    ],
  },
];

// ─── REVIEW QUEUE ─────────────────────────────────────────────────────────────
export const initialReviewQueue: ReviewQueueItem[] = [
  {
    id: 'rq-01', type: 'UnreviewedActivity', tab: 'activity', severity: 'High',
    title: 'Missing P/I split — Term Loan A Dec payment',
    description: '$95,135 payment on 2024-12-15 not split into principal/interest. AI confidence 94%.',
    loanId: 'loan-rbc-01', loanName: 'Term Loan A',
  },
  {
    id: 'rq-02', type: 'CovenantUnknown', tab: 'covenants', severity: 'High',
    title: 'DSCR Breached — Term Loan A',
    description: 'DSCR 1.12 vs threshold 1.25. Management letter disclosure may be required.',
    loanId: 'loan-rbc-01', loanName: 'Term Loan A',
  },
  {
    id: 'rq-03', type: 'CovenantUnknown', tab: 'covenants', severity: 'Medium',
    title: 'Minimum Cash At Risk — Operating LOC',
    description: 'Cash $425K vs threshold $500K. Monitor Q1 2025.',
    loanId: 'loan-td-02', loanName: 'Operating LOC',
  },
  {
    id: 'rq-04', type: 'ReconciliationVariance', tab: 'reconciliation', severity: 'High',
    title: 'FX translation variance — USD Equipment Loan',
    description: 'CAD $100,475 variance between subledger and TB. FX AJE pending approval.',
    loanId: 'loan-hsbc-03', loanName: 'USD Equipment Loan',
  },
  {
    id: 'rq-05', type: 'ReconciliationVariance', tab: 'reconciliation', severity: 'Medium',
    title: 'Accrued interest not booked — Operating LOC',
    description: '$10,842 accrued interest not yet in TB. AJE-03 pending.',
    loanId: 'loan-td-02', loanName: 'Operating LOC',
  },
  {
    id: 'rq-06', type: 'AJEPending', tab: 'ajes', severity: 'Medium',
    title: '4 AJEs pending preparer review',
    description: 'JE-01, JE-03, JE-04, JE-05 are in Draft status and require review.',
  },
  {
    id: 'rq-07', type: 'UnreviewedActivity', tab: 'activity', severity: 'Low',
    title: 'Unknown RBC credit — $12,500',
    description: 'Unclassified credit on 2024-12-02. Requires classification before year-end lock.',
    loanId: 'loan-rbc-01', loanName: 'Term Loan A',
  },
];

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
export const initialSettings: EngagementSettings = {
  client: 'Acme Manufacturing Inc.',
  engagement: 'FY2024 Year-End Audit',
  fiscalYearEnd: '2024-12-31',
  baseCurrency: 'CAD',
  currentPeriod: '2024-12',
  reconciliationThreshold: 100,
  ocrConfidenceThreshold: 85,
  interestDayCountDefault: 'ACT/365',
  status: 'Blocked',
  fxRates,
};

// ─── CARRYFORWARD ─────────────────────────────────────────────────────────────
export const carryforwardPackages: CarryforwardPackage[] = [
  {
    id: 'cf-2023',
    fromFiscalYear: '2023',
    toFiscalYear: '2024',
    createdAt: '2024-01-08T10:00:00Z',
    createdBy: 'J. Martinez',
    status: 'Applied',
    closingBalances: { 'loan-rbc-01': 4_125_000, 'loan-td-02': 600_000, 'loan-hsbc-03': 1_350_000 },
    accruedInterestCarried: { 'loan-rbc-01': 17_890, 'loan-td-02': 4_100, 'loan-hsbc-03': 6_890 },
    rateTableSnapshot: { 'loan-rbc-01': 5.25, 'loan-td-02': 7.20, 'loan-hsbc-03': 6.10 },
    unresolvedItems: [],
  },
];
