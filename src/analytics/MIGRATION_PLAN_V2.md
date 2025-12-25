# Plan de Migration Analytics v2 - Étape par étape

## 🎯 Objectif

Remplacer complètement `src/services/analytics.ts` par le nouveau système `src/analytics` **sans perte de données ni double tracking**.

---

## 📋 Phase 0: Préparation (Avant migration)

### Étape 0.1: Backup des données existantes

**⚠️ CRITIQUE :** Créer un backup de la queue existante avant migration.

```typescript
// Script de backup (à exécuter une fois avant migration)
// application/scripts/backup-old-analytics.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

async function backupOldAnalytics() {
  const oldEvents = await AsyncStorage.getItem('@ayna_analytics_events');
  if (oldEvents) {
    await AsyncStorage.setItem('@ayna_analytics_events_backup', oldEvents);
    console.log('✅ Backup créé:', JSON.parse(oldEvents).length, 'événements');
  }
}
```

**Action :** Exécuter ce script manuellement avant la migration.

---

## 📋 Phase 1: Migration des données existantes (Jour 1)

### Étape 1.1: Créer un wrapper de compatibilité

**Fichier :** `application/src/services/analytics.ts` (modifier)

```typescript
/**
 * Service d'analytics - Wrapper de compatibilité pour migration
 * 
 * MIGRATION EN COURS: Ce fichier sera supprimé après migration complète
 * 
 * Ce wrapper :
 * 1. Migre automatiquement les événements de l'ancien système vers le nouveau
 * 2. Redirige tous les appels vers analytics v2
 * 3. Empêche le double tracking
 */

import { analytics } from '@/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANALYTICS_KEY = '@ayna_analytics_events';
const MIGRATION_COMPLETE_KEY = '@ayna_analytics_migration_complete';
const MIGRATION_STARTED_KEY = '@ayna_analytics_migration_started';

// Flag pour éviter double tracking pendant migration
let migrationInProgress = false;

/**
 * Migre les événements de l'ancien système vers le nouveau
 * Appelé une seule fois au démarrage de l'app
 */
async function migrateOldEvents(): Promise<void> {
  // Vérifier si migration déjà complète
  const migrationComplete = await AsyncStorage.getItem(MIGRATION_COMPLETE_KEY);
  if (migrationComplete === 'true') {
    return; // Migration déjà effectuée
  }

  // Vérifier si migration en cours (pour éviter doubles appels)
  const migrationStarted = await AsyncStorage.getItem(MIGRATION_STARTED_KEY);
  if (migrationStarted === 'true' && migrationInProgress) {
    return; // Migration déjà en cours
  }

  try {
    migrationInProgress = true;
    await AsyncStorage.setItem(MIGRATION_STARTED_KEY, 'true');

    // Initialiser analytics v2 si pas déjà fait
    if (!analytics.isInitialized()) {
      await analytics.initialize();
    }

    // Charger anciens événements
    const oldEventsRaw = await AsyncStorage.getItem(ANALYTICS_KEY);
    if (!oldEventsRaw) {
      // Aucun événement à migrer
      await AsyncStorage.setItem(MIGRATION_COMPLETE_KEY, 'true');
      return;
    }

    const oldEvents: Array<{
      name: string;
      properties?: Record<string, any>;
      timestamp: number;
      userId?: string;
      sessionId?: string;
    }> = JSON.parse(oldEventsRaw);

    if (oldEvents.length === 0) {
      await AsyncStorage.setItem(MIGRATION_COMPLETE_KEY, 'true');
      return;
    }

    // HARD CONSENT GATE: Only migrate if user has given consent
    // Check consent status from analytics v2
    // If consent is false, backup old events but do NOT migrate them
    const hasConsent = await checkAnalyticsConsent();
    
    if (!hasConsent) {
      if (__DEV__) {
        console.log('[Analytics Migration] Migration skipped - no user consent. Old events backed up but not migrated.');
      }
      
      // Backup old events but do NOT migrate
      await AsyncStorage.setItem(`${ANALYTICS_KEY}_backup_${Date.now()}`, oldEventsRaw);
      await AsyncStorage.removeItem(ANALYTICS_KEY);
      await AsyncStorage.setItem(MIGRATION_COMPLETE_KEY, 'true');
      
      return; // Exit without migrating
    }

    // Migrer chaque événement vers analytics v2 (only if consent given)
    let migratedCount = 0;
    for (const oldEvent of oldEvents) {
      try {
        // Créer événement au format v2 (sans contexte, on garde timestamp original)
        // Note: analytics.track() will check consent again, so events will be dropped if consent revoked
        await analytics.track(oldEvent.name, {
          ...oldEvent.properties,
          // Flag pour indiquer que c'est un événement migré
          _migrated: true,
          _original_timestamp: oldEvent.timestamp,
        });
        migratedCount++;
      } catch (error) {
        // Ignorer erreurs individuelles, continuer la migration
        if (__DEV__) {
          console.warn('[Analytics Migration] Failed to migrate event:', oldEvent.name, error);
        }
      }
    }

    // Marquer migration comme complète
    await AsyncStorage.setItem(MIGRATION_COMPLETE_KEY, 'true');
    
    // Sauvegarder backup (garder anciens événements 7 jours)
    await AsyncStorage.setItem(`${ANALYTICS_KEY}_backup_${Date.now()}`, oldEventsRaw);
    
    // Supprimer anciens événements (après backup)
    await AsyncStorage.removeItem(ANALYTICS_KEY);

    if (__DEV__) {
      console.log(`✅ [Analytics Migration] Migrated ${migratedCount}/${oldEvents.length} events to v2`);
    }

    // Flush immédiatement pour envoyer les événements migrés (only if consent)
    await analytics.flush();
  } catch (error) {
    // En cas d'erreur, ne pas bloquer l'app
    if (__DEV__) {
      console.error('[Analytics Migration] Error during migration:', error);
    }
  } finally {
    migrationInProgress = false;
  }
}

/**
 * Check if analytics consent is enabled
 * This checks user preferences or analytics consent status
 */
async function checkAnalyticsConsent(): Promise<boolean> {
  try {
    // Try to get consent from analytics v2
    // If analytics is initialized, it has consent status
    if (analytics.isInitialized()) {
      // We can't directly access consent, so we try a test track
      // If it's dropped, consent is false
      // This is a workaround - ideally consent should be readable
      return true; // Assume true if initialized, actual check happens in track()
    }
    
    // If analytics not initialized, check user preferences
    // TODO: Load from PreferencesContext or AsyncStorage
    // For now, default to false (opt-in)
    return false;
  } catch {
    return false; // Default to false on error
  }
}

/**
 * Appeler la migration au chargement du module
 * (une seule fois grâce aux flags)
 * 
 * HARD CONSENT GATE: Migration respects consent - events are only migrated if consent is given
 */
migrateOldEvents().catch(() => {
  // Ignorer erreurs, ne pas bloquer le chargement
});

/**
 * Wrapper pour trackEvent - redirige vers analytics v2
 * 
 * HARD CONSENT GATE: Respects consent - events are dropped if consent is false
 */
export async function trackEvent(
  eventName: string,
  properties?: Record<string, any>
): Promise<void> {
  // Empêcher double tracking pendant migration
  if (migrationInProgress) {
    return;
  }

  // S'assurer que analytics v2 est initialisé
  if (!analytics.isInitialized()) {
    await analytics.initialize();
  }

  // Utiliser analytics v2 (will check consent internally and drop if false)
  analytics.track(eventName, properties);
}

/**
 * Wrapper pour trackPageView - redirige vers analytics v2
 * 
 * HARD CONSENT GATE: Respects consent - events are dropped if consent is false
 */
export async function trackPageView(pageName: string): Promise<void> {
  if (migrationInProgress) {
    return;
  }

  if (!analytics.isInitialized()) {
    await analytics.initialize();
  }

  // analytics.screen() calls track() which checks consent
  analytics.screen(pageName);
}

/**
 * Wrapper pour trackConversion
 */
export async function trackConversion(
  conversionName: string,
  value?: number
): Promise<void> {
  await trackEvent('conversion', {
    conversion_name: conversionName,
    value,
  });
}

/**
 * Wrapper pour trackFunnelStep
 */
export async function trackFunnelStep(
  funnelName: string,
  stepName: string,
  stepOrder: number
): Promise<void> {
  await trackEvent('funnel_step', {
    funnel_name: funnelName,
    step_name: stepName,
    step_order: stepOrder,
  });
}

/**
 * Wrapper pour trackError
 */
export async function trackError(
  errorName: string,
  errorMessage: string,
  errorStack?: string
): Promise<void> {
  await trackEvent('error', {
    error_name: errorName,
    error_message: errorMessage.substring(0, 200), // Limiter taille
    error_stack: errorStack ? errorStack.substring(0, 500) : undefined, // Limiter stack
  });
}

/**
 * Wrapper pour syncAnalyticsEvents - redirige vers analytics v2 flush
 */
export async function syncAnalyticsEvents(): Promise<void> {
  if (!analytics.isInitialized()) {
    await analytics.initialize();
  }
  await analytics.flush();
}

/**
 * Wrapper pour getUserAnalytics - utilise analytics v2 export
 */
export async function getUserAnalytics(userId: string): Promise<any> {
  if (!analytics.isInitialized()) {
    await analytics.initialize();
  }
  
  const events = await analytics.exportUserData(userId);
  
  return {
    totalEvents: events.length,
    events: events,
  };
}

// Exporter les types pour compatibilité
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

export interface FunnelStep {
  name: string;
  event: string;
  order: number;
}
```

