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

const TemplateCCorpTaxEquityPreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
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
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Statement of Stockholders' Equity — Income Tax Basis</span>
            </div>
            <div style={{ fontSize: baseFontSize, fontWeight: 700 }}>
              For the year ended <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>December 31, 20XX</span>
            </div>
          </div>

          {/* Multi-column equity table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize * 0.9 }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ width: "28%", textAlign: "left", padding: "4px 2px", fontWeight: 700 }}></th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ width: "14.4%", position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("retainedEarnings")} />}Common<br />Stock</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ width: "14.4%", fontWeight: 700 }}>Additional<br />Paid-in Capital</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ width: "14.4%", fontWeight: 700 }}>Retained<br />Earnings<br />(Tax Basis)</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ width: "14.4%", fontWeight: 700 }}>Treasury<br />Stock</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ width: "14.4%", fontWeight: 700 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening Balance */}
              <tr>
                <td className={labelStyle} style={{ fontWeight: 700, paddingTop: 8 }}>Balance, Beginning of Year</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fvRow("100,000")}</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fvRow("350,000")}</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fvRow("441,000")}</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fvRow("(20,000)")}</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fvRow("871,000")}</td>
              </tr>

              <tr><td style={{ height: 6 }}></td><td></td><td></td><td></td><td></td><td></td></tr>

              {/* Net Income */}
              <tr>
                <td className={labelStyle}>Net Income (Tax Basis)</td>
                <td className={cellStyle}>{fvRow("-")}</td>
                <td className={cellStyle}>{fvRow("-")}</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fvRow("188,020")}</td>
                <td className={cellStyle}>{fvRow("-")}</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fvRow("188,020")}</td>
              </tr>

              {/* Dividends */}
              <tr>
                <td className={`${labelStyle} ${borderBottom}`}>Dividends Declared</td>
                <td className={`${cellStyle} ${borderBottom}`}>{fvRow("-")}</td>
                <td className={`${cellStyle} ${borderBottom}`}>{fvRow("-")}</td>
                <td className={`${cellStyle} ${borderBottom}`} style={{ fontWeight: 700 }}>{fvRow("(150,020)")}</td>
                <td className={`${cellStyle} ${borderBottom}`}>{fvRow("-")}</td>
                <td className={`${cellStyle} ${borderBottom}`} style={{ fontWeight: 700 }}>{fvRow("(150,020)")}</td>
              </tr>

              <tr><td style={{ height: 6 }}></td><td></td><td></td><td></td><td></td><td></td></tr>

              {/* Closing Balance */}
              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Balance, End of Year</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("100,000", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("350,000", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("479,000", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("(20,000)", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("909,000", false, true)}</td>
              </tr>
            </tbody>
          </table>

          {/* Reconciliation section */}
          <div style={{ marginTop: 32 }}>
            <div style={{ fontWeight: 700, fontSize: baseFontSize, marginBottom: 10 }}>
              Reconciliation of Retained Earnings — Tax Basis to Book Basis
            </div>
            <table style={{ width: "60%", borderCollapse: "collapse", fontSize: baseFontSize }}>
              <tbody>
                <tr>
                  <td className={labelStyle} style={{ fontWeight: 700 }}>Retained Earnings (Tax Basis)</td>
                  <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("479,000")}</td>
                </tr>
                <tr>
                  <td className={labelStyle} style={{ paddingLeft: 16 }}>Add: Excess Book Depreciation over Tax</td>
                  <td className={cellStyle}>{fv("50,000")}</td>
                </tr>
                <tr>
                  <td className={labelStyle} style={{ paddingLeft: 16 }}>Add: Book Goodwill Impairment</td>
                  <td className={cellStyle}>{fv("-")}</td>
                </tr>
                <tr>
                  <td className={`${labelStyle} ${borderBottom}`} style={{ paddingLeft: 16 }}>Less: Prepaid Expenses (Book vs Tax)</td>
                  <td className={`${cellStyle} ${borderBottom}`}>{fv("(7,000)")}</td>
                </tr>
                <tr>
                  <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Retained Earnings (Book Basis)</td>
                  <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("522,000", false, true)}</td>
                </tr>
              </tbody>
            </table>
          </div>
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

export default TemplateCCorpTaxEquityPreview;
