# Quick Start Testing Guide - New Features

## How to Test the New Features

### Prerequisites
- Dev server running on `http://localhost:3000`
- Logged in as a user with access to Orders/Customers/Settings pages
- Browser console open (F12) for monitoring polling

---

## Test 1: Notification Badges (2 minutes)

### Step 1: Check Badge Display
1. Open app and log in
2. Look at header bell icon
3. **Expected**: If there are pending orders, you should see an orange badge

### Step 2: Monitor Polling
1. Open Browser Console (F12 → Console tab)
2. Leave it open for 50 seconds
3. **Expected**: After ~45 seconds, you should see console message:
   ```
   [Polling] Previous IDs: X New orders: Y
   ```

### Step 3: Check Dropdown
1. Click the bell icon to open notifications
2. **Expected**: Should see breakdown:
   - 📦 X pesanan baru (if there are pending orders)
   - 🛒 Y keranjang baru (if there are new carts)

---

## Test 2: Order Notifications (5 minutes)

### Step 1: Enable Sound
1. Navigate to **Pesanan** (Orders page)
2. Toggle **"Suara Notifikasi Pesanan"** ON (look for toggle in top-right area)
3. Refresh page
4. **Expected**: Toggle should still be ON after refresh

### Step 2: Monitor Polling
1. Keep Browser Console open (F12 → Console)
2. Wait 50 seconds
3. **Expected**: Console shows `[Polling] Previous IDs: ...` message

### Step 3: Test Sound (Optional)
1. If you create a new pending order, after next polling cycle:
2. **Expected**: 
   - Toast notification appears
   - Sound plays (880Hz sine wave - higher pitched)
   - Console shows `[Notification] Showing toast for 1 new orders`

---

## Test 3: Abandoned Carts Notifications (5 minutes)

### Step 1: Navigate to Carts
1. Go to **Keranjang Terbengkalai** (Abandoned Carts page)
2. Toggle **"Suara Notifikasi Keranjang"** ON
3. Refresh page
4. **Expected**: Toggle should still be ON

### Step 2: Monitor Polling  
1. Keep console open
2. Wait 65 seconds
3. **Expected**: Console shows `[Polling Carts] Previous: ...` message

### Step 3: Compare Sounds
1. If you create a new cart and order in same session:
2. **Expected**: Sounds are noticeably different
   - Orders: Higher pitch (880Hz)
   - Carts: Lower pitch (660Hz)

---

## Test 4: COD Scoring (3 minutes)

### Step 1: Navigate to Customers
1. Go to **Pelanggan** (Customers page)
2. Scroll right to find **"COD Score"** column
3. **Expected**: See letter grades (A-E) or "No Data"

### Step 2: Check Score Details
1. Find a customer with COD orders
2. Score badge should show letter + percentage, e.g.:
   - "A 99%" - Excellent success rate
   - "D 65%" - Fair success rate
3. **Expected**: Score matches (successful COD / total COD) × 100

### Step 3: Filter by Score
1. Click **"Segmentasi"** filter dropdown
2. Select **"A"** (or another score)
3. **Expected**: Table shows only customers with that COD score

### Step 4: Export Data
1. Click **"Unduh Laporan"** (Download Report)
2. Open CSV file
3. **Expected**: New columns present:
   - Total COD
   - COD Berhasil
   - COD Score
   - Success Rate %

---

## Test 5: Gudang Role (2 minutes)

### Step 1: Navigate to Settings
1. Go to **Pengaturan** (Settings page)
2. Click **"Tambah User"** or edit existing user
3. **Expected**: In role dropdown, see **"Gudang"** option with 📦 icon

### Step 2: Check Sidebar
1. Scroll down on Settings page to "Tim Gudang" section
2. **Expected**: Shows count of warehouse staff

### Step 3: Assign Role
1. Create or edit a user and select "Gudang" role
2. **Expected**: 
   - Role saves correctly
   - Permissions list shows warehouse-specific tasks
   - Description shows: "Mengelola pemrosesan gudang..."

