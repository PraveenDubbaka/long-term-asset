import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LukaCreditsEstimator from "./LukaCreditsEstimator";
import quickbooksLogo from "@/assets/quickbooks-logo.png";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Briefcase,
  BarChart3,
  Shield,
  FileCheck,
  Users,
  Hash,
  Zap,
  Check,
  Cloud,
  Mail,
  MessageSquare,
  FolderOpen,
  CircleDot,
  Search,
  LayoutList,
  LayoutGrid,
  ArrowUpDown,
  Lock,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";

interface AutomationIntakeWizardProps {
  onComplete: () => void;
  onBack: () => void;
}

const clients = [
  { label: "Alpha Industries", id: "alpha", dateJoined: "Jan 15, 2021" },
  { label: "Beta Industries", id: "beta", dateJoined: "Mar 08, 2022" },
  { label: "Gamma Pvt. Ltd.", id: "gamma", dateJoined: "Jul 22, 2020" },
  { label: "Zinc Pickles Pvt. Ltd.", id: "zinc", dateJoined: "Nov 03, 2023" },
  { label: "ABC Pvt. Ltd", id: "abc", dateJoined: "Feb 14, 2019" },
  { label: "Delta Corp", id: "delta", dateJoined: "Sep 30, 2022" },
  { label: "Omega Solutions", id: "omega", dateJoined: "Apr 18, 2021" },
  { label: "Nova Enterprises", id: "nova", dateJoined: "Jun 05, 2023" },
  { label: "Summit Holdings", id: "summit", dateJoined: "Dec 12, 2020" },
  { label: "Pinnacle Group", id: "pinnacle", dateJoined: "Aug 27, 2022" },
];

const engagementTypes = [
  { label: "Financial Audit", icon: <BarChart3 size={16} /> },
  { label: "Tax Compliance", icon: <FileCheck size={16} /> },
  { label: "Advisory", icon: <Briefcase size={16} /> },
  { label: "Review Engagement", icon: <Shield size={16} /> },
  { label: "Compilation", icon: <Building2 size={16} /> },
  { label: "Internal Audit", icon: <CheckCircle2 size={16} /> },
];

const engagements = [
  { id: "COM-DEF-May312024", entity: "Phoenix Marie", yearEnd: "22 Jan 2022", source: "QuickBooks", color: "hsl(145 63% 42%)", status: "Active", dateCreated: "Aug 31, 2024, 04:25 PM", team: ["SC", "JW"] },
  { id: "COM-DEF-Dec312024", entity: "Circooles", yearEnd: "20 Jan 2022", source: "Xero", color: "hsl(207 71% 38%)", status: "Active", dateCreated: "Dec 31, 2024, 04:25 PM", team: ["MP", "AR"] },
  { id: "COM-DEF-Dec312024b", entity: "Command+R", yearEnd: "24 Jan 2022", source: "QuickBooks", color: "hsl(145 63% 42%)", status: "Active", dateCreated: "Jun 25, 2024, 04:25 PM", team: ["JL", "TK"] },
  { id: "REV-DEF-Dec312024", entity: "Hourglass", yearEnd: "26 Jan 2022", source: "QuickBooks", color: "hsl(145 63% 42%)", status: "Active", dateCreated: "Dec 31, 2024, 04:25 PM", team: ["SC", "MP"] },
  { id: "REV-DEF-Dec312024b", entity: "Layers", yearEnd: "18 Jan 2022", source: "Xero", color: "hsl(207 71% 38%)", status: "Active", dateCreated: "Dec 31, 2024, 04:25 PM", team: ["JW", "AR"] },
  { id: "COM-DEF-Dec312024c", entity: "Quotient", yearEnd: "28 Jan 2022", source: "QuickBooks", color: "hsl(145 63% 42%)", status: "Active", dateCreated: "Jun 25, 2024, 04:25 PM", team: ["TK", "SC"] },
  { id: "REV-DEF-Dec312024c", entity: "Sisyphus", yearEnd: "16 Jan 2022", source: "Xero", color: "hsl(207 71% 38%)", status: "Active", dateCreated: "Jun 25, 2024, 04:25 PM", team: ["MP", "JL"] },
  { id: "COM-ALP-Dec312024", entity: "Alpha Industries", yearEnd: "31 Dec 2024", source: "QuickBooks", color: "hsl(145 63% 42%)", status: "Active", dateCreated: "Jan 27, 2026, 08:22 AM", team: ["SC", "JW", "MP"] },
];

