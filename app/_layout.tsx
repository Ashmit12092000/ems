import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { DatabaseProvider } from '../context/DatabaseContext';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { BottomTabNavigator } from '../components/BottomTabNavigator';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const { user, isAuthReady } = useAuth();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded || !isAuthReady) {
    return null;
  }

  return (
    <DatabaseProvider>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 300,
          }}>
            {isAuthReady && (
              <Stack screenOptions={{ headerShown: false }}>
                {user ? (
                  <>
                    <Stack.Screen name="(app)" />
                    <Stack.Screen name="index" options={{ href: null }} />
                  </>
                ) : (
                  <>
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(app)" options={{ href: null }} />
                  </>
                )}
              </Stack>
            )}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </DatabaseProvider>
  );
}