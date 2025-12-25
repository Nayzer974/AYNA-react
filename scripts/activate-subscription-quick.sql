-- ============================================
-- ACTIVATION RAPIDE D'ABONNEMENT (1 MOIS)
-- ============================================
-- Script simplifié pour activer un abonnement pour 1 mois
-- 
-- REMPLACEZ <USER_ID> par votre user_id
-- Exemple : d7360c38-914f-4643-a8fb-f2283bf6bec7

INSERT INTO subscriptions (
  user_id,
  status,
  source,
  expires_at
)
VALUES (
  'd7360c38-914f-4643-a8fb-f2283bf6bec7'::uuid,  -- ⚠️ REMPLACEZ PAR VOTRE USER_ID
  'active',
  'web',
  NOW() + INTERVAL '1 month'  -- Expire dans 1 mois
)
ON CONFLICT (user_id) 
DO UPDATE SET
  status = 'active',
  expires_at = NOW() + INTERVAL '1 month',
  updated_at = NOW();

-- Vérifier
SELECT * FROM subscriptions WHERE user_id = 'd7360c38-914f-4643-a8fb-f2283bf6bec7'::uuid;


