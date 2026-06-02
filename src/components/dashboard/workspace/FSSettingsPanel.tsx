import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2, Eye, Grid3X3, Users, ChevronDown, Info, ArrowUpDown, Plus, Check, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useLayoutSettings, BoardMember, ApprovalLayout, ApprovalAlignment } from "./LayoutSettingsContext";

interface FSSettingsPanelProps {
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
        <div className="flex flex-col gap-[3px] items-center">
          <motion.span
            className="block rounded-full"
            style={{ width: 4, height: 4, background: "hsl(var(--primary) / 0.5)" }}
            animate={isOpen ? { y: 2, opacity: 0.3 } : { y: 0, opacity: 0.7 }}
            transition={{ duration: 0.2 }}
          />
          <motion.span
            className="block rounded-full"
            style={{ width: 4, height: 4, background: "hsl(var(--primary) / 0.7)" }}
            animate={isOpen ? { scale: 1.3 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
          />
          <motion.span
            className="block rounded-full"
            style={{ width: 4, height: 4, background: "hsl(var(--primary) / 0.5)" }}
            animate={isOpen ? { y: -2, opacity: 0.3 } : { y: 0, opacity: 0.7 }}
            transition={{ duration: 0.2 }}
          />
        </div>
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

const InfoNote = ({ text }: { text: string }) => (
  <div className="flex items-start gap-2 text-[14px] text-muted-foreground">
    <Info size={14} className="shrink-0 mt-0.5" style={{ color: "#1c63a6" }} />
    <span>{text}</span>
  </div>
);

const FSSettingsPanel = ({ open, onClose }: FSSettingsPanelProps) => {
  const { settings, applySettings } = useLayoutSettings();
  const [tocEnabled, setTocEnabled] = useState(true);
  const [notesPageBreak, setNotesPageBreak] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [watermarkText, setWatermarkText] = useState("DRAFT UNAUDITED");
  const [combinedStatement, setCombinedStatement] = useState(true);
  const [cashFlowMethod, setCashFlowMethod] = useState("indirect");
  const [dataPresented, setDataPresented] = useState("2years");
  const [roundingDiff, setRoundingDiff] = useState(false);
  const [bsPageBreak, setBsPageBreak] = useState(false);

  // Board Approval - synced with context
  const boardApproval = settings.boardApproval;
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberTitle, setNewMemberTitle] = useState("");

  const updateBoardApproval = (updates: Partial<typeof boardApproval>) => {
    applySettings({
      ...settings,
      boardApproval: { ...boardApproval, ...updates },
    });
  };

  const addBoardMember = () => {
    const name = newMemberName.trim();
    const title = newMemberTitle.trim();
    if (name && title) {
      updateBoardApproval({
        members: [...boardApproval.members, { name, title }],
      });
      setNewMemberName("");
      setNewMemberTitle("");
    }
  };

  const removeBoardMember = (index: number) => {
    updateBoardApproval({
      members: boardApproval.members.filter((_, i) => i !== index),
    });
  };

  const handleMemberKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addBoardMember();
    }
  };

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
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-card border-l border-border shadow-2xl"
            style={{ width: 420, maxWidth: "90vw" }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 30, mass: 0.8 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground">FS Settings</h2>
                <p className="text-[14px] text-muted-foreground mt-0.5">Data Settings for Statements</p>
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

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* Statement Presentation */}
              <AccordionSection
                icon={<Eye size={18} style={{ color: "#1c63a6" }} />}
                title="Statement Presentation"
              >
                <SettingRow label="Table of Contents">
                  <Switch checked={tocEnabled} onCheckedChange={setTocEnabled} />
                </SettingRow>
                <InfoNote text="Page number not to be applied to Cover Page and Table of Content" />

                <div className="border-t border-border pt-4" />

                <SettingRow label="Notes to Financial Information - Page Break">
                  <Switch checked={notesPageBreak} onCheckedChange={setNotesPageBreak} />
                </SettingRow>
                <InfoNote text="Hover over the statement to apply page break" />

                <div className="border-t border-border pt-4" />

