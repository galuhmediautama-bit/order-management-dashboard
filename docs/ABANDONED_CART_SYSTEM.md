# Abandoned Cart Notification System

## Overview
Sistem untuk mendeteksi dan membuat notifikasi ketika customer meninggalkan cart mereka tanpa menyelesaikan pembelian.

## Architecture

### Option 1: Supabase Edge Function (Recommended)
**Pros:**
- Berjalan di server Supabase sendiri
- Tidak perlu infrastructure tambahan
- Real-time detection lebih optimal
- Terintegrasi langsung dengan database

**Cons:**
- Supabase Edge Functions menggunakan Deno (bukan Node.js)
- Perlu setup di Supabase dashboard

### Option 2: Scheduled Cron Job
**Pros:**
- Mudah diimplementasi dengan service seperti Vercel Cron
- Fleksibel untuk berbagai backend stack

**Cons:**
- Kurang real-time
- Perlu infrastructure terpisah
- Cost overhead untuk setiap invocation

---

## Implementation Guide

### Step 1: Create `abandoned_carts` Table (If Not Exists)

```sql
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric(10, 2) NOT NULL,
  currency text DEFAULT 'IDR',
  notification_sent_at timestamp with time zone,
  notification_sent boolean DEFAULT false,
  recovery_token text UNIQUE,
  recovered_at timestamp with time zone,
  abandoned_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_abandoned_carts_customer_id ON public.abandoned_carts(customer_id);
CREATE INDEX idx_abandoned_carts_notification_sent ON public.abandoned_carts(notification_sent);
CREATE INDEX idx_abandoned_carts_abandoned_at ON public.abandoned_carts(abandoned_at DESC);

-- Trigger untuk update updated_at
CREATE TRIGGER abandoned_carts_updated_at_trigger
BEFORE UPDATE ON public.abandoned_carts
FOR EACH ROW
EXECUTE FUNCTION public.update_abandoned_carts_updated_at();
```

### Step 2: Track Cart Abandonment

Ketika user meninggalkan form/checkout page, catat ke `abandoned_carts`:

```typescript
// services/abandonedCartService.ts

export async function createAbandonedCart(cartData: {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: any[];
  totalAmount: number;
}) {
  const { data, error } = await supabase
    .from('abandoned_carts')
    .insert({
      customer_id: cartData.customerId,
      customer_name: cartData.customerName,
      customer_email: cartData.customerEmail,
      customer_phone: cartData.customerPhone,
      items: cartData.items,
      total_amount: cartData.totalAmount,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Step 3: Create Supabase Edge Function (Recommended)

**File: `supabase/functions/detect-abandoned-carts/index.ts`**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const ABANDONED_CART_THRESHOLD_MINUTES = 30; // Notifikasi setelah 30 menit
const BATCH_SIZE = 100;

interface AbandonedCart {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  items: any[];
  total_amount: number;
  abandoned_at: string;
}

/**
 * Detect abandoned carts dan create notifications
 */
async function detectAbandonedCarts() {
  try {
    console.log('Starting abandoned cart detection...');

    // Calculate threshold time
    const thresholdTime = new Date(
      Date.now() - ABANDONED_CART_THRESHOLD_MINUTES * 60 * 1000
    ).toISOString();

    // Get abandoned carts yang belum di-notify
    const { data: abandonedCarts, error: fetchError } = await supabase
      .from('abandoned_carts')
      .select('*')
      .eq('notification_sent', false)
      .lt('abandoned_at', thresholdTime)
      .limit(BATCH_SIZE);

    if (fetchError) throw fetchError;
    if (!abandonedCarts || abandonedCarts.length === 0) {
      console.log('No abandoned carts found');
      return { success: true, processed: 0 };
    }

    console.log(`Found ${abandonedCarts.length} abandoned carts`);

    // Create notifications untuk setiap abandoned cart
    const notifications = abandonedCarts.map((cart: AbandonedCart) => ({
      user_id: cart.customer_id,
      type: 'CART_ABANDON',
      title: 'Keranjang Anda Ditinggalkan',
      message: `Selesaikan pembelian Anda sekarang. Total: Rp ${Number(cart.total_amount).toLocaleString('id-ID')}`,
      metadata: {
        cartId: cart.id,
        customerName: cart.customer_name,
        itemsCount: cart.items.length,
        totalAmount: cart.total_amount,
      },
    }));

    // Batch insert notifications
    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (insertError) throw insertError;

    // Update abandoned_carts untuk mark notification_sent
    const cartIds = abandonedCarts.map((c) => c.id);
    const { error: updateError } = await supabase
      .from('abandoned_carts')
      .update({
        notification_sent: true,
        notification_sent_at: new Date().toISOString(),
      })
      .in('id', cartIds);

    if (updateError) throw updateError;

    console.log(`Successfully processed ${abandonedCarts.length} abandoned carts`);
    return {
      success: true,
      processed: abandonedCarts.length,
      message: `Created ${notifications.length} notifications`,
    };
  } catch (error) {
    console.error('Error detecting abandoned carts:', error);
    throw error;
  }
}

// HTTP Handler
export async function handler(req: Request) {
  try {
    // Verify auth token untuk security
    const authHeader = req.headers.get('authorization');
    const expectedToken = Deno.env.get('CRON_SECRET');

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await detectAbandonedCarts();

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Handler error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
```

