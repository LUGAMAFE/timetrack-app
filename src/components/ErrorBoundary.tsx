import React, { Component, ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900 p-4">
          <Text className="text-xl font-bold text-red-500 mb-2">Something went wrong</Text>
          <Text className="text-gray-600 dark:text-gray-400 text-center mb-4">
            {this.state.error?.message ?? 'Unknown error'}
          </Text>
          <Pressable
            onPress={() => this.setState({ hasError: false })}
            className="bg-primary px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
