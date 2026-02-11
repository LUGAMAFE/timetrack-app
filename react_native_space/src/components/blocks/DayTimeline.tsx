import React, { useMemo } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';
import type { ScheduledBlock } from '../../types';
import { format } from 'date-fns';

interface DayTimelineProps {
  date: string;
  blocks: ScheduledBlock[];
  onBlockPress?: (block: ScheduledBlock) => void;
  onBlockLongPress?: (block: ScheduledBlock) => void;
  startHour?: number;
  endHour?: number;
}

const HOUR_HEIGHT = 60; // Altura por hora en píxeles
const HOUR_LABEL_WIDTH = 50;

// Convierte "HH:mm" a minutos desde medianoche
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

// Calcula la duración en minutos (maneja cruce de medianoche)
function calculateDuration(startTime: string, endTime: string, originalCrossesMidnight?: boolean): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  // CRITICAL: After splitting, the times are normalized (23:00-23:59 or 00:00-05:00)
  // So we MUST check actual time values, not the original flag
  const actuallyNeedsMidnightCalc = endMinutes < startMinutes;
  
  if (actuallyNeedsMidnightCalc) {
    // Cruza medianoche: (24:00 - start) + end
    return (1440 - startMinutes) + endMinutes;
  }
  return endMinutes - startMinutes;
}

// Detecta overlaps y asigna columnas a los bloques
interface PositionedBlock extends ScheduledBlock {
  top: number;
  height: number;
  column: number;
  totalColumns: number;
}

function positionBlocks(blocks: ScheduledBlock[], startHour: number): PositionedBlock[] {
  if (!blocks || blocks.length === 0) return [];

  const positioned: PositionedBlock[] = blocks.map(block => {
    const startMinutes = timeToMinutes(block?.start_time ?? '00:00');
    
    // DON'T pass crosses_midnight flag - let calculateDuration decide based on actual times
    const duration = calculateDuration(
      block?.start_time ?? '00:00', 
      block?.end_time ?? '00:00'
    );
    
    const top = ((startMinutes / 60) - startHour) * HOUR_HEIGHT;
    const height = Math.max((duration / 60) * HOUR_HEIGHT, 30); // Mínimo 30px

    return {
      ...block,
      top,
      height,
      column: 0,
      totalColumns: 1,
    };
  });

  // Detectar overlaps y asignar columnas
  positioned.sort((a, b) => a.top - b.top);

  for (let i = 0; i < positioned.length; i++) {
    const current = positioned[i];
    if (!current) continue;
    const overlapping = [];

    for (let j = 0; j < positioned.length; j++) {
      if (i === j) continue;
      const other = positioned[j];
      if (!other) continue;

      // Check if blocks overlap
      const currentEnd = current.top + current.height;
      const otherEnd = other.top + other.height;
      if (current.top < otherEnd && currentEnd > other.top) {
        overlapping.push(other);
      }
    }

    if (overlapping.length > 0) {
      const allBlocks = [current, ...overlapping];
      const usedColumns = new Set(allBlocks.map(b => b.column));
      let column = 0;
      while (usedColumns.has(column)) column++;
      current.column = column;
      current.totalColumns = Math.max(...allBlocks.map(b => b.column)) + 1;

      // Update totalColumns for all overlapping blocks
      overlapping.forEach(b => {
        b.totalColumns = current.totalColumns;
      });
    }
  }

  return positioned;
}

