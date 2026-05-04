import { Source, Transaction, TxType, Currency } from "./types";
import { defaultTbAccount } from "./coa";

export interface PlaidAccount {
  id: string;
  name: string;
  mask: string;
  currency: Currency;
  subtype: "brokerage" | "ira" | "tfsa" | "rrsp" | "non-registered";
}

export interface PlaidInstitution {
  id: string;
  name: string;
  logo: string; // emoji — kept for backward compat but unused in UI
  abbr: string;
  color: string;   // bg hex
  iconName: "Landmark" | "TrendingUp" | "BarChart3" | "Shield" | "Leaf" | "Building2";
  accounts: PlaidAccount[];
}

export interface PlaidInvestmentTxn {
  id: string;
  accountId: string;
  date: string;
  security: string;
  ticker: string;
  type: TxType;
  units: number;
  price: number;
  fees: number;
  currency: Currency;
}

export const MOCK_INSTITUTIONS: PlaidInstitution[] = [
  {
    id: "ins_chase",
    name: "Chase",
    logo: "🏦",
    abbr: "JPM",
    color: "#0A4DA3",
    iconName: "Landmark",
    accounts: [
      { id: "acc_chase_1", name: "Chase Brokerage",  mask: "8821", currency: "USD", subtype: "brokerage" },
      { id: "acc_chase_2", name: "Chase Roth IRA",   mask: "3340", currency: "USD", subtype: "ira" },
    ],
  },
  {
    id: "ins_fidelity",
    name: "Fidelity",
    logo: "🟢",
    abbr: "FID",
    color: "#006633",
    iconName: "TrendingUp",
    accounts: [
      { id: "acc_fid_1", name: "Fidelity Individual", mask: "5512", currency: "USD", subtype: "brokerage" },
      { id: "acc_fid_2", name: "Fidelity Joint",      mask: "9904", currency: "USD", subtype: "brokerage" },
    ],
  },
  {
    id: "ins_schwab",
    name: "Charles Schwab",
    logo: "🔵",
    abbr: "CS",
    color: "#0075BE",
    iconName: "BarChart3",
    accounts: [
      { id: "acc_sch_1", name: "Schwab One",        mask: "1188", currency: "USD", subtype: "brokerage" },
    ],
  },
  {
    id: "ins_vanguard",
    name: "Vanguard",
    logo: "🟣",
    abbr: "VAN",
    color: "#7B1115",
    iconName: "Shield",
    accounts: [
      { id: "acc_van_1", name: "Vanguard Brokerage", mask: "7745", currency: "USD", subtype: "brokerage" },
      { id: "acc_van_2", name: "Vanguard Roth IRA",  mask: "2210", currency: "USD", subtype: "ira" },
    ],
  },
  {
    id: "ins_questrade",
    name: "Questrade",
    logo: "🍁",
    abbr: "QT",
    color: "#C9330A",
    iconName: "Leaf",
    accounts: [
      { id: "acc_que_1", name: "Questrade Margin",   mask: "4421", currency: "CAD", subtype: "non-registered" },
      { id: "acc_que_2", name: "Questrade TFSA",     mask: "6618", currency: "CAD", subtype: "tfsa" },
      { id: "acc_que_3", name: "Questrade RRSP",     mask: "9012", currency: "CAD", subtype: "rrsp" },
    ],
  },
  {
    id: "ins_td",
    name: "TD Ameritrade",
    logo: "🟩",
    abbr: "TDA",
    color: "#2E7D32",
    iconName: "Building2",
    accounts: [
      { id: "acc_td_1", name: "TD Individual",       mask: "3377", currency: "USD", subtype: "brokerage" },
    ],
  },
];

// Deterministic pseudo-random based on string seed
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6D2B79F5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SECURITY_UNIVERSE: { ticker: string; name: string }[] = [
  { ticker: "AAPL", name: "Apple Inc." },
  { ticker: "MSFT", name: "Microsoft Corp." },
  { ticker: "VTI",  name: "Vanguard Total Stock Market ETF" },
  { ticker: "BND",  name: "Vanguard Total Bond Market ETF" },
  { ticker: "NVDA", name: "NVIDIA Corp." },
  { ticker: "VOO",  name: "Vanguard S&P 500 ETF" },
];

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function fetchMockInvestmentTransactions(
  account: PlaidAccount,
  start: string,
  end: string,
): Promise<PlaidInvestmentTxn[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const rand = seeded(account.id + start + end);
      const startD = new Date(start).getTime();
      const endD = new Date(end).getTime();
      const span = Math.max(endD - startD, 86400000 * 30);
      const count = 6 + Math.floor(rand() * 5); // 6–10
      const txns: PlaidInvestmentTxn[] = [];

      for (let i = 0; i < count; i++) {
        const sec = SECURITY_UNIVERSE[Math.floor(rand() * SECURITY_UNIVERSE.length)];
        const r = rand();
        let type: TxType;
        if (r < 0.45) type = "Purchase";
        else if (r < 0.7) type = "Sale";
        else if (r < 0.88) type = "Dividend";
        else type = "Fee/Commission";

        const date = isoDate(new Date(startD + rand() * span));
        const units = type === "Dividend" || type === "Fee/Commission"
          ? 0
          : Math.round((5 + rand() * 95)); // 5–100 units
        const price = type === "Fee/Commission"
          ? 0
          : type === "Dividend"
            ? +(0.2 + rand() * 1.5).toFixed(4)
            : +(40 + rand() * 360).toFixed(2);
        const fees = type === "Fee/Commission"
          ? +(4.95 + rand() * 20).toFixed(2)
          : type === "Purchase" || type === "Sale"
            ? +(0 + rand() * 4.95).toFixed(2)
            : 0;

        txns.push({
          id: `${account.id}_tx_${i}`,
          accountId: account.id,
          date,
          security: sec.name,
          ticker: sec.ticker,
          type,
          units,
          price,
          fees,
          currency: account.currency,
        });
      }
      txns.sort((a, b) => a.date.localeCompare(b.date));
      resolve(txns);
    }, 300);
  });
}

export function plaidAccountToSource(
  inst: PlaidInstitution,
  acc: PlaidAccount,
  periodStart: string,
  periodEnd: string,
  entityName: string,
): Source {
  return {
    id: `PLAID-${inst.id}-${acc.mask}`,
    label: `PLAID-${inst.name.toUpperCase().replace(/\s+/g, "")}-${acc.mask}`,
    type: "Broker Statement",
    institution: `${inst.name} — ${acc.name}`,
    accountLast4: acc.mask,
    periodStart,
    periodEnd,
    currency: acc.currency,
    entityName,
  };
}

export function plaidToSourceTransaction(p: PlaidInvestmentTxn, sourceId: string): Transaction {
  const gross = p.type === "Dividend"
    ? +(p.units || 1) * p.price // dividend: treat units as share count if provided, else $price as gross
    : p.units * p.price;
  const grossSigned = p.type === "Sale" ? gross : gross;
  const net = p.type === "Purchase"
    ? -(gross + p.fees)
    : p.type === "Sale"
      ? gross - p.fees
      : p.type === "Dividend"
        ? gross
        : -p.fees;

  return {
    id: `tx_${p.id}`,
    sourceId,
    date: p.date,
    security: p.security,
    ticker: p.ticker,
    type: p.type,
    units: p.units,
    price: p.price,
    gross: grossSigned,
    fees: p.fees,
    net,
    currency: p.currency,
    status: "pending",
    tbAccount: defaultTbAccount(p.type),
    notes: "Imported via Plaid (sandbox)",
  };
}
