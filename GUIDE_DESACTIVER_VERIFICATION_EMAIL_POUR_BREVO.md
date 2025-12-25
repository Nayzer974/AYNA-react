# 🔧 Guide : Désactiver la vérification d'email pour utiliser Brevo

## 📋 Problème

Quand Brevo est activé, Supabase essaie quand même d'envoyer l'email automatiquement et échoue avec "Error sending confirmation email". Même si on ignore l'erreur, l'utilisateur n'est pas créé correctement.

## ✅ Solution : Désactiver la vérification d'email dans Supabase Dashboard

**⚠️ IMPORTANT : Cette configuration est temporaire pour les tests. En production, vous pouvez réactiver la vérification d'email et utiliser uniquement Brevo.**

### Étape 1 : Accéder à Sign In / Providers

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Authentication** dans le menu de gauche
4. Dans la section **CONFIGURATION**, cliquez sur **Sign In / Providers**

### Étape 2 : Trouver l'option Email

1. Dans la page **Sign In / Providers**, vous verrez plusieurs onglets ou sections en haut :
   - **Providers** (pour Google, Apple, etc.)
   - **Email** (c'est ici qu'il faut aller)

2. Cliquez sur l'onglet **Email** (ou cherchez la section **Email Auth**)

3. Vous devriez voir plusieurs options :
   - ✅ **Enable sign ups** (doit être activé)
   - ⚠️ **Enable email confirmations** (c'est celle-ci qu'il faut désactiver)
   - **Secure email change** (optionnel)

### Étape 3 : Désactiver la vérification d'email

1. Trouvez le toggle ou la case à cocher **"Enable email confirmations"**
2. **Désactivez** cette option (mettez le toggle sur OFF ou décochez la case)
3. Cliquez sur **Save** (ou le bouton de sauvegarde en bas de la page)
4. **Attendez 1-2 minutes** pour que les changements prennent effet

### Étape 3 : Vérifier les autres paramètres

Assurez-vous que :
- ✅ **"Enable sign ups"** est activé (dans la section Email)
- ✅ **"Enable email confirmations"** est **désactivé** (pour utiliser Brevo)
- ✅ **"Secure email change"** peut rester activé (optionnel)

### Alternative : Si vous ne trouvez pas l'option

Si l'option n'est pas visible dans **Sign In / Providers**, elle peut être dans :
- **URL Configuration** : Vérifiez les paramètres de redirection
- **Policies** : Vérifiez les politiques RLS qui pourraient bloquer les utilisateurs non vérifiés

## 🎯 Résultat attendu

Après avoir désactivé la vérification d'email :

1. ✅ L'inscription créera l'utilisateur sans erreur
2. ✅ L'email sera envoyé via Brevo (Edge Function)
3. ✅ L'utilisateur pourra se connecter immédiatement
4. ✅ L'utilisateur pourra vérifier son email plus tard via le bouton dans Settings

## 📝 Notes

- **Pourquoi désactiver ?** : Supabase essaie d'envoyer l'email automatiquement même si Brevo est activé, ce qui cause une erreur. En désactivant la vérification d'email, Supabase ne tentera plus d'envoyer l'email automatiquement.

- **Sécurité** : Même si la vérification d'email est désactivée dans Supabase, vous pouvez toujours :
  - Envoyer les emails via Brevo
  - Demander aux utilisateurs de vérifier leur email via le bouton dans Settings
  - Vérifier manuellement les emails dans Supabase Dashboard

## 🔄 Réactiver la vérification d'email (optionnel)

Si vous voulez réactiver la vérification d'email plus tard :

1. Retournez dans **Authentication** > **Settings**
2. **Activez** l'option **"Enable email confirmations"**
3. Les nouveaux utilisateurs devront vérifier leur email avant de pouvoir se connecter

---

**Dernière mise à jour :** 2025-01-27

