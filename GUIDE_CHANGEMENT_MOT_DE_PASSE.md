# Guide de Configuration - Changement de Mot de Passe avec Confirmation Email

Ce guide explique comment configurer le système de changement de mot de passe avec confirmation par email via Brevo.

## Vue d'ensemble

Le système permet aux utilisateurs de :
1. **Changer leur mot de passe depuis les paramètres** : Un email de confirmation est envoyé via Brevo
2. **Réinitialiser leur mot de passe en cas d'oubli** : Un email de réinitialisation est envoyé via Brevo

Les deux fonctionnalités utilisent la même Edge Function `send-password-change-email` qui envoie des emails via Brevo avec un lien de confirmation sécurisé.

## Prérequis

- Un compte Supabase configuré
- Un compte Brevo (anciennement Sendinblue) avec une clé API
- L'Edge Function `send-password-change-email` déployée

## Étapes de Configuration

### 1. Obtenir la Clé API Brevo

1. Connectez-vous à votre compte Brevo : https://app.brevo.com/
2. Allez dans **Settings** > **SMTP & API** > **API Keys**
3. Créez une nouvelle clé API ou utilisez une existante
4. Copiez la clé API (elle commence généralement par `xkeysib-...`)

### 2. Configurer la Clé API dans Supabase

1. Allez dans votre projet Supabase : https://supabase.com/dashboard
2. Naviguez vers **Edge Functions** > **Secrets**
3. Ajoutez un nouveau secret :
   - **Name** : `BREVO_API_KEY`
   - **Value** : Votre clé API Brevo (ex: `xkeysib-...`)
4. Cliquez sur **Save**

### 3. Déployer l'Edge Function

L'Edge Function `send-password-change-email` doit être déployée dans votre projet Supabase.

#### Option A : Via Supabase CLI

```bash
# Depuis le répertoire racine du projet
cd application

# Déployer la fonction
supabase functions deploy send-password-change-email
```

#### Option B : Via le Dashboard Supabase

1. Allez dans **Edge Functions** > **Create a new function**
2. Nommez-la `send-password-change-email`
3. Copiez le contenu de `application/supabase/functions/send-password-change-email/index.ts`
4. Déployez la fonction

### 4. Vérifier la Configuration

Pour tester la fonctionnalité :

1. **Depuis les paramètres** :
   - Connectez-vous à l'application
   - Allez dans **Paramètres**
   - Cliquez sur **Demander un changement de mot de passe**
   - Vérifiez que vous recevez un email de confirmation

2. **En cas d'oubli** :
   - Allez sur la page **Mot de passe oublié**
   - Entrez votre email
   - Vérifiez que vous recevez un email de réinitialisation

## Structure des Fichiers

```
application/
├── supabase/
│   └── functions/
│       └── send-password-change-email/
│           └── index.ts          # Edge Function pour envoyer les emails
├── src/
│   ├── pages/
│   │   ├── ChangePassword.tsx    # Page pour changer le mot de passe après confirmation
│   │   ├── ForgotPassword.tsx    # Page pour demander une réinitialisation
│   │   └── Settings.tsx          # Page des paramètres (contient le bouton de changement)
│   ├── services/
│   │   └── passwordChange.ts     # Service client pour gérer les changements de mot de passe
│   └── i18n/
│       └── locales/
│           ├── fr.json           # Traductions françaises
│           ├── en.json           # Traductions anglaises
│           └── ar.json           # Traductions arabes
└── GUIDE_CHANGEMENT_MOT_DE_PASSE.md  # Ce guide
```

## Flux de Fonctionnement

### Changement depuis les Paramètres

1. L'utilisateur clique sur **"Demander un changement de mot de passe"** dans les paramètres
2. L'application appelle `requestPasswordChange()` avec `changeType: 'settings'`
3. Le service appelle l'Edge Function `send-password-change-email`
4. L'Edge Function :
   - Génère un lien de réinitialisation via Supabase Auth
   - Envoie un email via Brevo avec le lien
5. L'utilisateur reçoit l'email et clique sur le lien
6. L'application ouvre la page `ChangePassword` avec le token
7. L'utilisateur entre son nouveau mot de passe
8. Le mot de passe est mis à jour via `changePasswordWithToken()`

### Réinitialisation en Cas d'Oubli

1. L'utilisateur entre son email sur la page **Mot de passe oublié**
2. L'application appelle `requestPasswordChange()` avec `changeType: 'forgot'`
3. Le reste du flux est identique au changement depuis les paramètres

## Format des Emails

Les emails envoyés via Brevo contiennent :
- Un titre personnalisé selon le type (réinitialisation ou changement)
- Un message explicatif
- Un bouton avec le lien de confirmation
- Un lien de secours si le bouton ne fonctionne pas
- Un avertissement de sécurité
- Les informations de la demande (date, email)

## Sécurité

- Les liens de réinitialisation sont valides pendant **1 heure**
- Les tokens sont générés de manière sécurisée par Supabase Auth
- Les mots de passe doivent respecter les critères de sécurité :
  - Minimum 8 caractères
  - Au moins une majuscule
  - Au moins une minuscule
  - Au moins un chiffre

## Dépannage

### L'email n'est pas reçu

1. Vérifiez que `BREVO_API_KEY` est bien configurée dans Supabase
2. Vérifiez les logs de l'Edge Function dans Supabase Dashboard
3. Vérifiez que l'email n'est pas dans les spams
4. Vérifiez que la clé API Brevo est valide et active

### Le lien ne fonctionne pas

1. Vérifiez que le deep link `ayna://auth/change-password` est bien configuré dans votre application
2. Vérifiez que le token n'a pas expiré (valide 1 heure)
3. Vérifiez les logs de l'application pour voir les erreurs

### Erreur "BREVO_API_KEY n'est pas configurée"

1. Allez dans Supabase Dashboard > Edge Functions > Secrets
2. Vérifiez que `BREVO_API_KEY` existe
3. Redéployez l'Edge Function après avoir ajouté le secret

## Support

Pour toute question ou problème, consultez :
- La documentation Brevo : https://developers.brevo.com/
- La documentation Supabase Edge Functions : https://supabase.com/docs/guides/functions





