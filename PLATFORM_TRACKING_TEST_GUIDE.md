# Platform Tracking Feature - Quick Test Guide

## Quick Test (5 minutes)

### Setup
1. Start dev server: `npm run dev`
2. Navigate to Form Editor: `/form-editor`
3. Open existing form or create new one

### Test 1: Platform Selector UI
**Location**: FormEditor → Find "Platform Tracking Terpilih" card

✓ **Test**: Click each platform button (All, Meta, TikTok, Google, Snack)
- Buttons should highlight in blue when selected
- Selected button should show indigo background
- Form should save platform selection

**Expected**: Visual feedback on all 5 buttons working

### Test 2: Platform Persistence
**Steps**:
1. Select "Meta Pixel" in FormEditor
2. Set some settings
3. Save form
4. Reload page
5. Open form again

✓ **Test**: "Meta Pixel" should still be selected (persisted)

**Expected**: Platform selection is saved

### Test 3: URL Parameter Override
**Test Form URL**: Use any form with assigned platform

1. Open form without parameter:
   ```
   http://localhost:3000/#/f/form-slug
   ```
2. Check browser console for active platform
   
3. Now add platform parameter:
   ```
   http://localhost:3000/#/f/form-slug?platform=tiktok
   ```
4. Check browser console - should show "tiktok" as active platform

**Expected**: Platform changes based on URL parameter

### Test 4: Console Logging
**Steps**:
1. Open form with assigned platform
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for FormViewer logs

**Expected Output Should Show**:
```
[FormViewer] Platform parameter detected: meta
[FormViewer] Calculating pixels for page: formPage
[FormViewer] meta - IDs: 1234567890, Event: ViewContent
[FormViewer] Skipping tiktok pixel (active platform: meta)
[FormViewer] Skipping google pixel (active platform: meta)
[FormViewer] Skipping snack pixel (active platform: meta)
```

### Test 5: Pixel Rendering
**Steps**:
1. Set form.assignedPlatform to "meta"
2. Configure Meta Pixel ID (e.g., 123456)
3. Leave other platforms empty (0 IDs)
4. Open form in viewer
5. Inspect Network tab in DevTools

**Expected**: Only Meta pixel JS loads (check Network tab for meta.js)

### Test 6: "Semua Platform" (All Platforms)
**Steps**:
1. Click "Semua Platform" button
2. Set pixel IDs for all 4 platforms
3. Save
4. Open form

**Expected**: All 4 pixels load (default behavior when no platform specified)

### Test 7: URL Override Priority
**Steps**:
1. Set form.assignedPlatform = "meta"
2. Open form with: `?platform=google`
3. Check console

**Expected**: Active platform shows "google" (URL param overrides form setting)

---

## Advanced Test (10 minutes)

### Test A: Performance Comparison

**Single Platform (Smart Loading)**:
1. Set form to "Meta Pixel" only
2. Open DevTools → Network tab → Filter: XHR
3. Reload form
4. Check total JS size loaded

**Expected**: ~20-25KB of pixel-related JS

**All Platforms (No Filtering)**:
1. Set form to "Semua Platform"
2. Configure all 4 pixels
3. Repeat DevTools check

**Expected**: ~70KB of pixel-related JS

**Comparison**: Single should be ~70% smaller

### Test B: Multiple Forms with Different Platforms
1. Create Form 1: assignedPlatform = "meta"
2. Create Form 2: assignedPlatform = "tiktok"
3. Create Form 3: assignedPlatform = "google"
4. Open each form in new tabs

**Expected**: Each form only loads its assigned pixel

### Test C: Form Submission Tracking
1. Set form with Meta Pixel
2. Fill and submit form
3. Check Meta Events Manager (if you have Meta pixel access)

**Expected**: Events should show up in Meta Events Manager

---

## Edge Cases

### Edge Case 1: No Platform Selected ("Semua Platform")
- Form should load all 4 pixels
- No URL parameter: all pixels active
- URL parameter ?platform=meta: only Meta active

### Edge Case 2: Invalid Platform Parameter
- Form URL: `?platform=invalid`
- Should ignore invalid param
- Falls back to form.assignedPlatform

### Edge Case 3: Empty Pixel IDs
- Platform set but pixel IDs empty (0)
- Pixel should not load even if selected
- Check: `if (settings?.pixelIds.length > 0)`

### Edge Case 4: Reload with Different Platform
- Open form with ?platform=meta
- Change URL to ?platform=tiktok
- Form should reload and switch platforms
- Should not require full page refresh

---

## Browser Console Check

When testing, look for these logs:

```javascript
// Good - Platform detected
[FormViewer] Platform parameter detected: meta

// Good - Pixel loading
[FormViewer] meta - IDs: 1234567890, Event: ViewContent

// Good - Correct skipping
[FormViewer] Skipping tiktok pixel (active platform: meta)

// Check this - Active platform determination
[FormViewer] Calculating pixels for page: formPage
```

If you see errors like "Cannot read property 'pixelIds'", check that form data is loaded.

---

## Rollback Plan (If Issues)

If anything breaks:

```bash
# Revert to previous commit
git revert d27a4f6  # Platform UI commit
# or
git revert 2981ee7  # Smart filtering commit
```

---

## Success Criteria

✅ All tests pass = Feature is working correctly
✅ No console errors = Clean implementation
✅ Performance improvement visible = 70% reduction achieved
✅ All platforms can be selected = Full functionality working

---

**Test Time**: 15 minutes total
**Difficulty**: Easy (just clicks and observations)
**Risk Level**: Very Low (new feature, doesn't break existing functionality)
