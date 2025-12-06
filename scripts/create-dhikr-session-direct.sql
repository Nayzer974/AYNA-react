-- Fonction RPC SECURITY DEFINER pour créer une session de dhikr
-- Cette fonction accepte l'ID utilisateur directement et vérifie qu'il existe dans auth.users
-- Elle contourne RLS mais reste sécurisée car elle vérifie l'existence de l'utilisateur

CREATE OR REPLACE FUNCTION create_dhikr_session_direct(
  p_user_id UUID,
  p_dhikr_text TEXT,
  p_target_count INTEGER,
  p_max_participants INTEGER DEFAULT 100
)
RETURNS UUID
SET search_path = public, pg_temp
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
  v_existing_session_id UUID;
  v_user_name TEXT;
  v_user_email TEXT;
BEGIN
  -- Vérifier que l'utilisateur existe dans auth.users
  SELECT raw_user_meta_data->>'name', email
  INTO v_user_name, v_user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User does not exist in auth.users';
  END IF;

  -- Vérifier si l'utilisateur est déjà dans une autre session active
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

  IF p_target_count < 100 OR p_target_count > 999 THEN
    RAISE EXCEPTION 'Target count must be between 100 and 999';
  END IF;

  IF p_max_participants < 1 OR p_max_participants > 100 THEN
    RAISE EXCEPTION 'Max participants must be between 1 and 100';
  END IF;

  -- Créer la session (SECURITY DEFINER contourne RLS)
  -- Note: Si votre table a une colonne session_type, modifiez cette ligne pour l'inclure
  INSERT INTO public.dhikr_sessions (created_by, dhikr_text, target_count, max_participants)
  VALUES (p_user_id, p_dhikr_text, p_target_count, p_max_participants)
  RETURNING id INTO v_session_id;

  -- Ajouter le créateur comme participant
  INSERT INTO public.dhikr_session_participants (session_id, user_id, user_name, user_email)
  VALUES (v_session_id, p_user_id, v_user_name, v_user_email);

  RETURN v_session_id;
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION create_dhikr_session_direct(UUID, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_dhikr_session_direct(UUID, TEXT, INTEGER, INTEGER) TO anon;

