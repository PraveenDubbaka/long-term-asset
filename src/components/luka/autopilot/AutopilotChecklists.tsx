import { useState, useRef } from "react";
import { Upload, X, CheckCircle2, Circle, Zap } from "lucide-react";
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

const checklistItems = [
  { id: "loan-agreement", label: "Loan Agreement", required: true, checked: true },
  { id: "security-docs", label: "Security / Collateral docs", required: true, checked: true },
  { id: "covenant-compliance", label: "Covenant compliance certificate", required: true, checked: true },
  { id: "insurance", label: "Insurance certificate", required: false, checked: false },
];

export function AutopilotChecklists({ loan, onComplete }: Props) {
  const [isNewLoan, setIsNewLoan] = useState<boolean | null>(null);
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
          The next steps are now unlocked. For Checklists — select the loan documentation details for <strong>{loan.name}</strong>.
        </p>
      </div>

      <div className="flex flex-1 gap-4 px-4 pb-4 overflow-hidden min-h-0">
        {/* Left panel */}
        <div className="flex-1 min-w-0 overflow-y-auto space-y-4">
          {/* New loan question */}
          <div className="border border-border rounded-xl p-4">
            <p className="text-sm font-medium text-foreground mb-3">Is this a new loan engagement?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsNewLoan(true)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                  isNewLoan === true
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-muted/50"
                )}
              >
                Yes — first year
              </button>
              <button
                onClick={() => setIsNewLoan(false)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                  isNewLoan === false
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-muted/50"
                )}
              >
                No — continuing engagement
              </button>
            </div>
          </div>

          {/* Upload zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
              isDragging
                ? "border-primary bg-primary/10"
                : "border-primary/30 bg-primary/[0.02] hover:bg-primary/[0.04]"
            )}
          >
            <Upload className="w-8 h-8 text-primary/40 mx-auto mb-2" />
            <p className="text-sm text-primary font-medium">Click to upload</p>
            <p className="text-xs text-muted-foreground">or drag and drop — PDF files only</p>
            <input ref={fileRef} type="file" multiple accept=".pdf" className="hidden" onChange={e => handleFiles(e.target.files)} />
          </div>

          {/* Uploaded files */}
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((name, i) => (
                <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {name}
                  <button onClick={() => setUploadedFiles(prev => prev.filter((_, j) => j !== i))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <Button
            onClick={onComplete}
            className="w-full bg-primary text-primary-foreground"
            disabled={isNewLoan === null}
          >
            Confirm & Continue
          </Button>
        </div>

        {/* Right: checklist */}
        <div className="w-52 shrink-0">
          <div className="border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Document Checklist</p>
            <div className="space-y-2.5">
              {checklistItems.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  {item.checked ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={cn("text-xs", item.checked ? "text-foreground" : "text-muted-foreground")}>
                    {item.label}
                    {item.required && <span className="text-destructive ml-0.5">*</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
