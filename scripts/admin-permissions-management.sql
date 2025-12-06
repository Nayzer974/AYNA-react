-- Script pour gérer les permissions admin dans Supabase
-- À exécuter dans Supabase SQL Editor

-- ============================================
-- 1. Fonction pour vérifier si un utilisateur est admin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_user_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
  v_is_admin BOOLEAN := false;
BEGIN
  -- Récupérer l'email de l'utilisateur
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;

  IF v_user_email IS NULL THEN
    RETURN false;
  END IF;

  -- Vérifier si l'utilisateur est admin via user_metadata
  SELECT COALESCE(
    (raw_user_meta_data->>'is_admin')::boolean,
    false
  ) INTO v_is_admin
  FROM auth.users
  WHERE id = p_user_id;

  -- Vérifier aussi les emails admin par défaut
  IF NOT v_is_admin THEN
    v_is_admin := v_user_email = 'admin@admin.com' 
               OR v_user_email = 'pro.ibrahima00@gmail.com'
               OR v_user_email = 'admin';
  END IF;

  RETURN v_is_admin;
END;
$$;

COMMENT ON FUNCTION public.is_user_admin(UUID) IS 'Vérifie si un utilisateur est administrateur';

-- ============================================
-- 2. Fonction pour promouvoir un utilisateur en admin
-- ============================================
CREATE OR REPLACE FUNCTION public.promote_to_admin(p_user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_current_user_id UUID;
  v_current_user_is_admin BOOLEAN;
BEGIN
  -- Récupérer l'ID de l'utilisateur actuel
  v_current_user_id := auth.uid();
  
  -- Vérifier que l'utilisateur actuel est admin
  v_current_user_is_admin := public.is_user_admin(v_current_user_id);
  
  IF NOT v_current_user_is_admin THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent promouvoir d''autres utilisateurs';
  END IF;

  -- Trouver l'utilisateur à promouvoir
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur introuvable avec l''email: %', p_user_email;
  END IF;

  -- Mettre à jour les métadonnées de l'utilisateur
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('is_admin', true)
  WHERE id = v_user_id;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.promote_to_admin(TEXT) IS 'Promouvoit un utilisateur en administrateur (nécessite d''être admin)';

-- ============================================
-- 3. Fonction pour rétrograder un utilisateur (retirer les droits admin)
-- ============================================
CREATE OR REPLACE FUNCTION public.demote_from_admin(p_user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_current_user_id UUID;
  v_current_user_is_admin BOOLEAN;
BEGIN
  -- Récupérer l'ID de l'utilisateur actuel
  v_current_user_id := auth.uid();
  
  -- Vérifier que l'utilisateur actuel est admin
  v_current_user_is_admin := public.is_user_admin(v_current_user_id);
  
  IF NOT v_current_user_is_admin THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent rétrograder d''autres utilisateurs';
  END IF;

  -- Trouver l'utilisateur à rétrograder
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur introuvable avec l''email: %', p_user_email;
  END IF;

  -- Ne pas permettre de se rétrograder soi-même
  IF v_user_id = v_current_user_id THEN
    RAISE EXCEPTION 'Vous ne pouvez pas vous rétrograder vous-même';
  END IF;

  -- Retirer les droits admin
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data - 'is_admin'
  WHERE id = v_user_id;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.demote_from_admin(TEXT) IS 'Retire les droits administrateur d''un utilisateur (nécessite d''être admin)';

-- ============================================
-- 4. Fonction pour lister tous les admins
-- ============================================
CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT,
  is_admin BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_current_user_is_admin BOOLEAN;
BEGIN
  -- Récupérer l'ID de l'utilisateur actuel
  v_current_user_id := auth.uid();
  
  -- Vérifier que l'utilisateur actuel est admin
  v_current_user_is_admin := public.is_user_admin(v_current_user_id);
  
  IF NOT v_current_user_is_admin THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent lister les autres admins';
  END IF;

  -- Retourner la liste des admins
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
    public.is_user_admin(au.id) as is_admin
  FROM auth.users au
  WHERE public.is_user_admin(au.id) = true
  ORDER BY au.email;
END;
$$;

COMMENT ON FUNCTION public.list_admins() IS 'Liste tous les administrateurs (nécessite d''être admin)';

-- ============================================
-- 5. Mettre à jour la fonction delete_dhikr_session pour mieux gérer les admins
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_dhikr_session(
  p_session_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_created_by UUID;
  v_user_is_admin BOOLEAN;
  v_participants_count INTEGER;
BEGIN
  -- Vérifier que l'utilisateur existe
  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'L''utilisateur n''existe pas';
  END IF;

  -- Vérifier que la session existe
  SELECT created_by INTO v_session_created_by
  FROM public.dhikr_sessions
  WHERE id = p_session_id;

  IF v_session_created_by IS NULL THEN
    RAISE EXCEPTION 'La session n''existe pas';
  END IF;

  -- Vérifier si l'utilisateur est admin
  v_user_is_admin := public.is_user_admin(p_user_id);

  -- Vérifier les permissions : soit créateur, soit admin
  IF v_session_created_by != p_user_id AND NOT v_user_is_admin THEN
    RAISE EXCEPTION 'Vous ne pouvez supprimer que vos propres sessions ou être administrateur';
  END IF;

  -- Compter les participants avant suppression
  SELECT COUNT(*) INTO v_participants_count
  FROM public.dhikr_session_participants
  WHERE session_id = p_session_id;

  -- Supprimer les participants (ils seront automatiquement éjectés)
  DELETE FROM public.dhikr_session_participants
  WHERE session_id = p_session_id;

  -- Supprimer les clics en queue
  DELETE FROM public.dhikr_session_clicks
  WHERE session_id = p_session_id;

  -- Supprimer la session
  DELETE FROM public.dhikr_sessions
  WHERE id = p_session_id;

  -- Log pour debug (optionnel)
  RAISE NOTICE 'Session % supprimée par utilisateur %. % participant(s) éjecté(s).', 
    p_session_id, p_user_id, v_participants_count;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.delete_dhikr_session(UUID, UUID) IS 'Supprime une session de dhikr (créateur ou admin uniquement)';

-- ============================================
-- 6. Mettre à jour la fonction create_dhikr_session pour vérifier les admins
-- ============================================
-- Note: Cette fonction existe déjà, on va juste s'assurer qu'elle utilise is_user_admin
-- Si elle n'existe pas encore, elle sera créée par le script create-dhikr-backend-mobile.sql

-- ============================================
-- 7. Fonction pour promouvoir un utilisateur par ID (alternative)
-- ============================================
CREATE OR REPLACE FUNCTION public.promote_to_admin_by_id(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_current_user_is_admin BOOLEAN;
BEGIN
  -- Récupérer l'ID de l'utilisateur actuel
  v_current_user_id := auth.uid();
  
  -- Vérifier que l'utilisateur actuel est admin
  v_current_user_is_admin := public.is_user_admin(v_current_user_id);
  
  IF NOT v_current_user_is_admin THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent promouvoir d''autres utilisateurs';
  END IF;

  -- Vérifier que l'utilisateur existe
  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Utilisateur introuvable';
  END IF;

  -- Mettre à jour les métadonnées de l'utilisateur
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('is_admin', true)
  WHERE id = p_user_id;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.promote_to_admin_by_id(UUID) IS 'Promouvoit un utilisateur en administrateur par ID (nécessite d''être admin)';


