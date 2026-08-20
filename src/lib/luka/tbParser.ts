// src/lib/luka/tbParser.ts
// Parses "TB Grouping" xlsx exports from the Countable accounting platform.
// Layout (sheet1 only):
//   A3        = "As at Month DD, YYYY"
//   Row 6     = column headers
//   Rows 7–36 = data rows  (accNo | name | … | final balance in col 4)
//   Row 37    = Cross Check total (skipped)

import * as XLSX from "xlsx";

export interface TBAccount {
  accNo: string;   // e.g. "1310"
  name:  string;   // e.g. "Investments at Cost"
  final: number;   // authoritative year-end balance
}

export interface TBYear {
  fileName:    string;
  yearEndDate: string;   // "April 30, 2024"
  accounts:    TBAccount[];
}

export interface TBDerivedAnalysis {
  years:                     string;       // "3 years (FY 2024, FY 2025, FY 2026)"
  yearEndDate:               string;       // "April 30, 2026"
  currentYear:               TBYear;
  priorYear:                 TBYear | null;
  investmentAccounts:        string[];     // "1310 · Investments at Cost"
  bankAccounts:              string[];     // "1100 · Cash — BMO Operating"
  recordingMethod:           string;
  priorInvSecuritiesBalance: number;
  priorInvCashBalance:       number;
  hasPriorInvestments:       boolean;
  dividendIncomeTarget:      number;
  realizedGainTarget:        number;
  isCurrentYearBalanced:     boolean;
}

// ── Parse one Grouping xlsx ────────────────────────────────────────────────────
export function parseTBGroupingXlsx(fileBuffer: ArrayBuffer, fileName: string): TBYear | null {
  try {
    const wb = XLSX.read(fileBuffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) return null;

    // Year-end date: A3 → "As at April 30, 2024"
    const a3Val = (ws["A3"] as XLSX.CellObject | undefined)?.v;
    const yearEndDate =
      typeof a3Val === "string"
        ? (a3Val.match(/as\s+at\s+(.+)/i)?.[1]?.trim() ?? "")
        : "";
    if (!yearEndDate) return null;

    // Decode to 2-D array (row 0-indexed)
    type Row = (string | number | boolean | undefined)[];
    const rows = XLSX.utils.sheet_to_json<Row>(ws, { header: 1, defval: undefined }) as Row[];

    const accounts: TBAccount[] = [];
    // Row 6 (index 5) = headers; rows 7–36 (index 6–35) = data
    for (let i = 6; i <= 35 && i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;

      const raw0 = row[0];
      const raw1 = row[1];
      if (raw0 === undefined && raw1 === undefined) continue;

      const accNo = raw0 != null ? String(raw0).trim() : "";
      const name  = raw1 != null ? String(raw1).trim() : "";
      if (!accNo && !name) continue;
      if (/cross\s*check/i.test(name)) continue;

      // Final balance = col index 4 (authoritative per spec)
      const rawFinal = row[4] ?? row[row.length - 1];
      let final = 0;
      if (typeof rawFinal === "number") {
        final = rawFinal;
      } else if (typeof rawFinal === "string") {
        // Handle parenthetical negatives "(1,234.56)" → -1234.56
        const s = rawFinal.replace(/[,$\s]/g, "").replace(/^\((.+)\)$/, "-$1");
        final = parseFloat(s) || 0;
      }

      accounts.push({ accNo, name, final });
    }

    if (accounts.length === 0) return null;
    return { fileName, yearEndDate, accounts };
  } catch {
    return null;
  }
}

