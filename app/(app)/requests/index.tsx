import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Sizing, Typography } from '../../../theme/theme';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function RequestsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const isHOD = user?.role === 'HOD';

  const RequestCard = ({ 
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
      <TouchableOpacity style={styles.requestCard} onPress={onPress}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <FontAwesome5 name={icon} size={24} color={color} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
        <FontAwesome5 name="chevron-right" size={16} color={Colors.lightText} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isHOD ? 'Manage Requests' : 'My Requests'}
          </Text>
          <Text style={styles.subtitle}>
            {isHOD 
              ? 'Review and approve employee requests' 
              : 'View and create your requests'
            }
          </Text>
        </View>

        <View style={styles.section}>
          {isHOD ? (
            <>
              <Text style={styles.sectionTitle}>HOD Actions</Text>
              <RequestCard
                icon="list"
                title="Pending Requests"
                description="Review and approve requests"
                onPress={() => router.push('/requests/list')}
                color={Colors.warning}
              />
              <RequestCard
                icon="history"
                title="Request History"
                description="View all processed requests"
                onPress={() => router.push('/requests/history')}
                color={Colors.info}
              />
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Create New Request</Text>
              <RequestCard
                icon="calendar-times"
                title="Leave Request"
                description="Apply for leave or vacation"
                onPress={() => router.push('/requests/leave')}
                color={Colors.primary}
              />
              <RequestCard
                icon="clock"
                title="Permission Request"
                description="Request permission for short breaks"
                onPress={() => router.push('/requests/permission')}
                color={Colors.secondary}
              />
              <RequestCard
                icon="exchange-alt"
                title="Shift Change"
                description="Request to change your shift"
                onPress={() => router.push('/requests/shift')}
                color={Colors.info}
              />

              <Text style={styles.sectionTitle}>My Requests</Text>
              <RequestCard
                icon="history"
                title="Request History"
                description="View all your previous requests"
                onPress={() => router.push('/requests/my-requests')}
                color={Colors.darkText}
              />
            </>
          )}
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
  sectionTitle: {
    ...Typography.h3,
    marginTop: Sizing.margin * 1.5,
    marginBottom: Sizing.margin,
    color: Colors.darkText,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Sizing.padding,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Sizing.margin,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.h3,
    marginBottom: 4,
  },
  cardDescription: {
    ...Typography.body,
    color: Colors.lightText,
  },
});