import { create } from 'zustand';
import api from '../lib/api';
import { 
  ScheduledBlock, 
  CreateScheduledBlockDto, 
  UpdateScheduledBlockDto,
  ApplyTemplateDto 
} from '../types';
import { format, parseISO, startOfWeek, endOfWeek, addDays } from 'date-fns';

// Helper to convert numeric priority from backend to string for frontend
const convertPriorityToString = (priority: any): 'low' | 'medium' | 'high' | 'critical' => {
  if (typeof priority === 'string') return priority as 'low' | 'medium' | 'high' | 'critical';
  if (typeof priority === 'number') {
    if (priority <= 3) return 'low';
    if (priority <= 5) return 'medium';
    if (priority <= 7) return 'high';
    return 'critical';
  }
  return 'medium'; // default
};

const normalizeBlock = (block: any): ScheduledBlock => {
  // Auto-detect crosses_midnight if not provided by backend
  const startTime = block?.start_time ?? '';
  const endTime = block?.end_time ?? '';
  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  
  const crossesMidnight = block?.crosses_midnight !== undefined
    ? block.crosses_midnight
    : timeToMinutes(endTime) < timeToMinutes(startTime);

  return {
    ...block,
    priority: convertPriorityToString(block?.priority),
    crosses_midnight: crossesMidnight,
  };
};

interface ScheduledBlockState {
  blocks: ScheduledBlock[];
  selectedDate: string;
  weekStartDate: string;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSelectedDate: (date: string) => void;
  setWeekStartDate: (date: string) => void;
  fetchBlocksForDate: (date: string) => Promise<void>;
  fetchBlocksForWeek: (startDate: string) => Promise<void>;
  fetchBlocksForRange: (startDate: string, endDate: string) => Promise<void>;
  createBlock: (data: CreateScheduledBlockDto) => Promise<ScheduledBlock | null>;
  updateBlock: (id: string, data: UpdateScheduledBlockDto) => Promise<boolean>;
  deleteBlock: (id: string) => Promise<boolean>;
  applyTemplate: (data: ApplyTemplateDto) => Promise<boolean>;
  checkOverlaps: (date: string, startTime: string, endTime: string, excludeId?: string) => Promise<ScheduledBlock[]>;
  getBlocksForDate: (date: string) => ScheduledBlock[];
  clearError: () => void;
}

export const useScheduledBlockStore = create<ScheduledBlockState>((set, get) => ({
  blocks: [],
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  weekStartDate: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  isLoading: false,
  error: null,

  setSelectedDate: (date) => set({ selectedDate: date }),
  
  setWeekStartDate: (date) => set({ weekStartDate: date }),

  fetchBlocksForDate: async (date) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/blocks/date/${date}`);
      const newBlocks = (response?.data ?? []).map(normalizeBlock);
      
      set((state) => {
        // Merge with existing blocks, replacing those for the same date
        const otherBlocks = state.blocks.filter(b => b?.date !== date);
        return { blocks: [...otherBlocks, ...newBlocks], isLoading: false };
      });
    } catch (e: any) {
      console.error('[ScheduledBlockStore] fetchBlocksForDate error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to fetch blocks', isLoading: false });
    }
  },

  fetchBlocksForWeek: async (startDate) => {
    const endDate = format(addDays(parseISO(startDate), 6), 'yyyy-MM-dd');
    await get().fetchBlocksForRange(startDate, endDate);
  },

  fetchBlocksForRange: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/blocks/range', { 
        params: { start: startDate, end: endDate } 
      });
      const newBlocks = (response?.data ?? []).map(normalizeBlock);
      
      set((state) => {
        // Remove blocks in the range and add new ones
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        const otherBlocks = state.blocks.filter(b => {
          const blockDate = parseISO(b?.date ?? '');
          return blockDate < start || blockDate > end;
        });
        return { blocks: [...otherBlocks, ...newBlocks], isLoading: false };
      });
    } catch (e: any) {
      console.error('[ScheduledBlockStore] fetchBlocksForRange error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to fetch blocks', isLoading: false });
    }
  },

  createBlock: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/blocks', data);
      const newBlock = response?.data ? normalizeBlock(response.data) : null;
      if (newBlock) {
        set((state) => ({ 
          blocks: [...state.blocks, newBlock], 
          isLoading: false 
        }));
        return newBlock;
      }
      set({ isLoading: false });
      return null;
    } catch (e: any) {
      console.error('[ScheduledBlockStore] createBlock error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to create block', isLoading: false });
      return null;
    }
  },

  updateBlock: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/blocks/${id}`, data);
      const updatedBlock = response?.data ? normalizeBlock(response.data) : null;
      if (updatedBlock) {
        set((state) => ({
          blocks: state.blocks.map(b => b?.id === id ? updatedBlock : b),
          isLoading: false
        }));
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (e: any) {
      console.error('[ScheduledBlockStore] updateBlock error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to update block', isLoading: false });
      return false;
    }
  },

  deleteBlock: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/blocks/${id}`);
      set((state) => ({
        blocks: state.blocks.filter(b => b?.id !== id),
        isLoading: false
      }));
      return true;
    } catch (e: any) {
      console.error('[ScheduledBlockStore] deleteBlock error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to delete block', isLoading: false });
      return false;
    }
  },

  applyTemplate: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/blocks/apply-template', data);
      // Refresh the week after applying template
      await get().fetchBlocksForWeek(data.start_date);
      return true;
    } catch (e: any) {
      console.error('[ScheduledBlockStore] applyTemplate error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to apply template', isLoading: false });
      return false;
    }
  },

  checkOverlaps: async (date, startTime, endTime, excludeId) => {
    try {
      const response = await api.get('/blocks/check-overlaps', {
        params: { date, start_time: startTime, end_time: endTime, exclude_id: excludeId }
      });
      return (response?.data ?? []).map(normalizeBlock);
    } catch (e: any) {
      console.error('[ScheduledBlockStore] checkOverlaps error:', e?.message);
      return [];
    }
  },

  getBlocksForDate: (date) => {
    return get().blocks.filter(b => b?.date === date) ?? [];
  },

  clearError: () => set({ error: null })
}));
