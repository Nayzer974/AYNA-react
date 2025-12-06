# ⚡ Configuration Rapide Supabase

## 📍 Fichier .env

**Chemin :** `D:\ayna_final\application\.env`

## 🔑 Étapes rapides

### 1. Obtenir vos clés Supabase

1. Allez sur **https://supabase.com**
2. Connectez-vous ou créez un compte
3. Créez un nouveau projet (ou utilisez un existant)
4. Allez dans **Settings** (⚙️) > **API**
5. Copiez :
   - **Project URL** → C'est votre `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → C'est votre `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 2. Modifier le fichier .env

Ouvrez le fichier `D:\ayna_final\application\.env` et ajoutez vos clés :

```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_USE_SUPABASE=true
```

**⚠️ Important :**
- Remplacez `https://votre-projet.supabase.co` par votre vraie URL
- Remplacez `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` par votre vraie clé
- Pas d'espaces autour du `=`
- Pas de guillemets autour des valeurs

### 3. Redémarrer Expo

```bash
npx expo start --clear
```

## ✅ Vérification

Après le redémarrage, essayez de vous connecter. Si ça fonctionne → ✅ C'est bon !

## 🆘 Problème ?

Si vous voyez toujours "Supabase n'est pas configuré" :

1. Vérifiez que les variables commencent par `EXPO_PUBLIC_`
2. Vérifiez qu'il n'y a pas d'espaces
3. Vérifiez que les valeurs sont complètes (la clé est très longue)
4. Redémarrez avec `--clear`

