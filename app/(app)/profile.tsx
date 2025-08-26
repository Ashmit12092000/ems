
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme/theme';
import { ModernCard } from '../../components/ui/ModernCard';
import { ModernButton } from '../../components/ui/ModernButton';
import { ModernInput } from '../../components/ui/ModernInput';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { db } = useDatabase();
  const [stats, setStats] = useState({
    totalRequests: 0,
    approvedRequests: 0,
    pendingRequests: 0,
    rejectedRequests: 0,
  });
  const [editing, setEditing] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchUserStats();
  }, [db, user]);

  const fetchUserStats = async () => {
    if (!db || !user) return;

    try {
      const totalResult = await db.getAllAsync(
        'SELECT COUNT(*) as count FROM requests WHERE user_id = ?',
        [user.id]
      );
      const approvedResult = await db.getAllAsync(
        'SELECT COUNT(*) as count FROM requests WHERE user_id = ? AND status = "approved"',
        [user.id]
      );
      const pendingResult = await db.getAllAsync(
        'SELECT COUNT(*) as count FROM requests WHERE user_id = ? AND status = "pending"',
        [user.id]
      );
      const rejectedResult = await db.getAllAsync(
        'SELECT COUNT(*) as count FROM requests WHERE user_id = ? AND status = "rejected"',
        [user.id]
      );

      setStats({
        totalRequests: (totalResult[0] as any)?.count || 0,
        approvedRequests: (approvedResult[0] as any)?.count || 0,
        pendingRequests: (pendingResult[0] as any)?.count || 0,
        rejectedRequests: (rejectedResult[0] as any)?.count || 0,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      // Hash the password before storing
      const hashedPassword = await hashPassword(newPassword);
      await db?.runAsync(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [hashedPassword, user?.id]
      );
      
      Alert.alert('Success', 'Password updated successfully');
      setEditing(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      Alert.alert('Error', 'Failed to update password');
    }
  };

  const hashPassword = async (password: string): Promise<string> => {
    const Crypto = await import('expo-crypto');
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: () => {
            logout();
            // Force navigation to login screen after logout
            router.replace('/(auth)/login');
          }, 
          style: 'destructive' 
        },
      ]
    );
  };

  const StatCard = ({ title, value, icon, color }: any) => (
    <ModernCard style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <FontAwesome5 name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </ModernCard>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <FontAwesome5 name="user" size={48} color={Colors.primary} />
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{user?.role}</Text>
          </View>
        </View>
        <Text style={styles.name}>{user?.username}</Text>
        <Text style={styles.role}>Employee ID: #{user?.id}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsGrid}>
          <StatCard 
            title="Total Requests" 
            value={stats.totalRequests} 
            icon="clipboard-list"
            color={Colors.primary} 
          />
          <StatCard 
            title="Approved" 
            value={stats.approvedRequests} 
            icon="check-circle"
            color={Colors.success} 
          />
          <StatCard 
            title="Pending" 
            value={stats.pendingRequests} 
            icon="clock"
            color={Colors.warning} 
          />
          <StatCard 
            title="Rejected" 
            value={stats.rejectedRequests} 
            icon="times-circle"
            color={Colors.error} 
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Security</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setEditing(!editing)}
          >
            <FontAwesome5 
              name={editing ? "times" : "edit"} 
              size={16} 
              color={Colors.primary} 
            />
          </TouchableOpacity>
        </View>

        {editing ? (
          <ModernCard style={styles.editCard}>
            <Text style={styles.editTitle}>Change Password</Text>
            <ModernInput
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              style={styles.input}
            />
            <ModernInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.input}
            />
            <View style={styles.editButtons}>
              <ModernButton
                title="Cancel"
                onPress={() => {
                  setEditing(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                variant="outline"
                style={styles.editButton}
              />
              <ModernButton
                title="Update"
                onPress={handlePasswordChange}
                style={styles.editButton}
              />
            </View>
          </ModernCard>
        ) : (
          <ModernCard style={styles.securityCard}>
            <View style={styles.securityItem}>
              <FontAwesome5 name="lock" size={20} color={Colors.textSecondary} />
              <Text style={styles.securityText}>Password</Text>
              <Text style={styles.securityValue}>••••••••</Text>
            </View>
          </ModernCard>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
        <ModernButton
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
          textStyle={styles.logoutText}
        />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  badge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
  },
  name: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  role: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  editButton: {
    padding: Spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  statValue: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  statTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  editCard: {
    padding: Spacing.lg,
  },
  editTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  input: {
    marginBottom: Spacing.md,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  securityCard: {
    padding: Spacing.lg,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityText: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginLeft: Spacing.md,
    flex: 1,
  },
  securityValue: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  logoutButton: {
    borderColor: Colors.error,
    marginTop: Spacing.lg,
  },
  logoutText: {
    color: Colors.error,
  },
});
