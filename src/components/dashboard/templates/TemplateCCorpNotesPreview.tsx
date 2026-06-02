import { useStatementOverlays } from "@/components/dashboard/workspace/StatementImageOverlays";
import { useLayoutSettings, getFontFamily, getBodyPadding, getCompressionScale } from "@/components/dashboard/workspace/LayoutSettingsContext";

const TemplateCCorpNotesPreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
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
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Notes to Financial Statements</span>
            </div>
            <div style={{ fontSize: baseFontSize, fontWeight: 700 }}>
              For the year ended <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>December 31, 20XX</span>
            </div>
          </div>

          {noteTitle(1, "Nature of Business")}
          {para("ABC Corporation (the \"Company\") was incorporated under the laws of the State of [State] and is primarily engaged in [description of business activities]. The Company operates in [number] locations and serves customers throughout [geographic area].")}

          {noteTitle(2, "Summary of Significant Accounting Policies")}
          <div style={{ fontWeight: 600, fontSize: baseFontSize * 0.95, marginBottom: 4, paddingLeft: 8 }}>Basis of Presentation</div>
          {para("The financial statements have been prepared in accordance with accounting principles generally accepted in the United States of America (U.S. GAAP).")}
          <div style={{ fontWeight: 600, fontSize: baseFontSize * 0.95, marginBottom: 4, paddingLeft: 8 }}>Revenue Recognition</div>
          {para("Revenue is recognized in accordance with ASC 606, Revenue from Contracts with Customers, when control of goods or services is transferred to customers in an amount that reflects the consideration expected to be entitled to in exchange for those goods or services.")}
          <div style={{ fontWeight: 600, fontSize: baseFontSize * 0.95, marginBottom: 4, paddingLeft: 8 }}>Accounts Receivable</div>
          {para("Accounts receivable are recorded at the invoiced amount and do not bear interest. The allowance for doubtful accounts is based on the Company's assessment of the collectibility of customer accounts and the aging of the receivables.")}
          <div style={{ fontWeight: 600, fontSize: baseFontSize * 0.95, marginBottom: 4, paddingLeft: 8 }}>Inventories</div>
          {para("Inventories are stated at the lower of cost or net realizable value. Cost is determined using the first-in, first-out (FIFO) method.")}
          <div style={{ fontWeight: 600, fontSize: baseFontSize * 0.95, marginBottom: 4, paddingLeft: 8 }}>Property, Plant and Equipment</div>
          {para("Property, plant and equipment are recorded at cost. Depreciation is computed using the straight-line method over the estimated useful lives of the assets: Buildings 30–40 years, Machinery and Equipment 5–15 years, Furniture and Fixtures 5–10 years.")}
          <div style={{ fontWeight: 600, fontSize: baseFontSize * 0.95, marginBottom: 4, paddingLeft: 8 }}>Goodwill and Intangible Assets</div>
          {para("Goodwill is not amortized but is tested for impairment annually, or more frequently if events or circumstances indicate that the asset might be impaired. Finite-lived intangible assets are amortized over their estimated useful lives.")}
          <div style={{ fontWeight: 600, fontSize: baseFontSize * 0.95, marginBottom: 4, paddingLeft: 8 }}>Income Taxes</div>
          {para("The Company accounts for income taxes using the asset and liability method in accordance with ASC 740, Income Taxes. Deferred tax assets and liabilities are recognized for the future tax consequences of temporary differences between the carrying amounts and tax bases of assets and liabilities.")}
          <div style={{ fontWeight: 600, fontSize: baseFontSize * 0.95, marginBottom: 4, paddingLeft: 8 }}>Earnings Per Share</div>
          {para("Basic earnings per share is computed by dividing net income by the weighted-average number of common shares outstanding during the period. Diluted earnings per share includes the dilutive effect of stock options and other potentially dilutive securities.")}

          {noteTitle(3, "Accounts Receivable")}
          {para("Accounts receivable consisted of trade receivables of $[amount], less an allowance for doubtful accounts of $[amount], resulting in net receivables of $[amount] at December 31, 20XX.")}

          {noteTitle(4, "Property, Plant and Equipment")}
          {para("Property, plant and equipment, net of accumulated depreciation, consists of Land $150,000, Buildings and Improvements $480,000, Machinery and Equipment $320,000, less Accumulated Depreciation of ($195,000), for a net book value of $755,000. Depreciation expense for the years ended December 31, 20XX and 20XX was $47,000 and $42,000, respectively.")}

          {noteTitle(5, "Long-Term Debt")}
          {para("Long-term debt consists of a [type] loan bearing interest at [rate]% per annum, payable in monthly installments of $[amount], maturing on [date]. The outstanding balance as of December 31, 20XX was $225,000, of which $25,000 is classified as the current portion.")}

          {noteTitle(6, "Stockholders' Equity")}
          {para("The Company is authorized to issue [number] shares of common stock with a par value of $1.00 per share and [number] shares of preferred stock. As of December 31, 20XX, there were 100,000 shares of common stock issued and outstanding. Treasury stock of [number] shares is carried at cost of $20,000.")}

          {noteTitle(7, "Income Taxes")}
          {para("The provision for income taxes consists of current federal and state income taxes of $68,000 and deferred income tax expense of $7,000, for a total provision of $75,000. The effective tax rate differs from the statutory federal rate primarily due to state income taxes and permanent differences.")}

          {noteTitle(8, "Commitments and Contingencies")}
          {para("The Company leases office and warehouse facilities under operating leases expiring at various dates through 20XX. Future minimum lease payments under non-cancellable operating leases total approximately $[amount]. The Company is subject to various legal proceedings in the ordinary course of business. Management believes the outcome of these proceedings will not have a material adverse effect on the financial statements.")}

          {noteTitle(9, "Subsequent Events")}
          {para("Management has evaluated subsequent events through the date the financial statements were available to be issued and has determined that no events have occurred that require disclosure or adjustment to the financial statements.")}
        </div>

        <div style={{ padding: `12px ${bodyPadding.split(" ")[1] || "48px"} 20px`, textAlign: "center", fontSize: 12 * scale, color: "#5a5a6e" }}>
          See accompanying notes to financial statements
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

export default TemplateCCorpNotesPreview;
