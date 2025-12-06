# 🔧 Guide de Correction des Erreurs RLS et Tables Manquantes

Ce guide explique comment corriger les erreurs suivantes :

1. **Erreur RLS pour `khalwa_sessions`** : `new row violates row-level security policy for table "khalwa_sessions"`
2. **Table `module_visits` manquante** : `Could not find the table 'public.module_visits' in the schema cache`

## 📋 Scripts Disponibles

### 1. `fix-all-rls-and-missing-tables.sql` ⭐ **RECOMMANDÉ**

Script complet qui corrige tous les problèmes en une seule fois :
- Corrige les politiques RLS pour `khalwa_sessions` avec le format optimisé
- Crée la table `module_visits` si elle n'existe pas

**Utilisation :**
```sql
-- Copiez et exécutez tout le contenu du fichier dans l'éditeur SQL de Supabase
```

### 2. `fix-khalwa-sessions-rls.sql`

Script dédié uniquement à la correction des politiques RLS pour `khalwa_sessions`.

### 3. `create-module-visits-table.sql`

Script pour créer uniquement la table `module_visits`.

## 🚀 Étapes de Correction

### Option 1 : Script Complet (Recommandé)

1. Ouvrez l'éditeur SQL de Supabase
2. Copiez tout le contenu de `scripts/fix-all-rls-and-missing-tables.sql`
3. Collez-le dans l'éditeur SQL
4. Cliquez sur "Run" ou appuyez sur `Ctrl+Enter`
5. Vérifiez les messages de confirmation dans les logs

### Option 2 : Scripts Individuels

Si vous préférez exécuter les scripts séparément :

1. **D'abord, corrigez les politiques RLS :**
   - Exécutez `scripts/fix-khalwa-sessions-rls.sql`

2. **Ensuite, créez la table manquante :**
   - Exécutez `scripts/create-module-visits-table.sql`

## 🔍 Vérification

Après avoir exécuté les scripts, vous devriez voir ces messages :

```
✅ Politiques RLS corrigées pour khalwa_sessions
✅ Format optimisé utilisé : (select auth.uid())
✅ Table module_visits créée/vérifiée
✅ Toutes les tables sont configurées avec RLS
```

## ⚠️ Notes Importantes

1. **Format optimisé** : Les scripts utilisent `(select auth.uid())` au lieu de `auth.uid()` directement. Cela améliore les performances et la fiabilité des politiques RLS.

2. **Schéma public** : Toutes les tables sont explicitement référencées avec `public.` pour éviter toute ambiguïté.

3. **Table `module_visits`** : Si vous n'utilisez pas cette table dans votre application, vous pouvez l'ignorer. Elle est créée uniquement pour éviter l'erreur `PGRST205`.

## 🐛 En Cas de Problème

Si les erreurs persistent après avoir exécuté les scripts :

1. Vérifiez que l'utilisateur est bien authentifié
2. Vérifiez que la table `khalwa_sessions` existe bien
3. Vérifiez les logs Supabase pour d'autres erreurs
4. Contactez l'administrateur de la base de données

## 📝 Structure des Politiques RLS Corrigées

Les nouvelles politiques RLS utilisent ce format :

```sql
CREATE POLICY "Users can insert their own khalwa sessions"
  ON public.khalwa_sessions
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);
```

Au lieu de :

```sql
CREATE POLICY "Users can insert their own khalwa sessions"
  ON khalwa_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

Ce changement améliore :
- ✅ Les performances (une seule évaluation de `auth.uid()`)
- ✅ La fiabilité (évite les problèmes de cache)
- ✅ La clarté (schéma explicite)


