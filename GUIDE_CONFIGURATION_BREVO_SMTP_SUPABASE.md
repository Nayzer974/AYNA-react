# 🔧 Guide : Configuration Brevo SMTP dans Supabase

## 📋 Objectif

Configurer Supabase pour utiliser Brevo SMTP (smtp-relay.brevo.com, port 587) pour l'envoi des emails de vérification au lieu du service email interne de Supabase.

## ✅ Étapes de Configuration

### Étape 1 : Obtenir les identifiants Brevo

1. Allez sur [https://app.brevo.com](https://app.brevo.com)
2. Connectez-vous à votre compte Brevo
3. Allez dans **Settings** > **SMTP & API**
4. Notez votre **SMTP Server** : `smtp-relay.brevo.com`
5. Notez votre **Port** : `587`
6. Créez une **SMTP Key** si vous n'en avez pas :
   - Cliquez sur **Generate New Key**
   - Donnez un nom (ex: "Supabase SMTP")
   - Copiez la clé générée (vous ne pourrez plus la voir après)

### Étape 2 : Configurer SMTP dans Supabase Dashboard

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Authentication** dans le menu de gauche
4. Dans la section **CONFIGURATION**, cliquez sur **Email Templates**
5. Cliquez sur **SMTP Settings** (en haut à droite ou dans le menu)
6. Activez **"Enable Custom SMTP"**
7. Remplissez les champs suivants :
   - **Host** : `smtp-relay.brevo.com`
   - **Port** : `587`
   - **Username** : Votre email Brevo (ex: `noreply@nurayna.com`)
   - **Password** : Votre SMTP Key Brevo (la clé que vous avez générée)
   - **Sender Email** : `noreply@nurayna.com` (ou votre email vérifié dans Brevo)
   - **Sender Name** : `AYNA`
8. Cliquez sur **Save**

### Étape 3 : Vérifier l'email sender dans Brevo

1. Allez dans **Settings** > **Senders & IP**
2. Vérifiez que votre email `noreply@nurayna.com` est vérifié
3. Si ce n'est pas le cas, ajoutez-le et vérifiez-le via l'email de confirmation

### Étape 4 : Activer la vérification d'email

1. Allez dans **Authentication** > **Sign In / Providers**
2. Cliquez sur l'onglet **Email**
3. Activez **"Enable email confirmations"** (doit être activé pour que Supabase envoie les emails)
4. Cliquez sur **Save**

### Étape 5 : Configurer les Redirect URLs

1. Allez dans **Authentication** > **URL Configuration**
2. Dans **Redirect URLs**, ajoutez :
   ```
   ayna://auth/callback
   https://www.nurayna.com/verify-email.html
   ```
3. Dans **Site URL**, ajoutez :
   ```
   https://www.nurayna.com
   ```
4. Cliquez sur **Save**

## ✅ Vérification

Après la configuration :

1. Testez une inscription dans l'application
2. Vérifiez que l'email est bien envoyé via Brevo (dans Brevo Dashboard > **Statistics** > **Email Activity**)
3. Vérifiez que l'email contient le lien de vérification pointant vers `ayna://auth/callback`

## 📝 Notes

- **SMTP Key vs API Key** : Utilisez la **SMTP Key** (pas l'API Key) pour la configuration SMTP
- **Port 587** : Utilisez le port 587 (TLS) et non 465 (SSL)
- **Email vérifié** : L'email sender doit être vérifié dans Brevo pour pouvoir envoyer des emails
- **Rate Limits** : Brevo a des limites d'envoi selon votre plan (gratuit : 300 emails/jour)

---

**Dernière mise à jour :** 2025-01-27






