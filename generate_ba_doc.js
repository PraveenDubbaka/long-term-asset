const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, Header, Footer, PageNumber, TabStopType, TabStopPosition,
} = require('docx');
const fs = require('fs');

// ── Colour palette ────────────────────────────────────────────────────────────
const C = {
  navy:      '1F3864',
  blue:      '2E75B6',
  lightBlue: 'D6E4F0',
  amber:     'FFC000',
  amberBg:   'FFF3CD',
  green:     '375623',
  greenBg:   'E2EFDA',
  red:       '7B0000',
  redBg:     'FDECEA',
  grey:      '595959',
  greyBg:    'F2F2F2',
  white:     'FFFFFF',
  headerBg:  '1F3864',
  rowAlt:    'EBF3FB',
};

// ── Border helpers ─────────────────────────────────────────────────────────────
const bdr  = (color = 'CCCCCC', sz = 4) => ({ style: BorderStyle.SINGLE, size: sz, color });
const noBdr = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const allBdr = (color = 'CCCCCC', sz = 4) => ({ top: bdr(color, sz), bottom: bdr(color, sz), left: bdr(color, sz), right: bdr(color, sz) });

// ── Content width (US Letter 1" margins) ──────────────────────────────────────
const PW = 9360; // content width in DXA

// ── Spacing helpers ───────────────────────────────────────────────────────────
function sp(before = 0, after = 0) { return { spacing: { before, after } }; }

// ── Text helpers ──────────────────────────────────────────────────────────────
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: 'Arial', size: 28, bold: true, color: C.white })],
    shading: { fill: C.navy, type: ShadingType.CLEAR },
    spacing: { before: 280, after: 120 },
    indent: { left: 200, right: 200 },
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, font: 'Arial', size: 24, bold: true, color: C.navy })],
    spacing: { before: 240, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.blue, space: 3 } },
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, font: 'Arial', size: 22, bold: true, color: C.blue })],
    spacing: { before: 180, after: 60 },
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, font: 'Arial', size: 20, color: opts.color || '000000', bold: opts.bold || false, italics: opts.italic || false })],
    spacing: { before: opts.before ?? 80, after: opts.after ?? 80 },
    indent: opts.indent ? { left: opts.indent } : undefined,
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    children: [new TextRun({ text, font: 'Arial', size: 20 })],
    spacing: { before: 40, after: 40 },
  });
}

function blank(sz = 80) {
  return new Paragraph({ children: [new TextRun('')], spacing: { before: sz, after: 0 } });
}

function statusBadge(text, fill, textColor = C.white) {
  return new TextRun({ text: ` ${text} `, font: 'Arial', size: 18, bold: true, color: textColor, shading: { fill, type: ShadingType.CLEAR } });
}

// ── Table helpers ─────────────────────────────────────────────────────────────
function headerCell(text, width, bg = C.headerBg) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill: bg, type: ShadingType.CLEAR },
    borders: allBdr(C.blue, 6),
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun({ text, font: 'Arial', size: 18, bold: true, color: C.white })],
      spacing: { before: 0, after: 0 },
    })],
  });
}

function dataCell(text, width, bg = C.white, opts = {}) {
  const runs = [];
  if (opts.badge) {
    runs.push(statusBadge(opts.badge.text, opts.badge.fill, opts.badge.color));
  } else {
    runs.push(new TextRun({ text, font: 'Arial', size: 18, color: opts.color || '1a1a1a', bold: opts.bold || false, italics: opts.italic || false }));
  }
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill: bg, type: ShadingType.CLEAR },
    borders: allBdr('CCCCCC', 4),
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: opts.vAlign,
    children: [new Paragraph({ children: runs, spacing: { before: 0, after: 0 } })],
  });
}

function makeTable(headers, rows, colWidths, altColor = C.rowAlt) {
  const tableRows = [];
  // Header row
  tableRows.push(new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => headerCell(h, colWidths[i])),
  }));
  // Data rows
  rows.forEach((row, ri) => {
    const bg = ri % 2 === 0 ? C.white : altColor;
    tableRows.push(new TableRow({
      children: row.map((cell, ci) => {
        if (typeof cell === 'object' && cell.badge) {
          return dataCell('', colWidths[ci], bg, cell);
        }
        return dataCell(String(cell ?? ''), colWidths[ci], bg);
      }),
    }));
  });
  return new Table({
    width: { size: PW, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: tableRows,
  });
}

