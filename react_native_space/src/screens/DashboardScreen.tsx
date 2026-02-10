import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useDashboardStore } from '../stores/dashboardStore';
import { useCategoryStore } from '../stores/categoryStore';
import { CategoryCard } from '../components/CategoryCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

export const DashboardScreen: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [refreshing, setRefreshing] = useState(false);

  const { monthlyStats, streaks, fetchMonthlyStats, fetchStreaks, isLoading } = useDashboardStore();
  const { fetchCategories } = useCategoryStore();

  const loadData = useCallback(async () => {
    await Promise.all([fetchMonthlyStats(currentMonth), fetchStreaks(), fetchCategories()]);
  }, [currentMonth]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const changeMonth = (delta: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatMonth = (m: string) => {
    const [year, month] = m.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const chartData = (monthlyStats?.category_breakdown ?? [])
    .filter(c => (c?.total_minutes ?? 0) > 0)
    .map(c => ({
      name: c?.name ?? '',
      population: c?.total_minutes ?? 0,
      color: c?.color ?? '#ccc',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    }));

  if (isLoading && !refreshing) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Month Selector */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-white dark:bg-gray-800">
          <Pressable onPress={() => changeMonth(-1)} className="p-2">
            <Ionicons name="chevron-back" size={24} color="#6366F1" />
          </Pressable>
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatMonth(currentMonth)}
          </Text>
          <Pressable onPress={() => changeMonth(1)} className="p-2">
            <Ionicons name="chevron-forward" size={24} color="#6366F1" />
          </Pressable>
        </View>

        <View className="px-4 py-4">
          {/* Streak Card */}
          <View className="bg-gradient-to-r bg-primary rounded-xl p-4 mb-4">
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-white text-3xl font-bold">{streaks?.current_streak ?? 0} 🔥</Text>
                <Text className="text-white/80 text-sm">Current Streak</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-white text-3xl font-bold">{streaks?.longest_streak ?? 0}</Text>
                <Text className="text-white/80 text-sm">Longest Streak</Text>
              </View>
            </View>
          </View>

          {/* Total Hours */}
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
            <Text className="text-gray-500 dark:text-gray-400 text-sm">Total Hours This Month</Text>
            <Text className="text-3xl font-bold text-gray-900 dark:text-white">
              {(monthlyStats?.total_hours ?? 0).toFixed(1)}h
            </Text>
          </View>

          {/* Pie Chart */}
          {chartData?.length > 0 && (
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Time Distribution</Text>
              <PieChart
                data={chartData}
                width={screenWidth - 48}
                height={180}
                chartConfig={{
                  color: () => '#6366F1'
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          )}

          {/* Category Progress */}
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Category Progress</Text>
          {(monthlyStats?.category_breakdown ?? []).map(cat => (
            <CategoryCard
              key={cat?.category_id}
              category={cat}
              progress={cat?.progress_percent ?? 0}
              hoursLogged={(cat?.total_minutes ?? 0) / 60}
              goalHours={cat?.goal_hours}
            />
          ))}

          {(monthlyStats?.category_breakdown?.length ?? 0) === 0 && (
            <View className="bg-white dark:bg-gray-800 rounded-xl p-8 items-center">
              <Ionicons name="time-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 dark:text-gray-400 mt-4 text-center">
                No time tracked this month yet.\nStart the timer to begin!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
