-- Script pour ajouter le support des sessions privées
-- À exécuter dans Supabase SQL Editor

-- Ajouter les colonnes pour les sessions privées
ALTER TABLE public.dhikr_sessions
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS private_session_id TEXT;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_dhikr_sessions_is_private ON public.dhikr_sessions(is_private);
CREATE INDEX IF NOT EXISTS idx_dhikr_sessions_private_session_id ON public.dhikr_sessions(private_session_id);

-- Mettre à jour la fonction create_dhikr_session pour supporter les sessions privées
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
AS $$
DECLARE
  v_session_id UUID;
  v_user_exists BOOLEAN;
  v_active_sessions_count INTEGER;
BEGIN
  -- Vérifier que l'utilisateur existe
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'L''utilisateur n''existe pas';
  END IF;

  -- Pour les sessions publiques, vérifier qu'il n'est pas déjà dans une session active
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

  -- Vérifier les contraintes
  IF p_target_count < 100 OR p_target_count > 999 THEN
    RAISE EXCEPTION 'Le nombre de clics cible doit être entre 100 et 999';
  END IF;

  IF p_max_participants < 1 OR p_max_participants > 100 THEN
    RAISE EXCEPTION 'Le nombre maximum de participants doit être entre 1 et 100';
  END IF;

  -- Créer la session
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
    NOT p_is_private, -- Les sessions privées ne sont pas ouvertes publiquement
    p_max_participants,
    p_is_private,
    p_private_session_id
  )
  RETURNING id INTO v_session_id;

  -- Ajouter le créateur comme participant
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

-- Mettre à jour la fonction join_dhikr_session pour gérer les sessions privées
CREATE OR REPLACE FUNCTION public.join_dhikr_session(
  p_user_id UUID,
  p_session_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_is_private BOOLEAN;
  v_session_is_open BOOLEAN;
  v_user_exists BOOLEAN;
  v_already_participant BOOLEAN;
  v_active_public_sessions_count INTEGER;
BEGIN
  -- Vérifier que l'utilisateur existe
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'L''utilisateur n''existe pas';
  END IF;

  -- Récupérer les informations de la session
  SELECT is_private, is_open INTO v_session_is_private, v_session_is_open
  FROM public.dhikr_sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La session n''existe pas';
  END IF;

  -- Vérifier si l'utilisateur est déjà participant
  SELECT EXISTS(
    SELECT 1 FROM public.dhikr_session_participants
    WHERE session_id = p_session_id AND user_id = p_user_id
  ) INTO v_already_participant;

  IF v_already_participant THEN
    RETURN true; -- Déjà participant
  END IF;

  -- Pour les sessions publiques, vérifier qu'il n'est pas déjà dans une autre session active
  IF NOT v_session_is_private THEN
    SELECT COUNT(*) INTO v_active_public_sessions_count
    FROM public.dhikr_sessions ds
    INNER JOIN public.dhikr_session_participants dsp ON ds.id = dsp.session_id
    WHERE dsp.user_id = p_user_id
      AND ds.is_active = true
      AND ds.is_private = false
      AND ds.id != p_session_id;
    
    IF v_active_public_sessions_count > 0 THEN
      RAISE EXCEPTION 'Vous êtes déjà dans une autre session active. Vous ne pouvez rejoindre qu''une seule session publique à la fois.';
    END IF;
  END IF;

  -- Vérifier que la session est active
  IF NOT EXISTS(SELECT 1 FROM public.dhikr_sessions WHERE id = p_session_id AND is_active = true) THEN
    RAISE EXCEPTION 'La session n''est plus active';
  END IF;

  -- Vérifier le nombre maximum de participants (seulement pour les sessions publiques)
  IF NOT v_session_is_private THEN
    IF (SELECT COUNT(*) FROM public.dhikr_session_participants WHERE session_id = p_session_id) >=
       (SELECT max_participants FROM public.dhikr_sessions WHERE id = p_session_id) THEN
      RAISE EXCEPTION 'La session a atteint le nombre maximum de participants';
    END IF;
  END IF;

  -- Ajouter le participant
  INSERT INTO public.dhikr_session_participants (
    session_id,
    user_id,
    user_name,
    user_email,
    click_count,
    joined_at
  )
  SELECT
    p_session_id,
    p_user_id,
    COALESCE(au.raw_user_meta_data->>'name', au.email),
    au.email,
    0,
    NOW()
  FROM auth.users au
  WHERE au.id = p_user_id;

  RETURN true;
END;
$$;

-- Fonction pour supprimer automatiquement les sessions publiques terminées
CREATE OR REPLACE FUNCTION public.cleanup_completed_public_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Supprimer les sessions publiques terminées (is_active = false) qui ont été complétées il y a plus de 24h
  DELETE FROM public.dhikr_sessions
  WHERE is_private = false
    AND is_active = false
    AND completed_at IS NOT NULL
    AND completed_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;

-- Créer un trigger pour nettoyer automatiquement les sessions terminées
-- (Optionnel : peut être exécuté via un cron job au lieu d'un trigger)
-- Pour l'instant, on peut l'appeler manuellement ou via un cron job Supabase

COMMENT ON COLUMN public.dhikr_sessions.is_private IS 'Indique si la session est privée (true) ou publique (false)';
COMMENT ON COLUMN public.dhikr_sessions.private_session_id IS 'ID de la session privée locale (pour synchronisation)';

