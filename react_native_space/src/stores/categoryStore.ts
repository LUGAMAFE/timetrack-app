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
      const res = await api.get('/api/categories');
      set({ categories: res?.data?.categories ?? [], isLoading: false });
    } catch (e: any) {
      set({ error: e?.message || 'Failed to fetch categories', isLoading: false });
    }
  },

  createCategory: async (dto) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/api/categories', dto);
      await get().fetchCategories();
      return true;
    } catch (e: any) {
      set({ error: e?.message || 'Failed to create category', isLoading: false });
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
      await api.post('/api/categories/seed-defaults');
      await get().fetchCategories();
    } catch (e) { /* ignore if already seeded */ }
  }
}));
