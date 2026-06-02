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

const TemplateSCorpBalanceSheetPreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
  const { settings, addManualColumn } = useLayoutSettings();
  const { pageRef, renderOverlays } = useStatementOverlays(false);
  const fontFamily = getFontFamily(settings);
  const bodyPadding = getBodyPadding(settings);
  const scale = getCompressionScale(settings);
  const baseFontSize = 15 * scale;
  const fv = (val: string, isFirst?: boolean, isTotal?: boolean) => formatValue(val, settings, isFirst, isTotal);
  const showManual = settings.manualColumns.balanceSheet;
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
      <div ref={pageRef} className="bg-white rounded-sm border border-border" style={{ width: "842px", minHeight: "1191px", boxShadow: "0 4px 24px hsl(220 20% 10% / 0.08), 0 1px 4px hsl(220 20% 10% / 0.04)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily }}>
        {renderOverlays("background")}
        {showHeader && <div style={{ background: "hsl(220 15% 96%)", padding: bodyPadding, textAlign: "center", fontSize: 14 * scale, color: "#5a5a6e" }}>Header will come here</div>}

        <div style={{ flex: 1, padding: bodyPadding, fontSize: baseFontSize, color: "#1a1a1a", position: "relative" }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}><span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>ABC S-Corporation</span></div>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}><span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Balance Sheet</span></div>
            <div style={{ fontSize: baseFontSize, fontWeight: 700 }}>As of <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>December 31, 20XX</span></div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.label, textAlign: "left", padding: "4px 2px" }}></th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.col1, position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("balanceSheet")} />}<span style={{ border: "1px solid hsl(220 15% 80%)", padding: "2px 8px", borderRadius: 3 }}>December 31<br />20XX</span></th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.col2, position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("balanceSheet")} />}<span style={{ border: "1px solid hsl(220 15% 80%)", padding: "2px 8px", borderRadius: 3 }}>December 31<br />20XX</span></th>
                {manualTh}
              </tr>
            </thead>
            <tbody>
              <tr><td className={labelStyle} style={{ fontWeight: 700, paddingTop: 8 }}>ASSETS</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              <tr><td className={labelStyle} style={{ paddingLeft: 16, fontWeight: 700 }}>Current Assets</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              {[
                { label: "Cash and Cash Equivalents", col1: "95,000", col2: "78,000" },
                { label: "Accounts Receivable, Net", col1: "210,000", col2: "185,000" },
                { label: "Inventories", col1: "145,000", col2: "130,000" },
                { label: "Prepaid Expenses", col1: "12,000", col2: "10,000" },
              ].map((r, i, arr) => (
                <tr key={i}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 32 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                </tr>
              ))}
              <tr>
                <td className={labelStyle} style={{ paddingLeft: 24, fontWeight: 700 }}>Total Current Assets</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("462,000", false, true)}</td>
                <td className={cellStyle}>{fv("403,000", false, true)}</td>
              </tr>

              <tr><td style={{ height: 6 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              <tr><td className={labelStyle} style={{ paddingLeft: 16, fontWeight: 700 }}>Property, Plant and Equipment</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              {[
                { label: "Land", col1: "75,000", col2: "75,000" },
                { label: "Buildings and Improvements", col1: "320,000", col2: "320,000" },
                { label: "Equipment and Vehicles", col1: "185,000", col2: "165,000" },
                { label: "Less: Accumulated Depreciation", col1: "(128,000)", col2: "(102,000)" },
              ].map((r, i, arr) => (
                <tr key={`ppe-${i}`}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 32 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                </tr>
              ))}
              <tr>
                <td className={labelStyle} style={{ paddingLeft: 24, fontWeight: 700 }}>Net Property, Plant and Equipment</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("452,000", false, true)}</td>
                <td className={cellStyle}>{fv("458,000", false, true)}</td>
              </tr>

              <tr><td style={{ height: 4 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              {[
                { label: "Other Assets", col1: "18,000", col2: "15,000" },
              ].map((r, i) => (
                <tr key={`oth-${i}`}>
                  <td className={labelStyle} style={{ paddingLeft: 16 }}>{r.label}</td>
                  <td className={cellStyle} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={cellStyle}>{fvRow(r.col2)}</td>
                </tr>
              ))}

              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>TOTAL ASSETS</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("932,000", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}>{fv("876,000", false, true)}</td>
              </tr>

              <tr><td style={{ height: 12 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              <tr><td className={labelStyle} style={{ fontWeight: 700 }}>LIABILITIES AND STOCKHOLDERS' EQUITY</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              <tr><td className={labelStyle} style={{ paddingLeft: 16, fontWeight: 700 }}>Current Liabilities</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              {[
                { label: "Accounts Payable", col1: "98,000", col2: "82,000" },
                { label: "Accrued Salaries and Wages", col1: "35,000", col2: "30,000" },
                { label: "Accrued Payroll Taxes", col1: "8,000", col2: "7,000" },
                { label: "Current Portion of Long-Term Debt", col1: "20,000", col2: "20,000" },
              ].map((r, i, arr) => (
                <tr key={`cl-${i}`}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 32 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                </tr>
              ))}
              <tr>
                <td className={labelStyle} style={{ paddingLeft: 24, fontWeight: 700 }}>Total Current Liabilities</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("161,000", false, true)}</td>
                <td className={cellStyle}>{fv("139,000", false, true)}</td>
              </tr>

              <tr><td style={{ height: 6 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              {[
                { label: "Long-Term Debt, Net of Current Portion", col1: "150,000", col2: "170,000" },
                { label: "Loans from Shareholders", col1: "40,000", col2: "40,000" },
              ].map((r, i, arr) => (
                <tr key={`ltl-${i}`}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 16 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                </tr>
              ))}
              <tr>
                <td className={labelStyle} style={{ fontWeight: 700 }}>Total Liabilities</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("351,000", false, true)}</td>
                <td className={cellStyle}>{fv("349,000", false, true)}</td>
              </tr>

              <tr><td style={{ height: 8 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              <tr><td className={labelStyle} style={{ fontWeight: 700 }}>Stockholders' Equity</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              {[
                { label: "Common Stock, $1 Par Value", col1: "50,000", col2: "50,000" },
                { label: "Additional Paid-in Capital", col1: "125,000", col2: "125,000" },
                { label: "Retained Earnings", col1: "416,000", col2: "362,000" },
                { label: "Less: Treasury Stock, at Cost", col1: "(10,000)", col2: "(10,000)" },
              ].map((r, i, arr) => (
                <tr key={`eq-${i}`}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 16 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                </tr>
              ))}
              <tr>
                <td className={labelStyle} style={{ fontWeight: 700 }}>Total Stockholders' Equity</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("581,000", false, true)}</td>
                <td className={cellStyle}>{fv("527,000", false, true)}</td>
              </tr>

              <tr><td style={{ height: 4 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>TOTAL LIABILITIES AND STOCKHOLDERS' EQUITY</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("932,000", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}>{fv("876,000", false, true)}</td>
              </tr>

              <tr>
                <td className={labelStyle}></td>
                <td className={cellStyle} style={{ color: "red", fontWeight: 700 }}>0</td>
                <td className={cellStyle} style={{ color: "red" }}>0</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ padding: `12px ${bodyPadding.split(" ")[1] || "48px"} 20px`, textAlign: "center", fontSize: 12 * scale, color: "#5a5a6e" }}>See accompanying notes to financial statements</div>
        {showFooter && <div style={{ background: "hsl(220 15% 96%)", padding: bodyPadding, textAlign: "center", fontSize: 14 * scale, color: "#5a5a6e" }}>Footer will come here</div>}
      </div>
    </div>
  );
};

export default TemplateSCorpBalanceSheetPreview;
