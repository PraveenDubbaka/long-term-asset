import { createContext, useContext, useState, useRef, ReactNode } from "react";

export interface ManualColumnSettings {
  balanceSheet: boolean;
  incomeStatement: boolean;
  retainedEarnings: boolean;
  cashFlows: boolean;
}

export interface BoardMember {
  name: string;
  title: string;
}

export type ApprovalLayout = "horizontal" | "vertical" | "grid";
export type ApprovalAlignment = "left" | "center" | "right";

export interface BoardApprovalSettings {
  enabled: boolean;
  approvalText: string;
  members: BoardMember[];
  layout: ApprovalLayout;
  alignment: ApprovalAlignment;
  columnsPerRow: number; // for grid layout: 2, 3, or 4
  showSignatureLine: boolean;
}

export interface ImageOverlay {
  id: string;
  src: string;
  fileName: string;
  layer: "background" | "foreground";
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 1-100
  opacity: number; // 0-1
  locked: boolean;
}

export interface FirmBrandingSettings {
  overlays: ImageOverlay[];
}

export const defaultFirmBranding: FirmBrandingSettings = {
  overlays: [],
};

/* ===== Partners' Capital template-specific settings ===== */
export type PCJurisdiction = "US" | "CA";
export type PCEntityType = "Partnership" | "LLP";
export type PCAllocationMethod = "equal" | "ownership" | "custom";
export type PCSchedGrouping = "byPartner" | "byClass" | "byLineItem";

/**
 * Partnership-specific layout mode (replaces the simpler auto/manual mode).
 * - auto: choose individual columns / rows / class summary based on thresholds
 * - forceColumns: each partner is its own column
 * - forceRows: each partner is its own row block
 * - forceClassSummary: aggregate to partner-class totals
 */
export type PCLayoutMode = "auto" | "forceColumns" | "forceRows" | "forceClassSummary";

/** How partner names appear in the statement headers. */
export type PCPartnerNameMode = "fullName" | "initials" | "code" | "custom";

/** Partner classes preset. */
export type PCPartnerClassesPreset = "single" | "generalLimited" | "custom";

/** Profit & loss allocation method. */
export type PCProfitLossMethod = "proRata" | "fixed" | "customPerPartner" | "perAgreement";

/** Behaviour when a partner's capital account would go negative. */
export type PCDeficitHandling = "highlight" | "warn" | "block";

export interface PartnersCapitalLineItems {
  capitalContributions: { visible: boolean; label: string };
  netIncomeAllocation: { visible: boolean; label: string };
  drawings: { visible: boolean; label: string };
  guaranteedPayments: { visible: boolean; label: string };
}

export interface PartnersCapitalCustomRow {
  id: string;
  label: string;
  section: "additions" | "deductions";
}

export interface PartnersCapitalSettings {
  // General
  jurisdiction: PCJurisdiction;
  entityType: PCEntityType;
  fiscalYearEnd: string; // ISO-ish date string e.g., "12-31"
  // Partners
  partnerCount: number; // 2..N
  partnerClasses: string[]; // free-form class labels per partner
  allocationMethod: PCAllocationMethod;
  // Display
  layoutMode: PCLayoutMode;
  /** Columns→Rows auto-switch threshold (number of partners). */
  autoSwitchColumnsToRows: number;
  /** Rows→Class Summary auto-switch threshold (number of partners). */
  autoSwitchRowsToClassSummary: number;
  /** Show "Interest %" row under each partner. */
  showInterestPercent: boolean;
  /** How partner names render in column headers. */
  partnerNameMode: PCPartnerNameMode;
  showTotalColumn: boolean;
  compactRows: boolean;
  // Line Items
  lineItems: PartnersCapitalLineItems;
  customRows: PartnersCapitalCustomRow[];
  // Supporting Schedule
  scheduleAutoGenerate: boolean;
  scheduleGrouping: PCSchedGrouping;
  schedulePaginate: boolean;
  // Partnership Configuration (Partnership-only)
  partnerClassesPreset: PCPartnerClassesPreset;
  /**
   * Roster of class labels available when partnerClassesPreset === "custom".
   * Each partner's `partnerClasses[i]` should be one of these labels.
   */
  customClassLabels: string[];
  profitLossMethod: PCProfitLossMethod;
  allocationEditablePerLine: boolean;
  allowUnequalDistributions: boolean;
  deficitHandling: PCDeficitHandling;
}

