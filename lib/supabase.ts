
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript
export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: 'Employee' | 'HOD';
  created_at?: string;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
}

export interface PermissionRequest {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
}

export interface ShiftRequest {
  id: string;
  user_id: string;
  date: string;
  current_shift: string;
  requested_shift: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
}

export interface ShiftSwap {
  id: string;
  requester_id: string;
  target_id: string;
  date: string;
  requester_shift: string;
  target_shift: string;
  reason: string;
  status: 'pending_target_approval' | 'rejected_by_target' | 'pending_hod_approval' | 'rejected_by_system' | 'approved' | 'rejected_by_hod';
  created_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at?: string;
}
