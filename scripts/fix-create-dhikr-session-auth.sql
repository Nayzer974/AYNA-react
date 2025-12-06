-- Modifier la fonction create_dhikr_session pour accepter un paramètre optionnel p_user_id
-- Cela permet aux utilisateurs connectés (même sans email vérifié) de créer des sessions

CREATE OR REPLACE FUNCTION create_dhikr_session(
  p_dhikr_text TEXT,
  p_target_count INTEGER,
  p_max_participants INTEGER DEFAULT 100,
  p_session_type TEXT DEFAULT 'community',
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
SET search_path = public, pg_temp
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
  v_user_id UUID;
  v_existing_personal_session_id UUID;
  v_existing_community_session_id UUID;
BEGIN
  -- Utiliser p_user_id si fourni, sinon utiliser auth.uid()
  IF p_user_id IS NOT NULL THEN
    v_user_id := p_user_id;
  ELSE
    v_user_id := auth.uid();
  END IF;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Vérifier que l'utilisateur existe dans auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'User does not exist in auth.users';
  END IF;

  -- Valider le type de session
  IF p_session_type NOT IN ('personal', 'community') THEN
    RAISE EXCEPTION 'Session type must be either "personal" or "community"';
  END IF;

  -- Si c'est une session personnelle
  IF p_session_type = 'personal' THEN
    -- Vérifier si l'utilisateur a déjà une session personnelle active
    SELECT id
    INTO v_existing_personal_session_id
    FROM public.dhikr_sessions
    WHERE created_by = v_user_id
      AND session_type = 'personal'
      AND is_active = true
    LIMIT 1;

    IF v_existing_personal_session_id IS NOT NULL THEN
      RAISE EXCEPTION 'Vous avez déjà une session personnelle active. Veuillez la terminer avant d''en créer une nouvelle.';
    END IF;

    -- Les sessions personnelles ont toujours max_participants = 1
    p_max_participants := 1;
  ELSE
    -- Si c'est une session communautaire, vérifier si l'utilisateur est déjà dans une autre session communautaire active
    SELECT session_id
    INTO v_existing_community_session_id
    FROM public.dhikr_session_participants
    WHERE user_id = v_user_id
      AND EXISTS (
        SELECT 1 FROM public.dhikr_sessions
        WHERE id = session_id 
          AND is_active = true 
          AND session_type = 'community'
      )
    LIMIT 1;

    IF v_existing_community_session_id IS NOT NULL THEN
      RAISE EXCEPTION 'Vous êtes déjà dans une session communautaire. Veuillez quitter votre session actuelle avant d''en créer une nouvelle.';
    END IF;
  END IF;

  IF p_target_count < 100 OR p_target_count > 999 THEN
    RAISE EXCEPTION 'Target count must be between 100 and 999';
  END IF;

  IF p_max_participants < 1 OR p_max_participants > 100 THEN
    RAISE EXCEPTION 'Max participants must be between 1 and 100';
  END IF;

  -- Créer la session
  INSERT INTO public.dhikr_sessions (created_by, dhikr_text, target_count, max_participants, session_type)
  VALUES (v_user_id, p_dhikr_text, p_target_count, p_max_participants, p_session_type)
  RETURNING id INTO v_session_id;

  -- Ajouter le créateur comme participant
  INSERT INTO public.dhikr_session_participants (session_id, user_id, user_name, user_email)
  SELECT 
    v_session_id,
    v_user_id,
    raw_user_meta_data->>'name',
    email
  FROM auth.users
  WHERE id = v_user_id;

  RETURN v_session_id;
END;
$$;

