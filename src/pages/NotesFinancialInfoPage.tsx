import { useState } from 'react';
import { ChevronDown, ChevronRight, Check, Trash2, Search, Plus, X } from 'lucide-react';
import { Button } from '@/components/wp-ui/button';
import { Checkbox } from '@/components/wp-ui/checkbox';

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'expanded' | 'consolidated';

interface GLItem {
  id: string;
  name: string;
  cy: number;   // current year value (negative = depreciation/credit)
  py: number;   // prior year value
  type: 'cost' | 'depreciation';
}

interface PPECategory {
  id: string;
  name: string;
  items: GLItem[];
}

interface NoteItem {
  id: string;
  number: number;
  title: string;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmt(v: number): string {
  if (v === 0) return '-';
  const abs = Math.abs(v).toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return v < 0 ? `(${abs})` : abs;
}

// ─── Mock data matching the Kendall Cab PDFs ──────────────────────────────────

const defaultCategories: PPECategory[] = [
  {
    id: 'computer',
    name: 'Computer equipment and software',
    items: [
      { id: 'c1',  name: 'Computer',                   cy: 11773,  py: 10088, type: 'cost'          },
      { id: 'cd1', name: 'Accum. Amort. - Computer',   cy: -7330,  py: -7330, type: 'depreciation'  },
    ],
  },
  {
    id: 'furniture',
    name: 'Furniture & fittings',
    items: [
      { id: 'f1',  name: 'Equipment',                           cy: 22312,  py: 22312,  type: 'cost'         },
      { id: 'f2',  name: 'Office Furniture',                    cy: 5411,   py: 5411,   type: 'cost'         },
      { id: 'fd1', name: 'Accum. Amort. - Equipment',           cy: -22312, py: -22470, type: 'depreciation' },
      { id: 'fd2', name: 'Accum. Amort. - Office Furniture',    cy: -4563,  py: -3899,  type: 'depreciation' },
    ],
  },
  {
    id: 'vehicles',
    name: 'Vehicles',
    items: [
      { id: 'v1',  name: 'Vehicles 6055N',                    cy: 24514,  py: 0,      type: 'cost'         },
      { id: 'v2',  name: 'Vehicles Grand Caravan 2020-804',   cy: 38258,  py: 0,      type: 'cost'         },
      { id: 'v3',  name: 'Vehicles Grand Caravan 2020-935',   cy: 36530,  py: 0,      type: 'cost'         },
      { id: 'v4',  name: '2016 Grand Caravan',                cy: 26000,  py: 0,      type: 'cost'         },
      { id: 'v5',  name: 'Vehicles 6144N',                    cy: 25843,  py: 0,      type: 'cost'         },
      { id: 'v6',  name: '2020 Kicks 2796N (Parts)',          cy: 21152,  py: 21152,  type: 'cost'         },
      { id: 'v7',  name: '2020 Kicks 2798N (Parts)',          cy: 21152,  py: 21152,  type: 'cost'         },
      { id: 'v8',  name: 'Vehicle 5647N',                     cy: 23855,  py: 23855,  type: 'cost'         },
      { id: 'v9',  name: 'Vehicle 5746N',                     cy: 24860,  py: 24860,  type: 'cost'         },
      { id: 'v10', name: 'Vehicle 5546N',                     cy: 23585,  py: 23585,  type: 'cost'         },
      { id: 'v11', name: 'Vehicle 5584N',                     cy: 23370,  py: 23370,  type: 'cost'         },
      { id: 'vd1', name: 'Accum. Amort. - Vehicles 6055N',                cy: -429,   py: 0,       type: 'depreciation' },
      { id: 'vd2', name: 'Accum. Amort. - Vehicles Grand Caravan 2020-804', cy: -34947, py: 0,     type: 'depreciation' },
      { id: 'vd3', name: 'Accum. Amort. - Vehicles Grand Caravan 2020-935', cy: -20313, py: 0,     type: 'depreciation' },
      { id: 'vd4', name: 'Accum. Amort. 2016 Grand Caravan',               cy: -455,   py: 0,       type: 'depreciation' },
      { id: 'vd5', name: 'Accum. Amort. Vehicles 6144N',                   cy: -452,   py: 0,       type: 'depreciation' },
      { id: 'vd6', name: 'Accum. Amort. - 2020 Kicks 2796N (Parts)',       cy: -15166, py: -15060,  type: 'depreciation' },
      { id: 'vd7', name: 'Accum. Amort. - 2020 Kicks 2798N (Parts)',       cy: -15166, py: -15060,  type: 'depreciation' },
      { id: 'vd8', name: 'Accum. Amort. - Vehicle 5647',                   cy: -14739, py: -14577,  type: 'depreciation' },
      { id: 'vd9', name: 'Accum. Amort. - Vehicle 5746N',                  cy: -15054, py: -14879,  type: 'depreciation' },
      { id: 'vd10',name: 'Accum. Amort. - Vehicle 5546N',                  cy: -23585, py: -23585,  type: 'depreciation' },
      { id: 'vd11',name: 'Accum. Amort. - Vehicle 5584N',                  cy: -23370, py: -23370,  type: 'depreciation' },
    ],
  },
];

const CY_LABEL = '2025';
const PY_LABEL = '2024';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function categoryTotals(cat: PPECategory) {
  const costItems  = cat.items.filter(i => i.type === 'cost');
  const deprItems  = cat.items.filter(i => i.type === 'depreciation');
  const totalCostCY  = costItems.reduce((s, i) => s + i.cy, 0);
  const totalCostPY  = costItems.reduce((s, i) => s + i.py, 0);
  const totalDeprCY  = deprItems.reduce((s, i) => s + i.cy, 0);
  const totalDeprPY  = deprItems.reduce((s, i) => s + i.py, 0);
  return {
    costItems, deprItems,
    totalCostCY, totalCostPY,
    totalDeprCY, totalDeprPY,
    netCY: totalCostCY + totalDeprCY,
    netPY: totalCostPY + totalDeprPY,
  };
}

// ─── Table cell components ────────────────────────────────────────────────────

function ValCell({ value, bold }: { value: number; bold?: boolean }) {
  return (
    <td className={`text-right px-4 py-1.5 tabular-nums text-sm whitespace-nowrap ${bold ? 'font-semibold' : ''}`}>
      {fmt(value)}
    </td>
  );
}

// ─── PP&E Expanded Table ──────────────────────────────────────────────────────

function ExpandedTable({ categories }: { categories: PPECategory[] }) {
  const grandNetCY = categories.reduce((s, c) => s + categoryTotals(c).netCY, 0);
  const grandNetPY = categories.reduce((s, c) => s + categoryTotals(c).netPY, 0);

  return (
    <table className="w-full text-sm border-collapse">
      {/* Column headers */}
      <thead>
        <tr className="border-b-2 border-foreground/20">
          <th className="text-left px-4 py-2 text-xs font-medium text-foreground/50 uppercase tracking-wide" />
          <th className="text-right px-4 py-2 text-xs font-semibold text-foreground uppercase tracking-wide">{CY_LABEL}</th>
          <th className="text-right px-4 py-2 text-xs font-semibold text-foreground uppercase tracking-wide">{PY_LABEL}</th>
        </tr>
      </thead>
      <tbody>
        {categories.map(cat => {
          const { costItems, deprItems, totalCostCY, totalCostPY, totalDeprCY, totalDeprPY, netCY, netPY } = categoryTotals(cat);
          const nameLower = cat.name.toLowerCase();

          return (
            <>
              {/* ── Category header ── */}
              <tr key={`${cat.id}-header`} className="border-b border-foreground/15">
                <td colSpan={3} className="px-4 pt-4 pb-1 text-sm font-semibold text-foreground underline underline-offset-2">
                  {cat.name}
                </td>
              </tr>

              {/* ── Cost section header ── */}
              <tr key={`${cat.id}-cost-header`}>
                <td colSpan={3} className="px-4 pt-2 pb-0.5 text-xs font-semibold text-foreground/70">
                  {cat.name} at cost
                </td>
              </tr>

              {/* ── Cost GL items ── */}
              {costItems.map(item => (
                <tr key={item.id} className="hover:bg-muted/20">
                  <td className="pl-8 pr-4 py-1 text-sm text-foreground">{item.name}</td>
                  <ValCell value={item.cy} />
                  <ValCell value={item.py} />
                </tr>
              ))}

              {/* ── Cost subtotal ── */}
              <tr key={`${cat.id}-cost-total`} className="border-t border-foreground/10">
                <td className="pl-4 pr-4 py-1.5 text-sm font-semibold text-foreground">
                  Total {cat.name} at cost
                </td>
                <ValCell value={totalCostCY} bold />
                <ValCell value={totalCostPY} bold />
              </tr>

              {/* ── Spacer ── */}
              <tr key={`${cat.id}-spacer`}><td colSpan={3} className="py-1" /></tr>

              {/* ── Depreciation section header ── */}
              <tr key={`${cat.id}-depr-header`}>
                <td colSpan={3} className="px-4 pt-1 pb-0.5 text-xs font-semibold text-foreground/70">
                  Accumulated depreciation - {nameLower}
                </td>
              </tr>

              {/* ── Depreciation GL items ── */}
              {deprItems.map(item => (
                <tr key={item.id} className="hover:bg-muted/20">
                  <td className="pl-8 pr-4 py-1 text-sm text-foreground">{item.name}</td>
                  <ValCell value={item.cy} />
                  <ValCell value={item.py} />
                </tr>
              ))}

              {/* ── Depreciation subtotal ── */}
              <tr key={`${cat.id}-depr-total`} className="border-t border-foreground/10">
                <td className="pl-4 pr-4 py-1.5 text-sm font-semibold text-foreground">
                  Total Accumulated depreciation - {nameLower}
                </td>
                <ValCell value={totalDeprCY} bold />
                <ValCell value={totalDeprPY} bold />
              </tr>

              {/* ── Category net total ── */}
              <tr key={`${cat.id}-net`} className="border-t-2 border-foreground/20">
                <td className="px-4 py-2 text-sm font-semibold text-foreground">
                  Total {cat.name}
                </td>
                <ValCell value={netCY} bold />
                <ValCell value={netPY} bold />
              </tr>

              {/* ── Bottom gap ── */}
              <tr key={`${cat.id}-gap`}><td colSpan={3} className="py-1" /></tr>
            </>
          );
        })}

        {/* ── Grand total ── */}
        <tr className="border-t-2 border-foreground/40">
          <td className="px-4 py-2.5 text-sm font-bold text-foreground">
            Total Property, Plant and Equipment
          </td>
          <td className="text-right px-4 py-2.5 text-sm font-bold tabular-nums">{fmt(grandNetCY)}</td>
          <td className="text-right px-4 py-2.5 text-sm font-bold tabular-nums">{fmt(grandNetPY)}</td>
        </tr>
      </tbody>
    </table>
  );
}

// ─── PP&E Consolidated Table ──────────────────────────────────────────────────

function ConsolidatedTable({ categories }: { categories: PPECategory[] }) {
  const grandNetCY = categories.reduce((s, c) => s + categoryTotals(c).netCY, 0);
  const grandNetPY = categories.reduce((s, c) => s + categoryTotals(c).netPY, 0);

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b-2 border-foreground/20">
          <th className="text-left px-4 py-2 text-xs font-medium text-foreground/50 uppercase tracking-wide" />
          <th className="text-right px-4 py-2 text-xs font-semibold text-foreground uppercase tracking-wide">{CY_LABEL}</th>
          <th className="text-right px-4 py-2 text-xs font-semibold text-foreground uppercase tracking-wide">{PY_LABEL}</th>
        </tr>
      </thead>
      <tbody>
        {categories.map(cat => {
          const { totalCostCY, totalCostPY, totalDeprCY, totalDeprPY, netCY, netPY } = categoryTotals(cat);
          const nameLower = cat.name.toLowerCase();

          return (
            <>
              {/* ── Category header ── */}
              <tr key={`${cat.id}-header`} className="border-b border-foreground/15">
                <td colSpan={3} className="px-4 pt-4 pb-1 text-sm font-semibold text-foreground underline underline-offset-2">
                  {cat.name}
                </td>
              </tr>

              {/* ── Cost row (single, condensed) ── */}
              <tr key={`${cat.id}-cost`} className="hover:bg-muted/20">
                <td className="pl-4 pr-4 py-1.5 text-sm text-foreground">
                  {cat.name} at cost
                </td>
                <ValCell value={totalCostCY} />
                <ValCell value={totalCostPY} />
              </tr>

              {/* ── Accumulated depreciation row (single, condensed) ── */}
              <tr key={`${cat.id}-depr`} className="hover:bg-muted/20">
                <td className="pl-4 pr-4 py-1.5 text-sm text-foreground">
                  Accumulated depreciation - {nameLower}
                </td>
                <ValCell value={totalDeprCY} />
                <ValCell value={totalDeprPY} />
              </tr>

              {/* ── Category net total ── */}
              <tr key={`${cat.id}-net`} className="border-t border-foreground/15">
                <td className="px-4 py-2 text-sm font-semibold text-foreground">
                  Total {cat.name}
                </td>
                <ValCell value={netCY} bold />
                <ValCell value={netPY} bold />
              </tr>

              {/* ── Bottom gap ── */}
              <tr key={`${cat.id}-gap`}><td colSpan={3} className="py-1" /></tr>
            </>
          );
        })}

        {/* ── Grand total ── */}
        <tr className="border-t-2 border-foreground/40">
          <td className="px-4 py-2.5 text-sm font-bold text-foreground">
            Total Property, Plant and Equipment
          </td>
          <td className="text-right px-4 py-2.5 text-sm font-bold tabular-nums">{fmt(grandNetCY)}</td>
          <td className="text-right px-4 py-2.5 text-sm font-bold tabular-nums">{fmt(grandNetPY)}</td>
        </tr>
      </tbody>
    </table>
  );
}

