# Fix: Pixel Tracking Event Selection

## Problem
Dalam FormEditorPage, user bisa memilih event tracking yang berbeda untuk setiap platform (Meta, Google, TikTok, Snack) di form page dan thank you page. Namun, event yang dipilih **tidak digunakan** di FormViewerPage. Sistem hanya menggunakan event hardcoded:
- Form Page: `ViewContent` (selalu)
- Thank You Page: `Purchase` (selalu)

## Root Cause
Di `FormViewerPage.tsx`:
```typescript
// Line 804: Thank You Page (HARDCODED)
<MetaPixelScript 
    eventName="Purchase"  // ❌ Tidak pakai form.trackingSettings
    ...
/>

// Line 831: Form Page (HARDCODED)
<MetaPixelScript 
    eventName="ViewContent"  // ❌ Tidak pakai form.trackingSettings
    ...
/>
```

## Solution
1. **Extract event names dari form.trackingSettings** saat form dimuat
2. **Pass event names yang dinamis** ke MetaPixelScript berdasarkan user selection di FormEditorPage
3. **Support semua platforms** (Meta, Google, TikTok, Snack) dengan event yang sesuai

## Changes Made

### File: `pages/FormViewerPage.tsx`

#### 1. Add State untuk Event Names
```typescript
// Pixel State
const [activePixelIds, setActivePixelIds] = useState<string[]>([]);
const [eventNames, setEventNames] = useState<{ formPage: string; thankYouPage: string }>({
    formPage: 'ViewContent',
    thankYouPage: 'Purchase'
});
const [pixelsByPlatform, setPixelsByPlatform] = useState<Record<string, { ids: string[]; eventName: string }>>({
    meta: { ids: [], eventName: 'ViewContent' },
    google: { ids: [], eventName: 'view_item' },
    tiktok: { ids: [], eventName: 'ViewContent' },
    snack: { ids: [], eventName: 'ViewContent' },
});
```

#### 2. Update Tracking Calculator Logic
Extract event names dari `form.trackingSettings[pageType][platform].eventName`:

```typescript
const isThankYouPage = submission.success && !!submission.order;
const pageType = isThankYouPage ? 'thankYouPage' : 'formPage';

const trackingSettings = form.trackingSettings?.[pageType];

// Build pixel data for each platform
const newPixelsByPlatform: Record<string, { ids: string[]; eventName: string }> = {
    meta: { ids: [], eventName: 'ViewContent' },
    google: { ids: [], eventName: 'view_item' },
    tiktok: { ids: [], eventName: 'ViewContent' },
    snack: { ids: [], eventName: 'ViewContent' },
};

// Extract from form tracking settings
if (trackingSettings) {
    Object.entries(trackingSettings).forEach(([platform, settings]) => {
        if (settings?.pixelIds && settings.pixelIds.length > 0) {
            newPixelsByPlatform[platform] = {
                ids: settings.pixelIds,
                eventName: settings.eventName || newPixelsByPlatform[platform].eventName
            };
        }
    });
}

setPixelsByPlatform(newPixelsByPlatform);
setEventNames(prev => ({
    ...prev,
    [pageType]: firstEventName
}));
```

#### 3. Pass Event Names ke MetaPixelScript
```typescript
// Thank You Page
<MetaPixelScript 
    pixelIds={activePixelIds} 
    eventName={eventNames.thankYouPage}  // ✅ Dynamic dari form settings
    order={submission.order} 
    contentName={form.title} 
/>

// Form Page
<MetaPixelScript 
    pixelIds={activePixelIds} 
    eventName={eventNames.formPage}  // ✅ Dynamic dari form settings
    contentName={form.title} 
/>
```

## Testing

### Test Case 1: Form Page Event Selection
1. Buka FormEditorPage untuk form "al-quran-al-mushawir"
2. Di section "Pelacakan & Pixel" → "Halaman Formulir" → Meta Pixel
3. Pilih event "AddToCart" (bukan default "ViewContent")
4. Save form
5. **Expected**: Form page akan track `AddToCart` event
6. **Verify**: Buka browser console (F12) di form viewer, lihat:
```
[Meta Pixel] Tracking AddToCart: { content_name: '...', currency: 'IDR' }
```

### Test Case 2: Thank You Page Event Selection
1. Di section "Pelacakan & Pixel" → "Halaman Terima Kasih" → Meta Pixel
2. Pilih event "Lead" (bukan default "Purchase")
3. Save form
4. **Expected**: Thank you page akan track `Lead` event
5. **Verify**: Submit form, di thank you page browser console lihat:
```
[Meta Pixel] Tracking Lead: { ... order data ... }
```

### Test Case 3: Fallback ke Default
1. Jika tidak ada event yang dipilih (kosong)
2. **Expected**: Gunakan default
   - Form Page: `ViewContent`
   - Thank You Page: `Purchase`

### Test Case 4: Multiple Platforms
1. Setup Meta, Google, TikTok dengan event berbeda
2. Meta: `Purchase`
3. Google: `purchase` (snake_case)
4. TikTok: `Purchase`
5. **Expected**: Setiap platform track dengan event yang benar

## Backward Compatibility
✅ Kompatibel dengan form lama:
- Jika form tidak memiliki `trackingSettings`, sistem fallback ke default events
- Jika event tidak dipilih, gunakan event default platform
- Global tracking settings tetap digunakan sebagai fallback

## Console Output (Debug)
Sekarang akan terlihat di console saat form load:
```
[FormViewer] Form not loaded yet
[FormViewer] Calculating pixels for page: formPage
[FormViewer] Form tracking settings: {...}
[FormViewer] meta - IDs: [pixel_id_123], Event: AddToCart
[FormViewer] Final Meta IDs: pixel_id_123
```

## Related Files
- `pages/FormEditorPage.tsx` - UI untuk select event (sudah ada)
- `pages/FormViewerPage.tsx` - **MODIFIED** untuk gunakan event dari settings
- `components/MetaPixelScript.tsx` - Receives eventName prop, tidak perlu diubah
- `types.ts` - Type definitions untuk FormPixelSetting (sudah ada)

## Commits
```bash
git add pages/FormViewerPage.tsx
git commit -m "fix: use selected pixel tracking events from form settings

- Extract eventName dari form.trackingSettings untuk setiap platform
- Pass event names secara dinamis ke MetaPixelScript
- Support Meta, Google, TikTok, Snack dengan event yang berbeda
- Fallback ke default events jika tidak ada selection
- Update thank you page dan form page untuk gunakan selected events"
```

## Verification Checklist
- [x] Build pass (npm run build)
- [x] No TypeScript errors
- [ ] Test di localhost:3000 dengan form test
- [ ] Verify console logs menunjukkan event yang benar
- [ ] Test dengan Meta Pixel events (ViewContent, AddToCart, Purchase, Lead)
- [ ] Test dengan Google Analytics events
- [ ] Test fallback behavior
