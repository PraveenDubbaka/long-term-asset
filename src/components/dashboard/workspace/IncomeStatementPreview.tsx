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

interface IncomeStatementPreviewProps {
  isEditMode?: boolean;
  onContentChanged?: (hasChanges: boolean) => void;
}

const IncomeStatementPreview = ({ isEditMode = false, onContentChanged }: IncomeStatementPreviewProps) => {
  const { settings, addManualColumn } = useLayoutSettings();
  const { pageRef, renderOverlays } = useStatementOverlays(isEditMode);
  const fontFamily = getFontFamily(settings);
  const bodyPadding = getBodyPadding(settings);
  const scale = getCompressionScale(settings);
  const baseFontSize = 15 * scale;
  const fv = (val: string, isFirst?: boolean, isTotal?: boolean) => formatValue(val, settings, isFirst, isTotal);
  const showManual = settings.manualColumns.incomeStatement;
  const showAddButtons = isEditMode;
  const insertion = settings.manualColumnInsertions.incomeStatement;
  const manualSlot: number = !showManual
    ? -1
    : insertion.mode === "end"
      ? 2
      : insertion.side === "before"
        ? insertion.index
        : insertion.index + 1;

  const showHeader = settings.headerFooterEnabled && settings.headerScope !== "none";
  const showFooter = settings.headerFooterEnabled && settings.footerScope !== "none";

  const cellStyle = "px-2 py-[3px] text-right whitespace-nowrap";
  const labelStyle = "px-2 py-[3px] text-left";
  const borderBottom = "border-b border-black";
  const borderTop = "border-t border-black";
  const thickBorderBottom = "border-b-2 border-black";
  const thickBorderTop = "border-t-2 border-black";

  const colWidths = showManual
    ? { label: "45%", data: "18.33%", manual: "19%" }
    : { label: "55%", data: "22.5%", manual: "0%" };

  type Row = { label: string; col1: string; col2: string; indent?: number; bold?: boolean; topBorder?: boolean; bottomBorder?: boolean; red?: boolean; thick?: boolean; isTotal?: boolean };

  const rows: Row[] = [
    { label: "Revenue", col1: "", col2: "", bold: true, topBorder: true },
    { label: "Revenue 1", col1: "200", col2: "100", indent: 1 },
    { label: "Revenue 2", col1: "200", col2: "100", indent: 1 },
    { label: "Revenue 3", col1: "200", col2: "100", indent: 1, bottomBorder: true },
    { label: "", col1: "600", col2: "300", topBorder: true },
    { label: "Cost of Sales", col1: "", col2: "", bold: true },
    { label: "Cost of Sales 1", col1: "200", col2: "100", indent: 1, bottomBorder: true },
    { label: "Gross Profit (Loss)", col1: "400", col2: "200", bold: true, topBorder: true, bottomBorder: true, thick: true, isTotal: true },
    { label: "Expenses", col1: "", col2: "", bold: true },
    { label: "Expenses 1", col1: "200", col2: "100", indent: 1 },
    { label: "Expenses 2", col1: "200", col2: "100", indent: 1 },
    { label: "Expenses 3", col1: "200", col2: "100", indent: 1, bottomBorder: true },
    { label: "Total Expenses", col1: "600", col2: "300", bold: true, topBorder: true, bottomBorder: true, thick: true, isTotal: true },
    { label: "Net income (loss) before undernoted", col1: "(200)", col2: "(100)", bold: true },
    { label: "Other Expenses (Income)", col1: "", col2: "", bold: true },
    { label: "Other Expenses (Income) 1", col1: "200", col2: "100", indent: 1 },
    { label: "Other Expenses (Income) 2", col1: "200", col2: "100", indent: 1 },
    { label: "Other Expenses (Income) 3", col1: "200", col2: "100", indent: 1, bottomBorder: true },
    { label: "Total Other Expenses (Income)", col1: "600", col2: "300", bold: true, topBorder: true, bottomBorder: true, thick: true, isTotal: true },
    { label: "Net loss before income tax", col1: "(400)", col2: "(200)", bold: true },
    { label: "Provision for (recovery of) income taxes", col1: "200", col2: "100", bold: true },
    { label: "Net income (loss)", col1: "(200)", col2: "(100)", bold: true },
    { label: "Retained Earnings (Deficit), beginning of the year", col1: "200", col2: "100.00", bold: true },
    { label: "Dividends declared", col1: "200", col2: "100", bold: true, bottomBorder: true },
    { label: "Retained Earnings (Deficit), end of year", col1: "(200)", col2: "100", bold: true, topBorder: true, bottomBorder: true, thick: true, isTotal: true },
    { label: "", col1: "0", col2: "0", topBorder: true, bottomBorder: true, thick: true, red: true },
  ];

  let firstDataRow = true;
  const fvRow = (val: string, isTotal?: boolean) => {
    const isFirst = firstDataRow && val !== "-" && val !== "";
    if (isFirst) firstDataRow = false;
    return fv(val, isFirst, isTotal);
  };

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

  const headerCol = (label: string, dataIdx: 0 | 1) => (
    <th
      className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}
      style={{ width: colWidths.data, fontWeight: 700, position: "relative" }}
    >
      {showAddButtons && (
        <>
          <AddColumnButton
            position="before"
            onClick={() => addManualColumn("incomeStatement", { mode: "at", index: dataIdx, side: "before" })}
          />
          {dataIdx === 1 && (
            <AddColumnButton
              position="after"
              onClick={() => addManualColumn("incomeStatement", { mode: "at", index: dataIdx, side: "after" })}
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
            entityName="ABC Pvt. Ltd."
            pageName="Statement of Income (Loss) and Retained Earnings (Deficit)"
            dateLabel="For the year ended Month Date, 20XX"
          />

          <EditableTableControls isEditMode={isEditMode}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize }}>
              <thead>
                <tr>
                  <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ width: colWidths.label, textAlign: "left", padding: "4px 2px" }}></th>
                  {renderDataCells(
                    headerCol("Month Date 20XX", 0),
                    headerCol("Month Date 20XX", 1),
                    headerManual,
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const borderClasses = `${r.topBorder ? (r.thick ? thickBorderTop : borderTop) : ""} ${r.bottomBorder ? (r.thick ? thickBorderBottom : borderBottom) : ""}`;
                  const colorStyle = { color: r.red ? "hsl(0 72% 45%)" : undefined };
                  const showManualInputForRow = showManual && !(r.col1 === "" && r.col2 === "" && !r.red);

                  const col1Cell = (
                    <td className={`${cellStyle} ${borderClasses}`} style={colorStyle}>
                      {fvRow(r.col1, r.isTotal)}
                    </td>
                  );
                  const col2Cell = (
                    <td className={`${cellStyle} ${borderClasses}`} style={colorStyle}>
                      {fvRow(r.col2, r.isTotal)}
                    </td>
                  );
                  const manualCell: React.ReactElement | null = !showManual
                    ? null
                    : showManualInputForRow
                      ? <ManualCell className={`${cellStyle} ${borderClasses}`} />
                      : <td className={`${cellStyle} ${borderClasses}`}></td>;

                  return (
                    <tr
                      key={i}
                      data-comment-row={r.label || undefined}
                      data-comment-section={r.bold ? r.label : undefined}
                      data-comment-index={i}
                      {...(r.isTotal ? { "data-editable-total": r.label } : {})}
                    >
                      <td
                        className={`${labelStyle} ${borderClasses}`}
                        style={{
                          fontWeight: r.bold ? 700 : 400,
                          paddingLeft: r.indent ? r.indent * 16 + 8 : 8,
                          color: r.red ? "hsl(0 72% 45%)" : undefined,
                        }}
                      >
                        {r.label}
                      </td>
                      {renderDataCells(col1Cell, col2Cell, manualCell)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </EditableTableControls>
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

export default IncomeStatementPreview;
