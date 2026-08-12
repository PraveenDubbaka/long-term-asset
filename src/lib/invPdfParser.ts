/**
 * invPdfParser.ts
 * Universal investment statement extractor.
 * ZIP-format statements (Richardson Wealth, BMO): direct text parsing — no API key needed.
 * Other formats (standard PDF, XLSX, CSV, scanned PDF): falls back to Claude AI.
 */

import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';

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
  ['online banking',       'Transfer In'],
  ['transfer of funds',    'Transfer In'],
  ['multi-branch banking', 'Transfer'],
  ['bought',               'Purchase'],
  ['sold',                 'Sale'],
  ['buy',                  'Purchase'],
  ['sell',                 'Sale'],
  ['reinvested dividend',  'Reinvested Dividend'],
  ['cash distribution',    'Distribution'],
  ['bond interest',        'Interest'],
  ['interest in kind',     'Interest'],
  ['accrued interest',     'Interest'],
  ['return of capital',    'Return of Capital'],
  ['return of',            'Return of Capital'],
  ['iaa fee',              'Fee/Commission'],
  ['pma fee',              'Fee/Commission'],
  ['fee/frais',            'Fee/Commission'],
  ['goods & services',     'Fee/Commission'],
  ['goods and services',   'Fee/Commission'],
  ['fee payment',          'Transfer'],
  ['client movement',      'Transfer'],
  ['cash transfer',        'Transfer'],
  ['dividend',             'Dividend'],
  ['distribution',         'Distribution'],
  ['interest',             'Interest'],
  ['commission',           'Fee/Commission'],
  ['withholding',          'Withholding Tax'],
];

