import { useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Building2, ChevronDown, ChevronRight, FileText, Settings2,
  Landmark, PencilLine, FileSpreadsheet, ClipboardCheck,
  RefreshCw, Check, Eye, EyeOff, Search, ChevronLeft, ShieldCheck,
  Download, Layers,
} from "lucide-react";
import { InvUploadWizard } from "./InvUploadWizard";
import type { OcrRow } from "./InvUploadWizard";
import { WpLayout } from "@/components/WpLayout";
import { Badge } from "@/components/wp-ui/badge";
import { Button } from "@/components/wp-ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/wp-ui/dropdown-menu";
import {
  Dialog, DialogContent,
} from "@/components/wp-ui/dialog";
import { Switch } from "@/components/wp-ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/wp-ui/popover";
import { InvHoldingsTab }     from "./InvHoldingsTab";
import { InvTransactionsTab } from "./InvTransactionsTab";
import { InvWACTab }          from "./InvWACTab";
import { InvGainLossTab }     from "./InvGainLossTab";
import { InvFXTab }           from "./InvFXTab";
import { InvAJEsTab }         from "./InvAJEsTab";
import { InvIncomeTab }       from "./InvIncomeTab";
import { InvBrokerReconTab }  from "./InvBrokerReconTab";
import { InvFlagsTab }        from "./InvFlagsTab";
import { usePlaidStore } from "../store/usePlaidStore";
import type { PlaidInstitution } from "../store/usePlaidStore";
import {
  compute, buildAJEs, buildIncomeMatrix, buildFxSchedule,
  buildInvestmentRecon, buildCashRecon,
  type ComputeOptions,
} from "@/lib/luka/compute";
import { sources as baseSources } from "@/lib/luka/mockData";
import type { Source, Transaction, PriorYearLot } from "@/lib/luka/types";
import { priorYearLots } from "@/lib/luka/mockData";
import { currentYearTransactions } from "@/lib/luka/mockData";
import { defaultTbAccount } from "@/lib/luka/coa";
import { exportWorkbook } from "@/lib/luka/exportXlsx";
import toast from "react-hot-toast";

type PlaidStep = 'select' | 'login' | 'verifying' | 'success';

const PLAID_INSTITUTIONS: PlaidInstitution[] = [
  { id: 'td',           name: 'TD Direct Investing',   abbr: 'TD',  color: '#00883A' },
  { id: 'rbc',          name: 'RBC Direct Investing',  abbr: 'RBC', color: '#0051A5' },
  { id: 'bmo',          name: 'BMO InvestorLine',       abbr: 'BMO', color: '#0079C1' },
  { id: 'hsbc',         name: 'HSBC InvestDirect',      abbr: 'HSB', color: '#DB0011' },
  { id: 'fidelity',     name: 'Fidelity Investments',   abbr: 'FID', color: '#538025' },
  { id: 'scotia',       name: 'Scotiabank iTRADE',       abbr: 'BNS', color: '#EC111A' },
  { id: 'cibc',         name: "CIBC Investor's Edge",   abbr: 'CM',  color: '#A41422' },
  { id: 'national',     name: 'National Bank Direct',   abbr: 'NA',  color: '#EA1D2C' },
  { id: 'questrade',    name: 'Questrade',              abbr: 'QT',  color: '#E8641C' },
  { id: 'wealthsimple', name: 'Wealthsimple Trade',     abbr: 'WS',  color: '#1A1A1A' },
];

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
  { id: "transactions", label: "Transactions"       },
  { id: "wac",          label: "WAC Schedule"       },
  { id: "gainloss",     label: "Gain / Loss"        },
  { id: "fx",           label: "FX Schedule"        },
  { id: "income",       label: "Income & Expenses"  },
  { id: "brokerrecon",  label: "Broker Recon"       },
  { id: "ajes",         label: "AJEs"               },
  { id: "sources",      label: "Sources"            },
  { id: "holdings",     label: "Holdings"           },
];