// ─── PP&E Note expanded content ───────────────────────────────────────────────

function PPENoteContent() {
  const [viewMode,     setViewMode]     = useState<ViewMode>('consolidated');
  const [savedView,    setSavedView]    = useState<ViewMode>('consolidated');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [categories,   setCategories]   = useState<PPECategory[]>(defaultCategories);

  const isDirty = viewMode !== savedView;

  const handleViewSelect = (v: ViewMode) => {
    setViewMode(v);
    setDropdownOpen(false);
  };

  const handleSave = () => setSavedView(viewMode);

  const handleAddCategory = () => {
    const newCat: PPECategory = {
      id: `cat-${Date.now()}`,
      name: 'New Category',
      items: [],
    };
    setCategories(prev => [...prev, newCat]);
  };

  const VIEW_LABELS: Record<ViewMode, string> = {
    expanded:     'Expanded',
    consolidated: 'Consolidated',
  };

  return (
    <div className="px-4 py-3 border-t border-border bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-foreground/60">View:</span>

        {/* View dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="flex items-center gap-2 h-8 px-3 rounded-md border border-border bg-background hover:bg-muted text-sm text-foreground transition-colors min-w-[145px] justify-between"
          >
            <span>{VIEW_LABELS[viewMode]}</span>
            <ChevronDown className="w-3.5 h-3.5 text-foreground/50" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute left-0 top-full mt-1 z-20 bg-card border border-border rounded-md shadow-lg overflow-hidden min-w-[145px]">
                {(['consolidated', 'expanded'] as ViewMode[]).map(v => (
                  <button
                    key={v}
                    onClick={() => handleViewSelect(v)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <span>{VIEW_LABELS[v]}</span>
                    {viewMode === v && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Save button — active only when view changed */}
        <Button
          variant={isDirty ? 'default' : 'outline'}
          size="sm"
          onClick={handleSave}
          disabled={!isDirty}
          className="h-8 px-4 text-xs"
        >
          Save
        </Button>
      </div>

      {/* Table — matches PDF structure */}
      <div className="rounded-md border border-border overflow-hidden">
        <div className="overflow-x-auto">
          {viewMode === 'expanded'
            ? <ExpandedTable     categories={categories} />
            : <ConsolidatedTable categories={categories} />
          }
        </div>
      </div>

      {/* Add Category button */}
      <div className="mt-3">
        <Button
          variant="default"
          size="sm"
          onClick={handleAddCategory}
          className="gap-1.5 h-8 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Type
        </Button>
      </div>
    </div>
  );
}

