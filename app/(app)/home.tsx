
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Animated } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { ModernCard } from '../../components/ui/ModernCard';
import { ModernButton } from '../../components/ui/ModernButton';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme/theme';
import { FontAwesome5 } from '@expo/vector-icons';
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
  const { db } = useDatabase();
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

    if (db && user) {
      loadDashboardData();
    }
  }, [db, user]);

  // Add a separate effect to refresh data when component becomes visible
  useEffect(() => {
    if (db && user) {
      const interval = setInterval(() => {
        loadDashboardData();
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [db, user]);

  const loadDashboardData = async () => {
    if (!db || !user) {
      console.log('Database or user not available');
      return;
    }

    try {
      console.log('Loading dashboard data for user:', user.username, 'Role:', user.role);

      if (user.role === 'Employee') {
        // Get user's requests from all request tables
        const leaveRequests = await db.getAllAsync(
          'SELECT * FROM leave_requests WHERE user_id = ?',
          [user.id]
        ) as any[];

        const permissionRequests = await db.getAllAsync(
          'SELECT * FROM permission_requests WHERE user_id = ?',
          [user.id]
        ) as any[];

        const shiftRequests = await db.getAllAsync(
          'SELECT * FROM shift_requests WHERE user_id = ?',
          [user.id]
        ) as any[];

        console.log('Employee requests:', { 
          leave: leaveRequests.length, 
          permission: permissionRequests.length, 
          shift: shiftRequests.length 
        });

        const allRequests = [...leaveRequests, ...permissionRequests, ...shiftRequests];

        // Get unread notifications for this user
        const notifications = await db.getAllAsync(
          'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0',
          [user.id]
        ) as any[];

        const newStats = {
          totalRequests: allRequests.length,
          pendingRequests: allRequests.filter(r => r.status === 'Pending').length,
          approvedRequests: allRequests.filter(r => r.status === 'Approved').length,
          rejectedRequests: allRequests.filter(r => r.status === 'Rejected').length,
          unreadNotifications: notifications.length,
        };

        console.log('Employee stats:', newStats);
        setStats(newStats);

      } else if (user.role === 'HOD') {
        // Get all requests for HOD approval from all tables
        const leaveRequests = await db.getAllAsync('SELECT * FROM leave_requests') as any[];
        const permissionRequests = await db.getAllAsync('SELECT * FROM permission_requests') as any[];
        const shiftRequests = await db.getAllAsync('SELECT * FROM shift_requests') as any[];

        console.log('HOD viewing all requests:', { 
          leave: leaveRequests.length, 
          permission: permissionRequests.length, 
          shift: shiftRequests.length 
        });

        const allRequests = [...leaveRequests, ...permissionRequests, ...shiftRequests];
        const pendingRequests = allRequests.filter(r => r.status === 'Pending');

        // Get HOD-specific notifications
        const notifications = await db.getAllAsync(
          'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0',
          [user.id]
        ) as any[];

        const newStats = {
          totalRequests: allRequests.length,
          pendingRequests: pendingRequests.length,
          approvedRequests: allRequests.filter(r => r.status === 'Approved').length,
          rejectedRequests: allRequests.filter(r => r.status === 'Rejected').length,
          unreadNotifications: notifications.length,
        };

        console.log('HOD stats:', newStats);
        setStats(newStats);
      }
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

  const employeeActions = [
    {
      title: 'Leave Request',
      subtitle: 'Apply for leave',
      icon: 'calendar-times',
      onPress: () => router.push('/requests/leave'),
      color: Colors.primary,
    },
    {
      title: 'Permission Request',
      subtitle: 'Request permission',
      icon: 'user-clock',
      onPress: () => router.push('/requests/permission'),
      color: Colors.success,
    },
    {
      title: 'Shift Change',
      subtitle: 'Request shift change',
      icon: 'exchange-alt',
      onPress: () => router.push('/requests/shift'),
      color: Colors.warning,
    },
    {
      title: 'My Requests',
      subtitle: 'View request history',
      icon: 'list-alt',
      onPress: () => router.push('/requests'),
      color: Colors.secondary,
    },
  ];

  const hodActions = [
    {
      title: 'Approve Requests',
      subtitle: 'Review pending requests',
      icon: 'tasks',
      onPress: () => router.push('/admin'),
      color: Colors.primary,
    },
    {
      title: 'All Requests',
      subtitle: 'View all requests',
      icon: 'clipboard-list',
      onPress: () => router.push('/requests/list'),
      color: Colors.info,
    },
    {
      title: 'Monthly Limits',
      subtitle: 'Set monthly limits',
      icon: 'cogs',
      onPress: () => router.push('/admin/limits'),
      color: Colors.success,
    },
    {
      title: 'Duty Roster',
      subtitle: 'Upload duty roster',
      icon: 'calendar-alt',
      onPress: () => router.push('/admin/roster'),
      color: Colors.warning,
    },
  ];

  const quickActions = user?.role === 'HOD' ? hodActions : employeeActions;

  const StatCard = ({ title, value, icon, color = Colors.primary }: { title: string; value: number; icon: string; color?: string }) => (
    <ModernCard variant="elevated" style={styles.statCard}>
      <View style={styles.statContent}>
        <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
          <FontAwesome5 name={icon} size={20} color={color} />
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </View>
    </ModernCard>
  );

  const QuickActionCard = ({ title, subtitle, icon, onPress, color }: typeof quickActions[0]) => (
    <ModernCard variant="outlined" style={styles.actionCard}>
      <View style={styles.actionContent}>
        <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
          <FontAwesome5 name={icon} size={18} color={color} />
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
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.username}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.badge}>
              <FontAwesome5 
                name={user?.role === 'HOD' ? 'crown' : 'user'} 
                size={12} 
                color={Colors.primary} 
                style={{ marginRight: 4 }}
              />
              <Text style={styles.badgeText}>{user?.role}</Text>
            </View>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="chart-pie" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Overview</Text>
          </View>
          <View style={styles.statsGrid}>
            {user?.role === 'Employee' ? (
              <>
                <StatCard title="My Requests" value={stats.totalRequests} icon="file-alt" color={Colors.primary} />
                <StatCard title="Pending" value={stats.pendingRequests} icon="clock" color={Colors.warning} />
                <StatCard title="Approved" value={stats.approvedRequests} icon="check-circle" color={Colors.success} />
                <StatCard title="Notifications" value={stats.unreadNotifications} icon="bell" color={Colors.info} />
              </>
            ) : (
              <>
                <StatCard title="All Requests" value={stats.totalRequests} icon="clipboard-list" color={Colors.primary} />
                <StatCard title="Need Approval" value={stats.pendingRequests} icon="exclamation-triangle" color={Colors.warning} />
                <StatCard title="Approved" value={stats.approvedRequests} icon="thumbs-up" color={Colors.success} />
                <StatCard title="Rejected" value={stats.rejectedRequests} icon="times-circle" color={Colors.error} />
              </>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="bolt" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
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
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
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
    flexDirection: 'row',
    alignItems: 'center',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.headingMedium,
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
  statInfo: {
    flex: 1,
  },
  statValue: {
    ...Typography.headingLarge,
    marginBottom: Spacing.xs,
  },
  statTitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
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
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    ...Typography.labelLarge,
    marginBottom: Spacing.xs,
  },
  actionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});
