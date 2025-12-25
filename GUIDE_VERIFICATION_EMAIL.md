# 📧 Guide : Système de Vérification d'Email

## 🎯 Vue d'ensemble

Le système de vérification d'email permet :
1. **À l'inscription** : Envoi automatique d'un email de confirmation
2. **Depuis les paramètres** : Possibilité pour un utilisateur non vérifié de demander un nouvel email de vérification

**Important** : Les utilisateurs peuvent utiliser l'application même si leur email n'est pas vérifié. La vérification est optionnelle mais recommandée.

---

## 🔧 Fonctionnement

### 1. À l'inscription

Quand un utilisateur crée un compte via `Signup.tsx` :
- Un email de confirmation est **automatiquement envoyé** par Supabase
- L'utilisateur peut utiliser l'application immédiatement (pas de blocage)
- L'email contient un lien de vérification qui pointe vers `verify-email.html`

**Code concerné :**
- `src/services/supabase.ts` → `signUpWithSupabase()`
- `src/pages/Signup.tsx` → `handleSubmit()`

### 2. Depuis les paramètres

Un utilisateur non vérifié peut :
- Aller dans **Paramètres** → **Vérification Email**
- Cliquer sur **"Vérifier l'adresse email"**
- Recevoir un nouvel email de confirmation

**Code concerné :**
- `src/pages/Settings.tsx` → `handleVerifyEmail()`
- `src/services/emailVerification.ts` → `sendVerificationEmail()`

---

## 📁 Fichiers créés/modifiés

### Nouveau fichier
- ✅ `src/services/emailVerification.ts` - Service dédié pour la vérification d'email

### Fichiers modifiés
- ✅ `src/services/supabase.ts` - Envoi automatique de l'email à l'inscription
- ✅ `src/pages/Settings.tsx` - Utilisation du service dédié
- ✅ `src/components/EmailVerificationModal.tsx` - Utilisation du service dédié
- ✅ `src/contexts/UserContext.tsx` - Mise à jour automatique de `emailVerified`

---

## 🔌 Service `emailVerification.ts`

### Fonctions disponibles

#### `sendVerificationEmail(email, type)`
Envoie un email de vérification à l'utilisateur.

```typescript
const result = await sendVerificationEmail('user@example.com', 'signup');
if (result.success) {
  // Email envoyé avec succès
} else {
  // Erreur : result.error contient le message d'erreur
}
```

**Types d'email :**
- `'signup'` : Email de confirmation à l'inscription
- `'email_change'` : Email de confirmation pour changement d'email

**Gestion d'erreurs :**
- Rate limiting : "Trop de demandes. Veuillez patienter..."
- Email déjà vérifié : "Cet email est déjà vérifié."
- Autres erreurs : Message d'erreur générique

#### `isEmailVerified()`
Vérifie si l'email de l'utilisateur actuel est vérifié.

```typescript
const verified = await isEmailVerified();
if (verified) {
  // Email vérifié
}
```

#### `getEmailVerificationStatus()`
Récupère l'état de vérification avec l'email.

```typescript
const status = await getEmailVerificationStatus();
// status.verified : boolean
// status.email : string | undefined
```

---

## 🎨 Interface utilisateur

### Page Settings

Dans la section **"Vérification Email"** :
- Affiche l'email de l'utilisateur
- Affiche le statut : "✓ Email vérifié" ou "⚠ Email non vérifié"
- Bouton **"Vérifier l'adresse email"** (visible uniquement si non vérifié)

### Modal EmailVerificationModal

Modal qui s'affiche pour rappeler à l'utilisateur de vérifier son email :
- Icône email
- Message explicatif
- Bouton "Renvoyer l'email"

---

## 🔄 Mise à jour automatique de l'état

Le `UserContext` met automatiquement à jour `emailVerified` :
1. **Au chargement** : Vérifie `email_confirmed_at` depuis Supabase
2. **Lors du refresh du token** : Met à jour si l'utilisateur vérifie son email dans un autre onglet
3. **Lors de la connexion** : Vérifie l'état de vérification

**Événements Supabase écoutés :**
- `SIGNED_IN` : Met à jour `emailVerified`
- `TOKEN_REFRESHED` : Met à jour `emailVerified` (utile si vérification dans autre onglet)

---

## 🌐 Configuration

### URL de redirection

L'URL de redirection pour la vérification est configurée dans `emailVerification.ts` :

```typescript
const EMAIL_VERIFICATION_REDIRECT_URL = 
  APP_CONFIG.apiBaseUrl 
    ? `${APP_CONFIG.apiBaseUrl}/verify-email.html`
    : 'https://www.nurayna.com/verify-email.html';
```

**Important** : Cette URL doit pointer vers une page web qui :
1. Récupère le token depuis l'URL
2. Appelle l'Edge Function `verify-email` de Supabase
3. Affiche un message de succès/erreur

### Page de vérification

La page `verify-email.html` doit :
- Être hébergée sur un domaine accessible (ex: Vercel, Netlify)
- Appeler l'Edge Function Supabase pour vérifier le token
- Rediriger vers l'application mobile après vérification

---

## ✅ Tests

### Test 1 : Inscription
1. Créer un nouveau compte
2. Vérifier que l'email de confirmation est reçu
3. Vérifier que l'utilisateur peut utiliser l'app sans vérifier l'email

### Test 2 : Vérification depuis Settings
1. Se connecter avec un compte non vérifié
2. Aller dans Paramètres → Vérification Email
3. Cliquer sur "Vérifier l'adresse email"
4. Vérifier que l'email est reçu
5. Cliquer sur le lien dans l'email
6. Vérifier que le statut passe à "✓ Email vérifié"

### Test 3 : Mise à jour automatique
1. Ouvrir l'app avec un compte non vérifié
2. Vérifier l'email dans un autre onglet/appareil
3. Revenir à l'app
4. Vérifier que le statut se met à jour automatiquement (après refresh du token)

---

## 🐛 Dépannage

### L'email n'est pas envoyé à l'inscription

**Vérifier :**
1. Configuration Supabase : `Authentication` → `Settings` → `Enable email confirmations` doit être activé
2. Configuration SMTP : Vérifier que Supabase peut envoyer des emails
3. Logs Supabase : Vérifier les logs d'erreur dans le Dashboard

### Le bouton "Vérifier" ne fonctionne pas

**Vérifier :**
1. L'utilisateur est bien connecté (`user?.id` existe)
2. L'email est bien défini (`user?.email` existe)
3. Supabase est configuré (`APP_CONFIG.useSupabase === true`)

### L'état ne se met pas à jour après vérification

**Solutions :**
1. Attendre quelques secondes (refresh automatique du token)
2. Se déconnecter et se reconnecter
3. Vérifier que `TOKEN_REFRESHED` est bien écouté dans `UserContext`

---

## 📝 Notes importantes

1. **Vérification optionnelle** : Les utilisateurs peuvent utiliser l'app sans vérifier leur email
2. **Rate limiting** : Supabase limite le nombre d'emails envoyés (protection anti-spam)
3. **URL de redirection** : Doit être configurée dans Supabase Dashboard → Authentication → URL Configuration
4. **Edge Function** : L'Edge Function `verify-email` doit être déployée dans Supabase

---

## 🔐 Sécurité

- ✅ Validation de l'email côté serveur (Supabase)
- ✅ Tokens sécurisés (PKCE flow)
- ✅ Rate limiting pour éviter le spam
- ✅ Vérification via Edge Function (pas de logique côté client)

---

**Dernière mise à jour :** 2025-01-27







