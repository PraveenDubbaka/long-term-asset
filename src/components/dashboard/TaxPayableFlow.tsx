import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Link, Database, FileText, ClipboardCheck, Undo2 } from "lucide-react";


interface TaxPayableFlowProps {
  onActivity: (text: string, status: "done" | "processing" | "pending", highlight?: boolean) => void;
  activityMinimized: boolean;
}

const processingSteps = [
  { text: "Checking source connection...", icon: Link, delay: 0 },
  { text: "Connected to QuickBooks", icon: Database, delay: 1500 },
  { text: "Pulling Trial Balance data...", icon: FileText, delay: 3000 },
  { text: "Checking for required inputs...", icon: ClipboardCheck, delay: 4500 },
];

const proceedProcessingSteps = [
  { text: "Scanning general ledger...", delay: 0 },
  { text: "Identifying non-deductible items...", delay: 2000 },
  { text: "Generating presentation...", delay: 4000 },
];

const trialBalanceData = [
  { description: "Revenue", value: "8,450,000.00" },
  { description: "Total Expenses", value: "7,204,400.00" },
  { description: "Net Income Before Tax", value: "1,245,600.00" },
];

const nonDeductibleData = [
  { account: "6410 - Meals & Entertainment", glBalance: "$48,000", flag: "50% add" },
  { account: "6520 - Penalties & Fines", glBalance: "$12,500", flag: "100% add" },
  { account: "6600 - Life Insurance Premiums", glBalance: "$9,200", flag: "100% add" },
  { account: "6710 - Political Donations", glBalance: "$2,000", flag: "100% add" },
  { account: "6800 - Golf/Club Memberships", glBalance: "$6,300", flag: "100% add" },
];

// Stable components defined outside to prevent remounts
const LukaAvatar = () => (
  <div
    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
    style={{
      background: "linear-gradient(135deg, hsl(270 60% 55% / 0.15), hsl(207 71% 38% / 0.12))",
      border: "1.5px solid hsl(270 60% 55% / 0.3)",
    }}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="luka-done-tax" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9747FF" />
          <stop offset="100%" stopColor="#115697" />
        </linearGradient>
      </defs>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#luka-done-tax)" />
    </svg>
  </div>
);

