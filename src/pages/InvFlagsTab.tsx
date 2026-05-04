import { Plug } from 'lucide-react';
import { Badge } from '@/components/wp-ui/badge';
import { Button } from '@/components/wp-ui/button';
import type { ComputeOptions } from '@/lib/luka/compute';
import type { Source, Transaction, PriorYearLot } from '@/lib/luka/types';
import InvPlaidConnectDialog from './InvPlaidConnectDialog';
import InvPriorYearImport from './InvPriorYearImport';
import InvSourceTransactionImport from './InvSourceTransactionImport';
import toast from 'react-hot-toast';

interface Props {
  allSources: Source[];
  opts: ComputeOptions;
  setOpts: (opts: ComputeOptions) => void;
  importedLots: PriorYearLot[] | null;
  effectivePY: PriorYearLot[];
  importedTxnsBySource: Record<string, Transaction[]>;
  onApplyLots: (lots: PriorYearLot[]) => void;
  onResetLots: () => void;
  onApplySourceTxns: (sid: string, txns: Transaction[]) => void;
  onResetSourceTxns: (sid: string) => void;
  onPlaidConnected: (sources: Source[], txns: Transaction[]) => void;
  onPlaidDisconnect: (sid: string) => void;
  setActiveTab: (tab: string) => void;
  entityName: string;
}

export function InvFlagsTab({
  allSources,
  opts,
  importedLots,
  importedTxnsBySource,
  onApplyLots,
  onResetLots,
  onApplySourceTxns,
  onResetSourceTxns,
  onPlaidConnected,
  onPlaidDisconnect,
  setActiveTab,
  entityName,
}: Props) {
  return (
    <div className="px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Sources</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Brokers, banks, and prior-year working papers tagged to this engagement
          </p>
        </div>
        <InvPlaidConnectDialog
          defaultPeriodStart="2024-01-01"
          defaultPeriodEnd="2024-12-31"
          entityName={entityName}
          onImport={(newSources, newTxns) => {
            onPlaidConnected(newSources, newTxns);
            setActiveTab("transactions");
          }}
        />
      </div>

      {/* Prior-year import card */}
      <InvPriorYearImport
        onApply={onApplyLots}
        onReset={onResetLots}
        applied={!!importedLots}
        appliedCount={importedLots?.length ?? 0}
      />

      {/* Sources table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Label</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Institution</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Acct</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Period</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">CCY</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Entity</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Import</th>
            </tr>
          </thead>
          <tbody>
            {allSources.filter((s) => opts.includePriorYear || s.id !== "PY").map((s) => {
              const isPlaid = s.id.startsWith("PLAID-");
              return (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline">{s.label}</Badge>
                      {isPlaid && (
                        <Badge variant="outline" className="text-[10px] gap-1 border-primary/40 bg-primary/10 text-primary">
                          <Plug className="h-3 w-3" /> Plaid
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{s.type}</td>
                  <td className="px-4 py-3 font-medium text-sm">{s.institution}</td>
                  <td className="px-4 py-3 font-mono text-xs">····{s.accountLast4}</td>
                  <td className="px-4 py-3 text-xs">{s.periodStart} → {s.periodEnd}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs font-mono">{s.currency}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.entityName}</td>
                  <td className="px-4 py-3">
                    {s.type === "Prior Year WP" ? (
                      <span className="text-xs text-muted-foreground">Use card above ↑</span>
                    ) : isPlaid ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => {
                          onPlaidDisconnect(s.id);
                          toast(`Disconnected ${s.institution}. Pending/approved transactions removed.`);
                        }}
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <InvSourceTransactionImport
                        source={s}
                        onApply={onApplySourceTxns}
                        onReset={onResetSourceTxns}
                        applied={!!importedTxnsBySource[s.id]}
                        appliedCount={importedTxnsBySource[s.id]?.length ?? 0}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
