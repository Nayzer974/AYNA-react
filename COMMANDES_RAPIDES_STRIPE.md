# ⚡ COMMANDES RAPIDES - STRIPE SUBSCRIPTION

Guide rapide avec toutes les commandes essentielles.

---

## 🚀 DÉPLOIEMENT COMPLET (Script Automatique)

```bash
cd application
chmod +x scripts/deploy-stripe-subscription.sh
./scripts/deploy-stripe-subscription.sh
```

---

## 📋 COMMANDES MANUELLES

### 1. Migration SQL

```bash
cd application
supabase db push
```

### 2. Configurer les Secrets

```bash
# Stripe Secret Key (test)
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Stripe Price ID
supabase secrets set STRIPE_PRICE_ID=price_xxxxxxxxxxxxx

# Stripe Webhook Secret
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Web Base URL
supabase secrets set WEB_BASE_URL=https://votredomaine.com
```

### 3. Déployer les Edge Functions

```bash
supabase functions deploy account-activation-link
supabase functions deploy stripe-webhook
supabase functions deploy get-subscription
supabase functions deploy check-subscription
supabase functions deploy llama-proxy-ollama-cloud
```

### 4. Vérifier le Déploiement

```bash
# Lister les fonctions
supabase functions list

# Vérifier les secrets (sans afficher les valeurs)
supabase secrets list

# Voir les logs d'une fonction
supabase functions logs stripe-webhook
```

---

## 🧪 TESTS

### Test Activation Link

```bash
curl -X POST \
  https://VOTRE_PROJECT_ID.supabase.co/functions/v1/account-activation-link \
  -H "Authorization: Bearer VOTRE_ANON_KEY" \
  -H "Content-Type: application/json"
```

### Test Subscription Status

```bash
curl -X GET \
  https://VOTRE_PROJECT_ID.supabase.co/functions/v1/get-subscription \
  -H "Authorization: Bearer VOTRE_ANON_KEY"
```

### Vérifier en Base de Données

```sql
-- Voir toutes les subscriptions
SELECT * FROM subscriptions;

-- Voir les subscriptions actives
SELECT * FROM subscriptions WHERE status = 'active';

-- Voir les subscriptions expirant bientôt
SELECT * FROM subscriptions 
WHERE status = 'active' 
AND expires_at < NOW() + INTERVAL '7 days';
```

---

## 🔧 DÉPANNAGE

### Vérifier la Connexion Supabase

```bash
supabase status
```

### Voir les Logs d'une Fonction

```bash
supabase functions logs account-activation-link
supabase functions logs stripe-webhook
```

### Réinitialiser un Secret

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_nouvelle_cle
```

### Redéployer une Fonction

```bash
supabase functions deploy NOM_DE_LA_FONCTION
```

---

## 📝 CHECKLIST RAPIDE

```bash
# ✅ Migration
supabase db push

# ✅ Secrets
supabase secrets set STRIPE_SECRET_KEY=...
supabase secrets set STRIPE_PRICE_ID=...
supabase secrets set STRIPE_WEBHOOK_SECRET=...
supabase secrets set WEB_BASE_URL=...

# ✅ Déploiement
supabase functions deploy account-activation-link
supabase functions deploy stripe-webhook
supabase functions deploy get-subscription
supabase functions deploy check-subscription
supabase functions deploy llama-proxy-ollama-cloud

# ✅ Vérification
supabase functions list
```

---

## 🔗 LIENS UTILES

- **Stripe Dashboard** : https://dashboard.stripe.com
- **Supabase Dashboard** : https://supabase.com/dashboard
- **Guide Complet** : `GUIDE_DEPLOIEMENT_STRIPE.md`


