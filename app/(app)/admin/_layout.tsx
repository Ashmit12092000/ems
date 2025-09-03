// File: app/(app)/admin/_layout.tsx
// Updated to include the new attendance screen.

import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="limits" options={{ title: 'Set Monthly Limits' }} />
      <Stack.Screen name="roster" options={{ title: 'Manage Duty Roster' }} />
    </Stack>
  );
}
