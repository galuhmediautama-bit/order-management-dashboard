# 🔔 Notification System - Complete Implementation Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Database Setup](#database-setup)
3. [Core Components](#core-components)
4. [Usage Examples](#usage-examples)
5. [Integration Steps](#integration-steps)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### System Design
```
┌─────────────────────┐
│   User Activity     │
│  (Order, Cart, etc) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Supabase Database               │
│ - orders table                  │
│ - abandoned_carts table         │
│ - notifications table           │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Real-time Subscriptions         │
│ (Supabase Realtime)             │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ React Components                │
│ - NotificationBell              │
│ - NotificationDropdown          │
│ - NotificationList Page         │
└─────────────────────────────────┘
```

### Technology Stack
- **Frontend**: React 19.2 + TypeScript 5.8
- **State Management**: React Context API with Reducer
- **Real-time**: Supabase Realtime (WebSocket)
- **Database**: PostgreSQL (Supabase)
- **Styling**: Tailwind CSS
- **Audio**: Web Audio API

### Notification Types
```typescript
type NotificationType = 
  | 'ORDER_NEW'      // New order received (sound: cash.mp3)
  | 'CART_ABANDON'   // Abandoned cart (sound: alert.mp3)
  | 'SYSTEM_ALERT'   // System alert (sound: system.mp3)
```

---

## Database Setup

### 1. Execute SQL Schema

Run the following SQL in Supabase SQL Editor:

```bash
# Location: scripts/notifications-schema.sql
```

This creates:
- `notifications` table dengan indexes
- RLS (Row Level Security) policies
- Helper functions
- Triggers untuk automatic timestamps

### 2. Verify Table Structure

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
```

Expected output:
```
id              | uuid    | false
user_id         | uuid    | false
type            | text    | false
title           | text    | false
message         | text    | false
metadata        | jsonb   | true
is_read         | boolean | true
read_at         | timestamp | true
is_deleted      | boolean | true
created_at      | timestamp | false
updated_at      | timestamp | false
```

### 3. Enable Realtime

In Supabase dashboard:
1. Go to Database → Replication
2. Enable replication untuk `notifications` table
3. Verify realtime is active

---

## Core Components

### 1. Types & Interfaces

**Location**: `src/types.ts`

```typescript
export type NotificationType = 'ORDER_NEW' | 'CART_ABANDON' | 'SYSTEM_ALERT';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 2. Service Layer

**Location**: `src/services/notificationService.ts`

Core functions:
- `getNotifications()` - Fetch notifications
- `getUnreadCount()` - Get unread count
- `markAsRead(id)` - Mark single as read
- `markAllAsRead()` - Mark all as read
- `deleteNotification(id)` - Soft delete
- `subscribeToNotifications(userId, callback)` - Real-time INSERT
- `subscribeToNotificationUpdates(userId, callback)` - Real-time UPDATE

### 3. Context & Provider

**Location**: `src/contexts/NotificationContext.tsx`

Features:
- Global state management dengan useReducer
- Auto-subscribe to realtime
- Error handling
- Loading states

```typescript
// Usage
const { notifications, unreadCount, markAsRead, markAllAsRead } = 
  useNotificationContext();
```

### 4. Custom Hook

**Location**: `src/hooks/useNotifications.ts`

Features:
- Simplified API untuk component usage
- Auto-load notifications
- Real-time updates
- Filter by type

```typescript
// Usage
const { notifications, unreadCount, markAsRead } = useNotifications();
```

### 5. Audio Utilities

**Location**: `src/utils/audioPlayer.ts`

Functions:
- `playSound(type, volume)` - Play notification sound
- `stopSound(type)` - Stop specific sound
- `stopAllSounds()` - Stop all
- `preloadSounds()` - Preload untuk faster playback
- `isSoundSupported()` - Check browser support

```typescript
// Usage
await playSound('ORDER_NEW', 0.5);
```

### 6. UI Components

#### NotificationBell
**Location**: `src/components/NotificationBell.tsx`

Bell icon dengan:
- Badge untuk unread count
- Click untuk toggle dropdown
- Responsive design

#### NotificationDropdown
**Location**: `src/components/NotificationDropdown.tsx`

Dropdown menu dengan:
- Filter tabs (all, type)
- Notification list
- Mark all as read button
- Link ke full page

#### NotificationItem
**Location**: `src/components/NotificationItem.tsx`

Individual notification card dengan:
- Type-specific icon
- Title + message
- Time ago formatting
- Mark read + delete actions

#### NotificationList
**Location**: `src/components/NotificationList.tsx`

Full notification page dengan:
- All above components
- Pagination (20 per page)
- Filter tabs
- Empty state

---

## Usage Examples

### Example 1: Create New Order Notification

```typescript
// services/orderService.ts
import { supabase } from '../firebase';
import { createNotification } from './notificationService';

export async function createOrder(orderData: any) {
  // Create order
  const { data: order, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  if (error) throw error;

  // Get assigned CS user
  const assignedCsId = orderData.assignedCsId;

  // Create notification untuk CS
  if (assignedCsId) {
    await createNotification(assignedCsId, {
      type: 'ORDER_NEW',
      title: `Pesanan Baru dari ${order.customer}`,
      message: `Total: Rp ${order.totalPrice.toLocaleString('id-ID')}`,
      metadata: {
        orderId: order.id,
        customerName: order.customer,
        totalPrice: order.totalPrice,
      },
    });
  }

  return order;
}
```

### Example 2: Listen to New Orders in Component

```typescript
// pages/OrdersPage.tsx
import { useEffect } from 'react';
import { useNotificationContext } from '../contexts/NotificationContext';
import { playSound } from '../utils/audioPlayer';

export default function OrdersPage() {
  const { addNotification } = useNotificationContext();

  useEffect(() => {
    // Setup realtime listener for orders
    const channel = supabase
      .channel('orders:insert')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          // Create notification
          addNotification({
            id: generateId(),
            userId: currentUser.id,
            type: 'ORDER_NEW',
            title: `Pesanan dari ${payload.new.customer}`,
            message: `Total: Rp ${payload.new.totalPrice.toLocaleString()}`,
            metadata: { orderId: payload.new.id },
            isRead: false,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          // Play sound
          playSound('ORDER_NEW', 0.7);

          // Show toast
          showToast('Pesanan baru masuk!', 'success');
        }
      )
      .subscribe();

    return () => channel.unsubscribe();
  }, []);

  return <div>Orders Page</div>;
}
```

### Example 3: Mark All As Read

```typescript
// Component
import { useNotificationContext } from '../contexts/NotificationContext';

export default function NotificationBell() {
  const { unreadCount, markAllAsRead } = useNotificationContext();

  const handleMarkAll = async () => {
    try {
      await markAllAsRead();
      showToast('Semua notifikasi sudah dibaca', 'success');
    } catch (error) {
      showToast('Gagal menandai sebagai dibaca', 'error');
    }
  };

  return (
    <button onClick={handleMarkAll}>
      Tandai Semua Dibaca ({unreadCount})
    </button>
  );
}
```

---

## Integration Steps

### Step 1: Add Audio Files

Place sound files di `public/sounds/`:
```
public/
├── sounds/
│   ├── cash.mp3      (for ORDER_NEW)
│   ├── alert.mp3     (for CART_ABANDON)
│   └── system.mp3    (for SYSTEM_ALERT)
```

### Step 2: Setup Database

```bash
# Run SQL schema
# Go to Supabase SQL Editor
# Paste content dari: scripts/notifications-schema.sql
# Execute
```

### Step 3: Update App.tsx

```typescript
// App.tsx
import { NotificationProvider } from './contexts/NotificationContext';
import { preloadSounds } from './utils/audioPlayer';

// Preload sounds at app start
useEffect(() => {
  preloadSounds();
}, []);

export default function App() {
  return (
    <NotificationProvider>
      <AuthenticatedApp />
    </NotificationProvider>
  );
}
```

### Step 4: Add NotificationBell to Header

```typescript
// components/Header.tsx
import NotificationBell from './NotificationBell';

export default function Header() {
  return (
    <header className="flex items-center justify-between">
      <h1>Dashboard</h1>
      <div className="flex items-center gap-4">
        <NotificationBell />
        {/* ... other header items */}
      </div>
    </header>
  );
}
```

### Step 5: Add Route untuk Notification Page

```typescript
// App.tsx
import NotificationList from './components/NotificationList';

<Route path="/notifikasi" element={<NotificationList />} />
```

### Step 6: Create Abandoned Cart Detection

```typescript
// See: docs/ABANDONED_CART_SYSTEM.md
// Setup Supabase Edge Function atau Vercel Cron
```

---

## Testing

### Test 1: Create Notification Manually

```sql
-- Run di Supabase SQL Editor
INSERT INTO notifications (user_id, type, title, message)
SELECT 
  id as user_id,
  'ORDER_NEW'::text as type,
  'Test Notification' as title,
  'This is a test notification' as message
FROM auth.users
LIMIT 1;
```

Verify: Should see badge update instantly di NotificationBell

### Test 2: Real-time Subscription

```typescript
// In browser console
import { supabase } from './firebase';

const channel = supabase
  .channel('test-notifications')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'notifications' },
    (payload) => console.log('Change:', payload)
  )
  .subscribe();

// Then insert dari SQL editor di atas
```

### Test 3: Audio Playback

```typescript
// In browser console
import { playSound } from './utils/audioPlayer';

await playSound('ORDER_NEW');
await playSound('CART_ABANDON');
await playSound('SYSTEM_ALERT');
```

### Test 4: Mark As Read

```typescript
// Test via component
const { markAsRead } = useNotificationContext();
await markAsRead('notification-id-here');
```

---

## Troubleshooting

### Issue: Badge not updating
**Solution:**
1. Verify RLS policies di database
2. Check realtime subscription active di Supabase
3. Verify user_id di notification matches current user
4. Check browser console untuk errors

### Issue: Sound not playing
**Solution:**
1. Check audio files di `public/sounds/`
2. Verify `isSoundSupported()` returns true
3. Check browser audio permissions
4. Try `preloadSounds()` first

### Issue: Notifications not appearing
**Solution:**
1. Verify `NotificationProvider` wraps app
2. Check user is authenticated
3. Verify insert notification correct user_id
4. Check `is_deleted = false` in filter

### Issue: High latency on realtime
**Solution:**
1. Add indexes (already done in schema)
2. Reduce number of subscriptions
3. Filter by user_id in subscription
4. Consider pagination untuk large lists

---

## Performance Optimization

### 1. Pagination
```typescript
// Load notifications in pages
const { data } = await supabase
  .from('notifications')
  .select('*')
  .range(0, 49);  // First 50
```

### 2. Caching
```typescript
// Cache unread count
const [unreadCount, setUnreadCount] = useState(0);
// Update hanya saat ada perubahan
```

### 3. Lazy Loading
```typescript
// Load full content hanya saat needed
const [expandedId, setExpandedId] = useState<string | null>(null);
```

### 4. Cleanup
```typescript
// Cleanup subscriptions
useEffect(() => {
  return () => channel.unsubscribe();
}, []);
```

---

## Security Considerations

1. **RLS Policies**: Users hanya bisa lihat notifications mereka sendiri
2. **API Keys**: Never expose service role key di client
3. **User Verification**: Always verify auth.uid() === user_id
4. **Soft Delete**: Never hard delete notifications (audit trail)
5. **Role-based Access**: Filter notifications berdasar user role

---

## Future Enhancements

- [ ] Push notifications via PWA
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Webhook integrations
- [ ] Notification scheduling
- [ ] Template system untuk messages
- [ ] Analytics dashboard
- [ ] User preferences untuk notification types
