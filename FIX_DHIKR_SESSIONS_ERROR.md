# Correction de l'erreur de contrainte de clé étrangère dans dhikr_sessions

## Problème

L'erreur `insert or update on table "dhikr_sessions" VIOLATES FOREIGN KEY CONSTRAINT "dhikt_sessions_created_by_fkey"` se produit car :

1. Le code essaie d'insérer avec un UUID généré aléatoirement si l'utilisateur n'est pas authentifié
2. Cet UUID n'existe pas dans `auth.users`, ce qui viole la contrainte de clé étrangère
3. La contrainte pourrait être mal nommée (`dhikt_sessions` au lieu de `dhikr_sessions`)

## Solutions appliquées

### 1. Code corrigé (`src/services/dhikrSessions.ts`)

- ✅ Vérification que l'utilisateur est authentifié avant de créer une session
- ✅ Utilisation de la fonction RPC `create_dhikr_session` qui garantit l'authentification
- ✅ Fallback vers l'insertion directe uniquement si la fonction RPC n'existe pas, avec l'ID utilisateur authentifié
- ✅ Suppression du code qui génère des UUID aléatoires

### 2. Script SQL de correction (`scripts/fix-dhikr-sessions-fk.sql`)

Exécutez ce script dans Supabase SQL Editor pour :
- Supprimer les enregistrements orphelins
- Corriger le nom de la contrainte si nécessaire
- Recréer la contrainte correctement

## Actions à faire

1. **Exécuter le script SQL** dans Supabase SQL Editor :
   ```sql
   -- Voir scripts/fix-dhikr-sessions-fk.sql
   ```

2. **Vérifier que la fonction RPC existe** :
   - Allez dans Supabase Dashboard → SQL Editor
   - Exécutez `scripts/create-dhikr-sessions-rpc-functions.sql` si la fonction n'existe pas

3. **Tester la création de session** :
   - Se connecter
   - Aller dans DairatAnNur
   - Créer une nouvelle session
   - L'erreur ne devrait plus se produire

## Note

Le code a été mis à jour pour utiliser la fonction RPC comme dans la webapp, ce qui garantit que l'utilisateur est authentifié avant d'insérer dans `dhikr_sessions`.


