import type { FSVersion } from "./types";

const authors = {
  sarah: { id: "u1", name: "Sarah Chen", initials: "SC", avatarColor: "hsl(270 60% 55%)", role: "manager" },
  james: { id: "u2", name: "James Liu", initials: "JL", avatarColor: "hsl(210 70% 50%)", role: "preparer" },
  priya: { id: "u3", name: "Priya Sharma", initials: "PS", avatarColor: "hsl(340 65% 55%)", role: "reviewer" },
};

export const mockVersions: FSVersion[] = [
  {
    id: "v8", versionNumber: "3.2", label: "Current Version",
    timestamp: new Date(Date.now() - 1800000),
    author: authors.james, description: "Updated cash flow operating activities totals",
    scope: "statement", screens: ["Statement of Cash Flows"],
    changes: [
      { screen: "Statement of Cash Flows", field: "Net cash used in operating activities", oldValue: "(271,138)", newValue: "(276,138)" },
      { screen: "Statement of Cash Flows", field: "Cash and cash equivalents, end of year", oldValue: "(260,570)", newValue: "(265,570)" },
    ],
    isCurrent: true,
  },
  {
    id: "v7", versionNumber: "3.1", label: "Reviewer adjustments",
    timestamp: new Date(Date.now() - 7200000),
    author: authors.priya, description: "Adjusted equity section and retained earnings",
    scope: "engagement", screens: ["Balance Sheet", "Statement of Income Loss"],
    changes: [
      { screen: "Balance Sheet", field: "Deficit", oldValue: "(270,486)", newValue: "(275,486)" },
      { screen: "Balance Sheet", field: "Total Equity", oldValue: "(276,132)", newValue: "(281,132)" },
      { screen: "Statement of Income Loss", field: "Retained Earnings (Deficit), end of year", oldValue: "(270,486)", newValue: "(275,486)" },
    ],
  },
  {
    id: "v6", versionNumber: "3.0", label: "Major revision — Q4 entries",
    timestamp: new Date(Date.now() - 86400000),
    author: authors.sarah, description: "Incorporated Q4 adjusting entries across all statements",
    scope: "engagement", screens: ["Balance Sheet", "Statement of Income Loss", "Statement of Cash Flows", "Notes to Financial Information"],
    changes: [
      { screen: "Balance Sheet", field: "Total Assets", oldValue: "(240,067)", newValue: "(249,067)" },
      { screen: "Balance Sheet", field: "Accounts payable and accrued liabilities", oldValue: "42,492", newValue: "47,492" },
      { screen: "Statement of Income Loss", field: "Total Revenue", oldValue: "(850)", newValue: "(989)" },
      { screen: "Statement of Income Loss", field: "Net Income (Loss)", oldValue: "18,033", newValue: "22,033" },
      { screen: "Statement of Cash Flows", field: "Net Income", oldValue: "18,033", newValue: "22,033" },
    ],
  },
  {
    id: "v5", versionNumber: "2.2", label: "PPE corrections",
    timestamp: new Date(Date.now() - 172800000),
    author: authors.james, description: "Corrected property, plant and equipment amortization",
    scope: "statement", screens: ["Notes to Financial Information"],
    changes: [
      { screen: "Notes to Financial Information", field: "Buildings - Net Book Value", oldValue: "259", newValue: "359" },
      { screen: "Notes to Financial Information", field: "Total PPE", oldValue: "(1,383)", newValue: "(1,483)" },
    ],
  },
  {
    id: "v4", versionNumber: "2.1", label: "Tax payable update",
    timestamp: new Date(Date.now() - 345600000),
    author: authors.priya, description: "Updated taxes payable based on CRA assessment",
    scope: "statement", screens: ["Balance Sheet"],
    changes: [
      { screen: "Balance Sheet", field: "Taxes payable", oldValue: "(8,482)", newValue: "(11,482)" },
      { screen: "Balance Sheet", field: "Total Current Liabilities", oldValue: "36,727", newValue: "39,727" },
    ],
  },
  {
    id: "v3", versionNumber: "2.0", label: "Initial review completed",
    timestamp: new Date(Date.now() - 604800000),
    author: authors.sarah, description: "Manager review completed — approved with minor adjustments",
    scope: "engagement", screens: ["Balance Sheet", "Statement of Income Loss", "Statement of Cash Flows"],
    changes: [
      { screen: "Balance Sheet", field: "Allowance for doubtful debt", oldValue: "(1,721)", newValue: "(2,721)" },
      { screen: "Statement of Income Loss", field: "Cost of Sales", oldValue: "2,416", newValue: "2,916" },
    ],
  },
  {
    id: "v2", versionNumber: "1.1", label: "Draft adjustments",
    timestamp: new Date(Date.now() - 864000000),
    author: authors.james, description: "Applied trial balance adjustments to draft statements",
    scope: "engagement", screens: ["Balance Sheet", "Statement of Income Loss", "Statement of Cash Flows"],
    changes: [
      { screen: "Balance Sheet", field: "Other current assets", oldValue: "(200,740)", newValue: "(243,740)" },
      { screen: "Statement of Income Loss", field: "Total Expenses", oldValue: "(20,679)", newValue: "(25,679)" },
    ],
  },
  {
    id: "v1", versionNumber: "1.0", label: "Initial draft from Luka",
    timestamp: new Date(Date.now() - 1209600000),
    author: { id: "luka", name: "Luka AI", initials: "LA", avatarColor: "hsl(270 70% 55%)", role: "preparer" },
    description: "Auto-generated financial statements from trial balance import",
    scope: "engagement", screens: ["Balance Sheet", "Statement of Income Loss", "Statement of Cash Flows", "Notes to Financial Information"],
    changes: [],
  },
];
