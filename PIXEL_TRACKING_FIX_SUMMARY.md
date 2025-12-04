# Pixel Tracking Event Fix - Implementation Summary

## 🎯 Objective
Memastikan event tracking yang user pilih di FormEditorPage **benar-benar digunakan** saat form dirender di FormViewerPage.

## ✅ Status: COMPLETED

## 📋 What Was Fixed

### Before (❌ Problem)
User bisa pilih event di FormEditorPage:
```
Form Page: Meta Pixel → Event: [AddToCart, ViewContent, Lead, ...]  ← Can select
Thank You: Meta Pixel → Event: [Purchase, Lead, ViewContent, ...]    ← Can select
```

Tapi saat form di-render (FormViewerPage), selalu menggunakan hardcoded:
```typescript
// Form page: ALWAYS ViewContent
<MetaPixelScript eventName="ViewContent" />

// Thank you: ALWAYS Purchase
<MetaPixelScript eventName="Purchase" />
```

### After (✅ Fixed)
Event selection dari FormEditorPage **benar-benar digunakan**:

```typescript
// Extract from form.trackingSettings
const eventName = form.trackingSettings?.formPage?.meta?.eventName || 'ViewContent';

// Pass ke MetaPixelScript
<MetaPixelScript eventName={eventName} />
```

## 🔧 Technical Changes

### File Modified: `pages/FormViewerPage.tsx`

**1. Added State Management**
```typescript
const [eventNames, setEventNames] = useState<{ 
    formPage: string; 
    thankYouPage: string 
}>({
    formPage: 'ViewContent',
    thankYouPage: 'Purchase'
});

const [pixelsByPlatform, setPixelsByPlatform] = useState<
    Record<string, { ids: string[]; eventName: string }>
>({...});
```

**2. Updated Tracking Calculator**
- Extract event dari `form.trackingSettings[pageType][platform].eventName`
- Build platform-specific tracking config
- Fallback to global settings if no form-specific config
- Update state dengan extracted event names

**3. Updated MetaPixelScript Calls**
```typescript
// Before
<MetaPixelScript eventName="Purchase" />

// After
<MetaPixelScript eventName={eventNames.thankYouPage} />
```

## 📊 Event Selection Mapping

### Available Events (Per Platform)
```
Meta/Google: PageView, ViewContent, AddToCart, InitiateCheckout, 
             AddPaymentInfo, Purchase, Lead, CompleteRegistration

TikTok: Similar to Meta (mapping applied)
Snack: Similar to Meta (mapping applied)
```

### Default Events (If Not Selected)
```
Form Page → ViewContent
Thank You → Purchase
```

## 🧪 How to Test

### Test Case 1: Verify Event Selection Works
1. Go to: `http://localhost:5173/#/form-editor/al-quran-al-mushawir`
2. Scroll to "Pelacakan & Pixel" section
3. Note the selected event for "Halaman Formulir" → Meta Pixel (e.g., "ViewContent")
4. Note the selected event for "Halaman Terima Kasih" → Meta Pixel (e.g., "Purchase")

### Test Case 2: Verify Form Page Event
1. Go to: `http://localhost:5173/#/f/al-quran-al-mushawir`
2. Open DevTools → Console
3. Look for logs: `[FormViewer] meta - IDs: [...], Event: ViewContent`
4. Also: `[Meta Pixel] Tracking ViewContent: ...`

### Test Case 3: Verify Thank You Page Event
1. Fill out and submit the form
2. On thank you page, check console for: `[Meta Pixel] Tracking Purchase: ...`
3. Verify order data is included in the tracking call

### Test Case 4: Change Event & Verify
1. Go back to FormEditorPage
2. Change Meta Pixel event to "AddToCart" for form page
3. Change Meta Pixel event to "Lead" for thank you page
4. Save form
5. Reload form viewer
6. Console should show:
   - Form page: `[Meta Pixel] Tracking AddToCart`
   - Thank you: `[Meta Pixel] Tracking Lead`

## 🔄 Backward Compatibility

✅ All existing forms work unchanged:
- Default fallback to old behavior (ViewContent/Purchase)
- Global pixel settings used as fallback
- No breaking changes to data model

## 📦 Files Changed
```
pages/FormViewerPage.tsx     (Modified - core fix)
PIXEL_TRACKING_EVENT_FIX.md  (New - detailed documentation)
```

## 🚀 Build Status
```
✓ npm run build - SUCCESS
✓ TypeScript compilation - NO ERRORS
✓ Production bundle created
```

## 📝 Git Commit
```
commit cf99973
Author: [Your Name]

fix: use selected pixel tracking events from form settings

- Extract eventName dari form.trackingSettings untuk setiap platform
- Pass event names secara dinamis ke MetaPixelScript saat render
- Support form page dan thank you page dengan event selection berbeda
- Fallback ke default events jika tidak ada selection
```

## 🎬 Next Steps (Optional)

### 1. Add Support for Multiple Platforms
Currently tracks Meta Pixel events correctly. Future enhancement:
- Extend to Google Analytics (gtag)
- Extend to TikTok Pixel (ttq)
- Extend to Snack Video

**Current Code Ready For**: Multi-platform support via `pixelsByPlatform` state

### 2. Add Event Parameter Validation
Validate that selected event is valid for the platform:
```typescript
const validMetaEvents = ['PageView', 'ViewContent', 'AddToCart', ...];
if (!validMetaEvents.includes(eventName)) {
    eventName = 'ViewContent'; // fallback
}
```

### 3. Add Analytics Dashboard
Track which events are being triggered most often:
- View pixel firing logs per form
- Event frequency analytics
- Platform breakdown

## 💡 Key Insights

1. **Event Selection UI** (FormEditorPage): ✅ Already complete
2. **Event Execution** (FormViewerPage): ✅ Now fixed
3. **Pixel Data Tracking**: ✅ Working (value, content_name, order_id)
4. **Platform-Specific Mapping**: Ready for future enhancement

## 📞 Support

For questions:
1. Check `PIXEL_TRACKING_EVENT_FIX.md` for technical details
2. Look at `PRODUCT_TRACKING_COMPLETE_SUMMARY.md` for product tracking context
3. Review FormEditorPage.tsx around line 2190-2250 for UI implementation

---

**Version**: 1.0  
**Status**: Production Ready ✅  
**Date**: December 4, 2025