// ── Callout box ───────────────────────────────────────────────────────────────
function callout(icon, label, text, fill, borderColor, textColor = '1a1a1a') {
  return new Table({
    width: { size: PW, type: WidthType.DXA },
    columnWidths: [600, PW - 600],
    rows: [new TableRow({
      children: [
        new TableCell({
          width: { size: 600, type: WidthType.DXA },
          shading: { fill, type: ShadingType.CLEAR },
          borders: { top: bdr(borderColor, 8), bottom: bdr(borderColor, 8), left: bdr(borderColor, 8), right: noBdr },
          margins: { top: 120, bottom: 120, left: 160, right: 80 },
          children: [new Paragraph({
            children: [new TextRun({ text: icon, font: 'Arial', size: 28, bold: true, color: borderColor })],
            spacing: { before: 0, after: 0 },
          })],
        }),
        new TableCell({
          width: { size: PW - 600, type: WidthType.DXA },
          shading: { fill, type: ShadingType.CLEAR },
          borders: { top: bdr(borderColor, 8), bottom: bdr(borderColor, 8), left: noBdr, right: bdr(borderColor, 8) },
          margins: { top: 100, bottom: 100, left: 120, right: 160 },
          children: [
            new Paragraph({ children: [new TextRun({ text: label, font: 'Arial', size: 20, bold: true, color: borderColor })], spacing: { before: 0, after: 40 } }),
            new Paragraph({ children: [new TextRun({ text, font: 'Arial', size: 18, color: textColor, italics: true })], spacing: { before: 0, after: 0 } }),
          ],
        }),
      ],
    })],
  });
}

