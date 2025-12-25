-- ============================================
-- CONTRAINTES DE VALIDATION SQL POUR SÉCURITÉ
-- ============================================
-- Ce script ajoute des contraintes SQL strictes pour valider les données
-- même si le client est compromis.
--
-- ⚠️ IMPORTANT : Exécuter ce script dans Supabase SQL Editor
-- 
-- Ce script est idempotent : il peut être exécuté plusieurs fois sans erreur.
-- Il supprime d'abord les contraintes existantes avant de les recréer.
-- ============================================

-- ============================================
-- 1. TABLE PROFILES - Limites de taille
-- ============================================

-- Limiter la taille du nom (max 100 caractères) - seulement si la colonne existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'name') THEN
    ALTER TABLE profiles ALTER COLUMN name TYPE VARCHAR(100);
  END IF;
END $$;

-- Limiter la taille de l'email (max 255 caractères) - seulement si la colonne existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE profiles ALTER COLUMN email TYPE VARCHAR(255);
  END IF;
END $$;

-- Limiter la taille de l'avatar URL (max 500 caractères) - seulement si les colonnes existent
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar') THEN
    ALTER TABLE profiles ALTER COLUMN avatar TYPE VARCHAR(500);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE profiles ALTER COLUMN avatar_url TYPE VARCHAR(500);
  END IF;
END $$;

-- Limiter la taille du push token (max 500 caractères) - seulement si la colonne existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'push_token') THEN
    ALTER TABLE profiles ALTER COLUMN push_token TYPE VARCHAR(500);
  END IF;
END $$;

-- ============================================
-- 2. TABLE COMMUNITY_POSTS - Limites de taille
-- ============================================

-- Limiter la taille du texte du post (max 5000 caractères)
ALTER TABLE community_posts
  ALTER COLUMN text TYPE VARCHAR(5000);

-- Limiter la taille du nom utilisateur (max 100 caractères)
ALTER TABLE community_posts
  ALTER COLUMN user_name TYPE VARCHAR(100);

-- Limiter la taille de l'avatar URL (max 500 caractères)
ALTER TABLE community_posts
  ALTER COLUMN user_avatar TYPE VARCHAR(500);

-- Supprimer la contrainte existante si elle existe
ALTER TABLE community_posts
  DROP CONSTRAINT IF EXISTS community_posts_text_not_empty;

-- Ajouter une contrainte pour empêcher les posts vides
ALTER TABLE community_posts
  ADD CONSTRAINT community_posts_text_not_empty
  CHECK (LENGTH(TRIM(text)) > 0);

-- ============================================
-- 3. TABLE ANALYTICS_EVENTS - Limites de taille
-- ============================================

-- Limiter la taille du nom d'événement (max 100 caractères)
ALTER TABLE analytics_events
  ALTER COLUMN event_name TYPE VARCHAR(100);

-- Supprimer la contrainte existante si elle existe
ALTER TABLE analytics_events
  DROP CONSTRAINT IF EXISTS analytics_events_properties_size;

-- Limiter la taille des propriétés JSONB (max 10KB)
-- Note: PostgreSQL ne supporte pas directement la limite de taille pour JSONB,
-- mais on peut ajouter une contrainte CHECK
ALTER TABLE analytics_events
  ADD CONSTRAINT analytics_events_properties_size
  CHECK (LENGTH(properties::text) <= 10000);

-- ============================================
-- 4. TABLE USER_BANS - Validation
-- ============================================

-- Limiter la taille de l'email (max 255 caractères)
ALTER TABLE user_bans
  ALTER COLUMN user_email TYPE VARCHAR(255);

-- Limiter la taille de la raison (max 1000 caractères)
ALTER TABLE user_bans
  ALTER COLUMN reason TYPE VARCHAR(1000);

-- Supprimer les contraintes existantes si elles existent
ALTER TABLE user_bans
  DROP CONSTRAINT IF EXISTS user_bans_temporary_duration_check;

ALTER TABLE user_bans
  DROP CONSTRAINT IF EXISTS user_bans_temporary_expires_at_check;

-- Valider la durée pour les bannissements temporaires
ALTER TABLE user_bans
  ADD CONSTRAINT user_bans_temporary_duration_check
  CHECK (
    (ban_type = 'temporary' AND duration_minutes IS NOT NULL AND duration_minutes > 0) OR
    (ban_type = 'permanent' AND duration_minutes IS NULL)
  );

-- Valider la date d'expiration pour les bannissements temporaires
ALTER TABLE user_bans
  ADD CONSTRAINT user_bans_temporary_expires_at_check
  CHECK (
    (ban_type = 'temporary' AND expires_at IS NOT NULL) OR
    (ban_type = 'permanent' AND expires_at IS NULL)
  );

-- ============================================
-- 5. TABLE BANNED_EMAILS - Validation
-- ============================================

-- Limiter la taille de l'email (max 255 caractères)
ALTER TABLE banned_emails
  ALTER COLUMN email TYPE VARCHAR(255);

