# Guide : Désactiver temporairement la vérification d'email dans Supabase

## 📋 Problème

Par défaut, Supabase exige que les utilisateurs vérifient leur email avant de pouvoir utiliser certaines fonctionnalités. Pour le développement, vous pouvez désactiver temporairement cette exigence.

## 🔧 Solution : Désactiver la vérification d'email dans Supabase Dashboard

### Étape 1 : Accéder aux paramètres d'authentification

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Authentication** dans le menu de gauche
4. Cliquez sur **Settings** (ou **Configuration**)

### Étape 2 : Désactiver la vérification d'email

1. Dans la section **Email Auth**, trouvez l'option **"Confirm email"** ou **"Enable email confirmations"**
2. **Désactivez** cette option (décochez la case)
3. Cliquez sur **Save** pour enregistrer les changements

### Étape 3 : Vérifier les autres paramètres

Assurez-vous que :
- ✅ **"Enable sign ups"** est activé
- ✅ **"Enable email confirmations"** est **désactivé** (pour le développement)
- ✅ Les autres paramètres d'authentification sont correctement configurés

## ⚠️ Important

- Cette configuration est **temporaire** et uniquement pour le développement
- En production, vous devriez **réactiver** la vérification d'email pour la sécurité
- Les utilisateurs existants qui n'ont pas vérifié leur email pourront maintenant utiliser l'application

## ✅ Test

Après avoir désactivé la vérification d'email :

1. Déconnectez-vous de l'application
2. Créez un nouveau compte ou connectez-vous avec un compte existant
3. Vous devriez pouvoir utiliser toutes les fonctionnalités sans vérifier l'email

## 🔄 Réactiver la vérification d'email (pour la production)

Quand vous êtes prêt pour la production :

1. Retournez dans **Authentication** > **Settings**
2. **Activez** l'option **"Enable email confirmations"**
3. Les nouveaux utilisateurs devront vérifier leur email avant de pouvoir utiliser l'application

