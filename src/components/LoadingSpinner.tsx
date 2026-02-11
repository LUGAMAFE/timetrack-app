import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface Props {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<Props> = ({ message, fullScreen = true }) => {
  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#6366F1" />
        {message && <Text className="mt-4 text-gray-600 dark:text-gray-400">{message}</Text>}
      </View>
    );
  }
  return (
    <View className="items-center justify-center py-8">
      <ActivityIndicator size="large" color="#6366F1" />
      {message && <Text className="mt-2 text-gray-600 dark:text-gray-400">{message}</Text>}
    </View>
  );
};
