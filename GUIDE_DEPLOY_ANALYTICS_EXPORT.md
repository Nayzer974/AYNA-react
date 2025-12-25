# Guide de déploiement de l'Edge Function pour l'export Analytics

## 📋 Prérequis

1. **Supabase CLI installé** : Vérifiez avec `supabase --version`
2. **Clé API Brevo** : Récupérez-la depuis votre compte Brevo
3. **Accès au projet Supabase** : Connecté avec `supabase login`

## 🚀 Déploiement de l'Edge Function

### 1. Vérifier la structure

Assurez-vous que le fichier existe :
```
supabase/functions/send-analytics-export/index.ts
```

### 2. Déployer la fonction

Depuis le répertoire `application` :

```bash
supabase functions deploy send-analytics-export
```

### 3. Configurer la variable d'environnement BREVO_API_KEY

#### Option A : Via Supabase CLI

```bash
supabase secrets set BREVO_API_KEY=votre_cle_api_brevo
```

#### Option B : Via Supabase Dashboard

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Edge Functions** > **Settings**
4. Dans **Secrets**, ajoutez :
   - **Name** : `BREVO_API_KEY`
   - **Value** : Votre clé API Brevo

### 4. Vérifier le déploiement

```bash
supabase functions list
```

Vous devriez voir `send-analytics-export` dans la liste.

## 🔍 Vérification

### Tester l'Edge Function

Vous pouvez tester l'Edge Function directement depuis Supabase Dashboard :

1. Allez dans **Edge Functions** > **send-analytics-export**
2. Cliquez sur **Invoke function**
3. Utilisez ce payload de test :

```json
{
  "userEmail": "test@example.com",
  "userName": "Test User",
  "userId": "test-user-id",
  "format": "json",
  "data": {
    "exportDate": "2025-01-27T12:00:00.000Z",
    "userId": "test-user-id",
    "overview": {},
    "eventHistory": [],
    "usageStats": {},
    "moduleVisits": [],
    "rawEvents": []
  }
}
```

## ⚠️ Erreurs courantes

### Erreur 404 : Function not found
- **Cause** : La fonction n'est pas déployée
- **Solution** : Déployez avec `supabase functions deploy send-analytics-export`

### Erreur 500 : BREVO_API_KEY not configured
- **Cause** : La variable d'environnement n'est pas configurée
- **Solution** : Configurez `BREVO_API_KEY` via `supabase secrets set BREVO_API_KEY=...`

### Erreur 401/403 : Unauthorized
- **Cause** : Problème d'authentification Supabase
- **Solution** : Vérifiez que l'utilisateur est bien connecté dans l'application

### Erreur API Brevo
- **Cause** : Clé API invalide ou quota dépassé
- **Solution** : Vérifiez votre clé API Brevo et votre quota

## 📝 Notes importantes

1. **Email d'expéditeur** : Assurez-vous que `noreply@nurayna.com` est vérifié dans Brevo
2. **Quota Brevo** : Vérifiez votre quota d'emails dans votre compte Brevo
3. **Taille des données** : Les fichiers attachés ne doivent pas dépasser 10MB (limite Brevo)

## 🔄 Mise à jour de la fonction

Si vous modifiez le code de l'Edge Function :

```bash
supabase functions deploy send-analytics-export
```

Les modifications seront appliquées immédiatement.




