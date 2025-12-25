# Leçons Apprises : Gestion des Permissions et RLS dans Supabase

## 📋 Contexte Général
Ce document capture les leçons apprises lors de la gestion des permissions RLS (Row Level Security) dans Supabase, des fonctions RPC, et de la synchronisation temps réel.

---

## ❌ ERREURS PRINCIPALES ET LEÇONS

### 1. **Dépendance à `auth.uid()` dans les fonctions `SECURITY DEFINER`**

**Problème :**
```sql
-- ❌ MAUVAIS
CREATE FUNCTION my_function(...)
SECURITY DEFINER
AS $$
BEGIN
  v_user_id := auth.uid(); -- Retourne NULL dans SECURITY DEFINER !
  ...
END;
$$;
```

**Cause :**
- Dans une fonction `SECURITY DEFINER`, le contexte d'exécution change
- `auth.uid()` retourne `NULL` car la fonction s'exécute avec les privilèges du propriétaire, pas de l'utilisateur appelant
- Même si l'utilisateur est connecté dans l'application, `auth.uid()` peut être NULL

**Solution :**
```sql
-- ✅ BON
CREATE FUNCTION my_function(
  p_user_id UUID DEFAULT NULL  -- Toujours passer l'ID depuis le client
)
SECURITY DEFINER
AS $$
BEGIN
  -- Utiliser p_user_id au lieu de auth.uid()
  v_user_id := COALESCE(p_user_id, auth.uid());
  ...
END;
$$;
```

**Leçon Générale :**
- **Toujours passer l'ID utilisateur en paramètre** dans les fonctions RPC `SECURITY DEFINER`
- Ne jamais dépendre uniquement de `auth.uid()` dans ce contexte
- Le client a accès à l'ID utilisateur via le contexte applicatif, l'utiliser systématiquement
- **Principe :** Dans `SECURITY DEFINER`, le contexte utilisateur est perdu, toujours le restaurer via paramètres

---

### 2. **Politiques RLS qui ne gèrent pas les valeurs NULL**

**Problème :**
```sql
-- ❌ MAUVAIS
CREATE POLICY "Users can delete own items"
  FOR DELETE
  USING (auth.uid() = user_id);
  -- Échoue si user_id est NULL
```

**Cause :**
- La condition `auth.uid() = user_id` échoue si `user_id` est `NULL`
- Les comparaisons avec NULL en SQL retournent toujours NULL (falsy)
- Les politiques bloquent les opérations sur les enregistrements avec des valeurs NULL

**Solution :**
```sql
-- ✅ BON
CREATE POLICY "Users can delete own items"
  FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR
    (user_id IS NULL)  -- Gérer explicitement le cas NULL
  );
```

**Leçon Générale :**
- **Toujours gérer explicitement le cas NULL** dans les politiques RLS
- Tester avec des données NULL lors de la création des politiques
- Utiliser `IS NULL` / `IS NOT NULL` avant les comparaisons
- **Principe :** En SQL, NULL ≠ NULL, toujours vérifier explicitement

---

### 3. **Rechargement immédiat après suppression/modification**

**Problème :**
```typescript
// ❌ MAUVAIS
await supabase.from('table').delete().eq('id', itemId);
await loadData(); // Recharge immédiatement - l'item peut revenir !
```

**Cause :**
- Le Realtime peut déclencher un événement avant que la modification soit confirmée
- Le rechargement récupère l'item avant qu'il ne soit vraiment modifié/supprimé
- Race condition entre l'opération et le rechargement
- Problème de cache ou de synchronisation

**Solution :**
```typescript
// ✅ BON
// 1. Ajouter à une liste de tracking local
deletedItemsRef.current.add(itemId);

// 2. Mettre à jour l'état local immédiatement
setItems(items.filter(item => item.id !== itemId));

// 3. Filtrer les items trackés lors du rechargement
const formattedItems = data
  .filter(item => !deletedItemsRef.current.has(item.id))
  .map(...);

// 4. Ne PAS recharger immédiatement après suppression
// Laisser le Realtime ou le prochain chargement gérer
```

