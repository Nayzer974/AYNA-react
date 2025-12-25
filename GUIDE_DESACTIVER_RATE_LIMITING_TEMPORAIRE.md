# 🚫 Guide : Désactiver temporairement le Rate Limiting

## ⚠️ ATTENTION : TEMPORAIRE UNIQUEMENT

Ce guide explique comment désactiver temporairement le rate limiting **uniquement pour les tests**. 

**⚠️ IMPORTANT : Réactiver le rate limiting en production pour la sécurité !**

## 🔧 Modifications apportées

### 1. `emailVerification.ts`

Le rate limiting de Supabase Auth est temporairement ignoré :

```typescript
// Rate limiting - TEMPORAIREMENT DÉSACTIVÉ POUR LES TESTS
// TODO: Réactiver le rate limiting en production
if (false && (errorMessage.includes('rate limit') || 
    errorMessage.includes('too many') ||
    errorCode === '429')) {
  // Code désactivé
}

// Si c'est un rate limit, on ignore l'erreur et on continue
if (errorMessage.includes('rate limit') || 
    errorMessage.includes('too many') ||
    errorCode === '429') {
  console.warn('[emailVerification] Rate limit détecté mais ignoré pour les tests');
  // On continue quand même
}
```

### 2. `send-verification-email-brevo/index.ts` (Edge Function)

Le rate limiting de `supabaseAdmin.auth.admin.generateLink` est temporairement ignoré :

```typescript
if (generateError) {
  const errorMessage = generateError.message?.toLowerCase() || '';
  if (errorMessage.includes('rate limit') || 
      errorMessage.includes('too many') ||
      errorMessage.includes('429')) {
    console.warn('[send-verification-email-brevo] Rate limit détecté mais ignoré pour les tests');
    // On continue quand même
  }
}
```

### 3. `supabase.ts` (signUp)

Le rate limiting dans le fallback Supabase est temporairement ignoré.

## ✅ Comment tester

1. **Tester l'envoi d'email de vérification** :
   - Allez dans Settings
   - Cliquez sur "Vérifier mon email"
   - Vous devriez pouvoir envoyer plusieurs emails sans erreur de rate limiting

2. **Tester l'inscription** :
   - Créez un nouveau compte
   - L'email devrait être envoyé via Brevo sans erreur de rate limiting

## 🔄 Réactiver le rate limiting en production

### Étape 1 : Réactiver dans `emailVerification.ts`

Remplacez :
```typescript
// Rate limiting - TEMPORAIREMENT DÉSACTIVÉ POUR LES TESTS
if (false && (errorMessage.includes('rate limit') || 
    errorMessage.includes('too many') ||
    errorCode === '429')) {
```

Par :
```typescript
// Rate limiting
if (errorMessage.includes('rate limit') || 
    errorMessage.includes('too many') ||
    errorCode === '429') {
  return {
    success: false,
    error: 'Trop de demandes. Veuillez patienter quelques minutes avant de réessayer.',
  };
}
```

Et supprimez le bloc qui ignore le rate limiting :
```typescript
// Supprimer ce bloc :
if (errorMessage.includes('rate limit') || 
    errorMessage.includes('too many') ||
    errorCode === '429') {
  console.warn('[emailVerification] Rate limit détecté mais ignoré pour les tests');
  // On continue quand même
}
```

### Étape 2 : Réactiver dans `send-verification-email-brevo/index.ts`

Remplacez :
```typescript
if (errorMessage.includes('rate limit') || 
    errorMessage.includes('too many') ||
    errorMessage.includes('429')) {
  console.warn('[send-verification-email-brevo] Rate limit détecté mais ignoré pour les tests');
  // On continue quand même
}
```

Par :
```typescript
if (errorMessage.includes('rate limit') || 
    errorMessage.includes('too many') ||
    errorMessage.includes('429')) {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: 'Trop de tentatives. Veuillez réessayer dans 60 minutes.' 
    }),
    { 
      status: 429, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}
```

### Étape 3 : Réactiver dans `supabase.ts`

Supprimez les blocs qui ignorent le rate limiting dans les `catch` blocks.

## 📝 Notes

- Le rate limiting est une **protection importante** contre le spam et les abus
- En production, il est **essentiel** de réactiver le rate limiting
- Le rate limiting peut venir de :
  - **Supabase Auth** : Limite le nombre d'emails envoyés par IP/utilisateur
  - **Brevo API** : Limite le nombre d'emails envoyés par compte
  - **Edge Functions** : Peut avoir des limites de requêtes

## 🔍 Vérifier les limites

### Supabase Auth
- Limite par défaut : ~3-5 emails par heure par utilisateur
- Peut être configuré dans Supabase Dashboard > Authentication > Settings

### Brevo
- Plan gratuit : 300 emails/jour
- Plan payant : Limites selon le plan
- Vérifier dans Brevo Dashboard > Settings > API Keys

---

**Dernière mise à jour :** 2025-01-27






