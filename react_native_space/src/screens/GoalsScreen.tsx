import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  SegmentedButtons,
  Card,
  FAB,
  Portal,
  Modal,
  TextInput,
  Button,
  Menu,
  IconButton,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useThemeStore } from '../stores/themeStore';
import { useGoalStore } from '../stores/goalStore';
import { useCategoryStore } from '../stores/categoryStore';
import { GoalProgressBar } from '../components/goals/GoalProgressBar';
import { CategoryBadge } from '../components/common/CategoryBadge';
import type { MonthlyGoal, Category } from '../types';

export function GoalsScreen() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const {
    monthlyGoals,
    monthlyProgress,
    dailyBudget,
    fetchMonthlyGoals,
    fetchMonthlyProgress,
    fetchDailyBudget,
    createMonthlyGoal,
    updateMonthlyGoal,
    deleteMonthlyGoal,
    isLoading,
  } = useGoalStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [tab, setTab] = useState<'goals' | 'budget'>('goals');
  const [refreshing, setRefreshing] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<MonthlyGoal | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [targetHours, setTargetHours] = useState('');
  const [goalType, setGoalType] = useState<'minimum' | 'maximum'>('minimum');
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    await Promise.all([
      fetchMonthlyGoals(),
      fetchMonthlyProgress(),
      fetchDailyBudget(),
      fetchCategories(),
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddGoal = () => {
    setEditingGoal(null);
    setSelectedCategory(null);
    setTargetHours('');
    setGoalType('minimum');
    setEditorVisible(true);
  };

  const handleEditGoal = (goal: MonthlyGoal) => {
    setEditingGoal(goal);
    const cat = categories.find(c => c?.id === goal?.category_id);
    setSelectedCategory(cat ?? null);
    setTargetHours(String(goal?.target_hours ?? ''));
    setGoalType(goal?.goal_type ?? 'minimum');
    setEditorVisible(true);
  };

  const handleSaveGoal = async () => {
    if (!selectedCategory?.id || !targetHours) return;

    const now = new Date();
    const data = {
      category_id: selectedCategory.id,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      target_hours: parseFloat(targetHours),
      goal_type: goalType,
    };

    let success = false;
    if (editingGoal?.id) {
      success = await updateMonthlyGoal(editingGoal.id, data);
    } else {
      success = await createMonthlyGoal(data);
    }

    if (success) {
      setEditorVisible(false);
      await loadData();
    }
  };

  const handleDeleteGoal = async () => {
    if (editingGoal?.id) {
      await deleteMonthlyGoal(editingGoal.id);
      setEditorVisible(false);
      await loadData();
    }
  };

  const usedCategoryIds = monthlyGoals.map(g => g?.category_id).filter(Boolean);
  const availableCategories = categories.filter(
    c => !usedCategoryIds.includes(c?.id ?? '') || c?.id === editingGoal?.category_id
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}
      edges={['bottom']}
    >
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={tab}
          onValueChange={(value) => setTab(value as 'goals' | 'budget')}
          buttons={[
            { value: 'goals', label: 'Monthly Goals' },
            { value: 'budget', label: 'Daily Budget' },
          ]}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {tab === 'goals' && (
          <>
            {/* Progress Section */}
            {(monthlyProgress?.length ?? 0) > 0 && (
              <Card style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
                <Card.Content>
                  <Text style={[styles.cardTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    This Month's Progress
                  </Text>
                  {monthlyProgress.map((goal) => (
                    <GoalProgressBar key={goal?.goal_id} goal={goal} />
                  ))}
                </Card.Content>
              </Card>
            )}

            {/* Goals List */}
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              Monthly Goals
            </Text>
            {(monthlyGoals ?? []).map((goal) => (
              <Card
                key={goal?.id}
                style={[styles.goalCard, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}
                onPress={() => handleEditGoal(goal)}
              >
                <Card.Content style={styles.goalContent}>
                  <CategoryBadge
                    category={categories.find(c => c?.id === goal?.category_id)}
                    size="medium"
                    showLabel
                  />
                  <View style={styles.goalInfo}>
                    <Text style={[styles.goalHours, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                      {goal?.target_hours ?? 0}h
                    </Text>
                    <Text style={[styles.goalType, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                      {goal?.goal_type === 'maximum' ? 'Maximum' : 'Minimum'}
                    </Text>
                  </View>
                  <IconButton icon="pencil" onPress={() => handleEditGoal(goal)} />
                </Card.Content>
              </Card>
            ))}

            {(monthlyGoals ?? []).length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                  No monthly goals set. Tap + to create one.
                </Text>
              </View>
            )}
          </>
        )}

        {tab === 'budget' && (
          <Card style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
            <Card.Content>
              <Text style={[styles.cardTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                Daily Time Budget
              </Text>
              <Text style={[styles.cardSubtitle, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                Hours per day needed to meet monthly goals
              </Text>
              {(dailyBudget ?? []).map((budget) => (
                <View key={budget?.category_id} style={styles.budgetRow}>
                  <View
                    style={[
                      styles.budgetDot,
                      { backgroundColor: budget?.category_color ?? '#6200EE' },
                    ]}
                  />
                  <Text
                    style={[styles.budgetCategory, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}
                  >
                    {budget?.category_name ?? 'Unknown'}
                  </Text>
                  <Text
                    style={[styles.budgetHours, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}
                  >
                    {(budget?.daily_hours_needed ?? 0).toFixed(1)}h/day
                  </Text>
                </View>
              ))}
              {(dailyBudget ?? []).length === 0 && (
                <Text style={[styles.emptyText, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                  Set monthly goals to see your daily budget
                </Text>
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: '#6200EE' }]}
        onPress={handleAddGoal}
        color="#FFFFFF"
      />

      {/* Goal Editor Modal */}
      <Portal>
        <Modal
          visible={editorVisible}
          onDismiss={() => setEditorVisible(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' },
          ]}
        >
          <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            {editingGoal ? 'Edit Goal' : 'New Monthly Goal'}
          </Text>

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
              >
                {selectedCategory ? (
                  <CategoryBadge category={selectedCategory} size="small" showLabel />
                ) : (
                  'Select Category'
                )}
              </Button>
            }
          >
            {availableCategories.map((cat) => (
              <Menu.Item
                key={cat?.id}
                onPress={() => {
                  setSelectedCategory(cat);
                  setCategoryMenuVisible(false);
                }}
                title={cat?.name ?? ''}
              />
            ))}
          </Menu>

          {/* Target Hours */}
          <TextInput
            mode="outlined"
            label="Target Hours"
            value={targetHours}
            onChangeText={setTargetHours}
            keyboardType="decimal-pad"
            style={styles.input}
          />

          {/* Goal Type */}
          <Text style={[styles.label, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
            Goal Type
          </Text>
          <SegmentedButtons
            value={goalType}
            onValueChange={(value) => setGoalType(value as 'minimum' | 'maximum')}
            buttons={[
              { value: 'minimum', label: 'Minimum' },
              { value: 'maximum', label: 'Maximum' },
            ]}
            style={styles.segmented}
          />

          <View style={styles.modalActions}>
            {editingGoal && (
              <Button
                mode="outlined"
                onPress={handleDeleteGoal}
                textColor="#F44336"
                style={styles.deleteButton}
              >
                Delete
              </Button>
            )}
            <View style={styles.rightActions}>
              <Button mode="text" onPress={() => setEditorVisible(false)}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveGoal}
                loading={isLoading}
                style={styles.saveButton}
              >
                Save
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  goalCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  goalContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalInfo: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 8,
  },
  goalHours: {
    fontSize: 18,
    fontWeight: '700',
  },
  goalType: {
    fontSize: 12,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  budgetDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  budgetCategory: {
    flex: 1,
    fontSize: 14,
  },
  budgetHours: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  categoryButton: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  segmented: {
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  deleteButton: {
    borderColor: '#F44336',
  },
  rightActions: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  saveButton: {
    marginLeft: 8,
    backgroundColor: '#6200EE',
  },
});
