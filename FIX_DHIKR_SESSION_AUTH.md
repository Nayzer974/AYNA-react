# Correction : Permettre aux utilisateurs connectés (même sans email vérifié) de créer des sessions de dhikr

## Problème

L'utilisateur recevait l'erreur "vous devez être connecté pour créer une session" alors qu'il était connecté. Le problème venait du fait que la fonction RPC `create_dhikr_session` utilisait `auth.uid()` qui peut retourner `NULL` même si l'utilisateur est connecté (par exemple, si l'email n'est pas vérifié).

## Solution

### 1. Modification de la fonction RPC

La fonction RPC `create_dhikr_session` a été modifiée pour accepter un paramètre optionnel `p_user_id`. Si ce paramètre est fourni, il est utilisé au lieu de `auth.uid()`. Cela permet aux utilisateurs connectés (même sans email vérifié) de créer des sessions.

**Fichier**: `scripts/fix-create-dhikr-session-auth.sql`

**Changements**:
- Ajout du paramètre `p_user_id UUID DEFAULT NULL`
- Logique pour utiliser `p_user_id` si fourni, sinon utiliser `auth.uid()`
- Vérification que l'utilisateur existe dans `auth.users` avant de créer la session

### 2. Modification du code client

Le code client (`src/services/dhikrSessions.ts`) a été modifié pour :
- Obtenir l'ID de l'utilisateur depuis `supabase.auth.getUser()` avant d'appeler la fonction RPC
- Passer explicitement l'ID de l'utilisateur à la fonction RPC via le paramètre `p_user_id`

**Avantages**:
- Fonctionne même si l'email n'est pas vérifié
- Fonctionne même si `auth.uid()` retourne `NULL` dans la fonction RPC
- Plus fiable car on utilise directement l'ID de l'utilisateur depuis la session Supabase

## Instructions

1. **Exécuter le script SQL dans Supabase**:
   - Ouvrir le SQL Editor dans Supabase
   - Exécuter le contenu de `scripts/fix-create-dhikr-session-auth.sql`
   - Vérifier que la fonction a été mise à jour

2. **Tester la création de session**:
   - Se connecter (même sans vérifier l'email)
   - Essayer de créer une session de dhikr
   - La session devrait être créée avec succès

## Code modifié

### Fonction RPC (SQL)

```sql
CREATE OR REPLACE FUNCTION create_dhikr_session(
  p_dhikr_text TEXT,
  p_target_count INTEGER,
  p_max_participants INTEGER DEFAULT 100,
  p_session_type TEXT DEFAULT 'community',
  p_user_id UUID DEFAULT NULL  -- Nouveau paramètre optionnel
)
```

### Code client (TypeScript)

```typescript
// Obtenir l'ID de l'utilisateur depuis la session Supabase
const { data: { user }, error: userError } = await supabase.auth.getUser();

if (userError || !user?.id) {
  throw new Error('Vous devez être connecté pour créer une session de dhikr.');
}

// Passer explicitement l'ID de l'utilisateur à la fonction RPC
const { data, error } = await supabase.rpc('create_dhikr_session', {
  p_dhikr_text: dhikrText,
  p_target_count: finalTarget,
  p_max_participants: maxParticipants,
  p_session_type: 'community',
  p_user_id: user.id  // Passer explicitement l'ID
});
```

## Notes

- La fonction RPC reste rétrocompatible : si `p_user_id` n'est pas fourni, elle utilise `auth.uid()` comme avant
- La vérification que l'utilisateur existe dans `auth.users` est toujours effectuée pour garantir l'intégrité des données
- Cette solution fonctionne pour tous les utilisateurs connectés, qu'ils aient vérifié leur email ou non


