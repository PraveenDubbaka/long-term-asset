import { useState } from "react";
import { CheckCircle2, AlertTriangle, Lock, MoreHorizontal, Zap, ClipboardList, Mail, FolderOpen, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AutopilotVerification } from "./AutopilotVerification";
import { AutopilotChecklists } from "./AutopilotChecklists";
import { AutopilotLetters } from "./AutopilotLetters";
import { AutopilotWorkingPapers } from "./AutopilotWorkingPapers";
import { AutopilotFSMapping } from "./AutopilotFSMapping";
import { AutopilotMagic } from "./AutopilotMagic";
import type { Loan, EngagementSettings } from "@/types";

type AutopilotStep = "verification" | "checklists" | "letters" | "workingpapers" | "fsmapping" | "magic";
type StepStatus = "locked" | "active" | "warning" | "complete";

interface StepDef {
  id: AutopilotStep;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}

const steps: StepDef[] = [
  { id: "verification", label: "Verification", shortLabel: "Verify", icon: <MoreHorizontal className="w-3.5 h-3.5" /> },
  { id: "checklists", label: "Checklists", shortLabel: "Checklist", icon: <ClipboardList className="w-3.5 h-3.5" /> },
  { id: "letters", label: "Letters", shortLabel: "Letters", icon: <Mail className="w-3.5 h-3.5" /> },
  { id: "workingpapers", label: "Working Papers", shortLabel: "WPs", icon: <FolderOpen className="w-3.5 h-3.5" /> },
  { id: "fsmapping", label: "FS & Mapping", shortLabel: "FS", icon: <BarChart2 className="w-3.5 h-3.5" /> },
  { id: "magic", label: "Magic", shortLabel: "Magic", icon: <Zap className="w-3.5 h-3.5" /> },
];

interface Props {
  loan: Loan;
  settings: EngagementSettings;
  onStartMagic: () => void;
}

export function LukaAutopilotWizard({ loan, settings, onStartMagic }: Props) {
  const [currentStep, setCurrentStep] = useState<AutopilotStep>("verification");
  const [stepStatuses, setStepStatuses] = useState<Record<AutopilotStep, StepStatus>>({
    verification: "active",
    checklists: "locked",
    letters: "locked",
    workingpapers: "locked",
    fsmapping: "locked",
    magic: "locked",
  });

  const unlockAll = (hasWarning: boolean) => {
    setStepStatuses({
      verification: hasWarning ? "warning" : "complete",
      checklists: "active",
      letters: "active",
      workingpapers: "active",
      fsmapping: "active",
      magic: "active",
    });
  };

  const markComplete = (step: AutopilotStep) => {
    setStepStatuses(prev => ({ ...prev, [step]: "complete" }));
  };

  const handleTabClick = (stepId: AutopilotStep) => {
    if (stepStatuses[stepId] === "locked") return;
    setCurrentStep(stepId);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Step tab bar */}
      <div className="flex items-stretch border-b border-border bg-muted/20 overflow-x-auto scrollbar-none shrink-0">
        {steps.map(step => {
          const status = stepStatuses[step.id];
          const isActive = currentStep === step.id;
          const isLocked = status === "locked";

          return (
            <button
              key={step.id}
              onClick={() => handleTabClick(step.id)}
              disabled={isLocked}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-all shrink-0",
                isActive
                  ? "border-primary text-primary bg-primary/5"
                  : isLocked
                    ? "border-transparent text-foreground cursor-not-allowed"
                    : status === "complete"
                      ? "border-transparent text-green-600 hover:bg-green-500/5"
                      : status === "warning"
                        ? "border-transparent text-amber-600 hover:bg-amber-500/5"
                        : "border-transparent text-foreground hover:bg-muted/40 hover:text-foreground"
              )}
            >
              {status === "complete" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
              ) : status === "warning" ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              ) : status === "locked" ? (
                <Lock className="w-3 h-3 shrink-0" />
              ) : (
                step.icon
              )}
              <span>{step.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {currentStep === "verification" && (
          <AutopilotVerification
            loan={loan}
            settings={settings}
            onComplete={(hasWarning) => {
              unlockAll(hasWarning);
              setTimeout(() => setCurrentStep("checklists"), 800);
            }}
          />
        )}
        {currentStep === "checklists" && (
          <AutopilotChecklists
            loan={loan}
            onComplete={() => {
              markComplete("checklists");
              setCurrentStep("letters");
            }}
          />
        )}
        {currentStep === "letters" && (
          <AutopilotLetters
            loan={loan}
            onComplete={() => {
              markComplete("letters");
              setCurrentStep("workingpapers");
            }}
          />
        )}
        {currentStep === "workingpapers" && (
          <AutopilotWorkingPapers
            loan={loan}
            onComplete={() => {
              markComplete("workingpapers");
              setCurrentStep("fsmapping");
            }}
          />
        )}
        {currentStep === "fsmapping" && (
          <AutopilotFSMapping
            loan={loan}
            onComplete={() => {
              markComplete("fsmapping");
              setCurrentStep("magic");
            }}
          />
        )}
        {currentStep === "magic" && (
          <AutopilotMagic
            loan={loan}
            onStartMagic={onStartMagic}
          />
        )}
      </div>
    </div>
  );
}
