-- Script SQL pour configurer le bucket avatars et ses politiques RLS dans Supabase
-- À exécuter dans le SQL Editor de Supabase Dashboard

-- 1. Créer le bucket avatars s'il n'existe pas déjà
-- Note: Le bucket doit être créé manuellement dans le Dashboard Supabase > Storage
-- avec les paramètres suivants:
-- - Name: avatars
-- - Public bucket: ✅ Activé
-- - File size limit: 5 MB (ou selon vos besoins)

-- 2. Supprimer les anciennes politiques si elles existent
-- Note: Si vous obtenez une erreur de permission, ignorez ces lignes et créez les politiques directement
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- 3. Note: RLS est déjà activé par défaut sur storage.objects dans Supabase
-- Pas besoin de l'activer manuellement

-- 4. Politique 1: Permettre aux utilisateurs authentifiés d'uploader leurs propres avatars
-- Le nom du fichier doit commencer par l'ID de l'utilisateur (format: {user_id}-{timestamp}.jpg)
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'avatars'
  AND (name LIKE (auth.uid()::text || '-%') OR name LIKE ('avatars/' || auth.uid()::text || '-%'))
);

-- 5. Politique 2: Permettre à tous (authentifiés et non-authentifiés) de voir les avatars
-- Car les avatars doivent être accessibles publiquement
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 6. Politique 3: Permettre aux utilisateurs de mettre à jour leurs propres avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND name LIKE (auth.uid()::text || '-%')
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND name LIKE (auth.uid()::text || '-%')
);

-- 7. Politique 4: Permettre aux utilisateurs de supprimer leurs propres avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND name LIKE (auth.uid()::text || '-%')
);

-- Vérification: Afficher les politiques créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

