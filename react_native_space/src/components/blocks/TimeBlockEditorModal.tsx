import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Portal,
  Modal,
  Text,
  TextInput,
  Button,
  SegmentedButtons,
  Switch,
  Menu,
  Divider,
} from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';
import { useThemeStore } from '../../stores/themeStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useScheduledBlockStore } from '../../stores/scheduledBlockStore';
import { CategoryBadge } from '../common/CategoryBadge';
import type { ScheduledBlock, CreateScheduledBlockDto, Category } from '../../types';
import { format, parse } from 'date-fns';

interface TimeBlockEditorModalProps {
  visible: boolean;
  onDismiss: () => void;
  block?: ScheduledBlock | null;
  date: string;
}

export function TimeBlockEditorModal({
  visible,
  onDismiss,
  block,
  date,
}: TimeBlockEditorModalProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const { categories, fetchCategories } = useCategoryStore();
  const { createBlock, updateBlock, deleteBlock, isLoading } = useScheduledBlockStore();

  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [isFlexible, setIsFlexible] = useState(false);
  const [notes, setNotes] = useState('');
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!block?.id;

  useEffect(() => {
    if (visible) {
      fetchCategories();
      if (block) {
        setTitle(block.title ?? '');
        setSelectedCategory(block.category ?? null);
        setStartTime(block.start_time ?? '09:00');
        setEndTime(block.end_time ?? '10:00');
        setPriority(block.priority ?? 'medium');
        setIsFlexible(block.is_flexible ?? false);
        setNotes(block.notes ?? '');
      } else {
        resetForm();
      }
    }
  }, [visible, block]);

  const resetForm = () => {
    setTitle('');
    setSelectedCategory(null);
    setStartTime('09:00');
    setEndTime('10:00');
    setPriority('medium');
    setIsFlexible(false);
    setNotes('');
    setError('');
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!selectedCategory) {
      setError('Please select a category');
      return false;
    }
    // Allow end_time < start_time for blocks that cross midnight (e.g., 23:00 to 05:00)
    setError('');
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const data: CreateScheduledBlockDto = {
      category_id: selectedCategory?.id ?? '',
      title: title.trim(),
      date,
      start_time: startTime,
      end_time: endTime,
      priority,
      is_flexible: isFlexible,
      notes: notes.trim() || undefined,
    };

    let success = false;
    if (isEditing && block?.id) {
      success = await updateBlock(block.id, data);
    } else {
      const result = await createBlock(data);
      success = !!result;
    }

    if (success) {
      onDismiss();
    }
  };

  const handleDelete = async () => {
    if (block?.id) {
      const success = await deleteBlock(block.id);
      if (success) {
        onDismiss();
      }
    }
  };

  const handleStartTimeConfirm = ({ hours, minutes }: { hours: number; minutes: number }) => {
    setShowStartPicker(false);
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    setStartTime(timeString);
  };

  const handleEndTimeConfirm = ({ hours, minutes }: { hours: number; minutes: number }) => {
    setShowEndPicker(false);
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    setEndTime(timeString);
  };

  const getHoursAndMinutes = (time: string): { hours: number; minutes: number } => {
    const [hours, minutes] = time.split(':').map(Number);
    return { hours: hours ?? 0, minutes: minutes ?? 0 };
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              {isEditing ? 'Edit Block' : 'New Block'}
            </Text>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {/* Title */}
            <TextInput
              mode="outlined"
              label="Title"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              placeholder="What will you do?"
            />

            {/* Category Selector */}
            <Text style={[styles.label, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
              Category
            </Text>
            <Menu
              visible={categoryMenuVisible}
              onDismiss={() => setCategoryMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setCategoryMenuVisible(true)}
                  style={styles.categoryButton}
                  contentStyle={styles.categoryButtonContent}
                >
                  {selectedCategory ? (
                    <View style={styles.categoryPreview}>
                      <CategoryBadge category={selectedCategory} size="small" showLabel />
                    </View>
                  ) : (
                    'Select Category'
                  )}
                </Button>
              }
            >
              {(categories ?? []).map((cat) => (
                <Menu.Item
                  key={cat?.id}
                  onPress={() => {
                    setSelectedCategory(cat);
                    setCategoryMenuVisible(false);
                  }}
                  title={cat?.name ?? ''}
                  leadingIcon={() => <CategoryBadge category={cat} size="small" />}
                />
              ))}
            </Menu>

            {/* Time Selection */}
            <View style={styles.timeRow}>
              <View style={styles.timeColumn}>
                <Text style={[styles.label, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                  Start Time
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => setShowStartPicker(true)}
                  style={styles.timeButton}
                >
                  {startTime}
                </Button>
              </View>
              <View style={styles.timeColumn}>
                <Text style={[styles.label, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                  End Time
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => setShowEndPicker(true)}
                  style={styles.timeButton}
                >
                  {endTime}
                </Button>
              </View>
            </View>

            <TimePickerModal
              visible={showStartPicker}
              onDismiss={() => setShowStartPicker(false)}
              onConfirm={handleStartTimeConfirm}
              {...getHoursAndMinutes(startTime)}
              label="Select start time"
              cancelLabel="Cancel"
              confirmLabel="OK"
              animationType="fade"
              locale="en"
            />
            
            <TimePickerModal
              visible={showEndPicker}
              onDismiss={() => setShowEndPicker(false)}
              onConfirm={handleEndTimeConfirm}
              {...getHoursAndMinutes(endTime)}
              label="Select end time"
              cancelLabel="Cancel"
              confirmLabel="OK"
              animationType="fade"
              locale="en"
            />

            {/* Priority */}
            <Text style={[styles.label, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
              Priority
            </Text>
            <SegmentedButtons
              value={priority}
              onValueChange={(value) => setPriority(value as any)}
              buttons={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' },
              ]}
              style={styles.segmentedButtons}
            />

            {/* Flexible Toggle */}
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                Flexible timing
              </Text>
              <Switch value={isFlexible} onValueChange={setIsFlexible} />
            </View>

            {/* Notes */}
            <TextInput
              mode="outlined"
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <Divider style={styles.divider} />

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              {isEditing && (
                <Button
                  mode="outlined"
                  onPress={handleDelete}
                  textColor="#F44336"
                  style={styles.deleteButton}
                >
                  Delete
                </Button>
              )}
              <View style={styles.rightButtons}>
                <Button mode="text" onPress={onDismiss}>
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSave}
                  loading={isLoading}
                  style={styles.saveButton}
                >
                  {isEditing ? 'Update' : 'Create'}
                </Button>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    maxHeight: '90%',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  errorText: {
    color: '#F44336',
    marginBottom: 12,
    fontSize: 14,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  categoryButton: {
    marginBottom: 16,
  },
  categoryButtonContent: {
    justifyContent: 'flex-start',
    paddingVertical: 4,
  },
  categoryPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  timeColumn: {
    flex: 1,
  },
  timeButton: {
    marginTop: 4,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
  },
  divider: {
    marginVertical: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
    borderColor: '#F44336',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  saveButton: {
    marginLeft: 8,
    backgroundColor: '#6200EE',
  },
});
