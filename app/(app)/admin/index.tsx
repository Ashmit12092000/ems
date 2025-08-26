import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useDatabase } from '../../../context/DatabaseContext';
import { useAuth } from '../../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '../../../theme/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import { ModernCard } from '../../../components/ui/ModernCard';
import { ModernButton } from '../../../components/ui/ModernButton';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

interface Request {
  id: number;
  user_id: number;
  type: string;
  status: string;
  date: string;
  reason: string;
  created_at: string;
  username?: string;
}

export default function AdminDashboard() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    if (!db) return;

    try {
      const result = await db.getAllAsync(
        `SELECT r.*, u.username 
         FROM requests r 
         JOIN users u ON r.user_id = u.id 
         WHERE r.status = 'pending'
         ORDER BY r.created_at DESC`
      ) as Request[];

      setRequests(result);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
  };

  const handleRequestAction = async (requestId: number, action: 'approved' | 'rejected') => {
    if (!db) return;

    Alert.alert(
      `${action === 'approved' ? 'Approve' : 'Reject'} Request`,
      `Are you sure you want to ${action === 'approved' ? 'approve' : 'reject'} this request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'approved' ? 'Approve' : 'Reject',
          style: action === 'approved' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await db.runAsync(
                'UPDATE requests SET status = ? WHERE id = ?',
                [action, requestId]
              );

              // Create notification for the user who made the request
              const request = requests.find(r => r.id === requestId);
              if (request) {
                await db.runAsync(
                  'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
                  [
                    request.user_id,
                    `Request ${action}`,
                    `Your ${request.type.toLowerCase()} request for ${request.date} has been ${action}`,
                    action === 'approved' ? 'success' : 'warning'
                  ]
                );
              }

              Alert.alert('Success', `Request ${action} successfully`);
              fetchRequests(); // Refresh the list
            } catch (error) {
              console.error('Error updating request:', error);
              Alert.alert('Error', 'Failed to update request');
            }
          }
        }
      ]
    );
  };

  const renderRequest = ({ item }: { item: Request }) => (
    <Animated.View entering={FadeInDown}>
      <ModernCard style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <Text style={styles.requestType}>{item.type} Request</Text>
            <Text style={styles.requestUser}>by {item.username}</Text>
          </View>
          <View style={[styles.statusBadge, styles.pendingBadge]}>
            <Text style={styles.statusText}>Pending</Text>
          </View>
        </View>

        <View style={styles.requestDetails}>
          <View style={styles.detailRow}>
            <FontAwesome5 name="calendar" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{new Date(item.date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <FontAwesome5 name="comment" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText} numberOfLines={2}>{item.reason}</Text>
          </View>
          <View style={styles.detailRow}>
            <FontAwesome5 name="clock" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>
              Submitted: {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <ModernButton
            title="Reject"
            onPress={() => handleRequestAction(item.id, 'rejected')}
            variant="outline"
            style={[styles.actionButton, styles.rejectButton]}
            textStyle={styles.rejectButtonText}
          />
          <ModernButton
            title="Approve"
            onPress={() => handleRequestAction(item.id, 'approved')}
            style={[styles.actionButton, styles.approveButton]}
          />
        </View>
      </ModernCard>
    </Animated.View>
  );

  if (user?.role !== 'HOD') {
    return (
      <View style={styles.container}>
        <ModernCard style={styles.errorCard}>
          <FontAwesome5 name="shield-alt" size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>Access Denied</Text>
          <Text style={styles.errorText}>HOD privileges required to access this section.</Text>
        </ModernCard>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp} style={styles.header}>
        <View style={styles.headerIcon}>
          <FontAwesome5 name="tasks" size={32} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Request Approval</Text>
        <Text style={styles.subtitle}>Review and approve employee requests</Text>
      </Animated.View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <FontAwesome5 name="spinner" size={32} color={Colors.primary} />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequest}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Animated.View entering={FadeInDown} style={styles.emptyContainer}>
              <FontAwesome5 name="check-circle" size={64} color={Colors.success} />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>No pending requests to review</Text>
            </Animated.View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.headingLarge,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  listContainer: {
    padding: Spacing.lg,
  },
  requestCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  requestInfo: {
    flex: 1,
  },
  requestType: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  requestUser: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  pendingBadge: {
    backgroundColor: Colors.warning + '20',
  },
  statusText: {
    ...Typography.labelSmall,
    color: Colors.warning,
    fontWeight: '600',
  },
  requestDetails: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  detailText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  rejectButton: {
    borderColor: Colors.error,
  },
  rejectButtonText: {
    color: Colors.error,
  },
  approveButton: {
    backgroundColor: Colors.success,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.headingMedium,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorCard: {
    margin: Spacing.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  errorTitle: {
    ...Typography.headingMedium,
    color: Colors.error,
  },
  errorText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});