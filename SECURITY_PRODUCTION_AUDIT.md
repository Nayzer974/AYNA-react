# 🔒 AUDIT DE SÉCURITÉ PRODUCTION - AYNA

**Date:** 2025-01-27  
**Version:** 1.0  
**Statut:** 🔴 **CRITIQUE - CORRECTIONS NÉCESSAIRES**

---

## 📋 RÉSUMÉ EXÉCUTIF

Audit complet de sécurité pour la production (Apple App Store + Google Play).  
**Résultat:** 🔴 **CRITIQUE** - Plusieurs vulnérabilités majeures identifiées.

---

## 🔴 VULNÉRABILITÉS CRITIQUES

### 1. 🔴 CLÉS SECRÈTES DANS LE MOBILE

**Statut:** 🔴 **CRITIQUE**

**Clés identifiées dans le bundle mobile:**

1. **`EXPO_PUBLIC_OLLAMA_API_KEY`**
   - **Fichier:** `app.config.js` ligne 93
   - **Fichier:** `src/config.ts` ligne 18
   - **Risque:** Clé API Ollama exposée dans le bundle

2. **`EXPO_PUBLIC_OPENROUTER_API_KEY`**
   - **Fichier:** `app.config.js` ligne 89
   - **Fichier:** `src/config.ts` ligne 14
   - **Risque:** Clé API OpenRouter exposée dans le bundle

3. **`EXPO_PUBLIC_AYNA_API_PROXY`**
   - **Fichier:** `app.config.js` ligne 88
   - **Fichier:** `src/config.ts` ligne 13
   - **Risque:** Clé API AYNA exposée dans le bundle

4. **`EXPO_PUBLIC_QURAN_CLIENT_SECRET`**
   - **Fichier:** `setup-env.js` ligne 50 - **HARDCODÉ avec valeur réelle !**
   - **Fichier:** `src/config.ts` ligne 27 - **HARDCODÉ avec valeur par défaut !**
   - **Risque:** 🔴 **CRITIQUE** - Secret OAuth hardcodé dans le code

**Action requise:** ⚠️ **SUPPRIMER IMMÉDIATEMENT** toutes ces clés du mobile et les déplacer vers Supabase Edge Functions.

---

### 2. 🔴 HTTP AU LIEU DE HTTPS

**Statut:** 🔴 **CRITIQUE**

**Problèmes identifiés:**

1. **`alquranCloudBaseUrl`**
   - **Fichier:** `src/config.ts` ligne 29
   - **Valeur:** `http://api.alquran.cloud/v1` ❌
   - **Risque:** Communication non chiffrée

2. **`setup-env.js`**
   - **Fichier:** `setup-env.js` ligne 56
   - **Valeur:** `http://api.alquran.cloud/v1` ❌

**Action requise:** ⚠️ **FORCER HTTPS** partout, supprimer toute référence HTTP.

---

### 3. ⚠️ ARCHITECTURE BACKEND INCOMPLÈTE

**Statut:** ⚠️ **IMPORTANT**

**Problèmes identifiés:**

1. **Edge Function Ollama manquante**
   - Le service `ayna.ts` utilise déjà Supabase Edge Function ✅
   - Mais la fonction `llama-proxy-ollama-cloud` n'existe pas dans `supabase/functions/` ❌

2. **Pas de proxy pour OpenRouter**
   - `openrouterApiKey` est exposée dans le mobile ❌
   - Pas de Edge Function pour OpenRouter ❌

3. **Pas de proxy pour Quran OAuth**
   - `quranClientSecret` est hardcodé ❌
   - Pas de Edge Function pour Quran OAuth ❌

**Action requise:** ⚠️ Créer toutes les Edge Functions manquantes.

---

## 📊 STATISTIQUES

- **Clés secrètes dans mobile:** 4
- **Secrets hardcodés:** 2
- **HTTP au lieu de HTTPS:** 2
- **Edge Functions manquantes:** 3+
- **Fichiers à modifier:** 5+

---

## ✅ PLAN DE CORRECTION

### Phase 1: Suppression des clés secrètes

1. ✅ Supprimer `EXPO_PUBLIC_OLLAMA_API_KEY` de `app.config.js` et `config.ts`
2. ✅ Supprimer `EXPO_PUBLIC_OPENROUTER_API_KEY` de `app.config.js` et `config.ts`
3. ✅ Supprimer `EXPO_PUBLIC_AYNA_API_PROXY` de `app.config.js` et `config.ts`
4. ✅ Supprimer `EXPO_PUBLIC_QURAN_CLIENT_SECRET` de `setup-env.js` et `config.ts`
5. ✅ Supprimer les valeurs hardcodées de `config.ts`

### Phase 2: Forcer HTTPS

1. ✅ Remplacer `http://api.alquran.cloud/v1` par `https://api.alquran.cloud/v1`
2. ✅ Vérifier toutes les URLs dans le code
3. ✅ Ajouter validation HTTPS dans le code

### Phase 3: Créer Edge Functions

1. ✅ Créer `llama-proxy-ollama-cloud` (existe déjà dans le code mais pas déployée)
2. ✅ Créer `openrouter-proxy` pour OpenRouter
3. ✅ Créer `quran-oauth-proxy` pour Quran OAuth

### Phase 4: Refactorer le mobile

1. ✅ Modifier `ayna.ts` pour ne plus utiliser de clés
2. ✅ Modifier tous les services pour utiliser les Edge Functions
3. ✅ Supprimer toutes les références aux clés secrètes

---

## 📚 DOCUMENTS À CRÉER

1. ✅ `SECURITY_PRODUCTION_AUDIT.md` (ce document)
2. ⏳ `ARCHITECTURE_BACKEND_SECURE.md` - Architecture backend sécurisée
3. ⏳ `EDGE_FUNCTIONS_GUIDE.md` - Guide des Edge Functions
4. ⏳ `MIGRATION_SECRETS.md` - Guide de migration des secrets
5. ⏳ `SECURITY_PRODUCTION_FINAL.md` - Rapport final

---

## ✅ CONCLUSION

**Statut global:** 🔴 **CRITIQUE**

L'application contient **plusieurs vulnérabilités critiques** qui doivent être corrigées **avant** la soumission aux stores :
- 🔴 Clés secrètes dans le bundle mobile
- 🔴 Secrets hardcodés
- 🔴 HTTP au lieu de HTTPS

**Action immédiate requise:** Corriger toutes les vulnérabilités critiques avant la production.

---

**Dernière mise à jour:** 2025-01-27




