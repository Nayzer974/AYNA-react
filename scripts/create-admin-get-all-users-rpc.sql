-- Fonction RPC sécurisée pour que les admins puissent récupérer tous les utilisateurs
-- Cette fonction contourne RLS avec SECURITY DEFINER et vérifie que l'utilisateur est admin

CREATE OR REPLACE FUNCTION public.get_all_users_for_admin(
  p_user_id UUID,
  p_page INTEGER DEFAULT 0,
  p_page_size INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ,
  is_admin BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_user_id UUID;
  v_is_admin BOOLEAN;
  v_from INTEGER;
  v_to INTEGER;
BEGIN
  -- Utiliser l'ID utilisateur passé en paramètre (plus fiable que auth.uid() dans SECURITY DEFINER)
  v_current_user_id := p_user_id;
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez fournir votre ID utilisateur';
  END IF;

  -- Vérifier que l'utilisateur existe dans auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v_current_user_id) THEN
    RAISE EXCEPTION 'Utilisateur non trouvé';
  END IF;

  -- Vérifier que l'utilisateur actuel est admin
  SELECT COALESCE(p.is_admin, false) INTO v_is_admin
  FROM profiles p
  WHERE p.id = v_current_user_id;

  -- Si la fonction check_user_is_admin existe, l'utiliser
  BEGIN
    SELECT public.check_user_is_admin(v_current_user_id) INTO v_is_admin;
  EXCEPTION
    WHEN OTHERS THEN
      -- Si la fonction n'existe pas, utiliser la vérification directe
      SELECT COALESCE(p.is_admin, false) INTO v_is_admin
      FROM profiles p
      WHERE p.id = v_current_user_id;
  END;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent accéder à cette fonction';
  END IF;

  -- Calculer les limites de pagination
  v_from := p_page * p_page_size;
  v_to := v_from + p_page_size - 1;

  -- Retourner tous les profils avec pagination
  -- Utiliser des alias explicites pour éviter toute ambiguïté avec les colonnes de la table de retour
  RETURN QUERY
  SELECT 
    p.id AS id,
    p.name AS name,
    p.email AS email,
    p.avatar AS avatar,
    p.created_at AS created_at,
    COALESCE(p.is_admin, false) AS is_admin
  FROM profiles p
  ORDER BY p.created_at DESC
  LIMIT p_page_size OFFSET v_from;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.get_all_users_for_admin(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_for_admin(UUID, INTEGER, INTEGER) TO anon;

COMMENT ON FUNCTION public.get_all_users_for_admin(UUID, INTEGER, INTEGER) IS 
'Récupère tous les utilisateurs avec pagination. Nécessite d''être admin. Paramètres: p_user_id (UUID de l''utilisateur connecté), p_page (numéro de page, 0-indexed), p_page_size (taille de la page, défaut 50).';

-- Fonction pour compter le nombre total d'utilisateurs (pour la pagination)
CREATE OR REPLACE FUNCTION public.count_all_users_for_admin(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_user_id UUID;
  v_is_admin BOOLEAN;
  v_count INTEGER;
BEGIN
  -- Utiliser l'ID utilisateur passé en paramètre
  v_current_user_id := p_user_id;
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez fournir votre ID utilisateur';
  END IF;

  -- Vérifier que l'utilisateur existe dans auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v_current_user_id) THEN
    RAISE EXCEPTION 'Utilisateur non trouvé';
  END IF;

  -- Vérifier que l'utilisateur actuel est admin
  BEGIN
    SELECT public.check_user_is_admin(v_current_user_id) INTO v_is_admin;
  EXCEPTION
    WHEN OTHERS THEN
      SELECT COALESCE(p.is_admin, false) INTO v_is_admin
      FROM profiles p
      WHERE p.id = v_current_user_id;
  END;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent accéder à cette fonction';
  END IF;

  -- Compter tous les profils
  SELECT COUNT(*) INTO v_count
  FROM profiles;

  RETURN v_count;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.count_all_users_for_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_all_users_for_admin(UUID) TO anon;

COMMENT ON FUNCTION public.count_all_users_for_admin(UUID) IS 
'Compte le nombre total d''utilisateurs dans la base de données. Nécessite d''être admin. Paramètre: p_user_id (UUID de l''utilisateur connecté).';

