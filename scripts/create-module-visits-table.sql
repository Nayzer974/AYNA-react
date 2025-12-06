-- ============================================================================
-- CRÉATION DE LA TABLE module_visits (si nécessaire)
-- ============================================================================
-- 
-- Cette table est utilisée pour suivre les visites de modules
-- Si elle n'existe pas déjà, ce script la crée avec les politiques RLS appropriées
--
-- NOTE: Il semble que cette table pourrait être remplacée par user_usage_tracking
-- Vérifiez d'abord si c'est vraiment nécessaire avant d'exécuter ce script
-- ============================================================================

-- Vérifier si la table existe déjà
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'module_visits'
  ) THEN
    RAISE NOTICE 'La table module_visits existe déjà. Aucune action nécessaire.';
    RETURN;
  END IF;
END $$;

-- Créer la table module_visits
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
ALTER TABLE public.module_visits ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "Users can view their own module visits" ON public.module_visits;
CREATE POLICY "Users can view their own module visits"
  ON public.module_visits
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own module visits" ON public.module_visits;
CREATE POLICY "Users can insert their own module visits"
  ON public.module_visits
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own module visits" ON public.module_visits;
CREATE POLICY "Users can delete their own module visits"
  ON public.module_visits
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Vérification finale
DO $$
BEGIN
  RAISE NOTICE '✅ Table module_visits créée avec succès';
  RAISE NOTICE '✅ Index créés';
  RAISE NOTICE '✅ RLS activé et politiques créées';
END $$;


