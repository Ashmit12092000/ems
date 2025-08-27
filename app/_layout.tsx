
import React from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DatabaseProvider } from '../context/DatabaseContext';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../theme/theme';

const InitialLayout = () => {
  const { user, isAuthReady } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    if (user && inAuthGroup) {
      // User is logged in but still in auth screens, redirect to home
      router.replace('/home');
    } else if (!user && inAppGroup) {
      // User is not logged in but in protected area, redirect to login
      router.replace('/login');
    }
  }, [user, isAuthReady, segments, router]);

  if (!isAuthReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <Slot />;
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DatabaseProvider>
        <AuthProvider>
          <InitialLayout />
        </AuthProvider>
      </DatabaseProvider>
    </GestureHandlerRootView>
  );
}
