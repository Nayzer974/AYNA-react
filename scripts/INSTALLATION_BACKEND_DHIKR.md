# Installation du nouveau backend DairatAnNur

## 📋 Instructions d'installation

### ⚠️ ATTENTION
**Ce processus va supprimer toutes les données existantes des sessions de dhikr !**
Assurez-vous de sauvegarder les données importantes avant de continuer.

### Étape 1 : Réinitialiser le backend

1. Ouvrir le **SQL Editor** dans Supabase
2. Exécuter le script **`reset-dhikr-backend-complete.sql`**
   - Ce script supprime toutes les tables, fonctions RPC, politiques RLS existantes
   - ⚠️ **Toutes les données seront perdues**

### Étape 2 : Créer le nouveau backend

1. Toujours dans le **SQL Editor** de Supabase
2. Exécuter le script **`create-dhikr-backend-mobile.sql`**
   - Ce script crée les nouvelles tables, index, politiques RLS et fonctions RPC
   - Le backend est optimisé pour l'application mobile

### Étape 3 : Vérifier l'installation

Exécuter cette requête pour vérifier que tout est créé correctement :

```sql
-- Vérifier les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'dhikr%'
ORDER BY table_name;

-- Vérifier les fonctions RPC
SELECT proname, proargnames 
FROM pg_proc 
WHERE proname LIKE '%dhikr%'
ORDER BY proname;

-- Vérifier les politiques RLS
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename LIKE 'dhikr%'
ORDER BY tablename, policyname;
```

Vous devriez voir :
- **3 tables** : `dhikr_sessions`, `dhikr_session_participants`, `dhikr_session_clicks`
- **3 fonctions RPC** : `create_dhikr_session`, `join_dhikr_session`, `leave_dhikr_session`
- **Plusieurs politiques RLS** pour chaque table

## ✅ Avantages du nouveau backend

1. **Simple et robuste** : Code propre, facile à maintenir
2. **Fonctionne sans email vérifié** : Les utilisateurs connectés peuvent créer des sessions même si leur email n'est pas vérifié
3. **Optimisé pour mobile** : Index et requêtes optimisés pour les performances mobiles
4. **Sécurisé** : RLS activé avec politiques appropriées
5. **Fonctions RPC claires** : Chaque fonction a un rôle précis et bien défini

## 🔧 Fonctionnalités

### Création de session
- Les utilisateurs connectés peuvent créer des sessions
- Vérification automatique si l'utilisateur est déjà dans une session
- Validation des paramètres (target_count entre 100-999, max_participants entre 1-100)

### Rejoindre une session
- Vérification que la session est ouverte et active
- Vérification que la session n'est pas pleine
- Ajout automatique du participant

### Quitter une session
- Suppression du participant
- Si c'est le créateur qui quitte, la session est fermée
- Si plus aucun participant, la session est supprimée

## 📱 Code client

Le code client dans `src/services/dhikrSessions.ts` a été mis à jour pour utiliser les nouvelles fonctions RPC.

**Aucune modification nécessaire dans le frontend** - tout fonctionne automatiquement !

## 🐛 Dépannage

### Erreur : "function does not exist"
- Vérifier que le script `create-dhikr-backend-mobile.sql` a bien été exécuté
- Vérifier les permissions avec `GRANT EXECUTE`

### Erreur : "L'utilisateur n'existe pas"
- L'utilisateur doit se reconnecter pour créer un compte dans `auth.users`
- Vérifier que l'inscription a bien créé l'utilisateur

### Erreur : "Vous êtes déjà dans une autre session"
- C'est normal, l'utilisateur doit quitter sa session actuelle d'abord
- La fonction vérifie automatiquement cela

## 📝 Notes importantes

1. **Les données existantes seront supprimées** lors de la réinitialisation
2. **Les utilisateurs doivent se reconnecter** après l'installation pour que leur session soit reconnue
3. **Le backend est optimisé pour mobile** avec des index appropriés
4. **Les fonctions RPC utilisent SECURITY DEFINER** pour contourner RLS tout en vérifiant manuellement l'utilisateur

## 🎉 C'est prêt !

Une fois les scripts exécutés, le backend est prêt et fonctionne avec l'application mobile.

