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

const TemplateTrustDistributionsPreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
  const { settings, addManualColumn } = useLayoutSettings();
  const { pageRef, renderOverlays } = useStatementOverlays(false);
  const fontFamily = getFontFamily(settings);
  const bodyPadding = getBodyPadding(settings);
  const scale = getCompressionScale(settings);
  const baseFontSize = 15 * scale;
  const fv = (val: string, isFirst?: boolean, isTotal?: boolean) => formatValue(val, settings, isFirst, isTotal);
  const showManual = settings.manualColumns.retainedEarnings;
  const showAddButtons = isEditMode && !showManual;

  const showHeader = settings.headerFooterEnabled && settings.headerScope !== "none";
  const showFooter = settings.headerFooterEnabled && settings.footerScope !== "none";

  const cellStyle = "px-2 py-[3px] text-right whitespace-nowrap";
  const labelStyle = "px-2 py-[3px] text-left";
  const borderBottom = "border-b border-black";
  const thickBorderBottom = "border-b-2 border-black";
  const thickBorderTop = "border-t-2 border-black";

  let firstDataRow = true;
  const fvRow = (val: string, isTotal?: boolean) => {
    const isFirst = firstDataRow && val !== "-" && val !== "";
    if (isFirst) firstDataRow = false;
    return fv(val, isFirst, isTotal);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-muted/30">
      <div ref={pageRef} className="bg-white rounded-sm border border-border" style={{ width: "842px", minHeight: "1191px", boxShadow: "0 4px 24px hsl(220 20% 10% / 0.08), 0 1px 4px hsl(220 20% 10% / 0.04)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily }}>
        {renderOverlays("background")}
        {showHeader && <div style={{ background: "hsl(220 15% 96%)", padding: bodyPadding, textAlign: "center", fontSize: 14 * scale, color: "#5a5a6e" }}>Header will come here</div>}

        <div style={{ flex: 1, padding: bodyPadding, fontSize: baseFontSize, color: "#1a1a1a", position: "relative" }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}><span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Trust Name</span></div>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}><span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Statement of Distributions to Beneficiaries</span></div>
            <div style={{ fontSize: baseFontSize, fontWeight: 700 }}>For the year ended <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Month Date, 20XX</span></div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ width: "40%", textAlign: "left", padding: "4px 2px" }}></th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ width: "15%", position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("retainedEarnings")} />}Beneficiary A</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ width: "15%", fontWeight: 700 }}>Beneficiary B</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ width: "15%", fontWeight: 700 }}>Beneficiary C</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ width: "15%", fontWeight: 700 }}>Total<br />20XX</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className={labelStyle} style={{ fontWeight: 700, paddingTop: 8 }}>Income Allocated (Note 6)</td><td className={cellStyle}></td><td className={cellStyle}></td><td className={cellStyle}></td><td className={cellStyle}></td></tr>
              {[
                { label: "Interest Income", a: "7,400", b: "5,550", c: "5,550", t: "18,500" },
                { label: "Eligible Dividends", a: "5,120", b: "3,840", c: "3,840", t: "12,800" },
                { label: "Non-Eligible Dividends", a: "1,280", b: "960", c: "960", t: "3,200" },
                { label: "Rental Income (Net)", a: "6,280", b: "4,710", c: "4,710", t: "15,700" },
                { label: "Taxable Capital Gains", a: "4,400", b: "3,300", c: "3,300", t: "11,000" },
              ].map((r, i, arr) => (
                <tr key={i}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 16 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.a)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.b)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.c)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.t)}</td>
                </tr>
              ))}
              <tr>
                <td className={labelStyle} style={{ fontWeight: 700 }}>Total Income Allocated</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("24,480", false, true)}</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("18,360", false, true)}</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("18,360", false, true)}</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("61,200", false, true)}</td>
              </tr>

              <tr><td style={{ height: 8 }}></td><td></td><td></td><td></td><td></td></tr>

              <tr><td className={labelStyle} style={{ fontWeight: 700 }}>Distributions Paid</td><td className={cellStyle}></td><td className={cellStyle}></td><td className={cellStyle}></td><td className={cellStyle}></td></tr>
              {[
                { label: "Cash Distributions", a: "12,000", b: "9,000", c: "9,000", t: "30,000" },
                { label: "In-Kind Distributions", a: "4,000", b: "3,000", c: "3,000", t: "10,000" },
              ].map((r, i, arr) => (
                <tr key={`dist-${i}`}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 16 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.a)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.b)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.c)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.t)}</td>
                </tr>
              ))}
              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Total Distributions</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("16,000", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("12,000", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("12,000", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("40,000", false, true)}</td>
              </tr>

              <tr><td style={{ height: 8 }}></td><td></td><td></td><td></td><td></td></tr>

              <tr>
                <td className={labelStyle} style={{ fontWeight: 700 }}>Distributions Payable, End of Year</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("4,800", false, true)}</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("3,600", false, true)}</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("3,600", false, true)}</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("12,000", false, true)}</td>
              </tr>

              <tr><td style={{ height: 12 }}></td><td></td><td></td><td></td><td></td></tr>

              <tr><td className={labelStyle} style={{ fontWeight: 700, fontSize: baseFontSize * 0.85 }}>Allocation %:</td>
                <td className={cellStyle} style={{ fontSize: baseFontSize * 0.85 }}>40%</td>
                <td className={cellStyle} style={{ fontSize: baseFontSize * 0.85 }}>30%</td>
                <td className={cellStyle} style={{ fontSize: baseFontSize * 0.85 }}>30%</td>
                <td className={cellStyle} style={{ fontSize: baseFontSize * 0.85 }}>100%</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 24, fontSize: baseFontSize * 0.85, color: "#5a5a6e" }}>
            <p style={{ marginBottom: 4 }}>T3 slips are issued to each beneficiary reflecting the character of income allocated (eligible dividends, interest, capital gains, etc.).</p>
            <p>Distributions are made in accordance with the terms of the trust indenture dated [Date].</p>
          </div>
        </div>

        <div style={{ padding: `12px ${bodyPadding.split(" ")[1] || "48px"} 20px`, textAlign: "center", fontSize: 12 * scale, color: "#5a5a6e" }}>See accompanying notes to financial statements</div>
        {showFooter && <div style={{ background: "hsl(220 15% 96%)", padding: bodyPadding, textAlign: "center", fontSize: 14 * scale, color: "#5a5a6e" }}>Footer will come here</div>}
      </div>
    </div>
  );
};

export default TemplateTrustDistributionsPreview;
