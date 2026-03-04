import type { CovenantFormulaLine, CovenantStatus } from '../types';

// ─── GL Account Master List ──────────────────────────────────────────────────
export type GlCategory = 'Income' | 'Expense' | 'Asset' | 'Liability' | 'Equity' | 'DebtSvc' | 'Computed';

export interface GlAccount {
  code: string;
  name: string;
  category: GlCategory;
}

export const GL_ACCOUNTS: GlAccount[] = [
  // Income / P&L
  { code: '4000',  name: 'Revenue',                        category: 'Income'    },
  { code: '5000',  name: 'Cost of Sales',                  category: 'Expense'   },
  { code: '6000',  name: 'Operating Expenses',             category: 'Expense'   },
  { code: '6500',  name: 'EBITDA',                         category: 'Computed'  },
  { code: '6510',  name: 'Net Income',                     category: 'Computed'  },
  { code: '6520',  name: 'EBIT',                           category: 'Computed'  },
  { code: '6600',  name: 'Depreciation & Amortization',    category: 'Expense'   },
  { code: '7100',  name: 'Interest Expense – CAD',          category: 'Expense'   },
  { code: '7101',  name: 'Interest Expense – USD',          category: 'Expense'   },
  { code: 'TAXES', name: 'Income Tax Expense',              category: 'Expense'   },
  { code: 'CAPEX', name: 'Capital Expenditures',            category: 'Expense'   },
  // Current Assets
  { code: '1000',  name: 'Cash & Cash Equivalents',        category: 'Asset'     },
  { code: '1001',  name: 'Cash – Reserve / Restricted',    category: 'Asset'     },
  { code: '1100',  name: 'Accounts Receivable',            category: 'Asset'     },
  { code: '1200',  name: 'Inventory',                      category: 'Asset'     },
  { code: '1300',  name: 'Prepaid Expenses',               category: 'Asset'     },
  { code: '1400',  name: 'Total Current Assets',           category: 'Asset'     },
  // Non-current Assets
  { code: '1500',  name: 'PP&E – Net',                     category: 'Asset'     },
  { code: '1600',  name: 'Goodwill',                       category: 'Asset'     },
  { code: '1700',  name: 'Other Intangible Assets',        category: 'Asset'     },
  { code: '1800',  name: 'Total Assets',                   category: 'Asset'     },
  // Current Liabilities
  { code: '2000',  name: 'Accounts Payable',               category: 'Liability' },
  { code: '2050',  name: 'Accrued Liabilities',            category: 'Liability' },
  { code: '2100',  name: 'Long-Term Debt – CAD',            category: 'Liability' },
  { code: '2101',  name: 'Current Portion – LTD (CAD)',     category: 'Liability' },
  { code: '2110',  name: 'Long-Term Debt – USD',            category: 'Liability' },
  { code: '2120',  name: 'Shareholder Loans',              category: 'Liability' },
  { code: '2130',  name: 'Mortgage Payable',               category: 'Liability' },
  { code: '2200',  name: 'Line of Credit',                 category: 'Liability' },
  { code: '2300',  name: 'Accrued Interest Payable',       category: 'Liability' },
  { code: '2400',  name: 'Total Current Liabilities',      category: 'Liability' },
  { code: '2500',  name: 'Total Long-Term Liabilities',    category: 'Liability' },
  { code: '2600',  name: 'Total Liabilities',              category: 'Liability' },
  // Equity
  { code: '3000',  name: "Total Shareholders' Equity",      category: 'Equity'    },
  { code: '3100',  name: 'Retained Earnings',              category: 'Equity'    },
  // Debt Service
  { code: 'DS01',  name: 'Annual Principal Payments',      category: 'DebtSvc'   },
  { code: 'DS02',  name: 'Annual Interest Payments',       category: 'DebtSvc'   },
  { code: 'DS03',  name: 'Total Annual Debt Service',      category: 'DebtSvc'   },
  // Computed
  { code: 'WKCAP', name: 'Net Working Capital',            category: 'Computed'  },
  { code: '3200',  name: 'Tangible Net Worth',             category: 'Computed'  },
];

