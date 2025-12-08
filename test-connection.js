import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://ggxyaautsdukyapstlgr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdneHlhYXV0c2R1a3lhcHN0bGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODQxNDksImV4cCI6MjA4MDE2MDE0OX0.oVMzNX8x6VEoRtYrSYszZXy_08-QdxAs22xC6NdIR-4'
);

async function testConnection() {
    console.log('🔍 Checking Advertiser users and Syahrul...\n');

    try {
        // Get all Advertiser users
        const { data: advertisers, error: advError } = await supabase
            .from('users')
            .select('id, name, email, role, status, "assignedBrandIds"')
            .eq('role', 'Advertiser')
            .order('name');

        if (advError) {
            console.error('❌ Error getting advertisers:', advError.message);
        } else if (advertisers && advertisers.length > 0) {
            console.log(`✅ Found ${advertisers.length} Advertiser(s):\n`);
            advertisers.forEach((user, i) => {
                console.log(`${i + 1}. ${user.name} (${user.email})`);
                console.log(`   Status: ${user.status}, Brands: ${JSON.stringify(user.assignedBrandIds)}\n`);
            });
        } else {
            console.log('⚠️ No Advertisers found\n');
        }

        // Also check for any user with wandika/syahrul
        console.log('🔍 Searching for "wandika" or "syahrul"...\n');
        const { data: matches, error: matchError } = await supabase
            .from('users')
            .select('id, name, email, role, status')
            .or('email.ilike.%wandika%,name.ilike.%wandika%,email.ilike.%syahrul%,name.ilike.%syahrul%');

        if (!matchError && matches && matches.length > 0) {
            console.log(`✅ Found ${matches.length} match(es):\n`);
            matches.forEach((user, i) => {
                console.log(`${i + 1}. ${user.name} (${user.email}) - Role: ${user.role}, Status: ${user.status}`);
            });
        } else {
            console.log('⚠️ No matches found');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testConnection();
