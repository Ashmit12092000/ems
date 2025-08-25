// File: app/(app)/admin/attendance.tsx
// New screen for HODs to view and mark employee attendance.

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, FlatList, TouchableOpacity } from 'react-native';
import { useDatabase } from '../../../context/DatabaseContext';
import { Picker } from '@react-native-picker/picker';

// Define a specific type for attendance statuses
type AttendanceStatus = 'Present' | 'Absent' | 'Leave';

const ATTENDANCE_STATUSES: AttendanceStatus[] = ['Present', 'Absent', 'Leave'];

interface Employee {
  id: number;
  username: string;
}

interface AttendanceRecord {
  user_id: number;
  status: string;
}

export default function AttendanceScreen() {
  const { db } = useDatabase();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Record<number, string>>({});

  const fetchEmployees = useCallback(async () => {
    if (!db) return;
    try {
      const result = await db.getAllAsync<Employee>(
        "SELECT id, username FROM users WHERE role = 'Employee';"
      );
      setEmployees(result);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  }, [db]);

  const fetchAttendanceForDate = useCallback(async () => {
    if (!db || !date) return;
    try {
      const result = await db.getAllAsync<AttendanceRecord>(
        'SELECT user_id, status FROM attendance WHERE date = ?;',
        date
      );
      const newAttendance: Record<number, string> = {};
      result.forEach(item => {
        newAttendance[item.user_id] = item.status;
      });
      setAttendance(newAttendance);
    } catch (error) {
      console.error("Error fetching attendance for date:", error);
    }
  }, [db, date]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchAttendanceForDate();
  }, [fetchAttendanceForDate]);

  const handleStatusChange = (userId: number, status: AttendanceStatus) => {
    setAttendance(prev => ({
      ...prev,
      [userId]: status,
    }));
  };

  const handleSaveChanges = async () => {
    if (!db) {
      Alert.alert("Error", "Database not ready.");
      return;
    }
    try {
      await db.withTransactionAsync(async () => {
        for (const employee of employees) {
          const status = attendance[employee.id] || 'Absent'; // Default to Absent
          await db.runAsync(
            `REPLACE INTO attendance (user_id, date, status) VALUES (?, ?, ?);`,
            employee.id,
            date,
            status
          );
        }
      });
      Alert.alert("Success", `Attendance for ${date} has been saved.`);
    } catch (error) {
      console.error("Error saving attendance:", error);
      Alert.alert("Error", "Failed to save attendance.");
    }
  };

  const renderEmployeeItem = ({ item }: { item: Employee }) => (
    <View style={styles.employeeRow}>
      <Text style={styles.employeeName}>{item.username}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={attendance[item.id] || 'Absent'}
          onValueChange={(itemValue: AttendanceStatus) => handleStatusChange(item.id, itemValue)}
          style={styles.picker}
        >
          {ATTENDANCE_STATUSES.map(status => (
            <Picker.Item key={status} label={status} value={status} />
          ))}
        </Picker>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Date:</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
      />
      
      <FlatList
        data={employees}
        renderItem={renderEmployeeItem}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={<Text style={styles.listHeader}>Mark Attendance</Text>}
        style={styles.list}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
        <Text style={styles.saveButtonText}>Save Attendance</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
        backgroundColor: '#f8f8f8',
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
        color: '#3b5998',
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
