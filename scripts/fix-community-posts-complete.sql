-- Script complet pour corriger toutes les permissions sur community_posts
-- A executer dans Supabase SQL Editor

-- ============================================
-- 1. S'assurer que la colonne is_foundation existe
-- ============================================
ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS is_foundation BOOLEAN DEFAULT false NOT NULL;

-- ============================================
-- 2. S'assurer que user_id peut etre NULL
-- ============================================
ALTER TABLE public.community_posts
ALTER COLUMN user_id DROP NOT NULL;

-- Ajouter un DEFAULT pour user_id
ALTER TABLE public.community_posts
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- ============================================
-- 3. Corriger la politique INSERT
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.community_posts;
DROP POLICY IF EXISTS "Anyone can insert posts" ON public.community_posts;

CREATE POLICY "Anyone can insert posts"
  ON public.community_posts
  FOR INSERT
  TO public
  WITH CHECK (true);

-- ============================================
-- 4. Corriger la politique SELECT
-- ============================================
DROP POLICY IF EXISTS "Anyone can view community posts" ON public.community_posts;
DROP POLICY IF EXISTS "Anyone can read posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can view community posts" ON public.community_posts;

CREATE POLICY "Anyone can view community posts"
  ON public.community_posts
  FOR SELECT
  TO public
  USING (true);

-- ============================================
-- 5. Verifier que RLS est active
-- ============================================
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. Afficher les politiques actuelles
-- ============================================
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'community_posts'
ORDER BY policyname;