**Leçon Générale :**
- **Utiliser un système de tracking local** pour les éléments supprimés/modifiés
- **Ne jamais recharger immédiatement** après une suppression/modification
- Filtrer les éléments trackés lors de chaque chargement
- Nettoyer le tracking après un délai raisonnable
- **Principe :** Optimistic UI updates + tracking local = meilleure UX

---

### 4. **Vérification de session trop stricte côté client**

**Problème :**
```typescript
// ❌ MAUVAIS
const { data: { user: authUser } } = await supabase.auth.getUser();
if (!authUser) {
  Alert.alert('Erreur', 'Vous devez être connecté');
  return;
}
```

**Cause :**
- L'utilisateur peut être connecté dans l'app mais pas avoir de session Supabase active
- `supabase.auth.getUser()` peut échouer même si l'utilisateur est connecté
- Cela bloque des fonctionnalités qui devraient fonctionner
- Double vérification inutile

**Solution :**
```typescript
// ✅ BON
// Utiliser le contexte utilisateur de l'app, pas la session Supabase
if (!user?.id) {
  Alert.alert('Erreur', 'Vous devez être connecté');
  return;
}

// Laisser RLS gérer les permissions côté serveur
// Ne pas vérifier manuellement la session Supabase
```

**Leçon Générale :**
- **Faire confiance au contexte utilisateur de l'app** pour l'UI
- **Laisser RLS gérer les permissions** côté serveur
- Ne pas faire de double vérification inutile
- Si l'utilisateur est dans le contexte, il est "connecté" pour l'app
- **Principe :** Séparation des responsabilités - UI gère l'UX, RLS gère la sécurité

---

### 5. **Politique INSERT qui exige une correspondance stricte**

**Problème :**
```sql
-- ❌ MAUVAIS
CREATE POLICY "Users can create items"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  -- Bloque si auth.uid() est NULL
```

**Cause :**
- Les utilisateurs peuvent être connectés dans l'app mais pas dans Supabase
- `auth.uid()` peut être NULL même si l'utilisateur est connecté
- La politique bloque l'insertion pour les utilisateurs non authentifiés dans Supabase

**Solution :**
```sql
-- ✅ BON
CREATE POLICY "Anyone can insert items"
  FOR INSERT
  TO public
  WITH CHECK (true);  -- Permettre à tout le monde

-- OU avec vérification optionnelle
CREATE POLICY "Users can create items"
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL  -- Utilisateurs non authentifiés
    OR
    auth.uid() = user_id  -- Utilisateurs authentifiés
    OR
    user_id IS NULL  -- Items anonymes
  );
```

**Leçon Générale :**
- **Rendre les politiques INSERT permissives** si on veut permettre les utilisateurs non authentifiés
- Utiliser `WITH CHECK (true)` pour permettre à tous si nécessaire
- Gérer `user_id` avec `DEFAULT auth.uid()` pour auto-remplir si disponible
- **Principe :** Permettre par défaut, restreindre si nécessaire

---

### 6. **État de chargement qui reste bloqué**

**Problème :**
```typescript
// ❌ MAUVAIS
try {
  await loadData();
  setLoading(false);  // Seulement si succès
} catch (error) {
  // Pas de setLoading(false) ici !
}
```

**Cause :**
- Si une erreur se produit, `setLoading(false)` n'est jamais appelé
- L'écran reste bloqué sur le chargement
- L'utilisateur ne peut pas interagir avec l'app
- Mauvaise expérience utilisateur

**Solution :**
```typescript
// ✅ BON
try {
  await loadData();
} catch (error) {
  console.error('Erreur:', error);
  // Gérer l'erreur mais continuer
  setData([]); // Initialiser à une valeur par défaut
} finally {
  // TOUJOURS désactiver le loading, même en cas d'erreur
  setLoading(false);
  setRefreshing(false);
}
```

