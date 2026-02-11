import './global.css';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { Navigation } from './src/navigation';
import { useAuthStore } from './src/stores/authStore';
import { useThemeStore } from './src/stores/themeStore';
import { useCategoryStore } from './src/stores/categoryStore';

export default function App() {
  const initAuth = useAuthStore(s => s.initialize);
  const initTheme = useThemeStore(s => s.initialize);
  const seedDefaults = useCategoryStore(s => s.seedDefaults);
  const isDarkMode = useThemeStore(s => s.isDarkMode);
  const session = useAuthStore(s => s.session);

  useEffect(() => {
    initAuth();
    initTheme();
  }, []);

  useEffect(() => {
    if (session) seedDefaults();
  }, [session]);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PaperProvider>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />
            <Navigation />
          </PaperProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
