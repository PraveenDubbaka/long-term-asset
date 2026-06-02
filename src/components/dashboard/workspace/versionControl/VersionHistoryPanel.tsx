import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockVersions } from "./mockData";
import type { FSVersion, FSVersionChange } from "./types";
import {
  X, Clock, RotateCcw, Eye, GitCompare, Download, ChevronDown, ChevronRight,
  Check, AlertCircle, Layers, FileText,
} from "lucide-react";
import { toast } from "sonner";

interface VersionHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  currentScreen: string;
}

const fsScreenShort: Record<string, string> = {
  "Balance Sheet": "BS",
  "Statement of Income Loss": "IS",
  "Statement of Cash Flows": "CF",
  "Notes to Financial Information": "Notes",
  "Cover Page": "Cover",
  "Table of Contents": "ToC",
  "Compilation Report": "CR",
};

const formatTime = (d: Date) => {
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return `${Math.floor(diff / 604800000)}w ago`;
};

const formatFullDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

const roleBadgeStyles: Record<string, { bg: string; color: string; label: string }> = {
  preparer: { bg: "hsl(210 80% 94%)", color: "hsl(210 80% 40%)", label: "Preparer" },
  reviewer: { bg: "hsl(270 60% 94%)", color: "hsl(270 60% 40%)", label: "Reviewer" },
  manager: { bg: "hsl(30 80% 93%)", color: "hsl(30 70% 35%)", label: "Manager" },
};

