// File: app/(app)/home.tsx
// Redesigned dashboard with modern cards and animations.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter, Href } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Sizing, Typography } from '../../theme/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface ActionItem {
  title: string;
  icon: React.ComponentProps<typeof FontAwesome5>['name'];
  path: Href;
  color: string;
}

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const isHOD = user?.role === 'HOD';

  const employeeActions: ActionItem[] = [
    { title: 'Leave Request', icon: 'calendar-plus', path: '/requests/leave', color: '#E9F2FF' },
    { title: 'Permission', icon: 'clock', path: '/requests/permission', color: '#E6FFFA' },
    { title: 'Shift Adjust', icon: 'exchange-alt', path: '/requests/shift', color: '#F6E6FF' },
    { title: 'My Requests', icon: 'list-alt', path: '/requests/list', color: '#EBF6FF' },
  ];

  const hodActions: ActionItem[] = [
    { title: 'Approve Requests', icon: 'check-circle', path: '/requests/list', color: '#E6FFFA' },
    { title: 'Manage Roster', icon: 'calendar-alt', path: '/admin/roster', color: '#EBF6FF' },
    { title: 'Attendance', icon: 'user-check', path: '/admin/attendance', color: '#FFF0E6' },
    { title: 'Set Limits', icon: 'cogs', path: '/admin/limits', color: '#F6E6FF' },
  ];

  const actions = isHOD ? hodActions : employeeActions;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={Typography.h1}>Welcome, {user?.username}</Text>
        <Text style={Typography.body}>Here's your dashboard for today.</Text>
      </View>
      <View style={styles.grid}>
        {actions.map((action, index) => (
          <Animated.View 
            key={index} 
            style={styles.cardContainer}
            entering={FadeInDown.duration(500).delay(index * 100)}
          >
            <TouchableOpacity
              style={[styles.card, { backgroundColor: action.color }]}
              onPress={() => router.push(action.path)}
            >
              <FontAwesome5 name={action.icon} size={32} color={Colors.primary} />
              <Text style={styles.cardText}>{action.title}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Sizing.padding * 1.5,
    paddingTop: Sizing.padding * 2,
    backgroundColor: Colors.white,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: Sizing.margin / 2,
  },
  cardContainer: {
    width: '50%',
    padding: Sizing.padding / 2,
  },
  card: {
    borderRadius: Sizing.borderRadius * 1.5,
    padding: Sizing.padding,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardText: {
    ...Typography.body,
    color: Colors.darkText,
    marginTop: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
