-- Script SQL SIMPLIFIÉ pour configurer les politiques RLS pour le bucket avatars
-- À exécuter dans le SQL Editor de Supabase Dashboard
-- 
-- IMPORTANT: Si vous obtenez une erreur de permission, utilisez l'interface graphique
-- du Dashboard Supabase > Storage > Policies au lieu de ce script

-- 1. Créer le bucket avatars manuellement dans le Dashboard:
--    Storage > New bucket > Name: "avatars" > Public: ✅ Activé

-- 2. Supprimer les politiques existantes si elles existent (pour permettre la réexécution)
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- 3. Créer les politiques RLS

-- Politique 1: Upload d'avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND name LIKE (auth.uid()::text || '-%')
);

-- Politique 2: Lecture des avatars (public)
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Politique 3: Mise à jour des avatars
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

-- Politique 4: Suppression des avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND name LIKE (auth.uid()::text || '-%')
);

