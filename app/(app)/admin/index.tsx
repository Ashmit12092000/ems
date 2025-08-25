
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ModernCard } from '../../../components/ui/ModernCard';
import { ModernButton } from '../../../components/ui/ModernButton';
import { Colors, Typography, Spacing, BorderRadius } from '../../../theme/theme';
import { useAuth } from '../../../context/AuthContext';

export default function AdminIndexScreen() {
  const { user } = useAuth();

  const adminActions = [
    {
      title: 'Monthly Limits',
      subtitle: 'Set leave and permission limits',
      onPress: () => router.push('/(app)/admin/limits'),
      color: Colors.primary,
    },
    {
      title: 'Duty Roster',
      subtitle: 'Manage duty schedules',
      onPress: () => router.push('/(app)/admin/roster'),
      color: Colors.success,
    },
    {
      title: 'Attendance',
      subtitle: 'Mark attendance records',
      onPress: () => router.push('/(app)/admin/attendance'),
      color: Colors.warning,
    },
  ];

  const ActionCard = ({ title, subtitle, onPress, color }: typeof adminActions[0]) => (
    <ModernCard variant="outlined" style={styles.actionCard}>
      <View style={styles.actionContent}>
        <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
          <View style={[styles.actionDot, { backgroundColor: color }]} />
        </View>
        <View style={styles.actionInfo}>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <ModernButton
        title="Manage"
        onPress={onPress}
        variant="ghost"
        size="small"
      />
    </ModernCard>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Manage your organization settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Management Tools</Text>
        <View style={styles.actionsGrid}>
          {adminActions.map((action, index) => (
            <ActionCard key={index} {...action} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.headingLarge,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.headingMedium,
    marginBottom: Spacing.lg,
  },
  actionsGrid: {
    gap: Spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    ...Typography.labelLarge,
    marginBottom: Spacing.xs,
  },
  actionSubtitle: {
    ...Typography.bodySmall,
  },
});
