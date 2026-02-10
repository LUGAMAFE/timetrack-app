import { create } from 'zustand';
import api from '../lib/api';
import { TimeEntry, CreateTimeEntryDto } from '../types';

interface TimeEntryState {
  entries: TimeEntry[];
  isLoading: boolean;
  error: string | null;
  fetchEntries: (month?: string) => Promise<void>;
  createEntry: (dto: CreateTimeEntryDto) => Promise<boolean>;
  updateEntry: (id: string, dto: Partial<CreateTimeEntryDto>) => Promise<boolean>;
  deleteEntry: (id: string) => Promise<boolean>;
}

export const useTimeEntryStore = create<TimeEntryState>((set, get) => ({
  entries: [],
  isLoading: false,
  error: null,

  fetchEntries: async (month) => {
    set({ isLoading: true, error: null });
    try {
      const params = month ? { month } : {};
      const res = await api.get('/api/time-entries', { params });
      set({ entries: res?.data?.entries ?? [], isLoading: false });
    } catch (e: any) {
      set({ error: e?.message || 'Failed to fetch entries', isLoading: false });
    }
  },

  createEntry: async (dto) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/api/time-entries', dto);
      await api.post('/api/streaks/update');
      set({ isLoading: false });
      return true;
    } catch (e: any) {
      set({ error: e?.message || 'Failed to create entry', isLoading: false });
      return false;
    }
  },

  updateEntry: async (id, dto) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/api/time-entries/${id}`, dto);
      set({ isLoading: false });
      return true;
    } catch (e: any) {
      set({ error: e?.message || 'Failed to update entry', isLoading: false });
      return false;
    }
  },

  deleteEntry: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/time-entries/${id}`);
      set({ isLoading: false });
      return true;
    } catch (e: any) {
      set({ error: e?.message || 'Failed to delete entry', isLoading: false });
      return false;
    }
  }
}));
