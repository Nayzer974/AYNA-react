# 🔧 Guide : Corriger l'erreur "Email not confirmed"

## Problème

Lors de la connexion avec un compte dont l'email n'est pas vérifié, vous obtenez l'erreur **"Email not confirmed"** même si vous avez désactivé la vérification d'email dans Supabase.

## 🔍 Causes possibles

1. **Configuration Supabase** : La vérification d'email est toujours activée dans les paramètres
2. **Utilisateurs existants** : Les comptes créés avant la désactivation peuvent encore avoir cette restriction
3. **Cache** : Les changements de configuration peuvent prendre quelques minutes à s'appliquer

## ✅ Solution 1 : Vérifier la configuration Supabase (PRIORITAIRE)

### Étape 1 : Accéder aux paramètres d'authentification

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Authentication** dans le menu de gauche
4. Cliquez sur **Settings** (ou **Configuration**)

### Étape 2 : Désactiver la vérification d'email

1. Dans la section **Email Auth**, trouvez l'option **"Enable email confirmations"**
2. **Désactivez** cette option (décochez la case)
3. Cliquez sur **Save** pour enregistrer les changements
4. **Attendez 1-2 minutes** pour que les changements prennent effet

### Étape 3 : Vérifier les autres paramètres

Assurez-vous que :
- ✅ **"Enable sign ups"** est activé
- ✅ **"Enable email confirmations"** est **désactivé**
- ✅ **"Secure email change"** peut rester activé (optionnel)

## ✅ Solution 2 : Vérifier les utilisateurs existants

Si vous avez des utilisateurs créés avant la désactivation, vous pouvez :

### Option A : Vérifier manuellement leur email (recommandé)
- Demandez aux utilisateurs de vérifier leur email via le lien reçu
- Ou utilisez le dashboard Supabase pour marquer leur email comme vérifié

### Option B : Marquer tous les emails comme vérifiés (SQL)

⚠️ **ATTENTION** : Cette méthode marque tous les emails comme vérifiés sans vérification réelle. Utilisez uniquement pour le développement.

1. Ouvrir le **SQL Editor** dans Supabase
2. Exécuter le script : `scripts/mark-all-emails-verified.sql`
3. Vérifier avec la requête à la fin du script que tous les emails sont maintenant vérifiés

## ✅ Solution 3 : Code amélioré (déjà appliqué)

Le code a été amélioré pour mieux gérer l'erreur "Email not confirmed" :

1. **`signInWithSupabase`** : Essaie de récupérer l'utilisateur même si l'email n'est pas vérifié
2. **`UserContext.login`** : Gère l'erreur et permet la connexion si l'utilisateur existe

## 🧪 Test

Pour tester que cela fonctionne :

1. **Déconnectez-vous** de l'application
2. **Créez un nouveau compte** avec un email valide
3. **Essayez de vous connecter** immédiatement (sans vérifier l'email)
4. **Vérifiez** que vous pouvez vous connecter sans erreur

## 🔧 Dépannage

### L'erreur persiste après avoir désactivé la vérification

1. **Vérifiez** que vous avez bien sauvegardé les changements dans Supabase
2. **Attendez 2-3 minutes** pour que les changements prennent effet
3. **Redémarrez** l'application
4. **Déconnectez-vous** et reconnectez-vous

### Les utilisateurs existants ont toujours l'erreur

1. Utilisez la Solution 2 (Option A ou B)
2. Ou demandez aux utilisateurs de vérifier leur email

### L'erreur apparaît uniquement pour certains utilisateurs

- Ces utilisateurs ont probablement été créés avant la désactivation
- Utilisez la Solution 2 pour les corriger

## 📝 Note importante

- **Développement** : Désactiver la vérification d'email est pratique
- **Production** : Réactivez la vérification d'email pour la sécurité
- Les utilisateurs peuvent toujours vérifier leur email plus tard depuis les paramètres

## 🔄 Réactiver la vérification d'email (pour la production)

Quand vous êtes prêt pour la production :

1. Retournez dans **Authentication** > **Settings**
2. **Activez** l'option **"Enable email confirmations"**
3. Les nouveaux utilisateurs devront vérifier leur email avant de pouvoir utiliser l'application

