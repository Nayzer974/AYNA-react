-- Fonction RPC pour supprimer un post en contournant RLS
-- A executer dans Supabase SQL Editor
-- Utilise p_user_id passe depuis le client, ne depend pas de auth.uid()

-- ✅ Supprimer toutes les versions existantes de la fonction pour éviter les conflits
-- Méthode robuste : Supprimer toutes les versions avec leurs signatures exactes
DO $$
DECLARE
  func_record RECORD;
  drop_sql TEXT;
BEGIN
  -- Trouver toutes les versions de delete_community_post
  FOR func_record IN 
    SELECT 
      p.oid,
      p.proname,
      pg_get_function_identity_arguments(p.oid) as identity_args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'delete_community_post'
    AND n.nspname = 'public'
  LOOP
    -- Construire la commande DROP avec la signature d'identité (plus fiable)
    drop_sql := 'DROP FUNCTION IF EXISTS public.delete_community_post(' || func_record.identity_args || ') CASCADE';
    RAISE NOTICE 'Suppression de: %', drop_sql;
    EXECUTE drop_sql;
  END LOOP;
END $$;

-- ✅ Créer la fonction avec la signature correcte
CREATE OR REPLACE FUNCTION public.delete_community_post(
  p_post_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_post_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  -- Obtenir le user_id du post
  SELECT user_id INTO v_post_user_id
  FROM public.community_posts
  WHERE id = p_post_id;
  
  -- Si le post n'existe pas
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Le post n''existe pas';
  END IF;
  
  -- Cas 1: Le post est anonyme (user_id IS NULL) - permettre la suppression a tout le monde
  IF v_post_user_id IS NULL THEN
    -- Supprimer les likes associes
    DELETE FROM public.community_post_likes
    WHERE post_id = p_post_id;
    
    -- Supprimer le post
    DELETE FROM public.community_posts
    WHERE id = p_post_id;
    
    RETURN p_post_id;
  END IF;
  
  -- Cas 2: Le post a un proprietaire - verifier les permissions
  -- Si p_user_id est fourni, l'utiliser pour verifier les permissions
  IF p_user_id IS NOT NULL THEN
    -- Verifier si l'utilisateur est admin (utiliser la fonction sécurisée si disponible)
    BEGIN
      SELECT public.check_user_is_admin(p_user_id) INTO v_is_admin;
    EXCEPTION
      WHEN OTHERS THEN
        -- Fallback sur la table profiles si la fonction n'existe pas
        SELECT COALESCE(is_admin, false) INTO v_is_admin
        FROM public.profiles
        WHERE id = p_user_id;
    END;
    
    -- Si l'utilisateur est le proprietaire OU est admin
    IF (p_user_id = v_post_user_id) OR (v_is_admin = true) THEN
      -- Supprimer les likes associes
      DELETE FROM public.community_post_likes
      WHERE post_id = p_post_id;
      
      -- Supprimer le post
      DELETE FROM public.community_posts
      WHERE id = p_post_id;
      
      RETURN p_post_id;
    ELSE
      RAISE EXCEPTION 'Vous n''avez pas la permission de supprimer ce post';
    END IF;
  ELSE
    -- Si p_user_id n'est pas fourni, permettre la suppression uniquement pour les posts anonymes
    -- (deja gere dans le Cas 1 ci-dessus, donc on ne devrait jamais arriver ici)
    -- Mais au cas ou, on refuse pour securite
    RAISE EXCEPTION 'Vous devez fournir votre ID utilisateur pour supprimer ce post';
  END IF;
END;
$$;

-- Permissions : Tous les utilisateurs authentifiés peuvent appeler cette fonction
-- Note: La signature est (UUID, UUID) car le deuxième paramètre a une valeur par défaut
GRANT EXECUTE ON FUNCTION public.delete_community_post(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_community_post(UUID, UUID) TO anon;

-- Commentaire
COMMENT ON FUNCTION public.delete_community_post(UUID, UUID) IS 'Supprime un post de la communaute. Utilise p_user_id passe depuis le client, ne depend pas de auth.uid(). Contourne RLS avec SECURITY DEFINER. Paramètres: p_post_id (UUID), p_user_id (UUID, optionnel avec DEFAULT NULL).';
