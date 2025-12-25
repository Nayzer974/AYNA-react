-- =====================================================
-- Script pour corriger TOUTES les versions des fonctions dhikr
-- =====================================================
-- Ce script supprime toutes les versions existantes de
-- create_dhikr_session, join_dhikr_session, et delete_dhikr_session
-- puis les recrée avec SET search_path
-- 
-- Exécuter ce script APRÈS fix-all-linter-issues.sql
-- =====================================================

BEGIN;

-- =====================================================
-- Supprimer TOUTES les versions existantes
-- =====================================================

-- Supprimer toutes les versions de create_dhikr_session
DROP FUNCTION IF EXISTS public.create_dhikr_session() CASCADE;
DROP FUNCTION IF EXISTS public.create_dhikr_session(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.create_dhikr_session(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_dhikr_session(TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.create_dhikr_session(TEXT, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.create_dhikr_session(TEXT, INTEGER, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_dhikr_session(TEXT, INTEGER, INTEGER, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.create_dhikr_session(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_dhikr_session(UUID, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.create_dhikr_session(UUID, TEXT, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.create_dhikr_session(UUID, TEXT, INTEGER, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_dhikr_session(UUID, TEXT, INTEGER, INTEGER, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS public.create_dhikr_session(UUID, TEXT, INTEGER, INTEGER, BOOLEAN, TEXT) CASCADE;

-- Supprimer toutes les versions de join_dhikr_session
DROP FUNCTION IF EXISTS public.join_dhikr_session() CASCADE;
DROP FUNCTION IF EXISTS public.join_dhikr_session(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.join_dhikr_session(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.join_dhikr_session(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.join_dhikr_session(TEXT, UUID) CASCADE;

-- Supprimer toutes les versions de delete_dhikr_session
DROP FUNCTION IF EXISTS public.delete_dhikr_session() CASCADE;
DROP FUNCTION IF EXISTS public.delete_dhikr_session(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.delete_dhikr_session(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.delete_dhikr_session(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.delete_dhikr_session(TEXT, UUID) CASCADE;

-- =====================================================
-- Recréer les fonctions avec SET search_path
-- =====================================================

-- Fonction create_dhikr_session (version avec 4 paramètres)
CREATE OR REPLACE FUNCTION public.create_dhikr_session(
  p_user_id UUID,
  p_dhikr_text TEXT,
  p_target_count INTEGER,
  p_max_participants INTEGER DEFAULT 100
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_session_id UUID;
  v_existing_session_id UUID;
  v_user_exists BOOLEAN;
  v_user_name TEXT;
  v_user_email TEXT;
BEGIN
  -- Vérifier que l'utilisateur existe dans auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id)
  INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'L''utilisateur n''existe pas dans la base de données. Veuillez vous reconnecter.';
  END IF;

  -- Vérifier si l'utilisateur est déjà dans une session active
  SELECT session_id
  INTO v_existing_session_id
  FROM public.dhikr_session_participants
  WHERE user_id = p_user_id
    AND EXISTS (
      SELECT 1 FROM public.dhikr_sessions
      WHERE id = session_id AND is_active = true
    )
  LIMIT 1;

  IF v_existing_session_id IS NOT NULL THEN
    RAISE EXCEPTION 'Vous êtes déjà dans une autre session. Veuillez quitter votre session actuelle avant d''en créer une nouvelle.';
  END IF;

  -- Valider les paramètres
  IF p_target_count < 100 OR p_target_count > 999 THEN
    RAISE EXCEPTION 'Le nombre de clics doit être entre 100 et 999';
  END IF;

  IF p_max_participants < 1 OR p_max_participants > 100 THEN
    RAISE EXCEPTION 'Le nombre maximum de participants doit être entre 1 et 100';
  END IF;

  -- Créer la session
  INSERT INTO public.dhikr_sessions (
    created_by,
    dhikr_text,
    target_count,
    max_participants
  )
  VALUES (
    p_user_id,
    p_dhikr_text,
    p_target_count,
    p_max_participants
  )
  RETURNING id INTO v_session_id;

  -- Récupérer les informations de l'utilisateur
  SELECT 
    COALESCE(raw_user_meta_data->>'name', email, 'Utilisateur'),
    email
  INTO v_user_name, v_user_email
  FROM auth.users
  WHERE id = p_user_id;

  -- Ajouter le créateur comme participant
  INSERT INTO public.dhikr_session_participants (
    session_id,
    user_id,
    user_name,
    user_email
  )
  VALUES (
    v_session_id,
    p_user_id,
    v_user_name,
    v_user_email
  )
  ON CONFLICT (session_id, user_id) DO NOTHING;

  RETURN v_session_id;
END;
$$;

-- Fonction create_dhikr_session (version avec 6 paramètres - sessions privées)
CREATE OR REPLACE FUNCTION public.create_dhikr_session(
  p_user_id UUID,
  p_dhikr_text TEXT,
  p_target_count INTEGER,
  p_max_participants INTEGER DEFAULT 100,
  p_is_private BOOLEAN DEFAULT false,
  p_private_session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_session_id UUID;
  v_user_exists BOOLEAN;
  v_user_name TEXT;
  v_user_email TEXT;
  v_active_sessions_count INTEGER;
BEGIN
  -- Vérifier que l'utilisateur existe dans auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id)
  INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'L''utilisateur n''existe pas dans la base de données. Veuillez vous reconnecter.';
  END IF;

  -- Pour les sessions publiques, vérifier si l'utilisateur est déjà dans une session active
  IF NOT p_is_private THEN
    SELECT COUNT(*) INTO v_active_sessions_count
    FROM public.dhikr_sessions ds
    INNER JOIN public.dhikr_session_participants dsp ON ds.id = dsp.session_id
    WHERE dsp.user_id = p_user_id
      AND ds.is_active = true
      AND ds.is_private = false;
    
    IF v_active_sessions_count > 0 THEN
      RAISE EXCEPTION 'Vous êtes déjà dans une autre session active. Vous ne pouvez rejoindre qu''une seule session publique à la fois.';
    END IF;
  END IF;

  -- Valider les paramètres
  IF p_target_count < 100 OR p_target_count > 999 THEN
    RAISE EXCEPTION 'Le nombre de clics doit être entre 100 et 999';
  END IF;

  IF p_max_participants < 1 OR p_max_participants > 100 THEN
    RAISE EXCEPTION 'Le nombre maximum de participants doit être entre 1 et 100';
  END IF;

  -- Créer la session
  INSERT INTO public.dhikr_sessions (
    created_by,
    dhikr_text,
    target_count,
    max_participants,
    is_private,
    private_session_id,
    is_open
  )
  VALUES (
    p_user_id,
    p_dhikr_text,
    p_target_count,
    p_max_participants,
    p_is_private,
    p_private_session_id,
    NOT p_is_private
  )
  RETURNING id INTO v_session_id;

  -- Récupérer les informations de l'utilisateur
  SELECT 
    COALESCE(raw_user_meta_data->>'name', email, 'Utilisateur'),
    email
  INTO v_user_name, v_user_email
  FROM auth.users
  WHERE id = p_user_id;

  -- Ajouter le créateur comme participant
  INSERT INTO public.dhikr_session_participants (
    session_id,
    user_id,
    user_name,
    user_email
  )
  VALUES (
    v_session_id,
    p_user_id,
    v_user_name,
    v_user_email
  )
  ON CONFLICT (session_id, user_id) DO NOTHING;

  RETURN v_session_id;
END;
$$;

-- Fonction join_dhikr_session
CREATE OR REPLACE FUNCTION public.join_dhikr_session(
  p_user_id UUID,
  p_session_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_exists BOOLEAN;
  v_participant_count INTEGER;
  v_max_participants INTEGER;
  v_is_open BOOLEAN;
  v_is_active BOOLEAN;
  v_user_name TEXT;
  v_user_email TEXT;
BEGIN
  -- Vérifier que l'utilisateur existe
  IF p_user_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id)
    INTO v_user_exists;
    
    IF NOT v_user_exists THEN
      RAISE EXCEPTION 'L''utilisateur n''existe pas dans la base de données.';
    END IF;
  END IF;

  -- Vérifier que la session existe et est ouverte
  SELECT 
    is_open,
    is_active,
    max_participants,
    (SELECT COUNT(*) FROM public.dhikr_session_participants WHERE session_id = p_session_id)
  INTO 
    v_is_open,
    v_is_active,
    v_max_participants,
    v_participant_count
  FROM public.dhikr_sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La session n''existe pas.';
  END IF;

  IF NOT v_is_active THEN
    RAISE EXCEPTION 'La session n''est plus active.';
  END IF;

  IF NOT v_is_open THEN
    RAISE EXCEPTION 'La session n''est plus ouverte aux nouveaux participants.';
  END IF;

  IF v_participant_count >= v_max_participants THEN
    RAISE EXCEPTION 'La session a atteint le nombre maximum de participants.';
  END IF;

  -- Récupérer les informations de l'utilisateur
  IF p_user_id IS NOT NULL THEN
    SELECT 
      COALESCE(raw_user_meta_data->>'name', email, 'Utilisateur'),
      email
    INTO v_user_name, v_user_email
    FROM auth.users
    WHERE id = p_user_id;
  ELSE
    v_user_name := 'Utilisateur anonyme';
    v_user_email := '';
  END IF;

  -- Ajouter le participant
  INSERT INTO public.dhikr_session_participants (
    session_id,
    user_id,
    user_name,
    user_email
  )
  VALUES (
    p_session_id,
    p_user_id,
    v_user_name,
    v_user_email
  )
  ON CONFLICT (session_id, user_id) DO NOTHING;

  RETURN true;
END;
$$;

-- Fonction delete_dhikr_session (version avec 1 paramètre)
CREATE OR REPLACE FUNCTION public.delete_dhikr_session(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Récupérer l'ID utilisateur depuis auth
  v_user_id := (SELECT auth.uid());
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté pour supprimer une session';
  END IF;
  
  -- Vérifier que l'utilisateur est le créateur
  IF NOT EXISTS (
    SELECT 1 FROM public.dhikr_sessions
    WHERE id = p_session_id AND created_by = v_user_id
  ) THEN
    RAISE EXCEPTION 'Vous ne pouvez supprimer que vos propres sessions';
  END IF;
  
  -- Supprimer la session (CASCADE supprimera les participants et clics)
  DELETE FROM public.dhikr_sessions
  WHERE id = p_session_id;
  
  RETURN true;
END;
$$;

-- Fonction delete_dhikr_session (version avec 2 paramètres)
CREATE OR REPLACE FUNCTION public.delete_dhikr_session(p_session_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté pour supprimer une session';
  END IF;
  
  -- Vérifier que l'utilisateur est le créateur
  IF NOT EXISTS (
    SELECT 1 FROM public.dhikr_sessions
    WHERE id = p_session_id AND created_by = p_user_id
  ) THEN
    RAISE EXCEPTION 'Vous ne pouvez supprimer que vos propres sessions';
  END IF;
  
  -- Supprimer la session (CASCADE supprimera les participants et clics)
  DELETE FROM public.dhikr_sessions
  WHERE id = p_session_id;
  
  RETURN true;
END;
$$;

-- =====================================================
-- Permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION public.create_dhikr_session(UUID, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_dhikr_session(UUID, TEXT, INTEGER, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.create_dhikr_session(UUID, TEXT, INTEGER, INTEGER, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_dhikr_session(UUID, TEXT, INTEGER, INTEGER, BOOLEAN, TEXT) TO anon;

GRANT EXECUTE ON FUNCTION public.join_dhikr_session(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_dhikr_session(UUID, UUID) TO anon;

GRANT EXECUTE ON FUNCTION public.delete_dhikr_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_dhikr_session(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_dhikr_session(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_dhikr_session(UUID, UUID) TO anon;

COMMIT;

-- =====================================================
-- Vérification
-- =====================================================
-- Exécutez cette requête pour vérifier que toutes les fonctions ont search_path
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) LIKE '%SET search_path%' as has_search_path,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('create_dhikr_session', 'join_dhikr_session', 'delete_dhikr_session')
ORDER BY proname, arguments;

