# 🔧 CORRECTION ERREUR DNS OLLAMA

**Date:** 2025-01-27  
**Version:** 1.0  
**Statut:** ✅ **CORRIGÉ**

---

## 📋 PROBLÈME

**Erreur:** `dns error: failed to lookup address information: No address associated with hostname`

**Cause:** L'URL `https://api.ollama.com` n'existe pas !

---

## ✅ CORRECTION APPLIQUÉE

### 1. URL corrigée dans l'Edge Function

**Avant:**
```typescript
const ollamaHost = Deno.env.get('OLLAMA_HOST') || 'https://api.ollama.com';
const ollamaUrl = `${normalizedHost}/v1/chat`;
```

**Après:**
```typescript
const ollamaHost = Deno.env.get('OLLAMA_HOST') || 'https://ollama.com';
const ollamaUrl = `${normalizedHost}/api/chat`;
```

**Changements:**
- ✅ URL par défaut: `https://ollama.com` (au lieu de `https://api.ollama.com`)
- ✅ Endpoint: `/api/chat` (au lieu de `/v1/chat`)

---

## 🔧 ACTIONS REQUISES

### 1. Redéployer l'Edge Function

```bash
supabase functions deploy llama-proxy-ollama-cloud
```

---

### 2. (Optionnel) Configurer OLLAMA_HOST

Si vous utilisez une URL Ollama différente :

```bash
supabase secrets set OLLAMA_HOST=https://ollama.com
```

**Note:** Par défaut, l'Edge Function utilise maintenant `https://ollama.com`, donc cette étape est optionnelle.

---

## ✅ VÉRIFICATION

Après le redéploiement, les logs Supabase devraient afficher :

```
[llama-proxy-ollama-cloud] Appel Ollama: https://ollama.com/api/chat
```

Au lieu de :

```
[llama-proxy-ollama-cloud] Appel Ollama: https://api.ollama.com/v1/chat
```

---

## 📚 RÉFÉRENCES

- **Ollama Cloud:** `https://ollama.com/api/chat` ✅
- **Ollama Local:** `http://localhost:11434/api/chat`
- **Ancienne URL (ne fonctionne pas):** `https://api.ollama.com/v1/chat` ❌

---

**Dernière mise à jour:** 2025-01-27




