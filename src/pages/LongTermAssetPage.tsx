import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Building2, ChevronDown, ChevronRight, FileText, Settings2,
  Landmark, PencilLine, FileSpreadsheet, ClipboardCheck, RefreshCw, Settings,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/wp-ui/dialog";
import { Button } from "@/components/wp-ui/button";
import { WpLayout } from "@/components/WpLayout";
import { Badge } from "@/components/wp-ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/wp-ui/dropdown-menu";
import { LoansTab }        from "./LoansTab";
import { ContinuityTab }   from "./ContinuityTab";
import { AmortizationTab } from "./AmortizationTab";
import { CovenantsTab }    from "./CovenantsTab";
import { AJEsTab }         from "./AJEsTab";
import NotesTab             from "./NotesTab";

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
  { id: "notes",        label: "Notes"        },
];

const LongTermAssetPage = () => {
  const { engagementId } = useParams<{ engagementId: string }>();
  const [searchParams] = useSearchParams();
  const isEmpty = searchParams.get("new") === "true";
  const wpLabel = searchParams.get("label") ? decodeURIComponent(searchParams.get("label")!) : null;
  const [activeTab, setActiveTab] = useState("loans");

  const eng = engagementsData[engagementId ?? ""] ?? {
    client: "Shipping Line Inc.",
    yearEnd: "Dec 31, 2024",
    status: "In Progress",
  };

  const statusVariant = eng.status === "Completed" ? "completed" : "inProgress";

  const [wpSettingsOpen, setWpSettingsOpen] = useState(false);
  const [wpCurrencySettings, setWpCurrencySettings] = useState({
    baseCurrency: 'CAD',
    reportingCurrency: 'CAD',
    rateType: 'Closing Rate',
    exchangeRate: '',
    lastFetched: null as string | null,
    isFetching: false,
  });

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
                    <Building2 className="h-3.5 w-3.5 text-foreground" />
                    <span>{eng.client}</span>
                    <ChevronDown className="h-3 w-3 text-foreground" />
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

              <ChevronRight className="h-3.5 w-3.5 text-foreground" />

              {/* Engagement selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 text-sm font-medium hover:bg-muted/60 px-2 py-1 rounded-md transition-colors">
                    <FileText className="h-3.5 w-3.5 text-foreground" />
                    <span>{engagementId ?? "COM-CON-Dec312024"}</span>
                    <ChevronDown className="h-3 w-3 text-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60">
                  {Object.entries(engagementsData).map(([id, e]) => (
                    <DropdownMenuItem key={id} className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{id}</span>
                        <span className="text-xs text-foreground">{e.client} · {e.yearEnd}</span>
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
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Workpaper settings button */}
            <button
              onClick={() => setWpSettingsOpen(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-card hover:bg-muted/60 text-foreground transition-colors text-xs font-medium"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
          </div>

          {/* ── Active tab ──────────────────────────────────────────── */}
          <div className="flex-1">
            {activeTab === "loans"        && <LoansTab isEmpty={isEmpty} />}
            {activeTab === "continuity"   && <ContinuityTab />}
            {activeTab === "amortization" && <AmortizationTab />}
            {activeTab === "covenants"    && <CovenantsTab />}
            {activeTab === "ajes"         && <AJEsTab />}
            {activeTab === "notes"        && <NotesTab />}
          </div>

        </div>
      </div>

      {/* ── Workpaper Settings Modal ──────────────────────────────── */}
      <Dialog open={wpSettingsOpen} onOpenChange={setWpSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              {wpLabel ? `${wpLabel} — Settings` : 'Long-term Asset — Settings'}
            </DialogTitle>
          </DialogHeader>

          {(() => {
            const SEL = "h-9 w-full px-3 py-2 text-sm rounded-[10px] border border-[#dcdfe4] bg-white hover:border-[hsl(210_25%_75%)] focus:outline-none focus:border-primary/40 transition-all duration-200 cursor-pointer";
            const INP = "h-9 flex-1 px-3 py-2 text-sm rounded-[10px] border border-[#dcdfe4] bg-white hover:border-[hsl(210_25%_75%)] focus:outline-none focus:border-primary/40 transition-all duration-200 tabular-nums";
            const LBL = "block text-sm font-medium text-foreground mb-1.5";
            return (
              <div className="space-y-5 py-1">

                {/* Base & Reporting Currency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LBL}>Base Currency</label>
                    <select
                      value={wpCurrencySettings.baseCurrency}
                      onChange={e => setWpCurrencySettings(p => ({ ...p, baseCurrency: e.target.value, exchangeRate: '' }))}
                      className={SEL}
                    >
                      {['CAD','USD','EUR','GBP','JPY','CHF','AUD','MXN','CNY','HKD'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={LBL}>Reporting Currency</label>
                    <select
                      value={wpCurrencySettings.reportingCurrency}
                      onChange={e => setWpCurrencySettings(p => ({ ...p, reportingCurrency: e.target.value, exchangeRate: '' }))}
                      className={SEL}
                    >
                      {['CAD','USD','EUR','GBP','JPY','CHF','AUD','MXN','CNY','HKD'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Exchange Rate section — only when currencies differ */}
                {wpCurrencySettings.baseCurrency !== wpCurrencySettings.reportingCurrency && (
                  <div className="space-y-4 p-4 rounded-[10px] bg-muted/30 border border-[#dcdfe4]">
                    <div>
                      <label className={LBL}>Exchange Rate Type</label>
                      <select
                        value={wpCurrencySettings.rateType}
                        onChange={e => setWpCurrencySettings(p => ({ ...p, rateType: e.target.value }))}
                        className={SEL}
                      >
                        <option value="Closing Rate">Closing Rate — Balance sheet date rate</option>
                        <option value="Average Rate">Average Rate — Period-average rate</option>
                        <option value="Spot Rate">Spot Rate — Current market rate</option>
                        <option value="Overage Rate">Overage Rate — Blended / override rate</option>
                      </select>
                    </div>

                    <div>
                      <label className={LBL}>
                        Exchange Rate&nbsp;
                        <span className="font-normal">
                          ({wpCurrencySettings.baseCurrency} → {wpCurrencySettings.reportingCurrency})
                        </span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.0001"
                          placeholder="e.g. 1.3650"
                          value={wpCurrencySettings.exchangeRate}
                          onChange={e => setWpCurrencySettings(p => ({ ...p, exchangeRate: e.target.value }))}
                          className={INP}
                        />
                        <Button
                          variant="outline"
                          size="default"
                          onClick={() => {
                            setWpCurrencySettings(p => ({ ...p, isFetching: true }));
                            setTimeout(() => {
                              const mockRates: Record<string, Record<string, string>> = {
                                CAD: { USD: '0.7321', EUR: '0.6712', GBP: '0.5789', JPY: '110.42' },
                                USD: { CAD: '1.3662', EUR: '0.9168', GBP: '0.7912', JPY: '150.87' },
                                EUR: { CAD: '1.4901', USD: '1.0908', GBP: '0.8629', JPY: '164.52' },
                                GBP: { CAD: '1.7268', USD: '1.2638', EUR: '1.1587', JPY: '190.61' },
                              };
                              const rate = mockRates[wpCurrencySettings.baseCurrency]?.[wpCurrencySettings.reportingCurrency] ?? '1.0000';
                              const now = new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' });
                              setWpCurrencySettings(p => ({ ...p, exchangeRate: rate, lastFetched: now, isFetching: false }));
                            }, 900);
                          }}
                          disabled={wpCurrencySettings.isFetching}
                        >
                          <RefreshCw className={wpCurrencySettings.isFetching ? 'animate-spin' : ''} />
                          {wpCurrencySettings.isFetching ? 'Fetching…' : 'Pull Latest'}
                        </Button>
                      </div>
                      {wpCurrencySettings.lastFetched && (
                        <p className="mt-1.5 text-xs text-foreground">Last fetched at {wpCurrencySettings.lastFetched}</p>
                      )}
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setWpSettingsOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={() => setWpSettingsOpen(false)}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WpLayout>
  );
};

export default LongTermAssetPage;
