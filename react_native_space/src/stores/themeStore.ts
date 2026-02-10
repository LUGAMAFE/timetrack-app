import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  isDarkMode: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  toggleDarkMode: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDarkMode: false,
  initialized: false,

  initialize: async () => {
    try {
      const value = await AsyncStorage.getItem('theme');
      set({ isDarkMode: value === 'dark', initialized: true });
    } catch (e) {
      set({ initialized: true });
    }
  },

  toggleDarkMode: async () => {
    const newValue = !get().isDarkMode;
    set({ isDarkMode: newValue });
    try {
      await AsyncStorage.setItem('theme', newValue ? 'dark' : 'light');
    } catch (e) { /* ignore */ }
  }
}));