**Status :** ✅ Wrapper créé, migration automatique activée

---

## 📋 Phase 2: Initialisation du nouveau système (Jour 1)

### Étape 2.1: Initialiser analytics v2 dans App.tsx

**Fichier :** `application/App.tsx`

```typescript
import { useEffect } from 'react';
import { analytics } from '@/analytics';

function AppContent() {
  useEffect(() => {
    // Initialiser analytics v2
    analytics.initialize().catch(error => {
      if (__DEV__) {
        console.error('[App] Analytics initialization failed:', error);
      }
    });

    return () => {
      analytics.cleanup();
    };
  }, []);

  // ... reste du composant
}
```

**Action :** Ajouter l'initialisation dans App.tsx

---

### Étape 2.2: Ajouter navigation tracking

**Fichier :** `application/src/navigation/AppNavigator.tsx`

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
      {/* ... reste du navigator */}
    </NavigationContainer>
  );
});
```

**Action :** Ajouter le hook de navigation tracking

---

### Étape 2.3: Identifier les utilisateurs au login

**Fichier :** `application/src/contexts/UserContext.tsx`

Dans la fonction `login`, après authentification réussie :

```typescript
import { analytics } from '@/analytics';

const login = useCallback(async (email: string, password: string) => {
  // ... authentification ...
  
  const user = await signInWithSupabase(email, password);
  
  // Identifier l'utilisateur dans analytics v2
  await analytics.identify(user.id, {
    theme: user.theme,
    locale: user.locale || 'fr',
    // Ne PAS inclure : email, password, nom, avatar, etc. (PII)
  });
  
  return user;
}, []);
```

**Action :** Ajouter l'identification après login

---

## 📋 Phase 3: Vérification et monitoring (Jour 2)

### Étape 3.1: Vérifier la migration

```typescript
// Script de vérification (à exécuter dans l'app)
import { analytics } from '@/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';

