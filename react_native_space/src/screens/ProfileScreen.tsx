import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Avatar, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import { useDashboardStore } from '../stores/dashboardStore';

export function ProfileScreen() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { streak } = useDashboardStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}
      edges={['bottom']}
    >
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <Card style={[styles.profileCard, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Icon size={80} icon="account" style={{ backgroundColor: '#6200EE' }} />
            <Text style={[styles.email, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              {user?.email ?? 'User'}
            </Text>
            <Text style={[styles.userId, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
              ID: {user?.id?.substring?.(0, 8) ?? 'N/A'}...
            </Text>
          </Card.Content>
        </Card>

        {/* Stats */}
        <Card style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              Your Stats
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="flame" size={32} color="#FF6B00" />
                <Text style={[styles.statValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  {streak?.current_streak ?? 0}
                </Text>
                <Text style={[styles.statLabel, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                  Current Streak
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="trophy" size={32} color="#FFD700" />
                <Text style={[styles.statValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  {streak?.longest_streak ?? 0}
                </Text>
                <Text style={[styles.statLabel, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                  Best Streak
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Account Info */}
        <Card style={[styles.card, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF' }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              Account Information
            </Text>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                Email
              </Text>
              <Text style={[styles.infoValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                {user?.email ?? 'N/A'}
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                Account Created
              </Text>
              <Text style={[styles.infoValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : 'N/A'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Sign Out */}
        <Button
          mode="outlined"
          onPress={handleLogout}
          icon="logout"
          textColor="#F44336"
          style={styles.logoutButton}
        >
          Sign Out
        </Button>
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
  profileCard: {
    margin: 16,
    borderRadius: 16,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  userId: {
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 4,
  },
  logoutButton: {
    margin: 16,
    borderColor: '#F44336',
  },
});
