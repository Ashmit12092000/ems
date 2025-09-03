
// File: app/(app)/admin/roster.tsx
// A user-friendly screen for HODs to manage the duty roster directly in the app.

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, FlatList, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../../lib/supabase';

// Define a specific type for shift values for type safety
type ShiftType = 'Morning' | 'Evening' | 'Night' | 'Off';

const SHIFT_TYPES: ShiftType[] = ['Morning', 'Evening', 'Night', 'Off'];

interface Employee {
  id: string;
  username: string;
}

interface RosterEntry {
  user_id: string;
  shift_type: string;
}

export default function RosterManagementScreen() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roster, setRoster] = useState<Record<string, string>>({});

  const fetchEmployees = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username')
        .eq('role', 'Employee');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  }, []);

  const fetchRosterForDate = useCallback(async () => {
    if (!date) return;
    try {
      const { data, error } = await supabase
        .from('duty_roster')
        .select('user_id, shift_type')
        .eq('date', date);

      if (error) throw error;

      const newRoster: Record<string, string> = {};
      (data || []).forEach(item => {
        newRoster[item.user_id] = item.shift_type;
      });
      setRoster(newRoster);
    } catch (error) {
      console.error("Error fetching roster for date:", error);
    }
  }, [date]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchRosterForDate();
  }, [fetchRosterForDate]);

  const handleShiftChange = (userId: string, shiftType: ShiftType) => {
    setRoster(prevRoster => ({
      ...prevRoster,
      [userId]: shiftType,
    }));
  };

  const handleSaveChanges = async () => {
    try {
      // Delete existing entries for this date
      await supabase
        .from('duty_roster')
        .delete()
        .eq('date', date);

      // Insert new entries
      const rosterEntries = employees.map(employee => ({
        user_id: employee.id,
        date: date,
        shift_type: roster[employee.id] || 'Off'
      }));

      const { error } = await supabase
        .from('duty_roster')
        .insert(rosterEntries);

      if (error) throw error;

      Alert.alert("Success", `Roster for ${date} has been saved.`);
    } catch (error) {
      console.error("Error saving roster:", error);
      Alert.alert("Error", "Failed to save roster changes.");
    }
  };

  const renderEmployeeItem = ({ item }: { item: Employee }) => (
    <View style={styles.employeeRow}>
      <Text style={styles.employeeName}>{item.username}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={roster[item.id] || 'Off'}
          onValueChange={(itemValue: ShiftType) => handleShiftChange(item.id, itemValue)}
          style={styles.picker}
        >
          {SHIFT_TYPES.map(shift => (
            <Picker.Item key={shift} label={shift} value={shift} />
          ))}
        </Picker>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Date (YYYY-MM-DD):</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="e.g., 2025-09-15"
      />
      
      <FlatList
        data={employees}
        renderItem={renderEmployeeItem}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={<Text style={styles.listHeader}>Assign Shifts</Text>}
        style={styles.list}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
        <Text style={styles.saveButtonText}>Save Roster for {date}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  list: {
    flex: 1,
  },
  listHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  employeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  employeeName: {
    fontSize: 16,
    flex: 1,
  },
  pickerContainer: {
    flex: 1.5,
    height: 50,
    justifyContent: 'center',
  },
  picker: {
    height: 50,
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
