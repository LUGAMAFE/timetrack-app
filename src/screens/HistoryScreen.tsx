import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, SectionList, Pressable, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTimeEntryStore } from '../stores/timeEntryStore';
import { useCategoryStore } from '../stores/categoryStore';
import { TimeEntry } from '../types';
import { ManualEntryModal } from './ManualEntryModal';

export const HistoryScreen: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [refreshing, setRefreshing] = useState(false);
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { entries, fetchEntries, deleteEntry } = useTimeEntryStore();
  const { categories, fetchCategories } = useCategoryStore();

  const loadData = useCallback(async () => { await Promise.all([fetchEntries(currentMonth), fetchCategories()]); }, [currentMonth]);
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const changeMonth = (delta: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatMonth = (m: string) => {
    const [year, month] = m.split('-'); return new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const grouped = (entries ?? []).reduce<Record<string, TimeEntry[]>>((acc, e) => {
    const d = e?.date ?? 'unknown'; if (!acc[d]) acc[d] = []; acc[d].push(e); return acc;
  }, {});
  const sections = Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])).map(([title, data]) => ({ title, data }));

  const getCat = (id: string) => (categories ?? []).find(c => c?.id === id);

  const handleEdit = (e: TimeEntry) => { setEditEntry(e); setModalVisible(true); };
  const handleDelete = (e: TimeEntry) => {
    Alert.alert('Delete Entry', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteEntry(e?.id ?? ''); loadData(); } }
    ]);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="flex-row items-center justify-between px-4 py-3 bg-white dark:bg-gray-800">
        <Pressable onPress={() => changeMonth(-1)}><Ionicons name="chevron-back" size={24} color="#6366F1" /></Pressable>
        <Text className="text-lg font-semibold text-gray-900 dark:text-white">{formatMonth(currentMonth)}</Text>
        <Pressable onPress={() => changeMonth(1)}><Ionicons name="chevron-forward" size={24} color="#6366F1" /></Pressable>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item?.id ?? Math.random().toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderSectionHeader={({ section }) => <Text className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">{new Date(section.title + 'T00:00:00').toDateString()}</Text>}
        renderItem={({ item }) => {
          const cat = getCat(item?.category_id ?? '');
          const start = new Date(item?.start_time ?? 0); const end = new Date(item?.end_time ?? 0);
          return (
            <Pressable onPress={() => handleEdit(item)} onLongPress={() => handleDelete(item)} className="flex-row items-center bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <View style={{ backgroundColor: (cat?.color ?? '#6366F1') + '20' }} className="w-10 h-10 rounded-full items-center justify-center mr-3">
                <Ionicons name={(cat?.icon as any) ?? 'ellipse'} size={18} color={cat?.color ?? '#6366F1'} />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 dark:text-white font-medium">{cat?.name ?? 'Unknown'}</Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                {item?.notes && <Text className="text-gray-400 text-xs mt-1">{item.notes}</Text>}
              </View>
              <Text className="text-primary font-semibold">{((item?.duration_minutes ?? 0) / 60).toFixed(1)}h</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={<View className="items-center py-12"><Ionicons name="calendar-outline" size={48} color="#9CA3AF" /><Text className="text-gray-500 mt-4">No entries this month</Text></View>}
      />
      <ManualEntryModal visible={modalVisible} onClose={() => { setModalVisible(false); setEditEntry(null); loadData(); }} editEntry={editEntry} />
    </SafeAreaView>
  );
};
