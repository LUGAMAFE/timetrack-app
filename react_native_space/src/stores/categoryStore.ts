import { create } from 'zustand';
import api from '../lib/api';
import { Category, CreateCategoryDto } from '../types';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  createCategory: (dto: CreateCategoryDto) => Promise<boolean>;
  updateCategory: (id: string, dto: Partial<CreateCategoryDto>) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  seedDefaults: () => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('[CategoryStore] Fetching categories...');
      const res = await api.get('/api/categories');
      console.log('[CategoryStore] Fetched:', res?.data);
      set({ categories: res?.data?.categories ?? [], isLoading: false });
    } catch (e: any) {
      console.log('[CategoryStore] Fetch error:', e?.response?.data || e?.message);
      set({ error: e?.message || 'Failed to fetch categories', isLoading: false });
    }
  },

  createCategory: async (dto) => {
    set({ isLoading: true, error: null });
    try {
      console.log('[CategoryStore] Creating category:', dto);
      const response = await api.post('/api/categories', dto);
      console.log('[CategoryStore] Create response:', response?.data);
      await get().fetchCategories();
      return true;
    } catch (e: any) {
      console.log('[CategoryStore] Create error:', e?.response?.data || e?.message);
      set({ error: e?.response?.data?.message || e?.message || 'Failed to create category', isLoading: false });
      return false;
    }
  },

  updateCategory: async (id, dto) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/api/categories/${id}`, dto);
      await get().fetchCategories();
      return true;
    } catch (e: any) {
      set({ error: e?.message || 'Failed to update category', isLoading: false });
      return false;
    }
  },

  deleteCategory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/categories/${id}`);
      await get().fetchCategories();
      return true;
    } catch (e: any) {
      set({ error: e?.message || 'Failed to delete category', isLoading: false });
      return false;
    }
  },

  seedDefaults: async () => {
    try {
      console.log('[CategoryStore] Seeding defaults...');
      const res = await api.post('/api/categories/seed-defaults');
      console.log('[CategoryStore] Seed response:', res?.data);
      await get().fetchCategories();
    } catch (e: any) {
      console.log('[CategoryStore] Seed error:', e?.response?.data || e?.message);
      // ignore if already seeded
    }
  }
}));
