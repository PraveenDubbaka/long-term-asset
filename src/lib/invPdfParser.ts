/**
 * invPdfParser.ts
 * Universal investment statement extractor.
 * ZIP-format statements (Richardson Wealth, BMO): direct text parsing — no API key needed.
 * Other formats (standard PDF, XLSX, CSV, scanned PDF): falls back to Claude AI.
 */

import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';

// ─── Built-in Gemini key for universal extraction ────────────────────────────
// Fill this in with a real key from https://aistudio.google.com/app/apikey
// Gemini 1.5 Flash free tier: 15 req/min, 1M tokens/day
const BUILT_IN_GEMINI_KEY = 'AIzaSyD2bTSPGBhCJPGMvqzUHT9Ej7kX9mN4R8c';

let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
  }
  return pdfjsLib;
}

// ─── Activity type map ────────────────────────────────────────────────────────

const ACTIVITY_TYPE_MAP: [string, string][] = [
  // Transfers
  ['online banking',        'Transfer In'],
  ['transfer of funds',     'Transfer In'],
  ['transferof funds',      'Transfer In'],
  ['transfer of',           'Transfer In'],
  ['instabank',             'Transfer In'],
  ['multi-branch banking',  'Transfer'],
  ['client movement',       'Transfer'],
  ['cash transfer',         'Transfer'],
  ['fee payment',           'Transfer'],
  ['switch',                'Transfer'],
  // Purchases / Sales
  ['bought',                'Purchase'],
  ['sold',                  'Sale'],
  ['buy',                   'Purchase'],
  ['sell',                  'Sale'],
  ['exercise',              'Purchase'],
  // Income — specific first, generic after
  ['reinvested dividend',   'Reinvested Dividend'],
  ['cash distribution',     'Distribution'],
  ['bond interest',         'Interest'],
  ['interest in kind',      'Interest'],
  ['accrued interest',      'Interest'],
  ['return of capital',     'Return of Capital'],
  ['return of',             'Return of Capital'],
  ['matured',               'Return of Capital'],
  // Fees
  ['iaa fee',               'Fee/Commission'],
  ['pma fee',               'Fee/Commission'],
  ['fee/frais',             'Fee/Commission'],
  ['goods & services',      'Fee/Commission'],
  ['goods and services',    'Fee/Commission'],
  ['goods',                 'Fee/Commission'],
  // Generic — after all specifics
  ['dividend',              'Dividend'],
  ['distribution',          'Distribution'],
  ['interest',              'Interest'],
  ['commission',            'Fee/Commission'],
  ['withholding',           'Withholding Tax'],
];

export function mapActivityToType(activity: string): string {
  const normalized = activity
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase().trim();
  for (const [key, value] of ACTIVITY_TYPE_MAP) {
    if (normalized.includes(key) || key.includes(normalized)) return value;
  }
  return activity;
}

// ─── Security → ticker lookup ─────────────────────────────────────────────────

const SECURITY_TICKER_MAP: [string, string][] = [
  ['CANADIAN IMPERIAL BANK OF COMMERCE', 'CM'],
  ['ENBRIDGE INC',                        'ENB'],
  ['TELUS CORPORATION',                   'T'],
  ['ROYAL BANK OF CANADA',               'RY'],
  ['POWER CORP OF CANADA',               'POW'],
  ['BANK OF MONTREAL',                   'BMO'],
  ['TORONTO-DOMINION BANK',              'TD'],
  ['BANK OF NOVA SCOTIA',                'BNS'],
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
  // TD Direct Investing securities
  ['DIVIDEND 15 SPLIT CORP PF',                 'DFN.PR.A'],  // before generic DFN
  ['DIVIDEND 15 SPLIT CORP',                    'DFN'],
  ['E SPLIT CORP CL-A',                         'ENS'],
  ['E SPLIT CORP',                              'ENS'],
  ['MINEROS',                                   'MSA'],
  ['GLOBAL DIV GRW SPLT CRP',                  'GDV'],
  ['GLOBAL DIV GRW',                            'GDV'],
  ['TOREX GOLD',                                'TXG'],
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
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) return `${slash[3]}-${slash[1].padStart(2,'0')}-${slash[2].padStart(2,'0')}`;
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

// ─── PDF text extraction ──────────────────────────────────────────────────────

async function extractPdfText(file: File): Promise<string[]> {
  const lib = await getPdfJs();
  const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items as Array<{ str: string; transform: number[] }>;
    const lineMap = new Map<number, Array<{ x: number; str: string }>>();
    for (const item of items) {
      const rawY = item.transform[5];
      let bucketY: number | undefined;
      for (const y of lineMap.keys()) {
        if (Math.abs(y - rawY) <= 2) { bucketY = y; break; }
      }
      const key = bucketY ?? Math.round(rawY);
      if (!lineMap.has(key)) lineMap.set(key, []);
      lineMap.get(key)!.push({ x: item.transform[4], str: item.str });
    }
    const text = Array.from(lineMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([, parts]) => parts.sort((a, b) => a.x - b.x).map(p => p.str).join(' ').trim())
      .filter(l => l.length > 0)
      .join('\n');
    pages.push(text);
  }
  return pages;
}

// ─── ZIP extraction with broker detection ────────────────────────────────────

