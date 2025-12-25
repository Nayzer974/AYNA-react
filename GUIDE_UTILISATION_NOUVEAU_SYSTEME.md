# 📚 Guide : Nouveau Système d'Inscription et Vérification d'Email

## 🎯 Vue d'ensemble

Le système d'inscription et de vérification d'email a été complètement refait pour utiliser **Brevo SMTP** configuré directement dans **Supabase Dashboard**. Plus besoin d'Edge Functions complexes !

## ✅ Ce qui a changé

### 1. **Configuration Brevo SMTP dans Supabase**
- Brevo SMTP est maintenant configuré directement dans Supabase Dashboard
- Supabase envoie automatiquement les emails via Brevo SMTP
- Plus besoin d'Edge Functions pour l'envoi d'email

### 2. **Inscription simplifiée**
- Utilise uniquement `supabase.auth.signUp()` avec `emailRedirectTo: 'ayna://auth/callback'`
- Code beaucoup plus simple et maintenable
- Gestion d'erreurs propre (email déjà utilisé, email invalide, etc.)

### 3. **Nouvel écran "Vérifie ton email"**
- S'affiche automatiquement après l'inscription
- Vérifie périodiquement si l'email a été vérifié
- Permet de renvoyer l'email de vérification
- Redirige automatiquement vers l'accueil une fois l'email vérifié

### 4. **Deep Link `ayna://auth/callback`**
- Configuré dans `app.config.js` (déjà fait)
- Géré dans `App.tsx` pour capturer le callback après vérification
- Connecte automatiquement l'utilisateur après vérification

## 📋 Configuration requise

### Étape 1 : Configurer Brevo SMTP dans Supabase

Suivez le guide : `GUIDE_CONFIGURATION_BREVO_SMTP_SUPABASE.md`

**Résumé rapide :**
1. Obtenez votre SMTP Key Brevo
2. Allez dans Supabase Dashboard > Authentication > Email Templates > SMTP Settings
3. Configurez :
   - Host: `smtp-relay.brevo.com`
   - Port: `587`
   - Username: Votre email Brevo
   - Password: Votre SMTP Key Brevo
   - Sender Email: `noreply@nurayna.com`
   - Sender Name: `AYNA`
4. Activez "Enable email confirmations" dans Authentication > Sign In / Providers > Email
5. Ajoutez `ayna://auth/callback` dans Redirect URLs

### Étape 2 : Vérifier la configuration

1. Testez une inscription dans l'application
2. Vérifiez que l'email est bien envoyé via Brevo (dans Brevo Dashboard)
3. Cliquez sur le lien dans l'email
4. Vérifiez que l'app s'ouvre et que l'utilisateur est connecté

## 🔄 Flux utilisateur

### Inscription
1. L'utilisateur remplit le formulaire d'inscription
2. Appel à `supabase.auth.signUp()` avec `emailRedirectTo: 'ayna://auth/callback'`
3. Supabase envoie l'email via Brevo SMTP
4. L'utilisateur est redirigé vers l'écran "Vérifie ton email"
5. L'utilisateur reçoit l'email avec un lien de vérification

### Vérification
1. L'utilisateur clique sur le lien dans l'email
2. Le lien pointe vers `ayna://auth/callback?token_hash=...`
3. L'app s'ouvre et capture le deep link dans `App.tsx`
4. L'app vérifie le token avec `supabase.auth.verifyOtp()`
5. L'utilisateur est automatiquement connecté
6. Redirection vers l'écran d'accueil

### Vérification automatique
- L'écran "Vérifie ton email" vérifie périodiquement (toutes les 5 secondes) si l'email a été vérifié
- Si l'email est vérifié, redirection automatique vers l'accueil

## 📁 Fichiers modifiés

### Nouveaux fichiers
- `src/pages/VerifyEmail.tsx` - Écran de vérification d'email
- `src/services/auth.ts` - Service d'authentification simplifié (optionnel, pour référence)
- `GUIDE_CONFIGURATION_BREVO_SMTP_SUPABASE.md` - Guide de configuration
- `GUIDE_UTILISATION_NOUVEAU_SYSTEME.md` - Ce guide

### Fichiers modifiés
- `src/services/supabase.ts` - `signUpWithSupabase()` simplifié
- `src/pages/Signup.tsx` - Redirection vers VerifyEmail après inscription
- `src/navigation/AppNavigator.tsx` - Ajout de l'écran VerifyEmail
- `App.tsx` - Gestion du deep link `ayna://auth/callback`
- `src/contexts/UserContext.tsx` - Ne définit pas l'utilisateur si email non vérifié

## 🐛 Dépannage

### L'email n'est pas envoyé
1. Vérifiez que Brevo SMTP est bien configuré dans Supabase Dashboard
2. Vérifiez que "Enable email confirmations" est activé
3. Vérifiez les logs dans Supabase Dashboard > Logs > Auth
4. Vérifiez les logs dans Brevo Dashboard > Statistics > Email Activity

### Le deep link ne fonctionne pas
1. Vérifiez que `scheme: "ayna"` est dans `app.config.js`
2. Vérifiez que `ayna://auth/callback` est dans les Redirect URLs de Supabase
3. Testez le deep link avec : `npx expo start --dev-client` puis `npx uri-scheme open ayna://auth/callback --ios` ou `--android`

### L'utilisateur n'est pas connecté après vérification
1. Vérifiez les logs dans `App.tsx` pour voir si le deep link est capturé
2. Vérifiez que `supabase.auth.verifyOtp()` réussit
3. Vérifiez que `onAuthStateChange` est bien déclenché

## ✅ Checklist de déploiement

- [ ] Brevo SMTP configuré dans Supabase Dashboard
- [ ] "Enable email confirmations" activé
- [ ] `ayna://auth/callback` ajouté dans Redirect URLs
- [ ] Test d'inscription effectué
- [ ] Email reçu et vérifié
- [ ] Deep link fonctionne
- [ ] Utilisateur connecté automatiquement après vérification

---

**Dernière mise à jour :** 2025-01-27






