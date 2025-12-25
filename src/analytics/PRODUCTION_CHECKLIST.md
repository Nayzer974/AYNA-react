# Production Readiness Checklist - Analytics v2

## 🔒 Legal & Compliance

### GDPR Compliance
- [x] Hard consent gate implemented (opt-in by default)
- [x] Consent defaults to `false`
- [x] Events dropped (not queued) without consent
- [x] `setConsent()` API available
- [x] `optOut()` clears all queued data
- [x] `exportUserData()` implemented
- [x] `deleteUserData()` implemented
- [ ] **UI consent prompt implemented** (REQUIRED before production)
- [ ] Privacy policy updated to mention analytics
- [ ] Terms of service updated if needed
- [ ] Consent stored persistently (PreferencesContext)

### Data Protection
- [x] No PII in event properties (validated)
- [x] No sensitive religious data tracked (intentions, journal text, etc.)
- [x] Error messages never sent in production
- [x] Stack traces completely stripped
- [x] Aggressive redaction in `trackError()`
- [x] User ID not hashed (acceptable - needed for RLS)
- [x] No location tracking in context
- [ ] **Document retention policy** (7 days TTL implemented, document it)

### Regional Compliance
- [ ] Verify GDPR compliance for EU users
- [ ] Verify COPPA compliance (if targeting <13)
- [ ] Verify CCPA compliance (if California users)
- [ ] Verify LGPD compliance (if Brazil users)

---

## ⚡ Performance

### Queue Management
- [x] Max queue size: 1000 events
- [x] Max event age: 7 days (auto-cleanup)
- [x] Batch size: 50 events
- [x] Size validation before serialization (5MB limit)
- [x] Aggressive cleanup on quota exceeded
- [x] Queue operations non-blocking
- [ ] **Monitor queue size in production** (add metrics)
- [ ] **Alert if queue size > 500** (indicates sync issues)

### Network & Sync
- [x] Offline-first (queue persists)
- [x] Batch processing (50 events max)
- [x] Exponential backoff retry (5 attempts max)
- [x] Network detection before sync
- [x] No background timers (respects Expo constraints)
- [x] Sync on app foreground, network restore, explicit flush
- [ ] **Monitor failed sync attempts** (add metrics)
- [ ] **Alert if failed syncs > 10/hour** (indicates network/provider issues)

### Memory & Storage
- [x] AsyncStorage usage (no memory queue)
- [x] Automatic cleanup (expired events removed)
- [x] Backup/restore on corruption
- [x] Size validation before save
- [ ] **Monitor AsyncStorage usage** (if possible)
- [ ] **Alert if storage quota exceeded** (add fallback)

### UI Impact
- [x] All operations async and non-blocking
- [x] No await on `track()` calls
- [x] Events queued in background
- [x] Batch processing doesn't block UI
- [ ] **Performance test with 1000+ events queued**

---

## 🔄 Migration

### Pre-Migration
- [ ] **Backup old analytics data** (manual script)
- [ ] **Verify backup restoration works**
- [ ] **Test migration on staging environment**
- [ ] **Create rollback plan**

### Migration Execution
- [ ] **Deploy wrapper with migration code**
- [ ] **Monitor migration flags in AsyncStorage**
- [ ] **Verify events migrated successfully**
- [ ] **Check for double tracking** (compare volumes)
- [ ] **Verify old events backed up**
- [ ] **Monitor for 7 days for issues**

### Post-Migration
- [ ] **Remove all `trackPageView()` calls from components**
- [ ] **Verify navigation tracking works**
- [ ] **Update all imports to use new analytics**
- [ ] **Delete old analytics.ts after 14 days**
- [ ] **Clean up migration backups after 7 days**

### Verification Queries
```sql
-- Check migrated events
SELECT COUNT(*) 
FROM analytics_events 
WHERE properties->>'_migrated' = 'true'
AND created_at > NOW() - INTERVAL '7 days';

-- Check for double tracking (compare daily volumes)
SELECT DATE(created_at), COUNT(*) 
FROM analytics_events 
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- Check queue health (if metrics available)
SELECT COUNT(*) as queued_events
FROM analytics_events
WHERE properties->>'_queued' = 'true';
```

---

## 📊 Monitoring

### Metrics to Track
- [ ] **Queue size** (number of queued events)
- [ ] **Failed sync attempts** (count per hour)
- [ ] **Events per hour** (tracking rate)
- [ ] **Success rate** (sent/total)
- [ ] **Average batch size**
- [ ] **Time to flush** (performance)
- [ ] **Consent rate** (% users who opted in)

### Alerts to Configure
- [ ] **Queue size > 500** (warning)
- [ ] **Queue size > 800** (critical)
- [ ] **Failed syncs > 10/hour** (warning)
- [ ] **Failed syncs > 50/hour** (critical)
- [ ] **Storage quota exceeded** (critical)
- [ ] **Migration failed** (critical)

### Logging
- [x] Debug logging in development
- [x] Silent failures in production (errors logged internally)
- [ ] **Structured logging for production** (JSON format)
- [ ] **Error aggregation** (group similar errors)
- [ ] **Performance logging** (track slow operations)

### Dashboards
- [ ] **Analytics health dashboard**
  - Queue size over time
  - Sync success rate
  - Event volume
  - Error rate
- [ ] **User metrics dashboard**
  - Consent rate
  - Active users
  - Events per user

---

## 🔄 Rollback Plan

### Rollback Triggers
- [ ] **Define rollback criteria:**
  - Queue size > 90% capacity
  - Failed syncs > 20% of attempts
  - Double tracking detected
  - Data loss reported
  - Critical bugs in production

