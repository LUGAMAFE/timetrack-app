import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, TextInput, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatePickerModal, TimePickerModal } from 'react-native-paper-dates';
import { useCategoryStore } from '../stores/categoryStore';
import { useTimeEntryStore } from '../stores/timeEntryStore';
import { Picker } from '@react-native-picker/picker';

interface Props {
  visible: boolean;
  onClose: () => void;
  editEntry?: any;
}

export const ManualEntryModal: React.FC<Props> = ({ visible, onClose, editEntry }) => {
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const { categories } = useCategoryStore();
  const { createEntry, updateEntry, isLoading } = useTimeEntryStore();

  useEffect(() => {
    if (editEntry) {
      setCategoryId(editEntry?.category_id ?? '');
      setDate(new Date(editEntry?.date ?? Date.now()));
      setStartTime(new Date(editEntry?.start_time ?? Date.now()));
      setEndTime(new Date(editEntry?.end_time ?? Date.now()));
      setNotes(editEntry?.notes ?? '');
    } else {
      setCategoryId('');
      setDate(new Date());
      setStartTime(new Date());
      setEndTime(new Date());
      setNotes('');
    }
  }, [editEntry, visible]);

  const handleSave = async () => {
    if (!categoryId) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    // Allow end_time <= start_time for blocks that cross midnight (e.g., sleep from 11 PM to 5 AM)

    const dateStr = date.toISOString().split('T')[0];
    const dto = {
      category_id: categoryId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      date: dateStr,
      notes: notes?.trim() || undefined
    };

    let success = false;
    if (editEntry?.id) {
      success = await updateEntry(editEntry.id, dto);
    } else {
      success = await createEntry(dto);
    }

    if (success) {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Pressable onPress={onClose}>
            <Text className="text-red-500 text-base">Cancel</Text>
          </Pressable>
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            {editEntry ? 'Edit Entry' : 'Add Entry'}
          </Text>
          <Pressable onPress={handleSave} disabled={isLoading}>
            <Text className="text-primary text-base font-semibold">{isLoading ? 'Saving...' : 'Save'}</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-4 py-4">
          <Text className="text-gray-700 dark:text-gray-300 mb-2">Category</Text>
          <View className="bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 overflow-hidden">
            <Picker selectedValue={categoryId} onValueChange={setCategoryId} style={{ color: '#111' }}>
              <Picker.Item label="Select Category" value="" />
              {(categories ?? []).map(cat => (
                <Picker.Item key={cat?.id} label={cat?.name ?? ''} value={cat?.id ?? ''} />
              ))}
            </Picker>
          </View>

          <Text className="text-gray-700 dark:text-gray-300 mb-2">Date</Text>
          <Pressable onPress={() => setShowDatePicker(true)} className="bg-gray-100 dark:bg-gray-800 px-4 py-4 rounded-lg mb-4">
            <Text className="text-gray-900 dark:text-white">{date.toDateString()}</Text>
          </Pressable>
          <DatePickerModal
            locale="en"
            mode="single"
            visible={showDatePicker}
            onDismiss={() => setShowDatePicker(false)}
            date={date}
            onConfirm={(params) => {
              setShowDatePicker(false);
              if (params?.date) setDate(params.date);
            }}
          />

          <Text className="text-gray-700 dark:text-gray-300 mb-2">Start Time</Text>
          <Pressable onPress={() => setShowStartPicker(true)} className="bg-gray-100 dark:bg-gray-800 px-4 py-4 rounded-lg mb-4">
            <Text className="text-gray-900 dark:text-white">{startTime.toLocaleTimeString()}</Text>
          </Pressable>
          <TimePickerModal
            visible={showStartPicker}
            onDismiss={() => setShowStartPicker(false)}
            onConfirm={({ hours, minutes }) => {
              setShowStartPicker(false);
              const newTime = new Date(startTime);
              newTime.setHours(hours);
              newTime.setMinutes(minutes);
              setStartTime(newTime);
            }}
            hours={startTime.getHours()}
            minutes={startTime.getMinutes()}
            label="Select start time"
            cancelLabel="Cancel"
            confirmLabel="OK"
            animationType="fade"
            locale="en"
          />

          <Text className="text-gray-700 dark:text-gray-300 mb-2">End Time</Text>
          <Pressable onPress={() => setShowEndPicker(true)} className="bg-gray-100 dark:bg-gray-800 px-4 py-4 rounded-lg mb-4">
            <Text className="text-gray-900 dark:text-white">{endTime.toLocaleTimeString()}</Text>
          </Pressable>
          <TimePickerModal
            visible={showEndPicker}
            onDismiss={() => setShowEndPicker(false)}
            onConfirm={({ hours, minutes }) => {
              setShowEndPicker(false);
              const newTime = new Date(endTime);
              newTime.setHours(hours);
              newTime.setMinutes(minutes);
              setEndTime(newTime);
            }}
            hours={endTime.getHours()}
            minutes={endTime.getMinutes()}
            label="Select end time"
            cancelLabel="Cancel"
            confirmLabel="OK"
            animationType="fade"
            locale="en"
          />

          <Text className="text-gray-700 dark:text-gray-300 mb-2">Notes (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes..."
            placeholderTextColor="#9CA3AF"
            multiline
            className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-4 rounded-lg min-h-[100px]"
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