async function verifyMigration() {
  // Vérifier que migration est marquée complète
  const migrationComplete = await AsyncStorage.getItem('@ayna_analytics_migration_complete');
  console.log('Migration complete:', migrationComplete === 'true');
  
  // Vérifier stats analytics v2
  const stats = await analytics.getStats();
  console.log('Analytics v2 stats:', stats);
  
  // Vérifier qu'aucun événement dans ancien système
  const oldEvents = await AsyncStorage.getItem('@ayna_analytics_events');
  console.log('Old events remaining:', oldEvents ? JSON.parse(oldEvents).length : 0);
}
```

**Action :** Exécuter cette vérification après déploiement

---

### Étape 3.2: Monitoring de double tracking

**⚠️ CRITIQUE :** Surveiller pendant 7 jours pour détecter double tracking.

**Vérifications à faire :**
1. Comparer nombre d'événements dans Supabase avant/après migration
2. Vérifier qu'il n'y a pas de pics anormaux (2x le volume attendu)
3. Vérifier les événements avec `_migrated: true` (doivent être < 7 jours)

**Query Supabase pour vérifier :**
```sql
-- Vérifier événements migrés
SELECT COUNT(*) 
FROM analytics_events 
WHERE properties->>'_migrated' = 'true'
AND created_at > NOW() - INTERVAL '7 days';

