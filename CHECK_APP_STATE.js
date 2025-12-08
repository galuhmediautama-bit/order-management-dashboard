// ============================================
// ULTRA SIMPLE TEST - No network calls
// Just check app state
// ============================================

(function() {
  console.log('🔍 Checking app state (no network calls)\n');
  
  // Test 1: Check React state in window
  console.log('📊 React DevTools:');
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools installed');
  }
  
  // Test 2: Check localStorage
  console.log('\n💾 LocalStorage:');
  const auth = localStorage.getItem('sb-jnkbysrjfdwsznsrvwhz-auth-token');
  console.log('Auth token:', auth ? '✅ Found' : '❌ Not found');
  
  // Test 3: Check if Supabase imported
  console.log('\n🔗 Supabase:');
  console.log('window.supabaseClient:', window.supabaseClient ? '✅' : '❌');
  
  // Test 4: Check URL
  console.log('\n📍 Current URL:', window.location.href);
  console.log('Hash route:', window.location.hash);
  
  // Test 5: Check sidebar DOM
  console.log('\n🎨 DOM Check:');
  const sidebar = document.querySelector('aside');
  if (sidebar) {
    console.log('✅ Sidebar element found');
    
    // Count menu items
    const menuItems = sidebar.querySelectorAll('a[href*="#/"]');
    console.log(`📋 Menu items: ${menuItems.length}`);
    
    if (menuItems.length > 1) {
      console.log('✅ Multiple menu items visible');
      menuItems.forEach(item => {
        console.log('  -', item.textContent.trim());
      });
    } else {
      console.log('❌ Only 1 menu item (just Dashboard)');
    }
  } else {
    console.log('❌ Sidebar element not found');
  }
  
  // Test 6: Check dashboard data
  console.log('\n📈 Dashboard Data:');
  const dashboardStats = document.querySelectorAll('[class*="stat"], [class*="card"]');
  console.log(`Found ${dashboardStats.length} stat/card elements`);
  
  const emptyMsg = document.body.innerText.includes('Tidak ada data');
  console.log('Empty message visible:', emptyMsg ? '❌ Yes' : '✅ No');
  
  console.log('\n✨ Summary:');
  console.log('If you see "Multiple menu items visible" above → Sidebar is working ✅');
  console.log('If you see "Only 1 menu item" → Need to debug further ❌');
  
})();
