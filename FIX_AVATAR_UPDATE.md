# Fix: Avatar Tidak Update Setelah Edit Profil

## Masalah
Setelah user mengupdate foto profil di halaman Pengaturan Akun, avatar di header masih menampilkan foto default/lama.

## Penyebab
1. **Header hanya membaca dari auth metadata cache** - Avatar diambil dari `user.user_metadata?.avatar_url` yang tidak ter-refresh setelah update
2. **Tidak ada refresh auth session** - Setelah update profil, auth session tidak di-refresh untuk mendapat data terbaru
3. **Browser cache** - Browser meng-cache gambar avatar lama dengan URL yang sama

## Solusi Implementasi

### 1. Fetch Avatar dari Database (Header.tsx)
**File**: `components/Header.tsx`

Tambahkan state dan useEffect untuk fetch avatar dari tabel `users`:
```typescript
const [userAvatar, setUserAvatar] = useState<string | undefined>(user.user_metadata?.avatar_url);

useEffect(() => {
  const fetchUserAvatar = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('avatar')
        .eq('id', user.id)
        .single();
      
      if (data && data.avatar) {
        setUserAvatar(data.avatar);
      } else {
        setUserAvatar(user.user_metadata?.avatar_url);
      }
    } catch (error) {
      console.error('Error fetching user avatar:', error);
      setUserAvatar(user.user_metadata?.avatar_url);
    }
  };
  
  fetchUserAvatar();
}, [user.id, user.user_metadata?.avatar_url]);
```

**Benefit**: Header selalu membaca avatar terbaru dari database, bukan dari cache auth metadata.

### 2. Refresh Auth Session & Reload (ProfilePage.tsx)
**File**: `pages/ProfilePage.tsx`

Setelah update profil berhasil, refresh session dan reload halaman:
```typescript
// Update Auth Metadata
const { error: authError } = await supabase.auth.updateUser({ data: authUpdateData });
if (authError) throw authError;

// Refresh auth session untuk update avatar di header
await supabase.auth.refreshSession();

setUserData(prev => ({ ...prev!, ...dbUpdateData } as User));
if (avatarChanged) {
    setAvatarFile(null);
    if (newAvatarUrl) setAvatarPreview(newAvatarUrl);
}

setProfileMessage({ 
    type: 'success', 
    text: 'Profil berhasil diperbarui. Avatar akan muncul setelah halaman dimuat ulang.' 
});

// Reload halaman setelah 1.5 detik
setTimeout(() => {
    window.location.reload();
}, 1500);
```

**Benefit**: 
- Auth session ter-update dengan metadata baru
- Reload halaman memastikan semua komponen mendapat data terbaru
- User melihat pesan sukses sebelum reload

### 3. Cache Buster dengan Timestamp (Header.tsx & ProfilePage.tsx)
**File**: `components/Header.tsx` & `pages/ProfilePage.tsx`

Tambahkan query parameter timestamp untuk mencegah browser cache:
```typescript
// Di Header.tsx - Avatar button
<img 
  src={userAvatar ? `${userAvatar}?t=${Date.now()}` : `https://i.pravatar.cc/150?u=${user.id}`} 
  alt="User Avatar" 
/>

// Di Header.tsx - Dropdown menu
<img 
  src={userAvatar ? `${userAvatar}?t=${Date.now()}` : `https://i.pravatar.cc/150?u=${user.id}`} 
  alt="User Avatar" 
/>

// Di ProfilePage.tsx - Avatar preview
<img 
  src={avatarPreview ? `${avatarPreview}${avatarPreview.startsWith('data:') ? '' : `?t=${Date.now()}`}` : `https://i.pravatar.cc/150?u=${user.id}`} 
  alt="Avatar" 
/>
```

**Benefit**: Browser selalu load gambar terbaru, tidak menggunakan cache lama.

**Note**: Skip timestamp untuk base64 data URLs (preview sebelum upload).

## Flow Update Avatar

### Before Fix ❌
1. User upload foto → Simpan ke DB + Auth metadata
2. Header masih baca dari auth metadata cache lama
3. Browser serve avatar dari cache
4. **Result**: Avatar tidak berubah

### After Fix ✅
1. User upload foto → Simpan ke DB + Auth metadata
2. Refresh auth session
3. Header fetch avatar dari database (tabel `users`)
4. Timestamp cache buster paksa browser load gambar baru
5. Reload halaman untuk refresh semua state
6. **Result**: Avatar langsung update ✅

## Testing Checklist

- [x] Upload foto profil baru
- [x] Verify tersimpan di database `users.avatar`
- [x] Verify tersimpan di auth metadata `avatar_url`
- [x] Avatar di header update setelah reload
- [x] Avatar di dropdown menu update
- [x] Preview avatar di halaman profil update
- [x] Tidak ada error di console
- [x] Works dengan Supabase Storage URLs
- [x] Works dengan Base64 fallback URLs

## Files Modified

1. **components/Header.tsx**
   - Added state `userAvatar` 
   - Added `useEffect` to fetch from database
   - Added timestamp cache buster to all avatar images

2. **pages/ProfilePage.tsx**
   - Added `supabase.auth.refreshSession()` after update
   - Added `window.location.reload()` after success message
   - Added timestamp cache buster to avatar preview
   - Updated success message

## Notes

- **Auto-reload diperlukan** karena auth session perlu di-refresh di root App component
- **Timestamp cache buster** memastikan browser tidak cache gambar lama
- **Fallback ke pravatar.cc** jika avatar tidak tersedia (consistent UX)
- **Base64 preview** untuk preview sebelum upload tidak perlu cache buster

## Deployment

Setelah deploy, pastikan:
1. Supabase Storage bucket `images` sudah public
2. RLS policies allows authenticated users upload/read
3. Test upload foto dari production environment

---
**Status**: ✅ Fixed and Tested
**Date**: December 5, 2025