// ─── Note row ─────────────────────────────────────────────────────────────────

function NoteRow({
  note, selected, expanded, onToggleSelect, onToggleExpand,
}: {
  note: NoteItem; selected: boolean; expanded: boolean;
  onToggleSelect: (id: string) => void; onToggleExpand: (id: string) => void;
}) {
  const isPPE = note.id === '4';

  return (
    <div className="border-b border-border last:border-0">
      <div
        className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={() => onToggleExpand(note.id)}
      >
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect(note.id)}
          onClick={e => e.stopPropagation()}
          className="h-4 w-4 shrink-0"
        />
        <button
          className="shrink-0 text-foreground/50 hover:text-foreground transition-colors"
          onClick={e => { e.stopPropagation(); onToggleExpand(note.id); }}
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Green doc icon */}
        <svg className="w-4 h-4 shrink-0 text-emerald-500" viewBox="0 0 16 16" fill="none">
          <path d="M3 2h7l4 4v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" fill="currentColor" opacity={0.2} />
          <path d="M3 2h7l4 4v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" />
          <path d="M10 2v4h4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M5 8h6M5 10.5h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>

        <span className="text-sm text-foreground">
          {note.number}.{note.title}
        </span>
      </div>

      {expanded && isPPE && <PPENoteContent />}
    </div>
  );
}

