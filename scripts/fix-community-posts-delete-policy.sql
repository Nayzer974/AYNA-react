-- Script pour corriger la politique DELETE sur community_posts
-- Permet de supprimer les posts anonymes (user_id = NULL)
-- A executer dans Supabase SQL Editor

-- Supprimer l'ancienne politique DELETE
DROP POLICY IF EXISTS "Users can delete own posts or admins can delete any" ON public.community_posts;

-- Creer une nouvelle politique DELETE qui gère aussi les posts anonymes
-- Permet :
-- 1. Aux utilisateurs de supprimer leurs propres posts
-- 2. Aux admins de supprimer n'importe quel post
-- 3. A tout le monde de supprimer les posts anonymes (user_id = NULL)
--    car on ne peut pas verifier qui a cree un post anonyme
CREATE POLICY "Users can delete own posts or admins can delete any"
  ON public.community_posts
  FOR DELETE
  TO public
  USING (
    -- L'utilisateur peut supprimer son propre post (si user_id correspond)
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- Les admins peuvent supprimer n'importe quel post
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
    OR
    -- Pour les posts anonymes (user_id = NULL), permettre la suppression a tout le monde
    -- car on ne peut pas verifier qui a cree un post anonyme
    (user_id IS NULL)
  );

-- Verifier que la table a bien RLS active
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Afficher la politique mise a jour
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'community_posts'
AND cmd = 'DELETE';

