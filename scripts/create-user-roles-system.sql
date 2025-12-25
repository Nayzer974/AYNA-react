-- ============================================
-- Script complet pour créer le système de rôles utilisateurs
-- Ambiance secrète "Neige (ambiance Faïna)"
-- ============================================
-- À exécuter dans Supabase SQL Editor
-- Date: 2025-01-27

-- ============================================
-- 1. Créer la table user_roles
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN ('admin', 'special', 'normal')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_type ON public.user_roles(role_type);

COMMENT ON TABLE public.user_roles IS 'Table pour gérer les rôles utilisateurs (admin, special, normal)';

-- ============================================
-- 2. Activer RLS sur la table
-- ============================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. Créer les RLS Policies
-- ============================================

-- Policy: Les utilisateurs peuvent voir leur propre rôle
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Les admins peuvent tout voir
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (
        email = 'pro.ibrahima00@gmail.com'
        OR email = 'admin@admin.com'
        OR email = 'admin'
        OR (raw_user_meta_data->>'is_admin')::boolean = true
      )
    )
  );

-- Policy: Les admins peuvent modifier les rôles
DROP POLICY IF EXISTS "Admins can modify roles" ON public.user_roles;
CREATE POLICY "Admins can modify roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (
        email = 'pro.ibrahima00@gmail.com'
        OR email = 'admin@admin.com'
        OR email = 'admin'
        OR (raw_user_meta_data->>'is_admin')::boolean = true
      )
    )
  );

-- ============================================
-- 4. Fonction pour vérifier si un utilisateur est spécial
-- ============================================
CREATE OR REPLACE FUNCTION public.is_user_special(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN := false;
  v_is_special BOOLEAN := false;
BEGIN
  -- Utiliser l'ID fourni ou l'ID de l'utilisateur actuel
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Vérifier si l'utilisateur est admin
  -- Utiliser la fonction existante is_user_admin si disponible
  BEGIN
    SELECT public.is_user_admin(v_user_id) INTO v_is_admin;
  EXCEPTION
    WHEN OTHERS THEN
      -- Si la fonction n'existe pas, vérifier manuellement
      SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = v_user_id
        AND (
          email = 'pro.ibrahima00@gmail.com'
          OR email = 'admin@admin.com'
          OR email = 'admin'
          OR (raw_user_meta_data->>'is_admin')::boolean = true
        )
      ) INTO v_is_admin;
  END;
  
  IF v_is_admin THEN
    -- Les admins ont automatiquement accès aux fonctionnalités spéciales
    RETURN true;
  END IF;

  -- Vérifier si l'utilisateur a le rôle 'special'
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_user_id
    AND role_type = 'special'
  ) INTO v_is_special;

  RETURN v_is_special;
END;
$$;

COMMENT ON FUNCTION public.is_user_special(UUID) IS 'Vérifie si un utilisateur est spécial (admin ou role special)';

-- ============================================
-- 5. Fonction pour attribuer le rôle spécial
-- ============================================
CREATE OR REPLACE FUNCTION public.grant_special_role(
  p_user_email TEXT,
  p_granted_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_granted_by_id UUID;
  v_current_user_is_admin BOOLEAN;
BEGIN
  -- Utiliser l'ID fourni ou l'ID de l'utilisateur actuel
  v_granted_by_id := COALESCE(p_granted_by, auth.uid());
  
  -- Vérifier que l'utilisateur actuel est admin
  BEGIN
    SELECT public.is_user_admin(v_granted_by_id) INTO v_current_user_is_admin;
  EXCEPTION
    WHEN OTHERS THEN
      -- Si la fonction n'existe pas, vérifier manuellement
      SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = v_granted_by_id
        AND (
          email = 'pro.ibrahima00@gmail.com'
          OR email = 'admin@admin.com'
          OR email = 'admin'
          OR (raw_user_meta_data->>'is_admin')::boolean = true
        )
      ) INTO v_current_user_is_admin;
  END;
  
  IF NOT v_current_user_is_admin THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent attribuer le rôle spécial';
  END IF;

  -- Trouver l'utilisateur par email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non trouvé avec l''email: %', p_user_email;
  END IF;

  -- Insérer ou mettre à jour le rôle
  INSERT INTO public.user_roles (user_id, role_type, granted_by)
  VALUES (v_user_id, 'special', v_granted_by_id)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    role_type = 'special',
    granted_by = v_granted_by_id,
    granted_at = NOW(),
    updated_at = NOW();

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.grant_special_role(TEXT, UUID) IS 'Attribue le rôle spécial à un utilisateur (admin uniquement)';

-- ============================================
-- 6. Fonction pour retirer le rôle spécial
-- ============================================
CREATE OR REPLACE FUNCTION public.revoke_special_role(p_user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_current_user_is_admin BOOLEAN;
BEGIN
  -- Vérifier que l'utilisateur actuel est admin
  BEGIN
    SELECT public.is_user_admin(auth.uid()) INTO v_current_user_is_admin;
  EXCEPTION
    WHEN OTHERS THEN
      -- Si la fonction n'existe pas, vérifier manuellement
      SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND (
          email = 'pro.ibrahima00@gmail.com'
          OR email = 'admin@admin.com'
          OR email = 'admin'
          OR (raw_user_meta_data->>'is_admin')::boolean = true
        )
      ) INTO v_current_user_is_admin;
  END;
  
  IF NOT v_current_user_is_admin THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent retirer le rôle spécial';
  END IF;

  -- Trouver l'utilisateur par email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non trouvé avec l''email: %', p_user_email;
  END IF;

  -- Supprimer le rôle spécial (ou le mettre à 'normal')
  UPDATE public.user_roles
  SET role_type = 'normal',
      updated_at = NOW()
  WHERE user_id = v_user_id
  AND role_type = 'special';

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.revoke_special_role(TEXT) IS 'Retire le rôle spécial d''un utilisateur (admin uniquement)';

-- ============================================
-- 7. Trigger pour mettre à jour updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_user_roles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER trigger_update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_roles_updated_at();

-- ============================================
-- 8. Exemple : Attribuer le rôle spécial à un utilisateur
-- ============================================
-- REMPLACER 'user@example.com' PAR L'EMAIL DE L'UTILISATEUR
-- SELECT public.grant_special_role('user@example.com');

-- ============================================
-- 9. Vérifier les rôles attribués
-- ============================================
-- SELECT 
--   u.email,
--   u.id,
--   ur.role_type,
--   ur.granted_at,
--   granted_by_user.email as granted_by_email
-- FROM auth.users u
-- LEFT JOIN public.user_roles ur ON ur.user_id = u.id
-- LEFT JOIN auth.users granted_by_user ON granted_by_user.id = ur.granted_by
-- WHERE ur.role_type = 'special'
-- ORDER BY ur.granted_at DESC;

-- ============================================
-- FIN DU SCRIPT
-- ============================================
-- Après exécution, vous pouvez :
-- 1. Attribuer le rôle spécial avec: SELECT public.grant_special_role('email@example.com');
-- 2. Vérifier les rôles avec la requête ci-dessus
-- 3. Retirer le rôle avec: SELECT public.revoke_special_role('email@example.com');










