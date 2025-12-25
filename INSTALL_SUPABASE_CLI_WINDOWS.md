# 🔧 Installation Supabase CLI sur Windows

## 📋 Méthode 1 : Via Scoop (Recommandé)

### Étape 1 : Installer Scoop (si pas déjà installé)

Ouvrez PowerShell en tant qu'**administrateur** et exécutez :

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

### Étape 2 : Ajouter le bucket Supabase

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
```

### Étape 3 : Installer Supabase CLI

```powershell
scoop install supabase
```

### Étape 4 : Vérifier l'installation

```powershell
supabase --version
```

## 📋 Méthode 2 : Via Chocolatey (Alternative)

Si vous avez Chocolatey installé :

```powershell
choco install supabase
```

## 📋 Méthode 3 : Téléchargement direct

1. Allez sur [https://github.com/supabase/cli/releases](https://github.com/supabase/cli/releases)
2. Téléchargez `supabase_windows_amd64.zip`
3. Extrayez `supabase.exe`
4. Ajoutez au PATH Windows :
   - Ouvrez **Variables d'environnement**
   - Modifiez **Path**
   - Ajoutez le dossier contenant `supabase.exe`

## 🔐 Configuration après installation

### 1. Se connecter

```bash
supabase login
```

### 2. Lier votre projet

```bash
cd application
supabase link --project-ref votre-project-ref
```

**Trouver votre project-ref :**
- Supabase Dashboard > Settings > General > Reference ID

## 🚀 Déployer les Edge Functions

```bash
cd application
supabase functions deploy send-verification-email-brevo
supabase functions deploy send-password-reset-brevo
```

---

**Dernière mise à jour :** 2025-01-27