export const GL_CATEGORY_ORDER: GlCategory[] = [
  'Computed', 'DebtSvc', 'Income', 'Expense', 'Asset', 'Liability', 'Equity',
];

export const GL_CATEGORY_LABELS: Record<GlCategory, string> = {
  Computed:  'Computed / Subtotals',
  DebtSvc:   'Debt Service',
  Income:    'Income',
  Expense:   'Expenses',
  Asset:     'Assets',
  Liability: 'Liabilities',
  Equity:    'Equity',
};

// ─── Formula Computation ─────────────────────────────────────────────────────

export function computeFormula(
  numLines: CovenantFormulaLine[],
  denLines: CovenantFormulaLine[] | undefined,
  isRatio: boolean,
  useProjected: boolean,
): number {
  const getAmt = (l: CovenantFormulaLine) =>
    (useProjected ? l.projectedAmount : l.amount) * l.multiplier * (l.sign === '+' ? 1 : -1);

  const numerator = numLines.reduce((s, l) => s + getAmt(l), 0);

  if (isRatio && denLines && denLines.length > 0) {
    const denominator = denLines.reduce((s, l) => s + getAmt(l), 0);
    return denominator !== 0 ? numerator / denominator : 0;
  }
  return numerator;
}

export function getProjectedStatus(
  projectedValue: number,
  threshold: number,
  operator: '>=' | '<=' | '>' | '<',
): CovenantStatus {
  const meets =
    (operator === '>=' && projectedValue >= threshold) ||
    (operator === '>'  && projectedValue >  threshold) ||
    (operator === '<=' && projectedValue <= threshold) ||
    (operator === '<'  && projectedValue <  threshold);

  if (!meets) return 'Breached';

  const headroomPct =
    (operator === '>=' || operator === '>')
      ? (projectedValue / threshold - 1) * 100
      : (threshold / projectedValue - 1) * 100;

  return headroomPct < 15 ? 'At Risk' : 'OK';
}

// ─── Standard Covenant Templates ─────────────────────────────────────────────

type TemplateLine = Omit<CovenantFormulaLine, 'id'>;

export interface CovenantTemplate {
  id: string;
  label: string;
  description: string;
  operator: '>=' | '<=' | '>' | '<';
  threshold: number;
  isRatio: boolean;
  numeratorLines: TemplateLine[];
  denominatorLines?: TemplateLine[];
}

const L = (
  sign: '+' | '-',
  description: string,
  glAccount: string,
  multiplier = 1,
): TemplateLine => ({ sign, description, glAccount, amount: 0, projectedAmount: 0, multiplier });