async function extractZipText(file: File): Promise<{ pages: string[]; broker: string } | null> {
  try {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const manifestFile = zip.file('manifest.json');
    if (!manifestFile) return null;
    const manifest = JSON.parse(await manifestFile.async('string')) as {
      pages: Array<{ page_number: number; text: { path: string } }>;
    };
    const pages: string[] = [];
    for (const pg of manifest.pages.sort((a, b) => a.page_number - b.page_number)) {
      const textFile = zip.file(pg.text.path);
      if (textFile) pages.push(await textFile.async('string'));
    }
    if (pages.length === 0) return null;
    const sample = pages.slice(0, 2).join(' ');
    let broker = 'Unknown';
    if (/richardson\s*wealth/i.test(sample) || /jsk\s*partners/i.test(sample)) {
      broker = 'Richardson Wealth Limited';
    } else if (/bmo\s*investor\s*line/i.test(sample) || /bmo\s*investorline/i.test(sample)) {
      broker = 'BMO InvestorLine';
    }
    return { pages, broker };
  } catch (err) {
    console.warn('[invPdfParser] extractZipText failed:', err);
    return null;
  }
}

// ─── Scanned PDF → images for Claude vision ──────────────────────────────────

async function renderPdfPagesToImages(file: File, maxPages: number): Promise<string[]> {
  const lib = await getPdfJs();
  const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  const images: string[] = [];
  const total = Math.min(pdf.numPages, maxPages);
  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    images.push(canvas.toDataURL('image/jpeg', 0.85).split(',')[1]);
  }
  return images;
}

// ─── Scanned PDF → Tesseract OCR ─────────────────────────────────────────────

async function ocrPdfPages(
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<string[]> {
  const { createWorker } = await import('tesseract.js');
  const lib = await getPdfJs();
  const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  const totalPages = pdf.numPages;
  const results: string[] = [];
  const worker = await createWorker('eng', 1, { logger: () => {} });
  try {
    for (let i = 1; i <= totalPages; i++) {
      onProgress?.(i, totalPages);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      const blob = await new Promise<Blob>(resolve =>
        canvas.toBlob(b => resolve(b!), 'image/png')
      );
      const { data: { text } } = await worker.recognize(blob);
      results.push(text);
      canvas.width = 0;
      canvas.height = 0;
    }
  } finally {
    await worker.terminate();
  }
  return results;
}

// ─── Richardson Wealth text parser ───────────────────────────────────────────

function parseRichardsonText(pages: string[], sourceFile: string): ParsedInvTransaction[] {
  const txns: ParsedInvTransaction[] = [];
  let account = '';
  let accountType = '';
  let fxRateUsdCad: number | null = null;
  let inActivitySection = false;
  let sectionEverSeen = false;

  const fullText = pages.join(' ');
  const fxMatch = fullText.match(/\$1USD\s*=\s*\$?([\d.]+)CAD/i)
                ?? fullText.match(/1\s*USD\s*=\s*([\d.]+)\s*CAD/i);
  if (fxMatch) fxRateUsdCad = parseFloat(fxMatch[1]);

  console.log('[parseRichardsonText] pages:', pages.length, 'preview:', pages[0]?.slice(0, 600));

  for (const pageText of pages) {
    const lines = pageText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];

      const acctMatch = line.match(/(H\d{2}-[A-Z0-9]+-[A-Z])\s*\((?:CAD|USD)\)/);
      if (acctMatch) {
        account = acctMatch[1];
        accountType = line.toLowerCase().includes('iaa') ? 'IAA'
          : line.toLowerCase().includes('pma') ? 'PMA' : '';
      }

      if (/details\s+of\s+your\s+account\s+activity/i.test(line)
        || /account\s+activity\s+for/i.test(line)
        || /transaction\s+history/i.test(line)
        || /account\s+transactions/i.test(line)) {
        inActivitySection = true; sectionEverSeen = true; continue;
      }
      if (inActivitySection && (/holdings\s+for\s+your/i.test(line)
        || /portfolio\s+holdings/i.test(line)
        || /summary\s+of\s+holdings/i.test(line))) {
        inActivitySection = false; continue;
      }

      // If section header was never found, treat entire document as activity (lenient mode)
      if (!inActivitySection && !sectionEverSeen) {
        // Skip obviously non-transaction lines when in lenient mode
        if (/^\s*(page|statement|account|address|dear|sincerely|Richardson|wealth|your advisor)/i.test(line)) continue;
      } else if (!inActivitySection) {
        continue;
      }

      if (/settlement\s+net\s+value/i.test(line)) continue;
      if (/activity\s+price/i.test(line)) continue;
      if (/opening cash balance|closing cash balance/i.test(line)) continue;
      if (/transactions\s+(settled|backdated)/i.test(line)) continue;

      // Match dates: DD/MM/YYYY, MM/DD/YYYY at start of line (1 or 2 digit day/month)
      const dateMatch = line.match(/^(\d{1,2}\/\d{1,2}\/\d{4})/);
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
        if (c > 0 && c < 100000) {
          price = c;
          beforePrice = beforeAmount.slice(0, beforeAmount.lastIndexOf(priceMatch[1])).trim();
        }
      }

      const words = beforePrice.split(/\s+/);
      let activity = words[0] || '';
      let security = '';
      let matched = false;
      for (let w = Math.min(4, words.length); w >= 1; w--) {
        const candidate = words.slice(0, w).join(' ').toLowerCase();
        if (ACTIVITY_TYPE_MAP.some(([k]) => candidate.includes(k) || k.includes(candidate))) {
          activity = words.slice(0, w).join(' ');
          security = words.slice(w).join(' ');
          matched = true;
          break;
        }
      }
      if (!matched) {
        activity = words[0] || '';
        security = words.slice(1).join(' ');
      }

      let quantity: number | null = null;
      // Format A: qty at START of remaining (Activity Qty Security ...)
      const qtyAtStart = security.match(/^([\d,]+(?:\.\d+)?)\s+(.+)$/);
      if (qtyAtStart) {
        const q = parseFloat(qtyAtStart[1].replace(/,/g, ''));
        if (q > 0 && q < 1_000_000) { quantity = q; security = qtyAtStart[2].trim(); }
      }
      // Format B: qty at END of remaining (Activity Security Qty ...) when price was found
      if (quantity === null && price !== null) {
        const qtyAtEnd = security.match(/^(.+\S)\s+([\d,]+(?:\.\d+)?)$/);
        if (qtyAtEnd) {
          const q = parseFloat(qtyAtEnd[2].replace(/,/g, ''));
          if (q > 0 && q < 1_000_000) { quantity = q; security = qtyAtEnd[1].trim(); }
        }
      }

      let fxRate: number | null = fxRateUsdCad;
      let currency: 'CAD' | 'USD' = 'CAD';
      if (li + 1 < lines.length) {
        const nx = lines[li + 1];
        const usdMatch = nx.match(/converted\s+usd\s*@\s*([\d.]+)/i);
        if (usdMatch) { fxRate = parseFloat(usdMatch[1]); currency = 'USD'; }
      }

      security = security
        .replace(/\s+-NL\s*\([^)]*\)\s*$/i, '')
        .replace(/\s+\(NL[^)]*\)\s*$/i, '')
        .replace(/\s+SEG\s*$/i, '')
        .trim();

      txns.push({
        id: `rw-${account}-${rawDate}-${txns.length}`,
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
        broker: 'Richardson Wealth Limited',
        sourceFile,
      });
    }
  }

  return txns;
}

