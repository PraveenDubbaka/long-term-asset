import { useState, useMemo } from 'react';
import { Badge } from '@/components/wp-ui/badge';
import type { AJE } from '@/lib/luka/compute';
import { fmtCAD } from './InvHoldingsTab';
import { ColFilter, ClearFiltersBtn } from './InvTableFilters';

interface Props {
  ajes: AJE[];
}

export function InvAJEsTab({ ajes }: Props) {
  const [filterType,       setFilterType]       = useState("");
  const [filterConfidence, setFilterConfidence] = useState("");

  const anyFilter = filterType || filterConfidence;

  const uniqueTypes = useMemo(
    () => Array.from(new Set(ajes.map((a) => a.type))).sort(),
    [ajes],
  );

  const uniqueConf = useMemo(
    () => Array.from(new Set(ajes.map((a) => a.confidence))).sort(),
    [ajes],
  );

  const visible = useMemo(() => {
    let rows = ajes;
    if (filterType)       rows = rows.filter((a) => a.type === filterType);
    if (filterConfidence) rows = rows.filter((a) => a.confidence === filterConfidence);
    return rows;
  }, [ajes, filterType, filterConfidence]);

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Adjusting Journal Entries</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {visible.length} of {ajes.length} entries · driven by published transactions and TB account mapping
          </p>
        </div>
        {anyFilter && (
          <ClearFiltersBtn onClick={() => { setFilterType(""); setFilterConfidence(""); }} />
        )}
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
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => (
              <tr key={a.ref} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs">{a.ref}</td>
                <td className="px-4 py-3 text-sm">{a.description}</td>
                <td className="px-4 py-3 text-xs">{a.drAccount}</td>
                <td className="px-4 py-3 text-xs">{a.crAccount}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtCAD(a.amount)}</td>
                <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{a.type}</Badge></td>
                <td className="px-4 py-3">
                  <Badge
                    variant={a.confidence === "High" ? "default" : a.confidence === "Medium" ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    {a.confidence}
                  </Badge>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
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
