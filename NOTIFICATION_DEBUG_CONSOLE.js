/**
 * NOTIFICATION SYNC DIAGNOSTIC SCRIPT
 * 
 * TUJUAN: Test end-to-end notification flow
 * Jalankan di browser Console saat aplikasi running
 * 
 * LANGKAH DEBUGGING:
 * 1. Buka aplikasi: http://localhost:3000
 * 2. Buka DevTools Console (F12)
 * 3. Copy-paste kode di bawah dan jalankan
 * 4. Check output dan screenshot/share hasilnya
 */

// ============================================================================
// TEST 1: Check if Supabase client is connected
// ============================================================================
console.log('=== TEST 1: Supabase Connection ===');
window.testSupabase = async () => {
    try {
        // Cari supabase client dari window atau coba import
        if (typeof window !== 'undefined' && (window as any).supabase) {
            console.log('✓ Supabase client ditemukan di window.supabase');
        } else {
            console.log('⚠ Supabase client tidak ditemukan di window');
        }
        console.log('Check URL di firebase.ts - pastikan URL dan API key benar');
    } catch (err) {
        console.error('✗ Error:', err);
    }
};
testSupabase();

// ============================================================================
// TEST 2: Check if Realtime Subscriptions are active
// ============================================================================
console.log('\n=== TEST 2: Realtime Subscriptions ===');
window.checkRealtimeStatus = async () => {
    try {
        console.log('Buka DevTools Network tab -> WebSocket');
        console.log('Cari koneksi WebSocket ke Supabase realtime server');
        console.log('Seharusnya ada koneksi yang CONNECTED (bukan CLOSED)');
    } catch (err) {
        console.error('Error:', err);
    }
};
checkRealtimeStatus();

// ============================================================================
// TEST 3: Query Notifications Directly
// ============================================================================
console.log('\n=== TEST 3: Query Notifications ===');
window.queryNotifications = async () => {
    try {
        const response = await fetch(
            'http://localhost:3000/api/notifications',
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            }
        );
        console.log('API Response status:', response.status);
    } catch (err) {
        console.log('Note: API endpoint tidak ada, itu OK - cek localStorage/state');
        
        // Alternative: Check component state
        try {
            const headerComponent = document.querySelector('[data-testid="header"]');
            if (headerComponent) {
                console.log('Header component ditemukan');
            }
            console.log('Cek React DevTools untuk melihat state di Header component');
        } catch (e) {
            console.log('Tidak bisa akses component state');
        }
    }
};
queryNotifications();

// ============================================================================
// TEST 4: Manual Check - Count Notifications
// ============================================================================
console.log('\n=== TEST 4: Count from UI ===');
window.countNotifications = () => {
    try {
        const bellBadge = document.querySelector('[data-testid="notification-badge"]');
        const notificationDropdown = document.querySelector('[data-testid="notifications-dropdown"]');
        
        const bellCount = bellBadge ? bellBadge.textContent : 'Not found';
        const dropdownCount = notificationDropdown ? notificationDropdown.children.length : 'Not found';
        
        console.log('Notifications di bell badge:', bellCount);
        console.log('Notifications di dropdown:', dropdownCount);
        
        // Manual count
        const notificationItems = document.querySelectorAll('.notification-item');
        console.log('Manual count dari DOM:', notificationItems.length);
    } catch (err) {
        console.error('Error counting notifications:', err);
    }
};
countNotifications();

// ============================================================================
// TEST 5: Check LocalStorage/Session Storage
// ============================================================================
console.log('\n=== TEST 5: Storage Check ===');
window.checkStorage = () => {
    console.log('LocalStorage keys:', Object.keys(localStorage));
    console.log('SessionStorage keys:', Object.keys(sessionStorage));
    
    // Check for cached notifications
    const keys = [...Object.keys(localStorage), ...Object.keys(sessionStorage)];
    const notifKeys = keys.filter(k => k.includes('notif') || k.includes('notification'));
    console.log('Notification-related keys:', notifKeys);
    
    notifKeys.forEach(key => {
        try {
            const val = localStorage.getItem(key) || sessionStorage.getItem(key);
            console.log(`${key}:`, val?.substring(0, 100));
        } catch (e) {}
    });
};
checkStorage();

// ============================================================================
// TEST 6: Console Output Summary
// ============================================================================
console.log('\n=== SUMMARY ===');
console.log('Jika Anda melihat:');
console.log('✓ Supabase client terconnect');
console.log('✓ WebSocket CONNECTED');
console.log('✓ Notifications count sama di bell, dropdown, dan halaman');
console.log('MAKA: Database sync sudah OK');
console.log('');
console.log('Jika tidak, cek:');
console.log('1. Firebase.ts credentials - pastikan URL dan API key benar');
console.log('2. Supabase project settings - enable realtime');
console.log('3. Browser console errors - jalankan browser DevTools');
console.log('4. Network tab - cek WebSocket koneksi ke Supabase');
console.log('');
console.log('IMPORTANT: Share screenshot dari sini untuk debugging lebih lanjut!');
