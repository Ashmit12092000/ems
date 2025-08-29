
import { Stack } from 'expo-router';

export default function RequestsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#000',
      }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'My Requests',
          headerShown: false 
        }} 
      />
      <Stack.Screen name="leave" options={{ title: 'Leave Request' }} />
      <Stack.Screen name="permission" options={{ title: 'Permission Request' }} />
      <Stack.Screen name="shift" options={{ title: 'Shift Change Request' }} />
      <Stack.Screen name="shift-swap" options={{ title: 'Shift Swap Request' }} />
      <Stack.Screen name="swap-responses" options={{ title: 'Swap Requests' }} />
      <Stack.Screen name="list" options={{ title: 'All Requests' }} />
      <Stack.Screen name="my-requests" options={{ title: 'My Requests' }} />
      <Stack.Screen name="[id]" options={{ title: 'Request Details' }} />
    </Stack>
  );
}
