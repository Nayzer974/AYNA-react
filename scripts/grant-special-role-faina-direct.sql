-- ============================================
-- Script DIRECT pour attribuer le rôle 'special' à faina2006amed@gmail.com
-- ============================================
-- Utilisateur spécial: faina2006amed@gmail.com
-- Date: 2025-01-27
-- 
-- Ce script utilise INSERT direct (bypass la vérification admin)
-- À utiliser si la fonction RPC retourne une erreur de permissions
--
-- INSTRUCTIONS:
-- 1. Exécutez d'abord: scripts/create-user-roles-system.sql (si pas déjà fait)
-- 2. Exécutez ce script dans Supabase SQL Editor
-- 3. Vérifiez que le rôle a été attribué avec la requête de vérification en bas

-- ============================================
-- MÉTHODE DIRECTE: Insertion directe dans la table
-- ============================================
-- Cette méthode fonctionne même si vous n'êtes pas connecté en tant qu'admin
-- car le SQL Editor de Supabase a les permissions nécessaires

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
  CASE 
    WHEN ur.role_type = 'special' THEN '✅ Rôle spécial attribué avec succès'
    WHEN ur.role_type = 'admin' THEN '✅ Admin'
    WHEN ur.role_type IS NULL THEN '❌ Aucun rôle (normal)'
    ELSE '❌ Rôle: ' || ur.role_type
  END as status
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'faina2006amed@gmail.com';

-- ============================================
-- RETIRER LE RÔLE (si nécessaire)
-- ============================================
-- Décommenter et exécuter pour retirer le rôle spécial
-- UPDATE public.user_roles
-- SET role_type = 'normal',
--     updated_at = NOW()
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'faina2006amed@gmail.com')
--   AND role_type = 'special';










