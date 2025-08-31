import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useDatabase } from '../../../context/DatabaseContext';
import { useAuth } from '../../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '../../../theme/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import { ModernCard } from '../../../components/ui/ModernCard';
import { ModernButton } from '../../../components/ui/ModernButton';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';

interface RequestItem {
  id: number;
  type: string;
  status: string;
  date?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  current_shift?: string;
  requested_shift?: string;
  requester_shift?: string; // Added for shift swap
  target_shift?: string; // Added for shift swap
  reason: string;
  created_at: string;
}

const statusColors = {
  Pending: Colors.warning,
  Approved: Colors.success,
  Rejected: Colors.error,
};

const statusIcons = {
  Pending: 'clock',
  Approved: 'check-circle',
  Rejected: 'times-circle',
};

export default function MyRequestsScreen() {
  const { supabaseClient } = useDatabase();
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [supabaseClient, user]);

  const fetchRequests = async () => {
    if (!supabaseClient || !user) return;

    try {
      console.log('Fetching requests for user:', user.id);
      let allRequests: RequestItem[] = [];

      // Get leave requests
      try {
        const { data: leaveRequests } = await supabaseClient
          .from('leave_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (leaveRequests) {
          const formattedLeaveRequests = leaveRequests.map(req => ({
            ...req,
            type: 'Leave'
          }));
          allRequests.push(...formattedLeaveRequests);
        }
        console.log('Leave requests found:', leaveRequests?.length || 0);
      } catch (error) {
        console.error('Error fetching leave requests:', error);
      }

      // Get permission requests
      try {
        const { data: permissionRequests } = await supabaseClient
          .from('permission_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (permissionRequests) {
          const formattedPermissionRequests = permissionRequests.map(req => ({
            ...req,
            type: 'Permission'
          }));
          allRequests.push(...formattedPermissionRequests);
        }
        console.log('Permission requests found:', permissionRequests?.length || 0);
      } catch (error) {
        console.error('Error fetching permission requests:', error);
      }

      // Get shift requests
      try {
        const { data: shiftRequests } = await supabaseClient
          .from('shift_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (shiftRequests) {
          const formattedShiftRequests = shiftRequests.map(req => ({
            ...req,
            type: 'Shift'
          }));
          allRequests.push(...formattedShiftRequests);
        }
        console.log('Shift requests found:', shiftRequests?.length || 0);
      } catch (error) {
        console.error('Error fetching shift requests:', error);
      }

      // Sort all requests by created_at
      allRequests.sort((a, b) => {
        const dateA = new Date(a.created_at || a.date || 0);
        const dateB = new Date(b.created_at || b.date || 0);
        return dateB.getTime() - dateA.getTime();
      });

      console.log('Total requests found:', allRequests.length);
      setRequests(allRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      Alert.alert('Error', 'Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
  };

  const quickActions = [
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
  ];

  const getRequestDetails = (request: RequestItem) => {
    switch (request.type) {
      case 'Leave':
        return `${request.start_date || request.date} to ${request.end_date || request.start_date || request.date}`;
      case 'Permission':
        return `${request.date} (${request.start_time || 'N/A'} - ${request.end_time || 'N/A'})`;
      case 'Shift':
        return `${request.date} (${request.current_shift || 'N/A'} → ${request.requested_shift || 'N/A'})`;
      case 'Shift Swap':
        return `${request.date} (${request.requester_shift || 'N/A'} ↔ ${request.target_shift || 'N/A'})`;
      default:
        return request.date || request.start_date || 'No date specified';
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
      case 'Shift Swap': // Added for shift swap
        return 'exchange-alt';
      default:
        return 'file-alt';
    }
  };

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
            <Text style={styles.requestDate}>
              Submitted: {new Date(item.created_at).toLocaleDateString()}
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
              {item.status}
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

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp} style={styles.header}>
        <View style={styles.headerIcon}>
          <FontAwesome5 name="user-clock" size={32} color={Colors.primary} />
        </View>
        <Text style={styles.title}>My Requests</Text>
        <Text style={styles.subtitle}>Manage your leave, permission, and shift requests</Text>
      </Animated.View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.actionButton} onPress={action.onPress}>
              <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                <FontAwesome5 name={action.icon} size={20} color={action.color} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Requests List */}
      <View style={styles.requestsSection}>
        <Text style={styles.sectionTitle}>Request History</Text>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <FontAwesome5 name="spinner" size={32} color={Colors.primary} />
            <Text style={styles.loadingText}>Loading requests...</Text>
          </View>
        ) : (
          <FlatList
            data={requests}
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
                <Text style={styles.emptyTitle}>No requests yet</Text>
                <Text style={styles.emptySubtitle}>
                  Start by creating your first request using the quick actions above
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
  quickActions: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    ...Typography.headingMedium,
    marginBottom: Spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: Spacing.md,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionTitle: {
    ...Typography.labelMedium,
    textAlign: 'center',
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
});