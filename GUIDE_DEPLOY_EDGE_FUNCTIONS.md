# 🚀 Guide : Déployer les Edge Functions Supabase

## ⚠️ Important

Supabase CLI ne peut pas être installé via `npm install -g`. Il faut utiliser une autre méthode.

## 📋 Option 1 : Via le Dashboard Supabase (Recommandé - Plus Simple)

C'est la méthode la plus simple et ne nécessite aucune installation.

### Déployer `send-verification-email-brevo`

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Edge Functions** (menu de gauche)
4. Cliquez sur **Create a new function**
5. **Nom de la fonction** : `send-verification-email-brevo`
6. Cliquez sur **Create function**
7. **Ouvrez le fichier** : `application/supabase/functions/send-verification-email-brevo/index.ts`
8. **Copiez tout le contenu** (Ctrl+A puis Ctrl+C)
9. **Collez dans l'éditeur** du Dashboard (remplacez tout le code par défaut)
10. Cliquez sur **Deploy**

### Déployer `send-password-reset-brevo`

1. Dans **Edge Functions**, cliquez sur **Create a new function**
2. **Nom de la fonction** : `send-password-reset-brevo`
3. Cliquez sur **Create function**
4. **Ouvrez le fichier** : `application/supabase/functions/send-password-reset-brevo/index.ts`
5. **Copiez tout le contenu** et **collez dans l'éditeur**
6. Cliquez sur **Deploy**

## 📋 Option 2 : Installer Supabase CLI (Pour la ligne de commande)

### Windows : Via Scoop (Recommandé)

1. **Installer Scoop** (si pas déjà installé) :
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   irm get.scoop.sh | iex
   ```

2. **Ajouter le bucket Supabase** :
   ```powershell
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   ```

3. **Installer Supabase CLI** :
   ```powershell
   scoop install supabase
   ```

4. **Vérifier l'installation** :
   ```powershell
   supabase --version
   ```

### Windows : Via Chocolatey

```powershell
choco install supabase
```

### Windows : Téléchargement direct

1. Allez sur [https://github.com/supabase/cli/releases](https://github.com/supabase/cli/releases)
2. Téléchargez `supabase_windows_amd64.zip`
3. Extrayez le fichier `supabase.exe`
4. Ajoutez le dossier au PATH Windows :
   - Ouvrez **Variables d'environnement**
   - Ajoutez le chemin du dossier contenant `supabase.exe` au **PATH**

## 🔐 Configuration Supabase CLI

### Étape 1 : Se connecter

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

## 🚀 Déployer les Edge Functions

Une fois Supabase CLI installé et configuré :

```bash
cd application
supabase functions deploy send-verification-email-brevo
supabase functions deploy send-password-reset-brevo
```

## ✅ Vérification

Après le déploiement (via Dashboard ou CLI) :

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Edge Functions**
4. Vous devriez voir :
   - ✅ `send-email-brevo` (déjà déployée)
   - ✅ `send-verification-email-brevo` (à déployer)
   - ✅ `send-password-reset-brevo` (à déployer)

## 🎯 Recommandation

**Utilisez le Dashboard Supabase** (Option 1) - c'est plus simple et ne nécessite aucune installation.

---

**Dernière mise à jour :** 2025-01-27






