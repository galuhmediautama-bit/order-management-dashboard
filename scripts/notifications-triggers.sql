-- ============================================
-- NOTIFICATION TRIGGERS
-- Auto-create notifications when events happen
-- ============================================

-- ============================================
-- 1. TRIGGER: Create ORDER_NEW notification when new order is created
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_on_new_order()
RETURNS TRIGGER AS $$
DECLARE
  cs_user_id uuid;
  advertiser_ids uuid[];
BEGIN
  -- Get CS user ID if assigned
  IF NEW.assignedCsId IS NOT NULL THEN
    cs_user_id := NEW.assignedCsId::uuid;
  END IF;

  -- Get advertiser IDs from users table (match brandId)
  IF NEW.brandId IS NOT NULL THEN
    SELECT ARRAY_AGG(id) INTO advertiser_ids
    FROM users
    WHERE role = 'Advertiser' 
    AND status = 'Aktif'
    AND "assignedBrandIds" @> ARRAY[NEW.brandId::text];
  END IF;

  -- Notify CS Agent if assigned
  IF cs_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      cs_user_id,
      'ORDER_NEW',
      'Pesanan Baru dari ' || NEW.customer,
      'Pesanan dari ' || NEW.customer || ' (' || NEW.customerPhone || ') - ' || COALESCE(NEW.productName, 'Produk') || ' - Rp ' || COALESCE(NEW.totalPrice::text, '0'),
      jsonb_build_object(
        'orderId', NEW.id,
        'customerName', NEW.customer,
        'customerPhone', NEW.customerPhone,
        'totalPrice', NEW.totalPrice,
        'productName', NEW.productName
      )
    );
  END IF;

  -- Notify all assigned Advertisers
  IF advertiser_ids IS NOT NULL AND array_length(advertiser_ids, 1) > 0 THEN
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    SELECT
      unnest(advertiser_ids),
      'ORDER_NEW',
      'Pesanan dari Brand Anda - ' || NEW.customer,
      'Pesanan baru untuk brand Anda: ' || NEW.customer || ' - ' || COALESCE(NEW.productName, 'Produk') || ' - Rp ' || COALESCE(NEW.totalPrice::text, '0'),
      jsonb_build_object(
        'orderId', NEW.id,
        'customerName', NEW.customer,
        'customerPhone', NEW.customerPhone,
        'totalPrice', NEW.totalPrice,
        'brandId', NEW.brandId
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_notify_on_new_order ON public.orders;

-- Create trigger on orders table
CREATE TRIGGER trigger_notify_on_new_order
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_order();


-- ============================================
-- 2. TRIGGER: Create CART_ABANDON notification when abandoned cart is created
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_on_abandoned_cart()
RETURNS TRIGGER AS $$
DECLARE
  admin_users uuid[];
BEGIN
  -- Get all Super Admin and Admin users
  SELECT ARRAY_AGG(id) INTO admin_users
  FROM users
  WHERE role IN ('Super Admin', 'Admin')
  AND status = 'Aktif';

  -- Notify admins about abandoned cart
  IF admin_users IS NOT NULL AND array_length(admin_users, 1) > 0 THEN
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    SELECT
      unnest(admin_users),
      'CART_ABANDON',
      'Keranjang Ditinggalkan - ' || NEW.customerName,
      NEW.customerName || ' (' || NEW.customerPhone || ') meninggalkan keranjang di form: ' || NEW.formTitle,
      jsonb_build_object(
        'cartId', NEW.id,
        'customerName', NEW.customerName,
        'customerPhone', NEW.customerPhone,
        'formTitle', NEW.formTitle,
        'selectedVariant', NEW.selectedVariant
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_notify_on_abandoned_cart ON public.abandoned_carts;

-- Create trigger on abandoned_carts table
CREATE TRIGGER trigger_notify_on_abandoned_cart
AFTER INSERT ON public.abandoned_carts
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_abandoned_cart();


-- ============================================
-- 3. TRIGGER: Update notification when order status changes
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_on_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  cs_user_id uuid;
  status_message text;
  status_emoji text;
BEGIN
  -- Only notify if status actually changed
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  -- Map status to readable message and emoji
  CASE NEW.status
    WHEN 'Processing' THEN
      status_message := 'Pesanan sedang diproses';
      status_emoji := '⏳';
    WHEN 'Shipped' THEN
      status_message := 'Pesanan sudah dikirim';
      status_emoji := '📦';
    WHEN 'Delivered' THEN
      status_message := 'Pesanan telah diterima';
      status_emoji := '✅';
    WHEN 'Canceled' THEN
      status_message := 'Pesanan dibatalkan';
      status_emoji := '❌';
    ELSE
      status_message := 'Status pesanan berubah: ' || NEW.status;
      status_emoji := '📝';
  END CASE;

  -- Get CS user ID if assigned
  IF NEW.assignedCsId IS NOT NULL THEN
    cs_user_id := NEW.assignedCsId::uuid;
    
    -- Insert notification for CS about status change
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      cs_user_id,
      'SYSTEM_ALERT',
      status_emoji || ' ' || status_message,
      'Pesanan ' || NEW.id || ' dari ' || NEW.customer || ' - ' || status_message,
      jsonb_build_object(
        'orderId', NEW.id,
        'oldStatus', OLD.status,
        'newStatus', NEW.status,
        'customerName', NEW.customer
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_notify_on_order_status_change ON public.orders;

-- Create trigger on orders table for status changes
CREATE TRIGGER trigger_notify_on_order_status_change
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_order_status_change();
