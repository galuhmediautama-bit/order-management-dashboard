-- Create notifications table if not exists
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('new_order', 'user_signup', 'order_shipped', 'abandoned_cart', 'order_status_change')),
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read BOOLEAN NOT NULL DEFAULT false,
    user_id TEXT,
    order_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read all notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- Create policy: Users can read all notifications
CREATE POLICY "Users can read all notifications"
ON notifications FOR SELECT
TO authenticated
USING (true);

-- Create policy: Service role can insert notifications
CREATE POLICY "Service role can insert notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy: Users can update their own notifications
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
TO authenticated
USING (true);

COMMENT ON TABLE notifications IS 'Stores all system notifications for orders, carts, and status changes';
