-- Script de test pour diagnostiquer les problèmes RLS
-- À exécuter dans le SQL Editor de Supabase Dashboard

-- 1. Vérifier les politiques existantes
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;

-- 2. Vérifier que RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 3. Test: Créer une politique temporaire plus permissive pour tester
-- (À supprimer après les tests)
DROP POLICY IF EXISTS "TEST: Allow all authenticated uploads" ON storage.objects;

CREATE POLICY "TEST: Allow all authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Note: Si cette politique temporaire fonctionne, le problème vient de la condition
-- sur le nom du fichier. Vérifiez que le nom du fichier commence bien par auth.uid()

