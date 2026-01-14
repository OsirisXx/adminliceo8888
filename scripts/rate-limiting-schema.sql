-- Rate Limiting Schema for Super Admin Dashboard
-- Run this in your Supabase SQL Editor

-- Rate Limits Configuration Table
CREATE TABLE IF NOT EXISTS rate_limits (
    id INTEGER PRIMARY KEY DEFAULT 1,
    daily_limit INTEGER DEFAULT 5,
    weekly_limit INTEGER DEFAULT 15,
    monthly_limit INTEGER DEFAULT 30,
    yearly_limit INTEGER DEFAULT 100,
    cooldown_minutes INTEGER DEFAULT 30,
    max_per_session INTEGER DEFAULT 3,
    enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default rate limits
INSERT INTO rate_limits (id, daily_limit, weekly_limit, monthly_limit, yearly_limit, cooldown_minutes, max_per_session, enabled)
VALUES (1, 5, 15, 30, 100, 30, 3, true)
ON CONFLICT (id) DO NOTHING;

-- Complaint Submissions Tracking Table (for IP tracking)
CREATE TABLE IF NOT EXISTS complaint_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
    user_agent TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    location VARCHAR(255),
    country VARCHAR(100),
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast IP lookups
CREATE INDEX IF NOT EXISTS idx_complaint_submissions_ip ON complaint_submissions(ip_address);
CREATE INDEX IF NOT EXISTS idx_complaint_submissions_created_at ON complaint_submissions(created_at);

-- Blocked IPs Table
CREATE TABLE IF NOT EXISTS blocked_ips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    reason TEXT,
    duration VARCHAR(20) DEFAULT 'permanent',
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    blocked_by UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Index for blocked IP lookups
CREATE INDEX IF NOT EXISTS idx_blocked_ips_address ON blocked_ips(ip_address);

-- Function to check if IP is rate limited
CREATE OR REPLACE FUNCTION check_ip_rate_limit(check_ip VARCHAR(45))
RETURNS JSON AS $$
DECLARE
    limits RECORD;
    daily_count INTEGER;
    weekly_count INTEGER;
    monthly_count INTEGER;
    yearly_count INTEGER;
    last_submission TIMESTAMP WITH TIME ZONE;
    cooldown_passed BOOLEAN;
    is_blocked BOOLEAN;
    result JSON;
BEGIN
    -- Check if IP is blocked
    SELECT EXISTS(
        SELECT 1 FROM blocked_ips 
        WHERE ip_address = check_ip 
        AND (expires_at IS NULL OR expires_at > NOW())
    ) INTO is_blocked;
    
    IF is_blocked THEN
        RETURN json_build_object(
            'allowed', false,
            'reason', 'IP address is blocked',
            'blocked', true
        );
    END IF;
    
    -- Get rate limits configuration
    SELECT * INTO limits FROM rate_limits WHERE id = 1;
    
    -- If rate limiting is disabled, allow
    IF NOT limits.enabled THEN
        RETURN json_build_object('allowed', true, 'reason', 'Rate limiting disabled');
    END IF;
    
    -- Get last submission time
    SELECT created_at INTO last_submission 
    FROM complaint_submissions 
    WHERE ip_address = check_ip 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Check cooldown
    IF last_submission IS NOT NULL THEN
        cooldown_passed := (NOW() - last_submission) > (limits.cooldown_minutes || ' minutes')::INTERVAL;
        IF NOT cooldown_passed THEN
            RETURN json_build_object(
                'allowed', false,
                'reason', 'Please wait ' || limits.cooldown_minutes || ' minutes between submissions',
                'cooldown', true,
                'wait_minutes', EXTRACT(EPOCH FROM ((last_submission + (limits.cooldown_minutes || ' minutes')::INTERVAL) - NOW())) / 60
            );
        END IF;
    END IF;
    
    -- Count submissions for each period
    SELECT COUNT(*) INTO daily_count 
    FROM complaint_submissions 
    WHERE ip_address = check_ip 
    AND created_at > NOW() - INTERVAL '1 day';
    
    SELECT COUNT(*) INTO weekly_count 
    FROM complaint_submissions 
    WHERE ip_address = check_ip 
    AND created_at > NOW() - INTERVAL '7 days';
    
    SELECT COUNT(*) INTO monthly_count 
    FROM complaint_submissions 
    WHERE ip_address = check_ip 
    AND created_at > NOW() - INTERVAL '30 days';
    
    SELECT COUNT(*) INTO yearly_count 
    FROM complaint_submissions 
    WHERE ip_address = check_ip 
    AND created_at > NOW() - INTERVAL '365 days';
    
    -- Check limits
    IF daily_count >= limits.daily_limit THEN
        RETURN json_build_object(
            'allowed', false,
            'reason', 'Daily submission limit reached (' || limits.daily_limit || ')',
            'limit_type', 'daily',
            'count', daily_count,
            'limit', limits.daily_limit
        );
    END IF;
    
    IF weekly_count >= limits.weekly_limit THEN
        RETURN json_build_object(
            'allowed', false,
            'reason', 'Weekly submission limit reached (' || limits.weekly_limit || ')',
            'limit_type', 'weekly',
            'count', weekly_count,
            'limit', limits.weekly_limit
        );
    END IF;
    
    IF monthly_count >= limits.monthly_limit THEN
        RETURN json_build_object(
            'allowed', false,
            'reason', 'Monthly submission limit reached (' || limits.monthly_limit || ')',
            'limit_type', 'monthly',
            'count', monthly_count,
            'limit', limits.monthly_limit
        );
    END IF;
    
    IF yearly_count >= limits.yearly_limit THEN
        RETURN json_build_object(
            'allowed', false,
            'reason', 'Yearly submission limit reached (' || limits.yearly_limit || ')',
            'limit_type', 'yearly',
            'count', yearly_count,
            'limit', limits.yearly_limit
        );
    END IF;
    
    -- All checks passed
    RETURN json_build_object(
        'allowed', true,
        'daily_remaining', limits.daily_limit - daily_count,
        'weekly_remaining', limits.weekly_limit - weekly_count,
        'monthly_remaining', limits.monthly_limit - monthly_count,
        'yearly_remaining', limits.yearly_limit - yearly_count
    );
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rate_limits (read for all, write for admins)
CREATE POLICY "Anyone can read rate limits" ON rate_limits FOR SELECT USING (true);
CREATE POLICY "Admins can update rate limits" ON rate_limits FOR ALL USING (true);

-- RLS Policies for complaint_submissions
CREATE POLICY "Anyone can insert submissions" ON complaint_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read submissions" ON complaint_submissions FOR SELECT USING (true);

-- RLS Policies for blocked_ips
CREATE POLICY "Anyone can read blocked IPs" ON blocked_ips FOR SELECT USING (true);
CREATE POLICY "Admins can manage blocked IPs" ON blocked_ips FOR ALL USING (true);
