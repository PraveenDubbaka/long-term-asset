import { create } from 'zustand';
import type {
  Loan, AmortizationRow, ContinuityRow, ActivityItem, Covenant,
  ReconciliationItem, JEProposal, EngagementSettings, ReviewQueueItem,
  TabId, JEStatus, ActivityStatus, ReconciliationStatus, BanDocument
} from '../types';
import {
  initialLoans, initialAmortization, initialContinuity,
  initialActivities, initialCovenants, initialReconciliation,
  initialJEs, initialReviewQueue, initialSettings, accountMappings,
  banDocuments as initialBanDocuments,
} from '../data/mockData';
import type { AccountMapping } from '../types';

interface UIState {
  activeTab: TabId;
  selectedLoanId: string | null;
  reviewQueueOpen: boolean;
  addLoanOpen: boolean;
  editLoanId: string | null;
  importWizardOpen: boolean;
  importWizardType: 'loans' | 'activity' | 'continuity' | null;
}

interface Store {
  loans: Loan[];
  amortization: AmortizationRow[];
  continuity: ContinuityRow[];
  activities: ActivityItem[];
  covenants: Covenant[];
  reconciliation: ReconciliationItem[];
  jes: JEProposal[];
  reviewQueue: ReviewQueueItem[];
  settings: EngagementSettings;
  accountMappings: AccountMapping[];
  banDocuments: BanDocument[];
  ui: UIState;

  addLoan: (loan: Loan) => void;
  updateLoan: (id: string, updates: Partial<Loan>) => void;
  deleteLoan: (id: string) => void;

  updateAmortRow: (id: string, updates: Partial<AmortizationRow>) => void;
  addAmortRow: (row: AmortizationRow) => void;

  updateContinuityRow: (id: string, updates: Partial<ContinuityRow>) => void;
  addContinuityRow: (row: ContinuityRow) => void;
  deleteContinuityRow: (id: string) => void;

  addActivity: (item: ActivityItem) => void;
  updateActivity: (id: string, updates: Partial<ActivityItem>) => void;
  classifyActivity: (id: string, principal: number, interest: number, fees: number) => void;

  updateCovenant: (id: string, updates: Partial<Covenant>) => void;
  addCovenant: (covenant: Covenant) => void;
  deleteCovenant: (id: string) => void;

  updateReconciliation: (id: string, updates: Partial<ReconciliationItem>) => void;
  overrideReconciliation: (id: string, reason: string) => void;

  updateJE: (id: string, updates: Partial<JEProposal>) => void;
  advanceJEStatus: (id: string, status: JEStatus, user: string) => void;
  addJE: (je: JEProposal) => void;
  deleteJE: (id: string) => void;
  restoreJE: (id: string) => void;
  purgeJE: (id: string) => void;

  addBanDocument: (doc: BanDocument) => void;
  removeBanDocument: (id: string) => void;

  resolveReviewItem: (id: string) => void;
  updateSettings: (updates: Partial<EngagementSettings>) => void;

  setActiveTab: (tab: TabId) => void;
  setSelectedLoan: (id: string | null) => void;
  setReviewQueueOpen: (open: boolean) => void;
  setAddLoanOpen: (open: boolean) => void;
  setEditLoanId: (id: string | null) => void;
  setImportWizardOpen: (open: boolean, type?: 'loans' | 'activity' | 'continuity') => void;
}

