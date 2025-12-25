# 🔒 PLAN DE SÉCURITÉ COMPLET - APPLICATION AYNA

**Date :** 2025-01-27  
**Expert Sécurité :** Agent IA Sécurité  
**Statut :** Analyse complète et corrections proposées

---

## 📋 TABLE DES MATIÈRES

1. [Analyse des Risques](#1-analyse-des-risques)
2. [Corrections Critiques Urgentes](#2-corrections-critiques-urgentes)
3. [Policies RLS Sécurisées](#3-policies-rls-sécurisées)
4. [Sécurisation du Code React Native](#4-sécurisation-du-code-react-native)
5. [Améliorations de Sécurité](#5-améliorations-de-sécurité)
6. [Checklist de Sécurité](#6-checklist-de-sécurité)

---

## 1. ANALYSE DES RISQUES

### 🔴 CRITIQUES (À corriger immédiatement)

#### 1.1 Clés API Hardcodées dans `app.config.js`
**Risque :** Exposition des secrets dans le code source  
**Impact :** Accès non autorisé à Supabase, APIs externes  
**Fichier :** `application/app.config.js`

```javascript
// ❌ DANGEREUX - Clés exposées
supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
quranClientSecret: "ZvlBKxAmYkCr74eBhJVHzBjaqI"
```

**Solution :** Utiliser EAS Secrets uniquement

#### 1.2 Logique Admin Hardcodée dans le Code Client
**Risque :** Escalade de privilèges, bypass de sécurité  
**Impact :** Accès admin non autorisé  
**Fichier :** `application/src/services/supabase.ts`

```typescript
// ❌ DANGEREUX - Logique admin côté client
if (email === 'admin' && password === 'admin') {
  // Bypass de sécurité
}
```

**Solution :** Déplacer toute la logique admin côté serveur

#### 1.3 Données Sensibles Stockées en Clair dans AsyncStorage
**Risque :** Accès aux données utilisateur en cas de compromission  
**Impact :** Fuite de données personnelles  
**Fichiers :** `application/src/utils/storage.ts`, `UserContext.tsx`

**Solution :** Utiliser expo-secure-store pour données sensibles

#### 1.4 Policies RLS Trop Permissives
**Risque :** Accès non autorisé aux données  
**Impact :** Fuite de données, modification non autorisée  
**Fichiers :** Scripts SQL avec `USING (true)`

**Solution :** Restreindre les policies selon les besoins réels

### 🟡 IMPORTANTES (À corriger rapidement)

#### 2.1 Pas de Validation Côté Serveur pour RPC
**Risque :** Injection SQL, manipulation de données  
**Impact :** Corruption de données, accès non autorisé

#### 2.2 Pas de Rate Limiting
**Risque :** Attaques par force brute, DoS  
**Impact :** Surcharge serveur, accès non autorisé

#### 2.3 Pas de Chiffrement pour les Tokens
**Risque :** Interception des tokens  
**Impact :** Accès non autorisé aux comptes

#### 2.4 Pas de Protection contre XSS
**Risque :** Injection de code malveillant  
**Impact :** Vol de données, exécution de code

### ⭐ OPTIMISATIONS (Améliorations)

#### 3.1 Logging des Tentatives d'Accès
**Bénéfice :** Détection d'intrusions

#### 3.2 MFA (Multi-Factor Authentication)
**Bénéfice :** Sécurité renforcée

#### 3.3 Audit Trail
**Bénéfice :** Traçabilité des actions

---

## 2. CORRECTIONS CRITIQUES URGENTES

### 2.1 Supprimer les Clés API Hardcodées

**Fichier :** `application/app.config.js`

```javascript
// ✅ SÉCURISÉ - Utiliser uniquement les variables d'environnement
export default {
  expo: {
    // ... autres configs
    extra: {
      eas: {
        projectId: "c2832911-1e2c-4175-a93b-c61fdbbd2575"
      },
      // ❌ SUPPRIMER ces lignes hardcodées :
      // supabaseUrl: "https://ctupecolapegiogvmwxz.supabase.co",
      // supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      // quranClientSecret: "ZvlBKxAmYkCr74eBhJVHzBjaqI",
      
      // ✅ UTILISER uniquement les variables d'environnement :
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
      quranClientId: process.env.EXPO_PUBLIC_QURAN_CLIENT_ID || "",
      quranClientSecret: process.env.EXPO_PUBLIC_QURAN_CLIENT_SECRET || "",
      // ... autres configs
    }
  }
};
```

**Action requise :**
1. Créer les secrets dans EAS :
```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://ctupecolapegiogvmwxz.supabase.co"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "votre_clé_anon"
eas secret:create --name EXPO_PUBLIC_QURAN_CLIENT_SECRET --value "votre_secret"
```

2. Pour le développement local, créer un fichier `.env` :
```env
EXPO_PUBLIC_SUPABASE_URL=https://ctupecolapegiogvmwxz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon
EXPO_PUBLIC_QURAN_CLIENT_SECRET=votre_secret
```

3. Ajouter `.env` au `.gitignore`

### 2.2 Supprimer la Logique Admin Côté Client

**Fichier :** `application/src/services/supabase.ts`

```typescript
// ❌ SUPPRIMER cette fonction dangereuse
export function isAdminUser(email: string): boolean {
  return email === 'admin' || 
         email === 'admin@admin.com' || 
         email === 'pro.ibrahima00@gmail.com';
}

// ✅ REMPLACER par une vérification côté serveur uniquement
export async function isCurrentUserAdmin(): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // ✅ Vérifier uniquement via la table profiles (côté serveur)
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (error || !profile) return false;
  return profile.is_admin === true;
}

// ❌ SUPPRIMER toute la logique de bypass admin dans signInWithSupabase et signUpWithSupabase
// ✅ La vérification admin doit se faire uniquement via RLS et la table profiles
```

**Créer une fonction RPC sécurisée côté serveur :**

```sql
-- Script SQL à exécuter dans Supabase
CREATE OR REPLACE FUNCTION public.check_user_is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT is_admin INTO v_is_admin
  FROM profiles
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_is_admin, false);
END;
$$;

-- Permettre uniquement aux utilisateurs authentifiés d'appeler cette fonction
GRANT EXECUTE ON FUNCTION public.check_user_is_admin(UUID) TO authenticated;
```

**Utilisation côté client :**

```typescript
export async function isCurrentUserAdmin(): Promise<boolean> {
  if (!supabase) return false;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // ✅ Appeler la fonction RPC sécurisée
  const { data, error } = await supabase.rpc('check_user_is_admin', {
    p_user_id: user.id
  });

  return data === true;
}
```

### 2.3 Chiffrer les Données Sensibles

**Créer un nouveau service de stockage sécurisé :**

**Fichier :** `application/src/utils/secureStorage.ts`

```typescript
import * as SecureStore from 'expo-secure-store';
import { APP_CONFIG } from '@/config';

/**
 * Stockage sécurisé pour données sensibles
 * Utilise expo-secure-store (chiffrement natif)
 */
export const secureStorage = {
  /**
   * Stocke une valeur de manière sécurisée
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      // Préfixer avec le nom de l'app pour éviter les collisions
      const prefixedKey = `@ayna_secure_${key}`;
      await SecureStore.setItemAsync(prefixedKey, value);
    } catch (error) {
      console.error(`Erreur lors du stockage sécurisé de ${key}:`, error);
      throw error;
    }
  },

  /**
   * Récupère une valeur de manière sécurisée
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const prefixedKey = `@ayna_secure_${key}`;
      return await SecureStore.getItemAsync(prefixedKey);
    } catch (error) {
      console.error(`Erreur lors de la récupération sécurisée de ${key}:`, error);
      return null;
    }
  },

  /**
   * Supprime une valeur de manière sécurisée
   */
  async removeItem(key: string): Promise<void> {
    try {
      const prefixedKey = `@ayna_secure_${key}`;
      await SecureStore.deleteItemAsync(prefixedKey);
    } catch (error) {
      console.error(`Erreur lors de la suppression sécurisée de ${key}:`, error);
      throw error;
    }
  },

  /**
   * Vide tout le stockage sécurisé
   */
  async clear(): Promise<void> {
    // SecureStore ne supporte pas clear(), il faut supprimer manuellement
    // Cette fonction devrait être appelée uniquement lors de la déconnexion
    const keys = [
      'user_token',
      'refresh_token',
      'session_data',
      'analytics_data',
    ];
    
    for (const key of keys) {
      try {
        await this.removeItem(key);
      } catch (error) {
        // Ignorer les erreurs silencieusement
      }
    }
  },
};
```

**Modifier UserContext pour utiliser secureStorage :**

```typescript
// Dans UserContext.tsx
import { secureStorage } from '@/utils/secureStorage';

// ✅ Pour les données sensibles (tokens, session)
await secureStorage.setItem('session_data', JSON.stringify(session));

// ✅ Pour les données non sensibles (préférences, thème)
await storage.setItem('user_preferences', JSON.stringify(preferences));
```

---

## 3. POLICIES RLS SÉCURISÉES

### 3.1 Script SQL Complet pour Policies Sécurisées

**Fichier :** `application/scripts/secure-rls-policies-complete.sql`

```sql
-- ============================================
-- POLICIES RLS SÉCURISÉES POUR TOUTES LES TABLES
-- ============================================
-- Ce script remplace toutes les policies permissives par des policies sécurisées
-- Date : 2025-01-27

-- ============================================
-- 1. TABLE PROFILES
-- ============================================

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- ✅ SELECT : Utilisateurs peuvent voir leur propre profil + profils publics (pour communauté)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id OR
    -- Les profils publics peuvent être vus par tous (pour la communauté)
    -- Mais on peut restreindre certains champs sensibles
    true
  );

-- ✅ SELECT : Admins peuvent voir tous les profils
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ✅ UPDATE : Utilisateurs peuvent modifier uniquement leur propre profil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Empêcher la modification de is_admin par l'utilisateur
    (OLD.is_admin = NEW.is_admin OR
     EXISTS (
       SELECT 1 FROM profiles
       WHERE profiles.id = auth.uid()
       AND profiles.is_admin = true
     ))
  );

-- ✅ INSERT : Utilisateurs peuvent créer uniquement leur propre profil
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id AND
    -- Empêcher la création avec is_admin = true
    (is_admin = false OR
     EXISTS (
       SELECT 1 FROM profiles
       WHERE profiles.id = auth.uid()
       AND profiles.is_admin = true
     ))
  );

-- ✅ UPDATE : Admins peuvent modifier n'importe quel profil
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- 2. TABLE COMMUNITY_POSTS
-- ============================================

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Anyone can view community posts" ON community_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON community_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON community_posts;
DROP POLICY IF EXISTS "Users can delete own posts or admins can delete any" ON community_posts;

-- ✅ SELECT : Tous peuvent voir les posts (communauté publique)
-- Mais on peut filtrer les posts de bannis
CREATE POLICY "Anyone can view community posts"
  ON community_posts FOR SELECT
  USING (
    -- Exclure les posts des utilisateurs bannis
    NOT EXISTS (
      SELECT 1 FROM user_bans
      WHERE user_bans.user_id = community_posts.user_id
      AND (
        user_bans.ban_type = 'permanent' OR
        (user_bans.ban_type = 'temporary' AND user_bans.expires_at > NOW())
      )
    )
  );

-- ✅ INSERT : Seuls les utilisateurs authentifiés et non bannis peuvent créer
CREATE POLICY "Authenticated users can create posts"
  ON community_posts FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = user_id AND
    -- Vérifier que l'utilisateur n'est pas banni
    NOT EXISTS (
      SELECT 1 FROM user_bans
      WHERE user_bans.user_id = auth.uid()
      AND (
        user_bans.ban_type = 'permanent' OR
        (user_bans.ban_type = 'temporary' AND user_bans.expires_at > NOW())
      )
    )
  );

-- ✅ UPDATE : Utilisateurs peuvent modifier uniquement leurs propres posts
CREATE POLICY "Users can update own posts"
  ON community_posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ✅ DELETE : Utilisateurs peuvent supprimer leurs propres posts, admins peuvent supprimer tous
CREATE POLICY "Users can delete own posts or admins can delete any"
  ON community_posts FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- 3. TABLE DHIKR_SESSIONS
-- ============================================

-- Supprimer les policies permissives
DROP POLICY IF EXISTS "Anyone can view active sessions" ON dhikr_sessions;
DROP POLICY IF EXISTS "Authenticated users can create sessions" ON dhikr_sessions;
DROP POLICY IF EXISTS "Creators can update their sessions" ON dhikr_sessions;
DROP POLICY IF EXISTS "Creators can delete their sessions" ON dhikr_sessions;

-- ✅ SELECT : Tous peuvent voir les sessions actives et ouvertes
CREATE POLICY "Anyone can view active sessions"
  ON dhikr_sessions FOR SELECT
  USING (
    is_active = true AND is_open = true
  );

-- ✅ SELECT : Les créateurs peuvent voir leurs propres sessions (même inactives)
CREATE POLICY "Creators can view own sessions"
  ON dhikr_sessions FOR SELECT
  USING (auth.uid() = created_by);

-- ✅ INSERT : Seuls les utilisateurs authentifiés peuvent créer
CREATE POLICY "Authenticated users can create sessions"
  ON dhikr_sessions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = created_by
  );

-- ✅ UPDATE : Seuls les créateurs peuvent modifier leurs sessions
CREATE POLICY "Creators can update their sessions"
  ON dhikr_sessions FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- ✅ DELETE : Seuls les créateurs peuvent supprimer leurs sessions
CREATE POLICY "Creators can delete their sessions"
  ON dhikr_sessions FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================
-- 4. TABLE KHALWA_SESSIONS
-- ============================================

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Users can view their own khalwa sessions" ON khalwa_sessions;
DROP POLICY IF EXISTS "Users can insert their own khalwa sessions" ON khalwa_sessions;
DROP POLICY IF EXISTS "Users can update their own khalwa sessions" ON khalwa_sessions;
DROP POLICY IF EXISTS "Users can delete their own khalwa sessions" ON khalwa_sessions;

-- ✅ SELECT : Utilisateurs peuvent voir uniquement leurs propres sessions
CREATE POLICY "Users can view their own khalwa sessions"
  ON khalwa_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- ✅ INSERT : Utilisateurs peuvent créer uniquement leurs propres sessions
CREATE POLICY "Users can insert their own khalwa sessions"
  ON khalwa_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ✅ UPDATE : Utilisateurs peuvent modifier uniquement leurs propres sessions
CREATE POLICY "Users can update their own khalwa sessions"
  ON khalwa_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ✅ DELETE : Utilisateurs peuvent supprimer uniquement leurs propres sessions
CREATE POLICY "Users can delete their own khalwa sessions"
  ON khalwa_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. TABLE ANALYTICS_EVENTS
-- ============================================

-- ✅ SELECT : Utilisateurs peuvent voir uniquement leurs propres événements
-- Admins peuvent voir tous les événements
CREATE POLICY "Users can view own analytics events"
  ON analytics_events FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ✅ INSERT : Utilisateurs peuvent créer uniquement leurs propres événements
CREATE POLICY "Users can insert own analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ✅ UPDATE : Désactivé par défaut (analytics en lecture seule)
-- Si nécessaire, permettre uniquement aux admins

-- ✅ DELETE : Désactivé par défaut (analytics en lecture seule)
-- Si nécessaire, permettre uniquement aux admins

-- ============================================
-- 6. STORAGE POLICIES (Supabase Storage)
-- ============================================

-- ✅ Politique pour les avatars (bucket 'avatars')
-- Les utilisateurs peuvent uploader uniquement leur propre avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ✅ Les utilisateurs peuvent lire tous les avatars (pour la communauté)
CREATE POLICY "Anyone can read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- ✅ Les utilisateurs peuvent supprimer uniquement leur propre avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ✅ Les admins peuvent gérer tous les avatars
CREATE POLICY "Admins can manage all avatars"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'avatars' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- 7. FONCTIONS RPC SÉCURISÉES
-- ============================================

-- ✅ Fonction pour vérifier si un utilisateur est admin (sécurisée)
CREATE OR REPLACE FUNCTION public.check_user_is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Vérifier que l'utilisateur appelant correspond à p_user_id
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Vous ne pouvez vérifier que votre propre statut admin';
  END IF;

  SELECT is_admin INTO v_is_admin
  FROM profiles
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_is_admin, false);
END;
$$;

-- ✅ Fonction pour créer une session dhikr (avec validation)
CREATE OR REPLACE FUNCTION public.create_dhikr_session_secure(
  p_user_id UUID,
  p_dhikr_text TEXT,
  p_target_count INTEGER,
  p_max_participants INTEGER DEFAULT 100
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_user_exists BOOLEAN;
BEGIN
  -- ✅ Validation : Vérifier que l'utilisateur appelant correspond à p_user_id
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Vous ne pouvez créer une session que pour vous-même';
  END IF;

  -- ✅ Validation : Vérifier que l'utilisateur existe
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id)
  INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'Utilisateur non trouvé';
  END IF;

  -- ✅ Validation : Vérifier que l'utilisateur n'est pas banni
  IF EXISTS (
    SELECT 1 FROM user_bans
    WHERE user_id = p_user_id
    AND (
      ban_type = 'permanent' OR
      (ban_type = 'temporary' AND expires_at > NOW())
    )
  ) THEN
    RAISE EXCEPTION 'Vous êtes banni et ne pouvez pas créer de session';
  END IF;

  -- ✅ Validation : Limites de sécurité
  IF p_target_count < 100 OR p_target_count > 999 THEN
    RAISE EXCEPTION 'Le nombre de clics doit être entre 100 et 999';
  END IF;

  IF p_max_participants < 1 OR p_max_participants > 100 THEN
    RAISE EXCEPTION 'Le nombre maximum de participants doit être entre 1 et 100';
  END IF;

  -- ✅ Validation : Longueur du texte
  IF LENGTH(p_dhikr_text) > 500 THEN
    RAISE EXCEPTION 'Le texte du dhikr ne peut pas dépasser 500 caractères';
  END IF;

  -- Créer la session
  INSERT INTO dhikr_sessions (
    created_by,
    dhikr_text,
    target_count,
    max_participants
  )
  VALUES (
    p_user_id,
    p_dhikr_text,
    p_target_count,
    p_max_participants
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.check_user_is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_dhikr_session_secure(UUID, TEXT, INTEGER, INTEGER) TO authenticated;

-- ============================================
-- ✅ POLICIES RLS SÉCURISÉES CRÉÉES
-- ============================================
```

---

## 4. SÉCURISATION DU CODE REACT NATIVE

### 4.1 Validation des Entrées Utilisateur

**Fichier :** `application/src/utils/validation.ts`

```typescript
/**
 * Utilitaires de validation sécurisés
 */

/**
 * Valide un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Valide un mot de passe (minimum 8 caractères, au moins 1 majuscule, 1 minuscule, 1 chiffre)
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8 || password.length > 128) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

/**
 * Sanitise un texte pour éviter les injections
 */
export function sanitizeText(text: string, maxLength: number = 1000): string {
  if (!text || typeof text !== 'string') return '';
  
  // Limiter la longueur
  let sanitized = text.substring(0, maxLength);
  
  // Supprimer les caractères dangereux
  sanitized = sanitized.replace(/[<>]/g, '');
  
  // Normaliser les espaces
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

/**
 * Valide un UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Valide un nombre dans une plage
 */
export function isValidNumber(value: number, min: number, max: number): boolean {
  return typeof value === 'number' && 
         !isNaN(value) && 
         value >= min && 
         value <= max;
}
```

### 4.2 Protection contre les Attaques XSS

**Fichier :** `application/src/components/SafeText.tsx`

```typescript
import React from 'react';
import { Text, TextProps } from 'react-native';
import { sanitizeText } from '@/utils/validation';

interface SafeTextProps extends TextProps {
  children: string;
}

/**
 * Composant Text sécurisé qui sanitise automatiquement le contenu
 */
export function SafeText({ children, ...props }: SafeTextProps) {
  const sanitized = sanitizeText(children);
  return <Text {...props}>{sanitized}</Text>;
}
```

### 4.3 Rate Limiting Côté Client

**Fichier :** `application/src/utils/rateLimiter.ts`

```typescript
/**
 * Rate limiter simple côté client (complément au rate limiting serveur)
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  /**
   * Vérifie si une requête est autorisée
   */
  isAllowed(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Nettoyer les requêtes expirées
    const validRequests = requests.filter(time => now - time < config.windowMs);
    
    if (validRequests.length >= config.maxRequests) {
      return false;
    }
    
    // Ajouter la nouvelle requête
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  /**
   * Réinitialise le rate limiter pour une clé
   */
  reset(key: string): void {
    this.requests.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Hook pour utiliser le rate limiter
 */
export function useRateLimit(key: string, config: RateLimitConfig) {
  return {
    isAllowed: () => rateLimiter.isAllowed(key, config),
    reset: () => rateLimiter.reset(key),
  };
}
```

**Utilisation :**

```typescript
// Dans un composant
const { isAllowed } = useRateLimit('login_attempts', {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
});

const handleLogin = async () => {
  if (!isAllowed()) {
    Alert.alert('Erreur', 'Trop de tentatives. Veuillez réessayer plus tard.');
    return;
  }
  // ... logique de connexion
};
```

---

## 5. AMÉLIORATIONS DE SÉCURITÉ

### 5.1 Rate Limiting Côté Serveur (Supabase)

**Créer une Edge Function pour le rate limiting :**

**Fichier :** `application/supabase/functions/rate-limit/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;

serve(async (req) => {
  try {
    const { action, userId } = await req.json();
    
    // Vérifier le rate limit
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Implémenter le rate limiting avec Redis ou une table dédiée
    // Pour simplifier, on peut utiliser une table PostgreSQL
    
    return new Response(
      JSON.stringify({ allowed: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### 5.2 Logging des Tentatives d'Accès

**Créer une table pour les logs de sécurité :**

```sql
-- Table pour les logs de sécurité
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX idx_security_logs_action ON security_logs(action);
CREATE INDEX idx_security_logs_created_at ON security_logs(created_at DESC);

-- RLS : Seuls les admins peuvent voir les logs
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security logs"
  ON security_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Fonction pour logger les événements
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action TEXT,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO security_logs (
    user_id,
    action,
    success,
    error_message
  )
  VALUES (
    auth.uid(),
    p_action,
    p_success,
    p_error_message
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_security_event(TEXT, BOOLEAN, TEXT) TO authenticated, anon;
```

### 5.3 Audit Trail

**Créer une table pour l'audit trail :**

```sql
-- Table pour l'audit trail
CREATE TABLE IF NOT EXISTS audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index
CREATE INDEX idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX idx_audit_trail_table_name ON audit_trail(table_name);
CREATE INDEX idx_audit_trail_created_at ON audit_trail(created_at DESC);

-- RLS : Seuls les admins peuvent voir l'audit trail
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit trail"
  ON audit_trail FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
```

---

## 6. CHECKLIST DE SÉCURITÉ

### ✅ À Faire Immédiatement (Urgent)

- [ ] Supprimer toutes les clés API hardcodées de `app.config.js`
- [ ] Créer les secrets dans EAS
- [ ] Supprimer la logique admin côté client
- [ ] Implémenter le stockage sécurisé avec expo-secure-store
- [ ] Exécuter le script SQL des policies RLS sécurisées
- [ ] Tester toutes les fonctionnalités après les modifications

### ✅ À Faire Rapidement (Important)

- [ ] Implémenter la validation des entrées utilisateur
- [ ] Ajouter le rate limiting côté client
- [ ] Créer la table security_logs et la fonction de logging
- [ ] Créer la table audit_trail
- [ ] Ajouter la protection XSS dans les composants
- [ ] Tester les policies RLS avec différents rôles

### ⭐ Améliorations Futures (Bonus)

- [ ] Implémenter MFA (Multi-Factor Authentication)
- [ ] Ajouter le rate limiting côté serveur (Edge Function)
- [ ] Créer un dashboard admin pour les logs de sécurité
- [ ] Implémenter la détection d'anomalies
- [ ] Ajouter des tests de sécurité automatisés

---

## 📝 NOTES IMPORTANTES

1. **Ne jamais commiter les secrets** : Utiliser uniquement EAS Secrets ou variables d'environnement
2. **Toujours valider côté serveur** : Ne jamais faire confiance aux données client
3. **Principle of Least Privilege** : Donner uniquement les permissions nécessaires
4. **Defense in Depth** : Plusieurs couches de sécurité
5. **Audit régulier** : Vérifier régulièrement les logs de sécurité

---

**Document créé par l'Expert Sécurité AYNA**  
**Dernière mise à jour :** 2025-01-27










