# Form Viewer Troubleshooting & Fix Guide

## Quick Diagnosis Checklist

### ✅ Phase 1: Verify Form Exists
1. **Login to admin dashboard**
   - Go to `https://cuanmax.digital/#/formulir` (or your admin domain)
   - Look for form with title "Parfum Khalifah Oud" or similar
   - **Check form slug**: Should be `parfum-khalifah-oud` or similar

2. **If form doesn't exist**:
   - Create new form with slug: `parfum-khalifah-oud`
   - Ensure form is marked as `Active`
   - Click "Preview" to test

3. **If form exists but not showing**:
   - Check form `active` status = true
   - Check form `visibility` settings
   - Verify form data is saved correctly

### ✅ Phase 2: Test Form URL
1. **Open browser dev tools** (F12)
2. **Go to Console tab**
3. **Access form URL**: `https://form.cuanmax.digital/#/f/parfum-khalifah-oud`
4. **Look for console messages**:
   ```
   [FormViewerWrapper] Rendering with identifier: parfum-khalifah-oud
   [FormViewerPage] Mounted with identifier: parfum-khalifah-oud
   [FormViewerPage] Starting fetch with identifier: parfum-khalifah-oud
   ```

### ✅ Phase 3: Interpret Console Output

**If you see ✅ "Form found" messages**:
- Form loaded successfully
- If not displaying, check browser rendering or JavaScript errors

**If you see ❌ "No form found" messages**:
- Form slug doesn't exist in database
- **Solution**: Create form with correct slug or update slug in database

**If you see "Catch-all matched form-like URL"**:
- Route matching issue detected
- **Solution**: May need to investigate React Router configuration

**If you see no logs at all**:
- FormViewerWrapper didn't render
- **Possible causes**:
  - Route not matched
  - Browser caching old version
  - **Solution**: Hard refresh (Ctrl+Shift+R) or clear cache

### ✅ Phase 4: Domain/DNS Check

Check if both domains point to same app:
1. Admin domain: `https://cuanmax.digital`
2. Form domain: `https://form.cuanmax.digital`

**Both should load same React app** (with different routing)

If `form.cuanmax.digital` redirects to different app:
- Check DNS configuration
- Check web server routing rules
- Verify both domains point to same deployment

## Common Issues & Solutions

### Issue: "Form not found" (404 page shows)
**Root Cause**: Form slug doesn't exist in database
**Solution**:
1. Create form in admin with slug `parfum-khalifah-oud`
2. Or update existing form slug
3. Test with preview button first

### Issue: Blank page or no content
**Root Cause**: Form loaded but not rendering
**Solution**:
1. Check browser console for JavaScript errors
2. Check form data completeness in database
3. Try different form to isolate issue

### Issue: Redirected to login page
**Root Cause**: Rare - shouldn't happen for public forms
**Solution**:
1. Check RLS policies are correct
2. Verify form has no auth requirements
3. Check browser console for errors

### Issue: Stuck on loading spinner
**Root Cause**: Form fetch is hanging
**Solution**:
1. Check database connection
2. Check Supabase status
3. Check browser network tab for failed requests

## Advanced Debugging

### Check Supabase RLS Policy
```sql
-- Run in Supabase SQL editor
SELECT * FROM postgres_policies 
WHERE tablename = 'forms' 
AND policyname LIKE '%public%';
```

Should show: `"Public can view forms" ON forms FOR SELECT USING (true)`

### Query Forms Table Directly
```sql
-- Check if form slug exists
SELECT id, slug, title, active 
FROM forms 
WHERE slug = 'parfum-khalifah-oud'
LIMIT 1;
```

### Test with Form UUID instead of Slug
If slug doesn't work, try accessing with UUID:
- `https://form.cuanmax.digital/#/f/{form-uuid}`
- FormViewerPage supports both slug and UUID lookup

## Testing Checklist

- [ ] Form exists in admin panel
- [ ] Form slug is correct: `parfum-khalifah-oud`
- [ ] Form is marked as active
- [ ] Admin domain and form domain both work
- [ ] Browser console shows no errors
- [ ] Console logs show `✅ Form found` message
- [ ] Form displays without JavaScript errors
- [ ] Form can be submitted successfully

## Deployment Notes

If issue occurs after deployment:
1. **Clear browser cache** (Ctrl+Shift+R)
2. **Wait 5-10 minutes** for CDN to invalidate old version
3. **Check deployment logs** for errors
4. **Verify database migrations** were applied
5. **Test in incognito/private mode** to avoid cache

## Contact Support

If issue persists:
1. Share **full console output** (screenshot or text)
2. Share **form slug/UUID**
3. Specify **which domain** is affected
4. Specify **which form titles** are affected
5. Include **timestamp** of issue occurring

---

**Last Updated**: December 8, 2025
**Debug Version**: With enhanced logging for form routing
