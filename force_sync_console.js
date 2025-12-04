// ============================================================================
// FORCE SYNC USERS - Run ini di browser console
// Buka app → F12 → Console → Paste semua code ini
// ============================================================================

async function forceSyncUsers() {
  try {
    console.log('🔄 Starting force sync...');

    // Import Supabase
    const { createClient } = window.supabase;
    const supabase = createClient(
      'https://ggxyaautsdukyapstlgr.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdneHlhYXV0c2R1a3lhcHN0bGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODQxNDksImV4cCI6MjA4MDE2MDE0OX0.oVMzNX8x6VEoRtYrSYszZXy_08-QdxAs22xC6NdIR-4'
    );

    // Step 1: Check auth.users
    console.log('📋 Checking auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error listing auth users:', authError);
      return;
    }
    
    console.log(`✅ Found ${authUsers.users.length} auth users:`, authUsers.users.map(u => u.email));

    // Step 2: Delete all public.users
    console.log('🗑️ Deleting all public.users...');
    const { error: deleteError } = await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.error('❌ Error deleting:', deleteError);
      return;
    }
    console.log('✅ Deleted all users');

    // Step 3: Insert all from auth
    console.log('📝 Inserting users from auth...');
    const usersToInsert = authUsers.users.map(au => ({
      id: au.id,
      email: au.email,
      name: au.user_metadata?.full_name || au.email.split('@')[0],
      role: au.email === 'galuhmediautama@gmail.com' ? 'Super Admin' : au.user_metadata?.role || 'Advertiser',
      status: 'Aktif',
      phone: au.user_metadata?.phone || null,
      address: au.user_metadata?.address || null,
      brand_id: null,
      created_at: au.created_at,
      updated_at: new Date().toISOString()
    }));

    const { error: insertError } = await supabase.from('users').insert(usersToInsert);
    
    if (insertError) {
      console.error('❌ Error inserting:', insertError);
      return;
    }
    console.log(`✅ Inserted ${usersToInsert.length} users`);

    // Step 4: Verify
    console.log('✔️ Verifying...');
    const { data: finalUsers, error: finalError } = await supabase.from('users').select('*');
    
    if (finalError) {
      console.error('❌ Error verifying:', finalError);
      return;
    }
    
    console.log(`\n✅ SYNC COMPLETE!\n`);
    console.log(`Total users in public.users: ${finalUsers.length}`);
    console.log('Users:', finalUsers.map(u => ({ email: u.email, role: u.role, status: u.status })));
    
    // Reload page after 2 seconds
    setTimeout(() => {
      console.log('🔄 Reloading page...');
      window.location.reload();
    }, 2000);

  } catch (error) {
    console.error('❌ UNEXPECTED ERROR:', error);
  }
}

// Jalankan
forceSyncUsers();
