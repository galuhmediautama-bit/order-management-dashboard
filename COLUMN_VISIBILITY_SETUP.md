# Column Visibility Feature - Database Setup

## Overview
The customizable column visibility system for the orders table has been implemented. This feature allows each user to customize which columns they want to see in the orders table, and their preferences are saved per user.

## Database Migration Required

To enable this feature, you need to run the SQL migration to add the `columnVisibility` field to the `users` table.

### Steps to Run Migration:

1. **Go to Supabase Console**
   - Open https://supabase.com
   - Select your project (order-management-dashboard)
   - Click on "SQL Editor" in the left sidebar

2. **Create New Query**
   - Click "New Query"
   - Copy and paste the contents of `ADD_COLUMN_VISIBILITY_FIELD.sql`
   - Click "Run" to execute the migration

3. **Verify the migration**
   - Go to "Database" → "Tables" → "users"
   - Check that the `columnVisibility` column appears in the schema

### What the Migration Does:

- Adds `columnVisibility` column (jsonb type) to the `users` table
- Sets default value for all users (all columns visible by default)
- Creates an index for faster queries
- Adds documentation comment

### Column Visibility Options:

Users can toggle visibility for these columns:
- `orderId` - Order ID & Tanggal
- `customer` - Pelanggan (customer name & phone)
- `product` - Produk & Total (product name & price)
- `status` - Status & Pembayaran (order status & payment method)
- `platform` - Platform (Meta, TikTok, Google, Snack)
- `cs` - CS (assigned customer service agent)
- `followUp` - Follow Up (follow-up indicator)
- `actions` - Aksi (action buttons dropdown)

## How It Works:

1. **Settings Button**: Users click the "Tampilan Kolom" (Column Display) button in the orders table header
2. **Modal Opens**: A modal appears with checkboxes for each column
3. **Toggle Columns**: Users can select/deselect columns using checkboxes
4. **Quick Actions**: "Pilih Semua" (Select All) and "Batal Semua" (Deselect All) buttons
5. **Save**: Click "Simpan" to save preferences to database
6. **Persistence**: 
   - Preferences are saved per user to Supabase
   - Loaded automatically when user logs in
   - Persists across page reloads and sessions

## Code Structure:

- **Component**: `components/ColumnVisibilityModal.tsx`
  - Reusable modal with checklist interface
  - Handles toggle logic and visual feedback
  
- **Page Logic**: `pages/OrdersPage.tsx`
  - `columnVisibility` state - tracks current visibility settings
  - `loadColumnPreferences()` - fetches saved preferences on mount
  - `saveColumnPreferences()` - saves preferences to database
  - Conditional rendering of table columns based on visibility state

- **Type**: Updated `User` interface in `types.ts`
  - Added `columnVisibility?: Record<string, boolean>`

## Testing:

After running the migration:

1. **Test as Different Users**
   - Log in as different users
   - Each should be able to customize columns independently

2. **Test Persistence**
   - Hide some columns
   - Click Save
   - Reload the page
   - Columns should remain hidden

3. **Test Logout/Login**
   - Customize columns
   - Save
   - Logout
   - Login again
   - Preferences should be restored

## Troubleshooting:

If the save fails with "Gagal menyimpan pengaturan kolom":

1. **Check Supabase Connection**
   - Verify API keys in `firebase.ts`
   - Check that Supabase project is accessible

2. **Check User Permissions**
   - Ensure RLS (Row Level Security) policy allows users to update their own record
   - If RLS is enabled, add policy: `ALTER POLICY "enable_self_updates" ON "users" ...`

3. **Check Database**
   - Verify `columnVisibility` column exists
   - Run: `SELECT * FROM users LIMIT 1;` and check schema

4. **Browser Console**
   - Open DevTools (F12)
   - Check Console tab for error messages
   - Look for "Failed to save column preferences:" logs

## Default Preferences:

When a user first uses the feature, all columns are visible by default. The default JSON value is:

```json
{
  "orderId": true,
  "customer": true,
  "product": true,
  "status": true,
  "platform": true,
  "cs": true,
  "followUp": true,
  "actions": true
}
```

## Related Commits:

- `bd7040a` - Feature implementation
- `890f5cc` - Fix icon imports  
- `078ec88` - Fix JSX syntax
