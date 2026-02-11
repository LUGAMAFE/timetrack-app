import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, FAB, Portal, Menu, Button, Dialog } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { format, addDays, startOfWeek, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns';
import { useThemeStore } from '../stores/themeStore';
import { useScheduledBlockStore } from '../stores/scheduledBlockStore';
import { useTemplateStore } from '../stores/templateStore';
import { useGoalStore } from '../stores/goalStore';
import { TimeBlock } from '../components/blocks/TimeBlock';
import { TimeBlockEditorModal } from '../components/blocks/TimeBlockEditorModal';
import { GoalProgressBar } from '../components/goals/GoalProgressBar';
import type { ScheduledBlock, WeeklyTemplate } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PlanStackParamList } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DAY_WIDTH = (SCREEN_WIDTH - 80) / 7;
const HOUR_HEIGHT = 60; // Height per hour for proportional blocks
const START_HOUR = 0; // 12 AM
const END_HOUR = 24; // 12 AM next day

type ViewMode = '7day' | '3day' | '1day';

type NavigationProp = NativeStackNavigationProp<PlanStackParamList, 'WeeklyPlan'>;

// Helper: Convert "HH:mm" to minutes since midnight
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

// Helper: Calculate duration in minutes
function calculateDuration(startTime: string, endTime: string): number {
  let start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);
  
  // Handle midnight crossing
  if (end < start) {
    end += 24 * 60;
  }
  
  return end - start;
}

