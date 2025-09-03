
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { Colors, Sizing, Typography } from '../../../theme/theme';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { supabase } from '../../../lib/supabase';

interface RequestDetails {
  id: number;
  user_id: number;
  type: string;
  reason: string;
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
  status: 'pending' | 'approved' | 'rejected' | 'pending_hod_approval';
  username?: string;
  created_at?: string;
}

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const isHOD = user?.role === 'HOD';

  useEffect(() => {
    if (!isHOD) {
      router.back();
      return;
    }
    fetchRequestDetails();
  }, [id, isHOD]);

  const fetchRequestDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Try to find the request in different tables
      const tables = [
        { table: 'leave_requests', type: 'Leave' },
        { table: 'permission_requests', type: 'Permission' },
        { table: 'shift_requests', type: 'Shift' },
        { table: 'shift_swaps', type: 'Shift Swap' }
      ];

      let foundRequest: RequestDetails | null = null;

      for (const { table, type } of tables) {
        if (table === 'shift_swaps') {
          const { data, error } = await supabase
            .from(table)
            .select(`
              *,
              requester:users!requester_id(username),
              target:users!target_id(username)
            `)
            .eq('id', id)
            .eq('status', 'pending_hod_approval')
            .single();

          if (!error && data) {
            foundRequest = {
              ...data,
              type,
              username: data.requester?.username,
              target_username: data.target?.username,
              user_id: data.requester_id
            };
            break;
          }
        } else {
          const { data, error } = await supabase
            .from(table)
            .select(`
              *,
              users(username)
            `)
            .eq('id', id)
            .eq('status', 'pending')
            .single();

          if (!error && data) {
            foundRequest = {
              ...data,
              type,
              username: data.users?.username
            };
            break;
          }
        }
      }

      setRequest(foundRequest);
    } catch (error) {
      console.error('Error fetching request details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    console.log('Approve button clicked');
    await updateRequestStatus('approved');
  };

  const handleReject = async () => {
    console.log('Reject button clicked');
    await updateRequestStatus('rejected');
  };

  const updateRequestStatus = async (status: 'approved' | 'rejected') => {
    if (!request) {
      console.log('Missing request:', { hasRequest: !!request });
      Alert.alert('Error', 'Request information is missing.');
      return;
    }

    console.log('Updating request:', { id: request.id, type: request.type, status });

    // Show loading state
    Alert.alert('Processing', `${status === 'approved' ? 'Approving' : 'Rejecting'} request...`);

    try {
      // Determine table name based on request type
      let tableName = 'requests';
      if (request.type === 'Leave') {
        tableName = 'leave_requests';
      } else if (request.type === 'Permission') {
        tableName = 'permission_requests';
      } else if (request.type === 'Shift') {
        tableName = 'shift_requests';
      } else if (request.type === 'Shift Swap') {
        tableName = 'shift_swaps';
      }

      console.log('Using table:', tableName);

      // Update request status
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ status })
        .eq('id', request.id);

      if (updateError) {
        throw updateError;
      }

      console.log('Update successful');

      // Create notification
      const dateField = request.start_date || request.date || 'N/A';
      const message = `Your ${request.type.toLowerCase()} request for ${dateField} has been ${status}.`;
      
      try {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: request.user_id,
            message,
            created_at: new Date().toISOString()
          });

        if (notificationError) {
          console.error('Failed to create notification:', notificationError);
        }
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError);
        // Continue even if notification fails - the main action succeeded
      }

      Alert.alert(
        'Success', 
        `Request has been ${status} successfully.`, 
        [
          { 
            text: 'View History', 
            onPress: () => router.replace('/requests/history') 
          },
          { 
            text: 'Back to List', 
            onPress: () => router.back() 
          }
        ]
      );

    } catch (error) {
      console.error('Error updating request:', error);
      Alert.alert('Error', `Failed to ${status} request: ${error.message}`);
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

  const getRequestDetails = () => {
    if (!request) return '';
    
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading request details...</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome5 name="exclamation-triangle" size={64} color={Colors.danger} />
        <Text style={styles.errorTitle}>Request Not Found</Text>
        <Text style={styles.errorText}>The request you're looking for doesn't exist or has already been processed.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Animated.View entering={FadeInUp} style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: Colors.primary + '20' }]}>
          <FontAwesome5 name={getRequestIcon(request.type)} size={32} color={Colors.primary} />
        </View>
        <Text style={styles.title}>{request.type} Request</Text>
        <Text style={styles.subtitle}>Request Details & Actions</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200)} style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Employee Information</Text>
        <View style={styles.detailRow}>
          <FontAwesome5 name="user" size={16} color={Colors.primary} />
          <Text style={styles.detailLabel}>Employee:</Text>
          <Text style={styles.detailValue}>{request.username}</Text>
        </View>

        <Text style={styles.sectionTitle}>Request Information</Text>
        <View style={styles.detailRow}>
          <FontAwesome5 name="calendar" size={16} color={Colors.primary} />
          <Text style={styles.detailLabel}>Date/Period:</Text>
          <Text style={styles.detailValue}>{getRequestDetails()}</Text>
        </View>

        {request.type === 'Leave' && (
          <>
            <View style={styles.detailRow}>
              <FontAwesome5 name="calendar-day" size={16} color={Colors.primary} />
              <Text style={styles.detailLabel}>Start Date:</Text>
              <Text style={styles.detailValue}>{request.start_date}</Text>
            </View>
            {request.end_date && (
              <View style={styles.detailRow}>
                <FontAwesome5 name="calendar-day" size={16} color={Colors.primary} />
                <Text style={styles.detailLabel}>End Date:</Text>
                <Text style={styles.detailValue}>{request.end_date}</Text>
              </View>
            )}
          </>
        )}

        {request.type === 'Permission' && (
          <>
            <View style={styles.detailRow}>
              <FontAwesome5 name="clock" size={16} color={Colors.primary} />
              <Text style={styles.detailLabel}>Start Time:</Text>
              <Text style={styles.detailValue}>{request.start_time}</Text>
            </View>
            <View style={styles.detailRow}>
              <FontAwesome5 name="clock" size={16} color={Colors.primary} />
              <Text style={styles.detailLabel}>End Time:</Text>
              <Text style={styles.detailValue}>{request.end_time}</Text>
            </View>
          </>
        )}

        {request.type === 'Shift' && (
          <>
            <View style={styles.detailRow}>
              <FontAwesome5 name="exchange-alt" size={16} color={Colors.primary} />
              <Text style={styles.detailLabel}>Current Shift:</Text>
              <Text style={styles.detailValue}>{request.current_shift}</Text>
            </View>
            <View style={styles.detailRow}>
              <FontAwesome5 name="arrow-right" size={16} color={Colors.primary} />
              <Text style={styles.detailLabel}>Requested Shift:</Text>
              <Text style={styles.detailValue}>{request.requested_shift}</Text>
            </View>
          </>
        )}

        {request.type === 'Shift Swap' && (
          <>
            <View style={styles.detailRow}>
              <FontAwesome5 name="user-friends" size={16} color={Colors.primary} />
              <Text style={styles.detailLabel}>Target Employee:</Text>
              <Text style={styles.detailValue}>{request.target_username}</Text>
            </View>
            <View style={styles.detailRow}>
              <FontAwesome5 name="exchange-alt" size={16} color={Colors.primary} />
              <Text style={styles.detailLabel}>Requester's Shift:</Text>
              <Text style={styles.detailValue}>{request.requester_shift}</Text>
            </View>
            <View style={styles.detailRow}>
              <FontAwesome5 name="sync-alt" size={16} color={Colors.primary} />
              <Text style={styles.detailLabel}>Target's Shift:</Text>
              <Text style={styles.detailValue}>{request.target_shift}</Text>
            </View>
          </>
        )}

        <View style={styles.detailRow}>
          <FontAwesome5 name="info-circle" size={16} color={Colors.primary} />
          <Text style={styles.detailLabel}>Status:</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{request.status.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Reason</Text>
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonText}>{request.reason}</Text>
        </View>

        {request.created_at && (
          <View style={styles.detailRow}>
            <FontAwesome5 name="clock" size={16} color={Colors.lightText} />
            <Text style={styles.detailLabel}>Submitted:</Text>
            <Text style={styles.detailValue}>{new Date(request.created_at).toLocaleString()}</Text>
          </View>
        )}
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(400)} style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton]} 
            onPress={handleReject}
            activeOpacity={0.7}
          >
            <FontAwesome5 name="times" size={18} color={Colors.white} />
            <Text style={styles.actionButtonText}>Reject Request</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.approveButton]} 
            onPress={handleApprove}
            activeOpacity={0.7}
          >
            <FontAwesome5 name="check" size={18} color={Colors.white} />
            <Text style={styles.actionButtonText}>Approve Request</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: Sizing.padding,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.lightText,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Sizing.padding,
    gap: 16,
  },
  errorTitle: {
    ...Typography.h1,
    fontSize: 24,
    textAlign: 'center',
  },
  errorText: {
    ...Typography.body,
    textAlign: 'center',
    color: Colors.lightText,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Sizing.borderRadius,
    marginTop: 16,
  },
  backButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    ...Typography.h1,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.lightText,
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: Colors.white,
    borderRadius: Sizing.borderRadius,
    padding: Sizing.padding,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    ...Typography.h2,
    fontSize: 18,
    marginBottom: 12,
    marginTop: 16,
    color: Colors.primary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  detailLabel: {
    ...Typography.body,
    fontWeight: '600',
    minWidth: 100,
  },
  detailValue: {
    ...Typography.body,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: Colors.warning + '20',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: 'bold',
    color: Colors.warning,
  },
  reasonContainer: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: Sizing.borderRadius,
    marginBottom: 12,
  },
  reasonText: {
    ...Typography.body,
    lineHeight: 22,
  },
  actionsCard: {
    backgroundColor: Colors.white,
    borderRadius: Sizing.borderRadius,
    padding: Sizing.padding,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: Sizing.borderRadius,
    gap: 8,
  },
  approveButton: {
    backgroundColor: Colors.success,
  },
  rejectButton: {
    backgroundColor: Colors.danger,
  },
  actionButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
