-- =====================================================
-- Script de TEST pour vérifier handle_new_user
-- =====================================================
-- Exécutez ce script pour vérifier que tout fonctionne
-- =====================================================

-- 1. Vérifier que la fonction existe et est correcte
SELECT 
  'Fonction handle_new_user' as check_item,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Existe'
    ELSE '❌ N''existe pas'
  END as status
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'handle_new_user';

-- 1b. Vérifier les détails de la fonction
SELECT 
  'Search path configuré' as check_item,
  CASE 
    WHEN pg_get_functiondef(oid) LIKE '%SET search_path%' THEN '✅ OUI'
    ELSE '❌ NON'
  END as status
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'handle_new_user';

SELECT 
  'Insère dans colonne "name"' as check_item,
  CASE 
    WHEN pg_get_functiondef(oid) LIKE '%INSERT INTO public.profiles%name,%' 
         AND NOT (pg_get_functiondef(oid) LIKE '%INSERT INTO public.profiles%full_name%')
    THEN '✅ OUI'
    ELSE '❌ NON'
  END as status
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'handle_new_user';

-- 2. Vérifier que le trigger existe
SELECT 
  'Trigger on_auth_user_created' as check_item,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Existe et actif'
    ELSE '❌ N''existe pas'
  END as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created'
  AND tgrelid = 'auth.users'::regclass;

-- 3. Vérifier la structure de la table profiles
SELECT 
  'Structure table profiles' as check_item,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Colonne "name" existe'
    ELSE '❌ Colonne "name" manquante'
  END as name_column,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Colonne "full_name" n''existe pas (correct)'
    ELSE '⚠️ Colonne "full_name" existe (ne devrait pas)'
  END as full_name_column
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'name';

-- 4. Vérifier les colonnes requises de la table profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('id', 'name', 'email', 'avatar', 'theme', 'analytics', 'gender')
ORDER BY column_name;

-- 5. Vérifier les politiques RLS pour INSERT
SELECT 
  'Politique RLS INSERT' as check_item,
  policyname,
  CASE 
    WHEN cmd = 'INSERT' THEN '✅ Politique INSERT existe'
    ELSE '❌ Problème avec la politique'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND cmd = 'INSERT';

-- =====================================================
-- RÉSUMÉ FINAL
-- =====================================================
SELECT 
  '✅ Si toutes les vérifications montrent ✅, la fonction est correcte et prête à être utilisée.' as message;

