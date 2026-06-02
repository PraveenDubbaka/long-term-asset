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

const TemplateBalanceSheetPreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
  const { settings, addManualColumn } = useLayoutSettings();
  const { pageRef, renderOverlays } = useStatementOverlays(false);
  const fontFamily = getFontFamily(settings);
  const bodyPadding = getBodyPadding(settings);
  const scale = getCompressionScale(settings);
  const baseFontSize = 15 * scale;
  const fv = (val: string, isFirst?: boolean, isTotal?: boolean) => formatValue(val, settings, isFirst, isTotal);
  const showManual = settings.manualColumns.balanceSheet;
  const showAddButtons = isEditMode && !showManual;

  const showHeader = settings.headerFooterEnabled && settings.headerScope !== "none";
  const showFooter = settings.headerFooterEnabled && settings.footerScope !== "none";

  const cellStyle = "px-2 py-[3px] text-right whitespace-nowrap";
  const labelStyle = "px-2 py-[3px] text-left";
  const borderBottom = "border-b border-black";
  const thickBorderBottom = "border-b-2 border-black";
  const thickBorderTop = "border-t-2 border-black";

  const colWidths = showManual
    ? { label: "45%", col1: "18%", col2: "18%", manual: "19%" }
    : { label: "55%", col1: "22.5%", col2: "22.5%" };

  let firstDataRow = true;
  const fvRow = (val: string, isTotal?: boolean) => {
    const isFirst = firstDataRow && val !== "-" && val !== "";
    if (isFirst) firstDataRow = false;
    return fv(val, isFirst, isTotal);
  };

  const manualTh = showManual && (
    <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.manual, fontWeight: 700, color: "#1c63a6" }}>
      Manual
    </th>
  );

  const emptyManualTd = showManual && <td className={cellStyle}></td>;
  const manualCell = (extraClass?: string) => showManual && <ManualCell className={`${cellStyle} ${extraClass || ""}`} />;
  const manualBorderCell = (border: string) => showManual && <ManualCell className={`${cellStyle} ${border}`} />;

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
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>ABC Pvt. Ltd.</span>
            </div>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}>
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Balance Sheet</span>
            </div>
            <div style={{ fontSize: baseFontSize, fontWeight: 700 }}>
              For the year ended <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>Month Date,20XX</span>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.label, textAlign: "left", padding: "4px 2px" }}></th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom} group/col`} style={{ width: colWidths.col1, fontWeight: 700, position: "relative" }}>
                  {showAddButtons && <AddColumnButton onClick={() => addManualColumn("balanceSheet")} />}
                  <span style={{ border: "1px solid hsl(220 15% 80%)", padding: "2px 8px", borderRadius: 3 }}>Month Date<br />20XX</span>
                </th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom} group/col`} style={{ width: colWidths.col2, fontWeight: 700, position: "relative" }}>
                  {showAddButtons && <AddColumnButton onClick={() => addManualColumn("balanceSheet")} />}
                  <span style={{ border: "1px solid hsl(220 15% 80%)", padding: "2px 8px", borderRadius: 3 }}>Month Date<br />20XX</span>
                </th>
                {manualTh}
              </tr>
            </thead>
            <tbody>
              <tr><td className={labelStyle} style={{ fontWeight: 700, paddingTop: 8 }}>Assets</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              <tr><td className={labelStyle} style={{ paddingLeft: 16, fontWeight: 700 }}>Current assets</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              {[
                { label: "Current Assets 1", col1: "200", col2: "100" },
                { label: "Current Assets 2", col1: "200", col2: "100" },
                { label: "Current Assets 3", col1: "200", col2: "100" },
              ].map((r, i, arr) => (
                <tr key={i}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 32 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                  {i === arr.length - 1 ? manualBorderCell(borderBottom) : manualCell()}
                </tr>
              ))}
              <tr>
                <td className={labelStyle}></td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("600", false, true)}</td>
                <td className={cellStyle}>{fv("300", false, true)}</td>
                {manualCell()}
              </tr>
              {[
                { label: "Long Term Assets 1", col1: "200", col2: "100" },
                { label: "Long Term Assets 2", col1: "200", col2: "100" },
                { label: "Long Term Assets 3", col1: "200", col2: "100" },
              ].map((r, i) => (
                <tr key={`lt-${i}`}>
                  <td className={labelStyle} style={{ paddingLeft: 16 }}>{r.label}</td>
                  <td className={cellStyle} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={cellStyle}>{fvRow(r.col2)}</td>
                  {manualCell()}
                </tr>
              ))}
              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Total Assets</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("1,200", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}>{fv("600", false, true)}</td>
                {manualBorderCell(`${thickBorderTop} ${thickBorderBottom}`)}
              </tr>

              <tr><td className={`${labelStyle}`} style={{ fontWeight: 700, paddingTop: 8 }}>Liabilities</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              <tr><td className={labelStyle} style={{ paddingLeft: 16, fontWeight: 700 }}>Current liabilities</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              {[
                { label: "Current Liabilities 1", col1: "200", col2: "100" },
                { label: "Current Liabilities 2", col1: "200", col2: "100" },
                { label: "Current Liabilities 3", col1: "200", col2: "100" },
              ].map((r, i, arr) => (
                <tr key={`cl-${i}`}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 32 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                  {i === arr.length - 1 ? manualBorderCell(borderBottom) : manualCell()}
                </tr>
              ))}
              <tr>
                <td className={labelStyle}></td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("600", false, true)}</td>
                <td className={cellStyle}>{fv("300", false, true)}</td>
                {manualCell()}
              </tr>
              {[
                { label: "Long Term Liabilities 1", col1: "200", col2: "100" },
                { label: "Long Term Liabilities 2", col1: "200", col2: "100" },
                { label: "Long Term Liabilities 3", col1: "200", col2: "100" },
              ].map((r, i, arr) => (
                <tr key={`ltl-${i}`}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 16 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                  {i === arr.length - 1 ? manualBorderCell(borderBottom) : manualCell()}
                </tr>
              ))}
              <tr>
                <td className={labelStyle}></td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("1,200", false, true)}</td>
                <td className={cellStyle}>{fv("600", false, true)}</td>
                {manualCell()}
              </tr>

              <tr><td style={{ height: 8 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              <tr><td className={labelStyle} style={{ fontWeight: 700 }}>Equity</td><td className={cellStyle}></td><td className={cellStyle}></td>{emptyManualTd}</tr>
              {[
                { label: "Equity 1", col1: "200", col2: "100" },
                { label: "Equity 2", col1: "200", col2: "100" },
                { label: "Equity 3", col1: "200", col2: "100" },
              ].map((r, i, arr) => (
                <tr key={`eq-${i}`}>
                  <td className={`${labelStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ paddingLeft: 16 }}>{r.label}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`} style={{ fontWeight: 700 }}>{fvRow(r.col1)}</td>
                  <td className={`${cellStyle} ${i === arr.length - 1 ? borderBottom : ""}`}>{fvRow(r.col2)}</td>
                  {i === arr.length - 1 ? manualBorderCell(borderBottom) : manualCell()}
                </tr>
              ))}
              <tr>
                <td className={labelStyle}></td>
                <td className={cellStyle} style={{ fontWeight: 700 }}>{fv("600", false, true)}</td>
                <td className={cellStyle}>{fv("300", false, true)}</td>
                {manualCell()}
              </tr>

              <tr><td style={{ height: 4 }}></td><td></td><td></td>{showManual && <td></td>}</tr>

              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Total Liabilities and Equity</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>{fv("2,000", false, true)}</td>
                <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}>{fv("900", false, true)}</td>
                {manualBorderCell(`${thickBorderTop} ${thickBorderBottom}`)}
              </tr>

              <tr>
                <td className={labelStyle}></td>
                <td className={cellStyle} style={{ color: "red", fontWeight: 700 }}>0</td>
                <td className={cellStyle} style={{ color: "red" }}>0</td>
                {showManual && <td className={cellStyle}></td>}
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ padding: `12px ${bodyPadding.split(" ")[1] || "48px"} 20px`, textAlign: "center", fontSize: 12 * scale, color: "#5a5a6e" }}>
          See accompanying notes to financial information
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

export default TemplateBalanceSheetPreview;
