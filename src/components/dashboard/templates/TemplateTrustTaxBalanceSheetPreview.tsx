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

const TemplateTrustTaxBalanceSheetPreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
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
  const fvRow = (val: string) => {
    const isFirst = firstDataRow && val !== "-" && val !== "";
    if (isFirst) firstDataRow = false;
    return fv(val, isFirst, false);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-muted/30">
      <div ref={pageRef} className="bg-white rounded-sm border border-border" style={{ width: "842px", minHeight: "1191px", boxShadow: "0 4px 24px hsl(220 20% 10% / 0.08), 0 1px 4px hsl(220 20% 10% / 0.04)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily }}>
        {renderOverlays("background")}
        {showHeader && <div style={{ background: "hsl(220 15% 96%)", padding: bodyPadding, textAlign: "center", fontSize: 14 * scale, color: "#5a5a6e" }}>Header will come here</div>}

        <div style={{ flex: 1, padding: bodyPadding, fontSize: baseFontSize, color: "#1a1a1a", position: "relative" }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}><span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Trust Name</span></div>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}><span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Statement of Trust Assets and Liabilities — Income Tax Basis</span></div>
            <div style={{ fontSize: baseFontSize, fontWeight: 700 }}>As at <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Month Date, 20XX</span></div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.label, textAlign: "left", padding: "4px 2px" }}></th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.col1, position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("balanceSheet")} />}<span style={{ border: "1px solid hsl(220 15% 80%)", padding: "2px 8px", borderRadius: 3 }}>Month Date<br />20XX</span></th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.col2, position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("balanceSheet")} />}<span style={{ border: "1px solid hsl(220 15% 80%)", padding: "2px 8px", borderRadius: 3 }}>Month Date<br />20XX</span></th>
                {manualTh}
              </tr>
            </thead>
            <tbody>
              <tr><td className={labelStyle} style={{ fontWeight: 700, paddingTop: 8 }}>Trust Assets</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              <tr><td className={labelStyle} style={{ paddingLeft: 16, fontWeight: 700 }}>Current Assets</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              {[
                { label: "Cash and Cash Equivalents", col1: "85,200", col2: "72,400" },
                { label: "Accounts Receivable", col1: "4,500", col2: "3,800" },
                { label: "Accrued Interest Receivable", col1: "6,800", col2: "5,200" },
                { label: "Prepaid Expenses", col1: "1,200", col2: "1,000" },
              ].map((r, i, arr) => (
                <tr key={i}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 32 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                </tr>
              ))}
              <tr><td className={labelStyle} style={{ fontWeight: 700 }}>Total Current Assets</td><td className={cellStyle} style={{ fontWeight: 700 }}>{fv("97,700", false, true)}</td><td className={cellStyle}>{fv("82,400", false, true)}</td>{manualCell()}</tr>

              <tr><td style={{ height: 4 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              <tr><td className={labelStyle} style={{ paddingLeft: 16, fontWeight: 700 }}>Investments — Tax Cost (Note 3)</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              {[
                { label: "Bonds and Fixed-Income Securities", col1: "250,000", col2: "230,000" },
                { label: "Equity Securities — ACB", col1: "165,000", col2: "152,000" },
                { label: "Mutual Funds / Pooled Funds — ACB", col1: "108,000", col2: "100,000" },
              ].map((r, i, arr) => (
                <tr key={`inv-${i}`}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 32 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                </tr>
              ))}
              <tr><td className={labelStyle} style={{ fontWeight: 700 }}>Total Investments — Tax Cost</td><td className={cellStyle} style={{ fontWeight: 700 }}>{fv("523,000", false, true)}</td><td className={cellStyle}>{fv("482,000", false, true)}</td>{manualCell()}</tr>

              <tr><td style={{ height: 4 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              <tr><td className={labelStyle} style={{ paddingLeft: 16, fontWeight: 700 }}>Capital Assets — UCC (Note 4)</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              {[
                { label: "Real Property Held in Trust — UCC", col1: "280,000", col2: "295,000" },
              ].map((r, i, arr) => (
                <tr key={`ca-${i}`}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 32 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                </tr>
              ))}
              <tr><td className={labelStyle} style={{ fontWeight: 700 }}>Net Capital Assets — UCC</td><td className={cellStyle} style={{ fontWeight: 700 }}>{fv("280,000", false, true)}</td><td className={cellStyle}>{fv("295,000", false, true)}</td>{manualCell()}</tr>

              <tr><td style={{ height: 4 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Total Trust Assets — Tax Basis</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("900,700", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}>{fv("859,400", false, true)}</td>
              </tr>

              {/* LIABILITIES */}
              <tr><td className={labelStyle} style={{ fontWeight: 700, paddingTop: 8 }}>Trust Liabilities</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              {[
                { label: "Accounts Payable and Accrued Liabilities", col1: "5,200", col2: "4,800" },
                { label: "Income Taxes Payable (Note 7)", col1: "8,500", col2: "6,200" },
                { label: "Distributions Payable to Beneficiaries", col1: "12,000", col2: "10,000" },
              ].map((r, i, arr) => (
                <tr key={`cl-${i}`}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 16 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                </tr>
              ))}
              <tr><td className={labelStyle} style={{ fontWeight: 700 }}>Total Trust Liabilities</td><td className={cellStyle} style={{ fontWeight: 700 }}>{fv("25,700", false, true)}</td><td className={cellStyle}>{fv("21,000", false, true)}</td>{manualCell()}</tr>

              <tr><td style={{ height: 8 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              {/* TRUST CORPUS */}
              <tr><td className={labelStyle} style={{ fontWeight: 700 }}>Trust Corpus — Tax Basis</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              {[
                { label: "Original Trust Corpus", col1: "800,000", col2: "800,000" },
                { label: "Accumulated Taxable Income Retained", col1: "75,000", col2: "38,400" },
              ].map((r, i, arr) => (
                <tr key={`eq-${i}`}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 16 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                </tr>
              ))}
              <tr><td className={labelStyle} style={{ fontWeight: 700 }}>Total Trust Corpus — Tax Basis</td><td className={cellStyle} style={{ fontWeight: 700 }}>{fv("875,000", false, true)}</td><td className={cellStyle}>{fv("838,400", false, true)}</td>{manualCell()}</tr>

              <tr><td style={{ height: 4 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Total Liabilities and Trust Corpus</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("900,700", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}>{fv("859,400", false, true)}</td>
              </tr>

              <tr><td className={labelStyle}></td><td className={cellStyle} style={{ color: "red", fontWeight: 700 }}>0</td><td className={cellStyle} style={{ color: "red" }}>0</td>{emptyManualTd}</tr>
            </tbody>
          </table>
        </div>

        <div style={{ padding: `12px ${bodyPadding.split(" ")[1] || "48px"} 20px`, textAlign: "center", fontSize: 12 * scale, color: "#5a5a6e" }}>See accompanying notes to financial statements</div>
        {showFooter && <div style={{ background: "hsl(220 15% 96%)", padding: bodyPadding, textAlign: "center", fontSize: 14 * scale, color: "#5a5a6e" }}>Footer will come here</div>}
      </div>
    </div>
  );
};

export default TemplateTrustTaxBalanceSheetPreview;
