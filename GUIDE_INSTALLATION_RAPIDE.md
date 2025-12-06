# 🚀 Guide d'installation rapide - Backend DairatAnNur

## ⚠️ Problème courant

Si vous avez une erreur comme :
- `function "create_dhikr_session" does not exist`
- `relation "dhikr_sessions" does not exist`
- `Vous devez être connecté pour créer une session`

**Cela signifie que le backend n'est pas installé dans Supabase.**

## ✅ Solution rapide (5 minutes)

### Étape 1 : Ouvrir Supabase SQL Editor

1. Allez sur https://supabase.com
2. Connectez-vous à votre projet
3. Cliquez sur **SQL Editor** dans le menu de gauche

### Étape 2 : Vérifier l'état actuel

Exécutez d'abord le script de vérification :
```sql
-- Copiez-collez le contenu de scripts/verifier-backend.sql
```

**Si vous voyez 0 tables, 0 fonctions** → Le backend n'est pas installé, continuez à l'étape 3.

**Si vous voyez des tables/fonctions** → Le backend existe mais peut-être incomplet, passez à l'étape 3 pour réinstaller proprement.

### Étape 3 : Réinitialiser (si nécessaire)

⚠️ **ATTENTION** : Cela supprime toutes les données existantes !

1. Dans SQL Editor, ouvrez le fichier : `scripts/reset-dhikr-backend-complete.sql`
2. Copiez tout le contenu
3. Collez dans SQL Editor
4. Cliquez sur **Run** (ou F5)

### Étape 4 : Installer le nouveau backend

1. Dans SQL Editor, ouvrez le fichier : `scripts/create-dhikr-backend-mobile.sql`
2. Copiez tout le contenu
3. Collez dans SQL Editor
4. Cliquez sur **Run** (ou F5)

### Étape 5 : Vérifier l'installation

Réexécutez le script de vérification (`scripts/verifier-backend.sql`).

Vous devriez voir :
- ✅ **3 tables** : `dhikr_sessions`, `dhikr_session_participants`, `dhikr_session_clicks`
- ✅ **3 fonctions RPC** : `create_dhikr_session`, `join_dhikr_session`, `leave_dhikr_session`
- ✅ **Plusieurs politiques RLS**

## 🎉 C'est prêt !

Une fois installé, l'application mobile devrait fonctionner correctement.

## 🐛 Dépannage

### Erreur : "permission denied"
- Vérifiez que vous êtes connecté en tant qu'admin dans Supabase
- Les scripts doivent être exécutés avec les permissions admin

### Erreur : "function already exists"
- C'est normal si vous réinstallez
- Le script `reset-dhikr-backend-complete.sql` supprime tout d'abord

### Erreur : "relation already exists"
- Exécutez d'abord `reset-dhikr-backend-complete.sql`
- Puis `create-dhikr-backend-mobile.sql`

## 📝 Fichiers nécessaires

Tous les fichiers sont dans `D:\ayna_final\application\scripts\` :
- `reset-dhikr-backend-complete.sql` - Réinitialisation
- `create-dhikr-backend-mobile.sql` - Installation
- `verifier-backend.sql` - Vérification

