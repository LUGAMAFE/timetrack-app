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

type NavigationProp = NativeStackNavigationProp<PlanStackParamList, 'WeeklyPlan'>;

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
  const [applyDialogVisible, setApplyDialogVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WeeklyTemplate | null>(null);

  const weekStart = parseISO(weekStartDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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

        {/* Week Grid */}
        <View style={styles.weekGrid}>
          {weekDays.map((day) => {
            const dayBlocks = getBlocksForDay(day);
            return (
              <View
                key={day.toISOString()}
                style={[
                  styles.dayColumn,
                  { borderColor: isDarkMode ? '#333333' : '#E0E0E0' },
                ]}
              >
                {dayBlocks.length === 0 ? (
                  <TouchableOpacity
                    style={styles.emptyDay}
                    onPress={() => handleDayPress(day)}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={24}
                      color={isDarkMode ? '#666666' : '#AAAAAA'}
                    />
                  </TouchableOpacity>
                ) : (
                  dayBlocks.slice(0, 5).map((block) => (
                    <TouchableOpacity
                      key={block?.id}
                      style={[
                        styles.miniBlock,
                        { backgroundColor: (block?.category?.color ?? '#6200EE') + '30' },
                      ]}
                      onPress={() => handleBlockPress(block)}
                    >
                      <View
                        style={[
                          styles.miniBlockIndicator,
                          { backgroundColor: block?.category?.color ?? '#6200EE' },
                        ]}
                      />
                      <Text
                        style={[styles.miniBlockTime, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}
                        numberOfLines={1}
                      >
                        {block?.start_time ?? ''}
                      </Text>
                      <Text
                        style={[styles.miniBlockTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}
                        numberOfLines={1}
                      >
                        {block?.title ?? ''}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
                {dayBlocks.length > 5 && (
                  <Text style={[styles.moreText, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                    +{dayBlocks.length - 5} more
                  </Text>
                )}
              </View>
            );
          })}
        </View>

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
  weekGrid: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    minHeight: 300,
  },
  dayColumn: {
    flex: 1,
    borderRightWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  emptyDay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
  },
  miniBlock: {
    marginVertical: 2,
    padding: 4,
    borderRadius: 6,
  },
  miniBlockIndicator: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    marginBottom: 2,
  },
  miniBlockTime: {
    fontSize: 9,
  },
  miniBlockTitle: {
    fontSize: 10,
    fontWeight: '500',
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
