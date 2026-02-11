import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCategoryStore } from '../stores/categoryStore';
import { Category } from '../types';

const ICONS = ['moon', 'fitness', 'briefcase', 'game-controller', 'paw', 'cash', 'book', 'heart', 'car', 'restaurant', 'musical-notes', 'camera'];
const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6', '#EF4444', '#3B82F6', '#F97316', '#84CC16'];

interface Props { visible: boolean; onClose: () => void; editCategory?: Category | null; }

export const CategoryModal: React.FC<Props> = ({ visible, onClose, editCategory }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('ellipse');
  const [color, setColor] = useState('#6366F1');
  const [goalHours, setGoalHours] = useState('');
  const [limitHours, setLimitHours] = useState('');
  const { createCategory, updateCategory, isLoading } = useCategoryStore();

  useEffect(() => {
    if (editCategory) {
      setName(editCategory?.name ?? ''); setIcon(editCategory?.icon ?? 'ellipse'); setColor(editCategory?.color ?? '#6366F1');
      setGoalHours(editCategory?.monthly_goal_hours?.toString() ?? ''); setLimitHours(editCategory?.monthly_limit_hours?.toString() ?? '');
    } else { setName(''); setIcon('ellipse'); setColor('#6366F1'); setGoalHours(''); setLimitHours(''); }
  }, [editCategory, visible]);

  const handleSave = async () => {
    if (!name?.trim()) { Alert.alert('Error', 'Name is required'); return; }
    const dto = { name: name.trim(), icon, color, monthly_goal_hours: goalHours ? Number(goalHours) : undefined, monthly_limit_hours: limitHours ? Number(limitHours) : undefined };
    const success = editCategory?.id ? await updateCategory(editCategory.id, dto) : await createCategory(dto);
    if (success) onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Pressable onPress={onClose}><Text className="text-red-500">Cancel</Text></Pressable>
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">{editCategory ? 'Edit' : 'New'} Category</Text>
          <Pressable onPress={handleSave}><Text className="text-primary font-semibold">{isLoading ? 'Saving...' : 'Save'}</Text></Pressable>
        </View>
        <ScrollView className="flex-1 px-4 py-4">
          <Text className="text-gray-700 dark:text-gray-300 mb-2">Name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Category name" placeholderTextColor="#9CA3AF" className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-4 rounded-lg mb-4" />
          <Text className="text-gray-700 dark:text-gray-300 mb-2">Icon</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {ICONS.map(i => <Pressable key={i} onPress={() => setIcon(i)} className={`w-12 h-12 rounded-lg items-center justify-center ${icon === i ? 'bg-primary' : 'bg-gray-100 dark:bg-gray-800'}`}><Ionicons name={i as any} size={24} color={icon === i ? 'white' : '#6B7280'} /></Pressable>)}
          </View>
          <Text className="text-gray-700 dark:text-gray-300 mb-2">Color</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {COLORS.map(c => <Pressable key={c} onPress={() => setColor(c)} style={{ backgroundColor: c }} className={`w-10 h-10 rounded-full ${color === c ? 'border-4 border-gray-900 dark:border-white' : ''}`} />)}
          </View>
          <Text className="text-gray-700 dark:text-gray-300 mb-2">Monthly Goal (hours)</Text>
          <TextInput value={goalHours} onChangeText={setGoalHours} placeholder="e.g. 20" keyboardType="numeric" placeholderTextColor="#9CA3AF" className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-4 rounded-lg mb-4" />
          <Text className="text-gray-700 dark:text-gray-300 mb-2">Monthly Limit (hours)</Text>
          <TextInput value={limitHours} onChangeText={setLimitHours} placeholder="e.g. 40" keyboardType="numeric" placeholderTextColor="#9CA3AF" className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-4 rounded-lg" />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
