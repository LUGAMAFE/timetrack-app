import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FAB, Portal, Modal, Text, Banner } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { useThemeStore } from '../stores/themeStore';
import { useScheduledBlockStore } from '../stores/scheduledBlockStore';
import { useValidationStore } from '../stores/validationStore';
import { useRuleStore } from '../stores/ruleStore';
import { useDashboardStore } from '../stores/dashboardStore';
import { DateNavigator } from '../components/common/DateNavigator';
import { StreakBadge } from '../components/common/StreakBadge';
import { DayTimeline } from '../components/blocks/DayTimeline';
import { TimeBlockEditorModal } from '../components/blocks/TimeBlockEditorModal';
import type { ScheduledBlock } from '../types';

export function DailyCommandScreen() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const { 
    selectedDate, 
    setSelectedDate, 
    blocks, 
    fetchBlocksForDate,
    isLoading: blocksLoading 
  } = useScheduledBlockStore();
  const { pendingBlocks, fetchPendingBlocks } = useValidationStore();
  const { violations, unacknowledgedCount, fetchViolations } = useRuleStore();
  const { streak, fetchStreak } = useDashboardStore();
  
  const [editorVisible, setEditorVisible] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<ScheduledBlock | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showViolationBanner, setShowViolationBanner] = useState(true);

  const todayBlocks = blocks.filter(b => b?.date === selectedDate) ?? [];
  const pendingCount = pendingBlocks?.length ?? 0;

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedDate])
  );

  const loadData = async () => {
    await Promise.all([
      fetchBlocksForDate(selectedDate),
      fetchPendingBlocks(),
      fetchViolations(),
      fetchStreak(),
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handleBlockPress = (block: ScheduledBlock) => {
    const isPast = isBlockPast(block);
    const hasValidation = !!block?.validation;
    
    if (isPast && !hasValidation) {
      // Navigate to validation or show validation modal
      // For now, just open editor
    }
    
    setSelectedBlock(block);
    setEditorVisible(true);
  };

  const handleBlockLongPress = (block: ScheduledBlock) => {
    setSelectedBlock(block);
    setEditorVisible(true);
  };

  const handleAddBlock = () => {
    setSelectedBlock(null);
    setEditorVisible(true);
  };

  const handleEditorClose = () => {
    setEditorVisible(false);
    setSelectedBlock(null);
    // Refresh blocks after edit
    fetchBlocksForDate(selectedDate);
  };

  const unacknowledgedViolations = violations.filter(v => !v?.acknowledged) ?? [];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              Command Center
            </Text>
            <StreakBadge streak={streak} size="small" />
          </View>
          <DateNavigator date={selectedDate} onDateChange={handleDateChange} />
        </View>
      </View>

      {/* Violation Banner */}
      {unacknowledgedCount > 0 && showViolationBanner && (
        <Banner
          visible={true}
          actions={[
            {
              label: 'View',
              onPress: () => {
                // Navigate to rules screen
              },
            },
            {
              label: 'Dismiss',
              onPress: () => setShowViolationBanner(false),
            },
          ]}
          icon={({ size }) => <Ionicons name="warning" size={size} color="#FF9800" />}
          style={styles.violationBanner}
        >
          You have {unacknowledgedCount} rule violation{unacknowledgedCount > 1 ? 's' : ''} to review
        </Banner>
      )}

      {/* Pending Validation Alert */}
      {pendingCount > 0 && (
        <View style={[styles.pendingAlert, { backgroundColor: '#FFC10720' }]}>
          <Ionicons name="alert-circle" size={20} color="#FF9800" />
          <Text style={styles.pendingText}>
            {pendingCount} block{pendingCount > 1 ? 's' : ''} pending validation
          </Text>
        </View>
      )}

      {/* Timeline */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <DayTimeline
          date={selectedDate}
          blocks={todayBlocks}
          onBlockPress={handleBlockPress}
          onBlockLongPress={handleBlockLongPress}
        />
      </ScrollView>

      {/* FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: '#6200EE' }]}
        onPress={handleAddBlock}
        color="#FFFFFF"
      />

      {/* Block Editor Modal */}
      <TimeBlockEditorModal
        visible={editorVisible}
        onDismiss={handleEditorClose}
        block={selectedBlock}
        date={selectedDate}
      />
    </SafeAreaView>
  );
}

function isBlockPast(block?: ScheduledBlock | null): boolean {
  if (!block?.date || !block?.end_time) return false;
  const now = new Date();
  const blockDate = new Date(`${block.date}T${block.end_time}`);
  return blockDate < now;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  violationBanner: {
    backgroundColor: '#FFF3E0',
  },
  pendingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  pendingText: {
    marginLeft: 8,
    color: '#FF9800',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
  },
});
