
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
    // Wait until the authentication state is actually ready
    if (!isAuthReady) {
      return;
    }

    const inAppGroup = segments[0] === '(app)';
    const inAuthGroup = segments[0] === '(auth)';

    // If user is authenticated but in auth screens, redirect to home
    if (user && inAuthGroup) {
      router.replace('/home');
    } 
    // If user is not authenticated but in app screens, redirect to login
    else if (!user && inAppGroup) {
      router.replace('/login');
    }
    // If user is not authenticated and not in any group, redirect to login
    else if (!user && !inAuthGroup && !inAppGroup) {
      router.replace('/login');
    }
  }, [user, isAuthReady, segments]);

  // While the authentication state is being determined, show a loading screen
  if (!isAuthReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Once ready, render the currently active route
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
