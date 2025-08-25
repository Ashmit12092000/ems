
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ScrollView,
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
  type: string;
  date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  user_id: number;
  username?: string;
}

export default function RequestsListScreen() {
  const { database } = useDatabase();
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    if (!database || !user) return;

    try {
      let query = `
        SELECT r.*, u.username 
        FROM requests r 
        LEFT JOIN users u ON r.user_id = u.id
      `;
      let params: any[] = [];

      if (user.role === 'Employee') {
        query += ' WHERE r.user_id = ?';
        params.push(user.id);
      }

      if (filter !== 'all') {
        query += user.role === 'Employee' ? ' AND r.status = ?' : ' WHERE r.status = ?';
        params.push(filter);
      }

      query += ' ORDER BY r.id DESC';

      const result = await database.getAllAsync(query, params) as Request[];
      setRequests(result);
    } catch (error) {
      console.error('Error loading requests:', error);
      Alert.alert('Error', 'Failed to load requests');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const updateRequestStatus = async (requestId: number, status: 'approved' | 'rejected') => {
    if (!database) return;

    try {
      await database.runAsync(
        'UPDATE requests SET status = ? WHERE id = ?',
        [status, requestId]
      );
      loadRequests();
      Alert.alert('Success', `Request ${status} successfully`);
    } catch (error) {
      console.error('Error updating request:', error);
      Alert.alert('Error', 'Failed to update request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return Colors.success;
      case 'rejected': return Colors.error;
      case 'pending': return Colors.warning;
      default: return Colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return 'check-circle';
      case 'rejected': return 'times-circle';
      case 'pending': return 'clock';
      default: return 'question-circle';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'leave': return 'calendar-times';
      case 'permission': return 'user-clock';
      case 'shift': return 'exchange-alt';
      default: return 'file-alt';
    }
  };

  const renderFilterButton = (filterType: typeof filter, label: string, count: number) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.activeFilterButton
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === filterType && styles.activeFilterButtonText
      ]}>
        {label}
      </Text>
      <View style={[
        styles.countBadge,
        filter === filterType && styles.activeCountBadge
      ]}>
        <Text style={[
          styles.countText,
          filter === filterType && styles.activeCountText
        ]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderRequestItem = ({ item, index }: { item: Request; index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 100)}>
      <ModernCard style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.requestTypeContainer}>
            <View style={[styles.typeIconContainer, { backgroundColor: Colors.primary + '15' }]}>
              <FontAwesome5 name={getTypeIcon(item.type)} size={16} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.requestType}>{item.type}</Text>
              {user?.role === 'HOD' && item.username && (
                <Text style={styles.requestUser}>by {item.username}</Text>
              )}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            <FontAwesome5 
              name={getStatusIcon(item.status)} 
              size={12} 
              color={getStatusColor(item.status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.requestDetails}>
          <View style={styles.detailRow}>
            <FontAwesome5 name="calendar" size={14} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{item.date}</Text>
          </View>
          {item.reason && (
            <View style={styles.detailRow}>
              <FontAwesome5 name="comment" size={14} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{item.reason}</Text>
            </View>
          )}
        </View>

        {user?.role === 'HOD' && item.status === 'pending' && (
          <View style={styles.actionButtons}>
            <ModernButton
              title="Approve"
              onPress={() => updateRequestStatus(item.id, 'approved')}
              variant="primary"
              size="small"
              style={styles.actionButton}
            />
            <ModernButton
              title="Reject"
              onPress={() => updateRequestStatus(item.id, 'rejected')}
              variant="outline"
              size="small"
              style={styles.actionButton}
            />
          </View>
        )}
      </ModernCard>
    </Animated.View>
  );

  const getFilterCounts = () => {
    return {
      all: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
    };
  };

  const counts = getFilterCounts();

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown} style={styles.header}>
        <Text style={styles.title}>
          {user?.role === 'HOD' ? 'All Requests' : 'My Requests'}
        </Text>
        <Text style={styles.subtitle}>
          Manage and track request status
        </Text>
      </Animated.View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        {renderFilterButton('all', 'All', counts.all)}
        {renderFilterButton('pending', 'Pending', counts.pending)}
        {renderFilterButton('approved', 'Approved', counts.approved)}
        {renderFilterButton('rejected', 'Rejected', counts.rejected)}
      </ScrollView>

      <FlatList
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyContainer}>
            <FontAwesome5 name="inbox" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No requests found</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' 
                ? 'No requests have been submitted yet' 
                : `No ${filter} requests found`}
            </Text>
          </Animated.View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeFilterButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  activeFilterButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    minWidth: 20,
    alignItems: 'center',
  },
  activeCountBadge: {
    backgroundColor: Colors.white + '20',
  },
  countText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activeCountText: {
    color: Colors.white,
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  requestCard: {
    marginBottom: Spacing.md,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  requestTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  requestType: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  requestUser: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
    marginLeft: Spacing.xs,
    textTransform: 'capitalize',
  },
  requestDetails: {
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  detailText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
