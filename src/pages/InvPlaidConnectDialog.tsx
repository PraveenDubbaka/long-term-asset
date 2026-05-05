import { useState, useMemo } from "react";
import {
  Plug, ChevronRight, ChevronLeft, Loader2, CheckCircle2,
  Landmark, TrendingUp, BarChart3, Shield, Leaf, Building2, type LucideIcon,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/wp-ui/dialog";
import { Button } from "@/components/wp-ui/button";
import { Input } from "@/components/wp-ui/input";
import { Checkbox } from "@/components/wp-ui/checkbox";
import { Badge } from "@/components/wp-ui/badge";
import {
  MOCK_INSTITUTIONS, PlaidInstitution, PlaidAccount, PlaidInvestmentTxn,
  fetchMockInvestmentTransactions, plaidAccountToSource, plaidToSourceTransaction,
} from "@/lib/luka/plaidMock";
import { Source, Transaction, TxType } from "@/lib/luka/types";
import toast from "react-hot-toast";

interface Props {
  defaultPeriodStart: string;
  defaultPeriodEnd: string;
  entityName: string;
  onImport: (sources: Source[], transactions: Transaction[]) => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Landmark, TrendingUp, BarChart3, Shield, Leaf, Building2,
};

const TX_TYPES: TxType[] = [
  "Purchase", "Sale", "Dividend", "Interest", "Fee/Commission",
  "Withholding Tax", "Return of Capital", "Reinvested Dividend",
];

const IIC = 'input-double-border h-9 text-sm px-3 border border-[#dcdfe4] rounded-[10px] bg-white dark:bg-card text-foreground transition-all duration-200 hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)] focus:outline-none focus:ring-0';

export default function InvPlaidConnectDialog({
  defaultPeriodStart, defaultPeriodEnd, entityName, onImport,
}: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [inst, setInst] = useState<PlaidInstitution | null>(null);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [selectedAccIds, setSelectedAccIds] = useState<Set<string>>(new Set());
  const [start, setStart] = useState(defaultPeriodStart);
  const [end, setEnd] = useState(defaultPeriodEnd);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Record<string, PlaidInvestmentTxn[]>>({});
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [edits, setEdits] = useState<Record<string, Partial<PlaidInvestmentTxn>>>({});

  const reset = () => {
    setStep(1); setInst(null); setUser(""); setPass("");
    setSelectedAccIds(new Set()); setStart(defaultPeriodStart); setEnd(defaultPeriodEnd);
    setLoading(false); setPreview({}); setSkipped(new Set()); setEdits({});
  };

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) setTimeout(reset, 200);
  };

  const selectedAccounts = useMemo(
    () => inst?.accounts.filter((a) => selectedAccIds.has(a.id)) ?? [],
    [inst, selectedAccIds],
  );

  const fetchPreview = async () => {
    if (!inst) return;
    setLoading(true);
    try {
      const out: Record<string, PlaidInvestmentTxn[]> = {};
      for (const acc of selectedAccounts) {
        out[acc.id] = await fetchMockInvestmentTransactions(acc, start, end);
      }
      setPreview(out);
      setStep(5);
    } finally { setLoading(false); }
  };

  const totalPreview = Object.values(preview).flat().length;
  const totalKept = Object.values(preview).flat().filter((t) => !skipped.has(t.id)).length;

  const doImport = () => {
    if (!inst) return;
    const newSources: Source[] = [];
    const newTxns: Transaction[] = [];
    for (const acc of selectedAccounts) {
      const src = plaidAccountToSource(inst, acc, start, end, entityName);
      newSources.push(src);
      const accTxns = (preview[acc.id] ?? [])
        .filter((t) => !skipped.has(t.id))
        .map((t) => ({ ...t, ...edits[t.id] }));
      for (const t of accTxns) {
        newTxns.push(plaidToSourceTransaction(t, src.id));
      }
    }
    onImport(newSources, newTxns);
    toast.success(
      `Imported ${newTxns.length} transaction${newTxns.length === 1 ? "" : "s"} from ${newSources.length} account${newSources.length === 1 ? "" : "s"}.`,
    );
    close(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <Plug className="h-4 w-4" /> Connect
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plug className="h-4 w-4 text-primary" /> Plaid Link
            <Badge variant="outline" className="text-[10px] font-mono">SANDBOX</Badge>
          </DialogTitle>
          <DialogDescription>
            Step {step} of 5 — {[
              "Select institution", "Sign in", "Choose accounts",
              "Date range", "Review & import",
            ][step - 1]}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: institution */}
        {step === 1 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2">
            {MOCK_INSTITUTIONS.map((i) => {
              const Icon = ICON_MAP[i.iconName] ?? Landmark;
              return (
                <button
                  key={i.id}
                  onClick={() => { setInst(i); setStep(2); }}
                  className="rounded-xl border border-border bg-card p-4 text-left hover:bg-accent transition-colors flex items-center gap-3"
                >
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${i.color}22` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: i.color }} />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{i.name}</div>
                    <div className="text-xs text-muted-foreground">{i.accounts.length} accounts</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 2: sign in (mock) */}
        {step === 2 && inst && (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-center gap-3">
              {(() => { const Icon = ICON_MAP[inst.iconName] ?? Landmark; return (
                <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${inst.color}22` }}>
                  <Icon className="h-5 w-5" style={{ color: inst.color }} />
                </div>
              ); })()}
              <div>
                <div className="font-medium text-sm">{inst.name}</div>
                <div className="text-xs text-muted-foreground">Sandbox credentials — any value works</div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="plaid-user">Username</label>
              <Input id="plaid-user" value={user} onChange={(e) => setUser(e.target.value)} placeholder="user_good" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="plaid-pass">Password</label>
              <Input id="plaid-pass" type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="pass_good" />
            </div>
          </div>
        )}

        {/* Step 3: accounts */}
        {step === 3 && inst && (
          <div className="space-y-2 py-2">
            <div className="text-xs text-muted-foreground mb-2">
              Choose which accounts to import. Each becomes its own Source.
            </div>
            {inst.accounts.map((a) => {
              const checked = selectedAccIds.has(a.id);
              return (
                <label
                  key={a.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-accent"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) => {
                      setSelectedAccIds((s) => {
                        const next = new Set(s);
                        if (c) next.add(a.id); else next.delete(a.id);
                        return next;
                      });
                    }}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{a.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">····{a.mask} · {a.currency} · {a.subtype}</div>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {/* Step 4: date range */}
        {step === 4 && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="plaid-start">Start date</label>
                <Input id="plaid-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="plaid-end">End date</label>
                <Input id="plaid-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Defaults to your engagement period. Pulling investment transactions for {selectedAccounts.length} account{selectedAccounts.length === 1 ? "" : "s"}.
            </div>
          </div>
        )}

        {/* Step 5: review */}
        {step === 5 && (
          <div className="max-h-[420px] overflow-y-auto overflow-x-hidden">
            <div className="space-y-4 py-1">
              {selectedAccounts.map((acc) => {
                const txns = preview[acc.id] ?? [];
                return (
                  <div key={acc.id} className="rounded-xl border border-border bg-card overflow-x-auto">
                    <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
                      <div className="text-sm font-medium">
                        {inst?.name} — {acc.name} <span className="font-mono text-xs text-muted-foreground">····{acc.mask}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{txns.length} txns</Badge>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-8"></th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Security</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Units</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fees</th>
                          </tr>
                        </thead>
                        <tbody>
                          {txns.map((t) => {
                            const e = edits[t.id] ?? {};
                            const eff = { ...t, ...e };
                            const isSkipped = skipped.has(t.id);
                            return (
                              <tr key={t.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${isSkipped ? "opacity-40" : ""}`}>
                                <td className="px-4 py-3">
                                  <Checkbox
                                    checked={!isSkipped}
                                    onCheckedChange={(c) => {
                                      setSkipped((s) => {
                                        const next = new Set(s);
                                        if (c) next.delete(t.id); else next.add(t.id);
                                        return next;
                                      });
                                    }}
                                  />
                                </td>
                                <td className="px-4 py-3 font-mono text-xs">{eff.date}</td>
                                <td className="px-4 py-3">
                                  <select
                                    value={eff.type}
                                    onChange={(ev) => setEdits((m) => ({ ...m, [t.id]: { ...m[t.id], type: ev.target.value as TxType } }))}
                                    className={`${IIC} cursor-pointer`}
                                  >
                                    {TX_TYPES.map((tt) => <option key={tt} value={tt}>{tt}</option>)}
                                  </select>
                                </td>
                                <td className="px-4 py-3 text-xs">
                                  <div className="font-medium">{eff.ticker}</div>
                                  <div className="text-muted-foreground">{eff.security}</div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <Input
                                    className="w-20 text-right ml-auto"
                                    type="number"
                                    value={eff.units}
                                    onChange={(ev) => setEdits((m) => ({ ...m, [t.id]: { ...m[t.id], units: Number(ev.target.value) } }))}
                                  />
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <Input
                                    className="w-24 text-right ml-auto"
                                    type="number"
                                    step="0.01"
                                    value={eff.price}
                                    onChange={(ev) => setEdits((m) => ({ ...m, [t.id]: { ...m[t.id], price: Number(ev.target.value) } }))}
                                  />
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <Input
                                    className="w-20 text-right ml-auto"
                                    type="number"
                                    step="0.01"
                                    value={eff.fees}
                                    onChange={(ev) => setEdits((m) => ({ ...m, [t.id]: { ...m[t.id], fees: Number(ev.target.value) } }))}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                  </div>
                );
              })}
              <div className="text-xs text-muted-foreground text-center">
                {totalKept} of {totalPreview} transactions will be imported as <strong>Pending</strong>.
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || loading}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>

          {step < 4 && (
            <Button
              size="sm"
              onClick={() => setStep((s) => s + 1)}
              disabled={
                (step === 1 && !inst) ||
                (step === 3 && selectedAccIds.size === 0)
              }
              className="gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {step === 4 && (
            <Button size="sm" onClick={fetchPreview} disabled={loading} className="gap-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
              {loading ? "Fetching..." : "Fetch transactions"}
            </Button>
          )}
          {step === 5 && (
            <Button size="sm" onClick={doImport} disabled={totalKept === 0} className="gap-1">
              <CheckCircle2 className="h-4 w-4" /> Import {totalKept} as Pending
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
