# Real-Time Notification System & Header Badge Integration

## Overview
This document describes the real-time notification system that displays pending orders and abandoned carts with live update badges in the header.

## Features Implemented

### 1. **Notification Count Context** (`contexts/NotificationCountContext.tsx`)
- New React Context for managing notification counts across components
- Tracks:
  - `newOrdersCount`: Number of pending orders
  - `newAbandonedCount`: Number of new abandoned carts
- Provides `useNotificationCount()` hook for accessing and updating counts

### 2. **Real-Time Polling System**

#### Orders Page (45-second polling)
- **File**: `pages/OrdersPage.tsx`
- **Features**:
  - Lightweight `refreshOrdersSilently()` function wrapped in `useCallback`
  - Detects new order arrivals by comparing order IDs
  - Plays 880Hz sine wave notification sound (when enabled)
  - Updates context: Sets `newOrdersCount` to count of pending orders
  - Console logging for debugging: `[Polling]`, `[Notification]` prefixes

#### Abandoned Carts Page (60-second polling)
- **File**: `pages/AbandonedCartsPage.tsx`
- **Features**:
  - Similar polling structure to Orders
  - Plays 660Hz triangle wave notification sound (when enabled)
  - Updates context: Sets `newAbandonedCount` to count of new carts
  - Detects cart abandonment status changes

### 3. **Header Badge Display** (`components/Header.tsx`)
- **Visual Elements**:
  - **Orange Badge**: Shows total count (orders + abandoned carts)
    - Position: Top-right of bell icon
    - Format: Single number combining both counts
  - **Dropdown Header Info**:
    - 📦 Pending orders count (indigo text)
    - 🛒 New abandoned carts count (amber text)
    - Other unread database notifications

- **Integration Points**:
  - Imports `useNotificationCount()` hook
  - Reads `newOrdersCount` and `newAbandonedCount` from context
  - Updates in real-time as polling functions refresh

### 4. **Sound Notifications**
- **Orders Page**:
  - Frequency: 880Hz (sine wave)
  - Duration: 0.3 seconds with exponential fade
  - Toggle: `orderSoundEnabled` state
  - Storage: `localStorage.orders_sound_enabled`

- **Abandoned Carts Page**:
  - Frequency: 660Hz (triangle wave)
  - Duration: 0.3 seconds with exponential fade
  - Toggle: `cartSoundEnabled` state
  - Storage: `localStorage.abandoned_sound_enabled`

- **Audio Context Management**:
  - Uses Web Audio API
  - Reuses AudioContext reference to prevent resource leaks
  - Graceful error handling for unsupported browsers

## Data Flow

```
OrdersPage/AbandonedCartsPage
  ↓
  - fetchData() [on mount]
    - Sets initial notification count
    - Populates orders/carts list
  ↓
  - setNewOrdersCount() / setNewAbandonedCount()
    - Updates NotificationCountContext
  ↓
  - Polling interval (45s/60s)
    - refreshOrdersSilently() / refreshAbandonedSilently()
    - Detects new entries
    - Plays sound (if enabled)
    - Shows toast notification
    - Updates notification count in context
  ↓
Header.tsx
  - Reads from NotificationCountContext
  - Displays badge with total count
  - Shows breakdown in dropdown
```

## Configuration

### Polling Intervals
- **Orders**: 45 seconds (45000ms)
- **Abandoned Carts**: 60 seconds (60000ms)

To modify intervals, edit:
- `OrdersPage.tsx` line ~265: `setInterval(..., 45000)`
- `AbandonedCartsPage.tsx` line ~165: `setInterval(..., 60000)`

### Sound Preferences
Sound preferences are persisted to localStorage and can be toggled via:
- Orders page toggle: "Suara Notifikasi Pesanan"
- Abandoned carts page toggle: "Suara Notifikasi Keranjang"

## Bug Fixes Applied

### Issue 1: Polling Not Triggering
**Root Cause**: Empty dependency array in useEffect captured stale `showToast` reference
**Solution**: Added proper dependencies using useCallback pattern

### Issue 2: Stale Closures
**Root Cause**: `playTone` function not in refreshOrdersSilently dependencies
**Solution**: Wrapped refresh functions in useCallback with full dependency list

### Issue 3: Notification Count Not Updating
**Root Cause**: Context updates only happened on initial mount
**Solution**: Added `setNewOrdersCount` and `setNewAbandonedCount` calls in polling functions

## Testing

### Manual Testing Steps

1. **Open Browser Console**:
   - Look for `[Polling]` messages every 45/60 seconds
   - Verify counts are correct

2. **Test Badge Display**:
   - Create new pending order → Badge should appear/update
   - Badge count = pending orders + new abandoned carts

3. **Test Sound Notifications**:
   - Enable sounds in respective pages
   - Wait for polling interval
   - Verify audio plays (880Hz vs 660Hz difference)

4. **Test Persistence**:
   - Refresh page
   - Verify notification counts restore

### Expected Console Output
```
[Polling] Previous IDs: 5 New orders: 1
[Notification] Showing toast for 1 new orders
```

## Integration with Existing Systems

- **Toast Notifications**: Used for user feedback on new arrivals
- **Database**: Reads from `orders` table (status='Pending') and `abandoned_carts` table (status='New')
- **User Roles**: No role restrictions on seeing notification badges (visible to all authenticated users)

## Performance Considerations

- Polling uses lightweight queries (no JOIN operations)
- State updates are minimal (just setting count numbers)
- Audio contexts are reused to prevent memory leaks
- Badge updates are real-time without page refresh required

## Future Enhancements

Potential improvements:
1. Server-sent events (SSE) for real-time updates vs polling
2. Custom notification sounds for different order types
3. Desktop notifications using Notification API
4. User preferences for polling intervals
5. Filtering badges by order status/payment method

## Troubleshooting

### Badge Not Showing
- Check if `NotificationCountContext` is properly provided in App.tsx
- Verify polling is running (check browser console)
- Check that `newOrdersCount` > 0 or `newAbandonedCount` > 0

### Sound Not Playing
- Check browser settings (may be muted)
- Verify toggle is enabled for respective page
- Check localStorage keys: `orders_sound_enabled`, `abandoned_sound_enabled`
- Try hard refresh (Ctrl+Shift+R)

### Polling Not Working
- Check browser console for errors
- Verify Supabase connection
- Check polling intervals are not set to 0
- Verify `refreshOrdersSilently` dependencies are correct

## Files Modified

- `contexts/NotificationCountContext.tsx` - NEW
- `components/Header.tsx` - Added badge display + dropdown info
- `pages/OrdersPage.tsx` - Added polling + context integration
- `pages/AbandonedCartsPage.tsx` - Added polling + context integration

## Commit History
- `d4e34f3` - Add notification count badges and integrate real-time order/abandoned cart notifications to header
