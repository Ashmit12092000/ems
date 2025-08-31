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
  requester_shift?: string;
  target_shift?: string;
  target_username?: string;
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
  const { user } = useAuth();
  const { supabaseClient } = useDatabase();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected'>('all');

  const isHOD = user?.role === 'HOD';

  const fetchRequests = useCallback(async () => {
    if (!supabaseClient || !user || !isHOD) return;

    setLoading(true);
    try {
      // Fetch leave requests
      const leaveRequestsQuery = supabaseClient.from('leave_requests')
        .select('*, users (username)')
        .in('status', ['approved', 'rejected'])
        .order('created_at', { ascending: false });
      
      const { data: leaveRequestsData, error: leaveRequestsError } = await leaveRequestsQuery;
      if (leaveRequestsError) throw leaveRequestsError;

      const leaveRequests = leaveRequestsData.map(lr => ({
        ...lr,
        username: lr.users?.username,
        type: 'Leave',
        user_id: lr.user_id,
        created_at: lr.created_at,
        status: lr.status,
        start_date: lr.start_date,
        end_date: lr.end_date,
        reason: lr.reason,
        id: lr.id,
      })) as RequestItem[];

      // Fetch permission requests
      const permissionRequestsQuery = supabaseClient.from('permission_requests')
        .select('*, users (username)')
        .in('status', ['approved', 'rejected'])
        .order('created_at', { ascending: false });

      const { data: permissionRequestsData, error: permissionRequestsError } = await permissionRequestsQuery;
      if (permissionRequestsError) throw permissionRequestsError;

      const permissionRequests = permissionRequestsData.map(pr => ({
        ...pr,
        username: pr.users?.username,
        type: 'Permission',
        user_id: pr.user_id,
        created_at: pr.created_at,
        status: pr.status,
        date: pr.date,
        start_time: pr.start_time,
        end_time: pr.end_time,
        reason: pr.reason,
        id: pr.id,
      })) as RequestItem[];

      // Fetch shift requests
      const shiftRequestsQuery = supabaseClient.from('shift_requests')
        .select('*, users (username)')
        .in('status', ['approved', 'rejected'])
        .order('created_at', { ascending: false });

      const { data: shiftRequestsData, error: shiftRequestsError } = await shiftRequestsQuery;
      if (shiftRequestsError) throw shiftRequestsError;

      const shiftRequests = shiftRequestsData.map(sr => ({
        ...sr,
        username: sr.users?.username,
        type: 'Shift',
        user_id: sr.user_id,
        created_at: sr.created_at,
        status: sr.status,
        date: sr.date,
        current_shift: sr.current_shift,
        requested_shift: sr.requested_shift,
        reason: sr.reason,
        id: sr.id,
      })) as RequestItem[];

      // Fetch shift swap requests
      const shiftSwapRequestsQuery = supabaseClient.from('shift_swaps')
        .select('*, requester:users (username), target:users!target_id (username)')
        .in('status', ['approved', 'rejected'])
        .order('created_at', { ascending: false });

      const { data: shiftSwapRequestsData, error: shiftSwapRequestsError } = await shiftSwapRequestsQuery;
      if (shiftSwapRequestsError) throw shiftSwapRequestsError;

      const shiftSwapRequests = shiftSwapRequestsData.map(ssr => ({
        ...ssr,
        username: ssr.requester?.username,
        target_username: ssr.target?.username,
        type: 'Shift Swap',
        user_id: ssr.requester_id,
        created_at: ssr.created_at,
        status: ssr.status,
        date: ssr.date,
        requester_shift: ssr.requester_shift,
        target_shift: ssr.target_shift,
        reason: ssr.reason,
        id: ssr.id,
      })) as RequestItem[];
      
      // Fetch old requests from the legacy table (if any, assuming it's not migrated yet)
      // This part would need adjustment based on how legacy data is handled or migrated.
      // For now, we'll assume legacy data is either migrated or not required in this view.
      // If legacy data needs to be fetched, a similar Supabase query would be needed for that table.

      const allRequests = [...leaveRequests, ...permissionRequests, ...shiftRequests, ...shiftSwapRequests]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setRequests(allRequests);
    } catch (error) {
      console.error('Error fetching request history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabaseClient, user, isHOD]);

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
      case 'Shift Swap':
        return `${request.date} (${request.requester_shift} ↔ ${request.target_shift})`;
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
      case 'Shift Swap':
        return 'sync-alt';
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