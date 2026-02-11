import { create } from 'zustand';
import api from '../lib/api';
import { 
  MonthlyGoal, 
  WeeklyGoal, 
  CreateMonthlyGoalDto, 
  CreateWeeklyGoalDto,
  GoalProgress,
  DailyBudget
} from '../types';

interface GoalState {
  monthlyGoals: MonthlyGoal[];
  weeklyGoals: WeeklyGoal[];
  monthlyProgress: GoalProgress[];
  weeklyProgress: GoalProgress[];
  dailyBudget: DailyBudget[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchMonthlyGoals: (year?: number, month?: number) => Promise<void>;
  fetchWeeklyGoals: (year?: number, week?: number) => Promise<void>;
  createMonthlyGoal: (data: CreateMonthlyGoalDto) => Promise<boolean>;
  createWeeklyGoal: (data: CreateWeeklyGoalDto) => Promise<boolean>;
  updateMonthlyGoal: (id: string, data: Partial<CreateMonthlyGoalDto>) => Promise<boolean>;
  deleteMonthlyGoal: (id: string) => Promise<boolean>;
  fetchMonthlyProgress: (year?: number, month?: number) => Promise<void>;
  fetchWeeklyProgress: (year?: number, week?: number) => Promise<void>;
  fetchDailyBudget: () => Promise<void>;
  clearError: () => void;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  monthlyGoals: [],
  weeklyGoals: [],
  monthlyProgress: [],
  weeklyProgress: [],
  dailyBudget: [],
  isLoading: false,
  error: null,

  fetchMonthlyGoals: async (year, month) => {
    set({ isLoading: true, error: null });
    try {
      const params: any = {};
      // Only add valid number parameters
      if (year !== undefined && !isNaN(year) && year > 0) params.year = year;
      if (month !== undefined && !isNaN(month) && month > 0) params.month = month;
      
      const config = Object.keys(params).length > 0 ? { params } : {};
      const response = await api.get('/goals/monthly', config);
      set({ monthlyGoals: response?.data ?? [], isLoading: false });
    } catch (e: any) {
      console.error('[GoalStore] fetchMonthlyGoals error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to fetch monthly goals', isLoading: false });
    }
  },

  fetchWeeklyGoals: async (year, week) => {
    set({ isLoading: true, error: null });
    try {
      const params: any = {};
      // Only add valid number parameters
      if (year !== undefined && !isNaN(year) && year > 0) params.year = year;
      if (week !== undefined && !isNaN(week) && week > 0) params.week = week;
      
      const config = Object.keys(params).length > 0 ? { params } : {};
      const response = await api.get('/goals/weekly', config);
      set({ weeklyGoals: response?.data ?? [], isLoading: false });
    } catch (e: any) {
      console.error('[GoalStore] fetchWeeklyGoals error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to fetch weekly goals', isLoading: false });
    }
  },

  createMonthlyGoal: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/goals/monthly', data);
      const newGoal = response?.data;
      if (newGoal) {
        set((state) => ({ 
          monthlyGoals: [...state.monthlyGoals, newGoal], 
          isLoading: false 
        }));
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (e: any) {
      console.error('[GoalStore] createMonthlyGoal error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to create goal', isLoading: false });
      return false;
    }
  },

  createWeeklyGoal: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/goals/weekly', data);
      const newGoal = response?.data;
      if (newGoal) {
        set((state) => ({ 
          weeklyGoals: [...state.weeklyGoals, newGoal], 
          isLoading: false 
        }));
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (e: any) {
      console.error('[GoalStore] createWeeklyGoal error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to create goal', isLoading: false });
      return false;
    }
  },

  updateMonthlyGoal: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/goals/monthly/${id}`, data);
      const updatedGoal = response?.data;
      if (updatedGoal) {
        set((state) => ({
          monthlyGoals: state.monthlyGoals.map(g => g?.id === id ? updatedGoal : g),
          isLoading: false
        }));
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (e: any) {
      console.error('[GoalStore] updateMonthlyGoal error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to update goal', isLoading: false });
      return false;
    }
  },

  deleteMonthlyGoal: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/goals/monthly/${id}`);
      set((state) => ({
        monthlyGoals: state.monthlyGoals.filter(g => g?.id !== id),
        isLoading: false
      }));
      return true;
    } catch (e: any) {
      console.error('[GoalStore] deleteMonthlyGoal error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to delete goal', isLoading: false });
      return false;
    }
  },

  fetchMonthlyProgress: async (year, month) => {
    set({ isLoading: true, error: null });
    try {
      const params: any = {};
      // Only add valid number parameters
      if (year !== undefined && !isNaN(year) && year > 0) params.year = year;
      if (month !== undefined && !isNaN(month) && month > 0) params.month = month;
      
      const config = Object.keys(params).length > 0 ? { params } : {};
      const response = await api.get('/goals/monthly/progress', config);
      set({ monthlyProgress: response?.data ?? [], isLoading: false });
    } catch (e: any) {
      console.error('[GoalStore] fetchMonthlyProgress error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to fetch progress', isLoading: false });
    }
  },

  fetchWeeklyProgress: async (year, week) => {
    set({ isLoading: true, error: null });
    try {
      const params: any = {};
      // Only add valid number parameters
      if (year !== undefined && !isNaN(year) && year > 0) params.year = year;
      if (week !== undefined && !isNaN(week) && week > 0) params.week = week;
      
      const config = Object.keys(params).length > 0 ? { params } : {};
      const response = await api.get('/goals/weekly/progress', config);
      set({ weeklyProgress: response?.data ?? [], isLoading: false });
    } catch (e: any) {
      console.error('[GoalStore] fetchWeeklyProgress error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to fetch progress', isLoading: false });
    }
  },

  fetchDailyBudget: async () => {
    // This endpoint doesn't exist in backend, so we'll calculate locally or skip
    console.log('[GoalStore] fetchDailyBudget - endpoint not implemented');
    set({ dailyBudget: [] });
  },

  clearError: () => set({ error: null })
}));
