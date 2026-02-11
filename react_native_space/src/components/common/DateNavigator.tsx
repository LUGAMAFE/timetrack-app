import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, subDays, isToday, parseISO } from 'date-fns';
import { useThemeStore } from '../../stores/themeStore';

interface DateNavigatorProps {
  date: string;
  onDateChange: (date: string) => void;
  showTodayButton?: boolean;
}

export function DateNavigator({ date, onDateChange, showTodayButton = true }: DateNavigatorProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const currentDate = parseISO(date);
  const isTodayDate = isToday(currentDate);

  const handlePrevious = () => {
    onDateChange(format(subDays(currentDate, 1), 'yyyy-MM-dd'));
  };

  const handleNext = () => {
    onDateChange(format(addDays(currentDate, 1), 'yyyy-MM-dd'));
  };

  const handleToday = () => {
    onDateChange(format(new Date(), 'yyyy-MM-dd'));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePrevious} style={styles.navButton}>
        <Ionicons 
          name="chevron-back" 
          size={28} 
          color={isDarkMode ? '#FFFFFF' : '#000000'} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={handleToday} 
        style={styles.dateContainer}
        disabled={!showTodayButton}
      >
        <Text style={[styles.dateText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
          {format(currentDate, 'EEEE')}
        </Text>
        <Text style={[styles.fullDateText, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
          {format(currentDate, 'MMMM d, yyyy')}
        </Text>
        {isTodayDate && (
          <View style={styles.todayBadge}>
            <Text style={styles.todayText}>Today</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleNext} style={styles.navButton}>
        <Ionicons 
          name="chevron-forward" 
          size={28} 
          color={isDarkMode ? '#FFFFFF' : '#000000'} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navButton: {
    padding: 8,
  },
  dateContainer: {
    alignItems: 'center',
    flex: 1,
  },
  dateText: {
    fontSize: 20,
    fontWeight: '600',
  },
  fullDateText: {
    fontSize: 14,
    marginTop: 2,
  },
  todayBadge: {
    backgroundColor: '#6200EE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  todayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
