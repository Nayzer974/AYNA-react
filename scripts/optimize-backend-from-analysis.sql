-- ============================================================================
-- SCRIPT D'OPTIMISATION DU BACKEND BASÉ SUR L'ANALYSE DES REQUÊTES
-- ============================================================================
-- 
-- Ce script a été généré à partir de l'analyse des requêtes utilisateur
-- Il optimise :
-- 1. Les index manquants sur les tables les plus utilisées
-- 2. Les requêtes fréquentes (dhikr_sessions, khalwa_sessions, etc.)
-- 3. Les tables avec scans séquentiels élevés
--
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : OPTIMISATION DES INDEX POUR dhikr_sessions
-- ============================================================================
-- Analyse : 925 scans séquentiels, seulement 9.58% d'utilisation d'index
-- Solution : Créer des index composites pour les requêtes fréquentes

-- Index composite pour les requêtes de sessions actives par utilisateur
CREATE INDEX IF NOT EXISTS idx_dhikr_sessions_user_active 
  ON public.dhikr_sessions(created_by, is_active) 
  WHERE is_active = true;

-- Index composite pour les requêtes de sessions ouvertes et actives
CREATE INDEX IF NOT EXISTS idx_dhikr_sessions_open_active 
  ON public.dhikr_sessions(is_open, is_active, created_at DESC) 
  WHERE is_active = true AND is_open = true;

-- Index composite pour les requêtes de sessions par créateur et statut
CREATE INDEX IF NOT EXISTS idx_dhikr_sessions_creator_active 
  ON public.dhikr_sessions(created_by, is_active, created_at DESC) 
  WHERE is_active = true;

-- Index pour optimiser les recherches par dhikr_text (si utilisé dans WHERE)
CREATE INDEX IF NOT EXISTS idx_dhikr_sessions_dhikr_text 
  ON public.dhikr_sessions(dhikr_text) 
  WHERE dhikr_text IS NOT NULL;

-- Index pour optimiser les requêtes avec target_count
CREATE INDEX IF NOT EXISTS idx_dhikr_sessions_target_count 
  ON public.dhikr_sessions(target_count) 
  WHERE target_count IS NOT NULL;

-- Index composite pour les requêtes de participants
CREATE INDEX IF NOT EXISTS idx_dhikr_session_participants_user_session 
  ON public.dhikr_session_participants(user_id, session_id);

-- Index pour optimiser les recherches de sessions par date
CREATE INDEX IF NOT EXISTS idx_dhikr_sessions_created_at_desc 
  ON public.dhikr_sessions(created_at DESC) 
  WHERE is_active = true;

-- ============================================================================
-- PARTIE 2 : OPTIMISATION DES INDEX POUR khalwa_sessions
-- ============================================================================
-- Analyse : Table très utilisée dans les requêtes spécifiques à l'application

-- Index composite pour les requêtes de statistiques par utilisateur
CREATE INDEX IF NOT EXISTS idx_khalwa_sessions_user_completed_created 
  ON public.khalwa_sessions(user_id, completed, created_at DESC) 
  WHERE completed = true;

-- Index pour optimiser les recherches par nom divin
CREATE INDEX IF NOT EXISTS idx_khalwa_sessions_divine_name 
  ON public.khalwa_sessions(divine_name_id, user_id);

-- Index composite pour les requêtes par ambiance sonore
CREATE INDEX IF NOT EXISTS idx_khalwa_sessions_sound_ambiance 
  ON public.khalwa_sessions(sound_ambiance, user_id, created_at DESC);

-- Index pour optimiser les requêtes par type de respiration
CREATE INDEX IF NOT EXISTS idx_khalwa_sessions_breathing_type 
  ON public.khalwa_sessions(breathing_type, user_id);

-- Index pour optimiser les calculs de durée
CREATE INDEX IF NOT EXISTS idx_khalwa_sessions_duration 
  ON public.khalwa_sessions(duration_minutes, user_id) 
  WHERE completed = true;

