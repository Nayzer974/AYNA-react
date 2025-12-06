# Guide de Déploiement - Page OAuth Consent

## 📋 Fichier à déployer

Le fichier `oauth-consent.html` doit être déployé sur votre serveur web à l'adresse :
```
http://nurayna.com/oauth/consent
```

## 🔧 Configuration

### 1. Modifier les variables Supabase

Ouvrez `oauth-consent.html` et remplacez :

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Ex: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Par vos vraies valeurs Supabase :

```javascript
const SUPABASE_URL = 'https://votre-projet.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### 2. Déployer sur votre serveur

#### Option A : Via FTP/SFTP
1. Connectez-vous à votre serveur via FTP
2. Uploadez `oauth-consent.html` dans le dossier racine de `nurayna.com`
3. Renommez-le en `consent.html` ou configurez votre serveur pour servir `oauth-consent.html`

#### Option B : Via cPanel/File Manager
1. Connectez-vous à votre cPanel
2. Allez dans File Manager
3. Naviguez vers le dossier de votre domaine
4. Créez un dossier `oauth` si nécessaire
5. Uploadez `oauth-consent.html` et renommez-le en `index.html` ou `consent.html`

#### Option C : Via Git/SSH
```bash
# Sur votre serveur
cd /var/www/nurayna.com/oauth
# Ou créez le dossier
mkdir -p /var/www/nurayna.com/oauth
cd /var/www/nurayna.com/oauth

# Copiez le fichier
cp /chemin/vers/oauth-consent.html ./index.html
# Ou
cp /chemin/vers/oauth-consent.html ./consent.html
```

## ✅ Vérification

1. **Testez l'URL** : Allez sur `http://nurayna.com/oauth/consent`
2. **Vérifiez que la page s'affiche** correctement
3. **Testez avec un vrai lien de vérification** :
   - Créez un compte dans l'application
   - Cliquez sur le lien dans l'email
   - Vérifiez que la page fonctionne

## 🔒 Sécurité

- ✅ La page utilise la clé **anon public** de Supabase (sécurisée pour le client)
- ✅ Les tokens sont vérifiés côté serveur Supabase
- ✅ Pas de stockage de données sensibles

## 📱 Redirection vers l'application

La page redirige automatiquement vers :
- `ayna://email-verified` (deep link vers l'application)
- Si l'app n'est pas installée, redirige vers `https://ayna.app`

## 🐛 Dépannage

### La page ne s'affiche pas
- Vérifiez que le fichier est bien uploadé
- Vérifiez les permissions du fichier (644)
- Vérifiez la configuration de votre serveur web

### Erreur "CORS" ou "Network Error"
- Vérifiez que `SUPABASE_URL` est correct
- Vérifiez que `SUPABASE_ANON_KEY` est correct
- Vérifiez que votre domaine est autorisé dans Supabase Dashboard

### Le token n'est pas reconnu
- Vérifiez que l'URL de redirection est bien configurée dans Supabase Dashboard
- Vérifiez que le token n'a pas expiré (les liens expirent après un certain temps)

## 📚 Documentation Supabase

- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Redirect URLs](https://supabase.com/docs/guides/auth/auth-redirects)
- [OAuth 2.1 Server](https://supabase.com/docs/guides/auth/oauth-server)

