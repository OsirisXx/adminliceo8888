-- =====================================================
-- DATABASE UPDATES FOR TICKET FEATURES
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- 1. Add new columns to complaints table for verification/dispute feature
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
ADD COLUMN IF NOT EXISTS user_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS additional_email TEXT;

-- 2. Create ticket_comments table for discussion feature
CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_type VARCHAR(50) NOT NULL CHECK (author_type IN ('complainant', 'admin', 'department')),
  author_id UUID REFERENCES users(id),
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ticket_comments_complaint ON ticket_comments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_created ON ticket_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_internal ON ticket_comments(is_internal);

-- 4. Enable Row Level Security (RLS) on ticket_comments
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for ticket_comments
-- Policy: Anyone can read non-internal comments for their complaint
CREATE POLICY "Public can read non-internal comments" ON ticket_comments
  FOR SELECT
  USING (is_internal = FALSE);

-- Policy: Authenticated users (admin/department) can read all comments
CREATE POLICY "Authenticated users can read all comments" ON ticket_comments
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- Policy: Anyone can insert comments (we'll validate in the app)
CREATE POLICY "Anyone can insert comments" ON ticket_comments
  FOR INSERT
  WITH CHECK (TRUE);

-- Policy: Authenticated users can update their own comments
CREATE POLICY "Users can update own comments" ON ticket_comments
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

-- 6. Update complaints status check constraint to include new statuses
-- First drop existing constraint if it exists
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_status_check;

-- Add new constraint with all statuses
ALTER TABLE complaints ADD CONSTRAINT complaints_status_check 
  CHECK (status IN ('submitted', 'verified', 'rejected', 'in_progress', 'resolved', 'closed', 'disputed'));

-- 7. Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for ticket_comments updated_at
DROP TRIGGER IF EXISTS update_ticket_comments_updated_at ON ticket_comments;
CREATE TRIGGER update_ticket_comments_updated_at
  BEFORE UPDATE ON ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION: Check tables exist
-- =====================================================
-- SELECT * FROM information_schema.columns WHERE table_name = 'complaints';
-- SELECT * FROM information_schema.columns WHERE table_name = 'ticket_comments';
