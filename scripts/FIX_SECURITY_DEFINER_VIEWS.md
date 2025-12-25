# 🔒 Correction des vues SECURITY DEFINER

## Problème

Supabase détecte des vues définies avec la propriété `SECURITY DEFINER`. Ces vues appliquent les permissions et politiques RLS (Row Level Security) du créateur de la vue plutôt que de l'utilisateur qui interroge.

## Vues concernées

Les vues suivantes sont des vues système de monitoring Supabase :

1. `v_top_frequent_queries` - Requêtes les plus fréquentes
2. `v_unused_indexes` - Index non utilisés
3. `v_app_specific_queries` - Requêtes spécifiques à l'application
4. `v_queries_low_cache_hit` - Requêtes avec faible taux de cache
5. `v_tables_missing_indexes` - Tables manquant d'index
6. `v_top_slow_queries` - Requêtes les plus lentes

## ⚠️ Important

Ces vues sont créées automatiquement par Supabase pour le monitoring interne. Elles ne sont **pas utilisées par votre application** et peuvent être supprimées en toute sécurité.

## Solution recommandée : Supprimer les vues

### Étape 1 : Ouvrir Supabase SQL Editor

1. Allez sur https://supabase.com
2. Connectez-vous à votre projet
3. Cliquez sur **SQL Editor** dans le menu de gauche

### Étape 2 : Exécuter le script

**Option simple (recommandée)** :
- Exécutez : `scripts/fix-security-definer-views-simple.sql`
- Ce script supprime simplement les vues

**Option complète** :
- Exécutez : `scripts/fix-security-definer-views.sql`
- Ce script tente de recréer les vues sans SECURITY DEFINER
- ⚠️ Peut nécessiter des permissions spéciales pour `pg_stat_statements`

### Étape 3 : Vérification

Après avoir exécuté le script, vérifiez que les erreurs ont disparu dans le **Supabase Linter** (Database → Linter).

## ⚠️ Note importante

- Ces vues peuvent être **recréées automatiquement** par Supabase lors de mises à jour
- Si les erreurs reviennent, réexécutez simplement le script de suppression
- Ces vues ne sont utilisées que par le dashboard Supabase pour l'analyse de performance
- Votre application n'en a pas besoin pour fonctionner

## Alternative : Ignorer les erreurs

Si vous préférez garder ces vues pour le monitoring Supabase, vous pouvez simplement **ignorer ces erreurs** dans le linter. Elles n'affectent pas la sécurité de votre application car :

- Ces vues sont en lecture seule
- Elles n'exposent que des statistiques de performance
- Elles ne permettent pas de modifier les données

