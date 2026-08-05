/**
 * invPdfParser.ts
 * Client-side PDF text extraction for investment broker statements.
 * Supported formats:
 *   - Richardson Wealth Limited (JSK Partners / SEKO Wealth Advisors)
 *   - BMO InvestorLine Self-Directed
 */

let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
  return pdfjsLib;
}

// ─── Activity → standardised type ────────────────────────────────────────────
const ACTIVITY_TYPE_MAP: [string, string][] = [
  // BMO-specific (checked first, longer matches win)
  ['online banking',          'Transfer In'],
  ['multi-branch banking',    'Transfer'],
  ['transfer of funds',       'Transfer In'],
  ['bought',                  'Purchase'],
  ['sold',                    'Sale'],
  // Richardson Wealth
  ['buy',                     'Purchase'],
  ['sell',                    'Sale'],
  ['reinvested dividend',     'Reinvested Dividend'],
  ['cash distribution',       'Distribution'],
  ['bond interest',           'Interest'],
  ['interest in kind',        'Interest'],
  ['accrued interest',        'Interest'],
  ['return of capital',       'Return of Capital'],
  ['return of',               'Return of Capital'],
  ['iaa fee',                 'Fee/Commission'],
  ['pma fee',                 'Fee/Commission'],
  ['fee/frais',               'Fee/Commission'],
  ['goods & services',        'Fee/Commission'],
  ['goods and services',      'Fee/Commission'],
  ['fee payment',             'Transfer'],
  ['client movement',         'Transfer'],
  ['cash transfer',           'Transfer'],
  // Generic
  ['dividend',                'Dividend'],
  ['distribution',            'Distribution'],
  ['interest',                'Interest'],
  ['commission',              'Fee/Commission'],
  ['withholding',             'Withholding Tax'],
];

export function mapActivityToType(activity: string): string {
  const lower = activity.toLowerCase().trim();
  for (const [key, value] of ACTIVITY_TYPE_MAP) {
    if (lower.includes(key)) return value;
  }
  return activity;
}

// ─── Security → ticker lookup ────────────────────────────────────────────────
const SECURITY_TICKER_MAP: [string, string][] = [
  // BMO holdings
  ['CANADIAN IMPERIAL BANK OF COMMERCE', 'CM'],
  ['ENBRIDGE INC',                        'ENB'],
  ['TELUS CORPORATION',                   'T'],
  ['ROYAL BANK OF CANADA',               'RY'],
  ['POWER CORP OF CANADA',               'POW'],
  ['BANK OF MONTREAL',                   'BMO'],
  ['TORONTO-DOMINION BANK',              'TD'],
  ['BANK OF NOVA SCOTIA',                'BNS'],
  // Richardson Wealth
  ['ISHARES S&P/TSX 60 INDEX ETF',               'XIU'],
  ['ISHARES CORE S&P 500 INDEX CAD HEDGED ETF',  'XSP'],
  ['ISHARES MSCI EAFE INDEX ETF',                'XEF'],
  ['MACKENZIE CDN EQU ETF',                      'QCE'],
  ['MACKENZIE US SMALL-MID CAP',                 'MSCG'],
  ['ONT PROV',                                   'ONT'],
  ['ONTARIO PROVINCE',                           'ONT'],
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
];

function lookupTicker(security: string): string {
  const upper = security.toUpperCase();
  for (const [key, ticker] of SECURITY_TICKER_MAP) {
    if (upper.includes(key.toUpperCase())) return ticker;
  }
  return '';
}

// ─── TB account defaults ──────────────────────────────────────────────────────
export function defaultTbAccountForActivity(activity: string): string {
  const type = mapActivityToType(activity);
  switch (type) {
    case 'Purchase':
    case 'Sale':
    case 'Return of Capital':  return '1500';
    case 'Dividend':
    case 'Reinvested Dividend':
    case 'Distribution':       return '4100';
    case 'Interest':           return '4150';
    case 'Fee/Commission':     return '5200';
    case 'Withholding Tax':    return '5300';
    default:                   return '1100';
  }
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
const MONTHS: Record<string, string> = {
  jan:'01',january:'01',feb:'02',february:'02',mar:'03',march:'03',
  apr:'04',april:'04',may:'05',jun:'06',june:'06',jul:'07',july:'07',
  aug:'08',august:'08',sep:'09',sept:'09',september:'09',oct:'10',october:'10',
  nov:'11',november:'11',dec:'12',december:'12',
};

export function parseDate(raw: string): string {
  const s = raw.trim().replace(/\s+/g, ' ');

  // MM/DD/YYYY
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) return `${slash[3]}-${slash[1].padStart(2,'0')}-${slash[2].padStart(2,'0')}`;

  // MonDD,YYYY  or  Mon DD, YYYY  or  Month DD, YYYY
  const long = s.match(/^([A-Za-z]+)\.?\s*(\d{1,2})\s*,?\s*(\d{4})$/);
  if (long) {
    const mm = MONTHS[long[1].toLowerCase()];
    if (mm) return `${long[3]}-${mm}-${long[2].padStart(2,'0')}`;
  }

  return s;
}

