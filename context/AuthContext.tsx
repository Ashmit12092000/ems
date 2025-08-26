// File: context/AuthContext.tsx
// This context manages the global authentication state, including user info and role.
// It provides login, logout, and register functions that interact with the database.

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Crypto from 'expo-crypto';
import { useDatabase } from './DatabaseContext';

// Define the shape of the user object
interface User {
  id: number;
  username: string;
  role: 'Employee' | 'HOD';
}

// Define the shape of the context's value
interface AuthContextType {
  user: User | null;
  isAuthReady: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, password: string, role: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { db, isDbLoading } = useDatabase();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (!isDbLoading) {
      setIsAuthReady(true);
    }
  }, [isDbLoading]);

  const hashPassword = async (password: string): Promise<string> => {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );
  };

  const register = async (username: string, password: string, role: string): Promise<boolean> => {
    if (!db) return false;
    const hashedPassword = await hashPassword(password);
    try {
      await db.runAsync(
        'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?);',
        username,
        hashedPassword,
        role
      );
      return true;
    } catch (error) {
      console.error('Registration DB error:', error);
      return false; // Likely a UNIQUE constraint failure on username
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    if (!db) return false;
    const hashedPassword = await hashPassword(password);
    try {
      // Use getFirstAsync to fetch the first matching row
      const userData = await db.getFirstAsync<User>(
        'SELECT * FROM users WHERE username = ? AND password_hash = ?;',
        username,
        hashedPassword
      );

      if (userData) {
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login DB error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthReady,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
