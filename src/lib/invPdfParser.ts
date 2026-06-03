/**
 * invPdfParser.ts
 * Client-side PDF text extraction and transaction parsing for investment broker statements.
 * Supports Richardson Wealth Limited (JSK Partners / SEKO Wealth Advisors) format.
 */

// Dynamic import to avoid SSR issues with pdfjs worker
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    // Use CDN worker to avoid bundler issues
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
  return pdfjsLib;
}

// ─── Activity → standardised type mapping ────────────────────────────────────
const ACTIVITY_TYPE_MAP: Record<string, string> = {
  'buy':                   'Purchase',
  'sell':                  'Sale',
  'dividend':              'Dividend',
  'reinvested dividend':   'Reinvested Dividend',
  'cash distribution':     'Distribution',
  'bond interest':         'Interest',
  'interest in kind':      'Interest',
  'accrued interest':      'Interest',
  'return of capital':     'Return of Capital',
  'return of':             'Return of Capital',
  'iaa fee':               'Fee/Commission',
  'pma fee':               'Fee/Commission',
  'fee/frais':             'Fee/Commission',
  'goods & services':      'Fee/Commission',
  'goods and services':    'Fee/Commission',
  'fee payment':           'Transfer',
  'client movement':       'Transfer',
  'cash transfer':         'Transfer',
};

export function mapActivityToType(activity: string): string {
  const lower = activity.toLowerCase();
  for (const [key, value] of Object.entries(ACTIVITY_TYPE_MAP)) {
    if (lower.includes(key)) return value;
  }
  return activity; // fallback to raw activity
}

// ─── Known security → ticker ─────────────────────────────────────────────────
const SECURITY_TICKER_MAP: [string, string][] = [
  ['ISHARES S&P/TSX 60 INDEX ETF',               'XIU'],
  ['ISHARES CORE S&P 500 INDEX CAD HEDGED ETF',  'XSP'],
  ['ISHARES MSCI EAFE INDEX ETF',                'XEF'],
  ['MACKENZIE CDN EQU ETF',                      'QCE'],
  ['MACKENZIE US SMALL-MID CAP',                 'MSCG'],
  ['BANK OF NOVA SCOTIA',                        'BNS'],
  ['CIBC',                                       'CM'],
  ['TELUS CORP',                                 'T'],
  ['ONTARIO PROVINCE',                           'ONT'],
  ['ONT PROV',                                   'ONT'],
  ['RBC 1.833',                                  'RY'],
  ['REVESCO CANADIAN HOLDINGS',                  'REVESCO'],
  ['ACM COMMERCIAL MORTGAGE FUND',               'ACMCMF'],
  ['RISE PROPERTIES TRUST',                      'RISE'],
  ['KENSINGTON PRIVATE EQUITY',                  'KPE'],
  ['PRIMEVESTFUND',                              'PVF'],
  ['FOUR QUADRANT GLOBAL REAL ESTATE',           'FQGRE'],
  ['PURPOSE TACTICAL ASSET ALLOC',               'PTAF'],
  ['CAPITAL GROUP GLOBAL EQUITY FUND',           'CGGE'],
  ['GQG PARTNERS INTERNATIONAL',                 'GQG'],
  ['LYSANDER-CANSO CORPORATE VALUE BOND',        'LCVB'],
  ['HIGH INTEREST SAVINGS ACCOUNT',              'HISA'],
  ['BNS CORPORATE TIERED INVESTMENT SAVINGS',    'BNSISA'],
  ['REGIMEN EQUITY PARTNERS',                    'REGPREF'],
  ['LAUR BK OF CDA',                             'LB'],
  ['CANADIAN WESTERN BANK',                      'CWB'],
  ['S/R LPU HEPF',                               'HEPF'],
];

function lookupTicker(security: string): string {
  const upper = security.toUpperCase();
  for (const [key, ticker] of SECURITY_TICKER_MAP) {
    if (upper.includes(key.toUpperCase())) return ticker;
  }
  return '';
}

// ─── TB account defaults by type ─────────────────────────────────────────────
export function defaultTbAccountForActivity(activity: string): string {
  const type = mapActivityToType(activity);
  switch (type) {
    case 'Purchase':          return '1500';
    case 'Sale':              return '1500';
    case 'Dividend':
    case 'Reinvested Dividend':
    case 'Distribution':      return '4100';
    case 'Interest':
    case 'Bond Interest':
    case 'Unit Distribution': return '4150';
    case 'Return of Capital': return '1500';
    case 'Fee/Commission':    return '5200';
    case 'Withholding Tax':   return '5300';
    case 'Transfer':
    case 'Transfer In':
    case 'Transfer Out':      return '1100';
    default:                  return '1500';
  }
}