// ── Story block ───────────────────────────────────────────────────────────────
function storyBlock(num, title, status, statusFill, storyText, acs) {
  const rows = [];
  rows.push(new Paragraph({
    children: [
      new TextRun({ text: `Story ${num}  `, font: 'Arial', size: 22, bold: true, color: C.navy }),
      new TextRun({ text: title, font: 'Arial', size: 22, bold: true, color: C.navy }),
      new TextRun({ text: '   ' }),
      statusBadge(status, statusFill, status === 'OPEN' ? C.navy : C.white),
    ],
    spacing: { before: 160, after: 80 },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: C.blue, space: 8 } },
    indent: { left: 200 },
  }));
  rows.push(new Paragraph({
    children: [new TextRun({ text: storyText, font: 'Arial', size: 19, italics: true, color: C.grey })],
    spacing: { before: 60, after: 80 },
    indent: { left: 200 },
  }));
  rows.push(new Paragraph({ children: [new TextRun({ text: 'Acceptance Criteria:', font: 'Arial', size: 19, bold: true })], spacing: { before: 60, after: 40 }, indent: { left: 200 } }));
  acs.forEach(ac => rows.push(new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    children: [new TextRun({ text: ac, font: 'Arial', size: 18 })],
    spacing: { before: 30, after: 30 },
  })));
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD DOCUMENT
// ─────────────────────────────────────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 520, hanging: 260 } } } },
          { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 900, hanging: 260 } } } },
        ],
      },
    ],
  },
  styles: {
    default: {
      document: { run: { font: 'Arial', size: 20, color: '1a1a1a' } },
    },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: 'Arial', size: 28, bold: true, color: C.white },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: 'Arial', size: 24, bold: true, color: C.navy },
        paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: 'Arial', size: 22, bold: true, color: C.blue },
        paragraph: { spacing: { before: 180, after: 60 }, outlineLevel: 2 } },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [
            new TextRun({ text: 'Long-Term Debt Workpaper Tool', font: 'Arial', size: 18, color: C.grey }),
            new TextRun({ text: '\t', font: 'Arial', size: 18 }),
            new TextRun({ text: 'BA Impact Map — Loan Deletion', font: 'Arial', size: 18, color: C.grey }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.blue, space: 4 } },
          spacing: { before: 0, after: 80 },
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [
            new TextRun({ text: 'CONFIDENTIAL — Internal Workpaper Reference', font: 'Arial', size: 16, color: C.grey, italics: true }),
            new TextRun({ text: '\t', font: 'Arial', size: 16 }),
            new TextRun({ text: 'Page ', font: 'Arial', size: 16, color: C.grey }),
            new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: C.grey }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.blue, space: 4 } },
          spacing: { before: 80, after: 0 },
        })],
      }),
    },
    children: [

      // ── TITLE PAGE ──────────────────────────────────────────────────────────
      new Paragraph({
        children: [new TextRun({ text: '', font: 'Arial', size: 20 })],
        spacing: { before: 600, after: 0 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'BA REFERENCE DOCUMENT', font: 'Arial', size: 24, bold: true, color: C.blue })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Loan Deletion — Cascade Impact Map', font: 'Arial', size: 40, bold: true, color: C.navy })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Long-Term Debt Workpaper Tool', font: 'Arial', size: 24, color: C.grey })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 40 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'For use in writing User Stories and Acceptance Criteria', font: 'Arial', size: 20, italics: true, color: C.grey })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 600 },
      }),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.blue, space: 2 } },
        children: [],
        spacing: { before: 0, after: 0 },
      }),
      blank(400),
      new Paragraph({
        children: [new TextRun({ text: 'Prepared for:', font: 'Arial', size: 18, color: C.grey })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 40 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Business Analysis Team', font: 'Arial', size: 22, bold: true, color: C.navy })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 40 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Version 1.0  |  April 2026', font: 'Arial', size: 18, color: C.grey })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
      }),

      // PAGE BREAK
      new Paragraph({ children: [], pageBreakBefore: true, spacing: { before: 0, after: 0 } }),

      // ── CONTEXT ─────────────────────────────────────────────────────────────
      h1('Context'),
      body('When a user deletes a loan from the Loans tab, data tied to that loan exists across 7 other tabs, 3 types of computed outputs, and 2 categories of orphaned records. This document maps every downstream effect so the BA team can write stories that capture the full scope — including what currently works, what is silently broken, and what requires new UX/logic to be built.'),
      blank(),

      // Epic callout
      callout(
        '★',
        'Epic Summary',
        'As a preparer, when I delete a loan, I expect all associated data to be cleanly removed or flagged, all computed outputs to reflect the deletion immediately, and any records that cannot be safely auto-deleted to be surfaced to me for review — so that no stale or misleading data remains anywhere in the workpaper.',
        C.lightBlue, C.blue, C.navy
      ),
      blank(120),

      // ── SECTION 1 ────────────────────────────────────────────────────────────
      h2('1. What Is a "Loan" in This System?'),
      body('A Loan record is the master anchor for an entire sub-ledger of workpaper data. Deleting it has both hard cascade (auto-deleted today) and soft/orphaned (remains but loses its parent reference) consequences.'),
      blank(60),
      body('Key loan fields consumed across tabs:', { bold: true }),
      bullet('id — FK referenced by all child records (amortization, continuity, activities, covenants, reconciliation, JEs)'),
      bullet('currentBalance, currentPortion, longTermPortion, accruedInterest — KPI inputs on Dashboard and Notes'),
      bullet('rate, maturityDate, type, currency, fxRateToCAD — chart and maturity schedule inputs'),
      bullet('covenantIds — covenant monitoring linkage'),
      bullet('wpRefs — BAN/LAG document links'),
      bullet('status — filter for "Active" loans in Notes, Dashboard, Continuity, Reconciliation'),
      blank(120),

      // ── SECTION 2 ────────────────────────────────────────────────────────────
      h2('2. Hard Cascade — Auto-Deleted Today'),
      body('The deleteLoan(id) store action (src/store/useStore.ts) performs a cascade delete across 6 collections simultaneously:'),
      blank(60),
      makeTable(
        ['Collection', 'FK Relationship', 'What Disappears on Delete'],
        [
          ['loans', 'Is the record', 'The loan itself'],
          ['amortization', 'AmortizationRow.loanId', 'All scheduled P&I rows (e.g., 26 rows for Term Loan A)'],
          ['continuity', 'ContinuityRow.loanId', 'All monthly roll-forward periods (e.g., 12 rows per loan)'],
          ['activities', 'ActivityItem.loanId', 'All payments, draws, fee items classified to that loan'],
          ['covenants', 'Covenant.loanId', 'All financial covenants monitored for that loan'],
          ['reconciliation', 'ReconciliationItem.loanId', 'All TB recon items (principal + accrued interest)'],
        ],
        [1800, 2600, 4960]
      ),
      blank(120),
      callout('✓', 'Result', 'These disappear cleanly and immediately from all affected tabs on deletion. No user action required.', C.greenBg, '375623', C.green),
      blank(160),

      // ── SECTION 3 ────────────────────────────────────────────────────────────
      h2('3. Soft / Orphaned Records — Gaps Today'),
      body('Two collections are NOT cascade-deleted and become orphaned after a loan deletion:'),
      blank(60),

      h3('3a. Journal Entry Proposals (jes array)'),
      makeTable(
        ['Attribute', 'Detail'],
        [
          ['Current behaviour', 'deleteLoan() sets je.loanId = undefined on matching JEs. The JE record stays in the array.'],
          ['File', 'src/store/useStore.ts — jes: s.jes.map(j => j.loanId === id ? { ...j, loanId: undefined } : j)'],
          ['Impact', 'JE tab shows the entry with no loan name. GL debit/credit lines remain in the workpaper.'],
          ['If JE was Posted', 'GL impact is permanent but audit trail (which loan it belonged to) is erased forever.'],
          ['BA Gap', 'No warning shown before deletion. No way to recover the link after deletion.'],
        ],
        [2200, 7160]
      ),
      blank(120),

      h3('3b. Review Queue Items (reviewQueue array)'),
      makeTable(
        ['Attribute', 'Detail'],
        [
          ['Current behaviour', 'deleteLoan() does NOT touch the reviewQueue. Items with matching loanId persist indefinitely.'],
          ['File', 'src/store/useStore.ts — no reviewQueue filter in deleteLoan action'],
          ['Impact', 'Review Queue drawer continues to show items like "Missing P/I split — Term Loan A" after loan is gone.'],
          ['Navigation', 'Clicking these items navigates to a tab that shows no data for the deleted loan.'],
          ['BA Gap', 'Stale review items inflate the queue count badge; resolving them requires manual dismissal.'],
        ],
        [2200, 7160]
      ),
      blank(160),

      // ── SECTION 4 ────────────────────────────────────────────────────────────
      h2('4. Tab-by-Tab Visual Impact'),
      body('The following table details what changes in each of the 10 tabs when a loan is deleted:'),
      blank(60),

      // Tab impact table — split by tab
      ...[
        ['Dashboard', 'src/pages/DashboardTab.tsx', [
          ['KPI: Total Debt', 'Decreases by deleted loan\'s CAD-equivalent balance'],
          ['KPI: Current Portion', 'Decreases by loan.currentPortion'],
          ['KPI: Accrued Interest', 'Decreases by loan.accruedInterest'],
          ['KPI: Covenant Issues', 'May decrease if covenants for this loan were Breached/At Risk'],
          ['Maturity Ladder (bar chart)', 'Bars for years covering deleted loan\'s maturity shrink or disappear'],
          ['Portfolio Breakdown (pie)', 'Slice for deleted loan removed; remaining slices re-proportion'],
          ['Facility Summary cards', 'Card for deleted loan disappears entirely'],
          ['Covenant Outlook table', 'Rows for that loan\'s covenants vanish'],
          ['Pending Actions', 'Maturity alert removed; JE count unchanged (JEs orphaned, not deleted)'],
        ]],
        ['Loans', 'src/pages/LoansTab.tsx', [
          ['All-Loans table', 'Row for deleted loan removed immediately'],
          ['Total row (tfoot)', 'Aggregate balance, current portion, LT portion all recalculate'],
          ['Loan count badge', 'Decreases by 1'],
          ['Loan detail panel', 'If user had selected this loan, panel shows empty state'],
        ]],
        ['Continuity', 'src/pages/ContinuityTab.tsx', [
          ['All-Loans consolidated table', 'Row group for deleted loan removed from roll-forward'],
          ['Grand totals (tfoot)', 'Opening/closing balances, new borrowings, repayments, FX translation recalculate'],
          ['Single-loan dropdown', 'Deleted loan removed from selector'],
          ['Repayment Schedule view', 'Row for deleted loan gone; year-column totals shrink'],
          ['Balance Sheet Classification', 'Current/LT portion columns recalculate'],
        ]],
        ['Amortization', 'src/pages/AmortizationTab.tsx', [
          ['Loan selector', 'Deleted loan removed from dropdown'],
          ['Schedule table', 'Shows 0 rows / empty state if deleted loan was selected'],
          ['Stat cards', 'Remaining balance, total interest, payment count all go to 0'],
          ['Totals footer', 'All columns go to 0'],
        ]],
        ['Activity', 'src/pages/ActivityTab.tsx', [
          ['Loan filter dropdown', 'Deleted loan removed from options'],
          ['Activity table', 'All rows classified to deleted loan filtered out'],
          ['Stats bar', 'Classified/Unclassified/Exception counts recalculate'],
        ]],
        ['Covenants', 'src/pages/CovenantsTab.tsx', [
          ['Loan filter', 'Deleted loan removed from selector'],
          ['Covenant table', 'All covenant rows for that loan removed'],
          ['Status summary counts', 'Breach/At Risk badge counts may decrease'],
        ]],
        ['Reconciliation', 'src/pages/ReconciliationTab.tsx', [
          ['Loan-grouped cards', 'Card/section for deleted loan disappears entirely'],
          ['Summary bar', 'Reconciled/Variance/Override item counts recalculate'],
          ['Variance total (CAD)', 'Recalculates excluding deleted loan\'s variance amounts'],
        ]],
        ['AJEs', 'src/pages/AJEsTab.tsx', [
          ['JE cards', 'JEs previously linked to loan now show no loan name (loanId is undefined)'],
          ['GL line items', 'Debit/credit rows remain; account references still valid but context lost'],
          ['Status counts', 'Draft/Approved/Posted counts unchanged (JEs not deleted)'],
          ['Filtering', 'Cannot filter by deleted loan (no longer in selector)'],
        ]],
        ['Reports', 'src/pages/ReportsTab.tsx', [
          ['Loan Register export', 'Deleted loan row excluded'],
          ['Continuity export', 'No rows for deleted loan in any sheet'],
          ['Amortization export', 'No rows for deleted loan in any sheet'],
          ['AJE Package export', 'JEs for deleted loan export without a loanId reference'],
        ]],
        ['Notes', 'src/pages/NotesTab.tsx', [
          ['Loan narrative table', 'Row for deleted loan disappears; CY/PY totals recalculate'],
          ['Maturity schedule', 'Deleted loan excluded from year buckets'],
          ['Posted note (if posted)', 'STALE FLAG TRIGGERED — amber "Note Outdated" banner appears'],
          ['Posted note preview', 'Shows OUTDATED watermark + stale diff message naming the deleted loan'],
        ]],
      ].flatMap(([tab, file, rows]) => [
        h3(`Tab — ${tab}`),
        body(file, { italic: true, color: C.grey, before: 20, after: 60 }),
        makeTable(
          ['UI Element', 'What Changes'],
          rows,
          [3200, 6160]
        ),
        blank(120),
      ]),

      // PAGE BREAK before computed totals
      new Paragraph({ children: [], pageBreakBefore: true, spacing: { before: 0, after: 0 } }),

      // ── SECTION 5 ────────────────────────────────────────────────────────────
      h2('5. Computed Totals That Recalculate Automatically'),
      body('All values below are derived from loans.filter(l => l.status === "Active") on every render and update immediately when a loan is removed:'),
      blank(80),
      makeTable(
        ['Location', 'Variable', 'Formula'],
        [
          ['Dashboard', 'Total Debt', 'Sum of loan.currentBalance × fxRateToCAD for all active loans'],
          ['Dashboard', 'Current Portion', 'Sum of loan.currentPortion × fxRateToCAD for all active loans'],
          ['Dashboard', 'LT Debt', 'Sum of loan.longTermPortion × fxRateToCAD for all active loans'],
          ['Dashboard', 'Accrued Interest', 'Sum of loan.accruedInterest × fxRateToCAD for all active loans'],
          ['Notes', 'Total CY', 'Sum of TB balance (from recon, fallback to currentBalance) per active loan'],
          ['Notes', 'Total Current', 'Sum of yeRow.currentPortion per active loan from continuity'],
          ['Notes', 'Total LT', 'Sum of yeRow.longTermPortion per active loan from continuity'],
          ['Continuity', 'Grand Total New Borrowings', 'Sum of continuityRow.newBorrowings per loanId'],
          ['Continuity', 'Grand Total Repayments', 'Sum of continuityRow.repayments per loanId'],
          ['Continuity', 'Grand Total FX', 'Sum of continuityRow.fxTranslation per loanId'],
        ],
        [1800, 2800, 4760]
      ),
      blank(160),

      // ── SECTION 6 ────────────────────────────────────────────────────────────
      h2('6. User Story Backlog'),
      blank(60),

      // Story 1 — DONE
      ...storyBlock(1, '— Core Cascade Delete', 'DONE', C.green,
        'As a preparer, When I confirm deletion of a loan, Then the system removes the loan record and all directly associated amortization rows, continuity rows, activity items, covenants, and reconciliation items in a single atomic operation, So that no orphaned child records remain for the deleted loan.',
        [
          'Loan row disappears from Loans tab immediately on confirmation',
          'Amortization tab shows 0 rows for that loan',
          'Continuity tab shows no roll-forward data for that loan',
          'Activity tab shows no items for that loan',
          'Covenants tab shows no covenants for that loan',
          'Reconciliation tab shows no recon card for that loan',
          'All computed KPIs and totals on Dashboard and Notes tabs recalculate automatically',
        ]
      ),
      blank(80),

      // Story 2 — OPEN
      ...storyBlock(2, '— Pre-Delete Audit Warning', 'OPEN', C.amber,
        'As a preparer, When I click Delete on a loan that has associated Journal Entries in Draft, Approved, or Posted status, Then the delete confirmation dialog shows a warning listing those JEs by entry number and status, So that I can decide whether to proceed knowing the loan\'s GL audit trail will be severed.',
        [
          'Delete confirmation modal shows a secondary warning section if jes.some(j => j.loanId === id)',
          'Warning lists each affected JE: Entry #, type, status (Draft / Approved / Posted)',
          'If any JE is Posted, warning text is elevated to: "Warning: 1 Posted JE will lose its loan reference. This cannot be undone."',
          'User can still confirm or cancel — deletion is not blocked',
          'On confirm, JEs are soft-nullified as today (loanId becomes undefined)',
          'File to modify: src/pages/LoansTab.tsx — delete confirmation modal',
        ]
      ),
      blank(80),

      // Story 3 — OPEN
      ...storyBlock(3, '— Review Queue Cleanup on Delete', 'OPEN', C.amber,
        'As a preparer, When a loan is deleted, Then any Review Queue items tied to that loan are automatically removed from the queue, So that the queue count badge accurately reflects actionable items only.',
        [
          'reviewQueue.filter(r => r.loanId !== deletedId) added to deleteLoan cascade in src/store/useStore.ts',
          'Review Queue drawer no longer shows items referencing the deleted loan',
          'Review Queue badge count decreases accordingly',
          'No broken navigation occurs from clicking queue items (orphaned items are removed)',
          'File to modify: src/store/useStore.ts — add reviewQueue filter to deleteLoan action',
        ]
      ),
      blank(80),

      // Story 4 — DONE
      ...storyBlock(4, '— Notes Staleness Notification', 'DONE', C.green,
        'As a preparer, When I delete a loan after the Long-term Debt note has been posted, Then the Notes tab shows a stale warning naming the deleted loan and prompts me to re-post, So that I know the posted note no longer matches current workpaper data.',
        [
          'Amber "Note Outdated" badge replaces green "Posted to Notes" badge in Notes tab header',
          'Amber stale banner appears between header and table, naming the specific loan removed',
          '"Re-post Note" button appears in both banner and header',
          'Clicking "Re-post Note" captures a new snapshot and clears the stale state',
          '"View Note" on a stale note opens the preview with an OUTDATED watermark and amber alert bar',
          'Stale state persists if user navigates away and returns (stored in Zustand, not local component state)',
        ]
      ),
      blank(80),

      // Story 5 — FUTURE
      ...storyBlock(5, '— JE Orphan Management', 'FUTURE SPRINT', 'AAAAAA',
        'As a preparer, When a loan is deleted and it had associated JEs, Then I can view a list of orphaned JEs in the AJEs tab clearly marked as "[Loan Deleted]", So that I can decide whether to void, reassign, or retain those entries.',
        [
          'AJEs tab shows a dedicated "Orphaned / Loan Deleted" filter option in the status filter bar',
          'Orphaned JEs display a red "[Loan Deleted]" badge where the loan name would appear',
          'Preparer can mark an orphaned JE as "Voided" with a mandatory reason field',
          'Voided JEs move to a Voided filter (similar to existing Deleted filter)',
          'Orphaned JEs do not count toward active Draft/Approved/Posted totals',
          'File to modify: src/pages/AJEsTab.tsx — add Orphaned filter + badge rendering',
        ]
      ),
      blank(160),

      // ── SECTION 7 ────────────────────────────────────────────────────────────
      h2('7. Cascade Delete — Current State vs. Target State'),
      blank(60),
      makeTable(
        ['Collection', 'Current Behaviour', 'Target Behaviour', 'Story'],
        [
          ['loans', { badge: { text: 'Deleted', fill: C.green } }, { badge: { text: 'Deleted', fill: C.green } }, '—'],
          ['amortization', { badge: { text: 'Deleted', fill: C.green } }, { badge: { text: 'Deleted', fill: C.green } }, '—'],
          ['continuity', { badge: { text: 'Deleted', fill: C.green } }, { badge: { text: 'Deleted', fill: C.green } }, '—'],
          ['activities', { badge: { text: 'Deleted', fill: C.green } }, { badge: { text: 'Deleted', fill: C.green } }, '—'],
          ['covenants', { badge: { text: 'Deleted', fill: C.green } }, { badge: { text: 'Deleted', fill: C.green } }, '—'],
          ['reconciliation', { badge: { text: 'Deleted', fill: C.green } }, { badge: { text: 'Deleted', fill: C.green } }, '—'],
          ['jes', { badge: { text: 'Soft-nullified', fill: C.amber, color: C.navy } }, 'Keep soft-nullify + add pre-delete warning', 'Story 2'],
          ['reviewQueue', { badge: { text: 'Orphaned', fill: C.red } }, { badge: { text: 'Deleted', fill: C.green } }, 'Story 3'],
          ['Notes post state', { badge: { text: 'Stale flag', fill: C.green } }, { badge: { text: 'Stale flag', fill: C.green } }, 'Story 4'],
        ],
        [2200, 2400, 2960, 1800]
      ),
      blank(160),

      // ── SECTION 8 ────────────────────────────────────────────────────────────
      h2('8. Files Affected by Open Stories'),
      blank(60),
      makeTable(
        ['Story', 'File to Modify', 'Change Type'],
        [
          ['Story 2', 'src/pages/LoansTab.tsx', 'Add JE warning section to delete confirmation modal'],
          ['Story 2', 'src/store/useStore.ts', 'No change needed — soft-nullify is correct behaviour'],
          ['Story 3', 'src/store/useStore.ts', 'Add reviewQueue.filter(r => r.loanId !== id) to deleteLoan'],
          ['Story 5', 'src/pages/AJEsTab.tsx', 'Add "Orphaned" filter + "[Loan Deleted]" badge rendering'],
        ],
        [1400, 3800, 4160]
      ),
      blank(160),

      // ── SECTION 9 ────────────────────────────────────────────────────────────
      h2('9. QA Test Scenarios'),
      blank(60),
      makeTable(
        ['Scenario', 'Steps', 'Expected Result'],
        [
          ['Delete loan with no children', 'Add a new blank loan; immediately delete it', 'No errors; toast "Loan deleted"; all tabs unaffected'],
          ['Delete loan with covenants', 'Delete Term Loan A', 'DSCR + Debt-to-EBITDA covenants removed; Dashboard covenant KPI decreases'],
          ['Delete loan with posted JEs', 'Delete Term Loan A (has JE-01, JE-02 both posted)', '(Story 2) Warning shown listing JE-01 and JE-02 as Posted status'],
          ['Delete after posting Notes', 'Post note; delete Operating LOC; go to Notes tab', '"Note Outdated" banner visible; stale diff says "Operating LOC" was removed'],
          ['Delete; check review queue', 'Delete HSBC Equipment Loan; open Review Queue drawer', '(Story 3) No items remain for HSBC Equipment Loan'],
          ['Delete all loans', 'Delete all 8 active loans one-by-one', 'Dashboard shows all zeros; Notes tab shows empty table; no JS errors'],
          ['Re-post after deletion', 'Delete a loan; click "Re-post Note"', 'Green "Posted to Notes" badge returns; OUTDATED watermark gone; new snapshot captured'],
        ],
        [2600, 3200, 3560]
      ),
      blank(200),

      // ── CLOSING CALLOUT ──────────────────────────────────────────────────────
      callout(
        'ℹ',
        'Document Status',
        'Stories 1 and 4 are implemented. Stories 2, 3, and 5 are open backlog items. This document reflects the codebase state as of April 2026.',
        C.amberBg, C.amber, C.navy
      ),

    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/Users/countable/Loan Debt/BA_LoanDeletion_ImpactMap.docx', buffer);
  console.log('SUCCESS: BA_LoanDeletion_ImpactMap.docx written');
}).catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
