-- ============================================================================
-- SCRIPT COMPLET DE CORRECTION DES ERREURS RLS ET TABLES MANQUANTES
-- ============================================================================
-- 
-- Ce script corrige :
-- 1. Les politiques RLS pour khalwa_sessions (format optimisé)
-- 2. Crée la table module_visits si elle n'existe pas (pour éviter l'erreur PGRST205)
--
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : CORRECTION DES POLITIQUES RLS POUR khalwa_sessions
-- ============================================================================

-- Vérifier que la table existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'khalwa_sessions'
  ) THEN
    RAISE NOTICE '⚠️ La table khalwa_sessions n''existe pas. Exécutez d''abord create-khalwa-sessions-table.sql';
  ELSE
    RAISE NOTICE '✅ Table khalwa_sessions trouvée';
  END IF;
END $$;

-- Activer RLS si ce n'est pas déjà fait
ALTER TABLE IF EXISTS public.khalwa_sessions ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes pour les recréer proprement
DROP POLICY IF EXISTS "Users can view their own khalwa sessions" ON public.khalwa_sessions;
DROP POLICY IF EXISTS "Users can insert their own khalwa sessions" ON public.khalwa_sessions;
DROP POLICY IF EXISTS "Users can update their own khalwa sessions" ON public.khalwa_sessions;
DROP POLICY IF EXISTS "Users can delete their own khalwa sessions" ON public.khalwa_sessions;

-- Recréer les politiques RLS avec format optimisé (select auth.uid())
CREATE POLICY "Users can view their own khalwa sessions"
  ON public.khalwa_sessions
  FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own khalwa sessions"
  ON public.khalwa_sessions
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own khalwa sessions"
  ON public.khalwa_sessions
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own khalwa sessions"
  ON public.khalwa_sessions
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- PARTIE 2 : CRÉATION DE LA TABLE module_visits (si nécessaire)
-- ============================================================================

-- Vérifier si la table module_visits existe déjà
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'module_visits'
  ) THEN
    RAISE NOTICE '✅ La table module_visits existe déjà. Aucune action nécessaire.';
  ELSE
    RAISE NOTICE '⚠️ La table module_visits n''existe pas. Création en cours...';
  END IF;
END $$;

-- Créer la table module_visits si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.module_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_module_visits_user_id ON public.module_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_module_visits_module ON public.module_visits(module);
CREATE INDEX IF NOT EXISTS idx_module_visits_visited_at ON public.module_visits(visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_module_visits_user_module ON public.module_visits(user_id, module);

-- Activer RLS
ALTER TABLE IF EXISTS public.module_visits ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Users can view their own module visits" ON public.module_visits;
DROP POLICY IF EXISTS "Users can insert their own module visits" ON public.module_visits;
DROP POLICY IF EXISTS "Users can delete their own module visits" ON public.module_visits;

-- Créer les politiques RLS
CREATE POLICY "Users can view their own module visits"
  ON public.module_visits
  FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own module visits"
  ON public.module_visits
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own module visits"
  ON public.module_visits
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- VÉRIFICATIONS FINALES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ ==========================================';
  RAISE NOTICE '✅ CORRECTIONS TERMINÉES';
  RAISE NOTICE '✅ ==========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Politiques RLS corrigées pour khalwa_sessions';
  RAISE NOTICE '✅ Format optimisé utilisé : (select auth.uid())';
  RAISE NOTICE '✅ Table module_visits créée/vérifiée';
  RAISE NOTICE '✅ Toutes les tables sont configurées avec RLS';
  RAISE NOTICE '';
  RAISE NOTICE 'Les erreurs suivantes devraient être résolues :';
  RAISE NOTICE '  - new row violates row-level security policy for table "khalwa_sessions"';
  RAISE NOTICE '  - Could not find the table "public.module_visits" in the schema cache';
  RAISE NOTICE '';
END $$;


