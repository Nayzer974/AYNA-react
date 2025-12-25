# 🔧 Solution : Session Expirée - Envoi Email de Vérification

## 🐛 Problème

L'erreur `Auth session missing!` indique que la session Supabase est expirée. La fonction `resend()` nécessite une session active.

## ✅ Solution : Edge Function

J'ai créé une **Edge Function Supabase** qui permet d'envoyer l'email de vérification **sans nécessiter de session côté client**.

### Étape 1 : Déployer l'Edge Function

1. **Installer Supabase CLI** (si pas déjà fait) :
   ```bash
   npm install -g supabase
   ```

2. **Se connecter à Supabase** :
   ```bash
   supabase login
   ```

3. **Lier votre projet** :
   ```bash
   supabase link --project-ref votre-project-ref
   ```

4. **Déployer l'Edge Function** :
   ```bash
   supabase functions deploy resend-verification-email
   ```

   Ou depuis le dossier :
   ```bash
   cd application
   supabase functions deploy resend-verification-email
   ```

### Étape 2 : Vérifier le déploiement

1. Allez dans **Supabase Dashboard** → **Edge Functions**
2. Vous devriez voir `resend-verification-email` dans la liste
3. Cliquez dessus pour voir les logs

### Étape 3 : Tester

1. Ouvrez l'app
2. Allez dans **Paramètres** → **Vérification Email**
3. Cliquez sur **"Vérifier l'adresse email"**
4. L'email devrait être envoyé même si la session est expirée

---

## 🔄 Solution Alternative : Reconnecter l'utilisateur

Si vous ne pouvez pas déployer l'Edge Function maintenant, la solution temporaire est :

1. **Se déconnecter** de l'app
2. **Se reconnecter** avec email/mot de passe
3. **Réessayer** le bouton de vérification

Le code détecte maintenant la session expirée et propose automatiquement de se déconnecter/reconnecter.

---

## 📝 Comment ça fonctionne maintenant

### Méthode 1 : Session Active (recommandé)
- Si la session est active → utilise `supabase.auth.resend()` directement
- Plus rapide et plus simple

### Méthode 2 : Session Expirée (fallback)
- Si la session est expirée → utilise l'Edge Function `resend-verification-email`
- L'Edge Function utilise la clé `service_role` (pas besoin de session)
- Fonctionne même si l'utilisateur n'est pas connecté

---

## 🧪 Test de l'Edge Function

Vous pouvez tester l'Edge Function directement :

```bash
curl -X POST \
  'https://votre-project.supabase.co/functions/v1/resend-verification-email' \
  -H 'Authorization: Bearer VOTRE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "redirectUrl": "https://www.nurayna.com/verify-email.html"
  }'
```

---

## ⚠️ Important

L'Edge Function utilise la clé `service_role` qui est **très puissante**. Elle est :
- ✅ Sécurisée car elle s'exécute côté serveur uniquement
- ✅ Protégée par CORS
- ✅ Vérifie que l'utilisateur existe avant d'envoyer l'email

**Ne jamais exposer la clé `service_role` côté client !**

---

## 🔍 Vérifications

Si l'Edge Function ne fonctionne pas :

1. **Vérifier les logs** dans Supabase Dashboard → Edge Functions → Logs
2. **Vérifier que la fonction est déployée** : Dashboard → Edge Functions
3. **Vérifier les variables d'environnement** : `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` doivent être définies

---

**Dernière mise à jour :** 2025-01-27







