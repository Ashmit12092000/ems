
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../context/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme/theme';
import { ModernCard } from '../../components/ui/ModernCard';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

interface Notification {
  id: number;
  message: string;
  is_read: number;
  created_at: string;
}

export default function NotificationsScreen() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    if (!db || !user) return;

    try {
      const result = await db.getAllAsync(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
        [user.id]
      );
      setNotifications(result as Notification[]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (id: number) => {
    if (!db) return;

    try {
      await db.runAsync('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!db || !user) return;

    try {
      await db.runAsync('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [user.id]);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [db, user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeInUp.delay(100)}
        style={styles.header}
      >
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <Animated.View 
            entering={FadeInDown.delay(200)}
            style={styles.emptyState}
          >
            <FontAwesome5 name="bell" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>You'll see updates and alerts here</Text>
          </Animated.View>
        ) : (
          notifications.map((notification, index) => (
            <Animated.View
              key={notification.id}
              entering={FadeInDown.delay(index * 100)}
            >
              <ModernCard style={[
                styles.notificationCard,
                notification.is_read === 0 && styles.unreadCard
              ]}>
                <TouchableOpacity
                  onPress={() => notification.is_read === 0 && markAsRead(notification.id)}
                  style={styles.notificationContent}
                >
                  <View style={styles.notificationHeader}>
                    <View style={styles.iconContainer}>
                      <FontAwesome5 
                        name="info-circle" 
                        size={20} 
                        color={notification.is_read === 0 ? Colors.primary : Colors.textSecondary} 
                      />
                    </View>
                    {notification.is_read === 0 && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={[
                    styles.message,
                    notification.is_read === 0 && styles.unreadMessage
                  ]}>
                    {notification.message}
                  </Text>
                  <Text style={styles.timestamp}>
                    {formatDate(notification.created_at)}
                  </Text>
                </TouchableOpacity>
              </ModernCard>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  markAllButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  markAllText: {
    ...Typography.bodySmall,
    color: Colors.white,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    marginTop: Spacing.xxl,
  },
  emptyText: {
    ...Typography.h3,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  notificationCard: {
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unreadCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  notificationContent: {
    padding: Spacing.lg,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  message: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  unreadMessage: {
    fontWeight: '600',
  },
  timestamp: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
