import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import lukaLogo from "@/assets/luka-logo.png";
import LukaCreditsEstimator from "./LukaCreditsEstimator";
import { Database, HardDrive, FileSpreadsheet, Cloud } from "lucide-react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Users,
  FileCheck,
  CheckCircle2,
  Briefcase,
  BarChart3,
  Shield,
  Globe,
  Landmark,
  Factory,
  ShoppingCart,
  Heart,
  GraduationCap,
  Cpu,
  Zap,
  X,
} from "lucide-react";

interface EngagementWizardProps {
  onClose: () => void;
}

const steps = [
  {
    title: "What type of engagement is this?",
    label: "Engagement Type",
    options: [
      { label: "Financial Audit", icon: <BarChart3 size={16} /> },
      { label: "Tax Compliance", icon: <FileCheck size={16} /> },
      { label: "Advisory", icon: <Briefcase size={16} /> },
      { label: "Review Engagement", icon: <Shield size={16} /> },
      { label: "Compilation", icon: <Building2 size={16} /> },
      { label: "Internal Audit", icon: <CheckCircle2 size={16} /> },
    ],
  },
  {
    title: "Select the client's industry",
    label: "Industry",
    options: [
      { label: "Technology", icon: <Cpu size={16} /> },
      { label: "Healthcare", icon: <Heart size={16} /> },
      { label: "Financial Services", icon: <Landmark size={16} /> },
      { label: "Manufacturing", icon: <Factory size={16} /> },
      { label: "Retail / E-commerce", icon: <ShoppingCart size={16} /> },
      { label: "Education", icon: <GraduationCap size={16} /> },
      { label: "Government", icon: <Globe size={16} /> },
      { label: "Energy", icon: <Zap size={16} /> },
    ],
  },
  {
    title: "Who will be on the engagement team?",
    label: "Team",
    options: [
      { label: "Sarah Chen", icon: <Users size={16} /> },
      { label: "James Wilson", icon: <Users size={16} /> },
      { label: "Maya Patel", icon: <Users size={16} /> },
      { label: "Alex Rivera", icon: <Users size={16} /> },
      { label: "Jordan Lee", icon: <Users size={16} /> },
      { label: "Taylor Kim", icon: <Users size={16} /> },
    ],
    multiSelect: true,
  },
  {
    title: "Choose your reporting period",
    label: "Period",
    options: [
      { label: "Q1 2025", icon: <Calendar size={16} /> },
      { label: "Q2 2025", icon: <Calendar size={16} /> },
      { label: "Q3 2025", icon: <Calendar size={16} /> },
      { label: "Q4 2025", icon: <Calendar size={16} /> },
      { label: "FY 2024", icon: <Calendar size={16} /> },
      { label: "FY 2025", icon: <Calendar size={16} /> },
    ],
  },
];

const stepIcons = [
  <BarChart3 size={13} />,
  <Globe size={13} />,
  <Users size={13} />,
  <Calendar size={13} />,
];

const defaultDataSources = [
  { name: "QuickBooks", icon: <Database size={11} />, files: 24, connected: false },
  { name: "SharePoint", icon: <HardDrive size={11} />, files: 18, connected: false },
  { name: "Excel Imports", icon: <FileSpreadsheet size={11} />, files: 0, connected: false },
  { name: "Cloud Storage", icon: <Cloud size={11} />, files: 0, connected: false },
];

