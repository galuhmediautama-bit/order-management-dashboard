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

-- ============================================
-- AUTO-CLEANUP FUNCTION
-- Keeps max 500 logs, deletes logs older than 30 days
-- ============================================

-- Function to cleanup old error logs
CREATE OR REPLACE FUNCTION cleanup_error_logs()
RETURNS void AS $$
DECLARE
    max_logs INTEGER := 500;
    max_age_days INTEGER := 30;
    current_count INTEGER;
BEGIN
    -- Delete logs older than 30 days (resolved ones first)
    DELETE FROM error_logs
    WHERE "createdAt" < NOW() - INTERVAL '30 days';
    
    -- Delete resolved logs older than 7 days
    DELETE FROM error_logs
    WHERE resolved = true 
    AND "createdAt" < NOW() - INTERVAL '7 days';
    
    -- If still over limit, delete oldest logs
    SELECT COUNT(*) INTO current_count FROM error_logs;
    
    IF current_count > max_logs THEN
        DELETE FROM error_logs
        WHERE id IN (
            SELECT id FROM error_logs
            ORDER BY "createdAt" ASC
            LIMIT (current_count - max_logs)
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to auto-cleanup on insert
CREATE OR REPLACE FUNCTION trigger_cleanup_error_logs()
RETURNS TRIGGER AS $$
BEGIN
    -- Run cleanup every 50 inserts (check row count)
    IF (SELECT COUNT(*) FROM error_logs) > 550 THEN
        PERFORM cleanup_error_logs();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (drop if exists first)
DROP TRIGGER IF EXISTS error_logs_cleanup_trigger ON error_logs;
CREATE TRIGGER error_logs_cleanup_trigger
    AFTER INSERT ON error_logs
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_cleanup_error_logs();

-- ============================================
-- RLS Policies
-- ============================================
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
