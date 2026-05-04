import { create } from 'zustand';

export interface PlaidInstitution { id: string; name: string; abbr: string; color: string; }

interface PlaidStore {
  plaidConnected:   boolean;
  plaidInstitution: PlaidInstitution | null;
  plaidLastSync:    Date | null;
  plaidRefreshing:  boolean;
  showPlaid:        boolean;
  setShowPlaid:     (v: boolean) => void;
  connect:          (inst: PlaidInstitution) => void;
  setLastSync:      (v: Date) => void;
  setPlaidRefreshing: (v: boolean) => void;
  refresh:          () => Promise<void>;
  disconnect:       () => void;
}

export const usePlaidStore = create<PlaidStore>((set) => ({
  plaidConnected:   false,
  plaidInstitution: null,
  plaidLastSync:    null,
  plaidRefreshing:  false,
  showPlaid:        false,
  setShowPlaid:       (v)    => set({ showPlaid: v }),
  connect:            (inst) => set({ plaidConnected: true, plaidInstitution: inst, plaidLastSync: new Date(), showPlaid: false }),
  setLastSync:        (v)    => set({ plaidLastSync: v }),
  setPlaidRefreshing: (v)    => set({ plaidRefreshing: v }),
  refresh: async () => {
    set({ plaidRefreshing: true });
    await new Promise(r => setTimeout(r, 1800));
    set({ plaidLastSync: new Date(), plaidRefreshing: false });
  },
  disconnect: () => set({ plaidConnected: false, plaidInstitution: null, plaidLastSync: null, showPlaid: false }),
}));
