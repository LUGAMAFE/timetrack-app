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
  fetchValidationHistory: (startDate?: string, endDate?: string) => Promise<void>;
  validateBlock: (data: ValidateBlockDto) => Promise<boolean>;
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

  fetchValidationHistory: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await api.get('/validations/history', { params });
      set({ validationHistory: response?.data ?? [], isLoading: false });
    } catch (e: any) {
      console.error('[ValidationStore] fetchValidationHistory error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to fetch history', isLoading: false });
    }
  },

  validateBlock: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/validations/validate', data);
      // Remove from pending list
      set((state) => ({
        pendingBlocks: state.pendingBlocks.filter(b => b?.id !== data.block_id),
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
        await api.post('/validations/validate', { block_id: blockId, status });
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
