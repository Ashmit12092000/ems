import { Redirect } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';

export default function RequestsIndexScreen() {
  const { user } = useAuth();
  
  // HOD goes to list view to see all employee requests
  // Employee goes to their personal request management
  if (user?.role === 'HOD') {
    return <Redirect href="/(app)/requests/list" />;
  } else {
    return <Redirect href="/(app)/requests/my-requests" />;
  }
}