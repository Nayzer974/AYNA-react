# 🔧 Guide de Correction des Erreurs RLS pour journal_notes

## Problème

Erreur lors de la sauvegarde des notes de journal :
```
ERROR [notesStorage] Erreur sauvegarde Supabase: {"code": "42501", "details": null, "hint": null, "message": "new row violates row-level security policy for table \"journal_notes\""}
```

Cette erreur indique que les politiques RLS (Row Level Security) empêchent l'insertion de nouvelles notes.

## Solution

### Étape 1 : Exécuter le script SQL de correction

1. Ouvrez le **Supabase Dashboard** : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Créez une nouvelle requête
5. Copiez-collez le contenu du fichier `scripts/fix-journal-notes-rls.sql`
6. Exécutez la requête

### Étape 2 : Vérifier que les politiques sont créées

Après l'exécution, vous devriez voir un message :
```
✅ Toutes les politiques RLS ont été créées avec succès
```

### Étape 3 : Vérifier l'authentification

Le code a été amélioré pour vérifier que l'utilisateur est bien authentifié avant de sauvegarder. Si l'erreur persiste :

1. Vérifiez que l'utilisateur est bien connecté dans l'application
2. Vérifiez que la session Supabase est active
3. Vérifiez les logs dans la console pour voir les détails de l'erreur

## Détails techniques

Le script SQL :
- Supprime les anciennes politiques RLS
- Recrée les politiques avec le format optimisé `(SELECT auth.uid())`
- Vérifie que toutes les politiques sont bien créées

Les politiques créées :
- **SELECT** : Les utilisateurs peuvent voir leurs propres notes
- **INSERT** : Les utilisateurs peuvent insérer leurs propres notes (avec vérification `WITH CHECK`)
- **UPDATE** : Les utilisateurs peuvent mettre à jour leurs propres notes
- **DELETE** : Les utilisateurs peuvent supprimer leurs propres notes

## Si l'erreur persiste

1. Vérifiez que la table `journal_notes` existe :
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'journal_notes';
   ```

2. Vérifiez que RLS est activé :
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'journal_notes';
   ```

3. Vérifiez les politiques existantes :
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'journal_notes';
   ```

4. Testez manuellement l'insertion (remplacez `YOUR_USER_ID` par votre ID utilisateur) :
   ```sql
   INSERT INTO journal_notes (user_id, text, created_at)
   VALUES ('YOUR_USER_ID', 'Test note', NOW());
   ```

## Notes importantes

- Les politiques RLS utilisent `(SELECT auth.uid())` au lieu de `auth.uid()` pour optimiser les performances
- La politique INSERT utilise `WITH CHECK` pour vérifier que `user_id` correspond à `auth.uid()`
- L'utilisateur doit être authentifié pour que les politiques fonctionnent



