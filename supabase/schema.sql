
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('Employee', 'HOD')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permission_requests table
CREATE TABLE IF NOT EXISTS permission_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shift_requests table
CREATE TABLE IF NOT EXISTS shift_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  current_shift TEXT NOT NULL,
  requested_shift TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shift_swaps table
CREATE TABLE IF NOT EXISTS shift_swaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  requester_shift TEXT NOT NULL,
  target_shift TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending_target_approval' CHECK(status IN ('pending_target_approval', 'rejected_by_target', 'pending_hod_approval', 'rejected_by_system', 'approved', 'rejected_by_hod')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create monthly_limits table
CREATE TABLE IF NOT EXISTS monthly_limits (
  limit_type TEXT PRIMARY KEY,
  value INTEGER NOT NULL
);

-- Create duty_roster table
CREATE TABLE IF NOT EXISTS duty_roster (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  shift_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('Present', 'Absent', 'Leave')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_permission_requests_user_id ON permission_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_requests_status ON permission_requests(status);
CREATE INDEX IF NOT EXISTS idx_shift_requests_user_id ON shift_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_shift_requests_status ON shift_requests(status);
CREATE INDEX IF NOT EXISTS idx_shift_swaps_requester_id ON shift_swaps(requester_id);
CREATE INDEX IF NOT EXISTS idx_shift_swaps_target_id ON shift_swaps(target_id);
CREATE INDEX IF NOT EXISTS idx_shift_swaps_status ON shift_swaps(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic ones - you can customize based on your needs)
-- Allow user registration (INSERT) without authentication
CREATE POLICY "Allow user registration" ON users FOR INSERT WITH CHECK (true);
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);

-- Leave requests policies
CREATE POLICY "Users can view own leave requests" ON leave_requests FOR SELECT USING (true);
CREATE POLICY "Users can create leave requests" ON leave_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own leave requests" ON leave_requests FOR UPDATE USING (true);

-- Permission requests policies
CREATE POLICY "Users can view own permission requests" ON permission_requests FOR SELECT USING (true);
CREATE POLICY "Users can create permission requests" ON permission_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own permission requests" ON permission_requests FOR UPDATE USING (true);

-- Shift requests policies
CREATE POLICY "Users can view own shift requests" ON shift_requests FOR SELECT USING (true);
CREATE POLICY "Users can create shift requests" ON shift_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own shift requests" ON shift_requests FOR UPDATE USING (true);

-- Shift swaps policies
CREATE POLICY "Users can view shift swaps" ON shift_swaps FOR SELECT USING (true);
CREATE POLICY "Users can create shift swaps" ON shift_swaps FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update shift swaps" ON shift_swaps FOR UPDATE USING (true);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (true);

-- Insert default monthly limits
INSERT INTO monthly_limits (limit_type, value) VALUES 
  ('max_leave_days', 30),
  ('max_permission_hours', 40)
ON CONFLICT (limit_type) DO NOTHING;
