# 🎯 DÉPLOIEMENT STRIPE - ÉTAPES SIMPLES

Guide visuel étape par étape pour déployer le système d'abonnement.

---

## 📍 ORDRE DES ÉTAPES

```
1. Migration SQL          → Créer la table subscriptions
2. Configurer Stripe      → Créer produit, obtenir clés
3. Configurer Secrets    → Définir les secrets Supabase
4. Déployer Functions    → Déployer les Edge Functions
5. Configurer Webhook    → Configurer le webhook Stripe
6. Tester                → Tester le flux complet
```

---

## ⚡ DÉPLOIEMENT RAPIDE (Script)

```bash
cd application
chmod +x scripts/deploy-stripe-subscription.sh
./scripts/deploy-stripe-subscription.sh
```

---

## 📝 DÉPLOIEMENT MANUEL

### ÉTAPE 1 : Migration SQL

```bash
cd application
supabase db push
```

**Vérification :**
```sql
-- Dans Supabase Dashboard → SQL Editor
SELECT * FROM subscriptions LIMIT 1;
```

---

### ÉTAPE 2 : Configurer Stripe

#### 2.1 Créer Produit & Prix

1. Aller sur https://dashboard.stripe.com
2. **Products** → **Add Product**
3. Remplir les informations
4. **Pricing** → Recurring → Montant
5. **Copier le Price ID** (`price_...`)

#### 2.2 Obtenir les Clés

1. **Developers** → **API keys**
2. **Copier Secret Key** (`sk_test_...` ou `sk_live_...`)
3. **Copier Publishable Key** (`pk_...`)

#### 2.3 Configurer Webhook

1. **Developers** → **Webhooks** → **Add endpoint**
2. **URL** : `https://VOTRE_PROJECT_ID.supabase.co/functions/v1/stripe-webhook`
3. **Events** :
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.deleted`
   - ✅ `customer.subscription.updated`
4. **Copier Signing Secret** (`whsec_...`)

---

### ÉTAPE 3 : Configurer les Secrets Supabase

```bash
# Obtenir votre Project ID
supabase status

# Définir les secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
supabase secrets set STRIPE_PRICE_ID=price_xxxxxxxxxxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
supabase secrets set WEB_BASE_URL=https://votredomaine.com
```

**Vérification :**
```bash
supabase secrets list
```

---

### ÉTAPE 4 : Déployer les Edge Functions

```bash
supabase functions deploy account-activation-link
supabase functions deploy stripe-webhook
supabase functions deploy get-subscription
supabase functions deploy check-subscription
supabase functions deploy llama-proxy-ollama-cloud
```

**Vérification :**
```bash
supabase functions list
```

---

### ÉTAPE 5 : Configurer le Webhook Stripe (Vérification)

1. Aller sur https://dashboard.stripe.com → **Webhooks**
2. Vérifier que l'endpoint est configuré
3. Vérifier que les événements sont sélectionnés
4. **Send test webhook** → `checkout.session.completed`
5. Vérifier les logs dans Supabase Dashboard

---

### ÉTAPE 6 : Tester

#### Test 1 : Activation Link

```bash
curl -X POST \
  https://VOTRE_PROJECT_ID.supabase.co/functions/v1/account-activation-link \
  -H "Authorization: Bearer VOTRE_ANON_KEY" \
  -H "Content-Type: application/json"
```

**Réponse attendue :**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```

#### Test 2 : Checkout

1. Ouvrir l'URL `checkoutUrl` dans un navigateur
2. Utiliser carte de test : `4242 4242 4242 4242`
3. Compléter le paiement
4. Vérifier en base :
   ```sql
   SELECT * FROM subscriptions WHERE status = 'active';
   ```

#### Test 3 : Webhook

1. Stripe Dashboard → **Webhooks** → Votre endpoint
2. **Send test webhook** → `checkout.session.completed`
3. Vérifier les logs Supabase
4. Vérifier que la subscription est créée

---

## ✅ CHECKLIST FINALE

- [ ] Migration SQL appliquée
- [ ] Produit Stripe créé (Price ID copié)
- [ ] Clés API Stripe obtenues
- [ ] Webhook Stripe configuré (Secret copié)
- [ ] Tous les secrets Supabase configurés
- [ ] Toutes les Edge Functions déployées
- [ ] Test checkout réussi
- [ ] Test webhook réussi
- [ ] Subscription créée en base

---

## 🐛 PROBLÈMES COURANTS

### "Stripe configuration missing"
→ Vérifier que tous les secrets sont définis

### "Webhook signature verification failed"
→ Vérifier que `STRIPE_WEBHOOK_SECRET` correspond au secret Stripe

### "Subscription not found" après checkout
→ Vérifier les logs du webhook et que `client_reference_id` est défini

---

## 📚 DOCUMENTATION COMPLÈTE

- **Guide Détaillé** : `GUIDE_DEPLOIEMENT_STRIPE.md`
- **Commandes Rapides** : `COMMANDES_RAPIDES_STRIPE.md`
- **Setup Complet** : `STRIPE_SUBSCRIPTION_SETUP.md`

---

**💡 Astuce :** Utilisez le script automatique pour un déploiement rapide !

```bash
cd application
./scripts/deploy-stripe-subscription.sh
```


