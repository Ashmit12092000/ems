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
    id: number;
    user_id: number; // Important for creating notifications
    type: string;
    reason: string;
    date: string;
    status: 'pending' | 'approved' | 'rejected';
    username?: string;
}

export default function RequestListScreen() {
  const { user } = useAuth();
  const { db } = useDatabase();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isHOD = user?.role === 'HOD';

  const fetchRequests = useCallback(async () => {
    if (!db || !user) return;
    setLoading(true);
    try {
        let result: Request[] = [];
        if (isHOD) {
            // Get leave requests
            const leaveRequests = await db.getAllAsync<Request>(
              `SELECT lr.*, u.username, 'Leave' as type FROM leave_requests lr 
               JOIN users u ON lr.user_id = u.id 
               WHERE lr.status = 'pending' ORDER BY lr.created_at DESC`
            );

            // Get permission requests
            const permissionRequests = await db.getAllAsync<Request>(
              `SELECT pr.*, u.username, 'Permission' as type FROM permission_requests pr 
               JOIN users u ON pr.user_id = u.id 
               WHERE pr.status = 'pending' ORDER BY pr.created_at DESC`
            );

            // Get shift requests
            const shiftRequests = await db.getAllAsync<Request>(
              `SELECT sr.*, u.username, 'Shift' as type FROM shift_requests sr 
               JOIN users u ON sr.user_id = u.id 
               WHERE sr.status = 'pending' ORDER BY sr.created_at DESC`
            );

            // Get shift swap requests
            const shiftSwapRequests = await db.getAllAsync<Request>(
              `SELECT ss.*, ur.username, 'Shift Swap' as type, 
                      ut.username as target_username,
                      ss.requester_shift, ss.target_shift,
                      ss.requester_id as user_id
               FROM shift_swaps ss 
               JOIN users ur ON ss.requester_id = ur.id 
               JOIN users ut ON ss.target_id = ut.id
               WHERE ss.status = 'pending_hod_approval' ORDER BY ss.created_at DESC`
            );

            // Get old requests from legacy table (no created_at column)
            const oldRequests = await db.getAllAsync<Request>(
              `SELECT r.*, u.username FROM requests r 
               JOIN users u ON r.user_id = u.id 
               WHERE r.status = 'pending' ORDER BY r.id DESC`
            );

            result = [...leaveRequests, ...permissionRequests, ...shiftRequests, ...shiftSwapRequests, ...oldRequests]
              .sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at) : new Date(a.date);
                const dateB = b.created_at ? new Date(b.created_at) : new Date(b.date);
                return dateB.getTime() - dateA.getTime();
              });
        } else {
            const query = 'SELECT * FROM requests WHERE user_id = ? ORDER BY id DESC;';
            result = await db.getAllAsync<Request>(query, user.id);
        }
        setRequests(result);
    } catch (error) {
        console.error('Error fetching requests:', error);
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  }, [db, user, isHOD]);

  useFocusEffect(useCallback(() => { fetchRequests(); }, [fetchRequests]));

  const handleUpdateRequest = async (request: Request, status: 'approved' | 'rejected') => {
    if (!db) return;
    try {
        // Use a transaction to ensure both actions succeed or fail together
        await db.withTransactionAsync(async () => {
            // 1. Update the request status in the appropriate table
            let tableName = 'requests';
            let dateField = request.date;
            
            if (request.type === 'Leave') {
              tableName = 'leave_requests';
              dateField = request.start_date || request.date;
            } else if (request.type === 'Permission') {
              tableName = 'permission_requests';
            } else if (request.type === 'Shift') {
              tableName = 'shift_requests';
            } else if (request.type === 'Shift Swap') {
              tableName = 'shift_swaps';
              // For shift swaps, notify both requester and target
              const swapStatus = status === 'approved' ? 'approved' : 'rejected_by_hod';
              await db.runAsync(`UPDATE ${tableName} SET status = ? WHERE id = ?;`, swapStatus, request.id);
              
              // Get swap details for notifications
              const swapDetails = await db.getFirstAsync(
                'SELECT requester_id, target_id, requester_shift, target_shift FROM shift_swaps WHERE id = ?;',
                request.id
              ) as { requester_id: number; target_id: number; requester_shift: string; target_shift: string };
              
              if (swapDetails) {
                const swapMessage = `Your shift swap request for ${dateField} has been ${status} by HOD.`;
                await db.runAsync(
                  'INSERT INTO notifications (user_id, message) VALUES (?, ?);',
                  swapDetails.requester_id,
                  swapMessage
                );
                await db.runAsync(
                  'INSERT INTO notifications (user_id, message) VALUES (?, ?);',
                  swapDetails.target_id,
                  swapMessage
                );
                
                // If approved, update the duty roster
                if (status === 'approved') {
                  await db.runAsync(
                    'UPDATE duty_roster SET shift_type = ? WHERE user_id = ? AND date = ?;',
                    swapDetails.target_shift, swapDetails.requester_id, dateField
                  );
                  await db.runAsync(
                    'UPDATE duty_roster SET shift_type = ? WHERE user_id = ? AND date = ?;',
                    swapDetails.requester_shift, swapDetails.target_id, dateField
                  );
                }
              }
              return; // Skip the normal notification process
            }
            
            await db.runAsync(`UPDATE ${tableName} SET status = ? WHERE id = ?;`, status, request.id);
            
            // 2. Create a notification for the employee
            const message = `Your ${request.type.replace('_', ' ')} request for ${dateField} has been ${status}.`;
            await db.runAsync(
                'INSERT INTO notifications (user_id, message) VALUES (?, ?);',
                request.user_id,
                message
            );
        });
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
