# 🚀 Guide : Activer Brevo dans l'application

## ✅ Ce qui est déjà fait

1. ✅ Clé API Brevo configurée dans Supabase
2. ✅ Edge Function `send-email-brevo` déployée
3. ✅ Service Brevo créé (`src/services/brevo.ts`)
4. ✅ Configuration ajoutée (`useBrevo` dans `config.ts`)

## 📋 Prochaines étapes

### Étape 1 : Déployer les nouvelles Edge Functions

Vous devez déployer 2 nouvelles Edge Functions :

#### 1. `send-verification-email-brevo`

1. Allez dans **Supabase Dashboard** > **Edge Functions**
2. Cliquez sur **Create a new function**
3. Nom : `send-verification-email-brevo`
4. Copiez le contenu de `supabase/functions/send-verification-email-brevo/index.ts`
5. Collez dans l'éditeur
6. Cliquez sur **Deploy**

#### 2. `send-password-reset-brevo`

1. Allez dans **Supabase Dashboard** > **Edge Functions**
2. Cliquez sur **Create a new function**
3. Nom : `send-password-reset-brevo`
4. Copiez le contenu de `supabase/functions/send-password-reset-brevo/index.ts`
5. Collez dans l'éditeur
6. Cliquez sur **Deploy**

### Étape 2 : Activer Brevo dans la configuration

#### Option A : Via variable d'environnement (recommandé)

Ajoutez dans votre fichier `.env` ou dans EAS Secrets :

```bash
EXPO_PUBLIC_USE_BREVO=true
```

#### Option B : Via app.config.js

Modifiez `app.config.js` :

```javascript
useBrevo: process.env.EXPO_PUBLIC_USE_BREVO === 'true' || true, // Active Brevo
```

### Étape 3 : Vérifier le domaine dans Brevo (optionnel mais recommandé)

1. Allez sur [Brevo Dashboard](https://app.brevo.com)
2. Allez dans **Settings** > **Senders & IP**
3. Cliquez sur **Add a domain**
4. Entrez votre domaine (ex: `nurayna.com`)
5. Suivez les instructions pour vérifier le domaine
6. Une fois vérifié, vous pourrez envoyer depuis `noreply@nurayna.com`

### Étape 4 : Tester

1. **Test d'inscription** :
   - Créez un nouveau compte
   - Vérifiez que l'email de vérification arrive (via Brevo)

2. **Test de vérification d'email** :
   - Allez dans Paramètres > Vérification Email
   - Cliquez sur "Vérifier l'adresse email"
   - Vérifiez que l'email arrive (via Brevo)

3. **Test de réinitialisation de mot de passe** :
   - Allez sur la page "Mot de passe oublié"
   - Entrez votre email
   - Vérifiez que l'email arrive (via Brevo)

## 🔄 Comment ça fonctionne maintenant

### Avec Brevo activé (`useBrevo: true`)

1. **Inscription** : L'email de vérification est envoyé via Brevo
2. **Vérification d'email** : L'email est envoyé via Brevo
3. **Réinitialisation de mot de passe** : L'email est envoyé via Brevo
4. **Fallback** : Si Brevo échoue, le système utilise automatiquement Supabase

### Sans Brevo (`useBrevo: false`)

- Tous les emails sont envoyés via Supabase (comportement par défaut)

## 📊 Vérifier les statistiques

1. Allez sur [Brevo Dashboard](https://app.brevo.com)
2. Allez dans **Statistics** > **Email**
3. Vous verrez :
   - Nombre d'emails envoyés
   - Taux de délivrabilité
   - Taux d'ouverture
   - Bounces et plaintes

## 🐛 Dépannage

### Les emails ne sont pas envoyés via Brevo

1. Vérifiez que `useBrevo` est bien activé dans la config
2. Vérifiez les logs dans Supabase Dashboard > Edge Functions > Logs
3. Vérifiez que `BREVO_API_KEY` est bien configurée dans Supabase Secrets
4. Vérifiez les logs dans Brevo Dashboard > Statistics

### Erreur "BREVO_API_KEY n'est pas configurée"

- Vérifiez que la clé est bien dans Supabase Dashboard > Edge Functions > Settings > Secrets
- Vérifiez que le nom est exactement `BREVO_API_KEY`

### Les emails arrivent mais via Supabase

- Vérifiez que `APP_CONFIG.useBrevo` est `true`
- Vérifiez les logs pour voir si Brevo échoue et fait un fallback

## ✅ Checklist finale

- [ ] Edge Function `send-verification-email-brevo` déployée
- [ ] Edge Function `send-password-reset-brevo` déployée
- [ ] `useBrevo` activé dans la configuration
- [ ] Domaine vérifié dans Brevo (optionnel)
- [ ] Test d'inscription réussi
- [ ] Test de vérification d'email réussi
- [ ] Test de réinitialisation de mot de passe réussi

---

**Dernière mise à jour :** 2025-01-27






