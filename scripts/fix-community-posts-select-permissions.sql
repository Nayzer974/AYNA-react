-- Script pour s'assurer que la politique SELECT permet de voir tous les posts
-- A executer dans Supabase SQL Editor

-- Supprimer toutes les anciennes politiques SELECT
DROP POLICY IF EXISTS "Anyone can view community posts" ON public.community_posts;
DROP POLICY IF EXISTS "Anyone can read posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can view community posts" ON public.community_posts;

-- Creer une politique SELECT permissive
-- Permet a tout le monde (authentifie ou non) de voir tous les posts
CREATE POLICY "Anyone can view community posts"
  ON public.community_posts
  FOR SELECT
  TO public
  USING (true);

-- Verifier que la table a bien RLS active
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

