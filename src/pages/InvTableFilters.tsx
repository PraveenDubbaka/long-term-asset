/**
 * Shared column-filter primitives for Investment tabs.
 * Matches the ListFilter icon + portal-dropdown pattern used in LoansTab.
 */
import { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ListFilter, X } from 'lucide-react';

const INPUT_CLS =
  "w-full text-xs px-2.5 py-1.5 rounded-md border border-border bg-background text-foreground placeholder:text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50";

// ─── Dropdown filter for categorical columns ──────────────────────────────────
export function ColFilter({
  label, options, value, onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const isActive = !!value;

  useEffect(() => {
    if (open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left });
    }
  }, [open]);

  const title = value ? `Filtering: "${value}"` : 'Filter';

  const popup = open
    ? ReactDOM.createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div
            style={{ position: 'fixed', top: pos.top, left: pos.left }}
            className="z-[70] bg-card border border-border rounded-lg shadow-[0_4px_24px_hsl(213_40%_20%/0.18)] p-2.5 min-w-[160px]"
            onClick={(e) => e.stopPropagation()}
          >
            <select
              value={value}
              onChange={(e) => { onChange(e.target.value); setOpen(false); }}
              className={INPUT_CLS}
              autoFocus
              size={Math.min(options.length + 1, 8)}
            >
              <option value="">All</option>
              {options.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            {value && (
              <button
                onClick={() => { onChange(''); setOpen(false); }}
                className="mt-1.5 text-xs text-foreground hover:text-destructive w-full text-right transition-colors"
              >
                Clear ✕
              </button>
            )}
          </div>
        </>,
        document.body,
      )
    : null;

  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <div className="relative flex-shrink-0">
        <button
          ref={btnRef}
          onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
          className={`p-0.5 rounded transition-colors ${
            isActive
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title={title}
          type="button"
        >
          <ListFilter className="w-3 h-3" />
        </button>
        {popup}
      </div>
    </span>
  );
}

// ─── Text-search filter ───────────────────────────────────────────────────────
export function SearchFilter({
  label, value, onChange, placeholder = 'Search…',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const isActive = !!value;

  useEffect(() => {
    if (open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left });
    }
  }, [open]);

  const title = value ? `Filtering: "${value}"` : 'Filter';

  const popup = open
    ? ReactDOM.createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div
            style={{ position: 'fixed', top: pos.top, left: pos.left }}
            className="z-[70] bg-card border border-border rounded-lg shadow-[0_4px_24px_hsl(213_40%_20%/0.18)] p-2.5 min-w-[180px]"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={INPUT_CLS}
              autoFocus
            />
            {value && (
              <button
                onClick={() => { onChange(''); setOpen(false); }}
                className="mt-1.5 text-xs text-foreground hover:text-destructive w-full text-right transition-colors"
              >
                Clear ✕
              </button>
            )}
          </div>
        </>,
        document.body,
      )
    : null;

  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <div className="relative flex-shrink-0">
        <button
          ref={btnRef}
          onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
          className={`p-0.5 rounded transition-colors ${
            isActive
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title={title}
          type="button"
        >
          <ListFilter className="w-3 h-3" />
        </button>
        {popup}
      </div>
    </span>
  );
}

/** "× Clear filters" pill shown in the toolbar when any filter is active */
export function ClearFiltersBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-full px-2.5 py-1 transition-colors"
    >
      <X className="h-3 w-3" /> Clear filters
    </button>
  );
}
