-- Fonction RPC très simple pour créer une session de dhikr
-- Accepte l'ID utilisateur directement et insère dans la table
-- SECURITY DEFINER pour contourner RLS

CREATE OR REPLACE FUNCTION create_dhikr_session_simple(
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
  v_user_name TEXT;
  v_user_email TEXT;
BEGIN
  -- Récupérer les informations utilisateur depuis auth.users
  SELECT COALESCE(raw_user_meta_data->>'name', email, 'Utilisateur'), email
  INTO v_user_name, v_user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  -- Si l'utilisateur n'existe pas, utiliser des valeurs par défaut
  IF v_user_name IS NULL THEN
    v_user_name := 'Utilisateur';
  END IF;
  IF v_user_email IS NULL THEN
    v_user_email := '';
  END IF;

  -- Créer la session directement (SECURITY DEFINER contourne RLS)
  INSERT INTO public.dhikr_sessions (created_by, dhikr_text, target_count, max_participants)
  VALUES (p_user_id, p_dhikr_text, p_target_count, p_max_participants)
  RETURNING id INTO v_session_id;

  -- Ajouter le créateur comme participant
  INSERT INTO public.dhikr_session_participants (session_id, user_id, user_name, user_email)
  VALUES (v_session_id, p_user_id, v_user_name, v_user_email)
  ON CONFLICT (session_id, user_id) DO NOTHING;

  RETURN v_session_id;
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION create_dhikr_session_simple(UUID, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_dhikr_session_simple(UUID, TEXT, INTEGER, INTEGER) TO anon;

