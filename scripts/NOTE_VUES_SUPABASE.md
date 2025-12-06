# Note sur les vues de monitoring Supabase

## ⚠️ Erreurs de linting

Si vous voyez des erreurs de linting concernant des vues avec `SECURITY DEFINER` comme :
- `v_top_frequent_queries`
- `v_unused_indexes`
- `v_app_specific_queries`
- `v_queries_low_cache_hit`
- `v_tables_missing_indexes`
- `v_top_slow_queries`

## 📝 Explication

Ces vues sont **créées automatiquement par Supabase** pour leur dashboard d'analyse de performance. Elles ne sont **pas utilisées par votre application** et ne sont **pas nécessaires** pour son fonctionnement.

## ✅ Options

### Option 1 : Ignorer (Recommandé)
Ces erreurs de linting sont **sans danger** et peuvent être ignorées. Elles n'affectent pas le fonctionnement de l'application.

### Option 2 : Supprimer les vues
Si vous voulez nettoyer ces erreurs, vous pouvez exécuter le script :
```sql
-- Voir scripts/remove-supabase-monitoring-views.sql
```

**Note importante** : Ces vues peuvent être **recréées automatiquement** par Supabase. Si elles réapparaissent après suppression, c'est normal.

## 🔍 Vérification

Pour vérifier si ces vues sont utilisées dans votre application :
```bash
# Rechercher dans le code
grep -r "v_top_frequent_queries" .
grep -r "v_unused_indexes" .
# etc.
```

Si aucune correspondance n'est trouvée, ces vues ne sont pas utilisées et peuvent être supprimées en toute sécurité.

