// File: app/(auth)/register.tsx
// A cleaner, more minimalist registration screen with subtle animations.

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Sizing, Typography } from '../../theme/theme';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

type UserRole = 'Employee' | 'HOD';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Employee'); 
  const [loading, setLoading] = useState(false);
  const { register, isAuthReady } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const success = await register(username, password, role);
      if (success) {
        Alert.alert('Success', 'Registration successful! Please log in.');
        router.back();
      } else {
        Alert.alert('Registration Failed', 'This username might already be taken.');
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled = !isAuthReady || loading;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.kav}>
        <Animated.View entering={FadeInUp.duration(1000)}>
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.subtitle}>Get started with the team</Text>
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

            <View style={styles.inputContainer}>
                <FontAwesome5 name="user-shield" size={16} color={Colors.secondary} style={styles.icon} />
                <Picker
                    selectedValue={role}
                    onValueChange={(itemValue: UserRole) => setRole(itemValue)}
                    style={styles.picker}
                >
                    <Picker.Item label="Employee" value="Employee" />
                    <Picker.Item label="HOD" value="HOD" />
                </Picker>
            </View>

            <TouchableOpacity 
                style={[styles.button, isButtonDisabled && styles.buttonDisabled]} 
                onPress={handleRegister} 
                disabled={isButtonDisabled}
            >
                {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.buttonText}>Create Account</Text>}
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
  picker: {
    flex: 1,
    height: 50,
    borderWidth: 0, // Hide default picker border
    color: Colors.darkText,
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
});