### Step 4: Setup Cron Job (Vercel Cron atau Similar)

**Option A: Using Vercel Cron**

**File: `api/cron/abandoned-carts.ts`**

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify Vercel Cron secret
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Call Supabase Edge Function
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/detect-abandoned-carts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      }
    );

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Failed to process abandoned carts',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
```

**vercel.json configuration:**

```json
{
  "crons": [
    {
      "path": "/api/cron/abandoned-carts",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Option B: Using Supabase Cron (via pg_cron extension)**

```sql
-- Pastikan pg_cron extension sudah enabled di Supabase
-- Ini biasanya sudah default di Supabase

-- Create function untuk detect abandoned carts
CREATE OR REPLACE FUNCTION detect_abandoned_carts()
RETURNS TABLE(success boolean, processed integer) AS $$
DECLARE
  v_threshold_time timestamp := now() - interval '30 minutes';
  v_batch_size integer := 100;
  v_abandoned_carts abandoned_carts[];
  v_notification record;
BEGIN
  -- Get abandoned carts
  SELECT array_agg(id) INTO v_abandoned_carts
  FROM abandoned_carts
  WHERE notification_sent = false
    AND abandoned_at < v_threshold_time
  LIMIT v_batch_size;

  -- If no abandoned carts found, return early
  IF array_length(v_abandoned_carts, 1) IS NULL THEN
    RETURN QUERY SELECT true::boolean, 0::integer;
    RETURN;
  END IF;

  -- Create notifications
  INSERT INTO notifications (user_id, type, title, message, metadata)
  SELECT
    ac.customer_id,
    'CART_ABANDON'::text,
    'Keranjang Anda Ditinggalkan',
    'Selesaikan pembelian Anda sekarang. Total: Rp ' || CAST(ac.total_amount AS text),
    jsonb_build_object(
      'cartId', ac.id,
      'customerName', ac.customer_name,
      'itemsCount', jsonb_array_length(ac.items),
      'totalAmount', ac.total_amount
    )
  FROM abandoned_carts ac
  WHERE ac.id = ANY(v_abandoned_carts);

  -- Mark as notified
  UPDATE abandoned_carts
  SET notification_sent = true, notification_sent_at = now()
  WHERE id = ANY(v_abandoned_carts);

  -- Return success with count
  RETURN QUERY SELECT true::boolean, array_length(v_abandoned_carts, 1)::integer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the function to run every 15 minutes
SELECT cron.schedule(
  'detect-abandoned-carts',
  '*/15 * * * *',
  'SELECT detect_abandoned_carts()'
);
```

---

## Integration Checklist

- [ ] Create `abandoned_carts` table
- [ ] Add `createAbandonedCart()` call saat user leave cart
- [ ] Setup Edge Function di Supabase
- [ ] Setup Cron job (Vercel atau pg_cron)
- [ ] Test dengan manual insert ke `abandoned_carts`
- [ ] Verify notifications tercipta dalam 30 menit
- [ ] Monitor logs untuk error
- [ ] Setup alert untuk cron failures

---

## Monitoring & Debugging

### Check Recent Abandoned Carts

```sql
SELECT *
FROM abandoned_carts
WHERE created_at > now() - interval '1 hour'
ORDER BY created_at DESC;
```

### Check Recent Notifications Created by Cron

```sql
SELECT *
FROM notifications
WHERE type = 'CART_ABANDON'
  AND created_at > now() - interval '1 hour'
ORDER BY created_at DESC;
```

### Manual Test Edge Function

```bash
curl -X POST https://[PROJECT-ID].supabase.co/functions/v1/detect-abandoned-carts \
  -H "Authorization: Bearer [YOUR_TOKEN]" \
  -H "Content-Type: application/json"
```

---

## Best Practices

1. **Threshold Configuration**: Adjust `ABANDONED_CART_THRESHOLD_MINUTES` sesuai business needs
2. **Batch Processing**: Process dalam batch untuk avoid timeout pada large datasets
3. **Idempotency**: Pastikan tidak create duplicate notifications (handled via `notification_sent` flag)
4. **Error Handling**: Setup monitoring untuk failed cron jobs
5. **Performance**: Index pada `notification_sent` dan `abandoned_at` untuk query optimization
6. **Retry Logic**: Implement retry untuk failed notifications
7. **Email Integration**: Combine dengan email service untuk multi-channel notifications

---

## Future Enhancements

- [ ] Email reminder untuk abandoned carts
- [ ] SMS reminder (via Twilio/similar)
- [ ] Recovery link untuk quick checkout
- [ ] Analytics dashboard untuk cart abandonment metrics
- [ ] A/B testing berbagai notification messages
- [ ] Progressive notification (first at 30min, second at 2 hours)
