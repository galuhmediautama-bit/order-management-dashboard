# 🚀 Notification System - Quick Setup Checklist

## ✅ Pre-requisites
- [ ] React 19.2 app running
- [ ] Supabase project created
- [ ] Authenticated user setup
- [ ] TypeScript 5.8+

## 📋 Setup Steps (Follow in Order)

### Step 1: Database Setup
```bash
# Time: 2 minutes
# 1. Open Supabase Dashboard
# 2. Go to SQL Editor
# 3. Create new query
# 4. Paste content from: scripts/notifications-schema.sql
# 5. Run the query
# 6. Verify tables created (check Tables in left sidebar)
```

Checklist:
- [ ] notifications table created
- [ ] Indexes created
- [ ] RLS policies enabled
- [ ] Functions created (get_unread_notification_count, mark_all_notifications_read)

### Step 2: Add Audio Files
```bash
# Time: 5 minutes

# Create directory if not exists
mkdir -p public/sounds

# Add these files:
# - public/sounds/cash.mp3 (Order notification sound)
# - public/sounds/alert.mp3 (Abandoned cart sound)
# - public/sounds/system.mp3 (System alert sound)

# You can use free sound libraries:
# - https://mixkit.co/free-sound-effects/cash/
# - https://mixkit.co/free-sound-effects/alert/
# - https://mixkit.co/free-sound-effects/bell/
```

Checklist:
- [ ] public/sounds directory created
- [ ] All 3 audio files present
- [ ] Audio files are .mp3 format

### Step 3: Copy Source Files
```bash
# All files are already created in your workspace:
# ✅ src/types.ts (types added)
# ✅ src/services/notificationService.ts (created)
# ✅ src/hooks/useNotifications.ts (created)
# ✅ src/contexts/NotificationContext.tsx (created)
# ✅ src/utils/audioPlayer.ts (created)
# ✅ src/components/NotificationBell.tsx (created)
# ✅ src/components/NotificationDropdown.tsx (created)
# ✅ src/components/NotificationItem.tsx (created)
# ✅ src/components/NotificationList.tsx (created)
```

Checklist:
- [ ] All files exist and have no import errors

### Step 4: Update App.tsx

Add NotificationProvider wrapper:

```typescript
// src/App.tsx

import { NotificationProvider } from './contexts/NotificationContext';
import { preloadSounds } from './utils/audioPlayer';

// In your component:
useEffect(() => {
  preloadSounds(); // Load sounds at startup
}, []);

export default function App() {
  return (
    <NotificationProvider>
      {/* Existing code */}
    </NotificationProvider>
  );
}
```

Checklist:
- [ ] NotificationProvider wraps entire app
- [ ] preloadSounds() called on startup
- [ ] No import errors

### Step 5: Add NotificationBell to Header

```typescript
// src/components/Header.tsx

import NotificationBell from './NotificationBell';

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4">
      <h1>Dashboard</h1>
      
      <div className="flex items-center gap-4">
        {/* Existing items */}
        
        <NotificationBell /> {/* Add this */}
        
        {/* User menu etc */}
      </div>
    </header>
  );
}
```

Checklist:
- [ ] NotificationBell imported
- [ ] NotificationBell added to header
- [ ] Bell icon visible with badge

### Step 6: Add Notification Page Route

```typescript
// src/App.tsx (in AuthenticatedApp routes)

import { lazy, Suspense } from 'react';

const NotificationListPage = lazy(() => 
  import('./components/NotificationList').then(m => ({ 
    default: m.default 
  }))
);

// In Routes:
<Route 
  path="/notifikasi" 
  element={
    <Suspense fallback={<LoadingSpinner />}>
      <NotificationListPage />
    </Suspense>
  } 
/>
```

Checklist:
- [ ] Route added
- [ ] Can navigate to /notifikasi
- [ ] Page loads without errors

### Step 7: Test Basic Functionality

```typescript
// In browser console:

// Test 1: Check if context works
const { notifications } = useNotificationContext();
console.log('Notifications:', notifications);

// Test 2: Test audio
await playSound('ORDER_NEW');

// Test 3: Manual insert (via Supabase SQL editor)
INSERT INTO notifications (user_id, type, title, message)
VALUES ('your-user-id', 'ORDER_NEW', 'Test', 'Test message');
```

Checklist:
- [ ] No console errors
- [ ] Audio plays when triggered
- [ ] Badge updates when notification inserted
- [ ] Notification appears in dropdown

### Step 8: Create Abandoned Cart System (Optional)

