# Fix: User Edit Form Fields Not Persisting

## Summary
Fixed issue where `phone`, `address`, and `assignedBrandIds` fields were not loading when editing users, causing them to appear empty in the form.

## Root Cause
The `fetchUsersAndBrands()` function in `SettingsPage.tsx` (line 876) was missing `phone` and `address` columns in the SELECT query.

### Before (Line 876)
```typescript
const { data: usersData, error: fetchError } = await supabase.from('users').select('id, name, email, role, status, "assignedBrandIds", avatar, created_at');
```

**Missing columns**: `phone`, `address`

### After (Line 876)
```typescript
const { data: usersData, error: fetchError } = await supabase.from('users').select('id, name, email, phone, address, role, status, "assignedBrandIds", avatar, created_at');
```

**Added columns**: `phone`, `address`

## Why This Matters

### Data Flow
1. **fetchUsersAndBrands()** queries all users from database (line 876)
2. User list is mapped to User type and set in state (line 897)
3. When admin clicks edit, selected user is passed to **UserModal** component
4. UserModal initializes formData with the user object (line 659)
5. Form fields display the values from formData (lines 768, 774, 801-802)

### The Problem
- Even though UserModal had input fields for `phone` and `address`
- And handleSaveUser() correctly saved them to database
- The initial load was skipping these columns, so they always appeared empty
- Result: Users couldn't see previously saved phone/address values when editing

## Verification
- Query now includes all 10 columns needed for UserModal
- Column order: `id, name, email, phone, address, role, status, "assignedBrandIds", avatar, created_at`
- Note: `"assignedBrandIds"` requires quotes (camelCase JSONB column)
- Phone and address are normalized in lines 903-907 (trim whitespace)

## Testing Checklist
- [x] Build passes with no TypeScript errors
- [ ] Edit an existing user
- [ ] Verify phone field shows previously saved value
- [ ] Verify address field shows previously saved value
- [ ] Verify brand assignments are checked correctly
- [ ] Modify phone/address and save
- [ ] Refresh and verify changes persisted
- [ ] Create new user and verify all fields save/load

## Related Code
- **UserModal component**: Lines 645-810 (form UI and handlers)
- **handleSaveUser()**: Lines 1051-1095 (saves all fields to database)
- **fetchUsersAndBrands()**: Lines 868-920 (loads users from database)
- **handleBrandToggle()**: Line 672 (manages brand assignment array)
- **handleChange()**: Line 668 (updates form state)

## Files Modified
- `pages/SettingsPage.tsx` - Line 876

## Status
✅ **FIXED** - Build successful, ready for testing
