# 🔧 FIX FINAL - Erreur 401 Webhook Stripe

## 🐛 Problème

Même avec `apikey` dans l'URL, Supabase retourne toujours **401 Unauthorized** pour le webhook Stripe.

## 🔍 Cause

Supabase Edge Functions nécessitent **toujours** un header `apikey` ou `Authorization`, même si le paramètre `apikey` est dans l'URL. Cependant, **Stripe ne peut pas envoyer de headers personnalisés**.

## ✅ Solution : Vérifier la Signature Stripe AVANT l'Auth Supabase

La solution est de modifier l'Edge Function pour qu'elle :
1. **Vérifie d'abord la signature Stripe** (c'est notre authentification)
2. **Si la signature est valide**, on accepte la requête même sans header Supabase
3. **Utilise SERVICE_ROLE_KEY** pour les opérations de base de données (bypass RLS)

## 🔧 Modification de l'Edge Function

J'ai modifié `stripe-webhook/index.ts` pour :
- ✅ Vérifier la signature Stripe **en premier**
- ✅ Accepter les requêtes avec signature Stripe valide **sans** header Supabase
- ✅ Utiliser `SERVICE_ROLE_KEY` pour bypasser l'authentification Supabase

## 📝 Étapes pour Corriger

### 1. Re-déployer l'Edge Function

```bash
cd application
supabase functions deploy stripe-webhook
```

### 2. Vérifier que l'URL du Webhook est Correcte

Dans Stripe Dashboard, l'URL doit être :
```
https://ctupecolapegiogvmwxz.supabase.co/functions/v1/stripe-webhook?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0dXBlY29sYXBlZ2lvZ3Ztd3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTY3OTAsImV4cCI6MjA3ODQzMjc5MH0.JCGRTYx0gLTQTQE2e7kvPR1M5H7c-rnQL6ethNBJiy0
```

**Note :** Même si le paramètre `apikey` ne fonctionne pas pour l'auth, on le garde pour éviter d'autres erreurs.

### 3. Re-déclencher le Webhook

1. Dans Stripe Dashboard > Webhooks > Votre endpoint
2. Cliquez sur **"Renvoyer"** (Resend)
3. OU allez dans **Payments** > Trouvez votre paiement > **Re-send webhook**

### 4. Vérifier les Logs

Dans Supabase Dashboard > Edge Functions > stripe-webhook > Logs :

**Logs attendus (succès) :**
```
[stripe-webhook] Webhook received
[stripe-webhook] Stripe signature present: true
[stripe-webhook] ✅ Stripe signature verified successfully
[stripe-webhook] Event type: checkout.session.completed
[stripe-webhook] ✅ Subscription activated for user: xxx
```

**Si vous voyez toujours 401 :**
- Vérifiez que l'Edge Function est bien déployée
- Vérifiez que `STRIPE_WEBHOOK_SECRET` est configuré dans Supabase Secrets
- Vérifiez les logs pour voir où ça bloque

## 🔒 Sécurité

Même sans header Supabase, la sécurité est garantie par :
1. **Vérification de la signature Stripe** : Seul Stripe peut générer une signature valide
2. **Utilisation de SERVICE_ROLE_KEY** : Bypass RLS uniquement pour les opérations webhook
3. **Validation stricte des événements** : Seuls les événements Stripe valides sont traités

## ✅ Vérification Finale

### 1. Vérifier la Base de Données

```sql
SELECT * FROM subscriptions 
WHERE user_id = 'd7360c38-914f-4643-a8fb-f2283bf6bec7'
ORDER BY created_at DESC;
```

### 2. Vérifier dans l'App

1. Fermez et rouvrez l'app
2. Allez sur Chat ou Analytics IA
3. L'abonnement devrait être détecté

## 🚀 Prochaines Étapes

1. **Re-déployer** l'Edge Function `stripe-webhook`
2. **Re-déclencher** le webhook dans Stripe
3. **Vérifier** les logs dans Supabase
4. **Tester** dans l'app

Une fois que ça fonctionne, tous les futurs paiements seront automatiquement synchronisés ! 🎉


