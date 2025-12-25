# 🔧 CORRECTIONS DES SCRIPTS DE TEST RLS

**Date :** 2025-01-27  
**Expert Sécurité :** Agent IA Sécurité AYNA

---

## ❌ ERREUR CORRIGÉE

### Problème
```
ERROR: 23502: null value in column "divine_name_arabic" of relation "khalwa_sessions" violates not-null constraint
```

### Cause
Le script de test `test-rls-policies.sql` essayait d'insérer des sessions Khalwa sans inclure toutes les colonnes NOT NULL requises :
- `divine_name_arabic` (TEXT NOT NULL)
- `divine_name_transliteration` (TEXT NOT NULL)
- `sound_ambiance` (TEXT NOT NULL)
- `breathing_type` (TEXT NOT NULL avec CHECK)

### Solution Appliquée

**Fichier corrigé :** `application/scripts/test-rls-policies.sql`

**Corrections :**
- ✅ Ajout de toutes les colonnes NOT NULL lors de l'insertion
- ✅ Utilisation de valeurs valides pour les tests :
  - `divine_name_id`: 'allah'
  - `divine_name_arabic`: 'الله'
  - `divine_name_transliteration`: 'Allah'
  - `sound_ambiance`: 'desert'
  - `breathing_type`: 'libre'
  - `duration_minutes`: 10.00

**Code corrigé :**
```sql
INSERT INTO khalwa_sessions (
  user_id, 
  intention, 
  divine_name_id, 
  divine_name_arabic,
  divine_name_transliteration,
  sound_ambiance,
  breathing_type,
  duration_minutes
)
VALUES (
  test_user_id, 
  'Test intention', 
  'allah',
  'الله',
  'Allah',
  'desert',
  'libre',
  10.00
);
```

---

## ✅ SCRIPT CORRIGÉ ET PRÊT

Le script de test peut maintenant être exécuté sans erreur dans Supabase SQL Editor.

**Valeurs valides pour les tests :**

### Divine Names (noms divins)
- `id`: 'allah', 'as-salam', 'ar-rahman', etc.
- `arabic`: 'الله', 'ٱلسَّلَام', 'الرَّحْمَن', etc.
- `transliteration`: 'Allah', 'As-Salām', 'Ar-Rahmān', etc.

### Sound Ambiances (ambiances sonores)
- 'desert'
- 'pluie'
- 'forest'
- 'feu-de-bois'
- 'neige-faina'

### Breathing Types (types de respiration)
- 'libre'
- '4-4'
- '3-6-9'

---

## 📝 PROCHAINES ÉTAPES

1. **Exécuter le script corrigé** dans Supabase SQL Editor
2. **Vérifier les résultats** dans les logs (tous doivent afficher ✅ PASS)
3. **Nettoyer les données de test** (optionnel, décommenter les lignes de nettoyage)

---

**Correction appliquée avec succès ! ✅**

*Dernière mise à jour : 2025-01-27*










