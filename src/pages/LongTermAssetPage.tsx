import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Building2, ChevronDown, ChevronRight, FileText, Settings2,
  Landmark, PencilLine, FileSpreadsheet, ClipboardCheck, DollarSign,
} from "lucide-react";
import { WpLayout } from "@/components/WpLayout";
import { Badge } from "@/components/wp-ui/badge";
import { Button } from "@/components/wp-ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/wp-ui/dropdown-menu";
import { DashboardTab }    from "./DashboardTab";
import { LoansTab }        from "./LoansTab";
import { ContinuityTab }   from "./ContinuityTab";
import { AmortizationTab } from "./AmortizationTab";
import { CovenantsTab }    from "./CovenantsTab";
import { AJEsTab }         from "./AJEsTab";

const engagementsData: Record<string, { client: string; yearEnd: string; status: string }> = {
  "COM-CON-Dec312024": { client: "Shipping Line Inc.", yearEnd: "Dec 31, 2024", status: "In Progress" },
  "COM-PSP-Dec312023": { client: "Source 40",          yearEnd: "Dec 31, 2023", status: "Completed"   },
};

const headerActions = [
  { id: "bank",     label: "Connect Bank",  icon: Landmark        },
  { id: "docs",     label: "Source Docs",   icon: FileText        },
  { id: "tb",       label: "TB Check",      icon: ClipboardCheck  },
  { id: "adj",      label: "Adj. Entries",  icon: PencilLine      },
  { id: "workbook", label: "Workbook",      icon: FileSpreadsheet },
];

const tabs = [
  { id: "loans",        label: "Loans"        },
  { id: "continuity",   label: "Continuity"   },
  { id: "amortization", label: "Amortization" },
  { id: "covenants",    label: "Covenants"    },
  { id: "ajes",         label: "AJEs"         },
  { id: "dashboard",    label: "Dashboard"    },
];

const LongTermAssetPage = () => {
  const { engagementId } = useParams<{ engagementId: string }>();
  const [activeTab, setActiveTab] = useState("loans");

  const eng = engagementsData[engagementId ?? ""] ?? {
    client: "Shipping Line Inc.",
    yearEnd: "Dec 31, 2024",
    status: "In Progress",
  };

  const statusVariant = eng.status === "Completed" ? "completed" : "inProgress";

  return (
    <WpLayout title="Long-term Asset">
      <div className="flex h-full overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto flex flex-col min-w-0">

          {/* ── Engagement Toolbar ──────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 py-1.5 border-b border-border bg-gradient-to-r from-card via-card to-secondary/20 flex-shrink-0">
            <div className="flex items-center gap-2">

              {/* Client selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 text-sm font-medium hover:bg-muted/60 px-2 py-1 rounded-md transition-colors">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{eng.client}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  {[...new Set(Object.values(engagementsData).map(e => e.client))].map(c => (
                    <DropdownMenuItem key={c} className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{c}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />

              {/* Engagement selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 text-sm font-medium hover:bg-muted/60 px-2 py-1 rounded-md transition-colors">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{engagementId ?? "COM-CON-Dec312024"}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60">
                  {Object.entries(engagementsData).map(([id, e]) => (
                    <DropdownMenuItem key={id} className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{id}</span>
                        <span className="text-xs text-muted-foreground">{e.client} · {e.yearEnd}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Badge variant={statusVariant} className="ml-1 text-xs py-0.5 px-2">
                {eng.status}
              </Badge>
            </div>

            {/* Tools dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-medium">
                  <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                  Tools
                  <ChevronDown className="h-3 w-3 ml-1.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {headerActions.map(action => (
                  <DropdownMenuItem key={action.id} className="flex items-center gap-2">
                    <action.icon className="h-4 w-4" />
                    <span>{action.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ── Tab bar ─────────────────────────────────────────────── */}
          <div className="px-6 pt-5 pb-2 flex-shrink-0 flex items-center justify-between">
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

            {/* Reporting currency indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700">
              <DollarSign className="w-3 h-3" />
              <span className="text-[11px] font-semibold tracking-wide">Reporting Currency: CAD</span>
              <span className="text-[10px] text-emerald-600/70 font-normal">Canadian Dollar</span>
            </div>
          </div>

          {/* ── Active tab ──────────────────────────────────────────── */}
          <div className="flex-1">
            {activeTab === "loans"        && <LoansTab />}
            {activeTab === "continuity"   && <ContinuityTab />}
            {activeTab === "amortization" && <AmortizationTab />}
            {activeTab === "covenants"    && <CovenantsTab />}
            {activeTab === "ajes"         && <AJEsTab />}
            {activeTab === "dashboard"    && <DashboardTab />}
          </div>

        </div>
      </div>
    </WpLayout>
  );
};

export default LongTermAssetPage;
