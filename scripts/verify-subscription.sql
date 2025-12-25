-- Vérifier que l'abonnement a été créé pour l'utilisateur
-- User ID: d7360c38-914f-4643-a8fb-f2283bf6bec7
-- Subscription ID Stripe: sub_1Sf8aDGl8hvmFTV7IuvDkfIy

SELECT 
  id,
  user_id,
  status,
  source,
  stripe_customer_id,
  stripe_subscription_id,
  expires_at,
  created_at,
  updated_at,
  -- Vérifier si l'abonnement est actif
  CASE 
    WHEN status = 'active' AND expires_at > NOW() THEN 'ACTIF ✅'
    WHEN status = 'active' AND expires_at <= NOW() THEN 'EXPIRÉ ⚠️'
    ELSE 'INACTIF ❌'
  END as statut_abonnement
FROM subscriptions 
WHERE user_id = 'd7360c38-914f-4643-a8fb-f2283bf6bec7'::uuid
ORDER BY created_at DESC;

-- Vérifier toutes les subscriptions récentes
SELECT 
  user_id,
  status,
  stripe_subscription_id,
  expires_at,
  created_at
FROM subscriptions 
ORDER BY created_at DESC
LIMIT 10;


