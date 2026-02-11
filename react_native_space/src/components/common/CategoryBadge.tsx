import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Category } from '../../types';

interface CategoryBadgeProps {
  category?: Category | null;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export function CategoryBadge({ 
  category, 
  size = 'medium', 
  showLabel = false 
}: CategoryBadgeProps) {
  const color = category?.color ?? '#6200EE';
  const icon = (category?.icon ?? 'help-circle') as keyof typeof Ionicons.glyphMap;
  const name = category?.name ?? 'Unknown';

  const sizeMap = {
    small: { container: 24, icon: 14, text: 10 },
    medium: { container: 32, icon: 18, text: 12 },
    large: { container: 44, icon: 24, text: 14 },
  };

  const dimensions = sizeMap[size] ?? sizeMap.medium;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            width: dimensions.container,
            height: dimensions.container,
            borderRadius: dimensions.container / 2,
            backgroundColor: `${color}20`,
          },
        ]}
      >
        <Ionicons name={icon} size={dimensions.icon} color={color} />
      </View>
      {showLabel && (
        <Text
          style={[styles.label, { fontSize: dimensions.text, color }]}
          numberOfLines={1}
        >
          {name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    marginLeft: 8,
    fontWeight: '500',
  },
});
