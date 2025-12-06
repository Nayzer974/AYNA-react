-- ============================================================================
-- CORRECTION DES POLITIQUES RLS POUR khalwa_sessions
-- ============================================================================
-- 
-- Ce script corrige les politiques RLS pour la table khalwa_sessions
-- en utilisant le format optimisé (select auth.uid()) pour de meilleures performances
-- et en s'assurant que le schéma public est correctement spécifié
--
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- ============================================================================

-- Vérifier que la table existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'khalwa_sessions'
  ) THEN
    RAISE EXCEPTION 'La table khalwa_sessions n''existe pas. Exécutez d''abord create-khalwa-sessions-table.sql';
  END IF;
END $$;

-- Activer RLS si ce n'est pas déjà fait
ALTER TABLE public.khalwa_sessions ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes pour les recréer proprement
DROP POLICY IF EXISTS "Users can view their own khalwa sessions" ON public.khalwa_sessions;
DROP POLICY IF EXISTS "Users can insert their own khalwa sessions" ON public.khalwa_sessions;
DROP POLICY IF EXISTS "Users can update their own khalwa sessions" ON public.khalwa_sessions;
DROP POLICY IF EXISTS "Users can delete their own khalwa sessions" ON public.khalwa_sessions;

-- ============================================================================
-- RECRÉATION DES POLITIQUES RLS AVEC FORMAT OPTIMISÉ
-- ============================================================================

-- Politique SELECT : les utilisateurs ne peuvent voir que leurs propres sessions
CREATE POLICY "Users can view their own khalwa sessions"
  ON public.khalwa_sessions
  FOR SELECT
  USING ((select auth.uid()) = user_id);

-- Politique INSERT : les utilisateurs ne peuvent insérer que leurs propres sessions
CREATE POLICY "Users can insert their own khalwa sessions"
  ON public.khalwa_sessions
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- Politique UPDATE : les utilisateurs ne peuvent mettre à jour que leurs propres sessions
CREATE POLICY "Users can update their own khalwa sessions"
  ON public.khalwa_sessions
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Politique DELETE : les utilisateurs ne peuvent supprimer que leurs propres sessions
CREATE POLICY "Users can delete their own khalwa sessions"
  ON public.khalwa_sessions
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Vérification finale
DO $$
BEGIN
  RAISE NOTICE '✅ Politiques RLS corrigées pour khalwa_sessions';
  RAISE NOTICE '✅ Format optimisé utilisé : (select auth.uid())';
  RAISE NOTICE '✅ Schéma public spécifié explicitement';
END $$;


