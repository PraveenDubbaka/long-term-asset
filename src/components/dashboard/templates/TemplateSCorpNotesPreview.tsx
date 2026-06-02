import { useStatementOverlays } from "@/components/dashboard/workspace/StatementImageOverlays";
import { useLayoutSettings, getFontFamily, getBodyPadding, getCompressionScale } from "@/components/dashboard/workspace/LayoutSettingsContext";

const TemplateSCorpNotesPreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
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
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}><span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Notes to Financial Statements</span></div>
            <div style={{ fontSize: baseFontSize, fontWeight: 700 }}>For the year ended <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>December 31, 20XX</span></div>
          </div>

          {noteTitle(1, "Nature of Business and S-Corporation Status")}
          {para("ABC S-Corporation (the \"Company\") was incorporated under the laws of the State of [State] and elected S-Corporation status under Section 1362 of the Internal Revenue Code effective [date]. The Company is primarily engaged in [description of business activities]. As an S-Corporation, the Company's income, losses, deductions, and credits are passed through to its shareholders for federal income tax purposes.")}

          {noteTitle(2, "Summary of Significant Accounting Policies")}
          <div style={{ fontWeight: 600, fontSize: baseFontSize * 0.95, marginBottom: 4, paddingLeft: 8 }}>Basis of Presentation</div>
          {para("The financial statements have been prepared in accordance with accounting principles generally accepted in the United States of America (U.S. GAAP).")}
          <div style={{ fontWeight: 600, fontSize: baseFontSize * 0.95, marginBottom: 4, paddingLeft: 8 }}>Revenue Recognition</div>
          {para("Revenue is recognized in accordance with ASC 606 when control of goods or services is transferred to customers in an amount that reflects the consideration expected in exchange for those goods or services.")}
          <div style={{ fontWeight: 600, fontSize: baseFontSize * 0.95, marginBottom: 4, paddingLeft: 8 }}>Accounts Receivable</div>
          {para("Accounts receivable are recorded at the invoiced amount, net of an allowance for doubtful accounts based on the Company's assessment of collectibility.")}
          <div style={{ fontWeight: 600, fontSize: baseFontSize * 0.95, marginBottom: 4, paddingLeft: 8 }}>Inventories</div>
          {para("Inventories are stated at the lower of cost or net realizable value. Cost is determined using the first-in, first-out (FIFO) method.")}
          <div style={{ fontWeight: 600, fontSize: baseFontSize * 0.95, marginBottom: 4, paddingLeft: 8 }}>Property, Plant and Equipment</div>
          {para("Property, plant and equipment are recorded at cost and depreciated using the straight-line method over estimated useful lives: Buildings 30–40 years, Equipment and Vehicles 5–10 years, Furniture and Fixtures 5–7 years.")}

          {noteTitle(3, "S-Corporation Tax Status")}
          {para("The Company has elected to be taxed as an S-Corporation under Subchapter S of the Internal Revenue Code. Under this election, the Company is generally not subject to federal income tax at the corporate level. Instead, the Company's taxable income, deductions, and credits are passed through and reported on the individual tax returns of its shareholders via Schedule K-1 (Form 1120-S). The Company may be subject to certain state-level taxes and built-in gains tax provisions.")}

          {noteTitle(4, "Officers' Compensation")}
          {para("The S-Corporation is required to pay reasonable compensation to shareholder-employees for services rendered. Officers' compensation for the year ended December 31, 20XX was $250,000. The IRS requires that shareholder-employees receive reasonable compensation before distributions are made to avoid reclassification of distributions as wages subject to employment taxes.")}

          {noteTitle(5, "Stockholders' Equity and Distributions")}
          {para("The Company is authorized to issue [number] shares of common stock with a par value of $1.00 per share. As of December 31, 20XX, there were 50,000 shares issued and outstanding. Treasury stock of [number] shares is carried at cost of $10,000. Distributions to shareholders during the year totaled $55,000 and were recorded as reductions to retained earnings.")}
          {para("The Accumulated Adjustments Account (AAA) tracks cumulative S-Corporation income that has been taxed at the shareholder level but not yet distributed. Distributions are generally tax-free to shareholders to the extent of their stock basis and AAA balance.")}

          {noteTitle(6, "Loans from Shareholders")}
          {para("The Company has outstanding loans from shareholders totaling $40,000 as of December 31, 20XX. These loans bear interest at [rate]% per annum and are subordinate to the Company's bank debt. Shareholder debt basis is relevant for the deductibility of pass-through losses at the shareholder level.")}

          {noteTitle(7, "Long-Term Debt")}
          {para("Long-term debt consists of a [type] loan bearing interest at [rate]% per annum, payable in monthly installments of $[amount], maturing on [date]. The outstanding balance was $170,000, of which $20,000 is classified as current.")}

          {noteTitle(8, "Commitments and Contingencies")}
          {para("The Company leases office and warehouse facilities under operating leases expiring through 20XX. Future minimum lease payments total approximately $[amount]. The Company is not currently a party to any material legal proceedings.")}

          {noteTitle(9, "Subsequent Events")}
          {para("Management has evaluated subsequent events through the date the financial statements were available to be issued and has determined that no events have occurred requiring disclosure or adjustment.")}
        </div>

        <div style={{ padding: `12px ${bodyPadding.split(" ")[1] || "48px"} 20px`, textAlign: "center", fontSize: 12 * scale, color: "#5a5a6e" }}>See accompanying notes to financial statements</div>
        {showFooter && <div style={{ background: "hsl(220 15% 96%)", padding: bodyPadding, textAlign: "center", fontSize: 14 * scale, color: "#5a5a6e" }}>Footer will come here</div>}
      </div>
    </div>
  );
};

export default TemplateSCorpNotesPreview;
