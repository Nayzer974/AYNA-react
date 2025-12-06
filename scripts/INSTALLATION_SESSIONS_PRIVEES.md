# Installation du support des sessions privées

## Instructions étape par étape

### Étape 1 : Ajouter les colonnes
1. Ouvrez Supabase Dashboard
2. Allez dans **SQL Editor**
3. Copiez le contenu de `add-private-sessions-support-step1.sql`
4. Collez-le dans l'éditeur SQL
5. Cliquez sur **Run** ou appuyez sur `Ctrl+Enter`

### Étape 2 : Mettre à jour create_dhikr_session
1. Dans le même SQL Editor
2. Copiez le contenu de `add-private-sessions-support-step2.sql`
3. Collez-le dans l'éditeur SQL
4. Cliquez sur **Run**

### Étape 3 : Mettre à jour join_dhikr_session
1. Dans le même SQL Editor
2. Copiez le contenu de `add-private-sessions-support-step3.sql`
3. Collez-le dans l'éditeur SQL
4. Cliquez sur **Run**

### Étape 4 : Fonction de nettoyage (optionnel)
1. Dans le même SQL Editor
2. Copiez le contenu de `add-private-sessions-support-step4.sql`
3. Collez-le dans l'éditeur SQL
4. Cliquez sur **Run**

## Vérification

Après avoir exécuté toutes les étapes, vous pouvez vérifier que tout fonctionne :

```sql
-- Vérifier que les colonnes existent
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dhikr_sessions' 
  AND column_name IN ('is_private', 'private_session_id');

-- Vérifier que les fonctions existent
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('create_dhikr_session', 'join_dhikr_session', 'cleanup_completed_public_sessions');
```

## Notes importantes

- Les sessions privées sont stockées localement sur l'appareil
- Les sessions publiques sont stockées sur le serveur
- Un utilisateur peut avoir maximum 2 sessions privées
- Un utilisateur ne peut rejoindre qu'une seule session publique à la fois
- Les sessions publiques terminées sont automatiquement supprimées après 24h


