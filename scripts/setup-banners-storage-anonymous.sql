-- Script SQL pour configurer le bucket banners avec accès anonyme
-- À exécuter dans le SQL Editor de Supabase Dashboard

-- 1. Créer le bucket banners s'il n'existe pas déjà
-- Note: Le bucket doit être créé manuellement dans le Dashboard Supabase > Storage
-- avec les paramètres suivants:
-- - Name: banners
-- - Public bucket: ✅ Activé
-- - File size limit: 5 MB (ou selon vos besoins)

-- 2. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Anyone can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view banners" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own banners" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own banners" ON storage.objects;

-- 3. Politique 1: Permettre à tous (authentifiés et non-authentifiés) d'uploader des bannières
-- Format de nom: {user_id}-{timestamp}.jpg ou anonymous-{timestamp}.jpg
CREATE POLICY "Anyone can upload banners"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'banners' 
  AND (
    -- Format pour utilisateurs authentifiés: {user_id}-{timestamp}.jpg
    (name LIKE (auth.uid()::text || '-%') OR name LIKE ('banners/' || auth.uid()::text || '-%'))
    OR
    -- Format pour utilisateurs anonymes: anonymous-{timestamp}.jpg
    (name LIKE 'anonymous-%' OR name LIKE 'banners/anonymous-%')
  )
);

-- 4. Politique 2: Permettre à tous (authentifiés et non-authentifiés) de voir les bannières
CREATE POLICY "Anyone can view banners"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'banners');

-- 5. Politique 3: Permettre à tous de mettre à jour leurs propres bannières
CREATE POLICY "Users can update their own banners"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'banners' 
  AND (
    -- Utilisateurs authentifiés peuvent mettre à jour leurs propres bannières
    (auth.uid() IS NOT NULL AND (name LIKE (auth.uid()::text || '-%') OR name LIKE ('banners/' || auth.uid()::text || '-%')))
    OR
    -- Utilisateurs anonymes peuvent mettre à jour leurs bannières anonymes
    (name LIKE 'anonymous-%' OR name LIKE 'banners/anonymous-%')
  )
);

-- 6. Politique 4: Permettre à tous de supprimer leurs propres bannières
CREATE POLICY "Users can delete their own banners"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'banners' 
  AND (
    -- Utilisateurs authentifiés peuvent supprimer leurs propres bannières
    (auth.uid() IS NOT NULL AND (name LIKE (auth.uid()::text || '-%') OR name LIKE ('banners/' || auth.uid()::text || '-%')))
    OR
    -- Utilisateurs anonymes peuvent supprimer leurs bannières anonymes
    (name LIKE 'anonymous-%' OR name LIKE 'banners/anonymous-%')
  )
);