```bash
# Follow: docs/ABANDONED_CART_SYSTEM.md

# Quick setup:
# 1. Create abandoned_carts table (SQL in docs)
# 2. Setup Supabase Edge Function OR Vercel Cron
# 3. Test with manual cart insert
```

Checklist:
- [ ] abandoned_carts table created
- [ ] Cron job configured
- [ ] Test notification created after 30 minutes

## 🧪 Testing Checklist

### Manual Testing
- [ ] **Bell Icon**: Visible in header with 0 badge initially
- [ ] **New Notification**: Insert via SQL → badge updates instantly
- [ ] **Dropdown**: Click bell → dropdown appears
- [ ] **Mark as Read**: Click notification → is_read = true, badge decreases
- [ ] **Mark All as Read**: Click "Tandai Semua Dibaca" → all marked
- [ ] **Delete**: Click delete icon → notification removed from list
- [ ] **Filter Tabs**: Click different types → list filters correctly
- [ ] **Sound**: Should hear sound when notification created
- [ ] **Toast**: Should see success message (if ToastContext configured)

### Real-time Testing
- [ ] Open app in 2 browser tabs
- [ ] Insert notification via SQL
- [ ] Both tabs show notification instantly
- [ ] Mark as read in tab 1 → updates in tab 2

### Performance Testing
- [ ] Insert 100 notifications
- [ ] App doesn't freeze
- [ ] Pagination works correctly
- [ ] Filter still fast

## 🐛 Troubleshooting

### Problem: Badge not showing
```
Solution:
1. Check NotificationBell is in Header
2. Check NotificationProvider wraps App
3. Verify useAuth() hook exists and returns user
4. Check browser console for errors
```

### Problem: Sound not playing
```
Solution:
1. Check audio files exist in public/sounds/
2. Run: isSoundSupported() in console
3. Check browser audio permissions
4. Try preloadSounds() first
```

### Problem: Notifications not loading
```
Solution:
1. Verify database schema created
2. Check RLS policies enabled
3. Verify current user.id matches in notifications
4. Check if is_deleted = false
```

### Problem: Real-time not working
```
Solution:
1. Go to Supabase → Database → Replication
2. Enable realtime for notifications table
3. Verify WebSocket connection in browser DevTools
4. Check user has SELECT permission via RLS
```

## 📊 Monitoring

### Check Notification Count
```sql
SELECT COUNT(*) as total, 
       COUNT(*) FILTER (WHERE is_read = false) as unread
FROM notifications
WHERE user_id = 'your-user-id'
  AND is_deleted = false;
```

### Check Last Notifications
```sql
SELECT id, type, title, is_read, created_at
FROM notifications
WHERE is_deleted = false
ORDER BY created_at DESC
LIMIT 10;
```

### Check for Errors
```typescript
// In browser console:
localStorage.getItem('notification-errors');
```

## ✨ Features Verified

### Notification Types
- [x] ORDER_NEW - Green icon, cash.mp3 sound
- [x] CART_ABANDON - Yellow icon, alert.mp3 sound
- [x] SYSTEM_ALERT - Red icon, system.mp3 sound

### Actions
- [x] Mark as read (single)
- [x] Mark all as read
- [x] Delete (soft delete)
- [x] Filter by type
- [x] Pagination

### UI/UX
- [x] Bell icon with badge
- [x] Dropdown menu
- [x] Full page view
- [x] Dark mode support
- [x] Responsive design
- [x] Loading states
- [x] Empty states

### Real-time
- [x] INSERT events
- [x] UPDATE events
- [x] User-scoped subscriptions
- [x] Automatic cleanup

## 🎉 Completion

When all checkmarks are done:
1. ✅ Database configured
2. ✅ Components working
3. ✅ Real-time active
4. ✅ Sounds playing
5. ✅ Tests passing

You can now:
- [ ] Trigger notifications from business logic
- [ ] Customize notification messages
- [ ] Add more notification types
- [ ] Integrate with email/SMS
- [ ] Setup analytics

---

## 📚 Documentation Files

- **NOTIFICATION_SYSTEM_COMPLETE.md** - Full architecture & usage guide
- **ABANDONED_CART_SYSTEM.md** - Abandoned cart detection setup
- **scripts/notifications-schema.sql** - Database schema
- **All source files** - Well-commented code with TypeScript

## 🤝 Need Help?

Check:
1. Browser console for errors
2. Supabase logs (Database → Logs)
3. Network tab for realtime connection
4. Documentation files above

Good luck! 🚀
