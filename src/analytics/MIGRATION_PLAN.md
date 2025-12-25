# Analytics v2 Migration Plan

## Overview

This document outlines the step-by-step migration from `src/services/analytics.ts` (v1) to the new `src/analytics` module (v2).

## Goals

- ✅ Replace old analytics.ts with new v2 system
- ✅ Avoid double tracking during rollout
- ✅ Maintain backward compatibility during transition
- ✅ Zero downtime migration

## Prerequisites

### 1. Install Dependencies

```bash
npm install uuid
npm install --save-dev @types/uuid
```

### 2. Update Supabase Table (if needed)

The new system stores additional metadata. Existing `analytics_events` table is compatible, but metadata will be stored in `properties` JSONB field.

**Optional migration SQL:**
```sql
-- If you want to store eventId separately (optional)
ALTER TABLE analytics_events 
ADD COLUMN IF NOT EXISTS event_id UUID;

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_id 
ON analytics_events(event_id);
```

## Migration Steps

### Step 1: Initialize Analytics v2 (Day 1)

**File: `App.tsx`**

```typescript
import { analytics } from '@/analytics';
import { useEffect } from 'react';

function AppContent() {
  useEffect(() => {
    // Initialize analytics v2
    analytics.initialize().catch(error => {
      console.error('[App] Failed to initialize analytics:', error);
    });

    return () => {
      analytics.cleanup();
    };
  }, []);

  // ... rest of component
}
```

**Status:** ✅ v2 initialized, but not yet used

---

### Step 2: Add Navigation Tracking (Day 1)

**File: `src/navigation/AppNavigator.tsx`**

```typescript
import { useNavigationTracking } from '@/analytics/hooks/useNavigationTracking';

export const AppNavigator = React.forwardRef<any, {}>((props, ref) => {
  const handleStateChange = useNavigationTracking();
  
  return (
    <NavigationContainer 
      ref={ref} 
      theme={navigationTheme}
      onStateChange={handleStateChange}
    >
      {/* ... rest of navigator */}
    </NavigationContainer>
  );
});
```

**Status:** ✅ Navigation tracking active with v2

---

### Step 3: Identify Users (Day 1)

**File: `src/contexts/UserContext.tsx`**

In the `login` and `register` functions:

```typescript
import { analytics } from '@/analytics';

// After successful login/register
await analytics.identify(user.id, {
  email: user.email, // Only if non-sensitive
  theme: user.theme,
  // Do NOT include: password, tokens, journal entries, intentions
});
```

**Status:** ✅ User identification active with v2

---

### Step 4: Replace trackEvent Calls (Day 2-3)

**Pattern to replace:**

```typescript
// OLD (v1)
import { trackEvent } from '@/services/analytics';
trackEvent('event_name', { property: value });

// NEW (v2)
import { analytics } from '@/analytics';
analytics.track('event_name', { property: value });
```

**Files to migrate:**

1. `src/services/userAnalytics.ts`
   ```typescript
   // Replace
   const { trackEvent } = await import('./analytics');
   trackEvent('dhikr_completed', { count }).catch(() => {});
   
   // With
   import { analytics } from '@/analytics';
   analytics.track('dhikr_completed', { count });
   ```

2. `src/pages/Login.tsx`, `Signup.tsx`, etc.
   ```typescript
   // Replace all trackEvent calls with analytics.track
   ```

3. Remove all `trackPageView()` calls from individual screens (now handled centrally)

**Status:** ✅ All events tracked with v2

---

### Step 5: Remove Old Analytics (Day 4)

**File: `src/services/analytics.ts`**

Keep file but mark as deprecated:

```typescript
/**
 * @deprecated Use @/analytics instead
 * This file will be removed in next release
 */

import { analytics } from '@/analytics';

// Re-export for backward compatibility
export async function trackEvent(eventName: string, properties?: Record<string, any>) {
  analytics.track(eventName, properties);
}

export async function trackPageView(pageName: string) {
  analytics.screen(pageName);
}

// ... other deprecated functions
```

**Status:** ✅ Old API still works, delegates to v2

---

### Step 6: Clean Migration (Day 5)

1. Remove `src/services/analytics.ts` completely
2. Update all imports to use `@/analytics`
3. Remove old analytics table references if any

**Status:** ✅ Migration complete

---

## Avoiding Double Tracking

### During Transition Period

**Option 1: Feature Flag (Recommended)**

```typescript
// In analytics.ts
const USE_V2 = true; // Toggle to switch

if (USE_V2) {
  analytics.track(...);
} else {
  // Old implementation
}
```

**Option 2: Provider Filtering**

Add deduplication in Supabase provider using `eventId`:

```sql
-- Prevent duplicate events by eventId
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_events_unique_event_id 
ON analytics_events((properties->>'eventId'))
WHERE properties->>'eventId' IS NOT NULL;
```

---

## Rollback Plan

If issues arise:

1. **Immediate:** Set feature flag `USE_V2 = false`
2. **Revert:** Restore old `analytics.ts` from git
3. **Remove:** Comment out analytics v2 initialization in `App.tsx`

---

## Testing Checklist

- [ ] Analytics v2 initializes correctly
- [ ] Screen tracking works in NavigationContainer
- [ ] Events are queued when offline
- [ ] Events sync when app returns to foreground
- [ ] No duplicate events in Supabase
- [ ] User identification works
- [ ] Opt-out functionality works
- [ ] GDPR export/delete functions work
- [ ] No crashes on analytics failures

---

## Monitoring

After migration, monitor:

1. **Queue size:** Should stay below 1000 events
2. **Sync success rate:** Check `lastSyncTime` vs `lastFailedSyncTime`
3. **Event volume:** Compare with pre-migration numbers
4. **App performance:** No degradation from analytics

---

## Support

For issues during migration:
1. Check console logs (dev mode only)
2. Use `analytics.getStats()` to check queue status
3. Verify Supabase RLS policies allow inserts
4. Check network connectivity