const teamMembers = [
  { label: "Sarah Chen", initials: "SC", role: "Partner", color: "hsl(195 70% 38%)" },
  { label: "James Wilson", initials: "JW", role: "Reviewer", color: "hsl(210 55% 42%)" },
  { label: "Maya Patel", initials: "MP", role: "Preparer", color: "hsl(180 50% 35%)" },
  { label: "Alex Rivera", initials: "AR", role: "Admin", color: "hsl(200 60% 40%)" },
  { label: "Jordan Lee", initials: "JL", role: "Preparer", color: "hsl(188 55% 36%)" },
  { label: "Taylor Kim", initials: "TK", role: "Super Admin", color: "hsl(205 50% 44%)" },
];

interface ConnectorSource {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  connected: boolean;
  files?: { name: string; status: "Pulled" | "Current" | "New" | "Synced" }[];
}

const connectorSources: ConnectorSource[] = [
  {
    id: "quickbooks",
    name: "QuickBooks Online",
    subtitle: "Accounting Software",
    icon: <img src={quickbooksLogo} alt="QuickBooks" className="w-5 h-5 object-contain" />,
    iconBg: "hsl(145 63% 42%)",
    connected: true,
    files: [
      { name: "PY1 Trial Balance", status: "Pulled" },
      { name: "CY Trial Balance", status: "Current" },
    ],
  },
  {
    id: "google-drive",
    name: "Google Drive",
    subtitle: "Cloud Storage",
    icon: <FolderOpen size={18} />,
    iconBg: "hsl(40 90% 50%)",
    connected: false,
    files: [],
  },
  {
    id: "slack",
    name: "Slack",
    subtitle: "Communication",
    icon: <MessageSquare size={18} />,
    iconBg: "hsl(340 70% 55%)",
    connected: false,
    files: [],
  },
  {
    id: "plaid",
    name: "Plaid",
    subtitle: "Banking Data",
    icon: <BarChart3 size={18} />,
    iconBg: "hsl(160 60% 42%)",
    connected: false,
    files: [],
  },
  {
    id: "onedrive",
    name: "OneDrive",
    subtitle: "Cloud Storage",
    icon: <Cloud size={18} />,
    iconBg: "hsl(210 80% 55%)",
    connected: false,
    files: [],
  },
  {
    id: "email",
    name: "Email",
    subtitle: "Correspondence",
    icon: <Mail size={18} />,
    iconBg: "hsl(220 15% 50%)",
    connected: false,
    files: [],
  },
];

type StepKey = "client" | "type" | "engagement" | "team" | "connectors";

const stepOrder: StepKey[] = ["client", "type", "engagement", "team", "connectors"];

const stepTitles: Record<StepKey, string> = {
  client: "Select the client",
  type: "What type of engagement is this?",
  engagement: "Select Engagement",
  team: "Confirm your team members",
  connectors: "Connect Your Data Sources",
};

const fileStatusColor: Record<string, { color: string; bg: string }> = {
  Pulled: { color: "hsl(145 63% 32%)", bg: "hsl(145 63% 93%)" },
  Current: { color: "hsl(207 71% 26%)", bg: "hsl(207 71% 80%)" },
  New: { color: "hsl(30 90% 40%)", bg: "hsl(30 90% 93%)" },
  Synced: { color: "hsl(145 63% 32%)", bg: "hsl(145 63% 93%)" },
};

const connectorCompletionData: Record<string, { badge: string; highlight?: string; files?: { name: string; status: "Pulled" | "Current" | "New" | "Synced" }[] }> = {
  "google-drive": {
    badge: "4 Checklists Pulled",
    highlight: "Financial Statements 2023",
    files: [
      { name: "Financial Statements 2023", status: "Pulled" },
      { name: "Client Acceptance Checklist", status: "Pulled" },
      { name: "Independence Checklist", status: "Pulled" },
      { name: "Planning Checklist", status: "Pulled" },
      { name: "Knowledge of Business", status: "Pulled" },
    ],
  },
  slack: {
    badge: "Client Communications Imported",
    files: [
      { name: "Client email threads", status: "Synced" },
      { name: "Team discussions", status: "Synced" },
    ],
  },
  plaid: {
    badge: "2 Bank Accounts Identified",
    files: [
      { name: "Operating Account ****4521", status: "Synced" },
      { name: "Savings Account ****7890", status: "Synced" },
    ],
  },
};