function parseAmount(raw: string): number {
  const s = raw.trim();
  const neg = s.startsWith('(') || s.startsWith('-');
  const n = parseFloat(s.replace(/[(),\s$]/g, '').replace(/,/g, ''));
  return neg ? -Math.abs(n) : Math.abs(n);
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
  account: string;
  periodEnd: string;
  fxRateUsdCad: number | null;
  transactions: ParsedInvTransaction[];
  error?: string;
}

// ─── Line reconstruction from pdfjs items ───────────────────────────────────
function reconstructLines(
  items: Array<{ str: string; transform: number[] }>,
): string[] {
  const lineMap = new Map<number, string[]>();
  for (const item of items) {
    const y = Math.round(item.transform[5]);
    if (!lineMap.has(y)) lineMap.set(y, []);
    lineMap.get(y)!.push(item.str);
  }
  return Array.from(lineMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([, parts]) => parts.join(' ').trim())
    .filter(l => l.length > 0);
}

// ─── BMO InvestorLine parser ──────────────────────────────────────────────────
const BMO_DATE_RE = /^((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{1,2}\s*,?\s*\d{4})\s+/i;

// Activities that consume no security token (pure cash movements)
const BMO_CASH_ACTIVITIES = [
  'online banking', 'multi-branch banking', 'transfer of funds',
  'transferoffunds', 'onlinebanking', 'multi-branchbanking',
];

function parseBmoPage(
  lines: string[],
  account: string,
  broker: string,
  fxUsdCad: number | null,
  sourceFile: string,
  baseCount: number,
): ParsedInvTransaction[] {
  const txns: ParsedInvTransaction[] = [];
  let inActivity = false;
  let currentCcy: 'CAD' | 'USD' = 'CAD';

  for (const line of lines) {
    // Currency section switch
    if (/canadian dollar investments/i.test(line)) { currentCcy = 'CAD'; continue; }
    if (/u\.?s\.? dollar investments/i.test(line))  { currentCcy = 'USD'; continue; }

    // Enter/exit activity section
    if (/account activity for this month/i.test(line)) { inActivity = true; continue; }
    if (inActivity && /important information/i.test(line)) { inActivity = false; continue; }
    if (!inActivity) continue;

    // Skip known non-transaction lines
    if (/date\s+activity\s+description/i.test(line)) continue;
    if (/opening cash balance|closing cash balance/i.test(line)) continue;
    if (/no account activity/i.test(line)) continue;
    if (/this report includes/i.test(line)) continue;

    // Match date at start
    const dm = line.match(BMO_DATE_RE);
    if (!dm) continue;

    const settlementDate = parseDate(dm[1]);
    const rest = line.slice(dm[0].length).trim();
    if (!rest) continue;

    // Skip balance sentinel lines
    if (/^(opening|closing)\s*(cash)?\s*balance/i.test(rest)) continue;

    // Parse numbers right-to-left: [qty?, price?, commission?, amount]
    // Amount is always the last number (may be negative)
    const numRe = /(-?[\d,]+\.\d{2,4})/g;
    const numMatches = [...rest.matchAll(numRe)];
    if (numMatches.length === 0) continue;

    const rawAmount = numMatches[numMatches.length - 1][1];
    const amount = parseAmount(rawAmount);
    const amtIndex = rest.lastIndexOf(rawAmount);
    const beforeAmt = rest.slice(0, amtIndex).trim();

    // For integers like quantity "1,500" the regex won't match (no decimal) — add integer pattern
    const intRe = /(-?\d{1,3}(?:,\d{3})+|\d+)/g;
    const allNums = [...beforeAmt.matchAll(numRe), ...beforeAmt.matchAll(intRe)];

    // Work out activity + security from the non-numeric prefix
    // Find where the numbers start in beforeAmt
    const firstNumPos = beforeAmt.search(/\d/);
    const textPart = firstNumPos >= 0 ? beforeAmt.slice(0, firstNumPos).trim() : beforeAmt.trim();

    // Split text into activity (first word[s]) and security
    const words = textPart.split(/\s+/);
    let activity = words[0] || '';
    let security = '';

    // Check for two-word activities
    const twoWord = (words[0] + ' ' + (words[1] || '')).toLowerCase();
    if (ACTIVITY_TYPE_MAP.some(([k]) => k === twoWord)) {
      activity = words[0] + ' ' + (words[1] || '');
      security = words.slice(2).join(' ');
    } else {
      activity = words[0];
      security = words.slice(1).join(' ');
    }

    // Cash activities have no meaningful security
    if (BMO_CASH_ACTIVITIES.includes(activity.toLowerCase().replace(/\s+/g,''))) {
      security = '';
    }

    // Quantity: look for last integer before amount (e.g. "1,500", "-800")
    let quantity: number | null = null;
    let price: number | null = null;
    const qtyMatch = beforeAmt.match(/-?\d{1,3}(?:,\d{3})+|-?\d{3,}/);
    if (qtyMatch) {
      quantity = Math.abs(parseFloat(qtyMatch[0].replace(/,/g, '')));
      if (quantity > 1_000_000_000) quantity = null;
    }
    // Price: second-to-last decimal number before amount
    const decNums = [...beforeAmt.matchAll(/[\d,]+\.\d{2,4}/g)].map(m => parseFloat(m[1]?.replace(/,/,'') ?? m[0].replace(/,/g,'')));
    if (decNums.length >= 2) price = decNums[decNums.length - 2];
    else if (decNums.length === 1 && !quantity) price = decNums[0];

    const ticker = lookupTicker(security);
    // CAD amount; USD transactions multiplied by FX
    const amountCad = currentCcy === 'USD' ? amount * (fxUsdCad ?? 1) : amount;

    txns.push({
      id: `bmo-${account}-${settlementDate}-${baseCount + txns.length}`,
      settlementDate,
      tradeDate: settlementDate, // BMO shows settlement date only
      activity,
      security: security.trim(),
      ticker,
      quantity,
      price,
      amount: amountCad,
      currency: currentCcy,
      fxRate: currentCcy === 'USD' ? fxUsdCad : null,
      account,
      accountType: 'Self-Directed',
      broker,
      sourceFile,
    });
  }

  return txns;
}

// ─── Richardson Wealth parser (original logic, lightly refactored) ────────────
function parseRichardsonPage(
  lines: string[],
  currentAccount: string,
  currentAccountType: string,
  fxRateUsdCad: number | null,
  broker: string,
  sourceFile: string,
  baseCount: number,
): { txns: ParsedInvTransaction[]; account: string; accountType: string } {
  const txns: ParsedInvTransaction[] = [];
  let account = currentAccount;
  let accountType = currentAccountType;
  let inActivitySection = false;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];

    const acctMatch = line.match(/(H\d{2}-[A-Z0-9]+-[A-Z])\s*\((?:CAD|USD)\)/);
    if (acctMatch) {
      account = acctMatch[1];
      accountType = line.toLowerCase().includes('iaa') ? 'IAA'
        : line.toLowerCase().includes('pma') ? 'PMA' : '';
    }

    if (/details of your account activity/i.test(line)) { inActivitySection = true; continue; }
    if (inActivitySection && /holdings for your/i.test(line)) { inActivitySection = false; continue; }
    if (!inActivitySection) continue;

    if (/settlement\s+net\s+value/i.test(line)) continue;
    if (/activity\s+price/i.test(line)) continue;
    if (/opening cash balance|closing cash balance/i.test(line)) continue;
    if (/transactions\s+(settled|backdated)/i.test(line)) continue;

    const dateMatch = line.match(/^(\d{2}\/\d{2}\/\d{4})/);
    if (!dateMatch) continue;

    const rawDate = dateMatch[1];
    const rest = line.slice(rawDate.length).trim();

    const amountMatch = rest.match(/([\d,]+\.\d{2}|\(\d[\d,]*\.\d{2}\))\s*$/);
    if (!amountMatch) continue;

    const amount = parseAmount(amountMatch[1]);
    const beforeAmount = rest.slice(0, rest.lastIndexOf(amountMatch[1])).trim();

    const priceMatch = beforeAmount.match(/([\d,]+\.\d{2,4})\s*$/);
    let price: number | null = null;
    let beforePrice = beforeAmount;
    if (priceMatch) {
      const c = parseFloat(priceMatch[1].replace(',', ''));
      if (c > 0 && c < 100000) { price = c; beforePrice = beforeAmount.slice(0, beforeAmount.lastIndexOf(priceMatch[1])).trim(); }
    }

    const activityMatch = beforePrice.match(/^([A-Za-z&/\s]+?)(?:\s{2,}|\t)/);
    let activity = activityMatch ? activityMatch[1].trim() : beforePrice.split(/\s{2,}/)[0].trim();
    let security = beforePrice.slice(activity.length).trim();

    let quantity: number | null = null;
    const qtyInSec = security.match(/^([\d,]+(?:\.\d+)?)\s+/);
    if (qtyInSec) {
      const q = parseFloat(qtyInSec[1].replace(',', ''));
      if (q > 0 && q < 1_000_000) { quantity = q; security = security.slice(qtyInSec[0].length).trim(); }
    }

    let fxRate: number | null = fxRateUsdCad;
    let currency: 'CAD' | 'USD' = 'CAD';
    if (li + 1 < lines.length) {
      const nx = lines[li + 1];
      const usdMatch = nx.match(/converted\s+usd\s*@\s*([\d.]+)/i);
      if (usdMatch) { fxRate = parseFloat(usdMatch[1]); currency = 'USD'; }
    }

    security = security.replace(/\s+-NL\s*\([^)]*\)\s*$/i, '').replace(/\s+\(NL[^)]*\)\s*$/i, '').replace(/\s+SEG\s*$/i, '').trim();

    txns.push({
      id: `pdf-${account}-${rawDate}-${baseCount + txns.length}`,
      settlementDate: parseDate(rawDate),
      tradeDate: parseDate(rawDate),
      activity,
      security: security || activity,
      ticker: lookupTicker(security),
      quantity,
      price,
      amount,
      currency,
      fxRate,
      account,
      accountType,
      broker,
      sourceFile,
    });
  }

  return { txns, account, accountType };
}

