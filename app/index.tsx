// File: app/index.js
// This is the entry point of the app, which redirects to the login screen.

import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/login" />;
}
