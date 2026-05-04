import { create } from 'zustand';
import { wacGroups } from '../data/investmentData';
import type { WACGroup, WACRow } from '../types/investmentTypes';

interface InvWACStore {
  groups: WACGroup[];
  addRow:    (groupId: string, row: WACRow) => void;
  updateRow: (groupId: string, row: WACRow) => void;
  deleteRow: (groupId: string, rowId: string) => void;
}

export const useInvWACStore = create<InvWACStore>(set => ({
  groups: wacGroups.map(g => ({ ...g, rows: g.rows.map(r => ({ ...r })) })),

  addRow: (groupId, row) => set(s => ({
    groups: s.groups.map(g =>
      g.id !== groupId ? g : { ...g, rows: [...g.rows, row] }
    ),
  })),

  updateRow: (groupId, row) => set(s => ({
    groups: s.groups.map(g =>
      g.id !== groupId ? g : { ...g, rows: g.rows.map(r => r.id === row.id ? row : r) }
    ),
  })),

  deleteRow: (groupId, rowId) => set(s => ({
    groups: s.groups.map(g =>
      g.id !== groupId ? g : { ...g, rows: g.rows.filter(r => r.id !== rowId) }
    ),
  })),
}));