export function mapActivityToType(activity: string): string {
  const lower = activity.toLowerCase().trim();
  for (const [key, value] of ACTIVITY_TYPE_MAP) {
    if (lower.includes(key)) return value;
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

  const fullText = pages.join(' ');
  const fxMatch = fullText.match(/\$1USD\s*=\s*\$?([\d.]+)CAD/i)
                ?? fullText.match(/1\s*USD\s*=\s*([\d.]+)\s*CAD/i);
  if (fxMatch) fxRateUsdCad = parseFloat(fxMatch[1]);

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
        if (c > 0 && c < 100000) {
          price = c;
          beforePrice = beforeAmount.slice(0, beforeAmount.lastIndexOf(priceMatch[1])).trim();
        }
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

function parseBmoText(pages: string[], sourceFile: string): ParsedInvTransaction[] {
  const txns: ParsedInvTransaction[] = [];

  const fullText = pages.join('\n');
  const fxMatch = fullText.match(/1\s*USD\s*=\s*([\d.]+)\s*CAD/i);
  const fxRateUsdCad = fxMatch ? parseFloat(fxMatch[1]) : null;

  const acctMatch = fullText.match(/Non-registered account #([\d-]+)/i);
  const account = acctMatch ? acctMatch[1].replace(/\s+/g, '') : '';

  const DATE_RE = /^((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\s+/i;
  const SKIP = [
    /Opening Cash Balance/i,
    /Closing Cash Balance/i,
    /This report includes/i,
    /Account activity for this month/i,
    /^Date\s+Activity/i,
    /^Cash Account$/i,
  ];

  let inActivity = false;
  let currentCcy: 'CAD' | 'USD' = 'CAD';

  for (const pageText of pages) {
    const lines = pageText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (/Canadian Dollar Investments/i.test(line)) { currentCcy = 'CAD'; i++; continue; }
      if (/U\.?S\.? Dollar Investments/i.test(line)) { currentCcy = 'USD'; i++; continue; }
      if (/Account activity for this month/i.test(line)) { inActivity = true; i++; continue; }
      if (inActivity && /important information/i.test(line)) { inActivity = false; i++; continue; }
      if (!inActivity) { i++; continue; }
      if (SKIP.some(re => re.test(line))) { i++; continue; }

      const dateMatch = line.match(DATE_RE);
      if (!dateMatch) { i++; continue; }

      const rawDate = dateMatch[1];
      let combined = line.slice(dateMatch[0].length).trim();

      let j = i + 1;
      while (j < lines.length) {
        const next = lines[j];
        if (DATE_RE.test(next)) break;
        if (SKIP.some(re => re.test(next))) break;
        combined = combined + ' ' + next.trim();
        j++;
        if (/(-?[\d,]+\.\d{2})\s*$/.test(combined)) break;
      }
      i = j;

      const numMatches = [...combined.matchAll(/(-?[\d,]+\.\d{2})/g)];
      if (numMatches.length === 0) continue;

      const rawAmount = numMatches[numMatches.length - 1][1];
      const amount = parseFloat(rawAmount.replace(/,/g, ''));
      const amtIdx = combined.lastIndexOf(rawAmount);
      const beforeAmt = combined.slice(0, amtIdx).trim();

      const words = beforeAmt.split(/\s+/);
      const activity = words[0] || '';
      const security = words.slice(1).join(' ')
        .replace(/\s*-\s*[A-Z]{1,5}:[A-Z]{2}\s*$/, '')
        .replace(/CASH DIV ON.*$/i, '')
        .trim();

      let quantity: number | null = null;
      let price: number | null = null;
      if (numMatches.length >= 3) {
        quantity = parseFloat(numMatches[numMatches.length - 3][1].replace(/,/g, ''));
        price = parseFloat(numMatches[numMatches.length - 2][1].replace(/,/g, ''));
      } else if (numMatches.length === 2) {
        quantity = parseFloat(numMatches[numMatches.length - 2][1].replace(/,/g, ''));
      }

      const type = mapActivityToType(activity);
      const signedAmount = type === 'Purchase' ? -Math.abs(amount) : Math.abs(amount);
      const amountCad = currentCcy === 'USD' ? signedAmount * (fxRateUsdCad ?? 1) : signedAmount;

      txns.push({
        id: `bmo-${account}-${rawDate.replace(/\s+/g, '')}-${txns.length}`,
        settlementDate: parseDate(rawDate),
        tradeDate: parseDate(rawDate),
        activity,
        security: security || activity,
        ticker: lookupTicker(security),
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

// ─── Main export ──────────────────────────────────────────────────────────────

export async function extractInvTransactions(
  file: File,
  apiKey?: string,
  onOcrProgress?: (page: number, total: number) => void,
): Promise<InvPdfParseResult> {
  try {
    // ── ZIP format (Richardson Wealth + BMO — both use same ZIP structure) ─
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

      let transactions: ParsedInvTransaction[] = [];
      if (broker === 'Richardson Wealth Limited') {
        transactions = parseRichardsonText(pages, file.name);
      } else if (broker === 'BMO InvestorLine') {
        transactions = parseBmoText(pages, file.name);
      } else if (apiKey) {
        return extractWithClaude({ type: 'text', pages }, file.name, apiKey);
      }

      return { broker, accountHolder, account, periodEnd, fxRateUsdCad, transactions };
    }

    // ── Non-ZIP formats need an API key ───────────────────────────────────
    if (!apiKey) {
      return {
        broker: 'Unknown', accountHolder: '', account: '', periodEnd: '',
        fxRateUsdCad: null, transactions: [],
        error: 'This statement format requires an Anthropic API key. Add it in Settings → AI Configuration.',
      };
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

    if (['csv', 'tsv', 'txt'].includes(ext)) {
      return extractWithClaude({ type: 'text', pages: [await file.text()] }, file.name, apiKey);
    }

    if (['xlsx', 'xls'].includes(ext)) {
      const { read, utils } = await import('xlsx');
      const wb = read(await file.arrayBuffer());
      const pages = wb.SheetNames.map(name =>
        `--- Sheet: ${name} ---\n` + utils.sheet_to_csv(wb.Sheets[name])
      );
      return extractWithClaude({ type: 'text', pages }, file.name, apiKey);
    }

    // PDF — extract text to determine if text-based or scanned
    const pdfPages = await extractPdfText(file).catch(() => [] as string[]);
    if (pdfPages.some(p => p.trim().length > 100)) {
      return extractWithClaude({ type: 'text', pages: pdfPages }, file.name, apiKey);
    }

    // Scanned PDF — OCR with Tesseract (no API key needed)
    const ocrPages = await ocrPdfPages(file, onOcrProgress);
    const hasUsefulText = ocrPages.some(p => p.trim().length > 100);
    if (!hasUsefulText) {
      return {
        broker: 'Unknown', accountHolder: '', account: '', periodEnd: '',
        fxRateUsdCad: null, transactions: [],
        error: 'Could not extract text from this PDF. It may be a very low quality scan.',
      };
    }

    const ocrFullText = ocrPages.join(' ');
    const ocrIsRichardson = /richardson\s*wealth/i.test(ocrFullText);
    const ocrIsBmo = /bmo\s*investor\s*line/i.test(ocrFullText) || /bmo\s*investorline/i.test(ocrFullText);

    if (ocrIsRichardson) {
      const acctM = ocrFullText.match(/(H\d{2}-[A-Z0-9]+-[A-Z])/);
      return {
        broker: 'Richardson Wealth Limited',
        accountHolder: '',
        account: acctM ? acctM[1] : '',
        periodEnd: '',
        fxRateUsdCad: null,
        transactions: parseRichardsonText(ocrPages, file.name),
      };
    }

    if (ocrIsBmo) {
      const acctM = ocrFullText.match(/Non-registered account #([\d-]+)/i);
      return {
        broker: 'BMO InvestorLine',
        accountHolder: '',
        account: acctM ? acctM[1].replace(/\s+/g, '') : '',
        periodEnd: '',
        fxRateUsdCad: null,
        transactions: parseBmoText(ocrPages, file.name),
      };
    }

    // Unknown broker after OCR — fall back to Claude text extraction
    if (apiKey) {
      return extractWithClaude({ type: 'text', pages: ocrPages }, file.name, apiKey);
    }
    return {
      broker: 'Unknown', accountHolder: '', account: '', periodEnd: '',
      fxRateUsdCad: null, transactions: [],
      error: 'Statement broker not recognised after OCR. Add an Anthropic API key in Settings → AI Configuration for universal extraction.',
    };

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
