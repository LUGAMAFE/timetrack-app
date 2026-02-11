import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, FAB, Searchbar, Chip, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../stores/themeStore';
import { useCategoryStore } from '../stores/categoryStore';
import { CategoryBadge } from '../components/common/CategoryBadge';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParamList, Category } from '../types';

type NavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'CategoriesMain'>;

export function CategoriesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const { categories, fetchCategories, isLoading } = useCategoryStore();
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [fetchCategories])
  );

  const filteredCategories = (categories ?? []).filter((cat) => {
    if (!cat) return false;
    const matchesSearch = !searchQuery || 
      cat.name?.toLowerCase?.()?.includes?.(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const renderItem = ({ item }: { item: Category }) => {
    if (!item) return null;
    
    return (
      <Pressable
        style={[styles.categoryCard, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}
        onPress={() => navigation.navigate('CategoryEditor', { categoryId: item.id })}
      >
        <View style={styles.categoryLeft}>
          <CategoryBadge category={item} size="medium" />
          <View style={styles.categoryInfo}>
            <Text style={[styles.categoryName, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              {item?.name ?? 'Unnamed'}
            </Text>
            <View style={styles.categoryMeta}>
              {item?.is_default && (
                <Chip compact style={styles.defaultChip}>
                  Default
                </Chip>
              )}
              {item?.monthly_goal_hours ? (
                <Text style={[styles.metaText, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                  Goal: {item.monthly_goal_hours}h/month
                </Text>
              ) : null}
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#666666' : '#CCCCCC'} />
      </Pressable>
    );
  };

  if (isLoading && (categories?.length ?? 0) === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}
      edges={['bottom']}
    >
      <View style={styles.header}>
        <Searchbar
          placeholder="Search categories"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchbar, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}
        />
      </View>

      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item?.id ?? Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color={isDarkMode ? '#666666' : '#CCCCCC'} />
            <Text style={[styles.emptyText, { color: isDarkMode ? '#666666' : '#999999' }]}>
              No categories found
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: '#6200EE' }]}
        onPress={() => navigation.navigate('CategoryEditor', {})}
        color="#FFFFFF"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  searchbar: {
    elevation: 0,
    borderRadius: 12,
  },
  list: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryInfo: {
    marginLeft: 12,
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  defaultChip: {
    height: 24,
  },
  metaText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
