# Installation : Correction du search_path pour les fonctions

## ⚠️ Problème

Supabase détecte des avertissements de sécurité concernant les fonctions qui n'ont pas de `search_path` défini. Cela peut créer des vulnérabilités de sécurité.

## ✅ Solution

Un script de correction a été créé : `fix-function-search-path.sql`

## 📋 Instructions

1. **Ouvrir le SQL Editor de Supabase**
   - Connectez-vous à votre projet Supabase
   - Dans la barre latérale gauche, cliquez sur "SQL Editor"

2. **Exécuter le script de correction**
   - Ouvrez le fichier `scripts/fix-function-search-path.sql`
   - Copiez tout le contenu
   - Collez-le dans le SQL Editor
   - Cliquez sur "Run" (ou "Exécuter")

3. **Vérifier les fonctions corrigées**
   - Les fonctions suivantes seront corrigées :
     - ✅ `update_khalwa_sessions_updated_at`
     - ✅ `get_khalwa_stats`
     - ✅ `update_dhikr_sessions_updated_at`
     - ✅ `is_user_admin`
     - ✅ `promote_to_admin`
     - ✅ `demote_from_admin`
     - ✅ `list_admins`
     - ✅ `promote_to_admin_by_id`
     - ✅ `delete_dhikr_session`

## ⚠️ Fonctions nécessitant une mise à jour manuelle

Certaines fonctions doivent être mises à jour dans leurs scripts respectifs :

### 1. `create_dhikr_session`
- **Fichier** : `create-dhikr-backend-mobile.sql` ou `add-private-sessions-support-step2.sql`
- **Action** : Remplacer `SET search_path = public, pg_temp` par `SET search_path = ''`
- **Important** : Préfixer toutes les références aux tables avec `public.` (ex: `public.dhikr_sessions`)

### 2. `join_dhikr_session`
- **Fichier** : `create-dhikr-backend-mobile.sql` ou `add-private-sessions-support-step3.sql`
- **Action** : Ajouter `SET search_path = ''` après `LANGUAGE plpgsql`
- **Important** : Préfixer toutes les références aux tables avec `public.`

### 3. `cleanup_completed_public_sessions`
- **Fichier** : `add-private-sessions-support-step4.sql` ou `add-private-sessions-support.sql`
- **Action** : Ajouter `SET search_path = ''` après `LANGUAGE plpgsql`
- **Important** : Préfixer toutes les références aux tables avec `public.`

### 4. `generate_audit_report`
- **Fichier** : Non trouvé dans les scripts (peut être créé par Supabase)
- **Action** : Si cette fonction existe, ajouter `SET search_path = ''` après `LANGUAGE plpgsql`

## 🔍 Vérification

Après avoir exécuté le script, vérifiez que les avertissements ont disparu dans le linter Supabase.

## 📝 Note importante

- `SET search_path = ''` est plus sécurisé que `SET search_path = public, pg_temp`
- Toutes les références aux tables doivent être préfixées avec le schéma (ex: `public.dhikr_sessions`)
- Les fonctions `SECURITY DEFINER` doivent toujours avoir `SET search_path = ''` pour éviter les attaques d'injection SQL

