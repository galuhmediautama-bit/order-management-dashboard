import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ggxyaautsdukyapstlgr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdneHlhYXV0c2R1a3lhcHN0bGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODQxNDksImV4cCI6MjA4MDE2MDE0OX0.oVMzNX8x6VEoRtYrSYszZXy_08-QdxAs22xC6NdIR-4'
);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  try {
    // Test: Check users column names
    console.log('Test: Discover users column names\n');
    
    const { data: sampleUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (userError) {
      console.error('❌ Users error:', JSON.stringify(userError, null, 2));
    } else if (sampleUser && sampleUser.length > 0) {
      console.log('✅ Users columns:', Object.keys(sampleUser[0]));
    } else {
      console.log('⚠️ No users found in table');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testConnection();
