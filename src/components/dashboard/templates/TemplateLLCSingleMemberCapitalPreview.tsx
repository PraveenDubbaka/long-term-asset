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

const TemplateLLCSingleMemberCapitalPreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
  const { settings, addManualColumn } = useLayoutSettings();
  const { pageRef, renderOverlays } = useStatementOverlays(false);
  const fontFamily = getFontFamily(settings);
  const bodyPadding = getBodyPadding(settings);
  const scale = getCompressionScale(settings);
  const baseFontSize = 15 * scale;
  const fv = (val: string, isFirst?: boolean, isTotal?: boolean) => formatValue(val, settings, isFirst, isTotal);
  const showManual = settings.manualColumns.retainedEarnings;
  const showAddButtons = isEditMode && !showManual;

  const colWidths = showManual
    ? { label: "45%", col1: "18%", col2: "18%", manual: "19%" }
    : { label: "55%", col1: "22.5%", col2: "22.5%" };

  const cellStyle = "px-2 py-[3px] text-right whitespace-nowrap";
  const labelStyle = "px-2 py-[3px] text-left";
  const borderBottom = "border-b border-black";
  const thickBorderBottom = "border-b-2 border-black";
  const thickBorderTop = "border-t-2 border-black";

  const manualTh = showManual && (
    <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ width: (colWidths as any).manual, fontWeight: 700, color: "#1c63a6" }}>
      Manual
    </th>
  );
  const emptyManualTd = showManual && <td className={cellStyle}></td>;
  const manualCell = (extraClass?: string) => showManual && <ManualCell className={`${cellStyle} ${extraClass || ""}`} />;
  const manualBorderCell = (border: string) => showManual && <ManualCell className={`${cellStyle} ${border}`} />;

  const showHeader = settings.headerFooterEnabled && settings.headerScope !== "none";
  const showFooter = settings.headerFooterEnabled && settings.footerScope !== "none";


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
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>ABC Company LLC</span>
            </div>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}>
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Statement of Member's Capital</span>
            </div>
            <div style={{ fontSize: baseFontSize, fontWeight: 700 }}>
              For the year ended <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Month Date, 20XX</span>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ width: "60%", textAlign: "left", padding: "4px 2px" }}></th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ width: "40%", fontWeight: 700 }}>Amount</th>
                {manualTh}
              </tr>
            </thead>
            <tbody>
              {/* Opening Balance */}
              <tr>
                <td className={labelStyle} style={{ fontWeight: 700, paddingTop: 8 }}>Member's Capital, Beginning of Year</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fvRow("75,000")}</td>
              </tr>

              <tr><td style={{ height: 6 }}></td><td></td>{showManual && <td></td>}</tr>

              {/* Additions */}
              <tr>
                <td className={labelStyle} style={{ fontWeight: 700 }}>Add:</td>
                <td className={cellStyle}></td>
              </tr>
              <tr>
                <td className={labelStyle} style={{ paddingLeft: 16 }}>Capital Contributions</td>
                <td className={cellStyle}>{fvRow("10,000")}</td>
              </tr>
              <tr>
                <td className={`${labelStyle} ${borderBottom}`} style={{ paddingLeft: 16 }}>Net Income</td>
                <td className={`${cellStyle} ${borderBottom}`}>{fvRow("68,800")}</td>
              </tr>
              <tr>
                <td className={labelStyle} style={{ fontWeight: 700 }}>Total Additions</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("78,800", false, true)}</td>
              </tr>

              <tr><td style={{ height: 4 }}></td><td></td>{showManual && <td></td>}</tr>

              <tr>
                <td className={labelStyle}></td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("153,800", false, true)}</td>
              </tr>

              <tr><td style={{ height: 6 }}></td><td></td>{showManual && <td></td>}</tr>

              {/* Deductions */}
              <tr>
                <td className={labelStyle} style={{ fontWeight: 700 }}>Deduct:</td>
                <td className={cellStyle}></td>
              </tr>
              <tr>
                <td className={`${labelStyle} ${borderBottom}`} style={{ paddingLeft: 16 }}>Drawings / Distributions</td>
                <td className={`${cellStyle} ${borderBottom}`}>{fvRow("33,000")}</td>
              </tr>
              <tr>
                <td className={labelStyle} style={{ fontWeight: 700 }}>Total Deductions</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("33,000", false, true)}</td>
              </tr>

              <tr><td style={{ height: 8 }}></td><td></td>{showManual && <td></td>}</tr>

              {/* Closing Balance */}
              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Member's Capital, End of Year</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("120,800", false, true)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ padding: `12px ${bodyPadding.split(" ")[1] || "48px"} 20px`, textAlign: "center", fontSize: 12 * scale, color: "#5a5a6e" }}>
          See accompanying notes to financial statements
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

export default TemplateLLCSingleMemberCapitalPreview;
