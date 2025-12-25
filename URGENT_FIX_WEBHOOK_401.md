# 🚨 URGENT - Fix Webhook 401 Unauthorized

## 🐛 Problème Actuel

Le webhook Stripe reçoit toujours une erreur **401 "Unauthorized"** même après configuration.

## ✅ Solution Immédiate

### Étape 1 : Vérifier l'URL du Webhook dans Stripe

1. **Allez sur [Stripe Dashboard](https://dashboard.stripe.com)**
2. **Developers** > **Webhooks**
3. **Cliquez sur votre endpoint** (celui qui montre l'erreur 401)
4. **Vérifiez l'URL actuelle** dans "Endpoint URL"

**L'URL DOIT être :**
```
https://ctupecolapegiogvmwxz.supabase.co/functions/v1/stripe-webhook?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0dXBlY29sYXBlZ2lvZ3Ztd3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTY3OTAsImV4cCI6MjA3ODQzMjc5MH0.JCGRTYx0gLTQTQE2e7kvPR1M5H7c-rnQL6ethNBJiy0
```

**Si l'URL ne contient PAS `?apikey=...` :**
1. **Cliquez sur "Edit"** ou le crayon pour modifier
2. **Remplacez l'URL** par celle ci-dessus (avec `?apikey=...`)
3. **Cliquez sur "Save"**

### Étape 2 : Re-déclencher le Webhook

1. **Dans la page du webhook**, cliquez sur le bouton **"Renvoyer"** (Resend)
2. **OU** allez dans **Payments** > Trouvez votre paiement > **Re-send webhook**

### Étape 3 : Vérifier les Logs

1. **Allez sur [Supabase Dashboard](https://app.supabase.com)**
2. **Edge Functions** > **stripe-webhook** > **Logs**
3. **Cherchez les logs récents** après le re-déclenchement

**Logs attendus (succès) :**
```
[stripe-webhook] Webhook received
[stripe-webhook] Stripe signature present: true
[stripe-webhook] checkout.session.completed received
[stripe-webhook] ✅ Subscription activated for user: xxx
```

**Si vous voyez toujours une erreur 401 :**
- Vérifiez que l'URL contient bien `?apikey=...`
- Vérifiez que l'ANON_KEY est correcte (pas expirée)
- Vérifiez que l'Edge Function est bien déployée

### Étape 4 : Vérifier la Base de Données

Dans Supabase SQL Editor :
```sql
SELECT * FROM subscriptions 
WHERE user_id = 'd7360c38-914f-4643-a8fb-f2283bf6bec7'
ORDER BY created_at DESC;
```

Si aucune ligne n'existe, le webhook n'a pas encore fonctionné.

## 🔧 Alternative : Vérifier que l'Edge Function Accepte `apikey`

Si l'URL contient bien `?apikey=...` mais que ça ne fonctionne toujours pas, vérifiez que l'Edge Function est bien déployée :

```bash
cd application
supabase functions deploy stripe-webhook
```

## 📝 Checklist Rapide

- [ ] URL du webhook contient `?apikey=...`
- [ ] Webhook re-déclenché avec "Renvoyer"
- [ ] Logs vérifiés dans Supabase
- [ ] Table `subscriptions` vérifiée
- [ ] Edge Function `stripe-webhook` déployée

## 🚀 Action Immédiate

1. **Modifiez l'URL du webhook** dans Stripe pour inclure `?apikey=...`
2. **Cliquez sur "Renvoyer"** pour re-déclencher
3. **Vérifiez les logs** dans Supabase
4. **Vérifiez la base de données**

Une fois que le webhook fonctionne, tous les futurs paiements seront automatiquement synchronisés ! 🎉


