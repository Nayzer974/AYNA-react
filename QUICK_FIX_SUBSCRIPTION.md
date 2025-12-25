# ⚡ CORRECTION RAPIDE - ERREUR SUBSCRIPTION

## 🔍 DIAGNOSTIC

L'erreur `Edge Function returned a non-2xx status code` indique que les Edge Functions sont déployées mais retournent une erreur.

## ✅ VÉRIFICATIONS

### 1. Les Edge Functions sont déployées ✅

D'après la vérification, les fonctions suivantes sont ACTIVES :
- ✅ `account-activation-link` (ACTIVE)
- ✅ `get-subscription` (ACTIVE)
- ✅ `stripe-webhook` (ACTIVE)
- ✅ `check-subscription` (ACTIVE)

### 2. Vérifier les secrets Supabase

```bash
cd application
supabase secrets list
```

Vous devez avoir :
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `WEB_BASE_URL`

### 3. Vérifier les logs

```bash
# Logs de get-subscription
supabase functions logs get-subscription --limit 10

# Logs de account-activation-link
supabase functions logs account-activation-link --limit 10
```

## 🔧 SOLUTIONS

### Solution 1 : Secrets manquants

Si les secrets ne sont pas configurés, configurez-les :

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_PRICE_ID=price_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set WEB_BASE_URL=https://nurayna.com
```

### Solution 2 : Erreur d'authentification

Si l'erreur est `401 Unauthorized`, vérifiez que :
1. L'utilisateur est bien connecté dans l'app
2. Le token d'authentification est valide

### Solution 3 : Erreur de configuration Stripe

Si l'erreur est `500 Server configuration error`, vérifiez que :
1. Le `STRIPE_PRICE_ID` est correct et actif dans Stripe
2. Le `STRIPE_SECRET_KEY` correspond au bon mode (test vs live)
3. Le compte Stripe est actif

## 📝 AMÉLIORATIONS APPORTÉES

J'ai amélioré la gestion d'erreur dans `subscription.ts` pour :
- ✅ Capturer le code de statut HTTP
- ✅ Afficher des messages d'erreur plus clairs
- ✅ Détecter si les fonctions ne sont pas déployées
- ✅ Logger les détails complets de l'erreur

## 🧪 TEST

Testez maintenant dans l'app. Les erreurs devraient être plus claires et indiquer :
- Le code de statut HTTP (401, 404, 500, etc.)
- Le message d'erreur détaillé
- Les instructions pour corriger le problème

---

**Dernière mise à jour :** 2025-01-27


