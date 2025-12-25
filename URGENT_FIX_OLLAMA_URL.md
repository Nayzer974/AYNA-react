# 🚨 CORRECTION URGENTE - URL OLLAMA

**Date:** 2025-01-27  
**Statut:** 🔴 **URGENT - À CORRIGER IMMÉDIATEMENT**

---

## 📋 PROBLÈME

Les logs montrent que l'Edge Function utilise toujours `https://api.ollama.com/api/chat` qui **n'existe pas**.

**Erreur:** `dns error: failed to lookup address information: No address associated with hostname`

---

## ✅ SOLUTION

### Option 1: Supprimer le secret OLLAMA_HOST (Recommandé)

Si vous avez configuré un secret `OLLAMA_HOST` avec la mauvaise valeur, supprimez-le :

```bash
# Vérifier les secrets actuels
supabase secrets list

# Si OLLAMA_HOST existe avec la mauvaise valeur, supprimez-le
supabase secrets unset OLLAMA_HOST
```

**Résultat:** L'Edge Function utilisera la valeur par défaut `https://ollama.com`.

---

### Option 2: Configurer OLLAMA_HOST avec la bonne valeur

```bash
# Configurer avec la bonne URL
supabase secrets set OLLAMA_HOST=https://ollama.com
```

---

### Option 3: Vérifier que le code est correctement déployé

Assurez-vous que le code de l'Edge Function a bien été mis à jour :

```bash
# Vérifier le code local
cat application/supabase/functions/llama-proxy-ollama-cloud/index.ts | grep "ollamaHost"

# Devrait afficher:
# const ollamaHost = Deno.env.get('OLLAMA_HOST') || 'https://ollama.com';
```

Si ce n'est pas le cas, le code n'a pas été correctement mis à jour.

---

## 🔧 ACTIONS IMMÉDIATES

### 1. Vérifier les secrets Supabase

```bash
supabase secrets list
```

**Vérifier:**
- Si `OLLAMA_HOST` existe, quelle est sa valeur ?
- Si la valeur est `https://api.ollama.com`, **supprimez-la** ou **corrigez-la**.

---

### 2. Redéployer l'Edge Function

```bash
# S'assurer d'être dans le bon répertoire
cd application

# Redéployer
supabase functions deploy llama-proxy-ollama-cloud
```

---

### 3. Vérifier les logs après déploiement

Les logs devraient maintenant afficher :

```
[llama-proxy-ollama-cloud] Appel Ollama: https://ollama.com/api/chat
```

**PAS:**
```
[llama-proxy-ollama-cloud] Appel Ollama: https://api.ollama.com/api/chat  ❌
```

---

## ⚠️ NOTE IMPORTANTE

**Le domaine `api.ollama.com` n'existe pas !**

- ❌ `https://api.ollama.com` → N'existe pas
- ✅ `https://ollama.com` → Existe et fonctionne

---

## 📚 RÉFÉRENCES

- **Ollama Cloud:** `https://ollama.com/api/chat` ✅
- **Ollama Local:** `http://localhost:11434/api/chat`
- **Ancienne URL (ne fonctionne pas):** `https://api.ollama.com` ❌

---

**Dernière mise à jour:** 2025-01-27




