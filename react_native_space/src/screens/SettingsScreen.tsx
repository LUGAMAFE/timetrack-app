import React from 'react';
import { View, Text, Pressable, Switch, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<any> };

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // Use window.confirm for web
      if (window.confirm('Are you sure you want to logout?')) {
        logout();
      }
    } else {
      Alert.alert('Logout', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]);
    }
  };

  const MenuItem = ({ icon, label, onPress, rightElement }: { icon: string; label: string; onPress?: () => void; rightElement?: React.ReactNode }) => (
    <Pressable onPress={onPress} className="flex-row items-center bg-white dark:bg-gray-800 px-4 py-4 border-b border-gray-100 dark:border-gray-700">
      <Ionicons name={icon as any} size={22} color="#6366F1" />
      <Text className="flex-1 ml-3 text-gray-900 dark:text-white">{label}</Text>
      {rightElement ?? <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
    </Pressable>
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">Settings</Text>
      </View>
      <View className="mt-4">
        <Text className="px-4 mb-2 text-sm text-gray-500 dark:text-gray-400 uppercase">Account</Text>
        <View className="bg-white dark:bg-gray-800 px-4 py-4 border-b border-gray-100 dark:border-gray-700">
          <Text className="text-gray-500 dark:text-gray-400 text-sm">Email</Text>
          <Text className="text-gray-900 dark:text-white">{user?.email ?? 'Not logged in'}</Text>
        </View>
      </View>
      <View className="mt-6">
        <Text className="px-4 mb-2 text-sm text-gray-500 dark:text-gray-400 uppercase">Preferences</Text>
        <MenuItem icon="moon" label="Dark Mode" rightElement={<Switch value={isDarkMode} onValueChange={toggleDarkMode} trackColor={{ true: '#6366F1' }} />} />
        <MenuItem icon="time" label="Time Entries History" onPress={() => navigation?.navigate?.('History')} />
      </View>
      <View className="mt-6">
        <Text className="px-4 mb-2 text-sm text-gray-500 dark:text-gray-400 uppercase">About</Text>
        <MenuItem icon="information-circle" label="Version" rightElement={<Text className="text-gray-500">1.0.0</Text>} />
      </View>
      <View className="mt-6">
        <Pressable onPress={handleLogout} className="flex-row items-center justify-center bg-white dark:bg-gray-800 py-4">
          <Ionicons name="log-out" size={22} color="#EF4444" />
          <Text className="ml-2 text-red-500 font-medium">Logout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};
