-- ============================================
-- Script de vérification de toutes les fonctions RPC
-- Détecte les conflits de surcharge (overload)
-- ============================================

-- 1. Lister toutes les fonctions RPC dans le schéma public
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS function_arguments,
    p.proargnames AS parameter_names,
    p.proargtypes::regtype[] AS parameter_types,
    CASE 
        WHEN COUNT(*) OVER (PARTITION BY p.proname) > 1 THEN '⚠️ CONFLIT POTENTIEL'
        ELSE '✅ OK'
    END AS status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN (
        -- Fonctions dhikr
        'create_dhikr_session',
        'join_dhikr_session',
        'leave_dhikr_session',
        'add_dhikr_session_click',
        'process_dhikr_session_clicks',
        'delete_all_active_dhikr_sessions',
        -- Fonctions khalwa
        'get_khalwa_stats',
        -- Autres fonctions RPC potentiellement utilisées
        'check_user_ban_status',
        'get_user_usage_stats',
        'get_daily_usage_frequency'
    )
ORDER BY p.proname, p.oid;

-- 2. Détecter spécifiquement les fonctions avec plusieurs signatures (surcharge)
SELECT 
    p.proname AS function_name,
    COUNT(*) AS overload_count,
    STRING_AGG(pg_get_function_identity_arguments(p.oid), ' | ') AS all_signatures
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN (
        'create_dhikr_session',
        'join_dhikr_session',
        'leave_dhikr_session',
        'add_dhikr_session_click',
        'process_dhikr_session_clicks',
        'delete_all_active_dhikr_sessions',
        'get_khalwa_stats',
        'check_user_ban_status',
        'get_user_usage_stats',
        'get_daily_usage_frequency'
    )
GROUP BY p.proname
HAVING COUNT(*) > 1
ORDER BY overload_count DESC;

-- 3. Vérifier spécifiquement les fonctions dhikr
SELECT 
    '=== FONCTIONS DHIKR ===' AS section,
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS function_arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname LIKE '%dhikr%'
ORDER BY p.proname, p.oid;

-- 4. Vérifier les fonctions khalwa
SELECT 
    '=== FONCTIONS KHALWA ===' AS section,
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS function_arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname LIKE '%khalwa%'
ORDER BY p.proname, p.oid;

-- 5. Liste complète de toutes les fonctions RPC publiques (pour référence)
SELECT 
    '=== TOUTES LES FONCTIONS RPC PUBLIQUES ===' AS section,
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS function_arguments,
    CASE 
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END AS security_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f' -- Fonctions seulement (pas les procédures)
ORDER BY p.proname, p.oid;



