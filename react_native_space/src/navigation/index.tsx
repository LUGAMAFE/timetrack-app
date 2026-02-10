import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TimerScreen } from '../screens/TimerScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { LoadingSpinner } from '../components/LoadingSpinner';

const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const SettingsStack = createNativeStackNavigator();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Signup" component={SignupScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </AuthStack.Navigator>
);

const SettingsNavigator = () => (
  <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
    <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} />
    <SettingsStack.Screen name="History" component={HistoryScreen} />
  </SettingsStack.Navigator>
);

const TabNavigator = () => (
  <Tab.Navigator screenOptions={({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: '#6366F1',
    tabBarInactiveTintColor: '#9CA3AF',
    tabBarStyle: { paddingBottom: 8, height: 60 },
    tabBarIcon: ({ color, size }) => {
      let iconName: keyof typeof Ionicons.glyphMap = 'home';
      if (route.name === 'Dashboard') iconName = 'home';
      else if (route.name === 'Timer') iconName = 'timer';
      else if (route.name === 'Categories') iconName = 'grid';
      else if (route.name === 'Settings') iconName = 'settings';
      return <Ionicons name={iconName} size={size} color={color} />;
    }
  })}>
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Timer" component={TimerScreen} />
    <Tab.Screen name="Categories" component={CategoriesScreen} />
    <Tab.Screen name="Settings" component={SettingsNavigator} />
  </Tab.Navigator>
);

export const Navigation: React.FC = () => {
  const { session, initialized } = useAuthStore();
  if (!initialized) return <LoadingSpinner message="Loading..." />;
  return <NavigationContainer>{session ? <TabNavigator /> : <AuthNavigator />}</NavigationContainer>;
};
