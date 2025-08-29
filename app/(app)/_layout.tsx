
import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../theme/theme';

export default function AppLayout() {
  const { user } = useAuth();
  const isHOD = user?.role === 'HOD';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.lightText,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      }}>
      
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="home" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="file-alt" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="user" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="cog" size={size} color={color} />
          ),
          href: isHOD ? undefined : null,
        }}
      />
      
      {/* Hide notifications from tabs but keep it accessible via direct navigation */}
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
