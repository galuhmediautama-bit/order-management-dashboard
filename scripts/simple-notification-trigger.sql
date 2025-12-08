-- ============================================
-- SIMPLE NOTIFICATION TRIGGER (dengan error handling)
-- ============================================

-- Drop if exists
DROP TRIGGER IF EXISTS trigger_notify_on_new_order ON public.orders;
DROP FUNCTION IF EXISTS public.notify_on_new_order();

-- Simple version - just notify if CS exists
CREATE OR REPLACE FUNCTION public.notify_on_new_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Debug: Log ke console
  RAISE NOTICE 'Order created: %, assignedCsId: %', NEW.id, NEW."assignedCsId";
  
  -- Simple insert - if assignedCsId exists, create notification
  IF NEW."assignedCsId" IS NOT NULL THEN
    BEGIN
      INSERT INTO public.notifications (user_id, type, title, message, metadata)
      VALUES (
        NEW."assignedCsId"::uuid,
        'ORDER_NEW',
        'Pesanan Baru',
        'Pesanan dari ' || COALESCE(NEW.customer, 'Customer') || ' - Rp ' || COALESCE(NEW."totalPrice"::text, '0'),
        jsonb_build_object(
          'orderId', NEW.id,
          'customerName', NEW.customer,
          'customerPhone', NEW."customerPhone"
        )
      );
      RAISE NOTICE 'Notification inserted for user: %', NEW."assignedCsId";
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error inserting notification: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'No assignedCsId for order %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_new_order
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_order();

-- Test query - check trigger logs
SELECT 'Test trigger setup complete' as status;
