import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Card, Button, ActivityIndicator, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format, startOfWeek } from 'date-fns';
import { useThemeStore } from '../stores/themeStore';
import { useAIStore } from '../stores/aiStore';
import type { AIInsight, InsightType } from '../types';

export function AICoachScreen() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const {
    insights,
    lastAnalysis,
    lastPredictions,
    lastTimeLeaks,
    fetchInsights,
    dismissInsight,
    analyzeFeasibility,
    predictAlerts,
    detectTimeLeaks,
    isLoading,
  } = useAIStore();

  const [refreshing, setRefreshing] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const activeInsights = (insights ?? []).filter(i => !i?.is_dismissed);

  useFocusEffect(
    useCallback(() => {
      fetchInsights();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInsights();
    setRefreshing(false);
  };

  const handleAnalyzeFeasibility = async () => {
    setActiveAction('feasibility');
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    await analyzeFeasibility(weekStart);
    setActiveAction(null);
  };

  const handlePredictAlerts = async () => {
    setActiveAction('predict');
    await predictAlerts();
    setActiveAction(null);
  };

  const handleDetectTimeLeaks = async () => {
    setActiveAction('leaks');
    await detectTimeLeaks();
    setActiveAction(null);
  };

  const handleDismissInsight = async (id: string) => {
    await dismissInsight(id);
  };

  const getInsightIcon = (type?: InsightType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'feasibility':
        return 'analytics-outline';
      case 'prediction':
        return 'trending-up-outline';
      case 'pattern':
        return 'git-network-outline';
      case 'suggestion':
        return 'bulb-outline';
      case 'time_leak':
        return 'water-outline';
      case 'recovery':
        return 'fitness-outline';
      default:
        return 'sparkles-outline';
    }
  };

  const getInsightColor = (type?: InsightType): string => {
    switch (type) {
      case 'feasibility':
        return '#2196F3';
      case 'prediction':
        return '#9C27B0';
      case 'pattern':
        return '#FF9800';
      case 'suggestion':
        return '#4CAF50';
      case 'time_leak':
        return '#F44336';
      case 'recovery':
        return '#00BCD4';
      default:
        return '#6200EE';
    }
  };

  const renderInsightCard = (insight: AIInsight) => {
    const iconName = getInsightIcon(insight?.insight_type);
    const color = getInsightColor(insight?.insight_type);

    return (
      <Card
        key={insight?.id}
        style={[styles.insightCard, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}
      >
        <Card.Content>
          <View style={styles.insightHeader}>
            <View style={[styles.insightIcon, { backgroundColor: color + '20' }]}>
              <Ionicons name={iconName} size={24} color={color} />
            </View>
            <View style={styles.insightInfo}>
              <Text
                style={[styles.insightTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}
                numberOfLines={2}
              >
                {insight?.title ?? 'Insight'}
              </Text>
              <Text style={[styles.insightType, { color }]}>
                {insight?.insight_type?.toUpperCase?.()?.replace?.('_', ' ') ?? 'INSIGHT'}
              </Text>
            </View>
            {(insight?.confidence_score ?? 0) > 0 && (
              <Chip compact style={styles.confidenceChip}>
                {((insight?.confidence_score ?? 0) * 100).toFixed(0)}%
              </Chip>
            )}
          </View>
          <Text style={[styles.insightDescription, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
            {insight?.description ?? ''}
          </Text>
          <View style={styles.insightActions}>
            <Button
              mode="text"
              onPress={() => handleDismissInsight(insight?.id ?? '')}
              textColor="#888888"
            >
              Dismiss
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}
      edges={['bottom']}
    >
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* AI Actions */}
        <Card style={[styles.actionsCard, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              AI Analysis Tools
            </Text>
            <Text style={[styles.sectionSubtitle, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
              Let AI help you optimize your time investment
            </Text>

            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                icon="calendar-check"
                onPress={handleAnalyzeFeasibility}
                loading={activeAction === 'feasibility'}
                disabled={isLoading}
                style={styles.actionButton}
              >
                Analyze Week
              </Button>
              <Button
                mode="outlined"
                icon="alert-circle"
                onPress={handlePredictAlerts}
                loading={activeAction === 'predict'}
                disabled={isLoading}
                style={styles.actionButton}
              >
                Predict Alerts
              </Button>
              <Button
                mode="outlined"
                icon="water"
                onPress={handleDetectTimeLeaks}
                loading={activeAction === 'leaks'}
                disabled={isLoading}
                style={styles.actionButton}
              >
                Find Time Leaks
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Feasibility Analysis Result */}
        {lastAnalysis && (
          <Card style={[styles.resultCard, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
            <Card.Content>
              <View style={styles.resultHeader}>
                <Ionicons
                  name={lastAnalysis.is_feasible ? 'checkmark-circle' : 'warning'}
                  size={32}
                  color={lastAnalysis.is_feasible ? '#4CAF50' : '#FF9800'}
                />
                <View style={styles.resultText}>
                  <Text style={[styles.resultTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    {lastAnalysis.is_feasible ? 'Plan is Feasible' : 'Plan Needs Adjustment'}
                  </Text>
                  <Text style={[styles.resultConfidence, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                    Confidence: {((lastAnalysis.confidence ?? 0) * 100).toFixed(0)}%
                  </Text>
                </View>
              </View>

              {(lastAnalysis.warnings?.length ?? 0) > 0 && (
                <View style={styles.listSection}>
                  <Text style={[styles.listTitle, { color: '#FF9800' }]}>Warnings</Text>
                  {(lastAnalysis.warnings ?? []).map((warning, i) => (
                    <Text key={i} style={[styles.listItem, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                      • {warning}
                    </Text>
                  ))}
                </View>
              )}

              {(lastAnalysis.suggestions?.length ?? 0) > 0 && (
                <View style={styles.listSection}>
                  <Text style={[styles.listTitle, { color: '#4CAF50' }]}>Suggestions</Text>
                  {(lastAnalysis.suggestions ?? []).map((suggestion, i) => (
                    <Text key={i} style={[styles.listItem, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                      • {suggestion}
                    </Text>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Time Leaks Result */}
        {(lastTimeLeaks?.length ?? 0) > 0 && (
          <Card style={[styles.resultCard, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                Detected Time Leaks
              </Text>
              {lastTimeLeaks.map((leak, index) => (
                <View key={index} style={styles.leakItem}>
                  <Text style={[styles.leakCategory, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    {leak?.category_name ?? 'Unknown'}
                  </Text>
                  <Text style={[styles.leakDetails, { color: '#F44336' }]}>
                    Lost {(leak?.leak_hours ?? 0).toFixed(1)}h (expected {(leak?.expected_hours ?? 0).toFixed(1)}h, got {(leak?.actual_hours ?? 0).toFixed(1)}h)
                  </Text>
                  {(leak?.common_reasons?.length ?? 0) > 0 && (
                    <Text style={[styles.leakReasons, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                      Common reasons: {(leak?.common_reasons ?? []).join(', ')}
                    </Text>
                  )}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Active Insights */}
        <View style={styles.insightsSection}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#000000', paddingHorizontal: 16 }]}>
            Active Insights ({activeInsights.length})
          </Text>
          
          {activeInsights.length === 0 ? (
            <View style={[styles.emptyInsights, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
              <Ionicons name="sparkles-outline" size={48} color={isDarkMode ? '#666666' : '#AAAAAA'} />
              <Text style={[styles.emptyText, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                No active insights
              </Text>
              <Text style={[styles.emptySubtext, { color: isDarkMode ? '#666666' : '#999999' }]}>
                Run an analysis to get personalized insights
              </Text>
            </View>
          ) : (
            activeInsights.map(renderInsightCard)
          )}
        </View>
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
  actionsCard: {
    margin: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    borderColor: '#6200EE',
  },
  resultCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultText: {
    marginLeft: 12,
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  resultConfidence: {
    fontSize: 12,
    marginTop: 2,
  },
  listSection: {
    marginTop: 12,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  listItem: {
    fontSize: 13,
    marginBottom: 4,
    paddingLeft: 8,
  },
  leakItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  leakCategory: {
    fontSize: 16,
    fontWeight: '600',
  },
  leakDetails: {
    fontSize: 14,
    marginTop: 4,
  },
  leakReasons: {
    fontSize: 12,
    marginTop: 4,
  },
  insightsSection: {
    marginBottom: 24,
  },
  insightCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightInfo: {
    flex: 1,
    marginLeft: 12,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  insightType: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  confidenceChip: {
    marginLeft: 8,
  },
  insightDescription: {
    fontSize: 13,
    marginTop: 12,
    lineHeight: 20,
  },
  insightActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  emptyInsights: {
    margin: 16,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});
