# 🔍 Debug : "Error sending confirmation email"

## 📋 Problème

Vous rencontrez l'erreur **"error sending confirmation email"** lors de l'envoi d'email de vérification.

## 🔍 Causes possibles

### 1. **Edge Function Brevo non déployée**
- L'Edge Function `send-verification-email-brevo` n'est pas déployée
- L'URL de l'Edge Function est incorrecte

### 2. **Clé API Brevo manquante ou invalide**
- `BREVO_API_KEY` n'est pas configurée dans Supabase Dashboard
- La clé API est invalide ou expirée

### 3. **Impossible de générer le lien de vérification**
- Rate limiting de Supabase `admin.generateLink`
- L'utilisateur n'existe pas dans Supabase
- L'email est déjà vérifié

### 4. **Erreur Brevo API**
- Quota Brevo dépassé
- Email invalide
- Erreur réseau

## ✅ Solutions

### Étape 1 : Vérifier les logs de la console

Ouvrez la console de l'application et cherchez les logs suivants :

```
[emailVerification] Tentative d'envoi via Brevo
[emailVerification] Erreur Brevo: ...
```

ou

```
[signUp] Envoi de l'email de vérification via Brevo
[signUp] Erreur Brevo: ...
```

### Étape 2 : Vérifier la configuration Brevo

1. **Vérifier que Brevo est activé** :
   - Vérifiez que `EXPO_PUBLIC_USE_BREVO=true` dans votre `.env`
   - Vérifiez que `APP_CONFIG.useBrevo` est `true` dans la config

2. **Vérifier la clé API Brevo** :
   - Allez sur [Supabase Dashboard](https://app.supabase.com)
   - Sélectionnez votre projet
   - Allez dans **Edge Functions** > **Settings**
   - Vérifiez que `BREVO_API_KEY` est configurée

### Étape 3 : Vérifier que l'Edge Function est déployée

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Edge Functions**
4. Vérifiez que `send-verification-email-brevo` est listée et déployée

### Étape 4 : Tester l'Edge Function manuellement

Vous pouvez tester l'Edge Function directement avec curl :

```bash
curl -X POST https://YOUR_SUPABASE_URL/functions/v1/send-verification-email-brevo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{
    "email": "test@example.com",
    "redirectUrl": "https://www.nurayna.com/verify-email.html",
    "userName": "Test User"
  }'
```

### Étape 5 : Vérifier les logs de l'Edge Function

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Edge Functions** > **Logs**
4. Cherchez les erreurs récentes pour `send-verification-email-brevo`

## 🔧 Corrections apportées

### 1. Amélioration de la gestion d'erreur dans l'Edge Function

- Si le lien de vérification n'est pas généré, le code essaie une dernière fois après 5 secondes
- Si ça échoue encore, une erreur claire est retournée au lieu de continuer avec un lien undefined

### 2. Amélioration de la gestion d'erreur côté client

- Les erreurs Brevo sont maintenant mieux loggées
- Si l'erreur est critique (impossible de générer le lien), le fallback Supabase n'est pas tenté

## 📝 Messages d'erreur courants

### "Impossible de générer le lien de vérification"
- **Cause** : Rate limiting de Supabase ou utilisateur non trouvé
- **Solution** : Attendre quelques minutes et réessayer, ou vérifier que l'utilisateur existe

### "BREVO_API_KEY n'est pas configurée"
- **Cause** : La clé API Brevo n'est pas configurée dans Supabase Dashboard
- **Solution** : Configurer `BREVO_API_KEY` dans Supabase Dashboard > Edge Functions > Settings

### "Aucun compte trouvé avec cet email"
- **Cause** : L'utilisateur n'existe pas dans Supabase
- **Solution** : Vérifier que l'utilisateur est bien créé avant d'essayer d'envoyer l'email

### "Cet email est déjà vérifié"
- **Cause** : L'email a déjà été vérifié
- **Solution** : Pas besoin d'envoyer un nouvel email

## ✅ Checklist de débogage

- [ ] Vérifier les logs de la console de l'application
- [ ] Vérifier que `EXPO_PUBLIC_USE_BREVO=true`
- [ ] Vérifier que `BREVO_API_KEY` est configurée dans Supabase Dashboard
- [ ] Vérifier que l'Edge Function `send-verification-email-brevo` est déployée
- [ ] Vérifier les logs de l'Edge Function dans Supabase Dashboard
- [ ] Tester l'Edge Function manuellement avec curl
- [ ] Vérifier que l'utilisateur existe dans Supabase
- [ ] Vérifier que l'email n'est pas déjà vérifié

---

**Dernière mise à jour :** 2025-01-27






