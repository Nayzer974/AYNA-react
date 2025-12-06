# Guide de Gestion des Permissions Administrateur

Ce guide explique comment gérer les permissions administrateur dans Supabase pour l'application AYNA.

## Installation

1. Ouvrez le **Supabase SQL Editor**
2. Exécutez le script `admin-permissions-management.sql`
3. Vérifiez que toutes les fonctions ont été créées sans erreur

## Fonctions Disponibles

### 1. `is_user_admin(p_user_id UUID)`
Vérifie si un utilisateur est administrateur.

**Utilisation :**
```sql
SELECT public.is_user_admin('user-uuid-here');
```

### 2. `promote_to_admin(p_user_email TEXT)`
Promouvoit un utilisateur en administrateur en utilisant son email.

**Utilisation :**
```sql
SELECT public.promote_to_admin('user@example.com');
```

**Important :** Seuls les administrateurs peuvent utiliser cette fonction.

### 3. `promote_to_admin_by_id(p_user_id UUID)`
Promouvoit un utilisateur en administrateur en utilisant son ID.

**Utilisation :**
```sql
SELECT public.promote_to_admin_by_id('user-uuid-here');
```

**Important :** Seuls les administrateurs peuvent utiliser cette fonction.

### 4. `demote_from_admin(p_user_email TEXT)`
Retire les droits administrateur d'un utilisateur.

**Utilisation :**
```sql
SELECT public.demote_from_admin('user@example.com');
```

**Important :** 
- Seuls les administrateurs peuvent utiliser cette fonction
- Vous ne pouvez pas vous rétrograder vous-même

### 5. `list_admins()`
Liste tous les administrateurs du système.

**Utilisation :**
```sql
SELECT * FROM public.list_admins();
```

**Important :** Seuls les administrateurs peuvent utiliser cette fonction.

### 6. `delete_dhikr_session(p_session_id UUID, p_user_id UUID)`
Supprime une session de dhikr. Cette fonction vérifie automatiquement si l'utilisateur est le créateur ou un administrateur.

**Utilisation :**
```sql
SELECT public.delete_dhikr_session('session-uuid', 'user-uuid');
```

## Comment Promouvoir un Utilisateur en Admin

### Méthode 1 : Par Email (Recommandé)

1. Connectez-vous à Supabase avec un compte admin
2. Ouvrez le SQL Editor
3. Exécutez :
```sql
SELECT public.promote_to_admin('email-de-l-utilisateur@example.com');
```

### Méthode 2 : Par ID Utilisateur

1. Trouvez l'ID de l'utilisateur dans la table `auth.users`
2. Exécutez :
```sql
SELECT public.promote_to_admin_by_id('user-uuid-here');
```

### Méthode 3 : Directement dans auth.users (Avancé)

Si vous avez besoin de promouvoir le premier admin (pour initialiser le système) :

```sql
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('is_admin', true)
WHERE email = 'votre-email@example.com';
```

## Vérifier le Statut Admin d'un Utilisateur

```sql
-- Par ID
SELECT public.is_user_admin('user-uuid-here');

-- Par email (via une sous-requête)
SELECT public.is_user_admin(
  (SELECT id FROM auth.users WHERE email = 'user@example.com')
);
```

## Liste des Admins

```sql
SELECT * FROM public.list_admins();
```

## Résolution de Problèmes

### Erreur : "La session n'a pas pu être supprimée. Vérifiez vos permissions."

Cette erreur peut survenir si :
1. Votre compte n'est pas correctement marqué comme admin dans Supabase
2. La fonction `is_user_admin` ne reconnaît pas votre compte

**Solution :**
1. Vérifiez votre statut admin :
```sql
SELECT 
  id,
  email,
  raw_user_meta_data->>'is_admin' as is_admin_metadata,
  public.is_user_admin(id) as is_admin_function
FROM auth.users
WHERE email = 'votre-email@example.com';
```

2. Si `is_admin_function` retourne `false`, promouvez-vous en admin :
```sql
SELECT public.promote_to_admin('votre-email@example.com');
```

3. Si vous n'avez pas encore de compte admin, créez-en un d'abord :
```sql
-- Mettre à jour directement dans auth.users
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('is_admin', true)
WHERE email = 'votre-email@example.com';
```

### Erreur : "Seuls les administrateurs peuvent promouvoir d'autres utilisateurs"

Cette erreur signifie que vous n'êtes pas reconnu comme admin. Suivez les étapes de résolution ci-dessus.

## Emails Admin par Défaut

Les emails suivants sont automatiquement reconnus comme admin (même sans `is_admin` dans les métadonnées) :
- `admin@admin.com`
- `pro.ibrahima00@gmail.com`
- `admin`

## Notes Importantes

- Les fonctions utilisent `SECURITY DEFINER`, ce qui signifie qu'elles s'exécutent avec les privilèges du créateur de la fonction
- Les vérifications de permissions sont effectuées à l'intérieur des fonctions
- Les modifications dans `auth.users` peuvent prendre quelques secondes à se propager
- Après avoir promu un utilisateur, il devra peut-être se déconnecter et se reconnecter pour que les changements prennent effet dans l'application


