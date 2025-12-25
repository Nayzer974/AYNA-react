# 🔐 MIGRATION DES SECRETS DU .ENV VERS SUPABASE

**Date:** 2025-01-27  
**Version:** 1.0  
**Statut:** ⚠️ **ACTION REQUISE**

---

## 📋 PROBLÈME

Les variables `EXPO_PUBLIC_*` dans le fichier `.env` sont **incluses dans le bundle mobile** (APK/AAB/IPA), même si le fichier `.env` est dans `.gitignore`.

**Risque:** 🔴 **CRITIQUE** - Toutes les clés API avec préfixe `EXPO_PUBLIC_` sont exposées dans le bundle.

**⚠️ IMPORTANT:** Les variables **SANS** préfixe `EXPO_PUBLIC_` (comme `OLLAMA_API_KEY`, `BREVO_API_KEY`) **NE SONT PAS** dans le bundle mobile. C'est correct !

---

## ✅ SOLUTION

Déplacer toutes les clés secrètes vers **Supabase Secrets** et utiliser des **Supabase Edge Functions** comme proxy.

---

## 🔍 CLÉS À MIGRER

### 1. 🔴 `EXPO_PUBLIC_OLLAMA_API_KEY`

**Statut:** ⚠️ **À SUPPRIMER du .env**

**Action:**
1. ✅ Edge Function créée: `llama-proxy-ollama-cloud`
2. ⏳ Configurer le secret Supabase:
   ```bash
   supabase secrets set OLLAMA_API_KEY=votre_clé_ollama
   ```
3. ⏳ Supprimer du `.env`:
   ```bash
   # Supprimer cette ligne du .env
   EXPO_PUBLIC_OLLAMA_API_KEY=...
   ```

---

### 2. 🔴 `EXPO_PUBLIC_OPENROUTER_API_KEY`

**Statut:** ⚠️ **À SUPPRIMER du .env**

**Action:**
1. ⏳ Créer Edge Function `openrouter-proxy` (si utilisé)
2. ⏳ Configurer le secret Supabase:
   ```bash
   supabase secrets set OPENROUTER_API_KEY=votre_clé_openrouter
   ```
3. ⏳ Supprimer du `.env`:
   ```bash
   # Supprimer cette ligne du .env
   EXPO_PUBLIC_OPENROUTER_API_KEY=...
   ```

---

### 3. 🔴 `EXPO_PUBLIC_AYNA_API_PROXY`

**Statut:** ⚠️ **À SUPPRIMER du .env**

**Action:**
1. ⏳ Créer Edge Function `ayna-api-proxy` (si utilisé)
2. ⏳ Configurer le secret Supabase:
   ```bash
   supabase secrets set AYNA_API_KEY=votre_clé_ayna
   ```
3. ⏳ Supprimer du `.env`:
   ```bash
   # Supprimer cette ligne du .env
   EXPO_PUBLIC_AYNA_API_PROXY=...
   ```

---

### 4. 🔴 `EXPO_PUBLIC_QURAN_CLIENT_SECRET`

**Statut:** ⚠️ **À SUPPRIMER du .env**

**Action:**
1. ⏳ Créer Edge Function `quran-oauth-proxy` (si utilisé)
2. ⏳ Configurer le secret Supabase:
   ```bash
   supabase secrets set QURAN_CLIENT_SECRET=votre_secret_oauth
   ```
3. ⏳ Supprimer du `.env`:
   ```bash
   # Supprimer cette ligne du .env
   EXPO_PUBLIC_QURAN_CLIENT_SECRET=...
   ```

---

## 📝 VARIABLES AUTORISÉES DANS .ENV

Ces variables **peuvent rester** dans le `.env` car elles ne sont **pas des secrets** :

