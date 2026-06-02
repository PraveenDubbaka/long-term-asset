import React from "react";
import { useState } from "react";
import AddColumnButton from "./AddColumnButton";
import { useStatementOverlays } from "@/components/dashboard/workspace/StatementImageOverlays";
import { useLayoutSettings, getFontFamily, getBodyPadding, getCompressionScale, formatValue } from "@/components/dashboard/workspace/LayoutSettingsContext";

const ManualCell = ({ className, style }: { className?: string; style?: React.CSSProperties }) => {
  const [value, setValue] = useState("");
  return (
    <td className={className} style={style}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full bg-transparent text-right outline-none text-inherit placeholder:text-muted-foreground/40"
        placeholder="—"
        style={{ fontSize: "inherit", fontFamily: "inherit" }}
      />
    </td>
  );
};

const TemplateSoleNotesPreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
  const { settings, addManualColumn } = useLayoutSettings();
  const { pageRef, renderOverlays } = useStatementOverlays(false);
  const fontFamily = getFontFamily(settings);
  const bodyPadding = getBodyPadding(settings);
  const scale = getCompressionScale(settings);
  const baseFontSize = 15 * scale;

  const showHeader = settings.headerFooterEnabled && settings.headerScope !== "none";
  const showFooter = settings.headerFooterEnabled && settings.footerScope !== "none";

  const pageStyle: React.CSSProperties = {
    width: "842px",
    minHeight: "1191px",
    boxShadow: "0 4px 24px hsl(220 20% 10% / 0.08), 0 1px 4px hsl(220 20% 10% / 0.04)",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    fontFamily,
    background: "#fff",
    borderRadius: 2,
    border: "1px solid hsl(var(--border))",
  };

  const headerStyle: React.CSSProperties = { background: "hsl(220 15% 96%)", padding: bodyPadding, textAlign: "center", fontSize: 14 * scale, color: "#5a5a6e" };
  const footerStyle: React.CSSProperties = { background: "hsl(220 15% 96%)", padding: bodyPadding, textAlign: "center", fontSize: 14 * scale, color: "#5a5a6e" };
  const bodyStyle: React.CSSProperties = { flex: 1, padding: bodyPadding, fontSize: baseFontSize, color: "#1a1a1a", position: "relative", lineHeight: 1.6 };

  const cellStyle = "px-2 py-[2px] text-right whitespace-nowrap text-sm";
  const labelStyle = "px-2 py-[2px] text-left text-sm";
  const thickBorderTop = "border-t-2 border-black";
  const thickBorderBottom = "border-b-2 border-black";
  const showManual = false;
  const showAddButtons = false;
  const colWidths = { label: "55%", col1: "22.5%", col2: "22.5%" };
  const manualTh = null;
  const emptyManualTd = null;

  const sectionTitle = (num: string, title: string) => (
    <div style={{ fontWeight: 700, fontSize: baseFontSize, marginTop: 16, marginBottom: 6 }}>{num}. {title}</div>
  );

  return (
    <div className="flex-1 flex flex-col items-center gap-8 p-6 bg-muted/30 overflow-y-auto">
      {/* Page 1 */}
      <div ref={pageRef} style={pageStyle}>
        {renderOverlays("background")}
        {showHeader && <div style={headerStyle}>Header will come here</div>}
        <div style={bodyStyle}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}>
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Business Name</span>
            </div>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}>
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Notes to Financial Statements</span>
            </div>
            <div style={{ fontSize: baseFontSize, fontWeight: 700 }}>
              For the year ended <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Month Date, 20XX</span>
            </div>
          </div>

          {sectionTitle("1", "Nature of Business")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            The business is a sole proprietorship operating in [Province/Territory], Canada. The proprietor carries on business under the name "[Business Name]". The principal activities include [description of activities].
          </p>
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            As a sole proprietorship, the business is not a separate legal entity from its owner. Income of the business is reported on the proprietor's personal income tax return.
          </p>

          {sectionTitle("2", "Significant Accounting Policies")}
          <p style={{ fontSize: baseFontSize * 0.85, fontWeight: 700, marginBottom: 4 }}>Basis of Presentation</p>
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            These financial statements have been prepared in accordance with Canadian accounting standards for private enterprises (ASPE) as set out in Part II of the CPA Canada Handbook — Accounting.
          </p>
          <p style={{ fontSize: baseFontSize * 0.85, fontWeight: 700, marginBottom: 4 }}>Revenue Recognition</p>
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            Revenue from sales is recognized at the point of sale when ownership of goods is transferred to the customer. Service revenue is recognized as services are rendered.
          </p>
          <p style={{ fontSize: baseFontSize * 0.85, fontWeight: 700, marginBottom: 4 }}>Inventory</p>
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            Inventory is valued at the lower of cost and net realizable value. Cost is determined using the first-in, first-out (FIFO) method.
          </p>
          <p style={{ fontSize: baseFontSize * 0.85, fontWeight: 700, marginBottom: 4 }}>Capital Assets</p>
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            Capital assets are recorded at cost and amortized over their estimated useful lives using the following methods and rates:
          </p>
          <table style={{ width: "70%", borderCollapse: "collapse", fontSize: baseFontSize * 0.85, marginBottom: 8, marginLeft: 16 }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ textAlign: "left", padding: "3px 8px" }}>Asset</th>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ textAlign: "left", padding: "3px 8px" }}>Method</th>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ textAlign: "left", padding: "3px 8px" }}>Rate</th>
                {manualTh}
              </tr>
            </thead>
            <tbody>
              <tr><td className={labelStyle}>Equipment</td><td className={labelStyle}>Declining balance</td><td className={labelStyle}>20%</td>{emptyManualTd}</tr>
              <tr><td className={labelStyle}>Motor Vehicle</td><td className={labelStyle}>Declining balance</td><td className={labelStyle}>30%</td>{emptyManualTd}</tr>
            </tbody>
          </table>
          <p style={{ fontSize: baseFontSize * 0.85, fontWeight: 700, marginBottom: 4 }}>Income Taxes</p>
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            As a sole proprietorship, the business does not pay income taxes directly. Business income is included in the proprietor's personal income tax return and taxed at the individual's marginal tax rate.
          </p>
          <p style={{ fontSize: baseFontSize * 0.85, fontWeight: 700, marginBottom: 4 }}>Use of Estimates</p>
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            The preparation of financial statements in accordance with ASPE requires management to make estimates and assumptions that affect the reported amounts. Actual results may differ from those estimates.
          </p>
        </div>
        {showFooter && <div style={footerStyle}>Footer will come here</div>}
        {renderOverlays("foreground")}
      </div>

      {/* Page 2 */}
      <div style={pageStyle}>
        {showHeader && <div style={headerStyle}>Header will come here</div>}
        <div style={bodyStyle}>
          {sectionTitle("3", "Capital Assets")}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize * 0.85, marginBottom: 12 }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ textAlign: "left", padding: "3px 8px", width: "30%" }}></th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Cost</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Accumulated<br />Amortization</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>20XX<br />Net</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>20XX<br />Net</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={labelStyle}>Equipment</td>
                <td className={cellStyle}>45,000</td>
                <td className={cellStyle}>12,500</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>32,500</td>
                <td className={cellStyle}>34,000</td>
              </tr>
              <tr>
                <td className={`${labelStyle} border-b border-black`}>Motor Vehicle</td>
                <td className={`${cellStyle} border-b border-black`}>32,000</td>
                <td className={`${cellStyle} border-b border-black`}>6,000</td>
                <td className={`${cellStyle} border-b border-black`} style={{ fontWeight: 700 }}>26,000</td>
                <td className={`${cellStyle} border-b border-black`}>26,000</td>
              </tr>
              <tr>
                <td className={`${labelStyle} ${thickBorderBottom}`} style={{ fontWeight: 700 }}></td>
                <td className={`${cellStyle} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>77,000</td>
                <td className={`${cellStyle} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>18,500</td>
                <td className={`${cellStyle} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>58,500</td>
                <td className={`${cellStyle} ${thickBorderBottom}`}>60,000</td>
              </tr>
            </tbody>
          </table>

          {sectionTitle("4", "Long-Term Debt")}
          <table style={{ width: "80%", borderCollapse: "collapse", fontSize: baseFontSize * 0.85, marginBottom: 8, marginLeft: 16 }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ textAlign: "left", padding: "3px 8px", width: "50%" }}></th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>20XX</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>20XX</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={`${labelStyle} border-b border-black`}>Bank loan, bearing interest at prime + 1.5%, repayable in monthly instalments of $500 plus interest, secured by equipment</td>
                <td className={`${cellStyle} border-b border-black`} style={{ fontWeight: 700 }}>24,000</td>
                <td className={`${cellStyle} border-b border-black`}>30,000</td>
              </tr>
              <tr>
                <td className={labelStyle}>Less: Current portion</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>(6,000)</td>
                <td className={cellStyle}>(6,000)</td>
              </tr>
              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}></td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>18,000</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}>24,000</td>
              </tr>
            </tbody>
          </table>

          {sectionTitle("5", "Proprietor's Capital")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            The proprietor's capital represents the owner's equity in the business. The proprietor may contribute additional capital or withdraw funds (drawings) at any time. There are no restrictions on the proprietor's access to business assets.
          </p>

          {sectionTitle("6", "Related Party Transactions")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            The proprietor's drawings during the year amounted to $16,800 (prior year — $17,000). These transactions are measured at the exchange amount, which is the amount of consideration established and agreed to by the related parties.
          </p>

          {sectionTitle("7", "Financial Instruments")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            The business is exposed to the following risks through its financial instruments: credit risk from accounts receivable, liquidity risk from accounts payable and long-term debt, and interest rate risk from the variable-rate bank loan. Management does not believe these risks are significant.
          </p>
        </div>
        {showFooter && <div style={footerStyle}>Footer will come here</div>}
        {renderOverlays("foreground")}
      </div>
    </div>
  );
};

export default TemplateSoleNotesPreview;
