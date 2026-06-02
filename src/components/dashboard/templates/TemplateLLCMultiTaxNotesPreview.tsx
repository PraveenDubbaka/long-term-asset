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

const TemplateLLCMultiTaxNotesPreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
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
      <div ref={pageRef} style={pageStyle}>
        {renderOverlays("background")}
        {showHeader && <div style={headerStyle}>Header will come here</div>}
        <div style={bodyStyle}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}>
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>ABC Company LLC</span>
            </div>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}>
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Notes to Financial Statements — Income Tax Basis</span>
            </div>
            <div style={{ fontSize: baseFontSize, fontWeight: 700 }}>
              For the year ended <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Month Date, 20XX</span>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize, marginBottom: 8 }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.label, textAlign: "left", padding: "4px 2px" }}></th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.col1, fontWeight: 700, position: "relative" }}>
                  Month Date<br />20XX
                </th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.col2, fontWeight: 700, position: "relative" }}>
                  Month Date<br />20XX
                </th>
                {manualTh}
              </tr>
            </thead>
          </table>

          {/* Note 1 */}
          {sectionTitle("1", "Basis of Presentation")}
          <p style={{ fontSize: baseFontSize, marginBottom: 8, textAlign: "justify" }}>
            These financial statements have been prepared on the income tax basis of accounting, which is a comprehensive basis of accounting other than Canadian accounting standards for private enterprises (ASPE). Under this basis, revenues are recognized when received or constructively received for tax purposes, and expenses are recognized when they qualify as deductions under the Income Tax Act (Canada). This basis differs from ASPE primarily in the treatment of capital cost allowance versus amortization, inventory valuation, prepaid expenses, and certain accruals.
          </p>

          {/* Note 2 */}
          {sectionTitle("2", "Nature of the Organization")}
          <p style={{ fontSize: baseFontSize, marginBottom: 8, textAlign: "justify" }}>
            ABC Company LLC is a limited liability company organized under the laws of the Province of [Province]. The LLC is not a taxable entity for Canadian income tax purposes. Each member reports their share of the company's income or loss on their individual income tax return (T1) based on information reported on the T5013 Statement of Partnership Income.
          </p>

          {/* Note 3 */}
          {sectionTitle("3", "Capital Assets and Capital Cost Allowance")}
          <p style={{ fontSize: baseFontSize, marginBottom: 6, textAlign: "justify" }}>
            Capital assets are recorded at cost and depreciated for tax purposes using the capital cost allowance (CCA) rates prescribed by the Income Tax Act. The undepreciated capital cost (UCC) represents the tax basis of these assets.
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize }}>
            <thead>
              <tr>
                <th style={{ width: "25%", textAlign: "left", padding: "4px 2px" }}></th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700, position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("retainedEarnings")} />}
                    CCA<br />Class
                  </th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700, position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("retainedEarnings")} />}
                    Cost
                  </th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Accumulated<br />CCA</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>UCC</th>
                {manualTh}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={labelStyle}>Furniture & Fixtures</td>
                <td className={cellStyle}>8 (20%)</td>
                <td className={cellStyle}>30,000</td>
                <td className={cellStyle}>12,000</td>
                <td className={cellStyle}>18,000</td>
              </tr>
              <tr>
                <td className={labelStyle}>Computer Equipment</td>
                <td className={cellStyle}>50 (55%)</td>
                <td className={cellStyle}>40,000</td>
                <td className={cellStyle}>20,000</td>
                <td className={cellStyle}>20,000</td>
              </tr>
              <tr>
                <td className={labelStyle}>Vehicles</td>
                <td className={cellStyle}>10 (30%)</td>
                <td className={cellStyle}>35,000</td>
                <td className={cellStyle}>11,000</td>
                <td className={cellStyle}>24,000</td>
              </tr>
              <tr>
                <td className={labelStyle}>Leasehold Improvements</td>
                <td className={cellStyle}>13</td>
                <td className={cellStyle}>40,000</td>
                <td className={cellStyle}>7,000</td>
                <td className={cellStyle}>33,000</td>
              </tr>
              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Total</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}></td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>145,000</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>50,000</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>95,000</td>
              </tr>
            </tbody>
          </table>

          <div style={{ height: 8 }} />

          {/* Note 4 */}
          {sectionTitle("4", "Long-Term Debt")}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize }}>
            <thead>
              <tr>
                <th style={{ width: colWidths.label, textAlign: "left", padding: "4px 2px" }}></th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.col1, fontWeight: 700, position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("retainedEarnings")} />}
                    20XX
                  </th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.col2, fontWeight: 700, position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("retainedEarnings")} />}
                    20XX
                  </th>
                {manualTh}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={labelStyle}>Term Loan — 5.50%, due 20XX</td>
                <td className={cellStyle}>65,000</td>
                <td className={cellStyle}>75,000</td>
              </tr>
              <tr>
                <td className={labelStyle}>Less: Current Portion</td>
                <td className={cellStyle}>(10,000)</td>
                <td className={cellStyle}>(10,000)</td>
              </tr>
              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Long-Term Portion</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>55,000</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>65,000</td>
              </tr>
            </tbody>
          </table>

          <div style={{ height: 8 }} />

          {/* Note 5 */}
          {sectionTitle("5", "Income Allocation and T5013 Filing")}
          <p style={{ fontSize: baseFontSize, marginBottom: 8, textAlign: "justify" }}>
            The LLC's income is allocated to members per the operating agreement on a 55/45 basis between Member A and Member B respectively. T5013 slips are issued to each member reflecting their share of income, losses, and other tax attributes including eligible dividends received, capital gains, and foreign income if applicable.
          </p>

          {/* Note 6 */}
          {sectionTitle("6", "Non-Deductible Expenses")}
          <p style={{ fontSize: baseFontSize, marginBottom: 8, textAlign: "justify" }}>
            Certain expenses included in the financial statements are not deductible for income tax purposes. These include 50% of meals and entertainment expenses, the personal-use portion of motor vehicle expenses, club dues, and penalties. Total non-deductible expenses for the year amounted to $13,000 (prior year — $10,200) and have been allocated to members' capital accounts proportionately per the operating agreement.
          </p>

          {/* Note 7 */}
          {sectionTitle("7", "Operating Agreement")}
          <p style={{ fontSize: baseFontSize, marginBottom: 8, textAlign: "justify" }}>
            The operating agreement provides for a 55/45 profit and loss sharing ratio between Member A and Member B respectively. Members are entitled to draw against their capital accounts in accordance with the terms of the agreement. The liability of each member is limited to their capital contribution and any undistributed profits.
          </p>
        </div>
        {showFooter && <div style={footerStyle}>Footer will come here</div>}
        {renderOverlays("foreground")}
      </div>
    </div>
  );
};

export default TemplateLLCMultiTaxNotesPreview;