                <SettingRow label="Show Watermark">
                  <Switch checked={showWatermark} onCheckedChange={setShowWatermark} />
                </SettingRow>
                {showWatermark && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] text-foreground">Watermark Text</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <Input
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          className="h-8 text-[15px] w-36 rounded-lg"
                          maxLength={22}
                        />
                        <button className="p-1 rounded hover:bg-accent transition-colors">
                          <Check size={14} style={{ color: "#1c63a6" }} />
                        </button>
                        <button className="p-1 rounded hover:bg-accent transition-colors">
                          <X size={14} className="text-destructive" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[14px] text-muted-foreground text-right">{watermarkText.length}/22</p>
                  </div>
                )}

                <div className="border-t border-border pt-4" />

                <SettingRow label="Combined statement of income and statement of retained earnings">
                  <Switch checked={combinedStatement} onCheckedChange={setCombinedStatement} />
                </SettingRow>

                <div className="border-t border-border pt-4" />

                <SettingRow label="Statement of cash flows method">
                  <Select value={cashFlowMethod} onValueChange={setCashFlowMethod}>
                    <SelectTrigger className="w-32 h-8 text-[15px] rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indirect">Indirect</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>

                <SettingRow label="Data Presented">
                  <Select value={dataPresented} onValueChange={setDataPresented}>
                    <SelectTrigger className="w-32 h-8 text-[15px] rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1year">1 Year</SelectItem>
                      <SelectItem value="2years">2 Years</SelectItem>
                      <SelectItem value="3years">3 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
              </AccordionSection>

              {/* Balance Sheet */}
              <AccordionSection
                icon={<Grid3X3 size={18} style={{ color: "#1c63a6" }} />}
                title="Balance Sheet"
              >
                <p className="text-[15px] font-medium italic" style={{ color: "#1c63a6" }}>
                  Apply Rounding to Balance Sheet Account
                </p>

                <SettingRow label="Rounding Difference">
                  <Switch checked={roundingDiff} onCheckedChange={setRoundingDiff} />
                </SettingRow>

                <SettingRow label="Select Balance Sheet Acc.">
                  <Select>
                    <SelectTrigger className="w-32 h-8 text-[15px] rounded-lg">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="receivables">Receivables</SelectItem>
                      <SelectItem value="equity">Equity</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>

                <div className="border-t border-border pt-4" />

                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1c63a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v18M3 12h18M7 7l10 10M17 7L7 17" />
                  </svg>
                  <span className="text-[15px] font-medium italic" style={{ color: "#1c63a6" }}>Balance Sheet Page Break</span>
                </div>

                <SettingRow label="Between Assets and Equity & Liabilities">
                  <Switch checked={bsPageBreak} onCheckedChange={setBsPageBreak} />
                </SettingRow>

                <div className="border-t border-border pt-4" />

                <div className="flex items-center gap-2">
                  <ArrowUpDown size={16} style={{ color: "#1c63a6" }} />
                  <span className="text-[15px] font-medium italic" style={{ color: "#1c63a6" }}>Switch Categories</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[15px] text-foreground">Between Assets and Equity & Liabilities</span>
                  <button className="p-1.5 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <ArrowUpDown size={16} style={{ color: "#1c63a6" }} />
                  </button>
                </div>
              </AccordionSection>

              {/* Board Approval */}
              <AccordionSection
                icon={<Users size={18} style={{ color: "#1c63a6" }} />}
                title="Board Approval"
              >
                <SettingRow label="Approved by the Board">
                  <Switch
                    checked={boardApproval.enabled}
                    onCheckedChange={(checked) => updateBoardApproval({ enabled: checked })}
                  />
                </SettingRow>

                <AnimatePresence>
                  {boardApproval.enabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden space-y-4"
                    >
                      {/* Approval Text */}
                      <div className="space-y-1.5">
                        <label className="text-[14px] font-medium text-foreground">
                          Approval Text<span className="text-destructive ml-0.5">*</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <Input
                            value={boardApproval.approvalText}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^a-zA-Z0-9\s.,'-]/g, "");
                              updateBoardApproval({ approvalText: val });
                            }}
                            placeholder="Approved by"
                            className="h-9 text-[14px] rounded-lg flex-1"
                          />
                          <button
                            className="p-1.5 rounded-lg hover:bg-accent/80 transition-colors cursor-pointer"
                            title="Confirm"
                          >
                            <Check size={14} style={{ color: "#1c63a6" }} />
                          </button>
                        </div>
                      </div>

                      {/* Board Members Table */}
                      <div className="space-y-2">
                        <p className="text-[14px] font-semibold italic" style={{ color: "#1c63a6" }}>
                          Add Board Members Details
                        </p>

                        <div className="rounded-xl border border-border overflow-hidden bg-background">
                          <table className="w-full text-[13px]">
                            <thead>
                              <tr style={{ background: "hsl(var(--muted) / 0.6)" }}>
                                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Name</th>
                                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Title</th>
                                <th className="text-center px-2 py-2.5 font-semibold text-muted-foreground text-[12px] uppercase tracking-wide w-16">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {boardApproval.members.map((member, idx) => (
                                <motion.tr
                                  key={idx}
                                  initial={{ opacity: 0, y: -8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="border-t border-border/60 group"
                                >
                                  <td className="px-3 py-2 text-foreground font-medium">{member.name}</td>
                                  <td className="px-3 py-2 text-muted-foreground">{member.title}</td>
                                  <td className="px-2 py-2 text-center">
                                    <button
                                      onClick={() => removeBoardMember(idx)}
                                      className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all cursor-pointer"
                                    >
                                      <Trash2 size={13} className="text-destructive" />
                                    </button>
                                  </td>
                                </motion.tr>
                              ))}
                              {/* Input Row */}
                              <tr className="border-t border-border/60 bg-muted/20">
                                <td className="px-3 py-2">
                                  <Input
                                    value={newMemberName}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/[^a-zA-Z0-9\s.,'-]/g, "");
                                      setNewMemberName(val);
                                    }}
                                    onKeyDown={handleMemberKeyDown}
                                    placeholder="Enter name"
                                    className="h-7 text-[12px] rounded-md border-border/50"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <Input
                                    value={newMemberTitle}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/[^a-zA-Z0-9\s.,'-]/g, "");
                                      setNewMemberTitle(val);
                                    }}
                                    onKeyDown={handleMemberKeyDown}
                                    placeholder="Enter title"
                                    className="h-7 text-[12px] rounded-md border-border/50"
                                  />
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <div className="flex items-center justify-center gap-0.5">
                                    <button
                                      onClick={addBoardMember}
                                      className="p-1 rounded-md hover:bg-accent transition-colors cursor-pointer"
                                      title="Add member"
                                    >
                                      <Check size={14} style={{ color: "#1c63a6" }} />
                                    </button>
                                    <button
                                      onClick={() => { setNewMemberName(""); setNewMemberTitle(""); }}
                                      className="p-1 rounded-md hover:bg-accent transition-colors cursor-pointer"
                                      title="Clear"
                                    >
                                      <X size={13} className="text-muted-foreground" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Add Row Button */}
                        <button
                          onClick={() => {
                            // Focus the name input
                            const nameInput = document.querySelector<HTMLInputElement>(
                              'input[placeholder="Enter name"]'
                            );
                            nameInput?.focus();
                          }}
                          className="flex items-center gap-1.5 text-[13px] font-medium cursor-pointer hover:opacity-80 transition-opacity py-1"
                          style={{ color: "#1c63a6" }}
                        >
                          <Plus size={14} />
                          <span>Add member</span>
                        </button>
                      </div>

                      {/* Placement Settings */}
                      {boardApproval.members.length > 0 && (
                        <div className="space-y-3 pt-1">
                          <div className="border-t border-border pt-4" />
                          <p className="text-[14px] font-semibold italic" style={{ color: "#1c63a6" }}>
                            Placement Settings
                          </p>

                          {/* Layout */}
                          <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">Layout</label>
                            <div className="flex gap-1.5">
                              {([
                                { value: "horizontal" as ApprovalLayout, label: "Row", icon: "⇥" },
                                { value: "vertical" as ApprovalLayout, label: "Stack", icon: "⇩" },
                                { value: "grid" as ApprovalLayout, label: "Grid", icon: "⊞" },
                              ]).map((opt) => (
                                <button
                                  key={opt.value}
                                  onClick={() => updateBoardApproval({ layout: opt.value })}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer"
                                  style={{
                                    background: boardApproval.layout === opt.value ? "hsl(var(--primary) / 0.1)" : "hsl(var(--muted) / 0.4)",
                                    color: boardApproval.layout === opt.value ? "#1c63a6" : "hsl(var(--muted-foreground))",
                                    border: boardApproval.layout === opt.value ? "1px solid hsl(var(--primary) / 0.3)" : "1px solid transparent",
                                  }}
                                >
                                  <span className="text-[15px]">{opt.icon}</span>
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Columns per row - only for grid */}
                          {boardApproval.layout === "grid" && (
                            <div className="space-y-1.5">
                              <label className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">Columns per row</label>
                              <div className="flex gap-1.5">
                                {[2, 3, 4].map((n) => (
                                  <button
                                    key={n}
                                    onClick={() => updateBoardApproval({ columnsPerRow: n })}
                                    className="flex-1 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer"
                                    style={{
                                      background: boardApproval.columnsPerRow === n ? "hsl(var(--primary) / 0.1)" : "hsl(var(--muted) / 0.4)",
                                      color: boardApproval.columnsPerRow === n ? "#1c63a6" : "hsl(var(--muted-foreground))",
                                      border: boardApproval.columnsPerRow === n ? "1px solid hsl(var(--primary) / 0.3)" : "1px solid transparent",
                                    }}
                                  >
                                    {n}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Alignment */}
                          <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">Alignment</label>
                            <div className="flex gap-1.5">
                              {([
                                { value: "left" as ApprovalAlignment, label: "Left" },
                                { value: "center" as ApprovalAlignment, label: "Center" },
                                { value: "right" as ApprovalAlignment, label: "Right" },
                              ]).map((opt) => (
                                <button
                                  key={opt.value}
                                  onClick={() => updateBoardApproval({ alignment: opt.value })}
                                  className="flex-1 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer"
                                  style={{
                                    background: boardApproval.alignment === opt.value ? "hsl(var(--primary) / 0.1)" : "hsl(var(--muted) / 0.4)",
                                    color: boardApproval.alignment === opt.value ? "#1c63a6" : "hsl(var(--muted-foreground))",
                                    border: boardApproval.alignment === opt.value ? "1px solid hsl(var(--primary) / 0.3)" : "1px solid transparent",
                                  }}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Signature Line Toggle */}
                          <SettingRow label="Show signature line">
                            <Switch
                              checked={boardApproval.showSignatureLine}
                              onCheckedChange={(checked) => updateBoardApproval({ showSignatureLine: checked })}
                            />
                          </SettingRow>

                          <InfoNote text={`${boardApproval.members.length} member${boardApproval.members.length > 1 ? "s" : ""} will appear on the Balance Sheet`} />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </AccordionSection>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FSSettingsPanel;
