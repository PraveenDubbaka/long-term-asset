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

const TemplateLLCMultiTaxIncomePreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
  const { settings, addManualColumn } = useLayoutSettings();
  const { pageRef, renderOverlays } = useStatementOverlays(false);
  const fontFamily = getFontFamily(settings);
  const bodyPadding = getBodyPadding(settings);
  const scale = getCompressionScale(settings);
  const baseFontSize = 15 * scale;
  const fv = (val: string, isFirst?: boolean, isTotal?: boolean) => formatValue(val, settings, isFirst, isTotal);
  const showManual = settings.manualColumns.incomeStatement;
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
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Statement of Revenue and Expenses — Income Tax Basis</span>
            </div>
            <div style={{ fontSize: baseFontSize, fontWeight: 700 }}>
              For the year ended <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Month Date, 20XX</span>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.label, textAlign: "left", padding: "4px 2px" }}></th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.col1, position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("incomeStatement")} />}
                  <span style={{ border: "1px solid hsl(220 15% 80%)", padding: "2px 8px", borderRadius: 3 }}>Month Date<br />20XX</span>
                </th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.col2, position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("incomeStatement")} />}
                  <span style={{ border: "1px solid hsl(220 15% 80%)", padding: "2px 8px", borderRadius: 3 }}>Month Date<br />20XX</span>
                </th>
                {manualTh}
              </tr>
            </thead>
            <tbody>
              {/* Revenue */}
              <tr><td className={labelStyle} style={{ fontWeight: 700, paddingTop: 8 }}>Revenue (as reported for tax purposes)</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              {[
                { label: "Service Revenue", col1: "210,000", col2: "185,000" },
                { label: "Product Sales", col1: "65,000", col2: "52,000" },
                { label: "Other Revenue", col1: "4,500", col2: "3,200" },
              ].map((r, i, arr) => (
                <tr key={i}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 16 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                </tr>
              ))}
              <tr>
                <td className={labelStyle} style={{ fontWeight: 700 }}>Total Revenue</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("279,500", false, true)}</td>
                <td className={cellStyle}>{fv("240,200", false, true)}</td>
              </tr>

              <tr><td style={{ height: 6 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              {/* Cost of Sales */}
              <tr><td className={labelStyle} style={{ fontWeight: 700 }}>Cost of Sales (Tax Basis)</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              {[
                { label: "Cost of Goods Sold", col1: "38,000", col2: "30,500" },
                { label: "Direct Labour", col1: "22,000", col2: "18,500" },
              ].map((r, i, arr) => (
                <tr key={`cos-${i}`}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 16 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                </tr>
              ))}
              <tr>
                <td className={labelStyle} style={{ fontWeight: 700 }}>Total Cost of Sales</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("60,000", false, true)}</td>
                <td className={cellStyle}>{fv("49,000", false, true)}</td>
              </tr>

              <tr><td style={{ height: 4 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              <tr>
                <td className={`${labelStyle} ${thickBorderTop}`} style={{ fontWeight: 700 }}>Gross Profit</td>
                <td className={`${cellStyle} ${thickBorderTop}`} style={{ fontWeight: 700 }}>{fv("219,500", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop}`}>{fv("191,200", false, true)}</td>
              </tr>

              <tr><td style={{ height: 6 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              {/* Expenses */}
              <tr><td className={labelStyle} style={{ fontWeight: 700 }}>Expenses (Tax Deductible)</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              {[
                { label: "Salaries and Wages", col1: "82,000", col2: "72,000" },
                { label: "Rent", col1: "28,000", col2: "28,000" },
                { label: "Office and Administrative", col1: "9,200", col2: "8,100" },
                { label: "Professional Fees", col1: "5,500", col2: "4,800" },
                { label: "Insurance", col1: "7,200", col2: "6,500" },
                { label: "Capital Cost Allowance (CCA)", col1: "15,000", col2: "12,500" },
                { label: "Interest on Long-Term Debt", col1: "4,300", col2: "5,200" },
                { label: "Meals and Entertainment (50%)", col1: "1,500", col2: "1,100" },
                { label: "Motor Vehicle Expenses (Tax Portion)", col1: "4,200", col2: "3,600" },
              ].map((r, i, arr) => (
                <tr key={`exp-${i}`}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 16 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                </tr>
              ))}
              <tr>
                <td className={`${labelStyle} ${thickBorderTop}`} style={{ fontWeight: 700 }}>Total Expenses — Income Tax Basis</td>
                <td className={`${cellStyle} ${thickBorderTop}`} style={{ fontWeight: 700 }}>{fv("156,900", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop}`}>{fv("141,800", false, true)}</td>
              </tr>

              <tr><td style={{ height: 8 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              {/* Net Income */}
              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Net Income — Income Tax Basis</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("62,600", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}>{fv("49,400", false, true)}</td>
              </tr>

              <tr><td style={{ height: 8 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              {/* Allocation */}
              <tr><td className={labelStyle} style={{ fontWeight: 700 }}>Allocation of Net Income per T5013:</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              {[
                { label: "Member A (55%)", col1: "34,430", col2: "27,170" },
                { label: "Member B (45%)", col1: "28,170", col2: "22,230" },
              ].map((r, i, arr) => (
                <tr key={`alloc-${i}`}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 16 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                </tr>
              ))}
              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}></td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("62,600", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}>{fv("49,400", false, true)}</td>
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

export default TemplateLLCMultiTaxIncomePreview;
