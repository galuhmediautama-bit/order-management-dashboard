-- Error Logs Table for tracking all errors from users/admin
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    "userEmail" TEXT,
    "userRole" TEXT,
    "errorMessage" TEXT NOT NULL,
    "errorStack" TEXT,
    "errorContext" TEXT, -- Component/Page where error occurred
    "errorType" TEXT DEFAULT 'runtime', -- 'runtime', 'network', 'validation', 'authentication', 'unknown'
    "pageUrl" TEXT,
    "userAgent" TEXT,
    "additionalInfo" JSONB,
    "resolved" BOOLEAN DEFAULT false,
    "resolvedAt" TIMESTAMPTZ,
    "resolvedBy" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs("userId");
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs("resolved");
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs("errorType");

-- RLS Policies
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Super Admin can see all error logs
CREATE POLICY "Super Admin can view all error logs" ON error_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'Super Admin'
        )
    );

-- Super Admin can insert error logs
CREATE POLICY "Super Admin can insert error logs" ON error_logs
    FOR INSERT
    WITH CHECK (true);

-- Any authenticated user can insert error logs
CREATE POLICY "Authenticated users can insert error logs" ON error_logs
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Super Admin can update error logs (mark resolved, add notes)
CREATE POLICY "Super Admin can update error logs" ON error_logs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'Super Admin'
        )
    );

-- Super Admin can delete old error logs
CREATE POLICY "Super Admin can delete error logs" ON error_logs
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'Super Admin'
        )
    );

-- Comment on table
COMMENT ON TABLE error_logs IS 'System error logs from all users for debugging and monitoring';
