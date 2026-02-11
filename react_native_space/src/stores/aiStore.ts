import { create } from 'zustand';
import api from '../lib/api';
import { 
  AIInsight, 
  FeasibilityAnalysis, 
  PredictionAlert, 
  TimeLeak, 
  RecoverySuggestion 
} from '../types';

interface AIState {
  insights: AIInsight[];
  activeInsightsCount: number;
  lastAnalysis: FeasibilityAnalysis | null;
  lastPredictions: PredictionAlert[];
  lastTimeLeaks: TimeLeak[];
  lastRecoverySuggestions: RecoverySuggestion[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchInsights: () => Promise<void>;
  dismissInsight: (id: string) => Promise<boolean>;
  analyzeFeasibility: (weekStartDate: string) => Promise<FeasibilityAnalysis | null>;
  predictAlerts: () => Promise<PredictionAlert[]>;
  detectTimeLeaks: (startDate?: string, endDate?: string) => Promise<TimeLeak[]>;
  suggestRecovery: (categoryId: string, hoursNeeded: number) => Promise<RecoverySuggestion[]>;
  clearError: () => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  insights: [],
  activeInsightsCount: 0,
  lastAnalysis: null,
  lastPredictions: [],
  lastTimeLeaks: [],
  lastRecoverySuggestions: [],
  isLoading: false,
  error: null,

  fetchInsights: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/ai/insights');
      const insights = response?.data ?? [];
      const activeInsightsCount = insights.filter((i: AIInsight) => !i?.is_dismissed).length;
      set({ insights, activeInsightsCount, isLoading: false });
    } catch (e: any) {
      console.error('[AIStore] fetchInsights error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to fetch insights', isLoading: false });
    }
  },

  dismissInsight: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/ai/insights/${id}/dismiss`);
      set((state) => ({
        insights: state.insights.map(i => 
          i?.id === id ? { ...i, is_dismissed: true, dismissed_at: new Date().toISOString() } : i
        ),
        activeInsightsCount: Math.max(0, state.activeInsightsCount - 1),
        isLoading: false
      }));
      return true;
    } catch (e: any) {
      console.error('[AIStore] dismissInsight error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to dismiss insight', isLoading: false });
      return false;
    }
  },

  analyzeFeasibility: async (weekStartDate) => {
    set({ isLoading: true, error: null });
    try {
      // Validate date format
      if (!weekStartDate || typeof weekStartDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(weekStartDate)) {
        console.error('[AIStore] Invalid date format:', weekStartDate);
        set({ error: 'Invalid date format. Expected YYYY-MM-DD', isLoading: false });
        return null;
      }
      
      const response = await api.post('/ai/analyze/feasibility', { week_start_date: weekStartDate });
      const analysis = response?.data;
      set({ lastAnalysis: analysis ?? null, isLoading: false });
      await get().fetchInsights();
      return analysis ?? null;
    } catch (e: any) {
      console.error('[AIStore] analyzeFeasibility error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to analyze feasibility', isLoading: false });
      return null;
    }
  },

  predictAlerts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/ai/analyze/predictions');
      const predictions = response?.data ?? [];
      set({ lastPredictions: predictions, isLoading: false });
      await get().fetchInsights();
      return predictions;
    } catch (e: any) {
      console.error('[AIStore] predictAlerts error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to predict alerts', isLoading: false });
      return [];
    }
  },

  detectTimeLeaks: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.post('/ai/analyze/time-leaks', params);
      const leaks = response?.data ?? [];
      set({ lastTimeLeaks: leaks, isLoading: false });
      await get().fetchInsights();
      return leaks;
    } catch (e: any) {
      console.error('[AIStore] detectTimeLeaks error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to detect time leaks', isLoading: false });
      return [];
    }
  },

  suggestRecovery: async (categoryId, hoursNeeded) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/ai/analyze/recovery', { 
        category_id: categoryId, 
        hours_needed: hoursNeeded 
      });
      const suggestions = response?.data ?? [];
      set({ lastRecoverySuggestions: suggestions, isLoading: false });
      return suggestions;
    } catch (e: any) {
      console.error('[AIStore] suggestRecovery error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to suggest recovery', isLoading: false });
      return [];
    }
  },

  clearError: () => set({ error: null })
}));
