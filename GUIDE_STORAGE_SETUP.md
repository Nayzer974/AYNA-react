# Guide de configuration Supabase Storage pour les Avatars

## 📋 Problème

Si vous obtenez l'erreur `StorageApiError: new row violates row-level security policy`, c'est que les politiques RLS (Row Level Security) ne sont pas configurées pour le bucket `avatars`.

## 🔧 Solution

### Étape 1 : Créer le bucket dans Supabase Dashboard

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Storage** dans le menu de gauche
4. Cliquez sur **New bucket**
5. Configurez le bucket :
   - **Name**: `avatars`
   - **Public bucket**: ✅ **Activé** (important pour permettre l'accès public aux avatars)
   - **File size limit**: `5 MB` (ou selon vos besoins)
   - **Allowed MIME types**: `image/jpeg, image/png, image/jpg` (optionnel)
6. Cliquez sur **Create bucket**

### Étape 2 : Configurer les politiques RLS

**Option A : Via l'interface graphique (Recommandé si vous avez des erreurs de permission)**

1. Dans le Dashboard Supabase, allez dans **Storage** > **Policies**
2. Sélectionnez le bucket `avatars`
3. Cliquez sur **New Policy** pour chaque politique ci-dessous

**Option B : Via SQL Editor**

1. Dans le Dashboard Supabase, allez dans **SQL Editor**
2. Créez une nouvelle requête
3. Copiez et collez le contenu du fichier `scripts/setup-avatars-storage-simple.sql`
4. Cliquez sur **Run** pour exécuter le script
5. **Si vous obtenez une erreur de permission**, utilisez l'Option A ci-dessus

### Étape 3 : Vérifier les politiques

Après avoir exécuté le script, vous devriez voir 4 politiques créées :
- ✅ Users can upload their own avatars
- ✅ Anyone can view avatars
- ✅ Users can update their own avatars
- ✅ Users can delete their own avatars

## 📝 Notes importantes

- Les avatars doivent être publics pour être accessibles depuis l'application
- Le nom du fichier doit suivre le format : `{user_id}-{timestamp}.jpg`
- Les utilisateurs ne peuvent uploader/modifier/supprimer que leurs propres avatars
- Tous les utilisateurs (même non authentifiés) peuvent voir les avatars

## 🐛 Dépannage

### Erreur : "bucket does not exist"
→ Créez d'abord le bucket dans le Dashboard Supabase (Étape 1)

### Erreur : "permission denied"
→ Vérifiez que l'utilisateur est bien authentifié et que les politiques RLS sont correctement configurées

### Les avatars ne s'affichent pas
→ Vérifiez que le bucket est marqué comme **Public** dans les paramètres

## ✅ Test

Après avoir configuré les politiques, essayez à nouveau d'uploader un avatar depuis l'application. L'erreur devrait être résolue.