**Leçon Générale :**
- **Toujours utiliser `finally`** pour les états de chargement
- **Ne jamais laisser un état de chargement actif** en cas d'erreur
- Initialiser les données à des valeurs par défaut (tableau vide, null, etc.) en cas d'erreur
- **Principe :** Les états de chargement doivent toujours être désactivés, même en cas d'erreur

---

### 7. **Realtime qui recharge après suppression**

**Problème :**
```typescript
// ❌ MAUVAIS
channel.on('postgres_changes', { event: '*' }, async (payload) => {
  await loadData();  // Recharge même pour DELETE !
});
```

**Cause :**
- Le Realtime déclenche un événement DELETE après suppression
- Cela recharge les données, et si la suppression n'est pas encore persistée, l'item revient
- Crée une boucle de rechargement inutile
- Conflit entre l'opération manuelle et le Realtime

**Solution :**
```typescript
// ✅ BON
channel.on('postgres_changes', { event: '*' }, async (payload) => {
  const eventType = (payload as any).eventType || (payload as any).type;
  
  // Ignorer les événements DELETE
  if (mounted && eventType !== 'DELETE' && eventType !== 'delete') {
    await loadData();
  }
  // Les DELETE sont gérés manuellement dans les fonctions dédiées
});
```

**Leçon Générale :**
- **Filtrer les événements Realtime** selon le type
- **Ne pas recharger automatiquement** pour les DELETE
- Gérer les suppressions manuellement dans les fonctions dédiées
- **Principe :** Éviter les conflits entre opérations manuelles et Realtime

---

## ✅ PATTERNS RÉUSSIS ET BONNES PRATIQUES

### 1. **Système de tracking local pour les suppressions**

**Pattern :**
```typescript
const deletedItemsRef = useRef<Set<string>>(new Set());

// Ajouter lors de la suppression
deletedItemsRef.current.add(itemId);

// Filtrer lors du chargement
const formattedItems = data
  .filter(item => !deletedItemsRef.current.has(item.id))
  .map(...);

// Nettoyer après délai
setTimeout(() => {
  deletedItemsRef.current.delete(itemId);
}, 10 * 60 * 1000);
```

**Pourquoi ça marche :**
- Évite les problèmes de timing avec la DB
- Feedback instantané pour l'utilisateur
- Persiste entre les rechargements
- Nettoyage automatique après délai

**Principe :** Tracking local + filtrage = UX optimale

---

### 2. **Fonctions RPC avec paramètres utilisateur**

**Pattern :**
```sql
CREATE FUNCTION my_operation(
  p_item_id UUID,
  p_user_id UUID DEFAULT NULL  -- ID depuis le client
)
SECURITY DEFINER
SET search_path = public
AS $$
  -- Utiliser p_user_id, pas auth.uid()
  IF p_user_id = v_item_user_id THEN
    -- Opération autorisée
  END IF;
$$;
```

**Pourquoi ça marche :**
- Contourne les limitations de `auth.uid()` dans `SECURITY DEFINER`
- Permet aux utilisateurs connectés dans l'app mais pas dans Supabase
- Plus flexible et fiable

**Principe :** Passer l'ID utilisateur en paramètre plutôt que de dépendre du contexte

---

### 3. **Politiques RLS permissives pour INSERT/SELECT**

**Pattern :**
```sql
-- INSERT : Permettre à tous
CREATE POLICY "Anyone can insert items"
  FOR INSERT
  TO public
  WITH CHECK (true);

-- SELECT : Permettre à tous
CREATE POLICY "Anyone can view items"
  FOR SELECT
  TO public
  USING (true);
```

**Pourquoi ça marche :**
- Simplifie la logique côté client
- Permet les utilisateurs anonymes
- La sécurité est gérée par la logique métier, pas par RLS

**Principe :** Permettre par défaut, restreindre si nécessaire

---

### 4. **Gestion d'erreur avec logs détaillés**

**Pattern :**
```typescript
console.log('[Component] Action:', details);
console.log('[Component] Résultat:', result);
console.error('[Component] Erreur:', {
  code: error.code,
  message: error.message,
  details: error.details
});
```

