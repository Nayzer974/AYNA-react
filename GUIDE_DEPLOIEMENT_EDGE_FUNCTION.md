# 🚀 Guide de Déploiement - Edge Function Supabase (Production)

Ce guide vous explique comment déployer la solution sécurisée de vérification d'email avec Supabase Edge Function.

## 📋 Prérequis

1. **Supabase CLI installé** :
   ```bash
   npm install -g supabase
   ```

2. **Compte Supabase** avec accès au projet

3. **Clé service_role** de Supabase (trouvable dans Dashboard > Settings > API)

## 🔧 Étape 1 : Se connecter à Supabase

```bash
# Se connecter à Supabase
supabase login

# Lier votre projet (remplacez YOUR_PROJECT_REF par votre référence de projet)
supabase link --project-ref ctupecolapegiogvmwxz
```

> **Note** : Votre project-ref est la partie de l'URL entre `https://` et `.supabase.co`
> Exemple : `https://ctupecolapegiogvmwxz.supabase.co` → project-ref = `ctupecolapegiogvmwxz`

## 🔧 Étape 2 : Créer la fonction Edge Function

```bash
# Créer la fonction (si elle n'existe pas déjà)
supabase functions new verify-email
```

Cette commande crée le dossier `supabase/functions/verify-email/` avec un fichier `index.ts` de base.

## 🔧 Étape 3 : Copier le code

1. Ouvrez `supabase/functions/verify-email/index.ts`
2. Remplacez tout le contenu par le code de `scripts/supabase-edge-function-verify-email.ts`
   - Ou utilisez directement le fichier créé dans `supabase/functions/verify-email/index.ts`

## 🔧 Étape 4 : Configurer les secrets

Les secrets sont nécessaires pour que l'Edge Function puisse accéder à Supabase avec la clé service_role.

```bash
# Récupérer votre SUPABASE_URL (exemple: https://ctupecolapegiogvmwxz.supabase.co)
# Récupérer votre SUPABASE_SERVICE_ROLE_KEY depuis Dashboard > Settings > API

# Configurer les secrets
supabase secrets set SUPABASE_URL=https://ctupecolapegiogvmwxz.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_ici
```

> ⚠️ **IMPORTANT** : Ne partagez JAMAIS votre `SUPABASE_SERVICE_ROLE_KEY` publiquement !
> Cette clé a des permissions élevées et doit rester secrète.

## 🔧 Étape 5 : Déployer la fonction

```bash
# Déployer la fonction
supabase functions deploy verify-email
```

Vous devriez voir un message de succès avec l'URL de la fonction :
```
Deployed Function verify-email
URL: https://ctupecolapegiogvmwxz.supabase.co/functions/v1/verify-email
```

## 🔧 Étape 6 : Mettre à jour oauth-consent-secure.html

1. Ouvrez `oauth-consent-secure.html`
2. Vérifiez que l'URL de l'Edge Function est correcte :
   ```javascript
   const supabaseUrl = 'https://ctupecolapegiogvmwxz.supabase.co';
   const backendUrl = `${supabaseUrl}/functions/v1/verify-email`;
   ```

3. Remplacez `ctupecolapegiogvmwxz` par votre project-ref si différent

## 🔧 Étape 7 : Déployer oauth-consent-secure.html

Déployez le fichier `oauth-consent-secure.html` sur votre serveur web à l'adresse :
- `http://nurayna.com/oauth/consent`
- `https://nurayna.com/oauth/consent` (recommandé pour production)

### Options de déploiement :

#### Option A : Via FTP/SFTP
1. Connectez-vous à votre serveur
2. Uploadez `oauth-consent-secure.html` dans le dossier `/oauth/consent/`
3. Renommez-le en `index.html` si nécessaire

#### Option B : Via Git (si votre site est versionné)
1. Commitez le fichier
2. Push vers votre repository
3. Votre serveur déploie automatiquement

#### Option C : Via cPanel / Plesk
1. Connectez-vous à votre panneau de contrôle
2. Utilisez le gestionnaire de fichiers
3. Uploadez le fichier dans le bon dossier

