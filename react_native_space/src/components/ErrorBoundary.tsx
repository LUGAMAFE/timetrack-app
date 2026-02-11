import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="warning" size={64} color="#F44336" />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The app encountered an unexpected error.
          </Text>
          
          <ScrollView style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Error Details:</Text>
            <Text style={styles.errorText}>
              {this.state.error?.message ?? 'Unknown error'}
            </Text>
            {this.state.errorInfo?.componentStack && (
              <Text style={styles.stackText}>
                {this.state.errorInfo.componentStack.substring(0, 500)}
              </Text>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.reloadButton} onPress={this.handleReload}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.reloadText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    maxHeight: 200,
    marginTop: 24,
    padding: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    width: '100%',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  stackText: {
    fontSize: 10,
    color: '#888888',
    fontFamily: 'monospace',
    marginTop: 8,
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6200EE',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  reloadText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
