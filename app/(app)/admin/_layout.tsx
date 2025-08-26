import { Stack } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { View, Text } from 'react-native';
import { Colors, Typography } from '../../../theme/theme';
import { ModernCard } from '../../../components/ui/ModernCard';
import { FontAwesome5 } from '@expo/vector-icons';

export default function AdminLayout() {
  const { user } = useAuth();

  if (user?.role !== 'HOD') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: Colors.backgroundSecondary }}>
        <ModernCard style={{ padding: 30, alignItems: 'center', gap: 15 }}>
          <FontAwesome5 name="shield-alt" size={48} color={Colors.error} />
          <Text style={{ ...Typography.headingMedium, color: Colors.error, textAlign: 'center' }}>
            Access Denied
          </Text>
          <Text style={{ ...Typography.bodyMedium, color: Colors.textSecondary, textAlign: 'center' }}>
            HOD privileges required to access admin functions.
          </Text>
        </ModernCard>
      </View>
    );
  }

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
      <Stack.Screen name="index" options={{ title: 'Request Approval' }} />
      <Stack.Screen name="limits" options={{ title: 'Monthly Limits' }} />
      <Stack.Screen name="roster" options={{ title: 'Duty Roster' }} />
      <Stack.Screen name="attendance" options={{ title: 'Attendance' }} />
    </Stack>
  );
}