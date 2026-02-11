import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/themeStore';
import { CategoryBadge } from '../common/CategoryBadge';
import type { ScheduledBlock, ValidationStatus } from '../../types';

interface TimeBlockProps {
  block: ScheduledBlock;
  onPress?: () => void;
  onLongPress?: () => void;
  isCurrentBlock?: boolean;
  compact?: boolean;
}

export function TimeBlock({
  block,
  onPress,
  onLongPress,
  isCurrentBlock = false,
  compact = false,
}: TimeBlockProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  
  const validationStatus = block?.validation?.status;
  const isPast = isBlockPast(block);
  const isFuture = isBlockFuture(block);
  const needsValidation = isPast && !validationStatus;

  const getStatusColor = () => {
    if (isCurrentBlock) return '#6200EE';
    if (needsValidation) return '#FFC107';
    if (validationStatus === 'completed') return '#4CAF50';
    if (validationStatus === 'partial') return '#FF9800';
    if (validationStatus === 'omitted') return '#F44336';
    return block?.category?.color ?? '#6200EE';
  };

  const getStatusIcon = (): keyof typeof Ionicons.glyphMap | null => {
    if (needsValidation) return 'alert-circle';
    if (validationStatus === 'completed') return 'checkmark-circle';
    if (validationStatus === 'partial') return 'ellipse-outline';
    if (validationStatus === 'omitted') return 'close-circle';
    return null;
  };

  const statusColor = getStatusColor();
  const statusIcon = getStatusIcon();
  const categoryColor = block?.category?.color ?? '#6200EE';

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF',
          borderLeftColor: statusColor,
          borderLeftWidth: 4,
        },
        isCurrentBlock && styles.currentBlock,
        compact && styles.compact,
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
          {block?.start_time ?? '--:--'}
        </Text>
        <Text style={[styles.timeSeparator, { color: isDarkMode ? '#666666' : '#AAAAAA' }]}>
          -
        </Text>
        <Text style={[styles.timeText, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
          {block?.end_time ?? '--:--'}
        </Text>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <CategoryBadge category={block?.category} size="small" />
          <Text
            style={[
              styles.titleText,
              { color: isDarkMode ? '#FFFFFF' : '#000000' },
            ]}
            numberOfLines={1}
          >
            {block?.title ?? 'Untitled'}
          </Text>
        </View>

        {!compact && block?.notes && (
          <Text
            style={[styles.notesText, { color: isDarkMode ? '#AAAAAA' : '#888888' }]}
            numberOfLines={1}
          >
            {block.notes}
          </Text>
        )}

        <View style={styles.metaRow}>
          {block?.priority && block.priority !== 'medium' && (
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(block.priority) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.priorityText,
                  { color: getPriorityColor(block.priority) },
                ]}
              >
                {block.priority?.toUpperCase?.() ?? ''}
              </Text>
            </View>
          )}
          {block?.is_flexible && (
            <View style={styles.flexibleBadge}>
              <Ionicons name="swap-horizontal" size={12} color="#9C27B0" />
              <Text style={styles.flexibleText}>Flexible</Text>
            </View>
          )}
        </View>
      </View>

      {statusIcon && (
        <View style={styles.statusIconContainer}>
          <Ionicons name={statusIcon} size={24} color={statusColor} />
        </View>
      )}

      {isCurrentBlock && (
        <View style={styles.currentIndicator}>
          <Text style={styles.currentText}>NOW</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function isBlockPast(block?: ScheduledBlock | null): boolean {
  if (!block?.date || !block?.end_time) return false;
  const now = new Date();
  const blockDate = new Date(`${block.date}T${block.end_time}`);
  return blockDate < now;
}

function isBlockFuture(block?: ScheduledBlock | null): boolean {
  if (!block?.date || !block?.start_time) return false;
  const now = new Date();
  const blockDate = new Date(`${block.date}T${block.start_time}`);
  return blockDate > now;
}

function getPriorityColor(priority?: string): string {
  switch (priority) {
    case 'critical':
      return '#F44336';
    case 'high':
      return '#FF9800';
    case 'low':
      return '#4CAF50';
    default:
      return '#9E9E9E';
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  compact: {
    padding: 8,
    marginVertical: 4,
  },
  currentBlock: {
    borderWidth: 2,
    borderColor: '#6200EE',
  },
  timeContainer: {
    width: 60,
    marginRight: 12,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeSeparator: {
    fontSize: 10,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  notesText: {
    fontSize: 12,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  flexibleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#9C27B020',
    borderRadius: 4,
  },
  flexibleText: {
    fontSize: 10,
    color: '#9C27B0',
    marginLeft: 4,
  },
  statusIconContainer: {
    marginLeft: 8,
  },
  currentIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#6200EE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 8,
  },
  currentText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
