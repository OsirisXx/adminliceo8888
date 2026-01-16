-- =====================================================
-- FIX ALL CURRENT ISSUES
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- ========== TASK 1: FIX RLS POLICIES ==========
-- Drop ALL existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Super admins can view all users" ON users;
DROP POLICY IF EXISTS "Super admins can update all users" ON users;
DROP POLICY IF EXISTS "Super admins can insert users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Allow all authenticated users to read" ON users;
DROP POLICY IF EXISTS "Allow users to read own profile" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new simple policies
CREATE POLICY "Allow all authenticated users to read" ON users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update" ON users
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert" ON users
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete" ON users
  FOR DELETE TO authenticated USING (true);


-- ========== TASK 2: FIX COMPLAINTS CATEGORY CONSTRAINT ==========
-- Drop the old hard-coded category constraint
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_category_check;

-- Category is now dynamic from departments table, no constraint needed


-- ========== TASK 3: FIX DEFAULT ROLE TO STUDENT ==========
-- Update the handle_new_user function to use 'student' as default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    'student'  -- ALWAYS student for first-time users
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing users who have 'employee' role but should be 'student'
-- (Users who logged in via Gmail but haven't been verified)
-- Only update if they don't have a department assigned
UPDATE users 
SET role = 'student' 
WHERE role = 'employee' 
  AND (department IS NULL OR department = '')
  AND email LIKE '%@gmail.com';


-- ========== TASK 4: ADD USER_ID TO COMPLAINTS ==========
-- This allows filtering tickets by the logged-in user who created them
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);


-- ========== TASK 5: DROP COMPLAINTS CATEGORY CONSTRAINT ==========
-- Categories are now dynamic from departments table
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_category_check;


-- ========== TASK 6: ADD BACKLOG STATUS TO COMPLAINTS ==========
-- Drop the old status constraint if it exists
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_status_check;

-- Add new status constraint with backlog included
ALTER TABLE complaints ADD CONSTRAINT complaints_status_check 
  CHECK (status IN ('submitted', 'verified', 'rejected', 'in_progress', 'backlog', 'resolved', 'closed', 'disputed'));


-- ========== VERIFY ==========
-- Check the current state
SELECT id, email, role, department FROM users ORDER BY created_at DESC LIMIT 20;
