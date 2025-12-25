-- Fonction RPC sécurisée pour bannir un utilisateur
-- Cette fonction contourne RLS avec SECURITY DEFINER et vérifie que l'utilisateur est admin

CREATE OR REPLACE FUNCTION public.ban_user(
  p_admin_user_id UUID,
  p_target_user_id UUID,
  p_user_email TEXT,
  p_ban_type TEXT,
  p_duration_minutes INTEGER DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_ban_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Vérifier que l'admin existe dans auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_admin_user_id) THEN
    RAISE EXCEPTION 'Admin utilisateur non trouvé';
  END IF;

  -- Vérifier que l'utilisateur cible existe dans auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_target_user_id) THEN
    RAISE EXCEPTION 'Utilisateur cible non trouvé';
  END IF;

  -- Vérifier que l'utilisateur actuel est admin
  BEGIN
    SELECT public.check_user_is_admin(p_admin_user_id) INTO v_is_admin;
  EXCEPTION
    WHEN OTHERS THEN
      SELECT COALESCE(p.is_admin, false) INTO v_is_admin
      FROM profiles p
      WHERE p.id = p_admin_user_id;
  END;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent bannir des utilisateurs';
  END IF;

  -- Vérifier que le type de bannissement est valide
  IF p_ban_type NOT IN ('temporary', 'permanent') THEN
    RAISE EXCEPTION 'Type de bannissement invalide. Doit être "temporary" ou "permanent"';
  END IF;

  -- Calculer la date d'expiration si bannissement temporaire
  IF p_ban_type = 'temporary' THEN
    IF p_duration_minutes IS NULL OR p_duration_minutes <= 0 THEN
      RAISE EXCEPTION 'La durée doit être supérieure à 0 pour un bannissement temporaire';
    END IF;
    v_expires_at := NOW() + (p_duration_minutes || ' minutes')::INTERVAL;
  ELSE
    v_expires_at := NULL;
  END IF;

  -- Supprimer l'ancien bannissement s'il existe
  DELETE FROM user_bans
  WHERE user_id = p_target_user_id;

  -- Supprimer tous les posts de l'utilisateur banni
  DELETE FROM community_posts
  WHERE user_id = p_target_user_id;

  -- Supprimer tous les likes de l'utilisateur banni
  DELETE FROM community_post_likes
  WHERE user_id = p_target_user_id;

  -- Créer le nouveau bannissement
  INSERT INTO user_bans (
    user_id,
    user_email,
    ban_type,
    duration_minutes,
    expires_at,
    banned_by,
    reason
  ) VALUES (
    p_target_user_id,
    p_user_email,
    p_ban_type,
    p_duration_minutes,
    v_expires_at,
    p_admin_user_id,
    p_reason
  ) RETURNING id INTO v_ban_id;

  -- Si bannissement définitif, ajouter l'email à la liste des emails bannis
  IF p_ban_type = 'permanent' THEN
    INSERT INTO banned_emails (email, banned_by, reason)
    VALUES (LOWER(p_user_email), p_admin_user_id, COALESCE(p_reason, 'Bannissement définitif par admin'))
    ON CONFLICT (email) DO UPDATE
    SET banned_at = NOW(),
        banned_by = p_admin_user_id,
        reason = COALESCE(p_reason, 'Bannissement définitif par admin');
  END IF;

  RETURN v_ban_id;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.ban_user(UUID, UUID, TEXT, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ban_user(UUID, UUID, TEXT, TEXT, INTEGER, TEXT) TO anon;

COMMENT ON FUNCTION public.ban_user(UUID, UUID, TEXT, TEXT, INTEGER, TEXT) IS 
'Bannit un utilisateur. Nécessite d''être admin. Paramètres: p_admin_user_id (UUID de l''admin), p_target_user_id (UUID de l''utilisateur à bannir), p_user_email (email de l''utilisateur), p_ban_type (temporary ou permanent), p_duration_minutes (durée en minutes, NULL pour permanent), p_reason (raison du bannissement, optionnel).';

