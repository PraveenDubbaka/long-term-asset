export type AssetCategory =
  | 'Land'
  | 'Class 6 Buildings'
  | 'Equipment'
  | 'Automotive Equipment'
  | 'Trailers'
  | 'Class 1 Buildings'
  | 'Computer Equipment';

export type AmortMethod = 'Declining Balance' | 'Straight Line' | 'N/A';

export interface CapitalAsset {
  id: string;
  description: string;
  category: AssetCategory;
  dateAdded?: string;             // e.g. "May 02 08"
  cost2023: number;               // opening cost
  additions2024: number;
  disposals2024: number;          // cost of disposed assets
  cost2024: number;               // closing cost = cost2023 + additions - disposals
  proceedsOnDisposal: number;
  gainLossOnDisposal: number;
  accumAmort2023: number;         // opening accumulated amortization
  amortReductions2024: number;    // accum amort attributable to disposed assets
  adjustedOpeningAmort: number;   // = accumAmort2023 − amortReductions2024
  amortRate: number;              // e.g. 5, 10, 15, 25, 30
  proRateMonths: number;          // usually 12
  amortExpense2024: number;
  accumAmort2024: number;         // = adjustedOpeningAmort + amortExpense2024
  netBookValue2024: number;       // = cost2024 − accumAmort2024
  netBookValue2023: number;       // = cost2023 − accumAmort2023
  wpRef?: string;
  ccaClass: string;
  amortMethod: AmortMethod;
  glAccount?: string;
  notes?: string;
  isDisposed?: boolean;
}

export interface CapAssetAJELine {
  account: string;
  glCode: string;
  dr: number;
  cr: number;
}

export interface CapAssetAJE {
  id: string;
  entryNo: string;
  date: string;
  description: string;
  type: 'Amortization' | 'Disposal' | 'Acquisition' | 'Correcting' | 'Reclassification';
  confidence: 'High' | 'Medium' | 'Low';
  status: 'Draft' | 'Approved' | 'Posted';
  lines: CapAssetAJELine[];
  rationale: string;
  wpRef?: string;
  notes?: string;
}
