-- ============================================
-- SCRIPT DE VÉRIFICATION ET CORRECTION DU STATUT ADMIN
-- ============================================
-- Date : 2025-01-27
-- Expert Sécurité : Agent IA Sécurité AYNA
--
-- ⚠️ IMPORTANT : Exécuter ce script dans Supabase SQL Editor
-- Ce script vérifie et corrige le statut admin d'un utilisateur
-- ============================================

-- ============================================
-- ÉTAPE 1 : TROUVER VOTRE USER_ID
-- ============================================
-- Remplacez 'VOTRE_EMAIL@example.com' par votre email
-- Exécutez cette requête pour trouver votre user_id
-- ⚠️ Si "No rows returned", vérifiez que l'email est correct

SELECT 
  u.id as user_id,
  u.email,
  p.name,
  p.is_admin,
  p.id as profile_id
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'VOTRE_EMAIL@example.com';

-- Alternative : Lister tous les utilisateurs pour trouver votre email
-- Décommentez la ligne suivante si vous ne trouvez pas votre user_id :
-- SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 20;

-- ============================================
-- ÉTAPE 2 : VÉRIFIER LE STATUT ADMIN
-- ============================================
-- Remplacez 'VOTRE_USER_ID' par l'ID trouvé à l'étape 1
-- ⚠️ Si "No rows returned", votre profil n'existe pas encore (passez à l'Étape 3 Option B)

SELECT 
  id,
  email,
  name,
  is_admin,
  CASE 
    WHEN is_admin = true THEN '✅ Admin'
    WHEN is_admin = false THEN '❌ Non-admin'
    WHEN is_admin IS NULL THEN '⚠️ NULL (non défini)'
  END as status
FROM public.profiles
WHERE id = 'VOTRE_USER_ID'::UUID;

-- Alternative : Vérifier avec l'email (si vous n'avez pas le user_id)
-- SELECT id, email, name, is_admin FROM public.profiles WHERE email = 'VOTRE_EMAIL@example.com';

-- ============================================
-- ÉTAPE 3 : CORRIGER LE STATUT ADMIN
-- ============================================
-- Remplacez 'VOTRE_USER_ID' par votre user_id
-- ⚠️ ATTENTION : Cette commande définit l'utilisateur comme admin

-- Option A : Si le profil existe déjà, le mettre à jour
UPDATE public.profiles
SET is_admin = true
WHERE id = 'VOTRE_USER_ID'::UUID;

-- Option B : Si le profil n'existe pas, le créer avec is_admin = true
-- Décommentez cette section si l'UPDATE ne fonctionne pas (No rows returned)
/*
INSERT INTO public.profiles (id, email, name, is_admin)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', 'Utilisateur'),
  true
FROM auth.users u
WHERE u.id = 'VOTRE_USER_ID'::UUID
ON CONFLICT (id) DO UPDATE SET is_admin = true;
*/

-- Vérifier que la mise à jour a fonctionné
-- ⚠️ Si "No rows returned", le profil n'existe peut-être pas (utilisez Option B)
SELECT 
  id,
  email,
  name,
  is_admin,
  CASE 
    WHEN is_admin = true THEN '✅ Statut admin mis à jour'
    ELSE '❌ Erreur : is_admin n''est pas true'
  END as message
FROM public.profiles
WHERE id = 'VOTRE_USER_ID'::UUID;

-- ============================================
-- ÉTAPE 4 : TESTER LA FONCTION check_user_is_admin
-- ============================================
-- Remplacez 'VOTRE_USER_ID' par votre user_id
-- Cette fonction doit retourner true si vous êtes admin

SELECT 
  public.check_user_is_admin('VOTRE_USER_ID'::UUID) as is_admin_check;

-- ============================================
-- ÉTAPE 5 : VÉRIFIER QUE LA FONCTION delete_community_post EXISTE
-- ============================================

SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments,
  CASE 
    WHEN proname = 'delete_community_post' THEN '✅ Fonction trouvée'
    ELSE '❌ Fonction non trouvée'
  END as status
FROM pg_proc
WHERE proname = 'delete_community_post'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ============================================
-- ÉTAPE 6 : LISTER TOUS LES ADMINS
-- ============================================
-- Pour vérifier qui sont les admins dans la base de données

SELECT 
  id,
  email,
  name,
  is_admin,
  created_at
FROM public.profiles
WHERE is_admin = true
ORDER BY created_at DESC;

-- ============================================
-- ✅ SCRIPT TERMINÉ
-- ============================================
-- Après avoir exécuté ces étapes :
-- 1. Votre statut admin devrait être défini à true
-- 2. La fonction check_user_is_admin devrait retourner true
-- 3. Vous devriez pouvoir supprimer des posts en tant qu'admin
-- ============================================

