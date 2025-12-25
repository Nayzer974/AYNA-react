-- =====================================================
-- Script pour corriger la fonction handle_new_user
-- =====================================================
-- Ce script corrige la fonction handle_new_user pour qu'elle
-- corresponde à la structure réelle de la table profiles
-- 
-- Problème : La fonction utilisait "full_name" alors que la table utilise "name"
-- =====================================================

BEGIN;

-- Supprimer le trigger d'abord car il dépend de la fonction
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Recréer la fonction avec la bonne structure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    name, 
    email, 
    avatar, 
    theme, 
    analytics,
    gender
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_id', NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
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
-- VÉRIFICATION
-- =====================================================
-- Vérifier que la fonction existe et a la bonne structure
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) LIKE '%SET search_path%' as has_search_path,
  pg_get_functiondef(oid) LIKE '%INSERT INTO public.profiles%' as inserts_into_profiles,
  pg_get_functiondef(oid) LIKE '%name,%' as has_name_column,
  pg_get_functiondef(oid) LIKE '%raw_user_meta_data->>''full_name''%' as reads_full_name_from_metadata
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'handle_new_user';

-- Note: has_full_name_column = true est NORMAL car la fonction lit 'full_name' 
-- depuis raw_user_meta_data comme fallback, mais elle insère dans la colonne 'name'
-- 
-- Vérification finale : La fonction doit insérer dans 'name', pas 'full_name'
SELECT 
  CASE 
    WHEN pg_get_functiondef(oid) LIKE '%INSERT INTO public.profiles%' 
         AND pg_get_functiondef(oid) LIKE '%name,%'
         AND NOT (pg_get_functiondef(oid) LIKE '%INSERT INTO public.profiles%full_name%')
    THEN '✅ Fonction correcte : insère dans "name"'
    ELSE '❌ Fonction incorrecte : vérifiez la structure'
  END as verification_status
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'handle_new_user';

