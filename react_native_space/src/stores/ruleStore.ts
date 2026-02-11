import { create } from 'zustand';
import api from '../lib/api';
import { 
  RestRule, 
  UsageLimit, 
  RoutineViolation,
  CreateRestRuleDto,
  CreateUsageLimitDto
} from '../types';

interface RuleState {
  restRules: RestRule[];
  usageLimits: UsageLimit[];
  violations: RoutineViolation[];
  unacknowledgedCount: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchRestRules: () => Promise<void>;
  fetchUsageLimits: () => Promise<void>;
  fetchViolations: () => Promise<void>;
  createRestRule: (data: CreateRestRuleDto) => Promise<boolean>;
  updateRestRule: (id: string, data: Partial<CreateRestRuleDto>) => Promise<boolean>;
  deleteRestRule: (id: string) => Promise<boolean>;
  createUsageLimit: (data: CreateUsageLimitDto) => Promise<boolean>;
  updateUsageLimit: (id: string, data: Partial<CreateUsageLimitDto>) => Promise<boolean>;
  deleteUsageLimit: (id: string) => Promise<boolean>;
  acknowledgeViolation: (id: string) => Promise<boolean>;
  checkViolations: (date: string) => Promise<RoutineViolation[]>;
  clearError: () => void;
}

export const useRuleStore = create<RuleState>((set, get) => ({
  restRules: [],
  usageLimits: [],
  violations: [],
  unacknowledgedCount: 0,
  isLoading: false,
  error: null,

  fetchRestRules: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/rules/rest');
      set({ restRules: response?.data ?? [], isLoading: false });
    } catch (e: any) {
      console.error('[RuleStore] fetchRestRules error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to fetch rest rules', isLoading: false });
    }
  },

  fetchUsageLimits: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/rules/limits');
      set({ usageLimits: response?.data ?? [], isLoading: false });
    } catch (e: any) {
      console.error('[RuleStore] fetchUsageLimits error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to fetch usage limits', isLoading: false });
    }
  },

  fetchViolations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/rules/violations');
      const violations = response?.data ?? [];
      const unacknowledgedCount = violations.filter((v: RoutineViolation) => !v?.acknowledged).length;
      set({ violations, unacknowledgedCount, isLoading: false });
    } catch (e: any) {
      console.error('[RuleStore] fetchViolations error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to fetch violations', isLoading: false });
    }
  },

  createRestRule: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/rules/rest', data);
      const newRule = response?.data;
      if (newRule) {
        set((state) => ({ 
          restRules: [...state.restRules, newRule], 
          isLoading: false 
        }));
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (e: any) {
      console.error('[RuleStore] createRestRule error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to create rule', isLoading: false });
      return false;
    }
  },

  updateRestRule: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/rules/rest/${id}`, data);
      const updatedRule = response?.data;
      if (updatedRule) {
        set((state) => ({
          restRules: state.restRules.map(r => r?.id === id ? updatedRule : r),
          isLoading: false
        }));
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (e: any) {
      console.error('[RuleStore] updateRestRule error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to update rule', isLoading: false });
      return false;
    }
  },

  deleteRestRule: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/rules/rest/${id}`);
      set((state) => ({
        restRules: state.restRules.filter(r => r?.id !== id),
        isLoading: false
      }));
      return true;
    } catch (e: any) {
      console.error('[RuleStore] deleteRestRule error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to delete rule', isLoading: false });
      return false;
    }
  },

  createUsageLimit: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/rules/limits', data);
      const newLimit = response?.data;
      if (newLimit) {
        set((state) => ({ 
          usageLimits: [...state.usageLimits, newLimit], 
          isLoading: false 
        }));
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (e: any) {
      console.error('[RuleStore] createUsageLimit error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to create limit', isLoading: false });
      return false;
    }
  },

  updateUsageLimit: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/rules/limits/${id}`, data);
      const updatedLimit = response?.data;
      if (updatedLimit) {
        set((state) => ({
          usageLimits: state.usageLimits.map(l => l?.id === id ? updatedLimit : l),
          isLoading: false
        }));
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (e: any) {
      console.error('[RuleStore] updateUsageLimit error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to update limit', isLoading: false });
      return false;
    }
  },

  deleteUsageLimit: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/rules/limits/${id}`);
      set((state) => ({
        usageLimits: state.usageLimits.filter(l => l?.id !== id),
        isLoading: false
      }));
      return true;
    } catch (e: any) {
      console.error('[RuleStore] deleteUsageLimit error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to delete limit', isLoading: false });
      return false;
    }
  },

  acknowledgeViolation: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/rules/violations/${id}/acknowledge`);
      set((state) => ({
        violations: state.violations.map(v => 
          v?.id === id ? { ...v, acknowledged: true, acknowledged_at: new Date().toISOString() } : v
        ),
        unacknowledgedCount: Math.max(0, state.unacknowledgedCount - 1),
        isLoading: false
      }));
      return true;
    } catch (e: any) {
      console.error('[RuleStore] acknowledgeViolation error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to acknowledge violation', isLoading: false });
      return false;
    }
  },

  checkViolations: async (date) => {
    try {
      const response = await api.post('/rules/check', { date });
      const newViolations = response?.data ?? [];
      await get().fetchViolations();
      return newViolations;
    } catch (e: any) {
      console.error('[RuleStore] checkViolations error:', e?.message);
      return [];
    }
  },

  clearError: () => set({ error: null })
}));
