import EditableTitleBlock from "./EditableTitleBlock";
import EditableTableControls from "./EditableTableControls";
import { useStatementOverlays } from "./StatementImageOverlays";
import { useLayoutSettings, getFontFamily, getBodyPadding, getCompressionScale } from "./LayoutSettingsContext";

interface NotesPreviewProps {
  isEditMode?: boolean;
  onContentChanged?: (hasChanges: boolean) => void;
}

const NotesPreview = ({ isEditMode = false, onContentChanged }: NotesPreviewProps) => {
  const { settings } = useLayoutSettings();
  const { pageRef, renderOverlays } = useStatementOverlays(isEditMode);
  const fontFamily = getFontFamily(settings);
  const bodyPadding = getBodyPadding(settings);
  const scale = getCompressionScale(settings);
  const baseFontSize = 15 * scale;

  const showHeader = settings.headerFooterEnabled && settings.headerScope !== "none";
  const showFooter = settings.headerFooterEnabled && settings.footerScope !== "none";

  const pageStyle: React.CSSProperties = {
    width: "842px",
    minHeight: "1191px",
    boxShadow: "0 4px 24px hsl(220 20% 10% / 0.08), 0 1px 4px hsl(220 20% 10% / 0.04)",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    fontFamily,
    background: "#fff",
    borderRadius: 2,
    border: "1px solid hsl(var(--border))",
  };

  const headerStyle: React.CSSProperties = {
    background: "hsl(220 15% 96%)",
    padding: bodyPadding,
    textAlign: "center",
    fontSize: 14 * scale,
    color: "#5a5a6e",
  };

  const footerStyle: React.CSSProperties = {
    background: "hsl(220 15% 96%)",
    padding: bodyPadding,
    textAlign: "center",
    fontSize: 14 * scale,
    color: "#5a5a6e",
  };

  const bodyStyle: React.CSSProperties = { flex: 1, padding: bodyPadding, fontSize: baseFontSize, color: "#1a1a1a", position: "relative", lineHeight: 1.6 };

  const titleBlock = (
    <EditableTitleBlock
      isEditMode={isEditMode}
      onContentChanged={onContentChanged}
      entityName="ABC Pvt. Ltd."
      pageName="Notes to Financial Information"
      dateLabel="For the year ended Month Date, 20XX"
    />
  );

  const sectionTitle = (num: string, title: string) => (
    <div style={{ fontWeight: 700, fontSize: baseFontSize, marginTop: 16, marginBottom: 6 }}>{num}. {title}</div>
  );

  const cellStyle = "px-2 py-[2px] text-right whitespace-nowrap text-sm";
  const labelStyle = "px-2 py-[2px] text-left text-sm";
  const thickBorderTop = "border-t-2 border-black";
  const thickBorderBottom = "border-b-2 border-black";

  return (
    <div className="flex-1 flex flex-col items-center gap-8 p-6 bg-muted/30 overflow-y-auto">
      {/* Page 1 */}
      <div ref={pageRef} data-fs-page style={pageStyle}>
        {renderOverlays("background")}
        {showHeader && <div style={headerStyle}>Header will come here</div>}
        <div style={bodyStyle}>
          {titleBlock}

          {/* Top-level column headers */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize, marginBottom: 8 }}>
            <thead>
              <tr>
                <th className={`${thickBorderTop} ${thickBorderBottom}`} style={{ width: "55%", textAlign: "left", padding: "4px 2px" }}></th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ width: "22.5%", fontWeight: 700 }}>
                  Month Date<br />20XX
                </th>
                <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ width: "22.5%", fontWeight: 700 }}>
                  Month Date<br />20XX
                </th>
              </tr>
            </thead>
          </table>

          {/* Section 1 - Single manual column */}
          {sectionTitle("1", "Note Category 1 Name")}
          <EditableTableControls isEditMode={isEditMode}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize }}>
              <thead>
                <tr>
                  <th style={{ width: "55%", textAlign: "left", padding: "4px 2px" }}></th>
                  <th className={`${cellStyle}`} style={{ width: "22.5%", fontWeight: 400 }}></th>
                  <th className={`${cellStyle}`} style={{ width: "22.5%", fontWeight: 400 }}>
                    Manual<br />Column
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className={thickBorderTop}>
                  <td className={labelStyle}>Category Line Item 1</td>
                  <td className={cellStyle}></td>
                  <td className={cellStyle}>100</td>
                </tr>
                <tr>
                  <td className={labelStyle}>Category Line Item 2</td>
                  <td className={cellStyle}></td>
                  <td className={cellStyle}>100</td>
                </tr>
                <tr>
                  <td className={labelStyle}>Category Line Item 3</td>
                  <td className={cellStyle}></td>
                  <td className={cellStyle}>100</td>
                </tr>
                <tr data-editable-total="Total">
                  <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Total</td>
                  <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}></td>
                  <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}>300</td>
                </tr>
              </tbody>
            </table>
          </EditableTableControls>

          <div style={{ height: 16 }} />

          {/* Section 2 - Two columns */}
          {sectionTitle("2", "Note Category 2 Name")}
          <EditableTableControls isEditMode={isEditMode}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize }}>
              <thead>
                <tr>
                  <th style={{ width: "55%", textAlign: "left", padding: "4px 2px" }}></th>
                  <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ width: "22.5%", fontWeight: 700 }}>
                    December 31<br />2024
                  </th>
                  <th className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ width: "22.5%", fontWeight: 700 }}>
                    December 31<br />2023
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className={thickBorderTop}>
                  <td className={labelStyle}>Category Line Item 1</td>
                  <td className={cellStyle}>200</td>
                  <td className={cellStyle}>100</td>
                </tr>
                <tr>
                  <td className={labelStyle}>Category Line Item 2</td>
                  <td className={cellStyle}>200</td>
                  <td className={cellStyle}>100</td>
                </tr>
                <tr>
                  <td className={labelStyle}>Category Line Item 3</td>
                  <td className={cellStyle}>200</td>
                  <td className={cellStyle}>100</td>
                </tr>
                <tr data-editable-total="Total">
                  <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ fontWeight: 700 }}>Total</td>
                  <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}>600</td>
                  <td className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}>300</td>
                </tr>
              </tbody>
            </table>
          </EditableTableControls>

          <div style={{ height: 16 }} />

          {/* Section 3 - Text paragraph */}
          {sectionTitle("3", "Note Category 3 Name")}
          <p style={{ fontSize: baseFontSize, marginBottom: 8, textAlign: "justify" }}>
            This is sample placeholder text. This area will contain your note reference paragraph, where you can outline key explanations, add supporting details, and provide the necessary information required for your document.
          </p>
        </div>
        {renderOverlays("foreground")}
        {showFooter && <div style={footerStyle}>Footer will come here</div>}
      </div>
    </div>
  );
};

export default NotesPreview;
