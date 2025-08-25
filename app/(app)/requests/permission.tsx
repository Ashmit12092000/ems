// File: app/(app)/requests/permission.tsx
// Redesigned with a user-friendly date picker and modern UI.

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../context/DatabaseContext';
import { useRouter } from 'expo-router';
import { Colors, Sizing, Typography } from '../../../theme/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function PermissionRequestScreen() {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reason, setReason] = useState('');
  const { user } = useAuth();
  const { db } = useDatabase();
  const router = useRouter();

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleSubmit = async () => {
    const formattedDate = date.toISOString().split('T')[0];
    if (!reason) {
      Alert.alert('Error', 'Please provide a reason for your permission request.');
      return;
    }
    if (!db || !user) {
      Alert.alert('Error', 'Database or user not available.');
      return;
    }

    try {
      await db.runAsync(
        'INSERT INTO requests (user_id, type, date, reason, status) VALUES (?, ?, ?, ?, ?);',
        user.id, 'permission', formattedDate, reason, 'pending'
      );
      
      Alert.alert('Success', 'Your permission request has been submitted.');
      router.back();
    } catch (error) {
      console.error('Error submitting permission request:', error);
      Alert.alert('Error', 'Failed to submit request.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={Typography.label}>Date of Permission</Text>
      <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
        <FontAwesome5 name="calendar-alt" size={16} color={Colors.secondary} />
        <Text style={styles.datePickerText}>{date.toLocaleDateString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      <Text style={Typography.label}>Reason for Permission</Text>
      <TextInput
        style={styles.textArea}
        placeholder="e.g., Personal work for 2 hours..."
        placeholderTextColor={Colors.lightText}
        value={reason}
        onChangeText={setReason}
        multiline
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Request</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Sizing.padding,
    backgroundColor: Colors.background,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Sizing.borderRadius,
    padding: Sizing.padding,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Sizing.margin,
  },
  datePickerText: {
    ...Typography.body,
    color: Colors.darkText,
    marginLeft: 10,
  },
  textArea: {
    backgroundColor: Colors.white,
    borderRadius: Sizing.borderRadius,
    padding: Sizing.padding,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 120,
    textAlignVertical: 'top',
    ...Typography.body,
    color: Colors.darkText,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: Sizing.borderRadius,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: Sizing.margin,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
