import { useMemo, useState } from "react";
import { ChevronDown, CheckCircle2, AlertTriangle, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { FREQ, impliedTenureMonths, type Frequency } from "@/lib/loanAmortEngine";
import type { FieldMetaMap } from "./loanAmortExtraction";

export interface LoanAmortData {
  loanName: string; lender: string; loanType: string; interestRateType: string; paymentType: string;
  loanTenure: string; currency: string; principalAmount: string; annualInterestRate: string; dayCountBasis: string;
  loanStartDate: string; maturityDate: string; paymentFrequency: string; firstPaymentDate: string;
  compoundingFrequency: string; interestOnlyPeriod: string; fixedPaymentAmount: string; balloonAmount: string;
  uploadedFile: string | null;
}
type Key = keyof LoanAmortData;

const LABELS: Partial<Record<Key, string>> = {
  loanName: "Loan Name", interestRateType: "Interest Rate Type", paymentType: "Payment Type", loanTenure: "Loan Tenure",
  currency: "Currency", principalAmount: "Principal Amount", annualInterestRate: "Annual Interest Rate",
  paymentFrequency: "Payment Frequency", firstPaymentDate: "First Payment Date",
};
const REQUIRED: Key[] = ["loanName", "interestRateType", "paymentType", "loanTenure", "currency",
  "principalAmount", "annualInterestRate", "paymentFrequency", "firstPaymentDate"];

const num = (s: string) => parseFloat((s || "").replace(/[,$\s]/g, ""));

/** Inline validation. Returns per-field errors and warnings. */
export function validateLoan(f: LoanAmortData) {
  const errors: Partial<Record<Key, string>> = {};
  const warnings: Partial<Record<Key, string>> = {};
  REQUIRED.forEach(k => { if (!String(f[k] ?? "").trim()) errors[k] = "Required"; });

  if (f.principalAmount && !(num(f.principalAmount) > 0)) errors.principalAmount = "Enter an amount greater than 0";
  const rate = num(f.annualInterestRate);
  if (f.annualInterestRate && (isNaN(rate) || rate < 0 || rate > 100)) errors.annualInterestRate = "Enter a rate between 0 and 100";

  const tenure = num(f.loanTenure);
  const freq = FREQ[f.paymentFrequency as Frequency];
  if (f.loanTenure && !(tenure > 0)) errors.loanTenure = "Enter a whole number of months";
  else if (f.loanTenure && freq?.months && tenure < freq.months)
    errors.loanTenure = `${tenure} month${tenure === 1 ? "" : "s"} is shorter than one ${f.paymentFrequency.toLowerCase()} payment period (${freq.months} months)`;
  else if (f.loanTenure && freq?.months && tenure % freq.months !== 0)
    warnings.loanTenure = `Not a multiple of ${freq.months} months; the last partial period will be dropped`;

  const io = num(f.interestOnlyPeriod);
  if (f.interestOnlyPeriod && tenure > 0 && io >= tenure) errors.interestOnlyPeriod = "Must be shorter than the loan tenure";

  if (f.loanStartDate && f.firstPaymentDate && f.firstPaymentDate < f.loanStartDate)
    errors.firstPaymentDate = "Can't be before the loan start date";
  if (f.maturityDate && f.firstPaymentDate && f.maturityDate < f.firstPaymentDate)
    errors.maturityDate = "Can't be before the first payment date";

  if (f.paymentType === "Balloon" && !f.balloonAmount) errors.balloonAmount = "Required for Balloon payment type";
  if (f.balloonAmount && f.principalAmount && num(f.balloonAmount) >= num(f.principalAmount))
    errors.balloonAmount = "Must be less than the principal";

  return { errors, warnings };
}

const FIELD = "w-full h-9 text-sm px-3 border rounded-[10px] bg-white dark:bg-card text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground";

interface Props {
  initial: LoanAmortData;
  meta?: FieldMetaMap;          // present when values came from a document
  submitLabel?: string;
  onSubmit: (data: LoanAmortData) => void;
}

export function LoanAmortizationPrompt({ initial, meta, submitLabel = "Generate schedule", onSubmit }: Props) {
  const [form, setForm] = useState<LoanAmortData>(initial);
  const [edited, setEdited] = useState<Set<Key>>(new Set());
  const [touched, setTouched] = useState<Set<Key>>(new Set());
  const [attempted, setAttempted] = useState(false);

  const { errors, warnings } = useMemo(() => validateLoan(form), [form]);
  const missingRequired = REQUIRED.filter(k => errors[k] === "Required");
  const blocking = Object.keys(errors).length > 0;

  const implied = useMemo(() => impliedTenureMonths(form.firstPaymentDate, form.maturityDate, form.paymentFrequency as Frequency),
    [form.firstPaymentDate, form.maturityDate, form.paymentFrequency]);
  const tenureMismatch = implied && form.loanTenure && implied !== num(form.loanTenure);

  const set = (k: Key) => (v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setEdited(s => new Set(s).add(k));
  };
  const blur = (k: Key) => () => setTouched(s => new Set(s).add(k));

  // Field state: extraction status first, then validation
  const stateOf = (k: Key) => {
    const m = meta?.[k];
    const showErr = errors[k] && (attempted || touched.has(k) || (m?.status === "missing" && !edited.has(k)));
    if (showErr) return { tone: "error" as const, text: m?.status === "missing" && errors[k] === "Required" ? "Not found in document. Please enter" : errors[k]! };
    if (warnings[k]) return { tone: "warn" as const, text: warnings[k]! };
    if (m && !edited.has(k)) {
      if (m.status === "inferred") return { tone: "warn" as const, text: `Inferred: ${m.note}` };
      if (m.status === "found") return { tone: "found" as const, text: m.note ? `From document · ${m.note}` : "From document" };
      if (m.status === "missing") return { tone: "muted" as const, text: "Not in document" };
    }
    return null;
  };

  const border = (k: Key) => {
    const s = stateOf(k);
    return s?.tone === "error" ? "border-red-500 bg-red-50/40 dark:bg-red-950/20"
      : s?.tone === "warn" ? "border-amber-400"
      : "border-[#dcdfe4] dark:border-[hsl(220_15%_30%)] hover:border-[hsl(210_25%_75%)]";
  };

  const hint = (k: Key) => {
    const s = stateOf(k);
    if (!s) return null;
    const Icon = s.tone === "error" ? AlertCircle : s.tone === "warn" ? AlertTriangle : s.tone === "found" ? CheckCircle2 : null;
    return (
      <p className={cn("mt-1 text-[11px] leading-snug flex items-start gap-1",
        s.tone === "error" && "text-red-600", s.tone === "warn" && "text-amber-700 dark:text-amber-400",
        s.tone === "found" && "text-green-700 dark:text-green-400", s.tone === "muted" && "text-muted-foreground")}>
        {Icon && <Icon className="h-3 w-3 mt-[1px] shrink-0" />}<span>{s.text}</span>
      </p>
    );
  };

  const label = (k: Key, text: string) => (
    <label className="block text-xs text-foreground mb-1">
      {text}{REQUIRED.includes(k) && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );

  const input = ({ k, label: text, placeholder, type = "text" }: { k: Key; label: string; placeholder?: string; type?: string }) => (
    <div className="flex-1 min-w-[150px] max-w-[250px]">
      {label(k, text)}
      <input type={type} placeholder={placeholder} value={form[k] ?? ""} onChange={e => set(k)(e.target.value)} onBlur={blur(k)}
        className={cn(FIELD, border(k))} />
      {hint(k)}
    </div>
  );

  const select = ({ k, label: text, options }: { k: Key; label: string; options: string[] }) => (
    <div className="flex-1 min-w-[150px] max-w-[250px]">
      {label(k, text)}
      <div className="relative">
        <select value={form[k] ?? ""} onChange={e => set(k)(e.target.value)} onBlur={blur(k)}
          className={cn(FIELD, "cursor-pointer appearance-none pr-8", border(k), !form[k] && "text-muted-foreground")}>
          {options.map(o => <option key={o} value={o}>{o || "Select"}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      </div>
      {hint(k)}
    </div>
  );

  // Extraction banner counts
  const metaEntries = meta ? Object.entries(meta) : [];
  const foundCount = metaEntries.filter(([, m]) => m?.status !== "missing").length;
  const needInput = missingRequired.length;
  const inferredCount = metaEntries.filter(([k, m]) => m?.status === "inferred" && !edited.has(k as Key)).length;

  const handleSubmit = () => {
    setAttempted(true);
    if (!blocking) onSubmit(form);
  };

  return (
    <div className="text-sm space-y-4">
      {meta && form.uploadedFile && (
        <div className={cn("rounded-[10px] border px-3 py-2.5 flex items-start gap-2.5",
          needInput ? "border-red-200 bg-red-50/60 dark:bg-red-950/20 dark:border-red-900" : "border-green-200 bg-green-50/60 dark:bg-green-950/20 dark:border-green-900")}>
          <FileText className={cn("h-4 w-4 mt-0.5 shrink-0", needInput ? "text-red-600" : "text-green-700")} />
          <div className="text-[13px] leading-relaxed text-foreground">
            I read <strong>{form.uploadedFile}</strong> and filled {foundCount} field{foundCount === 1 ? "" : "s"}.{" "}
            {needInput > 0
              ? <>I couldn't find <strong>{needInput} required field{needInput === 1 ? "" : "s"}</strong>, highlighted in red.</>
              : <>All required fields are filled.</>}
            {inferredCount > 0 && <> {inferredCount} value{inferredCount === 1 ? " is" : "s are"} inferred (amber). Please confirm.</>}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs italic text-muted-foreground mb-2">Loan identification</p>
        <div className="flex flex-wrap gap-3">
          {input({ k: "loanName", label: "Loan Name", placeholder: "e.g. Term Loan A" })}
          {input({ k: "lender", label: "Lender", placeholder: "e.g. Royal Bank of Canada" })}
          {select({ k: "loanType", label: "Loan Type", options: ["Term", "LOC", "Revolver", "Mortgage", "Bridge"] })}
          {select({ k: "interestRateType", label: "Interest Rate Type", options: ["Fixed", "Variable", "Mixed"] })}
          {select({ k: "paymentType", label: "Payment Type", options: ["Blended (Amortizing)", "Interest Only", "Principal + Interest", "Balloon"] })}
        </div>
      </div>

      <div>
        <p className="text-xs italic text-muted-foreground mb-2">Principal, rate and term</p>
        <div className="flex flex-wrap gap-3">
          {select({ k: "currency", label: "Currency", options: ["CAD", "USD", "EUR", "GBP"] })}
          {input({ k: "principalAmount", label: "Principal Amount", placeholder: "e.g. 500,000" })}
          {input({ k: "annualInterestRate", label: "Annual Interest Rate (%)", placeholder: "e.g. 5.25" })}
          {select({ k: "dayCountBasis", label: "Day Count Basis", options: ["ACT/365", "ACT/360", "30/360"] })}
          {input({ k: "loanStartDate", label: "Loan Start Date", type: "date" })}
          {input({ k: "maturityDate", label: "Maturity Date", type: "date" })}
        </div>
      </div>

      <div>
        <p className="text-xs italic text-muted-foreground mb-2">Payment structure</p>
        <div className="flex flex-wrap gap-3">
          {select({ k: "paymentFrequency", label: "Payment Frequency", options: ["", "Monthly", "Quarterly", "Semi-annual", "Annual", "Bi-weekly", "Weekly"] })}
          {input({ k: "firstPaymentDate", label: "First Payment Date", type: "date" })}
          <div className="flex-1 min-w-[150px] max-w-[250px]">
            {label("loanTenure", "Loan Tenure (in months)")}
            <input type="number" placeholder="e.g. 60" value={form.loanTenure} onChange={e => set("loanTenure")(e.target.value)} onBlur={blur("loanTenure")}
              className={cn(FIELD, border("loanTenure"))} />
            {hint("loanTenure")}
            {implied && (!form.loanTenure || tenureMismatch) && (
              <button type="button" onClick={() => set("loanTenure")(String(implied))}
                className="mt-1 text-[11px] text-primary hover:underline text-left">
                {tenureMismatch ? `Dates imply ${implied} months. Use ${implied}` : `Use ${implied} months (first payment to maturity)`}
              </button>
            )}
          </div>
          {select({ k: "compoundingFrequency", label: "Compounding Frequency", options: ["", "Monthly", "Quarterly", "Semi-annual", "Annual", "Daily"] })}
          {input({ k: "interestOnlyPeriod", label: "Interest-Only Period (in months)", placeholder: "e.g. 12", type: "number" })}
          {input({ k: "fixedPaymentAmount", label: "Fixed Payment Amount", placeholder: "Calculated if blank" })}
          {form.paymentType === "Balloon" && input({ k: "balloonAmount", label: "Balloon Amount", placeholder: "e.g. 100,000" })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-[12px] text-muted-foreground">
          {needInput > 0
            ? <>Fill {needInput} required field{needInput === 1 ? "" : "s"}: {missingRequired.map(k => LABELS[k]).join(", ")}</>
            : blocking ? "Fix the highlighted fields to continue" : ""}
        </p>
        <button onClick={handleSubmit} disabled={attempted && blocking}
          className={cn("inline-flex items-center gap-2 h-8 px-4 text-base font-medium rounded-[8px] transition-colors shrink-0",
            blocking ? "bg-primary/40 text-primary-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:bg-primary/90")}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
