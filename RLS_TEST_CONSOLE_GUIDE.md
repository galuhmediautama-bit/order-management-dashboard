# How to Test RLS in Browser Console

## Problem
Sidebar showing only Dashboard, data showing "Tidak ada data"

## Solution
Test if RLS is now permissive after running QUICK_FIX_RLS_SIMPLE.sql

## Steps

### 1. Open Browser DevTools
- Press **F12** pada aplikasi browser
- Atau klik kanan → **Inspect** → **Console** tab

### 2. Copy-Paste Test Script
Copy seluruh code di bawah ini:

```javascript
(async function testRLS() {
  console.log('🧪 Testing RLS...\n');
  
  try {
    const authToken = localStorage.getItem('sb-jnkbysrjfdwsznsrvwhz-auth-token');
    if (!authToken) {
      console.error('❌ Not authenticated');
      return;
    }
    
    const tokenObj = JSON.parse(authToken);
    const accessToken = tokenObj.access_token;
    
    const supabaseUrl = 'https://jnkbysrjfdwsznsrvwhz.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impua2J5c3JqZmR3c3puc3J2d2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODYwMzA4NDcsImV4cCI6MTk5OTY0MDg0N30.oRtYrSYszZXy_08-QdxAs22xC6NdIR-4';
    
    // Test users table
    console.log('📋 Testing users table...');
    const usersRes = await fetch(
      `${supabaseUrl}/rest/v1/users?select=id,email,role&limit=5`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    const users = await usersRes.json();
    console.log(`Users Status: ${usersRes.status}`, users.length > 0 ? `✅ ${users.length} users found` : `❌ ${users[0]?.message || 'No data'}`);
    
    // Test orders table
    console.log('\n📦 Testing orders table...');
    const ordersRes = await fetch(
      `${supabaseUrl}/rest/v1/orders?select=id,status&limit=10`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    const orders = await ordersRes.json();
    console.log(`Orders Status: ${ordersRes.status}`, orders.length > 0 ? `✅ ${orders.length} orders found` : `❌ ${orders[0]?.message || 'No data'}`);
    
    // Test settings table
    console.log('\n⚙️  Testing settings table...');
    const settingsRes = await fetch(
      `${supabaseUrl}/rest/v1/settings?select=id&limit=1`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    const settings = await settingsRes.json();
    console.log(`Settings Status: ${settingsRes.status}`, settings.length > 0 ? `✅ Settings found` : `❌ ${settings[0]?.message || 'No data'}`);
    
    console.log('\n✨ RLS Test Results:');
    console.log('- Users:', usersRes.status === 200 ? '✅ 200 OK' : `❌ ${usersRes.status}`);
    console.log('- Orders:', ordersRes.status === 200 ? '✅ 200 OK' : `❌ ${ordersRes.status}`);
    console.log('- Settings:', settingsRes.status === 200 ? '✅ 200 OK' : `❌ ${settingsRes.status}`);
    
    if (usersRes.status === 200 && ordersRes.status === 200) {
      console.log('\n🎉 RLS is PERMISSIVE! Sidebar should show data now.');
      console.log('Next: Refresh page (F5)');
    } else {
      console.log('\n⚠️  Some queries still blocked by RLS');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
```

### 3. Paste into Console
- Click into console input area (bawah DevTools)
- Paste script
- Press **Enter**

### 4. Check Results
Look for output:
- ✅ `200 OK` on users, orders, settings = RLS is permissive
- ❌ `403` or error = RLS still blocking
- ⚠️ `PGRST` error = Policy syntax issue

### 5. Refresh Page
- If RLS tests pass: Press **F5** to refresh
- Sidebar should show all menu items
- Dashboard should show data

## Expected Output After QUICK_FIX_RLS_SIMPLE.sql

```
🧪 Testing RLS...

📋 Testing users table...
Users Status: 200 ✅ 5 users found

📦 Testing orders table...
Orders Status: 200 ✅ 50 orders found

⚙️  Testing settings table...
Settings Status: 200 ✅ Settings found

✨ RLS Test Results:
- Users: ✅ 200 OK
- Orders: ✅ 200 OK
- Settings: ✅ 200 OK

🎉 RLS is PERMISSIVE! Sidebar should show data now.
Next: Refresh page (F5)
```

## Troubleshooting

### If you see `❌ 403` or `PGRST`
- RLS policy still blocking
- SQL may not have executed properly
- Need to re-run QUICK_FIX_RLS_SIMPLE.sql

### If all 200 but sidebar still empty
- Browser cache issue: Press Ctrl+Shift+R (hard refresh)
- Check browser console for JS errors
- Check Network tab for failed requests

### If not authenticated
- Logout and login again
- Clear browser cache
