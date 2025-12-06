# 🚀 Guide d'Optimisation du Backend

Ce guide explique comment optimiser le backend Supabase en se basant sur l'analyse des requêtes utilisateur.

## 📊 Analyse des Données

Les fichiers JSON dans `D:\jeu\analyse requette\` contiennent :
- **v_top_slow_queries_rows.json** : Les requêtes les plus lentes
- **v_top_frequent_queries_rows.json** : Les requêtes les plus fréquentes
- **v_tables_missing_indexes_rows.json** : Les tables manquant des index
- **v_app_specific_queries_rows.json** : Les requêtes spécifiques à l'application

## 🔍 Problèmes Identifiés

### 1. **dhikr_sessions** - Scans séquentiels élevés
- **Problème** : 925 scans séquentiels, seulement 9.58% d'utilisation d'index
- **Impact** : Requêtes lentes pour trouver les sessions actives
- **Solution** : Index composites pour les requêtes fréquentes

### 2. **Requêtes fréquentes non optimisées**
- `process_dhikr_session_clicks` : 3,835 appels
- Requêtes WAL : 81.02% des appels totaux (normal pour Supabase)
- `set_config` : 5.49% des appels (normal pour Supabase)

### 3. **Tables avec index manquants**
- `auth.schema_migrations` : 2.52% d'utilisation d'index
- `public.dhikr_sessions` : 9.58% d'utilisation d'index
- `realtime.schema_migrations` : 0% d'utilisation d'index

## 🛠️ Script d'Optimisation

### Fichier : `optimize-backend-from-analysis.sql`

Ce script crée des index optimisés pour :

1. **dhikr_sessions** :
   - Index composites pour sessions actives par utilisateur
   - Index pour sessions communautaires/personnelles
   - Index pour recherches par date

2. **khalwa_sessions** :
   - Index composites pour statistiques par utilisateur
   - Index pour recherches par nom divin, ambiance, respiration

3. **user_usage_tracking** :
   - Index composites pour sessions valides
   - Index pour sessions actives (end_time NULL)
   - Index pour nettoyage des sessions orphelines

4. **conversations (ayna_conversations)** :
   - Index composites pour conversations par utilisateur
   - Index pour recherches par date

5. **community_posts** :
   - Index composites pour posts par utilisateur
   - Index pour posts récents

6. **module_visits** :
   - Index composites pour visites par utilisateur et module

## 📋 Étapes d'Installation

### 1. Exécuter le Script d'Optimisation

1. Ouvrez l'éditeur SQL de Supabase
2. Copiez tout le contenu de `scripts/optimize-backend-from-analysis.sql`
3. Collez-le dans l'éditeur SQL
4. Cliquez sur "Run" ou appuyez sur `Ctrl+Enter`
5. Vérifiez les messages de confirmation dans les logs

### 2. Vérifier les Résultats

Après quelques jours d'utilisation, exécutez les requêtes de vérification à la fin du script pour voir :
- L'utilisation des nouveaux index
- La réduction des scans séquentiels
- L'amélioration des performances

## 📈 Métriques Attendues

Après optimisation, vous devriez voir :

- **dhikr_sessions** : 
  - Réduction des scans séquentiels de ~925 à <100
  - Augmentation de l'utilisation d'index de 9.58% à >80%

- **khalwa_sessions** :
  - Requêtes de statistiques plus rapides
  - Recherches par utilisateur optimisées

- **user_usage_tracking** :
  - Nettoyage des sessions orphelines plus rapide
  - Requêtes de sessions actives optimisées

## ⚠️ Notes Importantes

1. **Index partiels** : Certains index utilisent `WHERE` pour réduire leur taille et améliorer les performances
2. **Index composites** : Créés pour les requêtes fréquentes avec plusieurs conditions
3. **Statistiques** : Le script met à jour les statistiques pour que le planificateur utilise les nouveaux index
4. **Maintenance** : Surveillez l'utilisation des index après quelques jours et supprimez ceux qui ne sont pas utilisés

## 🔄 Mise à Jour Continue

Pour maintenir les optimisations :

1. **Régulièrement** (tous les mois) :
   - Exécutez les requêtes de vérification
   - Identifiez les index inutilisés
   - Supprimez les index inutilisés pour libérer de l'espace

2. **Après changements majeurs** :
   - Ré-exécutez `ANALYZE` sur les tables modifiées
   - Vérifiez que les index sont toujours pertinents

## 📝 Requêtes Utiles

### Voir tous les index d'une table
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'dhikr_sessions';
```

### Voir l'utilisation des index
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Voir les scans séquentiels
```sql
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  CASE 
    WHEN seq_scan + idx_scan > 0 
    THEN ROUND(100.0 * idx_scan / (seq_scan + idx_scan), 2)
    ELSE 0 
  END as pct_index_usage
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;
```

## 🐛 En Cas de Problème

Si les performances ne s'améliorent pas :

1. Vérifiez que les index ont bien été créés
2. Vérifiez que `ANALYZE` a été exécuté
3. Vérifiez les logs Supabase pour d'autres erreurs
4. Contactez l'administrateur de la base de données


