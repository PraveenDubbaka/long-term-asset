import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';

/* ── Existing Loan Debt Tool ── */
import { useStore } from './store/useStore';
import { Sidebar, Header, ReviewQueueDrawer } from './components/Layout';
import { DashboardTab }     from './pages/DashboardTab';
import { LoansTab }         from './pages/LoansTab';
import { ContinuityTab }    from './pages/ContinuityTab';
import { AmortizationTab }  from './pages/AmortizationTab';
import { ActivityTab }      from './pages/ActivityTab';
import { CovenantsTab }     from './pages/CovenantsTab';
import { ReconciliationTab } from './pages/ReconciliationTab';
import { AJEsTab }          from './pages/AJEsTab';
import { ReportsTab }       from './pages/ReportsTab';
import { SettingsTab }      from './pages/SettingsTab';

/* ── Working-Papers Portal ── */
import LongTermAssetPage from './pages/LongTermAssetPage';
import CapitalAsset      from './pages/CapitalAsset';
import InvestmentPage    from './pages/InvestmentPage';

const queryClient = new QueryClient();

const TAB_COMPONENTS = {
  dashboard:      DashboardTab,
  loans:          LoansTab,
  continuity:     ContinuityTab,
  amortization:   AmortizationTab,
  activity:       ActivityTab,
  covenants:      CovenantsTab,
  reconciliation: ReconciliationTab,
  ajes:           AJEsTab,
  reports:        ReportsTab,
  settings:       SettingsTab,
};

/** Existing Loan Debt Tool — tab-based SPA (no routing required internally) */
function LoanDebtTool() {
  const activeTab = useStore(s => s.ui.activeTab);
  const ActiveTab = TAB_COMPONENTS[activeTab];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <ActiveTab />
        </main>
      </div>
      <ReviewQueueDrawer />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Working-Papers Portal routes ── */}
            <Route
              path="/engagements/:engagementId/long-term-asset"
              element={<LongTermAssetPage />}
            />
            <Route
              path="/engagements/:engagementId/capital-asset"
              element={<CapitalAsset />}
            />
            <Route
              path="/engagements/:engagementId/investment"
              element={<InvestmentPage />}
            />

            {/* ── Loan Debt Tool (default, catches everything else) ── */}
            <Route path="*" element={<LoanDebtTool />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
