import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<any> };

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const { resetPassword, isLoading, error } = useAuthStore();

  const handleReset = async () => {
    if (!email?.trim()) return;
    const success = await resetPassword(email.trim());
    if (success) {
      Alert.alert('Success', 'Check your email for reset instructions');
      navigation?.goBack?.();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 justify-center px-6">
        <Text className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Reset Password</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-center mb-8">Enter your email to receive reset instructions</Text>

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
          className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-4 rounded-lg mb-6"
        />

        <Pressable onPress={handleReset} disabled={isLoading} className="bg-primary py-4 rounded-lg mb-4">
          <Text className="text-white text-center font-semibold text-lg">
            {isLoading ? 'Sending...' : 'Send Reset Email'}
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation?.goBack?.()}>
          <Text className="text-primary text-center">Back to Login</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};
