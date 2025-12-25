# 🔧 Guide : Correction de la Connexion Google

## 🐛 Problème

Le bouton "Continuer avec Google" ne fonctionne pas - il fait un chargement mais rien ne se passe.

## ✅ Solution

Le code a été corrigé pour gérer correctement OAuth en React Native. Voici ce qui a été fait :

### 1. Correction de `signInWithGoogle()`

- Utilisation de `skipBrowserRedirect: true` pour récupérer l'URL sans l'ouvrir automatiquement
- Ouverture manuelle de l'URL avec `Linking.openURL()` de React Native
- Ajout de logs pour le débogage

### 2. Flux OAuth

1. L'utilisateur clique sur "Continuer avec Google"
2. L'app obtient l'URL d'authentification Google depuis Supabase
3. L'app ouvre cette URL dans le navigateur
4. L'utilisateur s'authentifie avec Google
5. Google redirige vers `ayna://auth/callback` (deep link)
6. L'app détecte le deep link et Supabase crée automatiquement la session
7. `onAuthStateChange` dans `UserContext` détecte la connexion et met à jour l'utilisateur

## 🔧 Configuration Requise

### 1. Supabase Dashboard

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Authentication** > **URL Configuration**
4. Dans **Redirect URLs**, ajoutez :
   ```
   ayna://auth/callback
   ```
5. Cliquez sur **Save**

### 2. Vérifier le Provider Google

1. Allez dans **Authentication** > **Providers**
2. Vérifiez que **Google** est activé
3. Vérifiez que les **Client ID** et **Client Secret** sont configurés

### 3. Deep Link dans app.config.js

Le deep link est déjà configuré :
```javascript
scheme: "ayna",
```

## 🧪 Test

1. **Ouvrir l'app**
2. **Aller sur la page de connexion ou d'inscription**
3. **Cliquer sur "Continuer avec Google"**
4. **Vérifier que le navigateur s'ouvre** avec la page de connexion Google
5. **Se connecter avec Google**
6. **Vérifier que l'app revient automatiquement** et que l'utilisateur est connecté

## 🐛 Dépannage

### Le navigateur ne s'ouvre pas

- Vérifiez que `Linking.canOpenURL()` retourne `true`
- Vérifiez les logs dans la console pour voir l'erreur

### L'utilisateur n'est pas connecté après l'authentification

- Vérifiez que `ayna://auth/callback` est bien dans les Redirect URLs de Supabase
- Vérifiez que `onAuthStateChange` dans `UserContext` est bien configuré
- Vérifiez les logs pour voir si `SIGNED_IN` est déclenché

### Erreur "Invalid redirect URL"

- Vérifiez que `ayna://auth/callback` est bien dans les Redirect URLs de Supabase
- Vérifiez que l'URL de redirection dans le code correspond exactement à celle dans Supabase

## 📝 Notes

- Le deep link `ayna://auth/callback` doit être configuré dans Supabase Dashboard
- La session est créée automatiquement par Supabase lors de la redirection
- `onAuthStateChange` dans `UserContext` détecte automatiquement la connexion

---

**Dernière mise à jour :** 2025-01-27







