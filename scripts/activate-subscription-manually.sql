-- ============================================
-- SCRIPT D'ACTIVATION MANUELLE D'ABONNEMENT
-- ============================================
-- Utilisez ce script pour activer manuellement un abonnement
-- si le webhook Stripe n'a pas fonctionné
--
-- REMPLACEZ :
-- - <USER_ID> par l'ID de l'utilisateur (ex: d7360c38-914f-4643-a8fb-f2283bf6bec7)
-- - <STRIPE_SUBSCRIPTION_ID> par l'ID de la subscription Stripe (ex: sub_xxxxx)
-- - <STRIPE_CUSTOMER_ID> par l'ID du customer Stripe (ex: cus_xxxxx)
-- - <EXPIRES_AT> par la date d'expiration (ex: '2026-01-17 00:00:00+00')

-- Exemple d'utilisation :
-- 1. Trouvez votre user_id dans Supabase Dashboard > Authentication > Users
-- 2. Trouvez votre subscription_id dans Stripe Dashboard > Customers > Subscriptions
-- 3. Exécutez ce script dans Supabase SQL Editor

INSERT INTO subscriptions (
  user_id,
  status,
  source,
  stripe_customer_id,
  stripe_subscription_id,
  expires_at
)
VALUES (
  '<USER_ID>'::uuid,  -- Remplacez par votre user_id
  'active',
  'web',
  '<STRIPE_CUSTOMER_ID>',  -- Optionnel : ID du customer Stripe
  '<STRIPE_SUBSCRIPTION_ID>',  -- ID de la subscription Stripe
  '<EXPIRES_AT>'::timestamptz  -- Date d'expiration (ex: NOW() + INTERVAL '1 month')
)
ON CONFLICT (user_id) 
DO UPDATE SET
  status = 'active',
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  stripe_subscription_id = EXCLUDED.stripe_subscription_id,
  expires_at = EXCLUDED.expires_at,
  updated_at = NOW();

-- Vérifier que l'abonnement a été créé
SELECT 
  id,
  user_id,
  status,
  stripe_subscription_id,
  expires_at,
  created_at,
  updated_at
FROM subscriptions
WHERE user_id = '<USER_ID>'::uuid;


