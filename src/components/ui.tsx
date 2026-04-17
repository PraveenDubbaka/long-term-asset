import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';
import { X, ChevronDown, Check, AlertTriangle, Info, CheckCircle, XCircle, Calendar } from 'lucide-react';

// ─── BUTTON ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none';
    const variants = {
      primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
      secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300',
      ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      success: 'bg-emerald-600 text-white hover:bg-emerald-700',
    };
    const sizes = {
      xs: 'text-xs px-2 py-1 h-6',
      sm: 'text-xs px-2.5 py-1.5 h-7',
      md: 'text-sm px-3 py-1.5 h-8',
      lg: 'text-sm px-4 py-2 h-9',
    };
    return (
      <button ref={ref} disabled={disabled || loading} className={cn(base, variants[variant], sizes[size], className)} {...props}>
        {loading && <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ─── BADGE ────────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}
export function Badge({ children, variant = 'default', size = 'sm', dot, className }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-red-50 text-red-700 border border-red-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    outline: 'border border-slate-300 text-slate-600 bg-white',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
  };
  const dotColors = {
    default: 'bg-slate-400', success: 'bg-emerald-500', warning: 'bg-amber-500',
    danger: 'bg-red-500', info: 'bg-blue-500', outline: 'bg-slate-400', purple: 'bg-purple-500',
  };
  const sizes = { sm: 'text-xs px-2 py-0.5', md: 'text-xs px-2.5 py-1' };
  return (
    <span className={cn('inline-flex items-center gap-1 font-medium rounded-full', variants[variant], sizes[size], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('bg-white border border-slate-200 rounded-xl shadow-sm', className)}>{children}</div>;
}

// ─── INPUT ────────────────────────────────────────────────────────────────────
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium leading-none text-foreground">{label}</label>}
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-foreground text-xs">{prefix}</span>}
        <input
          ref={ref}
          className={cn(
            'input-double-border w-full h-9 text-sm rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground placeholder:text-foreground transition-all duration-200',
            'hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)]',
            'disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50',
            prefix ? 'pl-7' : 'pl-3',
            suffix ? 'pr-7' : 'pr-3',
            error && 'border-destructive hover:border-destructive',
            className
          )}
          {...props}
        />
        {suffix && <span className="absolute right-3 text-foreground text-xs">{suffix}</span>}
      </div>
      {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
      {hint && !error && <p className="text-xs text-foreground mt-0.5">{hint}</p>}
    </div>
  )
);
Input.displayName = 'Input';

// ─── DATE INPUT ───────────────────────────────────────────────────────────────
// Stores/receives ISO (YYYY-MM-DD) but displays and accepts MM-DD-YYYY.
function isoToMDY(iso: string): string {
  if (!iso) return '';
  const p = iso.split('-');
  if (p.length !== 3 || p[0].length !== 4) return '';
  return `${p[1]}-${p[2]}-${p[0]}`;
}
function mdyToIso(mdy: string): string {
  if (!mdy) return '';
  const p = mdy.replace(/\//g, '-').split('-');
  if (p.length !== 3) return '';
  const [m, d, y] = p;
  if (m.length === 2 && d.length === 2 && y.length === 4) return `${y}-${m}-${d}`;
  return '';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyChangeHandler = (e: any) => void;

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: string;          // ISO YYYY-MM-DD
  onChange?: AnyChangeHandler;
  label?: string;
  error?: string;
  hint?: string;
}

export function DateInput({ value = '', onChange, label, error, hint, className, ...rest }: DateInputProps) {
  const [display, setDisplay] = useState(() => isoToMDY(value));
  const pickerRef = useRef<HTMLInputElement>(null);

  // Sync display when controlled value changes externally
  useEffect(() => { setDisplay(isoToMDY(value)); }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplay(raw);
    const iso = mdyToIso(raw);
    onChange?.({ target: { value: iso } });
  };

  // Native date picker fires ISO (YYYY-MM-DD) → convert to MM-DD-YYYY for display
  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value;
    if (!iso) return;
    setDisplay(isoToMDY(iso));
    onChange?.({ target: { value: iso } });
  };

  const handleBlur = () => {
    // Normalise display on blur (e.g. after typing a full date)
    const iso = mdyToIso(display);
    if (iso) setDisplay(isoToMDY(iso));
  };

  const inputEl = (
    <div className="relative min-w-[130px]">
      {/* Visible text input showing MM-DD-YYYY — right padding reserves space for icon */}
      <input
        type="text"
        value={display}
        placeholder="MM-DD-YYYY"
        onChange={handleTextChange}
        onBlur={handleBlur}
        className={cn(
          'input-double-border w-full h-9 text-sm rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card',
          'text-foreground placeholder:text-foreground transition-all duration-200',
          'hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)]',
          'focus:outline-none focus:ring-0',
          'disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50',
          error && 'border-destructive hover:border-destructive',
          className,
          'pl-3 pr-9'  // always last — wins over any px-* in caller's className
        )}
        {...rest}
      />
      {/* Decorative calendar icon — pointer-events-none so clicks pass through to the date input below */}
      <span className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-muted-foreground">
        <Calendar className="w-4 h-4" />
      </span>
      {/* Transparent native date input covers the icon zone — clicking it opens the system picker */}
      <input
        ref={pickerRef}
        type="date"
        value={value}
        onChange={handlePickerChange}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 w-9 opacity-0 cursor-pointer"
        aria-hidden="true"
      />
    </div>
  );

  if (!label && !error && !hint) return inputEl;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium leading-none text-foreground">{label}</label>}
      {inputEl}
      {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
      {hint && !error && <p className="text-xs text-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

// ─── AMOUNT INPUT ─────────────────────────────────────────────────────────────
// Displays value with Canadian/US comma-thousands formatting when unfocused.
// Fires onChange with raw numeric string (commas stripped) for parseFloat compatibility.
interface AmountInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: number | string;
  onChange?: AnyChangeHandler;
  label?: string;
  error?: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number; // significant decimal places shown when formatted (default 2)
}

const CA_FMT = new Intl.NumberFormat('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function fmtAmount(v: number | string | undefined, decimals: number): string {
  if (v == null || v === '' || v === 0 && String(v) === '') return '';
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''));
  if (isNaN(n)) return '';
  return new Intl.NumberFormat('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: decimals }).format(n);
}

export function AmountInput({ value, onChange, label, error, hint, prefix, suffix, decimals = 2, className, onFocus: _onFocus, onBlur: _onBlur, ...rest }: AmountInputProps) {
  const [focused, setFocused] = useState(false);
  const [localRaw, setLocalRaw] = useState('');

  // When focusing, seed localRaw with the raw number (no commas)
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const n = typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(/,/g, ''));
    setLocalRaw(isNaN(n) ? '' : String(n));
    setFocused(true);
    _onFocus?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalRaw(raw);
    // Strip commas so existing parseFloat handlers work correctly
    const stripped = raw.replace(/,/g, '');
    onChange?.({ target: { value: stripped } });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    _onBlur?.(e);
  };

  const displayValue = focused ? localRaw : fmtAmount(value, decimals);

  const inputEl = (
    <div className="relative">
      {prefix && <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-foreground text-xs">{prefix}</span>}
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          'input-double-border w-full h-9 text-sm rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card',
          'text-foreground placeholder:text-foreground transition-all duration-200',
          'hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)]',
          'focus:outline-none focus:ring-0',
          'disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50',
          error && 'border-destructive hover:border-destructive',
          prefix ? 'pl-8' : 'pl-3',
          suffix ? 'pr-8' : 'pr-3',
          className,
          'text-right'
        )}
        {...rest}
      />
      {suffix && <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-foreground text-xs">{suffix}</span>}
    </div>
  );

  if (!label && !error && !hint) return inputEl;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium leading-none text-foreground">{label}</label>}
      {inputEl}
      {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
      {hint && !error && <p className="text-xs text-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

// ─── SELECT ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium leading-none text-foreground">{label}</label>}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'input-double-border w-full h-9 text-sm pl-3 pr-8 rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground appearance-none transition-all duration-200',
            'hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)]',
            'disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50',
            error && 'border-destructive hover:border-destructive',
            className
          )}
          {...props}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground pointer-events-none" />
      </div>
      {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';

// ─── TEXTAREA ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium leading-none text-foreground">{label}</label>}
      <textarea
        className={cn(
          'input-double-border w-full text-sm px-3 py-2.5 rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground placeholder:text-foreground transition-all duration-200',
          'hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)] resize-none',
          'disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50',
          error && 'border-destructive hover:border-destructive',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  footer?: React.ReactNode;
}
export function Modal({ open, onClose, title, subtitle, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl', '3xl': 'max-w-3xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cn('relative bg-card text-card-foreground rounded-xl shadow-[0_8px_32px_hsl(213_40%_20%/0.18)] w-full flex flex-col border border-border', sizes[size], 'max-h-[90vh]')}>
        <div className="flex items-start justify-between px-5 py-4 border-b border-border">
          <div>
            {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
            {subtitle && <p className="text-xs text-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted ml-3 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-5 flex-1">{children}</div>
        {footer && <div className="border-t border-border px-5 py-4 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

// ─── TABLE ────────────────────────────────────────────────────────────────────
interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'right' | 'center';
}
interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
  emptyMessage?: string;
  compact?: boolean;
  className?: string;
}
export function Table<T>({ columns, data, onRowClick, rowKey, emptyMessage = 'No data', compact, className }: TableProps<T>) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map(col => (
              <th key={col.key} className={cn(
                'text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap',
                compact ? 'px-3 py-2' : 'px-4 py-3',
                col.align === 'right' && 'text-right',
                col.align === 'center' && 'text-center',
                col.headerClassName
              )}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} className="text-center text-slate-400 text-sm py-12">{emptyMessage}</td></tr>
          ) : data.map(row => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={cn('border-b border-slate-100 transition-colors', onRowClick && 'cursor-pointer hover:bg-slate-50')}
            >
              {columns.map(col => (
                <td key={col.key} className={cn(
                  'text-slate-700',
                  compact ? 'px-3 py-2' : 'px-4 py-3',
                  col.align === 'right' && 'text-right tabular-nums',
                  col.align === 'center' && 'text-center',
                  col.className
                )}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}
export function StatCard({ label, value, sub, icon, variant = 'default', className }: StatCardProps) {
  const variants = {
    default: 'border-slate-200',
    success: 'border-emerald-200 bg-emerald-50',
    warning: 'border-amber-200 bg-amber-50',
    danger: 'border-red-200 bg-red-50',
  };
  return (
    <div className={cn('bg-white border rounded-xl p-4 flex flex-col gap-1', variants[variant], className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className="text-xl font-semibold text-slate-900 tabular-nums">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
interface TabsProps {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}
export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-0.5 border-b border-slate-200', className)}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-4 py-2.5 text-sm font-medium transition-all relative whitespace-nowrap',
            active === tab.id
              ? 'text-brand-700 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-600 after:rounded-t'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && (
            <span className={cn('ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium',
              active === tab.id ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'
            )}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── ALERT BANNER ─────────────────────────────────────────────────────────────
interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}
export function Alert({ type = 'info', title, children, onDismiss, className }: AlertProps) {
  const styles = {
    info: { wrap: 'bg-blue-50 border-blue-200', icon: <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />, title: 'text-blue-800', text: 'text-blue-700' },
    success: { wrap: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />, title: 'text-emerald-800', text: 'text-emerald-700' },
    warning: { wrap: 'bg-amber-50 border-amber-200', icon: <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />, title: 'text-amber-800', text: 'text-amber-700' },
    error: { wrap: 'bg-red-50 border-red-200', icon: <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />, title: 'text-red-800', text: 'text-red-700' },
  };
  const s = styles[type];
  return (
    <div className={cn('border rounded-lg p-3 flex gap-2.5', s.wrap, className)}>
      {s.icon}
      <div className="flex-1 text-xs">
        {title && <p className={cn('font-semibold mb-0.5', s.title)}>{title}</p>}
        <p className={s.text}>{children}</p>
      </div>
      {onDismiss && <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>}
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-3 text-slate-300">{icon}</div>}
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {description && <p className="text-xs text-slate-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── DROPDOWN MENU ────────────────────────────────────────────────────────────
interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}
interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}
export function Dropdown({ trigger, items, align = 'right' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen(p => !p)}>{trigger}</div>
      {open && (
        <div className={cn(
          'absolute top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[160px]',
          align === 'right' ? 'right-0' : 'left-0'
        )}>
          {items.map((item, i) => (
            <button
              key={i}
              disabled={item.disabled}
              onClick={() => { item.onClick(); setOpen(false); }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50',
                item.disabled && 'opacity-40 pointer-events-none'
              )}
            >
              {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className={cn('h-1.5 bg-slate-200 rounded-full overflow-hidden', className)}>
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── TOOLTIP ─────────────────────────────────────────────────────────────────
export function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 px-2 py-1 text-xs bg-slate-900 text-white rounded-lg whitespace-nowrap pointer-events-none">
          {content}
        </span>
      )}
    </span>
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
