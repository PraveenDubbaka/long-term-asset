import { useStatementOverlays } from "@/components/dashboard/workspace/StatementImageOverlays";
import { useLayoutSettings, getFontFamily, getBodyPadding, getCompressionScale } from "@/components/dashboard/workspace/LayoutSettingsContext";

const TemplateSCorpTaxNotesPreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
  const { settings } = useLayoutSettings();
  const { pageRef, renderOverlays } = useStatementOverlays(false);
  const fontFamily = getFontFamily(settings);
  const bodyPadding = getBodyPadding(settings);
  const scale = getCompressionScale(settings);
  const baseFontSize = 15 * scale;

  const showHeader = settings.headerFooterEnabled && settings.headerScope !== "none";
  const showFooter = settings.headerFooterEnabled && settings.footerScope !== "none";

  const noteTitle = (num: number, title: string) => (
    <div style={{ fontWeight: 700, fontSize: baseFontSize, marginTop: num === 1 ? 0 : 18, marginBottom: 6 }}>
      Note {num} — {title}
    </div>
  );

  const para = (text: string) => (
    <div style={{ fontSize: baseFontSize, lineHeight: 1.6, marginBottom: 8, textAlign: "justify" }}>{text}</div>
  );

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-muted/30">
      <div ref={pageRef} className="bg-white rounded-sm border border-border" style={{ width: "842px", minHeight: "1191px", boxShadow: "0 4px 24px hsl(220 20% 10% / 0.08), 0 1px 4px hsl(220 20% 10% / 0.04)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily }}>
        {renderOverlays("background")}
        {showHeader && <div style={{ background: "hsl(220 15% 96%)", padding: bodyPadding, textAlign: "center", fontSize: 14 * scale, color: "#5a5a6e" }}>Header will come here</div>}

        <div style={{ flex: 1, padding: bodyPadding, fontSize: baseFontSize, color: "#1a1a1a", position: "relative" }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}><span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>ABC S-Corporation</span></div>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}><span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Notes to Tax-Basis Financial Statements</span></div>
            <div style={{ fontSize: baseFontSize, fontWeight: 700 }}>For the year ended <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>December 31, 20XX</span></div>
          </div>

          {noteTitle(1, "Basis of Presentation")}
          {para("The accompanying financial statements have been prepared on the income tax basis of accounting, which is a comprehensive basis of accounting other than accounting principles generally accepted in the United States of America (GAAP). Under this basis, revenue and expenses are recognized in accordance with the methods used for federal income tax purposes. The tax basis differs from GAAP primarily in the treatment of depreciation, certain accruals, and the timing of income and expense recognition.")}

          {noteTitle(2, "S-Corporation Tax Election")}
          {para("ABC S-Corporation elected S-Corporation status under Section 1362 of the Internal Revenue Code effective [date]. As an S-Corporation, the Company is generally not subject to federal income tax at the entity level. Instead, items of income, loss, deduction, and credit are passed through to shareholders and reported on their individual returns via Schedule K-1 (Form 1120-S). The Company may be subject to state-level franchise or income taxes in certain jurisdictions.")}

          {noteTitle(3, "Depreciation — Tax Basis")}
          {para("Property and equipment are depreciated for tax purposes using the Modified Accelerated Cost Recovery System (MACRS) as prescribed by the Internal Revenue Code. Depreciation expense for the year includes amounts computed under MACRS using the applicable recovery periods: 5-year property for equipment and vehicles, 7-year property for furniture and fixtures, and 39-year property for nonresidential real property. The Company elected Section 179 expensing of $15,000 and bonus depreciation where applicable under current tax law.")}

          {noteTitle(4, "Officers' Compensation")}
          {para("The S-Corporation paid reasonable compensation to shareholder-officers totaling $250,000 for the year ended December 31, 20XX, as required by the IRS. Compensation is reported on Line 7 of Form 1120-S and is subject to employment taxes (FICA and Medicare). The IRS requires that shareholder-employees receive reasonable compensation before distributions are made to prevent reclassification of distributions as wages.")}

          {noteTitle(5, "Stockholders' Equity — Tax Basis")}
          {para("Stockholders' equity on a tax basis includes Common Stock ($50,000), Additional Paid-in Capital ($125,000), and Retained Earnings computed on the income tax basis. The Accumulated Adjustments Account (AAA) of $348,000 tracks cumulative S-Corporation income taxed at the shareholder level but not yet distributed. The Other Adjustments Account (OAA) of $6,000 tracks tax-exempt income and related expenses. Distributions are applied first against AAA, then against previously taxed income, and finally against stock basis.")}

          {noteTitle(6, "Shareholder Stock and Debt Basis")}
          {para("Each shareholder's ability to deduct pass-through losses is limited to their stock and debt basis in the S-Corporation. Stock basis is increased by capital contributions and the shareholder's pro rata share of income and separately stated items, and decreased by distributions and the shareholder's share of losses and non-deductible expenses. Debt basis arises from direct loans made by shareholders to the Corporation.")}

          {noteTitle(7, "Reconciliation of Tax Basis to GAAP")}
          {para("The primary differences between the tax basis and GAAP basis of the financial statements are: (1) Depreciation — MACRS tax depreciation of $52,000 vs. GAAP straight-line depreciation of $32,000, resulting in a difference of $20,000; (2) Prepaid expenses — certain prepaid items are deductible when paid for tax purposes but are capitalized under GAAP; (3) Accrued liabilities — certain accruals recognized under GAAP may not be deductible until paid for tax purposes.")}

          {noteTitle(8, "Loans from Shareholders")}
          {para("The Company has outstanding loans from shareholders totaling $40,000 as of December 31, 20XX. These loans bear interest at the applicable federal rate (AFR) and are subordinate to the Company's bank debt. Shareholder debt basis from these loans allows shareholders to deduct pass-through losses in excess of their stock basis, subject to the at-risk and passive activity limitation rules.")}

          {noteTitle(9, "Subsequent Events")}
          {para("Management has evaluated subsequent events through the date the financial statements were available to be issued and has determined that no events have occurred requiring disclosure or adjustment to the tax-basis financial statements.")}
        </div>

        <div style={{ padding: `12px ${bodyPadding.split(" ")[1] || "48px"} 20px`, textAlign: "center", fontSize: 12 * scale, color: "#5a5a6e" }}>See accompanying notes to tax-basis financial statements</div>
        {showFooter && <div style={{ background: "hsl(220 15% 96%)", padding: bodyPadding, textAlign: "center", fontSize: 14 * scale, color: "#5a5a6e" }}>Footer will come here</div>}
      </div>
    </div>
  );
};

export default TemplateSCorpTaxNotesPreview;
