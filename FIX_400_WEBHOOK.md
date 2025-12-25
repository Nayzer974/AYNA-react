# 🔧 FIX - Erreur 400 Bad Request Webhook Stripe

## 🐛 Problème

Le webhook Stripe reçoit maintenant une erreur **400 "Bad Request"** au lieu de 401. C'est un progrès ! Cela signifie que la vérification JWT est désactivée, mais il y a un problème avec la vérification de la signature Stripe.

## 🔍 Causes Possibles

1. **Signature Stripe invalide** : Le `STRIPE_WEBHOOK_SECRET` ne correspond pas
2. **Body mal formaté** : Le body a été modifié avant la vérification
3. **Webhook secret incorrect** : Le secret dans Supabase ne correspond pas à celui dans Stripe

## ✅ Solution : Vérifier les Logs

### Étape 1 : Vérifier les Logs dans Supabase

1. **Allez sur [Supabase Dashboard](https://app.supabase.com)**
2. **Edge Functions** > **stripe-webhook** > **Logs**
3. **Cherchez les logs récents** avec l'erreur 400

**Logs à chercher :**
```
[stripe-webhook] ❌ Webhook signature verification failed
[stripe-webhook] Error message: ...
```

### Étape 2 : Vérifier le STRIPE_WEBHOOK_SECRET

Le secret doit correspondre exactement à celui dans Stripe Dashboard :

1. **Allez sur [Stripe Dashboard](https://dashboard.stripe.com)**
2. **Developers** > **Webhooks** > Votre endpoint
3. **Cliquez sur "Reveal"** pour voir le Signing secret
4. **Copiez le secret** (commence par `whsec_...`)

5. **Vérifiez dans Supabase :**
   ```bash
   cd application
   supabase secrets list
   ```

6. **Si le secret est différent, mettez-le à jour :**
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Étape 3 : Re-déployer l'Edge Function

```bash
cd application
supabase functions deploy stripe-webhook
```

### Étape 4 : Re-déclencher le Webhook

1. Dans Stripe Dashboard > Webhooks > Votre endpoint
2. Cliquez sur **"Renvoyer"** (Resend)
3. OU allez dans **Payments** > Trouvez votre paiement > **Re-send webhook**

## 🔍 Diagnostic Détaillé

Les logs améliorés vont maintenant afficher :
- Le type d'erreur exact
- Le message d'erreur
- Un aperçu du body et de la signature
- Le statut du secret

Cela permettra d'identifier précisément le problème.

## ✅ Vérification

Après correction, les logs devraient montrer :
```
[stripe-webhook] ✅ Stripe signature verified successfully
[stripe-webhook] Event type: checkout.session.completed
[stripe-webhook] ✅ Subscription activated for user: xxx
```

## 📝 Checklist

- [ ] Logs vérifiés dans Supabase
- [ ] `STRIPE_WEBHOOK_SECRET` vérifié et mis à jour si nécessaire
- [ ] Edge Function re-déployée
- [ ] Webhook re-déclenché
- [ ] Logs montrent "signature verified successfully"
- [ ] Table `subscriptions` mise à jour

---

**Une fois que la signature est vérifiée, l'abonnement sera automatiquement activé !** 🎉


