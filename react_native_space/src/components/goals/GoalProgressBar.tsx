import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/themeStore';
import type { GoalProgress } from '../../types';

interface GoalProgressBarProps {
  goal: GoalProgress;
  showDetails?: boolean;
}

export function GoalProgressBar({ goal, showDetails = true }: GoalProgressBarProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  
  const progress = Math.min((goal?.progress_percent ?? 0) / 100, 1);
  const isOnTrack = goal?.on_track ?? false;
  const isMaxGoal = goal?.goal_type === 'maximum';
  const isOverLimit = isMaxGoal && progress > 1;

  const getProgressColor = () => {
    if (isOverLimit) return '#F44336';
    if (isOnTrack) return '#4CAF50';
    return '#FF9800';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.categoryInfo}>
          <View
            style={[
              styles.colorDot,
              { backgroundColor: goal?.category_color ?? '#6200EE' },
            ]}
          />
          <Text
            style={[styles.categoryName, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}
            numberOfLines={1}
          >
            {goal?.category_name ?? 'Unknown'}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <Ionicons
            name={isOnTrack ? 'checkmark-circle' : 'alert-circle'}
            size={18}
            color={isOnTrack ? '#4CAF50' : '#FF9800'}
          />
        </View>
      </View>

      <ProgressBar
        progress={Math.min(progress, 1)}
        color={getProgressColor()}
        style={[
          styles.progressBar,
          { backgroundColor: isDarkMode ? '#333333' : '#E0E0E0' },
        ]}
      />

      {showDetails && (
        <View style={styles.detailsRow}>
          <Text style={[styles.detailText, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
            {goal?.completed_hours?.toFixed?.(1) ?? '0'} / {goal?.target_hours ?? 0}h
            {isMaxGoal ? ' max' : ''}
          </Text>
          <Text
            style={[
              styles.percentText,
              { color: getProgressColor() },
            ]}
          >
            {(goal?.progress_percent ?? 0).toFixed?.(0) ?? '0'}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusContainer: {
    marginLeft: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  detailText: {
    fontSize: 12,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
