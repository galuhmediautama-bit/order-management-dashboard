-- Auto-delete orders that have passed their scheduled deletion date
-- This should be run as a scheduled job (daily cron)
-- Can be set up using Supabase Database Webhooks or pg_cron extension

-- Create function to auto-delete expired orders
CREATE OR REPLACE FUNCTION auto_delete_expired_orders()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete orders where scheduledDeletionDate has passed
    DELETE FROM orders 
    WHERE "scheduledDeletionDate" IS NOT NULL 
    AND "scheduledDeletionDate" < NOW();
    
    RAISE NOTICE 'Auto-deleted expired orders';
END;
$$;

-- Example: Set up pg_cron job (if pg_cron extension is enabled)
-- This will run daily at 2 AM
/*
SELECT cron.schedule(
    'auto-delete-expired-orders',
    '0 2 * * *', -- Every day at 2 AM
    $$SELECT auto_delete_expired_orders()$$
);
*/

-- Alternative: You can call this function manually or via API endpoint
-- SELECT auto_delete_expired_orders();

-- To check scheduled deletions:
SELECT 
    id,
    SUBSTRING(id::text, 1, 8) as order_number,
    customer,
    "totalPrice",
    "deletedAt",
    "scheduledDeletionDate",
    EXTRACT(DAY FROM ("scheduledDeletionDate" - NOW())) as days_until_deletion
FROM orders
WHERE "scheduledDeletionDate" IS NOT NULL
ORDER BY "scheduledDeletionDate" ASC;
