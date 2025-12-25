# ❄️ Guide d'Implémentation - Ambiance Secrète "Neige (ambiance Faïna)"

**Date :** 2025-01-27  
**Fonctionnalité :** Ambiance sonore exclusive pour utilisateurs spéciaux

---

## 🎯 Objectif

Créer une ambiance sonore secrète "Neige (ambiance Faïna)" accessible uniquement aux :
- **Admins** (comme actuellement)
- **Utilisateurs spéciaux** (nouveau rôle, entre normal et admin)

---

## 📋 TODO List Complète

### Phase 1 : Base de données Supabase

#### ✅ 1.1 Créer la table `user_roles`
```sql
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN ('admin', 'special', 'normal')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_type ON public.user_roles(role_type);
```

#### ✅ 1.2 Créer les RLS Policies
```sql
-- Les utilisateurs peuvent voir leur propre rôle
CREATE POLICY "Users can view own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (
        email = 'pro.ibrahima00@gmail.com'
        OR email = 'admin@admin.com'
        OR (raw_user_meta_data->>'is_admin')::boolean = true
      )
    )
  );

-- Les admins peuvent modifier les rôles
CREATE POLICY "Admins can modify roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (
        email = 'pro.ibrahima00@gmail.com'
        OR email = 'admin@admin.com'
        OR (raw_user_meta_data->>'is_admin')::boolean = true
      )
    )
  );
```

#### ✅ 1.3 Créer la fonction RPC `is_user_special`
```sql
CREATE OR REPLACE FUNCTION public.is_user_special(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN := false;
  v_is_special BOOLEAN := false;
BEGIN
  -- Utiliser l'ID fourni ou l'ID de l'utilisateur actuel
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Vérifier si l'utilisateur est admin
  v_is_admin := public.is_user_admin(v_user_id);
  
  IF v_is_admin THEN
    -- Les admins ont automatiquement accès aux fonctionnalités spéciales
    RETURN true;
  END IF;

  -- Vérifier si l'utilisateur a le rôle 'special'
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_user_id
    AND role_type = 'special'
  ) INTO v_is_special;

  RETURN v_is_special;
END;
$$;
```

#### ✅ 1.4 Créer la fonction RPC `grant_special_role`
```sql
CREATE OR REPLACE FUNCTION public.grant_special_role(
  p_user_email TEXT,
  p_granted_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_granted_by_id UUID;
  v_current_user_is_admin BOOLEAN;
BEGIN
  -- Vérifier que l'utilisateur actuel est admin
  v_granted_by_id := COALESCE(p_granted_by, auth.uid());
  v_current_user_is_admin := public.is_user_admin(v_granted_by_id);
  
  IF NOT v_current_user_is_admin THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent attribuer le rôle spécial';
  END IF;

  -- Trouver l'utilisateur par email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non trouvé avec l''email: %', p_user_email;
  END IF;

  -- Insérer ou mettre à jour le rôle
  INSERT INTO public.user_roles (user_id, role_type, granted_by)
  VALUES (v_user_id, 'special', v_granted_by_id)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    role_type = 'special',
    granted_by = v_granted_by_id,
    granted_at = NOW(),
    updated_at = NOW();

  RETURN true;
END;
$$;
```

#### ✅ 1.5 Créer la fonction RPC `revoke_special_role`
```sql
CREATE OR REPLACE FUNCTION public.revoke_special_role(p_user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_current_user_is_admin BOOLEAN;
BEGIN
  -- Vérifier que l'utilisateur actuel est admin
  v_current_user_is_admin := public.is_user_admin(auth.uid());
  
  IF NOT v_current_user_is_admin THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent retirer le rôle spécial';
  END IF;

  -- Trouver l'utilisateur par email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non trouvé avec l''email: %', p_user_email;
  END IF;

  -- Supprimer le rôle spécial (ou le mettre à 'normal')
  UPDATE public.user_roles
  SET role_type = 'normal',
      updated_at = NOW()
  WHERE user_id = v_user_id
  AND role_type = 'special';

  RETURN true;
END;
$$;
```

---

### Phase 2 : Service TypeScript

