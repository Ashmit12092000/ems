// File: app/_layout.tsx
// This file remains the same, setting up the core providers.

import React from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DatabaseProvider } from '../context/DatabaseContext';

const InitialLayout = () => {
  const { user, isAuthReady } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthReady) return;

    const inAppGroup = segments[0] === '(app)';

    if (user && !inAppGroup) {
      router.replace('/home');
    } else if (!user && inAppGroup) {
      router.replace('/login');
    }
  }, [user, isAuthReady, segments]);

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
