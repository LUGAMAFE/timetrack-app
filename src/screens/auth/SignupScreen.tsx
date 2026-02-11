import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { useCategoryStore } from '../../stores/categoryStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<any> };

export const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signup, isLoading, error, clearError } = useAuthStore();
  const { seedDefaults } = useCategoryStore();

  const handleSignup = async () => {
    if (!email?.trim() || !password?.trim()) return;
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    clearError();
    const success = await signup(email.trim(), password);
    if (success) {
      await seedDefaults();
      Alert.alert('Success', 'Check your email to confirm your account');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1 justify-center px-6">
          <Text className="text-3xl font-bold text-center text-primary mb-2">Create Account</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center mb-8">Start tracking your time</Text>

          {error && (
            <View className="bg-red-100 dark:bg-red-900 p-3 rounded-lg mb-4">
              <Text className="text-red-600 dark:text-red-300 text-center">{error}</Text>
            </View>
          )}

          <TextInput
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-4 rounded-lg mb-4"
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-4 rounded-lg mb-4"
          />
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#9CA3AF"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-4 rounded-lg mb-6"
          />

          <Pressable
            onPress={handleSignup}
            disabled={isLoading}
            className="bg-primary py-4 rounded-lg mb-4"
          >
            <Text className="text-white text-center font-semibold text-lg">
              {isLoading ? 'Creating...' : 'Sign Up'}
            </Text>
          </Pressable>

          <View className="flex-row justify-center">
            <Text className="text-gray-500 dark:text-gray-400">Already have an account? </Text>
            <Pressable onPress={() => navigation?.goBack?.()}>
              <Text className="text-primary font-semibold">Login</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
