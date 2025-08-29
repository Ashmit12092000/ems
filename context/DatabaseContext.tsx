
// File: context/DatabaseContext.tsx
// Updated to use async operations for web compatibility

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { Colors } from '../theme/theme';

type SQLiteDatabase = SQLite.SQLiteDatabase;

interface DatabaseContextType {
  db: SQLiteDatabase | null;
  isDbLoading: boolean;
}

// Create a global variable to hold the database connection.
// This helps survive hot reloads better than useState alone.
let dbInstance: SQLiteDatabase | null = null;

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
    async function setupDatabase() {
      try {
        // Only open the database if the instance doesn't exist
        if (!dbInstance) {
          console.log("Opening new database connection...");
          
          // Use async database opening for web compatibility
          if (Platform.OS === 'web') {
            dbInstance = await SQLite.openDatabaseAsync('leave_management.db');
          } else {
            dbInstance = SQLite.openDatabaseSync('leave_management.db');
          }
          
          // Use async operations for better web compatibility
          await dbInstance.execAsync(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT, 
              username TEXT UNIQUE NOT NULL, 
              password_hash TEXT NOT NULL, 
              role TEXT NOT NULL CHECK(role IN ('Employee', 'HOD'))
            );
            CREATE TABLE IF NOT EXISTS requests (
              id INTEGER PRIMARY KEY AUTOINCREMENT, 
              user_id INTEGER, 
              type TEXT NOT NULL, 
              date TEXT NOT NULL, 
              reason TEXT, 
              status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS leave_requests (
              id INTEGER PRIMARY KEY AUTOINCREMENT, 
              user_id INTEGER, 
              start_date TEXT NOT NULL, 
              end_date TEXT NOT NULL, 
              reason TEXT, 
              status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS permission_requests (
              id INTEGER PRIMARY KEY AUTOINCREMENT, 
              user_id INTEGER, 
              date TEXT NOT NULL, 
              start_time TEXT NOT NULL,
              end_time TEXT NOT NULL,
              reason TEXT, 
              status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS shift_requests (
              id INTEGER PRIMARY KEY AUTOINCREMENT, 
              user_id INTEGER, 
              date TEXT NOT NULL, 
              current_shift TEXT NOT NULL,
              requested_shift TEXT NOT NULL,
              reason TEXT, 
              status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS shift_swaps (
              id INTEGER PRIMARY KEY AUTOINCREMENT, 
              requester_id INTEGER, 
              target_id INTEGER, 
              date TEXT NOT NULL, 
              requester_shift TEXT NOT NULL,
              target_shift TEXT NOT NULL,
              reason TEXT, 
              status TEXT NOT NULL DEFAULT 'pending_target_approval' CHECK(status IN ('pending_target_approval', 'rejected_by_target', 'pending_hod_approval', 'rejected_by_system', 'approved', 'rejected_by_hod')),
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (requester_id) REFERENCES users(id),
              FOREIGN KEY (target_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS monthly_limits (
              limit_type TEXT PRIMARY KEY, 
              value INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS duty_roster (
              id INTEGER PRIMARY KEY AUTOINCREMENT, 
              user_id INTEGER, 
              date TEXT NOT NULL, 
              shift_type TEXT, 
              FOREIGN KEY (user_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS attendance (
              id INTEGER PRIMARY KEY AUTOINCREMENT, 
              user_id INTEGER, 
              date TEXT NOT NULL, 
              status TEXT NOT NULL CHECK(status IN ('Present', 'Absent', 'Leave')), 
              UNIQUE(user_id, date), 
              FOREIGN KEY (user_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS notifications (
              id INTEGER PRIMARY KEY AUTOINCREMENT, 
              user_id INTEGER, 
              message TEXT NOT NULL, 
              is_read INTEGER DEFAULT 0, 
              created_at TEXT DEFAULT CURRENT_TIMESTAMP, 
              FOREIGN KEY (user_id) REFERENCES users(id)
            );
          `);
          
          console.log("Database initialized successfully.");
        } else {
          console.log("Using existing database connection.");
        }
      } catch (e) {
        console.error("CRITICAL: Database initialization failed:", e);
        setError(e as Error);
      } finally {
        setIsDbLoading(false);
      }
    }

    setupDatabase();
    
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'red' }}>
          A critical database error occurred.
        </Text>
        <Text style={{ marginTop: 10, textAlign: 'center' }}>
          {Platform.OS === 'web' 
            ? 'Web database initialization failed. Please refresh the page.'
            : 'Please restart the application. If the problem persists, you may need to reinstall it.'
          }
        </Text>
        {Platform.OS === 'web' && (
          <Text style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: Colors.secondary }}>
            Note: Some browsers may block database features in private/incognito mode.
          </Text>
        )}
      </View>
    );
  }

  if (isDbLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 16, color: Colors.secondary }}>
          Initializing database...
        </Text>
      </View>
    );
  }

  const value = {
    db: dbInstance,
    isDbLoading: isDbLoading,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};
