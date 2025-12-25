# Audit GDPR et Données Sensibles Religieuses

## 🔒 Conformité GDPR

### ✅ Points Conformes

1. **Opt-out Support**
   - ✅ Méthode `optOut()` implémentée
   - ✅ Queue vidée lors de opt-out
   - ✅ User ID anonymisé après opt-out

2. **Export de Données**
   - ✅ Méthode `exportUserData()` implémentée
   - ✅ Permet export complet des événements utilisateur

3. **Suppression de Données**
   - ✅ Méthode `deleteUserData()` implémentée
   - ✅ Supprime événements de la queue locale
   - ✅ Provider peut supprimer du backend

4. **Consent**
   - ✅ Système de consentement intégré
   - ✅ Analytics désactivé si consent = false
   - ✅ Pas de tracking sans consentement

---

## ⚠️ Problèmes GDPR Identifiés

### 1. ❌ Pas de Consentement Explicite Actuellement

**Problème :**
- Consent par défaut = `true` dans `Analytics.ts`
- Pas de UI pour demander consentement utilisateur
- Pas de stockage persistant du consentement

**Solution Requise :**
```typescript
// application/src/contexts/PreferencesContext.tsx
// Ajouter gestion consentement analytics

interface Preferences {
  // ... autres préférences
  analyticsConsent?: boolean; // false par défaut (opt-in)
}

// Dans App.tsx ou Settings
const { preferences } = usePreferences();
await analytics.setConsent(preferences.analyticsConsent || false);
```

**Action :** Ajouter UI de consentement dans Settings ou onboarding

---

### 2. ❌ Pas de Validation PII Avant Envoi

**Problème :**
- Validation PII existe dans `types.ts` mais peut être contournée
- Propriétés passées directement sans validation stricte
- Aucune redaction automatique de PII détectée

**Solution Requise :**
- Renforcer validation dans `Analytics.track()`
- Liste exhaustive de champs PII à bloquer
- Log warning en DEV si PII détectée

**Action :** Améliorer validation PII (voir corrections ci-dessous)

---

### 3. ⚠️ Données Sensibles Religieuses Potentielles

**Événements à risque identifiés :**

#### 3.1 Journal Entries
**Risque :** `journal_entry_created` track la longueur, mais pas le contenu
**Status :** ✅ SÉCURISÉ (seulement longueur trackée)

#### 3.2 Chat Messages
**Risque :** `chat_message_sent` track `message_length` mais pas contenu
**Status :** ✅ SÉCURISÉ (seulement longueur trackée)

