
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../context/DatabaseContext';
import { useFocusEffect } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../../theme/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import { ModernCard } from '../../../components/ui/ModernCard';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

interface RequestItem {
  id: number;
  user_id: number;
  type: string;
  status: string;
  date?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  current_shift?: string;
  requested_shift?: string;
  reason: string;
  created_at: string;
  username?: string;
}

const statusColors = {
  approved: Colors.success,
  rejected: Colors.error,
};

const statusIcons = {
  approved: 'check-circle',
  rejected: 'times-circle',
};

export default function RequestHistoryScreen() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected'>('all');

  const isHOD = user?.role === 'HOD';

  const fetchRequests = useCallback(async () => {
    if (!db || !user || !isHOD) return;

    setLoading(true);
    try {
      // Get leave requests
      const leaveRequests = await db.getAllAsync(
        `SELECT lr.*, u.username, 'Leave' as type FROM leave_requests lr 
         JOIN users u ON lr.user_id = u.id 
         WHERE lr.status IN ('approved', 'rejected')
         ORDER BY lr.created_at DESC`
      ) as RequestItem[];

      // Get permission requests
      const permissionRequests = await db.getAllAsync(
        `SELECT pr.*, u.username, 'Permission' as type FROM permission_requests pr 
         JOIN users u ON pr.user_id = u.id 
         WHERE pr.status IN ('approved', 'rejected')
         ORDER BY pr.created_at DESC`
      ) as RequestItem[];

      // Get shift requests
      const shiftRequests = await db.getAllAsync(
        `SELECT sr.*, u.username, 'Shift' as type FROM shift_requests sr 
         JOIN users u ON sr.user_id = u.id 
         WHERE sr.status IN ('approved', 'rejected')
         ORDER BY sr.created_at DESC`
      ) as RequestItem[];

      // Get old requests from the legacy table (no created_at column)
      const oldRequests = await db.getAllAsync(
        `SELECT r.*, u.username, r.date as created_at FROM requests r 
         JOIN users u ON r.user_id = u.id 
         WHERE r.status IN ('approved', 'rejected')
         ORDER BY r.id DESC`
      ) as RequestItem[];

      const allRequests = [...leaveRequests, ...permissionRequests, ...shiftRequests, ...oldRequests]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setRequests(allRequests);
    } catch (error) {
      console.error('Error fetching request history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [db, user, isHOD]);

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [fetchRequests])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
  };

  const getRequestDetails = (request: RequestItem) => {
    switch (request.type) {
      case 'Leave':
        return `${request.start_date} to ${request.end_date || request.start_date}`;
      case 'Permission':
        return `${request.date} (${request.start_time} - ${request.end_time})`;
      case 'Shift':
        return `${request.date} (${request.current_shift} → ${request.requested_shift})`;
      default:
        return request.date || 'No date specified';
    }
  };

  const getRequestIcon = (type: string) => {
    switch (type) {
      case 'Leave':
        return 'calendar-times';
      case 'Permission':
        return 'user-clock';
      case 'Shift':
        return 'exchange-alt';
      default:
        return 'file-alt';
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const renderRequest = ({ item }: { item: RequestItem }) => (
    <Animated.View entering={FadeInDown}>
      <ModernCard style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <View style={styles.requestTypeRow}>
              <FontAwesome5 
                name={getRequestIcon(item.type)} 
                size={16} 
                color={Colors.primary} 
              />
              <Text style={styles.requestType}>{item.type} Request</Text>
            </View>
            <Text style={styles.employeeName}>Employee: {item.username}</Text>
            <Text style={styles.requestDate}>
              Processed: {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: statusColors[item.status as keyof typeof statusColors] + '20' }
          ]}>
            <FontAwesome5 
              name={statusIcons[item.status as keyof typeof statusIcons]} 
              size={12} 
              color={statusColors[item.status as keyof typeof statusColors]} 
            />
            <Text style={[
              styles.statusText,
              { color: statusColors[item.status as keyof typeof statusColors] }
            ]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.requestDetails}>
          <Text style={styles.detailText}>{getRequestDetails(item)}</Text>
          <Text style={styles.reasonText} numberOfLines={2}>{item.reason}</Text>
        </View>
      </ModernCard>
    </Animated.View>
  );

  if (!isHOD) {
    return (
      <View style={styles.unauthorizedContainer}>
        <FontAwesome5 name="exclamation-triangle" size={64} color={Colors.error} />
        <Text style={styles.unauthorizedText}>Access Denied</Text>
        <Text style={styles.unauthorizedSubtext}>Only HODs can view request history</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp} style={styles.header}>
        <View style={styles.headerIcon}>
          <FontAwesome5 name="history" size={32} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Request History</Text>
        <Text style={styles.subtitle}>View all processed requests</Text>
      </Animated.View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({requests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'approved' && styles.filterButtonActive]}
          onPress={() => setFilter('approved')}
        >
          <Text style={[styles.filterText, filter === 'approved' && styles.filterTextActive]}>
            Approved ({requests.filter(r => r.status === 'approved').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'rejected' && styles.filterButtonActive]}
          onPress={() => setFilter('rejected')}
        >
          <Text style={[styles.filterText, filter === 'rejected' && styles.filterTextActive]}>
            Rejected ({requests.filter(r => r.status === 'rejected').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Requests List */}
      <View style={styles.requestsSection}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading request history...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredRequests}
            renderItem={renderRequest}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Animated.View entering={FadeInDown} style={styles.emptyContainer}>
                <FontAwesome5 name="inbox" size={64} color={Colors.textSecondary} />
                <Text style={styles.emptyTitle}>No {filter === 'all' ? '' : filter} requests</Text>
                <Text style={styles.emptySubtitle}>
                  {filter === 'all' 
                    ? 'No processed requests found'
                    : `No ${filter} requests found`
                  }
                </Text>
              </Animated.View>
            }
          />
        )}
      </View>
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
  filterContainer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  requestsSection: {
    flex: 1,
    padding: Spacing.lg,
  },
  listContainer: {
    paddingBottom: Spacing.lg,
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
  requestTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  requestType: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  employeeName: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  requestDate: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  statusText: {
    ...Typography.labelSmall,
    fontWeight: '600',
  },
  requestDetails: {
    gap: Spacing.sm,
  },
  detailText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  reasonText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
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
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  unauthorizedText: {
    ...Typography.headingLarge,
    color: Colors.error,
  },
  unauthorizedSubtext: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
