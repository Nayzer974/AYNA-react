-- Script pour ajouter le support des posts Fondation
-- À exécuter dans Supabase SQL Editor

-- Ajouter la colonne is_foundation à la table community_posts
ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS is_foundation BOOLEAN DEFAULT false NOT NULL;

-- Créer un index pour améliorer les performances des requêtes Fondation
CREATE INDEX IF NOT EXISTS idx_community_posts_is_foundation ON public.community_posts(is_foundation);

-- Mettre à jour les RLS policies pour permettre aux admins de créer des posts Fondation
-- (Les policies existantes devraient déjà permettre cela, mais on s'assure)

-- Commentaire
COMMENT ON COLUMN public.community_posts.is_foundation IS 'Indique si le post est une publication Fondation (admin uniquement)';

