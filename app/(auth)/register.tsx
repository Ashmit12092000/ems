
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useDatabase } from '../../context/DatabaseContext';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import { ModernCard } from '../../components/ui/ModernCard';
import { ModernInput } from '../../components/ui/ModernInput';
import { ModernButton } from '../../components/ui/ModernButton';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as Crypto from 'expo-crypto';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'Employee' as 'Employee' | 'HOD',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const { db } = useDatabase();

  const hashPassword = async (password: string): Promise<string> => {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    console.log('Registration started');
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    if (!db) {
      console.log('Database not available');
      Alert.alert('Error', 'Database not initialized');
      return;
    }

    console.log('Starting registration process...');
    setLoading(true);
    try {
      // Check if username already exists
      const existingUser = await db.getFirstAsync(
        'SELECT id FROM users WHERE username = ?',
        [formData.username]
      );

      if (existingUser) {
        Alert.alert('Error', 'Username already exists');
        setLoading(false);
        return;
      }

      // Hash password and insert new user
      const hashedPassword = await hashPassword(formData.password);
      await db.runAsync(
        'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
        [formData.username, hashedPassword, formData.role]
      );

      console.log('User registered successfully');
      Alert.alert(
        'Success',
        'Account created successfully! You can now log in.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', `Failed to create account: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(600)} style={styles.content}>
          <View style={styles.header}>
            <Animated.View entering={FadeInUp.delay(200)} style={styles.logoContainer}>
              <FontAwesome5 name="user-plus" size={32} color={Colors.primary} />
            </Animated.View>
            <Animated.Text entering={FadeInUp.delay(400)} style={styles.title}>
              Create Account
            </Animated.Text>
            <Animated.Text entering={FadeInUp.delay(600)} style={styles.subtitle}>
              Join our leave management system
            </Animated.Text>
          </View>

          <Animated.View entering={FadeInUp.delay(800)}>
            <ModernCard style={styles.formCard}>
              <View style={styles.form}>
                <ModernInput
                  label="Username"
                  value={formData.username}
                  onChangeText={(value) => updateFormData('username', value)}
                  placeholder="Enter your username"
                  leftIcon="user"
                  error={errors.username}
                  autoCapitalize="none"
                />

                <ModernInput
                  label="Password"
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  placeholder="Enter your password"
                  leftIcon="lock"
                  secureTextEntry
                  error={errors.password}
                />

                <ModernInput
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  placeholder="Confirm your password"
                  leftIcon="lock"
                  secureTextEntry
                  error={errors.confirmPassword}
                />

                <View style={styles.roleSelection}>
                  <Text style={styles.roleLabel}>Role</Text>
                  <View style={styles.roleButtons}>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        formData.role === 'Employee' && styles.activeRoleButton
                      ]}
                      onPress={() => updateFormData('role', 'Employee')}
                    >
                      <FontAwesome5 
                        name="user" 
                        size={16} 
                        color={formData.role === 'Employee' ? Colors.white : Colors.textSecondary} 
                      />
                      <Text style={[
                        styles.roleButtonText,
                        formData.role === 'Employee' && styles.activeRoleButtonText
                      ]}>
                        Employee
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        formData.role === 'HOD' && styles.activeRoleButton
                      ]}
                      onPress={() => updateFormData('role', 'HOD')}
                    >
                      <FontAwesome5 
                        name="user-tie" 
                        size={16} 
                        color={formData.role === 'HOD' ? Colors.white : Colors.textSecondary} 
                      />
                      <Text style={[
                        styles.roleButtonText,
                        formData.role === 'HOD' && styles.activeRoleButtonText
                      ]}>
                        HOD
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.buttonContainer}>
                  <ModernButton
                    title="Create Account"
                    onPress={handleRegister}
                    loading={loading}
                    variant="primary"
                  />
                </View>
              </View>
            </ModernCard>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(1000)} style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Link href="/(auth)/login" style={styles.linkText}>
                Sign In
              </Link>
            </Text>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    ...Typography.displayMedium,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    marginBottom: Spacing.xl,
  },
  form: {
    gap: Spacing.lg,
  },
  roleSelection: {
    marginVertical: Spacing.sm,
  },
  roleLabel: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeRoleButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleButtonText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    fontWeight: '500',
  },
  activeRoleButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: Spacing.md,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    ...Typography.bodyMedium,
    textAlign: 'center',
  },
  linkText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '600',
  },
});
