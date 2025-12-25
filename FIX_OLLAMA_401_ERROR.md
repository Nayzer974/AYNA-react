# 🔧 CORRECTION ERREUR 401 OLLAMA

**Date:** 2025-01-27  
**Version:** 1.0  
**Statut:** ✅ **GUIDE DE CORRECTION**

---

## 📋 PROBLÈME

**Erreur:** `[llama-proxy-ollama-cloud] Erreur Ollama: 401 unauthorized`

**Cause:** La clé API Ollama est soit invalide, soit expirée, soit mal configurée dans Supabase Secrets.

---

## ✅ DIAGNOSTIC

### 1. Vérifier que la clé API est configurée

```bash
# Lister tous les secrets
supabase secrets list

# Vérifier que OLLAMA_API_KEY existe
```

**Votre clé devrait être:** `20f0b0c8dec5448d89009314dd9ece54.Ksm70X_NMKEb4hy7_LlSORWa`

---

### 2. Vérifier le format de la clé

**Format attendu:** La clé Ollama Cloud devrait ressembler à :
- `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Si votre clé est différente, vérifiez:**
- Qu'elle n'a pas expiré
- Qu'elle est active dans votre compte Ollama Cloud
- Qu'elle n'a pas été révoquée

---

## 🔧 SOLUTIONS

### Solution 1: Reconfigurer la clé API

```bash
# Supprimer l'ancienne clé (si elle existe)
supabase secrets unset OLLAMA_API_KEY

# Configurer la nouvelle clé
supabase secrets set OLLAMA_API_KEY=20f0b0c8dec5448d89009314dd9ece54.Ksm70X_NMKEb4hy7_LlSORWa
```

---

### Solution 2: Vérifier que la clé est correcte

1. Allez sur votre compte Ollama Cloud
2. Vérifiez que la clé API est active
3. Si nécessaire, générez une nouvelle clé
4. Configurez-la dans Supabase Secrets

---

### Solution 3: Vérifier le format d'authentification

L'Edge Function utilise maintenant le format Bearer token standard :
```typescript
headers['Authorization'] = `Bearer ${ollamaApiKey}`;
```

Si Ollama Cloud nécessite un format différent, il faudra peut-être ajuster le code.

---

## 🔍 VÉRIFICATION

### 1. Vérifier les logs Supabase

Après avoir reconfiguré la clé, vérifiez les logs :
1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Edge Functions** > **llama-proxy-ollama-cloud** > **Logs**

**Résultat attendu:**
- ✅ `[llama-proxy-ollama-cloud] Réponse Ollama reçue` (au lieu de 401)

---

### 2. Tester manuellement

```bash
   curl -X POST https://ollama.com/api/chat \
     -H "Authorization: Bearer 20f0b0c8dec5448d89009314dd9ece54.Ksm70X_NMKEb4hy7_LlSORWa" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": false
  }'
```

**Si cela retourne 401, la clé est invalide.**

---

## ⚠️ NOTES IMPORTANTES

1. **La clé API doit être active** dans votre compte Ollama Cloud
2. **La clé ne doit pas avoir expiré**
3. **La clé doit être correctement copiée** (sans espaces, sans retours à la ligne)
4. **Après avoir configuré la clé, redéployez l'Edge Function** si nécessaire

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. Message d'erreur amélioré

**Fichier modifié:** `application/supabase/functions/llama-proxy-ollama-cloud/index.ts`

**Changement:**
- ✅ Message d'erreur spécifique pour 401 avec instructions

---

### 2. Logging amélioré

**Changement:**
- ✅ Log des headers utilisés (sans la clé API) pour diagnostic

---

## 📚 RÉFÉRENCES

- **Ollama Cloud API:** [https://ollama.com](https://ollama.com)
- **Format d'authentification:** Bearer token standard
- **Votre clé API:** `20f0b0c8dec5448d89009314dd9ece54.Ksm70X_NMKEb4hy7_LlSORWa`

---

**Dernière mise à jour:** 2025-01-27

