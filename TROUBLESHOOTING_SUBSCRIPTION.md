# 🔧 DÉPANNAGE - SYSTÈME D'ABONNEMENT

Guide de dépannage pour les erreurs du système d'abonnement.

---

## ❌ ERREUR : "Edge Function returned a non-2xx status code"

Cette erreur indique que les Edge Functions ne sont pas correctement déployées ou configurées.

### 🔍 DIAGNOSTIC

#### 1. Vérifier que les Edge Functions sont déployées

```bash
cd application
supabase functions list
```

Vous devriez voir :
- ✅ `account-activation-link`
- ✅ `get-subscription`
- ✅ `stripe-webhook`
- ✅ `check-subscription`

Si une fonction est manquante, déployez-la :

```bash
supabase functions deploy account-activation-link
supabase functions deploy get-subscription
```

---

#### 2. Vérifier les secrets Supabase

```bash
supabase secrets list
```

Vous devez avoir :
- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_PRICE_ID`
- ✅ `STRIPE_WEBHOOK_SECRET`
- ✅ `WEB_BASE_URL`

Si un secret est manquant, configurez-le :

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_PRICE_ID=price_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set WEB_BASE_URL=https://votredomaine.com
```

---

#### 3. Vérifier les logs des Edge Functions

```bash
# Logs de account-activation-link
supabase functions logs account-activation-link --limit 10

# Logs de get-subscription
supabase functions logs get-subscription --limit 10
```

**Erreurs courantes :**

- **"Stripe configuration missing"**
  → Les secrets Stripe ne sont pas configurés
  
- **"Unauthorized"**
  → L'utilisateur n'est pas authentifié
  
- **"Method not allowed"**
  → La méthode HTTP est incorrecte (doit être POST pour account-activation-link, GET pour get-subscription)

---

#### 4. Vérifier la migration SQL

```bash
# Vérifier que la table subscriptions existe
supabase db diff
```

Ou via Supabase Dashboard → SQL Editor :

```sql
SELECT * FROM subscriptions LIMIT 1;
```

Si la table n'existe pas, appliquez la migration :

```bash
supabase db push
```

---

#### 5. Vérifier l'authentification

L'utilisateur doit être connecté pour utiliser les Edge Functions.

**Dans l'app :**
- Vérifier que l'utilisateur est bien connecté
- Vérifier que le token d'authentification est valide

**Test manuel :**

```bash
# Obtenir le token d'authentification
# (via Supabase Dashboard → Authentication → Users → Select user → Copy JWT token)

curl -X POST \
  https://VOTRE_PROJECT_ID.supabase.co/functions/v1/account-activation-link \
  -H "Authorization: Bearer VOTRE_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 🔧 SOLUTIONS PAR ERREUR

### Erreur : "Server configuration error"

**Cause :** Les secrets Stripe ne sont pas configurés.

**Solution :**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_PRICE_ID=price_...
```

---

### Erreur : "Unauthorized"

**Cause :** L'utilisateur n'est pas authentifié ou le token est invalide.

**Solution :**
1. Vérifier que l'utilisateur est connecté dans l'app
2. Se déconnecter et se reconnecter
3. Vérifier que le token d'authentification est valide

---

### Erreur : "Failed to create activation link"

**Cause :** Erreur lors de la création de la session Stripe.

**Solution :**
1. Vérifier les logs de l'Edge Function :
   ```bash
   supabase functions logs account-activation-link --limit 20
   ```
2. Vérifier que le `STRIPE_PRICE_ID` est correct
3. Vérifier que le compte Stripe est actif

---

### Erreur : "No checkout URL returned"

**Cause :** Stripe n'a pas retourné d'URL de checkout.

**Solution :**
1. Vérifier les logs Stripe dans le Dashboard
2. Vérifier que le `STRIPE_PRICE_ID` correspond à un prix actif
3. Vérifier que le mode Stripe correspond (test vs live)

---

## 🧪 TESTS

### Test 1 : Vérifier get-subscription

```bash
# Via curl (remplacer YOUR_JWT_TOKEN et YOUR_PROJECT_ID)
curl -X GET \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/get-subscription \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Réponse attendue :**
```json
{
  "subscription": null,
  "isActive": false
}
```

---

### Test 2 : Vérifier account-activation-link

```bash
# Via curl (remplacer YOUR_JWT_TOKEN et YOUR_PROJECT_ID)
curl -X POST \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/account-activation-link \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Réponse attendue :**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_..."
}
```

---

## 📝 CHECKLIST DE DÉPANNAGE

- [ ] Les Edge Functions sont déployées (`supabase functions list`)
- [ ] Les secrets sont configurés (`supabase secrets list`)
- [ ] La migration SQL est appliquée (table `subscriptions` existe)
- [ ] L'utilisateur est authentifié
- [ ] Les logs des Edge Functions ne montrent pas d'erreurs
- [ ] Le `STRIPE_PRICE_ID` est correct et actif
- [ ] Le compte Stripe est actif

---

## 🔗 RESSOURCES

- **Supabase Dashboard** : https://supabase.com/dashboard
- **Stripe Dashboard** : https://dashboard.stripe.com
- **Guide de déploiement** : `GUIDE_DEPLOIEMENT_STRIPE.md`

---

**Dernière mise à jour :** 2025-01-27


