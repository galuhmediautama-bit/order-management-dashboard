# Meta Pixel Tracking - Debug Guide

## Masalah yang Diperbaiki

### 1. **Pixel tidak terbaca/track**
**Root Cause:** Pixel ID kosong atau fbq tidak siap saat component mount

**Solusi:**
- Tambahkan delay 300ms sebelum menjalankan fbq untuk memastikan fbq sudah loaded
- Tracking PageView terlebih dahulu sebelum event lain
- Prevent duplicate initialization dengan tracking set

### 2. **MetaPixelScript tidak menginisialisasi dengan benar**
**Perbaikan:**
- Tambahkan try-catch dengan error handling yang lebih baik
- Implemented pixel initialization tracking untuk mencegah double init
- Added comprehensive console logging untuk debugging

### 3. **Struktur Tracking Settings**
**Global Tracking Settings** (dari `SettingsContext`):
```typescript
{
  meta: { 
    pixels: GlobalPixel[], // [{id, name}, ...]
    active: boolean 
  },
  google: {...},
  tiktok: {...},
  snack: {...}
}
```

**Form Tracking Settings** (per form):
```typescript
{
  formPage: {
    meta: {
      pixelIds: string[],
      eventName: 'ViewContent' | 'Purchase' | ...
    },
    ...
  },
  thankYouPage: {...}
}
```

## Debugging Checklist

### Step 1: Periksa index.html
```html
<!-- Meta Pixel Code Stub harus ada dan benar -->
<script>
  !function(f,b,e,v,n,t,s){...}
  (window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
</script>
```
✓ Sudah ada di index.html

### Step 2: Periksa Global Settings
Buka browser DevTools → Console dan jalankan:
```javascript
// Check if global tracking settings loaded
console.log('Global Settings:', window.__GLOBAL_TRACKING_SETTINGS__);

// Atau lihat dari SettingsContext (jika exposed)
// Check database: SELECT * FROM settings WHERE id = 'trackingPixels';
```

### Step 3: Periksa Form Tracking Settings
```javascript
// Console di halaman form
console.log('Active Pixel IDs:', window.__ACTIVE_PIXEL_IDS__);

// Atau lihat di Network tab → fbevents.js calls
```

### Step 4: Cek fbq di Console
```javascript
// Di browser console halaman form viewer
console.log('fbq:', window.fbq);
console.log('fbq type:', typeof window.fbq);

// Jika ada, coba manual tracking
window.fbq('track', 'PageView');
window.fbq('track', 'ViewContent', {content_name: 'Test'});
```

## Console Log Output yang Diharapkan

### Saat form memuat (formPage):
```
[FormViewer] Form loaded
[FormViewer] Calculating pixels for page: formPage
[FormViewer] Form tracking settings: {...}
[FormViewer] Specific pixel IDs from form: ['XXXX', 'YYYY']
[FormViewer] Final IDs: XXXX, YYYY | Page: formPage
[Meta Pixel] fbq function ditemukan, initializing pixels: ['XXXX', 'YYYY']
[Meta Pixel] Pixel XXXX initialized
[Meta Pixel] Tracking PageView
[Meta Pixel] Tracking ViewContent: {...}
```

### Saat submit (thankYouPage):
```
[FormViewer] Calculating pixels for page: thankYouPage
[FormViewer] Final IDs: XXXX, YYYY | Page: thankYouPage
[Meta Pixel] Pixel XXXX initialized (skip if already init)
[Meta Pixel] Tracking PageView
[Meta Pixel] Tracking Purchase: {value, order_id, content_type}
```

## Common Issues & Solutions

### ❌ "window.fbq not found"
**Cause:** Meta Pixel base code tidak di index.html
**Solution:** Pastikan script tag di index.html sudah benar dan loaded

### ❌ "Active Pixel IDs: NONE"
**Cause:** 
- Global settings tidak ada di database
- Form tracking settings kosong
- Global tracking inactive

**Solution:**
1. Check database: `SELECT * FROM settings WHERE id = 'trackingPixels'`
2. Jika kosong, buat di settings halaman
3. Pastikan `active: true` untuk meta
4. Pastikan pixel IDs tidak kosong

### ❌ "Pixel tidak tertrack di Facebook"
**Cause:** Multiple possibilities
**Solution Checklist:**
1. ✓ Pixel ID benar dan aktif di Facebook Business Manager
2. ✓ Domain sudah dikonfigurasi di Settings → Domains
3. ✓ Browser sudah allow cookies & tidak ada ad blocker
4. ✓ Delay cukup untuk fbq load (300ms)
5. ✓ Cek di Facebook Pixel Helper extension

## Testing

### Manual Test:
```javascript
// Di console halaman form viewer
window.fbq('track', 'ViewContent', {
  content_name: 'Test Product',
  currency: 'IDR',
  value: 100000
});

// Di halaman thank you
window.fbq('track', 'Purchase', {
  content_name: 'Test Product',
  currency: 'IDR',
  value: 100000,
  order_id: 'test-123'
});
```

Cek di Facebook Pixel → Diagnostics → Recent Activity

### Automated Test (React DevTools):
1. Install React DevTools extension
2. Inspect `<MetaPixelScript>` component
3. Check props: `pixelIds`, `eventName`
4. Verify useEffect triggers dengan dependency changes

## Files Modified

1. **MetaPixelScript.tsx**
   - Added better error handling
   - Prevent double initialization
   - Added 300ms delay for fbq ready
   - Comprehensive console logging

2. **MetaPixel.tsx**
   - Created new generic pixel tracking component
   - Can be used for simple PageView tracking

3. **FormViewerPage.tsx**
   - Enhanced tracking settings calculation with detailed logging
   - Better fallback logic for global vs form-specific pixels

## Next Steps (Optional Improvements)

1. Add pixel validation in Settings page
2. Add real-time test button in Settings
3. Implement error boundary for pixel tracking
4. Add analytics dashboard for pixel performance
5. Cache global settings in localStorage for faster load
