# Database Migration Guide

## Overview

This guide helps you set up all the new features for your Spaecs app. Follow the steps in order.

## 🚀 Migration Steps

### Step 1: Fix Existing Tables (If Needed)

If you already have `collaboration_requests`, `brand_logos`, or `creator_stats` tables with `creator_id` columns, run this first:

**File:** `FIX_EXISTING_TABLES.sql`

This will:
- Rename `creator_id` to `user_id` in existing tables
- Update all indexes and policies
- Fix helper functions

### Step 2: Create New Tables

**File:** `MANUAL_MIGRATION.sql`

This creates all the new email leads and community features:

**New Tables:**
- `email_leads` - Email collection
- `newsletter_subscribers` - Newsletter management
- `community_members` - Community access
- `autopilot_campaigns` - Promotion campaigns
- `member_benefits` - Tier benefits
- `link_analytics` - Click tracking

**New Columns on `creator_pages`:**
- `email_collection_enabled`
- `email_collection_message`
- `newsletter_enabled`
- `newsletter_message`
- `community_enabled`
- `community_url`
- `community_access_level`
- `autopilot_enabled`

## 📋 How to Run

### Option A: Run Both Scripts (Recommended)

```sql
-- 1. Run this first to fix existing tables
-- Copy contents of FIX_EXISTING_TABLES.sql and run

-- 2. Then run this to create new tables
-- Copy contents of MANUAL_MIGRATION.sql and run
```

### Option B: Fresh Install

If you don't have existing collaboration tables, just run:
```sql
-- Copy contents of MANUAL_MIGRATION.sql and run
```

## ✅ Verify Installation

After running the migrations, verify everything is set up:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'email_leads',
    'newsletter_subscribers',
    'community_members',
    'autopilot_campaigns',
    'member_benefits',
    'link_analytics',
    'collaboration_requests',
    'brand_logos',
    'creator_stats'
  )
ORDER BY table_name;

-- Verify all use user_id (not creator_id)
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (column_name = 'user_id' OR column_name = 'creator_id')
ORDER BY table_name, column_name;
```

Expected result: All tables should have `user_id`, none should have `creator_id`.

## 🎯 Features Enabled After Migration

### Dashboard Pages
- **Email Leads** (`/dashboard/leads`) - View and manage email leads
- **Autopilot** (`/dashboard/autopilot`) - Create automated campaigns
- **Benefits** (`/dashboard/benefits`) - Configure member benefits

### API Endpoints
- `/api/email-leads/collect` - Collect emails
- `/api/newsletter/subscribe` - Newsletter subscriptions
- `/api/community/join` - Community membership
- `/api/autopilot/campaigns` - Campaign management
- `/api/benefits` - Benefit configuration

### Public Features
- Email gate before accessing links
- Newsletter subscription on profile
- Community join with access control
- LinkTree email collection

## 🔧 Troubleshooting

### Error: "relation already exists"
**Solution:** This is normal if tables already exist. The scripts use `IF NOT EXISTS` and `DROP ... IF EXISTS` to handle this safely.

### Error: "column creator_id does not exist"
**Solution:** Run `FIX_EXISTING_TABLES.sql` first to rename old columns.

### Error: "policy already exists"
**Solution:** The scripts drop policies before creating them, so this shouldn't happen. If it does, manually drop the policy:
```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

## 📚 Documentation

For more information about using these features, see:
- [Email Leads Documentation](../docs/email-leads.md) (if available)
- [Autopilot Documentation](../docs/autopilot.md) (if available)
- [Member Benefits Documentation](../docs/benefits.md) (if available)

## 🆘 Support

If you encounter issues:
1. Check the verification queries above
2. Review error messages carefully
3. Ensure you have the latest code deployed
4. Check Supabase logs for detailed error info
