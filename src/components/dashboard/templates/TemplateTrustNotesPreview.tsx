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

const TemplateTrustNotesPreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
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
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}><span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Notes to Financial Statements</span></div>
            <div style={{ fontSize: baseFontSize, fontWeight: 700 }}>For the year ended <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Month Date, 20XX</span></div>
          </div>

          {sectionTitle("1", "Nature of the Trust")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            [Trust Name] was established pursuant to a trust indenture dated [Date] under the laws of [Province/Territory], Canada. The trust was created for the purpose of [holding and managing assets / providing for beneficiaries]. The trustee(s) of the trust is/are [Name(s)].
          </p>
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            The trust is classified as a [inter vivos / testamentary] trust for income tax purposes and files an annual T3 Trust Income Tax and Information Return.
          </p>

          {sectionTitle("2", "Significant Accounting Policies")}
          <p style={{ fontSize: baseFontSize * 0.85, fontWeight: 700, marginBottom: 4 }}>Basis of Presentation</p>
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            These financial statements have been prepared in accordance with Canadian accounting standards for private enterprises (ASPE) as set out in Part II of the CPA Canada Handbook — Accounting.
          </p>
          <p style={{ fontSize: baseFontSize * 0.85, fontWeight: 700, marginBottom: 4 }}>Investments</p>
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            Investments in bonds and fixed-income securities are recorded at amortized cost. Equity securities and mutual funds are recorded at fair value, with unrealized gains and losses recognized in trust income.
          </p>
          <p style={{ fontSize: baseFontSize * 0.85, fontWeight: 700, marginBottom: 4 }}>Capital Assets</p>
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            Real property held in trust is recorded at cost and amortized on a straight-line basis over its estimated useful life of 40 years.
          </p>
          <p style={{ fontSize: baseFontSize * 0.85, fontWeight: 700, marginBottom: 4 }}>Revenue Recognition</p>
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            Interest income is recognized on an accrual basis. Dividend income is recognized on the ex-dividend date. Rental income is recognized on a straight-line basis over the term of the lease. Capital gains are recognized upon disposition of investments.
          </p>
          <p style={{ fontSize: baseFontSize * 0.85, fontWeight: 700, marginBottom: 4 }}>Use of Estimates</p>
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            The preparation of financial statements requires management to make estimates and assumptions that affect reported amounts. Actual results may differ.
          </p>
        </div>
        {showFooter && <div style={footerStyle}>Footer will come here</div>}
        {renderOverlays("foreground")}
      </div>

      {/* Page 2 */}
      <div style={pageStyle}>
        {showHeader && <div style={headerStyle}>Header will come here</div>}
        <div style={bodyStyle}>
          {sectionTitle("3", "Investments")}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize * 0.85, marginBottom: 12 }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ textAlign: "left", padding: "3px 8px", width: "40%" }}></th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700, position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("retainedEarnings")} />}
                    Cost
                  </th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Fair Value</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>20XX<br />Carrying</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>20XX<br />Carrying</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className={labelStyle}>Bonds and Fixed-Income</td><td className={cellStyle}>250,000</td><td className={cellStyle}>252,500</td><td className={cellStyle} style={{ fontWeight: 700 }}>250,000</td><td className={cellStyle}>230,000</td></tr>
              <tr><td className={labelStyle}>Equity Securities</td><td className={cellStyle}>165,000</td><td className={cellStyle}>180,000</td><td className={cellStyle} style={{ fontWeight: 700 }}>180,000</td><td className={cellStyle}>165,000</td></tr>
              <tr><td className={`${labelStyle} border-b border-black`}>Mutual / Pooled Funds</td><td className={`${cellStyle} border-b border-black`}>108,000</td><td className={`${cellStyle} border-b border-black`}>120,000</td><td className={`${cellStyle} border-b border-black`} style={{ fontWeight: 700 }}>120,000</td><td className={`${cellStyle} border-b border-black`}>110,000</td></tr>
              <tr><td className={`${labelStyle} ${thickBorderBottom}`} style={{ fontWeight: 700 }}></td><td className={`${cellStyle} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>523,000</td><td className={`${cellStyle} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>552,500</td><td className={`${cellStyle} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>550,000</td><td className={`${cellStyle} ${thickBorderBottom}`}>505,000</td></tr>
            </tbody>
          </table>

          {sectionTitle("4", "Capital Assets")}
          <table style={{ width: "80%", borderCollapse: "collapse", fontSize: baseFontSize * 0.85, marginBottom: 12, marginLeft: 16 }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ textAlign: "left", padding: "3px 8px", width: "40%" }}></th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700, position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("retainedEarnings")} />}
                    Cost
                  </th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Accum.<br />Amort.</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>20XX Net</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>20XX Net</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className={`${labelStyle} border-b border-black`}>Real Property</td><td className={`${cellStyle} border-b border-black`}>320,000</td><td className={`${cellStyle} border-b border-black`}>24,000</td><td className={`${cellStyle} border-b border-black`} style={{ fontWeight: 700 }}>296,000</td><td className={`${cellStyle} border-b border-black`}>304,000</td></tr>
            </tbody>
          </table>

          {sectionTitle("5", "Rental Property")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            The trust holds a rental property that generates rental income. Net rental income of $36,000 (prior year — $34,000) is reported after deducting property-specific expenses including maintenance, insurance, and property taxes. Amortization of the property is included in trust expenses.
          </p>

          {sectionTitle("6", "Distributions to Beneficiaries")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            In accordance with the trust indenture, the trustee has discretion to allocate and distribute trust income to the beneficiaries. Income is allocated based on the percentages determined by the trustee each year: Beneficiary A (40%), Beneficiary B (30%), and Beneficiary C (30%). T3 slips are issued reflecting the character of income (eligible dividends, interest, taxable capital gains, rental income).
          </p>

          {sectionTitle("7", "Income Taxes")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            The trust is subject to income tax under Part I of the Income Tax Act (Canada) on income that is not distributed or allocated to beneficiaries. Inter vivos trusts are taxed at the highest marginal rate. Income designated and paid or payable to beneficiaries is deductible by the trust and taxable in the hands of the beneficiaries. The provision for income taxes of $5,000 (prior year — $3,500) relates to income retained in the trust.
          </p>

          {sectionTitle("8", "Financial Instruments")}
          <p style={{ fontSize: baseFontSize * 0.9, marginBottom: 8 }}>
            The trust is exposed to credit risk (bonds and receivables), market risk (equity securities and mutual funds), interest rate risk (bonds and fixed-income), and liquidity risk. The trustee manages these risks through diversification of investments and regular monitoring of the portfolio.
          </p>
        </div>
        {showFooter && <div style={footerStyle}>Footer will come here</div>}
        {renderOverlays("foreground")}
      </div>
    </div>
  );
};

export default TemplateTrustNotesPreview;
