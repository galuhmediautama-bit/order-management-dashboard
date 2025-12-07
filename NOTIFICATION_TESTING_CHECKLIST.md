# 🧪 NOTIFICATION SYNC - TESTING CHECKLIST

## ✅ CORE FIX APPLIED

**Root Cause:** Two separate Supabase client instances (firebase.ts + supabase.ts)
**Solution:** Unified all 31 files to use single `firebase.ts` instance
**Result:** Realtime subscriptions now synchronized across entire app

---

## 🧪 TEST CASES

### TEST 1: Application Load
- [ ] Open `http://localhost:3000`
- [ ] App loads without errors
- [ ] Bell icon visible with notification count badge
- [ ] No red errors in browser console

### TEST 2: Notification Visibility
- [ ] Click bell icon → dropdown shows notifications
- [ ] Go to Notifications page (`/#/notifikasi`)
- [ ] **CRITICAL:** Count in page matches bell count
  - Before fix: Bell=20, Page=0 (DESYNC)
  - After fix: Bell=20, Page=20 ✓

### TEST 3: Mark Individual as Read
- [ ] Click on single notification in Notifications page
- [ ] "Tandai Terbaca" button appears
- [ ] Click it → notification marked as read
- [ ] Check browser console → should see success message
- [ ] DB should be updated (verify with realtime listener)

### TEST 4: Delete Individual Notification
- [ ] Click "Hapus" (trash icon) on single notification
- [ ] Confirm dialog → click yes
- [ ] Notification disappears from UI
- [ ] Check browser console → should see delete success
- [ ] Reload page → notification should NOT reappear

### TEST 5: Mark All as Read
- [ ] Go to Notifications page
- [ ] Click "Tandai Semua Terbaca" button
- [ ] All notifications should change to read=true
- [ ] Toast message: "Semua notifikasi ditandai sebagai dibaca"
- [ ] Check console:
  ```
  [NotificationsPage] Marking all as read...
  [NotificationsPage] Update successful
  ```

### TEST 6: Delete All Notifications
- [ ] Go to Notifications page with notifications present
- [ ] Click "Hapus Semua" button
- [ ] Confirmation dialog appears
- [ ] Click yes → all notifications deleted
- [ ] UI shows empty state
- [ ] Toast message: "Semua notifikasi dihapus"
- [ ] Check console:
  ```
  [NotificationsPage] Deleting all notifications...
  [NotificationsPage] Delete successful
  ```

### TEST 7: Real-time Update
- [ ] Open two browser windows: 
  - Window A: Notifications page
  - Window B: Orders page (to create new order)
- [ ] Create new order in Window B
- [ ] **CRITICAL:** Notification appears in Window A IMMEDIATELY (no refresh needed)
- [ ] Check Window A console → should see `[Real-time] New notification`

### TEST 8: Browser DevTools Network
- [ ] Open DevTools (F12) → Network tab
- [ ] Look for WebSocket connections
- [ ] Should see ONE active WebSocket to Supabase (not two!)
- [ ] Connection status: CONNECTED (not CLOSED)
- [ ] See "postgres_changes" messages flowing

### TEST 9: Filter Operations
- [ ] Go to Notifications page
- [ ] Click "Belum Dibaca" filter
- [ ] Should show only unread notifications
- [ ] Click "Dibaca" filter  
- [ ] Should show only read notifications
- [ ] Click "Semua" filter
- [ ] Should show all notifications

### TEST 10: Realtime Event Tracking
- [ ] In Notifications page, open browser console
- [ ] Should see continuous logs:
  ```
  [NotificationsPage] Realtime subscription status: SUBSCRIBED
  [Real-time] New notification: {...}
  [Real-time] Updated notification: {...}
  ```
- [ ] No "duplicate channel" errors

---

## 📊 SUCCESS CRITERIA

✅ **All tests pass** → Notification system FULLY SYNCED
✅ **Bell count = Page count** → No more desync
✅ **Mark-all works** → Can update all notifications at once
✅ **Delete-all works** → Can clear all notifications at once  
✅ **Real-time events** → Changes visible instantly across windows
✅ **One WebSocket** → Single unified connection to Supabase

---

## 🐛 IF TESTS FAIL

### If Page shows 0 but Bell shows 20:
- Still have two instances → Check that ALL imports are from `firebase.ts`
- Run: `grep -r "from.*supabase'" src/` (should return 0 results)

### If Mark-all doesn't work:
- Check console for errors
- Verify `.update({ read: true }).eq('read', false)` syntax
- Check RLS policies allow UPDATE on notifications table

### If Delete-all doesn't work:
- Check console for errors  
- Verify `.delete().neq('id', null)` syntax
- Check RLS policies allow DELETE on notifications table

### If Real-time isn't working:
- Check WebSocket in DevTools Network tab
- Verify single WebSocket connection exists
- Check Supabase project has realtime enabled
- Verify channel names don't conflict

### If TypeScript errors:
- Clear node_modules: `rm -r node_modules && npm install`
- Clear build cache: `rm -r dist .vite`
- Restart dev server: `npm run dev`

---

## 🚀 EXPECTED OUTPUT

```
✅ DEV SERVER READY
VITE v6.4.1  ready in 415 ms
Local:   http://localhost:3000/

✅ NOTIFICATION COUNT SYNC
Bell: 20 notifications
Page: 20 notifications (MATCHED!)

✅ MARK-ALL SUCCESS
[NotificationsPage] Marking all as read...
[NotificationsPage] Update successful
Toast: "Semua notifikasi ditandai sebagai dibaca"

✅ DELETE-ALL SUCCESS
[NotificationsPage] Deleting all notifications...
[NotificationsPage] Delete successful
Toast: "Semua notifikasi dihapus"

✅ REALTIME WORKING
[Real-time] New notification: {id: "...", type: "new_order", ...}
```

---

## 📝 NOTES

- Tests should be done in same browser session (to maintain auth)
- Check browser console (F12 → Console tab) for debug logs
- Each test should take <1 minute
- Total time for all tests: ~15-20 minutes
- Run tests in order (TEST 1→10) for best results

---

**Version:** v2.0 - After Single Instance Unification
**Status:** Ready for Testing
**Created:** December 7, 2025