#### ✅ 2.1 Créer `src/services/userRoles.ts`
```typescript
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'ayna_user_role';

export type UserRole = 'admin' | 'special' | 'normal';

export interface UserRoleData {
  role: UserRole;
  cachedAt: string;
}

/**
 * Vérifie si un utilisateur est spécial (admin ou role 'special')
 */
export async function isUserSpecial(userId?: string): Promise<boolean> {
  if (!supabase || !userId) {
    return false;
  }

  try {
    // Vérifier d'abord depuis le cache local
    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    if (cached) {
      const roleData: UserRoleData = JSON.parse(cached);
      // Cache valide pendant 1 heure
      const cacheAge = Date.now() - new Date(roleData.cachedAt).getTime();
      if (cacheAge < 3600000 && roleData.role !== 'normal') {
        return roleData.role === 'admin' || roleData.role === 'special';
      }
    }

    // Appeler la fonction RPC Supabase
    const { data, error } = await supabase.rpc('is_user_special', {
      p_user_id: userId
    });

    if (error) {
      // Si la fonction n'existe pas encore, vérifier manuellement
      if (error.code === '42883' || error.message?.includes('does not exist')) {
        return await checkSpecialRoleManually(userId);
      }
      return false;
    }

    const isSpecial = data === true;

    // Mettre en cache
    if (isSpecial) {
      const roleData: UserRoleData = {
        role: 'special', // On ne sait pas si c'est admin ou special, mais on sait que c'est spécial
        cachedAt: new Date().toISOString()
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(roleData));
    }

    return isSpecial;
  } catch (error) {
    // Erreur silencieuse en production
    return false;
  }
}

/**
 * Vérification manuelle du rôle spécial (fallback)
 */
async function checkSpecialRoleManually(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role_type')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.role_type === 'special' || data.role_type === 'admin';
  } catch (error) {
    return false;
  }
}

/**
 * Attribuer le rôle spécial à un utilisateur (admin uniquement)
 */
export async function grantSpecialRole(userEmail: string): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    const { data, error } = await supabase.rpc('grant_special_role', {
      p_user_email: userEmail
    });

    if (error) {
      return false;
    }

    return data === true;
  } catch (error) {
    return false;
  }
}

/**
 * Retirer le rôle spécial d'un utilisateur (admin uniquement)
 */
export async function revokeSpecialRole(userEmail: string): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    const { data, error } = await supabase.rpc('revoke_special_role', {
      p_user_email: userEmail
    });

    if (error) {
      return false;
    }

    return data === true;
  } catch (error) {
    return false;
  }
}

/**
 * Vider le cache du rôle utilisateur
 */
export async function clearRoleCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Erreur silencieuse
  }
}
```

---

### Phase 3 : Ajout de l'ambiance "Neige"

#### ✅ 3.1 Ajouter l'ambiance dans `src/data/khalwaData.ts`

```typescript
// Dans soundAmbiances array, ajouter :
{
  id: 'neige-faina',
  name: 'Neige (ambiance Faïna)',
  icon: '❄️',
  description: 'Ambiance secrète - Neige apaisante'
}

// Dans soundAmbianceFiles, ajouter :
'neige-faina': '/son/faina.mp3',

// Dans THEME_CONFIG, ajouter :
'neige-faina': {
  id: 'neige-faina',
  name: 'Neige (ambiance Faïna)',
  backgroundGradient: 'linear-gradient(180deg, #2d3a4a 0%, #4a5a6a 50%, #2d3a4a 100%)',
  primaryColor: '#87ceeb',
  accentColor: '#b0e0e6',
  textColor: '#f0f8ff',
  textSecondaryColor: '#d3e0e6',
  cardBackground: 'rgba(135, 206, 235, 0.15)',
  cardBorderColor: 'rgba(176, 224, 230, 0.3)',
  buttonBackground: 'rgba(135, 206, 235, 0.2)',
  buttonTextColor: '#f0f8ff',
  icon: '❄️',
  decorativeIcons: ['❄️', '🌨️', '⛄', '❄️', '🌨️', '❄️']
}
```

#### ✅ 3.2 Fichier audio ✅
- ✅ Le fichier `faina.mp3` est présent dans `application/assets/sounds/`
- ✅ Le code est configuré pour utiliser `faina.mp3`

---

### Phase 4 : Intégration dans UserContext

#### ✅ 4.1 Ajouter `isSpecial` dans `UserProfile`
```typescript
export interface UserProfile {
  // ... existing fields
  isAdmin?: boolean;
  isSpecial?: boolean; // Nouveau champ
  // ... rest
}
```

#### ✅ 4.2 Ajouter la vérification dans `UserContext.tsx`
```typescript
import { isUserSpecial } from '@/services/userRoles';

// Dans le useEffect qui charge l'utilisateur :
useEffect(() => {
  // ... existing code
  const checkSpecialRole = async () => {
    if (user?.id) {
      const special = await isUserSpecial(user.id);
      setUser(prev => ({ ...prev, isSpecial: special }));
    }
  };
  checkSpecialRole();
}, [user?.id]);
```

---

### Phase 5 : Filtrage dans BaytAnNur

