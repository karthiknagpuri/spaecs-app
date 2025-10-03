# Custom Links - Feature Documentation

## 🚀 Overview

Advanced custom links system with time-saving features for creators and their communities.

## ✨ Key Features

### 1. **Auto-Expiring Links** ⏰
- Set expiration dates for time-sensitive links
- Automatically deactivates after the specified date
- Perfect for: Limited offers, event registrations, seasonal campaigns

**Use Cases:**
- "Early Bird Discount - Ends Dec 31" → Auto-expires on Jan 1
- "Live Workshop Registration" → Auto-expires after event
- "Flash Sale - 24 Hours Only" → Auto-expires next day

### 2. **Scheduled Activation** 📅
- Schedule links to go live at a specific date/time
- Automatically activates when the time comes
- Perfect for: Product launches, content releases, announcements

**Use Cases:**
- "New Course Launch - Jan 15" → Auto-activates on Jan 15
- "Weekly Newsletter Archive" → Activates every Monday
- "Pre-order Now" → Activates 2 weeks before release

### 3. **Click Tracking & Analytics** 📊
- Track total clicks per link
- Last clicked timestamp
- Detailed analytics with referrer, location, device
- See which links drive the most engagement

**Benefits:**
- Understand what your audience cares about
- Optimize link placement and messaging
- Track campaign performance

### 4. **Link Categories & Tags** 🏷️
- Organize links into categories: Social, Shop, Content, Event, Other
- Add custom tags for flexible filtering
- Group related links together

**Categories:**
- 🎵 **Social**: Twitter, Instagram, Discord, etc.
- 🛍️ **Shop**: Store, Products, Merchandise
- 📝 **Content**: Blog, YouTube, Newsletter
- 📅 **Event**: Workshops, Webinars, Meetups
- 🔗 **Other**: Everything else

### 5. **Custom Styling** 🎨
- Custom button colors (hex codes)
- Custom icons/emojis
- Featured links with special highlighting
- Pin important links to the top

### 6. **Link Templates** ⚡
- Pre-built templates for common link types
- One-click creation with best practices
- System templates + create your own

**Built-in Templates:**
- YouTube Video 🎥
- New Blog Post 📝
- Shop Now 🛍️
- Limited Offer ⚡
- Join Discord 💬
- Follow on Twitter 🐦
- Instagram 📸
- Live Event 📅
- Book a Call 📞
- Newsletter 📧

### 7. **Display Options** 👁️
- Manual ordering with drag-and-drop
- Show/hide click counts to visitors
- Pin links to top
- Featured link highlighting
- Open in new tab option

### 8. **Bulk Operations** ⚙️
- Duplicate links
- Bulk reorder
- Batch enable/disable
- Export analytics

## 📋 Database Schema

### Main Tables

#### `custom_links`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| creator_id | UUID | User who owns the link |
| title | VARCHAR(100) | Link title/label |
| url | TEXT | Destination URL |
| description | TEXT | Optional description |
| icon | VARCHAR(50) | Icon/emoji |
| category | VARCHAR(50) | Category (social/shop/content/event/other) |
| tags | TEXT[] | Array of tags |
| display_order | INTEGER | Manual ordering |
| **start_date** | TIMESTAMPTZ | **Auto-activate on this date** |
| **expire_date** | TIMESTAMPTZ | **Auto-deactivate on this date** |
| is_active | BOOLEAN | Active status |
| click_count | INTEGER | Total clicks |
| last_clicked_at | TIMESTAMPTZ | Last click timestamp |
| is_featured | BOOLEAN | Highlight this link |
| button_color | VARCHAR(7) | Custom hex color |
| open_in_new_tab | BOOLEAN | Open behavior |
| is_pinned | BOOLEAN | Pin to top |
| show_click_count | BOOLEAN | Display clicks publicly |

#### `link_analytics`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| link_id | UUID | Reference to custom_link |
| clicked_at | TIMESTAMPTZ | When clicked |
| referrer | TEXT | Where click came from |
| user_agent | TEXT | Browser/device info |
| ip_address | INET | IP address |
| country | VARCHAR(2) | Country code |
| city | VARCHAR(100) | City name |
| is_supporter | BOOLEAN | Is a paying supporter |
| supporter_tier | VARCHAR(50) | Tier name |

#### `link_templates`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(100) | Template name |
| category | VARCHAR(50) | Category |
| icon | VARCHAR(50) | Default icon |
| button_color | VARCHAR(7) | Default color |
| is_system | BOOLEAN | System vs user template |

## 🔧 Key Functions

### Auto-Management
```sql
-- Run every 5 minutes (via cron or Edge Function)
SELECT manage_scheduled_links();
```

### Click Tracking
```sql
-- Increment click count when user clicks a link
SELECT increment_link_clicks('link-uuid-here');
```

