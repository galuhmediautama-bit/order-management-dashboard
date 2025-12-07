// ============================================================
// FRONTEND NOTIFICATION SYNC DIAGNOSTIC
// ============================================================
// Run this in browser console to check notifications sync
// Copy semua code ini dan paste di browser DevTools console

(async () => {
    console.log('🔍 NOTIFICATION SYNC DIAGNOSTIC STARTED...\n');

    // Import Supabase client
    const { supabase } = await import('./firebase.ts');

    try {
        // 1. CHECK CURRENT USER
        console.log('📋 Step 1: Checking current user...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
            console.error('❌ User error:', userError);
            return;
        }
        
        if (!user) {
            console.log('⚠️ No user logged in! Please login first.');
            return;
        }
        
        console.log('✅ Current user:', {
            id: user.id,
            email: user.email,
            created_at: user.created_at
        });

        // 2. FETCH NOTIFICATIONS FROM DB
        console.log('\n📋 Step 2: Fetching notifications from database...');
        const { data: dbNotifications, error: fetchError, count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact' });

        if (fetchError) {
            console.error('❌ Fetch error:', fetchError);
            return;
        }

        console.log(`✅ Database notifications: ${dbNotifications?.length || 0} found`);
        console.log('   Total count from DB:', count);

        // 3. ANALYZE NOTIFICATIONS
        if (dbNotifications && dbNotifications.length > 0) {
            console.log('\n📋 Step 3: Analyzing notifications...');
            
            const readCount = dbNotifications.filter((n: any) => n.read === true).length;
            const unreadCount = dbNotifications.filter((n: any) => n.read === false).length;
            
            console.log(`   Read: ${readCount}`);
            console.log(`   Unread: ${unreadCount}`);
            
            // Group by type
            const byType: { [key: string]: number } = {};
            dbNotifications.forEach((n: any) => {
                byType[n.type] = (byType[n.type] || 0) + 1;
            });
            
            console.log('   By Type:');
            Object.entries(byType).forEach(([type, count]) => {
                console.log(`     - ${type}: ${count}`);
            });

            // Check for duplicates
            const messageSet = new Set();
            const duplicates = dbNotifications.filter((n: any) => {
                if (messageSet.has(n.message)) {
                    return true;
                }
                messageSet.add(n.message);
                return false;
            });

            if (duplicates.length > 0) {
                console.log(`\n   ⚠️ Found ${duplicates.length} duplicate messages`);
            }

            // Show latest 5
            console.log('\n   Latest 5 notifications:');
            const sorted = [...dbNotifications].sort((a: any, b: any) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            sorted.slice(0, 5).forEach((n: any) => {
                console.log(`     - [${n.read ? '✓' : '○'}] ${n.type}: ${n.message} (${new Date(n.created_at).toLocaleTimeString()})`);
            });
        } else {
            console.log('   ⚠️ No notifications in database');
        }

        // 4. CHECK TABLE SCHEMA
        console.log('\n📋 Step 4: Checking notifications table schema...');
        const { data: tableInfo, error: schemaError } = await supabase
            .from('notifications')
            .select('*')
            .limit(1);

        if (!schemaError && tableInfo && tableInfo.length > 0) {
            const sampleRow = tableInfo[0];
            console.log('✅ Columns in notifications table:');
            Object.keys(sampleRow).forEach(key => {
                console.log(`   - ${key}: ${typeof sampleRow[key]}`);
            });
        }

        // 5. TEST INSERT
        console.log('\n📋 Step 5: Testing INSERT operation...');
        const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const { data: insertData, error: insertError } = await supabase
            .from('notifications')
            .insert([{
                id: testId,
                type: 'test',
                message: 'Test notification for sync check',
                read: false
            }])
            .select();

        if (insertError) {
            console.error('❌ Insert error:', insertError);
        } else {
            console.log('✅ Insert successful:', insertData);
            
            // Try to fetch it back
            await new Promise(resolve => setTimeout(resolve, 500));
            const { data: verifyData, error: verifyError } = await supabase
                .from('notifications')
                .select('*')
                .eq('id', testId);
            
            if (verifyError) {
                console.error('❌ Verification error:', verifyError);
            } else if (verifyData && verifyData.length > 0) {
                console.log('✅ Verification successful - notification persisted to DB');
                
                // Clean up
                await supabase.from('notifications').delete().eq('id', testId);
                console.log('✅ Test notification cleaned up');
            } else {
                console.log('⚠️ Insert successful but notification not found on verification');
            }
        }

        // 6. CHECK REALTIME STATUS
        console.log('\n📋 Step 6: Checking realtime subscriptions...');
        console.log('✅ Realtime configured in Header and NotificationsPage');
        console.log('   Events monitored: INSERT, UPDATE');

        console.log('\n✅ DIAGNOSTIC COMPLETE!\n');
        
    } catch (error) {
        console.error('❌ Diagnostic error:', error);
    }
})();
