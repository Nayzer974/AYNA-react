# 🔒 Sécurité - Page OAuth Consent

## ⚠️ Question de Sécurité

Vous avez raison de vous préoccuper de la sécurité ! Voici les explications et solutions :

## 📋 Option 1 : Clé Anon Public (Actuelle - Acceptable)

### Pourquoi c'est sécurisé ?

La clé **anon public** de Supabase est **conçue** pour être utilisée côté client :

1. ✅ **Protection par RLS** : Les Row Level Security policies limitent l'accès aux données
2. ✅ **Pas d'accès direct** : La clé seule ne permet pas d'accéder aux données sans authentification
3. ✅ **Pratique recommandée** : C'est la méthode officielle recommandée par Supabase
4. ✅ **Limitations** : La clé anon ne peut pas :
   - Supprimer des utilisateurs
   - Modifier les permissions
   - Accéder aux données sans RLS appropriée

### ⚠️ Limitations

- La clé est visible dans le code source (mais c'est normal)
- Quelqu'un pourrait voir votre URL Supabase (mais c'est public de toute façon)

## 🔐 Option 2 : Backend Sécurisé (Recommandé pour Production)

### Solution : Supabase Edge Function

J'ai créé deux fichiers :

1. **`oauth-consent-secure.html`** - Version qui appelle un backend
2. **`scripts/supabase-edge-function-verify-email.ts`** - Edge Function Supabase

### Avantages

- ✅ **Clé service_role** reste sur le serveur (jamais exposée)
- ✅ **Validation côté serveur** plus sécurisée
- ✅ **Contrôle total** sur la logique de vérification
- ✅ **Pas de clés dans le HTML**

### Déploiement de l'Edge Function

1. **Installer Supabase CLI** :
   ```bash
   npm install -g supabase
   ```

2. **Se connecter à Supabase** :
   ```bash
   supabase login
   supabase link --project-ref votre-project-ref
   ```

3. **Créer la fonction** :
   ```bash
   supabase functions new verify-email
   ```

4. **Copier le code** :
   - Copiez le contenu de `scripts/supabase-edge-function-verify-email.ts`
   - Dans `supabase/functions/verify-email/index.ts`

5. **Déployer** :
   ```bash
   supabase functions deploy verify-email
   ```

6. **Configurer les secrets** :
   ```bash
   supabase secrets set SUPABASE_URL=votre-url
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=votre-service-key
   ```

7. **Mettre à jour le HTML** :
   - Dans `oauth-consent-secure.html`
   - Remplacez `backendUrl` par : `https://YOUR_SUPABASE_URL/functions/v1/verify-email`

## 🎯 Recommandation

### Pour le Développement
- ✅ Utilisez `oauth-consent.html` avec la clé anon (suffisant et simple)

### Pour la Production
- ✅ Utilisez `oauth-consent-secure.html` + Edge Function (plus sécurisé)

## 📚 Documentation Supabase

- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Security Best Practices](https://supabase.com/docs/guides/auth/security)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

## ✅ Checklist Sécurité

- [ ] Clé anon public dans HTML (acceptable pour dev)
- [ ] Edge Function déployée (recommandé pour prod)
- [ ] RLS policies configurées sur toutes les tables
- [ ] Redirect URLs configurées dans Supabase Dashboard
- [ ] HTTPS activé sur votre domaine (obligatoire pour prod)

