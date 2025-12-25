# Configuration Supabase Storage pour les images de profil

## Buckets nécessaires

Deux buckets doivent être créés dans Supabase Storage :

### 1. Bucket `avatars` (pour les photos de profil)
### 2. Bucket `banners` (pour les bannières de profil)

## Configuration des buckets

### Création via Supabase Dashboard

1. Allez dans **Storage** dans le menu de gauche
2. Cliquez sur **New bucket**
3. Créez les buckets suivants :
   - **avatars** : Public access (pour que les images soient accessibles)
   - **banners** : Public access

### Politiques RLS (Row Level Security)

Les politiques doivent permettre :
- **Upload** : Seulement par l'utilisateur authentifié pour ses propres fichiers
- **Read** : Public (pour que les images soient visibles)
- **Delete** : Seulement par l'utilisateur authentifié pour ses propres fichiers

#### SQL pour créer les politiques (exécuter dans SQL Editor)

```sql
-- Politiques pour le bucket 'avatars'

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Politique pour l'upload (INSERT)
-- Le nom de fichier doit commencer par l'UUID de l'utilisateur (format: {userId}-{timestamp}.jpg)
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  name LIKE (auth.uid()::text || '-%')
);

-- Politique pour la lecture (SELECT) - Public
CREATE POLICY "Avatars are publicly readable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Politique pour la suppression (DELETE)
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  name LIKE (auth.uid()::text || '-%')
);

-- Politiques pour le bucket 'banners'

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can upload their own banners" ON storage.objects;
DROP POLICY IF EXISTS "Banners are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own banners" ON storage.objects;

-- Politique pour l'upload (INSERT)
-- Le nom de fichier doit commencer par l'UUID de l'utilisateur (format: {userId}-{timestamp}.jpg)
CREATE POLICY "Users can upload their own banners"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'banners' AND
  name LIKE (auth.uid()::text || '-%')
);

-- Politique pour la lecture (SELECT) - Public
CREATE POLICY "Banners are publicly readable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'banners');

-- Politique pour la suppression (DELETE)
CREATE POLICY "Users can delete their own banners"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'banners' AND
  name LIKE (auth.uid()::text || '-%')
);
```

## Format des noms de fichiers

Les fichiers doivent être nommés avec le format suivant :
- `{userId}-{timestamp}.jpg`

Exemple :
- `550e8400-e29b-41d4-a716-446655440000-1704067200000.jpg`

Cela garantit que :
1. Le nom commence par l'UUID de l'utilisateur (pour les politiques RLS)
2. Chaque fichier est unique (grâce au timestamp)
3. Les anciens fichiers peuvent être facilement identifiés et supprimés

## Notes importantes

- Les buckets doivent être créés avec **Public access** pour que les images soient accessibles publiquement
- Les politiques RLS utilisent `auth.uid()::text = (storage.foldername(name))[1]` pour vérifier que le fichier appartient à l'utilisateur connecté
- Les URLs publiques sont générées automatiquement par Supabase Storage après l'upload

