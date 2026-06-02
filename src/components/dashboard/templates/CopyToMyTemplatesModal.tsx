import { useState, useCallback } from "react";
import { FolderOpen, FolderClosed, Plus, X, Check, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface FolderNode {
  code: string;
  label: string;
  children?: FolderNode[];
}

interface CopyToMyTemplatesModalProps {
  open: boolean;
  onClose: () => void;
  templateName: string;
  folders: FolderNode[];
  onCopy: (folderPath: string) => void;
}

const CopyToMyTemplatesModal = ({
  open,
  onClose,
  templateName,
  folders,
  onCopy,
}: CopyToMyTemplatesModalProps) => {
  const [mode, setMode] = useState<"choose" | "existing" | "new">("choose");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [newFolderName, setNewFolderName] = useState("");

  const reset = useCallback(() => {
    setMode("choose");
    setSelectedFolder(null);
    setExpandedFolders(new Set());
    setNewFolderName("");
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleAdd = () => {
    if (mode === "existing" && selectedFolder) {
      onCopy(selectedFolder);
    } else if (mode === "new" && newFolderName.trim()) {
      onCopy(newFolderName.trim());
    }
    handleClose();
  };

  const isAddEnabled =
    (mode === "existing" && !!selectedFolder) ||
    (mode === "new" && newFolderName.trim().length > 0);

  const toggleExpand = (code: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const renderFolderTree = (nodes: FolderNode[], depth = 0) => {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedFolders.has(node.code);
      const isSelected = selectedFolder === node.code;

      return (
        <div key={node.code}>
          <motion.button
            whileHover={{ backgroundColor: "hsl(var(--accent))" }}
            onClick={() => {
              setSelectedFolder(node.code);
              if (hasChildren) toggleExpand(node.code);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              isSelected
                ? "bg-[#1C63A6]/10 text-[#1C63A6] font-semibold"
                : "text-foreground hover:bg-accent"
            }`}
            style={{ paddingLeft: depth * 20 + 12 }}
          >
            {hasChildren ? (
              <ChevronRight
                size={14}
                className={`transition-transform shrink-0 ${isExpanded ? "rotate-90" : ""}`}
              />
            ) : (
              <span className="w-3.5 shrink-0" />
            )}
            {isExpanded || isSelected ? (
              <FolderOpen size={16} className="shrink-0 text-[#1C63A6]" />
            ) : (
              <FolderClosed size={16} className="shrink-0 text-muted-foreground" />
            )}
            <span className="truncate">{node.label}</span>
            {isSelected && (
              <Check size={14} className="ml-auto shrink-0 text-[#1C63A6]" />
            )}
          </motion.button>
          <AnimatePresence>
            {hasChildren && isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {renderFolderTree(node.children!, depth + 1)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="sm:max-w-[480px] p-0 gap-0 overflow-hidden"
        style={{ borderRadius: 16 }}
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-foreground">
              Copy to My Templates
            </DialogTitle>
            <button
              onClick={handleClose}
              className="rounded-full p-1.5 hover:bg-muted transition-colors"
            >
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Copying <span className="font-medium text-foreground">"{templateName}"</span> to My Templates
          </p>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5 min-h-[280px]">
          {mode === "choose" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3"
            >
              <p className="text-sm font-medium text-foreground mb-1">
                Choose template location
              </p>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setMode("existing")}
                className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-[#1C63A6]/40 hover:bg-[#1C63A6]/5 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-[#1C63A6]/10 flex items-center justify-center shrink-0">
                  <FolderOpen size={20} className="text-[#1C63A6]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Existing Folder</p>
                  <p className="text-xs text-muted-foreground">Select from your existing My Templates folders</p>
                </div>
                <ChevronRight size={16} className="ml-auto text-muted-foreground" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setMode("new")}
                className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-[#1C63A6]/40 hover:bg-[#1C63A6]/5 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-[#1C63A6]/10 flex items-center justify-center shrink-0">
                  <Plus size={20} className="text-[#1C63A6]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Create New Folder</p>
                  <p className="text-xs text-muted-foreground">Create a new folder in My Templates</p>
                </div>
                <ChevronRight size={16} className="ml-auto text-muted-foreground" />
              </motion.button>
            </motion.div>
          )}

          {mode === "existing" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => { setMode("choose"); setSelectedFolder(null); }}
                  className="text-xs text-[#1C63A6] hover:underline font-medium"
                >
                  ← Back
                </button>
                <span className="text-sm font-medium text-foreground">Select a folder</span>
              </div>
              <div
                className="border border-border rounded-xl overflow-y-auto p-2"
                style={{ maxHeight: 220 }}
              >
                {folders.length > 0 ? (
                  renderFolderTree(folders)
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No folders found. Create a new folder instead.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {mode === "new" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => { setMode("choose"); setNewFolderName(""); }}
                  className="text-xs text-[#1C63A6] hover:underline font-medium"
                >
                  ← Back
                </button>
                <span className="text-sm font-medium text-foreground">Create new folder</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/30">
                <FolderOpen size={20} className="text-[#1C63A6] shrink-0" />
                <Input
                  placeholder="Enter folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 text-sm"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                The new folder will be created under My Templates.
              </p>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
          >
            Cancel
          </button>
          <motion.button
            whileHover={isAddEnabled ? { scale: 1.02 } : {}}
            whileTap={isAddEnabled ? { scale: 0.98 } : {}}
            onClick={handleAdd}
            disabled={!isAddEnabled}
            className={`px-5 py-2 text-sm font-semibold text-white transition-all ${
              isAddEnabled
                ? "opacity-100 cursor-pointer"
                : "opacity-40 cursor-not-allowed"
            }`}
            style={{
              borderRadius: 12,
              backgroundColor: "#1C63A6",
            }}
          >
            Add to My Templates
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CopyToMyTemplatesModal;
