# 🔧 Guide : Corriger le problème "Utilisateur non créé"

## 📋 Problème

Lors de l'inscription avec Brevo activé, Supabase retourne l'erreur "Error sending confirmation email" mais **l'utilisateur n'est pas créé** (`data?.user` est `null`).

## 🔍 Cause

Supabase essaie d'envoyer un email de confirmation même si Brevo est activé, et si l'envoi échoue, **l'utilisateur n'est pas créé**.

## ✅ Solution : Désactiver la vérification d'email dans Supabase

**C'EST LA SOLUTION PRINCIPALE** : Vous devez désactiver "Enable email confirmations" dans Supabase Dashboard pour que Supabase ne tente pas d'envoyer l'email automatiquement.

### Étape 1 : Accéder à Sign In / Providers

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Authentication** dans le menu de gauche
4. Dans la section **CONFIGURATION**, cliquez sur **Sign In / Providers**

### Étape 2 : Désactiver la vérification d'email

1. Cliquez sur l'onglet **Email** (en haut de la page)
2. Trouvez l'option **"Enable email confirmations"**
3. **Désactivez** cette option (mettez le toggle sur OFF)
4. Cliquez sur **Save**
5. **Attendez 1-2 minutes** pour que les changements prennent effet

## 🎯 Résultat attendu

Après avoir désactivé la vérification d'email :

1. ✅ L'inscription créera l'utilisateur **sans erreur**
2. ✅ L'email sera envoyé **uniquement via Brevo**
3. ✅ L'utilisateur pourra se connecter immédiatement
4. ✅ L'utilisateur pourra vérifier son email plus tard via le bouton dans Settings

## 📝 Notes

- **Pourquoi désactiver ?** : Supabase essaie d'envoyer l'email automatiquement même si Brevo est activé, ce qui cause une erreur et empêche la création de l'utilisateur. En désactivant la vérification d'email, Supabase ne tentera plus d'envoyer l'email automatiquement.

- **Sécurité** : Même si la vérification d'email est désactivée dans Supabase, vous pouvez toujours :
  - Envoyer les emails via Brevo
  - Demander aux utilisateurs de vérifier leur email via le bouton dans Settings
  - Vérifier manuellement les emails dans Supabase Dashboard

## 🔄 Réactiver la vérification d'email (optionnel)

Si vous voulez réactiver la vérification d'email plus tard :

1. Retournez dans **Authentication** > **Sign In / Providers** > **Email**
2. **Activez** l'option **"Enable email confirmations"**
3. Les nouveaux utilisateurs devront vérifier leur email avant de pouvoir se connecter

---

**Dernière mise à jour :** 2025-01-27






