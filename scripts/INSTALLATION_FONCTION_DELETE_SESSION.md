# Installation de la Fonction delete_dhikr_session

## Problème
Si vous voyez l'erreur :
```
Could not find the function public.delete_dhikr_session(p_session_id, p_user_id) in the schema cache
```

Cela signifie que la fonction RPC n'a pas encore été créée dans Supabase.

## Solution

### Option 1 : Exécuter le script complet (Recommandé)

1. Ouvrez le **Supabase SQL Editor**
2. Exécutez le script `admin-permissions-management.sql` complet
3. Cela créera toutes les fonctions nécessaires, y compris `delete_dhikr_session`

### Option 2 : Exécuter uniquement la fonction delete_dhikr_session

Si vous voulez seulement créer la fonction de suppression, exécutez ce script :

```sql
-- Fonction pour supprimer une session de dhikr
CREATE OR REPLACE FUNCTION public.delete_dhikr_session(
  p_session_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_created_by UUID;
  v_user_is_admin BOOLEAN;
  v_participants_count INTEGER;
BEGIN
  -- Vérifier que l'utilisateur existe
  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'L''utilisateur n''existe pas';
  END IF;

  -- Vérifier que la session existe
  SELECT created_by INTO v_session_created_by
  FROM public.dhikr_sessions
  WHERE id = p_session_id;

  IF v_session_created_by IS NULL THEN
    RAISE EXCEPTION 'La session n''existe pas';
  END IF;

  -- Vérifier si l'utilisateur est admin (nécessite la fonction is_user_admin)
  -- Si la fonction n'existe pas, on vérifie seulement si c'est le créateur
  BEGIN
    SELECT public.is_user_admin(p_user_id) INTO v_user_is_admin;
  EXCEPTION
    WHEN OTHERS THEN
      v_user_is_admin := false;
  END;

  -- Vérifier les permissions : soit créateur, soit admin
  IF v_session_created_by != p_user_id AND NOT v_user_is_admin THEN
    RAISE EXCEPTION 'Vous ne pouvez supprimer que vos propres sessions ou être administrateur';
  END IF;

  -- Compter les participants avant suppression
  SELECT COUNT(*) INTO v_participants_count
  FROM public.dhikr_session_participants
  WHERE session_id = p_session_id;

  -- Supprimer les participants (ils seront automatiquement éjectés)
  DELETE FROM public.dhikr_session_participants
  WHERE session_id = p_session_id;

  -- Supprimer les clics en queue
  DELETE FROM public.dhikr_session_clicks
  WHERE session_id = p_session_id;

  -- Supprimer la session
  DELETE FROM public.dhikr_sessions
  WHERE id = p_session_id;

  -- Log pour debug (optionnel)
  RAISE NOTICE 'Session % supprimée par utilisateur %. % participant(s) éjecté(s).', 
    p_session_id, p_user_id, v_participants_count;

  RETURN true;
END;
$$;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.delete_dhikr_session(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_dhikr_session(UUID, UUID) TO anon;
```

## Vérification

Après avoir exécuté le script, vérifiez que la fonction existe :

```sql
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'delete_dhikr_session';
```

Vous devriez voir la fonction listée.

## Note

L'application utilise maintenant un système de fallback : si la fonction RPC n'existe pas, elle utilisera la méthode manuelle. Cependant, pour bénéficier de toutes les fonctionnalités (gestion des admins, éjection automatique), il est recommandé d'exécuter le script complet `admin-permissions-management.sql`.


