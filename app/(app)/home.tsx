
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Animated } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { ModernCard } from '../../components/ui/ModernCard';
import { ModernButton } from '../../components/ui/ModernButton';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme/theme';
import { router } from 'expo-router';

interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  unreadNotifications: number;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { database } = useDatabase();
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    unreadNotifications: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!database || !user) return;

    try {
      // Get user's requests
      const requests = await database.getAllAsync(
        'SELECT * FROM requests WHERE user_id = ?',
        [user.id]
      ) as any[];

      // Get unread notifications
      const notifications = await database.getAllAsync(
        'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0',
        [user.id]
      ) as any[];

      setStats({
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => r.status === 'pending').length,
        approvedRequests: requests.filter(r => r.status === 'approved').length,
        rejectedRequests: requests.filter(r => r.status === 'rejected').length,
        unreadNotifications: notifications.length,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const quickActions = [
    {
      title: 'Leave Request',
      subtitle: 'Apply for leave',
      onPress: () => router.push('/(app)/requests/leave'),
      color: Colors.primary,
    },
    {
      title: 'Permission Request',
      subtitle: 'Request permission',
      onPress: () => router.push('/(app)/requests/permission'),
      color: Colors.success,
    },
    {
      title: 'Shift Change',
      subtitle: 'Request shift change',
      onPress: () => router.push('/(app)/requests/shift'),
      color: Colors.warning,
    },
    {
      title: 'View Requests',
      subtitle: 'Check request status',
      onPress: () => router.push('/(app)/requests/list'),
      color: Colors.secondary,
    },
  ];

  const StatCard = ({ title, value, color = Colors.primary }: { title: string; value: number; color?: string }) => (
    <ModernCard variant="elevated" style={styles.statCard}>
      <View style={styles.statContent}>
        <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
          <View style={[styles.statDot, { backgroundColor: color }]} />
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </View>
    </ModernCard>
  );

  const QuickActionCard = ({ title, subtitle, onPress, color }: typeof quickActions[0]) => (
    <ModernCard variant="outlined" style={styles.actionCard}>
      <View style={styles.actionContent}>
        <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
          <View style={[styles.actionDot, { backgroundColor: color }]} />
        </View>
        <View style={styles.actionInfo}>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <ModernButton
        title="Go"
        onPress={onPress}
        variant="ghost"
        size="small"
      />
    </ModernCard>
  );

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <Animated.View 
        style={[
          styles.animatedContent,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.username}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{user?.role}</Text>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard title="Total Requests" value={stats.totalRequests} color={Colors.primary} />
            <StatCard title="Pending" value={stats.pendingRequests} color={Colors.warning} />
            <StatCard title="Approved" value={stats.approvedRequests} color={Colors.success} />
            <StatCard title="Notifications" value={stats.unreadNotifications} color={Colors.info} />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <QuickActionCard key={index} {...action} />
            ))}
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  animatedContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  greeting: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
  },
  userName: {
    ...Typography.headingLarge,
    marginTop: Spacing.xs,
  },
  badge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    ...Typography.labelMedium,
    color: Colors.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.headingMedium,
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    ...Typography.headingLarge,
    marginBottom: Spacing.xs,
  },
  statTitle: {
    ...Typography.bodyMedium,
  },
  actionsGrid: {
    gap: Spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    ...Typography.labelLarge,
    marginBottom: Spacing.xs,
  },
  actionSubtitle: {
    ...Typography.bodySmall,
  },
});
