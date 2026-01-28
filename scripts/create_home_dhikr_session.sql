-- Fonction pour créer une session de dhikr pour la page d'accueil
-- Cette fonction est idempotente : si une session active avec le même dhikr_text existe déjà, elle la retourne
CREATE OR REPLACE FUNCTION create_home_dhikr_session(
  p_user_id UUID,
  p_dhikr_text TEXT,
  p_session_name TEXT DEFAULT 'Session commune'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- 1. Chercher si une session active automatique avec le même texte existe déjà (créée il y a moins de 24h)
  SELECT id INTO v_session_id
  FROM dhikr_sessions
  WHERE is_auto = true
    AND is_active = true
    AND dhikr_text::text = p_dhikr_text::text
    AND session_name = p_session_name
    AND created_at > (NOW() - INTERVAL '24 hours')
  LIMIT 1;

  -- 2. Si elle existe, la retourner
  IF v_session_id IS NOT NULL THEN
    RETURN v_session_id;
  END IF;

  -- 3. Sinon, créer une nouvelle session
  INSERT INTO dhikr_sessions (
    created_by,
    dhikr_text,
    target_count, -- NULL pour illimité
    current_count,
    is_active,
    is_open,
    max_participants,
    is_auto,
    session_name,
    is_private
  )
  VALUES (
    p_user_id,
    p_dhikr_text,
    NULL,
    0,
    true,
    true,
    100,
    true,
    p_session_name,
    false
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;
