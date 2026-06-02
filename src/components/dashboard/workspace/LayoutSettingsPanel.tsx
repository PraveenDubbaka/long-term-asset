import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLayoutSettings } from "./LayoutSettingsContext";
import { X, Maximize2, FileText, AlignLeft, ChevronDown, Info, SlidersHorizontal, Columns3 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface LayoutSettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

interface AccordionSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const AccordionSection = ({ icon, title, children, defaultOpen = false }: AccordionSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="text-[15px] font-semibold text-foreground">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} className="text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SettingRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-[15px] text-foreground">{label}</span>
    {children}
  </div>
);

const LayoutSettingsPanel = ({ open, onClose }: LayoutSettingsPanelProps) => {
  const { settings, applySettings } = useLayoutSettings();
  const [fontStyle, setFontStyle] = useState(settings.fontStyle);
  const [pageMargin, setPageMargin] = useState(settings.pageMargin);
  const [headerFooterEnabled, setHeaderFooterEnabled] = useState(settings.headerFooterEnabled);
  const [headerScope, setHeaderScope] = useState(settings.headerScope);
  const [footerScope, setFooterScope] = useState(settings.footerScope);
  const [showCurrency, setShowCurrency] = useState(settings.showCurrency);
  const [currencyType, setCurrencyType] = useState(settings.currencyType);
  const [placement, setPlacement] = useState(settings.currencyPlacement);
  const [figureRepresentation, setFigureRepresentation] = useState(settings.figureRepresentation);
  const [compressionValue, setCompressionValue] = useState([settings.compressionValue]);
  const [compressionPages, setCompressionPages] = useState("all");
  const [manualColumns, setManualColumns] = useState(settings.manualColumns);
  const [hasChanges, setHasChanges] = useState(false);

  const markChanged = () => { if (!hasChanges) setHasChanges(true); };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: "hsl(var(--foreground) / 0.08)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed right-4 top-4 bottom-4 z-50 flex flex-col bg-card border border-border overflow-hidden"
            style={{
              width: 400,
              maxWidth: "90vw",
              borderRadius: 12,
              boxShadow: "0 8px 40px hsl(220 30% 10% / 0.12), 0 2px 12px hsl(220 20% 10% / 0.06)",
            }}
            initial={{ x: "110%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "110%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30, mass: 0.8 }}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Layout Settings</h2>
                  <p className="text-[14px] text-muted-foreground mt-1">Display data on the page effectively</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="p-1.5 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                    title="Expand"
                  >
                    <Maximize2 size={16} className="text-muted-foreground" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  >
                    <X size={16} className="text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* Page Setup */}
              <AccordionSection
                icon={<FileText size={18} style={{ color: "#1c63a6" }} />}
                title="Page Setup"
                defaultOpen
              >
                <SettingRow label="Font Style">
                  <Select value={fontStyle} onValueChange={(v) => { setFontStyle(v); markChanged(); }}>
                    <SelectTrigger className="w-[140px] h-9 text-[15px] rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arial">Arial</SelectItem>
                      <SelectItem value="times">Times New Roman</SelectItem>
                      <SelectItem value="calibri">Calibri</SelectItem>
                      <SelectItem value="helvetica">Helvetica</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>

                <SettingRow label="Page Margin">
                  <Select value={pageMargin} onValueChange={(v) => { setPageMargin(v); markChanged(); }}>
                    <SelectTrigger className="w-[140px] h-9 text-[15px] rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="actual">Actual (Default)</SelectItem>
                      <SelectItem value="narrow">Narrow</SelectItem>
                      <SelectItem value="wide">Wide</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
              </AccordionSection>

              {/* Headers & Footers */}
              <AccordionSection
                icon={<AlignLeft size={18} style={{ color: "#1c63a6" }} />}
                title="Headers & Footers"
                defaultOpen
              >
                <SettingRow label="Header & Footer">
                  <Switch
                    checked={headerFooterEnabled}
                    onCheckedChange={(v) => { setHeaderFooterEnabled(v); markChanged(); }}
                  />
                </SettingRow>

                {headerFooterEnabled && (
                  <>
                    <SettingRow label="Header">
                      <Select value={headerScope} onValueChange={(v) => { setHeaderScope(v); markChanged(); }}>
                        <SelectTrigger className="w-[140px] h-9 text-[15px] rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Pages</SelectItem>
                          <SelectItem value="first">First Page Only</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingRow>

                    <SettingRow label="Footer">
                      <Select value={footerScope} onValueChange={(v) => { setFooterScope(v); markChanged(); }}>
                        <SelectTrigger className="w-[140px] h-9 text-[15px] rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Pages</SelectItem>
                          <SelectItem value="first">First Page Only</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingRow>
                  </>
                )}
              </AccordionSection>

              {/* Amounts Representation */}
              <AccordionSection
                icon={<Info size={18} style={{ color: "#1c63a6" }} />}
                title="Amounts Representation"
                defaultOpen
              >
                <SettingRow label="Show Currency Symbol">
                  <Switch
                    checked={showCurrency}
                    onCheckedChange={(v) => { setShowCurrency(v); markChanged(); }}
                  />
                </SettingRow>

                {showCurrency && (
                  <>
                    <SettingRow label="Currency Type">
                      <Select value={currencyType} onValueChange={(v) => { setCurrencyType(v); markChanged(); }}>
                        <SelectTrigger className="w-[140px] h-9 text-[15px] rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cad">CAN ($)</SelectItem>
                          <SelectItem value="usd">USD ($)</SelectItem>
                          <SelectItem value="eur">EUR (€)</SelectItem>
                          <SelectItem value="gbp">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingRow>

                    <SettingRow label="Placement">
                      <Select value={placement} onValueChange={(v) => { setPlacement(v); markChanged(); }}>
                        <SelectTrigger className="w-[140px] h-9 text-[15px] rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="first-row">First Row Line It...</SelectItem>
                          <SelectItem value="all-rows">All Rows</SelectItem>
                          <SelectItem value="totals-only">Totals Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingRow>
                  </>
                )}

                <div className="border-t border-border pt-4" />

                <SettingRow label="Figure Representation">
                  <Select value={figureRepresentation} onValueChange={(v) => { setFigureRepresentation(v); markChanged(); }}>
                    <SelectTrigger className="w-[140px] h-9 text-[15px] rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="actual">Actual</SelectItem>
                      <SelectItem value="thousands">In Thousands</SelectItem>
                      <SelectItem value="millions">In Millions</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
              </AccordionSection>

              {/* Page Content Compression */}
              <AccordionSection
                icon={<SlidersHorizontal size={18} style={{ color: "#1c63a6" }} />}
                title="Page Content Compression"
                defaultOpen
              >
                <div className="space-y-3">
                  <Slider
                    value={compressionValue}
                    onValueChange={(v) => { setCompressionValue(v); markChanged(); }}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                    <span style={{ fontSize: 12 }}>A</span>
                    <span style={{ fontSize: 15 }}>A</span>
                    <span style={{ fontSize: 18, fontWeight: 600 }}>A</span>
                  </div>
                </div>

                <SettingRow label="Select Pages">
                  <Select value={compressionPages} onValueChange={(v) => { setCompressionPages(v); markChanged(); }}>
                    <SelectTrigger className="w-[140px] h-9 text-[15px] rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Pages</SelectItem>
                      <SelectItem value="current">Current Page</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
              </AccordionSection>

              {/* Manual Columns */}
              <AccordionSection
                icon={<Columns3 size={18} style={{ color: "#1c63a6" }} />}
                title="Manual Columns"
              >
                <div className="flex items-start gap-2 text-[14px] text-muted-foreground mb-1">
                  <Info size={14} className="shrink-0 mt-0.5" style={{ color: "#1c63a6" }} />
                  <span>Use the <strong>+</strong> icon in the preview header to add a manual column. Toggle visibility here.</span>
                </div>
                <div className="space-y-3">
                  {([
                    { key: "balanceSheet" as const, label: "Balance Sheet" },
                    { key: "incomeStatement" as const, label: "Income Statement" },
                    { key: "retainedEarnings" as const, label: "Retained Earnings" },
                    { key: "cashFlows" as const, label: "Cash Flows" },
                  ]).map(({ key, label }) => {
                    const isAdded = settings.manualColumnsAdded[key];
                    return (
                      <div key={key} className="flex items-center justify-between gap-4">
                        <span className={`text-[15px] ${isAdded ? "text-foreground" : "text-muted-foreground/50"}`}>{label}</span>
                        <div className="flex items-center gap-2">
                          {!isAdded && (
                            <span className="text-[11px] text-muted-foreground/40 italic">Not added</span>
                          )}
                          <Switch
                            checked={manualColumns[key]}
                            disabled={!isAdded}
                            onCheckedChange={(v) => { setManualColumns(prev => ({ ...prev, [key]: !!v })); markChanged(); }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionSection>

            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border flex items-center gap-3">
              <button
                onClick={onClose}
                className="flex-1 h-10 rounded-[8px] text-sm font-medium border border-border text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                className="flex-1 h-10 rounded-[8px] text-sm font-medium transition-all cursor-pointer"
                style={{
                  background: hasChanges ? "#1c63a6" : "hsl(220 20% 90%)",
                  color: hasChanges ? "#fff" : "hsl(220 15% 60%)",
                  cursor: hasChanges ? "pointer" : "not-allowed",
                  opacity: hasChanges ? 1 : 0.7,
                }}
                onClick={() => {
                  if (hasChanges) {
                    applySettings({
                      fontStyle,
                      pageMargin,
                      headerFooterEnabled,
                      headerScope,
                      footerScope,
                      headerStretchToFit: true,
                      footerStretchToFit: true,
                      showCurrency,
                      currencyType,
                      currencyPlacement: placement,
                      figureRepresentation,
                      compressionValue: compressionValue[0],
                      manualColumns,
                      manualColumnsAdded: settings.manualColumnsAdded,
                      manualColumnInsertions: settings.manualColumnInsertions,
                      boardApproval: settings.boardApproval,
                      firmBranding: settings.firmBranding,
                      partnersCapital: settings.partnersCapital,
                    });
                    setHasChanges(false);
                    onClose();
                  }
                }}
              >
                Apply
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LayoutSettingsPanel;
