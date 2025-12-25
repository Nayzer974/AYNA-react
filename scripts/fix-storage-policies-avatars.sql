-- Script SQL pour corriger les politiques RLS du bucket avatars
-- À exécuter dans le SQL Editor de Supabase Dashboard
-- 
-- Ce script corrige les politiques pour qu'elles correspondent au format de nom de fichier
-- utilisé dans le code : {userId}-{timestamp}.jpg

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Politique 1: Upload d'avatars
-- Le nom de fichier doit commencer par l'UUID de l'utilisateur (format: {userId}-{timestamp}.jpg)
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  name LIKE (auth.uid()::text || '-%')
);

-- Politique 2: Lecture des avatars (public)
CREATE POLICY "Avatars are publicly readable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Politique 3: Mise à jour des avatars (si nécessaire)
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  name LIKE (auth.uid()::text || '-%')
)
WITH CHECK (
  bucket_id = 'avatars' AND
  name LIKE (auth.uid()::text || '-%')
);

-- Politique 4: Suppression des avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  name LIKE (auth.uid()::text || '-%')
);

-- Vérifier que les politiques ont été créées
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
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;






