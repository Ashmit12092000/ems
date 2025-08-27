
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Sizing, Typography } from '../../theme/theme';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const isHOD = user?.role === 'HOD';

  const QuickActionCard = ({ 
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
    <Animated.View entering={FadeIn.duration(600)} style={styles.quickActionCard}>
      <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
        <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
          <FontAwesome5 name={icon} size={24} color={color} />
        </View>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionDescription}>{description}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.username}</Text>
            <Text style={styles.userRole}>{user?.role}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
          >
            <FontAwesome5 name="bell" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <Animated.View entering={FadeIn.duration(800)} style={styles.statCard}>
            <FontAwesome5 name="calendar-check" size={32} color={Colors.success} />
            <Text style={styles.statNumber}>22</Text>
            <Text style={styles.statLabel}>Days Present</Text>
          </Animated.View>
          
          <Animated.View entering={FadeIn.duration(900)} style={styles.statCard}>
            <FontAwesome5 name="calendar-times" size={32} color={Colors.warning} />
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Leaves Taken</Text>
          </Animated.View>
          
          <Animated.View entering={FadeIn.duration(1000)} style={styles.statCard}>
            <FontAwesome5 name="clock" size={32} color={Colors.info} />
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Animated.View>
        </View>

        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.quickActionsGrid}>
            {isHOD ? (
              <>
                <QuickActionCard
                  icon="list-alt"
                  title="Pending Requests"
                  description="Review employee requests"
                  onPress={() => router.push('/requests')}
                  color={Colors.primary}
                />
                <QuickActionCard
                  icon="users"
                  title="Employee Attendance"
                  description="View attendance records"
                  onPress={() => router.push('/admin/attendance')}
                  color={Colors.secondary}
                />
                <QuickActionCard
                  icon="calendar-alt"
                  title="Duty Roster"
                  description="Manage schedules"
                  onPress={() => router.push('/admin/roster')}
                  color={Colors.info}
                />
                <QuickActionCard
                  icon="cog"
                  title="Settings"
                  description="System configuration"
                  onPress={() => router.push('/admin')}
                  color={Colors.darkText}
                />
              </>
            ) : (
              <>
                <QuickActionCard
                  icon="calendar-times"
                  title="Apply Leave"
                  description="Submit leave request"
                  onPress={() => router.push('/requests/leave')}
                  color={Colors.primary}
                />
                <QuickActionCard
                  icon="clock"
                  title="Permission"
                  description="Request permission"
                  onPress={() => router.push('/requests/permission')}
                  color={Colors.secondary}
                />
                <QuickActionCard
                  icon="exchange-alt"
                  title="Shift Change"
                  description="Change your shift"
                  onPress={() => router.push('/requests/shift')}
                  color={Colors.info}
                />
                <QuickActionCard
                  icon="history"
                  title="My Requests"
                  description="View request history"
                  onPress={() => router.push('/requests/my-requests')}
                  color={Colors.darkText}
                />
              </>
            )}
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Sizing.padding,
    paddingTop: Sizing.padding * 1.5,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    ...Typography.body,
    color: Colors.lightText,
  },
  userName: {
    ...Typography.h1,
    marginTop: 4,
  },
  userRole: {
    ...Typography.caption,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  notificationButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Sizing.padding,
    marginBottom: Sizing.margin,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: Sizing.padding,
    borderRadius: Sizing.borderRadius,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    ...Typography.h1,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.lightText,
    textAlign: 'center',
  },
  quickActionsSection: {
    padding: Sizing.padding,
  },
  sectionTitle: {
    ...Typography.h2,
    marginBottom: Sizing.margin,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    marginBottom: Sizing.margin,
  },
  quickActionButton: {
    backgroundColor: Colors.white,
    padding: Sizing.padding,
    borderRadius: Sizing.borderRadius,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Sizing.margin,
  },
  quickActionTitle: {
    ...Typography.h3,
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionDescription: {
    ...Typography.caption,
    color: Colors.lightText,
    textAlign: 'center',
  },
});
