import { create } from 'zustand';
import api from '../lib/api';
import { DashboardStats, StreakData, MonthlyStats, CategoryBreakdown } from '../types';

interface DashboardState {
  stats: DashboardStats | null;
  streak: StreakData | null;
  monthlyStats: MonthlyStats | null;
  isLoading: boolean;
  error: string | null;
  
  fetchStats: (period?: 'week' | 'month') => Promise<void>;
  fetchStreak: () => Promise<void>;
  fetchMonthlyStats: (year?: number, month?: number) => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  streak: null,
  monthlyStats: null,
  isLoading: false,
  error: null,

  fetchStats: async (period = 'week') => {
    set({ isLoading: true, error: null });
    try {
      // Dashboard stats endpoint doesn't exist, use monthly stats as fallback
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const response = await api.get('/dashboard/monthly', { params: { month } });
      const monthlyData = response?.data ?? {};
      set({ 
        stats: {
          period: period,
          total_blocks: monthlyData?.total_blocks ?? 0,
          completed_blocks: monthlyData?.completed_blocks ?? 0,
          partial_blocks: monthlyData?.partial_blocks ?? 0,
          omitted_blocks: monthlyData?.omitted_blocks ?? 0,
          completion_rate: monthlyData?.completion_rate ?? 0,
          total_scheduled_hours: monthlyData?.total_scheduled_hours ?? 0,
          total_completed_hours: monthlyData?.total_completed_hours ?? 0,
          category_breakdown: monthlyData?.category_breakdown ?? [],
          top_omission_reasons: monthlyData?.top_omission_reasons ?? [],
          streak: { current_streak: 0, longest_streak: 0 },
          goal_progress: [],
        },
        isLoading: false 
      });
    } catch (e: any) {
      console.error('[DashboardStore] fetchStats error:', e?.message);
      // Create default stats on error
      set({ 
        stats: {
          period: period,
          total_blocks: 0,
          completed_blocks: 0,
          partial_blocks: 0,
          omitted_blocks: 0,
          completion_rate: 0,
          total_scheduled_hours: 0,
          total_completed_hours: 0,
          category_breakdown: [],
          top_omission_reasons: [],
          streak: { current_streak: 0, longest_streak: 0 },
          goal_progress: [],
        },
        isLoading: false 
      });
    }
  },

  fetchStreak: async () => {
    try {
      const response = await api.get('/streaks');
      set({ streak: response?.data ?? { current_streak: 0, longest_streak: 0 } });
    } catch (e: any) {
      console.error('[DashboardStore] fetchStreak error:', e?.message);
      set({ streak: { current_streak: 0, longest_streak: 0 } });
    }
  },

  fetchMonthlyStats: async (year, month) => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date();
      const y = year ?? now.getFullYear();
      const m = month ?? now.getMonth() + 1;
      // Backend expects month in YYYY-MM format
      const monthParam = `${y}-${String(m).padStart(2, '0')}`;
      const response = await api.get('/dashboard/monthly', { params: { month: monthParam } });
      set({ monthlyStats: response?.data ?? null, isLoading: false });
    } catch (e: any) {
      console.error('[DashboardStore] fetchMonthlyStats error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to fetch stats', isLoading: false });
    }
  },

  clearError: () => set({ error: null })
}));