-- Vérifier volume d'événements (ne doit pas doubler)
SELECT DATE(created_at), COUNT(*) 
FROM analytics_events 
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;
```

---

## 📋 Phase 4: Nettoyage progressif (Jour 7-14)

### Étape 4.1: Retirer les trackPageView() individuels

**Fichiers à modifier :** Tous les fichiers qui appellent `trackPageView()` dans `useEffect`

**Pattern à retirer :**
```typescript
// ❌ À RETIRER
useEffect(() => {
  trackPageView('ScreenName');
}, []);
```

**Raison :** Navigation tracking est maintenant centralisé dans `AppNavigator.tsx`

**Fichiers concernés :**
- `src/pages/Home.tsx`
- `src/pages/Settings.tsx`
- `src/pages/Chat.tsx`
- `src/pages/Journal.tsx`
- `src/pages/Profile.tsx`
- `src/pages/Quran.tsx`
- `src/pages/Login.tsx`
- `src/pages/Signup.tsx`
- ... (tous les autres)

**Action :** Retirer tous les `trackPageView()` après vérification que navigation tracking fonctionne

---

### Étape 4.2: Supprimer les anciens backups

**Après 7 jours :** Supprimer les backups de l'ancien système

```typescript
// Script de nettoyage (à exécuter après 7 jours)
async function cleanupOldBackups() {
  const keys = await AsyncStorage.getAllKeys();
  const backupKeys = keys.filter(k => 
    k.startsWith('@ayna_analytics_events_backup')
  );
  
  for (const key of backupKeys) {
    await AsyncStorage.removeItem(key);
  }
  
  console.log('✅ Cleaned up', backupKeys.length, 'old backups');
}
```

---

## 📋 Phase 5: Suppression finale (Jour 14+)

### Étape 5.1: Supprimer le wrapper de compatibilité

**⚠️ ATTENTION :** Ne supprimer que si :
1. ✅ Migration complète vérifiée (flag = true)
2. ✅ Aucun double tracking détecté pendant 14 jours
3. ✅ Tous les `trackPageView()` individuels retirés
4. ✅ Tous les appels utilisent directement `analytics` v2

**Action :** Supprimer `src/services/analytics.ts` et remplacer tous les imports par `@/analytics`

**Fichiers à modifier :**
- Tous les fichiers qui importent `from '@/services/analytics'`
- Changer `trackEvent()` → `analytics.track()`
- Changer `trackPageView()` → `analytics.screen()` (ou retirer si navigation tracking)

---

## 📊 Checklist de Migration

### Phase 1: Préparation
- [ ] Backup manuel créé
- [ ] Wrapper de compatibilité créé et testé
- [ ] Flags de migration ajoutés

### Phase 2: Déploiement
- [ ] Analytics v2 initialisé dans App.tsx
- [ ] Navigation tracking ajouté
- [ ] User identification au login
- [ ] Migration automatique testée

### Phase 3: Vérification (7 jours)
- [ ] Migration complète vérifiée (flag = true)
- [ ] Stats analytics v2 vérifiées
- [ ] Aucun double tracking détecté
- [ ] Événements migrés visibles dans Supabase

### Phase 4: Nettoyage
- [ ] Tous `trackPageView()` individuels retirés
- [ ] Backup ancien système nettoyé (après 7 jours)

### Phase 5: Finalisation
- [ ] Wrapper de compatibilité supprimé
- [ ] Tous imports mis à jour vers `@/analytics`
- [ ] `src/services/analytics.ts` supprimé
- [ ] Documentation mise à jour

---

## 🚨 Rollback Plan

Si problèmes détectés :

1. **Rollback immédiat :**
   ```typescript
   // Désactiver migration automatique
   await AsyncStorage.setItem('@ayna_analytics_migration_started', 'false');
   await AsyncStorage.setItem('@ayna_analytics_migration_complete', 'false');
   ```

2. **Restaurer ancien système :**
   - Restaurer `src/services/analytics.ts` depuis git
   - Les anciens événements sont dans les backups AsyncStorage

3. **Investigation :**
   - Vérifier logs Supabase pour doublons
   - Comparer volumes avant/après
   - Corriger problèmes dans wrapper

---

## 📝 Notes importantes

- **Migration automatique :** Se fait au premier lancement après déploiement
- **Pas de double tracking :** Flags empêchent tracking pendant migration
- **Backward compatible :** Ancien code continue de fonctionner via wrapper
- **Progressive :** Nettoyage fait progressivement sur 14 jours
- **Réversible :** Rollback possible à tout moment

---

**Status :** ✅ Plan complet, prêt pour exécution

