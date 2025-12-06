-- Script pour supprimer l'ancienne fonction create_dhikr_session (3 paramètres)
-- et résoudre le conflit avec la nouvelle version (4 paramètres)

-- 1. Lister toutes les versions de la fonction pour vérification
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS function_arguments,
    p.pronargs AS num_parameters
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'create_dhikr_session'
ORDER BY p.pronargs;

-- 2. Supprimer l'ancienne fonction avec 3 paramètres uniquement
-- Cette fonction n'a pas le paramètre p_session_type
DROP FUNCTION IF EXISTS public.create_dhikr_session(TEXT, INTEGER, INTEGER);

-- 3. Vérifier que seule la nouvelle fonction existe (4 paramètres)
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS function_arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'create_dhikr_session';


