
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useDatabase } from '../../../context/DatabaseContext';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../../theme/theme';
import { ModernCard } from '../../../components/ui/ModernCard';
import { ModernButton } from '../../../components/ui/ModernButton';
import { ModernInput } from '../../../components/ui/ModernInput';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function ShiftRequestScreen() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for your shift change request');
      return;
    }

    if (!db || !user) {
      Alert.alert('Error', 'Database connection error');
      return;
    }

    setLoading(true);

    try {
      const dateString = date.toISOString().split('T')[0];
      
      await db.runAsync(
        'INSERT INTO requests (user_id, type, date, reason, status) VALUES (?, ?, ?, ?, ?)',
        [user.id, 'Shift Change', dateString, reason, 'pending']
      );

      // Create notification for admin
      await db.runAsync(
        'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
        [1, 'New Shift Request', `New shift change request from ${user.username} for ${dateString}`]
      );

      Alert.alert('Success', 'Shift change request submitted successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error submitting shift request:', error);
      Alert.alert('Error', 'Failed to submit shift change request');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <View style={styles.iconContainer}>
            <FontAwesome5 name="exchange-alt" size={32} color={Colors.info} />
          </View>
          <Text style={styles.title}>Shift Change Request</Text>
          <Text style={styles.subtitle}>Request a change in your work shift schedule</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)}>
          <ModernCard style={styles.formCard}>
            <View style={styles.formSection}>
              <Text style={styles.label}>Date for Shift Change</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <FontAwesome5 name="calendar" size={20} color={Colors.info} />
                <Text style={styles.dateText}>{formatDate(date)}</Text>
                <FontAwesome5 name="chevron-down" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Reason for Shift Change</Text>
              <ModernInput
                placeholder="Enter the reason for your shift change request..."
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={4}
                style={styles.reasonInput}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.infoBox}>
              <FontAwesome5 name="info-circle" size={20} color={Colors.info} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Shift Change Guidelines</Text>
                <Text style={styles.infoText}>
                  • Submit requests at least 48 hours in advance{'\n'}
                  • Mention your current shift and preferred shift{'\n'}
                  • Provide a valid reason for the change{'\n'}
                  • Consider operational requirements and team coverage
                </Text>
              </View>
            </View>

            <ModernButton
              title={loading ? "Submitting..." : "Submit Request"}
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.submitButton, { backgroundColor: Colors.info }]}
            />
          </ModernCard>
        </Animated.View>

        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={onDateChange}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  formCard: {
    padding: Spacing.xl,
  },
  formSection: {
    marginBottom: Spacing.xl,
  },
  label: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  dateText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
    marginLeft: Spacing.md,
  },
  reasonInput: {
    minHeight: 120,
    paddingTop: Spacing.lg,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.infoLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  infoTitle: {
    ...Typography.bodyBold,
    color: Colors.info,
    marginBottom: Spacing.sm,
  },
  infoText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
});
