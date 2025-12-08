# Form URL Redirect Issue - Diagnostic Guide

## Problem
User accessing form URL `https://form.cuanmax.digital/#/f/parfum-khalifah-oud?utm_source=meta&...` gets redirected to dashboard instead of displaying the form.

## Debugging Steps for User

### Step 1: Check Browser Console
1. Open the form URL in browser
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Look for messages starting with `[FormViewerPage]` or `[FormViewerWrapper]`

**Expected logs:**
```
[AppContent] Hash changed: #/f/parfum-khalifah-oud?utm_source=meta&...
[FormViewerWrapper] Rendering with identifier: parfum-khalifah-oud
[FormViewerPage] Mounted with identifier: parfum-khalifah-oud
[FormViewerPage] Starting fetch with identifier: parfum-khalifah-oud
[FormViewerPage] Normalized identifier: parfum-khalifah-oud isUuid: false
[FormViewerPage] Querying forms with filters: slug.eq.parfum-khalifah-oud,slug.ilike.parfum-khalifah-oud
```

### Step 2: Check What Actually Renders

**If you see logs → Form attempted to load:**
- Check if you see: `[FormViewerPage] ✅ Form found:` → Form exists, loads successfully
- Check if you see: `[FormViewerPage] ❌ No form found with identifier:` → Form slug doesn't exist
- Check if you see: `[FormViewerPage] Error fetching form:` → Database connection error

**If you DON'T see any of above logs:**
- Route matching failed
- Check browser console for routing errors

### Step 3: Check Network Tab (Advanced)
1. Open Developer Tools → **Network** tab
2. Refresh page while form URL is accessed
3. Look for:
   - API calls to `supabase` for forms table query
   - Any unexpected redirects (HTTP 301/302 responses)
   - CORS errors

## Possible Root Causes

### 1. Form Slug Doesn't Exist
**Symptom:** See logs `❌ No form found with identifier: parfum-khalifah-oud`
**Solution:** 
- Create form with slug `parfum-khalifah-oud` or check correct slug in admin

### 2. Domain DNS/Redirect Issue
**Symptom:** URL changes before React app loads
**Solution:**
- Check domain DNS settings
- Ensure `form.cuanmax.digital` points to same app as admin

### 3. Form Slug Case Sensitivity
**Symptom:** Form exists but with different case (e.g., `Parfum-Khalifah-Oud`)
**Solution:**
- FormViewerPage searches case-insensitive with `.ilike.` operator
- Should work automatically

### 4. Form Hidden/Inactive
**Symptom:** Form exists but has `active: false` or similar flag
**Solution:**
- Check form status in admin Forms page

## Checklist

- [ ] Added debug logging to code
- [ ] User opens browser console (F12)
- [ ] User shares console output logs
- [ ] Verify form slug `parfum-khalifah-oud` exists in database
- [ ] Check form `active` status is true
- [ ] Test with different form slug if available
- [ ] Check domain DNS configuration

## Next Steps

1. **Temporarily**, ask user to share browser console screenshot
2. **Check database** if form slug "parfum-khalifah-oud" actually exists
3. **Create test form** with known slug to confirm form viewer works
4. **Check domain** if form.cuanmax.digital is correctly configured
