import { useState } from "react";
import AddColumnButton from "./AddColumnButton";
import { useStatementOverlays } from "@/components/dashboard/workspace/StatementImageOverlays";
import {
  useLayoutSettings,
  getFontFamily,
  getBodyPadding,
  getCompressionScale,
  formatValue,
} from "@/components/dashboard/workspace/LayoutSettingsContext";

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

// Letters A..Z for default partner naming
const partnerLetter = (i: number) => String.fromCharCode(65 + i);

// Demo allocation factor per partner (deterministic)
const factorFor = (idx: number, count: number, method: "equal" | "ownership" | "custom") => {
  if (method === "equal") return 1 / count;
  if (method === "ownership") {
    // Decreasing weights: e.g., 2 partners → 0.6/0.4; 3 → 0.5/0.3/0.2
    const weights = Array.from({ length: count }, (_, i) => count - i);
    const total = weights.reduce((a, b) => a + b, 0);
    return weights[idx] / total;
  }
  // custom — slight variance from equal
  const base = 1 / count;
  const variance = ((idx % 2 === 0 ? 1 : -1) * 0.05) / count;
  return base + variance;
};

const TemplatePartnersCapitalPreview = ({ isEditMode = false }: { isEditMode?: boolean }) => {
  const { settings, addManualColumn, partnersCapitalPreviewImpact } = useLayoutSettings();
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

  const pc = settings.partnersCapital;
  // Defensive: preview only renders 2..50 partner columns; validation surfaces invalid values in the panel.
  const partnerCount = Math.max(2, Math.min(50, Math.floor(pc.partnerCount) || 2));
  const showTotal = pc.showTotalColumn;

  // ---- Preview-impact highlight tokens (only active when toggle is ON) ----
  const hi = partnersCapitalPreviewImpact;
  // Subtle inner-shadow halos so layout never shifts.
  const classesHalo = hi
    ? { boxShadow: "inset 0 0 0 1.5px hsl(38 92% 55% / 0.85)", background: "hsl(48 100% 92% / 0.55)" }
    : undefined;
  const allocHalo = hi
    ? { boxShadow: "inset 0 0 0 1.5px hsl(207 72% 45% / 0.85)", background: "hsl(207 100% 95% / 0.55)" }
    : undefined;

  // Allocation method human label
  const allocLabel =
    pc.allocationMethod === "equal"
      ? "Equal Split"
      : pc.allocationMethod === "ownership"
      ? "By Ownership %"
      : "Custom";
  const profitLossLabel =
    pc.profitLossMethod === "proRata"
      ? "Pro-rata %"
      : pc.profitLossMethod === "fixed"
      ? "Fixed amounts"
      : pc.profitLossMethod === "customPerPartner"
      ? "Custom per partner"
      : "Per agreement";

  // Resolve effective layout based on auto thresholds.
  // - auto: columns until columns→rows threshold; rows until rows→class-summary threshold; then class summary
  // - forceColumns / forceRows / forceClassSummary: explicit override
  const effectiveLayout: "columns" | "rows" | "classSummary" =
    pc.layoutMode === "forceColumns"
      ? "columns"
      : pc.layoutMode === "forceRows"
      ? "rows"
      : pc.layoutMode === "forceClassSummary"
      ? "classSummary"
      : partnerCount > pc.autoSwitchRowsToClassSummary
      ? "classSummary"
      : partnerCount > pc.autoSwitchColumnsToRows
      ? "rows"
      : "columns";

  // Compact density once we move past the columns→rows threshold (or user opted in)
  const autoCompact = effectiveLayout !== "columns" || pc.compactRows;

  const rowPadY = autoCompact ? 2 : 3;
  const cellStyle = `px-2 text-right whitespace-nowrap`;
  const labelStyle = `px-2 text-left`;
  const cellPad = { padding: `${rowPadY}px 8px` } as React.CSSProperties;

  const borderBottom = "border-b border-black";
  const thickBorderBottom = "border-b-2 border-black";
  const thickBorderTop = "border-t-2 border-black";

  // Base "opening" capital per partner (derived for demo realism)
  const openingTotal = 125_000;
  const openingPer = (i: number) =>
    Math.round(openingTotal * factorFor(i, partnerCount, pc.allocationMethod));

  // Numeric cell value helpers
  const fmtNum = (n: number) => n.toLocaleString("en-US");

  // Per-partner numeric values for each line item
  const additionsBase: Record<string, number> = {
    capitalContributions: 15_000,
    netIncomeAllocation: 30_000,
  };
  const deductionsBase: Record<string, number> = {
    drawings: 20_000,
    guaranteedPayments: 10_000,
  };

  const perPartner = (totalVal: number, i: number) =>
    Math.round(totalVal * factorFor(i, partnerCount, pc.allocationMethod));

  let firstDataRow = true;
  const fvRow = (val: string, isTotal?: boolean) => {
    const isFirst = firstDataRow && val !== "-" && val !== "";
    if (isFirst) firstDataRow = false;
    return fv(val, isFirst, isTotal);
  };

  // Build visible line items in order
  const visibleAdditions: { key: keyof typeof additionsBase; label: string }[] = [];
  if (pc.lineItems.capitalContributions.visible)
    visibleAdditions.push({ key: "capitalContributions", label: pc.lineItems.capitalContributions.label });
  if (pc.lineItems.netIncomeAllocation.visible)
    visibleAdditions.push({ key: "netIncomeAllocation", label: pc.lineItems.netIncomeAllocation.label });

  const visibleDeductions: { key: keyof typeof deductionsBase; label: string }[] = [];
  if (pc.lineItems.drawings.visible)
    visibleDeductions.push({ key: "drawings", label: pc.lineItems.drawings.label });
  if (pc.lineItems.guaranteedPayments.visible)
    visibleDeductions.push({ key: "guaranteedPayments", label: pc.lineItems.guaranteedPayments.label });

  const customAdditions = pc.customRows.filter((r) => r.section === "additions");
  const customDeductions = pc.customRows.filter((r) => r.section === "deductions");

  const partnerCols = Array.from({ length: partnerCount }, (_, i) => i);

  // Column width: split remaining (60%) among partner cols + optional total
  const totalCols = partnerCount + (showTotal ? 1 : 0);
  const valueColWidth = `${(60 / totalCols).toFixed(2)}%`;

  const renderValueRow = (
    rowTotal: number,
    isTotal = false,
    bordered: "none" | "bottom" | "thick" = "none",
  ) => {
    const cells = partnerCols.map((i) => {
      const val = perPartner(rowTotal, i);
      const cls = `${cellStyle}${bordered === "bottom" ? " " + borderBottom : bordered === "thick" ? " " + thickBorderTop + " " + thickBorderBottom : ""}`;
      const stl: React.CSSProperties = { ...cellPad, fontWeight: i === 0 ? 700 : 400 };
      return (
        <td key={i} className={cls} style={stl}>
          {isTotal ? fv(fmtNum(val), false, true) : fvRow(fmtNum(val))}
        </td>
      );
    });
    if (showTotal) {
      const cls = `${cellStyle}${bordered === "bottom" ? " " + borderBottom : bordered === "thick" ? " " + thickBorderTop + " " + thickBorderBottom : ""}`;
      cells.push(
        <td key="total" className={cls} style={{ ...cellPad, fontWeight: 700 }}>
          {isTotal ? fv(fmtNum(rowTotal), false, true) : fvRow(fmtNum(rowTotal))}
        </td>,
      );
    }
    return cells;
  };

  const emptyRow = (h: number) => (
    <tr>
      <td style={{ height: h }}></td>
      {partnerCols.map((i) => <td key={i}></td>)}
      {showTotal && <td></td>}
    </tr>
  );

  const additionsTotal = visibleAdditions.reduce((s, r) => s + additionsBase[r.key], 0);
  const deductionsTotal = visibleDeductions.reduce((s, r) => s + deductionsBase[r.key], 0);

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-muted/30 overflow-auto">
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
          {hi && (
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginBottom: 10,
                fontSize: 11 * scale,
                fontWeight: 600,
              }}
              aria-label="Preview impact legend"
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "hsl(48 100% 92%)",
                  color: "hsl(28 80% 30%)",
                  border: "1px solid hsl(38 92% 55% / 0.6)",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: 999, background: "hsl(38 92% 55%)" }} />
                Classes · {pc.partnerClassesPreset === "single" ? "Single" : pc.partnerClassesPreset === "generalLimited" ? "Gen + Ltd" : "Custom"}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "hsl(207 100% 95%)",
                  color: "hsl(207 80% 28%)",
                  border: "1px solid hsl(207 72% 45% / 0.55)",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: 999, background: "hsl(207 72% 45%)" }} />
                Allocation · {allocLabel} ({profitLossLabel})
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background:
                    pc.deficitHandling === "block"
                      ? "hsl(0 90% 95%)"
                      : pc.deficitHandling === "warn"
                      ? "hsl(38 95% 92%)"
                      : "hsl(0 80% 96%)",
                  color:
                    pc.deficitHandling === "block"
                      ? "hsl(0 75% 35%)"
                      : pc.deficitHandling === "warn"
                      ? "hsl(28 80% 30%)"
                      : "hsl(0 65% 38%)",
                  border:
                    pc.deficitHandling === "block"
                      ? "1px solid hsl(0 75% 50% / 0.7)"
                      : pc.deficitHandling === "warn"
                      ? "1px solid hsl(38 92% 55% / 0.7)"
                      : "1px dashed hsl(0 65% 50% / 0.7)",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background:
                      pc.deficitHandling === "block"
                        ? "hsl(0 75% 50%)"
                        : pc.deficitHandling === "warn"
                        ? "hsl(38 92% 55%)"
                        : "hsl(0 65% 50%)",
                  }}
                />
                Deficit · {pc.deficitHandling === "highlight" ? "Highlight" : pc.deficitHandling === "warn" ? "Warn" : "Block"}
              </span>
            </div>
          )}

          {/* Title block */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}>
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>ABC {pc.entityType}</span>
            </div>
            <div style={{ fontSize: 18 * scale, fontWeight: 700, marginBottom: 2 }}>
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>
                {pc.jurisdiction === "US" ? "Statement of Partners' Capital" : "Statement of Partners' Capital"}
              </span>
            </div>
            <div style={{ fontSize: baseFontSize, fontWeight: 700 }}>
              For the year ended{" "}
              <span style={{ background: isEditMode ? "hsl(220 15% 90%)" : "transparent", padding: "1px 6px", borderRadius: 2 }}>
                {pc.fiscalYearEnd}, 20XX
              </span>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: baseFontSize, tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th
                  className={`${thickBorderTop} ${thickBorderBottom}`}
                  style={{ width: "40%", textAlign: "left", padding: "4px 2px" }}
                ></th>
                {partnerCols.map((i) => {
                  const letter = partnerLetter(i);
                  const fullName = `Partner ${letter}`;
                  const nameLabel =
                    pc.partnerNameMode === "initials"
                      ? `P${letter}`
                      : pc.partnerNameMode === "code"
                      ? `P-${String(i + 1).padStart(2, "0")}`
                      : pc.partnerNameMode === "custom"
                      ? `Partner ${letter}`
                      : fullName;
                  const interestPct = (factorFor(i, partnerCount, pc.allocationMethod) * 100).toFixed(2);
                  return (
                    <th
                      key={i}
                      className={`${cellStyle} ${i === 0 ? "group/col" : ""} ${thickBorderTop} ${thickBorderBottom}`}
                      style={{ width: valueColWidth, position: "relative", fontWeight: 700 }}
                    >
                      {i === 0 && showAddButtons && (
                        <AddColumnButton onClick={() => addManualColumn("retainedEarnings")} />
                      )}
                      <span style={{ border: "1px solid hsl(220 15% 80%)", padding: "2px 6px", borderRadius: 3, display: "inline-block", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {nameLabel}
                      </span>
                      {pc.partnerClasses[i] && (
                        <div
                          style={{
                            fontSize: 11 * scale,
                            color: hi ? "hsl(28 80% 30%)" : "#6b7280",
                            marginTop: 2,
                            fontWeight: hi ? 600 : 400,
                            display: "inline-block",
                            padding: hi ? "1px 6px" : 0,
                            borderRadius: 3,
                            ...(classesHalo || {}),
                          }}
                          title={hi ? "Driven by Partner Classes setting" : undefined}
                        >
                          {pc.partnerClasses[i]}
                        </div>
                      )}
                      {pc.showInterestPercent && (
                        <div
                          style={{
                            fontSize: 11 * scale,
                            color: hi ? "hsl(207 80% 28%)" : "#1c63a6",
                            marginTop: 2,
                            fontWeight: 600,
                            display: "inline-block",
                            padding: hi ? "1px 6px" : 0,
                            borderRadius: 3,
                            ...(allocHalo || {}),
                          }}
                          title={hi ? `Driven by Allocation Method (${allocLabel})` : undefined}
                        >
                          {interestPct}%
                        </div>
                      )}
                    </th>
                  );
                })}
                {showTotal && (
                  <th
                    className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`}
                    style={{ width: valueColWidth, fontWeight: 700 }}
                  >
                    <span style={{ border: "1px solid hsl(220 15% 80%)", padding: "2px 8px", borderRadius: 3 }}>Total</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {/* Opening Balance */}
              <tr>
                <td className={labelStyle} style={{ ...cellPad, fontWeight: 700, paddingTop: 8 }}>
                  Partners' Capital, Beginning of Year
                </td>
                {partnerCols.map((i) => (
                  <td key={i} className={cellStyle} style={{ ...cellPad, fontWeight: i === 0 ? 700 : 400 }}>
                    {fvRow(fmtNum(openingPer(i)))}
                  </td>
                ))}
                {showTotal && (
                  <td className={cellStyle} style={{ ...cellPad, fontWeight: 700 }}>
                    {fvRow(fmtNum(openingTotal))}
                  </td>
                )}
              </tr>

              {emptyRow(6)}

              {/* Additions */}
              {(visibleAdditions.length > 0 || customAdditions.length > 0) && (
                <>
                  <tr>
                    <td className={labelStyle} style={{ ...cellPad, fontWeight: 700 }}>Add:</td>
                    {partnerCols.map((i) => <td key={i} className={cellStyle} style={cellPad}></td>)}
                    {showTotal && <td className={cellStyle} style={cellPad}></td>}
                  </tr>
                  {visibleAdditions.map((row, idx) => {
                    const total = additionsBase[row.key];
                    const isLast = idx === visibleAdditions.length - 1 && customAdditions.length === 0;
                    return (
                      <tr key={row.key}>
                        <td className={`${labelStyle}${isLast ? " " + borderBottom : ""}`} style={{ ...cellPad, paddingLeft: 16 }}>
                          {row.label}
                        </td>
                        {renderValueRow(total, false, isLast ? "bottom" : "none")}
                      </tr>
                    );
                  })}
                  {customAdditions.map((row, idx) => {
                    const isLast = idx === customAdditions.length - 1;
                    return (
                      <tr key={row.id}>
                        <td className={`${labelStyle}${isLast ? " " + borderBottom : ""}`} style={{ ...cellPad, paddingLeft: 16 }}>
                          {row.label}
                        </td>
                        {renderValueRow(0, false, isLast ? "bottom" : "none")}
                      </tr>
                    );
                  })}
                  <tr>
                    <td className={labelStyle} style={{ ...cellPad, fontWeight: 700 }}>Total Additions</td>
                    {renderValueRow(additionsTotal, true)}
                  </tr>
                </>
              )}

              {emptyRow(4)}

              {/* Subtotal after additions */}
              <tr>
                <td className={labelStyle} style={cellPad}></td>
                {renderValueRow(openingTotal + additionsTotal, true)}
              </tr>

              {emptyRow(6)}

              {/* Deductions */}
              {(visibleDeductions.length > 0 || customDeductions.length > 0) && (
                <>
                  <tr>
                    <td className={labelStyle} style={{ ...cellPad, fontWeight: 700 }}>Deduct:</td>
                    {partnerCols.map((i) => <td key={i} className={cellStyle} style={cellPad}></td>)}
                    {showTotal && <td className={cellStyle} style={cellPad}></td>}
                  </tr>
                  {visibleDeductions.map((row, idx) => {
                    const total = deductionsBase[row.key];
                    const isLast = idx === visibleDeductions.length - 1 && customDeductions.length === 0;
                    return (
                      <tr key={row.key}>
                        <td className={`${labelStyle}${isLast ? " " + borderBottom : ""}`} style={{ ...cellPad, paddingLeft: 16 }}>
                          {row.label}
                        </td>
                        {renderValueRow(total, false, isLast ? "bottom" : "none")}
                      </tr>
                    );
                  })}
                  {customDeductions.map((row, idx) => {
                    const isLast = idx === customDeductions.length - 1;
                    return (
                      <tr key={row.id}>
                        <td className={`${labelStyle}${isLast ? " " + borderBottom : ""}`} style={{ ...cellPad, paddingLeft: 16 }}>
                          {row.label}
                        </td>
                        {renderValueRow(0, false, isLast ? "bottom" : "none")}
                      </tr>
                    );
                  })}
                  <tr>
                    <td className={labelStyle} style={{ ...cellPad, fontWeight: 700 }}>Total Deductions</td>
                    {renderValueRow(deductionsTotal, true)}
                  </tr>
                </>
              )}

              {emptyRow(8)}

              {/* Closing Balance */}
              <tr>
                <td className={`${labelStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ ...cellPad, fontWeight: 700 }}>
                  Partners' Capital, End of Year
                  {hi && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 10 * scale,
                        fontWeight: 600,
                        padding: "1px 6px",
                        borderRadius: 999,
                        color:
                          pc.deficitHandling === "block"
                            ? "hsl(0 75% 35%)"
                            : pc.deficitHandling === "warn"
                            ? "hsl(28 80% 30%)"
                            : "hsl(0 65% 38%)",
                        background:
                          pc.deficitHandling === "block"
                            ? "hsl(0 90% 95%)"
                            : pc.deficitHandling === "warn"
                            ? "hsl(38 95% 92%)"
                            : "hsl(0 80% 96%)",
                        border:
                          pc.deficitHandling === "block"
                            ? "1px solid hsl(0 75% 50% / 0.7)"
                            : pc.deficitHandling === "warn"
                            ? "1px solid hsl(38 92% 55% / 0.7)"
                            : "1px dashed hsl(0 65% 50% / 0.7)",
                      }}
                    >
                      Deficit · {pc.deficitHandling === "highlight" ? "Highlight" : pc.deficitHandling === "warn" ? "Warn" : "Block"}
                    </span>
                  )}
                </td>
                {(() => {
                  // Demo: when impact preview is ON, force the LAST partner into
                  // a deficit so the user sees the chosen handling rendered.
                  const baseRowTotal = openingTotal + additionsTotal - deductionsTotal;
                  const cells: JSX.Element[] = partnerCols.map((i) => {
                    const isLast = i === partnerCount - 1;
                    const value = hi && isLast ? -Math.round(baseRowTotal * 0.18) : perPartner(baseRowTotal, i);
                    const isDeficitDemo = hi && isLast;
                    const baseCls = `${cellStyle} ${thickBorderTop} ${thickBorderBottom}`;
                    const stl: React.CSSProperties = {
                      ...cellPad,
                      fontWeight: i === 0 ? 700 : 400,
                    };
                    if (isDeficitDemo) {
                      if (pc.deficitHandling === "highlight") {
                        stl.color = "hsl(0 70% 40%)";
                        stl.boxShadow = "inset 0 0 0 1.5px hsl(0 70% 50% / 0.7)";
                      } else if (pc.deficitHandling === "warn") {
                        stl.color = "hsl(28 80% 30%)";
                        stl.background = "hsl(38 100% 94%)";
                        stl.boxShadow = "inset 0 0 0 1.5px hsl(38 92% 55% / 0.85)";
                      } else {
                        // block
                        stl.color = "hsl(0 75% 30%)";
                        stl.background =
                          "repeating-linear-gradient(135deg, hsl(0 90% 96%) 0 6px, hsl(0 90% 92%) 6px 12px)";
                        stl.boxShadow = "inset 0 0 0 1.5px hsl(0 75% 50%)";
                        stl.fontWeight = 700;
                      }
                    }
                    const display = value < 0 ? `(${fmtNum(Math.abs(value))})` : fmtNum(value);
                    return (
                      <td
                        key={i}
                        className={baseCls}
                        style={stl}
                        title={isDeficitDemo ? `Deficit handling: ${pc.deficitHandling}` : undefined}
                      >
                        {fv(display, false, true)}
                      </td>
                    );
                  });
                  if (showTotal) {
                    cells.push(
                      <td key="total" className={`${cellStyle} ${thickBorderTop} ${thickBorderBottom}`} style={{ ...cellPad, fontWeight: 700 }}>
                        {fv(fmtNum(baseRowTotal), false, true)}
                      </td>,
                    );
                  }
                  return cells;
                })()}
              </tr>
            </tbody>
          </table>

          {/* Supporting Schedule */}
          {pc.scheduleAutoGenerate && (
            <div style={{ marginTop: pc.schedulePaginate ? 48 : 28 }}>
              <div style={{ fontSize: 14 * scale, fontWeight: 700, marginBottom: 8, color: "#1a1a1a" }}>
                Supporting Schedule —{" "}
                {pc.scheduleGrouping === "byPartner"
                  ? "Grouped by Partner"
                  : pc.scheduleGrouping === "byClass"
                  ? "Grouped by Partner Class"
                  : "Grouped by Line Item"}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 * scale }}>
                <thead>
                  <tr style={{ background: "hsl(220 15% 96%)" }}>
                    <th style={{ textAlign: "left", padding: "4px 8px", borderBottom: "1px solid #d4d4d8" }}>
                      {pc.scheduleGrouping === "byLineItem" ? "Line Item" : "Partner"}
                    </th>
                    <th style={{ textAlign: "right", padding: "4px 8px", borderBottom: "1px solid #d4d4d8" }}>Allocation %</th>
                    <th style={{ textAlign: "right", padding: "4px 8px", borderBottom: "1px solid #d4d4d8" }}>Net Movement</th>
                    <th style={{ textAlign: "right", padding: "4px 8px", borderBottom: "1px solid #d4d4d8" }}>Closing Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {pc.scheduleGrouping === "byLineItem"
                    ? [...visibleAdditions, ...visibleDeductions].map((r, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: "3px 8px", borderBottom: "1px solid #f1f1f5" }}>{r.label}</td>
                          <td style={{ padding: "3px 8px", textAlign: "right", borderBottom: "1px solid #f1f1f5" }}>100.00%</td>
                          <td style={{ padding: "3px 8px", textAlign: "right", borderBottom: "1px solid #f1f1f5" }}>
                            {fv(fmtNum(additionsBase[(r as any).key] ?? deductionsBase[(r as any).key] ?? 0), false, true)}
                          </td>
                          <td style={{ padding: "3px 8px", textAlign: "right", borderBottom: "1px solid #f1f1f5" }}>—</td>
                        </tr>
                      ))
                    : partnerCols.map((i) => {
                        const factor = factorFor(i, partnerCount, pc.allocationMethod);
                        const closing = perPartner(openingTotal + additionsTotal - deductionsTotal, i);
                        const movement = perPartner(additionsTotal - deductionsTotal, i);
                        const label =
                          pc.scheduleGrouping === "byClass"
                            ? `${pc.partnerClasses[i] || "General"} — Partner ${partnerLetter(i)}`
                            : `Partner ${partnerLetter(i)}`;
                        return (
                          <tr key={i}>
                            <td style={{ padding: "3px 8px", borderBottom: "1px solid #f1f1f5" }}>{label}</td>
                            <td style={{ padding: "3px 8px", textAlign: "right", borderBottom: "1px solid #f1f1f5" }}>
                              {(factor * 100).toFixed(2)}%
                            </td>
                            <td style={{ padding: "3px 8px", textAlign: "right", borderBottom: "1px solid #f1f1f5" }}>
                              {fv(fmtNum(movement), false, true)}
                            </td>
                            <td style={{ padding: "3px 8px", textAlign: "right", borderBottom: "1px solid #f1f1f5" }}>
                              {fv(fmtNum(closing), false, true)}
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ padding: `12px ${bodyPadding.split(" ")[1] || "48px"} 20px`, textAlign: "center", fontSize: 12 * scale, color: "#5a5a6e" }}>
          See accompanying notes to financial statements
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

export default TemplatePartnersCapitalPreview;
