import { TxType } from "./types";

// Hardcoded chart of accounts (illustrative)
export const CHART_OF_ACCOUNTS: { code: string; name: string }[] = [
  { code: "1100", name: "Cash — BMO Operating" },
  { code: "1110", name: "Cash — RBC USD" },
  { code: "1500", name: "Investments at cost" },
  { code: "1510", name: "Investments — FV adjustment" },
  { code: "4100", name: "Dividend Income" },
  { code: "4150", name: "Interest Income" },
  { code: "4500", name: "FX Gain/(Loss)" },
  { code: "4800", name: "Realized Gain on Investments" },
  { code: "4810", name: "Unrealized Gain on Investments" },
  { code: "4900", name: "Realized Loss on Investments" },
  { code: "4910", name: "Unrealized Loss on Investments" },
  { code: "5200", name: "Investment Fees" },
  { code: "5300", name: "Withholding Tax — Foreign" },
  { code: "6200", name: "Brokerage Fees Expense" },
];

export const formatTbAccount = (code: string) => {
  const acc = CHART_OF_ACCOUNTS.find((a) => a.code === code);
  return acc ? `${acc.code} · ${acc.name}` : code;
};

export const defaultTbAccount = (type: TxType): string => {
  switch (type) {
    case "Purchase":
    case "Sale":
    case "Transfer In":
    case "Transfer Out":
    case "Reinvested Dividend":
      return "1500";
    case "Dividend":
      return "4100";
    case "Interest":
      return "4150";
    case "Return of Capital":
      return "1500";
    case "Fee/Commission":
      return "5200";
    case "Withholding Tax":
      return "5300";
    case "FX Conversion":
      return "4500";
    default:
      return "1500";
  }
};
