
import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../../theme/theme';

export default function RequestsLayout() {
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
        name="list"
        options={{
          title: 'My Requests',
          headerShown: false, // Hide header since it's a tab
        }}
      />
      <Stack.Screen
        name="leave"
        options={{
          title: 'Leave Request',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="permission"
        options={{
          title: 'Permission Request',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="shift"
        options={{
          title: 'Shift Change Request',
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
