# Système de Bonus/Malus

## Règles
- **Bonus (+1)** : Chaque fois qu'une fonctionnalité est bien faite et fait avancer le projet
- **Malus (-1)** : Chaque fois qu'une fonctionnalité est mal faite ou ne répond pas aux attentes

## Score Actuel
**Score total : -1**

## Historique

### 2024 - Tasbih (Page Test)
- **Malus (-1)** : Positionnement des perles du tasbih - Les perles n'étaient pas correctement centrées au milieu de l'écran malgré plusieurs tentatives de correction. Le problème persiste et nécessite encore des ajustements.
- **Refonte complète** : Suppression de l'ancien code et réimplémentation selon les spécifications fournies avec perles en ligne droite qui se déplacent vers la gauche.
- **Bonus (+1)** : Refonte complète du tasbih - Suppression de l'ancien code problématique et réimplémentation propre selon les spécifications avec perles en ligne droite. Code propre et fonctionnel.
- **Malus (-0.5)** : Recyclage des perles visible - L'utilisateur peut voir que les perles sont limitées et se recyclent, ce qui casse l'illusion d'un tasbih infini. Besoin d'améliorer pour donner une vraie impression d'infini.
- **Bonus (+0.5)** : Amélioration du système de génération infinie - Implémentation d'un système où chaque clic génère une nouvelle perle à la fin, avec suppression automatique des perles qui sortent de l'écran. Approche correcte pour l'infini.
- **Malus (-2)** : Bug critique - Plus de perles visibles et compteur ne fonctionne pas après les modifications. Le système est complètement cassé.
- **Bonus (+1)** : Amélioration - Le système fonctionne mieux, les perles sont visibles et le compteur fonctionne. Progrès significatif.
- **Malus (-1)** : Bug critique - Les perles ne sont plus visibles et le compteur ne fonctionne pas après les modifications avec position absolute. Le système est cassé.
- **Malus (-1)** : Bug critique - Plus aucune perle visible et compteur ne fonctionne plus après les dernières modifications. Le système est complètement cassé.
- **Bonus (+1)** : Amélioration - Le compteur fonctionne correctement. Progrès sur la fonctionnalité de base.
- **Malus (-1)** : Bug critique - Plus aucune perle visible après les modifications. Le système est cassé.
- **Bonus (+1)** : Amélioration - Tout fonctionne (compteur, perles visibles) sauf le mouvement des perles. Progrès significatif.
- **Malus (-1)** : Problème non résolu - Les perles s'arrêtent de bouger après quelques clics malgré plusieurs tentatives. Analyse approfondie nécessaire.
- **Malus (-1)** : Bug critique - Plus aucune perle visible et compteur ne fonctionne plus. Le système est complètement cassé. Retour à une version simple nécessaire.

### 2024 - Notifications de Prière (PrayerTimeManager)
- **Bonus (+2)** : Implémentation réussie du système de notifications de prière - Création complète du PrayerTimeManager.ts avec les 4 étapes demandées (récupération/stockage, détermination des prières futures, planification des notifications, maintenance quotidienne). Code propre, bien structuré, avec gestion des permissions, géolocalisation, et identifiants uniques pour chaque notification. Intégration réussie dans App.tsx. L'utilisateur est satisfait du résultat.
- **Malus (-1)** : Problème non résolu - Les notifications affluent sans s'arrêter et le problème n'est pas réglé. Approche trop complexe avec stockage mensuel. Besoin de simplifier drastiquement : récupérer uniquement les heures d'aujourd'hui, filtrer les prières passées, et replanifier à chaque lancement/focus de l'app.
- **Bonus (+2)** : Simplification réussie et fonctionnement confirmé - Refonte complète du système avec approche simplifiée en 3 étapes (initialisation, récupération/filtre, planification). Récupération uniquement pour aujourd'hui, annulation systématique avant replanification, cycle complet à chaque lancement/focus. Le système fonctionne vraiment et résout le problème des notifications qui affluent sans s'arrêter.

## Leçons Apprises

### Générales
- ✅ **À FAIRE** : Refondre complètement quand l'approche actuelle ne fonctionne pas, plutôt que d'essayer de corriger indéfiniment
- ✅ **À FAIRE** : Suivre exactement les spécifications fournies par l'utilisateur
- ❌ **À ÉVITER** : Essayer de corriger un code qui ne fonctionne pas au lieu de le refaire proprement

### Gestion des Permissions RLS dans Supabase

