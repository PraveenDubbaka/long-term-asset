import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, FileText, Trash2, Plus, Search } from 'lucide-react';
import { Button } from '@/components/wp-ui/button';
import { Input } from '@/components/wp-ui/input';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FinancialNote {
  id: string;
  number: number;
  title: string;
  content: string;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_NOTES: FinancialNote[] = [
  {
    id: 'note-ltd-1',
    number: 1,
    title: 'Long-term debt',
    content:
`Long-term debt consists of the following as at December 31, 2024:

  RBC Term Loan (RBC-2022-4451) — $3,452,847 CAD
  Fixed rate of 5.25% per annum, ACT/365 day count. Monthly principal and interest payments of $71,200. Secured by a general security agreement over all present and after-acquired property of the Company. Matures November 1, 2027.

  TD Operating Line of Credit (TD-LOC-8832) — $875,000 CAD drawn ($2,000,000 facility)
  Variable rate of prime + 2.20% (current effective rate 7.45%), interest-only payments monthly. Secured by a first-ranking floating charge over accounts receivable and inventory. Revolving facility with no fixed maturity; subject to annual review.

  HSBC Equipment Loan (HSBC-EQ-2291) — USD $1,125,000 (CAD $1,530,375 at closing rate of 1.3604)
  Fixed rate of 6.10% per annum, 30/360 day count. Monthly blended payments of USD $21,850. Secured by a specific security interest over the financed equipment. Matures March 15, 2028.

The aggregate carrying amount of long-term debt is $5,858,222 CAD (2023: $6,214,500 CAD). The current portion reclassified to current liabilities totals $842,400 CAD (see Note 3).`,
  },
  {
    id: 'note-ltd-2',
    number: 2,
    title: 'Interest expense and accrued interest',
    content:
`Interest expense recognized in the statement of operations for the year ended December 31, 2024 is as follows:

  RBC Term Loan — $187,461 CAD
  TD Operating Line of Credit — $63,214 CAD
  HSBC Equipment Loan (translated at average rate) — $83,902 CAD
  Total interest expense — $334,577 CAD (2023: $318,240 CAD)

Accrued interest payable at December 31, 2024 represents interest earned but not yet due per the respective loan agreements:

  RBC Term Loan accrued interest — $15,875 CAD
  TD Line of Credit accrued interest — $5,462 CAD
  HSBC Equipment Loan accrued interest (at closing rate) — $7,214 CAD
  Total accrued interest payable — $28,551 CAD

Interest is calculated on the outstanding daily principal balance using the applicable day-count convention for each instrument. The adjusting journal entry to record year-end accrued interest has been reviewed and approved by management.`,
  },
  {
    id: 'note-ltd-3',
    number: 3,
    title: 'Current portion of long-term debt',
    content:
`The current portion of long-term debt represents scheduled principal repayments due within twelve months of December 31, 2024, reclassified from long-term liabilities in accordance with IAS 1 / ASPE Section 1510.

  RBC Term Loan — $612,400 CAD
  HSBC Equipment Loan (at closing rate of 1.3604) — $230,000 CAD
  Total current portion — $842,400 CAD

The TD Operating Line of Credit is classified as current in its entirety, as the facility is subject to annual renewal at the lender's discretion. Management expects the facility to be renewed on substantially similar terms; however, no legally enforceable commitment to renew exists as at the reporting date.`,
  },
  {
    id: 'note-ltd-4',
    number: 4,
    title: 'Debt covenants and compliance',
    content:
`The Company's credit facilities contain the following financial maintenance covenants, tested at the frequency noted:

  (i) Debt Service Coverage Ratio (DSCR) ≥ 1.25×, tested quarterly.
      Actual at December 31, 2024: 1.12× — COVENANT BREACH

  (ii) Minimum unrestricted cash ≥ $500,000 CAD, tested monthly.
      Actual at December 31, 2024: $425,000 CAD — AT RISK

  (iii) Total Debt / EBITDA ≤ 4.0×, tested semi-annually.
      Actual at December 31, 2024: 3.6× — COMPLIANT

As at December 31, 2024, the Company was in breach of the DSCR covenant under the RBC Term Loan. Management obtained a written waiver from RBC dated January 15, 2025 covering the Q4 2024 test period. The waiver does not constitute a cure; management has presented a remediation plan to the lender and expects to return to compliance by Q2 2025. The breach does not trigger cross-default provisions under the TD or HSBC facilities.`,
  },
  {
    id: 'note-ltd-5',
    number: 5,
    title: 'Principal repayment schedule',
    content:
`Scheduled principal repayments of long-term debt (excluding the revolving line of credit) over the next five years and thereafter are as follows:

  2025 — $842,400 CAD
  2026 — $865,100 CAD
  2027 — $1,745,347 CAD  (includes RBC Term Loan balloon)
  2028 — $975,375 CAD   (includes HSBC final tranche)
  2029 and thereafter — $Nil

Total — $4,428,222 CAD

The above schedule has been translated at the December 31, 2024 closing rate of USD/CAD 1.3604 for the HSBC Equipment Loan. Actual repayments in Canadian dollars will vary with movements in the USD/CAD exchange rate.`,
  },
  {
    id: 'note-ltd-6',
    number: 6,
    title: 'Foreign currency risk on long-term debt',
    content:
`The HSBC Equipment Loan is denominated in United States dollars. The Company does not currently hold any hedging instruments (forward contracts, cross-currency swaps) to offset the foreign currency exposure on this instrument.

Exchange rates applied:
  Closing rate (December 31, 2024): 1.3604 CAD per USD
  Average rate (year ended December 31, 2024): 1.3521 CAD per USD
  Prior year closing rate (December 31, 2023): 1.3248 CAD per USD

The FX translation adjustment for the year ended December 31, 2024 is a loss of $47,632 CAD (2023: gain of $21,450 CAD), recognized in other comprehensive income. The cumulative unrealized translation loss recorded in accumulated other comprehensive income as at December 31, 2024 is $31,780 CAD.`,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function NotesTab({ client, yearEnd }: { client?: string; yearEnd?: string } = {}) {
  const [notes, setNotes]       = useState<FinancialNote[]>(SEED_NOTES);
  const [expanded, setExpanded] = useState<Set<string>>(new Set([SEED_NOTES[0].id]));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch]     = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) : notes;
  }, [notes, search]);

  const allSelected   = filtered.length > 0 && filtered.every(n => selected.has(n.id));
  const someSelected  = filtered.some(n => selected.has(n.id));

  const toggleExpand  = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const toggleSelect  = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(prev => { const next = new Set(prev); filtered.forEach(n => next.delete(n.id)); return next; });
    } else {
      setSelected(prev => { const next = new Set(prev); filtered.forEach(n => next.add(n.id)); return next; });
    }
  };

  const deleteSelected = () => {
    setNotes(prev => prev.filter(n => !selected.has(n.id)));
    setSelected(new Set());
  };

  const updateContent = (id: string, content: string) =>
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content } : n));

  const updateTitle = (id: string, title: string) =>
    setNotes(prev => prev.map(n => n.id === id ? { ...n, title } : n));

  const addNote = () => {
    const maxNum = notes.reduce((m, n) => Math.max(m, n.number), 0);
    const id = `note-new-${Date.now()}`;
    const newNote: FinancialNote = {
      id,
      number: maxNum + 1,
      title:  'New note',
      content: '',
    };
    setNotes(prev => [...prev, newNote]);
    setExpanded(prev => new Set([...prev, id]));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      {/* Page heading */}
      <div className="text-center mb-2">
        <p className="text-sm text-muted-foreground font-medium">
          {client ?? 'Client'} validation
        </p>
        <h2 className="text-lg font-bold text-foreground mt-0.5">Notes to Financial Information</h2>
        <p className="text-sm text-muted-foreground mt-0.5">For the year ended {yearEnd ?? 'December 31, 2024'}</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: select-all + delete */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 accent-primary rounded cursor-pointer"
              checked={allSelected}
              ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
              onChange={toggleSelectAll}
            />
            <span className="text-sm text-foreground/70">Select all</span>
          </label>
          <Button
            variant="secondary"
            size="sm"
            disabled={!someSelected}
            onClick={deleteSelected}
            className="gap-1.5 disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </Button>
        </div>

        {/* Right: search + add */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60 pointer-events-none" />
            <Input
              className="pl-8 w-[220px] h-9"
              placeholder="Search"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button variant="default" size="default" onClick={addNote} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add notes
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </Button>
        </div>
      </div>

      {/* Notes list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            {search ? 'No notes match your search.' : 'No notes yet — click "Add notes" to create one.'}
          </div>
        )}

        {filtered.map(note => {
          const isOpen     = expanded.has(note.id);
          const isSelected = selected.has(note.id);

          return (
            <div key={note.id} className={`${isSelected ? 'bg-primary/[0.03]' : ''}`}>
              {/* Note header row */}
              <div className="flex items-center gap-2 px-4 py-3 hover:bg-muted/30 transition-colors group">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-primary rounded cursor-pointer flex-shrink-0"
                  checked={isSelected}
                  onChange={() => toggleSelect(note.id)}
                  onClick={e => e.stopPropagation()}
                />

                {/* Expand toggle */}
                <button
                  onClick={() => toggleExpand(note.id)}
                  className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  {isOpen
                    ? <ChevronDown className="w-4 h-4" />
                    : <ChevronRight className="w-4 h-4" />
                  }
                </button>

                {/* Document icon */}
                <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />

                {/* Title (editable inline) */}
                <input
                  type="text"
                  className="flex-1 text-sm font-semibold text-foreground bg-transparent focus:outline-none focus:bg-muted/40 rounded px-1 -ml-1 cursor-text"
                  value={`${note.number}.${note.title}`}
                  onChange={e => {
                    // strip leading "N." prefix if user edits it
                    const raw = e.target.value.replace(/^\d+\./, '');
                    updateTitle(note.id, raw.trimStart() || note.title);
                  }}
                  onClick={e => e.stopPropagation()}
                />
              </div>

              {/* Expanded body */}
              {isOpen && (
                <div className="px-12 pb-4 space-y-3">
                  <textarea
                    rows={4}
                    className="input-double-border w-full text-sm px-3 py-2.5 rounded-[10px] border border-[#dcdfe4] bg-white dark:bg-card text-foreground placeholder:text-muted-foreground/50 transition-all duration-200 hover:border-[hsl(210_25%_75%)] dark:border-[hsl(220_15%_30%)] resize-none focus:outline-none"
                    placeholder="Enter the note disclosure text…"
                    value={note.content}
                    onChange={e => updateContent(note.id, e.target.value)}
                  />
                  <Button variant="default" size="sm" className="gap-1.5" onClick={addNote}>
                    <Plus className="w-3.5 h-3.5" />
                    Add Type
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