export const defaultPartnersCapitalSettings: PartnersCapitalSettings = {
  jurisdiction: "CA",
  entityType: "Partnership",
  fiscalYearEnd: "12-31",
  partnerCount: 2,
  partnerClasses: ["General", "General"],
  allocationMethod: "equal",
  layoutMode: "auto",
  autoSwitchColumnsToRows: 10,
  autoSwitchRowsToClassSummary: 50,
  showInterestPercent: true,
  partnerNameMode: "fullName",
  showTotalColumn: true,
  compactRows: false,
  lineItems: {
    capitalContributions: { visible: true, label: "Capital Contributions" },
    netIncomeAllocation: { visible: true, label: "Net Income Allocation" },
    drawings: { visible: true, label: "Drawings" },
    guaranteedPayments: { visible: true, label: "Guaranteed Payments to Partners" },
  },
  customRows: [],
  scheduleAutoGenerate: true,
  scheduleGrouping: "byPartner",
  schedulePaginate: true,
  partnerClassesPreset: "single",
  customClassLabels: ["Class A", "Class B"],
  profitLossMethod: "proRata",
  allocationEditablePerLine: true,
  allowUnequalDistributions: true,
  deficitHandling: "warn",
};

/**
 * Insertion position for a manual column relative to existing columns.
 * `index` is the column slot the user clicked on; `side` indicates whether
 * the new column should appear to the LEFT (before) or RIGHT (after) of it.
 * `end` keeps the legacy "append at the end" behavior used by ~60 templates.
 */
export type ManualColumnInsertion =
  | { mode: "end" }
  | { mode: "at"; index: number; side: "before" | "after" };

export interface ManualColumnInsertions {
  balanceSheet: ManualColumnInsertion;
  incomeStatement: ManualColumnInsertion;
  retainedEarnings: ManualColumnInsertion;
  cashFlows: ManualColumnInsertion;
}

export interface LayoutSettings {
  fontStyle: string;
  pageMargin: string;
  headerFooterEnabled: boolean;
  headerScope: string;
  footerScope: string;
  headerStretchToFit: boolean;
  footerStretchToFit: boolean;
  showCurrency: boolean;
  currencyType: string;
  currencyPlacement: string;
  figureRepresentation: string;
  compressionValue: number;
  manualColumns: ManualColumnSettings;
  manualColumnsAdded: ManualColumnSettings;
  manualColumnInsertions: ManualColumnInsertions;
  boardApproval: BoardApprovalSettings;
  firmBranding: FirmBrandingSettings;
  partnersCapital: PartnersCapitalSettings;
}

export const defaultManualColumns: ManualColumnSettings = {
  balanceSheet: false,
  incomeStatement: false,
  retainedEarnings: false,
  cashFlows: false,
};

export const defaultBoardApproval: BoardApprovalSettings = {
  enabled: false,
  approvalText: "Approved by",
  members: [],
  layout: "horizontal",
  alignment: "left",
  columnsPerRow: 2,
  showSignatureLine: true,
};

export const defaultManualColumnInsertions: ManualColumnInsertions = {
  balanceSheet: { mode: "end" },
  incomeStatement: { mode: "end" },
  retainedEarnings: { mode: "end" },
  cashFlows: { mode: "end" },
};

