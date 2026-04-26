import React, { useState } from 'react';
import { Download, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { StyledCard } from '@/components/wp-ui/card';
import { brokerReconPositions, brokerCashAccounts } from '../data/investmentData';
import type { BrokerReconPosition, BrokerCashAccount } from '../types/investmentTypes';
import toast from 'react-hot-toast';

function fmt(n: number, d = 2) { return n.toLocaleString('en-CA', { minimumFractionDigits: d, maximumFractionDigits: d }); }

const BROKERS = ['TD Waterhouse', 'RBC Direct Investing', 'Fidelity Investments', 'BMO InvestorLine'];
const CCY_SYMBOL: Record<string, string> = { CAD: '$', USD: 'US$', EUR: '€', GBP: '£' };

function VarCell({ value, d = 2 }: { value: number; d?: number }) {
  const sym = value === 0 ? 'text-green-600' : 'text-red-600 font-semibold';
  return (
    <td className={`px-3 py-2.5 text-right tabular-nums font-mono text-sm ${sym}`}>
      {value === 0 ? <CheckCircle2 className="w-4 h-4 inline text-green-600" /> : fmt(value, d)}
    </td>
  );
}

export function InvBrokerReconTab() {
  const [expandedBrokers, setExpandedBrokers] = useState<Set<string>>(new Set(BROKERS));
  const [section, setSection] = useState<'positions' | 'cash'>('positions');

  const toggle = (b: string) => setExpandedBrokers(prev => {
    const next = new Set(prev);
    next.has(b) ? next.delete(b) : next.add(b);
    return next;
  });

  const totalVarianceUnits = brokerReconPositions.reduce((s, r) => s + Math.abs(r.unitVariance), 0);
  const totalVarianceCost  = brokerReconPositions.reduce((s, r) => s + Math.abs(r.costVariance), 0);
  const totalVarianceCash  = brokerCashAccounts.reduce((s, r) => s + Math.abs(r.variance), 0);
  const allClean = totalVarianceUnits === 0 && totalVarianceCost === 0 && totalVarianceCash === 0;

  const handleExport = async () => {
    try {
      const posRows = brokerReconPositions.map(r => ({
        Security: r.security, Ticker: r.ticker, Broker: r.broker, Account: `…${r.acctLast4}`, CCY: r.currency,
        'Units per WAC': r.unitsPerWAC, 'Units per Statement': r.unitsPerStatement, 'Unit Variance': r.unitVariance,
        'Cost per WAC': r.costPerWAC, 'Cost per Statement': r.costPerStatement, 'Cost Variance': r.costVariance,
        'FMV per WAC': r.fmvPerWAC, 'FMV per Statement': r.fmvPerStatement, 'FMV Variance': r.fmvVariance,
      }));
      const cashRows = brokerCashAccounts.map(r => ({
        Broker: r.broker, Account: `…${r.acctLast4}`, CCY: r.currency,
        'Opening Balance': r.openingBalance, 'Closing per Books': r.closingPerBooks,
        'Closing per Statement': r.closingPerStatement, Variance: r.variance,
      }));
      const { exportToExcel, objsToAOA } = await import('../lib/utils');
      exportToExcel({ 'Position Recon': objsToAOA(posRows), 'Cash Recon': objsToAOA(cashRows) }, 'INV_BrokerRecon_FY2025.xlsx');
      toast.success('Broker Recon exported');
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Broker Reconciliation</h2>
          <p className="text-xs text-foreground mt-0.5">
            WAC schedule vs. broker statement — positions and cash accounts · Dec 31, 2025 · $1 variance threshold
          </p>
        </div>
        <div className="flex items-center gap-2">
          {allClean
            ? <Badge variant="success" className="text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> All reconciled</Badge>
            : <Badge variant="destructive" className="text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Variances found</Badge>}
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Section toggle */}
      <div className="flex items-center gap-1 bg-card rounded-lg border border-border p-1 w-fit">
        {(['positions', 'cash'] as const).map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              section === s ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
            }`}>
            {s === 'positions' ? 'Position Check' : 'Cash Accounts'}
          </button>
        ))}
      </div>

      {/* ── Section A: Position Check ──────────────────────────────────────────── */}
      {section === 'positions' && (
        <div className="space-y-3">
          {BROKERS.map(broker => {
            const rows = brokerReconPositions.filter((r: BrokerReconPosition) => r.broker === broker);
            if (!rows.length) return null;
            const isOpen = expandedBrokers.has(broker);
            const brokerVariance = rows.reduce((s, r) => s + Math.abs(r.unitVariance) + Math.abs(r.costVariance), 0);
            const acctLast4 = rows[0].acctLast4;

            return (
              <StyledCard key={broker} className="overflow-hidden p-0">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                  onClick={() => toggle(broker)}>
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="w-4 h-4 text-foreground" /> : <ChevronRight className="w-4 h-4 text-foreground" />}
                    <span className="font-semibold text-sm text-foreground">{broker}</span>
                    <span className="text-xs text-foreground">…{acctLast4}</span>
                    <Badge variant="outline" className="text-xs">{rows.length} positions</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {brokerVariance === 0
                      ? <Badge variant="success" className="text-xs"><CheckCircle2 className="w-3 h-3 mr-1 inline" />Pass</Badge>
                      : <Badge variant="destructive" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1 inline" />Variance</Badge>}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border">
                          <th className="text-left px-4 py-2 text-xs font-semibold uppercase text-foreground">Security</th>
                          <th className="text-center px-3 py-2 text-xs font-semibold uppercase text-foreground">CCY</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Units / WAC</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Units / Stmt</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground">Variance</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Cost / WAC</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Cost / Stmt</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground">Variance</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground whitespace-nowrap">FMV / WAC</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground whitespace-nowrap">FMV / Stmt</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold uppercase text-foreground">Variance</th>
                          <th className="text-center px-3 py-2 text-xs font-semibold uppercase text-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {rows.map((r: BrokerReconPosition) => {
                          const sym = CCY_SYMBOL[r.currency] ?? '';
                          const hasVariance = r.unitVariance !== 0 || r.costVariance !== 0 || r.fmvVariance !== 0;
                          return (
                            <tr key={r.id} className={`hover:bg-muted/20 ${hasVariance ? 'bg-red-50/30' : ''}`}>
                              <td className="px-4 py-2.5">
                                <div className="font-medium text-sm text-foreground">{r.security}</div>
                                <div className="text-xs text-foreground font-mono">{r.ticker}</div>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <Badge variant="outline" className="text-xs">{r.currency}</Badge>
                              </td>
                              <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">{fmt(r.unitsPerWAC, 0)}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">{fmt(r.unitsPerStatement, 0)}</td>
                              <VarCell value={r.unitVariance} d={0} />
                              <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">{sym}{fmt(r.costPerWAC)}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">{sym}{fmt(r.costPerStatement)}</td>
                              <VarCell value={r.costVariance} />
                              <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">{sym}{fmt(r.fmvPerWAC)}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">{sym}{fmt(r.fmvPerStatement)}</td>
                              <VarCell value={r.fmvVariance} />
                              <td className="px-3 py-2.5 text-center">
                                {hasVariance
                                  ? <Badge variant="destructive" className="text-xs">Review</Badge>
                                  : <Badge variant="success" className="text-xs">✓</Badge>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </StyledCard>
            );
          })}
        </div>
      )}

      {/* ── Section B: Cash Accounts ───────────────────────────────────────────── */}
      {section === 'cash' && (
        <StyledCard className="overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Settlement Account Balances — Dec 31, 2025</h3>
            {totalVarianceCash === 0
              ? <Badge variant="success" className="text-xs"><CheckCircle2 className="w-3 h-3 mr-1 inline" />All accounts reconciled</Badge>
              : <Badge variant="destructive" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1 inline" />Variances found</Badge>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase text-foreground">Broker</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase text-foreground">Account</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold uppercase text-foreground">CCY</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Opening Balance</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Closing per Books</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground whitespace-nowrap">Closing per Statement</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold uppercase text-foreground">Variance</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold uppercase text-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {brokerCashAccounts.map((r: BrokerCashAccount) => {
                  const sym = CCY_SYMBOL[r.currency] ?? '';
                  return (
                    <tr key={r.id} className={`hover:bg-muted/20 ${r.variance !== 0 ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-2.5 text-sm font-medium text-foreground">{r.broker.replace(' Investing', '').replace(' Investments', '')}</td>
                      <td className="px-3 py-2.5 text-xs font-mono text-foreground">…{r.acctLast4}</td>
                      <td className="px-3 py-2.5 text-center"><Badge variant="outline" className="text-xs">{r.currency}</Badge></td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm text-foreground">{sym}{fmt(r.openingBalance)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm font-semibold">{sym}{fmt(r.closingPerBooks)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-mono text-sm">{sym}{fmt(r.closingPerStatement)}</td>
                      <VarCell value={r.variance} />
                      <td className="px-3 py-2.5 text-center">
                        {r.variance !== 0
                          ? <Badge variant="destructive" className="text-xs">Review</Badge>
                          : <Badge variant="success" className="text-xs">✓</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/60">
                  <td colSpan={6} className="px-4 py-2.5 text-xs font-semibold text-foreground">Total variance across all accounts</td>
                  <td className={`px-3 py-2.5 text-right tabular-nums font-mono font-bold text-sm ${totalVarianceCash === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalVarianceCash === 0 ? <span className="flex items-center justify-end gap-1"><CheckCircle2 className="w-4 h-4" /> $0.00</span> : `$${fmt(totalVarianceCash)}`}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {totalVarianceCash === 0 ? <Badge variant="success" className="text-xs">Pass</Badge> : <Badge variant="destructive" className="text-xs">Fail</Badge>}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </StyledCard>
      )}
    </div>
  );
}