const InvestmentPage = () => {
  const { engagementId } = useParams<{ engagementId: string }>();
  const [searchParams]  = useSearchParams();
  const isNew           = searchParams.get("new") === "true";
  const wpLabel         = searchParams.get("label")
    ? decodeURIComponent(searchParams.get("label")!)
    : undefined;

  const [activeTab,    setActiveTab]    = useState("transactions");
  const [uploadOpen,   setUploadOpen]   = useState(false);
  const [pendingImport, setPendingImport] = useState<{ rows: OcrRow[]; glMap: Record<string, string> } | null>(null);
  // Empty state: true when the workpaper was just created via sidebar "Add Investment"
  const [isEmpty, setIsEmpty] = useState(isNew);

  // ── Plaid dialog state (dialog-only UI, connection state lives in store) ──
  const {
    plaidConnected, plaidInstitution, plaidLastSync, plaidRefreshing,
    showPlaid, setShowPlaid, connect: plaidConnect, disconnect: plaidDisconnect, refresh: plaidRefresh,
  } = usePlaidStore();
  const [plaidStep,        setPlaidStep]        = useState<PlaidStep>('select');
  const [dialogInstitution,setDialogInstitution]= useState<PlaidInstitution | null>(null);
  const [plaidSearch,      setPlaidSearch]      = useState('');
  const [plaidUsername,    setPlaidUsername]    = useState('');
  const [plaidPassword,    setPlaidPassword]    = useState('');
  const [plaidShowPwd,     setPlaidShowPwd]     = useState(false);

  const resetPlaidDialog = () => {
    setPlaidStep('select'); setDialogInstitution(null);
    setPlaidSearch(''); setPlaidUsername(''); setPlaidPassword(''); setPlaidShowPwd(false);
  };

  const handlePlaidConnect = () => {
    if (!dialogInstitution) return;
    plaidConnect(dialogInstitution);
    toast.success('Plaid connected — transactions synced');
    resetPlaidDialog();
  };

  const handlePlaidVerify = async () => {
    if (!plaidUsername.trim() || !plaidPassword.trim()) { toast.error('Enter your credentials to continue'); return; }
    setPlaidStep('verifying');
    await new Promise(r => setTimeout(r, 2000));
    setPlaidStep('success');
  };

  const handlePlaidRefresh = async () => {
    await plaidRefresh();
    toast.success('Plaid synced — transactions up to date');
  };

  const eng = engagementsData[engagementId ?? ""] ?? {
    client: "Countable Holdings Corp.",
    yearEnd: "Dec 31, 2025",
    status: "In Progress",
  };

  const statusVariant = eng.status === "Completed" ? "completed" : "inProgress";

  // ── Luka compute state ──────────────────────────────────────────
  const [opts, setOpts] = useState<ComputeOptions>({
    includePriorYear: true,
    trackByBroker: false,
    measurementBasis: "FVTPL",
  });
  const [importedLots, setImportedLots] = useState<PriorYearLot[] | null>(null);
  const effectivePY = useMemo(() => importedLots ?? priorYearLots, [importedLots]);
  const [importedTxnsBySource, setImportedTxnsBySource] = useState<Record<string, Transaction[]>>({});
  const [plaidSources, setPlaidSources] = useState<Source[]>([]);
  const [plaidTxns, setPlaidTxns] = useState<Transaction[]>([]);
  const [hiddenTxIds, setHiddenTxIds] = useState<Set<string>>(new Set());
  const [manualTxns, setManualTxns] = useState<Transaction[]>([]);
  const allInvSources = useMemo(() => [...baseSources, ...plaidSources], [plaidSources]);
  const baseTxns = useMemo(() => {
    const overriddenIds = new Set(Object.keys(importedTxnsBySource));
    const kept = currentYearTransactions.filter((t) => !overriddenIds.has(t.sourceId) && !hiddenTxIds.has(t.id));
    const imported = Object.values(importedTxnsBySource).flat().map((t) => ({
      ...t,
      status: t.status ?? "pending" as const,
      tbAccount: t.tbAccount ?? defaultTbAccount(t.type),
    }));
    return [...kept, ...imported.filter(t => !hiddenTxIds.has(t.id)), ...plaidTxns.filter(t => !hiddenTxIds.has(t.id)), ...manualTxns];
  }, [importedTxnsBySource, plaidTxns, hiddenTxIds, manualTxns]);
  const [txEdits, setTxEdits] = useState<Record<string, Partial<Transaction>>>({});
  const effectiveTxns = useMemo(
    () => baseTxns.map((t) => ({ ...t, ...txEdits[t.id] })),
    [baseTxns, txEdits],
  );
  const updateTx = (id: string, patch: Partial<Transaction>) =>
    setTxEdits((m) => ({ ...m, [id]: { ...(m[id] ?? {}), ...patch } }));

  const { schedules } = useMemo(
    () => compute(opts, effectivePY, effectiveTxns),
    [opts, effectivePY, effectiveTxns],
  );
  const ajes = useMemo(() => buildAJEs(schedules, opts), [schedules, opts]);
  const incomeMatrix = useMemo(() => buildIncomeMatrix(effectiveTxns), [effectiveTxns]);
  const fxSchedule = useMemo(() => buildFxSchedule(effectiveTxns, effectivePY), [effectiveTxns, effectivePY]);
  const invRecon = useMemo(() => buildInvestmentRecon(schedules), [schedules]);
  const cashRecon = useMemo(() => buildCashRecon(), []);
  const invTotals = useMemo(() => ({
    cost: schedules.reduce((a, s) => a + s.closingCostCAD, 0),
    fmv: schedules.reduce((a, s) => a + s.fmvCAD, 0),
    realized: schedules.reduce((a, s) => a + s.realizedGL, 0),
    unrealized: schedules.reduce((a, s) => a + s.unrealizedGL, 0),
  }), [schedules]);

  return (
    <WpLayout title={wpLabel ?? "Investment"}>
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
                      <Building2 className="h-4 w-4" /><span>{c}</span>
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

              {/* ── Plaid connected badge (shown after In Progress) ── */}
              {plaidConnected && plaidInstitution && (
                <button
                  onClick={() => setShowPlaid(true)}
                  title={`${plaidInstitution.name} · Last synced ${plaidLastSync?.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' }) ?? '—'}`}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border bg-card hover:bg-muted transition-colors"
                >
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                    style={{ backgroundColor: plaidInstitution.color }}
                  >
                    {plaidInstitution.abbr.slice(0, 2)}
                  </span>
                  <span className="text-xs font-medium text-foreground">{plaidInstitution.abbr}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
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
                      <action.icon className="h-4 w-4" /><span>{action.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

            </div>
          </div>

          {/* ── Tab bar + action buttons on one row ───────────────── */}
          <div className="px-6 pt-5 pb-2 flex-shrink-0 flex items-center justify-between gap-3 flex-wrap">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-card rounded-lg border border-border p-1 flex-wrap">
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

            {/* Action buttons — right-aligned */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Settings popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-medium">
                    <Layers className="h-3.5 w-3.5 mr-1.5" />
                    Settings
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[360px] p-0">
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Layers className="h-4 w-4 text-primary" /> Engagement Settings
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Recomputes all schedules in real time.</p>
                  </div>
                  <div className="p-4 space-y-5">
                    <div className="flex items-start gap-3">
                      <Switch
                        checked={opts.includePriorYear}
                        onCheckedChange={(v) => setOpts((o) => ({ ...o, includePriorYear: v }))}
                      />
                      <div>
                        <label className="font-medium text-sm text-foreground">Prior-year file uploaded</label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Use prior-year openings ({effectivePY.length} lots{importedLots ? " · imported" : ""}).
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Switch
                        checked={opts.trackByBroker}
                        onCheckedChange={(v) => setOpts((o) => ({ ...o, trackByBroker: v }))}
                      />
                      <div>
                        <label className="font-medium text-sm text-foreground">Track WAC by brokerage</label>
                        <p className="text-xs text-muted-foreground mt-1">On = separate pool per broker. Off = blended.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="font-medium text-sm text-foreground">Measurement basis</label>
                      <select
                        value={opts.measurementBasis}
                        onChange={(e) => setOpts((o) => ({ ...o, measurementBasis: e.target.value as "Cost" | "FVTPL" }))}
                        className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="Cost">Cost method (no MTM)</option>
                        <option value="FVTPL">Fair value through P&amp;L</option>
                      </select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Export Excel */}
              <Button
                variant="default"
                size="sm"
                className="h-8 px-3 text-xs font-medium"
                onClick={() => { exportWorkbook(opts); toast.success("Excel workbook exported"); }}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export
              </Button>
            </div>
          </div>

          {/* ── Tabs — always mounted so local state (imported rows, edits) survives tab switches ── */}
          <div className={`flex-1 ${activeTab === "holdings" ? "" : "hidden"}`}>
            <InvHoldingsTab
              schedules={schedules}
              totals={invTotals}
              allSources={allInvSources}
              onUpload={() => setUploadOpen(true)}
              isNew={isNew}
              isEmpty={isEmpty}
              onFirstData={() => setIsEmpty(false)}
            />
          </div>
          <div className={`flex-1 ${activeTab === "transactions" ? "" : "hidden"}`}>
            <InvTransactionsTab
              effectiveTxns={effectiveTxns}
              allSources={allInvSources}
              txEdits={txEdits}
              setTxEdits={setTxEdits}
              updateTx={updateTx}
              onPlaidConnected={(newSources, newTxns) => {
                setPlaidSources((prev) => {
                  const ids = new Set(prev.map((s) => s.id));
                  return [...prev, ...newSources.filter((s) => !ids.has(s.id))];
                });
                setPlaidTxns((prev) => {
                  const ids = new Set(prev.map((t) => t.id));
                  return [...prev, ...newTxns.filter((t) => !ids.has(t.id))];
                });
              }}
              entityName={eng.client}
              onDeleteTx={(id) => setHiddenTxIds(prev => { const next = new Set(prev); next.add(id); return next; })}
              onAddTx={(tx) => setManualTxns(prev => [...prev, tx])}
            />
          </div>
          <div className={`flex-1 ${activeTab === "wac" ? "" : "hidden"}`}>
            <InvWACTab schedules={schedules} opts={opts} />
          </div>
          <div className={`flex-1 ${activeTab === "gainloss" ? "" : "hidden"}`}>
            <InvGainLossTab schedules={schedules} totals={invTotals} />
          </div>
          <div className={`flex-1 ${activeTab === "fx" ? "" : "hidden"}`}>
            <InvFXTab fxSchedule={fxSchedule} />
          </div>
          <div className={`flex-1 ${activeTab === "income" ? "" : "hidden"}`}>
            <InvIncomeTab incomeMatrix={incomeMatrix} />
          </div>
          <div className={`flex-1 ${activeTab === "brokerrecon" ? "" : "hidden"}`}>
            <InvBrokerReconTab invRecon={invRecon} cashRecon={cashRecon} />
          </div>
          <div className={`flex-1 ${activeTab === "ajes" ? "" : "hidden"}`}>
            <InvAJEsTab ajes={ajes} />
          </div>
          <div className={`flex-1 ${activeTab === "sources" ? "" : "hidden"}`}>
            <InvFlagsTab
              allSources={allInvSources}
              opts={opts}
              setOpts={setOpts}
              importedLots={importedLots}
              effectivePY={effectivePY}
              importedTxnsBySource={importedTxnsBySource}
              onApplyLots={(lots) => { setImportedLots(lots); setOpts((o) => ({ ...o, includePriorYear: true })); }}
              onResetLots={() => { setImportedLots(null); toast("Reverted to mock prior-year file"); }}
              onApplySourceTxns={(sid, txns) => setImportedTxnsBySource((m) => ({ ...m, [sid]: txns }))}
              onResetSourceTxns={(sid) => setImportedTxnsBySource((m) => { const { [sid]: _, ...rest } = m; return rest; })}
              onPlaidConnected={(newSources, newTxns) => {
                setPlaidSources((prev) => {
                  const ids = new Set(prev.map((s) => s.id));
                  return [...prev, ...newSources.filter((s) => !ids.has(s.id))];
                });
                setPlaidTxns((prev) => {
                  const ids = new Set(prev.map((t) => t.id));
                  return [...prev, ...newTxns.filter((t) => !ids.has(t.id))];
                });
              }}
              onPlaidDisconnect={(sid) => {
                setPlaidSources((prev) => prev.filter((s) => s.id !== sid));
                setPlaidTxns((prev) => prev.filter((t) => t.sourceId !== sid));
              }}
              setActiveTab={setActiveTab}
              entityName={eng.client}
            />
          </div>

          {/* ── Import wizard — modal overlay ─────────────────────────────── */}
          <Dialog open={uploadOpen} onOpenChange={v => { if (!v) setUploadOpen(false); }}>
            <DialogContent
              className="max-w-3xl p-0"
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: 'min(90vh, 780px)',
                overflow: 'hidden',
              }}
            >
              <InvUploadWizard
                isModal
                onBack={() => setUploadOpen(false)}
                onImport={(rows, glMap) => {
                  setPendingImport({ rows, glMap });
                  setUploadOpen(false);
                  setIsEmpty(false);
                  setActiveTab('transactions');
                }}
              />
            </DialogContent>
          </Dialog>

          {/* ── Plaid Dialog (always mounted at page level) ──────────── */}
          <Dialog open={showPlaid} onOpenChange={v => { setShowPlaid(v); if (!v) resetPlaidDialog(); }}>
            <DialogContent className="max-w-md overflow-hidden p-0">

              {plaidConnected ? (
                /* ════════ CONNECTED — Manage view ════════ */
                <>
                  <div className="px-6 pt-6 pb-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      {plaidInstitution && (
                        <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                          style={{ backgroundColor: plaidInstitution.color }}>
                          {plaidInstitution.abbr.slice(0, 2)}
                        </div>
                      )}
                      <h2 className="text-base font-semibold text-foreground">
                        {plaidInstitution?.name ?? 'Plaid'} — Connected
                      </h2>
                    </div>
                  </div>
                  <div className="px-6 py-4 space-y-4">
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-800">Connected &amp; Syncing</p>
                        <p className="text-xs text-green-700 mt-0.5">
                          Last synced: {plaidLastSync
                            ? plaidLastSync.toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Linked Accounts</p>
                      {[
                        { broker: 'TD Direct Investing',  acct: '···8832', ccy: 'CAD', color: '#00883A' },
                        { broker: 'RBC Direct Investing', acct: '···4451', ccy: 'CAD', color: '#0051A5' },
                        { broker: 'HSBC InvestDirect',    acct: '···2291', ccy: 'USD', color: '#DB0011' },
                        { broker: 'Fidelity Investments', acct: '···7105', ccy: 'USD', color: '#538025' },
                      ].map(a => (
                        <div key={a.acct} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 bg-muted/30">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded flex-shrink-0" style={{ backgroundColor: a.color }} />
                            <div>
                              <div className="text-xs font-medium text-foreground">{a.broker}</div>
                              <div className="text-xs text-muted-foreground font-mono">{a.acct} · {a.ccy}</div>
                            </div>
                          </div>
                          <span className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">Active</span>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg bg-muted/40 border border-border px-3 py-2.5 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Auto-sync: daily at midnight</span>
                      <button onClick={() => { plaidDisconnect(); toast('Plaid disconnected'); }}
                        className="text-xs text-red-500 hover:text-red-600 hover:underline underline-offset-2">
                        Disconnect
                      </button>
                    </div>
                  </div>
                  <div className="px-6 pb-5 flex justify-end gap-2 border-t border-border pt-4">
                    <Button variant="secondary" onClick={() => setShowPlaid(false)}>Close</Button>
                    <Button variant="default" onClick={() => { handlePlaidRefresh(); setShowPlaid(false); }} disabled={plaidRefreshing}>
                      <RefreshCw className={`w-3.5 h-3.5 mr-1 ${plaidRefreshing ? 'animate-spin' : ''}`} />
                      {plaidRefreshing ? 'Syncing…' : 'Sync Now'}
                    </Button>
                  </div>
                </>
              ) : (
                /* ════════ NOT CONNECTED — multi-step ════════ */
                <>
                  {/* Header */}
                  <div className="px-6 pt-5 pb-4 border-b border-border flex items-center gap-3">
                    {plaidStep === 'login' && (
                      <button onClick={() => setPlaidStep('select')} className="text-muted-foreground hover:text-foreground mr-1">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {plaidStep === 'login' && dialogInstitution ? (
                        <>
                          <div className="w-6 h-6 rounded flex-shrink-0 text-white text-[10px] font-bold flex items-center justify-center"
                            style={{ backgroundColor: dialogInstitution.color }}>
                            {dialogInstitution.abbr.slice(0, 2)}
                          </div>
                          <h2 className="text-base font-semibold text-foreground truncate">Sign in to {dialogInstitution.name}</h2>
                        </>
                      ) : plaidStep === 'verifying' ? (
                        <h2 className="text-base font-semibold text-foreground">Connecting…</h2>
                      ) : plaidStep === 'success' ? (
                        <h2 className="text-base font-semibold text-foreground">Authorize Access</h2>
                      ) : (
                        <>
                          <div className="w-7 h-7 rounded-md bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-[10px] font-bold tracking-tight">p</span>
                          </div>
                          <h2 className="text-base font-semibold text-foreground">Connect to Plaid</h2>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-6 py-5">
                    {/* Step: select institution */}
                    {plaidStep === 'select' && (
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                          <input className="w-full h-9 pl-8 pr-3 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                            placeholder="Search 12,000+ institutions…" value={plaidSearch}
                            onChange={e => setPlaidSearch(e.target.value)} autoFocus />
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                          {PLAID_INSTITUTIONS
                            .filter(i => !plaidSearch || i.name.toLowerCase().includes(plaidSearch.toLowerCase()))
                            .map(inst => (
                              <button key={inst.id}
                                onClick={() => { setDialogInstitution(inst); setPlaidStep('login'); }}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border hover:border-primary hover:bg-muted/40 transition-colors text-left">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                                  style={{ backgroundColor: inst.color }}>
                                  {inst.abbr.slice(0, 2)}
                                </div>
                                <span className="text-xs font-medium text-foreground leading-tight">{inst.name}</span>
                              </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1.5 justify-center pt-1">
                          <ShieldCheck className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">256-bit encryption · read-only access</span>
                        </div>
                      </div>
                    )}

                    {/* Step: login */}
                    {plaidStep === 'login' && dialogInstitution && (
                      <div className="space-y-4">
                        <div className="h-1 rounded-full" style={{ backgroundColor: dialogInstitution.color }} />
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1.5">Username / Card Number</label>
                            <input className="w-full h-9 px-3 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                              placeholder="Enter username" value={plaidUsername}
                              onChange={e => setPlaidUsername(e.target.value)} autoFocus />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1.5">Password</label>
                            <div className="relative">
                              <input className="w-full h-9 px-3 pr-9 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                                type={plaidShowPwd ? 'text' : 'password'} placeholder="Enter password"
                                value={plaidPassword} onChange={e => setPlaidPassword(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handlePlaidVerify(); }} />
                              <button type="button" onClick={() => setPlaidShowPwd(p => !p)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {plaidShowPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          Your credentials are encrypted end-to-end and never stored. Plaid requests read-only access to transaction history only.
                        </p>
                      </div>
                    )}

                    {/* Step: verifying */}
                    {plaidStep === 'verifying' && (
                      <div className="flex flex-col items-center justify-center py-10 gap-5">
                        <div className="w-14 h-14 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin" />
                        <div className="text-center">
                          <p className="text-sm font-semibold text-foreground">Verifying credentials…</p>
                          <p className="text-xs text-muted-foreground mt-1">Connecting to {dialogInstitution?.name}</p>
                        </div>
                      </div>
                    )}

                    {/* Step: success / authorize */}
                    {plaidStep === 'success' && dialogInstitution && (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                            <Check className="w-5 h-5 text-green-600" />
                          </div>
                          <p className="text-sm font-semibold text-green-800">{dialogInstitution.name}</p>
                          <p className="text-xs text-green-700 mt-0.5">2 accounts found · ready to link</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Select accounts to link</p>
                          {[
                            { name: 'Investment Account',     acct: '···' + dialogInstitution.id.slice(0, 2).toUpperCase() + '01', ccy: 'CAD' },
                            { name: 'USD Investment Account', acct: '···' + dialogInstitution.id.slice(0, 2).toUpperCase() + '02', ccy: 'USD' },
                          ].map(a => (
                            <label key={a.acct} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors">
                              <input type="checkbox" defaultChecked className="rounded h-3.5 w-3.5 accent-primary" />
                              <div>
                                <div className="text-xs font-medium text-foreground">{a.name}</div>
                                <div className="text-xs text-muted-foreground font-mono">{a.acct} · {a.ccy}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-6 pb-5 flex justify-end gap-2 border-t border-border pt-4">
                    {plaidStep === 'select' && (
                      <Button variant="secondary" onClick={() => { setShowPlaid(false); resetPlaidDialog(); }}>Cancel</Button>
                    )}
                    {plaidStep === 'login' && (
                      <>
                        <Button variant="secondary" onClick={() => setPlaidStep('select')}>Back</Button>
                        <Button variant="default" onClick={handlePlaidVerify}>Continue</Button>
                      </>
                    )}
                    {plaidStep === 'success' && (
                      <>
                        <Button variant="secondary" onClick={() => { setShowPlaid(false); resetPlaidDialog(); }}>Cancel</Button>
                        <Button variant="default" onClick={handlePlaidConnect}>
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Allow Access
                        </Button>
                      </>
                    )}
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </WpLayout>
  );
};

export default InvestmentPage;
