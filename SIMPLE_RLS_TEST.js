// ============================================
// SIMPLE RLS TEST - Use app's Supabase client
// Copy-paste ke browser console
// ============================================

(async function () {
    console.log('🧪 Testing RLS with app Supabase client...\n');

    try {
        // Check auth status
        const { data: { user } } = await window.__SUPABASE_AUTH_CHECK?.();

        if (!user) {
            console.log('❌ Not authenticated. Checking auth via API...');

            // Get auth from localStorage
            const authStr = localStorage.getItem('sb-jnkbysrjfdwsznsrvwhz-auth-token');
            if (!authStr) {
                console.error('❌ No auth token in localStorage');
                console.log('💡 Please login first, then run this again');
                return;
            }
            console.log('✅ Found auth token in localStorage');
        } else {
            console.log('✅ Authenticated as:', user.email);
        }

        // Test 1: Check if window.supabaseClient exists
        console.log('\n🔍 Checking Supabase client...');
        if (window.supabaseClient) {
            console.log('✅ window.supabaseClient found');
        } else {
            console.log('⚠️  window.supabaseClient not found, trying alternative...');
        }

        // Test 2: Simple query to check RLS
        console.log('\n📋 Testing users table SELECT...');

        // Build fetch request manually
        const authToken = localStorage.getItem('sb-jnkbysrjfdwsznsrvwhz-auth-token');
        if (!authToken) {
            console.error('❌ No auth token');
            return;
        }

        const token = JSON.parse(authToken).access_token;
        console.log('✅ Found access token');

        const supabaseUrl = 'https://jnkbysrjfdwsznsrvwhz.supabase.co';
        const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impua2J5c3JqZmR3c3puc3J2d2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODYwMzA4NDcsImV4cCI6MTk5OTY0MDg0N30.oRtYrSYszZXy_08-QdxAs22xC6NdIR-4';

        console.log('📡 Fetching from:', supabaseUrl);

        const res = await fetch(
            `${supabaseUrl}/rest/v1/users?select=id,email,role,status&limit=5`,
            {
                method: 'GET',
                headers: {
                    'apikey': anonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('📊 Response status:', res.status);

        const data = await res.json();

        if (res.status === 200) {
            console.log('✅ Query successful (200 OK)');
            if (Array.isArray(data) && data.length > 0) {
                console.log(`✅ Found ${data.length} users`);
                console.log('Sample:', data[0]);
                console.log('\n🎉 RLS is PERMISSIVE - Data is accessible!');
                console.log('Next steps:');
                console.log('1. Refresh browser (F5)');
                console.log('2. Check if sidebar shows all menu items');
                console.log('3. Check if dashboard shows data');
            } else {
                console.log('⚠️  Query returned 200 but no data');
            }
        } else if (res.status === 403) {
            console.log('❌ Access forbidden (403) - RLS still blocking');
            console.log('Response:', data);
        } else {
            console.log(`❌ Error ${res.status}`);
            console.log('Response:', data);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('Stack:', error.stack);
    }
})();