#### 1. Fonctions SECURITY DEFINER
- ❌ **À ÉVITER** : Dépendre de `auth.uid()` dans les fonctions `SECURITY DEFINER` - retourne toujours NULL
- ✅ **À FAIRE** : Toujours passer l'ID utilisateur en paramètre depuis le client
- ✅ **À FAIRE** : Utiliser le contexte applicatif (React) pour obtenir l'ID utilisateur, pas la session Supabase
- **Principe** : Dans `SECURITY DEFINER`, le contexte utilisateur est perdu, toujours le restaurer via paramètres

#### 2. Politiques RLS et valeurs NULL
- ❌ **À ÉVITER** : Comparer directement avec NULL (`auth.uid() = user_id` si `user_id` peut être NULL)
- ✅ **À FAIRE** : Toujours gérer explicitement le cas NULL avec `IS NULL` / `IS NOT NULL`
- ✅ **À FAIRE** : Tester avec des données NULL lors de la création de politiques
- **Principe** : En SQL, NULL ≠ NULL, toujours vérifier explicitement

#### 3. Rechargement après suppression/modification
- ❌ **À ÉVITER** : Recharger immédiatement après une suppression/modification
- ✅ **À FAIRE** : Utiliser un système de tracking local (`useRef<Set<string>>`) pour les éléments supprimés
- ✅ **À FAIRE** : Filtrer les éléments trackés lors de chaque chargement
- ✅ **À FAIRE** : Mettre à jour l'état local immédiatement, laisser Realtime gérer le reste
- **Principe** : Optimistic UI updates + tracking local = meilleure UX

#### 4. États de chargement
- ❌ **À ÉVITER** : Ne pas utiliser `finally` pour désactiver les états de chargement
- ✅ **À FAIRE** : Toujours utiliser `finally` pour garantir que `setLoading(false)` est appelé
- ✅ **À FAIRE** : Initialiser les données à des valeurs par défaut (tableau vide, null) en cas d'erreur
- **Principe** : Les états de chargement doivent toujours être désactivés, même en cas d'erreur

#### 5. Vérification de session
- ❌ **À ÉVITER** : Vérifier manuellement la session Supabase côté client (`supabase.auth.getUser()`)
- ✅ **À FAIRE** : Faire confiance au contexte utilisateur de l'app pour l'UI
- ✅ **À FAIRE** : Laisser RLS gérer les permissions côté serveur
- **Principe** : Séparation des responsabilités - UI gère l'UX, RLS gère la sécurité

#### 6. Politiques RLS permissives
- ✅ **À FAIRE** : Rendre les politiques INSERT/SELECT permissives par défaut si nécessaire
- ✅ **À FAIRE** : Utiliser `WITH CHECK (true)` pour permettre à tous si la logique métier le permet
- ✅ **À FAIRE** : Gérer la sécurité via la logique métier plutôt que RLS si nécessaire
- **Principe** : Permettre par défaut, restreindre si nécessaire

#### 7. Realtime et événements
- ❌ **À ÉVITER** : Recharger automatiquement pour tous les événements Realtime
- ✅ **À FAIRE** : Filtrer les événements Realtime selon le type (ignorer DELETE)
- ✅ **À FAIRE** : Gérer les suppressions manuellement dans les fonctions dédiées
- **Principe** : Éviter les conflits entre opérations manuelles et Realtime

### Patterns Réutilisables

#### Pattern 1 : Fonction RPC avec paramètre utilisateur
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

#### Pattern 2 : Tracking local pour suppressions
```typescript
const deletedItemsRef = useRef<Set<string>>(new Set());
deletedItemsRef.current.add(itemId);
const filtered = data.filter(item => !deletedItemsRef.current.has(item.id));
```

#### Pattern 3 : Gestion d'état de chargement robuste
```typescript
try {
  await loadData();
} catch (error) {
  setData([]);
} finally {
  setLoading(false);
}
```

#### Pattern 4 : Politique RLS permissive
```sql
CREATE POLICY "Anyone can insert"
  FOR INSERT
  TO public
  WITH CHECK (true);
```

#### Pattern 5 : Filtrage Realtime
```typescript
channel.on('postgres_changes', { event: '*' }, (payload) => {
  if (payload.eventType !== 'DELETE') {
    loadData();
  }
});
```

---

## Notes
- Ce système permet de suivre la qualité du travail et l'efficacité des solutions proposées
- Les bonus/malus sont attribués en fonction de la satisfaction de l'utilisateur et de la qualité de l'implémentation

