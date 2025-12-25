-- Script pour verifier et corriger la politique DELETE sur community_posts
-- A executer dans Supabase SQL Editor

-- ============================================
-- 1. Verifier les politiques actuelles
-- ============================================
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'community_posts'
AND cmd = 'DELETE';

-- ============================================
-- 2. Supprimer toutes les anciennes politiques DELETE
-- ============================================
DROP POLICY IF EXISTS "Users can delete own posts or admins can delete any" ON public.community_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Anyone can delete posts" ON public.community_posts;

-- ============================================
-- 3. Creer une politique DELETE permissive
-- ============================================
-- Cette politique permet :
-- 1. Aux utilisateurs de supprimer leurs propres posts (auth.uid() = user_id)
-- 2. Aux admins de supprimer n'importe quel post
-- 3. A tout le monde de supprimer les posts anonymes (user_id IS NULL)
CREATE POLICY "Users can delete own posts or admins can delete any"
  ON public.community_posts
  FOR DELETE
  TO public
  USING (
    -- Cas 1: L'utilisateur peut supprimer son propre post
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- Cas 2: Les admins peuvent supprimer n'importe quel post
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
    OR
    -- Cas 3: Pour les posts anonymes (user_id = NULL), permettre la suppression a tout le monde
    -- car on ne peut pas verifier qui a cree un post anonyme
    (user_id IS NULL)
  );

-- ============================================
-- 4. Verifier que RLS est active
-- ============================================
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. Afficher la politique creee
-- ============================================
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'community_posts'
AND cmd = 'DELETE';

-- ============================================
-- 6. Test: Verifier qu'on peut supprimer un post anonyme
-- ============================================
-- Cette requete devrait retourner des posts avec user_id = NULL si ils existent
SELECT id, user_id, text, created_at 
FROM public.community_posts 
WHERE user_id IS NULL 
ORDER BY created_at DESC 
LIMIT 5;

