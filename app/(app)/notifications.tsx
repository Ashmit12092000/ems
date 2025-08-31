// File: app/(app)/notifications.tsx
// This new screen displays a list of notifications for the user.

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { useFocusEffect } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Sizing, Typography } from '../../theme/theme';

interface Notification {
    id: number;
    message: string;
    is_read: boolean;
    created_at: string;
}

export default function NotificationsScreen() {
    const { user } = useAuth();
    const { supabaseClient } = useDatabase();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!supabaseClient || !user) return;
        setLoading(true);
        try {
            const { data: result, error } = await supabaseClient
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching notifications:', error);
            } else {
                setNotifications(result || []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [supabaseClient, user]);

    useFocusEffect(useCallback(() => {
        fetchNotifications();
    }, [fetchNotifications]));

    const markAsRead = async (id: number) => {
        if (!supabaseClient) return;
        try {
            const { error } = await supabaseClient
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) {
                console.error('Error marking notification as read:', error);
            } else {
                fetchNotifications(); // Refresh the list
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const renderItem = ({ item }: { item: Notification }) => (
        <View style={[styles.card, !item.is_read && styles.unreadCard]}>
            <FontAwesome5 name="bell" size={20} color={!item.is_read ? Colors.primary : Colors.secondary} />
            <View style={styles.messageContainer}>
                <Text style={styles.messageText}>{item.message}</Text>
                <Text style={styles.dateText}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
            {!item.is_read && (
                <TouchableOpacity onPress={() => markAsRead(item.id)} style={styles.readButton}>
                    <FontAwesome5 name="check" size={16} color={Colors.success} />
                </TouchableOpacity>
            )}
        </View>
    );

    if (loading && !refreshing) {
        return <ActivityIndicator size="large" style={{ flex: 1 }} color={Colors.primary} />;
    }

    return (
        <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.container}
            ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>You have no notifications.</Text></View>}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchNotifications} />}
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
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: Sizing.borderRadius,
        padding: Sizing.padding,
        marginBottom: Sizing.margin,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    unreadCard: {
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
    },
    messageContainer: {
        flex: 1,
        marginLeft: Sizing.margin,
    },
    messageText: {
        ...Typography.body,
        color: Colors.darkText,
    },
    dateText: {
        ...Typography.label,
        fontSize: 12,
        marginTop: 4,
    },
    readButton: {
        marginLeft: 'auto',
        padding: 10,
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