// ─── BMO InvestorLine text parser ────────────────────────────────────────────

function respaceBmoLine(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]{2,})([A-Z][a-z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    .replace(/(\d)([A-Za-z])/g, '$1 $2')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function parseBmoText(pages: string[], sourceFile: string): ParsedInvTransaction[] {
  const txns: ParsedInvTransaction[] = [];
  const fullText = pages.join('\n');

  const fxMatch = fullText.match(/1\s*USD\s*=\s*([\d.]+)\s*CAD/i);
  const fxRateUsdCad = fxMatch ? parseFloat(fxMatch[1]) : null;

  const acctMatch = fullText.match(/Non-registered\s*account\s*#\s*([\d-]+)/i);
  const account = acctMatch ? acctMatch[1].replace(/\s+/g, '') : '';

  const DATE_RE = /^((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\s+/i;

  // Lines to skip entirely (headers, footers, balance lines)
  const SKIP_RE = [
    /Opening\s*Cash\s*Balance/i,
    /Closing\s*Cash\s*Balance/i,
    /Account\s*activity\s*for\s*this\s*month/i,
    /^Date\s+Activity/i,
    /^Cash\s*Account$/i,
    /This\s*report\s*includes/i,
    /^account\s*at:/i,
    /^\d+of\d+$/,
    /^\x95$/,
  ];

  // Continuation lines that are BMO boilerplate — discard, don't append to security
  const JUNK_RE = [
    /^CASH\s*DIV\s*ON\b/i,
    /^REC\s*\d/i,
    /^UNSOLICITED$/i,
    /^SUB-?VTG$/i,
    /^RELATED\s*OR\s*CONNECTED/i,
    /^RELATEDORCONNECTED/i,
    /^ASOF\d/i,
    /^\d{4}-[\d-]{6,}/,
    /^2\d{3}-\d{4}-\d/,
    // Page number artifacts: "4 of 7", "Page 4 of 7", "4of7"
    /^(?:page\s+)?\d+\s*of\s*\d+$/i,
    /^\d+\s+\d+\s+of\s+\d+$/i,
  ];

  // Activity types that have no associated security (cash movements)
  const NO_SECURITY_TYPES = new Set(['Transfer In', 'Transfer Out', 'Fee/Commission', 'Withholding Tax']);

  let inActivity = false;
  let currentCcy: 'CAD' | 'USD' = 'CAD';

  for (const pageText of pages) {
    // Apply date normalization then respacing to every line
    const lines = pageText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .map(l =>
        respaceBmoLine(
          l
            .replace(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(\d)/gi, '$1 $2')
            .replace(/(\d{1,2}),(\d{4})/g, '$1, $2')
        )
      );

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      if (/Canadian\s*Dollar\s*Investments/i.test(line)) { currentCcy = 'CAD'; i++; continue; }
      if (/U\.?S\.?\s*Dollar\s*Investments/i.test(line)) { currentCcy = 'USD'; i++; continue; }
      if (/Account\s*activity\s*for\s*this\s*month/i.test(line)) { inActivity = true; i++; continue; }
      if (inActivity && /important\s*information/i.test(line)) { inActivity = false; i++; continue; }
      if (!inActivity) { i++; continue; }
      if (SKIP_RE.some(re => re.test(line))) { i++; continue; }
      if (JUNK_RE.some(re => re.test(line))) { i++; continue; }

      const dateMatch = line.match(DATE_RE);
      if (!dateMatch) { i++; continue; }

      const rawDate = dateMatch[1];
      const firstChunk = line.slice(dateMatch[0].length).trim();

      // Collect continuation lines: non-date, non-skip lines that don't end
      // with a dollar amount (those are the start of a new transaction).
      // Discard junk lines but keep scanning past them.
      const continuationParts: string[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const nxt = lines[j];
        if (!nxt) { j++; continue; }
        if (DATE_RE.test(nxt)) break;
        if (SKIP_RE.some(re => re.test(nxt))) break;
        if (JUNK_RE.some(re => re.test(nxt))) { j++; continue; }
        if (/(-?[\d,]+\.\d{2})\s*$/.test(nxt)) break;
        continuationParts.push(nxt);
        j++;
      }
      i = j;

      // ── Parse numbers out of firstChunk ──────────────────────────────────
      const nums = [...firstChunk.matchAll(/(-?[\d,]+\.\d{2})/g)];
      if (nums.length === 0) continue;

      const rawAmount = nums[nums.length - 1][1];
      const amount = parseFloat(rawAmount.replace(/,/g, ''));
      const beforeAmt = firstChunk.slice(0, firstChunk.lastIndexOf(rawAmount)).trim();

      // ── Extract activity via longest-match against ACTIVITY_TYPE_MAP ──────
      const words = beforeAmt.split(/\s+/);
      let activity = words[0] || '';
      let securityFromFirst = '';

      for (let w = Math.min(5, words.length); w >= 1; w--) {
        const candidate = words.slice(0, w).join(' ').toLowerCase();
        if (ACTIVITY_TYPE_MAP.some(([k]) => candidate === k || k.includes(candidate))) {
          activity = words.slice(0, w).join(' ');
          securityFromFirst = words.slice(w).join(' ');
          break;
        } else if (w === 1) {
          securityFromFirst = words.slice(1).join(' ');
        }
      }

      // ── Strip embedded qty/price numbers from security fragment ───────────
      let secStr = securityFromFirst;
      secStr = secStr.replace(/\s+(-?[\d,]+\.\d+)\s*$/, '').trim();
      secStr = secStr.replace(/\s+(-?[\d,]+\.\d+)\s*$/, '').trim();
      secStr = secStr.replace(/\s+-?[\d,]+\s*$/, '').trim();

      // ── Append continuation lines (e.g. security name wrapping to next line)
      const security = [secStr, ...continuationParts].filter(Boolean).join(' ').trim();

      // ── For cash-movement types, security is blank ────────────────────────
      const txType = mapActivityToType(activity);
      const finalSecurity = NO_SECURITY_TYPES.has(txType) ? '' : security;

      // ── Extract qty and price from number positions ───────────────────────
      let quantity: number | null = null;
      let price: number | null = null;
      if (nums.length >= 3) {
        quantity = parseFloat(nums[nums.length - 3][1].replace(/,/g, ''));
        price    = parseFloat(nums[nums.length - 2][1].replace(/,/g, ''));
      } else if (nums.length === 2) {
        quantity = parseFloat(nums[nums.length - 2][1].replace(/,/g, ''));
      }

      const signedAmount = txType === 'Purchase' ? -Math.abs(amount) : Math.abs(amount);
      const amountCad = currentCcy === 'USD' ? signedAmount * (fxRateUsdCad ?? 1) : signedAmount;

      txns.push({
        id: `bmo-${account}-${rawDate.replace(/\s+/g, '')}-${txns.length}`,
        settlementDate: parseDate(rawDate),
        tradeDate: parseDate(rawDate),
        activity,
        security: finalSecurity,
        ticker: lookupTicker(finalSecurity),
        quantity: quantity && quantity > 0 ? quantity : null,
        price: price && price > 0 ? price : null,
        amount: amountCad,
        currency: currentCcy,
        fxRate: currentCcy === 'USD' ? fxRateUsdCad : null,
        account,
        accountType: 'Non-Registered',
        broker: 'BMO InvestorLine',
        sourceFile,
      });
    }
  }

  return txns;
}

// ─── TD Direct Investing parser ───────────────────────────────────────────────

export function parseTdDirectText(pages: string[], sourceFile: string): ParsedInvTransaction[] {
  const txns: ParsedInvTransaction[] = [];

  const MONTHS: Record<string, number> = {
    jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12
  };
  const DATE_LINE_RE = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})\s+(.+)/i;
  const PERIOD_YEAR_RE = /\d{1,2},?\s+(\d{4})\s+to\s+/i;
  const ORDER_NUM_RE = /^[A-Z]{1,3}-\d{4,}$/;
  const BALANCE_LINE_RE = /ending cash balance|beginning cash balance/i;
  const ACTIVITY_SECTION_RE = /activity in your account this period/i;
  const SKIP_LINE_RE = /^cash$|^date\s+activity|details of investment income|summary of your|your investment account/i;
  const KNOWN_ACTIVITIES = [
    'Reinvested Dividends','Web Banking Deposit','Web Banking Wdl','Web Banking Withdrawal',
    'Return of Capital','Withholding Tax','Transfer In','Transfer Out',
    'Dividends','Interest','Buy','Sell','Transfer','Fee','Commission',
  ];
  const ACT_SUFFIX_WORDS = new Set(['deposit','wdl','withdrawal']);
  const CASH_MOVE_RE = /web banking|transfer in|transfer out|^transfer$|^fee$|^commission$/i;

  interface Pending { date: string; s: string }
  let pending: Pending | null = null;
  let currentYear = new Date().getFullYear();

  function detectAct(text: string): { act: string; rest: string } {
    const u = text.toUpperCase();
    for (const a of KNOWN_ACTIVITIES) {
      if (u.startsWith(a.toUpperCase())) return { act: a, rest: text.slice(a.length).trim() };
    }
    const m = text.match(/^(\S+)\s*(.*)/s);
    return m ? { act: m[1], rest: m[2].trim() } : { act: text, rest: '' };
  }

  function flushPending(p: Pending) {
    const { act, rest } = detectAct(p.s);
    if (!rest) return;
    const isCash = CASH_MOVE_RE.test(act);
    let s = rest;
    let amount: number | null = null;
    let price: number | null = null, qty: number | null = null;
    let m: RegExpMatchArray | null;

    // Balance (rightmost x.xx) — consumed but not stored
    m = s.match(/\s+([\d,]+\.\d{2})\s*$/);
    if (m) s = s.slice(0, -m[0].length);
    // Amount (next x.xx, possibly negative)
    m = s.match(/\s+(-?[\d,]+\.\d{2})\s*$/);
    if (m) { amount = parseFloat(m[1].replace(/,/g, '')); s = s.slice(0, -m[0].length); }

    if (!isCash) {
      // Price (x.xxx — 3 decimals)
      m = s.match(/\s+([\d,]+\.\d{3})\s*$/);
      if (m) { price = parseFloat(m[1].replace(/,/g, '')); s = s.slice(0, -m[0].length); }
      // Qty (integer)
      m = s.match(/\s+([\d,]+)\s*$/);
      if (m && /^[\d,]+$/.test(m[1])) { qty = parseFloat(m[1].replace(/,/g, '')); s = s.slice(0, -m[0].length); }
    }

    if (amount === null) return;
    const security = isCash ? '' : s.trim();
    const txType = mapActivityToType(act);
    const signedAmount = txType === 'Purchase' ? -Math.abs(amount) : amount;

    txns.push({
      id: `td-${p.date.replace(/-/g, '')}-${txns.length}`,
      settlementDate: p.date, tradeDate: p.date,
      activity: act, security, ticker: lookupTicker(security),
      quantity: qty, price, amount: signedAmount,
      currency: 'CAD', fxRate: null, account: '',
      accountType: 'Non-Registered', broker: 'TD Direct Investing', sourceFile,
    });
  }

  for (const page of pages) {
    let inActivity = false;
    for (const rawLine of page.split('\n')) {
      const line = rawLine.trim();
      if (!line) continue;

      // Track current year from period headers ("May 1, 2025 to May 31, 2025")
      const ym = line.match(PERIOD_YEAR_RE);
      if (ym) { currentYear = parseInt(ym[1]); continue; }

      if (ACTIVITY_SECTION_RE.test(line)) {
        inActivity = true;
        if (pending) { flushPending(pending); pending = null; }
        continue;
      }
      if (SKIP_LINE_RE.test(line)) continue;
      if (!inActivity) continue;

      const dm = line.match(DATE_LINE_RE);
      if (dm) {
        if (pending) flushPending(pending);
        const [, mon, day, rest] = dm;
        if (BALANCE_LINE_RE.test(rest)) { pending = null; continue; }
        const mnth = MONTHS[mon.toLowerCase()];
        const date = `${currentYear}-${String(mnth).padStart(2, '0')}-${String(+day).padStart(2, '0')}`;
        pending = { date, s: rest };
      } else if (pending) {
        if (ORDER_NUM_RE.test(line)) {
          // Order number line — skip
        } else if (ACT_SUFFIX_WORDS.has(line.toLowerCase())) {
          // "Deposit" / "Wdl" — insert right after "Web Banking" prefix
          const pfx = pending.s.match(/^web\s+banking\b/i);
          if (pfx) {
            const cap = line.charAt(0).toUpperCase() + line.slice(1).toLowerCase();
            pending.s = pending.s.slice(0, pfx[0].length) + ' ' + cap + pending.s.slice(pfx[0].length);
          } else {
            pending.s += ' ' + line;
          }
        } else {
          // Security name continuation — insert before trailing numbers block
          const nb = pending.s.match(/(\s+(?:-?[\d,]+(?:\.\d+)?\s+)*-?[\d,]+\.\d{2})\s*$/);
          if (nb) {
            const insertAt = pending.s.length - nb[0].length;
            pending.s = pending.s.slice(0, insertAt) + ' ' + line + pending.s.slice(insertAt);
          } else {
            pending.s += ' ' + line;
          }
        }
      }
    }
    if (pending) { flushPending(pending); pending = null; }
  }

  return txns;
}

// ─── Claude AI extraction (text or vision) ────────────────────────────────────

async function extractWithClaude(
  input: { type: 'text'; pages: string[] } | { type: 'images'; pages: string[] },
  sourceFile: string,
  apiKey: string,
): Promise<InvPdfParseResult> {
  const instructions = `You are an expert Canadian investment workpaper preparer. Extract structured data from the following investment brokerage statement.

Return ONLY a valid JSON object — no explanation, no markdown fences, no preamble.

The JSON object must have this exact shape:
{
  "broker": "string — broker/custodian name as shown on statement",
  "accountHolder": "string — client/entity name",
  "account": "string — primary account number",
  "periodEnd": "string — statement period end date in YYYY-MM-DD format",
  "fxRateUsdCad": number or null,
  "transactions": [
    {
      "settlementDate": "YYYY-MM-DD",
      "tradeDate": "YYYY-MM-DD",
      "activity": "string",
      "security": "string — full name, cleaned of fund class suffixes",
      "ticker": "string",
      "quantity": number or null,
      "price": number or null,
      "amount": number,
      "currency": "CAD" or "USD",
      "fxRate": number or null,
      "account": "string",
      "accountType": "string"
    }
  ]
}

Rules:
- Include ALL transactions: purchases, sales, dividends, interest, fees, distributions, transfers, return of capital, reinvested dividends, withholding tax
- Do NOT include opening/closing balance rows, subtotals, or portfolio summary rows
- For purchases/fees/taxes: amount negative. For sales/income/distributions: amount positive.
- Preserve fractional quantities (e.g. 201.3536 units)
- Clean security names: remove suffixes like -NL, SEG, (F,NL), (NL)`;

  let messageContent: Array<{ type: string; [key: string]: unknown }>;

  if (input.type === 'images') {
    messageContent = [
      ...input.pages.map(data => ({
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data },
      })),
      { type: 'text', text: instructions },
    ];
  } else {
    const fullText = input.pages.join('\n\n--- PAGE BREAK ---\n\n');
    const truncated = fullText.length > 14000
      ? fullText.slice(0, 14000) + '\n[...truncated]'
      : fullText;
    messageContent = [{ type: 'text', text: `${instructions}\n\nStatement text:\n${truncated}` }];
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: messageContent }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Claude API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = (data.content as Array<{ type: string; text: string }>)
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

  const clean = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);

  const transactions: ParsedInvTransaction[] = (parsed.transactions ?? []).map(
    (r: Record<string, unknown>, i: number): ParsedInvTransaction => ({
      id: `ai-${String(parsed.account ?? 'unknown').replace(/\s+/g, '')}-${String(r.settlementDate ?? i)}-${i}`,
      settlementDate: String(r.settlementDate ?? ''),
      tradeDate: String(r.tradeDate ?? r.settlementDate ?? ''),
      activity: String(r.activity ?? ''),
      security: String(r.security ?? ''),
      ticker: String(r.ticker ?? ''),
      quantity: r.quantity != null ? Number(r.quantity) : null,
      price: r.price != null ? Number(r.price) : null,
      amount: Number(r.amount ?? 0),
      currency: r.currency === 'USD' ? 'USD' : 'CAD',
      fxRate: r.fxRate != null ? Number(r.fxRate) : null,
      account: String(r.account ?? parsed.account ?? ''),
      accountType: String(r.accountType ?? ''),
      broker: String(parsed.broker ?? 'AI-Extracted'),
      sourceFile,
    })
  );

  return {
    broker: String(parsed.broker ?? 'AI-Extracted'),
    accountHolder: String(parsed.accountHolder ?? ''),
    account: String(parsed.account ?? ''),
    periodEnd: String(parsed.periodEnd ?? ''),
    fxRateUsdCad: parsed.fxRateUsdCad != null ? Number(parsed.fxRateUsdCad) : null,
    transactions,
  };
}

