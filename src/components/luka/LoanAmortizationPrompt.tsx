import { useMemo, useState } from "react";
import { ChevronDown, CheckCircle2, AlertTriangle, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { FREQ, type Frequency } from "@/lib/loanAmortEngine";
import type { FieldMetaMap } from "./loanAmortExtraction";

// Field set mirrors current prod. loanName/lender/currency/dayCount/maturity are kept on the type
// (filled by extraction, used in chat copy and the engine default) but not rendered.
export interface LoanAmortData {
  loanName: string; lender: string; loanType: string; interestRateType: string; paymentType: string;
  loanTenure: string; currency: string; principalAmount: string; annualInterestRate: string; dayCountBasis: string;
  loanStartDate: string; maturityDate: string; paymentFrequency: string; firstPaymentDate: string;
  compoundingFrequency: string; interestOnlyPeriod: string; fixedPaymentAmount: string; balloonAmount: string;
  uploadedFile: string | null;
  tbLoanAccount?: string; tbInterestAccount?: string;
}
type Key = keyof LoanAmortData;

export const PAYMENT_TYPES = ["Blended (Amortizing)", "Principal + Interest", "Interest Only", "Balloon", "Fixed Payment"];
const LABELS: Partial<Record<Key, string>> = {
  interestRateType: "Interest Rate Type", paymentType: "Payment Type", loanTenure: "Loan Tenure",
  principalAmount: "Principal Amount", annualInterestRate: "Annual Interest rate", paymentFrequency: "Payment Frequency",
  firstPaymentDate: "First Payment Date", fixedPaymentAmount: "Fixed Payment Amount", balloonAmount: "Balloon Amount",
};
const REQUIRED: Key[] = ["interestRateType", "paymentType", "loanTenure", "principalAmount", "annualInterestRate", "paymentFrequency", "firstPaymentDate"];
const VISIBLE: Key[] = ["interestRateType", "paymentType", "loanTenure", "principalAmount", "annualInterestRate", "loanStartDate",
  "paymentFrequency", "firstPaymentDate", "compoundingFrequency", "interestOnlyPeriod", "fixedPaymentAmount", "balloonAmount"];

const num = (s?: string) => parseFloat((s || "").replace(/[,$\s]/g, ""));
const fixedEnabled = (t: string) => t === "Fixed Payment";
const balloonEnabled = (t: string) => t === "Balloon";

export function validateLoan(f: LoanAmortData) {
  const errors: Partial<Record<Key, string>> = {};
  const warnings: Partial<Record<Key, string>> = {};
  REQUIRED.forEach(k => { if (!String(f[k] ?? "").trim()) errors[k] = "Required"; });
  if (fixedEnabled(f.paymentType) && !f.fixedPaymentAmount) errors.fixedPaymentAmount = "Required for Fixed Payment";
  if (balloonEnabled(f.paymentType) && !f.balloonAmount) errors.balloonAmount = "Required for Balloon";

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

  if (f.interestOnlyPeriod && tenure > 0 && num(f.interestOnlyPeriod) >= tenure) errors.interestOnlyPeriod = "Must be shorter than the loan tenure";
  if (f.loanStartDate && f.firstPaymentDate && f.firstPaymentDate < f.loanStartDate) errors.firstPaymentDate = "Can't be before the loan start date";
  if (balloonEnabled(f.paymentType) && f.balloonAmount && f.principalAmount && num(f.balloonAmount) >= num(f.principalAmount))
    errors.balloonAmount = "Must be less than the principal";
  return { errors, warnings };
}

const FIELD = "w-full h-10 text-sm px-3 border rounded-[8px] bg-white dark:bg-card text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed disabled:border-transparent";

export interface TBOption { code: string; description: string }

interface Props {
  initial: LoanAmortData;
  meta?: FieldMetaMap;           // present when values came from a document
  tbAccounts?: TBOption[];       // present when an engagement is selected (prod shows the TB selects then)
  onSubmit: (data: LoanAmortData) => void;
}

export function LoanAmortizationPrompt({ initial, meta, tbAccounts, onSubmit }: Props) {
  const [form, setForm] = useState<LoanAmortData>(initial);
  const [edited, setEdited] = useState<Set<Key>>(new Set());
  const [touched, setTouched] = useState<Set<Key>>(new Set());
  const [attempted, setAttempted] = useState(false);

  const { errors, warnings } = useMemo(() => validateLoan(form), [form]);
  const missingRequired = (Object.keys(errors) as Key[]).filter(k => errors[k]?.startsWith("Required"));
  const blocking = Object.keys(errors).length > 0;

  const set = (k: Key) => (v: string) => {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === "paymentType") {                       // clear amounts that no longer apply
        if (!fixedEnabled(v)) next.fixedPaymentAmount = "";
        if (!balloonEnabled(v)) next.balloonAmount = "";
      }
      return next;
    });
    setEdited(s => new Set(s).add(k));
  };
  const blur = (k: Key) => () => setTouched(s => new Set(s).add(k));

  const stateOf = (k: Key) => {
    const m = meta?.[k];
    const showErr = errors[k] && (attempted || touched.has(k) || (m?.status === "missing" && !edited.has(k)));
    if (showErr) return { tone: "error" as const, text: m?.status === "missing" && errors[k] === "Required" ? "Not found in document. Please enter" : errors[k]! };
    if (warnings[k]) return { tone: "warn" as const, text: warnings[k]! };
    if (m && !edited.has(k)) {
      if (m.status === "inferred") return { tone: "warn" as const, text: `Inferred: ${m.note}` };
      if (m.status === "found") return { tone: "found" as const, text: m.note ? `From document · ${m.note}` : "From document" };
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
    const Icon = s.tone === "error" ? AlertCircle : s.tone === "warn" ? AlertTriangle : CheckCircle2;
    return (
      <p className={cn("mt-1 text-[11px] leading-snug flex items-start gap-1",
        s.tone === "error" && "text-red-600", s.tone === "warn" && "text-amber-700 dark:text-amber-400", s.tone === "found" && "text-green-700 dark:text-green-400")}>
        <Icon className="h-3 w-3 mt-[1px] shrink-0" /><span>{s.text}</span>
      </p>
    );
  };
  const label = (k: Key, text: string) => (
    <label className="block text-xs font-medium text-foreground mb-1">
      {text}{(REQUIRED.includes(k) || (k === "fixedPaymentAmount" && fixedEnabled(form.paymentType)) || (k === "balloonAmount" && balloonEnabled(form.paymentType)))
        && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
  const input = ({ k, label: text, placeholder, type = "text", disabled, width = "w-[200px]" }:
    { k: Key; label: string; placeholder?: string; type?: string; disabled?: boolean; width?: string }) => (
    <div className={width}>
      {label(k, text)}
      <input type={type} placeholder={placeholder} value={(form[k] as string) ?? ""} disabled={disabled}
        onChange={e => set(k)(e.target.value)} onBlur={blur(k)} className={cn(FIELD, !disabled && border(k))} />
      {!disabled && hint(k)}
    </div>
  );
  const select = ({ k, label: text, options, placeholder, width = "w-[250px]" }:
    { k: Key; label: string; options: string[]; placeholder?: string; width?: string }) => (
    <div className={width}>
      {label(k, text)}
      <div className="relative">
        <select value={(form[k] as string) ?? ""} onChange={e => set(k)(e.target.value)} onBlur={blur(k)}
          className={cn(FIELD, "cursor-pointer appearance-none pr-8", border(k), !form[k] && "text-muted-foreground")}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
      {hint(k)}
    </div>
  );
  const tbSelect = (k: "tbLoanAccount" | "tbInterestAccount", text: string) => (
    <div className="w-[300px]">
      <label className="block text-xs font-medium text-foreground mb-1">{text}</label>
      <div className="relative">
        <select value={form[k] ?? ""} onChange={e => set(k)(e.target.value)}
          className={cn(FIELD, "cursor-pointer appearance-none pr-8 border-[#dcdfe4]", !form[k] && "text-muted-foreground")}>
          <option value="">Select Account</option>
          {tbAccounts!.map(a => <option key={a.code} value={a.code}>{a.code} – {a.description}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );

  const visibleMeta = meta ? VISIBLE.filter(k => meta[k]) : [];
  const foundCount = visibleMeta.filter(k => meta![k]!.status !== "missing").length;
  const inferredCount = visibleMeta.filter(k => meta![k]!.status === "inferred" && !edited.has(k)).length;
  const needInput = missingRequired.length;

  const clearAll = () => {
    setForm(f => ({ ...f, interestRateType: "Fixed", paymentType: "Blended (Amortizing)", loanTenure: "", principalAmount: "",
      annualInterestRate: "", loanStartDate: "", paymentFrequency: "", firstPaymentDate: "", compoundingFrequency: "",
      interestOnlyPeriod: "", fixedPaymentAmount: "", balloonAmount: "", tbLoanAccount: "", tbInterestAccount: "" }));
    setEdited(new Set(VISIBLE)); setTouched(new Set()); setAttempted(false);
  };
  const handleSubmit = () => { setAttempted(true); if (!blocking) onSubmit(form); };

  return (
    <div className="text-sm space-y-5">
      {meta && form.uploadedFile && (
        <div className={cn("rounded-[10px] border px-3 py-2.5 flex items-start gap-2.5",
          needInput ? "border-red-200 bg-red-50/60 dark:bg-red-950/20 dark:border-red-900" : "border-green-200 bg-green-50/60 dark:bg-green-950/20 dark:border-green-900")}>
          <FileText className={cn("h-4 w-4 mt-0.5 shrink-0", needInput ? "text-red-600" : "text-green-700")} />
          <div className="text-[13px] leading-relaxed text-foreground">
            I read <strong>{form.uploadedFile}</strong> and filled {foundCount} field{foundCount === 1 ? "" : "s"}.{" "}
            {needInput > 0 ? <>I couldn't find <strong>{needInput} required field{needInput === 1 ? "" : "s"}</strong>, highlighted in red.</> : <>All required fields are filled.</>}
            {inferredCount > 0 && <> {inferredCount} value{inferredCount === 1 ? " is" : "s are"} inferred (amber). Please confirm.</>}
          </div>
        </div>
      )}

      <p className="text-sm font-semibold text-foreground">Provide Inputs</p>

      <div>
        <p className="text-sm italic font-medium text-foreground mb-2">Loan Identification:</p>
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          {tbAccounts && tbSelect("tbLoanAccount", "Please select Trial balance account")}
          {tbAccounts && tbSelect("tbInterestAccount", "Please select Interest account")}
          {select({ k: "interestRateType", label: "Interest Rate Type", options: ["Fixed", "Variable"] })}
          {select({ k: "paymentType", label: "Payment Type", options: PAYMENT_TYPES })}
          {input({ k: "loanTenure", label: "Loan Tenure (In months)", placeholder: "Loan Tenure", type: "number" })}
        </div>
      </div>

      <div>
        <p className="text-sm italic font-medium text-foreground mb-2">Loan Principal &amp; frequency:</p>
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          {input({ k: "principalAmount", label: "Principal Amount" })}
          {input({ k: "annualInterestRate", label: "Annual Interest rate (%)" })}
          {input({ k: "loanStartDate", label: "Loan Start Date", type: "date", width: "w-[250px]" })}
          {select({ k: "paymentFrequency", label: "Payment Frequency", options: ["Monthly", "Quarterly", "Semi-annual", "Annual", "Bi-weekly", "Weekly"], placeholder: "Frequency" })}
        </div>
      </div>

      <div>
        <p className="text-sm italic font-medium text-foreground mb-2">Payment Structure:</p>
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          {input({ k: "firstPaymentDate", label: "First Payment Date", type: "date", width: "w-[250px]" })}
          {select({ k: "compoundingFrequency", label: "Compounding Frequency", options: ["Monthly", "Quarterly", "Semi-annual", "Annual", "Daily"], placeholder: "Compounding" })}
          {input({ k: "interestOnlyPeriod", label: "Interest-Only Period (In months)", placeholder: "Interest Only Period", type: "number", width: "w-[250px]" })}
          {input({ k: "fixedPaymentAmount", label: "Fixed Payment Amount", placeholder: "Fixed Payment Amount", disabled: !fixedEnabled(form.paymentType) })}
          {input({ k: "balloonAmount", label: "Balloon Amount", placeholder: "Balloon Amount", disabled: !balloonEnabled(form.paymentType) })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button onClick={clearAll}
          className="h-10 w-[180px] rounded-[8px] border border-border bg-muted/40 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
          Clear All
        </button>
        <button onClick={handleSubmit} disabled={attempted && blocking}
          className={cn("h-10 w-[180px] rounded-[8px] text-sm font-semibold transition-colors",
            blocking ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:bg-primary/90")}>
          Submit
        </button>
        {needInput > 0
          ? <span className="text-[12px] text-muted-foreground">Fill {needInput} required field{needInput === 1 ? "" : "s"}: {missingRequired.map(k => LABELS[k]).join(", ")}</span>
          : blocking ? <span className="text-[12px] text-muted-foreground">Fix the highlighted fields to continue</span> : null}
      </div>
    </div>
  );
}
