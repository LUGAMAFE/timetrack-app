import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onDismiss?: () => void;
}

export function Toast({ 
  visible, 
  message, 
  type = 'info', 
  duration = 3000, 
  onDismiss 
}: ToastProps) {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(animation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss?.();
      });
    }
  }, [visible]);

  if (!visible) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return { icon: 'checkmark-circle' as const, color: '#4CAF50', bg: '#4CAF5020' };
      case 'error':
        return { icon: 'close-circle' as const, color: '#F44336', bg: '#F4433620' };
      case 'warning':
        return { icon: 'warning' as const, color: '#FF9800', bg: '#FF980020' };
      default:
        return { icon: 'information-circle' as const, color: '#2196F3', bg: '#2196F320' };
    }
  };

  const config = getTypeConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: config.bg, opacity: animation },
      ]}
    >
      <Ionicons name={config.icon} size={24} color={config.color} />
      <Text style={[styles.message, { color: config.color }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  message: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
  },
});
