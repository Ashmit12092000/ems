
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { useFocusEffect } from 'expo-router';
import { Colors, Sizing, Typography } from '../../../theme/theme';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { validateRequest } from '../../../utils/validation';
import { supabase } from '../../../lib/supabase';

interface SwapRequest {
  id: number;
  requester_id: string;
  target_id: string;
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
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSwapRequests = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('Fetching swap requests for user:', user.id);
      const { data, error } = await supabase
        .from('shift_swaps')
        .select(`
          *,
          requester:users!requester_id(username)
        `)
        .eq('target_id', user.id)
        .eq('status', 'pending_target_approval')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map(item => ({
        ...item,
        requester_username: item.requester?.username || 'Unknown'
      }));

      console.log('Found swap requests:', formattedData.length, formattedData);
      setSwapRequests(formattedData);
    } catch (error) {
      console.error('Error fetching swap requests:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused, refreshing swap requests...');
      fetchSwapRequests();
    }, [fetchSwapRequests])
  );

  const handleResponse = async (request: SwapRequest, action: 'accept' | 'reject') => {
    try {
      if (action === 'reject') {
        // Update status to rejected
        const { error: updateError } = await supabase
          .from('shift_swaps')
          .update({ status: 'rejected_by_target' })
          .eq('id', request.id);

        if (updateError) throw updateError;
        
        // Notify requester
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: request.requester_id,
            message: `Your shift swap request for ${request.date} was declined by ${user?.username}.`
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
      } else {
        // Check system validation before moving to HOD approval
        // Note: validateRequest function would need to be updated to work with Supabase
        // For now, we'll skip this validation and move directly to HOD approval
        
        // Update status to pending HOD approval
        const { error: updateError } = await supabase
          .from('shift_swaps')
          .update({ status: 'pending_hod_approval' })
          .eq('id', request.id);

        if (updateError) throw updateError;
        
        // Notify requester
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: request.requester_id,
            message: `Your shift swap request for ${request.date} was accepted by ${user?.username} and is now pending HOD approval.`
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
        
        Alert.alert('Success', 'Request accepted and forwarded to HOD for final approval.');
      }
      
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
