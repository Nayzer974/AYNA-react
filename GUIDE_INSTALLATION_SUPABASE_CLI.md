# 🔧 Guide : Installation et Utilisation de Supabase CLI

## 📋 Installation de Supabase CLI

### Option 1 : Via npm (Recommandé)

```bash
npm install -g supabase
```

### Option 2 : Via Scoop (Windows)

```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Option 3 : Via Chocolatey (Windows)

```bash
choco install supabase
```

### Option 4 : Téléchargement direct (Windows)

1. Allez sur [https://github.com/supabase/cli/releases](https://github.com/supabase/cli/releases)
2. Téléchargez `supabase_windows_amd64.zip`
3. Extrayez le fichier
4. Ajoutez le dossier au PATH Windows

## 🔐 Configuration

### Étape 1 : Se connecter à Supabase

```bash
supabase login
```

Cela ouvrira votre navigateur pour vous connecter.

### Étape 2 : Lier votre projet

```bash
cd application
supabase link --project-ref votre-project-ref
```

**Comment trouver votre project-ref :**
1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** > **General**
4. Copiez le **Reference ID** (ex: `abcdefghijklmnop`)

Ou utilisez directement l'URL de votre projet :

```bash
supabase link --project-ref votre-project-ref --password votre-db-password
```

## 🚀 Déployer les Edge Functions

### Déployer une fonction spécifique

```bash
cd application
supabase functions deploy send-email-brevo
supabase functions deploy send-verification-email-brevo
supabase functions deploy send-password-reset-brevo
```

### Déployer toutes les fonctions

```bash
cd application
supabase functions deploy
```

## 📝 Commandes utiles

### Voir les fonctions déployées

```bash
supabase functions list
```

### Voir les logs d'une fonction

```bash
supabase functions logs send-email-brevo
```

### Tester une fonction localement

```bash
supabase functions serve send-email-brevo
```

## 🐛 Dépannage

### Erreur "supabase: command not found"

**Windows PowerShell :**
```powershell
# Vérifier si npm est installé
npm --version

# Si npm n'est pas installé, installez Node.js depuis https://nodejs.org/

# Installer Supabase CLI
npm install -g supabase

# Vérifier l'installation
supabase --version
```

**Si npm n'est pas dans le PATH :**
1. Fermez et rouvrez PowerShell en tant qu'administrateur
2. Réessayez `npm install -g supabase`

### Erreur "Project not found"

Vérifiez que vous êtes dans le bon répertoire et que le project-ref est correct :

```bash
cd application
supabase link --project-ref votre-project-ref
```

### Erreur "Not logged in"

```bash
supabase login
```

## ✅ Vérification

Après le déploiement, vérifiez dans le Dashboard :

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Edge Functions**
4. Vous devriez voir vos fonctions déployées

---

**Dernière mise à jour :** 2025-01-27






