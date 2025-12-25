-- ============================================
-- FONCTION RPC SÉCURISÉE POUR VÉRIFIER LE STATUT ADMIN
-- ============================================
-- Date : 2025-01-27
-- Expert Sécurité : Agent IA Sécurité AYNA
--
-- ⚠️ IMPORTANT : Exécuter ce script dans Supabase SQL Editor
-- Cette fonction remplace la vérification admin côté client par une vérification sécurisée côté serveur
-- ============================================

-- Supprimer la fonction existante si elle existe
DROP FUNCTION IF EXISTS public.check_user_is_admin(UUID);

-- ✅ Fonction pour vérifier si un utilisateur est admin (sécurisée)
-- Cette fonction vérifie uniquement via la table profiles, pas via user_metadata
CREATE OR REPLACE FUNCTION public.check_user_is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- ✅ Validation : Vérifier que l'utilisateur appelant correspond à p_user_id
  -- Empêche un utilisateur de vérifier le statut admin d'un autre utilisateur
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Vous ne pouvez vérifier que votre propre statut admin';
  END IF;

  -- ✅ Vérifier uniquement via la table profiles (source de vérité)
  -- Ne jamais faire confiance aux user_metadata qui peuvent être modifiés côté client
  SELECT is_admin INTO v_is_admin
  FROM profiles
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_is_admin, false);
END;
$$;

-- Permissions : Seuls les utilisateurs authentifiés peuvent appeler cette fonction
GRANT EXECUTE ON FUNCTION public.check_user_is_admin(UUID) TO authenticated;

-- Commentaire pour documentation
COMMENT ON FUNCTION public.check_user_is_admin(UUID) IS 
'Sécurisé : Vérifie le statut admin uniquement via la table profiles. Empêche la vérification du statut admin d''autres utilisateurs.';

-- ============================================
-- ✅ FONCTION CRÉÉE AVEC SUCCÈS
-- ============================================
-- Cette fonction peut maintenant être appelée depuis le client :
-- const { data } = await supabase.rpc('check_user_is_admin', { p_user_id: user.id });
-- ============================================










