import * as XLSX from "xlsx";
import { sources, currentYearTransactions, priorYearLots, closingFxRate } from "./mockData";
import {
  compute, buildAJEs, ComputeOptions,
  buildIncomeMatrix, buildFxSchedule, buildInvestmentRecon, buildCashRecon,
} from "./compute";
import { formatTbAccount } from "./coa";

export function exportWorkbook(opts: ComputeOptions) {
  const { schedules } = compute(opts);
  const ajes = buildAJEs(schedules, opts);
  const income = buildIncomeMatrix();
  const fx = buildFxSchedule();
  const invRecon = buildInvestmentRecon(schedules);
  const cashRecon = buildCashRecon();

  const wb = XLSX.utils.book_new();

  // 1. Sources
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(sources.map((s) => ({
      Label: s.label, Type: s.type, Institution: s.institution,
      "Acct (last 4)": s.accountLast4, Period: `${s.periodStart} → ${s.periodEnd}`,
      Currency: s.currency, Entity: s.entityName,
    }))),
    "1. Sources"
  );

  // 2. Transactions (with status + TB account)
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(currentYearTransactions.map((t) => ({
      ID: t.id, Date: t.date, Source: t.sourceId, Security: t.security, Ticker: t.ticker,
      Type: t.type, Units: t.units, Price: t.price, Gross: t.gross, Fees: t.fees, Net: t.net,
      CCY: t.currency, FX: t.fxRate ?? "",
      Status: t.status ?? "published",
      "TB Account": t.tbAccount ? formatTbAccount(t.tbAccount) : "",
      Notes: t.notes ?? "",
    }))),
    "2. Transactions"
  );

  // 3. WAC Schedules
  const wacRows: any[] = [];
  for (const s of schedules) {
    wacRows.push({ Security: `=== ${s.security} (${s.ticker}) — ${s.key} ===` });
    for (const r of s.rows) {
      wacRows.push({
        Security: s.security, Date: r.date, Type: r.type,
        "Units In": r.unitsIn || "", "Units Out": r.unitsOut || "",
        Price: r.price || "", "Cost In (CAD)": +r.costIn.toFixed(2),
        "Cost Out (CAD)": +r.costOut.toFixed(2),
        "Cum Units": +r.cumUnits.toFixed(4),
        "Cum Cost (CAD)": +r.cumCost.toFixed(2),
        "WAC/Unit": +r.wac.toFixed(4),
        "Realized G/L": r.realizedGL ? +r.realizedGL.toFixed(2) : "",
        Notes: r.notes ?? "",
      });
    }
    wacRows.push({});
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(wacRows), "3. WAC Schedule");

  // 4. Realized Gain/Loss
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(schedules.map((s) => ({
      Security: s.security, Ticker: s.ticker, Source: s.sourceIds.join("/"),
      "Closing Units": s.closingUnits, "WAC Cost (CAD)": +s.closingCostCAD.toFixed(2),
      "FMV (CAD)": +s.fmvCAD.toFixed(2),
      "Realized G/L": +s.realizedGL.toFixed(2),
      "Unrealized G/L": +s.unrealizedGL.toFixed(2),
    }))),
    "4. Realized Gain-Loss"
  );

  // 5. Income & Expenses Matrix
  const incomeRows = income.rows.map((r) => ({
    Security: r.security, Ticker: r.ticker, CCY: r.ccy,
    "Dividend (CAD)": +(r.cells.Dividend?.cad ?? 0).toFixed(2),
    "Interest (CAD)": +(r.cells.Interest?.cad ?? 0).toFixed(2),
    "WHT (CAD)": +(r.cells["Withholding Tax"]?.cad ?? 0).toFixed(2),
    "Fees (CAD)": +(r.cells.Fees?.cad ?? 0).toFixed(2),
    "Other (CAD)": +(r.cells.Other?.cad ?? 0).toFixed(2),
    "Total (CAD)": +r.totalCAD.toFixed(2),
  }));
  incomeRows.push({
    Security: "TOTALS", Ticker: "", CCY: "",
    "Dividend (CAD)": +income.totals.Dividend.toFixed(2),
    "Interest (CAD)": +income.totals.Interest.toFixed(2),
    "WHT (CAD)": +income.totals["Withholding Tax"].toFixed(2),
    "Fees (CAD)": +income.totals.Fees.toFixed(2),
    "Other (CAD)": +income.totals.Other.toFixed(2),
    "Total (CAD)": +(
      income.totals.Dividend + income.totals.Interest + income.totals["Withholding Tax"] +
      income.totals.Fees + income.totals.Other
    ).toFixed(2),
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incomeRows), "5. Income & Expenses");

  // 6. FX Schedule
  const fxRateRows = fx.rates.map((r) => ({
    Currency: r.ccy, Opening: r.opening, Closing: r.closing, Average: r.average, Source: r.rateSource,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fxRateRows), "6a. FX Rates");
  const fxEventRows = fx.events.map((e) => ({
    Date: e.date, Security: e.security, Ticker: e.ticker, CCY: e.ccy,
    "Foreign Amount": +e.foreignAmount.toFixed(2),
    "Rate at Txn": +e.rateAtTxn.toFixed(4),
    "Rate at Acq": +e.rateAtAcq.toFixed(4),
    "Realized FX (CAD)": +e.realizedFxCAD.toFixed(2),
    Notes: e.notes ?? "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fxEventRows), "6b. FX Events");

  // 7. Investment Reconciliation
  const invRows: any[] = [];
  for (const g of invRecon) {
    invRows.push({ Source: `=== ${g.institution} ····${g.last4} (${g.currency}) ===` });
    for (const r of g.positions) {
      invRows.push({
        Source: g.institution, Security: r.security, Ticker: r.ticker, CCY: r.ccy,
        "Units / Schedule": r.perScheduleUnits, "Units / Stmt": r.perStmtUnits, "Δ Units": r.varianceUnits,
        "Cost / Schedule": +r.perScheduleCost.toFixed(2), "Cost / Stmt": +r.perStmtCost.toFixed(2), "Δ Cost": +r.varianceCost.toFixed(2),
        "FMV / Schedule": +r.perScheduleFmv.toFixed(2), "FMV / Stmt": +r.perStmtFmv.toFixed(2), "Δ FMV": +r.varianceFmv.toFixed(2),
        Status: r.pass ? "Pass" : "Variance",
      });
    }
    invRows.push({});
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invRows), "7a. Investment Recon");

  // 7b. Cash Reconciliation
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(cashRecon.map((r) => ({
      Account: `${r.institution} ····${r.last4}`, CCY: r.currency,
      "GL Balance": +r.glBalance.toFixed(2), "Stmt Balance": +r.stmtBalance.toFixed(2),
      Variance: +r.variance.toFixed(2), Status: r.pass ? "Pass" : "Variance",
    }))),
    "7b. Cash Recon"
  );

  // 8. AJEs
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(ajes.map((a) => ({
      Ref: a.ref, Description: a.description, Dr: a.drAccount, Cr: a.crAccount,
      Amount: +a.amount.toFixed(2), Type: a.type, Confidence: a.confidence,
    }))),
    "8. Adjusting Entries"
  );

  XLSX.writeFile(wb, `Luka_Investment_Schedule_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
