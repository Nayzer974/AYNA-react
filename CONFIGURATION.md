# Configuration de l'application AYNA Mobile

## Fichier .env

Le fichier `.env` doit être créé à la racine du projet :

**Chemin :** `D:\ayna_final\application\.env`

## Configuration Supabase (OBLIGATOIRE)

Pour configurer Supabase, créez le fichier `.env` et ajoutez :

```env
EXPO_PUBLIC_SUPABASE_URL=votre_url_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_supabase
EXPO_PUBLIC_USE_SUPABASE=true
```

### Comment obtenir vos clés Supabase :

1. Allez sur [https://supabase.com](https://supabase.com)
2. Connectez-vous à votre projet
3. Allez dans **Settings** > **API**
4. Copiez :
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Exemple de fichier .env complet :

```env
# Configuration Supabase (OBLIGATOIRE)
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_USE_SUPABASE=true

# Configuration API AYNA (optionnel)
EXPO_PUBLIC_AYNA_IFRAME_URL=
EXPO_PUBLIC_AYNA_API_PROXY=

# Configuration OpenRouter (optionnel)
EXPO_PUBLIC_OPENROUTER_API_KEY=
```

## Important

⚠️ **Ne commitez JAMAIS le fichier `.env` dans Git !**

Le fichier `.env` est déjà dans `.gitignore` pour éviter les fuites de secrets.

## Après configuration

1. Redémarrez le serveur Expo :
   ```bash
   npx expo start --clear
   ```

2. Les variables d'environnement seront chargées automatiquement via `app.config.js`

## Vérification

Pour vérifier que Supabase est bien configuré, ouvrez la console de l'application. Si vous voyez :
- ✅ Pas d'avertissement → Configuration OK
- ⚠️ "Supabase n'est pas configuré" → Vérifiez votre fichier `.env`