// ─── Main extractor ────────────────────────────────────────────────────────────
export async function extractInvTransactions(file: File): Promise<InvPdfParseResult> {
  try {
    const lib = await getPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;

    // Collect full text for broker/account detection
    const allItems: Array<{ str: string; transform: number[] }>[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      allItems.push(content.items as Array<{ str: string; transform: number[] }>);
    }
    const fullText = allItems.flat().map(x => x.str).join(' ');

    // ── Detect broker ──────────────────────────────────────────────────────
    let broker = 'Unknown';
    let isBmo = false;
    let isRichardson = false;

    if (/bmo\s*investor\s*line/i.test(fullText)) {
      broker = 'BMO InvestorLine'; isBmo = true;
    } else if (/richardson\s*wealth/i.test(fullText) || /jsk\s*partners/i.test(fullText)) {
      broker = 'Richardson Wealth Limited'; isRichardson = true;
    }

    // ── Common header fields ───────────────────────────────────────────────
    const fxMatch = fullText.match(/1\s*USD\s*=\s*([\d.]+)\s*CAD/i);
    const fxRateUsdCad = fxMatch ? parseFloat(fxMatch[1]) : null;

    // Account number from document
    let account = '';
    if (isBmo) {
      const bmoAcct = fullText.match(/non-registered\s*account\s*#?\s*([\d-]+)/i)
                   ?? fullText.match(/account\s*#\s*([\d-]+)/i);
      if (bmoAcct) account = bmoAcct[1].replace(/\s+/g, '');
    } else {
      const rAcct = fullText.match(/(H\d{2}-[A-Z0-9]+-[A-Z])/);
      if (rAcct) account = rAcct[1];
    }

    const holderMatch = fullText.match(/([A-Z][A-Z\s]+(?:LTD|INC|CORP)\.?)/);
    const accountHolder = holderMatch ? holderMatch[1].trim() : '';

    // Period end
    let periodEnd = '';
    if (isBmo) {
      // "January 31, 2025" or "January31,2025"
      const pm = fullText.match(/([A-Za-z]+\s*\d{1,2}\s*,\s*\d{4})/);
      if (pm) periodEnd = parseDate(pm[1]);
    } else {
      const pm = fullText.match(/(?:period ending|as at|statement date)[:\s]+([A-Za-z]+\.?\s+\d{1,2},?\s+\d{4})/i);
      if (pm) periodEnd = parseDate(pm[1]);
    }

    // ── Parse transactions ─────────────────────────────────────────────────
    const transactions: ParsedInvTransaction[] = [];
    let richAccount = account;
    let richAccountType = '';

    for (let pi = 0; pi < allItems.length; pi++) {
      const lines = reconstructLines(allItems[pi]);

      if (isBmo) {
        const pageTxns = parseBmoPage(lines, account, broker, fxRateUsdCad, file.name, transactions.length);
        transactions.push(...pageTxns);
      } else if (isRichardson) {
        const { txns, account: a, accountType: at } = parseRichardsonPage(
          lines, richAccount, richAccountType, fxRateUsdCad, broker, file.name, transactions.length
        );
        transactions.push(...txns);
        richAccount = a;
        richAccountType = at;
      }
    }

    return { broker, accountHolder, account, periodEnd, fxRateUsdCad, transactions };
  } catch (err) {
    return {
      broker: 'Unknown', accountHolder: '', account: '', periodEnd: '',
      fxRateUsdCad: null, transactions: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Enforce single-broker constraint */
export function validateSingleBroker(results: InvPdfParseResult[]): { valid: boolean; error?: string } {
  const brokers = [...new Set(results.map(r => r.broker).filter(b => b !== 'Unknown'))];
  if (brokers.length > 1) {
    return { valid: false, error: `Multiple brokers detected: ${brokers.join(' and ')}. Only one broker's statements can be uploaded at a time.` };
  }
  return { valid: true };
}
