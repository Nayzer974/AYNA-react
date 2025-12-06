# Installation des Statistiques Khalwa

Ce guide explique comment installer la table et la fonction RPC pour les statistiques Khalwa dans Supabase.

## 📋 Prérequis

- Accès à Supabase Dashboard
- Permissions d'administration sur la base de données

## 🚀 Installation

### Étape 1 : Exécuter le script SQL

1. Ouvrez le **Supabase Dashboard**
2. Allez dans **SQL Editor**
3. Créez une nouvelle requête
4. Copiez-collez le contenu du fichier `create-khalwa-sessions-table.sql`
5. Exécutez la requête

### Étape 2 : Vérifier l'installation

Pour vérifier que tout est bien installé, exécutez cette requête :

```sql
-- Vérifier que la table existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'khalwa_sessions'
);

-- Vérifier que la fonction RPC existe
SELECT EXISTS (
  SELECT FROM pg_proc 
  WHERE proname = 'get_khalwa_stats'
);
```

### Étape 3 : Tester la fonction

Pour tester la fonction avec votre utilisateur :

```sql
-- Remplacer YOUR_USER_ID par votre UUID utilisateur
SELECT * FROM get_khalwa_stats('YOUR_USER_ID'::UUID);
```

## ✅ Résultat attendu

Après l'installation, les statistiques Khalwa dans l'application mobile seront :
- ✅ Calculées depuis Supabase (données réelles)
- ✅ Mises à jour en temps réel
- ✅ Précises et complètes

## 🔧 Dépannage

### La fonction RPC n'existe pas

Si vous obtenez une erreur `function get_khalwa_stats does not exist` :
1. Vérifiez que vous avez bien exécuté tout le script SQL
2. Vérifiez que vous êtes dans le bon schéma (`public`)
3. Réessayez d'exécuter uniquement la partie fonction du script

### Les statistiques sont à zéro

Si toutes les statistiques sont à 0 :
1. Vérifiez que vous avez des sessions complétées dans la table `khalwa_sessions`
2. Vérifiez que les sessions ont `completed = true`
3. Vérifiez que les sessions appartiennent bien à votre utilisateur

### Erreur de permissions

Si vous obtenez une erreur de permissions :
1. Vérifiez que les politiques RLS sont bien créées
2. Vérifiez que vous êtes connecté avec le bon utilisateur
3. Vérifiez que `auth.uid()` retourne bien votre UUID

## 📝 Notes

- Les statistiques sont calculées en temps réel depuis la base de données
- Le fallback sur AsyncStorage est utilisé uniquement si Supabase n'est pas disponible
- Les sessions sont automatiquement sauvegardées dans Supabase lors de leur complétion