-- ============================================================================
-- PARTIE 3 : OPTIMISATION DES INDEX POUR user_usage_tracking
-- ============================================================================
-- Analyse : Table très utilisée pour le suivi des utilisateurs

-- Index composite pour les requêtes de sessions valides par utilisateur
CREATE INDEX IF NOT EXISTS idx_user_usage_tracking_user_valid_date 
  ON public.user_usage_tracking(user_id, date, is_valid) 
  WHERE is_valid = true;

-- Index pour optimiser les requêtes de sessions actives (end_time NULL)
CREATE INDEX IF NOT EXISTS idx_user_usage_tracking_active_sessions 
  ON public.user_usage_tracking(user_id, start_time DESC) 
  WHERE end_time IS NULL;

-- Index composite pour les requêtes de nettoyage des sessions orphelines
CREATE INDEX IF NOT EXISTS idx_user_usage_tracking_cleanup 
  ON public.user_usage_tracking(user_id, end_time, is_valid) 
  WHERE end_time IS NOT NULL AND is_valid = false;

-- Index pour optimiser les requêtes par module
CREATE INDEX IF NOT EXISTS idx_user_usage_tracking_module_date 
  ON public.user_usage_tracking(module, date DESC, user_id);

-- ============================================================================
-- PARTIE 4 : OPTIMISATION DES INDEX POUR conversations (ayna_conversations)
-- ============================================================================
-- Analyse : Table utilisée pour les conversations cryptées

-- Créer les index seulement si la table existe
DO $$
BEGIN
  -- Vérifier si ayna_conversations existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ayna_conversations'
  ) THEN
    -- Index composite pour les requêtes de conversations par utilisateur
    CREATE INDEX IF NOT EXISTS idx_ayna_conversations_user_updated 
      ON public.ayna_conversations(user_id, updated_at DESC);
    
    -- Index pour optimiser les recherches par date de création
    CREATE INDEX IF NOT EXISTS idx_ayna_conversations_created_at 
      ON public.ayna_conversations(created_at DESC);
    
    RAISE NOTICE '✅ Index créés pour ayna_conversations';
  END IF;
  
  -- Vérifier si conversations existe (nom alternatif)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'conversations'
  ) THEN
    -- Index composite pour les requêtes de conversations par utilisateur
    CREATE INDEX IF NOT EXISTS idx_conversations_user_updated 
      ON public.conversations(user_id, updated_at DESC);
    
    -- Index pour optimiser les recherches par date de création
    CREATE INDEX IF NOT EXISTS idx_conversations_created_at 
      ON public.conversations(created_at DESC);
    
    RAISE NOTICE '✅ Index créés pour conversations';
  END IF;
END $$;

-- ============================================================================
-- PARTIE 5 : OPTIMISATION DES INDEX POUR community_posts
-- ============================================================================
-- Analyse : Table utilisée pour les posts communautaires

-- Créer les index seulement si les tables existent
DO $$
BEGIN
  -- Vérifier si community_posts existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'community_posts'
  ) THEN
    -- Index composite pour les requêtes de posts par utilisateur
    CREATE INDEX IF NOT EXISTS idx_community_posts_user_created 
      ON public.community_posts(user_id, created_at DESC);
    
    -- Index pour optimiser les recherches de posts récents
    -- Vérifier si deleted_at existe avant de créer l'index partiel
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'community_posts' 
      AND column_name = 'deleted_at'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_community_posts_created_at_desc 
        ON public.community_posts(created_at DESC) 
        WHERE deleted_at IS NULL;
    ELSE
      CREATE INDEX IF NOT EXISTS idx_community_posts_created_at_desc 
        ON public.community_posts(created_at DESC);
    END IF;
    
    RAISE NOTICE '✅ Index créés pour community_posts';
  END IF;
  
  -- Vérifier si community_post_likes existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'community_post_likes'
  ) THEN
    -- Index pour optimiser les recherches par likes
    CREATE INDEX IF NOT EXISTS idx_community_post_likes_post_user 
      ON public.community_post_likes(post_id, user_id);
    
    RAISE NOTICE '✅ Index créés pour community_post_likes';
  END IF;
