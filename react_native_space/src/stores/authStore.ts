import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: false,
  error: null,
  initialized: false,

  initialize: async () => {
    try {
      set({ isLoading: true });
      const { data } = await supabase.auth.getSession();
      set({ 
        session: data?.session ?? null, 
        user: data?.session?.user ?? null,
        initialized: true,
        isLoading: false 
      });

      supabase.auth.onAuthStateChange((_, session) => {
        set({ session, user: session?.user ?? null });
      });
    } catch (e) {
      set({ initialized: true, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }
      set({ isLoading: false });
      return true;
    } catch (e: any) {
      set({ error: e?.message || 'Login failed', isLoading: false });
      return false;
    }
  },

  signup: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }
      set({ isLoading: false });
      return true;
    } catch (e: any) {
      set({ error: e?.message || 'Signup failed', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ user: null, session: null, isLoading: false });
  },

  resetPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }
      set({ isLoading: false });
      return true;
    } catch (e: any) {
      set({ error: e?.message || 'Password reset failed', isLoading: false });
      return false;
    }
  },

  clearError: () => set({ error: null })
}));
