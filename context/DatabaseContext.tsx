// File: context/DatabaseContext.tsx
// Updated to use Supabase instead of SQLite

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { Colors } from '../theme/theme';

interface DatabaseContextType {
  isDbLoading: boolean;
  supabaseClient: typeof supabase;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = (): DatabaseContextType => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider = ({ children }: DatabaseProviderProps) => {
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function initializeSupabase() {
      try {
        // Test the connection to Supabase
        const { data, error } = await supabase.from('users').select('count').limit(1);

        if (error && error.code !== 'PGRST116') { // PGRST116 is "table not found" which is expected initially
          throw error;
        }

        console.log("Supabase connection established successfully.");
      } catch (e) {
        console.error("CRITICAL: Supabase connection failed:", e);
        setError(e as Error);
      } finally {
        setIsDbLoading(false);
      }
    }

    initializeSupabase();
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'red' }}>
          A critical database error occurred.
        </Text>
        <Text style={{ marginTop: 10, textAlign: 'center' }}>
          Please check your Supabase configuration and ensure the environment variables are set correctly.
        </Text>
        <Text style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: Colors.secondary }}>
          Make sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are configured.
        </Text>
      </View>
    );
  }

  if (isDbLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 16, color: Colors.secondary }}>
          Connecting to Supabase...
        </Text>
      </View>
    );
  }

  const value = {
    isDbLoading,
    supabaseClient: supabase,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};