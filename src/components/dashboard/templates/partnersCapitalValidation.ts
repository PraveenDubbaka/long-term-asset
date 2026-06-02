import { z } from "zod";
import type { PartnersCapitalSettings } from "@/components/dashboard/workspace/LayoutSettingsContext";

/**
 * Validation rules for the Partners' Capital "Template Settings" panel.
 *
 * These rules block saving when:
 *  - Number of Partners < 2 (or > 500 — defensive upper bound)
 *  - Layout Mode is "auto" AND a custom threshold is out of its allowed range:
 *      • Columns → Rows threshold must be 2..100
 *      • Rows → Class Summary threshold must be 3..500 AND > Columns→Rows threshold
 *
 * Field error keys are stable identifiers consumed by the inline panel to
 * highlight the offending control.
 */

export type PartnersCapitalFieldKey =
  | "partnerCount"
  | "autoSwitchColumnsToRows"
  | "autoSwitchRowsToClassSummary";

export interface PartnersCapitalValidationResult {
  valid: boolean;
  /** Map of field key -> human-readable error message. */
  fieldErrors: Partial<Record<PartnersCapitalFieldKey, string>>;
  /** Flat list of error messages for toast/summary display. */
  messages: string[];
}

const PARTNER_COUNT_MIN = 2;
const PARTNER_COUNT_MAX = 500;
const COLS_TO_ROWS_MIN = 2;
const COLS_TO_ROWS_MAX = 100;
const ROWS_TO_CLASS_MIN = 3;
const ROWS_TO_CLASS_MAX = 500;

/** Base zod schema — runs first for type/range checks. */
const partnersCapitalSchema = z
  .object({
    partnerCount: z
      .number({ invalid_type_error: "Number of Partners must be a number" })
      .int({ message: "Number of Partners must be a whole number" })
      .min(PARTNER_COUNT_MIN, {
        message: `Number of Partners must be at least ${PARTNER_COUNT_MIN}`,
      })
      .max(PARTNER_COUNT_MAX, {
        message: `Number of Partners must be at most ${PARTNER_COUNT_MAX}`,
      }),
    layoutMode: z.enum(["auto", "forceColumns", "forceRows", "forceClassSummary"]),
    autoSwitchColumnsToRows: z
      .number({ invalid_type_error: "Columns → Rows threshold must be a number" })
      .int({ message: "Columns → Rows threshold must be a whole number" }),
    autoSwitchRowsToClassSummary: z
      .number({ invalid_type_error: "Rows → Class Summary threshold must be a number" })
      .int({ message: "Rows → Class Summary threshold must be a whole number" }),
  })
  .superRefine((val, ctx) => {
    // Threshold range checks only apply when Auto layout is selected.
    if (val.layoutMode !== "auto") return;

    if (
      val.autoSwitchColumnsToRows < COLS_TO_ROWS_MIN ||
      val.autoSwitchColumnsToRows > COLS_TO_ROWS_MAX
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["autoSwitchColumnsToRows"],
        message: `Custom value must be between ${COLS_TO_ROWS_MIN} and ${COLS_TO_ROWS_MAX}`,
      });
    }
    if (
      val.autoSwitchRowsToClassSummary < ROWS_TO_CLASS_MIN ||
      val.autoSwitchRowsToClassSummary > ROWS_TO_CLASS_MAX
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["autoSwitchRowsToClassSummary"],
        message: `Custom value must be between ${ROWS_TO_CLASS_MIN} and ${ROWS_TO_CLASS_MAX}`,
      });
    }
    // Logical ordering: rows→class threshold must be greater than columns→rows
    if (
      val.autoSwitchColumnsToRows >= COLS_TO_ROWS_MIN &&
      val.autoSwitchRowsToClassSummary >= ROWS_TO_CLASS_MIN &&
      val.autoSwitchRowsToClassSummary <= val.autoSwitchColumnsToRows
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["autoSwitchRowsToClassSummary"],
        message: "Rows → Class Summary threshold must be greater than Columns → Rows threshold",
      });
    }
  });

export function validatePartnersCapital(
  pc: PartnersCapitalSettings,
): PartnersCapitalValidationResult {
  const result = partnersCapitalSchema.safeParse({
    partnerCount: pc.partnerCount,
    layoutMode: pc.layoutMode,
    autoSwitchColumnsToRows: pc.autoSwitchColumnsToRows,
    autoSwitchRowsToClassSummary: pc.autoSwitchRowsToClassSummary,
  });

  if (result.success) {
    return { valid: true, fieldErrors: {}, messages: [] };
  }

  const fieldErrors: Partial<Record<PartnersCapitalFieldKey, string>> = {};
  const messages: string[] = [];
  for (const issue of result.error.issues) {
    const key = issue.path[0] as PartnersCapitalFieldKey | undefined;
    if (key && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
    messages.push(issue.message);
  }
  return { valid: false, fieldErrors, messages };
}

export const partnersCapitalLimits = {
  partnerCount: { min: PARTNER_COUNT_MIN, max: PARTNER_COUNT_MAX },
  columnsToRows: { min: COLS_TO_ROWS_MIN, max: COLS_TO_ROWS_MAX },
  rowsToClassSummary: { min: ROWS_TO_CLASS_MIN, max: ROWS_TO_CLASS_MAX },
};
