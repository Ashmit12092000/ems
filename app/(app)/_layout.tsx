// File: app/_layout.tsx
// This file contains the master navigation logic to prevent redirect loops.

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

    const inAuthGroup = segments[0] === '(auth)';

    // If we have a user but are still in the auth screens (e.g., login),
    // navigate away to the dashboard.
    if (user && inAuthGroup) {
      router.replace('/home');
    } 
    // If we have NO user and are NOT in the auth screens,
    // it means we are in a protected area, so navigate back to login.
    else if (!user && !inAuthGroup) {
      router.replace('/login');
    }
  }, [user, isAuthReady, segments, router]);

  // While the authentication state is being determined, show a loading screen.
  // This prevents any screen from rendering and causing a white screen or navigation loop.
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
