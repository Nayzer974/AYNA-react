# Guide de configuration Supabase pour AYNA Mobile

## 📍 Chemin du fichier .env

**Chemin complet :** `D:\ayna_final\application\.env`

## 🔑 Comment obtenir vos clés Supabase

### Étape 1 : Créer un compte Supabase (si vous n'en avez pas)

1. Allez sur [https://supabase.com](https://supabase.com)
2. Cliquez sur **"Start your project"** ou **"Sign in"**
3. Créez un compte ou connectez-vous

### Étape 2 : Créer un nouveau projet

1. Dans le dashboard Supabase, cliquez sur **"New Project"**
2. Remplissez les informations :
   - **Name** : AYNA (ou le nom de votre choix)
   - **Database Password** : Choisissez un mot de passe fort (⚠️ **SAVEZ-LE**)
   - **Region** : Choisissez la région la plus proche
3. Cliquez sur **"Create new project"**
4. Attendez 2-3 minutes que le projet soit créé

### Étape 3 : Récupérer vos clés API

1. Une fois le projet créé, allez dans **Settings** (⚙️ en bas à gauche)
2. Cliquez sur **API** dans le menu de gauche
3. Vous verrez deux sections importantes :

#### 📋 Project URL
- C'est votre **EXPO_PUBLIC_SUPABASE_URL**
- Format : `https://xxxxxxxxxxxxx.supabase.co`
- Copiez cette URL

#### 🔐 API Keys
- **anon public** : C'est votre **EXPO_PUBLIC_SUPABASE_ANON_KEY**
- Format : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- ⚠️ Utilisez la clé **anon public** (pas la clé **service_role** qui est secrète)

## 📝 Configuration du fichier .env

### Créer le fichier .env

1. Créez un fichier nommé `.env` à la racine du projet : `D:\ayna_final\application\.env`

2. Ajoutez le contenu suivant :

```env
# Configuration Supabase (OBLIGATOIRE)
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.votre-cle-ici
EXPO_PUBLIC_USE_SUPABASE=true
```

### Exemple complet

Remplacez les valeurs par les vôtres :

```env
# Configuration Supabase
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.abcdefghijklmnopqrstuvwxyz1234567890
EXPO_PUBLIC_USE_SUPABASE=true
```

## ✅ Vérification

### Après avoir créé le fichier .env :

1. **Redémarrez le serveur Expo** :
   ```bash
   npx expo start --clear
   ```

2. **Vérifiez dans la console** :
   - ✅ Si vous voyez **pas d'avertissement** → Configuration OK
   - ⚠️ Si vous voyez **"Supabase n'est pas configuré"** → Vérifiez votre fichier .env

### Test de connexion

1. Ouvrez l'application
2. Allez sur la page **Login**
3. Essayez de vous connecter
4. Si ça fonctionne → ✅ Supabase est bien configuré !

## 🐛 Problèmes courants

### Erreur : "Supabase n'est pas configuré"

**Solutions :**
1. Vérifiez que le fichier `.env` existe bien à `D:\ayna_final\application\.env`
2. Vérifiez que les variables commencent par `EXPO_PUBLIC_`
3. Vérifiez qu'il n'y a pas d'espaces autour du `=`
4. Redémarrez Expo avec `--clear`

### Erreur : "Invalid API key"

**Solutions :**
1. Vérifiez que vous utilisez la clé **anon public** (pas service_role)
2. Vérifiez que la clé est complète (elle est très longue)
3. Vérifiez qu'il n'y a pas d'espaces ou de retours à la ligne

### Les variables ne sont pas chargées

**Solutions :**
1. Redémarrez Expo : `npx expo start --clear`
2. Vérifiez que `app.config.js` lit bien `process.env.EXPO_PUBLIC_*`
3. Vérifiez la console pour voir les valeurs chargées

## 📞 Besoin d'aide ?

Si vous avez des problèmes :
1. Vérifiez la console pour les erreurs
2. Vérifiez que votre projet Supabase est actif
3. Vérifiez que les clés sont correctes dans le dashboard Supabase

