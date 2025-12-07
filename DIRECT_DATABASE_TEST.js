/**
 * DIRECT DATABASE TEST - Run this in browser console at http://localhost:3000
 * 
 * PURPOSE: Check if notifications are actually being saved to Supabase database
 * 
 * STEPS:
 * 1. F12 to open DevTools
 * 2. Go to Console tab
 * 3. Copy-paste this entire code
 * 4. Check output - shows exactly what's happening
 */

console.clear();
console.log('🔍 STARTING DIRECT NOTIFICATION DATABASE TEST');
console.log('================================================\n');

// Step 1: Check if we're logged in
console.log('📋 Step 1: Checking authentication...');
const checkAuth = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/auth/session', {
            credentials: 'include'
        });
        console.log('✅ Auth check response:', response.status);
    } catch (e) {
        console.log('⚠️ No auth endpoint - that\'s OK');
    }
};

// Step 2: Directly query notifications from Supabase
console.log('\n📋 Step 2: Querying notifications table...');
const queryNotifications = async () => {
    try {
        // This is a direct fetch to Supabase REST API
        const supabaseUrl = 'https://ggxyaautsdukyapstlgr.supabase.co';
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdneHlhYXV0c2R1a3lhcHN0bGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODQxNDksImV4cCI6MjA4MDE2MDE0OX0.oVMzNX8x6VEoRtYrSYszZXy_08-QdxAs22xC6NdIR-4';
        
        const response = await fetch(
            `${supabaseUrl}/rest/v1/notifications?select=*&order=timestamp.desc&limit=5`,
            {
                headers: {
                    'apikey': apiKey,
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );
        
        const data = await response.json();
        
        if (response.ok) {
            console.log(`✅ Query successful! Found ${data.length} notifications`);
            console.log('Latest notifications:');
            data.forEach((notif, idx) => {
                console.log(`  ${idx + 1}. [${notif.type}] ${notif.message.substring(0, 50)}...`);
                console.log(`     ID: ${notif.id}`);
                console.log(`     Read: ${notif.read}`);
                console.log(`     Timestamp: ${notif.timestamp}`);
            });
        } else {
            console.error('❌ Query failed:', data);
        }
    } catch (error) {
        console.error('❌ Error querying notifications:', error);
    }
};

// Step 3: Check table structure
console.log('\n📋 Step 3: Checking table columns...');
const checkSchema = async () => {
    try {
        const supabaseUrl = 'https://ggxyaautsdukyapstlgr.supabase.co';
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdneHlhYXV0c2R1a3lhcHN0bGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODQxNDksImV4cCI6MjA4MDE2MDE0OX0.oVMzNX8x6VEoRtYrSYszZXy_08-QdxAs22xC6NdIR-4';
        
        // Get one row to see column names
        const response = await fetch(
            `${supabaseUrl}/rest/v1/notifications?select=*&limit=1`,
            {
                headers: {
                    'apikey': apiKey,
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );
        
        const data = await response.json();
        if (data.length > 0) {
            console.log('✅ Table columns:');
            Object.keys(data[0]).forEach(key => {
                console.log(`   - ${key}: ${typeof data[0][key]}`);
            });
        } else {
            console.log('⚠️ No rows in table yet');
        }
    } catch (error) {
        console.error('❌ Error checking schema:', error);
    }
};

// Step 4: Test INSERT
console.log('\n📋 Step 4: Testing INSERT operation...');
const testInsert = async () => {
    try {
        const supabaseUrl = 'https://ggxyaautsdukyapstlgr.supabase.co';
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdneHlhYXV0c2R1a3lhcHN0bGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODQxNDksImV4cCI6MjA4MDE2MDE0OX0.oVMzNX8x6VEoRtYrSYszZXy_08-QdxAs22xC6NdIR-4';
        
        const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const testNotif = {
            id: testId,
            type: 'test',
            message: 'Test notification - checking database sync',
            read: false,
            timestamp: new Date().toISOString()
        };
        
        const response = await fetch(
            `${supabaseUrl}/rest/v1/notifications`,
            {
                method: 'POST',
                headers: {
                    'apikey': apiKey,
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify([testNotif])
            }
        );
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ INSERT successful!');
            console.log('   Inserted:', result);
        } else {
            const error = await response.text();
            console.error('❌ INSERT failed:', response.status, error);
        }
    } catch (error) {
        console.error('❌ Error inserting:', error);
    }
};

// Step 5: Check RLS Policies
console.log('\n📋 Step 5: Checking RLS policies...');
const checkRLS = () => {
    console.log('ℹ️ To verify RLS policies:');
    console.log('   1. Go to Supabase dashboard');
    console.log('   2. Select "notifications" table');
    console.log('   3. Go to "Auth" > "Policies" tab');
    console.log('   4. Check if policies allow SELECT, INSERT, UPDATE, DELETE');
};

// Step 6: Check current app state
console.log('\n📋 Step 6: Checking app component state...');
const checkAppState = () => {
    console.log('ℹ️ To check component state:');
    console.log('   1. Keep DevTools open');
    console.log('   2. Go to React DevTools tab');
    console.log('   3. Select Header component');
    console.log('   4. Look at "notifications" state - what count?');
    console.log('   5. Select NotificationsPage component');
    console.log('   6. Look at "notifications" state - should match header');
};

// Run all steps
(async () => {
    await checkAuth();
    await queryNotifications();
    await checkSchema();
    await testInsert();
    checkRLS();
    checkAppState();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ DIAGNOSTIC COMPLETE');
    console.log('='.repeat(50));
    console.log('\n📋 SUMMARY:');
    console.log('- If Step 2 shows many notifications → Database OK');
    console.log('- If Step 4 INSERT succeeded → Can save to DB');
    console.log('- If Step 3 shows columns → Table structure OK');
    console.log('- If RLS block everything → That\'s the problem!');
    console.log('\n💡 Share the output above for debugging');
})();