## 🔧 Étape 8 : Configurer les Redirect URLs dans Supabase

1. Allez dans **Supabase Dashboard** > **Authentication** > **URL Configuration**
2. Ajoutez les URLs suivantes dans **Redirect URLs** :
   - `http://nurayna.com/oauth/consent`
   - `https://nurayna.com/oauth/consent`
   - `ayna://email-verified` (pour le deep link mobile)

3. Cliquez sur **Save**

## ✅ Vérification

### Tester l'Edge Function

Vous pouvez tester l'Edge Function directement :

```bash
# Tester avec curl
curl -X POST https://ctupecolapegiogvmwxz.supabase.co/functions/v1/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token_hash": "test", "type_hash": "signup"}'
```

> Note : Ce test échouera car le token n'est pas valide, mais vous devriez recevoir une réponse JSON avec un message d'erreur, ce qui confirme que la fonction fonctionne.

### Tester le flux complet

1. Créez un nouveau compte dans l'application
2. Vérifiez que vous recevez l'email de vérification
3. Cliquez sur le lien dans l'email
4. Vous devriez être redirigé vers `http://nurayna.com/oauth/consent`
5. La page devrait vérifier automatiquement votre email
6. Vous devriez voir un message de succès

## 🔒 Sécurité

### ✅ Avantages de cette solution

- ✅ **Clé service_role** reste sur le serveur (jamais exposée)
- ✅ **Validation côté serveur** plus sécurisée
- ✅ **Contrôle total** sur la logique de vérification
- ✅ **Pas de clés dans le HTML** côté client

### ⚠️ Points d'attention

- Assurez-vous que votre serveur web utilise **HTTPS** en production
- Ne partagez jamais votre `SUPABASE_SERVICE_ROLE_KEY`
- Vérifiez régulièrement les logs de l'Edge Function dans Supabase Dashboard

## 📊 Monitoring

Vous pouvez surveiller l'utilisation de votre Edge Function dans :
- **Supabase Dashboard** > **Edge Functions** > **verify-email** > **Logs**

## 🐛 Dépannage

### Erreur : "Configuration manquante"
- Vérifiez que les secrets sont bien configurés : `supabase secrets list`
- Vérifiez que les noms des secrets sont exactement : `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`

### Erreur : "Function not found"
- Vérifiez que la fonction est bien déployée : `supabase functions list`
- Vérifiez l'URL dans `oauth-consent-secure.html`

### Erreur : "CORS error"
- L'Edge Function gère déjà CORS, mais vérifiez que les headers sont corrects
- Vérifiez que vous utilisez bien `oauth-consent-secure.html` et non `oauth-consent.html`

### Erreur : "Token invalide"
- Vérifiez que les paramètres `token_hash` et `type_hash` sont bien passés depuis l'URL
- Vérifiez que le lien de vérification dans l'email est correct

## 📚 Ressources

- [Documentation Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Supabase Auth - Email Verification](https://supabase.com/docs/guides/auth/auth-email-verification)

## ✅ Checklist de déploiement

- [ ] Supabase CLI installé
- [ ] Connecté à Supabase (`supabase login`)
- [ ] Projet lié (`supabase link`)
- [ ] Fonction créée (`supabase functions new verify-email`)
- [ ] Code copié dans `supabase/functions/verify-email/index.ts`
- [ ] Secrets configurés (`supabase secrets set`)
- [ ] Fonction déployée (`supabase functions deploy verify-email`)
- [ ] `oauth-consent-secure.html` mis à jour avec la bonne URL
- [ ] `oauth-consent-secure.html` déployé sur `http://nurayna.com/oauth/consent`
- [ ] Redirect URLs configurées dans Supabase Dashboard
- [ ] Test de création de compte effectué
- [ ] Test de vérification d'email effectué
- [ ] HTTPS activé sur le domaine (production)

---

**Félicitations !** 🎉 Votre solution de vérification d'email est maintenant sécurisée et prête pour la production.

