import React, { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FAB, Card, IconButton, Menu, Button, Portal, Dialog, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../stores/themeStore';
import { useTemplateStore } from '../stores/templateStore';
import type { WeeklyTemplate, PlanStackParamList } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<PlanStackParamList, 'TemplateList'>;

export function TemplateListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const {
    templates,
    fetchTemplates,
    createTemplate,
    deleteTemplate,
    duplicateTemplate,
    updateTemplate,
    isLoading,
  } = useTemplateStore();

  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchTemplates();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTemplates();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!newTemplateName.trim()) return;
    const template = await createTemplate({ name: newTemplateName.trim() });
    if (template) {
      setCreateDialogVisible(false);
      setNewTemplateName('');
      navigation.navigate('TemplateEditor', { templateId: template.id });
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTemplate(id);
    setMenuVisible(null);
  };

  const handleDuplicate = async (id: string) => {
    await duplicateTemplate(id);
    setMenuVisible(null);
  };

  const handleSetDefault = async (id: string) => {
    await updateTemplate(id, { is_default: true });
    setMenuVisible(null);
  };

  const renderTemplate = ({ item }: { item: WeeklyTemplate }) => (
    <Card
      style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}
      onPress={() => navigation.navigate('TemplateEditor', { templateId: item?.id })}
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={item?.is_default ? 'star' : 'document-text-outline'}
              size={24}
              color={item?.is_default ? '#FFD700' : '#6200EE'}
            />
          </View>
          <View style={styles.cardInfo}>
            <Text
              style={[styles.templateName, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}
              numberOfLines={1}
            >
              {item?.name ?? 'Untitled'}
            </Text>
            <Text style={[styles.templateMeta, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
              {(item?.blocks?.length ?? 0)} blocks
              {item?.is_default ? ' • Default' : ''}
            </Text>
          </View>
        </View>
        <Menu
          visible={menuVisible === item?.id}
          onDismiss={() => setMenuVisible(null)}
          anchor={
            <IconButton icon="dots-vertical" onPress={() => setMenuVisible(item?.id ?? null)} />
          }
        >
          <Menu.Item
            onPress={() => navigation.navigate('TemplateEditor', { templateId: item?.id })}
            title="Edit"
            leadingIcon="pencil"
          />
          <Menu.Item
            onPress={() => handleDuplicate(item?.id ?? '')}
            title="Duplicate"
            leadingIcon="content-copy"
          />
          {!item?.is_default && (
            <Menu.Item
              onPress={() => handleSetDefault(item?.id ?? '')}
              title="Set as Default"
              leadingIcon="star"
            />
          )}
          <Menu.Item
            onPress={() => handleDelete(item?.id ?? '')}
            title="Delete"
            leadingIcon="delete"
            titleStyle={{ color: '#F44336' }}
          />
        </Menu>
      </Card.Content>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="calendar-outline"
        size={64}
        color={isDarkMode ? '#666666' : '#AAAAAA'}
      />
      <Text style={[styles.emptyText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
        No templates yet
      </Text>
      <Text style={[styles.emptySubtext, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
        Create a template to quickly set up your weekly schedule
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}
      edges={['bottom']}
    >
      <FlatList
        data={templates}
        keyExtractor={(item) => item?.id ?? Math.random().toString()}
        renderItem={renderTemplate}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          (templates ?? []).length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: '#6200EE' }]}
        onPress={() => setCreateDialogVisible(true)}
        color="#FFFFFF"
      />

      {/* Create Template Dialog */}
      <Portal>
        <Dialog visible={createDialogVisible} onDismiss={() => setCreateDialogVisible(false)}>
          <Dialog.Title>New Template</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="Template Name"
              value={newTemplateName}
              onChangeText={setNewTemplateName}
              placeholder="e.g., Productive Week"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCreate} loading={isLoading}>
              Create
            </Button>
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
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6200EE20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
  },
  templateMeta: {
    fontSize: 13,
    marginTop: 2,
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
