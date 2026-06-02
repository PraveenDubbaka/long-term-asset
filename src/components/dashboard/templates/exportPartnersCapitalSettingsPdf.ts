import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { PartnersCapitalSettings } from "@/components/dashboard/workspace/LayoutSettingsContext";

/**
 * Generate a PDF summary of the current Statement of Partners' Capital
 * Template Settings. Includes General, Display, Partner Configuration,
 * Line Items, and Supporting Schedule sections — scoped to the user's
 * chosen jurisdiction and entity type.
 */
export function exportPartnersCapitalSettingsPdf(pc: PartnersCapitalSettings) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  // ---- Header ----
  doc.setFillColor(28, 99, 166);
  doc.rect(0, 0, pageWidth, 64, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Statement of Partners' Capital", margin, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Template Settings Summary", margin, 48);

  // Right-aligned context chips (jurisdiction + entity type)
  const chipText = `${pc.jurisdiction} · ${pc.entityType}`;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  const chipWidth = doc.getTextWidth(chipText) + 16;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - margin - chipWidth, 22, chipWidth, 20, 4, 4, "F");
  doc.setTextColor(28, 99, 166);
  doc.text(chipText, pageWidth - margin - chipWidth + 8, 36);

  // Reset
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  let cursorY = 84;
  const stamp = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.setTextColor(110, 110, 120);
  doc.text(`Generated ${stamp}`, margin, cursorY);
  cursorY += 14;

  // Helper: render a labelled section table.
  const renderSection = (title: string, rows: Array<[string, string]>) => {
    autoTable(doc, {
      startY: cursorY,
      head: [[title, ""]],
      body: rows,
      theme: "grid",
      margin: { left: margin, right: margin },
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 6,
        lineColor: [220, 224, 230],
        lineWidth: 0.5,
        textColor: [40, 40, 50],
      },
      headStyles: {
        fillColor: [240, 244, 250],
        textColor: [28, 99, 166],
        fontStyle: "bold",
        fontSize: 11,
        halign: "left",
      },
      columnStyles: {
        0: { cellWidth: 200, fontStyle: "bold", textColor: [70, 75, 90] },
        1: { cellWidth: "auto" },
      },
      didDrawPage: () => {
        // no-op; handled outside
      },
    });
    // @ts-expect-error - lastAutoTable is added by autotable plugin
    cursorY = doc.lastAutoTable.finalY + 14;
  };

  // ---- Section: General ----
  renderSection("General", [
    ["Jurisdiction", pc.jurisdiction === "US" ? "United States (US)" : "Canada (CA)"],
    ["Entity Type", pc.entityType],
    ["Fiscal Year End", pc.fiscalYearEnd || "—"],
  ]);

  // ---- Section: Display / Layout ----
  const layoutModeLabel: Record<typeof pc.layoutMode, string> = {
    auto: "Auto",
    forceColumns: "Force Individual Columns",
    forceRows: "Force Individual Rows",
    forceClassSummary: "Force Class Summary",
  } as const;
  const partnerNameLabel: Record<typeof pc.partnerNameMode, string> = {
    fullName: "Full Name",
    initials: "Initials",
    code: "Code",
    custom: "Custom",
  } as const;
  renderSection("Display & Layout", [
    ["Layout Mode", layoutModeLabel[pc.layoutMode]],
    ["Auto-switch (Columns → Rows)", `${pc.autoSwitchColumnsToRows} partners`],
    ["Auto-switch (Rows → Class Summary)", `${pc.autoSwitchRowsToClassSummary} partners`],
    ["Show Interest %", pc.showInterestPercent ? "On" : "Off"],
    ["Show Partner Name", partnerNameLabel[pc.partnerNameMode]],
    ["Show Total Column", pc.showTotalColumn ? "Yes" : "No"],
    ["Compact Rows", pc.compactRows ? "Yes" : "No"],
  ]);

  // ---- Section: Partners ----
  const presetLabel =
    pc.partnerClassesPreset === "single"
      ? "Single Class"
      : pc.partnerClassesPreset === "generalLimited"
      ? "General + Limited"
      : "Custom Classes";

  const allocationMethodLabel =
    pc.allocationMethod === "equal"
      ? "Equal Split"
      : pc.allocationMethod === "ownership"
      ? "By Ownership %"
      : "Custom";

  renderSection("Partners", [
    ["Partner Count", String(pc.partnerCount)],
    ["Partner Classes Preset", presetLabel],
    ...(pc.partnerClassesPreset === "custom"
      ? ([["Custom Class Labels", pc.customClassLabels.join(", ") || "—"]] as Array<[string, string]>)
      : []),
    ["Allocation Method (numerics)", allocationMethodLabel],
  ]);

  // Per-partner roster
  const partnerLetter = (i: number) => String.fromCharCode(65 + i);
  autoTable(doc, {
    startY: cursorY,
    head: [["Partner", "Class"]],
    body: Array.from({ length: Math.min(pc.partnerCount, pc.partnerClasses.length) }, (_, i) => [
      `Partner ${partnerLetter(i)}`,
      pc.partnerClasses[i] || "—",
    ]),
    theme: "striped",
    margin: { left: margin, right: margin },
    styles: { font: "helvetica", fontSize: 10, cellPadding: 5, textColor: [40, 40, 50] },
    headStyles: { fillColor: [240, 244, 250], textColor: [28, 99, 166], fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 200 } },
  });
  // @ts-expect-error lastAutoTable
  cursorY = doc.lastAutoTable.finalY + 14;

  // ---- Section: Partner Configuration (Partnership-only) ----
  if (pc.entityType === "Partnership") {
    const profitLossLabel =
      pc.profitLossMethod === "proRata"
        ? "Pro-rata %"
        : pc.profitLossMethod === "fixed"
        ? "Fixed amounts"
        : pc.profitLossMethod === "customPerPartner"
        ? "Custom per partner"
        : "Per agreement";
    const deficitLabel =
      pc.deficitHandling === "highlight"
        ? "Highlight"
        : pc.deficitHandling === "warn"
        ? "Warn"
        : "Block";
    renderSection("Partner Configuration", [
      ["Profit/Loss Allocation", profitLossLabel],
      ["Allocation % editable per line", pc.allocationEditablePerLine ? "Yes" : "No"],
      ["Allow unequal distributions", pc.allowUnequalDistributions ? "Yes" : "No"],
      ["Deficit account handling", deficitLabel],
    ]);
  }

  // ---- Section: Line Items ----
  const lineItemRows: Array<[string, string]> = (
    ["capitalContributions", "netIncomeAllocation", "drawings", "guaranteedPayments"] as const
  ).map((key) => {
    const item = pc.lineItems[key];
    return [item.label, item.visible ? "Visible" : "Hidden"];
  });
  if (pc.customRows.length) {
    pc.customRows.forEach((r) => {
      lineItemRows.push([`${r.label} (custom · ${r.section})`, "Visible"]);
    });
  }
  renderSection("Line Items", lineItemRows);

  // ---- Section: Supporting Schedule ----
  const schedGroupingLabel =
    pc.scheduleGrouping === "byPartner"
      ? "By Partner"
      : pc.scheduleGrouping === "byClass"
      ? "By Partner Class"
      : "By Line Item";
  renderSection("Supporting Schedule", [
    ["Auto-generate", pc.scheduleAutoGenerate ? "On" : "Off"],
    ["Grouping", schedGroupingLabel],
    ["Paginate on its own page", pc.schedulePaginate ? "Yes" : "No"],
  ]);

  // ---- Footer on every page ----
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();
    doc.setDrawColor(220, 224, 230);
    doc.line(margin, ph - 28, pageWidth - margin, ph - 28);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 140);
    doc.text("Countable · Dynamic Templates · Statement of Partners' Capital", margin, ph - 14);
    doc.text(`Page ${i} of ${total}`, pageWidth - margin, ph - 14, { align: "right" });
  }

  const safeJur = pc.jurisdiction;
  const safeEntity = pc.entityType.replace(/\s+/g, "");
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`PartnersCapital_TemplateSettings_${safeJur}_${safeEntity}_${dateStr}.pdf`);
}