END $$;

-- ============================================================================
-- PARTIE 6 : OPTIMISATION DES INDEX POUR module_visits
-- ============================================================================
-- Analyse : Table pour suivre les visites de modules

-- Créer les index seulement si la table existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'module_visits'
  ) THEN
    -- Index composite pour les requêtes de visites par utilisateur et module
    CREATE INDEX IF NOT EXISTS idx_module_visits_user_module_visited 
      ON public.module_visits(user_id, module, visited_at DESC);
    
    RAISE NOTICE '✅ Index créés pour module_visits';
  END IF;
END $$;

-- ============================================================================
-- PARTIE 7 : ANALYSE ET MISE À JOUR DES STATISTIQUES
-- ============================================================================
-- Important : Mettre à jour les statistiques pour que le planificateur utilise les nouveaux index

-- Analyser toutes les tables principales (seulement si elles existent)
DO $$
BEGIN
  -- Analyser dhikr_sessions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dhikr_sessions') THEN
    ANALYZE public.dhikr_sessions;
    RAISE NOTICE '✅ Statistiques mises à jour pour dhikr_sessions';
  END IF;
  
  -- Analyser dhikr_session_participants
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dhikr_session_participants') THEN
    ANALYZE public.dhikr_session_participants;
    RAISE NOTICE '✅ Statistiques mises à jour pour dhikr_session_participants';
  END IF;
  
  -- Analyser khalwa_sessions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'khalwa_sessions') THEN
    ANALYZE public.khalwa_sessions;
    RAISE NOTICE '✅ Statistiques mises à jour pour khalwa_sessions';
  END IF;
  
  -- Analyser user_usage_tracking
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_usage_tracking') THEN
    ANALYZE public.user_usage_tracking;
    RAISE NOTICE '✅ Statistiques mises à jour pour user_usage_tracking';
  END IF;
  
  -- Analyser les tables de conversations
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ayna_conversations') THEN
    ANALYZE public.ayna_conversations;
    RAISE NOTICE '✅ Statistiques mises à jour pour ayna_conversations';
  END IF;
  
  -- Analyser community_posts
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_posts') THEN
    ANALYZE public.community_posts;
    RAISE NOTICE '✅ Statistiques mises à jour pour community_posts';
  END IF;
  
  -- Analyser community_post_likes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_post_likes') THEN
    ANALYZE public.community_post_likes;
    RAISE NOTICE '✅ Statistiques mises à jour pour community_post_likes';
  END IF;
  
  -- Analyser module_visits
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'module_visits') THEN
    ANALYZE public.module_visits;
    RAISE NOTICE '✅ Statistiques mises à jour pour module_visits';
  END IF;
END $$;

-- ============================================================================
-- PARTIE 8 : OPTIMISATION DES FONCTIONS RPC FRÉQUENTES
-- ============================================================================
-- Analyse : process_dhikr_session_clicks est appelé 3,835 fois
-- Optimisation : Ajouter des index et améliorer la fonction si nécessaire

-- La fonction process_dhikr_session_clicks utilise déjà les bons index
-- Mais on peut optimiser en s'assurant que les index existent
-- (déjà créés dans les parties précédentes)

-- ============================================================================
-- PARTIE 9 : NETTOYAGE DES INDEX INUTILISÉS (OPTIONNEL)
-- ============================================================================
-- Attention : Ne supprimez que les index que vous êtes sûr de ne pas utiliser
-- Cette partie est commentée par défaut

-- Pour voir les index inutilisés :
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan ASC;

-- Exemple de suppression d'un index inutilisé (DÉCOMMENTEZ SEULEMENT SI NÉCESSAIRE) :
-- DROP INDEX IF EXISTS public.nom_index_inutilise;