export const COVENANT_TEMPLATES: CovenantTemplate[] = [
  {
    id: 'DSCR',
    label: 'DSCR – Debt Service Coverage Ratio',
    description: 'EBITDA ÷ (Principal + Interest) ≥ threshold',
    operator: '>=', threshold: 1.25, isRatio: true,
    numeratorLines: [
      L('+', 'EBITDA',                    '6500'),
    ],
    denominatorLines: [
      L('+', 'Annual Principal Payments',  'DS01'),
      L('+', 'Annual Interest Payments',   'DS02'),
    ],
  },
  {
    id: 'FCCR',
    label: 'FCCR – Fixed Charge Coverage Ratio',
    description: '(EBITDA – CapEx – Taxes) ÷ Total Debt Service ≥ threshold',
    operator: '>=', threshold: 1.10, isRatio: true,
    numeratorLines: [
      L('+', 'EBITDA',               '6500'),
      L('-', 'Capital Expenditures', 'CAPEX'),
      L('-', 'Income Tax Expense',   'TAXES'),
    ],
    denominatorLines: [
      L('+', 'Total Annual Debt Service', 'DS03'),
    ],
  },
  {
    id: 'DebtToEBITDA',
    label: 'Debt-to-EBITDA',
    description: 'Total Funded Debt ÷ EBITDA ≤ threshold',
    operator: '<=', threshold: 4.0, isRatio: true,
    numeratorLines: [
      L('+', 'Total Funded Debt',   '2600'),
    ],
    denominatorLines: [
      L('+', 'EBITDA (TTM)',        '6500'),
    ],
  },
  {
    id: 'InterestCoverage',
    label: 'Interest Coverage (TIE)',
    description: 'EBIT ÷ Interest Expense ≥ threshold',
    operator: '>=', threshold: 3.0, isRatio: true,
    numeratorLines: [
      L('+', 'EBIT',              '6520'),
    ],
    denominatorLines: [
      L('+', 'Interest Expense',  '7100'),
    ],
  },
  {
    id: 'CurrentRatio',
    label: 'Current Ratio',
    description: 'Current Assets ÷ Current Liabilities ≥ threshold',
    operator: '>=', threshold: 1.20, isRatio: true,
    numeratorLines: [
      L('+', 'Total Current Assets',       '1400'),
    ],
    denominatorLines: [
      L('+', 'Total Current Liabilities',  '2400'),
    ],
  },
  {
    id: 'QuickRatio',
    label: 'Quick Ratio (Acid Test)',
    description: '(Cash + Receivables) ÷ Current Liabilities ≥ threshold',
    operator: '>=', threshold: 1.0, isRatio: true,
    numeratorLines: [
      L('+', 'Cash & Cash Equivalents', '1000'),
      L('+', 'Accounts Receivable',     '1100'),
    ],
    denominatorLines: [
      L('+', 'Total Current Liabilities', '2400'),
    ],
  },
  {
    id: 'TangibleNetWorth',
    label: 'Tangible Net Worth',
    description: "Total Equity less Intangibles ≥ minimum",
    operator: '>=', threshold: 2_000_000, isRatio: false,
    numeratorLines: [
      L('+', "Total Shareholders' Equity",  '3000'),
      L('-', 'Goodwill',                    '1600'),
      L('-', 'Other Intangible Assets',     '1700'),
    ],
  },
  {
    id: 'MinCash',
    label: 'Minimum Cash Balance',
    description: 'Unrestricted cash ≥ minimum threshold at all times',
    operator: '>=', threshold: 500_000, isRatio: false,
    numeratorLines: [
      L('+', 'Cash – Main Operating Account', '1000'),
      L('+', 'Cash – Reserve Account',        '1001'),
    ],
  },
  {
    id: 'NetDebtToEBITDA',
    label: 'Net Debt-to-EBITDA',
    description: '(Total Debt – Cash) ÷ EBITDA ≤ threshold',
    operator: '<=', threshold: 3.5, isRatio: true,
    numeratorLines: [
      L('+', 'Total Liabilities',        '2600'),
      L('-', 'Cash & Cash Equivalents',  '1000'),
    ],
    denominatorLines: [
      L('+', 'EBITDA (TTM)',             '6500'),
    ],
  },
  {
    id: 'LeverageRatio',
    label: 'Leverage (Debt-to-Assets)',
    description: 'Total Liabilities ÷ Total Assets ≤ threshold',
    operator: '<=', threshold: 0.60, isRatio: true,
    numeratorLines: [
      L('+', 'Total Liabilities', '2600'),
    ],
    denominatorLines: [
      L('+', 'Total Assets',      '1800'),
    ],
  },
  {
    id: 'DebtToEquity',
    label: 'Debt-to-Equity',
    description: 'Total Liabilities ÷ Total Equity ≤ threshold',
    operator: '<=', threshold: 2.5, isRatio: true,
    numeratorLines: [
      L('+', 'Total Liabilities',           '2600'),
    ],
    denominatorLines: [
      L('+', "Total Shareholders' Equity",  '3000'),
    ],
  },
  {
    id: 'WorkingCapital',
    label: 'Minimum Working Capital',
    description: 'Current Assets − Current Liabilities ≥ minimum amount',
    operator: '>=', threshold: 500_000, isRatio: false,
    numeratorLines: [
      L('+', 'Total Current Assets',       '1400'),
      L('-', 'Total Current Liabilities',  '2400'),
    ],
  },
  {
    id: 'MinNetWorth',
    label: 'Minimum Net Worth',
    description: "Total shareholders' equity ≥ minimum threshold",
    operator: '>=', threshold: 1_000_000, isRatio: false,
    numeratorLines: [
      L('+', "Total Shareholders' Equity", '3000'),
    ],
  },
  {
    id: 'MaxCapex',
    label: 'Maximum CapEx',
    description: 'Annual capital expenditures ≤ maximum threshold',
    operator: '<=', threshold: 1_000_000, isRatio: false,
    numeratorLines: [
      L('+', 'Capital Expenditures', 'CAPEX'),
    ],
  },
  {
    id: 'EBITDAMargin',
    label: 'EBITDA Margin',
    description: 'EBITDA ÷ Revenue ≥ threshold (decimal, e.g. 0.15 = 15%)',
    operator: '>=', threshold: 0.15, isRatio: true,
    numeratorLines: [
      L('+', 'EBITDA',   '6500'),
    ],
    denominatorLines: [
      L('+', 'Revenue',  '4000'),
    ],
  },
  {
    id: 'GrossMargin',
    label: 'Gross Margin',
    description: '(Revenue − COGS) ÷ Revenue ≥ threshold',
    operator: '>=', threshold: 0.30, isRatio: true,
    numeratorLines: [
      L('+', 'Revenue',       '4000'),
      L('-', 'Cost of Sales', '5000'),
    ],
    denominatorLines: [
      L('+', 'Revenue',       '4000'),
    ],
  },
  {
    id: 'DSR',
    label: 'Debt Service Reserve (months)',
    description: 'Cash ÷ Monthly Debt Service ≥ N months',
    operator: '>=', threshold: 3, isRatio: true,
    numeratorLines: [
      L('+', 'Cash & Cash Equivalents', '1000'),
    ],
    denominatorLines: [
      L('+', 'Monthly Debt Service (1/12 annual)', 'DS03', 0.0833),
    ],
  },
  {
    id: 'AssetCoverage',
    label: 'Asset Coverage Ratio',
    description: '(Total Assets − Current Liabilities) ÷ Total Debt ≥ threshold',
    operator: '>=', threshold: 1.5, isRatio: true,
    numeratorLines: [
      L('+', 'Total Assets',             '1800'),
      L('-', 'Total Current Liabilities', '2400'),
    ],
    denominatorLines: [
      L('+', 'Total Liabilities',         '2600'),
    ],
  },
  {
    id: 'SeniorDSCR',
    label: 'Senior DSCR',
    description: 'EBITDA ÷ Senior Debt Service only ≥ threshold',
    operator: '>=', threshold: 1.50, isRatio: true,
    numeratorLines: [
      L('+', 'EBITDA',                     '6500'),
    ],
    denominatorLines: [
      L('+', 'Senior Annual Principal Pmt', 'DS01'),
      L('+', 'Senior Annual Interest Pmt',  'DS02'),
    ],
  },
  {
    id: 'OperatingCFRatio',
    label: 'Operating Cash Flow Ratio',
    description: '(EBITDA − CapEx) ÷ Current Liabilities ≥ threshold',
    operator: '>=', threshold: 0.40, isRatio: true,
    numeratorLines: [
      L('+', 'EBITDA',               '6500'),
      L('-', 'Capital Expenditures', 'CAPEX'),
    ],
    denominatorLines: [
      L('+', 'Total Current Liabilities', '2400'),
    ],
  },
];
