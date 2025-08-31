// File: app/(app)/requests/list.tsx
// Updated to create a notification when an HOD approves or rejects a request.

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../context/DatabaseContext';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, Sizing, Typography } from '../../../theme/theme';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface Request {
    id: string;
    user_id: string;
    type: string;
    reason: string;
    date: string;
    start_date?: string;
    end_date?: string;
    status: 'pending' | 'approved' | 'rejected';
    username?: string;
    created_at?: string;
}

export default function RequestListScreen() {
  const { user } = useAuth();
  const { supabaseClient } = useDatabase();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isHOD = user?.role === 'HOD';

  const fetchRequests = useCallback(async () => {
    if (!supabaseClient || !user) return;
    setLoading(true);
    try {
        let result: Request[] = [];
        if (isHOD) {
            // Get leave requests with usernames
            const { data: leaveRequests } = await supabaseClient
              .from('leave_requests')
              .select(`
                *,
                users!inner(username)
              `)
              .eq('status', 'pending')
              .order('created_at', { ascending: false });

            // Get permission requests with usernames  
            const { data: permissionRequests } = await supabaseClient
              .from('permission_requests')
              .select(`
                *,
                users!inner(username)
              `)
              .eq('status', 'pending')
              .order('created_at', { ascending: false });

            // Transform the data to match our interface
            const transformedLeaveRequests = (leaveRequests || []).map(req => ({
              ...req,
              type: 'Leave',
              username: req.users?.username,
              date: req.start_date
            }));

            const transformedPermissionRequests = (permissionRequests || []).map(req => ({
              ...req,
              type: 'Permission',
              username: req.users?.username
            }));

            result = [...transformedLeaveRequests, ...transformedPermissionRequests]
              .sort((a, b) => {
                const dateA = new Date(a.created_at || a.date);
                const dateB = new Date(b.created_at || b.date);
                return dateB.getTime() - dateA.getTime();
              });
        } else {
            // For employees, get their own requests
            const { data: userRequests } = await supabaseClient
              .from('leave_requests')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });

            result = (userRequests || []).map(req => ({
              ...req,
              type: 'Leave',
              date: req.start_date
            }));
        }
        setRequests(result);
    } catch (error) {
        console.error('Error fetching requests:', error);
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  }, [supabaseClient, user, isHOD]);

  useFocusEffect(useCallback(() => { fetchRequests(); }, [fetchRequests]));

  const handleUpdateRequest = async (request: Request, status: 'approved' | 'rejected') => {
    if (!supabaseClient) return;
    try {
        // Update the request status in the appropriate table
        let tableName = 'leave_requests';
        let dateField = request.date;
        
        if (request.type === 'Leave') {
          tableName = 'leave_requests';
          dateField = request.start_date || request.date;
        } else if (request.type === 'Permission') {
          tableName = 'permission_requests';
        }
        
        // Update the request status
        const { error: updateError } = await supabaseClient
          .from(tableName)
          .update({ status })
          .eq('id', request.id);

        if (updateError) {
          console.error('Error updating request:', updateError);
          return;
        }
        
        // Create a notification for the employee (if notifications table exists)
        const message = `Your ${request.type} request for ${dateField} has been ${status}.`;
        await supabaseClient
          .from('notifications')
          .insert([{
            user_id: request.user_id,
            message: message,
            is_read: false
          }]);

        fetchRequests(); // Refresh the list of pending requests
    } catch (error) {
        console.error(`Error updating request:`, error);
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === 'approved') return { container: styles.statusApproved, text: styles.statusTextApproved };
    if (status === 'rejected') return { container: styles.statusRejected, text: styles.statusTextRejected };
    return { container: styles.statusPending, text: styles.statusTextPending };
  };

  const renderItem = ({ item, index }: { item: Request, index: number }) => {
    const statusStyle = getStatusStyle(item.status);
    return (
        <Animated.View entering={FadeInUp.duration(500).delay(index * 50)}>
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.type.replace('_', ' ')} Request</Text>
                    <View style={[styles.statusBadge, statusStyle.container]}>
                        <Text style={[styles.statusText, statusStyle.text]}>{item.status}</Text>
                    </View>
                </View>
                {isHOD && <Text style={styles.detailText}>Employee: <Text style={{fontWeight: 'bold'}}>{item.username}</Text></Text>}
                <Text style={styles.detailText}>Date: {item.date}</Text>
                {item.type === 'Shift Swap' && (
                  <>
                    <Text style={styles.detailText}>Target Employee: <Text style={{fontWeight: 'bold'}}>{item.target_username}</Text></Text>
                    <Text style={styles.detailText}>Swap: {item.requester_shift} ↔ {item.target_shift}</Text>
                  </>
                )}
                <Text style={styles.detailText}>Reason: {item.reason}</Text>
                
                {isHOD && (item.status === 'pending' || item.status === 'pending_hod_approval') && (
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.viewButton]} 
                            onPress={() => router.push(`/requests/${item.id}`)}
                        >
                            <Text style={styles.viewButtonText}>View Details</Text>
                        </TouchableOpacity>
                        <View style={styles.actionButtonsRow}>
                            <TouchableOpacity 
                                style={[styles.actionButton, styles.rejectButton]} 
                                onPress={() => handleUpdateRequest(item, 'rejected')}
                            >
                                <Text style={styles.actionButtonText}>Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.actionButton, styles.approveButton]} 
                                onPress={() => handleUpdateRequest(item, 'approved')}
                            >
                                <Text style={styles.actionButtonText}>Approve</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </Animated.View>
    );
  }
  
  if (loading && !refreshing) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} color={Colors.primary} />;
  }

  return (
    <FlatList
      data={requests}
      renderItem={renderItem}
      keyExtractor={item => item.id.toString()}
      contentContainerStyle={styles.container}
      ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>No requests found.</Text></View>}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchRequests} />}
    />
  );
}

const styles = StyleSheet.create({
    container: {
        padding: Sizing.padding,
        backgroundColor: Colors.background,
        flexGrow: 1,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: Sizing.borderRadius,
        padding: Sizing.padding,
        marginBottom: Sizing.margin,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardTitle: {
        ...Typography.h2,
        fontSize: 18,
        textTransform: 'capitalize',
    },
    detailText: {
        ...Typography.body,
        marginBottom: 5,
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    statusPending: { backgroundColor: '#FFFBE6' },
    statusTextPending: { color: '#FFAB00' },
    statusApproved: { backgroundColor: '#E6FFFA' },
    statusTextApproved: { color: '#36B37E' },
    statusRejected: { backgroundColor: '#FFEBE6' },
    statusTextRejected: { color: '#FF5630' },
    actionsContainer: {
        marginTop: 15,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: 15,
        gap: 10,
    },
    actionButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: Sizing.borderRadius,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    viewButton: { 
        backgroundColor: Colors.primary,
        width: '100%',
    },
    viewButtonText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    approveButton: { 
        backgroundColor: Colors.success,
        flex: 1,
    },
    rejectButton: { 
        backgroundColor: Colors.danger,
        flex: 1,
    },
    actionButtonText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        ...Typography.body,
        fontSize: 16,
    },
});
