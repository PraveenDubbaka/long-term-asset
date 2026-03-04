import { useState } from "react";
import { useParams } from "react-router-dom";
import { WpLayout } from "@/components/WpLayout";
import { LoansTab }        from "./LoansTab";
import { ContinuityTab }   from "./ContinuityTab";
import { AmortizationTab } from "./AmortizationTab";
import { ActivityTab }     from "./ActivityTab";
import { CovenantsTab }    from "./CovenantsTab";
import { AJEsTab }         from "./AJEsTab";
import { DashboardTab }    from "./DashboardTab";

const tabs = [
  { id: "loans",        label: "Loans" },
  { id: "continuity",   label: "Continuity" },
  { id: "amortization", label: "Amortization" },
  { id: "activity",     label: "Activity" },
  { id: "covenants",    label: "Covenants" },
  { id: "ajes",         label: "AJEs" },
  { id: "dashboard",    label: "Dashboard" },
];

const CapitalAsset = () => {
  useParams(); // keeps engagementId available if needed downstream
  const [activeTab, setActiveTab] = useState("loans");

  return (
    <WpLayout title="Long-term Asset">
      <div className="flex h-full overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto flex flex-col min-w-0">

          {/* ── Tab bar ─────────────────────────────────────────────── */}
          <div className="px-6 pt-5 pb-2 flex-shrink-0">
            <div className="flex items-center gap-1 bg-card rounded-lg border border-border p-1 w-fit">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Active tab (each component supplies its own p-6) ───── */}
          <div className="flex-1">
            {activeTab === "loans"        && <LoansTab />}
            {activeTab === "continuity"   && <ContinuityTab />}
            {activeTab === "amortization" && <AmortizationTab />}
            {activeTab === "activity"     && <ActivityTab />}
            {activeTab === "covenants"    && <CovenantsTab />}
            {activeTab === "ajes"         && <AJEsTab />}
            {activeTab === "dashboard"    && <DashboardTab />}
          </div>

        </div>
      </div>
    </WpLayout>
  );
};

export default CapitalAsset;
