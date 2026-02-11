import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, SegmentedButtons, Card, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { useThemeStore } from '../stores/themeStore';
import { useDashboardStore } from '../stores/dashboardStore';
import { useGoalStore } from '../stores/goalStore';
import { useValidationStore } from '../stores/validationStore';
import { StreakBadge } from '../components/common/StreakBadge';
import { GoalProgressBar } from '../components/goals/GoalProgressBar';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { InsightsStackParamList } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;

type NavigationProp = NativeStackNavigationProp<InsightsStackParamList, 'Dashboard'>;

export function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const { stats, streak, fetchStats, fetchStreak, isLoading } = useDashboardStore();
  const { monthlyProgress, fetchMonthlyProgress } = useGoalStore();
  const { validationHistory, fetchValidationHistory } = useValidationStore();

  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [period])
  );

  const loadData = async () => {
    await Promise.all([
      fetchStats(period),
      fetchStreak(),
      fetchMonthlyProgress(),
      fetchValidationHistory(),
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const pieChartData = (stats?.category_breakdown ?? [])
    .filter(c => (c?.total_minutes ?? 0) > 0)
    .slice(0, 5)
    .map(c => ({
      name: c?.name ?? 'Unknown',
      hours: Math.round((c?.total_minutes ?? 0) / 60 * 10) / 10,
      color: c?.color ?? '#6200EE',
      legendFontColor: isDarkMode ? '#BBBBBB' : '#666666',
      legendFontSize: 12,
    }));

  const completionRate = stats?.completion_rate ?? 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}
      edges={['bottom']}
    >
      <Appbar.Header style={{ backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }}>
        <Appbar.Content title="Dashboard" />
        <Appbar.Action
          icon="robot-outline"
          onPress={() => navigation.navigate('AICoach')}
        />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <SegmentedButtons
            value={period}
            onValueChange={(value) => setPeriod(value as 'week' | 'month')}
            buttons={[
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
            ]}
          />
        </View>

        {/* Stats Overview */}
        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
            <Card.Content style={styles.statContent}>
              <StreakBadge streak={streak} size="large" />
              <Text style={[styles.statLabel, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                Day Streak
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
            <Card.Content style={styles.statContent}>
              <View style={[
                styles.completionCircle,
                { borderColor: completionRate >= 80 ? '#4CAF50' : completionRate >= 50 ? '#FF9800' : '#F44336' }
              ]}>
                <Text style={[
                  styles.completionText,
                  { color: completionRate >= 80 ? '#4CAF50' : completionRate >= 50 ? '#FF9800' : '#F44336' }
                ]}>
                  {completionRate.toFixed(0)}%
                </Text>
              </View>
              <Text style={[styles.statLabel, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                Completion Rate
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Stats */}
        <Card style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              {period === 'week' ? 'Weekly' : 'Monthly'} Summary
            </Text>
            <View style={styles.quickStats}>
              <View style={styles.quickStatItem}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={[styles.quickStatValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  {stats?.completed_blocks ?? 0}
                </Text>
                <Text style={[styles.quickStatLabel, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                  Completed
                </Text>
              </View>
              <View style={styles.quickStatItem}>
                <Ionicons name="ellipse-outline" size={24} color="#FF9800" />
                <Text style={[styles.quickStatValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  {stats?.partial_blocks ?? 0}
                </Text>
                <Text style={[styles.quickStatLabel, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                  Partial
                </Text>
              </View>
              <View style={styles.quickStatItem}>
                <Ionicons name="close-circle" size={24} color="#F44336" />
                <Text style={[styles.quickStatValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  {stats?.omitted_blocks ?? 0}
                </Text>
                <Text style={[styles.quickStatLabel, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                  Omitted
                </Text>
              </View>
              <View style={styles.quickStatItem}>
                <Ionicons name="time" size={24} color="#6200EE" />
                <Text style={[styles.quickStatValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  {((stats?.total_completed_hours ?? 0)).toFixed(1)}h
                </Text>
                <Text style={[styles.quickStatLabel, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                  Total Hours
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Category Breakdown */}
        {pieChartData.length > 0 && (
          <Card style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
            <Card.Content>
              <Text style={[styles.cardTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                Time by Category
              </Text>
              <PieChart
                data={pieChartData}
                width={SCREEN_WIDTH - 64}
                height={200}
                chartConfig={{
                  color: () => '#6200EE',
                }}
                accessor="hours"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </Card.Content>
          </Card>
        )}

        {/* Goal Progress */}
        {(monthlyProgress?.length ?? 0) > 0 && (
          <Card style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
            <Card.Content>
              <Text style={[styles.cardTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                Monthly Goal Progress
              </Text>
              {monthlyProgress.map((goal) => (
                <GoalProgressBar key={goal?.goal_id} goal={goal} />
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Top Omission Reasons */}
        {(stats?.top_omission_reasons?.length ?? 0) > 0 && (
          <Card style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
            <Card.Content>
              <Text style={[styles.cardTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                Top Omission Reasons
              </Text>
              {(stats?.top_omission_reasons ?? []).slice(0, 5).map((reason, index) => (
                <View key={index} style={styles.reasonRow}>
                  <Text style={[styles.reasonText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    {reason?.reason ?? 'Unknown'}
                  </Text>
                  <View style={styles.reasonCount}>
                    <Text style={styles.reasonCountText}>{reason?.count ?? 0}</Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* AI Insights CTA */}
        <Card style={[styles.card, { backgroundColor: '#6200EE20' }]}>
          <Card.Content>
            <View style={styles.aiCtaContent}>
              <Ionicons name="sparkles" size={32} color="#6200EE" />
              <View style={styles.aiCtaText}>
                <Text style={[styles.aiCtaTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  Get AI Insights
                </Text>
                <Text style={[styles.aiCtaSubtitle, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                  Analyze patterns and get personalized recommendations
                </Text>
              </View>
            </View>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('AICoach')}
              style={styles.aiButton}
            >
              Open AI Coach
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  periodSelector: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 8,
  },
  completionCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionText: {
    fontSize: 18,
    fontWeight: '700',
  },
  card: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickStatItem: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  quickStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  reasonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  reasonText: {
    fontSize: 14,
    flex: 1,
  },
  reasonCount: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reasonCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  aiCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiCtaText: {
    marginLeft: 16,
    flex: 1,
  },
  aiCtaTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  aiCtaSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  aiButton: {
    backgroundColor: '#6200EE',
  },
});