export function DayTimeline({
  date,
  blocks,
  onBlockPress,
  onBlockLongPress,
  startHour = 0,
  endHour = 24,
}: DayTimelineProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  
  const hours = useMemo(() => {
    const result = [];
    for (let h = startHour; h < endHour; h++) {
      result.push(h);
    }
    return result;
  }, [startHour, endHour]);

  const positionedBlocks = useMemo(() => {
    // Filter blocks for this specific date
    const sameDay = (blocks ?? []).filter(b => b?.date === date);
    
    // Also check for blocks from the PREVIOUS day that cross midnight
    const prevDate = new Date(date);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];
    
    const prevDayMidnightCrossers = (blocks ?? [])
      .filter(b => {
        if (b?.date !== prevDateStr) return false;
        const startMins = timeToMinutes(b?.start_time ?? '');
        const endMins = timeToMinutes(b?.end_time ?? '');
        // Crosses midnight if end_time < start_time OR crosses_midnight flag is true
        return b?.crosses_midnight === true || endMins < startMins;
      })
      .map(b => ({
        ...b,
        // Override times to show only the "next day" portion (00:00 to end_time)
        start_time: '00:00',
        // Keep original end_time (this is the portion after midnight)
        id: `${b.id}_continuation`, // Unique ID for this split view
        _isContinuation: true, // Mark as continuation
      }));
    
    // For blocks on THIS day that cross midnight, only show until 23:59
    const splitBlocks = sameDay.map(b => {
      const startMins = timeToMinutes(b?.start_time ?? '');
      const endMins = timeToMinutes(b?.end_time ?? '');
      const crossesMidnight = b?.crosses_midnight === true || endMins < startMins;
      
      if (crossesMidnight) {
        // Only show this day's portion: start_time to 23:59
        return {
          ...b,
          end_time: '23:59',
          _isFirstPart: true,
        };
      }
      return b;
    });
    
    const allBlocksForThisView = [...splitBlocks, ...prevDayMidnightCrossers];
    return positionBlocks(allBlocksForThisView as ScheduledBlock[], startHour);
  }, [blocks, date, startHour]);

  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();
  const isToday = format(new Date(), 'yyyy-MM-dd') === date;
  
  const currentTimePosition = isToday 
    ? (currentHour - startHour + currentMinute / 60) * HOUR_HEIGHT 
    : -1;

  if (positionedBlocks.length === 0) {
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

  const timelineHeight = (endHour - startHour) * HOUR_HEIGHT;

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { minHeight: timelineHeight + 40 }]}
      showsVerticalScrollIndicator={true}
    >
      <View style={[styles.timeline, { height: timelineHeight }]}>
        {/* Hour lines */}
        {hours.map((hour) => {
          const top = (hour - startHour) * HOUR_HEIGHT;
          return (
            <View key={hour} style={[styles.hourRow, { top }]}>
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
          );
        })}

        {/* Current time red line */}
        {isToday && currentTimePosition >= 0 && currentTimePosition <= timelineHeight && (
          <View style={[styles.currentTimeIndicator, { top: currentTimePosition }]}>
            <View style={styles.currentTimeDot} />
            <View style={styles.currentTimeLine} />
          </View>
        )}

        {/* Blocks positioned absolutely */}
        <View style={styles.blocksContainer}>
          {positionedBlocks.map((block) => {
            const blockWidth = block.totalColumns > 1 
              ? `${100 / block.totalColumns}%`
              : '100%';
            const blockLeft = block.totalColumns > 1
              ? `${(block.column * 100) / block.totalColumns}%`
              : 0;

            return (
              <TouchableOpacity
                key={block?.id ?? Math.random().toString()}
                onPress={() => onBlockPress?.(block)}
                onLongPress={() => onBlockLongPress?.(block)}
                style={[
                  styles.blockCard,
                  {
                    top: block.top,
                    height: block.height,
                    width: blockWidth,
                    left: blockLeft,
                    backgroundColor: block?.category?.color ?? '#6200EE',
                    borderLeftColor: block?.category?.color ?? '#6200EE',
                  },
                  // @ts-ignore - Custom property for split blocks
                  block._isContinuation && styles.continuationBlock,
                  // @ts-ignore
                  block._isFirstPart && styles.firstPartBlock,
                ]}
                activeOpacity={0.8}
              >
                <View style={styles.blockContent}>
                  {/* @ts-ignore */}
                  {block._isContinuation && (
                    <Text style={styles.continuationLabel}>↓ Continued</Text>
                  )}
                  <Text style={styles.blockTime} numberOfLines={1}>
                    {block?.start_time} - {block?.end_time}
                  </Text>
                  <Text style={styles.blockTitle} numberOfLines={1}>
                    {block?.title ?? 'Untitled'}
                  </Text>
                  {block.height > 60 && block?.notes && (
                    <Text style={styles.blockNotes} numberOfLines={2}>
                      {block.notes}
                    </Text>
                  )}
                  {/* @ts-ignore */}
                  {block._isFirstPart && (
                    <Text style={styles.continuesLabel}>Continues tomorrow ↓</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
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
    paddingBottom: 40,
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
  timeline: {
    position: 'relative',
    marginTop: 20,
  },
  hourRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: HOUR_HEIGHT,
  },
  hourLabel: {
    width: HOUR_LABEL_WIDTH,
    fontSize: 11,
    textAlign: 'right',
    paddingRight: 8,
    marginTop: -6,
    fontWeight: '500',
  },
  hourLine: {
    flex: 1,
    borderTopWidth: 1,
  },
  currentTimeIndicator: {
    position: 'absolute',
    left: HOUR_LABEL_WIDTH,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
  },
  currentTimeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F44336',
    marginLeft: -6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  currentTimeLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#F44336',
  },
  blocksContainer: {
    position: 'absolute',
    left: HOUR_LABEL_WIDTH + 8,
    right: 8,
    top: 0,
    bottom: 0,
  },
  blockCard: {
    position: 'absolute',
    borderRadius: 6,
    borderLeftWidth: 4,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    marginHorizontal: 2,
    opacity: 0.9,
  },
  blockContent: {
    flex: 1,
  },
  blockTime: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 2,
  },
  blockTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  blockNotes: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  continuationBlock: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderTopWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
  },
  firstPartBlock: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
  },
  continuationLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  continuesLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'center',
  },
});
