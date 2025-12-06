# Configuration OAuth 2.1 Server et Emails de Vérification

## 📋 Configuration Supabase Dashboard

### 1. Configurer les Redirect URLs

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Authentication** > **URL Configuration**
4. Dans **Redirect URLs**, ajoutez :
   ```
   http://nurayna.com/oauth/consent
   https://nurayna.com/oauth/consent
   ```
5. Cliquez sur **Save**

### 2. Activer OAuth 2.1 Server (optionnel)

Si vous voulez utiliser Supabase comme fournisseur OAuth pour d'autres applications :

1. Allez dans **Authentication** > **Providers**
2. Activez **OAuth 2.1 Server**
3. Configurez votre **Authorization Endpoint** : `http://nurayna.com/oauth/consent`
4. Configurez les **Redirect URIs** autorisés pour vos clients OAuth

### 3. Configurer les Templates d'Email

1. Allez dans **Authentication** > **Email Templates**
2. Personnalisez le template **Confirm signup** pour inclure le lien vers `http://nurayna.com/oauth/consent`
3. Le lien de vérification sera automatiquement ajouté par Supabase

## 🔧 Configuration dans le Code

Le code a été mis à jour pour utiliser votre domaine :

- **Inscription** : `emailRedirectTo: 'http://nurayna.com/oauth/consent'`
- **Réinitialisation de mot de passe** : `redirectTo: 'http://nurayna.com/oauth/consent'`
- **Renvoyer l'email de vérification** : `emailRedirectTo: 'http://nurayna.com/oauth/consent'`

## 📄 Page de Consentement/Vérification

Vous devez créer une page sur votre site web à l'adresse `http://nurayna.com/oauth/consent` qui :

1. **Récupère le token** depuis l'URL (paramètre `token` ou `code`)
2. **Vérifie l'email** en appelant l'API Supabase
3. **Redirige vers l'application mobile** avec un deep link

### Exemple de page HTML/JavaScript

```html
<!DOCTYPE html>
<html>
<head>
    <title>Vérification Email - AYNA</title>
</head>
<body>
    <div id="status">Vérification en cours...</div>
    <script>
        // Récupérer le token depuis l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token') || urlParams.get('code');
        const type = urlParams.get('type') || 'signup';
        
        if (token) {
            // Appeler l'API Supabase pour vérifier
            fetch('https://YOUR_SUPABASE_URL/auth/v1/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    type: type
                })
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById('status').innerHTML = 
                    'Email vérifié avec succès ! Redirection vers l\'application...';
                // Rediriger vers l'application mobile
                setTimeout(() => {
                    window.location.href = 'ayna://email-verified';
                }, 2000);
            })
            .catch(error => {
                document.getElementById('status').innerHTML = 
                    'Erreur lors de la vérification. Veuillez réessayer.';
            });
        }
    </script>
</body>
</html>
```

## ✅ Vérification

1. Créez un compte dans l'application
2. Vérifiez que l'email reçu contient le lien vers `http://nurayna.com/oauth/consent`
3. Cliquez sur le lien et vérifiez que la page fonctionne
4. Après vérification, l'utilisateur devrait être redirigé vers l'application

## 📚 Documentation Supabase

- [OAuth 2.1 Server Overview](https://supabase.com/docs/guides/auth/oauth-server)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Redirect URLs](https://supabase.com/docs/guides/auth/auth-redirects)

