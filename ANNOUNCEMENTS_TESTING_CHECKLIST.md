# Announcements System - Implementation Checklist & Testing Guide

## Prerequisites Checklist
- [ ] Run migration: `supabase db push` or execute `supabase_announcements_table.sql`
- [ ] Verify announcements table created in Supabase
- [ ] Verify SettingsContext includes announcementSettings
- [ ] Verify settings row `id='announcementSettings'` exists in settings table

## Component Implementation Checklist

### AnnouncementsPage Component
- [ ] File exists: `pages/AnnouncementsPage.tsx`
- [ ] Imports: supabase, useToast, React hooks
- [ ] Functions implemented:
  - [ ] `fetchAnnouncements()` - queries announcements table ordered by display order
  - [ ] `handleSave()` - creates/updates announcement with validation
  - [ ] `handleDelete()` - deletes announcement with confirmation
- [ ] UI Elements:
  - [ ] Search/filter inputs visible
  - [ ] Modal form for create/edit with all fields
  - [ ] Announcement list grid with type badges
  - [ ] Delete action buttons with confirmation
  - [ ] Toast notifications on success/error
- [ ] Navigation: Route `/pengumuman` accessible from sidebar

### AnnouncementPopup Component
- [ ] File exists: `components/AnnouncementPopup.tsx`
- [ ] Fetches from database on mount
- [ ] Functions implemented:
  - [ ] `fetchAndShowAnnouncement()` - queries announcements with date filters
  - [ ] `shouldShowAnnouncement()` - enforces frequency rules
  - [ ] `handleClose()` - closes popup
- [ ] Frequency enforcement:
  - [ ] Always - shows on every mount
  - [ ] Per session - uses sessionStorage
  - [ ] Cooldown - uses localStorage with time tracking
  - [ ] Daily limit - respects maxShowsPerDay
- [ ] Display:
  - [ ] Type colors applied correctly (info/success/warning/error)
  - [ ] Title and message display
  - [ ] Close button functional
  - [ ] Modal styling with animation

### AnnouncementLineBar Component
- [ ] File exists: `components/AnnouncementLineBar.tsx`
- [ ] Fetches from database on mount
- [ ] Functions implemented:
  - [ ] `fetchAndShowAnnouncement()` - queries announcements with date filters
  - [ ] `handleClose()` - dismisses bar and stores state
- [ ] Dismiss behavior:
  - [ ] Hide for session - uses sessionStorage
  - [ ] Hide for hours - uses localStorage with duration
- [ ] Display:
  - [ ] Type colors applied correctly
  - [ ] Message displays
  - [ ] Close button functional
  - [ ] Top bar positioning

### App.tsx Integration
- [ ] AnnouncementPopup imported and rendered (no props)
- [ ] AnnouncementLineBar imported and rendered (no props)
- [ ] Demo mode removed (no hardcoded messages)
- [ ] No showAnnouncement state
- [ ] Components fetch on mount and respond to SettingsContext

### Sidebar Integration
- [ ] Menu item "Kelola Pengumuman" visible for Admin/Super Admin
- [ ] Path `/pengumuman` routed correctly
- [ ] Not visible to other roles

### SettingsContext Extension
- [ ] Fetches `announcementSettings` from settings table
- [ ] Normalizes with defaults:
  - [ ] popup.enabled = true
  - [ ] popup.frequency = 'per_session'
  - [ ] popup.cooldownMinutes = 30
  - [ ] popup.maxShowsPerDay = 3
  - [ ] lineBar.enabled = true
  - [ ] lineBar.dismissBehavior = 'hide_for_hours'
  - [ ] lineBar.hideDurationHours = 12

## Database Testing Checklist

### Table Creation
- [ ] Execute migration file: `supabase_announcements_table.sql`
- [ ] Verify table structure:
  ```sql
  SELECT * FROM information_schema.columns 
  WHERE table_name = 'announcements' 
  ORDER BY ordinal_position;
  ```

### RLS Policies
- [ ] Verify policies exist:
  ```sql
  SELECT policyname FROM pg_policies 
  WHERE tablename = 'announcements';
  ```
- [ ] Test admin access (can CRUD)
- [ ] Test non-admin access (can SELECT only)

### Indexes
- [ ] Verify indexes created:
  ```sql
  SELECT indexname FROM pg_indexes 
  WHERE tablename = 'announcements';
  ```

## Functional Testing Checklist

### Create Announcement
- [ ] Navigate to Kelola Pengumuman
- [ ] Click "Tambah Pengumuman"
- [ ] Fill form:
  - [ ] Enter title
  - [ ] Enter message
  - [ ] Select type (info/success/warning/error)
  - [ ] Select display mode (popup/linebar/both)
  - [ ] Set start/end dates
  - [ ] Toggle active status
- [ ] Click Save
- [ ] Verify toast notification
- [ ] Verify announcement appears in list

### Edit Announcement
- [ ] Click edit button on existing announcement
- [ ] Modify fields
- [ ] Click Save
- [ ] Verify changes persisted

### Delete Announcement
- [ ] Click delete button
- [ ] Confirm deletion
- [ ] Verify announcement removed from list