// ─── Date parsing ─────────────────────────────────────────────────────────────
/** Normalise various date formats to YYYY-MM-DD */
function parseDate(raw: string): string {
  const s = raw.trim();

  // MM/DD/YYYY
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[1].padStart(2,'0')}-${slashMatch[2].padStart(2,'0')}`;
  }

  // Month. DD, YYYY  e.g. "Aug. 31, 2023" or "August 31, 2023"
  const MONTHS: Record<string,string> = {
    jan:'01',january:'01',feb:'02',february:'02',mar:'03',march:'03',
    apr:'04',april:'04',may:'05',jun:'06',june:'06',jul:'07',july:'07',
    aug:'08',august:'08',sep:'09',sept:'09',september:'09',oct:'10',october:'10',
    nov:'11',november:'11',dec:'12',december:'12',
  };
  const longMatch = s.match(/^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/);
  if (longMatch) {
    const mm = MONTHS[longMatch[1].toLowerCase()];
    if (mm) return `${longMatch[3]}-${mm}-${longMatch[2].padStart(2,'0')}`;
  }

  return s; // return as-is if unrecognised
}

// ─── Amount parsing ───────────────────────────────────────────────────────────
/** Convert "(1,234.56)" or "-1234.56" or "1,234.56" to number */
function parseAmount(raw: string): number {
  const s = raw.trim();
  const negative = s.startsWith('(') || s.startsWith('-');
  const clean = s.replace(/[(),\s$]/g, '');
  const n = parseFloat(clean);
  return negative ? -Math.abs(n) : Math.abs(n);
}

// ─── Exported types ───────────────────────────────────────────────────────────
export interface ParsedInvTransaction {
  id: string;
  settlementDate: string;
  tradeDate: string;
  activity: string;
  security: string;
  ticker: string;
  quantity: number | null;
  price: number | null;
  amount: number;
  currency: 'CAD' | 'USD';
  fxRate: number | null;
  account: string;
  accountType: string;
  broker: string;
  sourceFile: string;
}

export interface InvPdfParseResult {
  broker: string;
  accountHolder: string;
  periodEnd: string;
  fxRateUsdCad: number | null;
  transactions: ParsedInvTransaction[];
  error?: string;
}

// ─── Main parser ──────────────────────────────────────────────────────────────
export async function extractInvTransactions(file: File): Promise<InvPdfParseResult> {
  try {
    const lib = await getPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;

    // Collect all page text
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ('str' in item ? (item as { str: string }).str : ''))
        .join(' ');
      pages.push(text);
    }

    const fullText = pages.join('\n');

    // ── Extract header info ────────────────────────────────────────────────
    let broker = 'Unknown';
    if (/richardson\s*wealth/i.test(fullText))   broker = 'Richardson Wealth Limited';
    else if (/jsk\s*partners/i.test(fullText))   broker = 'Richardson Wealth Limited';
    else if (/seko\s*wealth/i.test(fullText))    broker = 'Richardson Wealth Limited';

    const holderMatch = fullText.match(/([A-Z][A-Z\s]+LTD\.?|[A-Z][A-Z\s]+INC\.?|[A-Z][A-Z\s]+CORP\.?)/);
    const accountHolder = holderMatch ? holderMatch[1].trim() : '';

    const fxMatch = fullText.match(/\$1\s*USD\s*=\s*\$?([\d.]+)\s*CAD/i);
    const fxRateUsdCad = fxMatch ? parseFloat(fxMatch[1]) : null;

    const periodMatch = fullText.match(/(?:period ending|as at|statement date)[:\s]+([A-Za-z]+\.?\s+\d{1,2},?\s+\d{4})/i);
    const periodEnd = periodMatch ? parseDate(periodMatch[1]) : '';

    // ── Parse transactions per page ────────────────────────────────────────
    const transactions: ParsedInvTransaction[] = [];

    // We process page text with line-oriented approach
    for (let pi = 1; pi <= pdf.numPages; pi++) {
      const page = await pdf.getPage(pi);
      const content = await page.getTextContent();

      // Reconstruct lines by grouping items with similar Y coordinates
      const items = content.items as Array<{ str: string; transform: number[] }>;
      const lineMap = new Map<number, string[]>();
      for (const item of items) {
        const y = Math.round(item.transform[5]);
        if (!lineMap.has(y)) lineMap.set(y, []);
        lineMap.get(y)!.push(item.str);
      }
      const lines = Array.from(lineMap.entries())
        .sort((a, b) => b[0] - a[0]) // top to bottom
        .map(([, parts]) => parts.join(' ').trim())
        .filter(l => l.length > 0);

      // Find account sections
      let currentAccount = '';
      let currentAccountType = '';
      let inActivitySection = false;

      for (let li = 0; li < lines.length; li++) {
        const line = lines[li];

        // Detect account header
        const acctMatch = line.match(/(H\d{2}-[A-Z0-9]+-[A-Z])\s*\((?:CAD|USD)\)/);
        if (acctMatch) {
          currentAccount = acctMatch[1];
          currentAccountType = line.toLowerCase().includes('iaa') || line.toLowerCase().includes('investment advice') ? 'IAA'
            : line.toLowerCase().includes('pma') || line.toLowerCase().includes('portfolio managed') ? 'PMA'
            : '';
        }

        // Enter activity section
        if (/details of your account activity/i.test(line)) {
          inActivitySection = true;
          continue;
        }

        // Leave activity section on next holdings or new section
        if (inActivitySection && /holdings for your/i.test(line)) {
          inActivitySection = false;
          continue;
        }

        if (!inActivitySection) continue;

        // Skip header rows and balance lines
        if (/settlement\s+net\s+value/i.test(line)) continue;
        if (/activity\s+price/i.test(line)) continue;
        if (/opening cash balance|closing cash balance/i.test(line)) continue;
        if (/transactions\s+(settled|backdated)/i.test(line)) continue;

        // Date-prefixed transaction line: MM/DD/YYYY or Month DD, YYYY
        const dateMatch = line.match(/^(\d{2}\/\d{2}\/\d{4})/);
        if (!dateMatch) continue;

        const rawDate = dateMatch[1];
        const rest = line.slice(rawDate.length).trim();

        // Parse: Activity  SecurityName  [Quantity]  Price  Amount
        // Amount is typically the last number; price is second-to-last if present

        // Extract the amount (last numeric token, possibly in parens)
        const amountMatch = rest.match(/([\d,]+\.\d{2}|\(\d[\d,]*\.\d{2}\))\s*$/);
        if (!amountMatch) continue;

        const rawAmount = amountMatch[1];
        const amount = parseAmount(rawAmount);
        const beforeAmount = rest.slice(0, rest.lastIndexOf(amountMatch[1])).trim();

        // Extract price (second-to-last numeric if present)
        const priceMatch = beforeAmount.match(/([\d,]+\.\d{2,4})\s*$/);
        let price: number | null = null;
        let beforePrice = beforeAmount;
        if (priceMatch) {
          const candidate = parseFloat(priceMatch[1].replace(',', ''));
          // Heuristic: if candidate < 10000 and > 0, it's likely a price
          if (candidate > 0 && candidate < 100000) {
            price = candidate;
            beforePrice = beforeAmount.slice(0, beforeAmount.lastIndexOf(priceMatch[1])).trim();
          }
        }

        // Extract activity keyword (first word(s) of rest)
        const activityMatch = beforePrice.match(/^([A-Za-z&/\s]+?)(?:\s{2,}|\t)/);
        let activity = activityMatch ? activityMatch[1].trim() : beforePrice.split(/\s{2,}/)[0].trim();
        let security = beforePrice.slice(activity.length).trim();

        // Cleanup: some lines embed quantity in security description ("3,345 ISHARES ...")
        let quantity: number | null = null;
        const qtyInSec = security.match(/^([\d,]+(?:\.\d+)?)\s+/);
        if (qtyInSec) {
          const q = parseFloat(qtyInSec[1].replace(',', ''));
          if (q > 0 && q < 1_000_000) {
            quantity = q;
            security = security.slice(qtyInSec[0].length).trim();
          }
        }

        // Detect USD conversion on next line: "CONVERTED USD @ 1.32400"
        let fxRate: number | null = fxRateUsdCad;
        let currency: 'CAD' | 'USD' = 'CAD';
        if (li + 1 < lines.length) {
          const nextLine = lines[li + 1];
          const usdMatch = nextLine.match(/converted\s+usd\s*@\s*([\d.]+)/i);
          if (usdMatch) {
            fxRate = parseFloat(usdMatch[1]);
            currency = 'USD';
          }
        }

        // Cleanup security name — remove trailing qualifiers like "-NL (NL,F)" etc.
        security = security.replace(/\s+-NL\s*\([^)]*\)\s*$/i, '').trim();
        security = security.replace(/\s+\(NL[^)]*\)\s*$/i, '').trim();
        security = security.replace(/\s+SEG\s*$/i, '').trim();

        const ticker = lookupTicker(security);

        transactions.push({
          id: `pdf-${currentAccount}-${rawDate}-${transactions.length}`,
          settlementDate: parseDate(rawDate),
          tradeDate: parseDate(rawDate),
          activity,
          security: security || activity,
          ticker,
          quantity,
          price,
          amount,
          currency,
          fxRate,
          account: currentAccount,
          accountType: currentAccountType,
          broker,
          sourceFile: file.name,
        });
      }
    }

    return { broker, accountHolder, periodEnd, fxRateUsdCad, transactions };
  } catch (err) {
    return {
      broker: 'Unknown',
      accountHolder: '',
      periodEnd: '',
      fxRateUsdCad: null,
      transactions: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Check if a list of parse results are all from the same broker */
export function validateSingleBroker(results: InvPdfParseResult[]): { valid: boolean; error?: string } {
  const brokers = [...new Set(results.map(r => r.broker).filter(b => b !== 'Unknown'))];
  if (brokers.length > 1) {
    return {
      valid: false,
      error: `Multiple brokers detected: ${brokers.join(' and ')}. Only one broker's statements can be uploaded at a time.`,
    };
  }
  return { valid: true };
}
