-- =====================================================
-- Script FINAL pour corriger handle_new_user
-- =====================================================
-- Ce script garantit que la fonction handle_new_user
-- insère correctement dans la table profiles
-- =====================================================

BEGIN;

-- Supprimer le trigger d'abord
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Recréer la fonction avec la structure correcte
-- IMPORTANT: La fonction lit 'full_name' depuis raw_user_meta_data comme fallback,
-- mais elle insère TOUJOURS dans la colonne 'name' de la table profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Insérer dans la table profiles avec la colonne 'name' (pas 'full_name')
  INSERT INTO public.profiles (
    id, 
    name,           -- ✅ Colonne correcte : 'name'
    email, 
    avatar, 
    theme, 
    analytics,
    gender
  )
  VALUES (
    NEW.id,
    -- Lire depuis raw_user_meta_data : 'name' en priorité, puis 'full_name' comme fallback
    COALESCE(
      NEW.raw_user_meta_data->>'name', 
      NEW.raw_user_meta_data->>'full_name', 
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_id', 
      NEW.raw_user_meta_data->>'avatar_url', 
      NEW.raw_user_meta_data->>'picture'
    ),
    COALESCE(NEW.raw_user_meta_data->>'theme', 'default'),
    '{"totalDhikr": 0, "totalNotes": 0, "streak": 0, "lastActive": ""}'::jsonb,
    COALESCE(NEW.raw_user_meta_data->>'gender', NULL)
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = COALESCE(EXCLUDED.email, profiles.email),
    name = COALESCE(EXCLUDED.name, profiles.name),
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Recréer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMIT;

-- =====================================================
-- VÉRIFICATION DÉTAILLÉE
-- =====================================================

-- 1. Vérifier que la fonction existe
SELECT 
  'Fonction existe' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ OUI'
    ELSE '❌ NON'
  END as status
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'handle_new_user';

-- 2. Vérifier que la fonction a search_path
SELECT 
  'Search path configuré' as check_name,
  CASE 
    WHEN pg_get_functiondef(oid) LIKE '%SET search_path%' THEN '✅ OUI'
    ELSE '❌ NON'
  END as status
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'handle_new_user';

-- 3. Vérifier que la fonction insère dans 'name' (pas 'full_name')
SELECT 
  'Insère dans colonne "name"' as check_name,
  CASE 
    WHEN pg_get_functiondef(oid) LIKE '%INSERT INTO public.profiles%'
         AND pg_get_functiondef(oid) LIKE '%name,%'
         AND NOT (pg_get_functiondef(oid) LIKE '%INSERT INTO public.profiles%full_name%')
    THEN '✅ OUI - Insère dans "name"'
    ELSE '❌ NON - Vérifiez la structure'
  END as status
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'handle_new_user';

-- 4. Vérifier que le trigger existe
SELECT 
  'Trigger existe' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ OUI'
    ELSE '❌ NON'
  END as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created'
  AND tgrelid = 'auth.users'::regclass;

-- 5. Vérifier la structure de la table profiles
SELECT 
  'Colonne "name" existe' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ OUI'
    ELSE '❌ NON'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'name';

SELECT 
  'Colonne "full_name" existe' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '⚠️ OUI (ne devrait pas exister)'
    ELSE '✅ NON (correct)'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'full_name';

-- =====================================================
-- RÉSUMÉ
-- =====================================================
-- Si tous les checks montrent ✅, la fonction est correcte.
-- 
-- Note importante : 
-- - La fonction LIT 'full_name' depuis raw_user_meta_data (normal)
-- - La fonction INSÈRE dans la colonne 'name' (correct)
-- - has_full_name_column = true dans la vérification est NORMAL

