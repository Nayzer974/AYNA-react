-- ÉTAPE 3 : Mettre à jour la fonction join_dhikr_session
-- Copiez et exécutez cette partie dans Supabase SQL Editor

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
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'L''utilisateur n''existe pas';
  END IF;

  SELECT is_private, is_open INTO v_session_is_private, v_session_is_open
  FROM public.dhikr_sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La session n''existe pas';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.dhikr_session_participants
    WHERE session_id = p_session_id AND user_id = p_user_id
  ) INTO v_already_participant;

  IF v_already_participant THEN
    RETURN true;
  END IF;

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

  IF NOT EXISTS(SELECT 1 FROM public.dhikr_sessions WHERE id = p_session_id AND is_active = true) THEN
    RAISE EXCEPTION 'La session n''est plus active';
  END IF;

  IF NOT v_session_is_private THEN
    IF (SELECT COUNT(*) FROM public.dhikr_session_participants WHERE session_id = p_session_id) >=
       (SELECT max_participants FROM public.dhikr_sessions WHERE id = p_session_id) THEN
      RAISE EXCEPTION 'La session a atteint le nombre maximum de participants';
    END IF;
  END IF;

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


