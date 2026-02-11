import React, { useMemo } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';
import { TimeBlock } from './TimeBlock';
import type { ScheduledBlock } from '../../types';
import { format, parseISO, isWithinInterval, set } from 'date-fns';

interface DayTimelineProps {
  date: string;
  blocks: ScheduledBlock[];
  onBlockPress?: (block: ScheduledBlock) => void;
  onBlockLongPress?: (block: ScheduledBlock) => void;
  startHour?: number;
  endHour?: number;
}

const HOUR_HEIGHT = 80;

export function DayTimeline({
  date,
  blocks,
  onBlockPress,
  onBlockLongPress,
  startHour = 6,
  endHour = 23,
}: DayTimelineProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  
  const hours = useMemo(() => {
    const result = [];
    for (let h = startHour; h <= endHour; h++) {
      result.push(h);
    }
    return result;
  }, [startHour, endHour]);

  const sortedBlocks = useMemo(() => {
    return [...(blocks ?? [])]
      .filter(b => b?.date === date)
      .sort((a, b) => {
        const aTime = a?.start_time ?? '00:00';
        const bTime = b?.start_time ?? '00:00';
        return aTime.localeCompare(bTime);
      });
  }, [blocks, date]);

  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();
  const isToday = format(new Date(), 'yyyy-MM-dd') === date;

  const getCurrentBlock = (): ScheduledBlock | null => {
    if (!isToday) return null;
    const now = new Date();
    
    for (const block of sortedBlocks) {
      if (!block?.start_time || !block?.end_time || !block?.date) continue;
      
      const startParts = block.start_time.split(':');
      const endParts = block.end_time.split(':');
      
      const blockStart = set(parseISO(block.date), {
        hours: parseInt(startParts?.[0] ?? '0', 10),
        minutes: parseInt(startParts?.[1] ?? '0', 10),
      });
      const blockEnd = set(parseISO(block.date), {
        hours: parseInt(endParts?.[0] ?? '0', 10),
        minutes: parseInt(endParts?.[1] ?? '0', 10),
      });
      
      if (isWithinInterval(now, { start: blockStart, end: blockEnd })) {
        return block;
      }
    }
    return null;
  };

  const currentBlock = getCurrentBlock();
  const currentTimePosition = isToday 
    ? (currentHour - startHour) * HOUR_HEIGHT + (currentMinute / 60) * HOUR_HEIGHT 
    : -1;

  if (sortedBlocks.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FAFAFA' }]}>
        <Text style={[styles.emptyText, { color: isDarkMode ? '#AAAAAA' : '#888888' }]}>
          No blocks scheduled for this day
        </Text>
        <Text style={[styles.emptySubtext, { color: isDarkMode ? '#666666' : '#AAAAAA' }]}>
          Tap + to add a time block
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Timeline grid */}
      <View style={styles.timelineGrid}>
        {hours.map((hour) => (
          <View key={hour} style={[styles.hourRow, { height: HOUR_HEIGHT }]}>
            <Text style={[styles.hourLabel, { color: isDarkMode ? '#888888' : '#666666' }]}>
              {formatHour(hour)}
            </Text>
            <View 
              style={[
                styles.hourLine, 
                { borderTopColor: isDarkMode ? '#333333' : '#E0E0E0' }
              ]} 
            />
          </View>
        ))}
      </View>

      {/* Current time indicator */}
      {isToday && currentTimePosition >= 0 && (
        <View style={[styles.currentTimeIndicator, { top: currentTimePosition + 20 }]}>
          <View style={styles.currentTimeDot} />
          <View style={styles.currentTimeLine} />
        </View>
      )}

      {/* Blocks */}
      <View style={styles.blocksContainer}>
        {sortedBlocks.map((block) => (
          <TimeBlock
            key={block?.id ?? Math.random().toString()}
            block={block}
            onPress={() => onBlockPress?.(block)}
            onLongPress={() => onBlockLongPress?.(block)}
            isCurrentBlock={currentBlock?.id === block?.id}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    marginHorizontal: 16,
    borderRadius: 16,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  timelineGrid: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  hourLabel: {
    width: 50,
    fontSize: 12,
    textAlign: 'right',
    paddingRight: 8,
    marginTop: -6,
  },
  hourLine: {
    flex: 1,
    borderTopWidth: 1,
  },
  currentTimeIndicator: {
    position: 'absolute',
    left: 50,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  currentTimeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F44336',
    marginLeft: -5,
  },
  currentTimeLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#F44336',
  },
  blocksContainer: {
    marginTop: 20,
    marginLeft: 55,
    paddingRight: 16,
  },
});
