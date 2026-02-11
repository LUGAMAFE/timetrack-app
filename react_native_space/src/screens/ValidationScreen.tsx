import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Button, Checkbox, Snackbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../stores/themeStore';
import { useValidationStore } from '../stores/validationStore';
import { ValidationCard } from '../components/validation/ValidationCard';
import type { PendingBlock, ValidationStatus } from '../types';

export function ValidationScreen() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const {
    pendingBlocks,
    omissionReasons,
    fetchPendingBlocks,
    fetchOmissionReasons,
    validateBlock,
    bulkValidate,
    isLoading,
  } = useValidationStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    await Promise.all([
      fetchPendingBlocks(),
      fetchOmissionReasons(),
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleValidate = async (
    blockId: string,
    status: ValidationStatus,
    data?: {
      completion_percent?: number;
      omission_reason_id?: string;
      notes?: string;
    }
  ) => {
    const success = await validateBlock({
      block_id: blockId,
      status,
      ...data,
    });

    if (success) {
      setSnackbarMessage('Block validated successfully');
      setSnackbarVisible(true);
    }
  };

  const handleBulkComplete = async () => {
    if (selectedIds.length === 0) return;
    
    const success = await bulkValidate(selectedIds, 'completed');
    if (success) {
      setSnackbarMessage(`${selectedIds.length} blocks marked as completed`);
      setSnackbarVisible(true);
      setSelectedIds([]);
      setBulkMode(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pendingBlocks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingBlocks.map((b) => b?.id ?? '').filter(Boolean));
    }
  };

  const renderItem = ({ item }: { item: PendingBlock }) => (
    <View style={styles.itemContainer}>
      {bulkMode && (
        <Checkbox
          status={selectedIds.includes(item?.id ?? '') ? 'checked' : 'unchecked'}
          onPress={() => toggleSelection(item?.id ?? '')}
          color="#6200EE"
        />
      )}
      <View style={styles.cardWrapper}>
        <ValidationCard
          block={item}
          omissionReasons={omissionReasons}
          onValidate={handleValidate}
          isLoading={isLoading}
        />
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="checkmark-done-circle-outline"
        size={80}
        color={isDarkMode ? '#4CAF50' : '#4CAF50'}
      />
      <Text style={[styles.emptyTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
        All caught up!
      </Text>
      <Text style={[styles.emptySubtitle, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
        No blocks pending validation
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={[styles.headerInfo, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
      <Text style={[styles.headerTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
        Pending Validation
      </Text>
      <Text style={[styles.headerSubtitle, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
        {pendingBlocks.length} block{pendingBlocks.length !== 1 ? 's' : ''} need your review
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}
      edges={['top']}
    >
      <Appbar.Header style={{ backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }}>
        <Appbar.Content title="Validate" />
        {pendingBlocks.length > 0 && (
          <>
            <Appbar.Action
              icon={bulkMode ? 'close' : 'checkbox-multiple-outline'}
              onPress={() => {
                setBulkMode(!bulkMode);
                setSelectedIds([]);
              }}
            />
            {bulkMode && (
              <Appbar.Action
                icon={selectedIds.length === pendingBlocks.length ? 'checkbox-blank-outline' : 'checkbox-marked-outline'}
                onPress={toggleSelectAll}
              />
            )}
          </>
        )}
      </Appbar.Header>

      <FlatList
        data={pendingBlocks}
        keyExtractor={(item) => item?.id ?? Math.random().toString()}
        renderItem={renderItem}
        ListHeaderComponent={pendingBlocks.length > 0 ? renderHeader : null}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          pendingBlocks.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />

      {/* Bulk Action Bar */}
      {bulkMode && selectedIds.length > 0 && (
        <View style={[styles.bulkBar, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
          <Text style={[styles.bulkText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            {selectedIds.length} selected
          </Text>
          <Button
            mode="contained"
            onPress={handleBulkComplete}
            loading={isLoading}
            icon="check-all"
            style={styles.bulkButton}
          >
            Mark Complete
          </Button>
        </View>
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
  },
  headerInfo: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardWrapper: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
  },
  emptySubtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  bulkBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  bulkText: {
    fontSize: 16,
    fontWeight: '500',
  },
  bulkButton: {
    backgroundColor: '#4CAF50',
  },
});
