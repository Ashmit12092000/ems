
import React from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

export default function AppLayout() {
  const { user } = useAuth();

  const commonTabs = [
    {
      name: 'home',
      title: 'Home',
      icon: 'home' as const,
    },
    {
      name: 'requests',
      title: 'Requests',
      icon: 'document-text' as const,
    },
    {
      name: 'notifications',
      title: 'Notifications',
      icon: 'notifications' as const,
    },
    {
      name: 'profile',
      title: 'Profile',
      icon: 'person' as const,
    },
  ];

  const hodTabs = [
    {
      name: 'admin',
      title: 'Admin',
      icon: 'settings' as const,
    },
  ];

  const tabs = user?.role === 'HOD' ? [...commonTabs, ...hodTabs] : commonTabs;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: Colors.background,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: Colors.textPrimary,
        },
        headerTintColor: Colors.primary,
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tab.icon} size={size || 24} color={color} />
            ),
            href: tab.name === 'admin' && user?.role !== 'HOD' ? null : undefined,
          }}
        />
      ))}
    </Tabs>
  );
}
