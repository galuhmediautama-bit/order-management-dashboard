-- Fix Function Search Path Mutable Warnings
-- Run this in Supabase SQL Editor

-- 1. Fix update_product_updated_at
CREATE OR REPLACE FUNCTION public.update_product_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 2. Fix update_notifications_updated_at
CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$;

-- 3. Fix get_unread_notification_count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    count_result INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_result
    FROM public.notifications
    WHERE "userId" = user_id_param AND "isRead" = false;
    RETURN count_result;
END;
$$;

-- 4. Fix mark_all_notifications_read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(user_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.notifications
    SET "isRead" = true, "updatedAt" = NOW()
    WHERE "userId" = user_id_param AND "isRead" = false;
END;
$$;

-- 5. Fix notify_on_abandoned_cart
CREATE OR REPLACE FUNCTION public.notify_on_abandoned_cart()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert notification for abandoned cart
    INSERT INTO public.notifications ("userId", type, title, message, "relatedId", "isRead", "createdAt", "updatedAt")
    SELECT 
        u.id,
        'abandoned_cart',
        'Keranjang Terabaikan',
        'Ada pelanggan yang meninggalkan keranjang: ' || NEW."customerName",
        NEW.id::text,
        false,
        NOW(),
        NOW()
    FROM public.users u
    WHERE u.role IN ('Super Admin', 'Admin', 'Customer service');
    
    RETURN NEW;
END;
$$;

-- 6. Fix notify_on_order_status_change
CREATE OR REPLACE FUNCTION public.notify_on_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only trigger on status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.notifications ("userId", type, title, message, "relatedId", "isRead", "createdAt", "updatedAt")
        SELECT 
            u.id,
            'order_status',
            'Status Pesanan Berubah',
            'Pesanan #' || NEW.id || ' berubah ke ' || NEW.status,
            NEW.id::text,
            false,
            NOW(),
            NOW()
        FROM public.users u
        WHERE u.role IN ('Super Admin', 'Admin');
    END IF;
    
    RETURN NEW;
END;
$$;

-- 7. Fix delete_auth_user
CREATE OR REPLACE FUNCTION public.delete_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete the corresponding auth user when public.users row is deleted
    DELETE FROM auth.users WHERE id = OLD.id;
    RETURN OLD;
END;
$$;

-- Verify the fixes
SELECT 
    proname as function_name,
    proconfig as config
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
AND proname IN (
    'update_product_updated_at',
    'update_notifications_updated_at', 
    'get_unread_notification_count',
    'mark_all_notifications_read',
    'notify_on_abandoned_cart',
    'notify_on_order_status_change',
    'delete_auth_user'
);
