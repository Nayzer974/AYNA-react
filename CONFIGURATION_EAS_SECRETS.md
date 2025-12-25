# Configuration EAS Secrets pour Supabase

## 🔐 Problème

Dans un build Android avec EAS, les variables d'environnement depuis `.env` ne sont pas automatiquement incluses. Il faut utiliser **EAS Secrets**.

## ✅ Solution : Configurer EAS Secrets

### Étape 1 : Obtenir vos clés Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Connectez-vous à votre projet
3. Allez dans **Settings** > **API**
4. Copiez :
   - **Project URL** : `https://ctupecolapegiogvmwxz.supabase.co`
   - **anon public** key : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0dXBlY29sYXBlZ2lvZ3Ztd3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTY3OTAsImV4cCI6MjA3ODQzMjc5MH0.JCGRTYx0gLTQTQE2e7kvPR1M5H7c-rnQL6ethNBJiy0`

### Étape 2 : Configurer les secrets EAS

Exécutez ces commandes dans le terminal :

```bash
# Configurer l'URL Supabase
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://ctupecolapegiogvmwxz.supabase.co"

# Configurer la clé anon Supabase
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0dXBlY29sYXBlZ2lvZ3Ztd3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTY3OTAsImV4cCI6MjA3ODQzMjc5MH0.JCGRTYx0gLTQTQE2e7kvPR1M5H7c-rnQL6ethNBJiy0"

# Activer Supabase
eas secret:create --scope project --name EXPO_PUBLIC_USE_SUPABASE --value "true"
```

### Étape 3 : Vérifier les secrets

```bash
eas secret:list
```

Vous devriez voir les 3 secrets listés.

### Étape 4 : Relancer le build

```bash
npm run build:android:preview
```

Les secrets seront automatiquement injectés dans le build.

## 🔄 Alternative : Hardcoder temporairement (pour tester)

Si vous voulez tester rapidement sans configurer EAS Secrets, vous pouvez temporairement hardcoder les valeurs dans `app.config.js` :

```javascript
extra: {
  eas: {
    projectId: "c2832911-1e2c-4175-a93b-c61fdbbd2575"
  },
  supabaseUrl: "https://ctupecolapegiogvmwxz.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0dXBlY29sYXBlZ2lvZ3Ztd3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTY3OTAsImV4cCI6MjA3ODQzMjc5MH0.JCGRTYx0gLTQTQE2e7kvPR1M5H7c-rnQL6ethNBJiy0",
  useSupabase: true,
  // ... autres variables
}
```

⚠️ **Attention** : Cette méthode expose vos clés dans le code. Utilisez EAS Secrets pour la production.

## 📝 Notes

- Les secrets EAS sont sécurisés et ne sont jamais exposés dans le code
- Ils sont automatiquement injectés lors du build
- Vous pouvez les mettre à jour avec `eas secret:update`

