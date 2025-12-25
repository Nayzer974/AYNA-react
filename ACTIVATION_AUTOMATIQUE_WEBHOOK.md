# 🔄 ACTIVATION AUTOMATIQUE - Configuration Webhook Stripe

## 🎯 Objectif

Configurer le webhook Stripe pour que les abonnements soient **automatiquement activés** après paiement, sans intervention manuelle.

## 🔧 Solution : Configurer le Webhook avec `apikey`

### Étape 1 : Obtenir votre ANON_KEY

Votre ANON_KEY est déjà dans votre `.env` :
```
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0dXBlY29sYXBlZ2lvZ3Ztd3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTY3OTAsImV4cCI6MjA3ODQzMjc5MH0.JCGRTYx0gLTQTQE2e7kvPR1M5H7c-rnQL6ethNBJiy0
```

### Étape 2 : Configurer le Webhook dans Stripe Dashboard

1. **Allez sur [Stripe Dashboard](https://dashboard.stripe.com)**
2. **Developers** > **Webhooks**
3. **Cliquez sur votre endpoint existant** (ou créez-en un nouveau avec **+ Add endpoint**)

4. **Dans "Endpoint URL", remplacez par :**
   ```
   https://ctupecolapegiogvmwxz.supabase.co/functions/v1/stripe-webhook?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0dXBlY29sYXBlZ2lvZ3Ztd3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTY3OTAsImV4cCI6MjA3ODQzMjc5MH0.JCGRTYx0gLTQTQE2e7kvPR1M5H7c-rnQL6ethNBJiy0
   ```

5. **Sélectionnez les événements :**
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.deleted`
   - ✅ `customer.subscription.updated`

6. **Cliquez sur "Save"**

### Étape 3 : Tester le Webhook

1. **Dans Stripe Dashboard**, cliquez sur votre endpoint webhook
2. **Cliquez sur "Send test webhook"**
3. **Sélectionnez `checkout.session.completed`**
4. **Cliquez sur "Send test webhook"**

### Étape 4 : Vérifier les Logs

1. **Allez sur [Supabase Dashboard](https://app.supabase.com)**
2. **Edge Functions** > **stripe-webhook** > **Logs**
3. **Cherchez les logs récents**

**Logs attendus (succès) :**
```
[stripe-webhook] Webhook received
[stripe-webhook] Stripe signature present: true
[stripe-webhook] checkout.session.completed received
[stripe-webhook] User ID from client_reference_id: d7360c38-914f-4643-a8fb-f2283bf6bec7
[stripe-webhook] ✅ Subscription activated for user: d7360c38-914f-4643-a8fb-f2283bf6bec7
```

**Si vous voyez une erreur 401 :**
- Vérifiez que l'URL contient bien `?apikey=...`
- Vérifiez que l'ANON_KEY est correcte
- Réessayez

### Étape 5 : Re-déclencher le Webhook pour le Paiement Existant

Si vous avez déjà payé mais que le webhook n'a pas fonctionné :

1. **Dans Stripe Dashboard**, allez dans **Payments**
2. **Trouvez votre paiement récent**
3. **Cliquez sur le paiement**
4. **Notez le `Session ID`** (commence par `cs_`)
5. **Allez dans Developers** > **Webhooks** > Votre endpoint
6. **Cliquez sur "Send test webhook"**
7. **Sélectionnez `checkout.session.completed`**
8. **Dans "Test webhook", entrez le Session ID de votre paiement**
9. **Cliquez sur "Send test webhook"**

**OU** utilisez l'API Stripe pour re-déclencher :

```bash
# Via Stripe CLI (si installé)
stripe events resend evt_xxxxx
```

## ✅ Vérification Finale

### 1. Vérifier la Base de Données

Dans Supabase SQL Editor :
```sql
SELECT * FROM subscriptions 
WHERE user_id = 'd7360c38-914f-4643-a8fb-f2283bf6bec7'
ORDER BY created_at DESC;
```

Vous devriez voir une ligne avec :
- `status = 'active'`
- `stripe_subscription_id` non null
- `expires_at` dans le futur

### 2. Vérifier dans l'App

1. **Fermez et rouvrez l'app**
2. **Allez sur Chat ou Analytics IA**
3. **L'abonnement devrait être détecté automatiquement**

### 3. Vérifier les Logs de l'App

Dans les logs React Native, vous devriez voir :
```
[subscription] [getStatus] Response data: {
  hasSubscription: true,
  subscriptionStatus: 'active',
  isActive: true,
  expiresAt: '2026-01-17T00:00:00.000Z'
}
```

## 🔄 Flux Automatique Complet

Une fois configuré, le flux sera :

1. **Utilisateur clique "Activer mon compte"** → Ouvre Stripe Checkout
2. **Utilisateur paie** → Stripe crée la session
3. **Stripe envoie webhook** → `checkout.session.completed`
4. **Edge Function `stripe-webhook`** → Met à jour la table `subscriptions`
5. **App vérifie le statut** → `get-subscription` retourne `isActive: true`
6. **Fonctionnalités IA débloquées** → Automatiquement

## 🐛 Dépannage

### Erreur 401 persistante

1. Vérifiez que l'URL contient bien `?apikey=...`
2. Vérifiez que l'ANON_KEY est correcte (pas expirée)
3. Vérifiez les logs du webhook dans Supabase

### Webhook ne se déclenche pas

1. Vérifiez que les événements sont bien sélectionnés dans Stripe
2. Vérifiez que l'URL du webhook est correcte
3. Testez avec "Send test webhook"

### Abonnement créé mais pas détecté

1. Vérifiez que `user_id` dans `subscriptions` correspond à votre user_id
2. Vérifiez que `status = 'active'`
3. Vérifiez que `expires_at` est dans le futur
4. Fermez et rouvrez l'app pour forcer la vérification

## 📝 Checklist

- [ ] Webhook configuré avec `apikey` dans l'URL
- [ ] Événements sélectionnés (`checkout.session.completed`, etc.)
- [ ] Webhook testé avec "Send test webhook"
- [ ] Logs du webhook vérifiés dans Supabase
- [ ] Table `subscriptions` contient l'entrée
- [ ] App détecte l'abonnement actif

---

**Une fois configuré, tous les futurs paiements seront automatiquement synchronisés !** 🎉


