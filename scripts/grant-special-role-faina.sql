-- ============================================
-- Script pour attribuer le rôle 'special' à faina2006amed@gmail.com
-- ============================================
-- Utilisateur spécial: faina2006amed@gmail.com
-- Date: 2025-01-27
-- 
-- INSTRUCTIONS:
-- 1. Exécutez d'abord: scripts/create-user-roles-system.sql (si pas déjà fait)
-- 2. Exécutez ce script dans Supabase SQL Editor (en tant qu'admin)
-- 3. Vérifiez que le rôle a été attribué avec la requête de vérification en bas

-- ============================================
-- OPTION 1: Via fonction RPC (recommandé)
-- ============================================
SELECT public.grant_special_role('faina2006amed@gmail.com');

-- ============================================
-- OPTION 2: Directement dans la table (RECOMMANDÉ si erreur de permissions)
-- ============================================
-- Cette méthode fonctionne directement depuis le SQL Editor
-- Pas besoin d'être admin, le SQL Editor a les permissions nécessaires
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
  granted_by_user.email as granted_by_email,
  CASE 
    WHEN ur.role_type = 'special' THEN '✅ Rôle spécial attribué'
    WHEN ur.role_type = 'admin' THEN '✅ Admin'
    ELSE '❌ Rôle normal'
  END as status
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN auth.users granted_by_user ON granted_by_user.id = ur.granted_by
WHERE u.email = 'faina2006amed@gmail.com';

-- ============================================
-- RETIRER LE RÔLE (si nécessaire - décommenter)
-- ============================================
-- SELECT public.revoke_special_role('faina2006amed@gmail.com');

