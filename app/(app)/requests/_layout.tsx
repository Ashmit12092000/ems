import { Stack } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { View, Text } from 'react-native';
import { Colors, Typography } from '../../../theme/theme';

export default function RequestsLayout() {
  const { user } = useAuth();

  return (
    <Stack screenOptions={{
      headerStyle: {
        backgroundColor: '#6366f1',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}>
      <Stack.Screen name="index" options={{ title: 'My Requests' }} />
      <Stack.Screen name="leave" options={{ title: 'Leave Request' }} />
      <Stack.Screen name="permission" options={{ title: 'Permission Request' }} />
      <Stack.Screen name="shift" options={{ title: 'Shift Request' }} />
      <Stack.Screen name="list" options={{ title: 'All Requests' }} />
    </Stack>
  );
}