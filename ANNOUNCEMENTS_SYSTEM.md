# Announcements System Guide

## Overview
The Order Management Dashboard now includes a comprehensive announcement system that allows administrators to create and display system-wide notifications to users. Announcements can be displayed as:
- **Popup modals** - Attention-grabbing modal windows
- **Line bars** - Subtle horizontal notification bars at the top of pages
- **Both** - Display in both popup and line bar formats

## Features

### Announcement Management
- **Create**: Add new announcements with title, message, type, and display mode
- **Edit**: Modify existing announcements
- **Delete**: Remove announcements
- **Schedule**: Set start and end dates for automatic visibility
- **Order**: Control display order via the `order` field
- **Status**: Toggle announcements on/off with `isActive` flag

### Display Types
1. **Info** (Blue) - General information
2. **Success** (Green) - Positive updates
3. **Warning** (Amber) - Caution messages
4. **Error** (Red) - Critical alerts

### Display Modes
1. **Popup** - Modal dialog that appears to users based on frequency rules
2. **LineBar** - Top-of-page horizontal notification bar
3. **Both** - Show as both popup and line bar

### Frequency Control (Popup)
Available frequency options for popups:
- **Always**: Show every time user visits
- **Per Session**: Show once per browser session
- **Cooldown**: Show based on time interval (default 30 minutes)

Each frequency mode respects a daily show limit (default 3 shows/day).

### Dismiss Behavior (Line Bar)
Line bar dismissal options:
- **Hide for Session**: Dismiss until browser is closed
- **Hide for Hours**: Dismiss for specified duration (default 12 hours)

## Database Schema

### Announcements Table
```sql
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL ('info'|'success'|'warning'|'error'),
    displayMode TEXT NOT NULL ('popup'|'linebar'|'both'),
    isActive BOOLEAN NOT NULL DEFAULT true,
    startDate TIMESTAMP WITH TIME ZONE NOT NULL,
    endDate TIMESTAMP WITH TIME ZONE NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    createdBy UUID REFERENCES users(id),
    order INT NOT NULL DEFAULT 0
);
```

## Setup Instructions

### 1. Create Database Table
Run the migration file to create the announcements table:

```bash
# Using Supabase CLI
supabase db push

# Or run the SQL directly in Supabase SQL Editor
-- Copy contents of supabase_announcements_table.sql
```

### 2. Access Announcement Management
1. Navigate to **Kelola Pengumuman** in the sidebar (Admin/Super Admin only)
2. Create new announcements by clicking **Tambah Pengumuman**
3. Fill in the form:
   - **Judul**: Announcement title
   - **Pesan**: Announcement message
   - **Tipe**: Select type (Info/Success/Warning/Error)
   - **Mode Tampilan**: Select display mode (Popup/LineBar/Both)
   - **Tanggal Mulai**: When announcement becomes visible
   - **Tanggal Akhir**: When announcement stops showing
   - **Status**: Toggle Active/Inactive

### 3. Configure Settings
Navigate to **Pengaturan → Pengaturan Pengumuman** to configure:

#### Popup Settings
- **Aktifkan Pop-up**: Enable/disable popups
- **Frekuensi**: Always | Per Session | Cooldown
- **Durasi Cooldown (menit)**: Minutes between shows (if cooldown enabled)
- **Maksimal per Hari**: Maximum shows per day

#### Line Bar Settings
- **Aktifkan Bar**: Enable/disable line bars
- **Behavior Tutup**: Hide for Session | Hide for Hours
- **Durasi Jam**: Hours to hide when dismissed (if hide_for_hours selected)

## Usage Workflow

### Creating an Announcement
1. Click **Tambah Pengumuman**
2. Enter title and message
3. Select type (color-coded for visual impact)
4. Choose display mode based on importance
5. Set schedule (optional - defaults to 7 days from now)
6. Click **Simpan**

### Scheduling Announcements
- **Immediate**: Set start date to now, end date to future date
- **Scheduled**: Set start date in future for timed announcements
- **Recurring**: Delete old announcement and create new one (consider adding recurring support)

### Best Practices
1. Use appropriate types:
   - **Info**: New features, general updates
   - **Success**: Confirmation of completed actions
   - **Warning**: Important maintenance notices
   - **Error**: Critical system issues

2. Set appropriate frequency:
   - **Always**: For critical important notices
   - **Per Session**: For typical updates
   - **Cooldown**: For reminders or repeated messages

3. Use display modes wisely:
   - **Popup**: For time-sensitive or critical information
   - **LineBar**: For subtle reminders or background information
   - **Both**: For very important system announcements

4. Schedule appropriately:
   - Always set an end date to avoid stale announcements
   - Give enough time for users to see the announcement
   - Consider time zones when scheduling

## Component Architecture

### Frontend Components
- **AnnouncementsPage** (`pages/AnnouncementsPage.tsx`)
  - Admin CRUD interface
  - Fetch, create, update, delete announcements
  - Modal form for editing

- **AnnouncementPopup** (`components/AnnouncementPopup.tsx`)
  - Fetches and displays popup announcements
  - Implements frequency enforcement logic
  - Respects daily show limits

- **AnnouncementLineBar** (`components/AnnouncementLineBar.tsx`)
  - Fetches and displays line bar announcements
  - Implements dismiss behavior logic
  - Shows/hides based on user interaction

### Context & Settings
- **SettingsContext** (`contexts/SettingsContext.tsx`)
  - Provides `announcementSettings` globally
  - Fetches from settings table row `id='announcementSettings'`
  - Normalizes settings with defaults

- **Settings Table Row**: `announcementSettings`
  - Stores popup and line bar configuration
  - Synced to all display components

## Frequency Logic Explanation

### Popup Frequency Rules

#### Always
- Shows every page visit
- No caching or limits except daily maximum

#### Per Session
- Shows once per browser session
- Uses `sessionStorage` to track display
- Resets when browser tab is closed

#### Cooldown
- Shows after specified time interval (minutes)
- Uses `localStorage` to track last show time
- Respects daily show limit

### Line Bar Dismiss Behavior

#### Hide for Session
- Dismissed state persists only for current browser session
- Uses `sessionStorage`
- Resets when tab closes

#### Hide for Hours
- Dismissed state persists for specified hours
- Uses `localStorage`
- User must wait specified duration to see again

## Troubleshooting

### Announcement Not Showing
1. Check `isActive` flag is true
2. Verify dates are correct (startDate <= now <= endDate)
3. Check frequency rules haven't prevented display
4. Clear browser cache/storage and refresh
5. Check console for JavaScript errors

### Settings Not Applied
1. Verify `announcementSettings` row exists in settings table
2. Clear SettingsContext cache by refreshing page
3. Check settings are saved correctly in database
4. Verify user has admin permissions

### Database Issues
1. Verify announcements table exists:
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'announcements';
   ```
2. Check RLS policies are applied:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'announcements';
   ```
3. Run migration script again if needed

## Future Enhancements
- Recurring announcement support
- Audience targeting (by role, user group)
- Analytics (view count, dismiss rate)
- A/B testing for different message formats
- Webhook integration for automated announcements
- Rich text editor for message formatting
- Attachment/image support

## Related Documentation
- See `COMMISSION_SYSTEM.md` for related multi-tenant concepts
- See `types.ts` for Announcement interface definition
- See `contexts/SettingsContext.tsx` for settings management pattern
