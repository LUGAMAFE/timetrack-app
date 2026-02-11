import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { List, Switch, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'SettingsMain'>;

export function SettingsMainScreen() {
  const navigation = useNavigation<NavigationProp>();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const toggleDarkMode = useThemeStore((s) => s.toggleDarkMode);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}
      edges={['bottom']}
    >
      <ScrollView style={styles.scrollView}>
        {/* User Info */}
        <View style={[styles.userSection, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={60} color="#6200EE" />
          </View>
          <Text style={[styles.userName, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            {user?.email ?? 'User'}
          </Text>
        </View>

        {/* Planning Section */}
        <List.Section>
          <List.Subheader style={[styles.sectionHeader, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
            Planning
          </List.Subheader>
          <View style={[styles.listContainer, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
            <List.Item
              title="Categories"
              description="Manage your time categories"
              left={(props) => <List.Icon {...props} icon="shape" color="#6200EE" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Categories')}
              titleStyle={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}
              descriptionStyle={{ color: isDarkMode ? '#BBBBBB' : '#666666' }}
            />
            <Divider />
            <List.Item
              title="Goals"
              description="Set monthly and weekly targets"
              left={(props) => <List.Icon {...props} icon="target" color="#4CAF50" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Goals')}
              titleStyle={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}
              descriptionStyle={{ color: isDarkMode ? '#BBBBBB' : '#666666' }}
            />
            <Divider />
            <List.Item
              title="Rules & Limits"
              description="Rest rules and usage limits"
              left={(props) => <List.Icon {...props} icon="shield-check" color="#FF9800" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Rules')}
              titleStyle={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}
              descriptionStyle={{ color: isDarkMode ? '#BBBBBB' : '#666666' }}
            />
          </View>
        </List.Section>

        {/* Appearance Section */}
        <List.Section>
          <List.Subheader style={[styles.sectionHeader, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
            Appearance
          </List.Subheader>
          <View style={[styles.listContainer, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
            <List.Item
              title="Dark Mode"
              description="Switch between light and dark themes"
              left={(props) => <List.Icon {...props} icon="brightness-6" color="#9C27B0" />}
              right={() => <Switch value={isDarkMode} onValueChange={toggleDarkMode} />}
              titleStyle={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}
              descriptionStyle={{ color: isDarkMode ? '#BBBBBB' : '#666666' }}
            />
          </View>
        </List.Section>

        {/* Account Section */}
        <List.Section>
          <List.Subheader style={[styles.sectionHeader, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
            Account
          </List.Subheader>
          <View style={[styles.listContainer, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
            <List.Item
              title="Profile"
              description="View and edit your profile"
              left={(props) => <List.Icon {...props} icon="account" color="#2196F3" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Profile')}
              titleStyle={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}
              descriptionStyle={{ color: isDarkMode ? '#BBBBBB' : '#666666' }}
            />
            <Divider />
            <List.Item
              title="Sign Out"
              left={(props) => <List.Icon {...props} icon="logout" color="#F44336" />}
              onPress={handleLogout}
              titleStyle={{ color: '#F44336' }}
            />
          </View>
        </List.Section>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: isDarkMode ? '#666666' : '#999999' }]}>
            Time Investment Tracker v1.0.0
          </Text>
          <Text style={[styles.appInfoText, { color: isDarkMode ? '#666666' : '#999999' }]}>
            Command Center Edition
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
  },
  avatarContainer: {
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  listContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appInfoText: {
    fontSize: 12,
  },
});
