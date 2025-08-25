
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useDatabase } from '../../../context/DatabaseContext';
import { Colors, Typography, Spacing, BorderRadius } from '../../../theme/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import { ModernCard } from '../../../components/ui/ModernCard';
import { ModernInput } from '../../../components/ui/ModernInput';
import { ModernButton } from '../../../components/ui/ModernButton';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

interface MonthlyLimit {
  limit_type: string;
  value: number;
}

export default function MonthlyLimitsScreen() {
  const { database } = useDatabase();
  const [limits, setLimits] = useState<{[key: string]: string}>({
    leave: '',
    permission: '',
    shift: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadLimits();
  }, []);

  const loadLimits = async () => {
    if (!database) return;

    try {
      const result = await database.getAllAsync('SELECT * FROM monthly_limits') as MonthlyLimit[];
      const limitsData = result.reduce((acc, item) => {
        acc[item.limit_type] = item.value.toString();
        return acc;
      }, {} as {[key: string]: string});

      setLimits(prevLimits => ({
        ...prevLimits,
        ...limitsData,
      }));
    } catch (error) {
      console.error('Error loading limits:', error);
      Alert.alert('Error', 'Failed to load monthly limits');
    }
  };

  const validateLimits = () => {
    const newErrors: {[key: string]: string} = {};
    
    Object.entries(limits).forEach(([key, value]) => {
      const numValue = parseInt(value);
      if (!value.trim()) {
        newErrors[key] = 'This field is required';
      } else if (isNaN(numValue) || numValue < 0) {
        newErrors[key] = 'Must be a positive number';
      } else if (numValue > 31) {
        newErrors[key] = 'Cannot exceed 31 days';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveLimits = async () => {
    if (!validateLimits()) return;
    if (!database) return;

    setLoading(true);
    try {
      for (const [limitType, value] of Object.entries(limits)) {
        await database.runAsync(
          'INSERT OR REPLACE INTO monthly_limits (limit_type, value) VALUES (?, ?)',
          [limitType, parseInt(value)]
        );
      }
      Alert.alert('Success', 'Monthly limits updated successfully');
    } catch (error) {
      console.error('Error saving limits:', error);
      Alert.alert('Error', 'Failed to save monthly limits');
    } finally {
      setLoading(false);
    }
  };

  const updateLimit = (type: string, value: string) => {
    setLimits(prev => ({ ...prev, [type]: value }));
    if (errors[type]) {
      setErrors(prev => ({ ...prev, [type]: '' }));
    }
  };

  const limitTypes = [
    {
      key: 'leave',
      label: 'Leave Days',
      icon: 'calendar-times',
      description: 'Maximum leave days per month',
      color: Colors.primary,
    },
    {
      key: 'permission',
      label: 'Permission Hours',
      icon: 'user-clock',
      description: 'Maximum permission hours per month',
      color: Colors.secondary,
    },
    {
      key: 'shift',
      label: 'Shift Changes',
      icon: 'exchange-alt',
      description: 'Maximum shift adjustments per month',
      color: Colors.accent,
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown} style={styles.header}>
        <View style={styles.headerIcon}>
          <FontAwesome5 name="cogs" size={24} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Monthly Limits</Text>
        <Text style={styles.subtitle}>
          Configure maximum allowances for employee requests
        </Text>
      </Animated.View>

      <View style={styles.content}>
        {limitTypes.map((limitType, index) => (
          <Animated.View 
            key={limitType.key}
            entering={FadeInUp.delay(index * 100)}
          >
            <ModernCard style={styles.limitCard}>
              <View style={styles.limitHeader}>
                <View style={[styles.limitIcon, { backgroundColor: limitType.color + '15' }]}>
                  <FontAwesome5 name={limitType.icon} size={20} color={limitType.color} />
                </View>
                <View style={styles.limitInfo}>
                  <Text style={styles.limitLabel}>{limitType.label}</Text>
                  <Text style={styles.limitDescription}>{limitType.description}</Text>
                </View>
              </View>
              
              <ModernInput
                value={limits[limitType.key]}
                onChangeText={(value) => updateLimit(limitType.key, value)}
                placeholder="Enter limit"
                keyboardType="numeric"
                error={errors[limitType.key]}
                rightIcon="hashtag"
              />
            </ModernCard>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInUp.delay(400)}>
          <ModernCard style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <FontAwesome5 name="chart-bar" size={18} color={Colors.primary} />
              <Text style={styles.summaryTitle}>Current Settings</Text>
            </View>
            <View style={styles.summaryContent}>
              {limitTypes.map((limitType) => (
                <View key={limitType.key} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{limitType.label}:</Text>
                  <Text style={styles.summaryValue}>
                    {limits[limitType.key] || '0'} {limitType.key === 'permission' ? 'hours' : limitType.key === 'shift' ? 'changes' : 'days'}
                  </Text>
                </View>
              ))}
            </View>
          </ModernCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500)} style={styles.buttonContainer}>
          <ModernButton
            title="Save Limits"
            onPress={saveLimits}
            loading={loading}
            variant="primary"
            leftIcon="save"
          />
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  limitCard: {
    marginBottom: Spacing.lg,
  },
  limitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  limitIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  limitInfo: {
    flex: 1,
  },
  limitLabel: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  limitDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  summaryCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.backgroundSecondary,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryTitle: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  summaryContent: {
    gap: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  summaryLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  summaryValue: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: Spacing.md,
  },
});
