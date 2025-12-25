-- Script pour créer le bucket "feedback" dans Supabase Storage
-- Permet de stocker les images jointes aux feedbacks

-- ============================================
-- 1. Créer le bucket "feedback" (si n'existe pas)
-- ============================================
-- Note: Le bucket doit être créé manuellement via le Dashboard Supabase
-- Storage > New bucket > Name: "feedback" > Public bucket: ✅ Activé

-- ============================================
-- 2. Politiques RLS pour le bucket "feedback"
-- ============================================

-- Politique: Tous les utilisateurs authentifiés peuvent uploader des images
CREATE POLICY "Users can upload feedback images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feedback' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique: Tous les utilisateurs authentifiés peuvent voir les images qu'ils ont uploadées
CREATE POLICY "Users can view their own feedback images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'feedback' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique: Tous les utilisateurs authentifiés peuvent supprimer leurs propres images
CREATE POLICY "Users can delete their own feedback images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'feedback' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique: Les admins peuvent voir toutes les images de feedback
CREATE POLICY "Admins can view all feedback images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'feedback' AND
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
      OR auth.users.email = 'pro.ibrahima00@gmail.com'
      OR auth.users.email = 'admin@admin.com'
    )
  )
);

-- ============================================
-- 3. Commentaires
-- ============================================
COMMENT ON POLICY "Users can upload feedback images" ON storage.objects IS 
  'Permet aux utilisateurs authentifiés d''uploader des images dans le bucket feedback';

COMMENT ON POLICY "Users can view their own feedback images" ON storage.objects IS 
  'Permet aux utilisateurs de voir leurs propres images de feedback';

COMMENT ON POLICY "Users can delete their own feedback images" ON storage.objects IS 
  'Permet aux utilisateurs de supprimer leurs propres images de feedback';

COMMENT ON POLICY "Admins can view all feedback images" ON storage.objects IS 
  'Permet aux admins de voir toutes les images de feedback';





