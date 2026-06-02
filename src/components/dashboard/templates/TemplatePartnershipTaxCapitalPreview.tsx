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

const TemplatePartnershipTaxCapitalPreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
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
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>ABC Partnership</span>
            </div>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}>
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Statement of Changes in Partners' Capital — Income Tax Basis</span>
            </div>
            <div style={{ fontSize: baseFontSize, fontWeight: 700 }}>
              For the year ended <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Month Date, 20XX</span>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ width: "40%", textAlign: "left", padding: "4px 2px" }}></th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ width: "20%", position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("retainedEarnings")} />}
                  <span style={{ border: "1px solid hsl(220 15% 80%)", padding: "2px 8px", borderRadius: 3 }}>Partner A</span>
                </th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ width: "20%", fontWeight: 700 }}>
                  <span style={{ border: "1px solid hsl(220 15% 80%)", padding: "2px 8px", borderRadius: 3 }}>Partner B</span>
                </th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ width: "20%", fontWeight: 700 }}>
                  <span style={{ border: "1px solid hsl(220 15% 80%)", padding: "2px 8px", borderRadius: 3 }}>Total</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Opening Balance */}
              <tr>
                <td className={labelStyle} style={{ fontWeight: 700, paddingTop: 8 }}>Partners' Capital, Beginning of Year (Tax Basis)</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fvRow("34,500")}</td>
                <td className={cellStyle}>{fvRow("26,100")}</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fvRow("60,600")}</td>
              </tr>

              <tr><td style={{ height: 6 }}></td><td></td><td></td><td></td></tr>

              {/* Additions */}
              <tr>
                <td className={labelStyle} style={{ fontWeight: 700 }}>Add:</td>
                <td className={cellStyle}></td>
                <td className={cellStyle}></td>
                <td className={cellStyle}></td>
              </tr>
              <tr>
                <td className={`${labelStyle}`} style={{ paddingLeft: 16 }}>Capital Contributions</td>
                <td className={`${cellStyle}`} style={{ fontWeight: 700 }}>{fvRow("10,000")}</td>
                <td className={`${cellStyle}`}>{fvRow("5,000")}</td>
                <td className={`${cellStyle}`} style={{ fontWeight: 700 }}>{fvRow("15,000")}</td>
              </tr>
              <tr>
                <td className={`${labelStyle} ${borderBottom}`} style={{ paddingLeft: 16 }}>Net Income Allocation per T5013</td>
                <td className={`${cellStyle} ${borderBottom}`} style={{ fontWeight: 700 }}>{fvRow("59,580")}</td>
                <td className={`${cellStyle} ${borderBottom}`}>{fvRow("39,720")}</td>
                <td className={`${cellStyle} ${borderBottom}`} style={{ fontWeight: 700 }}>{fvRow("99,300")}</td>
              </tr>
              <tr>
                <td className={labelStyle} style={{ fontWeight: 700 }}>Total Additions</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("69,580", false, true)}</td>
                <td className={cellStyle}>{fv("44,720", false, true)}</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("114,300", false, true)}</td>
              </tr>

              <tr><td style={{ height: 4 }}></td><td></td><td></td><td></td></tr>

              <tr>
                <td className={labelStyle}></td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("104,080", false, true)}</td>
                <td className={cellStyle}>{fv("70,820", false, true)}</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("174,900", false, true)}</td>
              </tr>

              <tr><td style={{ height: 6 }}></td><td></td><td></td><td></td></tr>

              {/* Deductions */}
              <tr>
                <td className={labelStyle} style={{ fontWeight: 700 }}>Deduct:</td>
                <td className={cellStyle}></td>
                <td className={cellStyle}></td>
                <td className={cellStyle}></td>
              </tr>
              <tr>
                <td className={`${labelStyle}`} style={{ paddingLeft: 16 }}>Drawings</td>
                <td className={`${cellStyle}`} style={{ fontWeight: 700 }}>{fvRow("50,000")}</td>
                <td className={`${cellStyle}`}>{fvRow("38,000")}</td>
                <td className={`${cellStyle}`} style={{ fontWeight: 700 }}>{fvRow("88,000")}</td>
              </tr>
              <tr>
                <td className={`${labelStyle} ${borderBottom}`} style={{ paddingLeft: 16 }}>Non-Deductible Expenses Allocated</td>
                <td className={`${cellStyle} ${borderBottom}`} style={{ fontWeight: 700 }}>{fvRow("6,080")}</td>
                <td className={`${cellStyle} ${borderBottom}`}>{fvRow("1,220")}</td>
                <td className={`${cellStyle} ${borderBottom}`} style={{ fontWeight: 700 }}>{fvRow("7,300")}</td>
              </tr>
              <tr>
                <td className={labelStyle} style={{ fontWeight: 700 }}>Total Deductions</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("56,080", false, true)}</td>
                <td className={cellStyle}>{fv("39,220", false, true)}</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("95,300", false, true)}</td>
              </tr>

              <tr><td style={{ height: 8 }}></td><td></td><td></td><td></td></tr>

              {/* Closing Balance */}
              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Partners' Capital, End of Year (Tax Basis)</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("48,000", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}>{fv("37,600", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("85,600", false, true)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ padding: `12px ${bodyPadding.split(" ")[1] || "48px"} 20px`, textAlign: "center", fontSize: 12 * scale, color: "#5a5a6e" }}>
          See accompanying notes to financial statements — income tax basis
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

export default TemplatePartnershipTaxCapitalPreview;
