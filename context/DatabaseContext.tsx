// File: context/DatabaseContext.tsx
// Fixed version with proper handling of dbInstance and loading state

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { Colors } from '../theme/theme';

type SQLiteDatabase = SQLite.SQLiteDatabase;

interface DatabaseContextType {
  db: SQLiteDatabase | null;
  isDbLoading: boolean;
}

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

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [db, setDb] = useState<SQLiteDatabase | null>(dbInstance);
  const [isDbLoading, setIsDbLoading] = useState(true);

  const initializeDatabase = useCallback(async () => {
    try {
      if (!dbInstance) {
        console.log('Opening new database connection...');
        dbInstance = await SQLite.openDatabaseAsync('ems.db');

        await dbInstance.execAsync(`
          PRAGMA journal_mode = WAL;
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'Employee',
            department TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            date TEXT NOT NULL,
            reason TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
          );
          
          CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
          );
          
          CREATE TABLE IF NOT EXISTS monthly_limits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            limit_type TEXT UNIQUE NOT NULL,
            value INTEGER NOT NULL
          );
          
          INSERT OR IGNORE INTO monthly_limits (limit_type, value) VALUES 
          ('leave', 5),
          ('permission', 10),
          ('shift', 3);

          CREATE TABLE IF NOT EXISTS leave_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            reason TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
          );

          CREATE TABLE IF NOT EXISTS permission_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            reason TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
          );

          CREATE TABLE IF NOT EXISTS shift_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            current_shift TEXT NOT NULL,
            requested_shift TEXT NOT NULL,
            date TEXT NOT NULL,
            reason TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
          );

          CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            is_read BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
          );
        `);

        console.log('Database initialized successfully.');
      }

      setDb(dbInstance);
    } catch (error) {
      console.error('CRITICAL: Database initialization failed:', error);
    } finally {
      setIsDbLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeDatabase();
  }, [initializeDatabase]);

  if (isDbLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!db) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'red' }}>A critical database error occurred.</Text>
        <Text style={{ marginTop: 10, textAlign: 'center' }}>
          Please restart the application. If the problem persists, you may need to reinstall it.
        </Text>
      </View>
    );
  }

  const value: DatabaseContextType = {
    db,
    isDbLoading,
  };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
};
