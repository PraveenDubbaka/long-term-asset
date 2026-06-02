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

const TemplateCCorpTaxIncomePreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
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
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>ABC Corporation</span>
            </div>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}>
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Statement of Revenue and Expenses — Income Tax Basis</span>
            </div>
            <div style={{ fontSize: baseFontSize, fontWeight: 700 }}>
              For the year ended <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>December 31, 20XX</span>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.label, textAlign: "left", padding: "4px 2px" }}></th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.col1, position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("incomeStatement")} />}
                  <span style={{ border: "1px solid hsl(220 15% 80%)", padding: "2px 8px", borderRadius: 3 }}>December 31<br />20XX</span>
                </th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.col2, position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("incomeStatement")} />}
                  <span style={{ border: "1px solid hsl(220 15% 80%)", padding: "2px 8px", borderRadius: 3 }}>December 31<br />20XX</span>
                </th>
                {manualTh}
              </tr>
            </thead>
            <tbody>
              {/* Gross Receipts / Revenue */}
              <tr><td className={labelStyle} style={{ fontWeight: 700, paddingTop: 8 }}>Gross Receipts and Revenue</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              {[
                { label: "Gross Receipts or Sales", col1: "2,450,000", col2: "2,180,000" },
                { label: "Less: Returns and Allowances", col1: "(35,000)", col2: "(28,000)" },
                { label: "Other Revenue (Schedule K Items)", col1: "320,000", col2: "275,000" },
              ].map((r, i, arr) => (
                <tr key={i}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 16 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                </tr>
              ))}
              <tr>
                <td className={labelStyle} style={{ fontWeight: 700 }}>Total Revenue</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("2,735,000", false, true)}</td>
                <td className={cellStyle}>{fv("2,427,000", false, true)}</td>
              </tr>

              <tr><td style={{ height: 6 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              {/* Cost of Goods Sold */}
              <tr>
                <td className={`${labelStyle} ${borderBottom}`}>Cost of Goods Sold (Per Tax Return)</td>
                <td className={`${cellStyle} ${borderBottom}`} style={{ fontWeight: 700 }}>{fvRow("1,640,000")}</td>
                <td className={`${cellStyle} ${borderBottom}`}>{fvRow("1,475,000")}</td>
              </tr>
              <tr>
                <td className={labelStyle} style={{ fontWeight: 700 }}>Gross Profit</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("1,095,000", false, true)}</td>
                <td className={cellStyle}>{fv("952,000", false, true)}</td>
              </tr>

              <tr><td style={{ height: 6 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              {/* Deductions */}
              <tr><td className={labelStyle} style={{ fontWeight: 700 }}>Deductions (Per Form 1120)</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              {[
                { label: "Compensation of Officers", col1: "280,000", col2: "260,000" },
                { label: "Salaries and Wages (Other)", col1: "195,000", col2: "178,000" },
                { label: "Repairs and Maintenance", col1: "18,000", col2: "15,000" },
                { label: "Bad Debts", col1: "8,000", col2: "5,000" },
                { label: "Rents", col1: "96,000", col2: "96,000" },
                { label: "Taxes and Licenses", col1: "42,000", col2: "38,000" },
                { label: "Interest", col1: "12,000", col2: "15,000" },
                { label: "MACRS Depreciation (Form 4562)", col1: "67,000", col2: "55,000" },
                { label: "Section 179 Deduction", col1: "15,000", col2: "12,000" },
                { label: "Amortization (Section 197)", col1: "7,000", col2: "7,000" },
                { label: "Employee Benefit Programs", col1: "72,000", col2: "65,000" },
                { label: "Other Deductions", col1: "45,000", col2: "38,000" },
              ].map((r, i, arr) => (
                <tr key={`ded-${i}`}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 16 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                </tr>
              ))}
              <tr>
                <td className={labelStyle} style={{ fontWeight: 700 }}>Total Deductions</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("857,000", false, true)}</td>
                <td className={cellStyle}>{fv("784,000", false, true)}</td>
              </tr>

              <tr><td style={{ height: 6 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              <tr>
                <td className={labelStyle} style={{ fontWeight: 700 }}>Taxable Income Before NOL and Special Deductions</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("238,000", false, true)}</td>
                <td className={cellStyle}>{fv("168,000", false, true)}</td>
              </tr>

              <tr>
                <td className={labelStyle} style={{ paddingLeft: 16 }}>Less: Net Operating Loss Deduction</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fvRow("-")}</td>
                <td className={cellStyle}>{fvRow("-")}</td>
              </tr>
              <tr>
                <td className={`${labelStyle} ${borderBottom}`} style={{ paddingLeft: 16 }}>Less: Dividends Received Deduction</td>
                <td className={`${cellStyle} ${borderBottom}`} style={{ fontWeight: 700 }}>{fvRow("-")}</td>
                <td className={`${cellStyle} ${borderBottom}`}>{fvRow("-")}</td>
              </tr>

              <tr>
                <td className={labelStyle} style={{ fontWeight: 700 }}>Taxable Income</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("238,000", false, true)}</td>
                <td className={cellStyle}>{fv("168,000", false, true)}</td>
              </tr>

              <tr>
                <td className={`${labelStyle} ${borderBottom}`}>Federal Income Tax (21%)</td>
                <td className={`${cellStyle} ${borderBottom}`} style={{ fontWeight: 700 }}>{fvRow("49,980")}</td>
                <td className={`${cellStyle} ${borderBottom}`}>{fvRow("35,280")}</td>
              </tr>

              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>NET INCOME — INCOME TAX BASIS</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("188,020", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}>{fv("132,720", false, true)}</td>
              </tr>
            </tbody>
          </table>
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

export default TemplateCCorpTaxIncomePreview;
