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

const TemplateTrustTaxNotesPreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
  const { settings, addManualColumn } = useLayoutSettings();
  const { pageRef, renderOverlays } = useStatementOverlays(false);
  const fontFamily = getFontFamily(settings);
  const bodyPadding = getBodyPadding(settings);
  const scale = getCompressionScale(settings);
  const baseFontSize = 15 * scale;

  const showHeader = settings.headerFooterEnabled && settings.headerScope !== "none";
  const showFooter = settings.headerFooterEnabled && settings.footerScope !== "none";

  const pageStyle: React.CSSProperties = { width: "842px", minHeight: "1191px", boxShadow: "0 4px 24px hsl(220 20% 10% / 0.08), 0 1px 4px hsl(220 20% 10% / 0.04)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily, background: "#fff", borderRadius: 2, border: "1px solid hsl(var(--border))" };
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
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}><span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Trust Name</span></div>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}><span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Notes to Financial Statements — Income Tax Basis</span></div>
            <div style={{ fontSize: baseFontSize, fontWeight: 700 }}>For the year ended <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Month Date, 20XX</span></div>
          </div>

          {sectionTitle("1", "Nature of the Trust")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            [Trust Name] was established pursuant to a trust indenture dated [Date] under the laws of [Province/Territory], Canada. The trust is classified as a [inter vivos / testamentary] trust for income tax purposes under the Income Tax Act (Canada) and files an annual T3 Trust Income Tax and Information Return.
          </p>

          {sectionTitle("2", "Basis of Presentation — Income Tax Basis")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            These financial statements have been prepared using the income tax basis of accounting, which differs from Canadian accounting standards for private enterprises (ASPE). Under the tax basis:
          </p>
          <ul style={{ fontSize: baseFontSize * 0.9, marginBottom: 8, paddingLeft: 24 }}>
            <li style={{ marginBottom: 4 }}>Investments are recorded at adjusted cost base (ACB) rather than fair value or amortized cost</li>
            <li style={{ marginBottom: 4 }}>Capital assets are recorded at undepreciated capital cost (UCC), with capital cost allowance (CCA) replacing amortization</li>
            <li style={{ marginBottom: 4 }}>Capital gains are reported at the 50% taxable inclusion rate</li>
            <li style={{ marginBottom: 4 }}>Dividends are reported at actual amounts received (not grossed-up)</li>
            <li style={{ marginBottom: 4 }}>Investment counsel fees are limited to 50% deductibility per ITA s. 20(1)(bb)</li>
            <li style={{ marginBottom: 4 }}>Income allocated to beneficiaries follows the designations under subsections 104(6), 104(13), and 104(21)</li>
          </ul>

          {sectionTitle("3", "Investments — Tax Cost (ACB)")}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize * 0.85, marginBottom: 12 }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ textAlign: "left", padding: "3px 8px", width: "40%" }}></th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700, position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("retainedEarnings")} />}
                    ACB<br />20XX
                  </th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>FMV<br />20XX</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Unrealized<br />Gain/(Loss)</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>ACB<br />Prior Year</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className={labelStyle}>Bonds and Fixed-Income</td><td className={cellStyle} style={{ fontWeight: 700 }}>250,000</td><td className={cellStyle}>252,500</td><td className={cellStyle}>2,500</td><td className={cellStyle}>230,000</td></tr>
              <tr><td className={labelStyle}>Equity Securities</td><td className={cellStyle} style={{ fontWeight: 700 }}>165,000</td><td className={cellStyle}>180,000</td><td className={cellStyle}>15,000</td><td className={cellStyle}>152,000</td></tr>
              <tr><td className={`${labelStyle} border-b border-black`}>Mutual / Pooled Funds</td><td className={`${cellStyle} border-b border-black`} style={{ fontWeight: 700 }}>108,000</td><td className={`${cellStyle} border-b border-black`}>120,000</td><td className={`${cellStyle} border-b border-black`}>12,000</td><td className={`${cellStyle} border-b border-black`}>100,000</td></tr>
              <tr><td className={`${labelStyle} ${thickBorderBottom}`} style={{ fontWeight: 700 }}></td><td className={`${cellStyle} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>523,000</td><td className={`${cellStyle} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>552,500</td><td className={`${cellStyle} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>29,500</td><td className={`${cellStyle} ${thickBorderBottom}`}>482,000</td></tr>
            </tbody>
          </table>
          <p style={{ fontSize: baseFontSize * 0.85, color: "#5a5a6e", marginBottom: 8 }}>Unrealized gains are not recognized under income tax basis until disposition. Capital gains are taxed at 50% inclusion upon realization.</p>

          {sectionTitle("4", "Capital Assets — Undepreciated Capital Cost (UCC)")}
          <table style={{ width: "80%", borderCollapse: "collapse", fontSize: baseFontSize * 0.85, marginBottom: 12, marginLeft: 16 }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ textAlign: "left", padding: "3px 8px", width: "35%" }}>CCA Class</th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700, position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("retainedEarnings")} />}
                    Opening<br />UCC
                  </th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>CCA<br />Claimed</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Closing<br />UCC</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className={`${labelStyle} border-b border-black`}>Class 1 — Building (4%)</td><td className={`${cellStyle} border-b border-black`}>295,000</td><td className={`${cellStyle} border-b border-black`}>15,000</td><td className={`${cellStyle} border-b border-black`} style={{ fontWeight: 700 }}>280,000</td></tr>
              <tr><td className={`${labelStyle} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Total</td><td className={`${cellStyle} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>295,000</td><td className={`${cellStyle} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>15,000</td><td className={`${cellStyle} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>280,000</td></tr>
            </tbody>
          </table>
          <p style={{ fontSize: baseFontSize * 0.85, color: "#5a5a6e", marginBottom: 4 }}>CCA is claimed in lieu of ASPE amortization. The half-year rule applies to net additions in the year of acquisition.</p>
        </div>
        {showFooter && <div style={footerStyle}>Footer will come here</div>}
        {renderOverlays("foreground")}
      </div>

      {/* Page 2 */}
      <div style={pageStyle}>
        {showHeader && <div style={headerStyle}>Header will come here</div>}
        <div style={bodyStyle}>
          {sectionTitle("5", "Rental Property — Tax Reporting")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            The trust holds a rental property reported on Form T776. Net rental income of $36,000 (prior year — $34,000) is computed after deducting property-specific expenses (maintenance $6,800, insurance $3,600, property taxes $4,500). CCA on the rental property is subject to the rental income limitation rule — CCA cannot create or increase a rental loss.
          </p>

          {sectionTitle("6", "Designations to Beneficiaries")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            Income designated to beneficiaries retains its character for tax purposes under subsection 104(13). The following designations apply:
          </p>
          <ul style={{ fontSize: baseFontSize * 0.9, marginBottom: 8, paddingLeft: 24 }}>
            <li style={{ marginBottom: 4 }}>Eligible dividends — subsection 104(19) designation preserves gross-up and dividend tax credit</li>
            <li style={{ marginBottom: 4 }}>Taxable capital gains — subsection 104(21) designation passes through 50% inclusion rate</li>
            <li style={{ marginBottom: 4 }}>Foreign income — subsection 104(22) designation passes through foreign tax credits</li>
            <li style={{ marginBottom: 4 }}>Rental income — allocated proportionally per trust indenture</li>
          </ul>
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            T3 slips are issued to each beneficiary reflecting the character of income allocated. Allocation percentages: Beneficiary A (40%), Beneficiary B (30%), Beneficiary C (30%).
          </p>

          {sectionTitle("7", "Income Taxes")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            The trust is subject to Part I tax under the Income Tax Act (Canada) at the highest marginal rate on income not distributed or designated to beneficiaries. For inter vivos trusts, the combined federal-provincial rate is approximately [XX%]. Income designated and paid or payable to beneficiaries is deductible under subsection 104(6).
          </p>
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            The provision for income taxes of $4,100 (prior year — $3,100) relates to income retained in the trust. The 21-year deemed disposition rule under subsection 104(4) may apply to capital property held in the trust — the next deemed disposition date is [Date].
          </p>

          {sectionTitle("8", "Differences from ASPE")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            Key differences between income tax basis and ASPE reporting include:
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize * 0.8, marginBottom: 12 }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ textAlign: "left", padding: "3px 8px", width: "35%" }}>Item</th>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ textAlign: "left", padding: "3px 8px", width: "32%" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("retainedEarnings")} />}
                    Tax Basis
                  </th>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ textAlign: "left", padding: "3px 8px", width: "33%" }}>ASPE</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className={`${labelStyle} border-b border-gray-300`}>Investments</td><td className={`${labelStyle} border-b border-gray-300`}>ACB</td><td className={`${labelStyle} border-b border-gray-300`}>Fair value or amortized cost</td></tr>
              <tr><td className={`${labelStyle} border-b border-gray-300`}>Capital assets</td><td className={`${labelStyle} border-b border-gray-300`}>UCC (CCA)</td><td className={`${labelStyle} border-b border-gray-300`}>Cost less amortization</td></tr>
              <tr><td className={`${labelStyle} border-b border-gray-300`}>Capital gains</td><td className={`${labelStyle} border-b border-gray-300`}>50% taxable inclusion</td><td className={`${labelStyle} border-b border-gray-300`}>Full gain recognized</td></tr>
              <tr><td className={`${labelStyle} border-b border-gray-300`}>Dividends</td><td className={`${labelStyle} border-b border-gray-300`}>Actual amount</td><td className={`${labelStyle} border-b border-gray-300`}>Actual amount</td></tr>
              <tr><td className={`${labelStyle}`}>Investment fees</td><td className={`${labelStyle}`}>50% deductible</td><td className={`${labelStyle}`}>Fully expensed</td></tr>
            </tbody>
          </table>

          {sectionTitle("9", "Financial Instruments and Risk")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            The trust is exposed to credit risk (bonds and receivables), market risk (equity securities and mutual funds), interest rate risk (bonds and fixed-income), and liquidity risk. The trustee manages these risks through diversification and regular portfolio monitoring. For tax purposes, any impairment losses on investments are only recognized upon actual disposition (superficial loss rules under section 54 may apply).
          </p>
        </div>
        {showFooter && <div style={footerStyle}>Footer will come here</div>}
        {renderOverlays("foreground")}
      </div>
    </div>
  );
};

export default TemplateTrustTaxNotesPreview;