// ─── Side nav ─────────────────────────────────────────────────────────────────

const sideNavItems = [
  { id: 'tb',    label: 'Trial Balance Grouping'        },
  { id: 'bs',    label: 'Balance Sheet'                 },
  { id: 'loss',  label: 'Statement of Loss and Deficit' },
  { id: 'cf',    label: 'Statement of Cash Flows'       },
  { id: 'notes', label: 'Notes to Financial Information'},
];

const initialNotes: NoteItem[] = [
  { id: '1', number: 1, title: 'Advertising contracts (completed contract method)'      },
  { id: '2', number: 2, title: 'Advertising contracts (percentage of completion method)'},
  { id: '3', number: 3, title: 'Basis of accounting \u2013 Note 4'                     },
  { id: '4', number: 4, title: 'Property, Plant & Equipment'                            },
];

const CLIENT_NAME     = 'Delete Client';
const ENGAGEMENT_NAME = 'COM-DEL-Dec312024';
const YEAR_END_LABEL  = 'Dec 31, 2024';
const YEAR_END_LONG   = 'December 31, 2024';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotesFinancialInfoPage() {
  const [notes]             = useState<NoteItem[]>(initialNotes);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['4']));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSideNav, setActiveSideNav] = useState('notes');
  const [schedulesOpen, setSchedulesOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const allSelected  = notes.length > 0 && notes.every(n => selectedIds.has(n.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(notes.map(n => n.id)));

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleExpand = (id: string) =>
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">

      {/* ── Top engagement header ─────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 py-2.5 shrink-0 text-white text-xs"
        style={{ backgroundColor: '#0c2d55' }}
      >
        <div className="flex items-center gap-4">
          <span className="font-bold text-sm tracking-wide">COM</span>
          <span className="text-white/50">|</span>
          <span><span className="text-white/50">Engagement Name:</span> <span className="font-medium">{ENGAGEMENT_NAME}</span></span>
        </div>
        <span><span className="text-white/50">Client Name:</span> <span className="font-medium">{CLIENT_NAME}</span></span>
        <span><span className="text-white/50">Year End Date:</span> <span className="font-medium">{YEAR_END_LABEL}</span></span>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar ─────────────────────────────────────────────── */}
        <div
          className="flex flex-col border-r border-border bg-card shrink-0 transition-all duration-200"
          style={{ width: sidebarCollapsed ? 40 : 220 }}
        >
          <div className="flex items-center justify-end px-2 py-2 border-b border-border">
            <button
              onClick={() => setSidebarCollapsed(v => !v)}
              className="p-1 rounded hover:bg-muted text-foreground/50 hover:text-foreground transition-colors"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
            </button>
          </div>

          {!sidebarCollapsed && (
            <nav className="flex-1 overflow-y-auto py-1">
              {sideNavItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveSideNav(item.id)}
                  className={[
                    'w-full text-left px-4 py-2 text-sm transition-colors',
                    activeSideNav === item.id
                      ? 'text-primary font-medium bg-primary/5'
                      : 'text-foreground hover:bg-muted/60',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              ))}

              {/* Schedules */}
              <div>
                <button
                  onClick={() => setSchedulesOpen(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    {schedulesOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    <span>Schedules</span>
                  </div>
                  <button
                    onClick={e => e.stopPropagation()}
                    className="p-0.5 rounded hover:bg-border text-foreground/40 hover:text-foreground transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </button>

                {schedulesOpen && (
                  <div className="pl-2">
                    <button
                      onClick={() => setActiveSideNav('schedule-1')}
                      className={[
                        'w-full text-left px-4 py-1.5 text-sm flex items-center gap-1.5 transition-colors',
                        activeSideNav === 'schedule-1' ? 'text-primary font-medium' : 'text-foreground hover:bg-muted/60',
                      ].join(' ')}
                    >
                      <span className="text-foreground/30">⠿</span>
                      Schedule 1 - test Custom
                    </button>
                  </div>
                )}
              </div>
            </nav>
          )}
        </div>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-w-0">

          {/* Title */}
          <div className="text-center py-6 border-b border-border">
            <h1 className="text-base font-semibold text-foreground">{CLIENT_NAME}</h1>
            <h2 className="text-base font-semibold text-foreground">Notes to Financial Information</h2>
            <p className="text-sm text-foreground/60 mt-0.5">For the year ended {YEAR_END_LONG}</p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} className="h-4 w-4" />
              <span className="text-sm text-foreground">Select all</span>
            </div>
            <Button
              variant="ghost" size="sm"
              onClick={() => setSelectedIds(new Set())}
              disabled={!someSelected}
              className="h-8 px-3 text-xs gap-1.5 text-foreground disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />Delete
            </Button>

            <div className="flex-1" />

            <div className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-background min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-foreground/40 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X className="w-3 h-3 text-foreground/40 hover:text-foreground" />
                </button>
              )}
            </div>

            <Button variant="default" size="sm" className="h-8 px-4 text-xs gap-1.5">
              Add notes<ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Notes list */}
          <div>
            {filteredNotes.map(note => (
              <NoteRow
                key={note.id}
                note={note}
                selected={selectedIds.has(note.id)}
                expanded={expandedIds.has(note.id)}
                onToggleSelect={toggleSelect}
                onToggleExpand={toggleExpand}
              />
            ))}
          </div>
        </div>

        {/* ── Preview tab ───────────────────────────────────────────────── */}
        <div className="shrink-0 flex">
          <button
            onClick={() => setPreviewOpen(v => !v)}
            className="w-7 flex items-center justify-center border-l border-border bg-card hover:bg-muted transition-colors"
          >
            <span
              className="text-[11px] font-medium text-foreground/60 tracking-wide"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              Preview
            </span>
          </button>

          {previewOpen && (
            <div className="w-64 border-l border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Preview</span>
                <button onClick={() => setPreviewOpen(false)}>
                  <X className="w-4 h-4 text-foreground/40 hover:text-foreground" />
                </button>
              </div>
              <p className="text-xs text-foreground/50">Document preview will appear here.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
