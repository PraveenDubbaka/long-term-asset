import React from "react";
import { useState } from "react";
import AddColumnButton from "./AddColumnButton";
import { useStatementOverlays } from "@/components/dashboard/workspace/StatementImageOverlays";
import { useLayoutSettings, getFontFamily, getBodyPadding, getCompressionScale } from "@/components/dashboard/workspace/LayoutSettingsContext";

const ManualCell = ({ className, style }: { className?: string; style?: React.CSSProperties }) => {
  const [value, setValue] = useState("");
  return (
    <td className={className} style={style}>
      <input type="text" value={value} onChange={(e) => setValue(e.target.value)} className="w-full bg-transparent text-right outline-none text-inherit placeholder:text-muted-foreground/40" placeholder="—" style={{ fontSize: "inherit", fontFamily: "inherit" }} />
    </td>
  );
};

const TemplateSoleTaxNotesPreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
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
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Notes to Financial Statements — Income Tax Basis</span>
            </div>
            <div style={{ fontSize: baseFontSize, fontWeight: 700 }}>
              For the year ended <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Month Date, 20XX</span>
            </div>
          </div>

          {sectionTitle("1", "Basis of Presentation")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            These financial statements have been prepared using the income tax basis of accounting, which differs from Canadian accounting standards for private enterprises (ASPE). Under the income tax basis, revenues and expenses are recognized in accordance with the provisions of the Income Tax Act (Canada). The principal differences from ASPE include:
          </p>
          <ul style={{ fontSize: baseFontSize * 0.9, marginBottom: 8, paddingLeft: 24, listStyleType: "disc" }}>
            <li style={{ marginBottom: 4 }}>Capital cost allowance (CCA) is used instead of amortization</li>
            <li style={{ marginBottom: 4 }}>Certain expenses are limited to their tax-deductible portions (e.g., meals at 50%, motor vehicle expenses at business-use percentage)</li>
            <li style={{ marginBottom: 4 }}>Prepaid expenses are recognized only to the extent they are deductible for tax purposes</li>
          </ul>

          {sectionTitle("2", "Nature of Business")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            The business is a sole proprietorship operating in [Province/Territory], Canada. The proprietor reports business income on Form T2125 (Statement of Business or Professional Activities) as part of the personal income tax return (T1).
          </p>

          {sectionTitle("3", "Capital Cost Allowance (CCA)")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            Capital assets are recorded at cost and written down for tax purposes using Capital Cost Allowance (CCA) rates prescribed by the Income Tax Act:
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize * 0.85, marginBottom: 12 }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ textAlign: "left", padding: "3px 8px", width: "20%" }}>CCA Class</th>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ textAlign: "left", padding: "3px 8px", width: "20%" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("retainedEarnings")} />}
                    Description
                  </th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Rate</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>UCC Opening</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>CCA Claimed</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>UCC Closing</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={labelStyle}>Class 8</td>
                <td className={labelStyle}>Equipment</td>
                <td className={cellStyle}>20%</td>
                <td className={cellStyle}>34,000</td>
                <td className={cellStyle}>4,600</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>29,400</td>
              </tr>
              <tr>
                <td className={`${labelStyle} border-b border-black`}>Class 10</td>
                <td className={`${labelStyle} border-b border-black`}>Motor Vehicle</td>
                <td className={`${cellStyle} border-b border-black`}>30%</td>
                <td className={`${cellStyle} border-b border-black`}>23,200</td>
                <td className={`${cellStyle} border-b border-black`}>3,000</td>
                <td className={`${cellStyle} border-b border-black`} style={{ fontWeight: 700 }}>20,200</td>
              </tr>
              <tr>
                <td className={`${labelStyle} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Total</td>
                <td className={`${labelStyle} ${thickBorderBottom}`}></td>
                <td className={`${cellStyle} ${thickBorderBottom}`}></td>
                <td className={`${cellStyle} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>57,200</td>
                <td className={`${cellStyle} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>7,600</td>
                <td className={`${cellStyle} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>49,600</td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            The Accelerated Investment Incentive (ACII) rules have been applied where applicable for eligible property.
          </p>
        </div>
        {showFooter && <div style={footerStyle}>Footer will come here</div>}
        {renderOverlays("foreground")}
      </div>

      {/* Page 2 */}
      <div style={pageStyle}>
        {showHeader && <div style={headerStyle}>Header will come here</div>}
        <div style={bodyStyle}>
          {sectionTitle("4", "Long-Term Debt")}
          <table style={{ width: "80%", borderCollapse: "collapse", fontSize: baseFontSize * 0.85, marginBottom: 8, marginLeft: 16 }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ textAlign: "left", padding: "3px 8px", width: "50%" }}></th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700, position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("retainedEarnings")} />}
                    20XX
                  </th>
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
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            Interest paid on business loans is deductible against business income on Form T2125.
          </p>

          {sectionTitle("5", "Proprietor's Capital — Tax Basis")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            The proprietor's capital on an income tax basis differs from ASPE due to the use of CCA instead of amortization and the exclusion of non-deductible expenses. Drawings by the proprietor are not deductible for income tax purposes.
          </p>

          {sectionTitle("6", "Tax Basis Adjustments")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            Tax basis adjustments include differences arising from:
          </p>
          <ul style={{ fontSize: baseFontSize * 0.9, marginBottom: 8, paddingLeft: 24, listStyleType: "disc" }}>
            <li style={{ marginBottom: 4 }}>Meals and entertainment limited to 50% deductibility</li>
            <li style={{ marginBottom: 4 }}>Motor vehicle expenses limited to business-use percentage</li>
            <li style={{ marginBottom: 4 }}>Home office expenses limited by CRA guidelines</li>
            <li style={{ marginBottom: 4 }}>Non-deductible penalties and fines</li>
          </ul>

          {sectionTitle("7", "Income Tax Considerations")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            As a sole proprietorship, business income is reported on the proprietor's personal T1 return and is subject to tax at the individual's marginal rate. The net business income of $27,100 (prior year — $17,000) is reported on Form T2125 and is subject to both income tax and Canada Pension Plan (CPP) self-employment contributions.
          </p>

          {sectionTitle("8", "GST/HST")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            The business is registered for GST/HST purposes. Input Tax Credits (ITCs) are claimed on eligible business expenses. GST/HST collected less ITCs claimed results in the net amount payable or receivable reported on the statement of assets and liabilities.
          </p>
        </div>
        {showFooter && <div style={footerStyle}>Footer will come here</div>}
        {renderOverlays("foreground")}
      </div>
    </div>
  );
};

export default TemplateSoleTaxNotesPreview;
