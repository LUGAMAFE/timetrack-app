import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category, CategoryBreakdown } from '../types';

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  moon: 'moon',
  fitness: 'fitness',
  briefcase: 'briefcase',
  'game-controller': 'game-controller',
  paw: 'paw',
  cash: 'cash',
  book: 'book',
  heart: 'heart',
  car: 'car',
  utensils: 'restaurant',
  music: 'musical-notes',
  camera: 'camera'
};

interface Props {
  category: Category | CategoryBreakdown;
  progress?: number;
  hoursLogged?: number;
  goalHours?: number;
  onPress?: () => void;
}

export const CategoryCard: React.FC<Props> = ({ category, progress, hoursLogged, goalHours, onPress }) => {
  const iconName = iconMap[category?.icon ?? ''] || 'ellipse';
  const color = category?.color ?? '#6366F1';

  return (
    <Pressable
      onPress={onPress}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 shadow-sm"
    >
      <View className="flex-row items-center mb-2">
        <View style={{ backgroundColor: color + '20' }} className="w-10 h-10 rounded-full items-center justify-center mr-3">
          <Ionicons name={iconName} size={20} color={color} />
        </View>
        <Text className="flex-1 text-base font-semibold text-gray-900 dark:text-white">
          {category?.name ?? 'Unknown'}
        </Text>
        {hoursLogged !== undefined && (
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {hoursLogged?.toFixed(1) ?? '0'}h {goalHours ? `/ ${goalHours}h` : ''}
          </Text>
        )}
      </View>
      {progress !== undefined && (
        <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <View
            style={{ width: `${Math.min(progress ?? 0, 100)}%`, backgroundColor: color }}
            className="h-full rounded-full"
          />
        </View>
      )}
    </Pressable>
  );
};
