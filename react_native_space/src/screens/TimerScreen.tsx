import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTimerStore } from '../stores/timerStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useTimeEntryStore } from '../stores/timeEntryStore';
import { ManualEntryModal } from './ManualEntryModal';
import { Picker } from '@react-native-picker/picker';

export const TimerScreen: React.FC = () => {
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const { isRunning, isPaused, elapsedSeconds, selectedCategoryId, setSelectedCategory, startTimer, pauseTimer, resumeTimer, stopTimer, tick } = useTimerStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { createEntry } = useTimeEntryStore();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && !isPaused) {
      interval = setInterval(tick, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, isPaused]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStop = async () => {
    if (!selectedCategoryId) {
      Alert.alert('Error', 'Please select a category first');
      return;
    }
    const result = stopTimer();
    if (result?.startTime && result.elapsedSeconds > 0) {
      const startTime = result.startTime.toISOString();
      const endTime = result.endTime.toISOString();
      const date = result.startTime.toISOString().split('T')[0];
      await createEntry({ category_id: selectedCategoryId, start_time: startTime, end_time: endTime, date });
      Alert.alert('Success', 'Time entry saved!');
    }
  };

  const selectedCat = (categories ?? []).find(c => c?.id === selectedCategoryId);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="flex-1 items-center justify-center px-6">
        {/* Timer Display */}
        <View className="mb-8">
          <Text className="text-6xl font-mono font-bold text-gray-900 dark:text-white">
            {formatTime(elapsedSeconds)}
          </Text>
        </View>

        {/* Category Selector */}
        <View className="w-full bg-white dark:bg-gray-800 rounded-xl mb-8 overflow-hidden">
          <Picker
            selectedValue={selectedCategoryId ?? ''}
            onValueChange={(v) => setSelectedCategory(v || null)}
            style={{ color: '#111' }}
            enabled={!isRunning}
          >
            <Picker.Item label="Select Category" value="" />
            {(categories ?? []).map(cat => (
              <Picker.Item key={cat?.id} label={cat?.name ?? ''} value={cat?.id ?? ''} />
            ))}
          </Picker>
        </View>

        {selectedCat && (
          <View className="flex-row items-center mb-4">
            <View style={{ backgroundColor: (selectedCat?.color ?? '#6366F1') + '30' }} className="w-8 h-8 rounded-full items-center justify-center mr-2">
              <Ionicons name={(selectedCat?.icon as any) ?? 'ellipse'} size={16} color={selectedCat?.color ?? '#6366F1'} />
            </View>
            <Text className="text-gray-700 dark:text-gray-300">{selectedCat?.name ?? ''}</Text>
          </View>
        )}

        {/* Controls */}
        <View className="flex-row items-center space-x-4">
          {!isRunning ? (
            <Pressable
              onPress={startTimer}
              disabled={!selectedCategoryId}
              className="bg-green-500 w-20 h-20 rounded-full items-center justify-center"
              style={{ opacity: selectedCategoryId ? 1 : 0.5 }}
            >
              <Ionicons name="play" size={36} color="white" />
            </Pressable>
          ) : (
            <>
              <Pressable
                onPress={isPaused ? resumeTimer : pauseTimer}
                className="bg-yellow-500 w-16 h-16 rounded-full items-center justify-center"
              >
                <Ionicons name={isPaused ? 'play' : 'pause'} size={28} color="white" />
              </Pressable>
              <Pressable onPress={handleStop} className="bg-red-500 w-20 h-20 rounded-full items-center justify-center">
                <Ionicons name="stop" size={36} color="white" />
              </Pressable>
            </>
          )}
        </View>

        {/* Manual Entry Button */}
        <Pressable
          onPress={() => setManualModalVisible(true)}
          className="mt-8 flex-row items-center bg-white dark:bg-gray-800 px-6 py-3 rounded-full shadow"
        >
          <Ionicons name="add-circle-outline" size={20} color="#6366F1" />
          <Text className="ml-2 text-primary font-medium">Manual Entry</Text>
        </Pressable>
      </View>

      <ManualEntryModal visible={manualModalVisible} onClose={() => setManualModalVisible(false)} />
    </SafeAreaView>
  );
};
