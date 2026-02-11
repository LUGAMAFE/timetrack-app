import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Appbar,
  FAB,
  Portal,
  Modal,
  TextInput,
  Button,
  Menu,
  SegmentedButtons,
  Switch,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parse } from 'date-fns';
import { useThemeStore } from '../stores/themeStore';
import { useTemplateStore } from '../stores/templateStore';
import { useCategoryStore } from '../stores/categoryStore';
import { CategoryBadge } from '../components/common/CategoryBadge';
import type { PlanStackParamList, TemplateBlock, CreateTemplateBlockDto, Category } from '../types';

type RouteProps = RouteProp<PlanStackParamList, 'TemplateEditor'>;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TemplateEditorScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const {
    selectedTemplate,
    fetchTemplate,
    updateTemplate,
    addBlockToTemplate,
    updateTemplateBlock,
    deleteTemplateBlock,
    isLoading,
  } = useTemplateStore();
  const { categories, fetchCategories } = useCategoryStore();

  const templateId = route.params?.templateId;
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TemplateBlock | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [isFlexible, setIsFlexible] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    if (templateId) {
      fetchTemplate(templateId);
      fetchCategories();
    }
  }, [templateId]);

  const handleAddBlock = (dayOfWeek: number) => {
    setEditingBlock(null);
    setSelectedDay(dayOfWeek);
    setSelectedCategory(null);
    setTitle('');
    setStartTime('09:00');
    setEndTime('10:00');
    setPriority('medium');
    setIsFlexible(false);
    setEditorVisible(true);
  };

  const handleEditBlock = (block: TemplateBlock) => {
    setEditingBlock(block);
    setSelectedDay(block?.day_of_week ?? 1);
    setSelectedCategory(categories.find(c => c?.id === block?.category_id) ?? null);
    setTitle(block?.title ?? '');
    setStartTime(block?.start_time ?? '09:00');
    setEndTime(block?.end_time ?? '10:00');
    setPriority(block?.priority ?? 'medium');
    setIsFlexible(block?.is_flexible ?? false);
    setEditorVisible(true);
  };

  const handleSaveBlock = async () => {
    if (!templateId || !selectedCategory?.id || !title.trim()) return;

    const data: CreateTemplateBlockDto = {
      category_id: selectedCategory.id,
      title: title.trim(),
      day_of_week: selectedDay,
      start_time: startTime,
      end_time: endTime,
      priority,
      is_flexible: isFlexible,
    };

    if (editingBlock?.id) {
      await updateTemplateBlock(editingBlock.id, data);
    } else {
      await addBlockToTemplate(templateId, data);
    }

    setEditorVisible(false);
  };

  const handleDeleteBlock = async () => {
    if (editingBlock?.id) {
      await deleteTemplateBlock(editingBlock.id);
      setEditorVisible(false);
    }
  };

  const handleTimeChange = (type: 'start' | 'end', event: any, date?: Date) => {
    if (type === 'start') setShowStartPicker(false);
    else setShowEndPicker(false);

    if (event.type === 'dismissed' || !date) return;

    const timeString = format(date, 'HH:mm');
    if (type === 'start') setStartTime(timeString);
    else setEndTime(timeString);
  };

  const parseTime = (time: string): Date => {
    return parse(time, 'HH:mm', new Date());
  };

  const getBlocksForDay = (dayOfWeek: number): TemplateBlock[] => {
    return ((selectedTemplate?.blocks ?? []) as TemplateBlock[])
      .filter(b => b?.day_of_week === dayOfWeek)
      .sort((a, b) => (a?.start_time ?? '').localeCompare(b?.start_time ?? ''));
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}
      edges={['bottom']}
    >
      <Appbar.Header style={{ backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={selectedTemplate?.name ?? 'Template'} />
      </Appbar.Header>

      <ScrollView style={styles.scrollView}>
        {DAYS.map((day, index) => (
          <View key={day} style={styles.daySection}>
            <View style={styles.dayHeader}>
              <Text style={[styles.dayTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                {day}
              </Text>
              <TouchableOpacity onPress={() => handleAddBlock(index)}>
                <Ionicons name="add-circle" size={28} color="#6200EE" />
              </TouchableOpacity>
            </View>

            {getBlocksForDay(index).length === 0 ? (
              <TouchableOpacity
                style={[styles.emptyDay, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}
                onPress={() => handleAddBlock(index)}
              >
                <Ionicons name="add" size={24} color={isDarkMode ? '#666666' : '#AAAAAA'} />
                <Text style={[styles.emptyText, { color: isDarkMode ? '#666666' : '#AAAAAA' }]}>
                  Add block
                </Text>
              </TouchableOpacity>
            ) : (
              getBlocksForDay(index).map((block) => (
                <TouchableOpacity
                  key={block?.id}
                  style={[
                    styles.blockCard,
                    { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' },
                  ]}
                  onPress={() => handleEditBlock(block)}
                >
                  <View
                    style={[
                      styles.blockIndicator,
                      { backgroundColor: categories.find(c => c?.id === block?.category_id)?.color ?? '#6200EE' },
                    ]}
                  />
                  <View style={styles.blockInfo}>
                    <Text style={[styles.blockTime, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                      {block?.start_time} - {block?.end_time}
                    </Text>
                    <Text
                      style={[styles.blockTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}
                      numberOfLines={1}
                    >
                      {block?.title ?? 'Untitled'}
                    </Text>
                  </View>
                  <CategoryBadge
                    category={categories.find(c => c?.id === block?.category_id)}
                    size="small"
                  />
                </TouchableOpacity>
              ))
            )}
          </View>
        ))}
      </ScrollView>

      {/* Block Editor Modal */}
      <Portal>
        <Modal
          visible={editorVisible}
          onDismiss={() => setEditorVisible(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' },
          ]}
        >
          <ScrollView>
            <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              {editingBlock ? 'Edit Block' : 'New Block'}
            </Text>

            <TextInput
              mode="outlined"
              label="Title"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />

            <Text style={[styles.label, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
              Day
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayPicker}>
              {DAYS.map((day, index) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayChip,
                    selectedDay === index && styles.dayChipSelected,
                  ]}
                  onPress={() => setSelectedDay(index)}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      selectedDay === index && styles.dayChipTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
              Category
            </Text>
            <Menu
              visible={categoryMenuVisible}
              onDismiss={() => setCategoryMenuVisible(false)}
              anchor={
                <Button mode="outlined" onPress={() => setCategoryMenuVisible(true)}>
                  {selectedCategory ? (
                    <CategoryBadge category={selectedCategory} size="small" showLabel />
                  ) : (
                    'Select Category'
                  )}
                </Button>
              }
            >
              {categories.map((cat) => (
                <Menu.Item
                  key={cat?.id}
                  onPress={() => {
                    setSelectedCategory(cat);
                    setCategoryMenuVisible(false);
                  }}
                  title={cat?.name ?? ''}
                />
              ))}
            </Menu>

            <View style={styles.timeRow}>
              <View style={styles.timeCol}>
                <Text style={[styles.label, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                  Start
                </Text>
                <Button mode="outlined" onPress={() => setShowStartPicker(true)}>
                  {startTime}
                </Button>
              </View>
              <View style={styles.timeCol}>
                <Text style={[styles.label, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                  End
                </Text>
                <Button mode="outlined" onPress={() => setShowEndPicker(true)}>
                  {endTime}
                </Button>
              </View>
            </View>

            {(showStartPicker || showEndPicker) && (
              <DateTimePicker
                value={parseTime(showStartPicker ? startTime : endTime)}
                mode="time"
                is24Hour={true}
                onChange={(e, d) => handleTimeChange(showStartPicker ? 'start' : 'end', e, d)}
              />
            )}

            <Text style={[styles.label, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
              Priority
            </Text>
            <SegmentedButtons
              value={priority}
              onValueChange={(v) => setPriority(v as any)}
              buttons={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Med' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Crit' },
              ]}
              style={styles.segmented}
            />

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                Flexible timing
              </Text>
              <Switch value={isFlexible} onValueChange={setIsFlexible} />
            </View>

            <View style={styles.modalActions}>
              {editingBlock && (
                <Button
                  mode="outlined"
                  onPress={handleDeleteBlock}
                  textColor="#F44336"
                  style={styles.deleteBtn}
                >
                  Delete
                </Button>
              )}
              <View style={styles.rightActions}>
                <Button mode="text" onPress={() => setEditorVisible(false)}>
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveBlock}
                  loading={isLoading}
                  style={styles.saveBtn}
                >
                  Save
                </Button>
              </View>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  daySection: {
    padding: 16,
    paddingBottom: 8,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyDay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#AAAAAA',
  },
  emptyText: {
    marginLeft: 8,
    fontSize: 14,
  },
  blockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  blockIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
  },
  blockInfo: {
    flex: 1,
  },
  blockTime: {
    fontSize: 12,
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 8,
  },
  dayPicker: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    marginRight: 8,
  },
  dayChipSelected: {
    backgroundColor: '#6200EE',
  },
  dayChipText: {
    color: '#666666',
  },
  dayChipTextSelected: {
    color: '#FFFFFF',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  timeCol: {
    flex: 1,
  },
  segmented: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  switchLabel: {
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  deleteBtn: {
    borderColor: '#F44336',
  },
  rightActions: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  saveBtn: {
    marginLeft: 8,
    backgroundColor: '#6200EE',
  },
});
