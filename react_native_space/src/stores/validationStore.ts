import { create } from 'zustand';
import api from '../lib/api';
import { 
  BlockValidation, 
  OmissionReason, 
  ValidateBlockDto, 
  PendingBlock,
  ScheduledBlock
} from '../types';

interface ValidationState {
  pendingBlocks: PendingBlock[];
  omissionReasons: OmissionReason[];
  validationHistory: BlockValidation[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchPendingBlocks: () => Promise<void>;
  fetchOmissionReasons: () => Promise<void>;
  fetchValidationStats: (startDate: string, endDate: string) => Promise<any>;
  validateBlock: (blockId: string, data: Omit<ValidateBlockDto, 'block_id'>) => Promise<boolean>;
  bulkValidate: (blockIds: string[], status: 'completed' | 'partial' | 'omitted') => Promise<boolean>;
  clearError: () => void;
}

export const useValidationStore = create<ValidationState>((set, get) => ({
  pendingBlocks: [],
  omissionReasons: [],
  validationHistory: [],
  isLoading: false,
  error: null,

  fetchPendingBlocks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/validations/pending');
      set({ pendingBlocks: response?.data ?? [], isLoading: false });
    } catch (e: any) {
      console.error('[ValidationStore] fetchPendingBlocks error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to fetch pending blocks', isLoading: false });
    }
  },

  fetchOmissionReasons: async () => {
    try {
      const response = await api.get('/validations/omission-reasons');
      set({ omissionReasons: response?.data ?? [] });
    } catch (e: any) {
      console.error('[ValidationStore] fetchOmissionReasons error:', e?.message);
    }
  },

  fetchValidationStats: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/validations/stats', { 
        params: { start: startDate, end: endDate } 
      });
      set({ isLoading: false });
      return response?.data ?? null;
    } catch (e: any) {
      console.error('[ValidationStore] fetchValidationStats error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to fetch stats', isLoading: false });
      return null;
    }
  },

  validateBlock: async (blockId, data) => {
    set({ isLoading: true, error: null });
    try {
      // Backend expects POST /validations/block/:blockId with body containing status, etc.
      await api.post(`/validations/block/${blockId}`, data);
      // Remove from pending list
      set((state) => ({
        pendingBlocks: state.pendingBlocks.filter(b => b?.id !== blockId),
        isLoading: false
      }));
      return true;
    } catch (e: any) {
      console.error('[ValidationStore] validateBlock error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to validate block', isLoading: false });
      return false;
    }
  },

  bulkValidate: async (blockIds, status) => {
    set({ isLoading: true, error: null });
    try {
      // Validate each block sequentially
      for (const blockId of blockIds) {
        await api.post(`/validations/block/${blockId}`, { status });
      }
      // Remove validated blocks from pending
      set((state) => ({
        pendingBlocks: state.pendingBlocks.filter(b => !blockIds.includes(b?.id ?? '')),
        isLoading: false
      }));
      return true;
    } catch (e: any) {
      console.error('[ValidationStore] bulkValidate error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to bulk validate', isLoading: false });
      return false;
    }
  },

  clearError: () => set({ error: null })
}));
