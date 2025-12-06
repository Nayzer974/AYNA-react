-- Script pour corriger les fonctions avec search_path mutable
-- Ce script ajoute SET search_path = '' à toutes les fonctions pour éviter les vulnérabilités de sécurité
-- À exécuter dans Supabase SQL Editor

-- ============================================
-- 1. Fonction update_khalwa_sessions_updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_khalwa_sessions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================
-- 2. Fonction get_khalwa_stats
-- ============================================
CREATE OR REPLACE FUNCTION get_khalwa_stats(p_user_id UUID)
RETURNS TABLE (
  total_sessions BIGINT,
  total_minutes BIGINT,
  avg_duration NUMERIC,
  most_used_divine_name TEXT,
  most_used_breathing_type TEXT,
  most_used_sound TEXT,
  sessions_this_week BIGINT,
  sessions_this_month BIGINT,
  longest_streak_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_total_sessions BIGINT;
  v_total_minutes BIGINT;
  v_avg_duration NUMERIC;
  v_most_used_divine_name TEXT;
  v_most_used_breathing_type TEXT;
  v_most_used_sound TEXT;
  v_sessions_this_week BIGINT;
  v_sessions_this_month BIGINT;
  v_longest_streak_days INTEGER;
BEGIN
  -- Statistiques de base
  SELECT 
    COUNT(*)::BIGINT,
    COALESCE(SUM(duration_minutes), 0)::BIGINT,
    COALESCE(AVG(duration_minutes), 0)::NUMERIC
  INTO v_total_sessions, v_total_minutes, v_avg_duration
  FROM public.khalwa_sessions
  WHERE user_id = p_user_id AND completed = true;

  -- Nom divin le plus utilisé
  SELECT divine_name_id INTO v_most_used_divine_name
  FROM public.khalwa_sessions
  WHERE user_id = p_user_id AND completed = true
  GROUP BY divine_name_id
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Type de respiration le plus utilisé
  SELECT breathing_type INTO v_most_used_breathing_type
  FROM public.khalwa_sessions
  WHERE user_id = p_user_id AND completed = true
  GROUP BY breathing_type
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Ambiance sonore la plus utilisée
  SELECT sound_ambiance INTO v_most_used_sound
  FROM public.khalwa_sessions
  WHERE user_id = p_user_id AND completed = true
  GROUP BY sound_ambiance
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Sessions cette semaine
  SELECT COUNT(*)::BIGINT INTO v_sessions_this_week
  FROM public.khalwa_sessions
  WHERE user_id = p_user_id 
    AND completed = true
    AND created_at >= NOW() - INTERVAL '7 days';

  -- Sessions ce mois
  SELECT COUNT(*)::BIGINT INTO v_sessions_this_month
  FROM public.khalwa_sessions
  WHERE user_id = p_user_id 
    AND completed = true
    AND created_at >= NOW() - INTERVAL '30 days';

  -- Calcul de la série (simplifié)
  WITH daily_sessions AS (
    SELECT DISTINCT DATE(created_at) as session_date
    FROM public.khalwa_sessions
    WHERE user_id = p_user_id AND completed = true
    ORDER BY DATE(created_at) DESC
  ),
  streak_calc AS (
    SELECT 
      session_date,
      session_date - ROW_NUMBER() OVER (ORDER BY session_date DESC)::INTEGER * INTERVAL '1 day' as grp
    FROM daily_sessions
  )
  SELECT COALESCE(MAX(cnt), 0)::INTEGER INTO v_longest_streak_days
  FROM (
    SELECT COUNT(*) as cnt
    FROM streak_calc
    GROUP BY grp
  ) sub;

  -- Retourner les résultats
  RETURN QUERY SELECT
    COALESCE(v_total_sessions, 0),
    COALESCE(v_total_minutes, 0),
    COALESCE(v_avg_duration, 0),
    COALESCE(v_most_used_divine_name, ''),
    COALESCE(v_most_used_breathing_type, ''),
    COALESCE(v_most_used_sound, ''),
    COALESCE(v_sessions_this_week, 0),
    COALESCE(v_sessions_this_month, 0),
    COALESCE(v_longest_streak_days, 0);
END;
$$;

-- ============================================
-- 3. Fonction update_dhikr_sessions_updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_dhikr_sessions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================
-- 4. Fonction is_user_admin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_user_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- ============================================
-- 5. Fonction promote_to_admin
-- ============================================
CREATE OR REPLACE FUNCTION public.promote_to_admin(p_user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- ============================================
-- 6. Fonction demote_from_admin
-- ============================================
CREATE OR REPLACE FUNCTION public.demote_from_admin(p_user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

  -- Retirer les droits admin
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('is_admin', false)
  WHERE id = v_user_id;

  RETURN true;
END;
$$;

-- ============================================
-- 7. Fonction list_admins
-- ============================================
CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
    RAISE EXCEPTION 'Seuls les administrateurs peuvent lister les autres administrateurs';
  END IF;

  -- Retourner la liste des admins
  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', '') as name,
    au.created_at
  FROM auth.users au
  WHERE (au.raw_user_meta_data->>'is_admin')::boolean = true
     OR au.email = 'admin@admin.com'
     OR au.email = 'pro.ibrahima00@gmail.com'
     OR au.email = 'admin'
  ORDER BY au.created_at DESC;
END;
$$;

-- ============================================
-- 8. Fonction promote_to_admin_by_id
-- ============================================
CREATE OR REPLACE FUNCTION public.promote_to_admin_by_id(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Utilisateur introuvable avec l''ID: %', p_user_id;
  END IF;

  -- Mettre à jour les métadonnées de l'utilisateur
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('is_admin', true)
  WHERE id = p_user_id;

  RETURN true;
END;
$$;

-- ============================================
-- 9. Fonction create_dhikr_session (version avec sessions privées)
-- ============================================
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
SET search_path = ''
AS $$
DECLARE
  v_session_id UUID;
  v_user_exists BOOLEAN;
  v_active_sessions_count INTEGER;
BEGIN
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'L''utilisateur n''existe pas';
  END IF;

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

  IF p_target_count < 100 OR p_target_count > 999 THEN
    RAISE EXCEPTION 'Le nombre de clics cible doit être entre 100 et 999';
  END IF;

  IF p_max_participants < 1 OR p_max_participants > 100 THEN
    RAISE EXCEPTION 'Le nombre maximum de participants doit être entre 1 et 100';
  END IF;

  INSERT INTO public.dhikr_sessions (
    created_by,
    dhikr_text,
    target_count,
    current_count,
    is_active,
    is_open,
    max_participants,
    is_private,
    private_session_id
  ) VALUES (
    p_user_id,
    p_dhikr_text,
    p_target_count,
    0,
    true,
    NOT p_is_private,
    p_max_participants,
    p_is_private,
    p_private_session_id
  )
  RETURNING id INTO v_session_id;

  INSERT INTO public.dhikr_session_participants (
    session_id,
    user_id,
    user_name,
    user_email,
    click_count,
    joined_at
  )
  SELECT
    v_session_id,
    p_user_id,
    COALESCE(au.raw_user_meta_data->>'name', au.email),
    au.email,
    0,
    NOW()
  FROM auth.users au
  WHERE au.id = p_user_id;

  RETURN v_session_id;
END;
$$;

-- ============================================
-- 10. Fonction join_dhikr_session
-- ============================================
-- Cette fonction doit être mise à jour dans create-dhikr-backend-mobile.sql
-- Ajoutez SET search_path = '' après LANGUAGE plpgsql

-- ============================================
-- 11. Fonction delete_dhikr_session
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_dhikr_session(
  p_session_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- ============================================
-- 12. Fonction join_dhikr_session
-- ============================================
CREATE OR REPLACE FUNCTION public.join_dhikr_session(
  p_user_id UUID,
  p_session_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- ============================================
-- 13. Fonction cleanup_completed_public_sessions
-- ============================================
CREATE OR REPLACE FUNCTION public.cleanup_completed_public_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.dhikr_sessions
  WHERE is_private = false
    AND is_active = false
    AND completed_at IS NOT NULL
    AND completed_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;

-- ============================================
-- 13. Fonction generate_audit_report
-- ============================================
-- Si cette fonction existe, elle doit être mise à jour avec SET search_path = ''
-- Note: Cette fonction n'a pas été trouvée dans les scripts, elle peut être créée par Supabase ou un autre système

