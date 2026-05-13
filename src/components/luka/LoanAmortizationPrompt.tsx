import { useState, useRef } from "react";
import { Upload, FileText, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const FIELD_CLS =
  "w-full h-9 text-sm px-3 border border-[#dcdfe4] rounded-[10px] bg-white dark:bg-card text-foreground transition-all duration-200 hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)] focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground";

const SELECT_CLS = cn(FIELD_CLS, "cursor-pointer appearance-none pr-8");

function SelectField({ label, required, options, value, onChange }: {
  label: string; required?: boolean;
  options: string[]; value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex-1 min-w-[140px] max-w-[250px]">
      <label className="block text-xs text-foreground mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)} className={SELECT_CLS}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}

function InputField({ label, required, placeholder, type = "text", value, onChange }: {
  label: string; required?: boolean; placeholder: string;
  type?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex-1 min-w-[120px] max-w-[250px]">
      <label className="block text-xs text-foreground mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={FIELD_CLS}
      />
    </div>
  );
}

interface LoanAmortizationPromptProps {
  onSubmit?: (data: LoanAmortData) => void;
}

export interface LoanAmortData {
  interestRateType: string;
  paymentType: string;
  loanTenure: string;
  principalAmount: string;
  annualInterestRate: string;
  loanStartDate: string;
  paymentFrequency: string;
  firstPaymentDate: string;
  compoundingFrequency: string;
  interestOnlyPeriod: string;
  fixedPaymentAmount: string;
  balloonAmount: string;
  uploadedFile: string | null;
}

const EMPTY: LoanAmortData = {
  interestRateType: "Fixed",
  paymentType: "Blended (Amortizing)",
  loanTenure: "",
  principalAmount: "",
  annualInterestRate: "",
  loanStartDate: "",
  paymentFrequency: "",
  firstPaymentDate: "",
  compoundingFrequency: "",
  interestOnlyPeriod: "",
  fixedPaymentAmount: "",
  balloonAmount: "",
  uploadedFile: null,
};

export function LoanAmortizationPrompt({ onSubmit }: LoanAmortizationPromptProps) {
  const [form, setForm] = useState<LoanAmortData>(EMPTY);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof LoanAmortData) => (v: string) =>
    setForm(f => ({ ...f, [key]: v }));

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (file.type !== "application/pdf") { toast.error("Only PDF files are accepted"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("File must be under 2 MB"); return; }
    setForm(f => ({ ...f, uploadedFile: file.name }));
    toast.success(`"${file.name}" uploaded — auto-filling fields…`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0] ?? null);
  };

  const clearAll = () => setForm(EMPTY);

  const handleSubmit = () => {
    if (!form.principalAmount && !form.uploadedFile) {
      toast.error("Enter a Principal Amount or upload a loan agreement");
      return;
    }
    onSubmit?.(form);
    toast.success("Generating loan amortization schedule…");
  };

  return (
    <div className="border border-border rounded-[12px] bg-background overflow-hidden text-sm">

      {/* Upload zone */}
      <div className="px-5 pt-5 pb-4">
        <p className="text-xs font-semibold text-foreground mb-2">
          Upload Loan Agreement to Auto-Fill
          <span className="text-red-500 ml-0.5">*</span>
        </p>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={cn(
            "relative flex items-center justify-center gap-2 rounded-[10px] border-2 border-dashed cursor-pointer transition-colors py-4",
            dragging ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40 hover:bg-muted/30",
          )}
        >
          <input ref={fileRef} type="file" accept=".pdf" className="hidden"
            onChange={e => handleFile(e.target.files?.[0] ?? null)} />
          {form.uploadedFile ? (
            <div className="flex items-center gap-2 text-xs text-foreground">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-medium">{form.uploadedFile}</span>
              <button onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, uploadedFile: null })); }}
                className="ml-1 hover:text-destructive transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                <span className="text-primary font-medium">Click to upload</span> or drag and drop
                &nbsp;&nbsp;PDF (max. 1 file, max. 2MB)
              </span>
            </>
          )}
        </div>
      </div>

      {/* OR divider */}
      <div className="flex items-center gap-3 px-5 pb-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium">OR</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Manual inputs */}
      <div className="px-5 pb-5 space-y-4">
        <p className="text-sm font-semibold text-foreground">Provide Inputs</p>

        {/* Loan Identification */}
        <div>
          <p className="text-xs italic text-muted-foreground mb-2">Loan Identification:</p>
          <div className="flex flex-wrap gap-3">
            <SelectField label="Interest Rate Type" required
              options={["Fixed", "Variable", "Mixed"]}
              value={form.interestRateType} onChange={set("interestRateType")} />
            <SelectField label="Payment Type" required
              options={["Blended (Amortizing)", "Interest Only", "Principal + Interest", "Balloon", "Custom"]}
              value={form.paymentType} onChange={set("paymentType")} />
            <InputField label="Loan Tenure (in months)" required placeholder="Loan Tenure"
              type="number" value={form.loanTenure} onChange={set("loanTenure")} />
          </div>
        </div>

        {/* Loan Principal & Frequency */}
        <div>
          <p className="text-xs italic text-muted-foreground mb-2">Loan Principal &amp; frequency:</p>
          <div className="flex flex-wrap gap-3">
            <InputField label="Principal Amount" required placeholder="e.g. 500,000"
              value={form.principalAmount} onChange={set("principalAmount")} />
            <InputField label="Annual Interest rate (%)" required placeholder="e.g. 5.25"
              type="number" value={form.annualInterestRate} onChange={set("annualInterestRate")} />
            <InputField label="Loan Start Date" placeholder="MM/DD/YYYY"
              type="date" value={form.loanStartDate} onChange={set("loanStartDate")} />
            <SelectField label="Payment Frequency" required
              options={["", "Monthly", "Semi-monthly", "Bi-weekly", "Weekly", "Quarterly", "Semi-annual", "Annual"]}
              value={form.paymentFrequency} onChange={set("paymentFrequency")} />
          </div>
        </div>

        {/* Payment Structure */}
        <div>
          <p className="text-xs italic text-muted-foreground mb-2">Payment Structure:</p>
          <div className="flex flex-wrap gap-3">
            <InputField label="First Payment Date" placeholder="MM/DD/YYYY"
              type="date" value={form.firstPaymentDate} onChange={set("firstPaymentDate")} />
            <SelectField label="Compounding Frequency"
              options={["", "Monthly", "Semi-annual", "Annual", "Daily", "Continuous"]}
              value={form.compoundingFrequency} onChange={set("compoundingFrequency")} />
            <InputField label="Interest-Only Period (in months)" placeholder="Interest Only Period"
              type="number" value={form.interestOnlyPeriod} onChange={set("interestOnlyPeriod")} />
            <InputField label="Fixed Payment Amount" placeholder="Fixed Payment Amount"
              value={form.fixedPaymentAmount} onChange={set("fixedPaymentAmount")} />
            <InputField label="Balloon Amount" placeholder="Balloon Amount"
              value={form.balloonAmount} onChange={set("balloonAmount")} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={clearAll}
            className="h-9 px-5 rounded-[10px] border border-border bg-background text-sm text-foreground hover:bg-muted transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleSubmit}
            className="h-9 px-5 rounded-[10px] bg-muted text-sm text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors font-medium disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
