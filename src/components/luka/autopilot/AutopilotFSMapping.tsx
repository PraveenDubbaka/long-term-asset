import { useState, useRef } from "react";
import { Upload, X, FileText, Save, Zap } from "lucide-react";
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

export function AutopilotFSMapping({ loan, onComplete }: Props) {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [currentPortion, setCurrentPortion] = useState("100000");
  const [currency, setCurrency] = useState<string>(loan.currency || "CAD");
  const [rounding, setRounding] = useState("None");
  const [fxRateSource, setFxRateSource] = useState("Closing Rate");
  const [saved, setSaved] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const names = Array.from(fileList).map(f => f.name);
    setUploadedFiles(prev => [...prev, ...names]);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Luka message */}
      <div className="flex gap-3 px-4 pt-4 pb-3">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0 mt-0.5">
          <LukaIcon size={12} />
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          Upload prior year FS and chart of accounts, then configure your debt presentation settings.
        </p>
      </div>

      <div className="flex flex-1 gap-4 px-4 pb-4 overflow-hidden min-h-0">
        {/* Left: upload + settings */}
        <div className="flex-1 min-w-0 overflow-y-auto space-y-4">
          {/* Upload zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
              isDragging
                ? "border-primary bg-primary/10"
                : "border-primary/30 bg-primary/[0.02] hover:bg-primary/[0.04]"
            )}
          >
            <Upload className="w-8 h-8 text-primary/40 mx-auto mb-2" />
            <p className="text-sm text-primary font-medium">Upload prior year FS + Chart of Accounts</p>
            <p className="text-xs text-muted-foreground">PDF files only</p>
            <input ref={fileRef} type="file" multiple accept=".pdf" className="hidden" onChange={e => handleFiles(e.target.files)} />
          </div>

          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((name, i) => (
                <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  <FileText className="w-3 h-3" />
                  {name}
                  <button onClick={() => setUploadedFiles(prev => prev.filter((_, j) => j !== i))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Settings */}
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Debt Presentation Settings</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Current portion threshold</label>
                  <input
                    type="number"
                    value={currentPortion}
                    onChange={e => setCurrentPortion(e.target.value)}
                    className="w-full h-8 px-3 text-xs rounded-md border border-border bg-background dark:bg-muted/20 outline-none focus:border-primary/60"
                    placeholder="100,000"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Presentation currency</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full h-8 px-3 text-xs rounded-md border border-border bg-background dark:bg-muted/20 outline-none focus:border-primary/60"
                  >
                    <option>CAD</option>
                    <option>USD</option>
                    <option>EUR</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Rounding</label>
                  <select
                    value={rounding}
                    onChange={e => setRounding(e.target.value)}
                    className="w-full h-8 px-3 text-xs rounded-md border border-border bg-background dark:bg-muted/20 outline-none focus:border-primary/60"
                  >
                    <option>None</option>
                    <option>Thousands</option>
                    <option>Millions</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">FX rate source</label>
                  <select
                    value={fxRateSource}
                    onChange={e => setFxRateSource(e.target.value)}
                    className="w-full h-8 px-3 text-xs rounded-md border border-border bg-background dark:bg-muted/20 outline-none focus:border-primary/60"
                  >
                    <option>Closing Rate</option>
                    <option>Average Rate</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleSave}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                  saved
                    ? "bg-green-500 text-white"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                )}
              >
                <Save className="w-3.5 h-3.5" />
                {saved ? "Saved!" : "Save settings"}
              </button>
            </div>
          </div>

          <Button onClick={onComplete} className="w-full bg-primary text-primary-foreground">
            Continue to Magic
          </Button>
        </div>
      </div>
    </div>
  );
}
