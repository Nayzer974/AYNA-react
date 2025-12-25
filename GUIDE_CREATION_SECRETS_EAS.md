# 🔐 Guide : Créer les Secrets EAS pour AYNA

**Date :** 2025-01-27  
**Expert Sécurité :** Agent IA Sécurité AYNA

---

## 📋 PRÉREQUIS

1. **Avoir un compte Expo** : [https://expo.dev](https://expo.dev)
2. **Avoir installé EAS CLI** : `npm install -g eas-cli`
3. **Être connecté à EAS** : `eas login`
4. **Avoir un projet EAS configuré** : Votre `app.config.js` doit avoir un `projectId`

---

## 🚀 ÉTAPE 1 : Installer EAS CLI (si pas déjà fait)

```bash
# Installer EAS CLI globalement
npm install -g eas-cli

# Vérifier l'installation
eas --version
```

---

## 🔑 ÉTAPE 2 : Se connecter à EAS

```bash
# Se connecter avec votre compte Expo
eas login

# Vérifier que vous êtes connecté
eas whoami
```

---

## 📝 ÉTAPE 3 : Créer les Secrets EAS

### Option A : Créer les secrets un par un (Recommandé)

```bash
# 1. Secret pour l'URL Supabase
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://ctupecolapegiogvmwxz.supabase.co" --scope project

# 2. Secret pour la clé anonyme Supabase
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0dXBlY29sYXBlZ2lvZ3Ztd3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTY3OTAsImV4cCI6MjA3ODQzMjc5MH0.JCGRTYx0gLTQTQE2e7kvPR1M5H7c-rnQL6ethNBJiy0" --scope project

# 3. Secret pour le client secret Quran (si nécessaire)
eas secret:create --name EXPO_PUBLIC_QURAN_CLIENT_SECRET --value "ZvlBKxAmYkCr74eBhJVHzBjaqI" --scope project

# 4. Secret pour l'API Key OpenRouter (si vous l'utilisez)
eas secret:create --name EXPO_PUBLIC_OPENROUTER_API_KEY --value "votre_clé_openrouter" --scope project

# 5. Secret pour l'API Key Ollama (si vous l'utilisez)
eas secret:create --name EXPO_PUBLIC_OLLAMA_API_KEY --value "votre_clé_ollama" --scope project
```

### Option B : Créer les secrets de manière interactive

```bash
# Lancer la commande interactive
eas secret:create

# Suivre les instructions :
# 1. Entrer le nom du secret (ex: EXPO_PUBLIC_SUPABASE_URL)
# 2. Entrer la valeur du secret
# 3. Choisir le scope (project ou account)
```

---

## 📋 LISTE COMPLÈTE DES SECRETS À CRÉER

Voici tous les secrets que vous devriez créer pour AYNA :

### 🔴 Secrets Obligatoires

```bash
# 1. URL Supabase (obligatoire)
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://ctupecolapegiogvmwxz.supabase.co" --scope project

# 2. Clé anonyme Supabase (obligatoire)
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "votre_clé_anon" --scope project
```

### 🟡 Secrets Optionnels (selon vos besoins)

```bash
# 3. API Base URL (si vous avez un backend custom)
eas secret:create --name EXPO_PUBLIC_API_BASE_URL --value "https://votre-api.com" --scope project

# 4. Quran Client Secret (si vous utilisez l'API Quran)
eas secret:create --name EXPO_PUBLIC_QURAN_CLIENT_SECRET --value "votre_secret" --scope project

# 5. OpenRouter API Key (si vous utilisez OpenRouter)
eas secret:create --name EXPO_PUBLIC_OPENROUTER_API_KEY --value "votre_clé" --scope project

# 6. Ollama API Key (si vous utilisez Ollama Cloud)
eas secret:create --name EXPO_PUBLIC_OLLAMA_API_KEY --value "votre_clé" --scope project

# 7. MindStudio Iframe URL (si vous utilisez MindStudio)
eas secret:create --name EXPO_PUBLIC_AYNA_IFRAME_URL --value "https://votre-url.com" --scope project

# 8. MindStudio API Proxy (si vous utilisez MindStudio)
eas secret:create --name EXPO_PUBLIC_AYNA_API_PROXY --value "votre_proxy" --scope project
```

---

## ✅ ÉTAPE 4 : Vérifier les Secrets Créés

```bash
# Lister tous les secrets du projet
eas secret:list

# Vous devriez voir quelque chose comme :
# ┌─────────────────────────────────────┬──────────┬─────────┐
# │ Name                                │ Scope    │ Updated │
# ├─────────────────────────────────────┼──────────┼─────────┤
# │ EXPO_PUBLIC_SUPABASE_URL            │ project  │ ...     │
# │ EXPO_PUBLIC_SUPABASE_ANON_KEY      │ project  │ project │
# └─────────────────────────────────────┴──────────┴─────────┘
```

---

## 🔄 ÉTAPE 5 : Mettre à Jour un Secret (si nécessaire)

```bash
# Mettre à jour un secret existant
eas secret:update --name EXPO_PUBLIC_SUPABASE_URL --value "nouvelle_valeur" --scope project
```

---

## 🗑️ ÉTAPE 6 : Supprimer un Secret (si nécessaire)

```bash
# Supprimer un secret
eas secret:delete --name EXPO_PUBLIC_SUPABASE_URL --scope project
```

---

## 🧪 ÉTAPE 7 : Tester avec un Build

```bash
# Faire un build de test pour vérifier que les secrets sont bien chargés
eas build --platform android --profile preview

# Ou pour iOS
eas build --platform ios --profile preview
```

Les secrets seront automatiquement injectés dans votre build via `app.config.js`.

---

## 📝 POUR LE DÉVELOPPEMENT LOCAL

Pour le développement local, créez un fichier `.env` à la racine du projet :

```env
# Fichier .env (à la racine du projet)
EXPO_PUBLIC_SUPABASE_URL=https://ctupecolapegiogvmwxz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon
EXPO_PUBLIC_QURAN_CLIENT_SECRET=votre_secret
EXPO_PUBLIC_OPENROUTER_API_KEY=votre_clé_openrouter
EXPO_PUBLIC_OLLAMA_API_KEY=votre_clé_ollama
```

**⚠️ IMPORTANT :** 
- Ajouter `.env` au `.gitignore` pour ne pas commiter les secrets
- Ne jamais commiter le fichier `.env` sur GitHub/GitLab

---

## 🔍 VÉRIFIER QUE .ENV EST DANS .GITIGNORE

```bash
# Vérifier si .env est dans .gitignore
cat .gitignore | grep .env

# Si ce n'est pas le cas, ajouter cette ligne à .gitignore :
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
```

---

## 📚 COMMANDES EAS UTILES

```bash
# Voir l'aide pour les secrets
eas secret --help

# Lister les secrets
eas secret:list

# Créer un secret
eas secret:create --name NOM_DU_SECRET --value "valeur" --scope project

# Mettre à jour un secret
eas secret:update --name NOM_DU_SECRET --value "nouvelle_valeur" --scope project

# Supprimer un secret
eas secret:delete --name NOM_DU_SECRET --scope project

# Voir les informations du projet
eas project:info
```

---

## 🎯 SCOPES DES SECRETS

### `--scope project` (Recommandé)
- Le secret est lié à votre projet spécifique
- Utilisé uniquement pour ce projet
- **Recommandé pour la plupart des cas**

### `--scope account`
- Le secret est lié à votre compte Expo
- Peut être utilisé par tous vos projets
- **Utilisez uniquement si vous voulez partager le secret entre plusieurs projets**

---

## ⚠️ BONNES PRATIQUES

1. **Ne jamais commiter les secrets** dans le code source
2. **Utiliser des secrets différents** pour développement et production
3. **Roter les secrets régulièrement** (changer les clés API périodiquement)
4. **Utiliser le scope `project`** sauf si vous avez une bonne raison d'utiliser `account`
5. **Documenter les secrets** dans un document sécurisé (pas dans le code)

---

## 🆘 DÉPANNAGE

### Problème : "Not logged in"
```bash
# Solution : Se connecter à EAS
eas login
```

### Problème : "Project not found"
```bash
# Solution : Vérifier que vous êtes dans le bon répertoire
# et que app.config.js contient un projectId
cat app.config.js | grep projectId
```

### Problème : "Secret already exists"
```bash
# Solution : Mettre à jour le secret existant
eas secret:update --name NOM_DU_SECRET --value "nouvelle_valeur" --scope project
```

### Problème : Les secrets ne sont pas chargés dans le build
```bash
# Solution : Vérifier que les noms correspondent exactement
# Les noms doivent commencer par EXPO_PUBLIC_ pour être accessibles
eas secret:list
```

---

## 📞 SUPPORT

Si vous rencontrez des problèmes :
1. Vérifier la documentation EAS : [https://docs.expo.dev/build-reference/variables/](https://docs.expo.dev/build-reference/variables/)
2. Vérifier que vous êtes connecté : `eas whoami`
3. Vérifier les secrets créés : `eas secret:list`

---

**Guide créé par l'Expert Sécurité AYNA**  
**Dernière mise à jour :** 2025-01-27










