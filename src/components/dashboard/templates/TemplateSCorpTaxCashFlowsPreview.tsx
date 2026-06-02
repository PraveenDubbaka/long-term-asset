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

const TemplateSCorpTaxCashFlowsPreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
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

  const thickBorderTop = "border-t-2 border-black";
  const thickBorderBottom = "border-b-2 border-black";
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

  const borderTop = "border-t border-black";

  type Row = { label: string; col1: string; col2: string; indent?: number; bold?: boolean; topBorder?: boolean; bottomBorder?: boolean; thick?: boolean; isTotal?: boolean };

  const rows: Row[] = [
    { label: "Cash Flows from Operating Activities", col1: "", col2: "", bold: true, topBorder: true },
    { label: "Ordinary Business Income (Tax Basis)", col1: "109,000", col2: "74,500" },
    { label: "Adjustments to reconcile to net cash:", col1: "", col2: "", bold: true },
    { label: "Tax Depreciation — MACRS (Form 4562)", col1: "52,000", col2: "38,000", indent: 1 },
    { label: "Section 179 Expense", col1: "15,000", col2: "10,000", indent: 1 },
    { label: "Changes in Operating Assets and Liabilities:", col1: "", col2: "", bold: true, indent: 1 },
    { label: "Accounts Receivable", col1: "(25,000)", col2: "(18,000)", indent: 2 },
    { label: "Inventories", col1: "(15,000)", col2: "(8,000)", indent: 2 },
    { label: "Prepaid Expenses", col1: "(1,000)", col2: "1,000", indent: 2 },
    { label: "Accounts Payable", col1: "16,000", col2: "10,000", indent: 2 },
    { label: "Accrued Expenses", col1: "6,000", col2: "4,000", indent: 2, bottomBorder: true },
    { label: "Net Cash Provided by Operating Activities", col1: "157,000", col2: "111,500", bold: true, topBorder: true, bottomBorder: true, thick: true, isTotal: true },

    { label: "Cash Flows from Investing Activities", col1: "", col2: "", bold: true, topBorder: true },
    { label: "Purchases of Property and Equipment", col1: "(20,000)", col2: "(30,000)", indent: 1 },
    { label: "Section 179 Property Acquisitions", col1: "(48,000)", col2: "(35,000)", indent: 1 },
    { label: "Other Investing Activities", col1: "(3,000)", col2: "(2,000)", indent: 1, bottomBorder: true },
    { label: "Net Cash Used in Investing Activities", col1: "(71,000)", col2: "(67,000)", bold: true, topBorder: true, bottomBorder: true, thick: true, isTotal: true },

    { label: "Cash Flows from Financing Activities", col1: "", col2: "", bold: true, topBorder: true },
    { label: "Repayment of Long-Term Debt", col1: "(20,000)", col2: "(20,000)", indent: 1 },
    { label: "Distributions to Shareholders", col1: "(55,000)", col2: "(40,000)", indent: 1 },
    { label: "Proceeds from Shareholder Loans", col1: "-", col2: "10,000", indent: 1, bottomBorder: true },
    { label: "Net Cash Used in Financing Activities", col1: "(75,000)", col2: "(50,000)", bold: true, topBorder: true, bottomBorder: true, thick: true, isTotal: true },

    { label: "Net Increase (Decrease) in Cash", col1: "11,000", col2: "(5,500)", bold: true, topBorder: true, isTotal: true },
    { label: "Cash and Cash Equivalents, Beginning of Year", col1: "78,000", col2: "83,500", bold: true },
    { label: "Cash and Cash Equivalents, End of Year", col1: "89,000", col2: "78,000", bold: true, topBorder: true, bottomBorder: true, thick: true, isTotal: true },
  ];

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
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}><span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Statement of Cash Flows — Income Tax Basis</span></div>
            <div style={{ fontSize: baseFontSize, fontWeight: 700 }}>For the year ended <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>December 31, 20XX</span></div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.label, textAlign: "left", padding: "4px 2px" }}></th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.col1, position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("cashFlows")} />}<span style={{ border: "1px solid hsl(220 15% 80%)", padding: "2px 8px", borderRadius: 3 }}>December 31<br />20XX</span></th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.col2, position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("cashFlows")} />}<span style={{ border: "1px solid hsl(220 15% 80%)", padding: "2px 8px", borderRadius: 3 }}>December 31<br />20XX</span></th>
                {manualTh}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className={`${labelStyle} ${r.topBorder ? (r.thick ? thickBorderTop : borderTop) : ""} ${r.bottomBorder ? (r.thick ? thickBorderBottom : borderBottom) : ""}`} style={{ fontWeight: r.bold ? 700 : 400, paddingLeft: r.indent ? r.indent * 16 + 8 : 8 }}>{r.label}</td>
                  <td className={`${cellStyle} ${r.topBorder ? (r.thick ? thickBorderTop : borderTop) : ""} ${r.bottomBorder ? (r.thick ? thickBorderBottom : borderBottom) : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1, r.isTotal)}</td>
                  <td className={`${cellStyle} ${r.topBorder ? (r.thick ? thickBorderTop : borderTop) : ""} ${r.bottomBorder ? (r.thick ? thickBorderBottom : borderBottom) : ""}`}>{fvRow(r.col2, r.isTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 24 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Supplemental Disclosures</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize }}>
              <tbody>
                <tr>
                  <td className={labelStyle} style={{ paddingLeft: 16 }}>Cash Paid for Interest</td>
                  <td className={cellStyle} style={{ width: "22.5%", fontWeight: 700 }}>{fv("9,000")}</td>
                  <td className={cellStyle} style={{ width: "22.5%" }}>{fv("11,000")}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ fontSize: baseFontSize * 0.9, fontStyle: "italic", marginTop: 6, paddingLeft: 8 }}>
              Note: As a pass-through entity, the S-Corporation does not pay federal income taxes at the entity level. State-level taxes paid, if applicable, are reported in Other Deductions on Form 1120-S.
            </div>
          </div>
        </div>

        <div style={{ padding: `12px ${bodyPadding.split(" ")[1] || "48px"} 20px`, textAlign: "center", fontSize: 12 * scale, color: "#5a5a6e" }}>See accompanying notes to tax-basis financial statements</div>
        {showFooter && <div style={{ background: "hsl(220 15% 96%)", padding: bodyPadding, textAlign: "center", fontSize: 14 * scale, color: "#5a5a6e" }}>Footer will come here</div>}
      </div>
    </div>
  );
};

export default TemplateSCorpTaxCashFlowsPreview;
