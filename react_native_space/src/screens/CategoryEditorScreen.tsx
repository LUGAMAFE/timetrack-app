import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TextInput,
  Button,
  Text,
  IconButton,
  Portal,
  Dialog,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useThemeStore } from '../stores/themeStore';
import { useCategoryStore } from '../stores/categoryStore';
import { CategoryBadge } from '../components/common/CategoryBadge';
import type { SettingsStackParamList, CreateCategoryDto, Category } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'CategoryEditor'>;
type RouteProps = RouteProp<SettingsStackParamList, 'CategoryEditor'>;

const COLORS = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
  '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
  '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
  '#FF5722', '#795548', '#607D8B',
];

const ICONS = [
  'briefcase', 'book', 'code-slash', 'fitness', 'game-controller',
  'musical-notes', 'brush', 'camera', 'cafe', 'restaurant',
  'bed', 'walk', 'bicycle', 'car', 'airplane',
  'home', 'people', 'heart', 'star', 'trophy',
];

export function CategoryEditorScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const { categories, createCategory, updateCategory, deleteCategory, isLoading, error: storeError, clearError } = useCategoryStore();

  const categoryId = route.params?.categoryId;
  const existingCategory = categories.find(c => c?.id === categoryId);
  const isEditing = !!existingCategory;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('briefcase');
  const [color, setColor] = useState('#6200EE');
  const [monthlyGoalHours, setMonthlyGoalHours] = useState('');
  const [monthlyLimitHours, setMonthlyLimitHours] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [localError, setLocalError] = useState('');
  
  // Combined error from store and local validation
  const error = storeError || localError;

  useEffect(() => {
    if (existingCategory) {
      setName(existingCategory.name ?? '');
      setIcon(existingCategory.icon ?? 'briefcase');
      setColor(existingCategory.color ?? '#6200EE');
      setMonthlyGoalHours(existingCategory.monthly_goal_hours ? String(existingCategory.monthly_goal_hours) : '');
      setMonthlyLimitHours(existingCategory.monthly_limit_hours ? String(existingCategory.monthly_limit_hours) : '');
    }
  }, [existingCategory]);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setLocalError('Name is required');
      return false;
    }
    setLocalError('');
    clearError();
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const data: CreateCategoryDto = {
      name: name.trim(),
      icon,
      color,
    };
    
    // Only include optional fields if they have values
    if (monthlyGoalHours) {
      data.monthly_goal_hours = parseInt(monthlyGoalHours, 10) || undefined;
    }
    if (monthlyLimitHours) {
      data.monthly_limit_hours = parseInt(monthlyLimitHours, 10) || undefined;
    }

    let success = false;
    if (isEditing && categoryId) {
      success = await updateCategory(categoryId, data);
    } else {
      const result = await createCategory(data);
      success = !!result;
    }

    if (success) {
      clearError();
      navigation.goBack();
    }
    // If not successful, error is already set in the store and will be displayed
  };

  const handleDelete = async () => {
    if (categoryId) {
      const success = await deleteCategory(categoryId);
      if (success) {
        setShowDeleteDialog(false);
        navigation.goBack();
      }
    }
  };

  const previewCategory: Category = {
    id: 'preview',
    user_id: '',
    name: name || 'Preview',
    icon,
    color,
    is_default: false,
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Preview */}
          <View style={[styles.previewCard, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
            <CategoryBadge category={previewCategory} size="large" showLabel />
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {/* Name */}
          <TextInput
            mode="outlined"
            label="Category Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          {/* Color Picker */}
          <Text style={[styles.label, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
            Color
          </Text>
          <View style={styles.colorGrid}>
            {COLORS.map((c) => (
              <IconButton
                key={c}
                icon={color === c ? 'check' : 'circle'}
                iconColor={c}
                size={28}
                style={[
                  styles.colorButton,
                  color === c && { borderColor: c, borderWidth: 2 },
                ]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>

          {/* Icon Picker */}
          <Text style={[styles.label, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
            Icon
          </Text>
          <View style={styles.iconGrid}>
            {ICONS.map((i) => (
              <IconButton
                key={i}
                icon={i}
                iconColor={icon === i ? color : isDarkMode ? '#FFFFFF' : '#000000'}
                size={24}
                style={[
                  styles.iconButton,
                  { backgroundColor: isDarkMode ? '#333333' : '#F0F0F0' },
                  icon === i && { backgroundColor: color + '30' },
                ]}
                onPress={() => setIcon(i)}
              />
            ))}
          </View>

          {/* Monthly Goal Hours */}
          <TextInput
            mode="outlined"
            label="Monthly Goal Hours (optional)"
            value={monthlyGoalHours}
            onChangeText={setMonthlyGoalHours}
            keyboardType="number-pad"
            style={styles.input}
            placeholder="e.g., 20"
          />

          {/* Monthly Limit Hours */}
          <TextInput
            mode="outlined"
            label="Monthly Limit Hours (optional)"
            value={monthlyLimitHours}
            onChangeText={setMonthlyLimitHours}
            keyboardType="number-pad"
            style={styles.input}
            placeholder="e.g., 40"
          />

          {/* Actions */}
          <View style={styles.actions}>
            {isEditing && (
              <Button
                mode="outlined"
                onPress={() => setShowDeleteDialog(true)}
                textColor="#F44336"
                style={styles.deleteButton}
              >
                Delete Category
              </Button>
            )}
            <Button
              mode="contained"
              onPress={handleSave}
              loading={isLoading}
              style={styles.saveButton}
            >
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Category</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete "{name}"? This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={handleDelete} textColor="#F44336">Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  previewCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  errorText: {
    color: '#F44336',
    marginBottom: 12,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  colorButton: {
    margin: 2,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  iconButton: {
    margin: 2,
    borderRadius: 8,
  },
  actions: {
    marginTop: 24,
    marginBottom: 40,
    gap: 12,
  },
  deleteButton: {
    borderColor: '#F44336',
  },
  saveButton: {
    backgroundColor: '#6200EE',
  },
});
