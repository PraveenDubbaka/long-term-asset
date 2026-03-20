import { useState, useRef, useEffect } from "react";
import { Monitor, FolderOpen, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AttachedFile {
  id: string;
  file: File;
  name: string;
  size: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* (+) button menu with Computer / Repository options */
export function LukaAttachMenu({
  onFilesAdded,
}: {
  onFilesAdded: (files: File[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleComputerClick = () => {
    setOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesAdded(Array.from(files));
    }
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "h-9 w-9 flex items-center justify-center rounded-[10px] border border-transparent bg-background",
          "transition-all duration-200 hover:bg-muted/60 hover:border-border hover:shadow-sm",
          "active:scale-[0.97]",
          open && "bg-muted/60 border-border shadow-sm"
        )}
      >
        <span className={cn("transition-transform duration-200", open && "rotate-45")}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted-foreground">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Popover menu */}
      {open && (
        <div className="absolute bottom-full left-0 mb-2 z-50 min-w-[180px] rounded-lg border border-border bg-background shadow-elevation-2 py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <button
            onClick={handleComputerClick}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors rounded-sm"
          >
            <Monitor size={16} className="text-muted-foreground shrink-0" />
            <span className="font-medium">Computer</span>
          </button>
          <button
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors rounded-sm"
          >
            <FolderOpen size={16} className="text-muted-foreground shrink-0" />
            <span className="font-medium">Repository</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* File chips bar shown above the input when files are attached */
export function AttachedFilesBar({
  files,
  onRemove,
  onClearAll,
}: {
  files: AttachedFile[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
}) {
  if (files.length === 0) return null;

  return (
    <div className="px-4 pt-2 pb-1 flex flex-wrap items-center gap-2">
      {files.map((f) => (
        <div
          key={f.id}
          className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-muted/60 border border-border/50 text-xs group/chip"
        >
          <span className="text-foreground font-medium max-w-[120px] truncate">{f.name}</span>
          <span className="text-muted-foreground">{f.size}</span>
          <button
            onClick={() => onRemove(f.id)}
            className="ml-0.5 h-4 w-4 flex items-center justify-center rounded-full hover:bg-destructive/10 transition-colors"
          >
            <X size={10} className="text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      ))}
      {files.length > 1 && (
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 size={11} />
          <span>Clear all</span>
        </button>
      )}
    </div>
  );
}

/* Hook for managing attached files state */
export function useAttachedFiles() {
  const [files, setFiles] = useState<AttachedFile[]>([]);

  const addFiles = (newFiles: File[]) => {
    const mapped = newFiles.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      name: f.name,
      size: formatSize(f.size),
    }));
    setFiles((prev) => [...prev, ...mapped]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAll = () => setFiles([]);

  return { files, addFiles, removeFile, clearAll };
}
