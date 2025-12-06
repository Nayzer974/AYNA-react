-- Script pour supprimer les vues de monitoring Supabase qui génèrent des erreurs de linting
-- Ces vues ne sont pas utilisées par l'application et peuvent être supprimées en toute sécurité

-- Supprimer les vues de monitoring Supabase
DROP VIEW IF EXISTS public.v_top_frequent_queries CASCADE;
DROP VIEW IF EXISTS public.v_unused_indexes CASCADE;
DROP VIEW IF EXISTS public.v_app_specific_queries CASCADE;
DROP VIEW IF EXISTS public.v_queries_low_cache_hit CASCADE;
DROP VIEW IF EXISTS public.v_tables_missing_indexes CASCADE;
DROP VIEW IF EXISTS public.v_top_slow_queries CASCADE;

-- Note: Ces vues peuvent être recréées automatiquement par Supabase
-- Si vous les supprimez et qu'elles réapparaissent, c'est normal.
-- Elles sont utilisées uniquement par le dashboard Supabase pour l'analyse de performance.

