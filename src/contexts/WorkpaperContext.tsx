import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Loan } from '../types';
import { initialLoans } from '../data/mockData';

interface WorkpaperCtx {
  loans: Loan[];
  addLoan: (l: Loan) => void;
  updateLoan: (id: string, changes: Partial<Loan>) => void;
  deleteLoan: (id: string) => void;
  workpaperId: string;
  isWorkpaperScoped: true;
}

export const WorkpaperContext = createContext<WorkpaperCtx | null>(null);

// ─── Storage versioning ───────────────────────────────────────────────────────
// v2 = current format. Any data stored without this marker is stale (from old
// buggy code) and must be discarded so new workpapers always start empty.
const STORAGE_VERSION = 2;
interface StoredPayload { v: number; loans: Loan[] }

function loadFromStorage(key: string): Loan[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: StoredPayload = JSON.parse(raw);
    // Reject data from old code versions (no 'v' field, or wrong version)
    if (!parsed || parsed.v !== STORAGE_VERSION) {
      localStorage.removeItem(key);   // purge stale entry immediately
      return null;
    }
    return parsed.loans;
  } catch {
    return null;
  }
}

function saveToStorage(key: string, loans: Loan[]) {
  try {
    const payload: StoredPayload = { v: STORAGE_VERSION, loans };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {}
}

// ─── One-time migration: purge ALL stale wp_loans__ keys on startup ───────────
function purgeStaleKeys() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith('wp_loans__')) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.v !== STORAGE_VERSION) localStorage.removeItem(key);
      } catch {
        localStorage.removeItem(key);
      }
    }
  } catch {}
}
purgeStaleKeys();   // runs once when this module is first imported

// ─── Provider ─────────────────────────────────────────────────────────────────
interface Props {
  engagementId: string;
  label: string;
  /** true  → brand-new workpaper, starts empty, persisted by label
   *  false → default workpaper, always loads initialLoans (demo data) */
  isEmpty: boolean;
  children: React.ReactNode;
}

export function WorkpaperProvider({ engagementId, label, isEmpty, children }: Props) {
  const workpaperId = `${engagementId}__${label}`;
  // Only new workpapers are persisted; default workpaper always uses mock data.
  const storageKey = isEmpty ? `wp_loans__${workpaperId}` : null;

  const [loans, setLoans] = useState<Loan[]>(() => {
    if (isEmpty) {
      const saved = storageKey ? loadFromStorage(storageKey) : null;
      return saved ?? [];        // new workpaper: saved data OR empty
    }
    return initialLoans;         // default workpaper: always demo data
  });

  // Persist new workpapers only
  useEffect(() => {
    if (!storageKey) return;
    saveToStorage(storageKey, loans);
  }, [loans, storageKey]);

  const addLoan    = useCallback((l: Loan) => setLoans(p => [...p, l]), []);
  const updateLoan = useCallback((id: string, ch: Partial<Loan>) =>
    setLoans(p => p.map(l => l.id === id ? { ...l, ...ch } : l)), []);
  const deleteLoan = useCallback((id: string) =>
    setLoans(p => p.filter(l => l.id !== id)), []);

  return (
    <WorkpaperContext.Provider value={{ loans, addLoan, updateLoan, deleteLoan, workpaperId, isWorkpaperScoped: true }}>
      {children}
    </WorkpaperContext.Provider>
  );
}

/** Returns workpaper context if inside a WorkpaperProvider, otherwise null. */
export function useWorkpaperLoans() {
  return useContext(WorkpaperContext);
}