export const defaultLayoutSettings: LayoutSettings = {
  fontStyle: "arial",
  pageMargin: "actual",
  headerFooterEnabled: true,
  headerScope: "all",
  footerScope: "all",
  headerStretchToFit: true,
  footerStretchToFit: true,
  showCurrency: true,
  currencyType: "cad",
  currencyPlacement: "first-row",
  figureRepresentation: "actual",
  compressionValue: 50,
  manualColumns: { ...defaultManualColumns },
  manualColumnsAdded: { ...defaultManualColumns },
  manualColumnInsertions: { ...defaultManualColumnInsertions },
  boardApproval: { ...defaultBoardApproval },
  firmBranding: { ...defaultFirmBranding },
  partnersCapital: { ...defaultPartnersCapitalSettings },
};

const fontMap: Record<string, string> = {
  arial: "'Arial', 'Helvetica', sans-serif",
  times: "'Times New Roman', 'Times', serif",
  calibri: "'Calibri', 'Segoe UI', sans-serif",
  helvetica: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
};

const currencySymbolMap: Record<string, string> = {
  cad: "$",
  usd: "$",
  eur: "€",
  gbp: "£",
};

const marginMap: Record<string, string> = {
  actual: "32px 48px",
  narrow: "24px 32px",
  wide: "40px 64px",
};

export const getFontFamily = (s: LayoutSettings) => fontMap[s.fontStyle] || fontMap.arial;
export const getBodyPadding = (s: LayoutSettings) => marginMap[s.pageMargin] || marginMap.actual;
export const getCurrencySymbol = (s: LayoutSettings) => currencySymbolMap[s.currencyType] || "$";

export const getCompressionScale = (s: LayoutSettings) => {
  // 0 → 0.8x, 50 → 1.0x, 100 → 1.2x
  return 0.8 + (s.compressionValue / 100) * 0.4;
};

export const formatValue = (val: string, settings: LayoutSettings, isFirstRow?: boolean, isTotal?: boolean): string => {
  if (!val || val === "-" || val === "") return val;
  
  const { showCurrency, currencyPlacement, figureRepresentation } = settings;
  const symbol = getCurrencySymbol(settings);
  
  // Parse numeric value
  const isNeg = val.startsWith("(") && val.endsWith(")");
  const numStr = val.replace(/[(),$ €£]/g, "").replace(/,/g, "");
  const num = parseFloat(numStr);
  if (isNaN(num)) return val;
  
  let displayNum = num;
  let suffix = "";
  if (figureRepresentation === "thousands") {
    displayNum = num / 1000;
    suffix = "";
  } else if (figureRepresentation === "millions") {
    displayNum = num / 1000000;
    suffix = "";
  }
  
  const formatted = figureRepresentation === "actual"
    ? Math.abs(displayNum).toLocaleString("en-US")
    : Math.abs(displayNum).toLocaleString("en-US", { minimumFractionDigits: figureRepresentation === "millions" ? 2 : 1, maximumFractionDigits: figureRepresentation === "millions" ? 2 : 1 });
  
  const shouldShowSymbol = showCurrency && (
    currencyPlacement === "all-rows" ||
    (currencyPlacement === "first-row" && isFirstRow) ||
    (currencyPlacement === "totals-only" && isTotal)
  );
  
  const prefix = shouldShowSymbol ? symbol : "";
  return isNeg ? `(${prefix}${formatted}${suffix})` : `${prefix}${formatted}${suffix}`;
};

interface LayoutSettingsContextType {
  settings: LayoutSettings;
  applySettings: (s: LayoutSettings) => void;
  /**
   * Add a manual column for the given statement.
   * If `insertion` is provided, the column is inserted before/after the
   * specified column index. Otherwise the column is appended at the end
   * (legacy behavior used by templates).
   */
  addManualColumn: (key: keyof ManualColumnSettings, insertion?: ManualColumnInsertion) => void;
  updatePartnersCapital: (patch: Partial<PartnersCapitalSettings>) => void;
  /**
   * UI-only "Preview impact" toggle for the Partners' Capital template.
   * When ON, the preview overlays subtle highlights showing which regions
   * are driven by Partner Classes, Allocation Method, and Deficit
   * Handling. Not persisted with `applySettings` payloads.
   */
  partnersCapitalPreviewImpact: boolean;
  setPartnersCapitalPreviewImpact: (v: boolean) => void;
}