-- Supprimer la contrainte existante si elle existe
ALTER TABLE banned_emails
  DROP CONSTRAINT IF EXISTS banned_emails_email_format_check;

-- Valider le format de l'email (basique)
ALTER TABLE banned_emails
  ADD CONSTRAINT banned_emails_email_format_check
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- Limiter la taille de la raison (max 1000 caractères)
ALTER TABLE banned_emails
  ALTER COLUMN reason TYPE VARCHAR(1000);

-- ============================================
-- 6. TABLE DHIKR_SESSIONS - Validation
-- ============================================

-- Limiter la taille du texte dhikr (max 500 caractères)
ALTER TABLE dhikr_sessions
  ALTER COLUMN dhikr_text TYPE VARCHAR(500);

-- Supprimer les contraintes existantes si elles existent
ALTER TABLE dhikr_sessions
  DROP CONSTRAINT IF EXISTS dhikr_sessions_target_count_check;

ALTER TABLE dhikr_sessions
  DROP CONSTRAINT IF EXISTS dhikr_sessions_max_participants_check;

-- Valider le nombre de clics cible (entre 100 et 999)
ALTER TABLE dhikr_sessions
  ADD CONSTRAINT dhikr_sessions_target_count_check
  CHECK (target_count >= 100 AND target_count <= 999);

-- Valider le nombre maximum de participants (entre 1 et 100)
ALTER TABLE dhikr_sessions
  ADD CONSTRAINT dhikr_sessions_max_participants_check
  CHECK (max_participants >= 1 AND max_participants <= 100);

-- ============================================
-- 7. TABLE KHALWA_SESSIONS - Validation
-- ============================================

-- Limiter la taille de l'intention (max 1000 caractères)
ALTER TABLE khalwa_sessions
  ALTER COLUMN intention TYPE VARCHAR(1000);

-- Limiter la taille du nom divin en arabe (max 100 caractères)
ALTER TABLE khalwa_sessions
  ALTER COLUMN divine_name_arabic TYPE VARCHAR(100);

-- Limiter la taille de la translittération (max 100 caractères)
ALTER TABLE khalwa_sessions
  ALTER COLUMN divine_name_transliteration TYPE VARCHAR(100);

-- Supprimer la contrainte existante si elle existe
ALTER TABLE khalwa_sessions
  DROP CONSTRAINT IF EXISTS khalwa_sessions_duration_check;

-- Valider la durée (entre 1 et 120 minutes)
ALTER TABLE khalwa_sessions
  ADD CONSTRAINT khalwa_sessions_duration_check
  CHECK (duration_minutes >= 1 AND duration_minutes <= 120);

-- ============================================
-- 8. TABLE JOURNAL_NOTES - Validation
-- ============================================

-- Limiter la taille du texte de la note (max 10000 caractères)
ALTER TABLE journal_notes
  ALTER COLUMN text TYPE VARCHAR(10000);

-- Supprimer la contrainte existante si elle existe
ALTER TABLE journal_notes
  DROP CONSTRAINT IF EXISTS journal_notes_text_not_empty;

-- Ajouter une contrainte pour empêcher les notes vides
ALTER TABLE journal_notes
  ADD CONSTRAINT journal_notes_text_not_empty
  CHECK (LENGTH(TRIM(text)) > 0);

-- ============================================
-- 9. TABLE USER_PREFERENCES - Validation
-- ============================================

-- Supprimer la contrainte existante si elle existe
ALTER TABLE user_preferences
  DROP CONSTRAINT IF EXISTS user_preferences_size_check;

-- Limiter la taille des préférences JSONB (max 50KB)
ALTER TABLE user_preferences
  ADD CONSTRAINT user_preferences_size_check
  CHECK (LENGTH(preferences::text) <= 50000);

-- ============================================
-- 10. TABLE MODULE_VISITS - Validation
-- ============================================

-- Vérifier que la table existe et contient la colonne visited_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'module_visits'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'module_visits' AND column_name = 'visited_at'
  ) THEN
    -- Supprimer la contrainte existante si elle existe
    ALTER TABLE module_visits
      DROP CONSTRAINT IF EXISTS module_visits_visited_at_check;

    -- Valider que la date de visite est raisonnable (pas dans le futur, pas trop ancien)
    -- Note: visited_at est de type TIMESTAMPTZ, pas timestamp Unix
    ALTER TABLE module_visits
      ADD CONSTRAINT module_visits_visited_at_check
      CHECK (
        visited_at >= NOW() - INTERVAL '1 year' AND
        visited_at <= NOW() + INTERVAL '1 day'
      );
  END IF;
END $$;

-- ============================================
-- ✅ CONTRAINTES DE VALIDATION AJOUTÉES
-- ============================================
-- Toutes les tables ont maintenant des contraintes de validation
-- qui empêchent l'insertion de données invalides même si le client est compromis.
-- ============================================

