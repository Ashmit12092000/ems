
import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../../theme/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: Colors.textPrimary,
        },
        headerTintColor: Colors.primary,
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="limits"
        options={{
          title: 'Manage Limits',
          headerShown: false, // Hide header since it's a tab
        }}
      />
      <Stack.Screen
        name="roster"
        options={{
          title: 'Duty Roster',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="attendance"
        options={{
          title: 'Attendance Management',
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
