-- Script pour ajouter la colonne user_avatar a la table community_posts
-- A executer dans Supabase SQL Editor

-- Ajouter la colonne user_avatar si elle n existe pas
ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS user_avatar TEXT;

-- Commentaire
COMMENT ON COLUMN public.community_posts.user_avatar IS 'URL de l avatar de l utilisateur qui a cree le post';

