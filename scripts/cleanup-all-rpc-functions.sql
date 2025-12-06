-- ============================================
-- Script de nettoyage complet des fonctions RPC
-- Supprime toutes les anciennes versions et garde uniquement les bonnes
-- ============================================

-- ============================================
-- FONCTIONS DHIKR
-- ============================================

-- Supprimer toutes les anciennes versions de create_dhikr_session
DROP FUNCTION IF EXISTS public.create_dhikr_session(TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.create_dhikr_session(TEXT, INTEGER, INTEGER, TEXT);
DROP FUNCTION IF EXISTS public.create_dhikr_session(TEXT, INTEGER, INTEGER, TEXT, UUID);
DROP FUNCTION IF EXISTS public.create_dhikr_session(UUID, TEXT, INTEGER, INTEGER, TEXT);
DROP FUNCTION IF EXISTS public.create_dhikr_session_direct(UUID, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.create_dhikr_session_simple(UUID, TEXT, INTEGER, INTEGER);

-- Supprimer les anciennes versions de join_dhikr_session
DROP FUNCTION IF EXISTS public.join_dhikr_session(UUID); -- Ancienne version avec seulement session_id

-- Supprimer les anciennes versions de leave_dhikr_session
DROP FUNCTION IF EXISTS public.leave_dhikr_session(UUID); -- Ancienne version avec seulement session_id

-- Supprimer les anciennes versions de add_dhikr_session_click (si elles existent)
DROP FUNCTION IF EXISTS public.add_dhikr_session_click(UUID); -- Ancienne version avec seulement session_id
DROP FUNCTION IF EXISTS public.add_dhikr_session_click(UUID, UUID); -- Version avec user_id et session_id

-- Supprimer les anciennes versions de process_dhikr_session_clicks
DROP FUNCTION IF EXISTS public.process_dhikr_session_clicks();
DROP FUNCTION IF EXISTS public.process_dhikr_session_clicks(UUID);

-- Supprimer les anciennes versions de delete_all_active_dhikr_sessions
DROP FUNCTION IF EXISTS public.delete_all_active_dhikr_sessions();
DROP FUNCTION IF EXISTS public.delete_all_active_dhikr_sessions(UUID);

-- ============================================
-- RECRÉER LES FONCTIONS CORRECTES
-- ============================================

-- 1. create_dhikr_session (4 paramètres)
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

-- 2. join_dhikr_session (2 paramètres)
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

  IF NOT v_is_open THEN
    RAISE EXCEPTION 'La session n''est plus ouverte aux nouveaux participants.';
  END IF;

  IF NOT v_is_active THEN
    RAISE EXCEPTION 'La session n''est plus active.';
  END IF;

  IF v_participant_count >= v_max_participants THEN
    RAISE EXCEPTION 'La session est pleine.';
  END IF;

  -- Récupérer les informations de l'utilisateur
  IF p_user_id IS NOT NULL THEN
    SELECT 
      COALESCE(raw_user_meta_data->>'name', email, 'Utilisateur'),
      email
    INTO v_user_name, v_user_email
    FROM auth.users
    WHERE id = p_user_id;
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

-- 3. leave_dhikr_session (2 paramètres)
CREATE OR REPLACE FUNCTION public.leave_dhikr_session(
  p_user_id UUID,
  p_session_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_remaining_participants INTEGER;
  v_created_by UUID;
BEGIN
  -- Supprimer le participant
  DELETE FROM public.dhikr_session_participants
  WHERE session_id = p_session_id 
    AND (user_id = p_user_id OR (p_user_id IS NULL AND user_id IS NULL));

  -- Compter les participants restants
  SELECT COUNT(*)
  INTO v_remaining_participants
  FROM public.dhikr_session_participants
  WHERE session_id = p_session_id;

  -- Récupérer le créateur de la session
  SELECT created_by
  INTO v_created_by
  FROM public.dhikr_sessions
  WHERE id = p_session_id;

  -- Si plus aucun participant, supprimer la session
  IF v_remaining_participants = 0 THEN
    DELETE FROM public.dhikr_sessions
    WHERE id = p_session_id;
  -- Si c'est le créateur qui quitte mais qu'il reste des participants, fermer la session
  ELSIF p_user_id = v_created_by THEN
    UPDATE public.dhikr_sessions
    SET is_active = false, is_open = false
    WHERE id = p_session_id;
  END IF;

  RETURN true;
END;
$$;

-- ============================================
-- PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.create_dhikr_session(UUID, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_dhikr_session(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_dhikr_session(UUID, UUID) TO authenticated;

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================

-- Vérifier qu'il n'y a plus qu'une seule version de chaque fonction
SELECT 
    '=== VÉRIFICATION FINALE ===' AS section,
    p.proname AS function_name,
    COUNT(*) AS version_count,
    STRING_AGG(pg_get_function_identity_arguments(p.oid), ' | ') AS all_signatures
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN (
        'create_dhikr_session',
        'join_dhikr_session',
        'leave_dhikr_session'
    )
GROUP BY p.proname
ORDER BY p.proname;

-- ============================================
-- ✅ NETTOYAGE TERMINÉ
-- ============================================
-- Chaque fonction dhikr devrait avoir exactement 1 version maintenant