export function WeeklyPlanScreen() {
  const navigation = useNavigation<NavigationProp>();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const {
    blocks,
    weekStartDate,
    setWeekStartDate,
    fetchBlocksForWeek,
    isLoading: blocksLoading,
  } = useScheduledBlockStore();
  const { templates, fetchTemplates } = useTemplateStore();
  const { weeklyProgress, fetchWeeklyProgress } = useGoalStore();
  const { applyTemplate } = useScheduledBlockStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [editorVisible, setEditorVisible] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<ScheduledBlock | null>(null);
  const [templateMenuVisible, setTemplateMenuVisible] = useState(false);
  const [viewModeMenuVisible, setViewModeMenuVisible] = useState(false);
  const [applyDialogVisible, setApplyDialogVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WeeklyTemplate | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('7day');

  const weekStart = parseISO(weekStartDate);
  
  // Calculate days to show based on view mode
  const daysToShow = viewMode === '7day' ? 7 : viewMode === '3day' ? 3 : 1;
  const weekDays = Array.from({ length: daysToShow }, (_, i) => addDays(weekStart, i));

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [weekStartDate])
  );

  const loadData = async () => {
    await Promise.all([
      fetchBlocksForWeek(weekStartDate),
      fetchTemplates(),
      fetchWeeklyProgress(),
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handlePreviousWeek = () => {
    const newStart = format(subWeeks(weekStart, 1), 'yyyy-MM-dd');
    setWeekStartDate(newStart);
  };

  const handleNextWeek = () => {
    const newStart = format(addWeeks(weekStart, 1), 'yyyy-MM-dd');
    setWeekStartDate(newStart);
  };

  const handleToday = () => {
    const today = new Date();
    const newStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    setWeekStartDate(newStart);
  };

  const handleBlockPress = (block: ScheduledBlock) => {
    setSelectedBlock(block);
    setSelectedDate(block?.date ?? '');
    setEditorVisible(true);
  };

  const handleDayPress = (date: Date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'));
    setSelectedBlock(null);
    setEditorVisible(true);
  };

  const handleEditorClose = () => {
    setEditorVisible(false);
    setSelectedBlock(null);
    fetchBlocksForWeek(weekStartDate);
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate?.id) return;
    
    await applyTemplate({
      template_id: selectedTemplate.id,
      start_date: weekStartDate,
      clear_existing: false,
    });
    
    setApplyDialogVisible(false);
    setSelectedTemplate(null);
    await loadData();
  };

  const getBlocksForDay = (date: Date): ScheduledBlock[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return (blocks ?? []).filter((b) => b?.date === dateStr);
  };

  const isToday = (date: Date): boolean => isSameDay(date, new Date());

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}
      edges={['bottom']}
    >
      <Appbar.Header style={{ backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }}>
        <Appbar.Action icon="chevron-left" onPress={handlePreviousWeek} />
        <Appbar.Content
          title={`${format(weekStart, 'MMM d')} - ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`}
          titleStyle={styles.appbarTitle}
        />
        <Appbar.Action icon="chevron-right" onPress={handleNextWeek} />
        <Appbar.Action icon="calendar-today" onPress={handleToday} />
        <Menu
          visible={viewModeMenuVisible}
          onDismiss={() => setViewModeMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon={viewMode === '7day' ? 'view-week' : viewMode === '3day' ? 'view-day' : 'calendar-blank'}
              onPress={() => setViewModeMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setViewMode('7day');
              setViewModeMenuVisible(false);
            }}
            title="Week (7 days)"
            leadingIcon="view-week"
          />
          <Menu.Item
            onPress={() => {
              setViewMode('3day');
              setViewModeMenuVisible(false);
            }}
            title="3 Days"
            leadingIcon="view-day"
          />
          <Menu.Item
            onPress={() => {
              setViewMode('1day');
              setViewModeMenuVisible(false);
            }}
            title="Day"
            leadingIcon="calendar-blank"
          />
        </Menu>
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Week Days Header */}
        <View style={[styles.weekHeader, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
          {weekDays.map((day) => (
            <TouchableOpacity
              key={day.toISOString()}
              style={[
                styles.dayHeader,
                isToday(day) && styles.todayHeader,
              ]}
              onPress={() => handleDayPress(day)}
            >
              <Text
                style={[
                  styles.dayName,
                  { color: isDarkMode ? '#BBBBBB' : '#666666' },
                  isToday(day) && styles.todayText,
                ]}
              >
                {format(day, 'EEE')}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  { color: isDarkMode ? '#FFFFFF' : '#000000' },
                  isToday(day) && styles.todayText,
                ]}
              >
                {format(day, 'd')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Week Grid with Proportional Blocks */}
        <ScrollView horizontal style={styles.weekGridScrollView} showsHorizontalScrollIndicator={false}>
          <View style={styles.weekGrid}>
            {weekDays.map((day) => {
              const dayBlocks = getBlocksForDay(day);
              const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
              
              return (
                <View
                  key={day.toISOString()}
                  style={[
                    styles.dayColumn,
                    { 
                      borderColor: isDarkMode ? '#333333' : '#E0E0E0',
                      width: viewMode === '1day' ? SCREEN_WIDTH - 16 : viewMode === '3day' ? (SCREEN_WIDTH - 32) / 3 : undefined
                    },
                  ]}
                >
                  {/* Mini Timeline Background */}
                  <View style={[styles.miniTimeline, { height: totalHeight }]}>
                    {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.hourLine,
                          { 
                            top: i * HOUR_HEIGHT,
                            borderTopColor: isDarkMode ? '#2A2A2A' : '#F0F0F0'
                          }
                        ]}
                      />
                    ))}
                  </View>
                  
                  {/* Proportional Blocks */}
                  {dayBlocks.length === 0 ? (
                    <TouchableOpacity
                      style={[styles.emptyDay, { height: totalHeight }]}
                      onPress={() => handleDayPress(day)}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={32}
                        color={isDarkMode ? '#666666' : '#AAAAAA'}
                      />
                    </TouchableOpacity>
                  ) : (
                    dayBlocks.map((block) => {
                      const startMinutes = timeToMinutes(block?.start_time ?? '00:00');
                      const duration = calculateDuration(block?.start_time ?? '00:00', block?.end_time ?? '00:00');
                      const top = (startMinutes / 60) * HOUR_HEIGHT;
                      const height = (duration / 60) * HOUR_HEIGHT;
                      
                      return (
                        <TouchableOpacity
                          key={block?.id}
                          style={[
                            styles.proportionalBlock,
                            {
                              backgroundColor: (block?.category?.color ?? '#6200EE') + '40',
                              borderLeftColor: block?.category?.color ?? '#6200EE',
                              top,
                              height: Math.max(height, 20), // Minimum height
                            },
                          ]}
                          onPress={() => handleBlockPress(block)}
                        >
                          <Text
                            style={[styles.blockTime, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}
                            numberOfLines={1}
                          >
                            {block?.start_time ?? ''}
                          </Text>
                          {height > 30 && (
                            <Text
                              style={[styles.blockTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}
                              numberOfLines={height > 50 ? 2 : 1}
                            >
                              {block?.title ?? ''}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Weekly Progress */}
        {(weeklyProgress?.length ?? 0) > 0 && (
          <View style={[styles.progressSection, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
            <Text style={[styles.progressTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              Weekly Goal Progress
            </Text>
            {weeklyProgress.map((goal) => (
              <GoalProgressBar key={goal?.goal_id} goal={goal} />
            ))}
          </View>
        )}

        {/* Template Actions */}
        <View style={styles.actionSection}>
          <Button
            mode="outlined"
            icon="file-document-outline"
            onPress={() => setTemplateMenuVisible(true)}
            style={styles.actionButton}
          >
            Apply Template
          </Button>
          <Button
            mode="outlined"
            icon="calendar-month-outline"
            onPress={() => navigation.navigate('MonthlyOverview')}
            style={styles.actionButton}
          >
            Monthly View
          </Button>
          <Button
            mode="outlined"
            icon="view-list-outline"
            onPress={() => navigation.navigate('TemplateList')}
            style={styles.actionButton}
          >
            Manage Templates
          </Button>
        </View>
      </ScrollView>

      {/* Template Selection Menu */}
      <Portal>
        <Menu
          visible={templateMenuVisible}
          onDismiss={() => setTemplateMenuVisible(false)}
          anchor={{ x: SCREEN_WIDTH / 2, y: 100 }}
        >
          {(templates ?? []).length === 0 ? (
            <Menu.Item title="No templates available" disabled />
          ) : (
            (templates ?? []).map((template) => (
              <Menu.Item
                key={template?.id}
                title={template?.name ?? 'Untitled'}
                leadingIcon={template?.is_default ? 'star' : 'file-document-outline'}
                onPress={() => {
                  setSelectedTemplate(template);
                  setTemplateMenuVisible(false);
                  setApplyDialogVisible(true);
                }}
              />
            ))
          )}
        </Menu>
      </Portal>

      {/* Apply Template Dialog */}
      <Portal>
        <Dialog visible={applyDialogVisible} onDismiss={() => setApplyDialogVisible(false)}>
          <Dialog.Title>Apply Template</Dialog.Title>
          <Dialog.Content>
            <Text>Apply "{selectedTemplate?.name}" to the week of {format(weekStart, 'MMM d, yyyy')}?</Text>
            <Text style={styles.dialogWarning}>
              This will add blocks from the template. Existing blocks will be kept.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setApplyDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleApplyTemplate}>Apply</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: '#6200EE' }]}
        onPress={() => {
          setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
          setSelectedBlock(null);
          setEditorVisible(true);
        }}
        color="#FFFFFF"
      />

      {/* Block Editor Modal */}
      <TimeBlockEditorModal
        visible={editorVisible}
        onDismiss={handleEditorClose}
        block={selectedBlock}
        date={selectedDate || format(new Date(), 'yyyy-MM-dd')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appbarTitle: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  todayHeader: {
    backgroundColor: '#6200EE20',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '500',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  todayText: {
    color: '#6200EE',
  },
  weekGridScrollView: {
    paddingHorizontal: 8,
  },
  weekGrid: {
    flexDirection: 'row',
    minHeight: 400,
  },
  dayColumn: {
    flex: 1,
    borderRightWidth: 1,
    paddingHorizontal: 4,
    position: 'relative',
    minWidth: 80,
  },
  miniTimeline: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  hourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
  },
  emptyDay: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  proportionalBlock: {
    position: 'absolute',
    left: 4,
    right: 4,
    borderRadius: 6,
    padding: 6,
    borderLeftWidth: 4,
    zIndex: 10,
  },
  blockTime: {
    fontSize: 9,
    fontWeight: '600',
  },
  blockTitle: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  moreText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  progressSection: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  actionSection: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    borderColor: '#6200EE',
  },
  dialogWarning: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
  },
});
