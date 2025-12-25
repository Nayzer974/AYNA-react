# Analytics v2 Integration Guide

## Quick Integration Steps

### 1. Initialize in App.tsx

```typescript
// application/App.tsx
import { useEffect } from 'react';
import { analytics } from '@/analytics';

function AppContent() {
  useEffect(() => {
    // Initialize analytics
    analytics.initialize().catch(error => {
      if (__DEV__) {
        console.error('[App] Analytics initialization failed:', error);
      }
    });

    return () => {
      analytics.cleanup();
    };
  }, []);

  // ... rest of component
}
```

### 2. Add Navigation Tracking

```typescript
// application/src/navigation/AppNavigator.tsx
import { useNavigationTracking } from '@/analytics/hooks/useNavigationTracking';

export const AppNavigator = React.forwardRef<any, {}>((props, ref) => {
  const handleStateChange = useNavigationTracking();
  
  return (
    <NavigationContainer 
      ref={ref} 
      theme={navigationTheme}
      onStateChange={handleStateChange}
    >
      {/* ... existing navigator code ... */}
    </NavigationContainer>
  );
});
```

### 3. Identify Users on Login

```typescript
// application/src/contexts/UserContext.tsx
import { analytics } from '@/analytics';

// In login function, after successful authentication:
const login = useCallback(async (email: string, password: string) => {
  // ... authentication logic ...
  
  const user = await signInWithSupabase(email, password);
  
  // Identify user
  await analytics.identify(user.id, {
    // Only non-PII traits
    theme: user.theme,
    locale: user.locale || 'fr',
  });
  
  // ... rest of login logic ...
}, []);
```

### 4. Replace Old Analytics Calls

**Find and replace pattern:**

```typescript
// OLD
import { trackEvent } from '@/services/analytics';
trackEvent('event_name', { prop: value });

// NEW
import { analytics } from '@/analytics';
analytics.track('event_name', { prop: value });
```

**Key files to update:**
- `src/services/userAnalytics.ts` - dhikr_completed, prayer_completed
- `src/pages/Login.tsx` - login events
- `src/pages/Signup.tsx` - signup events
- `src/pages/Profile.tsx` - profile events
- Remove all `trackPageView()` calls from individual screens

### 5. Integrate with Network Sync (Optional)

```typescript
// application/src/hooks/useAutoSync.ts
import { analytics } from '@/analytics';

export function useAutoSync() {
  // ... existing code ...
  
  useEffect(() => {
    // ... existing network listener setup ...
    
    unsubscribeRef.current = setupNetworkListener((isOnline) => {
      if (isOnline) {
        // Trigger analytics sync when network comes back
        analytics.flush().catch(() => {
          // Ignore errors
        });
      }
    });
    
    // ... rest of hook ...
  }, []);
}
```

## Migration Checklist

- [ ] Install dependencies (none required - uses built-in functions)
- [ ] Initialize analytics in App.tsx
- [ ] Add navigation tracking hook
- [ ] Add user identification on login
- [ ] Replace all `trackEvent()` calls with `analytics.track()`
- [ ] Remove all `trackPageView()` calls from components
- [ ] Test offline/online sync
- [ ] Verify events appear in Supabase
- [ ] Test opt-out functionality
- [ ] Verify no duplicate events

## Testing

### Test Offline Queue

1. Disable network
2. Trigger several events
3. Check queue: `const stats = await analytics.getStats()`
4. Re-enable network
5. Verify events sync automatically

### Test Screen Tracking

1. Navigate between screens
2. Verify only one event per screen
3. Check debouncing works (rapid navigation)

### Test User Identification

1. Log in
2. Check Supabase - events should have correct user_id
3. Log out and log in as different user
4. Verify user_id updates

## Common Issues

### Events not syncing

1. Check `analytics.getStats()` - queue size
2. Verify Supabase RLS policies allow INSERT
3. Check network connectivity
4. Verify provider is initialized

### Duplicate events

1. Ensure old analytics.ts is not being called
2. Check navigation hook is not firing multiple times
3. Verify debounce is working (500ms)

### Queue growing too large

1. Check sync failures in stats
2. Verify Supabase table exists
3. Check network connectivity
4. Ensure flush() is called periodically





