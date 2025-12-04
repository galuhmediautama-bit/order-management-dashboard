// Paste ini di Browser Console (F12 → Console)
// Ini akan jalankan SQL langsung via API

const projectId = "ggxyaautsdukyapstlgr";
const query = `DELETE FROM public.users; INSERT INTO public.users (id, email, name, role, status, created_at, updated_at) SELECT au.id, au.email, SPLIT_PART(au.email, '@', 1), CASE WHEN au.email = 'galuhmediautama@gmail.com' THEN 'Super Admin' ELSE 'Advertiser' END, 'Aktif', au.created_at, NOW() FROM auth.users au;`;

fetch(`https://${projectId}.supabase.co/rest/v1/rpc/sql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('supabase.auth.token'),
  },
  body: JSON.stringify({ query: query })
})
.then(r => r.json())
.then(d => console.log('✅ SYNC SUCCESS:', d))
.catch(e => console.error('❌ SYNC ERROR:', e));
