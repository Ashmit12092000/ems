
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useDatabase } from '../../../context/DatabaseContext';
import { Colors, Typography, Spacing, BorderRadius } from '../../../theme/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import { ModernCard } from '../../../components/ui/ModernCard';
import { ModernInput } from '../../../components/ui/ModernInput';
import { ModernButton } from '../../../components/ui/ModernButton';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

interface User {
  id: number;
  username: string;
  role: string;
}

interface RosterEntry {
  id: number;
  user_id: number;
  date: string;
  shift_type: string;
  username?: string;
}

const SHIFT_TYPES = [
  { value: 'Morning', label: 'Morning (6AM - 2PM)', icon: 'sun', color: '#FF9500' },
  { value: 'Afternoon', label: 'Afternoon (2PM - 10PM)', icon: 'cloud-sun', color: '#007AFF' },
  { value: 'Night', label: 'Night (10PM - 6AM)', icon: 'moon', color: '#5856D6' },
  { value: 'Off', label: 'Day Off', icon: 'bed', color: '#34C759' },
];

export default function DutyRosterScreen() {
  const { database } = useDatabase();
  const [users, setUsers] = useState<User[]>([]);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedShift, setSelectedShift] = useState('Morning');

  useEffect(() => {
    loadUsers();
    loadRoster();
  }, [selectedDate]);

  const loadUsers = async () => {
    if (!database) return;

    try {
      const result = await database.getAllAsync('SELECT * FROM users ORDER BY username') as User[];
      setUsers(result);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadRoster = async () => {
    if (!database) return;

    try {
      const result = await database.getAllAsync(
        `SELECT r.*, u.username 
         FROM duty_roster r 
         LEFT JOIN users u ON r.user_id = u.id 
         WHERE r.date = ? 
         ORDER BY u.username`,
        [selectedDate]
      ) as RosterEntry[];
      setRoster(result);
    } catch (error) {
      console.error('Error loading roster:', error);
    }
  };

  const addRosterEntry = async () => {
    if (!database || !selectedUser) return;

    try {
      // Check if entry already exists
      const existing = await database.getFirstAsync(
        'SELECT id FROM duty_roster WHERE user_id = ? AND date = ?',
        [selectedUser.id, selectedDate]
      );

      if (existing) {
        // Update existing entry
        await database.runAsync(
          'UPDATE duty_roster SET shift_type = ? WHERE user_id = ? AND date = ?',
          [selectedShift, selectedUser.id, selectedDate]
        );
      } else {
        // Insert new entry
        await database.runAsync(
          'INSERT INTO duty_roster (user_id, date, shift_type) VALUES (?, ?, ?)',
          [selectedUser.id, selectedDate, selectedShift]
        );
      }

      setModalVisible(false);
      setSelectedUser(null);
      loadRoster();
      Alert.alert('Success', 'Roster entry saved successfully');
    } catch (error) {
      console.error('Error saving roster entry:', error);
      Alert.alert('Error', 'Failed to save roster entry');
    }
  };

  const deleteRosterEntry = async (entryId: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to remove this roster entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await database?.runAsync('DELETE FROM duty_roster WHERE id = ?', [entryId]);
              loadRoster();
              Alert.alert('Success', 'Roster entry deleted successfully');
            } catch (error) {
              console.error('Error deleting roster entry:', error);
              Alert.alert('Error', 'Failed to delete roster entry');
            }
          },
        },
      ]
    );
  };

  const getShiftInfo = (shiftType: string) => {
    return SHIFT_TYPES.find(shift => shift.value === shiftType) || SHIFT_TYPES[0];
  };

  const renderRosterItem = ({ item, index }: { item: RosterEntry; index: number }) => {
    const shiftInfo = getShiftInfo(item.shift_type);
    
    return (
      <Animated.View entering={FadeInUp.delay(index * 100)}>
        <ModernCard style={styles.rosterCard}>
          <View style={styles.rosterHeader}>
            <View style={styles.userInfo}>
              <View style={styles.userIcon}>
                <FontAwesome5 name="user" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.username}>{item.username}</Text>
            </View>
            <TouchableOpacity
              onPress={() => deleteRosterEntry(item.id)}
              style={styles.deleteButton}
            >
              <FontAwesome5 name="trash" size={14} color={Colors.error} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.shiftInfo}>
            <View style={[styles.shiftIcon, { backgroundColor: shiftInfo.color + '15' }]}>
              <FontAwesome5 name={shiftInfo.icon} size={16} color={shiftInfo.color} />
            </View>
            <View style={styles.shiftDetails}>
              <Text style={styles.shiftType}>{shiftInfo.value}</Text>
              <Text style={styles.shiftTime}>{shiftInfo.label}</Text>
            </View>
          </View>
        </ModernCard>
      </Animated.View>
    );
  };

  const renderShiftOption = (shift: typeof SHIFT_TYPES[0]) => (
    <TouchableOpacity
      key={shift.value}
      style={[
        styles.shiftOption,
        selectedShift === shift.value && styles.selectedShiftOption
      ]}
      onPress={() => setSelectedShift(shift.value)}
    >
      <View style={[styles.shiftOptionIcon, { backgroundColor: shift.color + '15' }]}>
        <FontAwesome5 name={shift.icon} size={16} color={shift.color} />
      </View>
      <View style={styles.shiftOptionText}>
        <Text style={[
          styles.shiftOptionLabel,
          selectedShift === shift.value && styles.selectedShiftOptionLabel
        ]}>
          {shift.value}
        </Text>
        <Text style={styles.shiftOptionTime}>{shift.label}</Text>
      </View>
      {selectedShift === shift.value && (
        <FontAwesome5 name="check" size={16} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown} style={styles.header}>
        <View style={styles.headerIcon}>
          <FontAwesome5 name="calendar-alt" size={24} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Duty Roster</Text>
        <Text style={styles.subtitle}>Manage employee work schedules</Text>
      </Animated.View>

      <View style={styles.dateSelector}>
        <ModernInput
          label="Select Date"
          value={selectedDate}
          onChangeText={setSelectedDate}
          placeholder="YYYY-MM-DD"
          leftIcon="calendar"
        />
      </View>

      <View style={styles.addButtonContainer}>
        <ModernButton
          title="Add Roster Entry"
          onPress={() => setModalVisible(true)}
          variant="primary"
          leftIcon="plus"
        />
      </View>

      <FlatList
        data={roster}
        renderItem={renderRosterItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyContainer}>
            <FontAwesome5 name="calendar-times" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No roster entries</Text>
            <Text style={styles.emptySubtitle}>
              Add roster entries for {selectedDate}
            </Text>
          </Animated.View>
        }
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Roster Entry</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome5 name="times" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.userSelection}>
              <Text style={styles.sectionLabel}>Select Employee</Text>
              <FlatList
                data={users}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.userOption,
                      selectedUser?.id === item.id && styles.selectedUserOption
                    ]}
                    onPress={() => setSelectedUser(item)}
                  >
                    <FontAwesome5 name="user" size={16} color={Colors.primary} />
                    <Text style={[
                      styles.userOptionText,
                      selectedUser?.id === item.id && styles.selectedUserOptionText
                    ]}>
                      {item.username}
                    </Text>
                    {selectedUser?.id === item.id && (
                      <FontAwesome5 name="check" size={16} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id.toString()}
                style={styles.userList}
                showsVerticalScrollIndicator={false}
              />
            </View>

            <View style={styles.shiftSelection}>
              <Text style={styles.sectionLabel}>Select Shift</Text>
              {SHIFT_TYPES.map(renderShiftOption)}
            </View>

            <View style={styles.modalActions}>
              <ModernButton
                title="Cancel"
                onPress={() => setModalVisible(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <ModernButton
                title="Save"
                onPress={addRosterEntry}
                variant="primary"
                style={styles.modalButton}
                disabled={!selectedUser}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
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
    paddingBottom: Spacing.md,
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
  },
  dateSelector: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  addButtonContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  rosterCard: {
    marginBottom: Spacing.md,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  username: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  shiftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  shiftDetails: {
    flex: 1,
  },
  shiftType: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  shiftTime: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  sectionLabel: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  userSelection: {
    marginBottom: Spacing.lg,
  },
  userList: {
    maxHeight: 150,
  },
  userOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.backgroundSecondary,
  },
  selectedUserOption: {
    backgroundColor: Colors.primaryLight,
  },
  userOptionText: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  selectedUserOptionText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  shiftSelection: {
    marginBottom: Spacing.lg,
  },
  shiftOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.backgroundSecondary,
  },
  selectedShiftOption: {
    backgroundColor: Colors.primaryLight,
  },
  shiftOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  shiftOptionText: {
    flex: 1,
  },
  shiftOptionLabel: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  selectedShiftOptionLabel: {
    color: Colors.primary,
    fontWeight: '600',
  },
  shiftOptionTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