const VersionHistoryPanel = ({ open, onClose, currentScreen }: VersionHistoryPanelProps) => {
  const [filterMode, setFilterMode] = useState<"all" | "statement">("all");
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<[string | null, string | null]>([null, null]);
  const [previewingVersion, setPreviewingVersion] = useState<string | null>(null);

  const filteredVersions = useMemo(() => {
    if (filterMode === "all") return mockVersions;
    return mockVersions.filter(v => v.screens.includes(currentScreen));
  }, [filterMode, currentScreen]);

  const handleRestore = (version: FSVersion) => {
    toast.success(`Restored to ${version.label} (v${version.versionNumber})`, {
      description: `${version.screens.length} statement${version.screens.length > 1 ? "s" : ""} reverted`,
    });
  };

  const handleExport = (version: FSVersion) => {
    toast.success(`Exporting v${version.versionNumber} as PDF…`, {
      description: "Download will start shortly",
    });
  };

  const handleCompareSelect = (id: string) => {
    if (compareSelection[0] === null) {
      setCompareSelection([id, null]);
    } else if (compareSelection[1] === null && compareSelection[0] !== id) {
      setCompareSelection([compareSelection[0], id]);
    } else {
      setCompareSelection([id, null]);
    }
  };

  const compareVersions = useMemo(() => {
    if (!compareSelection[0] || !compareSelection[1]) return null;
    const v1 = mockVersions.find(v => v.id === compareSelection[0]);
    const v2 = mockVersions.find(v => v.id === compareSelection[1]);
    if (!v1 || !v2) return null;
    return { older: v1.timestamp < v2.timestamp ? v1 : v2, newer: v1.timestamp < v2.timestamp ? v2 : v1 };
  }, [compareSelection]);

  const renderChangeDiff = (change: FSVersionChange) => (
    <div key={`${change.screen}-${change.field}`} className="flex flex-col gap-0.5 px-3 py-1.5 rounded-md" style={{ background: "hsl(220 15% 97%)" }}>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "hsl(220 15% 92%)", color: "hsl(220 15% 45%)" }}>
          {fsScreenShort[change.screen] || change.screen}
        </span>
        <span className="text-[12px] font-medium truncate" style={{ color: "hsl(220 20% 25%)" }}>{change.field}</span>
      </div>
      <div className="flex items-center gap-2 ml-1">
        <span className="text-[12px] line-through" style={{ color: "hsl(0 60% 50%)" }}>{change.oldValue}</span>
        <ChevronRight size={10} style={{ color: "hsl(220 15% 60%)" }} />
        <span className="text-[12px] font-semibold" style={{ color: "hsl(145 60% 35%)" }}>{change.newValue}</span>
      </div>
    </div>
  );

  const renderVersionCard = (version: FSVersion, index: number) => {
    const isExpanded = expandedVersion === version.id;
    const isCompareSelected = compareSelection.includes(version.id);
    const isPreviewing = previewingVersion === version.id;

    return (
      <div key={version.id} className="relative flex gap-3">
        {/* Timeline line + dot */}
        <div className="flex flex-col items-center flex-shrink-0" style={{ width: 20 }}>
          <motion.div
            className="w-3 h-3 rounded-full flex-shrink-0 z-10 flex items-center justify-center"
            style={{
              background: version.isCurrent ? "hsl(207 71% 38%)" : isCompareSelected ? "hsl(270 60% 55%)" : "hsl(220 15% 80%)",
              border: `2px solid ${version.isCurrent ? "hsl(207 71% 31%)" : "hsl(220 15% 90%)"}`,
            }}
            animate={isPreviewing ? { scale: [1, 1.3, 1] } : {}}
            transition={{ repeat: isPreviewing ? Infinity : 0, duration: 1.5 }}
          >
            {version.isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </motion.div>
          {index < filteredVersions.length - 1 && (
            <div className="w-px flex-1 -mt-px" style={{ background: "hsl(207 71% 38% / 0.2)" }} />
          )}
        </div>

        {/* Card */}
        <motion.div
          className="flex-1 mb-3 rounded-lg border overflow-hidden cursor-pointer"
          style={{
            borderColor: version.isCurrent ? "hsl(207 71% 38% / 0.3)" : isCompareSelected ? "hsl(270 60% 55% / 0.4)" : "hsl(220 15% 88%)",
            background: version.isCurrent ? "hsl(207 71% 38% / 0.03)" : "hsl(0 0% 100%)",
            boxShadow: isCompareSelected ? "0 0 0 2px hsl(270 60% 55% / 0.15)" : "none",
          }}
          whileHover={{ borderColor: "hsl(207 71% 38% / 0.4)", boxShadow: "0 2px 8px hsl(207 71% 38% / 0.08)" }}
          onClick={() => compareMode ? handleCompareSelect(version.id) : setExpandedVersion(isExpanded ? null : version.id)}
        >
          {/* Header */}
          <div className="px-3 py-2 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                style={{ background: version.author.avatarColor }}
              >
                {version.author.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[13px] font-semibold" style={{ color: "hsl(220 20% 15%)" }}>v{version.versionNumber}</span>
                  {version.isCurrent && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: "hsl(145 50% 93%)", color: "hsl(145 60% 30%)", border: "1px solid hsl(145 50% 75%)" }}>
                      CURRENT
                    </span>
                  )}
                  <span className="text-[11px]" style={{ color: "hsl(220 15% 55%)" }}>{formatTime(version.timestamp)}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[12px] font-medium" style={{ color: "hsl(220 20% 30%)" }}>{version.author.name}</span>
                  {roleBadgeStyles[version.author.role] && (
                    <span className="px-1 py-[1px] rounded text-[8px] font-semibold uppercase tracking-wider"
                      style={{ background: roleBadgeStyles[version.author.role].bg, color: roleBadgeStyles[version.author.role].color }}>
                      {roleBadgeStyles[version.author.role].label}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {compareMode && (
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  borderColor: isCompareSelected ? "hsl(270 60% 55%)" : "hsl(220 15% 75%)",
                  background: isCompareSelected ? "hsl(270 60% 55%)" : "transparent",
                }}
              >
                {isCompareSelected && <Check size={10} className="text-white" />}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="px-3 pb-2">
            <p className="text-[13px]" style={{ color: "hsl(220 20% 35%)" }}>{version.label}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "hsl(220 15% 55%)" }}>{version.description}</p>
          </div>

          {/* Scope badges */}
          <div className="px-3 pb-2 flex flex-wrap gap-1">
            {version.scope === "engagement" && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold"
                style={{ background: "hsl(210 80% 94%)", color: "hsl(210 80% 40%)" }}>
                <Layers size={9} /> All Statements
              </span>
            )}
            {version.screens.map(s => (
              <span key={s} className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                style={{ background: "hsl(220 15% 94%)", color: "hsl(220 15% 45%)" }}>
                {fsScreenShort[s] || s}
              </span>
            ))}
          </div>

          {/* Expanded: changes + actions */}
          <AnimatePresence>
            {isExpanded && !compareMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t"
                style={{ borderColor: "hsl(220 15% 93%)" }}
              >
                {/* Changes */}
                {version.changes.length > 0 && (
                  <div className="px-3 py-2 flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "hsl(220 15% 55%)" }}>
                      Changes ({version.changes.length})
                    </span>
                    {version.changes.map(renderChangeDiff)}
                  </div>
                )}
                {version.changes.length === 0 && (
                  <div className="px-3 py-2 text-[11px]" style={{ color: "hsl(220 15% 55%)" }}>
                    Initial version — no prior changes to show
                  </div>
                )}

                {/* Action buttons */}
                <div className="px-3 py-2 flex items-center gap-1.5 border-t" style={{ borderColor: "hsl(220 15% 93%)" }}>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={(e) => { e.stopPropagation(); setPreviewingVersion(previewingVersion === version.id ? null : version.id); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer"
                    style={{
                      background: isPreviewing ? "hsl(207 71% 38%)" : "hsl(210 80% 94%)",
                      color: isPreviewing ? "white" : "hsl(210 80% 40%)",
                      border: `1px solid ${isPreviewing ? "hsl(207 71% 31%)" : "hsl(210 80% 80%)"}`,
                    }}
                  >
                    <Eye size={11} /> {isPreviewing ? "Previewing…" : "Preview"}
                  </motion.button>

                  {!version.isCurrent && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={(e) => { e.stopPropagation(); handleRestore(version); }}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer"
                      style={{ background: "hsl(145 50% 93%)", color: "hsl(145 60% 30%)", border: "1px solid hsl(145 50% 75%)" }}
                    >
                      <RotateCcw size={11} /> Restore
                    </motion.button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={(e) => { e.stopPropagation(); handleExport(version); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer"
                    style={{ background: "hsl(220 15% 95%)", color: "hsl(220 15% 40%)", border: "1px solid hsl(220 15% 88%)" }}
                  >
                    <Download size={11} /> Export
                  </motion.button>
                </div>

                {/* Timestamp */}
                <div className="px-3 py-1.5 border-t" style={{ borderColor: "hsl(220 15% 93%)", background: "hsl(220 15% 97%)" }}>
                  <span className="text-[10px]" style={{ color: "hsl(220 15% 55%)" }}>
                    {formatFullDate(version.timestamp)}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 380, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="h-full border-l flex flex-col overflow-hidden flex-shrink-0"
          style={{ borderColor: "hsl(220 15% 88%)", background: "hsl(220 15% 98%)" }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "hsl(220 15% 90%)" }}>
            <div className="flex items-center gap-2">
              <Clock size={16} style={{ color: "hsl(207 71% 38%)" }} />
              <span className="text-[14px] font-semibold" style={{ color: "hsl(220 20% 15%)" }}>Version History</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: "hsl(207 71% 38%)", color: "white", minWidth: 18, textAlign: "center" }}>
                {filteredVersions.length}
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md cursor-pointer"
              style={{ color: "hsl(220 15% 50%)" }}
            >
              <X size={16} />
            </motion.button>
          </div>

          {/* Filter tabs */}
          <div className="px-3 py-2 flex items-center gap-1.5 border-b" style={{ borderColor: "hsl(220 15% 93%)" }}>
            {(["all", "statement"] as const).map(mode => (
              <motion.button
                key={mode}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setFilterMode(mode)}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer"
                style={{
                  background: filterMode === mode ? "hsl(207 71% 38%)" : "hsl(0 0% 100%)",
                  color: filterMode === mode ? "white" : "hsl(220 15% 40%)",
                  border: `1px solid ${filterMode === mode ? "hsl(207 71% 31%)" : "hsl(220 15% 88%)"}`,
                }}
              >
                {mode === "all" ? "All Statements" : fsScreenShort[currentScreen] || currentScreen}
              </motion.button>
            ))}
            <div className="flex-1" />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setCompareMode(!compareMode); setCompareSelection([null, null]); }}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer"
              style={{
                background: compareMode ? "hsl(270 60% 55%)" : "transparent",
                color: compareMode ? "white" : "hsl(220 15% 50%)",
                border: `1px solid ${compareMode ? "hsl(270 60% 50%)" : "hsl(220 15% 85%)"}`,
              }}
            >
              <GitCompare size={11} /> Compare
            </motion.button>
          </div>

          {/* Compare banner */}
          <AnimatePresence>
            {compareMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-3 py-2 border-b overflow-hidden"
                style={{ borderColor: "hsl(220 15% 93%)", background: "hsl(270 60% 55% / 0.05)" }}
              >
                <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "hsl(270 60% 40%)" }}>
                  <AlertCircle size={12} />
                  <span className="font-medium">
                    {!compareSelection[0] ? "Select first version" : !compareSelection[1] ? "Select second version" : "Comparing versions"}
                  </span>
                </div>
                {compareVersions && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 rounded-lg border p-2"
                    style={{ background: "hsl(0 0% 100%)", borderColor: "hsl(270 60% 80%)" }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold" style={{ color: "hsl(220 20% 25%)" }}>
                        v{compareVersions.older.versionNumber} → v{compareVersions.newer.versionNumber}
                      </span>
                      <span className="text-[10px]" style={{ color: "hsl(220 15% 55%)" }}>
                        {compareVersions.newer.changes.length} change{compareVersions.newer.changes.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {compareVersions.newer.changes.map(renderChangeDiff)}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Version timeline */}
          <ScrollArea className="flex-1">
            <div className="px-3 py-3">
              {filteredVersions.map((v, i) => renderVersionCard(v, i))}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="px-3 py-2 border-t flex items-center justify-between" style={{ borderColor: "hsl(220 15% 90%)", background: "hsl(220 15% 97%)" }}>
            <span className="text-[10px]" style={{ color: "hsl(220 15% 55%)" }}>
              {filteredVersions.length} version{filteredVersions.length !== 1 ? "s" : ""} • Auto-saved on every publish
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VersionHistoryPanel;
