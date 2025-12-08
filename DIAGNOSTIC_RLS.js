// Quick diagnostic script to check RLS and data
// Paste this in browser console to debug

(async () => {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');

    const supabase = createClient(
        'https://jnkbysrjfdwsznsrvwhz.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impua2J5c3JqZmR3c3puc3J2d2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODYwMzA4NDcsImV4cCI6MTk5OTY0MDg0N30.oRtYrSYszZXy_08-QdxAs22xC6NdIR-4'
    );

    console.log('🔍 === RLS & Data Diagnostic ===');

    // 1. Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('👤 Current user:', user?.email, authError ? '❌ ' + authError.message : '✅');

    if (!user) {
        console.log('❌ No authenticated user - cannot test RLS');
        return;
    }

    // 2. Test users SELECT
    console.log('\n📋 Testing users SELECT RLS...');
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, role, status')
        .limit(5);
    console.log(usersError ? '❌ ' + usersError.message : '✅ Query success', {
        count: users?.length || 0,
        sample: users?.[0]
    });

    // 3. Test settings SELECT
    console.log('\n⚙️  Testing settings SELECT RLS...');
    const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('id, websiteSettings')
        .limit(1);
    console.log(settingsError ? '❌ ' + settingsError.message : '✅ Query success', {
        count: settings?.length || 0
    });

    // 4. Test orders SELECT
    console.log('\n📦 Testing orders SELECT RLS...');
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status')
        .limit(5);
    console.log(ordersError ? '❌ ' + ordersError.message : '✅ Query success', {
        count: orders?.length || 0
    });

    // 5. Test forms SELECT
    console.log('\n📝 Testing forms SELECT RLS...');
    const { data: forms, error: formsError } = await supabase
        .from('forms')
        .select('id, title')
        .limit(5);
    console.log(formsError ? '❌ ' + formsError.message : '✅ Query success', {
        count: forms?.length || 0
    });

    console.log('\n✨ Diagnostic complete!');
})();