#### ✅ 5.1 Modifier `src/pages/BaytAnNur.tsx`
```typescript
import { useUser } from '@/contexts/UserContext';
import { soundAmbiances } from '@/data/khalwaData';

// Dans SoundScreen component :
function SoundScreen({ ... }) {
  const { user } = useUser();
  
  // Filtrer les ambiances selon le rôle
  const availableAmbiances = soundAmbiances.filter((a) => {
    // Toujours afficher silence
    if (a.id === 'silence') return true;
    
    // Ambiance secrète : seulement pour admins et utilisateurs spéciaux
    if (a.id === 'neige-faina') {
      return user?.isAdmin === true || user?.isSpecial === true;
    }
    
    // Autres ambiances : pour tous
    return true;
  });
  
  // ... rest of component
}
```

---

### Phase 6 : Script SQL pour attribuer le rôle

#### ✅ 6.1 Créer `scripts/grant-special-role.sql`
```sql
-- Script pour attribuer le rôle 'special' à un utilisateur
-- Usage: Remplacer 'user@example.com' par l'email de l'utilisateur

-- Option 1: Via fonction RPC (recommandé)
SELECT public.grant_special_role('user@example.com');

-- Option 2: Directement dans la table (si fonction non disponible)
INSERT INTO public.user_roles (user_id, role_type)
SELECT id, 'special'
FROM auth.users
WHERE email = 'user@example.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
  role_type = 'special',
  updated_at = NOW();

-- Vérifier que le rôle a été attribué
SELECT 
  u.email,
  ur.role_type,
  ur.granted_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'user@example.com';
```

---

### Phase 7 : Interface Admin (optionnel)

#### ✅ 7.1 Créer une page ou section dans AdminBans
```typescript
// Dans AdminBans.tsx ou nouvelle page AdminRoles.tsx
import { grantSpecialRole, revokeSpecialRole } from '@/services/userRoles';

// Ajouter une section pour gérer les rôles spéciaux
// - Liste des utilisateurs avec rôle spécial
// - Formulaire pour attribuer le rôle par email
// - Bouton pour retirer le rôle
```

---

## 📝 Checklist d'Implémentation

### Base de données
- [ ] Exécuter le script SQL pour créer la table `user_roles`
- [ ] Exécuter le script SQL pour créer les RLS policies
- [ ] Exécuter le script SQL pour créer les fonctions RPC
- [ ] Tester les fonctions RPC dans Supabase SQL Editor

### Code TypeScript
- [ ] Créer `src/services/userRoles.ts`
- [ ] Modifier `src/data/khalwaData.ts` pour ajouter l'ambiance "Neige"
- [ ] Modifier `src/contexts/UserContext.tsx` pour ajouter `isSpecial`
- [ ] Modifier `src/pages/BaytAnNur.tsx` pour filtrer les ambiances
- [x] Fichier audio `faina.mp3` présent dans `assets/sounds/`

### Attribution du rôle
- [ ] Exécuter le script SQL pour attribuer le rôle à l'utilisateur spécifique
- [ ] Vérifier que l'utilisateur voit l'ambiance "Neige" dans Bayt An Nûr

### Tests
- [ ] Tester avec un utilisateur normal (ne doit pas voir "Neige")
- [ ] Tester avec un utilisateur spécial (doit voir "Neige")
- [ ] Tester avec un admin (doit voir "Neige")
- [ ] Tester la mise en cache du rôle
- [ ] Tester la synchronisation offline/online

---

## 🎨 Détails de l'Ambiance "Neige"

### Thème visuel
- **Couleurs** : Bleu-gris clair, blanc, accents bleu ciel
- **Gradient** : Du bleu-gris foncé au bleu-gris clair
- **Icônes décoratives** : ❄️ 🌨️ ⛄ ❄️ 🌨️ ❄️

### Fichier audio
- **Nom** : `faina.mp3`
- **Emplacement** : `application/assets/sounds/faina.mp3`
- **Description** : Son de neige qui tombe, ambiance apaisante

---

## 🔐 Sécurité

### RLS Policies
- Les utilisateurs ne peuvent voir que leur propre rôle
- Seuls les admins peuvent modifier les rôles
- Les fonctions RPC vérifient les permissions

### Cache
- Le cache du rôle est valide pendant 1 heure
- Le cache est vidé lors de la déconnexion
- Le cache peut être invalidé manuellement

---

## 📚 Documentation

Après l'implémentation, mettre à jour :
- `ANALYSE_BAYT_AN_NUR.md` : Documenter l'ambiance secrète
- `ANALYSE_COMPLETE_STRUCTURE_PROJET.md` : Documenter le système de rôles

---

**Fin du guide d'implémentation**

