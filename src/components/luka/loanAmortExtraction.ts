// ─── Mock document extraction for the Loan Amortization prototype ────────────
// Real extraction is backend work; these cases demo every state of the review step.
import type { LoanAmortData } from "./LoanAmortizationPrompt";

export type FieldStatus = "found" | "inferred" | "missing";
export interface FieldMeta { status: FieldStatus; note?: string }
export type FieldMetaMap = Partial<Record<keyof LoanAmortData, FieldMeta>>;

export interface ExtractedLoan { id: string; label: string; sub: string; data: LoanAmortData; meta: FieldMetaMap }
export type ExtractionResult =
  | { kind: "loans"; loans: ExtractedLoan[] }               // 1 loan → straight to review; 2+ → pick one
  | { kind: "wrong-type"; detectedAs: string };             // no loan terms in the file

export const EMPTY_LOAN: LoanAmortData = {
  loanName: "", lender: "", loanType: "Term", interestRateType: "Fixed", paymentType: "Blended (Amortizing)",
  loanTenure: "", currency: "CAD", principalAmount: "", annualInterestRate: "", dayCountBasis: "ACT/365",
  loanStartDate: "", maturityDate: "", paymentFrequency: "", firstPaymentDate: "", compoundingFrequency: "",
  interestOnlyPeriod: "", fixedPaymentAmount: "", balloonAmount: "", uploadedFile: null,
  tbLoanAccount: "", tbInterestAccount: "",
};

const found = (note: string): FieldMeta => ({ status: "found", note });
const inferred = (note: string): FieldMeta => ({ status: "inferred", note });
const missing: FieldMeta = { status: "missing" };

/** Fishin' Hole promissory note: partial extraction (tenure + first payment missing). Ties to CaseWare R4. */
function promissoryNote(file: string): ExtractionResult {
  return { kind: "loans", loans: [{
    id: "pn", label: "Promissory note", sub: "", data: {
      ...EMPTY_LOAN, loanName: "Promissory note", principalAmount: "400,000", annualInterestRate: "4",
      loanStartDate: "2024-10-01", maturityDate: "2032-09-30", paymentFrequency: "Monthly",
      compoundingFrequency: "Monthly", uploadedFile: file,
    },
    meta: {
      loanName: found("p.1"), interestRateType: found("p.1, s.2"), paymentType: found("p.1, s.3 'blended payments'"),
      principalAmount: found("p.1, net of $360,000 paid on signing"), annualInterestRate: found("p.1, s.2"),
      loanStartDate: found("p.1"), maturityDate: found("p.2, s.4"), paymentFrequency: found("p.1, s.3"),
      compoundingFrequency: inferred("Not stated; assumed same as payment frequency"),
      dayCountBasis: inferred("Not stated; Canadian default"),
      loanTenure: missing, firstPaymentDate: missing,
    },
  }]};
}

/** R1.1 debt schedule: two loans, all key terms present. */
function debtSchedule(file: string): ExtractionResult {
  const base = (n: number): ExtractedLoan => ({
    id: `ds-${n}`, label: `Promissory note ${n}`, sub: "$400,000 · 4.00% · $4,875.49 monthly · matures Sep 30, 2032",
    data: {
      ...EMPTY_LOAN, loanName: `Promissory note ${n}`, principalAmount: "400,000", annualInterestRate: "4",
      firstPaymentDate: "2024-10-31", maturityDate: "2032-09-30", paymentFrequency: "Monthly",
      loanTenure: "96", uploadedFile: file,
    },
    meta: {
      loanName: found("Row " + n), principalAmount: found("Additions during year"), annualInterestRate: found("Interest rate"),
      firstPaymentDate: found("Start date"), maturityDate: found("Maturity date"), paymentType: found("Blended payment of $4,875.49"),
      paymentFrequency: inferred("Derived from payment amount and term"),
      loanTenure: inferred("Counted from first payment (Oct 31, 2024) to maturity (Sep 30, 2032)"),
      loanStartDate: missing, lender: missing,
    },
  });
  return { kind: "loans", loans: [base(1), base(2)] };
}

/** RBC Term Loan A agreement: everything found. */
function rbcAgreement(file: string): ExtractionResult {
  return { kind: "loans", loans: [{
    id: "rbc", label: "Term Loan A", sub: "", data: {
      ...EMPTY_LOAN, loanName: "Term Loan A", lender: "Royal Bank of Canada", principalAmount: "5,000,000",
      annualInterestRate: "5.25", loanTenure: "60", loanStartDate: "2022-01-15", firstPaymentDate: "2022-02-15",
      maturityDate: "2027-01-15", paymentFrequency: "Monthly", compoundingFrequency: "Monthly", uploadedFile: file,
    },
    meta: Object.fromEntries(
      ["loanName","lender","interestRateType","paymentType","principalAmount","annualInterestRate","loanTenure",
       "loanStartDate","firstPaymentDate","maturityDate","paymentFrequency","compoundingFrequency","dayCountBasis","currency"]
        .map(k => [k, found("Schedule A")])) as FieldMetaMap,
  }]};
}

/** Routes a document to a demo case by name (prototype only). */
export function mockExtract(fileName: string): ExtractionResult {
  const n = fileName.toLowerCase();
  if (/bank|statement|invoice|receipt/.test(n)) return { kind: "wrong-type", detectedAs: "a bank statement" };
  if (/schedule|register|r1\.1/.test(n)) return debtSchedule(fileName);
  if (/rbc|term loan a/.test(n)) return rbcAgreement(fileName);
  return promissoryNote(fileName);
}
