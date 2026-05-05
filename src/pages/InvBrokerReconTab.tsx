import { Fragment, useState, useMemo } from 'react';
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronRight, Pencil, Check, X } from 'lucide-react';
import { Badge } from '@/components/wp-ui/badge';
import { Button } from '@/components/wp-ui/button';
import type { InvestmentReconGroup, CashReconRow } from '@/lib/luka/compute';
import { fmtNum, fmtCcy } from './InvHoldingsTab';
import { ColFilter, ClearFiltersBtn } from './InvTableFilters';
import toast from 'react-hot-toast';

interface Props {
  invRecon: InvestmentReconGroup[];
  cashRecon: CashReconRow[];
}

const StatusPill = ({ ok, label }: { ok: boolean; label: string }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${ok ? "border-green-500/30 bg-green-500/10 text-green-700" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>
    {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
    {label}
  </span>
);

export function InvBrokerReconTab({ invRecon, cashRecon }: Props) {
  const [openReconBroker, setOpenReconBroker] = useState<string | null>(null);
  const [openReconCash,   setOpenReconCash]   = useState<string | null>(null);

  // Cash account inline edits
  const [cashEdits, setCashEdits] = useState<Record<string, {glBalance?: number; stmtBalance?: number}>>({});
  const [editCashId, setEditCashId] = useState<string | null>(null);
  const [editCashData, setEditCashData] = useState<{glBalance?: number; stmtBalance?: number}>({});

  // Investment statements filters
  const [invFilterCcy,    setInvFilterCcy]    = useState("");
  const [invFilterStatus, setInvFilterStatus] = useState("");

  // Cash accounts filters
  const [cashFilterCcy,    setCashFilterCcy]    = useState("");
  const [cashFilterStatus, setCashFilterStatus] = useState("");

  const anyInvFilter  = invFilterCcy  || invFilterStatus;
  const anyCashFilter = cashFilterCcy || cashFilterStatus;

  const invCcys  = useMemo(() => Array.from(new Set(invRecon.map((g)  => g.currency))).sort(), [invRecon]);
  const cashCcys = useMemo(() => Array.from(new Set(cashRecon.map((c) => c.currency))).sort(), [cashRecon]);

  const visibleInv = useMemo(() => {
    let rows = invRecon;
    if (invFilterCcy)    rows = rows.filter((g) => g.currency === invFilterCcy);
    if (invFilterStatus) rows = rows.filter((g) => (g.pass ? "Pass" : "Variance") === invFilterStatus);
    return rows;
  }, [invRecon, invFilterCcy, invFilterStatus]);

  const visibleCash = useMemo(() => {
    let rows = cashRecon;
    if (cashFilterCcy)    rows = rows.filter((c) => c.currency === cashFilterCcy);
    if (cashFilterStatus) rows = rows.filter((c) => (c.pass ? "Pass" : "Variance") === cashFilterStatus);
    return rows;
  }, [cashRecon, cashFilterCcy, cashFilterStatus]);

  const allInv  = invRecon.length;
  const passInv = invRecon.filter((g) => g.pass).length;
  const allCash = cashRecon.length;
  const passCash = cashRecon.filter((c) => c.pass).length;

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Reconciliation</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {allInv + allCash} accounts · {passInv + passCash} Pass · {(allInv + allCash) - (passInv + passCash)} with variance · $1 threshold
          </p>
        </div>
      </div>

      {/* ── Investment statements ───────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border font-semibold text-sm flex items-center justify-between flex-wrap gap-2">
          <span>Investment statements</span>
          {anyInvFilter && (
            <ClearFiltersBtn onClick={() => { setInvFilterCcy(""); setInvFilterStatus(""); }} />
          )}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-8"></th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Institution</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Acct</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <ColFilter label="CCY" options={invCcys} value={invFilterCcy} onChange={setInvFilterCcy} />
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Units</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cost</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">FMV</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <ColFilter label="Status" options={["Pass", "Variance"]} value={invFilterStatus} onChange={setInvFilterStatus} />
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleInv.map((g) => {
              const open = openReconBroker === g.sourceId;
              const unitsOk = g.positions.every((r) => Math.abs(r.varianceUnits) < 0.001);
              const costOk  = g.positions.every((r) => Math.abs(r.varianceCost)  < 1);
              const fmvOk   = g.positions.every((r) => Math.abs(r.varianceFmv)   < 1);
              return (
                <Fragment key={g.sourceId}>
                  <tr
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setOpenReconBroker(open ? null : g.sourceId)}
                  >
                    <td className="px-4 py-3">
                      {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{g.sourceId}</Badge></td>
                    <td className="px-4 py-3 font-medium text-sm">{g.institution}</td>
                    <td className="px-4 py-3 font-mono text-xs">····{g.last4}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs font-mono">{g.currency}</Badge></td>
                    <td className="px-4 py-3 text-center">
                      {unitsOk ? <CheckCircle2 className="h-4 w-4 text-green-600 inline" /> : <AlertTriangle className="h-4 w-4 text-destructive inline" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {costOk ? <CheckCircle2 className="h-4 w-4 text-green-600 inline" /> : <AlertTriangle className="h-4 w-4 text-destructive inline" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {fmvOk ? <CheckCircle2 className="h-4 w-4 text-green-600 inline" /> : <AlertTriangle className="h-4 w-4 text-destructive inline" />}
                    </td>
                    <td className="px-4 py-3 text-center"><StatusPill ok={g.pass} label={g.pass ? "Pass" : "Variance"} /></td>
                  </tr>
                  {open && (
                    <tr className="bg-muted/20 hover:bg-muted/20">
                      <td colSpan={9} className="p-0">
                        <div className="p-4 overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border bg-muted/30">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Security</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Units (Schedule / Stmt / Δ)</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cost (Schedule / Stmt / Δ)</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">FMV (Schedule / Stmt / Δ)</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {g.positions.map((r) => (
                                <tr key={r.ticker} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                  <td className="px-4 py-3 text-sm">
                                    <div className="font-medium">{r.security}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{r.ticker}</div>
                                  </td>
                                  <td className="px-4 py-3 text-right tabular-nums text-xs">
                                    {fmtNum(r.perScheduleUnits, 0)} / {fmtNum(r.perStmtUnits, 0)} /{" "}
                                    <span className={Math.abs(r.varianceUnits) > 0.001 ? "text-destructive font-medium" : "text-muted-foreground"}>
                                      {r.varianceUnits >= 0 ? "+" : ""}{fmtNum(r.varianceUnits, 0)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right tabular-nums text-xs">
                                    {fmtCcy(r.perScheduleCost, r.ccy)} / {fmtCcy(r.perStmtCost, r.ccy)} /{" "}
                                    <span className={Math.abs(r.varianceCost) > 1 ? "text-destructive font-medium" : "text-muted-foreground"}>
                                      {fmtCcy(r.varianceCost, r.ccy)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right tabular-nums text-xs">
                                    {fmtCcy(r.perScheduleFmv, r.ccy)} / {fmtCcy(r.perStmtFmv, r.ccy)} /{" "}
                                    <span className={Math.abs(r.varianceFmv) > 1 ? "text-destructive font-medium" : "text-muted-foreground"}>
                                      {fmtCcy(r.varianceFmv, r.ccy)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {r.pass ? <CheckCircle2 className="h-4 w-4 text-green-600 inline" /> : (
                                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast("AJE drafted from variance")}>
                                        Create AJE
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {visibleInv.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  {anyInvFilter ? "No accounts match the active filters." : "No investment accounts."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Cash accounts ──────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border font-semibold text-sm flex items-center justify-between flex-wrap gap-2">
          <span>Cash accounts</span>
          {anyCashFilter && (
            <ClearFiltersBtn onClick={() => { setCashFilterCcy(""); setCashFilterStatus(""); }} />
          )}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-8"></th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Account</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <ColFilter label="CCY" options={cashCcys} value={cashFilterCcy} onChange={setCashFilterCcy} />
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">GL Balance</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stmt Balance</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Variance</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <ColFilter label="Status" options={["Pass", "Variance"]} value={cashFilterStatus} onChange={setCashFilterStatus} />
              </th>
              <th className="px-3 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {visibleCash.map((c) => {
              const open = openReconCash === c.sourceId;
              const gl = cashEdits[c.sourceId]?.glBalance ?? c.glBalance;
              const stmt = cashEdits[c.sourceId]?.stmtBalance ?? c.stmtBalance;
              const variance = stmt - gl;
              return (
                <Fragment key={c.sourceId}>
                  <tr
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={(e) => { if ((e.target as HTMLElement).closest('button,input')) return; setOpenReconCash(open ? null : c.sourceId); }}
                  >
                    <td className="px-4 py-3">
                      {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </td>
                    <td className="px-4 py-3 font-medium text-sm">
                      {c.institution} <span className="font-mono text-xs text-muted-foreground">····{c.last4}</span>
                    </td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs font-mono">{c.currency}</Badge></td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {editCashId === c.sourceId
                        ? <input type="number" value={editCashData.glBalance ?? 0} onChange={e => setEditCashData(d => ({...d, glBalance: parseFloat(e.target.value)||0}))} className="h-7 w-28 text-xs px-2 border border-border rounded-md bg-background text-right" />
                        : fmtCcy(gl, c.currency)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {editCashId === c.sourceId
                        ? <input type="number" value={editCashData.stmtBalance ?? 0} onChange={e => setEditCashData(d => ({...d, stmtBalance: parseFloat(e.target.value)||0}))} className="h-7 w-28 text-xs px-2 border border-border rounded-md bg-background text-right" />
                        : fmtCcy(stmt, c.currency)}
                    </td>
                    <td className={`px-4 py-3 text-right tabular-nums ${Math.abs(variance) > 1 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                      {fmtCcy(variance, c.currency)}
                    </td>
                    <td className="px-4 py-3 text-center"><StatusPill ok={c.pass} label={c.pass ? "Pass" : "Variance"} /></td>
                    <td className="px-3 py-3">
                      {editCashId === c.sourceId ? (
                        <div className="flex gap-0.5">
                          <button onClick={() => { setCashEdits(prev => ({...prev, [c.sourceId]: editCashData})); setEditCashId(null); toast('Balance updated'); }} className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600"><Check className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setEditCashId(null)} className="p-1.5 hover:bg-muted rounded-lg text-foreground"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      ) : (
                        <div className="flex gap-0.5 ">
                          <button onClick={() => { setEditCashId(c.sourceId); setEditCashData({ glBalance: cashEdits[c.sourceId]?.glBalance ?? c.glBalance, stmtBalance: cashEdits[c.sourceId]?.stmtBalance ?? c.stmtBalance }); }} className="p-1.5 hover:bg-muted rounded-lg text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {open && (
                    <tr className="bg-muted/20 hover:bg-muted/20">
                      <td colSpan={8} className="px-4 py-4 text-sm">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="text-xs text-muted-foreground">
                            Drill-in: review cleared vs uncleared transactions for this account.
                            Variance of {fmtCcy(variance, c.currency)} likely outstanding deposit/withdrawal.
                          </div>
                          {!c.pass && (
                            <Button size="sm" variant="outline" onClick={() => toast("AJE drafted from variance")}>
                              Create AJE
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {visibleCash.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  {anyCashFilter ? "No accounts match the active filters." : "No cash accounts."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