### Duplicate Link
```sql
-- Duplicate an existing link (time-saver!)
SELECT duplicate_custom_link('original-link-uuid');
```

### Reorder Links
```sql
-- Bulk update display order
SELECT reorder_links(
  ARRAY['uuid1', 'uuid2', 'uuid3'],
  ARRAY[0, 1, 2]
);
```

## 💡 Time-Saving Features for Creators

### 1. **Set and Forget Scheduling**
- Create links ahead of time with start dates
- Links automatically go live
- No need to manually publish at launch time

### 2. **Auto-Cleanup**
- Expired links automatically deactivate
- No manual cleanup needed
- Keep profile clean and current

### 3. **Templates Library**
- Quick creation with pre-filled settings
- Consistent styling across similar links
- Best practices built-in

### 4. **Click Analytics**
- No need for separate UTM tracking
- Built-in click counting
- Understand what works

### 5. **Bulk Management**
- Reorder multiple links at once
- Duplicate successful links
- Batch enable/disable

### 6. **Categories & Tags**
- Easy organization
- Quick filtering
- Find links fast

## 🌟 Time-Saving Features for Community

### 1. **Always Current Links**
- Expired offers automatically removed
- No clicking on dead promotions
- Always relevant content

### 2. **Clear Organization**
- Categories make it easy to find what they need
- Social links grouped together
- Shop links in one place

### 3. **Click Counts** (Optional)
- See popular links
- Social proof
- Discover trending content

### 4. **Featured Links**
- Most important links highlighted
- Don't miss key opportunities
- Clear call-to-action

## 📊 Analytics Insights

### Available Metrics:
- Total clicks per link
- Clicks in last 7 days
- Last clicked timestamp
- Click trends over time
- Top performing links
- Geographic distribution
- Device/browser breakdown
- Supporter vs non-supporter clicks

### Use Analytics To:
- Identify most valuable content
- Optimize link placement
- Understand audience interests
- Measure campaign success
- Improve conversion rates

## 🚀 API Endpoints (To Be Implemented)

### Create Link
```typescript
POST /api/links
{
  title: "Limited Offer - 50% Off",
  url: "https://shop.example.com/sale",
  category: "shop",
  icon: "⚡",
  button_color: "#F59E0B",
  expire_date: "2025-12-31T23:59:59Z",
  is_featured: true
}
```

### Update Link
```typescript
PUT /api/links/:id
{
  title: "Updated Title",
  is_active: false
}
```

### Track Click
```typescript
POST /api/links/:id/click
{
  referrer: "https://twitter.com/...",
  user_agent: "Mozilla/5.0..."
}
```

### Get Analytics
```typescript
GET /api/links/:id/analytics?period=7d
```

### Reorder Links
```typescript
POST /api/links/reorder
{
  links: [
    { id: "uuid1", order: 0 },
    { id: "uuid2", order: 1 }
  ]
}
```

## 🎯 Best Practices

### For Creators:
1. ✅ Use expiration dates for time-sensitive offers
2. ✅ Schedule launches in advance
3. ✅ Enable click tracking to measure success
4. ✅ Use categories for organization
5. ✅ Pin your most important link
6. ✅ Feature 1-2 key links max
7. ✅ Use emojis/icons for visual appeal
8. ✅ Keep link titles short and clear

### For Time Management:
1. ⏰ Batch create links for the month
2. ⏰ Use templates for recurring link types
3. ⏰ Set expiration dates to auto-cleanup
4. ⏰ Review analytics weekly
5. ⏰ Duplicate successful links as templates

## 🔄 Migration Notes

Existing `custom_links` JSONB data in `creator_pages` will be automatically migrated to the new `custom_links` table when you run the migration.

## ⚙️ Setup Instructions

1. Run the migration:
```bash
supabase db push
```

2. Enable pg_cron extension (for auto-expire):
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

3. Schedule the auto-management function:
```sql
SELECT cron.schedule(
  'manage-links',
  '*/5 * * * *',  -- Every 5 minutes
  'SELECT manage_scheduled_links()'
);
```

4. Or use Supabase Edge Functions as an alternative to pg_cron.

## 🎨 UI Components Needed

- [ ] Link editor with date/time pickers
- [ ] Category selector dropdown
- [ ] Tag input field
- [ ] Color picker for button color
- [ ] Icon/emoji picker
- [ ] Drag-and-drop reordering
- [ ] Analytics dashboard
- [ ] Template selector
- [ ] Bulk action toolbar

## 🚧 Future Enhancements

- [ ] A/B testing for links
- [ ] QR code generation
- [ ] Short URL service integration
- [ ] Link rotation (show different links to different visitors)
- [ ] Geo-targeting (show links based on location)
- [ ] Supporter-only links
- [ ] Link groups/folders
- [ ] Seasonal link sets
- [ ] Integration with email campaigns
- [ ] Webhook notifications on clicks
