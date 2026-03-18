import React from 'react';
import { TrendingDown, TrendingUp, DollarSign, AlertTriangle, CheckCircle, Clock, FileText, CalendarClock, ShieldAlert, Minus, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useStore } from '../store/useStore';
import { fmtCurrency, fmtPct, fmtDateDisplay, buildMaturityLadder, exportToExcel, buildDashboardExport } from '../lib/utils';
import { getProjectedStatus } from '../lib/covenantTemplates';
import { StyledCard } from '@/components/wp-ui/card';
import { Badge } from '@/components/wp-ui/badge';
import { Button } from '@/components/wp-ui/button';
import toast from 'react-hot-toast';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

type StatVariant = 'default' | 'warning' | 'danger';

const variantBorder: Record<StatVariant, string> = {
  default: 'border-border',
  warning: 'border-amber-200 bg-amber-50/60',
  danger:  'border-red-200  bg-red-50/60',
};

export function DashboardTab() {
  const { loans, covenants, jes, reconciliation, amortization, settings } = useStore(s => ({
    loans:          s.loans.filter(l => l.status !== 'Inactive'),
    covenants:      s.covenants,
    jes:            s.jes,
    reconciliation: s.reconciliation,
    amortization:   s.amortization,
    settings:       s.settings,
  }));

  const activeLoans = loans.filter(l => l.status === 'Active');

  // CAD equivalents (USD × 1.3530)
  const usdRate = 1.3530;
  const toCAD = (loan: typeof loans[0]) => loan.currency === 'USD' ? usdRate : 1;

  const totalDebt            = activeLoans.reduce((sum, l) => sum + l.currentBalance  * toCAD(l), 0);
  const totalCurrentPortion  = activeLoans.reduce((sum, l) => sum + l.currentPortion  * toCAD(l), 0);
  const totalLTDebt          = activeLoans.reduce((sum, l) => sum + l.longTermPortion * toCAD(l), 0);
  const totalAccruedInterest = activeLoans.reduce((sum, l) => sum + l.accruedInterest * toCAD(l), 0);

  const breachedCovenants = covenants.filter(c => c.status === 'Breached').length;
  const atRiskCovenants   = covenants.filter(c => c.status === 'At Risk').length;
  const pendingJEs        = jes.filter(j => j.status === 'Draft').length;
  const variances         = reconciliation.filter(r => r.status === 'Variance').length;

  // Maturity alerts — loans expiring within 12 months
  const today = new Date();
  const maturingLoans = activeLoans
    .filter(l => l.maturityDate)
    .map(l => {
      const days = Math.round((new Date(l.maturityDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...l, daysUntilMaturity: days };
    })
    .filter(l => l.daysUntilMaturity >= 0 && l.daysUntilMaturity <= 365)
    .sort((a, b) => a.daysUntilMaturity - b.daysUntilMaturity);

  const maturityLabel = (days: number) => {
    if (days <= 30)  return 'within 1 month';
    if (days <= 90)  return 'within 3 months';
    if (days <= 180) return 'within 6 months';
    if (days <= 270) return 'within 9 months';
    return 'within 12 months';
  };

  const maturityLadder = buildMaturityLadder(activeLoans, amortization, settings.fiscalYearEnd);
  const maturityData   = maturityLadder.map(b => ({ name: b.label, amount: Math.round(b.amount / 1000) }));

  const loanBreakdown = activeLoans.map((l, i) => ({
    name:  l.name,
    value: Math.round(l.currentBalance * toCAD(l)),
    color: COLORS[i % COLORS.length],
  }));

  const statCards: { label: string; value: string; sub: string; icon: React.ReactNode; variant: StatVariant }[] = [
    {
      label:   'Total Debt (CAD)',
      value:   fmtCurrency(totalDebt, 'CAD', true),
      sub:     `${activeLoans.length} active facilities`,
      icon:    <DollarSign className="w-4 h-4" />,
      variant: 'default',
    },
    {
      label:   'Current Portion',
      value:   fmtCurrency(totalCurrentPortion, 'CAD', true),
      sub:     'Due within 12 months',
      icon:    <Clock className="w-4 h-4" />,
      variant: totalCurrentPortion > 800_000 ? 'warning' : 'default',
    },
    {
      label:   'Accrued Interest',
      value:   fmtCurrency(totalAccruedInterest, 'CAD', true),
      sub:     'YE accrual (3 loans)',
      icon:    <TrendingDown className="w-4 h-4" />,
      variant: 'default',
    },
    {
      label:   'Covenant Issues',
      value:   `${breachedCovenants} Breached`,
      sub:     `${atRiskCovenants} at risk`,
      icon:    <AlertTriangle className="w-4 h-4" />,
      variant: breachedCovenants > 0 ? 'danger' : atRiskCovenants > 0 ? 'warning' : 'default',
    },
  ];

  const handleExport = async () => {
    const kpis = statCards.map(s => ({ label: s.label, value: s.value, sub: s.sub }));
    const sheets = buildDashboardExport(loans, covenants, kpis);
    await exportToExcel(sheets, 'Dashboard_Summary.xlsx');
    toast.success('Dashboard exported');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Dashboard</h2>
          <p className="text-xs text-foreground/60 mt-0.5">Portfolio overview · KPIs, covenant status, and maturity outlook</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download className="w-3.5 h-3.5 mr-1" /> Export
        </Button>
      </div>
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div
            key={s.label}
            className={`px-5 py-4 bg-card border shadow-sm flex flex-col gap-1 ${variantBorder[s.variant]}`}
            style={{ borderRadius: '12px' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{s.label}</span>
              <span className="text-foreground/40">{s.icon}</span>
            </div>
            <div className="text-xl font-semibold text-foreground tabular-nums">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Maturity Ladder */}
        <StyledCard className="lg:col-span-2 p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Principal Maturity Ladder (CAD $000s)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={maturityData} barSize={36}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={50} />
              <Tooltip
                formatter={(v: number) => [`$${v.toLocaleString()}K`, 'Principal']}
                contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
              />
              <Bar dataKey="amount" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </StyledCard>

        {/* Portfolio Breakdown */}
        <StyledCard className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Portfolio Breakdown</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={loanBreakdown}
                cx="50%" cy="50%"
                innerRadius={45} outerRadius={70}
                dataKey="value"
                strokeWidth={2}
                stroke="#F8FAFC"
              >
                {loanBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip
                formatter={(v: number) => [`$${(v / 1000).toFixed(0)}K`, 'Balance']}
                contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {loanBreakdown.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-muted-foreground truncate max-w-[100px]">{item.name}</span>
                </div>
                <span className="tabular-nums font-medium text-foreground">{fmtCurrency(item.value, 'CAD', true)}</span>
              </div>
            ))}
          </div>
        </StyledCard>
      </div>

      {/* Loan Summary Cards */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Facility Summary</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {activeLoans.map(loan => {
            const cad         = toCAD(loan);
            const utilization = loan.type === 'LOC' && loan.creditLimit
              ? (loan.currentBalance / loan.creditLimit) * 100
              : null;
            const loanCovenants = covenants.filter(c => loan.covenantIds.includes(c.id));

            return (
              <StyledCard key={loan.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{loan.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{loan.lender} · {loan.refNumber}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline">{loan.currency}</Badge>
                    <Badge variant="success">Active</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-foreground/40 mb-0.5">Current Balance</div>
                    <div className="font-semibold text-foreground tabular-nums">{fmtCurrency(loan.currentBalance, loan.currency)}</div>
                    {loan.currency !== 'CAD' && (
                      <div className="text-foreground/40">≈ {fmtCurrency(loan.currentBalance * cad, 'CAD', true)} CAD</div>
                    )}
                  </div>
                  <div>
                    <div className="text-foreground/40 mb-0.5">Rate</div>
                    <div className="font-semibold text-foreground">{fmtPct(loan.rate)}{loan.interestType === 'Variable' ? ' V' : ''}</div>
                    <div className="text-foreground/40">{loan.dayCountBasis}</div>
                  </div>
                  <div>
                    <div className="text-foreground/40 mb-0.5">Current Portion</div>
                    <div className="font-medium text-foreground tabular-nums">{fmtCurrency(loan.currentPortion, loan.currency)}</div>
                  </div>
                  <div>
                    <div className="text-foreground/40 mb-0.5">Accrued Interest</div>
                    <div className="font-medium text-amber-700 tabular-nums">{fmtCurrency(loan.accruedInterest, loan.currency)}</div>
                  </div>
                </div>

                {utilization !== null && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-foreground/40">LOC Utilization</span>
                      <span className="font-medium text-foreground">{fmtPct(utilization, 0)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${utilization}%` }} />
                    </div>
                  </div>
                )}

                {loanCovenants.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-1.5">
                    {loanCovenants.map(c => (
                      <Badge
                        key={c.id}
                        variant={c.status === 'Breached' ? 'destructive' : c.status === 'At Risk' ? 'warning' : 'success'}
                      >
                        {c.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </StyledCard>
            );
          })}
        </div>
      </div>

      {/* Maturity Buckets + Covenant Outlook */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Maturity Bucket Detail */}
        <StyledCard className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Maturity Schedule — By Bucket</h3>
          {[
            { label: '≤ 3 months',  days: 90  },
            { label: '3–6 months',  days: 180 },
            { label: '6–9 months',  days: 270 },
            { label: '9–12 months', days: 365 },
          ].map(({ label, days: maxDays }, idx, arr) => {
            const minDays = idx === 0 ? 0 : arr[idx - 1].days;
            const bucket = activeLoans.filter(l => {
              const d = Math.round((new Date(l.maturityDate).getTime() - today.getTime()) / 86400000);
              return d > minDays && d <= maxDays;
            });
            if (bucket.length === 0) return (
              <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-xs">
                <span className="text-foreground/40">{label}</span>
                <span className="text-foreground/30">—</span>
              </div>
            );
            return (
              <div key={label} className="py-2 border-b border-border last:border-0">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`font-semibold ${maxDays <= 90 ? 'text-red-700' : maxDays <= 180 ? 'text-amber-700' : 'text-foreground/70'}`}>{label}</span>
                  <span className="text-foreground/50">{bucket.length} facilit{bucket.length > 1 ? 'ies' : 'y'}</span>
                </div>
                {bucket.map(l => (
                  <div key={l.id} className="flex items-center justify-between text-xs pl-2 py-0.5">
                    <div className="flex items-center gap-1.5">
                      <CalendarClock className={`w-3 h-3 ${maxDays <= 90 ? 'text-red-500' : 'text-amber-500'}`} />
                      <span className="text-foreground/70">{l.name}</span>
                      <span className="text-foreground/40">{fmtDateDisplay(l.maturityDate)}</span>
                    </div>
                    <span className="tabular-nums font-medium text-foreground/80">{fmtCurrency(l.currentBalance, l.currency)}</span>
                  </div>
                ))}
              </div>
            );
          })}
          {maturingLoans.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 py-2"><CheckCircle className="w-3.5 h-3.5" /> No maturities within 12 months</div>
          )}
        </StyledCard>

        {/* Covenant Outlook */}
        <StyledCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-foreground/40" />
            <h3 className="text-sm font-semibold text-foreground">Covenant Outlook</h3>
            <span className="text-xs text-foreground/40 ml-auto">Current → Projected</span>
          </div>
          <div className="space-y-1.5">
            {covenants.filter(c => c.type === 'Quantitative' && c.currentValue !== undefined).map(c => {
              const loan = activeLoans.find(l => l.covenantIds.includes(c.id));
              const projSt = (c.projectedValue !== undefined && c.threshold !== undefined && c.operator)
                ? getProjectedStatus(c.projectedValue, c.threshold, c.operator)
                : null;
              const dir = c.projectedValue !== undefined && c.currentValue !== undefined
                ? (c.projectedValue > c.currentValue ? 'up' : c.projectedValue < c.currentValue ? 'down' : 'flat')
                : null;
              const fmtV = (v: number) => c.isRatioCovenant ? `${v.toFixed(2)}x` : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : v.toFixed(2);
              const worsening = projSt && (
                (c.status === 'OK' && (projSt === 'At Risk' || projSt === 'Breached')) ||
                (c.status === 'At Risk' && projSt === 'Breached')
              );
              return (
                <div key={c.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${worsening ? 'bg-amber-50' : 'bg-muted/30'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{c.name}</div>
                    {loan && <div className="text-foreground/40 truncate">{loan.name}</div>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`tabular-nums font-semibold ${c.status === 'Breached' ? 'text-red-600' : c.status === 'At Risk' ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {fmtV(c.currentValue!)}
                    </span>
                    {dir === 'up'   && <TrendingUp   className="w-3 h-3 text-emerald-500" />}
                    {dir === 'down' && <TrendingDown  className="w-3 h-3 text-red-500" />}
                    {dir === 'flat' && <Minus         className="w-3 h-3 text-foreground/30" />}
                    {c.projectedValue !== undefined && (
                      <span className={`tabular-nums font-semibold ${projSt === 'Breached' ? 'text-red-600' : projSt === 'At Risk' ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {fmtV(c.projectedValue)}
                      </span>
                    )}
                    {projSt && projSt !== c.status && (
                      <Badge variant={projSt === 'Breached' ? 'destructive' : projSt === 'At Risk' ? 'warning' : 'success'} className="text-[10px] px-1 py-0">
                        {projSt}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </StyledCard>
      </div>

      {/* Action Items Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending Actions */}
        <StyledCard className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Pending Actions</h3>
          <div className="space-y-2">
            {maturingLoans.map(l => (
              <ActionRow
                key={l.id}
                icon={<CalendarClock className="w-3.5 h-3.5 text-red-500" />}
                label={`${l.name} matures ${maturityLabel(l.daysUntilMaturity)}`}
                detail={`${fmtDateDisplay(l.maturityDate)} · ${fmtCurrency(l.currentBalance, l.currency)} outstanding`}
                severity={l.daysUntilMaturity <= 90 ? 'danger' : 'warning'}
              />
            ))}
            {pendingJEs > 0 && (
              <ActionRow
                icon={<FileText className="w-3.5 h-3.5 text-amber-500" />}
                label={`${pendingJEs} AJEs in Draft`}
                detail="Require preparer review and approval"
                severity="warning"
              />
            )}
            {variances > 0 && (
              <ActionRow
                icon={<AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                label={`${variances} Reconciliation Variances`}
                detail="TB vs subledger differences detected"
                severity="danger"
              />
            )}
            {breachedCovenants > 0 && (
              <ActionRow
                icon={<AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                label={`${breachedCovenants} Covenant Breach`}
                detail="Disclosure may be required"
                severity="danger"
              />
            )}
            {atRiskCovenants > 0 && (
              <ActionRow
                icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                label={`${atRiskCovenants} Covenant At Risk`}
                detail="Close to threshold breach"
                severity="warning"
              />
            )}
            {maturingLoans.length === 0 && pendingJEs === 0 && variances === 0 && breachedCovenants === 0 && atRiskCovenants === 0 && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 py-2">
                <CheckCircle className="w-4 h-4" />
                <span>All items resolved</span>
              </div>
            )}
          </div>
        </StyledCard>

        {/* YE Summary */}
        <StyledCard className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Year-End Summary</h3>
          <div className="space-y-2 text-xs">
            {[
              { label: 'Total LT Debt (CAD equiv)',          value: fmtCurrency(totalDebt,           'CAD')                    },
              { label: 'Current Portion (reclass required)', value: fmtCurrency(totalCurrentPortion, 'CAD'), highlight: true   },
              { label: 'Long-Term Portion',                  value: fmtCurrency(totalLTDebt,          'CAD')                    },
              { label: 'Total Accrued Interest',             value: fmtCurrency(totalAccruedInterest, 'CAD'), highlight: true   },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-muted-foreground">{row.label}</span>
                <span className={`tabular-nums font-semibold ${row.highlight ? 'text-amber-700' : 'text-foreground'}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </StyledCard>
      </div>
    </div>
  );
}

function ActionRow({
  icon, label, detail, severity,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
  severity: 'warning' | 'danger';
}) {
  return (
    <div className={`flex items-start gap-2.5 p-2.5 rounded-lg text-xs ${severity === 'danger' ? 'bg-red-50' : 'bg-amber-50'}`}>
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className={`font-semibold ${severity === 'danger' ? 'text-red-800' : 'text-amber-800'}`}>{label}</p>
        <p className={severity === 'danger' ? 'text-red-600' : 'text-amber-600'}>{detail}</p>
      </div>
    </div>
  );
}
