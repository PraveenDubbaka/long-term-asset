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

const TemplatePartnershipNotesPreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
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
          {/* Title block */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}>
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>ABC Partnership</span>
            </div>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}>
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Notes to Financial Statements</span>
            </div>
            <div style={{ fontSize: baseFontSize, fontWeight: 700 }}>
              For the year ended <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Month Date, 20XX</span>
            </div>
          </div>

          {/* Top-level column headers */}
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

          {/* Note 1 - Nature of Partnership */}
          {sectionTitle("1", "Nature of the Partnership")}
          <p style={{ fontSize: baseFontSize, marginBottom: 8, textAlign: "justify" }}>
            ABC Partnership is a general partnership formed under the laws of the Province of [Province] and is engaged in [description of business activities]. The partnership agreement provides for the allocation of net income and losses between partners based on agreed profit-sharing ratios.
          </p>

          {/* Note 2 - Significant Accounting Policies */}
          {sectionTitle("2", "Significant Accounting Policies")}
          <p style={{ fontSize: baseFontSize, marginBottom: 6, textAlign: "justify" }}>
            These financial statements have been prepared in accordance with Canadian accounting standards for private enterprises (ASPE). The significant accounting policies are as follows:
          </p>
          <div style={{ fontWeight: 700, fontSize: baseFontSize * 0.95, marginTop: 8, marginBottom: 4 }}>Revenue Recognition</div>
          <p style={{ fontSize: baseFontSize, marginBottom: 6, textAlign: "justify", paddingLeft: 8 }}>
            Revenue from professional services is recognized when services are rendered and collection is reasonably assured.
          </p>
          <div style={{ fontWeight: 700, fontSize: baseFontSize * 0.95, marginTop: 8, marginBottom: 4 }}>Capital Assets</div>
          <p style={{ fontSize: baseFontSize, marginBottom: 6, textAlign: "justify", paddingLeft: 8 }}>
            Capital assets are recorded at cost and amortized over their estimated useful lives on a straight-line basis. Rates of amortization are disclosed in Note 3.
          </p>
          <div style={{ fontWeight: 700, fontSize: baseFontSize * 0.95, marginTop: 8, marginBottom: 4 }}>Income Taxes</div>
          <p style={{ fontSize: baseFontSize, marginBottom: 6, textAlign: "justify", paddingLeft: 8 }}>
            As a partnership, the entity is not subject to income tax. The partners are individually responsible for income tax on their respective shares of partnership income.
          </p>

          <div style={{ height: 8 }} />

          {/* Note 3 - Capital Assets */}
          {sectionTitle("3", "Capital Assets")}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize }}>
            <thead>
              <tr>
                <th style={{ width: "30%", textAlign: "left", padding: "4px 2px" }}></th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700, position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("retainedEarnings")} />}
                    Cost
                  </th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700, position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("retainedEarnings")} />}
                    Accumulated<br />Amortization
                  </th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Net Book<br />Value</th>
                {manualTh}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={labelStyle}>Furniture and Fixtures</td>
                <td className={cellStyle}>25,000</td>
                <td className={cellStyle}>8,000</td>
                <td className={cellStyle}>17,000</td>
              </tr>
              <tr>
                <td className={labelStyle}>Computer Equipment</td>
                <td className={cellStyle}>35,000</td>
                <td className={cellStyle}>12,000</td>
                <td className={cellStyle}>23,000</td>
              </tr>
              <tr>
                <td className={labelStyle}>Leasehold Improvements</td>
                <td className={cellStyle}>60,000</td>
                <td className={cellStyle}>15,000</td>
                <td className={cellStyle}>45,000</td>
              </tr>
              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Total</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>120,000</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>35,000</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>85,000</td>
              </tr>
            </tbody>
          </table>

          <div style={{ height: 8 }} />

          {/* Note 4 - Long-Term Debt */}
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
                <td className={labelStyle}>Term Loan — 5.25%, due 20XX</td>
                <td className={cellStyle}>53,000</td>
                <td className={cellStyle}>61,000</td>
              </tr>
              <tr>
                <td className={labelStyle}>Less: Current Portion</td>
                <td className={cellStyle}>(8,000)</td>
                <td className={cellStyle}>(8,000)</td>
              </tr>
              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Long-Term Portion</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>45,000</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>53,000</td>
              </tr>
            </tbody>
          </table>

          <div style={{ height: 8 }} />

          {/* Note 5 - Related Party Transactions */}
          {sectionTitle("5", "Related Party Transactions")}
          <p style={{ fontSize: baseFontSize, marginBottom: 8, textAlign: "justify" }}>
            During the year, guaranteed payments to partners totalling $10,000 (20XX — $8,000) were made to Partners A and B for management services. These transactions were measured at the exchange amount, which is the amount of consideration established and agreed to by the related parties.
          </p>

          {/* Note 6 - Partnership Agreement */}
          {sectionTitle("6", "Partnership Agreement")}
          <p style={{ fontSize: baseFontSize, marginBottom: 8, textAlign: "justify" }}>
            The partnership agreement provides for a 60/40 profit and loss sharing ratio between Partner A and Partner B respectively. Partners are entitled to draw against their capital accounts in accordance with the terms of the agreement.
          </p>
        </div>
        {showFooter && <div style={footerStyle}>Footer will come here</div>}
        {renderOverlays("foreground")}
      </div>
    </div>
  );
};

export default TemplatePartnershipNotesPreview;
