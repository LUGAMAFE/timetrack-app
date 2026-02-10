import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCategoryStore } from '../stores/categoryStore';
import { CategoryCard } from '../components/CategoryCard';
import { CategoryModal } from './CategoryModal';
import { Category } from '../types';

export const CategoriesScreen: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { categories, fetchCategories, deleteCategory, isLoading } = useCategoryStore();

  useFocusEffect(useCallback(() => { fetchCategories(); }, []));

  const onRefresh = async () => { setRefreshing(true); await fetchCategories(); setRefreshing(false); };

  const handleEdit = (cat: Category) => { setEditCategory(cat); setModalVisible(true); };
  const handleAdd = () => { setEditCategory(null); setModalVisible(true); };

  const handleDelete = (cat: Category) => {
    if (cat?.is_default) { Alert.alert('Error', 'Cannot delete default categories'); return; }
    Alert.alert('Delete Category', `Delete "${cat?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(cat?.id ?? '') }
    ]);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">Categories</Text>
      </View>
      <FlatList
        data={categories ?? []}
        keyExtractor={(item) => item?.id ?? Math.random().toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => handleEdit(item)} onLongPress={() => handleDelete(item)}>
            <CategoryCard category={item} />
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Ionicons name="grid-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4">No categories yet</Text>
          </View>
        }
      />
      <Pressable onPress={handleAdd} className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg">
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
      <CategoryModal visible={modalVisible} onClose={() => setModalVisible(false)} editCategory={editCategory} />
    </SafeAreaView>
  );
};
