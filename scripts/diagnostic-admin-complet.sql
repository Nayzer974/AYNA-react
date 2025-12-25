-- ============================================
-- SCRIPT DE DIAGNOSTIC COMPLET - STATUT ADMIN
-- ============================================
-- Date : 2025-01-27
-- Expert Sécurité : Agent IA Sécurité AYNA
--
-- ⚠️ IMPORTANT : Exécutez ce script étape par étape
-- Email configuré : pro.ibrahima00@gmail.com
-- ============================================

-- ============================================
-- ÉTAPE 1 : VÉRIFIER QUE VOTRE UTILISATEUR EXISTE
-- ============================================

SELECT 
  'ÉTAPE 1 : Vérification utilisateur' as etape,
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  CASE 
    WHEN u.id IS NOT NULL THEN '✅ Utilisateur trouvé'
    ELSE '❌ Utilisateur non trouvé'
  END as status
FROM auth.users u
WHERE u.email = 'pro.ibrahima00@gmail.com';

-- Si "No rows returned" : Votre email n'existe pas dans auth.users
-- Solution : Vérifiez l'orthographe ou listez tous les utilisateurs :
-- SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 20;

-- ============================================
-- ÉTAPE 2 : VÉRIFIER SI VOTRE PROFIL EXISTE
-- ============================================

SELECT 
  'ÉTAPE 2 : Vérification profil' as etape,
  u.id as user_id,
  u.email,
  p.id as profile_id,
  p.name,
  p.is_admin,
  CASE 
    WHEN p.id IS NULL THEN '❌ Profil n''existe pas - À créer'
    WHEN p.is_admin = true THEN '✅ Profil existe - Admin'
    WHEN p.is_admin = false THEN '⚠️ Profil existe - Non-admin'
    WHEN p.is_admin IS NULL THEN '⚠️ Profil existe - is_admin NULL'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'pro.ibrahima00@gmail.com';

-- ============================================
-- ÉTAPE 3 : CRÉER OU METTRE À JOUR LE PROFIL
-- ============================================
-- Cette commande crée le profil s'il n'existe pas, ou le met à jour s'il existe

INSERT INTO public.profiles (id, email, name, is_admin)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', 'Utilisateur'),
  true  -- Définir comme admin
FROM auth.users u
WHERE u.email = 'pro.ibrahima00@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET 
  is_admin = true,
  email = EXCLUDED.email
RETURNING 
  id,
  email,
  name,
  is_admin,
  CASE 
    WHEN is_admin = true THEN '✅ Profil créé/mis à jour - Admin'
    ELSE '❌ Erreur'
  END as status;

-- Si "No rows returned" : L'utilisateur n'existe pas dans auth.users
-- Vérifiez l'email à l'étape 1

-- ============================================
-- ÉTAPE 4 : VÉRIFIER LE STATUT ADMIN
-- ============================================

SELECT 
  'ÉTAPE 4 : Vérification finale' as etape,
  p.id,
  p.email,
  p.name,
  p.is_admin,
  CASE 
    WHEN p.is_admin = true THEN '✅ Vous êtes admin !'
    WHEN p.is_admin = false THEN '❌ Vous n''êtes pas admin'
    WHEN p.is_admin IS NULL THEN '⚠️ is_admin est NULL'
    WHEN p.id IS NULL THEN '❌ Profil n''existe toujours pas'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'pro.ibrahima00@gmail.com';

-- ============================================
-- ÉTAPE 5 : TESTER LA FONCTION check_user_is_admin
-- ============================================

SELECT 
  'ÉTAPE 5 : Test fonction admin' as etape,
  u.id as user_id,
  public.check_user_is_admin(u.id) as is_admin_check,
  CASE 
    WHEN public.check_user_is_admin(u.id) = true THEN '✅ Fonction retourne true - Vous êtes admin'
    WHEN public.check_user_is_admin(u.id) = false THEN '❌ Fonction retourne false - Vous n''êtes pas admin'
    ELSE '⚠️ Erreur lors de l''appel de la fonction'
  END as status
FROM auth.users u
WHERE u.email = 'pro.ibrahima00@gmail.com';

-- Si "No rows returned" : L'utilisateur n'existe pas ou la fonction n'existe pas
-- Vérifiez que la fonction check_user_is_admin existe :
-- SELECT proname FROM pg_proc WHERE proname = 'check_user_is_admin';

-- ============================================
-- ÉTAPE 6 : LISTER TOUS VOS PROFILS (pour debug)
-- ============================================
-- Si vous voulez voir tous les profils dans la base

SELECT 
  'ÉTAPE 6 : Liste des profils' as etape,
  id,
  email,
  name,
  is_admin,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- ✅ DIAGNOSTIC TERMINÉ
-- ============================================
-- Après avoir exécuté toutes les étapes :
-- 1. Votre profil devrait exister dans public.profiles
-- 2. is_admin devrait être true
-- 3. check_user_is_admin() devrait retourner true
-- 4. Vous devriez pouvoir supprimer des posts en tant qu'admin
-- ============================================

