# 🔧 FIX - Erreur 401 "Missing authorization header" sur Webhook Stripe

## 🐛 Problème

Le webhook Stripe reçoit une erreur **401 "Missing authorization header"** dans Stripe Dashboard.

## 🔍 Cause

Supabase Edge Functions nécessitent généralement un header `Authorization` ou `apikey` pour les requêtes. Cependant, **les webhooks Stripe n'envoient PAS ces headers** - ils utilisent uniquement la signature Stripe (`stripe-signature`) pour la sécurité.

## ✅ Solution

### Option 1 : Configurer le Webhook avec l'URL + apikey (RECOMMANDÉ)

Dans Stripe Dashboard, configurez l'URL du webhook avec le paramètre `apikey` :

```
https://ctupecolapegiogvmwxz.supabase.co/functions/v1/stripe-webhook?apikey=VOTRE_ANON_KEY
```

**⚠️ ATTENTION :** Cette méthode expose votre `ANON_KEY` dans l'URL. C'est acceptable car :
- L'`ANON_KEY` est déjà publique (utilisée côté client)
- La sécurité réelle vient de la vérification de la signature Stripe
- L'Edge Function vérifie toujours la signature Stripe avant de traiter l'événement

### Option 2 : Utiliser un Endpoint Public (ALTERNATIVE)

Si l'Option 1 ne fonctionne pas, vous pouvez créer un endpoint public qui accepte les requêtes sans authentification, mais cette option nécessite des modifications supplémentaires.

## 📝 Étapes pour Corriger

### 1. Obtenir votre ANON_KEY

```bash
cd application
supabase status
```

Ou dans Supabase Dashboard :
- **Settings** > **API** > **Project API keys** > **anon public**

### 2. Configurer le Webhook dans Stripe

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com)
2. **Developers** > **Webhooks**
3. Cliquez sur votre endpoint webhook (ou créez-en un nouveau)
4. Dans **Endpoint URL**, utilisez :
   ```
   https://ctupecolapegiogvmwxz.supabase.co/functions/v1/stripe-webhook?apikey=VOTRE_ANON_KEY
   ```
   Remplacez `VOTRE_ANON_KEY` par votre clé anon publique

5. Sélectionnez les événements :
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.deleted`
   - ✅ `customer.subscription.updated`

6. **Save**

### 3. Tester le Webhook

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

## 🔒 Sécurité

Même avec `apikey` dans l'URL, la sécurité est garantie par :

1. **Vérification de la signature Stripe** : L'Edge Function vérifie toujours la signature Stripe avant de traiter l'événement
2. **Utilisation de SERVICE_ROLE_KEY** : L'Edge Function utilise `SUPABASE_SERVICE_ROLE_KEY` pour les opérations de base de données (pas l'ANON_KEY)
3. **RLS toujours actif** : Les politiques RLS sont toujours en place

## 🧪 Vérification

Après avoir configuré le webhook avec `apikey` :

1. Faites un nouveau paiement test
2. Vérifiez les logs du webhook dans Supabase
3. Vérifiez que l'abonnement est créé dans la base de données :
   ```sql
   SELECT * FROM subscriptions 
   WHERE user_id = '<votre-user-id>'
   ORDER BY created_at DESC;
   ```

## ⚠️ Note Importante

Si vous utilisez l'Option 1 (URL avec `apikey`), assurez-vous de :
- Ne jamais partager votre `SERVICE_ROLE_KEY` publiquement
- Garder votre `ANON_KEY` dans l'URL du webhook (c'est acceptable car elle est déjà publique)
- Toujours vérifier la signature Stripe dans l'Edge Function (déjà fait)

## 🚀 Prochaines Étapes

1. Configurez le webhook avec `apikey` dans l'URL
2. Testez avec un webhook test depuis Stripe
3. Faites un nouveau paiement test
4. Vérifiez que l'abonnement est activé


