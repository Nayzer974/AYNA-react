-- Script pour ajouter la colonne user_avatar a la table community_posts
-- A executer dans Supabase SQL Editor

ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS user_avatar TEXT;
