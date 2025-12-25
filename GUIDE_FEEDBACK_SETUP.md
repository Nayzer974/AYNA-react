# 📧 Guide : Configuration du système de feedback

## 📋 Objectif

Permettre aux utilisateurs d'envoyer des avis ou de signaler des bugs avec des images, qui seront envoyés par email à `pro.ibrahima00@gmail.com`.

## ✅ Étapes de Configuration

### Étape 1 : Créer le bucket "feedback" dans Supabase Storage

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Storage** dans le menu de gauche
4. Cliquez sur **New bucket**
5. Configurez le bucket :
   - **Name**: `feedback`
   - **Public bucket**: ✅ **Activé** (important pour permettre l'accès aux images)
   - **File size limit**: `10 MB` (ou selon vos besoins)
   - **Allowed MIME types**: `image/jpeg, image/png, image/jpg, image/webp` (optionnel)
6. Cliquez sur **Create bucket**

### Étape 2 : Configurer les politiques RLS pour le bucket

1. Dans le Dashboard Supabase, allez dans **SQL Editor**
2. Créez une nouvelle requête
3. Copiez et collez le contenu du fichier `scripts/setup-feedback-storage.sql`
4. Cliquez sur **Run** pour exécuter le script

**Note**: Si vous obtenez une erreur de permission, vous pouvez créer les politiques manuellement via l'interface graphique :
- Allez dans **Storage** > **Policies**
- Sélectionnez le bucket `feedback`
- Créez les politiques suivantes :
  - **Users can upload feedback images** (INSERT, authenticated)
  - **Users can view their own feedback images** (SELECT, authenticated)
  - **Users can delete their own feedback images** (DELETE, authenticated)
  - **Admins can view all feedback images** (SELECT, authenticated)

### Étape 3 : Déployer l'Edge Function "send-feedback"

1. Dans le Dashboard Supabase, allez dans **Edge Functions**
2. Cliquez sur **Create a new function**
3. Nommez-la `send-feedback`
4. Copiez le contenu du fichier `supabase/functions/send-feedback/index.ts`
5. Collez-le dans l'éditeur
6. Cliquez sur **Deploy**

**OU** utilisez la CLI Supabase :

```bash
cd application
supabase functions deploy send-feedback
```

### Étape 4 : Configurer la variable d'environnement BREVO_API_KEY

1. Dans le Dashboard Supabase, allez dans **Edge Functions** > **Settings**
2. Dans **Secrets**, ajoutez :
   - **Name**: `BREVO_API_KEY`
   - **Value**: Votre clé API Brevo (obtenue depuis [https://app.brevo.com](https://app.brevo.com) > Settings > SMTP & API)

**Note**: Si vous n'avez pas encore configuré Brevo, suivez le guide `GUIDE_CONFIGURATION_BREVO_SMTP_SUPABASE.md`

### Étape 5 : Vérifier que tout fonctionne

1. Ouvrez l'application
2. Allez dans **Profil** > **À propos**
3. Cliquez sur **"Envoyer un avis / Signaler un bug"**
4. Remplissez le formulaire et testez l'envoi

## 📝 Notes importantes

- **Format des images**: Les images sont automatiquement converties en JPEG et compressées
- **Limite d'images**: Maximum 5 images par feedback
- **Taille maximale**: 10 MB par image (configurable dans le bucket)
- **Email de destination**: `pro.ibrahima00@gmail.com` (configuré dans l'Edge Function)
- **Format de l'email**: HTML avec les images intégrées et texte brut en alternative

## 🔧 Personnalisation

### Changer l'adresse email de destination

Modifiez le fichier `supabase/functions/send-feedback/index.ts` :

```typescript
to: [
  { email: 'votre-email@example.com' } // Changez ici
],
```

### Modifier le format de l'email

Le template HTML est dans la fonction Edge `send-feedback/index.ts`. Vous pouvez personnaliser le style et la structure.

### Changer la limite d'images

Dans `application/src/pages/Profile.tsx`, modifiez :

```typescript
setFeedbackImages([...feedbackImages, ...newImages].slice(0, 5)); // Changez 5 par le nombre souhaité
```

## 🐛 Dépannage

### Les images ne s'uploadent pas

1. Vérifiez que le bucket `feedback` existe et est public
2. Vérifiez que les politiques RLS sont correctement configurées
3. Vérifiez les logs dans Supabase Dashboard > Logs > Edge Functions

### L'email n'est pas envoyé

1. Vérifiez que `BREVO_API_KEY` est configurée dans les secrets de l'Edge Function
2. Vérifiez les logs de l'Edge Function dans Supabase Dashboard
3. Vérifiez que votre compte Brevo a encore des crédits disponibles

### Erreur "StorageApiError: new row violates row-level security policy"

1. Vérifiez que les politiques RLS sont bien créées
2. Vérifiez que le nom du fichier uploadé commence par `{userId}-`
3. Vérifiez que l'utilisateur est bien authentifié

---

**Dernière mise à jour :** 2025-01-27





