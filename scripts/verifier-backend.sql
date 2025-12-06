-- Script de vérification du backend DairatAnNur
-- Exécutez ce script dans Supabase SQL Editor pour vérifier l'état du backend

-- 1. Vérifier les tables
SELECT 
  'Tables' as type,
  table_name as name,
  'OK' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('dhikr_sessions', 'dhikr_session_participants', 'dhikr_session_clicks')
ORDER BY table_name;

-- 2. Vérifier les fonctions RPC
SELECT 
  'Fonctions RPC' as type,
  proname as name,
  CASE 
    WHEN proname = 'create_dhikr_session' THEN 'OK'
    WHEN proname = 'join_dhikr_session' THEN 'OK'
    WHEN proname = 'leave_dhikr_session' THEN 'OK'
    ELSE 'À vérifier'
  END as status
FROM pg_proc 
WHERE proname IN ('create_dhikr_session', 'join_dhikr_session', 'leave_dhikr_session')
ORDER BY proname;

-- 3. Vérifier les politiques RLS
SELECT 
  'Politiques RLS' as type,
  tablename || ' - ' || policyname as name,
  'OK' as status
FROM pg_policies 
WHERE tablename LIKE 'dhikr%'
ORDER BY tablename, policyname;

-- 4. Vérifier les index
SELECT 
  'Index' as type,
  indexname as name,
  'OK' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename LIKE 'dhikr%'
ORDER BY tablename, indexname;

-- 5. Résumé
SELECT 
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('dhikr_sessions', 'dhikr_session_participants', 'dhikr_session_clicks')) as tables_count,
  (SELECT COUNT(*) FROM pg_proc 
   WHERE proname IN ('create_dhikr_session', 'join_dhikr_session', 'leave_dhikr_session')) as functions_count,
  (SELECT COUNT(*) FROM pg_policies 
   WHERE tablename LIKE 'dhikr%') as policies_count;

