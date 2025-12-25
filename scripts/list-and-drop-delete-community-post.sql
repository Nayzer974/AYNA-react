-- ============================================
-- SCRIPT DE DIAGNOSTIC ET NETTOYAGE
-- Fonction : delete_community_post
-- ============================================
-- Ce script liste toutes les versions existantes de la fonction
-- puis les supprime une par une avant de créer la nouvelle version
-- ============================================

-- 1. Lister toutes les versions existantes
SELECT 
  p.oid,
  p.proname,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_identity_arguments(p.oid) as identity_arguments,
  p.oid::regprocedure as full_signature
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'delete_community_post'
AND n.nspname = 'public'
ORDER BY p.oid;

-- 2. Supprimer toutes les versions existantes
DO $$
DECLARE
  func_record RECORD;
  drop_sql TEXT;
  count_dropped INTEGER := 0;
BEGIN
  -- Trouver toutes les versions de delete_community_post
  FOR func_record IN 
    SELECT 
      p.oid,
      p.proname,
      pg_get_function_identity_arguments(p.oid) as identity_args,
      p.oid::regprocedure as full_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'delete_community_post'
    AND n.nspname = 'public'
  LOOP
    -- Construire la commande DROP avec la signature complète
    -- Utiliser la signature d'identité pour être sûr
    drop_sql := 'DROP FUNCTION IF EXISTS public.delete_community_post(' || func_record.identity_args || ') CASCADE';
    RAISE NOTICE 'Suppression de: %', drop_sql;
    EXECUTE drop_sql;
    count_dropped := count_dropped + 1;
  END LOOP;
  
  IF count_dropped = 0 THEN
    RAISE NOTICE 'Aucune fonction delete_community_post trouvée à supprimer';
  ELSE
    RAISE NOTICE 'Suppression réussie: % version(s) supprimée(s)', count_dropped;
  END IF;
END $$;

-- 3. Vérifier qu'aucune version n'existe plus
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Aucune fonction delete_community_post trouvée - Prêt pour la création'
    ELSE '⚠️ ' || COUNT(*)::TEXT || ' version(s) encore présente(s)'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'delete_community_post'
AND n.nspname = 'public';










