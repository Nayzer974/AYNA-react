# 📧 Guide : Configuration Email - Supabase vs Brevo

## 🎯 Stratégie Recommandée

**Garder Supabase ET Brevo actifs** - Brevo en priorité, Supabase en fallback.

## ✅ Pourquoi garder Supabase actif ?

1. **Fallback automatique** : Si Brevo échoue, Supabase prend le relais
2. **Sécurité** : Double protection contre les pannes
3. **Fiabilité** : Les emails seront toujours envoyés
4. **Pas de configuration supplémentaire** : Le code gère automatiquement

## 🔄 Comment ça fonctionne actuellement

### Flux d'envoi d'email de vérification

1. **Si `useBrevo: true`** :
   - ✅ Essaie d'envoyer via Brevo (Edge Function `send-verification-email-brevo`)
   - ✅ Si Brevo réussit → Email envoyé ✅
   - ✅ Si Brevo échoue → Fallback automatique vers Supabase

2. **Si `useBrevo: false`** :
   - ✅ Utilise uniquement Supabase (comportement par défaut)

### Flux d'inscription

**✅ MODIFIÉ : Le code utilise maintenant Brevo lors de l'inscription si activé**

Lors de l'inscription (`signUpWithSupabase`) :

1. **Si `useBrevo: true`** :
   - ✅ Supabase **ne** envoie **pas** l'email automatiquement
   - ✅ Le code envoie l'email via Brevo après l'inscription réussie
   - ✅ Si Brevo échoue → Fallback automatique vers Supabase

2. **Si `useBrevo: false`** :
   - ✅ Supabase envoie l'email automatiquement (comportement par défaut)

**Avantages :**
- ✅ Pas de doublons d'emails
- ✅ Templates personnalisés via Brevo dès l'inscription
- ✅ Fallback automatique si Brevo échoue

## 🔧 Configuration Supabase Dashboard

### ✅ Option Recommandée : Ne rien changer

**Le code gère automatiquement l'envoi via Brevo lors de l'inscription si activé.**

**Comportement :**
- ✅ Si `useBrevo: true` : Le code désactive l'envoi automatique de Supabase et utilise Brevo
- ✅ Si `useBrevo: false` : Supabase envoie l'email automatiquement
- ✅ Fallback automatique vers Supabase si Brevo échoue

**Avantages :**
- ✅ Pas de configuration supplémentaire dans Supabase Dashboard
- ✅ Pas de doublons d'emails
- ✅ Fallback automatique si Brevo échoue
- ✅ Templates personnalisés via Brevo

### Option Alternative : Désactiver manuellement dans Supabase Dashboard

Si vous voulez forcer l'utilisation de Brevo uniquement (sans fallback) :

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Authentication** > **Settings**
4. Désactivez **"Enable email confirmations"** (pour l'inscription)
5. Désactivez **"Enable email change confirmations"** (pour le changement d'email)

**⚠️ Attention :** Cette option désactive complètement le fallback. Si Brevo échoue, aucun email ne sera envoyé.

## 🎯 Recommandation Finale

### Pour la Production

**Configuration automatique (Recommandé)** :
1. ✅ **Activer Brevo** (`EXPO_PUBLIC_USE_BREVO=true`)
2. ✅ **Le code gère automatiquement** :
   - Inscription → Brevo (avec fallback Supabase)
   - Vérification manuelle (Settings) → Brevo (avec fallback Supabase)
   - Réinitialisation mot de passe → Brevo (avec fallback Supabase)
3. ✅ **Ne rien changer dans Supabase Dashboard** - Le code désactive automatiquement l'envoi si Brevo est activé

**Avantages :**
- ✅ Pas de doublons d'emails
- ✅ Templates personnalisés via Brevo
- ✅ Fallback automatique si Brevo échoue
- ✅ Configuration minimale

### Pour le Développement

Vous pouvez désactiver Brevo (`EXPO_PUBLIC_USE_BREVO=false`) pour utiliser uniquement Supabase.

## 📝 Code Actuel

Le code actuel gère déjà les deux cas :

```typescript
// Dans emailVerification.ts
if (APP_CONFIG.useBrevo && APP_CONFIG.supabaseUrl) {
  // Essaie Brevo d'abord
  // Si échec, fallback vers Supabase
}
// Sinon, utilise Supabase directement
```

## ✅ Checklist

- [ ] Décider de la stratégie (hybride ou Brevo uniquement)
- [ ] Si hybride : Ne rien changer dans Supabase Dashboard
- [ ] Si Brevo uniquement : Désactiver "Enable email confirmations" dans Supabase
- [ ] Tester l'inscription
- [ ] Tester la vérification d'email manuelle
- [ ] Tester la réinitialisation de mot de passe
- [ ] Vérifier les statistiques dans Brevo Dashboard

---

**Dernière mise à jour :** 2025-01-27

