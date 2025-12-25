# 🔧 Guide : Corriger l'erreur "database error saving new user"

## Problème

Lors de la création d'un compte, une erreur se produit lors de la sauvegarde du profil utilisateur dans la base de données.

## 🔍 Cause

La fonction `handle_new_user` (trigger qui crée automatiquement un profil) utilisait `full_name` alors que la table `profiles` utilise `name`. Cela causait une erreur lors de l'insertion.

## ✅ Solution

### Option 1 : Exécuter le script de correction (RECOMMANDÉ)

1. Ouvrir le **SQL Editor** dans Supabase
2. Exécuter : `scripts/fix-handle-new-user-profile.sql`
3. Vérifier avec la requête à la fin du script

### Option 2 : Exécuter le script complet

Si vous n'avez pas encore exécuté `fix-all-linter-issues.sql`, exécutez-le maintenant :
1. Ouvrir le **SQL Editor** dans Supabase
2. Exécuter : `scripts/fix-all-linter-issues.sql`
3. La fonction `handle_new_user` sera automatiquement corrigée

## 📋 Corrections apportées

### Fonction `handle_new_user`

**Avant (incorrect) :**
```sql
INSERT INTO public.profiles (id, email, full_name)
VALUES (
  NEW.id,
  NEW.email,
  COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
)
```

**Après (correct) :**
```sql
INSERT INTO public.profiles (
  id, 
  name, 
  email, 
  avatar, 
  theme, 
  analytics,
  gender
)
VALUES (
  NEW.id,
  COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
  NEW.email,
  COALESCE(NEW.raw_user_meta_data->>'avatar_id', NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
  COALESCE(NEW.raw_user_meta_data->>'theme', 'default'),
  '{"totalDhikr": 0, "totalNotes": 0, "streak": 0, "lastActive": ""}'::jsonb,
  COALESCE(NEW.raw_user_meta_data->>'gender', NULL)
)
```

### Fonction `list_admins`

**Avant (incorrect) :**
```sql
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT
)
SELECT p.full_name FROM public.profiles p
```

**Après (correct) :**
```sql
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT
)
SELECT p.name FROM public.profiles p
```

## 🧪 Test

Pour tester que cela fonctionne :

1. **Déconnectez-vous** de l'application
2. **Créez un nouveau compte** avec un email valide
3. **Vérifiez** qu'il n'y a pas d'erreur "database error saving new user"
4. **Vérifiez** que le profil est créé dans Supabase (Table Editor → profiles)

## ⚠️ Note importante sur la vérification

Si la vérification montre `has_full_name_column: true`, c'est **NORMAL** et **ATTENDU** :

- La fonction **LIT** `full_name` depuis `raw_user_meta_data` comme fallback (ligne 35)
- La fonction **INSÈRE** dans la colonne `name` de la table (ligne 26)
- `has_full_name_column: true` signifie juste que le code contient la chaîne `full_name`, ce qui est normal car on la lit depuis les métadonnées

**Ce qui compte** : La fonction doit insérer dans `name`, pas dans `full_name`. Utilisez le script `fix-handle-new-user-final.sql` pour une vérification complète.

## 🔧 Dépannage

### L'erreur persiste après avoir exécuté le script

1. **Vérifiez** que le script a été exécuté complètement (pas d'erreurs)
2. **Vérifiez** que le trigger existe :
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
3. **Vérifiez** que la fonction existe :
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
   ```

### Le profil n'est pas créé automatiquement

1. **Vérifiez** que le trigger est actif
2. **Vérifiez** les logs Supabase pour voir s'il y a des erreurs
3. **Créez manuellement** le profil si nécessaire :
   ```sql
   INSERT INTO public.profiles (id, name, email)
   VALUES ('user_id_here', 'Nom', 'email@example.com');
   ```

### Erreur de colonne manquante

Si vous avez une erreur indiquant qu'une colonne n'existe pas :
1. **Vérifiez** la structure de la table `profiles` :
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'profiles' AND table_schema = 'public';
   ```
2. **Ajustez** la fonction `handle_new_user` si nécessaire

## 📝 Note importante

- La fonction `handle_new_user` est exécutée automatiquement par un trigger après chaque création d'utilisateur dans `auth.users`
- Elle crée le profil dans la table `profiles` avec les informations de base
- Si le profil existe déjà (ON CONFLICT), il met à jour l'email et la date de mise à jour

