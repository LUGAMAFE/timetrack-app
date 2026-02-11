import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import { useValidationStore } from '../stores/validationStore';
import { useRuleStore } from '../stores/ruleStore';
import { ActivityIndicator, View, Platform } from 'react-native';
import { Badge } from 'react-native-paper';
import type {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  PlanStackParamList,
  InsightsStackParamList,
  SettingsStackParamList,
} from '../types';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

// Main Screens
import { DailyCommandScreen } from '../screens/DailyCommandScreen';
import { WeeklyPlanScreen } from '../screens/WeeklyPlanScreen';
import { MonthlyOverviewScreen } from '../screens/MonthlyOverviewScreen';
import { TemplateListScreen } from '../screens/TemplateListScreen';
import { TemplateEditorScreen } from '../screens/TemplateEditorScreen';
import { ValidationScreen } from '../screens/ValidationScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AICoachScreen } from '../screens/AICoachScreen';
import { SettingsMainScreen } from '../screens/SettingsMainScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { CategoryEditorScreen } from '../screens/CategoryEditorScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { RulesScreen } from '../screens/RulesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const PlanStack = createNativeStackNavigator<PlanStackParamList>();
const InsightsStack = createNativeStackNavigator<InsightsStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

function AuthNavigator() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
        },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function PlanNavigator() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  
  return (
    <PlanStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        },
        headerTintColor: isDarkMode ? '#FFFFFF' : '#000000',
        headerShadowVisible: false,
      }}
    >
      <PlanStack.Screen 
        name="WeeklyPlan" 
        component={WeeklyPlanScreen}
        options={{ title: 'Weekly Plan' }}
      />
      <PlanStack.Screen 
        name="MonthlyOverview" 
        component={MonthlyOverviewScreen}
        options={{ title: 'Monthly Overview' }}
      />
      <PlanStack.Screen 
        name="TemplateList" 
        component={TemplateListScreen}
        options={{ title: 'Templates' }}
      />
      <PlanStack.Screen 
        name="TemplateEditor" 
        component={TemplateEditorScreen}
        options={{ title: 'Edit Template' }}
      />
    </PlanStack.Navigator>
  );
}

function InsightsNavigator() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  
  return (
    <InsightsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        },
        headerTintColor: isDarkMode ? '#FFFFFF' : '#000000',
        headerShadowVisible: false,
      }}
    >
      <InsightsStack.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <InsightsStack.Screen 
        name="AICoach" 
        component={AICoachScreen}
        options={{ title: 'AI Coach' }}
      />
    </InsightsStack.Navigator>
  );
}

function SettingsNavigator() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        },
        headerTintColor: isDarkMode ? '#FFFFFF' : '#000000',
        headerShadowVisible: false,
      }}
    >
      <SettingsStack.Screen 
        name="SettingsMain" 
        component={SettingsMainScreen}
        options={{ title: 'Settings' }}
      />
      <SettingsStack.Screen 
        name="Categories" 
        component={CategoriesScreen}
        options={{ title: 'Categories' }}
      />
      <SettingsStack.Screen 
        name="CategoryEditor" 
        component={CategoryEditorScreen}
        options={{ title: 'Edit Category' }}
      />
      <SettingsStack.Screen 
        name="Goals" 
        component={GoalsScreen}
        options={{ title: 'Goals' }}
      />
      <SettingsStack.Screen 
        name="Rules" 
        component={RulesScreen}
        options={{ title: 'Rules & Limits' }}
      />
      <SettingsStack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </SettingsStack.Navigator>
  );
}

function MainNavigator() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const pendingCount = useValidationStore((s) => s.pendingBlocks?.length ?? 0);
  const violationsCount = useRuleStore((s) => s.unacknowledgedCount ?? 0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help-circle';

          if (route.name === 'Today') {
            iconName = focused ? 'today' : 'today-outline';
          } else if (route.name === 'Plan') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Validate') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === 'Insights') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200EE',
        tabBarInactiveTintColor: isDarkMode ? '#888888' : '#666666',
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
          borderTopColor: isDarkMode ? '#333333' : '#E0E0E0',
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Today" 
        component={DailyCommandScreen}
        options={{
          tabBarBadge: violationsCount > 0 ? violationsCount : undefined,
        }}
      />
      <Tab.Screen name="Plan" component={PlanNavigator} />
      <Tab.Screen 
        name="Validate" 
        component={ValidationScreen}
        options={{
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
        }}
      />
      <Tab.Screen name="Insights" component={InsightsNavigator} />
      <Tab.Screen name="Settings" component={SettingsNavigator} />
    </Tab.Navigator>
  );
}

export function Navigation() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const session = useAuthStore((s) => s.session);
  const initialized = useAuthStore((s) => s.initialized);

  if (!initialized) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
        }}
      >
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: isDarkMode,
        colors: {
          primary: '#6200EE',
          background: isDarkMode ? '#121212' : '#F5F5F5',
          card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
          text: isDarkMode ? '#FFFFFF' : '#000000',
          border: isDarkMode ? '#333333' : '#E0E0E0',
          notification: '#FF5252',
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '800' },
        },
      }}
    >
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
