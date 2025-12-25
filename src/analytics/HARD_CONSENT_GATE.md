# Hard Consent Gate Implementation

## ✅ Implementation Complete

### Overview
Analytics v2 now implements a **hard consent gate** that prevents ANY event from being enqueued or persisted before explicit user consent.

---

## 🔒 Key Features

### 1. Consent Defaults to False
- ✅ `consent: false` in `DEFAULT_CONFIG`
- ✅ `private consent: boolean = false` in `Analytics` class
- ✅ No tracking occurs until `setConsent(true)` is called

### 2. Events Dropped (Not Queued) Without Consent
- ✅ `track()` checks consent **FIRST**, before any processing
- ✅ Events are **DROPPED** (not queued, not persisted) if consent is false
- ✅ Debug logging indicates when events are dropped

### 3. Clear setConsent() API
- ✅ Public method: `analytics.setConsent(true | false)`
- ✅ Aliases: `optIn()` and `optOut()` call `setConsent()`
- ✅ When consent is revoked: queue cleared, user anonymized, provider reset
- ✅ When consent is granted: tracking starts (previous events not recovered)

### 4. Migration Wrapper Respects Consent
- ✅ Migration checks consent before migrating events
- ✅ If consent is false: old events backed up but NOT migrated
- ✅ All wrapper functions (`trackEvent`, `trackPageView`) respect consent

---

## 📋 API Usage

### Set Consent

```typescript
import { analytics } from '@/analytics';

// Enable analytics (opt-in)
analytics.setConsent(true);
// or
analytics.optIn();

// Disable analytics (opt-out) - clears all data
analytics.setConsent(false);
// or
await analytics.optOut();
```

### Track Events (Respects Consent)

```typescript
// This will be DROPPED if consent is false
analytics.track('dhikr_completed', { count: 33 });

// This will be DROPPED if consent is false
analytics.screen('Home');
```

### Check Consent Status

```typescript
const hasConsent = analytics.getConsent();
```

---

## 🔍 Consent Check Order

All methods check consent in this order:

1. **track()**: Consent checked FIRST, before validation/enqueue
2. **screen()**: Calls track(), so consent checked automatically
3. **identify()**: User ID set, but identify event only tracked if consent = true
4. **flush()**: Only flushes if consent = true

---

## 🚨 Behavior Without Consent

| Operation | Without Consent | With Consent |
|-----------|----------------|--------------|
| `track()` | ✅ Event **DROPPED** (not queued) | ✅ Event queued |
| `screen()` | ✅ Event **DROPPED** (not queued) | ✅ Event queued |
| `identify()` | ✅ User ID set, event **DROPPED** | ✅ User ID set, event tracked |
| `flush()` | ✅ **SKIPPED** (nothing sent) | ✅ Queue flushed |
| Migration | ✅ Events **NOT migrated** (backed up only) | ✅ Events migrated |

---

## 📊 Migration Behavior

### With Consent
```
Old events → Migrated to v2 → Queued → Synced
```

### Without Consent
```
Old events → Backed up → NOT migrated → NOT queued → NOT synced
```

**Important:** Old events are backed up but never migrated if consent is false.

---

## ✅ Verification Checklist

- [x] Consent defaults to `false`
- [x] `track()` checks consent FIRST
- [x] Events dropped (not queued) without consent
- [x] `setConsent()` API implemented
- [x] `getConsent()` API implemented
- [x] `optOut()` clears queue and resets state
- [x] `optIn()` enables tracking
- [x] Migration respects consent
- [x] Wrapper functions respect consent
- [x] Debug logging for dropped events

---

## 🧪 Testing

### Test 1: Events Dropped Without Consent
```typescript
analytics.initialize();
// consent = false by default

analytics.track('test_event', { test: true });
// Expected: Event DROPPED, debug log shows "DROPPED - no user consent"
// Queue should remain empty
```

### Test 2: Events Tracked With Consent
```typescript
analytics.initialize();
analytics.setConsent(true);

analytics.track('test_event', { test: true });
// Expected: Event queued and tracked
```

### Test 3: Consent Revocation
```typescript
analytics.setConsent(true);
analytics.track('event1', {}); // Queued

analytics.setConsent(false);
analytics.track('event2', {}); // Dropped

// Expected: Only event1 in queue, event2 not queued
```

### Test 4: Migration Without Consent
```typescript
// Old events exist in AsyncStorage
analytics.initialize();
// consent = false

// Migration runs
// Expected: Old events backed up but NOT migrated
// Queue should remain empty
```

---

## 🔒 GDPR Compliance

This implementation ensures:
- ✅ **No tracking without consent** (hard gate)
- ✅ **Opt-in by default** (consent = false)
- ✅ **Data cleared on opt-out** (queue cleared)
- ✅ **Migration respects consent** (old events not migrated without consent)

---

**Status:** ✅ Hard consent gate fully implemented
**Last Updated:** After implementation





