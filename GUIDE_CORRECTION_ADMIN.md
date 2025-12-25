# 🔧 GUIDE : Correction du Statut Admin dans UmmAyna

**Date :** 2025-01-27  
**Expert Sécurité :** Agent IA Sécurité AYNA

---

## ❌ ERREUR

```
[UmmAyna] Erreur complète lors de la suppression: 
[Error: Erreur de permissions. Vérifiez que votre statut admin est correctement configuré dans la base de données.]
```

---

## 🔍 DIAGNOSTIC

Cette erreur indique que votre statut admin n'est pas correctement configuré dans la base de données Supabase. La fonction `delete_community_post` vérifie votre statut admin via `check_user_is_admin()`, mais cette vérification échoue.

---

## ✅ SOLUTION

### Étape 1 : Trouver votre User ID

1. Ouvrez **Supabase SQL Editor**
2. Exécutez cette requête (remplacez par votre email) :

```sql
SELECT 
  u.id as user_id,
  u.email,
  p.name,
  p.is_admin
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'VOTRE_EMAIL@example.com';
```

3. **Copiez votre `user_id`** (UUID)

---

### Étape 2 : Vérifier votre statut admin

Exécutez cette requête (remplacez par votre user_id) :

```sql
SELECT 
  id,
  email,
  name,
  is_admin,
  CASE 
    WHEN is_admin = true THEN '✅ Admin'
    WHEN is_admin = false THEN '❌ Non-admin'
    WHEN is_admin IS NULL THEN '⚠️ NULL (non défini)'
  END as status
FROM public.profiles
WHERE id = 'VOTRE_USER_ID'::UUID;
```

**Résultat attendu :** `is_admin = true`

---

### Étape 3 : Corriger le statut admin

Si `is_admin` est `false` ou `NULL`, exécutez cette commande :

```sql
UPDATE public.profiles
SET is_admin = true
WHERE id = 'VOTRE_USER_ID'::UUID;
```

**Vérification :**

```sql
SELECT 
  id,
  email,
  name,
  is_admin
FROM public.profiles
WHERE id = 'VOTRE_USER_ID'::UUID;
```

Vous devriez voir `is_admin = true`

---

### Étape 4 : Tester la fonction admin

Exécutez cette requête pour vérifier que la fonction `check_user_is_admin` fonctionne :

```sql
SELECT 
  public.check_user_is_admin('VOTRE_USER_ID'::UUID) as is_admin_check;
```

**Résultat attendu :** `true`

---

### Étape 5 : Vérifier que la fonction delete_community_post existe

```sql
SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'delete_community_post'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

**Résultat attendu :** Une ligne avec `delete_community_post` et les arguments `p_post_id uuid, p_user_id uuid`

Si la fonction n'existe pas, exécutez :
```sql
-- Fichier : application/scripts/create-delete-post-rpc.sql
```

---

## 🚀 SCRIPT AUTOMATIQUE

Pour faciliter le processus, utilisez le script complet :

```sql
-- Fichier : application/scripts/verify-and-fix-admin-status.sql
```

**Instructions :**
1. Ouvrez le fichier dans Supabase SQL Editor
2. Remplacez `'VOTRE_EMAIL@example.com'` par votre email
3. Exécutez l'étape 1 pour trouver votre user_id
4. Remplacez `'VOTRE_USER_ID'` par votre user_id dans les étapes suivantes
5. Exécutez les étapes 2, 3, 4, 5 dans l'ordre

---

## ✅ VÉRIFICATIONS FINALES

Après avoir corrigé le statut admin :

1. ✅ `is_admin = true` dans la table `profiles`
2. ✅ `check_user_is_admin()` retourne `true`
3. ✅ La fonction `delete_community_post` existe
4. ✅ Vous pouvez supprimer des posts en tant qu'admin

---

## 🔍 SI LE PROBLÈME PERSISTE

### Vérifier que vous êtes bien connecté

Dans l'application, vérifiez que :
- Vous êtes bien connecté avec le bon compte
- L'email dans l'application correspond à celui dans Supabase

### Vérifier les logs

Dans la console de l'application, vérifiez :
- Le `user_id` utilisé lors de la suppression
- Les erreurs détaillées de Supabase

### Vérifier les permissions RLS

Exécutez cette requête pour vérifier les policies RLS :

```sql
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'community_posts'
AND cmd = 'DELETE';
```

---

## 📚 FICHIERS UTILES

- `application/scripts/verify-and-fix-admin-status.sql` - Script de diagnostic et correction
- `application/scripts/create-delete-post-rpc.sql` - Fonction RPC de suppression
- `application/scripts/create-secure-admin-check-function.sql` - Fonction de vérification admin

---

**Après avoir suivi ces étapes, vous devriez pouvoir supprimer des posts en tant qu'admin ! ✅**

*Dernière mise à jour : 2025-01-27*










