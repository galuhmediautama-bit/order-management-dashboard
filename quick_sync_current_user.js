// ============================================================================
// BROWSER CONSOLE SYNC - SIMPLE VERSION (Tidak perlu fetch auth.users)
// ============================================================================
// Paste ini di console dan run - langsung insert ke public.users

async function quickSync() {
  try {
    console.log('🔄 Starting quick sync to public.users...\n');

    // Get current session
    const token = localStorage.getItem('sb-ggxyaautsdukyapstlgr-auth-token');
    if (!token) {
      console.error('❌ No auth token. Please login first.');
      return;
    }

    const authSession = JSON.parse(token);
    const accessToken = authSession.access_token;

    const supabaseUrl = 'https://ggxyaautsdukyapstlgr.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdneHlhYXV0c2R1a3lhcHN0bGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODQxNDksImV4cCI6MjA4MDE2MDE0OX0.oVMzNX8x6VEoRtYrSYszZXy_08-QdxAs22xC6NdIR-4';

    // Get current user from session
    const currentUser = authSession.user;
    console.log('📌 Current user:', currentUser.email);

    // Step 1: Delete all from public.users
    console.log('\n🗑️  Deleting all from public.users...');
    const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 'id': { neq: null } })
    });

    if (!deleteResponse.ok) {
      console.error('❌ Delete failed:', deleteResponse.status, await deleteResponse.text());
      return;
    }
    console.log('✅ Deleted all users');

    // Step 2: Insert current user
    console.log('\n📝 Inserting current user...');
    const userToInsert = {
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.user_metadata?.full_name || currentUser.email.split('@')[0],
      role: currentUser.email === 'galuhmediautama@gmail.com' ? 'Super Admin' : 'Advertiser',
      status: 'Aktif',
      created_at: new Date(currentUser.created_at).toISOString(),
      updated_at: new Date().toISOString()
    };

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([userToInsert])
    });

    if (!insertResponse.ok) {
      console.error('❌ Insert failed:', insertResponse.status, await insertResponse.text());
      return;
    }
    console.log('✅ Inserted current user');

    // Step 3: Verify
    console.log('\n✔️  Verifying...');
    const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': supabaseKey
      }
    });

    const finalUsers = await verifyResponse.json();
    console.log(`\n✅ SYNC COMPLETE!`);
    console.log(`Total users: ${finalUsers.length}`);
    console.log('User:', finalUsers[0]);

    console.log('\n🔄 Reloading page...');
    setTimeout(() => window.location.reload(), 1500);

  } catch (error) {
    console.error('❌ ERROR:', error);
  }
}

// RUN
quickSync();
