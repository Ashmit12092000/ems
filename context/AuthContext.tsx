
// File: context/AuthContext.tsx
// Updated to use Supabase for authentication

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Crypto from 'expo-crypto';
import { useDatabase } from './DatabaseContext';
import { User } from '../lib/supabase';

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
  const { supabaseClient, isDbLoading } = useDatabase();
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
    const hashedPassword = await hashPassword(password);
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .insert([
          {
            username,
            password_hash: hashedPassword,
            role: role as 'Employee' | 'HOD'
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Registration error:', error);
        return false; // Likely a UNIQUE constraint failure on username
      }

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    const hashedPassword = await hashPassword(password);
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', hashedPassword)
        .single();

      if (error || !data) {
        console.error('Login error:', error);
        return false;
      }

      setUser(data as User);
      return true;
    } catch (error) {
      console.error('Login error:', error);
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
