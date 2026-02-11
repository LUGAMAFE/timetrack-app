import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<any> };

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginWithGoogle, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email?.trim() || !password?.trim()) return;
    clearError();
    await login(email.trim(), password);
  };

  const handleGoogleLogin = async () => {
    clearError();
    await loginWithGoogle();
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1 justify-center px-6">
          <Text className="text-3xl font-bold text-center text-primary mb-2">TimeTrack</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center mb-8">Track your time investments</Text>

          {error && (
            <View className="bg-red-100 dark:bg-red-900 p-3 rounded-lg mb-4">
              <Text className="text-red-600 dark:text-red-300 text-center">{error}</Text>
            </View>
          )}

          {/* Google Login Button */}
          <Pressable
            onPress={handleGoogleLogin}
            disabled={isLoading}
            className="bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-600 py-4 rounded-lg mb-4 flex-row items-center justify-center"
          >
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text className="text-gray-700 dark:text-white font-semibold text-lg ml-3">
              Continue with Google
            </Text>
          </Pressable>

          {/* Divider */}
          <View className="flex-row items-center my-4">
            <View className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
            <Text className="mx-4 text-gray-500 dark:text-gray-400">or</Text>
            <View className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
          </View>

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
            className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-4 rounded-lg mb-6"
          />

          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            className="bg-primary py-4 rounded-lg mb-4"
          >
            {isLoading ? (
              <LoadingSpinner fullScreen={false} />
            ) : (
              <Text className="text-white text-center font-semibold text-lg">Login</Text>
            )}
          </Pressable>

          <Pressable onPress={() => navigation?.navigate?.('ForgotPassword')}>
            <Text className="text-primary text-center">Forgot Password?</Text>
          </Pressable>

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500 dark:text-gray-400">Don't have an account? </Text>
            <Pressable onPress={() => navigation?.navigate?.('Signup')}>
              <Text className="text-primary font-semibold">Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
