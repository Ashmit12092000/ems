
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Sizing, Typography } from '../../../theme/theme';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect if not HOD
  if (user?.role !== 'HOD') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDenied}>
          <FontAwesome5 name="ban" size={64} color={Colors.danger} />
          <Text style={styles.accessDeniedText}>Access Denied</Text>
          <Text style={styles.accessDeniedSubtext}>Only HOD users can access this section</Text>
        </View>
      </SafeAreaView>
    );
  }

  const AdminCard = ({ 
    icon, 
    title, 
    description, 
    onPress, 
    color = Colors.primary 
  }: { 
    icon: React.ComponentProps<typeof FontAwesome5>['name'];
    title: string;
    description: string;
    onPress: () => void;
    color?: string;
  }) => (
    <Animated.View entering={FadeIn.duration(600)}>
      <TouchableOpacity style={styles.adminCard} onPress={onPress}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <FontAwesome5 name={icon} size={32} color={color} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
        <FontAwesome5 name="chevron-right" size={20} color={Colors.lightText} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Panel</Text>
          <Text style={styles.subtitle}>Manage employees and system settings</Text>
        </View>

        <View style={styles.section}>
          <AdminCard
            icon="calendar-alt"
            title="Duty Roster"
            description="Manage employee duty schedules and shifts"
            onPress={() => router.push('/admin/roster')}
            color={Colors.primary}
          />
          
          <AdminCard
            icon="chart-line"
            title="Monthly Limits"
            description="Set monthly leave and permission limits"
            onPress={() => router.push('/admin/limits')}
            color={Colors.secondary}
          />
          
          <AdminCard
            icon="user-check"
            title="Employee Attendance"
            description="View and manage employee attendance records"
            onPress={() => router.push('/admin/attendance')}
            color={Colors.info}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Sizing.padding,
    paddingTop: Sizing.padding * 1.5,
  },
  title: {
    ...Typography.h1,
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.lightText,
  },
  section: {
    paddingHorizontal: Sizing.padding,
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Sizing.padding * 1.5,
    borderRadius: Sizing.borderRadius,
    marginBottom: Sizing.margin,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Sizing.margin * 1.5,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.h2,
    marginBottom: 6,
  },
  cardDescription: {
    ...Typography.body,
    color: Colors.lightText,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Sizing.padding,
  },
  accessDeniedText: {
    ...Typography.h1,
    color: Colors.danger,
    marginTop: Sizing.margin,
    marginBottom: 8,
  },
  accessDeniedSubtext: {
    ...Typography.body,
    color: Colors.lightText,
    textAlign: 'center',
  },
});
