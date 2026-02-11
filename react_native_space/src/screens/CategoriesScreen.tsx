import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FAB, Searchbar, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../stores/themeStore';
import { useCategoryStore } from '../stores/categoryStore';
import { CategoryBadge } from '../components/common/CategoryBadge';
import type { Category, SettingsStackParamList } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'Categories'>;

export function CategoriesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const { categories, fetchCategories, isLoading } = useCategoryStore();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  };

  const filteredCategories = (categories ?? []).filter((cat) => {
    const matchesSearch = (cat?.name ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !filterType || cat?.category_type === filterType;
    return matchesSearch && matchesType;
  });

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}
      onPress={() => navigation.navigate('CategoryEditor', { categoryId: item?.id })}
    >
      <View style={styles.categoryLeft}>
        <CategoryBadge category={item} size="large" />
        <View style={styles.categoryInfo}>
          <Text
            style={[styles.categoryName, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}
            numberOfLines={1}
          >
            {item?.name ?? 'Untitled'}
          </Text>
          <View style={styles.categoryMeta}>
            <Chip compact style={[styles.typeChip, { backgroundColor: item?.color + '20' }]}>
              {(item?.category_type ?? 'standard').toUpperCase()}
            </Chip>
            {item?.is_rest_category && (
              <Chip compact icon="sleep" style={styles.restChip}>
                Rest
              </Chip>
            )}
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#666666' : '#AAAAAA'} />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="folder-open-outline"
        size={64}
        color={isDarkMode ? '#666666' : '#AAAAAA'}
      />
      <Text style={[styles.emptyText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
        No categories yet
      </Text>
      <Text style={[styles.emptySubtext, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
        Create your first category to start planning
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}
      edges={['bottom']}
    >
      {/* Search Bar */}
      <Searchbar
        placeholder="Search categories"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={[styles.searchbar, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}
      />

      {/* Type Filters */}
      <View style={styles.filterRow}>
        <Chip
          selected={!filterType}
          onPress={() => setFilterType(null)}
          style={styles.filterChip}
        >
          All
        </Chip>
        <Chip
          selected={filterType === 'work'}
          onPress={() => setFilterType(filterType === 'work' ? null : 'work')}
          style={styles.filterChip}
        >
          Work
        </Chip>
        <Chip
          selected={filterType === 'personal'}
          onPress={() => setFilterType(filterType === 'personal' ? null : 'personal')}
          style={styles.filterChip}
        >
          Personal
        </Chip>
        <Chip
          selected={filterType === 'rest'}
          onPress={() => setFilterType(filterType === 'rest' ? null : 'rest')}
          style={styles.filterChip}
        >
          Rest
        </Chip>
      </View>

      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item?.id ?? Math.random().toString()}
        renderItem={renderCategory}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          filteredCategories.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
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
  searchbar: {
    margin: 16,
    borderRadius: 12,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  filterChip: {
    height: 32,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryInfo: {
    marginLeft: 16,
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryMeta: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 8,
  },
  typeChip: {
    height: 24,
  },
  restChip: {
    height: 24,
    backgroundColor: '#9C27B020',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
  },
});