const AutomationIntakeWizard = ({ onComplete, onBack }: AutomationIntakeWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<number, string[]>>({});
  const [connectedSources, setConnectedSources] = useState<string[]>(["quickbooks"]);
  const [loadingSources, setLoadingSources] = useState<string[]>([]);
  const [loadedSources, setLoadedSources] = useState<string[]>([]);
  const [engagementSearch, setEngagementSearch] = useState("");
  const [engagementView, setEngagementView] = useState<"list" | "card">("list");
  const [clientSearch, setClientSearch] = useState("");
  const loadingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const stepKey = stepOrder[currentStep];
  const selected = selections[currentStep] || [];
  const isMulti = stepKey === "team";
  const isConnectors = stepKey === "connectors";

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
        if (currentStep < stepOrder.length - 1) {
          setCurrentStep((s) => s + 1);
        }
      }, 400);
    }
  };

  const toggleConnector = (id: string) => {
    if (connectedSources.includes(id)) {
      setConnectedSources((prev) => prev.filter((s) => s !== id));
      setLoadedSources((prev) => prev.filter((s) => s !== id));
      return;
    }
    if (loadingSources.includes(id)) return;
    
    // Start loading
    setLoadingSources((prev) => [...prev, id]);
    loadingTimers.current[id] = setTimeout(() => {
      setLoadingSources((prev) => prev.filter((s) => s !== id));
      setConnectedSources((prev) => [...prev, id]);
      setLoadedSources((prev) => [...prev, id]);
    }, 10000);
  };

  useEffect(() => {
    return () => {
      Object.values(loadingTimers.current).forEach(clearTimeout);
    };
  }, []);

  const hasLoadingConnectors = loadingSources.length > 0;
  const canGoNext = isConnectors ? (connectedSources.length > 0 && !hasLoadingConnectors) : selected.length > 0;

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const handleNext = () => {
    if (currentStep < stepOrder.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const filteredEngagements = engagements.filter(
    (e) =>
      e.entity.toLowerCase().includes(engagementSearch.toLowerCase()) ||
      e.id.toLowerCase().includes(engagementSearch.toLowerCase())
  );

  // Build all selections for the right panel (including current step)
  const buildAllSelections = () => {
    const stepLabels: Record<StepKey, string> = {
      client: "Client",
      type: "Type",
      engagement: "Engagement",
      team: "Team",
      connectors: "Sources",
    };
    const result: { label: string; stepKey: StepKey; values: string[] }[] = [];
    
    for (let i = 0; i <= currentStep; i++) {
      const key = stepOrder[i];
      if (key === "connectors") {
        if (connectedSources.length > 0) {
          const names = connectorSources
            .filter((s) => connectedSources.includes(s.id))
            .map((s) => s.name);
          result.push({ label: stepLabels[key], stepKey: key, values: names });
        }
      } else {
        const vals = selections[i];
        if (vals && vals.length > 0) {
          if (key === "team") {
            const withRoles = vals.map((name) => {
              const member = teamMembers.find((m) => m.label === name);
              return member ? `${name} (${member.role})` : name;
            });
            result.push({ label: stepLabels[key], stepKey: key, values: withRoles });
          } else {
            result.push({ label: stepLabels[key], stepKey: key, values: vals });
          }
        }
      }
    }
    return result;
  };

  const allSelections = buildAllSelections();
  const hasAnySelection = allSelections.length > 0;

  // Remap selections for LukaCreditsEstimator: it expects index 0=engagement type, 1=industry, 2=team
  const estimatorSelections = useMemo(() => {
    const mapped: Record<number, string[]> = {};
    // Step 1 (type) in this wizard → index 0 in estimator
    if (selections[1]?.length) mapped[0] = selections[1];
    // No industry step here, skip index 1
    // Step 3 (team) → index 2 in estimator
    if (selections[3]?.length) mapped[2] = selections[3];
    return mapped;
  }, [selections]);

  // Build data sources from connector state
  const estimatorDataSources = useMemo(() => {
    return connectorSources.map((src) => ({
      name: src.name,
      icon: src.icon,
      files: connectedSources.includes(src.id) ? (src.files?.length || 3) : 0,
      connected: connectedSources.includes(src.id),
    }));
  }, [connectedSources]);

  const stepIcons: Record<StepKey, React.ReactNode> = {
    client: <Building2 size={14} />,
    type: <Briefcase size={14} />,
    engagement: <Hash size={14} />,
    team: <Users size={14} />,
    connectors: <Cloud size={14} />,
  };

  return (
    <div className="engagement-wizard-overlay">
      <div className="engagement-wizard-bg" />

      {/* Close button — extreme top right of page */}
      <motion.button
        whileHover={{ scale: 1.15, rotate: 90, background: "hsl(0 72% 58%)", color: "white" }}
        whileTap={{ scale: 0.85 }}
        onClick={onBack}
        className="fixed top-4 right-4 z-50 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
        style={{
          background: "hsl(220 20% 94%)",
          color: "hsl(220 15% 45%)",
          boxShadow: "0 2px 8px hsl(220 20% 50% / 0.1)",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        title="Close"
      >
        <X size={15} strokeWidth={2.5} />
      </motion.button>

      <div className="relative z-10 flex items-center justify-center w-full max-w-5xl mx-auto px-4">
        {/* LEFT — Main Wizard */}
        <div className="engagement-wizard-container relative" style={{ margin: 0 }}>
        {/* Luka Logo + Title */}
        <div className="flex flex-col items-center mb-4">
          <motion.div
            className="w-11 h-11 rounded-2xl flex items-center justify-center mb-2"
            style={{
              background: "linear-gradient(135deg, hsl(207 71% 38%), hsl(260 70% 58%))",
            }}
            animate={{
              scale: [1, 1.06, 1],
              boxShadow: [
                "0 0 0px hsla(270, 65%, 64%, 0.15)",
                "0 0 24px hsla(270, 65%, 64%, 0.25)",
                "0 0 0px hsla(270, 65%, 64%, 0.15)",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="luka-wizard-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="white" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.85)" />
                </linearGradient>
              </defs>
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#luka-wizard-grad)" />
            </svg>
          </motion.div>
          <h1
            className="text-base font-bold tracking-tight shimmer-text"
            style={{
              background: "linear-gradient(90deg, hsl(220 20% 18%) 0%, hsl(220 20% 18%) 40%, hsl(260 60% 55%) 50%, hsl(220 20% 18%) 60%, hsl(220 20% 18%) 100%)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "shimmer-slide 3s ease-in-out infinite",
            }}
          >
            Workspace Engagement Automation Setup
          </h1>
        </div>

        {/* Progress bar */}
        <div className="engagement-wizard-progress-bar">
          {stepOrder.map((_, i) => (
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

        {/* Card + Selections panel wrapper */}
        <div className="relative">
        <motion.div
          className="engagement-wizard-card"
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          {/* Back + Step indicator */}
          <div className="flex items-center gap-3 mb-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleBack}
              className="engagement-wizard-back-btn"
            >
              <ArrowLeft size={16} />
            </motion.button>
            <span className="text-xs font-medium" style={{ color: "hsl(220 15% 55%)" }}>
              Step {currentStep + 1} of {stepOrder.length}
            </span>
          </div>

          {/* Content area - flex-1 to fill consistent height */}
          <div className="flex-1 flex flex-col min-h-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col min-h-0"
              >
                {/* Title row for engagement step includes search + view toggle */}
                {stepKey === "engagement" ? (
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-center mb-4" style={{ color: "hsl(220 20% 15%)" }}>
                      {stepTitles[stepKey]}
                    </h2>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(220 15% 60%)" }} />
                        <input
                          type="text"
                          placeholder="Search engagements..."
                          value={engagementSearch}
                          onChange={(e) => setEngagementSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl"
                          style={{
                            background: "hsl(220 25% 97%)",
                            border: "1px solid hsl(220 30% 90%)",
                            color: "hsl(220 20% 18%)",
                            outline: "none",
                          }}
                        />
                      </div>
                      <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid hsl(220 30% 90%)" }}>
                        <button
                          onClick={() => setEngagementView("list")}
                          className="p-2 transition-colors"
                          style={{
                            background: engagementView === "list" ? "hsl(207 71% 38%)" : "hsl(220 25% 97%)",
                            color: engagementView === "list" ? "white" : "hsl(220 15% 50%)",
                          }}
                        >
                          <LayoutList size={14} />
                        </button>
                        <button
                          onClick={() => setEngagementView("card")}
                          className="p-2 transition-colors"
                          style={{
                            background: engagementView === "card" ? "hsl(207 71% 38%)" : "hsl(220 25% 97%)",
                            color: engagementView === "card" ? "white" : "hsl(220 15% 50%)",
                          }}
                        >
                          <LayoutGrid size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : stepKey === "client" ? (
                  <div className="mb-3">
                    <h2 className="text-lg font-bold mb-3 text-center" style={{ color: "hsl(220 20% 15%)" }}>
                      {stepTitles[stepKey]}
                    </h2>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(220 15% 60%)" }} />
                      <input
                        type="text"
                        placeholder="Search clients..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl"
                        style={{
                          background: "hsl(220 25% 97%)",
                          border: "1px solid hsl(220 30% 90%)",
                          color: "hsl(220 20% 18%)",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg font-bold mb-2 text-center" style={{ color: "hsl(220 20% 15%)" }}>
                      {stepTitles[stepKey]}
                    </h2>
                    {isConnectors && (
                      <p className="text-sm text-center mb-5" style={{ color: "hsl(220 15% 55%)" }}>
                        Pull prior year data directly from your systems. Luka will auto-detect and classify engagement files.
                      </p>
                    )}
                    {!isConnectors && <div className="mb-5" />}
                  </>
                )}

                {/* Engagement List View */}
                {stepKey === "engagement" && engagementView === "list" && (
                  <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0 rounded-xl" style={{ border: "1px solid hsl(220 30% 90%)" }}>
                    <table className="w-full min-w-[560px]">
                      <thead>
                        <tr style={{ background: "hsl(220 25% 97%)" }}>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: "hsl(220 15% 40%)" }}>
                            <div className="flex items-center gap-1">Client Name <ArrowUpDown size={10} style={{ color: "hsl(220 15% 65%)" }} /></div>
                          </th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: "hsl(220 15% 40%)" }}>Engagement ID</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: "hsl(220 15% 40%)" }}>Year End</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: "hsl(220 15% 40%)" }}>Status</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: "hsl(220 15% 40%)" }}>Date Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEngagements.map((eng, index) => {
                          const isSelected = selected.includes(eng.id);
                          return (
                            <motion.tr
                              key={eng.id + index}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                              onClick={() => toggleSelection(eng.id)}
                              className="cursor-pointer transition-colors"
                              style={{
                                borderBottom: "1px solid hsl(220 30% 93%)",
                                background: isSelected ? "hsl(207 71% 38% / 0.06)" : "transparent",
                              }}
                              whileHover={{ backgroundColor: "hsl(207 71% 38% / 0.03)" }}
                            >
                              <td className="px-4 py-3 text-sm font-semibold" style={{ color: "hsl(220 20% 18%)" }}>{eng.entity}</td>
                              <td className="px-4 py-3 text-sm" style={{ color: "hsl(220 15% 40%)" }}>{eng.id}</td>
                              <td className="px-4 py-3 text-sm" style={{ color: "hsl(220 15% 40%)" }}>{eng.yearEnd}</td>
                              <td className="px-4 py-3">
                                <span
                                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                  style={{
                                    color: "hsl(145 63% 32%)",
                                    background: "hsl(145 63% 93%)",
                                    border: "1px solid hsl(145 63% 80%)",
                                  }}
                                >
                                  {eng.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm" style={{ color: "hsl(220 15% 50%)" }}>{eng.dateCreated}</td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Engagement Card View */}
                {stepKey === "engagement" && engagementView === "card" && (
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="engagement-wizard-options">
                      {filteredEngagements.map((eng) => {
                        const isSelected = selected.includes(eng.id);
                        return (
                          <motion.button
                            key={eng.id}
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => toggleSelection(eng.id)}
                            className={`engagement-wizard-engagement-card ${isSelected ? "engagement-wizard-chip--selected" : ""}`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Hash size={14} style={{ color: "hsl(220 15% 50%)" }} />
                              <span className="text-sm font-semibold" style={{ color: "hsl(220 20% 18%)" }}>{eng.id}</span>
                              {isSelected && (
                                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto">
                                  <CheckCircle2 size={14} style={{ color: "hsl(207 71% 38%)" }} />
                                </motion.span>
                              )}
                            </div>
                            <p className="text-[11px] mb-3" style={{ color: "hsl(220 15% 55%)" }}>{eng.entity}</p>
                            <div className="flex items-center justify-between">
                              <span
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                style={{
                                  color: eng.color,
                                  background: `${eng.color}15`,
                                  border: `1px solid ${eng.color}25`,
                                }}
                              >
                                ● {eng.source}
                              </span>
                              <div className="flex -space-x-1.5">
                                {eng.team.map((initials) => (
                                  <div
                                    key={initials}
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white ring-1 ring-white"
                                    style={{ background: "hsl(220 20% 65%)" }}
                                  >
                                    {initials}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Client table view */}
                {stepKey === "client" && (
                  <div className="flex-1 overflow-y-auto min-h-0 rounded-xl" style={{ border: "1px solid hsl(214 18% 84%)" }}>
                    <table className="w-full">
                      <thead>
                        <tr style={{ background: "hsl(220 25% 97%)" }}>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: "hsl(220 15% 40%)", borderBottom: "1px solid hsl(214 18% 84%)" }}>
                            <div className="flex items-center gap-1">Client Name <ArrowUpDown size={10} style={{ color: "hsl(220 15% 65%)" }} /></div>
                          </th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: "hsl(220 15% 40%)", borderBottom: "1px solid hsl(214 18% 84%)" }}>
                            Date of Joining
                          </th>
                          <th className="px-4 py-2.5 w-10" style={{ borderBottom: "1px solid hsl(214 18% 84%)" }} />
                        </tr>
                      </thead>
                      <tbody>
                        {clients
                          .filter((c) => c.label.toLowerCase().includes(clientSearch.toLowerCase()))
                          .map((c, index) => {
                            const isSelected = selected.includes(c.label);
                            return (
                              <motion.tr
                                key={c.label}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                onClick={() => toggleSelection(c.label)}
                                className="cursor-pointer transition-colors"
                                style={{
                                  background: isSelected ? "hsl(207 71% 38% / 0.06)" : "transparent",
                                  borderBottom: "1px solid hsl(214 18% 84%)",
                                }}
                                whileHover={{ backgroundColor: isSelected ? "hsl(207 71% 38% / 0.1)" : "hsl(220 25% 97%)" }}
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <span
                                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                      style={{
                                        background: isSelected ? "hsl(207 71% 38% / 0.12)" : "hsl(220 25% 95%)",
                                        color: isSelected ? "hsl(207 71% 38%)" : "hsl(220 15% 55%)",
                                      }}
                                    >
                                      <Building2 size={14} />
                                    </span>
                                    <span className="text-[16px] font-medium" style={{ color: "hsl(220 20% 18%)" }}>
                                      {c.label}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm" style={{ color: "hsl(220 15% 50%)" }}>
                                  {c.dateJoined}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {isSelected && (
                                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                      <CheckCircle2 size={16} style={{ color: "hsl(207 71% 38%)" }} />
                                    </motion.span>
                                  )}
                                </td>
                              </motion.tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Other step options (type, team) */}
                {!isConnectors && stepKey !== "engagement" && stepKey !== "client" && (
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="engagement-wizard-options">
                      {stepKey === "type" &&
                        engagementTypes.map((t) => {
                          const isSelected = selected.includes(t.label);
                          return (
                            <motion.button
                              key={t.label}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => toggleSelection(t.label)}
                              className={`engagement-wizard-chip ${isSelected ? "engagement-wizard-chip--selected" : ""}`}
                            >
                              <span className="engagement-wizard-chip-icon">{t.icon}</span>
                              <span>{t.label}</span>
                              {isSelected && (
                                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto">
                                  <CheckCircle2 size={14} style={{ color: "hsl(207 71% 38%)" }} />
                                </motion.span>
                              )}
                            </motion.button>
                          );
                        })}

                      {stepKey === "team" &&
                        teamMembers.map((m) => {
                          const isSelected = selected.includes(m.label);
                          return (
                            <motion.button
                              key={m.label}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => toggleSelection(m.label)}
                              className={`engagement-wizard-chip ${isSelected ? "engagement-wizard-chip--selected" : ""}`}
                            >
                              <span
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                style={{ background: m.color }}
                              >
                                {m.initials}
                              </span>
                              <div className="flex flex-col items-start gap-0">
                                <span className="text-sm font-medium">{m.label}</span>
                                <span className="text-[10px]" style={{ color: "hsl(220 15% 55%)" }}>
                                  {m.role}
                                </span>
                              </div>
                              {isSelected && (
                                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto flex items-center">
                                  <CheckCircle2 size={18} style={{ color: "#0C2D55" }} />
                                </motion.span>
                              )}
                            </motion.button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Connectors Step */}
                {isConnectors && (
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      {connectorSources.map((source, i) => {
                        const isConnected = connectedSources.includes(source.id);
                        const isLoading = loadingSources.includes(source.id);
                        const isLoaded = loadedSources.includes(source.id);
                        const completionData = connectorCompletionData[source.id];
                        const displayFiles = isLoaded && completionData?.files ? completionData.files : source.files;
                        return (
                          <motion.div
                            key={source.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="relative rounded-xl p-4 cursor-pointer transition-all duration-300 flex flex-col min-h-[160px] overflow-hidden"
                            style={{
                              background: isConnected
                                ? "linear-gradient(135deg, hsl(var(--card)), hsl(145 63% 42% / 0.03))"
                                : isLoading
                                ? "linear-gradient(135deg, hsl(var(--card)), hsl(207 71% 38% / 0.03))"
                                : "hsl(var(--card))",
                              border: isConnected
                                ? "1.5px solid hsl(145 63% 42% / 0.4)"
                                : isLoading
                                ? "1.5px solid hsl(207 71% 38% / 0.3)"
                                : "1px solid hsl(var(--border))",
                              boxShadow: isConnected
                                ? "0 4px 16px hsl(145 63% 42% / 0.1), 0 1px 3px hsl(145 63% 42% / 0.06)"
                                : isLoading
                                ? "0 4px 16px hsl(207 71% 38% / 0.08)"
                                : "0 1px 4px hsl(220 30% 50% / 0.06)",
                            }}
                            onClick={() => !isLoading && toggleConnector(source.id)}
                          >
                            {/* Loading shimmer overlay */}
                            {isLoading && (
                              <motion.div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                  background: "linear-gradient(90deg, transparent, hsl(207 71% 38% / 0.06), transparent)",
                                  backgroundSize: "200% 100%",
                                }}
                                animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              />
                            )}

                            <div className="flex items-center gap-2.5 mb-3">
                              <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 transition-all duration-300"
                                style={{
                                  background: isConnected ? source.iconBg : isLoading ? "hsl(207 71% 38%)" : source.iconBg,
                                  opacity: isConnected || isLoading ? 1 : 0.85,
                                }}
                              >
                                {source.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold" style={{ color: "hsl(220 20% 16%)" }}>
                                  {source.name}
                                </p>
                                <p className="text-[11px]" style={{ color: "hsl(220 15% 55%)" }}>
                                  {source.subtitle}
                                </p>
                              </div>
                              {isConnected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                  style={{ background: "hsl(145 63% 42%)" }}
                                >
                                  <Check size={11} color="white" strokeWidth={3} />
                                </motion.div>
                              )}
                            </div>

                            {/* Loading state */}
                            {isLoading && (
                              <div className="flex-1 flex flex-col justify-center items-center gap-2 py-2">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                >
                                  <Loader2 size={18} style={{ color: "hsl(207 71% 38%)" }} />
                                </motion.div>
                                <motion.p
                                  animate={{ opacity: [0.5, 1, 0.5] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                  className="text-[11px] font-medium"
                                  style={{ color: "hsl(207 71% 31%)" }}
                                >
                                  Connecting & importing...
                                </motion.p>
                                <div className="w-full h-1 rounded-full overflow-hidden mt-1" style={{ background: "hsl(var(--muted))" }}>
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: "linear-gradient(90deg, hsl(207 71% 38%), hsl(260 70% 58%))" }}
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 10, ease: "linear" }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Connected files */}
                            {isConnected && !isLoading && displayFiles && displayFiles.length > 0 && (
                              <div className="space-y-1.5 mb-3 max-h-[52px] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                                {displayFiles.map((file) => (
                                  <div key={file.name} className="flex items-center gap-2">
                                    <Check size={12} style={{ color: "hsl(145 63% 42%)" }} />
                                    <span className="text-xs truncate" style={{ color: "hsl(220 18% 30%)" }}>
                                      {file.name}
                                    </span>
                                    <span
                                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded ml-auto shrink-0"
                                      style={{
                                        color: fileStatusColor[file.status]?.color,
                                        background: fileStatusColor[file.status]?.bg,
                                      }}
                                    >
                                      {file.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Completion badge for loaded sources */}
                            {isConnected && !isLoading && isLoaded && completionData && (
                              <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-3 px-2.5 py-1.5 rounded-lg"
                                style={{
                                  background: "linear-gradient(135deg, hsl(207 71% 38% / 0.08), hsl(260 70% 58% / 0.06))",
                                  border: "1px solid hsl(207 71% 38% / 0.15)",
                                }}
                              >
                                <div className="flex items-center gap-1.5">
                                  <Sparkles size={11} style={{ color: "hsl(207 71% 38%)" }} />
                                  <span className="text-[11px] font-bold" style={{ color: "hsl(207 71% 26%)" }}>
                                    {completionData.badge}
                                  </span>
                                </div>
                                {completionData.highlight && (
                                  <p className="text-[10px] mt-0.5 pl-4" style={{ color: "hsl(220 15% 50%)" }}>
                                    {completionData.highlight}
                                  </p>
                                )}
                              </motion.div>
                            )}

                            <div className="mt-auto">
                              {isConnected ? (
                                <span
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                                  style={{
                                    background: "hsl(145 63% 93%)",
                                    color: "hsl(145 63% 32%)",
                                    border: "1px solid hsl(145 63% 80%)",
                                  }}
                                >
                                  <Check size={12} />
                                  Connected
                                </span>
                              ) : isLoading ? (
                                <span
                                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                                  style={{
                                    background: "hsl(207 71% 38% / 0.08)",
                                    color: "hsl(207 71% 31%)",
                                    border: "1px solid hsl(207 71% 38% / 0.2)",
                                  }}
                                >
                                  <Loader2 size={11} className="animate-spin" />
                                  Importing...
                                </span>
                              ) : (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                                  style={{
                                    background: "hsl(var(--card))",
                                    color: "#006AAB",
                                    border: "1.5px solid #006AAB",
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleConnector(source.id);
                                  }}
                                >
                                  Connect
                                </motion.button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Lock warning + Next / Initiate button */}
          {(isMulti || isConnectors || currentStep === stepOrder.length - 1) && (
            <div className="flex flex-col items-center mt-4 gap-3">
              {isConnectors && (
                <div
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl w-full justify-center"
                  style={{
                    background: "hsl(0 80% 97%)",
                    border: "1px solid hsl(0 70% 82%)",
                  }}
                >
                  <Lock size={14} className="shrink-0" style={{ color: "hsl(0 70% 45%)" }} />
                  <span className="text-xs font-medium" style={{ color: "hsl(0 60% 35%)" }}>
                    The file will be locked during automation — team access will be paused
                  </span>
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={!canGoNext}
                onClick={handleNext}
                className="engagement-wizard-next-btn relative overflow-hidden"
                style={{ opacity: canGoNext ? 1 : 0.4 }}
              >
                {isConnectors && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, hsl(0 0% 100% / 0.2) 50%, transparent 100%)",
                      backgroundSize: "200% 100%",
                    }}
                    animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                )}
                {isConnectors && <Sparkles size={14} className="relative z-10" />}
                <span className="relative z-10">{isConnectors ? "Start Magic" : "Next"}</span>
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* RIGHT — Live Selection Summary — positioned relative to card */}
        <AnimatePresence>
          {hasAnySelection && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute top-0 flex flex-col"
              style={{ left: "calc(100% + 16px)", width: 240, height: 624 }}
            >
                <div
                 className="rounded-3xl p-6 flex flex-col w-full h-full"
                 style={{
                   background: "hsl(var(--card))",
                   border: "1px solid hsl(var(--border))",
                   boxShadow: "0 4px 24px hsl(220 30% 50% / 0.08)",
                 }}
                >
                <div className="flex items-center gap-2 mb-5 shrink-0">
                   <CheckCircle2 size={14} style={{ color: "#0C2D55" }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(220 15% 55%)" }}>
                    Your Selections
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 pr-1" style={{ scrollbarWidth: "none" }}>
                <div className="space-y-5">
                  {stepOrder.map((key, i) => {
                    const entry = allSelections.find((s) => s.stepKey === key);
                    const isCurrentOrPast = i <= currentStep;
                    const isPast = i < currentStep;
                    
                    if (!isCurrentOrPast) return null;
                    
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className="w-5 h-5 rounded-md flex items-center justify-center"
                            style={{
                              background: entry ? "#0C2D5518" : "hsl(220 25% 95%)",
                              color: entry ? "#0C2D55" : "hsl(220 15% 65%)",
                            }}
                          >
                            {stepIcons[key]}
                          </span>
                          <span
                            className="text-[11px] font-semibold uppercase tracking-wide"
                            style={{ color: entry ? "hsl(220 20% 18%)" : "hsl(220 15% 65%)" }}
                          >
                            {key === "connectors" ? "Sources" : key.charAt(0).toUpperCase() + key.slice(1)}
                          </span>
                          {isPast && entry && (
                            <CheckCircle2 size={11} style={{ color: "hsl(145 63% 42%)" }} className="ml-auto" />
                          )}
                        </div>
                        
                        {entry ? (
                          <div className="flex flex-wrap gap-1 pl-7">
                            {entry.values.map((v) => (
                              <motion.span
                                key={v}
                                initial={{ scale: 0.7, opacity: 0, y: 4 }}
                                animate={{
                                  scale: 1,
                                  opacity: 1,
                                  y: 0,
                                  backgroundColor: [
                                    "#0C2D5530",
                                    "#0C2D5514",
                                  ],
                                }}
                                transition={{
                                  scale: { type: "spring", stiffness: 400, damping: 15 },
                                  opacity: { duration: 0.2 },
                                  backgroundColor: { duration: 0.8, ease: "easeOut" },
                                }}
                                className="text-[11px] font-medium px-2 py-0.5 rounded-md"
                                style={{
                                  color: "#0C2D55",
                                }}
                              >
                                {v}
                              </motion.span>
                            ))}
                          </div>
                        ) : (
                          <div className="pl-7">
                            <motion.span
                              animate={{ opacity: [0.4, 0.7, 0.4] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                              className="text-[11px] italic"
                              style={{ color: "hsl(220 15% 70%)" }}
                            >
                              Awaiting selection...
                            </motion.span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Credits Estimator */}
                <LukaCreditsEstimator
                  selections={estimatorSelections}
                  dataSources={estimatorDataSources}
                />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationIntakeWizard;
