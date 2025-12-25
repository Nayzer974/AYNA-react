-- =====================================================
-- Script pour corriger les vues SECURITY DEFINER
-- =====================================================
-- Ce script modifie les vues de monitoring Supabase
-- pour utiliser SECURITY INVOKER au lieu de SECURITY DEFINER
-- 
-- Exécuter ce script dans Supabase SQL Editor
-- =====================================================

-- Note: Ces vues sont des vues système de Supabase pour le monitoring
-- Elles peuvent être recréées automatiquement par Supabase
-- Si les erreurs reviennent, réexécutez ce script

BEGIN;

-- 1. Corriger v_top_frequent_queries
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' 
        AND viewname = 'v_top_frequent_queries'
    ) THEN
        DROP VIEW IF EXISTS public.v_top_frequent_queries CASCADE;
    END IF;
END $$;

-- Recréer sans SECURITY DEFINER (utilise SECURITY INVOKER par défaut)
CREATE OR REPLACE VIEW public.v_top_frequent_queries
AS
SELECT 
    LEFT(query, 100) as query,
    calls,
    total_exec_time,
    mean_exec_time
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 20;

-- 2. Corriger v_unused_indexes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' 
        AND viewname = 'v_unused_indexes'
    ) THEN
        DROP VIEW IF EXISTS public.v_unused_indexes CASCADE;
    END IF;
END $$;

CREATE OR REPLACE VIEW public.v_unused_indexes
AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE 'pg_toast%'
ORDER BY schemaname, tablename;

-- 3. Corriger v_app_specific_queries
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' 
        AND viewname = 'v_app_specific_queries'
    ) THEN
        DROP VIEW IF EXISTS public.v_app_specific_queries CASCADE;
    END IF;
END $$;

CREATE OR REPLACE VIEW public.v_app_specific_queries
AS
SELECT 
    LEFT(query, 200) as query,
    calls,
    total_exec_time,
    mean_exec_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_%'
AND query NOT LIKE '%information_schema%'
ORDER BY total_exec_time DESC
LIMIT 20;

-- 4. Corriger v_queries_low_cache_hit
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' 
        AND viewname = 'v_queries_low_cache_hit'
    ) THEN
        DROP VIEW IF EXISTS public.v_queries_low_cache_hit CASCADE;
    END IF;
END $$;

CREATE OR REPLACE VIEW public.v_queries_low_cache_hit
AS
SELECT 
    LEFT(query, 200) as query,
    calls,
    shared_blks_hit,
    shared_blks_read,
    CASE 
        WHEN (shared_blks_hit + shared_blks_read) > 0 
        THEN (shared_blks_hit::float / (shared_blks_hit + shared_blks_read) * 100)
        ELSE 0 
    END as cache_hit_ratio
FROM pg_stat_statements
WHERE (shared_blks_hit + shared_blks_read) > 100
ORDER BY cache_hit_ratio ASC
LIMIT 20;

-- 5. Corriger v_tables_missing_indexes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' 
        AND viewname = 'v_tables_missing_indexes'
    ) THEN
        DROP VIEW IF EXISTS public.v_tables_missing_indexes CASCADE;
    END IF;
END $$;

CREATE OR REPLACE VIEW public.v_tables_missing_indexes
AS
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    seq_tup_read / seq_scan as avg_seq_read
FROM pg_stat_user_tables
WHERE seq_scan > 0
AND idx_scan = 0
ORDER BY seq_tup_read DESC;

-- 6. Corriger v_top_slow_queries
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' 
        AND viewname = 'v_top_slow_queries'
    ) THEN
        DROP VIEW IF EXISTS public.v_top_slow_queries CASCADE;
    END IF;
END $$;

CREATE OR REPLACE VIEW public.v_top_slow_queries
AS
SELECT 
    LEFT(query, 200) as query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
WHERE calls > 10
ORDER BY mean_exec_time DESC
LIMIT 20;

COMMIT;

-- =====================================================
-- Vérification
-- =====================================================
-- Exécutez cette requête pour vérifier que les vues
-- n'ont plus la propriété SECURITY DEFINER
-- =====================================================

SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views
WHERE schemaname = 'public'
AND viewname IN (
    'v_top_frequent_queries',
    'v_unused_indexes',
    'v_app_specific_queries',
    'v_queries_low_cache_hit',
    'v_tables_missing_indexes',
    'v_top_slow_queries'
)
ORDER BY viewname;

-- Note: Si pg_stat_statements n'est pas activé,
-- certaines vues peuvent ne pas fonctionner correctement.
-- Dans ce cas, vous pouvez simplement supprimer ces vues
-- car elles sont optionnelles pour le monitoring.