**Pourquoi ça marche :**
- Facilite le débogage en production
- Permet de comprendre rapidement les problèmes
- Aide à identifier les patterns d'erreur

**Principe :** Logs structurés = débogage efficace

---

## 🎯 PRINCIPES DIRECTEURS GÉNÉRAUX

### 1. **Ne jamais dépendre de `auth.uid()` dans `SECURITY DEFINER`**
- Toujours passer l'ID utilisateur en paramètre
- Utiliser le contexte applicatif pour obtenir l'ID utilisateur
- Faire confiance aux paramètres passés depuis le client

### 2. **Toujours gérer le cas `NULL`**
- Tester avec des valeurs NULL lors de la création de politiques
- Ajouter des conditions explicites pour NULL
- Utiliser `IS NULL` / `IS NOT NULL` avant les comparaisons

### 3. **Utiliser un tracking local pour les suppressions**
- Ajouter à une liste de tracking immédiatement
- Filtrer lors de chaque chargement
- Nettoyer après un délai raisonnable

### 4. **Ne jamais recharger immédiatement après suppression**
- Mettre à jour l'état local
- Laisser le Realtime ou le prochain chargement gérer
- Utiliser un délai si nécessaire

### 5. **Toujours utiliser `finally` pour les états de chargement**
- Garantir que les états sont toujours réinitialisés
- Initialiser les données à des valeurs par défaut en cas d'erreur
- Éviter les écrans bloqués

### 6. **Filtrer les événements Realtime**
- Ignorer les DELETE dans les listeners Realtime
- Gérer les suppressions manuellement
- Éviter les rechargements inutiles

### 7. **Faire confiance au contexte applicatif**
- Utiliser le contexte utilisateur de l'app pour l'UI
- Laisser RLS gérer les permissions côté serveur
- Ne pas faire de double vérification inutile

### 8. **Politiques RLS permissives par défaut**
- Permettre INSERT/SELECT à tous si nécessaire
- Gérer la sécurité via la logique métier
- Simplifier la logique côté client

---

## 📚 PATTERNS RÉUTILISABLES

### Pattern 1 : Fonction RPC avec paramètre utilisateur
```sql
CREATE FUNCTION operation_name(
  p_item_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Utiliser p_user_id, pas auth.uid()
$$;
```

### Pattern 2 : Tracking local pour suppressions
```typescript
const deletedItemsRef = useRef<Set<string>>(new Set());
deletedItemsRef.current.add(itemId);
const filtered = data.filter(item => !deletedItemsRef.current.has(item.id));
```

### Pattern 3 : Gestion d'état de chargement robuste
```typescript
try {
  await loadData();
} catch (error) {
  setData([]);
} finally {
  setLoading(false);
}
```

### Pattern 4 : Politique RLS permissive
```sql
CREATE POLICY "Anyone can insert"
  FOR INSERT
  TO public
  WITH CHECK (true);
```

### Pattern 5 : Filtrage Realtime
```typescript
channel.on('postgres_changes', { event: '*' }, (payload) => {
  if (payload.eventType !== 'DELETE') {
    loadData();
  }
});
```

---

## 💡 CONSEILS GÉNÉRAUX

1. **Toujours tester avec des données NULL** lors de la création de politiques RLS
2. **Utiliser des fonctions RPC** pour les opérations complexes qui nécessitent de contourner RLS
3. **Passer l'ID utilisateur en paramètre** plutôt que de dépendre de `auth.uid()`
4. **Implémenter un tracking local** pour les suppressions dès le début
5. **Utiliser `finally`** systématiquement pour les états de chargement
6. **Filtrer les événements Realtime** selon le type d'événement
7. **Faire confiance au contexte applicatif** pour l'UI, laisser RLS gérer la sécurité
8. **Rendre les politiques permissives par défaut**, restreindre si nécessaire

---

*Document créé pour être réutilisable dans n'importe quel contexte de développement avec Supabase et React Native*
