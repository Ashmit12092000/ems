
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Colors, Sizing, Typography } from '../../../theme/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../../lib/supabase';

interface Employee {
  id: string;
  username: string;
}

interface RosterEntry {
  user_id: string;
  shift_type: string;
  username: string;
}

export default function ShiftSwapRequestScreen() {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reason, setReason] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rosterEntries, setRosterEntries] = useState<RosterEntry[]>([]);
  const [targetEmployeeId, setTargetEmployeeId] = useState<string | null>(null);
  const [myShift, setMyShift] = useState<string>('');
  const [targetShift, setTargetShift] = useState<string>('');
  
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (date) {
      fetchRosterForDate();
    }
  }, [date]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username')
        .eq('role', 'Employee')
        .neq('id', user?.id);

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchRosterForDate = async () => {
    const formattedDate = date.toISOString().split('T')[0];
    try {
      const { data, error } = await supabase
        .from('duty_roster')
        .select(`
          user_id,
          shift_type,
          users!inner(username)
        `)
        .eq('date', formattedDate);

      if (error) throw error;

      const formattedData = (data || []).map(item => ({
        user_id: item.user_id,
        shift_type: item.shift_type,
        username: item.users.username
      }));

      setRosterEntries(formattedData);
      
      // Find current user's shift
      const myEntry = formattedData.find(entry => entry.user_id === user?.id);
      if (myEntry) {
        setMyShift(myEntry.shift_type);
      } else {
        setMyShift('');
      }
    } catch (error) {
      console.error('Error fetching roster:', error);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleTargetEmployeeChange = (employeeId: string) => {
    setTargetEmployeeId(employeeId);
    // Find the target employee's shift for this date
    const targetEntry = rosterEntries.find(entry => entry.user_id === employeeId);
    if (targetEntry) {
      setTargetShift(targetEntry.shift_type);
    } else {
      setTargetShift('');
    }
  };

  const handleSubmit = async () => {
    const formattedDate = date.toISOString().split('T')[0];
    
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the shift swap.');
      return;
    }
    
    if (!targetEmployeeId) {
      Alert.alert('Error', 'Please select an employee to swap with.');
      return;
    }
    
    if (!myShift) {
      Alert.alert('Error', 'You are not assigned any shift on this date.');
      return;
    }
    
    if (!targetShift) {
      Alert.alert('Error', 'The selected employee is not assigned any shift on this date. Please select a different employee or date.');
      return;
    }
    
    if (!user) {
      Alert.alert('Error', 'User not available.');
      return;
    }

    try {
      // Create shift swap request
      const { error: swapError } = await supabase
        .from('shift_swaps')
        .insert({
          requester_id: user.id,
          target_id: targetEmployeeId,
          date: formattedDate,
          requester_shift: myShift,
          target_shift: targetShift,
          reason: reason,
          status: 'pending_target_approval'
        });

      if (swapError) throw swapError;
      
      // Create notification for target employee
      const targetEmployee = employees.find(emp => emp.id === targetEmployeeId);
      const message = `${user.username} wants to swap your ${targetShift} shift on ${formattedDate} with their ${myShift} shift. Please review the request.`;
      
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: targetEmployeeId,
          message: message
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      }
      
      Alert.alert('Success', 'Your shift swap request has been sent for approval.');
      router.back();
    } catch (error) {
      console.error('Error submitting shift swap request:', error);
      Alert.alert('Error', 'Failed to submit request.');
    }
  };

  const getAvailableEmployees = () => {
    // Show all employees - they can swap even if not originally assigned to the date
    return employees;
  };

  return (
    <View style={styles.container}>
      <Text style={Typography.label}>Date of Shift Swap</Text>
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

      <Text style={Typography.label}>Your Assigned Shift</Text>
      <View style={styles.shiftDisplay}>
        <Text style={styles.shiftText}>{myShift || 'No shift assigned'}</Text>
      </View>

      <Text style={Typography.label}>Employee to Swap With</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={targetEmployeeId}
          style={styles.picker}
          onValueChange={handleTargetEmployeeChange}
        >
          <Picker.Item label="Select an employee..." value={null} />
          {getAvailableEmployees().map((employee) => {
            const entry = rosterEntries.find(e => e.user_id === employee.id);
            return (
              <Picker.Item 
                key={employee.id} 
                label={`${employee.username} (${entry?.shift_type || 'Not assigned'})`} 
                value={employee.id} 
              />
            );
          })}
        </Picker>
      </View>

      {targetShift && (
        <>
          <Text style={Typography.label}>Their Assigned Shift</Text>
          <View style={styles.shiftDisplay}>
            <Text style={styles.shiftText}>{targetShift}</Text>
          </View>
        </>
      )}

      <Text style={Typography.label}>Reason for Swap</Text>
      <TextInput
        style={styles.textArea}
        placeholder="e.g., Personal emergency, family commitment..."
        placeholderTextColor={Colors.lightText}
        value={reason}
        onChangeText={setReason}
        multiline
      />
      
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Send Swap Request</Text>
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
  shiftDisplay: {
    backgroundColor: Colors.white,
    borderRadius: Sizing.borderRadius,
    padding: Sizing.padding,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Sizing.margin,
  },
  shiftText: {
    ...Typography.body,
    color: Colors.darkText,
    fontWeight: 'bold',
  },
  pickerContainer: {
    backgroundColor: Colors.white,
    borderRadius: Sizing.borderRadius,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Sizing.margin,
  },
  picker: {
    height: 50,
    ...Typography.body,
    color: Colors.darkText,
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
