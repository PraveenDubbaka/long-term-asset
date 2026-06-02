import { useStatementOverlays } from "@/components/dashboard/workspace/StatementImageOverlays";
import { useLayoutSettings, getFontFamily, getBodyPadding, getCompressionScale } from "@/components/dashboard/workspace/LayoutSettingsContext";

const TemplateCCorpTaxNotesPreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
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
    <div style={{ fontSize: baseFontSize, lineHeight: 1.6, marginBottom: 8, textAlign: "justify" }}>
      {text}
    </div>
  );

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-muted/30">
      <div
        ref={pageRef}
        className="bg-white rounded-sm border border-border"
        style={{
          width: "842px",
          minHeight: "1191px",
          boxShadow: "0 4px 24px hsl(220 20% 10% / 0.08), 0 1px 4px hsl(220 20% 10% / 0.04)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily,
        }}
      >
        {renderOverlays("background")}
        {showHeader && (
          <div style={{ background: "hsl(220 15% 96%)", padding: bodyPadding, textAlign: "center", fontSize: 14 * scale, color: "#5a5a6e" }}>
            Header will come here
          </div>
        )}

        <div style={{ flex: 1, padding: bodyPadding, fontSize: baseFontSize, color: "#1a1a1a", position: "relative" }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}>
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>ABC Corporation</span>
            </div>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}>
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Notes to Tax-Basis Financial Statements</span>
            </div>
            <div style={{ fontSize: baseFontSize, fontWeight: 700 }}>
              For the year ended <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>December 31, 20XX</span>
            </div>
          </div>

          {noteTitle(1, "Basis of Presentation")}
          {para("The accompanying financial statements have been prepared on the income tax basis of accounting, which is a comprehensive basis of accounting other than accounting principles generally accepted in the United States of America (U.S. GAAP). Under this basis, revenues are recognized when received or constructively received, and expenses are recognized when paid or incurred for tax purposes, in accordance with the provisions of the Internal Revenue Code and applicable regulations.")}
          {para("The income tax basis of accounting differs from GAAP primarily in the treatment of depreciation (MACRS vs. straight-line), recognition of certain revenues and expenses, and the treatment of certain assets and liabilities.")}

          {noteTitle(2, "Nature of Business")}
          {para("ABC Corporation (the \"Company\") was incorporated under the laws of the State of [State] and is primarily engaged in [description of business activities]. The Company files its federal income tax return on Form 1120 as a C-Corporation and is subject to federal income tax at the statutory rate of 21%.")}

          {noteTitle(3, "Summary of Significant Tax Accounting Policies")}
          <div style={{ fontWeight: 600, fontSize: baseFontSize * 0.95, marginBottom: 4, paddingLeft: 8 }}>Tax Year and Method</div>
          {para("The Company reports on a calendar year basis using the accrual method of accounting for federal income tax purposes.")}
          <div style={{ fontWeight: 600, fontSize: baseFontSize * 0.95, marginBottom: 4, paddingLeft: 8 }}>Revenue Recognition</div>
          {para("Revenue is recognized in accordance with the Internal Revenue Code provisions applicable to the Company's method of accounting. Gross receipts include all amounts received or accrued from sales of goods and performance of services.")}
          <div style={{ fontWeight: 600, fontSize: baseFontSize * 0.95, marginBottom: 4, paddingLeft: 8 }}>Depreciation — MACRS</div>
          {para("Property and equipment are depreciated using the Modified Accelerated Cost Recovery System (MACRS) as prescribed by the Internal Revenue Code. The half-year convention is applied unless the mid-quarter convention is required. Buildings are depreciated over 39 years (non-residential) using the straight-line method. Machinery and equipment are depreciated over 5–7 years using the 200% declining balance method.")}
          <div style={{ fontWeight: 600, fontSize: baseFontSize * 0.95, marginBottom: 4, paddingLeft: 8 }}>Section 179 Deduction</div>
          {para("The Company elected to expense qualifying property under Section 179 of the Internal Revenue Code. The deduction for the current year was $15,000.")}
          <div style={{ fontWeight: 600, fontSize: baseFontSize * 0.95, marginBottom: 4, paddingLeft: 8 }}>Section 197 Intangibles</div>
          {para("Intangible assets acquired in connection with the acquisition of a business are amortized over 15 years on a straight-line basis under Section 197 of the Internal Revenue Code.")}
          <div style={{ fontWeight: 600, fontSize: baseFontSize * 0.95, marginBottom: 4, paddingLeft: 8 }}>Inventories</div>
          {para("Inventories are valued at cost using the first-in, first-out (FIFO) method for tax purposes, in accordance with Section 471 and 472 of the Internal Revenue Code.")}

          {noteTitle(4, "Property and Equipment — Tax Basis")}
          {para("Property and equipment, net of accumulated MACRS depreciation, consists of Land $150,000, Buildings and Improvements $480,000, Machinery and Equipment $320,000, less Accumulated MACRS Depreciation of ($245,000), for a net tax basis of $705,000. Tax depreciation expense (including Section 179) for the year was $82,000.")}

          {noteTitle(5, "Long-Term Debt")}
          {para("Long-term debt consists of a [type] loan bearing interest at [rate]% per annum, maturing on [date]. Interest expense of $12,000 was deducted on the tax return. The outstanding balance as of December 31, 20XX was $225,000, of which $25,000 is classified as the current portion.")}

          {noteTitle(6, "Federal Income Tax")}
          {para("The Company is subject to federal income tax at the flat corporate rate of 21% under the Tax Cuts and Jobs Act. The federal income tax provision for the year ended December 31, 20XX was $49,980. The Company is also subject to state income taxes in [State(s)]. The Company has no net operating loss carryforwards as of December 31, 20XX.")}

          {noteTitle(7, "Stockholders' Equity")}
          {para("The Company is authorized to issue [number] shares of common stock with a par value of $1.00 per share. As of December 31, 20XX, there were 100,000 shares issued and outstanding. Treasury stock consists of [number] shares carried at cost of $20,000. Dividends of $150,020 were declared and paid during the year.")}

          {noteTitle(8, "Book-to-Tax Differences")}
          {para("The primary differences between the tax basis and GAAP basis of the financial statements relate to: (1) Depreciation — MACRS depreciation of $82,000 versus GAAP straight-line depreciation of $47,000, resulting in a cumulative difference of $50,000; (2) Prepaid expenses — certain prepaid items deductible when paid for tax purposes versus when consumed for GAAP; (3) Bad debt expense — direct write-off method for tax versus allowance method for GAAP.")}

          {noteTitle(9, "Subsequent Events")}
          {para("Management has evaluated subsequent events through the date the financial statements were available to be issued and has determined that no events have occurred that require disclosure or adjustment to these tax-basis financial statements.")}
        </div>

        <div style={{ padding: `12px ${bodyPadding.split(" ")[1] || "48px"} 20px`, textAlign: "center", fontSize: 12 * scale, color: "#5a5a6e" }}>
          See accompanying notes to tax-basis financial statements
        </div>
        {showFooter && (
          <div style={{ background: "hsl(220 15% 96%)", padding: bodyPadding, textAlign: "center", fontSize: 14 * scale, color: "#5a5a6e" }}>
            Footer will come here
          </div>
        )}
        {renderOverlays("foreground")}
      </div>
    </div>
  );
};

export default TemplateCCorpTaxNotesPreview;