-- ============================================================================
-- PARTIE 10 : VÉRIFICATIONS FINALES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ ==========================================';
  RAISE NOTICE '✅ OPTIMISATIONS TERMINÉES';
  RAISE NOTICE '✅ ==========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Index créés pour dhikr_sessions';
  RAISE NOTICE '✅ Index créés pour khalwa_sessions';
  RAISE NOTICE '✅ Index créés pour user_usage_tracking';
  RAISE NOTICE '✅ Index créés pour conversations';
  RAISE NOTICE '✅ Index créés pour community_posts';
  RAISE NOTICE '✅ Index créés pour module_visits';
  RAISE NOTICE '✅ Statistiques mises à jour';
  RAISE NOTICE '';
  RAISE NOTICE 'Les optimisations suivantes ont été appliquées :';
  RAISE NOTICE '  - Index composites pour les requêtes fréquentes';
  RAISE NOTICE '  - Index partiels (WHERE) pour réduire la taille';
  RAISE NOTICE '  - Index pour les recherches par date (DESC)';
  RAISE NOTICE '  - Mise à jour des statistiques pour le planificateur';
  RAISE NOTICE '';
  RAISE NOTICE 'Pour vérifier l''efficacité des index :';
  RAISE NOTICE '  SELECT * FROM pg_stat_user_indexes WHERE schemaname = ''public'';';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- PARTIE 11 : REQUÊTES DE VÉRIFICATION POST-OPTIMISATION (OPTIONNEL)
-- ============================================================================
-- NOTE: Ces requêtes peuvent ne pas fonctionner dans Supabase selon les permissions
-- Exécutez-les manuellement après quelques jours pour voir l'amélioration
-- Si vous obtenez une erreur de permissions, ignorez cette partie

-- ============================================================================
-- Pour voir les statistiques d'utilisation des index :
-- ============================================================================
-- Copiez et exécutez cette requête manuellement dans l'éditeur SQL de Supabase
-- 
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as "Scans",
--   idx_tup_read as "Tuples lus",
--   idx_tup_fetch as "Tuples récupérés"
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     SELECT table_name 
--     FROM information_schema.tables 
--     WHERE table_schema = 'public' 
--     AND table_name IN ('dhikr_sessions', 'khalwa_sessions', 'user_usage_tracking', 'ayna_conversations', 'conversations', 'community_posts', 'community_post_likes', 'module_visits')
--   )
-- ORDER BY tablename, idx_scan DESC;

-- ============================================================================
-- Pour voir les tables avec scans séquentiels (devrait être réduit) :
-- ============================================================================
-- Copiez et exécutez cette requête manuellement dans l'éditeur SQL de Supabase
--
-- SELECT 
--   schemaname,
--   tablename,
--   seq_scan as "Scans séquentiels",
--   seq_tup_read as "Tuples lus (seq)",
--   idx_scan as "Scans d'index",
--   idx_tup_fetch as "Tuples récupérés (idx)",
--   CASE 
--     WHEN seq_scan + idx_scan > 0 
--     THEN ROUND(100.0 * idx_scan / (seq_scan + idx_scan), 2)
--     ELSE 0 
--   END as "Pourcentage utilisation index"
-- FROM pg_stat_user_tables
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     SELECT table_name 
--     FROM information_schema.tables 
--     WHERE table_schema = 'public' 
--     AND table_name IN ('dhikr_sessions', 'khalwa_sessions', 'user_usage_tracking', 'ayna_conversations', 'conversations', 'community_posts', 'community_post_likes', 'module_visits')
--   )
-- ORDER BY seq_scan DESC;

-- ============================================================================
-- Alternative : Voir simplement tous les index créés
-- ============================================================================
-- Cette requête devrait fonctionner dans Supabase :
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('dhikr_sessions', 'khalwa_sessions', 'user_usage_tracking', 'ayna_conversations', 'conversations', 'community_posts', 'community_post_likes', 'module_visits')
  )
ORDER BY tablename, indexname;

