// Quick test script - run in browser console
// This will test if RLS is now permissive

async function testRLS() {
  console.log('🧪 Testing RLS after QUICK_FIX_RLS_SIMPLE.sql...\n');
  
  const supabaseUrl = 'https://jnkbysrjfdwsznsrvwhz.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impua2J5c3JqZmR3c3puc3J2d2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODYwMzA4NDcsImV4cCI6MTk5OTY0MDg0N30.oRtYrSYszZXy_08-QdxAs22xC6NdIR-4';
  
  // Get current user
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('sb-jnkbysrjfdwsznsrvwhz-auth-token')?.split('"')[1] || 'no-token'}`
    }
  });
  
  console.log('👤 Current user:', userRes.status === 200 ? 'Authenticated' : 'Not authenticated');
  
  // Test 1: Users SELECT
  console.log('\n📋 Test 1: SELECT from users table');
  const usersRes = await fetch(
    `${supabaseUrl}/rest/v1/users?select=id,email,role,status&limit=5`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${localStorage.getItem('sb-jnkbysrjfdwsznsrvwhz-auth-token')?.split('"')[1] || ''}`,
        'Content-Type': 'application/json'
      }
    }
  );
  const users = await usersRes.json();
  console.log(`Status: ${usersRes.status}`, users.length > 0 ? `✅ Found ${users.length} users` : '❌ No users');
  
  // Test 2: Orders SELECT
  console.log('\n📦 Test 2: SELECT from orders table');
  const ordersRes = await fetch(
    `${supabaseUrl}/rest/v1/orders?select=id,status&limit=10`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${localStorage.getItem('sb-jnkbysrjfdwsznsrvwhz-auth-token')?.split('"')[1] || ''}`,
        'Content-Type': 'application/json'
      }
    }
  );
  const orders = await ordersRes.json();
  console.log(`Status: ${ordersRes.status}`, orders.length > 0 ? `✅ Found ${orders.length} orders` : '❌ No orders');
  
  // Test 3: Settings SELECT
  console.log('\n⚙️  Test 3: SELECT from settings table');
  const settingsRes = await fetch(
    `${supabaseUrl}/rest/v1/settings?select=id&limit=1`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${localStorage.getItem('sb-jnkbysrjfdwsznsrvwhz-auth-token')?.split('"')[1] || ''}`,
        'Content-Type': 'application/json'
      }
    }
  );
  const settings = await settingsRes.json();
  console.log(`Status: ${settingsRes.status}`, settings.length > 0 ? `✅ Found settings` : '⚠️  No settings');
  
  console.log('\n✨ RLS Test Complete!');
  console.log('\nExpected after QUICK_FIX_RLS_SIMPLE.sql:');
  console.log('- All queries should return 200 status');
  console.log('- users table should have data');
  console.log('- orders table should have data');
  console.log('- Sidebar should show all menu items');
  console.log('- Dashboard should display order statistics');
}

testRLS();
