import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  getDay,
  isToday,
  isSameDay,
} from 'date-fns';
import { useThemeStore } from '../stores/themeStore';
import { useScheduledBlockStore } from '../stores/scheduledBlockStore';
import { useGoalStore } from '../stores/goalStore';
import { GoalProgressBar } from '../components/goals/GoalProgressBar';

export function MonthlyOverviewScreen() {
  const navigation = useNavigation();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const { blocks, fetchBlocksForRange } = useScheduledBlockStore();
  const { monthlyProgress, fetchMonthlyProgress } = useGoalStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [currentMonth])
  );

  const loadData = async () => {
    await Promise.all([
      fetchBlocksForRange(
        format(monthStart, 'yyyy-MM-dd'),
        format(monthEnd, 'yyyy-MM-dd')
      ),
      fetchMonthlyProgress(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const getBlocksForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return (blocks ?? []).filter((b) => b?.date === dateStr);
  };

  const getDayCompletionRate = (date: Date): number => {
    const dayBlocks = getBlocksForDay(date);
    if (dayBlocks.length === 0) return -1; // No blocks
    const validated = dayBlocks.filter((b) => b?.validation).length;
    const completed = dayBlocks.filter((b) => b?.validation?.status === 'completed').length;
    if (validated === 0) return -1;
    return (completed / validated) * 100;
  };

  const getDayColor = (date: Date): string => {
    const rate = getDayCompletionRate(date);
    if (rate === -1) return 'transparent';
    if (rate >= 80) return '#4CAF5040';
    if (rate >= 50) return '#FF980040';
    return '#F4433640';
  };

  // Calculate starting offset for the first day of the month
  const startOffset = getDay(monthStart);
  const calendarDays = [
    ...Array(startOffset).fill(null),
    ...daysInMonth,
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}
      edges={['bottom']}
    >
      <Appbar.Header style={{ backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }}>
        <Appbar.Action icon="chevron-left" onPress={handlePreviousMonth} />
        <Appbar.Content
          title={format(currentMonth, 'MMMM yyyy')}
          titleStyle={styles.appbarTitle}
        />
        <Appbar.Action icon="chevron-right" onPress={handleNextMonth} />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Calendar Grid */}
        <Card style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
          <Card.Content>
            {/* Week days header */}
            <View style={styles.weekHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text
                  key={day}
                  style={[styles.weekDay, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}
                >
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar days */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }

                const dayBlocks = getBlocksForDay(day);
                const bgColor = getDayColor(day);
                const isTodayDate = isToday(day);

                return (
                  <TouchableOpacity
                    key={day.toISOString()}
                    style={[
                      styles.dayCell,
                      { backgroundColor: bgColor },
                      isTodayDate && styles.todayCell,
                    ]}
                    onPress={() => {
                      // Could navigate to daily view
                    }}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        { color: isDarkMode ? '#FFFFFF' : '#000000' },
                        isTodayDate && styles.todayText,
                      ]}
                    >
                      {format(day, 'd')}
                    </Text>
                    {dayBlocks.length > 0 && (
                      <View style={styles.blockIndicator}>
                        <Text style={styles.blockCount}>{dayBlocks.length}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card.Content>
        </Card>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF5040' }]} />
            <Text style={[styles.legendText, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
              80%+ completed
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF980040' }]} />
            <Text style={[styles.legendText, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
              50-80% completed
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F4433640' }]} />
            <Text style={[styles.legendText, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
              {'<50% completed'}
            </Text>
          </View>
        </View>

        {/* Monthly Goals Progress */}
        {(monthlyProgress?.length ?? 0) > 0 && (
          <Card style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
            <Card.Content>
              <Text style={[styles.cardTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                Monthly Goal Progress
              </Text>
              {monthlyProgress.map((goal) => (
                <GoalProgressBar key={goal?.goal_id} goal={goal} />
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Summary Stats */}
        <Card style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              Month Summary
            </Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  {(blocks ?? []).filter((b) =>
                    isSameMonth(new Date(b?.date ?? ''), currentMonth)
                  ).length}
                </Text>
                <Text style={[styles.summaryLabel, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                  Total Blocks
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                  {(blocks ?? []).filter(
                    (b) =>
                      isSameMonth(new Date(b?.date ?? ''), currentMonth) &&
                      b?.validation?.status === 'completed'
                  ).length}
                </Text>
                <Text style={[styles.summaryLabel, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                  Completed
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: '#F44336' }]}>
                  {(blocks ?? []).filter(
                    (b) =>
                      isSameMonth(new Date(b?.date ?? ''), currentMonth) &&
                      b?.validation?.status === 'omitted'
                  ).length}
                </Text>
                <Text style={[styles.summaryLabel, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                  Omitted
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appbarTitle: {
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: '#6200EE',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  todayText: {
    color: '#6200EE',
    fontWeight: '700',
  },
  blockIndicator: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: '#6200EE',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  blockCount: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});
