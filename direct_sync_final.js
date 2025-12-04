// ============================================================================
// DIRECT USER SYNC - Paste di browser console dan jalankan
// ============================================================================

// Step 1: Setup
const supabaseUrl = 'https://ggxyaautsdukyapstlgr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdneHlhYXV0c2R1a3lhcHN0bGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODQxNDksImV4cCI6MjA4MDE2MDE0OX0.oVMzNX8x6VEoRtYrSYszZXy_08-QdxAs22xC6NdIR-4';

async function syncUsersDirectly() {
  try {
    console.log('🔄 STARTING DIRECT SYNC...\n');

    // Get current session
    const token = localStorage.getItem('sb-ggxyaautsdukyapstlgr-auth-token');
    if (!token) {
      console.error('❌ No auth token found. Please login first.');
      return;
    }

    // Parse token
    const authSession = JSON.parse(token);
    const accessToken = authSession.access_token;

    // Step 1: Fetch auth.users via API
    console.log('📋 Fetching users from auth.users...');
    const authResponse = await fetch(`${supabaseUrl}/rest/v1/auth.users`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': supabaseKey
      }
    });

    if (!authResponse.ok) {
      console.error('❌ Failed to fetch auth.users:', authResponse.status, authResponse.statusText);
      return;
    }

    const authUsers = await authResponse.json();
    console.log(`✅ Found ${authUsers.length} users in auth.users:`, authUsers.map(u => u.email));

    // Step 2: Delete all from public.users
    console.log('\n🗑️  Deleting all from public.users...');
    const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: { neq: null } })
    });

    if (!deleteResponse.ok) {
      console.error('❌ Failed to delete:', deleteResponse.status);
      return;
    }
    console.log('✅ Deleted all users');

    // Step 3: Insert new users
    console.log('\n📝 Inserting users from auth...');
    const usersToInsert = authUsers.map(au => ({
      id: au.id,
      email: au.email,
      name: au.user_metadata?.full_name || au.email.split('@')[0],
      role: au.email === 'galuhmediautama@gmail.com' ? 'Super Admin' : (au.user_metadata?.role || 'Advertiser'),
      status: 'Aktif',
      created_at: au.created_at,
      updated_at: new Date().toISOString()
    }));

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(usersToInsert)
    });

    if (!insertResponse.ok) {
      const error = await insertResponse.text();
      console.error('❌ Failed to insert:', insertResponse.status, error);
      return;
    }
    console.log(`✅ Inserted ${usersToInsert.length} users`);

    // Step 4: Verify
    console.log('\n✔️  Verifying...');
    const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': supabaseKey
      }
    });

    const finalUsers = await verifyResponse.json();
    console.log(`\n✅ SYNC COMPLETE!\n`);
    console.log(`Total users now: ${finalUsers.length}`);
    console.log('Users:', finalUsers.map(u => ({ email: u.email, role: u.role, status: u.status })));

    // Reload after 2 sec
    console.log('\n🔄 Reloading page in 2 seconds...');
    setTimeout(() => window.location.reload(), 2000);

  } catch (error) {
    console.error('❌ ERROR:', error);
  }
}

// RUN IT
syncUsersDirectly();
