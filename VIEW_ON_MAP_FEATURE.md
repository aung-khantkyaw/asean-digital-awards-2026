# View on Map Feature

## Overview
Added a "View on Map" button for each location in the Details page that allows users to navigate directly to the Landmark Map and view that specific location.

## Implementation Summary

### 1. **Details Page Updates** (`client/src/pages/normal-user/Details.tsx`)

#### Category Locations Section (Large Cards)
- Added a "View on Map" button next to the "Open Gallery" button
- Button uses `Link` component to navigate to `/landmark-map/${city.id}?location=${location.id}`
- Styled with border, hover effects, and Navigation icon

#### Related Locations Section (Small Cards)
- Added a "View on Map" button next to the "View Photos" button
- Uses the same routing pattern with query parameter
- Styled to match the compact card design

### 2. **URL Structure**

```
/landmark-map/{cityId}?location={locationId}
```

**Example:**
```
/landmark-map/abc-123-city-id?location=xyz-789-location-id
```

### 3. **User Flow**

1. User browses city details and finds an interesting location
2. User clicks "View on Map" button
3. App navigates to Landmark Map page with:
   - City context (cityId in URL path)
   - Selected location (locationId in query parameter)
4. Map should:
   - Center on the selected location
   - Highlight/select the location marker
   - Open location details panel
   - Allow user to plan a route from/to this location

## Required Map Page Enhancements

The Landmark Map page needs to be updated to handle the `location` query parameter:

### Implementation Steps:

1. **Read Query Parameter**
```typescript
import { useSearchParams } from 'react-router-dom';

const [searchParams] = useSearchParams();
const selectedLocationId = searchParams.get('location');
```

2. **Find Location from ID**
```typescript
useEffect(() => {
  if (selectedLocationId && locations.length > 0) {
    const location = locations.find(loc => loc.id === selectedLocationId);
    if (location) {
      // Center map on location
      // Highlight marker
      // Open details panel
    }
  }
}, [selectedLocationId, locations]);
```

3. **Center Map on Location**
```typescript
// If using Leaflet
if (location && location.geometry) {
  const coords = parseGeometry(location.geometry);
  map.setView([coords.lat, coords.lng], 16); // Zoom level 16 for detail view
}
```

4. **Highlight Marker**
```typescript
// Set active/selected state for the marker
setSelectedMarker(location.id);
// Open popup or info panel
setInfoPanelOpen(true);
setInfoPanelData(location);
```

5. **Enable Route Planning**
```typescript
// Pre-populate route planner with selected location
setRouteDestination(location);
// Show route planning panel
setRoutePlannerOpen(true);
```

## Benefits

✅ **Seamless Navigation** - Users can easily switch between details view and map view  
✅ **Context Preservation** - City context is maintained via URL path  
✅ **Direct Access** - Users land directly on the location they're interested in  
✅ **Route Planning** - Users can immediately plan routes to/from the location  
✅ **Better UX** - Reduces clicks needed to find a location on the map  

## UI Components Added

### Large Location Cards
```tsx
<Link
  to={`/landmark-map/${city.id}?location=${location.id}`}
  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-slate-100 transition hover:border-blue-400/60 hover:bg-blue-500/10 hover:text-white"
>
  <Navigation className="h-4 w-4" />
  {t("common.viewOnMap", "View on Map")}
</Link>
```

### Small Location Cards
```tsx
<Link
  to={`/landmark-map/${city.id}?location=${location.id}`}
  className="flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-200 transition hover:border-blue-400/60 hover:bg-blue-500/20"
>
  <Navigation className="h-3 w-3" />
  View on Map
</Link>
```

## Styling Details

### Large Cards (Category Locations)
- Font size: `text-sm` (14px)
- Padding: `px-4 py-2`
- Border: White 20% opacity with blue hover
- Icon: `h-4 w-4` (16px)
- Hover: Blue accent background and border

### Small Cards (Related Locations)
- Font size: `text-xs` (12px)
- Padding: `px-3 py-1.5`
- Background: Blue with 10% opacity
- Icon: `h-3 w-3` (12px)
- Border: Blue 30% opacity
- Hover: Increased opacity and border strength

## Translation Keys Used

- `common.viewOnMap` - "View on Map" (with fallback)
- `common.openGallery` - "Open gallery" (existing)

## Testing Checklist

- [ ] Click "View on Map" from category location cards
- [ ] Click "View on Map" from related location cards
- [ ] Verify URL includes both cityId and location query parameter
- [ ] Test with different location types
- [ ] Verify responsive design on mobile
- [ ] Test hover states and transitions
- [ ] Verify icon alignment and spacing
- [ ] Test with Myanmar language (if translations added)

## Next Steps

1. **Update Landmark Map Page** to handle `location` query parameter
2. **Add Map Centering Logic** to focus on selected location
3. **Implement Marker Highlighting** to make selected location stand out
4. **Add Auto-Open Details Panel** for selected location
5. **Pre-populate Route Planner** (optional) with selected location
6. **Add Translation Keys** for multilingual support

## Files Modified

- ✅ `client/src/pages/normal-user/Details.tsx` - Added "View on Map" buttons to both location sections

## Files to Modify Next

- ⏳ `client/src/pages/normal-user/LandmarkMap.tsx` - Handle location query parameter
- ⏳ `client/src/locales/en/common.json` - Add translation key
- ⏳ `client/src/locales/mm/common.json` - Add Myanmar translation

---

**Feature Status:** ✅ Details Page Complete | ⏳ Map Page Pending
**Date Added:** October 19, 2025
**Impact:** High - Core navigation feature for user experience