const EngagementWizard = ({ onClose }: EngagementWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<number, string[]>>({});
  const [dataSources, setDataSources] = useState(defaultDataSources);

  // Auto-connect data sources as user progresses through steps
  const handleStepChange = (nextStep: number) => {
    setCurrentStep(nextStep);
    // Simulate data source connections as engagement gets configured
    if (nextStep >= 1) {
      setDataSources((prev) =>
        prev.map((d, i) =>
          i === 0 ? { ...d, connected: true, files: 24 } : d
        )
      );
    }
    if (nextStep >= 2) {
      setDataSources((prev) =>
        prev.map((d, i) =>
          i === 1 ? { ...d, connected: true, files: 18 } : d
        )
      );
    }
    if (nextStep >= 3) {
      setDataSources((prev) =>
        prev.map((d, i) =>
          i === 2 ? { ...d, connected: true, files: 12 } : d
        )
      );
    }
  };

  const step = steps[currentStep];
  const isMulti = !!(step as any).multiSelect;
  const selected = selections[currentStep] || [];

  const toggleSelection = (label: string) => {
    if (isMulti) {
      setSelections((prev) => ({
        ...prev,
        [currentStep]: selected.includes(label)
          ? selected.filter((s) => s !== label)
          : [...selected, label],
      }));
    } else {
      setSelections((prev) => ({ ...prev, [currentStep]: [label] }));
      setTimeout(() => {
        if (currentStep < steps.length - 1) {
          handleStepChange(currentStep + 1);
        }
      }, 400);
    }
  };

  const canGoNext = selected.length > 0;

  // Gather all selections made so far
  const hasAnySelection = Object.keys(selections).some((k) => (selections[Number(k)]?.length ?? 0) > 0);

  return (
    <div className="engagement-wizard-overlay">
      <div className="engagement-wizard-bg" />

      <div className="engagement-wizard-container relative" style={{ maxWidth: "920px" }}>
        {/* Close button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{
            background: "hsl(220 20% 94%)",
            color: "hsl(220 15% 45%)",
          }}
          title="Close"
        >
          <X size={14} />
        </motion.button>
        {/* Progress bar */}
        <div className="engagement-wizard-progress-bar">
          {steps.map((_, i) => (
            <div key={i} className="engagement-wizard-progress-segment">
              <motion.div
                className="engagement-wizard-progress-fill"
                initial={false}
                animate={{ scaleX: i <= currentStep ? 1 : 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          {/* Main Card */}
          <motion.div
            className="engagement-wizard-card flex-1"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            {/* Luka logo with breathing animation */}
            <div className="flex items-center gap-2.5 mb-5">
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                  opacity: [0.9, 1, 0.9],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #9747FF, #115697)" }}
              >
                <img src={lukaLogo} alt="Luka" className="w-5 h-5 object-contain" />
              </motion.div>
              <span
                className="text-base font-bold"
                style={{
                  background: "linear-gradient(135deg, #9747FF, #115697)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Luka Setup
              </span>
            </div>

            {/* Back + Step indicator */}
            <div className="flex items-center gap-3 mb-5">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => (currentStep > 0 ? handleStepChange(currentStep - 1) : onClose())}
                className="engagement-wizard-back-btn"
              >
                <ArrowLeft size={16} />
              </motion.button>
              <span className="text-xs font-medium" style={{ color: "hsl(220 15% 55%)" }}>
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="text-lg font-bold mb-6" style={{ color: "hsl(220 20% 15%)" }}>
                  {step.title}
                </h2>

                <div className="engagement-wizard-options">
                  {step.options.map((opt) => {
                    const isSelected = selected.includes(opt.label);
                    return (
                      <motion.button
                        key={opt.label}
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => toggleSelection(opt.label)}
                        className={`engagement-wizard-chip ${isSelected ? "engagement-wizard-chip--selected" : ""}`}
                      >
                        <span className="engagement-wizard-chip-icon">{opt.icon}</span>
                        <span>{opt.label}</span>
                        {isSelected && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-auto"
                          >
                            <CheckCircle2 size={14} style={{ color: "hsl(207 71% 38%)" }} />
                          </motion.span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            {(isMulti || currentStep === steps.length - 1) && (
              <div className="flex justify-end mt-6">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={!canGoNext}
                  onClick={() => {
                    if (currentStep < steps.length - 1) {
                      handleStepChange(currentStep + 1);
                    } else {
                      onClose();
                    }
                  }}
                  className="engagement-wizard-next-btn"
                  style={{ opacity: canGoNext ? 1 : 0.4 }}
                >
                  {currentStep === steps.length - 1 ? "Create Engagement" : "Continue"}
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Right Summary Panel */}
          <AnimatePresence>
            {hasAnySelection && (
              <motion.div
                initial={{ opacity: 0, x: 20, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 240 }}
                exit={{ opacity: 0, x: 20, width: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="shrink-0 overflow-hidden"
              >
                <div
                  className="rounded-2xl border p-4 h-full"
                  style={{
                    borderColor: "hsl(var(--border))",
                    background: "hsl(var(--card) / 0.85)",
                    backdropFilter: "blur(16px)",
                  }}
                >
                  {/* Summary header */}
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: "hsl(var(--border))" }}>
                    <motion.div
                      animate={{
                        scale: [1, 1.06, 1],
                        opacity: [0.85, 1, 0.85],
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                      style={{ background: "linear-gradient(135deg, #9747FF, #115697)" }}
                    >
                      <img src={lukaLogo} alt="Luka" className="w-3.5 h-3.5 object-contain" />
                    </motion.div>
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "hsl(220 15% 50%)" }}>
                      Summary
                    </span>
                  </div>

                  {/* Selections */}
                  <div className="space-y-4">
                    {steps.map((s, stepIdx) => {
                      const stepSelections = selections[stepIdx] || [];
                      if (stepSelections.length === 0) return null;
                      return (
                        <motion.div
                          key={stepIdx}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 }}
                        >
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span style={{ color: "hsl(var(--primary))" }}>{stepIcons[stepIdx]}</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "hsl(220 15% 50%)" }}>
                              {s.label}
                            </span>
                            {stepIdx < currentStep && (
                              <CheckCircle2 size={10} style={{ color: "hsl(145 63% 42%)" }} className="ml-auto" />
                            )}
                          </div>
                          <div className="space-y-1">
                            {stepSelections.map((sel) => (
                              <motion.div
                                key={sel}
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-[12px] font-medium px-2.5 py-1.5 rounded-lg"
                                style={{
                                  color: "hsl(220 20% 20%)",
                                  background: "hsl(var(--primary) / 0.05)",
                                  border: "1px solid hsl(var(--primary) / 0.1)",
                                }}
                              >
                                {sel}
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Completion indicator */}
                  <div className="mt-5 pt-3 border-t" style={{ borderColor: "hsl(var(--border))" }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold" style={{ color: "hsl(220 15% 50%)" }}>Progress</span>
                      <span className="text-[10px] font-bold" style={{ color: "hsl(var(--primary))" }}>
                        {Object.keys(selections).filter((k) => (selections[Number(k)]?.length ?? 0) > 0).length}/{steps.length}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(220 20% 92%)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, #9747FF, #115697)" }}
                        initial={{ width: "0%" }}
                        animate={{
                          width: `${(Object.keys(selections).filter((k) => (selections[Number(k)]?.length ?? 0) > 0).length / steps.length) * 100}%`,
                        }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Credits Estimator */}
                  <LukaCreditsEstimator
                    selections={selections}
                    dataSources={dataSources}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default EngagementWizard;
