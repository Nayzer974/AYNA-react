-- ============================================
-- Script pour attribuer le rôle 'special' à un utilisateur spécifique
-- ============================================
-- Utilisateur spécial: faina2006amed@gmail.com
-- Date: 2025-01-27
-- INSTRUCTIONS:
-- 1. Exécutez ce script dans Supabase SQL Editor (en tant qu'admin)
-- 2. Vérifiez que le rôle a été attribué avec la requête de vérification

-- ============================================
-- OPTION 1: Via fonction RPC (recommandé)
-- ============================================
SELECT public.grant_special_role('faina2006amed@gmail.com');

-- ============================================
-- OPTION 2: Directement dans la table (si fonction non disponible)
-- ============================================
-- Note: Cette méthode nécessite d'être connecté en tant qu'admin
INSERT INTO public.user_roles (user_id, role_type)
SELECT id, 'special'
FROM auth.users
WHERE email = 'faina2006amed@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
  role_type = 'special',
  updated_at = NOW();

-- ============================================
-- VÉRIFICATION: Vérifier que le rôle a été attribué
-- ============================================
SELECT 
  u.email,
  u.id as user_id,
  COALESCE(ur.role_type, 'normal') as role_type,
  ur.granted_at,
  granted_by_user.email as granted_by_email
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN auth.users granted_by_user ON granted_by_user.id = ur.granted_by
WHERE u.email = 'faina2006amed@gmail.com';

-- ============================================
-- RETIRER LE RÔLE (si nécessaire)
-- ============================================
-- Décommenter la ligne suivante pour retirer le rôle spécial
-- SELECT public.revoke_special_role('faina2006amed@gmail.com');

-- ============================================
-- LISTER TOUS LES UTILISATEURS SPÉCIAUX
-- ============================================
SELECT 
  u.email,
  u.id as user_id,
  ur.role_type,
  ur.granted_at,
  granted_by_user.email as granted_by_email
FROM auth.users u
INNER JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN auth.users granted_by_user ON granted_by_user.id = ur.granted_by
WHERE ur.role_type = 'special'
ORDER BY ur.granted_at DESC;

