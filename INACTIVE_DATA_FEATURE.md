# Inactive Data Viewing Feature

## Overview
Added a new feature to both Admin and Collaborator dashboards that allows viewing of inactive content (where `is_active = false`). This provides visibility into content that has been disabled or hidden from public view.

## Implementation Details

### Type Definitions Updated
All data types now include the optional `is_active` property:
- `AdminCity`
- `AdminCityDetail`
- `AdminLocation`
- `AdminRoad`

### New Panel Keys
Added four new panel types to both dashboards:
- `inactive-cities`
- `inactive-city-details`
- `inactive-locations`
- `inactive-roads`

## Features by Dashboard

### Collaborator Dashboard
**Location**: `client/src/pages/collaborator/Dashboard.tsx`

#### Data Filtering
Collaborators see only their own inactive content:
```typescript
const myInactiveCities = useMemo(() => {
  if (!currentUserId) return [];
  return cities.filter(
    (c) => c.user_id === currentUserId && c.is_active === false
  );
}, [currentUserId, cities]);
```

Similar filters exist for:
- `myInactiveCityDetails`
- `myInactiveLocations`
- `myInactiveRoads`

#### Navigation Structure
Added new "Inactive Content" category to sidebar with four items:
- **Inactive Cities** - Shows count of collaborator's inactive cities
- **Inactive City Details** - Shows count of collaborator's inactive city details
- **Inactive Locations** - Shows count of collaborator's inactive locations
- **Inactive Roads** - Shows count of collaborator's inactive roads

### Admin Dashboard
**Location**: `client/src/pages/admin/Dashboard.tsx`

#### Data Filtering
Admins see ALL inactive content system-wide:
```typescript
const inactiveCities = useMemo(() => {
  return cities.filter((c) => c.is_active === false);
}, [cities]);
```

Similar filters exist for:
- `inactiveCityDetails`
- `inactiveLocations`
- `inactiveRoads`

#### Navigation Structure
Added new "Inactive Content" category to sidebar with four items showing system-wide counts.

## UI Components

### Empty State
When no inactive data exists, displays a friendly empty state message:
```
┌─────────────────────────────────────┐
│          [Checkmark Icon]           │
│                                     │
│      No Inactive [Type]             │
│   All your [type] are currently    │
│            active.                  │
└─────────────────────────────────────┘
```

### Data Tables
When inactive data exists, uses the same table components as active data:
- `CityTable`
- `CityDetailTable`
- `LocationTable`
- `RoadTable`

All tables support:
- **Edit** - Clicking edit loads the data into the form (can be reactivated)
- **Delete** - Removes the inactive data permanently
- **View** - Shows all details including the inactive status

## Color Theme
- **Admin Panel**: Emerald/green theme with emerald-colored badges
- **Collaborator Panel**: Blue theme with blue-colored badges

## Count Badges
Each navigation item displays the count of inactive items:
```tsx
<span className={PANEL_PILL_CLASS}>
  {myInactiveCities.length} inactive
</span>
```

## Use Cases

### For Collaborators
1. **Review disabled content** - See what content has been marked inactive by admins
2. **Audit their submissions** - Track which of their submissions are not publicly visible
3. **Reactivate content** - Edit inactive content to potentially reactivate it

### For Admins
1. **System-wide oversight** - View all disabled content across all users
2. **Quality control** - Review content that has been disabled
3. **Content moderation** - Manage what content is visible to the public
4. **Data cleanup** - Identify and remove permanently unwanted content

## Data Flow

```
Backend API
    ↓
Dashboard Response (includes is_active field)
    ↓
useMemo filters (separate active/inactive)
    ↓
Navigation counts updated
    ↓
User selects inactive panel
    ↓
Table displays inactive data
    ↓
User can Edit or Delete
```

## Benefits

1. **Transparency** - Users can see what content is inactive
2. **Accountability** - Clear visibility into content status
3. **Recovery** - Ability to reactivate content if needed
4. **Audit Trail** - Track what content has been disabled
5. **Organization** - Separate view keeps active content focused

## Technical Notes

- Uses existing table components (no new components needed)
- Filters are memoized for performance
- Counts update automatically when data changes
- Empty states provide clear user feedback
- Consistent styling with active content panels
- Blue theme for collaborator, emerald theme for admin

## Future Enhancements

Potential additions:
- Bulk reactivation feature
- Reason for deactivation field
- Deactivation timestamp
- Filter by date range
- Export inactive data
- Notification when content is deactivated
