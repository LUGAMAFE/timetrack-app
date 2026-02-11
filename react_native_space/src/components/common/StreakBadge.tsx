import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { StreakData } from '../../types';

interface StreakBadgeProps {
  streak?: StreakData | null;
  size?: 'small' | 'medium' | 'large';
}

export function StreakBadge({ streak, size = 'medium' }: StreakBadgeProps) {
  const currentStreak = streak?.current_streak ?? 0;
  const isActive = currentStreak > 0;

  const sizeMap = {
    small: { container: 40, icon: 16, text: 12 },
    medium: { container: 50, icon: 20, text: 14 },
    large: { container: 60, icon: 24, text: 16 },
  };

  const dimensions = sizeMap[size] ?? sizeMap.medium;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          {
            width: dimensions.container,
            height: dimensions.container,
            borderRadius: dimensions.container / 2,
            backgroundColor: isActive ? '#FF6B0020' : '#66666620',
          },
        ]}
      >
        <Ionicons
          name={isActive ? 'flame' : 'flame-outline'}
          size={dimensions.icon}
          color={isActive ? '#FF6B00' : '#666666'}
        />
      </View>
      <Text
        style={[
          styles.streakText,
          {
            fontSize: dimensions.text,
            color: isActive ? '#FF6B00' : '#666666',
          },
        ]}
      >
        {currentStreak}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakText: {
    fontWeight: '700',
    marginTop: 4,
  },
});