### Popup Display (Type: Popup or Both)
- [ ] Create announcement with displayMode='popup' or 'both'
- [ ] Set end date in future
- [ ] Set start date in past
- [ ] Refresh page
- [ ] [ ] Verify popup appears (based on frequency rules)
- [ ] Test frequency modes:
  - [ ] **Always**: 
    - [ ] Refresh page multiple times
    - [ ] Popup shows every time
  - [ ] **Per Session**:
    - [ ] Refresh page
    - [ ] Popup shows once
    - [ ] Refresh again
    - [ ] Popup doesn't show
    - [ ] Open new tab
    - [ ] Popup shows again
  - [ ] **Cooldown**:
    - [ ] Set cooldown to 1 minute
    - [ ] Close popup
    - [ ] Immediately refresh
    - [ ] Popup doesn't show (cooldown not expired)
    - [ ] Wait 1+ minutes
    - [ ] Refresh again
    - [ ] Popup shows

### LineBar Display (Type: LineBar or Both)
- [ ] Create announcement with displayMode='linebar' or 'both'
- [ ] Set end date in future
- [ ] Set start date in past
- [ ] Navigate to authenticated page
- [ ] [ ] Verify line bar appears at top
- [ ] Test dismiss behavior:
  - [ ] **Hide for Session**:
    - [ ] Click close button on line bar
    - [ ] Refresh page
    - [ ] Line bar doesn't show
    - [ ] Close tab and open new tab
    - [ ] Line bar shows again
  - [ ] **Hide for Hours**:
    - [ ] Set duration to 1 hour
    - [ ] Click close button
    - [ ] Refresh immediately
    - [ ] Line bar doesn't show

### Scheduling
- [ ] Create announcement with startDate in future
- [ ] Set current time before startDate
- [ ] Verify announcement not visible
- [ ] Modify startDate to past
- [ ] Refresh page
- [ ] Verify announcement now visible

### Settings Control
- [ ] Navigate to Pengaturan → Pengaturan Pengumuman
- [ ] Disable popups: `Aktifkan Pop-up = OFF`
- [ ] Verify popups don't display even if data exists
- [ ] Re-enable popups
- [ ] Verify popups display again
- [ ] Change frequency to 'Always'
- [ ] Verify popup shows on every page load
- [ ] Change dismiss behavior to 'Hide for Session'
- [ ] Close line bar, refresh
- [ ] Verify line bar doesn't show

### Date & Time Validation
- [ ] Create announcement with startDate > endDate
- [ ] Verify validation error or warning
- [ ] Set startDate = endDate
- [ ] Verify announcement displays

### Type Color Validation
- [ ] Create Info announcement (blue)
- [ ] Create Success announcement (green)
- [ ] Create Warning announcement (amber)
- [ ] Create Error announcement (red)
- [ ] Verify correct colors display in popup/linebar

## Edge Cases Testing

### Expired Announcements
- [ ] Create announcement with endDate in past
- [ ] Verify announcement not displayed
- [ ] Verify doesn't appear in popup/linebar

### Inactive Announcements
- [ ] Create announcement with isActive=false
- [ ] Verify announcement not displayed
- [ ] Activate announcement
- [ ] Refresh page
- [ ] Verify now displays

### Multiple Active Announcements
- [ ] Create 3 announcements, all active
- [ ] Verify first by order displayed
- [ ] Update order field
- [ ] Refresh
- [ ] Verify new order respected

### Storage Limits
- [ ] Test localStorage and sessionStorage key naming
- [ ] Verify no key collisions between announcements
- [ ] Verify cleanup of old storage keys

### Role-Based Access
- [ ] Test as Super Admin: can create/edit/delete
- [ ] Test as Admin: can create/edit/delete
- [ ] Test as Keuangan: cannot access management page
- [ ] Test as Partner: cannot access management page

## Performance Testing

### Load Time
- [ ] Verify page loads quickly with lazy loading
- [ ] Measure AnnouncementsPage load time
- [ ] Verify no UI blocking during data fetch

### Database Queries
- [ ] Check query performance with indexes
- [ ] Monitor for N+1 query issues
- [ ] Test with 100+ announcements

### Storage Performance
- [ ] Verify localStorage doesn't exceed limits
- [ ] Verify sessionStorage operations fast
- [ ] Monitor memory usage with many dismissed items

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

## Documentation Verification

- [ ] ANNOUNCEMENTS_SYSTEM.md exists and complete
- [ ] All features documented
- [ ] Setup instructions clear
- [ ] Troubleshooting guide helpful
- [ ] Examples provided

## Git Status Check
- [ ] All files committed
- [ ] No uncommitted changes
- [ ] Commit messages clear and descriptive

## Post-Deployment Checklist

- [ ] Backup database before deploying
- [ ] Test in staging environment first
- [ ] Document any customizations
- [ ] Train admins on feature usage
- [ ] Monitor for errors in production
- [ ] Collect user feedback

## Known Limitations & Future Work

- [ ] Recurring announcements not yet supported (enhancement)
- [ ] Audience targeting not yet supported (enhancement)
- [ ] Analytics/metrics not tracked (enhancement)
- [ ] Rich text formatting not supported (enhancement)
- [ ] Image/attachment support not yet added (enhancement)

---

**Last Updated**: [Date]
**Status**: [Development | Testing | Production]
**Tested By**: [Name]
**Notes**: [Any additional notes]