export const useStore = create<Store>((set) => ({
  loans: initialLoans,
  amortization: initialAmortization,
  continuity: initialContinuity,
  activities: initialActivities,
  covenants: initialCovenants,
  reconciliation: initialReconciliation,
  jes: initialJEs,
  reviewQueue: initialReviewQueue,
  settings: initialSettings,
  accountMappings,
  banDocuments: initialBanDocuments,
  ui: {
    activeTab: 'dashboard',
    selectedLoanId: null,
    reviewQueueOpen: false,
    addLoanOpen: false,
    editLoanId: null,
    importWizardOpen: false,
    importWizardType: null,
  },

  addLoan: (loan) => set(s => ({ loans: [...s.loans, loan] })),
  updateLoan: (id, updates) => set(s => ({
    loans: s.loans.map(l => l.id === id ? { ...l, ...updates } : l)
  })),
  deleteLoan: (id) => set(s => ({ loans: s.loans.filter(l => l.id !== id) })),

  updateAmortRow: (id, updates) => set(s => ({
    amortization: s.amortization.map(r => r.id === id ? { ...r, ...updates } : r)
  })),
  addAmortRow: (row) => set(s => ({ amortization: [...s.amortization, row] })),

  updateContinuityRow: (id, updates) => set(s => ({
    continuity: s.continuity.map(r => r.id === id ? { ...r, ...updates } : r)
  })),
  addContinuityRow: (row) => set(s => ({ continuity: [...s.continuity, row] })),
  deleteContinuityRow: (id) => set(s => ({ continuity: s.continuity.filter(r => r.id !== id) })),

  addActivity: (item) => set(s => ({ activities: [...s.activities, item] })),
  updateActivity: (id, updates) => set(s => ({
    activities: s.activities.map(a => a.id === id ? { ...a, ...updates } : a)
  })),
  classifyActivity: (id, principal, interest, fees) => set(s => ({
    activities: s.activities.map(a => a.id === id ? {
      ...a, principalAmount: principal, interestAmount: interest, feesAmount: fees,
      status: 'Classified' as ActivityStatus
    } : a),
  })),

  updateCovenant: (id, updates) => set(s => ({
    covenants: s.covenants.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  addCovenant: (covenant) => set(s => ({ covenants: [...s.covenants, covenant] })),
  deleteCovenant: (id) => set(s => ({ covenants: s.covenants.filter(c => c.id !== id) })),

  updateReconciliation: (id, updates) => set(s => ({
    reconciliation: s.reconciliation.map(r => r.id === id ? { ...r, ...updates } : r)
  })),
  overrideReconciliation: (id, reason) => set(s => ({
    reconciliation: s.reconciliation.map(r => r.id === id ? {
      ...r, status: 'Override' as ReconciliationStatus, overrideReason: reason
    } : r)
  })),

  updateJE: (id, updates) => set(s => ({
    jes: s.jes.map(j => j.id === id ? { ...j, ...updates } : j)
  })),
  advanceJEStatus: (id, status, user) => set(s => ({
    jes: s.jes.map(j => j.id === id ? {
      ...j, status,
      ...(status === 'Approved' ? { approvedBy: user, approvedAt: new Date().toISOString() } : {}),
      ...(status === 'Posted' ? { postedAt: new Date().toISOString() } : {}),
    } : j)
  })),
  addJE: (je) => set(s => ({ jes: [...s.jes, je] })),
  deleteJE:  (id) => set(s => ({ jes: s.jes.map(j => j.id === id ? { ...j, deleted: true, deletedAt: new Date().toISOString() } : j) })),
  restoreJE: (id) => set(s => ({ jes: s.jes.map(j => j.id === id ? { ...j, deleted: false, deletedAt: undefined } : j) })),
  purgeJE:   (id) => set(s => ({ jes: s.jes.filter(j => j.id !== id) })),

  addBanDocument: (doc) => set(s => ({ banDocuments: [...s.banDocuments, doc] })),
  removeBanDocument: (id) => set(s => ({ banDocuments: s.banDocuments.filter(d => d.id !== id) })),

  resolveReviewItem: (id) => set(s => ({ reviewQueue: s.reviewQueue.filter(r => r.id !== id) })),
  updateSettings: (updates) => set(s => ({ settings: { ...s.settings, ...updates } })),

  setActiveTab: (tab) => set(s => ({ ui: { ...s.ui, activeTab: tab } })),
  setSelectedLoan: (id) => set(s => ({ ui: { ...s.ui, selectedLoanId: id } })),
  setReviewQueueOpen: (open) => set(s => ({ ui: { ...s.ui, reviewQueueOpen: open } })),
  setAddLoanOpen: (open) => set(s => ({ ui: { ...s.ui, addLoanOpen: open } })),
  setEditLoanId: (id) => set(s => ({ ui: { ...s.ui, editLoanId: id } })),
  setImportWizardOpen: (open, type) => set(s => ({ ui: { ...s.ui, importWizardOpen: open, importWizardType: type || null } })),
}));
