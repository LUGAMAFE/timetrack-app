import { create } from 'zustand';
import api from '../lib/api';
import { Category, CreateCategoryDto } from '../types';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  
  fetchCategories: () => Promise<void>;
  createCategory: (data: CreateCategoryDto) => Promise<Category | null>;
  updateCategory: (id: string, data: Partial<CreateCategoryDto>) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  seedDefaults: () => Promise<void>;
  clearError: () => void;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/categories');
      set({ categories: response?.data ?? [], isLoading: false });
    } catch (e: any) {
      console.error('[CategoryStore] fetchCategories error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to fetch categories', isLoading: false });
    }
  },

  createCategory: async (data) => {
    set({ isLoading: true, error: null });
    try {
      // Only send fields that backend accepts
      const payload = {
        name: data.name,
        icon: data.icon,
        color: data.color,
        monthly_goal_hours: data.monthly_goal_hours,
        monthly_limit_hours: data.monthly_limit_hours,
      };
      const response = await api.post('/categories', payload);
      const newCategory = response?.data;
      if (newCategory) {
        set((state) => ({ 
          categories: [...state.categories, newCategory], 
          isLoading: false 
        }));
        return newCategory;
      }
      set({ isLoading: false });
      return null;
    } catch (e: any) {
      console.error('[CategoryStore] createCategory error:', e?.message);
      const errorMsg = e?.response?.data?.message ?? 'Failed to create category';
      // Check for duplicate name constraint violation
      const isDuplicate = errorMsg?.includes?.('unique constraint') || errorMsg?.includes?.('already exists');
      const friendlyError = isDuplicate 
        ? `A category named "${data.name}" already exists. Please use a different name.`
        : errorMsg;
      set({ error: friendlyError, isLoading: false });
      return null;
    }
  },

  updateCategory: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      // Only send fields that backend accepts
      const payload: any = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.icon !== undefined) payload.icon = data.icon;
      if (data.color !== undefined) payload.color = data.color;
      if (data.monthly_goal_hours !== undefined) payload.monthly_goal_hours = data.monthly_goal_hours;
      if (data.monthly_limit_hours !== undefined) payload.monthly_limit_hours = data.monthly_limit_hours;
      
      const response = await api.put(`/categories/${id}`, payload);
      const updatedCategory = response?.data;
      if (updatedCategory) {
        set((state) => ({
          categories: state.categories.map(c => c?.id === id ? updatedCategory : c),
          isLoading: false
        }));
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (e: any) {
      console.error('[CategoryStore] updateCategory error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to update category', isLoading: false });
      return false;
    }
  },

  deleteCategory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/categories/${id}`);
      set((state) => ({
        categories: state.categories.filter(c => c?.id !== id),
        isLoading: false
      }));
      return true;
    } catch (e: any) {
      console.error('[CategoryStore] deleteCategory error:', e?.message);
      set({ error: e?.response?.data?.message ?? 'Failed to delete category', isLoading: false });
      return false;
    }
  },

  seedDefaults: async () => {
    try {
      // Check if user already has categories
      const response = await api.get('/categories');
      const existing = response?.data ?? [];
      
      if (existing.length > 0) {
        set({ categories: existing });
        return;
      }

      // Create default categories if none exist
      // Backend only accepts: name, icon, color, monthly_goal_hours, monthly_limit_hours
      const defaults = [
        { name: 'Work', icon: 'briefcase', color: '#2196F3' },
        { name: 'Exercise', icon: 'fitness', color: '#4CAF50' },
        { name: 'Learning', icon: 'book', color: '#9C27B0' },
        { name: 'Rest', icon: 'bed', color: '#795548' },
        { name: 'Social', icon: 'people', color: '#FF9800' },
      ];

      const newCategories: Category[] = [];
      for (const cat of defaults) {
        try {
          const res = await api.post('/categories', cat);
          if (res?.data) {
            newCategories.push(res.data);
          }
        } catch (err) {
          console.log('[CategoryStore] Error creating default category:', cat.name);
        }
      }

      set({ categories: newCategories });
    } catch (e: any) {
      console.error('[CategoryStore] seedDefaults error:', e?.message);
    }
  },

  clearError: () => set({ error: null })
}));
