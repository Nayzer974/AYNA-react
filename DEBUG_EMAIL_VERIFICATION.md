# 🐛 Guide de Débogage - Vérification d'Email

## Problème : L'email n'est pas envoyé

### ✅ Vérifications à faire

#### 1. Vérifier la configuration Supabase

**Dans Supabase Dashboard :**
1. Allez dans **Authentication** → **Settings**
2. Vérifiez que **"Enable email confirmations"** est **ACTIVÉ**
3. Vérifiez que **"Enable sign ups"** est **ACTIVÉ**
4. Vérifiez la configuration SMTP (si vous utilisez un SMTP personnalisé)

#### 2. Vérifier les logs dans l'application

Ouvrez la console de développement et cherchez les logs :
- `[emailVerification]` : Logs du service
- `[Settings]` : Logs de la page Settings

**Exemples de logs à vérifier :**
```
[emailVerification] Envoi de l'email de vérification à: user@example.com
[emailVerification] Type: signup
[emailVerification] Redirect URL: https://www.nurayna.com/verify-email.html
[emailVerification] Email envoyé avec succès
```

**Si vous voyez une erreur :**
```
[emailVerification] Erreur resend(): { message: "...", code: "..." }
```

#### 3. Vérifier que l'utilisateur est authentifié

Le bouton ne fonctionne que si :
- ✅ L'utilisateur est connecté (`user?.id` existe)
- ✅ L'email est défini (`user?.email` existe)
- ✅ Supabase est configuré (`APP_CONFIG.useSupabase === true`)

#### 4. Vérifier les erreurs courantes

**Erreur : "Vous devez être connecté"**
- Solution : Se connecter avant de demander l'email

**Erreur : "Trop de demandes"**
- Solution : Attendre quelques minutes avant de réessayer
- Supabase limite à 3-5 emails par heure par utilisateur

**Erreur : "Cet email est déjà vérifié"**
- Solution : L'email est déjà vérifié, pas besoin d'envoyer un nouvel email

**Erreur : "Aucun compte trouvé avec cet email"**
- Solution : Vérifier que l'email correspond bien au compte connecté

**Erreur : "User not found" ou "No user found"**
- Solution : Le compte n'existe pas ou a été supprimé

#### 5. Vérifier la configuration de l'URL de redirection

Dans `emailVerification.ts`, l'URL est :
```typescript
const EMAIL_VERIFICATION_REDIRECT_URL = 
  APP_CONFIG.apiBaseUrl 
    ? `${APP_CONFIG.apiBaseUrl}/verify-email.html`
    : 'https://www.nurayna.com/verify-email.html';
```

**Vérifier :**
1. Que `APP_CONFIG.apiBaseUrl` est bien configuré (ou utilise le fallback)
2. Que l'URL est dans la liste des **Redirect URLs** dans Supabase Dashboard
3. Que la page `verify-email.html` existe et est accessible

#### 6. Tester avec l'API Supabase directement

Vous pouvez tester l'envoi d'email directement depuis Supabase Dashboard :
1. Allez dans **Authentication** → **Users**
2. Trouvez l'utilisateur
3. Cliquez sur **"Resend confirmation email"**

Si ça ne fonctionne pas depuis le Dashboard, c'est un problème de configuration Supabase.

---

## 🔧 Solutions

### Solution 1 : Activer la vérification d'email dans Supabase

1. Allez dans **Authentication** → **Settings**
2. Activez **"Enable email confirmations"**
3. Sauvegardez

### Solution 2 : Vérifier la configuration SMTP

Si vous utilisez un SMTP personnalisé :
1. Allez dans **Settings** → **Auth** → **SMTP Settings**
2. Vérifiez que la configuration est correcte
3. Testez l'envoi d'un email de test

### Solution 3 : Vérifier les Redirect URLs

1. Allez dans **Authentication** → **URL Configuration**
2. Ajoutez votre URL de redirection dans **"Redirect URLs"**
3. Exemple : `https://www.nurayna.com/verify-email.html`

### Solution 4 : Vérifier les logs Supabase

1. Allez dans **Logs** → **Auth Logs**
2. Cherchez les erreurs liées à l'envoi d'email
3. Les erreurs SMTP apparaîtront ici

---

## 🧪 Test de débogage

Ajoutez ce code temporairement dans `Settings.tsx` pour voir les détails :

```typescript
const handleVerifyEmail = async () => {
  console.log('=== DEBUG EMAIL VERIFICATION ===');
  console.log('User:', user);
  console.log('User ID:', user?.id);
  console.log('User Email:', user?.email);
  console.log('Supabase configuré:', !!supabase);
  console.log('APP_CONFIG.useSupabase:', APP_CONFIG.useSupabase);
  
  // ... reste du code
};
```

---

## 📞 Support

Si le problème persiste :
1. Vérifiez les logs Supabase Dashboard
2. Vérifiez les logs de l'application (console)
3. Testez avec un autre compte
4. Vérifiez que le compte n'est pas banni ou désactivé

---

**Dernière mise à jour :** 2025-01-27







