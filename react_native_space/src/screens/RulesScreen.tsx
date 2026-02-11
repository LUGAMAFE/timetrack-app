import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  FAB,
  Button,
  Portal,
  Modal,
  TextInput,
  Menu,
  Switch,
  IconButton,
  SegmentedButtons,
  List,
  Chip,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';
import { useThemeStore } from '../stores/themeStore';
import { useRuleStore } from '../stores/ruleStore';
import { useCategoryStore } from '../stores/categoryStore';
import { CategoryBadge } from '../components/common/CategoryBadge';
import type { RestRule, UsageLimit, RoutineViolation, Category } from '../types';

export function RulesScreen() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const {
    restRules,
    usageLimits,
    violations,
    fetchRestRules,
    fetchUsageLimits,
    fetchViolations,
    createRestRule,
    deleteRestRule,
    createUsageLimit,
    deleteUsageLimit,
    acknowledgeViolation,
    isLoading,
  } = useRuleStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [tab, setTab] = useState<'rest' | 'limits' | 'violations'>('rest');
  const [refreshing, setRefreshing] = useState(false);
  const [restModalVisible, setRestModalVisible] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [restCategory, setRestCategory] = useState<Category | null>(null);
  const [afterMinutes, setAfterMinutes] = useState('60');
  const [restDuration, setRestDuration] = useState('15');
  const [isMandatory, setIsMandatory] = useState(true);
  const [limitType, setLimitType] = useState<'continuous' | 'daily' | 'weekly'>('continuous');
  const [maxMinutes, setMaxMinutes] = useState('120');
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [restCategoryMenuVisible, setRestCategoryMenuVisible] = useState(false);

  const unacknowledgedViolations = (violations ?? []).filter(v => !v?.acknowledged);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    await Promise.all([
      fetchRestRules(),
      fetchUsageLimits(),
      fetchViolations(),
      fetchCategories(),
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateRestRule = async () => {
    if (!selectedCategory?.id) return;

    await createRestRule({
      category_id: selectedCategory.id,
      rest_category_id: restCategory?.id,
      after_minutes: parseInt(afterMinutes, 10),
      rest_duration_minutes: parseInt(restDuration, 10),
      is_mandatory: isMandatory,
    });

    setRestModalVisible(false);
    resetForm();
    await loadData();
  };

  const handleCreateUsageLimit = async () => {
    if (!selectedCategory?.id) return;

    await createUsageLimit({
      category_id: selectedCategory.id,
      limit_type: limitType,
      max_minutes: parseInt(maxMinutes, 10),
    });

    setLimitModalVisible(false);
    resetForm();
    await loadData();
  };

  const handleDeleteRestRule = async (id: string) => {
    await deleteRestRule(id);
  };

  const handleDeleteUsageLimit = async (id: string) => {
    await deleteUsageLimit(id);
  };

  const handleAcknowledge = async (id: string) => {
    await acknowledgeViolation(id);
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setRestCategory(null);
    setAfterMinutes('60');
    setRestDuration('15');
    setIsMandatory(true);
    setLimitType('continuous');
    setMaxMinutes('120');
  };

  const getCategoryById = (id?: string): Category | undefined => {
    return categories.find(c => c?.id === id);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}
      edges={['bottom']}
    >
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={tab}
          onValueChange={(value) => setTab(value as any)}
          buttons={[
            { value: 'rest', label: 'Rest Rules' },
            { value: 'limits', label: 'Limits' },
            {
              value: 'violations',
              label: `Violations${unacknowledgedViolations.length > 0 ? ` (${unacknowledgedViolations.length})` : ''}`,
            },
          ]}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {tab === 'rest' && (
          <>
            <Text style={[styles.description, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
              Rest rules require a break after using certain categories
            </Text>
            {(restRules ?? []).map((rule) => (
              <Card
                key={rule?.id}
                style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}
              >
                <Card.Content style={styles.ruleContent}>
                  <CategoryBadge category={getCategoryById(rule?.category_id)} size="medium" />
                  <View style={styles.ruleInfo}>
                    <Text style={[styles.ruleText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                      After {rule?.after_minutes ?? 0} min, rest {rule?.rest_duration_minutes ?? 0} min
                    </Text>
                    <Chip compact style={rule?.is_mandatory ? styles.mandatoryChip : styles.suggestedChip}>
                      {rule?.is_mandatory ? 'Mandatory' : 'Suggested'}
                    </Chip>
                  </View>
                  <IconButton
                    icon="delete"
                    iconColor="#F44336"
                    onPress={() => handleDeleteRestRule(rule?.id ?? '')}
                  />
                </Card.Content>
              </Card>
            ))}
            {(restRules ?? []).length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                  No rest rules defined
                </Text>
              </View>
            )}
          </>
        )}

        {tab === 'limits' && (
          <>
            <Text style={[styles.description, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
              Set maximum usage limits per category
            </Text>
            {(usageLimits ?? []).map((limit) => (
              <Card
                key={limit?.id}
                style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}
              >
                <Card.Content style={styles.ruleContent}>
                  <CategoryBadge category={getCategoryById(limit?.category_id)} size="medium" />
                  <View style={styles.ruleInfo}>
                    <Text style={[styles.ruleText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                      Max {limit?.max_minutes ?? 0} min {limit?.limit_type ?? 'continuous'}
                    </Text>
                  </View>
                  <IconButton
                    icon="delete"
                    iconColor="#F44336"
                    onPress={() => handleDeleteUsageLimit(limit?.id ?? '')}
                  />
                </Card.Content>
              </Card>
            ))}
            {(usageLimits ?? []).length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                  No usage limits defined
                </Text>
              </View>
            )}
          </>
        )}

        {tab === 'violations' && (
          <>
            {(violations ?? []).map((violation) => (
              <Card
                key={violation?.id}
                style={[
                  styles.card,
                  { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' },
                  !violation?.acknowledged && styles.unacknowledgedCard,
                ]}
              >
                <Card.Content>
                  <View style={styles.violationHeader}>
                    <Ionicons
                      name="warning"
                      size={24}
                      color={violation?.acknowledged ? '#666666' : '#F44336'}
                    />
                    <Text style={[styles.violationDate, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                      {violation?.violated_at
                        ? format(parseISO(violation.violated_at), 'MMM d, yyyy h:mm a')
                        : ''}
                    </Text>
                  </View>
                  <Text style={[styles.violationDesc, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    {violation?.description ?? ''}
                  </Text>
                  {!violation?.acknowledged && (
                    <Button
                      mode="outlined"
                      onPress={() => handleAcknowledge(violation?.id ?? '')}
                      style={styles.acknowledgeButton}
                    >
                      Acknowledge
                    </Button>
                  )}
                </Card.Content>
              </Card>
            ))}
            {(violations ?? []).length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                <Text style={[styles.emptyText, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                  No violations! Keep it up! 🎉
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {(tab === 'rest' || tab === 'limits') && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: '#6200EE' }]}
          onPress={() =>
            tab === 'rest' ? setRestModalVisible(true) : setLimitModalVisible(true)
          }
          color="#FFFFFF"
        />
      )}

      {/* Rest Rule Modal */}
      <Portal>
        <Modal
          visible={restModalVisible}
          onDismiss={() => setRestModalVisible(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' },
          ]}
        >
          <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            New Rest Rule
          </Text>

          <Text style={[styles.label, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
            Category
          </Text>
          <Menu
            visible={categoryMenuVisible}
            onDismiss={() => setCategoryMenuVisible(false)}
            anchor={
              <Button mode="outlined" onPress={() => setCategoryMenuVisible(true)}>
                {selectedCategory?.name ?? 'Select Category'}
              </Button>
            }
          >
            {categories.map((cat) => (
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

          <TextInput
            mode="outlined"
            label="After (minutes)"
            value={afterMinutes}
            onChangeText={setAfterMinutes}
            keyboardType="number-pad"
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="Rest duration (minutes)"
            value={restDuration}
            onChangeText={setRestDuration}
            keyboardType="number-pad"
            style={styles.input}
          />

          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              Mandatory
            </Text>
            <Switch value={isMandatory} onValueChange={setIsMandatory} />
          </View>

          <View style={styles.modalActions}>
            <Button mode="text" onPress={() => setRestModalVisible(false)}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleCreateRestRule}
              loading={isLoading}
              style={styles.saveButton}
            >
              Create
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Usage Limit Modal */}
      <Portal>
        <Modal
          visible={limitModalVisible}
          onDismiss={() => setLimitModalVisible(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' },
          ]}
        >
          <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            New Usage Limit
          </Text>

          <Text style={[styles.label, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
            Category
          </Text>
          <Menu
            visible={categoryMenuVisible}
            onDismiss={() => setCategoryMenuVisible(false)}
            anchor={
              <Button mode="outlined" onPress={() => setCategoryMenuVisible(true)}>
                {selectedCategory?.name ?? 'Select Category'}
              </Button>
            }
          >
            {categories.map((cat) => (
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

          <Text style={[styles.label, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
            Limit Type
          </Text>
          <SegmentedButtons
            value={limitType}
            onValueChange={(value) => setLimitType(value as any)}
            buttons={[
              { value: 'continuous', label: 'Continuous' },
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
            ]}
            style={styles.segmented}
          />

          <TextInput
            mode="outlined"
            label="Max (minutes)"
            value={maxMinutes}
            onChangeText={setMaxMinutes}
            keyboardType="number-pad"
            style={styles.input}
          />

          <View style={styles.modalActions}>
            <Button mode="text" onPress={() => setLimitModalVisible(false)}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleCreateUsageLimit}
              loading={isLoading}
              style={styles.saveButton}
            >
              Create
            </Button>
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
  description: {
    fontSize: 13,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  unacknowledgedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  ruleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  ruleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mandatoryChip: {
    marginTop: 4,
    backgroundColor: '#F4433620',
    alignSelf: 'flex-start',
  },
  suggestedChip: {
    marginTop: 4,
    backgroundColor: '#FF980020',
    alignSelf: 'flex-start',
  },
  violationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  violationDate: {
    marginLeft: 8,
    fontSize: 12,
  },
  violationDesc: {
    fontSize: 14,
  },
  acknowledgeButton: {
    marginTop: 12,
    borderColor: '#6200EE',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
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
    marginTop: 12,
  },
  input: {
    marginTop: 8,
  },
  segmented: {
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  switchLabel: {
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  saveButton: {
    marginLeft: 8,
    backgroundColor: '#6200EE',
  },
});
