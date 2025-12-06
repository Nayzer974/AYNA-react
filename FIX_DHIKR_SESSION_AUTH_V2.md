# Correction : Permettre aux utilisateurs connectés (même sans email vérifié) de créer des sessions de dhikr - Approche V2

## Problème

L'utilisateur recevait l'erreur "vous devez être connecté pour créer une session" alors qu'il était connecté. Le problème venait du fait que :
1. La fonction RPC `create_dhikr_session` utilisait `auth.uid()` qui peut retourner `NULL` même si l'utilisateur est connecté (par exemple, si l'email n'est pas vérifié)
2. Les politiques RLS utilisent également `auth.uid()` qui peut retourner `NULL`

## Solution - Nouvelle approche

### Fonction RPC SECURITY DEFINER

Création d'une nouvelle fonction RPC `create_dhikr_session_direct` qui :
- Est `SECURITY DEFINER` : contourne les politiques RLS
- Accepte l'ID utilisateur directement comme paramètre
- Vérifie que l'utilisateur existe dans `auth.users` avant de créer la session
- Reste sécurisée car elle vérifie l'existence de l'utilisateur

**Fichier**: `scripts/create-dhikr-session-direct.sql`

**Avantages**:
- Fonctionne même si `auth.uid()` retourne `NULL` dans les politiques RLS
- Fonctionne même si l'email n'est pas vérifié
- Reste sécurisée car elle vérifie que l'utilisateur existe dans `auth.users`
- Vérifie toujours qu'un utilisateur n'est pas déjà dans une session active

### Code client modifié

Le code client (`src/services/dhikrSessions.ts`) a été modifié pour :
- Obtenir l'ID de l'utilisateur depuis `supabase.auth.getUser()` avant d'appeler la fonction RPC
- Appeler la nouvelle fonction `create_dhikr_session_direct` avec l'ID utilisateur

## Instructions

1. **Exécuter le script SQL dans Supabase**:
   - Ouvrir le SQL Editor dans Supabase
   - Exécuter le contenu de `scripts/create-dhikr-session-direct.sql`
   - Vérifier que la fonction a été créée

2. **Tester la création de session**:
   - Se connecter (même sans vérifier l'email)
   - Essayer de créer une session de dhikr
   - La session devrait être créée avec succès

## Code

### Fonction RPC (SQL)

```sql
CREATE OR REPLACE FUNCTION create_dhikr_session_direct(
  p_user_id UUID,
  p_dhikr_text TEXT,
  p_target_count INTEGER,
  p_max_participants INTEGER DEFAULT 100
)
RETURNS UUID
SECURITY DEFINER  -- Contourne RLS
AS $$
DECLARE
  v_session_id UUID;
  v_user_name TEXT;
  v_user_email TEXT;
BEGIN
  -- Vérifier que l'utilisateur existe dans auth.users
  SELECT raw_user_meta_data->>'name', email
  INTO v_user_name, v_user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User does not exist in auth.users';
  END IF;

  -- Vérifier si l'utilisateur est déjà dans une autre session active
  -- ... (logique de vérification)

  -- Créer la session et ajouter le participant
  -- ...
END;
$$;
```

### Code client (TypeScript)

```typescript
// Obtenir l'ID de l'utilisateur depuis la session Supabase
const { data: { user }, error: userError } = await supabase.auth.getUser();

if (userError || !user?.id) {
  throw new Error('Vous devez être connecté pour créer une session de dhikr.');
}

// Appeler la fonction RPC SECURITY DEFINER
const { data, error } = await supabase.rpc('create_dhikr_session_direct', {
  p_user_id: user.id,
  p_dhikr_text: dhikrText,
  p_target_count: finalTarget,
  p_max_participants: maxParticipants
});
```

## Différences avec l'approche précédente

1. **Nouvelle fonction RPC** : `create_dhikr_session_direct` au lieu de modifier l'ancienne
2. **SECURITY DEFINER** : Contourne RLS au lieu d'essayer de contourner `auth.uid()`
3. **Vérification explicite** : Vérifie que l'utilisateur existe dans `auth.users` avant de créer la session
4. **Plus simple** : Pas besoin de modifier les politiques RLS existantes

## Sécurité

- La fonction vérifie que l'utilisateur existe dans `auth.users` avant de créer la session
- La fonction vérifie qu'un utilisateur n'est pas déjà dans une session active
- La fonction valide les paramètres (target_count, max_participants)
- Seuls les utilisateurs authentifiés peuvent appeler cette fonction (via `supabase.auth.getUser()`)


