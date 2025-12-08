-- ============================================
-- DROP OLD TRIGGERS (if they exist)
-- ============================================

DROP TRIGGER IF EXISTS trigger_notify_on_new_order ON public.orders;
DROP TRIGGER IF EXISTS trigger_notify_on_abandoned_cart ON public.abandoned_carts;
DROP TRIGGER IF EXISTS trigger_notify_on_order_status_change ON public.orders;

DROP FUNCTION IF EXISTS public.notify_on_new_order();
DROP FUNCTION IF EXISTS public.notify_on_abandoned_cart();
DROP FUNCTION IF EXISTS public.notify_on_order_status_change();

-- ============================================
-- Now run the full notifications-triggers.sql
-- ============================================