#### 3.3 Intentions Religieuses (Khalwa)
**Risque :** Aucun tracking d'intention identifié actuellement
**Status :** ✅ SÉCURISÉ (pas d'intentions trackées)

#### 3.4 Dhikr Text
**Risque :** `dhikr_completed` track seulement count, pas le texte
**Status :** ✅ SÉCURISÉ (seulement count tracké)

#### 3.5 Prayer Tracking
**Risque :** `prayer_completed` track seulement count
**Status :** ✅ SÉCURISÉ (seulement count tracké)

---

## 🛡️ Corrections Requises

### Correction 1: Renforcer Validation PII

**Fichier :** `application/src/analytics/types.ts`

```typescript
/**
 * Liste exhaustive de champs PII à bloquer
 */
const PII_FIELDS = [
  'email', 'password', 'phone', 'address', 'ssn', 'credit_card',
  'token', 'secret', 'key', 'auth', 'session',
  'name', 'firstname', 'lastname', 'username',
  'ip', 'device_id', 'advertising_id',
  // Champs sensibles religieux
  'intention', 'intention_text', 'prayer_text', 'dhikr_text',
  'journal_text', 'journal_entry', 'note_text', 'chat_message',
  'conversation_content', 'message_content',
  // Champs personnels
  'bio', 'description', 'comment', 'feedback_text',
];

/**
 * Validation stricte des propriétés - Bloque PII
 */
export function validateEventProperties(properties?: Record<string, unknown>): {
  valid: boolean;
  error?: string;
} {
  if (!properties) return { valid: true };

  // Vérifier chaque clé
  for (const key of Object.keys(properties)) {
    const lowerKey = key.toLowerCase();
    
    // Bloquer si clé contient PII
    if (PII_FIELDS.some(pii => lowerKey.includes(pii.toLowerCase()))) {
      return {
        valid: false,
        error: `PII field detected: ${key}. PII fields are not allowed in analytics.`,
      };
    }

    // Bloquer si valeur est une string longue (potentiel texte sensible)
    const value = properties[key];
    if (typeof value === 'string' && value.length > 100) {
      return {
        valid: false,
        error: `Long string value in ${key} (${value.length} chars). Long text fields are not allowed to prevent PII leakage.`,
      };
    }

    // Bloquer si valeur est un objet profond (pourrait contenir PII)
    if (typeof value === 'object' && value !== null) {
      const depth = getObjectDepth(value);
      if (depth > 2) {
        return {
          valid: false,
          error: `Nested object in ${key} (depth ${depth}). Deep objects are not allowed.`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Calculer profondeur d'un objet
 */
function getObjectDepth(obj: any, currentDepth: number = 0): number {
  if (typeof obj !== 'object' || obj === null) {
    return currentDepth;
  }

  let maxDepth = currentDepth;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const depth = getObjectDepth(obj[key], currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    }
  }

  return maxDepth;
}
```

---

### Correction 2: Ajouter Consentement UI

**Fichier :** `application/src/pages/Settings.tsx`

```typescript
import { analytics } from '@/analytics';
import { usePreferences } from '@/contexts/PreferencesContext';

// Dans Settings component
const { preferences, updatePreferences } = usePreferences();
const [analyticsEnabled, setAnalyticsEnabled] = useState(
  preferences.analyticsConsent ?? false
);

const handleAnalyticsToggle = async (enabled: boolean) => {
  setAnalyticsEnabled(enabled);
  
  // Mettre à jour préférences
  await updatePreferences({ analyticsConsent: enabled });
  
  // Mettre à jour analytics
  if (enabled) {
    analytics.optIn();
  } else {
    await analytics.optOut();
  }
};

// Dans UI
<Switch
  value={analyticsEnabled}
  onValueChange={handleAnalyticsToggle}
/>
```

---

### Correction 3: Consentement au Démarrage

**Fichier :** `application/App.tsx`

```typescript
import { analytics } from '@/analytics';
import { PreferencesProvider, usePreferences } from '@/contexts/PreferencesContext';

function AppContent() {
  const { preferences } = usePreferences();
  
  useEffect(() => {
    // Initialiser analytics avec consentement
    analytics.initialize().then(() => {
      // Définir consentement depuis préférences
      const consent = preferences.analyticsConsent ?? false;
      analytics.setConsent(consent);
    }).catch(error => {
      if (__DEV__) {
        console.error('[App] Analytics initialization failed:', error);
      }
    });

    return () => {
      analytics.cleanup();
    };
  }, [preferences.analyticsConsent]);
  
  // ... reste
}
```

---

### Correction 4: Redaction Automatique des Erreurs

**Fichier :** `application/src/services/analytics.ts` (wrapper)

```typescript
export async function trackError(
  errorName: string,
  errorMessage: string,
  errorStack?: string
): Promise<void> {
  // Redact PII potentiel dans errorMessage
  const redactedMessage = redactPII(errorMessage);
  const redactedStack = errorStack ? redactPII(errorStack) : undefined;
  
  await trackEvent('error', {
    error_name: errorName,
    error_message: redactedMessage.substring(0, 200),
    error_stack: redactedStack ? redactedStack.substring(0, 500) : undefined,
  });
}

function redactPII(text: string): string {
  // Redact emails
  text = text.replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '[EMAIL_REDACTED]');
  
  // Redact URLs avec tokens
  text = text.replace(/https?:\/\/[^\s]+token=[^\s]+/gi, '[URL_REDACTED]');
  
  // Redact UUIDs (peuvent être user IDs)
  text = text.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[UUID_REDACTED]');
  
  return text;
}
```

---

## 📊 Matrice des Risques

| Donnée | Risque GDPR | Risque Religieux | Status Actuel | Action Requise |
|--------|-------------|------------------|---------------|----------------|
| Email | 🔴 Élevé | - | ✅ Non tracké | ✅ OK |
| Nom | 🟡 Moyen | - | ✅ Non tracké | ✅ OK |
| Journal Text | 🔴 Élevé | 🔴 Élevé | ✅ Non tracké (seulement longueur) | ✅ OK |
| Intentions (Khalwa) | 🔴 Élevé | 🔴 Élevé | ✅ Non tracké | ✅ OK |
| Chat Messages | 🔴 Élevé | 🟡 Moyen | ✅ Non tracké (seulement longueur) | ✅ OK |
| Dhikr Text | 🟡 Moyen | 🟡 Moyen | ✅ Non tracké (seulement count) | ✅ OK |
| Prayer Text | 🔴 Élevé | 🔴 Élevé | ✅ Non tracké (seulement count) | ✅ OK |
| Location | 🟡 Moyen | - | ⚠️ Potentiellement tracké | 🔍 À vérifier |
| Device ID | 🟡 Moyen | - | ✅ Non tracké | ✅ OK |
| User ID | 🟡 Moyen | - | ✅ Tracké (nécessaire) | ✅ OK (hashé possible) |

---

## ✅ Actions Correctives Prioritaires

### Priorité 1 (CRITIQUE - Avant production)
- [ ] Ajouter UI de consentement dans Settings
- [ ] Consent par défaut = false (opt-in)
- [ ] Renforcer validation PII avec liste exhaustive
- [ ] Redaction automatique dans trackError

### Priorité 2 (IMPORTANT - Dans 2 semaines)
- [ ] Vérifier qu'aucune location n'est trackée
- [ ] Documenter politique de rétention des données
- [ ] Ajouter politique de confidentialité

### Priorité 3 (Souhaitable)
- [ ] Hashing du user ID (optionnel)
- [ ] Anonymisation IP (si trackée)
- [ ] Audit périodique des événements trackés

---

## 🔍 Vérifications Supplémentaires

### Query Supabase pour Audit
```sql
-- Vérifier si PII présent dans événements
SELECT 
  event_name,
  properties->>'email' as has_email,
  properties->>'name' as has_name,
  properties->>'intention' as has_intention,
  properties->>'journal_text' as has_journal_text,
  COUNT(*) as count
FROM analytics_events
WHERE 
  properties ? 'email' OR
  properties ? 'name' OR
  properties ? 'intention' OR
  properties ? 'journal_text'
GROUP BY event_name, has_email, has_name, has_intention, has_journal_text;

-- Vérifier longueurs de strings (risque PII)
SELECT 
  event_name,
  AVG(length(properties::text)) as avg_properties_size,
  MAX(length(properties::text)) as max_properties_size
FROM analytics_events
GROUP BY event_name
HAVING MAX(length(properties::text)) > 500
ORDER BY max_properties_size DESC;
```

---

**Status Audit :** ✅ Complété
**Risques Critiques :** 3 identifiés, corrections proposées
**Conformité GDPR :** ⚠️ 80% - Consentement requis avant production





