# 🔍 DIAGNOSTIC - Abonnement Non Activé Après Paiement

## 🐛 Problème

Vous avez payé via Stripe Checkout mais vous n'avez toujours pas accès aux fonctionnalités premium.

## ✅ Checklist de Diagnostic

### 1. Vérifier que le Webhook Stripe est Configuré

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com)
2. Allez dans **Developers** > **Webhooks**
3. Vérifiez qu'il y a un endpoint webhook configuré
4. L'URL doit être : `https://ctupecolapegiogvmwxz.supabase.co/functions/v1/stripe-webhook`
5. Les événements suivants doivent être sélectionnés :
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.deleted`
   - ✅ `customer.subscription.updated`

### 2. Vérifier les Logs du Webhook

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Allez dans **Edge Functions** > **stripe-webhook**
3. Cliquez sur **Logs**
4. Cherchez les logs récents avec `checkout.session.completed`

**Logs attendus :**
```
[stripe-webhook] checkout.session.completed received
[stripe-webhook] Session ID: cs_...
[stripe-webhook] Client reference ID: <votre-user-id>
[stripe-webhook] ✅ Subscription activated for user: <votre-user-id>
```

### 3. Vérifier la Base de Données

Exécutez cette requête SQL dans Supabase SQL Editor :

```sql
SELECT * FROM subscriptions 
WHERE user_id = '<votre-user-id>'
ORDER BY created_at DESC;
```

**Résultat attendu :**
- Une ligne avec `status = 'active'`
- `stripe_subscription_id` non null
- `expires_at` dans le futur

### 4. Vérifier les Logs de l'App

Dans les logs de l'app React Native, cherchez :

```
[SubscriptionGate] Subscription status result: {
  hasSubscription: true,
  subscriptionStatus: 'active',
  isActive: true,
  ...
}
```

## 🔧 Solutions

### Solution 1 : Webhook Non Configuré

Si le webhook n'est pas configuré dans Stripe :

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com)
2. **Developers** > **Webhooks** > **Add endpoint**
3. URL : `https://ctupecolapegiogvmwxz.supabase.co/functions/v1/stripe-webhook`
4. Sélectionnez les événements :
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Copiez le **Signing secret** (commence par `whsec_...`)
6. Configurez-le dans Supabase :
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Solution 2 : Webhook Échoue

Si le webhook est configuré mais échoue :

1. Vérifiez les logs du webhook dans Supabase
2. Cherchez les erreurs :
   - `Missing client_reference_id` → Le `client_reference_id` n'est pas passé dans le checkout
   - `Database error` → Problème avec la table `subscriptions`
   - `Missing subscription ID` → Le checkout n'a pas créé de subscription

### Solution 3 : Vérification Manuelle

Si le webhook a réussi mais l'app ne détecte pas l'abonnement :

1. **Forcer la vérification** : Fermez et rouvrez l'app
2. **Vérifier la session** : Assurez-vous d'être connecté avec Supabase Auth
3. **Vérifier les logs** : Regardez les logs `[SubscriptionGate]` dans l'app

### Solution 4 : Activer Manuellement (Temporaire)

Si le webhook ne fonctionne pas, vous pouvez activer manuellement :

```sql
INSERT INTO subscriptions (user_id, status, source, expires_at)
VALUES (
  '<votre-user-id>',
  'active',
  'web',
  NOW() + INTERVAL '1 month'
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  status = 'active',
  expires_at = NOW() + INTERVAL '1 month';
```

## 🧪 Test du Webhook

Pour tester le webhook manuellement :

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com)
2. **Developers** > **Webhooks** > Votre endpoint
3. Cliquez sur **Send test webhook**
4. Sélectionnez `checkout.session.completed`
5. Vérifiez les logs dans Supabase

## 📝 Logs à Vérifier

### Logs Webhook (Supabase)
```
[stripe-webhook] checkout.session.completed received
[stripe-webhook] User ID from client_reference_id: xxx
[stripe-webhook] ✅ Subscription activated for user: xxx
```

### Logs App (React Native)
```
[SubscriptionGate] Checking subscription status...
[subscription] [getStatus] Response data: {
  hasSubscription: true,
  subscriptionStatus: 'active',
  isActive: true
}
[SubscriptionGate] ✅ Subscription is ACTIVE - user has access
```

## ⚠️ Problèmes Fréquents

### 1. `client_reference_id` Manquant

**Symptôme :** `Missing client_reference_id in checkout session`

**Solution :** Vérifiez que `account-activation-link` passe bien `client_reference_id: user.id`

### 2. Webhook Secret Incorrect

**Symptôme :** `Webhook signature verification failed`

**Solution :** Vérifiez que `STRIPE_WEBHOOK_SECRET` est correct dans Supabase secrets

### 3. Table `subscriptions` Non Créée

**Symptôme :** `Database error: relation "subscriptions" does not exist`

**Solution :** Exécutez la migration SQL :
```bash
cd application
supabase db push
```

### 4. RLS Bloque l'Insertion

**Symptôme :** `Database error: new row violates row-level security policy`

**Solution :** Vérifiez que le webhook utilise `SUPABASE_SERVICE_ROLE_KEY` (pas `ANON_KEY`)

## 🚀 Prochaines Étapes

1. Vérifiez les logs du webhook
2. Vérifiez la base de données
3. Vérifiez les logs de l'app
4. Si tout est correct mais ça ne fonctionne pas, contactez le support


