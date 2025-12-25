# Analytics v2

Production-ready analytics system for React Native Expo apps.

## Features

- ✅ Offline-first queue with persistent storage
- ✅ Provider-based architecture (Supabase, custom providers)
- ✅ GDPR compliant (opt-out, data export/deletion)
- ✅ No PII in events
- ✅ Automatic batching and retry logic
- ✅ Centralized screen tracking
- ✅ Never blocks UI
- ✅ Never crashes app

## Quick Start

### 1. Initialize

```typescript
import { analytics } from '@/analytics';

// In App.tsx
useEffect(() => {
  analytics.initialize().catch(console.error);
  
  return () => analytics.cleanup();
}, []);
```

### 2. Track Events

```typescript
import { analytics } from '@/analytics';

// Track custom event
analytics.track('dhikr_completed', {
  count: 33,
  dhikr_type: 'subhanAllah',
});

// Track screen view (or use navigation hook)
analytics.screen('Home');
```

### 3. Identify Users

```typescript
// When user logs in
await analytics.identify(user.id, {
  theme: 'ocean',
  // No PII allowed!
});
```

### 4. Setup Navigation Tracking

```typescript
import { useNavigationTracking } from '@/analytics/hooks/useNavigationTracking';

<NavigationContainer onStateChange={useNavigationTracking()}>
  {/* ... */}
</NavigationContainer>
```

## API Reference

### `analytics.track(eventName, properties?)`

Track a custom event.

```typescript
analytics.track('button_clicked', { buttonName: 'submit' });
```

**Rules:**
- No PII in properties
- Max 100KB per event
- Properties are validated

### `analytics.screen(screenName, params?)`

Track a screen view.

```typescript
analytics.screen('Profile', { userId: '123' });
```

**Note:** Screen tracking is usually handled automatically by navigation hook.

### `analytics.identify(userId, traits?)`

Identify a user.

```typescript
await analytics.identify('user123', {
  plan: 'premium',
  locale: 'fr',
});
```

### `analytics.flush()`

Force immediate sync of queued events.

```typescript
await analytics.flush();
```

### `analytics.optOut()`

User opts out of analytics. Clears queue.

```typescript
await analytics.optOut();
```

### `analytics.optIn()`

User opts back in.

```typescript
analytics.optIn();
```

### `analytics.getStats()`

Get queue statistics.

```typescript
const stats = await analytics.getStats();
console.log(stats.queued, stats.failedSyncs);
```

### GDPR Compliance

```typescript
// Export user data
const events = await analytics.exportUserData(userId);

// Delete user data
const deleted = await analytics.deleteUserData(userId);
```

## Architecture

```
Analytics (Public API)
  ├── EventQueue (AsyncStorage persistence)
  ├── BatchProcessor (Batching, retry logic)
  └── Provider (SupabaseProvider, DebugProvider, etc.)
```

## Configuration

```typescript
await analytics.initialize(undefined, {
  maxQueueSize: 1000,
  maxEventAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  batchSize: 50,
  debug: __DEV__,
  consent: true,
});
```

## Custom Providers

Implement `AnalyticsProvider` interface:

```typescript
import { AnalyticsProvider, AnalyticsEvent } from '@/analytics';

class MyProvider implements AnalyticsProvider {
  async initialize() { /* ... */ }
  async track(events: AnalyticsEvent[]) { /* ... */ }
  async identify(userId: string, traits?: Record<string, unknown>) { /* ... */ }
  async reset() { /* ... */ }
  isReady() { return true; }
}

await analytics.initialize(new MyProvider());
```

## Examples

### Track Dhikr Completion

```typescript
import { analytics } from '@/analytics';

function onDhikrComplete(count: number) {
  analytics.track('dhikr_completed', {
    count,
    timestamp: Date.now(),
  });
}
```

### Track Feature Usage

```typescript
analytics.track('feature_used', {
  feature_name: 'khalwa_session',
  duration_minutes: 15,
  completed: true,
});
```

## Best Practices

1. **Never include PII:**
   ```typescript
   // ❌ BAD
   analytics.track('note_created', { text: userNoteText });
   
   // ✅ GOOD
   analytics.track('note_created', { length: userNoteText.length });
   ```

2. **Use consistent event names:**
   ```typescript
   // ✅ GOOD
   'dhikr_completed'
   'screen_viewed'
   'user_logged_in'
   ```

3. **Keep properties small:**
   ```typescript
   // ✅ GOOD
   analytics.track('purchase', { amount: 9.99, currency: 'USD' });
   ```

4. **Don't await track calls:**
   ```typescript
   // ✅ GOOD (non-blocking)
   analytics.track('event');
   
   // ❌ BAD (blocks UI)
   await analytics.track('event');
   ```

## Troubleshooting

### Events not appearing in Supabase

1. Check `analytics.getStats()` - are events queued?
2. Verify Supabase RLS policies allow inserts
3. Check network connectivity
4. Verify provider is initialized

### Queue growing too large

1. Check if sync is failing (`failedSyncs` in stats)
2. Verify network connectivity
3. Check Supabase table exists and is accessible

### App crashes on analytics

This should never happen. If it does:
1. Check console for errors
2. Verify all try-catch blocks are in place
3. Report bug with stack trace

## Migration

See [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) for migration from v1.





