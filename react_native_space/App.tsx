import './global.css';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { Navigation } from './src/navigation';
import { useAuthStore } from './src/stores/authStore';
import { useThemeStore } from './src/stores/themeStore';
import { useCategoryStore } from './src/stores/categoryStore';
import { useValidationStore } from './src/stores/validationStore';
import { useRuleStore } from './src/stores/ruleStore';
import { useDashboardStore } from './src/stores/dashboardStore';

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200EE',
    secondary: '#03DAC6',
    surface: '#FFFFFF',
    background: '#F5F5F5',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#BB86FC',
    secondary: '#03DAC6',
    surface: '#1E1E1E',
    background: '#121212',
  },
};

export default function App() {
  const initAuth = useAuthStore(s => s.initialize);
  const initTheme = useThemeStore(s => s.initialize);
  const seedDefaults = useCategoryStore(s => s.seedDefaults);
  const fetchPendingBlocks = useValidationStore(s => s.fetchPendingBlocks);
  const fetchOmissionReasons = useValidationStore(s => s.fetchOmissionReasons);
  const fetchViolations = useRuleStore(s => s.fetchViolations);
  const fetchStreak = useDashboardStore(s => s.fetchStreak);
  const isDarkMode = useThemeStore(s => s.isDarkMode);
  const session = useAuthStore(s => s.session);

  useEffect(() => {
    initAuth();
    initTheme();
  }, []);

  useEffect(() => {
    if (session) {
      // Load initial data when user is authenticated
      seedDefaults();
      fetchPendingBlocks();
      fetchOmissionReasons();
      fetchViolations();
      fetchStreak();
    }
  }, [session]);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PaperProvider theme={isDarkMode ? darkTheme : lightTheme}>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />
            <Navigation />
          </PaperProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