const LayoutSettingsContext = createContext<LayoutSettingsContextType>({
  settings: defaultLayoutSettings,
  applySettings: () => {},
  addManualColumn: () => {},
  updatePartnersCapital: () => {},
  partnersCapitalPreviewImpact: false,
  setPartnersCapitalPreviewImpact: () => {},
});

export const useLayoutSettings = () => useContext(LayoutSettingsContext);

export const LayoutSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<LayoutSettings>(defaultLayoutSettings);
  const [partnersCapitalPreviewImpact, setPartnersCapitalPreviewImpact] = useState(false);

  const addManualColumn = (
    key: keyof ManualColumnSettings,
    insertion: ManualColumnInsertion = { mode: "end" },
  ) => {
    setSettings(prev => ({
      ...prev,
      manualColumnsAdded: { ...prev.manualColumnsAdded, [key]: true },
      manualColumns: { ...prev.manualColumns, [key]: true },
      manualColumnInsertions: { ...prev.manualColumnInsertions, [key]: insertion },
    }));
  };

  // Per-entity-type snapshots so switching Partnership ↔ LLP preserves
  // each side's settings independently and restores the last-used values
  // when returning to a previously-used entity type. Lives outside the
  // serialized settings object — purely runtime memory inside the provider.
  const entitySnapshots = useRef<Partial<Record<PCEntityType, PartnersCapitalSettings>>>({});

  const updatePartnersCapital = (patch: Partial<PartnersCapitalSettings>) => {
    setSettings(prev => {
      // Detect an entity-type switch and swap snapshots accordingly.
      const switchingEntity =
        patch.entityType !== undefined && patch.entityType !== prev.partnersCapital.entityType;

      let next: PartnersCapitalSettings;
      if (switchingEntity) {
        // 1. Snapshot the *current* entity's settings before leaving it.
        entitySnapshots.current[prev.partnersCapital.entityType] = { ...prev.partnersCapital };

        // 2. Restore the target entity's last-used snapshot, or fall back
        //    to defaults rebased on the new entity type. Apply the rest of
        //    the patch on top so co-submitted fields still take effect.
        const restored =
          entitySnapshots.current[patch.entityType!] ?? {
            ...defaultPartnersCapitalSettings,
            entityType: patch.entityType!,
          };
        next = { ...restored, ...patch };
      } else {
        next = { ...prev.partnersCapital, ...patch };
      }

      // Allow invalid intermediate partnerCount values (e.g., 0/1) into state
      // so validation can flag them and block save. Only resize the
      // partnerClasses array when the count is a usable integer ≥ 2.
      if (patch.partnerCount !== undefined) {
        const raw = Math.floor(patch.partnerCount);
        next.partnerCount = Number.isFinite(raw) ? raw : 0;
        if (raw >= 2 && raw <= 500) {
          const classes = [...next.partnerClasses];
          // For custom preset, default new partners to the first class label.
          const fallback =
            next.partnerClassesPreset === "custom"
              ? next.customClassLabels[0] ?? "General"
              : "General";
          while (classes.length < raw) classes.push(fallback);
          classes.length = raw;
          next.partnerClasses = classes;
        }
      }

      // Keep the live snapshot for the *current* entity in sync so future
      // switches restore the latest values (not just the pre-switch state).
      entitySnapshots.current[next.entityType] = next;

      return { ...prev, partnersCapital: next };
    });
  };

  return (
    <LayoutSettingsContext.Provider value={{ settings, applySettings: setSettings, addManualColumn, updatePartnersCapital, partnersCapitalPreviewImpact, setPartnersCapitalPreviewImpact }}>
      {children}
    </LayoutSettingsContext.Provider>
  );
};