const TrialBalanceTable = () => (
  <div className="rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
    <table className="w-full text-base">
      <thead>
        <tr style={{ background: "hsl(var(--table-header-bg))", borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
          <th className="text-left px-4 py-2.5 text-[14px] font-semibold" style={{ color: "hsl(var(--foreground))" }}>Description</th>
          <th className="text-right px-4 py-2.5 text-[14px] font-semibold" style={{ color: "hsl(var(--foreground))" }}>Amount ($)</th>
        </tr>
      </thead>
      <tbody>
        {trialBalanceData.map((row, i) => (
          <tr
            key={i}
            style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}
            className="cursor-default hover:bg-[hsl(220_20%_97%)]"
          >
            <td className="px-4 py-2.5 text-[15px] font-medium" style={{ color: "hsl(var(--foreground))" }}>
              {row.description}
            </td>
            <td className="px-4 py-2.5 text-[15px] text-right font-mono font-bold" style={{ color: "hsl(var(--foreground))" }}>
              {row.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const NonDeductibleTable = () => (
  <div className="rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
    <table className="w-full text-base">
      <thead>
        <tr style={{ background: "hsl(var(--table-header-bg))", borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
          <th className="text-left px-4 py-2.5 text-[14px] font-semibold" style={{ color: "hsl(var(--foreground))" }}>Account</th>
          <th className="text-right px-4 py-2.5 text-[14px] font-semibold" style={{ color: "hsl(var(--foreground))" }}>GL Balance</th>
          <th className="text-right px-4 py-2.5 text-[14px] font-semibold" style={{ color: "hsl(var(--foreground))" }}>Flag</th>
        </tr>
      </thead>
      <tbody>
        {nonDeductibleData.map((row, i) => (
          <tr
            key={i}
            style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}
            className="cursor-default hover:bg-[hsl(220_20%_97%)]"
          >
            <td className="px-4 py-2.5 text-[15px] font-medium" style={{ color: "hsl(var(--foreground))" }}>
              {row.account}
            </td>
            <td className="px-4 py-2.5 text-[15px] text-right font-mono font-bold" style={{ color: "hsl(var(--foreground))" }}>
              {row.glBalance}
            </td>
            <td className="px-4 py-2.5 text-[15px] text-right font-medium" style={{ color: "hsl(var(--foreground))" }}>
              {row.flag}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ProcessingBubble = () => (
  <div className="flex items-start gap-3">
    <motion.div
      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
      style={{
        background: "linear-gradient(135deg, hsl(270 60% 55% / 0.12), hsl(207 71% 38% / 0.10))",
        border: "1.5px solid hsl(270 60% 55% / 0.25)",
      }}
      animate={{
        scale: [1, 1.12, 1],
        boxShadow: [
          "0 0 0px hsl(270 60% 55% / 0)",
          "0 0 20px hsl(270 60% 55% / 0.25)",
          "0 0 0px hsl(270 60% 55% / 0)",
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="luka-breathing-tax" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9747FF" />
              <stop offset="100%" stopColor="#115697" />
            </linearGradient>
          </defs>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#luka-breathing-tax)" />
        </svg>
      </motion.div>
    </motion.div>
    <div className="pt-2">
      <motion.p
        className="text-sm font-medium"
        style={{ color: "hsl(var(--muted-foreground))" }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        Luka is processing…
      </motion.p>
    </div>
  </div>
);

const TaxPayableFlow = ({ onActivity, activityMinimized }: TaxPayableFlowProps) => {
  const [isComplete, setIsComplete] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [showReselected, setShowReselected] = useState(false);
  const [proceedPhase, setProceedPhase] = useState<"idle" | "processing" | "done">("idle");
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);
  const hasProceedStarted = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    onActivity("Tax Payable analysis initiated", "done", true);

    processingSteps.forEach((step, i) => {
      setTimeout(() => {
        onActivity(step.text, "processing");
      }, step.delay);

      setTimeout(() => {
        onActivity(step.text, "done");
        if (i === processingSteps.length - 1) {
          setTimeout(() => {
            setIsComplete(true);
            onActivity("Trial Balance data extracted", "done", true);
          }, 800);
        }
      }, step.delay + 1200);
    });
  }, [onActivity]);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
    }
  }, [isComplete, showUpload, showReselected, proceedPhase]);

  const handleUploadClick = () => {
    setShowUpload(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file.name);
    }
  };

  const handleReselect = () => {
    setShowUpload(false);
    setUploadedFile(null);
    setShowReselected(true);
  };

  const handleReselectedUpload = () => {
    setShowReselected(false);
    setShowUpload(true);
  };

  const handleProceed = () => {
    if (hasProceedStarted.current) return;
    hasProceedStarted.current = true;
    setProceedPhase("processing");

    onActivity("Proceeding with Tax Payable analysis", "done", true);

    proceedProcessingSteps.forEach((step, i) => {
      setTimeout(() => {
        onActivity(step.text, "processing");
      }, step.delay);

      setTimeout(() => {
        onActivity(step.text, "done");
        if (i === proceedProcessingSteps.length - 1) {
          setTimeout(() => {
            setProceedPhase("done");
            onActivity("Non-deductible items identified", "done", true);
          }, 800);
        }
      }, step.delay + 1500);
    });
  };

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto text-base"
      style={{ scrollbarWidth: "none", fontSize: "16px" }}
    >
      <div className={`w-full pl-8 py-6 space-y-6 ${activityMinimized ? 'pr-8' : 'pr-[320px]'}`}>

        {/* User message */}
        <div className="flex items-start gap-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
            style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
          >
            S
          </div>
          <p className="text-base pt-1" style={{ color: "hsl(var(--foreground))" }}>Tax Payable</p>
        </div>

        {/* Breathing Luka animation while initial processing */}
        {!isComplete && <ProcessingBubble />}

        {/* Completion */}
        {isComplete && (
          <div>
            {/* Luka completion message with avatar */}
            <div className="flex items-start gap-3 mb-4">
              <LukaAvatar />
              <p className="text-[15px] pt-1 leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
                I've parsed your trial balance. Here's the data I found. Click proceed to confirm.
              </p>
            </div>

            {/* Trial Balance table */}
            <TrialBalanceTable />

            {/* Action buttons - only show when upload box is not visible and not reselected and proceed not started */}
            {!showUpload && !showReselected && proceedPhase === "idle" && (
              <div className="flex gap-2 mt-4 justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleProceed}
                  className="px-5 py-2.5 rounded-xl text-[16px] font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, hsl(270 70% 55%), hsl(220 80% 55%))" }}
                >
                  Proceed
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUploadClick}
                  className="px-5 py-2.5 rounded-xl text-[16px] font-semibold flex items-center gap-2"
                  style={{ color: "hsl(var(--foreground))", background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
                >
                  <Upload size={14} />
                  Upload Income Statement
                </motion.button>
              </div>
            )}

            {/* Upload box */}
            <AnimatePresence>
              {showUpload && proceedPhase === "idle" && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="mt-5 space-y-4"
                >
                  {/* Disabled CTAs */}
                  <div className="flex gap-2 justify-end">
                    <button
                      disabled
                      className="px-5 py-2.5 rounded-xl text-[16px] font-semibold text-white opacity-40 cursor-not-allowed"
                      style={{ background: "linear-gradient(135deg, hsl(270 70% 55%), hsl(220 80% 55%))" }}
                    >
                      Proceed
                    </button>
                    <button
                      disabled
                      className="px-5 py-2.5 rounded-xl text-[16px] font-semibold flex items-center gap-2 opacity-40 cursor-not-allowed"
                      style={{ color: "hsl(var(--foreground))", background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
                    >
                      <Upload size={14} />
                      Upload Income Statement
                    </button>
                  </div>

                  {/* Upload area */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors hover:border-primary/40"
                    style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.3)" }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.csv,.xlsx,.xls"
                      onChange={handleFileChange}
                    />
                    <Upload size={28} style={{ color: "hsl(var(--muted-foreground))" }} />
                    {uploadedFile ? (
                      <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                        {uploadedFile}
                      </p>
                    ) : (
                      <>
                        <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                          Click to upload Income Statement
                        </p>
                        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                          Supports PDF, CSV, XLSX
                        </p>
                      </>
                    )}
                  </div>

                  {/* Reselect CTA */}
                  <div className="flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleReselect}
                      className="px-4 py-2 rounded-xl text-[16px] font-semibold flex items-center gap-2"
                      style={{ color: "hsl(var(--foreground))", background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
                    >
                      <Undo2 size={13} />
                      Reselect
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reselected: show CTAs */}
            <AnimatePresence>
              {showReselected && proceedPhase === "idle" && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4"
                >
                  <div className="flex gap-2 justify-end">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleProceed}
                      className="px-5 py-2.5 rounded-xl text-[16px] font-semibold text-white"
                      style={{ background: "linear-gradient(135deg, hsl(270 70% 55%), hsl(220 80% 55%))" }}
                    >
                      Proceed
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleReselectedUpload}
                      className="px-5 py-2.5 rounded-xl text-[16px] font-semibold flex items-center gap-2"
                      style={{ color: "hsl(var(--foreground))", background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
                    >
                      <Upload size={14} />
                      Upload Income Statement
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Disabled CTAs + Processing when Proceed is clicked */}
            {proceedPhase !== "idle" && (
              <div className="mt-4 space-y-6">
                <div className="flex gap-2 justify-end">
                  <button
                    disabled
                    className="px-5 py-2.5 rounded-xl text-[16px] font-semibold text-white opacity-40 cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, hsl(270 70% 55%), hsl(220 80% 55%))" }}
                  >
                    Proceed
                  </button>
                  <button
                    disabled
                    className="px-5 py-2.5 rounded-xl text-[16px] font-semibold flex items-center gap-2 opacity-40 cursor-not-allowed"
                    style={{ color: "hsl(var(--foreground))", background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
                  >
                    <Upload size={14} />
                    Upload Income Statement
                  </button>
                </div>

                {/* Processing bubble */}
                {proceedPhase === "processing" && <ProcessingBubble />}
              </div>
            )}

            {/* Proceed Phase: Done - Non-deductible items */}
            {proceedPhase === "done" && (
              <div className="mt-6">
                <div className="flex items-start gap-3 mb-4">
                  <LukaAvatar />
                  <p className="text-[15px] pt-1 leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
                    Based on your General Ledger, I've flagged the following accounts that commonly contain non-deductible items:
                  </p>
                </div>

                <NonDeductibleTable />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxPayableFlow;
