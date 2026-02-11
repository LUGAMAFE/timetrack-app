import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useThemeStore } from '../stores/themeStore';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ message, fullScreen = false }: LoadingSpinnerProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);

  if (!fullScreen) {
    return (
      <View style={styles.inline}>
        <ActivityIndicator size="small" color="#6200EE" />
        {message && (
          <Text style={[styles.message, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
            {message}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.fullScreen, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
      <ActivityIndicator size="large" color="#6200EE" />
      {message && (
        <Text style={[styles.message, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginLeft: 12,
    fontSize: 14,
  },
});
