/**
 * invPdfParser.ts
 * Universal investment statement extractor.
 * Works with any broker, any format (PDF, ZIP/Richardson Wealth, XLSX, CSV).
 * Uses Claude AI for extraction — no hardcoded broker logic.
 */

import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
  }
  return pdfjsLib;
}

// ─── Exported types (unchanged — downstream code depends on these) ────────────

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

// ─── Activity → standardised type ────────────────────────────────────────────

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

// ─── Text extraction helpers ──────────────────────────────────────────────────

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

async function extractZipText(file: File): Promise<string[] | null> {
  try {
    const { default: JSZip } = await import('jszip');
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
    return pages.length > 0 ? pages : null;
  } catch {
    return null;
  }
}

async function extractPlainText(file: File): Promise<string[]> {
  return [await file.text()];
}

async function extractAllText(file: File): Promise<string[]> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (ext === 'pdf' || ext === 'zip') {
    const zipPages = await extractZipText(file);
    if (zipPages) return zipPages;
  }

  if (ext === 'pdf') {
    return extractPdfText(file);
  }

  if (['csv', 'tsv', 'txt'].includes(ext)) {
    return extractPlainText(file);
  }

  if (['xlsx', 'xls'].includes(ext)) {
    const { read, utils } = await import('xlsx');
    const data = await file.arrayBuffer();
    const wb = read(data);
    return wb.SheetNames.map(name => {
      const ws = wb.Sheets[name];
      return `--- Sheet: ${name} ---\n` + utils.sheet_to_csv(ws);
    });
  }

  return extractPlainText(file);
}

// ─── Claude AI extraction ─────────────────────────────────────────────────────

async function extractWithClaude(
  pages: string[],
  sourceFile: string,
  apiKey: string,
): Promise<{
  transactions: ParsedInvTransaction[];
  broker: string;
  account: string;
  accountHolder: string;
  periodEnd: string;
  fxRateUsdCad: number | null;
}> {
  const fullText = pages.join('\n\n--- PAGE BREAK ---\n\n');
  const truncated = fullText.length > 14000
    ? fullText.slice(0, 14000) + '\n[...truncated — additional pages omitted]'
    : fullText;

  const prompt = `You are an expert Canadian investment workpaper preparer. Extract structured data from the following investment brokerage statement.

Return ONLY a valid JSON object — no explanation, no markdown fences, no preamble.

The JSON object must have this exact shape:
{
  "broker": "string — broker/custodian name as shown on statement",
  "accountHolder": "string — client/entity name",
  "account": "string — primary account number",
  "periodEnd": "string — statement period end date in YYYY-MM-DD format",
  "fxRateUsdCad": number or null — USD to CAD exchange rate if shown,
  "transactions": [
    {
      "settlementDate": "YYYY-MM-DD",
      "tradeDate": "YYYY-MM-DD",
      "activity": "string — exact activity description from statement",
      "security": "string — full security name, cleaned of fund class suffixes like -NL, SEG, (F,NL)",
      "ticker": "string — ticker symbol if shown, else empty string",
      "quantity": number or null,
      "price": number or null,
      "amount": number — negative for cash outflows (purchases, fees, taxes), positive for cash inflows (sales, income, distributions),
      "currency": "CAD" or "USD",
      "fxRate": number or null — FX rate for this specific transaction if shown,
      "account": "string — account number this transaction belongs to",
      "accountType": "string — e.g. RRSP, TFSA, Non-Registered, IAA, PMA, RRIF, or empty string"
    }
  ]
}

Rules:
- Include ALL transactions: purchases, sales, dividends, interest, fees, distributions, transfers, return of capital, reinvested dividends, withholding tax
- Do NOT include opening balance rows, closing balance rows, subtotal rows, or portfolio summary rows
- If a statement has multiple accounts, extract transactions from ALL accounts
- For Buy/Purchase transactions: amount must be negative (cash goes out)
- For Sell/Sale transactions: amount must be positive (cash comes in)
- For fees and taxes: amount must be negative
- For dividends, interest, distributions: amount must be positive
- For Return of Capital: amount can be positive or negative depending on statement presentation — use the sign shown
- If settlement date is not shown, use trade date for both fields
- Preserve fractional quantities (e.g. 201.3536 units)
- If a transaction spans multiple lines in the statement, reconstruct it as a single transaction object
- Clean security names: remove suffixes like -NL, SEG, (F,NL), (NL), SOLICITED, UNSOLICITED

Statement text:
${truncated}`;

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
      messages: [{ role: 'user', content: prompt }],
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

export async function extractInvTransactions(file: File, apiKey: string): Promise<InvPdfParseResult> {
  try {
    const pages = await extractAllText(file);

    if (pages.length === 0 || pages.every(p => p.trim().length === 0)) {
      return {
        broker: 'Unknown', accountHolder: '', account: '', periodEnd: '',
        fxRateUsdCad: null, transactions: [],
        error: 'No readable text found in this file. It may be a scanned image — try uploading a text-based PDF or CSV instead.',
      };
    }

    const result = await extractWithClaude(pages, file.name, apiKey);

    return {
      broker: result.broker,
      accountHolder: result.accountHolder,
      account: result.account,
      periodEnd: result.periodEnd,
      fxRateUsdCad: result.fxRateUsdCad,
      transactions: result.transactions,
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
