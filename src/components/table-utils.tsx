import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Columns3 } from 'lucide-react';

// ── Column definition ──────────────────────────────────────────────────────────
export interface ColDef<T extends string = string> {
  id: T;
  label: string;
  defaultVisible?: boolean;  // default: true
  pinned?: boolean;          // pinned = always visible, not toggleable
  defaultWidth?: number;     // optional px default
}

// ── useTableColumns ────────────────────────────────────────────────────────────
export function useTableColumns<T extends string>(
  tableId: string,
  columns: ColDef<T>[]
) {
  const [hidden, setHidden] = useState<Set<T>>(() => {
    try {
      const stored = localStorage.getItem(`tc-hidden-${tableId}`);
      if (stored) return new Set(JSON.parse(stored) as T[]);
    } catch {}
    return new Set(columns.filter(c => c.defaultVisible === false).map(c => c.id));
  });

  const [widths, setWidthsState] = useState<Partial<Record<T, number>>>(() => {
    try {
      const stored = localStorage.getItem(`tc-widths-${tableId}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    const defaults: Partial<Record<T, number>> = {};
    columns.forEach(c => { if (c.defaultWidth) defaults[c.id] = c.defaultWidth; });
    return defaults;
  });

  const isVisible = useCallback((id: T) => !hidden.has(id), [hidden]);

  const toggle = useCallback((id: T) => {
    setHidden(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem(`tc-hidden-${tableId}`, JSON.stringify([...next])); } catch {}
      return next;
    });
  }, [tableId]);

  const setWidth = useCallback((id: T, w: number) => {
    setWidthsState(prev => {
      const next = { ...prev, [id]: Math.max(40, w) };
      try { localStorage.setItem(`tc-widths-${tableId}`, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [tableId]);

  const getWidth = useCallback((id: T): number | undefined => widths[id], [widths]);

  const visibleCount = columns.filter(c => !hidden.has(c.id)).length;

  return { isVisible, toggle, setWidth, getWidth, visibleCount, hidden, columns };
}

// ── ColumnToggleButton ─────────────────────────────────────────────────────────
interface ColumnToggleButtonProps<T extends string> {
  columns: ColDef<T>[];
  isVisible: (id: T) => boolean;
  onToggle: (id: T) => void;
}

export function ColumnToggleButton<T extends string>({
  columns, isVisible, onToggle,
}: ColumnToggleButtonProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggleable = columns.filter(c => !c.pinned);
  const visCount = toggleable.filter(c => isVisible(c.id)).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={[
          'inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors border',
          open
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-background text-foreground border-border hover:bg-muted',
        ].join(' ')}
        title="Show / hide columns"
      >
        <Columns3 className="w-3.5 h-3.5" />
        Columns
        <span className={[
          'ml-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] font-bold px-0.5',
          open ? 'bg-white/20 text-primary-foreground' : 'bg-muted text-foreground',
        ].join(' ')}>
          {visCount}/{toggleable.length}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-[200] bg-background border border-border rounded-lg shadow-xl py-1 min-w-[190px]">
          <div className="px-3 py-1.5 border-b border-border mb-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground">Toggle Columns</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {toggleable.map(col => {
              const vis = isVisible(col.id);
              return (
                <button
                  key={col.id}
                  onClick={() => onToggle(col.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-muted transition-colors text-left"
                >
                  <span className={[
                    'flex-shrink-0 w-3.5 h-3.5 rounded border-[1.5px] flex items-center justify-center transition-colors',
                    vis ? 'bg-primary border-primary' : 'border-muted-foreground/40 bg-background',
                  ].join(' ')}>
                    {vis && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className={vis ? 'text-foreground' : 'text-foreground'}>{col.label}</span>
                </button>
              );
            })}
          </div>
          <div className="border-t border-border mt-0.5 pt-1 px-3 flex gap-2">
            <button
              onClick={() => toggleable.forEach(c => { if (!isVisible(c.id)) onToggle(c.id); })}
              className="text-[10px] text-primary hover:underline font-medium"
            >
              Show all
            </button>
            <span className="text-foreground">·</span>
            <button
              onClick={() => toggleable.forEach(c => { if (isVisible(c.id)) onToggle(c.id); })}
              className="text-[10px] text-foreground hover:text-foreground hover:underline"
            >
              Hide all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── useColumnResize ─────────────────────────────────────────────────────────────
export function useColumnResize<T extends string>(
  setWidth: (id: T, w: number) => void
) {
  const dragRef = useRef<{ id: T; startX: number; startW: number } | null>(null);

  const onResizeStart = useCallback((id: T, e: React.MouseEvent, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { id, startX: e.clientX, startW: currentWidth };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = ev.clientX - dragRef.current.startX;
      setWidth(dragRef.current.id, Math.max(40, dragRef.current.startW + delta));
    };
    const onUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [setWidth]);

  return { onResizeStart };
}

// ── ThResizable — a <th> wrapper with built-in resize handle ──────────────────
interface ThResizableProps {
  colId: string;
  width?: number;
  onResizeStart: (e: React.MouseEvent) => void;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  title?: string;
}

export function ThResizable({ colId: _colId, width, onResizeStart, className = '', children, style, title }: ThResizableProps) {
  const thStyle: React.CSSProperties = width
    ? { minWidth: width, ...style }
    : { position: 'relative', ...style };

  return (
    <th className={`${className} relative group/th`} style={thStyle} title={title}>
      {children}
      <div
        className="absolute right-0 top-0 h-full w-3 flex items-center justify-center cursor-col-resize select-none z-10 group/rh"
        onMouseDown={onResizeStart}
        title="Drag to resize"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-px h-4 bg-transparent group-hover/th:bg-border/40 group-hover/rh:bg-primary/60 group-hover/rh:w-0.5 transition-all rounded-full" />
      </div>
    </th>
  );
}
