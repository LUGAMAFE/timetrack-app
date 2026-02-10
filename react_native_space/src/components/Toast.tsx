import React, { useEffect } from 'react';
import { View, Text, Animated } from 'react-native';

interface Props {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
  onHide: () => void;
}

export const Toast: React.FC<Props> = ({ message, type = 'info', visible, onHide }) => {
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true })
      ]).start(() => onHide());
    }
  }, [visible]);

  if (!visible) return null;

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-gray-700';

  return (
    <Animated.View
      style={{ opacity, position: 'absolute', bottom: 100, left: 20, right: 20, zIndex: 999 }}
      className={`${bgColor} px-4 py-3 rounded-lg`}
    >
      <Text className="text-white text-center font-medium">{message}</Text>
    </Animated.View>
  );
};
