# Solution : Erreur de fonction RPC duplicate

## Problème

```
Could not choose the best candidate function between: 
- public.create_dhikr_session(p_dhikr_text => text, p_target_count => integer, p_max_participants => integer)
- public.create_dhikr_session(p_dhikr_text => text, p_target_count => integer, p_max_participants => integer, p_session_type => text)
```

Il y a **deux fonctions RPC** avec le même nom mais des signatures différentes. PostgreSQL ne peut pas choisir automatiquement.

## Solution

### ✅ Déjà fait dans le code

Le code TypeScript a été mis à jour pour spécifier explicitement le paramètre `p_session_type: 'community'`, ce qui résout l'ambiguïté côté application.

### 🔧 À faire dans Supabase

**Option 1 : Supprimer l'ancienne fonction (recommandé)**

Exécutez ce script SQL dans Supabase Dashboard → SQL Editor :

```sql
-- Supprimer l'ancienne fonction (3 paramètres)
DROP FUNCTION IF EXISTS public.create_dhikr_session(TEXT, INTEGER, INTEGER);
```

**Option 2 : Exécuter le script complet**

Exécutez le fichier `scripts/remove-duplicate-function.sql` qui :
1. Liste toutes les fonctions duplicate
2. Supprime l'ancienne version
3. Vérifie que seule la nouvelle existe

## Vérification

Après avoir exécuté le script, vous devriez avoir une seule fonction :
- `create_dhikr_session(p_dhikr_text, p_target_count, p_max_participants, p_session_type)`

## Note

Le code de l'application spécifie maintenant explicitement `p_session_type: 'community'` dans l'appel RPC, donc même si les deux fonctions existent temporairement, l'appel fonctionnera correctement. Cependant, il est recommandé de supprimer l'ancienne fonction pour éviter toute confusion future.