---

## Troubleshooting

### Badges Not Showing
**Problem**: No orange badge on bell icon
**Solution**:
- [ ] Check if any pending orders exist (`Pesanan` > filter Status = "Pending")
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Check browser console for errors
- [ ] Verify `NotificationCountProvider` is in React tree (no error messages)

### Polling Not Working
**Problem**: Console doesn't show `[Polling]` messages
**Solution**:
- [ ] Wait full 45 seconds (not 45 seconds from page load)
- [ ] Check browser console for errors
- [ ] Verify Supabase connection (try creating a new order)
- [ ] Check if polling function dependencies are correct

### Sound Not Playing
**Problem**: Toggle is ON but no sound
**Solution**:
- [ ] Check browser audio is not muted (volume icon)
- [ ] Check system sound is enabled
- [ ] Try hard refresh
- [ ] Check localStorage: Open Console and run:
  ```javascript
  localStorage.getItem('orders_sound_enabled')  // Should be 'true'
  localStorage.getItem('abandoned_sound_enabled')  // Should be 'true'
  ```

### COD Score Not Showing
**Problem**: All customers show "No Data"
**Solution**:
- [ ] Check if customers have any COD orders
- [ ] Verify payment method contains "cod" or "bayar di tempat" (case-insensitive)
- [ ] Check if orders are in "Delivered" status (only counts as successful)
- [ ] Export CSV to debug: See actual COD counts

### Gudang Role Not Appearing
**Problem**: "Gudang" not in role dropdown
**Solution**:
- [ ] Hard refresh page
- [ ] Check types.ts for 'Gudang' in UserRole type
- [ ] Restart dev server if changes don't reflect

---

## Success Indicators

✅ **All Systems Working When You See:**

1. **Notifications**:
   - Orange badge on bell icon shows correct count
   - Console shows polling messages regularly
   - Toast appears when new order/cart arrives

2. **Sound**:
   - Toggle persists after refresh
   - Different sounds for orders vs carts
   - Sound plays with new arrivals (if enabled)

3. **COD Scoring**:
   - Customers have grades (A-E)
   - Grades calculate based on delivery success
   - Filter works by score category
   - CSV exports include COD data

4. **Gudang Role**:
   - Appears in user role dropdown
   - Can assign to new users
   - Shows in team count
   - Has proper permissions

---

## Quick Command Checklist

Monitor notifications:
```
Open DevTools Console (F12)
Watch for [Polling] and [Notification] messages
```

Check localStorage:
```javascript
// In console:
localStorage.getItem('orders_sound_enabled')
localStorage.getItem('abandoned_sound_enabled')
```

Debug COD scores:
```
Go to CustomersPage
Check if customer has any COD orders visible in detail
Verify orders are in 'Delivered' status for success count
```

Monitor polling in console:
```
// Filter console to show only polling messages
Press Ctrl+K to clear
Type "[Polling]" in filter box to isolate polling logs
```

---

## Expected User Flow

### New User Sees:
1. **Dashboard**: Header shows notification badge if pending items exist
2. **Pesanan Page**: Auto-refreshes every 45s, shows toast on new orders, plays sound (if enabled)
3. **Keranjang Page**: Auto-refreshes every 60s, shows toast on new carts, plays sound (if enabled)
4. **Pelanggan Page**: See COD score badges on customer list
5. **Pengaturan Page**: New Gudang role available when managing users

---

## Test Data Requirements

**For Full Testing You Need**:
- At least 1 pending order
- At least 1 customer with COD orders (mix of delivered and not delivered)
- Access to create users (to test Gudang role)

---

## Performance Notes

- Polling is lightweight (max 2 queries per 45/60 seconds)
- No impact on page performance
- Audio context is reused to prevent memory leaks
- Badge updates are optimized with useMemo

---

**If Everything Works**: All features are ready for production! 🎉

**If Issues Persist**: Check FEATURE_IMPLEMENTATION_SUMMARY.md or NOTIFICATION_SYSTEM_README.md for detailed documentation.
