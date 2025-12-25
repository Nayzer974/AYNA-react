# ✅ SOLUTION FINALE - Erreur 401 Webhook Stripe

## 🎯 Solution : Désactiver la Vérification JWT

Le problème est que **Supabase vérifie les JWT AVANT** que votre code Edge Function ne s'exécute. Même avec `apikey` dans l'URL, Supabase bloque la requête.

**Solution officielle Supabase :** Créer un fichier `config.toml` pour désactiver la vérification JWT pour cette fonction spécifique.

## 🔧 Étapes pour Corriger

### Étape 1 : Créer le fichier `config.toml`

J'ai créé le fichier `supabase/config.toml` avec :

```toml
[functions.stripe-webhook]
verify_jwt = false
```

Ce fichier indique à Supabase de **ne pas vérifier les JWT** pour la fonction `stripe-webhook`.

### Étape 2 : Re-déployer l'Edge Function

```bash
cd application
supabase functions deploy stripe-webhook
```

**Important :** Le fichier `config.toml` doit être dans le répertoire `supabase/` à la racine du projet.

### Étape 3 : Vérifier l'URL du Webhook dans Stripe

Dans Stripe Dashboard, l'URL doit être :
```
https://ctupecolapegiogvmwxz.supabase.co/functions/v1/stripe-webhook
```

**Note :** Vous n'avez plus besoin de `?apikey=...` car la vérification JWT est désactivée.

### Étape 4 : Re-déclencher le Webhook

1. Dans Stripe Dashboard > Webhooks > Votre endpoint
2. Cliquez sur **"Renvoyer"** (Resend)
3. OU allez dans **Payments** > Trouvez votre paiement > **Re-send webhook**

### Étape 5 : Vérifier les Logs

Dans Supabase Dashboard > Edge Functions > stripe-webhook > Logs :

**Logs attendus (succès) :**
```
[stripe-webhook] Webhook received
[stripe-webhook] Stripe signature present: true
[stripe-webhook] ✅ Stripe signature verified successfully
[stripe-webhook] Event type: checkout.session.completed
[stripe-webhook] ✅ Subscription activated for user: xxx
```

## 🔒 Sécurité

Même sans vérification JWT, la sécurité est garantie par :

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

## 📝 Checklist

- [ ] Fichier `supabase/config.toml` créé avec `verify_jwt = false`
- [ ] Edge Function `stripe-webhook` re-déployée
- [ ] URL du webhook dans Stripe (sans `?apikey=...`)
- [ ] Webhook re-déclenché avec "Renvoyer"
- [ ] Logs vérifiés dans Supabase
- [ ] Table `subscriptions` vérifiée
- [ ] App détecte l'abonnement actif

## 🚀 Prochaines Étapes

1. **Re-déployer** l'Edge Function avec `config.toml`
2. **Modifier l'URL** du webhook dans Stripe (enlever `?apikey=...`)
3. **Re-déclencher** le webhook
4. **Vérifier** les logs et la base de données

Une fois que ça fonctionne, tous les futurs paiements seront automatiquement synchronisés ! 🎉


