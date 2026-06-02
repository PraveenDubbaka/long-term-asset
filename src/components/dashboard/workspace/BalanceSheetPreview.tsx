import { useState } from "react";
import AddColumnButton from "@/components/dashboard/templates/AddColumnButton";
import EditableTitleBlock from "./EditableTitleBlock";
import EditableTableControls from "./EditableTableControls";
import { useStatementOverlays } from "./StatementImageOverlays";
import { useLayoutSettings, getFontFamily, getBodyPadding, getCompressionScale, formatValue } from "./LayoutSettingsContext";

const ManualCell = ({ className }: { className?: string }) => {
  const [value, setValue] = useState("");
  return (
    <td className={className}>
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

interface BalanceSheetPreviewProps {
  isEditMode?: boolean;
  onContentChanged?: (hasChanges: boolean) => void;
}

const BalanceSheetPreview = ({ isEditMode = false, onContentChanged }: BalanceSheetPreviewProps) => {
  const { settings, addManualColumn } = useLayoutSettings();
  const { pageRef, renderOverlays } = useStatementOverlays(isEditMode);
  const fontFamily = getFontFamily(settings);
  const bodyPadding = getBodyPadding(settings);
  const scale = getCompressionScale(settings);
  const baseFontSize = 15 * scale;
  const fv = (val: string, isFirst?: boolean, isTotal?: boolean) => formatValue(val, settings, isFirst, isTotal);
  const showManual = settings.manualColumns.balanceSheet;
  // Always allow insert-before/after icons in edit mode (icons are subtle).
  const showAddButtons = isEditMode;
  const insertion = settings.manualColumnInsertions.balanceSheet;

  // Resolve manual column slot inside the data column array (0..2).
  // The two existing data columns are indices 0 and 1.
  // After insertion we have up to 3 data columns; manualSlot is the position
  // (0-based) within the rendered data columns where the Manual column lives.
  const manualSlot: number = !showManual
    ? -1
    : insertion.mode === "end"
      ? 2
      : insertion.side === "before"
        ? insertion.index
        : insertion.index + 1;

  const showHeader = settings.headerFooterEnabled && settings.headerScope !== "none";
  const showFooter = settings.headerFooterEnabled && settings.footerScope !== "none";

  const colWidths = showManual
    ? { label: "45%", data: "18.33%", manual: "19%" }
    : { label: "55%", data: "22.5%", manual: "0%" };

  const assets = {
    currentAssets: [
      { label: "Cash and cash equivalents", col1: "-", col2: "(830)" },
      { label: "Accounts receivable", col1: "-", col2: "10,207" },
      { label: "Allowance for doubtful debt", col1: "-", col2: "(2,721)" },
      { label: "Loans and notes receivable", col1: "-", col2: "10" },
      { label: "Other current assets", col1: "-", col2: "(243,740)" },
    ],
    currentTotal: { col1: "-", col2: "(237,074)" },
    ppe: { col1: "-", col2: "(11,993)" },
    totalAssets: { col1: "-", col2: "(249,067)" },
  };

  const liabilities = {
    current: [
      { label: "Accounts payable and accrued liabilities", col1: "-", col2: "47,492" },
      { label: "Taxes payable", col1: "-", col2: "(11,482)" },
      { label: "Short-term debt", col1: "-", col2: "(10)" },
      { label: "Due to shareholder(s)/director(s)", col1: "-", col2: "(100)" },
      { label: "Other current liabilities", col1: "-", col2: "3,827" },
    ],
    currentTotal: { col1: "-", col2: "39,727" },
    longTerm: { col1: "-", col2: "(7,662)" },
    totalLiabilities: { col1: "-", col2: "32,065" },
  };

  const equity = [
    { label: "Share capital", col1: "-", col2: "(5,721)" },
    { label: "Deficit", col1: "-", col2: "(275,486)" },
    { label: "Other comprehensive income", col1: "-", col2: "75" },
  ];
  const totalEquity = { col1: "-", col2: "(281,132)" };
  const totalLiabilitiesAndEquity = { col1: "-", col2: "(249,067)" };

  const cellStyle = "px-2 py-[3px] text-right whitespace-nowrap";
  const labelStyle = "px-2 py-[3px] text-left";
  const borderBottom = "border-b border-black";
  const borderTop = "border-t border-black";
  const thickBorderBottom = "border-b-2 border-black";
  const thickBorderTop = "border-t-2 border-black";

  let firstDataRow = true;
  const fvRow = (val: string, isTotal?: boolean) => {
    const isFirst = firstDataRow && val !== "-" && val !== "";
    if (isFirst) firstDataRow = false;
    return fv(val, isFirst, isTotal);
  };

  /**
   * Render data cells for a row in correct order, splicing the Manual cell
   * into the resolved slot. Stable keys ("c0" / "c1" / "cm") are assigned to
   * preserve React identity (and the local input state of ManualCell) when
   * the user toggles insertion sides.
   */
  const renderDataCells = (
    col0: React.ReactElement,
    col1: React.ReactElement,
    manualNode: React.ReactElement | null,
  ): React.ReactElement[] => {
    const tagged: { node: React.ReactElement; key: string }[] = [
      { node: col0, key: "c0" },
      { node: col1, key: "c1" },
    ];
    if (showManual && manualNode) {
      tagged.splice(manualSlot, 0, { node: manualNode, key: "cm" });
    }
    return tagged.map(({ node, key }) => <node.type {...node.props} key={key} />);
  };

  // Header cells for the two existing date columns
  const headerCol = (label: string, dataIdx: 0 | 1) => (
    <th
      className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}
      style={{ width: colWidths.data, fontWeight: 700, position: "relative" }}
    >
      {showAddButtons && (
        <>
          <AddColumnButton
            position="before"
            onClick={() => addManualColumn("balanceSheet", { mode: "at", index: dataIdx, side: "before" })}
          />
          {dataIdx === 1 && (
            <AddColumnButton
              position="after"
              onClick={() => addManualColumn("balanceSheet", { mode: "at", index: dataIdx, side: "after" })}
            />
          )}
        </>
      )}
      {label}
    </th>
  );

  const headerManual = (
    <th
      className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}
      style={{ width: colWidths.manual, fontWeight: 700, color: "#1c63a6" }}
    >
      Manual
    </th>
  );

  const dataRow = (col1Node: React.ReactElement, col2Node: React.ReactElement, manualNode: React.ReactElement | null) =>
    renderDataCells(col1Node, col2Node, manualNode);

  const blank = (border: string) => <td className={`${cellStyle} ${border}`}></td>;
  const td = (content: React.ReactNode, border: string) => <td className={`${cellStyle} ${border}`}>{content}</td>;
  const manualTd = (border: string) => <ManualCell className={`${cellStyle} ${border}`} />;
  const manualBlank = (border: string) => <td className={`${cellStyle} ${border}`}></td>;

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-muted/30">
      <div
        ref={pageRef}
        data-fs-page
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
          <EditableTitleBlock
            isEditMode={isEditMode}
            onContentChanged={onContentChanged}
            entityName="Cash Flow qa3"
            pageName="Balance Sheet"
            dateLabel="As at December 31, 2024"
          />

          <EditableTableControls isEditMode={isEditMode}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize }}>
              <thead>
                <tr>
                  <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.label, textAlign: "left", padding: "4px 2px" }}></th>
                  {renderDataCells(
                    headerCol("December 31, 2024", 0),
                    headerCol("December 31, 2023", 1),
                    headerManual,
                  )}
                </tr>
              </thead>
              <tbody>
                <tr data-comment-row="Assets" data-comment-section="Assets" data-comment-index="0">
                  <td className={`${labelStyle} ${borderTop}`} style={{ fontWeight: 700 }}>Assets</td>
                  {dataRow(blank(borderTop), blank(borderTop), showManual ? manualBlank(borderTop) : null)}
                </tr>
                <tr data-comment-row="Current assets" data-comment-section="Assets" data-comment-index="1">
                  <td className={labelStyle} style={{ paddingLeft: 16 }}>Current assets</td>
                  {dataRow(blank(""), blank(""), showManual ? manualBlank("") : null)}
                </tr>
                {assets.currentAssets.map((r, i) => {
                  const last = i === assets.currentAssets.length - 1;
                  const b = last ? borderBottom : "";
                  return (
                    <tr key={i} data-comment-row={r.label} data-comment-section="Current Assets" data-comment-index={i + 2}>
                      <td className={`${labelStyle} ${b}`} style={{ paddingLeft: 32 }}>{r.label}</td>
                      {dataRow(td(fvRow(r.col1), b), td(fvRow(r.col2), b), showManual ? manualTd(b) : null)}
                    </tr>
                  );
                })}
                <tr data-comment-row="Total Current Assets" data-comment-section="Current Assets" data-comment-index="7">
                  <td className={labelStyle}></td>
                  {dataRow(td(fv(assets.currentTotal.col1, false, true), ""), td(fv(assets.currentTotal.col2, false, true), ""), showManual ? manualTd("") : null)}
                </tr>
                <tr data-comment-row="Property, plant and equipment" data-comment-section="Non-Current Assets" data-comment-index="8">
                  <td className={`${labelStyle} ${borderBottom}`} style={{ paddingLeft: 16 }}>Property, plant and equipment</td>
                  {dataRow(td(fvRow(assets.ppe.col1), borderBottom), td(fvRow(assets.ppe.col2), borderBottom), showManual ? manualTd(borderBottom) : null)}
                </tr>
                <tr data-editable-total="Total Assets" data-comment-row="Total Assets" data-comment-section="Assets" data-comment-index="9">
                  <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Total Assets</td>
                  {dataRow(
                    td(fv(assets.totalAssets.col1, false, true), `${thickBorderTop} ${thickBorderBottom}`),
                    td(fv(assets.totalAssets.col2, false, true), `${thickBorderTop} ${thickBorderBottom}`),
                    showManual ? manualTd(`${thickBorderTop} ${thickBorderBottom}`) : null,
                  )}
                </tr>

                <tr data-comment-row="Liabilities" data-comment-section="Liabilities" data-comment-index="10">
                  <td className={`${labelStyle} ${borderTop}`} style={{ fontWeight: 700 }}>Liabilities</td>
                  {dataRow(blank(borderTop), blank(borderTop), showManual ? manualBlank(borderTop) : null)}
                </tr>
                <tr data-comment-row="Current liabilities" data-comment-section="Liabilities" data-comment-index="11">
                  <td className={labelStyle} style={{ paddingLeft: 16 }}>Current liabilities</td>
                  {dataRow(blank(""), blank(""), showManual ? manualBlank("") : null)}
                </tr>
                {liabilities.current.map((r, i) => {
                  const last = i === liabilities.current.length - 1;
                  const b = last ? borderBottom : "";
                  return (
                    <tr key={i} data-comment-row={r.label} data-comment-section="Current Liabilities" data-comment-index={i + 12}>
                      <td className={`${labelStyle} ${b}`} style={{ paddingLeft: 32 }}>{r.label}</td>
                      {dataRow(td(fvRow(r.col1), b), td(fvRow(r.col2), b), showManual ? manualTd(b) : null)}
                    </tr>
                  );
                })}
                <tr data-comment-row="Total Current Liabilities" data-comment-section="Liabilities" data-comment-index="17">
                  <td className={labelStyle}></td>
                  {dataRow(td(fv(liabilities.currentTotal.col1, false, true), ""), td(fv(liabilities.currentTotal.col2, false, true), ""), showManual ? manualTd("") : null)}
                </tr>
                <tr data-comment-row="Long-term liabilities" data-comment-section="Non-Current Liabilities" data-comment-index="18">
                  <td className={`${labelStyle} ${borderBottom}`} style={{ paddingLeft: 16 }}>Long-term liabilities</td>
                  {dataRow(td(fvRow(liabilities.longTerm.col1), borderBottom), td(fvRow(liabilities.longTerm.col2), borderBottom), showManual ? manualTd(borderBottom) : null)}
                </tr>
                <tr data-comment-row="Total Liabilities" data-comment-section="Liabilities" data-comment-index="19">
                  <td className={labelStyle}></td>
                  {dataRow(td(fv(liabilities.totalLiabilities.col1, false, true), ""), td(fv(liabilities.totalLiabilities.col2, false, true), ""), showManual ? manualTd("") : null)}
                </tr>

                <tr><td style={{ height: 8 }}></td>{dataRow(<td key="s1"></td>, <td key="s2"></td>, showManual ? <td key="s3"></td> : null)}</tr>

                <tr data-comment-row="Equity" data-comment-section="Equity" data-comment-index="20">
                  <td className={`${labelStyle} ${borderTop}`} style={{ fontWeight: 700 }}>Equity</td>
                  {dataRow(blank(borderTop), blank(borderTop), showManual ? manualBlank(borderTop) : null)}
                </tr>
                {equity.map((r, i) => {
                  const last = i === equity.length - 1;
                  const b = last ? borderBottom : "";
                  return (
                    <tr key={i} data-comment-row={r.label} data-comment-section="Equity" data-comment-index={i + 21}>
                      <td className={`${labelStyle} ${b}`} style={{ paddingLeft: 16 }}>{r.label}</td>
                      {dataRow(td(fvRow(r.col1), b), td(fvRow(r.col2), b), showManual ? manualTd(b) : null)}
                    </tr>
                  );
                })}
                <tr data-comment-row="Total Equity" data-comment-section="Equity" data-comment-index="24">
                  <td className={labelStyle}></td>
                  {dataRow(td(fv(totalEquity.col1, false, true), ""), td(fv(totalEquity.col2, false, true), ""), showManual ? manualTd("") : null)}
                </tr>

                <tr><td style={{ height: 4 }}></td>{dataRow(<td key="s1"></td>, <td key="s2"></td>, showManual ? <td key="s3"></td> : null)}</tr>

                <tr data-editable-total="Total Liabilities and Equity" data-comment-row="Total Liabilities and Equity" data-comment-section="Total" data-comment-index="25">
                  <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Total Liabilities and Equity</td>
                  {dataRow(
                    td(fv(totalLiabilitiesAndEquity.col1, false, true), `${thickBorderTop} ${thickBorderBottom}`),
                    td(fv(totalLiabilitiesAndEquity.col2, false, true), `${thickBorderTop} ${thickBorderBottom}`),
                    showManual ? manualTd(`${thickBorderTop} ${thickBorderBottom}`) : null,
                  )}
                </tr>
              </tbody>
            </table>
          </EditableTableControls>

          {/* Board Approval Block */}
          {settings.boardApproval.enabled && settings.boardApproval.members.length > 0 && (() => {
            const { approvalText, members, layout, alignment, columnsPerRow, showSignatureLine } = settings.boardApproval;

            const alignMap = { left: "flex-start", center: "center", right: "flex-end" };
            const justifyContent = alignMap[alignment] || "flex-start";
            const textAlign = alignment as React.CSSProperties["textAlign"];

            const memberBlock = (member: typeof members[0], idx: number) => (
              <div key={idx} style={{
                minWidth: layout === "vertical" ? "auto" : 140,
                width: layout === "grid" ? `${Math.floor(100 / columnsPerRow) - 4}%` : layout === "vertical" ? "100%" : "auto",
                textAlign,
              }}>
                {showSignatureLine && (
                  <div style={{
                    borderBottom: "2px solid #1a1a1a",
                    paddingBottom: 2,
                    marginBottom: 4,
                    fontStyle: "italic",
                    fontWeight: 700,
                  }}>
                    "{member.name}"
                  </div>
                )}
                {!showSignatureLine && (
                  <div style={{ fontStyle: "italic", fontWeight: 700, marginBottom: 4 }}>
                    "{member.name}"
                  </div>
                )}
                <div style={{ color: "#4a4a4a" }}>{member.title}</div>
              </div>
            );

            return (
              <div style={{ marginTop: 32, fontSize: baseFontSize }}>
                <p style={{ fontWeight: 700, marginBottom: 16, textAlign }}>
                  {approvalText || "Approved by"}
                </p>
                <div style={{
                  display: "flex",
                  flexDirection: layout === "vertical" ? "column" : "row",
                  flexWrap: layout === "horizontal" || layout === "grid" ? "wrap" : "nowrap",
                  gap: layout === "vertical" ? "20px 0" : "24px 48px",
                  justifyContent,
                  alignItems: layout === "vertical" ? alignMap[alignment] : undefined,
                }}>
                  {members.map((m, i) => memberBlock(m, i))}
                </div>
              </div>
            );
          })()}
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

        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-45deg)", fontSize: 64, fontWeight: 700, color: "rgba(0,0,0,0.07)", whiteSpace: "nowrap", pointerEvents: "none", userSelect: "none", letterSpacing: 6 }}>
          DRAFT UNDER DISCUSSION
        </div>
      </div>
    </div>
  );
};

export default BalanceSheetPreview;
