-- Script pour corriger les permissions d'insertion sur community_posts
-- Permet aux utilisateurs connectes ET non connectes de publier
-- A executer dans Supabase SQL Editor

-- Supprimer toutes les anciennes politiques d'insertion
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.community_posts;
DROP POLICY IF EXISTS "Anyone can insert posts" ON public.community_posts;

-- Creer une politique permissive pour l'insertion
-- Permet a tout le monde (authentifie ou non) de creer un post
CREATE POLICY "Anyone can insert posts"
  ON public.community_posts
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Rendre user_id nullable pour permettre les utilisateurs anonymes
-- Si la colonne est deja nullable, cette commande ne fera rien
ALTER TABLE public.community_posts
ALTER COLUMN user_id DROP NOT NULL;

-- Ajouter un DEFAULT pour user_id qui utilise auth.uid() si disponible
-- Cela permet d'auto-remplir user_id pour les utilisateurs connectes
-- Pour les non connectes, user_id sera NULL
ALTER TABLE public.community_posts
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Verifier que la table a bien RLS active
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
