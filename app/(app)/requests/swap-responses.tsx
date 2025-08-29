
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../context/DatabaseContext';
import { useFocusEffect } from 'expo-router';
import { Colors, Sizing, Typography } from '../../../theme/theme';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { validateRequest } from '../../../utils/validation';

interface SwapRequest {
  id: number;
  requester_id: number;
  target_id: number;
  date: string;
  requester_shift: string;
  target_shift: string;
  reason: string;
  status: string;
  requester_username: string;
  created_at: string;
}

export default function SwapResponseScreen() {
  const { user } = useAuth();
  const { db } = useDatabase();
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSwapRequests = useCallback(async () => {
    if (!db || !user) return;
    
    try {
      console.log('Fetching swap requests for user:', user.id);
      const result = await db.getAllAsync<SwapRequest>(
        `SELECT ss.*, u.username as requester_username 
         FROM shift_swaps ss 
         JOIN users u ON ss.requester_id = u.id 
         WHERE ss.target_id = ? AND ss.status = 'pending_target_approval' 
         ORDER BY ss.created_at DESC;`,
        [user.id]
      );
      console.log('Found swap requests:', result.length, result);
      setSwapRequests(result);
    } catch (error) {
      console.error('Error fetching swap requests:', error);
    } finally {
      setRefreshing(false);
    }
  }, [db, user]);

  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused, refreshing swap requests...');
      fetchSwapRequests();
    }, [fetchSwapRequests])
  );

  const handleResponse = async (request: SwapRequest, action: 'accept' | 'reject') => {
    if (!db) return;
    
    try {
      await db.withTransactionAsync(async () => {
        if (action === 'reject') {
          // Update status to rejected
          await db.runAsync(
            'UPDATE shift_swaps SET status = ? WHERE id = ?;',
            ['rejected_by_target', request.id]
          );
          
          // Notify requester
          await db.runAsync(
            'INSERT INTO notifications (user_id, message) VALUES (?, ?);',
            [request.requester_id, `Your shift swap request for ${request.date} was declined by ${user?.username}.`]
          );
        } else {
          // Check system validation before moving to HOD approval
          const requesterValidation = await validateRequest(db, request.requester_id, request.date, 'shift_swap');
          const targetValidation = await validateRequest(db, request.target_id, request.date, 'shift_swap');
          
          if (!requesterValidation.passed || !targetValidation.passed) {
            // System validation failed
            await db.runAsync(
              'UPDATE shift_swaps SET status = ? WHERE id = ?;',
              ['rejected_by_system', request.id]
            );
            
            const validationMessage = requesterValidation.message || targetValidation.message;
            
            // Notify both employees
            await db.runAsync(
              'INSERT INTO notifications (user_id, message) VALUES (?, ?);',
              [request.requester_id, `Your shift swap request for ${request.date} was rejected by system: ${validationMessage}`]
            );
            
            await db.runAsync(
              'INSERT INTO notifications (user_id, message) VALUES (?, ?);',
              [request.target_id, `Shift swap request for ${request.date} was rejected by system: ${validationMessage}`]
            );
            
            Alert.alert('Request Rejected', `System validation failed: ${validationMessage}`);
          } else {
            // System validation passed, move to HOD approval
            await db.runAsync(
              'UPDATE shift_swaps SET status = ? WHERE id = ?;',
              ['pending_hod_approval', request.id]
            );
            
            // Notify requester
            await db.runAsync(
              'INSERT INTO notifications (user_id, message) VALUES (?, ?);',
              [request.requester_id, `Your shift swap request for ${request.date} was accepted by ${user?.username} and is now pending HOD approval.`]
            );
            
            Alert.alert('Success', 'Request accepted and forwarded to HOD for final approval.');
          }
        }
      });
      
      fetchSwapRequests(); // Refresh the list
    } catch (error) {
      console.error('Error responding to swap request:', error);
      Alert.alert('Error', 'Failed to process your response.');
    }
  };

  const renderItem = ({ item, index }: { item: SwapRequest, index: number }) => (
    <Animated.View entering={FadeInUp.duration(500).delay(index * 50)}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Shift Swap Request</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Pending Your Response</Text>
          </View>
        </View>
        
        <Text style={styles.detailText}>From: <Text style={{fontWeight: 'bold'}}>{item.requester_username}</Text></Text>
        <Text style={styles.detailText}>Date: {item.date}</Text>
        <Text style={styles.detailText}>They want your: <Text style={{fontWeight: 'bold'}}>{item.target_shift}</Text> shift</Text>
        <Text style={styles.detailText}>In exchange for their: <Text style={{fontWeight: 'bold'}}>{item.requester_shift}</Text> shift</Text>
        <Text style={styles.detailText}>Reason: {item.reason}</Text>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton]} 
            onPress={() => handleResponse(item, 'reject')}
          >
            <Text style={styles.actionButtonText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.approveButton]} 
            onPress={() => handleResponse(item, 'accept')}
          >
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <FlatList
      data={swapRequests}
      renderItem={renderItem}
      keyExtractor={item => item.id.toString()}
      contentContainerStyle={styles.container}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No swap requests pending your response.</Text>
        </View>
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchSwapRequests} />}
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
  },
  detailText: {
    ...Typography.body,
    marginBottom: 5,
  },
  statusBadge: {
    backgroundColor: '#FFFBE6',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#FFAB00',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Sizing.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 14,
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
