import React from 'react';
import {
  LayoutDashboard, FileText, TrendingDown, BarChart3, Activity,
  ShieldCheck, Scale, FileCheck, Download, Settings2, Bell,
  ChevronRight, AlertTriangle, AlertCircle, Info, X, ChevronDown
} from 'lucide-react';
import { cn, fmtCurrency } from '../lib/utils';
import { useStore } from '../store/useStore';
import { Badge } from './ui';
import type { TabId } from '../types';

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const NAV_ITEMS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'loans', label: 'Loans', icon: FileText },
  { id: 'continuity', label: 'Continuity', icon: TrendingDown },
  { id: 'amortization', label: 'Amortization', icon: BarChart3 },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'covenants', label: 'Covenants', icon: ShieldCheck },
  { id: 'ajes', label: 'AJEs', icon: FileCheck },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'reconciliation', label: 'Reconciliation', icon: Scale },
  { id: 'reports', label: 'Reports', icon: Download },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

export function Sidebar() {
  const { ui, reviewQueue, setActiveTab, setReviewQueueOpen } = useStore(s => ({
    ui: s.ui, reviewQueue: s.reviewQueue,
    setActiveTab: s.setActiveTab, setReviewQueueOpen: s.setReviewQueueOpen
  }));

  const highCount = reviewQueue.filter(r => r.severity === 'High').length;
  const totalCount = reviewQueue.length;

  const getTabBadge = (tabId: TabId) => {
    const tabItems = reviewQueue.filter(r => r.tab === tabId.toLowerCase());
    if (tabItems.length === 0) return null;
    const hasHigh = tabItems.some(r => r.severity === 'High');
    return (
      <span className={cn(
        'ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium',
        hasHigh ? 'bg-red-500 text-white' : 'bg-amber-400 text-amber-900'
      )}>
        {tabItems.length}
      </span>
    );
  };

  return (
    <aside className="w-52 bg-slate-950 flex flex-col h-full flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <TrendingDown className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-white text-sm font-semibold">Long-Term Debt</div>
            <div className="text-slate-500 text-xs">Workpaper Tool</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
              ui.activeTab === id
                ? 'bg-brand-600 text-white font-medium'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">{label}</span>
            {getTabBadge(id)}
          </button>
        ))}
      </nav>

      {/* Review Queue Trigger */}
      <div className="px-2 pb-4">
        <button
          onClick={() => setReviewQueueOpen(true)}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all border',
            totalCount > 0
              ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 text-amber-400'
              : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-400'
          )}
        >
          <Bell className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left text-xs font-medium">Review Queue</span>
          {totalCount > 0 && (
            <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-semibold', highCount > 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-slate-900')}>
              {totalCount}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
export function Header() {
  const { settings, reviewQueue } = useStore(s => ({ settings: s.settings, reviewQueue: s.reviewQueue }));
  const blockers = reviewQueue.filter(r => r.severity === 'High').length;

  return (
    <header className="bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between flex-shrink-0 z-20">
      {/* Left: selectors */}
      <div className="flex items-center gap-3">
        <Selector label="Client" value={settings.client} />
        <Divider />
        <Selector label="Engagement" value={settings.engagement} />
        <Divider />
        <Selector label="Fiscal Year" value="FY2024" accent />
        <Divider />
        <Selector label="Period" value="Dec 2024" />
        <Divider />
        <Selector label="Currency" value={settings.baseCurrency} />
      </div>

      {/* Right: status + avatar */}
      <div className="flex items-center gap-3">
        <StatusChip blockers={blockers} status={settings.status} />
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-semibold">JM</div>
          <div className="hidden sm:block">
            <div className="text-xs font-medium text-slate-700">J. Martinez</div>
            <div className="text-xs text-slate-400">Preparer</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Selector({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <button className="flex items-center gap-1.5 group">
      <div className="text-right">
        <div className="text-xs text-slate-400">{label}</div>
        <div className={cn('text-xs font-semibold', accent ? 'text-brand-700' : 'text-slate-700')}>{value}</div>
      </div>
      <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-slate-200 flex-shrink-0" />;
}

function StatusChip({ blockers, status }: { blockers: number; status: string }) {
  if (status === 'Locked') return <Badge variant="purple" dot>Locked</Badge>;
  if (blockers > 0) return <Badge variant="danger" dot>{blockers} Blocker{blockers > 1 ? 's' : ''}</Badge>;
  if (status === 'Blocked') return <Badge variant="warning" dot>Needs Review</Badge>;
  return <Badge variant="success" dot>Ready</Badge>;
}

// ─── REVIEW QUEUE DRAWER ──────────────────────────────────────────────────────
const SEVERITY_ICONS: Record<string, React.ElementType> = {
  High: AlertCircle,
  Medium: AlertTriangle,
  Low: Info,
};
const SEVERITY_COLORS: Record<string, string> = {
  High: 'text-red-600 bg-red-50 border-red-200',
  Medium: 'text-amber-600 bg-amber-50 border-amber-200',
  Low: 'text-blue-600 bg-blue-50 border-blue-200',
};

export function ReviewQueueDrawer() {
  const { ui, reviewQueue, setReviewQueueOpen, resolveReviewItem, setActiveTab } = useStore(s => ({
    ui: s.ui, reviewQueue: s.reviewQueue,
    setReviewQueueOpen: s.setReviewQueueOpen,
    resolveReviewItem: s.resolveReviewItem,
    setActiveTab: s.setActiveTab,
  }));

  if (!ui.reviewQueueOpen) return null;

  const highItems = reviewQueue.filter(r => r.severity === 'High');
  const medItems = reviewQueue.filter(r => r.severity === 'Medium');
  const lowItems = reviewQueue.filter(r => r.severity === 'Low');

  const handleNavigate = (item: typeof reviewQueue[0]) => {
    setActiveTab(item.tab as TabId);
    setReviewQueueOpen(false);
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setReviewQueueOpen(false)} />
      <div className="relative bg-white w-96 h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Review Queue</h3>
            <p className="text-xs text-slate-500">{reviewQueue.length} item{reviewQueue.length !== 1 ? 's' : ''} need attention</p>
          </div>
          <button onClick={() => setReviewQueueOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {reviewQueue.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-slate-700">All clear</p>
              <p className="text-xs text-slate-400 mt-1">No items require attention</p>
            </div>
          )}
          {[...highItems, ...medItems, ...lowItems].map(item => {
            const Icon = SEVERITY_ICONS[item.severity];
            return (
              <div key={item.id} className={cn('border rounded-xl p-3 flex gap-3', SEVERITY_COLORS[item.severity])}>
                <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-snug">{item.title}</p>
                  <p className="text-xs mt-0.5 opacity-80 leading-relaxed">{item.description}</p>
                  {item.loanName && <p className="text-xs mt-1 opacity-60">{item.loanName}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleNavigate(item)}
                      className="text-xs font-medium underline hover:no-underline opacity-80 hover:opacity-100"
                    >
                      Go to {item.tab} →
                    </button>
                    <button
                      onClick={() => resolveReviewItem(item.id)}
                      className="text-xs opacity-60 hover:opacity-100"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
