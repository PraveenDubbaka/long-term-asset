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

const TemplateTrustTaxCorpusPreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
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
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}><span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Statement of Changes in Trust Corpus — Income Tax Basis</span></div>
            <div style={{ fontSize: baseFontSize, fontWeight: 700 }}>For the year ended <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Month Date, 20XX</span></div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ width: "40%", textAlign: "left", padding: "4px 2px" }}></th>
                <th className={`${cellStyle} group/col ${thickBorderTop} ${thickBorderBottom}`} style={{ width: "20%", position: "relative" }}>
                    {showAddButtons && <AddColumnButton onClick={() => addManualColumn("retainedEarnings")} />}Original<br />Trust Corpus</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ width: "20%", fontWeight: 700 }}>Accumulated<br />Taxable Income</th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ width: "20%", fontWeight: 700 }}>Total Trust<br />Corpus</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={labelStyle} style={{ fontWeight: 700, paddingTop: 8 }}>Balance, Beginning of Year — Tax Basis</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fvRow("800,000")}</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fvRow("38,400")}</td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("838,400", false, true)}</td>
              </tr>

              <tr><td style={{ height: 6 }}></td><td></td><td></td><td></td></tr>

              <tr><td className={labelStyle} style={{ fontWeight: 700 }}>Add:</td><td className={cellStyle}></td><td className={cellStyle}></td><td className={cellStyle}></td></tr>
              {[
                { label: "Net Taxable Income for the Year", c1: "-", c2: "36,700", c3: "36,700" },
                { label: "Additional Contributions to Trust", c1: "-", c2: "-", c3: "-" },
                { label: "Non-Taxable Portion of Capital Gains", c1: "-", c2: "11,000", c3: "11,000" },
              ].map((r, i, arr) => (
                <tr key={i}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 16 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{r.c1}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{r.c2 !== "-" ? fvRow(r.c2) : "-"}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{r.c3 !== "-" ? fv(r.c3, false, false) : "-"}</td>
                </tr>
              ))}

              <tr><td style={{ height: 6 }}></td><td></td><td></td><td></td></tr>

              <tr><td className={labelStyle} style={{ fontWeight: 700 }}>Less:</td><td className={cellStyle}></td><td className={cellStyle}></td><td className={cellStyle}></td></tr>
              {[
                { label: "Amounts Allocated to Beneficiaries (T3 Slips)", c1: "-", c2: "(28,200)", c3: "(28,200)" },
                { label: "Distributions Paid / Payable", c1: "-", c2: "(40,000)", c3: "(40,000)" },
                { label: "Income Tax Provision", c1: "-", c2: "(4,100)", c3: "(4,100)" },
                { label: "Encroachments on Capital", c1: "-", c2: "-", c3: "-" },
              ].map((r, i, arr) => (
                <tr key={`ded-${i}`}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 16 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{r.c1}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{r.c2 !== "-" ? fvRow(r.c2) : "-"}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{r.c3 !== "-" ? fv(r.c3, false, false) : "-"}</td>
                </tr>
              ))}

              <tr><td style={{ height: 8 }}></td><td></td><td></td><td></td></tr>

              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Balance, End of Year — Tax Basis</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("800,000", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("75,000", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("875,000", false, true)}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 20, fontSize: baseFontSize * 0.85, color: "#5a5a6e" }}>
            <p>Note: Trust corpus is reported on income tax basis. Investments are carried at adjusted cost base (ACB) and capital assets at undepreciated capital cost (UCC) rather than GAAP carrying values.</p>
          </div>
        </div>

        <div style={{ padding: `12px ${bodyPadding.split(" ")[1] || "48px"} 20px`, textAlign: "center", fontSize: 12 * scale, color: "#5a5a6e" }}>See accompanying notes to financial statements</div>
        {showFooter && <div style={{ background: "hsl(220 15% 96%)", padding: bodyPadding, textAlign: "center", fontSize: 14 * scale, color: "#5a5a6e" }}>Footer will come here</div>}
      </div>
    </div>
  );
};

export default TemplateTrustTaxCorpusPreview;
