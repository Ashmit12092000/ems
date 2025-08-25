
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Redirect } from 'expo-router';
import { Colors, Typography, Spacing } from '../theme/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp, useSharedValue, withRepeat, withTiming, useAnimatedStyle } from 'react-native-reanimated';

export default function IndexScreen() {
  const { user, loading } = useAuth();
  
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <Animated.View 
          entering={FadeIn.duration(500)}
          style={styles.loadingContainer}
        >
          <Animated.View style={[styles.logoContainer, animatedStyle]}>
            <FontAwesome5 name="building" size={48} color={Colors.primary} />
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(300)}>
            <Text style={styles.title}>Leave Management</Text>
            <Text style={styles.subtitle}>Loading your workspace...</Text>
          </Animated.View>
        </Animated.View>
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(app)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