✅ `EXPO_PUBLIC_SUPABASE_URL` - URL publique (pas un secret)  
✅ `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Clé anon (pas un secret, conçue pour être publique)  
✅ `EXPO_PUBLIC_USE_SUPABASE` - Flag booléen (pas un secret)  
✅ `EXPO_PUBLIC_AYNA_IFRAME_URL` - URL publique (pas un secret)  
✅ `EXPO_PUBLIC_OPENROUTER_SITE_URL` - URL publique (pas un secret)  
✅ `EXPO_PUBLIC_OPENROUTER_SITE_NAME` - Nom public (pas un secret)  
✅ `EXPO_PUBLIC_OPENROUTER_MODEL` - Nom du modèle (pas un secret)  
✅ `EXPO_PUBLIC_ALADHAN_BASE_URL` - URL publique (pas un secret)  
✅ `EXPO_PUBLIC_PUTER_BASE_URL` - URL publique (pas un secret)  
✅ `EXPO_PUBLIC_ALQURAN_API_BASE` - URL publique (pas un secret)  
✅ `EXPO_PUBLIC_QURAN_API_BASE` - URL publique (pas un secret)  
✅ `EXPO_PUBLIC_QURAN_OAUTH_URL` - URL publique (pas un secret)  
✅ `EXPO_PUBLIC_QURAN_CLIENT_ID` - Client ID OAuth (pas un secret, conçu pour être public)  
✅ `EXPO_PUBLIC_DUA_DHIKR_BASE` - URL publique (pas un secret)  
✅ `EXPO_PUBLIC_ALQURAN_CLOUD_BASE` - URL publique (pas un secret)  
✅ `EXPO_PUBLIC_USE_BREVO` - Flag booléen (pas un secret)  

---

## 🔧 ÉTAPES DE MIGRATION

### Étape 1: Identifier les clés dans .env

Ouvrez votre fichier `.env` et identifiez toutes les lignes contenant :
- `EXPO_PUBLIC_*_API_KEY`
- `EXPO_PUBLIC_*_SECRET`
- `EXPO_PUBLIC_*_PROXY`

---

### Étape 2: Configurer Supabase Secrets

Pour chaque clé identifiée, configurez le secret Supabase :

```bash
# Exemple pour Ollama
supabase secrets set OLLAMA_API_KEY=votre_clé_ollama

# Exemple pour OpenRouter
supabase secrets set OPENROUTER_API_KEY=votre_clé_openrouter

# Exemple pour AYNA
supabase secrets set AYNA_API_KEY=votre_clé_ayna

# Exemple pour Quran OAuth
supabase secrets set QURAN_CLIENT_SECRET=votre_secret_oauth
```

---

### Étape 3: Déployer les Edge Functions

```bash
# Déployer Ollama proxy (déjà créé)
supabase functions deploy llama-proxy-ollama-cloud

# Créer et déployer OpenRouter proxy (si nécessaire)
# Créer et déployer AYNA API proxy (si nécessaire)
# Créer et déployer Quran OAuth proxy (si nécessaire)
```

---

### Étape 4: Supprimer les clés du .env

Supprimez toutes les lignes contenant des clés secrètes du fichier `.env` :

```bash
# Supprimer ces lignes du .env
EXPO_PUBLIC_OLLAMA_API_KEY=...
EXPO_PUBLIC_OPENROUTER_API_KEY=...
EXPO_PUBLIC_AYNA_API_PROXY=...
EXPO_PUBLIC_QURAN_CLIENT_SECRET=...
```

---

### Étape 5: Vérifier le code mobile

Vérifiez que le code mobile n'utilise plus ces clés :

```bash
# Rechercher les références
grep -r "EXPO_PUBLIC_OLLAMA_API_KEY" application/src/
grep -r "EXPO_PUBLIC_OPENROUTER_API_KEY" application/src/
grep -r "EXPO_PUBLIC_AYNA_API_PROXY" application/src/
grep -r "EXPO_PUBLIC_QURAN_CLIENT_SECRET" application/src/
```

**Résultat attendu:** Aucune référence trouvée.

---

## ✅ VÉRIFICATION

### Checklist

- [ ] Toutes les clés secrètes supprimées du `.env`
- [ ] Tous les secrets configurés dans Supabase
- [ ] Toutes les Edge Functions déployées
- [ ] Code mobile ne référence plus les clés
- [ ] Tests fonctionnels passent

---

## 📚 RÉFÉRENCES

### Documents créés
- `SECURITY_PRODUCTION_AUDIT.md` - Audit initial
- `SECURITY_PRODUCTION_FIXES.md` - Corrections appliquées
- `ARCHITECTURE_BACKEND_SECURE.md` - Architecture complète
- `SECURITY_PRODUCTION_FINAL.md` - Rapport final

### Edge Functions
- `supabase/functions/llama-proxy-ollama-cloud/` - ✅ Créée

---

## ⚠️ IMPORTANT

**Ne jamais commiter le fichier `.env`** - Il est déjà dans `.gitignore`, mais vérifiez qu'il n'est pas dans le dépôt Git :

```bash
# Vérifier si .env est dans Git
git ls-files | grep .env

# Si oui, le supprimer de Git (mais pas du disque)
git rm --cached .env
```

---

## ✅ CONCLUSION

**Action requise:** Migrer toutes les clés secrètes du `.env` vers Supabase Secrets.

**Résultat attendu:** Aucune clé secrète dans le bundle mobile.

---

**Dernière mise à jour:** 2025-01-27

