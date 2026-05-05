import { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/wp-ui/badge';
import type { AJE } from '@/lib/luka/compute';
import { fmtCAD } from './InvHoldingsTab';
import { ColFilter, ClearFiltersBtn } from './InvTableFilters';
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  ajes: AJE[];
}

type LocalAJE = AJE & { _localId: number };

export function InvAJEsTab({ ajes }: Props) {
  const [filterType,       setFilterType]       = useState("");
  const [filterConfidence, setFilterConfidence] = useState("");

  const [localAjes, setLocalAjes] = useState<LocalAJE[]>(() => ajes.map((a, i) => ({...a, _localId: i})));
  const [editRef, setEditRef] = useState<string | null>(null);
  const [editAjeData, setEditAjeData] = useState<Partial<AJE>>({});
  const [addingAje, setAddingAje] = useState(false);
  const [newAje, setNewAje] = useState<Partial<AJE>>({});

  useEffect(() => {
    setLocalAjes(ajes.map((a, i) => ({...a, _localId: i})));
  }, [ajes]);

  const anyFilter = filterType || filterConfidence;

  const uniqueTypes = useMemo(
    () => Array.from(new Set(localAjes.map((a) => a.type))).sort(),
    [localAjes],
  );

  const uniqueConf = useMemo(
    () => Array.from(new Set(localAjes.map((a) => a.confidence))).sort(),
    [localAjes],
  );

  const visible = useMemo(() => {
    let rows = localAjes as AJE[];
    if (filterType)       rows = rows.filter((a) => a.type === filterType);
    if (filterConfidence) rows = rows.filter((a) => a.confidence === filterConfidence);
    return rows;
  }, [localAjes, filterType, filterConfidence]);

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Adjusting Journal Entries</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {visible.length} of {localAjes.length} entries · driven by published transactions and TB account mapping
          </p>
        </div>
        <div className="flex items-center gap-2">
          {anyFilter && (
            <ClearFiltersBtn onClick={() => { setFilterType(""); setFilterConfidence(""); }} />
          )}
          <button
            onClick={() => { setAddingAje(true); setNewAje({ ref: `AJE-${String(localAjes.length + 1).padStart(3,'0')}`, type: 'Correcting', confidence: 'Medium', amount: 0 }); }}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-primary bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add AJE
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ref</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dr</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cr</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <ColFilter label="Type" options={uniqueTypes} value={filterType} onChange={setFilterType} />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <ColFilter label="Confidence" options={uniqueConf} value={filterConfidence} onChange={setFilterConfidence} />
              </th>
              <th className="px-3 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {addingAje && (
              <tr className="border-b border-border/50 bg-primary/5">
                <td className="px-4 py-2"><input placeholder="Ref" value={newAje.ref ?? ''} onChange={e => setNewAje(d => ({...d, ref: e.target.value}))} className="h-7 w-24 text-xs px-2 border border-border rounded-md bg-background font-mono" /></td>
                <td className="px-4 py-2"><input placeholder="Description" value={newAje.description ?? ''} onChange={e => setNewAje(d => ({...d, description: e.target.value}))} className="h-7 w-48 text-xs px-2 border border-border rounded-md bg-background" /></td>
                <td className="px-4 py-2"><input placeholder="Dr Account" value={newAje.drAccount ?? ''} onChange={e => setNewAje(d => ({...d, drAccount: e.target.value}))} className="h-7 w-36 text-xs px-2 border border-border rounded-md bg-background" /></td>
                <td className="px-4 py-2"><input placeholder="Cr Account" value={newAje.crAccount ?? ''} onChange={e => setNewAje(d => ({...d, crAccount: e.target.value}))} className="h-7 w-36 text-xs px-2 border border-border rounded-md bg-background" /></td>
                <td className="px-4 py-2 text-right"><input type="number" value={newAje.amount ?? 0} onChange={e => setNewAje(d => ({...d, amount: parseFloat(e.target.value)||0}))} className="h-7 w-28 text-xs px-2 border border-border rounded-md bg-background text-right" /></td>
                <td className="px-4 py-2">
                  <select value={newAje.type ?? 'Correcting'} onChange={e => setNewAje(d => ({...d, type: e.target.value as AJE['type']}))} className="h-7 text-xs px-2 border border-border rounded-md bg-background">
                    <option value="Correcting">Correcting</option>
                    <option value="Reclassification">Reclassification</option>
                    <option value="Accrual">Accrual</option>
                    <option value="Fair Value Adj">Fair Value Adj</option>
                    <option value="FX Adj">FX Adj</option>
                    <option value="Disposition">Disposition</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <select value={newAje.confidence ?? 'Medium'} onChange={e => setNewAje(d => ({...d, confidence: e.target.value as AJE['confidence']}))} className="h-7 text-xs px-2 border border-border rounded-md bg-background">
                    <option>High</option><option>Medium</option><option>Low</option>
                  </select>
                </td>
                <td className="px-3 py-2"><div className="flex gap-0.5">
                  <button onClick={() => {
                    if (!newAje.ref) { toast.error('Ref is required'); return; }
                    const entry: AJE = { ref: newAje.ref!, description: newAje.description ?? '', drAccount: newAje.drAccount ?? '', crAccount: newAje.crAccount ?? '', amount: newAje.amount ?? 0, type: newAje.type ?? 'Correcting', confidence: newAje.confidence ?? 'Medium' };
                    setLocalAjes(prev => [...prev, {...entry, _localId: prev.length}]);
                    setAddingAje(false);
                    toast.success('AJE added');
                  }} className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600"><Check className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setAddingAje(false)} className="p-1.5 hover:bg-muted rounded-lg text-foreground"><X className="h-3.5 w-3.5" /></button>
                </div></td>
              </tr>
            )}
            {visible.map((a) => (
              <tr key={a.ref} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs">{a.ref}</td>
                <td className="px-4 py-3 text-sm">
                  {editRef === a.ref
                    ? <input value={editAjeData.description ?? a.description} onChange={e => setEditAjeData(d => ({...d, description: e.target.value}))} className="h-7 w-48 text-xs px-2 border border-border rounded-md bg-background" />
                    : a.description}
                </td>
                <td className="px-4 py-3 text-xs">
                  {editRef === a.ref
                    ? <input value={editAjeData.drAccount ?? a.drAccount} onChange={e => setEditAjeData(d => ({...d, drAccount: e.target.value}))} className="h-7 w-36 text-xs px-2 border border-border rounded-md bg-background" />
                    : a.drAccount}
                </td>
                <td className="px-4 py-3 text-xs">
                  {editRef === a.ref
                    ? <input value={editAjeData.crAccount ?? a.crAccount} onChange={e => setEditAjeData(d => ({...d, crAccount: e.target.value}))} className="h-7 w-36 text-xs px-2 border border-border rounded-md bg-background" />
                    : a.crAccount}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {editRef === a.ref
                    ? <input type="number" value={editAjeData.amount ?? a.amount} onChange={e => setEditAjeData(d => ({...d, amount: parseFloat(e.target.value)||0}))} className="h-7 w-28 text-xs px-2 border border-border rounded-md bg-background text-right" />
                    : fmtCAD(a.amount)}
                </td>
                <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{a.type}</Badge></td>
                <td className="px-4 py-3">
                  <Badge
                    variant={a.confidence === "High" ? "default" : a.confidence === "Medium" ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    {a.confidence}
                  </Badge>
                </td>
                <td className="px-3 py-3">
                  {editRef === a.ref ? (
                    <div className="flex gap-0.5">
                      <button onClick={() => { setLocalAjes(prev => prev.map(x => x.ref === a.ref ? {...x, ...editAjeData} : x)); setEditRef(null); toast.success('AJE updated'); }} className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600"><Check className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setEditRef(null)} className="p-1.5 hover:bg-muted rounded-lg text-foreground"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ) : (
                    <div className="flex gap-0.5 ">
                      <button onClick={() => { setEditRef(a.ref); setEditAjeData({}); }} className="p-1.5 hover:bg-muted rounded-lg text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { setLocalAjes(prev => prev.filter(x => x.ref !== a.ref)); toast.success('AJE removed'); }} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {anyFilter
                    ? "No AJEs match the active filters."
                    : "No AJEs — publish transactions to generate entries."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
