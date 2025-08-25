// File: app/(app)/admin/limits.tsx
// Screen for HODs to set monthly request limits.

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useDatabase } from '../../../context/DatabaseContext';

export default function LimitsScreen() {
  const { db } = useDatabase();
  const [leaveLimit, setLeaveLimit] = useState('');

  const fetchCurrentLimit = useCallback(async () => {
    if (!db) return;
    try {
      const result = await db.getFirstAsync<{ value: number }>(
        'SELECT value FROM monthly_limits WHERE limit_type = ?;',
        'leave'
      );
      if (result) {
        setLeaveLimit(result.value.toString());
      }
    } catch (error) {
      console.error('Error fetching limit:', error);
    }
  }, [db]);

  useEffect(() => {
    fetchCurrentLimit();
  }, [fetchCurrentLimit]);

  const handleSetLimit = async () => {
    if (!db) return;
    if (!leaveLimit || isNaN(parseInt(leaveLimit))) {
      Alert.alert('Error', 'Please enter a valid number for the limit.');
      return;
    }
    try {
      await db.runAsync(
        'REPLACE INTO monthly_limits (limit_type, value) VALUES (?, ?);',
        'leave',
        parseInt(leaveLimit)
      );
      Alert.alert('Success', 'Monthly leave limit has been updated.');
    } catch (error) {
      console.error('Error setting limit:', error);
      Alert.alert('Error', 'Failed to set the limit.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Set Monthly Leave Request Limit:</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 2"
        keyboardType="numeric"
        value={leaveLimit}
        onChangeText={setLeaveLimit}
      />
      <TouchableOpacity style={styles.button} onPress={handleSetLimit}>
        <Text style={styles.buttonText}>Save Limit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
