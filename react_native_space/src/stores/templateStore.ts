import { create } from 'zustand';
import api from '../lib/api';
import { 
  WeeklyTemplate, 
  TemplateBlock, 
  CreateTemplateDto, 
  CreateTemplateBlockDto 
} from '../types';

interface TemplateState {
  templates: WeeklyTemplate[];
  selectedTemplate: WeeklyTemplate | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTemplates: () => Promise<void>;
  fetchTemplate: (id: string) => Promise<WeeklyTemplate | null>;
  createTemplate: (data: CreateTemplateDto) => Promise<WeeklyTemplate | null>;
  updateTemplate: (id: string, data: Partial<CreateTemplateDto>) => Promise<boolean>;
  deleteTemplate: (id: string) => Promise<boolean>;
  duplicateTemplate: (id: string) => Promise<WeeklyTemplate | null>;
  addBlockToTemplate: (templateId: string, data: CreateTemplateBlockDto) => Promise<TemplateBlock | null>;
  updateTemplateBlock: (blockId: string, data: Partial<CreateTemplateBlockDto>) => Promise<boolean>;
  deleteTemplateBlock: (blockId: string) => Promise<boolean>;
  setSelectedTemplate: (template: WeeklyTemplate | null) => void;
  getDefaultTemplate: () => WeeklyTemplate | undefined;
  clearError: () => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  selectedTemplate: null,
  isLoading: false,
  error: null,

  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/templates');
      set({ templates: response?.data ?? [], isLoading: false });
    } catch (e: any) {
      console.error('[TemplateStore] fetchTemplates error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to fetch templates', isLoading: false });
    }
  },

  fetchTemplate: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/templates/${id}`);
      const template = response?.data;
      set({ selectedTemplate: template ?? null, isLoading: false });
      return template ?? null;
    } catch (e: any) {
      console.error('[TemplateStore] fetchTemplate error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to fetch template', isLoading: false });
      return null;
    }
  },

  createTemplate: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/templates', data);
      const newTemplate = response?.data;
      if (newTemplate) {
        set((state) => ({ 
          templates: [...state.templates, newTemplate], 
          isLoading: false 
        }));
        return newTemplate;
      }
      set({ isLoading: false });
      return null;
    } catch (e: any) {
      console.error('[TemplateStore] createTemplate error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to create template', isLoading: false });
      return null;
    }
  },

  updateTemplate: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/templates/${id}`, data);
      const updatedTemplate = response?.data;
      if (updatedTemplate) {
        set((state) => ({
          templates: state.templates.map(t => t?.id === id ? { ...t, ...updatedTemplate } : t),
          selectedTemplate: state.selectedTemplate?.id === id 
            ? { ...state.selectedTemplate, ...updatedTemplate } 
            : state.selectedTemplate,
          isLoading: false
        }));
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (e: any) {
      console.error('[TemplateStore] updateTemplate error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to update template', isLoading: false });
      return false;
    }
  },

  deleteTemplate: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/templates/${id}`);
      set((state) => ({
        templates: state.templates.filter(t => t?.id !== id),
        selectedTemplate: state.selectedTemplate?.id === id ? null : state.selectedTemplate,
        isLoading: false
      }));
      return true;
    } catch (e: any) {
      console.error('[TemplateStore] deleteTemplate error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to delete template', isLoading: false });
      return false;
    }
  },

  duplicateTemplate: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/templates/${id}/duplicate`);
      const newTemplate = response?.data;
      if (newTemplate) {
        set((state) => ({ 
          templates: [...state.templates, newTemplate], 
          isLoading: false 
        }));
        return newTemplate;
      }
      set({ isLoading: false });
      return null;
    } catch (e: any) {
      console.error('[TemplateStore] duplicateTemplate error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to duplicate template', isLoading: false });
      return null;
    }
  },

  addBlockToTemplate: async (templateId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/templates/${templateId}/blocks`, data);
      const newBlock = response?.data;
      if (newBlock) {
        // Refresh the selected template to include the new block
        await get().fetchTemplate(templateId);
        return newBlock;
      }
      set({ isLoading: false });
      return null;
    } catch (e: any) {
      console.error('[TemplateStore] addBlockToTemplate error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to add block', isLoading: false });
      return null;
    }
  },

  updateTemplateBlock: async (blockId, data) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/templates/blocks/${blockId}`, data);
      // Refresh selected template if it contains this block
      const currentTemplate = get().selectedTemplate;
      if (currentTemplate?.id) {
        await get().fetchTemplate(currentTemplate.id);
      }
      return true;
    } catch (e: any) {
      console.error('[TemplateStore] updateTemplateBlock error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to update block', isLoading: false });
      return false;
    }
  },

  deleteTemplateBlock: async (blockId) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/templates/blocks/${blockId}`);
      // Update selected template locally
      set((state) => {
        if (state.selectedTemplate) {
          return {
            selectedTemplate: {
              ...state.selectedTemplate,
              blocks: (state.selectedTemplate.blocks ?? []).filter(b => b?.id !== blockId)
            },
            isLoading: false
          };
        }
        return { isLoading: false };
      });
      return true;
    } catch (e: any) {
      console.error('[TemplateStore] deleteTemplateBlock error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to delete block', isLoading: false });
      return false;
    }
  },

  setSelectedTemplate: (template) => set({ selectedTemplate: template }),

  getDefaultTemplate: () => {
    return get().templates.find(t => t?.is_default);
  },

  clearError: () => set({ error: null })
}));
