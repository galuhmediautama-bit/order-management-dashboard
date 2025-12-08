// Quick test to check if form slug exists
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://uuhcaojdhjaxvymzccxe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aGNhb2pkaGpheHZ5bXpjY3hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwfQ.rG_7kZdC7zcJYP6QY8R7ZQfj5E0rQi0r_kQnP0MnZkE'
);

async function testFormAccess() {
  console.log('Testing form access for slug: parfum-khalifah-oud');
  
  try {
    const { data, error } = await supabase
      .from('forms')
      .select('id, slug, title')
      .or('slug.eq.parfum-khalifah-oud,slug.ilike.parfum-khalifah-oud')
      .maybeSingle();

    if (error) {
      console.error('❌ Query error:', error);
      return;
    }

    if (data) {
      console.log('✅ Form found:', data);
    } else {
      console.log('❌ No form found with that slug');
      console.log('\n📋 Listing all forms with slug containing "khalifah" or "parfum":');
      const { data: allForms } = await supabase
        .from('forms')
        .select('id, slug, title')
        .or('slug.ilike.%khalifah%,slug.ilike.%parfum%');
      
      if (allForms && allForms.length > 0) {
        console.log('Found matching forms:', allForms);
      } else {
        console.log('No forms with similar slugs found');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testFormAccess();