// ── Parse multiple files → sorted TBYear array ────────────────────────────────
export function parseTBFiles(files: { buffer: ArrayBuffer; name: string }[]): TBYear[] {
  const years = files
    .map(f => parseTBGroupingXlsx(f.buffer, f.name))
    .filter((y): y is TBYear => y !== null);

  // Sort oldest → newest by year-end date
  years.sort((a, b) => {
    const da = new Date(a.yearEndDate).getTime();
    const db = new Date(b.yearEndDate).getTime();
    return (isNaN(da) ? 0 : da) - (isNaN(db) ? 0 : db);
  });

  // Deduplicate by yearEndDate (keep last)
  const seen = new Set<string>();
  return [...years].reverse().filter(y => {
    if (seen.has(y.yearEndDate)) return false;
    seen.add(y.yearEndDate);
    return true;
  }).reverse();
}

// ── Account classification ─────────────────────────────────────────────────────
const INV_ACC_RE  = /^(1[3-9]\d{2}|4[78]\d{2})|invest|unreali[sz]|realiz|gain.*inv|loss.*inv|securities|portfolio|marketable/i;
const BANK_ACC_RE = /^(10\d{2}|11\d{2})|cash|bank|chequing|checking|savings|bmo|rbc|\btd\b|cibc|scotiabank|nbcn|desjardins/i;

function classify(accounts: TBAccount[]) {
  const investmentAccounts: string[] = [];
  const bankAccounts: string[]       = [];
  for (const a of accounts) {
    const sig = `${a.accNo} ${a.name}`;
    if (INV_ACC_RE.test(sig))  investmentAccounts.push(`${a.accNo} · ${a.name}`);
    else if (BANK_ACC_RE.test(sig)) bankAccounts.push(`${a.accNo} · ${a.name}`);
  }
  return { investmentAccounts, bankAccounts };
}

function buildRecordingMethod(year: TBYear): string {
  const hasUnrealized = year.accounts.some(a => /unreali[sz]/i.test(a.name));
  const method = hasUnrealized ? "fair value method" : "cost method";
  return `Accrual basis · ${method} · investment income recorded separately`;
}

// ── Main derivation ────────────────────────────────────────────────────────────
export function deriveTBAnalysis(years: TBYear[]): TBDerivedAnalysis | null {
  if (years.length === 0) return null;

  const currentYear = years[years.length - 1];
  const priorYear   = years.length >= 2 ? years[years.length - 2] : null;

  const { investmentAccounts, bankAccounts } = classify(currentYear.accounts);

  // "3 years (FY 2024, FY 2025, FY 2026)"
  const fyLabels = years.map(y => {
    const m = y.yearEndDate.match(/(\d{4})$/);
    return m ? `FY ${m[1]}` : y.yearEndDate;
  });
  const yearsLabel = `${years.length} year${years.length > 1 ? "s" : ""} (${fyLabels.join(", ")})`;

  // Prior-year investment balances
  let priorInvSecuritiesBalance = 0;
  let priorInvCashBalance       = 0;
  if (priorYear) {
    for (const a of priorYear.accounts) {
      const sig = `${a.accNo} ${a.name}`;
      if (INV_ACC_RE.test(sig))       priorInvSecuritiesBalance += a.final;
      else if (BANK_ACC_RE.test(sig)) priorInvCashBalance       += a.final;
    }
  }

  // Income-statement targets from current year
  let dividendIncomeTarget = 0;
  let realizedGainTarget   = 0;
  for (const a of currentYear.accounts) {
    if (/dividend|div.*income/i.test(a.name))          dividendIncomeTarget += Math.abs(a.final);
    if (/realized.*gain|gain.*invest|capital.*gain/i.test(a.name)) realizedGainTarget += Math.abs(a.final);
  }

  const total = currentYear.accounts.reduce((s, a) => s + a.final, 0);

  return {
    years: yearsLabel,
    yearEndDate: currentYear.yearEndDate,
    currentYear,
    priorYear,
    investmentAccounts,
    bankAccounts,
    recordingMethod: buildRecordingMethod(currentYear),
    priorInvSecuritiesBalance,
    priorInvCashBalance,
    hasPriorInvestments: priorInvSecuritiesBalance !== 0,
    dividendIncomeTarget,
    realizedGainTarget,
    isCurrentYearBalanced: Math.abs(total) < 0.01,
  };
}
