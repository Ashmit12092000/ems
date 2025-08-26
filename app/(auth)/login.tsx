// File: app/(auth)/login.tsx
// This version contains the definitive fix for the login redirect loop.

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Sizing, Typography } from '../../theme/theme';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthReady } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }
    setLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        // THE DEFINITIVE FIX: This explicitly replaces the current screen
        // with the dashboard, which is the most robust way to handle the redirect.
        router.replace('/home');
      } else {
        Alert.alert('Login Failed', 'Invalid username or password.');
        setLoading(false); // Stop loading on failure
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false); // Stop loading on error
    }
    // Note: setLoading(false) is handled within the success/failure paths now.
  };

  const isButtonDisabled = !isAuthReady || loading;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.kav}>
        <Animated.View entering={FadeInUp.duration(1000)}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
        </Animated.View>
        
        <Animated.View entering={FadeInDown.duration(1000).delay(200)}>
            <View style={styles.inputContainer}>
            <FontAwesome5 name="user" size={16} color={Colors.secondary} style={styles.icon} />
            <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={Colors.lightText}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />
            </View>

            <View style={styles.inputContainer}>
            <FontAwesome5 name="lock" size={16} color={Colors.secondary} style={styles.icon} />
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.lightText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            </View>

            <TouchableOpacity 
            style={[styles.button, isButtonDisabled && styles.buttonDisabled]} 
            onPress={handleLogin} 
            disabled={isButtonDisabled}
            >
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.buttonText}>Login</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.linkText}>Don't have an account? <Text style={{fontWeight: 'bold', color: Colors.primary}}>Register</Text></Text>
            </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  kav: {
    flex: 1,
    justifyContent: 'center',
    padding: Sizing.padding * 1.5,
  },
  title: {
    ...Typography.h1,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: 50,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Sizing.borderRadius,
    marginBottom: Sizing.margin,
    paddingHorizontal: Sizing.padding,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: Colors.darkText,
    fontSize: Typography.body.fontSize,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: Sizing.borderRadius,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: Colors.primaryLight,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  linkText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: 20,
  },
});
