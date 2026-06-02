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

const TemplateLLCMultiTaxCashFlowsPreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
  const { settings, addManualColumn } = useLayoutSettings();
  const { pageRef, renderOverlays } = useStatementOverlays(false);
  const fontFamily = getFontFamily(settings);
  const bodyPadding = getBodyPadding(settings);
  const scale = getCompressionScale(settings);
  const baseFontSize = 15 * scale;
  const fv = (val: string, isFirst?: boolean, isTotal?: boolean) => formatValue(val, settings, isFirst, isTotal);
  const showManual = settings.manualColumns.cashFlows;
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
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Statement of Cash Flows — Income Tax Basis</span>
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
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("cashFlows")} />}
                  <span style={{ border: "1px solid hsl(220 15% 80%)", padding: "2px 8px", borderRadius: 3 }}>Month Date<br />20XX</span>
                </th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.col2, position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("cashFlows")} />}
                  <span style={{ border: "1px solid hsl(220 15% 80%)", padding: "2px 8px", borderRadius: 3 }}>Month Date<br />20XX</span>
                </th>
                {manualTh}
              </tr>
            </thead>
            <tbody>
              {/* Operating Activities */}
              <tr><td className={labelStyle} style={{ fontWeight: 700, paddingTop: 8 }}>Operating Activities</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              <tr>
                <td className={labelStyle} style={{ paddingLeft: 16 }}>Net Income — Income Tax Basis</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fvRow("62,600")}</td>
                <td className={cellStyle}>{fvRow("49,400")}</td>
              </tr>
              <tr><td className={labelStyle} style={{ paddingLeft: 16, fontWeight: 700 }}>Adjustments for Non-Cash Items:</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              {[
                { label: "Capital Cost Allowance (CCA)", col1: "15,000", col2: "12,500" },
              ].map((r, i) => (
                <tr key={`adj-${i}`}>
                  <td className={labelStyle} style={{ paddingLeft: 32 }}>{r.label}</td>
                  <td className={cellStyle} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={cellStyle}>{fvRow(r.col2)}</td>
                </tr>
              ))}
              <tr><td className={labelStyle} style={{ paddingLeft: 16, fontWeight: 700 }}>Changes in Non-Cash Working Capital (Tax Basis):</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              {[
                { label: "Accounts Receivable", col1: "(7,700)", col2: "(5,500)" },
                { label: "Inventory", col1: "(2,700)", col2: "(1,800)" },
                { label: "Prepaid Expenses (Tax Deductible)", col1: "(400)", col2: "200" },
                { label: "Accounts Payable and Accrued Liabilities", col1: "6,500", col2: "4,200" },
                { label: "GST/HST Payable", col1: "700", col2: "(500)" },
              ].map((r, i, arr) => (
                <tr key={`wc-${i}`}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 32 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                </tr>
              ))}
              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Cash Provided by Operating Activities</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("74,000", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}>{fv("58,500", false, true)}</td>
              </tr>

              <tr><td style={{ height: 6 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              {/* Investing Activities */}
              <tr><td className={labelStyle} style={{ fontWeight: 700 }}>Investing Activities</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              {[
                { label: "Purchase of Capital Assets", col1: "(15,000)", col2: "(20,000)" },
              ].map((r, i, arr) => (
                <tr key={`inv-${i}`}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 16 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                </tr>
              ))}
              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Cash Used in Investing Activities</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("(15,000)", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}>{fv("(20,000)", false, true)}</td>
              </tr>

              <tr><td style={{ height: 6 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              {/* Financing Activities */}
              <tr><td className={labelStyle} style={{ fontWeight: 700 }}>Financing Activities</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              {[
                { label: "Member Capital Contributions", col1: "14,000", col2: "10,000" },
                { label: "Member Drawings / Distributions", col1: "(36,000)", col2: "(28,000)" },
                { label: "Guaranteed Payments to Members", col1: "(12,000)", col2: "(10,000)" },
                { label: "Repayment of Long-Term Debt", col1: "(10,000)", col2: "(10,000)" },
              ].map((r, i, arr) => (
                <tr key={`fin-${i}`}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 16 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                </tr>
              ))}
              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Cash Used in Financing Activities</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("(44,000)", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}>{fv("(38,000)", false, true)}</td>
              </tr>

              <tr><td style={{ height: 8 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              {/* Net Change */}
              <tr>
                <td className={labelStyle} style={{ fontWeight: 700 }}>Net Increase in Cash and Cash Equivalents</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("15,000", false, true)}</td>
                <td className={cellStyle}>{fv("500", false, true)}</td>
              </tr>
              <tr>
                <td className={labelStyle} style={{ fontWeight: 700 }}>Cash and Cash Equivalents, Beginning of Year</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fvRow("38,000")}</td>
                <td className={cellStyle}>{fvRow("37,500")}</td>
              </tr>
              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Cash and Cash Equivalents, End of Year</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("53,000", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}>{fv("38,000", false, true)}</td>
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

export default TemplateLLCMultiTaxCashFlowsPreview;
