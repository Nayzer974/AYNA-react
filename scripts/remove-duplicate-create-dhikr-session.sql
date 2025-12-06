-- Script pour supprimer la fonction RPC duplicate et garder uniquement la version avec session_type

-- 1. Supprimer l'ancienne fonction (3 paramètres)
DROP FUNCTION IF EXISTS public.create_dhikr_session(TEXT, INTEGER, INTEGER);

-- 2. Vérifier que seule la nouvelle fonction existe (4 paramètres avec session_type)
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS function_arguments,
    p.proargnames AS parameter_names,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'create_dhikr_session';


