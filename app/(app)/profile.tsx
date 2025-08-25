// File: app/(app)/profile.tsx
// A cleaner, more professional profile screen.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Sizing, Typography } from '../../theme/theme';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function Profile() {
  const { user, logout } = useAuth();

  const InfoRow = ({ icon, label, value }: { icon: React.ComponentProps<typeof FontAwesome5>['name'], label: string, value?: string | number }) => (
    <View style={styles.infoRow}>
        <FontAwesome5 name={icon} size={20} color={Colors.primary} />
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
        <Animated.View style={styles.profileCard} entering={FadeIn.duration(800)}>
            <View style={styles.avatar}>
                <FontAwesome5 name="user-alt" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.username}>{user?.username}</Text>
            <Text style={styles.role}>{user?.role}</Text>
        </Animated.View>

        <Animated.View style={styles.infoContainer} entering={FadeIn.duration(800).delay(200)}>
            <InfoRow icon="id-card" label="User ID" value={user?.id} />
            <InfoRow icon="user-shield" label="Role" value={user?.role} />
            <InfoRow icon="envelope" label="Email" value={`${user?.username}@company.com`} />
        </Animated.View>

        <Animated.View style={{width: '100%'}} entering={FadeIn.duration(800).delay(400)}>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <FontAwesome5 name="sign-out-alt" size={16} color={Colors.white} />
                <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
        </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    padding: Sizing.padding,
  },
  profileCard: {
    width: '100%',
    alignItems: 'center',
    padding: Sizing.padding * 1.5,
    backgroundColor: Colors.white,
    borderRadius: Sizing.borderRadius,
    marginBottom: Sizing.margin,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E9F2FF',
    marginBottom: 15,
  },
  username: {
    ...Typography.h1,
  },
  role: {
    ...Typography.body,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  infoContainer: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Sizing.borderRadius,
    marginBottom: Sizing.margin,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Sizing.padding,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    ...Typography.body,
    color: Colors.darkText,
    marginLeft: 15,
  },
  infoValue: {
    ...Typography.body,
    marginLeft: 'auto',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: Colors.danger,
    padding: 15,
    borderRadius: Sizing.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    width: '100%',
  },
  logoutButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
});
