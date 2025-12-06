# Correction de l'erreur de fonction RPC duplicate

## Problème

L'erreur `Could not choose the best candidate function between: public.create_dhikr_session(...)` se produit car il y a **deux fonctions RPC** avec des signatures différentes :

1. `create_dhikr_session(p_dhikr_text, p_target_count, p_max_participants)` - 3 paramètres
2. `create_dhikr_session(p_dhikr_text, p_target_count, p_max_participants, p_session_type)` - 4 paramètres

PostgreSQL ne sait pas laquelle choisir car la version avec 4 paramètres a une valeur par défaut pour `p_session_type`.

## Solution

### Option 1 : Supprimer l'ancienne fonction (recommandé)

Exécutez ce script SQL dans Supabase SQL Editor :

```sql
-- Supprimer l'ancienne fonction (3 paramètres)
DROP FUNCTION IF EXISTS public.create_dhikr_session(TEXT, INTEGER, INTEGER);
```

### Option 2 : Spécifier explicitement le paramètre dans l'appel

Le code a été mis à jour pour spécifier explicitement `p_session_type: 'community'` dans l'appel RPC, ce qui résout l'ambiguïté.

## Actions à faire

1. **Exécuter le script SQL** dans Supabase SQL Editor :
   - Ouvrir `scripts/fix-duplicate-create-dhikr-session.sql`
   - Exécuter le script (il va supprimer l'ancienne fonction et vérifier que la colonne session_type existe)

2. **Vérifier que ça fonctionne** :
   - Tester la création d'une session dans DairatAnNur
   - L'erreur ne devrait plus se produire

## Note

Le code TypeScript a été mis à jour pour spécifier explicitement `p_session_type: 'community'` dans l'appel RPC, donc même si les deux fonctions existent, il n'y aura plus d'ambiguïté.


