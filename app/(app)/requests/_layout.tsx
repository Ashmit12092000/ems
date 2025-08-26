// File: app/(app)/requests/_layout.js
// Layout for the request management section.

import { Stack } from 'expo-router';

export default function RequestsLayout() {
  return (
    <Stack>
      <Stack.Screen name="list" options={{ title: 'All Requests' }} />
      <Stack.Screen name="leave" options={{ title: 'Submit Leave Request' }} />
      <Stack.Screen name="permission" options={{ title: 'Submit Permission Request' }} />
      <Stack.Screen name="shift" options={{ title: 'Submit Shift Adjustment' }} />
    </Stack>
  );
}
