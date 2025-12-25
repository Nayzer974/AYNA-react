# 🔧 FIX - Webhook Stripe 401 et Activation Manuelle

## 🐛 Problème

Le webhook Stripe reçoit une erreur **401 "Missing authorization header"**, donc la table `subscriptions` n'est jamais mise à jour après le paiement.

**Résultat :** L'utilisateur a payé mais `get-subscription` retourne toujours `hasSubscription: false`.

## ✅ Solution Immédiate : Activation Manuelle

### Option 1 : Script SQL Rapide (1 mois)

1. Allez dans **Supabase Dashboard** > **SQL Editor**
2. Exécutez ce script (remplacez `<USER_ID>` par votre user_id) :

```sql
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
  NOW() + INTERVAL '1 month'
)
ON CONFLICT (user_id) 
DO UPDATE SET
  status = 'active',
  expires_at = NOW() + INTERVAL '1 month',
  updated_at = NOW();
```

3. Vérifiez que ça fonctionne :
```sql
SELECT * FROM subscriptions WHERE user_id = 'd7360c38-914f-4643-a8fb-f2283bf6bec7'::uuid;
```

### Option 2 : Script SQL Complet (avec Stripe IDs)

Si vous avez les IDs Stripe (subscription_id, customer_id) :

```sql
INSERT INTO subscriptions (
  user_id,
  status,
  source,
  stripe_customer_id,
  stripe_subscription_id,
  expires_at
)
VALUES (
  '<USER_ID>'::uuid,
  'active',
  'web',
  '<STRIPE_CUSTOMER_ID>',
  '<STRIPE_SUBSCRIPTION_ID>',
  '<EXPIRES_AT>'::timestamptz
)
ON CONFLICT (user_id) 
DO UPDATE SET
  status = 'active',
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  stripe_subscription_id = EXCLUDED.stripe_subscription_id,
  expires_at = EXCLUDED.expires_at,
  updated_at = NOW();
```

## 🔧 Solution Définitive : Corriger le Webhook

### 1. Configurer le Webhook dans Stripe avec `apikey`

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com)
2. **Developers** > **Webhooks**
3. Cliquez sur votre endpoint (ou créez-en un nouveau)
4. Dans **Endpoint URL**, utilisez :
   ```
   https://ctupecolapegiogvmwxz.supabase.co/functions/v1/stripe-webhook?apikey=VOTRE_ANON_KEY
   ```
   Remplacez `VOTRE_ANON_KEY` par votre clé anon publique (trouvable dans Supabase Dashboard > Settings > API)

5. Sélectionnez les événements :
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.deleted`
   - ✅ `customer.subscription.updated`

6. **Save**

### 2. Tester le Webhook

1. Dans Stripe Dashboard, cliquez sur votre endpoint
2. **Send test webhook** → Sélectionnez `checkout.session.completed`
3. Vérifiez les logs dans Supabase Dashboard → **Edge Functions** → `stripe-webhook`

**Logs attendus :**
```
[stripe-webhook] Webhook received
[stripe-webhook] Stripe signature present: true
[stripe-webhook] checkout.session.completed received
[stripe-webhook] ✅ Subscription activated for user: xxx
```

### 3. Vérifier la Base de Données

Après le test du webhook, vérifiez que l'abonnement a été créé :

```sql
SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 5;
```

## 🧪 Test Complet

### 1. Activer manuellement l'abonnement (Option 1 ci-dessus)

### 2. Vérifier dans l'app

1. Fermez et rouvrez l'app
2. Allez sur une fonctionnalité IA (Chat, Analytics IA)
3. L'abonnement devrait être détecté

### 3. Vérifier les logs

Dans les logs de l'app, vous devriez voir :
```
[subscription] [getStatus] Response data: {
  hasSubscription: true,
  subscriptionStatus: 'active',
  isActive: true,
  expiresAt: '2026-01-17T00:00:00.000Z'
}
```

## 📝 Checklist

- [ ] Abonnement activé manuellement dans la base de données
- [ ] Webhook Stripe configuré avec `apikey` dans l'URL
- [ ] Webhook testé avec "Send test webhook"
- [ ] Logs du webhook vérifiés dans Supabase
- [ ] Table `subscriptions` contient l'entrée pour l'utilisateur
- [ ] App détecte l'abonnement actif

## 🚀 Prochaines Étapes

1. **Immédiat** : Activez manuellement l'abonnement avec le script SQL
2. **Court terme** : Corrigez le webhook Stripe avec `apikey` dans l'URL
3. **Long terme** : Testez le flux complet (paiement → webhook → activation automatique)

---

**Note :** L'activation manuelle est une solution temporaire. Une fois le webhook corrigé, les futurs paiements seront automatiquement synchronisés.


