-- Script pour corriger les permissions DELETE sur community_posts
-- A executer dans Supabase SQL Editor

-- Supprimer toutes les anciennes politiques DELETE
DROP POLICY IF EXISTS "Users can delete own posts or admins can delete any" ON public.community_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Anyone can delete posts" ON public.community_posts;

-- Creer une politique DELETE permissive
-- Permet aux utilisateurs de supprimer leurs propres posts
-- Permet aux admins de supprimer n'importe quel post
-- Pour les posts anonymes (user_id = NULL), permet la suppression si l'utilisateur n'est pas connecte
CREATE POLICY "Users can delete own posts or admins can delete any"
  ON public.community_posts
  FOR DELETE
  TO public
  USING (
    -- L'utilisateur peut supprimer son propre post
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- Les admins peuvent supprimer n'importe quel post
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
    OR
    -- Pour les posts anonymes (user_id = NULL), permettre la suppression si l'utilisateur n'est pas connecte
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- Verifier que la table a bien RLS active
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

