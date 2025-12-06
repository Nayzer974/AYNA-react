-- ÉTAPE 2 : Mettre à jour la fonction create_dhikr_session
-- Copiez et exécutez cette partie dans Supabase SQL Editor

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


