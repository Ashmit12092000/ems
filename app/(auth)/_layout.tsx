// File: app/_layout.tsx
// Updated with a more robust loading state to prevent white screens during startup.

import React from 'react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DatabaseProvider } from '../../context/DatabaseContext';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../../theme/theme';

const InitialLayout = () => {
  const { user, isAuthReady } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Wait until the authentication state is actually ready
    if (!isAuthReady) {
      return;
    }

    const inAppGroup = segments[0] === '(app)';

    // If the user is authenticated and not in the main app, navigate to the dashboard.
    if (user && !inAppGroup) {
      router.replace('/home');
    } 
    // If the user is not authenticated but is somehow in the main app, navigate to login.
    else if (!user && inAppGroup) {
      router.replace('/login');
    }
  }, [user, isAuthReady, segments, router]);

  // While the authentication state is being determined, show a loading screen.
  // This prevents the <Slot /> from rendering an empty layout and causing a white screen.
  if (!isAuthReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Once ready, render the currently active route.
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
