import { create } from 'zustand';
import api from '../lib/api';
import { MonthlyStats, StreakData } from '../types';

interface DashboardState {
  monthlyStats: MonthlyStats | null;
  streaks: StreakData | null;
  isLoading: boolean;
  error: string | null;
  fetchMonthlyStats: (month: string) => Promise<void>;
  fetchStreaks: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  monthlyStats: null,
  streaks: null,
  isLoading: false,
  error: null,

  fetchMonthlyStats: async (month) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/api/dashboard/monthly', { params: { month } });
      set({ monthlyStats: res?.data ?? null, isLoading: false });
    } catch (e: any) {
      set({ error: e?.message || 'Failed to fetch stats', isLoading: false });
    }
  },

  fetchStreaks: async () => {
    try {
      const res = await api.get('/api/streaks');
      set({ streaks: res?.data ?? null });
    } catch (e) { /* ignore */ }
  }
}));
