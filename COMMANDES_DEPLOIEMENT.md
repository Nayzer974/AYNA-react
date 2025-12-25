# 🚀 Commandes pour Déployer les Edge Functions

## 📋 Installation de Scoop (Gestionnaire de paquets Windows)

Ouvrez **PowerShell en tant qu'administrateur** et exécutez :

```powershell
# Activer l'exécution de scripts
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Installer Scoop
irm get.scoop.sh | iex
```

**Fermez et rouvrez PowerShell** après l'installation.

## 📦 Installation de Supabase CLI

```powershell
# Ajouter le bucket Supabase
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git

# Installer Supabase CLI
scoop install supabase

# Vérifier l'installation
supabase --version
```

## 🔐 Configuration

### 1. Se connecter à Supabase

```powershell
supabase login
```

Cela ouvrira votre navigateur pour vous connecter.

### 2. Lier votre projet

```powershell
cd D:\ayna_final\application
supabase link --project-ref VOTRE_PROJECT_REF
```

**Comment trouver votre project-ref :**
1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** > **General**
4. Copiez le **Reference ID** (ex: `abcdefghijklmnop`)

## 🚀 Déployer les Edge Functions

Une fois configuré, déployez les fonctions :

```powershell
cd D:\ayna_final\application

# Déployer la fonction de vérification d'email
supabase functions deploy send-verification-email-brevo

# Déployer la fonction de réinitialisation de mot de passe
supabase functions deploy send-password-reset-brevo
```

## ✅ Vérification

Après le déploiement :

```powershell
# Lister les fonctions déployées
supabase functions list

# Voir les logs
supabase functions logs send-verification-email-brevo
```

---

## 🎯 Alternative : Utiliser le Dashboard (Plus Simple)

Si vous préférez ne pas installer Scoop, utilisez le Dashboard Supabase :

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. **Edge Functions** > **Create a new function**
3. Copiez-collez le code depuis les fichiers dans `supabase/functions/`

Voir `GUIDE_DEPLOY_EDGE_FUNCTIONS.md` pour les détails.

---

**Dernière mise à jour :** 2025-01-27






