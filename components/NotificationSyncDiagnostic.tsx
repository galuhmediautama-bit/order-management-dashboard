import React, { useState } from 'react';
import { supabase } from '../firebase';
import { Notification } from '../types';

const NotificationSyncDiagnostic: React.FC = () => {
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const runDiagnostic = async () => {
        setLoading(true);
        const log: any[] = [];

        try {
            // 1. Check table exists
            log.push('🔍 Checking if notifications table exists...');
            const { data: tableCheck, error: tableError } = await supabase
                .from('notifications')
                .select('count', { count: 'exact', head: true });

            if (tableError) {
                log.push(`❌ Table check failed: ${tableError.message}`);
                setResults(log);
                setLoading(false);
                return;
            }

            log.push('✅ Table exists');

            // 2. Count notifications
            log.push('\n📊 Counting notifications...');
            const { data: allNotifs, error: fetchError, count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact' });

            if (fetchError) {
                log.push(`❌ Fetch error: ${fetchError.message}`);
            } else {
                log.push(`✅ Total notifications in DB: ${count}`);
                
                if (allNotifs && allNotifs.length > 0) {
                    const readCount = allNotifs.filter(n => n.read === true).length;
                    const unreadCount = allNotifs.filter(n => n.read === false).length;
                    log.push(`   - Read: ${readCount}`);
                    log.push(`   - Unread: ${unreadCount}`);

                    // Group by type
                    const byType: { [key: string]: number } = {};
                    allNotifs.forEach(n => {
                        byType[n.type] = (byType[n.type] || 0) + 1;
                    });
                    
                    log.push('   By Type:');
                    Object.entries(byType).forEach(([type, cnt]) => {
                        log.push(`     - ${type}: ${cnt}`);
                    });

                    // Show last 3
                    log.push('\n   Last 3 notifications:');
                    const sorted = [...allNotifs].sort((a, b) => 
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    );
                    sorted.slice(0, 3).forEach(n => {
                        log.push(`     [${n.read ? '✓' : '○'}] ${n.type}: ${n.message.substring(0, 50)}...`);
                    });
                }
            }

            // 3. Test INSERT
            log.push('\n📝 Testing INSERT operation...');
            const testId = `test-${Date.now()}`;
            const { data: insertData, error: insertError } = await supabase
                .from('notifications')
                .insert([{
                    id: testId,
                    type: 'new_order',
                    message: 'Test notification for sync check',
                    read: false,
                    timestamp: new Date().toISOString(),
                }])
                .select();

            if (insertError) {
                log.push(`❌ Insert error: ${insertError.message}`);
            } else {
                log.push('✅ Insert successful');
                
                // Verify insert
                await new Promise(resolve => setTimeout(resolve, 500));
                const { data: verifyData, error: verifyError } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('id', testId);

                if (verifyError) {
                    log.push(`❌ Verification error: ${verifyError.message}`);
                } else if (verifyData && verifyData.length > 0) {
                    log.push('✅ Notification verified in database');
                    
                    // Cleanup
                    await supabase.from('notifications').delete().eq('id', testId);
                    log.push('✅ Test notification cleaned up');
                } else {
                    log.push('⚠️ Notification inserted but not found on verification');
                }
            }

            // 4. Test UPDATE
            log.push('\n📝 Testing UPDATE (mark as read) operation...');
            const { error: updateError } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('read', false)
                .limit(1);

            if (updateError) {
                log.push(`❌ Update error: ${updateError.message}`);
            } else {
                log.push('✅ Update operation successful');
            }

            // 5. Test DELETE
            log.push('\n📝 Testing DELETE operation...');
            const { error: deleteError } = await supabase
                .from('notifications')
                .delete()
                .eq('id', 'non-existent-id-for-testing');

            if (deleteError) {
                log.push(`❌ Delete error: ${deleteError.message}`);
            } else {
                log.push('✅ Delete operation successful');
            }

            log.push('\n✅ DIAGNOSTIC COMPLETE');

        } catch (error: any) {
            log.push(`\n❌ Diagnostic error: ${error.message}`);
        }

        setResults(log);
        setLoading(false);
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#f5f5f5' }}>
            <h2>Notification Sync Diagnostic</h2>
            <button 
                onClick={runDiagnostic} 
                disabled={loading}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: loading ? 'wait' : 'pointer',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px'
                }}
            >
                {loading ? 'Running...' : 'Run Diagnostic'}
            </button>

            {results && (
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    maxHeight: '500px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word'
                }}>
                    {results.map((line: string, idx: number) => (
                        <div key={idx}>{line}</div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationSyncDiagnostic;
