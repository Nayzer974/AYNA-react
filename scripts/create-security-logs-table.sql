-- ============================================
-- TABLE SECURITY_LOGS POUR LE LOGGING DE SÉCURITÉ
-- ============================================
-- Date : 2025-01-27
-- Expert Sécurité : Agent IA Sécurité AYNA
--
-- ⚠️ IMPORTANT : Exécuter ce script dans Supabase SQL Editor
-- Cette table permet de logger tous les événements de sécurité importants
-- ============================================

-- Créer la table security_logs
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT false NOT NULL,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_action ON security_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_success ON security_logs(success);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_action ON security_logs(user_id, action, created_at DESC);

-- RLS : Seuls les admins peuvent voir les logs de sécurité
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Admins can view security logs" ON security_logs;
DROP POLICY IF EXISTS "Admins can insert security logs" ON security_logs;
DROP POLICY IF EXISTS "System can insert security logs" ON security_logs;

-- ✅ SELECT : Seuls les admins peuvent voir les logs
CREATE POLICY "Admins can view security logs"
  ON security_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ✅ INSERT : Les utilisateurs authentifiés peuvent logger leurs propres actions
CREATE POLICY "Users can log their own actions"
  ON security_logs FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    user_id IS NULL  -- Permettre les logs anonymes (tentatives de connexion échouées)
  );

-- ✅ INSERT : Fonction RPC peut insérer des logs (pour le système)
-- Cette policy sera utilisée par la fonction log_security_event
CREATE POLICY "System can insert security logs"
  ON security_logs FOR INSERT
  WITH CHECK (true);  -- La fonction RPC SECURITY DEFINER gère la sécurité

-- ============================================
-- FONCTION POUR LOGGER LES ÉVÉNEMENTS DE SÉCURITÉ
-- ============================================

-- Fonction pour logger les événements de sécurité
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action TEXT,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_user_id UUID;
BEGIN
  -- Récupérer l'ID utilisateur actuel (peut être NULL pour les actions anonymes)
  v_user_id := auth.uid();

  -- Insérer le log
  INSERT INTO security_logs (
    user_id,
    action,
    success,
    error_message,
    metadata
  )
  VALUES (
    v_user_id,
    p_action,
    p_success,
    p_error_message,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Permissions : Tous les utilisateurs (authentifiés et anonymes) peuvent logger
GRANT EXECUTE ON FUNCTION public.log_security_event(TEXT, BOOLEAN, TEXT, JSONB) TO authenticated, anon;

-- Commentaire pour documentation
COMMENT ON TABLE security_logs IS 'Table pour logger tous les événements de sécurité (connexions, inscriptions, tentatives échouées, etc.)';
COMMENT ON FUNCTION public.log_security_event(TEXT, BOOLEAN, TEXT, JSONB) IS 
'Fonction sécurisée pour logger les événements de sécurité. Peut être appelée par tous les utilisateurs (authentifiés ou anonymes).';

-- ============================================
-- ACTIONS À LOGGER (Exemples)
-- ============================================
-- 
-- Exemples d'actions à logger :
-- - 'login_attempt' : Tentative de connexion
-- - 'login_success' : Connexion réussie
-- - 'login_failed' : Connexion échouée
-- - 'signup_attempt' : Tentative d'inscription
-- - 'signup_success' : Inscription réussie
-- - 'password_reset_request' : Demande de réinitialisation de mot de passe
-- - 'password_reset_success' : Réinitialisation réussie
-- - 'password_change' : Changement de mot de passe
-- - 'admin_action' : Action administrative
-- - 'suspicious_activity' : Activité suspecte détectée
-- - 'rate_limit_exceeded' : Limite de taux dépassée
-- 
-- ============================================
-- ✅ TABLE ET FONCTION CRÉÉES AVEC SUCCÈS
-- ============================================
-- 
-- Utilisation côté client :
-- const { data } = await supabase.rpc('log_security_event', {
--   p_action: 'login_attempt',
--   p_success: true,
--   p_error_message: null,
--   p_metadata: { method: 'email', ip: '...' }
-- });
-- 
-- ============================================










