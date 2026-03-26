import { useState, useRef } from "react";
import { Upload, X, FileText, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/wp-ui/button";
import { cn } from "@/lib/utils";
import type { Loan } from "@/types";

function LukaIcon({ size = 12 }: { size?: number }) {
  return <Zap className="text-white" size={size} fill="white" strokeWidth={0} />;
}

interface Props {
  loan: Loan;
  onComplete: () => void;
}

const priorYearItems = [
  { label: "LT Debt Continuity Schedule", desc: "Opening/closing balances, borrowings, repayments" },
  { label: "Amortization Schedule", desc: "Period-by-period principal + interest breakdown" },
  { label: "Interest Accrual WP", desc: "Year-end accrued interest calculation" },
];

export function AutopilotWorkingPapers({ loan, onComplete }: Props) {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const names = Array.from(fileList).map(f => f.name);
    setUploadedFiles(prev => [...prev, ...names]);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Luka message */}
      <div className="flex gap-3 px-4 pt-4 pb-3">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0 mt-0.5">
          <LukaIcon size={12} />
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          Upload prior year working paper files to pre-populate continuity schedules for <strong>{loan.name}</strong>.
        </p>
      </div>

      <div className="flex flex-1 gap-4 px-4 pb-4 overflow-hidden min-h-0">
        {/* Left: upload */}
        <div className="flex-1 min-w-0 overflow-y-auto space-y-4">
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
              isDragging
                ? "border-primary bg-primary/10"
                : "border-primary/30 bg-primary/[0.02] hover:bg-primary/[0.04]"
            )}
          >
            <Upload className="w-10 h-10 text-primary/40 mx-auto mb-3" />
            <p className="text-sm text-primary font-medium">Click to upload prior year WPs</p>
            <p className="text-xs text-foreground mt-1">or drag and drop — PDF files only</p>
            <input ref={fileRef} type="file" multiple accept=".pdf" className="hidden" onChange={e => handleFiles(e.target.files)} />
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              {uploadedFiles.map((name, i) => (
                <div key={i} className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-muted/20">
                  <FileText className="w-4 h-4 text-primary/60 shrink-0" />
                  <span className="text-xs text-foreground flex-1 truncate">{name}</span>
                  <button onClick={() => setUploadedFiles(prev => prev.filter((_, j) => j !== i))}>
                    <X className="w-3.5 h-3.5 text-foreground hover:text-destructive transition-colors" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button onClick={onComplete} className="w-full bg-primary text-primary-foreground">
            Continue to FS & GL Mapping
          </Button>
        </div>

        {/* Right: what gets pre-populated */}
        <div className="w-52 shrink-0">
          <div className="border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
              Pre-populate from prior year
            </p>
            <div className="space-y-3">
              {priorYearItems.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary/60 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-foreground">{item.label}</p>
                    <p className="text-[10px] text-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