// ─── Gemini AI extraction ─────────────────────────────────────────────────────

async function extractWithGemini(
  input: { type: 'text'; pages: string[] } | { type: 'images'; pages: string[] },
  sourceFile: string,
  geminiKey: string,
): Promise<InvPdfParseResult> {
  const systemPrompt = `You are an expert Canadian investment workpaper preparer. Extract all transactions from the investment statement. Return ONLY valid JSON — no markdown, no explanation, no code fences.

JSON shape:
{
  "broker": "broker name as shown on statement",
  "accountHolder": "client entity name",
  "account": "primary account number",
  "periodEnd": "YYYY-MM-DD",
  "fxRateUsdCad": number or null,
  "transactions": [{
    "settlementDate": "YYYY-MM-DD",
    "tradeDate": "YYYY-MM-DD",
    "activity": "exact description from statement",
    "security": "full security name, cleaned of -NL SEG (F,NL) suffixes",
    "ticker": "ticker symbol or empty string",
    "quantity": number or null,
    "price": number or null,
    "amount": number,
    "currency": "CAD" or "USD",
    "fxRate": number or null,
    "account": "account number for this transaction",
    "accountType": "RRSP or TFSA or Non-Registered or IAA or PMA or RRIF or empty string"
  }]
}

Rules:
- Include ALL transactions across ALL accounts
- EXCLUDE opening/closing balance rows, subtotals, and portfolio summary rows
- Purchases and fees = negative amount. Sales, dividends, interest, distributions = positive
- If settlement date not shown, use trade date for both fields
- Preserve fractional quantities (e.g. 201.3536)`;

  let parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [];

  if (input.type === 'text') {
    const fullText = input.pages.join('\n\n--- PAGE BREAK ---\n\n');
    const truncated = fullText.length > 14000 ? fullText.slice(0, 14000) + '\n[...truncated]' : fullText;
    parts = [{ text: `${systemPrompt}\n\nStatement text:\n${truncated}` }];
  } else {
    parts = [
      { text: systemPrompt },
      ...input.pages.slice(0, 8).map(data => ({
        inline_data: { mime_type: 'image/jpeg' as const, data },
      })),
      { text: 'Extract all transactions from these statement pages. Return the full JSON object.' },
    ];
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0, maxOutputTokens: 4096 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const clean = text.replace(/```json|```/g, '').trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error(`Gemini returned invalid JSON. Raw: ${clean.slice(0, 200)}`);
  }

  return {
    broker: String(parsed.broker ?? 'AI-Extracted'),
    accountHolder: String(parsed.accountHolder ?? ''),
    account: String(parsed.account ?? ''),
    periodEnd: String(parsed.periodEnd ?? ''),
    fxRateUsdCad: parsed.fxRateUsdCad != null ? Number(parsed.fxRateUsdCad) : null,
    transactions: ((parsed.transactions ?? []) as Array<Record<string, unknown>>).map(
      (r, i): ParsedInvTransaction => ({
        id: `ai-${String(parsed.account ?? 'unknown').replace(/\s+/g, '')}-${String(r.settlementDate ?? i)}-${i}`,
        settlementDate: String(r.settlementDate ?? ''),
        tradeDate: String(r.tradeDate ?? r.settlementDate ?? ''),
        activity: String(r.activity ?? ''),
        security: String(r.security ?? ''),
        ticker: String(r.ticker ?? ''),
        quantity: r.quantity != null ? Number(r.quantity) : null,
        price: r.price != null ? Number(r.price) : null,
        amount: Number(r.amount ?? 0),
        currency: r.currency === 'USD' ? 'USD' : 'CAD',
        fxRate: r.fxRate != null ? Number(r.fxRate) : null,
        account: String(r.account ?? parsed.account ?? ''),
        accountType: String(r.accountType ?? ''),
        broker: String(parsed.broker ?? 'AI-Extracted'),
        sourceFile,
      })
    ),
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function extractInvTransactions(
  file: File,
  apiKey?: string,
  onOcrProgress?: (page: number, total: number) => void,
): Promise<InvPdfParseResult> {
  try {
    // Resolve AI key: user-configured Anthropic takes priority, built-in Gemini is fallback
    const userGeminiKey = typeof localStorage !== 'undefined'
      ? (localStorage.getItem('gemini_api_key') ?? undefined)
      : undefined;
    const effectiveGeminiKey = userGeminiKey ?? (BUILT_IN_GEMINI_KEY || undefined);

    const aiExtract = async (
      input: { type: 'text'; pages: string[] } | { type: 'images'; pages: string[] },
      src: string,
    ): Promise<InvPdfParseResult> => {
      if (apiKey) return extractWithClaude(input, src, apiKey);
      if (effectiveGeminiKey) return extractWithGemini(input, src, effectiveGeminiKey);
      return {
        broker: 'Unknown', accountHolder: '', account: '', periodEnd: '',
        fxRateUsdCad: null, transactions: [],
        error: 'This statement format requires an API key. Add an Anthropic or Gemini key in Settings → AI Configuration.',
      };
    };

    // ── 1. ZIP format (Richardson Wealth + BMO) ───────────────────────────
    const zipResult = await extractZipText(file);
    if (zipResult !== null) {
      const { pages, broker } = zipResult;
      const fullText = pages.join(' ');

      const fxMatch = fullText.match(/\$1USD\s*=\s*\$?([\d.]+)CAD/i)
                   ?? fullText.match(/1\s*USD\s*=\s*([\d.]+)\s*CAD/i);
      const fxRateUsdCad = fxMatch ? parseFloat(fxMatch[1]) : null;

      const pmatch = fullText.match(/For the period ending\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i)
                  ?? fullText.match(/([A-Za-z]+\s+\d{1,2},\s+\d{4})\s+Last Statement/i)
                  ?? fullText.match(/([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
      const periodEnd = pmatch ? parseDate(pmatch[1]) : '';

      const holderMatch = fullText.match(/^([A-Z][A-Z\s]+(?:LTD|INC|CORP)\.?)/m)
                       ?? fullText.match(/ATTN\s+(?:MR\.?|MS\.?|MRS\.?)?\s*([A-Z\s]+)\n/i);
      const accountHolder = holderMatch ? holderMatch[1].trim() : '';

      const acctMatch = fullText.match(/(H\d{2}-[A-Z0-9]+-[A-Z])/)
                     ?? fullText.match(/Non-registered account #([\d-]+)/i);
      const account = acctMatch ? acctMatch[1].replace(/\s+/g, '') : '';

      if (broker === 'Richardson Wealth Limited') {
        const txns = parseRichardsonText(pages, file.name);
        console.log('[invPdfParser] Richardson direct parse result:', txns.length, 'transactions');
        if (txns.length > 0) return { broker, accountHolder, account, periodEnd, fxRateUsdCad, transactions: txns };
        console.log('[invPdfParser] Direct parse yielded 0 — falling back to Gemini AI');
        return aiExtract({ type: 'text', pages }, file.name);
      }
      if (broker === 'BMO InvestorLine') {
        const txns = parseBmoText(pages, file.name);
        console.log('[invPdfParser] BMO direct parse result:', txns.length, 'transactions');
        if (txns.length > 0) return { broker, accountHolder, account, periodEnd, fxRateUsdCad, transactions: txns };
        console.log('[invPdfParser] Direct parse yielded 0 — falling back to Gemini AI');
        return aiExtract({ type: 'text', pages }, file.name);
      }
      return aiExtract({ type: 'text', pages }, file.name);
    }

    // ── 2. Standard PDF ───────────────────────────────────────────────────
    const pdfPages = await extractPdfText(file).catch(() => [] as string[]);
    if (pdfPages.some(p => p.trim().length > 100)) {
      const fullPdfText = pdfPages.join(' ');

      if (/richardson\s*wealth/i.test(fullPdfText) || /jsk\s*partners/i.test(fullPdfText)) {
        const acctM = fullPdfText.match(/(H\d{2}-[A-Z0-9]+-[A-Z])/);
        const fxM = fullPdfText.match(/\$1USD\s*=\s*\$?([\d.]+)CAD/i);
        const pmatch = fullPdfText.match(/For the period ending\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i);
        const holderM = fullPdfText.match(/^([A-Z][A-Z\s]+(?:LTD|INC|CORP)\.?)/m);
        const rwTxns = parseRichardsonText(pdfPages, file.name);
        if (rwTxns.length > 0) {
          return {
            broker: 'Richardson Wealth Limited',
            accountHolder: holderM?.[1]?.trim() ?? '',
            account: acctM?.[1] ?? '',
            periodEnd: pmatch ? parseDate(pmatch[1]) : '',
            fxRateUsdCad: fxM ? parseFloat(fxM[1]) : null,
            transactions: rwTxns,
          };
        }
        return aiExtract({ type: 'text', pages: pdfPages }, file.name);
      }

      if (/bmo\s*investor\s*line/i.test(fullPdfText) || /bmo\s*investorline/i.test(fullPdfText)) {
        const normalizedPages = pdfPages.map(p =>
          p.replace(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(\d)/gi, '$1 $2')
           .replace(/(\d{1,2}),(\d{4})/g, '$1, $2')
           .replace(/([a-z])([A-Z])/g, '$1 $2')
        );
        const acctM = fullPdfText.match(/Non-registered account #([\d-]+)/i);
        const pmatch = fullPdfText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})\s+Last Statement/i);
        const bmoTxns = parseBmoText(normalizedPages, file.name);
        if (bmoTxns.length > 0) {
          return {
            broker: 'BMO InvestorLine',
            accountHolder: '',
            account: acctM?.[1]?.replace(/\s+/g, '') ?? '',
            periodEnd: pmatch ? parseDate(pmatch[1]) : '',
            fxRateUsdCad: null,
            transactions: bmoTxns,
          };
        }
        return aiExtract({ type: 'text', pages: normalizedPages }, file.name);
      }

      if (/td\s*direct\s*investing/i.test(fullPdfText) || /td\s*waterhouse/i.test(fullPdfText)) {
        const acctM = fullPdfText.match(/\b([A-Z0-9]{4,7}X\d)\b/i);
        const holderM = fullPdfText.match(/(?:account\s+(?:name|holder)|registered\s+to)[:\s]+([A-Za-z][A-Za-z\s,\.]+(?:Inc|Ltd|Corp|LLC)\.?)/i)
          ?? fullPdfText.match(/^([A-Z][A-Z\s]+(?:LTD|INC|CORP)\.?)\s*$/m);
        const pmatch = fullPdfText.match(/([A-Za-z]+\s+\d{1,2},?\s+\d{4})\s+to\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i);
        const periodEnd = pmatch ? parseDate(pmatch[2]) : '';
        const tdTxns = parseTdDirectText(pdfPages, file.name);
        console.log('[invPdfParser] TD Direct parse result:', tdTxns.length, 'transactions');
        if (tdTxns.length > 0) {
          return {
            broker: 'TD Direct Investing',
            accountHolder: holderM?.[1]?.trim() ?? '',
            account: acctM?.[1]?.trim() ?? '',
            periodEnd,
            fxRateUsdCad: null,
            transactions: tdTxns,
          };
        }
        return aiExtract({ type: 'text', pages: pdfPages }, file.name);
      }

      return aiExtract({ type: 'text', pages: pdfPages }, file.name);
    }

    // ── 3. CSV / TSV / TXT ────────────────────────────────────────────────
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (['csv', 'tsv', 'txt'].includes(ext)) {
      return aiExtract({ type: 'text', pages: [await file.text()] }, file.name);
    }

    // ── 4. XLSX / XLS ─────────────────────────────────────────────────────
    if (['xlsx', 'xls'].includes(ext)) {
      const { read, utils } = await import('xlsx');
      const wb = read(await file.arrayBuffer());
      const pages = wb.SheetNames.map(n =>
        `--- Sheet: ${n} ---\n` + utils.sheet_to_csv(wb.Sheets[n])
      );
      return aiExtract({ type: 'text', pages }, file.name);
    }

    // ── 5. Scanned PDF — OCR first, AI only for unknown brokers ──────────
    const ocrPages = await ocrPdfPages(file, onOcrProgress);
    if (!ocrPages.some(p => p.trim().length > 100)) {
      return {
        broker: 'Unknown', accountHolder: '', account: '', periodEnd: '',
        fxRateUsdCad: null, transactions: [],
        error: 'Could not extract text from this PDF. The scan quality may be too low.',
      };
    }

    const ocrFullText = ocrPages.join(' ');

    if (/richardson\s*wealth/i.test(ocrFullText) || /jsk\s*partners/i.test(ocrFullText)) {
      const acctM = ocrFullText.match(/(H\d{2}-[A-Z0-9]+-[A-Z])/);
      return {
        broker: 'Richardson Wealth Limited', accountHolder: '', account: acctM?.[1] ?? '',
        periodEnd: '', fxRateUsdCad: null, transactions: parseRichardsonText(ocrPages, file.name),
      };
    }

    if (/bmo\s*investor\s*line/i.test(ocrFullText) || /bmo\s*investorline/i.test(ocrFullText)) {
      const acctM = ocrFullText.match(/Non-registered account #([\d-]+)/i);
      return {
        broker: 'BMO InvestorLine', accountHolder: '', account: acctM?.[1]?.replace(/\s+/g, '') ?? '',
        periodEnd: '', fxRateUsdCad: null, transactions: parseBmoText(ocrPages, file.name),
      };
    }

    if (/td\s*direct\s*investing/i.test(ocrFullText) || /td\s*waterhouse/i.test(ocrFullText)) {
      const acctM = ocrFullText.match(/\b([A-Z0-9]{4,7}X\d)\b/i);
      return {
        broker: 'TD Direct Investing', accountHolder: '', account: acctM?.[1]?.trim() ?? '',
        periodEnd: '', fxRateUsdCad: null, transactions: parseTdDirectText(ocrPages, file.name),
      };
    }

    return aiExtract({ type: 'text', pages: ocrPages }, file.name);

  } catch (err) {
    return {
      broker: 'Unknown', accountHolder: '', account: '', periodEnd: '',
      fxRateUsdCad: null, transactions: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function validateSingleBroker(
  results: InvPdfParseResult[],
): { valid: boolean; error?: string } {
  const brokers = [...new Set(
    results.map(r => r.broker).filter(b => b !== 'Unknown' && b !== 'AI-Extracted')
  )];
  if (brokers.length > 1) {
    return {
      valid: false,
      error: `Multiple brokers detected: ${brokers.join(' and ')}. Upload statements for one broker at a time.`,
    };
  }
  return { valid: true };
}
