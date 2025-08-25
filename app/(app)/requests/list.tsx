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
  Platform,
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
  scrollContent: {
    padding: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  requestType: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.primary + '20',
  },
  statusText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  requestDetails: {
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  reasonContainer: {
    marginTop: Spacing.sm,
  },
  reasonLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  addButton: {
    position: 'absolute',
    bottom: Spacing.lg + 80,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl + 60,
    right: Spacing.lg,
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    marginHorizontal: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});