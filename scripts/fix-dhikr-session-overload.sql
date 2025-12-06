-- ============================================
-- Script pour résoudre le conflit de surcharge
-- de la fonction create_dhikr_session
-- ============================================
-- Ce script supprime toutes les versions sauf celle avec 4 paramètres
-- utilisée par l'application mobile:
-- create_dhikr_session(p_user_id UUID, p_dhikr_text TEXT, p_target_count INTEGER, p_max_participants INTEGER)
-- ============================================

-- 1. Supprimer toutes les versions existantes de create_dhikr_session
DROP FUNCTION IF EXISTS public.create_dhikr_session(TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.create_dhikr_session(TEXT, INTEGER, INTEGER, TEXT);
DROP FUNCTION IF EXISTS public.create_dhikr_session(TEXT, INTEGER, INTEGER, TEXT, UUID);
DROP FUNCTION IF EXISTS public.create_dhikr_session(UUID, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.create_dhikr_session(UUID, TEXT, INTEGER, INTEGER, TEXT);

-- 2. Recréer uniquement la version avec 4 paramètres (celle utilisée par le client)
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

-- 3. Donner les permissions
GRANT EXECUTE ON FUNCTION public.create_dhikr_session(UUID, TEXT, INTEGER, INTEGER) TO authenticated;

-- 4. Vérifier qu'il n'y a plus qu'une seule version
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS function_arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'create_dhikr_session'
ORDER BY p.proname;

-- ============================================
-- ✅ CONFLIT RÉSOLU
-- ============================================
-- Il ne devrait y avoir qu'une seule fonction create_dhikr_session maintenant
-- avec la signature: (UUID, TEXT, INTEGER, INTEGER)