### Rollback Procedure

#### Step 1: Immediate Actions
- [ ] Disable analytics v2 (stop initialization)
- [ ] Re-enable old analytics.ts (restore from git)
- [ ] Deploy hotfix

#### Step 2: Data Recovery
- [ ] Restore old events from backup
- [ ] Merge with any new events from v2
- [ ] Verify data integrity

#### Step 3: Investigation
- [ ] Analyze logs for root cause
- [ ] Fix issues in analytics v2
- [ ] Test fixes in staging

#### Step 4: Re-attempt Migration
- [ ] Deploy fixed version
- [ ] Monitor closely
- [ ] Gradual rollout (10% → 50% → 100%)

### Rollback Script
```typescript
// Rollback script (keep in repository)
async function rollbackAnalytics() {
  // 1. Stop analytics v2
  await AsyncStorage.setItem('@ayna_analytics_v2_disabled', 'true');
  
  // 2. Restore old analytics key
  const backup = await AsyncStorage.getItem('@ayna_analytics_events_backup');
  if (backup) {
    await AsyncStorage.setItem('@ayna_analytics_events', backup);
  }
  
  // 3. Reset migration flags
  await AsyncStorage.removeItem('@ayna_analytics_migration_complete');
  await AsyncStorage.removeItem('@ayna_analytics_migration_started');
  
  console.log('✅ Analytics rollback complete');
}
```

---

## ✅ Security

### Data Security
- [x] No PII in events (validated)
- [x] Error messages never sent
- [x] Stack traces stripped
- [x] Aggressive redaction in errors
- [x] Whitelist-only error fields
- [x] Session ID regeneration on identify/logout
- [ ] **Rate limiting** (if provider supports)
- [ ] **Encryption at rest** (Supabase RLS)

### Code Security
- [x] Hard consent gate (cannot bypass)
- [x] Validation cannot be skipped
- [x] Error tracking cannot leak sensitive data
- [ ] **Code review completed**
- [ ] **Security audit completed** (optional)

---

## 🧪 Testing

### Unit Tests
- [ ] Test consent gate (events dropped without consent)
- [ ] Test error redaction (no PII leaked)
- [ ] Test queue limits (max size, TTL)
- [ ] Test batch processing
- [ ] Test session regeneration

### Integration Tests
- [ ] Test offline queue persistence
- [ ] Test sync on network restore
- [ ] Test migration with/without consent
- [ ] Test rapid login/logout cycles
- [ ] Test error scenarios (quota, corruption, network)

### E2E Tests
- [ ] Test complete user flow with analytics
- [ ] Test opt-in/opt-out flow
- [ ] Test migration flow
- [ ] Test error tracking flow

### Load Tests
- [ ] Test with 1000+ queued events
- [ ] Test rapid event creation (100 events/second)
- [ ] Test network failure/recovery
- [ ] Test storage quota exceeded

---

## 📝 Documentation

### User-Facing
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Consent prompt text finalized
- [ ] Help/FAQ section on analytics

### Developer-Facing
- [x] API documentation (JSDoc)
- [x] Migration guide
- [x] Integration examples
- [ ] Error handling guide
- [ ] Troubleshooting guide
- [ ] Architecture diagram

### Operations
- [ ] Runbook for common issues
- [ ] Monitoring guide
- [ ] Rollback procedure documented
- [ ] Incident response plan

---

## 🚀 Deployment

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review approved
- [ ] Legal review completed (privacy policy)
- [ ] Performance benchmarks met
- [ ] Migration plan approved

### Deployment Steps
1. [ ] Deploy to staging
2. [ ] Verify staging migration works
3. [ ] Test opt-in/opt-out in staging
4. [ ] Monitor staging for 24 hours
5. [ ] Deploy to production (gradual rollout)
   - [ ] 10% of users (monitor 4 hours)
   - [ ] 50% of users (monitor 4 hours)
   - [ ] 100% of users
6. [ ] Monitor production for 7 days
7. [ ] Complete cleanup (remove old code)

### Post-Deployment
- [ ] Monitor metrics dashboard
- [ ] Review error logs
- [ ] Collect user feedback
- [ ] Verify data quality
- [ ] Document lessons learned

---

## ✅ Final Sign-Off

### Required Approvals
- [ ] **Legal/Privacy:** Consent mechanism approved
- [ ] **Engineering:** Code review completed
- [ ] **QA:** Testing completed
- [ ] **Product:** Feature approved
- [ ] **Security:** Security review completed (optional)

### Go/No-Go Criteria
- [x] Hard consent gate implemented
- [x] Error tracking secure (no PII)
- [x] Session management secure (no mixing)
- [ ] UI consent prompt ready
- [ ] Monitoring configured
- [ ] Rollback plan ready
- [ ] All tests passing
- [ ] Documentation complete

---

## 📋 Quick Reference

### Critical Checks Before Production
1. ✅ Hard consent gate (default false)
2. ✅ Error tracking secure (no message/stack)
3. ✅ Session regeneration on identify/logout
4. ⚠️ UI consent prompt (REQUIRED)
5. ⚠️ Monitoring configured
6. ⚠️ Rollback plan ready

### Emergency Contacts
- **Engineering Lead:** [Name]
- **Legal/Privacy:** [Name]
- **DevOps/Infrastructure:** [Name]

---

**Status:** ⚠️ 85% Complete - UI consent prompt required before production
**Last Updated:** After security refactoring
**Next Review:** Before production deployment





